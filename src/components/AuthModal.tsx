import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { soundService } from '../services/sound';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  Cloud,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (isNewRegistration?: boolean) => void;
  onPlayAsGuest: () => void;
  isGuestPlaying?: boolean;
}

type AuthTab = 'login' | 'register' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onPlayAsGuest,
  isGuestPlaying = false,
}) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchTab = (newTab: AuthTab) => {
    soundService.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);
    setTab(newTab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.login(email.trim(), password);
      soundService.playCelebration();
      setSuccessMsg('Signed in successfully! Syncing your city progress...');
      setTimeout(() => {
        onLoginSuccess(false);
        onClose();
        resetForm();
      }, 600);
    } catch (err) {
      setErrorMsg(AuthService.getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setErrorMsg('Please enter a username (minimum 2 characters).');
      return;
    }
    if (username.trim().length < 2) {
      setErrorMsg('Username must be at least 2 characters.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.register(email.trim(), password, username.trim());
      soundService.playCelebration();
      setSuccessMsg('Account created! Transferring and syncing your progress...');
      setTimeout(() => {
        onLoginSuccess(true);
        onClose();
        resetForm();
      }, 700);
    } catch (err) {
      setErrorMsg(AuthService.getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter the email associated with your account.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.sendPasswordReset(email.trim());
      soundService.playClick();
      setSuccessMsg('Password reset link sent! Please check your inbox and follow the instructions.');
    } catch (err) {
      setErrorMsg(AuthService.getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setLoading(true);
      await AuthService.signInWithGoogle();
      soundService.playCelebration();
      setSuccessMsg('Signed in with Google! Syncing city progress...');
      setTimeout(() => {
        onLoginSuccess(false);
        onClose();
        resetForm();
      }, 600);
    } catch (err) {
      setErrorMsg(AuthService.getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = () => {
    soundService.playClick();
    AuthService.setGuestMode(true);
    onPlayAsGuest();
    onClose();
    resetForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={() => {
        soundService.playClick();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/25 mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {tab === 'login' && 'Welcome Back, Architect!'}
            {tab === 'register' && 'Create Your Architect Account'}
            {tab === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {tab === 'login' && 'Sign in to sync your smart city progress across all devices'}
            {tab === 'register' && 'Join the adventure, build 50 cities, and safeguard your scores'}
            {tab === 'forgot' && "We'll send you an email to safely reset your password"}
          </p>
        </div>

        {/* Guest Progress Merge Notice (when guest is actively playing) */}
        {isGuestPlaying && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2.5">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-300 leading-tight">
              <strong>Progress Safe:</strong> Your existing unlocked cities, rounds, and coins will be automatically linked to your account!
            </div>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-tight">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200 leading-tight">{successMsg}</div>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@smartcity.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('forgot')}
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google 1-Click Sign In */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-bold">Or</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Switch to Register */}
            <div className="pt-2 text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => handleSwitchTab('register')}
                className="font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* FORM 2: CREATE ACCOUNT */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Username / Architect Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. MayaBuilder"
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@smartcity.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>

            {/* Google 1-Click Sign Up */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-bold">Or</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign Up with Google</span>
            </button>

            {/* Switch to Login */}
            <div className="pt-1.5 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className="font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORM 3: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@smartcity.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className="font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* DIVIDER & GUEST MODE OPTION */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center mb-3">
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Or continue without an account
            </span>
          </div>

          <button
            type="button"
            onClick={handleGuestClick}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Play as Guest</span>
          </button>
          <p className="text-[10px] text-slate-500 mt-1.5 text-center">
            Guest progress is saved locally in your browser. You can link it to an account at any time!
          </p>
        </div>
      </div>
    </div>
  );
};
