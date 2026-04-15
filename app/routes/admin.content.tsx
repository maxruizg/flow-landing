import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { cn } from "~/lib/utils";
import {
  getCollections,
  getDailyFlowImages,
  updateCollectionImage,
  updateCollectionVideo,
  updateDailyFlowImage,
  updateDailyFlowVideo,
} from "~/data/queries.server";
import { uploadImage } from "~/lib/supabase.server";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Content" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const [collections, dailyFlowImages] = await Promise.all([
    getCollections(),
    getDailyFlowImages(),
  ]);
  return json({ collections, dailyFlowImages });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  try {
    if (intent === "update-collection-image") {
      const id = form.get("id") as string;
      const file = form.get("file");
      if (file && file instanceof File && file.size > 0) {
        const url = await uploadImage(file, "collections");
        await updateCollectionImage(id, url);
      }
    } else if (intent === "update-collection-video") {
      const id = form.get("id") as string;
      const file = form.get("file");
      if (file && file instanceof File && file.size > 0) {
        const url = await uploadImage(file, "collections/videos");
        await updateCollectionVideo(id, url);
      }
    } else if (intent === "remove-collection-video") {
      const id = form.get("id") as string;
      await updateCollectionVideo(id, null);
    } else if (intent === "update-daily-flow-image") {
      const id = form.get("id") as string;
      const file = form.get("file");
      if (file && file instanceof File && file.size > 0) {
        const url = await uploadImage(file, "editorial");
        await updateDailyFlowImage(id, url);
      }
    } else if (intent === "update-daily-flow-video") {
      const id = form.get("id") as string;
      const file = form.get("file");
      if (file && file instanceof File && file.size > 0) {
        const url = await uploadImage(file, "editorial/videos");
        await updateDailyFlowVideo(id, url);
      }
    } else if (intent === "remove-daily-flow-video") {
      const id = form.get("id") as string;
      await updateDailyFlowVideo(id, null);
    }
  } catch (err) {
    console.error("Content upload failed:", err);
    return json({ error: "Upload failed" }, { status: 500 });
  }

  return redirect("/admin/content");
}

function MediaCard({
  id,
  intentImage,
  intentVideo,
  intentRemoveVideo,
  imageUrl,
  videoUrl,
  label,
  sublabel,
  tall,
}: {
  id: string;
  intentImage: string;
  intentVideo: string;
  intentRemoveVideo: string;
  imageUrl: string;
  videoUrl?: string;
  label: string;
  sublabel?: string;
  tall?: boolean;
}) {
  const fetcher = useFetcher();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isUploading = fetcher.state !== "idle";

  const submitFile = useCallback(
    (file: File, intent: string) => {
      const formData = new FormData();
      formData.set("intent", intent);
      formData.set("id", id);
      formData.set("file", file);
      fetcher.submit(formData, {
        method: "post",
        encType: "multipart/form-data",
      });
    },
    [fetcher, id]
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) submitFile(file, intentImage);
    if (e.target) e.target.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) submitFile(file, intentVideo);
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type.startsWith("video/")) {
      submitFile(file, intentVideo);
    } else if (file.type.startsWith("image/")) {
      submitFile(file, intentImage);
    }
  };

  const handleRemoveVideo = () => {
    const formData = new FormData();
    formData.set("intent", intentRemoveVideo);
    formData.set("id", id);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-flow-900 border-2 transition-colors",
        dragging
          ? "border-white/60"
          : "border-flow-800/50",
        tall ? "h-80" : "h-40"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleVideoSelect}
        className="hidden"
      />

      {/* Preview */}
      <div className="relative w-full h-full">
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        )}

        {/* Drag overlay */}
        {dragging && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-white font-medium">Drop image or video</span>
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-flow-black/70 z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-xs text-white uppercase tracking-wide">Uploading...</span>
            </div>
          </div>
        )}

        {/* Hover overlay with controls */}
        {!dragging && !isUploading && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-white uppercase tracking-wide font-medium">Change Image</span>
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-white uppercase tracking-wide font-medium">
                {videoUrl ? "Change Video" : "Add Video"}
              </span>
            </button>

            {videoUrl && (
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-xs text-red-400 uppercase tracking-wide font-medium">Remove Video</span>
              </button>
            )}

            <p className="text-[10px] text-flow-500 mt-1">or drag & drop a file</p>
          </div>
        )}

        {/* Labels */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 pointer-events-none">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white font-medium">{label}</p>
            {videoUrl && (
              <span className="text-[9px] uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded">
                Video
              </span>
            )}
          </div>
          {sublabel && <p className="text-xs text-flow-400">{sublabel}</p>}
        </div>
      </div>
    </div>
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
            <MediaCard
              key={col.id}
              id={col.id}
              intentImage="update-collection-image"
              intentVideo="update-collection-video"
              intentRemoveVideo="remove-collection-video"
              imageUrl={col.image}
              videoUrl={col.video}
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
          Daily Flow Media
        </h2>
        {dailyFlowImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:row-span-2">
              <MediaCard
                id={dailyFlowImages[0].id}
                intentImage="update-daily-flow-image"
                intentVideo="update-daily-flow-video"
                intentRemoveVideo="remove-daily-flow-video"
                imageUrl={dailyFlowImages[0].src}
                videoUrl={dailyFlowImages[0].video}
                label={dailyFlowImages[0].alt || "Daily Flow 1"}
                sublabel={dailyFlowImages[0].caption}
                tall
              />
            </div>
            {dailyFlowImages.slice(1).map((img) => (
              <MediaCard
                key={img.id}
                id={img.id}
                intentImage="update-daily-flow-image"
                intentVideo="update-daily-flow-video"
                intentRemoveVideo="remove-daily-flow-video"
                imageUrl={img.src}
                videoUrl={img.video}
                label={img.alt || `Daily Flow ${img.id}`}
                sublabel={img.caption}
              />
            ))}
          </div>
        ) : (
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-12 text-center">
            <p className="text-flow-500 text-sm">No daily flow media found.</p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
