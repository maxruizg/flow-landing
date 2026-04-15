# Email Marketing System

## Overview

The Flow Urban Wear email marketing system allows administrators to create, preview, schedule, and send branded email campaigns to subscribers. It is built on **React Email** for template rendering and **Resend** for delivery, with campaign data stored in **Supabase**.

Key capabilities:

- Visual email templates built as React components
- Campaign creation with customizable content variables
- Subscriber management with tag-based targeting
- Live preview before sending
- Immediate send or scheduled delivery via Vercel Cron
- Batch sending (50 emails per batch) to avoid rate limits
- Campaign logging with sent/failed counts and error tracking

---

## Architecture

### Database Tables (Supabase)

| Table | Purpose |
|---|---|
| `email_templates` | Template registry — name, `component_name`, `variables_schema` (JSON) |
| `email_campaigns` | Campaign records — subject, preheader, status, `template_id`, `scheduled_at`, `target_tags` |
| `campaign_content` | Saved variable values for each campaign (linked by `campaign_id`) |
| `campaign_images` | Uploaded images per campaign, organized by slot name and sort order |
| `campaign_logs` | Send results — `total_sent`, `total_failed`, timestamps, `error_details` |
| `subscribers` | Email subscribers — email, active flag, tags array, `subscribed_at` |

### Campaign Statuses

`draft` -> `scheduled` -> `sending` -> `sent` | `failed`

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `api/email-preview` | POST | Renders a template with given variables and returns HTML |
| `api/send-campaign` | POST | Immediately sends a campaign (requires admin auth) |
| `api/run-scheduled-campaigns` | GET | Cron endpoint — finds and sends due scheduled campaigns |
| `api/subscribe` | POST | Public endpoint for newsletter subscription |

### Admin Pages

Campaign management is handled through the admin panel routes under `admin.email.*`.

---

## Adding a New Template

### Step 1: Create the React Email Component

Create a new file in `app/emails/`, for example `app/emails/seasonal-sale.tsx`:

```tsx
import {
  Html, Head, Body, Container, Section, Text, Button, Preview,
} from "@react-email/components";

interface SeasonalSaleEmailProps {
  headline: string;
  discount_code: string;
  hero_image: string;
  preview?: string;
}

export function SeasonalSaleEmail({
  headline,
  discount_code,
  hero_image,
  preview,
}: SeasonalSaleEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview || headline}</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "sans-serif" }}>
        <Container>
          {/* ... your email layout ... */}
        </Container>
      </Body>
    </Html>
  );
}

export function getDefaultVariables(): SeasonalSaleEmailProps {
  return {
    headline: "Season Sale",
    discount_code: "SEASON20",
    hero_image: "https://placehold.co/600x300",
  };
}

export default SeasonalSaleEmail;
```

Key requirements:
- Export the component as both a **named export** and a **default export**
- Export a `getDefaultVariables()` function that returns sample data for previews
- Use `@react-email/components` for all HTML elements

### Step 2: Register in Template Maps

Add the component to the `templateMap` in **three** route files:

**`app/routes/api.email-preview.tsx`**
```tsx
import { SeasonalSaleEmail } from "~/emails/seasonal-sale";

const templateMap: Record<string, React.FC<any>> = {
  // ... existing entries
  "seasonal-sale": SeasonalSaleEmail,
};
```

**`app/routes/api.send-campaign.tsx`**
```tsx
import { SeasonalSaleEmail } from "~/emails/seasonal-sale";

const templateMap: Record<string, React.FC<any>> = {
  // ... existing entries
  "seasonal-sale": SeasonalSaleEmail,
};
```

**`app/routes/api.run-scheduled-campaigns.ts`**
```tsx
import SeasonalSaleEmail from "~/emails/seasonal-sale";

const templateMap: Record<string, React.FC<any>> = {
  // ... existing entries
  "seasonal-sale": SeasonalSaleEmail,
};
```

### Step 3: Insert Seed Record

Add a row to the `email_templates` table in Supabase:

```sql
INSERT INTO email_templates (id, name, component_name, variables_schema, created_at)
VALUES (
  'tpl-seasonal-sale',
  'Seasonal Sale',
  'seasonal-sale',
  '{
    "headline": { "type": "text", "label": "Headline", "default": "Season Sale" },
    "discount_code": { "type": "text", "label": "Discount Code", "default": "SEASON20" },
    "hero_image": { "type": "image", "label": "Hero Image", "slot": "hero" }
  }',
  now()
);
```

The `component_name` must match the key used in the `templateMap` objects. The `variables_schema` defines which fields appear in the admin campaign editor.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `RESEND_API_KEY` | Yes | Resend API key for sending emails |
| `RESEND_FROM_EMAIL` | No | Sender address (defaults to `Flow Urban Wear <onboarding@resend.dev>`) |
| `CRON_SECRET` | Yes (production) | Secret used by Vercel Cron to authenticate the scheduler endpoint |
| `SESSION_SECRET` | Yes | Used for admin session cookies |

### Setting `CRON_SECRET`

On Vercel, `CRON_SECRET` is automatically available if you add it through the Vercel dashboard (Settings > Environment Variables). Vercel Cron jobs send this value as an `Authorization: Bearer <CRON_SECRET>` header.

---

## Testing Locally

### Preview an Email

Start the dev server and use the preview API to render any template:

```bash
pnpm dev
```

Then POST to the preview endpoint:

```bash
curl -X POST http://localhost:3000/api/email-preview \
  -H "Content-Type: application/json" \
  -d '{
    "componentName": "new-collection",
    "variables": {
      "hero_title": "Test Collection",
      "hero_subtitle": "Preview subtitle",
      "hero_image": "https://placehold.co/600x400",
      "primary_color": "#000000",
      "products": [],
      "cta_text": "Shop Now"
    }
  }'
```

The response is raw HTML that you can open in a browser.

### Test Send (Admin Required)

Sending a campaign requires admin authentication. Use the admin panel at `/admin/email` to:

1. Create a campaign and select a template
2. Fill in the content variables
3. Click "Send" to dispatch immediately

### Test the Cron Endpoint Locally

Simulate a Vercel Cron request by setting `CRON_SECRET` in your `.env` and calling:

```bash
curl http://localhost:3000/api/run-scheduled-campaigns \
  -H "Authorization: Bearer YOUR_CRON_SECRET_VALUE"
```

This will process any campaigns with `status = 'scheduled'` and `scheduled_at <= now()`.

---

## Scheduling

### How It Works

1. An admin creates a campaign and sets `scheduled_at` to a future date/time. The campaign status is set to `scheduled`.
2. A **Vercel Cron Job** hits `GET /api/run-scheduled-campaigns` every 5 minutes (configured in `vercel.json`).
3. The cron handler:
   - Authenticates via `Authorization: Bearer CRON_SECRET`
   - Queries for campaigns where `status = 'scheduled'` AND `scheduled_at <= now()`
   - For each due campaign:
     - Sets status to `sending` (prevents double-send if the cron fires again)
     - Loads the template and content variables
     - Fetches subscribers (filtered by tags if set)
     - Renders the email HTML
     - Sends in batches of 50 via Resend
     - Creates a campaign log entry
     - Updates status to `sent` (or `failed` on error)
4. The endpoint returns a JSON summary of all processed campaigns.

### Cron Configuration

In `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/run-scheduled-campaigns",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This means campaigns may be sent up to 5 minutes after their `scheduled_at` time.

### Vercel Plan Requirements

- **Hobby plan**: Supports up to 2 cron jobs, minimum interval of 1 day.
- **Pro plan**: Supports up to 40 cron jobs, minimum interval of 1 minute. The 5-minute interval used here requires the Pro plan.

---

## Troubleshooting

### Campaign stuck in "sending" status

This can happen if the cron handler or manual send crashes mid-execution. Manually update the campaign status in Supabase:

```sql
UPDATE email_campaigns SET status = 'draft' WHERE id = 'camp-xxx';
```

Then retry sending.

### Cron endpoint returns 401 Unauthorized

- Verify `CRON_SECRET` is set in your Vercel environment variables.
- Ensure the environment variable is available in the **Production** environment (and Preview if testing there).
- Vercel automatically sends the `Authorization: Bearer` header for cron requests only if `CRON_SECRET` is configured.

### Emails not being delivered

1. Check that `RESEND_API_KEY` is set and valid.
2. Check the `campaign_logs` table for error details.
3. Verify your sending domain is verified in the Resend dashboard.
4. If using the default `onboarding@resend.dev` sender, emails will only be delivered to the email address associated with your Resend account.

### Template not found error

Ensure the `component_name` in the `email_templates` database row matches a key in the `templateMap` object in all three API route files (`api.email-preview.tsx`, `api.send-campaign.tsx`, `api.run-scheduled-campaigns.ts`).

### No subscribers match the campaign target

- Check that subscribers exist in the `subscribers` table with `active = true`.
- If the campaign has `target_tags` set, ensure at least one subscriber has overlapping tags.
- Tags are matched using PostgreSQL's `&&` (overlap) operator, so a subscriber needs at least one matching tag.

### Preview renders but send fails

- The preview endpoint does not require authentication or Resend credentials.
- The send endpoint requires both admin auth and a valid `RESEND_API_KEY`.
- Check server logs for the specific error message.
