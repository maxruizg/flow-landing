# Napkin Runbook — flow-landing

## Curation Rules

- Re-prioritize on every read. Keep recurring, high-value notes only.
- Max 10 items per category. Each item includes date + "Do instead".

## Project State (read first)

- **[2026-07-03] Store is LIVE and selling at www.flowurbanwear.com.** Deployed & verified: /admin 200, /showroom loads MXN products, RLS locked down, all Supabase migrations run, all env vars set. Full context in memory `project-flow-landing` and CLAUDE.md.
  Do instead: don't re-audit from scratch — check the "REMAINING go-live" list below and in `PENDIENTES-GO-LIVE.md` (gitignored) before proposing work.
- **[2026-07-03] Remaining go-live = dashboard clicks, NOT code.** Stripe webhook events (charge.refunded + payment_intent.payment_failed) + activate OXXO/MSI; Vercel apex→www 308; Search Console sitemap+reindex; Merchant Center feed; real address in `app/routes/privacidad.tsx` TODO(owner).
  Do instead: guide the user through these; don't try to do them in code.
- **[2026-07-04] Campaign cron fully wired + verified green.** GitHub Actions `.github/workflows/campaign-cron.yml` (hourly `:07` mirror of the Vercel daily cron) now has repo secret `CRON_SECRET` matching production; manual run returns HTTP 200 + `{"success":true,...}`. `CRON_SECRET` set on Vercel Production AND Preview (parity).
  Do instead: if it 401s again, the secret drifted — re-sync per the rotation note in "Shell & Command Reliability".

## Execution & Validation (Highest Priority)

1. **[2026-07-03] Verify before claiming done.**
   Do instead: run `pnpm typecheck` (and `pnpm build` for non-trivial changes); show real output. The Stop hook `.claude/hooks/verify.sh` runs `pnpm typecheck`.
2. **[2026-07-03] Verify emails by RENDERING to HTML, not by reading code.**
   Do instead: write a scratchpad tsx script using `@react-email/render` (the `~` alias resolves under `pnpm tsx`); render templates with realistic props, check for crashes, brand `#b8a490`, and that Supabase images became absolute `/render/image` URLs.
3. **[2026-07-03] No tests/lint scripts exist.**
   Do instead: `pnpm test`/`pnpm lint` error out (red terminal, harmless). Don't rely on them; gate on typecheck + build.

## Shell & Command Reliability

1. **[2026-07-03] pnpm only** (repo uses `pnpm-lock.yaml`).
   Do instead: `pnpm install`, `pnpm add`, `pnpm <script>` — never npm/yarn/bun.
2. **[2026-07-03] Migrations are run BY HAND in Supabase SQL Editor.**
   Do instead: write idempotent `.sql` files in `supabase/migrations/` only; NEVER run DDL against the live DB from here. RLS lockdown migration goes LAST, after service_role env is live.
3. **[2026-07-03] Dev server: `pnpm dev`** (Remix+Vite). Port 5173 may be busy.
   Do instead: for the preview harness use a free port (e.g. 5199 via `--port 5199 --strictPort`); `pnpm build && pnpm start` to validate the prod bundle.
4. **[2026-07-03] Vercel CLI works (`vercel env ls`, `get_project`); the raw API token from auth.json is expired.**
   Do instead: use the `vercel` CLI or the Vercel MCP tools; don't hand-curl the REST API with the local token.
5. **[2026-07-04] Vercel Production/Preview env vars default to SENSITIVE (write-only) — `env pull` omits them and the dashboard won't reveal them.** The PATH `vercel` is the pnpm one at `~/Library/pnpm/vercel` (was 54.14.0, buggy: agent-mode `env add … preview` rejected the "all branches" default). Fixed in **54.20.1** (installed via nvm at `~/.nvm/versions/node/v22.22.0/bin/vercel`); `npm i -g vercel@latest` did NOT update the pnpm one.
   Do instead: use the 54.20.1 binary (or `pnpm add -g vercel@latest`) for `env add … preview`. To sync a secret elsewhere (e.g. GitHub `CRON_SECRET`) you CAN'T read the existing value — ROTATE: `NEW=$(openssl rand -hex 32)`; set the SAME `$NEW` on Vercel prod (`vercel env rm CRON_SECRET production --yes` then `printf %s "$NEW" | vercel env add CRON_SECRET production`) AND the other side (`printf %s "$NEW" | gh secret set CRON_SECRET`), then **redeploy prod** (`vercel redeploy <last-prod-url>`) so functions pick it up. Add `--no-sensitive` at creation if you want it readable later.

## Domain Behavior Guardrails

1. **[2026-07-03] Remix v2, NOT Next.js.**
   Do instead: loaders/actions, `useLoaderData`, `app/routes/` conventions; IGNORE Vercel-plugin "use client"/RSC hook suggestions.
2. **[2026-07-03] Prices/stock server-side only; orders idempotent.**
   Do instead: compute amounts + validate stock from the DB in `api.create-payment-intent.ts`; never trust client price. Keep `stripe_session_id` unique-index idempotency and the atomic stock RPC intact.
3. **[2026-07-03] RLS is ON + service_role.** Any module-scope `throw` 500s the whole app.
   Do instead: server reads via `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS); keep env/secret checks lazy (see `session.server.ts` getSessionStorage pattern), never at module top level.
4. **[2026-07-04] ALL emails share one branded frame: `app/emails/EmailLayout.tsx`.**
   Do instead: every template (7) renders its unique content as `children` inside `<EmailLayout>` — never hand-roll `<Html>/<Head>/<Container>`/header/footer again. Tokens live in `emails/theme.ts`; wrap Supabase `<Img>` with `t.emailImageUrl(url,w)`; derive accent washes with `t.accentAlpha(hex,alpha)` (parse hex via `slice`, NOT a regex match — the security hook false-flags that as child_process). Keep HTML+plainText+replyTo on all send paths; Resend v6 returns `{error}` (never throws) — check it.
5. **[2026-07-04] Admin-editable brand base cascades to EVERY email: `email_settings["email_brand"]`.**
   Do instead: edited at `/admin/email-design` (accent, logo image, **backgroundImage** = hero-band photo, default hero, footer, unsubscribe); read via `getEmailBrand()` (queries.server.ts) and spread into template props by the 4 send paths (`orders.server`, `orders-admin.server`, `abandoned-carts.server`, `campaigns.server`). `backgroundImage` renders a full-bleed hero band (gradient overlay + logo) in EmailLayout — works in Gmail/Apple Mail, Outlook desktop falls back to the dark `backgroundColor` (no VML). Seeded default = site SS26 collection hero. Empty fields → `undefined` → theme fallback, so nothing breaks unset. Campaigns: brand seeds `primary_color/urgency_color/accent_color` + logo/footer, but `campaign_content.variables` win on top. `email_settings` table migration: `supabase/migrations/2026-07-04-email-settings-table.sql` (idempotent; table already existed in prod). `/admin/email-design` has a LIVE preview (right column: template selector + desktop/mobile toggle) and a **send-test-to-any-email** flow — both render via `renderEmailPreview()` in `app/lib/email-preview.server.tsx` (server-only; keys/labels in the client-safe `app/lib/email-templates.ts`). Preview uses a `useFetcher` posting `intent=preview` with the CURRENT (unsaved) form values.
6. **[2026-07-03] Tailwind v4 (CSS-first).**
   Do instead: `@tailwindcss/vite`, `@theme` in global.css; no v3 `tailwind.config.js` patterns.

## User Directives

1. **[2026-07-03] User runs `git push` himself.**
   Do instead: hand him the exact command; never push to main, never request push permission.
2. **[2026-07-03] Shipping stays DHL-only for now.**
   Do instead: don't build multi-carrier / configurable order-shipped email until the client sends carrier credentials.
3. **[2026-07-03] Can't self-edit `.claude/settings.json` to widen allow rules.**
   Do instead: give the user a copy-paste command (e.g. a Python one-liner) to run themselves.
