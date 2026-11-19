# Batch 012 (es) - writer notes

Números 16-27, rv1909, 12 files, 10 questions each, all `status: draft`, `isPremium: true`
(from the manifest), `categorySlug: old-testament`, `rewardXp: 100`.
Validator: 0 errors, 0 warnings on all 12. Verify sheet re-read question by question.

Difficulty: 22 easy (Balaam and the asna); 18, 19 and 26 hard (priestly dues, the law of the
red heifer, the census); the other eight medium.

One line per file:

- numbers-quiz-part-16.json - OK. Coré's parentage, the 250 men, the earth, the fire, Aarón's
  censer, 14.700 dead. Q7's distractors avoid fire/cloud wording because fire (v35) and the cloud
  (v42) do happen later in the chapter.
- numbers-quiz-part-17.json - OK. Two questions cite the same verse (17:2 and 17:5), each on a
  different fact in it, because the chapter has only 13 verses.
- numbers-quiz-part-18.json - OK. Q2 cites 18:2-3 so that "los Levitas que se juntaban con Aarón"
  is in the quoted text, not only implied by v3.
- numbers-quiz-part-19.json - OK. Q8 cites 19:14-15 so the "cuando alguno moría en la tienda"
  setting comes from the quoted text.
- numbers-quiz-part-20.json - OK. Q3 asks only about the three fruits the verse names
  (higueras, viñas, granadas), not the whole list of what the place lacked.
- numbers-quiz-part-21.json - OK. Q5 and Q6 both cite 21:9 (what the serpent was made of, and
  what happened to the one who looked at it).
- numbers-quiz-part-22.json - OK. Q5 cites 22:9-12 so that "la primera vez que vino a él" is
  visible in the text. Q8 cites 22:26-27 to fix the angostura, since the asna also pressed
  against the wall earlier (v25).
- numbers-quiz-part-23.json - OK. Q8 keeps "unicornio", the word rv1909 prints in 23:22.
- numbers-quiz-part-24.json - OK. Q5's correct answer is the verbatim line of 24:9. "ESTRELLA"
  is printed in capitals in 24:17; the question and answer use normal case ("Una estrella").
- numbers-quiz-part-25.json - OK. Nothing asked about what Phinees did to the two people beyond
  what 25:7-8 states; Q6 only asks who took the lance.
- numbers-quiz-part-26.json - OK, hardest of the batch. Three questions use written numbers
  (26:7, 26:51) exactly as spelled ("cuarenta y tres mil setecientos y treinta"). Q10 cites
  26:64-65 so the Sinaí census is in the quoted text.
- numbers-quiz-part-27.json - OK. The inheritance rules (27:8-11) are split over two questions
  (daughter; nearest kinsman) so no question needs facts from outside its cited verses.

Doubts worth a reviewer's eye:

- Spelling kept exactly as rv1909 prints it: Coré, Dathán, Abiram, Ishar, Peleth, Sehón, Og,
  Balac, Zippor, Phinees, Zimri, Cozbi, Salphaad, Jochâbed, Machîr, Jephone, Husoth, Sophim,
  Jesimón, Cittim, Assur. Numbers are written out in the old style ("veinte y cuatro mil"),
  which is how the text prints them, while the questions themselves are modern Spanish.
- Several wrong answers name people or places that appear elsewhere in Números but not in the
  cited verses (e.g. "Sera" in 20:1, "Cozbi" in 26:59, "Jezer"/"Helec" in 27:1). They are plainly
  wrong in the cited text; flag if that feels like outside knowledge.
- 26:59 says Jochâbed "nació á Leví en Egipto"; the question only asks whose wife she was and
  which children she bore, which the verse states directly.
- Some distractors were deliberately lengthened so the correct answer is not the longest option
  (validator length check). A few now read a little fuller than strictly needed, e.g.
  "A los altos de Baal, como la primera vez" in part-23 Q6.
