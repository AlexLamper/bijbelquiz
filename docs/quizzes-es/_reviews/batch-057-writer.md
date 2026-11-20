# Batch 057 (es) - writer notes

Language: es (Reina-Valera 1909, rv1909). Book titles from print-chapter: "Isaías" and "Jeremías".
All 12 chapters of batch 57 (Isaías 36-40, Jeremías 1-7) written from scratch; none of the files
existed before. Validator (SITE=intl, --lang=es, --bible-dir=../bijbelapi-data/data): 0 errors,
0 warnings on all 12. status "draft", rewardXp 100, categorySlug "old-testament",
difficulty "medium" for all 12, isPremium from the manifest (false only for jeremiah-quiz-part-1).
Answer spread is A/B/C/D with 2-3 each per file; the per-file sequences are all different and none
is an A-B-C-D rotation (e.g. CADBACBDAC, DCBACDABBC, ABDCBDCACB).

- isaiah-quiz-part-36.json - Isaías 36. Verses 1, 2, 3, 6, 8, 11, 13, 17, 21, 22.
- isaiah-quiz-part-37.json - Isaías 37. Verses 1, 2, 7, 9, 14, 19, 22, 29, 30, 36.
- isaiah-quiz-part-38.json - Isaías 38. Verses 1, 2, 5, 8, 10, 12, 14, 17, 19, 21.
- isaiah-quiz-part-39.json - Isaías 39. Verses 1 (3x), 2 (2x), 3, 4, 6, 7, 8.
- isaiah-quiz-part-40.json - Isaías 40. Verses 1, 2, 3, 4, 6-7, 8, 11, 12, 22, 31.
- jeremiah-quiz-part-1.json - Jeremías 1. Verses 1, 2, 5, 6, 9, 10, 11, 13, 16, 18.
- jeremiah-quiz-part-2.json - Jeremías 2. Verses 2, 3, 7, 8, 11, 13, 18, 22, 27, 32.
- jeremiah-quiz-part-3.json - Jeremías 3. Verses 1, 3, 4, 6, 8, 10, 14, 15, 17, 22.
- jeremiah-quiz-part-4.json - Jeremías 4. Verses 3, 4, 6, 7, 9, 11, 13, 22, 24, 31.
- jeremiah-quiz-part-5.json - Jeremías 5. Verses 1, 3, 5, 6, 8, 12, 14, 15, 22, 27.
- jeremiah-quiz-part-6.json - Jeremías 6. Verses 1, 2, 7, 10, 13, 14, 16, 17, 20, 30.
- jeremiah-quiz-part-7.json - Jeremías 7. Verses 2, 4, 6, 11, 12, 16, 18, 20, 31, 32.

Choices and points worth a second look by the reviewer:

- Names and numbers are spelled exactly as rv1909 spells them: Ezechîas, Sennachêrib, Rabsaces,
  Lachîs, Eliacim, Sebna, Joah, Tirhakah, Merodach-baladán, Achâz, Anathoth, Beth-hacchêrem,
  Chîttim, Sedechîas, Topheth, "ciento ochenta y cinco mil", "dos mil caballos", "quince años",
  "diez grados", "el año catorce", "el año décimotercio".
- Questions are modern Spanish; only short quotes keep the old wording verbatim inside the
  explanation or as an answer ("Paz, paz", "Templo de Jehová, templo de Jehová", "No escucharemos",
  "Vuélvete a mí", "Consolaos, consolaos", "Barred camino a Jehová").
- Isaías 39 has only 8 verses, so verse 1 carries three questions (who sent the letters, from which
  kingdom, and why) and verse 2 two (what he showed them, and which precious things besides the
  silver and gold). Each question asks a different fact of the verse and no two questions in the
  file share an answer.
- Jeremías 1 and 7 name the speaker only where this chapter names him: Jeremías 1:1 and 1:11 print
  the name, Jeremías 7:1 prints it; elsewhere in the Jeremías files the questions say "el profeta"
  or "el verso" rather than putting a name in.
- In the Isaías files Rabsaces, Ezechîas and Isaías are named because chapters 36-39 name all three.
- Several distractors re-use an image from another verse of the same chapter or from a neighbouring
  chapter, always one that is plainly wrong for the cited verse: "Su freno" (Isaías 37:29 puts the
  freno in the labios, not in the nariz), "Con su palmo" / "Con tres dedos" / "Con balanza"
  (Isaías 40:12 uses each for something other than the aguas), "Como hojarascas" (Isaías 40:24,
  while 40:22 says langostas), "Una olla que hierve" in the Jeremías 1:11 question (that is the
  second vision, 1:13), "El lobo del desierto" / "El tigre de las ciudades" in Jeremías 4:7 (those
  animals are Jeremías 5:6). I deliberately avoided a distractor that the cited verse itself, or the
  same verse's subject, states as true.
- Jeremías 6:17 asks what they answered the atalayas ("No escucharemos"). The reply in 6:16
  ("No andaremos") is NOT used as a distractor there, to avoid an answer that is true elsewhere in
  the chapter; the three distractors of that question do not occur in the chapter at all.
- Isaías 40 verses 6-7 and verse 8 carry one question each: the first on what toda carne is compared
  with, the second on what permanece para siempre. The references are split (40:6-7 and 40:8) so
  each question cites only the verses that contain its own answer.
- Isaías 40 asks only what the lines say (the images, the commands, who is addressed); no question
  asks about authorship, and no general moral is drawn that the chapter does not spell out.
- Jeremías 2, 3, 4, 5 and 6 are prophetic poems; every question asks one single verse (or verse
  pair) and the ten questions run from near the first verse to near the last.
- difficulty is "medium" everywhere: none of these chapters is a famous story, a genealogy or a law
  list, and all ten answers per file are stated literally in the cited verses.
