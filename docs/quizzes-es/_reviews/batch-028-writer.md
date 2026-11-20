# Batch 028 (es) - writer notes

Text: Reina-Valera 1909 (rv1909), printed with `scripts/print-chapter.mts` (book title "2 Reyes", used in the
title and in every `bibleReference`). 12 files, 2 Reyes 12-23, 10 questions each, all `status: draft`,
`isPremium: true` from the manifest. Validator (`SITE=intl --lang=es --bible-dir=../bijbelapi-data/data`):
0 errors, 0 warnings. Verify sheet re-read for all 12 files; the changes below were made during that pass.

## Files

- `2-kings-quiz-part-12.json` (medium) - OK. Q3 was rephrased ("¿Quién dirigía a Joas durante todo el tiempo
  en que hizo lo recto...?"); the first wording was awkward Spanish.
- `2-kings-quiz-part-13.json` (medium) - OK. Q4 distractors were lengthened ("Doscientos", "Mil quinientos")
  so the correct answer "Cincuenta" is no longer the longest option.
- `2-kings-quiz-part-14.json` (medium) - OK. Q7 distractors changed to "Trescientos codos"/"Setecientos codos"
  for the same length reason.
- `2-kings-quiz-part-15.json` (hard) - OK (king list with many conjurations). Distractors of Q6 and Q10
  lengthened. Names kept as printed: Zachârías, Sallum, Manahem, Pekaía, Peka, Tiglath-pileser, Phul.
- `2-kings-quiz-part-16.json` (medium) - OK. Q5 distractors lengthened.
- `2-kings-quiz-part-17.json` (medium) - OK. Q4 distractors lengthened.
- `2-kings-quiz-part-18.json` (medium) - OK. Q4 distractors lengthened.
- `2-kings-quiz-part-19.json` (medium) - OK. Q9 distractors changed to other large numbers so the written
  number "ciento ochenta y cinco mil" is not the longest answer by itself.
- `2-kings-quiz-part-20.json` (medium) - OK. Q1 had two distractors that are true elsewhere in the chapter
  ("subir al tercer día a la casa de Jehová", v5; "escoger una señal", v9); both were replaced with wording
  that does not occur in chapter 20.
- `2-kings-quiz-part-21.json` (medium) - OK. Distractors of Q4, Q6 and Q10 lengthened.
- `2-kings-quiz-part-22.json` (medium) - OK.
- `2-kings-quiz-part-23.json` (medium) - OK. Q5 distractors first used places this chapter does mention
  (el campo de Cedrón, el monte de la destrucción, el huerto de Uzza), where Josías did act; they were
  replaced with places absent from chapter 23, so no wrong answer is arguably correct.

## Doubts / judgement calls

- Numbers: every number used is written in the cited verse (cincuenta hombres de a caballo 13:7, cuatrocientos
  codos 14:13, mil talentos 15:19, trescientos talentos y treinta de oro 18:14, ciento ochenta y cinco mil
  19:35, quince años 20:6). A reviewer may want one or two traded for narrative questions.
- 2 Reyes 15 is a chain of short reign notices; it is marked hard. 2 Reyes 12-23 are otherwise all medium -
  no chapter in this batch felt like an "easy", famous-story chapter in the sense of the brief.
- Not covered for lack of room: 13:23 (the covenant with Abraham, Isaac and Jacob), 14:14 (the hostages taken
  to Samaria), 17:29-33 (the gods each nation made), 22:1 (Josías's mother Idida), 23:31-33 and 23:36-37
  (Joachâz's and Joacim's reign notices; 23:34 is used).
- 2 Reyes 22:3 Q2 ("¿A quién envió el rey a la casa de Jehová para tratar del dinero?") uses Asaía, Achbor and
  Ahicam as distractors. They are sent by the king later in the chapter (22:12-14) to ask Jehová, but not on
  the money errand of 22:3, which only Saphán is sent on.
- 2 Reyes 21 Q2 uses Mesalemeth (Amón's mother, 21:19) as a distractor for Manasés's mother Hepsiba (21:1):
  the name is in this chapter but belongs to a different king's mother.
- Archaic forms stay only inside exact quotes ("carro de Israel y su gente de á caballo", 13:14; "Da tu hija
  por mujer á mi hijo", 14:9); the questions themselves are in modern Spanish.
