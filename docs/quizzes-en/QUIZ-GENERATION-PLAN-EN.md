# English quiz generation plan

How English quizzes are written, checked and imported. The Dutch library
(`docs/quizzes`, NL database) is untouched; English lives in `docs/quizzes-en`
and goes into the intl database only.

## Pipeline

1. Write a quiz as `docs/quizzes-en/<slug>.json` with `status: "draft"`.
2. Check: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=en --all`
   (add `--no-fetch` offline). References are checked against the World English
   Bible (`version=web`) at bijbelapi.com.
3. Review a sample per batch (see "Review").
4. Change `status` to `approved` in the file.
5. Once per database: `node --import tsx scripts/seed-categories-en.mts --apply`
   (refuses to run on the NL database).
6. Import: `node --import tsx scripts/import-quiz-json.mts --lang=en <files> --apply`
   with `MONGODB_URI` set to the intl database. Dry run without `--apply`.

## File format

```json
{
  "title": "Genesis Bible Quiz - Chapter 1",
  "description": "At least 10 characters.",
  "slug": "genesis-bible-quiz-part-1",
  "categorySlug": "old-testament",
  "rewardXp": 100,
  "difficulty": "easy",
  "isPremium": false,
  "status": "draft",
  "questions": [
    {
      "text": "...",
      "explanation": "...",
      "bibleReference": "Genesis 1:3-5",
      "answers": [{ "text": "...", "isCorrect": false }]
    }
  ]
}
```

`categorySlug` must exist in `categories.json`. English files use a slug where
Dutch files use `categoryId`, because the intl database has its own ids.

## Rules (same as the Dutch library, enforced by the validator)

1. Title is `<Book> Bible Quiz - Chapter <n>`; `n` is the chapter the questions cover.
   Slug is `<book-slug>-bible-quiz-part-<n>` (the book slug is the English one:
   `1-samuel`, `song-of-solomon`).
2. 10 or 15 questions; `rewardXp` = 10 x number of questions.
3. Exactly 4 answers per question, exactly 1 correct. No duplicate answers.
4. Spread the correct answer over A-D: at least 2 each (3 each for 15
   questions), never more than 3 in a row.
5. The correct answer is not systematically the longest one.
6. Every question has an explanation (not empty, not "-").
7. Every question has a `bibleReference` that exists in the World English Bible;
   at most one question without one. Several references: separate with `;`.
8. At least 3 questions on the same chapter, so the reading screen can show it.
9. English Bible book names, plain UTF-8 text.

## Style

- Plain, neutral English (no US/UK slang), written for a general Christian audience.
- Questions test what the text says, not trivia about translations.
- Quote the World English Bible when quoting; do not mix in other translations.
- Difficulty: `easy` for well-known stories, `medium` for details, `hard` for
  cross-references and obscure passages.

## Review

Per batch of up to 20 quizzes, a human reads at least 3 at random (more for the
first batch): facts against the text, answer clarity, explanation accuracy.
Fix the pattern in the whole batch when something is wrong, not only the sample.

## Premium / free

`isPremium: false` for the first chapter of every book and the best-known
stories; the rest follows the NL ratio. Decide per batch.
