import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface News3DProps {
  className?: string;
}

/**
 * News3DBG — 3D background for the Financial News page.
 *
 * Universe: holographic information flow, connected information nodes,
 * data particles circulating along intelligent connections.
 *
 * Represents the interconnected financial information ecosystem,
 * interpreted in the Meta AI style (neural networks + data flows).
 */
export const News3DBG: React.FC<News3DProps> = ({ className = '' }) => {
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

    // Nodes d'information (sources) disposées en arcs
    const nodeCount = 14;
    const nodes: THREE.Vector3[] = [];
    const home: number[] = [];
    const phases: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const t = (i / nodeCount) * Math.PI * 1.6;
      const r = 3.2 + Math.random() * 1.2;
      nodes.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r * 0.7, (Math.random() - 0.5) * 2));
      home.push(nodes[i].x, nodes[i].y, nodes[i].z);
      phases.push(Math.random() * Math.PI * 2);
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

    // Intelligent connections between nearby nodes
    const edgeVerts: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 3.2) {
          edgeVerts.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    }
    const edgeGeo = track(new THREE.BufferGeometry());
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
    const edgeMat = track(
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.30 })
    );
    const edges = track(new THREE.LineSegments(edgeGeo, edgeMat));
    scene.add(edges);

    // Data particles circulating (information flow)
    const dataCount = 20;
    const dataPositions = new Float32Array(dataCount * 3);
    const dataProgress = new Float32Array(dataCount);
    const dataEdgeIndex = new Int32Array(dataCount);
    const edgeCount = Math.floor(edgeVerts.length / 6);
    const edgePos = edgeGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dataCount; i++) {
      dataProgress[i] = Math.random();
      dataEdgeIndex[i] = edgeCount > 0 ? Math.floor(Math.random() * edgeCount) : 0;
    }
    const dataGeo = track(new THREE.BufferGeometry());
    dataGeo.setAttribute('position', new THREE.BufferAttribute(dataPositions, 3));
    const dataMat = track(
      new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.05, transparent: true, opacity: 0.7, sizeAttenuation: true })
    );
    const dataPoints = track(new THREE.Points(dataGeo, dataMat));
    scene.add(dataPoints);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001;

      // Nodes : respiration douce
      const pos = nodeGeo.attributes.position as THREE.BufferAttribute;
      const count = nodeGeo.attributes.position.count;
      for (let i = 0; i < count; i++) {
        const phase = phases[i];
        nodePositions[i * 3 + 1] = home[i * 3 + 1] + Math.sin(t * 0.8 + phase) * 0.15;
      }
      pos.needsUpdate = true;

      nodePoints.rotation.y = t * 0.09;
      edges.rotation.y = t * 0.05;

      // Data particles in circulation
      const dp = dataGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dataCount; i++) {
        if (edgeCount <= 0) continue;
        dataProgress[i] += 0.014;
        if (dataProgress[i] > 1) dataProgress[i] = 0;
        const ei = dataEdgeIndex[i] * 6;
        if (ei + 3 >= edgePos.count * 3) continue;
        const x1 = edgePos.getX(ei);
        const y1 = edgePos.getY(ei);
        const z1 = edgePos.getZ(ei);
        const x2 = edgePos.getX(ei + 3);
        const y2 = edgePos.getY(ei + 3);
        const z2 = edgePos.getZ(ei + 3);
        if ([x1, y1, z1, x2, y2, z2].some((v) => !Number.isFinite(v))) continue;
        const p = dataProgress[i];
        dp.setX(i, x1 + (x2 - x1) * p);
        dp.setY(i, y1 + (y2 - y1) * p);
        dp.setZ(i, z1 + (z2 - z1) * p);
      }
      dp.needsUpdate = true;

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

