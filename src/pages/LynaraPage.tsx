import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserSession } from '../services/storage';
import { useLynaraVoice } from '../hooks/useLynaraVoice';
import { CleanMessageRenderer } from '../components/chat/CleanMessageRenderer';
import { LynaraHologram2D } from '../components/lynara/LynaraHologram2D';
import { LynaraWorkflow, type WorkflowStatus } from '../components/lynara/LynaraWorkflow';
import { PageShell3D } from '../components/3d/PageShell3D';
import { loadChartAnalysisState } from '../services/workflowStore';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Languages,
  Square,
  Bot,
  Radio,
  History,
  Cpu,
  LineChart,
  ScanSearch,
  ShieldCheck,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { MetaIcon } from '../components/ui/MetaIcon';
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
  /** Reply language (for faithful voice playback). */
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

  /**
   * LYNARA must be able to answer from the analysis the user actually
   * produced, even when the page is opened from the navigation instead of
   * the "Consult LYNARA" button. The stored analysis is a real validated
   * result; nothing is generated to fill a missing context.
   */
  const activeAnalysis = useMemo(() => {
    const direct: any = contextAnalysis;
    if (direct?.visualObservations || direct?.tradePlan) return direct;
    if (direct?.analysis) return direct.analysis;
    const stored = loadChartAnalysisState();
    return stored?.analysis || direct || null;
  }, [contextAnalysis]);
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
  const [attachedImage, setAttachedImage] = useState<string>('');
  const lynaraFileInputRef = useRef<HTMLInputElement>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [transferPhase, setTransferPhase] = useState<'idle' | 'toWorkflow' | 'processing' | 'toLynara'>('idle');
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

  useEffect(() => {
    if (activeAnalysis && activeAnalysis.symbol) {
      const introContext = `J'ai importé l'analyse du graphique sur ${activeAnalysis.symbol} (${activeAnalysis.timeframe || 'unité non précisée'}). La tendance détectée est ${activeAnalysis.visualObservations?.trend || 'définie'}, avec une recommandation de ${activeAnalysis.recommendation || 'NO_TRADE'}. Souhaitez-vous que je détaille le plan de trade et le niveau d'invalidation ?`;
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
  }, [activeAnalysis]);

  useEffect(() => {
    if (messages.length > 1) feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isAiLoading]);

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    const imageToSend = attachedImage;
    if ((!text && !imageToSend) || isAiLoading) return;

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
    setAttachedImage('');
    setAiNotice(null);
    setIsAiLoading(true);
    setVoiceState('thinking');
    setTrace(runningState());
    setTransferPhase('toWorkflow');
    window.setTimeout(() => setTransferPhase('processing'), 420);

    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/ai/lynara-chat', {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextAnalysis: activeAnalysis || null,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'lynara' ? 'model' : 'user',
            text: m.content,
          })),
          userName: session.name,
          language: detectedTag,
          detectedLanguage: detected,
          imageBase64: imageToSend || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        setTrace(failureState(data.code === 'AI_NOT_CONFIGURED' ? 'Aucun moteur disponible' : 'Appel au moteur refusé'));
        setAiNotice(data.code === 'AI_NOT_CONFIGURED' || res.status === 503 ? t.lynara.notConfigured : data.error || t.lynara.connectionError);
        setIsAiLoading(false);
        setVoiceState('idle');
        setTransferPhase('idle');
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
      setTransferPhase('toLynara');
      window.setTimeout(() => setTransferPhase('idle'), 720);
      setIsAiLoading(false);
      setVoiceState('idle');

      speak(reply, detectedTag);
    } catch (err: any) {
      setIsAiLoading(false);
      setVoiceState('idle');
      setTransferPhase('idle');
      if (err?.name === 'AbortError') {
        setTrace(runningState());
        setAiNotice('Réponse interrompue.');
        return;
      }
      setTrace(failureState('Moteur IA injoignable'));
      setAiNotice(t.lynara.connectionError);
    }
  }

  /**
   * Questions anchored on the real analysis: the model receives its plan and
   * structure, so these prompts cannot produce invented levels.
   */
  const contextualPrompts = useMemo(() => {
    if (!activeAnalysis) return [];
    const hasPlan = Boolean(activeAnalysis.tradePlan?.entry);
    const labels = {
      fr: {
        plan: 'Détaille le plan réel',
        risks: 'Quels sont les risques ?',
        scenarios: 'Compare les scénarios',
        noPlan: 'Pourquoi aucun plan chiffré ?',
      },
      en: {
        plan: 'Detail the real plan',
        risks: 'What are the risks?',
        scenarios: 'Compare the scenarios',
        noPlan: 'Why is there no priced plan?',
      },
      mg: {
        plan: 'Detailly ny drafitra tena izy',
        risks: 'Inona ny risika?',
        scenarios: 'Ampitahao ny scénarios',
        noPlan: 'Nahoana no tsy misy drafitra isa?',
      },
    } as const;
    const l = labels[uiLang];
    return [
      ...(hasPlan
        ? [{
            label: l.plan,
            text:
              uiLang === 'en'
                ? 'Detail the active analysis plan: entry, stop, targets, R:R, confirmations and invalidation. Use only the real levels already present in the context.'
                : uiLang === 'mg'
                  ? 'Detailly ny drafitra misy: fidirana, stop, tanjona, R:R, fanamafisana ary invalidation. Tsy mampiasa afa-tsy ny haavo tena izy ao amin’ny contexte.'
                  : 'Détaille le plan de l’analyse active : entrée, stop, objectifs, R:R, confirmations et invalidation. Utilise uniquement les niveaux réels déjà présents dans le contexte.',
          }]
        : [{
            label: l.noPlan,
            text:
              uiLang === 'en'
                ? 'Why does the active analysis not contain a priced plan? Explain what is missing without inventing levels.'
                : uiLang === 'mg'
                  ? 'Nahoana ny famakafakana misy no tsy manana drafitra isa? Hazavao izay tsy ampy, tsy mamorona haavo.'
                  : 'Pourquoi l’analyse active ne contient-elle pas de plan chiffré ? Explique ce qui manque, sans inventer de niveaux.',
          }]),
      {
        label: l.risks,
        text:
          uiLang === 'en'
            ? 'List the concrete risks of this scenario from the available structure and plan, including what would invalidate it.'
            : uiLang === 'mg'
              ? 'Tanisao ny risika mivaingana amin’ity scénario ity avy amin’ny rafitra sy ny drafitra misy, anisan’izany izay hanafoana azy.'
              : 'Liste les risques concrets de ce scénario à partir de la structure et du plan disponibles, y compris ce qui l’invaliderait.',
      },
      {
        label: l.scenarios,
        text:
          uiLang === 'en'
            ? 'Compare the bullish and bearish conditional scenarios. Separate observation, interpretation and hypothesis.'
            : uiLang === 'mg'
              ? 'Ampitahao ny scénario haussier sy baissier misy fepetra. Saraho ny observation, interpretation ary hypothesis.'
              : 'Compare les scénarios conditionnels haussier et baissier. Sépare l’observation, l’interprétation et l’hypothèse.',
      },
    ];
  }, [activeAnalysis, uiLang]);

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
  const pendingQuestion = lastMessage?.role === 'user' ? lastMessage : null;
  const failedExchange = !!pendingQuestion && !!aiNotice;
  const displayQuestion = failedExchange ? pendingQuestion : current?.question || null;
  const displayAnswer = failedExchange ? null : current?.answer || null;
  const currentLang = toBcp47(displayAnswer?.lang || replyLang);

  const replyVoiceNotice = speechSupported ? voiceNoticeFor(currentLang) : null;
  const anyNotice = aiNotice || voiceError || voiceNotice || replyVoiceNotice;

  return (
    <PageShell3D scene="lynara" secondaryOnly secondaryVariant="lynara" className="min-h-screen text-slate-100 flex flex-col">
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
        <div className="jyntra-hero-glass relative overflow-hidden rounded-3xl border border-cyan-500/20 shadow-2xl">
          <div className="lynara-grid pointer-events-none absolute inset-0 opacity-[0.10]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" aria-hidden="true" />

          <div className="relative z-10 grid items-center gap-6 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-12">
            <div className="jyntra-enter space-y-3.5 lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                <Bot className="h-3.5 w-3.5" />
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
      <div className="relative flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 items-start">
        <div className="pointer-events-none absolute inset-y-0 left-[40%] right-[40%] z-0 hidden lg:block" aria-hidden="true">
          <svg viewBox="0 0 200 220" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="lynara-link" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <path
              d="M 8 110 C 58 30, 142 190, 192 110"
              fill="none"
              stroke="url(#lynara-link)"
              strokeWidth="1.6"
              strokeLinecap="round"
              className={transferPhase === 'processing' ? 'animate-pulse' : ''}
            />
            {transferPhase !== 'idle' && (
              <circle r="4" fill="#22d3ee" filter="drop-shadow(0 0 6px #22d3ee)">
                <animateMotion
                  dur={transferPhase === 'processing' ? '1.6s' : '0.9s'}
                  repeatCount="indefinite"
                  path={transferPhase === 'toLynara' ? 'M 192 110 C 142 190, 58 30, 8 110' : 'M 8 110 C 58 30, 142 190, 192 110'}
                  calcMode="linear"
                />
              </circle>
            )}
          </svg>
        </div>
        <div className="order-2 lg:order-1 lg:col-span-5 w-full relative z-10">
          <LynaraWorkflow
            steps={workflowSteps}
            running={isAiLoading}
            suggestions={[...contextualPrompts, ...samplePrompts]}
            onSuggestion={(text) => handleSendMessage(text)}
            transferPhase={transferPhase}
          />
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7 w-full space-y-4">
          {/* Hologram stage */}
          <div className="lynara-stage keep-white relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#0b1a24] via-[#070d15] to-[#04070c] light:from-cyan-50 light:via-white light:to-slate-50 shadow-2xl">
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

            <div className="relative h-[360px] sm:h-[440px] lg:h-[500px]">
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
          <div className="lynara-panel overflow-hidden rounded-2xl border border-slate-800 bg-[#070A10]/95 shadow-xl">
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
                  <div className="text-[13px] leading-relaxed text-slate-200 sm:text-sm light:text-slate-900">
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
            {attachedImage && (
              <div className="mb-2 flex items-center gap-2">
                {attachedImage.startsWith('data:image') ? (
                  <img src={attachedImage} alt="Fichier joint" className="h-12 w-12 rounded-lg object-cover border border-cyan-500/40" />
                ) : (
                  <div className="flex h-12 items-center rounded-lg border border-cyan-500/40 bg-slate-900/60 px-3 text-[11px] text-cyan-200">
                    Fichier joint
                  </div>
                )}
                <button type="button" onClick={() => setAttachedImage('')} className="text-[11px] text-rose-300 hover:text-rose-200">Retirer</button>
              </div>
            )}
            <input
              ref={lynaraFileInputRef}
              type="file"
              accept="image/*,application/pdf,text/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setAttachedImage(reader.result as string);
                reader.readAsDataURL(file);
                if (lynaraFileInputRef.current) lynaraFileInputRef.current.value = '';
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => lynaraFileInputRef.current?.click()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-all"
                title="Joindre une image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
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
                disabled={(!inputText.trim() && !attachedImage) || isAiLoading}
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
          <MetaIcon className="hidden h-4 w-4 opacity-60 sm:block" />
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
    </PageShell3D>
  );
};
