import React from 'react';
import { CITY_LOCATIONS } from '../data/locations';
import {
  Lock,
  CheckCircle,
  Eye,
  X,
  Sparkles,
  MapPin,
  Home,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Trees,
  ShieldAlert,
  Flame,
  Trophy,
  Plane,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { soundService } from '../services/sound';

interface CityMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedLocationIds: number[];
  onSelectAndFocus: (id: number) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5" />,
  GraduationCap: <GraduationCap className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  Trees: <Trees className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Plane: <Plane className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
};

export const CityMapModal: React.FC<CityMapModalProps> = ({
  isOpen,
  onClose,
  unlockedLocationIds,
  onSelectAndFocus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Metropolitan Master Plan
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Smart City Map Directory</h2>
          <p className="text-slate-400 text-sm mt-1">
            Click any unlocked sector to zoom and inspect it in the 3D world. Complete quiz rounds to expand the locked sectors!
          </p>
        </div>

        {/* 10 Zones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CITY_LOCATIONS.map((loc) => {
            const isUnlocked = Array.isArray(unlockedLocationIds) && unlockedLocationIds.includes(loc.id);

            return (
              <div
                key={loc.id}
                onClick={() => {
                  if (isUnlocked) {
                    soundService.playClick();
                    onSelectAndFocus(loc.id);
                    onClose();
                  }
                }}
                className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-slate-800/80 border-emerald-500/50 hover:border-emerald-400 hover:bg-slate-800 cursor-pointer hover:-translate-y-0.5 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-75'
                }`}
              >
                <div>
                  {/* Top pill & status */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {ICON_MAP[loc.iconName] || <Building2 className="w-5 h-5" />}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      Round {loc.id}
                    </span>
                  </div>

                  <h3
                    className={`font-black text-base sm:text-lg ${
                      isUnlocked ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {loc.name}
                  </h3>
                  <div className="text-xs font-semibold text-sky-400/90 mb-2">{loc.subtitle}</div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{loc.description}</p>
                </div>

                {/* Features & Action Footer */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  {isUnlocked ? (
                    <>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active in 3D</span>
                      </span>
                      <span className="flex items-center gap-1 text-sky-300 font-semibold group-hover:text-white">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Focus View</span>
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Pass Round {loc.id} to Build</span>
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
