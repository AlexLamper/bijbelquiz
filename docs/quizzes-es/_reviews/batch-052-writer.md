# Batch 052 (es) - writer notes

Reina-Valera 1909, 12 chapters: Proverbios 27-31, Eclesiastés 1-7.
Validator (SITE=intl, --lang=es, --bible-dir=../bijbelapi-data/data): 0 errors, 0 warnings on all 12.
Verify sheet re-read for all 12; every marked answer is in the printed rv1909 TEXT line.

- proverbs-quiz-part-27.json - verses 1, 2, 5, 6, 7, 10, 17, 20, 22, 26. No issues.
- proverbs-quiz-part-28.json - verses 1, 5, 6, 9, 13, 15, 19, 20, 23, 28. No issues.
- proverbs-quiz-part-29.json - verses 1, 2, 3, 5, 11, 15, 17, 18, 23, 25. No issues.
- proverbs-quiz-part-30.json - verses 1, 6, 8, 9, 15, 16, 17, 19, 26, 33. Marked `hard`
  (Agur, the numerical sayings, proper names Jachê / Ithiel / Ucal spelled as rv1909 spells them).
- proverbs-quiz-part-31.json - verses 1, 4, 8, 10, 13, 15, 19, 20, 23, 30. Lemuel is named
  because verses 1 and 4 name him.
- ecclesiastes-quiz-part-1.json - verses 1, 2, 4, 5, 7, 9, 11, 13, 15, 18. isPremium false per manifest.
- ecclesiastes-quiz-part-2.json - verses 1, 2, 4-5, 6, 8, 11, 13, 14, 16, 24. Chapter 2 never names
  the speaker, so the questions say "el texto" / "el que habla" rather than el Predicador.
- ecclesiastes-quiz-part-3.json - verses 1, 2, 3, 4, 7, 8, 11, 13, 14, 20. The four "tiempo de"
  questions each ask about a different verse pair, so no two have the same answer.
- ecclesiastes-quiz-part-4.json - verses 1, 2, 4, 5, 6, 8, 9, 10, 12, 13.
- ecclesiastes-quiz-part-5.json - verses 1, 2, 4, 5, 7, 10, 12, 15, 18, 19.
- ecclesiastes-quiz-part-6.json - verses 1, 2, 3, 4, 5, 6, 7, 9, 10, 11. Thin chapter (12 verses):
  the ten questions take one statement per verse and nothing beyond the verse cited.
- ecclesiastes-quiz-part-7.json - verses 1, 2, 3, 5, 6, 8, 10, 12, 19, 29.

Answer positions are mixed per file (A/B/C/D each 2-3 times, no A-B-C-D rotation, no run over 2).
Nothing was left uncertain; no question relies on a fact outside the cited verses.
