import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * PageScene3D — central, living 3D backdrop for the internal pages.
 *
 * Design goals (mirroring the Multi-Agent page presence):
 *  - one large composition, centred in the viewport, with real volume;
 *  - continuous, fluid motion (rotation, orbits, flowing packets, pulses);
 *  - one distinct signature geometry per product page;
 *  - a dedicated light-theme render path (no additive blending on white,
 *    darker saturated bodies, real lighting) so the scene stays clearly
 *    visible in day mode;
 *  - a single renderer kept alive across internal routes, so switching
 *    pages never reloads or restarts WebGL.
 */

export type PageSceneVariant =
  | 'workspace'
  | 'chart'
  | 'lynara'
  | 'markets'
  | 'risk'
  | 'backtest'
  | 'journal'
  | 'news'
  | 'workflow'
  | 'academy'
  | 'jyntrack'
  | 'settings'
  | 'login'
  | 'register';

interface Palette {
  primary: number;
  secondary: number;
  accent: number;
  frame: number;
  grid: boolean;
  density: number;
}

const TAU = Math.PI * 2;

const PALETTES: Record<PageSceneVariant, Palette> = {
  // Command centre: cyan/blue holographic lattice.
  workspace: { primary: 0x22d3ee, secondary: 0x3b82f6, accent: 0xa5f3fc, frame: 4.9, grid: true, density: 1 },
  // Market analysis: emerald price structure.
  chart: { primary: 0x10b981, secondary: 0x34d399, accent: 0xa7f3d0, frame: 4.9, grid: true, density: 1 },
  // Conversational AI: cyan holographic orb.
  lynara: { primary: 0x22d3ee, secondary: 0x0ea5e9, accent: 0x67e8f9, frame: 4.9, grid: false, density: 1 },
  // Global markets: orange/amber globe.
  markets: { primary: 0xf97316, secondary: 0xfb923c, accent: 0xfcd34d, frame: 5.1, grid: true, density: 1.05 },
  // Risk: rose/red gyroscope and shield.
  risk: { primary: 0xef4444, secondary: 0xf87171, accent: 0xfecaca, frame: 4.9, grid: false, density: 0.95 },
  // Backtest: violet time corridor.
  backtest: { primary: 0x8b5cf6, secondary: 0xa78bfa, accent: 0xd8b4fe, frame: 5.0, grid: true, density: 1 },
  // Journal: amber floating ledger.
  journal: { primary: 0xf59e0b, secondary: 0xfbbf24, accent: 0xfde68a, frame: 4.8, grid: false, density: 1 },
  // News: sky/cyan broadcast sphere.
  news: { primary: 0x0ea5e9, secondary: 0x38bdf8, accent: 0x7dd3fc, frame: 4.9, grid: false, density: 1 },
  // Workflow: teal connected pipeline.
  workflow: { primary: 0x06b6d4, secondary: 0x22d3ee, accent: 0x67e8f9, frame: 5.0, grid: true, density: 1.05 },
  // Academy: indigo knowledge helix.
  academy: { primary: 0x6366f1, secondary: 0x818cf8, accent: 0xa5b4fc, frame: 5.0, grid: false, density: 1 },
  // JYNTrack: orange performance vortex.
  jyntrack: { primary: 0xf97316, secondary: 0xfbbf24, accent: 0xfde68a, frame: 5.0, grid: true, density: 1 },
  // Settings: slate mechanical gears.
  settings: { primary: 0x64748b, secondary: 0x94a3b8, accent: 0xcbd5e1, frame: 4.9, grid: false, density: 0.95 },
  // Login: blue identity portal.
  login: { primary: 0x3b82f6, secondary: 0x60a5fa, accent: 0xbfdbfe, frame: 4.8, grid: false, density: 0.9 },
  // Register: blue genesis prism.
  register: { primary: 0x2563eb, secondary: 0x38bdf8, accent: 0x93c5fd, frame: 4.8, grid: false, density: 0.9 },
};

interface BuildCtx {
  world: THREE.Group;
  palette: Palette;
  light: boolean;
  mobile: boolean;
  tablet: boolean;
  glowTexture: THREE.Texture;
  geos: THREE.BufferGeometry[];
  mats: THREE.Material[];
  updaters: Array<(t: number, dt: number) => void>;
}

/* -------------------------------------------------------------------------- */
/*  Theme-aware material helpers                                              */
/* -------------------------------------------------------------------------- */

function shade(hex: number, factor: number): number {
  const r = Math.min(255, ((hex >> 16) & 0xff) * factor);
  const g = Math.min(255, ((hex >> 8) & 0xff) * factor);
  const b = Math.min(255, (hex & 0xff) * factor);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

function trackGeo<T extends THREE.BufferGeometry>(ctx: BuildCtx, geo: T): T {
  ctx.geos.push(geo);
  return geo;
}

function trackMat<T extends THREE.Material>(ctx: BuildCtx, mat: T): T {
  ctx.mats.push(mat);
  return mat;
}

/**
 * Line/accent material.
 * Light: normal blending over a darker saturated ink colour.
 * Dark: additive glow, like the Multi-Agent ambient scene.
 */
function accentMat(ctx: BuildCtx, color: number, opacity: number) {
  const light = ctx.light;
  return trackMat(
    ctx,
    new THREE.MeshBasicMaterial({
      color: light ? shade(color, 0.66) : color,
      transparent: true,
      opacity: light ? Math.min(1, opacity * 1.35) : opacity,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
}

function lineMat(ctx: BuildCtx, color: number, opacity: number) {
  const light = ctx.light;
  return trackMat(
    ctx,
    new THREE.LineBasicMaterial({
      color: light ? shade(color, 0.62) : color,
      transparent: true,
      opacity: light ? Math.min(1, opacity * 1.5) : opacity,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    }),
  );
}

/** Translucent glass shell / holographic panel. */
function glassMat(ctx: BuildCtx, color: number, opacity: number) {
  const light = ctx.light;
  return trackMat(
    ctx,
    new THREE.MeshBasicMaterial({
      color: light ? shade(color, 0.78) : color,
      transparent: true,
      opacity: light ? opacity * 1.15 : opacity,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
}

/** Solid volumetric body with a readable silhouette in both themes. */
function bodyMat(ctx: BuildCtx, color: number, intensity = 0.9) {
  const light = ctx.light;
  return trackMat(
    ctx,
    new THREE.MeshStandardMaterial({
      color: light ? shade(color, 0.46) : 0x0a1526,
      emissive: light ? shade(color, 0.7) : color,
      emissiveIntensity: light ? 0.22 : intensity,
      metalness: light ? 0.5 : 0.72,
      roughness: light ? 0.32 : 0.26,
    }),
  );
}

function addSprite(ctx: BuildCtx, color: number, size: number, opacity = 0.85) {
  const light = ctx.light;
  const mat = trackMat(
    ctx,
    new THREE.SpriteMaterial({
      map: ctx.glowTexture,
      color: light ? shade(color, 0.78) : color,
      transparent: true,
      opacity: light ? Math.min(0.8, opacity * 0.72) : opacity,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    }),
  );
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(size);
  return sprite;
}

/** Soft coloured halo behind the composition; gives it real presence. */
function addHalo(ctx: BuildCtx, color: number, size: number, opacity: number) {
  const light = ctx.light;
  const mat = trackMat(
    ctx,
    new THREE.SpriteMaterial({
      map: ctx.glowTexture,
      color: light ? shade(color, 0.86) : color,
      transparent: true,
      opacity: light ? opacity * 0.55 : opacity,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    }),
  );
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(size);
  return sprite;
}

function tube(
  ctx: BuildCtx,
  curve: THREE.Curve<THREE.Vector3>,
  radius: number,
  color: number,
  opacity: number,
  segments = 90,
) {
  const mesh = new THREE.Mesh(
    trackGeo(ctx, new THREE.TubeGeometry(curve, segments, radius, 6, false)),
    accentMat(ctx, color, opacity),
  );
  return mesh;
}

/* -------------------------------------------------------------------------- */
/*  Shared ambient layers                                                     */
/* -------------------------------------------------------------------------- */

function buildParticles(ctx: BuildCtx, count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 11 - 1.5;
    speeds[i] = 0.16 + Math.random() * 0.55;
  }
  const geo = trackGeo(ctx, new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const light = ctx.light;
  const mat = trackMat(
    ctx,
    new THREE.PointsMaterial({
      color: light ? shade(ctx.palette.accent, 0.68) : ctx.palette.accent,
      size: light ? (ctx.mobile ? 0.11 : 0.085) : ctx.mobile ? 0.09 : 0.07,
      map: ctx.glowTexture,
      transparent: true,
      opacity: light ? 0.6 : 0.5,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.02,
    }),
  );
  const points = new THREE.Points(geo, mat);
  ctx.world.add(points);
  const halfY = 6;
  ctx.updaters.push((_t, dt) => {
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      if (arr[i * 3 + 1] > halfY) arr[i * 3 + 1] = -halfY;
    }
    attr.needsUpdate = true;
  });
}

function buildSatellites(ctx: BuildCtx, count: number) {
  const shapes = [
    trackGeo(ctx, new THREE.OctahedronGeometry(0.22, 0)),
    trackGeo(ctx, new THREE.TetrahedronGeometry(0.26, 0)),
    trackGeo(ctx, new THREE.IcosahedronGeometry(0.2, 0)),
  ];
  const materials = [
    accentMat(ctx, ctx.palette.secondary, 0.7),
    accentMat(ctx, ctx.palette.accent, 0.75),
    accentMat(ctx, ctx.palette.primary, 0.65),
  ];

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(shapes[i % shapes.length], materials[i % materials.length]);
    const angle = (i / count) * TAU + Math.random() * 0.35;
    const radius = (ctx.palette.frame * 0.72) * (0.82 + Math.random() * 0.26);
    const yBase = (Math.random() - 0.5) * 4.4;
    const speed = (0.13 + Math.random() * 0.14) * (i % 2 === 0 ? 1 : -1);
    const bob = 0.45 + Math.random() * 0.9;
    const phase = Math.random() * TAU;
    const spin = 0.22 + Math.random() * 0.4;
    ctx.world.add(mesh);
    ctx.updaters.push((t) => {
      const a = angle + t * speed;
      mesh.position.set(
        Math.cos(a) * radius,
        yBase + Math.sin(t * bob + phase) * 0.22,
        Math.sin(a) * radius * 0.62,
      );
      mesh.rotation.x = t * spin + phase;
      mesh.rotation.y = t * spin * 0.75 + angle;
      mesh.rotation.z = t * spin * 0.35;
    });
  }
}

function buildAmbientRings(ctx: BuildCtx) {
  const radius = ctx.palette.frame * 1.02;
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(radius - i * 0.5, 0.014, 6, 150)),
      glassMat(ctx, i === 0 ? ctx.palette.secondary : ctx.palette.primary, ctx.light ? 0.34 : 0.26),
    );
    ring.rotation.set(1.15 + i * 0.5, 0.35 + i * 0.8, 0);
    ring.position.z = -1.2;
    ctx.world.add(ring);
    const speed = i === 0 ? 0.2 : -0.16;
    ctx.updaters.push((t) => {
      ring.rotation.z = t * speed;
      ring.position.y = Math.sin(t * 0.45 + i) * 0.18;
    });
  }
}

function buildGridFloor(ctx: BuildCtx) {
  if (!ctx.palette.grid) return;
  const size = 38;
  const divisions = ctx.mobile ? 22 : 32;
  const grid = new THREE.GridHelper(
    size,
    divisions,
    ctx.light ? shade(ctx.palette.primary, 0.72) : ctx.palette.primary,
    ctx.light ? shade(ctx.palette.secondary, 0.8) : ctx.palette.secondary,
  );
  const mat = grid.material as THREE.LineBasicMaterial;
  mat.transparent = true;
  mat.opacity = ctx.light ? 0.14 : 0.075;
  mat.depthWrite = false;
  mat.blending = ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending;
  ctx.mats.push(mat);
  ctx.geos.push(grid.geometry);
  grid.position.set(0, -4.5, -4);
  ctx.world.add(grid);
  const step = size / divisions;
  ctx.updaters.push((t) => {
    grid.position.z = -4 + ((t * 0.55) % step);
  });
}

/* -------------------------------------------------------------------------- */
/*  Signature compositions — one per page                                     */
/* -------------------------------------------------------------------------- */

/** MARKETS — global market globe with orbiting candles and trade arcs. */
function buildMarkets(ctx: BuildCtx) {
  const group = new THREE.Group();
  const radius = 2.85;

  const sphereGeo = trackGeo(ctx, new THREE.SphereGeometry(radius, 30, 22));
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.WireframeGeometry(sphereGeo)),
      lineMat(ctx, ctx.palette.secondary, 0.4),
    ),
  );
  group.add(
    new THREE.Mesh(
      sphereGeo,
      glassMat(ctx, ctx.palette.primary, ctx.light ? 0.16 : 0.09),
    ),
  );

  for (let k = 1; k <= 7; k++) {
    const y = -radius + (2 * radius * k) / 8;
    const r = Math.sqrt(Math.max(0.0001, radius * radius - y * y));
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(r, 0.012, 5, 110)),
      accentMat(ctx, ctx.palette.secondary, 0.55),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  }
  for (let k = 0; k < 6; k++) {
    const meridian = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(radius, 0.011, 5, 120)),
      accentMat(ctx, ctx.palette.primary, 0.42),
    );
    meridian.rotation.y = (k / 6) * Math.PI;
    group.add(meridian);
  }

  // Trade routes with travelling packets.
  const surfacePoint = () => {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * TAU;
    return new THREE.Vector3().setFromSphericalCoords(radius, theta, phi);
  };
  for (let i = 0; i < 10; i++) {
    const a = surfacePoint();
    const b = surfacePoint();
    const mid = a.clone().add(b).normalize().multiplyScalar(radius * 1.35);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    group.add(tube(ctx, curve, 0.018, ctx.palette.accent, 0.75, 44));
    const packet = addSprite(ctx, ctx.palette.accent, 0.3, 0.95);
    group.add(packet);
    const offset = i / 10;
    const speed = 0.14 + Math.random() * 0.1;
    ctx.updaters.push((t) => {
      packet.position.copy(curve.getPointAt((t * speed + offset) % 1));
    });
  }

  // Orbiting price candles give the globe its market identity.
  const candleGeo = trackGeo(ctx, new THREE.BoxGeometry(0.16, 1, 0.16));
  const upMat = bodyMat(ctx, ctx.palette.primary, 1.1);
  const downMat = bodyMat(ctx, ctx.palette.secondary, 0.8);
  const candles: Array<{ mesh: THREE.Mesh; base: number; phase: number }> = [];
  const candleCount = ctx.mobile ? 18 : 28;
  const candleRing = new THREE.Group();
  candleRing.rotation.x = 0.28;
  candleRing.rotation.z = -0.12;
  for (let i = 0; i < candleCount; i++) {
    const angle = (i / candleCount) * TAU;
    const h = 0.45 + Math.abs(Math.sin(i * 1.7 + 0.6)) * 1.75;
    const mesh = new THREE.Mesh(candleGeo, i % 3 === 0 ? downMat : upMat);
    mesh.scale.y = h;
    mesh.position.set(Math.cos(angle) * 4.15, (i / candleCount - 0.5) * 1.4, Math.sin(angle) * 4.15);
    candleRing.add(mesh);
    candles.push({ mesh, base: h, phase: i * 0.55 });
  }
  group.add(candleRing);

  // Large horizon ring, tilted, reads as a trading session cycle.
  const horizon = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(4.5, 0.02, 6, 170)),
    accentMat(ctx, ctx.palette.accent, 0.5),
  );
  horizon.rotation.x = Math.PI / 2.35;
  group.add(horizon);

  ctx.world.add(group);

  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.26;
    group.rotation.x = Math.sin(t * 0.3) * 0.1;
    candleRing.rotation.y = -t * 0.18;
    horizon.rotation.z = t * 0.12;
    for (const candle of candles) {
      candle.mesh.scale.y = candle.base * (0.9 + Math.sin(t * 1.7 + candle.phase) * 0.1);
    }
  });
}

/** CHART — ascending three-dimensional candlestick spiral and price ribbon. */
function buildChart(ctx: BuildCtx) {
  const group = new THREE.Group();
  const count = ctx.mobile ? 20 : 30;
  const barGeo = trackGeo(ctx, new THREE.BoxGeometry(0.2, 1, 0.2));
  const upMat = bodyMat(ctx, ctx.palette.primary, 1.15);
  const downMat = bodyMat(ctx, ctx.palette.secondary, 0.85);
  const bars: Array<{ mesh: THREE.Mesh; base: number; phase: number }> = [];
  const top: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    const p = i / (count - 1);
    const angle = p * TAU * 1.15 - 0.5;
    const r = 2.55 - p * 0.25;
    const h = 0.55 + Math.abs(Math.sin(i * 0.85 + 0.9)) * 1.7 + p * 1.15;
    const mesh = new THREE.Mesh(barGeo, i % 4 === 0 ? downMat : upMat);
    mesh.scale.y = h;
    mesh.position.set(
      Math.cos(angle) * r,
      -2.0 + p * 4.1,
      Math.sin(angle) * r,
    );
    group.add(mesh);
    bars.push({ mesh, base: h, phase: i * 0.42 });
    top.push(new THREE.Vector3(mesh.position.x, mesh.position.y + h * 0.5, mesh.position.z));
  }
  top.push(top[0].clone());
  const priceCurve = new THREE.CatmullRomCurve3(top, true);
  group.add(
    new THREE.Mesh(
      trackGeo(ctx, new THREE.TubeGeometry(priceCurve, 220, 0.035, 6, true)),
      accentMat(ctx, ctx.palette.accent, 0.85),
    ),
  );

  // Flowing packet along the price ribbon.
  const packet = addSprite(ctx, ctx.palette.accent, 0.45, 1);
  group.add(packet);
  ctx.updaters.push((t) => {
    packet.position.copy(priceCurve.getPointAt((t * 0.09) % 1));
  });

  // Analytical planes through the structure.
  for (let i = 0; i < 3; i++) {
    const plane = new THREE.Mesh(
      trackGeo(ctx, new THREE.PlaneGeometry(7.2, 4.2, 10, 6)),
      trackMat(
        ctx,
        new THREE.MeshBasicMaterial({
          color: ctx.light ? shade(ctx.palette.primary, 0.75) : ctx.palette.primary,
          wireframe: true,
          transparent: true,
          opacity: ctx.light ? 0.2 : 0.11,
          depthWrite: false,
          blending: ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      ),
    );
    plane.position.set(0, -1.2 + i * 1.7, -1.2 - i * 0.55);
    plane.rotation.x = -0.55 + i * 0.25;
    plane.rotation.z = 0.15;
    group.add(plane);
  }

  const ring = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(3.55, 0.018, 6, 150)),
    accentMat(ctx, ctx.palette.secondary, 0.55),
  );
  ring.rotation.x = Math.PI / 2.2;
  group.add(ring);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.34;
    group.rotation.x = Math.sin(t * 0.26) * 0.1;
    ring.rotation.z = t * 0.2;
    for (const bar of bars) {
      bar.mesh.scale.y = bar.base * (0.9 + Math.sin(t * 1.8 + bar.phase) * 0.1);
    }
  });
}

/** RISK — three-axis gyroscope protecting a faceted core. */
function buildRisk(ctx: BuildCtx) {
  const group = new THREE.Group();

  const coreGeo = trackGeo(ctx, new THREE.OctahedronGeometry(1.95, 1));
  const core = new THREE.Mesh(coreGeo, bodyMat(ctx, ctx.palette.primary, 1.25));
  group.add(core);
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.EdgesGeometry(coreGeo)),
      lineMat(ctx, ctx.palette.accent, 0.9),
    ),
  );

  const inner = new THREE.Mesh(
    trackGeo(ctx, new THREE.IcosahedronGeometry(1.15, 1)),
    accentMat(ctx, ctx.palette.accent, 0.7),
  );
  group.add(inner);

  const cage = new THREE.Mesh(
    trackGeo(ctx, new THREE.IcosahedronGeometry(2.8, 1)),
    trackMat(
      ctx,
      new THREE.MeshBasicMaterial({
        color: ctx.light ? shade(ctx.palette.secondary, 0.7) : ctx.palette.secondary,
        wireframe: true,
        transparent: true,
        opacity: ctx.light ? 0.38 : 0.24,
        depthWrite: false,
        blending: ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    ),
  );
  group.add(cage);

  // Three gyro rings, each rotating on its own axis.
  const ringGeo = trackGeo(ctx, new THREE.TorusGeometry(2.75, 0.022, 6, 160));
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeo, accentMat(ctx, i === 1 ? ctx.palette.accent : ctx.palette.secondary, 0.65));
    ring.rotation.set(0.4 + i * 0.9, i * 1.2, i * 0.6);
    group.add(ring);
    rings.push(ring);
  }

  // Orbiting probability nodes.
  const nodes: THREE.Mesh[] = [];
  const nodeGeo = trackGeo(ctx, new THREE.SphereGeometry(0.1, 8, 8));
  const nodeMat = accentMat(ctx, ctx.palette.accent, 0.95);
  for (let i = 0; i < 14; i++) {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    group.add(node);
    nodes.push(node);
  }

  const shield = new THREE.Mesh(
    trackGeo(ctx, new THREE.CylinderGeometry(3.1, 3.1, 3.7, 6, 1, true)),
    trackMat(
      ctx,
      new THREE.MeshBasicMaterial({
        color: ctx.light ? shade(ctx.palette.primary, 0.72) : ctx.palette.primary,
        wireframe: true,
        transparent: true,
        opacity: ctx.light ? 0.28 : 0.13,
        depthWrite: false,
        blending: ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    ),
  );
  group.add(shield);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.2;
    group.rotation.x = Math.sin(t * 0.24) * 0.12;
    core.rotation.y = -t * 0.42;
    core.rotation.x = t * 0.22;
    core.scale.setScalar(1 + Math.sin(t * 1.9) * 0.05);
    inner.rotation.y = t * 0.7;
    inner.rotation.z = t * 0.3;
    cage.rotation.y = -t * 0.16;
    cage.rotation.x = t * 0.1;
    shield.rotation.y = t * 0.08;
    rings[0].rotation.z = t * 0.5;
    rings[1].rotation.x = Math.PI / 2 + t * 0.38;
    rings[2].rotation.y = t * -0.44;
    nodes.forEach((node, i) => {
      const a = (i / nodes.length) * TAU + t * 0.32;
      const r = 3.15 + Math.sin(t * 0.8 + i) * 0.12;
      node.position.set(
        Math.cos(a) * r,
        Math.sin(a * 1.7 + i) * 1.6,
        Math.sin(a) * r * 0.7,
      );
    });
  });
}

/** BACKTEST — receding time gates with a trajectory passing through them. */
function buildBacktest(ctx: BuildCtx) {
  const group = new THREE.Group();
  const gates = ctx.mobile ? 6 : 9;
  const gateGroup = new THREE.Group();

  for (let i = 0; i < gates; i++) {
    const p = i / (gates - 1);
    const w = 4.4 - p * 1.7;
    const h = 3.3 - p * 1.25;
    const z = 2.1 - p * 9.2;
    const frame = new THREE.Group();
    const plane = new THREE.Mesh(
      trackGeo(ctx, new THREE.PlaneGeometry(w, h)),
      glassMat(ctx, i % 2 === 0 ? ctx.palette.primary : ctx.palette.secondary, 0.06 + (1 - p) * 0.04),
    );
    frame.add(plane);
    frame.add(
      new THREE.LineSegments(
        trackGeo(ctx, new THREE.EdgesGeometry(plane.geometry as THREE.BufferGeometry)),
        lineMat(ctx, i % 2 === 0 ? ctx.palette.accent : ctx.palette.secondary, 0.75 - p * 0.35),
      ),
    );
    // Small history markers on each gate.
    for (let k = -1; k <= 1; k++) {
      const tick = new THREE.Mesh(
        trackGeo(ctx, new THREE.BoxGeometry(0.06, 0.3, 0.06)),
        accentMat(ctx, ctx.palette.accent, 0.55),
      );
      tick.position.set(k * w * 0.28, -h * 0.3, 0.02);
      frame.add(tick);
    }
    frame.position.z = z;
    gateGroup.add(frame);
  }
  group.add(gateGroup);

  // Trajectory weaving through the corridor.
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 14; i++) {
    const p = i / 14;
    points.push(
      new THREE.Vector3(
        Math.sin(p * Math.PI * 2.2) * 1.55,
        Math.cos(p * Math.PI * 1.7) * 0.95,
        3.2 - p * 11.2,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);
  group.add(tube(ctx, curve, 0.045, ctx.palette.accent, 0.8, 150));

  const packet = addSprite(ctx, ctx.palette.accent, 0.42, 1);
  const packetB = addSprite(ctx, ctx.palette.secondary, 0.28, 0.9);
  group.add(packet, packetB);
  ctx.updaters.push((t) => {
    packet.position.copy(curve.getPointAt((t * 0.11) % 1));
    packetB.position.copy(curve.getPointAt((t * 0.11 + 0.43) % 1));
  });

  // Rewind ring around the corridor.
  const ring = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(4.0, 0.02, 6, 150)),
    accentMat(ctx, ctx.palette.secondary, 0.55),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.28) * 0.22;
    group.rotation.x = Math.sin(t * 0.2) * 0.08;
    gateGroup.rotation.z = Math.sin(t * 0.35) * 0.04;
    ring.rotation.z = t * 0.28;
    ring.scale.setScalar(1 + Math.sin(t * 1.1) * 0.025);
  });
}

/** JOURNAL — holographic ledger: open pages floating in a spiral. */
function buildJournal(ctx: BuildCtx) {
  const group = new THREE.Group();

  // Central luminous spine.
  const spine = new THREE.Mesh(
    trackGeo(ctx, new THREE.CylinderGeometry(0.14, 0.14, 4.4, 10)),
    bodyMat(ctx, ctx.palette.primary, 1.1),
  );
  group.add(spine);

  // Two large open pages.
  for (let side = 0; side < 2; side++) {
    const page = new THREE.Group();
    const w = 2.4;
    const h = 3.0;
    const plane = new THREE.Mesh(
      trackGeo(ctx, new THREE.PlaneGeometry(w, h)),
      glassMat(ctx, ctx.palette.primary, ctx.light ? 0.18 : 0.1),
    );
    page.add(plane);
    page.add(
      new THREE.LineSegments(
        trackGeo(ctx, new THREE.EdgesGeometry(plane.geometry as THREE.BufferGeometry)),
        lineMat(ctx, ctx.palette.accent, 0.7),
      ),
    );
    // Ruled lines + observation curve.
    for (let k = 0; k < 7; k++) {
      const y = -h / 2 + 0.4 + (k / 7) * (h - 0.7);
      const line = new THREE.Line(
        trackGeo(
          ctx,
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 + 0.22, y, 0.012),
            new THREE.Vector3(w / 2 - 0.22, y, 0.012),
          ]),
        ),
        lineMat(ctx, ctx.palette.secondary, 0.35),
      );
      page.add(line);
    }
    const curvePoints: THREE.Vector3[] = [];
    for (let k = 0; k <= 10; k++) {
      const p = k / 10;
      curvePoints.push(new THREE.Vector3(-w * 0.36 + p * w * 0.72, Math.sin(p * Math.PI * 2.2) * h * 0.2, 0.02));
    }
    page.add(
      new THREE.Line(
        trackGeo(ctx, new THREE.BufferGeometry().setFromPoints(curvePoints)),
        lineMat(ctx, ctx.palette.primary, 0.8),
      ),
    );
    page.rotation.y = side === 0 ? 0.62 : -0.62;
    page.position.x = side === 0 ? -1.15 : 1.15;
    page.position.z = side === 0 ? 0.35 : 0.35;
    group.add(page);
  }

  // Floating memory sheets.
  const sheets = ctx.mobile ? 5 : 8;
  for (let i = 0; i < sheets; i++) {
    const sheet = new THREE.Group();
    const w = 1.25 + (i % 2) * 0.3;
    const h = 0.82 + (i % 3) * 0.12;
    const plane = new THREE.Mesh(
      trackGeo(ctx, new THREE.PlaneGeometry(w, h)),
      glassMat(ctx, i % 2 === 0 ? ctx.palette.secondary : ctx.palette.primary, 0.12),
    );
    sheet.add(plane);
    sheet.add(
      new THREE.LineSegments(
        trackGeo(ctx, new THREE.EdgesGeometry(plane.geometry as THREE.BufferGeometry)),
        lineMat(ctx, ctx.palette.accent, 0.55),
      ),
    );
    group.add(sheet);

    const angle = (i / sheets) * TAU;
    const radius = 3.2 + (i % 3) * 0.28;
    const baseY = (Math.random() - 0.5) * 3.6;
    const phase = Math.random() * TAU;
    ctx.updaters.push((t) => {
      const a = angle + t * 0.22;
      sheet.position.set(
        Math.cos(a) * radius,
        baseY + Math.sin(t * 0.8 + phase) * 0.24,
        Math.sin(a) * radius * 0.62,
      );
      sheet.rotation.set(
        Math.sin(t * 0.6 + phase) * 0.22,
        -a + Math.PI / 2,
        Math.sin(t * 0.45 + phase) * 0.16,
      );
    });
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.28) * 0.2;
    group.rotation.x = Math.sin(t * 0.2) * 0.06;
    spine.rotation.y = t * 0.25;
  });
}

/** ACADEMY — vertical knowledge helix with orbiting learning nodes. */
function buildAcademy(ctx: BuildCtx) {
  const group = new THREE.Group();
  const turns = 2.5;
  const height = 6.1;
  const radius = 1.65;

  for (let strand = 0; strand < 2; strand++) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 150; i++) {
      const p = i / 150;
      const angle = p * TAU * turns + strand * Math.PI;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          -height / 2 + p * height,
          Math.sin(angle) * radius,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    group.add(tube(ctx, curve, 0.085, strand === 0 ? ctx.palette.primary : ctx.palette.secondary, 0.85, 190));
  }

  for (let i = 0; i < 20; i++) {
    const p = i / 19;
    const angle = p * TAU * turns;
    const a = new THREE.Vector3(Math.cos(angle) * radius, -height / 2 + p * height, Math.sin(angle) * radius);
    const b = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, -height / 2 + p * height, Math.sin(angle + Math.PI) * radius);
    group.add(
      new THREE.Line(
        trackGeo(ctx, new THREE.BufferGeometry().setFromPoints([a, b])),
        lineMat(ctx, ctx.palette.accent, 0.4),
      ),
    );
  }

  const nodeGeo = trackGeo(ctx, new THREE.OctahedronGeometry(0.19, 0));
  const nodeMat = bodyMat(ctx, ctx.palette.accent, 0.8);
  const nodes: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const p = i / 14;
    const angle = p * TAU * turns;
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(Math.cos(angle) * radius, -height / 2 + p * height, Math.sin(angle) * radius);
    group.add(node);
    nodes.push(node);
  }

  // Progress rings around the helix.
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(2.75 + i * 0.35, 0.018, 6, 140)),
      accentMat(ctx, i === 1 ? ctx.palette.accent : ctx.palette.secondary, 0.5),
    );
    ring.rotation.x = Math.PI / 2 + 0.18 * i;
    ring.rotation.y = i * 0.5;
    group.add(ring);
    rings.push(ring);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.42;
    group.rotation.z = Math.sin(t * 0.26) * 0.07;
    nodes.forEach((node, i) => {
      node.rotation.x = t * 0.6 + i;
      node.rotation.y = t * 0.4 + i * 0.5;
      node.scale.setScalar(0.8 + Math.sin(t * 2.1 + i * 0.7) * 0.25);
    });
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.16 + i * 0.06) * (i % 2 === 0 ? 1 : -1);
    });
  });
}

/** WORKSPACE — nested command lattice with orbiting data chips. */
function buildWorkspace(ctx: BuildCtx) {
  const group = new THREE.Group();

  const cubeSpecs = [
    { size: 4.4, mat: 0.55, speed: 0.18 },
    { size: 3.15, mat: 0.75, speed: -0.28 },
    { size: 1.95, mat: 1, speed: 0.4 },
  ];
  const cubes: THREE.Mesh[] = [];
  for (const spec of cubeSpecs) {
    const cube = new THREE.Mesh(
      trackGeo(ctx, new THREE.BoxGeometry(spec.size, spec.size, spec.size)),
      new THREE.MeshBasicMaterial({
        color: ctx.light ? shade(ctx.palette.secondary, 0.7) : ctx.palette.secondary,
        wireframe: true,
        transparent: true,
        opacity: (ctx.light ? 0.34 : 0.2) * spec.mat,
        depthWrite: false,
        blending: ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    );
    trackMat(ctx, cube.material as THREE.Material);
    group.add(cube);
    cubes.push(cube);
  }

  const core = new THREE.Mesh(
    trackGeo(ctx, new THREE.BoxGeometry(1.25, 1.25, 1.25)),
    bodyMat(ctx, ctx.palette.primary, 1.2),
  );
  group.add(core);

  // Corner nodes of the outer cube, linked to the core.
  const half = 2.2;
  const corners: THREE.Vector3[] = [];
  for (const x of [-half, half]) {
    for (const y of [-half, half]) {
      for (const z of [-half, half]) corners.push(new THREE.Vector3(x, y, z));
    }
  }
  const nodeGeo = trackGeo(ctx, new THREE.SphereGeometry(0.11, 8, 8));
  const nodeMat = accentMat(ctx, ctx.palette.accent, 0.95);
  const cornerNodes: THREE.Mesh[] = [];
  for (const c of corners) {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.copy(c);
    group.add(node);
    cornerNodes.push(node);
  }
  const linkPositions: number[] = [];
  for (const c of corners) linkPositions.push(0, 0, 0, c.x, c.y, c.z);
  const linkGeo = trackGeo(ctx, new THREE.BufferGeometry());
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
  group.add(new THREE.LineSegments(linkGeo, lineMat(ctx, ctx.palette.primary, 0.3)));

  // Orbiting data chips.
  const chipGeo = trackGeo(ctx, new THREE.BoxGeometry(0.34, 0.16, 0.06));
  const chipMat = trackMat(
    ctx,
    new THREE.MeshStandardMaterial({
      color: ctx.light ? shade(ctx.palette.primary, 0.5) : 0x0a1526,
      emissive: ctx.palette.secondary,
      emissiveIntensity: ctx.light ? 0.35 : 1,
      metalness: 0.5,
      roughness: 0.3,
    }),
  );
  const chips: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const chip = new THREE.Mesh(chipGeo, chipMat);
    group.add(chip);
    chips.push(chip);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.24;
    group.rotation.x = Math.sin(t * 0.24) * 0.1;
    cubes[0].rotation.set(t * 0.18, -t * 0.14, t * 0.1);
    cubes[1].rotation.set(-t * 0.26, t * 0.3, -t * 0.16);
    cubes[2].rotation.set(t * 0.38, -t * 0.34, t * 0.28);
    core.rotation.y = -t * 0.5;
    core.rotation.x = t * 0.3;
    core.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    cornerNodes.forEach((node, i) => {
      node.scale.setScalar(0.75 + Math.sin(t * 1.8 + i * 0.6) * 0.3);
    });
    chips.forEach((chip, i) => {
      const a = (i / chips.length) * TAU + t * 0.3;
      const r = 3.0 + (i % 3) * 0.22;
      chip.position.set(Math.cos(a) * r, Math.sin(a * 1.6 + i) * 2.0, Math.sin(a) * r * 0.7);
      chip.rotation.set(0, -a + Math.PI / 2, Math.sin(t + i) * 0.2);
    });
  });
}

/** JYNTRACK — performance vortex: torus-knot track and session bars. */
function buildJyntrack(ctx: BuildCtx) {
  const group = new THREE.Group();

  const knot = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusKnotGeometry(2.0, 0.24, 200, 18, 2, 3)),
    bodyMat(ctx, ctx.palette.primary, 1.1),
  );
  group.add(knot);
  const knotGlow = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusKnotGeometry(2.0, 0.34, 150, 12, 2, 3)),
    glassMat(ctx, ctx.palette.secondary, ctx.light ? 0.14 : 0.08),
  );
  group.add(knotGlow);

  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(3.15 + i * 0.3, 0.02, 6, 150)),
      accentMat(ctx, i === 1 ? ctx.palette.accent : ctx.palette.secondary, 0.55),
    );
    ring.rotation.set(Math.PI / 2.4 + i * 0.16, i * 0.7, 0);
    group.add(ring);
    rings.push(ring);
  }

  // Session bars around the vortex.
  const barGeo = trackGeo(ctx, new THREE.BoxGeometry(0.13, 1, 0.13));
  const barMat = bodyMat(ctx, ctx.palette.secondary, 0.8);
  const bars: THREE.Mesh[] = [];
  const barCount = ctx.mobile ? 18 : 28;
  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * TAU;
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(Math.cos(a) * 4.15, -1.4, Math.sin(a) * 4.15);
    group.add(bar);
    bars.push(bar);
  }

  // Comet on a large elliptical orbit.
  const cometCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 40 }, (_v, i) => {
      const a = (i / 39) * TAU;
      return new THREE.Vector3(Math.cos(a) * 4.4, Math.sin(a * 2) * 1.2, Math.sin(a) * 2.8);
    }),
    true,
  );
  group.add(tube(ctx, cometCurve, 0.018, ctx.palette.accent, 0.45, 170));
  const comet = addSprite(ctx, ctx.palette.accent, 0.6, 1);
  group.add(comet);
  ctx.updaters.push((t) => {
    comet.position.copy(cometCurve.getPointAt((t * 0.055) % 1));
  });

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.28;
    group.rotation.x = Math.sin(t * 0.24) * 0.12;
    knot.rotation.x = t * 0.34;
    knot.rotation.z = t * 0.22;
    knotGlow.rotation.copy(knot.rotation);
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.2 + i * 0.08) * (i % 2 === 0 ? 1 : -1);
    });
    bars.forEach((bar, i) => {
      const h = 0.45 + Math.abs(Math.sin(t * 1.9 + i * 0.5)) * 2.2;
      bar.scale.y = h;
      bar.position.y = -1.4 + h / 2;
    });
  });
}

/** NEWS — broadcast sphere with orbital headline cards and signal pulses. */
function buildNews(ctx: BuildCtx) {
  const group = new THREE.Group();
  const radius = 2.35;

  const coreGeo = trackGeo(ctx, new THREE.SphereGeometry(radius, 24, 18));
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.WireframeGeometry(coreGeo)),
      lineMat(ctx, ctx.palette.accent, 0.55),
    ),
  );
  group.add(new THREE.Mesh(coreGeo, glassMat(ctx, ctx.palette.primary, ctx.light ? 0.16 : 0.09)));

  // Expanding signal rings.
  const pulseRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(2.75, 0.02, 6, 140)),
      accentMat(ctx, i === 0 ? ctx.palette.accent : ctx.palette.secondary, 0.5 - i * 0.08),
    );
    ring.rotation.x = Math.PI / 2 + i * 0.2;
    ring.rotation.y = i * 0.6;
    ring.userData.phase = i * 0.42;
    group.add(ring);
    pulseRings.push(ring);
  }

  // Orbital headline panels.
  const cardCount = ctx.mobile ? 6 : 9;
  for (let i = 0; i < cardCount; i++) {
    const card = new THREE.Group();
    const w = 1.45;
    const h = 0.9;
    const plane = new THREE.Mesh(
      trackGeo(ctx, new THREE.PlaneGeometry(w, h)),
      glassMat(ctx, i % 2 === 0 ? ctx.palette.secondary : ctx.palette.primary, 0.12),
    );
    card.add(plane);
    card.add(
      new THREE.LineSegments(
        trackGeo(ctx, new THREE.EdgesGeometry(plane.geometry as THREE.BufferGeometry)),
        lineMat(ctx, ctx.palette.accent, 0.65),
      ),
    );
    for (let k = 0; k < 3; k++) {
      const line = new THREE.Line(
        trackGeo(
          ctx,
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w * 0.38, 0.24 - k * 0.22, 0.01),
            new THREE.Vector3(w * (0.36 - k * 0.1), 0.24 - k * 0.22, 0.01),
          ]),
        ),
        lineMat(ctx, ctx.palette.secondary, 0.5),
      );
      card.add(line);
    }
    group.add(card);
    const angle = (i / cardCount) * TAU;
    const r = 3.55;
    const baseY = Math.sin((i / cardCount) * TAU * 2) * 1.4;
    const phase = Math.random() * TAU;
    ctx.updaters.push((t) => {
      const a = angle + t * 0.2;
      card.position.set(Math.cos(a) * r, baseY + Math.sin(t * 0.7 + phase) * 0.22, Math.sin(a) * r * 0.65);
      card.lookAt(0, 0, 0);
    });
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.2;
    group.rotation.x = Math.sin(t * 0.22) * 0.08;
    pulseRings.forEach((ring, i) => {
      const phase = 1 + ((t * 0.22 + (ring.userData.phase as number)) % 1) * 0.22;
      ring.scale.setScalar(phase);
      ring.rotation.z = t * (0.15 + i * 0.05);
    });
  });
}

/** WORKFLOW — connected pipeline: hub, nodes and circulating packets. */
function buildWorkflow(ctx: BuildCtx) {
  const group = new THREE.Group();

  const hubGeo = trackGeo(ctx, new THREE.CylinderGeometry(0.95, 0.95, 0.55, 6));
  const hub = new THREE.Mesh(hubGeo, bodyMat(ctx, ctx.palette.primary, 1.15));
  hub.rotation.x = Math.PI / 2;
  group.add(hub);
  group.add(
    new THREE.LineSegments(trackGeo(ctx, new THREE.EdgesGeometry(hubGeo)), lineMat(ctx, ctx.palette.accent, 0.8)),
  );
  const hubRing = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(1.28, 0.025, 6, 100)),
    accentMat(ctx, ctx.palette.accent, 0.7),
  );
  hubRing.rotation.x = Math.PI / 2;
  group.add(hubRing);

  const nodeCount = ctx.mobile ? 6 : 9;
  const nodes: THREE.Mesh[] = [];
  const nodeGeo = trackGeo(ctx, new THREE.OctahedronGeometry(0.34, 0));
  const nodeMat = bodyMat(ctx, ctx.palette.secondary, 0.95);
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const a = (i / nodeCount) * TAU;
    const r = 3.0 + (i % 3) * 0.38;
    const pos = new THREE.Vector3(
      Math.cos(a) * r,
      Math.sin((i / nodeCount) * TAU * 2) * 1.9,
      Math.sin(a) * r * 0.72,
    );
    positions.push(pos);
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.copy(pos);
    group.add(node);
    nodes.push(node);
  }

  // Layered links: hub to each node, plus a few chords.
  const curves: Array<THREE.Curve<THREE.Vector3>> = [];
  const linkPoints: number[] = [];
  for (let i = 0; i < positions.length; i++) {
    linkPoints.push(0, 0, 0, positions[i].x, positions[i].y, positions[i].z);
    const mid = positions[i].clone().multiplyScalar(0.55);
    mid.z += 0.6;
    curves.push(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), mid, positions[i]));
  }
  for (let i = 0; i < positions.length; i += 2) {
    const next = positions[(i + 1) % positions.length];
    linkPoints.push(positions[i].x, positions[i].y, positions[i].z, next.x, next.y, next.z);
  }
  const linkGeo = trackGeo(ctx, new THREE.BufferGeometry());
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPoints, 3));
  group.add(new THREE.LineSegments(linkGeo, lineMat(ctx, ctx.palette.accent, 0.28)));

  for (let i = 0; i < curves.length; i++) {
    group.add(tube(ctx, curves[i], 0.015, ctx.palette.secondary, 0.4, 40));
    const packet = addSprite(ctx, ctx.palette.accent, 0.26, 0.9);
    group.add(packet);
    const offset = i / curves.length;
    const speed = 0.18 + (i % 4) * 0.03;
    ctx.updaters.push((t) => {
      packet.position.copy(curves[i].getPointAt((t * speed + offset) % 1));
    });
  }

  const outer = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(3.9, 0.018, 6, 150)),
    accentMat(ctx, ctx.palette.primary, 0.45),
  );
  outer.rotation.x = Math.PI / 2.4;
  group.add(outer);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.2;
    group.rotation.x = Math.sin(t * 0.26) * 0.1;
    hubRing.rotation.z = t * 0.5;
    outer.rotation.z = t * 0.16;
    nodes.forEach((node, i) => {
      node.rotation.x = t * 0.5 + i;
      node.rotation.y = t * 0.35 + i * 0.4;
      node.scale.setScalar(0.9 + Math.sin(t * 1.9 + i * 0.5) * 0.14);
    });
  });
}

/** SETTINGS — interlocking 3D gear mechanism with circuit traces. */
function buildSettings(ctx: BuildCtx) {
  const group = new THREE.Group();

  const makeGear = (radius: number, teeth: number, thickness: number) => {
    const gear = new THREE.Group();
    const disc = new THREE.Mesh(
      trackGeo(ctx, new THREE.CylinderGeometry(radius, radius, thickness, Math.max(12, teeth))),
      bodyMat(ctx, ctx.palette.primary, 0.95),
    );
    disc.rotation.x = Math.PI / 2;
    gear.add(disc);
    gear.add(
      new THREE.LineSegments(
        trackGeo(ctx, new THREE.EdgesGeometry(disc.geometry as THREE.BufferGeometry)),
        lineMat(ctx, ctx.palette.accent, 0.55),
      ),
    );
    const toothGeo = trackGeo(ctx, new THREE.BoxGeometry(radius * 0.2, radius * 0.2, thickness * 1.4));
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * TAU;
      const tooth = new THREE.Mesh(toothGeo, accentMat(ctx, ctx.palette.secondary, 0.6));
      tooth.position.set(Math.cos(a) * (radius + radius * 0.1), Math.sin(a) * (radius + radius * 0.1), 0);
      tooth.rotation.z = a;
      gear.add(tooth);
    }
    const inner = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(radius * 0.45, 0.035, 6, 60)),
      accentMat(ctx, ctx.palette.accent, 0.75),
    );
    gear.add(inner);
    return gear;
  };

  const main = makeGear(2.05, 16, 0.48);
  main.rotation.x = 0.24;
  main.rotation.y = -0.16;
  group.add(main);

  const gearA = makeGear(0.9, 10, 0.32);
  gearA.position.set(2.55, 1.35, -0.45);
  gearA.rotation.x = 0.24;
  gearA.rotation.y = -0.16;
  group.add(gearA);

  const gearB = makeGear(1.1, 12, 0.34);
  gearB.position.set(-2.5, -1.3, -0.4);
  gearB.rotation.x = 0.24;
  gearB.rotation.y = -0.16;
  group.add(gearB);

  // Circuit traces leaving the mechanism.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const pts = [
      new THREE.Vector3(Math.cos(a) * 2.45, Math.sin(a) * 2.45, 0),
      new THREE.Vector3(Math.cos(a) * 3.15, Math.sin(a) * 3.15, -0.15),
      new THREE.Vector3(Math.cos(a) * 3.8, Math.sin(a) * 3.8, -0.45),
    ];
    group.add(new THREE.Line(trackGeo(ctx, new THREE.BufferGeometry().setFromPoints(pts)), lineMat(ctx, ctx.palette.accent, 0.42)));
    const chip = new THREE.Mesh(
      trackGeo(ctx, new THREE.BoxGeometry(0.28, 0.28, 0.09)),
      accentMat(ctx, ctx.palette.secondary, 0.5),
    );
    chip.position.copy(pts[2]);
    group.add(chip);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.26) * 0.16;
    group.rotation.x = Math.sin(t * 0.2) * 0.08;
    main.rotation.z = t * 0.5;
    gearA.rotation.z = -t * 0.95;
    gearB.rotation.z = t * 0.78;
  });
}

/** LYNARA — holographic conversational orb with voice equaliser. */
function buildLynara(ctx: BuildCtx) {
  const group = new THREE.Group();

  const coreGeo = trackGeo(ctx, new THREE.IcosahedronGeometry(1.55, 2));
  const core = new THREE.Mesh(coreGeo, bodyMat(ctx, ctx.palette.secondary, 1.2));
  group.add(core);
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.EdgesGeometry(coreGeo)),
      lineMat(ctx, ctx.palette.accent, 0.7),
    ),
  );

  const shells: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const shell = new THREE.Mesh(
      trackGeo(ctx, new THREE.IcosahedronGeometry(2.05 + i * 0.4, 1)),
      trackMat(
        ctx,
        new THREE.MeshBasicMaterial({
          color: ctx.light ? shade(i === 1 ? ctx.palette.accent : ctx.palette.secondary, 0.72) : i === 1 ? ctx.palette.accent : ctx.palette.secondary,
          wireframe: true,
          transparent: true,
          opacity: ctx.light ? 0.3 : 0.16,
          depthWrite: false,
          blending: ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending,
        }),
      ),
    );
    group.add(shell);
    shells.push(shell);
  }

  // Voice waveform crossing the orb.
  const wavePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 90; i++) {
    const p = i / 90;
    wavePoints.push(new THREE.Vector3(-4.3 + p * 8.6, Math.sin(p * Math.PI * 9) * 0.6 * Math.sin(p * Math.PI), 0));
  }
  group.add(tube(ctx, new THREE.CatmullRomCurve3(wavePoints), 0.045, ctx.palette.accent, 0.85, 150));

  // Circular equaliser.
  const barGeo = trackGeo(ctx, new THREE.BoxGeometry(0.12, 1, 0.12));
  const barMat = bodyMat(ctx, ctx.palette.primary, 0.9);
  const bars: THREE.Mesh[] = [];
  const barCount = ctx.mobile ? 24 : 36;
  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * TAU;
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(Math.cos(a) * 3.35, Math.sin(a) * 3.35, -0.6);
    bar.rotation.z = a - Math.PI / 2;
    group.add(bar);
    bars.push(bar);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.3) * 0.22;
    group.rotation.z = Math.sin(t * 0.22) * 0.06;
    core.rotation.y = t * 0.32;
    core.rotation.x = Math.sin(t * 0.5) * 0.2;
    core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.05);
    shells.forEach((shell, i) => {
      shell.rotation.y = t * (0.16 + i * 0.06) * (i % 2 === 0 ? 1 : -1);
      shell.rotation.x = t * 0.1;
      shell.scale.setScalar(1 + Math.sin(t * 1.2 + i) * 0.04);
    });
    bars.forEach((bar, i) => {
      bar.scale.y = 0.35 + Math.abs(Math.sin(t * 2.3 + i * 0.4)) * 1.7;
    });
  });
}

/** LOGIN — identity portal: concentric rotating gates and a prism core. */
function buildLogin(ctx: BuildCtx) {
  const group = new THREE.Group();

  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(2.05 + i * 0.52, 0.026, 6, 150)),
      accentMat(ctx, i % 2 === 0 ? ctx.palette.secondary : ctx.palette.accent, 0.6),
    );
    ring.rotation.set(i * 0.35, i * 0.55, i * 0.2);
    group.add(ring);
    rings.push(ring);
  }

  const core = new THREE.Mesh(
    trackGeo(ctx, new THREE.OctahedronGeometry(1.3, 1)),
    bodyMat(ctx, ctx.palette.primary, 1.1),
  );
  group.add(core);
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.EdgesGeometry(core.geometry as THREE.BufferGeometry)),
      lineMat(ctx, ctx.palette.accent, 0.8),
    ),
  );

  // Central light column.
  const column = new THREE.Mesh(
    trackGeo(ctx, new THREE.CylinderGeometry(0.55, 0.55, 5.2, 12, 1, true)),
    trackMat(
      ctx,
      new THREE.MeshBasicMaterial({
        color: ctx.light ? shade(ctx.palette.secondary, 0.75) : ctx.palette.secondary,
        wireframe: true,
        transparent: true,
        opacity: ctx.light ? 0.24 : 0.14,
        depthWrite: false,
        blending: ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    ),
  );
  group.add(column);

  // Orbiting key shards.
  const shards: THREE.Mesh[] = [];
  const shardGeo = trackGeo(ctx, new THREE.TetrahedronGeometry(0.2, 0));
  const shardMat = accentMat(ctx, ctx.palette.accent, 0.8);
  for (let i = 0; i < 12; i++) {
    const shard = new THREE.Mesh(shardGeo, shardMat);
    group.add(shard);
    shards.push(shard);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.26) * 0.2;
    core.rotation.y = -t * 0.4;
    core.rotation.x = t * 0.26;
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.22 + i * 0.08) * (i % 2 === 0 ? 1 : -1);
      ring.rotation.x = i * 0.35 + Math.sin(t * 0.3 + i) * 0.12;
    });
    shards.forEach((shard, i) => {
      const a = (i / shards.length) * TAU + t * 0.24;
      const r = 2.9 + Math.sin(t * 0.9 + i) * 0.2;
      shard.position.set(Math.cos(a) * r, Math.sin(a * 1.4) * 1.8, Math.sin(a) * r);
      shard.rotation.set(t * 0.5 + i, t * 0.4 + i, 0);
    });
  });
}

/** REGISTER — genesis prism: unfolding petals around a bright seed. */
function buildRegister(ctx: BuildCtx) {
  const group = new THREE.Group();

  const seed = new THREE.Mesh(
    trackGeo(ctx, new THREE.OctahedronGeometry(1.15, 1)),
    bodyMat(ctx, ctx.palette.primary, 1.15),
  );
  group.add(seed);
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.EdgesGeometry(seed.geometry as THREE.BufferGeometry)),
      lineMat(ctx, ctx.palette.accent, 0.85),
    ),
  );

  const petals: THREE.Mesh[] = [];
  const petalGeo = trackGeo(ctx, new THREE.BoxGeometry(0.28, 2.6, 0.16));
  const petalMat = bodyMat(ctx, ctx.palette.secondary, 0.9);
  for (let i = 0; i < 8; i++) {
    const petal = new THREE.Mesh(petalGeo, petalMat);
    group.add(petal);
    petals.push(petal);
  }

  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(2.4 + i * 0.5, 0.02, 6, 140)),
      accentMat(ctx, i === 1 ? ctx.palette.accent : ctx.palette.secondary, 0.55),
    );
    ring.rotation.x = Math.PI / 2 + i * 0.3;
    ring.rotation.y = i * 0.4;
    group.add(ring);
    rings.push(ring);
  }

  // Expanding genesis shell.
  const shell = new THREE.Mesh(
    trackGeo(ctx, new THREE.IcosahedronGeometry(2.5, 1)),
    trackMat(
      ctx,
      new THREE.MeshBasicMaterial({
        color: ctx.light ? shade(ctx.palette.accent, 0.72) : ctx.palette.accent,
        wireframe: true,
        transparent: true,
        opacity: ctx.light ? 0.28 : 0.16,
        depthWrite: false,
        blending: ctx.light ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    ),
  );
  group.add(shell);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.24;
    group.rotation.x = Math.sin(t * 0.22) * 0.1;
    seed.rotation.y = -t * 0.5;
    seed.rotation.x = t * 0.3;
    seed.scale.setScalar(1 + Math.sin(t * 2.1) * 0.07);
    shell.rotation.y = -t * 0.18;
    shell.rotation.x = t * 0.1;
    shell.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05);
    petals.forEach((petal, i) => {
      const a = (i / petals.length) * TAU + t * 0.1;
      const r = 1.9 + Math.sin(t * 1.3 + i * 0.8) * 0.25;
      petal.position.set(Math.cos(a) * r, Math.sin(a * 1.6) * 0.6, Math.sin(a) * r);
      petal.rotation.set(Math.sin(t + i) * 0.3, -a, a + Math.PI / 2);
    });
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.2 + i * 0.06) * (i % 2 === 0 ? 1 : -1);
    });
  });
}

const BUILDERS: Record<PageSceneVariant, (ctx: BuildCtx) => void> = {
  workspace: buildWorkspace,
  chart: buildChart,
  lynara: buildLynara,
  markets: buildMarkets,
  risk: buildRisk,
  backtest: buildBacktest,
  journal: buildJournal,
  news: buildNews,
  workflow: buildWorkflow,
  academy: buildAcademy,
  jyntrack: buildJyntrack,
  settings: buildSettings,
  login: buildLogin,
  register: buildRegister,
};

/* -------------------------------------------------------------------------- */
/*  Engine                                                                    */
/* -------------------------------------------------------------------------- */

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx2d = canvas.getContext('2d');
  if (ctx2d) {
    const gradient = ctx2d.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(230,246,255,0.8)');
    gradient.addColorStop(1, 'rgba(80,150,255,0)');
    ctx2d.fillStyle = gradient;
    ctx2d.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface ActiveScene {
  group: THREE.Group;
  updaters: Array<(t: number, dt: number) => void>;
  geos: THREE.BufferGeometry[];
  mats: THREE.Material[];
  frame: number;
}

class PageSceneEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private glowTexture: THREE.Texture;
  private world = new THREE.Group();
  private ambient = new THREE.Group();
  private active: ActiveScene | null = null;
  private variant: PageSceneVariant | null = null;
  private light = false;
  private elapsed = 0;
  private last = performance.now();
  private raf: number | null = null;
  private disposed = false;
  private mobile = false;
  private tablet = false;
  private reduceMotion = false;
  private visible = true;
  private fade = 0;
  private width = 1;
  private height = 1;

  private readonly ambientLight: THREE.AmbientLight;
  private readonly hemisphere: THREE.HemisphereLight;
  private readonly keyLight: THREE.DirectionalLight;
  private readonly rimLight: THREE.DirectionalLight;
  private readonly fillLight: THREE.PointLight;

  constructor(private host: HTMLElement) {
    const w = Math.max(host.clientWidth || window.innerWidth || 1024, 320);
    const h = Math.max(host.clientHeight || window.innerHeight || 720, 320);
    this.width = w;
    this.height = h;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !window.matchMedia('(max-width: 767px)').matches,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        window.matchMedia('(max-width: 767px)').matches ? 1.1 : 1.4,
      ),
    );
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.opacity = '1';
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 180);
    this.scene.add(this.world, this.ambient);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.hemisphere = new THREE.HemisphereLight(0xffffff, 0x0b1220, 0.6);
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    this.keyLight.position.set(7, 9, 11);
    this.rimLight = new THREE.DirectionalLight(0x22d3ee, 1.0);
    this.rimLight.position.set(-9, -4, 7);
    this.fillLight = new THREE.PointLight(0x22d3ee, 1.2, 60);
    this.fillLight.position.set(-5, -2, 8);
    this.scene.add(this.ambientLight, this.hemisphere, this.keyLight, this.rimLight, this.fillLight);

    this.glowTexture = makeGlowTexture();

    this.mobile = window.matchMedia('(max-width: 767px)').matches;
    this.tablet = !this.mobile && window.matchMedia('(max-width: 1100px)').matches;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.visible = !document.hidden;
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('resize', this.onResize);
    this.onResize();
    this.start();
  }

  private onVisibility = () => {
    this.visible = !document.hidden;
    this.last = performance.now();
    if (this.visible && this.reduceMotion) this.draw(0);
  };

  private onResize = () => {
    const w = Math.max(this.host.clientWidth || window.innerWidth, 320);
    const h = Math.max(this.host.clientHeight || window.innerHeight, 320);
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.applyFraming();
    if (this.reduceMotion) this.draw(0);
  };

  private applyFraming() {
    const palette = this.variant ? PALETTES[this.variant] : PALETTES.workspace;
    this.camera.aspect = this.width / Math.max(this.height, 1);
    const verticalFov = (this.camera.fov * Math.PI) / 180;
    const half = Math.tan(verticalFov / 2);
    const margin = this.mobile ? 1.0 : 1.06;
    const distV = (palette.frame * margin) / half;
    const distH = (palette.frame * margin) / (half * this.camera.aspect);
    const distance = Math.max(distV, distH);
    this.camera.position.set(0, this.mobile ? 0.15 : 0.35, distance);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  setVariant(variant: PageSceneVariant, light: boolean) {
    if (this.disposed) return;
    if (this.variant === variant && this.light === light && this.active) return;
    this.variant = variant;
    this.light = light;
    this.rebuild();
  }

  private rebuild() {
    if (!this.variant) return;
    if (this.active) {
      this.world.remove(this.active.group);
      for (const mat of this.active.mats) mat.dispose();
      for (const geo of this.active.geos) geo.dispose();
    }
    this.ambient.clear();
    for (const child of [...this.ambient.children]) this.ambient.remove(child);

    const palette = PALETTES[this.variant];
    const group = new THREE.Group();
    this.world.add(group);
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const updaters: Array<(t: number, dt: number) => void> = [];

    const ctx: BuildCtx = {
      world: group,
      palette,
      light: this.light,
      mobile: this.mobile,
      tablet: this.tablet,
      glowTexture: this.glowTexture,
      geos,
      mats,
      updaters,
    };

    // Central signature composition.
    BUILDERS[this.variant](ctx);

    // Soft central halo for real luminous presence.
    const haloSize = palette.frame * 1.95;
    const haloInnerSize = palette.frame * 1.0;
    const halo = addHalo(ctx, palette.primary, haloSize, 0.5);
    halo.position.set(0, 0, -2.4);
    group.add(halo);
    const haloInner = addHalo(ctx, palette.secondary, haloInnerSize, 0.42);
    haloInner.position.set(this.mobile ? 0 : 0.9, -0.35, -1.4);
    group.add(haloInner);
    updaters.push((t) => {
      const pulse = 1 + Math.sin(t * 0.55) * 0.06;
      halo.scale.setScalar(haloSize * pulse);
      haloInner.scale.setScalar(haloInnerSize * (2 - pulse));
    });

    // Ambient layers: satellites, rings, particles, floor grid.
    buildSatellites(ctx, this.mobile ? 5 : this.tablet ? 7 : 9);
    buildAmbientRings(ctx);
    buildParticles(ctx, Math.round((this.mobile ? 90 : this.tablet ? 150 : 210) * palette.density));
    buildGridFloor(ctx);

    this.active = { group, updaters, geos, mats, frame: palette.frame };
    this.applyLighting();
    this.applyFraming();
    this.fade = 0;
    this.draw(0);
  }

  private applyLighting() {
    const light = this.light;
    this.renderer.toneMappingExposure = light ? 1.2 : 1.05;
    this.ambientLight.intensity = light ? 1.25 : 0.55;
    this.hemisphere.color.setHex(light ? 0xffffff : 0x9ad9ff);
    this.hemisphere.groundColor.setHex(light ? 0xdbeafe : 0x081120);
    this.hemisphere.intensity = light ? 1.05 : 0.55;
    this.keyLight.intensity = light ? 2.4 : 1.5;
    this.keyLight.color.setHex(light ? 0xffffff : 0xe0f2fe);
    this.rimLight.color.setHex(light ? 0x93c5fd : 0x22d3ee);
    this.rimLight.intensity = light ? 1.1 : 1.1;
    this.fillLight.color.setHex(light ? 0xbfdbfe : 0x22d3ee);
    this.fillLight.intensity = light ? 1.3 : 1.5;
  }

  private draw(delta: number) {
    if (!this.active || this.disposed) return;
    if (!this.reduceMotion) {
      this.elapsed += delta;
      for (const update of this.active.updaters) update(this.elapsed, delta);
    }

    // Gentle screen-space life so the composition never looks frozen.
    const t = this.elapsed;
    if (!this.reduceMotion) {
      this.world.position.y = Math.sin(t * 0.42) * 0.12;
      this.world.rotation.z = Math.sin(t * 0.28) * 0.02;
      this.camera.position.x = Math.sin(t * 0.24) * 0.18;
      this.camera.lookAt(0, 0, 0);
    }

    // Quick, smooth entrance when the route/theme changes.
    if (this.fade < 1) {
      this.fade = Math.min(1, this.fade + Math.max(delta, 0.016) * 4.5);
      const eased = 1 - Math.pow(1 - this.fade, 3);
      const scale = 0.9 + eased * 0.1;
      this.world.scale.setScalar(scale);
    } else {
      this.world.scale.setScalar(1);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private start() {
    // Reduced motion: paint the composition once and only repaint on resize,
    // theme or route changes. No continuous animation loop at all.
    if (this.reduceMotion) {
      this.fade = 1;
      this.draw(0);
      return;
    }
    const loop = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const now = performance.now();
      const delta = Math.min(Math.max((now - this.last) / 1000, 0), 0.05);
      this.last = now;
      if (!this.visible) return;
      this.draw(delta);
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    this.disposed = true;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('resize', this.onResize);
    if (this.active) {
      for (const mat of this.active.mats) mat.dispose();
      for (const geo of this.active.geos) geo.dispose();
    }
    this.glowTexture.dispose();
    if (this.host.contains(this.renderer.domElement)) this.host.removeChild(this.renderer.domElement);
    this.renderer.forceContextLoss();
    this.renderer.dispose();
  }
}

/* -------------------------------------------------------------------------- */
/*  React wrapper                                                             */
/* -------------------------------------------------------------------------- */

const readLightTheme = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('light');

export const PageScene3D: React.FC<{ variant: PageSceneVariant; className?: string }> = ({
  variant,
  className = '',
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PageSceneEngine | null>(null);
  const variantRef = useRef(variant);
  variantRef.current = variant;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let engine: PageSceneEngine | null = null;
    try {
      engine = new PageSceneEngine(host);
    } catch {
      return;
    }
    engineRef.current = engine;
    engine.setVariant(variantRef.current, readLightTheme());

    const observer =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            engine?.setVariant(variantRef.current, readLightTheme());
          })
        : null;
    observer?.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer?.disconnect();
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setVariant(variant, readLightTheme());
  }, [variant]);

  return <div ref={hostRef} className={`pointer-events-none ${className}`} aria-hidden="true" />;
};

export default PageScene3D;
