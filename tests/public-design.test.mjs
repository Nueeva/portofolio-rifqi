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
let api;

before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, logLevel: "error" });
  ({ api } = await vite.ssrLoadModule("/src/integrations/api/client.ts"));
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

test("project explanations render as labelled figures and native selection controls", async () => {
 for(const id of ["xssscope","apexsions","portfolio71","ctf-toolkit"]){
  const html=await render(`/projects/curated-${id}`);
  assert.match(html,/<figure class="technical-figure/);
  assert.match(html,/Ilustrasi proses/);
  assert.match(html,/aria-pressed="true"/);
  assert.match(html,/aria-live="polite"/);
  assert.doesNotMatch(html,/<canvas/);
 }
});

test("editorial metadata supports future projects, stable URLs, explicit features and ordering", async()=>{
 const {applyEditorial,featuredProjects}=await vite.ssrLoadModule("/src/data/editorial.ts");
 const source={...projects.curatedProjects[0],id:"a19ac108-063c-4653-b2f8-4ff009026bbc",title:"New owner project",caseStudy:undefined};
 const plain=applyEditorial([source],[])[0];assert.deepEqual(plain.caseStudy.outcomes,[]);assert.equal(plain.caseStudy.overview,source.solution);
 const entry={project_key:source.id,summary:"Owner supplied summary",featured:true,sort_order:1,role:"Engineer",period:"2026",overview:"Actual context",challenges:["One problem"],approach:["One approach"],outcomes:["One documented result"],lessons:""};
 const projected=applyEditorial([source],[entry]);assert.equal(projected[0].id,source.id);assert.equal(projected[0].solution,entry.summary);assert.equal(projected[0].caseStudy.overview,entry.overview);assert.equal(source.caseStudy,undefined);
 assert.deepEqual(featuredProjects(projected,[{...entry,featured:false}]),[]);assert.equal(featuredProjects(projected,[entry])[0].id,source.id);
 assert.deepEqual(featuredProjects([], [entry]),[]);
});

test("summary-only edits preserve a seeded curated study and RIVA aliases",async()=>{
 const {applyEditorial}=await vite.ssrLoadModule("/src/data/editorial.ts");
 const source=localized.getPublicProject("curated-apexsions");
 const entry={project_key:source.id,summary:"Ringkasan baru pemilik",featured:true,sort_order:0,role:"",period:"",overview:"",challenges:[],approach:[],outcomes:[],lessons:""};
 const [view]=applyEditorial([source],[entry]);assert.equal(view.solution,entry.summary);assert.deepEqual(view.caseStudy,source.caseStudy);
 assert.match(riva.publicRivaReply("minecraft",[view]),/Ringkasan baru pemilik/);
});

test("owned catalog respects renames, edits and deletions while retaining canonical studies", async () => {
 const {resolveProjectCatalog,applyEditorial}=await vite.ssrLoadModule("/src/data/editorial.ts");
 const original=projects.curatedProjects[0];
 const edited={...original,title:"Renamed by owner",problem:"Owner supplied problem",solution:"Owner supplied solution"};
 delete edited.caseStudy;
 const resolved=resolveProjectCatalog([edited,edited]);
 assert.equal(resolved.length,1);assert.equal(resolved[0].id,original.id);
 assert.equal(resolved[0].title,edited.title);assert.equal(resolved[0].problem,edited.problem);assert.equal(resolved[0].solution,edited.solution);
 assert.deepEqual(resolved[0].caseStudy,localized.getPublicProject(original.id).caseStudy);
 assert.deepEqual(applyEditorial(resolved,[])[0].caseStudy,resolved[0].caseStudy);
 assert.deepEqual(resolveProjectCatalog([]),[]);
 assert.equal(resolveProjectCatalog().length,projects.curatedProjects.length);
 assert.equal(resolveProjectCatalog([original])[0].problem,localized.getPublicProject(original.id).problem);
});

test("CMS query keeps filters, ordering and credentials on the owned API", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json({ data: [{ id: "owner-project" }], error: null });
  });
  const result = await api.from("projects").select("*").eq("category", "tools")
    .order("created_at", { ascending: false }).limit(20);
  assert.deepEqual(result.data, [{ id: "owner-project" }]);
  assert.equal(calls[0].url, "/api/data/projects");
  assert.equal(calls[0].options.credentials, "same-origin");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    operation: "select", filters: [{ field: "category", operator: "eq", value: "tools" }],
    order: { field: "created_at", ascending: false }, limit: 20,
  });
});

test("rate-limit and unavailable-service failures remain failures for forms", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json(
    { message: "Tunggu sebelum mencoba lagi." }, { status: 429 },
  ));
  assert.equal((await api.auth.signInWithPassword({ email: "a@example.com", password: "password" })).error.message,
    "Tunggu sebelum mencoba lagi.");
  globalThis.fetch = async () => { throw new Error("offline"); };
  assert.equal((await api.functions.invoke("send-contact-email", { body: {} })).data, null);
});

test("only a successful login/logout announces an auth-state change", async (t) => {
  const session = { user: { id: "admin-id", email: "owner@example.com" } };
  const events = [];
  const { data: { subscription } } = api.auth.onAuthStateChange((event, value) => events.push([event, value]));
  t.mock.method(globalThis, "fetch", async url => Response.json({
    data: url.endsWith("login") ? { session, user: session.user } : null, error: null,
  }));
  try {
    await api.auth.signInWithPassword({ email: session.user.email, password: "password" });
    await api.auth.signOut();
    globalThis.fetch = async () => Response.json({ error: { message: "Sesi tidak tersedia." } }, { status: 503 });
    await api.auth.signOut();
    assert.deepEqual(events, [["SIGNED_IN", session], ["SIGNED_OUT", null]]);
  } finally { subscription.unsubscribe(); }
});

test("upload uses multipart without JSON headers and returns a same-origin media path", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/storage/resume/upload?path=owner%2Fcv.pdf");
    assert.ok(options.body instanceof FormData);
    assert.deepEqual(options.headers, {});
    return Response.json({ data: { path: "owner/cv.pdf" }, error: null });
  });
  const bucket = api.storage.from("resume");
  assert.equal((await bucket.upload("owner/cv.pdf", new Blob(["%PDF-1.7"], { type: "application/pdf" }))).error, null);
  assert.equal(bucket.getPublicUrl("owner/cv.pdf").data.publicUrl, "/api/storage/resume/owner/cv.pdf");
});
