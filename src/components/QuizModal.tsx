import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Question, GameMode } from '../types/game';
import { CITY_LOCATIONS, ROUND_REWARDS } from '../data/locations';
import { soundService } from '../services/sound';
import {
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Coins,
  X,
  HelpCircle,
} from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
  roundNumber: number;
  questions: Question[];
  onRoundComplete: (round: number, score: number, rewardCoins: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  mode,
  roundNumber,
  questions,
  onRoundComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIdx];
  const location = CITY_LOCATIONS.find((l) => l.id === roundNumber) || CITY_LOCATIONS[0];
  const rewardCoins = ROUND_REWARDS[roundNumber] || 100;
  const isPassed = score >= 4;

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    soundService.playSelect();
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || isSubmitted) return;
    setIsSubmitted(true);

    const isCorrect = selectedOption === currentQ.correctAnswerIndex;
    if (isCorrect) {
      soundService.playCorrect();
      setScore((prev) => prev + 1);
    } else {
      soundService.playIncorrect();
    }
  };

  const handleNext = () => {
    soundService.playClick();
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      // Quiz completed
      setIsFinished(true);
      const finalScore = selectedOption === currentQ.correctAnswerIndex ? score : score;
      if (finalScore >= 4) {
        soundService.playRoundWin();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }
  };

  const handleRetry = () => {
    soundService.playClick();
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setIsFinished(false);
    setIsUnlocking(false);
  };

  const handleFinishAndUnlock = () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    soundService.playUnlock();
    onRoundComplete(roundNumber, score, rewardCoins);
  };

  // Encouraging feedback phrases
  const getEncouragingMessage = () => {
    if (selectedOption === currentQ.correctAnswerIndex) {
      const positive = ['Excellent!', 'Great Job!', 'Correct Answer!', 'Super Smart! 🌟'];
      return positive[currentIdx % positive.length];
    } else {
      const gentle = ['Keep Learning!', 'Good Effort! Try your best on the next one!', 'You are doing great!'];
      return gentle[currentIdx % gentle.length];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col justify-between overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl shadow-sky-950/50">
        {/* Top Navigation Bar: Back to City Button & Close */}
        <div className="flex items-center justify-between w-full mb-3 pb-2.5 border-b border-slate-800 shrink-0">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-400 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
            title="Return to City"
            aria-label="Back to City"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Back to City</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close Quiz"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- ROUND RESULT VIEW --- */}
        {isFinished ? (
          <div className="text-center py-2 sm:py-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border-2 ${
                isPassed
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-xl shadow-emerald-500/20'
                  : 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-xl shadow-amber-500/20'
              }`}
            >
              {isPassed ? <Trophy className="w-8 h-8 sm:w-10 sm:h-10" /> : <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10" />}
            </div>

            <h3 className="text-xl sm:text-3xl font-black text-white mb-1">
              {isPassed ? 'Round Completed! 🎉' : 'Almost There! Keep Learning'}
            </h3>

            <p className="text-slate-300 text-xs sm:text-base max-w-md mx-auto mb-4 sm:mb-6 leading-relaxed">
              {isPassed
                ? `Outstanding! You answered ${score} out of 5 questions correctly and earned the right to build ${location.name}!`
                : `You scored ${score} out of 5. You need at least 4 correct answers to unlock ${location.name}. Don't give up!`}
            </p>

            {/* Score & Rewards Box */}
            <div className="flex justify-center items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700 max-w-md mx-auto mb-6 sm:mb-8">
              <div>
                <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Your Score</div>
                <div className="text-xl sm:text-2xl font-black text-white">{score} / 5</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Coin Reward</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>+{isPassed ? rewardCoins : 0}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              {isPassed ? (
                <button
                  onClick={handleFinishAndUnlock}
                  disabled={isUnlocking}
                  className="w-full py-3 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                  <span>Build {location.name} in 3D City!</span>
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="w-full py-3 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Retry Round with Questions</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* --- ACTIVE QUESTION VIEW --- */
          <div className="flex flex-col flex-1">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pr-8">
              <span className="font-bold text-sky-400 uppercase tracking-wider text-[11px] sm:text-xs truncate max-w-[200px] sm:max-w-none">
                Round {roundNumber} &bull; {location.name}
              </span>
              <span className="font-semibold text-slate-300 text-[11px] sm:text-xs shrink-0">
                Q{currentIdx + 1}/{questions.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 sm:h-2 bg-slate-800 rounded-full mb-4 sm:mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Category tag & Question */}
            <div className="mb-4 sm:mb-6">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] sm:text-[11px] font-semibold text-slate-300 mb-1.5 sm:mb-2">
                {currentQ.category}
              </span>
              <h3 className="text-base sm:text-2xl font-extrabold text-white leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* 4 Large Answer Buttons (Stack vertically on mobile, 2 cols on tablet/desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctAnswerIndex;

                let btnStyles = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-750';

                if (isSelected && !isSubmitted) {
                  btnStyles =
                    mode === 'child'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md shadow-amber-500/10'
                      : 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-md shadow-sky-500/10';
                }

                if (isSubmitted) {
                  if (isCorrect) {
                    btnStyles = 'bg-emerald-500/25 border-emerald-400 text-emerald-200';
                  } else if (isSelected && !isCorrect) {
                    btnStyles = 'bg-rose-500/25 border-rose-400 text-rose-200';
                  } else {
                    btnStyles = 'bg-slate-800/40 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(idx)}
                    className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left font-bold text-xs sm:text-base flex items-center justify-between transition-all duration-200 cursor-pointer min-h-[46px] ${btnStyles}`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-slate-900/60 border border-slate-700/80 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="break-words leading-tight">{opt}</span>
                    </div>

                    {isSubmitted && isCorrect && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />}
                    {isSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Encouragement Card */}
            {isSubmitted && (
              <div
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border animate-fadeIn ${
                  selectedOption === currentQ.correctAnswerIndex
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm mb-1">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{getEncouragingMessage()}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Sticky Accessible Footer Buttons */}
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm pt-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 border-t border-slate-800 flex justify-between items-center gap-2 mt-auto">
              <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                Score: <strong className="text-white">{score}</strong>/{questions.length} <span className="hidden xs:inline">(Need 4 to pass)</span>
              </div>

              {!isSubmitted ? (
                <button
                  disabled={selectedOption === null}
                  onClick={handleSubmit}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[38px] ${
                    selectedOption !== null
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <span>{currentIdx + 1 === questions.length ? 'View Results' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
