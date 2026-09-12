import React, { useState } from 'react';
import {
  Cpu,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('alex.vance@nexus.io');
  const [password, setPassword] = useState('nexus123!');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          throw new Error('Full Name is required');
        }
        await register({
          email: email.trim(),
          password,
          fullName: fullName.trim()
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed. Check popup blockers or credentials.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsRegister(false);
    setIsLoading(true);
    setError(null);
    try {
      await login(quickEmail, quickPass);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden ambient-grid-bg perspective-1000">
      {/* 3D Real-Depth Ambient Lighting Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/20 rounded-full blur-3xl pointer-events-none -z-10 animate-ambient-float" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-xl shadow-blue-500/30 mb-4 border border-white/20 transform hover:rotate-6 transition-transform duration-300">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white flex items-center justify-center space-x-2">
          <span>NEXUS OS</span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            3D SPATIAL
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 font-mono">
          Unified Engineering Operating System & Gemini Multi-Turn AI
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10"
      >
        <div className="glass-panel py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800/90 relative card-depth-3d">
          {/* Top Google Sign-In with Firebase button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full mb-6 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-60 border border-slate-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Connecting to Firebase...' : 'Continue with Google Account'}</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
              <span className="bg-slate-900 px-3 text-slate-400 font-semibold">Or use engineer credentials</span>
            </div>
          </div>

          <div className="flex border-b border-slate-700 pb-3 mb-6">
            <button
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 text-center text-xs font-bold pb-2 transition-colors border-b-2 -mb-3.5 cursor-pointer ${
                !isRegister ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 text-center text-xs font-bold pb-2 transition-colors border-b-2 -mb-3.5 cursor-pointer ${
                isRegister ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Register Engineer
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Vance"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@nexus.internal"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{isLoading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Authenticate Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Roster Demo Credentials */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-700/80">
              <div className="flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Demo Engineers</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { name: 'Alex Vance', role: 'VP of Engineering / Architect', email: 'alex.vance@nexus.io' },
                  { name: 'Sarah Connor', role: 'Lead Systems & DevOps', email: 'sarah.connor@nexus.io' },
                  { name: 'Marcus Chen', role: 'Senior Full-Stack Engineer', email: 'marcus.chen@nexus.io' },
                  { name: 'David Kim', role: 'Backend & Data Engineer', email: 'david.kim@nexus.io' }
                ].map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleQuickLogin(demo.email, 'nexus123!')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 text-left flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {demo.name}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-2 font-mono">({demo.role})</span>
                    </div>
                    <span className="text-[10px] text-blue-400 group-hover:underline">Login →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
