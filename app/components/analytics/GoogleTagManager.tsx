interface GoogleTagManagerProps {
  containerId: string;
}

/**
 * Google Tag Manager loader. Mirrors the GoogleAnalytics pattern: writes a
 * meta tag with the container id and loads /scripts/gtm-init.js async, so
 * the GTM bootstrap never blocks parse. Consent-gated by the caller.
 *
 * NOTE: When BOTH this component and <GoogleAnalytics /> are mounted, make
 * sure the GA4 tag inside the GTM container is NOT also configured to fire
 * on page_view / e-commerce events — otherwise events double-count. The
 * recommended setup is: keep gtag.js sending pageviews/ecommerce, and use
 * GTM only for additional tags (Meta CAPI, Pinterest, etc).
 */
export function GoogleTagManager({ containerId }: GoogleTagManagerProps) {
  const safeId = containerId.replace(/[^\w-]/g, "");
  if (!safeId) return null;
  return (
    <>
      <meta name="gtm-container-id" content={safeId} />
      <script src="/scripts/gtm-init.js" async />
      <noscript>
        {/* GTM no-JS fallback iframe */}
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(safeId)}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
