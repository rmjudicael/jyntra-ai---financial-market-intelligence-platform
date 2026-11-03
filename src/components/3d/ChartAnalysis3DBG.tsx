import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ChartAnalysis3DProps {
  className?: string;
}

/**
 * ChartAnalysis3DBG — Arrière-plan 3D de la page Analyse Graphique.
 *
 * Univers : courbes de marché holographiques (chandeliers stylisés en 3D) +
 * réseau neuronal Meta AI qui analyse visuellement les structures.
 *
 * Représente l'analyse multimodale : vision des graphiques + raisonnement IA.
 * Reste subtile en arrière-plan, ne gêne ni les graphiques ni les interactions.
 */
export const ChartAnalysis3DBG: React.FC<ChartAnalysis3DProps> = ({ className = '' }) => {
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
    const height = () => container.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width() / height(), 0.1, 100);
    camera.position.set(0, 0, 18);
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

    // Chandeliers 3D stylisés (marché)
    const candleCount = 14;
    const candleGroup = track(new THREE.Group());
    scene.add(candleGroup);
    for (let i = 0; i < candleCount; i++) {
      const x = (i - (candleCount - 1) / 2) * 1.6;
      const h = 0.8 + Math.random() * 1.6;
      const geo = track(new THREE.BoxGeometry(0.45, h, 0.45));
      const mat = track(
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x10b981 : 0xf43f5e, transparent: true, opacity: 0.75 })
      );
      const mesh = track(new THREE.Mesh(geo, mat));
      mesh.position.set(x, -h / 2, (Math.random() - 0.5) * 1);
      candleGroup.add(mesh);
    }

    // Réseau neuronal Meta AI au-dessus des chandeliers
    const layerCount = 2;
    const nodesPerLayer = 6;
    const layerSpacing = 5;
    const nodes: THREE.Vector3[] = [];
    const home: number[] = [];
    const phases: number[] = [];
    for (let l = 0; l < layerCount; l++) {
      for (let n = 0; n < nodesPerLayer; n++) {
        const x = (l - 0.5) * layerSpacing;
        const y = (n - (nodesPerLayer - 1) / 2) * 1.1 + 2;
        const z = (Math.random() - 0.5) * 1.5;
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
      new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.07, transparent: true, opacity: 0.75, sizeAttenuation: true })
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
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.30 })
    );
    const edges = track(new THREE.LineSegments(edgeGeo, edgeMat));
    scene.add(edges);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001;

      // Chandeliers : légère ondulation verticale
      candleGroup.rotation.y = t * 0.06;
      candleGroup.position.y = Math.sin(t * 0.5) * 0.15;

      // Nœuds IA : respiration
      const pos = nodeGeo.attributes.position as THREE.BufferAttribute;
      const count = nodeGeo.attributes.position.count;
      for (let i = 0; i < count; i++) {
        const phase = phases[i];
        nodePositions[i * 3 + 1] = home[i * 3 + 1] + Math.sin(t * 0.9 + phase) * 0.1;
      }
      pos.needsUpdate = true;

      nodePoints.rotation.y = t * 0.1;
      edges.rotation.y = t * 0.07;

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

  return <div ref={containerRef} className={`w-full h-full ${className}`} style={{ minHeight: 340 }} />;
};

