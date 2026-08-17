/**
 * GET /api/mobile/recommended - the app's door to the same recommendation list
 * the website renders.
 *
 * A thin alias rather than a second implementation: the ranking lives in
 * `quiz-recommendations`, and the shared route already accepts the Flutter
 * bearer token through `getSession`. Two rankings would drift, and a reader
 * whose phone and laptop disagree about what to study next stops trusting both.
 */
export { GET } from '@/app/api/quizzes/recommended/route';
export const dynamic = 'force-dynamic';
