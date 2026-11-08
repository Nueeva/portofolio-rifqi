import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { Color, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer, WebGLRenderTarget } from "three";
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const background = `varying vec2 vUv; uniform vec3 base;uniform vec3 cool;uniform vec3 violet;
void main(){vec2 p=vUv;float field=exp(-length((p-vec2(.74,.48))*vec2(1.5,2.8))*3.);float band=.5+.5*sin(p.x*15.+p.y*9.);gl_FragColor=vec4(mix(base,mix(cool,violet,band),field*.24),1.);}`.replace(';#include', ';\n#include');
const optical = `varying vec2 vUv;uniform sampler2D source;uniform float progress;uniform vec2 pointer;uniform vec2 resolution;uniform vec3 copper;uniform vec3 cool;
void main(){vec2 p=vUv;float gap=.025+smoothstep(0.,.35,progress)*.07;float seam=p.y-.35-p.x*.19;float edge=abs(seam)-gap;float bevel=exp(-abs(edge)*180.);vec2 offset=vec2(bevel*.012+pointer.x*.028,bevel*.018+pointer.y*.012);vec3 col;col.r=texture2D(source,p+offset*1.7).r;col.g=texture2D(source,p+offset).g;col.b=texture2D(source,p+offset*.3).b;float cavity=1.-smoothstep(-.003,.003,edge);col*=1.-cavity*.72;float sweep=smoothstep(.35,.75,progress);float shine=exp(-pow((p.x-(sweep*1.5-.25))*.9,2.)*22.);col+=bevel*mix(cool,copper,p.x)*(.26+shine*.8);col+=exp(-abs(edge)*35.)*copper*.035;gl_FragColor=vec4(col,1.);\n#include <colorspace_fragment>\n}`;
/** Decorative, render-on-demand optical layer. Poster and DOM remain complete on failure. */
export default function OpticalField({ progress }: {
    progress: MotionValue<number>;
}) {
    const host = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = host.current;
        if (!el)
            return;
        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({ alpha: false, antialias: false, powerPreference: "low-power" });
        }
        catch {
            return;
        }
        const canvas = renderer.domElement;
        canvas.setAttribute("aria-hidden", "true");
        el.append(canvas);
        const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const geometry = new PlaneGeometry(2, 2);
        const scene = new Scene();
        const screen = new Scene();
        const target = new WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false });
        const bg = new ShaderMaterial({ vertexShader: vertex, fragmentShader: background, uniforms: { base: { value: new Color() }, cool: { value: new Color() }, violet: { value: new Color() } } });
        const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: optical, uniforms: { source: { value: target.texture }, progress: { value: progress.get() }, pointer: { value: new Vector2() }, resolution: { value: new Vector2() }, copper: { value: new Color() }, cool: { value: new Color() } } });
        scene.add(new Mesh(geometry, bg));
        screen.add(new Mesh(geometry, material));
        let raf = 0, visible = true, disposed = false, failed = false, dpr = Math.min(devicePixelRatio, 1.5), last = 0, slowSince = 0, activeUntil = 0;
        const fallBack = () => { failed = true; canvas.hidden = true; canvas.style.display = "none"; el.dataset.failed = "true"; };
        const render = () => {
            raf = 0;
            if (disposed || failed || !visible || document.hidden)
                return;
            const start = performance.now();
            try {
                renderer.setRenderTarget(target);
                renderer.render(scene, camera);
                renderer.setRenderTarget(null);
                renderer.render(screen, camera);window.dispatchEvent(new Event("celah:theme-rendered"));
            }
            catch {
                fallBack();
                return;
            }
            const cost = performance.now() - start;
            const now = performance.now();
            const interval = last ? now - last : 0;
            last = now;
            // Count only actively rendered adjacent frames, never idle time.
            if (cost > 25 || (interval > 25 && interval < 100)) {
                slowSince ||= now;
                if (now - slowSince > 2000) {
                    if (dpr > 1) {
                        dpr = 1;
                        resize();
                        slowSince = 0;
                    }
                    else
                        fallBack();
                }
            }
            else
                slowSince = 0;
            if (!failed && now < activeUntil)
                raf = requestAnimationFrame(render);
        };
        const invalidate = () => { activeUntil = performance.now() + 100; if (!raf && !disposed && !failed)
            raf = requestAnimationFrame(render); };
        const resize = () => { const { width, height } = el.getBoundingClientRect(); renderer.setPixelRatio(dpr); renderer.setSize(width, height); target.setSize(Math.max(1, Math.floor(width * dpr * .5)), Math.max(1, Math.floor(height * dpr * .5))); material.uniforms.resolution.value.set(width, height); invalidate(); };
        const theme = () => { const css = getComputedStyle(el); const color = (name: string) => css.getPropertyValue(name).trim(); bg.uniforms.base.value.set(color("--site-bg")); bg.uniforms.cool.value.set(color("--site-cyan")); bg.uniforms.violet.value.set(color("--site-violet")); material.uniforms.copper.value.set(color("--site-copper")); material.uniforms.cool.value.set(color("--site-cyan")); invalidate(); };
        const observer = new ResizeObserver(resize);
        observer.observe(el);
        const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; invalidate(); });
        intersection.observe(el);
        const mutation = new MutationObserver(theme);
        mutation.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        const onProgress = progress.on("change", v => { material.uniforms.progress.value = v; invalidate(); });
        const pointer = (e: PointerEvent) => { if (e.pointerType !== "mouse")
            return; material.uniforms.pointer.value.set(e.offsetX / el.clientWidth - .5, e.offsetY / el.clientHeight - .5); invalidate(); };
        const lost = (event: Event) => { event.preventDefault(); fallBack(); };
        el.parentElement?.addEventListener("pointermove", pointer);
        canvas.addEventListener("webglcontextlost", lost);
        document.addEventListener("visibilitychange", invalidate);
        theme();
        resize();
        return () => { disposed = true; cancelAnimationFrame(raf); onProgress(); observer.disconnect(); intersection.disconnect(); mutation.disconnect(); el.parentElement?.removeEventListener("pointermove", pointer); canvas.removeEventListener("webglcontextlost", lost); document.removeEventListener("visibilitychange", invalidate); target.dispose(); geometry.dispose(); bg.dispose(); material.dispose(); renderer.dispose(); canvas.remove(); };
    }, [progress]);
    return <div className="optical-field" ref={host}/>;
}
