import React, { useId, useMemo } from 'react';
import type { LynaraHoloState } from '../3d/LynaraAvatar3D';

interface LynaraHologram2DProps {
  state: LynaraHoloState;
  /** 0..1 speech envelope for the lip-sync. */
  audioLevel?: number;
  className?: string;
}

const PALETTES: Record<LynaraHoloState, { main: string; soft: string; accent: string; aura: string }> = {
  idle: { main: '#5ee7ff', soft: '#a9f3ff', accent: '#22d3ee', aura: 'rgba(34,211,238,0.30)' },
  listening: { main: '#7df9ff', soft: '#c8fbff', accent: '#06b6d4', aura: 'rgba(6,182,212,0.38)' },
  thinking: { main: '#c4b5fd', soft: '#e9e2ff', accent: '#8b5cf6', aura: 'rgba(139,92,246,0.34)' },
  speaking: { main: '#8ff7e8', soft: '#d8fff9', accent: '#fbbf24', aura: 'rgba(45,212,191,0.34)' },
  unavailable: { main: '#ffb3c1', soft: '#ffe0e6', accent: '#fb7185', aura: 'rgba(251,113,133,0.30)' },
};

/**
 * LYNARA — 2D anime/manga holographic projection.
 *
 * This is deliberately NOT a 3D avatar: a single illustrated bust (chest up),
 * drawn as a layered SVG, projected as translucent light with scanlines,
 * chromatic edges and a soft volumetric base. Everything is deterministic,
 * lightweight, and works without WebGL or external assets.
 */
export const LynaraHologram2D: React.FC<LynaraHologram2DProps> = ({ state, audioLevel = 0, className = '' }) => {
  const uid = useId().replace(/[:]/g, '');
  const p = PALETTES[state] || PALETTES.idle;
  const speaking = state === 'speaking';
  const level = Math.max(0, Math.min(1, audioLevel));
  const mouthOpen = speaking ? Math.max(1.2, level * 9) : 1.1;
  // Discreet expression shifts make her feel alive without cartoon exaggeration.
  const browLift = state === 'thinking' ? -1.6 : state === 'listening' ? 0.8 : 0;
  const smile = state === 'listening' ? 1.4 : state === 'thinking' ? -0.4 : 0.7;

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: 60 + ((i * 97) % 320),
        delay: (i * 0.73) % 6,
        duration: 6 + (i % 5),
        size: i % 3 === 0 ? 2.4 : 1.4,
      })),
    [],
  );

  return (
    <div className={`relative select-none ${className}`} style={{ ['--holo' as any]: p.main, ['--holo-soft' as any]: p.soft, ['--holo-accent' as any]: p.accent }}>
      {/* projection aura */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
        <div className="absolute left-1/2 top-[8%] h-[70%] w-[78%] -translate-x-1/2 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${p.aura} 0%, transparent 68%)` }} />
        <div className="lynara-grid absolute inset-0 opacity-[0.18]" />
        <div className="lynara-scanlines absolute inset-0 opacity-[0.22]" />
        <div className="lynara-beam absolute left-1/2 top-0 h-full w-[62%] -translate-x-1/2" />
        {particles.map((pt) => (
          <span
            key={pt.id}
            className="lynara-mote absolute rounded-full"
            style={{
              left: `${pt.x}px`,
              bottom: '12%',
              width: pt.size,
              height: pt.size,
              background: p.main,
              boxShadow: `0 0 8px ${p.main}`,
              animationDelay: `-${pt.delay}s`,
              animationDuration: `${pt.duration}s`,
            }}
          />
        ))}
      </div>

      <svg viewBox="0 0 420 560" className="relative z-10 h-full w-full" role="img" aria-label="LYNARA, assistante holographique anime en deux dimensions">
        <defs>
          <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor={p.soft} stopOpacity="0.96" />
            <stop offset="55%" stopColor={p.main} stopOpacity="0.82" />
            <stop offset="100%" stopColor={p.accent} stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`hair-${uid}`} x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#ecfeff" stopOpacity="0.95" />
            <stop offset="34%" stopColor={p.main} stopOpacity="0.9" />
            <stop offset="72%" stopColor={p.accent} stopOpacity="0.72" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id={`suit-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.main} stopOpacity="0.30" />
            <stop offset="60%" stopColor={p.accent} stopOpacity="0.22" />
            <stop offset="100%" stopColor={p.accent} stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`iris-${uid}`} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor={p.soft} stopOpacity="0.98" />
            <stop offset="68%" stopColor={p.accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#083344" stopOpacity="1" />
          </radialGradient>
          <linearGradient id={`fade-${uid}`} x1="0" y1="0.55" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="72%" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id={`bust-${uid}`}>
            <rect x="0" y="0" width="420" height="560" fill={`url(#fade-${uid})`} />
          </mask>
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id={`scan-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="transparent" />
            <rect width="6" height="1.2" fill={p.main} fillOpacity="0.22" />
          </pattern>
        </defs>

        {/* projection pedestal */}
        <ellipse cx="210" cy="536" rx="150" ry="18" fill={p.accent} opacity="0.10" />
        <ellipse cx="210" cy="534" rx="108" ry="11" fill="none" stroke={p.main} strokeOpacity="0.42" strokeWidth="1.1" />
        <ellipse cx="210" cy="534" rx="72" ry="7.5" fill="none" stroke={p.soft} strokeOpacity="0.25" strokeWidth="0.9" />

        <g className="lynara-figure" mask={`url(#bust-${uid})`}>
          {/* ---- back hair: crown mass + two long falls behind the shoulders ---- */}
          <path
            className="lynara-hair-back"
            d="M210 82 C 154 82 120 118 120 176 C 120 208 126 236 122 266 L 298 266 C 294 236 300 208 300 176 C 300 118 266 82 210 82 Z"
            fill={`url(#hair-${uid})`}
            opacity="0.55"
          />
          <path
            d="M122 176 C 112 226 110 278 116 328 C 120 364 122 398 116 436 C 112 466 112 500 116 524 C 138 520 152 510 158 496 C 152 460 156 422 164 390 C 172 350 174 310 166 274 C 160 242 160 206 166 182 Z"
            fill={`url(#hair-${uid})`}
            opacity="0.55"
          />
          <path
            d="M298 176 C 308 226 310 278 304 328 C 300 364 298 398 304 436 C 308 466 308 500 304 524 C 282 520 268 510 262 496 C 268 460 264 422 256 390 C 248 350 246 310 254 274 C 260 242 260 206 254 182 Z"
            fill={`url(#hair-${uid})`}
            opacity="0.55"
          />

          {/* ---- neck: drawn before the torso so the collar hides its base ---- */}
          <path
            d="M189 228 C 189 258 189 282 191 300 C 193 314 200 324 210 330 C 220 324 227 314 229 300 C 231 282 231 258 231 228 Z"
            fill={`url(#skin-${uid})`}
            opacity="0.9"
          />
          <path d="M194 282 C 198 294 202 303 208 312" fill="none" stroke={p.accent} strokeOpacity="0.14" strokeWidth="1" />
          <path d="M226 282 C 222 294 218 303 212 312" fill="none" stroke={p.accent} strokeOpacity="0.14" strokeWidth="1" />

          {/* ---- torso: shoulders, V-neck jacket, chest ---- */}
          <path
            d="M210 296 C 199 296 191 300 181 305 C 157 314 134 327 122 344 C 112 372 109 412 108 452 C 107 488 106 522 106 560 L 314 560 C 314 522 313 488 312 452 C 311 412 308 372 298 344 C 286 327 263 314 239 305 C 229 300 221 296 210 296 Z"
            fill={`url(#suit-${uid})`}
            stroke={p.main}
            strokeOpacity="0.30"
            strokeWidth="1.1"
          />
          {/* inside of the V-neck: dark underlayer, not bare skin */}
          <path
            d="M186 307 L 210 358 L 234 307 C 226 304 218 303 210 303 C 202 303 194 304 186 307 Z"
            fill="#041018"
            opacity="0.55"
          />
          {/* lapels + jacket edges */}
          <path d="M186 307 L 210 358 L 234 307" fill="none" stroke={p.soft} strokeOpacity="0.6" strokeWidth="1.4" filter={`url(#glow-${uid})`} />
          <path d="M178 322 L 198 402 L 210 358" fill="none" stroke={p.accent} strokeOpacity="0.34" strokeWidth="1" />
          <path d="M242 322 L 222 402 L 210 358" fill="none" stroke={p.accent} strokeOpacity="0.34" strokeWidth="1" />
          {/* arm seams, defining the shoulders without a cape line */}
          <path d="M126 350 C 118 384 112 424 110 466" fill="none" stroke={p.main} strokeOpacity="0.26" strokeWidth="1.1" />
          <path d="M294 350 C 302 384 308 424 310 466" fill="none" stroke={p.main} strokeOpacity="0.26" strokeWidth="1.1" />
          <path d="M136 396 C 160 386 184 381 210 381 C 236 381 260 386 284 396" fill="none" stroke={p.main} strokeOpacity="0.14" strokeWidth="1" />
          {/* collarbones, visible above the neckline */}
          <path d="M186 300 C 193 296 201 295 208 296" fill="none" stroke={p.soft} strokeOpacity="0.22" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M234 300 C 227 296 219 295 212 296" fill="none" stroke={p.soft} strokeOpacity="0.22" strokeWidth="1.1" strokeLinecap="round" />
          {/* brooch at the collar point */}
          <circle cx="210" cy="366" r="5.5" fill="#080d14" stroke={p.main} strokeOpacity="0.75" strokeWidth="1.1" />
          <circle cx="210" cy="366" r="2.4" fill={p.accent} filter={`url(#glow-${uid})`} />

          {/* ---- face: oval with cheekbones and a tapered jaw ---- */}
          <path
            d="M210 90 C 178 90 156 108 152 140 C 149 166 150 190 154 208 C 159 226 168 240 180 248 C 189 254 199 257 210 257 C 221 257 231 254 240 248 C 252 240 261 226 266 208 C 270 190 271 166 268 140 C 264 108 242 90 210 90 Z"
            fill={`url(#skin-${uid})`}
            opacity="0.93"
          />
          {/* cheekbone light + jawline shading */}
          <path d="M156 176 C 160 182 166 186 173 187" fill="none" stroke={p.soft} strokeOpacity="0.22" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M264 176 C 260 182 254 186 247 187" fill="none" stroke={p.soft} strokeOpacity="0.22" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M168 232 C 178 246 192 254 210 256 C 228 254 242 246 252 232" fill="none" stroke={p.accent} strokeOpacity="0.14" strokeWidth="1.2" />
          {/* crescent shadow under the chin, on the throat only */}
          <path d="M192 257 C 198 265 204 269 210 269 C 216 269 222 265 228 257 C 222 261 216 263 210 263 C 204 263 198 261 192 257 Z" fill="#04121c" opacity="0.26" />

          {/* ears + drop earrings */}
          <path d="M152 178 C 143 175 137 187 140 201 C 142 211 149 216 153 210" fill={`url(#skin-${uid})`} opacity="0.85" />
          <path d="M268 178 C 277 175 283 187 280 201 C 278 211 271 216 267 210" fill={`url(#skin-${uid})`} opacity="0.85" />
          <path d="M145 208 L 145 213 M275 208 L 275 213" stroke={p.soft} strokeOpacity="0.5" strokeWidth="0.9" />
          <circle cx="145" cy="215" r="2" fill="none" stroke={p.soft} strokeOpacity="0.65" strokeWidth="0.9" />
          <circle cx="275" cy="215" r="2" fill="none" stroke={p.soft} strokeOpacity="0.65" strokeWidth="0.9" />

          {/* brows, above the eyes and below the fringe */}
          <path d={`M168 ${168 + browLift} C 175 ${162 + browLift} 186 ${161 + browLift} 194 ${166 + browLift}`} fill="none" stroke={p.soft} strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
          <path d={`M226 ${166 + browLift} C 234 ${161 + browLift} 245 ${162 + browLift} 252 ${168 + browLift}`} fill="none" stroke={p.soft} strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />

          {/* eyes: almond, adult proportions, lid line + iris */}
          <g className="lynara-blink" style={{ transformOrigin: '210px 190px' }}>
            <g className="lynara-gaze">
              {/* left */}
              <ellipse cx="183" cy="190" rx="14.6" ry="9" fill="#04121c" opacity="0.34" />
              <ellipse cx="183" cy="190" rx="13.2" ry="7.5" fill="#dcf6ff" opacity="0.86" />
              <circle cx="184" cy="190.5" r="7.6" fill={`url(#iris-${uid})`} />
              <circle cx="184" cy="190.5" r="3.1" fill="#04121c" />
              <circle cx="181.4" cy="188.4" r="2.1" fill="#ffffff" opacity="0.97" />
              <circle cx="186.6" cy="193.6" r="1" fill="#ffffff" opacity="0.7" />
              <path d="M169 189 C 175 181 191 180 197 188" fill="none" stroke="#062a38" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M169 188 L 165 184 M196 187 L 200 183" stroke="#062a38" strokeWidth="1.4" strokeLinecap="round" />
              {/* right */}
              <ellipse cx="237" cy="190" rx="14.6" ry="9" fill="#04121c" opacity="0.34" />
              <ellipse cx="237" cy="190" rx="13.2" ry="7.5" fill="#dcf6ff" opacity="0.86" />
              <circle cx="236" cy="190.5" r="7.6" fill={`url(#iris-${uid})`} />
              <circle cx="236" cy="190.5" r="3.1" fill="#04121c" />
              <circle cx="233.4" cy="188.4" r="2.1" fill="#ffffff" opacity="0.97" />
              <circle cx="238.6" cy="193.6" r="1" fill="#ffffff" opacity="0.7" />
              <path d="M223 188 C 229 180 245 181 251 189" fill="none" stroke="#062a38" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M224 187 L 220 183 M251 188 L 255 184" stroke="#062a38" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </g>

          {/* nose: bridge shadow + tip, no hard line */}
          <path d="M208 205 C 206 212 205 217 208 220" fill="none" stroke={p.accent} strokeOpacity="0.40" strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="206.5" cy="221" rx="3.4" ry="1.3" fill={p.accent} opacity="0.16" />

          {/* blush */}
          <ellipse cx="169" cy="215" rx="10" ry="4" fill={p.accent} opacity="0.10" />
          <ellipse cx="251" cy="215" rx="10" ry="4" fill={p.accent} opacity="0.10" />

          {/* lips: cupid's bow + lower lip, real lip-sync */}
          <g className="lynara-mouth" style={{ transformOrigin: '210px 234px' }}>
            {speaking && (
              <ellipse
                cx="210"
                cy={235.4 + mouthOpen * 0.3}
                rx={7.6}
                ry={Math.max(0.9, mouthOpen * 0.42)}
                fill="#041b24"
                opacity="0.62"
              />
            )}
            <path
              d="M200 233 Q 205 231 210 233 Q 215 231 220 233"
              fill="none"
              stroke="#08303f"
              strokeOpacity="0.82"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M203 235.4 Q 210 ${236.6 + smile * 0.6} 217 235.4`}
              fill="none"
              stroke={p.soft}
              strokeOpacity="0.34"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          </g>

          {/* ---- front hair: side-swept fringe above the brows ---- */}
          <path
            className="lynara-hair-front"
            d="M210 80 C 158 80 124 116 124 178 C 124 190 126 199 130 207 C 137 194 149 184 165 178 C 190 169 214 166 236 169 C 258 171 276 178 288 187 C 294 192 297 200 297 207 C 300 198 302 190 301 178 C 299 116 262 80 210 80 Z"
            fill={`url(#hair-${uid})`}
            opacity="0.9"
          />
          {/* fringe strands, following the sweep and staying above the brows */}
          <path d="M180 88 C 168 108 162 132 164 154" fill="none" stroke="#ecfeff" strokeOpacity="0.30" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M214 88 C 204 108 200 130 202 150" fill="none" stroke="#ecfeff" strokeOpacity="0.22" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M250 94 C 248 114 250 134 256 152" fill="none" stroke="#ecfeff" strokeOpacity="0.18" strokeWidth="1.1" strokeLinecap="round" />
          {/* soft parting line, center-left */}
          <path d="M196 88 C 190 110 188 132 190 152" fill="none" stroke="#0e7490" strokeOpacity="0.28" strokeWidth="1.6" strokeLinecap="round" />
          {/* side locks framing the face, tips over the shoulders */}
          <path d="M127 170 C 118 214 115 262 119 308 C 121 336 124 362 128 386 C 132 358 136 332 140 310 C 145 270 147 226 143 194 C 139 180 133 173 127 170 Z" fill={`url(#hair-${uid})`} opacity="0.66" />
          <path d="M293 170 C 302 214 305 262 301 308 C 299 336 296 362 292 386 C 288 358 284 332 280 310 C 275 270 273 226 277 194 C 281 180 287 173 293 170 Z" fill={`url(#hair-${uid})`} opacity="0.66" />

          {/* tech hairpin */}
          <path d="M282 150 L 296 143 L 299 154 L 285 160 Z" fill="none" stroke={p.accent} strokeOpacity="0.7" strokeWidth="1" />
          <circle cx="298" cy="145" r="1.8" fill={p.accent} />
        </g>

        {/* hologram overlay across the whole bust */}
        <rect x="0" y="0" width="420" height="560" fill={`url(#scan-${uid})`} opacity="0.5" mask={`url(#bust-${uid})`} pointerEvents="none" />
        <rect x="0" y="0" width="420" height="560" fill="none" stroke={p.main} strokeOpacity="0.08" strokeWidth="1.5" />
        {/* travelling scan band */}
        <g className="lynara-band" mask={`url(#bust-${uid})`} pointerEvents="none">
          <rect x="0" y="-24" width="420" height="24" fill={p.main} opacity="0.10" />
          <rect x="0" y="0" width="420" height="1.4" fill={p.soft} opacity="0.55" />
        </g>
      </svg>

      {/* state chip */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-950/75 px-3 py-1.5 backdrop-blur-md">
        <span className={`h-1.5 w-1.5 rounded-full ${state === 'speaking' ? 'animate-ping bg-amber-300' : state === 'listening' ? 'animate-pulse bg-cyan-300' : state === 'thinking' ? 'animate-pulse bg-violet-300' : state === 'unavailable' ? 'bg-rose-400' : 'bg-emerald-300'}`} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/90">
          {state === 'speaking' ? 'Transmission vocale' : state === 'listening' ? 'Écoute active' : state === 'thinking' ? 'Raisonnement' : state === 'unavailable' ? 'Hors ligne' : 'Hologramme stable'}
        </span>
      </div>
    </div>
  );
};
