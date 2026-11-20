# Batch 036 (es) - writer notes

Source: rv1909 via `print-chapter.mts` only. Book titles from the print headers:
"Nehemías" for Nehemiah, "Ester" for Esther. All 12 files `status: "draft"`, `rewardXp` 100,
`categorySlug` "old-testament", `isPremium` from the manifest (only esther-quiz-part-1 is false).

Validator: `SITE=intl ... validate-quiz-json.ts --lang=es --bible-dir=../bijbelapi-data/data` -> 0 errors, 0 warnings on all 12.
Verify sheet read for every file; the notes below record what was changed after reading it.

| file | chapter | difficulty | note |
|---|---|---|---|
| nehemiah-quiz-part-8.json | Nehemías 8 | medium | Esdras reads the law (v1-18). Lengthened three distractors so the correct answer was not the longest. |
| nehemiah-quiz-part-9.json | Nehemías 9 | medium | The levites' prayer; questions follow the prayer's own wording ("según la oración") rather than asserting history. |
| nehemiah-quiz-part-10.json | Nehemías 10 | hard | Signatory lists plus the obligations of v29-39. Avoided Hanán hijo de Zaccur as a distractor in the v13-style question, since he is listed as an assistant. |
| nehemiah-quiz-part-11.json | Nehemías 11 | hard | Mostly names and numbers. Replaced the distractor "De Leví y de Simeón" in q3: levites did live in Jerusalem (v15-18), so it would have been arguably true. |
| nehemiah-quiz-part-12.json | Nehemías 12 | hard | Trimmed q1's correct answer to "Con Zorobabel y con Jesuá" (length tell). q6 avoids "De Salomón su hijo" as a distractor because v45 names him alongside David. q2 narrowed to Mathanías, the only name the verse attaches to the himnos. |
| nehemiah-quiz-part-13.json | Nehemías 13 | medium | After the verify sheet, two distractors were swapped out because they are true elsewhere in the same chapter: "Que se habían casado con extranjeras" (v23) and "Que habían abandonado el templo" (v11), plus "Que habían profanado el sábado" (v15-18). |
| esther-quiz-part-1.json | Ester 1 | easy | Banquets, Vasthi, Memucán. Distractor set for q2 shortened to place names so the correct answer "En Susán" is not the longest. |
| esther-quiz-part-2.json | Ester 2 | medium | Reworded q1 to "¿Al cuidado de quién...?" (more natural Spanish) and replaced the distractor "Jair" with "Zeres" so all four options are women's names. |
| esther-quiz-part-3.json | Ester 3 | medium | q5 and q6 both cite 3:7 but ask different facts (the month the lot was cast vs. the month that came out). |
| esther-quiz-part-4.json | Ester 4 | medium | q7 and q10 both cite 4:11 / 4:16 for different facts. The answer "Tres días, noche ni día" keeps the text's own phrasing as a short quote. |
| esther-quiz-part-5.json | Ester 5 | easy | Esther before the king, the first banquet, the horca of fifty cubits. |
| esther-quiz-part-6.json | Ester 6 | easy | Reordered q10's options so position B is used twice (validator rule 6). |

Unsure / worth a reviewer's eye:
- Nehemías 10, 11 and 12 are largely lists; the questions are necessarily about who or how many, which is what the text states, but they read drier than narrative chapters.
- Nehemías 9 q3 asks about Abram/Abraham strictly as the prayer reports it (v7); nothing outside that verse is used.
- Spelling kept exactly as rv1909 has it, including "Mardochêo", "Esther", "Assuero", "Vasthi", "Hachâlías", "Michâ", "Jerusalem", and "Bigthan" in Ester 6:2 vs. "Bigthán" in Ester 2:21.
