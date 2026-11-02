import { redirect } from 'next/navigation';

/**
 * Duels no longer has a page of its own: Samen spelen took its place in the
 * menu, as in the app. Old links (a bookmark, the end of a duel that was
 * already running) land there. Running duels (`/duels/<id>`) and invite links
 * (`/duel/<token>`) still open.
 */
export default function DuelsPage(): never {
  redirect('/samen-spelen');
}
