import { GameMode, GameProgress, CityProgressData } from '../types/game';

const INITIAL_COINS = 100;

export const createInitialCityProgress = (): CityProgressData => ({
  completedRounds: [],
  unlockedLocations: [],
  claimedRewards: [],
  roundScores: {},
});

export const DEFAULT_PROGRESS: Record<GameMode, GameProgress> = {
  child: {
    mode: 'child',
    coins: INITIAL_COINS,
    currentCityId: 1,
    unlockedCityIds: [1],
    completedCityIds: [],
    cityProgress: {
      1: createInitialCityProgress(),
    },
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    lastPlayedAt: new Date().toISOString(),
  },
  student: {
    mode: 'student',
    coins: INITIAL_COINS,
    currentCityId: 1,
    unlockedCityIds: [1],
    completedCityIds: [],
    cityProgress: {
      1: createInitialCityProgress(),
    },
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    lastPlayedAt: new Date().toISOString(),
  },
};

export class StorageService {
  private static getKey(mode: GameMode): string {
    return `quiz_to_build_progress_${mode}_v2`;
  }

  public static loadProgress(mode: GameMode): GameProgress {
    try {
      // First try v2 format
      let data = localStorage.getItem(this.getKey(mode));
      if (!data) {
        // Fallback check v1 format for graceful migration
        const v1Data = localStorage.getItem(`quiz_to_build_progress_${mode}_v1`);
        if (v1Data) {
          const v1Parsed = JSON.parse(v1Data);
          const migrated: GameProgress = {
            mode,
            coins: typeof v1Parsed.coins === 'number' ? v1Parsed.coins : INITIAL_COINS,
            currentCityId: 1,
            unlockedCityIds: [1],
            completedCityIds: v1Parsed.completedRounds?.length >= 10 ? [1] : [],
            cityProgress: {
              1: {
                completedRounds: Array.isArray(v1Parsed.completedRounds) ? v1Parsed.completedRounds : [],
                unlockedLocations: Array.isArray(v1Parsed.unlockedLocations) ? v1Parsed.unlockedLocations : [],
                claimedRewards: Array.isArray(v1Parsed.claimedRewards) ? v1Parsed.claimedRewards : [],
                roundScores: v1Parsed.roundScores || {},
              },
            },
            totalCorrectAnswers: v1Parsed.totalCorrectAnswers || 0,
            totalQuestionsAnswered: v1Parsed.totalQuestionsAnswered || 0,
            lastPlayedAt: new Date().toISOString(),
          };
          this.saveProgress(migrated);
          return migrated;
        }
      }

      if (data) {
        const parsed = JSON.parse(data) as Partial<GameProgress>;
        const rawCityId = Number(parsed.currentCityId);
        const currentCityId = !isNaN(rawCityId) && rawCityId >= 1 && rawCityId <= 50 ? rawCityId : 1;

        const rawUnlocked = Array.isArray(parsed.unlockedCityIds) ? parsed.unlockedCityIds : [1];
        const unlockedCityIds = Array.from(
          new Set(
            rawUnlocked
              .map(Number)
              .filter((id) => !isNaN(id) && id >= 1 && id <= 50)
          )
        );
        if (!unlockedCityIds.includes(1)) unlockedCityIds.unshift(1);

        const rawCompleted = Array.isArray(parsed.completedCityIds) ? parsed.completedCityIds : [];
        const completedCityIds = Array.from(
          new Set(
            rawCompleted
              .map(Number)
              .filter((id) => !isNaN(id) && id >= 1 && id <= 50)
          )
        );

        const rawCityProgress =
          typeof parsed.cityProgress === 'object' && parsed.cityProgress !== null
            ? parsed.cityProgress
            : {};
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
            roundScores:
              typeof cp.roundScores === 'object' && cp.roundScores !== null ? cp.roundScores : {},
          };
        }

        if (!sanitizedCityProgress[currentCityId]) {
          sanitizedCityProgress[currentCityId] = createInitialCityProgress();
        }

        const rawCoins = Number(parsed.coins);
        const coins = !isNaN(rawCoins) && rawCoins >= 0 ? rawCoins : INITIAL_COINS;

        return {
          mode,
          coins,
          currentCityId,
          unlockedCityIds,
          completedCityIds,
          cityProgress: sanitizedCityProgress,
          totalCorrectAnswers: typeof parsed.totalCorrectAnswers === 'number' && !isNaN(parsed.totalCorrectAnswers) ? Math.max(0, parsed.totalCorrectAnswers) : 0,
          totalQuestionsAnswered: typeof parsed.totalQuestionsAnswered === 'number' && !isNaN(parsed.totalQuestionsAnswered) ? Math.max(0, parsed.totalQuestionsAnswered) : 0,
          lastPlayedAt: parsed.lastPlayedAt || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Failed to load progress from localStorage:', e);
    }
    return { ...DEFAULT_PROGRESS[mode] };
  }

  public static saveProgress(progress: GameProgress): void {
    try {
      progress.lastPlayedAt = new Date().toISOString();
      localStorage.setItem(this.getKey(progress.mode), JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage:', e);
    }
  }

  public static resetProgress(mode: GameMode): GameProgress {
    const fresh: GameProgress = {
      mode,
      coins: INITIAL_COINS,
      currentCityId: 1,
      unlockedCityIds: [1],
      completedCityIds: [],
      cityProgress: {
        1: createInitialCityProgress(),
      },
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      lastPlayedAt: new Date().toISOString(),
    };
    try {
      localStorage.removeItem(this.getKey(mode));
      localStorage.removeItem(`quiz_to_build_progress_${mode}_v1`);
      this.saveProgress(fresh);
    } catch (e) {
      console.warn('Failed to reset progress:', e);
    }
    return fresh;
  }
}
