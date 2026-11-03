import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Jyntrack3DProps {
  className?: string;
}

/**
 * Jyntrack3DBG — Arrière-plan 3D de la page JYNTRACK (laboratoire probabiliste).
 *
 * Univers : trajectoires 3D (courbes de performance), structures neuronales
 * et points de données qui évoluent, évoquant l'analyse probabiliste des
 * stratégies de marché.
 *
 * Représente la simulation de scénarios et le suivi intelligent de JYNTRACK.
 */
export const Jyntrack3DBG: React.FC<Jyntrack3DProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = () => container.clientWidth || 500;
    const height = () => container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width() / height(), 0.1, 100);
    camera.position.set(0, 0, 16);
    camera.lookAt(0, 0, 0);

    renderer.setSize(width(), height());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // Trajectoires 3D (scénarios de marché) — plusieurs courbes qui évoluent
    const trajectoryCount = 4;
    const trajectories: THREE.Line[] = [];
    for (let k = 0; k < trajectoryCount; k++) {
      const pts: number[] = [];
      const seed = k * 0.7;
      for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * Math.PI * 3;
        const x = (i / 60 - 0.5) * 7;
        const y = Math.sin(t + seed) * 1.4 + Math.cos(t * 0.7 + seed) * 0.8 + k * 0.4;
        const z = Math.cos(t + seed) * 1.2 + (Math.random() - 0.5) * 0.6;
        pts.push(x, y, z);
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const mat = track(
        new THREE.LineBasicMaterial({
          color: [0x22d3ee, 0xa78bfa, 0xf59e0b, 0x38bdf8][k],
          transparent: true,
          opacity: 0.35,
        })
      );
      const line = track(new THREE.Line(geo, mat));
      scene.add(line);
      trajectories.push(line);
    }

    // Scattered data points (statistics)
    const pointCount = 30;
    const pPositions = new Float32Array(pointCount * 3);
    const pHome = new Float32Array(pointCount * 3);
    const pPhases = new Float32Array(pointCount);
    for (let i = 0; i < pointCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 8;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      pHome[i * 3] = pPositions[i * 3];
      pHome[i * 3 + 1] = pPositions[i * 3 + 1];
      pHome[i * 3 + 2] = pPositions[i * 3 + 2];
      pPhases[i] = Math.random() * Math.PI * 2;
    }
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = track(
      new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.05, transparent: true, opacity: 0.6, sizeAttenuation: true })
    );
    const points = track(new THREE.Points(pGeo, pMat));
    scene.add(points);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001;

      trajectories.forEach((line, k) => {
        line.rotation.y = t * (0.08 + k * 0.04);
        line.position.z = Math.sin(t * 0.5 + k) * 0.3;
      });

      // Data points: slight evolution (probabilistic)
      const pos = pGeo.attributes.position as THREE.BufferAttribute;
      const count = pGeo.attributes.position.count;
      for (let i = 0; i < count; i++) {
        const phase = pPhases[i];
        pPositions[i * 3 + 1] = pHome[i * 3 + 1] + Math.sin(t * 0.7 + phase) * 0.25;
      }
      pos.needsUpdate = true;

      points.rotation.y = t * 0.05;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    const onResize = () => {
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(), height());
    };
    window.addEventListener('resize', onResize);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(rafId);
      else {
        start = performance.now();
        rafId = requestAnimationFrame(animate);
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) cancelAnimationFrame(rafId);
          else {
            start = performance.now();
            rafId = requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  if (webglFailed) return null;

  return <div ref={containerRef} className={`w-full h-full ${className}`} style={{ minHeight: 320 }} />;
};

