# Batch 020 (es) - writer notes

Text: Reina-Valera 1909 (rv1909), printed with `scripts/print-chapter.mts`. 12 files, 10 questions each,
all `status: draft`. Validator (`--lang=es --bible-dir=../bijbelapi-data/data`): 0 errors, 0 warnings.
Verify sheet re-read for all 12 files; everything below was changed or checked during that pass.

## Files

- `judges-quiz-part-18.json` (medium) - OK. Names kept as printed: Michâs, Lais, Sora, Esthaol, Chîriath-jearim.
- `judges-quiz-part-19.json` (medium) - OK. Q7 first cited six verses (19:16-21); rewritten to ask what the
  old man did, cited 19:20-21, so no question cites more than 3 verses.
- `judges-quiz-part-20.json` (hard) - OK. Q8 first said "por tercera vez"; the ordinal is not in 20:28, so the
  question now just asks what Jehová answered when they asked whether they would go out again.
- `judges-quiz-part-21.json` (medium) - OK. Q8 reframed from "en la solemnidad de Silo" (v19, not cited) to
  "con las hijas de Silo", which 21:20-21 do state.
- `ruth-quiz-part-1.json` (easy) - OK.
- `ruth-quiz-part-2.json` (medium) - OK. Q3 had "Jehová te bendiga" as a distractor; that is the reapers' own
  reply in the same verse, so it was replaced with wording that is not in the text.
- `ruth-quiz-part-3.json` (medium) - OK. Q5 answer now "Booz se estremeció y halló a Ruth a sus pies"; 3:8 says
  "la mujer que estaba acostada á sus pies" and 3:9 names Ruth in the same scene.
- `ruth-quiz-part-4.json` (medium) - OK. Q3 distractors first used the kinsman's own later words ("No puedo
  redimir", "Tómalo tú"), true elsewhere in the chapter; replaced with wording absent from the text.
- `1-samuel-quiz-part-1.json` (easy) - OK. Same fix in Q5, Q6 and Q8: distractors that were true somewhere else
  in the chapter (Elcana's "Haz lo que bien te pareciere", the naming of Samuel, Eli's "¿Hasta cuándo estarás
  borracha?") were swapped for wording that is nowhere in chapter 1.
- `1-samuel-quiz-part-2.json` (medium) - OK. Q1 distractors were other true lines of the same prayer; replaced.
  Q9 distractor repeated what 2:30 says Jehová "había dicho" and then revoked; replaced.
- `1-samuel-quiz-part-3.json` (easy) - OK. Q4 and Q7 distractors were Eli's own words from other verses of the
  chapter; replaced with plausible wording that does not occur in chapter 3.
- `1-samuel-quiz-part-4.json` (medium) - OK. Q10 distractor "Obed" came from Rut 4; replaced with a name from
  this chapter.

## Doubts / judgement calls

- Rut 4:18-22 (the genealogy from Phares to David) is not covered: ten facts fitted better in 4:1-17, and a
  genealogy question would duplicate Q10 (Obed, padre de Isaí).
- Jueces 20 is long and heavy on numbers; three questions use written numbers (400.000, 22.000, 4 meses). All
  are printed in the cited verses, but a reviewer may want one of them traded for a narrative question.
- Jueces 19 and 21 cover violent material; the questions stay on what the verses state (the journey, the
  hospitality, the oath, the 400 doncellas, the viñas) and avoid the assault itself except Q8 of chapter 19,
  which only reports that the men surrounded the house and beat at the doors.
- Quote-identification questions (1 Samuel 2:1, 3:5, 3:9, Rut 2:4) now use distractors invented in the same
  register rather than real lines spoken elsewhere in the chapter, so no wrong answer is "also true".
- 1 Samuel 3 is marked easy (famous call narrative) and Jueces 20 hard; the other ten are medium, except the
  two easy opening chapters Rut 1 and 1 Samuel 1.
