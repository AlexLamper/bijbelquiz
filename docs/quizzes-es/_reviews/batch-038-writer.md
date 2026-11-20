# Batch 038 (es) - writer notes

Source: `print-chapter.mts --lang=es` (rv1909), book title "Salmos". 12 files, Salmos 9-20,
all `isPremium: true`, `status: draft`, `difficulty: medium`, `categorySlug: old-testament`.
Validator (SITE=intl, --bible-dir): 0 errors, 0 warnings. Verify sheet read for all 12 files.

- psalms-quiz-part-9.json - OK. Covers v1-v20 (alabanza, juicio, trono, refugio del pobre, Sión, la fosa, v20).
- psalms-quiz-part-10.json - OK. Covers v1-v16 (tribulación, arrogancia, lo que el malo dice en su corazón, amparo del huérfano, Rey eterno).
- psalms-quiz-part-11.json - OK. Chapter has only 7 verses, so two questions each fall on v1, v4 and v5; each asks a different fact of that verse.
- psalms-quiz-part-12.json - OK. 8 verses; two questions on v5 and two on v6. Q9 modernizes "aquesta generación" to "esta generación" in the answer and the explanation avoids quoting it verbatim.
- psalms-quiz-part-13.json - OK. 6 verses; two questions each on v1, v2, v3 and v4. Q7 keeps the text's own word "Vencílo" as an exact quote.
- psalms-quiz-part-14.json - OK. Covers v1-v7.
- psalms-quiz-part-15.json - OK. Only 5 verses; two questions per verse, each on a different clause.
- psalms-quiz-part-16.json - OK. Covers v1-v11.
- psalms-quiz-part-17.json - OK. Covers v1-v15.
- psalms-quiz-part-18.json - OK. 50 verses; spread over the heading (v1), v2, 6, 8, 10, 13, 19, 29, 33 and 50. The heading's own words ("de mano de todos sus enemigos, y de mano de Saúl") are the source of Q1.
- psalms-quiz-part-19.json - OK. Covers v1-v14.
- psalms-quiz-part-20.json - OK. Covers v1-v9. Q5/Q6 keep the psalm's second person ("tu holocausto", "todo tu consejo") because the text addresses someone directly; Q9 quotes "Arrodillaron y cayeron" verbatim.

Thin chapters (fewer than 10 verses, so several verses carry two questions each):
Salmos 11 (7 v), 12 (8 v), 13 (6 v), 14 (7 v), 15 (5 v), 20 (9 v). Everything asked is still
literally in the printed rv1909 text; no question needs a fact from outside its cited verses.

Nothing left uncertain: no authorship questions beyond what a heading states (Salmos 18 names
David in its own heading), and no historical, linguistic or cross-reference material was added.
