interface GoogleAnalyticsProps {
  measurementId: string;
}

/**
 * Server-rendered GA4 (gtag.js) tag.
 *
 * Emitting the script tags during SSR — rather than injecting them from a
 * useEffect — guarantees they show up in View Source and start loading before
 * hydration, which is how GA's own debuggers and most "is GA installed?"
 * checkers verify the tag. The inline config script is a static string built
 * from a sanitized id (`new Date()` is literal JS text, not evaluated at
 * render time), so server and client output are identical and there is no
 * hydration mismatch.
 *
 * `measurementId` is sanitized to `[\w-]` before it ever reaches the inline
 * script body, closing the only break-out vector inside a <script>.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const safeId = measurementId.replace(/[^\w-]/g, "");
  if (!safeId) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${safeId}',{anonymize_ip:true});`,
        }}
      />
    </>
  );
}
