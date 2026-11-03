import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface MetaInfinityProps {
  className?: string;
  color?: number;
  opacity?: number;
  speed?: number;
}

/**
 * MetaInfinity3D — Meta infinity symbol interpreted as rotating
 * holographic glowing filaments.
 *
 * Original 3D representation of the Meta AI universe: two entangled
 * loops formed of particles and glowing lines, evoking infinity,
 * continuity and the interconnection of intelligences.
 *
 * Stays in the background, subtle, without disturbing the content.
 * Pauses when the tab is hidden or off-screen, full GPU cleanup on unmount.
 */
export const MetaInfinity3D: React.FC<MetaInfinityProps> = ({
  className = '',
  color = 0x22d3ee,
  opacity = 0.25,
  speed = 1,
}) => {
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

    // Paramétrage du symbole infini (lemniscate de Bernoulli)
    const loopCount = 70;
    const pointsA: number[] = [];
    const pointsB: number[] = [];
    for (let i = 0; i <= loopCount; i++) {
      const t = (i / loopCount) * Math.PI * 2;
      const scale = 1 / (Math.sin(t) * Math.sin(t) + 1);
      const x = Math.cos(t) * scale * 3.2;
      const y = Math.sin(t) * Math.cos(t) * scale * 2.4;
      pointsA.push(x, y, 0);
      pointsB.push(x, y, 0);
    }

    // Ligne A (boucle gauche-droite)
    const geoA = track(new THREE.BufferGeometry());
    geoA.setAttribute('position', new THREE.Float32BufferAttribute(pointsA, 3));
    const matA = track(
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    const lineA = track(new THREE.Line(geoA, matA));
    scene.add(lineA);

    // Ligne B (boucle décalée pour l'effet infini entrelacé)
    const geoB = track(new THREE.BufferGeometry());
    geoB.setAttribute('position', new THREE.Float32BufferAttribute(pointsB, 3));
    const matB = track(
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity * 0.7 })
    );
    const lineB = track(new THREE.Line(geoB, matB));
    lineB.rotation.z = Math.PI / 2;
    scene.add(lineB);

    // Particles along the infinity
    const particleCount = 60;
    const pPositions = new Float32Array(particleCount * 3);
    const pPhases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount) * Math.PI * 4;
      const scale = 1 / (Math.sin(t) * Math.sin(t) + 1);
      pPositions[i * 3] = Math.cos(t) * scale * 3.2;
      pPositions[i * 3 + 1] = Math.sin(t) * Math.cos(t) * scale * 2.4;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      pPhases[i] = Math.random() * Math.PI * 2;
    }
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = track(
      new THREE.PointsMaterial({ color, size: 0.05, transparent: true, opacity: 0.6, sizeAttenuation: true })
    );
    const particles = track(new THREE.Points(pGeo, pMat));
    scene.add(particles);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001 * speed;
      lineA.rotation.y = t * 0.15;
      lineA.rotation.z = t * 0.05;
      lineB.rotation.y = -t * 0.12;
      lineB.rotation.z = Math.PI / 2 + t * 0.08;

      const pos = pGeo.attributes.position as THREE.BufferAttribute;
      const count = pGeo.attributes.position.count;
      for (let i = 0; i < count; i++) {
        const phase = pPhases[i];
        pos.setZ(i, Math.sin(t * 0.8 + phase) * 1.2);
      }
      pos.needsUpdate = true;

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
      document.removeEventListener('visibilitychange', () => {});
      io.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [color, opacity, speed]);

  if (webglFailed) return null;

  return <div ref={containerRef} className={`w-full h-full ${className}`} style={{ minHeight: 300 }} />;
};
