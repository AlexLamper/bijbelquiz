# Batch 076 - writer notes (en, World English Bible)

Files written (all 10 questions, status draft, categorySlug new-testament, isPremium from the manifest):

- mark-bible-quiz-part-12.json - medium. Q8 asks for the greatest commandment; "love your neighbor as yourself" was dropped as a distractor because v31 calls it "like this" and says "no other commandment greater than these", which could be argued either way.
- mark-bible-quiz-part-13.json - medium. All distractors for "what must happen first" (v10) were chosen outside the chapter so that no wrong answer is a later event the chapter does affirm.
- mark-bible-quiz-part-14.json - medium. Q9 cites 14:61-62; "he stayed silent" was removed as a distractor because v61 does say he stayed quiet to the earlier question.
- mark-bible-quiz-part-15.json - easy. Q2 keeps the text's own "So you say"; a near-synonym distractor ("you have said it yourself") was replaced so no distractor reads like another translation of the right answer.
- mark-bible-quiz-part-16.json - easy. Q8 ("appeared first") turns on the word "first" in v9; the later appearances of v12 and v14 are used as distractors. Q10 cites v19 only.
- luke-bible-quiz-part-1.json - medium. Q1 says "the writer" because the chapter does not name him. Q8 answer kept to the leaping of the baby (v41); the filling with the Holy Spirit is in the explanation only.
- luke-bible-quiz-part-2.json - easy. Rewritten from scratch (file existed).
- luke-bible-quiz-part-3.json - hard (the chapter ends in a long genealogy; no question is drawn from vv. 23-38, where there is no fact to ask about that is not just a name in a list).
- luke-bible-quiz-part-4.json - medium. In Q2 and Q6 the distractors were deliberately taken from outside the chapter: the other temptation answers (vv. 8, 12) and the later sayings (vv. 18, 23, 24) are true in this chapter, just not answers to those questions.
- luke-bible-quiz-part-5.json - medium.
- luke-bible-quiz-part-6.json - medium.
- luke-bible-quiz-part-7.json - medium. Q6 distractors were moved off the chapter's own quotes (vv. 13, 50) for the same reason as Luke 4.

Doubts / things to look at:

- Difficulty is a judgement call: Mark 15 and 16 and Luke 2 were marked easy as famous stories, Luke 3 hard for the genealogy, the rest medium.
- Several correct answers are verbatim quotes, so distractors had to be padded to keep the length ratio under the validator's limit; the padding is always plainly false in this text, never a half-truth.
- Mark 13 and Luke 6 are long discourse chapters: the ten facts are spread over the chapter, but much of the teaching is necessarily left out.

Validator: 12 files, 0 errors, 0 warnings
(`SITE=intl node --import tsx scripts/validate-quiz-json.ts --lang=en --bible-dir=../bijbelapi-data/data`).
Verify sheet re-read for all 12 files; every marked answer is in the printed TEXT lines of the cited verses.
Not committed.
