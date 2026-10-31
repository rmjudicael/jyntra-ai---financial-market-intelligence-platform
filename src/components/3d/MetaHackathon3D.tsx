import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const MetaHackathon3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
      if (!gl) {
        setSupported(false);
        return;
      }
    } catch {
      setSupported(false);
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 420;
    const isSmall = width < 768;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06090e, 0.035);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 10);
    camera.lookAt(0, 0.4, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isSmall, powerPreference: 'low-power' });
    } catch {
      setSupported(false);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const blueLight = new THREE.PointLight(0x2563eb, 3.2, 30);
    blueLight.position.set(5, 6, 4);
    scene.add(blueLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2.6, 28);
    cyanLight.position.set(-5, 3.5, 2);
    scene.add(cyanLight);

    // --- Relief de marché (courbe de prix en fil de fer) -------------------
    const segsX = isSmall ? 28 : 44;
    const segsZ = isSmall ? 14 : 22;
    const marketGeo = new THREE.PlaneGeometry(26, 15, segsX, segsZ);
    marketGeo.rotateX(-Math.PI / 2.35);
    marketGeo.translate(0, -1.8, 0);
    const basePositions = (marketGeo.attributes.position.array as Float32Array).slice();

    const marketMat = new THREE.MeshBasicMaterial({
      color: 0x1d4ed8,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const marketMesh = new THREE.Mesh(marketGeo, marketMat);
    scene.add(marketMesh);

    const nodeCount = isSmall ? 9 : 14;
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    const nodeMeshes: THREE.Mesh[] = [];
    const nodePositions: THREE.Vector3[] = [];
    const nodeGeo = new THREE.IcosahedronGeometry(0.13, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x0b1220,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.1,
      roughness: 0.25,
      metalness: 0.6,
    });

    for (let i = 0; i < nodeCount; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 3.2 + (i % 3) * 1.1;
      const y = 0.3 + Math.sin(i * 1.7) * 1.4;
      mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius * 0.55);
      nodesGroup.add(mesh);
      nodeMeshes.push(mesh);
      nodePositions.push(mesh.position.clone());
    }

    const edgeVertices: number[] = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 5.2) {
          edgeVertices.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
          );
        }
      }
    }
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.22,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    scene.add(edges);

    const particleCount = isSmall ? 90 : 190;
    const pCoords = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pCoords[i] = (Math.random() - 0.5) * 22;
      pCoords[i + 1] = Math.random() * 5 - 1.2;
      pCoords[i + 2] = (Math.random() - 0.5) * 14;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pCoords, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let targetX = 0;
    let targetY = 0;

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = nx * 0.32;
      targetY = ny * 0.2;
    };
    window.addEventListener('mousemove', handleMove, { passive: true });

    const clock = new THREE.Clock();
    let animId: number | null = null;
    let visible = true;

    const animate = () => {
      const t = clock.getElapsedTime();
      const pos = marketMesh.geometry.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const u = i % (segsX + 1);
        const v = Math.floor(i / (segsX + 1));
        const baseY = basePositions[i * 3 + 1];
        const wave = Math.sin(u * 0.35 + t * 1.5) * Math.cos(v * 0.28 + t * 1.1) * 0.55;
        pos.setY(i, baseY + wave);
      }
      pos.needsUpdate = true;

      // Pulsation des nœuds + rotation du réseau
      nodeMeshes.forEach((mesh, i) => {
        const s = 0.85 + Math.sin(t * 2 + i) * 0.15;
        mesh.scale.setScalar(s);
      });
      nodesGroup.rotation.y = Math.sin(t * 0.12) * 0.25;

      // Dérive des particules
      particles.rotation.y = t * 0.02;

      // Parallaxe caméra
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX * 2.6, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.2 + targetY * 1.2, 0.04);
      camera.lookAt(0, 0.2, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      animate();
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Suspendre l'animation hors écran (économie CPU/GPU)
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && !visible && !reduceMotion) {
          visible = true;
          clock.start();
          animate();
        } else if (!entry.isIntersecting) {
          visible = false;
          if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        }
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      io.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      marketGeo.dispose();
      marketMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      // Libère immédiatement le contexte WebGL (évite l'épuisement des
      // contextes quand plusieurs scènes 3D se succèdent dans la session).
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, []);

  if (!supported) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
