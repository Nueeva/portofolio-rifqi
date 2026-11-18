import { useEffect, useId, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Project } from "@/data/projects";
import { navigateWithViewTransition } from "@/lib/viewNavigate";
import { useMotionPolicy } from "./motionPolicyContext";
import { projectVisuals } from "./projectVisuals";
import { ProjectArtwork } from "./ProjectArtwork";
import "./home-motion.css";

type MechanismProps = { assembly: MotionValue<number>; selected: number; pulse: MotionValue<number>; playing: boolean };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const settle = { duration: .65, ease: [.16, 1, .3, 1] as [number, number, number, number] };
const snapTransition = { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.65 };

interface SyntaxSample {
    prefix: string;
    payload: string;
    suffix: string;
    delim: string;
    raw: string;
    offset: number;
}

const contextSamples: SyntaxSample[] = [
    { prefix: "<div>", payload: "{PAYLOAD}", suffix: "</div>", delim: "< >", raw: "<div>{PAYLOAD}</div>", offset: 9.5 },
    { prefix: '<input value="', payload: "{PAYLOAD}", suffix: '">', delim: '"', raw: '<input value="{PAYLOAD}">', offset: 17.5 },
    { prefix: "<script>let v='", payload: "{PAYLOAD}", suffix: "';</script>", delim: "'", raw: "<script>let v='{PAYLOAD}';</script>", offset: 20.5 }
];

function ContextLens({ assembly, selected, pulse }: MechanismProps) {
    const id = useId().replace(/:/g, "");
    const rotation = useTransform(assembly, [0, 1], [-60, 0]);
    const ringScale = useTransform(assembly, [0, 1], [.72, 1]);
    const beam = useTransform(pulse, [0, .65, 1], [0, 1, 1]);
    const lensY = 120 + selected * 80;
    const lensX = 225 + selected * 32;
    const activeSample = contextSamples[selected];

    return <>
        <defs>
            <clipPath id={`${id}-lens`}>
                <circle cx="0" cy="0" r="65" />
            </clipPath>
            <linearGradient id={`${id}-cauchy`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--site-cyan)" stopOpacity="0.95" />
                <stop offset="35%" stopColor="var(--site-metal)" stopOpacity="0.4" />
                <stop offset="70%" stopColor="var(--site-copper)" stopOpacity="0.95" />
                <stop offset="100%" stopColor="var(--site-cyan)" stopOpacity="0.75" />
            </linearGradient>
        </defs>
        <path className="mechanism-wire" d="M48 60V360H594M48 60H150M594 360V285" />
        {contextSamples.map((sample, i) => (
            <SyntaxSheet key={sample.raw} assembly={assembly} index={i} selected={selected === i} sample={sample} />
        ))}
        {/* Magnifying lens with 100% opaque glass base so background text never bleeds through */}
        <m.g animate={{ x: lensX, y: lensY }} transition={settle}>
            {/* Opaque glass circle occluding the background completely */}
            <circle cx="0" cy="0" r="65" className="lens-glass" />
            
            {/* Magnified code display clipped to the lens circle */}
            <g clipPath={`url(#${id}-lens)`} className="lens-enlargement" aria-hidden="true">
                <circle cx="0" cy="0" r="65" className="lens-glass" />
                <text
                    x={-activeSample.offset * 12.6}
                    y={7}
                    className="lens-code"
                >
                    <tspan className="lens-delim">{activeSample.prefix}</tspan>
                    <tspan className="lens-payload">{activeSample.payload}</tspan>
                    <tspan className="lens-delim">{activeSample.suffix}</tspan>
                </text>
            </g>

            {/* Lens bezel, Cauchy dispersion rings, calipers, and handle */}
            <circle cx="0" cy="0" r="65" className="lens-edge" />
            <circle cx="0" cy="0" r="66.5" className="lens-cauchy-ring" stroke={`url(#${id}-cauchy)`} />
            <circle cx="0" cy="0" r="63.5" className="lens-cauchy-inner" stroke={`url(#${id}-cauchy)`} />
            <m.g style={{ rotate: rotation, scale: ringScale, transformBox: "view-box", transformOrigin: "0px 0px" }}>
                <path d="M0 -82A82 82 0 0 1 82 0M0 82A82 82 0 0 1 -82 0" className="lens-caliper" />
                <path d="M0 -92V-75M0 75V92M-92 0H-75M75 0H92" className="lens-ticks" />
            </m.g>
            <path d="M46 46L83 83" className="lens-handle" />
            <path d="M-13 0H13M0 -13V13" className="lens-cross" />
        </m.g>
        <m.path d={`M${lensX + 85} ${lensY}H560V360`} className="mechanism-trace" style={{ pathLength: beam }} />
        <text x="320" y="405" textAnchor="middle" className="mechanism-note">Konteks: {contextSamples[selected].delim} · Verifikasi delimitasi sintaks</text>
    </>;
}

function SyntaxSheet({ assembly, index, selected, sample }: { assembly: MotionValue<number>; index: number; selected: boolean; sample: SyntaxSample }) {
    const skew = useTransform(assembly, [0, 1], [(index - 1) * -9, 0]);
    const x = useTransform(assembly, [0, 1], [index % 2 ? -28 : 28, 0]);
    return <m.g style={{ x, rotate: skew, transformBox: "view-box", transformOrigin: `300px ${120 + index * 80}px` }}>
        <m.rect x="66" y={92 + index * 80} width="430" height="56" rx="2" className="syntax-sheet" animate={{ fill: selected ? "var(--site-surface)" : "var(--site-bg)", stroke: selected ? "var(--site-cyan)" : "var(--site-line)" }} transition={settle} />
        <text x="86" y={126 + index * 80} className="syntax-code">
            <tspan className="syntax-delim">{sample.prefix}</tspan>
            <tspan className="syntax-payload">{sample.payload}</tspan>
            <tspan className="syntax-delim">{sample.suffix}</tspan>
        </text>
        <rect x="428" y={106 + index * 80} width="54" height="24" rx="3" className="syntax-delim-tag-bg" />
        <text x="455" y={122 + index * 80} textAnchor="middle" className="syntax-delim-tag-text">{sample.delim}</text>
    </m.g>;
}

function getTilePos(index: number) {
    const col = index % 3, row = Math.floor(index / 3);
    const x = 80 + col * 44 + row * 24;
    const y = 160 + row * 34 - col * 17;
    return { x, y, cx: x + 28, cy: y };
}

function PluginTile({ assembly, index }: { assembly: MotionValue<number>; index: number }) {
    const { x, y } = getTilePos(index);
    const isCore = index === 4;
    const lift = useTransform(assembly, [0, 1], [-55 - index * 7, 0]);
    const col = index % 3;
    const spread = useTransform(assembly, [0, 1], [(col - 1) * 18, 0]);
    return <m.g style={{ y: lift, x: spread }}>
        <path d={`M${x} ${y}l37 -14 20 14 -37 14Z`} className={isCore ? "core-top" : "module-top"} />
        <path d={`M${x} ${y}v14l20 14v-14Z`} className={isCore ? "core-side" : "module-side"} />
        <path d={`M${x + 20} ${y + 14}l37 -14v14l-37 14Z`} className={isCore ? "core-front" : "module-front"} />
    </m.g>;
}

function HostBridge({ assembly, selected, pulse, playing }: MechanismProps) {
    const connection = useTransform(assembly, [.1, .9], [0, 1]);
    const packetX = useTransform(pulse, p => selected === 1 ? 500 - 220 * p : 280 + 220 * p);
    const packetY = useTransform(pulse, p => selected === 2 ? 250 + 285 * p * (1 - p) : selected === 1 ? 204 + 183 * p * (1 - p) : 190 - 240 * p * (1 - p));
    const packetOpacity = useTransform(pulse, [0, .06, .94, 1], [0, 1, 1, 0]);
    const routes = ["M280 190C350 110 430 110 500 190", "M500 204C430 265 350 265 280 204", "M280 250C350 345 430 345 500 250"];

    // Central ApexsionsCore position
    const corePos = getTilePos(4);

    // Failover animations when Operasi (selected === 2) is active:
    const failoverPacketX = useTransform(pulse, p => {
        if (p < 0.3) return 280 + (345 - 280) * (p / 0.3);
        if (p < 0.5) return 345;
        return 345 + (450 - 345) * ((p - 0.5) / 0.5);
    });
    const failoverPacketY = useTransform(pulse, p => {
        if (p < 0.3) return 250 + (275 - 250) * (p / 0.3);
        if (p < 0.5) return 275 + (335 - 275) * ((p - 0.3) / 0.2);
        return 335;
    });
    const failoverTraceLength = useTransform(pulse, [0.3, 0.95], [0, 1]);

    return <>
        <path d="M55 210L196 155 321 229 179 287Z" className="host-platform" />
        <path d="M55 210V233L179 310 321 252V229M179 287V310" className="host-platform-edge" />
        
        {/* Radiating interconnects from central ApexsionsCore to the surrounding 8 plugins */}
        <g className="core-interconnects">
            {[0, 1, 2, 3, 5, 6, 7, 8].map(i => {
                const target = getTilePos(i);
                return <line key={i} x1={corePos.cx} y1={corePos.cy} x2={target.cx} y2={target.cy} className="core-interconnect-line" />;
            })}
        </g>

        {Array.from({ length: 9 }, (_, i) => <PluginTile key={i} assembly={assembly} index={i} />)}
        
        {/* ApexsionsCore callout highlight: leader line terminates before text, zero intersection */}
        <circle cx={corePos.cx} cy={corePos.cy} r="3" className="core-hub-dot" />
        <path d={`M${corePos.cx} ${corePos.cy - 14}V96H152`} className="core-callout-line" />
        <circle cx="152" cy="96" r="1.5" className="core-hub-dot" />
        <text x="142" y="92" textAnchor="end" className="core-callout-title">ApexsionsCore</text>
        <text x="142" y="106" textAnchor="end" className="core-callout-sub">monorepo 9-plugin engine</text>

        <g className="bridge-host">
            <path d="M438 141L501 116 564 153 501 178Z" />
            <path d="M438 141V210L501 247 564 222V153M501 178V247" />
            <path d="M452 169L485 188M452 181L485 200M452 193L472 205" className="host-slots" />
        </g>

        {routes.map((d, i) => <g key={d}>
            <path d={d} className="mechanism-wire" />
            <m.path d={d} className="mechanism-trace" style={{ pathLength: connection }} animate={{ opacity: selected === i ? 1 : .16 }} transition={settle} />
        </g>)}

        {/* Normal packet animation for Game and Bridge */}
        {playing && selected !== 2 && (
            <m.circle r="5" className="bridge-packet" cx={packetX} cy={packetY} style={{ opacity: packetOpacity }} />
        )}

        {/* Automated SQLite Failover Circuit when 'Operasi' tab (selected === 2) is active */}
        {selected === 2 && (
            <g className="failover-subsystem">
                {/* Severed circuit to PostgreSQL */}
                <path d="M345 275H446" className="failover-circuit-severed" />
                <rect x="448" y="262" width="140" height="22" rx="3" className="failover-badge-down" />
                <text x="456" y="277" className="failover-badge-down-text">PostgreSQL [DOWN]</text>

                {/* Automated failover bypass circuit to SQLite */}
                <path d="M280 250L345 275V335H446" className="failover-wire" />
                <m.path d="M345 275V335H446" className="failover-circuit-active" style={{ pathLength: failoverTraceLength }} />
                <rect x="448" y="322" width="140" height="24" rx="3" className="failover-sqlite-badge" />
                <text x="456" y="338" className="failover-sqlite-text">SQLite [AKTIF]</text>

                {/* Relay switch diverter indicator */}
                <circle cx="345" cy="275" r="3.5" fill="var(--site-copper)" />
                <circle cx="345" cy="335" r="3.5" fill="var(--site-cyan)" />

                {playing && (
                    <m.circle r="5" className="failover-packet" cx={failoverPacketX} cy={failoverPacketY} style={{ opacity: packetOpacity }} />
                )}
            </g>
        )}

        <text x="75" y="350" className="mechanism-label">9 plugin Paper</text>
        <text x="438" y="290" className="mechanism-label">Azuriom</text>
        <path d="M62 365H225M438 305H568" className="mechanism-wire" />

        {/* Clean bottom note with opaque backdrop card: curved bridge lines never cut across text */}
        <g className="bridge-note-group">
            <rect x="120" y="393" width="400" height="26" rx="3" className="bridge-note-bg" />
            <text x="320" y="410" textAnchor="middle" className="mechanism-note">
                {selected === 2 ? "Resiliensi: Auto-failover SQLite saat PostgreSQL terputus" : selected === 1 ? "Bridge dua arah: Sinkronisasi game & web real-time" : "ApexsionsCore: 9 plugin Paper terintegrasi"}
            </text>
        </g>
    </>;
}

const workflowStages = [
    "Draf",
    "Ajukan",
    "Review",
    "Verifikasi",
    "Publikasi"
];

function RoleSheet({ assembly, index, selected }: { assembly: MotionValue<number>; index: number; selected: number }) {
    const rotate = useTransform(assembly, [0, 1], [(index - 1) * 19, (index - 1) * 5]);
    const x = useTransform(assembly, [0, 1], [(index - 1) * 55, (index - 1) * 32]);
    const y = useTransform(assembly, [0, 1], [index * -24, index * 20]);
    const active = index === selected;
    return <m.g style={{ rotate, x, y, transformBox: "view-box", transformOrigin: "320px 330px" }} animate={{ opacity: active ? 1 : .55 }} transition={settle}>
        <m.path d="M178 76H426L462 112V320H178Z" className="role-paper" animate={{ stroke: active ? "var(--site-violet)" : "var(--site-line)" }} />
        <path d="M426 76V112H462" className="paper-fold" />
        <text x="204" y="127" className="paper-title">{["Siswa", "Guru", "Admin"][index]}</text>

        {/* Refined verification seal badge in the top-right card corner (never collides with content lines) */}
        {index === 0 && (
            <g transform="translate(378 116)" className="card-seal">
                <rect x="-30" y="-11" width="60" height="20" rx="3" className="card-seal-bg" />
                <text y="3" textAnchor="middle" className="card-seal-text">✓ VERIFIED</text>
            </g>
        )}

        <path d="M204 151H375M204 164H320" className="paper-lines" />
        <rect x="204" y="187" width="72" height="70" className="paper-preview" />
        
        {/* Discreet checkmark seal badge in the preview corner */}
        {index === 0 && (
            <g className="preview-seal">
                <circle cx="262" cy="201" r="7" className="preview-seal-bg" />
                <path d="M259 201l2 2 4 -4" className="preview-seal-check" />
            </g>
        )}

        <path d="M292 196H426M292 212H408M292 228H415M292 244H352M204 281H426" className="paper-lines" />
    </m.g>;
}

function RoleWorkflow({ assembly, selected, pulse }: MechanismProps) {
    const seal = useTransform(pulse, [0, .45, .75, 1], [0, 0, 1, 1]);
    const stage = useTransform(pulse, [0, .8, 1], [0, 1, 1]);
    // Draw the selected role last so its sheet is always readable.
    return <>
        {[0, 1, 2].filter(i => i !== selected).concat(selected).map(i => <RoleSheet key={i} assembly={assembly} index={i} selected={selected} />)}
        <g transform={`translate(${(selected - 1) * 32} ${selected * 20})`}>
            <m.circle cx="395" cy="265" r="24" className="workflow-seal-ring" style={{ pathLength: seal, opacity: seal }} />
            <m.path d="M381 267l10 10 22 -24" className="workflow-seal" style={{ pathLength: seal, opacity: seal }} />
        </g>
        <path d="M120 389H520" className="mechanism-wire" />
        <m.path d="M120 389H520" className="mechanism-trace" style={{ pathLength: stage }} />
        {workflowStages.map((name, i) => {
            const cx = 120 + i * 100;
            return (
                <g key={name} className="workflow-stage-group">
                    <circle cx={cx} cy="389" r="4.5" className="workflow-stop" />
                    <text x={cx} y="375" textAnchor="middle" className="workflow-stage-num">0{i + 1}</text>
                    <text x={cx} y="412" textAnchor="middle" className="workflow-stage-name">{name}</text>
                </g>
            );
        })}
    </>;
}

const toolNames = ["Web", "Crypto", "Forensics", "Reversing"];
const companionTools = ["Burp Suite", "CyberChef", "Wireshark", "Ghidra"];

function ToolStation({ assembly, index, selected }: { assembly: MotionValue<number>; index: number; selected: number }) {
    const angle = index * Math.PI / 2 - Math.PI / 2;
    const x = 320 + Math.cos(angle) * 138, y = 214 + Math.sin(angle) * 138;
    const rotate = useTransform(assembly, [0, 1], [40, 0]);
    return <m.g style={{ rotate, transformBox: "view-box", transformOrigin: "320px 214px" }}>
        <m.circle cx={x} cy={y} r="28" className="tool-socket" animate={{ stroke: selected === index ? "var(--site-cyan)" : "var(--site-line)", fill: selected === index ? "var(--site-surface)" : "var(--site-bg)" }} transition={settle} />
        {index === 0 ? <path d={`M${x - 8} ${y - 9}l-9 9 9 9m16 -18 9 9 -9 9`} className="tool-symbol" /> : index === 1 ? <g className="tool-symbol"><rect x={x - 11} y={y - 1} width="22" height="15" rx="2" /><path d={`M${x - 6} ${y - 1}v-8a6 6 0 0 1 12 0v8`} /></g> : index === 2 ? <g className="tool-symbol"><circle cx={x - 3} cy={y - 3} r="9" /><path d={`M${x + 4} ${y + 4}l10 10`} /></g> : <path d={`M${x - 12} ${y}h24m-17 -8 -8 8 8 8m10 -16 8 8 -8 8`} className="tool-symbol" />}
    </m.g>;
}

function ToolkitDial({ assembly, selected, pulse }: MechanismProps) {
    const rotate = useTransform(assembly, [0, 1], [-110, 0]);
    const trace = useTransform(pulse, [0, .7, 1], [0, 1, 1]);

    // Radial companion tool positions placed cleanly outside sockets with generous clearance
    // Top (Burp Suite), Right (CyberChef), Bottom (Wireshark), Left (Ghidra)
    const companionCoords = [
        { x: 320, y: 24, anchor: "middle" as const },
        { x: 502, y: 218, anchor: "start" as const },
        { x: 320, y: 402, anchor: "middle" as const },
        { x: 138, y: 218, anchor: "end" as const }
    ];

    return <>
        <m.g style={{ rotate, transformBox: "view-box", transformOrigin: "320px 214px" }}>
            <circle cx="320" cy="214" r="105" className="dial-ring" />
            <path d="M320 97A117 117 0 0 1 437 214M320 331A117 117 0 0 1 203 214" className="dial-caliper" />
            {Array.from({ length: 24 }, (_, i) => <path key={i} d="M320 112V118" transform={`rotate(${i * 15} 320 214)`} className="dial-tick" />)}
        </m.g>

        {/* Dial needle with tactile snap transition: starts at radius 36px from center to keep center title unobstructed */}
        <m.g animate={{ rotate: selected * 90 }} style={{ transformBox: "view-box", transformOrigin: "320px 214px" }} transition={snapTransition}>
            <m.path d="M320 178V108" className="mechanism-trace" style={{ pathLength: trace }} />
            <path d="M312 122L320 111 328 122" className="tool-symbol" />
            <circle cx="320" cy="111" r="3" className="dial-needle-tip" />
            <circle cx="320" cy="178" r="3" className="dial-needle-hub" />
        </m.g>

        {[0, 1, 2, 3].map(i => <ToolStation key={i} assembly={assembly} index={i} selected={selected} />)}

        {/* Companion toolchain names cleanly positioned OUTSIDE sockets with comfortable radial padding */}
        {companionTools.map((tool, i) => {
            const coord = companionCoords[i];
            return (
                <text
                    key={tool}
                    x={coord.x}
                    y={coord.y}
                    textAnchor={coord.anchor}
                    className={selected === i ? "tool-companion-active" : "tool-companion"}
                >
                    {tool}
                </text>
            );
        })}

        {/* Clean category title ONLY in center of dial - no colliding subtitle or toolchain lines */}
        <text x="320" y="214" textAnchor="middle" dominantBaseline="central" className="dial-title">{toolNames[selected]}</text>
        
        {/* Bottom note comfortably separated from Wireshark (Wireshark at y=402, note at y=428) */}
        <text x="320" y="428" textAnchor="middle" className="mechanism-note">Instrumen siap sebelum pengujian</text>
    </>;
}

/** Landing-only kinetic studies. Reading content never waits for choreography. */
export function HomeWork({ project, index }: { project: Project; index: number }) {
    const section = useRef<HTMLElement>(null);
    const figure = useRef<HTMLElement>(null);
    const navigate = useNavigate();
    const visible = useInView(figure, { amount: .35 });
    const { reduced } = useMotionPolicy();
    const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
    const assembly = useTransform(scrollYProgress, value => reduced ? 1 : clamp((value - .08) / .48));
    const pulse = useMotionValue(1);
    const [selected, setSelected] = useState(0);
    const [replay, setReplay] = useState(0);
    const spec = projectVisuals[project.id];
    useEffect(() => {
        if (reduced || !visible) { pulse.set(1); return; }
        const playback = animate(pulse, [0, 1], { duration: 1.8, ease: "linear" });
        const visibility = () => { if (document.hidden) { playback.stop(); pulse.set(1); } };
        document.addEventListener("visibilitychange", visibility);
        return () => { playback.stop(); document.removeEventListener("visibilitychange", visibility); };
    }, [reduced, visible, selected, replay, pulse]);
    const props = { assembly, selected, pulse, playing: visible && !reduced };
    const mechanism = project.id === "curated-xssscope" ? <ContextLens {...props} /> : project.id === "curated-apexsions" ? <HostBridge {...props} /> : project.id === "curated-portfolio71" ? <RoleWorkflow {...props} /> : <ToolkitDial {...props} />;
    return <section ref={section} className="home-section home-proof home-kinetic-work" aria-labelledby={`work-${project.id}`}>
        <div className={`public-container home-split ${index % 2 ? "work-reverse" : ""}`}>
            <div className="home-work-copy">
                <h2 id={`work-${project.id}`} data-vt-title={project.id}>{project.title.split(" — ")[0]}</h2>
                <p>{project.solution.split(/\s+/).length > 25 ? project.solution.split(/\s+/).slice(0, 25).join(" ") + "…" : project.solution}</p>
                <Link className="public-text-link home-work-link" to={`/projects/${project.id}`} data-cursor="TELUSURI" onClick={(e) => navigateWithViewTransition(e, navigate, `/projects/${project.id}`, { projectId: project.id, direction: "forward" })}>Telusuri karya <span className="home-link-orbit"><ArrowUpRight /></span></Link>
            </div>
            <div className="home-visual" data-vt-visual={project.id}>
                {!spec || project.image_url ? <ProjectArtwork project={project} /> : <figure ref={figure} className={`home-mechanism mechanism-${project.id}`}>
                    <div className="mechanism-topline"><span>Ilustrasi proses</span><button type="button" onClick={() => setReplay(value => value + 1)} aria-label={`Ulangi ilustrasi ${spec.title}`}><RotateCcw size={15} /><span>Ulangi</span></button></div>
                    <svg className="mechanism-scene" viewBox="0 0 640 440" aria-hidden="true">{mechanism}</svg>
                    <div className="mechanism-controls" role="group" aria-label={`Jelajahi proses ${spec.title}`}>{spec.options.map((option, i) => <button key={option} type="button" aria-pressed={selected === i} onClick={() => { setSelected(i); setReplay(value => value + 1); }}><span className="mechanism-selector" aria-hidden="true" />{option}</button>)}</div>
                    <figcaption aria-live="polite">{spec.captions[selected]}</figcaption>
                </figure>}
            </div>
        </div>
    </section>;
}

export function HomeStory() {
    const section = useRef<HTMLElement>(null);
    const navigate = useNavigate();
    const visible = useInView(section, { amount: .15 });
    const { reduced } = useMotionPolicy();
    const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "center center"] });
    const build = useTransform(scrollYProgress, value => reduced ? 1 : clamp(value));
    const roof = useTransform(build, [0, 1], ["M36 110L106 110L176 110", "M36 110L106 46L176 110"]);
    const walls = useTransform(build, [0, 1], ["M55 110V140H157V110", "M55 92V170H157V92"]);
    const thread = useTransform(build, [0, 1], [.12, 1]);
    const nodeGlow = useTransform(build, [0.85, 1], [0, 1]);
    const haloScale = useTransform(build, [0.85, 1], [0.6, 1.25]);

    return <section ref={section} className={`home-section home-personal home-story-motion${visible && !reduced ? " is-visible" : ""}`} aria-labelledby="home-story"><div className="public-container home-split">
        <div><h2 id="home-story">Kode yang berarti<br /><em>sesuatu di rumah.</em></h2>
            <svg className="home-story-thread" viewBox="0 0 560 215" aria-hidden="true">
                <defs>
                    <filter id="story-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <path d="M157 140H250L280 110H540" className="story-thread-base" />
                <m.path d="M540 110H280L250 140H157" className="story-thread-light" style={{ pathLength: thread }} />
                <m.path d={roof} className="story-house" /><m.path d={walls} className="story-house" />
                <m.path d="M94 170V135H119V170" className="story-house" style={{ pathLength: build }} />

                {/* Subtle luminous glow pulse on the final node when thread trace completes */}
                <m.circle cx="540" cy="110" r="16" className="story-node-aura" style={{ opacity: nodeGlow, scale: haloScale, transformBox: "view-box", transformOrigin: "540px 110px" }} />
                <m.circle cx="540" cy="110" r="9" className="story-node-halo" style={{ opacity: nodeGlow }} />
                <circle cx="540" cy="110" r="4.5" className="story-thread-node story-final-node" filter="url(#story-glow)" />
            </svg>
        </div>
        <div><p>Saya mulai menghasilkan uang sejak SMP, termasuk dari server Minecraft yang saya jalankan. Penghasilan itu dipakai orang tua untuk cicilan keluarga. Dari sana, saya terus belajar merancang, membangun, mengaudit, dan mengoperasikan sistem sendiri.</p>
            <Link className="public-text-link home-work-link" to="/about" data-cursor="TENTANG" onClick={(e) => navigateWithViewTransition(e, navigate, "/about", { direction: "forward" })}>Kenali perjalanan saya <span className="home-link-orbit"><ArrowUpRight /></span></Link>
        </div>
    </div></section>;
}
