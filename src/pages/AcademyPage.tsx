import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { academyModulesEn, academyModulesMg } from '../i18n/academyContent';
import { parseYouTubeUrl } from '../config/youtube';
import {
  GraduationCap,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Shield,
  Layers,
  Cpu,
  Brain,
  CheckCircle2,
  Award,
  PlayCircle,
  HelpCircle,
  AlertTriangle,
  Flame,
  LineChart,
  Check,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AcademyModule {
  id: string;
  number: string;
  title: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert';
  duration: string;
  summary: string;
  videoUrl: string;
  videoTitle: string;
  sections: {
    heading: string;
    text: string;
    bulletPoints?: string[];
    warningNote?: string;
  }[];
  svgDiagramType: 'candlestick' | 'smc' | 'risk' | 'structure' | 'mt4' | 'liquidity' | 'plan';
  quiz: QuizQuestion;
}

/** Lecteur YouTube officiel intégré, responsive 16:9, sans quitter la page. */
const LessonVideo: React.FC<{ url: string; title: string; label: string }> = ({ url, title, label }) => {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) {
    return (
      <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 text-xs text-amber-300">
        Vidéo indisponible : le lien configuré pour cette leçon n'est pas une URL YouTube valide.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl">
        <iframe
          src={parsed.embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PlayCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="text-[11px] text-slate-300 truncate">
            <span className="font-bold text-white">{label} :</span> {title}
          </span>
        </div>
        <a
          href={parsed.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-orange-400 transition-colors shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          Ouvrir sur YouTube
        </a>
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        Vidéo pédagogique externe, diffusée par son auteur via le lecteur officiel YouTube. Sa disponibilité
        peut évoluer ; le lien direct permet de la vérifier.
      </p>
    </div>
  );
};

export const AcademyPage: React.FC = () => {
  const { t, currentLang } = useLanguage();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('mod-1');
  const [completedModules, setCompletedModules] = useState<string[]>(['mod-1']);
  const [userQuizAnswer, setUserQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const modules: AcademyModule[] = [
    {
      id: 'mod-1',
      number: '01',
      title: 'Fondamentaux des Marchés Financiers',
      level: 'Débutant',
      duration: '15 min',
      summary: 'Comprendre les mécanismes essentiels : paires de devises, bid/ask, spread, pips et effet de levier.',
      videoUrl: 'https://www.youtube.com/watch?v=_S3i7DTGg58',
      videoTitle: 'Levier, lot, spread et pips expliqués',
      svgDiagramType: 'structure',
      sections: [
        {
          heading: 'Anatomie d’une Cotation & Spread',
          text: 'Sur tous les marchés financiers (Forex, Crypto, Indices), chaque instrument est coté en deux prix : le Bid (prix d’achat par le courtier) et l’Ask (prix de vente). La différence entre ces deux valeurs s’appelle le Spread.',
          bulletPoints: [
            'Pip (Percentage in Point) : La plus petite unité de variation standard (généralement la 4ème décimale sur EUR/USD : 0.0001).',
            'Spread : Coût de transaction immédiat prélevé par le courtier à l’ouverture.',
            'Effet de levier : Amplificateur de capital. Un levier 1:30 permet de contrôler 30 000 $ avec 1 000 $ de marge.',
          ],
          warningNote: 'L’effet de levier amplifie les gains mais accélère identiquement les pertes. Ne tradez jamais avec un levier excessif sans Stop-Loss strict.',
        },
        {
          heading: 'Les Types d’Ordres d’Exécution',
          text: 'L’exécution sur le marché se décompose en ordres au marché (immédiats) et ordres en attente (Buy Limit, Sell Limit, Buy Stop, Sell Stop).',
          bulletPoints: [
            'Market Order : Exécution instantanée au meilleur prix disponible.',
            'Limit Order : Achat au-dessous du prix actuel ou vente au-dessus (anticipation de rebond).',
            'Stop Order : Achat au-dessus du prix actuel ou vente au-dessous (anticipation de cassure de niveau).',
          ],
        },
      ],
      quiz: {
        question: 'Sur EUR/USD coté à 1.08500, si le prix grimpe à 1.08550, de combien de pips le marché a-t-il augmenté ?',
        options: ['0.5 pip', '5 pips', '50 pips', '500 pips'],
        correctIndex: 1,
        explanation: 'Sur les paires en 4 décimales, 0.0001 correspond à 1 pip. Une variation de 0.00050 équivaut exactement à 5 pips.',
      },
    },
    {
      id: 'mod-2',
      number: '02',
      title: 'Chandeliers Japonais & Price Action',
      level: 'Débutant',
      duration: '20 min',
      summary: 'Déchiffrer la psychologie des bougies : Open, High, Low, Close, absorption et rejets de prix.',
      videoUrl: 'https://www.youtube.com/watch?v=nLnjnJpNoxM',
      videoTitle: 'Comprendre toutes les bougies en trading',
      svgDiagramType: 'candlestick',
      sections: [
        {
          heading: 'Anatomie et Psychologie d’une Bougie',
          text: 'Chaque chandelier japonais synthétise l’affrontement entre acheteurs (Bulls) et vendeurs (Bears) sur une unité de temps (Timeframe).',
          bulletPoints: [
            'Le corps (Real Body) : Distance entre le cours d’ouverture et le cours de clôture.',
            'La mèche supérieure (Upper Shadow / Wick) : Le point culminant testé et rejeté par les vendeurs.',
            'La mèche inférieure (Lower Shadow / Wick) : Le creux testé et absorbé par les acheteurs.',
          ],
        },
        {
          heading: 'Patterns Fondamentaux de Rejet & Continuation',
          text: 'Les figures en chandelier ne s’interprètent jamais de manière isolée, mais toujours au contact d’un niveau clé institutionnel.',
          bulletPoints: [
            'Pinbar / Marteau (Hammer) : Longue mèche de rejet indiquant une absorption massive d’ordres institutionnels.',
            'Bougie d’Impulsion (Marubozu) : Corps plein sans mèches, signe d’agressivité unilatérale d’une partie.',
            'Doji : Clôture égale à l’ouverture, symbolisant une phase de transition ou d’indécision temporaire.',
          ],
          warningNote: 'Ne tradez jamais une Pinbar au milieu de nulle part. Un chandelier n’a de valeur que lorsqu’il réagit sur un support, une résistance ou un Order Block.',
        },
      ],
      quiz: {
        question: 'Que signifie une bougie dotée d’une très longue mèche inférieure et d’un petit corps clôturant près du sommet ?',
        options: [
          'Une forte pression vendeuse continue',
          'Un rejet violent des prix bas et une absorption massive par les acheteurs',
          'Une absence totale de volume sur le marché',
          'Une obligation d’ouvrir un ordre vendeur immédiat',
        ],
        correctIndex: 1,
        explanation: 'Une longue mèche basse montre que les vendeurs ont poussé les prix vers le bas, mais que les acheteurs ont absorbé toute l’offre pour refouler le cours vers le sommet.',
      },
    },
    {
      id: 'mod-3',
      number: '03',
      title: 'Structures de Marché & Tendances (BOS / CHoCH)',
      level: 'Intermédiaire',
      duration: '25 min',
      summary: 'Identifier les cycles de marché : Higher Highs (HH), Higher Lows (HL), Break of Structure et Change of Character.',
      videoUrl: 'https://www.youtube.com/watch?v=9O_b7_sV8JY',
      videoTitle: 'CHoCH et BOS : les structures de marché expliquées',
      svgDiagramType: 'structure',
      sections: [
        {
          heading: 'La Définition Algorithmique de la Tendance',
          text: 'Une tendance s’analyse par la succession de points d’inflexion (Swings) :',
          bulletPoints: [
            'Tendance Haussière (Bullish) : Série continue de sommets plus hauts (Higher Highs - HH) et de creux plus hauts (Higher Lows - HL).',
            'Tendance Baissière (Bearish) : Série continue de sommets plus bas (Lower Highs - LH) et de creux plus bas (Lower Lows - LL).',
            'Range (Consolidation) : Oscillation horizontale entre un plancher de support et un plafond de résistance.',
          ],
        },
        {
          heading: 'BOS (Break of Structure) vs CHoCH (Change of Character)',
          text: 'Ces deux concepts constituent la colonne vertébrale de l’analyse Smart Money Concepts :',
          bulletPoints: [
            'BOS (Break of Structure) : Cassure dans le sens de la tendance actuelle (ex: nouveau plus haut en tendance haussière). Confirme la continuation.',
            'CHoCH (Change of Character) : Première cassure du dernier creux ayant généré un plus haut. Alerte majeure d’un retournement probable de tendance.',
          ],
          warningNote: 'Attendez toujours une clôture nette du corps de la bougie au-delà du swing point pour valider un BOS ou un CHoCH. Une simple mèche constitue souvent un piège de liquidité.',
        },
      ],
      quiz: {
        question: 'En tendance haussière, quelle cassure signale un possible retournement baissier (CHoCH) ?',
        options: [
          'Le dépassement du précédent sommet (Higher High)',
          'La rupture nette du dernier creux protégé (Higher Low)',
          'L’apparition d’un doji sur l’unité de temps M1',
          'Un croisement quelconque de moyennes mobiles',
        ],
        correctIndex: 1,
        explanation: 'En tendance haussière, le Higher Low est le creux de référence. Sa rupture nette constitue le Change of Character (CHoCH), invalidant la structure haussière.',
      },
    },
    {
      id: 'mod-4',
      number: '04',
      title: 'Smart Money Concepts (SMC) : Order Blocks & FVG',
      level: 'Avancé',
      duration: '30 min',
      summary: 'Comprendre les traces institutionnelles : Order Blocks (OB), Fair Value Gaps (FVG) et chasses de liquidité.',
      videoUrl: 'https://www.youtube.com/watch?v=9Gt1v3NoVDQ',
      videoTitle: 'Les concepts ICT/SMC expliqués de A à Z',
      svgDiagramType: 'smc',
      sections: [
        {
          heading: 'Qu’est-ce qu’un Order Block (OB) ?',
          text: 'Les banques centrales et fonds institutionnels déplacent des milliards. Pour accumuler leurs positions sans déstabiliser immédiatement le carnet d’ordres, elles laissent des traces géométriques reconnaissables.',
          bulletPoints: [
            'Bullish Order Block : La dernière bougie baissière précédant une forte impulsion haussière qui casse la structure.',
            'Bearish Order Block : La dernière bougie haussière précédant une violente impulsion baissière.',
            'Mitigation : Le retour du prix tester la zone de l’Order Block pour combler les ordres restants avant la reprise du mouvement.',
          ],
        },
        {
          heading: 'Fair Value Gaps (FVG) & Déséquilibres de Liquidité',
          text: 'Un FVG est un vide de liquidité créé lors d’une impulsion violente de 3 bougies consécutives.',
          bulletPoints: [
            'Anatomie du FVG : Espace vide entre la mèche haute de la bougie 1 et la mèche basse de la bougie 3.',
            'Rôle d’aimant : L’algorithme de cotation interbancaire revient très fréquemment combler (rebalance) cette zone avant de poursuivre.',
            'Liquidity Sweeps (Chasses aux Stops) : Poussée éphémère au-delà des sommets évidents pour absorber les ordres stop avant d’inverser brutalement.',
          ],
        },
      ],
      quiz: {
        question: 'Comment se définit visuellement un Bullish Fair Value Gap (FVG) ?',
        options: [
          'Par une bougie doji parfaite sur un support',
          'Par l’écart de prix entre le sommet de la bougie 1 et le creux de la bougie 3 lors d’une forte hausse',
          'Par un croisement entre le RSI et le MACD',
          'Par deux chandeliers de couleur rouge consécutifs',
        ],
        correctIndex: 1,
        explanation: 'Un FVG haussier est un déséquilibre entre la mèche haute de la première bougie et la mèche basse de la troisième bougie, laissant un vide non mitigeable sur la deuxième bougie d’impulsion.',
      },
    },
    {
      id: 'mod-5',
      number: '05',
      title: 'Gestion Mathématique du Risque & Position Sizing',
      level: 'Expert',
      duration: '25 min',
      summary: 'La clé de voûte de la longévité : formule de calcul du lot, règle du 1%, ratio R:R et espérance mathématique.',
      videoUrl: 'https://www.youtube.com/watch?v=yoYS44CnD6I',
      videoTitle: 'Comment calculer simplement son risque en trading',
      svgDiagramType: 'risk',
      sections: [
        {
          heading: 'La Règle d’Or du 1 % et Formule du Lot',
          text: 'Aucun trade ne doit jamais risquer plus de 1 % à 2 % du capital total du compte. Le nombre de lots ne se choisit JAMAIS au hasard, il se déduit mathématiquement de la distance de votre Stop-Loss.',
          bulletPoints: [
            'Capital Exemple : 10 000 $ → Risque maximal par trade (1%) = 100 $.',
            'Distance Stop-Loss : 20 pips sur EUR/USD (1 pip par lot standard = 10 $).',
            'Taille de Position = Risque ($) / (Distance Pips * Valeur du Pip) = 100 / (20 * 10) = 0.50 Lot.',
          ],
          warningNote: 'Modifier la taille de son Stop-Loss pour « s’adapter » à une taille de lot arbitraire est la cause numéro 1 d’échec chez les débutants. Le Stop-Loss est fixé par la structure graphique, la taille de position est calculée.',
        },
        {
          heading: 'L’Espérance Mathématique et le Ratio Risque/Rendement (R:R)',
          text: 'Pour être profitable sur le long terme, votre ratio R:R moyen doit être supérieur ou égal à 1:2.',
          bulletPoints: [
            'Avec un R:R de 1:2, un taux de réussite de seulement 40% génère un gain net significatif sur 100 trades.',
            'Espérance = (Probabilité Gain * Montant Gain) - (Probabilité Perte * Montant Perte).',
            'JYNTRA AI invalide automatiquement tout trade dont le ratio R:R est inférieur à 1.5.',
          ],
        },
      ],
      quiz: {
        question: 'Sur un capital de 5 000 $, en appliquant la règle stricte du 1 %, quel est le montant maximal autorisé à perdre sur un trade ?',
        options: ['10 $', '50 $', '100 $', '500 $'],
        correctIndex: 1,
        explanation: '1 % de 5 000 $ est égal à 50 $. C’est la perte maximale totale autorisée si le Stop-Loss est touché.',
      },
    },
    {
      id: 'mod-6',
      number: '06',
      title: 'Configuration Pratique de MT4 & MT5 pour JYNTRA AI',
      level: 'Intermédiaire',
      duration: '15 min',
      summary: 'Paramétrage optimal de JYNTRATrader 4/5, raccourcis essentiels et export propre d’une capture pour la vision IA.',
      videoUrl: 'https://www.youtube.com/watch?v=1IQayDucc3c',
      videoTitle: 'Apprendre à trader sur MT4 : le guide pour débutants',
      svgDiagramType: 'mt4',
      sections: [
        {
          heading: 'Préparer un Graphique Épuré pour l’IA',
          text: 'La vision par ordinateur de JYNTRA AI analyse les structures de prix avec une précision maximale lorsque le graphique est clair et sans surcharge inutile.',
          bulletPoints: [
            'Thème recommandé : Fond sombre ou blanc neutre, chandeliers vert (haussier) et rouge (baissier).',
            'Désactiver la grille (Raccourci clavier MT4/MT5 : Ctrl + G) pour éviter les interférences avec les lignes de tendance.',
            'Afficher les unités de temps H1, H4 ou D1 pour filtrer le bruit des marchés.',
          ],
        },
        {
          heading: 'Exportation de la Capture d’Écran',
          text: 'Sous MT4 ou MT5 :',
          bulletPoints: [
            'Clic droit sur le graphique → Enregistrer comme image → Espace de travail actif (comme visible).',
            'Ou utilisez l’outil Capture de Windows (Win + Shift + S) ou Mac (Cmd + Shift + 4).',
            'Glissez-déposez le fichier dans JYNTRA AI → Analyse Graphique pour un décryptage instantané.',
          ],
        },
      ],
      quiz: {
        question: 'Pourquoi est-il conseillé de masquer la grille sous MT4/MT5 avant d’exporter pour JYNTRA AI ?',
        options: [
          'Parce que l’ordinateur plante sinon',
          'Pour offrir un contraste parfait facilitant la détection des structures SMC par la vision par ordinateur',
          'Parce que JYNTRATrader interdit la grille aux particuliers',
          'Cela n’a aucune importance technique',
        ],
        correctIndex: 1,
        explanation: 'Un graphique propre et sans grille permet aux algorithmes de vision par ordinateur (OCR et détection géométrique) de repérer fidèlement chaque mèche et niveau clé sans fausse alerte.',
      },
    },
    {
      id: 'mod-7',
      number: '07',
      title: 'Liquidité Institutionnelle & Chasses aux Stops',
      level: 'Avancé',
      duration: '20 min',
      summary: 'Identifier les zones où la liquidité s’accumule, distinguer un balayage (sweep) d’une vraie cassure de structure et placer son Stop-Loss en conséquence.',
      videoUrl: 'https://www.youtube.com/watch?v=uYZQrQqsMvI',
      videoTitle: 'Prise de liquidité ou cassure de structure ? (guide)',
      svgDiagramType: 'liquidity',
      sections: [
        {
          heading: 'Objectifs pédagogiques',
          text: 'À la fin de ce module, vous saurez :',
          bulletPoints: [
            'Repérer les poches de liquidité les plus probables (sommets et creux évidents, égaux, extrêmes de session).',
            'Distinguer un balayage de liquidité (sweep) d’une véritable cassure de structure.',
            'Placer un Stop-Loss au-delà de la zone de chasse plutôt que juste au niveau visible.',
            'Attendre une confirmation avant d’engager du capital.',
          ],
        },
        {
          heading: 'Où se trouve la liquidité ?',
          text: 'La liquidité n’est pas abstraite : elle se concentre là où les participants placent leurs ordres de protection. Un stop-loss d’acheteur est un ordre de vente au marché ; plus les stops sont regroupés, plus la zone attire les acteurs qui ont besoin de contrepartie.',
          bulletPoints: [
            'Sommets et creux évidents : au-dessus d’un plus haut clair se trouvent les stops des vendeurs et les ordres d’achat de cassure.',
            'Sommets ou creux égaux (equal highs / equal lows) : accumulation de stops à un même prix, souvent visée en priorité.',
            'Extrêmes de session : hauts et bas de la session asiatique, de Londres ou de New York.',
            'Chiffres ronds et niveaux psychologiques : zones où les ordres se densifient naturellement.',
          ],
        },
        {
          heading: 'Sweep ou cassure : le test de la clôture',
          text: 'Une mèche qui dépasse un niveau ne suffit pas à valider une cassure. C’est la clôture du corps de bougie, puis le comportement du prix après cette clôture, qui font la différence.',
          bulletPoints: [
            'Sweep : le prix dépasse le niveau en mèche, puis revient et clôture à l’intérieur de la structure. Les stops ont été absorbés, mais la structure tient.',
            'Cassure valide : clôture nette au-delà du swing, idéalement avec une bougie de déplacement et une continuation.',
            'Confirmation : un CHoCH sur l’unité de temps inférieure après le sweep, puis un retour sur la zone d’origine.',
            'Toujours replacer le contexte : un sweep sans réaction ni confirmation n’est pas un signal de trading.',
          ],
          warningNote: 'Ne vendez pas aveuglément chaque mèche au-dessus d’un sommet : sans clôture ni confirmation, vous pouvez vous retrouver face à une vraie continuation haussière. Le sweep est un contexte, pas un signal autonome.',
        },
        {
          heading: 'Exemple pratique (illustratif)',
          text: 'Sur EUR/USD en H1, imaginez un sommet de session asiatique à 1,0950. Londres pousse brièvement à 1,0958, puis clôture à 1,0935, sous le dernier creux de structure.',
          bulletPoints: [
            'Le dépassement de 1,0950 en mèche absorbe les stops : c’est le balayage.',
            'La clôture sous le creux de structure confirme un CHoCH baissier sur H1.',
            'Entrée envisagée sur le retest de 1,0942, Stop-Loss à 1,0962 (au-dessus de la mèche de chasse), soit 20 pips de risque.',
            'Objectif à 1,0890, soit 52 pips : ratio Risque/Rendement d’environ 1:2,6. Cet exemple est pédagogique et ne constitue pas une recommandation.',
          ],
        },
      ],
      quiz: {
        question: 'Après un balayage au-dessus d’un sommet, quel élément apporte la confirmation la plus fiable d’un retournement ?',
        options: [
          'La mèche dépasse le sommet, même sans clôture',
          'Une clôture de corps sous le dernier creux de structure (CHoCH), idéalement avec déplacement',
          'Le prix touche un chiffre rond',
          'Le RSI passe sous 50 sur une seule bougie',
        ],
        correctIndex: 1,
        explanation: 'Le balayage montre que la liquidité a été prise, mais c’est la cassure confirmée par une clôture de corps — le CHoCH — qui valide le changement de structure. Une mèche seule peut être une simple continuation.',
      },
    },
    {
      id: 'mod-8',
      number: '08',
      title: 'Plan de Trading, Journal & Discipline',
      level: 'Intermédiaire',
      duration: '22 min',
      summary: 'Transformer une méthode en processus reproductible : règles écrites, checklist pré-trade, journal mesurable et revue hebdomadaire.',
      videoUrl: 'https://www.youtube.com/watch?v=s5pO0QelBJI',
      videoTitle: 'Construire un plan de trading efficace',
      svgDiagramType: 'plan',
      sections: [
        {
          heading: 'Objectifs pédagogiques',
          text: 'À la fin de ce module, vous saurez :',
          bulletPoints: [
            'Rédiger un plan de trading court, testable et applicable sans improvisation.',
            'Construire une checklist pré-trade qui bloque les décisions impulsives.',
            'Tenir un journal exploitable, avec des données comparables d’un trade à l’autre.',
            'Organiser une revue hebdomadaire basée sur le processus, pas sur le résultat isolé.',
          ],
        },
        {
          heading: 'Les cinq blocs d’un plan de trading',
          text: 'Un plan utile tient sur une page. S’il nécessite vingt pages, il ne sera pas appliqué en direct. Cinq blocs suffisent :',
          bulletPoints: [
            'Marchés et horaires : instruments suivis, sessions autorisées, heures d’interdiction (ex. autour des annonces majeures).',
            'Setup : conditions d’entrée objectives (structure, zone, confirmation) et conditions d’invalidation.',
            'Exécution : type d’ordre, entrée, Stop-Loss structurel, objectifs partiels et gestion de la position.',
            'Risque : pourcentage par trade, perte journalière maximale, nombre de trades maximum, règles d’arrêt.',
            'Routines : préparation avant session, contrôle pendant, revue après et bilan hebdomadaire.',
          ],
        },
        {
          heading: 'Un journal qui sert vraiment',
          text: 'Un journal n’est pas un relevé de P&L. C’est une base de données de décisions. Chaque ligne doit permettre de répondre à une question précise : pourquoi suis-je entré, ai-je suivi mes règles, et qu’aurais-je dû faire différemment ?',
          bulletPoints: [
            'Capture avant l’entrée (contexte, zone, scénario) et capture après la sortie.',
            'Thèse en une phrase, setup utilisé, confirmation observée, niveau d’invalidation.',
            'R multiple réel, durée du trade, émotion dominante, erreurs commises.',
            'Revue hebdomadaire : taux de respect des règles, R moyen, meilleurs et pires contextes.',
            'Échantillon minimum de 30 trades avant de juger une stratégie ; un trade isolé ne prouve rien.',
          ],
          warningNote: 'Ne changez pas de stratégie après deux ou trois pertes consécutives : c’est souvent le signe d’une variance normale, pas d’une méthode invalide. Modifiez une règle uniquement après une revue documentée sur un échantillon suffisant.',
        },
        {
          heading: 'Exemple de routine quotidienne',
          text: 'La régularité compte plus que l’intensité. Voici une routine simple, adaptée à une session de deux heures :',
          bulletPoints: [
            '15 minutes avant : vérifier le calendrier économique, tracer les niveaux majeurs, définir les scénarios autorisés.',
            'Pendant : attendre les conditions du plan, journaliser la capture avant l’entrée, ne pas élargir le Stop-Loss.',
            'Après : mettre à jour le journal, noter l’émotion et les écarts au plan, fermer la plateforme.',
            'Chaque semaine : relire les 10 derniers trades, identifier une seule amélioration concrète pour la semaine suivante.',
          ],
        },
      ],
      quiz: {
        question: 'Quel indicateur du journal mesure le mieux la qualité de votre exécution, indépendamment du résultat d’un trade isolé ?',
        options: [
          'Le P&L du dernier trade',
          'Le nombre de trades pris dans la journée',
          'Le taux de respect des règles et le R multiple sur un échantillon suffisant',
          'Le nombre d’indicateurs affichés sur le graphique',
        ],
        correctIndex: 2,
        explanation: 'Le résultat d’un trade isolé est largement dominé par le hasard. Le respect des règles et le R multiple agrégé sur un échantillon mesurent réellement la qualité du processus.',
      },
    },
  ];

  const modulesFr: AcademyModule[] = modules;
  const activeModules: AcademyModule[] = currentLang === 'en' ? (academyModulesEn as AcademyModule[]) : currentLang === 'mg' ? (academyModulesMg as AcademyModule[]) : modulesFr;
  const currentModule = activeModules.find((m) => m.id === selectedModuleId) || activeModules[0];

  const handleSelectAnswer = (index: number) => {
    setUserQuizAnswer(index);
    setQuizSubmitted(true);
    if (index === currentModule.quiz.correctIndex) {
      if (!completedModules.includes(currentModule.id)) {
        setCompletedModules((prev) => [...prev, currentModule.id]);
      }
    }
  };

  const resetQuiz = () => {
    setUserQuizAnswer(null);
    setQuizSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Academy Header Banner */}
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-r from-slate-900 via-[#0d1420] to-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono">
              <GraduationCap className="w-4 h-4" />
              {t.extra.academyBadge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {t.extra.academySchool}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t.extra.academySubtitle}
            </p>
          </div>

          {/* Progress Card */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 text-center space-y-2 min-w-[200px]">
            <span className="text-xs font-mono text-slate-400 block uppercase">{t.extra.globalProgress}</span>
            <div className="text-3xl font-black text-white font-mono">
              {Math.round((completedModules.length / activeModules.length) * 100)}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedModules.length / activeModules.length) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              {completedModules.length} / {activeModules.length} {t.extra.validatedOf}
            </span>
          </div>
        </div>
      </div>

      {/* Main Academy Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Modules Curriculum List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.extra.curriculum}
            </span>
            <span className="text-xs text-orange-400 font-mono font-semibold">
              {activeModules.length} {t.extra.structuredModules}
            </span>
          </div>

          {activeModules.map((m) => {
            const isSelected = selectedModuleId === m.id;
            const isDone = completedModules.includes(m.id);

            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModuleId(m.id);
                  resetQuiz();
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative group ${
                  isSelected
                    ? 'bg-slate-900 border-orange-500 shadow-lg shadow-orange-500/15'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isSelected
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : m.number}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase">
                      {m.level}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{m.duration}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{m.summary}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Selected Module Content Reader & Interactive Diagrams */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-8 shadow-xl">
            {/* Header info */}
            <div className="space-y-3 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase">
                  {t.extra.moduleWord} #{currentModule.number} &bull; {currentModule.level}
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-xs font-mono text-slate-400">{currentModule.duration} {t.extra.learningSuffix}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentModule.title}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">{currentModule.summary}</p>
            </div>

            {/* Pedagogical Interactive Diagrams */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                {t.extra.diagramTitle}
              </span>

              {/* Diagram 1: Candlestick Anatomy */}
              {currentModule.svgDiagramType === 'candlestick' && (
                <div className="flex flex-col sm:flex-row items-center justify-around p-6 bg-[#06080D] rounded-xl border border-slate-800/80 gap-6">
                  {/* Bullish Candle */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-emerald-400 mb-2">{t.extra.bullishCandle}</span>
                    <svg width="120" height="180" viewBox="0 0 120 180" className="overflow-visible">
                      {/* Upper Wick */}
                      <line x1="60" y1="20" x2="60" y2="50" stroke="#10b981" strokeWidth="3" />
                      <text x="65" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">High (Plus Haut)</text>
                      {/* Real Body */}
                      <rect x="40" y="50" width="40" height="80" fill="#10b981" rx="3" />
                      <text x="85" y="58" fill="#10b981" fontSize="10" fontFamily="monospace">Close (Clôture)</text>
                      <text x="85" y="125" fill="#94a3b8" fontSize="10" fontFamily="monospace">Open (Ouverture)</text>
                      {/* Lower Wick */}
                      <line x1="60" y1="130" x2="60" y2="160" stroke="#10b981" strokeWidth="3" />
                      <text x="65" y="165" fill="#94a3b8" fontSize="10" fontFamily="monospace">Low (Plus Bas)</text>
                    </svg>
                  </div>

                  {/* Bearish Candle */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-rose-400 mb-2">{t.extra.bearishCandle}</span>
                    <svg width="120" height="180" viewBox="0 0 120 180" className="overflow-visible">
                      <line x1="60" y1="20" x2="60" y2="50" stroke="#f43f5e" strokeWidth="3" />
                      <text x="65" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">High</text>
                      <rect x="40" y="50" width="40" height="80" fill="#f43f5e" rx="3" />
                      <text x="85" y="58" fill="#94a3b8" fontSize="10" fontFamily="monospace">Open (Ouverture)</text>
                      <text x="85" y="125" fill="#f43f5e" fontSize="10" fontFamily="monospace">Close (Clôture)</text>
                      <line x1="60" y1="130" x2="60" y2="160" stroke="#f43f5e" strokeWidth="3" />
                      <text x="65" y="165" fill="#94a3b8" fontSize="10" fontFamily="monospace">Low</text>
                    </svg>
                  </div>
                </div>
              )}

              {/* Diagram 2: SMC Order Block & FVG */}
              {currentModule.svgDiagramType === 'smc' && (
                <div className="p-4 bg-[#06080D] rounded-xl border border-slate-800/80">
                  <svg width="100%" height="160" viewBox="0 0 500 160" className="overflow-visible">
                    {/* Order Block Box */}
                    <rect x="50" y="70" width="70" height="50" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="55" y="62" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">Bullish Order Block</text>

                    {/* Candlestick 1 */}
                    <line x1="75" y1="60" x2="75" y2="130" stroke="#f43f5e" strokeWidth="2" />
                    <rect x="68" y="75" width="14" height="40" fill="#f43f5e" />

                    {/* Candlestick 2 (Huge Impulse) */}
                    <line x1="120" y1="30" x2="120" y2="120" stroke="#10b981" strokeWidth="2" />
                    <rect x="113" y="40" width="14" height="75" fill="#10b981" />

                    {/* FVG Highlight Zone */}
                    <rect x="135" y="55" width="80" height="35" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1" />
                    <text x="140" y="50" fill="#f59e0b" fontSize="10" fontFamily="monospace">Fair Value Gap (FVG)</text>

                    {/* Candlestick 3 */}
                    <line x1="160" y1="20" x2="160" y2="90" stroke="#10b981" strokeWidth="2" />
                    <rect x="153" y="25" width="14" height="50" fill="#10b981" />

                    {/* Price retracement arrow */}
                    <path d="M 210 30 Q 250 80 280 85" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" />
                    <text x="240" y="110" fill="#06b6d4" fontSize="11" fontFamily="monospace">Mitigation &amp; Entrée Optimale</text>
                  </svg>
                </div>
              )}

              {/* Diagram 3: Risk / Reward */}
              {currentModule.svgDiagramType === 'risk' && (
                <div className="p-4 bg-[#06080D] rounded-xl border border-slate-800/80">
                  <svg width="100%" height="150" viewBox="0 0 500 150">
                    {/* Entry line */}
                    <line x1="40" y1="75" x2="460" y2="75" stroke="#f59e0b" strokeWidth="2" />
                    <text x="45" y="70" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">{currentLang === 'mg' ? "VIDIN'NY FIDIRANA (ENTRY) : 100.00 $" : currentLang === 'en' ? 'ENTRY PRICE : 100.00 $' : "PRIX D'ENTRÉE (ENTRY) : 100.00 $"}</text>

                    {/* Take Profit Box */}
                    <rect x="40" y="20" width="420" height="55" fill="#10b981" fillOpacity="0.15" />
                    <line x1="40" y1="20" x2="460" y2="20" stroke="#10b981" strokeWidth="2" />
                    <text x="45" y="35" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">TAKE PROFIT (TP) : 106.00 $ (+6%) &mdash; GAIN : +200 $ (Ratio 1:2)</text>

                    {/* Stop Loss Box */}
                    <rect x="40" y="75" width="420" height="45" fill="#f43f5e" fillOpacity="0.15" />
                    <line x1="40" y1="120" x2="460" y2="120" stroke="#f43f5e" strokeWidth="2" />
                    <text x="45" y="112" fill="#f43f5e" fontSize="11" fontFamily="monospace" fontWeight="bold">{currentLang === 'mg' ? 'STOP-LOSS (SL) : 97.00 $ (-3%) — RISIKA : 100 $ (1%)' : currentLang === 'en' ? 'STOP-LOSS (SL) : 97.00 $ (-3%) — FIXED RISK : 100 $ (1% Capital)' : 'STOP-LOSS (SL) : 97.00 $ (-3%) — RISQUE FIXÉ : 100 $ (1% Capital)'}</text>
                  </svg>
                </div>
              )}

              {/* Diagram 4: Structure BOS / CHoCH */}
              {currentModule.svgDiagramType === 'structure' && (
                <div className="p-4 bg-[#06080D] rounded-xl border border-slate-800/80">
                  <svg width="100%" height="150" viewBox="0 0 500 150">
                    <polyline
                      points="30,120 80,60 130,95 190,40 250,80 320,25 380,105 440,85 470,135"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                    {/* Swing markers */}
                    <circle cx="80" cy="60" r="4" fill="#10b981" />
                    <text x="75" y="50" fill="#94a3b8" fontSize="10" fontFamily="monospace">HH 1</text>
                    <circle cx="130" cy="95" r="4" fill="#38bdf8" />
                    <text x="125" y="110" fill="#94a3b8" fontSize="10" fontFamily="monospace">HL 1</text>

                    {/* BOS Line */}
                    <line x1="80" y1="60" x2="190" y2="60" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="135" y="55" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">BOS (Continuation)</text>

                    <circle cx="190" cy="40" r="4" fill="#10b981" />
                    <text x="185" y="30" fill="#94a3b8" fontSize="10" fontFamily="monospace">HH 2</text>
                    <circle cx="250" cy="80" r="4" fill="#38bdf8" />
                    <text x="245" y="95" fill="#94a3b8" fontSize="10" fontFamily="monospace">HL 2</text>

                    {/* CHoCH break */}
                    <line x1="250" y1="80" x2="380" y2="80" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="290" y="75" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">{currentLang === 'mg' ? 'CHoCH (Fahatapahana fanambany)' : currentLang === 'en' ? 'CHoCH (Low break)' : 'CHoCH (Rupture du creux)'}</text>
                    <circle cx="380" cy="105" r="4" fill="#f43f5e" />
                  </svg>
                </div>
              )}

              {/* Diagram 5: MT4 / MT5 Layout */}
              {currentModule.svgDiagramType === 'mt4' && (
                <div className="p-4 bg-[#06080D] rounded-xl border border-slate-800/80">
                  <svg width="100%" height="150" viewBox="0 0 500 150">
                    <rect x="20" y="15" width="460" height="120" fill="#0f172a" stroke="#334155" strokeWidth="1.5" rx="6" />
                    <line x1="20" y1="40" x2="480" y2="40" stroke="#334155" strokeWidth="1" />
                    <text x="35" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">{currentLang === 'mg' ? 'JYNTRATrader 5 — EURUSD, H1 • Tabilao Madio Tsy Misy Grille (Ctrl + G)' : currentLang === 'en' ? 'JYNTRATrader 5 — EURUSD, H1 • Clean Chart Without Grid (Ctrl + G)' : 'JYNTRATrader 5 — EURUSD, H1 • Graphique Propre Sans Grille (Ctrl + G)'}</text>
                    {/* Simulated Clean Candles */}
                    <line x1="120" y1="60" x2="120" y2="110" stroke="#10b981" strokeWidth="2" />
                    <rect x="114" y="70" width="12" height="30" fill="#10b981" />
                    <line x1="150" y1="50" x2="150" y2="100" stroke="#10b981" strokeWidth="2" />
                    <rect x="144" y="55" width="12" height="35" fill="#10b981" />
                    <line x1="180" y1="65" x2="180" y2="120" stroke="#f43f5e" strokeWidth="2" />
                    <rect x="174" y="75" width="12" height="35" fill="#f43f5e" />
                    {/* Export tooltip */}
                    <rect x="250" y="55" width="210" height="50" fill="#0284c7" fillOpacity="0.2" stroke="#0284c7" rx="4" />
                    <text x="260" y="75" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">{currentLang === 'mg' ? 'Fanondranana : Tsindrio Havanana > Tehirizo Sary' : currentLang === 'en' ? 'Export : Right Click > Save Picture' : 'Export : Clic Droit > Enregistrer Image'}</text>
                    <text x="260" y="92" fill="#94a3b8" fontSize="9" fontFamily="monospace">{currentLang === 'mg' ? 'Format PNG mazava vonona ho an’ny IA' : currentLang === 'en' ? 'High-sharpness PNG format ready for AI' : 'Format PNG haute netteté prêt pour IA'}</text>
                  </svg>
                </div>
              )}
              {/* Diagram 6: Liquidity sweep vs structure break */}
              {currentModule.svgDiagramType === 'liquidity' && (
                <div className="p-4 bg-[#06080D] rounded-xl border border-slate-800/80">
                  <svg width="100%" height="180" viewBox="0 0 520 180" className="overflow-visible">
                    {/* Equal highs / liquidity pool */}
                    <line x1="40" y1="58" x2="480" y2="58" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" />
                    <text x="44" y="50" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {currentLang === 'mg' ? 'LIQUIDITÉ : stops ambonin’ny tampony mitovy' : currentLang === 'en' ? 'LIQUIDITY: stops above equal highs' : 'LIQUIDITÉ : stops au-dessus des sommets égaux'}
                    </text>
                    <circle cx="150" cy="58" r="3.5" fill="#f59e0b" />
                    <circle cx="300" cy="58" r="3.5" fill="#f59e0b" />

                    {/* Price path */}
                    <polyline
                      points="40,120 110,58 150,58 210,105 250,78 300,58 318,30 336,92 380,112 430,132 480,150"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />

                    {/* Sweep wick */}
                    <line x1="300" y1="58" x2="318" y2="30" stroke="#f43f5e" strokeWidth="2.5" />
                    <text x="322" y="28" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">SWEEP</text>

                    {/* CHoCH level */}
                    <line x1="210" y1="105" x2="470" y2="105" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 4" />
                    <text x="360" y="100" fill="#a78bfa" fontSize="10" fontFamily="monospace" fontWeight="bold">CHoCH</text>

                    {/* Entry zone */}
                    <rect x="330" y="92" width="70" height="22" fill="#10b981" fillOpacity="0.18" stroke="#10b981" strokeWidth="1" rx="3" />
                    <text x="334" y="107" fill="#34d399" fontSize="9" fontFamily="monospace">
                      {currentLang === 'mg' ? 'Fidirana retest' : currentLang === 'en' ? 'Retest entry' : 'Entrée retest'}
                    </text>

                    {/* Stop loss marker */}
                    <line x1="300" y1="30" x2="360" y2="30" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                    <text x="364" y="33" fill="#fb7185" fontSize="9" fontFamily="monospace">SL</text>
                  </svg>
                </div>
              )}

              {/* Diagram 7: Trading plan blocks */}
              {currentModule.svgDiagramType === 'plan' && (
                <div className="p-4 bg-[#06080D] rounded-xl border border-slate-800/80">
                  <svg width="100%" height="170" viewBox="0 0 520 170" className="overflow-visible">
                    {[
                      { x: 20, label: currentLang === 'mg' ? 'Tsena & ora' : currentLang === 'en' ? 'Markets & hours' : 'Marchés & horaires', color: '#38bdf8' },
                      { x: 120, label: currentLang === 'mg' ? 'Setup' : 'Setup', color: '#22d3ee' },
                      { x: 220, label: currentLang === 'mg' ? 'Risika' : currentLang === 'en' ? 'Risk' : 'Risque', color: '#f59e0b' },
                      { x: 320, label: currentLang === 'mg' ? 'Fanatanterahana' : currentLang === 'en' ? 'Execution' : 'Exécution', color: '#34d399' },
                      { x: 420, label: currentLang === 'mg' ? 'Routine' : 'Routine', color: '#a78bfa' },
                    ].map((block) => (
                      <g key={block.label}>
                        <rect x={block.x} y="22" width="80" height="58" rx="8" fill={block.color} fillOpacity="0.12" stroke={block.color} strokeWidth="1.2" />
                        <text x={block.x + 40} y="55" fill={block.color} fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          {block.label}
                        </text>
                      </g>
                    ))}

                    {/* Arrows between blocks */}
                    {[100, 200, 300, 400].map((x) => (
                      <path key={x} d={`M ${x} 51 L ${x + 16} 51`} stroke="#334155" strokeWidth="1.5" markerEnd="url(#arrow)" />
                    ))}
                    <defs>
                      <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
                      </marker>
                    </defs>

                    {/* Checklist */}
                    {[
                      currentLang === 'mg' ? 'Voamarina ny fotoana sy ny vaovao ara-toekarena' : currentLang === 'en' ? 'Session and economic calendar checked' : 'Session et calendrier économique vérifiés',
                      currentLang === 'mg' ? 'Mifanaraka amin’ny setup ny fepetra rehetra' : currentLang === 'en' ? 'All setup conditions are met' : 'Toutes les conditions du setup sont réunies',
                      currentLang === 'mg' ? 'Voafaritra ny risika sy ny Stop-Loss' : currentLang === 'en' ? 'Risk and Stop-Loss defined before entry' : 'Risque et Stop-Loss définis avant l’entrée',
                      currentLang === 'mg' ? 'Voarakitra ao amin’ny journal ny fanapahan-kevitra' : currentLang === 'en' ? 'Decision recorded in the journal' : 'Décision consignée dans le journal',
                    ].map((item, index) => (
                      <g key={item}>
                        <rect x="24" y={98 + index * 17} width="10" height="10" rx="2" fill="none" stroke="#34d399" strokeWidth="1.2" />
                        <path d={`M 26 ${103 + index * 17} l 3 3 l 6 -7`} fill="none" stroke="#34d399" strokeWidth="1.4" />
                        <text x="42" y={107 + index * 17} fill="#94a3b8" fontSize="9.5" fontFamily="monospace">{item}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              )}

            </div>
            {/* In-page YouTube lesson player */}
            <LessonVideo
              url={currentModule.videoUrl}
              title={currentModule.videoTitle}
              label={t.extra.recommendedVideo}
            />

            {/* Structured Lesson Sections */}
            <div className="space-y-6">
              {currentModule.sections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {sec.heading}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{sec.text}</p>

                  {sec.bulletPoints && (
                    <ul className="space-y-2 pl-4 border-l-2 border-slate-800 my-2">
                      {sec.bulletPoints.map((pt, pIdx) => (
                        <li key={pIdx} className="text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {sec.warningNote && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-0.5">{t.extra.trapTitle}</strong>
                        {sec.warningNote}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Validation Quiz */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  {t.extra.quizTitle}
                </span>
                {completedModules.includes(currentModule.id) && (
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {t.extra.validated}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-white">{currentModule.quiz.question}</p>

              <div className="space-y-2 pt-1">
                {currentModule.quiz.options.map((opt, oIdx) => {
                  const isSelectedOption = userQuizAnswer === oIdx;
                  const isCorrect = oIdx === currentModule.quiz.correctIndex;

                  let optionStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                  if (quizSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                    } else if (isSelectedOption) {
                      optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => !quizSubmitted && handleSelectAnswer(oIdx)}
                      disabled={quizSubmitted}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 mt-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono">
                    {userQuizAnswer === currentModule.quiz.correctIndex ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> {t.extra.correctAnswer}
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> {t.extra.wrongAnswer}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {currentModule.quiz.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
