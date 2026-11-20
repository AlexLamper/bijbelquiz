# Batch 024 (es, rv1909) - writer notes

Language: es, Reina-Valera 1909. Book as printed by `print-chapter`: "2 Samuel" (used in the title
and in every `bibleReference`).
All 12 files written from scratch (2 Samuel 10-21), 10 questions each, `status` "draft",
`rewardXp` 100, `categorySlug` "old-testament", `isPremium` true (from the manifest).
Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es --bible-dir=../bijbelapi-data/data` -> 0 errors, 0 warnings on all 12.
Verify sheet read for all 12; every marked answer, explanation and reference checked against the
printed TEXT lines.

| file | chapter | difficulty | isPremium | note |
|---|---|---|---|---|
| 2-samuel-quiz-part-10.json | 2 Samuel 10 | medium | true | Q8 cites 10:9-10 because v9 has Joab facing the Siros and v10 the handover to Abisai. |
| 2-samuel-quiz-part-11.json | 2 Samuel 11 | easy | true | Famous chapter, so easy. Q10 cites 11:26-27 (the mourning plus the closing verdict). |
| 2-samuel-quiz-part-12.json | 2 Samuel 12 | easy | true | Q4 cites 12:5-6 since "digno de muerte" (v5) and "cuatro tantos" (v6) belong together. |
| 2-samuel-quiz-part-13.json | 2 Samuel 13 | medium | true | Q9 cites 13:32-33, where Jonadab twice says that only Amnón is dead. |
| 2-samuel-quiz-part-14.json | 2 Samuel 14 | medium | true | Q5 cites 14:18-19 (the king's request not to be hidden anything, then the Joab question). |
| 2-samuel-quiz-part-15.json | 2 Samuel 15 | medium | true | Q10 cites 15:33-35; the answer stays with v34 (become Absalom's servant) only. |
| 2-samuel-quiz-part-16.json | 2 Samuel 16 | medium | true | Q7 cites 16:11-12; the answer keeps only v11 ("Jehová se lo ha dicho"). |
| 2-samuel-quiz-part-17.json | 2 Samuel 17 | medium | true | Q1 distractor "juntar a todo Israel desde Dan hasta Beer-seba" is Husai's counsel in v11, so it is plainly wrong as Achitophel's proposal. |
| 2-samuel-quiz-part-18.json | 2 Samuel 18 | easy | true | Famous chapter. Q10 cites 18:32-33 (Cusi's answer and the king's weeping). |
| 2-samuel-quiz-part-19.json | 2 Samuel 19 | medium | true | Q7 cites 19:29-30 (the king's ruling, then Mephi-boseth's reply). |
| 2-samuel-quiz-part-20.json | 2 Samuel 20 | medium | true | Q10 comes from the officials' list in v23-24 (Adoram over the tributes). |
| 2-samuel-quiz-part-21.json | 2 Samuel 21 | medium | true | Q3 cites 21:4-6; "aquel hombre" of v5 is Saúl, whom v1-2 name in this chapter. |

Unsure / judgement calls:
- Spelling follows rv1909 exactly, including Hanún, Naas, Hadad-ezer, Sobach, Is-tob, Maaca,
  Bath-sheba, Uría Hetheo, Eliam, Thamar, Jonadab, Simea, Bala-hasor, Talmai, Amiud, Gessur,
  Achitophel, Husai, Beth-maachâ, Sibechâi, Machîr, Michâl, Jaare-oregim, Goliath Getheo, Rispa, Aja.
- "Husai Arachîta" is written just "Husai" inside questions and answers (the chapters name him both
  ways); the circumflex form is never altered where it is quoted.
- Several distractors use names or places from neighbouring chapters of the same book (Jericó, Rabba,
  Gessur, los dardos de Joab). None of them is stated by the cited verses, so none is also-correct.
- 2 Samuel 10 is the thinnest chapter of the batch (19 verses); its ten questions are closely spaced
  but each one covers a different fact, from v1 to v18.
- All ten answer-letter spreads are A=2-3, B=2-3, C=2-3, D=2-3 with no run of three identical
  letters, and no correct answer is more than 1.6x the median distractor length.
