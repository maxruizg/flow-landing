# Stripe Payments Setup Guide

This guide covers how to set up Stripe payments for FLOW URBAN WEAR.

---

## 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete the registration process
3. You'll start in **Test Mode** (toggle in top-right of dashboard)

---

## 2. Get Your API Keys

1. Go to **Developers > API Keys** in the Stripe Dashboard
2. You'll see:
   - **Publishable key** (`pk_test_...`) — used on the client (not needed yet, we use Checkout Sessions)
   - **Secret key** (`sk_test_...`) — used on the server

---

## 3. Set Environment Variables

Add these to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important**: Never commit your `.env` file. It's already in `.gitignore`.

---

## 4. Update the Database

Run this SQL in the Supabase SQL Editor to add the new columns to the `orders` table:

```sql
-- Add stripe_session_id and currency columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'usd';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id text;
```

If you're setting up from scratch, the full schema in `supabase-schema.sql` already includes these columns.

---

## 5. Set Up Webhooks

Stripe sends events (like "payment completed") to your server via webhooks.

### For Local Development (Stripe CLI)

1. Install the Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. Login to your Stripe account:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local dev server:
   ```bash
   stripe listen --forward-to localhost:5173/api/stripe-webhook
   ```

4. The CLI will print a webhook signing secret (`whsec_...`). Copy it to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. Keep this terminal running while developing.

### For Production (Vercel)

1. Go to **Developers > Webhooks** in the Stripe Dashboard
2. Click **Add endpoint**
3. Set the URL to: `https://your-domain.com/api/stripe-webhook`
4. Select the event: `checkout.session.completed`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add it to your Vercel environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 6. How It Works

### Checkout Flow

```
Customer fills shipping form → Clicks "Pay with Stripe"
    ↓
Remix action creates a Stripe Checkout Session (with cart items as line_items)
    ↓
Customer is redirected to Stripe's hosted checkout page
    ↓
Customer enters payment details on Stripe
    ↓
On success → redirected to /checkout/success?session_id=...
    ↓
Stripe sends webhook → our server creates the order in Supabase
```

### Files

| File | Purpose |
|------|---------|
| `app/lib/stripe.server.ts` | Stripe SDK client initialization |
| `app/routes/api.create-checkout.ts` | Creates a Stripe Checkout Session |
| `app/routes/api.stripe-webhook.ts` | Handles Stripe webhook events |
| `app/routes/checkout.tsx` | Checkout page with shipping form |
| `app/routes/checkout.success.tsx` | Post-payment success page |
| `app/data/queries.server.ts` | `createOrder`, `createOrUpdateCustomer`, `getOrderByStripeSession` |

### Currency Handling

- The store supports **USD** and **MXN**
- Currency is determined by the user's locale setting (LocaleContext)
- Products have both `price` (USD) and `priceMxn` (MXN) fields
- The Checkout Session is created with the selected currency
- Stripe handles currency display and formatting on their checkout page

---

## 7. Testing

### Test Card Numbers

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 3220` | Requires 3D Secure |
| `4000 0000 0000 0002` | Declined |

Use any future expiry date (e.g., `12/34`) and any 3-digit CVC.

### Test Checklist

1. Start the dev server: `pnpm dev`
2. In another terminal, start the Stripe webhook listener:
   ```bash
   stripe listen --forward-to localhost:5173/api/stripe-webhook
   ```
3. Add products to cart from `/showroom`
4. Go to `/checkout`
5. Fill in shipping info and click **Pay with Stripe**
6. On the Stripe page, use test card `4242 4242 4242 4242`
7. After payment, verify:
   - You're redirected to `/checkout/success` with order confirmation
   - Cart is cleared
   - Order appears in `/admin/orders`
   - Customer appears in `/admin/customers`
   - Dashboard stats update in `/admin/dashboard`

---

## 8. Going Live

When ready to accept real payments:

1. Complete Stripe account verification in the Dashboard
2. Toggle from **Test Mode** to **Live Mode** in Stripe Dashboard
3. Get your **live** API keys and update environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (from the production webhook endpoint)
   ```
4. Create a new webhook endpoint for your production URL
5. Test with a real card (small amount) to verify end-to-end

---

## 9. Troubleshooting

### "Missing signature" error on webhook
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- For local dev, ensure `stripe listen` is running and you copied the `whsec_` secret

### Checkout session creation fails
- Verify `STRIPE_SECRET_KEY` is set in `.env`
- Check that cart items have valid prices (> 0)
- Stripe requires amounts in cents — the code handles this automatically

### Order not appearing in admin after payment
- Check the Stripe CLI output for webhook delivery errors
- Check your server logs for errors in the webhook handler
- Verify the Supabase `orders` table has the `currency` and `stripe_session_id` columns

### Webhook events in Stripe Dashboard
- Go to **Developers > Events** to see all events
- Go to **Developers > Webhooks > [endpoint]** to see delivery attempts and responses
