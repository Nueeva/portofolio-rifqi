import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

let vite;
let projects;
let localized;
let contact;
let riva;
let render;

before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, logLevel: "error" });
  projects = await vite.ssrLoadModule("/src/data/projects.ts");
  localized = await vite.ssrLoadModule("/src/data/projectCopy.id.ts");
  contact = await vite.ssrLoadModule("/src/lib/contactForm.ts");
  riva = await vite.ssrLoadModule("/src/lib/publicRiva.ts");
  // Exercise the production SSR artifact (npm run build), as the postbuild does.
  ({ render } = await import(new URL("../dist-server/entry-server.js", import.meta.url)));
});
after(async () => { await vite?.close(); });

test("presentation preserves canonical records, links, technologies and study structure", () => {
  const before = JSON.stringify(projects.curatedProjects);
  for (const source of projects.curatedProjects) {
    const view = localized.publicProject(source);
    for (const key of ["id", "title", "category", "tech_stack", "github_url", "demo_url", "image_url", "created_at", "updated_at"]) {
      assert.deepEqual(view[key], source[key], `${source.id}: ${key}`);
    }
    for (const key of ["challenges", "approach", "outcomes"]) assert.equal(view.caseStudy[key].length, source.caseStudy[key].length);
    assert.notEqual(view.problem, source.problem);
  }
  assert.equal(JSON.stringify(projects.curatedProjects), before);
  assert.match(localized.getPublicProject("curated-portfolio71").caseStudy.outcomes[0], /29 Oktober 2026.*51.*20.*16.*15.*28.*4.*5.*10/);
  assert.match(localized.getPublicProject("curated-apexsions").solution, /13.*19/);
  assert.equal(localized.getPublicProject("unknown"), undefined);
});

test("known CMS defaults translate; later edits and unknown text remain visible", () => {
  assert.equal(localized.presentText("Building Secure Digital Solutions"), "Menguji keamanan aplikasi.");
  const original = "Many web applications implement authentication incorrectly, leading to session hijacking, credential stuffing, and broken access control vulnerabilities.";
  assert.notEqual(localized.presentText(original), original);
  const edited = `${original} Updated by the owner.`;
  assert.equal(localized.presentText(edited), edited);
  const managed = { ...projects.curatedProjects[0], id: "managed", problem: edited, solution: "Teks baru dari admin." };
  assert.equal(localized.publicProject(managed).problem, edited);
  assert.equal(localized.publicProject(managed).solution, managed.solution);
});

test("CMS merge keeps curated fallback, deduplicates original titles and filters empty results", () => {
  const source = projects.curatedProjects;
  const managed = { ...source[0], id: "managed", title: "Karya tambahan", category: "web-security" };
  const duplicate = { ...source[0], id: "duplicate", title: source[0].title.toUpperCase() };
  assert.deepEqual(localized.mergeProjects().map(item => item.id), source.map(item => item.id));
  const merged = localized.mergeProjects([duplicate, managed]);
  assert.equal(merged.length, source.length + 1);
  assert.equal(merged.at(-1).id, "managed");
  assert.equal(localized.filterProjects(merged, "all").length, merged.length);
  assert.ok(localized.filterProjects(merged, "tools").every(item => item.category === "tools"));
  assert.deepEqual(localized.filterProjects([managed], "pentesting"), []);
  assert.deepEqual(localized.filterProjects([], "all"), []);
});

test("contact field limits, trimming and strict email validation stay intact", () => {
  const valid = { name: "  Rifqi  ", email: "  rifqi@example.com ", message: "  Pesan pengujian formulir.  " };
  const result = contact.contactSchema.parse(valid);
  assert.deepEqual(result, { name: "Rifqi", email: "rifqi@example.com", message: "Pesan pengujian formulir." });
  for (const email of ["user@gmial.com", "u..ser@example.com", "user@example.c", "bad address"]) assert.equal(contact.contactSchema.safeParse({ ...result, email }).success, false);
  for (const [key, value] of [["name", "a"], ["name", "a".repeat(51)], ["message", "singkat"], ["message", "a".repeat(1001)]]) assert.equal(contact.contactSchema.safeParse({ ...result, [key]: value }).success, false);
});

test("URL prefill only changes an empty message for a supported topic", () => {
  const blank = { name: "", email: "", message: "" };
  assert.match(contact.prefillContact(blank, "web-security").message, /keamanan aplikasi web/);
  for (const topic of ["unknown", "constructor", "__proto__"]) assert.equal(contact.prefillContact(blank, topic), blank);
  const typed = { ...blank, message: "Pesan yang sudah ditulis." };
  assert.equal(contact.prefillContact(typed, "security-tools"), typed);
});

test("email suggestions handle partial, complete and unsupported domains", () => {
  assert.deepEqual(contact.suggestEmails("rifqi@g"), ["rifqi@gmail.com"]);
  assert.deepEqual(contact.suggestEmails("rifqi@gmail.com"), []);
  assert.deepEqual(contact.suggestEmails("rifqi@unknown"), []);
  assert.deepEqual(contact.suggestEmails("rifqi"), []);
  assert.deepEqual(contact.suggestEmails("rif qi@g"), []);
});

test("contact submission is simulated with the unchanged endpoint and payload; failure propagates", async () => {
  const data = { name: "Penguji", email: "tester@example.com", message: "Pesan simulasi tanpa pengiriman nyata." };
  const calls = [];
  await contact.sendContactMessage(data, "mock-turnstile-token", async (...args) => { calls.push(args); return { error: null }; });
  assert.deepEqual(calls, [["send-contact-email", { body: { ...data, turnstileToken: "mock-turnstile-token" } }]]);
  const error = new Error("Simulated network failure");
  await assert.rejects(contact.sendContactMessage(data, "mock-token", async () => ({ error })), error);
  assert.equal(data.message, "Pesan simulasi tanpa pengiriman nyata.");
});

test("public RIVA describes source-backed projects without legacy conflicting claims", () => {
  const xss = riva.publicRivaReply("xssscope");
  assert.ok(xss.includes(localized.getPublicProject("curated-xssscope").solution));
  assert.match(xss, /JavaScript.*Node.js/);
  assert.doesNotMatch(xss, /94|written in Go/);
  const ctf = riva.publicRivaReply("CTF-Toolkit");
  assert.match(ctf, /Python/);
  assert.doesNotMatch(ctf, /40\+|installer|five minutes/);
});

const publicRoutes = ["/", "/about", "/projects", "/contact", "/projects/curated-xssscope", "/projects/curated-apexsions", "/projects/curated-portfolio71", "/projects/curated-ctf-toolkit", "/403", "/500", "/502", "/503", "/429", "/missing-page", "/admin/missing"];
for (const route of publicRoutes) {
  test(`SSR ${route}: deterministic, public shell, one visible primary heading`, async () => {
    const first = await render(route);
    assert.equal(await render(route), first);
    assert.match(first, /data-design="celah"/);
    assert.match(first, /class="public-navbar"/);
    assert.match(first, /class="public-footer"/);
    assert.equal((first.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(!/opacity:\s*0(?:;|")/.test(first), `${route}: content must not start transparent`);
    assert.doesNotMatch(first, /MatrixRain|HTTP\/1\.1|Token validation: FAILED/);
  });
}
for (const route of ["/admin", "/auth"]) {
  test(`SSR ${route}: legacy boundary remains separate`, async () => {
    const html = await render(route);
    assert.equal(await render(route), html);
    assert.match(html, /data-design="legacy"/);
    assert.doesNotMatch(html, /class="public-design"|class="public-navbar"|class="public-footer"/);
  });
}

test("all 13 route patterns remain registered; unknown case study has no fabricated content", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/<Route path=/g) ?? []).length, 13);
  const unknown = await render("/projects/not-a-real-project");
  assert.doesNotMatch(unknown, /class="study-header"/);
});
