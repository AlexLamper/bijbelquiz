# Batch 087 - writer notes (en, World English Bible)

12 files written, all `status` "draft", `categorySlug` "new-testament", `rewardXp` 100,
`difficulty` "medium" for all twelve (epistle teaching, no famous narrative; no genealogies or law lists),
`isPremium` taken from docs/quiz-manifest.json.
Validator: 0 errors, 0 warnings. Verify sheet re-read for every question.

- ephesians-bible-quiz-part-4.json - OK. Covers v1, 3, 5, 11, 14, 24, 26, 28, 29, 32.
- ephesians-bible-quiz-part-5.json - OK. Covers v1, 2, 5, 8, 14, 16, 18, 23, 26, 33.
- ephesians-bible-quiz-part-6.json - OK. Covers v1, 2-3, 4, 8, 9, 12, 14, 16, 17, 21-22.
  Note: v14 is "the utility belt of truth" in this translation; the question and answer use that wording.
- philippians-bible-quiz-part-1.json - OK. Covers v1, 6, 9, 13, 15, 18, 21, 23-24, 27, 29.
- philippians-bible-quiz-part-2.json - OK. Covers v2, 3, 7, 8, 9, 11, 14, 15, 19-20, 29-30.
- philippians-bible-quiz-part-3.json - OK. Covers v2, 5 (tribe), 5 (Pharisee), 8, 9, 10, 12, 13, 19, 20.
  Two questions cite v5, but on two different statements in it.
- philippians-bible-quiz-part-4.json - OK. Covers v2, 3, 5, 6, 7, 8, 11-12, 13, 16, 22.
  Doubt: question 9 asks which city v16 names ("even in Thessalonica you sent once and again to my need").
  The verse does not say whether the city is where he was or where they sent from; the question only asks
  which city the verse names, so it stays inside the text.
- colossians-bible-quiz-part-1.json - OK. Covers v2, 5, 7, 9, 13, 15, 16, 18, 20, 27.
  Questions 6-9 use "he" as the chapter does; the chapter itself does not name the Son in those verses.
- colossians-bible-quiz-part-2.json - OK. Covers v1, 3, 6-7, 8, 9, 12, 14, 16, 18, 21.
- colossians-bible-quiz-part-3.json - OK. Covers v1, 3, 5, 8, 10, 11, 12, 14, 16, 23-24.
- colossians-bible-quiz-part-4.json - OK. Covers v1, 2, 3, 6, 7, 8-9, 10, 13, 14, 17.
  Question 10 (Archippus): first draft used "read this letter to the Laodiceans" and "greet the brothers in
  Laodicea" as wrong answers; both are real commands elsewhere in the chapter, so they were replaced with
  three instructions the chapter does not contain.
- 1-thessalonians-bible-quiz-part-1.json - OK. Short chapter (10 verses): 10 questions on 10 different
  phrases, from v1, 1 (senders / addressees), 2, 3, 4, 5, 6, 7, 9, 10.
  Question 7 asks about the circumstances of receiving the word (v6) rather than whom they imitated, because
  "imitators of us" would need the senders from v1 and would duplicate question 1's answer.

General: wrong answers were lengthened in ~34 questions so the correct answer is not the most elaborate
option (validator length-tell check). Distractors were checked against the printed chapter so that none of
them is also stated there.
