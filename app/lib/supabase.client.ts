import { createClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    ENV?: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string };
  }
}

function getClient() {
  const url = window.ENV?.SUPABASE_URL ?? "";
  const key = window.ENV?.SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}

export async function uploadImageClient(
  file: File,
  folder: string
): Promise<string> {
  const supabase = getClient();
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return data.publicUrl;
}
