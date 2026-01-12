# 💳 Stripe Sandbox Debugging Guide

If your account is not updating to Premium after a test payment, follow these steps to debug.

## 1. Check your Terminal Logs
I have added detailed logging to the webhook handler. Look for these messages in your terminal where `npm run dev` is running:

- `[Stripe Webhook] Received event: checkout.session.completed` -> Meaning Stripe successfully reached your machine.
- `[Stripe Webhook] Signature verification failed` -> Meaning your `STRIPE_WEBHOOK_SECRET` in `.env.local` is wrong.
- `[Stripe Webhook] Processing checkout for User: ...` -> Meaning the database update is starting.

## 2. Verify Webhook Forwarding (Localhost)
Since you are on localhost, Stripe cannot send messages directly to your computer without a tunnel.

1. Install Stripe CLI if you haven't.
2. Run this command in a separate terminal:
   ```powershell
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   ```
3. Copy the **Signing Secret** (starts with `whsec_...`) printed in the terminal.
4. Update your `.env.local` file:
   ```dotenv
   STRIPE_WEBHOOK_SECRET=whsec_...your_copied_secret...
   ```
5. **Restart your Next.js server** (`npm run dev`) to pick up the new secret.

## 3. Test the Payment Again
1. Go to the Premium page.
2. Click "Buy".
3. Use a Stripe Test Card (e.g., `4242 4242 4242 4242`, any future date, any CVC).
4. After payment, wait for the redirect.
5. Check your `npm run dev` terminal for the "Success" logs.

## Common Issues
- **Wrong Secret:** If the `stripe listen` secret doesn't match `.env.local`, the webhook will fail with "Signature verification failed".
- **Not Listening:** If `stripe listen` isn't running, your server never hears about the payment.
- **Production Mode:** If you deploy to Vercel, you must add the **Production** Webhook Signing Secret (from the Stripe Dashboard) to Vercel's Environment Variables.
