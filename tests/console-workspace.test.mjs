import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
let vite, workspace, api;
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    logLevel: "error",
  });
  workspace = await vite.ssrLoadModule("/src/lib/projectWorkspace.ts");
  ({ api } = await vite.ssrLoadModule("/src/integrations/api/client.ts"));
});
after(async () => {
  await vite?.close();
});
test("selection is based on membership, not equal counts on different pages", () => {
  assert.deepEqual(workspace.pageSelection(["a", "b"], new Set(["c", "d"])), {
    all: false,
    some: false,
    count: 0,
  });
  assert.deepEqual(workspace.pageSelection(["a", "b"], new Set(["b", "c"])), {
    all: false,
    some: true,
    count: 1,
  });
  assert.deepEqual(
    workspace.pageSelection(["a", "b"], new Set(["a", "b", "c"])),
    { all: true, some: false, count: 2 },
  );
});
const project = {
  id: "project-a",
  title: "A",
  problem: "P",
  solution: "S",
  category: "tools",
  tech_stack: [],
  image_url: "/api/storage/project-images/thumbnails/old.png",
};
function client({ uploadError = null, saveError = null } = {}) {
  const calls = [];
  return {
    calls,
    storage: {
      from: () => ({
        upload: async (path) => {
          calls.push(["upload", path]);
          return { error: uploadError };
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: "/api/storage/project-images/" + path },
        }),
        remove: async (paths) => {
          calls.push(["remove", paths]);
          return { error: null };
        },
      }),
    },
    projects: {
      save: async (body) => {
        calls.push(["save", body]);
        return {
          error: saveError,
          data: saveError
            ? null
            : { project: body.project, editorial: body.editorial },
        };
      },
    },
    from: () => ({
      select() {
        return this;
      },
      async eq() {
        calls.push(["references"]);
        return { data: [], error: null };
      },
    }),
  };
}
const file = () =>
  new File(["fake png bytes"], "image.png", { type: "image/png" });
test("failed upload cannot commit a project or delete the previous cover", async () => {
  const mock = client({ uploadError: { message: "Upload failed" } });
  await assert.rejects(
    workspace.persistProjectWorkspace(
      {
        project,
        editorial: {},
        mode: "update",
        file: file(),
        previousImage: project.image_url,
      },
      mock,
    ),
    /Upload failed/,
  );
  assert.deepEqual(
    mock.calls.map((call) => call[0]),
    ["upload"],
  );
});
test("failed save retains previous cover even when candidate upload succeeded", async () => {
  const mock = client({ saveError: { message: "Commit failed" } });
  await assert.rejects(
    workspace.persistProjectWorkspace(
      {
        project,
        editorial: {},
        mode: "update",
        file: file(),
        previousImage: project.image_url,
      },
      mock,
    ),
    /Commit failed/,
  );
  assert.deepEqual(
    mock.calls.map((call) => call[0]),
    ["upload", "save"],
  );
});
test("old cover cleanup runs only after a confirmed save and no remaining references", async () => {
  const mock = client();
  const saved = await workspace.persistProjectWorkspace(
    {
      project,
      editorial: {},
      mode: "update",
      file: file(),
      previousImage: project.image_url,
    },
    mock,
  );
  assert.deepEqual(
    mock.calls.map((call) => call[0]),
    ["upload", "save", "references", "remove"],
  );
  assert.deepEqual(mock.calls.at(-1)[1], ["thumbnails/old.png"]);
  assert.notEqual(saved.project.image_url, project.image_url);
});
test("unsupported GIF is rejected before storage requests", async () => {
  const mock = client();
  await assert.rejects(
    workspace.persistProjectWorkspace(
      {
        project,
        editorial: {},
        mode: "update",
        file: new File(["gif"], "cover.gif", { type: "image/gif" }),
        previousImage: project.image_url,
      },
      mock,
    ),
    /JPG, PNG, atau WebP/,
  );
  assert.deepEqual(mock.calls, []);
});
test("SSE failed-login filter excludes successful and unknown events", (t) => {
  let source;
  class FakeSource {
    constructor() {
      source = this;
    }
    close() {}
  }
  t.stubGlobal?.("EventSource", FakeSource);
  const previous = globalThis.EventSource;
  globalThis.EventSource = FakeSource;
  const events = [];
  const channel = api
    .channel("test")
    .on(
      "postgres_changes",
      { table: "ip_logs", event: "INSERT", filter: "success=eq.false" },
      (payload) => events.push(payload),
    )
    .subscribe();
  try {
    for (const success of [true, undefined, false])
      source.onmessage({
        data: JSON.stringify({
          table: "ip_logs",
          eventType: "INSERT",
          new: { success },
        }),
      });
    assert.equal(events.length, 1);
    assert.equal(events[0].new.success, false);
  } finally {
    channel.close();
    globalThis.EventSource = previous;
  }
});
test("HTTP status and Retry-After survive API error normalization", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { error: { message: "Tunggu" } },
      { status: 429, headers: { "Retry-After": "45" } },
    ),
  );
  const result = await api.auth.signInWithPassword({
    email: "a@example.com",
    password: "wrong",
  });
  assert.equal(result.error.status, 429);
  assert.equal(result.error.retryAfter, 45);
});
test("CSV keeps quoted and nested content without executing spreadsheet formulas", async () => {
  const { contentCSV } = await vite.ssrLoadModule("/src/lib/contentExport.ts");
  const csv = contentCSV({
    projects: [{ title: "=2+2", summary: 'a,"b"', tech_stack: ["A", "B"] }],
  });
  assert.ok(csv.includes('"\'=2+2"'));
  assert.ok(csv.includes('"a,""b"""'));
  assert.ok(csv.includes('"[""A"",""B""]"'));
  assert.ok(csv.startsWith('\uFEFF"resource"'));
});

test("external media URLs are never treated as owned storage objects", () => {
  assert.equal(
    workspace.projectImagePath(
      "https://external.example/api/storage/project-images/thumbnails/old.png",
    ),
    null,
  );
  assert.equal(
    workspace.projectImagePath(
      "/api/storage/project-images/thumbnails/old.png",
    ),
    "thumbnails/old.png",
  );
});
