import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GameMode, GameProgress, CityProgressData } from '../types/game';
import { db, handleFirestoreError, OperationType } from './firebase';
import { StorageService, createInitialCityProgress } from './storage';

export class CloudSyncService {
  // Save progress for a specific mode to Firestore
  public static async saveProgressToCloud(userId: string, progress: GameProgress): Promise<void> {
    if (!userId) return;
    const path = `users/${userId}/progress/${progress.mode}`;
    try {
      const progressRef = doc(db, 'users', userId, 'progress', progress.mode);

      // Sanitize plain object for Firestore (ensure no undefined or irregular prototypes)
      const sanitizedCityProgress: Record<string, CityProgressData> = {};
      if (progress.cityProgress && typeof progress.cityProgress === 'object') {
        Object.entries(progress.cityProgress).forEach(([cityId, data]) => {
          sanitizedCityProgress[cityId] = {
            completedRounds: Array.isArray(data?.completedRounds) ? data.completedRounds : [],
            unlockedLocations: Array.isArray(data?.unlockedLocations) ? data.unlockedLocations : [],
            claimedRewards: Array.isArray(data?.claimedRewards) ? data.claimedRewards : [],
            roundScores: typeof data?.roundScores === 'object' && data.roundScores !== null ? data.roundScores : {},
          };
        });
      }

      const payload = {
        userId,
        mode: progress.mode,
        coins: typeof progress.coins === 'number' ? progress.coins : 100,
        currentCityId: typeof progress.currentCityId === 'number' ? progress.currentCityId : 1,
        unlockedCityIds: Array.isArray(progress.unlockedCityIds) ? progress.unlockedCityIds : [1],
        completedCityIds: Array.isArray(progress.completedCityIds) ? progress.completedCityIds : [],
        cityProgress: sanitizedCityProgress,
        totalCorrectAnswers: typeof progress.totalCorrectAnswers === 'number' ? progress.totalCorrectAnswers : 0,
        totalQuestionsAnswered: typeof progress.totalQuestionsAnswered === 'number' ? progress.totalQuestionsAnswered : 0,
        lastPlayedAt: progress.lastPlayedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(progressRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Load progress for a specific mode from Firestore
  public static async loadProgressFromCloud(userId: string, mode: GameMode): Promise<GameProgress | null> {
    if (!userId) return null;
    const path = `users/${userId}/progress/${mode}`;
    try {
      const progressRef = doc(db, 'users', userId, 'progress', mode);
      const snapshot = await getDoc(progressRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      const rawCityId = Number(data.currentCityId);
      const currentCityId = !isNaN(rawCityId) && rawCityId >= 1 && rawCityId <= 50 ? rawCityId : 1;

      const rawUnlocked = Array.isArray(data.unlockedCityIds) ? data.unlockedCityIds : [1];
      const unlockedCityIds = Array.from(
        new Set(
          rawUnlocked
            .map(Number)
            .filter((id) => !isNaN(id) && id >= 1 && id <= 50)
        )
      );
      if (!unlockedCityIds.includes(1)) unlockedCityIds.unshift(1);

      const rawCompleted = Array.isArray(data.completedCityIds) ? data.completedCityIds : [];
      const completedCityIds = Array.from(
        new Set(
          rawCompleted
            .map(Number)
            .filter((id) => !isNaN(id) && id >= 1 && id <= 50)
        )
      );

      const rawCityProgress = typeof data.cityProgress === 'object' && data.cityProgress !== null ? data.cityProgress : {};

      const sanitizedCityProgress: Record<number, CityProgressData> = {};
      for (const [key, val] of Object.entries(rawCityProgress)) {
        const numKey = Number(key);
        if (isNaN(numKey) || numKey < 1 || numKey > 50) continue;
        const cp = typeof val === 'object' && val !== null ? (val as Partial<CityProgressData>) : {};
        sanitizedCityProgress[numKey] = {
          completedRounds: Array.isArray(cp.completedRounds)
            ? cp.completedRounds.map(Number).filter((r) => !isNaN(r) && r >= 1 && r <= 10)
            : [],
          unlockedLocations: Array.isArray(cp.unlockedLocations)
            ? cp.unlockedLocations.map(Number).filter((r) => !isNaN(r) && r >= 1 && r <= 10)
            : [],
          claimedRewards: Array.isArray(cp.claimedRewards)
            ? cp.claimedRewards.map(Number).filter((r) => !isNaN(r) && r >= 1 && r <= 10)
            : [],
          roundScores: typeof cp.roundScores === 'object' && cp.roundScores !== null ? cp.roundScores : {},
        };
      }

      if (!sanitizedCityProgress[currentCityId]) {
        sanitizedCityProgress[currentCityId] = createInitialCityProgress();
      }

      const rawCoins = Number(data.coins);
      const coins = !isNaN(rawCoins) && rawCoins >= 0 ? rawCoins : 100;

      return {
        mode,
        coins,
        currentCityId,
        unlockedCityIds,
        completedCityIds,
        cityProgress: sanitizedCityProgress,
        totalCorrectAnswers: typeof data.totalCorrectAnswers === 'number' && !isNaN(data.totalCorrectAnswers) ? Math.max(0, data.totalCorrectAnswers) : 0,
        totalQuestionsAnswered: typeof data.totalQuestionsAnswered === 'number' && !isNaN(data.totalQuestionsAnswered) ? Math.max(0, data.totalQuestionsAnswered) : 0,
        lastPlayedAt: data.lastPlayedAt || new Date().toISOString(),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  }

  // Merge local progress with cloud progress safely (preserves highest score, union of rounds & cities)
  public static mergeProgress(localProg: GameProgress, cloudProg: GameProgress): GameProgress {
    const mode = localProg.mode;
    const unlockedCityIds = Array.from(new Set([...localProg.unlockedCityIds, ...cloudProg.unlockedCityIds])).sort((a, b) => a - b);
    const completedCityIds = Array.from(new Set([...localProg.completedCityIds, ...cloudProg.completedCityIds])).sort((a, b) => a - b);

    // Merge cityProgress
    const mergedCityProgress: Record<number, CityProgressData> = {};
    const allCityIds = new Set([
      ...Object.keys(localProg.cityProgress || {}).map(Number),
      ...Object.keys(cloudProg.cityProgress || {}).map(Number),
      1,
    ]);

    allCityIds.forEach((cId) => {
      const lCity = localProg.cityProgress?.[cId] || createInitialCityProgress();
      const cCity = cloudProg.cityProgress?.[cId] || createInitialCityProgress();

      const completedRounds = Array.from(new Set([...lCity.completedRounds, ...cCity.completedRounds])).sort((a, b) => a - b);
      const unlockedLocations = Array.from(new Set([...lCity.unlockedLocations, ...cCity.unlockedLocations])).sort((a, b) => a - b);
      const claimedRewards = Array.from(new Set([...lCity.claimedRewards, ...cCity.claimedRewards])).sort((a, b) => a - b);

      const roundScores: Record<number, number> = {};
      const allRounds = new Set([
        ...Object.keys(lCity.roundScores || {}).map(Number),
        ...Object.keys(cCity.roundScores || {}).map(Number),
      ]);
      allRounds.forEach((r) => {
        roundScores[r] = Math.max(lCity.roundScores?.[r] || 0, cCity.roundScores?.[r] || 0);
      });

      mergedCityProgress[cId] = {
        completedRounds,
        unlockedLocations,
        claimedRewards,
        roundScores,
      };
    });

    const currentCityId = Math.max(localProg.currentCityId || 1, cloudProg.currentCityId || 1);
    const coins = Math.max(localProg.coins, cloudProg.coins);
    const totalCorrectAnswers = Math.max(localProg.totalCorrectAnswers, cloudProg.totalCorrectAnswers);
    const totalQuestionsAnswered = Math.max(localProg.totalQuestionsAnswered, cloudProg.totalQuestionsAnswered);

    return {
      mode,
      coins,
      currentCityId,
      unlockedCityIds,
      completedCityIds,
      cityProgress: mergedCityProgress,
      totalCorrectAnswers,
      totalQuestionsAnswered,
      lastPlayedAt: new Date().toISOString(),
    };
  }

  // Synchronize on user login / registration
  public static async syncOnAuth(
    userId: string,
    onProgressMerged?: (childProg: GameProgress, studentProg: GameProgress) => void
  ): Promise<{ child: GameProgress; student: GameProgress }> {
    const localChild = StorageService.loadProgress('child');
    const localStudent = StorageService.loadProgress('student');

    const [cloudChild, cloudStudent] = await Promise.all([
      this.loadProgressFromCloud(userId, 'child').catch(() => null),
      this.loadProgressFromCloud(userId, 'student').catch(() => null),
    ]);

    // Merge or upload for child mode
    let finalChild: GameProgress;
    if (cloudChild) {
      finalChild = this.mergeProgress(localChild, cloudChild);
    } else {
      finalChild = localChild;
    }

    // Merge or upload for student mode
    let finalStudent: GameProgress;
    if (cloudStudent) {
      finalStudent = this.mergeProgress(localStudent, cloudStudent);
    } else {
      finalStudent = localStudent;
    }

    // Persist locally
    StorageService.saveProgress(finalChild);
    StorageService.saveProgress(finalStudent);

    // Persist to Cloud
    await Promise.all([
      this.saveProgressToCloud(userId, finalChild).catch((e) => console.warn('Could not save child to cloud:', e)),
      this.saveProgressToCloud(userId, finalStudent).catch((e) => console.warn('Could not save student to cloud:', e)),
    ]);

    if (onProgressMerged) {
      onProgressMerged(finalChild, finalStudent);
    }

    return { child: finalChild, student: finalStudent };
  }
}
