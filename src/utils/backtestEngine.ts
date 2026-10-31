export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestStrategyConfig {
  name: string;
  type: 'ema_cross' | 'rsi_reversal' | 'breakout';
  fastPeriod?: number; // e.g. 9
  slowPeriod?: number; // e.g. 21
  rsiPeriod?: number; // e.g. 14
  rsiOverbought?: number; // e.g. 70
  rsiOversold?: number; // e.g. 30
  stopLossPercent?: number; // e.g. 1.5%
  takeProfitPercent?: number; // e.g. 3.0%
}

export interface SimulatedTrade {
  id: string;
  entryIndex: number;
  entryTimestamp: number;
  exitIndex: number;
  exitTimestamp: number;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT';
}

export interface BacktestResult {
  strategyName: string;
  initialBalance: number;
  finalBalance: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // in %
  profitFactor: number;
  maxDrawdownPercent: number;
  expectancy: number;
  equityCurve: { timestamp: number; balance: number }[];
  trades: SimulatedTrade[];
}

// Technical indicator helpers for backtester
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

function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }
  return rsi;
}

/**
 * Pure backtest simulation on candlestick data with strict execution logic and no forward-looking bias.
 */
export function runBacktest(
  candles: Candle[],
  strategy: BacktestStrategyConfig,
  initialBalance: number = 10000,
  riskPerTradePercent: number = 2
): BacktestResult {
  if (!candles || candles.length < 30) {
    return {
      strategyName: strategy.name,
      initialBalance,
      finalBalance: initialBalance,
      totalReturnPercent: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      profitFactor: 0,
      maxDrawdownPercent: 0,
      expectancy: 0,
      equityCurve: [{ timestamp: Date.now(), balance: initialBalance }],
      trades: [],
    };
  }

  const closes = candles.map(c => c.close);
  const fastEMA = calculateEMA(closes, strategy.fastPeriod || 9);
  const slowEMA = calculateEMA(closes, strategy.slowPeriod || 21);
  const rsi = calculateRSI(closes, strategy.rsiPeriod || 14);

  let balance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdownPercent = 0;

  const trades: SimulatedTrade[] = [];
  const equityCurve: { timestamp: number; balance: number }[] = [
    { timestamp: candles[0].timestamp, balance: initialBalance },
  ];

  let currentPosition: {
    type: 'BUY';
    entryIndex: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    size: number;
  } | null = null;

  const startIndex = Math.max((strategy.slowPeriod || 21) + 1, (strategy.rsiPeriod || 14) + 1);

  for (let i = startIndex; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];

    // Check open position SL/TP against high/low of current candle
    if (currentPosition) {
      let exitPrice: number | null = null;
      let reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | null = null;

      if (candle.low <= currentPosition.stopLoss) {
        exitPrice = currentPosition.stopLoss;
        reason = 'STOP_LOSS';
      } else if (candle.high >= currentPosition.takeProfit) {
        exitPrice = currentPosition.takeProfit;
        reason = 'TAKE_PROFIT';
      } else if (strategy.type === 'ema_cross' && fastEMA[i] < slowEMA[i] && fastEMA[i - 1] >= slowEMA[i - 1]) {
        exitPrice = candle.close;
        reason = 'SIGNAL_EXIT';
      }

      if (exitPrice !== null && reason !== null) {
        const pnl = currentPosition.size * (exitPrice - currentPosition.entryPrice);
        const pnlPercent = ((exitPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;
        balance += pnl;

        trades.push({
          id: `trade-${trades.length + 1}`,
          entryIndex: currentPosition.entryIndex,
          entryTimestamp: candles[currentPosition.entryIndex].timestamp,
          exitIndex: i,
          exitTimestamp: candle.timestamp,
          type: 'BUY',
          entryPrice: currentPosition.entryPrice,
          exitPrice,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
          reason,
        });

        currentPosition = null;

        // Track peak and drawdown
        if (balance > peakBalance) peakBalance = balance;
        const currentDD = ((peakBalance - balance) / peakBalance) * 100;
        if (currentDD > maxDrawdownPercent) maxDrawdownPercent = currentDD;

        equityCurve.push({ timestamp: candle.timestamp, balance: Number(balance.toFixed(2)) });
      }
    }

    // Check entry signal if flat
    if (!currentPosition && i < candles.length - 1) {
      let entrySignal = false;

      if (strategy.type === 'ema_cross') {
        // Bullish crossover on closed bar
        if (fastEMA[i] > slowEMA[i] && fastEMA[i - 1] <= slowEMA[i - 1]) {
          entrySignal = true;
        }
      } else if (strategy.type === 'rsi_reversal') {
        if (rsi[i - 1] < (strategy.rsiOversold || 30) && rsi[i] >= (strategy.rsiOversold || 30)) {
          entrySignal = true;
        }
      } else if (strategy.type === 'breakout') {
        // Break above 10-period high
        const high10 = Math.max(...candles.slice(Math.max(0, i - 10), i).map(c => c.high));
        if (candle.close > high10) {
          entrySignal = true;
        }
      }

      if (entrySignal) {
        const entryPrice = candle.close;
        const slPercent = (strategy.stopLossPercent || 1.5) / 100;
        const tpPercent = (strategy.takeProfitPercent || 3.0) / 100;

        const stopLoss = entryPrice * (1 - slPercent);
        const takeProfit = entryPrice * (1 + tpPercent);

        const riskCapital = (balance * riskPerTradePercent) / 100;
        const riskPerUnit = entryPrice - stopLoss;
        const size = riskPerUnit > 0 ? riskCapital / riskPerUnit : 0;

        currentPosition = {
          type: 'BUY',
          entryIndex: i,
          entryPrice,
          stopLoss,
          takeProfit,
          size,
        };
      }
    }
  }

  // Final performance analytics
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const losingTrades = trades.filter(t => t.pnl <= 0).length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const grossProfit = trades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

  const totalReturnPercent = Number((((balance - initialBalance) / initialBalance) * 100).toFixed(2));
  const expectancy = totalTrades > 0 ? Number(((balance - initialBalance) / totalTrades).toFixed(2)) : 0;

  return {
    strategyName: strategy.name,
    initialBalance,
    finalBalance: Number(balance.toFixed(2)),
    totalReturnPercent,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    expectancy,
    equityCurve,
    trades,
  };
}
