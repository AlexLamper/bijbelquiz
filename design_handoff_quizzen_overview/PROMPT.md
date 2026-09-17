# Prompt for the BijbelQuiz coding agent

Copy everything below the line into your AI coding tool (Claude Code, Cursor, etc.) after placing the `design_handoff_quizzen_overview/` folder in the repo root.

---

Rebuild the `/quizzen` page of this project (BijbelQuiz) to match the design in `design_handoff_quizzen_overview/` exactly, for desktop and mobile.

Start by reading, in this order:
1. `design_handoff_quizzen_overview/README.md` — the full spec: tokens, layout, every component with exact sizes/colours/copy, states, interactions, state model.
2. `design_handoff_quizzen_overview/reference-desktop-mobile.html` — open it in a browser; it is the visual reference (desktop column at 1280px, mobile column at 402px). Read its source for exact inline styles when the README leaves any doubt.
3. `design_handoff_quizzen_overview/bible-structure.json` — the 66 books, chapter counts, testament and genre, in canonical order.

Then explore this codebase before writing code: find the current `/quizzen` route, how quizzes are stored and fetched (each quiz = one Bible chapter; there are also theme quizzes), how user progress/scores are stored, the existing fonts, colour variables, search input, buttons and card components, and the routing convention for a single quiz. Reuse existing components and data hooks wherever they already do the job; match the spec's visuals on top of them.

Rules:
- The HTML in the handoff is a design reference, not code to paste. Implement it with this project's framework, styling approach and component patterns.
- Reproduce the layout, spacing, type sizes, colours and states pixel-precisely as specified. Do not add elements that are not in the design (no hero images, extra stats, badges, level filters or "recommended" sections). Do not change copy; all text is Dutch and given verbatim in the README.
- Replace the demo numbers with real data: which chapters have a quiz, and which chapters the signed-in user has played (and score). Signed-out users see no played state.
- Every book of the Bible appears, including books that have no quizzes yet (tile at 50% opacity, not clickable). Every chapter appears in the chapter panel, including chapters without a quiz (dashed cell, not clickable).
- Selecting a book updates the URL so a book can be deep-linked and the browser back button closes the panel. Selecting an available chapter navigates to that chapter's existing quiz route.
- Desktop: two-column body with the sticky genre index (200px) and 5-column tile grid. Mobile (< 768px): single column, horizontally scrolling genre chips, 2-column tile grid, 44px chapter cells. Nothing except the chips row may scroll horizontally.
- The "Thema's" tab shows the existing theme quizzes with the current theme quiz cards; only the "Bijbelboeken" tab is redesigned here.
- Accessibility: tiles, chapter cells, chips and index items are real buttons/links with visible focus rings (2px #8a92c8), keyboard operable, Escape closes the panel. Respect prefers-reduced-motion.
- Do not use scrollIntoView; use window.scrollTo with smooth behaviour when scrolling to a genre or panel.

When done: run the app, load `/quizzen` at 1280px and at 390px wide, compare against the reference HTML side by side, and fix any difference in spacing, sizes, colours, copy or states before reporting back. List anything from the spec you could not implement and why.
