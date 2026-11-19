# Batch 062 review (en)

Reviewer: independent (did not write these files). Source checked: World English Bible (web) text as
printed by `quiz-verify-sheet.mts` plus the full printed chapters for every quiz in the batch.
Each of the 120 questions was checked for: marked answer stated by the cited verses, no distractor
also true in this text, explanation within the cited verses, no outside facts, reference points at
the verses holding the answer, natural English and spelling of names as in the text.

| quiz | result | questions changed |
|---|---|---|
| lamentations-bible-quiz-part-4.json | OK | 0 |
| lamentations-bible-quiz-part-5.json | OK | 0 |
| ezekiel-bible-quiz-part-1.json | OK | 0 |
| ezekiel-bible-quiz-part-2.json | OK | 0 |
| ezekiel-bible-quiz-part-3.json | OK | 0 |
| ezekiel-bible-quiz-part-4.json | OK | 0 |
| ezekiel-bible-quiz-part-5.json | OK | 0 |
| ezekiel-bible-quiz-part-6.json | OK | 0 |
| ezekiel-bible-quiz-part-7.json | OK | 0 |
| ezekiel-bible-quiz-part-8.json | OK | 0 |
| ezekiel-bible-quiz-part-9.json | OK | 0 |
| ezekiel-bible-quiz-part-10.json | OK | 0 |

Total: 12 quizzes, 12 OK, 0 fixed, 0 questions changed.

Notes (no change made, all within the rules):
- Ezekiel 2 q2 ("Son of man") cites 2:1-3 while the address also recurs in 2:6 and 2:8; the cited
  verses alone carry the answer.
- Ezekiel 9 q2-q4 all draw on 9:2, but on three different facts (number and gate, the man in linen,
  where they stood); the chapter as a whole (1-11) is covered.
- Several distractors echo wording from neighbouring chapters (e.g. the rims full of eyes of
  Ezekiel 1:18 in Ezekiel 10 q8, the six men of Ezekiel 9 in Ezekiel 10 q6); each is plainly wrong
  in the chapter actually quizzed.

Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=en` on all 12 files:
0 errors, 0 warnings; answer spread A=2 B=2-3 C=2-3 D=2-3 per quiz. `status` left unchanged.
