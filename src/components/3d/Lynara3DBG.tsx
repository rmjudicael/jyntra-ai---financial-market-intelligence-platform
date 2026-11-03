import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Lynara3DProps {
  className?: string;
}

/**
 * Lynara3DBG — Holographic intelligent universe around the LYNARA character.
 *
 * Universe: soft glowing particles, subtle neural connections,
 * holographic filaments floating around without ever covering the
 * character.
 *
 * Designed to stay behind LYNARA without disturbing its readability or its
 * animations (IDLE, LISTENING, THINKING, SPEAKING, lip sync).
 */
export const Lynara3DBG: React.FC<Lynara3DProps> = ({ className = '' }) => {
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

    const width = () => container.clientWidth || 400;
    const height = () => container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width() / height(), 0.1, 100);
    camera.position.set(0, 0, 14);
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

    // Soft glowing particles (holographic stardust)
    const particleCount = 35;
    const pPositions = new Float32Array(particleCount * 3);
    const pHome = new Float32Array(particleCount * 3);
    const pPhases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 10;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      pHome[i * 3] = pPositions[i * 3];
      pHome[i * 3 + 1] = pPositions[i * 3 + 1];
      pHome[i * 3 + 2] = pPositions[i * 3 + 2];
      pPhases[i] = Math.random() * Math.PI * 2;
    }
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = track(
      new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.07, transparent: true, opacity: 0.45, sizeAttenuation: true })
    );
    const particles = track(new THREE.Points(pGeo, pMat));
    scene.add(particles);

    // Soft neural connections between particles
    const edgeVerts: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = pPositions[i * 3] - pPositions[j * 3];
        const dy = pPositions[i * 3 + 1] - pPositions[j * 3 + 1];
        const dz = pPositions[i * 3 + 2] - pPositions[j * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 2.2) {
          edgeVerts.push(
            pPositions[i * 3], pPositions[i * 3 + 1], pPositions[i * 3 + 2],
            pPositions[j * 3], pPositions[j * 3 + 1], pPositions[j * 3 + 2]
          );
        }
      }
    }
    const edgeGeo = track(new THREE.BufferGeometry());
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
    const edgeMat = track(
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.06 })
    );
    const edges = track(new THREE.LineSegments(edgeGeo, edgeMat));
    scene.add(edges);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001;

      const pos = pGeo.attributes.position as THREE.BufferAttribute;
      const count = pGeo.attributes.position.count;
      for (let i = 0; i < count; i++) {
        const phase = pPhases[i];
        pPositions[i * 3] = pHome[i * 3] + Math.sin(t * 0.3 + phase) * 0.6;
        pPositions[i * 3 + 1] = pHome[i * 3 + 1] + Math.cos(t * 0.25 + phase) * 0.5;
      }
      pos.needsUpdate = true;

      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.02;
      edges.rotation.y = t * 0.03;

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

  return <div ref={containerRef} className={`w-full h-full ${className}`} style={{ minHeight: 300 }} />;
};

