import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Candle } from '../../utils/backtestEngine';
import { Camera, RefreshCw, ZoomIn, ZoomOut, Eye, Activity } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export interface FinancialChartProps {
  symbol?: string;
  onSnapshot?: (base64Image: string) => void;
  onSymbolChange?: (symbol: string) => void;
  height?: number;
  highlightZones?: {
    orderBlocks?: { low: number; high: number; type: 'BULLISH' | 'BEARISH' }[];
    supportLevels?: number[];
    resistanceLevels?: number[];
  };
}

const TIME_FRAMES: Array<{ label: string; value: string; limit: number }> = [
  { label: '1s', value: '1s', limit: 300 },
  { label: '5s', value: '5s', limit: 300 },
  { label: '10s', value: '10s', limit: 300 },
  { label: '30s', value: '30s', limit: 300 },
  { label: '1m', value: '1m', limit: 300 },
  { label: '3m', value: '3m', limit: 300 },
  { label: '5m', value: '5m', limit: 300 },
  { label: '15m', value: '15m', limit: 300 },
  { label: '30m', value: '30m', limit: 300 },
  { label: '45m', value: '45m', limit: 300 },
  { label: '1h', value: '1h', limit: 300 },
  { label: '2h', value: '2h', limit: 300 },
  { label: '3h', value: '3h', limit: 300 },
  { label: '4h', value: '4h', limit: 300 },
  { label: '1D', value: '1d', limit: 300 },
  { label: '1W', value: '1w', limit: 200 },
  { label: '1M', value: '1M', limit: 200 },
  { label: '3M', value: '3M', limit: 200 },
  { label: '6M', value: '6M', limit: 200 },
  { label: '1Y', value: '1Y', limit: 200 },
];

const POLL_INTERVAL: Record<string, number> = {
  '1s': 5000, '5s': 5000, '10s': 10000, '30s': 10000,
  '1m': 15000, '3m': 15000, '5m': 30000, '15m': 60000,
  '30m': 60000, '45m': 60000, '1h': 300000, '2h': 300000,
  '3h': 300000, '4h': 300000, '1d': 900000, '1w': 900000,
  '1M': 900000, '3M': 900000, '6M': 900000, '1Y': 900000,
};

const DEFAULT_TIMEFRAME = '1h';
const ZOOM_LEVELS = [30, 50, 80, 120, 200, 300];
const MAX_CACHE = 1200;
const LOAD_THRESHOLD = 12;

function isLightTheme(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('light');
}

function chartColors(light: boolean) {
  return {
    bg: light ? '#ffffff' : '#080B10',
    grid: light ? '#e2e8f0' : '#1E293B',
    gridText: light ? '#64748b' : '#94a3b8',
    text: light ? '#0f172a' : '#f1f5f9',
    muted: light ? '#52627a' : '#64748b',
    bullish: light ? '#047857' : '#10B981',
    bearish: light ? '#be123c' : '#EF4444',
    ema: light ? '#b8430b' : '#F97316',
    crosshair: light ? 'rgba(14, 116, 144, 0.45)' : 'rgba(255, 255, 255, 0.35)',
    hoverBg: light ? 'rgba(255, 255, 255, 0.94)' : 'rgba(8, 11, 16, 0.94)',
    hoverBorder: light ? '#cbd5e1' : '#334155',
    hoverText: light ? '#0f172a' : '#f1f5f9',
    shadow: light ? 'rgba(15, 23, 42, 0.14)' : 'rgba(0, 0, 0, 0.45)',
  };
}

export const FinancialChartCanvas: React.FC<FinancialChartProps> = ({
  symbol = 'BTCUSDT',
  onSnapshot,
  onSymbolChange,
  height = 420,
  highlightZones,
}) => {
  const { t, currentLang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const [candles, setCandles] = useState<Candle[]>([]);
  const [windowStart, setWindowStart] = useState<number>(0);
  const [zoomIndex, setZoomIndex] = useState<number>(2);
  const [timeframe, setTimeframe] = useState<string>(DEFAULT_TIMEFRAME);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [dataSource, setDataSource] = useState<string>('Flux de marché certifié');

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanX, setLastPanX] = useState<number>(0);
  const [atRealTime, setAtRealTime] = useState<boolean>(true);

  const light = isLightTheme();
  const colors = chartColors(light);

  const timeframeInfo = useMemo(() => TIME_FRAMES.find((tf) => tf.value === timeframe) || TIME_FRAMES[10], [timeframe]);

  const visibleCount = Math.min(ZOOM_LEVELS[zoomIndex] ?? 120, candles.length);
  const windowEnd = Math.min(candles.length, windowStart + visibleCount);

  const fetchCandles = useCallback(async (
    sym: string,
    tf: string,
    opts: { endTime?: number } = {}
  ): Promise<{ newCandles: Candle[]; source: string } | null> => {
    if (!isMountedRef.current) return null;
    try {
      const cleanSym = sym.replace('/', '').toUpperCase();
      let url = `/api/market/candles?symbol=${cleanSym}&interval=${tf}&limit=${timeframeInfo.limit}`;
      if (opts.endTime) url += `&endTime=${opts.endTime}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.candles) || data.candles.length === 0) return null;

      const newCandles: Candle[] = data.candles.map((c: any) => ({
        timestamp: c.timestamp,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: c.volume == null ? null : parseFloat(c.volume),
      }));
      return { newCandles, source: data.source || 'Données Réelles Vérifiées' };
    } catch (err: any) {
      console.error('[chart] fetch error:', err);
      return null;
    }
  }, [timeframeInfo.limit]);

  const loadLatest = useCallback(async (sym: string, tf: string) => {
    setLoading(true);
    setError(null);
    const result = await fetchCandles(sym, tf);
    if (!result || !isMountedRef.current) {
      setLoading(false);
      return;
    }
    setCandles(result.newCandles.slice(-MAX_CACHE));
    setDataSource(result.source);
    setLastUpdated(Date.now());
    setWindowStart(Math.max(0, result.newCandles.length - visibleCount));
    setAtRealTime(true);
    setHoverIndex(null);
    setLoading(false);
  }, [visibleCount, fetchCandles]);

  const loadOlder = useCallback(async (sym: string, tf: string) => {
    if (candles.length === 0) return;
    setLoadingMore(true);
    const oldestTs = candles[0].timestamp;
    const result = await fetchCandles(sym, tf, { endTime: oldestTs - 1 });
    if (!result || !isMountedRef.current) {
      setLoadingMore(false);
      return;
    }
    setDataSource(result.source);
    setLastUpdated(Date.now());
    setCandles((prev) => [...result.newCandles, ...prev].slice(0, MAX_CACHE));
    setWindowStart((prev) => prev + result.newCandles.length);
    setLoadingMore(false);
  }, [candles.length, fetchCandles]);

  // Init / symbol or tf change
  useEffect(() => {
    setSelectedSymbol(symbol);
    loadLatest(selectedSymbol, timeframe);
  }, [selectedSymbol, timeframe, loadLatest]);

  // Polling (only when at real-time)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const ms = POLL_INTERVAL[timeframe] || 60000;
    pollRef.current = setInterval(async () => {
      if (!atRealTime || !selectedSymbol) return;
      const result = await fetchCandles(selectedSymbol, timeframe);
      if (!result || !isMountedRef.current) return;
      setDataSource(result.source);
      setLastUpdated(Date.now());
      setCandles((prev) => {
        const newestTs = prev.length > 0 ? prev[prev.length - 1].timestamp : 0;
        const trulyNew = result.newCandles.filter((c) => c.timestamp > newestTs);
        if (trulyNew.length === 0) return prev;
        const merged = [...prev, ...trulyNew].slice(-MAX_CACHE);
        return merged;
      });
      setCandles((prev) => {
        setWindowStart(Math.max(0, prev.length - visibleCount));
        return prev;
      });
    }, ms);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedSymbol, timeframe, atRealTime, visibleCount, fetchCandles]);

  // Auto-load older when approaching left edge
  useEffect(() => {
    if (atRealTime || loadingMore || candles.length === 0) return;
    if (windowStart <= LOAD_THRESHOLD) {
      loadOlder(selectedSymbol, timeframe);
    }
  }, [windowStart, atRealTime, loadingMore, candles.length, selectedSymbol, timeframe, loadOlder]);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    const visible = candles.slice(windowStart, windowEnd);
    if (visible.length === 0) return;

    const paddingBottom = 40;
    const paddingTop = 30;
    const paddingRight = 70;
    const paddingLeft = 55;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of visible) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }
    const priceRange = maxPrice - minPrice || 1;
    const priceToY = (p: number) => h - paddingBottom - ((p - minPrice) / priceRange) * (h - paddingTop - paddingBottom);

    // Price grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = colors.gridText;
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (priceRange * i) / steps;
      const y = priceToY(p);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(w - paddingRight, y);
      ctx.stroke();
      ctx.fillText(p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), paddingLeft - 38, y + 3);
    }

    // Time grid
    const chartWidth = w - paddingRight - paddingLeft;
    const spacing = chartWidth / Math.max(visible.length - 1, 1);
    ctx.strokeStyle = colors.grid;
    ctx.setLineDash([1, 3]);
    const timeSteps = 5;
    for (let i = 0; i <= timeSteps; i++) {
      const x = paddingLeft + (chartWidth * i) / timeSteps;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, h - paddingBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Highlight zones
    if (highlightZones?.orderBlocks) {
      highlightZones.orderBlocks.forEach((ob) => {
        const yTop = priceToY(ob.high);
        const yBot = priceToY(ob.low);
        ctx.fillStyle = ob.type === 'BULLISH' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(paddingLeft, yTop, chartWidth, yBot - yTop);
        ctx.strokeStyle = ob.type === 'BULLISH' ? colors.bullish : colors.bearish;
        ctx.strokeRect(paddingLeft, yTop, chartWidth, yBot - yTop);
      });
    }
    if (highlightZones?.supportLevels) {
      highlightZones.supportLevels.forEach((lvl) => {
        const y = priceToY(lvl);
        ctx.strokeStyle = '#06B6D4';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(w - paddingRight, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors.muted;
        ctx.fillText(`SUPP ${lvl}`, paddingLeft + 4, y - 5);
      });
    }
    if (highlightZones?.resistanceLevels) {
      highlightZones.resistanceLevels.forEach((lvl) => {
        const y = priceToY(lvl);
        ctx.strokeStyle = '#F97316';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(w - paddingRight, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors.muted;
        ctx.fillText(`RES ${lvl}`, paddingLeft + 4, y - 5);
      });
    }

    // Candles
    visible.forEach((c, idx) => {
      const x = paddingLeft + idx * spacing + spacing / 2;
      const isGreen = c.close >= c.open;
      const color = isGreen ? colors.bullish : colors.bearish;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(c.high));
      ctx.lineTo(x, priceToY(c.low));
      ctx.stroke();
      const yOpen = priceToY(c.open);
      const yClose = priceToY(c.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      ctx.fillRect(x - spacing * 0.6 / 2, bodyTop, spacing * 0.6, bodyHeight);
    });

    // EMA 21
    const closes = visible.map((c) => c.close);
    const ema21 = calculateEMA(closes, 21);
    if (ema21.length > 20) {
      ctx.strokeStyle = colors.ema;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let started = false;
      for (let i = 20; i < visible.length; i++) {
        const x = paddingLeft + i * spacing + spacing / 2;
        const y = priceToY(ema21[i]);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Crosshair
    if (hoverIndex !== null && hoverIndex >= windowStart && hoverIndex < windowEnd) {
      const localIdx = hoverIndex - windowStart;
      const hx = paddingLeft + localIdx * spacing + spacing / 2;
      const hy = priceToY(candles[hoverIndex].close);
      ctx.strokeStyle = colors.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, paddingTop);
      ctx.lineTo(hx, h - paddingBottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(paddingLeft, hy);
      ctx.lineTo(w - paddingRight, hy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Time labels
    ctx.fillStyle = colors.muted;
    ctx.font = '10px JetBrains Mono, monospace';
    const firstVisible = visible[0];
    const lastVisible = visible[visible.length - 1];
    if (firstVisible && lastVisible) {
      ctx.fillText(new Date(firstVisible.timestamp).toLocaleDateString(), paddingLeft, h - 10);
      ctx.fillText(new Date(lastVisible.timestamp).toLocaleDateString(), w - paddingRight - 120, h - 10);
    }
  }, [candles, windowStart, windowEnd, timeframe, zoomIndex, highlightZones, colors]);

  function calculateEMA(prices: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = new Array(prices.length).fill(0);
    if (prices.length < period) return ema;
    let sum = 0;
    for (let i = 0; i < period; i++) sum += prices[i];
    ema[period - 1] = sum / period;
    for (let i = period; i < prices.length; i++) {
      ema[i] = prices[i] * k + ema[i - 1] * (1 - k);
    }
    return ema;
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 55;
    const paddingRight = 70;
    const chartWidth = rect.width - paddingRight - paddingLeft;
    const visibleCount2 = Math.min(ZOOM_LEVELS[zoomIndex] ?? 120, candles.length);
    const spacing = chartWidth / Math.max(visibleCount2 - 1, 1);
    const idx = Math.floor((x - paddingLeft) / spacing);
    const realIdx = windowStart + idx;
    if (realIdx >= 0 && realIdx < candles.length) {
      setHoverIndex(realIdx);
    } else {
      setHoverIndex(null);
    }
  }, [candles, windowStart, zoomIndex]);

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleZoomIn = useCallback(() => {
    setZoomIndex((prevZ) => {
      const nextZ = Math.min(prevZ + 1, ZOOM_LEVELS.length - 1);
      const centerIdx = Math.min(windowStart + Math.floor(visibleCount / 2), Math.max(0, candles.length - 1));
      const newCount = ZOOM_LEVELS[nextZ];
      setWindowStart(Math.max(0, centerIdx - Math.floor(newCount / 2)));
      setAtRealTime(false);
      setHoverIndex(null);
      return nextZ;
    });
  }, [candles.length, windowStart, visibleCount]);

  const handleZoomOut = useCallback(() => {
    setZoomIndex((prevZ) => {
      const nextZ = Math.max(prevZ - 1, 0);
      const centerIdx = Math.min(windowStart + Math.floor(visibleCount / 2), Math.max(0, candles.length - 1));
      const newCount = ZOOM_LEVELS[nextZ];
      setWindowStart(Math.max(0, centerIdx - Math.floor(newCount / 2)));
      setAtRealTime(false);
      setHoverIndex(null);
      return nextZ;
    });
  }, [candles.length, windowStart, visibleCount]);

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPanning(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setLastPanX(clientX);
    setHoverIndex(null);
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const dx = clientX - lastPanX;
    if (Math.abs(dx) < 4) return;

    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const chartWidth = rect.width - 70 - 55;
    const visibleCount2 = Math.min(ZOOM_LEVELS[zoomIndex] ?? 120, candles.length);
    const spacing = chartWidth / Math.max(visibleCount2 - 1, 1);
    const shift = -Math.round(dx / spacing);

    setWindowStart((prev) => {
      const next = prev + shift;
      return Math.max(0, Math.min(next, Math.max(0, candles.length - visibleCount2)));
    });
    setAtRealTime(false);
    setLastPanX(clientX);
    setHoverIndex(null);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleResetToRealTime = useCallback(() => {
    setCandles((prev) => {
      setWindowStart(Math.max(0, prev.length - visibleCount));
      setAtRealTime(true);
      setHoverIndex(null);
      return prev;
    });
  }, [visibleCount]);

  const handleExportSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSnapshot) return;
    onSnapshot(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange = lastCandle && firstCandle ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 : 0;
  const atLeftEdge = windowStart <= 0;

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${light ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'}`}
      onMouseDown={handlePanStart}
      onMouseMove={handlePanMove}
      onMouseUp={handlePanEnd}
      onMouseLeave={handlePanEnd}
      onTouchStart={handlePanStart}
      onTouchMove={(e) => { handlePanMove(e); e.preventDefault(); }}
      onTouchEnd={handlePanEnd}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <select
            value={selectedSymbol}
            onChange={(e) => {
              setSelectedSymbol(e.target.value);
              if (onSymbolChange) onSymbolChange(e.target.value);
            }}
            className="bg-slate-950 border border-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-orange-500 cursor-pointer shrink-0"
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
            <option value="BNBUSDT">BNB/USDT</option>
            <option value="XRPUSDT">XRP/USDT</option>
            <option value="PAXGUSDT">XAU/USD ({t.common.gold})</option>
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="USDJPY">USD/JPY</option>
            <option value="USDMGA">USD/MGA</option>
            <option value="SPX">S&amp;P 500</option>
            <option value="NDQ">Nasdaq 100</option>
            <option value="DJI">Dow Jones</option>
          </select>

          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex-wrap min-w-0">
            {TIME_FRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                  timeframe === tf.value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tf.label.toUpperCase()}
              </button>
            ))}
          </div>

          {lastCandle && (
            <div className="hidden sm:flex items-baseline gap-2 pl-2 shrink-0">
              <span className="font-mono text-sm font-bold text-slate-100">
                ${lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold font-mono ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 shrink-0">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline">{dataSource}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleZoomOut}
              title="Dézoomer"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoomer"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            {!atRealTime && (
              <button
                onClick={handleResetToRealTime}
                title="Revenir au temps réel"
                className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => loadLatest(selectedSymbol, timeframe)}
            disabled={loading}
            title={t.extra.refreshQuotesTitle}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          {onSnapshot && (
            <button
              onClick={handleExportSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.extra.sendToAiVision}</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        {loading && candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">{t.common.loading}</span>
            </div>
          </div>
        )}

        {error && candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-10 p-6 text-center">
            <div className="max-w-md space-y-3">
              <Activity className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">{error}</p>
              <button
                onClick={() => loadLatest(selectedSymbol, timeframe)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md"
              >
                {t.common.refresh}
              </button>
            </div>
          </div>
        )}

        {loadingMore && candles.length > 0 && (
          <div className="absolute top-2 right-3 z-20 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono px-2 py-1 rounded">
            Chargement historique…
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />

        {hoverIndex !== null && (
          <div className="absolute top-2 left-3 bg-slate-950/94 border border-slate-700/80 rounded-md px-3 py-1.5 text-xs font-mono text-slate-300 flex items-center gap-3 backdrop-blur-md pointer-events-none shadow-lg">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              O: <strong className="text-slate-100">{candles[hoverIndex].open}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              H: <strong className="text-emerald-400">{candles[hoverIndex].high}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60" />
              L: <strong className="text-rose-400">{candles[hoverIndex].low}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
              C: <strong className="text-orange-400">{candles[hoverIndex].close}</strong>
            </span>
            <span className="text-slate-500">
              Vol: {candles[hoverIndex].volume ?? '—'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-400 font-mono">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> {t.extra.bullishLegend}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-sm bg-rose-500" /> {t.extra.bearishLegend}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span className="w-3 h-0.5 bg-orange-500" /> EMA 21
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-sm bg-orange-500/20 border border-orange-500/40" />
            TF {timeframe.toUpperCase()}
          </span>
          {!atRealTime && (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-amber-400 shrink-0">
              Historique consulté
            </span>
          )}
          {!atLeftEdge && (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-slate-500 shrink-0">
              Plus ancien disponible
            </span>
          )}
        </div>
        <div className="whitespace-nowrap ml-auto shrink-0">
          {t.extra.timestampWord} : {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
