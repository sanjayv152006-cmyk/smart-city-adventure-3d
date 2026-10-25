import React from 'react';
import { Play, HelpCircle, Trophy, Volume2, VolumeX, Music, Settings } from 'lucide-react';
import { soundService } from '../services/sound';

interface WelcomeScreenProps {
  onPlayClick: () => void;
  onHowToPlayClick: () => void;
  onProgressClick: () => void;
  sfxEnabled: boolean;
  musicEnabled?: boolean;
  onToggleSfx: () => void;
  onToggleMusic?: () => void;
  onOpenSettings?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onPlayClick,
  onHowToPlayClick,
  onProgressClick,
  sfxEnabled,
  musicEnabled,
  onToggleSfx,
  onToggleMusic,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-6 md:p-10 pointer-events-none z-10 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60 overflow-y-auto">
      {/* Top Header Controls */}
      <div className="flex justify-end items-center w-full max-w-6xl mx-auto pointer-events-auto shrink-0">
        <div className="flex items-center gap-2">
          {/* Background Music Toggle */}
          {onToggleMusic && (
            <button
              onClick={() => {
                soundService.playClick();
                onToggleMusic();
              }}
              className={`p-2.5 sm:p-3 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${
                musicEnabled
                  ? 'bg-emerald-600 text-white border border-emerald-400/50 shadow-emerald-500/20'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700 hover:text-white'
              }`}
              title={musicEnabled ? 'Turn Off Background Music' : 'Turn On Background Music'}
            >
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Sound Effects Toggle */}
          <button
            onClick={() => {
              soundService.playClick();
              onToggleSfx();
            }}
            className={`p-2.5 sm:p-3 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${
              sfxEnabled
                ? 'bg-sky-600 text-white border border-sky-400/50 shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-400 border border-slate-700 hover:text-white'
            }`}
            title={sfxEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={() => {
                soundService.playClick();
                onOpenSettings();
              }}
              className="p-2.5 sm:p-3 rounded-full backdrop-blur-md bg-slate-900/80 text-slate-300 border border-slate-700 hover:text-white hover:border-sky-400 transition-all shadow-md cursor-pointer"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Center Hero Banner */}
      <div className="w-full max-w-3xl mx-auto text-center pointer-events-auto my-auto py-2">
        <div className="inline-block mb-2 sm:mb-3 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-sm font-semibold tracking-wide">
          🏗️ 10 Progressive Rounds &bull; 100 Quizzes
        </div>

        <h1 className="text-3xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-sky-300 to-emerald-300 tracking-tight drop-shadow-md">
          QUIZ TO BUILD
        </h1>
        <h2 className="text-lg sm:text-3xl md:text-4xl font-extrabold text-white mt-0.5 sm:mt-1 tracking-wide drop-shadow">
          SMART CITY ADVENTURE
        </h2>

        <p className="text-sky-100/90 text-xs sm:text-lg md:text-xl font-medium mt-2 sm:mt-4 max-w-2xl mx-auto drop-shadow-sm leading-relaxed px-2">
          &ldquo;Learn Something New. Complete Challenges. Build Your Dream City!&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 mt-6 sm:mt-10 px-2 sm:px-0">
          <button
            onClick={() => {
              soundService.playClick();
              onPlayClick();
            }}
            className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-base sm:text-lg font-black tracking-wide shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 sm:gap-3 border border-emerald-300/40 cursor-pointer min-h-[48px]"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            <span>PLAY GAME</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onHowToPlayClick();
            }}
            className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 text-sm sm:text-base font-bold shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-700/80 cursor-pointer min-h-[44px]"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            <span>How to Play</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onProgressClick();
            }}
            className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 text-sm sm:text-base font-bold shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-700/80 cursor-pointer min-h-[44px]"
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span>City Progress</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="w-full text-center text-xs sm:text-sm text-sky-200/70 font-medium pointer-events-none">
        Drag to rotate 3D camera &bull; Scroll to zoom &bull; Click buildings to inspect
      </div>
    </div>
  );
};
