import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserSession } from '../services/storage';
import { useLynaraVoice } from '../hooks/useLynaraVoice';
import { CleanMessageRenderer } from '../components/chat/CleanMessageRenderer';
import { LynaraHologram2D } from '../components/lynara/LynaraHologram2D';
import { LynaraWorkflow, type WorkflowStatus } from '../components/lynara/LynaraWorkflow';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Languages,
  Square,
  Radio,
  History,
  Cpu,
  LineChart,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  detectChatLanguage,
  toBcp47,
  languageLabel,
  type SupportedChatLang,
} from '../utils/detectLanguage';

import { useLanguage } from '../i18n/LanguageContext';

interface LynaraPageProps {
  session: UserSession;
  contextAnalysis?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'lynara';
  content: string;
  timestamp: number;
  /** Langue de la réponse (pour une relecture vocale fidèle). */
  lang?: SupportedChatLang;
}

type TraceStatus = 'pending' | 'active' | 'done' | 'skipped' | 'error';
interface TraceStep {
  id: string;
  status: TraceStatus;
  detail?: string;
}

/**
 * Order mirrors the trace the server really returns. Nothing is invented:
 * before a call every node is `pending`, during the call only the routing
 * node is active, and after the response the server trace replaces it all.
 */
const TRACE_ORDER = [
  'input',
  'language',
  'transcription',
  'routing',
  'reasoning',
  'search',
  'response',
] as const;

const WORKFLOW_LABELS: Record<'fr' | 'en' | 'mg', Record<string, string>> = {
  fr: {
    input: 'Entrée utilisateur',
    language: 'Détection de langue',
    transcription: 'Transcription audio',
    vision: 'Lecture visuelle',
    segmentation: 'Segmentation visuelle',
    routing: 'Routage du modèle',
    reasoning: 'Raisonnement',
    search: 'Recherche externe',
    response: 'Réponse générée',
  },
  en: {
    input: 'User input',
    language: 'Language detection',
    transcription: 'Audio transcription',
    vision: 'Visual reading',
    segmentation: 'Visual segmentation',
    routing: 'Model routing',
    reasoning: 'Reasoning',
    search: 'External search',
    response: 'Generated answer',
  },
  mg: {
    input: 'Fidirana mpampiasa',
    language: 'Famantarana fiteny',
    transcription: 'Fanovana feo ho soratra',
    vision: 'Famakiana sary',
    segmentation: 'Fizarana sary',
    routing: 'Fandefasana modely',
    reasoning: 'Fanadinana',
    search: 'Fikarohana ivelany',
    response: 'Valiny novokarina',
  },
};

const initialState = (): TraceStep[] => TRACE_ORDER.map((id) => ({ id, status: 'pending' }));

/** Page copy kept next to the component so the three UI languages stay in sync. */
const LYNARA_COPY = {
  fr: {
    badge: 'LYNARA · INTELLIGENCE HOLOGRAPHIQUE',
    title: 'Votre analyste de marché, en présence.',
    intro:
      "LYNARA lit le marché avec vous, explique chaque structure et répond dans votre langue — à l'écrit comme à la voix. Une présence claire, sans jargon inutile.",
    chips: ['Multilingue', 'Voix naturelle', 'Contexte conservé', 'Réponses réelles'],
    capabilitiesTitle: 'Ce que LYNARA apporte',
    capabilitiesSubtitle: 'Une assistante intégrée au raisonnement de la plateforme, pas un simple chat.',
    capabilities: [
      {
        title: 'Lecture du marché',
        desc: 'Tendance, structure, zones et niveaux : une explication posée, jamais un signal inventé.',
      },
      {
        title: 'Analyse graphique',
        desc: 'Elle reprend votre analyse de graphique et détaille le plan, les confirmations et l’invalidation.',
      },
      {
        title: 'Voix & texte',
        desc: 'Posez votre question à l’écrit ou au micro : la réponse arrive dans la langue détectée.',
      },
      {
        title: 'Contexte suivi',
        desc: 'Vos échanges restent consultables, pour reprendre une idée sans repartir de zéro.',
      },
    ],
    stepsTitle: 'Comment se déroule un échange',
    steps: [
      { title: 'Vous parlez', desc: 'Texte ou voix, dans la langue de votre choix.' },
      { title: 'LYNARA raisonne', desc: 'Le workflow affiche les étapes réellement exécutées.' },
      { title: 'Vous repartez clair', desc: 'Une réponse structurée, avec les niveaux et le risque.' },
    ],
  },
  en: {
    badge: 'LYNARA · HOLOGRAPHIC INTELLIGENCE',
    title: 'Your market analyst, present with you.',
    intro:
      'LYNARA reads the market with you, explains every structure and answers in your language — in writing or by voice. A clear presence, without unnecessary jargon.',
    chips: ['Multilingual', 'Natural voice', 'Retained context', 'Real answers'],
    capabilitiesTitle: 'What LYNARA brings',
    capabilitiesSubtitle: 'An assistant built into the platform’s reasoning, not just a chat window.',
    capabilities: [
      {
        title: 'Market reading',
        desc: 'Trend, structure, zones and levels: a composed explanation, never an invented signal.',
      },
      {
        title: 'Chart analysis',
        desc: 'She takes your chart analysis further and details the plan, confirmations and invalidation.',
      },
      {
        title: 'Voice & text',
        desc: 'Ask by text or microphone: the answer comes back in the detected language.',
      },
      {
        title: 'Followed context',
        desc: 'Your exchanges stay available, so you can pick an idea back up without starting over.',
      },
    ],
    stepsTitle: 'How an exchange unfolds',
    steps: [
      { title: 'You speak', desc: 'Text or voice, in the language you choose.' },
      { title: 'LYNARA reasons', desc: 'The workflow shows the steps that actually ran.' },
      { title: 'You leave with clarity', desc: 'A structured answer, with levels and risk.' },
    ],
  },
  mg: {
    badge: 'LYNARA · FAHALALANA HOLOGRAPHIKA',
    title: 'Ny mpandinika tsena anao, eo anilanao.',
    intro:
      'Mamaky ny tsena miaraka aminao i LYNARA, manazava ny rafitra tsirairay ary mamaly amin’ny fiteninao — an-tsoratra na amin’ny feo. Fisiana mazava, tsy misy teny sarotra tsy ilaina.',
    chips: ['Fiteny maro', 'Feo voajanahary', 'Tadidy ny resaka', 'Valiny tena izy'],
    capabilitiesTitle: 'Izay entin’i LYNARA',
    capabilitiesSubtitle: 'Mpanampy tafiditra ao amin’ny fisainan’ny sehatra, fa tsy chat tsotra.',
    capabilities: [
      {
        title: 'Famakiana ny tsena',
        desc: 'Fironana, rafitra, faritra ary haavo: fanazavana milamina, tsy misy signal noforonina.',
      },
      {
        title: 'Famakafakana graphique',
        desc: 'Manohy ny famakafakanao izy ary manazava ny drafitra, ny fanamafisana ary ny invalidation.',
      },
      {
        title: 'Feo & soratra',
        desc: 'Anontanio an-tsoratra na amin’ny mikrô: tonga amin’ny fiteny hita ny valiny.',
      },
      {
        title: 'Tadidy ny resaka',
        desc: 'Mitahiry ny fifanakalozana mba hahafahanao miverina amin’ny hevitra iray.',
      },
    ],
    stepsTitle: 'Ny fizotry ny fifanakalozana',
    steps: [
      { title: 'Miteny ianao', desc: 'Soratra na feo, amin’ny fiteny tianao.' },
      { title: 'Misaina i LYNARA', desc: 'Asehon’ny workflow ny dingana tena natao.' },
      { title: 'Mazava ny valiny', desc: 'Valiny voarindra, miaraka amin’ny haavo sy ny risika.' },
    ],
  },
} as const;
const runningState = (): TraceStep[] =>
  TRACE_ORDER.map((id) => {
    if (id === 'input') return { id, status: 'done', detail: 'Message reçu' };
    if (id === 'language') return { id, status: 'done', detail: 'Langue analysée' };
    if (id === 'transcription')
      return { id, status: 'skipped', detail: 'Entrée texte — aucune transcription serveur' };
    if (id === 'routing') return { id, status: 'active', detail: 'Sélection du modèle en cours' };
    return { id, status: 'pending' };
  });

const failureState = (detail: string): TraceStep[] =>
  TRACE_ORDER.map((id) => {
    if (id === 'input') return { id, status: 'done', detail: 'Message reçu' };
    if (id === 'language') return { id, status: 'done', detail: 'Langue analysée' };
    if (id === 'transcription')
      return { id, status: 'skipped', detail: 'Entrée texte — aucune transcription serveur' };
    if (id === 'routing') return { id, status: 'error', detail };
    if (id === 'search') return { id, status: 'skipped', detail: 'Aucune recherche externe' };
    if (id === 'reasoning') return { id, status: 'error', detail: 'Aucun raisonnement produit' };
    return { id, status: 'error', detail: 'Échec honnête — aucune réponse simulée' };
  });

export const LynaraPage: React.FC<LynaraPageProps> = ({ session, contextAnalysis }) => {
  const { t, language } = useLanguage();

  const uiLang: SupportedChatLang = language === 'mg' ? 'mg' : language === 'en' ? 'en' : 'fr';
  const selectedLang = toBcp47(uiLang);
  const copy = LYNARA_COPY[uiLang];

  // Entrance + scroll reveal, consistent with the other public pages.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            obs.unobserve(en.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, []);

  // Langue de la dernière conversation : détectée dans le message utilisateur.
  // C'est elle qui pilote la langue de réponse et la voix de synthèse.
  const [replyLang, setReplyLang] = useState<SupportedChatLang>(uiLang);
  useEffect(() => {
    setReplyLang(uiLang);
  }, [uiLang]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init',
      role: 'lynara',
      content: t.lynara.greeting.replace('{name}', session.name),
      timestamp: Date.now(),
    },
  ]);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [trace, setTrace] = useState<TraceStep[]>(initialState);

  const abortRef = useRef<AbortController | null>(null);
  const cancelReply = () => abortRef.current?.abort();
  const feedEndRef = useRef<HTMLDivElement>(null);

  const {
    state: voiceState,
    setState: setVoiceState,
    transcript,
    interimTranscript,
    isMuted,
    audioLevel,
    speechSupported,
    recognitionSupported,
    activeVoiceName,
    voiceError,
    voiceNotice,
    voiceNoticeFor,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    toggleMute,
  } = useLynaraVoice({
    lang: selectedLang,
    onTranscript: (userSaid: string) => {
      if (userSaid.trim()) {
        handleSendMessage(userSaid);
      }
    },
  });

  // If context analysis was passed from Chart Analysis page, automatically greet with context
  useEffect(() => {
    if (contextAnalysis && contextAnalysis.symbol) {
      const introContext = `J'ai importé l'analyse du graphique sur ${contextAnalysis.symbol} (${contextAnalysis.timeframe}). La tendance détectée est ${contextAnalysis.visualObservations?.trend || 'définie'}, avec une recommandation de ${contextAnalysis.recommendation}. Souhaitez-vous que je détaille le plan de trade et le niveau d'invalidation ?`;
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-ctx-' + Date.now(),
          role: 'lynara',
          content: introContext,
          timestamp: Date.now(),
          lang: uiLang,
        },
      ]);
      speak(introContext, selectedLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextAnalysis]);

  useEffect(() => {
    if (messages.length > 1) feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isAiLoading]);

  // Send message to LYNARA backend
  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || isAiLoading) return;

    const detected = detectChatLanguage(text, uiLang);
    const detectedTag = toBcp47(detected);
    setReplyLang(detected);

    stopSpeaking();

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAiNotice(null);
    setIsAiLoading(true);
    setVoiceState('thinking');
    setTrace(runningState());

    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/ai/lynara-chat', {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextAnalysis: contextAnalysis || null,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'lynara' ? 'model' : 'user',
            text: m.content,
          })),
          userName: session.name,
          language: detectedTag,
          detectedLanguage: detected,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        setTrace(failureState(data.code === 'AI_NOT_CONFIGURED' ? 'Aucun moteur disponible' : 'Appel au moteur refusé'));
        setAiNotice(data.code === 'AI_NOT_CONFIGURED' || res.status === 503 ? t.lynara.notConfigured : data.error || t.lynara.connectionError);
        setIsAiLoading(false);
        setVoiceState('idle');
        return;
      }

      setAiNotice(null);
      setLastProvider('Moteur JYNTRA');

      if (Array.isArray(data.trace) && data.trace.length > 0) {
        setTrace(
          data.trace.map((s: { id: string; status: WorkflowStatus; detail?: string }) => ({
            id: s.id,
            status: s.status,
            detail: s.detail,
          })),
        );
      } else {
        setTrace(
          TRACE_ORDER.map((id) => {
            if (id === 'input') return { id, status: 'done' as TraceStatus, detail: 'Message reçu' };
            if (id === 'language') return { id, status: 'done' as TraceStatus, detail: 'Langue analysée' };
            if (id === 'transcription') return { id, status: 'skipped' as TraceStatus, detail: 'Entrée texte' };
            if (id === 'routing') return { id, status: 'done' as TraceStatus, detail: 'Moteur JYNTRA sélectionné' };
            if (id === 'reasoning') return { id, status: 'done' as TraceStatus };
            if (id === 'search') return { id, status: 'skipped' as TraceStatus };
            return { id, status: 'done' as TraceStatus, detail: 'Réponse produite' };
          }),
        );
      }

      const reply = data.reply || data.response || t.lynara.connectionError;

      const lynaraMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'lynara',
        content: reply,
        timestamp: Date.now(),
        lang: detected,
      };

      setMessages((prev) => [...prev, lynaraMsg]);
      setIsAiLoading(false);
      setVoiceState('idle');

      // Lecture vocale dans la langue détectée dans le message utilisateur.
      speak(reply, detectedTag);
    } catch (err: any) {
      setIsAiLoading(false);
      setVoiceState('idle');
      if (err?.name === 'AbortError') {
        setTrace(runningState());
        setAiNotice('Réponse interrompue.');
        return;
      }
      // Honest failure: no simulated reply, no fake spoken fallback.
      setTrace(failureState('Moteur IA injoignable'));
      setAiNotice(t.lynara.connectionError);
    }
  }

  const samplePrompts = [
    {
      label: t.lynara.sampleSMC,
      text: 'Explique-moi la différence entre un Bullish Order Block et un Bearish Order Block selon les Smart Money Concepts.',
    },
    {
      label: t.lynara.sampleSizing,
      text: 'Comment calculer la taille exacte de mon lot pour ne risquer que 1% de mon capital sur un Stop-Loss de 25 pips ?',
    },
    {
      label: t.lynara.sampleSL,
      text: 'Comment placer un Stop-Loss technique de manière à éviter les chasses de liquidité institutionnelles (Liquidity Sweeps) ?',
    },
    {
      label: t.lynara.sampleMG,
      text: "Inona no atao hoe Break of Structure (BOS) amin'ny trading Smart Money Concepts ?",
    },
  ];

  const workflowLabels = WORKFLOW_LABELS[uiLang];
  const workflowSteps = useMemo(
    () =>
      trace.map((step) => ({
        id: step.id,
        status: step.status as WorkflowStatus,
        detail: step.detail,
        label: workflowLabels[step.id] || step.id,
      })),
    [trace, workflowLabels],
  );

  // LYNARA's feed is not a chat thread: one current answer is highlighted and
  // the previous exchanges stay archived as compact, expandable pairs.
  const exchanges = useMemo(() => {
    const list: Array<{ id: string; question: ChatMessage | null; answer: ChatMessage }> = [];
    let pendingUser: ChatMessage | null = null;
    for (const m of messages) {
      if (m.role === 'user') {
        pendingUser = m;
      } else {
        list.push({ id: m.id, question: pendingUser, answer: m });
        pendingUser = null;
      }
    }
    return list;
  }, [messages]);

  const current = exchanges[exchanges.length - 1];
  const previous = exchanges.slice(0, -1);
  const lastMessage = messages[messages.length - 1];
  // A user message that never received an answer (honest failure) stays visible
  // instead of silently disappearing from the single-response panel.
  const pendingQuestion = lastMessage?.role === 'user' ? lastMessage : null;
  const failedExchange = !!pendingQuestion && !!aiNotice;
  const displayQuestion = failedExchange ? pendingQuestion : current?.question || null;
  const displayAnswer = failedExchange ? null : current?.answer || null;
  const currentLang = toBcp47(displayAnswer?.lang || replyLang);

  const replyVoiceNotice = speechSupported ? voiceNoticeFor(currentLang) : null;
  const anyNotice = aiNotice || voiceError || voiceNotice || replyVoiceNotice;

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 flex flex-col">
      {/* Context Analysis Banner (if loaded from Chart page) */}
      {contextAnalysis && (
        <div className="bg-cyan-950/40 border-b border-cyan-500/20 px-4 py-2 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              {t.lynara.contextLoaded} : <strong>{contextAnalysis.symbol}</strong> ({contextAnalysis.timeframe}) &mdash;{' '}
              <strong>{contextAnalysis.recommendation}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Identity hero */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#071722] via-[#061019] to-[#04070c] shadow-2xl">
          <div className="lynara-grid pointer-events-none absolute inset-0 opacity-[0.10]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" aria-hidden="true" />

          <div className="relative z-10 grid items-center gap-6 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-12">
            <div className="jyntra-enter space-y-3.5 lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                <Radio className="h-3.5 w-3.5" />
                {copy.badge}
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
                  LYNARA
                  <span className="ml-3 align-middle font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/60 sm:text-[11px]">
                    {t.lynara.subtitle}
                  </span>
                </h1>
                <p className="mt-1.5 text-sm font-semibold text-slate-200 sm:text-lg">{copy.title}</p>
              </div>

              <p className="max-w-2xl text-[12px] leading-relaxed text-slate-400 sm:text-sm">{copy.intro}</p>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {copy.chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-400"
                  >
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Holographic core: decorative, lightweight, no data claimed */}
            <div className="jyntra-enter jyntra-enter-2 hidden justify-center lg:col-span-4 lg:flex">
              <div className="relative h-[184px] w-[184px]">
                <div className="absolute inset-0 rounded-full bg-cyan-400/[0.06] blur-2xl" />
                <div className="absolute inset-0 rounded-full border border-cyan-400/15" />
                <div className="absolute inset-5 animate-[spin_24s_linear_infinite] rounded-full border border-dashed border-cyan-400/25" />
                <div className="absolute inset-10 animate-[spin_16s_linear_infinite_reverse] rounded-full border border-cyan-300/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-slate-950/80 text-2xl font-black text-cyan-200 shadow-lg shadow-cyan-500/20">
                    L
                  </div>
                </div>
                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/50">
                  online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual pane: workflow left, hologram + answer right */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 items-start">
        <div className="order-2 lg:order-1 lg:col-span-5 w-full">
          <LynaraWorkflow
            steps={workflowSteps}
            running={isAiLoading}
            suggestions={samplePrompts}
            onSuggestion={(text) => handleSendMessage(text)}
          />
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7 w-full space-y-4">
          {/* Hologram stage */}
          <div className="lynara-stage keep-white relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#0b1a24] via-[#070d15] to-[#04070c] shadow-2xl">
            <div className="pointer-events-none absolute left-4 top-3 z-20 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-300/70">
              LYNARA · projection 2D
            </div>
            <div className="pointer-events-none absolute right-4 top-3 z-20 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-200/70">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isAiLoading
                    ? 'animate-pulse bg-violet-300'
                    : voiceState === 'listening'
                      ? 'animate-pulse bg-cyan-300'
                      : voiceState === 'speaking'
                        ? 'animate-ping bg-amber-300'
                        : anyNotice
                          ? 'bg-rose-400'
                          : 'bg-emerald-300'
                }`}
              />
              {isAiLoading
                ? t.lynara.thinking
                : voiceState === 'listening'
                  ? t.lynara.listening
                  : voiceState === 'speaking'
                    ? t.lynara.speaking
                    : t.lynara.idle}
            </div>

            <div className="relative h-[340px] sm:h-[400px] lg:h-[420px]">
              <LynaraHologram2D
                state={
                  anyNotice && voiceState !== 'listening'
                    ? 'unavailable'
                    : isAiLoading
                      ? 'thinking'
                      : voiceState
                }
                audioLevel={audioLevel}
                className="h-full w-full"
              />
            </div>

            {/* Live transcript */}
            {(transcript || interimTranscript) && (
              <div className="mx-4 mb-3 rounded-xl border border-cyan-500/40 bg-cyan-950/80 p-3 font-mono text-xs text-cyan-200 shadow-lg">
                <span className="mb-0.5 block text-[10px] font-bold text-cyan-400">
                  {t.lynara.liveTranscript}
                </span>
                “{transcript || interimTranscript}”
              </div>
            )}

            {anyNotice && (
              <div
                className="mx-4 mb-3 rounded-xl border border-amber-500/40 bg-amber-950/70 p-3 text-xs text-amber-200"
                role="alert"
              >
                {anyNotice}
              </div>
            )}
            {!recognitionSupported && (
              <div className="mx-4 mb-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-[11px] text-slate-400">
                {t.lynara.sttUnsupportedNote}
              </div>
            )}

            <div className="relative z-10 flex items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/60 px-4 py-2.5 text-[10px] font-mono text-slate-400">
              <span className="flex min-w-0 items-center gap-1.5">
                <Languages className="h-3 w-3 shrink-0 text-cyan-400" />
                <span className="truncate">
                  {t.lynara.replyLanguage} :{' '}
                  <strong className="font-semibold text-cyan-300">{languageLabel(replyLang)}</strong>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="hidden max-w-[220px] truncate sm:inline">
                  {activeVoiceName || t.lynara.voiceActive}
                </span>
                <button
                  onClick={toggleMute}
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 transition-all ${
                    isMuted
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                  }`}
                  title={isMuted ? t.lynara.unmuteBtn : t.lynara.muteBtn}
                  aria-pressed={isMuted}
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isMuted ? t.lynara.unmuteBtn : t.lynara.muteBtn}</span>
                </button>
              </span>
            </div>
          </div>

          {/* Answer panel — one highlighted response, no chat bubbles */}
          <div className="lynara-panel keep-white overflow-hidden rounded-2xl border border-slate-800 bg-[#070A10]/95 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 text-xs font-black text-white shadow-md shadow-cyan-500/20">
                  L
                </span>
                <div>
                  <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                    Réponse de LYNARA
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    {lastProvider || 'Moteur JYNTRA'}
                  </div>
                </div>
              </div>
              {displayAnswer && (
                <button
                  onClick={() => speak(displayAnswer.content, currentLang)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  title={t.lynara.repeatAudio}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  {t.lynara.repeatAudio}
                </button>
              )}
            </div>

            <div className="max-h-[280px] min-h-[140px] overflow-y-auto px-4 py-4 sm:px-5">
              {isAiLoading ? (
                <div className="flex items-center gap-3 font-mono text-xs text-cyan-300">
                  <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
                  <span>{t.lynara.thinkingBubble}</span>
                  <button
                    onClick={cancelReply}
                    className="ml-auto flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 font-bold text-rose-300"
                  >
                    <Square className="h-3 w-3" />
                    Arrêter
                  </button>
                </div>
              ) : (
                <>
                  {displayQuestion && (
                    <div className="mb-3 border-l-2 border-orange-500/50 pl-3 text-[11px] leading-relaxed text-slate-400">
                      <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-orange-400/80">
                        Votre demande
                      </span>
                      {displayQuestion.content}
                    </div>
                  )}
                  <div className="text-[13px] leading-relaxed text-slate-200 sm:text-sm">
                    {displayAnswer ? (
                      <CleanMessageRenderer content={displayAnswer.content} isAi />
                    ) : (
                      <span className="text-[12px] text-amber-300">
                        Aucune réponse n’a été générée pour cette demande. Le détail de l’erreur est
                        affiché au-dessus de l’hologramme.
                      </span>
                    )}
                  </div>
                  {displayAnswer && (
                    <div className="mt-3 text-right font-mono text-[10px] text-slate-500">
                      {new Date(displayAnswer.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  <div ref={feedEndRef} />
                </>
              )}
            </div>

            {/* Archived exchanges */}
            {previous.length > 0 && (
              <div className="border-t border-slate-800/80 bg-slate-950/50">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-cyan-300">
                    <History className="h-3.5 w-3.5" />
                    Échanges précédents ({previous.length})
                    <span className="ml-auto text-slate-600 transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <div className="max-h-64 space-y-2 overflow-y-auto px-3 pb-3">
                    {previous.map((ex) => (
                      <details key={ex.id} className="rounded-lg border border-slate-800/80 bg-slate-900/50">
                        <summary className="cursor-pointer list-none px-3 py-2 text-[11px] text-slate-300">
                          <span className="mr-2 font-mono text-[9px] text-slate-500">
                            {new Date(ex.answer.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {ex.question?.content || 'Message d’accueil'}
                        </summary>
                        <div className="border-t border-slate-800/70 px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
                          <CleanMessageRenderer content={ex.answer.content} isAi />
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="rounded-2xl border border-slate-800 bg-slate-950 p-3"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={voiceState === 'listening' ? stopListening : startListening}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-semibold transition-all ${
                  voiceState === 'listening'
                    ? 'animate-pulse bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                }`}
                title={voiceState === 'listening' ? t.lynara.micTooltipStop : t.lynara.micTooltipStart}
                aria-pressed={voiceState === 'listening'}
              >
                {voiceState === 'listening' ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.lynara.inputPlaceholder}
                disabled={isAiLoading}
                className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none sm:text-sm"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isAiLoading}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-40"
              >
                <span className="hidden sm:inline">{t.lynara.sendBtn}</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 px-1 font-mono text-[9px] uppercase tracking-wider text-slate-600">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-cyan-500/80" />
                Entrée texte ou vocale · routage serveur
              </span>
              <span>{t.lynara.disclaimer}</span>
            </div>
          </form>
        </div>
      </div>

      {/* Capabilities */}
      <section data-reveal className="mx-auto w-full max-w-7xl px-4 pb-5 sm:px-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white sm:text-lg">{copy.capabilitiesTitle}</h2>
            <p className="text-[11px] text-slate-500">{copy.capabilitiesSubtitle}</p>
          </div>
          <Sparkles className="hidden h-4 w-4 text-cyan-400/60 sm:block" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {copy.capabilities.map((cap, i) => {
            const Icon = [LineChart, ScanSearch, Mic, History][i];
            return (
              <article
                key={cap.title}
                className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-cyan-500/40 hover:bg-slate-900/70"
              >
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-[13px] font-bold text-white">{cap.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{cap.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How an exchange unfolds */}
      <section data-reveal className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
        <h2 className="text-base font-black text-white sm:text-lg">{copy.stepsTitle}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {copy.steps.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="font-mono text-[10px] font-bold text-orange-400/80">0{i + 1}</span>
              <h3 className="mt-1 text-[13px] font-bold text-white">{step.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{step.desc}</p>
              {i < 2 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-700 sm:block" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-600">
          <ShieldCheck className="h-3 w-3 text-cyan-500/70" />
          {t.lynara.disclaimer}
        </p>
      </section>
    </div>
  );
};
