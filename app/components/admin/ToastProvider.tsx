import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Toast as ServerToast } from "~/lib/toast.server";

export type ToastKind = ServerToast["type"];

export interface ToastItem {
  id: number;
  type: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (input: { type?: ToastKind; message: string }) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return ctx;
}

interface ToastProviderProps {
  children: React.ReactNode;
  /** Flash toast surfaced by a route loader after redirect. */
  flash?: ServerToast | null;
}

export function ToastProvider({ children, flash }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((type: ToastKind, message: string) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, type === "error" ? 5000 : 3000);
  }, []);

  const api: ToastContextValue = {
    toast: ({ type = "success", message }) => push(type, message),
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  // Surface flash toasts from the server on mount / when they change
  const lastFlashRef = useRef<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const sig = `${flash.type}:${flash.message}`;
    if (lastFlashRef.current === sig) return;
    lastFlashRef.current = sig;
    push(flash.type, flash.message);
  }, [flash, push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={(id) => setItems((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            role="status"
            className={
              "pointer-events-auto flex items-start gap-3 min-w-[260px] max-w-sm px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border " +
              toneClasses(t.type)
            }
          >
            <span className="mt-0.5 shrink-0">{toneIcon(t.type)}</span>
            <p className="text-sm leading-snug flex-1">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 -mr-1 -mt-1 opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function toneClasses(type: ToastKind): string {
  switch (type) {
    case "success":
      return "bg-green-500/95 border-green-400/50 text-white";
    case "error":
      return "bg-red-500/95 border-red-400/50 text-white";
    case "info":
    default:
      return "bg-flow-900/95 border-flow-700/60 text-flow-100";
  }
}

function toneIcon(type: ToastKind) {
  if (type === "success") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 3h.01M5.07 19h13.86a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  );
}
