# Batch 092 review (en)

Reviewer: independent (did not write these). Source text: World English Bible (web).
Checked every question on the verify sheet against the printed TEXT lines: marked answer stated
by the cited verses, no second defensible answer, explanation within the cited verses, reference
pointing at the verses that carry the answer, and natural English with the text's own spellings.

| file | result | questions changed |
|---|---|---|
| 1-john-bible-quiz-part-2.json | OK | 0 |
| 1-john-bible-quiz-part-3.json | OK | 0 |
| 1-john-bible-quiz-part-4.json | OK | 0 |
| 1-john-bible-quiz-part-5.json | FIXED: Q4 asked "By what did he come" with no antecedent for "he"; reworded to name Jesus Christ, whom 1 John 5:6 names. | 1 |
| 2-john-bible-quiz-part-1.json | OK | 0 |
| 3-john-bible-quiz-part-1.json | OK | 0 |
| jude-bible-quiz-part-1.json | FIXED: Q10 named the apostles but cited only Jude 1:18; reference widened to Jude 1:17-18 (which names them) and explanation matched. Description listed Sodom, which no question covers; description corrected. | 1 |
| revelation-bible-quiz-part-1.json | FIXED: Q1 said God sent and made known the Revelation, which Revelation 1:1 does not state ("which God gave him ... which he sent"); reworded to the passive, explanation matched. Q3 referred to "verse 8" instead of the text's own words; reworded. | 2 |
| revelation-bible-quiz-part-2.json | OK | 0 |
| revelation-bible-quiz-part-3.json | OK | 0 |
| revelation-bible-quiz-part-4.json | OK | 0 |
| revelation-bible-quiz-part-5.json | FIXED: Q9 asked about the new song but cited only Revelation 5:10; reference widened to 5:9-10 (the song begins in v9) and explanation matched. | 1 |

Total: 8 OK, 4 fixed, 5 questions changed.

Notes (no change made):
- Questions naming the assembly addressed (Smyrna, Pergamum, Thyatira, Sardis, Philadelphia,
  Laodicea) while citing only the verse that carries the answer are left as written: the chapter
  names each assembly in its own opening verse, and widening the references would exceed a
  three-verse span.
- Answer-letter spread is within range in all twelve files; in revelation-3, revelation-5 and jude
  the correct answer is the longest option in 7 of 10 questions. Left as written, since padding the
  distractors would make them read less naturally; worth watching in later batches.

Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=en
--bible-dir=../bijbelapi-data/data <batch files>` - 12 files, 0 errors, 0 warnings.
`status` left at "draft" in every file; slugs, titles and isPremium untouched.
