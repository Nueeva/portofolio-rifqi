import { useEffect, useRef } from "react";

/**
 * ThreatGlobe — a "live attack map" hero backdrop in vanilla three.js.
 *
 * A dot-matrix globe (fibonacci sphere, points dimmed by facing so the far
 * side fades) slowly rotates on the right side of the hero. Brighter city
 * nodes on its surface are linked by animated attack arcs: a glowing head
 * travels a lifted bezier between two cities, trailing a fading arc, and
 * lands with an expanding ripple ring — the Kaspersky threat-map language.
 *
 * Performance chassis (same discipline as before):
 *  - ~6 draw calls, additive blending instead of post-processing
 *  - DPR capped at 1.5, no antialiasing, loop pauses off-screen
 *  - adaptive DPR step-down if sustained FPS < 45
 *  - reduced motion renders one static frame with a few frozen arcs
 */

const ARC_SEGS = 42;
const MAX_ARCS = 12;
const MAX_RIPPLES = 6;

interface City {
  p: import("three").Vector3;
}

interface Arc {
  a: import("three").Vector3;
  b: import("three").Vector3;
  ctrl: import("three").Vector3;
  start: number;
  dur: number;
  done: boolean;
}

interface Ripple {
  mesh: import("three").Mesh;
  start: number;
  active: boolean;
}

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
      camera.position.set(0, 1.05, 7);

      const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(25)) * 7;
      const viewW = viewH * camera.aspect;

      const group = new THREE.Group();
      const globeX = viewW * (small ? 0.1 : 0.235);
      group.position.set(globeX, viewH * 0.02, 0);
      scene.add(group);
      camera.lookAt(globeX, 0, 0);

      const globe = new THREE.Group();
      group.add(globe);

      const R = Math.min(viewH * 0.335, viewW * (small ? 0.42 : 0.3));

      const emerald = new THREE.Color("hsl(160, 84%, 50%)");
      const arcColor = new THREE.Color("hsl(158, 95%, 58%)");

      // --- Dot-matrix sphere (fibonacci) with per-point facing brightness ---
      const dotCount = small ? 650 : 1200;
      const dotPos = new Float32Array(dotCount * 3);
      const dotCol = new Float32Array(dotCount * 3);
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < dotCount; i++) {
        const y = 1 - (i / (dotCount - 1)) * 2;
        const rad = Math.sqrt(Math.max(0, 1 - y * y));
        const th = golden * i;
        dotPos[i * 3] = Math.cos(th) * rad * R;
        dotPos[i * 3 + 1] = y * R;
        dotPos[i * 3 + 2] = Math.sin(th) * rad * R;
      }
      const dotGeo = new THREE.BufferGeometry();
      dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
      dotGeo.setAttribute("color", new THREE.BufferAttribute(dotCol, 3));
      const dots = new THREE.Points(
        dotGeo,
        new THREE.PointsMaterial({
          size: 0.05,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      globe.add(dots);

      // --- Cities: brighter nodes, the arc endpoints ---
      const cities: City[] = [];
      const cityStride = Math.floor(dotCount / 30);
      for (let i = 0; i < dotCount && cities.length < 30; i += cityStride) {
        cities.push({
          p: new THREE.Vector3(dotPos[i * 3], dotPos[i * 3 + 1], dotPos[i * 3 + 2]),
        });
      }
      const cityPos = new Float32Array(cities.length * 3);
      const cityCol = new Float32Array(cities.length * 3);
      cities.forEach((c, i) => {
        cityPos[i * 3] = c.p.x;
        cityPos[i * 3 + 1] = c.p.y;
        cityPos[i * 3 + 2] = c.p.z;
      });
      const cityGeo = new THREE.BufferGeometry();
      cityGeo.setAttribute("position", new THREE.BufferAttribute(cityPos, 3));
      cityGeo.setAttribute("color", new THREE.BufferAttribute(cityCol, 3));
      const cityPts = new THREE.Points(
        cityGeo,
        new THREE.PointsMaterial({
          size: 0.11,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      globe.add(cityPts);

      // --- Arc pool: one LineSegments for every arc ---
      const arcVertCount = MAX_ARCS * ARC_SEGS * 2;
      const arcPos = new Float32Array(arcVertCount * 3);
      const arcCol = new Float32Array(arcVertCount * 3);
      const arcGeo = new THREE.BufferGeometry();
      arcGeo.setAttribute("position", new THREE.BufferAttribute(arcPos, 3));
      arcGeo.setAttribute("color", new THREE.BufferAttribute(arcCol, 3));
      const arcLines = new THREE.LineSegments(
        arcGeo,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      globe.add(arcLines);

      // Arc heads: one Points cloud, one vertex per arc
      const headPos = new Float32Array(MAX_ARCS * 3);
      const headCol = new Float32Array(MAX_ARCS * 3);
      const headGeo = new THREE.BufferGeometry();
      headGeo.setAttribute("position", new THREE.BufferAttribute(headPos, 3));
      headGeo.setAttribute("color", new THREE.BufferAttribute(headCol, 3));
      const heads = new THREE.Points(
        headGeo,
        new THREE.PointsMaterial({
          size: 0.16,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      globe.add(heads);

      // --- Ripple pool ---
      const ripples: Ripple[] = [];
      const rippleGeo = new THREE.RingGeometry(0.86, 1, 40);
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const mesh = new THREE.Mesh(
          rippleGeo,
          new THREE.MeshBasicMaterial({
            color: arcColor,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        mesh.visible = false;
        globe.add(mesh);
        ripples.push({ mesh, start: 0, active: false });
      }
      const fireRipple = (at: import("three").Vector3, now: number) => {
        const r = ripples.find((x) => !x.active);
        if (!r) return;
        r.active = true;
        r.start = now;
        r.mesh.visible = true;
        r.mesh.position.copy(at);
        const normal = at.clone().normalize();
        r.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      };

      // --- Arc lifecycle ---
      const arcs: Arc[] = [];
      const bezier = (
        arc: Arc,
        s: number,
        out: import("three").Vector3
      ) => {
        const u = 1 - s;
        out.set(
          u * u * arc.a.x + 2 * u * s * arc.ctrl.x + s * s * arc.b.x,
          u * u * arc.a.y + 2 * u * s * arc.ctrl.y + s * s * arc.b.y,
          u * u * arc.a.z + 2 * u * s * arc.ctrl.z + s * s * arc.b.z
        );
        return out;
      };
      const spawnArc = (now: number) => {
        if (arcs.length >= MAX_ARCS) return;
        for (let tries = 0; tries < 8; tries++) {
          const a = cities[Math.floor(Math.random() * cities.length)].p;
          const b = cities[Math.floor(Math.random() * cities.length)].p;
          if (a === b) continue;
          const chord = a.distanceTo(b);
          if (chord < R * 0.75 || chord > R * 1.9) continue;
          const ctrl = a
            .clone()
            .add(b)
            .multiplyScalar(0.5)
            .normalize()
            .multiplyScalar(R + R * 0.16 + chord * 0.22);
          arcs.push({ a, b, ctrl, start: now, dur: 2.1 + Math.random() * 0.9, done: false });
          return;
        }
      };

      // Facing factor for a globe-local point given current Y rotation
      const facing = (x: number, z: number, sin: number, cos: number) => {
        const zr = -x * sin + z * cos;
        return 0.12 + 0.88 * Math.min(1, Math.max(0, zr / R * 0.5 + 0.5));
      };

      const tmpV = new THREE.Vector3();
      const update = (t: number) => {
        const rot = t * 0.05;
        globe.rotation.y = rot;
        const sin = Math.sin(rot);
        const cos = Math.cos(rot);

        for (let i = 0; i < dotCount; i++) {
          const f = facing(dotPos[i * 3], dotPos[i * 3 + 2], sin, cos) * 0.55;
          dotCol[i * 3] = emerald.r * f;
          dotCol[i * 3 + 1] = emerald.g * f;
          dotCol[i * 3 + 2] = emerald.b * f;
        }
        dotGeo.attributes.color.needsUpdate = true;

        cities.forEach((c, i) => {
          const f = facing(c.p.x, c.p.z, sin, cos);
          const pulse = 0.8 + 0.2 * Math.sin(t * 2 + i * 1.7);
          cityCol[i * 3] = emerald.r * f * pulse;
          cityCol[i * 3 + 1] = emerald.g * f * pulse;
          cityCol[i * 3 + 2] = emerald.b * f * pulse;
        });
        cityGeo.attributes.color.needsUpdate = true;

        // Arcs
        arcCol.fill(0);
        for (let ai = 0; ai < MAX_ARCS; ai++) {
          const arc = arcs[ai];
          headCol[ai * 3] = 0;
          headCol[ai * 3 + 1] = 0;
          headCol[ai * 3 + 2] = 0;
          if (!arc) continue;
          const p = Math.min(1, (t - arc.start) / arc.dur);
          if (p >= 1 && !arc.done) {
            arc.done = true;
            fireRipple(arc.b, t);
          }
          const fade = p > 0.82 ? Math.max(0, (1 - p) / 0.18) : 1;
          const base = ai * ARC_SEGS * 2;
          for (let s = 0; s < ARC_SEGS; s++) {
            const s0 = s / ARC_SEGS;
            const s1 = (s + 1) / ARC_SEGS;
            const vi = (base + s * 2) * 3;
            bezier(arc, s0, tmpV);
            arcPos[vi] = tmpV.x;
            arcPos[vi + 1] = tmpV.y;
            arcPos[vi + 2] = tmpV.z;
            const f0 = facing(tmpV.x, tmpV.z, sin, cos);
            bezier(arc, s1, tmpV);
            arcPos[vi + 3] = tmpV.x;
            arcPos[vi + 4] = tmpV.y;
            arcPos[vi + 5] = tmpV.z;
            const f1 = facing(tmpV.x, tmpV.z, sin, cos);
            const lit = (ss: number) => (ss <= p ? (0.15 + 0.85 * (p > 0 ? ss / p : 1)) * fade : 0);
            const c0 = lit(s0) * f0;
            const c1 = lit(s1) * f1;
            arcCol[vi] = arcColor.r * c0;
            arcCol[vi + 1] = arcColor.g * c0;
            arcCol[vi + 2] = arcColor.b * c0;
            arcCol[vi + 3] = arcColor.r * c1;
            arcCol[vi + 4] = arcColor.g * c1;
            arcCol[vi + 5] = arcColor.b * c1;
          }
          if (p < 1) {
            bezier(arc, p, tmpV);
            headPos[ai * 3] = tmpV.x;
            headPos[ai * 3 + 1] = tmpV.y;
            headPos[ai * 3 + 2] = tmpV.z;
            const hf = facing(tmpV.x, tmpV.z, sin, cos);
            headCol[ai * 3] = arcColor.r * hf;
            headCol[ai * 3 + 1] = arcColor.g * hf;
            headCol[ai * 3 + 2] = arcColor.b * hf;
          }
        }
        arcGeo.attributes.position.needsUpdate = true;
        arcGeo.attributes.color.needsUpdate = true;
        headGeo.attributes.position.needsUpdate = true;
        headGeo.attributes.color.needsUpdate = true;

        // Ripples
        for (const r of ripples) {
          if (!r.active) continue;
          const rp = (t - r.start) / 0.9;
          if (rp >= 1) {
            r.active = false;
            r.mesh.visible = false;
            continue;
          }
          const s = 0.12 + rp * 0.5;
          r.mesh.scale.set(s, s, s);
          (r.mesh.material as import("three").MeshBasicMaterial).opacity =
            0.75 * (1 - rp);
        }

        // Retire finished arcs
        for (let i = arcs.length - 1; i >= 0; i--) {
          if ((t - arcs[i].start) / arcs[i].dur >= 1.15) arcs.splice(i, 1);
        }
      };

      // Mouse parallax (position drift of the whole rig, very slight)
      let parX = 0;
      let parY = 0;
      let parTX = 0;
      let parTY = 0;
      const onMove = (e: MouseEvent) => {
        parTX = (e.clientX / window.innerWidth - 0.5) * 0.22;
        parTY = (e.clientY / window.innerHeight - 0.5) * 0.14;
      };
      window.addEventListener("mousemove", onMove);

      const onResize = () => {
        if (!mount.clientWidth) return;
        camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener("resize", onResize);

      let raf = 0;
      let running = false;
      const clock = new THREE.Clock();
      let nextSpawn = 0.4;
      let frames = 0;
      let windowStart = performance.now();
      let dprSteps = 0;

      const tick = () => {
        if (!running) return;
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        if (t >= nextSpawn) {
          spawnArc(t);
          nextSpawn = t + 0.55 + Math.random() * 0.85;
        }
        parX += (parTX - parX) * 0.03;
        parY += (parTY - parY) * 0.03;
        group.position.x = globeX + parX;
        group.position.y = viewH * 0.02 - parY;
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
        for (let i = 0; i < 5; i++) spawnArc(0);
        arcs.forEach((a, i) => {
          a.start = -a.dur * (0.25 + i * 0.13);
        });
        update(1.4);
        renderer.render(scene, camera);
      } else {
        start();
      }

      cleanup = () => {
        stop();
        io.disconnect();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        dotGeo.dispose();
        cityGeo.dispose();
        arcGeo.dispose();
        headGeo.dispose();
        rippleGeo.dispose();
        (dots.material as import("three").Material).dispose();
        (cityPts.material as import("three").Material).dispose();
        (arcLines.material as import("three").Material).dispose();
        (heads.material as import("three").Material).dispose();
        ripples.forEach((r) =>
          (r.mesh.material as import("three").Material).dispose()
        );
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
