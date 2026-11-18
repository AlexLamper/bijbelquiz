# Batch 092 - writer notes (en, World English Bible)

12 files written, all `status: draft`, `categorySlug: new-testament`, `rewardXp: 100`,
10 questions each, `difficulty: medium`, `isPremium` taken from docs/quiz-manifest.json
(1 John 2-5 and Revelation 2-5 premium; 2 John, 3 John, Jude, Revelation 1 free).
Validator: 0 errors, 0 warnings. Verify sheet re-read for all 12.

| file | note |
|---|---|
| 1-john-bible-quiz-part-2.json | OK |
| 1-john-bible-quiz-part-3.json | OK |
| 1-john-bible-quiz-part-4.json | OK |
| 1-john-bible-quiz-part-5.json | OK |
| 2-john-bible-quiz-part-1.json | OK - 13 verses only, see note 1 |
| 3-john-bible-quiz-part-1.json | OK - 14 verses only, see note 1 |
| jude-bible-quiz-part-1.json | OK |
| revelation-bible-quiz-part-1.json | OK |
| revelation-bible-quiz-part-2.json | OK |
| revelation-bible-quiz-part-3.json | OK |
| revelation-bible-quiz-part-4.json | OK |
| revelation-bible-quiz-part-5.json | OK |

## Notes and doubts

1. 2 John and 3 John are a single short chapter each (13 and 14 verses). Both quizzes still
   have 10 questions, each on a different phrase of the printed text and nothing from outside
   it: for 2 John verses 1, 1, 3, 4, 5, 6, 7, 9, 10, 12; for 3 John verses 1, 2, 3, 4, 6, 7,
   9, 10, 11, 12. Two 2 John questions cite verse 1 (one on the writer calling himself "the
   elder", one on the addressee); they are different facts but a reviewer may want one moved
   to verse 2 or 11.
2. Revelation is handled strictly descriptively: what the text says it saw, said, named or
   numbered (lamp stands, stars, Patmos, ten days, six wings, seven horns and eyes, "Amen!").
   No interpretation of any image, and no identification of symbols beyond those the text
   itself explains (Rev 1:20, 4:5, 5:6, 5:8).
3. Because John's letters repeat the same handful of ideas, several distractors are statements
   that are true elsewhere in the Bible but not in the cited verses. I kept such distractors
   out whenever the same idea appears anywhere in the same chapter, so no wrong answer is
   arguably correct within its own chapter. Cross-chapter cases that are deliberate:
   - Revelation 3 q1 (Sardis) has "It is rich and has need of nothing" as a distractor, which
     is said of Laodicea later in the same chapter (3:17). The question names Sardis, so it is
     plainly wrong, but it is the one in-chapter overlap in the batch.
   - Revelation 1 q8 ("What proceeded out of his mouth?") uses "A golden sash about his chest"
     and "Seven golden stars" as distractors; both are true of the same figure in 1:13 and
     1:16, but not of his mouth.
4. Jude 1:5 is rendered "the Lord, having saved a people out of the land of Egypt" in this
   text; the question and explanation stay with "the Lord" and add nothing about who that is.
5. 1 John 5:7-8 in this text reads only "For there are three who testify: the Spirit, the
   water, and the blood". The question asks exactly that and the explanation adds nothing.
6. Distractors were lengthened in 34 questions purely to satisfy the validator's
   length-tell check (correct answer must be at most 1.6x the median distractor length).
   The added words are neutral filler and were checked to stay plainly wrong in this text.
