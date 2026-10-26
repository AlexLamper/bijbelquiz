# BijbelQuiz website 2.0 - build brief (read fully)

You build the approved website redesign into the real Next.js platform. The client (Alex) reviewed every page one by one; the design files are the source of truth, including all the small decisions from the review.

## Where
- Repo: `/home/claude/alexlamper/bijbelquiz` (Next.js 16 App Router, React 19, Tailwind v4, next-auth v4, mongoose, Stripe, nodemailer). Base branch: `redesign/web-2`. Your own task tells you which directory/branch you work in.
- Never push to `main`, never deploy, never touch production data. Commit on your branch only (commit messages end with the two lines below). Do not force-push or rewrite history.
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_018nK3CBEKxkT9hB1CXD3wWu
  ```
- Machine is small (2 CPUs, 7 GB RAM) and shared with other agents. Never run `next build`. Run `npx tsc --noEmit` and eslint on your files a few times, not in a loop. A dev server only briefly for screenshots, on your assigned port, then kill it.

## Design source of truth
- Approved page designs (static HTML, inline CSS = exact sizes, spacing, colors, copy): `docs/web-2/designs/P-*.dc.html`. Open them in a browser (Playwright) or read the markup. 1 CSS px in the design = 1 px on the site. Desktop artboard 1440 wide, content container `max-width: 1200px; padding: 0 32px` (16px on phones). Each file also has `@media (max-width: 700px)` rules in its `<helmet><style>` for phone layout - follow them.
- Screenshots of the final approved versions (desktop 1440 + mobile 390): `docs/web-2/screenshots/P-<Name>-desktop.png` / `-mobile.png`.
- The approved app screens (`project/R-*.dc.html`) share the same components.
- Quiz cover scenes (light-palette silhouette illustrations, 280x158 viewBox): `docs/web-2/quiz-scenes.json` (title -> SVG string). The foundation turns these into a component.

## Page -> route map (W-number = review number)
| W | Design file | Route |
|---|---|---|
| W1 | P-Landing | `/` (logged out) |
| W2 | P-Premium | `/premium` |
| W3 | P-PremiumSucces | `/premium/succes` |
| W4 | P-Groepslicentie | `/groepslicentie` |
| W5 | P-Hulp | `/hulp` |
| W6 | P-Contact | `/contact` |
| W7 | P-Bijbelstudie | `/bijbelstudie` |
| W8 | P-Inloggen | `/inloggen` (+ new `/wachtwoord-vergeten`, `/wachtwoord-herstellen`) |
| W9 | P-Registreren | `/registreren` |
| W10 | P-Profiel | `/profiel` |
| W11 | P-Instellingen | `/instellingen` (`/settings` redirects) |
| W12 | P-AccountVerwijderen | `/account-verwijderen` |
| W13 | P-Juridisch | `/privacybeleid` and `/voorwaarden` (one layout, two tabs) |
| W14 | P-Foutmelding | `not-found.tsx` + `/foutmelding` + error boundary |
| W15 | P-Dashboard | `/dashboard` (home for logged-in users) |
| W16 | P-Quizzen | `/quizzen` |
| W17 | P-QuizDetail | `/bijbelquiz/[slug]` (quiz landing/detail) |
| W18 | P-QuizSpelen | `/quiz/[id]` (player) |
| W19 | P-Beoordeling | `/quiz/[id]/beoordeling` (result + answers) |
| W21 | P-Ranglijst | `/ranglijst` |
| W22 | P-Duels | `/duels` (new) |
| W23 | P-DuelSpelen | `/duel/[token]` landing + `/duels/[id]` play (new) |
| W24 | P-SamenSpelen | `/samen-spelen` |
| W25 | P-SamenLobby | `/samen-spelen/[roomCode]/lobby` |
| W26 | P-SamenSpel | `/samen-spelen/[roomCode]/spel` |
| W27 | P-SamenUitslag | `/samen-spelen/[roomCode]/uitslag` |
| W28-33 | P-Beheer, P-BeheerQuizzen, P-BeheerQuizEditor, P-BeheerStatistieken, P-BeheerBetalingen, P-BeheerFunnel | `/beheer`, `/beheer/quizzen`, `/beheer/quizzen/[id]/bewerken` (+ `aanmaken`), `/beheer/statistieken`, `/beheer/betalingen`, `/beheer/funnel` |
- W20 Quiz maken was REMOVED by the client: delete the `/quizzen/aanmaken` page and every link/button to it (user-made quizzes are not a feature any more; admins still create quizzes in Beheer). The experimental `/quizzen/versie-1..4` pages can go too.

## Decisions from the review (must hold everywhere)
- Free tier (same as the app): 3 different quizzes free (guests too), replays of those stay free. A 4th new quiz opens the locked paywall (Premium page variant without close, title "Mooi gespeeld! Speel verder met Premium"). Explanations are Premium (free players see the Bible reference + a blurred explanation with a Premium button). Reviewing your answers after a quiz is Premium. Duels and Samen spelen are free for everyone (also hosting).
- Premium benefits copy: "Alle quizzen, zo vaak je wilt" / "Uitleg bij elk antwoord" / "Je antwoorden terugkijken na elke quiz".
- Web Premium is sold on the website too (Stripe): Jaarlijks with 7 days free trial, Maandelijks (no trial), lifetime as a small link. Premium belongs to the account, so app and web share it.
- Ranglijst tabs: "Deze maand" (server = rolling 30 days) and "Altijd"; subtitle "XP van de afgelopen 30 dagen"; groups in the side card.
- Duel scoreboard on the play page shows only avatars, names, score and "Ronde X van 3 · vraag Y" (no per-question boxes).
- Result page: all answers collapsed (click to open explanation), big "Volgende quiz" button under the score card.
- Use plain hyphen "-" in all copy, never long dashes. Dutch copy exactly as in the designs. No invented stats, reviews or user counts in production code: use real data; if data is missing, hide the element.

## Client taste (strict)
Professional, simple, like a well-known product. Background `#ECEAE4`; content in white cards with `1px solid #DEDBD3`, radius 16. No tinted cards on the background. Accent colors only as small touches. Buttons have a 3px darker bottom edge. No badges/labels/counters that the design does not have.

## Code rules
- Keep every real feature of the current page (API calls, auth checks, analytics events, SEO metadata, structured data, sitemaps, redirects, edge cases). You restyle and restructure; you do not drop features unless this brief says so. If the design has no place for an existing feature, put it in the most sensible spot and report it.
- Use the shared foundation components (`src/components/bq/`) and theme tokens; do not hard-code hex colors in pages. Do not edit foundation files - if you need a change there, report it (exact change) in your final reply, or put a page-specific component in your own folder.
- Server components where possible; client components only where needed. Accessible: labels, focus states, aria on icon buttons, tap targets >= 44px, keyboard navigable.
- Responsive: must match the phone design at 390 wide with no horizontal scroll.
- Tests: `npm test` must keep passing; add focused tests for new server logic.

## Final reply (short)
Files/routes changed, features moved or dropped and why, anything you could not finish, changes you need in foundation files, commit hash.
