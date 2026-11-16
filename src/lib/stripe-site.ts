import type Stripe from 'stripe';

/**
 * One Stripe account serves BijbelQuiz (NL) and every Bible Quizzes language
 * site, and every webhook endpoint receives every event of the account. Intl
 * checkouts carry `metadata.site` (`biblequizzes-en`, `biblequizzes-de`, ...)
 * on the session, the subscription, the payment intent and the customer, and
 * each site only processes events that are its own. Without that, a purchase on
 * one site could reach an account with the same e-mail address on another
 * (the webhooks fall back to matching by e-mail).
 *
 * NL has no tag, so NL checkouts are created exactly as before; NL ignores any
 * tagged event.
 */
export function stripeSiteTag(): string | null {
  // Read straight from the env (not src/config/site.ts) so this file is the
  // same on main, where the NL webhook needs it before the i18n work lands.
  if (process.env.SITE !== 'intl') return null;
  return `biblequizzes-${process.env.SITE_LOCALE || 'en'}`;
}

/** The site tag on the object of an event, or null when it has none. */
export function eventSiteTag(event: Pick<Stripe.Event, 'type' | 'data'>): string | null {
  const object = event.data.object as {
    metadata?: Record<string, string> | null;
    subscription_details?: { metadata?: Record<string, string> | null } | null;
    parent?: { subscription_details?: { metadata?: Record<string, string> | null } | null } | null;
  };
  return (
    object.metadata?.site ??
    object.parent?.subscription_details?.metadata?.site ??
    object.subscription_details?.metadata?.site ??
    null
  );
}

/**
 * Whether this site should process the event. Only checkout sessions,
 * subscriptions and invoices are filtered: those are the events that find an
 * account (possibly by e-mail). Charge refunds and disputes are looked up by
 * their payment intent in the site's own database, so another site's charge is
 * a no-op there anyway.
 */
export function eventBelongsToSite(event: Pick<Stripe.Event, 'type' | 'data'>, ownTag: string | null): boolean {
  const filtered =
    event.type.startsWith('checkout.session.') ||
    event.type.startsWith('customer.subscription.') ||
    event.type.startsWith('invoice.');
  if (!filtered) return true;
  return eventSiteTag(event) === ownTag;
}
