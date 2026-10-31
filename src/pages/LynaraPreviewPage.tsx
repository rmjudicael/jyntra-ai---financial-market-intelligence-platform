import React from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Eye,
  Languages,
  Layers,
  MessageSquare,
  Mic,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LynaraPreviewPageProps {
  onNavigate: (route: string) => void;
  isAuthenticated: boolean;
}

/** Public presentation of LYNARA. The in-platform assistant is LynaraPage. */
export const LynaraPreviewPage: React.FC<LynaraPreviewPageProps> = ({
  onNavigate,
  isAuthenticated,
}) => {
  const { t } = useLanguage();
  const accessRoute = isAuthenticated ? 'jarvis' : 'login';
  const cleanLabel = (value: string) => value.replace(/:\s*$/, '');

  const capabilities = [
    {
      icon: Eye,
      title: t.home.lynaraPoint1Title,
      desc: t.home.lynaraPoint1Desc,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/25',
    },
    {
      icon: Mic,
      title: t.home.lynaraPoint2Title,
      desc: t.home.lynaraPoint2Desc,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/25',
    },
    {
      icon: Languages,
      title: t.home.lynaraPoint3Title,
      desc: t.home.lynaraPoint3Desc,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
    },
    {
      icon: Layers,
      title: t.home.lynaraRoleTitle,
      desc: t.home.lynaraRoleDesc,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/25',
    },
    {
      icon: MessageSquare,
      title: t.home.lynaraInteractionTitle,
      desc: t.home.lynaraInteractionDesc,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/25',
    },
    {
      icon: Cpu,
      title: t.home.lynaraMetaTitle,
      desc: t.home.lynaraMetaDesc,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/25',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#080B10] light:bg-slate-50">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.08),transparent_55%)]"
      />

      {/* Hero */}
      <section className="relative pt-16 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 text-center lg:text-left space-y-6 jyntra-enter">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 text-[11px] font-black font-mono uppercase tracking-[0.2em]">
              <Bot className="w-3.5 h-3.5" />
              {t.home.lynaraBadge}
            </div>

            <div className="space-y-3">
              <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.3em] text-slate-500">
                {t.extra.lynaraPreviewTitle}
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white dark:text-white light:text-slate-900">
                LYNA<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400">RA</span>
              </h1>
              <p className="text-lg sm:text-xl font-bold text-cyan-400 font-mono">
                {t.slogan}
              </p>
            </div>

            <p className="text-base sm:text-lg text-slate-300 light:text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 text-pretty">
              {t.home.lynaraSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => onNavigate(accessRoute)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {t.extra.accessLynaraBtn}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 text-white border border-slate-700/80 font-bold text-sm transition-all light:bg-white light:text-slate-800 light:border-slate-300 light:hover:bg-slate-100"
              >
                {t.nav.home}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
              {[t.home.lynaraPoint1Title, t.home.lynaraPoint2Title, t.home.lynaraPoint3Title].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 light:border-slate-200 light:bg-white light:text-slate-600"
                >
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  {cleanLabel(label)}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 jyntra-enter jyntra-enter-2">
            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 group">
              <img
                src="/assets/jarvis-hologram.jpg"
                alt="LYNARA, assistante virtuelle holographique de JYNTRA AI"
                className="w-full h-auto object-cover transform group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent opacity-90" />

              <div className="absolute top-4 left-4 keep-white flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-cyan-500/30 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-cyan-400 opacity-70 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-cyan-400" />
                </span>
                {t.home.lynaraBadge}
              </div>

              <div className="absolute bottom-4 left-4 right-4 keep-white p-4 rounded-2xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-md">
                <div className="text-[11px] font-black text-white uppercase tracking-wider">LYNARA · JYNTRA AI</div>
                <div className="mt-1 text-[10px] text-cyan-300/90 font-mono">
                  {t.home.lynaraHonesty}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 border-y border-slate-800/80 bg-[#06090E] light:bg-white light:border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12 jyntra-enter jyntra-enter-1">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400 jyntra-enter">
              <Brain className="w-4 h-4" />
              {t.home.lynaraBadge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white dark:text-white light:text-slate-900 text-balance">
              {t.home.lynaraTitle}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {capabilities.map((item, index) => (
              <article
                key={item.title}
                className={`group rounded-2xl border ${item.border} bg-slate-900/60 p-5 sm:p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/90 light:bg-white light:border-slate-200 light:hover:bg-white light:shadow-lg light:shadow-slate-200/60 jyntra-enter jyntra-enter-${index + 2}`}
              >
                <div className={`w-11 h-11 rounded-xl ${item.bg} ${item.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white dark:text-white light:text-slate-900">
                  {cleanLabel(item.title)}
                </h3>
                <p className="mt-2.5 text-[12px] leading-relaxed text-slate-400 light:text-slate-600">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 light:border-cyan-200 light:bg-cyan-50/70">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-slate-400 light:text-slate-600">
              {t.home.lynaraHonestyNote}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-950/90 p-8 sm:p-12 text-center light:from-cyan-50 light:via-white light:to-slate-50 light:border-cyan-200 jyntra-enter jyntra-enter-3">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
          />
          <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-6">
            <Bot className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white dark:text-white light:text-slate-900 text-balance">
            {t.slogan}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
            {t.extra.lynaraPreviewSubtitle}
          </p>
          <button
            onClick={() => onNavigate(accessRoute)}
            className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5"
          >
            {t.extra.accessLynaraBtn}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
