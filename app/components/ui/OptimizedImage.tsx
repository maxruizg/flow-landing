import { optimizedImageUrl, buildSrcSet } from "~/lib/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  quality?: number;
  className?: string;
  loading?: "lazy" | "eager";
}

export function OptimizedImage({
  src,
  alt,
  widths = [480, 640, 960],
  sizes,
  quality = 80,
  className,
  loading = "lazy",
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
    />
  );
}
