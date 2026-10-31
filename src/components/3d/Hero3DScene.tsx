import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const Hero3DScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
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

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080b10, 0.035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const orangeLight = new THREE.PointLight(0xf97316, 3, 20);
    orangeLight.position.set(3, 4, 3);
    scene.add(orangeLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3, 20);
    cyanLight.position.set(-3, -2, 2);
    scene.add(cyanLight);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Icosahedron Core with wireframe
    const coreGeo = new THREE.IcosahedronGeometry(1.4, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0xf97316,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    const cageGeo = new THREE.IcosahedronGeometry(1.65, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // Orbital Trading Rings
    const ringGeo1 = new THREE.TorusGeometry(2.3, 0.025, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.7 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.7, 0.02, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    coreGroup.add(ring2);

    const candleCount = 14;
    const candleGroup = new THREE.Group();
    const candleMeshes: { body: THREE.Mesh; wick: THREE.Line; speed: number; phase: number }[] = [];

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.5 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.4 });
    const wickMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 });

    for (let i = 0; i < candleCount; i++) {
      const angle = (i / candleCount) * Math.PI * 2;
      const radius = 3.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const isGreen = i % 3 !== 0;

      const bodyHeight = 0.4 + Math.random() * 0.8;
      const bodyGeo = new THREE.BoxGeometry(0.18, bodyHeight, 0.18);
      const body = new THREE.Mesh(bodyGeo, isGreen ? greenMat : redMat);
      body.position.set(x, (Math.random() - 0.5) * 1.5, z);

      const wickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -bodyHeight * 0.9, 0),
        new THREE.Vector3(0, bodyHeight * 0.9, 0),
      ]);
      const wick = new THREE.Line(wickGeo, wickMat);
      body.add(wick);

      candleGroup.add(body);
      candleMeshes.push({ body, wick, speed: 0.02 + Math.random() * 0.02, phase: Math.random() * Math.PI * 2 });
    }
    scene.add(candleGroup);

    const particleCount = 160;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 10;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf97316,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let targetRotationY = 0;
    let targetRotationX = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.5;
      targetRotationX = -y * 0.3;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth rotate core
      coreGroup.rotation.y = elapsedTime * 0.25;
      coreGroup.rotation.x = THREE.MathUtils.lerp(coreGroup.rotation.x, targetRotationX, 0.05);
      coreGroup.rotation.z = THREE.MathUtils.lerp(coreGroup.rotation.z, targetRotationY, 0.05);

      ring1.rotation.z = elapsedTime * 0.4;
      ring2.rotation.x = elapsedTime * -0.3;

      candleGroup.rotation.y = elapsedTime * 0.08;
      candleMeshes.forEach((c) => {
        c.body.position.y += Math.sin(elapsedTime * 2 + c.phase) * 0.003;
      });

      orangeLight.intensity = 2.5 + Math.sin(elapsedTime * 3) * 0.8;
      cyanLight.intensity = 2.5 + Math.cos(elapsedTime * 2.5) * 0.8;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Clean up geometries and materials
      coreGeo.dispose();
      coreMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  if (!webGLSupported) {
    return (
      <div className={`relative flex items-center justify-center p-8 rounded-2xl bg-slate-900/40 border border-orange-500/20 backdrop-blur-md ${className}`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-orange-500 to-cyan-400 opacity-80 blur-md mb-4" />
          <h3 className="text-lg font-bold text-slate-100">Noyau Visuel JYNTRA AI</h3>
          <p className="text-sm text-slate-400 mt-1">Accélération WebGL indisponible sur ce périphérique. Rendu graphique 2D actif.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[450px] md:h-[540px] flex items-center justify-center overflow-hidden pointer-events-auto ${className}`}
      aria-label="Scène 3D interactive du noyau IA financier JYNTRA"
    />
  );
};
