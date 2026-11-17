# Quiz agent brief (writer and reviewer)

Repo: /home/claude/bijbelquiz. Bible data: ../bijbelapi-data/data. Never commit, never push,
never touch the Dutch library or any file outside your own batch. Many agents run in parallel:
keep helper scripts ONLY in your own folder `/tmp/q-<lang>-<batch>-<role>` (never /tmp/qgen or another shared path),
and never run a script you did not write. Run all commands from the repo root.

## Languages

| lang | folder | text | title | slug | description starts with |
|---|---|---|---|---|---|
| en | docs/quizzes-en | World English Bible (web) | `<Book> Bible Quiz - Chapter <n>` | `<bookSlug>-bible-quiz-part-<n>` | "Ten questions on <Book> <n>: ..." |
| es | docs/quizzes-es | Reina-Valera 1909 (rv1909) | `<Libro> Quiz bíblico - Capítulo <n>` | `<bookSlug>-quiz-part-<n>` | "Diez preguntas sobre <Libro> <n>: ..." |
| pt | docs/quizzes-pt | Bíblia Livre (blivre) | `<Livro> Quiz bíblico - Capítulo <n>` | `<bookSlug>-quiz-part-<n>` | "Dez perguntas sobre <Livro> <n>: ..." |
| de | docs/quizzes-de | Lutherbibel 1912 (luth1912) | `<Buch> Bibelquiz - Kapitel <n>` | `<bookSlug>-quiz-part-<n>` | "Zehn Fragen zu <Buch> <n>: ..." |
| fr | docs/quizzes-fr | Louis Segond 1910 (lsg1910) | `<Livre> Quiz biblique - Chapitre <n>` | `<bookSlug>-quiz-part-<n>` | "Dix questions sur <Livre> <n> : ..." |

`bookSlug`, `chapter`, `isPremium` come from docs/quiz-manifest.json (entries of your batch).
The book title is the one `print-chapter` prints in its header; use exactly that in the title and in
every `bibleReference` (e.g. "1. Mose 3:6", "Ésaïe 6:8", "Génesis 3:6").

## Writer

For each chapter of your batch:

1. Read the chapter: `node --import tsx scripts/print-chapter.mts --lang=<xx> --book="<en>" --chapter=<n>`.
   This text is your ONLY source. Do not use memory of other translations, commentaries or traditions.
2. Write `docs/quizzes-<xx>/<slug>.json` (format: docs/quizzes-en/genesis-bible-quiz-part-1.json):
   `categorySlug` "old-testament" (Genesis-Malachi) or "new-testament" (Matthew-Revelation),
   `rewardXp` 100, exactly 10 questions, `difficulty` easy/medium/hard (easy for famous stories,
   medium for most chapters, hard for genealogies/laws/obscure prophecy), `isPremium` from the manifest,
   `status` "draft".
3. Every question:
   - asks only what the cited verse(s) of THIS chapter state, in this text; cite 1-3 verses ("Book n:v" or "Book n:v-w");
   - exactly 4 answers, 1 correct; the 3 wrong answers are plausible but plainly wrong in this text
     (never also true, never "partly true", never a different translation's wording);
   - explanation (1-2 sentences) restates what the verse says - no history, Hebrew/Greek, dates,
     theology or cross-references the cited verses do not contain;
   - no "how many" unless the number is written in the verse; no trick questions; no "all of the above".
   - correct answers spread over A-D (2-3 each), never more than 3 in a row, correct answer not
     systematically the longest.
   - cover the whole chapter (beginning, middle, end), 10 different facts, no two questions with the same answer.
   - names, numbers and places spelled exactly as in this text. Psalms/poetry: ask about what the
     lines say (images, requests, who speaks to whom), not about authorship unless the heading says it.
4. Write the questions in natural, modern, correct <language> (not the archaic style of the old text),
   except short exact quotes from the text, which stay verbatim. Plain hyphen only, no emoji.
5. Validate your files only:
   `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=<xx> --bible-dir=../bijbelapi-data/data <your files>`
   Fix until 0 errors and 0 warnings.
6. Then re-read each of your quizzes with the verify sheet
   (`node --import tsx scripts/quiz-verify-sheet.mts --lang=<xx> --bible-dir=../bijbelapi-data/data <files>`)
   and fix anything not literally supported by the printed TEXT lines.

Report: the files written and anything you were unsure about (one line each). If a chapter is too thin
for 10 good questions, still make 10 but only from what the text says; say so in the report.

## Reviewer (independent - you did not write these)

1. Print the verify sheet for the batch files. For EVERY question check against the printed TEXT:
   a. the marked answer is stated or directly implied by the cited verses;
   b. no wrong answer is also correct (or arguably correct) in that text;
   c. the explanation says nothing the cited verses do not support;
   d. the question uses no fact from outside the cited verses;
   e. the reference points at the verses that actually contain the answer;
   f. grammar and wording are natural <language>; names as spelled in the text.
   A speaker or person may be named in a question when this chapter names them anywhere (e.g. Moses in
   Deuteronomy 31, the king in Esther 5); otherwise use the text's own words ("the speaker", "he").
2. Fix every problem in place (rewrite the question if needed). Keep slug, title, isPremium.
3. Re-run the validator on the batch files: 0 errors, 0 warnings.
4. Write `docs/quizzes-<xx>/_reviews/batch-<NNN>.md`: one line per quiz, `OK` or `FIXED: <what>`,
   and the number of questions changed. Do not change `status`.
