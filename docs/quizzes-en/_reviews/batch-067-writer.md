# Batch 067 - writer notes (en)

Source text: World English Bible (web), printed with `scripts/print-chapter.mts`. Validator and
verify sheet run on all 12 files: 0 errors, 0 warnings. `status` left at `draft`.

| file | note |
|---|---|
| daniel-bible-quiz-part-11.json | Rewritten from scratch (a file already existed). `difficulty: hard` - whole chapter is unnamed kings of the south and north. Speaker is never named in this chapter, so questions say "the speaker" / "he". No question on the count in 11:2 ("three more kings ... and the fourth"), because the text can be read as three or four kings standing up; asked instead what is said about the fourth. |
| daniel-bible-quiz-part-12.json | Michael and Daniel are both named in the chapter, so they are used by name. 12:12 (1335 days) left out to avoid two questions with near-identical day-count answers. |
| hosea-bible-quiz-part-1.json | `easy`, isPremium false per manifest. Three children, three names - kept each name question distinct (first son, daughter, second son). |
| hosea-bible-quiz-part-2.json | Chapter speaks of "your mother" / "her"; questions keep the text's own words rather than naming Gomer, who is not named in this chapter. |
| hosea-bible-quiz-part-3.json | Short chapter (5 verses), so 10 questions on 10 different phrases; verse 3 carries three questions (the many days, what she must not do, "I will also be so toward you"). "Many days" is the answer to one question only, although the phrase also occurs in 3:4. |
| hosea-bible-quiz-part-4.json | Covers 4:1 to 4:19. 4:7 (glory into shame) left out for space. |
| hosea-bible-quiz-part-5.json | "king Jareb" spelled as in this text. |
| hosea-bible-quiz-part-6.json | 6:7 asks only whom the text compares them with ("like Adam"), nothing beyond that. 6:1-3 is a quoted call by an unnamed "us", so the questions say "the opening call". |
| hosea-bible-quiz-part-7.json | 7:8 "a pancake not turned over" kept verbatim as the answer. |
| hosea-bible-quiz-part-8.json | 8:5-6 cited together for the calf of Samaria, since the breaking in pieces is in verse 6. |
| hosea-bible-quiz-part-9.json | 9:14 left out deliberately (a prayer for a miscarrying womb); plenty of other material in the chapter. |
| hosea-bible-quiz-part-10.json | 10:13 left out so the last verse (10:15, the king destroyed at daybreak) could close the quiz. |

Doubts / things a reviewer may want to look at:

- Hosea 1 question 6 asks the daughter's name and the stated reason together; one distractor
  ("Lo-Ammi, for they were no longer his people") is true of the third child in 1:9, but not of
  the daughter the question asks about. Flagged in case that reads as too close.
- Daniel 11 question 9 has a long correct answer ("Edom, Moab and the chief of the children of
  Ammon"); distractors were lengthened to match, ratio is within the validator's limit.
- Hosea 2 question 10 uses "You are not my people" as a distractor; it is the past state in 2:23
  and in 1:9, not what is said in the last verse, but it is deliberately close.
- Prophecy chapters: every question asks only what the printed lines say. No fulfilment, no
  identification of kings, no dates.
