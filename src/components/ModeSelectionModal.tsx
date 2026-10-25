import React from 'react';
import { GameMode, GameProgress } from '../types/game';
import { Sparkles, BookOpen, Baby, ArrowRight, ArrowLeft, Coins, CheckCircle, X } from 'lucide-react';
import { soundService } from '../services/sound';

interface ModeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: GameMode) => void;
  childProgress: GameProgress;
  studentProgress: GameProgress;
}

export const ModeSelectionModal: React.FC<ModeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  childProgress,
  studentProgress,
}) => {
  if (!isOpen) return null;

  const childRoundsDone = Object.values(childProgress.cityProgress || {}).reduce(
    (acc, cp) => acc + (cp?.completedRounds?.length || 0),
    0
  );
  const studentRoundsDone = Object.values(studentProgress.cityProgress || {}).reduce(
    (acc, cp) => acc + (cp?.completedRounds?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl shadow-sky-950/50">
        {/* Top Navigation Bar: Back & Close */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-400 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
            title="Back to Previous Screen"
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
            className="p-1.5 sm:p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="text-center mb-5 sm:mb-8 pr-6 sm:pr-0">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            Step 1: Choose Your Journey
          </div>
          <h2 className="text-xl sm:text-4xl font-extrabold text-white">Select Player Mode</h2>
          <p className="text-slate-400 text-xs sm:text-base mt-1">
            Choose your preferred learning track. Each mode saves your progress independently!
          </p>
        </div>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* OPTION A: CHILD MODE */}
          <div
            onClick={() => {
              soundService.playClick();
              onSelectMode('child');
            }}
            className="group relative flex flex-col justify-between p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-500/15 via-rose-500/10 to-slate-900/90 border-2 border-amber-400/40 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                  <Baby className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black tracking-wider uppercase border border-amber-400/30">
                  Ages 5 - 10
                </span>
              </div>

              <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                OPTION A: CHILD MODE
              </h3>
              <p className="text-amber-100/80 text-sm mt-2 leading-relaxed">
                Colorful, warm, and friendly! Packed with exciting questions on animals, colors, fruits, numbers, shapes, nature, and fun general knowledge.
              </p>

              <div className="mt-5 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>500 rounds across 50 progressive cities</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Encouraging voice chimes and animations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Build 50 toy-style smart metropolis environments</span>
                </div>
              </div>
            </div>

            {/* Progress pill & Action */}
            <div className="mt-6 pt-5 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <strong className="text-white">{childProgress.coins}</strong> coins
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <strong className="text-white">{childRoundsDone}</strong> rounds ({childProgress.completedCityIds.length} cities)
                </span>
              </div>

              <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-400 group-hover:to-orange-400 text-slate-950 font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all">
                <span>Play Child Mode</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* OPTION B: STUDENT MODE */}
          <div
            onClick={() => {
              soundService.playClick();
              onSelectMode('student');
            }}
            className="group relative flex flex-col justify-between p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-sky-500/15 via-indigo-500/10 to-slate-900/90 border-2 border-sky-400/40 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/20 transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-inner">
                  <BookOpen className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-black tracking-wider uppercase border border-sky-400/30">
                  Students &amp; Teens
                </span>
              </div>

              <h3 className="text-2xl font-black text-white group-hover:text-sky-300 transition-colors">
                OPTION B: STUDENT MODE
              </h3>
              <p className="text-sky-100/80 text-sm mt-2 leading-relaxed">
                Modern educational challenges! Explore computer hardware, mathematics, science, internet fundamentals, basic coding, cyber safety, and smart city tech.
              </p>

              <div className="mt-5 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  <span>500 rounds across 50 progressive cities</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  <span>Short educational explanations included</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  <span>Build 50 high-tech smart metropolis environments</span>
                </div>
              </div>
            </div>

            {/* Progress pill & Action */}
            <div className="mt-6 pt-5 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <strong className="text-white">{studentProgress.coins}</strong> coins
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <strong className="text-white">{studentRoundsDone}</strong> rounds ({studentProgress.completedCityIds.length} cities)
                </span>
              </div>

              <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 group-hover:from-sky-400 group-hover:to-indigo-400 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all">
                <span>Play Student Mode</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
