import { useRef, useEffect, useState } from "react";
import { OptimizedImage } from "./OptimizedImage";

interface MediaBackgroundProps {
  src: string;
  video?: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
  /**
   * When true (or when loading="eager") the underlying <img> is given
   * fetchPriority="high" so the browser prioritizes it during preload.
   */
  priority?: boolean;
  width?: number;
  height?: number;
}

/**
 * Renders a background video (autoplay, muted, looped) when a video URL is provided,
 * with the image as a poster/fallback. Falls back to OptimizedImage when no video.
 */
export function MediaBackground({
  src,
  video,
  alt,
  widths,
  sizes,
  className = "",
  loading = "lazy",
  priority,
  width,
  height,
}: MediaBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const isPriority = priority ?? loading === "eager";
  const fetchPriority = isPriority ? "high" : undefined;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Attempt to play — may be blocked by browser autoplay policies
    el.play().catch(() => {});
  }, [video]);

  if (!video) {
    return (
      <OptimizedImage
        src={src}
        alt={alt}
        widths={widths}
        sizes={sizes}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        decoding={isPriority ? "sync" : "async"}
      />
    );
  }

  return (
    <>
      {/* Image fallback shown until video loads */}
      {!videoLoaded && (
        <OptimizedImage
          src={src}
          alt={alt}
          widths={widths}
          sizes={sizes}
          className={className}
          loading={loading}
          fetchPriority={fetchPriority}
          width={width}
          height={height}
          decoding={isPriority ? "sync" : "async"}
        />
      )}
      <video
        ref={videoRef}
        src={video}
        autoPlay
        muted
        loop
        playsInline
        preload={loading === "eager" ? "auto" : "metadata"}
        onCanPlay={() => setVideoLoaded(true)}
        className={`${className} ${videoLoaded ? "" : "opacity-0 absolute"}`}
      />
    </>
  );
}
