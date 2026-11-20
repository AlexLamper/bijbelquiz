# Batch 035 - writer notes (es, rv1909)

Source: `print-chapter.mts --lang=es` only. Book titles from the print header: **Esdras**, **Nehemías**.
Validator: `SITE=intl ... validate-quiz-json.ts --lang=es` -> 0 errors, 0 warnings for all 12 files
(spread A=3 B=3 C=2 D=2 in every file). Verify sheet read for all 12; every answer, name and number
checked against the printed TEXT lines. `status` stays `draft`.

| file | chapter | difficulty | note |
|---|---|---|---|
| ezra-quiz-part-6.json | Esdras 6 | medium | Decree found in Achmetta, Darius' order, dedication and passover (vv. 1-22). |
| ezra-quiz-part-7.json | Esdras 7 | medium | Genealogy only used for the father (Seraías) and for "Aarón, primer sacerdote"; rest from the letter. |
| ezra-quiz-part-8.json | Esdras 8 | medium | The family list (vv. 1-14) is only used for the reign of Artajerjes; the rest is narrative. |
| ezra-quiz-part-9.json | Esdras 9 | medium | Q9 cites 9:11-12 because the phrase "por mano de tus siervos los profetas" is in v. 11. |
| ezra-quiz-part-10.json | Esdras 10 | medium | Narrative only; the long name list (vv. 18-44) is used only for the ram offered in v. 19. Q9 cites 10:16-17 (both dates). |
| nehemiah-quiz-part-1.json | Nehemías 1 | easy | 11 verses; ten questions spread over all of them. isPremium false per manifest. |
| nehemiah-quiz-part-2.json | Nehemías 2 | medium | Q5 keeps the text's own parenthesis ("la reina estaba sentada junto a él"). |
| nehemiah-quiz-part-3.json | Nehemías 3 | hard | A builders' list; questions ask who built what and the named gates/towers. Q3 cites 3:1-2 ("junto a ella"). |
| nehemiah-quiz-part-4.json | Nehemías 4 | medium | Mockery, conspiracy, the guard and the sword in one hand. |
| nehemiah-quiz-part-5.json | Nehemías 5 | medium | Usury, the centésima parte, the twelve years as governor, the daily table. |
| nehemiah-quiz-part-6.json | Nehemías 6 | medium | Ono, the open letter, Semaías hired for salary, the wall in 52 days. |
| nehemiah-quiz-part-7.json | Nehemías 7 | hard | Mostly a census. Q2 cites 7:2-3 because the orders themselves are in v. 3; only two number questions from the list (Paros, the total, the Tirsatha's vestments). |

Unsure / worth a reviewer's eye:
- Esdras 8 Q2: the text says he searched "entre el pueblo y entre los sacerdotes" and found none of the
  sons of Levi; the distractor "Ninguno de los sacerdotes" is therefore wrong, but it is the closest call
  in the batch.
- Nehemías 7 Q2: "Mandé á mi hermano Hanani, y á Hananías" is rendered as giving them his orders about the
  gates (v. 3), not as appointing them governors, which the text does not say.
- Spelling kept exactly as rv1909 prints it, including Sechânías, Achmetta, Hachâlías, Samballat/Sanballat
  (both spellings occur in Nehemías 2) and Arabes without accent.
