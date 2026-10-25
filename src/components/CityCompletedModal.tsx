import React from 'react';
import confetti from 'canvas-confetti';
import { CityDefinition } from '../types/game';
import { Trophy, Coins, Sparkles, ArrowRight, CheckCircle, Globe } from 'lucide-react';
import { soundService } from '../services/sound';

interface CityCompletedModalProps {
  completedCity: CityDefinition;
  nextCity: CityDefinition | null;
  completionBonus: number;
  onStayAndExplore: () => void;
  onTravelToNextCity: () => void;
}

export const CityCompletedModal: React.FC<CityCompletedModalProps> = ({
  completedCity,
  nextCity,
  completionBonus,
  onStayAndExplore,
  onTravelToNextCity,
}) => {
  React.useEffect(() => {
    soundService.playRoundWin();
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-amber-400/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl shadow-amber-500/20 text-center">
        {/* Celebration Trophy */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-400/30">
          🏆 METROPOLIS FULLY CONSTRUCTED!
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-white mb-1">
          City #{completedCity.id}: {completedCity.name}
        </h2>
        <p className="text-amber-300 font-bold text-sm mb-4">
          All 10 Rounds Successfully Mastered!
        </p>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6">
          Congratulations! You completed all 10 construction zones of {completedCity.name}. The city is now a thriving, fully realized smart metropolis!
        </p>

        {/* Completion Bonus Card */}
        <div className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 max-w-sm mx-auto mb-6">
          <Coins className="w-6 h-6 text-amber-400" />
          <div className="text-left">
            <div className="text-[10px] text-amber-200 uppercase font-black tracking-wider">
              City Completion Grand Bonus
            </div>
            <div className="text-xl font-black text-amber-300">
              +{completionBonus} Bonus Coins Awarded!
            </div>
          </div>
        </div>

        {/* Next City Unlocked Preview */}
        {nextCity ? (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-sky-500/40 mb-6 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Next City Unlocked</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                City #{nextCity.id}
              </span>
            </div>

            <h4 className="font-black text-base text-white">{nextCity.name}</h4>
            <div className="text-xs text-sky-300 font-medium mb-1">{nextCity.tagline}</div>
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {nextCity.description}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 mb-6 text-emerald-200 text-sm font-bold">
            🎉 Ultimate Champion! You have completed all 50 cities in the world!
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              soundService.playClick();
              onStayAndExplore();
            }}
            className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <span>Stay &amp; Explore</span>
          </button>

          {nextCity && (
            <button
              onClick={() => {
                soundService.playUnlock();
                onTravelToNextCity();
              }}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Travel to City #{nextCity.id}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
