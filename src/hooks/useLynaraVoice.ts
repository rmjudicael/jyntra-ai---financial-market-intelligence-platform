import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseLynaraVoiceOptions {
  onTranscript?: (text: string) => void;
  /** BCP-47 de la langue d'écoute : fr-FR | en-US | mg-MG (voir sttLangUsed). */
  lang?: string;
}

/**
 * Chaîne vocale réelle de LYNARA :
 * micro -> reconnaissance vocale du navigateur (ASR) -> l'appelant envoie le
 * texte à /api/ai/lynara-chat (vrai LLM) -> synthèse vocale (TTS) -> les
 * événements de frontière et l'enveloppe audio animent le visage 3D.
 *
 * Multilingue : `speak(text, 'mg')` permet de prononcer une réponse dans la
 * langue réellement détectée dans le message de l'utilisateur, sans dépendre
 * de la langue d'interface.
 *
 * Honnêteté : la plupart des navigateurs n'exposent ni reconnaissance ni voix
 * malagasy. Dans ce cas nous le signalons via `voiceNotice` / `mgVoiceAvailable`
 * au lieu de prétendre que le malagasy est pris en charge nativement.
 */
export function useLynaraVoice(options: UseLynaraVoiceOptions = {}) {
  const { onTranscript, lang = 'fr-FR' } = options;
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [mgVoiceAvailable, setMgVoiceAvailable] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const langRef = useRef(lang);
  const onTranscriptRef = useRef(onTranscript);
  const stateRef = useRef(state);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<{ ctx: AudioContext; raf: number } | null>(null);

  langRef.current = lang;
  onTranscriptRef.current = onTranscript;
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Pour l'écoute, la reconnaissance du navigateur n'expose pas toutes les
  // langues (le malagasy notamment). On écoute dans la langue demandée quand
  // elle est prise en charge, sinon en français, et le modèle répond quand
  // même dans la langue détectée du message.
  const sttLangUsed = lang.startsWith('mg') ? 'fr-FR' : lang;
  const voiceNotice = lang.startsWith('mg') && !mgVoiceAvailable
    ? 'Ce navigateur ne fournit pas de voix malagasy : l’écoute se fait en français et la réponse reste en malagasy à l’écrit (voix française si elle est lue).'
    : null;

  const stopMicMeter = useCallback(() => {
    if (analyserRef.current) {
      cancelAnimationFrame(analyserRef.current.raf);
      analyserRef.current.ctx.close().catch(() => {});
      analyserRef.current = null;
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  const startMicMeter = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        if (stateRef.current === 'listening') setAudioLevel(Math.min(1, avg * 2.2));
        analyserRef.current = { ctx, raf: requestAnimationFrame(tick) };
      };
      tick();
    } catch {
      /* le vumètre est optionnel, la reconnaissance fonctionne sans lui */
    }
  }, []);

  /** Choisit la meilleure voix disponible pour une balise BCP-47. */
  const pickVoiceFor = useCallback((targetTag: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current;
    if (!voices.length) return null;
    const prefix = targetTag.slice(0, 2).toLowerCase();

    const femaleHints: Record<string, string[]> = {
      fr: ['amelie', 'audrey', 'hortense', 'julie', 'denise', 'virginie', 'google français', 'female'],
      en: ['natural', 'jenny', 'samantha', 'victoria', 'aria', 'zira', 'google us english', 'google uk english female'],
      es: ['monica', 'paulina', 'helena', 'sabina', 'google español', 'female'],
      pt: ['luciana', 'joana', 'maria', 'google português', 'female'],
      de: ['katja', 'hedda', 'marlene', 'anna', 'google deutsch', 'female'],
      it: ['elsa', 'alice', 'federica', 'google italiano', 'female'],
      nl: ['lotte', 'fenna', 'google nederlands', 'female'],
      ru: ['milena', 'katya', 'irina', 'google русский', 'female'],
      ar: ['hoda', 'salma', 'laila', 'female'],
      hi: ['kalpana', 'swara', 'female'],
      zh: ['ting', 'xiaoxiao', 'huihui', 'female'],
      ja: ['nanami', 'haruka', 'ayumi', 'female'],
      ko: ['yuna', 'heami', 'female'],
      tr: ['tolga', 'filiz', 'female'],
      pl: ['paulina', 'zofia', 'female'],
    };

    const pool = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    if (pool.length) {
      const hints = femaleHints[prefix] || ['female', 'woman'];
      return pool.find((v) => hints.some((n) => v.name.toLowerCase().includes(n))) || pool[0];
    }

    if (prefix === 'mg') {
      // Repli assumé et signalé : voix française pour lire du malagasy.
      const frPool = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
      return frPool.find((v) => v.name.toLowerCase().includes('google français')) || frPool[0] || null;
    }

    return null;
  }, []);

  /**
   * Message honnête quand aucune voix n'existe pour une langue : le texte
   * reste correct, seule la prononciation est approximative.
   */
  const voiceNoticeFor = useCallback((targetTag: string): string | null => {
    const prefix = targetTag.slice(0, 2).toLowerCase();
    if (prefix === 'mg') {
      return mgVoiceAvailable
        ? null
        : 'Ce navigateur ne fournit pas de voix malagasy : la réponse reste correcte à l’écrit, mais sa lecture utilise une voix de repli et la prononciation peut être approximative.';
    }
    const voices = voicesRef.current;
    // Tant que la liste n'est pas chargée, ne pas afficher une fausse alerte.
    if (!voices.length) return null;
    const available = voices.some((v) => v.lang.toLowerCase().startsWith(prefix));
    if (available) return null;
    return `Ce navigateur ne fournit pas de voix pour cette langue (${targetTag}) : la réponse reste correcte à l’écrit, et aucune lecture vocale n’est lancée afin d’éviter une prononciation incorrecte.`;
  }, [mgVoiceAvailable]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      voicesRef.current = voices;
      setMgVoiceAvailable(voices.some((v) => v.lang.toLowerCase().startsWith('mg')));
      const preferred = pickVoiceFor(langRef.current);
      if (preferred) setActiveVoiceName(preferred.name);
    };

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setSpeechSupported(true);
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      try {
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = sttLangUsed;
        rec.onresult = (event: any) => {
          let interim = '';
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const txt = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += txt;
            else interim += txt;
          }
          setInterimTranscript(interim);
          if (finalText.trim()) {
            setTranscript(finalText);
            setInterimTranscript('');
            setState('thinking');
            onTranscriptRef.current?.(finalText);
          }
        };
        rec.onerror = (event: any) => {
          setVoiceError(
            event.error === 'not-allowed'
              ? 'Microphone refusé : autorisez l’accès au micro dans le navigateur.'
              : `Reconnaissance vocale : ${event.error}`
          );
          setState('idle');
          stopMicMeter();
        };
        rec.onend = () => {
          stopMicMeter();
          if (stateRef.current === 'listening') setState('idle');
        };
        recognitionRef.current = rec;
        setRecognitionSupported(true);
      } catch {
        setRecognitionSupported(false);
      }
    }
    return () => stopMicMeter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const cleanSpokenText = (raw: string): string =>
    raw
      .replace(/[*#_`>~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[{}\[\]\\|]/g, ' ')
      // Conserve les lettres et chiffres de toutes les écritures (Unicode).
      .replace(/[^\p{L}\p{N}\s.,!?'%:;\-–—]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  /**
   * Prononce un texte. `langOverride` (ex. 'mg-MG') force la voix de la langue
   * détectée dans le message utilisateur, indépendamment de la langue d'écoute.
   */
  const speak = useCallback(
    (text: string, langOverride?: string) => {
      if (!synthRef.current || isMuted) return;

      const targetTag = langOverride || langRef.current;
      synthRef.current.cancel();

      const cleanText = cleanSpokenText(text);
      if (!cleanText) return;

      const voice = pickVoiceFor(targetTag);
      // Aucune voix pour cette langue : mieux vaut rester silencieux que de
      // lire un texte espagnol, arabe, etc. avec une voix française.
      // Le malagasy garde son repli français explicitement annoncé.
      if (!voice && !targetTag.toLowerCase().startsWith('mg')) {
        setActiveVoiceName('');
        setAudioLevel(0);
        setState('idle');
        return;
      }
      if (voice) setActiveVoiceName(voice.name);

      // Découpage pour éviter les blocages de synthèse sur les longues réponses.
      const chunks = cleanText.match(/[^.!?。！？]+[.!?。！？]+|\S[^.!?。！？]*$/g)?.slice(0, 8) || [cleanText];
      let idx = 0;

      const speakNext = () => {
        if (!synthRef.current || idx >= chunks.length) {
          setAudioLevel(0);
          setState('idle');
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[idx].trim());
        u.lang = voice?.lang || targetTag;

        // Ne jamais coller une voix française sur un texte malagasy : si aucune
        // voix MG n'existe, on lit la réponse avec la voix française de repli.
        if (voice) u.voice = voice;
        u.pitch = 1.05;
        u.rate = 1.0;

        let pulse: any = null;
        u.onstart = () => {
          setState('speaking');
          pulse = setInterval(() => setAudioLevel(0.35 + Math.random() * 0.55), 110);
        };
        u.onboundary = () => setAudioLevel(0.55 + Math.random() * 0.45);
        const done = () => {
          clearInterval(pulse);
          idx++;
          speakNext();
        };
        u.onend = done;
        u.onerror = () => {
          clearInterval(pulse);
          setAudioLevel(0);
          setState('idle');
        };
        synthRef.current.speak(u);
      };

      speakNext();
    },
    [isMuted, pickVoiceFor]
  );

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setAudioLevel(0);
    setState('idle');
  }, []);

  const startListening = useCallback(() => {
    setVoiceError(null);
    if (!recognitionRef.current) {
      setVoiceError(
        'Reconnaissance vocale non disponible dans ce navigateur (Chrome/Edge recommandés). Le chat écrit reste disponible.'
      );
      return;
    }
    stopSpeaking();
    setTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
      setState('listening');
      startMicMeter();
    } catch {
      /* déjà en cours */
    }
  }, [stopSpeaking, startMicMeter]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    stopMicMeter();
    setState('idle');
  }, [stopMicMeter]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        synthRef.current?.cancel();
        setState('idle');
      }
      return !prev;
    });
  }, []);

  return {
    state,
    setState,
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
    sttLangUsed,
    mgVoiceAvailable,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    toggleMute,
  };
}
