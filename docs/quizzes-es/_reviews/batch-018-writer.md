# Batch 018 (es) - writer notes

Text: Reina-Valera 1909 (rv1909), printed by `scripts/print-chapter.mts`. 12 files, all `status: draft`,
`categorySlug: old-testament`, `rewardXp: 100`, 10 questions each. Validator: 0 errors, 0 warnings.
Verify sheet read back for all 12 files; every marked answer is in the printed TEXT line of its reference.

| file | chapter | difficulty | note |
|---|---|---|---|
| joshua-quiz-part-18.json | Josué 18 | hard | Allotment chapter; questions taken from the narrative (v1-11) plus the two explicit identifications in the city list (Luz = Beth-el, Jebus = Jerusalem). |
| joshua-quiz-part-19.json | Josué 19 | hard | Almost only tribe-and-city lists. Three questions share the "which tribe got the n-th lot" shape because that is what the chapter says; the rest come from v9, v15, v26, v47, v49-51. |
| joshua-quiz-part-20.json | Josué 20 | medium | Only 9 verses, so three questions come from v7 (Hebrón, Sichêm, Cedes) - different facts, different answers. |
| joshua-quiz-part-21.json | Josué 21 | hard | Levitical-city lists; used the framing verses (v1-7), the two named exceptions (v11-12), two refuge cities and the closing summary (v41, v45). |
| joshua-quiz-part-22.json | Josué 22 | medium | Narrative, straightforward. |
| joshua-quiz-part-23.json | Josué 23 | medium | All ten from Josué's speech; the speaker is named because v1-2 name him. |
| joshua-quiz-part-24.json | Josué 24 | easy | Famous chapter; q7 quotes v15 ("yo y mi casa serviremos á Jehová"). |
| judges-quiz-part-1.json | Jueces 1 | medium | isPremium false (per manifest). |
| judges-quiz-part-2.json | Jueces 2 | medium | - |
| judges-quiz-part-3.json | Jueces 3 | medium | - |
| judges-quiz-part-4.json | Jueces 4 | easy | q2 asks two numbers from one verse (nuevecientos carros, veinte años); both are written in v3. |
| judges-quiz-part-5.json | Jueces 5 | hard | Poetry: every question asks what the lines say (who sings, what is addressed, what the images state), not who wrote it. v1 names the singers, so Débora and Barac are named. |

## Doubts / things a reviewer should look at

- Spelling follows rv1909 exactly, including its inconsistencies: "Philisteos" in Jueces 3:3 but
  "Filisteos" in Jueces 3:31 (q10 uses "Filisteos", matching the verse it cites); "Issachâr",
  "Chîriath-arba", "Sichêm", "Nephtalí", "Aod", "Samgar", "Othoniel", "Chusan-risathaim", "Achân".
- Josué 20 q7 uses "Hebrón" as a distractor while q6's correct answer is "Hebrón"; the two questions
  ask different things (monte de Ephraim vs. the other name of Chîriath-arba) and Hebrón is plainly
  wrong for the Ephraim question (v7 puts it in the monte de Judá).
- Jueces 2 q10 has "Para que enseñasen la guerra a sus hijos" as a distractor. That reason appears in
  Jueces 3:2, not in Jueces 2:22-23, so it is wrong for the cited verses - but a reader who knows the
  next chapter may hesitate. Flagging it in case the reviewer wants it swapped.
- Josué 19 q9/q10 distractors are place and person names taken from the same chapter (Baalath-beer,
  Chisiloth-tabor, Allón-saananim; Phinees) so that the wrong options are not obviously short.
- Jueces 1 and Jueces 5 both have "setenta"/number distractors invented as plausible wrong numbers;
  every correct number ("diez mil", "cuarenta", "seiscientos", "ciento y diez", "cuarenta y ocho",
  "doce", "diez", "siete", "tres") is written in the cited verse.
- No chapter in this batch was too thin for 10 questions, but Josué 19 and 21 are mostly lists, so the
  questions are necessarily about lots, counts and city names rather than events.
