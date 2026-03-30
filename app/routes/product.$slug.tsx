import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "~/context/LocaleContext";
import { useCart } from "~/context/CartContext";
import { Navbar } from "~/components/layout/Navbar";
import { getProductBySlug } from "~/data/queries.server";
import { cn } from "~/lib/utils";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import type { Product } from "~/lib/types";
import { OptimizedImage } from "~/components/ui/OptimizedImage";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.product) return [{ title: "Product Not Found — FLOW URBAN WEAR" }];
  return [
    { title: `${data.product.name} — FLOW URBAN WEAR` },
    { name: "description", content: data.product.description },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const product = await getProductBySlug(params.slug!);
  return json({ product });
}

const COLOR_MAP: Record<string, string> = {
  Black: "bg-flow-900 border-flow-600",
  Brown: "bg-stone-700 border-stone-500",
  "Off White": "bg-stone-200 border-stone-300",
  White: "bg-white border-flow-300",
  Yellow: "bg-yellow-400 border-yellow-500",
};

function ProductModal({ product }: { product: Product }) {
  const { formatLocalPrice } = useLocale();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [navigate]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => navigate(-1)}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-6xl max-h-[92vh] bg-flow-950 border border-flow-800/50 rounded-2xl overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        >
          {/* Close button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-flow-900/80 backdrop-blur-sm border border-flow-700/50 flex items-center justify-center text-flow-400 hover:text-white hover:bg-flow-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content — scrollable */}
          <div className="overflow-y-auto overscroll-contain">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left — Image */}
              <div className="relative bg-flow-900">
                <div className="aspect-square sticky top-0">
                  <OptimizedImage
                    src={product.images[selectedImage]}
                    alt={product.name}
                    widths={[640, 960, 1280]}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />

                  {/* Badge overlay */}
                  {product.badge && (
                    <span className={cn(
                      "absolute top-4 left-4 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium rounded-full",
                      product.badge === "New"
                        ? "bg-white text-flow-black"
                        : "bg-flow-black text-white border border-flow-700"
                    )}>
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Thumbnails — bottom of image area */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImage(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          selectedImage === i
                            ? "bg-white w-5"
                            : "bg-white/40 hover:bg-white/70"
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

                <p className="text-xl text-flow-200 font-display font-medium mb-4">
                  {formatLocalPrice(product.price)}
                </p>

                <p className="text-flow-400 text-sm leading-relaxed mb-5">
                  {product.description}
                </p>

                {/* Color variants */}
                {product.colorVariants && product.colorVariants.length >= 1 && (
                  <div className="mb-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-flow-500 mb-2">
                      Color — {product.color}
                    </p>
                    <div className="flex gap-2">
                      {product.colorVariants.map((v) => (
                        <Link
                          key={v.slug}
                          to={`/product/${v.slug}`}
                          prefetch="intent"
                          replace
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-all",
                            COLOR_MAP[v.color] || "bg-flow-700 border-flow-500",
                            v.slug === product.slug
                              ? "ring-2 ring-white ring-offset-2 ring-offset-flow-950"
                              : "hover:scale-110"
                          )}
                          title={v.color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                <div className="mb-6">
                  <p className={cn(
                    "text-[11px] uppercase tracking-[0.2em] mb-2 transition-colors",
                    sizeError ? "text-red-400" : "text-flow-500"
                  )}>
                    {sizeError ? "Please select a size" : "Size"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => { setSelectedSize(size); setSizeError(false); }}
                        className={cn(
                          "px-3.5 py-2 text-sm font-medium rounded-full border transition-all",
                          selectedSize === size
                            ? "bg-white text-flow-black border-white"
                            : "border-flow-700 text-flow-200 hover:border-white hover:text-white"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add to bag */}
                <button
                  className={cn(
                    "w-full font-display font-semibold text-sm tracking-wide uppercase rounded-full px-6 py-3.5 transition-colors mb-6",
                    addedFeedback
                      ? "bg-green-500 text-white"
                      : "bg-white text-flow-black hover:bg-flow-200"
                  )}
                  onClick={() => {
                    if (!selectedSize) {
                      setSizeError(true);
                      return;
                    }
                    addItem({
                      productId: product.id,
                      productSlug: product.slug,
                      productName: product.name,
                      productImage: product.images[0],
                      size: selectedSize,
                      price: product.price,
                    });
                    setAddedFeedback(true);
                    setTimeout(() => setAddedFeedback(false), 1500);
                  }}
                >
                  {addedFeedback ? (
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

                {/* Details — compact */}
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
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div id="main-content">
      <Navbar />
      {product ? (
        <ProductModal product={product} />
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
