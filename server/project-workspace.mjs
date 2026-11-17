import { validateRecord, normalizeRecord } from "./records.mjs";
const failure = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });
/** Project and study publish together; the frontend never reports partial success. */
export async function saveProjectWorkspace(
  db,
  { project, editorial, mode } = {},
) {
  if (
    !["create", "update"].includes(mode) ||
    !project ||
    typeof project.id !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}$/.test(project.id) ||
    !validateRecord("projects", project) ||
    !editorial ||
    editorial.project_key !== project.id ||
    !validateRecord("portfolio_project_content", editorial)
  )
    throw failure(400, "Periksa kembali data proyek dan studi kasus.");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT data FROM content_records WHERE resource='projects' AND id=$1 FOR UPDATE",
      [project.id],
    );
    if (mode === "create" && rows.length)
      throw failure(
        409,
        "Proyek ini sudah tersimpan. Muat ulang daftar sebelum mencoba kembali.",
      );
    if (mode === "update" && !rows.length)
      throw failure(
        404,
        "Proyek sudah dihapus. Salin perubahan Anda sebelum kembali ke daftar.",
      );
    const now = new Date().toISOString();
    const saved = {
      ...project,
      created_at: rows[0]?.data.created_at ?? now,
      updated_at: now,
    };
    const study = normalizeRecord("portfolio_project_content", editorial);
    for (const [resource, id, data] of [
      ["projects", saved.id, saved],
      ["portfolio_project_content", saved.id, study],
    ]) {
      await client.query(
        "INSERT INTO content_records(resource,id,data) VALUES($1,$2,$3::jsonb) ON CONFLICT(resource,id) DO UPDATE SET data=EXCLUDED.data,updated_at=now()",
        [resource, id, JSON.stringify(data)],
      );
    }
    await client.query("COMMIT");
    return { project: saved, editorial: study };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
