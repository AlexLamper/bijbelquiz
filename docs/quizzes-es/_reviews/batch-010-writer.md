# Batch 010 (es) - writer notes

Text: Reina-Valera 1909 (rv1909), printed with `scripts/print-chapter.mts`. 12 files written from
scratch, all `status: draft`, `rewardXp` 100, 10 questions each, `categorySlug` old-testament,
`isPremium` from the manifest. Validator: 0 errors, 0 warnings.

| file | chapter | difficulty | note |
|---|---|---|---|
| leviticus-quiz-part-19.json | Levítico 19 | hard | law chapter; questions on v2, 9-10, 13, 14, 18, 19, 23-25, 28, 32, 34 |
| leviticus-quiz-part-20.json | Levítico 20 | hard | questions kept to Moloch, adivinación, santidad, tierra, animales limpios (v2, 4-5, 6, 7-8, 9, 22, 24, 25, 26, 27); the sexual-penalty verses 10-21 are deliberately not quizzed |
| leviticus-quiz-part-21.json | Levítico 21 | hard | priestly rules; v1, 3, 5, 6, 7, 9, 11, 12, 13-14, 21-23 |
| leviticus-quiz-part-22.json | Levítico 22 | hard | v4, 6-7, 8, 10, 12, 14, 19-20, 23, 27, 30 |
| leviticus-quiz-part-23.json | Levítico 23 | medium | feast calendar, well known; v3, 5, 6, 10-11, 13, 16, 24, 27, 32, 42-43 |
| leviticus-quiz-part-24.json | Levítico 24 | medium | lamps/tortas plus the narrative of v10-23 |
| leviticus-quiz-part-25.json | Levítico 25 | hard | sábado de la tierra and jubileo; v3-4, 5, 8, 9, 10, 20-21, 23, 29, 36-37, 55 |
| leviticus-quiz-part-26.json | Levítico 26 | medium | blessing/curse chapter; v1, 4, 6, 8, 11-12, 16, 19, 26, 34, 42 |
| leviticus-quiz-part-27.json | Levítico 27 | hard | valuations; v3, 4, 8, 10, 13, 16, 21, 26, 32, 34 |
| numbers-quiz-part-1.json | Números 1 | hard | census; v1, 3, 7, 12, 21, 27, 35, 46, 49, 50 |
| numbers-quiz-part-2.json | Números 2 | hard | camp order; v2, 3, 9, 10, 14, 17, 18, 25, 31, 33 |
| numbers-quiz-part-3.json | Números 3 | hard | Levite census and charges; v2, 4, 6, 12, 15, 17, 22, 31, 38, 39 |

## Doubts / things to check

- Números 2:14 prints the chief of Gad as "Eliasaph hijo de **Rehuel**", while Números 1:14 prints
  "Eliasaph hijo de **Dehuel**". The question in numbers-quiz-part-2 cites 2:14 and uses Rehuel, as
  that chapter spells it; numbers-quiz-part-1 does not ask about Gad at all.
- Números 2:25 prints "Ahiezer hijo de **Amisaddai**" where 1:12 prints "**Ammisaddai**". The Dan
  question in numbers-quiz-part-1 cites 1:12 and uses the double-m spelling of that verse.
- Levítico 24:11 names the mother "Selomith, hija de Dribi" (Dribi is the grandfather); the question
  asks only for her tribe (Dan), so no confusion with Dribi.
- Levítico 20: nine of the chapter's verses are sexual-offence penalties. They are skipped on purpose,
  so the quiz draws on the remaining verses; the chapter still gave 10 clean facts.
- Levítico 19 verse 19 forbids "mistura de semillas"; no question asks about mixed seed, because any
  concrete pair of crops as a distractor would arguably also be a mixture.
- Several chapters are pure legislation (Levítico 22, 25, 27, Números 1-3), so a number of questions
  are necessarily numeric (siclos, counts per tribe). Every number asked is written in the verse cited.
- Números 1 and Números 2 both end on "the Levites were not counted"; the questions use different
  verses (1:49 about the tribe of Leví, 2:33 about the Levitas) and different answer wording.
