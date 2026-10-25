import React, { useState } from 'react';
import { ALL_50_CITIES } from '../data/cities';
import { GameProgress } from '../types/game';
import {
  Globe,
  Lock,
  CheckCircle,
  Trophy,
  ArrowRight,
  X,
  Sparkles,
  MapPin,
  Building,
  Coins,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { soundService } from '../services/sound';

interface WorldCityMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: GameProgress;
  onSelectCity: (cityId: number) => void;
}

export const WorldCityMapModal: React.FC<WorldCityMapModalProps> = ({
  isOpen,
  onClose,
  progress,
  onSelectCity,
}) => {
  const [activeTier, setActiveTier] = useState<number>(0); // 0: All, 1: 1-10, 2: 11-20, 3: 21-30, 4: 31-40, 5: 41-50

  if (!isOpen) return null;

  const currentCityDef =
    ALL_50_CITIES.find((c) => c.id === progress.currentCityId) || ALL_50_CITIES[0];
  const rawCityProg = progress.cityProgress?.[progress.currentCityId];
  const curCityProg = {
    completedRounds: Array.isArray(rawCityProg?.completedRounds) ? rawCityProg.completedRounds : [],
    unlockedLocations: Array.isArray(rawCityProg?.unlockedLocations) ? rawCityProg.unlockedLocations : [],
  };
  const currentCityRounds = curCityProg.completedRounds.length;

  // Calculate total rounds completed across all 50 cities
  let totalRoundsCompleted = 0;
  if (progress.cityProgress && typeof progress.cityProgress === 'object') {
    Object.values(progress.cityProgress).forEach((cp) => {
      if (cp && Array.isArray(cp.completedRounds)) {
        totalRoundsCompleted += cp.completedRounds.length;
      }
    });
  }

  const tiers = [
    { label: 'All 50 Cities', range: [1, 50] },
    { label: 'Cities 1–10 (Founding)', range: [1, 10] },
    { label: 'Cities 11–20 (Frontier)', range: [11, 20] },
    { label: 'Cities 21–30 (Sanctuaries)', range: [21, 30] },
    { label: 'Cities 31–40 (Horizons)', range: [31, 40] },
    { label: 'Cities 41–50 (Apex Capitals)', range: [41, 50] },
  ];

  const filteredCities = ALL_50_CITIES.filter((c) => {
    if (activeTier === 0) return true;
    const [min, max] = tiers[activeTier].range;
    return c.id >= min && c.id <= max;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-slate-800">
          {/* Top Actions: Back & Close Buttons */}
          <div className="absolute top-4 sm:top-5 right-4 sm:right-5 flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-400 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Globe className="w-4 h-4 text-sky-400" />
            Global 50-City World Tour
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">World City Selection Map</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Complete all 10 rounds in your current city to unlock the next metropolis across 500 rounds of educational adventure!
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-400/25">
              <div className="text-[10px] text-sky-300 uppercase font-bold">Current City</div>
              <div className="text-sm sm:text-base font-black text-white truncate">
                City {currentCityDef.id}: {currentCityDef.name}
              </div>
              <div className="text-[11px] text-sky-400/80">Round {currentCityRounds}/10</div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/25">
              <div className="text-[10px] text-emerald-300 uppercase font-bold">Cities Progress</div>
              <div className="text-sm sm:text-base font-black text-white">
                {progress.unlockedCityIds.length} / 50 <span className="text-xs text-emerald-400 font-normal">Unlocked</span>
              </div>
              <div className="text-[11px] text-emerald-400/80">{progress.completedCityIds.length} Completed</div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-400/25">
              <div className="text-[10px] text-indigo-300 uppercase font-bold">Total Rounds</div>
              <div className="text-sm sm:text-base font-black text-white">
                {totalRoundsCompleted} / 500
              </div>
              <div className="text-[11px] text-indigo-400/80">{Math.round((totalRoundsCompleted / 500) * 100)}% World Progress</div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/25">
              <div className="text-[10px] text-amber-300 uppercase font-bold">Current Coins</div>
              <div className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{progress.coins}</span>
              </div>
              <div className="text-[11px] text-amber-400/80">Available Treasury</div>
            </div>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1 no-scrollbar text-xs">
            {tiers.map((t, idx) => (
              <button
                key={idx}
                onClick={() => {
                  soundService.playClick();
                  setActiveTier(idx);
                }}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTier === idx
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable 50 Cities Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCities.map((city) => {
            const isCurrent = city.id === progress.currentCityId;
            const isUnlocked = progress.unlockedCityIds.includes(city.id);
            const isCompleted = progress.completedCityIds.includes(city.id);
            const cityData = progress.cityProgress[city.id] || { completedRounds: [], unlockedLocations: [] };
            const roundsDone = cityData.completedRounds.length;

            return (
              <div
                key={city.id}
                onClick={() => {
                  if (isUnlocked) {
                    soundService.playClick();
                    onSelectCity(city.id);
                    onClose();
                  }
                }}
                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-sky-950/40 border-sky-400 shadow-lg shadow-sky-950/40 cursor-pointer'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400 cursor-pointer'
                    : isUnlocked
                    ? 'bg-slate-800/80 border-slate-700 hover:border-sky-400 cursor-pointer hover:-translate-y-0.5'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-70 cursor-not-allowed'
                }`}
              >
                <div>
                  {/* Top line badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{
                        backgroundColor: isUnlocked ? `${city.accentColor}25` : '#334155',
                        color: isUnlocked ? city.accentColor : '#94a3b8',
                      }}
                    >
                      City #{city.id} &bull; {city.theme}
                    </span>

                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 font-black text-[10px] uppercase">
                        Current
                      </span>
                    ) : isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[11px] font-bold text-sky-300">
                        Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  <h3 className={`font-black text-base sm:text-lg ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                    {city.name}
                  </h3>
                  <div className="text-xs text-sky-400/90 font-medium mb-1.5">{city.tagline}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {city.description}
                  </p>
                </div>

                {/* Footer progress & CTA */}
                <div className="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  {isUnlocked ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${(roundsDone / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-300 font-semibold text-[11px]">
                          {roundsDone}/10
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-sky-300 hover:text-white">
                        <span>{isCurrent ? 'Exploring' : 'Travel'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Complete City {city.id - 1}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
