import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
);

function slugify(name: string, color: string, gender: string) {
  return `${name}-${color}-${gender}`.toLowerCase().replace(/\s+/g, "-");
}

// Each entry renames a DB row so it matches the flow-content folder naming
// convention, which lets the reconcile script detect it as an existing row
// (and later consolidate men+women pairs into unisex).
const renames: { id: string; name: string; color: string }[] = [
  { id: "bs-007", name: "Shorts Running", color: "brown" },
  { id: "bs-020", name: "Shorts Running", color: "black" },
  { id: "bs-034", name: "Shorts Running", color: "black" },
  { id: "bs-035", name: "Shorts Running", color: "brown" },
  { id: "na-002", name: "Back Crop Top", color: "brown" },
  { id: "na-008", name: "Back Crop Top", color: "black" },
];

async function main() {
  for (const r of renames) {
    const { data: existing, error: selErr } = await supabase
      .from("products")
      .select("id, name, color, gender")
      .eq("id", r.id)
      .single();
    if (selErr || !existing) {
      console.log(`  ? skip ${r.id} (not found)`);
      continue;
    }
    const newSlug = slugify(r.name, r.color, existing.gender);
    const { error } = await supabase
      .from("products")
      .update({ name: r.name, color: r.color, slug: newSlug })
      .eq("id", r.id);
    if (error) {
      console.error(`  ✗ ${r.id}:`, error.message);
    } else {
      console.log(`  ✓ ${r.id}  →  ${r.name} / ${r.color} / ${existing.gender}`);
    }
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
