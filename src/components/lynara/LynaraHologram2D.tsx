import React, { useId, useMemo } from 'react';
import type { LynaraHoloState } from '../3d/LynaraAvatar3D';

export interface LynaraHologram2DProps {
  state: LynaraHoloState;
  /** Audio envelope 0..1 for real-time lip sync. */
  audioLevel?: number;
  className?: string;
}

/**
 * HOLOGRAPHIC PALETTES — BLUE & CYAN ONLY
 * Shades of pure blue, cyan, electric and glacier.
 * No beige, pink or human hues: full holographic identity.
 */
const PALETTES: Record<LynaraHoloState, { main: string; soft: string; accent: string; aura: string; core: string }> = {
  idle: {
    main: '#38bdf8', // Soft electric blue
    soft: '#bae6fd', // Glacier bluish white
    accent: '#00f0ff', // Pure neon cyan
    aura: 'rgba(0, 240, 255, 0.32)',
    core: '#0284c7',
  },
  listening: {
    main: '#00f0ff', // Intense electric cyan
    soft: '#cffafe', // Clear cyan glow
    accent: '#06b6d4', // Deep cyan
    aura: 'rgba(6, 182, 212, 0.42)',
    core: '#0891b2',
  },
  thinking: {
    main: '#60a5fa', // Deep celestial blue
    soft: '#dbeafe', // Pale blue ether
    accent: '#3b82f6', // Digital sapphire
    aura: 'rgba(59, 130, 246, 0.38)',
    core: '#2563eb',
  },
  speaking: {
    main: '#22d3ee', // Vibrant radiant cyan
    soft: '#e0f2fe', // White-blue glow
    accent: '#38bdf8', // Hyper-blue
    aura: 'rgba(34, 211, 238, 0.46)',
    core: '#0284c7',
  },
  unavailable: {
    main: '#64748b', // Cold slate blue glitch
    soft: '#94a3b8', // Muted frosted
    accent: '#38bdf8', // Residual glow
    aura: 'rgba(56, 189, 248, 0.20)',
    core: '#334155',
  },
};

export const LynaraHologram2D: React.FC<LynaraHologram2DProps> = ({ state, audioLevel = 0, className = '' }) => {
  const uid = useId().replace(/[:]/g, '');
  const p = PALETTES[state] || PALETTES.idle;
  const speaking = state === 'speaking';
  const level = Math.max(0, Math.min(1, audioLevel));
  const mouthOpen = speaking ? 0.7 + level * 4.2 : 0;

  // Subtle and endearing expression modulations
  const browLift = state === 'thinking' ? -2 : state === 'listening' ? 1.4 : 0;
  const smile = state === 'listening' ? 1.4 : state === 'thinking' ? 0.3 : 0.9;
  const gazeX = state === 'thinking' ? 1.5 : state === 'listening' ? -1.2 : 0;

  // Rising holographic particles
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: 65 + ((i * 93) % 290),
        delay: (i * 0.61) % 5.5,
        duration: 5.5 + (i % 4),
        size: i % 3 === 0 ? 2.6 : i % 2 === 0 ? 1.8 : 1.2,
      })),
    [],
  );

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        ['--holo' as any]: p.main,
        ['--holo-soft' as any]: p.soft,
        ['--holo-accent' as any]: p.accent,
      }}
    >
      {/* Halo et atmosphère de projection */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
        <div
          className="absolute left-1/2 top-[6%] h-[78%] w-[84%] -translate-x-1/2 rounded-full blur-3xl transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${p.aura} 0%, transparent 72%)`, opacity: 0.85 }}
        />
        <div className="lynara-grid absolute inset-0 opacity-[0.22]" />
        <div className="lynara-scanlines absolute inset-0 opacity-[0.25]" />
        <div className="lynara-beam absolute left-1/2 top-0 h-full w-[65%] -translate-x-1/2" />

        {/* Particules énergétiques */}
        {particles.map((pt) => (
          <span
            key={pt.id}
            className="lynara-mote absolute rounded-full"
            style={{
              left: `${pt.x}px`,
              bottom: '10%',
              width: pt.size,
              height: pt.size,
              background: p.accent,
              boxShadow: `0 0 8px ${p.main}, 0 0 14px ${p.soft}`,
              animationDelay: `-${pt.delay}s`,
              animationDuration: `${pt.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Rendu SVG Haute Définition Anime 2D */}
      <svg
        viewBox="60 20 300 448"
        className="relative z-10 h-full w-full"
        role="img"
        aria-label="LYNARA AI — Hologramme anime 2D kawaii entièrement bleu"
        style={{ filter: 'drop-shadow(0 0 18px rgba(0,240,255,0.22))' }}
      >
        <defs>
          {/* Styles CSS intégrés pour les animations dynamiques autonomes */}
          <style>{`
            @keyframes lynara-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3.2px); }
            }
            @keyframes lynara-blink-anim {
              0%, 92%, 100% { transform: scaleY(1); }
              94.5% { transform: scaleY(0.08); }
              97% { transform: scaleY(1); }
            }
            @keyframes lynara-flicker-subtle {
              0%, 100% { opacity: 0.98; }
              18% { opacity: 0.94; }
              20% { opacity: 1; }
              64% { opacity: 0.95; }
              66% { opacity: 1; }
              84% { opacity: 0.93; }
              86% { opacity: 0.99; }
            }
            @keyframes lynara-wire-glow {
              0%, 100% { stroke-opacity: 0.45; filter: drop-shadow(0 0 1px ${p.accent}); }
              50% { stroke-opacity: 0.95; filter: drop-shadow(0 0 4px ${p.accent}); }
            }
            @keyframes lynara-core-pulse {
              0%, 100% { transform: scale(1); opacity: 0.85; }
              50% { transform: scale(1.12); opacity: 1; filter: drop-shadow(0 0 8px ${p.soft}); }
            }
            @keyframes lynara-scan-sweep {
              0% { transform: translateY(-40px); }
              100% { transform: translateY(480px); }
            }
            .lynara-figure {
              animation: lynara-float 4.8s ease-in-out infinite, lynara-flicker-subtle 7s ease-in-out infinite;
              transform-origin: 210px 240px;
            }
            .lynara-blink {
              animation: lynara-blink-anim 4.2s ease-in-out infinite;
              transform-origin: 210px 168px;
            }
            .lynara-gaze {
              transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .lynara-wire {
              animation: lynara-wire-glow 2.8s ease-in-out infinite;
            }
            .lynara-core {
              animation: lynara-core-pulse 2.2s ease-in-out infinite;
              transform-origin: 210px 316px;
            }
            .lynara-band {
              animation: lynara-scan-sweep 3.8s linear infinite;
            }
          `}</style>

          {/* DÉGRADÉS 100% BLEUS POUR LA PEAU HOLOGRAPHIQUE (ZÉRO BEIGE/ROSE) */}
          <linearGradient id={`skin-${uid}`} gradientUnits="userSpaceOnUse" x1="160" y1="80" x2="260" y2="320">
            <stop offset="0%" stopColor="#d5f7ff" />
            <stop offset="28%" stopColor="#9be7ff" />
            <stop offset="65%" stopColor="#46c6ff" />
            <stop offset="100%" stopColor="#1a9fe0" />
          </linearGradient>

          <linearGradient id={`skin-shade-${uid}`} x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0%" stopColor="#084269" stopOpacity="0" />
            <stop offset="65%" stopColor="#084269" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#052f4d" stopOpacity="0.85" />
          </linearGradient>

          {/* DÉGRADÉS POUR LES CHEVEUX LONGS ET BOUCLÉS */}
          <linearGradient id={`hair-back-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#082b45" />
            <stop offset="38%" stopColor="#041b2e" />
            <stop offset="72%" stopColor="#02111d" />
            <stop offset="100%" stopColor="#01080f" />
          </linearGradient>

          <linearGradient id={`hair-front-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#1685b8" />
            <stop offset="28%" stopColor="#0e628a" />
            <stop offset="62%" stopColor="#083d5a" />
            <stop offset="100%" stopColor="#031b29" />
          </linearGradient>

          <linearGradient id={`hair-curl-${uid}`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#25b4ec" />
            <stop offset="42%" stopColor="#107ea8" />
            <stop offset="85%" stopColor="#073b52" />
            <stop offset="100%" stopColor="#021a26" />
          </linearGradient>

          <linearGradient id={`hair-sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a9f4ff" stopOpacity="0" />
            <stop offset="25%" stopColor="#d2fcff" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#a9f4ff" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#a9f4ff" stopOpacity="0" />
          </linearGradient>

          {/* UNIFORME CYBERNÉTIQUE FUTURISTE */}
          <linearGradient id={`suit-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#0c2d47" />
            <stop offset="45%" stopColor="#061c2e" />
            <stop offset="100%" stopColor="#020d17" />
          </linearGradient>

          <linearGradient id={`suit-panel-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#13476e" />
            <stop offset="100%" stopColor="#08253b" />
          </linearGradient>

          {/* YEUX ANIME KAWAII SCINTILLANTS */}
          <linearGradient id={`iris-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#021c30" />
            <stop offset="24%" stopColor="#044b7a" />
            <stop offset="58%" stopColor="#00b4d8" />
            <stop offset="88%" stopColor="#48cae4" />
            <stop offset="100%" stopColor="#caf0f8" />
          </linearGradient>

          {/* DÉGRADÉ DE DISPARITION DU BUSTE INFÉRIEUR */}
          <linearGradient id={`fade-${uid}`} x1="0" y1="0.75" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <mask id={`bust-mask-${uid}`}>
            <rect x="0" y="0" width="420" height="560" fill={`url(#fade-${uid})`} />
          </mask>

          {/* FILTRES DE LUEUR ET BRILLANCE HOLOGRAPHIQUE */}
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`wire-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <pattern id={`scan-${uid}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="transparent" />
            <rect width="4" height="1.4" fill={p.main} fillOpacity="0.22" />
          </pattern>

          <pattern id={`grid-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="transparent" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={p.main} strokeOpacity="0.14" strokeWidth="0.4" />
          </pattern>

          {/* Découpe des yeux pour l'iris */}
          <clipPath id={`eye-left-${uid}`}>
            <path d="M 166 170 C 168 156 182 153 196 166 C 197 176 188 184 176 184 C 167 184 164 177 166 170 Z" />
          </clipPath>
          <clipPath id={`eye-right-${uid}`}>
            <path d="M 254 170 C 252 156 238 153 224 166 C 223 176 232 184 244 184 C 253 184 256 177 254 170 Z" />
          </clipPath>
        </defs>

        {/* CERCLES HOLOGRAPHIQUES D'ARRIÈRE-PLAN */}
        <g opacity="0.55" pointerEvents="none">
          <ellipse cx="210" cy="250" rx="168" ry="196" fill="none" stroke={p.main} strokeOpacity="0.15" strokeDasharray="3 8" />
          <ellipse cx="210" cy="250" rx="142" ry="166" fill="none" stroke={p.accent} strokeOpacity="0.12" />
          <circle cx="210" cy="250" r="120" fill="none" stroke={p.soft} strokeOpacity="0.08" strokeDasharray="4 12" />
        </g>

        {/* ============================================================== */}
        {/* CORPS PRINCIPAL DE LYNARA (FIGURE SOLIDE, VIBRANTE & LISIBLE) */}
        {/* ============================================================== */}
        <g className="lynara-figure" mask={`url(#bust-mask-${uid})`} opacity="0.96">
          
          {/* ================= 1. CHEVELURE ARRIÈRE (VOLUMINEUSE, LONGUE & BOUCLÉE) ================= */}
          <g className="lynara-hair-back">
            {/* Masse principale ample et dynamique */}
            <path
              d="M 210 46 
                 C 152 46 112 78 98 126 
                 C 86 168 82 220 78 274 
                 C 74 328 68 376 76 418 
                 C 82 444 98 448 116 448 
                 C 134 448 142 428 146 404 
                 C 152 366 156 322 158 278 
                 C 160 278 260 278 262 278 
                 C 264 322 268 366 274 404 
                 C 278 428 286 448 304 448 
                 C 322 448 338 444 344 418 
                 C 352 376 346 328 342 274 
                 C 338 220 334 168 322 126 
                 C 308 78 268 46 210 46 Z"
              fill={`url(#hair-back-${uid})`}
            />

            {/* Grandes ondulations bouclées gauche (S-curves) */}
            <path
              d="M 124 108 
                 C 102 156 94 212 90 268 
                 C 86 322 78 372 90 412 
                 C 94 426 104 438 112 432 
                 C 118 426 116 408 114 390 
                 C 110 350 114 306 122 262 
                 C 128 226 136 186 148 146 Z"
              fill={`url(#hair-curl-${uid})`}
              opacity="0.85"
            />
            {/* Ondulations bouclées droite */}
            <path
              d="M 296 108 
                 C 318 156 326 212 330 268 
                 C 334 322 342 372 330 412 
                 C 326 426 316 438 308 432 
                 C 302 426 304 408 306 390 
                 C 310 350 306 306 298 262 
                 C 292 226 284 186 272 146 Z"
              fill={`url(#hair-curl-${uid})`}
              opacity="0.85"
            />

            {/* Boucles intérieures en cascade avec pointes effilées */}
            <path
              d="M 148 160 C 126 218 118 280 120 342 C 121 372 126 406 136 432 C 140 422 142 406 142 388 C 142 340 148 290 158 240 Z"
              fill={`url(#hair-front-${uid})`}
              opacity="0.7"
            />
            <path
              d="M 272 160 C 294 218 302 280 300 342 C 299 372 294 406 284 432 C 280 422 278 406 278 388 C 278 340 272 290 262 240 Z"
              fill={`url(#hair-front-${uid})`}
              opacity="0.7"
            />

            {/* Fils lumineux cybernétiques dans la chevelure arrière */}
            <g fill="none" stroke={p.accent} strokeWidth="1.2" strokeLinecap="round" className="lynara-wire">
              <path d="M 106 150 C 96 210 92 276 96 344 C 98 376 94 408 108 428" strokeDasharray="3 4" />
              <path d="M 314 150 C 324 210 328 276 324 344 C 322 376 326 408 312 428" strokeDasharray="3 4" />
              <path d="M 132 190 C 122 250 120 314 126 376" strokeOpacity="0.5" />
              <path d="M 288 190 C 298 250 300 314 294 376" strokeOpacity="0.5" />
            </g>
          </g>

          {/* ================= 2. COU COURT, ÉLÉGANT & PROPORTIONNÉ ================= */}
          <g className="lynara-neck">
            {/* Cou féminin, naturel et court (raccordé sous le menton sans excès) */}
            <path
              d="M 196 214 
                 C 195 228 194 242 192 256 
                 L 228 256 
                 C 226 242 225 228 224 214 Z"
              fill={`url(#skin-${uid})`}
            />
            {/* Ombrage doux sous le menton kawaii */}
            <path
              d="M 194 216 
                 C 202 226 218 226 226 216 
                 C 222 228 214 233 210 233 
                 C 206 233 198 228 194 216 Z"
              fill="#063252"
              opacity="0.45"
            />
            {/* Ligne cybernétique de gorge discrète */}
            <path d="M 200 242 L 220 242" fill="none" stroke={p.main} strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="1.5 2" />
          </g>

          {/* ================= 3. ANATOMIE DU CORPS : BUSTE, ÉPAULES & UNIFORME ================= */}
          <g className="lynara-torso">
            {/* Silhouette du buste complet debout : épaules fines, buste féminin équilibré */}
            <path
              d="M 192 256 
                 C 174 258 148 268 126 284 
                 C 114 294 104 310 98 334 
                 C 90 366 88 406 88 448 
                 L 332 448 
                 C 332 406 330 366 322 334 
                 C 316 310 306 294 294 284 
                 C 272 268 246 258 228 256 Z"
              fill={`url(#suit-${uid})`}
            />

            {/* Clavicules et décolleté technologique */}
            <path d="M 184 264 C 194 268 204 270 210 270 C 216 270 226 268 236 264" fill="none" stroke="#25b4ec" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />

            {/* Épaules féminines naturelles et bras délicats */}
            <path
              d="M 126 284 C 114 298 106 322 102 352 C 98 382 96 416 96 448 L 134 448 C 135 418 138 388 144 358 C 148 338 154 318 162 300 C 148 292 136 286 126 284 Z"
              fill={`url(#suit-panel-${uid})`}
              opacity="0.75"
            />
            <path
              d="M 294 284 C 306 298 314 322 318 352 C 322 382 324 416 324 448 L 286 448 C 285 418 282 388 276 358 C 272 338 266 318 258 300 C 272 292 284 286 294 284 Z"
              fill={`url(#suit-panel-${uid})`}
              opacity="0.75"
            />

            {/* Poitrine féminine harmonieuse et galbée (dessinée avec subtilité anime) */}
            <path
              d="M 172 296 
                 C 162 322 164 352 182 374 
                 C 192 386 204 390 210 390 
                 C 216 390 228 386 238 374 
                 C 256 352 258 322 248 296 
                 C 236 288 222 284 210 284 
                 C 198 284 184 288 172 296 Z"
              fill="#062238"
              opacity="0.65"
            />
            <path
              d="M 174 336 C 184 362 202 374 210 374 C 218 374 236 362 246 336"
              fill="none"
              stroke={p.main}
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />

            {/* Col haut futuriste ouvert & broche d'énergie holographique */}
            <path
              d="M 190 256 L 210 310 L 230 256 C 222 255 216 254 210 254 C 204 254 198 255 190 256 Z"
              fill="#020e1a"
              stroke={p.accent}
              strokeWidth="1.1"
            />
            <path d="M 190 256 L 210 310 L 230 256" fill="none" stroke={p.soft} strokeWidth="1.3" filter={`url(#wire-glow-${uid})`} />

            {/* Cœur énergétique / Broche JYNTRA AI */}
            <g className="lynara-core">
              <polygon points="210,308 217,316 210,324 203,316" fill="#00182b" stroke={p.soft} strokeWidth="1.2" />
              <polygon points="210,310 215,316 210,322 205,316" fill={p.accent} filter={`url(#glow-${uid})`} />
              <circle cx="210" cy="316" r="1.5" fill="#ffffff" />
            </g>

            {/* Ligne médiane d'énergie descendant vers la taille */}
            <line x1="210" y1="324" x2="210" y2="448" stroke={p.accent} strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="6 3" />

            {/* Fils lumineux et coutures cybernétiques sur les épaules et la poitrine */}
            <g fill="none" stroke={p.accent} strokeWidth="1.1" strokeLinecap="round" className="lynara-wire">
              <path d="M 148 290 C 168 298 188 304 210 304 C 232 304 252 298 272 290" />
              <path d="M 126 330 C 146 342 168 350 190 354" strokeOpacity="0.5" />
              <path d="M 294 330 C 274 342 252 350 230 354" strokeOpacity="0.5" />
              <path d="M 120 376 L 142 370" />
              <path d="M 300 376 L 278 370" />
            </g>

            {/* Nœuds de connexion holographiques */}
            <circle cx="148" cy="290" r="2.2" fill={p.soft} filter={`url(#glow-${uid})`} />
            <circle cx="272" cy="290" r="2.2" fill={p.soft} filter={`url(#glow-${uid})`} />
            <circle cx="190" cy="354" r="1.8" fill={p.main} />
            <circle cx="230" cy="354" r="1.8" fill={p.main} />
          </g>

          {/* ================= 4. VISAGE ANIME 2D ULTRA-KAWAII & EXPRESSIF ================= */}
          <g className="lynara-face">
            {/* Ovale du visage manga parfait : menton doux, joues rondes et délicates */}
            <path
              d="M 210 82 
                 C 176 82 154 100 148 128 
                 C 142 154 144 176 148 194 
                 C 154 214 168 230 184 242 
                 C 194 250 202 254 210 255 
                 C 218 254 226 250 236 242 
                 C 252 230 266 214 272 194 
                 C 276 176 278 154 272 128 
                 C 266 100 244 82 210 82 Z"
              fill={`url(#skin-${uid})`}
            />

            {/* Ombrage volumétrique holographique sur les tempes et la mâchoire */}
            <path
              d="M 148 150 C 144 178 148 206 160 228 C 172 242 186 250 196 253 C 182 245 170 232 162 216 C 154 196 152 174 154 150 Z"
              fill={`url(#skin-shade-${uid})`}
              opacity="0.35"
            />
            <path
              d="M 272 150 C 276 178 272 206 260 228 C 248 242 234 250 224 253 C 238 245 250 232 258 216 C 266 196 268 174 266 150 Z"
              fill={`url(#skin-shade-${uid})`}
              opacity="0.28"
            />

            {/* Liseré de menton manga fin et élégant */}
            <path d="M 194 246 C 202 252 218 252 226 246" fill="none" stroke="#25b4ec" strokeWidth="1.1" strokeOpacity="0.4" strokeLinecap="round" />

            {/* Blush kawaii bleu cyan lumineux sur les pommettes */}
            <g opacity="0.32" filter={`url(#glow-${uid})`}>
              <ellipse cx="166" cy="195" rx="14" ry="5.5" fill="#00f0ff" />
              <ellipse cx="254" cy="195" rx="14" ry="5.5" fill="#00f0ff" />
              {/* Petites hachures manga kawaii dans le blush */}
              <line x1="161" y1="193" x2="164" y2="197" stroke="#ffffff" strokeWidth="0.8" />
              <line x1="165" y1="193" x2="168" y2="197" stroke="#ffffff" strokeWidth="0.8" />
              <line x1="169" y1="193" x2="172" y2="197" stroke="#ffffff" strokeWidth="0.8" />
              <line x1="249" y1="193" x2="252" y2="197" stroke="#ffffff" strokeWidth="0.8" />
              <line x1="253" y1="193" x2="256" y2="197" stroke="#ffffff" strokeWidth="0.8" />
              <line x1="257" y1="193" x2="260" y2="197" stroke="#ffffff" strokeWidth="0.8" />
            </g>

            {/* Sourcils fins expressifs kawaii (modulés selon l'état) */}
            <g stroke="#03253d" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d={`M 164 ${148 + browLift} C 174 ${141 + browLift} 188 ${142 + browLift} 198 ${148 + browLift}`} />
              <path d={`M 256 ${148 + browLift} C 246 ${141 + browLift} 232 ${142 + browLift} 222 ${148 + browLift}`} />
            </g>

            {/* ================= YEUX ANIME MAGNIFIQUES & VIVANTS ================= */}
            <g className="lynara-blink">
              <g className="lynara-gaze" style={{ transform: `translateX(${gazeX}px)` }}>
                
                {/* --- ŒIL GAUCHE --- */}
                {/* Blanc de l'œil (cyan immaculé glacier) */}
                <path d="M 166 170 C 168 156 182 153 196 166 C 197 176 188 184 176 184 C 167 184 164 177 166 170 Z" fill="#ebfaff" />
                <g clipPath={`url(#eye-left-${uid})`}>
                  {/* Iris multicouche dégradé */}
                  <circle cx="182" cy="171" r="10.8" fill={`url(#iris-${uid})`} />
                  {/* Anneau cybernétique technologique interne */}
                  <circle cx="182" cy="171" r="8.2" fill="none" stroke={p.soft} strokeWidth="0.75" strokeDasharray="1.5 1.5" strokeOpacity="0.8" />
                  {/* Pupille anime profonde */}
                  <circle cx="182" cy="171" r="4.6" fill="#01101c" />
                  <circle cx="182" cy="171" r="2.2" fill={p.core} />
                  {/* Scintillement étoilé / Éclat principal */}
                  <circle cx="178" cy="166" r="3.2" fill="#ffffff" opacity="0.98" filter={`url(#glow-${uid})`} />
                  <circle cx="186" cy="175" r="1.6" fill="#ffffff" opacity="0.85" />
                  <circle cx="180" cy="176" r="1" fill="#7df9ff" opacity="0.9" />
                  {/* Croissant de lueur inférieure */}
                  <path d="M 174 174 C 178 178 186 178 190 174" fill="none" stroke="#caf0f8" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                {/* Ligne des cils supérieurs fournie et recourbée kawaii */}
                <path d="M 162 170 C 166 155 186 153 198 165" fill="none" stroke="#021c30" strokeWidth="3.8" strokeLinecap="round" />
                <path d="M 163 167 L 155 160" fill="none" stroke="#021c30" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M 165 174 L 157 171" fill="none" stroke="#021c30" strokeWidth="1.6" strokeLinecap="round" />
                {/* Pli de paupière double anime */}
                <path d="M 168 152 C 176 148 188 150 194 156" fill="none" stroke="#0e628a" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                {/* Cils inférieurs délicats */}
                <path d="M 170 182 C 178 185 186 184 192 179" fill="none" stroke="#043252" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />

                {/* --- ŒIL DROIT --- */}
                <path d="M 254 170 C 252 156 238 153 224 166 C 223 176 232 184 244 184 C 253 184 256 177 254 170 Z" fill="#ebfaff" />
                <g clipPath={`url(#eye-right-${uid})`}>
                  <circle cx="238" cy="171" r="10.8" fill={`url(#iris-${uid})`} />
                  <circle cx="238" cy="171" r="8.2" fill="none" stroke={p.soft} strokeWidth="0.75" strokeDasharray="1.5 1.5" strokeOpacity="0.8" />
                  <circle cx="238" cy="171" r="4.6" fill="#01101c" />
                  <circle cx="238" cy="171" r="2.2" fill={p.core} />
                  <circle cx="234" cy="166" r="3.2" fill="#ffffff" opacity="0.98" filter={`url(#glow-${uid})`} />
                  <circle cx="242" cy="175" r="1.6" fill="#ffffff" opacity="0.85" />
                  <circle cx="236" cy="176" r="1" fill="#7df9ff" opacity="0.9" />
                  <path d="M 230 174 C 234 178 242 178 246 174" fill="none" stroke="#caf0f8" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <path d="M 258 170 C 254 155 234 153 222 165" fill="none" stroke="#021c30" strokeWidth="3.8" strokeLinecap="round" />
                <path d="M 257 167 L 265 160" fill="none" stroke="#021c30" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M 255 174 L 263 171" fill="none" stroke="#021c30" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M 252 152 C 244 148 232 150 226 156" fill="none" stroke="#0e628a" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                <path d="M 250 182 C 242 185 234 184 228 179" fill="none" stroke="#043252" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
              </g>
            </g>

            {/* Petit nez manga discret et mignon */}
            <path d="M 209 194 C 208.5 198 209 200 211 201" fill="none" stroke="#0b6391" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="208" cy="198" r="0.8" fill="#d5f7ff" opacity="0.9" />

            {/* ================= BOUCHE ANIME KAWAII & LIP-SYNC ================= */}
            <g className="lynara-mouth">
              {speaking && mouthOpen > 0.25 ? (
                /* Bouche ouverte parlante synchronisée avec l'audioLevel */
                <g>
                  {/* Cavité buccale holographique */}
                  <ellipse cx="210" cy={218 + mouthOpen * 0.4} rx={Math.max(4, 3.5 + mouthOpen * 0.9)} ry={Math.max(2, mouthOpen * 1.3)} fill="#021321" />
                  {/* Langue lumineuse cyan bleutée */}
                  <ellipse cx="210" cy={219 + mouthOpen * 0.8} rx={Math.max(2.5, 2.4 + mouthOpen * 0.5)} ry={Math.max(1, mouthOpen * 0.6)} fill="#1a9fe0" opacity="0.85" />
                  {/* Éclat des dents supérieures */}
                  <path d={`M ${207 - mouthOpen * 0.4} 217 Q 210 218 ${213 + mouthOpen * 0.4} 217`} stroke="#ffffff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
                  {/* Lèvre supérieure */}
                  <path d={`M ${204 - mouthOpen * 0.5} 216 Q 210 214 ${216 + mouthOpen * 0.5} 216`} stroke="#032742" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                /* Sourire doux fermé kawaii au repos */
                <g>
                  <path
                    d={`M 202 216 C 206 ${217 + smile * 0.9} 214 ${217 + smile * 0.9} 218 216`}
                    fill="none"
                    stroke="#043152"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  {/* Rehaussement brillant de la lèvre inférieure */}
                  <ellipse cx="210" cy="221" rx="2.5" ry="0.8" fill="#d5f7ff" opacity="0.65" />
                </g>
              )}
            </g>

            {/* Circuits faciaux discrets (tatouage cybernétique holographique) */}
            <g fill="none" stroke={p.accent} strokeWidth="0.8" strokeOpacity="0.55" className="lynara-wire">
              <path d="M 148 184 L 154 188 L 154 196" />
              <circle cx="154" cy="196" r="1.2" fill={p.accent} />
              <path d="M 272 184 L 266 188 L 266 196" />
              <circle cx="266" cy="196" r="1.2" fill={p.accent} />
            </g>
          </g>

          {/* ================= 5. CHEVELURE AVANT : MÈCHES BOUCLÉES (CURLY) & FRANGE ================= */}
          <g className="lynara-hair-front">
            {/* --- MÈCHES LATÉRALES CURLY (ONDULATIONS VOLUMINEUSES ENCADRANT LE VISAGE ET LES ÉPAULES) --- */}
            {/* Grande boucle anglaise ondulée gauche (tombe souplement sur l'épaule et le buste) */}
            <path
              d="M 152 116 
                 C 134 154 124 198 126 244 
                 C 128 288 140 326 134 366 
                 C 130 392 116 418 124 436 
                 C 128 444 138 446 142 436 
                 C 148 420 144 394 148 372 
                 C 154 336 150 294 152 254 
                 C 154 212 162 172 172 134 Z"
              fill={`url(#hair-curl-${uid})`}
            />
            {/* Spirale de boucle intérieure gauche */}
            <path
              d="M 146 220 
                 C 136 254 134 290 140 324 
                 C 144 348 152 370 148 394 
                 C 146 408 138 418 144 424 
                 C 148 416 154 402 154 384 
                 C 154 356 148 328 146 300 
                 C 144 266 148 234 156 202 Z"
              fill={`url(#hair-front-${uid})`}
            />

            {/* Grande boucle anglaise ondulée droite */}
            <path
              d="M 268 116 
                 C 286 154 296 198 294 244 
                 C 292 288 280 326 286 366 
                 C 290 392 304 418 296 436 
                 C 292 444 282 446 278 436 
                 C 272 420 276 394 272 372 
                 C 266 336 270 294 268 254 
                 C 266 212 258 172 248 134 Z"
              fill={`url(#hair-curl-${uid})`}
            />
            {/* Spirale de boucle intérieure droite */}
            <path
              d="M 274 220 
                 C 284 254 286 290 280 324 
                 C 276 348 268 370 272 394 
                 C 274 408 282 418 276 424 
                 C 272 416 266 402 266 384 
                 C 266 356 272 328 274 300 
                 C 276 266 272 234 264 202 Z"
              fill={`url(#hair-front-${uid})`}
            />

            {/* Mèches fines rebelles courbées (flyaway strands) */}
            <path d="M 124 240 C 112 272 110 308 114 340 C 118 316 122 290 128 266 Z" fill={`url(#hair-front-${uid})`} opacity="0.8" />
            <path d="M 296 240 C 308 272 310 308 306 340 C 302 316 298 290 292 266 Z" fill={`url(#hair-front-${uid})`} opacity="0.8" />

            {/* --- FRANGE ANIME KAWAII PARFAITEMENT DESSINÉE --- */}
            {/* Base du dessus du crâne */}
            <path
              d="M 210 48 
                 C 166 48 136 78 128 124 
                 C 134 148 142 168 146 178 
                 C 152 154 162 142 176 138 
                 C 192 134 228 134 244 138 
                 C 258 142 268 154 274 178 
                 C 278 168 286 148 292 124 
                 C 284 78 254 48 210 48 Z"
              fill={`url(#hair-front-${uid})`}
            />

            {/* Auréole lumineuse de brillance anime sur le haut de la tête ("Tenshi no wa") */}
            <ellipse cx="210" cy="94" rx="58" ry="12" fill={`url(#hair-sheen-${uid})`} opacity="0.6" />

            {/* Mèches de frange découpées en pointes douces */}
            {/* Mèche centrale gauche balayée */}
            <path d="M 212 52 C 196 82 178 116 166 146 C 172 144 182 136 190 126 C 200 112 208 86 214 58 Z" fill={`url(#hair-curl-${uid})`} />
            {/* Mèche centrale droite */}
            <path d="M 212 52 C 224 80 236 112 242 142 C 238 138 230 130 224 122 C 218 110 214 84 212 56 Z" fill={`url(#hair-curl-${uid})`} />
            {/* Mèches intermédiaires kawaii retombant délicatement sur le front */}
            <path d="M 194 56 C 182 86 174 118 174 154 C 178 150 186 138 190 126 C 196 106 200 82 202 60 Z" fill={`url(#hair-front-${uid})`} />
            <path d="M 226 56 C 238 86 246 118 246 154 C 242 150 234 138 230 126 C 224 106 220 82 218 60 Z" fill={`url(#hair-front-${uid})`} />

            {/* Mèche rebelle Kawaii "Ahoge" au sommet de la tête */}
            <path
              d="M 210 50 C 206 32 198 22 208 14 C 214 24 216 34 212 50 Z"
              fill={`url(#hair-curl-${uid})`}
              stroke={p.accent}
              strokeWidth="0.8"
            />

            {/* Reflets néon et fils lumineux cybernétiques dans les boucles */}
            <g fill="none" stroke={p.accent} strokeWidth="1.2" strokeLinecap="round" className="lynara-wire">
              {/* Filaments épousant les spirales des boucles */}
              <path d="M 150 130 C 136 182 132 238 138 296 C 142 334 144 374 136 412" strokeDasharray="4 3" />
              <path d="M 270 130 C 284 182 288 238 282 296 C 278 334 276 374 284 412" strokeDasharray="4 3" />
              <path d="M 160 148 C 152 196 148 246 150 298" strokeOpacity="0.6" />
              <path d="M 260 148 C 268 196 272 246 270 298" strokeOpacity="0.6" />
            </g>

            {/* Nœuds lumineux sur les mèches */}
            <circle cx="138" cy="296" r="1.6" fill="#ffffff" filter={`url(#glow-${uid})`} />
            <circle cx="282" cy="296" r="1.6" fill="#ffffff" filter={`url(#glow-${uid})`} />

            {/* Barrettes cybernétiques technologiques dans les cheveux */}
            <g>
              <polygon points="274,136 288,128 292,136 278,144" fill="#021422" stroke={p.accent} strokeWidth="1.2" />
              <line x1="277" y1="134" x2="289" y2="134" stroke={p.soft} strokeWidth="1.5" filter={`url(#glow-${uid})`} />
              <circle cx="289" cy="134" r="1.4" fill="#ffffff" />
            </g>
          </g>

          {/* ================= 6. SUPERPOSITION HOLOGRAPHIQUE & LIGNES DE SCAN ================= */}
          <rect x="60" y="20" width="300" height="448" fill={`url(#scan-${uid})`} opacity="0.3" pointerEvents="none" />
          <rect x="60" y="20" width="300" height="448" fill={`url(#grid-${uid})`} opacity="0.22" pointerEvents="none" />

          {/* Faisceau lumineux de balayage holographique montant/descendant */}
          <g className="lynara-band" pointerEvents="none">
            <rect x="60" y="0" width="300" height="26" fill={p.main} opacity="0.14" />
            <line x1="60" y1="26" x2="360" y2="26" stroke={p.soft} strokeWidth="1.4" opacity="0.75" filter={`url(#glow-${uid})`} />
          </g>
        </g>
      </svg>

      {/* Badge indicateur d'état conversationnel JYNTRA AI */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-950/85 px-3.5 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)]">
        <span
          className={`h-2 w-2 rounded-full ${
            state === 'speaking'
              ? 'animate-ping bg-cyan-300'
              : state === 'listening'
              ? 'animate-pulse bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
              : state === 'thinking'
              ? 'animate-pulse bg-blue-400 shadow-[0_0_8px_#60a5fa]'
              : state === 'unavailable'
              ? 'bg-slate-400'
              : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
          }`}
        />
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-cyan-100">
          {state === 'speaking'
            ? 'Transmission vocale'
            : state === 'listening'
            ? 'Écoute active'
            : state === 'thinking'
            ? 'Raisonnement'
            : state === 'unavailable'
            ? 'Hors ligne'
            : 'Hologramme stable'}
        </span>
      </div>
    </div>
  );
};