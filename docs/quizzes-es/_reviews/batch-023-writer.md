# Batch 023 (es, rv1909) - writer notes

Language: es, Reina-Valera 1909. Books as printed by `print-chapter`: "1 Samuel", "2 Samuel".
All 12 files written from scratch, 10 questions each, `status` "draft", `rewardXp` 100,
`categorySlug` "old-testament", `isPremium` from the manifest.
Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es --bible-dir=../bijbelapi-data/data` -> 0 errors, 0 warnings on all 12.
Verify sheet read for all 12; every marked answer and explanation checked against the printed TEXT lines.

| file | chapter | difficulty | isPremium | note |
|---|---|---|---|---|
| 1-samuel-quiz-part-29.json | 1 Samuel 29 | medium | true | Short chapter (11 verses); all 10 questions from v1-11. |
| 1-samuel-quiz-part-30.json | 1 Samuel 30 | medium | true | Numbers (400/200 men, three days and nights) are written in the verses. |
| 1-samuel-quiz-part-31.json | 1 Samuel 31 | medium | true | Short chapter (13 verses); questions spread over v1-13. |
| 2-samuel-quiz-part-1.json | 2 Samuel 1 | medium | false | Q8 cites 1:14-15 (reproach + order to kill) since both verses carry the answer. |
| 2-samuel-quiz-part-2.json | 2 Samuel 2 | medium | true | Q3 cites 2:4-5: v4 names Jabes de Galaad, v5 the message David sent. |
| 2-samuel-quiz-part-3.json | 2 Samuel 3 | medium | true | Q3 asks whose daughter Maachâ was; the distractor appositives (Rispa's father Aja, Abner's father Ner) are chapter facts but plainly wrong as the answer. |
| 2-samuel-quiz-part-4.json | 2 Samuel 4 | medium | true | Thin chapter (12 verses); 10 questions, all literal (v1-12). |
| 2-samuel-quiz-part-5.json | 2 Samuel 5 | medium | true | Q6 kept to v7 only ("la fortaleza de Sión, la cual es la ciudad de David"); the naming in v9 is not cited. |
| 2-samuel-quiz-part-6.json | 2 Samuel 6 | medium | true | Q2 distractor "carro nuevo, de la casa de Obed-edom" is wrong on the house, which the cited verse states. |
| 2-samuel-quiz-part-7.json | 2 Samuel 7 | medium | true | Q6 cites 7:12-13 because "la simiente" (v12) and "El edificará casa" (v13) belong together. |
| 2-samuel-quiz-part-8.json | 2 Samuel 8 | hard | true | Campaign numbers and the list of officials; marked hard. Answer spread A=2 B=2 C=2 D=4. |
| 2-samuel-quiz-part-9.json | 2 Samuel 9 | medium | true | All ten facts literal (v1-13). |

Unsure / judgement calls:
- Spelling follows rv1909 exactly, including Achîs, Michâl, Michâ, Machîr, Maachâ, Melchîsua, Rechâb, Hadad-ezer, Benahía, Beth-san, Pérez-uzza, Baal-perasim.
- Some distractors use names from neighbouring chapters (Dagón, Egla, Paltiel, Abital, Haggith); none of them is stated by the cited verses, so none is also-correct.
- 1 Samuel 29, 31 and 2 Samuel 4 are short; the ten questions there are closely spaced but each covers a different fact.
