import { useEffect, useRef } from "react";

/**
 * HeroMascot — preview: Quaternius "Universal Base Characters" (CC0)
 * standing companion in the hero's bottom-right corner.
 *
 * Chassis mirrors Hero3D: plain three.js, DPR capped at 1.5, loop pauses
 * off-screen, reduced motion = one static frame. The GLB itself is lazy:
 * three + the model only load after first paint (idle callback), so the
 * hero's initial load is untouched. If the model fails to load, this
 * renders nothing — never a broken frame.
 */

export function HeroMascot({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    let renderer: any = null;
    let mixer: any = null;
    let clock: any = null;
    let onResize: (() => void) | null = null;
    let onMouse: ((e: PointerEvent) => void) | null = null;
    let io: IntersectionObserver | null = null;

    const start = async () => {
      if (disposed || !host) return;
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        if (disposed || !host) return;

        const width = host.clientWidth || 300;
        const height = host.clientHeight || 380;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(width, height);
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
        camera.position.set(0, 1.05, 3.4);

        scene.add(new THREE.AmbientLight(0xffffff, 0.85));
        const key = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(2, 3, 4);
        scene.add(key);
        // Emerald rim light — ties the mascot into the Living Network aurora.
        const rim = new THREE.PointLight(0x34d399, 12, 8);
        rim.position.set(-1.6, 1.4, -1.2);
        scene.add(rim);

        const group = new THREE.Group();
        scene.add(group);

        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync("/models/mascot.glb");
        if (disposed) return;
        const model = gltf.scene;
        // Normalize: feet on the ground, ~1.8 units tall, centered.
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const scale = 1.8 / Math.max(size.y, 0.001);
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        model.traverse((o: any) => {
          if (o.isMesh) {
            o.castShadow = false;
            o.receiveShadow = false;
          }
        });
        group.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          clock = new THREE.Clock();
          mixer = new THREE.AnimationMixer(model);
          const idle =
            gltf.animations.find((c: any) => /idle/i.test(c.name)) || gltf.animations[0];
          mixer.clipAction(idle).play();
        }

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let visible = true;
        let mouseX = 0;
        onMouse = (e: PointerEvent) => {
          mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        };
        window.addEventListener("pointermove", onMouse, { passive: true });

        const render = (t: number) => {
          if (disposed) return;
          if (visible) {
            const s = t / 1000;
            // Gentle companion sway: slow turn toward the headline + float.
            group.rotation.y = Math.sin(s * 0.22) * 0.28 + mouseX * 0.08;
            group.position.y = Math.sin(s * 1.1) * 0.03;
            if (mixer && clock) mixer.update(clock.getDelta());
            camera.lookAt(0, 0.95, 0);
            renderer.render(scene, camera);
          }
          if (!reduced) raf = requestAnimationFrame(render);
        };

        onResize = () => {
          const w = host.clientWidth || 300;
          const h = host.clientHeight || 380;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);

        io = new IntersectionObserver((entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible && !reduced) {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(render);
          }
        });
        io.observe(host);
        render(0);
      } catch (e) {
        console.warn("HeroMascot: model failed to load, hiding mascot.", e);
      }
    };

    // Never compete with first paint: load on idle, fallback 900ms.
    let idleId: any = null;
    let fallback: any = null;
    if ("requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(start, { timeout: 1500 });
    } else {
      fallback = setTimeout(start, 900);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (idleId && "cancelIdleCallback" in window) (window as any).cancelIdleCallback(idleId);
      if (fallback) clearTimeout(fallback);
      if (onResize) window.removeEventListener("resize", onResize);
      if (onMouse) window.removeEventListener("pointermove", onMouse);
      if (io) io.disconnect();
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
