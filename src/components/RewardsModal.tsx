import React from 'react';
import { GameProgress } from '../types/game';
import { CITY_LOCATIONS, ROUND_REWARDS } from '../data/locations';
import { Coins, Trophy, CheckCircle, Lock, Gift, X, Sparkles, Building, ArrowLeft } from 'lucide-react';
import { soundService } from '../services/sound';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: GameProgress;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  progress,
}) => {
  if (!isOpen) return null;

  const totalPossibleRewardCoins = Object.values(ROUND_REWARDS).reduce((a, b) => a + b, 0);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
        {/* Top Navigation Bar: Back & Close */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-400 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
            title="Back to City"
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Gift className="w-4 h-4 text-amber-400" />
            Treasury &amp; Milestones
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">City Rewards &amp; Badges</h2>
          <p className="text-slate-400 text-sm mt-1">
            Complete each round with at least 4/5 correct answers to unlock permanent coin bonuses and landmarks!
          </p>
        </div>

        {/* Global Summary Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center">
            <Coins className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-black text-white">{progress.coins}</div>
            <div className="text-[11px] text-amber-300/80 uppercase font-semibold">Coins Balance</div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-center">
            <Trophy className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <div className="text-xl font-black text-white">{progress.totalCorrectAnswers * 20}</div>
            <div className="text-[11px] text-indigo-300/80 uppercase font-semibold">Total Score</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-xl font-black text-white">
              {curCityProg.completedRounds.length} / 10
            </div>
            <div className="text-[11px] text-emerald-300/80 uppercase font-semibold">City Rounds Won</div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-center">
            <Building className="w-5 h-5 text-sky-400 mx-auto mb-1" />
            <div className="text-xl font-black text-white">
              {progress.completedCityIds.length} / 50
            </div>
            <div className="text-[11px] text-sky-300/80 uppercase font-semibold">Cities Mastered</div>
          </div>
        </div>

        {/* 10 Rounds Rewards Table */}
        <div className="space-y-2.5">
          {CITY_LOCATIONS.map((loc) => {
            const reward = ROUND_REWARDS[loc.id];
            const isCompleted = curCityProg.completedRounds.includes(loc.id);
            const isClaimed = curCityProg.claimedRewards.includes(loc.id);

            return (
              <div
                key={loc.id}
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isCompleted
                    ? 'bg-slate-800/80 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                      isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    R{loc.id}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isCompleted ? 'text-white' : 'text-slate-300'}`}>
                      {loc.name}
                    </h4>
                    <span className="text-xs text-slate-400">{loc.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-black text-sm text-amber-400">
                      <Coins className="w-4 h-4" />
                      <span>+{reward}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {isClaimed ? 'Claimed' : 'Reward'}
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-xs font-semibold border border-slate-700">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </span>
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
