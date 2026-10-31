/**
 * JYNTRA AI - Internationalization (i18n) Comprehensive Dictionary
 * Complete, full-coverage translations for:
 * - Français (FR, default) 🇫🇷
 * - English (GB) 🇬🇧
 * - Malagasy (MG) 🇲🇬
 *
 * All public interfaces, dashboards, menus, forms, charts, and dialogues
 * are fully translated with zero omissions and zero references to technical storage keys.
 */

export type SupportedLanguage = 'fr' | 'en' | 'mg';

export interface Translations {
  slogan: string;
  tagline: string;
  nav: {
    home: string;
    features: string;
    tech: string;
    lynaraPreview: string;
    about: string;
    workspace: string;
    chartAnalysis: string;
    lynara3d: string;
    multiAgents: string;
    markets: string;
    risk: string;
    backtest: string;
    journal: string;
    news: string;
    workflow: string;
    jyntrack: string;
    academy: string;
    settings: string;
    login: string;
    register: string;
    logout: string;
    lightMode: string;
    darkMode: string;
    groupDiscover: string;
    groupAnalysis: string;
    groupMarkets: string;
    groupTrading: string;
  };
  common: {
    loading: string;
    save: string;
    saved: string;
    cancel: string;
    delete: string;
    edit: string;
    confirm: string;
    refresh: string;
    search: string;
    filter: string;
    all: string;
    crypto: string;
    forex: string;
    commodities: string;
    indices: string;
    symbol: string;
    price: string;
    change24h: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    status: string;
    date: string;
    actions: string;
    realTime: string;
    verifiedData: string;
    protectedData: string;
    success: string;
    error: string;
    timeframe: string;
    disclaimer: string;
    unavailable: string;
    gold: string;
  };
  home: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    startFree: string;
    explore: string;
    noFakeData: string;
    protectedStorage: string;
    lynaraVoice: string;
    liveTicker: string;
    liveTickerLoading: string;
    algoAdvantageBadge: string;
    algoAdvantageTitle: string;
    algoAdvantageSubtitle: string;
    featureVisionTitle: string;
    featureVisionDesc: string;
    featureAgentsTitle: string;
    featureAgentsDesc: string;
    featureRiskTitle: string;
    featureRiskDesc: string;
    featureLynaraTitle: string;
    featureLynaraDesc: string;
    featureBacktestTitle: string;
    featureBacktestDesc: string;
    featurePrivacyTitle: string;
    featurePrivacyDesc: string;
    academyNewsBadge: string;
    academyNewsTitle: string;
    academyNewsSubtitle: string;
    academyCardBadge: string;
    academyCardTitle: string;
    academyCardDesc: string;
    academyCardCta: string;
    newsCardBadge: string;
    newsCardTitle: string;
    newsCardDesc: string;
    newsCardCta: string;
    lynaraBadge: string;
    lynaraTitle: string;
    lynaraSubtitle: string;
    lynaraPoint1Title: string;
    lynaraPoint1Desc: string;
    lynaraPoint2Title: string;
    lynaraPoint2Desc: string;
    lynaraPoint3Title: string;
    lynaraPoint3Desc: string;
    lynaraBtn: string;
    lynaraRoleTitle: string;
    lynaraRoleDesc: string;
    lynaraInteractionTitle: string;
    lynaraInteractionDesc: string;
    lynaraMetaTitle: string;
    lynaraMetaDesc: string;
    lynaraHonesty: string;
    lynaraHonestyNote: string;
    decisionChainBadge: string;
    decisionChainTitle: string;
    decisionChainSubtitle: string;
    workflowTitle: string;
    workflowSubtitle: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaBtn: string;
    alreadyAccount: string;
  };
  workspace: {
    badge: string;
    welcome: string;
    subtitle: string;
    newAnalysisBtn: string;
    consultLynaraBtn: string;
    metricAnalyses: string;
    metricAnalysesSub: string;
    metricTrades: string;
    metricTradesSub: string;
    metricWinRate: string;
    metricWinRateSub: string;
    metricPnL: string;
    metricPnLSub: string;
    chartTitle: string;
    chartSubtitle: string;
    chartDeepAnalysisBtn: string;
    quickModulesTitle: string;
    recentAnalysesTitle: string;
    recentAnalysesEmpty: string;
    createFirstAnalysis: string;
  };
  chart: {
    badge: string;
    title: string;
    subtitle: string;
    saveToJournal: string;
    savedToJournal: string;
    explainWithLynara: string;
    tabLive: string;
    tabUpload: string;
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    changeImage: string;
    paramsTitle: string;
    instrumentLabel: string;
    timeframeLabel: string;
    customPromptLabel: string;
    customPromptPlaceholder: string;
    analyzeBtn: string;
    analyzingBtn: string;
    waitingTitle: string;
    waitingDesc: string;
    auditCriteria: string;
    crit1: string;
    crit2: string;
    crit3: string;
    crit4: string;
    recommendationLabel: string;
    aiEngineLabel: string;
    tradePlanTitle: string;
    entryLabel: string;
    stopLossLabel: string;
    takeProfitLabel: string;
    riskRewardLabel: string;
    invalidationTitle: string;
    visualObservationsTitle: string;
    trendLabel: string;
    smcLabel: string;
    orderBlocksLabel: string;
    liquidityLabel: string;
    interpretationTitle: string;
    hypothesesTitle: string;
    riskDisclaimer: string;
    liveFeedHint: string;
    engineName: string;
    atMarket: string;
    yesLabel: string;
    noLabel: string;
    neutralLabel: string;
    providerLabel: string;
    completenessLabel: string;
    sufficientLabel: string;
    incompleteLabel: string;
    missingLabel: string;
    realDataUsedLabel: string;
    viewWorkflow: string;
    annotatedImageTitle: string;
    annotatedNote: string;
    takeProfit2Label: string;
    takeProfit3Label: string;
    yesTradeLabel: string;
    noTradeLabel: string;
    confidenceLabel: string;
    confirmationsLabel: string;
    marketReadingTitle: string;
    setupQualityLabel: string;
  };
  lynara: {

    title: string;
    subtitle: string;
    roleDesc: string;
    listening: string;
    thinking: string;
    speaking: string;
    idle: string;
    onlineStatus: string;
    voiceActive: string;
    micTooltipStart: string;
    micTooltipStop: string;
    voiceLangLabel: string;
    inputPlaceholder: string;
    sendBtn: string;
    repeatAudio: string;
    muteBtn: string;
    unmuteBtn: string;
    disclaimer: string;
    sampleSMC: string;
    sampleSizing: string;
    sampleSL: string;
    sampleMG: string;
    greeting: string;
    thinkingBubble: string;
    suggestions: string;
    notConfigured: string;
    connectionError: string;
    liveTranscript: string;
    contextLoaded: string;
    voiceLabel: string;
    replyLanguage: string;
    ttsFallbackNote: string;
    sttUnsupportedNote: string;
  };
  agents: {
    badge: string;
    title: string;
    subtitle: string;
    debateTab: string;
    consensusTab: string;
    launchDebateBtn: string;
    launchingDebate: string;
    consensusVerdict: string;
    confidenceScore: string;
    metaEngineNotice: string;
    roleTechnical: string;
    roleMacro: string;
    roleRisk: string;
    roleStrategy: string;
    roleRedTeam: string;
    roleLead: string;
    descTechnical: string;
    descMacro: string;
    descRisk: string;
    descStrategy: string;
    descRedTeam: string;
    descLead: string;
    timeframeLabel: string;
    statusLabel: string;
    statusReady: string;
    statusStandby: string;
    contextPlaceholder: string;
    missingAnalysis: string;
    goToChart: string;
  };
  markets: {
    badge: string;
    title: string;
    subtitle: string;
    refreshBtn: string;
    searchPlaceholder: string;
    spotLabel: string;
    interactiveCandles: string;
    analyzeWithJyntra: string;
    candlesLabel: string;
    sourceVerified: string;
    zeroSynthetic: string;
  };
  risk: {
    badge: string;
    title: string;
    subtitle: string;
    capitalLabel: string;
    riskPercentLabel: string;
    entryPriceLabel: string;
    stopLossPriceLabel: string;
    takeProfitPriceLabel: string;
    calculateBtn: string;
    positionSizeResult: string;
    monetaryRiskResult: string;
    riskRewardResult: string;
    ruinProbability: string;
    parametersTitle: string;
    ofCapital: string;
    ofAccount: string;
    assetUnits: string;
    formulaTitle: string;
    formulaBody: string;
    formulaNote: string;
    warnCapital: string;
    warnPrices: string;
    warnLongSL: string;
    warnLongTP: string;
    warnShortSL: string;
    warnShortTP: string;
    warnHighRisk: string;
    warnLowRR: string;
    journalNote: string;
    sourceLabel: string;
  };
  backtest: {
    badge: string;
    title: string;
    subtitle: string;
    runBacktestBtn: string;
    runningBacktest: string;
    parametersTitle: string;
    metricsTitle: string;
    winRate: string;
    profitFactor: string;
    maxDrawdown: string;
    totalTrades: string;
    equityCurveTitle: string;
    strategyEma: string;
    strategyRsi: string;
    strategyBreakout: string;
    tf15m: string;
    tf1h: string;
    tf4h: string;
    tf1d: string;
  };
  journal: {
    badge: string;
    title: string;
    subtitle: string;
    newTradeBtn: string;
    openTradesTab: string;
    closedTradesTab: string;
    emptyJournal: string;
    addTitle: string;
    editTitle: string;
    cancelledStatus: string;
    noNote: string;
    savedAnalyses: string;
    noSavedAnalyses: string;
    deleteConfirm: string;
  };
  workflow: {
    badge: string;
    title: string;
    subtitle: string;
    executeWorkflowBtn: string;
    pipelineStatus: string;
  };
  academy: {
    badge: string;
    title: string;
    subtitle: string;
    module1: string;
    module2: string;
    module3: string;
  };
  settings: {
    badge: string;
    title: string;
    subtitle: string;
    profileTitle: string;
    nameLabel: string;
    emailLabel: string;
    languageTitle: string;
    themeTitle: string;
    privacyTitle: string;
    privacyDesc: string;
    saveSettingsBtn: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    loginBtn: string;
    noAccount: string;
    createAccountLink: string;
    registerTitle: string;
    registerSubtitle: string;
    registerBtn: string;
    hasAccount: string;
    loginLink: string;
    fullNameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    successRegister: string;
    securityNotice: string;
    errNameShort: string;
    errEmailInvalid: string;
    errPasswordShort: string;
    errEmailExists: string;
    errNoAccount: string;
    errWrongPassword: string;
    errUserNotFound: string;
    errFillAll: string;
    errPasswordMismatch: string;
    errLoginGeneric: string;
    errRegisterGeneric: string;
  };
  footer: {
    projectTitle: string;
    projectText: string;
    projectLink: string;
    rights: string;
    compactRights: string;
    realDataLabel: string;
    pedagogyTitle: string;
    pedagogyText: string;
  };
  extra: {
    secureSession: string; archivedCount: string; modelLabel: string; openLink: string;
    strategy: string; testedAsset: string; initialCapital: string; finalBalance: string; expectancyPerTrade: string; totalExecutions: string; grossProfitLoss: string; worstDrawdown: string; avgMathGain: string; tradesLog: string; exitReason: string; tpHit: string; slHit: string; inverseSignal: string; directionCol: string; entryCol: string; exitCol: string;
    longLabel: string; shortLabel: string; assetLabel: string; riskMoney: string; expectedGain: string; tradeValue: string; distSL: string; distTP: string; unitsOfAsset: string;
    executiveSynthesis: string; disagreements: string; adverseHypothesis: string; dailyLabel: string; assetShort: string;
    recordedPositions: string; closedPositionsLabel: string; netRealisedPnl: string; journalSearchPlaceholder: string; noTradeMatch: string; buyLabel: string; sellLabel: string; entryPriceLabel: string; exitPriceLabel: string; sizeLabel: string; statusOpen: string; statusClosed: string; notesPsychology: string; notesPlaceholder: string; tagsLabel: string; tagsPlaceholder: string; exitPricePlaceholder: string;
    saveOnDevice: string;
    academyBadge: string; academySchool: string; academySubtitle: string; globalProgress: string; validatedOf: string; curriculum: string; structuredModules: string; learningSuffix: string; diagramTitle: string; bullishCandle: string; bearishCandle: string; recommendedVideo: string; watchCourse: string; trapTitle: string; quizTitle: string; validated: string; correctAnswer: string; wrongAnswer: string; moduleWord: string;
    workflowRun: string; workflowRunning: string; workflowNodesTitle: string; dataTransmitted: string; inputPort: string; outputPort: string; statusColon: string; calculating: string; outgoingSummary: string; outgoingJson: string; workflowHint: string; workflowSubtitleLong: string;
    newsBadge: string; newsTitle: string; newsSubtitle: string; newsLoading: string; newsEmpty: string; factsTitle: string; interpretationTitle2: string; readSource: string; newsUnavailable: string;
    newsRefresh: string; newsUpdatedAt: string; newsErrorTitle: string; newsErrorBody: string; newsRetry: string; newsReadArticle: string; newsDateUnknown: string; newsNoImage: string;
    newsCategoryMarkets: string; newsCategoryEconomy: string; newsCategoryCompanies: string; newsCategoryForex: string; newsCategoryCrypto: string; newsCategoryCentralBanks: string;
    newsCountLabel: string; newsStaleNotice: string; newsAutoRefreshNote: string;
    accountCreated: string; securityStrong: string;
    sendToAiVision: string; bullishLegend: string; bearishLegend: string; timestampWord: string; refreshQuotesTitle: string;
    verifiedSourceLine: string; noSyntheticQuote: string; interactiveCandlesLabel: string;
    liveCore: string; companionLabel: string; voiceSubLabel: string; chartTestBtn: string; decisionChainTitle2: string; endToEndChain: string;
    settingsTitleLong: string; settingsSubtitleLong: string; profileTab: string; modelsTab: string; metaConsoleTab: string; secureBackupTab: string; phoneLabel2: string; phonePlaceholder: string; phonePrivacy: string; favouriteAsset: string; savedOk: string; inputsLabel: string; methodLabel: string; activeOperational: string; awaitingKey: string; metaConsoleTitle: string; metaActiveKey: string; metaMissingKey: string; metaConsoleDesc: string; metaTargetModel: string; metaPromptLabel: string; metaCalling: string; metaCallBtn: string; metaAddKey: string; metaRealReply: string; modelCalled: string; backupTitle: string; backupDesc: string; exportData: string; resetLocalBase: string; resetConfirm: string; noFalsePromise: string;
    featuresTitle: string; featuresSubtitle: string; techPageTitle: string; techPageSubtitle: string; aboutTitle: string; engineeringLabel: string; locationLabel: string; testPlatformBtn: string; lynaraPreviewTitle: string; lynaraPreviewSubtitle: string; accessLynaraBtn: string;
    stepImport: string; stepAnalyse: string; stepVerify: string; stepCompare: string; stepEvaluate: string; stepReport: string; stepImportDesc: string; stepAnalyseDesc: string; stepVerifyDesc: string; stepCompareDesc: string; stepEvaluateDesc: string; stepReportDesc: string;
    chainStep1: string; chainStep2: string; chainStep3: string; chainStep4: string; chainStep5: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  // =========================================================================
  // FRANÇAIS (FR)
  // =========================================================================
  fr: {
    slogan: 'Your AI. Your Edge.',
    tagline: "Plateforme web d'intelligence financière, vision multimodale et arbitrage multi-agents au service de votre prise de décision.",
    nav: {
      home: 'Accueil',
      features: 'Fonctionnalités',
      tech: 'Technologie / IA',
      lynaraPreview: 'LYNARA',
      about: 'À propos',
      workspace: 'Workspace',
      chartAnalysis: 'Analyse Graphique',
      lynara3d: 'LYNARA',
      multiAgents: 'Multi-Agents',
      markets: 'Marchés',
      risk: 'Risque',
      backtest: 'Backtest',
      journal: 'Journal',
      news: 'Actualités',
      workflow: 'Workflow Studio',
      jyntrack: 'JYNTRACK',
      academy: 'Académie',
      settings: 'Paramètres',
      login: 'Connexion',
      register: 'Créer un compte',
      logout: 'Déconnexion',
      lightMode: 'Activer le mode clair',
      darkMode: 'Activer le mode nuit',
      groupDiscover: 'Découvrir',
      groupAnalysis: 'Analyse',
      groupMarkets: 'Marchés',
      groupTrading: 'Trading',
    },
    common: {
      unavailable: 'Indisponible',
      gold: 'Or',
      loading: 'Chargement en cours...',
      save: 'Sauvegarder',
      saved: 'Sauvegardé avec succès !',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      confirm: 'Confirmer',
      refresh: 'Rafraîchir',
      search: 'Rechercher...',
      filter: 'Filtrer',
      all: 'Tous',
      crypto: 'Crypto',
      forex: 'Forex & Devises',
      commodities: 'Matières Premières / Or',
      indices: 'Indices',
      symbol: 'Instrument',
      price: 'Cours Actuel',
      change24h: 'Variation 24h',
      volume24h: 'Volume 24h',
      high24h: 'Plus Haut 24h',
      low24h: 'Plus Bas 24h',
      status: 'Statut',
      date: 'Date',
      actions: 'Actions',
      realTime: 'Temps Réel Authentique',
      verifiedData: 'Données de marché vérifiées',
      protectedData: 'Données protégées sur votre appareil',
      success: 'Opération réussie',
      error: 'Une erreur est survenue',
      timeframe: 'Unité de temps',
      disclaimer: 'Avertissement : Les analyses fournies sont une aide cognitive et ne constituent pas un conseil en investissement. Gérez rigoureusement votre capital.',
    },
    home: {
      badge: 'NOUVELLE GÉNÉRATION DE TRADING INTELLIGENT',
      heroTitle: 'JYNTRA AI',
      heroSubtitle: 'L\'intelligence financière nouvelle génération : analyse multimodale des graphiques MT4/MT5, consensus de 6 agents spécialisés, données de marché réelles, analyses probabilistes et assistante holographique LYNARA. Une plateforme d\'analyse et de décision pour les marchés financiers.',
      startFree: 'Commencer gratuitement',
      explore: 'Découvrir JYNTRA AI',
      noFakeData: 'Zéro fausse donnée',
      protectedStorage: 'Données protégées sur votre terminal',
      lynaraVoice: 'Assistante LYNARA vocale',
      liveTicker: 'COTATIONS RÉELLES :',
      liveTickerLoading: 'Connexion aux cotations temps réel...',
      algoAdvantageBadge: 'AVANTAGE ALGORITHMIQUE',
      algoAdvantageTitle: 'Pourquoi choisir JYNTRA AI pour vos analyses ?',
      algoAdvantageSubtitle: 'Les plateformes traditionnelles se limitent à des chandeliers passifs ou à des bots opaques. JYNTRA AI combine rigueur académique, modèles multimodaux et gestion du risque stricte.',
      featureVisionTitle: 'Vision Multimodale MT4 & MT5',
      featureVisionDesc: "Importez directement vos captures d'écran de graphiques. Notre IA détecte les Order Blocks, FVG, BOS, CHoCH et liquidités sans biais.",
      featureAgentsTitle: 'Consensus 6 Multi-Agents',
      featureAgentsDesc: 'Technical, Macro, Risk, Strategy, Red-Team et Lead Analyst débattent de façon contradictoire avant de formuler un plan de trading.',
      featureRiskTitle: 'Gestion du Risque & Sizing',
      featureRiskDesc: 'Calculateur mathématique de position en capital réel : Stop-Loss strict, ratio Risque/Rendement obligatoire >= 1.5, probabilité de ruine nulle.',
      featureLynaraTitle: 'LYNARA — Assistante holographique multilingue',
      featureLynaraDesc: 'Une femme virtuelle holographique interactive qui écoute vos questions au micro, analyse vos graphiques et vous répond à haute voix.',
      featureBacktestTitle: 'Simulation & Backtesting',
      featureBacktestDesc: "Testez vos stratégies sans biais d'anticipation. Métriques calculées sur bougies réelles : Win Rate, Profit Factor, Drawdown.",
      featurePrivacyTitle: 'Architecture Privée & Décentralisée',
      featurePrivacyDesc: 'Vos journaux, stratégies et analyses sont stockés dans votre navigateur. Seules les requêtes que vous lancez sont transmises au service d’IA.',
      academyNewsBadge: 'ALLER PLUS LOIN',
      academyNewsTitle: 'Apprendre et rester informé',
      academyNewsSubtitle: 'Deux espaces complémentaires pour enrichir votre lecture des marchés, au-delà de l’analyse technique.',
      academyCardBadge: 'ACADÉMIE INTERACTIVE',
      academyCardTitle: 'Apprendre à lire les marchés, étape par étape',
      academyCardDesc: 'Des modules structurés, des schémas pédagogiques et des quiz pour consolider vos bases et approfondir les concepts utilisés dans vos analyses.',
      academyCardCta: 'Explorer l’Académie',
      newsCardBadge: 'ACTUALITÉS FINANCIÈRES',
      newsCardTitle: 'Garder le contexte des marchés en temps réel',
      newsCardDesc: 'Un fil dédié aux marchés, à l’économie et aux entreprises : titres récents, sources identifiées, dates de publication et images lorsqu’elles sont disponibles.',
      newsCardCta: 'Voir les actualités',
      lynaraBadge: 'ASSISTANTE IA HOLOGRAPHIQUE',
      lynaraTitle: 'Une présence féminine holographique qui écoute, répond et vous guide',
      lynaraSubtitle: "LYNARA est la représentation holographique féminine de JYNTRA AI : une silhouette adulte translucide et lumineuse, dotée d'une respiration, d'un regard, de gestes et d'une synchronisation labiale avec la parole. Elle relie l'analyse de marché, le risque et la pédagogie dans une seule conversation.",
      lynaraPoint1Title: 'Présence holographique féminine :',
      lynaraPoint1Desc: 'Une silhouette adulte, translucide et lumineuse, animée par un shader dédié : respiration, clignements, regard et gestes discrets selon qu’elle écoute, réfléchit ou parle.',
      lynaraPoint2Title: 'Texte et voix réels :',
      lynaraPoint2Desc: 'Écrivez ou parlez au microphone quand le navigateur le permet. La réponse est transcrite puis lue par la voix disponible ; les langues sans voix sont signalées honnêtement.',
      lynaraPoint3Title: 'Multilingue par le modèle :',
      lynaraPoint3Desc: 'Elle détecte la langue de votre message et répond dans cette langue, y compris lorsque plusieurs langues se mélangent, et conserve le fil de la conversation.',
      lynaraBtn: 'Interagir avec LYNARA',
      lynaraRoleTitle: 'Son rôle dans JYNTRA AI',
      lynaraRoleDesc: 'LYNARA relie les modules entre eux : elle explique une analyse de graphique, reformule le raisonnement du comité multi-agents, rappelle les règles de risque et accompagne la progression dans l’Académie. Elle ne passe aucun ordre et ne remplace pas votre jugement.',
      lynaraInteractionTitle: 'Texte ou voix, selon vos capacités réelles',
      lynaraInteractionDesc: 'Le chat écrit fonctionne partout. L’écoute et la lecture vocale dépendent du navigateur : LYNARA indique clairement quand une langue ou une voix n’est pas disponible, plutôt que de simuler un accent.',
      lynaraMetaTitle: 'Compréhension assurée par les modèles Meta',
      lynaraMetaDesc: 'LYNARA comprend vos messages et vos graphiques grâce aux modèles Meta, et vous répond dans votre langue.',
      lynaraHonesty: 'LYNARA est une interface holographique : une représentation virtuelle, pas une personne réelle.',
      lynaraHonestyNote: 'LYNARA est une interface holographique : une représentation virtuelle, pas une personne réelle. La voix est synthétisée par le navigateur dans la langue détectée ; sa qualité et sa disponibilité dépendent de l’appareil, et aucun accent n’est simulé.',
      decisionChainBadge: 'ANALYSE MULTIMODALE & CONTRADICTOIRE',
      decisionChainTitle: "De l'observation visuelle à la décision collégiale",
      decisionChainSubtitle: "Une analyse technique sérieuse ne repose jamais sur une seule voix. JYNTRA AI dissocie rigoureusement l'observation factuelle, l'interprétation algorithmique et les hypothèses probabilistes.",
      workflowTitle: 'Flux Opérationnel JYNTRA AI',
      workflowSubtitle: 'Un pipeline visuel transparent où chaque bloc exécute une fonction précise avec validation des flux de données.',
      ctaTitle: 'Prêt à transformer votre approche du trading ?',
      ctaSubtitle: 'Créez votre profil dès aujourd’hui. Aucune carte bancaire requise, données conservées dans votre navigateur.',
      ctaBtn: 'Créer mon compte JYNTRA AI',
      alreadyAccount: "J'ai déjà un compte",
    },
    workspace: {
      badge: 'Session active • Données Privées Sécurisées',
      welcome: 'Bonjour',
      subtitle: "Votre plateforme d'analyse algorithmique est synchronisée avec les marchés en temps réel.",
      newAnalysisBtn: 'Nouvelle Analyse MT4/MT5',
      consultLynaraBtn: 'Consulter LYNARA',
      metricAnalyses: 'Analyses IA Réalisées',
      metricAnalysesSub: 'Enregistrées sur votre profil',
      metricTrades: 'Trades Journalisés',
      metricTradesSub: 'positions clôturées',
      metricWinRate: 'Taux de Succès (Win Rate)',
      metricWinRateSub: 'Calculé sur trades réels',
      metricPnL: 'P&L Journal Total',
      metricPnLSub: 'Capital virtuel ou réel',
      chartTitle: 'Graphique & Flux de Marché Réel',
      chartSubtitle: "Chandelier dynamique avec calcul d'indicateurs (EMA 21, supports, résistances). Capturez et transférez directement à l'IA multimodale.",
      chartDeepAnalysisBtn: 'Mode analyse approfondie',
      quickModulesTitle: 'Modules Spécialisés JYNTRA AI',
      recentAnalysesTitle: 'Dernières Analyses Enregistrées',
      recentAnalysesEmpty: "Aucune analyse n'est encore enregistrée sur votre profil.",
      createFirstAnalysis: 'Créer votre première analyse MT4/MT5',
    },
    chart: {
      badge: 'Module Vision Multimodale',
      title: 'Analyse de Graphique MT4 / MT5',
      subtitle: 'Distingue rigoureusement : Observation visuelle, Interprétation IA et Hypothèses conditionnelles.',
      saveToJournal: 'Sauvegarder dans mon journal',
      savedToJournal: 'Enregistré dans le Journal !',
      explainWithLynara: 'Expliquer avec LYNARA',
      tabLive: 'Graphique en Direct (Marché)',
      tabUpload: 'Importer Capture MT4 / MT5 / TradingView',
      dropzoneTitle: 'Glissez votre capture de graphique ici',
      dropzoneSubtitle: 'ou cliquez pour parcourir vos fichiers (PNG, JPG)',
      changeImage: "Changer d'image",
      paramsTitle: "Paramètres d'Analyse Multimodale",
      instrumentLabel: 'Instrument',
      timeframeLabel: 'Timeframe Déclaré',
      customPromptLabel: 'Instruction ou Contexte Spécifique (optionnel)',
      customPromptPlaceholder: "ex: Vérifier si l'Order Block H1 précédent est validé par un sweep de liquidité...",
      analyzeBtn: "Lancer l'Analyse Algorithmique Complète",
      analyzingBtn: 'Analyse Multimodale en cours (Vision JYNTRA)...',
      waitingTitle: "En attente d'analyse",
      waitingDesc: "Chargez une capture de graphique ou utilisez le flux de cotations en direct, puis cliquez sur « Lancer l'Analyse Algorithmique ».",
      auditCriteria: "Grille d'audit JYNTRA AI :",
      crit1: 'Détection de structure SMC (BOS, CHoCH)',
      crit2: 'Cartographie des Order Blocks & FVG',
      crit3: 'Niveaux de liquidité Buy/Sell Side',
      crit4: 'Plan de trade conditionnel & Ratio R:R',
      recommendationLabel: 'RECOMMANDATION STRATÉGIQUE',
      aiEngineLabel: 'Moteur IA',
      tradePlanTitle: 'Plan de Trade Algorithmique',
      entryLabel: 'ENTRÉE',
      stopLossLabel: 'STOP-LOSS',
      takeProfitLabel: 'TAKE-PROFIT 1',
      riskRewardLabel: 'RATIO R:R',
      invalidationTitle: "Condition d'invalidation stricte :",
      visualObservationsTitle: '1. Observations Visuelles Factuelles',
      trendLabel: 'Tendance Détectée',
      smcLabel: 'Structures SMC',
      orderBlocksLabel: 'Order Blocks (OB) :',
      liquidityLabel: 'Zones de Liquidité :',
      interpretationTitle: '2. Interprétation Algorithmique IA',
      hypothesesTitle: '3. Hypothèses Conditionnelles (Non-Certitudes)',
      riskDisclaimer: "Avertissement : Gestion rigoureuse recommandée : n'engagez jamais plus de 1% à 2% de votre capital sur une seule opportunité.",
      liveFeedHint: 'Utilisez le bouton d’envoi du graphique pour analyser exactement la vue affichée.',
      engineName: 'Moteur JYNTRA',
      atMarket: 'Au marché',
      yesLabel: 'Oui',
      noLabel: 'Non',
      neutralLabel: 'Neutre',
      providerLabel: 'Fournisseur réel :',
      completenessLabel: 'Complétude du graphique :',
      sufficientLabel: 'Suffisante',
      incompleteLabel: 'Incomplète',
      missingLabel: 'Manquant :',
      realDataUsedLabel: 'Données réelles utilisées :',
      viewWorkflow: 'Voir le Workflow de cette analyse',
      annotatedImageTitle: 'Image finale annotée',
      annotatedNote: 'Seuls les niveaux et structures réellement retournés par l’analyse sont affichés. Aucun niveau inventé.',
      takeProfit2Label: 'TAKE-PROFIT 2',
      takeProfit3Label: 'TAKE-PROFIT 3',
      yesTradeLabel: 'YES TRADE',
      noTradeLabel: 'NO TRADE',
      confidenceLabel: 'Confiance',
      confirmationsLabel: 'Confirmations',
      marketReadingTitle: 'Lecture du marché',
      setupQualityLabel: 'Qualité du setup',
    },
    lynara: {
      title: 'LYNARA',
      subtitle: 'Femme Virtuelle Holographique',
      roleDesc: 'Compagne d’analyse financière temps réel • Voix selon la langue détectée',
      listening: 'LYNARA vous écoute attentivement...',
      thinking: 'LYNARA synthétise les données de marché...',
      speaking: 'LYNARA vous répond...',
      idle: 'En veille active',
      onlineStatus: 'LYNARA En Ligne',
      voiceActive: 'Synthèse Naturelle',
      micTooltipStart: 'Parler au microphone',
      micTooltipStop: "Arrêter l'écoute du microphone",
      voiceLangLabel: 'Langue de LYNARA',
      inputPlaceholder: 'Posez votre question à LYNARA ou demandez un audit...',
      sendBtn: 'Envoyer',
      repeatAudio: 'Faire répéter à haute voix',
      muteBtn: 'Couper le son (Muet)',
      unmuteBtn: 'Activer le son',
      disclaimer: 'LYNARA est une aide cognitive à la décision. Validez toujours vos ratios de risque avant exécution.',
      sampleSMC: 'Explication Order Block',
      sampleSizing: 'Calcul Taille de Position',
      sampleSL: 'Audit Stop-Loss',
      sampleMG: 'Teny Malagasy',
      greeting: 'Bonjour {name}. Je suis LYNARA, votre assistante financière virtuelle holographique. Je peux examiner vos graphiques MT4/MT5, vérifier vos ratios de risque ou expliquer les structures de marché. Parlez-moi au micro ou écrivez librement.',
      thinkingBubble: 'LYNARA réfléchit et prépare sa réponse vocale...',
      suggestions: 'SUGGESTIONS :',
      notConfigured: 'LYNARA est momentanément indisponible. Veuillez réessayer dans quelques instants.',
      connectionError: 'Connexion au modèle IA impossible pour le moment. Vérifiez la configuration serveur, puis réessayez.',
      liveTranscript: 'TRANSCRIPTION EN DIRECT :',
      contextLoaded: 'Contexte actif chargé',
      voiceLabel: 'Voix',
      replyLanguage: 'Langue de réponse',
      ttsFallbackNote: "Aucune voix malagasy n'est installée sur ce navigateur : la réponse malagasy s'affiche à l'écrit et, si la lecture vocale est activée, elle est prononcée avec une voix française.",
      sttUnsupportedNote: "La reconnaissance vocale n'est pas disponible dans ce navigateur. Le chat écrit reste entièrement fonctionnel.",
    },
    agents: {
      badge: 'Arbitrage Collégial',
      title: 'Consensus Multi-Agents JYNTRA AI',
      subtitle: '6 agents d’élite aux perspectives contradictoires analysent le marché avant toute prise de position.',
      debateTab: 'Délibération Contradictoire',
      consensusTab: 'Synthèse du Lead Analyst',
      launchDebateBtn: 'Lancer la Délibération Multi-Agents',
      launchingDebate: 'Débat contradictoire en cours...',
      consensusVerdict: 'VERDICT COLLÉGIAL',
      confidenceScore: 'Indice de Confiance',
      metaEngineNotice: 'Modèle JYNTRA Red-Team activé avec succès.',
      roleTechnical: 'Price Action & Smart Money Concepts',
      roleMacro: 'Macroéconomie & Flux Institutionnels',
      roleRisk: 'Préservation du Capital & Invalidation',
      roleStrategy: 'Espérance Mathématique & Edge',
      roleRedTeam: 'Avocat du Diable & Faux Signaux',
      roleLead: 'Arbitre en Chef & Décision Finale',
      descTechnical: 'Traque les Order Blocks, Fair Value Gaps, liquidité Buy/Sell side et cassures de structures BOS.',
      descMacro: 'Évalue les taux de refinancement, flux ETF, corrélations DXY et calendrier économique.',
      descRisk: 'Pose un veto catégorique sur les scénarios à R:R < 1.5 ou Stop-Loss arbitraire.',
      descStrategy: 'Calcule la probabilité statistique de réussite selon le régime de volatilité actuel.',
      descRedTeam: 'Chasse les pièges à acheteurs (Bull Traps), fausses cassures et sweeps de liquidité manipulatoires.',
      descLead: 'Pèse chaque argument contradictoire et délivre la recommandation unifiée finale.',
      timeframeLabel: 'Unité de temps',
      statusLabel: 'Statut',
      statusReady: 'Rapport validé',
      statusStandby: 'En veille active',
      contextPlaceholder: 'Contexte optionnel (ex: annonce FOMC ce soir, cassure de range)...',
      missingAnalysis: 'Veuillez d’abord effectuer l’analyse du graphique avant d’utiliser cette fonctionnalité.',
      goToChart: 'Aller à l’analyse du graphique',
    },
    markets: {
      badge: 'Flux de Cotations en Direct',
      title: 'Marchés Financiers & Carnets',
      subtitle: "Données de marché spot 100% réelles issues d’API publiques de marché et des taux officiels Forex. Zéro cotation fictive.",
      refreshBtn: 'Actualiser les flux',
      searchPlaceholder: 'Filtrer un instrument (BTC, EUR, XAU, SOL...)...',
      spotLabel: 'Spot',
      interactiveCandles: 'Chandeliers interactifs',
      analyzeWithJyntra: 'Analyser avec JYNTRA AI',
      candlesLabel: 'Chandeliers interactifs réels',
      sourceVerified: 'Source vérifiée : Flux de marché certifié & Taux de référence officiels',
      zeroSynthetic: 'Zéro cotation synthétique',
    },
    risk: {
      badge: 'Préservation du Capital',
      title: 'Calculateur de Risque & Sizing Exact',
      subtitle: "Déterminez mathématiquement la taille exacte de votre position pour limiter la perte au seuil choisi (1% ou 2%).",
      capitalLabel: 'Capital Total du Portefeuille ($)',
      riskPercentLabel: 'Risque Maximal Toléré (%)',
      entryPriceLabel: "Prix d'Entrée Prévu ($)",
      stopLossPriceLabel: 'Prix de Stop-Loss Strict ($)',
      takeProfitPriceLabel: 'Prix d’Objectif Take-Profit ($)',
      calculateBtn: 'Calculer le Dimensionnement Mathématique',
      positionSizeResult: 'Taille de Position Recommandée',
      monetaryRiskResult: 'Perte Maximale en Dollar ($)',
      riskRewardResult: 'Ratio Risque / Rendement',
      ruinProbability: 'Probabilité de Ruine Mathématique',
      parametersTitle: 'Paramètres du Capital & de l’Ordre',
      ofCapital: 'du capital',
      ofAccount: 'du compte',
      assetUnits: 'unités d’actif',
      formulaTitle: 'Formule Mathématique JYNTRA AI',
      formulaBody: 'Taille = (Capital × % Risque) / |Prix Entrée − Stop-Loss|',
      formulaNote: 'Cette formule garantit qu’en cas de déclenchement du Stop-Loss, la perte maximale subie sera exactement égale au montant de risque défini ({amount}), quel que soit le niveau de levier utilisé.',
      warnCapital: 'Le capital du compte doit être supérieur à zéro.',
      warnPrices: 'Les prix d’entrée, de Stop-Loss et de Take-Profit doivent être strictement positifs.',
      warnLongSL: 'Pour un achat (LONG), le Stop-Loss doit être inférieur au prix d’entrée.',
      warnLongTP: 'Pour un achat (LONG), le Take-Profit doit être supérieur au prix d’entrée.',
      warnShortSL: 'Pour une vente (SHORT), le Stop-Loss doit être supérieur au prix d’entrée.',
      warnShortTP: 'Pour une vente (SHORT), le Take-Profit doit être inférieur au prix d’entrée.',
      warnHighRisk: 'Attention : risque supérieur à 3 % du capital sur un seul trade. Une gestion prudente recommande 2 % maximum.',
      warnLowRR: 'Ratio R:R inférieur à 1,5. Une espérance de gain favorable demande idéalement un R:R ≥ 2,0.',
      journalNote: 'Position calibrée avec un risque de {amount} ({percent} %), R:R = {rr}.',
      sourceLabel: 'Calculateur Risque',
    },
    backtest: {
      badge: 'Validation Historique Sans Biais',
      title: 'Moteur de Simulation & Backtesting',
      subtitle: 'Évaluez vos stratégies de trading sur des données historiques authentiques sans aucun biais d’anticipation.',
      runBacktestBtn: 'Exécuter le Backtest',
      runningBacktest: 'Calcul des simulations en cours...',
      parametersTitle: 'Paramètres du Test',
      metricsTitle: 'Indicateurs de Performance',
      winRate: 'Taux de Réussite (Win Rate)',
      profitFactor: 'Facteur de Profit (Profit Factor)',
      maxDrawdown: 'Perte Maximale (Max Drawdown)',
      totalTrades: 'Nombre Total de Trades',
      equityCurveTitle: 'Courbe d’Évolution du Capital (Equity Curve)',
      strategyEma: 'EMA Cross 9/21 (Tendance)',
      strategyRsi: 'RSI 14 Mean Reversion',
      strategyBreakout: 'Range Breakout 10 bougies',
      tf15m: '15 Minutes',
      tf1h: '1 Heure',
      tf4h: '4 Heures',
      tf1d: '1 Jour',
    },
    journal: {
      badge: 'Discipline & Journal de Bord',
      title: 'Journal de Trading Personnel',
      subtitle: 'Consignez vos prises de position avec captures, émotions, règles respectées et résultats financiers.',
      newTradeBtn: 'Ajouter un Trade',
      openTradesTab: 'Positions en Cours',
      closedTradesTab: 'Positions Clôturées',
      emptyJournal: 'Aucun trade enregistré pour le moment.',
      addTitle: 'Ajouter une position au Journal',
      editTitle: 'Modifier la position',
      cancelledStatus: 'CANCELLED (Annulé)',
      noNote: 'Aucune note',
      savedAnalyses: 'Analyses enregistrées',
      noSavedAnalyses: 'Aucune analyse enregistrée. Depuis Analyse Graphique, cliquez sur « Enregistrer dans le journal ».',
      deleteConfirm: 'Voulez-vous supprimer définitivement cette entrée du journal ?',
    },
    workflow: {
      badge: 'Flux Opérationnel Visuel',
      title: 'Workflow Studio JYNTRA AI',
      subtitle: 'Configurez et exécutez graphiquement votre pipeline complet : Données → Vision IA → Multi-Agents → Risque → Rapport.',
      executeWorkflowBtn: 'Exécuter le Pipeline',
      pipelineStatus: 'Statut du Workflow',
    },
    academy: {
      badge: 'Formation Stratégique',
      title: 'Académie du Trading Intelligent',
      subtitle: 'Maîtrisez les concepts institutionnels Smart Money Concepts (SMC), Price Action et psychologie de marché.',
      module1: 'Fondamentaux des Marchés & Liquidités',
      module2: 'Smart Money Concepts & Structures BOS/CHoCH',
      module3: 'Gestion Mathématique du Risque & Psychologie',
    },
    settings: {
      badge: 'Configuration Personnelle',
      title: 'Paramètres du Compte & Préférences',
      subtitle: 'Gérez votre profil, vos langues préférées et vos paramètres d’affichage.',
      profileTitle: 'Profil Utilisateur',
      nameLabel: 'Nom ou Pseudo',
      emailLabel: 'Adresse E-mail',
      languageTitle: 'Langue de la Plateforme',
      themeTitle: 'Thème Visuel (Jour / Nuit)',
      privacyTitle: 'Confidentialité & Sécurité',
      privacyDesc: 'Vos données et historiques sont chiffrés et conservés sur votre propre terminal. Aucune donnée privée n’est partagée sans votre consentement.',
      saveSettingsBtn: 'Enregistrer les modifications',
    },
    auth: {
      loginTitle: 'Connexion à JYNTRA AI',
      loginSubtitle: 'Accédez à votre espace d’analyse financière et à LYNARA',
      loginBtn: 'Se connecter à mon compte',
      noAccount: 'Pas encore de compte ?',
      createAccountLink: 'Créer un compte sécurisé',
      registerTitle: 'Créer un compte JYNTRA AI',
      registerSubtitle: 'Initialisez votre profil sécurisé sur votre appareil',
      registerBtn: 'Créer mon compte',
      hasAccount: 'Vous possédez déjà un compte ?',
      loginLink: 'Connectez-vous',
      fullNameLabel: 'Nom complet ou Pseudo',
      emailLabel: 'Adresse Email',
      passwordLabel: 'Mot de passe (min. 6 caractères)',
      confirmPasswordLabel: 'Confirmer le mot de passe',
      successRegister: 'Votre compte a été initialisé avec succès ! Connectez-vous maintenant avec votre mot de passe pour accéder à la plateforme.',
      securityNotice: 'Votre mot de passe est protégé par un hachage SHA-256 sur votre terminal.',
      errNameShort: 'Le nom doit contenir au moins 2 caractères.',
      errEmailInvalid: 'Veuillez saisir une adresse email valide.',
      errPasswordShort: 'Le mot de passe doit comporter au moins 6 caractères.',
      errEmailExists: 'Un compte existe déjà avec cet email. Connectez-vous plutôt.',
      errNoAccount: 'Aucun compte ne correspond à cet email.',
      errWrongPassword: 'Mot de passe incorrect.',
      errUserNotFound: 'Utilisateur introuvable.',
      errFillAll: 'Veuillez remplir tous les champs.',
      errPasswordMismatch: 'Les deux mots de passe ne correspondent pas.',
      errLoginGeneric: 'La connexion a échoué. Réessayez.',
      errRegisterGeneric: 'La création du compte a échoué. Réessayez.',
    },
    footer: {
      projectTitle: 'Projet',
      projectText: 'Projet indépendant présenté au Meta Global AI Developer Hackathon 2026.',
      projectLink: 'À propos de JYNTRA AI',
      rights: 'Tous droits réservés. Données réelles & stockage local dans votre navigateur.',
      compactRights: 'Stockage local dans votre navigateur • Données de marché réelles',
      realDataLabel: 'Données Réelles Marché & Taux Officiels Forex',
      pedagogyTitle: 'Pédagogie & Sérénité Financière',
      pedagogyText: 'JYNTRA AI a été conçu pour vous apporter clarté, sérénité et maîtrise dans l’analyse des marchés. En combinant la puissance de l’intelligence artificielle et une gestion rigoureuse du risque, notre plateforme vous accompagne pas à pas pour développer votre propre avantage stratégique à votre rythme.',
    },
    extra: {
      secureSession: 'Session locale • Données stockées dans votre navigateur', archivedCount: 'archivée(s)', modelLabel: 'Modèle', openLink: 'Ouvrir →',
      strategy: 'Stratégie', testedAsset: 'Actif Testé', initialCapital: 'Capital Initial ($)', finalBalance: 'Solde Final', expectancyPerTrade: 'Espérance / Trade', totalExecutions: 'Total Exécutions', grossProfitLoss: 'Gross profit / loss', worstDrawdown: 'Pire recul relatif', avgMathGain: 'Gain moyen mathématique', tradesLog: 'Journal des Trades de la Simulation', exitReason: 'Raison de Sortie', tpHit: 'Take Profit atteint', slHit: 'Stop Loss déclenché', inverseSignal: 'Signal inverse', directionCol: 'Direction', entryCol: 'Entrée ($)', exitCol: 'Sortie ($)',
      longLabel: 'LONG (Achat)', shortLabel: 'SHORT (Vente)', assetLabel: 'Actif Financier', riskMoney: 'RISQUE EN $', expectedGain: 'GAIN ATTENDU EN $', tradeValue: 'VALEUR DU TRADE', distSL: 'DISTANCE AU SL', distTP: 'DISTANCE AU TP', unitsOfAsset: 'unités d’actif',
      executiveSynthesis: 'Synthèse Exécutive :', disagreements: 'Désaccords notés :', adverseHypothesis: 'Hypothèse adverse :', dailyLabel: 'Journalier', assetShort: 'Actif :',
      recordedPositions: 'Positions Enregistrées', closedPositionsLabel: 'Positions Clôturées', netRealisedPnl: 'P&L Net Réalisé', journalSearchPlaceholder: 'Rechercher par actif, tag ou note...', noTradeMatch: 'Aucun trade ne correspond à vos critères.', buyLabel: 'BUY (Achat)', sellLabel: 'SELL (Vente)', entryPriceLabel: 'Prix Entrée ($)', exitPriceLabel: 'Prix Sortie ($)', sizeLabel: 'Taille (unités)', statusOpen: 'OPEN (En cours)', statusClosed: 'CLOSED (Clôturé)', notesPsychology: 'Notes & Psychologie', notesPlaceholder: 'Raison d’entrée, émotions ressenties, respect du plan...', tagsLabel: 'Tags (séparés par virgule)', tagsPlaceholder: 'ex: SMC, FVG, London-Open', exitPricePlaceholder: 'Si clôturé...',
      saveOnDevice: 'Sauvegarder sur votre Appareil',
      academyBadge: 'ACADÉMIE OFFICIELLE DU TRADING & SMC', academySchool: "L'École de Trading JYNTRA AI", academySubtitle: "Des fondamentaux des marchés jusqu'aux algorithmes institutionnels Smart Money Concepts. Apprenez avec rigueur, testez vos compétences et maîtrisez la gestion mathématique du risque.", globalProgress: 'Progression Globale', validatedOf: 'modules validés', curriculum: 'PARCOURS PÉDAGOGIQUE', structuredModules: 'Modules Structurés', learningSuffix: "d'apprentissage", diagramTitle: 'SCHÉMA TECHNIQUE PÉDAGOGIQUE RÉEL', bullishCandle: 'Bougie Haussière (Bullish)', bearishCandle: 'Bougie Baissière (Bearish)', recommendedVideo: 'Vidéo de Formation Recommandée :', watchCourse: 'Visionner le cours', trapTitle: 'Piège Fréquent à Éviter :', quizTitle: 'QUIZ DE VALIDATION DES ACQUIS DU MODULE', validated: 'Validé', correctAnswer: 'Excellente réponse ! Module validé avec succès.', wrongAnswer: "Réponse inexacte. Examinez l'explication :", moduleWord: 'MODULE',
      workflowRun: 'Exécuter le Flux Complet', workflowRunning: 'Transmission des données le long des câbles...', workflowNodesTitle: 'TOPOLOGIE DES NOEUDS DE DONNÉES EN SÉRIE', dataTransmitted: 'Données Transmises', inputPort: "Port d'entrée de données", outputPort: 'Port de sortie de données', statusColon: 'Statut :', calculating: 'Calcul...', outgoingSummary: 'Résumé du flux sortant :', outgoingJson: 'Données JSON transmises au câble sortant :', workflowHint: 'Cliquez sur « Exécuter le Flux Complet » pour voir les impulsions de données circuler le long des fils.', workflowSubtitleLong: 'Observez la circulation réelle des flux de données entre les noeuds via des liaisons actives.',
      newsBadge: "Flux d'Actualités & Données Fondamentales", newsTitle: 'Actualités Financières Vérifiées', newsSubtitle: "Titres issus de flux RSS financiers publics (marchés, économie, entreprises, devises, crypto, banques centrales), horodatés et liés à leur source d’origine. Aucun article n’est généré par IA.", newsLoading: "Chargement du fil d'actualités vérifié...", newsEmpty: 'Aucun article pour cette catégorie.', factsTitle: 'Résumé publié par la source', interpretationTitle2: '2. Interprétation Algorithmique IA', readSource: 'Lire la source', newsUnavailable: "Le flux d'actualités public est momentanément indisponible. Aucun contenu n'est inventé pour combler ce vide.", newsRefresh: 'Rafraîchir', newsUpdatedAt: 'Mis à jour', newsErrorTitle: 'Fil d’actualités momentanément indisponible', newsErrorBody: 'Les sources publiques n’ont pas répondu. Aucun article n’est inventé pour combler ce vide : réessayez dans quelques instants.', newsRetry: 'Réessayer', newsReadArticle: 'Lire l’article', newsDateUnknown: 'Date non communiquée', newsNoImage: 'Image non fournie par la source', newsCategoryMarkets: 'Marchés', newsCategoryEconomy: 'Économie', newsCategoryCompanies: 'Entreprises', newsCategoryForex: 'Devises', newsCategoryCrypto: 'Crypto', newsCategoryCentralBanks: 'Banques centrales', newsCountLabel: 'articles', newsStaleNotice: 'Connexion aux sources interrompue : les derniers articles reçus restent affichés.', newsAutoRefreshNote: 'Mise à jour automatique toutes les 5 minutes',
      accountCreated: 'Compte créé avec succès !', securityStrong: 'Sécurité :',
      sendToAiVision: "Envoyer à l'IA Vision", bullishLegend: 'Bougie Haussière', bearishLegend: 'Bougie Baissière', timestampWord: 'Horodatage', refreshQuotesTitle: 'Rafraîchir les cotations',
      verifiedSourceLine: 'Source vérifiée : Flux de marché certifié & Taux de référence officiels', noSyntheticQuote: 'Zéro cotation synthétique', interactiveCandlesLabel: 'Chandeliers interactifs réels',
      liveCore: 'MARKETVERSE', companionLabel: 'LYNARA VIRTUAL COMPANION', voiceSubLabel: 'Synthèse vocale multilingue & analyse en temps réel', chartTestBtn: "Tester l'analyse d'un graphique", decisionChainTitle2: 'CHAÎNE DE DÉCISION DE BOUT EN BOUT :', endToEndChain: 'CHAÎNE DE DÉCISION DE BOUT EN BOUT :',
      settingsTitleLong: 'Paramètres du Compte & Registre Modèles', settingsSubtitleLong: 'Gérez votre profil et configurez votre environnement.', profileTab: 'Profil Utilisateur & Contact', modelsTab: 'Registre des Modèles IA', metaConsoleTab: "Console d'Appel Direct JYNTRA", secureBackupTab: 'Sauvegarde des Données', phoneLabel2: 'Numéro de Téléphone (Optionnel)', phonePlaceholder: '+261 34 00 000 00', phonePrivacy: "Ce numéro reste stocké dans votre navigateur et n'est jamais envoyé à un tiers.", favouriteAsset: 'Actif Favori par Défaut', savedOk: 'Paramètres enregistrés dans votre navigateur.', inputsLabel: 'Entrées :', methodLabel: "Méthode d'appel :", activeOperational: 'ACTIF & OPÉRATIONNEL', awaitingKey: 'EN COURS DE CONFIGURATION', metaConsoleTitle: "Console d'Appel Réel des Modèles JYNTRA", metaActiveKey: 'Service actif', metaMissingKey: 'Service en cours de configuration', metaConsoleDesc: 'Cette console lance un traitement réel et sécurisé côté serveur.', metaTargetModel: 'Moteur JYNTRA cible', metaPromptLabel: 'Instruction ou demande financière', metaCalling: 'Traitement en cours…', metaCallBtn: 'Lancer le traitement', metaAddKey: 'Le service est en cours de configuration. Veuillez réessayer ultérieurement.', metaRealReply: 'Réponse obtenue', modelCalled: 'Moteur utilisé', backupTitle: 'Sauvegarde des données sur votre appareil', backupDesc: 'Vos données sont conservées dans votre navigateur sur votre appareil. Vous pouvez les exporter ou les réinitialiser à tout moment.', exportData: 'Exporter mes données (JSON)', resetLocalBase: 'Réinitialiser les données', resetConfirm: 'Cette action supprimera vos données locales (analyses, journal, session). Continuer ?', noFalsePromise: 'JYNTRA AI affiche uniquement des résultats réels et vérifiables.',
      featuresTitle: 'Fonctionnalités Clés de JYNTRA AI', featuresSubtitle: 'Une architecture conçue pour les traders exigeants, combinant vision par ordinateur et modèles multimodaux.', techPageTitle: 'Technologies & Architecture IA', techPageSubtitle: "JYNTRA AI respecte une transparence absolue sur les modèles et l'infrastructure déployée.", aboutTitle: 'À propos de JYNTRA AI', engineeringLabel: 'Ingénierie & Conception :', locationLabel: 'Localisation : Madagascar 🇲🇬', testPlatformBtn: 'Tester la plateforme en conditions réelles', lynaraPreviewTitle: 'Présentation de LYNARA', lynaraPreviewSubtitle: 'Connectez-vous pour dialoguer vocalement avec LYNARA, votre compagne holographique stylisée.', accessLynaraBtn: 'Accéder à LYNARA',
      stepImport: 'Importer', stepAnalyse: 'Analyser', stepVerify: 'Vérifier', stepCompare: 'Comparer', stepEvaluate: 'Évaluer', stepReport: 'Rapport', stepImportDesc: 'Capture MT4/MT5 ou flux direct', stepAnalyseDesc: 'Vision multimodale et structures', stepVerifyDesc: 'Cotations et carnet Marché', stepCompareDesc: 'Délibération multi-agents', stepEvaluateDesc: 'Calcul mathématique du risque', stepReportDesc: 'Synthèse exécutive et vocale',
      chainStep1: 'Graphique MT4/MT5 importé', chainStep2: 'Vision IA : détection des structures SMC (BOS, CHoCH, FVG)', chainStep3: 'Confrontation collégiale entre 6 agents spécialisés', chainStep4: 'Filtrage par le Risk Manager (invalidation si R:R < 1.5)', chainStep5: 'Verdict univoque : BUY, SELL ou NO TRADE',
    },
  },

  // =========================================================================
  // ENGLISH (GB)
  // =========================================================================
  en: {
    slogan: 'Your AI. Your Edge.',
    tagline: 'Intelligent financial analytics web platform combining multimodal chart vision and multi-agent consensus for disciplined trading decisions.',
    nav: {
      home: 'Home',
      features: 'Features',
      tech: 'Technology / AI',
      lynaraPreview: 'LYNARA',
      about: 'About',
      workspace: 'Workspace',
      chartAnalysis: 'Chart Vision',
      lynara3d: 'LYNARA',
      multiAgents: 'Multi-Agents',
      markets: 'Markets',
      risk: 'Risk',
      backtest: 'Backtest',
      journal: 'Journal',
      news: 'News',
      workflow: 'Workflow Studio',
      jyntrack: 'JYNTRACK',
      academy: 'Academy',
      settings: 'Settings',
      login: 'Sign In',
      register: 'Sign Up',
      logout: 'Log Out',
      lightMode: 'Switch to Light Mode',
      darkMode: 'Switch to Dark Mode',
      groupDiscover: 'Discover',
      groupAnalysis: 'Analysis',
      groupMarkets: 'Markets',
      groupTrading: 'Trading',
    },
    common: {
      unavailable: 'Unavailable',
      gold: 'Gold',
      loading: 'Loading...',
      save: 'Save',
      saved: 'Saved successfully!',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      confirm: 'Confirm',
      refresh: 'Refresh',
      search: 'Search...',
      filter: 'Filter',
      all: 'All',
      crypto: 'Crypto',
      forex: 'Forex & Currencies',
      commodities: 'Commodities / Gold',
      indices: 'Indices',
      symbol: 'Asset',
      price: 'Live Price',
      change24h: '24h Change',
      volume24h: '24h Volume',
      high24h: '24h High',
      low24h: '24h Low',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      realTime: 'Authentic Real-Time',
      verifiedData: 'Verified market feeds',
      protectedData: 'Protected data on your device',
      success: 'Operation succeeded',
      error: 'An error occurred',
      timeframe: 'Timeframe',
      disclaimer: 'Disclaimer: Market analyses provide cognitive assistance and do not constitute financial advice. Always practice strict risk control.',
    },
    home: {
      badge: 'NEXT-GENERATION INTELLIGENT TRADING',
      heroTitle: 'JYNTRA AI',
      heroSubtitle: 'Next-generation financial intelligence: multimodal MT4/MT5 chart analysis, consensus of 6 specialized agents, real market data, probabilistic analysis and the holographic assistant LYNARA. A platform for market analysis and decision-making.',
      startFree: 'Start Free',
      explore: 'Explore JYNTRA AI',
      noFakeData: 'Real live market data',
      protectedStorage: 'Protected data on your terminal',
      lynaraVoice: 'LYNARA Voice Assistant',
      liveTicker: 'REAL CERTIFIÉES LIVE QUOTES:',
      liveTickerLoading: 'Connecting to live market feeds...',
      algoAdvantageBadge: 'ALGORITHMIC ADVANTAGE',
      algoAdvantageTitle: 'Why Choose JYNTRA AI For Your Trading?',
      algoAdvantageSubtitle: 'Conventional platforms settle for passive charts or black-box bots. JYNTRA AI pairs computer vision, multimodal reasoning, and strict risk containment.',
      featureVisionTitle: 'MT4 & MT5 Multimodal Vision',
      featureVisionDesc: 'Upload chart screenshots directly. Our AI identifies Order Blocks, FVGs, BOS, CHoCH, and liquidity without human bias.',
      featureAgentsTitle: '6 Multi-Agents Consensus',
      featureAgentsDesc: 'Technical, Macro, Risk, Strategy, Red-Team, and Lead Analyst debate dialectically before shaping trade plans.',
      featureRiskTitle: 'Risk Management & Sizing',
      featureRiskDesc: 'Mathematical position sizing on real capital: strict Stop-Loss, mandatory R:R >= 1.5, zero risk of ruin.',
      featureLynaraTitle: 'LYNARA — Multilingual holographic assistant',
      featureLynaraDesc: 'An interactive holographic woman who listens through your mic, analyzes charts, and speaks responses aloud.',
      featureBacktestTitle: 'Simulation & Backtesting',
      featureBacktestDesc: 'Evaluate your strategies without lookahead bias. Key metrics computed on real candles: Win Rate, Profit Factor, Drawdown.',
      featurePrivacyTitle: 'Private & Decentralized Design',
      featurePrivacyDesc: 'Your journals, strategies and analyses are stored in your browser. Only the requests you launch are sent to the AI service.',
      academyNewsBadge: 'GO FURTHER',
      academyNewsTitle: 'Learn and stay informed',
      academyNewsSubtitle: 'Two complementary spaces that enrich your reading of the markets, beyond technical analysis.',
      academyCardBadge: 'INTERACTIVE ACADEMY',
      academyCardTitle: 'Learn to read markets, step by step',
      academyCardDesc: 'Structured modules, educational diagrams and quizzes to strengthen your foundations and deepen the concepts used in your analyses.',
      academyCardCta: 'Explore the Academy',
      newsCardBadge: 'FINANCIAL NEWS',
      newsCardTitle: 'Keep market context in real time',
      newsCardDesc: 'A feed dedicated to markets, the economy and companies: recent headlines, identified sources, publication dates and images when available.',
      newsCardCta: 'View the news',
      lynaraBadge: 'HOLOGRAPHIC AI ASSISTANT',
      lynaraTitle: 'A female holographic presence that listens, responds and guides you',
      lynaraSubtitle: 'LYNARA is the female holographic representation of JYNTRA AI: a translucent, luminous adult figure, with breathing, gaze, gestures and voice lip synchronisation. She connects market analysis, risk and education in a single conversation.',
      lynaraPoint1Title: 'Female holographic presence:',
      lynaraPoint1Desc: 'A translucent, luminous adult silhouette driven by a dedicated shader: breathing, blinking, gaze and subtle gestures depending on whether she is listening, thinking or speaking.',
      lynaraPoint2Title: 'Real text and voice:',
      lynaraPoint2Desc: 'Type or speak into the microphone when the browser allows it. The answer is transcribed then read by an available voice; languages without a voice are honestly flagged.',
      lynaraPoint3Title: 'Multilingual through the model:',
      lynaraPoint3Desc: 'She detects the language of your message and replies in it, including when several languages are mixed, while keeping the thread of the conversation.',
      lynaraBtn: 'Interact with LYNARA',
      lynaraRoleTitle: 'Her role in JYNTRA AI',
      lynaraRoleDesc: 'LYNARA connects the modules: she explains a chart analysis, reformulates the multi-agent committee reasoning, reminds you of risk rules and supports your progress in the Academy. She never places an order and never replaces your judgement.',
      lynaraInteractionTitle: 'Text or voice, within real browser limits',
      lynaraInteractionDesc: 'Written chat works everywhere. Listening and spoken playback depend on the browser: LYNARA clearly states when a language or voice is unavailable instead of faking an accent.',
      lynaraMetaTitle: 'Understanding powered by Meta models',
      lynaraMetaDesc: 'LYNARA understands your messages and charts through Meta models, and answers you in your own language.',
      lynaraHonesty: 'LYNARA is a holographic interface: a virtual representation, not a real person.',
      lynaraHonestyNote: 'LYNARA is a holographic interface: a virtual representation, not a real person. Speech is synthesised by the browser in the detected language; voice quality and availability depend on the device, and no accent is simulated.',
      decisionChainBadge: 'MULTIMODAL & CONTRADICTORY AUDIT',
      decisionChainTitle: 'From Visual Observation to Collegiate Verdict',
      decisionChainSubtitle: 'Disciplined technical analysis never relies on one single voice. JYNTRA AI decouples factual observation, algorithmic interpretation, and probabilistic scenarios.',
      workflowTitle: 'JYNTRA AI Operational Workflow',
      workflowSubtitle: 'A transparent visual pipeline where each module executes dedicated logic with verified data validation.',
      ctaTitle: 'Ready to transform your trading approach?',
      ctaSubtitle: 'Create your profile today. No credit card required, data kept in your browser.',
      ctaBtn: 'Create JYNTRA AI Account',
      alreadyAccount: 'I already have an account',
    },
    workspace: {
      badge: 'Active Session • Secure Private Data',
      welcome: 'Welcome',
      subtitle: 'Your algorithmic analysis workspace is synchronized with real market feeds.',
      newAnalysisBtn: 'New MT4/MT5 Analysis',
      consultLynaraBtn: 'Consult LYNARA',
      metricAnalyses: 'AI Analyses Conducted',
      metricAnalysesSub: 'Saved on your profile',
      metricTrades: 'Journaled Trades',
      metricTradesSub: 'closed positions',
      metricWinRate: 'Success Rate (Win Rate)',
      metricWinRateSub: 'Computed from real trades',
      metricPnL: 'Total Journal P&L',
      metricPnLSub: 'Paper or live capital',
      chartTitle: 'Live Market Chart & Feeds',
      chartSubtitle: 'Dynamic candlestick with technical indicators (EMA 21, support, resistance). Capture and send directly to multimodal AI.',
      chartDeepAnalysisBtn: 'Deep Analysis Mode',
      quickModulesTitle: 'Specialized JYNTRA AI Modules',
      recentAnalysesTitle: 'Recent Saved Analyses',
      recentAnalysesEmpty: 'No analyses saved on your profile yet.',
      createFirstAnalysis: 'Create your first MT4/MT5 analysis',
    },
    chart: {
      badge: 'Multimodal Vision Engine',
      title: 'MT4 / MT5 Chart Analysis',
      subtitle: 'Strictly distinguishes: Factual visual observation, AI algorithmic interpretation, and conditional hypotheses.',
      saveToJournal: 'Save to Trading Journal',
      savedToJournal: 'Saved to Journal!',
      explainWithLynara: 'Explain with LYNARA',
      tabLive: 'Live Market Feed',
      tabUpload: 'Upload MT4 / MT5 / TradingView Screenshot',
      dropzoneTitle: 'Drop your chart screenshot here',
      dropzoneSubtitle: 'or click to browse local files (PNG, JPG)',
      changeImage: 'Change Image',
      paramsTitle: 'Multimodal Analysis Parameters',
      instrumentLabel: 'Instrument / Symbol',
      timeframeLabel: 'Declared Timeframe',
      customPromptLabel: 'Specific Context or Instruction (optional)',
      customPromptPlaceholder: 'e.g. Verify if previous H1 Order Block was swept for buy-side liquidity...',
      analyzeBtn: 'Launch Full Algorithmic Analysis',
      analyzingBtn: 'Multimodal Analysis in progress (JYNTRA Vision)...',
      waitingTitle: 'Awaiting Analysis',
      waitingDesc: 'Upload a chart capture or use the live feed, then click "Launch Full Algorithmic Analysis".',
      auditCriteria: 'JYNTRA AI Audit Grid:',
      crit1: 'SMC Structure Detection (BOS, CHoCH)',
      crit2: 'Order Blocks & FVG Mapping',
      crit3: 'Buy/Sell Side Liquidity Pools',
      crit4: 'Conditional Trade Plan & R:R Ratio',
      recommendationLabel: 'STRATEGIC RECOMMENDATION',
      aiEngineLabel: 'AI Engine',
      tradePlanTitle: 'Algorithmic Trade Plan',
      entryLabel: 'ENTRY',
      stopLossLabel: 'STOP-LOSS',
      takeProfitLabel: 'TAKE-PROFIT 1',
      riskRewardLabel: 'R:R RATIO',
      invalidationTitle: 'Strict Invalidation Condition:',
      visualObservationsTitle: '1. Factual Visual Observations',
      trendLabel: 'Detected Trend',
      smcLabel: 'SMC Structures',
      orderBlocksLabel: 'Order Blocks (OB):',
      liquidityLabel: 'Liquidity Pools:',
      interpretationTitle: '2. AI Algorithmic Interpretation',
      hypothesesTitle: '3. Conditional Hypotheses (Non-Certainties)',
      riskDisclaimer: 'Warning: Strict risk discipline advised: never expose more than 1% to 2% of capital on any single setup.', liveFeedHint: 'Use the chart send button to analyse exactly the displayed view.',
      engineName: 'JYNTRA Engine',
      atMarket: 'At market',
      yesLabel: 'Yes',
      noLabel: 'No',
      neutralLabel: 'Neutral',
      providerLabel: 'Actual provider:',
      completenessLabel: 'Chart completeness:',
      sufficientLabel: 'Sufficient',
      incompleteLabel: 'Incomplete',
      missingLabel: 'Missing:',
      realDataUsedLabel: 'Real data used:',
      viewWorkflow: 'View the workflow for this analysis',
      annotatedImageTitle: 'Final annotated image',
      annotatedNote: 'Only the levels and structures actually returned by the analysis are displayed. No invented level.',
      takeProfit2Label: 'TAKE-PROFIT 2',
      takeProfit3Label: 'TAKE-PROFIT 3',
      yesTradeLabel: 'YES TRADE',
      noTradeLabel: 'NO TRADE',
      confidenceLabel: 'Confidence',
      confirmationsLabel: 'Confirmations',
      marketReadingTitle: 'Market reading',
      setupQualityLabel: 'Setup quality',
    },
    lynara: {
      title: 'LYNARA',
      subtitle: 'Virtual Holographic Woman',
      roleDesc: 'Real-time financial companion • Lifelike multilingual speech',
      listening: 'LYNARA is listening to you...',
      thinking: 'LYNARA is synthesizing market data...',
      speaking: 'LYNARA is speaking...',
      idle: 'Active Standby',
      onlineStatus: 'LYNARA Online',
      voiceActive: 'Natural Speech',
      micTooltipStart: 'Speak into microphone',
      micTooltipStop: 'Stop microphone listening',
      voiceLangLabel: "LYNARA's Language",
      inputPlaceholder: 'Ask LYNARA anything about market structure or risk...',
      sendBtn: 'Send',
      repeatAudio: 'Repeat aloud',
      muteBtn: 'Mute Voice',
      unmuteBtn: 'Unmute Voice',
      disclaimer: 'LYNARA is a decision-support copilot. Always check your risk parameters before entering trades.',
      sampleSMC: 'Order Block Explanation',
      sampleSizing: 'Position Size Calculation',
      sampleSL: 'Stop-Loss Placement Audit',
      sampleMG: 'Teny Malagasy',
      greeting: 'Hello {name}. I am LYNARA, your holographic financial assistant. I can review your MT4/MT5 charts, check your risk ratios or explain market structure. Speak to me or type freely.',
      thinkingBubble: 'LYNARA is thinking and preparing her spoken reply...',
      suggestions: 'SUGGESTIONS:',
      notConfigured: 'LYNARA is temporarily unavailable. Please try again in a few moments.',
      connectionError: 'Could not reach the AI model. Check the server configuration and try again.',
      liveTranscript: 'LIVE TRANSCRIPT:',
      contextLoaded: 'Active context loaded',
      voiceLabel: 'Voice',
      replyLanguage: 'Reply language',
      ttsFallbackNote: 'No Malagasy voice is installed in this browser: the Malagasy reply is shown as text and, if spoken playback is enabled, it is read with a French voice.',
      sttUnsupportedNote: 'Speech recognition is not available in this browser. The text chat remains fully functional.',
    },
    agents: {
      badge: 'Collegiate Arbitration',
      title: 'JYNTRA AI Multi-Agent Consensus',
      subtitle: '6 specialized elite agents with contrasting viewpoints audit the market prior to trade execution.',
      debateTab: 'Contradictory Deliberation',
      consensusTab: 'Lead Analyst Synthesis',
      launchDebateBtn: 'Launch Multi-Agent Deliberation',
      launchingDebate: 'Dialectical debate in progress...',
      consensusVerdict: 'COLLEGIATE VERDICT',
      confidenceScore: 'Confidence Score',
      metaEngineNotice: 'JYNTRA Red-Team Model successfully engaged.',
      roleTechnical: 'Price Action & Smart Money Concepts',
      roleMacro: 'Macroeconomics & Institutional Flows',
      roleRisk: 'Capital Preservation & Invalidation',
      roleStrategy: 'Mathematical Expectancy & Edge',
      roleRedTeam: "Devil's Advocate & False Signals",
      roleLead: 'Chief Arbitrator & Final Decision',
      descTechnical: 'Tracks Order Blocks, Fair Value Gaps, buy/sell-side liquidity and BOS structure breaks.',
      descMacro: 'Assesses refinancing rates, ETF flows, DXY correlations and the economic calendar.',
      descRisk: 'Issues a strict veto on setups with R:R < 1.5 or an arbitrary Stop-Loss.',
      descStrategy: 'Computes the statistical probability of success under the current volatility regime.',
      descRedTeam: 'Hunts bull traps, false breakouts and manipulative liquidity sweeps.',
      descLead: 'Weighs every contradictory argument and delivers the final unified recommendation.',
      timeframeLabel: 'Timeframe',
      statusLabel: 'Status',
      statusReady: 'Report validated',
      statusStandby: 'Active standby',
      contextPlaceholder: 'Optional context (e.g. FOMC announcement tonight, range breakout)...',
      missingAnalysis: 'Please run a chart analysis first before using this feature.',
      goToChart: 'Go to chart analysis',
    },
    markets: {
      badge: 'Live Market Quotes',
      title: 'Financial Markets & Order Books',
      subtitle: '100% authentic live spot market data from a certified market feed and official Forex reference rates. Zero fictitious quotes.',
      refreshBtn: 'Refresh Quotes',
      searchPlaceholder: 'Search instrument (BTC, EUR, XAU, SOL...)...',
      spotLabel: 'Spot',
      interactiveCandles: 'Interactive Candlesticks',
      analyzeWithJyntra: 'Analyze with JYNTRA AI',
      candlesLabel: 'Real interactive candlesticks',
      sourceVerified: 'Verified source: certified market feed & official reference rates',
      zeroSynthetic: 'Zero synthetic quotes',
    },
    risk: {
      badge: 'Capital Preservation',
      title: 'Exact Risk & Position Sizing Calculator',
      subtitle: 'Mathematically calculate exact lot size so maximum monetary loss matches your strict threshold (1% or 2%).',
      capitalLabel: 'Total Portfolio Capital ($)',
      riskPercentLabel: 'Max Risk Tolerance (%)',
      entryPriceLabel: 'Planned Entry Price ($)',
      stopLossPriceLabel: 'Strict Stop-Loss Price ($)',
      takeProfitPriceLabel: 'Target Take-Profit Price ($)',
      calculateBtn: 'Calculate Mathematical Sizing',
      positionSizeResult: 'Recommended Position Size',
      monetaryRiskResult: 'Maximum Dollar Loss ($)',
      riskRewardResult: 'Risk / Reward Ratio',
      ruinProbability: 'Mathematical Probability of Ruin',
      parametersTitle: 'Capital & Order Parameters',
      ofCapital: 'of capital',
      ofAccount: 'of account',
      assetUnits: 'asset units',
      formulaTitle: 'JYNTRA AI Mathematical Formula',
      formulaBody: 'Size = (Capital × Risk %) / |Entry Price − Stop-Loss|',
      formulaNote: 'This formula guarantees that if the Stop-Loss is triggered, the maximum loss equals the defined risk amount ({amount}), whatever the leverage used.',
      warnCapital: 'Account capital must be greater than zero.',
      warnPrices: 'Entry, Stop-Loss and Take-Profit prices must be strictly positive.',
      warnLongSL: 'For a long position, the Stop-Loss must be below the entry price.',
      warnLongTP: 'For a long position, the Take-Profit must be above the entry price.',
      warnShortSL: 'For a short position, the Stop-Loss must be above the entry price.',
      warnShortTP: 'For a short position, the Take-Profit must be below the entry price.',
      warnHighRisk: 'Warning: risk above 3% of capital on a single trade. Prudent management recommends 2% maximum.',
      warnLowRR: 'R:R ratio below 1.5. A favourable mathematical expectancy ideally requires R:R ≥ 2.0.',
      journalNote: 'Position sized with a risk of {amount} ({percent}%), R:R = {rr}.',
      sourceLabel: 'Risk Calculator',
    },
    backtest: {
      badge: 'Unbiased Historical Validation',
      title: 'Simulation & Backtesting Engine',
      subtitle: 'Stress-test trading strategies against authentic historical candles with zero lookahead bias.',
      runBacktestBtn: 'Execute Backtest',
      runningBacktest: 'Simulating historical trades...',
      parametersTitle: 'Test Parameters',
      metricsTitle: 'Performance Metrics',
      winRate: 'Win Rate',
      profitFactor: 'Profit Factor',
      maxDrawdown: 'Max Drawdown',
      totalTrades: 'Total Trades Executed',
      equityCurveTitle: 'Account Equity Curve',
      strategyEma: 'EMA Cross 9/21 (Trend)',
      strategyRsi: 'RSI 14 Mean Reversion',
      strategyBreakout: 'Range Breakout 10 bars',
      tf15m: '15 Minutes',
      tf1h: '1 Hour',
      tf4h: '4 Hours',
      tf1d: '1 Day',
    },
    journal: {
      badge: 'Trading Log & Discipline',
      title: 'Personal Trading Journal',
      subtitle: 'Log your positions with screenshots, psychological state, rules checked, and financial performance.',
      newTradeBtn: 'Log Trade',
      openTradesTab: 'Open Positions',
      closedTradesTab: 'Closed Positions',
      emptyJournal: 'No trades logged yet.',
      addTitle: 'Add a position to the Journal',
      editTitle: 'Edit the position',
      cancelledStatus: 'CANCELLED',
      noNote: 'No note',
      savedAnalyses: 'Saved analyses',
      noSavedAnalyses: 'No saved analysis yet. From Chart Analysis, click “Save to journal”.',
      deleteConfirm: 'Permanently delete this journal entry?',
    },
    workflow: {
      badge: 'Visual Operational Pipeline',
      title: 'JYNTRA AI Workflow Studio',
      subtitle: 'Visually configure and execute your full pipeline: Data → Vision AI → Multi-Agents → Risk → Report.',
      executeWorkflowBtn: 'Run Pipeline',
      pipelineStatus: 'Workflow Status',
    },
    academy: {
      badge: 'Strategic Training',
      title: 'Smart Trading Academy',
      subtitle: 'Master Smart Money Concepts (SMC), institutional price action, and professional risk psychology.',
      module1: 'Market Fundamentals & Liquidity Dynamics',
      module2: 'Smart Money Concepts & BOS/CHoCH Structures',
      module3: 'Mathematical Risk Governance & Mindset',
    },
    settings: {
      badge: 'Personal Configuration',
      title: 'Account Settings & Preferences',
      subtitle: 'Manage your profile, preferred languages, and display configuration.',
      profileTitle: 'User Profile',
      nameLabel: 'Full Name or Alias',
      emailLabel: 'Email Address',
      languageTitle: 'Platform Language',
      themeTitle: 'Visual Theme (Day / Night)',
      privacyTitle: 'Privacy & Security',
      privacyDesc: 'Your data and histories are encrypted and stored directly on your device. No private information is shared without your consent.',
      saveSettingsBtn: 'Save Preferences',
    },
    auth: {
      loginTitle: 'Sign In to JYNTRA AI',
      loginSubtitle: 'Access your financial intelligence workspace and LYNARA',
      loginBtn: 'Sign In to my Account',
      noAccount: 'Don’t have an account yet?',
      createAccountLink: 'Create a secure account',
      registerTitle: 'Create JYNTRA AI Account',
      registerSubtitle: 'Initialize your secure profile on your device',
      registerBtn: 'Create Account',
      hasAccount: 'Already have an account?',
      loginLink: 'Sign In',
      fullNameLabel: 'Full Name or Alias',
      emailLabel: 'Email Address',
      passwordLabel: 'Password (min. 6 chars)',
      confirmPasswordLabel: 'Confirm Password',
      successRegister: 'Your account has been initialized! Please sign in with your password to access the platform.',
      securityNotice: 'Your password is protected by SHA-256 hashing on your device.',
      errNameShort: 'The name must contain at least 2 characters.',
      errEmailInvalid: 'Please enter a valid email address.',
      errPasswordShort: 'The password must contain at least 6 characters.',
      errEmailExists: 'An account already exists with this email. Please sign in instead.',
      errNoAccount: 'No account matches this email.',
      errWrongPassword: 'Incorrect password.',
      errUserNotFound: 'User not found.',
      errFillAll: 'Please fill in all fields.',
      errPasswordMismatch: 'The two passwords do not match.',
      errLoginGeneric: 'Sign-in failed. Please try again.',
      errRegisterGeneric: 'Account creation failed. Please try again.',
    },
    footer: {
      projectTitle: 'Project',
      projectText: 'Independent project submitted to the Meta Global AI Developer Hackathon 2026.',
      projectLink: 'About JYNTRA AI',
      rights: 'All rights reserved. Real market data & local storage in your browser.',
      compactRights: 'Local storage in your browser • Real market data',
      realDataLabel: 'Real Flux de marché certifié Feeds & Official Forex Rates',
      pedagogyTitle: 'Pedagogy & Financial Serenity',
      pedagogyText: 'JYNTRA AI is designed to bring you clarity, serenity, and mastery in market analysis. By combining the power of artificial intelligence and disciplined risk control, our platform empowers you to build your own edge at your own pace.',
    },
    extra: {
      secureSession: 'Local session • Data stored in your browser', archivedCount: 'archived', modelLabel: 'Model', openLink: 'Open →',
      strategy: 'Strategy', testedAsset: 'Tested Asset', initialCapital: 'Initial Capital ($)', finalBalance: 'Final Balance', expectancyPerTrade: 'Expectancy / Trade', totalExecutions: 'Total Executions', grossProfitLoss: 'Gross profit / loss', worstDrawdown: 'Worst relative pullback', avgMathGain: 'Average mathematical gain', tradesLog: 'Simulation Trade Log', exitReason: 'Exit Reason', tpHit: 'Take Profit hit', slHit: 'Stop Loss triggered', inverseSignal: 'Inverse signal', directionCol: 'Direction', entryCol: 'Entry ($)', exitCol: 'Exit ($)',
      longLabel: 'LONG (Buy)', shortLabel: 'SHORT (Sell)', assetLabel: 'Financial Asset', riskMoney: 'RISK IN $', expectedGain: 'EXPECTED GAIN IN $', tradeValue: 'TRADE VALUE', distSL: 'DISTANCE TO SL', distTP: 'DISTANCE TO TP', unitsOfAsset: 'asset units',
      executiveSynthesis: 'Executive Synthesis:', disagreements: 'Noted disagreements:', adverseHypothesis: 'Adverse hypothesis:', dailyLabel: 'Daily', assetShort: 'Asset:',
      recordedPositions: 'Recorded Positions', closedPositionsLabel: 'Closed Positions', netRealisedPnl: 'Net Realised P&L', journalSearchPlaceholder: 'Search by asset, tag or note...', noTradeMatch: 'No trade matches your criteria.', buyLabel: 'BUY', sellLabel: 'SELL', entryPriceLabel: 'Entry Price ($)', exitPriceLabel: 'Exit Price ($)', sizeLabel: 'Size (units)', statusOpen: 'OPEN', statusClosed: 'CLOSED', notesPsychology: 'Notes & Psychology', notesPlaceholder: 'Entry reason, emotions felt, plan discipline...', tagsLabel: 'Tags (comma separated)', tagsPlaceholder: 'e.g. SMC, FVG, London-Open', exitPricePlaceholder: 'If closed...',
      saveOnDevice: 'Save on Your Device',
      academyBadge: 'OFFICIAL TRADING & SMC ACADEMY', academySchool: 'The JYNTRA AI Trading School', academySubtitle: 'From market fundamentals to institutional Smart Money Concepts algorithms. Learn rigorously, test your skills and master mathematical risk management.', globalProgress: 'Overall Progress', validatedOf: 'modules validated', curriculum: 'LEARNING PATH', structuredModules: 'Structured Modules', learningSuffix: 'of learning', diagramTitle: 'REAL PEDAGOGICAL TECHNICAL DIAGRAM', bullishCandle: 'Bullish Candle', bearishCandle: 'Bearish Candle', recommendedVideo: 'Recommended Training Video:', watchCourse: 'Watch the course', trapTitle: 'Common Trap to Avoid:', quizTitle: 'MODULE KNOWLEDGE VALIDATION QUIZ', validated: 'Validated', correctAnswer: 'Excellent answer! Module validated successfully.', wrongAnswer: 'Incorrect answer. Review the explanation:', moduleWord: 'MODULE',
      workflowRun: 'Run the Full Workflow', workflowRunning: 'Transmitting data along the cables...', workflowNodesTitle: 'SERIES DATA NODE TOPOLOGY', dataTransmitted: 'Data Transmitted', inputPort: 'Data input port', outputPort: 'Data output port', statusColon: 'Status:', calculating: 'Calculating...', outgoingSummary: 'Outgoing flow summary:', outgoingJson: 'JSON data transmitted to the outgoing cable:', workflowHint: 'Click “Run the Full Workflow” to see data pulses flow along the wires.', workflowSubtitleLong: 'Watch real data flows circulate between nodes through active links.',
      newsBadge: 'News Feed & Fundamental Data', newsTitle: 'Verified Financial News', newsSubtitle: 'Headlines from public financial RSS feeds (markets, economy, companies, currencies, crypto, central banks), timestamped and linked to their original source. No article is AI-generated.', newsLoading: 'Loading the verified news feed...', newsEmpty: 'No article for this category.', factsTitle: 'Summary published by the source', interpretationTitle2: '2. AI Algorithmic Interpretation', readSource: 'Read the source', newsUnavailable: 'The public news feed is temporarily unavailable. No content is invented to fill the gap.', newsRefresh: 'Refresh', newsUpdatedAt: 'Updated', newsErrorTitle: 'News feed temporarily unavailable', newsErrorBody: 'The public sources did not respond. No article is invented to fill the gap: please try again shortly.', newsRetry: 'Try again', newsReadArticle: 'Read the article', newsDateUnknown: 'Date not provided', newsNoImage: 'No image provided by the source', newsCategoryMarkets: 'Markets', newsCategoryEconomy: 'Economy', newsCategoryCompanies: 'Companies', newsCategoryForex: 'Currencies', newsCategoryCrypto: 'Crypto', newsCategoryCentralBanks: 'Central banks', newsCountLabel: 'articles', newsStaleNotice: 'Connection to the sources was interrupted: the last articles received remain displayed.', newsAutoRefreshNote: 'Automatic update every 5 minutes',
      accountCreated: 'Account created successfully!', securityStrong: 'Security:',
      sendToAiVision: 'Send to AI Vision', bullishLegend: 'Bullish Candle', bearishLegend: 'Bearish Candle', timestampWord: 'Timestamp', refreshQuotesTitle: 'Refresh quotes',
      verifiedSourceLine: 'Verified source: Flux de marché certifié & Official reference rates', noSyntheticQuote: 'Zero synthetic quotes', interactiveCandlesLabel: 'Real interactive candles',
      liveCore: 'LIVE 3D INTEL CORE', companionLabel: 'LYNARA VIRTUAL COMPANION', voiceSubLabel: 'Multilingual voice synthesis & real-time analysis', chartTestBtn: 'Test chart analysis', decisionChainTitle2: 'END-TO-END DECISION CHAIN:', endToEndChain: 'END-TO-END DECISION CHAIN:',
      settingsTitleLong: 'Account Settings & Model Registry', settingsSubtitleLong: 'Manage your profile and configure your environment.', profileTab: 'User Profile & Contact', modelsTab: 'AI Model Registry', metaConsoleTab: 'Direct JYNTRA Call Console', secureBackupTab: 'Data Backup', phoneLabel2: 'Phone Number (Optional)', phonePlaceholder: '+261 34 00 000 00', phonePrivacy: 'This number stays in your browser and is never sent to a third party.', favouriteAsset: 'Default Favourite Asset', savedOk: 'Settings saved in your browser.', inputsLabel: 'Inputs:', methodLabel: 'Call method:', activeOperational: 'ACTIVE & OPERATIONAL', awaitingKey: 'BEING CONFIGURED', metaConsoleTitle: 'Real JYNTRA Model Call Console', metaActiveKey: 'Service actif', metaMissingKey: 'Service en cours de configuration', metaConsoleDesc: 'This console runs a real, secure server-side treatment.', metaTargetModel: 'Target JYNTRA engine', metaPromptLabel: 'Financial instruction or request', metaCalling: 'Processing…', metaCallBtn: 'Run the treatment', metaAddKey: 'The service is being configured. Please try again later.', metaRealReply: 'Reply received', modelCalled: 'Engine used', backupTitle: 'Data backup on your device', backupDesc: 'Your data is kept in your browser on your device. You can export or reset it at any time.', exportData: 'Export my data (JSON)', resetLocalBase: 'Reset data', resetConfirm: 'This action will delete your local data (analyses, journal, session). Continue?', noFalsePromise: 'JYNTRA AI only shows real, verifiable results.',
      featuresTitle: 'Key Features of JYNTRA AI', featuresSubtitle: 'An architecture designed for demanding traders, combining computer vision and multimodal models.', techPageTitle: 'Technology & AI Architecture', techPageSubtitle: 'JYNTRA AI maintains absolute transparency about the models and infrastructure deployed.', aboutTitle: 'About JYNTRA AI', engineeringLabel: 'Engineering & Design:', locationLabel: 'Location: Madagascar 🇲🇬', testPlatformBtn: 'Test the platform under real conditions', lynaraPreviewTitle: 'Introducing LYNARA', lynaraPreviewSubtitle: 'Log in to talk vocally with LYNARA, your stylised holographic companion.', accessLynaraBtn: 'Access LYNARA',
      stepImport: 'Import', stepAnalyse: 'Analyse', stepVerify: 'Verify', stepCompare: 'Compare', stepEvaluate: 'Evaluate', stepReport: 'Report', stepImportDesc: 'MT4/MT5 capture or live feed', stepAnalyseDesc: 'Multimodal vision and structures', stepVerifyDesc: 'Marché quotes and order book', stepCompareDesc: 'Multi-agent deliberation', stepEvaluateDesc: 'Mathematical risk calculation', stepReportDesc: 'Executive and vocal synthesis',
      chainStep1: 'MT4/MT5 chart imported', chainStep2: 'AI Vision: SMC structure detection (BOS, CHoCH, FVG)', chainStep3: 'Collegiate confrontation between 6 specialised agents', chainStep4: 'Risk Manager filtering (invalidation if R:R < 1.5)', chainStep5: 'Unequivocal verdict: BUY, SELL or NO TRADE',
    },
  },

  // =========================================================================
  // MALAGASY (MG) 🇲🇬
  // =========================================================================
  mg: {
    slogan: 'Your AI. Your Edge.',
    tagline: "Sehatra tranonkala manan-tsaina ho an'ny famakafakana ny tsena ara-bola, fijerena tabilao amin'ny alalan'ny AI ary fanapahan-kevitra voalanjalanja.",
    nav: {
      home: 'Fandraisana',
      features: 'Endri-javatra',
      tech: 'Teknolojia / AI',
      lynaraPreview: 'LYNARA',
      about: 'Momba anay',
      workspace: 'Toeram-piasana',
      chartAnalysis: 'Famakafakana Tabilao',
      lynara3d: 'LYNARA',
      multiAgents: 'Mpandraharaha AI',
      markets: 'Tsena',
      risk: 'Fifehezana Risika',
      backtest: 'Fitsapana Backtest',
      journal: 'Boky Fanamarihana',
      news: 'Vaovao Farany',
      workflow: 'Workflow Studio',
      jyntrack: 'JYNTRACK',
      academy: 'Akademia',
      settings: 'Fikirakirana',
      login: 'Midira',
      register: 'Misoratra anarana',
      logout: 'Hivoaka',
      lightMode: 'Hazava',
      darkMode: 'Maizina',
      groupDiscover: 'Hijery',
      groupAnalysis: 'Fandinihana',
      groupMarkets: 'Tsena',
      groupTrading: 'Varotra',
    },
    common: {
      unavailable: 'Tsy misy',
      gold: 'Volamena',
      loading: 'Eo am-panatanterahana...',
      save: 'Tehirizo',
      saved: 'Voatahiry soa aman-tsara!',
      cancel: 'Aoka ihany',
      delete: 'Fafao',
      edit: 'Ovay',
      confirm: 'Hamafiso',
      refresh: 'Havaozy',
      search: 'Hikaroka...',
      filter: 'Sivana',
      all: 'Rehetra',
      crypto: 'Crypto',
      forex: 'Forex & Vola Vahiny',
      commodities: 'Akora & Volamena',
      indices: 'Fanondroana Tsena',
      symbol: 'Fitaovana',
      price: 'Vidiny Mivantana',
      change24h: 'Fiovana 24h',
      volume24h: 'Habetsahana 24h',
      high24h: 'Avobe 24h',
      low24h: 'Ambany 24h',
      status: 'Toetoetra',
      date: 'Daty',
      actions: 'Asa',
      realTime: 'Tena Misy Mivantana',
      verifiedData: 'Angon-tsena voamarina',
      protectedData: 'Angona voaaro amin’ny fitaovanao',
      success: 'Nahomby ny asa',
      error: 'Nisy olana nitranga',
      timeframe: 'Fotoana Fijerena',
      disclaimer: 'Fampitandremana : Ny famakafakana dia fanampiana ara-tsaina fa tsy toro-hevitra ara-bola mivantana. Fifehezana hentitra ny risika no voalohany.',
    },
    home: {
      badge: 'ANDIAN-TSORATRA VAOVAO AMIN’NY TRADING MANAN-TSAINA',
      heroTitle: 'JYNTRA AI',
      heroSubtitle: "Ny fanjakana finansialova taona: famakafakana multimodal amin'ny graphique MT4/MT5, fanompoam-pirenena ny mpandraharaha AI 6, angona tena misy, famakafakana probabiliste sy LYNARA mpanampy holografika. Sehatra mifanampy famakafakana tsena ary fanapahan-kevitra eo amin'ny tsena.",
      startFree: 'Manomboka Maimaimpoana',
      explore: 'Zahao ny Sehatra JYNTRA AI',
      noFakeData: 'Angon-tsena tena misy avy hatrany',
      protectedStorage: 'Angona voaaro amin’ny fitaovanao',
      lynaraVoice: 'LYNARA Miteny & Mihaino',
      liveTicker: 'VIDIN’NY TSENA MIVANTANA CERTIFIÉES :',
      liveTickerLoading: 'Mifandray amin’ny vidin’ny tsena mivantana...',
      algoAdvantageBadge: 'TOMBONY ALGORITMIKA',
      algoAdvantageTitle: "Nahoana no misafidy an'i JYNTRA AI?",
      algoAdvantageSubtitle: "Ny sehatra mahazatra dia voafetra amin'ny labozia tsy mihetsika. JYNTRA AI kosa mampiasa AI feno sy fifehezana hentitra ny risika.",
      featureVisionTitle: 'Fijerena Tabilao MT4 & MT5',
      featureVisionDesc: 'Ampidiro avy hatrany ny sarin’ny tabilao. Mahita ny Order Blocks, FVG, BOS, CHoCH ary liquidity ny AI tsy misy fitongilanana.',
      featureAgentsTitle: 'Fifanarahan’ny Mpandraharaha 6',
      featureAgentsDesc: 'Mifamaly sy mifampitsikera ny Technical, Macro, Risk, Strategy, Red-Team ary Lead Analyst alohan’ny hanomezana drafitra.',
      featureRiskTitle: 'Fifehezana Risika & Sizing',
      featureRiskDesc: 'Kajy marina ny haben’ny position amin’ny renivola tena misy: Stop-Loss hentitra, R:R >= 1.5, risika hahavery ny rehetra zero.',
      featureLynaraTitle: 'LYNARA — Mpanampy holografika miteny fiteny maro',
      featureLynaraDesc: 'Vehivavy virtoaly holografika 3D mihaino amin’ny micro, mamakafaka tabilao ary mamaly amin’ny feo mazava.',
      featureBacktestTitle: 'Fitsapana Backtest',
      featureBacktestDesc: 'Mitsapa paikady amin’ny labozia taloha marina. Kajy: Win Rate, Profit Factor, Drawdown.',
      featurePrivacyTitle: 'Fiarovana Tanteraka eo an-toerana',
      featurePrivacyDesc: 'Ny diary, paikady ary famakafakana dia tehirizina ao amin’ny navigateur-nao. Ny fangatahana ataonao ihany no alefa amin’ny serivisy IA.',
      academyNewsBadge: 'HANDRESY LAVITRA',
      academyNewsTitle: 'Mianara sy hijanona ho mahalala vaovao',
      academyNewsSubtitle: 'Sehatra roa mifameno hanampiana ny famakiana ny tsena, ankoatra ny famakafakana teknika.',
      academyCardBadge: 'AKADEMIA IFANARAHANA',
      academyCardTitle: 'Mianara mamaky ny tsena, dingana isaky ny dingana',
      academyCardDesc: 'Modules voarindra, sary fampianarana ary quiz hanamafisana ny fototra sy handalinana ny foto-kevitra ampiasaina amin’ny famakafakana.',
      academyCardCta: 'Jereo ny Akademia',
      newsCardBadge: 'VAOVAO ARA-BOLA',
      newsCardTitle: 'Fantaro ny toe-draharahan’ny tsena amin’ny fotoana tena izy',
      newsCardDesc: 'Sarany natokana ho an’ny tsena, toe-karena ary orinasa: lohateny vaovao, loharano fantatra, daty famoahana ary sary raha misy.',
      newsCardCta: 'Jereo ny vaovao',
      lynaraBadge: 'MPANAMPY IA HOLOGRAFIKA',
      lynaraTitle: 'Fisehoana holografika vehivavy mihaino, mamaly ary manoro anao',
      lynaraSubtitle: 'LYNARA no fisehoana holografika vehivavy an’ny JYNTRA AI: endrika olon-dehibe mangarahara sy mamirapiratra, miaina, mijery, mihetsika ary mampifanaraka ny vavany amin’ny feo. Mampifandray ny famakafakana tsena, ny risika ary ny fampianarana ao anaty resaka iray izy.',
      lynaraPoint1Title: 'Fisehoana holografika vehivavy:',
      lynaraPoint1Desc: 'Endrika olon-dehibe mangarahara sy mamirapiratra, entin’ny shader manokana: fiainana, famikipy, fijery ary fihetsika kely rehefa mihaino, misaina na miteny izy.',
      lynaraPoint2Title: 'Soratra sy feo tena izy:',
      lynaraPoint2Desc: 'Manorata na mitenena amin’ny micro raha avelan’ny navigateur. Adika ny valiny ary vakiana amin’ny feo misy; ampahafantarina tsara ny fiteny tsy misy feo.',
      lynaraPoint3Title: 'Fiteny maro amin’ny alalan’ny modely:',
      lynaraPoint3Desc: 'Fantany ny fitenin’ny hafatrao ary mamaly amin’izany izy, na dia mifangaro fiteny aza, ary mitazona ny fizotran’ny resaka.',
      lynaraBtn: 'Hiresaka amin’i LYNARA',
      lynaraRoleTitle: 'Ny andraikiny ao amin’ny JYNTRA AI',
      lynaraRoleDesc: 'Mampifandray ny modules i LYNARA: manazava famakafakana graphique, mamerina ny fisainan’ny komity agents maro, mampahatsiahy ny fitsipiky ny risika ary manaraka ny fandrosoana ao amin’ny Akademia. Tsy manao baiko izy ary tsy misolo ny fanapahan-kevitrao.',
      lynaraInteractionTitle: 'Soratra na feo, araka ny fahafahan’ny navigateur',
      lynaraInteractionDesc: 'Miasa hatraiza hatraiza ny chat an-tsoratra. Miankina amin’ny navigateur ny fihainoana sy ny famakiana amin’ny feo: milaza mazava i LYNARA raha tsy misy fiteny na feo, fa tsy manao accent sandoka.',
      lynaraMetaTitle: 'Fahatakarana amin’ny alalan’ny modely Meta',
      lynaraMetaDesc: 'Mahatakatra ny hafatrao sy ny graphiquenao i LYNARA amin’ny alalan’ny modely Meta, ary mamaly anao amin’ny fiteninao.',
      lynaraHonesty: 'Interface holografika i LYNARA: fisehoana virtoaly, fa tsy olona tena izy.',
      lynaraHonestyNote: 'Interface holografika i LYNARA: fisehoana virtoaly, fa tsy olona tena izy. Ny feo dia avy amin’ny navigateur amin’ny fiteny hita; ny kalitao sy ny fisian’ny feo dia miankina amin’ny fitaovana, ary tsy misy lantom-peo atao mody.',
      decisionChainBadge: 'FAMAKAFANANA MAFYSY MIFANOHITRA',
      decisionChainTitle: 'Avy amin’ny maso mankany amin’ny fanapahan-kevitra iombonana',
      decisionChainSubtitle: 'Ny famakafakana matotra dia tsy miantehitra amin’ny olona tokana. JYNTRA AI manavaka ny zava-misy, ny fandikana ary ny tombantombana.',
      workflowTitle: 'Fizotran’ny Asa JYNTRA AI',
      workflowSubtitle: 'Fantsona mazava ahafahan’ny dingana tsirairay miasa amin’ny angona voamarina.',
      ctaTitle: 'Vonona hanova ny fomba fanaovanao trading?',
      ctaSubtitle: 'Mamorona ny mombamomba anao anio. Tsy mila carte bancaire, tehirizina ao amin’ny navigateur-nao ny angonao.',
      ctaBtn: 'Hamorona Kaonty JYNTRA AI',
      alreadyAccount: 'Efa manana kaonty aho',
    },
    workspace: {
      badge: 'Kaonty Miasa • Angona Voaaro amin’ny Fitaovana',
      welcome: 'Manao ahoana',
      subtitle: 'Mifandray mivantana amin’ny vidin’ny tsena ny sehatra fiasanao.',
      newAnalysisBtn: 'Famakafakana Vaovao MT4/MT5',
      consultLynaraBtn: 'Hiresaka amin’i LYNARA',
      metricAnalyses: 'Famakafakana AI Vita',
      metricAnalysesSub: 'Voatahiry ao amin’ny kaontinao',
      metricTrades: 'Trades Voasoratra',
      metricTradesSub: 'efa nifarana',
      metricWinRate: 'Tahan’ny Fahombiazana (Win Rate)',
      metricWinRateSub: 'Nokajiana tamin’ny trades tena izy',
      metricPnL: 'Totalim-bokatry ny P&L',
      metricPnLSub: 'Renivola virtoaly na tena misy',
      chartTitle: 'Tabilao & Vidiny Mivantana',
      chartSubtitle: 'Labozia mihetsika miaraka amin’ny EMA 21, tohana sy fanoherana. Alao sary ary alefaso amin’ny AI.',
      chartDeepAnalysisBtn: 'Famakafakana lalina',
      quickModulesTitle: 'Sampan’asa Manokan’ny JYNTRA AI',
      recentAnalysesTitle: 'Famakafakana Voatahiry Farany',
      recentAnalysesEmpty: 'Mbola tsy misy famakafakana voatahiry ao amin’ny kaontinao.',
      createFirstAnalysis: 'Mamorona ny famakafakana voalohany',
    },
    chart: {
      badge: 'Fitaovana Fijerena Sary AI',
      title: 'Famakafakana Tabilao MT4 / MT5',
      subtitle: 'Manavaka tsara : Ny hita maso, ny fandikana ara-AI ary ny tombantombana azo antoka.',
      saveToJournal: 'Tehirizo ao amin’ny Boky',
      savedToJournal: 'Voatahiry ao amin’ny Boky!',
      explainWithLynara: 'Hazavao amin’i LYNARA',
      tabLive: 'Tabilao Mivantana',
      tabUpload: 'Ampidiro ny Sarin’ny MT4 / MT5 / TradingView',
      dropzoneTitle: 'Apetraho eto ny sarin’ny tabilao',
      dropzoneSubtitle: 'na tsindrio hijerena ireo rakitra (PNG, JPG)',
      changeImage: 'Hanova sary',
      paramsTitle: 'Fikirakirana Famakafakana',
      instrumentLabel: 'Fitaovana',
      timeframeLabel: 'Fotoana Fijerena',
      customPromptLabel: 'Toromarika Manokana (raha ilaina)',
      customPromptPlaceholder: 'ohatra: Jereo raha voakitiky ny sweep liquidity ny Order Block H1...',
      analyzeBtn: 'Atombohy ny Famakafakana Feno',
      analyzingBtn: 'Eo am-pamakafakana ny AI (JYNTRA Vision)...',
      waitingTitle: 'Miandry Famakafakana',
      waitingDesc: 'Ampidiro ny sarin’ny tabilao na ampiasao ny vidiny mivantana, dia tsindrio ny bokotra.',
      auditCriteria: 'Fitsipi-pitsarana JYNTRA AI :',
      crit1: 'Fahitana rafitra SMC (BOS, CHoCH)',
      crit2: 'Famaritana Order Blocks & FVG',
      crit3: 'Toerana misy ny Liquidity Buy/Sell',
      crit4: 'Drafitra sy tahan’ny R:R',
      recommendationLabel: 'FEHINY STRATEJIKA',
      aiEngineLabel: 'Fitaovana AI',
      tradePlanTitle: 'Drafitra Algoritmika',
      entryLabel: 'FAMPIDIRANA',
      stopLossLabel: 'STOP-LOSS',
      takeProfitLabel: 'TAKE-PROFIT 1',
      riskRewardLabel: 'TAHANY R:R',
      invalidationTitle: 'Fepetra mahafoana ny drafitra :',
      visualObservationsTitle: '1. Zava-misy Hita Maso',
      trendLabel: 'Fizotry ny Tsena',
      smcLabel: 'Rafitra SMC',
      orderBlocksLabel: 'Order Blocks (OB) :',
      liquidityLabel: 'Faritra misy Liquidity :',
      interpretationTitle: '2. Fandikana Algoritmika AI',
      hypothesesTitle: '3. Tombantombana Miankina amin’ny zava-misy',
      riskDisclaimer: 'Fampitandremana : Aza atao mihoatra ny 1% hatramin’ny 2% amin’ny renivola ny risika isaky ny trade.',
      liveFeedHint: 'Ampiasao ny bokotra fandefasana ny tabilao handinihana ny sary aseho.',
      engineName: 'Moteur JYNTRA',
      atMarket: 'Amin’ny vidiny ankehitriny',
      yesLabel: 'Eny',
      noLabel: 'Tsia',
      neutralLabel: 'Neutre',
      providerLabel: 'Mpamatsy tena izy :',
      completenessLabel: 'Fahafenoan’ny tabilao :',
      sufficientLabel: 'Ampy',
      incompleteLabel: 'Tsy feno',
      missingLabel: 'Misy tsy ampy :',
      realDataUsedLabel: 'Angona tena izy nampiasaina :',
      viewWorkflow: 'Jereo ny Workflow an’ity famakafakana ity',
      annotatedImageTitle: 'Sary farany voamarika',
      annotatedNote: 'Ny haavo sy ny rafitra tena niverin’ny famakafakana ihany no aseho. Tsy misy haavo noforonina.',
      takeProfit2Label: 'TAKE-PROFIT 2',
      takeProfit3Label: 'TAKE-PROFIT 3',
      yesTradeLabel: 'YES TRADE',
      noTradeLabel: 'NO TRADE',
      confidenceLabel: 'Fahatokisana',
      confirmationsLabel: 'Fanamafisana',
      marketReadingTitle: 'Famakiana ny tsena',
      setupQualityLabel: 'Kalitaon’ny setup',
    },
    lynara: {
      title: 'LYNARA',
      subtitle: 'Vehivavy Virtoaly Holografika',
      roleDesc: 'Mpanampy ara-bola mivantana • Feo voajanahary miteny amin’ny teny maro',
      listening: 'Mihaino anao amim-pitandremana i LYNARA...',
      thinking: 'Mandrindra ny angona ara-tsena i LYNARA...',
      speaking: 'Miteny aminao i LYNARA...',
      idle: 'Vonona sy miandry',
      onlineStatus: 'LYNARA Miasa',
      voiceActive: 'Voajanahary',
      micTooltipStart: 'Mitenena amin’ny micro',
      micTooltipStop: 'Atsaharo ny micro',
      voiceLangLabel: 'Fitenin’i LYNARA',
      inputPlaceholder: 'Mametraha fanontaniana momba ny tsena na tabilao...',
      sendBtn: 'Alefaso',
      repeatAudio: 'Avereno amin’ny feo',
      muteBtn: 'Atsaharo ny feo',
      unmuteBtn: 'Alefaso ny feo',
      disclaimer: 'LYNARA dia fitaovana manampy amin’ny fanapahan-kevitra. Hamarino tsara hatrany ny risika.',
      sampleSMC: 'Fanazavana Order Block',
      sampleSizing: 'Kajy Haben’ny Position',
      sampleSL: 'Fijerena Stop-Loss',
      sampleMG: 'Teny Malagasy',
      greeting: 'Salama {name}. Izaho dia LYNARA, mpanampy ara-bola virtoaly holografika. Afaka mandinika ny tabilao MT4/MT5 anao aho, manamarina ny risika, na manazava ny rafitry ny tsena. Mitenena amiko na manorata malalaka.',
      thinkingBubble: 'Misaintsaina sy manomana valiny amin’ny feo i LYNARA...',
      suggestions: 'SOSO-KEVITRA :',
      notConfigured: 'Tsy misy vonjimaika i LYNARA. Andraso kely dia andramo indray.',
      connectionError: 'Tsy tratra ny maodely AI. Hamarino ny fikirakirana serveur dia andramo indray.',
      liveTranscript: 'SORA-TSORATRA MIVANTANA :',
      contextLoaded: 'Torohevitra miasa voaray',
      voiceLabel: 'Feo',
      replyLanguage: 'Fitenin’ny valiny',
      ttsFallbackNote: "Tsy misy feo malagasy napetraka amin'ity navigateur ity : aseho an-tsoratra ny valiny malagasy ary, raha alefa ny feo, dia feo frantsay no mamaky azy.",
      sttUnsupportedNote: "Tsy misy fanekena feo amin'ity navigateur ity. Miasa tanteraka ny fifandraisana an-tsoratra.",
    },
    agents: {
      badge: 'Fitsarana Iombonana',
      title: 'Fifanarahan’ny Mpandraharaha JYNTRA AI',
      subtitle: 'Mpandraharaha AI sangany 6 manana fomba fijery mifamaly no mandinika ny tsena alohan’ny handraisana fanapahan-kevitra.',
      debateTab: 'Ady hevitra mifanohitra',
      consensusTab: 'Fehin-kevitry ny Lead Analyst',
      launchDebateBtn: 'Atombohy ny Ady Hevitra',
      launchingDebate: 'Eo am-pifamaliana ireo mpandraharaha...',
      consensusVerdict: 'FEHIN-KEVITRA IOMBONANA',
      confidenceScore: 'Tahan’ny Fahatokisana',
      metaEngineNotice: 'Nampidirina soa aman-tsara ny maodely JYNTRA Red-Team.',
      roleTechnical: 'Price Action & Smart Money Concepts',
      roleMacro: 'Macroéconomie & Fikorianan’ny Institution',
      roleRisk: 'Fiarovana ny Renivola & Fandavana',
      roleStrategy: 'Fanantenana Matematika & Edge',
      roleRedTeam: 'Mpiaro ny Safidy Mety Ho Diso & Famantarana Sandoka',
      roleLead: 'Mpitsara Lehibe & Fanapahan-kevitra Farany',
      descTechnical: 'Manara-maso ny Order Blocks, Fair Value Gaps, liquidity Buy/Sell ary ny fahatapahan’ny rafitra BOS.',
      descMacro: 'Mandrefy ny tahan’ny refinansy, ny fikorianan’ny ETF, ny fifandraisan’ny DXY ary ny kalandrie ara-toekarena.',
      descRisk: 'Mandà mafy ny drafitra manana R:R < 1.5 na Stop-Loss tsy voarindra.',
      descStrategy: 'Manisa ny mety ho fahombiazana ara-statistika araka ny toetry ny volatility ankehitriny.',
      descRedTeam: 'Mikatsaka ny fandrika ho an’ny mpividy (Bull Traps), ny fahatapahana sandoka ary ny sweep liquidity voarindra.',
      descLead: 'Mandanjalanja ny hevitra mifanohitra rehetra ary manolotra ny tolo-kevitra farany iraisana.',
      timeframeLabel: 'Fotoana',
      statusLabel: 'Toetoetra',
      statusReady: 'Tatitra voamarina',
      statusStandby: 'Miandry mavitrika',
      contextPlaceholder: 'Famaritana fanampiny (ohatra: filazana FOMC anio hariva, fahatapahan’ny range)...',
      missingAnalysis: 'Manaova famakafakana tabilao aloha vao mampiasa ity fitaovana ity.',
      goToChart: 'Mankanesa any amin’ny famakafakana tabilao',
    },
    markets: {
      badge: 'Vidiny Mivantana',
      title: 'Tsenam-Bola & Boky Fividianana',
      subtitle: 'Angona tena misy 100% avy amin’ny loharano voamarina sy tahan’ny Forex ofisialy. Tsy misy vidiny noforonina.',
      refreshBtn: 'Havaozy ny vidiny',
      searchPlaceholder: 'Hikaroka fitaovana (BTC, EUR, XAU, SOL...)...',
      spotLabel: 'Spot',
      interactiveCandles: 'Labozia mihetsika',
      analyzeWithJyntra: 'Fakafakao amin’ny JYNTRA AI',
      candlesLabel: 'Labozia mihetsika tena izy',
      sourceVerified: 'Loharano voamarina : Flux de marché certifié & tahan’ny Forex ofisialy',
      zeroSynthetic: 'Tsy misy vidiny noforonina',
    },
    risk: {
      badge: 'Fiarovana ny Renivola',
      title: 'Kajy Marina ny Risika & Haben’ny Position',
      subtitle: 'Kajio amin’ny fomba matematika ny haben’ny position mba tsy hihoatra ny 1% na 2% ny fatiantoka raha sendra diso.',
      capitalLabel: 'Totalin’ny Renivola ($)',
      riskPercentLabel: 'Risika Ekena (%)',
      entryPriceLabel: 'Vidiny Hidiranana ($)',
      stopLossPriceLabel: 'Vidiny Hivoahana / Stop-Loss ($)',
      takeProfitPriceLabel: 'Tanjona / Take-Profit ($)',
      calculateBtn: 'Kajio ny Haben’ny Position',
      positionSizeResult: 'Haben’ny Position Soso-kevitra',
      monetaryRiskResult: 'Fatiantoka Farany Ambony ($)',
      riskRewardResult: 'Tahany Risika / Tombony',
      ruinProbability: 'Tombanana Hahavery ny Renivola',
      parametersTitle: 'Fepetran’ny Renivola & ny Order',
      ofCapital: 'ny renivola',
      ofAccount: 'ny kaonty',
      assetUnits: 'singa fananana',
      formulaTitle: 'Formula Matematikan’ny JYNTRA AI',
      formulaBody: 'Habe = (Renivola × % Risika) / |Vidin’ny Fidirana − Stop-Loss|',
      formulaNote: 'Manome antoka ity formula ity fa raha voakitika ny Stop-Loss dia mitovy tsara amin’ny risika voafaritra ({amount}) ny fatiantoka farany ambony, na inona na inona ny levier ampiasaina.',
      warnCapital: 'Tokony mihoatra ny zero ny renivolan’ny kaonty.',
      warnPrices: 'Tokony mihoatra ny zero ny vidin’ny fidirana, Stop-Loss ary Take-Profit.',
      warnLongSL: 'Ho an’ny fividianana (LONG), tokony ho ambany noho ny vidin’ny fidirana ny Stop-Loss.',
      warnLongTP: 'Ho an’ny fividianana (LONG), tokony ho ambony noho ny vidin’ny fidirana ny Take-Profit.',
      warnShortSL: 'Ho an’ny fivarotana (SHORT), tokony ho ambony noho ny vidin’ny fidirana ny Stop-Loss.',
      warnShortTP: 'Ho an’ny fivarotana (SHORT), tokony ho ambany noho ny vidin’ny fidirana ny Take-Profit.',
      warnHighRisk: 'Mitandrema: mihoatra ny 3 % ny risika amin’ny trade iray. Ny fitantanana malina dia manolotra 2 % farafahabetsany.',
      warnLowRR: 'Latsaky ny 1,5 ny tahan’ny R:R. Ny fanantenana tombony tsara dia mitaky R:R ≥ 2,0.',
      journalNote: 'Position voakajy tamin’ny risika {amount} ({percent} %), R:R = {rr}.',
      sourceLabel: 'Kajy Risika',
    },
    backtest: {
      badge: 'Fitsapana Tsy Misy Fitongilanana',
      title: 'Moteur Fitsapana Backtesting',
      subtitle: 'Mitsapa paikady amin’ny angona taloha tena misy tsy misy fahalalana ny ho avy mialoha.',
      runBacktestBtn: 'Alefaso ny Backtest',
      runningBacktest: 'Eo am-panatanterahana ny fitsapana...',
      parametersTitle: 'Fepetra Fitsapana',
      metricsTitle: 'Vokatry ny Asa',
      winRate: 'Tahan’ny Fahombiazana',
      profitFactor: 'Tahan’ny Tombony',
      maxDrawdown: 'Fidinana Farany Ambony',
      totalTrades: 'Isan’ny Trades Vita',
      equityCurveTitle: 'Fivoaran’ny Renivola',
      strategyEma: 'EMA Cross 9/21 (Fizotry)',
      strategyRsi: 'RSI 14 Mean Reversion',
      strategyBreakout: 'Range Breakout 10 labozia',
      tf15m: '15 Minitra',
      tf1h: '1 Ora',
      tf4h: '4 Ora',
      tf1d: '1 Andro',
    },
    journal: {
      badge: 'Fifehezan-tena & Fanarahana Maso',
      title: 'Boky Fanamarihana ny Trading',
      subtitle: 'Soraty eto ny trades natao miaraka amin’ny sary, fihetseham-po, fitsipika narahina ary vokatra.',
      newTradeBtn: 'Ampidiro ny Trade',
      openTradesTab: 'Mbola Mandeha',
      closedTradesTab: 'Efa Nifarana',
      emptyJournal: 'Mbola tsy misy trade voasoratra.',
      addTitle: 'Manampy toerana ao amin’ny Diary',
      editTitle: 'Ovay ny toerana',
      cancelledStatus: 'CANCELLED (Nofoanana)',
      noNote: 'Tsy misy naoty',
      savedAnalyses: 'Famakafakana voatahiry',
      noSavedAnalyses: 'Tsy misy famakafakana voatahiry. Avy ao amin’ny Famakafakana Graphique, tsindrio « Tehirizo ao amin’ny diary ».',
      deleteConfirm: 'Hamafa tanteraka ity naoty ao amin’ny diary ity ve?',
    },
    workflow: {
      badge: 'Fizotran’Asa Hita Maso',
      title: 'Workflow Studio JYNTRA AI',
      subtitle: 'Drafitra feno : Angona → Fijerena AI → Mpandraharaha 6 → Risika → Tatitra.',
      executeWorkflowBtn: 'Alefaso ny Workflow',
      pipelineStatus: 'Toetry ny Fizotran’Asa',
    },
    academy: {
      badge: 'Fampianarana Stratejika',
      title: 'Akademia ho an’ny Trading Manan-tsaina',
      subtitle: 'Ianaro ny Smart Money Concepts (SMC), Price Action ary ny toe-tsaina ilaina amin’ny tsena.',
      module1: 'Fototry ny Tsena & Fifindran’ny Vola',
      module2: 'Smart Money Concepts & Rafitra BOS/CHoCH',
      module3: 'Fifehezana Matematika ny Risika & Toe-tsaina',
    },
    settings: {
      badge: 'Fikirakirana Manokana',
      title: 'Fikirakirana ny Kaonty & Safidy',
      subtitle: 'Amboary ny anaranao, ny fiteny tianao ary ny endriky ny tabilao.',
      profileTitle: 'Mombamomba ny Mpampiasa',
      nameLabel: 'Anarana na Solon’anarana',
      emailLabel: 'Adiresy E-mail',
      languageTitle: 'Fitenin’ny Sehatra',
      themeTitle: 'Endrika (Hazava / Maizina)',
      privacyTitle: 'Fiarovana & Tsiambaratelo',
      privacyDesc: 'Ny angonao sy ny tantaranao dia voaaro sy voatahiry mivantana amin’ny fitaovanao. Tsy misy omena olon-kafa.',
      saveSettingsBtn: 'Tehirizo ny Fanovana',
    },
    auth: {
      loginTitle: 'Fidirana amin’i JYNTRA AI',
      loginSubtitle: 'Midira amin’ny sehatra fiasanao sy LYNARA',
      loginBtn: 'Midira amin’ny Kaontiko',
      noAccount: 'Mbola tsy manana kaonty?',
      createAccountLink: 'Mamorona kaonty azo antoka',
      registerTitle: 'Mamorona Kaonty JYNTRA AI',
      registerSubtitle: 'Amboary ny kaontinao voaaro amin’ny fitaovanao',
      registerBtn: 'Mamorona Kaonty',
      hasAccount: 'Efa manana kaonty ve ianao?',
      loginLink: 'Midira eto',
      fullNameLabel: 'Anarana feno na Solon’anarana',
      emailLabel: 'Adiresy E-mail',
      passwordLabel: 'Teny miafina (fara-fahakeliny 6 litera)',
      confirmPasswordLabel: 'Hamafiso ny teny miafina',
      successRegister: 'Voaomana soa aman-tsara ny kaontinao! Midira amin’ny teny miafinao izao.',
      securityNotice: 'Ny teny miafinao dia voaaro amin’ny hash SHA-256 amin’ny fitaovanao.',
      errNameShort: 'Ny anarana dia tokony hanana litera 2 farafahakeliny.',
      errEmailInvalid: 'Ampidiro adiresy e-mail marina.',
      errPasswordShort: 'Ny teny miafina dia tokony hanana litera 6 farafahakeliny.',
      errEmailExists: 'Efa misy kaonty amin’ity e-mail ity. Midira amin’izany.',
      errNoAccount: 'Tsy misy kaonty mifanaraka amin’ity e-mail ity.',
      errWrongPassword: 'Diso ny teny miafina.',
      errUserNotFound: 'Tsy hita ny mpampiasa.',
      errFillAll: 'Fenoy ny saha rehetra.',
      errPasswordMismatch: 'Tsy mitovy ny teny miafina roa.',
      errLoginGeneric: 'Tsy nahomby ny fidirana. Andramo indray.',
      errRegisterGeneric: 'Tsy nahomby ny famoronana kaonty. Andramo indray.',
    },
    footer: {
      projectTitle: 'Tetikasa',
      projectText: 'Tetikasa mahaleo tena natolotra ny Meta Global AI Developer Hackathon 2026.',
      projectLink: 'Momba an’i JYNTRA AI',
      rights: 'Zo rehetra voatokana. Angona tena misy & tahiry locale ao amin’ny navigateur-nao.',
      compactRights: 'Tahiry locale ao amin’ny navigateur-nao • Angona tena misy',
      realDataLabel: 'Angona Mivantana avy amin’ny Marché & Tahan’ny Forex',
      pedagogyTitle: 'Fampianarana & Filaminana Ara-bola',
      pedagogyText: 'JYNTRA AI dia natao hitondra fahazavana, filaminana ary fifehezana ho anao amin’ny tsenam-bola. Amin’ny fampifandraisana ny faharanitan-tsaina artifisialy sy ny fifehezana hentitra ny risika, manampy anao amin’ny fomba voalanjalanja ny sehatra.',
    },
    extra: {
      secureSession: 'Fotoam-pivoriana locale • Angona tehirizina ao amin’ny navigateur-nao', archivedCount: 'voatahiry', modelLabel: 'Maodely', openLink: 'Sokafy →',
      strategy: 'Paikady', testedAsset: 'Fitaovana Notapahana', initialCapital: 'Renivola Voalohany ($)', finalBalance: 'Salanisa Farany', expectancyPerTrade: 'Fanantenana / Trade', totalExecutions: 'Total Fanatanterahana', grossProfitLoss: 'Gross profit / loss', worstDrawdown: 'Fihemorana ratsy indrindra', avgMathGain: 'Tombony matematika salan’isa', tradesLog: 'Diarin’ny Trade Simulation', exitReason: 'Antony Fivoahana', tpHit: 'Take Profit tratra', slHit: 'Stop Loss voakitika', inverseSignal: 'Signal mivadika', directionCol: 'Lalana', entryCol: 'Fidirana ($)', exitCol: 'Fivoahana ($)',
      longLabel: 'LONG (Mividy)', shortLabel: 'SHORT (Mivarotra)', assetLabel: 'Fitaovana Ara-bola', riskMoney: 'RISIKA $', expectedGain: 'TOMBONY ANDRASANA $', tradeValue: 'SANDAN’NY TRADE', distSL: 'ELANELANA SL', distTP: 'ELANELANA TP', unitsOfAsset: 'singa fitaovana',
      executiveSynthesis: 'Fehin-kevitra Mpanatanteraka:', disagreements: 'Tsy fifanarahana voamarika:', adverseHypothesis: 'Tombantombana mifanohitra:', dailyLabel: 'Isan’andro', assetShort: 'Fitaovana:',
      recordedPositions: 'Toerana Voarakitra', closedPositionsLabel: 'Toerana Mikata', netRealisedPnl: 'P&L Net Tena Izy', journalSearchPlaceholder: 'Hikaroka araka ny fitaovana, tag na naoty...', noTradeMatch: 'Tsy misy trade mifanaraka amin’ny fepetrao.', buyLabel: 'BUY (Mividy)', sellLabel: 'SELL (Mivarotra)', entryPriceLabel: 'Vidin’ny Fidirana ($)', exitPriceLabel: 'Vidin’ny Fivoahana ($)', sizeLabel: 'Habe (singa)', statusOpen: 'OPEN (Misokatra)', statusClosed: 'CLOSED (Mikatona)', notesPsychology: 'Naoty & Psikolojia', notesPlaceholder: 'Antony nidirana, fihetseham-po, fanajana ny drafitra...', tagsLabel: 'Tags (sarahin’ny faingo)', tagsPlaceholder: 'ohatra: SMC, FVG, London-Open', exitPricePlaceholder: 'Raha mikatona...',
      saveOnDevice: 'Tehirizo amin’ny Fitaovanao',
      academyBadge: 'AKADEMIA OFISIALY TRADING & SMC', academySchool: 'Sekoly Trading JYNTRA AI', academySubtitle: 'Avy amin’ny fototry ny tsena ka hatramin’ny algorithm andrim-panjakana Smart Money Concepts. Mianara amim-pahentitra, andrana ny fahaizanao ary fehezo ny fitantanana risika matematika.', globalProgress: 'Fandrosoana Ankapobeny', validatedOf: 'module voamarina', curriculum: 'LALAM-PIANARANA', structuredModules: 'Module Voarindra', learningSuffix: 'fianarana', diagramTitle: 'SARY TEKNIKA FAMPIANARANA TENY IZY', bullishCandle: 'Labozia Miakatra (Bullish)', bearishCandle: 'Labozia Midina (Bearish)', recommendedVideo: 'Video Fampianarana Asaina:', watchCourse: 'Jereo ny fampianarana', trapTitle: 'Fandrika Matetika Ialao:', quizTitle: 'QUIZ FANAMARINANA FAHAIZANA MODULE', validated: 'Voamarina', correctAnswer: 'Valiny tsara! Voamarina soa aman-tsara ny module.', wrongAnswer: 'Valiny diso. Jereo ny fanazavana:', moduleWord: 'MODULE',
      workflowRun: 'Atombohy ny Flux Feno', workflowRunning: 'Mandefa angona amin’ny tariby...', workflowNodesTitle: 'TOPOLOJIA NODE ANGONA MISESY', dataTransmitted: 'Angona Nalefa', inputPort: 'Seranana fidirana angona', outputPort: 'Seranana fivoahana angona', statusColon: 'Sata:', calculating: 'Kajiana...', outgoingSummary: 'Famintinana ny flux mivoaka:', outgoingJson: 'Angona JSON nalefa tamin’ny tariby mivoaka:', workflowHint: 'Tsindrio “Atombohy ny Flux Feno” hijerena ny angona mikoriana amin’ny tariby.', workflowSubtitleLong: 'Jereo ny angona tena misy mikoriana eo amin’ny node amin’ny alalan’ny fifandraisana miasa.',
      newsBadge: 'Saran’ny Vaovao & Angona Fototra', newsTitle: 'Vaovao Ara-bola Voamarina', newsSubtitle: 'Lohateny avy amin’ny flux RSS ara-bola ampahibemaso (tsena, toe-karena, orinasa, vola vahiny, crypto, banky foibe), misy daty sy rohy mankany amin’ny loharano tany am-boalohany. Tsy misy lahatsoratra noforonin’ny AI.', newsLoading: 'Mampiditra ny saran’ny vaovao voamarina...', newsEmpty: 'Tsy misy lahatsoratra amin’ity sokajy ity.', factsTitle: 'Topi navoakan’ny loharano', interpretationTitle2: '2. Fandikana Algoritma AI', readSource: 'Vakio ny loharano', newsUnavailable: 'Tsy hita vetivety ny saran’ny vaovao ampahibemaso. Tsy misy votoaty noforonina hamenoana izany.', newsRefresh: 'Havaozy', newsUpdatedAt: 'Nohavaozina', newsErrorTitle: 'Tsy hita vetivety ny saran’ny vaovao', newsErrorBody: 'Tsy namaly ny loharano ampahibemaso. Tsy misy lahatsoratra noforonina hamenoana izany: andramo indray aoriana.', newsRetry: 'Andramo indray', newsReadArticle: 'Vakio ny lahatsoratra', newsDateUnknown: 'Tsy voalaza ny daty', newsNoImage: 'Tsy nomen’ny loharano sary', newsCategoryMarkets: 'Tsena', newsCategoryEconomy: 'Toe-karena', newsCategoryCompanies: 'Orinasa', newsCategoryForex: 'Vola vahiny', newsCategoryCrypto: 'Crypto', newsCategoryCentralBanks: 'Banky foibe', newsCountLabel: 'lahatsoratra', newsStaleNotice: 'Tapaka ny fifandraisana amin’ny loharano: aseho ny lahatsoratra farany voaray.', newsAutoRefreshNote: 'Havaozina ho azy isaky ny 5 minitra',
      accountCreated: 'Voaforona soa aman-tsara ny kaonty!', securityStrong: 'Fiarovana:',
      sendToAiVision: 'Alefaso any amin’ny AI Vision', bullishLegend: 'Labozia Miakatra', bearishLegend: 'Labozia Midina', timestampWord: 'Fotoana', refreshQuotesTitle: 'Havaozy ny vidiny',
      verifiedSourceLine: 'Loharano voamarina: Flux de marché certifié & Tahan’ny ofisialy', noSyntheticQuote: 'Tsy misy vidiny sandoka', interactiveCandlesLabel: 'Labozia tena misy mihetsika',
      liveCore: 'NOYAU 3D INTEL MIVANTANA', companionLabel: 'LYNARA VIRTUAL COMPANION', voiceSubLabel: 'Feo amin’ny teny maro & fanadihadiana mivantana', chartTestBtn: 'Andrana ny fakafakana tabilao', decisionChainTitle2: 'ROJO FANAPAHAN-KEVITRA FENO:', endToEndChain: 'ROJO FANAPAHAN-KEVITRA FENO:',
      settingsTitleLong: 'Fikirakirana Kaonty & Rejistra Maodely', settingsSubtitleLong: 'Tantano ny mombamomba anao, andrana ny antso tena misy amin’ny maodely JYNTRA ary amboary ny tontolo iainanao.', profileTab: 'Mombamomba & Fifandraisana', modelsTab: 'Rejistra Maodely AI', metaConsoleTab: 'Console Antso Mivantana JYNTRA', secureBackupTab: 'Tahirizin’ny Angona', phoneLabel2: 'Laharana Finday (Tsy voatery)', phonePlaceholder: '+261 34 00 000 00', phonePrivacy: 'Ity laharana ity dia tehirizina ao amin’ny navigateur-nao ary tsy alefa amin’olona hafa.', favouriteAsset: 'Fitaovana Ankafizina Mahazatra', savedOk: 'Voatahiry ao amin’ny navigateur-nao ny fikirakirana.', inputsLabel: 'Fampidirana:', methodLabel: 'Fomba antso:', activeOperational: 'MIASA & MANARAKA', awaitingKey: 'MIANDRY FANalahidy .ENV', metaConsoleTitle: 'Console Antso Tena Izy Maodely JYNTRA', metaActiveKey: 'Service actif', metaMissingKey: 'Service en cours de configuration', metaConsoleDesc: 'Ity console ity dia manao fikarakarana tena izy sy azo antoka amin’ny serveur.', metaTargetModel: 'Motera JYNTRA kendrena', metaPromptLabel: 'Toromarika na fangatahana ara-bola', metaCalling: 'Eo am-pikarakarana…', metaCallBtn: 'Atombohy ny fikarakarana', metaAddKey: 'Eo am-pikirakirana ny serivisy. Andramo indray aoriana.', metaRealReply: 'Valiny voaray', modelCalled: 'Motera nampiasaina', backupTitle: 'Tahirizin’ny angona amin’ny fitaovanao', backupDesc: 'Ny angonao dia tehirizina ao amin’ny navigateur-nao. Afaka manondrana na mamerina izany amin’ny fotoana rehetra ianao.', exportData: 'Manondrana ny angonako (JSON)', resetLocalBase: 'Avereno ny angona', resetConfirm: 'Hamafa ny angona locale ity hetsika ity (fanadihadiana, diarin, fotoam-pivoriana). Hanohy ve?', noFalsePromise: 'Vokatra tena izy sy azo hamarinina ihany no asehon’ny JYNTRA AI.',
      featuresTitle: 'Endri-javatra Fototra JYNTRA AI', featuresSubtitle: 'Marika natao ho an’ny mpivarotra mitaky, mampifandray ny fahitana solosaina sy ny maodely multimodal.', techPageTitle: 'Teknolojia & Marika AI', techPageSubtitle: 'JYNTRA AI dia mitazona mangarahara tanteraka momba ny maodely sy ny fotodrafitrasa ampiasaina.', aboutTitle: 'Momba ny JYNTRA AI', engineeringLabel: 'Injeniera & Famolavolana:', locationLabel: 'Toerana: Madagasikara 🇲🇬', testPlatformBtn: 'Andrana ny sehatra amin’ny toe-javatra tena izy', lynaraPreviewTitle: 'Fampahafantarana LYNARA', lynaraPreviewSubtitle: 'Midira hiresaka amin’ny feo amin’ny LYNARA, namanao holografika 3D.', accessLynaraBtn: 'Midira amin’ny LYNARA',
      stepImport: 'Manafatra', stepAnalyse: 'Mandinika', stepVerify: 'Manamarina', stepCompare: 'Mampitaha', stepEvaluate: 'Manombana', stepReport: 'Tatitra', stepImportDesc: 'Sary MT4/MT5 na saran mivantana', stepAnalyseDesc: 'Fahitana multimodal sy rafitra', stepVerifyDesc: 'Vidiny sy boky Marché', stepCompareDesc: 'Adihevitra multi-agents', stepEvaluateDesc: 'Kajy matematika risika', stepReportDesc: 'Fehin-kevitra mpanatanteraka sy feo',
      chainStep1: 'Tabilao MT4/MT5 nafarana', chainStep2: 'AI Vision: fitadiavana rafitra SMC (BOS, CHoCH, FVG)', chainStep3: 'Fifandonana iombonana eo amin’ny agents 6 manam-pahaizana', chainStep4: 'Sivana Risk Manager (foanana raha R:R < 1.5)', chainStep5: 'Fehin-kevitra mazava: BUY, SELL na NO TRADE',
    },
  },
};
