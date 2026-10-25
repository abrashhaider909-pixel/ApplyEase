import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { ApplyEaseLogo } from '../common/ApplyEaseLogo';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface LoginPageProps {
  onPublicVerifyClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onPublicVerifyClick }) => {
  const { authenticate } = useApplyEaseStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Small delay for UX continuity; real verification happens below.
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      const result = await authenticate(email, password);
      if (!result.ok) {
        setError(result.error || 'Sign-in failed. Please try again.');
        setIsLoading(false);
      }
      // On success the store flips `isAuthenticated` and App renders the workspace.
    } catch (err: any) {
      setError(`Unexpected error during sign-in: ${err?.message || 'unknown'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-orange-500/20 selection:text-orange-950 font-sans">
      {/* Top Header */}
      <header className="bg-[#172b50] text-white py-2.5 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">APEX STATE UNIVERSITY</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">Central Academic & Administrative Clearance Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {onPublicVerifyClick && (
              <button
                onClick={onPublicVerifyClick}
                className="inline-flex items-center gap-1.5 text-xs text-orange-300 hover:text-white font-medium transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Issued Document</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Single Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Left Hero Panel (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#172b50] via-[#1b3461] to-[#0c172c] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              {/* Logo Lockup */}
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl inline-flex items-center gap-3 border border-white/15">
                <img
                  src="/assets/aistudio/image_133404a9.png"
                  alt="ApplyEase Brand Identity"
                  className="w-10 h-10 object-contain rounded shrink-0 bg-white p-1"
                />
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-white block leading-tight font-sans">
                    Apply<span className="text-[#f4772e]">Ease</span>
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono tracking-wider uppercase block">
                    University Workflow Platform
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                  One Portal for Every University Process
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Students, staff, and administrators — all in one place.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="space-y-2.5">
                {[
                  { icon: '📋', label: 'Dynamic application forms for every service' },
                  { icon: '🔄', label: 'Multi-stage workflow with SLA tracking' },
                  { icon: '✍️', label: 'Electronic signatures & official seals' },
                  { icon: '🛡️', label: 'QR-verified tamper-proof certificates' },
                  { icon: '📊', label: 'Live audit trail & compliance dashboard' },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3 text-xs text-slate-200">
                    <span className="text-base leading-none shrink-0">{f.icon}</span>
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Session Secured with TLS 1.3 & Role-Based Access Control</span>
            </div>
          </div>

          {/* Right Single Login Form Panel (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Sign In
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your assigned university email and password to continue.
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Single Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Email Address:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Password:
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-[#172b50] hover:bg-[#1f3763] disabled:bg-slate-400 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to ApplyEase</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500">
        ApplyEase · Apex State University Records Office · records@apexstate.edu
      </footer>
    </div>
  );
};
