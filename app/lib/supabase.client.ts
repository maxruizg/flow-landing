// Client-side upload helpers.
//
// SECURITY: these used to upload straight to Supabase Storage from the
// browser using the anon key (no auth, no validation). They now POST to the
// authenticated server resource route /api/admin-upload, which requires an
// admin session, validates content type + size, and performs the storage
// write server-side with the service-role client. No Supabase key is needed
// in the browser anymore.

async function uploadViaServer(
  body: Blob,
  fileName: string,
  folder: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", body, fileName);
  formData.append("folder", folder);

  const res = await fetch("/api/admin-upload", {
    method: "POST",
    body: formData,
  });

  let payload: { url?: string; error?: string } | null = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response (e.g. redirect to login) — handled below
  }

  if (!res.ok || !payload?.url) {
    throw new Error(payload?.error || `Upload failed (${res.status})`);
  }
  return payload.url;
}

export async function uploadImageClient(
  file: File,
  folder: string,
): Promise<string> {
  return uploadViaServer(file, file.name, folder);
}

export async function uploadBlobClient(
  blob: Blob,
  folder: string,
  ext = "jpg",
): Promise<string> {
  return uploadViaServer(blob, `upload.${ext}`, folder);
}
