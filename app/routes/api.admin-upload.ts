import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { uploadImage } from "~/lib/supabase.server";

// Authenticated image upload endpoint. Replaces the old client-side uploads
// that went straight to Supabase Storage with the anon key (no auth, no
// validation). All admin UI uploads go through here now; the actual storage
// write happens server-side with the service-role client.

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

const FOLDER_PATTERN = /^[a-z0-9](?:[a-z0-9/_-]{0,62}[a-z0-9])?$/;

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return json({ error: "A non-empty 'file' field is required" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return json({ error: "File too large (max 8 MB)" }, { status: 413 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return json(
      {
        error: `Unsupported content type. Allowed: ${Object.keys(ALLOWED_TYPES).join(", ")}`,
      },
      { status: 415 },
    );
  }

  const folderRaw = String(formData.get("folder") || "uploads");
  const folder = folderRaw.toLowerCase();
  if (!FOLDER_PATTERN.test(folder) || folder.includes("..") || folder.includes("//")) {
    return json({ error: "Invalid folder" }, { status: 400 });
  }

  try {
    // Normalize the file name so uploadImage derives a safe extension from
    // the validated content type, not from the user-supplied name.
    const safeFile = new File([await file.arrayBuffer()], `upload.${ext}`, {
      type: file.type,
    });
    const url = await uploadImage(safeFile, folder);
    return json({ url });
  } catch (error) {
    console.error("[api.admin-upload] Upload failed:", error);
    return json({ error: "Upload failed" }, { status: 500 });
  }
}
