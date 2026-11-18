import { useId, useRef, useState } from "react";
import { useInView } from "motion/react";
import * as m from "motion/react-m";
import { RotateCcw } from "lucide-react";
import { useMotionPolicy } from "./motionPolicyContext";
import { projectVisuals } from "./projectVisuals";

const xssRows = [
  { prefix: "<div>", payload: "{PAYLOAD}", suffix: "</div>", delim: "< >", codeY: 123, rowY: 94 },
  { prefix: '<input value="', payload: "{PAYLOAD}", suffix: '">', delim: '"', codeY: 179, rowY: 150 },
  { prefix: "const v = '", payload: "{PAYLOAD}", suffix: "';", delim: "'", codeY: 235, rowY: 206 },
];

const portfolioStages = ["Draf", "Ajukan", "Review", "Verif", "Publik"];

const ctfBays = [
  { code: "01 // WEB", name: "Web", tool: "Burp Suite", x: 36, y: 52, wire: "M286 155L258 136H226" },
  { code: "02 // CRYPTO", name: "Crypto", tool: "CyberChef", x: 344, y: 52, wire: "M334 155L362 136H394" },
  { code: "03 // FORENSICS", name: "Forensics", tool: "Wireshark", x: 36, y: 196, wire: "M286 175L258 196H226" },
  { code: "04 // REVERSING", name: "Reversing", tool: "Ghidra", x: 344, y: 196, wire: "M334 175L362 196H394" },
];

export function ProjectDiagram({ id }: { id: string }) {
  const figure = useRef<HTMLElement>(null);
  const visible = useInView(figure, { amount: 0.25 });
  const spec = projectVisuals[id];
  const uid = useId().replace(/:/g, "");
  const [selected, setSelected] = useState(0);
  const [replay, setReplay] = useState(0);
  const { reduced } = useMotionPolicy();

  if (!spec) return null;

  const xss = id.endsWith("xssscope");
  const apex = id.endsWith("apexsions");
  const portfolio = id.endsWith("portfolio71");
  const settle = { duration: reduced ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <figure
      ref={figure}
      className={`technical-figure ${xss ? "diagram-xss" : apex ? "diagram-apex" : portfolio ? "diagram-roles" : "diagram-ctf"}`}
    >
      <div className="diagram-topline">
        <span>{spec.title}</span>
        <button
          type="button"
          aria-label={`Ulangi ilustrasi ${spec.title}`}
          onClick={() => setReplay((v) => v + 1)}
        >
          <RotateCcw size={16} />
          Ulangi
        </button>
      </div>

      <svg className="system-diagram" viewBox="0 0 620 330" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
        <title id={`${uid}-title`}>{`${spec.title}: ilustrasi proses`}</title>
        <desc id={`${uid}-desc`}>{spec.captions[selected]}</desc>
        <defs>
          <linearGradient id={`${uid}-flow`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--site-cyan)" />
            <stop offset="100%" stopColor="var(--site-copper)" />
          </linearGradient>
        </defs>

        {xss && (
          <>
            <g className="context-brackets">
              <path d="M58 64H32V270H58 M562 64H588V270H562" />
              <text x="310" y="48" textAnchor="middle">
                REFLECTION CONTEXT // AST SCAN
              </text>
            </g>
            <g className="inspection-window">
              <rect x="36" y="72" width="548" height="202" rx="3" />
              <m.rect
                x="48"
                width="524"
                height="48"
                rx="2"
                initial={false}
                animate={{ y: xssRows[selected].rowY }}
                transition={settle}
                className="context-focus"
              />
              {xssRows.map((row) => (
                <g key={row.delim}>
                  <text x="68" y={row.codeY} className="diagram-code">
                    <tspan className="diagram-syntax-delim">{row.prefix}</tspan>
                    <tspan className="diagram-syntax-payload">{row.payload}</tspan>
                    <tspan className="diagram-syntax-delim">{row.suffix}</tspan>
                  </text>
                  <rect x="498" y={row.rowY + 12} width="54" height="24" rx="2" className="diagram-tag-bg" />
                  <text x="525" y={row.rowY + 28} textAnchor="middle" className="diagram-tag-text">
                    {row.delim}
                  </text>
                </g>
              ))}
            </g>
            {!reduced && visible && (
              <m.rect
                key={`xss-${selected}-${replay}`}
                aria-hidden="true"
                x="52"
                y={xssRows[selected].rowY}
                width="3"
                height="48"
                fill="var(--site-cyan)"
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: [0, 0, 514], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <text x="310" y="305" textAnchor="middle" className="diagram-subnote">
              Delimitasi aktif: {xssRows[selected].delim} · Verifikasi payload keluar dari konteks
            </text>
          </>
        )}

        {apex && (
          <>
            <g className="host-frames">
              <rect x="20" y="64" width="168" height="162" rx="3" />
              <rect x="226" y="64" width="168" height="162" rx="3" />
              <rect x="432" y="64" width="168" height="162" rx="3" />
              <text x="104" y="48" textAnchor="middle">
                HOST GAME (PAPER 26.2)
              </text>
              <text x="310" y="48" textAnchor="middle">
                HOST WEB (AZURIOM)
              </text>
              <text x="516" y="48" textAnchor="middle">
                PERSISTENCE TIER
              </text>
            </g>

            {/* ApexsionsCore 3x3 plugin matrix */}
            <g className="core-interconnects">
              {[0, 1, 2, 3, 5, 6, 7, 8].map((i) => {
                const tx = 56 + (i % 3) * 44;
                const ty = 98 + Math.floor(i / 3) * 44;
                return (
                  <line
                    key={i}
                    x1="100"
                    y1="142"
                    x2={tx}
                    y2={ty}
                    className="diagram-interconnect"
                  />
                );
              })}
            </g>
            {Array.from({ length: 9 }, (_, i) => {
              const cx = 43 + (i % 3) * 44;
              const cy = 85 + Math.floor(i / 3) * 44;
              const isCore = i === 4;
              return (
                <rect
                  key={i}
                  x={cx}
                  y={cy}
                  width="26"
                  height="26"
                  rx="2"
                  className={isCore ? "plugin-cell is-core" : "plugin-cell"}
                />
              );
            })}

            {/* Website HMAC Bridge Node */}
            <g className={`diagram-node ${selected === 1 ? "is-selected" : ""}`}>
              <circle cx="310" cy="145" r={selected === 1 ? 44 : 36} />
              <circle cx="310" cy="145" r="4" className="node-core" />
              <path d="M292 145h36 M310 127v36" className="node-cross" />
              <text x="310" y="206" textAnchor="middle" className="diagram-tag-text">
                HMAC-SHA256 BRIDGE
              </text>
            </g>

            {/* Primary & Failover DB Tiers */}
            <rect
              x="448"
              y="84"
              width="136"
              height="48"
              rx="2"
              className={`db-tier ${selected === 2 ? "is-severed" : "is-primary"}`}
            />
            <text x="516" y="106" textAnchor="middle" className="diagram-tag-text">
              PostgreSQL
            </text>
            <text x="516" y="122" textAnchor="middle" className="diagram-subnote">
              {selected === 2 ? "[TERPUTUS]" : "[PRIMARY]"}
            </text>

            <rect
              x="448"
              y="156"
              width="136"
              height="48"
              rx="2"
              className={`db-tier ${selected === 2 ? "is-failover-active" : ""}`}
            />
            <text x="516" y="178" textAnchor="middle" className="diagram-tag-text">
              SQLite V1-V7
            </text>
            <text x="516" y="194" textAnchor="middle" className="diagram-subnote">
              {selected === 2 ? "[FAILOVER AKTIF]" : "[STANDBY]"}
            </text>

            {/* Connecting wires */}
            <path d="M188 134Q207 110 226 134" className="diagram-wire" />
            <path d="M226 156Q207 180 188 156" className="diagram-wire" />
            <path d="M394 128Q413 108 432 108" className="diagram-wire" />
            <path d="M394 154L412 180H432" className="diagram-wire" />

            <m.path
              key={`apex-bridge-${replay}-${selected}`}
              d={selected === 2 ? "M394 154L412 180H448" : selected === 1 ? "M226 156Q207 180 188 156" : "M188 134Q207 110 226 134"}
              fill="none"
              stroke={`url(#${uid}-flow)`}
              strokeWidth="2.5"
              initial={false}
              animate={reduced || !visible ? { pathLength: 1 } : { pathLength: [0, 1] }}
              transition={{ duration: 0.55 }}
            />

            {!reduced && visible && (
              <m.circle
                key={`apex-pkt-${selected}-${replay}`}
                aria-hidden="true"
                r="4.5"
                fill="var(--site-cyan)"
                initial={{ opacity: 0 }}
                animate={
                  selected === 2
                    ? { cx: [394, 412, 448], cy: [154, 180, 180], opacity: [0, 1, 1, 0] }
                    : selected === 1
                    ? { cx: [226, 207, 188], cy: [156, 168, 156], opacity: [0, 1, 0] }
                    : { cx: [188, 207, 226], cy: [134, 122, 134], opacity: [0, 1, 0] }
                }
                transition={{ duration: 1.1, ease: "easeInOut" }}
              />
            )}

            <text x="104" y="254" textAnchor="middle">
              9 plugin Paper
            </text>
            <text x="310" y="254" textAnchor="middle">
              Bridge dua arah
            </text>
            <text x="516" y="254" textAnchor="middle">
              Fallback atomik
            </text>
            <text x="310" y="302" textAnchor="middle" className="diagram-result">
              13 critical + 19 major / diperbaiki
            </text>
          </>
        )}

        {portfolio && (
          <>
            <text x="42" y="48" className="diagram-tag-text">
              SANCTUM // RBAC BOUNDARY
            </text>
            {portfolioStages.map((stage, j) => (
              <text key={stage} x={224 + j * 76} y="48" textAnchor="middle" className="diagram-subnote">
                0{j + 1} {stage}
              </text>
            ))}

            <g className="role-lanes">
              {spec.options.map((role, i) => {
                const y = 104 + i * 70;
                const active = selected === i;
                return (
                  <g key={role}>
                    <path d={`M40 ${y}H574`} className="diagram-wire" />
                    <text x="44" y={y - 14} className={active ? "diagram-tag-text" : undefined}>
                      {role}
                    </text>
                    {portfolioStages.map((stage, j) => (
                      <rect
                        key={stage}
                        x={208 + j * 76}
                        y={y - 12}
                        width="32"
                        height="24"
                        rx="2"
                        className={active ? "workflow-stage active" : "workflow-stage"}
                      />
                    ))}
                  </g>
                );
              })}
            </g>

            <m.rect
              x="194"
              width="368"
              height="46"
              rx="3"
              className="context-focus"
              initial={false}
              animate={{ y: 81 + selected * 70 }}
              transition={settle}
            />

            {!reduced && visible && (
              <m.rect
                key={`port-${selected}-${replay}`}
                aria-hidden="true"
                x="211"
                y={96 + selected * 70}
                width="26"
                height="16"
                rx="2"
                fill="var(--site-cyan)"
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: [0, 76, 152, 228, 304], opacity: [0, 1, 1, 1, 0] }}
                transition={{ duration: 1.7, ease: "easeInOut" }}
              />
            )}

            <text x="310" y="305" textAnchor="middle" className="diagram-subnote">
              Workflow terotorisasi: Siswa (Publikasi) · Guru (Review) · Admin (Kelola)
            </text>
          </>
        )}

        {!xss && !portfolio && !apex && (
          <>
            {/* Central Calibrated Crosshair Hub */}
            <circle cx="310" cy="165" r="24" className="dial-center-hub" />
            <path d="M310 132V146 M310 184V198 M277 165H291 M329 165H343" className="node-cross" />
            <text x="310" y="169" textAnchor="middle" className="diagram-tag-text">
              SIAP
            </text>

            {/* 2x2 Tactical Instrument Bays */}
            {ctfBays.map((bay, i) => {
              const active = i === selected;
              return (
                <g key={bay.code}>
                  <path d={bay.wire} className="diagram-wire" />
                  {active && (
                    <m.path
                      key={`ctf-wire-${selected}-${replay}`}
                      d={bay.wire}
                      className="mechanism-trace"
                      initial={false}
                      animate={reduced || !visible ? { pathLength: 1 } : { pathLength: [0, 1] }}
                      transition={{ duration: 0.45 }}
                    />
                  )}
                  <m.rect
                    x={bay.x}
                    y={bay.y}
                    width="240"
                    height="82"
                    rx="3"
                    initial={false}
                    animate={{
                      fill: active ? "var(--site-surface)" : "var(--site-bg)",
                      stroke: active ? "var(--site-cyan)" : "var(--site-line)",
                    }}
                    transition={settle}
                  />
                  <text x={bay.x + 18} y={bay.y + 26} className="diagram-subnote">
                    {bay.code}
                  </text>
                  <circle
                    cx={bay.x + 218}
                    cy={bay.y + 22}
                    r="3.5"
                    fill={active ? "var(--site-cyan)" : "var(--site-line)"}
                  />
                  <text x={bay.x + 18} y={bay.y + 56} className="diagram-bay-title">
                    {bay.name}
                  </text>
                  <text x={bay.x + 222} y={bay.y + 56} textAnchor="end" className="diagram-tag-text">
                    {bay.tool}
                  </text>
                </g>
              );
            })}

            {!reduced && visible && (
              <m.rect
                key={`ctf-${selected}-${replay}`}
                aria-hidden="true"
                x={ctfBays[selected].x}
                y={ctfBays[selected].y}
                width="240"
                height="82"
                rx="3"
                fill="none"
                stroke="var(--site-cyan)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: [0.6, 1, 0.4] }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            <text x="310" y="308" textAnchor="middle" className="diagram-subnote">
              Instrumen siap sebelum ronde dimulai: Web · Crypto · Forensics · Reversing
            </text>
          </>
        )}
      </svg>

      <div className="diagram-controls" role="group" aria-label={`Pilih konteks ${spec.title}`}>
        {spec.options.map((option, i) => (
          <button
            type="button"
            key={option}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              setReplay((v) => v + 1);
            }}
          >
            {option}
            {selected === i && <m.span layoutId={`${uid}-selection`} className="diagram-indicator" />}
          </button>
        ))}
      </div>

      <figcaption>
        <span>Ilustrasi proses</span>
        <p aria-live="polite">{spec.captions[selected]}</p>
      </figcaption>
    </figure>
  );
}
