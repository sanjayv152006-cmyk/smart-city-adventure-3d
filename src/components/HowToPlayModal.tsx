import React from 'react';
import { HelpCircle, CheckCircle, Trophy, MapPin, Compass, X, Sparkles, ArrowLeft } from 'lucide-react';
import { soundService } from '../services/sound';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            Game Guide &amp; Rules
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">How to Play &amp; Build</h2>
          <p className="text-slate-400 text-sm mt-1">
            Build your futuristic smart city from the ground up through knowledge and challenges!
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-4 text-sm text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Choose Child Mode or Student Mode</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Child mode features fun topics like animals, colors, shapes, and fruits. Student mode explores computer hardware, science, mathematics, coding, and future smart cities.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Answer 5 Questions Per Round (4/5 to Pass)</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Each round has 5 multiple-choice questions. Score at least 4 out of 5 to successfully complete the round and unlock the next zone! If you fail, you can retry immediately.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Watch Your 3D City Expand in Real Time</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Completing each round permanently constructs a brand new zone (Suburbs, Schools, Hospitals, Shopping, Central Park, Airport, and the Cyber City Center) into one connected 3D metropolis!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 font-black flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Explore the 3D City Freely</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Left-click &amp; drag to rotate the camera. Scroll mouse wheel or pinch to zoom. Click any building to focus on it. Toggle Day/Night lighting or relax with procedural ambient music!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            Got it, Let&apos;s Play!
          </button>
        </div>
      </div>
    </div>
  );
};
