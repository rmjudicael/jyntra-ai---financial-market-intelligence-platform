import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const AlgorithmicAdvantage3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06090e, 0.04);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const orangePoint = new THREE.PointLight(0xf97316, 3.5, 25);
    orangePoint.position.set(4, 5, 3);
    scene.add(orangePoint);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3.5, 25);
    cyanPoint.position.set(-4, 3, 2);
    scene.add(cyanPoint);

    const planeGeo = new THREE.PlaneGeometry(24, 16, 40, 30);
    planeGeo.rotateX(-Math.PI / 2.3);
    planeGeo.translate(0, -1.5, 0);

    const posAttr = planeGeo.attributes.position;
    const initialPositions = posAttr.array.slice() as Float32Array;

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const waveMesh = new THREE.Mesh(planeGeo, wireMat);
    scene.add(waveMesh);

    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    const cubeGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0xf97316,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });

    const cubes: { mesh: THREE.Mesh; rotSpeed: number; baseY: number; phase: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const isOrange = i % 2 === 0;
      const mesh = new THREE.Mesh(cubeGeo, isOrange ? orangeMat : cyanMat);
      const angle = (i / 9) * Math.PI * 2;
      const radius = 3.5 + (i % 3) * 1.2;
      mesh.position.set(
        Math.cos(angle) * radius,
        0.5 + (Math.random() - 0.5) * 1.2,
        Math.sin(angle) * (radius * 0.5)
      );

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(cubeGeo),
        new THREE.LineBasicMaterial({ color: isOrange ? 0xf97316 : 0x67e8f9 })
      );
      mesh.add(wire);

      nodesGroup.add(mesh);
      cubes.push({
        mesh,
        rotSpeed: 0.015 + Math.random() * 0.02,
        baseY: mesh.position.y,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const pCoords = new Float32Array(120 * 3);
    for (let i = 0; i < 120 * 3; i += 3) {
      pCoords[i] = (Math.random() - 0.5) * 20;
      pCoords[i + 1] = Math.random() * 4 - 1;
      pCoords[i + 2] = (Math.random() - 0.5) * 12;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pCoords, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xf97316,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let targetX = 0;
    let targetY = 0;

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = nx * 0.4;
      targetY = ny * 0.25;
    };
    window.addEventListener('mousemove', handleMove);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();

      const pos = waveMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = i % 41;
        const v = Math.floor(i / 41);
        const initY = initialPositions[i * 3 + 1];
        const wave = Math.sin(u * 0.4 + t * 2) * Math.cos(v * 0.3 + t * 1.5) * 0.6;
        pos.setY(i, initY + wave);
      }
      pos.needsUpdate = true;

      cubes.forEach((c) => {
        c.mesh.rotation.x += c.rotSpeed;
        c.mesh.rotation.y += c.rotSpeed * 1.2;
        c.mesh.position.y = c.baseY + Math.sin(t * 2 + c.phase) * 0.25;
      });

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX * 3, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.5 + targetY * 1.5, 0.05);
      camera.lookAt(0, -0.5, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      planeGeo.dispose();
      wireMat.dispose();
      cubeGeo.dispose();
      orangeMat.dispose();
      cyanMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, []);

  if (!webGLSupported) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
