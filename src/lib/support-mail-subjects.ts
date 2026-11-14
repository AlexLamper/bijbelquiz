import { tList } from '@/i18n';

/**
 * The "Onderwerp" options of the contact form, in the order of the design.
 * Its own module (no server imports) so the client form can use the list.
 */
export const CONTACT_SUBJECTS = tList('mail.subjects') as unknown as readonly [string, ...string[]];

export type ContactSubject = string;
