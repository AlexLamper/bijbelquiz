# Batch 022 - writer notes (es, Reina-Valera 1909)

Language: es. Book title from print-chapter header: "1 Samuel" (used in title and every bibleReference).
Files written from scratch (12), all `status: "draft"`, `rewardXp: 100`, 10 questions each,
`categorySlug: "old-testament"`, `isPremium` taken from docs/quiz-manifest.json
(chapter 17 false, chapters 18-28 true).

Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es --bible-dir=../bijbelapi-data/data`
-> 12 files, 0 errors, 0 warnings. Verify sheet read for all 12 files; fixes listed below.

| file | chapter | difficulty | note |
|---|---|---|---|
| 1-samuel-quiz-part-17.json | 17 | easy | David and the Filisteo of Gath; verse 40 + 49 cited together for the five stones and the forehead. |
| 1-samuel-quiz-part-18.json | 18 | medium | Jonathán's alliance, the women's song, Merab/Michâl, the dote of cien prepucios. |
| 1-samuel-quiz-part-19.json | 19 | medium | Jonathán's plea, the window escape, the mensajeros who prophesied. |
| 1-samuel-quiz-part-20.json | 20 | medium | nueva luna plan, piedra de Ezel, the three saetas, the parting in the field. |
| 1-samuel-quiz-part-21.json | 21 | medium | Chapter has only 15 verses; two questions cite 21:1 (the place/priest, and Ahimelech's surprise) because the chapter is thin. |
| 1-samuel-quiz-part-22.json | 22 | medium | Adullam, Gad, Doeg's denuncia, the ochenta y cinco varones, Abiathar's escape. |
| 1-samuel-quiz-part-23.json | 23 | medium | Keila, the ephod, the Ziph betrayal (v19) placed before the Keila oracle (v12) so the chapter is covered end to end. |
| 1-samuel-quiz-part-24.json | 24 | easy | Engaddi cave, the cut manto, "perro muerto"/"pulga", Saúl's oath about his simiente. |
| 1-samuel-quiz-part-25.json | 25 | medium | Samuel's death, Nabal and Abigail; verse 14-16 cited for what the criado told Abigail. |
| 1-samuel-quiz-part-26.json | 26 | medium | Hachîla camp, the lanza and botija de agua, the reproach to Abner, pulga/perdiz. |
| 1-samuel-quiz-part-27.json | 27 | medium | Chapter has only 12 verses; all ten questions come from a single verse each (v1-v12), nothing left over. |
| 1-samuel-quiz-part-28.json | 28 | medium | Gilboa, the mujer de Endor, Samuel's word about the reino, the ternero grueso. |

## Fixes made after reading the verify sheet

- part-17 q9: distractor "Que había matado al león y al oso" was also true in 17:36; replaced with a
  leopard, which the text never mentions.
- part-19 q2: distractor repeated the correct wording with broken grammar; replaced with an altar in Rama.
- part-19 q10: distractor "¿Dónde están Samuel y David?" is a real quote from 19:22; replaced so only
  one answer comes from the text.
- part-23 q6: originally duplicated the ephod answer of q4; rewritten to the Ziph report of 23:19.
- part-23 q7: distractor "Sí, descenderá" is Jehová's answer in 23:11; replaced with "No descenderá".
- part-25 q7: question said "los criados de Nabal" while 25:14 names a single criado; reworded and the
  reference widened to 25:14-16.
- part-26 q10: question said David compared himself to two animals; 26:20 compares him to a pulga and
  the chase to a perdiz, so the question and answers were reworded.
- Several answer sets were lengthened or reordered only to satisfy the A-D spread (minimum 2 per
  position) and the length-tell check; no fact changed.

## Unsure / worth a second look

- part-21 q7: the answer is shortened to "Doeg, Idumeo" (the text adds "principal de los pastores de
  Saúl"); the full wording is in the explanation.
- part-26 q4: distractor "Joab, hermano de Abisai" uses a relation the text does state (26:6 calls
  Abisai "hermano de Joab"), but Joab himself never speaks, so the answer is still plainly wrong.
- part-21 and part-27 are the two thin chapters; the questions there are closer to one verse each than
  in the longer chapters.
