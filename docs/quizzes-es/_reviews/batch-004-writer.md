# Batch 004 (es) - writer notes

Génesis 37-48, Reina-Valera 1909 (rv1909), 12 files, 10 questions each, all `status: draft`.
Validator: `SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=es --bible-dir=../bijbelapi-data/data <files>`
-> 0 errors, 0 warnings. Verify sheet re-read for all 12 files.

| file | chapter | difficulty | isPremium | note |
|---|---|---|---|---|
| genesis-quiz-part-37.json | 37 | easy | false | famous story, plenty of material |
| genesis-quiz-part-38.json | 38 | medium | true | names only as rv1909 spells them (Hira, Thamar, Sela, Phares, Zara, Chezib, Timnath) |
| genesis-quiz-part-39.json | 39 | easy | true | q6 is phrased around "lo que la mujer de su señor le pedía" rather than quoting v7 |
| genesis-quiz-part-40.json | 40 | medium | true | - |
| genesis-quiz-part-41.json | 41 | easy | true | long chapter; v17-24 (Faraón retelling the same dreams) deliberately not re-asked |
| genesis-quiz-part-42.json | 42 | medium | true | - |
| genesis-quiz-part-43.json | 43 | medium | true | - |
| genesis-quiz-part-44.json | 44 | medium | true | - |
| genesis-quiz-part-45.json | 45 | easy | true | - |
| genesis-quiz-part-46.json | 46 | hard | true | mostly the genealogy of v8-27; four of the ten questions are name/number lists |
| genesis-quiz-part-47.json | 47 | medium | true | - |
| genesis-quiz-part-48.json | 48 | medium | true | - |

## Doubts and decisions

- Spelling: all proper names and numbers are copied from the printed rv1909 text
  (Sichêm, Dothán, Potiphar, Rachêl, Ephraim, Amorrheo, Bethlehem, "diez y siete años"),
  even where modern Spanish spells them differently (Siquem, Dotán, Raquel, Efraín, Belén).
  Questions and distractors are in modern Spanish; only short quotes stay verbatim
  ("No riñáis por el camino", "Yo soy José: ¿vive aún mi padre?", "¿Quiénes son éstos?").
- Génesis 38:3-5: the text's subject for "llamó su nombre" is ambiguous (the mother in v3),
  so q2 asks which names the three sons received instead of who named them.
- Génesis 39: the chapter never names Potiphar's wife, so she is "la mujer de su señor" /
  "ella", as the text has it. Nothing from v7-10 is quoted.
- Génesis 42:13 and 42:17 use numbers written in the verse ("doce hermanos", "tres días"),
  so they are asked as numbers; no other "how many" question was added where the text has no number.
- Génesis 46:27 (setenta) vs 46:26 (sesenta y seis): q8 cites only v27 and asks about
  "las almas de la casa de Jacob", which is v27's own wording. "Sesenta y seis" was removed as a
  distractor because v26 counts a different group, and that would have been arguably correct.
- Génesis 47:9 (ciento treinta años) and 47:28 (ciento cuarenta y siete años / diecisiete años in
  Egypt) are three different numbers in one chapter. q5 cites only v9 and its distractors avoid the
  other two numbers so no distractor can be read as correct.
- Génesis 47: the oath about his burial (v29-30) is included; v28 (147 years) was left out to keep
  only one Jacob-age question.
- Génesis 48:19: the text does not say which brother is "el hermano menor" in that sentence, so q9
  keeps the text's own wording ("el hermano menor") rather than naming Ephraim.
- Génesis 46 is thin on narrative (a name list). The ten questions are all literally in the text,
  but four are list/number recall, which is why it is marked `hard`.
