/**
 * The "Onderwerp" options of the contact form, in the order of the design.
 * Its own module (no server imports) so the client form can use the list.
 */
export const CONTACT_SUBJECTS = [
  'Mijn account en inloggen',
  'Premium en betalen',
  'Groepslicentie',
  'Duels en samen spelen',
  'Een fout in een vraag',
  'Iets anders',
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];
