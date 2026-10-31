import React, { useState, useEffect } from 'react';
import { UserSession, LocalStore, STORAGE_KEYS, JournalEntry, ChartAnalysisRecord } from '../services/storage';
import { useLanguage } from '../i18n/LanguageContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  X,
  Save,
  Tag
} from 'lucide-react';

export const TradingJournalPage: React.FC<{ session: UserSession }> = ({ session }) => {
  const { t, currentLang } = useLanguage();
  const [analyses, setAnalyses] = useState<ChartAnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ChartAnalysisRecord | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formSymbol, setFormSymbol] = useState('BTC/USDT');
  const [formDirection, setFormDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [formTimeframe, setFormTimeframe] = useState('1H');
  const [formEntryPrice, setFormEntryPrice] = useState<number>(65000);
  const [formExitPrice, setFormExitPrice] = useState<number | undefined>(undefined);
  const [formStopLoss, setFormStopLoss] = useState<number>(64000);
  const [formTakeProfit, setFormTakeProfit] = useState<number>(68000);
  const [formSize, setFormSize] = useState<number>(0.1);
  const [formStatus, setFormStatus] = useState<'OPEN' | 'CLOSED' | 'CANCELLED'>('OPEN');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('SMC, Breakout');

  // Load persisted entries
  const loadJournal = () => {
    const list = LocalStore.get<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
    setEntries(list.filter((e) => e.userId === session.userId));
    const anl = LocalStore.get<ChartAnalysisRecord[]>(STORAGE_KEYS.ANALYSES, []);
    setAnalyses(anl.filter((a) => a.userId === session.userId).slice().reverse());
  };

  useEffect(() => {
    loadJournal();
  }, [session.userId]);

  // Persist changes
  const saveAll = (newList: JournalEntry[]) => {
    const all = LocalStore.get<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
    const otherUsers = all.filter((e) => e.userId !== session.userId);
    LocalStore.set(STORAGE_KEYS.JOURNAL, [...otherUsers, ...newList]);
    setEntries(newList);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormSymbol('BTC/USDT');
    setFormDirection('BUY');
    setFormTimeframe('1H');
    setFormEntryPrice(65000);
    setFormExitPrice(undefined);
    setFormStopLoss(64000);
    setFormTakeProfit(68000);
    setFormSize(0.1);
    setFormStatus('OPEN');
    setFormNotes('');
    setFormTags('SMC, Breakout');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setFormSymbol(entry.symbol);
    setFormDirection(entry.direction);
    setFormTimeframe(entry.timeframe);
    setFormEntryPrice(entry.entryPrice);
    setFormExitPrice(entry.exitPrice);
    setFormStopLoss(entry.stopLoss);
    setFormTakeProfit(entry.takeProfit);
    setFormSize(entry.size);
    setFormStatus(entry.status);
    setFormNotes(entry.notes);
    setFormTags(entry.tags.join(', '));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.journal.deleteConfirm)) {
      const updated = entries.filter((e) => e.id !== id);
      saveAll(updated);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    let computedPnl: number | undefined = undefined;
    if (formStatus === 'CLOSED' && formExitPrice !== undefined) {
      if (formDirection === 'BUY') {
        computedPnl = Number(((formExitPrice - formEntryPrice) * formSize).toFixed(2));
      } else {
        computedPnl = Number(((formEntryPrice - formExitPrice) * formSize).toFixed(2));
      }
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      // Update
      const updated = entries.map((entry) => {
        if (entry.id === editingId) {
          return {
            ...entry,
            symbol: formSymbol,
            direction: formDirection,
            timeframe: formTimeframe,
            entryPrice: formEntryPrice,
            exitPrice: formExitPrice,
            stopLoss: formStopLoss,
            takeProfit: formTakeProfit,
            size: formSize,
            status: formStatus,
            pnl: computedPnl,
            notes: formNotes,
            tags: tagsArray,
          };
        }
        return entry;
      });
      saveAll(updated);
    } else {
      // Create new
      const newEntry: JournalEntry = {
        id: 'jrn_' + Date.now().toString(36),
        userId: session.userId,
        symbol: formSymbol,
        direction: formDirection,
        timeframe: formTimeframe,
        entryPrice: formEntryPrice,
        exitPrice: formExitPrice,
        stopLoss: formStopLoss,
        takeProfit: formTakeProfit,
        size: formSize,
        status: formStatus,
        pnl: computedPnl,
        notes: formNotes,
        tags: tagsArray,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
      };
      saveAll([newEntry, ...entries]);
    }

    setIsModalOpen(false);
  };

  // Filtered entries
  const filtered = entries.filter((e) => {
    const matchesSearch =
      e.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const closedTrades = entries.filter((e) => e.status === 'CLOSED');
  const winningTrades = closedTrades.filter((e) => (e.pnl || 0) > 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';
  const totalPnL = closedTrades.reduce((acc, curr) => acc + (curr.pnl || 0), 0);

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            {t.journal.badge}
          </div>
          <h1 className="text-3xl font-black text-white mt-1">{t.journal.title}</h1>
          <p className="text-sm text-slate-400">
            {t.journal.subtitle}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.journal.newTradeBtn}</span>
        </button>
      </div>

      {/* Analyses enregistrées depuis Analyse Graphique */}
      <div className="max-w-7xl mx-auto w-full rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-bold text-white">{t.journal.savedAnalyses}</h2>
        {analyses.length === 0 ? <p className="text-xs text-slate-400">{t.journal.noSavedAnalyses}</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analyses.map((a) => (
              <button key={a.id} onClick={() => setSelectedAnalysis(a)} className="text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-orange-500/50 space-y-1">
                <div className="text-xs font-bold text-white">{a.title}</div>
                <div className="text-[11px] text-slate-400">{new Date(a.timestamp).toLocaleString()} • {a.recommendation} • Tendance {a.visualObservations.trend}</div>
                {a.tradePlan && <div className="text-[11px] font-mono text-slate-300">Entrée {a.tradePlan.entry} • SL {a.tradePlan.stopLoss} • TP {a.tradePlan.takeProfit} • R:R {a.tradePlan.riskRewardRatio}</div>}
                {a.annotatedImage && <img src={a.annotatedImage} alt={a.title} className="w-full rounded-lg border border-slate-800 mt-2" />}
              </button>
            ))}
          </div>
        )}
        {selectedAnalysis && (
          <div className="p-4 rounded-xl bg-slate-950 border border-orange-500/30 space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between"><strong className="text-white text-sm">{selectedAnalysis.title}</strong><button onClick={() => setSelectedAnalysis(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button></div>
            <div>{new Date(selectedAnalysis.timestamp).toLocaleString()} • {selectedAnalysis.symbol} {selectedAnalysis.timeframe} • {selectedAnalysis.recommendation}{selectedAnalysis.provider ? ` • ${selectedAnalysis.provider}` : ''}{selectedAnalysis.workflowRunId ? ` • Workflow ${selectedAnalysis.workflowRunId}` : ''}</div>
            <p className="leading-relaxed">{selectedAnalysis.aiInterpretation}</p>
            <div>Structures : BOS {selectedAnalysis.visualObservations.breakOfStructure ? 'oui' : 'non'} • CHoCH {selectedAnalysis.visualObservations.changeOfCharacter ? 'oui' : 'non'} • OB {(selectedAnalysis.visualObservations.orderBlocks || []).join(' ; ') || '—'} • FVG {(selectedAnalysis.visualObservations.fairValueGaps || []).join(' ; ') || '—'} • Liquidité {(selectedAnalysis.visualObservations.liquidityZones || []).join(' ; ') || '—'}</div>
            {selectedAnalysis.tradePlan && <div className="font-mono">Entrée {selectedAnalysis.tradePlan.entry} • SL {selectedAnalysis.tradePlan.stopLoss} • TP1 {selectedAnalysis.tradePlan.takeProfit}{selectedAnalysis.tradePlan.takeProfit2 ? ` • TP2 ${selectedAnalysis.tradePlan.takeProfit2}` : ''}{selectedAnalysis.tradePlan.takeProfit3 ? ` • TP3 ${selectedAnalysis.tradePlan.takeProfit3}` : ''} • R:R {selectedAnalysis.tradePlan.riskRewardRatio}<br />Invalidation : {selectedAnalysis.tradePlan.invalidationCondition}</div>}
            {selectedAnalysis.annotatedImage && <img src={selectedAnalysis.annotatedImage} alt={selectedAnalysis.title} className="w-full rounded-lg border border-slate-800" />}
          </div>
        )}
      </div>

      {/* Aggregate Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">{t.extra.recordedPositions}</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{entries.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">{t.backtest.winRate}</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{winRate}%</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">{t.extra.closedPositionsLabel}</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{closedTrades.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">{t.extra.netRealisedPnl}</span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.extra.journalSearchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(['ALL', 'OPEN', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? t.common.all : st === 'OPEN' ? t.journal.openTradesTab : t.journal.closedTradesTab}
            </button>
          ))}
        </div>
      </div>

      {/* Trades Table List */}
      <div className="max-w-7xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">{t.extra.noTradeMatch}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 text-slate-500 uppercase text-[10px] bg-slate-950/60">
                <tr>
                  <th className="py-3 px-4">{t.common.date}</th>
                  <th className="py-3 px-4">{t.common.symbol}</th>
                  <th className="py-3 px-4">{t.extra.directionCol}</th>
                  <th className="py-3 px-4">{t.chart.entryLabel}</th>
                  <th className="py-3 px-4">SL / TP</th>
                  <th className="py-3 px-4">{t.common.status}</th>
                  <th className="py-3 px-4">P&amp;L</th>
                  <th className="py-3 px-4">{t.extra.notesPsychology}</th>
                  <th className="py-3 px-4 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{item.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{item.symbol}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{item.timeframe}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          item.direction === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">${item.entryPrice}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <span className="text-rose-400">SL: ${item.stopLoss}</span> /{' '}
                      <span className="text-emerald-400">TP: ${item.takeProfit}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'OPEN'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : item.status === 'CLOSED'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.pnl !== undefined ? (
                        <span
                          className={`font-bold ${
                            item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.pnl >= 0 ? '+' : ''}${item.pnl}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs font-sans text-xs">
                      <p className="truncate text-slate-300">{item.notes || t.journal.noNote}</p>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title={t.common.edit}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Trade */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingId ? t.journal.editTitle : t.journal.addTitle}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.assetLabel}</label>
                  <input
                    type="text"
                    required
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-orange-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.directionCol}</label>
                  <select
                    value={formDirection}
                    onChange={(e: any) => setFormDirection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="BUY">{t.extra.buyLabel}</option>
                    <option value="SELL">{t.extra.sellLabel}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t.common.timeframe}</label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={formTimeframe}
                  onChange={(e) => setFormTimeframe(e.target.value.toUpperCase())}
                  placeholder="1H"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.entryPriceLabel}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formEntryPrice}
                    onChange={(e) => setFormEntryPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-rose-400 mb-1">{t.risk.stopLossPriceLabel}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formStopLoss}
                    onChange={(e) => setFormStopLoss(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-rose-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">{t.risk.takeProfitPriceLabel}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formTakeProfit}
                    onChange={(e) => setFormTakeProfit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.sizeLabel}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formSize}
                    onChange={(e) => setFormSize(parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t.common.status}</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
                  >
                    <option value="OPEN">{t.extra.statusOpen}</option>
                    <option value="CLOSED">{t.extra.statusClosed}</option>
                    <option value="CANCELLED">{t.journal.cancelledStatus}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.exitPriceLabel}</label>
                  <input
                    type="number"
                    step="any"
                    value={formExitPrice ?? ''}
                    onChange={(e) => setFormExitPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder={t.extra.exitPricePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.notesPsychology}</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={t.extra.notesPlaceholder}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.tagsLabel}</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder={t.extra.tagsPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
