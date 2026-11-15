import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { Color, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer, WebGLRenderTarget } from "three";
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const background = `varying vec2 vUv; uniform vec3 base;uniform vec3 cool;uniform vec3 violet;
void main(){vec2 p=vUv;float field=exp(-length((p-vec2(.74,.48))*vec2(1.5,2.8))*3.);float band=.5+.5*sin(p.x*15.+p.y*9.);gl_FragColor=vec4(mix(base,mix(cool,violet,band),field*.24),1.);}`.replace(';#include', ';\n#include');
const optical = `varying vec2 vUv;uniform sampler2D source;uniform float progress;uniform vec2 pointer;uniform vec2 resolution;uniform vec3 copper;uniform vec3 cool;uniform vec3 base;
vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(dot(hash(i+vec2(0.,0.)),f-vec2(0.,0.)),dot(hash(i+vec2(1.,0.)),f-vec2(1.,0.)),u.x),mix(dot(hash(i+vec2(0.,1.)),f-vec2(0.,1.)),dot(hash(i+vec2(1.,1.)),f-vec2(1.,1.)),u.x),u.y);}
vec2 curlNoise(vec2 p){float eps=.01;float n1=noise(p+vec2(0.,eps));float n2=noise(p-vec2(0.,eps));float n3=noise(p+vec2(eps,0.));float n4=noise(p-vec2(eps,0.));return vec2((n1-n2)/(2.*eps),-(n3-n4)/(2.*eps));}
void main(){
vec2 p=vUv;
float gap=.025+smoothstep(0.,.35,progress)*.07;
float seam=p.y-.35-p.x*.19;
float edge=abs(seam)-gap;
float boundaryEnvelope=exp(-pow(edge*40.,2.));
vec2 kineticPhase=vec2(progress*3.6+pointer.x*1.8,pointer.y*1.4-progress*1.9);
vec2 fluidDrift=curlNoise(p*8.+kineticPhase)*boundaryEnvelope*.0035;
vec2 pDistorted=p+fluidDrift;
seam=pDistorted.y-.35-pDistorted.x*.19;
edge=abs(seam)-gap;
float bevelSlope=exp(-abs(edge)*160.)*sign(seam);
vec2 n2D=normalize(vec2(-.19,1.));
vec3 N=normalize(vec3(-n2D*bevelSlope*1.5,1.));
vec3 I=vec3(0.,0.,-1.);
vec3 refR=refract(I,N,.6605);
vec3 refG=refract(I,N,.6570);
vec3 refB=refract(I,N,.6502);
float slabThickness=.016;
vec2 offsetR=(refR.xy/abs(refR.z))*slabThickness+pointer*.015;
vec2 offsetG=(refG.xy/abs(refG.z))*slabThickness+pointer*.015;
vec2 offsetB=(refB.xy/abs(refB.z))*slabThickness+pointer*.015;
vec3 col;
col.r=texture2D(source,pDistorted+offsetR).r;
col.g=texture2D(source,pDistorted+offsetG).g;
col.b=texture2D(source,pDistorted+offsetB).b;
float cosTheta=clamp(dot(-I,N),0.,1.);
float R0=.0426;
float fresnel=R0+(1.-R0)*pow(1.-cosTheta,5.);
float sweep=smoothstep(.35,.75,progress);
float causticPhase=progress*8.+(pointer.x+pointer.y)*4.;
float caustic=(exp(-abs(edge)*220.)/sqrt(abs(edge)+.005))*(1.+.35*sin(p.x*45.+causticPhase));
float shine=exp(-pow((p.x-(sweep*1.5-.25))*.9,2.)*25.);
float cavity=1.-smoothstep(-.004,.004,edge);
float isDark=base.r<.2?1.:0.;
float cavityDarkening=isDark*.72+(1.-isDark)*.46;
col*=1.-cavity*cavityDarkening;
vec3 accentColor=mix(cool,copper,p.x);
vec3 darkLighting=fresnel*accentColor*(.35+shine*.95)+caustic*copper*.045*(1.+shine*.5);

// Light-mode mineral refraction, ambient occlusion bevel & specular glint
vec3 mineralPigment=mix(copper*.78,cool*.70,p.x);
float edgeGrip=exp(-abs(edge)*60.);
float razorShadow=smoothstep(0.,.012,edge)*exp(-max(0.,edge)*110.)*max(0.,seam);
float causticGlint=clamp(caustic*(shine*1.15+.35)*.065,0.,.85);
vec3 lightShaded=col*(1.-razorShadow*.36);
lightShaded=mix(lightShaded,mineralPigment,edgeGrip*.42);
lightShaded=mix(lightShaded,copper*1.32,causticGlint);
lightShaded+=fresnel*copper*(shine*.75+.15)*.38;

col=mix(lightShaded,col+darkLighting,isDark);
gl_FragColor=vec4(col,1.);
#include <colorspace_fragment>
}`;
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
        const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: optical, uniforms: { source: { value: target.texture }, progress: { value: progress.get() }, pointer: { value: new Vector2() }, resolution: { value: new Vector2() }, copper: { value: new Color() }, cool: { value: new Color() }, base: { value: new Color() } } });
        scene.add(new Mesh(geometry, bg));
        screen.add(new Mesh(geometry, material));
        let raf = 0, visible = true, disposed = false, failed = false;
        let dpr = Math.min(devicePixelRatio, 1.5), slowCost = 0;
        let backgroundDirty = true, themePending = false;
        let pointerPosition: { x: number; y: number } | null = null;
        const cancel = () => { cancelAnimationFrame(raf); raf = 0; };
        const fallBack = () => { failed = true; cancel(); canvas.hidden = true; canvas.style.display = "none"; el.dataset.failed = "true"; };
        const render = () => {
            raf = 0;
            if (disposed || failed || !visible || document.hidden) return;
            const start = performance.now();
            if (pointerPosition) {
                const bounds = el.getBoundingClientRect();
                material.uniforms.pointer.value.set(
                    (pointerPosition.x - bounds.left) / Math.max(1, bounds.width) - .5,
                    (pointerPosition.y - bounds.top) / Math.max(1, bounds.height) - .5,
                );
                pointerPosition = null;
            }
            try {
                // The source texture depends on size and theme, never camera or pointer.
                if (backgroundDirty) {
                    renderer.setRenderTarget(target);
                    renderer.render(scene, camera);
                    backgroundDirty = false;
                }
                renderer.setRenderTarget(null);
                renderer.render(screen, camera);
                if (themePending) {
                    themePending = false;
                    window.dispatchEvent(new Event("celah:theme-rendered"));
                }
            } catch { fallBack(); return; }
            // Accumulate actual submission cost, not gaps between sparse input events.
            // This is CPU submission time; it is not a measurement of GPU execution.
            const cost = performance.now() - start;
            slowCost = cost > 25 ? slowCost + cost : 0;
            if (slowCost > 2000) {
                slowCost = 0;
                if (dpr > 1) { dpr = 1; resize(); }
                else fallBack();
            }
        };
        const invalidate = () => {
            if (!raf && !disposed && !failed && visible && !document.hidden)
                raf = requestAnimationFrame(render);
        };
        const resize = () => {
            const { width, height } = el.getBoundingClientRect();
            renderer.setPixelRatio(dpr);
            renderer.setSize(width, height);
            target.setSize(Math.max(1, Math.floor(width * dpr * .5)), Math.max(1, Math.floor(height * dpr * .5)));
            material.uniforms.resolution.value.set(width, height);
            backgroundDirty = true;
            invalidate();
        };
        const theme = () => {
            const css = getComputedStyle(el);
            const color = (name: string) => css.getPropertyValue(name).trim();
            bg.uniforms.base.value.set(color("--site-bg"));
            bg.uniforms.cool.value.set(color("--site-cyan"));
            bg.uniforms.violet.value.set(color("--site-violet"));
            material.uniforms.copper.value.set(color("--site-copper"));
            material.uniforms.cool.value.set(color("--site-cyan"));
            material.uniforms.base.value.set(color("--site-bg"));
            backgroundDirty = true;
            themePending = true;
            invalidate();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(el);
        const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) invalidate(); else cancel(); });
        intersection.observe(el);
        const mutation = new MutationObserver(theme);
        mutation.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        const onProgress = progress.on("change", v => { material.uniforms.progress.value = v; invalidate(); });
        const pointer = (e: PointerEvent) => { if (e.pointerType !== "mouse")
            return; pointerPosition = { x: e.clientX, y: e.clientY }; invalidate(); };
        const lost = (event: Event) => { event.preventDefault(); fallBack(); };
        // Presentation-only fallback snapshots need both shader palettes at once.
        // Render/capture/restore synchronously, so the live canvas never flashes.
        const snapshot = (event: Event) => {
            const { colors, capture } = (event as CustomEvent<{ colors: Record<string, string>; capture: (value: string) => void }>).detail;
            if (disposed || failed) return;
            const uniforms = [bg.uniforms.base, bg.uniforms.cool, bg.uniforms.violet, material.uniforms.copper, material.uniforms.cool, material.uniforms.base];
            const previous = uniforms.map(uniform => uniform.value.clone());
            const names = ["--site-bg", "--site-cyan", "--site-violet", "--site-copper", "--site-cyan", "--site-bg"];
            const targetBefore = renderer.getRenderTarget();
            try {
                uniforms.forEach((uniform, i) => uniform.value.set(colors[names[i]]));
                renderer.setRenderTarget(target); renderer.render(scene, camera);
                renderer.setRenderTarget(null); renderer.render(screen, camera);
                capture(canvas.toDataURL("image/png"));
            } finally {
                uniforms.forEach((uniform, i) => uniform.value.copy(previous[i]));
                renderer.setRenderTarget(target); renderer.render(scene, camera);
                renderer.setRenderTarget(null); renderer.render(screen, camera);
                renderer.setRenderTarget(targetBefore);
            }
        };
        el.parentElement?.addEventListener("pointermove", pointer);
        canvas.addEventListener("webglcontextlost", lost);
        canvas.addEventListener("celah:ink-snapshot", snapshot);
        const visibility = () => { if (document.hidden) cancel(); else invalidate(); };
        document.addEventListener("visibilitychange", visibility);
        theme();
        resize();
        return () => { disposed = true; cancelAnimationFrame(raf); onProgress(); observer.disconnect(); intersection.disconnect(); mutation.disconnect(); el.parentElement?.removeEventListener("pointermove", pointer); canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("celah:ink-snapshot", snapshot); document.removeEventListener("visibilitychange", visibility); target.dispose(); geometry.dispose(); bg.dispose(); material.dispose(); renderer.dispose(); canvas.remove(); };
    }, [progress]);
    return <div className="optical-field" ref={host}/>;
}
