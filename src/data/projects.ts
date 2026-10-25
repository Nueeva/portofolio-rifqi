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
    title: "Apexsions — Minecraft Plugin Ecosystem",
    category: "tools",
    problem:
      "Running a public game server on third-party plugins means trusting code you didn't write — misconfigurations and vulnerabilities become your players' problem.",
    solution:
      "Nine in-house Paper plugins (core, economy, security, web bridge and more), put through a full security audit that found and fixed 13 critical and 19 major issues before a production deployment on live infrastructure.",
    tech_stack: ["Java", "Paper API", "Maven", "SQLite", "Security Audit"],
    github_url: "https://github.com/Nueeva/Apexsions",
    demo_url: null,
    image_url: null,
    created_at: "2026-10-02T00:00:00Z",
    updated_at: "2026-10-04T00:00:00Z",
    caseStudy: {
      role: "Lead Developer & Security Auditor",
      period: "October 2026",
      overview:
        "Apexsions is the software ecosystem behind a public Minecraft server: nine Paper plugins written in-house — core, economy, security, and a web bridge among them — plus an Azuriom-based website for the community. Instead of assembling the server from third-party plugins of unknown quality, the stack was built from scratch, then put through a full security audit and deployed to live production infrastructure on Jagoanhosting, managed through Pterodactyl.",
      challenges: [
        "A public server inherits the risk of every line of code it runs: a single plugin vulnerability can compromise player data and the in-game economy at the same time.",
        "Nine plugins that share player, economy, and security data have to stay consistent with each other without collapsing into a single point of failure.",
        "Fixes had to land on live infrastructure without disrupting players — a production game server leaves no room for trial-and-error deploys.",
        "Managed hosting constraints (the Pterodactyl panel at Jagoanhosting) shaped how the large plugin builds could be assembled, uploaded, and rolled out.",
      ],
      approach: [
        "Developed the plugin suite in-house — core, economy, security, and web bridge modules among the nine — instead of trusting third-party binaries.",
        "Ran a full security audit across the codebase before launch, cataloguing every finding by severity.",
        "Fixed all 13 critical and 19 major issues the audit surfaced, then re-verified the fixes before anything shipped.",
        "Deployed to production on Jagoanhosting via Pterodactyl, with an SQLite fallback so core services keep running even if the primary database path fails.",
        "Paired the game server with an Azuriom-based website, connected through the web bridge plugin, so the community side and the game side stay in sync.",
      ],
      outcomes: [
        "13 critical and 19 major security issues found and fixed before players were ever exposed to them.",
        "All nine plugins running in production on the server's live infrastructure.",
        "An SQLite fallback keeps core services alive through database hiccups instead of taking the server down.",
        "The web bridge connects the game server to its Azuriom website, so community features and in-game state are not split across disconnected tools.",
      ],
      lessons:
        "Writing your own plugins does not remove the need for an audit — it makes the audit possible. Owning the code means owning the findings, and fixing them before launch is far cheaper than fixing them after an incident.",
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
