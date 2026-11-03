import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type Variant =
  | 'chart' | 'markets' | 'news' | 'academy' | 'jyntrack' | 'risk'
  | 'backtest' | 'journal' | 'workflow' | 'settings' | 'workspace'
  | 'auth' | 'lynara' | 'about' | 'default';

interface PageBackground3DProps {
  variant: Variant;
  className?: string;
}

const PALETTES: Record<Variant, { main: number; accent: number; particle: number; glow: number }> = {
  chart: { main: 0x22d3ee, accent: 0xf97316, particle: 0x22d3ee, glow: 0x3b82f6 },
  markets: { main: 0x3b82f6, accent: 0x22d3ee, particle: 0x3b82f6, glow: 0x06b6d4 },
  news: { main: 0x10b981, accent: 0x22d3ee, particle: 0x10b981, glow: 0x34d399 },
  academy: { main: 0xa78bfa, accent: 0x22d3ee, particle: 0xa78bfa, glow: 0xc4b5fd },
  jyntrack: { main: 0xf97316, accent: 0x22d3ee, particle: 0xf97316, glow: 0xfb923c },
  risk: { main: 0xef4444, accent: 0xf97316, particle: 0xef4444, glow: 0xf87171 },
  backtest: { main: 0x8b5cf6, accent: 0x22d3ee, particle: 0x8b5cf6, glow: 0xa78bfa },
  journal: { main: 0xfbbf24, accent: 0x22d3ee, particle: 0xfbbf24, glow: 0xfcd34d },
  workflow: { main: 0x06b6d4, accent: 0xf97316, particle: 0x06b6d4, glow: 0x22d3ee },
  settings: { main: 0x64748b, accent: 0x22d3ee, particle: 0x64748b, glow: 0x94a3b8 },
  workspace: { main: 0xf97316, accent: 0x22d3ee, particle: 0xf97316, glow: 0xfb923c },
  auth: { main: 0x3b82f6, accent: 0x22d3ee, particle: 0x3b82f6, glow: 0x60a5fa },
  lynara: { main: 0x06b6d4, accent: 0xa78bfa, particle: 0x06b6d4, glow: 0x22d3ee },
  about: { main: 0x22d3ee, accent: 0xa78bfa, particle: 0x22d3ee, glow: 0x67e8f9 },
  default: { main: 0x22d3ee, accent: 0xf97316, particle: 0x22d3ee, glow: 0x38bdf8 },
};

export const PageBackground3D: React.FC<PageBackground3DProps> = ({ variant, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      const c = document.createElement('canvas');
      gl = (c.getContext('webgl') || c.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (!gl) { setSupported(false); return; }
    } catch {
      setSupported(false);
      return;
    }

    const mobile = window.innerWidth < 768;
    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const pal = PALETTES[variant] || PALETTES.default;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a12, mobile ? 0.05 : 0.04);

    const baseCameraZ = mobile ? 19 : 14;
    const camera = new THREE.PerspectiveCamera(mobile ? 60 : 55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, baseCameraZ);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile, powerPreference: mobile ? 'low-power' : 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(amb);
    const pl1 = new THREE.PointLight(pal.glow, 2.5, 60);
    pl1.position.set(8, 6, 8);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(pal.accent, 2, 60);
    pl2.position.set(-8, -4, 6);
    scene.add(pl2);
    const pl3 = new THREE.PointLight(0xffffff, 1.2, 40);
    pl3.position.set(0, 0, -10);
    scene.add(pl3);

    const root = new THREE.Group();
    scene.add(root);

    // ---- Meta identity: infinity-inspired torus knot cluster ----
    const knotGroup = new THREE.Group();
    root.add(knotGroup);
    const knot1 = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.6, 0.42, 140, 16, 2, 3),
      new THREE.MeshBasicMaterial({ color: pal.main, wireframe: true, transparent: true, opacity: 0.28 })
    );
    knot1.position.set(5, 2, -6);
    knotGroup.add(knot1);
    const knot2 = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.0, 0.28, 100, 12, 3, 2),
      new THREE.MeshBasicMaterial({ color: pal.accent, wireframe: true, transparent: true, opacity: 0.22 })
    );
    knot2.position.set(-6, -2, -8);
    knotGroup.add(knot2);

    // ---- Neural network ----
    const netGroup = new THREE.Group();
    root.add(netGroup);
    const nodeCount = mobile ? 28 : 52;
    const nodes: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const r = 7 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const p = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.6,
        r * Math.cos(phi) - 4
      );
      nodes.push(p);
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(mobile ? 0.05 : 0.07, 8, 8),
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? pal.accent : pal.main, transparent: true, opacity: 0.7 })
      );
      m.position.copy(p);
      netGroup.add(m);
      nodeMeshes.push(m);
    }
    // connections
    const connPts: number[] = [];
    const threshold = mobile ? 4.2 : 3.6;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < threshold) {
          connPts.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    }
    const connGeo = new THREE.BufferGeometry();
    connGeo.setAttribute('position', new THREE.Float32BufferAttribute(connPts, 3));
    const connMat = new THREE.LineBasicMaterial({ color: pal.main, transparent: true, opacity: 0.30 });
    const connLines = new THREE.LineSegments(connGeo, connMat);
    netGroup.add(connLines);

    // ---- Particle field with depth ----
    const pCount = mobile ? 350 : 900;
    const pPos = new Float32Array(pCount * 3);
    const pSizes = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 40;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 26;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
      pSizes[i] = Math.random() * 1.5 + 0.5;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: pal.particle, size: mobile ? 0.025 : 0.035, transparent: true, opacity: 0.75, sizeAttenuation: true });
    const particles = new THREE.Points(pGeo, pMat);
    root.add(particles);

    // ---- Filaments (luminous curves) ----
    const filamentGroup = new THREE.Group();
    root.add(filamentGroup);
    for (let f = 0; f < (mobile ? 4 : 8); f++) {
      const pts: THREE.Vector3[] = [];
      const segs = 40;
      const baseAngle = (f / 8) * Math.PI * 2;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const angle = baseAngle + t * Math.PI * 2;
        const radius = 4 + Math.sin(t * Math.PI * 3) * 1.5;
        pts.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(t * Math.PI * 2) * 2.5,
          Math.sin(angle) * radius - 3
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: f % 2 ? pal.accent : pal.main, transparent: true, opacity: 0.40 }));
      filamentGroup.add(line);
    }

    // ---- Variant-specific structures ----
    const vGroup = new THREE.Group();
    root.add(vGroup);

    switch (variant) {
      case 'chart': {
        const candles = new THREE.Group();
        for (let i = 0; i < 22; i++) {
          const x = (i - 11) * 0.85;
          const h = 0.4 + Math.random() * 1.8;
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, h, 0.14),
            new THREE.MeshStandardMaterial({ color: i % 2 ? 0x10b981 : 0xef4444, emissive: i % 2 ? 0x10b981 : 0xef4444, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 })
          );
          m.position.set(x, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2);
          candles.add(m);
        }
        vGroup.add(candles);
        // trend lines
        for (let l = 0; l < 3; l++) {
          const pts: THREE.Vector3[] = [];
          for (let i = 0; i < 24; i++) pts.push(new THREE.Vector3((i - 12) * 0.7, Math.sin(i * 0.45 + l) * 1.6 + l * 0.6, (Math.random() - 0.5) * 1.5));
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.3 }));
          vGroup.add(line);
        }
        break;
      }
      case 'markets': {
        const globe = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 24), new THREE.MeshBasicMaterial({ color: pal.main, wireframe: true, transparent: true, opacity: 0.30 }));
        vGroup.add(globe);
        const inner = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.MeshBasicMaterial({ color: pal.accent, wireframe: true, transparent: true, opacity: 0.22 }));
        vGroup.add(inner);
        const nodes = new THREE.Group();
        for (let i = 0; i < 24; i++) {
          const phi = Math.acos(-1 + (2 * i) / 24);
          const theta = Math.sqrt(24 * Math.PI) * phi;
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: pal.accent }));
          m.position.set(2.6 * Math.cos(theta) * Math.sin(phi), 2.6 * Math.sin(theta) * Math.sin(phi), 2.6 * Math.cos(phi));
          nodes.add(m);
        }
        vGroup.add(nodes);
        // connection arcs
        for (let a = 0; a < 8; a++) {
          const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
            new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
            new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5)
          );
          const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
          const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: pal.main, transparent: true, opacity: 0.35 }));
          vGroup.add(line);
        }
        break;
      }
      case 'news': {
        const flow = new THREE.Group();
        for (let i = 0; i < (mobile ? 18 : 36); i++) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: i % 2 ? pal.accent : pal.main, transparent: true, opacity: 0.45 }));
          m.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6 - 2);
          flow.add(m);
        }
        vGroup.add(flow);
        // holographic panels
        for (let p = 0; p < 4; p++) {
          const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshBasicMaterial({ color: pal.main, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
          plane.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 3);
          plane.rotation.set(Math.random() * 0.6, Math.random() * 0.6, 0);
          vGroup.add(plane);
        }
        break;
      }
      case 'academy': {
        const nodes = new THREE.Group();
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), new THREE.MeshBasicMaterial({ color: pal.main, transparent: true, opacity: 0.755 }));
          m.position.set(Math.cos(a) * 3, Math.sin(a * 2) * 1.0, Math.sin(a) * 3 - 2);
          nodes.add(m);
        }
        vGroup.add(nodes);
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.015, 8, 80), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.22 }));
        ring1.rotation.x = Math.PI / 2;
        vGroup.add(ring1);
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.012, 8, 80), new THREE.MeshBasicMaterial({ color: pal.main, transparent: true, opacity: 0.32 }));
        ring2.rotation.x = Math.PI / 3;
        vGroup.add(ring2);
        break;
      }
      case 'jyntrack': {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < 40; i++) pts.push(new THREE.Vector3((i - 20) * 0.4, Math.sin(i * 0.35) * 1.8 + i * 0.04, Math.cos(i * 0.2) * 0.6));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: pal.main, transparent: true, opacity: 0.45 }));
        vGroup.add(line);
        // fan
        for (let s = 0; s < 6; s++) {
          const fpts: THREE.Vector3[] = [];
          for (let i = 0; i < 20; i++) fpts.push(new THREE.Vector3(8 + (i - 10) * 0.3, (s - 3) * 0.6 + Math.sin(i * 0.5) * 0.4, Math.cos(s) * 0.8));
          const fgeo = new THREE.BufferGeometry().setFromPoints(fpts);
          const fline = new THREE.Line(fgeo, new THREE.LineBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.40 }));
          vGroup.add(fline);
        }
        const pts2 = new THREE.Group();
        for (let i = 0; i < 10; i++) {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: pal.accent }));
          m.position.set((i - 5) * 1.3, Math.sin(i * 0.8) * 1.3, 0);
          pts2.add(m);
        }
        vGroup.add(pts2);
        break;
      }
      case 'risk': {
        const shield = new THREE.Mesh(new THREE.OctahedronGeometry(1.8, 1), new THREE.MeshBasicMaterial({ color: pal.main, wireframe: true, transparent: true, opacity: 0.22 }));
        vGroup.add(shield);
        for (let i = 0; i < 4; i++) {
          const r = new THREE.Mesh(new THREE.TorusGeometry(2.2 + i * 0.35, 0.012, 8, 72), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.36 }));
          r.rotation.x = Math.PI / 2 + i * 0.3;
          r.rotation.y = i * 0.4;
          vGroup.add(r);
        }
        // warning grid
        const grid = new THREE.Mesh(new THREE.PlaneGeometry(6, 6, 12, 12), new THREE.MeshBasicMaterial({ color: pal.main, wireframe: true, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
        grid.rotation.x = -Math.PI / 3;
        vGroup.add(grid);
        break;
      }
      case 'backtest': {
        const bars = new THREE.Group();
        for (let i = 0; i < 24; i++) {
          const h = 0.3 + Math.random() * 2.2;
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, 0.18), new THREE.MeshStandardMaterial({ color: pal.main, emissive: pal.main, emissiveIntensity: 0.25, transparent: true, opacity: 0.45 }));
          m.position.set((i - 12) * 0.55, h / 2 - 0.8, (Math.random() - 0.5) * 2);
          bars.add(m);
        }
        vGroup.add(bars);
        // equity curve
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < 30; i++) pts.push(new THREE.Vector3((i - 15) * 0.45, Math.sin(i * 0.3) * 1.0 + i * 0.06, 0));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.4 }));
        vGroup.add(line);
        break;
      }
      case 'journal': {
        const nodes = new THREE.Group();
        for (let i = 0; i < 16; i++) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshBasicMaterial({ color: pal.main, transparent: true, opacity: 0.4 }));
          m.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5 - 2);
          m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
          nodes.add(m);
        }
        vGroup.add(nodes);
        // timeline line
        const tpts: THREE.Vector3[] = [];
        for (let i = 0; i < 12; i++) tpts.push(new THREE.Vector3(-6 + i * 1.1, Math.sin(i * 0.5) * 0.6, -2));
        const tgeo = new THREE.BufferGeometry().setFromPoints(tpts);
        const tline = new THREE.Line(tgeo, new THREE.LineBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.25 }));
        vGroup.add(tline);
        break;
      }
      case 'workflow': {
        const nodes = new THREE.Group();
        const positions: THREE.Vector3[] = [];
        for (let i = 0; i < 7; i++) {
          const p = new THREE.Vector3((i - 3) * 1.9, Math.sin(i * 0.9) * 0.8, (i % 2) * 0.6 - 0.3);
          positions.push(p);
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({ color: pal.main, emissive: pal.main, emissiveIntensity: 0.4, transparent: true, opacity: 0.7 }));
          m.position.copy(p);
          nodes.add(m);
        }
        for (let i = 1; i < positions.length; i++) {
          const geo = new THREE.BufferGeometry().setFromPoints([positions[i - 1], positions[i]]);
          const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.35 }));
          nodes.add(l);
        }
        vGroup.add(nodes);
        // data pulses
        for (let d = 0; d < 5; d++) {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: pal.accent }));
          m.position.set((d - 2) * 1.5, 0, 0);
          vGroup.add(m);
        }
        break;
      }
      case 'settings': {
        const geo = new THREE.IcosahedronGeometry(1.6, 1);
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: pal.main, wireframe: true, transparent: true, opacity: 0.40 }));
        vGroup.add(mesh);
        for (let i = 0; i < 3; i++) {
          const r = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * 0.4, 0.012, 8, 72), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.32 }));
          r.rotation.x = Math.PI / 2 + i * 0.5;
          r.rotation.y = i * 0.7;
          vGroup.add(r);
        }
        // circuit lines
        const cpts: number[] = [];
        for (let i = 0; i < 20; i++) {
          cpts.push((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 2);
        }
        // not used as points; add small cubes instead
        for (let i = 0; i < 12; i++) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: pal.main, transparent: true, opacity: 0.3 }));
          m.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 2);
          vGroup.add(m);
        }
        break;
      }
      case 'workspace': {
        const bars = new THREE.Group();
        for (let i = 0; i < 12; i++) {
          const h = 0.5 + Math.random() * 2.4;
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, h, 0.22), new THREE.MeshStandardMaterial({ color: pal.main, emissive: pal.main, emissiveIntensity: 0.2, transparent: true, opacity: 0.4 }));
          m.position.set((i - 6) * 0.75, h / 2, (Math.random() - 0.5) * 2);
          bars.add(m);
        }
        vGroup.add(bars);
        // rings
        const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.012, 8, 80), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.30 }));
        ring.rotation.x = Math.PI / 2;
        vGroup.add(ring);
        break;
      }
      case 'auth': {
        // secure network: central lock-ish octahedron + rings
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), new THREE.MeshBasicMaterial({ color: pal.main, wireframe: true, transparent: true, opacity: 0.25 }));
        vGroup.add(core);
        for (let i = 0; i < 3; i++) {
          const r = new THREE.Mesh(new THREE.TorusGeometry(2.0 + i * 0.4, 0.012, 8, 72), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.40 }));
          r.rotation.x = Math.PI / 2 + i * 0.6;
          r.rotation.y = i * 0.5;
          vGroup.add(r);
        }
        // connection nodes
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: pal.particle, transparent: true, opacity: 0.6 }));
          m.position.set(Math.cos(a) * 3.2, Math.sin(a) * 3.2 * 0.5, -1);
          vGroup.add(m);
        }
        break;
      }
      case 'lynara': {
        // holographic avatar rings
        for (let i = 0; i < 5; i++) {
          const r = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i * 0.35, 0.015, 8, 80), new THREE.MeshBasicMaterial({ color: i % 2 ? pal.accent : pal.main, transparent: true, opacity: 0.22 - i * 0.03 }));
          r.rotation.x = Math.PI / 2 + i * 0.4;
          r.rotation.y = i * 0.3;
          vGroup.add(r);
        }
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 16), new THREE.MeshBasicMaterial({ color: pal.main, wireframe: true, transparent: true, opacity: 0.40 }));
        vGroup.add(core);
        // floating particles around
        const lp = new THREE.Group();
        for (let i = 0; i < 20; i++) {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.7 }));
          const a = (i / 20) * Math.PI * 2;
          m.position.set(Math.cos(a) * 2.4, Math.sin(a * 2) * 0.8, Math.sin(a) * 2.4);
          lp.add(m);
        }
        vGroup.add(lp);
        break;
      }
      case 'about': {
        // innovation network: double helix
        for (let strand = 0; strand < 2; strand++) {
          const pts: THREE.Vector3[] = [];
          for (let i = 0; i < 60; i++) {
            const t = i / 60 * Math.PI * 4;
            pts.push(new THREE.Vector3(Math.cos(t) * 2 + strand * 0.3, (i / 60) * 6 - 3, Math.sin(t) * 2));
          }
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: strand ? pal.accent : pal.main, transparent: true, opacity: 0.25 }));
          vGroup.add(line);
        }
        break;
      }
      default:
        break;
    }

    // ---- Animation ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY || 0; };
    window.addEventListener('scroll', onScroll, { passive: true });

    let raf: number | null = null;
    let visible = true;
    let lastTime = performance.now();
    const getDelta = () => {
      const now = performance.now();
      const d = (now - lastTime) / 1000;
      lastTime = now;
      return Math.min(Math.max(d, 0), 0.05);
    };

    const draw = (dt: number) => {
      const t = performance.now() * 0.001;
      // smooth mouse
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      root.rotation.y = t * 0.06 + mouse.x * 0.15;
      root.rotation.x = Math.sin(t * 0.25) * 0.04 + mouse.y * 0.1;
      knotGroup.rotation.x = t * 0.12;
      knotGroup.rotation.y = t * 0.18;
      netGroup.rotation.y = t * 0.05;
      filamentGroup.rotation.y = -t * 0.08;
      vGroup.rotation.y = t * 0.07;
      vGroup.rotation.x = Math.sin(t * 0.2) * 0.05;

      // particle drift
      const arr = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += 0.003;
        if (arr[i] > 13) arr[i] = -13;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = t * 0.04;

      // node pulse
      nodeMeshes.forEach((m, idx) => {
        const s = 1 + Math.sin(t * 1.5 + idx) * 0.15;
        m.scale.setScalar(s);
      });

      // camera parallax + scroll
      const targetZ = baseCameraZ + Math.min(scrollY * 0.002, 4);
      camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 0.8 - (scrollY * 0.001) - camera.position.y) * 0.04;
      camera.position.z += (targetZ - camera.position.z) * 0.04;
      camera.lookAt(0, 0, 0);

      pl1.position.x = 8 + Math.sin(t * 0.7) * 2;
      pl2.position.x = -8 + Math.cos(t * 0.6) * 2;

      renderer.render(scene, camera);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) { getDelta(); return; }
      const dt = getDelta();
      draw(dt);
    };

    if (reduceMotion) {
      draw(0);
    } else {
      animate();
    }

    // Intersection / visibility
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);

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

    const applySize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (reduceMotion) draw(0);
    };
    const onResize = () => applySize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (raf !== null) cancelAnimationFrame(raf);
      io?.disconnect();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat && typeof mat.dispose === 'function') mat.dispose();
      });
      renderer.dispose();
    };
  }, [variant]);

  if (!supported) {
    return (
      <div
        className={`pointer-events-none ${className}`}
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.12), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.10), transparent 55%), #060a12',
        }}
      />
    );
  }

  return <div ref={containerRef} className={`pointer-events-none ${className}`} aria-hidden="true" />;
};

export default PageBackground3D;

