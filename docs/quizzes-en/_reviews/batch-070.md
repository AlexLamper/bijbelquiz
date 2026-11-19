# Batch 070 review (en)

Reviewer pass over the 12 manifest entries of batch 70 (Micah 4-7, Nahum 1-3, Habakkuk 1-3,
Zephaniah 1-2), World English Bible. Every question checked against the printed verse text with
`quiz-verify-sheet.mts`, plus the full printed chapters for each book to confirm no wrong answer is
also true elsewhere in the chapter.

- micah-bible-quiz-part-4.json - OK
- micah-bible-quiz-part-5.json - OK
- micah-bible-quiz-part-6.json - OK
- micah-bible-quiz-part-7.json - OK
- nahum-bible-quiz-part-1.json - OK
- nahum-bible-quiz-part-2.json - OK
- nahum-bible-quiz-part-3.json - OK
- habakkuk-bible-quiz-part-1.json - OK
- habakkuk-bible-quiz-part-2.json - OK
- habakkuk-bible-quiz-part-3.json - OK
- zephaniah-bible-quiz-part-1.json - OK
- zephaniah-bible-quiz-part-2.json - OK

Questions changed: 0.

## Checks performed

- Marked answer stated in the cited verses: all 120 questions pass.
- No wrong answer also true in this text: checked each distractor against the whole chapter.
  Near-misses reviewed and accepted, because the wording asked for is not the wording of the
  distractor: Nahum 2:2 ("Jacob's" vs "Israel's" - Israel is not offered as an option),
  Nahum 3:9 (Put and Libya are the "helpers", Cush and Egypt the "boundless strength"),
  Nahum 3:7 ("Nineveh is laid waste" vs the distractor "Who is like Nineveh?", which the text does
  not contain), Micah 7:5 (neighbor is the cited clause; "friend" is not offered),
  Micah 4:6 (the correct answer is one of the three things gathered; no distractor is another).
- Explanations add nothing beyond the cited verses; no history, dates, theology or cross-references.
- References point at the verses that contain the answer in all 120 cases.
- Names and numbers spelled as in this text (Bethlehem Ephrathah, No-Amon, Cushan, Malcam,
  Elkoshite, Cherethites); "seven shepherds" is written in Micah 5:5, so the only "how many"
  question is allowed.
- Nineveh is named in Nahum 2:8 and 3:7, so the third-person "her/she" questions in Nahum 2-3 have
  an antecedent in the chapter; Habakkuk and Zephaniah questions name only people the chapter names.
- English is modern and natural; quotes from the text are verbatim. No en/em dashes, no emoji,
  no curly quotes, no double spaces.
- Structure: 10 questions each, 4 answers with exactly 1 correct, rewardXp 100,
  categorySlug old-testament, status draft (unchanged), isPremium matches the manifest,
  answer spread 2-3 per letter with no repeated letter in a row, no two questions with the same
  correct answer.

## Validator

`SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=en --bible-dir=../bijbelapi-data/data <12 files>`
-> 12 files checked, 0 errors, 0 warnings.
