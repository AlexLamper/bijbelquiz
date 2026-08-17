/**
 * Group licence facts that pricing copy needs.
 *
 * Split out of `group-license.ts` because that module imports the Mongoose
 * models: a client component quoting the seat count would otherwise pull the
 * whole database layer into the browser bundle.
 */

/** Seats included in the standard licence. */
export const GROUP_LICENSE_SEATS = 30;

/** Yearly list price, mirrored in the pricing copy. */
export const GROUP_LICENSE_PRICE_LABEL =
  process.env.NEXT_PUBLIC_GROUP_LICENSE_PRICE_LABEL || '€99,00';
