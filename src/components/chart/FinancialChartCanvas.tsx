import React, { useEffect, useRef, useState, useCallback } from 'react';
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

export const FinancialChartCanvas: React.FC<FinancialChartProps> = ({
  symbol = 'BTCUSDT',
  onSnapshot,
  onSymbolChange,
  height = 420,
  highlightZones,
}) => {
  const { t, currentLang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [hoverData, setHoverData] = useState<{ candle: Candle; x: number; y: number } | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [dataSource, setDataSource] = useState<string>('Flux de marché certifié');

  // Fetch real candles from our server / Marché proxy / ECB
  const fetchCandles = useCallback(async (sym: string, tf: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanSym = sym.replace('/', '').toUpperCase();
      const res = await fetch(`/api/market/candles?symbol=${cleanSym}&interval=${tf}&limit=90`);
      const data = await res.json();

      if (data.success && Array.isArray(data.candles) && data.candles.length > 0) {
        setCandles(data.candles);
        setDataSource(data.source || 'Données Réelles Vérifiées');
        setLastUpdated(Date.now());
      } else {
        setError(data.error || 'Aucune cotation temps réel disponible pour cet actif.');
        setCandles([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur réseau lors de la récupération des cotations réelles.');
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setSelectedSymbol(symbol); }, [symbol]);

  useEffect(() => {
    fetchCandles(selectedSymbol, timeframe);
  }, [selectedSymbol, timeframe, fetchCandles]);

  // Render chart on canvas
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

    // Background
    ctx.fillStyle = '#080B10';
    ctx.fillRect(0, 0, w, h);

    // Calculate Price Min/Max
    const paddingBottom = 40;
    const paddingTop = 30;
    const paddingRight = 65;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    const priceRange = maxPrice - minPrice || 1;
    const priceToY = (p: number) => h - paddingBottom - ((p - minPrice) / priceRange) * (h - paddingTop - paddingBottom);

    // Draw Price Grid Lines
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748B';

    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (priceRange * i) / steps;
      const y = priceToY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w - paddingRight, y);
      ctx.stroke();

      ctx.fillText(p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), w - paddingRight + 6, y + 3);
    }

    // Highlight Order Blocks if present
    if (highlightZones?.orderBlocks) {
      highlightZones.orderBlocks.forEach((ob) => {
        const yTop = priceToY(ob.high);
        const yBot = priceToY(ob.low);
        ctx.fillStyle = ob.type === 'BULLISH' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, yTop, w - paddingRight, yBot - yTop);
        ctx.strokeStyle = ob.type === 'BULLISH' ? '#10B981' : '#EF4444';
        ctx.strokeRect(0, yTop, w - paddingRight, yBot - yTop);
      });
    }

    // Highlight Key Supports / Resistances
    if (highlightZones?.supportLevels) {
      highlightZones.supportLevels.forEach((lvl) => {
        const y = priceToY(lvl);
        ctx.strokeStyle = '#06B6D4';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w - paddingRight, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#06B6D4';
        ctx.fillText(`SUPP ${lvl}`, 8, y - 4);
      });
    }

    if (highlightZones?.resistanceLevels) {
      highlightZones.resistanceLevels.forEach((lvl) => {
        const y = priceToY(lvl);
        ctx.strokeStyle = '#F97316';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w - paddingRight, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#F97316';
        ctx.fillText(`RES ${lvl}`, 8, y - 4);
      });
    }

    // Draw Candlesticks
    const chartWidth = w - paddingRight;
    const candleWidth = Math.max(3, (chartWidth / candles.length) * 0.7);
    const spacing = chartWidth / candles.length;

    candles.forEach((c, idx) => {
      const x = idx * spacing + spacing / 2;
      const isGreen = c.close >= c.open;
      const color = isGreen ? '#10B981' : '#EF4444';

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, priceToY(c.high));
      ctx.lineTo(x, priceToY(c.low));
      ctx.stroke();

      // Body
      const yOpen = priceToY(c.open);
      const yClose = priceToY(c.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw EMA 21 indicator line
    const ema21 = calculateEMA(candles.map((c) => c.close), 21);
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (let i = 20; i < candles.length; i++) {
      const x = i * spacing + spacing / 2;
      const y = priceToY(ema21[i]);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Crosshair if hovering
    if (hoverData) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverData.x, 0);
      ctx.lineTo(hoverData.x, h - paddingBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, hoverData.y);
      ctx.lineTo(w - paddingRight, hoverData.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, highlightZones, hoverData]);

  // Helper for EMA line
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

  // Handle Mouse Move on Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width - 65;
    const spacing = chartWidth / candles.length;
    const idx = Math.floor(x / spacing);

    if (idx >= 0 && idx < candles.length) {
      setHoverData({ candle: candles[idx], x, y });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Export Canvas Image for Multimodal AI Vision
  const handleExportSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSnapshot) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSnapshot(dataUrl);
  };

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange = lastCandle && firstCandle ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 : 0;

  return (
    <div ref={containerRef} className="flex flex-col bg-[#0B0F17] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          {/* Symbol Select */}
          <select
            value={selectedSymbol}
            onChange={(e) => {
              setSelectedSymbol(e.target.value);
              if (onSymbolChange) onSymbolChange(e.target.value);
            }}
            className="bg-slate-950 border border-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
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

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            {['15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  timeframe === tf ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Price & Change Indicator */}
          {lastCandle && (
            <div className="hidden sm:flex items-baseline gap-2 pl-2">
              <span className="font-mono text-base font-bold text-slate-100">
                ${lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold font-mono ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline">{dataSource}</span>
          </div>

          <button
            onClick={() => fetchCandles(selectedSymbol, timeframe)}
            disabled={loading}
            title={t.extra.refreshQuotesTitle}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
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

      {/* Chart Canvas Area */}
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
                onClick={() => fetchCandles(selectedSymbol, timeframe)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md"
              >
                {t.common.refresh}
              </button>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Live Hover HUD Bar */}
        {hoverData && (
          <div className="absolute top-2 left-3 bg-slate-950/90 border border-slate-700/80 rounded-md px-3 py-1 text-xs font-mono text-slate-300 flex items-center gap-3 backdrop-blur-md pointer-events-none shadow-lg">
            <span>
              O: <strong className="text-slate-100">{hoverData.candle.open}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">{hoverData.candle.high}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">{hoverData.candle.low}</strong>
            </span>
            <span>
              C: <strong className="text-orange-400">{hoverData.candle.close}</strong>
            </span>
            <span className="text-slate-500">
              Vol: {hoverData.candle.volume}
            </span>
          </div>
        )}
      </div>

      {/* Legend footer */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 font-mono">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> {t.extra.bullishLegend}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> {t.extra.bearishLegend}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-0.5 bg-orange-500" /> EMA 21
          </span>
        </div>
        <div className="whitespace-nowrap ml-auto">
          {t.extra.timestampWord} : {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
