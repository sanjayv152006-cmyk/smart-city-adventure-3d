import React from 'react';
import { GameProgress } from '../types/game';
import { CITY_LOCATIONS } from '../data/locations';
import { ALL_50_CITIES } from '../data/cities';
import {
  Coins,
  Play,
  Sparkles,
  Settings,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { soundService } from '../services/sound';

interface GameDashboardProps {
  progress: GameProgress;
  onPlayQuiz: (roundNumber: number) => void;
  onOpenSettings?: () => void;
  onBack?: () => void;
  onGoHome?: () => void;
  // Kept for backward compatibility if passed
  onOpenMap?: () => void;
  onOpenWorldMap?: () => void;
  onOpenRewards?: () => void;
  onChangeMode?: () => void;
  onResetProgress?: () => void;
  onFocusLocation?: (id: number) => void;
  onResetCamera?: () => void;
  isNight?: boolean;
  onToggleNight?: () => void;
  sfxEnabled?: boolean;
  musicEnabled?: boolean;
  onToggleSfx?: () => void;
  onToggleMusic?: () => void;
}

export const GameDashboard: React.FC<GameDashboardProps> = ({
  progress,
  onPlayQuiz,
  onOpenSettings,
  onBack,
  onGoHome,
}) => {

  const currentCityDef =
    ALL_50_CITIES.find((c) => c.id === progress.currentCityId) || ALL_50_CITIES[0];
  const rawCityProg = progress.cityProgress?.[progress.currentCityId];
  const curCityProg = {
    completedRounds: Array.isArray(rawCityProg?.completedRounds) ? rawCityProg.completedRounds : [],
    unlockedLocations: Array.isArray(rawCityProg?.unlockedLocations) ? rawCityProg.unlockedLocations : [],
    claimedRewards: Array.isArray(rawCityProg?.claimedRewards) ? rawCityProg.claimedRewards : [],
    roundScores:
      typeof rawCityProg?.roundScores === 'object' && rawCityProg?.roundScores !== null
        ? rawCityProg.roundScores
        : {},
  };

  const nextUncompletedRound =
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((r) => !curCityProg.completedRounds.includes(r)) || 10;

  const currentZone = CITY_LOCATIONS.find((l) => l.id === nextUncompletedRound) || CITY_LOCATIONS[0];
  const progressPercent = Math.round((curCityProg.completedRounds.length / 10) * 100);

  return (
    <>
      {/* Top HUD Bar and Play Quiz CTA Container */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 pointer-events-none flex flex-col items-center gap-2">
        {/* Clean Main Header Bar: Only 3 key items */}
        <div className="w-full flex items-center justify-between gap-2 max-w-5xl mx-auto">
          {/* Left Group: Back Button + Home Button + Combined City & Round Progress Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {onBack && (
              <button
                onClick={() => {
                  soundService.playClick();
                  onBack();
                }}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-slate-700/80 hover:border-sky-400 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer shrink-0 min-h-[38px] text-xs font-bold"
                title="Back to Previous Screen"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="hidden xs:inline">Back</span>
              </button>
            )}

            {onGoHome && (
              <button
                onClick={() => {
                  soundService.playClick();
                  onGoHome();
                }}
                className="pointer-events-auto p-2 sm:p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-slate-700/80 hover:border-sky-400 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer shrink-0 flex items-center justify-center min-w-[38px] min-h-[38px]"
                title="Return to Main Menu (Home)"
                aria-label="Home"
              >
                <Home className="w-4 h-4 text-slate-300 hover:text-sky-300 transition-colors" />
              </button>
            )}

            {/* ITEM 1: Combined City & Round Progress Indicator */}
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black truncate">
                <span className="text-sky-300 truncate">
                  C{currentCityDef.id}: {currentCityDef.name}
                </span>
                <span className="text-slate-500 font-bold">•</span>
                <span className="text-amber-300 shrink-0">
                  Round {nextUncompletedRound}/10
                </span>
                <span className="text-slate-300 font-medium text-xs hidden md:inline truncate">
                  ({currentZone.name})
                </span>
              </div>
            </div>
          </div>

          {/* Right Group: ITEM 2 (Coins Summary) + ITEM 3 (Settings Icon) */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* ITEM 2: Coins / Rewards Summary */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-xs sm:text-sm font-black text-amber-300 shadow-md">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{progress.coins}</span>
              <span className="text-[10px] text-amber-300/80 font-normal hidden xs:inline">Coins</span>
            </div>

            {/* ITEM 3: Settings Gear Icon */}
            {onOpenSettings && (
              <button
                onClick={() => {
                  soundService.playClick();
                  onOpenSettings();
                }}
                className="p-2 sm:p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 hover:border-sky-400 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer shrink-0 flex items-center justify-center min-w-[38px] min-h-[38px]"
                title="Settings & Menu"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-slate-300 hover:text-sky-300 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Prominent Play Quiz Floating CTA (Always clearly positioned below top bars) */}
        <div className="pointer-events-auto mt-0.5 sm:mt-1 max-w-[calc(100vw-1rem)] sm:max-w-md">
          <button
            onClick={() => {
              soundService.playClick();
              onPlayQuiz(nextUncompletedRound);
            }}
            className="group relative flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-base tracking-wide shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all border border-emerald-300/40 cursor-pointer w-full"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] text-emerald-100 uppercase tracking-widest font-extrabold leading-tight">
                {curCityProg.completedRounds.includes(nextUncompletedRound) ? 'Replay Quiz' : 'Unlock Next Zone'}
              </div>
              <div className="text-xs sm:text-sm font-black truncate">
                Play Round {nextUncompletedRound}: {currentZone.name}
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
          </button>
        </div>
      </div>
    </>
  );
};
