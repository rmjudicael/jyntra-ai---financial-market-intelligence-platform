import React, { useState, useEffect } from 'react';
import { UserSession, LocalStore, STORAGE_KEYS } from '../services/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { AuthService } from '../services/auth';
import {
  Settings,
  User,
  Cpu,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Key,
  Shield,
  Save,
  Trash2,
  Code2,
  Play,
  RefreshCw,
  Terminal
} from 'lucide-react';

export const SettingsPage: React.FC<{ session: UserSession; onSessionUpdate: () => void }> = ({
  session,
  onSessionUpdate,
}) => {
  const { t, currentLang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'language' | 'models' | 'meta_console' | 'storage'>('profile');
  const [name, setName] = useState(session.name);
  const [email] = useState(session.email);
  const [contactNumber, setContactNumber] = useState('');
  const [preferredAsset, setPreferredAsset] = useState('BTC/USDT');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Models catalog state
  const [models, setModels] = useState<any[]>([]);
  const [metaKeyConfigured, setJYNTRAKeyConfigured] = useState<boolean>(false);

  // JYNTRA Direct Execution Console state
  const [selectedJYNTRAModel, setSelectedJYNTRAModel] = useState<string>('jyntra-raisonnement');
  const [metaPrompt, setJYNTRAPrompt] = useState<string>(
    'Analyse la liquidité institutionnelle sur BTC/USDT après le balayage du plus haut hebdomadaire. Quels sont les risques de Bull Trap ?'
  );
  const [metaRunning, setJYNTRARunning] = useState<boolean>(false);
  const [metaResult, setJYNTRAResult] = useState<any | null>(null);
  const [metaError, setJYNTRAError] = useState<string | null>(null);

  const loadModels = () => {
    fetch('/api/ai/models')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (d.registeredModels) setModels(d.registeredModels);
          setJYNTRAKeyConfigured(!!d.serviceConfigured);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const currentSettings = LocalStore.get<any>(STORAGE_KEYS.SETTINGS, {});
    if (currentSettings.contactNumber) setContactNumber(currentSettings.contactNumber);
    if (currentSettings.preferredAsset) setPreferredAsset(currentSettings.preferredAsset);
    loadModels();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    AuthService.updateProfile(session.userId, { name });

    const currentSettings = LocalStore.get<any>(STORAGE_KEYS.SETTINGS, {});
    currentSettings.contactNumber = contactNumber;
    currentSettings.preferredAsset = preferredAsset;
    LocalStore.set(STORAGE_KEYS.SETTINGS, currentSettings);

    onSessionUpdate();
    setSaveMsg(t.extra.savedOk);
    setTimeout(() => setSaveMsg(null), 3500);
  };

  const handleRunJYNTRACall = async () => {
    setJYNTRARunning(true);
    setJYNTRAError(null);
    setJYNTRAResult(null);

    try {
      const res = await fetch('/api/ai/engine-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedJYNTRAModel,
          prompt: metaPrompt,
          systemPrompt: 'Tu es un analyste quantitatif d\'élite chez JYNTRA AI opérant sous modèle JYNTRA.',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setJYNTRAError(data.error || 'Erreur lors de l\'appel au modèle JYNTRA.');
      } else {
        setJYNTRAResult(data);
      }
    } catch (err: any) {
      setJYNTRAError(err?.message || 'Erreur de connexion au serveur.');
    } finally {
      setJYNTRARunning(false);
    }
  };

  const handleExportData = () => {
    const data: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach((k) => {
      data[k] = LocalStore.get(k, null);
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jyntra_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (
      confirm(t.extra.resetConfirm)
    ) {
      LocalStore.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5" />
          {t.settings.badge}
        </div>
        <h1 className="text-3xl font-black text-white mt-1">{t.extra.settingsTitleLong}</h1>
        <p className="text-sm text-slate-400">
          {t.extra.settingsSubtitleLong}
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t.extra.profileTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('language')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'language'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>{t.settings.languageTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'models'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{t.extra.modelsTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('meta_console')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'meta_console'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>{t.extra.metaConsoleTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'storage'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t.extra.secureBackupTab}</span>
        </button>
      </div>

      {/* 1. Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 p-8 shadow-2xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-orange-400" />
            {t.settings.profileTitle}
          </h2>

          {saveMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.settings.nameLabel}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.settings.emailLabel}</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.extra.phoneLabel2}
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder={t.extra.phonePlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {t.extra.phonePrivacy}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.extra.favouriteAsset}</label>
              <input
                type="text"
                value={preferredAsset}
                onChange={(e) => setPreferredAsset(e.target.value.toUpperCase())}
                placeholder="ex: BTC/USDT"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-orange-400 font-mono font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all"
              >
                {t.settings.saveSettingsBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Langue — réellement appliquée à toute l'interface via LanguageContext */}
      {activeTab === 'language' && (
        <div className="max-w-3xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 p-8 shadow-2xl space-y-4">
          <h2 className="text-base font-bold text-white">{t.settings.languageTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([['fr', 'Français'], ['en', 'English'], ['mg', 'Malagasy']] as const).map(([code, label]) => (
              <button key={code} onClick={() => setLang(code)} className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentLang === code ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-orange-500/50'}`}>{label}</button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">{currentLang === 'mg' ? 'Ny fiteny voafidy dia ampiharina avy hatrany amin’ny interface manontolo.' : currentLang === 'en' ? 'The selected language is applied immediately to the whole interface.' : 'La langue choisie est appliquée immédiatement à l’ensemble de l’interface.'}</p>
        </div>
      )}

      {/* 2. Tab: AI & JYNTRA Models Registry */}
      {activeTab === 'models' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              {t.settings.privacyTitle}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.extra.noFalsePromise}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((mod) => (
              <div
                key={mod.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{mod.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        mod.status === 'ACTIVE_CONNECTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {mod.status === 'ACTIVE_CONNECTED' ? t.extra.activeOperational : t.extra.awaitingKey}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Fournisseur : <strong className="text-slate-300">{mod.provider}</strong> &bull; Rôle : {mod.type}
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 pt-1">
                    <div>
                      <strong className="text-slate-400 text-[11px]">{t.extra.inputsLabel}</strong>{' '}
                      {mod.inputs?.join(', ')}
                    </div>
                    <div>
                      <strong className="text-slate-400 text-[11px]">{currentLang === 'mg' ? 'Vokatra:' : currentLang === 'en' ? 'Outputs:' : 'Sorties :'}</strong>{' '}
                      {mod.outputs?.join(', ')}
                    </div>
                    <div>
                      <strong className="text-slate-400 text-[11px]">{t.extra.methodLabel}</strong>{' '}
                      <span className="font-mono text-cyan-400 text-[11px]">{mod.method}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      <strong>Limites :</strong> {mod.limits}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  Module cible : {mod.activeForFeatures?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console d'exécution des modèles JYNTRA */}
      {activeTab === 'meta_console' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">{t.extra.metaConsoleTitle}</h2>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                  metaKeyConfigured
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {metaKeyConfigured ? t.extra.metaActiveKey : t.extra.metaMissingKey}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.extra.metaConsoleDesc}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {t.extra.metaTargetModel}
                </label>
                <select
                  value={selectedJYNTRAModel}
                  onChange={(e) => setSelectedJYNTRAModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-orange-400 focus:outline-none"
                >
                  <option value="jyntra-raisonnement">jyntra-raisonnement (JYNTRA Reasoning)</option>
                  <option value="jyntra-rapide">jyntra-rapide (Fast Quantitative)</option>
                  <option value="jyntra-agents">JYNTRA Agents (Agent Node)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {t.extra.metaPromptLabel}
                </label>
                <textarea
                  value={metaPrompt}
                  onChange={(e) => setJYNTRAPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleRunJYNTRACall}
                disabled={metaRunning}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-95"
              >
                {metaRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{t.extra.metaCalling}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t.extra.metaCallBtn}</span>
                  </>
                )}
              </button>
            </div>

            {metaError && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Information de Configuration :</span>
                </div>
                <p>{metaError}</p>
                <p className="text-[11px] text-slate-400 pt-1 font-mono">
                  {t.extra.metaAddKey}
                </p>
              </div>
            )}

            {metaResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {t.extra.metaRealReply}
                  </span>
                  <span>{currentLang === 'mg' ? 'Fahatarana' : currentLang === 'en' ? 'Latency' : 'Latence'} : {metaResult.latencyMs} ms</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {metaResult.text}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {t.extra.modelCalled} : {selectedJYNTRAModel} &bull; {t.extra.timestampWord} : {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Tab: Secure Storage Management */}
      {activeTab === 'storage' && (
        <div className="max-w-3xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 p-8 shadow-2xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            {t.extra.backupTitle}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            {t.extra.backupDesc}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleExportData}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-md"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span>{t.extra.exportData}</span>
            </button>

            <button
              onClick={handleClearData}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.extra.resetLocalBase}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
