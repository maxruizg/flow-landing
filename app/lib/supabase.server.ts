import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;

// Prefer the service-role key (server-only, bypasses RLS). Fall back to the
// anon key so local dev keeps working until SUPABASE_SERVICE_ROLE_KEY is set —
// but warn loudly, because the RLS lockdown migration must NOT be applied to
// an environment still running on the anon key.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = serviceRoleKey || process.env.SUPABASE_ANON_KEY!;

if (!serviceRoleKey) {
  console.warn(
    "[supabase.server] SUPABASE_SERVICE_ROLE_KEY is not set — falling back to SUPABASE_ANON_KEY. " +
      "Server queries will be subject to RLS. Add SUPABASE_SERVICE_ROLE_KEY before applying the " +
      "RLS lockdown migration, or admin/server functionality will break.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;
  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return data.publicUrl;
}
