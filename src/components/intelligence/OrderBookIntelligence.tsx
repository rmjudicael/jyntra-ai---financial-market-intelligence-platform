import React, { useState } from 'react';
import { BookOpen, Loader2, AlertCircle, RefreshCw, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';

interface Level { price: number; qty: number; }

interface DepthMetrics {
  symbol: string;
  bidCount: number;
  askCount: number;
  topBid: Level;
  topAsk: Level;
  spread: number;
  spreadPct: number;
  bidQty: number;
  askQty: number;
  imbalance: number;
  top3Bid: number;
  top3Ask: number;
  topBidLevel: Level;
  topAskLevel: Level;
  bids: Level[];
  asks: Level[];
}

export const OrderBookIntelligence: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [running, setRunning] = useState(false);
  const [loadingDepth, setLoadingDepth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [depthInfo, setDepthInfo] = useState<string>('');
  const [metrics, setMetrics] = useState<DepthMetrics | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchDepth = async (): Promise<DepthMetrics> => {
    setLoadingDepth(true);
    try {
      const res = await fetch(`/api/market/depth?symbol=${encodeURIComponent(symbol)}&limit=30`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'depth unavailable');
      const bids: Level[] = data.bids || [];
      const asks: Level[] = data.asks || [];
      if (bids.length === 0 || asks.length === 0) throw new Error('empty book');

      const bidQty = bids.reduce((a, b) => a + b.qty, 0);
      const askQty = asks.reduce((a, b) => a + b.qty, 0);
      const total = bidQty + askQty;
      const imbalance = total > 0 ? ((bidQty - askQty) / total) * 100 : 0;
      const topBid = bids[0]!;
      const topAsk = asks[0]!;
      const spread = topAsk.price - topBid.price;
      const spreadPct = (spread / topBid.price) * 100;
      const top3Bid = bids.slice(0, 3).reduce((a, b) => a + b.qty, 0);
      const top3Ask = asks.slice(0, 3).reduce((a, b) => a + b.qty, 0);
      const topBidLevel = bids.reduce((m, l) => (l.qty > m.qty ? l : m), bids[0]);
      const topAskLevel = asks.reduce((m, l) => (l.qty > m.qty ? l : m), asks[0]);

      const metrics: DepthMetrics = {
        symbol,
        bidCount: bids.length,
        askCount: asks.length,
        topBid,
        topAsk,
        spread,
        spreadPct,
        bidQty,
        askQty,
        imbalance,
        top3Bid,
        top3Ask,
        topBidLevel,
        topAskLevel,
        bids,
        asks,
      };
      setMetrics(metrics);

      const lines = [
        'Carnet réel pour ' + symbol + ' (Binance depth, ' + bids.length + ' bids / ' + asks.length + ' asks)',
        'Meilleur bid: ' + topBid.price + ' (' + topBid.qty + ') | Meilleur ask: ' + topAsk.price + ' (' + topAsk.qty + ')',
        'Spread: ' + spread.toFixed(6) + ' (' + spreadPct.toFixed(4) + '%)',
        'Volume bid total (top ' + bids.length + '): ' + bidQty.toFixed(4) + ' | Volume ask total: ' + askQty.toFixed(4),
        'Déséquilibre bid/ask: ' + imbalance.toFixed(2) + '% (positif = plus de bids)',
        'Concentration top3 bids: ' + top3Bid.toFixed(4) + ' (' + ((top3Bid / bidQty) * 100).toFixed(1) + '% du volume bid)',
        'Concentration top3 asks: ' + top3Ask.toFixed(4) + ' (' + ((top3Ask / askQty) * 100).toFixed(1) + '% du volume ask)',
        'Plus gros niveau bid: ' + topBidLevel.price + ' (' + topBidLevel.qty + ')',
        'Plus gros niveau ask: ' + topAskLevel.price + ' (' + topAskLevel.qty + ')',
        'Bids (price x qty): ' + bids.map((b) => b.price + 'x' + b.qty).join(', '),
        'Asks (price x qty): ' + asks.map((a) => a.price + 'x' + a.qty).join(', '),
      ];
      const summary = lines.join('\n');
      setDepthInfo(summary);
      return metrics;
    } finally {
      setLoadingDepth(false);
    }
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      await fetchDepth();
      const res = await fetch('/api/ai/engine-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            'Analyse ce carnet d\'ordres réel. Le moteur a calculé les métriques; toi tu interprètes. Ne jamais prétendre connaître l\'intention réelle des acteurs. Sépare DATA / INTERPRETATION / UNCERTAINTY.\n\n' +
            depthInfo + '\n\n' +
            'Sections requises:\n' +
            'DATA\nCe qui est mesurable dans le carnet.\n' +
            'INTERPRETATION\nCe qui peut être interprété (déséquilibre, concentration, zones de liquidité, changements rapides).\n' +
            'UNCERTAINTY\nCe qui reste incertain (intention des acteurs, spoofing possible, données limitées à un instant T).\n' +
            'LIQUIDITY STORY\nComment la liquidité évolue: T0 -> T1 -> T2 -> T3 (décrire à partir de cette seule observation et de ce qui est observable; si une seule observation, dire "une seule observation disponible").\n' +
            'Si données insuffisantes: NOT ENOUGH DATA.',
          systemPrompt: 'Tu es l\'analyste carnet d\'ordres de JYNTRA AI. Tu raisonnes uniquement à partir des données fournies. Tu ne dois jamais inventer de niveaux, quantités ou intentions.',
        }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error || 'Analyse indisponible.');
      else setResult(typeof data.text === 'string' ? data.text : JSON.stringify(data.text));
    } catch (e: any) {
      setError(e?.message || 'Erreur de connexion.');
    } finally {
      setRunning(false);
    }
  };

  if (!metrics) {
    return (
      <div className="rounded-2xl border p-5 space-y-4 transition-all duration-300 from-cyan-500/10 to-slate-900/60 border-cyan-500/30">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
          <BookOpen className="w-3.5 h-3.5" />
          Order Book Intelligence (Carnets) - Meta
        </div>
        <p className="text-[11px] text-slate-400">Déséquilibre bid/ask, concentration, zones de liquidité. Le moteur calcule, Meta interprète. DATA / INTERPRETATION / UNCERTAINTY.</p>
        <button
          onClick={run}
          disabled={running || loadingDepth}
          className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white hover:border-orange-500/60 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
        >
          {running || loadingDepth ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>{running ? 'Analyse en cours...' : loadingDepth ? 'Chargement du carnet...' : 'Analyser le carnet d\'ordres'}</span>
        </button>
        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100/50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const isPositive = metrics.imbalance >= 0;
  const spreadColor = metrics.spreadPct < 0.1 ? 'text-emerald-400' : metrics.spreadPct < 0.5 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="rounded-2xl border p-5 space-y-4 transition-all duration-300 from-cyan-500/10 to-slate-900/60 border-cyan-500/30">
      {/* En-tête avec badge d'état */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
            <BookOpen className="w-3.5 h-3.5" />
            Order Book Intelligence (Carnets) - Meta
          </div>
          <p className="text-[11px] text-slate-400">Déséquilibre bid/ask, concentration, zones de liquidité. Le moteur calcule, Meta interprète.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {isPositive ? <ArrowUp className="w-3 h-3 shrink-0" /> : <ArrowDown className="w-3 h-3 shrink-0" />}
            {Math.abs(metrics.imbalance).toFixed(1)}%
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

      {/* Métriques clés en cartes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Spread</span>
          <span className="text-xs font-bold font-mono text-slate-100">{metrics.spread.toFixed(6)}</span>
          <span className={`text-[10px] font-bold ${spreadColor}`}>({metrics.spreadPct.toFixed(3)}%)</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Bid / Ask qty</span>
          <span className="text-xs font-bold font-mono text-emerald-400">{metrics.bidQty.toFixed(4)}</span>
          <span className="text-xs font-bold font-mono text-rose-400">{metrics.askQty.toFixed(4)}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Déséquilibre</span>
          <span className={`text-xs font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.imbalance.toFixed(1)}%
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Niveaux</span>
          <span className="text-xs font-bold font-mono text-cyan-400">{metrics.bidCount}</span>
          <span className="text-xs text-slate-400 font-mono">/</span>
          <span className="text-xs font-bold font-mono text-cyan-400">{metrics.askCount}</span>
        </div>
      </div>

      {/* Top bid / ask niveaux */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Top Bid</span>
            <span className="text-[10px] text-slate-500 font-mono">{metrics.topBid.price}</span>
          </div>
          <div className="text-xs font-mono text-slate-200">
            Qty: {metrics.topBid.qty.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Gros niveau: {metrics.topBidLevel.price}</div>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Top Ask</span>
            <span className="text-[10px] text-slate-500 font-mono">{metrics.topAsk.price}</span>
          </div>
          <div className="text-xs font-mono text-slate-200">
            Qty: {metrics.topAsk.qty.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Gros niveau: {metrics.topAskLevel.price}</div>
        </div>
      </div>

      {/* Bouton d'action Meta */}
      <button
        onClick={run}
        disabled={running || loadingDepth}
        className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white hover:border-orange-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm w-full"
      >
        {running || loadingDepth ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        <span>{running ? 'Analyse en cours...' : loadingDepth ? 'Chargement du carnet...' : 'Analyser le carnet d\'ordres'}</span>
      </button>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100/50 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Résultat IA : carte structurée (réduite par défaut) */}
      {expanded && result && (
        <div className="rounded-2xl border p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-cyan-400">Interprétation Meta</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100/50"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="rounded-xl border p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {result}
          </div>
        </div>
      )}
      {!expanded && result && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="text-cyan-400">•</span>
          <span>Résultat d'analyse disponible — cliquez pour développer</span>
        </div>
      )}
    </div>
  );
};
