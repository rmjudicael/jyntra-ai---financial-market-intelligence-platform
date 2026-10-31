import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { parsePrice } from '../../services/workflowStore';

export interface CandleLike {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

const W = 1600;
const H = 1000;
const PAD_L = 28;
const AXIS_W = 200;
const HEADER_H = 96;
const CHART_X = PAD_L;
const CHART_Y = HEADER_H;
const CHART_W = W - PAD_L - AXIS_W;
const CHART_BOTTOM = 872;
const CHART_H = CHART_BOTTOM - CHART_Y;
const PANEL_Y = 902;

const TEXT = '#e6edf7';
const MUTED = '#8ea0b8';
const PANEL = '#0e141d';
const BORDER = 'rgba(148,163,184,0.16)';

type Tone = 'bull' | 'bear' | 'neutral';

interface PriceTag {
  y: number;
  price: number;
  label: string;
  color: string;
  weight: number;
}

interface ZoneRect {
  kind: string;
  label: string;
  top: number;
  bottom: number;
  tone: Tone;
  strength: string | null;
}

/** Validated axis calibration read from the uploaded screenshot. */
interface ChartGeometry {
  reliable: boolean;
  axis: { priceTop: number; priceBottom: number; yTopPct: number; yBottomPct: number };
  plot: { leftPct: number; rightPct: number };
}

function readGeometry(analysis: any): ChartGeometry | null {
  const g = analysis?.chartGeometry;
  if (!g || g.reliable !== true) return null;
  const a = g.axis || {};
  const p = g.plot || {};
  const priceTop = Number(a.priceTop);
  const priceBottom = Number(a.priceBottom);
  const yTopPct = Number(a.yTopPct);
  const yBottomPct = Number(a.yBottomPct);
  if (![priceTop, priceBottom, yTopPct, yBottomPct].every(Number.isFinite)) return null;
  if (priceTop <= priceBottom) return null;
  if (yTopPct < 0 || yBottomPct > 1 || yBottomPct - yTopPct < 0.15) return null;
  const leftPct = Number.isFinite(Number(p.leftPct)) ? Math.max(0, Math.min(0.85, Number(p.leftPct))) : 0.04;
  const rightPct = Number.isFinite(Number(p.rightPct)) ? Math.max(leftPct + 0.15, Math.min(1, Number(p.rightPct))) : 0.9;
  return { reliable: true, axis: { priceTop, priceBottom, yTopPct, yBottomPct }, plot: { leftPct, rightPct } };
}

/**
 * Professional annotated chart renderer.
 *
 * Two real sources are supported:
 *  1. Live candles from the market data API (annotations use a price axis).
 *  2. The user's own screenshot, kept as the original base image. When the
 *     analysis returns a validated axis calibration, levels and zones are
 *     projected onto the image with a linear price -> pixel mapping. Without
 *     that calibration no line is drawn over the image: a truthful side legend
 *     is shown instead. Nothing is ever placed at a guessed coordinate.
 */
export const AnnotatedChart: React.FC<{
  analysis: any;
  symbol: string;
  timeframe: string;
  imageBase64?: string;
  candles?: CandleLike[];
  onReady?: (dataUrl: string) => void;
}> = ({ analysis, symbol, timeframe, imageBase64, candles, onReady }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !analysis) return;
    let cancelled = false;

    const draw = async () => {
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const vo = analysis.visualObservations || {};
      const plan = analysis.tradePlan || {};
      const structure = analysis.structure || {};
      const geometry = readGeometry(analysis);

      /* ---------------------------------------------------------------- */
      /* 1. Verified data                                                  */
      /* ---------------------------------------------------------------- */

      const rawCandles = (Array.isArray(candles) ? candles : []).filter(
        (c) => c && Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close),
      );
      const sortedCandles = [...rawCandles].sort((a, b) => a.timestamp - b.timestamp);
      const hasCandles = sortedCandles.length > 5;
      const useImage = !hasCandles && !!imageBase64;

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      if (hasCandles) {
        sortedCandles.forEach((c) => {
          if (c.low < minPrice) minPrice = c.low;
          if (c.high > maxPrice) maxPrice = c.high;
        });
      }
      const rawRange = Number.isFinite(maxPrice - minPrice) && maxPrice > minPrice ? maxPrice - minPrice : 0;

      const inDomain = (p: number) =>
        !hasCandles || rawRange === 0 || (p >= minPrice - rawRange * 0.6 && p <= maxPrice + rawRange * 0.6);

      const seen: number[] = [];
      const acceptPrice = (p: number) => {
        if (!Number.isFinite(p) || p <= 0) return false;
        if (seen.some((s) => Math.abs(s - p) <= Math.max(1e-9, Math.abs(s) * 0.0003))) return false;
        if (!inDomain(p)) return false;
        seen.push(p);
        return true;
      };

      const planTags: PriceTag[] = [];
      const srTags: PriceTag[] = [];

      const addPlan = (label: string, value: any, color: string) => {
        const p = parsePrice(value);
        if (p === null || !acceptPrice(p)) return;
        planTags.push({ y: 0, price: p, label, color, weight: label === 'ENTRY' ? 2.2 : 1.7 });
      };

      addPlan('ENTRY', plan.entry, '#38bdf8');
      addPlan('SL', plan.stopLoss, '#fb7185');
      addPlan('TP1', plan.takeProfit1, '#34d399');
      addPlan('TP2', plan.takeProfit2, '#22c55e');
      addPlan('TP3', plan.takeProfit3, '#a3e635');

      const addSr = (label: string, value: any, color: string) => {
        const p = parsePrice(value);
        if (p === null || !acceptPrice(p)) return;
        srTags.push({ y: 0, price: p, label, color, weight: 1.35 });
      };

      if (Array.isArray(vo.keySupports)) {
        vo.keySupports.slice(0, 3).forEach((s: any, i: number) => addSr(`SUPPORT${vo.keySupports.length > 1 ? ' ' + (i + 1) : ''}`, s, '#22d3ee'));
      }
      if (Array.isArray(vo.keyResistances)) {
        vo.keyResistances.slice(0, 3).forEach((s: any, i: number) => addSr(`RESIST${vo.keyResistances.length > 1 ? ' ' + (i + 1) : ''}`, s, '#fb923c'));
      }
      if (structure.bosLevel) addSr('BOS', structure.bosLevel, '#60a5fa');
      if (structure.chochLevel) addSr('CHoCH', structure.chochLevel, '#c084fc');

      /* ---------------------------------------------------------------- */
      /* 2. Zones (numeric bounds only)                                    */
      /* ---------------------------------------------------------------- */

      const zoneRects: ZoneRect[] = [];
      const isBullishText = /(hauss|bull|demand|acheteur)/i;
      const isBearishText = /(baiss|bear|supply|vendeur)/i;

      (Array.isArray(analysis.zones) ? analysis.zones : []).forEach((z: any) => {
        if (!z || typeof z !== 'object') return;
        const kind = String(z.kind || '').toUpperCase();
        const label = String(z.label || kind);
        const top = parsePrice(z.top);
        const bottom = parsePrice(z.bottom);

        if ((kind === 'LIQUIDITY' || kind === 'SUPPORT' || kind === 'RESISTANCE') && !(top !== null && bottom !== null)) {
          const p = parsePrice(z.price) ?? top ?? bottom;
          if (p === null || !acceptPrice(p)) return;
          const color = kind === 'LIQUIDITY' ? '#fbbf24' : kind === 'SUPPORT' ? '#22d3ee' : '#fb923c';
          const name = kind === 'LIQUIDITY' ? 'LIQUIDITÉ' : kind === 'SUPPORT' ? 'SUPPORT' : 'RÉSISTANCE';
          srTags.push({ y: 0, price: p, label: name, color, weight: 1.1 });
          return;
        }

        if (top === null || bottom === null) return;
        const hi = Math.max(top, bottom);
        const lo = Math.min(top, bottom);
        if (hi === lo) return;
        if (!inDomain(hi) || !inDomain(lo)) return;

        let tone: Tone = 'neutral';
        if (kind === 'DEMAND' || isBullishText.test(label)) tone = 'bull';
        if (kind === 'SUPPLY' || isBearishText.test(label)) tone = 'bear';
        if (kind === 'ORDER_BLOCK' && tone === 'neutral') tone = /short|vente/i.test(label) ? 'bear' : 'bull';

        zoneRects.push({ kind, label, top: hi, bottom: lo, tone, strength: z.strength || null });
      });

      /* ---------------------------------------------------------------- */
      /* 3. Price domain                                                   */
      /* ---------------------------------------------------------------- */

      const allPrices = [...planTags, ...srTags].map((t) => t.price);
      zoneRects.forEach((z) => allPrices.push(z.top, z.bottom));

      if (hasCandles) {
        allPrices.forEach((p) => {
          if (p < minPrice) minPrice = p;
          if (p > maxPrice) maxPrice = p;
        });
      } else if (allPrices.length) {
        minPrice = Math.min(...allPrices);
        maxPrice = Math.max(...allPrices);
      } else {
        minPrice = 0;
        maxPrice = 100;
      }

      if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice === maxPrice) {
        const c = Number.isFinite(minPrice) ? minPrice : 0;
        minPrice = c - 1;
        maxPrice = c + 1;
      }

      const baseRange = maxPrice - minPrice;
      const pad = baseRange * 0.07;
      minPrice -= pad;
      maxPrice += pad;
      const range = maxPrice - minPrice;

      let priceToY = (p: number) => CHART_Y + ((maxPrice - p) / range) * CHART_H;
      /** Pixel rectangle of the screenshot inside the chart area (image mode). */
      let imageRect: { dx: number; dy: number; dw: number; dh: number } | null = null;

      const decimals = range >= 10000 ? 0 : range >= 500 ? 2 : range >= 10 ? 3 : range >= 1 ? 4 : 5;
      const fmt = (p: number) =>
        p.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

      /* ---------------------------------------------------------------- */
      /* 4. Background, header, grid                                       */
      /* ---------------------------------------------------------------- */

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0b1119');
      bg.addColorStop(0.55, '#080d14');
      bg.addColorStop(1, '#060a10');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const panelGrad = ctx.createLinearGradient(0, CHART_Y, 0, CHART_BOTTOM);
      panelGrad.addColorStop(0, '#0d141d');
      panelGrad.addColorStop(1, '#0a1017');
      ctx.fillStyle = panelGrad;
      ctx.fillRect(CHART_X, CHART_Y, CHART_W, CHART_H);

      ctx.fillStyle = '#0a0f16';
      ctx.fillRect(0, 0, W, HEADER_H - 1);
      const accent = ctx.createLinearGradient(PAD_L, 0, PAD_L + 420, 0);
      accent.addColorStop(0, '#f97316');
      accent.addColorStop(1, 'rgba(56,189,248,0.55)');
      ctx.fillStyle = accent;
      ctx.fillRect(PAD_L, HEADER_H - 2, 420, 2);
      ctx.fillStyle = 'rgba(148,163,184,0.12)';
      ctx.fillRect(PAD_L + 420, HEADER_H - 1, W - PAD_L * 2 - 420, 1);

      const brandGrad = ctx.createLinearGradient(PAD_L, 24, PAD_L + 32, 56);
      brandGrad.addColorStop(0, '#fb923c');
      brandGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = brandGrad;
      ctx.beginPath();
      ctx.roundRect(PAD_L, 24, 32, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#0b0f14';
      ctx.font = '900 18px "Segoe UI", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('J', PAD_L + 16, 47);
      ctx.textAlign = 'left';

      ctx.fillStyle = TEXT;
      ctx.font = '800 17px "Segoe UI", -apple-system, sans-serif';
      ctx.fillText('JYNTRA AI', PAD_L + 44, 39);
      ctx.fillStyle = MUTED;
      ctx.font = '600 11px "JetBrains Mono", Consolas, monospace';
      (ctx as any).letterSpacing = '1.4px';
      ctx.fillText('ANALYSE TECHNIQUE · SMC', PAD_L + 44, 55);
      (ctx as any).letterSpacing = '0px';

      ctx.fillStyle = TEXT;
      ctx.font = '800 30px "Segoe UI", -apple-system, sans-serif';
      ctx.fillText(`${symbol || analysis.instrument || '—'}`, 330, 50);
      const symbolWidth = ctx.measureText(`${symbol || analysis.instrument || '—'}`).width;
      ctx.fillStyle = '#f97316';
      ctx.font = '800 20px "JetBrains Mono", Consolas, monospace';
      ctx.fillText(`· ${timeframe || analysis.timeframe || '—'}`, 342 + symbolWidth, 50);
      ctx.fillStyle = MUTED;
      ctx.font = '500 12px "Segoe UI", -apple-system, sans-serif';
      ctx.fillText('Structure de marché · zones institutionnelles · plan de trade', 331, 72);

      const decision = ['BUY', 'SELL'].includes(String(analysis.recommendation).toUpperCase()) ? 'YES TRADE' : 'NO TRADE';
      const decisionColor =
        decision === 'NO TRADE'
          ? '#f59e0b'
          : String(analysis.recommendation).toUpperCase() === 'BUY'
          ? '#34d399'
          : '#fb7185';

      ctx.font = '800 13px "JetBrains Mono", Consolas, monospace';
      const pillTextW = ctx.measureText(decision).width;
      const pillW = pillTextW + 44;
      const pillX = W - PAD_L - pillW;
      const pillY = 26;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, 30, 15);
      ctx.fill();
      ctx.strokeStyle = decisionColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = decisionColor;
      ctx.beginPath();
      ctx.arc(pillX + 15, pillY + 15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(decision, pillX + 26, pillY + 20);

      const trendMap: Record<string, { text: string; color: string }> = {
        BULLISH: { text: 'BIAIS HAUSSIER', color: '#34d399' },
        BEARISH: { text: 'BIAIS BAISSIER', color: '#fb7185' },
        RANGING: { text: 'EN RANGE', color: '#fbbf24' },
        UNCERTAIN: { text: 'INDÉCIS', color: '#94a3b8' },
      };
      const trend = trendMap[String(vo.trend || 'UNCERTAIN').toUpperCase()] || trendMap.UNCERTAIN;
      ctx.font = '700 12px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = trend.color;
      ctx.textAlign = 'right';
      ctx.fillText(trend.text, pillX - 16, 45);
      ctx.fillStyle = MUTED;
      ctx.font = '500 10px "Segoe UI", -apple-system, sans-serif';
      ctx.fillText('DÉCISION', pillX - 16, 62);
      ctx.textAlign = 'left';

      const ticks = 7;
      ctx.strokeStyle = 'rgba(148,163,184,0.075)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= ticks; i++) {
        const y = CHART_Y + (CHART_H * i) / ticks;
        ctx.beginPath();
        ctx.moveTo(CHART_X, y);
        ctx.lineTo(CHART_X + CHART_W, y);
        ctx.stroke();
      }

      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 92px "Segoe UI", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JYNTRA AI', CHART_X + CHART_W / 2, CHART_Y + CHART_H / 2);
      ctx.restore();
      ctx.textAlign = 'left';

      /* ---------------------------------------------------------------- */
      /* 5. Candles or original screenshot                                 */
      /* ---------------------------------------------------------------- */

      const candleCount = sortedCandles.length;
      const spacing = candleCount > 0 ? CHART_W / candleCount : CHART_W;
      const candleX = (i: number) => CHART_X + (i + 0.5) * spacing;
      let zoneXStart = CHART_X + CHART_W * 0.55;
      let zoneXEnd = CHART_X + CHART_W;

      if (hasCandles) {
        ctx.font = '500 12px "JetBrains Mono", Consolas, monospace';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 6; i++) {
          const idx = Math.min(candleCount - 1, Math.round(((candleCount - 1) * i) / 6));
          const x = candleX(idx);
          ctx.strokeStyle = 'rgba(148,163,184,0.05)';
          ctx.beginPath();
          ctx.moveTo(x, CHART_Y);
          ctx.lineTo(x, CHART_BOTTOM);
          ctx.stroke();

          const d = new Date(sortedCandles[idx].timestamp);
          const intraday = !['D1', '1D', '1d'].includes(timeframe);
          const label = intraday
            ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}h`
            : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          ctx.fillStyle = '#6b7d93';
          ctx.fillText(label, Math.max(CHART_X + 32, Math.min(CHART_X + CHART_W - 32, x)), CHART_BOTTOM + 21);
        }
        ctx.textAlign = 'left';

        const bodyW = Math.max(2.5, Math.min(spacing * 0.62, 16));
        sortedCandles.forEach((c, i) => {
          const x = candleX(i);
          const bullish = c.close >= c.open;
          const color = bullish ? '#2ebd85' : '#f6465d';

          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, Math.min(1.7, bodyW * 0.18));
          ctx.beginPath();
          ctx.moveTo(x, priceToY(c.high));
          ctx.lineTo(x, priceToY(c.low));
          ctx.stroke();

          const bodyTop = priceToY(Math.max(c.open, c.close));
          const bodyBottom = priceToY(Math.min(c.open, c.close));
          const bodyH = Math.max(1.4, bodyBottom - bodyTop);
          ctx.fillStyle = color;
          ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
          if (bodyH > 3) {
            ctx.strokeStyle = 'rgba(0,0,0,0.28)';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
          }
        });

        const last = sortedCandles[candleCount - 1];
        const lastY = priceToY(last.close);
        ctx.strokeStyle = 'rgba(226,232,240,0.30)';
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CHART_X, lastY);
        ctx.lineTo(CHART_X + CHART_W, lastY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(148,163,184,0.10)';
        ctx.beginPath();
        ctx.moveTo(CHART_X + CHART_W + 0.5, CHART_Y);
        ctx.lineTo(CHART_X + CHART_W + 0.5, CHART_BOTTOM);
        ctx.stroke();
      } else if (useImage) {
        const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = imageBase64!;
        });
        if (cancelled) return;

        if (loaded) {
          const scale = Math.min(CHART_W / loaded.width, CHART_H / loaded.height);
          const dw = loaded.width * scale;
          const dh = loaded.height * scale;
          const dx = CHART_X + (CHART_W - dw) / 2;
          const dy = CHART_Y + (CHART_H - dh) / 2;
          imageRect = { dx, dy, dw, dh };
          ctx.drawImage(loaded, dx, dy, dw, dh);

          if (geometry) {
            const { priceTop, priceBottom, yTopPct, yBottomPct } = geometry.axis;
            const yAt = (p: number) => {
              const frac = yTopPct + ((priceTop - p) / (priceTop - priceBottom)) * (yBottomPct - yTopPct);
              return dy + frac * dh;
            };
            priceToY = yAt;
            zoneXStart = dx + geometry.plot.leftPct * dw;
            zoneXEnd = dx + geometry.plot.rightPct * dw;
          } else {
            // No calibration: never guess where a level sits on the image.
            zoneXStart = dx;
            zoneXEnd = dx + dw;
          }

          // Thin frame around the original screenshot.
          ctx.strokeStyle = 'rgba(56,189,248,0.28)';
          ctx.lineWidth = 1;
          ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);

          ctx.fillStyle = 'rgba(6,10,16,0.72)';
          ctx.beginPath();
          ctx.roundRect(dx + 12, dy + 12, geometry ? 505 : 620, 30, 6);
          ctx.fill();
          ctx.fillStyle = geometry ? '#7dd3fc' : '#fbbf24';
          ctx.font = '600 12px "Segoe UI", -apple-system, sans-serif';
          ctx.fillText(
            geometry
              ? 'Graphique original · niveaux projetés sur l’échelle de prix lue'
              : 'Graphique original · échelle non calibrée : niveaux listés à droite',
            dx + 22,
            dy + 32,
          );
        }
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 16px "Segoe UI", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée de prix disponible pour cet instrument.', CHART_X + CHART_W / 2, CHART_Y + CHART_H / 2);
        ctx.font = '500 12px "Segoe UI", -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Les niveaux ci-dessous proviennent uniquement de l’analyse.', CHART_X + CHART_W / 2, CHART_Y + CHART_H / 2 + 24);
        ctx.textAlign = 'left';
      }

      const canProjectOnImage = !useImage || !!geometry;

      /* ---------------------------------------------------------------- */
      /* 6. Zones                                                          */
      /* ---------------------------------------------------------------- */

      if (hasCandles || (useImage && geometry)) {
        zoneRects.forEach((z) => {
          const yTop = priceToY(z.top);
          const yBottom = priceToY(z.bottom);
          const h = Math.max(7, yBottom - yTop);
          if (yTop > CHART_BOTTOM + 4 || yBottom < CHART_Y - 4) return;
          const base = z.tone === 'bull' ? '34,197,94' : z.tone === 'bear' ? '244,63,94' : '96,165,250';
          ctx.fillStyle = `rgba(${base},0.16)`;
          ctx.fillRect(zoneXStart, yTop, zoneXEnd - zoneXStart, h);
          ctx.strokeStyle = `rgba(${base},0.72)`;
          ctx.lineWidth = 1.3;
          ctx.strokeRect(zoneXStart + 0.5, yTop + 0.5, zoneXEnd - zoneXStart - 1, h - 1);
        });

        zoneRects.forEach((z) => {
          const yTop = priceToY(z.top);
          const yBottom = priceToY(z.bottom);
          const h = Math.max(7, yBottom - yTop);
          const color = z.tone === 'bull' ? '#4ade80' : z.tone === 'bear' ? '#fb7185' : '#93c5fd';
          const x = zoneXStart + 10;
          if (x > zoneXEnd - 40) return;

          ctx.textAlign = 'left';
          ctx.font = '800 14px "Segoe UI", -apple-system, sans-serif';
          const name = z.label.length > 36 ? z.label.slice(0, 34) + '…' : z.label;
          const labelY = h >= 40 ? yTop + 20 : yTop - 8;
          const tw = ctx.measureText(name).width;
          const plateW = Math.min(tw + 12, zoneXEnd - x + 4);
          ctx.fillStyle = 'rgba(6,10,16,0.78)';
          ctx.beginPath();
          ctx.roundRect(x - 5, labelY - 15, plateW, 22, 4);
          ctx.fill();
          ctx.fillStyle = color;
          ctx.fillText(name, x, labelY);

          if (h >= 42) {
            ctx.font = '600 11.5px "JetBrains Mono", Consolas, monospace';
            ctx.fillStyle = 'rgba(226,232,240,0.82)';
            ctx.fillText(`${fmt(z.bottom)} — ${fmt(z.top)}`, x, yTop + 37);
          }
          ctx.textAlign = 'left';
        });
      }

      /* ---------------------------------------------------------------- */
      /* 7. Levels and right-axis chips                                    */
      /* ---------------------------------------------------------------- */

      const drawLine = (tag: PriceTag, dashed: number[], width: number) => {
        tag.y = priceToY(tag.price);
        if (tag.y < CHART_Y - 2 || tag.y > CHART_BOTTOM + 2) return false;
        if (!canProjectOnImage) return false;
        const x1 = hasCandles ? CHART_X : zoneXStart;
        const x2 = hasCandles ? CHART_X + CHART_W : zoneXEnd;
        ctx.strokeStyle = tag.color;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = width;
        ctx.setLineDash(dashed);
        ctx.beginPath();
        ctx.moveTo(x1, tag.y);
        ctx.lineTo(x2, tag.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        return true;
      };

      const visiblePlan = planTags.filter((t) => drawLine(t, t.label === 'SL' ? [9, 5] : [], t.weight));
      const visibleSr = srTags.filter((t) => drawLine(t, [5, 5], t.weight));

      const lastPriceTag: PriceTag | null = hasCandles
        ? {
            y: priceToY(sortedCandles[sortedCandles.length - 1].close),
            price: sortedCandles[sortedCandles.length - 1].close,
            label: 'PRIX',
            color: '#cbd5e1',
            weight: 1,
          }
        : null;

      const entryTag = visiblePlan.find((t) => t.label === 'ENTRY');
      const slTag = visiblePlan.find((t) => t.label === 'SL');
      const x1 = hasCandles ? CHART_X : zoneXStart;
      const x2 = hasCandles ? CHART_X + CHART_W : zoneXEnd;
      if (entryTag && slTag) {
        const top = Math.min(entryTag.y, slTag.y);
        const height = Math.abs(entryTag.y - slTag.y);
        ctx.fillStyle = 'rgba(251,113,133,0.10)';
        ctx.fillRect(x1, top, x2 - x1, height);
        ctx.strokeStyle = 'rgba(251,113,133,0.22)';
        ctx.setLineDash([4, 6]);
        ctx.strokeRect(x1 + 0.5, top + 0.5, x2 - x1 - 1, height - 1);
        ctx.setLineDash([]);
      }
      const tpTags = visiblePlan.filter((t) => t.label.startsWith('TP'));
      if (entryTag && tpTags.length) {
        const furthest = tpTags.reduce((acc, t) => (Math.abs(t.y - entryTag.y) > Math.abs(acc.y - entryTag.y) ? t : acc), tpTags[0]);
        const top = Math.min(entryTag.y, furthest.y);
        const height = Math.abs(entryTag.y - furthest.y);
        ctx.fillStyle = 'rgba(52,211,153,0.07)';
        ctx.fillRect(x1, top, x2 - x1, height);
        ctx.strokeStyle = 'rgba(52,211,153,0.18)';
        ctx.setLineDash([4, 6]);
        ctx.strokeRect(x1 + 0.5, top + 0.5, x2 - x1 - 1, height - 1);
        ctx.setLineDash([]);
      }

      // Without a calibrated image axis, the levels are listed in the right
      // strip instead of being drawn at an invented vertical position.
      const legendSource = canProjectOnImage ? [] : [...planTags, ...srTags];
      const legendGap = legendSource.length > 1 ? Math.min(36, (CHART_H - 60) / (legendSource.length - 1)) : 36;
      const legendTags: PriceTag[] = legendSource.map((t, i) => ({
        ...t,
        y: CHART_Y + 34 + i * legendGap,
      }));

      const tags: PriceTag[] = [
        ...(lastPriceTag ? [lastPriceTag] : []),
        ...visiblePlan,
        ...visibleSr,
        ...legendTags,
      ].filter((t) => Number.isFinite(t.y) && t.y >= CHART_Y - 1 && t.y <= CHART_BOTTOM + 1);

      tags.sort((a, b) => a.y - b.y);

      const chipH = 27;
      const gap = 5;
      let cursor = CHART_Y - chipH;
      tags.forEach((t) => {
        t.y = Math.max(t.y, cursor + gap + chipH / 2);
        cursor = t.y;
      });
      const overflow = cursor + chipH / 2 - CHART_BOTTOM;
      if (overflow > 0) {
        for (let i = tags.length - 1; i >= 0; i--) {
          const maxY = CHART_BOTTOM - chipH / 2 - (tags.length - 1 - i) * (chipH + gap);
          tags[i].y = Math.min(tags[i].y - overflow, maxY);
        }
      }
      const firstMin = CHART_Y + chipH / 2;
      if (tags.length && tags[0].y < firstMin) {
        const shift = firstMin - tags[0].y;
        tags.forEach((t, i) => {
          t.y = Math.min(t.y + shift, CHART_BOTTOM - chipH / 2 - (tags.length - 1 - i) * (chipH + gap));
        });
      }

      ctx.fillStyle = 'rgba(8,13,20,0.9)';
      ctx.fillRect(CHART_X + CHART_W + 1, CHART_Y, AXIS_W - 1, CHART_H);
      ctx.strokeStyle = BORDER;
      ctx.beginPath();
      ctx.moveTo(CHART_X + CHART_W + 0.5, CHART_Y);
      ctx.lineTo(CHART_X + CHART_W + 0.5, CHART_BOTTOM);
      ctx.stroke();

      const chipRanges = tags.map((t) => [t.y - chipH / 2 - 2, t.y + chipH / 2 + 2] as const);
      const hiddenByChip = (y: number) => chipRanges.some(([a, b]) => y > a && y < b);

      ctx.font = '500 12px "JetBrains Mono", Consolas, monospace';
      ctx.textAlign = 'right';
      const calibratedAxis = useImage && geometry && imageRect ? geometry : null;
      for (let i = 0; i <= ticks; i++) {
        // On an uploaded screenshot the price axis must follow the calibration
        // read from that screenshot, otherwise the right strip would display a
        // scale that contradicts the image's own labels.
        const p = calibratedAxis
          ? calibratedAxis.axis.priceTop - ((calibratedAxis.axis.priceTop - calibratedAxis.axis.priceBottom) * i) / ticks
          : maxPrice - (range * i) / ticks;
        const y = calibratedAxis
          ? calibratedAxis.axis.yTopPct * imageRect!.dh +
            imageRect!.dy +
            ((calibratedAxis.axis.yBottomPct - calibratedAxis.axis.yTopPct) * imageRect!.dh * i) / ticks
          : CHART_Y + (CHART_H * i) / ticks;
        if (!hiddenByChip(y)) {
          ctx.fillStyle = '#93a4bb';
          ctx.fillText(fmt(p), W - 10, y + 4.5);
        }
        ctx.strokeStyle = 'rgba(148,163,184,0.35)';
        ctx.beginPath();
        ctx.moveTo(CHART_X + CHART_W + 2, y);
        ctx.lineTo(CHART_X + CHART_W + 8, y);
        ctx.stroke();
      }
      ctx.textAlign = 'left';

      tags.forEach((tag) => {
        const trueY = canProjectOnImage ? priceToY(tag.price) : tag.y;
        const text = `${tag.label} ${fmt(tag.price)}`;
        let fontSize = 13;
        ctx.font = `800 ${fontSize}px "JetBrains Mono", Consolas, monospace`;
        while (ctx.measureText(text).width > 128 && fontSize > 10) {
          fontSize -= 0.5;
          ctx.font = `800 ${fontSize}px "JetBrains Mono", Consolas, monospace`;
        }
        const tw = ctx.measureText(text).width;
        const chipW = Math.min(146, tw + 18);
        const chipX = CHART_X + CHART_W + 4;
        const chipTop = tag.y - chipH / 2;

        if (canProjectOnImage && Math.abs(tag.y - trueY) > 1) {
          ctx.strokeStyle = tag.color;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(CHART_X + CHART_W, trueY);
          ctx.lineTo(chipX, tag.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = tag.color;
        ctx.beginPath();
        ctx.roundRect(chipX, chipTop, chipW, chipH, 4);
        ctx.fill();

        ctx.fillStyle = '#05101c';
        ctx.textAlign = 'left';
        ctx.fillText(text, chipX + 8, tag.y + fontSize * 0.34);
      });
      ctx.textAlign = 'left';

      /* ---------------------------------------------------------------- */
      /* 8. Bottom summary panel                                           */
      /* ---------------------------------------------------------------- */

      const summarize = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text);

      const cells = [
        { label: 'TENDANCE', value: trend.text.replace('BIAIS ', ''), color: trend.color },
        {
          label: 'STRUCTURE',
          value: `BOS ${vo.breakOfStructure ? 'OUI' : 'NON'} · CHoCH ${vo.changeOfCharacter ? 'OUI' : 'NON'}`,
          color: vo.breakOfStructure || vo.changeOfCharacter ? '#93c5fd' : MUTED,
        },
        { label: 'RISK / REWARD', value: plan.riskRewardRatio ? `1 : ${plan.riskRewardRatio}` : '—', color: '#38bdf8' },
        {
          label: 'CONFIANCE',
          value:
            typeof analysis.confidence === 'number'
              ? `${analysis.confidence}%${analysis.setupQuality && analysis.setupQuality !== 'NONE' ? ' · ' + analysis.setupQuality : ''}`
              : analysis.setupQuality && analysis.setupQuality !== 'NONE'
              ? `Qualité ${analysis.setupQuality}`
              : '—',
          color: '#e6edf7',
        },
      ];

      ctx.fillStyle = PANEL;
      ctx.beginPath();
      ctx.roundRect(PAD_L, PANEL_Y, W - PAD_L * 2, 64, 10);
      ctx.fill();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.stroke();

      const cellW = (W - PAD_L * 2) / cells.length;
      cells.forEach((cell, i) => {
        const x = PAD_L + i * cellW + 20;
        if (i > 0) {
          ctx.strokeStyle = 'rgba(148,163,184,0.14)';
          ctx.beginPath();
          ctx.moveTo(PAD_L + i * cellW, PANEL_Y + 14);
          ctx.lineTo(PAD_L + i * cellW, PANEL_Y + 50);
          ctx.stroke();
        }
        ctx.fillStyle = '#6b7d93';
        ctx.font = '700 10px "JetBrains Mono", Consolas, monospace';
        (ctx as any).letterSpacing = '1px';
        ctx.fillText(cell.label, x, PANEL_Y + 25);
        (ctx as any).letterSpacing = '0px';
        ctx.fillStyle = cell.color;
        ctx.font = '800 15px "Segoe UI", -apple-system, sans-serif';
        ctx.fillText(summarize(cell.value, 30), x, PANEL_Y + 46);
      });

      const confirmations: string[] = Array.isArray(plan.confirmations) ? plan.confirmations : [];
      let footerNote = '';
      if (confirmations.length) footerNote = `Confirmations : ${confirmations.slice(0, 2).join(' · ')}`;
      else if (plan.invalidationCondition) footerNote = `Invalidation : ${plan.invalidationCondition}`;

      if (footerNote) {
        ctx.fillStyle = '#7c8ea6';
        ctx.font = '500 11.5px "Segoe UI", -apple-system, sans-serif';
        ctx.fillText(summarize(footerNote, 150), PAD_L, 982);
      }

      ctx.fillStyle = '#4a5a6e';
      ctx.font = '600 10px "JetBrains Mono", Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`JYNTRA AI · ${new Date().toLocaleString('fr-FR')} · niveaux issus de l’analyse`, W - PAD_L, 982);
      ctx.textAlign = 'left';

      const dataUrl = canvas.toDataURL('image/png');
      if (!cancelled) {
        setUrl(dataUrl);
        if (onReady) onReady(dataUrl);
      }
    };

    draw();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, symbol, timeframe, imageBase64, candles]);

  if (!analysis) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-slate-700/80 bg-[#080d14] shadow-2xl">
        <canvas ref={ref} className="w-full h-auto" style={{ aspectRatio: `${W}/${H}`, maxHeight: '640px' }} />
      </div>
      {url && (
        <a
          href={url}
          download={`jyntra-analyse-${symbol.replace(/[^\w-]/g, '')}-${timeframe}.png`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          Télécharger le graphique annoté
        </a>
      )}
    </div>
  );
};
