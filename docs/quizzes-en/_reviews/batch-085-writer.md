# Batch 085 - writer notes (en, World English Bible)

12 files written, all 10 questions each, `categorySlug` new-testament, `rewardXp` 100,
`status` draft, `isPremium` taken from docs/quiz-manifest.json.
Validator: 0 errors, 0 warnings. Verify sheet re-read question by question.

| file | difficulty | notes |
|---|---|---|
| 1-corinthians-bible-quiz-part-15.json | medium | Famous chapter, but the questions sit on wording (first fruits, sown/raised pairs, last trumpet) rather than on the well-known story, so medium rather than easy. |
| 1-corinthians-bible-quiz-part-16.json | medium | Travel plans, names and greetings; all facts verbatim from the chapter. |
| 2-corinthians-bible-quiz-part-1.json | medium | OK. |
| 2-corinthians-bible-quiz-part-2.json | medium | Short chapter (17 verses); the 10 facts are spread v1-v17 with no verse used twice. |
| 2-corinthians-bible-quiz-part-3.json | medium | OK. |
| 2-corinthians-bible-quiz-part-4.json | medium | OK. |
| 2-corinthians-bible-quiz-part-5.json | medium | OK. |
| 2-corinthians-bible-quiz-part-6.json | medium | OK. |
| 2-corinthians-bible-quiz-part-7.json | medium | Short chapter (16 verses), still 10 distinct facts. |
| 2-corinthians-bible-quiz-part-8.json | medium | OK. |
| 2-corinthians-bible-quiz-part-9.json | medium | Short chapter (15 verses), still 10 distinct facts. |
| 2-corinthians-bible-quiz-part-10.json | medium | OK. |

## Doubts / choices worth a second pair of eyes

- Speaker naming: Paul is named inside the chapter only in 1 Corinthians 16:21,
  2 Corinthians 1:1 and 2 Corinthians 10:1, so only those three quizzes say "Paul".
  Everywhere else the questions say "the writer" or "he", as the brief requires.
  1 Corinthians 15 never names him, so that quiz uses "the writer" throughout.
- 2 Corinthians 1:11 mentions "the gift given to us by means of many". The distractor
  "By sending him money" was removed from question 6 of that quiz, because the verse's
  "gift" could be read as making it arguably correct; the stated means of helping is
  "by your supplication".
- 2 Corinthians 9 question 2 cites 9:3-4 but its answer ("so that they would be prepared,
  just as he had said") rests on verse 3; verse 4 is in the reference because the
  explanation restates the Macedonia clause of verse 4.
- Several quizzes use quoted lines from another chapter of the same letter as distractors
  (e.g. "He who sows sparingly..." in the 2 Corinthians 8 quiz, "He gathered much..." in
  the 2 Corinthians 9 quiz). They are plainly wrong answers for the cited verse, but a
  reviewer may want them swapped if cross-chapter echoes are unwanted.
- Many correct answers had to be padded on the distractor side to clear the validator's
  length-tell check (1.6x median). The lengthened distractors stay plainly false in this
  text; worth checking they still read naturally.
- Epistle discipline: no question asks for doctrine or inference, only for what the cited
  verses state. Chapter-level questions ("What call does the chapter end with...",
  "How does the chapter end?") are answered by the single cited verse.
