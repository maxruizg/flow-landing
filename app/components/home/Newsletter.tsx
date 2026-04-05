import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { motion } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { cn } from "~/lib/utils";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const fetcher = useFetcher<{ success: boolean; error?: string }>();

  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success === true;
  const error = fetcher.data?.success === false ? fetcher.data.error : null;

  return (
    <section className="bg-flow-black py-20 md:py-28 border-t border-flow-900">
      <Container className="max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
            Stay in the Flow
          </h2>
          <p className="text-sm text-flow-500 mb-8">
            Early access to drops, exclusives, and 10% off your first order.
          </p>

          {isSuccess ? (
            <motion.p
              className="text-sm text-accent-400 font-medium"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Welcome to the Flow. Check your inbox.
            </motion.p>
          ) : (
            <fetcher.Form method="post" action="/api/subscribe" className="flex gap-0">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "flex-1 bg-flow-900 border border-flow-700 px-4 py-3 text-sm text-white placeholder:text-flow-600",
                  "focus:outline-none focus:border-flow-400 transition-colors"
                )}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-white text-flow-black px-6 py-3 text-xs uppercase tracking-[0.2em] font-display font-medium hover:bg-flow-200 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : "Subscribe"}
              </button>
            </fetcher.Form>
          )}

          {error && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
