/**
 * JYNTRA AI - Persistent data service (internal implementation detail;
 * never described in the public interface).
 */

export const STORAGE_KEYS = {
  USERS: 'jyntra_v1_users',
  SESSION: 'jyntra_v1_session',
  ANALYSES: 'jyntra_v1_analyses',
  JOURNAL: 'jyntra_v1_journal',
  WORKFLOWS: 'jyntra_v1_workflows',
  STRATEGIES: 'jyntra_v1_strategies',
  JYNTRACK: 'jyntra_v1_jyntrack',
  SETTINGS: 'jyntra_v1_settings',
  JARVIS_PREFS: 'jyntra_v1_jarvis_prefs',
  THEME: 'jyntra_v1_theme',
} as const;

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  lastLoginAt: number;
  role: 'trader' | 'analyst' | 'pro';
  avatar?: string;
  bio?: string;
  preferredAsset?: string;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  token: string;
  role: 'trader' | 'analyst' | 'pro';
  loginTimestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  timeframe: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  size: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  notes: string;
  tags: string[];
  date: string;
  timestamp: number;
  imageUrl?: string;
}

export interface ChartAnalysisRecord {
  id: string;
  userId: string;
  title: string;
  symbol: string;
  timeframe: string;
  timestamp: number;
  modelUsed: string;
  visualObservations: {
    instrumentDetected: string;
    timeframeDetected: string;
    trend: 'BULLISH' | 'BEARISH' | 'RANGING' | 'UNCERTAIN';
    supportResistance: string[];
    liquidityZones: string[];
    orderBlocks: string[];
    fairValueGaps: string[];
    breakOfStructure: boolean;
    changeOfCharacter: boolean;
  };
  aiInterpretation: string;
  hypotheses: string[];
  recommendation: 'BUY' | 'SELL' | 'NO_TRADE';
  tradePlan?: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    takeProfit2?: number;
    takeProfit3?: number;
    riskRewardRatio: number;
    invalidationCondition: string;
  };
  agentDebate?: Record<string, string>;
  imageSnippet?: string;
  annotatedImage?: string;
  workflowRunId?: string;
  provider?: string;
  aiModel?: string;
}

export interface WorkflowNodeData {
  id: string;
  type: 'import' | 'analyze' | 'market_data' | 'agents' | 'risk' | 'report';
  title: string;
  status: 'idle' | 'running' | 'success' | 'error';
  output?: any;
  error?: string;
}

export interface WorkflowRecord {
  id: string;
  userId: string;
  name: string;
  updatedAt: number;
  nodes: WorkflowNodeData[];
}

export class LocalStore {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`[LocalStore] Failed to read ${key}:`, e);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[LocalStore] Failed to write ${key}:`, e);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[LocalStore] Failed to remove ${key}:`, e);
    }
  }

  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error('[LocalStore] Clear error:', e);
    }
  }
}
