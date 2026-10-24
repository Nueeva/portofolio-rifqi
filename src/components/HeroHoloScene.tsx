import { useEffect, useRef } from "react";

/**
 * HeroHoloScene — an isometric server-rack diorama in the hero's
 * bottom-right corner, projecting an emerald hologram: a wireframe
 * shield with a padlock heart, orbit rings, a projector cone and
 * rising particles. On-brand for the security portfolio — no mascot.
 *
 * Chassis mirrors Hero3D/HeroMascot: plain three.js built from
 * primitives only (zero external assets), DPR capped at 1.5, the loop
 * pauses off-screen, reduced motion = one static frame, lazy mount on
 * idle so first paint is untouched, and any failure renders nothing —
 * never a broken frame.
 */

export function HeroHoloScene({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let onResize: (() => void) | null = null;
    let onMouse: ((e: PointerEvent) => void) | null = null;
    let io: IntersectionObserver | null = null;
    let themeObserver: MutationObserver | null = null;

    const start = async () => {
      if (disposed || !host) return;
      try {
        const THREE = await import("three");
        if (disposed || !host) return;

        const width = host.clientWidth || 300;
        const height = host.clientHeight || 380;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height);
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        // Slight isometric angle on the diorama.
        const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
        camera.position.set(2.5, 1.75, 3.15);
        camera.lookAt(0, 0.92, 0);

        // Soft studio light for the physical racks (the hologram above
        // them is unlit/emissive and does not depend on this).
        scene.add(new THREE.HemisphereLight(0xd8fff2, 0x0a0f0d, 0.9));
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(2.5, 4, 3);
        scene.add(key);
        const rim = new THREE.PointLight(0x34d399, 6, 9);
        rim.position.set(-2, 1.6, -1.4);
        scene.add(rim);

        const EMERALD = 0x34d399;
        const EMERALD_DEEP = 0x10b981;
        const AMBER = 0xfbbf24;

        const world = new THREE.Group();
        scene.add(world);

        // Hologram materials share a flicker/theme pass, so they are
        // registered with their base opacity as they are created. The
        // entry type is the minimal structural slice every three.js
        // material here (mesh / line / points) satisfies.
        type HoloMat = {
          opacity: number;
          blending: import("three").Blending;
          needsUpdate: boolean;
        };
        const holoMats: Array<{ m: HoloMat; base: number }> = [];
        const holoMat = (
          opts: import("three").MeshBasicMaterialParameters
        ): import("three").MeshBasicMaterial => {
          const m = new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            ...opts,
          });
          holoMats.push({ m, base: m.opacity ?? 1 });
          return m;
        };

        // ---------- Floor glow: the diorama's ground ----------
        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(0.92, 48),
          holoMat({ color: EMERALD, opacity: 0.09, side: THREE.DoubleSide })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.001;
        world.add(floor);
        const floorRing = new THREE.Mesh(
          new THREE.RingGeometry(0.88, 0.92, 64),
          holoMat({ color: EMERALD, opacity: 0.28, side: THREE.DoubleSide })
        );
        floorRing.rotation.x = -Math.PI / 2;
        floorRing.position.y = 0.002;
        world.add(floorRing);

        // ---------- Server racks (primitives only) ----------
        const racks = new THREE.Group();
        world.add(racks);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x0b100e,
          roughness: 0.5,
          metalness: 0.65,
        });
        const panelMat = new THREE.MeshStandardMaterial({
          color: 0x131a17,
          roughness: 0.35,
          metalness: 0.75,
        });
        const ventMat = new THREE.MeshStandardMaterial({
          color: 0x050807,
          roughness: 0.8,
          metalness: 0.3,
        });
        const ledStaticE = new THREE.MeshBasicMaterial({ color: EMERALD });
        const ledStaticA = new THREE.MeshBasicMaterial({ color: AMBER });
        const blinkers: Array<{
          m: import("three").MeshBasicMaterial;
          color: number;
          speed: number;
          phase: number;
        }> = [];
        const ledGeo = new THREE.PlaneGeometry(0.02, 0.02);

        const rackXs = [-0.6, 0, 0.6];
        const rackHs = [0.56, 0.68, 0.6];
        rackXs.forEach((rx, ri) => {
          const h = rackHs[ri];
          const g = new THREE.Group();
          g.position.x = rx;

          const body = new THREE.Mesh(new THREE.BoxGeometry(0.54, h, 0.44), bodyMat);
          body.position.y = h / 2;
          g.add(body);

          const panel = new THREE.Mesh(new THREE.BoxGeometry(0.48, h - 0.05, 0.02), panelMat);
          panel.position.set(0, h / 2, 0.225);
          g.add(panel);

          // Vent slits near the top of the front panel.
          for (let v = 0; v < 4; v++) {
            const vent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.006), ventMat);
            vent.position.set(-0.05, h - 0.07 - v * 0.03, 0.238);
            g.add(vent);
          }

          // LED rows: a mix of static and blinking dots, emerald/amber.
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 5; col++) {
              const seed = Math.sin(ri * 37.7 + row * 11.3 + col * 5.1) * 10000;
              const frac = seed - Math.floor(seed);
              if (frac < 0.3) continue; // sparse, not a christmas tree
              const amber = frac > 0.82;
              let mat: import("three").MeshBasicMaterial;
              if (frac > 0.55) {
                const ledColor = amber ? AMBER : EMERALD;
                mat = new THREE.MeshBasicMaterial({ color: ledColor });
                blinkers.push({
                  m: mat,
                  color: ledColor,
                  speed: 0.6 + frac * 2.4,
                  phase: frac * Math.PI * 6,
                });
              } else {
                mat = amber ? ledStaticA : ledStaticE;
              }
              const led = new THREE.Mesh(ledGeo, mat);
              led.position.set(-0.19 + col * 0.05, h - 0.24 - row * 0.055, 0.238);
              g.add(led);
            }
          }

          // Activity strip along the panel's lower edge.
          const strip = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.008, 0.004),
            new THREE.MeshBasicMaterial({
              color: EMERALD_DEEP,
              transparent: true,
              opacity: 0.65,
            })
          );
          strip.position.set(0, 0.06, 0.238);
          g.add(strip);

          racks.add(g);
        });
        const rackTopY = Math.max(...rackHs); // 0.68

        // ---------- Projector: lens glow + cone + rising particles ----------
        const lens = new THREE.Mesh(
          new THREE.CircleGeometry(0.085, 32),
          holoMat({ color: EMERALD, opacity: 0.55, side: THREE.DoubleSide })
        );
        lens.rotation.x = -Math.PI / 2;
        lens.position.y = rackTopY + 0.012;
        world.add(lens);
        const lensHalo = new THREE.Mesh(
          new THREE.CircleGeometry(0.16, 32),
          holoMat({ color: EMERALD, opacity: 0.14, side: THREE.DoubleSide })
        );
        lensHalo.rotation.x = -Math.PI / 2;
        lensHalo.position.y = rackTopY + 0.01;
        world.add(lensHalo);

        const CONE_BOT = rackTopY + 0.01; // ~0.69
        const CONE_TOP = 1.34;
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.34, 0.075, CONE_TOP - CONE_BOT, 48, 1, true),
          holoMat({ color: EMERALD, opacity: 0.05, side: THREE.DoubleSide })
        );
        cone.position.y = (CONE_BOT + CONE_TOP) / 2;
        world.add(cone);

        const P_COUNT = 42;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(P_COUNT * 3);
        const pCol = new Float32Array(P_COUNT * 3);
        const pSeed: Array<{ rx: number; rz: number; y0: number; speed: number }> = [];
        const cE = new THREE.Color(EMERALD);
        const cPale = new THREE.Color(0xd1fae5);
        for (let i = 0; i < P_COUNT; i++) {
          const ang = Math.random() * Math.PI * 2;
          const rad = Math.sqrt(Math.random()) * 0.8;
          pSeed.push({
            rx: Math.cos(ang) * rad,
            rz: Math.sin(ang) * rad,
            y0: Math.random(),
            speed: 0.05 + Math.random() * 0.09,
          });
          const c = Math.random() < 0.22 ? cPale : cE;
          pCol[i * 3] = c.r;
          pCol[i * 3 + 1] = c.g;
          pCol[i * 3 + 2] = c.b;
        }
        pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
        const particles = new THREE.Points(
          pGeo,
          new THREE.PointsMaterial({
            size: 0.022,
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        world.add(particles);
        // Particles join the theme pass through their own material.
        holoMats.push({ m: particles.material, base: 0.75 });

        // ---------- The hologram: shield + padlock + orbit rings ----------
        const holo = new THREE.Group();
        const SHIELD_Y = 1.66;
        holo.position.y = SHIELD_Y;
        world.add(holo);

        // Classic shield outline, ~0.68 wide, ~0.84 tall, centered on origin.
        const s = new THREE.Shape();
        s.moveTo(0, 0.42);
        s.bezierCurveTo(0.14, 0.36, 0.24, 0.34, 0.34, 0.34);
        s.lineTo(0.34, 0.02);
        s.bezierCurveTo(0.34, -0.2, 0.2, -0.34, 0, -0.44);
        s.bezierCurveTo(-0.2, -0.34, -0.34, -0.2, -0.34, 0.02);
        s.lineTo(-0.34, 0.34);
        s.bezierCurveTo(-0.24, 0.34, -0.14, 0.36, 0, 0.42);
        const shieldGeo = new THREE.ExtrudeGeometry(s, {
          depth: 0.03,
          bevelEnabled: false,
        });
        shieldGeo.translate(0, 0, -0.015);

        const shieldFill = new THREE.Mesh(
          shieldGeo,
          holoMat({ color: EMERALD, opacity: 0.1, side: THREE.DoubleSide })
        );
        holo.add(shieldFill);
        const shieldWire = new THREE.Mesh(
          shieldGeo,
          holoMat({ color: EMERALD, opacity: 0.4, wireframe: true })
        );
        holo.add(shieldWire);
        const shieldEdge = new THREE.LineSegments(
          new THREE.EdgesGeometry(shieldGeo, 24),
          new THREE.LineBasicMaterial({
            color: EMERALD,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        holo.add(shieldEdge);
        holoMats.push({ m: shieldEdge.material, base: 0.85 });

        // Padlock heart: rounded body + torus shackle + keyhole.
        const lock = new THREE.Group();
        lock.position.set(0, -0.02, 0.045);
        const lockBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.17, 0.14, 0.035),
          holoMat({ color: EMERALD, opacity: 0.55, wireframe: true })
        );
        lock.add(lockBody);
        const shackle = new THREE.Mesh(
          new THREE.TorusGeometry(0.052, 0.009, 8, 24, Math.PI),
          holoMat({ color: EMERALD, opacity: 0.6, wireframe: true })
        );
        shackle.position.y = 0.07;
        lock.add(shackle);
        const keyhole = new THREE.Mesh(
          new THREE.CircleGeometry(0.016, 16),
          holoMat({ color: 0xd1fae5, opacity: 0.9, side: THREE.DoubleSide })
        );
        keyhole.position.set(0, 0.005, 0.02);
        lock.add(keyhole);
        holo.add(lock);

        // Orbit rings around the shield.
        const ringMat1 = holoMat({ color: EMERALD, opacity: 0.35 });
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.005, 8, 96), ringMat1);
        ring1.rotation.x = 1.15;
        holo.add(ring1);
        const ringMat2 = holoMat({ color: EMERALD_DEEP, opacity: 0.24 });
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.004, 8, 96), ringMat2);
        ring2.rotation.x = -0.9;
        ring2.rotation.y = 0.4;
        holo.add(ring2);

        // Scanline band sweeping up the shield.
        const bandMat = holoMat({ color: 0xa7f3d0, opacity: 0 });
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.007, 8, 64), bandMat);
        band.position.z = 0.03;
        holo.add(band);

        // ---------- Theme awareness (mirrors Hero3D) ----------
        let themeBoost = 1;
        const applyTheme = () => {
          const light = !document.documentElement.classList.contains("dark");
          themeBoost = light ? 1.35 : 1;
          const blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
          for (const { m } of holoMats) {
            m.blending = blending;
            m.needsUpdate = true;
          }
        };
        applyTheme();
        themeObserver = new MutationObserver(applyTheme);
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });

        // ---------- Interaction: subtle cursor parallax ----------
        let parX = 0;
        let parY = 0;
        let parTX = 0;
        let parTY = 0;
        onMouse = (e: PointerEvent) => {
          parTX = (e.clientX / window.innerWidth - 0.5) * 2;
          parTY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener("pointermove", onMouse, { passive: true });

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let visible = true;

        // Hologram flicker: rare, brief — a whisper, not a glitch show.
        let nextFlicker = 3.5 + Math.random() * 3;
        let flickerEnd = -1;

        const renderFrame = (t: number) => {
          // Shield: slow spin + gentle bob.
          holo.rotation.y = t * 0.45;
          holo.position.y = SHIELD_Y + Math.sin(t * 0.9) * 0.03;
          ring1.rotation.z = t * 0.15;
          ring2.rotation.z = -t * 0.1;

          // Scanline sweep (3.4s cycle).
          const sweepT = (t % 3.4) / 3.4;
          const bandY = -0.42 + sweepT * 0.86;
          band.position.y = bandY;
          const bandR = Math.max(0.13, 0.34 - Math.abs(bandY + 0.02) * 0.16);
          band.scale.setScalar(bandR / 0.34);
          // (band opacity is set below, with the shared flicker pass)

          // LEDs blink (pure function of t, so the static frame is lit too).
          for (const b of blinkers) {
            const on = Math.sin(t * b.speed * Math.PI * 2 + b.phase) > -0.2;
            b.m.color.setHex(on ? b.color : 0x182420);
          }

          // Particles rise inside the cone (pure function of t).
          const span = CONE_TOP - CONE_BOT;
          for (let i = 0; i < P_COUNT; i++) {
            const p = pSeed[i];
            const f = (p.y0 + t * p.speed) % 1;
            const y = CONE_BOT + f * span;
            const r = 0.07 + f * 0.25;
            pPos[i * 3] = p.rx * r;
            pPos[i * 3 + 1] = y;
            pPos[i * 3 + 2] = p.rz * r;
          }
          pGeo.attributes.position.needsUpdate = true;

          // Flicker envelope.
          let alpha = 1;
          if (!reduced) {
            if (t > nextFlicker && flickerEnd < 0) flickerEnd = t + 0.12;
            if (flickerEnd > 0) {
              alpha = 0.55 + Math.random() * 0.25;
              if (t > flickerEnd) {
                flickerEnd = -1;
                nextFlicker = t + 3.5 + Math.random() * 3.5;
                alpha = 1;
              }
            }
          }
          const bandBase = Math.sin(sweepT * Math.PI) * 0.5;
          for (const { m, base } of holoMats) {
            m.opacity = Math.min(1, base * themeBoost) * alpha;
          }
          bandMat.opacity = bandBase * alpha;

          // Cursor parallax, spring-damped.
          parX += (parTX - parX) * 0.04;
          parY += (parTY - parY) * 0.04;
          world.rotation.y = parX * 0.13;
          world.rotation.x = parY * 0.04;

          renderer?.render(scene, camera);
        };

        const clock = new THREE.Clock();
        const tick = () => {
          if (disposed) return;
          raf = requestAnimationFrame(tick);
          if (visible) renderFrame(clock.getElapsedTime());
        };

        onResize = () => {
          const w = host.clientWidth || 300;
          const h = host.clientHeight || 380;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer?.setSize(w, h);
          if (reduced) renderFrame(1.4);
        };
        window.addEventListener("resize", onResize);

        io = new IntersectionObserver((entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        });
        io.observe(host);

        if (reduced) {
          // One static frame: shield mid-bob, particles mid-rise.
          renderFrame(1.4);
        } else {
          tick();
        }
      } catch (e) {
        // Fail silent — never a broken frame in the hero.
        console.warn("HeroHoloScene: scene failed to start, hiding.", e);
      }
    };

    // Never compete with first paint: mount on idle, fallback 900ms.
    let idleId: number | null = null;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 1500 });
    } else {
      fallback = setTimeout(start, 900);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (fallback) clearTimeout(fallback);
      if (onResize) window.removeEventListener("resize", onResize);
      if (onMouse) window.removeEventListener("pointermove", onMouse);
      if (io) io.disconnect();
      if (themeObserver) themeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
        renderer.domElement?.remove();
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-24 right-4 z-10 hidden h-[380px] w-[300px] lg:right-16 lg:block ${className}`}
    />
  );
}
