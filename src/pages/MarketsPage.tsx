import React, { useState, useEffect } from 'react';
import { FinancialChartCanvas } from '../components/chart/FinancialChartCanvas';
import { useLanguage } from '../i18n/LanguageContext';
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Activity,
  ArrowRight,
  ShieldCheck,
  Coins,
  Globe2,
  Gem,
  BarChart3
} from 'lucide-react';

export const MarketsPage: React.FC<{ onNavigateToChart: (symbol: string) => void }> = ({
  onNavigateToChart,
}) => {
  const { t, currentLang } = useLanguage();
  const [tickers, setTickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES'>('ALL');
  const [remoteResults, setRemoteResults] = useState<any[]>([]);

  useEffect(() => {
    if (search.trim().length < 2) { setRemoteResults([]); return; }
    const id = setTimeout(() => {
      fetch(`/api/market/search?q=${encodeURIComponent(search.trim())}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setRemoteResults(d.results || []); })
        .catch(() => setRemoteResults([]));
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  const fetchTickers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market/ticker');
      const data = await res.json();
      if (data.success && data.tickers) {
        setTickers(data.tickers);
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickers();
    const interval = setInterval(fetchTickers, 25000);
    return () => clearInterval(interval);
  }, []);

  const filtered = tickers.filter((item) => {
    const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
    const term = search.toLowerCase();
    const matchesSearch =
      item.symbol.toLowerCase().includes(term) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.rawSymbol && item.rawSymbol.toLowerCase().includes(term));
    return matchesCat && matchesSearch;
  });

  const tabLabels = {
    ALL: currentLang === 'mg' ? 'Izy rehetra' : currentLang === 'en' ? 'All Assets' : 'Toutes les classes',
    CRYPTO: currentLang === 'mg' ? 'Crypto-vola' : currentLang === 'en' ? 'Crypto Assets' : 'Crypto-Actifs',
    FOREX: currentLang === 'mg' ? 'Vola vahiny (Forex)' : currentLang === 'en' ? 'Forex Currencies' : 'Forex & Devises',
    COMMODITIES: currentLang === 'mg' ? 'Volamena & Harena' : currentLang === 'en' ? 'Gold & Commodities' : 'Or & Matières',
    INDICES: currentLang === 'mg' ? 'Tondro Bourse' : currentLang === 'en' ? 'Stock Indices' : 'Indices Boursiers',
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            <span>{t.markets.badge}</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">{t.markets.title}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {t.markets.subtitle}
          </p>
        </div>

        <button
          onClick={fetchTickers}
          disabled={loading}
          className="p-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold hover:border-slate-700 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          <span>{t.markets.refreshBtn}</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'ALL'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{tabLabels.ALL}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {tickers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('CRYPTO')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'CRYPTO'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>{tabLabels.CRYPTO}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {tickers.filter((x) => x.category === 'CRYPTO').length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('FOREX')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'FOREX'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>{tabLabels.FOREX}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {tickers.filter((x) => x.category === 'FOREX').length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('COMMODITIES')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'COMMODITIES'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Gem className="w-3.5 h-3.5" />
          <span>{tabLabels.COMMODITIES}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {tickers.filter((x) => x.category === 'COMMODITIES').length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('INDICES')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'INDICES'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{tabLabels.INDICES}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {tickers.filter((x) => x.category === 'INDICES').length}
          </span>
        </button>
      </div>

      {/* Main Grid: Left Tickers Table, Right Interactive Candlestick Viewer */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tickers List (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.markets.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {remoteResults.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {remoteResults.slice(0, 12).map((r: any) => (
                <button key={r.rawSymbol + r.symbol} onClick={() => setSelectedSymbol(r.rawSymbol)} className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-orange-500/50 text-[11px] font-mono text-slate-300">
                  {r.symbol} <span className="text-slate-500">{r.category}</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {loading && tickers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                {currentLang === 'mg' ? 'Eo am-pakàna ny fitaovana…' : currentLang === 'en' ? 'Loading instruments…' : 'Chargement des instruments…'}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {currentLang === 'mg' ? 'Tsy misy fitaovana mifanaraka amin’ny fikarohanao.' : currentLang === 'en' ? 'No instrument matches your search.' : 'Aucun instrument ne correspond à votre recherche.'}
              </div>
            ) : (
              filtered.map((tItem) => {
                const targetKey = tItem.rawSymbol || tItem.symbol;
                const isSelected = selectedSymbol === targetKey || selectedSymbol === tItem.symbol;
                const isPositive = (tItem.changePercent ?? 0) >= 0;

                return (
                  <div
                    key={tItem.symbol}
                    onClick={() => setSelectedSymbol(tItem.rawSymbol || tItem.symbol)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-950 border-orange-500 shadow-md ring-1 ring-orange-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{tItem.symbol}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{tItem.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {tItem.category}
                        </span>
                        <span>
                          H: {tItem.high24h != null ? tItem.high24h?.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
                        </span>
                        <span>
                          L: {tItem.low24h != null ? tItem.low24h?.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="text-sm font-bold text-slate-100 font-mono">
                        {tItem.category === 'FOREX' && tItem.symbol.includes('MGA')
                          ? `${tItem.price?.toLocaleString()} Ar`
                          : `$${tItem.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                      </div>
                      <div
                        className={`text-xs font-bold font-mono inline-flex items-center gap-1 ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tItem.changePercent == null ? null : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {tItem.changePercent == null ? '—' : `${isPositive ? '+' : ''}${tItem.changePercent?.toFixed(2)}%`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chart View & Quick Analysis Launch (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <span>{selectedSymbol}</span>
                <span className="text-xs text-slate-400 font-normal">{t.markets.candlesLabel}</span>
              </h2>
            </div>

            <button
              onClick={() => onNavigateToChart(selectedSymbol)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              <span>{t.markets.analyzeWithJyntra}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <FinancialChartCanvas symbol={selectedSymbol} height={460} />

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              {t.markets.sourceVerified}
            </span>
            <span className="font-mono text-slate-500">{t.markets.zeroSynthetic}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
