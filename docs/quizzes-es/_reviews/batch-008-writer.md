# Batch 008 (es, rv1909) - writer notes

12 files written from scratch: Éxodo 35-40, Levítico 1-6.
Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es --bible-dir=../bijbelapi-data/data <files>`
-> 0 errors, 0 warnings. Verify sheet re-read for all 12 files.

All 12 are construction lists, accounts or sacrificial law, so almost every question is a single
concrete detail (a material, a measure, a number, a name, a gesture). `difficulty`: `medium` for the
narrative-ish chapters (Éxodo 35-37, 39-40, Levítico 1), `hard` for the accounts chapter (Éxodo 38)
and for the sacrificial laws (Levítico 2-6). `isPremium` taken from the manifest; `status` draft.

## Per file

- exodus-quiz-part-35 - OK. Note: my first version asked what was forbidden on the sabbath (v3, fire),
  but v2 forbids *any* work, which made distractors like "hilar pelo de cabras" arguably also correct.
  Replaced with the v2 penalty question. Question 9 ("hijo de Uri") keeps "De Hur" as a distractor -
  the text calls Hur the grandfather, so it is plainly wrong.
- exodus-quiz-part-36 - OK. Question 7 says "las diez cortinas de lino" on purpose: v13 has fifty gold
  clasps for the linen curtains and v18 fifty metal ones for the goat-hair tent, so the question has to
  name which set. Same reason question 10 names the velo "de cárdeno, púrpura y carmesí" (v35), since the
  door curtain of v37 has five columns, not four.
- exodus-quiz-part-37 - OK. Question 6 asks the table's length (dos codos) and keeps "dos codos y medio"
  (the ark, v1) as a distractor.
- exodus-quiz-part-38 - OK. Two questions are long numbers (v24 gold, v26 counted men); distractors are
  other totals from the same chapter (plata, metal) so none of them is accidentally right.
- exodus-quiz-part-39 - OK. Question 8 quotes the rótulo verbatim as the text prints it,
  "SANTIDAD Á JEHOVÁ" (accents as in rv1909).
- exodus-quiz-part-40 - OK. Question 9 answers with "la gloria de Jehová lo tenía lleno" (v35); the cloud
  being over the tabernacle is in the explanation, not in the answer, because the verse distinguishes them.
- leviticus-quiz-part-1 - OK. Questions 7 (v9) and 8 (v13) are both about the washing/naming formula, but
  they ask different facts and cite the verse that carries each.
- leviticus-quiz-part-2 - OK. Question 5 cites 2:5-6 because the sartén offering is named in v5 and the
  partir/aceite instruction is in v6.
- leviticus-quiz-part-3 - OK. Questions reordered so they run through the chapter in verse order.
- leviticus-quiz-part-4 - OK. The four cases (sacerdote, congregación, príncipe, pueblo) each give one
  question; the animals are different per case, so the distractors are the other cases' animals, which is
  plainly wrong for the cited verse.
- leviticus-quiz-part-5 - OK. Questions 7 and 8 both cite 5:11; it is a long verse carrying two separate
  facts (the tenth of an epha, and no oil or incense).
- leviticus-quiz-part-6 - OK. Question 1 originally had "jura en vano" as a distractor, which v3 lists as
  one of the real offences; replaced with a fact from outside this chapter's list.

## Doubts (none blocking)

- Thin chapters: Éxodo 36, 37 and 38 are almost entirely dimensions and materials, so three to four
  questions per file are "how much / of what material". The numbers are all written in the verse cited.
- "metal" throughout is rv1909's word where modern versions say bronce; kept as the text spells it, in
  questions, answers and explanations.
- Éxodo 38 question 3 shortens the answer to "De los espejos de las que velaban" (the verse continues
  "á la puerta del tabernáculo del testimonio") to keep the correct answer from being the longest option.
- Levítico 3 question 2 likewise shortens "a la puerta del tabernáculo" (text: "del testimonio").
