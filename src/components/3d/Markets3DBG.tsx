import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Markets3DProps {
  className?: string;
}

/**
 * Markets3DBG — 3D background for the Markets page.
 *
 * Universe: 3D digital globe (global markets) surrounded by bright
 * international connections, with the Meta infinity symbol interpreted
 * as filaments rotating around the globe.
 *
 * Represents global financial data flows and the interconnection
 * of marketplaces, within the Meta AI universe.
 */
export const Markets3DBG: React.FC<Markets3DProps> = ({ className = '' }) => {
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

    // Digital globe (latitude/longitude lines)
    const globeGroup = track(new THREE.Group());
    scene.add(globeGroup);
    const radius = 2.6;
    const latSegments = 12;
    const lonSegments = 24;
    const globeMat = track(
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.32 })
    );
    // Latitude circles
    for (let i = 1; i < latSegments; i++) {
      const theta = (Math.PI * i) / latSegments;
      const r = radius * Math.sin(theta);
      const y = radius * Math.cos(theta);
      const verts: number[] = [];
      for (let j = 0; j <= lonSegments; j++) {
        const phi = (Math.PI * 2 * j) / lonSegments;
        verts.push(r * Math.cos(phi), y, r * Math.sin(phi));
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      globeGroup.add(track(new THREE.Line(geo, globeMat)));
    }
    // Longitude circles
    for (let j = 0; j <= lonSegments; j++) {
      const phi = (Math.PI * 2 * j) / lonSegments;
      const verts: number[] = [];
      for (let i = 0; i <= latSegments; i++) {
        const theta = (Math.PI * i) / latSegments;
        const r = radius * Math.sin(theta);
        const y = radius * Math.cos(theta);
        verts.push(r * Math.cos(phi), y, r * Math.sin(phi));
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      globeGroup.add(track(new THREE.Line(geo, globeMat)));
    }
    // Bright center
    const coreGeo = track(new THREE.SphereGeometry(0.18, 12, 12));
    const coreMat = track(
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8 })
    );
    const core = track(new THREE.Mesh(coreGeo, coreMat));
    globeGroup.add(core);

    // Meta infinity symbols rotating around the globe (filaments)
    const infinityCount = 3;
    const infinityGroups: THREE.Group[] = [];
    for (let k = 0; k < infinityCount; k++) {
      const ig = track(new THREE.Group());
      const loopCount = 40;
      const pts: number[] = [];
      for (let i = 0; i <= loopCount; i++) {
        const t = (i / loopCount) * Math.PI * 2;
        const scale = 1 / (Math.sin(t) * Math.sin(t) + 1);
        pts.push(Math.cos(t) * scale * 1.6, Math.sin(t) * Math.cos(t) * scale * 1.2, 0);
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const mat = track(
        new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.40 })
      );
      const line = track(new THREE.Line(geo, mat));
      ig.add(line);
      // Position on an orbit around the globe
      const angle = (k / infinityCount) * Math.PI * 2;
      ig.position.set(Math.cos(angle) * 4.2, Math.sin(angle) * 2.2, Math.sin(angle) * 1.8);
      ig.rotation.z = angle;
      globeGroup.add(ig);
      infinityGroups.push(ig);
    }

    // International connections: lines between points on the globe
    const connVerts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.random() - 0.5) * Math.PI * 2;
      const b = (Math.random() - 0.5) * Math.PI * 2;
      const p1 = [radius * Math.cos(a) * Math.sin(b), radius * Math.cos(b), radius * Math.sin(a) * Math.sin(b)];
      const p2 = [
        radius * Math.cos((a + Math.PI) * 0.7) * Math.sin((b + Math.PI) * 0.7),
        radius * Math.cos((b + Math.PI) * 0.7),
        radius * Math.sin((a + Math.PI) * 0.7) * Math.sin((b + Math.PI) * 0.7),
      ];
      connVerts.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    }
    const connGeo = track(new THREE.BufferGeometry());
    connGeo.setAttribute('position', new THREE.Float32BufferAttribute(connVerts, 3));
    const connMat = track(
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.30 })
    );
    const conns = track(new THREE.LineSegments(connGeo, connMat));
    scene.add(conns);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001;

      globeGroup.rotation.y = t * 0.12;
      globeGroup.rotation.x = t * 0.05;
      core.scale.setScalar(1 + Math.sin(t * 3) * 0.12);

      infinityGroups.forEach((ig, k) => {
        ig.rotation.y = t * (0.2 + k * 0.08);
        ig.rotation.x = t * 0.1;
      });

      conns.rotation.y = t * 0.04;
      conns.rotation.x = t * 0.03;

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

