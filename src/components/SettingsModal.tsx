import React, { useState } from 'react';
import { GameMode, GameProgress } from '../types/game';
import { ALL_50_CITIES } from '../data/cities';
import { CITY_LOCATIONS } from '../data/locations';
import { soundService } from '../services/sound';
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  Music,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Check,
  Trophy,
  Coins,
  Globe,
  Sliders,
  MapPin,
  Gift,
  Compass,
  Eye,
  ArrowLeft,
  Home,
  LogOut,
  LogIn,
  User,
  UserCheck,
  Cloud,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoHome?: () => void;
  // 3D Camera & View Controls moved from bottom dock
  onResetCamera?: () => void;
  onFocusLocation?: (id: number) => void;
  targetRoundNumber?: number;
  targetZoneId?: number;
  targetZoneName?: string;
  // Environment (Night mode toggle)
  isNight: boolean;
  onToggleNight: () => void;
  // Audio (Sound & Music On/Off toggles + sliders)
  musicEnabled: boolean;
  onToggleMusic: () => void;
  musicVolume: number;
  onChangeMusicVolume: (val: number) => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  sfxVolume: number;
  onChangeSfxVolume: (val: number) => void;
  // Learning Level / Mode
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  // Display & Graphics
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  graphicsQuality: 'low' | 'medium' | 'high';
  onChangeGraphicsQuality: (q: 'low' | 'medium' | 'high') => void;
  // Progress Info
  progress: GameProgress;
  // Reset Progress
  onResetProgress: () => void;
  // Navigation & Directories
  onOpenWorldMap?: () => void;
  onOpenMap?: () => void;
  onOpenRewards?: () => void;
  // User Profile & Authentication
  userProfile?: { id: string; username: string; email: string } | null;
  isGuest?: boolean;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onGoHome,
  onResetCamera,
  onFocusLocation,
  targetRoundNumber,
  targetZoneId,
  targetZoneName,
  isNight,
  onToggleNight,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onChangeMusicVolume,
  sfxEnabled,
  onToggleSfx,
  sfxVolume,
  onChangeSfxVolume,
  currentMode,
  onSelectMode,
  isFullscreen,
  onToggleFullscreen,
  graphicsQuality,
  onChangeGraphicsQuality,
  progress,
  onResetProgress,
  onOpenWorldMap,
  onOpenMap,
  onOpenRewards,
  userProfile,
  isGuest = false,
  onOpenAuth,
  onLogout,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const currentCityDef =
    ALL_50_CITIES.find((c) => c.id === progress.currentCityId) || ALL_50_CITIES[0];
  const rawCityProg = progress.cityProgress?.[progress.currentCityId];
  const curCityProg = {
    completedRounds: Array.isArray(rawCityProg?.completedRounds) ? rawCityProg.completedRounds : [],
    unlockedLocations: Array.isArray(rawCityProg?.unlockedLocations) ? rawCityProg.unlockedLocations : [],
  };

  const activeRound =
    targetRoundNumber ??
    ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((r) => !curCityProg.completedRounds.includes(r)) || 10);
  const activeZone =
    CITY_LOCATIONS.find((l) => l.id === (targetZoneId ?? activeRound)) || CITY_LOCATIONS[0];
  const zoneName = targetZoneName || activeZone.name;

  let totalRoundsCompleted = 0;
  if (progress.cityProgress && typeof progress.cityProgress === 'object') {
    Object.values(progress.cityProgress).forEach((cp) => {
      if (cp && Array.isArray(cp.completedRounds)) {
        totalRoundsCompleted += cp.completedRounds.length;
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={() => {
        soundService.playClick();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 hover:border-sky-400 transition-all text-xs font-bold cursor-pointer shrink-0"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">Game Settings & Controls</h2>
              <p className="text-slate-400 text-xs hidden sm:block">View modes, audio, environment, theme & game data</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onGoHome && (
              <button
                onClick={() => {
                  soundService.playClick();
                  onClose();
                  onGoHome();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 hover:border-amber-400 transition-all text-xs font-bold cursor-pointer"
                title="Return to Main Menu (Home)"
                aria-label="Home"
              >
                <Home className="w-4 h-4 text-amber-400" />
                <span>Home</span>
              </button>
            )}
            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close Settings"
              aria-label="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Settings Sections */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* SECTION: ARCHITECT ACCOUNT & CLOUD PROGRESS SYNC */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-850 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-sky-400" />
                <span>Architect Account & Cloud Sync</span>
              </div>
              {userProfile ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  <Cloud className="w-3 h-3" />
                  <span>Cloud Synced</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  <User className="w-3 h-3" />
                  <span>Guest Mode (Local)</span>
                </span>
              )}
            </div>

            {userProfile ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-750">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow-md shadow-sky-500/20">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-white truncate">{userProfile.username}</span>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{userProfile.email}</div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      soundService.playClick();
                      onLogout();
                    }}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    title="Sign out of your account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span>Guest Architect</span>
                    <span className="text-[10px] font-normal text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Local Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Progress is saved in this browser. Sign in or create an account to back up and sync your 50 cities across devices!
                  </p>
                </div>

                {onOpenAuth && (
                  <button
                    onClick={() => {
                      soundService.playClick();
                      onOpenAuth();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 hover:from-sky-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In / Save</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SECTION 1: 3D VIEW & CAMERA CONTROLS (Moved from bottom dock) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 mb-3 text-sky-300 font-bold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>3D Camera & View Controls</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* View Mode: Overview */}
              <button
                onClick={() => {
                  soundService.playClick();
                  if (onResetCamera) onResetCamera();
                  onClose();
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-sky-400 text-left transition-all cursor-pointer group"
                title="Reset Camera to broad Overview Angle"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white group-hover:text-sky-300">View Mode</div>
                  <div className="text-[11px] font-bold text-sky-400 truncate">Overview</div>
                </div>
              </button>

              {/* Focus: R{activeRound} */}
              <button
                onClick={() => {
                  soundService.playClick();
                  if (onFocusLocation) onFocusLocation(activeZone.id);
                  onClose();
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all cursor-pointer group"
                title={`Focus Camera on Round ${activeRound} (${zoneName})`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white group-hover:text-emerald-300">
                    Focus: R{activeRound}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-400 truncate">
                    {zoneName}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: ENVIRONMENT & ATMOSPHERE */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 mb-3 text-amber-300 font-bold text-xs uppercase tracking-wider">
              {isNight ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>Environment & Theme</span>
            </div>

            <div className="space-y-3">
              {/* Environment: Night mode toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    {isNight ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    <span>Environment: {isNight ? 'Night Mode' : 'Day Mode'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isNight ? 'Nocturnal lighting with smart city streetlights' : 'Sunny daylight atmosphere'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundService.playClick();
                    onToggleNight();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isNight
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-400/50 shadow-md shadow-indigo-600/20'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-md shadow-amber-500/10'
                  }`}
                  title={isNight ? 'Switch to Day Light' : 'Switch to City Night Light'}
                >
                  {isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{isNight ? 'Night: ON' : 'Night: OFF'}</span>
                </button>
              </div>

              {/* 3D Graphics Quality */}
              <div className="flex flex-col gap-1.5 pt-2.5 border-t border-slate-750">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
                  <span>3D Graphics Quality</span>
                  <span className="text-xs text-slate-400 capitalize">{graphicsQuality}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['low', 'medium', 'high'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        soundService.playClick();
                        onChangeGraphicsQuality(q);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer text-center ${
                        graphicsQuality === q
                          ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fullscreen View */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-750">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  {isFullscreen ? <Minimize className="w-4 h-4 text-teal-400" /> : <Maximize className="w-4 h-4 text-teal-400" />}
                  <span>Fullscreen View</span>
                </div>
                <button
                  onClick={() => {
                    soundService.playClick();
                    onToggleFullscreen();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isFullscreen
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-400/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                  }`}
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: AUDIO CONTROLS (Sound & Music On/Off toggles) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 mb-3 text-sky-300 font-bold text-xs uppercase tracking-wider">
              <Music className="w-4 h-4 text-sky-400" />
              <span>Audio Controls</span>
            </div>

            <div className="space-y-3.5">
              {/* Sound: On/Off Toggle + Volume */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    {sfxEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span>Sound Effects</span>
                  </div>
                  <button
                    onClick={() => {
                      soundService.playClick();
                      onToggleSfx();
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      sfxEnabled
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                        : 'bg-slate-700/70 text-slate-400 border border-slate-600'
                    }`}
                  >
                    {sfxEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {sfxEnabled && (
                  <div className="flex items-center gap-3 pl-6">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(sfxVolume * 100)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) / 100;
                        onChangeSfxVolume(val);
                      }}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                    <span className="text-xs font-bold text-slate-400 w-9 text-right">
                      {Math.round(sfxVolume * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Background Music: On/Off Toggle + Volume */}
              <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <span>Background Music</span>
                  </div>
                  <button
                    onClick={() => {
                      soundService.playClick();
                      onToggleMusic();
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      musicEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-slate-700/70 text-slate-400 border border-slate-600'
                    }`}
                  >
                    {musicEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {musicEnabled && (
                  <div className="flex items-center gap-3 pl-6">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(musicVolume * 100)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) / 100;
                        onChangeMusicVolume(val);
                      }}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <span className="text-xs font-bold text-slate-400 w-9 text-right">
                      {Math.round(musicVolume * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: CITY DIRECTORIES & REWARDS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 mb-3 text-sky-300 font-bold text-xs uppercase tracking-wider">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>City Exploration & Directories</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* World Map Button */}
              {onOpenWorldMap && (
                <button
                  onClick={() => {
                    soundService.playClick();
                    onClose();
                    onOpenWorldMap();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white group-hover:text-sky-200">50 Cities</div>
                    <div className="text-[10px] text-sky-300/80 truncate">World Tour Map</div>
                  </div>
                </button>
              )}

              {/* City Map Button */}
              {onOpenMap && (
                <button
                  onClick={() => {
                    soundService.playClick();
                    onClose();
                    onOpenMap();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white group-hover:text-emerald-200">City Map</div>
                    <div className="text-[10px] text-emerald-300/80 truncate">10 Zone Plan</div>
                  </div>
                </button>
              )}

              {/* Rewards Button */}
              {onOpenRewards && (
                <button
                  onClick={() => {
                    soundService.playClick();
                    onClose();
                    onOpenRewards();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-pink-950/50 hover:bg-pink-900/70 border border-pink-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white group-hover:text-pink-200">Rewards</div>
                    <div className="text-[10px] text-pink-300/80 truncate">Treasury & Badges</div>
                  </div>
                </button>
              )}

              {/* Main Menu (Home) Button */}
              {onGoHome && (
                <button
                  onClick={() => {
                    soundService.playClick();
                    onClose();
                    onGoHome();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white group-hover:text-amber-200">Main Menu</div>
                    <div className="text-[10px] text-amber-300/80 truncate">Home Screen</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 5: LEARNING LEVEL / GAME MODE */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Learning Level / Mode</span>
              </div>
              <span className="text-[11px] font-extrabold capitalize text-slate-300">
                Current: <strong className={currentMode === 'child' ? 'text-amber-400' : 'text-sky-400'}>{currentMode} Mode</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  if (currentMode !== 'child') {
                    soundService.playClick();
                    onSelectMode('child');
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  currentMode === 'child'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-300 uppercase">Child Mode</span>
                  {currentMode === 'child' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-300 leading-tight">Ages 6–11. Friendly, foundational questions.</p>
              </button>

              <button
                onClick={() => {
                  if (currentMode !== 'student') {
                    soundService.playClick();
                    onSelectMode('student');
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  currentMode === 'student'
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10'
                    : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-sky-300 uppercase">Student Mode</span>
                  {currentMode === 'student' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <p className="text-[11px] text-slate-300 leading-tight">Ages 12+. Smart city science & engineering.</p>
              </button>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 italic">
              * Progress is saved independently for Child and Student modes.
            </div>
          </div>

          {/* SECTION 6: GAME PROGRESS & ACHIEVEMENTS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 mb-3 text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Trophy & Progress Statistics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-750">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Current City</div>
                <div className="text-xs sm:text-sm font-black text-white truncate">
                  #{currentCityDef.id} {currentCityDef.name}
                </div>
                <div className="text-[10px] text-sky-400/80">Round {curCityProg.completedRounds.length}/10</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-750">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Score</div>
                <div className="text-xs sm:text-sm font-black text-indigo-300 flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{progress.totalCorrectAnswers * 20}</span>
                </div>
                <div className="text-[10px] text-indigo-400/80">{progress.totalCorrectAnswers} Correct Answers</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-750">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Treasury</div>
                <div className="text-xs sm:text-sm font-black text-amber-400 flex items-center justify-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{progress.coins}</span>
                </div>
                <div className="text-[10px] text-amber-400/80">Available Coins</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-750">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">World Rounds</div>
                <div className="text-xs sm:text-sm font-black text-emerald-300">
                  {totalRoundsCompleted} / 500
                </div>
                <div className="text-[10px] text-emerald-400/80">{Math.round((totalRoundsCompleted / 500) * 100)}% Global Progress</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-750">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Cities Unlocked</div>
                <div className="text-xs sm:text-sm font-black text-sky-300">
                  {progress.unlockedCityIds.length} / 50
                </div>
                <div className="text-[10px] text-sky-400/80">{progress.completedCityIds.length} Fully Completed</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-750">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Quizzes</div>
                <div className="text-xs sm:text-sm font-black text-purple-300">
                  {progress.totalQuestionsAnswered}
                </div>
                <div className="text-[10px] text-purple-400/80">Questions Answered</div>
              </div>
            </div>
          </div>

          {/* SECTION 7: DANGER ZONE / RESET PROGRESS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/25 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Reset Game Data</span>
            </div>
            <p className="text-slate-300 text-xs mb-3 leading-relaxed">
              Reset completed rounds, buildings, and scores for{' '}
              <strong className="text-rose-400 capitalize">{currentMode} Mode</strong>. Other settings and modes will remain safe.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => {
                  soundService.playClick();
                  setShowResetConfirm(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset {currentMode === 'child' ? 'Child' : 'Student'} Mode Progress</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/60 animate-fadeIn">
                <p className="text-rose-300 text-xs font-bold mb-2">
                  ⚠️ Are you sure? All {currentMode} mode rounds will be reset to Round 1!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      soundService.playClick();
                      setShowResetConfirm(false);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      soundService.playClick();
                      setShowResetConfirm(false);
                      onResetProgress();
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
                  >
                    Yes, Reset Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Done Button */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
