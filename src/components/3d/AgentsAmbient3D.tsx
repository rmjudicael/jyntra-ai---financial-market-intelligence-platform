import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const AgentsAmbient3D: React.FC<{ className?: string }> = ({ className = '' }) => {
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
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.0 : 1.25));
    container.appendChild(renderer.domElement);

    const nodeCount = mobile ? 28 : 56;
    const nodes: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const nodeOpacity = isLight ? 0.65 : 0.55;
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: nodeOpacity });
    const group = new THREE.Group();
    scene.add(group);

    for (let i = 0; i < nodeCount; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
      );
      nodes.push(v);
      const m = new THREE.Mesh(nodeGeo, nodeMat.clone());
      m.position.copy(v);
      group.add(m);
      nodeMeshes.push(m);
    }

    // Connect nearby nodes
    const linePositions: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 4.2) {
          linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineOpacity = isLight ? 0.28 : 0.18;
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: lineOpacity });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    // Particle field
    const pCount = mobile ? 60 : 140;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 20;
      pPos[i + 1] = (Math.random() - 0.5) * 12;
      pPos[i + 2] = (Math.random() - 0.5) * 10;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pOpacity = isLight ? 0.55 : 0.45;
    const pMat = new THREE.PointsMaterial({ color: 0xf97316, size: 0.04, transparent: true, opacity: pOpacity });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    const amb = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(amb);

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
      group.rotation.y = elapsed * 0.04;
      group.rotation.x = Math.sin(elapsed * 0.15) * 0.08;
      particles.rotation.y = elapsed * 0.06;
      const arr = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += 0.003;
        if (arr[i] > 6) arr[i] = -6;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) { getDelta(); return; }
      const delta = getDelta();
      elapsed += delta;
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
      nodeGeo.dispose();
      nodeMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, []);

  if (!supported) return null;

  return <div ref={containerRef} className={`pointer-events-none ${className}`} aria-hidden="true" />;
};

export default AgentsAmbient3D;
