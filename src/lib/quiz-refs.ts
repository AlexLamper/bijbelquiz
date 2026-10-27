import { parseBibleReference } from '@/lib/bible-reference';
import { toBookCode } from '@/lib/book-canon';

/**
 * The derived Bible-reference fields of a quiz question (`refBook`,
 * `refChapter`, `refVerse`, `refVerseEnd`), computed from `bibleReference`.
 *
 * The Quiz model keeps these in step in a pre-save hook, but updates that go
 * through `findByIdAndUpdate` (the admin editor's PUT) skip that hook. This is
 * the same computation, for callers that write questions without `save()`.
 * An unparseable reference leaves `refBook` null on purpose (see the model).
 */
export function deriveQuestionRefs(bibleReference: string | null | undefined) {
  const parsed = bibleReference ? parseBibleReference(bibleReference) : null;
  return {
    refBook: parsed ? toBookCode(parsed.book) : null,
    refChapter: parsed?.chapter ?? null,
    refVerse: parsed?.verse ?? null,
    refVerseEnd: parsed?.endVerse ?? null,
  };
}

/** Returns the questions with their derived reference fields filled in. */
export function withDerivedRefs<Q extends { bibleReference?: string | null }>(questions: Q[]) {
  return questions.map((question) => ({ ...question, ...deriveQuestionRefs(question.bibleReference) }));
}
