# Handoff: /quizzen overview — “Doorlopend” layout

## Overview
Redesign of the `/quizzen` page of BijbelQuiz. Every quiz is one Bible chapter, so the page uses the Bible's own structure as navigation: **testament → genre → book → chapter**. All 66 books sit on one continuous page (Genesis → Openbaring), grouped in 8 genre rows of compact book tiles. Clicking a book tile unfolds a numbered chapter grid directly under its genre row; clicking a chapter opens that quiz. A sticky genre index (desktop) or a horizontal row of genre chips (mobile) jumps to a genre.

Copy is Dutch throughout. Colours, type and the card anatomy match the existing BijbelQuiz site; only the layout is new.

## About the design files
The files in this folder are **design references written in HTML**. They show the intended look and behaviour; they are not production code to paste in. Recreate them in the BijbelQuiz codebase using its existing framework, components, routing and data layer. Where the codebase already has a search field, segmented control, button or card style that matches, reuse it instead of re-styling.

## Fidelity
**High-fidelity.** Recreate pixel-precise: exact colours, type sizes, spacing and states listed below. The only placeholders are the numbers (quiz counts, played counts) — those come from real data.

## Files in this folder
- `README.md` — this spec (self-sufficient).
- `PROMPT.md` — paste-ready instruction for an AI coding agent.
- `reference-desktop-mobile.html` — static reference of both views, opens in any browser. Desktop column is 1280 px, mobile column is 402 px.
- `bible-structure.json` — the 66 books with chapter counts, testament and genre (Dutch names), in canonical order. Use as seed/reference; quiz availability and progress must come from the app's database.

---

## Design tokens

### Colours
| Token | Hex | Use |
|---|---|---|
| page | `#f5f3ee` | page background |
| surface | `#ffffff` | tiles, search, segmented control, chapter panel |
| ink | `#1c1c1c` | primary text, active states, “played” fill, buttons |
| ink-soft | `#5f5c55` | body/lead text |
| muted | `#6d6a63` | eyebrows, labels, secondary text, legend |
| faint | `#8a877f` | placeholder text, chapter counts, index counts |
| disabled-text | `#b3b0a8` | numbers in not-yet-available chapter cells |
| border | `#e2dfd7` | dividers, resting tile border |
| border-input | `#dcd9d2` | search/segmented/chip borders, available chapter cell border |
| border-dashed | `#d5d2ca` | dashed border on not-yet-available cells |
| track | `#ece9e2` | progress bar track, “not yet” legend swatch |
| accent | `#8a92c8` | header accent rule, ring around the “next for you” chapter |
| accent-soft | `#c9cde6` | “quiz available” progress fill and legend swatch |

### Typography
Two families. Serif = **Newsreader** (Google Fonts, optical size axis, weight 400). Sans = **Inter** (400 / 500). Fallbacks: `Georgia, serif` and `system-ui, sans-serif`.

| Style | Spec |
|---|---|
| Eyebrow | Inter 500, 11px / 1, letter-spacing .14em, uppercase, `#6d6a63` |
| H1 desktop | Newsreader 400, 40px / 1.15, letter-spacing −.01em, `#1c1c1c` |
| H1 mobile | Newsreader 400, 30px / 1.15, letter-spacing −.01em |
| Lead desktop | Inter 400, 15px / 1.55, `#5f5c55`, max-width 640px |
| Lead mobile | Inter 400, 14px / 1.5, `#5f5c55` |
| Genre heading desktop | Newsreader 400, 22px / 1.2 |
| Genre heading mobile | Newsreader 400, 19px / 1.2 |
| Book tile title | Newsreader 400, 17px / 1.2 |
| Tile meta | Inter 400, 12px, `#6d6a63` (label) / `#8a877f` (chapter count) |
| Panel title desktop | Newsreader 400, 26px / 1.1 |
| Panel title mobile | Newsreader 400, 22px / 1.1 |
| Chapter cell desktop | Inter 500, 13px |
| Chapter cell mobile | Inter 500, 14px |
| Index item | Inter 400 (active 500), 13.5px; count Inter 400 11.5px `#8a877f` |
| Controls (search text, segmented, chips) | Inter 400/500, 13.5–14px |
| Legend | Inter 400, 12px, `#6d6a63` |

### Radii, spacing, misc
- Radius: 8px tiles & panel, 6px controls & mobile chapter cells, 5px desktop chapter cells, 4px segmented inner pill, 18px chips (pill), 2px progress bars and legend swatches.
- Progress bar: 3px tall, track `#ece9e2`, two overlaid fills: `#c9cde6` = % chapters with a quiz, `#1c1c1c` = % chapters played (drawn on top).
- No shadows anywhere except the 2px accent ring on the “next” chapter cell (`box-shadow: 0 0 0 2px #8a92c8`).
- Desktop page padding: 48px top, 56px sides, 64px bottom. Content max-width 1168px (1280 − 2×56); centre it on wider screens.
- Mobile page padding: 16px sides.

---

## Screen 1 — Desktop (≥ 1024px)

Vertical order, top to bottom:

### 1. Header
- Row, `justify-content: space-between`, `align-items: center`:
  - Left: 24×2px accent rule `#8a92c8` + eyebrow **“Quizbibliotheek”** (gap 10px).
  - Right: eyebrow **“{n} quizzen · 66 boeken · 1.189 hoofdstukken”** — `{n}` = total chapters that currently have a quiz.
- H1 **“Ontdek en speel Bijbelquizzen”**, margin 22px 0 12px.
- Lead **“Alle 66 boeken op één pagina, van Genesis tot Openbaring. Spring via de index naar een genre.”**
- 1px divider `#e2dfd7`, margin 32px 0 24px.

### 2. Controls row
Flex row, gap 12px, `align-items: center`.
- **Search** (flex: 1): 42px tall, white, 1px `#dcd9d2`, radius 6, padding 0 14px; 16px magnifier icon (stroke `#6d6a63`, 1.5) + placeholder **“Zoek een boek of hoofdstuk, bijv. Johannes 3”** in `#8a877f` 14px.
- **Segmented control**: white, 1px `#dcd9d2`, radius 6, padding 3px, gap 2px; two options **“Bijbelboeken”** (active: `#1c1c1c` bg, white text) and **“Thema's”** (inactive: transparent, `#1c1c1c` text); each 8px 16px padding, radius 4, 13.5px 500.

### 3. Body grid
`display: grid; grid-template-columns: 200px minmax(0,1fr); gap: 48px; margin-top: 36px; align-items: start`.

#### 3a. Sticky genre index (left column)
`position: sticky; top: 24px`. Column, gap 2px.
- Eyebrow **“Oude Testament”**, padding 0 0 10px 14px.
- 5 OT genre items, then eyebrow **“Nieuwe Testament”** (padding 22px 0 10px 14px), then 3 NT genre items.
- Item: flex row, `space-between`, height 34px, padding 0 6px 0 12px, 13.5px, **2px left border**. Left = genre name; right = number of quizzes available in that genre (11.5px `#8a877f`; show “–” when zero).
  - Resting: border `#e2dfd7`, text `#6d6a63`, weight 400.
  - Active (genre currently in view / last clicked): border `#1c1c1c`, text `#1c1c1c`, weight 500.
- Legend below: margin-top 26px, padding 16px 0 0 14px, 1px top border `#e2dfd7`, column gap 8px, 12px `#6d6a63`. Three rows with 10×10 radius-2 swatches: `#1c1c1c` **Gespeeld**, `#c9cde6` **Quiz beschikbaar**, `#ece9e2` **Nog niet beschikbaar**.

#### 3b. Genre rows (right column)
For each of the 8 genres in order (see data), a block with `margin-bottom: 40px` and an anchor id (e.g. `#wet`, `#geschiedenis`, …) the index links to:
- **Heading row**: flex, gap 14px, `align-items: center`: genre name (22px serif) · eyebrow **“{Oude|Nieuwe} Testament · {n} boeken”** · flex-1 1px line `#e2dfd7`.
- **Tile grid**: `grid-template-columns: repeat(5, minmax(0,1fr)); gap: 10px; margin-top: 14px`.
- **Book tile** (button/link): white, radius 8, padding 14px 14px 12px, column, gap 8px, min-height 96px, 1px border.
  - Row 1: book name (17px serif) left, chapter count right (12px `#8a877f`, nowrap) — just the number, e.g. “50”.
  - Row 2 (`margin-top: auto`): availability label 12px `#6d6a63`:
    - 0 quizzes → **“Nog geen quizzen”**
    - all chapters → **“{n} quizzen”** (or **“1 quiz”** for single-chapter books)
    - some → **“{avail} van {chapters} quizzen”**
    - append **“ · {played} gespeeld”** when the signed-in user has played ≥1 chapter.
  - Row 3: 3px progress bar as described in tokens.
  - States: resting border `#e2dfd7`; **selected** (its chapter panel is open) border `#1c1c1c`; **no quizzes yet** → whole tile `opacity: .5` and not clickable (or clickable to a “coming soon” panel — your call, but make it visibly inert). Hover: border `#1c1c1c` is sufficient; no shadow, no lift.
- **Chapter panel** (only under the genre whose book is selected; one open at a time): `margin-top: 12px`, white, **1px border `#1c1c1c`**, radius 8, padding 24px 26px 26px.
  - Header: flex, baseline, gap 14px: book name (26px serif) · eyebrow **“{chapters} hoofdstukken · {avail} quizzen”** · **“Sluiten ×”** pushed right (`margin-left: auto`, 13px `#6d6a63`).
  - Grid: `display: flex; flex-wrap: wrap; gap: 5px; margin-top: 18px` of **36×36px cells**, radius 5, 13px 500, `box-sizing: border-box`, one per chapter, numbered 1…n. Cells wrap naturally (Psalmen = 150 cells).
  - Cell states:
    - **Played**: bg `#1c1c1c`, text `#fff`, border `1px solid #1c1c1c`.
    - **Available, not played**: bg `#fff`, text `#1c1c1c`, border `1px solid #dcd9d2`.
    - **Not yet available**: bg transparent, text `#b3b0a8`, border `1px dashed #d5d2ca`, not clickable.
    - **Next for you** (first available chapter after the last played one; chapter 1 when nothing played): available style + `box-shadow: 0 0 0 2px #8a92c8`.
  - Clicking an available cell navigates to that chapter's quiz.

## Screen 2 — Mobile (< 768px; designed at 402px)

Single column, page padding 16px, same tokens.
1. Accent rule 18×2px + eyebrow **“Quizbibliotheek”**.
2. H1 (30px) **“Ontdek en speel Bijbelquizzen”**, margin 14px 0 8px.
3. Lead 14px **“{n} quizzen · 66 boeken · 1.189 hoofdstukken”**.
4. Search: 44px tall (touch target), margin-top 20px, placeholder **“Zoek boek of hoofdstuk”**.
5. Segmented control full width, margin-top 10px; the two options are `flex: 1`, centred, padding 9px 0.
6. **Genre chips row**: margin-top 20px, horizontal scroll (`overflow-x: auto`, hide scrollbar), flex gap 8px, right-edge fade 48px (`linear-gradient(90deg, rgba(245,243,238,0), #f5f3ee)`) overlayed. Chip: height 36px, padding 0 14px, radius 18px, 1px `#dcd9d2`, 13.5px 500, nowrap. Active chip: bg `#1c1c1c`, white text; others white bg, `#1c1c1c` text. All 8 genres in order. Tapping a chip scrolls to that genre; the active chip follows scroll position. Make this row sticky under the top bar if the app has one.
7. **Genre blocks**, each `margin-top: 28px`: heading row (19px serif name + eyebrow “{Testament} · {n} boeken”, baseline, gap 10px, margin-bottom 12px); **2-column tile grid** (`repeat(2, minmax(0,1fr))`, gap 10px). Tile identical to desktop but min-height 88px.
8. **Chapter panel** (mobile): margin-top 10px, white, 1px `#1c1c1c`, radius 8, padding 16px. Header: book name 22px serif left, “Sluiten ×” 12px `#6d6a63` right. Eyebrow **“{chapters} hoofdstukken · {avail} quizzen”**, margin-top 6px. Cells **44×44px** (touch target), radius 6, 14px 500, flex-wrap gap 6px, margin-top 14px; same four states as desktop.

No horizontal page overflow at 360–430px; the only horizontal scroller is the chips row.

---

## Interactions & behaviour
- **Select book**: click/tap a tile → its chapter panel opens directly under that genre's tile grid; any other open panel closes; the tile gets the `#1c1c1c` border. Update the URL (`?boek=genesis` or `/quizzen/genesis`) so a book can be deep-linked and the back button closes the panel. On open, ensure the panel is scrolled into view without jumping the page (use smooth `window.scrollTo`, not `scrollIntoView`, if the panel would be off-screen).
- **Close**: “Sluiten ×”, tapping the selected tile again, or Escape.
- **Select chapter**: click an available cell → navigate to that chapter's quiz route (existing quiz page).
- **Genre index / chips**: click → smooth scroll to the genre anchor; active state follows the genre currently nearest the top of the viewport (IntersectionObserver).
- **Search**: typing filters books live (match on book name, including abbreviations like “joh”, “1 kor”). A query with a number (“Johannes 3”, “joh 3”, “ps 23”) resolves to that chapter and offers it as the first result; Enter opens it. Results can be shown as a dropdown under the field; the page beneath stays as is.
- **Bijbelboeken / Thema's**: “Bijbelboeken” = this page. “Thema's” shows the existing non-chapter quizzes (Algemeen, Het leven van Jezus, …) — reuse the current theme quiz cards there; this handoff does not redesign that tab.
- **Transitions**: panel open/close may fade+expand over ~180ms ease-out; nothing else animates. Respect `prefers-reduced-motion`.
- **Hover** (desktop): tile border → `#1c1c1c`; available chapter cell border → `#1c1c1c`; index item text → `#1c1c1c`. Cursor pointer on all clickable elements.
- **Focus**: visible 2px `#8a92c8` outline (offset 2px) on tiles, cells, chips, index items and controls.
- **Signed-out users**: no played state anywhere (no dark cells, no dark progress fill, no “· n gespeeld”); the “next for you” ring sits on chapter 1 of the selected book.
- **Loading**: render the header, controls and genre headings immediately; tiles can show a neutral skeleton (white box, `#ece9e2` bars) until counts arrive.
- **Empty / unavailable**: books with zero quizzes keep their tile at 50% opacity so the full structure of the Bible is always visible and users see what is coming. Chapters without a quiz keep their dashed cell.

## State
- `selectedBook: string | null` (slug) — drives the open panel, tile border, URL.
- `activeGenre: string` — drives index/chip highlight; derived from scroll position, or set on click.
- `query: string` — search text; derived `results`.
- `tab: 'boeken' | 'themas'`.
- Data per book: `{ slug, name, testament, genre, chapters, availableChapters: number[], playedChapters: { chapter, score }[] }`. Derived: `avail = availableChapters.length`, `played = playedChapters.length`, `pctAvail`, `pctDone`, `nextChapter`.
- Totals for the header eyebrow: sum of `avail` over all books.

## Data
`bible-structure.json` lists all 66 books in canonical order with `chapters`, `testament` (`OT`/`NT`) and `genre`. Genres and order:

Oude Testament: **Wet** (Genesis–Deuteronomium) · **Geschiedenis** (Jozua–Ester) · **Poëzie & wijsheid** (Job–Hooglied) · **Grote profeten** (Jesaja–Daniël) · **Kleine profeten** (Hosea–Maleachi).
Nieuwe Testament: **Evangeliën & Handelingen** (Matteüs–Handelingen) · **Brieven van Paulus** (Romeinen–Filemon) · **Brieven & Openbaring** (Hebreeën–Openbaring).

Total chapters = 1.189 (OT 929, NT 260). Which chapters have a quiz, and which the user has played, come from the app's own data.

## Assets
- Fonts: Newsreader and Inter from Google Fonts (`https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Inter:wght@400;500;600&display=swap`). If the site already self-hosts these, use those.
- Icons: a single 16px magnifier (SVG in the reference file). No other imagery on this page.
