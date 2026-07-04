# Proyecto: flow-landing — e-commerce de streetwear FLOW Urban Wear (cliente: Dany Flow / Daniela Flores, CDMX)

Tipo: **Fullstack**. Stack: Remix v2 (Vite) + React 18 + Tailwind v4 + TypeScript; Supabase (Postgres + Storage), Stripe (Payment Intents), Resend + @react-email; desplegado en Vercel. Prod: https://www.flowurbanwear.com.
Gestor/toolchain: **pnpm** (pnpm@10.33.0 — nunca npm/yarn/bun). Estructura: **app única Remix** (no monorepo): `app/` con `routes/`, `components/`, `lib/` (`*.server.ts`), `data/` (queries + scripts de seed), `emails/`; `supabase/migrations/`; `public/`.

## Comandos esenciales
- Instalar deps: `pnpm install`
- Dev (todo): `pnpm dev`  · es una sola app SSR (front y back en el mismo proceso, no hay comando separado)
- Tests: `<TODO — aún no hay tests configurados>`  · un archivo: `<TODO>`
- Lint: `<TODO — sin linter configurado>`  · Formato: `<TODO — sin formatter configurado>`  · Typecheck: `pnpm typecheck`
- Build: `pnpm build`  · validar bundle de prod: `pnpm build && pnpm start`
SIEMPRE corre `pnpm typecheck` (y `pnpm build` en cambios no triviales) antes de declarar algo listo, y muestra la salida real.

## Definición de "terminado" (NO declarar listo sin esto)
- Pasan typecheck + build, con su salida real (no afirmaciones). Cero warnings nuevos.
- Contrato front↔back consistente: los tipos en `app/lib/types.ts` y lo que devuelven loaders/actions coinciden con lo que consume la UI.
- UI verificada con evidencia (preview) para cambios visuales. Migraciones idempotentes y reversibles; nunca correr DDL contra la BD en vivo desde aquí — solo escribir el `.sql` en `supabase/migrations/`.
- Cambio pequeño, revisable, en su propio commit.

## Flujo de trabajo
- Cambios no triviales: primero **plan** (plan mode), espera aprobación, luego implementa.
- Cambios que cruzan front y back: define el contrato (tipos en `app/lib/types.ts`, forma del loader/action) primero, luego ambos lados.
- Imita el patrón existente; ejemplos a seguir: front `app/routes/product.$slug.tsx` (loader + meta + UI), back `app/lib/orders.server.ts` (lógica de servidor con Stripe/Supabase).
- Lee `.claude/napkin.md` al empezar — es el runbook curado del repo. Cambios atómicos; si fallas 2 veces igual, para y replantea.

## Convenciones de código
- TypeScript estricto; evita `any` (usa `unknown` + narrowing). Alias de imports: `~/` → `app/`.
- Server-only en archivos `*.server.ts`; NUNCA importes secretos ni el cliente de servicio de Supabase/Stripe en código que llega al navegador.
- Remix v2 (NO Next.js): loaders/actions, `useLoaderData`, convenciones de archivos en `app/routes/`. Ignora sugerencias de `"use client"`/RSC — no aplican.
- Tailwind v4 (CSS-first: `@theme`, `@tailwindcss/vite`); no uses patrones de config v3.
- Emails con @react-email + `app/emails/theme.ts`; imágenes de Supabase vía `emailImageUrl()` (URLs absolutas). Sin `console.log` en commits; constantes nombradas, sin valores mágicos.

## Arquitectura
- App Remix única: la UI (SSR) y el "backend" (loaders/actions + rutas de recurso `app/routes/api.*`) viven juntos. Cron de Vercel + GitHub Actions golpean `/api/run-scheduled-campaigns` (protegido con `CRON_SECRET`).
- Límites: la UI consume datos por loaders; el acceso a datos vive en `app/data/queries.server.ts` y `app/lib/*.server.ts`. Nada de credenciales de servidor en el bundle del cliente.
- Datos: Supabase Postgres. Migraciones en `supabase/migrations/` (fecha-nombre.sql, idempotentes). **RLS activo**: el navegador (anon) solo lee catálogo público; el servidor usa `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS). Sesión admin por cookie firmada (`app/lib/session.server.ts`, requiere `SESSION_SECRET`).
- Decisiones no obvias: precios y stock se calculan/validan SIEMPRE en el servidor desde la BD (nunca se confía en el precio del cliente); órdenes son idempotentes por `stripe_session_id` (índice único). Assets de seed en `seed-assets/` (fuera de `public/`).

## Testing
- <TODO — el repo aún no tiene tests>. Al agregarlos: comportamiento visible, no implementación; E2E de checkout/pago con Playwright; para un bug, test rojo → fix → verde; deterministas (sin red/reloj real).

## Seguridad
- Nunca leas, muestres ni commitees secretos: `.env` (ya en `.gitignore`), claves, tokens.
- Valida input en cliente Y servidor. Queries Supabase parametrizadas (`.eq()`), nada de concatenar SQL. Verifica firma del webhook de Stripe en el servidor.
- No expongas claves de servidor en el bundle. authZ (`requireAdmin`) en cada ruta admin y endpoint de mutación. Mínimo privilegio (service_role solo en servidor).
- No añadas dependencias sin justificarlo.

## Git y entrega
- Rama por feature; PRs pequeños. Conventional Commits. Cierra los mensajes con la línea `Co-Authored-By` acordada.
- **El usuario hace `git push` él mismo**: entrégale el comando, no pushees a `main` ni pidas permiso de push. No commitees con typecheck/build en rojo.

## Límites (qué NO hacer)
- No `rm -rf`, `sudo`, ni correr SQL/DDL destructivo contra la BD de prod. No borres datos de prod sin confirmar.
- No reformatees archivos no relacionados. Un cambio = un propósito.
- No introduzcas breaking changes en tipos compartidos o en la forma de loaders/actions sin avisar a ambos lados.

## Contexto del entorno (gotchas)
- Vars obligatorias (Vercel env + `.env` local): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SESSION_SECRET`, `CRON_SECRET`, `GA_MEASUREMENT_ID`. Opcional: `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`.
- Node >= 20 (Vercel usa 24.x). Dev server Remix+Vite en `pnpm dev`. Plan de Vercel: Pro.
- Las migraciones se corren a mano en el SQL Editor de Supabase (no hay CLI de migración cableada). Cron de campañas: diario en `vercel.json` + horario vía `.github/workflows/campaign-cron.yml`.
