# Quiz generation plan for de, fr, pt (and es)

Same library rules as the Dutch and English quizzes (10 or 15 questions, 4 answers,
exactly 1 correct, spread over A-D, explanation and Bible reference on every
question, 3+ questions on one chapter). This plan adds what makes every claim
**checkable against the real text** and therefore never silently wrong.

## One text per language, no mixing

| Language | Folder | Bible text (BijbelAPI `version`) | Status |
|---|---|---|---|
| en | docs/quizzes-en | World English Bible (`web`) | ready |
| de | docs/quizzes-de | Lutherbibel 1912 (`luth1912`) | ready |
| fr | docs/quizzes-fr | Louis Segond 1910 (`lsg1910`) | ready |
| pt | docs/quizzes-pt | Biblia Livre (`blivre`, CC BY 4.0) | ready |
| es | docs/quizzes-es | none verified yet | BLOCKED: no quiz may be written or imported until a public-domain Spanish text (Reina-Valera 1909) is verified and added |

A question may only claim what its cited verses say in that language's text.
Quote that text, never another translation. Names follow that text too (Luther:
"Jesaja", "Nebukadnezar"; Segond: "Esaie"/"Ésaïe" as in the file; check the verse).

## Gates (a quiz moves on only if the gate passes)

1. **Write** `docs/quizzes-<lang>/<slug>.json`, `status: "draft"`. Title patterns:
   de `<Buch> Bibelquiz - Kapitel <n>`, fr `<Livre> Quiz biblique - Chapitre <n>`,
   pt `<Livro> Quiz bíblico - Capítulo <n>`. Slug `<book-slug>-quiz-part-<n>` with the
   English book slug (`john`, `1-samuel`); the slug never changes after import.
   The book in a title and in every `bibleReference` must be the canonical title of
   the language (`src/lib/book-names-intl.ts`), for example `1. Mose`, `Ésaïe`, `Mateus`.
2. **Mechanical check, offline, strict** (must print 0 errors; warnings are fixed too):
   `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=<xx> --all --bible-dir=<bijbelapi-data>/data`
   - every reference parses with a canonical book title and **every cited verse exists
     in the language's own text**
   - structure, 1 correct answer, spread, no duplicates, length tell, explanation present
3. **Verification sheet** read line by line by someone who did not write the quiz
   (a second pass, human or a separate review run):
   `SITE=intl node --import tsx scripts/quiz-verify-sheet.mts --lang=<xx> --bible-dir=<bijbelapi-data>/data`
   For each question the reviewer confirms, against the printed verse text:
   a. the marked answer is stated or directly implied by the cited verses,
   b. no other answer is also correct in that text,
   c. the explanation says nothing the text does not support,
   d. the question names no fact from outside the cited verses.
   Any failure: fix the whole batch's pattern, rerun gates 2 and 3.
4. **Native-language check**: 3 quizzes per batch (more for the first batch) are read
   for grammar and wording by a native speaker or the owner. Machine checks cannot do this.
5. Set `status: "approved"` only after 2-4 pass. Never before.
6. Import with `scripts/seed-categories-en.mts --lang=<xx> --apply`, then
   `scripts/import-quiz-json.mts --lang=<xx> <files> --apply` (dry run first), against the
   language's own database. The scripts refuse the NL database and refuse `es`.

## Rules for writing (to avoid the usual mistakes)

- Ask only what the cited verse states. No "how many ..." unless the number is in the verse.
- Distractors must be plainly wrong in the same text, never "also true" (check gate 3b).
- No question about translation wording; no question whose answer differs between
  Bible versions.
- Keep names, numbers and places exactly as the language's text spells them.
- Plain hyphen only, UTF-8, no emoji.
- Premium/free: first chapter of every book and best-known stories free; decide per batch.
