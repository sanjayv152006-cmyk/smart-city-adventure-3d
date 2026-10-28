import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameMode, GameProgress, CityDefinition } from './types/game';
import { StorageService, createInitialCityProgress } from './services/storage';
import { soundService } from './services/sound';
import { getRoundQuestions } from './data/questions';
import { CITY_LOCATIONS, ROUND_REWARDS } from './data/locations';
import { ALL_50_CITIES } from './data/cities';
import { City3DCanvas } from './components/City3DCanvas';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ModeSelectionModal } from './components/ModeSelectionModal';
import { GameDashboard } from './components/GameDashboard';
import { QuizModal } from './components/QuizModal';
import { CityMapModal } from './components/CityMapModal';
import { WorldCityMapModal } from './components/WorldCityMapModal';
import { RewardsModal } from './components/RewardsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { UnlockCelebrationModal } from './components/UnlockCelebrationModal';
import { CityCompletedModal } from './components/CityCompletedModal';
import { LocationDetailsModal } from './components/LocationDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AuthService, UserProfile } from './services/authService';
import { CloudSyncService } from './services/cloudSync';
import { testFirebaseConnection } from './services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export default function App() {
  // Authentication & Player State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => AuthService.isGuestMode());

  // Screens & Navigation
  const [activeScreen, setActiveScreen] = useState<'welcome' | 'dashboard'>('welcome');
  const [activeMode, setActiveMode] = useState<GameMode>('child');

  // Progress States (Separate for Child and Student)
  const [childProgress, setChildProgress] = useState<GameProgress>(() =>
    StorageService.loadProgress('child')
  );
  const [studentProgress, setStudentProgress] = useState<GameProgress>(() =>
    StorageService.loadProgress('student')
  );

  // Active Progress & Current City
  const currentProgress = activeMode === 'child' ? childProgress : studentProgress;
  const curCityId = currentProgress.currentCityId || 1;
  const currentCityDef =
    ALL_50_CITIES.find((c) => c.id === curCityId) || ALL_50_CITIES[0];
  const rawCityProg = currentProgress.cityProgress?.[curCityId];
  const curCityProg = useMemo(() => ({
    completedRounds: Array.isArray(rawCityProg?.completedRounds) ? rawCityProg.completedRounds : [],
    unlockedLocations: Array.isArray(rawCityProg?.unlockedLocations) ? rawCityProg.unlockedLocations : [],
    claimedRewards: Array.isArray(rawCityProg?.claimedRewards) ? rawCityProg.claimedRewards : [],
    roundScores:
      typeof rawCityProg?.roundScores === 'object' && rawCityProg?.roundScores !== null
        ? rawCityProg.roundScores
        : {},
  }), [rawCityProg]);

  // Modals
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeQuizRound, setActiveQuizRound] = useState<number>(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 3D Scene Controls & Feedback
  const [newlyUnlockedId, setNewlyUnlockedId] = useState<number | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<number | null>(null);
  const [inspectedLocationId, setInspectedLocationId] = useState<number | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>(() => {
    try {
      const q = localStorage.getItem('quiz_city_graphics_quality');
      if (q === 'low' || q === 'medium' || q === 'high') return q;
    } catch {}
    return 'high';
  });

  // Display & Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Firebase Connection & Auth Listener
  useEffect(() => {
    testFirebaseConnection();

    const unsubscribe = AuthService.onAuthChanged(async (user, profile) => {
      setCurrentUser(user);
      setUserProfile(profile);

      if (user) {
        setIsGuestMode(false);
        try {
          await CloudSyncService.syncOnAuth(user.uid, (mergedChild, mergedStudent) => {
            setChildProgress(mergedChild);
            setStudentProgress(mergedStudent);
          });
        } catch (e) {
          console.warn('Cloud sync error on auth change:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const saveProgressState = useCallback((updated: GameProgress) => {
    StorageService.saveProgress(updated);
    if (updated.mode === 'child') {
      setChildProgress(updated);
    } else {
      setStudentProgress(updated);
    }
    if (currentUser?.uid) {
      CloudSyncService.saveProgressToCloud(currentUser.uid, updated).catch((err) => {
        console.warn('Cloud save error:', err);
      });
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setCurrentUser(null);
      setUserProfile(null);
      setIsGuestMode(true);
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  const handleLoginSuccess = async () => {
    setIsAuthModalOpen(false);
    setIsGuestMode(false);
    if (currentUser?.uid) {
      try {
        await CloudSyncService.syncOnAuth(currentUser.uid, (c, s) => {
          setChildProgress(c);
          setStudentProgress(s);
        });
      } catch (e) {
        console.warn('Error syncing on login:', e);
      }
    }
  };

  const handlePlayAsGuest = () => {
    setIsGuestMode(true);
    setIsAuthModalOpen(false);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Sound & Music States
  const [sfxEnabled, setSfxEnabled] = useState(soundService.getSfxEnabled());
  const [musicEnabled, setMusicEnabled] = useState(soundService.getMusicEnabled());
  const [musicVolume, setMusicVolume] = useState(soundService.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState(soundService.getSfxVolume());

  const handleToggleMusic = () => {
    const updated = soundService.toggleMusic();
    setMusicEnabled(updated);
  };

  const handleMusicVolumeChange = (val: number) => {
    soundService.setMusicVolume(val);
    setMusicVolume(val);
  };

  const handleSfxVolumeChange = (val: number) => {
    soundService.setSfxVolume(val);
    setSfxVolume(val);
  };

  const handleGraphicsQualityChange = (q: 'low' | 'medium' | 'high') => {
    setGraphicsQuality(q);
    try {
      localStorage.setItem('quiz_city_graphics_quality', q);
    } catch {}
  };

  // Celebration state for round unlock
  const [celebrationData, setCelebrationData] = useState<{
    location: (typeof CITY_LOCATIONS)[0];
    earnedCoins: number;
    score: number;
  } | null>(null);

  // Celebration state for full city completion
  const [cityCompletedData, setCityCompletedData] = useState<{
    completedCity: CityDefinition;
    nextCity: CityDefinition | null;
    bonus: number;
  } | null>(null);

  // Filter 5 questions for the active round from the active mode's question bank for the current city
  const currentRoundQuestions = useMemo(() => {
    return getRoundQuestions(activeMode, curCityId, activeQuizRound);
  }, [activeMode, curCityId, activeQuizRound]);

  // Mode Selection Handler
  const handleSelectMode = (mode: GameMode) => {
    setActiveMode(mode);
    setIsModeModalOpen(false);
    setActiveScreen('dashboard');

    const prog = mode === 'child' ? childProgress : studentProgress;
    const cId = prog.currentCityId || 1;
    const cp = prog.cityProgress[cId] || createInitialCityProgress();
    const target =
      cp.unlockedLocations.length > 0
        ? cp.unlockedLocations[cp.unlockedLocations.length - 1]
        : 1;
    setFocusedLocationId(target);
  };

  // Reset progress for active mode
  const handleResetProgress = () => {
    const fresh = StorageService.resetProgress(activeMode);
    if (activeMode === 'child') {
      setChildProgress(fresh);
    } else {
      setStudentProgress(fresh);
    }
    if (currentUser?.uid) {
      CloudSyncService.saveProgressToCloud(currentUser.uid, fresh).catch(() => {});
    }
    setNewlyUnlockedId(null);
    setFocusedLocationId(null);
  };

  // Switch City
  const handleSelectCity = (cityId: number) => {
    // Enforce progression rule: locked cities cannot be entered
    if (!currentProgress.unlockedCityIds.includes(cityId)) {
      return;
    }

    const cityProgMap = { ...currentProgress.cityProgress };
    if (!cityProgMap[cityId]) {
      cityProgMap[cityId] = createInitialCityProgress();
    }

    const updated: GameProgress = {
      ...currentProgress,
      currentCityId: cityId,
      cityProgress: cityProgMap,
    };

    saveProgressState(updated);

    setNewlyUnlockedId(null);
    const cp = cityProgMap[cityId];
    const target = cp.unlockedLocations.length > 0 ? cp.unlockedLocations[cp.unlockedLocations.length - 1] : 1;
    setFocusedLocationId(target);
  };

  // Start a Quiz Round (Validate unlock progression)
  const handlePlayQuiz = (roundNumber: number) => {
    // Round 1 is always unlocked for an unlocked city. Future rounds require previous round completion.
    const isPlayable =
      roundNumber === 1 ||
      curCityProg.completedRounds.includes(roundNumber) ||
      curCityProg.completedRounds.includes(roundNumber - 1);
    if (!isPlayable) {
      return;
    }

    setActiveQuizRound(roundNumber);
    setIsQuizModalOpen(true);
  };

  // Round Completed Handler
  const handleRoundComplete = (round: number, score: number, rewardCoins: number) => {
    setIsQuizModalOpen(false);

    const isAlreadyClaimed = curCityProg.claimedRewards.includes(round);
    const coinsToAdd = isAlreadyClaimed ? 0 : rewardCoins;

    const updatedCompletedRounds = Array.from(new Set([...curCityProg.completedRounds, round]));
    const updatedUnlockedLocations = Array.from(new Set([...curCityProg.unlockedLocations, round]));
    const updatedClaimedRewards = Array.from(new Set([...curCityProg.claimedRewards, round]));
    const updatedScores = {
      ...curCityProg.roundScores,
      [round]: Math.max(score, curCityProg.roundScores[round] || 0),
    };

    const newCityProgress = {
      ...currentProgress.cityProgress,
      [curCityId]: {
        completedRounds: updatedCompletedRounds,
        unlockedLocations: updatedUnlockedLocations,
        claimedRewards: updatedClaimedRewards,
        roundScores: updatedScores,
      },
    };

    // Check if all 10 rounds in current city are now completed
    const isCityCompletedNow = updatedCompletedRounds.length >= 10;
    const isFirstTimeCityCompletion =
      isCityCompletedNow && !currentProgress.completedCityIds.includes(curCityId);

    const newCompletedCities = Array.from(
      new Set(isCityCompletedNow ? [...currentProgress.completedCityIds, curCityId] : currentProgress.completedCityIds)
    );

    let cityBonusCoins = 0;
    const newUnlockedCities = [...currentProgress.unlockedCityIds];

    if (isFirstTimeCityCompletion) {
      cityBonusCoins = currentCityDef.completionRewardCoins || 500;
      const nextCityId = curCityId + 1;
      if (nextCityId <= 50 && !newUnlockedCities.includes(nextCityId)) {
        newUnlockedCities.push(nextCityId);
      }
    }

    const updated: GameProgress = {
      ...currentProgress,
      coins: currentProgress.coins + coinsToAdd + cityBonusCoins,
      unlockedCityIds: Array.from(new Set(newUnlockedCities)),
      completedCityIds: newCompletedCities,
      cityProgress: newCityProgress,
      totalCorrectAnswers: currentProgress.totalCorrectAnswers + score,
      totalQuestionsAnswered: currentProgress.totalQuestionsAnswered + 5,
    };

    // Save locally and sync to cloud
    saveProgressState(updated);

    // Trigger 3D focus and pop animation
    setNewlyUnlockedId(round);
    setFocusedLocationId(round);

    const loc = CITY_LOCATIONS.find((l) => l.id === round) || CITY_LOCATIONS[0];

    // If city is newly completed, trigger the grand CityCompletedModal celebration!
    if (isFirstTimeCityCompletion) {
      const nextCity = ALL_50_CITIES.find((c) => c.id === curCityId + 1) || null;
      setCityCompletedData({
        completedCity: currentCityDef,
        nextCity,
        bonus: cityBonusCoins,
      });
    } else {
      // Normal round celebration modal
      setCelebrationData({
        location: loc,
        earnedCoins: coinsToAdd,
        score,
      });
    }
  };

  // 3D Object Click Handler (Raycasting)
  const handleSelect3DLocation = (id: number) => {
    // Only allow selecting unlocked locations
    if (!curCityProg.unlockedLocations.includes(id)) {
      return;
    }
    setInspectedLocationId(id);
    setFocusedLocationId(id);
  };

  // Audio toggles
  const handleToggleSfx = () => {
    const updated = soundService.toggleSfx();
    setSfxEnabled(updated);
  };

  const inspectedLocInfo = useMemo(() => {
    if (!inspectedLocationId) return null;
    return CITY_LOCATIONS.find((l) => l.id === inspectedLocationId) || null;
  }, [inspectedLocationId]);

  // Navigate explicitly back to Welcome Screen (Home)
  const handleGoHome = useCallback(() => {
    soundService.playClick();
    setIsSettingsOpen(false);
    setIsQuizModalOpen(false);
    setIsMapModalOpen(false);
    setIsWorldMapOpen(false);
    setIsRewardsModalOpen(false);
    setIsHowToPlayOpen(false);
    setIsModeModalOpen(false);
    setCelebrationData(null);
    setCityCompletedData(null);
    setInspectedLocationId(null);
    setFocusedLocationId(null);
    setActiveScreen('welcome');
  }, []);

  // Back button on GameDashboard: unfocus camera or return to previous screen (welcome)
  const handleDashboardBack = useCallback(() => {
    soundService.playClick();
    if (focusedLocationId !== null) {
      setFocusedLocationId(null);
      return;
    }
    setActiveScreen('welcome');
  }, [focusedLocationId]);

  // Hierarchical back handler for Android back button and keyboard/popstate navigation
  const handleGlobalBack = useCallback(() => {
    // 1. If round unlock celebration is open
    if (celebrationData) {
      soundService.playClick();
      setCelebrationData(null);
      return true;
    }
    // 2. If city completed celebration is open
    if (cityCompletedData) {
      soundService.playClick();
      setCityCompletedData(null);
      return true;
    }
    // 3. If quiz is open -> safely return to city without losing progress or submitting
    if (isQuizModalOpen) {
      soundService.playClick();
      setIsQuizModalOpen(false);
      return true;
    }
    // 4. Secondary modals
    if (isAuthModalOpen) {
      soundService.playClick();
      setIsAuthModalOpen(false);
      return true;
    }
    if (isSettingsOpen) {
      soundService.playClick();
      setIsSettingsOpen(false);
      return true;
    }
    if (isMapModalOpen) {
      soundService.playClick();
      setIsMapModalOpen(false);
      return true;
    }
    if (isWorldMapOpen) {
      soundService.playClick();
      setIsWorldMapOpen(false);
      return true;
    }
    if (isRewardsModalOpen) {
      soundService.playClick();
      setIsRewardsModalOpen(false);
      return true;
    }
    if (isHowToPlayOpen) {
      soundService.playClick();
      setIsHowToPlayOpen(false);
      return true;
    }
    if (isModeModalOpen) {
      soundService.playClick();
      setIsModeModalOpen(false);
      return true;
    }
    // 5. 3D Inspection details modal
    if (inspectedLocationId !== null) {
      soundService.playClick();
      setInspectedLocationId(null);
      return true;
    }
    // 6. Camera focus on a building -> return to overview angle
    if (focusedLocationId !== null) {
      soundService.playClick();
      setFocusedLocationId(null);
      return true;
    }
    // 7. If currently on dashboard -> return to welcome screen
    if (activeScreen === 'dashboard') {
      soundService.playClick();
      setActiveScreen('welcome');
      return true;
    }
    // On welcome screen with no active overlays
    return false;
  }, [
    celebrationData,
    cityCompletedData,
    isQuizModalOpen,
    isAuthModalOpen,
    isSettingsOpen,
    isMapModalOpen,
    isWorldMapOpen,
    isRewardsModalOpen,
    isHowToPlayOpen,
    isModeModalOpen,
    inspectedLocationId,
    focusedLocationId,
    activeScreen,
  ]);

  // Intercept Android hardware Back button and browser Back button so user never leaves the game accidentally
  useEffect(() => {
    try {
      window.history.replaceState({ inApp: true, step: 0 }, '');
      window.history.pushState({ inApp: true, step: 1 }, '');
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleGlobalBack();
      try {
        window.history.pushState({ inApp: true, step: 1 }, '');
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleGlobalBack]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D City Background Engine */}
      <City3DCanvas
        unlockedLocationIds={curCityProg.unlockedLocations}
        newlyUnlockedId={newlyUnlockedId}
        focusedLocationId={focusedLocationId}
        onSelectLocation={handleSelect3DLocation}
        isNight={isNight}
        cityDefinition={currentCityDef}
        graphicsQuality={graphicsQuality}
      />

      {/* Screen 1: Welcome Screen */}
      {activeScreen === 'welcome' && (
        <WelcomeScreen
          onPlayClick={() => setIsModeModalOpen(true)}
          onHowToPlayClick={() => setIsHowToPlayOpen(true)}
          onProgressClick={() => setIsWorldMapOpen(true)}
          sfxEnabled={sfxEnabled}
          musicEnabled={musicEnabled}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
          onOpenSettings={() => setIsSettingsOpen(true)}
          userProfile={userProfile}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Screen 2: Active Game Dashboard */}
      {activeScreen === 'dashboard' && (
        <GameDashboard
          progress={currentProgress}
          onBack={handleDashboardBack}
          onGoHome={handleGoHome}
          onPlayQuiz={handlePlayQuiz}
          onOpenMap={() => setIsMapModalOpen(true)}
          onOpenWorldMap={() => setIsWorldMapOpen(true)}
          onOpenRewards={() => setIsRewardsModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onChangeMode={() => setIsModeModalOpen(true)}
          onResetProgress={handleResetProgress}
          onFocusLocation={(id) => setFocusedLocationId(id)}
          onResetCamera={() => setFocusedLocationId(null)}
          isNight={isNight}
          onToggleNight={() => setIsNight(!isNight)}
          sfxEnabled={sfxEnabled}
          musicEnabled={musicEnabled}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        onSelectMode={handleSelectMode}
        childProgress={childProgress}
        studentProgress={studentProgress}
      />

      {/* MCQ Quiz Modal */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        mode={activeMode}
        roundNumber={activeQuizRound}
        questions={currentRoundQuestions}
        onRoundComplete={handleRoundComplete}
      />

      {/* City Sector Master Map Modal (10 Zones for Current City) */}
      <CityMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        unlockedLocationIds={curCityProg.unlockedLocations}
        onSelectAndFocus={(id) => {
          setFocusedLocationId(id);
          setActiveScreen('dashboard');
        }}
      />

      {/* World Map Modal (All 50 Cities) */}
      <WorldCityMapModal
        isOpen={isWorldMapOpen}
        onClose={() => setIsWorldMapOpen(false)}
        progress={currentProgress}
        onSelectCity={handleSelectCity}
      />

      {/* Rewards Catalog Modal */}
      <RewardsModal
        isOpen={isRewardsModalOpen}
        onClose={() => setIsRewardsModalOpen(false)}
        progress={currentProgress}
      />

      {/* How to Play Guide Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Round Complete & Unlock Celebration Modal */}
      {celebrationData && (
        <UnlockCelebrationModal
          location={celebrationData.location}
          earnedCoins={celebrationData.earnedCoins}
          score={celebrationData.score}
          onExplore={() => setCelebrationData(null)}
          onContinueNext={() => {
            setCelebrationData(null);
            const nextRound = celebrationData.location.id + 1;
            if (nextRound <= 10) {
              setFocusedLocationId(nextRound);
            }
          }}
        />
      )}

      {/* City Completed Grand Celebration Modal */}
      {cityCompletedData && (
        <CityCompletedModal
          completedCity={cityCompletedData.completedCity}
          nextCity={cityCompletedData.nextCity}
          completionBonus={cityCompletedData.bonus}
          onStayAndExplore={() => setCityCompletedData(null)}
          onTravelToNextCity={() => {
            if (cityCompletedData.nextCity) {
              handleSelectCity(cityCompletedData.nextCity.id);
            }
            setCityCompletedData(null);
          }}
        />
      )}

      {/* Interactive 3D Building Inspection Card */}
      <LocationDetailsModal
        location={inspectedLocInfo}
        isUnlocked={
          inspectedLocInfo ? curCityProg.unlockedLocations.includes(inspectedLocInfo.id) : false
        }
        onClose={() => setInspectedLocationId(null)}
        onPlayRound={(round) => {
          handlePlayQuiz(round);
        }}
      />

      {/* Game Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onGoHome={handleGoHome}
        currentMode={activeMode}
        onSelectMode={handleSelectMode}
        musicEnabled={musicEnabled}
        onToggleMusic={handleToggleMusic}
        musicVolume={musicVolume}
        onChangeMusicVolume={handleMusicVolumeChange}
        sfxEnabled={sfxEnabled}
        onToggleSfx={handleToggleSfx}
        sfxVolume={sfxVolume}
        onChangeSfxVolume={handleSfxVolumeChange}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isNight={isNight}
        onToggleNight={() => setIsNight(!isNight)}
        graphicsQuality={graphicsQuality}
        onChangeGraphicsQuality={handleGraphicsQualityChange}
        progress={currentProgress}
        onResetProgress={handleResetProgress}
        onResetCamera={() => setFocusedLocationId(null)}
        onFocusLocation={(id) => setFocusedLocationId(id)}
        onOpenWorldMap={() => setIsWorldMapOpen(true)}
        onOpenMap={() => setIsMapModalOpen(true)}
        onOpenRewards={() => setIsRewardsModalOpen(true)}
        userProfile={userProfile}
        isGuest={!currentUser}
        onOpenAuth={() => {
          setIsSettingsOpen(false);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Authentication & Guest Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onPlayAsGuest={handlePlayAsGuest}
        isGuestPlaying={isGuestMode && !currentUser}
      />
    </div>
  );
}
