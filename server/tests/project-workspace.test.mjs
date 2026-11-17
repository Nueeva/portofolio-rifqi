import { test } from "node:test";
import assert from "node:assert/strict";
import { saveProjectWorkspace } from "../project-workspace.mjs";
const project = {
  id: "a",
  title: "A",
  problem: "P",
  solution: "S",
  category: "tools",
  tech_stack: [],
};
const editorial = {
  project_key: "a",
  summary: "",
  featured: false,
  sort_order: 0,
  role: "",
  period: "",
  overview: "Context",
  challenges: [],
  approach: [],
  outcomes: [],
  lessons: "",
};
function database({ failSecond = false, existing = true } = {}) {
  const calls = [];
  let writes = 0;
  const client = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT"))
        return {
          rows: existing
            ? [{ data: { ...project, created_at: "2020-01-01T00:00:00Z" } }]
            : [],
        };
      if (sql.startsWith("INSERT") && ++writes === 2 && failSecond)
        throw Error("Study write failed");
      return { rows: [] };
    },
    release: () => calls.push({ sql: "RELEASE" }),
  };
  return { calls, connect: async () => client };
}
test("workspace commits project and study in one transaction preserving creation date", async () => {
  const db = database();
  const result = await saveProjectWorkspace(db, {
    project,
    editorial,
    mode: "update",
  });
  assert.equal(result.project.created_at, "2020-01-01T00:00:00Z");
  assert.deepEqual(
    db.calls.map((c) => c.sql.split(" ")[0]),
    ["BEGIN", "SELECT", "INSERT", "INSERT", "COMMIT", "RELEASE"],
  );
});
test("study write failure rolls back the project write", async () => {
  const db = database({ failSecond: true });
  await assert.rejects(
    saveProjectWorkspace(db, { project, editorial, mode: "update" }),
    /Study write failed/,
  );
  assert.ok(db.calls.some((c) => c.sql === "ROLLBACK"));
  assert.ok(!db.calls.some((c) => c.sql === "COMMIT"));
  assert.equal(db.calls.at(-1).sql, "RELEASE");
});
test("invalid study is rejected before connecting and missing updates cannot create projects", async () => {
  const db = database({ existing: false });
  await assert.rejects(
    saveProjectWorkspace(db, {
      project,
      editorial: { project_key: "a" },
      mode: "create",
    }),
    /Periksa kembali/,
  );
  assert.equal(db.calls.length, 0);
  await assert.rejects(
    saveProjectWorkspace(db, { project, editorial, mode: "update" }),
    (error) => error.statusCode === 404,
  );
  assert.ok(db.calls.some((c) => c.sql === "ROLLBACK"));
});
