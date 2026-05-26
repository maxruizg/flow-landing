import { getAllProducts } from "~/data/queries.server";
import { SITE_URL } from "~/lib/seo";

const STATIC_PATHS = ["/", "/showroom"];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loader() {
  const products = await getAllProducts();
  const productPaths = products.map((p) => `/product/${p.slug}`);
  const allPaths = [...STATIC_PATHS, ...productPaths];

  const urlEntries = allPaths
    .map((p) => `  <url><loc>${escapeXml(`${SITE_URL}${p}`)}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
