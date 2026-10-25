import { useEffect, useRef } from "react";

/**
 * Living network — the hero backdrop, final form.
 *
 * No 3D object at all: an emerald aurora shader (fbm noise, mouse-reactive
 * glow) breathes behind a network of drifting nodes. The net feels alive
 * rather than hollow because things HAPPEN in it:
 *  - data pulses travel the links node-to-node and flash their target
 *  - the cursor links itself to the nearest nodes, swells the net with
 *    light around it (nodes and links brighten near the pointer) and
 *    gently pushes the nodes away
 *  - nodes sit at different depths, so mouse parallax separates the layers
 *
 * Performance chassis: 5 draw calls, DPR capped at 1.5 with adaptive
 * step-down, render loop pauses off-screen, reduced motion = one frame.
 */

const LINK_DIST = 1.75;
const MAX_PULSES = 16;

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

interface Ping {
  x: number;
  y: number;
  z: number;
  start: number;
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
  uniform float uLight;

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

    float d = distance(vec2(uv.x * 1.6, uv.y), vec2(uMouse.x * 1.6, uMouse.y));
    float glow = exp(-d * 3.2);

    // Dark theme: near-black depth with a faint emerald nebula — kept
    // deliberately dim (2026-10-25 readability pass) so hero copy keeps
    // full contrast over the shader in both themes
    vec3 darkCol = mix(vec3(0.012, 0.027, 0.031), vec3(0.008, 0.070, 0.046), nebula);
    darkCol += vec3(0.01, 0.08, 0.05) * glow * 0.35;
    darkCol *= 0.72 + 0.28 * uv.x;

    // Light theme: pale paper with a soft mint nebula and a gentle tint
    vec3 lightCol = mix(vec3(0.945, 0.972, 0.955), vec3(0.80, 0.92, 0.855), nebula * 0.38);
    lightCol = mix(lightCol, vec3(0.62, 0.85, 0.72), glow * 0.12);
    lightCol *= 0.97 + 0.03 * uv.x;

    gl_FragColor = vec4(mix(darkCol, lightCol, uLight), 1.0);
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
      const deepEmerald = new THREE.Color("hsl(160, 85%, 27%)");
      const pale = new THREE.Color("hsl(155, 32%, 90%)");

      // Theme awareness: next-themes toggles .dark on <html>. The whole
      // scene re-skins on toggle — shader mixes to a pale variant and the
      // additive glow (invisible on white) becomes normal blending with
      // deep emerald ink on a pale ground.
      const theme = {
        light: !document.documentElement.classList.contains("dark"),
      };

      // --- Aurora shader backdrop ---
      const auroraMat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.72, 0.55) },
          uLight: { value: theme.light ? 1 : 0 },
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
          opacity: 0.65,
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

      // --- Cursor link lines (cursor -> 4 nearest nodes) ---
      const CURSOR_LINKS = 4;
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

      // --- Theme switching (shader variant + blending mode) ---
      const applyTheme = () => {
        const blending = theme.light
          ? THREE.NormalBlending
          : THREE.AdditiveBlending;
        for (const m of [
          nodePts.material,
          linkLines.material,
          pulsePts.material,
          clLines.material,
        ] as import("three").Material[]) {
          m.blending = blending;
          m.needsUpdate = true;
        }
        auroraMat.uniforms.uLight.value = theme.light ? 1 : 0;
      };
      applyTheme();
      const themeObserver = new MutationObserver(() => {
        const light = !document.documentElement.classList.contains("dark");
        if (light === theme.light) return;
        theme.light = light;
        applyTheme();
        if (reduced) {
          update(1.6);
          renderer.render(scene, camera);
        }
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

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

      // Sonar pings: waves that flash nodes as the front passes. Fired
      // periodically from a random node, and from any click in the hero.
      const pings: Ping[] = [];
      let lastT = 0;
      const firePing = (x: number, y: number, z: number, at: number) => {
        pings.push({ x, y, z, start: at });
        if (pings.length > 3) pings.shift();
      };
      const onTap = (e: PointerEvent) => {
        if (reduced) return;
        const r = mount.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          return;
        firePing(
          ((e.clientX - r.left) / r.width - 0.5) * viewW,
          -((e.clientY - r.top) / r.height - 0.5) * viewH,
          0,
          lastT
        );
      };
      window.addEventListener("pointerdown", onTap);

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

      // Palette writer: dark theme scales emerald toward black (additive
      // glow); light theme lerps pale ground toward deep emerald ink.
      const put = (
        arr: Float32Array,
        o: number,
        darkScale: number,
        lightF: number
      ) => {
        if (theme.light) {
          const f = Math.max(0, Math.min(1, lightF));
          arr[o] = pale.r + (deepEmerald.r - pale.r) * f;
          arr[o + 1] = pale.g + (deepEmerald.g - pale.g) * f;
          arr[o + 2] = pale.b + (deepEmerald.b - pale.b) * f;
        } else {
          arr[o] = emerald.r * darkScale;
          arr[o + 1] = emerald.g * darkScale;
          arr[o + 2] = emerald.b * darkScale;
        }
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
          let effFlash = n.flash;
          for (const pg of pings) {
            const age = t - pg.start;
            if (age < 0 || age > 2.8) continue;
            const radius = age * 3.4;
            const dd = Math.hypot(x - pg.x, y - pg.y, n.bz - pg.z);
            const band = Math.exp(-((dd - radius) * (dd - radius)) / 0.3);
            const g = band * Math.max(0, 1 - age / 2.8);
            if (g > effFlash) effFlash = g;
          }
          const twinkle = 0.82 + 0.18 * Math.sin(t * 1.4 + n.phase * 3);
          // Cursor aura: nodes near the pointer swell with light, so
          // the net visibly leans toward the visitor's hand.
          let cursorGlow = 0;
          if (mouseX < 9000) {
            const cd = Math.hypot(x - mouseX, y - mouseY);
            if (cd < 1.7) cursorGlow = (1 - cd / 1.7) ** 2;
          }
          const bright =
            n.base * twinkle * (1 + effFlash * 1.1) * 0.3 * (1 + cursorGlow * 0.6);
          put(nodeCol, i * 3, bright, bright * 1.3);
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
          // Links near the cursor light up, tracing the net's attention.
          let linkBoost = 1;
          if (mouseX < 9000) {
            const mxp = (linkPos[vi] + linkPos[vi + 3]) / 2;
            const myp = (linkPos[vi + 1] + linkPos[vi + 4]) / 2;
            const cd = Math.hypot(mxp - mouseX, myp - mouseY);
            if (cd < 1.9) linkBoost = 1 + (1 - cd / 1.9) * 1.1;
          }
          put(linkCol, vi, nodes[a].base * 0.07 * linkBoost, nodes[a].base * 0.34);
          put(linkCol, vi + 3, nodes[b].base * 0.07 * linkBoost, nodes[b].base * 0.34);
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
          put(pulseCol, i * 3, env * 0.5, 0.18 + env * 0.4);
        }
        pulseGeo.attributes.position.needsUpdate = true;
        pulseGeo.attributes.color.needsUpdate = true;

        // Cursor links: nearest nodes within reach
        clCol.fill(0);
        if (mouseX < 9000) {
          const near: Array<{ i: number; d: number }> = [];
          for (let i = 0; i < NODE_COUNT; i++) {
            const d = Math.hypot(nodePos[i * 3] - mouseX, nodePos[i * 3 + 1] - mouseY);
            if (d < 2.3) near.push({ i, d });
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
            const fade = (1 - n.d / 2.3) * 0.32;
            put(clCol, vi, fade, fade * 1.6);
            put(clCol, vi + 3, fade * 0.6, fade * 1.1);
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
      let nextPing = 2.2;
      let frames = 0;
      let windowStart = performance.now();
      let dprSteps = 0;

      const tick = () => {
        if (!running) return;
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        lastT = t;
        if (t >= nextPulse) {
          spawnPulse(t);
          nextPulse = t + 0.26 + Math.random() * 0.45;
        }
        if (t >= nextPing) {
          const src = nodes[Math.floor(Math.random() * nodes.length)];
          firePing(src.bx, src.by, src.bz, t);
          nextPing = t + 4.5 + Math.random() * 2.5;
        }
        for (let i = pings.length - 1; i >= 0; i--) {
          if (t - pings[i].start > 2.8) pings.splice(i, 1);
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
        themeObserver.disconnect();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointerdown", onTap);
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
