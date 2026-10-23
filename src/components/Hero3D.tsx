import { useEffect, useRef } from "react";

/**
 * Living network — the hero backdrop, final form.
 *
 * No 3D object at all: an emerald aurora shader (fbm noise, mouse-reactive
 * glow) breathes behind a network of drifting nodes. The net feels alive
 * rather than hollow because things HAPPEN in it:
 *  - data pulses travel the links node-to-node and flash their target
 *  - the cursor links itself to the nearest nodes and gently pushes them
 *  - nodes sit at different depths, so mouse parallax separates the layers
 *
 * Performance chassis: 5 draw calls, DPR capped at 1.5 with adaptive
 * step-down, render loop pauses off-screen, reduced motion = one frame.
 */

const LINK_DIST = 1.75;
const MAX_PULSES = 10;

interface NodeDef {
  bx: number;
  by: number;
  bz: number;
  phase: number;
  speed: number;
  base: number; // depth brightness 0.45..1
  flash: number;
}

interface Pulse {
  a: number;
  b: number;
  start: number;
  dur: number;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.045;
    float n = fbm(uv * vec2(3.0, 2.2) + vec2(t, t * 0.6));
    float n2 = fbm(uv * vec2(5.5, 4.0) - vec2(t * 0.7, 0.0));
    float nebula = smoothstep(0.42, 0.95, n * 0.75 + n2 * 0.45);

    vec3 deep = vec3(0.012, 0.027, 0.031);
    vec3 emeraldGlow = vec3(0.015, 0.135, 0.088);
    vec3 col = mix(deep, emeraldGlow, nebula * 0.85);

    // Cursor glow — a soft emerald bloom that follows the pointer
    vec2 m = uMouse;
    float d = distance(vec2(uv.x * 1.6, uv.y), vec2(m.x * 1.6, m.y));
    col += vec3(0.02, 0.16, 0.10) * exp(-d * 3.2) * 0.55;

    // Keep the left (headline) side calmer
    col *= 0.72 + 0.28 * uv.x;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Hero3D({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const mount = mountRef.current;
      if (!mount || disposed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const small = window.innerWidth < 768;
      const NODE_COUNT = small ? 85 : 150;

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
      });
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,
        mount.clientWidth / Math.max(mount.clientHeight, 1),
        0.1,
        100
      );
      camera.position.set(0, 0, 7);

      const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(25)) * 7;
      const viewW = viewH * camera.aspect;

      const emerald = new THREE.Color("hsl(160, 84%, 50%)");

      // --- Aurora shader backdrop ---
      const auroraMat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.72, 0.55) },
        },
        depthWrite: false,
        depthTest: false,
      });
      const aurora = new THREE.Mesh(
        new THREE.PlaneGeometry(viewW * 1.8, viewH * 1.8),
        auroraMat
      );
      aurora.position.z = -3.5;
      aurora.renderOrder = -1;
      scene.add(aurora);

      const group = new THREE.Group();
      scene.add(group);

      // --- Nodes at varied depths ---
      const nodes: NodeDef[] = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        const right = Math.random() < 0.62;
        const x = right
          ? viewW * (Math.random() * 0.58 - 0.06)
          : viewW * (Math.random() * 0.46 - 0.5);
        const z = (Math.random() - 0.5) * 2.4;
        nodes.push({
          bx: x,
          by: (Math.random() - 0.5) * viewH * 0.98,
          bz: z,
          phase: Math.random() * Math.PI * 2,
          speed: 0.1 + Math.random() * 0.22,
          base: 0.45 + ((z + 1.2) / 2.4) * 0.55,
          flash: 0,
        });
      }

      const nodePos = new Float32Array(NODE_COUNT * 3);
      const nodeCol = new Float32Array(NODE_COUNT * 3);
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
      nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));
      const nodePts = new THREE.Points(
        nodeGeo,
        new THREE.PointsMaterial({
          size: 0.065,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      group.add(nodePts);

      // --- Links between near nodes ---
      const pairs: Array<[number, number]> = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (Math.hypot(a.bx - b.bx, a.by - b.by, a.bz - b.bz) < LINK_DIST) {
            pairs.push([i, j]);
          }
        }
      }
      const linkPos = new Float32Array(pairs.length * 6);
      const linkCol = new Float32Array(pairs.length * 6);
      const linkGeo = new THREE.BufferGeometry();
      linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPos, 3));
      linkGeo.setAttribute("color", new THREE.BufferAttribute(linkCol, 3));
      const linkLines = new THREE.LineSegments(
        linkGeo,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      group.add(linkLines);

      // --- Data pulses travelling the links ---
      const pulses: Pulse[] = [];
      const pulsePos = new Float32Array(MAX_PULSES * 3);
      const pulseCol = new Float32Array(MAX_PULSES * 3);
      const pulseGeo = new THREE.BufferGeometry();
      pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
      pulseGeo.setAttribute("color", new THREE.BufferAttribute(pulseCol, 3));
      const pulsePts = new THREE.Points(
        pulseGeo,
        new THREE.PointsMaterial({
          size: 0.15,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      group.add(pulsePts);

      // --- Cursor link lines (cursor -> 3 nearest nodes) ---
      const CURSOR_LINKS = 3;
      const clPos = new Float32Array(CURSOR_LINKS * 6);
      const clCol = new Float32Array(CURSOR_LINKS * 6);
      const clGeo = new THREE.BufferGeometry();
      clGeo.setAttribute("position", new THREE.BufferAttribute(clPos, 3));
      clGeo.setAttribute("color", new THREE.BufferAttribute(clCol, 3));
      const clLines = new THREE.LineSegments(
        clGeo,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      group.add(clLines);

      // --- Interaction state ---
      let mouseX = 9999;
      let mouseY = 9999;
      let parX = 0;
      let parY = 0;
      let parTX = 0;
      let parTY = 0;
      const onMove = (e: MouseEvent) => {
        const r = mount.getBoundingClientRect();
        if (r.height === 0) return;
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        mouseX = (nx - 0.5) * viewW;
        mouseY = -(ny - 0.5) * viewH;
        parTX = (e.clientX / window.innerWidth - 0.5) * 2;
        parTY = (e.clientY / window.innerHeight - 0.5) * 2;
        (auroraMat.uniforms.uMouse.value as import("three").Vector2).set(nx, 1 - ny);
      };
      const onLeave = () => {
        mouseX = 9999;
        mouseY = 9999;
      };
      window.addEventListener("mousemove", onMove);
      document.documentElement.addEventListener("mouseleave", onLeave);

      const onResize = () => {
        if (!mount.clientWidth) return;
        camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener("resize", onResize);

      const spawnPulse = (t: number) => {
        if (pulses.length >= MAX_PULSES || pairs.length === 0) return;
        const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
        pulses.push({
          a: Math.random() < 0.5 ? a : b,
          b: Math.random() < 0.5 ? b : a,
          start: t,
          dur: 0.9 + Math.random() * 0.7,
        });
      };

      const update = (t: number) => {
        auroraMat.uniforms.uTime.value = t;

        // Nodes: drift + cursor repulsion + flash decay + twinkle
        for (let i = 0; i < NODE_COUNT; i++) {
          const n = nodes[i];
          let x = n.bx + Math.sin(t * n.speed + n.phase) * 0.13;
          let y = n.by + Math.cos(t * n.speed * 0.8 + n.phase) * 0.13;
          const dx = x - mouseX;
          const dy = y - mouseY;
          const d2 = dx * dx + dy * dy;
          const R = 1.35;
          if (d2 < R * R && d2 > 0.0001) {
            const d = Math.sqrt(d2);
            const push = ((R - d) / R) * 0.38;
            x += (dx / d) * push;
            y += (dy / d) * push;
          }
          nodePos[i * 3] = x;
          nodePos[i * 3 + 1] = y;
          nodePos[i * 3 + 2] = n.bz;

          n.flash *= 0.94;
          const twinkle = 0.82 + 0.18 * Math.sin(t * 1.4 + n.phase * 3);
          const bright = n.base * twinkle * (1 + n.flash * 1.7) * 0.6;
          nodeCol[i * 3] = emerald.r * bright;
          nodeCol[i * 3 + 1] = emerald.g * bright;
          nodeCol[i * 3 + 2] = emerald.b * bright;
        }
        nodeGeo.attributes.position.needsUpdate = true;
        nodeGeo.attributes.color.needsUpdate = true;

        // Links
        for (let p = 0; p < pairs.length; p++) {
          const a = pairs[p][0];
          const b = pairs[p][1];
          const vi = p * 6;
          linkPos[vi] = nodePos[a * 3];
          linkPos[vi + 1] = nodePos[a * 3 + 1];
          linkPos[vi + 2] = nodePos[a * 3 + 2];
          linkPos[vi + 3] = nodePos[b * 3];
          linkPos[vi + 4] = nodePos[b * 3 + 1];
          linkPos[vi + 5] = nodePos[b * 3 + 2];
          const ba = nodes[a].base * 0.16;
          const bb = nodes[b].base * 0.16;
          linkCol[vi] = emerald.r * ba;
          linkCol[vi + 1] = emerald.g * ba;
          linkCol[vi + 2] = emerald.b * ba;
          linkCol[vi + 3] = emerald.r * bb;
          linkCol[vi + 4] = emerald.g * bb;
          linkCol[vi + 5] = emerald.b * bb;
        }
        linkGeo.attributes.position.needsUpdate = true;
        linkGeo.attributes.color.needsUpdate = true;

        // Pulses
        pulseCol.fill(0);
        for (let i = pulses.length - 1; i >= 0; i--) {
          const pu = pulses[i];
          const p = (t - pu.start) / pu.dur;
          if (p >= 1) {
            nodes[pu.b].flash = 1;
            pulses.splice(i, 1);
            continue;
          }
          const ax = nodePos[pu.a * 3];
          const ay = nodePos[pu.a * 3 + 1];
          const az = nodePos[pu.a * 3 + 2];
          pulsePos[i * 3] = ax + (nodePos[pu.b * 3] - ax) * p;
          pulsePos[i * 3 + 1] = ay + (nodePos[pu.b * 3 + 1] - ay) * p;
          pulsePos[i * 3 + 2] = az + (nodePos[pu.b * 3 + 2] - az) * p;
          const env = Math.sin(p * Math.PI);
          pulseCol[i * 3] = emerald.r * env;
          pulseCol[i * 3 + 1] = emerald.g * env;
          pulseCol[i * 3 + 2] = emerald.b * env;
        }
        pulseGeo.attributes.position.needsUpdate = true;
        pulseGeo.attributes.color.needsUpdate = true;

        // Cursor links: nearest nodes within reach
        clCol.fill(0);
        if (mouseX < 9000) {
          const near: Array<{ i: number; d: number }> = [];
          for (let i = 0; i < NODE_COUNT; i++) {
            const d = Math.hypot(nodePos[i * 3] - mouseX, nodePos[i * 3 + 1] - mouseY);
            if (d < 2.1) near.push({ i, d });
          }
          near.sort((a, b) => a.d - b.d);
          near.slice(0, CURSOR_LINKS).forEach((n, k) => {
            const vi = k * 6;
            clPos[vi] = mouseX;
            clPos[vi + 1] = mouseY;
            clPos[vi + 2] = 0.4;
            clPos[vi + 3] = nodePos[n.i * 3];
            clPos[vi + 4] = nodePos[n.i * 3 + 1];
            clPos[vi + 5] = nodePos[n.i * 3 + 2];
            const fade = (1 - n.d / 2.1) * 0.55;
            clCol[vi] = emerald.r * fade;
            clCol[vi + 1] = emerald.g * fade;
            clCol[vi + 2] = emerald.b * fade;
            clCol[vi + 3] = emerald.r * fade * 0.6;
            clCol[vi + 4] = emerald.g * fade * 0.6;
            clCol[vi + 5] = emerald.b * fade * 0.6;
          });
        }
        clGeo.attributes.position.needsUpdate = true;
        clGeo.attributes.color.needsUpdate = true;

        // Depth parallax
        parX += (parTX - parX) * 0.04;
        parY += (parTY - parY) * 0.04;
        group.rotation.y = parX * 0.05;
        group.rotation.x = -parY * 0.035;
      };

      // --- Loop chassis: visibility pause + adaptive quality ---
      let raf = 0;
      let running = false;
      const clock = new THREE.Clock();
      let nextPulse = 0.3;
      let frames = 0;
      let windowStart = performance.now();
      let dprSteps = 0;

      const tick = () => {
        if (!running) return;
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        if (t >= nextPulse) {
          spawnPulse(t);
          nextPulse = t + 0.45 + Math.random() * 0.7;
        }
        update(t);
        renderer.render(scene, camera);

        frames++;
        const now = performance.now();
        if (now - windowStart >= 2000) {
          const fps = (frames * 1000) / (now - windowStart);
          frames = 0;
          windowStart = now;
          if (fps < 45 && dprSteps < 2 && dpr > 1) {
            dprSteps++;
            dpr = Math.max(1, dpr - 0.25);
            renderer.setPixelRatio(dpr);
          }
        }
      };
      const start = () => {
        if (running || reduced) return;
        running = true;
        clock.getDelta();
        tick();
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) start();
          else stop();
        },
        { threshold: 0.02 }
      );
      io.observe(mount);

      if (reduced) {
        update(1.6);
        renderer.render(scene, camera);
      } else {
        start();
      }

      cleanup = () => {
        stop();
        io.disconnect();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        document.documentElement.removeEventListener("mouseleave", onLeave);
        nodeGeo.dispose();
        linkGeo.dispose();
        pulseGeo.dispose();
        clGeo.dispose();
        aurora.geometry.dispose();
        auroraMat.dispose();
        (nodePts.material as import("three").Material).dispose();
        (linkLines.material as import("three").Material).dispose();
        (pulsePts.material as import("three").Material).dispose();
        (clLines.material as import("three").Material).dispose();
        renderer.dispose();
        if (renderer.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
