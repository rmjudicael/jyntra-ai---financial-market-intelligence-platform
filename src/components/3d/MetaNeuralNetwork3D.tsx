import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface MetaNeuralNetworkProps {
  className?: string;
  color?: number;
  accentColor?: number;
  opacity?: number;
  speed?: number;
}

/**
 * MetaNeuralNetwork3D — Meta AI neural network: nodes connected by
 * glowing filaments, with data particles in circulation.
 *
 * 3D interpretation of multimodal artificial intelligence: multiple
 * layers of connected nodes, connections that activate, particles that
 * circulate along edges. Evokes vision, language and interaction
 * between intelligences.
 *
 * Subtle background, depth, no content obstruction. GPU cleanup and
 * animation pause handled properly.
 */
export const MetaNeuralNetwork3D: React.FC<MetaNeuralNetworkProps> = ({
  className = '',
  color = 0x06b6d4,
  accentColor = 0x22d3ee,
  opacity = 0.18,
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

    const width = () => container.clientWidth || 500;
    const height = () => container.clientHeight || 360;

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

    // 3 node layers (input / hidden / output) — multimodal intelligence
    const layerCount = 3;
    const nodesPerLayer = 8;
    const layerSpacing = 6;
    const nodes: THREE.Vector3[] = [];
    const home: number[] = [];
    const phases: number[] = [];

    for (let l = 0; l < layerCount; l++) {
      for (let n = 0; n < nodesPerLayer; n++) {
        const x = (l - 1) * layerSpacing;
        const y = (n - (nodesPerLayer - 1) / 2) * 1.4;
        const z = (Math.random() - 0.5) * 2;
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
      new THREE.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 0.55, sizeAttenuation: true })
    );
    const nodePoints = track(new THREE.Points(nodeGeo, nodeMat));
    scene.add(nodePoints);

    // Connections between adjacent layers
    const edgeVerts: number[] = [];
    for (let l = 0; l < layerCount - 1; l++) {
      for (let a = 0; a < nodesPerLayer; a++) {
        for (let b = 0; b < nodesPerLayer; b++) {
          const i1 = l * nodesPerLayer + a;
          const i2 = (l + 1) * nodesPerLayer + b;
          edgeVerts.push(nodes[i1].x, nodes[i1].y, nodes[i1].z, nodes[i2].x, nodes[i2].y, nodes[i2].z);
        }
      }
    }
    const edgeGeo = track(new THREE.BufferGeometry());
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
    const edgeMat = track(
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    const edges = track(new THREE.LineSegments(edgeGeo, edgeMat));
    scene.add(edges);

    // Data particles in circulation on edges
    const dataCount = 24;
    const dataPositions = new Float32Array(dataCount * 3);
    const dataProgress = new Float32Array(dataCount);
    const dataEdgeIndex = new Int32Array(dataCount);
    for (let i = 0; i < dataCount; i++) {
      dataProgress[i] = Math.random();
      dataEdgeIndex[i] = Math.floor(Math.random() * edgeVerts.length / 6);
    }
    const dataGeo = track(new THREE.BufferGeometry());
    dataGeo.setAttribute('position', new THREE.BufferAttribute(dataPositions, 3));
    const dataMat = track(
      new THREE.PointsMaterial({ color: accentColor, size: 0.06, transparent: true, opacity: 0.8, sizeAttenuation: true })
    );
    const dataPoints = track(new THREE.Points(dataGeo, dataMat));
    scene.add(dataPoints);

    let rafId: number;
    let start = performance.now();

    const animate = (now: number) => {
      const t = (now - start) * 0.001 * speed;

      // Node breathing
      const pos = nodeGeo.attributes.position as THREE.BufferAttribute;
      const count = nodeGeo.attributes.position.count;
      for (let i = 0; i < count; i++) {
        const phase = phases[i];
        nodePositions[i * 3 + 1] = home[i * 3 + 1] + Math.sin(t * 0.9 + phase) * 0.12;
      }
      pos.needsUpdate = true;

      // Slow global rotation
      nodePoints.rotation.y = t * 0.08;
      edges.rotation.y = t * 0.06;

      // Data particles moving along edges
      const dp = dataGeo.attributes.position as THREE.BufferAttribute;
      const edgePos = edgeGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dataCount; i++) {
        dataProgress[i] += 0.015 * speed;
        if (dataProgress[i] > 1) dataProgress[i] = 0;
        const ei = dataEdgeIndex[i] * 6;
        const x1 = edgePos.getX(ei);
        const y1 = edgePos.getY(ei);
        const z1 = edgePos.getZ(ei);
        const x2 = edgePos.getX(ei + 3);
        const y2 = edgePos.getY(ei + 3);
        const z2 = edgePos.getZ(ei + 3);
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
  }, [color, accentColor, opacity, speed]);

  if (webglFailed) return null;

  return <div ref={containerRef} className={`w-full h-full ${className}`} style={{ minHeight: 320 }} />;
};
