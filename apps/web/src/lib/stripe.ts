import Stripe from 'stripe';

// During build time, STRIPE_SECRET_KEY might be undefined. 
// We provide a fallback string to prevent the Stripe constructor from throwing an error.
// The actual key from Vercel Environment Variables will be used at runtime.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build_purposes_only', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export default stripe;
