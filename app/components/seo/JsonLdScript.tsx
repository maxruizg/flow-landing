import { serializeJsonLd } from "~/lib/seo";

/**
 * Generic JSON-LD <script> renderer. Use whenever a route needs to inject a
 * schema.org payload that can't go through Remix's `meta` export — Remix v2
 * only honors tagName "meta" and "link" there.
 *
 * XSS surface: the helper runs the payload through serializeJsonLd, which
 * escapes `<` (blocks `</script>` break-out inside a script body) plus
 * U+2028/U+2029 (line-separator characters that break JS string literals).
 * Standard safe pattern shared by Next.js, React docs, and Google's JSON-LD
 * guide. Encapsulating it here keeps every other route free of inline
 * `dangerouslySetInnerHTML` calls.
 */
export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
