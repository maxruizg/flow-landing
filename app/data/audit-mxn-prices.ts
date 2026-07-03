/**
 * Lists every product variant missing a valid MXN price (price_mxn null or <= 0).
 * Since the ×17 USD fallback was removed, these variants show "Precio no
 * disponible" in the MXN storefront and cannot be purchased in pesos.
 *
 * Run: pnpm tsx app/data/audit-mxn-prices.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
);

async function main() {
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      "id, product_id, color_name, price, price_mxn, status, products!product_variants_product_id_fkey(name)",
    )
    .or("price_mxn.is.null,price_mxn.lte.0")
    .order("product_id");
  if (error) throw error;

  const rows = (data ?? []).filter((v: any) => v.status !== "archived");
  if (rows.length === 0) {
    console.log("✅ Todas las variantes activas tienen price_mxn válido.");
    return;
  }

  console.log(`⚠️  ${rows.length} variantes SIN precio MXN válido:\n`);
  for (const v of rows as any[]) {
    const name = v.products?.name ?? v.product_id;
    console.log(
      `- ${name} · ${v.color_name ?? "?"} · status=${v.status} · USD $${v.price} · MXN=${v.price_mxn ?? "null"} · variant=${v.id}`,
    );
  }
  console.log(
    "\nCaptura el precio en pesos de cada una en /admin/products para que vuelvan a ser comprables en MXN.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
