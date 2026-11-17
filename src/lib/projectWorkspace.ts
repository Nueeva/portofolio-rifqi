import { api } from "@/integrations/api/client";
import type { ProjectRecord } from "@/integrations/api/types";
import type { ProjectEditorial } from "@/data/editorial";
export function projectImagePath(url: string | null) {
  if (!url) return null;
  const prefix = "/api/storage/project-images/";
  try {
    const origin =
      typeof window === "undefined"
        ? "https://portfolio.local"
        : window.location.origin;
    const parsed = new URL(url, origin);
    if (parsed.origin !== origin) return null;
    const pathname = parsed.pathname;
    return pathname.startsWith(prefix)
      ? pathname
          .slice(prefix.length)
          .split("/")
          .map(decodeURIComponent)
          .join("/")
      : null;
  } catch {
    return null;
  }
}
export async function persistProjectWorkspace(
  input: {
    project: ProjectRecord;
    editorial: ProjectEditorial;
    mode: "create" | "update";
    file: File | null;
    previousImage: string | null;
  },
  client = api,
) {
  let candidatePath: string | null = null;
  let project = input.project;
  if (input.file) {
    const formats: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    if (!formats[input.file.type] || input.file.size > 5 * 1024 * 1024)
      throw Error("Pilih gambar JPG, PNG, atau WebP maksimal 5 MB.");
    candidatePath = `thumbnails/${input.project.id}-${crypto.randomUUID()}.${formats[input.file.type]}`;
    const upload = await client.storage
      .from("project-images")
      .upload(candidatePath, input.file);
    if (upload.error) throw Error(upload.error.message);
    project = {
      ...project,
      image_url: client.storage
        .from("project-images")
        .getPublicUrl(candidatePath).data.publicUrl,
    };
  }
  // On an uncertain network failure retain the candidate: a commit may have succeeded.
  // Orphan cleanup must first confirm that no project references the object.
  const result = await client.projects.save({
    project,
    editorial: input.editorial,
    mode: input.mode,
  });
  if (result.error) throw Error(result.error.message);
  if (!result.data)
    throw Error("Hasil penyimpanan belum dapat dikonfirmasikan.");
  let cleanupWarning = false;
  const oldPath = projectImagePath(input.previousImage);
  if (oldPath && input.previousImage !== project.image_url) {
    try {
      const references = await client
        .from("projects")
        .select("*")
        .eq("image_url", input.previousImage);
      if (references.error) cleanupWarning = true;
      else if (references.data?.length === 0) {
        const cleanup = await client.storage
          .from("project-images")
          .remove([oldPath]);
        cleanupWarning = !!cleanup.error;
      }
    } catch {
      cleanupWarning = true;
    }
  }
  return { ...result.data, cleanupWarning };
}
export function pageSelection(ids: string[], selected: Set<string>) {
  const count = ids.filter((id) => selected.has(id)).length;
  return {
    all: ids.length > 0 && count === ids.length,
    some: count > 0 && count < ids.length,
    count,
  };
}
