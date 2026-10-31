import React, { useEffect, useState } from 'react';
import { Hero3DScene } from '../components/3d/Hero3DScene';
import { AlgorithmicAdvantage3D } from '../components/3d/AlgorithmicAdvantage3D';
import { MetaHackathon3D } from '../components/3d/MetaHackathon3D';
import { DemoVideoSection } from '../components/home/DemoVideoSection';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ArrowRight,
  Shield,
  Cpu,
  Trophy,
  Eye,
  TrendingUp,
  Bot,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  BarChart2,
  FileCheck2,
  Compass,
  Mic,
  Languages,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  Newspaper,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [tickers, setTickers] = useState<any[]>([]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-visible')); return; }
    const obs = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); } }), { threshold: 0.12 });
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch('/api/market/ticker')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.tickers) setTickers(d.tickers);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#080B10] text-slate-100">
      {/* 1. Real Ticker Tape: fixed label, only quotes scroll left in a seamless loop */}
      <div className="bg-[#05070B] border-b border-slate-800/80 py-2 text-xs font-mono flex items-stretch overflow-hidden">
        <div className="flex items-center gap-1.5 text-orange-400 font-bold shrink-0 px-4 bg-[#05070B] z-10 border-r border-slate-800/80">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          {t.home.liveTicker}
        </div>
        <div className="overflow-hidden flex-1 whitespace-nowrap">
          {tickers.length > 0 ? (
            <div className="jyntra-ticker-track items-center gap-6 py-0.5">
              {[...tickers, ...tickers].map((tItem, i) => (
                <span key={tItem.symbol + '-' + i} className="inline-flex items-center gap-2 shrink-0">
                  <span className="text-slate-300 font-semibold">{tItem.symbol}</span>
                  <span className="text-slate-100 font-bold">${tItem.price?.toLocaleString()}</span>
                  <span className={`text-[11px] font-bold ${(tItem.changePercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tItem.changePercent == null ? '—' : `${tItem.changePercent >= 0 ? '+' : ''}${tItem.changePercent?.toFixed(2)}%`}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 px-4">{t.home.liveTickerLoading}</span>
          )}
        </div>
      </div>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left jyntra-enter">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              {t.home.badge}
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              JYNTRA <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400">AI</span>
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-orange-400 font-mono">
              {t.slogan}
            </p>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {t.home.heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 text-base"
              >
                <span>{t.home.startFree}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => onNavigate('features')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center justify-center gap-2 text-base"
              >
                <span>{t.home.explore}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Highlights bullet points */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.home.noFakeData}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{t.home.protectedStorage}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{t.home.lynaraVoice}</span>
              </div>
            </div>
          </div>

          {/* Right 3D Visualizer */}
          <div className="lg:col-span-5 relative flex items-center justify-center jyntra-enter jyntra-enter-2">
            <div className="w-full rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-800/80 p-2 shadow-2xl relative">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-orange-500/30 text-[11px] font-mono text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                MARKETVERSE
              </div>
              <Hero3DScene />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Meta Global AI Developer Hackathon 2026 Section */}
      <section
        data-reveal
        className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#06090E] relative isolate overflow-hidden"
      >
        <MetaHackathon3D className="opacity-60 meta-3d" />
        <div
          className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_left,rgba(37,99,235,0.18),transparent_65%)]"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] sm:text-xs font-bold tracking-wide">
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                META GLOBAL AI DEVELOPER HACKATHON 2026
              </div>

              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                JYNTRA AI au cœur de l'innovation IA
              </h3>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                JYNTRA AI est le projet que je développe pour le{' '}
                <strong className="text-white">Meta Global AI Developer Hackathon 2026</strong>. Il explore
                comment les modèles d'intelligence artificielle peuvent accompagner l'analyse des marchés
                financiers : analyse graphique multimodale, arbitrage collégial entre agents IA et assistante
                vocale interactive.
              </p>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Le projet implémente des fonctionnalités concrètes : vision multimodale pour l'analyse de
                graphiques MT4/MT5, consensus multi-agents contradictoire avec audit de risque, gestion
                mathématique du capital, workflow traçable de bout en bout, et LYNARA, une assistante
                conversationnelle multilingue qui détecte la langue de l'utilisateur et lui répond dans
                cette langue.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { label: 'Vision multimodale', icon: Eye },
                  { label: 'Multi-agents', icon: Layers },
                  { label: 'Gestion du risque', icon: Shield },
                  { label: 'Voix multilingue', icon: Bot },
                ].map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 backdrop-blur-sm px-2.5 py-2"
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-300 leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-700/80 backdrop-blur-sm">
                <img
                  src="/assets/meta-logo.svg"
                  alt="Meta"
                  className="meta-logo h-7 sm:h-8 w-auto object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />
                <div className="text-[11px] leading-snug">
                  <div className="font-bold text-white">Projet soumis au hackathon</div>
                  <div className="text-slate-400">Meta Global AI Developer Hackathon 2026</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                Projet présenté dans le cadre du Meta Global AI Developer Hackathon 2026 : une
                plateforme complète d’intelligence de marché, pensée pour des décisions traçables.
              </p>
            </div>

            <div className="lg:col-span-5 hidden lg:flex items-center justify-center pointer-events-none">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/25 via-cyan-400/20 to-orange-500/15 blur-3xl" />
                <div className="relative rounded-2xl border border-blue-500/25 bg-slate-950/50 backdrop-blur-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300">
                      Hackathon 2026
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <img
                    src="/assets/meta-logo.svg"
                    alt="Logo officiel Meta"
                    className="meta-logo h-9 w-auto object-contain"
                    loading="lazy"
                  />
                  <div className="h-px bg-gradient-to-r from-blue-500/50 via-cyan-400/30 to-transparent" />
                  <ul className="space-y-2 text-[11px] text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-px" />
                      Analyse graphique assistée par IA multimodale
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-px" />
                      Workflow d'analyse traçable et persistant
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-px" />
                      Assistance vocale dans la langue détectée
                    </li>
                  </ul>
                  <div className="pt-1 text-[10px] text-slate-500 font-mono">
                    Données de marché réelles · Aucune donnée simulée
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Algorithmic advantage: 3D animation strictly as section background */}
      <section data-reveal className="relative isolate py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#06090E] overflow-hidden">
        {/* Background only: behind title, text and cards; never interactive */}
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <AlgorithmicAdvantage3D className="opacity-45" />
        </div>

        <div className="max-w-7xl mx-auto space-y-12 relative z-10 pointer-events-none">
          <div className="text-center max-w-3xl mx-auto space-y-4 pointer-events-auto">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-orange-500">
              {t.home.algoAdvantageBadge}
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              {t.home.algoAdvantageTitle}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base">
              {t.home.algoAdvantageSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pointer-events-auto">
            {[
              { icon: Eye, title: t.home.featureVisionTitle, desc: t.home.featureVisionDesc, color: 'text-cyan-400', border: 'border-cyan-500/30' },
              { icon: Layers, title: t.home.featureAgentsTitle, desc: t.home.featureAgentsDesc, color: 'text-orange-400', border: 'border-orange-500/30' },
              { icon: Shield, title: t.home.featureRiskTitle, desc: t.home.featureRiskDesc, color: 'text-emerald-400', border: 'border-emerald-500/30' },
              { icon: Bot, title: t.home.featureLynaraTitle, desc: t.home.featureLynaraDesc, color: 'text-cyan-300', border: 'border-cyan-500/30' },
              { icon: BarChart2, title: t.home.featureBacktestTitle, desc: t.home.featureBacktestDesc, color: 'text-amber-400', border: 'border-amber-500/30' },
              { icon: Lock, title: t.home.featurePrivacyTitle, desc: t.home.featurePrivacyDesc, color: 'text-blue-400', border: 'border-blue-500/30' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-slate-900/80 backdrop-blur-md border ${item.border} hover:bg-slate-900/95 transition-all hover:scale-[1.01] shadow-xl space-y-4`}
              >
                <div className={`w-12 h-12 rounded-xl bg-slate-800/90 flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">{item.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4b. Section LYNARA */}
      <section data-reveal className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#080B10] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_left,rgba(6,182,212,0.14),transparent_55%)]"
        />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <div className="lg:col-span-5 relative order-1 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 group">
              <img
                src="/assets/jarvis-hologram.jpg"
                alt="LYNARA, assistante virtuelle holographique féminine de JYNTRA AI"
                className="w-full h-auto object-cover transform group-hover:scale-[1.03] transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent opacity-90" />

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-md keep-white">
                <div className="flex items-center gap-3">
                  <span className="relative flex w-3 h-3">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-cyan-400 opacity-70 animate-ping" />
                    <span className="relative inline-flex w-3 h-3 rounded-full bg-cyan-400" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-white uppercase tracking-wider">LYNARA · Assistante JYNTRA AI</div>
                    <div className="text-[10px] text-cyan-300/90 font-mono truncate">
                      Représentation holographique · interface virtuelle
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6 order-2 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
              <Bot className="w-4 h-4" />
              {t.home.lynaraBadge}
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white text-balance">
              {t.home.lynaraTitle}
            </h3>
            <p className="text-slate-300 text-[15px] leading-relaxed text-pretty">
              {t.home.lynaraSubtitle}
            </p>

            <div className="space-y-4 text-sm text-slate-400">
              {[
                { title: t.home.lynaraPoint1Title, desc: t.home.lynaraPoint1Desc, icon: Eye },
                { title: t.home.lynaraPoint2Title, desc: t.home.lynaraPoint2Desc, icon: Mic },
                { title: t.home.lynaraPoint3Title, desc: t.home.lynaraPoint3Desc, icon: Languages },
              ].map((point, index) => (
                <div key={point.title} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <point.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white">{point.title}</strong>{' '}
                    <span className="leading-relaxed">{point.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              {[
                { title: t.home.lynaraRoleTitle, desc: t.home.lynaraRoleDesc, icon: Layers },
                { title: t.home.lynaraInteractionTitle, desc: t.home.lynaraInteractionDesc, icon: MessageSquare },
                { title: t.home.lynaraMetaTitle, desc: t.home.lynaraMetaDesc, icon: Cpu },
              ].map((card, index) => (
                <div
                  key={card.title}
                  className={`rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 light:bg-white light:border-slate-200 ${index === 2 ? 'sm:col-span-2' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <card.icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[11px] font-bold text-white leading-snug">{card.title}</span>
                  </div>
                  {card.desc && (
                    <p className="text-[11px] leading-relaxed text-slate-400 light:text-slate-600">{card.desc}</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <span>{t.home.lynaraBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-12 order-3">
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 light:border-cyan-200 light:bg-cyan-50/70">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[12px] leading-relaxed text-slate-400 light:text-slate-600">
                {t.home.lynaraHonestyNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section Analyse Graphique & Multi-Agents */}
      <section data-reveal className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#06090E]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono">
              <TrendingUp className="w-4 h-4" />
              {t.home.decisionChainBadge}
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              {t.home.decisionChainTitle}
            </h3>
            <p className="text-slate-300 text-base leading-relaxed">
              {t.home.decisionChainSubtitle}
            </p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-orange-400 font-bold flex items-center gap-2">
                <Compass className="w-4 h-4" /> CHAÎNE DE DÉCISION DE BOUT EN BOUT :
              </div>
              <div className="text-slate-300 pl-4 border-l-2 border-orange-500/50 space-y-1">
                <p>1. Graphique MT4/MT5 importé</p>
                <p>2. Vision IA : détection des structures SMC (BOS, CHoCH, FVG)</p>
                <p>3. Confrontation collégiale entre 6 agents spécialisés</p>
                <p>4. Filtrage par le Risk Manager (invalidation si R:R &lt; 1.5)</p>
                <p>5. Verdict univoque : BUY, SELL ou NO TRADE</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              <span>Tester l'analyse d'un graphique</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-orange-500/30 shadow-2xl shadow-orange-500/10">
              <img
                src="/assets/chart-analysis.jpg"
                alt="Interface d'analyse de graphique avec IA et Agents"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Demo Video Section */}
      <DemoVideoSection />

      {/* 7. Section Workflow Studio */}
      <section data-reveal className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#080B10]">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-orange-500">
              {t.workflow.badge}
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              {t.home.workflowTitle}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base">
              {t.home.workflowSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { step: '01', title: 'Importer', desc: 'Capture MT4/MT5 ou flux direct' },
              { step: '02', title: 'Analyser', desc: 'Vision multimodale et structures' },
              { step: '03', title: 'Vérifier', desc: 'Cotations et carnet Marché' },
              { step: '04', title: 'Comparer', desc: 'Délibération multi-agents' },
              { step: '05', title: 'Évaluer', desc: 'Calcul mathématique du risque' },
              { step: '06', title: 'Rapport', desc: 'Synthèse exécutif et vocal' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-2 relative group hover:border-orange-500/50 transition-colors"
              >
                <span className="text-2xl font-black font-mono text-orange-500/40 group-hover:text-orange-400 transition-colors">
                  {s.step}
                </span>
                <h4 className="text-base font-bold text-white">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7b. Academy & Financial News */}
      <section data-reveal className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#06090E]">
        <div className="max-w-7xl mx-auto space-y-9">
          <div className="max-w-2xl mx-auto text-center space-y-3 jyntra-enter jyntra-enter-1">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-orange-500">
              {t.home.academyNewsBadge}
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white text-balance">
              {t.home.academyNewsTitle}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base">
              {t.home.academyNewsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: BookOpen,
                badge: t.home.academyCardBadge,
                title: t.home.academyCardTitle,
                desc: t.home.academyCardDesc,
                cta: t.home.academyCardCta,
                route: 'academy',
                accent: 'text-sky-400',
                iconBg: 'bg-sky-500/10',
                border: 'border-sky-500/25',
                glow: 'bg-sky-500/15',
                button: 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20',
              },
              {
                icon: Newspaper,
                badge: t.home.newsCardBadge,
                title: t.home.newsCardTitle,
                desc: t.home.newsCardDesc,
                cta: t.home.newsCardCta,
                route: 'news',
                accent: 'text-emerald-400',
                iconBg: 'bg-emerald-500/10',
                border: 'border-emerald-500/25',
                glow: 'bg-emerald-500/15',
                button: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20',
              },
            ].map((card, index) => (
              <article
                key={card.route}
                className={`group relative overflow-hidden rounded-2xl border ${card.border} bg-slate-900/70 p-6 sm:p-7 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/60 hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.15)] jyntra-enter jyntra-enter-${index + 1}`}
              >
                <div
                  aria-hidden="true"
                  className={`absolute -top-16 -right-12 w-40 h-40 rounded-full ${card.glow} blur-3xl opacity-60 pointer-events-none`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className={`w-12 h-12 rounded-xl ${card.iconBg} ${card.accent} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${card.accent} text-right`}>
                      {card.badge}
                    </span>
                  </div>

                  <h4 className="mt-5 text-xl sm:text-2xl font-black text-white text-balance group-hover:text-orange-400 transition-colors">
                    {card.title}
                  </h4>
                  <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>

                  <button
                    onClick={() => onNavigate(card.route)}
                    className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${card.button} text-xs font-bold shadow-lg transition-all hover:-translate-y-0.5`}
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final Call to Action */}
      <section data-reveal className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-gradient-to-b from-[#06090E] to-[#040609] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30">
            <img src="/Logo.png" alt="JYNTRA Logo" className="w-14 h-14 object-contain" />
          </div>

          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {t.home.ctaTitle}
          </h3>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            {t.home.ctaSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/30 transition-all text-base"
            >
              {t.home.ctaBtn}
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all text-base"
            >
              {t.home.alreadyAccount}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
