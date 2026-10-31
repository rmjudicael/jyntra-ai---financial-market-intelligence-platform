import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLanguage } from '../../i18n/LanguageContext';

export type LynaraHoloState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'unavailable';

export interface LynaraAvatar3DProps {
  state: LynaraHoloState;
  /** 0..1 voice envelope driving lip-sync (from TTS timing / mic analyser). */
  audioLevel?: number;
  className?: string;
}

/**
 * LYNARA — volumetric female hologram.
 *
 * Rendering approach (not a 3D model with a blue filter):
 *  - every surface uses a custom hologram shader combining Fresnel rim light,
 *    animated horizontal scanlines, a micro-line raster, vertical dissolve,
 *    flicker and a travelling light sweep;
 *  - the figure is a sculpted adult female silhouette (lathe torso + skirt,
 *    articulated arms and hands, shaped head with eyes, lids, brows, nose and
 *    lips) rather than primitive blocks;
 *  - the illusion of projection comes from a light cone, rotating pedestal
 *    rings, a scan ring travelling up the body, floating data motes and a
 *    back halo whose colour follows the conversation state;
 *  - idle breathing, weight shift, blink, gaze tracking, head tilt, hand
 *    gestures and audio-driven visemes animate the presence.
 *
 * Performance: capped DPR, paused when off-screen or when the tab is hidden,
 * reduced-motion support, full GPU/geometry disposal on unmount.
 */
export const LynaraAvatar3D: React.FC<LynaraAvatar3DProps> = ({ state, audioLevel = 0, className = '' }) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const audioRef = useRef(audioLevel);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    stateRef.current = state;
    audioRef.current = audioLevel;
  }, [state, audioLevel]);

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

    const width = () => container.clientWidth || 440;
    const height = () => container.clientHeight || 540;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width() / height(), 0.1, 40);
    camera.position.set(0, 0.34, 3.28);
    camera.lookAt(0, 0.16, 0);

    renderer.setSize(width(), height());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // ---------------------------------------------------------------------
    // Hologram shader
    // ---------------------------------------------------------------------
    const holoMaterials: THREE.ShaderMaterial[] = [];

    const makeHolo = (
      color: number,
      rim: number,
      opacity: number,
      opts: { scan?: number; lines?: number; additive?: boolean; dissolve?: boolean } = {},
    ) => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uRim: { value: new THREE.Color(rim) },
          uOpacity: { value: opacity },
          uScan: { value: opts.scan ?? 26 },
          uLines: { value: opts.lines ?? 190 },
          uDissolve: { value: opts.dissolve === false ? 0 : 1 },
          uEnergy: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormalW;
          varying vec3 vViewW;
          varying vec3 vLocal;
          void main() {
            vLocal = position;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vViewW = normalize(cameraPosition - world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uColor;
          uniform vec3 uRim;
          uniform float uOpacity;
          uniform float uScan;
          uniform float uLines;
          uniform float uDissolve;
          uniform float uEnergy;
          varying vec3 vNormalW;
          varying vec3 vViewW;
          varying vec3 vLocal;

          void main() {
            float facing = abs(dot(normalize(vNormalW), normalize(vViewW)));
            float fresnel = pow(1.0 - facing, 2.35);

            // Animated horizontal scan bands.
            float scan = 0.5 + 0.5 * sin(vLocal.y * uScan * 6.28318 - uTime * 2.1);
            scan = pow(scan, 3.0);

            // Fine raster used by projected volumetric displays.
            float raster = 0.5 + 0.5 * sin(vLocal.y * uLines);
            raster = smoothstep(0.72, 1.0, raster);

            // A slow light sweep rising through the body.
            float sweepPos = fract(vLocal.y * 0.34 - uTime * 0.085);
            float sweep = smoothstep(0.0, 0.055, sweepPos) * smoothstep(0.19, 0.055, sweepPos);

            float flicker = 0.955 + 0.045 * sin(uTime * 19.0 + vLocal.y * 9.0);

            float body = 0.085 + fresnel * 0.82 + scan * 0.11 + raster * 0.05 + sweep * 0.22;
            body *= flicker;
            body += uEnergy * 0.09;

            float alpha = uOpacity * body;
            if (uDissolve > 0.5) {
              // The lower body dissolves into the projection base.
              alpha *= smoothstep(-0.92, -0.28, vLocal.y);
            }

            vec3 color = mix(uColor, uRim, clamp(fresnel * 1.35, 0.0, 1.0));
            color += uRim * sweep * 0.35;
            color *= 0.9 + fresnel * 1.45;

            gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.96));
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      material.userData.baseOpacity = opacity;
      holoMaterials.push(material);
      track(material);
      return material;
    };

    // Cyan / ice palette by default; the accent shifts with the state.
    const BODY_COLOR = 0x8fe9ff;
    const BODY_RIM = 0x22d3ee;
    const bodyMat = makeHolo(BODY_COLOR, BODY_RIM, 0.58);
    const skinMat = makeHolo(0xa9eeff, 0x38bdf8, 0.62, { scan: 20, lines: 210 });
    const hairMat = makeHolo(0x67e8f9, 0x0891b2, 0.5, { scan: 34, lines: 120 });
    const dressMat = makeHolo(0x7dd3fc, 0x0e7490, 0.4, { scan: 16, lines: 90 });
    const rimMat = makeHolo(0xecfeff, 0x22d3ee, 0.7, { additive: true, scan: 40, lines: 140, dissolve: false });
    const accentMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    track(accentMat);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xc4f4ff, transparent: true, opacity: 0.78, depthWrite: false });
    track(eyeWhiteMat);
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.95, depthWrite: false });
    track(irisMat);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x04121c, transparent: true, opacity: 0.96, depthWrite: false });
    track(pupilMat);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x072c3a, transparent: true, opacity: 0.9, depthWrite: false });
    track(mouthMat);
    const lipMat = makeHolo(0x9df6ff, 0x22d3ee, 0.85, { scan: 30, lines: 240, dissolve: false });
    const browMat = new THREE.MeshBasicMaterial({ color: 0x4fd1e8, transparent: true, opacity: 0.55, depthWrite: false });
    track(browMat);

    const root = new THREE.Group();
    scene.add(root);

    // ---------------------------------------------------------------------
    // Projection stage: pedestal, rings, cone, beam
    // ---------------------------------------------------------------------
    const stage = new THREE.Group();
    stage.position.y = -0.95;
    root.add(stage);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    track(ringMat);
    const rings: THREE.Mesh[] = [];
    [0.62, 0.47, 0.3].forEach((radius, i) => {
      const ring = new THREE.Mesh(track(new THREE.RingGeometry(radius, radius + 0.008, 96)), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = i * 0.035;
      stage.add(ring);
      rings.push(ring);
    });
    const discMat = new THREE.MeshBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    track(discMat);
    const disc = new THREE.Mesh(track(new THREE.CircleGeometry(0.64, 72)), discMat);
    disc.rotation.x = -Math.PI / 2;
    stage.add(disc);
    const discGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.06, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    track(discGlowMat);
    const discGlow = new THREE.Mesh(track(new THREE.CircleGeometry(0.86, 72)), discGlowMat);
    discGlow.rotation.x = -Math.PI / 2;
    discGlow.position.y = -0.01;
    stage.add(discGlow);

    // Projection cone (wider at the base, narrow at the head).
    const coneMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.1 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float vertical = smoothstep(0.0, 0.45, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
          float bands = 0.55 + 0.45 * sin(vUv.y * 90.0 - uTime * 3.0);
          float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
          float alpha = uOpacity * vertical * (0.25 + 0.35 * bands) * (0.25 + edge);
          gl_FragColor = vec4(0.35, 0.9, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    track(coneMat);
    const cone = new THREE.Mesh(track(new THREE.CylinderGeometry(0.26, 0.62, 1.85, 48, 1, true)), coneMat);
    cone.position.y = 1.0;
    root.add(cone);

    // ---------------------------------------------------------------------
    // Figure
    // ---------------------------------------------------------------------
    const figure = new THREE.Group();
    root.add(figure);

    const lathe = (points: Array<[number, number]>, segments = 56) => {
      const vectors = points.map(([x, y]) => new THREE.Vector2(x, y));
      return track(new THREE.LatheGeometry(vectors, segments));
    };

    // Skirt: waist -> flared hem.
    const skirt = new THREE.Mesh(
      lathe([
        [0.155, 0.02], [0.17, -0.06], [0.205, -0.2], [0.245, -0.36],
        [0.295, -0.56], [0.345, -0.76], [0.362, -0.84], [0.34, -0.87],
      ]),
      dressMat,
    );
    skirt.scale.z = 0.82;
    figure.add(skirt);

    // Torso: waist -> bust -> shoulders.
    const torso = new THREE.Mesh(
      lathe([
        [0.152, 0.0], [0.143, 0.08], [0.155, 0.16], [0.185, 0.25],
        [0.203, 0.31], [0.196, 0.37], [0.21, 0.42], [0.225, 0.47],
        [0.19, 0.52], [0.12, 0.56], [0.07, 0.575],
      ]),
      bodyMat,
    );
    torso.scale.z = 0.74;
    figure.add(torso);

    // Structured bodice: the figure is dressed, not an anatomical mannequin.
    // A slightly larger lathe over waist -> bust reads as fabric with a
    // feminine cut, and leaves the upper chest / shoulders luminous.
    const bodice = new THREE.Mesh(
      lathe([
        [0.158, 0.005], [0.151, 0.08], [0.162, 0.16], [0.19, 0.24],
        [0.207, 0.3], [0.2, 0.355], [0.19, 0.39],
      ]),
      dressMat,
    );
    bodice.scale.z = 0.77;
    figure.add(bodice);

    // Vertical fabric seams travelling down the skirt.
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + Math.PI / 14;
      const seam = new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * 0.16, 0.0, Math.sin(angle) * 0.13),
        new THREE.Vector3(Math.cos(angle) * 0.21, -0.24, Math.sin(angle) * 0.17),
        new THREE.Vector3(Math.cos(angle) * 0.29, -0.56, Math.sin(angle) * 0.24),
        new THREE.Vector3(Math.cos(angle) * 0.352, -0.84, Math.sin(angle) * 0.29),
      ]), 20, 0.0022, 5, false)), accentMat);
      seam.material = accentMat;
      figure.add(seam);
    }

    // Hem light ring makes the projection feel physically anchored.
    const hemRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.355, 0.003, 6, 72)), accentMat);
    hemRing.position.y = -0.84;
    hemRing.rotation.x = Math.PI / 2;
    hemRing.scale.z = 0.83;
    figure.add(hemRing);

    // Neck.
    const neck = new THREE.Mesh(track(new THREE.CylinderGeometry(0.052, 0.062, 0.13, 24)), skinMat);
    neck.position.y = 0.615;
    figure.add(neck);

    // Collar light + waist belt.
    const collar = new THREE.Mesh(track(new THREE.TorusGeometry(0.075, 0.006, 8, 40)), accentMat);
    collar.position.y = 0.585;
    collar.rotation.x = Math.PI / 2.1;
    figure.add(collar);
    const belt = new THREE.Mesh(track(new THREE.TorusGeometry(0.156, 0.007, 8, 48)), accentMat);
    belt.position.y = 0.02;
    belt.rotation.x = Math.PI / 2;
    belt.scale.z = 0.82;
    figure.add(belt);

    // V neckline built from two thin light tubes.
    [-1, 1].forEach((side) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.15, 0.49, 0.055),
        new THREE.Vector3(side * 0.09, 0.43, 0.115),
        new THREE.Vector3(0, 0.36, 0.135),
      ]);
      const line = new THREE.Mesh(track(new THREE.TubeGeometry(curve, 18, 0.0045, 6, false)), accentMat);
      figure.add(line);
    });

    // Shoulders.
    [-1, 1].forEach((side) => {
      const joint = new THREE.Mesh(track(new THREE.SphereGeometry(0.058, 20, 16)), bodyMat);
      joint.position.set(side * 0.215, 0.455, 0);
      joint.scale.set(1, 0.9, 0.95);
      figure.add(joint);
    });

    // ---------------------------------------------------------------------
    // Arms + hands (articulated)
    // ---------------------------------------------------------------------
    const makeArm = (side: number) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.225, 0.44, 0);
      figure.add(shoulder);

      const sleeve = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.05, 0.075, 8, 14)), dressMat);
      sleeve.position.y = -0.06;
      shoulder.add(sleeve);

      const upper = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.036, 0.19, 8, 14)), skinMat);
      upper.position.y = -0.19;
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.y = -0.33;
      shoulder.add(elbow);

      const fore = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.03, 0.17, 8, 14)), skinMat);
      fore.position.y = -0.13;
      elbow.add(fore);

      const wrist = new THREE.Group();
      wrist.position.y = -0.27;
      elbow.add(wrist);

      const palm = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.028, 0.045, 6, 12)), skinMat);
      palm.scale.set(1.25, 1, 0.55);
      palm.position.y = -0.035;
      wrist.add(palm);

      const fingers: THREE.Mesh[] = [];
      for (let f = 0; f < 4; f++) {
        const finger = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.0058, 0.042, 4, 8)), skinMat);
        finger.position.set((f - 1.5) * 0.0135, -0.087, 0);
        wrist.add(finger);
        fingers.push(finger);
      }
      const thumb = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.0065, 0.032, 4, 8)), skinMat);
      thumb.position.set(side * -0.034, -0.05, 0.006);
      thumb.rotation.z = side * 0.85;
      wrist.add(thumb);
      fingers.push(thumb);

      shoulder.rotation.z = side * -0.05;
      shoulder.rotation.x = 0.02;
      elbow.rotation.x = -0.2;

      return { shoulder, elbow, wrist, fingers };
    };
    const armL = makeArm(-1);
    const armR = makeArm(1);

    // ---------------------------------------------------------------------
    // Head + face
    // ---------------------------------------------------------------------
    const head = new THREE.Group();
    head.position.set(0, 0.825, 0);
    head.scale.setScalar(1.13);
    figure.add(head);

    const cranium = new THREE.Mesh(track(new THREE.SphereGeometry(0.16, 40, 32)), skinMat);
    cranium.scale.set(0.82, 1.05, 0.92);
    head.add(cranium);

    const jaw = new THREE.Mesh(track(new THREE.SphereGeometry(0.105, 30, 22)), skinMat);
    jaw.position.set(0, -0.072, 0.026);
    jaw.scale.set(0.77, 0.86, 0.86);
    head.add(jaw);

    const chin = new THREE.Mesh(track(new THREE.SphereGeometry(0.045, 20, 16)), skinMat);
    chin.position.set(0, -0.128, 0.072);
    chin.scale.set(1.0, 0.78, 0.72);
    head.add(chin);

    // Cheekbones.
    [-1, 1].forEach((side) => {
      const cheek = new THREE.Mesh(track(new THREE.SphereGeometry(0.045, 18, 14)), skinMat);
      cheek.position.set(side * 0.068, -0.028, 0.088);
      cheek.scale.set(1.0, 0.72, 0.55);
      head.add(cheek);
      const ear = new THREE.Mesh(track(new THREE.SphereGeometry(0.028, 14, 12)), skinMat);
      ear.position.set(side * 0.137, -0.005, 0.004);
      ear.scale.set(0.4, 1.05, 0.72);
      head.add(ear);
      const stud = new THREE.Mesh(track(new THREE.SphereGeometry(0.006, 10, 8)), accentMat);
      stud.position.set(side * 0.142, -0.032, 0.012);
      head.add(stud);
    });

    // Nose: bridge + tip.
    const noseBridge = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.013, 0.062, 6, 10)), skinMat);
    noseBridge.position.set(0, -0.012, 0.132);
    noseBridge.rotation.x = 0.18;
    head.add(noseBridge);
    const noseTip = new THREE.Mesh(track(new THREE.SphereGeometry(0.018, 14, 12)), skinMat);
    noseTip.position.set(0, -0.05, 0.152);
    noseTip.scale.set(1, 0.78, 0.9);
    head.add(noseTip);

    // Eyes: almond-shaped, expressive, with a defined lid and lashes.
    const makeEye = (side: number) => {
      const group = new THREE.Group();
      group.position.set(side * 0.056, 0.032, 0.129);

      const white = new THREE.Mesh(track(new THREE.SphereGeometry(0.022, 22, 16)), eyeWhiteMat);
      white.scale.set(1.22, 0.56, 0.5);
      group.add(white);

      const iris = new THREE.Mesh(track(new THREE.CircleGeometry(0.0158, 24)), irisMat);
      iris.position.z = 0.0142;
      group.add(iris);

      const pupil = new THREE.Mesh(track(new THREE.CircleGeometry(0.0076, 18)), pupilMat);
      pupil.position.z = 0.0152;
      group.add(pupil);

      const glint = new THREE.Mesh(track(new THREE.CircleGeometry(0.0034, 10)), eyeWhiteMat);
      glint.position.set(0.0048, 0.0052, 0.0158);
      group.add(glint);

      // Upper eyelid: a skin-toned shell that keeps the visible eye almond-shaped.
      const lidSkin = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.0235, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)),
        skinMat,
      );
      lidSkin.position.set(0, 0.0075, 0.009);
      lidSkin.scale.set(1.3, 0.72, 0.55);
      lidSkin.rotation.x = -0.12;
      group.add(lidSkin);

      // Upper lid line, slightly thicker at the outer corner.
      const lid = new THREE.Mesh(track(new THREE.TorusGeometry(0.0245, 0.003, 6, 20, Math.PI)), browMat);
      lid.position.set(0, 0.0035, 0.011);
      lid.rotation.set(0.16, 0, 0);
      group.add(lid);

      // Lashes at the outer corner.
      for (let l = 0; l < 3; l++) {
        const lash = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.0012, 0.008, 3, 6)), browMat);
        lash.position.set(side * (0.021 + l * 0.002), 0.0065 + l * 0.0025, 0.0125);
        lash.rotation.z = side * (0.5 + l * 0.16);
        group.add(lash);
      }

      const brow = new THREE.Mesh(track(new THREE.TorusGeometry(0.032, 0.0032, 6, 18, Math.PI * 0.74)), browMat);
      brow.position.set(0, 0.049, 0.006);
      brow.rotation.z = side * 0.11;
      group.add(brow);

      head.add(group);
      return { group, eyeWhite: white, iris, pupil, brow };
    };
    const eyeL = makeEye(-1);
    const eyeR = makeEye(1);

    // Mouth and lips.
    const mouth = new THREE.Group();
    mouth.position.set(0, -0.094, 0.132);
    head.add(mouth);

    const cavity = new THREE.Mesh(track(new THREE.SphereGeometry(0.026, 20, 14)), mouthMat);
    cavity.scale.set(1.25, 0.32, 0.5);
    mouth.add(cavity);

    // A soft lip volume so the mouth reads as lips, not an outline.
    const lipMass = new THREE.Mesh(track(new THREE.SphereGeometry(0.03, 22, 14)), lipMat);
    lipMass.scale.set(1.3, 0.42, 0.36);
    lipMass.position.set(0, -0.001, 0.004);
    mouth.add(lipMass);

    const upperLip = new THREE.Mesh(track(new THREE.TorusGeometry(0.03, 0.0046, 8, 22, Math.PI)), lipMat);
    upperLip.rotation.set(0.34, 0, 0);
    upperLip.position.y = 0.005;
    mouth.add(upperLip);

    const lowerLip = new THREE.Mesh(track(new THREE.TorusGeometry(0.028, 0.0052, 8, 22, Math.PI)), lipMat);
    lowerLip.rotation.set(0.34, 0, Math.PI);
    lowerLip.position.y = -0.005;
    mouth.add(lowerLip);

    // Subtle smile creases.
    [-1, 1].forEach((side) => {
      const crease = new THREE.Mesh(track(new THREE.TorusGeometry(0.022, 0.0018, 5, 10, Math.PI * 0.4)), browMat);
      crease.position.set(side * 0.035, -0.076, 0.113);
      crease.rotation.set(0.2, 0, side * 0.9);
      head.add(crease);
    });

    // ---------------------------------------------------------------------
    // Hair: crown cap, swept fringe, long strands with inertia
    // ---------------------------------------------------------------------
    const hair = new THREE.Group();
    head.add(hair);

    const crown = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.168, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.56)),
      hairMat,
    );
    crown.position.set(0, 0.035, -0.028);
    crown.scale.set(0.94, 1.03, 1.0);
    hair.add(crown);

    // Fuller side and back masses give the silhouette real hair volume.
    const backHair = new THREE.Mesh(track(new THREE.SphereGeometry(0.175, 30, 22)), hairMat);
    backHair.position.set(0, -0.01, -0.075);
    backHair.scale.set(1.0, 1.12, 0.92);
    hair.add(backHair);
    [-1, 1].forEach((side) => {
      const sideHair = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.045, 0.2, 8, 14)), hairMat);
      sideHair.position.set(side * 0.135, -0.06, -0.025);
      sideHair.rotation.z = side * 0.12;
      sideHair.rotation.x = -0.1;
      hair.add(sideHair);
    });

    // Hairline arc across the forehead.
    const hairline = new THREE.Mesh(
      track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.12, 0.112, 0.075),
        new THREE.Vector3(-0.05, 0.142, 0.115),
        new THREE.Vector3(0.04, 0.145, 0.118),
        new THREE.Vector3(0.12, 0.112, 0.075),
      ]), 20, 0.007, 6, false)),
      hairMat,
    );
    hair.add(hairline);

    const bun = new THREE.Mesh(track(new THREE.SphereGeometry(0.062, 20, 16)), hairMat);
    bun.position.set(0, 0.03, -0.14);
    bun.scale.set(1, 0.9, 0.85);
    hair.add(bun);

    const strands: Array<{ mesh: THREE.Mesh; phase: number; baseX: number; baseZ: number }> = [];
    const addStrand = (points: Array<[number, number, number]>, radius: number, phase: number) => {
      const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      const mesh = new THREE.Mesh(track(new THREE.TubeGeometry(curve, 20, radius, 6, false)), hairMat);
      hair.add(mesh);
      strands.push({ mesh, phase, baseX: 0, baseZ: 0 });
      return mesh;
    };

    addStrand([[0.112, 0.11, 0.085], [0.152, 0.02, 0.075], [0.158, -0.12, 0.04], [0.146, -0.26, -0.01]], 0.021, 0);
    addStrand([[-0.112, 0.11, 0.085], [-0.152, 0.02, 0.075], [-0.158, -0.12, 0.04], [-0.146, -0.26, -0.01]], 0.021, 0.8);
    addStrand([[0.135, 0.1, -0.03], [0.17, -0.02, -0.06], [0.168, -0.18, -0.1], [0.15, -0.35, -0.12]], 0.024, 1.6);
    addStrand([[-0.135, 0.1, -0.03], [-0.17, -0.02, -0.06], [-0.168, -0.18, -0.1], [-0.15, -0.35, -0.12]], 0.024, 2.4);
    addStrand([[0.07, 0.13, -0.1], [0.12, -0.02, -0.14], [0.11, -0.2, -0.18], [0.09, -0.38, -0.2]], 0.026, 3.1);
    addStrand([[-0.07, 0.13, -0.1], [-0.12, -0.02, -0.14], [-0.11, -0.2, -0.18], [-0.09, -0.38, -0.2]], 0.026, 3.9);
    addStrand([[0, 0.15, -0.12], [0.02, -0.04, -0.18], [0, -0.24, -0.2], [-0.02, -0.4, -0.19]], 0.03, 4.6);

    // Side-swept fringe.
    const fringe = new THREE.Mesh(
      track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.12, 0.14, 0.1),
        new THREE.Vector3(-0.04, 0.155, 0.135),
        new THREE.Vector3(0.06, 0.145, 0.125),
        new THREE.Vector3(0.125, 0.1, 0.09),
      ]), 22, 0.022, 6, false)),
      hairMat,
    );
    hair.add(fringe);

    // ---------------------------------------------------------------------
    // Halo, scan ring, data motes
    // ---------------------------------------------------------------------
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    track(haloMat);
    const halo = new THREE.Mesh(track(new THREE.TorusGeometry(0.3, 0.0045, 8, 72)), haloMat);
    halo.position.y = 1.08;
    halo.rotation.x = Math.PI / 2.25;
    root.add(halo);

    const haloInner = new THREE.Mesh(track(new THREE.TorusGeometry(0.245, 0.0025, 6, 64)), haloMat);
    haloInner.position.y = 1.08;
    haloInner.rotation.x = Math.PI / 2.25;
    root.add(haloInner);

    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x9af5ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    track(scanMat);
    const scanRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.31, 0.0035, 8, 72)), scanMat);
    scanRing.rotation.x = Math.PI / 2;
    root.add(scanRing);

    // Orbiting data rings around the figure.
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    track(orbitMat);
    const orbit = new THREE.Mesh(track(new THREE.TorusGeometry(0.42, 0.002, 6, 80)), orbitMat);
    orbit.position.y = 0.18;
    orbit.rotation.x = Math.PI / 2.6;
    root.add(orbit);
    const orbit2 = new THREE.Mesh(track(new THREE.TorusGeometry(0.5, 0.0018, 6, 80)), orbitMat);
    orbit2.position.y = 0.02;
    orbit2.rotation.x = Math.PI / 2.1;
    orbit2.rotation.z = 0.45;
    root.add(orbit2);

    // Round particle sprite.
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = spriteCanvas.height = 48;
    const ctx = spriteCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    gradient.addColorStop(0, 'rgba(190,250,255,1)');
    gradient.addColorStop(0.35, 'rgba(80,220,245,0.65)');
    gradient.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 48, 48);
    const spriteTexture = track(new THREE.CanvasTexture(spriteCanvas));

    const MOTE_COUNT = 130;
    const motePositions = new Float32Array(MOTE_COUNT * 3);
    const moteSeeds = new Float32Array(MOTE_COUNT * 3);
    for (let i = 0; i < MOTE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.18 + Math.random() * 0.62;
      motePositions[i * 3] = Math.cos(angle) * radius;
      motePositions[i * 3 + 1] = -0.9 + Math.random() * 2.0;
      motePositions[i * 3 + 2] = Math.sin(angle) * radius * 0.7;
      moteSeeds[i * 3] = angle;
      moteSeeds[i * 3 + 1] = 0.035 + Math.random() * 0.09;
      moteSeeds[i * 3 + 2] = 0.3 + Math.random() * 0.7;
    }
    const moteGeo = track(new THREE.BufferGeometry());
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xa5f3fc, size: 0.032, map: spriteTexture, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    track(moteMat);
    const motes = new THREE.Points(moteGeo, moteMat);
    root.add(motes);

    // A second field of larger, slower specks for depth.
    const DUST_COUNT = 45;
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 2.6;
      dustPositions[i * 3 + 1] = -1.0 + Math.random() * 2.4;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.6 - 0.3;
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x67e8f9, size: 0.018, map: spriteTexture, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    track(dustMat);
    const dust = new THREE.Points(dustGeo, dustMat);
    root.add(dust);

    // ---------------------------------------------------------------------
    // Pointer parallax
    // ---------------------------------------------------------------------
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const onPointerLeave = () => { pointerX = 0; pointerY = 0; };
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mouseleave', onPointerLeave);

    // ---------------------------------------------------------------------
    // Palette per state
    // ---------------------------------------------------------------------
    const PALETTES: Record<LynaraHoloState, { body: number; rim: number; accent: number }> = {
      idle: { body: 0x8fe9ff, rim: 0x22d3ee, accent: 0x67e8f9 },
      listening: { body: 0xa7f3ff, rim: 0x06b6d4, accent: 0x22d3ee },
      thinking: { body: 0xd8ccff, rim: 0x8b5cf6, accent: 0xc4b5fd },
      speaking: { body: 0xb6f5ff, rim: 0x2dd4bf, accent: 0xfbbf24 },
      unavailable: { body: 0xffd1da, rim: 0xfb7185, accent: 0xfb7185 },
    };
    const targetBody = new THREE.Color(PALETTES.idle.body);
    const targetRim = new THREE.Color(PALETTES.idle.rim);
    const targetAccent = new THREE.Color(PALETTES.idle.accent);
    const tempColor = new THREE.Color();

    // ---------------------------------------------------------------------
    // Animation
    // ---------------------------------------------------------------------
    const clock = new THREE.Clock();
    let previous = 0;
    let blinkAt = 2.2;
    let blinkProgress = -1;
    let blinkDouble = false;
    let nextGlitch = 5.5 + Math.random() * 4;
    let glitchUntil = 0;
    let mouthSmooth = 0;
    let frame = 0;
    let visible = true;

    const damp = (current: number, target: number, lambda: number) => current + (target - current) * lambda;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!visible) return;

      const time = clock.getElapsedTime();
      const dt = Math.min(0.05, time - previous || 0.016);
      previous = time;

      const currentState = stateRef.current;
      const motion = reduced ? 0.3 : 1;
      const palette = PALETTES[currentState] || PALETTES.idle;
      targetBody.setHex(palette.body);
      targetRim.setHex(palette.rim);
      targetAccent.setHex(palette.accent);

      const energyTarget = currentState === 'speaking' ? 0.55 + audioRef.current * 0.6
        : currentState === 'thinking' ? 0.45
        : currentState === 'listening' ? 0.3
        : 0.12;

      // Smooth palette + shader time.
      holoMaterials.forEach((material) => {
        const uniforms = material.uniforms;
        uniforms.uTime.value = time;
        uniforms.uEnergy.value = damp(uniforms.uEnergy.value, energyTarget, 0.08);
        (uniforms.uColor.value as THREE.Color).lerp(targetBody, 0.035);
        (uniforms.uRim.value as THREE.Color).lerp(targetRim, 0.035);
      });
      accentMat.color.lerp(tempColor.copy(targetAccent), 0.05);
      eyeWhiteMat.color.lerp(tempColor.copy(targetBody).offsetHSL(0, -0.25, 0.28), 0.05);
      irisMat.color.lerp(tempColor.copy(targetAccent), 0.05);
      haloMat.color.lerp(tempColor.copy(targetRim), 0.05);
      scanMat.color.lerp(tempColor.copy(targetAccent).offsetHSL(0, 0, 0.15), 0.06);
      orbitMat.color.lerp(tempColor.copy(targetRim), 0.04);
      moteMat.color.lerp(tempColor.copy(targetAccent).offsetHSL(0, 0, 0.12), 0.04);
      dustMat.color.lerp(tempColor.copy(targetRim), 0.04);

      // Breathing, weight shift and subtle sway.
      const breath = Math.sin(time * 1.55) * 0.008 * motion;
      const sway = Math.sin(time * 0.62) * 0.014 * motion;
      figure.position.y = breath;
      figure.rotation.y = damp(figure.rotation.y, pointerX * 0.11 + sway * 0.4, 0.035);
      figure.rotation.z = damp(figure.rotation.z, Math.sin(time * 0.4) * 0.006 * motion, 0.03);
      torso.scale.x = 1 + breath * 0.5;
      torso.scale.z = 0.74 + breath * 0.4;

      // Blink (occasionally a natural double blink).
      if (blinkProgress < 0 && time > blinkAt) {
        blinkProgress = 0;
      }
      let lidScale = 1;
      if (blinkProgress >= 0) {
        blinkProgress += dt * 6.5;
        lidScale = 1 - Math.sin(Math.min(1, blinkProgress) * Math.PI) * 0.92;
        if (blinkProgress >= 1) {
          blinkProgress = -1;
          if (!blinkDouble && Math.random() < 0.18) {
            blinkDouble = true;
            blinkAt = time + 0.18;
          } else {
            blinkDouble = false;
            blinkAt = time + 2.3 + Math.random() * 2.6;
          }
        }
      }
      eyeL.group.scale.y = lidScale;
      eyeR.group.scale.y = lidScale;

      // Gaze: follows the pointer, looks away when thinking.
      const thinking = currentState === 'thinking';
      const gazeX = thinking ? -0.006 : pointerX * 0.0065;
      const gazeY = thinking ? 0.008 : pointerY * 0.0045;
      [eyeL, eyeR].forEach((eye) => {
        eye.iris.position.x = damp(eye.iris.position.x, gazeX, 0.1);
        eye.iris.position.y = damp(eye.iris.position.y, gazeY, 0.1);
        eye.pupil.position.x = eye.iris.position.x;
        eye.pupil.position.y = eye.iris.position.y;
      });

      // Head pose + expression.
      let headX = -pointerY * 0.09;
      let headY = pointerX * 0.17;
      let headZ = 0;
      let browLift = 0;
      let browTilt = 0;
      let smile = 0;

      if (currentState === 'listening') {
        headX -= 0.035;
        headZ = 0.075;
        browLift = 0.005;
      } else if (currentState === 'thinking') {
        headX += 0.075;
        headY -= 0.16;
        headZ = -0.08;
        browLift = -0.004;
        browTilt = 0.16;
      } else if (currentState === 'speaking') {
        headX += Math.sin(time * 4.6) * 0.022 * motion;
        headZ = Math.sin(time * 2.3) * 0.018;
        smile = 0.0045;
      } else if (currentState === 'unavailable') {
        headX = 0.18;
        browLift = -0.006;
      } else {
        smile = 0.002;
      }

      head.rotation.x = damp(head.rotation.x, headX, 0.055);
      head.rotation.y = damp(head.rotation.y, headY, 0.055);
      head.rotation.z = damp(head.rotation.z, headZ, 0.055);

      [eyeL, eyeR].forEach((eye, index) => {
        const side = index === 0 ? -1 : 1;
        eye.brow.position.y = damp(eye.brow.position.y, 0.052 + browLift, 0.08);
        eye.brow.rotation.z = damp(eye.brow.rotation.z, side * 0.1 + side * browTilt, 0.08);
      });

      // Lip-sync driven by the real speech envelope.
      const speaking = currentState === 'speaking';
      const envelope = speaking ? Math.max(0.08, Math.min(1, audioRef.current)) : 0;
      const syllable = speaking ? Math.abs(Math.sin(time * 12.5)) * 0.25 + Math.abs(Math.sin(time * 7.3 + 1.2)) * 0.18 : 0;
      const targetMouth = speaking ? envelope * (0.55 + syllable) : 0.015;
      mouthSmooth = damp(mouthSmooth, targetMouth, speaking ? 0.4 : 0.18);

      cavity.scale.set(1.15 + mouthSmooth * 0.35, 0.22 + mouthSmooth * 0.9, 0.5);
      lowerLip.position.y = -0.005 - mouthSmooth * 0.013;
      upperLip.position.y = 0.005 + mouthSmooth * 0.004;
      mouth.scale.x = 1 + mouthSmooth * 0.12;
      mouth.position.y = -0.092 - mouthSmooth * 0.004;
      // A hint of a smile while listening / speaking.
      lowerLip.rotation.z = smile * 3.5;
      upperLip.rotation.z = -smile * 1.5;

      // Hair inertia and sway.
      strands.forEach((strand, index) => {
        strand.mesh.rotation.x = Math.sin(time * 1.55 + strand.phase) * 0.036 * motion - head.rotation.x * 0.22;
        strand.mesh.rotation.z = Math.sin(time * 1.15 + strand.phase + index * 0.4) * 0.025 * motion - head.rotation.y * 0.16;
      });
      fringe.rotation.z = Math.sin(time * 1.25) * 0.02 * motion;
      hair.rotation.y = damp(hair.rotation.y, -head.rotation.y * 0.1, 0.05);

      // Arms: distinct poses per state.
      const pose = (
        arm: typeof armL,
        shoulderZ: number,
        shoulderX: number,
        elbowX: number,
        wristX: number,
        curl: number,
      ) => {
        arm.shoulder.rotation.z = damp(arm.shoulder.rotation.z, shoulderZ, 0.05);
        arm.shoulder.rotation.x = damp(arm.shoulder.rotation.x, shoulderX, 0.05);
        arm.elbow.rotation.x = damp(arm.elbow.rotation.x, elbowX, 0.05);
        arm.wrist.rotation.x = damp(arm.wrist.rotation.x, wristX, 0.06);
        arm.fingers.forEach((finger) => {
          finger.rotation.x = damp(finger.rotation.x, curl, 0.08);
        });
      };

      if (currentState === 'listening') {
        pose(armR, -0.1, -0.5, -1.05, -0.25, -0.28);
        pose(armL, 0.08, 0.03, -0.28, -0.1, -0.12);
      } else if (currentState === 'thinking') {
        pose(armR, -0.14, -0.82, -1.62, -0.4, -0.72);
        pose(armL, 0.1, -0.08, -0.52, -0.16, -0.42);
      } else if (currentState === 'speaking') {
        const gesture = Math.sin(time * 2.9) * 0.14 * motion;
        pose(armR, -0.04 + gesture * 0.25, -0.34 + gesture, -0.78 + gesture, -0.28, -0.24);
        pose(armL, 0.04 - gesture * 0.2, -0.24 - gesture * 0.55, -0.62 - gesture, -0.22, -0.24);
      } else if (currentState === 'unavailable') {
        pose(armR, -0.04, 0.02, -0.26, -0.08, -0.1);
        pose(armL, 0.04, 0.02, -0.26, -0.08, -0.1);
      } else {
        const idleShift = Math.sin(time * 1.1) * 0.014 * motion;
        pose(armR, -0.05 + idleShift, 0.02, -0.24, -0.08, -0.14);
        pose(armL, 0.05 - idleShift, 0.02, -0.24, -0.08, -0.14);
      }

      // Halo + scan ring.
      const haloActive = currentState === 'thinking' || currentState === 'listening' || currentState === 'unavailable';
      haloMat.opacity = damp(haloMat.opacity, haloActive ? 0.45 : 0.13, 0.06);
      halo.visible = true;
      haloInner.visible = true;
      const haloSpin = currentState === 'thinking' ? 1.5 : 0.55;
      halo.rotation.z += dt * haloSpin;
      haloInner.rotation.z -= dt * haloSpin * 0.7;
      halo.scale.setScalar(1 + Math.sin(time * 2.4) * 0.015 * motion);
      haloInner.scale.setScalar(1 + Math.sin(time * 2.4 + 1) * 0.02 * motion);

      const scanPhase = (time * 0.33) % 1;
      scanRing.position.y = -0.92 + scanPhase * 1.95;
      scanMat.opacity = 0.22 * Math.sin(scanPhase * Math.PI) + 0.05;

      // Projection stage motion.
      stage.rotation.y += dt * 0.18 * motion;
      rings.forEach((ring, index) => {
        ring.rotation.z += dt * (index % 2 === 0 ? 0.22 : -0.3) * motion;
      });
      discMat.opacity = 0.12 + 0.04 * Math.sin(time * 2.1);
      discGlowMat.opacity = 0.05 + 0.02 * Math.sin(time * 1.7);
      coneMat.uniforms.uTime.value = time;
      coneMat.uniforms.uOpacity.value = damp(
        coneMat.uniforms.uOpacity.value,
        currentState === 'unavailable' ? 0.04 : currentState === 'idle' ? 0.08 : 0.12,
        0.05,
      );
      orbit.rotation.z += dt * 0.22 * motion;
      orbit2.rotation.z -= dt * 0.16 * motion;
      orbitMat.opacity = 0.16 + 0.08 * Math.sin(time * 1.9);

      // Data motes: rise and slowly orbit; converge slightly while listening.
      const positions = moteGeo.attributes.position.array as Float32Array;
      const converge = currentState === 'listening' ? 0.94 : 1;
      for (let i = 0; i < MOTE_COUNT; i++) {
        const iy = i * 3 + 1;
        positions[iy] += dt * moteSeeds[i * 3 + 1] * 0.7;
        if (positions[iy] > 1.15) {
          positions[iy] = -0.95;
          positions[i * 3] = (Math.random() - 0.5) * 1.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
        }
        const angle = moteSeeds[i * 3] + time * 0.12 * moteSeeds[i * 3 + 2];
        positions[i * 3] = positions[i * 3] * 0.995 + Math.cos(angle) * 0.0009 * converge;
        positions[i * 3 + 2] = positions[i * 3 + 2] * 0.995 + Math.sin(angle) * 0.0009;
      }
      moteGeo.attributes.position.needsUpdate = true;
      const dustPositionsArray = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < DUST_COUNT; i++) {
        const iy = i * 3 + 1;
        dustPositionsArray[iy] += dt * 0.018;
        if (dustPositionsArray[iy] > 1.4) dustPositionsArray[iy] = -1.0;
      }
      dustGeo.attributes.position.needsUpdate = true;

      // Occasional holographic glitch: a brief offset + brightness spike.
      if (time > nextGlitch) {
        glitchUntil = time + 0.1 + Math.random() * 0.08;
        nextGlitch = time + 5.5 + Math.random() * 6;
      }
      if (time < glitchUntil) {
        figure.position.x = (Math.random() - 0.5) * 0.012;
        holoMaterials.forEach((material) => {
          material.uniforms.uOpacity.value = Math.min(1, material.uniforms.uOpacity.value + 0.06);
          material.uniforms.uScan.value = 26 + Math.random() * 10;
        });
      } else {
        figure.position.x = damp(figure.position.x, 0, 0.2);
        holoMaterials.forEach((material) => {
          const base = (material.userData.baseOpacity as number) ?? material.uniforms.uOpacity.value;
          material.uniforms.uOpacity.value = damp(material.uniforms.uOpacity.value, base, 0.1);
        });
      }

      // Head follows a little of the figure rotation for natural parallax.
      camera.position.x = damp(camera.position.x, pointerX * 0.05, 0.04);
      camera.lookAt(0, 0.16, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Pause rendering when the hologram leaves the viewport or the tab is hidden.
    const visibility = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? true; },
      { threshold: 0.02 },
    );
    visibility.observe(container);
    const onVisibilityChange = () => {
      visible = !document.hidden;
      if (!document.hidden) clock.getDelta();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const resizeObserver = new ResizeObserver(() => {
      const w = width();
      const h = height();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mouseleave', onPointerLeave);
      disposables.forEach((item) => {
        try { item.dispose(); } catch { /* already disposed */ }
      });
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry && !disposables.includes(mesh.geometry as any)) {
          try { mesh.geometry.dispose(); } catch { /* noop */ }
        }
      });
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (webglFailed) {
    return (
      <div className={`flex items-center justify-center text-center p-6 text-xs text-cyan-200 ${className}`}>
        LYNARA — WebGL indisponible sur cet appareil. Le chat vocal et textuel reste utilisable.
      </div>
    );
  }

  const statusLabel = state === 'speaking'
    ? t.lynara.speaking
    : state === 'listening'
      ? t.lynara.listening
      : state === 'thinking'
        ? t.lynara.thinking
        : state === 'unavailable'
          ? t.common.unavailable
          : t.lynara.onlineStatus;

  const statusDot = state === 'speaking'
    ? 'bg-amber-300 animate-ping'
    : state === 'listening'
      ? 'bg-cyan-300 animate-pulse'
      : state === 'thinking'
        ? 'bg-violet-300 animate-pulse'
        : state === 'unavailable'
          ? 'bg-rose-400'
          : 'bg-emerald-300';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full min-h-[400px] max-h-[560px]"
        role="img"
        aria-label="LYNARA, assistante virtuelle féminine holographique en trois dimensions"
      />
      {/* Framing corners, like a projection chamber. */}
      <div className="pointer-events-none absolute inset-5 sm:inset-7">
        <span className="absolute top-0 left-0 w-5 h-5 border-t border-l border-cyan-300/30 rounded-tl" />
        <span className="absolute top-0 right-0 w-5 h-5 border-t border-r border-cyan-300/30 rounded-tr" />
        <span className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-cyan-300/30 rounded-bl" />
        <span className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-cyan-300/30 rounded-br" />
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/75 border border-cyan-400/30 backdrop-blur-md pointer-events-none shadow-lg shadow-cyan-500/10">
        <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
        <span className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-cyan-200">
          {statusLabel}
        </span>
      </div>
    </div>
  );
};
