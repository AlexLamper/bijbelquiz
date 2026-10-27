import { NextRequest, NextResponse } from 'next/server';

import { handleStripeWebhookRequest } from '@/lib/stripe-billing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Stripe webhook. Registered in Stripe as `/api/webhook/stripe` (that route
 * re-exports this one). Signature check, once-only processing per event id and
 * every state change live in `src/lib/stripe-billing.ts`.
 */
export async function POST(req: NextRequest) {
  // The raw body, byte for byte: the signature is computed over it.
  const body = await req.text();
  const result = await handleStripeWebhookRequest(body, req.headers.get('stripe-signature'));
  return NextResponse.json(result.body, { status: result.status });
}
