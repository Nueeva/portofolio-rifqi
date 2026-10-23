import { useEffect, useRef } from "react";

/**
 * Network-constellation backdrop for the hero — vanilla three.js, lazy chunk.
 *
 * Design: emerald nodes (denser on the right, security-ops map style) linked
 * by thin lines when close, drifting almost imperceptibly; the cursor gently
 * pushes nearby nodes and parallaxes the whole field. A CSS mask on the
 * wrapper fades the left side so the headline stays clean.
 *
 * Performance budget (by design):
 *  - 3 draw calls total (nodes, hub nodes, lines) — no post-processing
 *  - DPR capped at 1.5, no antialiasing (points/lines don't need MSAA)
 *  - render loop PAUSES when the hero is off-screen (IntersectionObserver)
 *  - adaptive quality: sustained FPS < 45 steps the pixel ratio down
 *  - prefers-reduced-motion renders a single static frame
 */

interface NodeDef {
  bx: number;
  by: number;
  bz: number;
  phase: number;
  speed: number;
  hub: boolean;
}

const LINK_DIST = 1.6;
const DRIFT_AMP = 0.13;

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
      const nodeCount = window.innerWidth < 768 ? 55 : 115;

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

      // --- Nodes: ~72% biased to the right half, sparse on the left ---
      const nodes: NodeDef[] = [];
      for (let i = 0; i < nodeCount; i++) {
        const right = Math.random() < 0.72;
        const x = right
          ? viewW * (Math.random() * 0.56 - 0.05)
          : viewW * (Math.random() * 0.4 - 0.5);
        nodes.push({
          bx: x,
          by: (Math.random() - 0.5) * viewH * 0.96,
          bz: (Math.random() - 0.5) * 1.6,
          phase: Math.random() * Math.PI * 2,
          speed: 0.12 + Math.random() * 0.2,
          hub: false,
        });
      }
      // A few brighter hub nodes among the right-side cluster
      let hubsMarked = 0;
      for (const n of nodes) {
        if (hubsMarked >= 8) break;
        if (n.bx > viewW * 0.05 && Math.random() < 0.35) {
          n.hub = true;
          hubsMarked++;
        }
      }

      // --- Link pairs from base positions ---
      const pairs: Array<[number, number]> = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.bx - b.bx, a.by - b.by, a.bz - b.bz);
          if (d < LINK_DIST) pairs.push([i, j]);
        }
      }

      const group = new THREE.Group();
      scene.add(group);

      const emerald = new THREE.Color("hsl(160, 84%, 45%)");
      const dimEmerald = new THREE.Color("hsl(160, 65%, 36%)");

      const nodePos = new Float32Array(nodes.length * 3);
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
      const nodePts = new THREE.Points(
        nodeGeo,
        new THREE.PointsMaterial({
          color: emerald,
          size: 0.055,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        })
      );

      const hubIdx = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
      const hubPos = new Float32Array(hubIdx.length * 3);
      const hubGeo = new THREE.BufferGeometry();
      hubGeo.setAttribute("position", new THREE.BufferAttribute(hubPos, 3));
      const hubPts = new THREE.Points(
        hubGeo,
        new THREE.PointsMaterial({
          color: emerald,
          size: 0.12,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        })
      );

      const linePos = new Float32Array(pairs.length * 6);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
      const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: dimEmerald,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        })
      );

      group.add(lines, nodePts, hubPts);

      // --- Per-frame position update (drift + gentle cursor repulsion) ---
      let mouseX = 9999;
      let mouseY = 9999;
      let parX = 0;
      let parY = 0;
      const updatePositions = (t: number) => {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          let x = n.bx + Math.sin(t * n.speed + n.phase) * DRIFT_AMP;
          let y = n.by + Math.cos(t * n.speed * 0.8 + n.phase) * DRIFT_AMP;
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
        }
        nodeGeo.attributes.position.needsUpdate = true;

        for (let h = 0; h < hubIdx.length; h++) {
          const src = hubIdx[h] * 3;
          hubPos[h * 3] = nodePos[src];
          hubPos[h * 3 + 1] = nodePos[src + 1];
          hubPos[h * 3 + 2] = nodePos[src + 2];
        }
        hubGeo.attributes.position.needsUpdate = true;

        for (let p = 0; p < pairs.length; p++) {
          const a = pairs[p][0] * 3;
          const b = pairs[p][1] * 3;
          linePos[p * 6] = nodePos[a];
          linePos[p * 6 + 1] = nodePos[a + 1];
          linePos[p * 6 + 2] = nodePos[a + 2];
          linePos[p * 6 + 3] = nodePos[b];
          linePos[p * 6 + 4] = nodePos[b + 1];
          linePos[p * 6 + 5] = nodePos[b + 2];
        }
        lineGeo.attributes.position.needsUpdate = true;
      };

      const onMove = (e: MouseEvent) => {
        const r = mount.getBoundingClientRect();
        if (r.height === 0) return;
        mouseX = ((e.clientX - r.left) / r.width - 0.5) * viewW;
        mouseY = -((e.clientY - r.top) / r.height - 0.5) * viewH;
        parX = (e.clientX / window.innerWidth - 0.5) * 2;
        parY = (e.clientY / window.innerHeight - 0.5) * 2;
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

      // --- Render loop with visibility pause + adaptive quality ---
      let raf = 0;
      let visible = true;
      let running = false;
      const clock = new THREE.Clock();
      let frames = 0;
      let windowStart = performance.now();
      let dprSteps = 0;

      const tick = () => {
        if (!running) return;
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        updatePositions(t);
        group.rotation.y += (parX * 0.05 - group.rotation.y) * 0.04;
        group.rotation.x += (-parY * 0.03 - group.rotation.x) * 0.04;
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
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) start();
          else stop();
        },
        { threshold: 0.02 }
      );
      io.observe(mount);

      if (reduced) {
        updatePositions(1.2);
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
        hubGeo.dispose();
        lineGeo.dispose();
        (nodePts.material as import("three").Material).dispose();
        (hubPts.material as import("three").Material).dispose();
        (lines.material as import("three").Material).dispose();
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
