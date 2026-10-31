/** Shared prerequisite state: the latest successful chart analysis. */
const KEY = 'jyntra_last_analysis';
export interface LastAnalysis { symbol: string; timeframe: string; recommendation?: string; trend?: string; at: number }
export function saveLastAnalysis(a: LastAnalysis): void { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* storage unavailable */ } }
export function getLastAnalysis(): LastAnalysis | null {
  try { const raw = localStorage.getItem(KEY); if (!raw) return null; const p = JSON.parse(raw); return p && p.symbol ? p : null; } catch { return null; }
}
export const MISSING_ANALYSIS_MSG = "Veuillez d'abord effectuer l'analyse du graphique avant d'utiliser cette fonctionnalité.";
/** Pure validator shared by the UI and the server: a prior analysis must
 *  exist, name an instrument and be fresh (< 24 h). No storage access here,
 *  so the server can enforce the same rule on direct API calls. */
export function isValidPriorAnalysis(a: unknown, now = Date.now()): a is LastAnalysis {
  if (!a || typeof a !== 'object') return false;
  const p = a as LastAnalysis;
  return typeof p.symbol === 'string' && p.symbol.trim().length > 0
    && typeof p.at === 'number' && Number.isFinite(p.at)
    && now - p.at >= 0 && now - p.at < 24 * 3600 * 1000;
}
