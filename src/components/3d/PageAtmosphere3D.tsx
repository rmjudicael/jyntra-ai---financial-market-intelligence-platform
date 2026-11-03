import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * PageAtmosphere3D — moteur d'arrière-plan 3D immersif, isolé et réutilisable.
 *
 * Chaque page fournit un "preset" (scène) : noyau 3D différent, palette bleu /
 * cyan, densité et composition propres. Le rendu tourne dans son propre canvas
 * (un seul par page), se met en pause hors écran, respecte prefers-reduced-motion
 * et libère toutes ses ressources au démontage.
 *
 * IMPORTANT : ce composant n'est utilisé ni sur l'accueil ni sur Multi-Agent,
 * qui conservent strictement leurs animations existantes.
 */

export type PageSceneId =
  | 'about'
  | 'lynara-public'
  | 'login'
  | 'register'
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
  | 'settings';

type CoreKind =
  | 'infinity'
  | 'globe'
  | 'shield'
  | 'chart'
  | 'nodes'
  | 'gear'
  | 'helix'
  | 'wave'
  | 'timeline'
  | 'prism'
  | 'ledger'
  | 'broadcast';

type Layout = 'center' | 'left' | 'right' | 'split';
type GridKind = 'none' | 'floor' | 'wall' | 'both';

interface ScenePreset {
  primary: number;
  secondary: number;
  accent: number;
  core: CoreKind;
  layout: Layout;
  density: number;
  ribbons: number;
  panels: number;
  grid: GridKind;
  /** Visible composition radius (smaller = larger objects). */
  frame: number;
  /** Core rotation speed. */
  spin: number;
  /** Visual presence multiplier (1 = reference). */
  intensity?: number;
  /** Vertical core offset (to clear forms). */
  coreY?: number;
}

const PRESETS: Record<PageSceneId, ScenePreset> = {
  // Intelligent connections, innovation, neural networks.
  about: {
    primary: 0x3b82f6, secondary: 0x22d3ee, accent: 0xbfdbfe, core: 'infinity',
    layout: 'center', density: 1, ribbons: 4, panels: 5, grid: 'both', frame: 7.4, spin: 0.13,
    intensity: 1.05,
  },
  // Intelligent holographic environment.
  'lynara-public': {
    primary: 0x60a5fa, secondary: 0x22d3ee, accent: 0xe0f2fe, core: 'infinity',
    layout: 'split', density: 1.05, ribbons: 3, panels: 7, grid: 'both', frame: 7.6, spin: 0.1,
    intensity: 1.08,
  },
  // Digital identity, secure networks.
  login: {
    primary: 0x2563eb, secondary: 0x38bdf8, accent: 0x93c5fd, core: 'shield',
    layout: 'center', density: 0.95, ribbons: 3, panels: 5, grid: 'wall', frame: 7.4, spin: 0.11,
    intensity: 1.3, coreY: 1.45,
  },
  // Account genesis, universe opening.
  register: {
    primary: 0x3b82f6, secondary: 0x06b6d4, accent: 0xdbeafe, core: 'prism',
    layout: 'center', density: 1, ribbons: 3, panels: 5, grid: 'both', frame: 7.4, spin: 0.16,
    intensity: 1.3, coreY: 1.5,
  },
  // Personal command post.
  workspace: {
    primary: 0x1d4ed8, secondary: 0x22d3ee, accent: 0xa5f3fc, core: 'ledger',
    layout: 'split', density: 0.95, ribbons: 3, panels: 6, grid: 'floor', frame: 7.8, spin: 0.08,
    intensity: 1.3,
  },
  // Chart analysis, curves and volumes.
  chart: {
    primary: 0x2563eb, secondary: 0x38bdf8, accent: 0xbfdbfe, core: 'chart',
    layout: 'right', density: 1, ribbons: 4, panels: 4, grid: 'wall', frame: 7.2, spin: 0.15,
  },
  // Holographic conversational assistant.
  lynara: {
    primary: 0x3b82f6, secondary: 0x22d3ee, accent: 0xcffafe, core: 'wave',
    layout: 'center', density: 1.05, ribbons: 3, panels: 5, grid: 'both', frame: 7.6, spin: 0.09,
  },
  // Digital globe, global connections.
  markets: {
    primary: 0x1d4ed8, secondary: 0x22d3ee, accent: 0x7dd3fc, core: 'globe',
    layout: 'center', density: 1.1, ribbons: 3, panels: 4, grid: 'floor', frame: 7.6, spin: 0.1,
  },
  // Shield, probabilities, capital protection.
  risk: {
    primary: 0x2563eb, secondary: 0x0ea5e9, accent: 0x93c5fd, core: 'shield',
    layout: 'left', density: 0.9, ribbons: 3, panels: 4, grid: 'wall', frame: 7.4, spin: 0.12,
  },
  // History, trajectories and rewinding.
  backtest: {
    primary: 0x1d4ed8, secondary: 0x38bdf8, accent: 0xbfdbfe, core: 'timeline',
    layout: 'right', density: 1, ribbons: 4, panels: 4, grid: 'floor', frame: 7.6, spin: 0.1,
  },
  // Journal, registers and floating plans.
  journal: {
    primary: 0x3b82f6, secondary: 0x22d3ee, accent: 0xa5f3fc, core: 'ledger',
    layout: 'left', density: 0.9, ribbons: 3, panels: 6, grid: 'floor', frame: 7.6, spin: 0.07,
  },
  // Holographic information flow.
  news: {
    primary: 0x2563eb, secondary: 0x06b6d4, accent: 0x7dd3fc, core: 'broadcast',
    layout: 'center', density: 1.05, ribbons: 4, panels: 7, grid: 'both', frame: 7.4, spin: 0.11,
  },
  // Nœuds, câbles et paquets en circulation.
  workflow: {
    primary: 0x1d4ed8, secondary: 0x22d3ee, accent: 0xbfdbfe, core: 'nodes',
    layout: 'center', density: 1.1, ribbons: 3, panels: 5, grid: 'wall', frame: 7.4, spin: 0.08,
  },
  // Connaissances, hélice du savoir.
  academy: {
    primary: 0x3b82f6, secondary: 0x38bdf8, accent: 0xdbeafe, core: 'helix',
    layout: 'right', density: 0.95, ribbons: 3, panels: 5, grid: 'both', frame: 7.6, spin: 0.1,
  },
  // Trajectories, performance, probabilities.
  jyntrack: {
    primary: 0x2563eb, secondary: 0x22d3ee, accent: 0xa5f3fc, core: 'timeline',
    layout: 'right', density: 1, ribbons: 4, panels: 4, grid: 'floor', frame: 7.6, spin: 0.09,
  },
  // Circuits, geometry and technological connections.
  settings: {
    primary: 0x1d4ed8, secondary: 0x0ea5e9, accent: 0x93c5fd, core: 'gear',
    layout: 'center', density: 0.9, ribbons: 2, panels: 5, grid: 'both', frame: 7.6, spin: 0.12,
  },
};

interface BuildCtx {
  world: THREE.Group;
  preset: ScenePreset;
  mobile: boolean;
  tablet: boolean;
  glowTexture: THREE.Texture;
  geos: THREE.BufferGeometry[];
  mats: THREE.Material[];
  textures: THREE.Texture[];
  updaters: Array<(t: number, dt: number) => void>;
}

const TAU = Math.PI * 2;
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

function trackGeo<T extends THREE.BufferGeometry>(ctx: BuildCtx, geo: T): T {
  ctx.geos.push(geo);
  return geo;
}

function trackMat<T extends THREE.Material>(ctx: BuildCtx, mat: T): T {
  ctx.mats.push(mat);
  return mat;
}

function glowMat(ctx: BuildCtx, color: number, opacity: number) {
  return trackMat(
    ctx,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
}

function lineMat(ctx: BuildCtx, color: number, opacity: number) {
  return trackMat(
    ctx,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

function addSprite(ctx: BuildCtx, color: number, size: number, opacity = 0.9) {
  const spriteMat = trackMat(
    ctx,
    new THREE.SpriteMaterial({
      map: ctx.glowTexture,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.setScalar(size);
  return sprite;
}

/* -------------------------------------------------------------------------- */
/*  Couches d'ambiance partagées                                              */
/* -------------------------------------------------------------------------- */

function buildParticleField(
  ctx: BuildCtx,
  count: number,
  spread: [number, number, number],
  color: number,
  size: number,
  opacity: number,
) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread[0];
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2] - 1.5;
    speeds[i] = 0.12 + Math.random() * 0.45;
  }
  const geo = trackGeo(ctx, new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = trackMat(
    ctx,
    new THREE.PointsMaterial({
      color,
      size,
      map: ctx.glowTexture,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.02,
    }),
  );
  const points = new THREE.Points(geo, mat);
  ctx.world.add(points);

  const halfY = spread[1] / 2;
  ctx.updaters.push((t, dt) => {
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      if (arr[i * 3 + 1] > halfY) arr[i * 3 + 1] = -halfY;
    }
    attr.needsUpdate = true;
    points.rotation.y = t * 0.012;
  });
}

function buildNeuralWeb(ctx: BuildCtx, radius: number, count: number, flat = false) {
  const group = new THREE.Group();
  const positions: THREE.Vector3[] = [];
  const nodeGeo = trackGeo(ctx, new THREE.IcosahedronGeometry(0.06, 0));
  const nodeMat = trackMat(
    ctx,
    new THREE.MeshBasicMaterial({
      color: ctx.preset.secondary,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const nodes: THREE.Mesh[] = [];

  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / count);
    const phi = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = radius * rnd(0.7, 1.08);
    const v = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi) * r,
      Math.cos(theta) * r * (flat ? 0.5 : 1),
      Math.sin(theta) * Math.sin(phi) * r,
    );
    positions.push(v);
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.copy(v);
    group.add(node);
    nodes.push(node);
  }

  // Relie chaque nœud à ses deux plus proches voisins (réseau lisible).
  const edges: Array<[number, number]> = [];
  const seen = new Set<string>();
  for (let i = 0; i < positions.length; i++) {
    const nearest = positions
      .map((p, idx) => ({ idx, d: p.distanceToSquared(positions[i]) }))
      .filter((entry) => entry.idx !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const entry of nearest) {
      const a = Math.min(i, entry.idx);
      const b = Math.max(i, entry.idx);
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([a, b]);
    }
  }

  const linePositions: number[] = [];
  for (const [a, b] of edges) {
    linePositions.push(
      positions[a].x, positions[a].y, positions[a].z,
      positions[b].x, positions[b].y, positions[b].z,
    );
  }
  const lineGeo = trackGeo(ctx, new THREE.BufferGeometry());
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(lineGeo, lineMat(ctx, ctx.preset.primary, 0.14));
  group.add(lines);

  // Paquets lumineux qui circulent sur quelques arêtes.
  const packetCount = Math.min(8, edges.length);
  const packets: Array<{ sprite: THREE.Sprite; a: number; b: number; offset: number; speed: number }> = [];
  for (let i = 0; i < packetCount; i++) {
    const edge = edges[Math.floor((i / packetCount) * edges.length)] ?? edges[0];
    if (!edge) break;
    const sprite = addSprite(ctx, ctx.preset.accent, 0.3, 0.85);
    group.add(sprite);
    packets.push({ sprite, a: edge[0], b: edge[1], offset: i / packetCount, speed: 0.1 + Math.random() * 0.12 });
  }

  ctx.world.add(group);

  ctx.updaters.push((t) => {
    for (let i = 0; i < nodes.length; i++) {
      const s = 0.75 + Math.sin(t * 1.6 + i * 0.9) * 0.25;
      nodes[i].scale.setScalar(s);
    }
    for (const packet of packets) {
      const progress = (t * packet.speed + packet.offset) % 1;
      packet.sprite.position.lerpVectors(positions[packet.a], positions[packet.b], progress);
    }
  });

  return group;
}

function buildRibbons(ctx: BuildCtx, count: number) {
  const frame = ctx.preset.frame;
  for (let i = 0; i < count; i++) {
    const controlPoints: THREE.Vector3[] = [];
    const points = 6;
    for (let k = 0; k <= points; k++) {
      const progress = k / points;
      controlPoints.push(
        new THREE.Vector3(
          -frame + frame * 2 * progress + rnd(-0.5, 0.5),
          Math.sin(progress * Math.PI * (1.1 + i * 0.27)) * rnd(1.2, 2.2) * (i % 2 === 0 ? 1 : -1),
          rnd(-5.5, -1),
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(controlPoints);
    const tube = new THREE.Mesh(
      trackGeo(ctx, new THREE.TubeGeometry(curve, 100, 0.012 + Math.random() * 0.012, 4, false)),
      glowMat(ctx, i % 2 === 0 ? ctx.preset.primary : ctx.preset.secondary, 0.18),
    );
    ctx.world.add(tube);

    const packet = addSprite(ctx, ctx.preset.accent, 0.32, 0.75);
    ctx.world.add(packet);
    const speed = 0.035 + i * 0.006;
    const offset = i / Math.max(1, count);
    ctx.updaters.push((t) => {
      packet.position.copy(curve.getPointAt((t * speed + offset) % 1));
    });
  }
}

function buildPanels(ctx: BuildCtx, count: number) {
  const frame = ctx.preset.frame;
  for (let i = 0; i < count; i++) {
    const w = rnd(1.3, 2.5);
    const h = rnd(0.75, 1.5);
    const planeGeo = trackGeo(ctx, new THREE.PlaneGeometry(w, h));
    const panel = new THREE.Group();
    panel.add(
      new THREE.Mesh(
        planeGeo,
        trackMat(
          ctx,
          new THREE.MeshBasicMaterial({
            color: ctx.preset.primary,
            transparent: true,
            opacity: 0.05,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        ),
      ),
    );
    panel.add(
      new THREE.LineSegments(
        trackGeo(ctx, new THREE.EdgesGeometry(planeGeo)),
        lineMat(ctx, ctx.preset.secondary, 0.2),
      ),
    );

    const angle = (i / count) * TAU + rnd(-0.3, 0.3);
    const radius = frame * rnd(0.5, 0.95);
    panel.position.set(
      Math.cos(angle) * radius * (ctx.mobile ? 0.55 : 1),
      rnd(-3.1, 3.1) * (ctx.mobile ? 0.65 : 1),
      rnd(-6, -1.6),
    );
    panel.rotation.set(rnd(-0.35, 0.35), rnd(-0.8, 0.8), rnd(-0.3, 0.3));
    ctx.world.add(panel);

    const baseY = panel.position.y;
    const phase = rnd(0, TAU);
    const amplitude = rnd(0.12, 0.45);
    const speed = rnd(0.25, 0.6);
    ctx.updaters.push((t) => {
      panel.position.y = baseY + Math.sin(t * speed + phase) * amplitude;
      panel.rotation.z = Math.sin(t * speed * 0.6 + phase) * 0.06;
    });
  }
}

function buildSatellites(ctx: BuildCtx, count: number) {
  const shapes = [
    trackGeo(ctx, new THREE.IcosahedronGeometry(0.16, 0)),
    trackGeo(ctx, new THREE.OctahedronGeometry(0.19, 0)),
    trackGeo(ctx, new THREE.BoxGeometry(0.22, 0.22, 0.22)),
    trackGeo(ctx, new THREE.TetrahedronGeometry(0.22, 0)),
  ];

  for (let i = 0; i < count; i++) {
    const color = i % 3 === 0 ? ctx.preset.accent : i % 3 === 1 ? ctx.preset.secondary : ctx.preset.primary;
    const mesh = new THREE.Mesh(
      shapes[i % shapes.length],
      trackMat(
        ctx,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.4,
          wireframe: i % 2 === 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    const angle = (i / count) * TAU + rnd(-0.35, 0.35);
    const radius = ctx.preset.frame * rnd(0.45, 0.98);
    const baseY = rnd(-3, 3) * (ctx.mobile ? 0.7 : 1);
    mesh.position.set(
      Math.cos(angle) * radius * (ctx.mobile ? 0.55 : 1),
      baseY,
      rnd(-5.5, -1.2),
    );
    mesh.rotation.set(rnd(0, TAU), rnd(0, TAU), rnd(0, TAU));
    ctx.world.add(mesh);

    const phase = rnd(0, TAU);
    const amplitude = rnd(0.15, 0.5);
    const speed = rnd(0.3, 0.8);
    const spin = rnd(0.06, 0.22);
    ctx.updaters.push((t) => {
      mesh.position.y = baseY + Math.sin(t * speed + phase) * amplitude;
      mesh.rotation.x = t * spin + phase;
      mesh.rotation.y = t * spin * 0.7 + phase;
    });
  }
}

function buildGrid(ctx: BuildCtx, kind: GridKind) {
  const colorA = ctx.preset.primary;
  const colorB = ctx.preset.secondary;
  const size = ctx.preset.frame * 5;

  const makeGrid = (divisor: number, opacity: number) => {
    const grid = new THREE.GridHelper(size, divisor, colorA, colorB);
    const mat = grid.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = opacity;
    mat.depthWrite = false;
    mat.blending = THREE.AdditiveBlending;
    ctx.mats.push(mat);
    ctx.geos.push(grid.geometry);
    return grid;
  };

  if (kind === 'floor' || kind === 'both') {
    const floor = makeGrid(ctx.mobile ? 26 : 38, 0.06);
    floor.position.y = -4.4;
    floor.position.z = -3;
    ctx.world.add(floor);
    const baseZ = floor.position.z;
    ctx.updaters.push((t) => {
      floor.position.z = baseZ + ((t * 0.35) % (size / (ctx.mobile ? 26 : 38)));
    });
  }

  if (kind === 'wall' || kind === 'both') {
    const wall = makeGrid(ctx.mobile ? 20 : 28, 0.045);
    wall.rotation.x = Math.PI / 2;
    wall.position.set(0, 0, -8.5);
    ctx.world.add(wall);
  }
}

/* -------------------------------------------------------------------------- */
/*  Noyaux 3D : une géométrie-signature par univers de page                   */
/* -------------------------------------------------------------------------- */

function buildInfinityCore(ctx: BuildCtx) {
  const group = new THREE.Group();
  const controlPoints: THREE.Vector3[] = [];
  const segments = 180;
  for (let i = 0; i < segments; i++) {
    const u = (i / segments) * TAU;
    const d = 1 + Math.sin(u) * Math.sin(u);
    controlPoints.push(
      new THREE.Vector3(
        (Math.cos(u) * 2.6) / d,
        (Math.sin(u) * Math.cos(u) * 2.6) / d,
        Math.sin(u * 2) * 0.55,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.5);

  const body = new THREE.Mesh(
    trackGeo(ctx, new THREE.TubeGeometry(curve, 220, 0.13, 8, true)),
    trackMat(
      ctx,
      new THREE.MeshStandardMaterial({
        color: 0x0a1020,
        emissive: ctx.preset.primary,
        emissiveIntensity: 0.75,
        metalness: 0.7,
        roughness: 0.22,
      }),
    ),
  );
  group.add(body);

  group.add(
    new THREE.Mesh(
      trackGeo(ctx, new THREE.TubeGeometry(curve, 220, 0.2, 8, true)),
      glowMat(ctx, ctx.preset.secondary, 0.07),
    ),
  );
  group.add(
    new THREE.Mesh(
      trackGeo(ctx, new THREE.TubeGeometry(curve, 200, 0.035, 6, true)),
      glowMat(ctx, ctx.preset.accent, 0.55),
    ),
  );

  const beads: THREE.Mesh[] = [];
  const beadGeo = trackGeo(ctx, new THREE.SphereGeometry(0.1, 10, 10));
  const beadMat = glowMat(ctx, ctx.preset.accent, 0.55);
  for (let i = 0; i < 7; i++) {
    const bead = new THREE.Mesh(beadGeo, beadMat);
    group.add(bead);
    beads.push(bead);
  }

  const ringGeo = trackGeo(ctx, new THREE.TorusGeometry(3.3, 0.012, 6, 140));
  const ringA = new THREE.Mesh(ringGeo, glowMat(ctx, ctx.preset.secondary, 0.18));
  ringA.rotation.x = Math.PI / 2.4;
  group.add(ringA);
  const ringB = new THREE.Mesh(ringGeo, glowMat(ctx, ctx.preset.primary, 0.16));
  ringB.rotation.y = Math.PI / 2.8;
  ringB.rotation.z = Math.PI / 5;
  group.add(ringB);

  ctx.world.add(group);

  ctx.updaters.push((t) => {
    group.rotation.y = t * ctx.preset.spin;
    group.rotation.x = Math.sin(t * 0.22) * 0.22;
    ringA.rotation.z = t * -0.16;
    ringB.rotation.x = t * 0.12;
    for (let i = 0; i < beads.length; i++) {
      beads[i].position.copy(curve.getPointAt((t * 0.06 + i / beads.length) % 1));
    }
  });
}

function buildGlobeCore(ctx: BuildCtx) {
  const group = new THREE.Group();
  const radius = 2.15;

  const sphereGeo = trackGeo(ctx, new THREE.SphereGeometry(radius, 26, 18));
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.WireframeGeometry(sphereGeo)),
      lineMat(ctx, ctx.preset.primary, 0.14),
    ),
  );

  // Latitudes
  for (let k = 1; k <= 6; k++) {
    const y = -radius + (2 * radius * k) / 7;
    const r = Math.sqrt(Math.max(0.0001, radius * radius - y * y));
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(r, 0.008, 5, 100)),
      glowMat(ctx, ctx.preset.secondary, 0.34),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  }

  // Méridiens
  for (let k = 0; k < 5; k++) {
    const meridian = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(radius, 0.007, 5, 110)),
      glowMat(ctx, k % 2 === 0 ? ctx.preset.primary : ctx.preset.secondary, 0.26),
    );
    meridian.rotation.y = (k / 5) * Math.PI;
    group.add(meridian);
  }

  // Global connection arcs
  const surfacePoint = () => {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * TAU;
    return new THREE.Vector3().setFromSphericalCoords(radius, theta, phi);
  };
  for (let i = 0; i < 9; i++) {
    const a = surfacePoint();
    const b = surfacePoint();
    const mid = a.clone().add(b).normalize().multiplyScalar(radius * 1.3);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    group.add(
      new THREE.Mesh(
        trackGeo(ctx, new THREE.TubeGeometry(curve, 40, 0.012, 4, false)),
        glowMat(ctx, ctx.preset.accent, 0.5),
      ),
    );
    const packet = addSprite(ctx, ctx.preset.accent, 0.26, 0.8);
    group.add(packet);
    ctx.updaters.push((t) => {
      packet.position.copy(curve.getPointAt((t * 0.07 + i * 0.11) % 1));
    });
  }

  // Villes / nœuds surfaciques
  const cityCount = ctx.mobile ? 40 : 80;
  const cityPositions = new Float32Array(cityCount * 3);
  for (let i = 0; i < cityCount; i++) {
    const p = surfacePoint();
    cityPositions[i * 3] = p.x;
    cityPositions[i * 3 + 1] = p.y;
    cityPositions[i * 3 + 2] = p.z;
  }
  const cityGeo = trackGeo(ctx, new THREE.BufferGeometry());
  cityGeo.setAttribute('position', new THREE.BufferAttribute(cityPositions, 3));
  group.add(
    new THREE.Points(
      cityGeo,
      trackMat(
        ctx,
        new THREE.PointsMaterial({
          color: ctx.preset.accent,
          size: 0.08,
          map: ctx.glowTexture,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    ),
  );

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.12;
    group.rotation.x = Math.sin(t * 0.18) * 0.12;
  });
}

function buildShieldCore(ctx: BuildCtx) {
  const group = new THREE.Group();

  const coreGeo = trackGeo(ctx, new THREE.OctahedronGeometry(1.25, 0));
  const coreMesh = new THREE.Mesh(
    coreGeo,
    trackMat(
      ctx,
      new THREE.MeshStandardMaterial({
        color: 0x081020,
        emissive: ctx.preset.primary,
        emissiveIntensity: 1.1,
        metalness: 0.65,
        roughness: 0.25,
        transparent: true,
        opacity: 0.85,
      }),
    ),
  );
  group.add(coreMesh);
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.EdgesGeometry(coreGeo)),
      lineMat(ctx, ctx.preset.accent, 0.85),
    ),
  );

  const cageGeo = trackGeo(ctx, new THREE.IcosahedronGeometry(1.86, 1));
  const cage = new THREE.Mesh(
    cageGeo,
    trackMat(
      ctx,
      new THREE.MeshBasicMaterial({
        color: ctx.preset.secondary,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  group.add(cage);

  // Prisme hexagonal de protection
  const prismGeo = trackGeo(ctx, new THREE.CylinderGeometry(2.25, 2.25, 3.1, 6, 1, true));
  const prism = new THREE.Mesh(
    prismGeo,
    trackMat(
      ctx,
      new THREE.MeshBasicMaterial({
        color: ctx.preset.primary,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  group.add(prism);

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(2.35 + i * 0.22, 0.01, 6, 130)),
      glowMat(ctx, i === 1 ? ctx.preset.accent : ctx.preset.secondary, 0.35),
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = (i / 3) * Math.PI;
    group.add(ring);
    ctx.updaters.push((t) => {
      ring.rotation.z = t * (0.12 + i * 0.05) * (i % 2 === 0 ? 1 : -1);
    });
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * ctx.preset.spin;
    cage.rotation.y = -t * 0.1;
    cage.rotation.x = t * 0.06;
    prism.rotation.y = t * 0.04;
    const pulse = 1 + Math.sin(t * 1.4) * 0.045;
    coreMesh.scale.setScalar(pulse);
  });
}

function buildChartCore(ctx: BuildCtx) {
  const group = new THREE.Group();
  const bars: Array<{ mesh: THREE.Mesh; base: number; phase: number }> = [];
  const count = ctx.mobile ? 16 : 22;
  const radius = 2.9;
  const topPoints: THREE.Vector3[] = [];

  const barGeo = trackGeo(ctx, new THREE.BoxGeometry(0.17, 1, 0.17));
  for (let i = 0; i < count; i++) {
    const angle = -0.62 * Math.PI + (i / (count - 1)) * 1.24 * Math.PI;
    const height = 0.5 + Math.abs(Math.sin(i * 0.9 + 1.2)) * 2.1;
    const mesh = new THREE.Mesh(
      barGeo,
      trackMat(
        ctx,
        new THREE.MeshStandardMaterial({
          color: 0x081020,
          emissive: i % 4 === 0 ? ctx.preset.secondary : ctx.preset.primary,
          emissiveIntensity: 1.15,
          metalness: 0.6,
          roughness: 0.3,
        }),
      ),
    );
    mesh.scale.y = height;
    mesh.position.set(Math.cos(angle) * radius, height / 2 - 1.15, Math.sin(angle) * radius);
    group.add(mesh);
    bars.push({ mesh, base: height, phase: i * 0.55 });
    topPoints.push(new THREE.Vector3(mesh.position.x, height - 1.15, mesh.position.z));
  }
  topPoints.push(topPoints[0].clone());

  const lineGeo = trackGeo(ctx, new THREE.BufferGeometry().setFromPoints(topPoints));
  group.add(new THREE.Line(lineGeo, lineMat(ctx, ctx.preset.accent, 0.75)));

  // Surfaces analytiques translucides
  for (let i = 0; i < 2; i++) {
    const plane = new THREE.Mesh(
      trackGeo(ctx, new THREE.PlaneGeometry(7, 3.4, 10, 5)),
      trackMat(
        ctx,
        new THREE.MeshBasicMaterial({
          color: i === 0 ? ctx.preset.primary : ctx.preset.secondary,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    plane.position.set(0, i === 0 ? -1.5 : 1.6, -1.4 - i * 0.9);
    plane.rotation.x = -0.5 + i * 0.2;
    group.add(plane);
  }

  const ring = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(3.5, 0.012, 6, 140)),
    glowMat(ctx, ctx.preset.secondary, 0.35),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * ctx.preset.spin;
    group.rotation.x = Math.sin(t * 0.2) * 0.08;
    for (const bar of bars) {
      bar.mesh.scale.y = bar.base * (0.92 + Math.sin(t * 1.2 + bar.phase) * 0.08);
    }
  });
}

function buildNodesCore(ctx: BuildCtx) {
  const group = new THREE.Group();
  const layout: Array<[number, number, number]> = [
    [-3.1, 1.4, 0], [-1.4, 2.3, -0.6], [0.6, 1.5, 0.4], [2.6, 2.2, -0.4],
    [-2.5, -0.9, 0.5], [-0.2, -0.3, -0.2], [1.8, -1.2, 0.6], [3.2, 0.2, -0.5],
    [-0.9, -2.2, 0.2], [1.2, -2.4, -0.5],
  ];
  const nodes: THREE.Mesh[] = [];
  const nodeGeo = trackGeo(ctx, new THREE.BoxGeometry(0.42, 0.42, 0.42));
  const nodeMat = trackMat(
    ctx,
    new THREE.MeshStandardMaterial({
      color: 0x0a1324,
      emissive: ctx.preset.secondary,
      emissiveIntensity: 1,
      metalness: 0.6,
      roughness: 0.28,
    }),
  );

  layout.forEach(([x, y, z], i) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(i * 0.2, i * 0.35, i * 0.15);
    group.add(mesh);
    nodes.push(mesh);
  });

  const links: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [2, 5], [4, 8], [8, 9], [9, 6], [1, 5], [3, 7],
  ];
  const linePositions: number[] = [];
  for (const [a, b] of links) {
    linePositions.push(
      layout[a][0], layout[a][1], layout[a][2],
      layout[b][0], layout[b][1], layout[b][2],
    );
  }
  const lineGeo = trackGeo(ctx, new THREE.BufferGeometry());
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  group.add(new THREE.LineSegments(lineGeo, lineMat(ctx, ctx.preset.accent, 0.42)));

  // Paquets qui parcourent les câbles
  for (let i = 0; i < Math.min(6, links.length); i++) {
    const [a, b] = links[Math.floor((i / 6) * links.length)];
    const start = new THREE.Vector3(...layout[a]);
    const end = new THREE.Vector3(...layout[b]);
    const sprite = addSprite(ctx, ctx.preset.accent, 0.3, 0.9);
    group.add(sprite);
    ctx.updaters.push((t) => {
      const p = (t * 0.22 + i * 0.17) % 1;
      sprite.position.lerpVectors(start, end, p);
    });
  }

  const ring = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(2.4, 0.012, 6, 120)),
    glowMat(ctx, ctx.preset.secondary, 0.3),
  );
  ring.rotation.x = Math.PI / 2.3;
  group.add(ring);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.16) * 0.3;
    group.rotation.x = Math.sin(t * 0.12) * 0.1;
    nodes.forEach((node, i) => {
      node.rotation.x = t * 0.12 + i;
      node.rotation.y = t * 0.09 + i * 0.4;
    });
  });
}

function buildGearCore(ctx: BuildCtx) {
  const group = new THREE.Group();

  const discGeo = trackGeo(ctx, new THREE.CylinderGeometry(1.35, 1.35, 0.34, 14));
  const disc = new THREE.Mesh(
    discGeo,
    trackMat(
      ctx,
      new THREE.MeshStandardMaterial({
        color: 0x0a1324,
        emissive: ctx.preset.primary,
        emissiveIntensity: 0.7,
        metalness: 0.75,
        roughness: 0.3,
      }),
    ),
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  disc.add(new THREE.LineSegments(trackGeo(ctx, new THREE.EdgesGeometry(discGeo)), lineMat(ctx, ctx.preset.accent, 0.55)));

  const toothGeo = trackGeo(ctx, new THREE.BoxGeometry(0.26, 0.26, 0.4));
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * TAU;
    const tooth = new THREE.Mesh(toothGeo, glowMat(ctx, ctx.preset.secondary, 0.5));
    tooth.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, 0);
    tooth.rotation.z = angle;
    disc.add(tooth);
  }

  // Petits engrenages satellites
  const makeSmallGear = (x: number, y: number, radius: number) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      trackGeo(ctx, new THREE.CylinderGeometry(radius, radius, 0.22, 10)),
      trackMat(
        ctx,
        new THREE.MeshStandardMaterial({
          color: 0x0a1324,
          emissive: ctx.preset.secondary,
          emissiveIntensity: 0.8,
          metalness: 0.7,
          roughness: 0.3,
        }),
      ),
    );
    body.rotation.x = Math.PI / 2;
    g.add(body);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const t = new THREE.Mesh(
        toothGeo,
        glowMat(ctx, ctx.preset.primary, 0.4),
      );
      t.scale.setScalar(0.6);
      t.position.set(Math.cos(a) * (radius + 0.17), Math.sin(a) * (radius + 0.17), 0);
      t.rotation.z = a;
      g.add(t);
    }
    g.position.set(x, y, -0.7);
    group.add(g);
    return g;
  };
  const smallA = makeSmallGear(2.25, 1.1, 0.55);
  const smallB = makeSmallGear(-2.3, -1.15, 0.68);

  // Circuits rayonnants avec puces
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * TAU;
    const pts = [
      new THREE.Vector3(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 0),
      new THREE.Vector3(Math.cos(angle) * 2.9, Math.sin(angle) * 2.9, 0),
      new THREE.Vector3(Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, -0.4),
    ];
    group.add(new THREE.Line(trackGeo(ctx, new THREE.BufferGeometry().setFromPoints(pts)), lineMat(ctx, ctx.preset.accent, 0.35)));
    const chip = new THREE.Mesh(
      trackGeo(ctx, new THREE.BoxGeometry(0.24, 0.24, 0.08)),
      glowMat(ctx, ctx.preset.secondary, 0.45),
    );
    chip.position.copy(pts[2]);
    group.add(chip);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.15) * 0.12;
    disc.rotation.z = t * 0.25;
    smallA.rotation.z = -t * 0.45;
    smallB.rotation.z = t * 0.35;
  });
}

function buildHelixCore(ctx: BuildCtx) {
  const group = new THREE.Group();
  const turns = 2.4;
  const height = 5.4;
  const radius = 1.15;

  for (let strand = 0; strand < 2; strand++) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 130; i++) {
      const p = i / 130;
      const angle = p * Math.PI * 2 * turns + strand * Math.PI;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          -height / 2 + p * height,
          Math.sin(angle) * radius,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    group.add(
      new THREE.Mesh(
        trackGeo(ctx, new THREE.TubeGeometry(curve, 180, 0.075, 6, false)),
        glowMat(ctx, strand === 0 ? ctx.preset.primary : ctx.preset.secondary, 0.85),
      ),
    );
  }

  // Barreaux entre les deux brins
  for (let i = 0; i < 18; i++) {
    const p = i / 17;
    const angle = p * Math.PI * 2 * turns;
    const a = new THREE.Vector3(Math.cos(angle) * radius, -height / 2 + p * height, Math.sin(angle) * radius);
    const b = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, -height / 2 + p * height, Math.sin(angle + Math.PI) * radius);
    group.add(new THREE.Line(trackGeo(ctx, new THREE.BufferGeometry().setFromPoints([a, b])), lineMat(ctx, ctx.preset.accent, 0.3)));
  }

  // Nœuds de connaissance
  const nodeGeo = trackGeo(ctx, new THREE.IcosahedronGeometry(0.12, 0));
  const nodeMat = glowMat(ctx, ctx.preset.accent, 0.8);
  for (let i = 0; i < 10; i++) {
    const p = i / 10;
    const angle = p * Math.PI * 2 * turns;
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(Math.cos(angle) * radius, -height / 2 + p * height, Math.sin(angle) * radius);
    group.add(node);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.28;
    group.rotation.z = Math.sin(t * 0.2) * 0.08;
  });
}

function buildWaveCore(ctx: BuildCtx) {
  const group = new THREE.Group();

  const coreGeo = trackGeo(ctx, new THREE.IcosahedronGeometry(1.05, 1));
  group.add(
    new THREE.Mesh(
      coreGeo,
      trackMat(
        ctx,
        new THREE.MeshStandardMaterial({
          color: 0x0a1324,
          emissive: ctx.preset.secondary,
          emissiveIntensity: 1.2,
          metalness: 0.65,
          roughness: 0.24,
        }),
      ),
    ),
  );
  group.add(new THREE.LineSegments(trackGeo(ctx, new THREE.EdgesGeometry(coreGeo)), lineMat(ctx, ctx.preset.accent, 0.6)));

  // Ondes concentriques
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(1.6 + i * 0.55, 0.012, 6, 120)),
      glowMat(ctx, i % 2 === 0 ? ctx.preset.primary : ctx.preset.secondary, 0.4 - i * 0.06),
    );
    ring.rotation.x = Math.PI / 2.2;
    ring.rotation.y = i * 0.3;
    group.add(ring);
    const phase = i * 0.6;
    ctx.updaters.push((t) => {
      const scale = 1 + Math.sin(t * 1.1 + phase) * 0.06;
      ring.scale.setScalar(scale);
      ring.rotation.z = t * (0.1 + i * 0.03);
    });
  }

  // Onde vocale traversante
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const p = i / 80;
    points.push(new THREE.Vector3(-4.2 + p * 8.4, Math.sin(p * Math.PI * 8) * 0.65, 0));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  group.add(
    new THREE.Mesh(
      trackGeo(ctx, new THREE.TubeGeometry(curve, 140, 0.035, 5, false)),
      glowMat(ctx, ctx.preset.accent, 0.8),
    ),
  );

  // Égaliseur circulaire
  const barGeo = trackGeo(ctx, new THREE.BoxGeometry(0.1, 1, 0.1));
  const bars: THREE.Mesh[] = [];
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * TAU;
    const bar = new THREE.Mesh(barGeo, glowMat(ctx, i % 3 === 0 ? ctx.preset.accent : ctx.preset.secondary, 0.55));
    bar.position.set(Math.cos(angle) * 3.1, Math.sin(angle) * 3.1, -0.6);
    bar.rotation.z = angle - Math.PI / 2;
    group.add(bar);
    bars.push(bar);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.18) * 0.18;
    group.rotation.z = Math.sin(t * 0.14) * 0.05;
    bars.forEach((bar, i) => {
      bar.scale.y = 0.5 + Math.abs(Math.sin(t * 1.6 + i * 0.42)) * 1.5;
    });
  });
}

function buildTimelineCore(ctx: BuildCtx) {
  const group = new THREE.Group();
  const trajectories = ctx.mobile ? 4 : 6;

  for (let i = 0; i < trajectories; i++) {
    const spread = (i - (trajectories - 1) / 2) * 0.75;
    const points: THREE.Vector3[] = [];
    for (let k = 0; k <= 8; k++) {
      const p = k / 8;
      points.push(
        new THREE.Vector3(
          -4.6 + p * 9.2,
          spread * p * 2.1 + Math.sin(p * Math.PI * 1.4 + i) * 0.35,
          -0.4 + Math.sin(p * Math.PI * 2 + i) * 0.5,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    group.add(
      new THREE.Mesh(
        trackGeo(ctx, new THREE.TubeGeometry(curve, 110, 0.018, 4, false)),
        glowMat(ctx, i % 2 === 0 ? ctx.preset.primary : ctx.preset.secondary, 0.5),
      ),
    );

    const packet = addSprite(ctx, ctx.preset.accent, 0.3, 0.85);
    group.add(packet);
    const speed = 0.05 + i * 0.008;
    ctx.updaters.push((t) => {
      packet.position.copy(curve.getPointAt((t * speed + i * 0.12) % 1));
    });

    for (let m = 1; m <= 3; m++) {
      const marker = new THREE.Mesh(
        trackGeo(ctx, new THREE.OctahedronGeometry(0.07, 0)),
        glowMat(ctx, ctx.preset.accent, 0.65),
      );
      marker.position.copy(curve.getPointAt(m / 4));
      group.add(marker);
    }
  }

  // Anneaux d'historique
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(3.4 - i * 0.4, 0.012, 6, 90, Math.PI * 1.25)),
      glowMat(ctx, ctx.preset.secondary, 0.3),
    );
    arc.rotation.z = Math.PI * 0.18 + i * 0.2;
    arc.position.z = -1.6 - i * 0.5;
    group.add(arc);
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.16) * 0.16;
    group.rotation.x = Math.sin(t * 0.12) * 0.06;
  });
}

function buildPrismCore(ctx: BuildCtx) {
  const group = new THREE.Group();

  const outerGeo = trackGeo(ctx, new THREE.IcosahedronGeometry(1.35, 0));
  group.add(
    new THREE.Mesh(
      outerGeo,
      trackMat(
        ctx,
        new THREE.MeshStandardMaterial({
          color: 0x0a1324,
          emissive: ctx.preset.primary,
          emissiveIntensity: 0.9,
          metalness: 0.7,
          roughness: 0.25,
          transparent: true,
          opacity: 0.9,
        }),
      ),
    ),
  );
  group.add(new THREE.LineSegments(trackGeo(ctx, new THREE.EdgesGeometry(outerGeo)), lineMat(ctx, ctx.preset.accent, 0.7)));

  const inner = new THREE.Mesh(
    trackGeo(ctx, new THREE.OctahedronGeometry(0.72, 0)),
    glowMat(ctx, ctx.preset.accent, 0.9),
  );
  group.add(inner);

  const shards: THREE.Mesh[] = [];
  const shardGeo = trackGeo(ctx, new THREE.TetrahedronGeometry(0.2, 0));
  for (let i = 0; i < 12; i++) {
    const shard = new THREE.Mesh(shardGeo, glowMat(ctx, i % 2 === 0 ? ctx.preset.secondary : ctx.preset.accent, 0.7));
    group.add(shard);
    shards.push(shard);
  }

  const ring = new THREE.Mesh(
    trackGeo(ctx, new THREE.TorusGeometry(2.6, 0.012, 6, 130)),
    glowMat(ctx, ctx.preset.secondary, 0.4),
  );
  ring.rotation.x = Math.PI / 2.5;
  group.add(ring);

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * ctx.preset.spin;
    group.rotation.x = Math.sin(t * 0.2) * 0.16;
    inner.rotation.y = -t * 0.5;
    inner.rotation.x = t * 0.3;
    shards.forEach((shard, i) => {
      const angle = (i / shards.length) * TAU + t * 0.12;
      const radius = 2.1 + Math.sin(t * 0.7 + i) * 0.35;
      shard.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.3) * 1.4, Math.sin(angle) * radius);
      shard.rotation.x = t * 0.4 + i;
      shard.rotation.y = t * 0.3 + i;
    });
  });
}

function buildLedgerCore(ctx: BuildCtx) {
  const group = new THREE.Group();
  const panels: Array<{ panel: THREE.Group; baseY: number }> = [];

  for (let i = 0; i < 7; i++) {
    const w = 1.7 + (i % 2) * 0.5;
    const h = 1.05 + (i % 3) * 0.18;
    const planeGeo = trackGeo(ctx, new THREE.PlaneGeometry(w, h));
    const panel = new THREE.Group();
    panel.add(
      new THREE.Mesh(
        planeGeo,
        trackMat(
          ctx,
          new THREE.MeshBasicMaterial({
            color: ctx.preset.primary,
            transparent: true,
            opacity: 0.07,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        ),
      ),
    );
    panel.add(new THREE.LineSegments(trackGeo(ctx, new THREE.EdgesGeometry(planeGeo)), lineMat(ctx, ctx.preset.accent, 0.45)));

    // Mini chart on each panel
    const miniPoints: THREE.Vector3[] = [];
    for (let k = 0; k <= 8; k++) {
      const p = k / 8;
      miniPoints.push(new THREE.Vector3(-w * 0.4 + p * w * 0.8, Math.sin(p * Math.PI * 2 + i) * h * 0.22, 0.01));
    }
    panel.add(
      new THREE.Line(
        trackGeo(ctx, new THREE.BufferGeometry().setFromPoints(miniPoints)),
        lineMat(ctx, ctx.preset.secondary, 0.65),
      ),
    );

    const col = i % 3;
    const row = Math.floor(i / 3);
    panel.position.set(
      (col - 1) * 2.6 + (row % 2) * 0.4,
      (1 - row) * 1.9 + (col % 2) * 0.3,
      -row * 1.3 - col * 0.4,
    );
    panel.rotation.set(-0.18 + row * 0.12, (col - 1) * 0.28, (col - 1) * 0.06);
    group.add(panel);
    panels.push({ panel, baseY: panel.position.y });
  }

  // Links between panels
  const linkPoints: number[] = [];
  for (let i = 0; i < panels.length - 1; i++) {
    linkPoints.push(
      panels[i].panel.position.x, panels[i].panel.position.y, panels[i].panel.position.z,
      panels[i + 1].panel.position.x, panels[i + 1].panel.position.y, panels[i + 1].panel.position.z,
    );
  }
  const linkGeo = trackGeo(ctx, new THREE.BufferGeometry());
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPoints, 3));
  group.add(new THREE.LineSegments(linkGeo, lineMat(ctx, ctx.preset.primary, 0.28)));

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.15) * 0.16;
    group.rotation.x = Math.sin(t * 0.11) * 0.06;
    panels.forEach(({ panel, baseY }, i) => {
      panel.position.y = baseY + Math.sin(t * 0.8 + i * 0.8) * 0.14;
      panel.rotation.z = Math.sin(t * 0.4 + i) * 0.035;
    });
  });
}

function buildBroadcastCore(ctx: BuildCtx) {
  const group = new THREE.Group();

  const coreGeo = trackGeo(ctx, new THREE.SphereGeometry(1.25, 20, 14));
  group.add(
    new THREE.LineSegments(
      trackGeo(ctx, new THREE.WireframeGeometry(coreGeo)),
      lineMat(ctx, ctx.preset.accent, 0.5),
    ),
  );
  group.add(
    new THREE.Mesh(
      coreGeo,
      trackMat(
        ctx,
        new THREE.MeshBasicMaterial({
          color: ctx.preset.primary,
          transparent: true,
          opacity: 0.08,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    ),
  );

  // Anneaux de diffusion
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      trackGeo(ctx, new THREE.TorusGeometry(1.9 + i * 0.55, 0.012, 6, 120)),
      glowMat(ctx, i === 0 ? ctx.preset.accent : ctx.preset.secondary, 0.4 - i * 0.08),
    );
    ring.rotation.x = Math.PI / 2.1;
    ring.rotation.y = i * 0.35;
    group.add(ring);
    const phase = i * 0.8;
    ctx.updaters.push((t) => {
      ring.scale.setScalar(1 + Math.sin(t * 1.2 + phase) * 0.05);
      ring.rotation.z = t * 0.1;
    });
  }

  // Panneaux d'information orbitaux
  for (let i = 0; i < 8; i++) {
    const w = 1.15;
    const h = 0.68;
    const planeGeo = trackGeo(ctx, new THREE.PlaneGeometry(w, h));
    const panel = new THREE.Group();
    panel.add(
      new THREE.Mesh(
        planeGeo,
        trackMat(
          ctx,
          new THREE.MeshBasicMaterial({
            color: ctx.preset.secondary,
            transparent: true,
            opacity: 0.07,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        ),
      ),
    );
    panel.add(new THREE.LineSegments(trackGeo(ctx, new THREE.EdgesGeometry(planeGeo)), lineMat(ctx, ctx.preset.accent, 0.4)));
    const angle = (i / 8) * TAU;
    panel.position.set(Math.cos(angle) * 3.5, Math.sin(angle) * 2.3, Math.sin(angle * 1.5) * 1.2 - 1);
    panel.lookAt(0, 0, 0);
    group.add(panel);
    const baseY = panel.position.y;
    ctx.updaters.push((t) => {
      panel.position.y = baseY + Math.sin(t * 0.5 + i) * 0.18;
    });
  }

  ctx.world.add(group);
  ctx.updaters.push((t) => {
    group.rotation.y = t * 0.1;
    group.rotation.x = Math.sin(t * 0.16) * 0.08;
  });
}

function buildCore(ctx: BuildCtx) {
  switch (ctx.preset.core) {
    case 'globe': buildGlobeCore(ctx); break;
    case 'shield': buildShieldCore(ctx); break;
    case 'chart': buildChartCore(ctx); break;
    case 'nodes': buildNodesCore(ctx); break;
    case 'gear': buildGearCore(ctx); break;
    case 'helix': buildHelixCore(ctx); break;
    case 'wave': buildWaveCore(ctx); break;
    case 'timeline': buildTimelineCore(ctx); break;
    case 'prism': buildPrismCore(ctx); break;
    case 'ledger': buildLedgerCore(ctx); break;
    case 'broadcast': buildBroadcastCore(ctx); break;
    case 'infinity':
    default: buildInfinityCore(ctx); break;
  }
}

/* -------------------------------------------------------------------------- */
/*  Point d'entrée                                                            */
/* -------------------------------------------------------------------------- */

const FALLBACK_GRADIENTS: Record<PageSceneId, string> = {
  about: 'from-blue-600/25 via-cyan-500/15 to-blue-900/10',
  'lynara-public': 'from-cyan-500/25 via-sky-500/15 to-blue-900/10',
  login: 'from-blue-700/25 via-sky-500/15 to-cyan-900/10',
  register: 'from-sky-600/25 via-blue-500/15 to-cyan-900/10',
  workspace: 'from-blue-700/25 via-cyan-500/15 to-slate-900/10',
  chart: 'from-blue-600/25 via-cyan-400/15 to-blue-950/10',
  lynara: 'from-cyan-500/25 via-blue-500/15 to-sky-900/10',
  markets: 'from-blue-700/25 via-cyan-500/15 to-sky-900/10',
  risk: 'from-sky-700/25 via-blue-500/15 to-cyan-900/10',
  backtest: 'from-blue-600/25 via-sky-400/15 to-blue-950/10',
  journal: 'from-cyan-600/25 via-blue-500/15 to-slate-900/10',
  news: 'from-sky-600/25 via-cyan-400/15 to-blue-950/10',
  workflow: 'from-blue-600/25 via-cyan-500/15 to-blue-900/10',
  academy: 'from-sky-500/25 via-blue-500/15 to-cyan-900/10',
  jyntrack: 'from-blue-700/25 via-cyan-400/15 to-slate-900/10',
  settings: 'from-blue-600/25 via-sky-500/15 to-cyan-950/10',
};

export const PageAtmosphere3D: React.FC<{ scene: PageSceneId; className?: string }> = ({
  scene: sceneId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setSupported(true);

    // Vérification WebGL (fallback élégant si absent).
    try {
      const probeCanvas = document.createElement('canvas');
      const gl =
        probeCanvas.getContext('webgl2') ||
        probeCanvas.getContext('webgl') ||
        probeCanvas.getContext('experimental-webgl');
      if (!gl) {
        setSupported(false);
        return;
      }
    } catch {
      setSupported(false);
      return;
    }

    const preset = PRESETS[sceneId] ?? PRESETS.about;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches;

    const width = Math.max(container.clientWidth || window.innerWidth || 1024, 320);
    const height = Math.max(container.clientHeight || window.innerHeight || 720, 320);
    const mobile = width < 700;
    const tablet = !mobile && width < 1100;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 140);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !mobile,
        powerPreference: 'low-power',
      });
    } catch {
      setSupported(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xbfdbfe, 0.5));
    const blueLight = new THREE.PointLight(0x2563eb, 2.0, 40);
    blueLight.position.set(5, 6, 6);
    scene.add(blueLight);
    const cyanLight = new THREE.PointLight(0x22d3ee, 1.8, 40);
    cyanLight.position.set(-6, -3, 5);
    scene.add(cyanLight);

    // Texture lumineuse partagée par toutes les particules.
    const glowTexture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        const gradient = ctx2d.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.28, 'rgba(190,235,255,0.85)');
        gradient.addColorStop(1, 'rgba(30,90,255,0)');
        ctx2d.fillStyle = gradient;
        ctx2d.fillRect(0, 0, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    })();

    const world = new THREE.Group();
    scene.add(world);

    const ctx: BuildCtx = {
      world,
      preset,
      mobile,
      tablet,
      glowTexture,
      geos: [],
      mats: [],
      textures: [glowTexture],
      updaters: [],
    };

    // --- Composition: core + network + ribbons + panels + satellites ----
    const beforeCore = world.children.length;
    buildCore(ctx);
    const coreObjects = world.children.slice(beforeCore);

    const density = preset.density * (mobile ? 0.58 : tablet ? 0.78 : 1);
    const webNodes = Math.round((mobile ? 18 : tablet ? 30 : 42) * preset.density);
    const web = buildNeuralWeb(ctx, preset.frame * (mobile ? 0.55 : 0.92), webNodes, preset.layout === 'center');
    if (mobile) web.scale.setScalar(0.7);

    buildRibbons(ctx, Math.round(preset.ribbons * (mobile ? 0.55 : 1)));
    buildPanels(ctx, Math.round(preset.panels * (mobile ? 0.5 : 1)));
    buildSatellites(ctx, Math.round(10 * density));
    buildGrid(ctx, preset.grid);

    buildParticleField(
      ctx,
      Math.round((mobile ? 110 : tablet ? 200 : 300) * preset.density),
      [preset.frame * 2.6, preset.frame * 1.8, 12],
      preset.secondary,
      mobile ? 0.11 : 0.09,
      0.4,
    );
    buildParticleField(
      ctx,
      Math.round((mobile ? 45 : tablet ? 80 : 130) * preset.density),
      [preset.frame * 2.2, preset.frame * 1.6, 8],
      preset.accent,
      mobile ? 0.18 : 0.15,
      0.32,
    );

    // Volumetric halo: gives real luminous presence to the composition,
    // without ever masking the content (soft sprite, behind the core).
    const halo = addSprite(ctx, preset.primary, preset.frame * 2.6, 0.42);
    halo.position.set(0, 0, -4.5);
    world.add(halo);
    const haloInner = addSprite(ctx, preset.secondary, preset.frame * 1.15, 0.32);
    haloInner.position.set(mobile ? 0 : 1.2, -0.4, -3);
    world.add(haloInner);
    ctx.updaters.push((t) => {
      const pulse = 1 + Math.sin(t * 0.35) * 0.05;
      halo.scale.setScalar(preset.frame * 2.6 * pulse);
      haloInner.scale.setScalar(preset.frame * 1.15 * (2 - pulse));
    });

    // Peripheral holographic rings: structure the whole surface,
    // even behind content blocks, and provide the "Meta AI" scale.
    const outerRingGeo = trackGeo(ctx, new THREE.TorusGeometry(preset.frame * 1.02, 0.008, 5, 180));
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(
        outerRingGeo,
        glowMat(ctx, i === 0 ? preset.secondary : preset.primary, i === 0 ? 0.28 : 0.22),
      );
      ring.rotation.x = 1.05 + i * 0.62;
      ring.rotation.y = 0.4 + i * 0.9;
      ring.position.z = -2.8;
      world.add(ring);
      ctx.updaters.push((t) => {
        ring.rotation.z = t * 0.018 * (i === 0 ? 1 : -1);
      });
    }

    // Global attenuation: compositions stay rich and present but
    // Global attenuation: compositions stay rich and present but
    // never compete with content readability.
    // Light mode: cores very transparent/subtle, secondary elements
    // (thin lines, grids, particles) are strongly boosted so they stay
    // clearly perceptible against bright backgrounds.
    // Night mode: softer, more transparent, elegant glow — less intense,
    // with intensity caps so pages using intensity > 1 stay comfortable.
    const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
    // In night mode, cap intensity at 1.0 so presets declaring > 1 don't
    // override the softer attenuation.
    const nightIntensityCap = isLight ? 1 : Math.min(preset.intensity ?? 1, 1);
    world.traverse((object) => {
      const mesh = object as THREE.Mesh & { material?: THREE.Material | THREE.Material[] };
      const material = mesh.material;
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      for (const entry of list) {
        if (entry.transparent) {
          if (isLight &&
              (entry instanceof THREE.LineBasicMaterial ||
               entry instanceof THREE.PointsMaterial ||
               entry instanceof THREE.SpriteMaterial)) {
            // Secondary elements: strong boost, no dim reduction.
            entry.opacity *= 2.0;
          } else if (isLight) {
            // Other transparent elements in light mode: subtle.
            entry.opacity *= 0.35;
          } else {
            // Night mode: more transparent, softer presence — reduced
            // intensity for visual comfort during long sessions.
            entry.opacity *= mobile ? 0.35 : tablet ? 0.45 : 0.5;
          }
        }
        if (entry instanceof THREE.MeshStandardMaterial) {
          // Cores: very dim glow in light mode; softer glow in night mode
          // to avoid neon fatigue. Intensity capped at 1 for night mode.
          entry.emissiveIntensity *= isLight ? 0.05 : 0.22 * nightIntensityCap;
        }
      }
    });

    // Core offset per requested layout (without moving ambient layers
    // that must cover the whole surface).
    if (preset.coreY && !mobile) {
      for (const object of coreObjects) object.position.y += preset.coreY;
    }
    if (preset.layout === 'left' || preset.layout === 'right') {
      const shift = preset.layout === 'left' ? -1.9 : 1.9;
      if (!mobile) {
        for (const object of coreObjects) object.position.x += shift;
        web.position.x = -shift * 1.05;
      }
    } else if (preset.layout === 'split') {
      if (!mobile) {
        for (const object of coreObjects) object.position.x += 1.3;
        web.position.x = -2.1;
      }
    }

    // --- Cadrage adaptatif --------------------------------------------------
    let baseCameraY = 0.6;
    const fitCamera = (w: number, h: number) => {
      const aspect = w / Math.max(h, 1);
      camera.aspect = aspect;
      const verticalFov = (camera.fov * Math.PI) / 180;
      const frame = preset.frame * (mobile ? 0.8 : tablet ? 0.94 : 1);
      let distance = frame / Math.tan(verticalFov / 2);
      if (aspect < 0.6) distance *= 0.98;
      baseCameraY = mobile ? 0.35 : 0.55;
      camera.position.set(0, baseCameraY, distance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    fitCamera(width, height);

    // --- Interactions subtiles ---------------------------------------------
    const state = { mouseX: 0, mouseY: 0, scroll: 0 };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer || reduceMotion) return;
      state.mouseX = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      state.mouseY = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    };
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      state.scroll = Math.min(1, Math.max(0, window.scrollY / max));
    };
    if (!reduceMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    let elapsed = 0;
    const drawFrame = (delta: number) => {
      elapsed += delta;
      for (const update of ctx.updaters) update(elapsed, delta);

      world.rotation.y = THREE.MathUtils.lerp(
        world.rotation.y,
        state.mouseX * 0.16 + Math.sin(elapsed * 0.07) * 0.05 + (state.scroll - 0.5) * 0.18,
        0.035,
      );
      world.rotation.x = THREE.MathUtils.lerp(world.rotation.x, -state.mouseY * 0.08, 0.035);
      world.position.y = THREE.MathUtils.lerp(world.position.y, (0.5 - state.scroll) * 1.8, 0.04);

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.mouseX * 0.65, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseCameraY + state.mouseY * 0.3, 0.04);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    let lastTimestamp = performance.now();
    let animationFrame: number | null = null;
    let visible = true;

    // Safety net: the IntersectionObserver can fire before the layout
    // stabilizes (iframe, navigation, sticky). We also check the real
    // position before skipping a frame.
    const isOnScreen = () => {
      const rect = container.getBoundingClientRect();
      return rect.bottom > -240 && rect.top < window.innerHeight + 240;
    };

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;
      if (!visible && !isOnScreen()) return;
      drawFrame(delta);
    };

    if (reduceMotion) {
      drawFrame(0);
    } else {
      drawFrame(0);
      animate();
    }

    // Pause off-screen (the canvas follows the page via sticky).
    let intersectionObserver: IntersectionObserver | null = null;
    if (!reduceMotion && typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          visible = entry.isIntersecting;
          if (visible) lastTimestamp = performance.now();
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(container);
    }

    // Redimensionnement / orientation / changement de largeur.
    let resizeFrame: number | null = null;
    const applySize = () => {
      resizeFrame = null;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      fitCamera(w, h);
      // setSize() resets the buffer: redraw immediately, even if
      // the loop is paused, to never leave an empty canvas.
      drawFrame(0);
    };
    const scheduleResize = () => {
      if (resizeFrame !== null) return;
      resizeFrame = window.requestAnimationFrame(applySize);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleResize);
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', scheduleResize);

    return () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);

      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);

      for (const material of ctx.mats) material.dispose();
      for (const geometry of ctx.geos) geometry.dispose();
      for (const texture of ctx.textures) texture.dispose();
      ctx.mats.length = 0;
      ctx.geos.length = 0;
      ctx.textures.length = 0;
      ctx.updaters.length = 0;

      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [sceneId]);

  if (!supported) {
    const gradient = FALLBACK_GRADIENTS[sceneId] ?? FALLBACK_GRADIENTS.about;
    return (
      <div className={`jyntra-3d-fallback ${className}`} aria-hidden="true">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        <div className="jyntra-3d-fallback-grid" />
        <div className="jyntra-3d-fallback-core" />
        <div className="jyntra-3d-fallback-ring jyntra-3d-fallback-ring--a" />
        <div className="jyntra-3d-fallback-ring jyntra-3d-fallback-ring--b" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 h-full w-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};

export default PageAtmosphere3D;
