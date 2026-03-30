import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { motion } from "framer-motion";
import { useRef } from "react";
import {
  getCollections,
  getDailyFlowImages,
  updateCollectionImage,
  updateDailyFlowImage,
} from "~/data/queries.server";
import { uploadImage } from "~/lib/supabase.server";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Content" }];

export async function loader() {
  const [collections, dailyFlowImages] = await Promise.all([
    getCollections(),
    getDailyFlowImages(),
  ]);
  return json({ collections, dailyFlowImages });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "update-collection-image") {
    const id = form.get("id") as string;
    const file = form.get("image");
    if (file && file instanceof File && file.size > 0) {
      const url = await uploadImage(file, "collections");
      await updateCollectionImage(id, url);
    }
  } else if (intent === "update-daily-flow-image") {
    const id = form.get("id") as string;
    const file = form.get("image");
    if (file && file instanceof File && file.size > 0) {
      const url = await uploadImage(file, "editorial");
      await updateDailyFlowImage(id, url);
    }
  }

  return redirect("/admin/content");
}

function ImageCard({
  id,
  intent,
  imageUrl,
  label,
  sublabel,
  tall,
}: {
  id: string;
  intent: string;
  imageUrl: string;
  label: string;
  sublabel?: string;
  tall?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = () => {
    formRef.current?.submit();
  };

  return (
    <Form method="post" encType="multipart/form-data" ref={formRef}>
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="id" value={id} />
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div
        className={`relative group rounded-xl overflow-hidden bg-flow-900 border border-flow-800/50 cursor-pointer ${
          tall ? "h-80" : "h-40"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-white uppercase tracking-wide font-medium">Change Image</span>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
          <p className="text-sm text-white font-medium">{label}</p>
          {sublabel && <p className="text-xs text-flow-400">{sublabel}</p>}
        </div>
      </div>
    </Form>
  );
}

export default function AdminContent() {
  const { collections, dailyFlowImages } = useLoaderData<typeof loader>();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Hero / Collections Section */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.15em] text-flow-400 font-medium mb-4">
          Hero Collections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((col) => (
            <ImageCard
              key={col.id}
              id={col.id}
              intent="update-collection-image"
              imageUrl={col.image}
              label={col.name}
              sublabel={col.season}
              tall
            />
          ))}
        </div>
      </section>

      {/* Daily Flow Section */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.15em] text-flow-400 font-medium mb-4">
          Daily Flow Images
        </h2>
        {dailyFlowImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* First image tall, rest stacked */}
            <div className="md:row-span-2">
              <ImageCard
                id={dailyFlowImages[0].id}
                intent="update-daily-flow-image"
                imageUrl={dailyFlowImages[0].src}
                label={dailyFlowImages[0].alt || "Daily Flow 1"}
                sublabel={dailyFlowImages[0].caption}
                tall
              />
            </div>
            {dailyFlowImages.slice(1).map((img) => (
              <ImageCard
                key={img.id}
                id={img.id}
                intent="update-daily-flow-image"
                imageUrl={img.src}
                label={img.alt || `Daily Flow ${img.id}`}
                sublabel={img.caption}
              />
            ))}
          </div>
        ) : (
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-12 text-center">
            <p className="text-flow-500 text-sm">No daily flow images found.</p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
