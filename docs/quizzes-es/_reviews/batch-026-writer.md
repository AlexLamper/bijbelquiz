# Batch 026 (es) - writer notes

Language: es (Reina-Valera 1909, rv1909). Book title from print-chapter: "1 Reyes".
12 files, 1 Reyes 10-21, all new (no previous es files for 1 Kings existed).
Validator: 0 errors, 0 warnings. Verify sheet read for all 12 files. status: draft.

| file | chapter | difficulty | note |
|---|---|---|---|
| 1-kings-quiz-part-10.json | 10 | medium | Reina de Seba, riquezas de Salomón. OK |
| 1-kings-quiz-part-11.json | 11 | medium | Mujeres extranjeras, Adad, Rezón, capa de Ahías. OK |
| 1-kings-quiz-part-12.json | 12 | medium | Sichêm, división del reino, becerros de oro. OK |
| 1-kings-quiz-part-13.json | 13 | medium | Varón de Dios en Beth-el, el león del camino. OK |
| 1-kings-quiz-part-14.json | 14 | medium | Mujer de Jeroboam ante Ahías, Sisac. OK |
| 1-kings-quiz-part-15.json | 15 | medium | Abiam y Asa; anales de reyes, pocas escenas narrativas. |
| 1-kings-quiz-part-16.json | 16 | hard | Baasa, Ela, Zimri, Omri, Achâb; casi todo lista de reinados. |
| 1-kings-quiz-part-17.json | 17 | easy | Cherith, viuda de Sarepta, el niño que revivió. OK |
| 1-kings-quiz-part-18.json | 18 | easy | Carmelo; isPremium false según el manifiesto. OK |
| 1-kings-quiz-part-19.json | 19 | medium | Enebro, Horeb, silbo apacible, llamamiento de Eliseo. OK |
| 1-kings-quiz-part-20.json | 20 | medium | Dos campañas de Ben-adad, profeta disfrazado. OK |
| 1-kings-quiz-part-21.json | 21 | medium | Viña de Naboth, cartas de Jezabel, humillación de Achâb. OK |

## Fixes made during validation / verify sheet
- part-12 q2: correct answer moved to position D (position spread error D=1).
- part-15 q3: distractor "Dos años" changed to "Veintidós años" (length-tell warning 1.64x).
- part-17 q10: correct answer shortened to "Que ahora conocía que él era varón de Dios"
  (length-tell warning 1.85x); distractor "Que le había traído a la memoria sus iniquidades"
  replaced because the viuda does say that earlier in the chapter (v18).
- part-14 q4: correct answer no longer says Ahías called her "por su nombre" - the text says
  "Entra, mujer de Jeroboam", which is not a name.
- part-18 q6: distractor "El pueblo cayó sobre sus rostros" replaced - that is true later in the
  chapter (v39), though not at v26.
- part-20 q10: typo "topararía" corrected to "toparía".

## Things I was unsure about
- Spellings kept exactly as rv1909 prints them: Achâb, Chêmos, Maachâ, Issachâr, Thirsa, Sichêm,
  Beth-el, Gibbethón, Thibni, Genubath, Thaphnes, Semer, Astaroth (v5; v33 prints "Astharoth").
- 1 Reyes 15 and 16 are mostly regnal annals; the questions there are about years, names and
  single acts because that is all the text states.
- 1 Reyes 10:14 "seiscientos sesenta y seis talentos" is quoted literally as the yearly gold income.
- Distractors sometimes use names from neighbouring chapters (e.g. Hazael, Zimri) as plainly wrong
  alternatives; none of them is true for the cited verses.
