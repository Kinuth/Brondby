import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Shield,
  FileCheck2
} from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.detail || 
                     'Invalid username/email or password. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    setError('');
    try {
      await login(u, p);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl p-8 z-10 relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">BRONDBY ENTERPRISES</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Corporate Due Diligence & Investigations Tracking
          </p>
          <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Pan-African Operations Portal
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Username or Staff ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin or worker1"
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
            One-Click Demo Roles
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'AdminPass123!')}
              disabled={loading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">
                  A
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-brand-300">
                    Administrator (Director)
                  </div>
                  <div className="text-[10px] text-slate-400">Full CRUD, Invoices, Clients & Team</div>
                </div>
              </div>
              <span className="text-[10px] text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                ADMIN
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('worker1', 'WorkerPass123!')}
              disabled={loading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center text-xs font-bold">
                  W1
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-brand-300">
                    James Mwangi (Investigator)
                  </div>
                  <div className="text-[10px] text-slate-400">Assigned Jobs only & Status Progression</div>
                </div>
              </div>
              <span className="text-[10px] text-brand-400 font-bold px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                WORKER
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('worker2', 'WorkerPass123!')}
              disabled={loading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                  W2
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-brand-300">
                    Amina Diallo (Investigator)
                  </div>
                  <div className="text-[10px] text-slate-400">Assigned Jobs only & Status Progression</div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                WORKER
              </span>
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500 text-center z-10">
        &copy; {new Date().getFullYear()} Brondby Enterprises Limited. Protected by Role-Based Access Control.
      </p>
    </div>
  );
};
