import React, { useState } from 'react';
import { UserSession, LocalStore, STORAGE_KEYS, JournalEntry } from '../services/storage';
import { calculateRisk, RiskAnalysisResult, RiskWarningCode } from '../utils/riskCalculator';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
  DollarSign
} from 'lucide-react';

export const RiskManagementPage: React.FC<{ session: UserSession; onNavigate: (route: string) => void }> = ({
  session,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(65000);
  const [stopLoss, setStopLoss] = useState<number>(63800);
  const [takeProfit, setTakeProfit] = useState<number>(68500);
  const [isLong, setIsLong] = useState<boolean>(true);
  const [symbol, setSymbol] = useState<string>('BTC/USDT');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Compute live calculations
  const riskResult: RiskAnalysisResult = calculateRisk({
    accountBalance: balance,
    riskPercentage: riskPercent,
    entryPrice,
    stopLossPrice: stopLoss,
    takeProfitPrice: takeProfit,
    isLong,
  });

  const riskWarningLabels: Record<RiskWarningCode, string> = {
    CAPITAL_POSITIVE: t.risk.warnCapital,
    PRICES_POSITIVE: t.risk.warnPrices,
    LONG_SL: t.risk.warnLongSL,
    LONG_TP: t.risk.warnLongTP,
    SHORT_SL: t.risk.warnShortSL,
    SHORT_TP: t.risk.warnShortTP,
    HIGH_RISK: t.risk.warnHighRisk,
    LOW_RR: t.risk.warnLowRR,
  };

  const handleSaveToJournal = () => {
    if (!riskResult.isValid) return;

    const allJournal = LocalStore.get<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
    const entry: JournalEntry = {
      id: 'risk_' + Date.now().toString(36),
      userId: session.userId,
      symbol,
      direction: isLong ? 'BUY' : 'SELL',
      timeframe: t.risk.sourceLabel,
      entryPrice,
      stopLoss,
      takeProfit,
      size: riskResult.positionSize,
      status: 'OPEN',
      notes: t.risk.journalNote
        .replace('{amount}', `$${riskResult.riskAmount}`)
        .replace('{percent}', String(riskPercent))
        .replace('{rr}', String(riskResult.riskRewardRatio)),
      tags: ['Risk-Calculator', isLong ? 'LONG' : 'SHORT'],
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };

    allJournal.push(entry);
    LocalStore.set(STORAGE_KEYS.JOURNAL, allJournal);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            {t.risk.badge}
          </div>
          <h1 className="text-3xl font-black text-white mt-1">{t.risk.title}</h1>
          <p className="text-sm text-slate-400">
            {t.risk.subtitle}
          </p>
        </div>

        {riskResult.isValid && (
          <button
            onClick={handleSaveToJournal}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{t.chart.savedToJournal}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t.chart.saveToJournal}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            {t.risk.parametersTitle}
          </h2>

          {/* Direction toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                setIsLong(true);
                // Adjust SL/TP defaults
                setStopLoss(entryPrice * 0.98);
                setTakeProfit(entryPrice * 1.05);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isLong ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t.extra.longLabel}</span>
            </button>

            <button
              onClick={() => {
                setIsLong(false);
                setStopLoss(entryPrice * 1.02);
                setTakeProfit(entryPrice * 0.95);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                !isLong ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>{t.extra.shortLabel}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.assetLabel}</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-orange-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Account Balance */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t.risk.capitalLabel}
            </label>
            <input
              type="number"
              min="1"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Risk Percentage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-400">
                {t.risk.riskPercentLabel}
              </label>
              <span className="text-xs font-mono font-bold text-orange-400">{riskPercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRiskPercent(val)}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    riskPercent === val
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Entry, Stop Loss, Take Profit */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.risk.entryPriceLabel}</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-rose-400 mb-1">
                {t.risk.stopLossPriceLabel}
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-rose-500/30 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-400 mb-1">
                {t.risk.takeProfitPriceLabel}
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Right Output Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metric Highlights Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-500 font-mono uppercase">{t.risk.riskRewardResult}</span>
                <div className="text-4xl font-black mt-1 font-mono">
                  <span
                    className={
                      riskResult.riskRewardRatio >= 2.0
                        ? 'text-emerald-400'
                        : riskResult.riskRewardRatio >= 1.5
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                  >
                    1 : {riskResult.riskRewardRatio}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80">
                {riskResult.riskRewardRatio >= 1.5 && riskResult.isValid ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-rose-400" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">{t.extra.riskMoney}</span>
                <strong className="text-rose-400 text-lg">${riskResult.riskAmount}</strong>
                <span className="text-slate-500 block text-[10px] mt-0.5">({riskPercent}% {t.risk.ofCapital})</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">{t.extra.expectedGain}</span>
                <strong className="text-emerald-400 text-lg">${riskResult.rewardAmount}</strong>
                <span className="text-slate-500 block text-[10px] mt-0.5">
                  (+{((riskResult.rewardAmount / balance) * 100).toFixed(1)}% {t.risk.ofAccount})
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">{t.risk.positionSizeResult}</span>
                <strong className="text-cyan-400 text-lg">{riskResult.positionSize}</strong>
                <span className="text-slate-500 block text-[10px] mt-0.5">{t.risk.assetUnits}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">{t.extra.tradeValue}</span>
                <strong className="text-slate-200 text-base">${riskResult.positionValue}</strong>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">{t.extra.distSL}</span>
                <strong className="text-rose-300 text-base">-{riskResult.stopLossPercent}%</strong>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">{t.extra.distTP}</span>
                <strong className="text-emerald-300 text-base">+{riskResult.takeProfitPercent}%</strong>
              </div>
            </div>

            {/* Warnings or Validations */}
            {riskResult.warningCodes.length > 0 && (
              <div className="space-y-2 pt-2">
                {riskResult.warningCodes.map((code) => (
                  <div
                    key={code}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{riskWarningLabels[code]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Educational Formula Explanation */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
            <h3 className="font-bold text-slate-300 text-xs uppercase font-mono">
              {t.risk.formulaTitle} :
            </h3>
            <p className="font-mono text-cyan-400 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              {t.risk.formulaBody}
            </p>
            <p className="leading-relaxed">
              {t.risk.formulaNote.replace('{amount}', `$${riskResult.riskAmount}`)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
