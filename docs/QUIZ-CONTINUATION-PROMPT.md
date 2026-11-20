# Continue the quiz generation (handover)

Everything a new session needs to carry on making the Bible Quizzes quiz libraries.
Read this whole file first, then start at "What to do now".

## The goal

biblequizzes.app must have, in each of its five languages, the same library the Dutch
site has: **one quiz per Bible chapter, 1121 chapters, 10 questions each**, written from
that language's own Bible text and checked twice.

| lang | Bible text | status |
|---|---|---|
| en | World English Bible (`web`) | **done** - 1121 quizzes, all reviewed, approved, live in the database |
| es | Reina-Valera 1909 (`rv1909`) | in progress - see below |
| pt | Bíblia Livre (`blivre`) | not started (1 pilot file) |
| de | Lutherbibel 1912 (`luth1912`) | not started (1 pilot file) |
| fr | Louis Segond 1910 (`lsg1910`) | not started (1 pilot file) |

One language at a time, in that order. Dutch is finished and must never be touched.

## Where everything is

- Repo `AlexLamper/bijbelquiz`, branch **`feat/i18n-foundation`**. Work only on this branch.
- **`docs/QUIZ-AGENT-BRIEF.md`** - the rules every writer and reviewer follows (titles, slugs,
  description format, difficulty, what a question may and may not do). This is the contract.
- **`docs/quiz-manifest.json`** - the 1121 chapters: English book name, `bookSlug`, `chapter`,
  `isPremium`, and a `batch` number 1-94 (12 chapters per batch, batch 94 has 5).
- **`scripts/print-chapter.mts`** - prints one chapter verse by verse in the right language,
  with the book title to use. This is the only source a writer may use.
  `node --import tsx scripts/print-chapter.mts --lang=es --book="Genesis" --chapter=5`
- **`scripts/validate-quiz-json.ts`** - the strict checker. Must end 0 errors, 0 warnings.
  `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es --all --bible-dir=../bijbelapi-data/data`
- **`scripts/quiz-verify-sheet.mts`** - prints each question next to the real verse text, for review.
- Bible data: `../bijbelapi-data/data/<version>.json` (sibling folder of the repo).
- Output: `docs/quizzes-<lang>/<bookSlug>-quiz-part-<chapter>.json` (English uses
  `<bookSlug>-bible-quiz-part-<chapter>.json`), review logs in `docs/quizzes-<lang>/_reviews/`.

**`docs/` is in .gitignore** - commit quiz files with `git add -f docs/quizzes-<lang>`.

## Where Spanish stands

429 files exist. Complete, validated batches: **1-20, 22, 23, 26, 27, 28, 30, 31, 32, 33, 35, 36, 38**.
Only batches 1-20 are committed; the rest are on disk but untracked.

Needs doing:
- **Two files fail the validator** (answer letter spread): `1-chronicles-quiz-part-17.json`
  and `esther-quiz-part-6.json`. Fix them.
- **Partial batches** (written when a run was cut off, so finish or rewrite them whole):
  21, 24, 25, 29, 34.
- **Not started**: 37, 39-94.
- **No review pass has run for Spanish at all** - every batch still needs its reviewer.

Check the real state before trusting this list:

```python
import json, os
m = json.load(open('docs/quiz-manifest.json'))
lang, suffix = 'es', 'quiz-part'          # en uses 'bible-quiz-part'
done = {b for b in range(1, 95)
        if all(os.path.exists(f"docs/quizzes-{lang}/{x['bookSlug']}-{suffix}-{x['chapter']}.json")
               for x in m if x['batch'] == b)}
print('complete:', sorted(done))
print('todo:', [b for b in range(1, 95) if b not in done])
```

## How to do it (the method that produced the English library)

Work in **waves of up to 20 parallel subagents**; each agent owns one batch of 12 chapters.
Two passes per batch: a writer, then a **different** agent as reviewer. Never let the writer
review its own batch.

**Writer prompt** (one per batch, run in the background):

> Working dir /home/claude/bijbelquiz. Read docs/QUIZ-AGENT-BRIEF.md and follow its Writer
> section exactly. Language: es (Reina-Valera 1909). Write the chapters docs/quiz-manifest.json
> lists with "batch": N. Rewrite from scratch any file that already exists. Accuracy above all:
> every answer literally supported by the printed rv1909 text; natural modern Spanish questions,
> names and numbers exactly as rv1909 spells them. Temp folder /tmp/q-es-N-writer. Do not commit.
> Notes in docs/quizzes-es/_reviews/batch-0NN-writer.md. Final message: ONE line
> "batch N es: <n> files, validator 0/0, <note>".

**Reviewer prompt** (after the writer's batch exists):

> You are an independent Bible quiz reviewer. Working dir /home/claude/bijbelquiz. Read
> docs/QUIZ-AGENT-BRIEF.md and follow its Reviewer section exactly. Language: es. Review manifest
> batch N. Check every question against the printed verse text; be strict (unsupported answer,
> arguably-true wrong answer, outside fact, name or speaker not in the chapter: fix it).
> Temp folder /tmp/q-es-N-review. Do not commit. Write the review log
> docs/quizzes-es/_reviews/batch-0NN.md. Final message: ONE line
> "review N es: <ok> OK, <fixed> fixed, <q> questions changed".

Rules that keep the waves from fighting each other:
- Every agent gets **its own temp folder**; never a shared `/tmp/qgen`.
- One-line final messages - long reports burn the parent's context for nothing.
- After each wave: run the validator over the whole language, then
  `git add -f docs/quizzes-es && git commit && git push origin feat/i18n-foundation`.
  Commit after every wave, so a rate-limit cut-off never loses work.
- Expect to be cut off by usage limits. When that happens, re-run the audit snippet above and
  restart the batches that came back incomplete. A half-written batch is rewritten, not patched.

Typical wave: 10 writers + 10 reviewers of the previous wave, 20 agents, roughly 8-10 minutes.

## When a language is finished

1. Validator over the whole language: 0 errors, 0 warnings.
2. Every batch has a review log in `docs/quizzes-<lang>/_reviews/`.
3. Set `"status": "approved"` in every file of that language (a small script), validate again,
   commit and push.
4. Upload to that language's database, which is the only way the quizzes reach the site:
   - the temporary import route lives on branch **`tmp/seed`**: `src/app/api/seed-quizzes/route.ts`
     (token-guarded, refuses the Dutch database). **Never merge `tmp/seed` into main.**
   - merge `feat/i18n-foundation` into `tmp/seed`, push, and deploy `tmp/seed` to that language's
     Vercel project (`biblequizzes`, `-es`, `-pt`, `-de`, `-fr`, team `team_9wpz357Zr29FamsK8xocjUdm`).
   - POST the quizzes in chunks of ~25 to
     `https://biblequizzes-<lang>-git-tmp-seed-dev-f81e211e.vercel.app/<lang>/api/seed-quizzes?token=$SEED_TOKEN&apply=1`
     with body `{"quizzes": [...]}`. English has no path prefix; the other four do (`/es`, `/pt`, …).
     `SEED_TOKEN` is the preview env var of the project. The route reports
     `inserted/updated/skipped/failures/totalInDatabase`; `draft` files are skipped, so approve first.
   - check the result on the live site, e.g. `https://biblequizzes.app/es/quizzes`.
5. Redeploy that project from `feat/i18n-foundation` afterwards, so the temporary route is not
   what serves the site.

## Hard rules

- **Never touch the Dutch site**: not `main`, not `docs/quizzes/`, not bijbelquiz.com. Dutch slugs
  never change.
- Nothing may be invented. Every answer, every explanation, every name and number comes from the
  printed verse text of that language's own Bible. No cross-translation memory, no commentary,
  no history, no theology the cited verses do not contain.
- A wrong answer that is arguably true is a bug. So is a question that needs a verse it does not cite.
- Questions in natural modern language; only short exact quotes keep the old text's wording.
- Plain hyphens, no em dashes, no emoji.
- `isPremium` and the chapter list come from the manifest, never from a guess.
