import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { AUTH_ERROR_KEYS } from '../i18n/authErrors';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: string) => void;
  onLoginSuccess: () => void;
  initialEmail?: string;
  registrationSuccessMsg?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
  initialEmail = '',
  registrationSuccessMsg = null,
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(registrationSuccessMsg);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (registrationSuccessMsg) setSuccessNotice(registrationSuccessMsg);
  }, [initialEmail, registrationSuccessMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t.auth.errFillAll);
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.login(email, password);
      if (result.success) {
        setError(null);
        onLoginSuccess();
      } else {
        setError(result.code ? t.auth[AUTH_ERROR_KEYS[result.code]] : t.auth.errLoginGeneric);
      }
    } catch {
      setError(t.auth.errLoginGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B10] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 space-y-4">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-3 group focus:outline-none"
        >
          <img
            src="/Logo.png"
            alt="JYNTRA AI Logo"
            className="w-12 h-12 object-contain rounded-xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform"
          />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight">{t.auth.loginTitle}</h2>
        <p className="text-sm text-slate-400">
          {t.auth.loginSubtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-slate-900/80 border border-slate-800/80 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl backdrop-blur-xl">
          {/* Success Banner if redirected from registration */}
          {successNotice && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold">{t.extra.accountCreated}</strong>
                {successNotice}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.auth.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.auth.loginBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              {t.auth.noAccount}{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-orange-400 font-bold hover:underline"
              >
                {t.auth.createAccountLink}
              </button>
            </p>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-500 leading-snug">
            <strong>{t.extra.securityStrong}</strong> {t.auth.securityNotice}
          </div>
        </div>
      </div>
    </div>
  );
};
