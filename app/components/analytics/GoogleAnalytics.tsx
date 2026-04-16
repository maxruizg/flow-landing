interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const safeId = measurementId.replace(/[^\w-]/g, "");
  if (!safeId) return null;
  return (
    <>
      <meta name="ga-measurement-id" content={safeId} />
      <script src="/scripts/ga-init.js" async />
    </>
  );
}
