import { useId, useState } from "react";
import * as m from "motion/react-m";
import { RotateCcw } from "lucide-react";
import { useMotionPolicy } from "./motionPolicyContext";
import { projectVisuals } from "./projectVisuals";
export function ProjectDiagram({ id }: {
    id: string;
}) {
    const spec = projectVisuals[id];
    const uid = useId().replace(/:/g, "");
    const [selected, setSelected] = useState(0);
    const [replay, setReplay] = useState(0);
    const { reduced } = useMotionPolicy();
    if (!spec)
        return null;
    const xss = id.endsWith("xssscope"), apex = id.endsWith("apexsions"), portfolio = id.endsWith("portfolio71");
    const nodes = xss ? ["Parameter", spec.options[selected], "Verifikasi"] : apex ? ["9 plugin Paper", "Bridge / Azuriom", "PostgreSQL / SQLite"] : portfolio ? ["Siswa", "Guru", "Admin"] : spec.options;
    return <figure className={`technical-figure ${xss ? "diagram-xss" : apex ? "diagram-apex" : portfolio ? "diagram-roles" : "diagram-ctf"}`}>
  <div className="diagram-topline"><span>{spec.title}</span><button type="button" aria-label={`Ulangi ilustrasi ${spec.title}`} onClick={() => setReplay(v => v + 1)}><RotateCcw size={16}/>Ulangi</button></div>
  <svg className="system-diagram" viewBox="0 0 620 330" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
   <title id={`${uid}-title`}>{`${spec.title}: ilustrasi proses`}</title><desc id={`${uid}-desc`}>{spec.captions[selected]}</desc>
   <defs><linearGradient id={`${uid}-flow`}><stop stopColor="var(--site-cyan)"/><stop offset="1" stopColor="var(--site-violet)"/></linearGradient></defs>
   {apex && Array.from({ length: 9 }, (_, i) => <g key={i}><rect x={36 + (i % 3) * 39} y={106 + Math.floor(i / 3) * 39} width="26" height="26" rx="3" className="plugin-cell"/></g>)}
   {apex && <g className="host-frames"><rect x="16" y="77" width="166" height="137" rx="4"/><rect x="225" y="77" width="165" height="137" rx="4"/><text x="98" y="62" textAnchor="middle">Host game</text><text x="308" y="62" textAnchor="middle">Host website</text><text x="523" y="62" textAnchor="middle">Fallback database</text></g>}
   {xss && <g className="context-brackets"><path d="M58 85H30V245H58 M562 85H590V245H562"/><text x="310" y="68" textAnchor="middle">REFLECTION CONTEXT</text></g>}
   {["M140 165H265", "M355 165H480"].map((d, i) => <g key={d}><path d={d} className="diagram-wire"/><m.path key={`${replay}-${selected}-${i}`} d={d} fill="none" stroke={`url(#${uid}-flow)`} strokeWidth="3" initial={false} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1] }} transition={{ duration: .4, delay: i * .08 }}/></g>)}
   {nodes.map((node, i) => {
            const cx = nodes.length === 4 ? 82 + i * 152 : 95 + i * 215;
            const active = xss ? i === 1 : selected === i;
            return <g key={node} className={active ? "diagram-node is-selected" : "diagram-node"}>
     <m.circle cx={cx} cy="165" r={apex && i === 0 ? 0 : active ? 47 : 35} initial={false} animate={{ scale: active && !reduced ? [.96, 1] : 1 }} transition={{ duration: .35 }}/>
     {(!apex || i !== 0) && <><circle cx={cx} cy="165" r="4" className="node-core"/><path d={`M${cx - 18} 165h36 M${cx} 147v36`} className="node-cross"/></>}
     <text x={cx} y="244" textAnchor="middle">{node}</text></g>;
        })}
   {portfolio && Array.from({ length: 5 }, (_, i) => <rect key={i} x={210 + i * 40} y="285" width="24" height="4" className={selected === 1 ? "workflow-stage active" : "workflow-stage"}/>)}
   {xss && <text x="310" y="290" textAnchor="middle" className="diagram-code">{selected === 0 ? '<body> input </body>' : selected === 1 ? 'attribute="input"' : 'const value = "input"'}</text>}
   {apex && <text x="310" y="300" textAnchor="middle" className="diagram-result">13 critical + 19 major / diperbaiki</text>}
  </svg>
  <div className="diagram-controls" role="group" aria-label={`Pilih konteks ${spec.title}`}>{spec.options.map((option, i) => <button type="button" key={option} aria-pressed={selected === i} onClick={() => setSelected(i)}>{option}{selected === i && <m.span layoutId={`${uid}-selection`} className="diagram-indicator"/>}</button>)}</div>
  <figcaption><span>Ilustrasi proses</span><p aria-live="polite">{spec.captions[selected]}</p></figcaption>
 </figure>;
}
