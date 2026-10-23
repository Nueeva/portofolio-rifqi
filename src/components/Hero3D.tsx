import { useEffect, useRef } from "react";

/**
 * Interactive 3D backdrop for the hero — vanilla three.js, lazy-loaded so it
 * never blocks first paint. A wireframe icosahedron shell + octahedron core
 * inside a slow particle field; the whole rig leans toward the cursor.
 * Renders one static frame for prefers-reduced-motion.
 */
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

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
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

      const emerald = new THREE.Color("hsl(160, 84%, 45%)");

      const group = new THREE.Group();
      scene.add(group);

      const outerGeo = new THREE.IcosahedronGeometry(2.15, 1);
      const outer = new THREE.Mesh(
        outerGeo,
        new THREE.MeshBasicMaterial({
          color: emerald,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        })
      );
      const innerGeo = new THREE.OctahedronGeometry(1.15, 0);
      const inner = new THREE.Mesh(
        innerGeo,
        new THREE.MeshBasicMaterial({
          color: emerald,
          wireframe: true,
          transparent: true,
          opacity: 0.85,
        })
      );
      group.add(outer, inner);

      // Particle shell
      const N = 260;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = 3.4 + Math.random() * 3.4;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const points = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: emerald,
          size: 0.045,
          transparent: true,
          opacity: 0.7,
        })
      );
      scene.add(points);

      let tx = 0;
      let ty = 0;
      let mx = 0;
      let my = 0;
      const onMove = (e: MouseEvent) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
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
      const clock = new THREE.Clock();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        mx += (tx - mx) * 0.045;
        my += (ty - my) * 0.045;
        outer.rotation.y = t * 0.16 + mx * 0.5;
        outer.rotation.x = t * 0.07 + my * 0.35;
        inner.rotation.y = -t * 0.3 + mx * 0.7;
        inner.rotation.z = t * 0.12;
        points.rotation.y = t * 0.03 + mx * 0.2;
        group.position.y = Math.sin(t * 0.6) * 0.12;
        renderer.render(scene, camera);
      };

      if (reduced) {
        renderer.render(scene, camera);
      } else {
        tick();
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        outerGeo.dispose();
        innerGeo.dispose();
        pGeo.dispose();
        (outer.material as import("three").Material).dispose();
        (inner.material as import("three").Material).dispose();
        (points.material as import("three").Material).dispose();
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
