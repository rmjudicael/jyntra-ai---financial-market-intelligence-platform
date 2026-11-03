import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Academy3DProps {
  className?: string;
}

/**
 * Academy3DBG — Arrière-plan 3D de la page Académie.
 *
 * Univers : structures éducatives numériques (plaquettes de connaissance
 * tournantes comme des livres holographiques) connectées par un réseau
 * neuronal Meta AI.
 *
 * Représente la connaissance connectée et l'intelligence artificielle au
 * service de l'apprentissage financier.
 */
export const Academy3DBG: React.FC<Academy3DProps> = ({ className = '' }) => {
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

    // Knowledge tablets (holographic books) in a circle
    const bookCount = 8;
    const bookGroup = track(new THREE.Group());
    scene.add(bookGroup);
    const bookColors = [0x22d3ee, 0x06b6d4, 0x38bdf8, 0x8b5cf6];
    for (let i = 0; i < bookCount; i++) {
      const angle = (i / bookCount) * Math.PI * 2;
      const r = 3.4;
      const geo = track(new THREE.BoxGeometry(0.5, 1.6, 0.12));
      const mat = track(
        new THREE.MeshBasicMaterial({
          color: bookColors[i % bookColors.length],
          transparent: true,
          opacity: 0.35,
        })
      );
      const mesh = track(new THREE.Mesh(geo, mat));
      mesh.position.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.6, 0);
      mesh.rotation.y = angle;
      mesh.rotation.z = Math.sin(angle) * 0.3;
      bookGroup.add(mesh);
    }

    // Réseau neuronal Meta AI au centre (connaissances connectées)
    const layerCount = 2;
    const nodesPerLayer = 6;
    const layerSpacing = 4.5;
    const nodes: THREE.Vector3[] = [];
    const home: number[] = [];
    const phases: number[] = [];
    for (let l = 0; l < layerCount; l++) {
      for (let n = 0; n < nodesPerLayer; n++) {
        const x = (l - 0.5) * layerSpacing;
        const y = (n - (nodesPerLayer - 1) / 2) * 1.0;
        const z = (Math.random() - 0.5) * 1.2;
        nodes.push(new THREE.Vector3(x, y, z));
        home.push(x, y, z);
        phases.push(Math.random() * Math.PI * 2);
      }
    }
    const nodeGeo = track(new THREE.BufferGeometry());
    const nodePositions = new Float32Array(nodes.length * 3);
    nodes.forEach((n, i) => {
      nodePositions[i * 3] = n.x;
      nodePositions[i * 3 + 1] = n.y;
      nodePositions[i * 3 + 2] = n.z;
    });
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    const nodeMat = track(
      new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.06, transparent: true, opacity: 0.75, sizeAttenuation: true })
    );
    const nodePoints = track(new THREE.Points(nodeGeo, nodeMat));
    scene.add(nodePoints);

    const edgeVerts: number[] = [];
    for (let a = 0; a < nodesPerLayer; a++) {
      for (let b = 0; b < nodesPerLayer; b++) {
        const i1 = a;
        const i2 = nodesPerLayer + b;
        edgeVerts.push(nodes[i1].x, nodes[i1].y, nodes[i1].z, nodes[i2].x, nodes[i2].y, nodes[i2].z);
      }
    }
    const edgeGeo = track(new THREE.BufferGeometry());
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
    const edgeMat = track(
      new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.30 })
    );
    const edges = track(new THREE.LineSegments(edgeGeo, edgeMat));
    scene.add(edges);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001;

      bookGroup.rotation.y = t * 0.07;

      const pos = nodeGeo.attributes.position as THREE.BufferAttribute;
      const count = nodeGeo.attributes.position.count;
      for (let i = 0; i < count; i++) {
        const phase = phases[i];
        nodePositions[i * 3 + 1] = home[i * 3 + 1] + Math.sin(t * 0.8 + phase) * 0.08;
      }
      pos.needsUpdate = true;

      nodePoints.rotation.y = t * 0.09;
      edges.rotation.y = t * 0.05;

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

