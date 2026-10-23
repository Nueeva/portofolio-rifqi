import type { Database } from "@/integrations/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

/**
 * Rifqi's real projects, curated from his GitHub (github.com/Nueeva).
 * These render first on the Projects page; anything managed through the
 * admin panel (Supabase `projects` table) is appended after them, and this
 * list doubles as the fallback when the database is unreachable.
 */
export const curatedProjects: Project[] = [
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
  },
];
