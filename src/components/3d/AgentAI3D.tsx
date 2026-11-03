import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type AgentVariant = 'technical' | 'macro' | 'risk' | 'strategy' | 'redTeam' | 'lead';
type AgentStatus = 'idle' | 'analyzing' | 'completed' | 'error';

interface AgentAI3DProps {
  variant: AgentVariant;
  status: AgentStatus;
  hex: string;
  className?: string;
}

const PARTICLE_COUNT_DESKTOP = 90;
const PARTICLE_COUNT_MOBILE = 40;

interface Rig {
  group: THREE.Group;
  core: THREE.Mesh | null;
  rings: THREE.Mesh[];
  extras: THREE.Object3D[];
  particles: THREE.Points | null;
  lights: THREE.PointLight[];
}

function buildVariant(scene: THREE.Scene, variant: AgentVariant, hex: string, mobile: boolean): Rig {
  const group = new THREE.Group();
  scene.add(group);
  const rig: Rig = { group, core: null, rings: [], extras: [], particles: null, lights: [] };

  const mat = (emissiveIntensity = 0.4, metalness = 0.7, roughness = 0.3) =>
    new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: hex, emissiveIntensity, metalness, roughness });

  switch (variant) {
    case 'technical': {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), mat(0.4));
      group.add(core); rig.core = core;
      const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), new THREE.MeshBasicMaterial({ color: hex, wireframe: true, transparent: true, opacity: 0.3 }));
      group.add(cage); rig.extras.push(cage);
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(1.25 + i * 0.12, 0.01, 8, 64), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.45 }));
        r.rotation.set(i * Math.PI / 3, i * Math.PI / 4, 0);
        group.add(r); rig.rings.push(r);
      }
      const bars = new THREE.Group();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const h = 0.18 + Math.random() * 0.42;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.05), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x10b981 : 0xef4444, emissive: i % 2 ? 0x10b981 : 0xef4444, emissiveIntensity: 0.45 }));
        m.position.set(Math.cos(a) * 1.55, (Math.random() - 0.5) * 0.5, Math.sin(a) * 1.55);
        bars.add(m);
      }
      group.add(bars); rig.extras.push(bars);
      break;
    }
    case 'macro': {
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), mat(0.3, 0.6, 0.4));
      group.add(core); rig.core = core;
      for (let i = 0; i < 6; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.006, 6, 48), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.35 }));
        r.rotation.x = (i / 6) * Math.PI;
        group.add(r); rig.rings.push(r);
      }
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.006, 6, 48), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.35 }));
      r2.rotation.y = Math.PI / 2;
      group.add(r2); rig.rings.push(r2);
      const nodes = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.85 }));
        m.position.set(Math.cos(a) * 1.45, Math.sin(a * 2) * 0.35, Math.sin(a) * 1.45);
        nodes.add(m);
      }
      group.add(nodes); rig.extras.push(nodes);
      break;
    }
    case 'risk': {
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.78, 0), mat(0.35, 0.8, 0.2));
      group.add(core); rig.core = core;
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(1.05 + i * 0.18, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.4 }));
        r.rotation.x = Math.PI / 2;
        group.add(r); rig.rings.push(r);
      }
      const beacons = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.55 }));
        m.position.set(Math.cos(a) * 1.25, 0.55, Math.sin(a) * 1.25);
        m.rotation.x = Math.PI;
        beacons.add(m);
      }
      group.add(beacons); rig.extras.push(beacons);
      break;
    }
    case 'strategy': {
      const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), mat(0.4, 0.7, 0.3));
      group.add(core); rig.core = core;
      const lines = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * 1.5, (Math.random() - 0.5) * 0.7, Math.sin(a) * 1.5)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.45 }));
        lines.add(l);
      }
      group.add(lines); rig.extras.push(lines);
      const nodes = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.9 }));
        m.position.set(Math.cos(a) * 1.5, (Math.random() - 0.5) * 0.7, Math.sin(a) * 1.5);
        nodes.add(m);
      }
      group.add(nodes); rig.extras.push(nodes);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.01, 8, 64), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.35 }));
      ring.rotation.x = Math.PI / 2;
      group.add(ring); rig.rings.push(ring);
      break;
    }
    case 'redTeam': {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 0), mat(0.45, 0.5, 0.5));
      (core.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(hex);
      group.add(core); rig.core = core;
      const spikes = new THREE.Group();
      for (let i = 0; i < 12; i++) {
        const phi = (i / 12) * Math.PI;
        const a = (i / 12) * Math.PI * 2;
        const r = 1.0;
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.3, 4), new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.7 }));
        m.position.set(Math.sin(phi) * Math.cos(a) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(a) * r);
        m.lookAt(0, 0, 0);
        m.rotateX(Math.PI / 2);
        spikes.add(m);
      }
      group.add(spikes); rig.extras.push(spikes);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45 }));
      ring.rotation.x = Math.PI / 3;
      group.add(ring); rig.rings.push(ring);
      break;
    }
    case 'lead': {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 2), mat(0.45, 0.9, 0.15));
      group.add(core); rig.core = core;
      const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), new THREE.MeshBasicMaterial({ color: hex, wireframe: true, transparent: true, opacity: 0.28 }));
      group.add(cage); rig.extras.push(cage);
      const streams = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const pts = [new THREE.Vector3(Math.cos(a) * 1.9, (Math.random() - 0.5) * 0.9, Math.sin(a) * 1.9), new THREE.Vector3(0, 0, 0)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.35 }));
        streams.add(l);
      }
      group.add(streams); rig.extras.push(streams);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.008, 8, 96), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.55 }));
      halo.rotation.x = Math.PI / 2;
      group.add(halo); rig.rings.push(halo);
      break;
    }
    default:
      break;
  }

  const pCount = mobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
  const pos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount * 3; i += 3) {
    pos[i] = (Math.random() - 0.5) * 3.6;
    pos[i + 1] = (Math.random() - 0.5) * 3.6;
    pos[i + 2] = (Math.random() - 0.5) * 3.6;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ color: hex, size: 0.03, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);
  rig.particles = particles;

  const amb = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(amb);
  const pt = new THREE.PointLight(hex, 2.0, 12);
  pt.position.set(1.6, 1.8, 1.6);
  scene.add(pt);
  rig.lights = [pt];

  return rig;
}

export const AgentAI3D: React.FC<AgentAI3DProps> = ({ variant, status, hex, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const statusRef = useRef<AgentStatus>(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const mobile = window.innerWidth < 768;
    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const rig = buildVariant(scene, variant, hex, mobile);

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let elapsed = 0;
    let raf: number | null = null;
    let visible = true;
    let lastTime = performance.now();

    const getDelta = () => {
      const now = performance.now();
      const d = (now - lastTime) / 1000;
      lastTime = now;
      return Math.min(Math.max(d, 0), 0.05);
    };

    const draw = () => {
      const st = statusRef.current;
      const speedMul = st === 'analyzing' ? 2.4 : st === 'completed' ? 0.6 : st === 'error' ? 1.6 : 1.0;
      // core
      if (rig.core) {
        rig.core.rotation.y += 0.012 * speedMul;
        rig.core.rotation.x = Math.sin(elapsed * 0.4) * 0.12;
        const m = rig.core.material as THREE.MeshStandardMaterial;
        const base = st === 'error' ? 0.65 : st === 'analyzing' ? 0.75 : st === 'completed' ? 0.45 : 0.38;
        m.emissiveIntensity = base + Math.sin(elapsed * 3) * 0.12;
        if (st === 'error') m.emissive = new THREE.Color(0xef4444);
        else m.emissive = new THREE.Color(hex);
      }
      rig.rings.forEach((r, i) => {
        r.rotation.z += 0.008 * speedMul * (i + 1);
        r.rotation.x += 0.003 * speedMul;
      });
      rig.extras.forEach((e, i) => {
        e.rotation.y += 0.006 * speedMul * (i % 2 === 0 ? 1 : -1);
      });
      if (rig.particles) {
        const arr = rig.particles.geometry.attributes.position.array as Float32Array;
        const step = st === 'analyzing' ? 0.025 : 0.008;
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] += step;
          if (arr[i] > 1.8) arr[i] = -1.8;
        }
        rig.particles.geometry.attributes.position.needsUpdate = true;
        rig.particles.rotation.y += 0.004 * speedMul;
      }
      rig.lights.forEach((l) => {
        l.intensity = 1.8 + Math.sin(elapsed * 2.5) * 0.4;
      });

      renderer.render(scene, camera);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) {
        getDelta();
        return;
      }
      const delta = getDelta();
      elapsed += delta;
      draw();
    };

    if (reduceMotion) {
      draw();
    } else {
      animate();
    }

    let io: IntersectionObserver | null = null;
    if (!reduceMotion && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (!e) return;
          visible = e.isIntersecting;
          if (visible) lastTime = performance.now();
        },
        { threshold: 0.05 },
      );
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
      // dispose
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat && typeof mat.dispose === 'function') mat.dispose();
      });
      renderer.dispose();
    };
  }, [variant, hex]);

  if (!webGLSupported) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl ${className}`}
        style={{ background: `radial-gradient(circle at 30% 30%, ${hex}55, transparent 70%)` }}
      >
        <div className="h-2/3 w-2/3 rounded-full blur-md" style={{ background: hex, opacity: 0.5 }} />
      </div>
    );
  }

  return <div ref={containerRef} className={`relative overflow-hidden ${className}`} aria-hidden="true" />;
};

export default AgentAI3D;
