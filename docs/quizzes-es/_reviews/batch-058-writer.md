# Batch 058 (es) - writer notes

Jeremías 8-19, Reina-Valera 1909 (rv1909), 12 files, all `status: draft`, `isPremium: true`,
`difficulty: medium`, title/reference book name "Jeremías" exactly as print-chapter prints it.

Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es` -> 0 errors, 0 warnings
on all 12 files. Verify sheet read for every question; every answer and explanation traced back to the
printed TEXT lines.

| file | note |
|---|---|
| jeremiah-quiz-part-8.json | OK. Q1 answer kept to "reyes, príncipes y profetas" because v1 lists more groups than one option can hold. |
| jeremiah-quiz-part-9.json | OK. |
| jeremiah-quiz-part-10.json | OK. Q3 distractor "ni hablar ni oír" avoided because v5 does say "no hablan". |
| jeremiah-quiz-part-11.json | OK. |
| jeremiah-quiz-part-12.json | OK. The speaker of v5 and v8 is not named in the chapter, so those two questions say "en el versículo 5" / "quien habla" instead of naming Jehová. |
| jeremiah-quiz-part-13.json | OK. |
| jeremiah-quiz-part-14.json | OK. |
| jeremiah-quiz-part-15.json | OK. Q2 is about the "cuatro géneros" of v3 only; the list of v2 (muerte, cuchillo, hambre, cautividad) is deliberately not reused as a distractor in the same wording. |
| jeremiah-quiz-part-16.json | OK. Q2 and Q3 both ask about a forbidden house (luto in v5, convite in v8) - different verses, different answers. |
| jeremiah-quiz-part-17.json | OK. |
| jeremiah-quiz-part-18.json | OK. Jeremías is named in Q9 because v18 names him. |
| jeremiah-quiz-part-19.json | OK. Jeremías is named in Q10 because v14 names him. |

Unsure / worth a second eye:
- Jeremías 10:13 (part-10, Q7): the correct answer is a long clause; distractors were lengthened to
  match so the length tell stays under the validator threshold.
- Names kept in rv1909 spelling: Ezechîas, Anathoth, Uphaz, Tarsis, Topheth, Hinnom, Jerusalem, Sión.
- Correct-answer positions are mixed per quiz (no A-B-C-D rotation); the per-file spread is printed by
  the validator and is 2-3 per position everywhere.
