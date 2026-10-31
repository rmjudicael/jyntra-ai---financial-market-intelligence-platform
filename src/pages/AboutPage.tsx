import React, { useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  BrainCircuit,
  CandlestickChart,
  CheckCircle2,
  Cpu,
  Fingerprint,
  Gauge,
  GraduationCap,
  LineChart,
  Mic,
  Newspaper,
  Orbit,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AboutPageProps {
  onNavigate: (route: string) => void;
  isAuthenticated: boolean;
}

type AboutLang = 'fr' | 'en' | 'mg';

const copy = {
  fr: {
    badge: 'À PROPOS',
    title: 'JYNTRA AI',
    tagline: 'Votre IA. Votre avantage.',
    intro:
      "JYNTRA AI réunit dans un seul environnement les outils dont un trader a réellement besoin : lecture de marché assistée, débat contradictoire, gestion du risque, backtesting, journal et une assistante holographique. Sans faux signaux, sans promesses de gains.",
    ctaPrimary: 'Découvrir la plateforme',
    ctaSecondary: 'Créer un compte',
    ctaSecondaryAuth: 'Explorer l’Académie',
    missionBadge: 'NOTRE MISSION',
    missionTitle: 'Rendre l’analyse de marché plus claire, pas plus bruyante.',
    missionText:
      "La plupart des plateformes ajoutent des indicateurs. JYNTRA AI ajoute de la structure : chaque analyse distingue ce qui est observé, ce qui est interprété et ce qui reste une hypothèse. L’objectif n’est pas de prédire le marché, mais de rendre vos décisions plus lisibles, plus documentées et plus disciplinées.",
    pillarsTitle: 'Ce qui structure la plateforme',
    pillarsSubtitle: 'Six briques conçues pour fonctionner ensemble, avec les mêmes données et la même traçabilité.',
    pillars: [
      {
        icon: CandlestickChart,
        title: 'Analyse graphique SMC',
        text: "Détection des structures de marché, Order Blocks, Fair Value Gaps, BOS et CHoCH, avec des annotations rendues de façon déterministe à partir des données détectées.",
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/25',
      },
      {
        icon: Users,
        title: 'Comité multi-agents',
        text: 'Plusieurs agents confrontent leurs lectures, dont un Red-Team chargé de chercher les pièges de liquidité et les scénarios qui invalident la thèse principale.',
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/25',
      },
      {
        icon: Gauge,
        title: 'Risque & dimensionnement',
        text: 'Taille de position, distance au Stop-Loss, ratio Risque/Rendement et exposition : les calculs restent déterministes et vérifiables.',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/25',
      },
      {
        icon: BarChart3,
        title: 'Backtesting',
        text: 'Évaluation d’une stratégie sur un historique de marché réel, avec des métriques explicites et aucune courbe inventée.',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
      },
      {
        icon: BookOpen,
        title: 'Journal & Académie',
        text: 'Un journal de décisions comparable d’un trade à l’autre, et des leçons structurées avec objectifs, exemples et quiz.',
        color: 'text-sky-500',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/25',
      },
      {
        icon: Mic,
        title: 'LYNARA',
        text: 'Une assistante holographique féminine, en texte et en voix, qui explique, reformule et rappelle les règles de risque dans la langue de l’utilisateur.',
        color: 'text-fuchsia-500',
        bg: 'bg-fuchsia-500/10',
        border: 'border-fuchsia-500/25',
      },
    ],
    principlesBadge: 'NOS VALEURS',
    principlesTitle: 'La vision qui guide chaque module',
    principles: [
      'Rendre chaque analyse lisible : observations, interprétations et hypothèses clairement séparées.',
      'Placer la gestion du risque au centre de chaque décision, avant la recherche de performance.',
      'Donner à chaque trader des outils qu’il peut comprendre, vérifier et reproduire.',
      'Faire progresser la pédagogie financière, dans la langue et au rythme de chacun.',
      'Construire une IA utile, rapide et respectueuse des données de ses utilisateurs.',
    ],
    metaBadge: 'INTÉGRATION IA',
    metaTitle: 'L’intelligence de Meta, au service de votre analyse',
    metaText:
      'JYNTRA AI est une plateforme web intelligente qui s’appuie sur les modèles d’IA de Meta pour comprendre vos messages, lire vos graphiques et vous accompagner dans vos décisions de marché.',
    metaPoints: [
      'Compréhension naturelle du langage, y compris les messages multilingues.',
      'Analyse multimodale : lecture des captures de graphiques et des images.',
      'Raisonnement et analyse pour structurer une lecture de marché claire.',
      'Assistance intelligente et interactions naturelles avec LYNARA.',
      'Analyse graphique et trading : structures, zones et plans de trade.',
      'Traitement des données et fonctionnalités IA de la plateforme.',
    ],
    stats: [
      { value: '6', label: 'briques intégrées' },
      { value: '3', label: 'langues d’interface' },
      { value: '0', label: 'faux signal assumé' },
      { value: '100 %', label: 'calculs vérifiables' },
    ],
    jyntrackBadge: 'LABORATOIRE JYNTRACK',
    jyntrackTitle: 'Explorer plusieurs futurs possibles, sans les vendre comme certains',
    jyntrackText:
      'JYNTRACK prolonge la plateforme par un laboratoire probabiliste : il ne prédit pas le marché, il construit plusieurs mondes cohérents à partir de l’historique réel de l’instrument, puis les confronte à des modèles Meta et, plus tard, au marché effectivement observé.',
    jyntrackPoints: [
      {
        title: 'Mondes parallèles',
        text: 'Six scénarios — continuation, retournement, consolidation, choc de volatilité, rupture de corrélation, réaction à un événement — construits par bootstrap sur les rendements réels.',
      },
      {
        title: 'War Room Meta',
        text: 'Cinq rôles (stratège, opposant, chercheur, architecte du risque, juge) délibèrent sur les chiffres de la simulation. Chaque réponse provient d’un modèle Meta réel ; un échec reste affiché comme un échec.',
      },
      {
        title: 'Évolution de stratégies',
        text: 'Un backtest réel sélectionne des variantes sur 70 % de l’historique, puis les valide sur les 30 % restants, hors échantillon.',
      },
      {
        title: 'Reality Tracker',
        text: 'Vos hypothèses sont conservées localement puis comparées aux clôtures réellement observées, avec un historique de vérifications et une calibration descriptive.',
      },
    ],
    jyntrackCta: 'Ouvrir JYNTRACK',
    jyntrackNote: 'Aucune transaction n’est déclenchée automatiquement. Une distribution n’est pas une prévision.',
    learningBadge: 'APPRENDRE & COMPRENDRE',
    learningTitle: 'Deux espaces pour prolonger l’analyse',
    learningSubtitle: 'L’Académie transmet les fondations ; les Actualités replacent chaque mouvement de marché dans son contexte.',
    academySpotlightBadge: 'ACADÉMIE INTERACTIVE',
    academySpotlightTitle: 'Transformer la théorie en réflexes de marché',
    academySpotlightText: 'L’Académie est le volet pédagogique de JYNTRA AI. Elle prolonge l’expérience de la plateforme avec des parcours structurés et progressifs pour comprendre les marchés et approfondir les concepts utilisés dans les analyses.',
    academySpotlightPoints: [
      'Parcours progressifs : des fondamentaux du marché aux concepts Smart Money (Order Blocks, FVG, BOS, CHoCH).',
      'Schémas pédagogiques et exemples concrets pour relier chaque notion à une lecture de marché.',
      'Quiz de validation à la fin des modules pour vérifier les acquis et mesurer la progression.',
      'Une pédagogie qui prolonge directement les analyses, le journal et les rappels de gestion du risque.',
    ],
    academySpotlightCta: 'Explorer l’Académie',
    academySpotlightNote: 'Une progression structurée, sans promesse de gains.',
    newsSpotlightBadge: 'ACTUALITÉS FINANCIÈRES',
    newsSpotlightTitle: 'Remettre chaque mouvement de marché dans son contexte',
    newsSpotlightText: 'L’espace Actualités rassemble des informations récentes sur les marchés, l’économie, les entreprises, les devises, la crypto et les banques centrales. Il aide à comprendre le contexte autour des prix et des analyses, sans remplacer une lecture personnelle.',
    newsSpotlightPoints: [
      'Titres issus de sources financières publiques, avec la source et la date de publication clairement affichées.',
      'Images fournies par les médias lorsqu’elles sont disponibles, avec un visuel de repli honnête dans le cas contraire.',
      'Liens directs vers l’article original pour consulter et vérifier l’information à sa source.',
      'Un fil régulièrement mis à jour, qui complète l’analyse des marchés et le travail des agents.',
    ],
    newsSpotlightCta: 'Consulter les actualités',
    newsSpotlightNote: 'Aucun article n’est généré par IA ; le fil ne remplace pas une analyse.',
    ctaTitle: 'Prêt à structurer votre analyse ?',
    ctaText: 'Créez un compte et testez la plateforme sur vos propres graphiques. Aucune promesse de performance, seulement des outils que vous pouvez vérifier.',
    footerNote: 'JYNTRA AI est un outil d’aide à la décision. Il ne fournit pas de conseil en investissement.',
  },
  en: {
    badge: 'ABOUT',
    title: 'JYNTRA AI',
    tagline: 'Your AI. Your Edge.',
    intro:
      'JYNTRA AI brings together the tools a trader actually needs: assisted market reading, adversarial debate, risk management, backtesting, a trading journal and a holographic assistant. No fake signals, no profit promises.',
    ctaPrimary: 'Explore the platform',
    ctaSecondary: 'Create an account',
    ctaSecondaryAuth: 'Explore the Academy',
    missionBadge: 'OUR MISSION',
    missionTitle: 'Make market analysis clearer, not louder.',
    missionText:
      'Most platforms add indicators. JYNTRA AI adds structure: every analysis separates what is observed, what is interpreted and what remains a hypothesis. The goal is not to predict the market, but to make your decisions more readable, documented and disciplined.',
    pillarsTitle: 'What structures the platform',
    pillarsSubtitle: 'Six building blocks designed to work together, with the same data and the same traceability.',
    pillars: [
      {
        icon: CandlestickChart,
        title: 'SMC chart analysis',
        text: 'Detection of market structure, Order Blocks, Fair Value Gaps, BOS and CHoCH, with annotations rendered deterministically from detected data.',
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/25',
      },
      {
        icon: Users,
        title: 'Multi-agent committee',
        text: 'Several agents confront their readings, including a Red-Team tasked with hunting liquidity traps and scenarios that invalidate the main thesis.',
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/25',
      },
      {
        icon: Gauge,
        title: 'Risk & position sizing',
        text: 'Position size, Stop-Loss distance, risk/reward ratio and exposure: calculations stay deterministic and verifiable.',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/25',
      },
      {
        icon: BarChart3,
        title: 'Backtesting',
        text: 'Evaluate a strategy on real market history, with explicit metrics and no invented equity curve.',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
      },
      {
        icon: BookOpen,
        title: 'Journal & Academy',
        text: 'A decision journal comparable from one trade to the next, plus structured lessons with objectives, examples and quizzes.',
        color: 'text-sky-500',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/25',
      },
      {
        icon: Mic,
        title: 'LYNARA',
        text: 'A female holographic assistant, in text and voice, explaining, reformulating and reminding risk rules in the user’s language.',
        color: 'text-fuchsia-500',
        bg: 'bg-fuchsia-500/10',
        border: 'border-fuchsia-500/25',
      },
    ],
    principlesBadge: 'OUR VALUES',
    principlesTitle: 'The vision behind every module',
    principles: [
      'Make every analysis readable: observations, interpretations and hypotheses clearly separated.',
      'Put risk management at the centre of every decision, before the search for performance.',
      'Give every trader tools they can understand, verify and reproduce.',
      'Advance financial education, in each person’s language and at their own pace.',
      'Build useful, fast AI that respects its users’ data.',
    ],
    metaBadge: 'AI INTEGRATION',
    metaTitle: 'Meta intelligence, working for your analysis',
    metaText:
      'JYNTRA AI is an intelligent web platform that relies on Meta AI models to understand your messages, read your charts and support your market decisions.',
    metaPoints: [
      'Natural language understanding, including multilingual messages.',
      'Multimodal analysis: reading chart screenshots and images.',
      'Reasoning and analysis to structure a clear market view.',
      'Intelligent assistance and natural interactions with LYNARA.',
      'Chart analysis and trading: structures, zones and trade plans.',
      'Data processing and the platform’s AI features.',
    ],
    stats: [
      { value: '6', label: 'integrated building blocks' },
      { value: '3', label: 'interface languages' },
      { value: '0', label: 'assumed fake signal' },
      { value: '100%', label: 'verifiable maths' },
    ],
    jyntrackBadge: 'JYNTRACK LABORATORY',
    jyntrackTitle: 'Explore several possible futures, without selling them as certainties',
    jyntrackText:
      'JYNTRACK extends the platform with a probabilistic laboratory: it does not predict the market, it builds several coherent worlds from the instrument’s real history, then confronts them with Meta models and, later, with the market actually observed.',
    jyntrackPoints: [
      {
        title: 'Parallel worlds',
        text: 'Six scenarios — continuation, reversal, consolidation, volatility shock, correlation break, event reaction — built by bootstrapping real returns.',
      },
      {
        title: 'Meta War Room',
        text: 'Five roles (strategist, opponent, researcher, risk architect, judge) deliberate on the simulation figures. Every answer comes from a real Meta model; a failure is displayed as a failure.',
      },
      {
        title: 'Strategy evolution',
        text: 'A real backtest selects variants on 70% of the history, then validates them out of sample on the remaining 30%.',
      },
      {
        title: 'Reality Tracker',
        text: 'Your hypotheses are kept locally and compared with the closes actually observed, with a verification history and a descriptive calibration.',
      },
    ],
    jyntrackCta: 'Open JYNTRACK',
    jyntrackNote: 'No transaction is triggered automatically. A distribution is not a forecast.',
    learningBadge: 'LEARN & UNDERSTAND',
    learningTitle: 'Two spaces that extend the analysis',
    learningSubtitle: 'The Academy builds the foundations; the News feed puts every market move back into context.',
    academySpotlightBadge: 'INTERACTIVE ACADEMY',
    academySpotlightTitle: 'Turn theory into market reflexes',
    academySpotlightText: 'The Academy is the educational side of JYNTRA AI. It extends the platform experience with structured, progressive paths to understand markets and deepen the concepts used in your analyses.',
    academySpotlightPoints: [
      'Progressive paths: from market fundamentals to Smart Money concepts (Order Blocks, FVG, BOS, CHoCH).',
      'Educational diagrams and concrete examples that connect each concept to a market reading.',
      'End-of-module quizzes to check what you have learned and track your progress.',
      'A learning approach that directly extends analyses, the journal and risk-management reminders.',
    ],
    academySpotlightCta: 'Explore the Academy',
    academySpotlightNote: 'Structured progress, with no promise of profits.',
    newsSpotlightBadge: 'FINANCIAL NEWS',
    newsSpotlightTitle: 'Put every market move back into context',
    newsSpotlightText: 'The News space gathers recent information on markets, the economy, companies, currencies, crypto and central banks. It helps you understand the context around prices and analyses, without replacing your own reading.',
    newsSpotlightPoints: [
      'Headlines from public financial sources, with the source and publication date clearly displayed.',
      'Images provided by publishers when available, with an honest fallback visual otherwise.',
      'Direct links to the original article so you can read and verify the information at its source.',
      'A regularly updated feed that complements market analysis and the work of the agents.',
    ],
    newsSpotlightCta: 'View the news',
    newsSpotlightNote: 'No article is AI-generated; the feed does not replace an analysis.',
    ctaTitle: 'Ready to structure your analysis?',
    ctaText: 'Create an account and test the platform on your own charts. No performance promise, only tools you can verify.',
    footerNote: 'JYNTRA AI is a decision-support tool. It does not provide investment advice.',
  },
  mg: {
    badge: 'MOMBA ANAY',
    title: 'JYNTRA AI',
    tagline: 'Ny IA anao. Ny tombony anao.',
    intro:
      "JYNTRA AI dia manangona ao amin’ny sehatra iray ny fitaovana tena ilain’ny mpivarotra: famakafakana ny tsena, adihevitra misy fomba maro, fitantanana risika, backtesting, journal ary mpanampy holografika. Tsy misy signal sandoka, tsy misy fampanantenana tombony.",
    ctaPrimary: 'Hijery ny sehatra',
    ctaSecondary: 'Hamorona kaonty',
    ctaSecondaryAuth: 'Jereo ny Akademia',
    missionBadge: 'NY TANJONAY',
    missionTitle: 'Hanao ny famakafakana tsena ho mazava kokoa, fa tsy be feo.',
    missionText:
      'Manampy indicator ny ankamaroan’ny sehatra. JYNTRA AI kosa manampy rafitra: ny famakafakana tsirairay dia manavaka izay hita, izay adika ary izay mbola hypothèse. Tsy ny haminavina ny tsena no tanjona, fa ny hanao ny fanapahan-kevitra ho mazava, voarakitra ary voafehy.',
    pillarsTitle: 'Izay mandrafitra ny sehatra',
    pillarsSubtitle: 'Singa enina natao hiara-miasa, mitovy angona sy mitovy traceability.',
    pillars: [
      {
        icon: CandlestickChart,
        title: 'Famakafakana graphique SMC',
        text: 'Famantarana ny rafitry ny tsena, Order Blocks, Fair Value Gaps, BOS sy CHoCH, miaraka amin’ny annotation voasoratra mazava avy amin’ny angona hita.',
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/25',
      },
      {
        icon: Users,
        title: 'Komity agents maro',
        text: 'Mifanandrina ny famakiana ataon’ny agents maro, anisan’izany ny Red-Team mikatsaka ny fandrika liquidity sy ny scénario manafoana ny hevitra fototra.',
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/25',
      },
      {
        icon: Gauge,
        title: 'Risika & haben’ny position',
        text: 'Haben’ny position, halavirana amin’ny Stop-Loss, ratio Risika/Tombony ary exposition: tsy miova ary azo hamarinina ny kajy.',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/25',
      },
      {
        icon: BarChart3,
        title: 'Backtesting',
        text: 'Fanombanana paikady amin’ny tantaran’ny tsena tena izy, miaraka amin’ny metrics mazava ary tsy misy courbe noforonina.',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
      },
      {
        icon: BookOpen,
        title: 'Journal & Akademia',
        text: 'Journal fanapahan-kevitra azo ampitahaina isaky ny trade, ary lesona voarindra misy tanjona, ohatra ary quiz.',
        color: 'text-sky-500',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/25',
      },
      {
        icon: Mic,
        title: 'LYNARA',
        text: 'Mpanampy holografika vehivavy, amin’ny soratra sy feo, manazava, mamerina ary mampahatsiahy ny fitsipiky ny risika amin’ny fitenin’ny mpampiasa.',
        color: 'text-fuchsia-500',
        bg: 'bg-fuchsia-500/10',
        border: 'border-fuchsia-500/25',
      },
    ],
    principlesBadge: 'NY SOATOAVINAY',
    principlesTitle: 'Ny vinavina mitarika ny singa rehetra',
    principles: [
      'Hanao ny famakafakana tsirairay ho mazava: misaraka ny hita, ny adika ary ny hypothèse.',
      'Hametraka ny fitantanana risika ao afovoan’ny fanapahan-kevitra rehetra, alohan’ny fikatsahana tombony.',
      'Hanome fitaovana azon’ny mpivarotra tsirairay takarina, hamarinina ary averina.',
      'Handroso ny fampianarana ara-bola, amin’ny fitenin’ny tsirairay sy amin’ny hafainganam-pandehany.',
      'Hanangana IA mahasoa, haingana ary manaja ny angon’ny mpampiasa.',
    ],
    metaBadge: 'FAMPIDIRANA IA',
    metaTitle: 'Ny faharanitan’ny Meta, ho an’ny famakafakanao',
    metaText:
      'JYNTRA AI dia sehatra web marani-tsaina miankina amin’ny modely IA an’ny Meta mba hahatakarana ny hafatrao, hamakiana ny graphiquenao ary hanampy amin’ny fanapahan-kevitrao eo amin’ny tsena.',
    metaPoints: [
      'Fahatakarana voajanahary ny fiteny, anisan’izany ny hafatra amin’ny fiteny maro.',
      'Famakafakana multimodal: famakiana sary graphique sy sary hafa.',
      'Fisainana sy famakafakana hanoratana famakiana tsena mazava.',
      'Fanampiana marani-tsaina sy fifandraisana voajanahary amin’i LYNARA.',
      'Famakafakana graphique sy trading: rafitra, faritra ary drafitry ny varotra.',
      'Fikirakirana angona sy fitaovana IA ao amin’ny sehatra.',
    ],
    stats: [
      { value: '6', label: 'singa tafiditra' },
      { value: '3', label: 'fitenin’ny interface' },
      { value: '0', label: 'signal sandoka ekena' },
      { value: '100 %', label: 'kajy azo hamarinina' },
    ],
    jyntrackBadge: 'LABORATOARA JYNTRACK',
    jyntrackTitle: 'Handinika hoavy mety hitranga maro, nefa tsy hivarotra azy ho antoka',
    jyntrackText:
      'Manitatra ny sehatra amin’ny laboratoara probabilista i JYNTRACK: tsy maminavina ny tsena izy, fa manangana tontolo maro mifanaraka amin’ny tantaran’ny fitaovana tena izy, avy eo mampitaha azy ireo amin’ny modely Meta sy amin’ny tsena tena hita any aoriana.',
    jyntrackPoints: [
      {
        title: 'Tontolo mifanindran-dàlana',
        text: 'Senario enina — fanohizana, fivadihana, fanamafisana, shock volatilité, fandravana fifandraisana, fihetsika amin’ny zava-nitranga — naorina tamin’ny bootstrap amin’ny vokatra tena izy.',
      },
      {
        title: 'War Room Meta',
        text: 'Dimanjaka dimy (stratejista, mpanohitra, mpikaroka, mpanao risika, mpitsara) no mifanakalo hevitra momba ny tarehimarika simulation. Ny valiny tsirairay dia avy amin’ny modely Meta tena izy; aseho ho fahavoazana ny fahavoazana.',
      },
      {
        title: 'Fivoaran’ny paikady',
        text: 'Backtest tena izy no misafidy variants amin’ny 70 % amin’ny tantara, avy eo mamarinina amin’ny 30 % sisa, ivelan’ny santionany.',
      },
      {
        title: 'Reality Tracker',
        text: 'Tehirizina eto an-toerana ny hevitrao ary ampitahaina amin’ny fanidiana tena hita, miaraka amin’ny tantaran’ny fanamarinana sy kalibrasiona mamaritra.',
      },
    ],
    jyntrackCta: 'Hanokatra JYNTRACK',
    jyntrackNote: 'Tsy misy fifanakalozana atao automatique. Tsy faminaniana ny fizarana.',
    learningBadge: 'MIANARA & MAHAFANTATRA',
    learningTitle: 'Sehatra roa hanitarana ny famakafakana',
    learningSubtitle: 'Ny Akademia no manangana ny fototra; ny Vaovao kosa mamerina ny fihetsiky ny tsena tsirairay ao anatin’ny toe-javatra misy azy.',
    academySpotlightBadge: 'AKADEMIA IFANARAHANA',
    academySpotlightTitle: 'Hanova ny teoria ho fahaizana mamaky tsena',
    academySpotlightText: 'Ny Akademia no sampana fampianarana ao amin’ny JYNTRA AI. Manitarana ny traikefa amin’ny sehatra izy amin’ny alalan’ny lalana voarindra sy miandalana hahatakarana ny tsena sy handalinana ny foto-kevitra ampiasaina amin’ny famakafakana.',
    academySpotlightPoints: [
      'Lalana miandalana: avy amin’ny fototry ny tsena ka hatramin’ny foto-kevitra Smart Money (Order Blocks, FVG, BOS, CHoCH).',
      'Sary fampianarana sy ohatra mivaingana mampifandray ny foto-kevitra tsirairay amin’ny famakiana tsena.',
      'Quiz fanamarinana amin’ny faran’ny module hijerena ny fahalalana azo sy handrefesana ny fandrosoana.',
      'Fampianarana mifandray mivantana amin’ny famakafakana, ny journal ary ny fampahatsiahivana fitantanana risika.',
    ],
    academySpotlightCta: 'Jereo ny Akademia',
    academySpotlightNote: 'Fandrosoana voarindra, tsy misy fampanantenana tombony.',
    newsSpotlightBadge: 'VAOVAO ARA-BOLA',
    newsSpotlightTitle: 'Mamerina ny fihetsiky ny tsena tsirairay ao anatin’ny toe-javatra misy azy',
    newsSpotlightText: 'Ny sehatra Vaovao dia manangona vaovao farany momba ny tsena, toe-karena, orinasa, vola vahiny, crypto ary banky foibe. Manampy hahatakatra ny toe-javatra manodidina ny vidiny sy ny famakafakana izy, nefa tsy misolo ny famakiana manokana.',
    newsSpotlightPoints: [
      'Lohateny avy amin’ny loharano ara-bola ampahibemaso, miaraka amin’ny loharano sy ny daty famoahana aseho mazava.',
      'Sary omen’ny mpamoaka vaovao raha misy, ary sary fanoloana marina raha tsy misy.',
      'Rohy mivantana mankany amin’ny lahatsoratra tany am-boalohany hijerena sy hanamarinana ny vaovao.',
      'Fil vaovao havaozina tsy tapaka, manampy amin’ny famakafakana ny tsena sy ny asan’ny agents.',
    ],
    newsSpotlightCta: 'Jereo ny vaovao',
    newsSpotlightNote: 'Tsy misy lahatsoratra noforonin’ny AI; tsy misolo ny famakafakana ny fil vaovao.',
    ctaTitle: 'Vonona handrindra ny famakafakanao?',
    ctaText: 'Mamoròna kaonty ary andramo amin’ny graphiquenao manokana ny sehatra. Tsy misy fampanantenana performance, fitaovana azo hamarinina ihany.',
    footerNote: 'Fitaovana fanampiana amin’ny fanapahan-kevitra ny JYNTRA AI. Tsy manome torohevitra fampiasam-bola izy.',
  },
} as const;

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, isAuthenticated }) => {
  const { language } = useLanguage();
  const lang: AboutLang = language === 'en' ? 'en' : language === 'mg' ? 'mg' : 'fr';
  const c = copy[lang];

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const primaryTarget = isAuthenticated ? 'workspace' : 'login';

  return (
    <div className="relative overflow-hidden bg-[#080B10] light:bg-slate-50">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.10),transparent_55%)]"
      />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-7">
          <div className="jyntra-enter inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 text-[11px] font-black font-mono uppercase tracking-[0.22em]">
            <BrainCircuit className="w-3.5 h-3.5" />
            {c.badge}
          </div>

          <div className="jyntra-enter jyntra-enter-1 space-y-3">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white dark:text-white light:text-slate-900">
              {c.title}
            </h1>
            <p className="text-sm sm:text-base font-mono uppercase tracking-[0.32em] text-cyan-500 dark:text-cyan-400">
              {c.tagline}
            </p>
          </div>

          <p className="jyntra-enter jyntra-enter-2 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed text-slate-300 dark:text-slate-300 light:text-slate-600 text-pretty">
            {c.intro}
          </p>

          <div className="jyntra-enter jyntra-enter-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate(primaryTarget)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {c.ctaPrimary}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate(isAuthenticated ? 'academy' : 'register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 text-white border border-slate-700/80 font-bold text-sm transition-all light:bg-white light:text-slate-800 light:border-slate-300 light:hover:bg-slate-100"
            >
              {isAuthenticated ? c.ctaSecondaryAuth : c.ctaSecondary}
            </button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {c.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/50 px-5 py-5 text-center backdrop-blur light:bg-white light:border-slate-200"
            >
              <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
                {stat.value}
              </div>
              <div className="mt-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section data-reveal className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 p-7 sm:p-10 light:from-white light:via-white light:to-slate-50 light:border-slate-200">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl"
          />
          <div className="relative grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
                <Fingerprint className="w-4 h-4" />
                {c.missionBadge}
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-black leading-tight text-white dark:text-white light:text-slate-900 text-balance">
                {c.missionTitle}
              </h2>
            </div>
            <p className="lg:col-span-8 text-sm sm:text-base leading-relaxed text-slate-300 light:text-slate-600">
              {c.missionText}
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section data-reveal className="px-4 sm:px-6 lg:px-8 py-20 border-y border-slate-800/70 bg-[#06090E] light:bg-white light:border-slate-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white dark:text-white light:text-slate-900 text-balance">
              {c.pillarsTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 light:text-slate-600">{c.pillarsSubtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {c.pillars.map((pillar) => (
              <article
                key={pillar.title}
                className={`group relative rounded-2xl border ${pillar.border} bg-slate-900/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/90 light:bg-white light:border-slate-200 light:hover:bg-white light:shadow-lg light:shadow-slate-200/60`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${pillar.bg} ${pillar.color} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}
                >
                  <pillar.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">{pillar.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400 light:text-slate-600">{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Principles + Meta */}
      <section data-reveal className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 sm:p-9 light:bg-white light:border-slate-200">
            <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              {c.principlesBadge}
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 text-balance">
              {c.principlesTitle}
            </h2>
            <ul className="mt-7 space-y-4">
              {c.principles.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                  <span className="text-[13px] sm:text-sm leading-relaxed text-slate-300 light:text-slate-600">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 sm:p-9 light:bg-white light:border-slate-200">
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-sky-500">
                  <Cpu className="w-4 h-4" />
                  {c.metaBadge}
                </div>
                <img
                  src="/assets/meta-logo.svg"
                  alt="Meta"
                  className="meta-logo h-6 w-auto opacity-80 light:opacity-100"
                  loading="lazy"
                />
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 text-balance">
                {c.metaTitle}
              </h2>
              <p className="mt-4 text-[13px] sm:text-sm leading-relaxed text-slate-400 light:text-slate-600">
                {c.metaText}
              </p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                {c.metaPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 rounded-xl border border-slate-800/70 bg-slate-950/40 px-3.5 py-3 text-[13px] text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-600">
                    <BrainCircuit className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 light:text-slate-500">
                <Brain className="w-3 h-3" />
                Modèles Meta · compréhension multimodale
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JYNTRACK */}
      <section
        data-reveal
        className="px-4 sm:px-6 lg:px-8 pb-20 border-t border-slate-800/70 bg-[#06090E] pt-20 light:bg-white light:border-slate-200"
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-slate-900/80 to-cyan-500/10 p-7 sm:p-10 light:from-violet-50 light:via-white light:to-cyan-50 light:border-violet-200">
            <div
              aria-hidden="true"
              className="absolute -top-24 right-0 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl"
            />
            <div className="relative grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-violet-400">
                  <Orbit className="w-4 h-4" />
                  {c.jyntrackBadge}
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl font-black leading-tight text-white dark:text-white light:text-slate-900 text-balance">
                  {c.jyntrackTitle}
                </h2>
                <p className="mt-4 text-[13px] sm:text-sm leading-relaxed text-slate-300 light:text-slate-600">
                  {c.jyntrackText}
                </p>
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'jyntrack' : 'login')}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5"
                >
                  {c.jyntrackCta}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="mt-4 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  {c.jyntrackNote}
                </p>
              </div>

              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
                {c.jyntrackPoints.map((point, index) => (
                  <article
                    key={point.title}
                    className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 light:border-slate-200 light:bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-violet-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-sm font-bold text-white light:text-slate-900">{point.title}</h3>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-slate-400 light:text-slate-600">
                      {point.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academy & Financial News */}
      <section
        data-reveal
        className="px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/70 bg-[#080B10] light:bg-slate-50"
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400">
              <BookOpen className="w-4 h-4" />
              {c.learningBadge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white dark:text-white light:text-slate-900 text-balance">
              {c.learningTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 light:text-slate-600">
              {c.learningSubtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <article className="relative overflow-hidden rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-slate-900/80 to-slate-950/80 p-7 sm:p-9 light:from-sky-50 light:via-white light:to-slate-50 light:border-sky-200">
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl"
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-sky-500">
                  <GraduationCap className="w-4 h-4" />
                  {c.academySpotlightBadge}
                </div>
                <h3 className="mt-4 text-2xl sm:text-3xl font-black leading-tight text-white dark:text-white light:text-slate-900 text-balance">
                  {c.academySpotlightTitle}
                </h3>
                <p className="mt-4 text-[13px] sm:text-sm leading-relaxed text-slate-300 light:text-slate-600">
                  {c.academySpotlightText}
                </p>

                <ul className="mt-6 space-y-3">
                  {c.academySpotlightPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                      <span className="text-[12px] sm:text-[13px] leading-relaxed text-slate-300 light:text-slate-600">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onNavigate(isAuthenticated ? 'academy' : 'register')}
                  className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5"
                >
                  {c.academySpotlightCta}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="mt-4 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  {c.academySpotlightNote}
                </p>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-950/80 p-7 sm:p-9 light:from-emerald-50 light:via-white light:to-slate-50 light:border-emerald-200">
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-[11px] font-black font-mono uppercase tracking-[0.2em] text-emerald-500">
                  <Newspaper className="w-4 h-4" />
                  {c.newsSpotlightBadge}
                </div>
                <h3 className="mt-4 text-2xl sm:text-3xl font-black leading-tight text-white dark:text-white light:text-slate-900 text-balance">
                  {c.newsSpotlightTitle}
                </h3>
                <p className="mt-4 text-[13px] sm:text-sm leading-relaxed text-slate-300 light:text-slate-600">
                  {c.newsSpotlightText}
                </p>

                <ul className="mt-6 space-y-3">
                  {c.newsSpotlightPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span className="text-[12px] sm:text-[13px] leading-relaxed text-slate-300 light:text-slate-600">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onNavigate(isAuthenticated ? 'news' : 'register')}
                  className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                >
                  {c.newsSpotlightCta}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="mt-4 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  {c.newsSpotlightNote}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        data-reveal
        className="px-4 sm:px-6 lg:px-8 pb-24 pt-4"
      >
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-950/90 p-8 sm:p-12 text-center light:from-cyan-50 light:via-white light:to-slate-50 light:border-cyan-200">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
          />
          <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-6">
            <LineChart className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white dark:text-white light:text-slate-900 text-balance">
            {c.ctaTitle}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
            {c.ctaText}
          </p>
          <button
            onClick={() => onNavigate(primaryTarget)}
            className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5"
          >
            {c.ctaPrimary}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-6 text-[11px] text-slate-500 light:text-slate-500">{c.footerNote}</p>
        </div>
      </section>
    </div>
  );
};
