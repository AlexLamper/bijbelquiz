# Batch 091 (en) - writer notes

Source: World English Bible (web), printed with `scripts/print-chapter.mts`. Every question asks only
what the cited verses of the chapter state; no doctrine, history or cross-references added.
Validator (SITE=intl, --lang=en, --bible-dir=../bijbelapi-data/data): 0 errors, 0 warnings on all 12 files.
Verify sheet re-read for all 12 files, every marked answer checked against the printed TEXT lines.

| file | note |
|---|---|
| james-bible-quiz-part-3.json | OK. The chapter never names James, so questions say "the text"/"verse n" instead of a speaker. |
| james-bible-quiz-part-4.json | OK. |
| james-bible-quiz-part-5.json | OK. Elijah and Job are used only as the text names them (v11, v17). |
| 1-peter-bible-quiz-part-1.json | OK. Writer named "Peter" because v1 names him. |
| 1-peter-bible-quiz-part-2.json | OK. |
| 1-peter-bible-quiz-part-3.json | OK. |
| 1-peter-bible-quiz-part-4.json | OK. |
| 1-peter-bible-quiz-part-5.json | OK. Q1 says "the writer" (the chapter's "I"), since 1 Peter 5 itself does not name him. |
| 2-peter-bible-quiz-part-1.json | OK. Two questions use the virtue list of v5-7 (what follows faith; what stands last) - two different facts. |
| 2-peter-bible-quiz-part-2.json | OK. |
| 2-peter-bible-quiz-part-3.json | OK. |
| 1-john-bible-quiz-part-1.json | 10 verses, 10 questions, one per phrase (v1, v2, v3 purpose, v3 fellowship, v4, v5, v6, v7, v9, v10). The chapter does not name John, so questions say "they"/"the writers", matching the text's "we". |

Doubts / things a reviewer may want to look at:

- james 3 q7: "what can a fig tree not yield?" -> Olives. The distractors "Figs", "Fruit" and "Leaves"
  are things a fig tree does yield, so they are plainly wrong for a "not yield" question, but the
  phrasing depends on reading v12 as a rhetorical question with the answer "no".
- james 5 q4: the farmer "waits for the precious fruit of the earth" (v7). "The early and late rain" was
  deliberately NOT used as a distractor, because v7 also says he is patient until it receives that rain.
- 1 peter 1 q6: "the prophets sought and searched diligently" (v10). "Angels" was deliberately avoided as
  a distractor, because v12 says angels desire to look into these things.
- 1 peter 2 q4: a single-item question off the four titles in v9 ("a royal priesthood"); the other three
  titles of v9 are not used as distractors, so no distractor is also true.
- 1 peter 4 q8: distractor "As a partaker of Christ's sufferings" is true of them in v13, but v15 is the
  cited verse and lists only murderer, thief, evil doer and meddler, so it is plainly wrong there.
- 2 peter 2 q6: distractor "Walk after the flesh" describes the false teachers in v10, not the angels of
  the cited v11.
