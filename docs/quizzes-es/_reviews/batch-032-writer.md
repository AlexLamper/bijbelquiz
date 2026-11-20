# Batch 032 (es) - writer notes

Language: es, Reina-Valera 1909 (rv1909). Book title from print-chapter header: "2 Crónicas".
Source: `node --import tsx scripts/print-chapter.mts --lang=es --book="2 Chronicles" --chapter=<n>`
only. All 12 files are new (no 2 Chronicles file existed in docs/quizzes-es before).
All `isPremium: true` (manifest), `status: "draft"`, `rewardXp: 100`, `categorySlug: "old-testament"`.

Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es
--bible-dir=../bijbelapi-data/data` -> 12 files, 0 errors, 0 warnings.
Verify sheet read for all 12 files; every marked answer and every explanation is taken from the
printed TEXT lines of the cited verses.

## Files

- 2-chronicles-quiz-part-6.json - medium - Salomón's blessing and dedication prayer (vv. 1, 5-6, 9, 11, 13, 18, 22-23, 26-27, 32-33, 41).
- 2-chronicles-quiz-part-7.json - medium - fire from heaven, the seven-day feast, Jehová's night answer (vv. 1, 2, 3, 5, 8, 10, 12, 14, 17-18, 19-20).
- 2-chronicles-quiz-part-8.json - medium - cities built, labourers and officers, the three feasts, Ophir gold (vv. 1-5, 9-11, 13, 18).
- 2-chronicles-quiz-part-9.json - easy - the reina de Seba, the gold and the ivory throne, Salomón's death (vv. 1-4, 6, 9, 11, 13, 18-19, 21, 31).
- 2-chronicles-quiz-part-10.json - medium - the people's request, the two counsels, the split (vv. 1, 2, 4, 5, 7, 10-11, 15, 16, 18, 19).
- 2-chronicles-quiz-part-11.json - medium - Semeías stops the war, the fortified cities, Roboam's family (vv. 1-4, 6, 11, 14, 17, 20-22).
- 2-chronicles-quiz-part-12.json - medium - Sisac against Jerusalem, the humbling, end of Roboam (vv. 1-3, 5-7, 9, 10, 13, 16).
- 2-chronicles-quiz-part-13.json - medium - Abías' speech from monte de Semaraim and the battle (vv. 2-5, 8, 11, 13, 14, 17).
- 2-chronicles-quiz-part-14.json - medium - Asa's reform and the defeat of Zera Etiope (vv. 1, 3, 4, 7-11, 13, 15).
- 2-chronicles-quiz-part-15.json - medium - Azarías hijo de Obed, the concierto in Jerusalem, Maachâ deposed (vv. 1-3, 7, 8, 10, 11, 13, 16, 19).
- 2-chronicles-quiz-part-16.json - medium - the alliance with Ben-adad, Hanani vidente, Asa's illness and burial (vv. 1, 2, 4-7, 9, 10, 12, 14).
- 2-chronicles-quiz-part-17.json - medium - Josaphat's reign, the teaching princes, the muster of his captains (vv. 1, 3, 5-7, 9-11, 14, 17).

## Notes / things I was careful about

- Numbers and names are spelled exactly as rv1909 spells them: "veinte y dos mil", "diez y ocho
  mujeres", "doscientos y cincuenta", Sichêm, Maachâ, Michâía, Lachîs, Acechâ, Zachârías, Michêas,
  Beth-oron, Abel-maim, Algummim, Josaphat, Semeías, Ahías Silonita, Zera Etiope.
- Numbers that also appear in a neighbouring chapter were used as distractors only where the cited
  verse makes them plainly wrong (e.g. the 666 talents of 9:13 as a distractor in 8:18 and the
  other way round).
- 2 Crónicas 11: I avoided asking "which woman did Roboam marry", because v. 18 lists two women
  and v. 20 a third; the question asks instead whose daughter Maachâ was (v. 20-21, "hija de
  Absalom"), which the text states twice.
- 2 Crónicas 8:13 names sábados and nuevas lunas next to the three yearly feasts, so after the
  verify-sheet pass I removed "los sábados" and "la luna nueva" from the distractors: only the
  three feasts the verse calls "tres veces en el año" are now in play.
- 2 Crónicas 13:11 also mentions the panes on the mesa limpia; the distractor naming them was
  replaced so that only "los holocaustos y los perfumes aromáticos" answers "cada mañana y cada
  tarde".
- 2 Crónicas 17:7-8: the Levitas of v. 8 (Semeías, Zebadías, Adonías...) were also sent to teach,
  so after the verify-sheet pass they were dropped as distractors for the príncipes of v. 7; the
  distractors are now names that do not occur in this chapter.
- 2 Crónicas 10:18 was kept for Adoram only; the "apedrear" distractor in the v. 16 question was
  replaced so that no wrong answer is true elsewhere in the chapter.
- Chapter 16 has only 14 verses, so the questions cover vv. 1-14 with no verse used twice; the
  burial detail of v. 14 closes the quiz.
- Chapter 6 is one long prayer: the questions ask what Salomón asks for in each named case
  (juramento, sequía, the extranjero, the final plea) rather than about the prayer as a whole.
