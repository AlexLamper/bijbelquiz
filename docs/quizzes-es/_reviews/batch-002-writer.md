# Batch 002 (es, Génesis 13-24) - writer notes

Text: rv1909 only, printed with `scripts/print-chapter.mts --lang=es`. Validator: 12 files, 0 errors,
0 warnings. Verify sheet re-read for all 120 questions; every marked answer is in the printed TEXT lines.

- genesis-quiz-part-13.json - OK. Covers v1-v18.
- genesis-quiz-part-14.json - OK. rv1909 spells the king "Chêdorlaomer" and in v1 his kingdom is "Elá",
  while v9 calls him "rey de Elam"; I cite v9 only for the "cuatro reyes contra cinco" count and never
  ask which land was his, to avoid that inconsistency in the text itself.
- genesis-quiz-part-15.json - OK. Q8 cites v11 ("ojeábalas Abram"); the answer is given as "Las espantaba"
  and the explanation says "ojeaba, es decir, las espantaba", since "ojear" is not current Spanish.
- genesis-quiz-part-16.json - OK. Q10 asks the name of the well (v14, "Pozo del Viviente que me ve");
  the three distractors are invented well names built from places this chapter does name (Agar, Bered,
  camino del Sur), because the real name is the only one in the text.
- genesis-quiz-part-17.json - OK. Two questions touch Ismael (v20 promise, v25 age at circumcision);
  different facts, different answers.
- genesis-quiz-part-18.json - OK. Q7 uses the chapter's own question from v14 verbatim; one distractor is
  Abraham's words from v23, which is plainly not what Jehová asked in v13-14.
- genesis-quiz-part-19.json - OK, with a choice: I left v4-v9 (the crowd at the door and Lot's offer of his
  daughters) and v30-v38 (Lot's daughters) out of the questions as unsuitable quiz material, except the
  neutral closing fact of v37 (Moab, father of the Moabitas), so the end of the chapter is still covered.
- genesis-quiz-part-20.json - OK. Q9 keeps rv1909's "mil monedas de plata" (v16) and uses "cuatrocientos
  siclos de plata" (the figure from Génesis 23) only as a distractor.
- genesis-quiz-part-21.json - OK. Sara's words in v6 are "Dios me ha hecho reir" (rv1909 spelling, quoted
  verbatim in the explanation); the answer option uses modern "reír".
- genesis-quiz-part-22.json - OK (isPremium false, per the manifest). Q10 comes from the closing genealogy
  (v20-24) so the end of the chapter is covered.
- genesis-quiz-part-23.json - OK. I did not ask how Abraham called himself in v4 ("peregrino y advenedizo"),
  because "príncipe de Dios" (v6, the Hethites' words about him) would be a half-true distractor.
- genesis-quiz-part-24.json - OK. Long chapter (67 verses); the ten questions run v3 to v67. Q5 keeps the
  text's own relations (Rebeca born to Bethuel, Milca the wife of Nachôr).

Doubts worth a second pair of eyes:
1. Several distractors had to be padded ("...de toda su hacienda", "...de aquella tierra") only to keep the
   validator's length-tell check under 1.6x; the padding never makes them true in the chapter, but a reviewer
   may want to reword some of them more naturally.
2. Distractors sometimes borrow a true fact from a neighbouring chapter (e.g. "el polvo de la tierra" from
   Génesis 13 in the Génesis 22 question). They are plainly wrong for the cited verses, but that is a
   judgement call.
3. Génesis 19 deliberately does not cover v4-9 and v30-36 (see above), so the "whole chapter" rule is met
   only in the sense of beginning, middle and end, not of every passage.
