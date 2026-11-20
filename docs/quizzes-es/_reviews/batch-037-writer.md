# Batch 037 - writer notes (es, Reina-Valera 1909)

Source: `print-chapter --lang=es` only. Book titles from the print headers: `Ester`, `Salmos`.
Validator (`SITE=intl ... --lang=es --bible-dir=../bijbelapi-data/data`): 12 files, 0 errors, 0 warnings.
Verify sheet read for all 12 files; every marked answer is in the printed TEXT line of its reference.

| file | chapter | difficulty | note |
|---|---|---|---|
| esther-quiz-part-7.json | Ester 7 | medium | Names spelled as rv1909: Esther, Amán, Assuero, Mardochêo, Harbona. |
| esther-quiz-part-8.json | Ester 8 | medium | Covers v1-v17; month name Siván from v9, no question on the 127 provinces. |
| esther-quiz-part-9.json | Ester 9 | medium | All numbers (quinientos, diez, trescientos, setenta y cinco mil) written in the verses. |
| esther-quiz-part-10.json | Ester 10 | hard | Thin chapter: only 3 verses, so several questions take one clause each of v2 and v3. All ten facts differ, but the quiz is unavoidably repetitive. |
| psalms-quiz-part-1.json | Salmos 1 | easy | Questions follow the images of the text (árbol, tamo); 2 questions on v1 and 2 on v3, different facts. |
| psalms-quiz-part-2.json | Salmos 2 | medium | v5 and v11 left out; q3 distractors avoid wording that v11 uses, so no answer is also true. |
| psalms-quiz-part-3.json | Salmos 3 | medium | q1 uses the heading, which names Absalom; 2 questions on v7 (quijada, dientes). |
| psalms-quiz-part-4.json | Salmos 4 | medium | q1 asks about the heading (Neginoth); distractor headings belong to other psalms, not to this chapter. |
| psalms-quiz-part-5.json | Salmos 5 | medium | v10 and v11 left out; end covered by v12. |
| psalms-quiz-part-6.json | Salmos 6 | medium | Covers v1-v10 in order. |
| psalms-quiz-part-7.json | Salmos 7 | medium | q1 uses the heading (Cus, hijo de Benjamín); q3 kept inside v5 so the conditional of v3-4 is not needed. |
| psalms-quiz-part-8.json | Salmos 8 | easy | q9 cites 8:7-8 and names three of the five groups the verses list; q10 is the repeated closing line of v9. |

Unsure / deliberate choices:
- Ester 7:5: the correct answer summarises "aquél á quien ha henchido su corazón para obrar así" as "el culpable".
- Ester 10:3: "Pequeño" and similar distractors were chosen so that nothing arguably true of Mardochêo elsewhere in the book (e.g. that he was feared) appears as a wrong answer.
- Psalms headings are treated as part of the printed verse 1, which is how `print-chapter` prints them.

status stays "draft" in all 12 files.
