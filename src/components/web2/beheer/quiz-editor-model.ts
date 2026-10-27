import * as z from 'zod';

/**
 * The quiz editor's form model, shared by the editor (client) and the pages
 * that load a quiz into it (server). Pure: no database or React imports.
 *
 * Logic carried over from the old admin QuizForm and the user QuizCreatorForm:
 * the same fields and limits, the slug made from the title, the JSON import
 * schema. `_id`s of existing questions and answers are kept so an edit does
 * not orphan the per-question progress that `UserProgress` stores by id.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type EditorStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface EditorAnswer {
  _id?: string;
  /** Client-only key for React lists. */
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface EditorQuestion {
  _id?: string;
  key: string;
  text: string;
  explanation: string;
  bibleReference: string;
  answers: EditorAnswer[];
}

export interface EditorQuiz {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  rewardXp: number;
  difficulty: Difficulty;
  isPremium: boolean;
  status: EditorStatus;
  questions: EditorQuestion[];
}

export interface EditorCategory {
  _id: string;
  title: string;
}

export const STATUS_OPTIONS: { value: EditorStatus; label: string }[] = [
  { value: 'draft', label: 'Concept' },
  { value: 'pending', label: 'In afwachting' },
  { value: 'approved', label: 'Goedgekeurd (actief)' },
  { value: 'rejected', label: 'Afgewezen' },
];

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Makkelijk' },
  { value: 'medium', label: 'Gemiddeld' },
  { value: 'hard', label: 'Moeilijk' },
];

let keySeed = 0;
export function newKey(): string {
  keySeed += 1;
  return `k${Date.now().toString(36)}${keySeed}`;
}

export function emptyQuestion(): EditorQuestion {
  return {
    key: newKey(),
    text: '',
    explanation: '',
    bibleReference: '',
    answers: [
      { key: newKey(), text: '', isCorrect: true },
      { key: newKey(), text: '', isCorrect: false },
      { key: newKey(), text: '', isCorrect: false },
      { key: newKey(), text: '', isCorrect: false },
    ],
  };
}

export function emptyQuiz(): EditorQuiz {
  return {
    title: '',
    slug: '',
    description: '',
    imageUrl: '',
    categoryId: '',
    rewardXp: 100,
    difficulty: 'easy',
    isPremium: false,
    status: 'draft',
    questions: [emptyQuestion()],
  };
}

/** "Daniël en de leeuwenkuil" -> "daniel-en-de-leeuwenkuil". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type RawAnswer = { _id?: unknown; text?: unknown; isCorrect?: unknown };
type RawQuestion = { _id?: unknown; text?: unknown; explanation?: unknown; bibleReference?: unknown; answers?: RawAnswer[] };
type RawQuiz = {
  _id?: unknown;
  title?: unknown;
  slug?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  categoryId?: unknown;
  rewardXp?: unknown;
  difficulty?: unknown;
  isPremium?: unknown;
  status?: unknown;
  questions?: RawQuestion[];
};

const str = (value: unknown) => (typeof value === 'string' ? value : '');

/** A stored quiz (plain JSON) -> the editor model. */
export function toEditorQuiz(raw: RawQuiz): EditorQuiz {
  const category = raw.categoryId as { _id?: unknown } | string | undefined;
  const difficulty = str(raw.difficulty) as Difficulty;
  const status = str(raw.status) as EditorStatus;
  return {
    _id: raw._id ? String(raw._id) : undefined,
    title: str(raw.title),
    slug: str(raw.slug),
    description: str(raw.description),
    imageUrl: str(raw.imageUrl),
    categoryId: typeof category === 'string' ? category : category?._id ? String(category._id) : '',
    rewardXp: typeof raw.rewardXp === 'number' ? raw.rewardXp : 100,
    difficulty: DIFFICULTY_OPTIONS.some((option) => option.value === difficulty) ? difficulty : 'medium',
    isPremium: Boolean(raw.isPremium),
    status: STATUS_OPTIONS.some((option) => option.value === status) ? status : 'draft',
    questions: (raw.questions ?? []).map((question) => ({
      _id: question._id ? String(question._id) : undefined,
      key: newKey(),
      text: str(question.text),
      explanation: str(question.explanation),
      bibleReference: str(question.bibleReference),
      answers: (question.answers ?? []).map((answer) => ({
        _id: answer._id ? String(answer._id) : undefined,
        key: newKey(),
        text: str(answer.text),
        isCorrect: Boolean(answer.isCorrect),
      })),
    })),
  };
}

/** The editor model -> the body for POST/PUT /api/admin/quizzes. */
export function toPayload(quiz: EditorQuiz) {
  return {
    title: quiz.title.trim(),
    slug: quiz.slug.trim(),
    description: quiz.description.trim(),
    imageUrl: quiz.imageUrl.trim(),
    categoryId: quiz.categoryId,
    rewardXp: Number.isFinite(quiz.rewardXp) ? Math.max(0, Math.round(quiz.rewardXp)) : 0,
    difficulty: quiz.difficulty,
    isPremium: quiz.isPremium,
    status: quiz.status,
    questions: quiz.questions.map((question) => ({
      ...(question._id ? { _id: question._id } : {}),
      text: question.text.trim(),
      explanation: question.explanation.trim(),
      bibleReference: question.bibleReference.trim(),
      answers: question.answers.map((answer) => ({
        ...(answer._id ? { _id: answer._id } : {}),
        text: answer.text.trim(),
        isCorrect: answer.isCorrect,
      })),
    })),
  };
}

/* ── Validation ─────────────────────────────────────────────────────────── */

export type EditorErrors = Record<string, string>;

/**
 * Same limits as the old admin form, plus "one answer is marked correct".
 * Keys: `title`, `slug`, `description`, `categoryId`, `questions`,
 * `q.<index>.text`, `q.<index>.answers`.
 */
export function validateQuiz(quiz: EditorQuiz): EditorErrors {
  const errors: EditorErrors = {};
  if (quiz.title.trim().length < 3) errors.title = 'Titel moet minimaal 3 tekens hebben.';
  if (quiz.slug.trim().length < 3) errors.slug = 'Slug is verplicht (minimaal 3 tekens).';
  else if (!/^[^\s/?#]+$/.test(quiz.slug.trim())) errors.slug = 'Geen spaties of / ? # in de slug.';
  if (quiz.description.trim().length < 10) errors.description = 'Beschrijving moet minimaal 10 tekens hebben.';
  if (!quiz.categoryId) errors.categoryId = 'Kies een categorie.';
  if (quiz.questions.length === 0) errors.questions = 'Er moet minstens 1 vraag zijn.';
  quiz.questions.forEach((question, index) => {
    if (question.text.trim().length < 5) errors[`q.${index}.text`] = 'Vraag is te kort (minimaal 5 tekens).';
    if (question.answers.length < 2) errors[`q.${index}.answers`] = 'Een vraag heeft minstens 2 antwoorden.';
    else if (question.answers.some((answer) => !answer.text.trim())) errors[`q.${index}.answers`] = 'Vul elk antwoord in of haal het weg.';
    else if (!question.answers.some((answer) => answer.isCorrect)) errors[`q.${index}.answers`] = 'Vink het goede antwoord aan.';
  });
  return errors;
}

/* ── JSON import ────────────────────────────────────────────────────────── */

const importSchema = z.object({
  title: z.string().min(3, 'Titel moet minimaal 3 karakters bevatten'),
  description: z.string().min(10, 'Beschrijving moet minimaal 10 karakters bevatten'),
  slug: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  rewardXp: z.coerce.number().min(0).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  isPremium: z.boolean().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(5, 'Vraag is te kort'),
        explanation: z.string().optional(),
        bibleReference: z.string().optional(),
        answers: z
          .array(z.object({ text: z.string().min(1, 'Antwoord is verplicht'), isCorrect: z.boolean().optional() }))
          .min(2, 'Een vraag moet minstens 2 antwoorden hebben'),
      }),
    )
    .min(1, 'Er moet minstens 1 vraag zijn'),
});

export const IMPORT_EXAMPLE = `{
  "title": "Quiz titel",
  "description": "Quiz beschrijving",
  "slug": "quiz-slug",
  "categoryId": "categorie-id",
  "rewardXp": 100,
  "difficulty": "medium",
  "isPremium": false,
  "status": "draft",
  "questions": [
    {
      "text": "Vraag tekst?",
      "explanation": "Uitleg",
      "bibleReference": "Genesis 1:1",
      "answers": [
        { "text": "Antwoord 1", "isCorrect": true },
        { "text": "Antwoord 2", "isCorrect": false }
      ]
    }
  ]
}`;

/**
 * Parses an imported JSON file into the editor model. Throws an Error with a
 * Dutch message on invalid JSON or a schema mismatch. A `categoryId` may be
 * the category's id, slug-like title or title; unknown ones are left empty.
 */
export function parseImport(text: string, categories: EditorCategory[]): EditorQuiz {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Ongeldig JSON-formaat.');
  }
  const result = importSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path?.length ? ` (${issue.path.join('.')})` : '';
    throw new Error(`Validatiefout${where}: ${issue?.message ?? 'onbekend'}`);
  }
  const data = result.data;
  const wanted = (data.categoryId ?? '').trim();
  const category = categories.find(
    (cat) => cat._id === wanted || cat.title.toLowerCase() === wanted.toLowerCase() || slugify(cat.title) === slugify(wanted),
  );
  return {
    title: data.title,
    slug: data.slug?.trim() || slugify(data.title),
    description: data.description,
    imageUrl: data.imageUrl ?? '',
    categoryId: category?._id ?? '',
    rewardXp: data.rewardXp ?? 100,
    difficulty: data.difficulty ?? 'medium',
    isPremium: data.isPremium ?? false,
    status: data.status ?? 'draft',
    questions: data.questions.map((question) => ({
      key: newKey(),
      text: question.text,
      explanation: question.explanation ?? '',
      bibleReference: question.bibleReference ?? '',
      answers: question.answers.map((answer) => ({ key: newKey(), text: answer.text, isCorrect: Boolean(answer.isCorrect) })),
    })),
  };
}
