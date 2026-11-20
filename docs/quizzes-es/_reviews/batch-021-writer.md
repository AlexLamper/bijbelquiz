# Batch 021 (es, rv1909) - writer notes

Source: `node --import tsx scripts/print-chapter.mts --lang=es --book="1 Samuel" --chapter=<n> --bible-dir=../bijbelapi-data/data`.
Book title from the print-chapter header: "1 Samuel" (used in the titles and in every bibleReference).
All 12 files written from scratch, 10 questions each, `status` "draft", `isPremium` true (from the manifest), `rewardXp` 100, `categorySlug` "old-testament".

Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es --bible-dir=../bijbelapi-data/data <files>` -> 12 files, 0 errors, 0 warnings.
Verify sheet read for all 12 files; every marked answer and explanation checked against the printed TEXT lines.

| file | chapter | difficulty | note |
|---|---|---|---|
| 1-samuel-quiz-part-5.json | 5 | medium | Ark in Dagon's house, plague on Asdod, ark sent to Gath and Ecron |
| 1-samuel-quiz-part-6.json | 6 | medium | Golden expiation, new cart with two cows, ark at Beth-semes |
| 1-samuel-quiz-part-7.json | 7 | medium | Ark in Abinadab's house, Mizpa, Eben-ezer |
| 1-samuel-quiz-part-8.json | 8 | medium | Samuel's sons as judges, the request for a king, the right of the king |
| 1-samuel-quiz-part-9.json | 9 | medium | Saul seeking the asses, the seer, the meal at the high place |
| 1-samuel-quiz-part-10.json | 10 | medium | Anointing of Saul, the signs, the lot at Mizpa |
| 1-samuel-quiz-part-11.json | 11 | medium | Naas against Jabes de Galaad, the oxen in pieces, Gilgal |
| 1-samuel-quiz-part-12.json | 12 | medium | Samuel's defence, the justices of Jehova, thunder in the wheat harvest |
| 1-samuel-quiz-part-13.json | 13 | medium | Three thousand chosen, Saul's burnt offering, no smith in Israel |
| 1-samuel-quiz-part-14.json | 14 | medium | Jonathan at the garrison, Saul's oath, the honey in the wood |
| 1-samuel-quiz-part-15.json | 15 | medium | War on Amalec, spared cattle, obedience better than sacrifices, Agag |
| 1-samuel-quiz-part-16.json | 16 | easy | Samuel sent to Isai, David anointed, the harp that gave Saul relief |

Points worth a second look (all left as supported by the text):
- Part 5: no question on verse 9 (Gath) to avoid a second question whose answer is "hemorroides"; verses 1-11 are covered.
- Part 6: verse 19's number (cincuenta mil y setenta) is not asked; the question on verse 19 asks only the stated reason ("habían mirado en el arca").
- Part 7 question 2: the text reads "santificaron á Eleazar su hijo" in the clause about Abinadab, so the answer is spelled "Eleazar, el hijo de Abinadab".
- Part 11 question 1 and part 15: spellings "Naas Ammonita", "Agag", "Telaim", "Cineo" exactly as rv1909 spells them.
- Part 12 question 6: the distractors avoid Moses/Aaron, whom verse 8 does name for the exodus, so that only verse 11's list (Jerobaal, Bedán, Jephté, Samuel) is correct.
- Part 13 question 6: Saul "ofreció el holocausto" (verse 9); the distractor about crossing the Jordan refers to other Hebrews in verse 7, not to Saul.
- Part 14 question 2: the answer quotes part of verse 6 ("salvar con poco número"); the verse reads "con multitud ó con poco número".
- Part 16 question 8: the distractor "una ampolla de aceite" is the wording of chapter 10; this chapter says "el cuerno del aceite".
