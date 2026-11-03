import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Settings3DProps {
  className?: string;
}

/**
 * Settings3DBG — 3D background for the Settings / management page.
 *
 * Universe: minimalist digital networks, geometric structures (cubes,
 * spheres) and subtle glowing connections, inspired by the Meta AI universe.
 *
 * Stays discreet and professional, suited to a configuration page.
 */
export const Settings3DBG: React.FC<Settings3DProps> = ({ className = '' }) => {
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

    // Floating geometric structures (cubes + spheres)
    const objGroup = track(new THREE.Group());
    scene.add(objGroup);
    const objCount = 6;
    const objHome: number[] = [];
    const objPhases: number[] = [];
    const objMats: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < objCount; i++) {
      const isSphere = i % 2 === 0;
      const geo = isSphere
        ? track(new THREE.SphereGeometry(0.28, 10, 10))
        : track(new THREE.BoxGeometry(0.4, 0.4, 0.4));
      const mat = track(
        new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? 0x22d3ee : i % 3 === 1 ? 0x06b6d4 : 0x38bdf8,
          transparent: true,
          opacity: 0.3,
        })
      );
      objMats.push(mat);
      const mesh = track(new THREE.Mesh(geo, mat));
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 6;
      const z = (Math.random() - 0.5) * 8;
      mesh.position.set(x, y, z);
      objHome.push(x, y, z);
      objPhases.push(Math.random() * Math.PI * 2);
      objGroup.add(mesh);
    }

    // Glowing connections between objects (digital network)
    const connVerts: number[] = [];
    for (let i = 0; i < objCount; i++) {
      for (let j = i + 1; j < objCount; j++) {
        connVerts.push(objHome[i * 3], objHome[i * 3 + 1], objHome[i * 3 + 2], objHome[j * 3], objHome[j * 3 + 1], objHome[j * 3 + 2]);
      }
    }
    const connGeo = track(new THREE.BufferGeometry());
    connGeo.setAttribute('position', new THREE.Float32BufferAttribute(connVerts, 3));
    const connMat = track(
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.22 })
    );
    const conns = track(new THREE.LineSegments(connGeo, connMat));
    scene.add(conns);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001;

      objGroup.rotation.y = t * 0.05;
      objGroup.rotation.x = t * 0.03;

      // Objects: slight oscillation
      objGroup.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const phase = objPhases[i];
        mesh.position.y = objHome[i * 3 + 1] + Math.sin(t * 0.6 + phase) * 0.15;
        mesh.rotation.z = t * 0.2 + phase;
      });

      conns.rotation.y = t * 0.04;

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

