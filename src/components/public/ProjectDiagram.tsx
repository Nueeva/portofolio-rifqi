import { useId, useRef, useState } from "react";
import { useInView } from "motion/react";
import * as m from "motion/react-m";
import { RotateCcw } from "lucide-react";
import { useMotionPolicy } from "./motionPolicyContext";
import { projectVisuals } from "./projectVisuals";
export function ProjectDiagram({ id }: {
    id: string;
}) {
    const figure = useRef<HTMLElement>(null);
    const visible = useInView(figure, { amount: .25 });
    const spec = projectVisuals[id];
    const uid = useId().replace(/:/g, "");
    const [selected, setSelected] = useState(0);
    const [replay, setReplay] = useState(0);
    const { reduced } = useMotionPolicy();
    if (!spec)
        return null;
    const xss = id.endsWith("xssscope"), apex = id.endsWith("apexsions"), portfolio = id.endsWith("portfolio71");
    const nodes = xss ? ["Parameter", spec.options[selected], "Verifikasi"] : apex ? ["9 plugin Paper", "Bridge / Azuriom", "PostgreSQL / SQLite"] : portfolio ? ["Siswa", "Guru", "Admin"] : spec.options;
    return <figure ref={figure} className={`technical-figure ${xss ? "diagram-xss" : apex ? "diagram-apex" : portfolio ? "diagram-roles" : "diagram-ctf"}`}>
  <div className="diagram-topline"><span>{spec.title}</span><button type="button" aria-label={`Ulangi ilustrasi ${spec.title}`} onClick={() => setReplay(v => v + 1)}><RotateCcw size={16}/>Ulangi</button></div>
  <svg className="system-diagram" viewBox="0 0 620 330" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
   <title id={`${uid}-title`}>{`${spec.title}: ilustrasi proses`}</title><desc id={`${uid}-desc`}>{spec.captions[selected]}</desc>
   <defs><linearGradient id={`${uid}-flow`}><stop stopColor="var(--site-cyan)"/><stop offset="1" stopColor="var(--site-violet)"/></linearGradient></defs>
   {apex && Array.from({ length: 9 }, (_, i) => <g key={i}><rect x={36 + (i % 3) * 39} y={106 + Math.floor(i / 3) * 39} width="26" height="26" rx="3" className="plugin-cell"/></g>)}
   {apex && <g className="host-frames"><rect x="16" y="77" width="166" height="137" rx="4"/><rect x="225" y="77" width="165" height="137" rx="4"/><text x="98" y="62" textAnchor="middle">Host game</text><text x="308" y="62" textAnchor="middle">Host website</text><text x="523" y="62" textAnchor="middle">Fallback database</text></g>}
   {xss && <g className="context-brackets"><path d="M58 85H30V245H58 M562 85H590V245H562"/><text x="310" y="68" textAnchor="middle">REFLECTION CONTEXT</text></g>}
   {apex && ["M140 165Q215 70 310 165", "M355 165Q420 265 525 165"].map((d, i) => <g key={d}><path d={d} className="diagram-wire"/><m.path key={`${replay}-${selected}-${i}`} d={d} fill="none" stroke={`url(#${uid}-flow)`} strokeWidth="3" initial={false} animate={reduced || !visible ? { pathLength: 1 } : { pathLength: [0, 1] }} transition={{ duration: .4, delay: i * .08 }}/></g>)}
   {apex && nodes.map((node, i) => {
            const cx = nodes.length === 4 ? 82 + i * 152 : 95 + i * 215;
            const active = xss ? i === 1 : selected === i;
            return <g key={node} className={active ? "diagram-node is-selected" : "diagram-node"}>
     <m.circle cx={cx} cy="165" r={apex && i === 0 ? 0 : active ? 47 : 35} initial={false} animate={{ scale: active && !reduced ? [.96, 1] : 1 }} transition={{ duration: .35 }}/>
     {(!apex || i !== 0) && <><circle cx={cx} cy="165" r="4" className="node-core"/><path d={`M${cx - 18} 165h36 M${cx} 147v36`} className="node-cross"/></>}
     <text x={cx} y="244" textAnchor="middle">{node}</text></g>;
        })}
   {xss && <g className="inspection-window"><rect x="30" y="88" width="560" height="205" rx="8"/><m.rect x="44" width="532" height="45" rx="4" initial={false} animate={{ y: 115 + selected * 53 }} transition={{ duration: reduced ? 0 : .45 }} className="context-focus"/>{['<body> input </body>', 'attribute="input"', 'const value = "input"'].map((line, i) => <text x="70" y={145 + i * 53} key={line} className="diagram-code">{line}</text>)}</g>}
   {portfolio && <g className="role-lanes">{spec.options.map((role, i) => <g key={role}><path d={`M40 ${100 + i * 73}H580`} className="diagram-wire"/><text x="45" y={90 + i * 73}>{role}</text>{Array.from({ length: 5 }, (_, j) => <rect key={j} x={210 + j * 70} y={75 + i * 73} width="42" height="28" rx="3" className="workflow-stage"/>)}</g>)}<m.rect x="200" width="340" height="50" rx="5" className="context-focus" initial={false} animate={{ y: 64 + selected * 73 }} transition={{ duration: reduced ? 0 : .4 }}/></g>}
   {!xss && !portfolio && !apex && <g className="category-map">{spec.options.map((name, i) => { const x = 50 + (i % 2) * 295, y = 85 + Math.floor(i / 2) * 115; return <g key={name}><m.rect x={x} y={y} width="230" height="80" rx="4" initial={false} animate={{ fill: i === selected ? 'var(--site-surface)' : 'var(--site-low)', stroke: i === selected ? 'var(--site-cyan)' : 'var(--site-line)' }} transition={{ duration: .35 }}/><text x={x + 115} y={y + 45} textAnchor="middle">{name}</text></g>; })}</g>}
   {!reduced && visible && <g key={`process-${selected}-${replay}`} aria-hidden="true" className="diagram-demonstration">
     {xss && <m.rect x="48" y={115 + selected * 53} width="3" height="45" fill="var(--site-cyan)" initial={{ x: 0, opacity: 0 }} animate={{ x: [0, 0, 518], opacity: [0, 1, 1, 0] }} transition={{ duration: 1.6, ease: [.22, 1, .36, 1] }} />}
     {portfolio && <m.rect x="213" y={80 + selected * 73} width="36" height="18" rx="2" fill="var(--site-cyan)" initial={{ x: 0, opacity: 0 }} animate={{ x: [0, 70, 140, 210, 280], opacity: [0, 1, 1, 1, 0] }} transition={{ duration: 1.8, ease: "easeInOut" }} />}
     {apex && [0, 1].map(i => <m.circle key={i} r="5" fill="var(--site-cyan)" initial={{ opacity: 0 }} animate={{ cx: i ? [355, 437.5, 525] : [140, 220, 310], cy: i ? [165, 215, 165] : [165, 117.5, 165], opacity: [0, 1, 0] }} transition={{ duration: .9, delay: i * .7, ease: "linear" }} />)}
     {!xss && !portfolio && !apex && <m.rect x={50 + (selected % 2) * 295} y={85 + Math.floor(selected / 2) * 115} width="230" height="80" rx="4" fill="none" stroke="var(--site-cyan)" strokeWidth="2" initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [.5, 1, .5] }} transition={{ duration: 1.2, ease: [.22, 1, .36, 1] }} />}
   </g>}
   {apex && <text x="310" y="300" textAnchor="middle" className="diagram-result">13 critical + 19 major / diperbaiki</text>}
  </svg>
  <div className="diagram-controls" role="group" aria-label={`Pilih konteks ${spec.title}`}>{spec.options.map((option, i) => <button type="button" key={option} aria-pressed={selected === i} onClick={() => setSelected(i)}>{option}{selected === i && <m.span layoutId={`${uid}-selection`} className="diagram-indicator"/>}</button>)}</div>
  <figcaption><span>Ilustrasi proses</span><p aria-live="polite">{spec.captions[selected]}</p></figcaption>
 </figure>;
}
