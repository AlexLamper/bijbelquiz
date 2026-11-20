# Batch 017 - review (es, rv1909, Josué 6-17)

Independent review of the 12 manifest batch-17 files (`joshua-quiz-part-6` .. `joshua-quiz-part-17`).
Every question checked against the verify-sheet TEXT lines.
Validator (`--lang=es --bible-dir=../bijbelapi-data/data`): 0 errors, 0 warnings on all 12.
Answer-letter spread is 2-3 per letter in all 12 files; no quiz has the correct answer
systematically as the longest option. Slug, title, isPremium and status untouched.

## Per quiz

- joshua-quiz-part-6: OK
- joshua-quiz-part-7: FIXED: question 5 asked "cuando el corazón del pueblo se disolvió", a fact from
  7:5 while only 7:6 was cited; stem reworded to the defeat before the men of Hai and the reference
  widened to Josué 7:5-6 (explanation now also names the elders, as 7:6 does).
- joshua-quiz-part-8: OK
- joshua-quiz-part-9: OK
- joshua-quiz-part-10: OK
- joshua-quiz-part-11: OK
- joshua-quiz-part-12: OK
- joshua-quiz-part-13: OK
- joshua-quiz-part-14: OK
- joshua-quiz-part-15: FIXED: question 3 asked which city lay "al lado del Jebuseo", but 15:8 says the
  border passes beside the Jebusite and that this (the Jebusite city) is Jerusalem - the marked answer
  was right while the stem misstated the verse; reworded to ask which city the text names there.
  Question 9 took "hacia el término de Edom" from 15:21 although only 15:32 was cited; stem and
  explanation now keep to 15:32 (Lebaoth, Silim, Aín, Rimmón - twenty-nine cities).
- joshua-quiz-part-16: OK
- joshua-quiz-part-17: OK

Questions changed: 3 (part-7 q5, part-15 q3, part-15 q9).

## Notes (checked, no change made)

- part-12 q6 ("la mar de la llanura") keeps "la mar de Cinneroth" as a distractor; both seas stand in
  12:3, but only the Salt Sea is called "la mar de la llanura", so the distractor is not defensible.
- part-7 q8/q9, part-16 q1/q2 each cite the same verse twice, but ask two separate facts from it.
- part-16 is thin (ten verses of boundary description); its seven border questions are all literal.
- The task note about `1-chronicles-quiz-part-17.json` failing the answer-letter spread does not
  belong to this batch: manifest batch 17 is Josué 6-17. That file was left untouched.
