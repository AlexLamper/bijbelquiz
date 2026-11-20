# Batch 031 (es) - writer notes

Source: Reina-Valera 1909 (rv1909) via `scripts/print-chapter.mts`, book titles
"1 Crónicas" / "2 Crónicas" exactly as the print-chapter header gives them.
Validator: `SITE=intl ... validate-quiz-json.ts --lang=es` -> 0 errors, 0 warnings for all 12 files.
Verify sheet read for every file; the fixes listed below were made after that reading.
All files `status: "draft"`, `rewardXp` 100, 10 questions, `categorySlug` "old-testament",
`isPremium` from docs/quiz-manifest.json (only 2 Crónicas 1 is free).

| file | chapter | difficulty | note |
|---|---|---|---|
| 1-chronicles-quiz-part-23.json | 1 Cr 23 | hard | Levite census and service orders; v5 has two groups of four thousand, so Q4 names the one "con los instrumentos". |
| 1-chronicles-quiz-part-24.json | 1 Cr 24 | hard | Mostly the twenty-four priestly lots; Q4/Q8 use the numbers written in the verse. |
| 1-chronicles-quiz-part-25.json | 1 Cr 25 | hard | Thin chapter (a list of twenty-four lots, each "doce"); Q3 and Q4 both cite v3, which is the only verse with more than a bare name. |
| 1-chronicles-quiz-part-26.json | 1 Cr 26 | hard | Porters and treasuries. Q6 explanation shortened to v11 only (Simri is named in v10, not in the cited verse). |
| 1-chronicles-quiz-part-27.json | 1 Cr 27 | hard | Monthly divisions and tribal chiefs; numbers kept as rv1909 writes them ("veinte y cuatro mil"). |
| 1-chronicles-quiz-part-28.json | 1 Cr 28 | medium | David's charge to Salomón. Q10 reworded for natural Spanish ("¿Qué palabras usó David al animar a Salomón a emprender la obra?"). |
| 1-chronicles-quiz-part-29.json | 1 Cr 29 | medium | Freewill offering, David's blessing, end of his reign. |
| 2-chronicles-quiz-part-1.json | 2 Cr 1 | easy | Gabaón and the request for wisdom; isPremium false per manifest. |
| 2-chronicles-quiz-part-2.json | 2 Cr 2 | medium | Q4 distractor about the heavens replaced, because v6 does say the heavens cannot contain God and that could read as arguably correct. |
| 2-chronicles-quiz-part-3.json | 2 Cr 3 | medium | Measurements of the house; the names Jachîn, Boaz, Parvaim, Moria spelled as rv1909 does. |
| 2-chronicles-quiz-part-4.json | 2 Cr 4 | medium | Q10 reworded: rv1909 v18 phrases the causality the other way round ("hizo ... en grande abundancia, porque no pudo ser hallado el peso"), so the question now asks what the text says rather than why. |
| 2-chronicles-quiz-part-5.json | 2 Cr 5 | medium | Ark brought in, the cloud fills the house. |

Unsure / worth a reviewer's eye:
- 1 Cr 25 is the thinnest chapter of the batch: two questions (Q3, Q4) cite the same verse (25:3) because the rest of the chapter is a repeating list of lots.
- 1 Cr 26 Q7/Q8 both ask about a direction of a lot (norte vs mediodía); the distractors are the directions given to other men in the same verses, so each is plainly wrong for the man asked about.
- Several distractors use facts from a neighbouring chapter (e.g. "mil becerros y mil carneros" from 1 Cr 29:21 in 2 Cr 5 Q5); they are plainly wrong for the cited verse but a reviewer may prefer wording with no echo at all.
