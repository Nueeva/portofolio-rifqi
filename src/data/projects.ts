import type { Database } from "@/integrations/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

/**
 * Long-form case study attached to a curated project. Rendered on the
 * dedicated `/projects/:id` page: narrative sections that expand on the
 * one-line problem/solution shown on the Projects grid.
 */
export interface CaseStudy {
  role: string;
  period: string;
  overview: string;
  challenges: string[];
  approach: string[];
  outcomes: string[];
  lessons?: string;
}

export type CuratedProject = Project & { caseStudy?: CaseStudy };

/**
 * Rifqi's real projects, curated from his GitHub (github.com/Nueeva).
 * These render first on the Projects page; anything managed through the
 * admin panel (Supabase `projects` table) is appended after them, and this
 * list doubles as the fallback when the database is unreachable.
 */
export const curatedProjects: CuratedProject[] = [
  {
    id: "curated-xssscope",
    title: "xssscope — Reflected XSS Scanner",
    category: "tools",
    problem:
      "Manually probing endpoints for reflected XSS is slow and repetitive: every parameter needs its own payload, reflection check, and context analysis.",
    solution:
      "A zero-dependency JavaScript scanner that probes parameters, classifies reflection contexts, and verifies findings automatically — no framework, no install weight, just run it.",
    tech_stack: ["JavaScript", "Node.js", "HTTP Probing", "Context Analysis"],
    github_url: "https://github.com/Nueeva/xssscope",
    demo_url: null,
    image_url: null,
    created_at: "2026-09-18T00:00:00Z",
    updated_at: "2026-09-18T00:00:00Z",
    caseStudy: {
      role: "Designer & Developer (solo)",
      period: "September 2026",
      overview:
        "xssscope is a small, sharp tool built out of a repetitive chore. Testing endpoints for reflected cross-site scripting by hand means sending payload after payload, eyeballing responses, and repeating the same reasoning for every parameter. xssscope automates that loop end to end: it probes parameters, works out where the input is reflected, and verifies whether the reflection is actually exploitable — all as plain Node.js with zero dependencies.",
      challenges: [
        "Reflected input is not automatically a vulnerability. The scanner has to determine where a payload lands — HTML body, attribute value, script context — before it can judge whether the reflection matters.",
        "False positives are worse than slow scans: a tool that cries wolf on every reflection gets ignored, so findings need automatic verification instead of raw reflection matches.",
        "Staying dependency-free meant implementing the HTTP probing and the reflection-context analysis directly, with no framework to lean on.",
      ],
      approach: [
        "Probe each parameter with marker payloads and track precisely how the input comes back in the response.",
        "Classify the reflection context — markup, attribute value, JavaScript string, and similar — to decide which payload shapes are relevant for that spot.",
        "Verify candidate findings automatically before reporting them, so the output is a short, actionable list rather than noise.",
        "Package everything as plain Node.js with zero dependencies: clone the repository and run it, nothing to install or audit first.",
      ],
      outcomes: [
        "A single-command scanner that turns a repetitive manual probing routine into an automated pass.",
        "Findings are reported together with their reflection context, which makes triage and manual confirmation much faster.",
        "Zero install weight — no framework and no dependency tree to audit or maintain.",
      ],
      lessons:
        "The hard part of a scanner is not sending payloads — it is deciding what a reflection actually means. Context classification and verification are where the real value lives; the probing itself is the easy half.",
    },
  },
  {
    id: "curated-apexsions",
    title: "Apexsions — A Full Minecraft Server System",
    category: "tools",
    problem:
      "A public Minecraft server is a whole production system — game logic, a player economy, a community website, databases, hosting — and most operators assemble it from third-party parts they cannot audit. Every layer then inherits the risk of code and infrastructure that nobody fully controls, and the players pay for it when something breaks.",
    solution:
      "One system, designed, built, and operated end to end by a single person: a nine-plugin Paper suite written in-house, an Azuriom community website joined to the game through a custom two-way bridge, a full self-audit that fixed 13 critical and 19 major findings, and a production deployment across two hosts that stayed online even when its primary database failed.",
    tech_stack: [
      "Java",
      "Paper API",
      "Maven",
      "Azuriom",
      "Pterodactyl",
      "PostgreSQL / SQLite",
      "Cloudflare R2",
    ],
    github_url: "https://github.com/Nueeva/Apexsions",
    demo_url: null,
    image_url: null,
    created_at: "2026-10-02T00:00:00Z",
    updated_at: "2026-10-25T00:00:00Z",
    caseStudy: {
      role: "Architect, Developer & Operator (solo)",
      period: "October 2026",
      overview:
        "Apexsions is not a plugin pack — it is the complete system behind a public Minecraft server, and one person owns every layer of it. The game layer is a suite of nine Paper plugins written in-house. The web layer is an Azuriom community site connected to the server through a custom bridge. Underneath sits the infrastructure layer: two hosts, a management panel, domain and DNS, and object storage. Across all of it runs a security layer — a full audit of the codebase before players were exposed to it — and an operations layer that deploys, restarts, and keeps the whole thing alive on production infrastructure. Architect, developer, security auditor, and operator are the same person.",
      challenges: [
        "A public server inherits the risk of every line of code it runs: a single plugin flaw can duplicate the in-game currency, delete player items, or hang the server — exactly the classes of bugs the audit later found.",
        "Nine plugins sharing player, economy, and progression data — plus a website reflecting the same state — have to stay consistent with each other without any layer becoming a single point of failure.",
        "The plugin builds are large shaded JARs (the core plugin alone is roughly 24 MB) that had to be assembled and verified by hand, because the automated Maven build path was unavailable in the build environment.",
        "Production runs on managed hosting: deploys go through the Pterodactyl panel, restarts are only acceptable when no players are online, and when the primary PostgreSQL database went down, the system had to keep serving players anyway.",
      ],
      approach: [
        "Game: built the suite as a monorepo of nine Paper plugins on Java 21 — Core, Economy, Chat, Shop, Crates, Battlepass, CustomEnchants, Fishing, and Media — sharing one core library instead of copying code; one cleanup pass consolidated 28 duplicated files (about 5,300 lines) into ApexsionsCore.",
        "Web: built the community site on Azuriom with a custom theme and a custom bridge plugin — two-way REST synchronization between website and game server, in-game account linking, and web admin views over live player data and territory finances.",
        "Infrastructure: split the system across two hosts — the game server at Jagoanhosting managed through Pterodactyl, the website on its own production VPS — under the apexsions.my.id domain, with Cloudflare and R2 object storage around them.",
        "Security: audited the entire codebase before launch and catalogued every finding by severity — 13 critical (money duplication, item loss, server hangs, unsafe async calls, a live API key committed to the repository) and 19 major — then fixed all of them across 16 commits, merged through a reviewed pull request with regression tests.",
        "Operations: deployed like an operator, not a demo — old JARs backed up first, player count verified empty before the restart, and the server came back with all 11 plugins enabled and zero disabled. When PostgreSQL stayed down, applied an SQLite fallback with direct SQL migrations (V1–V7) so the core services kept running.",
      ],
      outcomes: [
        "13 critical and 19 major security findings found and fixed before players were exposed to them — including a money-duplication bug and a live API key sitting in the repository.",
        "The complete system runs in production: all nine in-house plugins enabled on the game server, and the Azuriom website synchronized through the bridge — 14 of 14 end-to-end integration scenarios (site, admin panel, database, bridge sync, mobile UI) passing.",
        "When the primary PostgreSQL database failed in production, the SQLite fallback kept the core services online instead of taking the server down.",
        "One person operates the whole stack — game, web, infrastructure, security, and day-to-day operations — under a hard rule: the server only restarts when no players are online.",
      ],
      lessons:
        "Owning every layer changes what you can promise. When the code, the audit, the infrastructure, and the operations are one person's responsibility, a database outage becomes a fallback you designed instead of a vendor ticket you wait on — and a security audit stops being a sample, because there is no layer you cannot open.",
    },
  },
  {
    id: "curated-portfolio71",
    title: "Portfolio 71 — Student Portfolio Platform",
    category: "web-security",
    problem:
      "SMKN 71 Jakarta students had no central, verifiable place to showcase their work, and teachers had no structured way to review and validate it.",
    solution:
      "A full-stack portfolio platform (Laravel API + Nuxt frontend) with role-based access for students, teachers and admins, an AI-assisted project verification workflow, and production hardening — authentication, authorization checks, and critical PHP CVE patching included.",
    tech_stack: ["Laravel", "Nuxt", "Tailwind CSS", "Sanctum", "Cloudflare Tunnel"],
    github_url: null,
    demo_url: "https://portofolio.apexsions.com",
    image_url: null,
    created_at: "2026-10-15T00:00:00Z",
    updated_at: "2026-10-23T00:00:00Z",
    caseStudy: {
      role: "Full-Stack Developer",
      period: "October 2026",
      overview:
        "Portfolio 71 is the student portfolio platform of SMKN 71 Jakarta. Students publish their project work, teachers review and validate it through a structured workflow, and the resulting profiles are public and verifiable — built to be shown to employers, not just filed away at school. The system pairs a Laravel REST API with a Nuxt frontend and runs in production behind a Cloudflare Tunnel.",
      challenges: [
        "Three very different user groups — students publishing work, teachers validating it, and admins running the platform — had to share one system with strict boundaries between them.",
        "A portfolio is only credible if its entries are verified, so project review needed to be a structured workflow rather than a free-form comment thread.",
        "Students need to present their work outside the school — to employers and at competitions — which meant public profiles that stay safe by default.",
        "Shipping to production meant treating a school platform holding real user data like any other production system: hardened authentication and patched dependencies included.",
      ],
      approach: [
        "Split the system into a Laravel REST API and a Nuxt frontend, with Sanctum authentication and role-based access control for students, teachers, and admins.",
        "Built a five-stage, AI-assisted verification workflow so teachers review structured project submissions instead of chasing ad-hoc files.",
        "Added public student profiles with QR codes and shareable links, so a profile can be opened from a printed page as easily as from a chat message.",
        "Generated one-click, ATS-friendly CV PDFs directly from profile data, so the portfolio students maintain is the same document they apply with.",
        "Hardened the production deployment: authorization checks on sensitive endpoints and patching of critical PHP CVEs, with the site served through a Cloudflare Tunnel.",
      ],
      outcomes: [
        "A live platform at portofolio.apexsions.com where students publish and teachers verify in one place.",
        "Public profiles with QR codes and share links make a student's work presentable anywhere — printed or digital.",
        "One-click CV export turns an existing profile into an application-ready PDF without re-typing anything.",
        "Production hardening — authentication, authorization checks, and CVE patching — shipped as part of the platform, not as an afterthought.",
      ],
      lessons:
        "Verification is the feature. A portfolio platform without a credible review workflow is just a file gallery — the structured teacher verification is what makes a student's profile worth trusting.",
    },
  },
  {
    id: "curated-ctf-toolkit",
    title: "CTF-Toolkit",
    category: "pentesting",
    problem:
      "CTF competitions throw a different category at you every round — web, crypto, forensics, reversing — and rebuilding your tooling setup each time wastes the clock.",
    solution:
      "A personal Python toolkit that bundles the recurring helpers for common CTF categories, so the workflow is ready before the competition starts.",
    tech_stack: ["Python", "Burp Suite", "Wireshark", "Ghidra"],
    github_url: "https://github.com/Nueeva/CTF-Toolkit",
    demo_url: null,
    image_url: null,
    created_at: "2026-04-20T00:00:00Z",
    updated_at: "2026-05-14T00:00:00Z",
    caseStudy: {
      role: "Creator & Maintainer",
      period: "April – May 2026",
      overview:
        "CTF-Toolkit is a personal Python toolkit for capture-the-flag competitions. Every CTF throws a different mix of categories at you — web, crypto, forensics, reversing — and each category has the same handful of recurring micro-tasks. The toolkit bundles those helpers in one place, organized by category and wired around the standard instruments, so the environment is ready before the clock starts instead of being rebuilt during the round.",
      challenges: [
        "CTF rounds are timed: minutes spent reinstalling tools or rewriting a helper from memory are points lost.",
        "Each category has its own recurring micro-tasks that are wasteful to solve from scratch under pressure, yet too small to justify a heavy framework.",
        "The toolkit had to stay personal and fast — tooling that needs its own setup ritual defeats the purpose.",
      ],
      approach: [
        "Collected the helpers that kept recurring across competitions into one Python toolkit, organized by category: web, crypto, forensics, and reversing.",
        "Built the workflow around the standard instruments of each trade — Burp Suite for web, Wireshark for traffic and forensics, Ghidra for reversing — so the toolkit complements them instead of trying to replace them.",
        "Kept everything scriptable and ready to run before a competition starts, driving setup time during a round toward zero.",
        "Fed hard-won helpers from each finished competition back into the toolkit, so it compounds instead of resetting.",
      ],
      outcomes: [
        "A ready-to-run personal toolkit covering the web, crypto, forensics, and reversing categories.",
        "Competition setup is done before the clock starts, not during the round.",
        "Each competition leaves the toolkit better stocked than it found it.",
      ],
      lessons:
        "In a timed competition, preparation is a feature. The best moment to write a helper is right after the round where you needed it and did not have it.",
    },
  },
];

/** Lookup helper: the curated project (with its case study) for an id. */
export const getCuratedProject = (id: string): CuratedProject | undefined =>
  curatedProjects.find((p) => p.id === id);

/** Ids of curated projects that have a case study page. */
export const caseStudyIds = new Set(
  curatedProjects.filter((p) => p.caseStudy).map((p) => p.id)
);
