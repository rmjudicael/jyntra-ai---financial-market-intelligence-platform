import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type SecondaryVariant =
  | 'workspace' | 'markets' | 'chart' | 'risk' | 'backtest' | 'journal'
  | 'academy' | 'jyntrack' | 'news' | 'workflow' | 'settings' | 'login'
  | 'register' | 'lynara';

export type { SecondaryVariant };

interface Secondary3DDecorProps {
  variant: SecondaryVariant;
  className?: string;
}

const VARIANT_CONFIG: Record<SecondaryVariant, {
  primary: number;
  secondary: number;
  accent: number;
  core: string;
  nodeCount: number;
  particleCount: number;
  sideParticleCount: number;
}> = {
  workspace: { primary: 0x22d3ee, secondary: 0x3b82f6, accent: 0xa5f3fc, core: 'nodes', nodeCount: 22, particleCount: 170, sideParticleCount: 45 },
  markets:   { primary: 0xf97316, secondary: 0xfb923c, accent: 0xfcd34d, core: 'globe', nodeCount: 20, particleCount: 180, sideParticleCount: 50 },
  chart:     { primary: 0x10b981, secondary: 0x34d399, accent: 0xa7f3d0, core: 'chart', nodeCount: 20, particleCount: 170, sideParticleCount: 45 },
  risk:      { primary: 0xef4444, secondary: 0xf87171, accent: 0xfae4de, core: 'shield', nodeCount: 18, particleCount: 140, sideParticleCount: 38 },
  backtest:  { primary: 0x8b5cf6, secondary: 0xa78bfa, accent: 0xc4b5fd, core: 'timeline', nodeCount: 20, particleCount: 170, sideParticleCount: 45 },
  journal:   { primary: 0xfbbf24, secondary: 0xfcd34d, accent: 0xfef3c7, core: 'ledger', nodeCount: 18, particleCount: 150, sideParticleCount: 40 },
  academy:   { primary: 0xa78bfa, secondary: 0xc4b5fd, accent: 0xe0e7ff, core: 'helix', nodeCount: 20, particleCount: 170, sideParticleCount: 45 },
  jyntrack:  { primary: 0xf97316, secondary: 0xfb923c, accent: 0xfcd34d, core: 'wave', nodeCount: 20, particleCount: 170, sideParticleCount: 45 },
  news:      { primary: 0x22d3ee, secondary: 0x67e8f9, accent: 0xbae6fd, core: 'broadcast', nodeCount: 20, particleCount: 170, sideParticleCount: 45 },
  workflow:  { primary: 0x06b6d4, secondary: 0x22d3ee, accent: 0x67e8f9, core: 'network', nodeCount: 22, particleCount: 180, sideParticleCount: 50 },
  settings:  { primary: 0x64748b, secondary: 0x94a3b8, accent: 0xcbd5e1, core: 'gear', nodeCount: 18, particleCount: 140, sideParticleCount: 38 },
  login:     { primary: 0x3b82f6, secondary: 0x60a5fa, accent: 0x93c5fd, core: 'prism', nodeCount: 18, particleCount: 130, sideParticleCount: 35 },
  register:  { primary: 0x3b82f6, secondary: 0x60a5fa, accent: 0x93c5fd, core: 'prism', nodeCount: 18, particleCount: 130, sideParticleCount: 35 },
  lynara:    { primary: 0x22d3ee, secondary: 0x0ea5e9, accent: 0x67e8f9, core: 'infinity', nodeCount: 20, particleCount: 170, sideParticleCount: 45 },
};

const TAU = Math.PI * 2;
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

function darken(hex: number, factor: number): number {
  const r = ((hex >> 16) & 0xff) * factor;
  const g = ((hex >> 8) & 0xff) * factor;
  const b = (hex & 0xff) * factor;
  return ((Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b)) & 0xffffff;
}

function glowMat(color: number, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function lineMat(color: number, opacity: number) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function addSprite(color: number, size: number, opacity = 0.9) {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx2d = canvas.getContext('2d');
  if (ctx2d) {
    const grad = ctx2d.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx2d.fillStyle = grad;
    ctx2d.fillRect(0, 0, 48, 48);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(size);
  return sprite;
}

type VARIANTConfigValue = typeof VARIANT_CONFIG[SecondaryVariant];

interface BuildCtx {
  world: THREE.Group;
  preset: VARIANTConfigValue;
  mobile: boolean;
  light: boolean;
  updaters: Array<(t: number, dt: number) => void>;
  geos: THREE.BufferGeometry[];
  mats: THREE.Material[];
}

function trackGeo(geos: THREE.BufferGeometry[], geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geos.push(geo);
  return geo;
}
function trackMat(mats: THREE.Material[], mat: THREE.Material): THREE.Material {
  mats.push(mat);
  return mat;
}

/* -------------------------------------------------------------------------- */
/*  Noyaux 3D distincts par page — grands, centraux, volumineux               */
/* -------------------------------------------------------------------------- */

function buildSphereCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const radius = 2.9;
  const base = light ? 0x0f172a : 0x0a1020;
  const core = new THREE.Mesh(
    trackGeo(geos, new THREE.SphereGeometry(radius, 32, 22)),
    trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: light ? darken(preset.primary, 0.5) : preset.primary,
      emissiveIntensity: light ? 1.1 : 1.4,
      metalness: 0.65,
      roughness: 0.22,
    })),
  );
  group.add(core);
  group.add(new THREE.LineSegments(
    trackGeo(geos, new THREE.WireframeGeometry(core.geometry as THREE.BufferGeometry)),
    lineMat(preset.secondary, light ? 0.55 : 0.35),
  ));
  const ring = new THREE.Mesh(
    trackGeo(geos, new THREE.TorusGeometry(radius * 1.6, 0.014, 8, 160)),
    glowMat(preset.accent, light ? 0.65 : 0.55),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const ring2 = new THREE.Mesh(
    trackGeo(geos, new THREE.TorusGeometry(radius * 1.15, 0.01, 6, 140)),
    glowMat(preset.primary, light ? 0.45 : 0.3),
  );
  ring2.rotation.z = Math.PI / 4;
  group.add(ring2);
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = t * 0.16;
    group.rotation.x = Math.sin(t * 0.2) * 0.14;
    core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.04);
    ring.rotation.z = t * 0.09;
    ring2.rotation.z = -t * 0.06;
  });
}

function buildShieldCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const base = light ? 0x0f172a : 0x081020;
  const core = new THREE.Mesh(
    trackGeo(geos, new THREE.OctahedronGeometry(2.3, 1)),
    trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: light ? darken(preset.primary, 0.45) : preset.primary,
      emissiveIntensity: light ? 1.1 : 1.25,
      metalness: 0.7,
      roughness: 0.22,
      transparent: true,
      opacity: 0.92,
    })),
  );
  group.add(core);
  group.add(new THREE.LineSegments(
    trackGeo(geos, new THREE.EdgesGeometry(core.geometry as THREE.BufferGeometry)),
    lineMat(preset.accent, light ? 0.65 : 0.65),
  ));
  const cage = new THREE.Mesh(
    trackGeo(geos, new THREE.IcosahedronGeometry(2.9, 2)),
    trackMat(mats, new THREE.MeshBasicMaterial({
      color: preset.secondary, wireframe: true, transparent: true,
      opacity: light ? 0.45 : 0.3, depthWrite: false, blending: THREE.AdditiveBlending,
    })),
  );
  group.add(cage);
  const ring = new THREE.Mesh(
    trackGeo(geos, new THREE.TorusGeometry(2.6, 0.012, 6, 150)),
    glowMat(preset.secondary, light ? 0.5 : 0.4),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = t * 0.14;
    group.rotation.x = Math.sin(t * 0.16) * 0.12;
    cage.rotation.y = -t * 0.1;
    core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    ring.rotation.z = t * 0.08;
  });
}

function buildHelixCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const turns = 2.6, height = 6.4, radius = 1.6;
  for (let strand = 0; strand < 2; strand++) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const p = i / 160;
      const angle = p * Math.PI * 2 * turns + strand * Math.PI;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        -height / 2 + p * height,
        Math.sin(angle) * radius,
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    group.add(new THREE.Mesh(
      trackGeo(geos, new THREE.TubeGeometry(curve, 220, 0.09, 7, false)),
      glowMat(strand === 0 ? preset.primary : preset.secondary, light ? 0.85 : 0.85),
    ));
  }
  for (let i = 0; i < 22; i++) {
    const p = i / 21;
    const angle = p * Math.PI * 2 * turns;
    const a = new THREE.Vector3(Math.cos(angle) * radius, -height / 2 + p * height, Math.sin(angle) * radius);
    const b = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, -height / 2 + p * height, Math.sin(angle + Math.PI) * radius);
    group.add(new THREE.Line(trackGeo(geos, new THREE.BufferGeometry().setFromPoints([a, b])),
      lineMat(preset.accent, light ? 0.5 : 0.4)));
  }
  const nodeGeo = trackGeo(geos, new THREE.IcosahedronGeometry(0.16, 0));
  for (let i = 0; i < 14; i++) {
    const p = i / 13;
    const angle = p * Math.PI * 2 * turns;
    const node = new THREE.Mesh(nodeGeo, glowMat(preset.accent, light ? 0.9 : 0.9));
    node.position.set(Math.cos(angle) * radius, -height / 2 + p * height, Math.sin(angle) * radius);
    group.add(node);
  }
  const outer = new THREE.Mesh(
    trackGeo(geos, new THREE.TorusGeometry(2.4, 0.01, 6, 150)),
    glowMat(preset.primary, light ? 0.5 : 0.4),
  );
  outer.rotation.x = Math.PI / 2;
  group.add(outer);
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = t * 0.34;
    group.rotation.z = Math.sin(t * 0.22) * 0.1;
    outer.rotation.z = t * 0.12;
  });
}

function buildGearCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const base = light ? 0x0f172a : 0x0a1324;
  const disc = new THREE.Mesh(
    trackGeo(geos, new THREE.CylinderGeometry(2.0, 2.0, 0.45, 18)),
    trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: light ? darken(preset.primary, 0.5) : preset.primary,
      emissiveIntensity: light ? 1.1 : 0.9,
      metalness: 0.75,
      roughness: 0.25,
    })),
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  disc.add(new THREE.LineSegments(trackGeo(geos, new THREE.EdgesGeometry(disc.geometry as THREE.BufferGeometry)),
    lineMat(preset.accent, light ? 0.6 : 0.5)));
  const toothGeo = trackGeo(geos, new THREE.BoxGeometry(0.34, 0.34, 0.5));
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * TAU;
    const tooth = new THREE.Mesh(toothGeo, glowMat(preset.secondary, light ? 0.65 : 0.6));
    tooth.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
    tooth.rotation.z = angle;
    disc.add(tooth);
  }
  const small = (x: number, y: number, radius: number) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      trackGeo(geos, new THREE.CylinderGeometry(radius, radius, 0.3, 12)),
      trackMat(mats, new THREE.MeshStandardMaterial({
        color: base,
        emissive: light ? darken(preset.secondary, 0.45) : preset.secondary,
        emissiveIntensity: light ? 1.1 : 1.0,
        metalness: 0.7,
        roughness: 0.28,
      })),
    );
    body.rotation.x = Math.PI / 2;
    g.add(body);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const t = new THREE.Mesh(toothGeo, glowMat(preset.primary, light ? 0.55 : 0.5));
      t.scale.setScalar(0.6);
      t.position.set(Math.cos(a) * (radius + 0.22), Math.sin(a) * (radius + 0.22), 0);
      t.rotation.z = a;
      g.add(t);
    }
    g.position.set(x, y, -0.9);
    group.add(g);
    return g;
  };
  const smallA = small(3.1, 1.5, 0.75);
  const smallB = small(-3.1, -1.55, 0.9);
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.17) * 0.14;
    disc.rotation.z = t * 0.34;
    smallA.rotation.z = -t * 0.6;
    smallB.rotation.z = t * 0.48;
  });
}

function buildChartCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const count = ctx.mobile ? 18 : 26;
  const radius = 3.4;
  const bars: Array<{ mesh: THREE.Mesh; base: number; phase: number }> = [];
  const barGeo = trackGeo(geos, new THREE.BoxGeometry(0.18, 1, 0.18));
  const base = light ? 0x0f172a : 0x081020;
  for (let i = 0; i < count; i++) {
    const angle = -0.62 * Math.PI + (i / (count - 1)) * 1.24 * Math.PI;
    const height = 0.6 + Math.abs(Math.sin(i * 0.9 + 1.2)) * 2.4;
    const mesh = new THREE.Mesh(
      barGeo,
      trackMat(mats, new THREE.MeshStandardMaterial({
        color: base,
        emissive: i % 3 === 0 ? preset.secondary : preset.primary,
        emissiveIntensity: light ? 1.1 : 1.3,
        metalness: 0.6,
        roughness: 0.28,
      })),
    );
    mesh.scale.y = height;
    mesh.position.set(Math.cos(angle) * radius, height / 2 - 1.2, Math.sin(angle) * radius);
    group.add(mesh);
    bars.push({ mesh, base: height, phase: i * 0.45 });
  }
  const ring = new THREE.Mesh(
    trackGeo(geos, new THREE.TorusGeometry(4.2, 0.014, 8, 160)),
    glowMat(preset.secondary, light ? 0.55 : 0.45),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const surface = new THREE.Mesh(
    trackGeo(geos, new THREE.PlaneGeometry(10, 4, 14, 7)),
    trackMat(mats, new THREE.MeshBasicMaterial({
      color: preset.primary, wireframe: true, transparent: true,
      opacity: light ? 0.2 : 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })),
  );
  surface.rotation.x = -0.6;
  surface.position.set(0, -1, -2);
  group.add(surface);
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = t * 0.15;
    group.rotation.x = Math.sin(t * 0.22) * 0.1;
    surface.rotation.z = Math.sin(t * 0.3) * 0.04;
    for (const bar of bars) {
      bar.mesh.scale.y = bar.base * (0.92 + Math.sin(t * 1.2 + bar.phase) * 0.08);
    }
  });
}

function buildTimelineCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos } = ctx;
  const group = new THREE.Group();
  const trajectories = ctx.mobile ? 5 : 8;
  for (let i = 0; i < trajectories; i++) {
    const spread = (i - (trajectories - 1) / 2) * 1.0;
    const points: THREE.Vector3[] = [];
    for (let k = 0; k <= 10; k++) {
      const p = k / 10;
      points.push(new THREE.Vector3(
        -5.6 + p * 11.2,
        spread * p * 2.4 + Math.sin(p * Math.PI * 1.6 + i) * 0.45,
        -0.6 + Math.sin(p * Math.PI * 2.2 + i) * 0.7,
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    group.add(new THREE.Mesh(
      trackGeo(geos, new THREE.TubeGeometry(curve, 140, 0.022, 5, false)),
      glowMat(i % 2 === 0 ? preset.primary : preset.secondary, light ? 0.7 : 0.6),
    ));
    const packet = addSprite(preset.accent, 0.4, light ? 1.0 : 0.95);
    group.add(packet);
    const speed = 0.055 + i * 0.009;
    updaters.push((t) => {
      packet.position.copy(curve.getPointAt((t * speed + i * 0.14) % 1));
    });
  }
  for (let i = 0; i < 4; i++) {
    const arc = new THREE.Mesh(
      trackGeo(geos, new THREE.TorusGeometry(4.2 - i * 0.5, 0.014, 8, 110, Math.PI * 1.35)),
      glowMat(preset.secondary, light ? 0.55 : 0.4),
    );
    arc.rotation.z = Math.PI * 0.2 + i * 0.22;
    arc.position.z = -2 - i * 0.7;
    group.add(arc);
  }
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.18) * 0.18;
    group.rotation.x = Math.sin(t * 0.14) * 0.08;
  });
}

function buildLedgerCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const panels: Array<{ panel: THREE.Group; baseY: number }> = [];
  const base = light ? 0x0f172a : 0x0a1324;
  for (let i = 0; i < 9; i++) {
    const w = 2.0 + (i % 2) * 0.7;
    const h = 1.2 + (i % 3) * 0.25;
    const planeGeo = trackGeo(geos, new THREE.PlaneGeometry(w, h));
    const panel = new THREE.Group();
    panel.add(new THREE.Mesh(
      planeGeo,
      trackMat(mats, new THREE.MeshBasicMaterial({
        color: preset.primary, transparent: true, opacity: light ? 0.25 : 0.1,
        side: THREE.DoubleSide, depthWrite: false,
      })),
    ));
    panel.add(new THREE.LineSegments(trackGeo(geos, new THREE.EdgesGeometry(planeGeo)),
      lineMat(preset.accent, light ? 0.55 : 0.4)));
    const miniPoints: THREE.Vector3[] = [];
    for (let k = 0; k <= 10; k++) {
      const p = k / 10;
      miniPoints.push(new THREE.Vector3(-w * 0.45 + p * w * 0.9, Math.sin(p * Math.PI * 2.4 + i) * h * 0.25, 0.01));
    }
    panel.add(new THREE.Line(trackGeo(geos, new THREE.BufferGeometry().setFromPoints(miniPoints)),
      lineMat(preset.secondary, light ? 0.65 : 0.6)));
    const col = i % 3;
    const row = Math.floor(i / 3);
    panel.position.set((col - 1) * 3.2 + (row % 2) * 0.5, (1 - row) * 2.4 + (col % 2) * 0.4, -row * 1.6 - col * 0.5);
    panel.rotation.set(-0.22 + row * 0.14, (col - 1) * 0.32, (col - 1) * 0.08);
    group.add(panel);
    panels.push({ panel, baseY: panel.position.y });
  }
  const linkPoints: number[] = [];
  for (let i = 0; i < panels.length - 1; i++) {
    linkPoints.push(
      panels[i].panel.position.x, panels[i].panel.position.y, panels[i].panel.position.z,
      panels[i + 1].panel.position.x, panels[i + 1].panel.position.y, panels[i + 1].panel.position.z,
    );
  }
  const linkGeo = trackGeo(geos, new THREE.BufferGeometry());
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPoints, 3));
  group.add(new THREE.LineSegments(linkGeo, lineMat(preset.primary, light ? 0.5 : 0.3)));
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.17) * 0.18;
    group.rotation.x = Math.sin(t * 0.13) * 0.08;
    panels.forEach(({ panel, baseY }, i) => {
      panel.position.y = baseY + Math.sin(t * 0.9 + i * 0.9) * 0.16;
      panel.rotation.z = Math.sin(t * 0.45 + i) * 0.04;
    });
  });
}

function buildBroadcastCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const base = light ? 0x0f172a : 0x0a1324;
  const core = new THREE.Mesh(
    trackGeo(geos, new THREE.SphereGeometry(1.9, 26, 18)),
    trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: light ? darken(preset.primary, 0.5) : preset.primary,
      emissiveIntensity: light ? 1.1 : 1.2,
      metalness: 0.6,
      roughness: 0.25,
      transparent: true,
      opacity: light ? 0.3 : 0.12,
    })),
  );
  group.add(core);
  group.add(new THREE.LineSegments(
    trackGeo(geos, new THREE.WireframeGeometry(core.geometry as THREE.BufferGeometry)),
    lineMat(preset.accent, light ? 0.6 : 0.5),
  ));
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      trackGeo(geos, new THREE.TorusGeometry(2.5 + i * 0.7, 0.014, 8, 140)),
      glowMat(i === 0 ? preset.accent : preset.secondary, light ? 0.65 : (0.5 - i * 0.08)),
    );
    ring.rotation.x = Math.PI / 2.2;
    ring.rotation.y = i * 0.4;
    group.add(ring);
    const phase = i * 0.9;
    updaters.push((t) => {
      ring.scale.setScalar(1 + Math.sin(t * 1.3 + phase) * 0.06);
      ring.rotation.z = t * 0.11;
    });
  }
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = t * 0.12;
    group.rotation.x = Math.sin(t * 0.18) * 0.1;
    core.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04);
  });
}

function buildNetworkCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const layout: Array<[number, number, number]> = [
    [-4.1, 1.9, 0], [-1.9, 3.0, -0.8], [0.8, 2.0, 0.6], [3.4, 2.8, -0.5],
    [-3.3, -1.2, 0.7], [-0.3, -0.4, -0.3], [2.4, -1.6, 0.8], [4.2, 0.3, -0.7],
    [-1.2, -2.9, 0.3], [1.6, -3.1, -0.7], [-0.4, 0.6, 1.2], [3.0, -1.0, 1.0],
  ];
  const base = light ? 0x0f172a : 0x0a1324;
  const nodes: THREE.Mesh[] = [];
  const nodeGeo = trackGeo(geos, new THREE.BoxGeometry(0.5, 0.5, 0.5));
  const nodeMat = trackMat(mats, new THREE.MeshStandardMaterial({
    color: base,
    emissive: preset.secondary,
    emissiveIntensity: light ? 1.1 : 1.2,
    metalness: 0.6,
    roughness: 0.25,
  }));
  layout.forEach(([x, y, z], i) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(i * 0.22, i * 0.38, i * 0.16);
    group.add(mesh);
    nodes.push(mesh);
  });
  const links: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [2, 5], [4, 8], [8, 9], [9, 6], [1, 5], [3, 7],
    [10, 11], [10, 2], [11, 7], [0, 10], [3, 11],
  ];
  const linePositions: number[] = [];
  for (const [a, b] of links) {
    linePositions.push(layout[a][0], layout[a][1], layout[a][2], layout[b][0], layout[b][1], layout[b][2]);
  }
  const lineGeo = trackGeo(geos, new THREE.BufferGeometry());
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  group.add(new THREE.LineSegments(lineGeo, lineMat(preset.accent, light ? 0.55 : 0.4)));
  for (let i = 0; i < Math.min(8, links.length); i++) {
    const [a, b] = links[i];
    const start = new THREE.Vector3(...layout[a]);
    const end = new THREE.Vector3(...layout[b]);
    const sprite = addSprite(preset.accent, 0.4, light ? 1.0 : 0.95);
    group.add(sprite);
    updaters.push((t) => {
      const p = (t * 0.24 + i * 0.19) % 1;
      sprite.position.lerpVectors(start, end, p);
    });
  }
  const ring = new THREE.Mesh(
    trackGeo(geos, new THREE.TorusGeometry(3.2, 0.014, 8, 150)),
    glowMat(preset.secondary, light ? 0.55 : 0.4),
  );
  ring.rotation.x = Math.PI / 2.4;
  group.add(ring);
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.18) * 0.34;
    group.rotation.x = Math.sin(t * 0.14) * 0.12;
    nodes.forEach((node, i) => {
      node.rotation.x = t * 0.14 + i * 0.3;
      node.rotation.y = t * 0.11 + i * 0.45;
    });
  });
}

function buildGlobeCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const radius = 3.1;
  const base = light ? 0x0f172a : 0x081020;
  const sphere = new THREE.Mesh(
    trackGeo(geos, new THREE.SphereGeometry(radius, 30, 20)),
    trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: light ? darken(preset.primary, 0.5) : preset.primary,
      emissiveIntensity: light ? 1.1 : 1.3,
      metalness: 0.6,
      roughness: 0.25,
      transparent: true,
      opacity: light ? 0.25 : 0.15,
    })),
  );
  group.add(sphere);
  group.add(new THREE.LineSegments(
    trackGeo(geos, new THREE.WireframeGeometry(sphere.geometry as THREE.BufferGeometry)),
    lineMat(preset.primary, light ? 0.55 : 0.3),
  ));
  for (let k = 1; k <= 6; k++) {
    const y = -radius + (2 * radius * k) / 7;
    const r = Math.sqrt(Math.max(0.0001, radius * radius - y * y));
    const ring = new THREE.Mesh(
      trackGeo(geos, new THREE.TorusGeometry(r, 0.01, 6, 120)),
      glowMat(preset.secondary, light ? 0.55 : 0.4),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  }
  for (let i = 0; i < 9; i++) {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * TAU;
    const a = new THREE.Vector3().setFromSphericalCoords(radius, theta, phi);
    const theta2 = Math.acos(2 * Math.random() - 1);
    const phi2 = Math.random() * TAU;
    const b = new THREE.Vector3().setFromSphericalCoords(radius, theta2, phi2);
    const mid = a.clone().add(b).normalize().multiplyScalar(radius * 1.35);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    group.add(new THREE.Mesh(
      trackGeo(geos, new THREE.TubeGeometry(curve, 40, 0.014, 5, false)),
      glowMat(preset.accent, light ? 0.7 : 0.6),
    ));
    const packet = addSprite(preset.accent, 0.34, light ? 1.0 : 0.9);
    group.add(packet);
    updaters.push((t) => {
      packet.position.copy(curve.getPointAt((t * 0.08 + i * 0.13) % 1));
    });
  }
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = t * 0.14;
    group.rotation.x = Math.sin(t * 0.2) * 0.14;
  });
}

function buildInfinityCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const controlPoints: THREE.Vector3[] = [];
  const segments = 200;
  for (let i = 0; i < segments; i++) {
    const u = (i / segments) * TAU;
    const d = 1 + Math.sin(u) * Math.sin(u);
    controlPoints.push(new THREE.Vector3(
      (Math.cos(u) * 3.4) / d,
      (Math.sin(u) * Math.cos(u) * 3.4) / d,
      Math.sin(u * 2) * 0.7,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.5);
  const base = light ? 0x0f172a : 0x0a1020;
  const body = new THREE.Mesh(
    trackGeo(geos, new THREE.TubeGeometry(curve, 240, 0.16, 9, true)),
    trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: light ? darken(preset.primary, 0.5) : preset.primary,
      emissiveIntensity: light ? 1.1 : 0.9,
      metalness: 0.72,
      roughness: 0.2,
    })),
  );
  group.add(body);
  group.add(new THREE.Mesh(
    trackGeo(geos, new THREE.TubeGeometry(curve, 240, 0.24, 9, true)),
    glowMat(preset.secondary, light ? 0.45 : 0.1),
  ));
  group.add(new THREE.Mesh(
    trackGeo(geos, new THREE.TubeGeometry(curve, 220, 0.045, 7, true)),
    glowMat(preset.accent, light ? 0.85 : 0.7),
  ));
  const beads: THREE.Mesh[] = [];
  const beadGeo = trackGeo(geos, new THREE.SphereGeometry(0.14, 12, 10));
  const beadMat = glowMat(preset.accent, light ? 0.9 : 0.7);
  for (let i = 0; i < 9; i++) {
    const bead = new THREE.Mesh(beadGeo, beadMat);
    group.add(bead);
    beads.push(bead);
  }
  const ringGeo = trackGeo(geos, new THREE.TorusGeometry(4.2, 0.014, 8, 170));
  const ringA = new THREE.Mesh(ringGeo, glowMat(preset.secondary, light ? 0.5 : 0.25));
  ringA.rotation.x = Math.PI / 2.5;
  group.add(ringA);
  const ringB = new THREE.Mesh(ringGeo, glowMat(preset.primary, light ? 0.5 : 0.22));
  ringB.rotation.y = Math.PI / 3;
  ringB.rotation.z = Math.PI / 5;
  group.add(ringB);
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = t * 0.13;
    group.rotation.x = Math.sin(t * 0.24) * 0.24;
    ringA.rotation.z = t * -0.18;
    ringB.rotation.x = t * 0.14;
    for (let i = 0; i < beads.length; i++) {
      beads[i].position.copy(curve.getPointAt((t * 0.07 + i / beads.length) % 1));
    }
  });
}

function buildWaveCore(ctx: BuildCtx) {
  const { world, preset, light, updaters, geos, mats } = ctx;
  const group = new THREE.Group();
  const base = light ? 0x0f172a : 0x0a1324;
  const core = new THREE.Mesh(
    trackGeo(geos, new THREE.IcosahedronGeometry(1.5, 2)),
    trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: light ? darken(preset.secondary, 0.5) : preset.secondary,
      emissiveIntensity: light ? 1.1 : 1.4,
      metalness: 0.68,
      roughness: 0.22,
    })),
  );
  group.add(core);
  group.add(new THREE.LineSegments(trackGeo(geos, new THREE.EdgesGeometry(core.geometry as THREE.BufferGeometry)),
    lineMat(preset.accent, light ? 0.65 : 0.6)));
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(
      trackGeo(geos, new THREE.TorusGeometry(2.2 + i * 0.7, 0.014, 8, 150)),
      glowMat(i % 2 === 0 ? preset.primary : preset.secondary, light ? 0.6 : (0.5 - i * 0.07)),
    );
    ring.rotation.x = Math.PI / 2.4;
    ring.rotation.y = i * 0.35;
    group.add(ring);
    const phase = i * 0.7;
    updaters.push((t) => {
      const scale = 1 + Math.sin(t * 1.2 + phase) * 0.07;
      ring.scale.setScalar(scale);
      ring.rotation.z = t * (0.11 + i * 0.035);
    });
  }
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    points.push(new THREE.Vector3(-5.2 + p * 10.4, Math.sin(p * Math.PI * 10) * 0.85, 0));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  group.add(new THREE.Mesh(
    trackGeo(geos, new THREE.TubeGeometry(curve, 160, 0.045, 6, false)),
    glowMat(preset.accent, light ? 0.95 : 0.9),
  ));
  const barGeo = trackGeo(geos, new THREE.BoxGeometry(0.12, 1, 0.12));
  const bars: THREE.Mesh[] = [];
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * TAU;
    const bar = new THREE.Mesh(barGeo, glowMat(i % 3 === 0 ? preset.accent : preset.secondary, light ? 0.7 : 0.6));
    bar.position.set(Math.cos(angle) * 4.0, Math.sin(angle) * 4.0, -0.8);
    bar.rotation.z = angle - Math.PI / 2;
    group.add(bar);
    bars.push(bar);
  }
  world.add(group);
  updaters.push((t) => {
    group.rotation.y = Math.sin(t * 0.2) * 0.2;
    group.rotation.z = Math.sin(t * 0.16) * 0.06;
    bars.forEach((bar, i) => {
      bar.scale.y = 0.6 + Math.abs(Math.sin(t * 1.8 + i * 0.45)) * 1.7;
    });
  });
}

const CORE_BUILDERS: Record<string, (ctx: BuildCtx) => void> = {
  sphere: buildSphereCore,
  shield: buildShieldCore,
  helix: buildHelixCore,
  gear: buildGearCore,
  chart: buildChartCore,
  timeline: buildTimelineCore,
  ledger: buildLedgerCore,
  broadcast: buildBroadcastCore,
  network: buildNetworkCore,
  globe: buildGlobeCore,
  infinity: buildInfinityCore,
  wave: buildWaveCore,
  prism: buildShieldCore,
};

/* -------------------------------------------------------------------------- */
/*  Couches partagées — denses et visibles                                    */
/* -------------------------------------------------------------------------- */

function buildParticleField(ctx: BuildCtx) {
  const { world, preset, light, mobile, updaters, geos, mats } = ctx;
  const centerCount = mobile ? Math.floor(preset.particleCount * 0.5) : preset.particleCount;
  const sideCount = mobile ? Math.floor(preset.sideParticleCount * 0.5) : preset.sideParticleCount;

  const positions = new Float32Array((centerCount + sideCount * 2) * 3);
  const speeds = new Float32Array(centerCount + sideCount * 2);
  const types = new Float32Array(centerCount + sideCount * 2); // 0=center, 1=left, 2=right

  let idx = 0;
  // Center field: subtle, drifting upward, some crossing the middle zone
  for (let i = 0; i < centerCount; i++) {
    positions[idx] = (Math.random() - 0.5) * 22;
    positions[idx + 1] = (Math.random() - 0.5) * 14;
    positions[idx + 2] = (Math.random() - 0.5) * 12 - 1;
    speeds[idx] = 0.1 + Math.random() * 0.4;
    types[idx] = 0;
    idx++;
  }
  // Left side field: particles drifting slowly toward center then across
  for (let i = 0; i < sideCount; i++) {
    positions[idx] = -13 - Math.random() * 6;
    positions[idx + 1] = (Math.random() - 0.5) * 16;
    positions[idx + 2] = (Math.random() - 0.5) * 14 - 2;
    speeds[idx] = 0.08 + Math.random() * 0.35;
    types[idx] = 1;
    idx++;
  }
  // Right side field
  for (let i = 0; i < sideCount; i++) {
    positions[idx] = 13 + Math.random() * 6;
    positions[idx + 1] = (Math.random() - 0.5) * 16;
    positions[idx + 2] = (Math.random() - 0.5) * 14 - 2;
    speeds[idx] = 0.08 + Math.random() * 0.35;
    types[idx] = 2;
    idx++;
  }

  const geo = trackGeo(geos, new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = trackMat(mats, new THREE.PointsMaterial({
    color: preset.accent,
    size: light ? 0.07 : 0.06,
    map: undefined,
    transparent: true,
    opacity: light ? 0.55 : 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  }));
  const points = new THREE.Points(geo, mat);
  world.add(points);
  const halfY = 9;
  updaters.push((t) => {
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < positions.length / 3; i++) {
      arr[i * 3 + 1] += speeds[i] * 0.016;
      if (types[i] === 1) {
        arr[i * 3] += speeds[i] * 0.12;
        if (arr[i * 3] > 14) arr[i * 3] = -14;
      } else if (types[i] === 2) {
        arr[i * 3] -= speeds[i] * 0.12;
        if (arr[i * 3] < -14) arr[i * 3] = 14;
      }
      if (arr[i * 3 + 1] > halfY) arr[i * 3 + 1] = -halfY;
    }
    attr.needsUpdate = true;
    points.rotation.y = t * 0.01;
  });
}

function connectNodes(ctx: BuildCtx, group: THREE.Group, positions: THREE.Vector3[], preset: VARIANTConfigValue, light: boolean, geos: THREE.BufferGeometry[], mats: THREE.Material[]) {
  const linePositions: number[] = [];
  const connectDist = 5.2;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i].distanceTo(positions[j]) < connectDist) {
        linePositions.push(positions[i].x, positions[i].y, positions[i].z, positions[j].x, positions[j].y, positions[j].z);
      }
    }
  }
  if (linePositions.length > 0) {
    const lineGeo = trackGeo(geos, new THREE.BufferGeometry());
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    group.add(new THREE.LineSegments(lineGeo, lineMat(preset.accent, light ? 0.38 : 0.2)));
  }
}

/* -------------------------------------------------------------------------- */
/*  Composant                                                                 */
/* -------------------------------------------------------------------------- */

export const Secondary3DDecor: React.FC<Secondary3DDecorProps> = ({
  variant = 'workflow',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) { setSupported(false); return; }
    } catch {
      setSupported(false);
      return;
    }

    const mobile = window.innerWidth < 768;
    const light = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 140);
    camera.position.set(0, 0, 13);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.0 : 1.25));
    if (light) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
    }
    container.appendChild(renderer.domElement);

    const amb = new THREE.AmbientLight(0xffffff, light ? 0.85 : 0.45);
    scene.add(amb);
    const keyLight = new THREE.PointLight(0xffffff, light ? 2.0 : 1.2, 70);
    keyLight.position.set(7, 8, 7);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x22d3ee, light ? 1.2 : 1.8, 70);
    fillLight.position.set(-8, -4, 6);
    scene.add(fillLight);

    const preset = VARIANT_CONFIG[variant];
    const world = new THREE.Group();
    scene.add(world);
    world.scale.setScalar(mobile ? 0.95 : 1.35);

    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const updaters: Array<(t: number, dt: number) => void> = [];

    const ctx: BuildCtx = {
      world,
      preset,
      mobile,
      light,
      updaters,
      geos,
      mats,
    };

    const buildCore = CORE_BUILDERS[preset.core] ?? CORE_BUILDERS.infinity;
    buildCore(ctx);

    const nodeCount = mobile ? Math.floor(preset.nodeCount * 0.6) : preset.nodeCount;
    const nodePositions: THREE.Vector3[] = [];
    const nodeGroup = new THREE.Group();
    const base = light ? 0x0f172a : 0x0a1324;
    const nodeGeo = trackGeo(geos, new THREE.IcosahedronGeometry(light ? 0.1 : 0.08, 0));
    const nodeMat = trackMat(mats, new THREE.MeshStandardMaterial({
      color: base,
      emissive: preset.secondary,
      emissiveIntensity: light ? 1.1 : 1.1,
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: light ? 0.9 : 0.65,
    }));
    for (let i = 0; i < nodeCount; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
      );
      nodePositions.push(v);
      const m = new THREE.Mesh(nodeGeo, nodeMat);
      m.position.copy(v);
      m.scale.setScalar(light ? 1.25 : 1);
      nodeGroup.add(m);
    }
    connectNodes(ctx, nodeGroup, nodePositions, preset, light, geos, mats);
    world.add(nodeGroup);

    buildParticleField(ctx);

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf: number | null = null;
    let visible = true;
    let lastTime = performance.now();
    let elapsed = 0;

    const getDelta = () => {
      const now = performance.now();
      const d = (now - lastTime) / 1000;
      lastTime = now;
      return Math.min(Math.max(d, 0), 0.05);
    };

    const draw = () => {
      renderer.render(scene, camera);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) { getDelta(); return; }
      const delta = getDelta();
      elapsed += delta;
      for (const upd of updaters) upd(elapsed, delta);
      draw();
    };

    if (reduceMotion) draw();
    else { animate(); }

    let io: IntersectionObserver | null = null;
    if (!reduceMotion && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (!e) return;
        visible = e.isIntersecting;
        if (visible) lastTime = performance.now();
      }, { threshold: 0.01 });
      io.observe(container);
    }

    let resizeFrame: number | null = null;
    const applySize = () => {
      resizeFrame = null;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (reduceMotion) draw();
    };
    const scheduleResize = () => {
      if (resizeFrame !== null) return;
      resizeFrame = window.requestAnimationFrame(applySize);
    };
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(scheduleResize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', scheduleResize);
    }

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      io?.disconnect();
      ro?.disconnect();
      window.removeEventListener('resize', scheduleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  if (!supported) return null;

  return (
    <div ref={containerRef} className={`pointer-events-none ${className}`} aria-hidden="true" />
  );
};

export default Secondary3DDecor;
