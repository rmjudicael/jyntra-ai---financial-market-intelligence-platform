import type { JyntrackAgentRole, JyntrackScenarioId } from '../types/jyntrack';

/**
 * JYNTRACK page copy, kept next to the interface so FR / EN / MG stay in sync.
 * The type below makes an omission a compile error.
 */
export type JyntrackLang = 'fr' | 'en' | 'mg';

export interface JyntrackScenarioCopy {
  name: string;
  tagline: string;
  hypothesis: string;
  initial: string;
  catalysts: string[];
  invalidators: string[];
  consequences: string;
  risks: string;
  confirmations: string[];
}

export interface JyntrackAgentCopy {
  name: string;
  mission: string;
}

export interface JyntrackCopy {
  badge: string;
  title: string;
  subtitle: string;
  intro: string;
  heroChips: string[];
  controls: {
    asset: string;
    interval: string;
    horizon: string;
    barsUnit: string;
    paths: string;
    benchmark: string;
    none: string;
    run: string;
    running: string;
    calibration: string;
    calibrationHelp: string;
    calibrationUnavailable: string;
    drift: string;
  };
  tabs: {
    worlds: string;
    warRoom: string;
    strategies: string;
    events: string;
    reality: string;
  };
  initial: {
    title: string;
    subtitle: string;
    lastPrice: string;
    bars: string;
    vol: string;
    annualVol: string;
    momentum: string;
    atr: string;
    trend: string;
    source: string;
    asOf: string;
    effective: string;
  };
  chart: {
    title: string;
    subtitle: string;
    median: string;
    band50: string;
    band90: string;
    baseline: string;
    compareTitle: string;
    compareSubtitle: string;
  };
  scenarioSection: {
    title: string;
    subtitle: string;
    hypothesis: string;
    conditions: string;
    catalysts: string;
    invalidators: string;
    consequences: string;
    risks: string;
    confirmations: string;
    sample: string;
    eventsUsed: string;
    unavailable: string;
    invalidation: string;
    save: string;
    saved: string;
  };
  scenario: Record<JyntrackScenarioId, JyntrackScenarioCopy>;
  table: {
    scenario: string;
    median: string;
    band: string;
    probabilityUp: string;
    var: string;
    drawdown: string;
    invalidation: string;
    sample: string;
  };
  assumptions: {
    title: string;
    subtitle: string;
    method: string;
    block: string;
    paths: string;
    horizon: string;
    seed: string;
    drift: string;
    confidence: string;
    limits: string;
    warnings: string;
  };
  limitations: Record<string, string>;
  warnings: Record<string, string>;
  errors: Record<string, string>;
  warRoom: {
    title: string;
    subtitle: string;
    modeFull: string;
    modeQuick: string;
    modeHelp: string;
    brief: string;
    briefPlaceholder: string;
    run: string;
    running: string;
    noSimulation: string;
    pipeline: string;
    judgeMissing: string;
    partial: string;
    honestNote: string;
    statusDone: string;
    statusError: string;
    provider: string;
    latency: string;
    model: string;
  };
  role: Record<JyntrackAgentRole, JyntrackAgentCopy>;
  strategies: {
    title: string;
    subtitle: string;
    initialBalance: string;
    risk: string;
    run: string;
    running: string;
    method: string;
    trainBars: string;
    testBars: string;
    buyHold: string;
    candidate: string;
    return: string;
    drawdown: string;
    winRate: string;
    profitFactor: string;
    trades: string;
    finalBalance: string;
    testReturn: string;
    testDrawdown: string;
    selectedOnTrain: string;
    oosNote: string;
    equity: string;
    empty: string;
    inSample: string;
    outOfSample: string;
  };
  events: {
    title: string;
    subtitle: string;
    threshold: string;
    run: string;
    running: string;
    horizon: string;
    mean: string;
    median: string;
    positive: string;
    continuation: string;
    stdev: string;
    count: string;
    episodes: string;
    date: string;
    shock: string;
    forward: string;
    target: string;
    benchmark: string;
    noData: string;
    note: string;
    episodeDirectionUp: string;
    episodeDirectionDown: string;
  };
  reality: {
    title: string;
    subtitle: string;
    save: string;
    saved: string;
    empty: string;
    localOnly: string;
    verify: string;
    verifying: string;
    delete: string;
    confirmDelete: string;
    baseline: string;
    lastPrice: string;
    observedReturn: string;
    barsObserved: string;
    horizon: string;
    matured: string;
    notMatured: string;
    expectedBand: string;
    bracket: string;
    inside50: string;
    inside90: string;
    invalidated: string;
    yes: string;
    no: string;
    assessment: string;
    assessments: Record<string, string>;
    brackets: Record<string, string>;
    calibrationTitle: string;
    calibrationSubtitle: string;
    samples: string;
    maturedCount: string;
    inside50Rate: string;
    inside90Rate: string;
    bias: string;
    mae: string;
    invalidatedCount: string;
    noCalibration: string;
    mechanismNote: string;
    history: string;
    lastCheck: string;
    noCheck: string;
    expectedMedian: string;
    created: string;
    scenario: string;
    checkNow: string;
    coverageLimited: string;
    source: string;
  };
  disclaimer: string;
  demoNotice: string;
}

const FR: JyntrackCopy = {
  badge: 'JYNTRACK · LABORATOIRE PROBABILISTE',
  title: 'JYNTRACK',
  subtitle: 'Explorez plusieurs futurs possibles du marché, confrontez-les à des modèles Meta et vérifiez vos hypothèses avec des données réelles.',
  intro: 'Un laboratoire, pas un signal. Chaque scénario est une distribution conditionnelle construite à partir de l’historique réel de l’instrument.',
  heroChips: ['Données de marché réelles', '6 mondes parallèles', 'War Room Meta', 'Backtest hors échantillon'],
  controls: {
    asset: 'Instrument',
    interval: 'Unité de temps',
    horizon: 'Horizon',
    barsUnit: 'barres',
    paths: 'Trajectoires',
    benchmark: 'Référence de corrélation',
    none: 'Aucune',
    run: 'Lancer la simulation',
    running: 'Simulation en cours…',
    calibration: 'Recalibrer avec mon historique',
    calibrationHelp: 'Décale la dérive terminale du biais moyen observé sur vos hypothèses arrivées à échéance. Mécanisme explicite, sans apprentissage caché.',
    calibrationUnavailable: 'Disponible après 5 hypothèses arrivées à échéance.',
    drift: 'Ajustement empirique',
  },
  tabs: {
    worlds: 'Mondes parallèles',
    warRoom: 'War Room Meta',
    strategies: 'Évolution de stratégies',
    events: 'Chaîne d’événements',
    reality: 'Reality Tracker',
  },
  initial: {
    title: 'Conditions initiales observées',
    subtitle: 'Photographie réelle du marché au moment de la simulation.',
    lastPrice: 'Dernier cours',
    bars: 'Barres analysées',
    vol: 'Volatilité / barre',
    annualVol: 'Volatilité annualisée',
    momentum: 'Momentum 20 barres',
    atr: 'ATR 14',
    trend: 'Pente de tendance',
    source: 'Source',
    asOf: 'Dernière donnée',
    effective: 'Fréquence effective',
  },
  chart: {
    title: 'Trajectoires probabilistes',
    subtitle: 'La médiane et les bandes à 50 % et 90 % proviennent des trajectoires simulées à partir de l’historique réel. Ce ne sont pas des prévisions.',
    median: 'Médiane',
    band50: 'Bande 50 %',
    band90: 'Bande 90 %',
    baseline: 'Point de départ',
    compareTitle: 'Comparaison des mondes',
    compareSubtitle: 'Les lignes fines représentent la médiane terminale de chaque scénario. La trajectoire sélectionnée est mise en avant.',
  },
  scenarioSection: {
    title: 'Mondes parallèles',
    subtitle: 'Sélectionnez un monde pour lire ses hypothèses, ses facteurs et ses niveaux d’invalidation.',
    hypothesis: 'Hypothèse',
    conditions: 'Conditions initiales',
    catalysts: 'Facteurs favorables',
    invalidators: 'Facteurs d’invalidation',
    consequences: 'Conséquences potentielles',
    risks: 'Risques identifiés',
    confirmations: 'Données à surveiller pour confirmer',
    sample: 'Échantillon',
    eventsUsed: 'événements historiques',
    unavailable: 'Scénario indisponible',
    invalidation: 'Invalidation',
    save: 'Suivre ce scénario',
    saved: 'Hypothèse enregistrée dans le Reality Tracker.',
  },
  scenario: {
    continuation: {
      name: 'Continuation haussière',
      tagline: 'Le régime actuel se prolonge',
      hypothesis: 'Les rendements observés conservent leur distribution et leur autocorrélation récente : la tendance se poursuit sans choc majeur.',
      initial: 'Dernier cours, volatilité et momentum observés sur l’historique chargé.',
      catalysts: ['Momentum récent positif', 'Volatilité stable', 'Absence de choc de liquidité', 'Corrélation inter-actifs maintenue'],
      invalidators: ['Clôture sous le niveau d’invalidation', 'Volatilité qui double brutalement', 'Rupture de la structure de marché', 'Choc macro non anticipé'],
      consequences: 'Distribution terminale décalée vers le haut, avec une queue gauche qui reste réelle et mesurée.',
      risks: 'Un régime qui se retourne sans prévenir ; la continuité n’est jamais acquise.',
      confirmations: ['Clôtures successives au-dessus du point de départ', 'Volatilité réalisée proche de l’historique', 'Volume ou participation cohérents'],
    },
    reversal: {
      name: 'Retournement de tendance',
      tagline: 'Le momentum récent s’inverse',
      hypothesis: 'Le biais directionnel récent est inversé et les chocs observés sont reflétés : un mouvement devenu trop directionnel se retourne.',
      initial: 'Momentum 20 barres, volatilité et structure récente.',
      catalysts: ['Momentum étiré', 'Volatilité en expansion', 'Échec du prolongement de la tendance', 'Divergence de participation'],
      invalidators: ['Clôture au-delà du niveau d’invalidation', 'Prolongement de la tendance avec volume', 'Volatilité qui retombe'],
      consequences: 'Distribution décalée à l’opposé du biais récent ; l’ampleur reste celle de la volatilité empirique, pas une certitude.',
      risks: 'Un retournement peut n’être qu’une consolidation ; le coût des faux départs est réel.',
      confirmations: ['Clôtures à l’opposé du biais récent', 'Structure de tendance brisée', 'Volatilité qui confirme le retournement'],
    },
    consolidation: {
      name: 'Consolidation prolongée',
      tagline: 'Le marché comprime',
      hypothesis: 'Les rendements sont recentrés et leur amplitude réduite : le marché absorbe le mouvement sans direction nette.',
      initial: 'Volatilité récente, ATR et momentum.',
      catalysts: ['Volatilité en compression', 'Absence de catalyseur', 'Liquidité équilibrée', 'Range déjà installé'],
      invalidators: ['Sortie par le haut ou le bas du canal', 'Expansion soudaine de l’ATR', 'Choc de volume'],
      consequences: 'Distribution terminale resserrée autour du point de départ, avec des queues plus courtes.',
      risks: 'Une consolidation apparente peut précéder une expansion violente ; le calme n’est pas une garantie.',
      confirmations: ['Clôtures dans le canal', 'ATR stable ou en baisse', 'Absence de cassure confirmée'],
    },
    vol_shock: {
      name: 'Choc de volatilité',
      tagline: 'L’amplitude change de régime',
      hypothesis: 'La volatilité empirique est multipliée et un choc issu des queues historiques est injecté : le régime d’amplitude change.',
      initial: 'Volatilité par barre, queue historique et ATR.',
      catalysts: ['Volatilité déjà en hausse', 'Événement macro', 'Liquidité qui se retire', 'Corrélation qui augmente'],
      invalidators: ['Volatilité réalisée qui reste sous 1,2× l’historique', 'Retour rapide dans le range', 'Absence de choc de queue'],
      consequences: 'Bandes beaucoup plus larges ; la médiane peut rester proche du départ alors que le risque de queue explose.',
      risks: 'Les stops trop serrés deviennent inefficaces ; le risque de ruine augmente avant la direction.',
      confirmations: ['ATR en expansion', 'Amplitude des barres supérieure à l’historique', 'Corrélations qui se resserrent'],
    },
    correlation_break: {
      name: 'Rupture de corrélation',
      tagline: 'Les actifs se découplent',
      hypothesis: 'La distribution marginale de l’actif est conservée, mais sa co-mouvement avec la référence est cassé par un tirage indépendant.',
      initial: 'Rendements alignés de l’actif et de la référence, corrélation historique.',
      catalysts: ['Choc idiosyncratique', 'Réglementation ou flux spécifique', 'Divergence macro', 'Liquidité locale désynchronisée'],
      invalidators: ['Corrélation simulée qui reste proche de l’historique', 'Retour du co-mouvement', 'Référence indisponible'],
      consequences: 'La trajectoire de l’actif garde sa distribution, mais la couverture ou la diversification peut échouer.',
      risks: 'Une corrélation historique n’est pas un contrat ; les stratégies de couverture peuvent devenir inopérantes.',
      confirmations: ['Corrélation glissante qui baisse', 'Divergence de performance avec la référence', 'Flux spécifiques à l’actif'],
    },
    event_reaction: {
      name: 'Réaction à un événement',
      tagline: 'Les chocs passés se répètent',
      hypothesis: 'Les trajectoires sont construites à partir des fenêtres réelles qui ont suivi des chocs historiques supérieurs à 2 écarts-types.',
      initial: 'Événements historiques détectés, fenêtres de réaction et volatilité.',
      catalysts: ['Choc supérieur à 2σ', 'Fenêtre de réaction historique disponible', 'Régime comparable', 'Liquidité suffisante'],
      invalidators: ['Pas assez d’événements comparables', 'Contexte macro différent', 'Réaction qui sort des fenêtres historiques'],
      consequences: 'Distribution conditionnée par des réactions réellement observées, avec un échantillon forcément limité.',
      risks: 'Petit échantillon et chevauchement d’événements ; le passé ne se répète pas à l’identique.',
      confirmations: ['Réaction initiale conforme au signe du choc', 'Amplitude dans les fenêtres historiques', 'Volatilité cohérente avec les épisodes'],
    },
  },
  table: {
    scenario: 'Scénario',
    median: 'Médiane terminale',
    band: 'Bande 90 %',
    probabilityUp: 'P(hausse)',
    var: 'VaR 95 %',
    drawdown: 'Drawdown max attendu',
    invalidation: 'Invalidation',
    sample: 'Échantillon',
  },
  assumptions: {
    title: 'Méthode et limites',
    subtitle: 'Tout est reproductible : même graine, mêmes données, mêmes bandes.',
    method: 'Méthode',
    block: 'Taille de bloc',
    paths: 'Trajectoires',
    horizon: 'Horizon',
    seed: 'Graine reproductible',
    drift: 'Ajustement de dérive',
    confidence: 'Bandes affichées',
    limits: 'Limites explicites',
    warnings: 'Qualité des données',
  },
  limitations: {
    NO_FUTURE_KNOWLEDGE: 'Aucune donnée future n’est utilisée.',
    REGIME_DEPENDENCE: 'Les résultats dépendent du régime historique chargé.',
    TAIL_MODEL: 'Les queues sont estimées par bootstrap ; les extrêmes non observés restent possibles.',
    DATA_LATENCY: 'La source peut être différée ou indisponible.',
    NOT_A_FORECAST: 'Une distribution n’est pas une prévision certaine.',
    NUMERICAL_GUARD: 'Un garde-fou numérique borne les rendements extrêmes pour éviter les valeurs infinies.',
  },
  warnings: {
    SMALL_SAMPLE: 'Échantillon historique court : interprétez les bandes avec prudence.',
    DAILY_ONLY: 'Cette source ne fournit qu’un historique journalier ; la fréquence effective est 1 jour.',
    EVENT_SAMPLE_SMALL: 'Peu d’événements historiques comparables.',
    BENCHMARK_MISALIGNED: 'La référence de corrélation est insuffisante ou mal alignée.',
    DRIFT_ADJUSTED: 'Un ajustement empirique de dérive a été appliqué.',
    GOLD_PROXY: 'L’or est approché par le PAXG/USDT, un actif tokenisé adossé à l’or physique.',
    STALE_DATA: 'La dernière donnée disponible semble ancienne.',
    IN_SAMPLE_SELECTION: 'Les stratégies sont sélectionnées sur 70 % de l’historique, puis validées sur les 30 % restants.',
    SMALL_TEST_SAMPLE: 'La période de validation est courte.',
    NO_TRADES: 'Certaines stratégies n’ont généré aucun trade sur la période de validation.',
    EPISODES_TRUNCATED: 'Seuls les épisodes les plus récents sont affichés.',
    NOT_MATURED: 'L’horizon de l’hypothèse n’est pas encore atteint.',
    COVERAGE_LIMITED: 'L’historique disponible ne couvre pas toute la période depuis la création de l’hypothèse.',
    NO_NEW_DATA: 'Aucune nouvelle barre n’est encore disponible depuis la création de l’hypothèse.',
  },
  errors: {
    generic: 'L’opération n’a pas pu aboutir. Veuillez réessayer.',
    network: 'La connexion au laboratoire a échoué. Vérifiez votre réseau puis réessayez.',
    market: 'La source de marché est momentanément indisponible. Aucune donnée n’a été inventée.',
    notEnoughData: 'L’historique disponible est insuffisant pour cette combinaison. Choisissez un autre instrument ou une autre unité de temps.',
    rateLimited: 'Trop de requêtes en peu de temps. Patientez quelques instants.',
    metaRequired: 'La War Room nécessite les modèles Meta. Aucun appel n’a été simulé.',
    metaUnavailable: 'Aucun modèle Meta n’a pu répondre. Aucune analyse de substitution n’a été produite.',
    aiQuota: 'Les modèles Meta ont atteint une limite temporaire. Réessayez plus tard.',
    invalid: 'La demande est incomplète. Relancez la simulation puis réessayez.',
    unsupported: 'Cet instrument n’est pas disponible dans le laboratoire.',
  },
  warRoom: {
    title: 'War Room Meta',
    subtitle: 'Cinq rôles complémentaires confrontent les scénarios. Chaque réponse est produite par un modèle Meta réel ; un échec est affiché comme un échec.',
    modeFull: 'Comité complet (5 rôles)',
    modeQuick: 'Comité rapide (3 rôles)',
    modeHelp: 'Le mode complet ajoute le chercheur et l’architecte du risque. Le mode rapide réduit la latence et le coût en appels.',
    brief: 'Question ou contrainte à examiner',
    briefPlaceholder: 'Ex. : quelles conditions rendraient le scénario de retournement le plus fragile ?',
    run: 'Convoquer la War Room',
    running: 'Les agents Meta délibèrent…',
    noSimulation: 'Lancez d’abord une simulation pour fournir un socle factuel aux agents.',
    pipeline: 'Déroulé réel des appels',
    judgeMissing: 'La synthèse du juge n’a pas pu être produite. Les contributions disponibles restent affichées.',
    partial: 'Une partie seulement du comité a répondu. Aucune réponse manquante n’a été inventée.',
    honestNote: 'Les agents ne reçoivent que les chiffres de la simulation et les données de marché déjà chargées. Ils ne peuvent pas inventer de prix ou de probabilités.',
    statusDone: 'Réponse produite',
    statusError: 'Modèle indisponible',
    provider: 'Fournisseur',
    latency: 'Latence',
    model: 'Modèle',
  },
  role: {
    strategist: { name: 'STRATEGIST', mission: 'Construit la lecture des scénarios, des catalyseurs et des invalidations.' },
    opponent: { name: 'OPPONENT', mission: 'Cherche les failles, les hypothèses fragiles et les explications alternatives.' },
    researcher: { name: 'RESEARCHER', mission: 'Examine la qualité des données et ce qu’il faudrait réellement pour confirmer.' },
    risk: { name: 'RISK ARCHITECT', mission: 'Étudie les queues de risque, le drawdown et les niveaux d’invalidation.' },
    judge: { name: 'JUDGE', mission: 'Confronte les contributions et produit une synthèse argumentée, sans instruction de trade.' },
  },
  strategies: {
    title: 'Évolution de stratégies',
    subtitle: 'Un moteur de backtest réel compare des variantes sur 70 % de l’historique, puis les valide sur les 30 % restants.',
    initialBalance: 'Capital initial',
    risk: 'Risque par trade',
    run: 'Évaluer les stratégies',
    running: 'Évaluation en cours…',
    method: 'Les paramètres sont sélectionnés sur la période d’entraînement. La période de validation n’est pas utilisée pour choisir : elle sert de contrôle hors échantillon.',
    trainBars: 'Barres d’entraînement',
    testBars: 'Barres de validation',
    buyHold: 'Achat-conservation (validation)',
    candidate: 'Stratégie',
    return: 'Rendement',
    drawdown: 'Drawdown max',
    winRate: 'Taux de réussite',
    profitFactor: 'Profit factor',
    trades: 'Trades',
    finalBalance: 'Capital final',
    testReturn: 'Validation',
    testDrawdown: 'DD validation',
    selectedOnTrain: 'Sélectionnée sur l’entraînement',
    oosNote: 'La performance hors échantillon peut être très différente. Aucune stratégie n’est présentée comme rentable par avance.',
    equity: 'Courbe d’équité — validation',
    empty: 'Lancez l’évaluation pour comparer les variantes.',
    inSample: 'Entraînement',
    outOfSample: 'Validation',
  },
  events: {
    title: 'Chaîne d’événements',
    subtitle: 'Les chocs historiques supérieurs au seuil choisi sont suivis de leurs réactions réellement observées sur l’actif et la référence.',
    threshold: 'Seuil de choc',
    run: 'Étudier les enchaînements',
    running: 'Analyse des épisodes…',
    horizon: 'Horizon',
    mean: 'Moyenne',
    median: 'Médiane',
    positive: 'Taux positif',
    continuation: 'Continuité du choc',
    stdev: 'Écart-type',
    count: 'Épisodes',
    episodes: 'Épisodes historiques',
    date: 'Date',
    shock: 'Choc initial',
    forward: 'Réaction',
    target: 'Actif',
    benchmark: 'Référence',
    noData: 'Aucun épisode ne correspond au seuil sur cet historique.',
    note: 'Un enchaînement observé n’est pas une règle causale. L’échantillon et le régime comptent.',
    episodeDirectionUp: 'Choc haussier',
    episodeDirectionDown: 'Choc baissier',
  },
  reality: {
    title: 'Reality Tracker',
    subtitle: 'Vos hypothèses sont conservées localement, puis confrontées aux clôtures réellement observées après leur création.',
    save: 'Suivre ce scénario',
    saved: 'Hypothèse enregistrée.',
    empty: 'Aucune hypothèse suivie pour le moment. Sélectionnez un scénario dans « Mondes parallèles » puis cliquez sur « Suivre ce scénario ».',
    localOnly: 'Historique conservé dans ce navigateur, sur cet appareil.',
    verify: 'Vérifier face au réel',
    verifying: 'Vérification…',
    delete: 'Retirer',
    confirmDelete: 'Retirer cette hypothèse du Reality Tracker ? L’historique de vérification associé sera supprimé.',
    baseline: 'Prix de départ',
    lastPrice: 'Dernier prix observé',
    observedReturn: 'Variation observée',
    barsObserved: 'Barres observées',
    horizon: 'Horizon',
    matured: 'Échéance atteinte',
    notMatured: 'Échéance non atteinte',
    expectedBand: 'Bande attendue',
    bracket: 'Position dans la bande',
    inside50: 'Dans la bande 50 %',
    inside90: 'Dans la bande 90 %',
    invalidated: 'Invalidation franchie',
    yes: 'Oui',
    no: 'Non',
    assessment: 'Évaluation',
    assessments: {
      PENDING: 'En attente',
      ON_TRACK: 'Dans la bande centrale',
      EDGE: 'Dans la bande large',
      CONTRADICTED: 'Contredit par le réel',
    },
    brackets: {
      BELOW_P05: 'Sous le 5e centile',
      P05_P25: 'Entre 5 % et 25 %',
      P25_P50: 'Entre 25 % et 50 %',
      P50_P75: 'Entre 50 % et 75 %',
      P75_P95: 'Entre 75 % et 95 %',
      ABOVE_P95: 'Au-dessus du 95e centile',
      NO_DATA: 'Pas encore de données',
    },
    calibrationTitle: 'Calibration empirique',
    calibrationSubtitle: 'Statistiques descriptives calculées sur vos hypothèses vérifiées. Aucun apprentissage automatique n’est prétendu.',
    samples: 'Hypothèses vérifiées',
    maturedCount: 'Arrivées à échéance',
    inside50Rate: 'Couverture bande 50 %',
    inside90Rate: 'Couverture bande 90 %',
    bias: 'Biais moyen',
    mae: 'Erreur absolue moyenne',
    invalidatedCount: 'Invalidations',
    noCalibration: 'Pas encore assez d’hypothèses vérifiées pour calculer une calibration.',
    mechanismNote: 'Le recalibrage est un décalage explicite de la dérive terminale, activé par vous. Il ne modifie ni les données ni la méthode de simulation.',
    history: 'Historique des vérifications',
    lastCheck: 'Dernière vérification',
    noCheck: 'Pas encore vérifiée',
    expectedMedian: 'Médiane attendue',
    created: 'Créée le',
    scenario: 'Scénario',
    checkNow: 'Vérifier maintenant',
    coverageLimited: 'Couverture historique partielle',
    source: 'Source',
  },
  disclaimer: 'JYNTRACK est un laboratoire d’exploration probabiliste. Les scénarios ne sont ni des prévisions, ni des conseils en investissement, et aucune transaction n’est déclenchée automatiquement.',
  demoNotice: 'Les bandes sont calculées à partir des données réelles chargées. Si une source est indisponible, le laboratoire l’indique au lieu de fabriquer des prix.',
};

const EN: JyntrackCopy = {
  badge: 'JYNTRACK · PROBABILISTIC LAB',
  title: 'JYNTRACK',
  subtitle: 'Explore several possible market futures, confront them with Meta models and test your hypotheses against real data.',
  intro: 'A laboratory, not a signal. Each scenario is a conditional distribution built from the instrument’s real history.',
  heroChips: ['Real market data', '6 parallel worlds', 'Meta War Room', 'Out-of-sample backtest'],
  controls: {
    asset: 'Instrument',
    interval: 'Timeframe',
    horizon: 'Horizon',
    barsUnit: 'bars',
    paths: 'Paths',
    benchmark: 'Correlation reference',
    none: 'None',
    run: 'Run simulation',
    running: 'Simulating…',
    calibration: 'Recalibrate with my history',
    calibrationHelp: 'Shifts terminal drift by the mean bias observed on your matured hypotheses. Explicit mechanism, no hidden learning.',
    calibrationUnavailable: 'Available after 5 matured hypotheses.',
    drift: 'Empirical adjustment',
  },
  tabs: {
    worlds: 'Parallel worlds',
    warRoom: 'Meta War Room',
    strategies: 'Strategy evolution',
    events: 'Event chain',
    reality: 'Reality Tracker',
  },
  initial: {
    title: 'Observed initial conditions',
    subtitle: 'Real market snapshot at simulation time.',
    lastPrice: 'Last price',
    bars: 'Bars analysed',
    vol: 'Volatility / bar',
    annualVol: 'Annualised volatility',
    momentum: '20-bar momentum',
    atr: 'ATR 14',
    trend: 'Trend slope',
    source: 'Source',
    asOf: 'Last data',
    effective: 'Effective frequency',
  },
  chart: {
    title: 'Probabilistic paths',
    subtitle: 'The median and the 50% and 90% bands come from paths simulated on real history. They are not forecasts.',
    median: 'Median',
    band50: '50% band',
    band90: '90% band',
    baseline: 'Starting point',
    compareTitle: 'World comparison',
    compareSubtitle: 'Thin lines show each scenario’s terminal median. The selected path is highlighted.',
  },
  scenarioSection: {
    title: 'Parallel worlds',
    subtitle: 'Select a world to read its hypotheses, drivers and invalidation levels.',
    hypothesis: 'Hypothesis',
    conditions: 'Initial conditions',
    catalysts: 'Supporting factors',
    invalidators: 'Invalidation factors',
    consequences: 'Potential consequences',
    risks: 'Identified risks',
    confirmations: 'Data to monitor for confirmation',
    sample: 'Sample',
    eventsUsed: 'historical events',
    unavailable: 'Scenario unavailable',
    invalidation: 'Invalidation',
    save: 'Track this scenario',
    saved: 'Hypothesis saved in the Reality Tracker.',
  },
  scenario: {
    continuation: {
      name: 'Bullish continuation',
      tagline: 'The current regime extends',
      hypothesis: 'Observed returns keep their distribution and recent autocorrelation: the trend continues without a major shock.',
      initial: 'Last price, volatility and momentum observed on the loaded history.',
      catalysts: ['Positive recent momentum', 'Stable volatility', 'No liquidity shock', 'Cross-asset correlation maintained'],
      invalidators: ['Close below the invalidation level', 'Volatility suddenly doubles', 'Market structure breaks', 'Unanticipated macro shock'],
      consequences: 'Terminal distribution shifted upward, with a real and measured left tail.',
      risks: 'A regime can reverse without warning; continuation is never guaranteed.',
      confirmations: ['Successive closes above the starting point', 'Realised volatility close to history', 'Consistent volume or participation'],
    },
    reversal: {
      name: 'Trend reversal',
      tagline: 'Recent momentum flips',
      hypothesis: 'The recent directional drift is flipped and observed shocks are mirrored: a move that became too directional reverses.',
      initial: '20-bar momentum, volatility and recent structure.',
      catalysts: ['Stretched momentum', 'Expanding volatility', 'Failure to extend the trend', 'Participation divergence'],
      invalidators: ['Close beyond the invalidation level', 'Trend extension on volume', 'Volatility collapsing'],
      consequences: 'Distribution shifted against the recent drift; magnitude stays that of empirical volatility, not of a certainty.',
      risks: 'A reversal may only be a consolidation; false starts have a real cost.',
      confirmations: ['Closes against the recent drift', 'Trend structure broken', 'Volatility confirming the reversal'],
    },
    consolidation: {
      name: 'Extended consolidation',
      tagline: 'The market compresses',
      hypothesis: 'Returns are recentred and their amplitude reduced: the market absorbs the move without a clear direction.',
      initial: 'Recent volatility, ATR and momentum.',
      catalysts: ['Compressing volatility', 'No catalyst', 'Balanced liquidity', 'Range already established'],
      invalidators: ['Breakout above or below the channel', 'Sudden ATR expansion', 'Volume shock'],
      consequences: 'Terminal distribution tightened around the starting point, with shorter tails.',
      risks: 'An apparent consolidation can precede a violent expansion; calm is not a guarantee.',
      confirmations: ['Closes inside the channel', 'Stable or falling ATR', 'No confirmed breakout'],
    },
    vol_shock: {
      name: 'Volatility shock',
      tagline: 'Amplitude changes regime',
      hypothesis: 'Empirical volatility is multiplied and a shock drawn from historical tails is injected: the amplitude regime changes.',
      initial: 'Per-bar volatility, historical tail and ATR.',
      catalysts: ['Volatility already rising', 'Macro event', 'Liquidity withdrawal', 'Rising correlation'],
      invalidators: ['Realised volatility stays below 1.2× history', 'Rapid return into the range', 'No tail shock'],
      consequences: 'Much wider bands; the median may stay near the start while tail risk explodes.',
      risks: 'Tight stops become ineffective; ruin risk rises before direction does.',
      confirmations: ['Expanding ATR', 'Bar amplitude above history', 'Correlations tightening'],
    },
    correlation_break: {
      name: 'Correlation break',
      tagline: 'Assets decouple',
      hypothesis: 'The asset’s marginal distribution is preserved, but its co-movement with the reference is broken by an independent draw.',
      initial: 'Aligned asset and reference returns, historical correlation.',
      catalysts: ['Idiosyncratic shock', 'Regulation or specific flows', 'Macro divergence', 'Desynchronised local liquidity'],
      invalidators: ['Simulated correlation stays close to history', 'Co-movement returns', 'Reference unavailable'],
      consequences: 'The asset path keeps its distribution, but hedging or diversification may fail.',
      risks: 'Historical correlation is not a contract; hedging strategies can become ineffective.',
      confirmations: ['Falling rolling correlation', 'Performance divergence from the reference', 'Asset-specific flows'],
    },
    event_reaction: {
      name: 'Event reaction',
      tagline: 'Past shocks repeat',
      hypothesis: 'Paths are built from the real windows that followed historical shocks above 2 standard deviations.',
      initial: 'Detected historical events, reaction windows and volatility.',
      catalysts: ['Shock above 2σ', 'Available historical reaction window', 'Comparable regime', 'Sufficient liquidity'],
      invalidators: ['Not enough comparable events', 'Different macro context', 'Reaction outside historical windows'],
      consequences: 'Distribution conditioned on reactions actually observed, with a necessarily limited sample.',
      risks: 'Small sample and overlapping events; the past does not repeat identically.',
      confirmations: ['Initial reaction matching the shock sign', 'Amplitude inside historical windows', 'Volatility consistent with episodes'],
    },
  },
  table: {
    scenario: 'Scenario',
    median: 'Terminal median',
    band: '90% band',
    probabilityUp: 'P(up)',
    var: 'VaR 95%',
    drawdown: 'Expected max drawdown',
    invalidation: 'Invalidation',
    sample: 'Sample',
  },
  assumptions: {
    title: 'Method and limits',
    subtitle: 'Everything is reproducible: same seed, same data, same bands.',
    method: 'Method',
    block: 'Block size',
    paths: 'Paths',
    horizon: 'Horizon',
    seed: 'Reproducible seed',
    drift: 'Drift adjustment',
    confidence: 'Displayed bands',
    limits: 'Explicit limits',
    warnings: 'Data quality',
  },
  limitations: {
    NO_FUTURE_KNOWLEDGE: 'No future data is used.',
    REGIME_DEPENDENCE: 'Results depend on the historical regime loaded.',
    TAIL_MODEL: 'Tails are bootstrapped; unobserved extremes remain possible.',
    DATA_LATENCY: 'The source may be delayed or unavailable.',
    NOT_A_FORECAST: 'A distribution is not a certain forecast.',
    NUMERICAL_GUARD: 'A numerical guard bounds extreme returns to avoid infinite values.',
  },
  warnings: {
    SMALL_SAMPLE: 'Short historical sample: read the bands with caution.',
    DAILY_ONLY: 'This source only provides daily history; the effective frequency is 1 day.',
    EVENT_SAMPLE_SMALL: 'Few comparable historical events.',
    BENCHMARK_MISALIGNED: 'The correlation reference is insufficient or misaligned.',
    DRIFT_ADJUSTED: 'An empirical drift adjustment was applied.',
    GOLD_PROXY: 'Gold is approximated by PAXG/USDT, a tokenised asset backed by physical gold.',
    STALE_DATA: 'The latest available data looks old.',
    IN_SAMPLE_SELECTION: 'Strategies are selected on 70% of history, then validated on the remaining 30%.',
    SMALL_TEST_SAMPLE: 'The validation period is short.',
    NO_TRADES: 'Some strategies generated no trade during validation.',
    EPISODES_TRUNCATED: 'Only the most recent episodes are displayed.',
    NOT_MATURED: 'The hypothesis horizon has not been reached yet.',
    COVERAGE_LIMITED: 'Available history does not cover the full period since the hypothesis was created.',
    NO_NEW_DATA: 'No new bar is available yet since the hypothesis was created.',
  },
  errors: {
    generic: 'The operation could not complete. Please try again.',
    network: 'The connection to the laboratory failed. Check your network and try again.',
    market: 'The market source is temporarily unavailable. No data was invented.',
    notEnoughData: 'Available history is insufficient for this combination. Choose another instrument or timeframe.',
    rateLimited: 'Too many requests in a short time. Please wait a moment.',
    metaRequired: 'The War Room requires Meta models. No call was simulated.',
    metaUnavailable: 'No Meta model could answer. No substitute analysis was produced.',
    aiQuota: 'Meta models hit a temporary limit. Try again later.',
    invalid: 'The request is incomplete. Run the simulation again and retry.',
    unsupported: 'This instrument is not available in the laboratory.',
  },
  warRoom: {
    title: 'Meta War Room',
    subtitle: 'Five complementary roles confront the scenarios. Every answer is produced by a real Meta model; a failure is displayed as a failure.',
    modeFull: 'Full committee (5 roles)',
    modeQuick: 'Quick committee (3 roles)',
    modeHelp: 'Full mode adds the researcher and risk architect. Quick mode reduces latency and call cost.',
    brief: 'Question or constraint to examine',
    briefPlaceholder: 'E.g. which conditions would make the reversal scenario most fragile?',
    run: 'Convene the War Room',
    running: 'Meta agents are deliberating…',
    noSimulation: 'Run a simulation first to give the agents a factual basis.',
    pipeline: 'Actual call sequence',
    judgeMissing: 'The judge synthesis could not be produced. Available contributions remain displayed.',
    partial: 'Only part of the committee answered. No missing answer was invented.',
    honestNote: 'Agents only receive the simulation figures and already-loaded market data. They cannot invent prices or probabilities.',
    statusDone: 'Answer produced',
    statusError: 'Model unavailable',
    provider: 'Provider',
    latency: 'Latency',
    model: 'Model',
  },
  role: {
    strategist: { name: 'STRATEGIST', mission: 'Builds the reading of scenarios, catalysts and invalidations.' },
    opponent: { name: 'OPPONENT', mission: 'Hunts for flaws, fragile assumptions and alternative explanations.' },
    researcher: { name: 'RESEARCHER', mission: 'Examines data quality and what would really be needed to confirm.' },
    risk: { name: 'RISK ARCHITECT', mission: 'Studies tail risk, drawdown and invalidation levels.' },
    judge: { name: 'JUDGE', mission: 'Confronts contributions and produces an argued synthesis, without a trade instruction.' },
  },
  strategies: {
    title: 'Strategy evolution',
    subtitle: 'A real backtest engine compares variants on 70% of history, then validates them on the remaining 30%.',
    initialBalance: 'Initial capital',
    risk: 'Risk per trade',
    run: 'Evaluate strategies',
    running: 'Evaluating…',
    method: 'Parameters are selected on the training period. The validation period is not used for selection: it is the out-of-sample control.',
    trainBars: 'Training bars',
    testBars: 'Validation bars',
    buyHold: 'Buy and hold (validation)',
    candidate: 'Strategy',
    return: 'Return',
    drawdown: 'Max drawdown',
    winRate: 'Win rate',
    profitFactor: 'Profit factor',
    trades: 'Trades',
    finalBalance: 'Final capital',
    testReturn: 'Validation',
    testDrawdown: 'Validation DD',
    selectedOnTrain: 'Selected on training',
    oosNote: 'Out-of-sample performance can be very different. No strategy is presented as profitable in advance.',
    equity: 'Equity curve — validation',
    empty: 'Run the evaluation to compare variants.',
    inSample: 'Training',
    outOfSample: 'Validation',
  },
  events: {
    title: 'Event chain',
    subtitle: 'Historical shocks above the chosen threshold are followed by their actually observed reactions on the asset and the reference.',
    threshold: 'Shock threshold',
    run: 'Study chains',
    running: 'Analysing episodes…',
    horizon: 'Horizon',
    mean: 'Mean',
    median: 'Median',
    positive: 'Positive rate',
    continuation: 'Shock continuation',
    stdev: 'Standard deviation',
    count: 'Episodes',
    episodes: 'Historical episodes',
    date: 'Date',
    shock: 'Initial shock',
    forward: 'Reaction',
    target: 'Asset',
    benchmark: 'Reference',
    noData: 'No episode matches the threshold on this history.',
    note: 'An observed chain is not a causal rule. Sample and regime matter.',
    episodeDirectionUp: 'Upward shock',
    episodeDirectionDown: 'Downward shock',
  },
  reality: {
    title: 'Reality Tracker',
    subtitle: 'Your hypotheses are kept locally, then compared with the closes actually observed after their creation.',
    save: 'Track this scenario',
    saved: 'Hypothesis saved.',
    empty: 'No tracked hypothesis yet. Select a scenario in “Parallel worlds” then click “Track this scenario”.',
    localOnly: 'History kept in this browser, on this device.',
    verify: 'Check against reality',
    verifying: 'Checking…',
    delete: 'Remove',
    confirmDelete: 'Remove this hypothesis from the Reality Tracker? Its verification history will be deleted.',
    baseline: 'Starting price',
    lastPrice: 'Last observed price',
    observedReturn: 'Observed change',
    barsObserved: 'Observed bars',
    horizon: 'Horizon',
    matured: 'Horizon reached',
    notMatured: 'Horizon not reached',
    expectedBand: 'Expected band',
    bracket: 'Position in the band',
    inside50: 'Inside the 50% band',
    inside90: 'Inside the 90% band',
    invalidated: 'Invalidation crossed',
    yes: 'Yes',
    no: 'No',
    assessment: 'Assessment',
    assessments: {
      PENDING: 'Pending',
      ON_TRACK: 'Inside the central band',
      EDGE: 'Inside the wide band',
      CONTRADICTED: 'Contradicted by reality',
    },
    brackets: {
      BELOW_P05: 'Below the 5th percentile',
      P05_P25: 'Between 5% and 25%',
      P25_P50: 'Between 25% and 50%',
      P50_P75: 'Between 50% and 75%',
      P75_P95: 'Between 75% and 95%',
      ABOVE_P95: 'Above the 95th percentile',
      NO_DATA: 'No data yet',
    },
    calibrationTitle: 'Empirical calibration',
    calibrationSubtitle: 'Descriptive statistics computed on your verified hypotheses. No automatic learning is claimed.',
    samples: 'Verified hypotheses',
    maturedCount: 'Matured',
    inside50Rate: '50% band coverage',
    inside90Rate: '90% band coverage',
    bias: 'Mean bias',
    mae: 'Mean absolute error',
    invalidatedCount: 'Invalidations',
    noCalibration: 'Not enough verified hypotheses to compute calibration yet.',
    mechanismNote: 'Recalibration is an explicit terminal drift shift, enabled by you. It changes neither the data nor the simulation method.',
    history: 'Verification history',
    lastCheck: 'Last check',
    noCheck: 'Not checked yet',
    expectedMedian: 'Expected median',
    created: 'Created',
    scenario: 'Scenario',
    checkNow: 'Check now',
    coverageLimited: 'Partial historical coverage',
    source: 'Source',
  },
  disclaimer: 'JYNTRACK is a probabilistic exploration laboratory. Scenarios are neither forecasts nor investment advice, and no transaction is triggered automatically.',
  demoNotice: 'Bands are computed from the real data loaded. If a source is unavailable, the laboratory says so instead of inventing prices.',
};

const MG: JyntrackCopy = {
  badge: 'JYNTRACK · LABORATOARA PROBABILISTA',
  title: 'JYNTRACK',
  subtitle: 'Jereo ny hoavin’ny tsena mety hitranga, ampitahao amin’ny modely Meta ary hamarino amin’ny angona tena izy ny heverinao.',
  intro: 'Laboratoara, fa tsy famantarana. Ny senario tsirairay dia fizarana mifototra amin’ny tantaran’ny tsena tena izy.',
  heroChips: ['Angona tena izy', 'Tontolo mifanindran-dàlana 6', 'War Room Meta', 'Backtest ivelan’ny santionany'],
  controls: {
    asset: 'Fitaovana',
    interval: 'Fotoana',
    horizon: 'Faravodilanitra',
    barsUnit: 'bara',
    paths: 'Lalana',
    benchmark: 'Fanovozana ho fanoharana',
    none: 'Tsy misy',
    run: 'Hanomboka simulation',
    running: 'Mandeha ny simulation…',
    calibration: 'Hanitsy amin’ny tantarako',
    calibrationHelp: 'Manitsy ny drift farany amin’ny salanisan’ny fiviliana hita amin’ny hevitra efa tonga fotoana. Mekanisma mazava, tsy misy fianarana miafina.',
    calibrationUnavailable: 'Azo atao rehefa 5 ny hevitra efa tonga fotoana.',
    drift: 'Fanitsiana empirika',
  },
  tabs: {
    worlds: 'Tontolo mifanindran-dàlana',
    warRoom: 'War Room Meta',
    strategies: 'Fivoaran’ny paikady',
    events: 'Rojo zava-nitranga',
    reality: 'Reality Tracker',
  },
  initial: {
    title: 'Fepetra voalohany hita',
    subtitle: 'Sary tena izy amin’ny tsena amin’ny fotoana simulation.',
    lastPrice: 'Vidiny farany',
    bars: 'Bara nodinihina',
    vol: 'Volatilité / bara',
    annualVol: 'Volatilité isan-taona',
    momentum: 'Momentum 20 bara',
    atr: 'ATR 14',
    trend: 'Fironana',
    source: 'Loharano',
    asOf: 'Angona farany',
    effective: 'Fahita matetika',
  },
  chart: {
    title: 'Lalana probabilista',
    subtitle: 'Ny medianina sy ny tarika 50 % sy 90 % dia avy amin’ny lalana simulation mifototra amin’ny tantara tena izy. Tsy faminaniana izy ireo.',
    median: 'Medianina',
    band50: 'Tarika 50 %',
    band90: 'Tarika 90 %',
    baseline: 'Fiandohana',
    compareTitle: 'Fampitahana tontolo',
    compareSubtitle: 'Ny tsipika manify dia medianina farany isaky ny senario. Ny lalana voafidy no asongadina.',
  },
  scenarioSection: {
    title: 'Tontolo mifanindran-dàlana',
    subtitle: 'Safidio ny tontolo iray hijery ny hevitra, ny antony ary ny fetra fandavana.',
    hypothesis: 'Hevitra',
    conditions: 'Fepetra voalohany',
    catalysts: 'Antony manohana',
    invalidators: 'Antony mandà',
    consequences: 'Vokany mety',
    risks: 'Risika hita',
    confirmations: 'Angona tokony harahina',
    sample: 'Santionany',
    eventsUsed: 'zava-nitranga ara-tantara',
    unavailable: 'Tsy misy io senario io',
    invalidation: 'Fandavana',
    save: 'Hanaraka io senario io',
    saved: 'Voatahiry ao amin’ny Reality Tracker ny hevitra.',
  },
  scenario: {
    continuation: {
      name: 'Fanohizana miakatra',
      tagline: 'Mitohy ny fironana ankehitriny',
      hypothesis: 'Mitazona ny fizarana sy ny fifandraisana akaiky ny vokatra hita: mitohy ny fironana tsy misy shock lehibe.',
      initial: 'Vidiny farany, volatilité sy momentum hita tamin’ny tantara nampidirina.',
      catalysts: ['Momentum tsara vao haingana', 'Volatilité milamina', 'Tsy misy shock liquidity', 'Fifandraisana inter-actifs mitohy'],
      invalidators: ['Fanidiana ambanin’ny fetra fandavana', 'Volatilité mitombo roa heny tampoka', 'Fandravana ny rafitra tsena', 'Shock macro tsy nampoizina'],
      consequences: 'Fizarana farany miakatra, miaraka amin’ny rambo havia tena izy sy refesina.',
      risks: 'Mety hivadika tampoka ny fironana; tsy antoka mihitsy ny fanohizana.',
      confirmations: ['Fanidiana mifandimby ambonin’ny fiandohana', 'Volatilité akaikin’ny tantara', 'Volume na fandraisana anjara mifanaraka'],
    },
    reversal: {
      name: 'Fivadihana fironana',
      tagline: 'Mivadika ny momentum vao haingana',
      hypothesis: 'Averina ny biais directionnel vao haingana ary taratasy ny shock hita: mivadika ny fihetsika lasa be loatra ny lalana.',
      initial: 'Momentum 20 bara, volatilité ary rafitra vao haingana.',
      catalysts: ['Momentum lavitra', 'Volatilité mitombo', 'Tsy fahombiazana hanohy ny fironana', 'Fisarahana amin’ny fandraisana anjara'],
      invalidators: ['Fanidiana mihoatra ny fetra fandavana', 'Fanohizana ny fironana miaraka amin’ny volume', 'Volatilité mianjera'],
      consequences: 'Fizarana mihetsika mifanohitra amin’ny fironana vao haingana; ny halavany dia mijanona ho an’ny volatilité empirika, fa tsy antoka.',
      risks: 'Mety fanamafisana fotsiny ny fivadihana; misy vidiny tena izy ny famantarana diso.',
      confirmations: ['Fanidiana mifanohitra amin’ny fironana vao haingana', 'Rafitra fironana tapaka', 'Volatilité manamarina ny fivadihana'],
    },
    consolidation: {
      name: 'Fanamafisana lava',
      tagline: 'Mikely ny tsena',
      hypothesis: 'Miverina afovoany ny vokatra ary mihena ny halavany: mandray ny fihetsika ny tsena tsy misy lalana mazava.',
      initial: 'Volatilité vao haingana, ATR ary momentum.',
      catalysts: ['Volatilité mikely', 'Tsy misy antony', 'Liquidity mandanjalanja', 'Efa misy range'],
      invalidators: ['Fivoahana ambony na ambany amin’ny canal', 'Fitomboan’ny ATR tampoka', 'Shock volume'],
      consequences: 'Fizarana farany mifintina manodidina ny fiandohana, rambo fohy kokoa.',
      risks: 'Mety ho fanamafisana hita maso mialoha ny fiparitahan’ny hery; tsy antoka ny fitoniana.',
      confirmations: ['Fanidiana ao anatin’ny canal', 'ATR milamina na mihena', 'Tsy misy fivoahana voamarina'],
    },
    vol_shock: {
      name: 'Shock volatilité',
      tagline: 'Miova ny halavan’ny fihetsika',
      hypothesis: 'Ampitomboina ny volatilité empirika ary ampidirina shock avy amin’ny rambo ara-tantara: miova ny rafitry ny halavany.',
      initial: 'Volatilité isaky ny bara, rambo ara-tantara ary ATR.',
      catalysts: ['Volatilité efa mitombo', 'Zava-nitranga macro', 'Fialana liquidity', 'Fifandraisana mitombo'],
      invalidators: ['Volatilité hita latsaky ny 1,2× ny tantara', 'Fiverenana haingana ao anatin’ny range', 'Tsy misy shock rambo'],
      consequences: 'Mivelatra be ny tarika; mety hijanona akaikin’ny fiandohana ny medianina raha mipoitra ny risika rambo.',
      risks: 'Tsy mandeha ny stop tery; mitombo ny risika fahaverezana alohan’ny lalana.',
      confirmations: ['ATR mivelatra', 'Halavan’ny bara mihoatra ny tantara', 'Fifandraisana mihamafy'],
    },
    correlation_break: {
      name: 'Fandravana fifandraisana',
      tagline: 'Misaraka ny fitaovana',
      hypothesis: 'Voatahiry ny fizarana manokana, fa ravana amin’ny alalan’ny fisafidianana mahaleo tena ny fifandraisany amin’ny fanovozana.',
      initial: 'Vokatra mifanaraka amin’ny fitaovana sy ny fanovozana, fifandraisana ara-tantara.',
      catalysts: ['Shock manokana', 'Fitsipika na flux manokana', 'Fisarahana macro', 'Liquidity tsy mifanaraka'],
      invalidators: ['Fifandraisana simulation mitovy amin’ny tantara', 'Fiverenan’ny fifandraisana', 'Tsy misy fanovozana'],
      consequences: 'Mitazona ny fizarany ny lalana, fa mety tsy hahomby ny couverture na diversification.',
      risks: 'Tsy fifanarahana ny fifandraisana ara-tantara; mety tsy handeha ny paikady couverture.',
      confirmations: ['Fifandraisana mihetsika mihena', 'Fisarahana amin’ny fanovozana', 'Flux manokana amin’ny fitaovana'],
    },
    event_reaction: {
      name: 'Fihetsika amin’ny zava-nitranga',
      tagline: 'Miverimberina ny shock taloha',
      hypothesis: 'Ny lalana dia naorina avy amin’ny fe-potoana tena izy nanaraka shock ara-tantara mihoatra ny 2 écarts-types.',
      initial: 'Zava-nitranga ara-tantara hita, fe-potoana fihetsika ary volatilité.',
      catalysts: ['Shock mihoatra ny 2σ', 'Fe-potoana fihetsika ara-tantara misy', 'Rafitra mitovy', 'Liquidity ampy'],
      invalidators: ['Tsy ampy zava-nitranga mitovy', 'Tsy mitovy ny toe-javatra macro', 'Fihetsika ivelan’ny fe-potoana ara-tantara'],
      consequences: 'Fizarana mifototra amin’ny fihetsika tena hita, miaraka amin’ny santionany voafetra.',
      risks: 'Santionany kely sy fifandonana zava-nitranga; tsy miverimberina mitovy ny lasa.',
      confirmations: ['Fihetsika voalohany mifanaraka amin’ny famantarana ny shock', 'Halavany ao anatin’ny fe-potoana ara-tantara', 'Volatilité mifanaraka amin’ny episôda'],
    },
  },
  table: {
    scenario: 'Senario',
    median: 'Medianina farany',
    band: 'Tarika 90 %',
    probabilityUp: 'P(miakatra)',
    var: 'VaR 95 %',
    drawdown: 'Drawdown ambony indrindra',
    invalidation: 'Fandavana',
    sample: 'Santionany',
  },
  assumptions: {
    title: 'Fomba sy fetra',
    subtitle: 'Azo averina daholo: mitovy ny voa, mitovy ny angona, mitovy ny tarika.',
    method: 'Fomba',
    block: 'Haben’ny bloc',
    paths: 'Lalana',
    horizon: 'Faravodilanitra',
    seed: 'Voa azo averina',
    drift: 'Fanitsiana drift',
    confidence: 'Tarika aseho',
    limits: 'Fetra mazava',
    warnings: 'Kalitaon’ny angona',
  },
  limitations: {
    NO_FUTURE_KNOWLEDGE: 'Tsy misy angona ho avy ampiasaina.',
    REGIME_DEPENDENCE: 'Miankina amin’ny rafitra ara-tantara nampidirina ny vokatra.',
    TAIL_MODEL: 'Ny rambo dia tombanana amin’ny bootstrap; mety hisy ny faran’ny farany tsy hita.',
    DATA_LATENCY: 'Mety ho tara na tsy misy ny loharano.',
    NOT_A_FORECAST: 'Tsy faminaniana azo antoka ny fizarana.',
    NUMERICAL_GUARD: 'Misy fetra isa miaro amin’ny vokatra tafahoatra mba tsy hisy sanda tsy manam-petra.',
  },
  warnings: {
    SMALL_SAMPLE: 'Fohy ny santionany ara-tantara: tandremo ny tarika.',
    DAILY_ONLY: 'Tsy manome afa-tsy tantara isanandro io loharano io; isanandro ny fahita matetika.',
    EVENT_SAMPLE_SMALL: 'Vitsy ny zava-nitranga ara-tantara mitovy.',
    BENCHMARK_MISALIGNED: 'Tsy ampy na tsy mifanaraka ny fanovozana.',
    DRIFT_ADJUSTED: 'Nampiharina ny fanitsiana drift empirika.',
    GOLD_PROXY: 'Ny volamena dia asehon’ny PAXG/USDT, fitaovana tokenisé mifototra amin’ny volamena tena izy.',
    STALE_DATA: 'Toa tranainy ny angona farany.',
    IN_SAMPLE_SELECTION: 'Ny paikady dia safidiana amin’ny 70 % amin’ny tantara, avy eo hamarinina amin’ny 30 % sisa.',
    SMALL_TEST_SAMPLE: 'Fohy ny fe-potoana fanamarinana.',
    NO_TRADES: 'Ny paikady sasany dia tsy nanao trade tamin’ny fanamarinana.',
    EPISODES_TRUNCATED: 'Ny episôda farany indrindra ihany no aseho.',
    NOT_MATURED: 'Tsy mbola tonga ny faravodilanitry ny hevitra.',
    COVERAGE_LIMITED: 'Tsy maharakotra ny fe-potoana manontolo hatramin’ny famoronana ny hevitra ny tantara misy.',
    NO_NEW_DATA: 'Tsy mbola misy bara vaovao hatramin’ny famoronana ny hevitra.',
  },
  errors: {
    generic: 'Tsy afaka nifarana ny asa. Andramo indray.',
    network: 'Tsy nahomby ny fifandraisana amin’ny laboratoara. Hamarino ny réseau ary andramo indray.',
    market: 'Tsy misy vetivety ny loharanon’ny tsena. Tsy misy angona noforonina.',
    notEnoughData: 'Tsy ampy ny tantara ho an’io fitambarana io. Safidio fitaovana na fotoana hafa.',
    rateLimited: 'Be loatra ny fangatahana. Miandrasa kely.',
    metaRequired: 'Mila modely Meta ny War Room. Tsy misy antso noforonina.',
    metaUnavailable: 'Tsy nisy modely Meta nahavita namaly. Tsy misy famakafakana solon-tena noforonina.',
    aiQuota: 'Tonga amin’ny fetra vonjimaika ny modely Meta. Andramo indray any aoriana.',
    invalid: 'Tsy feno ny fangatahana. Avereno ny simulation dia andramo indray.',
    unsupported: 'Tsy misy ao amin’ny laboratoara io fitaovana io.',
  },
  warRoom: {
    title: 'War Room Meta',
    subtitle: 'Dimanjaka mifameno no mifanakalo hevitra momba ny senario. Ny valiny tsirairay dia avy amin’ny modely Meta tena izy; aseho ho fahavoazana ny fahavoazana.',
    modeFull: 'Komity feno (andraikitra 5)',
    modeQuick: 'Komity haingana (andraikitra 3)',
    modeHelp: 'Manampy mpikaroka sy mpanao risika ny fomba feno. Mampitombo haingana sy mampihena antso ny fomba haingana.',
    brief: 'Fanontaniana na fetra hodinihina',
    briefPlaceholder: 'Ohatra: inona no mety hahatonga ny senario fivadihana ho marefo indrindra?',
    run: 'Antsoy ny War Room',
    running: 'Mifanakalo hevitra ny agents Meta…',
    noSimulation: 'Atombohy aloha ny simulation mba hanana fototra azo antoka ny agents.',
    pipeline: 'Fizotran’ny antso tena izy',
    judgeMissing: 'Tsy afaka noforonina ny famintinana an’ny mpitsara. Aseho ny anjara biriky misy.',
    partial: 'Ny ampahany amin’ny komity ihany no namaly. Tsy misy valiny tsy ampy noforonina.',
    honestNote: 'Ny tarehimarika simulation sy ny angona tsena efa nampidirina ihany no azon’ny agents. Tsy afaka mamorona vidiny na probabilité izy ireo.',
    statusDone: 'Valiny noforonina',
    statusError: 'Tsy misy modely',
    provider: 'Mpamatsy',
    latency: 'Latence',
    model: 'Modely',
  },
  role: {
    strategist: { name: 'STRATEGIST', mission: 'Manamboatra ny famakafakana senario, antony ary fandavana.' },
    opponent: { name: 'OPPONENT', mission: 'Mitady ny lesoka, hevitra marefo ary fanazavana hafa.' },
    researcher: { name: 'RESEARCHER', mission: 'Mandini ny kalitaon’ny angona sy izay tena ilaina hamarinana.' },
    risk: { name: 'RISK ARCHITECT', mission: 'Mandini ny risika rambo, drawdown ary fetra fandavana.' },
    judge: { name: 'JUDGE', mission: 'Mampitaha ny anjara biriky ary mamorona famintinana misy antony, tsy misy toromarika trade.' },
  },
  strategies: {
    title: 'Fivoaran’ny paikady',
    subtitle: 'Moteur backtest tena izy no mampitaha ny variants amin’ny 70 % amin’ny tantara, avy eo mamarinina amin’ny 30 % sisa.',
    initialBalance: 'Renivola voalohany',
    risk: 'Risika isaky ny trade',
    run: 'Hanomboka fanombanana',
    running: 'Mandeha ny fanombanana…',
    method: 'Safidiana amin’ny fe-potoana fanofanana ny paramètres. Tsy ampiasaina hisafidy ny fe-potoana fanamarinana: fanaraha-maso ivelan’ny santionany izy.',
    trainBars: 'Bara fanofanana',
    testBars: 'Bara fanamarinana',
    buyHold: 'Mividy sy mitazona (fanamarinana)',
    candidate: 'Paikady',
    return: 'Vokatra',
    drawdown: 'Drawdown ambony',
    winRate: 'Tahan’ny fahombiazana',
    profitFactor: 'Profit factor',
    trades: 'Trades',
    finalBalance: 'Renivola farany',
    testReturn: 'Fanamarinana',
    testDrawdown: 'DD fanamarinana',
    selectedOnTrain: 'Nofidiana tamin’ny fanofanana',
    oosNote: 'Mety hafa be ny vokatra ivelan’ny santionany. Tsy aseho ho mahasoa mialoha ny paikady.',
    equity: 'Courbe équité — fanamarinana',
    empty: 'Atombohy ny fanombanana hampitahana ny variants.',
    inSample: 'Fanofanana',
    outOfSample: 'Fanamarinana',
  },
  events: {
    title: 'Rojo zava-nitranga',
    subtitle: 'Ny shock ara-tantara mihoatra ny fetra voafidy dia arahina ny fihetsika tena hita amin’ny fitaovana sy ny fanovozana.',
    threshold: 'Fetran’ny shock',
    run: 'Handini ny rojo',
    running: 'Mandini episôda…',
    horizon: 'Faravodilanitra',
    mean: 'Salanisa',
    median: 'Medianina',
    positive: 'Tahan’ny positif',
    continuation: 'Fanohizan’ny shock',
    stdev: 'Écart-type',
    count: 'Episôda',
    episodes: 'Episôda ara-tantara',
    date: 'Daty',
    shock: 'Shock voalohany',
    forward: 'Fihetsika',
    target: 'Fitaovana',
    benchmark: 'Fanovozana',
    noData: 'Tsy misy episôda mifanaraka amin’ny fetra amin’io tantara io.',
    note: 'Tsy lalàna causal ny rojo hita. Misy lanjany ny santionany sy ny rafitra.',
    episodeDirectionUp: 'Shock miakatra',
    episodeDirectionDown: 'Shock midina',
  },
  reality: {
    title: 'Reality Tracker',
    subtitle: 'Tehirizina eto an-toerana ny hevitrao, avy eo ampitahaina amin’ny fanidiana tena hita taorian’ny famoronana azy.',
    save: 'Hanaraka io senario io',
    saved: 'Voatahiry ny hevitra.',
    empty: 'Tsy misy hevitra arahina amin’izao. Safidio senario ao amin’ny « Tontolo mifanindran-dàlana » dia tsindrio « Hanaraka io senario io ».',
    localOnly: 'Ny tantara dia tehirizina amin’ity navigateur ity sy ity fitaovana ity.',
    verify: 'Hamarino amin’ny tena izy',
    verifying: 'Manamarina…',
    delete: 'Esory',
    confirmDelete: 'Esorina ao amin’ny Reality Tracker io hevitra io? Ho voafafa ny tantaran’ny fanamarinana.',
    baseline: 'Vidiny fiandohana',
    lastPrice: 'Vidiny farany hita',
    observedReturn: 'Fiovana hita',
    barsObserved: 'Bara hita',
    horizon: 'Faravodilanitra',
    matured: 'Tonga ny fotoana',
    notMatured: 'Tsy mbola tonga ny fotoana',
    expectedBand: 'Tarika andrasana',
    bracket: 'Toerana ao amin’ny tarika',
    inside50: 'Ao anatin’ny tarika 50 %',
    inside90: 'Ao anatin’ny tarika 90 %',
    invalidated: 'Nihoatra ny fandavana',
    yes: 'Eny',
    no: 'Tsia',
    assessment: 'Fanombanana',
    assessments: {
      PENDING: 'Miandry',
      ON_TRACK: 'Ao anatin’ny tarika afovoany',
      EDGE: 'Ao anatin’ny tarika malalaka',
      CONTRADICTED: 'Mifanohitra amin’ny tena izy',
    },
    brackets: {
      BELOW_P05: 'Ambanin’ny centile faha-5',
      P05_P25: 'Anelanelan’ny 5 % sy 25 %',
      P25_P50: 'Anelanelan’ny 25 % sy 50 %',
      P50_P75: 'Anelanelan’ny 50 % sy 75 %',
      P75_P95: 'Anelanelan’ny 75 % sy 95 %',
      ABOVE_P95: 'Ambony ny centile faha-95',
      NO_DATA: 'Tsy mbola misy angona',
    },
    calibrationTitle: 'Kalibrasiona empirika',
    calibrationSubtitle: 'Statistika mamaritra mifototra amin’ny hevitra voamarina. Tsy lazaina fa misy fianarana automatique.',
    samples: 'Hevitra voamarina',
    maturedCount: 'Tonga fotoana',
    inside50Rate: 'Fandrakofana tarika 50 %',
    inside90Rate: 'Fandrakofana tarika 90 %',
    bias: 'Fiviliana salanisa',
    mae: 'Fahadisoana salanisa',
    invalidatedCount: 'Fandavana',
    noCalibration: 'Tsy ampy hevitra voamarina mba hanaovana kalibrasiona.',
    mechanismNote: 'Fanitsiana mazava amin’ny drift farany ny recalibrage, atosinao ianao. Tsy manova ny angona na ny fomba simulation izy.',
    history: 'Tantaran’ny fanamarinana',
    lastCheck: 'Fanamarinana farany',
    noCheck: 'Tsy mbola voamarina',
    expectedMedian: 'Medianina andrasana',
    created: 'Noforonina',
    scenario: 'Senario',
    checkNow: 'Hamarino izao',
    coverageLimited: 'Fandrakofana ara-tantara tsy feno',
    source: 'Loharano',
  },
  disclaimer: 'Laboratoara fanadihadiana probabilista i JYNTRACK. Tsy faminaniana na torohevitra fampiasam-bola ny senario, ary tsy misy fifanakalozana atao automatique.',
  demoNotice: 'Ny tarika dia kajy avy amin’ny angona tena izy nampidirina. Raha tsy misy loharano, dia milaza izany ny laboratoara fa tsy mamorona vidiny.',
};

export const JYNTRACK_COPY: Record<JyntrackLang, JyntrackCopy> = { fr: FR, en: EN, mg: MG };
