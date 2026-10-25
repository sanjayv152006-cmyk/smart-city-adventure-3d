import React from 'react';
import { CityLocationInfo } from '../types/game';
import { X, CheckCircle, Lock, Play, Compass, Building, ArrowLeft } from 'lucide-react';
import { soundService } from '../services/sound';

interface LocationDetailsModalProps {
  location: CityLocationInfo | null;
  isUnlocked: boolean;
  onClose: () => void;
  onPlayRound: (round: number) => void;
}

export const LocationDetailsModal: React.FC<LocationDetailsModalProps> = ({
  location,
  isUnlocked,
  onClose,
  onPlayRound,
}) => {
  if (!location) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
        {/* Top Navigation Bar: Back & Close */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-400 font-bold text-xs cursor-pointer transition-all shadow-sm"
            title="Back to City"
            aria-label="Back to City"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Back to City</span>
          </button>
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isUnlocked
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
            }`}
          >
            {isUnlocked ? 'Zone Unlocked' : `Requires Round ${location.id}`}
          </span>
          <span className="text-xs text-slate-400 font-semibold">{location.category}</span>
        </div>

        <h3 className="text-2xl font-black text-white">{location.name}</h3>
        <p className="text-sky-400 font-semibold text-xs sm:text-sm mb-3">{location.subtitle}</p>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
          {location.description}
        </p>

        <div className="mb-6 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Sector Highlights:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {location.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {!isUnlocked && (
            <button
              onClick={() => {
                soundService.playClick();
                onClose();
                onPlayRound(location.id);
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Quiz to Unlock</span>
            </button>
          )}

          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
