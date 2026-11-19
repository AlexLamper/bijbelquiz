# Batch 078 review (en)

Reviewer: independent (did not write these). Source text: World English Bible (web).
Checked every question on the verify sheet against the printed TEXT lines, and each distractor
against the whole printed chapter: marked answer stated by the cited verses, no second defensible
answer anywhere in that chapter, explanation within the cited verses, reference pointing at the
verses that carry the answer, and natural English with the text's own spellings.

| file | result | questions changed |
|---|---|---|
| luke-bible-quiz-part-20.json | FIXED: Q5 asked whom the lord of the vineyard sent, but Luke 20:12-13 only has "I will send my beloved son"; reworded to "say he would send" (matching the explanation). Distractor spelled "neighbour"; changed to "neighbor" to match this translation's spelling. | 1 |
| luke-bible-quiz-part-21.json | OK | 0 |
| luke-bible-quiz-part-22.json | FIXED: Q4 asked "What did Jesus say would happen" while three of the four options were bare noun phrases; reworded to "Whom did Jesus say would meet them when they had entered the city?" and the options made parallel. In 8 of 10 questions the correct answer was also the longest option; shortened the correct option in Q1 and Q8 and lengthened a distractor in Q6 and Q10 (now 3 of 10). | 5 |
| luke-bible-quiz-part-23.json | OK | 0 |
| luke-bible-quiz-part-24.json | OK | 0 |
| john-bible-quiz-part-1.json | OK | 0 |
| john-bible-quiz-part-2.json | OK | 0 |
| john-bible-quiz-part-3.json | FIXED: in 7 of 10 questions the correct answer was also the longest option; shortened the correct option in Q7 and Q9 (both still literal to John 3:19 and 3:29) and lengthened a distractor in Q4 and Q5 (now 5 of 10). | 4 |
| john-bible-quiz-part-4.json | OK | 0 |
| john-bible-quiz-part-5.json | OK | 0 |
| john-bible-quiz-part-6.json | OK | 0 |
| john-bible-quiz-part-7.json | OK | 0 |

Total: 9 OK, 3 fixed, 10 questions changed.

Notes (no change made):
- Every marked answer in all 120 questions is stated by the cited verses; no reference had to be
  moved or widened, and no explanation went beyond its verses.
- john-6 Q7 ("Who gives the true bread out of heaven?", answer "His Father", John 6:32): the
  distractor "The Son of Man alone" is close to John 6:27 and 6:51, but "alone" plus the explicit
  contrast in 6:32 (not Moses, but my Father) leaves it plainly wrong. Left as written.
- luke-23 Q1 distractor "Leading an armed revolt in the city" is true of Barabbas (Luke 23:19), not
  of the accusation against Jesus in 23:2, so it is a good distractor rather than a second answer.
- Answer-letter spread is 2-3 per letter in all twelve files, and no two questions in a file share
  an answer.
- Several files still have the correct answer as the longest option in 5-6 of 10 questions
  (john-1, john-4, john-5, john-7, luke-21, luke-24). Left as written - padding the distractors
  would make them read less naturally - but worth watching in later batches.

Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=en
--bible-dir=../bijbelapi-data/data <batch files>` - 12 files, 0 errors, 0 warnings.
`status` left at "draft" in every file; slugs, titles and isPremium untouched.
