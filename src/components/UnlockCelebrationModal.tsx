import React from 'react';
import { CityLocationInfo } from '../types/game';
import { Sparkles, Coins, ArrowRight, Building, CheckCircle, Eye } from 'lucide-react';
import { soundService } from '../services/sound';

interface UnlockCelebrationModalProps {
  location: CityLocationInfo;
  earnedCoins: number;
  score: number;
  onExplore: () => void;
  onContinueNext: () => void;
}

export const UnlockCelebrationModal: React.FC<UnlockCelebrationModalProps> = ({
  location,
  earnedCoins,
  score,
  onExplore,
  onContinueNext,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-emerald-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl shadow-emerald-500/20 text-center">
        {/* Animated Celebration Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
          <Sparkles className="w-10 h-10 animate-spin-slow" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-400/30">
          🎉 Sector Constructed in 3D City!
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-white mb-1">
          {location.name}
        </h2>
        <p className="text-emerald-400 font-bold text-sm mb-4">{location.subtitle}</p>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6">
          {location.description}
        </p>

        {/* Features Checklist */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 mb-6 text-left">
          {location.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{feat}</span>
            </div>
          ))}
        </div>

        {/* Reward Pill */}
        <div className="flex items-center justify-center gap-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 max-w-xs mx-auto mb-6 text-sm">
          <div className="flex items-center gap-1.5 font-black text-amber-400">
            <Coins className="w-5 h-5" />
            <span>+{earnedCoins} Bonus Coins</span>
          </div>
          <div className="text-slate-400 text-xs font-semibold">Score: {score}/5</div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              soundService.playClick();
              onExplore();
            }}
            className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Explore Area</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onContinueNext();
            }}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
