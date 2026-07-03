import { useEffect, useMemo, useRef, useState } from "react";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  Link,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { motion, AnimatePresence, useMotionValue, animate as motionAnimate } from "framer-motion";
import { useLocale } from "~/context/LocaleContext";
import { useCart } from "~/context/CartContext";
import { Navbar } from "~/components/layout/Navbar";
import {
  findProductBySlugSuffixSwap,
  findProductByVariantSlug,
  getProductBySlug,
} from "~/data/queries.server";
import { cn } from "~/lib/utils";
import type {
  HeadersFunction,
  MetaFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import type { Product, ProductVariant } from "~/lib/types";
import { optimizedImageUrl, buildSrcSet } from "~/lib/image";
import { SITE_URL, absoluteUrl, productJsonLd } from "~/lib/seo";
import { JsonLdScript } from "~/components/seo/JsonLdScript";
import { colorSwatch } from "~/lib/color-map";
import { trackViewItem } from "~/lib/analytics";

// Tag identifiers redefined per-PDP — filtered out of inherited root meta to
// avoid duplicates in the rendered <head>.
const PRODUCT_OVERRIDE_NAMES = new Set([
  "description",
  "twitter:title",
  "twitter:description",
  "twitter:image",
]);
const PRODUCT_OVERRIDE_PROPS = new Set([
  "og:type",
  "og:title",
  "og:description",
  "og:url",
  "og:image",
]);

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  const parentMeta = matches.flatMap((m) => m.meta ?? []);

  if (!data?.product) {
    const filtered = parentMeta.filter((t) => !("title" in (t as object)));
    return [...filtered, { title: "Product Not Found — FLOW Urban Wear" }];
  }

  const product = data.product;
  const defaultVariant =
    product.variants.find((v) => v.id === product.defaultVariantId) ??
    product.variants[0];
  const title = `${product.name} — FLOW Urban Wear`;
  // Generic Spanish fallback so pages without a variant description never
  // ship an empty meta description.
  const description =
    defaultVariant?.description ||
    `Compra ${product.name} de FLOW Urban Wear, streetwear mexicano hecho en CDMX. Envíos a todo México.`;
  const canonical = `${SITE_URL}/product/${product.slug}`;
  const ogImage = defaultVariant
    ? absoluteUrl(optimizedImageUrl(defaultVariant.image, 1280, 85))
    : undefined;

  const filtered = parentMeta.filter((tag) => {
    const t = tag as { title?: string; name?: string; property?: string };
    if (t.title !== undefined) return false;
    if (t.name && PRODUCT_OVERRIDE_NAMES.has(t.name)) return false;
    if (t.property && PRODUCT_OVERRIDE_PROPS.has(t.property)) return false;
    return true;
  });

  const tags: ReturnType<MetaFunction> = [
    ...filtered,
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:type", content: "product" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (ogImage) {
    tags.push({ property: "og:image", content: ogImage });
    tags.push({ name: "twitter:image", content: ogImage });
  }

  // Note: Product JSON-LD is rendered inside the page component (see
  // ProductJsonLd below). Remix v2 only honors `tagName: "meta" | "link"` in
  // meta exports and silently drops "script", so script injection has to
  // happen in the component tree.

  return tags;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const slug = params.slug!;
  const product = await getProductBySlug(slug);
  if (product) return json({ product });

  // Legacy per-color slug → redirect to the new scheme.
  const legacy = await findProductByVariantSlug(slug);
  if (legacy) {
    const url = new URL(request.url);
    url.pathname = `/product/${legacy.productSlug}`;
    url.searchParams.set("variant", legacy.variantId);
    return redirect(`${url.pathname}${url.search}`, 301);
  }

  // Slug whose gender suffix is stale (e.g. -unisex → -women after an edit).
  const renamed = await findProductBySlugSuffixSwap(slug);
  if (renamed) {
    const url = new URL(request.url);
    url.pathname = `/product/${renamed.slug}`;
    return redirect(`${url.pathname}${url.search}`, 301);
  }

  return json({ product: null as Product | null }, { status: 404 });
}

/**
 * PDPs change less often than the home/showroom and benefit from a longer
 * edge cache. Stale-while-revalidate keeps cached responses serving for a
 * week while a new one is fetched in the background.
 */
export const headers: HeadersFunction = () => ({
  "Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=604800",
});

function pickDefaultVariant(product: Product): ProductVariant | undefined {
  const active = product.variants
    .filter((v) => v.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (product.defaultVariantId) {
    const byId = active.find((v) => v.id === product.defaultVariantId);
    if (byId) return byId;
  }
  return active[0] ?? product.variants[0];
}

type ProductImageProps = {
  src: string;
  alt: string;
  badge: string | null;
  onExpand: () => void;
};

function ProductImage({ src, alt, badge, onExpand }: ProductImageProps) {
  const widths = [640, 960, 1280];
  const srcSet = buildSrcSet(src, widths, 80);
  const fallbackSrc = srcSet ? optimizedImageUrl(src, widths[widths.length - 1], 80) : src;

  return (
    <div className="absolute inset-0 overflow-hidden select-none">
      <img
        src={fallbackSrc}
        srcSet={srcSet || undefined}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-500 ease-out md:hover:scale-[1.02]"
        loading="eager"
        decoding="async"
        draggable={false}
      />

      {badge && (
        <span
          className={cn(
            "absolute top-4 left-4 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium rounded-full pointer-events-none",
            badge === "New"
              ? "bg-white text-flow-black"
              : "bg-flow-black text-white border border-flow-700",
          )}
        >
          {badge}
        </span>
      )}

      <button
        type="button"
        onClick={onExpand}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-flow-black/50 backdrop-blur-sm border border-flow-700/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-flow-black/70 transition-colors"
        aria-label="Expand image"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" />
        </svg>
      </button>
    </div>
  );
}

const LIGHTBOX_ZOOM = 2;

type ImageLightboxProps = {
  images: string[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  alt: string;
};

function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  alt,
}: ImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Reset zoom + drag position whenever the visible image changes.
  useEffect(() => {
    setZoomed(false);
    x.set(0);
    y.set(0);
  }, [index, x, y]);

  // Animate image back to center when zoom is dismissed.
  useEffect(() => {
    if (!zoomed) {
      motionAnimate(x, 0, { type: "spring", stiffness: 260, damping: 28 });
      motionAnimate(y, 0, { type: "spring", stiffness: 260, damping: 28 });
    }
  }, [zoomed, x, y]);

  // Track lightbox stage size for drag bounds.
  useEffect(() => {
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setBounds({ width: rect.width, height: rect.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Keyboard: Escape closes, arrows navigate (only when not zoomed).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (zoomed || images.length <= 1) return;
      if (e.key === "ArrowLeft") {
        onIndexChange((index - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        onIndexChange((index + 1) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onIndexChange, onClose, zoomed]);

  const widths = [960, 1280, 1920];
  const srcSet = buildSrcSet(images[index], widths, 85);
  const fallbackSrc = srcSet
    ? optimizedImageUrl(images[index], widths[widths.length - 1], 85)
    : images[index];

  const dragRange = {
    left: (-bounds.width * (LIGHTBOX_ZOOM - 1)) / 2,
    right: (bounds.width * (LIGHTBOX_ZOOM - 1)) / 2,
    top: (-bounds.height * (LIGHTBOX_ZOOM - 1)) / 2,
    bottom: (bounds.height * (LIGHTBOX_ZOOM - 1)) / 2,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Close zoom"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-[11px] uppercase tracking-[0.2em] text-white/70">
          {index + 1} / {images.length}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-[min(95vw,90vh)] h-[min(95vw,90vh)]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          if (zoomed || images.length <= 1) return;
          const t = e.touches[0];
          swipeStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (zoomed || images.length <= 1 || !swipeStartRef.current) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - swipeStartRef.current.x;
          const dy = t.clientY - swipeStartRef.current.y;
          swipeStartRef.current = null;
          if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
          if (dx < 0) onIndexChange((index + 1) % images.length);
          else onIndexChange((index - 1 + images.length) % images.length);
        }}
      >
        <motion.div
          className="w-full h-full"
          drag={zoomed}
          dragConstraints={dragRange}
          dragElastic={0.08}
          dragMomentum={false}
          onTap={() => setZoomed((z) => !z)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setZoomed((z) => !z);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={zoomed ? "Exit zoom" : "Zoom image"}
          style={{
            x,
            y,
            touchAction: zoomed ? "none" : "pan-y",
            cursor: zoomed ? "zoom-out" : "zoom-in",
          }}
        >
          <motion.img
            key={index}
            src={fallbackSrc}
            srcSet={srcSet || undefined}
            sizes="90vw"
            alt={alt}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: zoomed ? LIGHTBOX_ZOOM : 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        </motion.div>
      </div>

      {images.length > 1 && !zoomed && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index - 1 + images.length) % images.length);
            }}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index + 1) % images.length);
            }}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </motion.div>
  );
}

function ProductModal({ product }: { product: Product }) {
  const { formatLocalPrice } = useLocale();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const variantParam = searchParams.get("variant");
  const selectedVariant = useMemo<ProductVariant | undefined>(() => {
    if (variantParam) {
      const byId = product.variants.find((v) => v.id === variantParam);
      if (byId) return byId;
    }
    return pickDefaultVariant(product);
  }, [product, variantParam]);

  const activeVariants = useMemo(
    () =>
      product.variants
        .filter((v) => v.status === "active")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [product.variants],
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Reset image/size state whenever the selected variant changes.
  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(null);
    setSizeError(false);
    setLightboxOpen(false);
  }, [selectedVariant?.id]);

  // Preload every variant image as soon as the variant is selected. Without
  // this, the first arrow/dot click after opening the modal appears to do
  // nothing because the browser is still fetching the new src; by the time
  // images are cached, navigation feels instant from the very first click.
  useEffect(() => {
    if (typeof window === "undefined" || !selectedVariant) return;
    const list = selectedVariant.images.length > 0
      ? selectedVariant.images
      : [selectedVariant.image];
    list.forEach((url) => {
      const img = new Image();
      img.src = optimizedImageUrl(url, 1280, 80);
    });
  }, [selectedVariant?.id]);

  // GA4 view_item — fires once per product+variant combination.
  useEffect(() => {
    if (!selectedVariant) return;
    trackViewItem({
      item: {
        item_id: selectedVariant.id,
        item_name: product.name,
        item_variant: selectedVariant.colorName,
        item_category: product.category,
        item_brand: product.brand ?? undefined,
        price: selectedVariant.price,
      },
    });
  }, [
    selectedVariant?.id,
    selectedVariant?.price,
    selectedVariant?.colorName,
    product.name,
    product.category,
    product.brand,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // When the lightbox is open it owns Escape (closes itself first).
      if (lightboxOpen) return;
      if (e.key === "Escape") navigate(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [navigate, lightboxOpen]);

  if (!selectedVariant) return null;

  const images = selectedVariant.images.length > 0 ? selectedVariant.images : [selectedVariant.image];
  const variantStock = selectedVariant.stock;
  const sizeStock = selectedVariant.sizeStock;
  const lowStock = variantStock > 0 && variantStock < 5;
  const outOfStock = variantStock === 0;
  const canAddToCart = selectedVariant.status === "active" && !outOfStock;

  const onSelectVariant = (v: ProductVariant) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v.id === product.defaultVariantId) next.delete("variant");
        else next.set("variant", v.id);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => navigate(-1)}
        />

        <motion.div
          className="relative w-full max-w-6xl max-h-[92vh] bg-flow-950 border border-flow-800/50 rounded-2xl overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        >
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-flow-900/80 backdrop-blur-sm border border-flow-700/50 flex items-center justify-center text-flow-400 hover:text-white hover:bg-flow-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="overflow-y-auto overscroll-contain">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left — Image */}
              <div
                className="relative bg-flow-900 touch-pan-y select-none"
                onTouchStart={(e) => {
                  if (images.length <= 1) return;
                  const t = e.touches[0];
                  touchStartXRef.current = t.clientX;
                  touchStartYRef.current = t.clientY;
                }}
                onTouchEnd={(e) => {
                  if (images.length <= 1) return;
                  const startX = touchStartXRef.current;
                  const startY = touchStartYRef.current;
                  touchStartXRef.current = null;
                  touchStartYRef.current = null;
                  if (startX === null || startY === null) return;
                  const t = e.changedTouches[0];
                  const dx = t.clientX - startX;
                  const dy = t.clientY - startY;
                  // Require dominantly horizontal motion past a 40px threshold.
                  if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
                  if (dx < 0) {
                    setSelectedImage((prev) => (prev + 1) % images.length);
                  } else {
                    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
                  }
                }}
              >
                <div className="aspect-square sticky top-0">
                  <ProductImage
                    src={images[selectedImage]}
                    alt={`${product.name} ${selectedVariant.colorName}`}
                    badge={selectedVariant.badge ?? null}
                    onExpand={() => setLightboxOpen(true)}
                  />
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-flow-black/50 backdrop-blur-sm border border-flow-700/40 flex items-center justify-center text-white/70 hover:text-white hover:bg-flow-black/70 transition-colors"
                      aria-label="Previous image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-flow-black/50 backdrop-blur-sm border border-flow-700/40 flex items-center justify-center text-white/70 hover:text-white hover:bg-flow-black/70 transition-colors"
                      aria-label="Next image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImage(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          selectedImage === i ? "bg-white w-5" : "bg-white/40 hover:bg-white/70",
                        )}
                        aria-label={`View image ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right — Info */}
              <div className="flex flex-col p-6 md:p-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
                  {product.name}
                </h1>

                <p className="text-xl text-flow-200 font-display font-medium mb-1">
                  {formatLocalPrice(selectedVariant.price, selectedVariant.priceMxn) ?? "Precio no disponible"}
                </p>
                {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                  <p className="text-sm text-flow-500 line-through mb-3">
                    {formatLocalPrice(selectedVariant.compareAtPrice, selectedVariant.compareAtPrice)}
                  </p>
                )}

                <p className="text-flow-400 text-sm leading-relaxed mb-5">
                  {selectedVariant.description}
                </p>

                {/* Color variants */}
                {activeVariants.length >= 1 && (
                  <div className="mb-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-flow-500 mb-2">
                      Color — {selectedVariant.colorName}
                    </p>
                    <div className="flex gap-2">
                      {activeVariants.map((v) => {
                        const isSelected = v.id === selectedVariant.id;
                        const style = v.colorHex ? { backgroundColor: v.colorHex } : undefined;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => onSelectVariant(v)}
                            className={cn(
                              "w-7 h-7 rounded-full border-2 transition-all",
                              !v.colorHex && colorSwatch(v.colorName),
                              isSelected
                                ? "ring-2 ring-white ring-offset-2 ring-offset-flow-950"
                                : "hover:scale-110",
                            )}
                            style={style}
                            title={v.colorName}
                            aria-pressed={isSelected}
                            aria-label={v.colorName}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                <div className="mb-3">
                  <p
                    className={cn(
                      "text-[11px] uppercase tracking-[0.2em] mb-2 transition-colors",
                      sizeError ? "text-red-400" : "text-flow-500",
                    )}
                  >
                    {sizeError ? "Please select a size" : "Size"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes.map((size) => {
                      const stockForSize = sizeStock[size] ?? 0;
                      const disabled = stockForSize <= 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedSize(size);
                            setSizeError(false);
                          }}
                          className={cn(
                            "px-3.5 py-2 text-sm font-medium rounded-full border transition-all",
                            disabled && "opacity-30 line-through cursor-not-allowed",
                            selectedSize === size
                              ? "bg-white text-flow-black border-white"
                              : "border-flow-700 text-flow-200 hover:border-white hover:text-white",
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock hint */}
                <p className="text-xs mb-5 min-h-[1em]">
                  {outOfStock && <span className="text-red-400">Agotado</span>}
                  {!outOfStock && lowStock && (
                    <span className="text-amber-400">Solo quedan {variantStock} en stock</span>
                  )}
                </p>

                {/* Add to bag */}
                <button
                  disabled={!canAddToCart}
                  className={cn(
                    "w-full font-display font-semibold text-sm tracking-wide uppercase rounded-full px-6 py-3.5 transition-colors mb-6",
                    !canAddToCart && "bg-flow-800 text-flow-500 cursor-not-allowed",
                    canAddToCart && addedFeedback && "bg-green-500 text-white",
                    canAddToCart && !addedFeedback && "bg-white text-flow-black hover:bg-flow-200",
                  )}
                  onClick={() => {
                    if (!canAddToCart) return;
                    if (!selectedSize) {
                      setSizeError(true);
                      return;
                    }
                    addItem({
                      productId: product.id,
                      variantId: selectedVariant.id,
                      productSlug: product.slug,
                      variantSlug: selectedVariant.slug,
                      productName: product.name,
                      colorName: selectedVariant.colorName,
                      productImage: images[0],
                      size: selectedSize,
                      price: selectedVariant.price,
                      priceMxn: selectedVariant.priceMxn,
                    });
                    setAddedFeedback(true);
                    setTimeout(() => setAddedFeedback(false), 1500);
                  }}
                >
                  {outOfStock ? (
                    "Agotado"
                  ) : addedFeedback ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Bag
                    </span>
                  ) : (
                    "Add to Bag"
                  )}
                </button>

                <div className="border-t border-flow-800/50 pt-4 space-y-2 mt-auto">
                  {product.fit && (
                    <div className="flex justify-between text-xs">
                      <span className="text-flow-500">Fit</span>
                      <span className="text-flow-300">{product.fit}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-flow-500">Material</span>
                    <span className="text-flow-300">{product.material}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-flow-500">Origin</span>
                    <span className="text-flow-300">{product.origin}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-flow-500">Gender</span>
                    <span className="text-flow-300 capitalize">{product.gender}</span>
                  </div>
                  {selectedVariant.sku && (
                    <div className="flex justify-between text-xs">
                      <span className="text-flow-500">SKU</span>
                      <span className="text-flow-300 font-mono">{selectedVariant.sku}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={selectedImage}
          onIndexChange={setSelectedImage}
          onClose={() => setLightboxOpen(false)}
          alt={`${product.name} ${selectedVariant.colorName}`}
        />
      )}
    </AnimatePresence>
  );
}

function ProductJsonLd({ product }: { product: Product }) {
  const defaultVariant =
    product.variants.find((v) => v.id === product.defaultVariantId) ??
    product.variants[0];
  if (!defaultVariant) return null;
  const canonical = `${SITE_URL}/product/${product.slug}`;
  return <JsonLdScript data={productJsonLd(product, defaultVariant, canonical)} />;
}

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div id="main-content">
      <Navbar />
      {product ? (
        <>
          <ProductJsonLd product={product} />
          <ProductModal product={product} />
        </>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => navigate(-1)} />
          <div className="relative bg-flow-950 border border-flow-800/50 rounded-2xl p-8 text-center max-w-sm">
            <h1 className="font-display text-2xl font-bold text-white mb-3">Product Not Found</h1>
            <p className="text-flow-400 text-sm mb-6">The product you're looking for doesn't exist.</p>
            <Link
              to="/showroom"
              className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm rounded-full hover:bg-flow-200 transition-colors"
            >
              Back to Showroom
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
