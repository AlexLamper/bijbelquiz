# Batch 050 (es) - writer notes

Language: es (Reina-Valera 1909, rv1909). Book title from print-chapter: "Proverbios".
All 12 chapters of batch 50 (Proverbios 3-14) written from scratch; none of the files existed before.
Validator (SITE=intl, --lang=es, --bible-dir=../bijbelapi-data/data): 0 errors, 0 warnings on all 12.
Answer spread per file is A/B/C/D with 2-3 each, no run longer than 3. status "draft", isPremium true
(manifest), rewardXp 100, categorySlug "old-testament", difficulty "medium" for all 12 (these are
proverb collections, not famous stories, and none is a genealogy or law list).

- proverbs-quiz-part-3.json - Proverbios 3. Verses 3, 5, 6, 9-10, 11-12, 14, 16, 18, 19, 35.
- proverbs-quiz-part-4.json - Proverbios 4. Verses 1, 3, 8-9, 12, 16, 17, 18, 19, 23, 27.
- proverbs-quiz-part-5.json - Proverbios 5. Verses 3, 4, 5, 8, 11-12, 15, 16-17, 18, 19, 22.
- proverbs-quiz-part-6.json - Proverbios 6. Verses 1-2, 5, 6, 7-8, 10-11, 13, 16, 23, 30-31, 34.
- proverbs-quiz-part-7.json - Proverbios 7. Verses 2, 4, 6, 7, 9, 10, 17, 19-20, 22, 27.
- proverbs-quiz-part-8.json - Proverbios 8. Verses 2-3, 5, 7, 10, 13, 15-16, 17, 22, 30, 35.
- proverbs-quiz-part-9.json - Proverbios 9. Verses 1, 2, 3, 5, 7, 8, 9, 10, 13-14, 17-18.
- proverbs-quiz-part-10.json - Proverbios 10. Verses 1, 4, 5, 7, 12, 19, 20, 22, 26, 31.
- proverbs-quiz-part-11.json - Proverbios 11. Verses 1, 2, 4, 12, 13, 14, 22, 25, 26, 30.
- proverbs-quiz-part-12.json - Proverbios 12. Verses 1, 4, 9, 10, 11, 16, 18, 19, 25, 28.
- proverbs-quiz-part-13.json - Proverbios 13. Verses 1, 3, 4, 7, 9, 12, 14, 17, 20, 24.
- proverbs-quiz-part-14.json - Proverbios 14. Verses 1, 4, 10, 12, 13, 15, 23, 27, 30, 34.

Choices and points worth a second look by the reviewer:
- Chapters 10-14 are loose proverb collections, so each question asks one single verse (or verse pair)
  and the ten questions are spread from the first verse to near the last. Nothing is drawn from
  outside the cited verse.
- The sentence chapters (3-9) are quoted in the explanations almost verbatim; only the archaic
  spelling is left as rv1909 has it inside quotes, while the questions use modern Spanish
  ("a tu cuello" in a question, "á tu cuello" inside a quoted explanation).
- No question asks about authorship. Proverbios 10:1 prints "Las sentencias de Salomón" as part of
  verse 1; the question on that verse asks about the hijo necio, not about Salomón.
- Several distractors re-use an image from a different verse of the same chapter (e.g. "Riquezas y
  honra" in 3:16 is what the left hand holds, and the question asks about the right hand; "Aguas
  hurtadas" in 9:5 is what the mujer loca says in 9:17, not what the sabiduría offers). They are
  always plainly wrong for the cited verse, and I deliberately avoided distractors that the cited
  chapter states as true of the same subject.
- Proverbios 13:14 and 14:27 both call something "manantial de vida" (la ley del sabio / el temor de
  Jehová). Each question cites its own verse, and neither uses the other chapter's subject as a
  distractor.
- Proverbios 9 is the shortest chapter of the batch (18 verses); every question still has its own
  verse, no verse carries two questions.
- Numbers only appear where the verse writes them: "siete columnas" (9:1) and "Seis cosas ... y aun
  siete" (6:16).
