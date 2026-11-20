# Batch 027 - es (writer notes)

Language: es, Reina-Valera 1909 (rv1909). Book titles from the print-chapter header:
"1 Reyes", "2 Reyes". Source for every question: only the printed rv1909 chapter text.
All 12 files: 10 questions, rewardXp 100, categorySlug old-testament, status draft,
isPremium from docs/quiz-manifest.json.

Validator (SITE=intl, --lang=es, --bible-dir=../bijbelapi-data/data): 0 errors, 0 warnings
on all 12 files. Verify sheet read for all 12 files; every marked answer and every
explanation is literally in the cited TEXT lines.

| file | difficulty | isPremium | note |
|---|---|---|---|
| 1-kings-quiz-part-22.json | medium | true | v1-v40: tres años sin guerra, Ramoth de Galaad, Michêas hijo de Imla, la flecha a la ventura, Ochôzías su hijo. |
| 2-kings-quiz-part-1.json | medium | false | v1-v17: Moab, las celosías, Baal-zebub dios de Ecrón, los capitanes de cincuenta. |
| 2-kings-quiz-part-2.json | easy | true | v1-v24: el torbellino, el manto, el carro de fuego, la botija con sal, los cuarenta y dos muchachos. |
| 2-kings-quiz-part-3.json | medium | true | v1-v27: Mesa rey de Moab, el tañedor, las acequias, el primogénito sobre el muro. |
| 2-kings-quiz-part-4.json | medium | true | v1-v42: la botija de aceite, la cámara de la Sunamita, el niño que estornudó, la harina en la olla. |
| 2-kings-quiz-part-5.json | easy | true | v1-v27: Naamán, la muchacha cautiva, Abana y Pharphar, siete baños, Giezi leproso. |
| 2-kings-quiz-part-6.json | medium | true | v4-v31: el hacha que nadó, Dothán, los carros de fuego, el cerco de Samaria. |
| 2-kings-quiz-part-7.json | medium | true | v1-v17: el seah por un siclo, los cuatro leprosos, la huida de los Siros, el príncipe atropellado. |
| 2-kings-quiz-part-8.json | medium | true | v1-v26: los siete años de hambre, Hazael y Ben-adad, Ochôzías de veintidós años. |
| 2-kings-quiz-part-9.json | medium | true | v1-v35: la unción de Jehú, Naboth de Jezreel, Joram, Ochôzías en Megiddo, Jezabel. |
| 2-kings-quiz-part-10.json | medium | true | v1-v36: los setenta hijos, los cuarenta y dos hermanos, la casa de Baal, veintiocho años. |
| 2-kings-quiz-part-11.json | medium | true | v1-v21: Athalía, Josaba, Joiada, la corona y el testimonio, Joas de siete años. |

## Things worth a second look

- 2 Reyes 8:15 does not name the subject of "tomó un paño basto"; the question and the
  explanation therefore stay impersonal ("tomaron ... y murió") instead of naming Hazael,
  even though v14-15 imply him.
- 2 Reyes 5:3 only reports the muchacha speaking "á su señora"; the question is worded as
  "¿Quién dijo que el profeta de Samaria podría sanar a Naamán...?" and the answer names the
  muchacha, which is what v2-3 state.
- 1 Reyes 22 and 2 Reyes 8/9/10 use distractors that name people or places from the same
  chapter (Sedechîas, Amón, Bidkar, Joram) so that no wrong answer carries a fact from
  outside the printed chapter.
- 2 Reyes 5:5 lists three things Naamán took; the correct answer repeats all three
  (plata, oro, mudas de vestidos) so it is not a partial list.
- No chapter in this batch was too thin for 10 questions.
