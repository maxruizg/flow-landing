import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
