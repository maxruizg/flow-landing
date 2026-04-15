import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

const apply = process.argv.includes("--apply");

const COLOR_SUFFIXES = ["black", "brown", "offwhite", "off white", "white", "yellow", "beige"];

function nameHasColorSuffix(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return COLOR_SUFFIXES.some((c) => lower.endsWith(" " + c));
}

async function main() {
  const { data: all, error } = await supabase
    .from("products")
    .select("slug,name,color,gender,status");
  if (error) throw error;
  if (!all) throw new Error("No products");

  console.log(`Total rows: ${all.length}`);

  // 1) Delete rows whose NAME ends in a color word (the bad rows I seeded earlier).
  const colorSuffixDupes = all.filter((r) => nameHasColorSuffix(r.name));

  // 2) For LTMF Tee and Mantis Tee: remove the duplicate men/women "Off White"
  //    rows that duplicate the canonical unisex row.
  const legacyDupeSlugs = new Set([
    "ltmf-tee-off-white-men",
    "ltmf-tee-off-white-women",
    "mantis-tee-off-white-men",
    "mantis-tee-off-white-women",
  ]);

  // 3) Collapse "offwhite" (lowercase) vs "Off White" for the same name+gender.
  //    Keep the "Off White" (properly cased) row; drop the lowercase one.
  const byKey = new Map<string, typeof all>();
  for (const r of all) {
    const key = `${r.name.toLowerCase()}::${r.gender}`;
    const arr = byKey.get(key) ?? [];
    arr.push(r);
    byKey.set(key, arr);
  }
  const offwhiteLowerDupes: typeof all = [];
  for (const [, group] of byKey) {
    if (group.length < 2) continue;
    const hasProperOffWhite = group.some((r) => r.color === "Off White");
    if (!hasProperOffWhite) continue;
    for (const r of group) {
      if (r.color === "offwhite") offwhiteLowerDupes.push(r);
    }
  }

  const toDelete = new Set<string>();
  for (const r of colorSuffixDupes) toDelete.add(r.slug);
  for (const slug of legacyDupeSlugs) toDelete.add(slug);
  for (const r of offwhiteLowerDupes) toDelete.add(r.slug);

  console.log(`\n=== Rows to delete (${toDelete.size}) ===`);
  console.log(`  color-suffix-name rows: ${colorSuffixDupes.length}`);
  console.log(`  LTMF/Mantis Off-White men+women legacy dupes: ${[...legacyDupeSlugs].filter((s) => all.some((r) => r.slug === s)).length}`);
  console.log(`  offwhite (lowercase) collision dupes: ${offwhiteLowerDupes.length}`);
  console.log();
  for (const slug of toDelete) {
    const row = all.find((r) => r.slug === slug);
    if (row) console.log(`  - ${row.name.padEnd(35)} ${row.color.padEnd(12)} ${row.gender.padEnd(7)} [${slug}]`);
  }

  if (!apply) {
    console.log("\n[dry-run] Pass --apply to delete.");
    return;
  }

  const slugs = [...toDelete];
  const { error: delErr } = await supabase.from("products").delete().in("slug", slugs);
  if (delErr) throw delErr;
  console.log(`\nDeleted ${slugs.length} rows.`);

  const { data: after } = await supabase.from("products").select("slug,name,color,gender");
  console.log(`Remaining: ${after?.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
