import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, AlertCircle, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import { MetaIcon } from '../ui/MetaIcon';

interface JournalEntryLite { id: string; symbol: string; direction: string; status: string; entryPrice: number; pnl?: number; notes?: string; }

export const VoiceReflectionPanel: React.FC<{ entries: JournalEntryLite[] }> = ({ entries }) => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/ai/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, mimeType: blob.type }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Transcription indisponible.');
            setTranscript(data.text || '');
          } catch (e: any) {
            setError(e?.message || 'Echec de transcription.');
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e: any) {
      setError(e?.message || 'Microphone indisponible.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const runAnalysis = async () => {
    if (!transcript.trim()) { setError('Aucune transcription.'); return; }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const ctx = entries.slice(0, 5).map((e) => e.symbol + ' ' + e.direction + ' ' + e.status + ' pnl ' + (e.pnl ?? 'n/a')).join('\n');
      const res = await fetch('/api/ai/engine-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            'Réflexion vocale d un trader après transaction. Transcription réelle:\n"' + transcript + '"\n\n' +
            'Contexte journal (échantillon):\n' + (ctx || 'aucun') + '\n\n' +
            'Identifie (sans diagnostic psychologique certain):\n' +
            '- Justification exprimée\n- Raisonnement\n- Contradiction avec le plan (si observable)\n- Leçon potentielle\n' +
            'Si données insuffisantes: NOT ENOUGH EVIDENCE.',
          systemPrompt: 'Tu es l analyste réflexion de JYNTRA AI. Tu raisonnes uniquement à partir de la transcription et du journal. Ne présente aucune interprétation psychologique comme un fait certain.',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Analyse indisponible.');
      setAnalysis(typeof data.text === 'string' ? data.text : JSON.stringify(data.text));
    } catch (e: any) {
      setError(e?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-5 space-y-4 transition-all duration-300 from-rose-500/10 to-slate-900/60 border-rose-500/30">
      {/* En-tête avec badge d'état */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
            <Mic className="w-3.5 h-3.5" />
            Voice Reflection - Meta
          </div>
          <p className="text-[11px] text-slate-400">Enregistrez une réflexion vocale après une transaction. Pipeline: Voice → Transcription → Meta Analysis → Journal Insight.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            recording ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
          }`}>
            {recording ? <Mic className="w-3 h-3 shrink-0 animate-pulse" /> : <Square className="w-3 h-3 shrink-0" />}
            {recording ? 'EN DIRECT' : 'PRÊT'}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100/50"
            aria-label="toggle detail"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Contrôles d'enregistrement */}
      <div className="flex items-center gap-2">
        {!recording ? (
          <button onClick={startRecording} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white hover:border-orange-500/60 transition-all flex items-center gap-2 shadow-sm">
            <Mic className="w-3.5 h-3.5" /> Enregistrer
          </button>
        ) : (
          <button onClick={stopRecording} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20">
            <Square className="w-3.5 h-3.5" /> Stop
          </button>
        )}
      </div>

      {/* Transcription */}
      {transcript && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-cyan-400">Transcription</span>
            <span className="text-[10px] text-slate-500 font-mono">{transcript.length} caractères</span>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 min-h-[80px] focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      )}

      {/* Bouton d'analyse */}
      {transcript && (
        <button onClick={runAnalysis} disabled={loading} className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white hover:border-orange-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm w-full">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MetaIcon className="w-3.5 h-3.5" />}
          <span>Analyser la réflexion</span>
        </button>
      )}

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100/50 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Résultat IA : carte structurée */}
      {expanded && analysis && (
        <div className="rounded-2xl border p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-rose-400">Insight Meta</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100/50"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="rounded-xl border p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {analysis}
          </div>
        </div>
      )}
      {!expanded && analysis && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="text-rose-400">•</span>
          <span>Insight d'analyse disponible — cliquez pour développer</span>
        </div>
      )}
    </div>
  );
};
