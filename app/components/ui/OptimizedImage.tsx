import { optimizedImageUrl, buildSrcSet } from "~/lib/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  quality?: number;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
  decoding?: "async" | "sync" | "auto";
}

export function OptimizedImage({
  src,
  alt,
  widths = [480, 640, 960],
  sizes,
  quality = 80,
  className,
  loading = "lazy",
  fetchPriority,
  width,
  height,
  decoding = "async",
}: OptimizedImageProps) {
  const srcSet = buildSrcSet(src, widths, quality);
  const fallbackSrc = srcSet
    ? optimizedImageUrl(src, widths[widths.length - 1], quality)
    : src;

  return (
    <img
      src={fallbackSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      // React 18 only forwards this as the lowercase DOM attribute (camelCase
      // support landed in React 19); the type defs lack it, so widen the spread.
      {...({ fetchpriority: fetchPriority } as Record<string, unknown>)}
      width={width}
      height={height}
    />
  );
}
