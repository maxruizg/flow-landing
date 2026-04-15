import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { unzipSync, strFromU8 } from "fflate";

const CONTENT_ROOT = "/Users/maxruizg/Documents/flow-content";
const MEN_DIR = path.join(CONTENT_ROOT, "Productos Menswear ");
const WOMEN_DIR = path.join(CONTENT_ROOT, "Productos Womenswear");

const APPLY = process.argv.includes("--apply");

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_ANON_KEY (or SERVICE_ROLE) in env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

type Gender = "men" | "women" | "unisex";

interface ParsedFolder {
  gender: "men" | "women";
  name: string;
  color: string;
  folderPath: string;
  front?: string;
  back?: string;
  docxPath?: string;
}

interface DocxMeta {
  description: string;
  material: string;
  origin: string;
  price: number;
}

interface TargetProduct {
  name: string;
  color: string;
  gender: Gender;
  folderPath: string;
  front?: string;
  back?: string;
  meta: DocxMeta;
}

interface DbRow {
  id: string;
  slug: string;
  name: string;
  color: string;
  gender: Gender;
  [k: string]: any;
}

type Action =
  | { kind: "insert"; target: TargetProduct }
  | { kind: "consolidate"; target: TargetProduct; keepId: string; dropId: string }
  | { kind: "promote"; target: TargetProduct; rowId: string; fromGender: Gender }
  | { kind: "dedupe"; target: TargetProduct; keepId: string; dropIds: string[] }
  | { kind: "noop"; target: TargetProduct; rowId: string };

interface Orphan {
  id: string;
  name: string;
  color: string;
  gender: Gender;
}

function normName(s: string) {
  return s.trim().toLowerCase();
}

function keyOf(name: string, color: string) {
  return `${normName(name)}::${normName(color)}`;
}

function slugify(name: string, color: string, gender: string) {
  return `${name}-${color}-${gender}`.toLowerCase().replace(/\s+/g, "-");
}

function parseFolderName(folder: string): { name: string; color: string } {
  const trimmed = folder.trim();
  const tokens = trimmed.split(/\s+/);
  const color = tokens[tokens.length - 1];
  const name = tokens.slice(0, -1).join(" ");
  return { name, color };
}

function listProductFolders(root: string, gender: "men" | "women"): ParsedFolder[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((f) => fs.statSync(path.join(root, f)).isDirectory())
    .map((folder) => {
      const { name, color } = parseFolderName(folder);
      const folderPath = path.join(root, folder);
      const files = fs.readdirSync(folderPath);
      const images = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
      const front = images.find((f) => /front/i.test(f)) || images[0];
      const back = images.find((f) => /back/i.test(f)) || images[1];
      const docxPath = files.find((f) => /\.docx$/i.test(f));
      return {
        gender,
        name,
        color,
        folderPath,
        front: front ? path.join(folderPath, front) : undefined,
        back: back ? path.join(folderPath, back) : undefined,
        docxPath: docxPath ? path.join(folderPath, docxPath) : undefined,
      };
    });
}

function extractDocxText(docxPath: string): string {
  try {
    const buf = fs.readFileSync(docxPath);
    const unzipped = unzipSync(new Uint8Array(buf), {
      filter: (f) => f.name === "word/document.xml",
    });
    const xml = unzipped["word/document.xml"];
    if (!xml) return "";
    const text = strFromU8(xml)
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    return text;
  } catch (e) {
    return "";
  }
}

function parseDocxMeta(docxPath: string | undefined): DocxMeta {
  const defaults: DocxMeta = { description: "", material: "100% Cotton", origin: "Made in Mexico", price: 0 };
  if (!docxPath) return defaults;
  const text = extractDocxText(docxPath);
  if (!text) return defaults;

  const priceMatch = text.match(/Price:\s*\$?(\d+)\s*dls?/i);
  const price = priceMatch ? Number(priceMatch[1]) : 0;

  const materialMatch = text.match(/(\d{1,3}%\s*[A-Za-z][A-Za-z\s/]*)/);
  const material = materialMatch ? materialMatch[1].trim() : defaults.material;

  const origin = /Made in Mexico/i.test(text) ? "Made in Mexico" : defaults.origin;

  const beforePrice = priceMatch ? text.slice(0, text.indexOf(priceMatch[0])) : text;
  const afterDesc = beforePrice
    .replace(/Description/i, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^\d{1,3}%/.test(l) && !/Made in Mexico/i.test(l));
  const description = afterDesc.slice(0, 4).join(". ").trim();

  return { description, material, origin, price };
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/shorts|skirt/.test(n)) return "Bottoms";
  if (/hoodie/.test(n)) return "Outerwear";
  if (/socks|tote bag|mascada/.test(n)) return "Accessories";
  return "Tops";
}

function inferSizes(name: string): string[] {
  const n = name.toLowerCase();
  if (/socks|mascada|tote bag/.test(n)) return ["One Size"];
  return ["S", "M", "L", "XL"];
}

function mimeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function uploadLocalImage(localPath: string, subfolder: string): Promise<string> {
  const ext = path.extname(localPath).toLowerCase() || ".jpg";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `products/${subfolder}/${id}${ext}`;
  const data = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from("images")
    .upload(storagePath, data, { contentType: mimeFromExt(localPath), upsert: false });
  if (error) throw error;
  return `${supabaseUrl}/storage/v1/object/public/images/${storagePath}`;
}

async function loadDbRows(): Promise<DbRow[]> {
  const { data, error } = await supabase.from("products").select("*");
  if (error) throw error;
  return data as DbRow[];
}

async function planActions(): Promise<{ actions: Action[]; orphans: Orphan[] }> {
  const menFolders = listProductFolders(MEN_DIR, "men");
  const womenFolders = listProductFolders(WOMEN_DIR, "women");

  const byKey = new Map<string, { men?: ParsedFolder; women?: ParsedFolder }>();
  for (const f of menFolders) {
    const k = keyOf(f.name, f.color);
    const e = byKey.get(k) || {};
    e.men = f;
    byKey.set(k, e);
  }
  for (const f of womenFolders) {
    const k = keyOf(f.name, f.color);
    const e = byKey.get(k) || {};
    e.women = f;
    byKey.set(k, e);
  }

  const targets: TargetProduct[] = [];
  for (const [, pair] of byKey) {
    const src = pair.men || pair.women!;
    const gender: Gender = pair.men && pair.women ? "unisex" : pair.men ? "men" : "women";
    const meta = parseDocxMeta(src.docxPath);
    targets.push({
      name: src.name,
      color: src.color,
      gender,
      folderPath: src.folderPath,
      front: src.front,
      back: src.back,
      meta,
    });
  }

  const dbRows = await loadDbRows();

  const dbByKey = new Map<string, DbRow[]>();
  for (const r of dbRows) {
    const k = keyOf(r.name, r.color);
    const arr = dbByKey.get(k) || [];
    arr.push(r);
    dbByKey.set(k, arr);
  }

  const actions: Action[] = [];
  for (const target of targets) {
    const k = keyOf(target.name, target.color);
    const matches = dbByKey.get(k) || [];

    if (matches.length === 0) {
      actions.push({ kind: "insert", target });
      continue;
    }

    if (target.gender === "unisex") {
      const men = matches.find((r) => r.gender === "men");
      const women = matches.find((r) => r.gender === "women");
      const unisex = matches.find((r) => r.gender === "unisex");

      if (unisex) {
        const gendered = [men, women].filter(Boolean) as DbRow[];
        if (gendered.length === 0) {
          actions.push({ kind: "noop", target, rowId: unisex.id });
        } else {
          actions.push({
            kind: "dedupe",
            target,
            keepId: unisex.id,
            dropIds: gendered.map((r) => r.id),
          });
        }
      } else if (men && women) {
        actions.push({ kind: "consolidate", target, keepId: men.id, dropId: women.id });
      } else if (men || women) {
        const row = (men || women)!;
        actions.push({ kind: "promote", target, rowId: row.id, fromGender: row.gender });
      }
    } else {
      const exact = matches.find((r) => r.gender === target.gender);
      if (exact) {
        actions.push({ kind: "noop", target, rowId: exact.id });
      } else {
        actions.push({ kind: "insert", target });
      }
    }
  }

  const targetNames = new Set(targets.map((t) => normName(t.name)));
  const orphans: Orphan[] = dbRows
    .filter((r) => !targetNames.has(normName(r.name)))
    .map((r) => ({ id: r.id, name: r.name, color: r.color, gender: r.gender }));

  return { actions, orphans };
}

function formatReport(actions: Action[], orphans: Orphan[]) {
  const counts = {
    insert: 0,
    consolidate: 0,
    promote: 0,
    dedupe: 0,
    noop: 0,
  };
  for (const a of actions) counts[a.kind]++;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Reconcile — ${APPLY ? "APPLY MODE" : "DRY RUN"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Insert:       ${counts.insert}`);
  console.log(`  Consolidate:  ${counts.consolidate}   (men + women → unisex)`);
  console.log(`  Promote:      ${counts.promote}   (gender → unisex)`);
  console.log(`  Dedupe:       ${counts.dedupe}   (drop gendered copies of an existing unisex)`);
  console.log(`  No-op:        ${counts.noop}`);
  console.log(`  Orphans:      ${orphans.length}   (in DB, not in content)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const byKind: Record<string, Action[]> = { insert: [], consolidate: [], promote: [], dedupe: [], noop: [] };
  for (const a of actions) byKind[a.kind].push(a);

  if (byKind.consolidate.length) {
    console.log("■ CONSOLIDATE (men + women → unisex):");
    for (const a of byKind.consolidate as Extract<Action, { kind: "consolidate" }>[]) {
      console.log(`  • ${a.target.name} / ${a.target.color}   keep=${a.keepId}  drop=${a.dropId}`);
    }
    console.log();
  }
  if (byKind.promote.length) {
    console.log("■ PROMOTE (single gender → unisex):");
    for (const a of byKind.promote as Extract<Action, { kind: "promote" }>[]) {
      console.log(`  • ${a.target.name} / ${a.target.color}   ${a.fromGender} → unisex  (id=${a.rowId})`);
    }
    console.log();
  }
  if (byKind.dedupe.length) {
    console.log("■ DEDUPE (drop gendered rows of already-unisex product):");
    for (const a of byKind.dedupe as Extract<Action, { kind: "dedupe" }>[]) {
      console.log(`  • ${a.target.name} / ${a.target.color}   keep=${a.keepId}  drop=[${a.dropIds.join(", ")}]`);
    }
    console.log();
  }
  if (byKind.insert.length) {
    console.log("■ INSERT:");
    for (const a of byKind.insert as Extract<Action, { kind: "insert" }>[]) {
      console.log(`  • ${a.target.name} / ${a.target.color} / ${a.target.gender}   $${a.target.meta.price}`);
    }
    console.log();
  }
  if (orphans.length) {
    console.log("■ ORPHANS (review manually):");
    for (const o of orphans) console.log(`  • ${o.name} / ${o.color} / ${o.gender}  (id=${o.id})`);
    console.log();
  }
}

async function applyAction(a: Action, positionSeed: number): Promise<void> {
  const { target } = a;

  if (a.kind === "noop") return;

  if (a.kind === "consolidate") {
    const newSlug = slugify(target.name, target.color, "unisex");
    const { error: updErr } = await supabase
      .from("products")
      .update({ gender: "unisex", slug: newSlug })
      .eq("id", a.keepId);
    if (updErr) throw updErr;
    const { error: delErr } = await supabase.from("products").delete().eq("id", a.dropId);
    if (delErr) throw delErr;
    console.log(`  ✓ consolidated ${target.name} / ${target.color}`);
    return;
  }

  if (a.kind === "dedupe") {
    const { error } = await supabase.from("products").delete().in("id", a.dropIds);
    if (error) throw error;
    console.log(`  ✓ deduped ${target.name} / ${target.color}  (kept ${a.keepId}, dropped ${a.dropIds.join(", ")})`);
    return;
  }

  if (a.kind === "promote") {
    const newSlug = slugify(target.name, target.color, "unisex");
    const { error } = await supabase
      .from("products")
      .update({ gender: "unisex", slug: newSlug })
      .eq("id", a.rowId);
    if (error) throw error;
    console.log(`  ✓ promoted ${target.name} / ${target.color} → unisex`);
    return;
  }

  if (a.kind === "insert") {
    const subfolder = target.gender;
    const image = target.front ? await uploadLocalImage(target.front, subfolder) : "";
    const imageHover = target.back ? await uploadLocalImage(target.back, subfolder) : image;
    const images: string[] = [];
    if (image) images.push(image);
    if (imageHover && imageHover !== image) images.push(imageHover);

    const sizes = inferSizes(target.name);
    const sizeStock: Record<string, number> = {};
    for (const s of sizes) sizeStock[s] = 10;

    const id = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const slug = slugify(target.name, target.color, target.gender);

    const row = {
      id,
      slug,
      name: target.name,
      price: target.meta.price || 80,
      price_mxn: (target.meta.price || 80) * 18,
      image,
      image_hover: imageHover,
      images,
      category: inferCategory(target.name),
      badge: null,
      sizes,
      is_new: false,
      description: target.meta.description,
      material: target.meta.material,
      origin: target.meta.origin,
      color: target.color,
      fit: null,
      gender: target.gender,
      stock: sizes.length * 10,
      size_stock: sizeStock,
      status: "active",
      position: positionSeed,
    };

    const { error } = await supabase.from("products").insert(row);
    if (error) throw error;
    console.log(`  ✓ inserted ${target.name} / ${target.color} / ${target.gender}`);
  }
}

async function main() {
  const { actions, orphans } = await planActions();
  formatReport(actions, orphans);

  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to execute.\n");
    return;
  }

  const { data: maxPosRow } = await supabase
    .from("products")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  let nextPos = (maxPosRow?.[0]?.position ?? 0) + 1;

  console.log("Applying changes…\n");
  for (const a of actions) {
    try {
      await applyAction(a, a.kind === "insert" ? nextPos++ : 0);
    } catch (err: any) {
      console.error(`  ✗ ${a.kind} failed:`, err?.message || err);
    }
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
