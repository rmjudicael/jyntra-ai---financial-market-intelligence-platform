import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/** Radius that must stay inside the frame: orbital candles sit at 3.6 + body. */
const FRAME_RADIUS = 3.9;

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

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 480 ? 1.25 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    /** Frame the whole composition whatever the container aspect ratio is. */
    const fitCamera = (w: number, h: number) => {
      const safeW = Math.max(w, 1);
      const safeH = Math.max(h, 1);
      const aspect = safeW / safeH;
      camera.aspect = aspect;
      const verticalFov = (camera.fov * Math.PI) / 180;
      const distanceForHeight = FRAME_RADIUS / Math.tan(verticalFov / 2);
      const distanceForWidth = FRAME_RADIUS / (Math.tan(verticalFov / 2) * Math.max(aspect, 0.1));
      const distance = Math.max(distanceForHeight, distanceForWidth) * 1.04;
      camera.position.set(0, distance * 0.24, distance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    fitCamera(width, height);

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

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let targetRotationY = 0;
    let targetRotationX = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (reduceMotion) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.5;
      targetRotationX = -y * 0.3;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let elapsed = 0;
    let animationFrameId: number | null = null;
    let visible = true;
    const clock = new THREE.Clock();

    const drawFrame = () => {
      // Smooth rotate core
      coreGroup.rotation.y = elapsed * 0.25;
      coreGroup.rotation.x = THREE.MathUtils.lerp(coreGroup.rotation.x, targetRotationX, 0.05);
      coreGroup.rotation.z = THREE.MathUtils.lerp(coreGroup.rotation.z, targetRotationY, 0.05);

      ring1.rotation.z = elapsed * 0.4;
      ring2.rotation.x = elapsed * -0.3;

      candleGroup.rotation.y = elapsed * 0.08;
      candleMeshes.forEach((c) => {
        c.body.position.y += Math.sin(elapsed * 2 + c.phase) * 0.003;
      });

      orangeLight.intensity = 2.5 + Math.sin(elapsed * 3) * 0.8;
      cyanLight.intensity = 2.5 + Math.cos(elapsed * 2.5) * 0.8;

      renderer.render(scene, camera);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!visible) return;
      elapsed += delta;
      drawFrame();
    };

    if (reduceMotion) {
      drawFrame();
    } else {
      clock.start();
      animate();
    }

    // Pause the render loop when the scene is scrolled out of view (mobile battery/GPU).
    let intersectionObserver: IntersectionObserver | null = null;
    if (!reduceMotion && typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          visible = entry.isIntersecting;
          if (visible) clock.getDelta();
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(container);
    }

    // Track the real container size: CSS breakpoints, orientation and split views.
    let resizeFrame: number | null = null;
    const applySize = () => {
      resizeFrame = null;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      fitCamera(w, h);
      if (reduceMotion) drawFrame();
    };
    const scheduleResize = () => {
      if (resizeFrame !== null) return;
      resizeFrame = window.requestAnimationFrame(applySize);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleResize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', scheduleResize);
    }

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('mousemove', handleMouseMove);
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
      candleMeshes.forEach((c) => {
        c.body.geometry.dispose();
        c.wick.geometry.dispose();
      });
      greenMat.dispose();
      redMat.dispose();
      wickMat.dispose();
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
      className={`relative w-full h-[clamp(280px,72vw,400px)] sm:h-[clamp(340px,52vw,450px)] md:h-[clamp(380px,42vw,540px)] max-h-[72vh] flex items-center justify-center overflow-hidden pointer-events-auto ${className}`}
      aria-label="Scène 3D interactive du noyau IA financier JYNTRA"
    />
  );
};
