interface MetaPixelProps {
  pixelId: string;
}

export function MetaPixel({ pixelId }: MetaPixelProps) {
  const safeId = pixelId.replace(/[^\w]/g, "");
  if (!safeId) return null;
  return (
    <>
      <meta name="meta-pixel-id" content={safeId} />
      <script src="/scripts/meta-pixel-init.js" async />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${encodeURIComponent(safeId)}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
