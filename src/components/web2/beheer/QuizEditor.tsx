'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, ChevronLeft, ChevronUp, FileJson, Plus, Trash2, Upload, X } from 'lucide-react';

import { Button, Switch, toast } from '@/components/bq';
import { BoltSolidIcon } from '@/components/bq/icons';
import { parseBibleReference } from '@/lib/bible-reference';
import { cn } from '@/lib/utils';
import { AdminField, AdminSection, adminIconButton, adminInput, adminTextarea } from './ui';
import {
  DIFFICULTY_OPTIONS,
  IMPORT_EXAMPLE,
  STATUS_OPTIONS,
  emptyQuestion,
  emptyQuiz,
  newKey,
  parseImport,
  slugify,
  toPayload,
  validateQuiz,
  type EditorCategory,
  type EditorErrors,
  type EditorQuestion,
  type EditorQuiz,
} from './quiz-editor-model';

/**
 * The beheer quiz editor (P-BeheerQuizEditor), for `/beheer/quizzen/aanmaken`
 * and `/beheer/quizzen/[id]/bewerken`.
 *
 * Left: the quiz details and the questions (one open at a time is the usual
 * flow, each collapsed row shows the correct answer and the Bible reference).
 * Right: status, category, difficulty, XP, the Premium flag and the JSON
 * import (new quizzes only). Saves through POST/PUT /api/admin/quizzes; the
 * PUT derives refBook/refChapter from each Bijbeltekst.
 */
export default function QuizEditor({ categories, initial }: { categories: EditorCategory[]; initial?: EditorQuiz }) {
  const router = useRouter();
  const id = React.useId();
  const isEdit = Boolean(initial?._id);
  const [quiz, setQuiz] = React.useState<EditorQuiz>(() => initial ?? emptyQuiz());
  const [open, setOpen] = React.useState<Set<string>>(() =>
    initial ? new Set<string>() : new Set(quiz.questions.map((question) => question.key)),
  );
  // Errors show after the first save attempt and then follow every edit, so
  // a fixed field clears at once. `serverErrors` holds what the API rejected
  // (a slug that already exists) until that field changes.
  const [submitted, setSubmitted] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<EditorErrors>({});
  const errors = React.useMemo<EditorErrors>(
    () => ({ ...(submitted ? validateQuiz(quiz) : {}), ...serverErrors }),
    [submitted, quiz, serverErrors],
  );
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  // Warn before leaving the page with unsaved changes.
  React.useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const update = (patch: Partial<EditorQuiz>) => {
    if ('slug' in patch) setServerErrors({});
    setQuiz((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const updateQuestion = (key: string, patch: Partial<EditorQuestion>) => {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((question) => (question.key === key ? { ...question, ...patch } : question)),
    }));
    setDirty(true);
  };

  const toggleOpen = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const addQuestion = () => {
    const question = emptyQuestion();
    update({ questions: [...quiz.questions, question] });
    setOpen((current) => new Set(current).add(question.key));
    // Focus the new question once it is rendered.
    window.setTimeout(() => document.getElementById(`${id}-q-${question.key}-text`)?.focus(), 50);
  };

  const removeQuestion = (key: string, index: number) => {
    const question = quiz.questions.find((item) => item.key === key);
    const hasContent = question && (question.text.trim() || question.answers.some((answer) => answer.text.trim()));
    if (hasContent && !window.confirm(`Vraag ${index + 1} verwijderen?`)) return;
    update({ questions: quiz.questions.filter((item) => item.key !== key) });
  };

  const onTitleBlur = () => {
    if (!quiz.slug.trim() && quiz.title.trim()) update({ slug: slugify(quiz.title) });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json')) {
      toast.error('Alleen JSON-bestanden zijn toegestaan');
      return;
    }
    setImporting(true);
    try {
      const imported = parseImport(await file.text(), categories);
      setQuiz(imported);
      setOpen(new Set());
      setSubmitted(false);
      setServerErrors({});
      setDirty(true);
      toast.success('Quiz geladen uit JSON', {
        description: imported.categoryId ? undefined : 'Kies nog een categorie.',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Het bestand kon niet worden geladen');
    } finally {
      setImporting(false);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateQuiz(quiz);
    setSubmitted(true);
    const keys = Object.keys(found);
    if (keys.length > 0) {
      // Open every question with a problem and bring the first one into view.
      const broken = quiz.questions.filter((_, index) => found[`q.${index}.text`] || found[`q.${index}.answers`]);
      setOpen((current) => {
        const next = new Set(current);
        broken.forEach((question) => next.add(question.key));
        return next;
      });
      toast.error('Controleer de gemarkeerde velden');
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('[data-editor-error="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/quizzes/${initial!._id}` : '/api/admin/quizzes', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(quiz)),
      });
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        const message = body?.error || 'Deze slug bestaat al.';
        setServerErrors({ slug: message });
        toast.error(message);
        return;
      }
      if (!res.ok) throw new Error('save failed');
      toast.success(isEdit ? 'Quiz opgeslagen' : 'Quiz aangemaakt');
      setDirty(false);
      router.push(`/beheer/quizzen?status=${quiz.status}`);
      router.refresh();
    } catch {
      toast.error('Opslaan is niet gelukt. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const confirmLeave = (event: React.MouseEvent) => {
    if (dirty && !window.confirm('Je hebt wijzigingen die nog niet zijn opgeslagen. Toch weggaan?')) {
      event.preventDefault();
    }
  };

  const f = (name: string) => `${id}-${name}`;
  const err = (name: string) => errors[name];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-[1_1_420px] items-center gap-3.5">
          <Link
            href="/beheer/quizzen"
            onClick={confirmLeave}
            aria-label="Terug naar quizzen"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-card text-ink-soft no-underline hover:bg-chip hover:text-ink"
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <Link href="/beheer/quizzen" onClick={confirmLeave} className="text-sm font-bold no-underline">
              Quizzen
            </Link>
            <h1 className="m-0 text-[26px] leading-8 m:text-[32px] m:leading-10">{isEdit ? 'Quiz bewerken' : 'Nieuwe quiz'}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="submit" size="md" loading={saving}>
            {!saving && <Check className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />}
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 min-[1101px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <AdminSection aria-labelledby={f('details')}>
            <h2 id={f('details')} className="m-0 font-sans text-[17px] font-extrabold leading-6">
              Quizgegevens
            </h2>
            <AdminField label="Titel" htmlFor={f('title')} error={err('title')}>
              <input
                id={f('title')}
                type="text"
                value={quiz.title}
                onChange={(event) => update({ title: event.target.value })}
                onBlur={onTitleBlur}
                placeholder="Bijv. Het leven van David"
                aria-invalid={Boolean(err('title')) || undefined}
                data-editor-error={Boolean(err('title')) || undefined}
                className={adminInput}
              />
            </AdminField>
            <div className="grid grid-cols-1 items-start gap-3.5 m:grid-cols-2">
              <AdminField label="Slug" htmlFor={f('slug')} error={err('slug')} hint="Wordt uit de titel gemaakt als hij nog leeg is.">
                <span
                  className={cn(
                    'flex h-11 min-w-0 items-center rounded-[10px] border border-line bg-card focus-within:border-lapis focus-within:ring-2 focus-within:ring-lapis/25',
                    err('slug') && 'border-coral-strong',
                  )}
                >
                  <span className="whitespace-nowrap pl-3 text-[15px] font-semibold text-ink-muted" aria-hidden="true">
                    /bijbelquiz/
                  </span>
                  <input
                    id={f('slug')}
                    type="text"
                    value={quiz.slug}
                    onChange={(event) => update({ slug: event.target.value })}
                    placeholder="het-leven-van-david"
                    aria-invalid={Boolean(err('slug')) || undefined}
                    data-editor-error={Boolean(err('slug')) || undefined}
                    spellCheck={false}
                    className="h-[42px] w-full min-w-0 flex-auto border-0 bg-transparent pl-1 pr-3 text-[15px] font-semibold text-ink outline-none placeholder:text-ink-faint"
                  />
                </span>
              </AdminField>
              <AdminField label="Afbeelding-URL (optioneel)" htmlFor={f('image')} hint="Een pad op de site of een externe URL.">
                <input
                  id={f('image')}
                  type="text"
                  value={quiz.imageUrl}
                  onChange={(event) => update({ imageUrl: event.target.value })}
                  placeholder="/images/quizzes/david.webp"
                  spellCheck={false}
                  className={adminInput}
                />
              </AdminField>
            </div>
            <AdminField label="Beschrijving" htmlFor={f('description')} error={err('description')}>
              <textarea
                id={f('description')}
                rows={3}
                value={quiz.description}
                onChange={(event) => update({ description: event.target.value })}
                placeholder="Een korte introductie van de quiz"
                aria-invalid={Boolean(err('description')) || undefined}
                data-editor-error={Boolean(err('description')) || undefined}
                className={cn(adminTextarea, 'max-m:h-[136px]')}
              />
            </AdminField>
          </AdminSection>

          <section aria-labelledby={f('questions')} className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
              <h2 id={f('questions')} className="m-0 font-sans text-[17px] font-extrabold leading-6">
                Vragen <span className="font-bold text-ink-muted">· {quiz.questions.length}</span>
              </h2>
            </div>
            {err('questions') && (
              <p role="alert" data-editor-error="true" className="m-0 text-[13px] font-bold text-coral-text">
                {err('questions')}
              </p>
            )}
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {quiz.questions.map((question, index) =>
                open.has(question.key) ? (
                  <OpenQuestion
                    key={question.key}
                    idBase={`${id}-q-${question.key}`}
                    index={index}
                    question={question}
                    errors={errors}
                    canRemove={quiz.questions.length > 1}
                    onChange={(patch) => updateQuestion(question.key, patch)}
                    onRemove={() => removeQuestion(question.key, index)}
                    onCollapse={() => toggleOpen(question.key)}
                  />
                ) : (
                  <ClosedQuestion
                    key={question.key}
                    index={index}
                    question={question}
                    error={errors[`q.${index}.text`] || errors[`q.${index}.answers`]}
                    onOpen={() => toggleOpen(question.key)}
                  />
                ),
              )}
            </ol>
            <Button type="button" variant="secondary" block className="h-[52px] px-4" onClick={addQuestion}>
              <Plus className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
              Vraag toevoegen
            </Button>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <AdminSection aria-labelledby={f('settings')}>
            <h2 id={f('settings')} className="m-0 font-sans text-[17px] font-extrabold leading-6">
              Instellingen
            </h2>
            <AdminField label="Status" htmlFor={f('status')}>
              <NativeSelect id={f('status')} value={quiz.status} onChange={(value) => update({ status: value as EditorQuiz['status'] })}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </AdminField>
            <AdminField label="Categorie" htmlFor={f('category')} error={err('categoryId')}>
              <NativeSelect
                id={f('category')}
                value={quiz.categoryId}
                invalid={Boolean(err('categoryId'))}
                onChange={(value) => update({ categoryId: value })}
              >
                <option value="" disabled>
                  Kies een categorie
                </option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
              </NativeSelect>
            </AdminField>
            <div className="flex flex-col gap-1.5">
              <span id={f('difficulty')} className="text-[13px] font-extrabold leading-[18px] text-ink-soft">
                Moeilijkheid
              </span>
              <div role="radiogroup" aria-labelledby={f('difficulty')} className="flex gap-1 rounded-[12px] bg-chip p-1">
                {DIFFICULTY_OPTIONS.map((option) => {
                  const selected = quiz.difficulty === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update({ difficulty: option.value })}
                      className={cn(
                        'h-9 min-w-0 flex-1 rounded-[8px] border-0 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lapis',
                        selected ? 'bg-card font-extrabold text-ink shadow-[0_0_0_1px_var(--line)]' : 'bg-transparent font-bold text-ink-muted hover:text-ink',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <AdminField label="XP-beloning" htmlFor={f('xp')}>
              <span className="flex h-11 min-w-0 items-center rounded-[10px] border border-line bg-card focus-within:border-lapis focus-within:ring-2 focus-within:ring-lapis/25">
                <input
                  id={f('xp')}
                  type="number"
                  min={0}
                  step={10}
                  value={Number.isFinite(quiz.rewardXp) ? quiz.rewardXp : ''}
                  onChange={(event) => update({ rewardXp: event.target.value === '' ? NaN : Number(event.target.value) })}
                  className="tabular h-[42px] w-full min-w-0 flex-auto border-0 bg-transparent px-3 text-[15px] font-semibold text-ink outline-none"
                />
                <span className="flex items-center gap-1 pr-3 text-sm font-extrabold text-ink-muted" aria-hidden="true">
                  <BoltSolidIcon size={16} className="text-gold" />
                  XP
                </span>
              </span>
            </AdminField>
            <div className="flex items-center gap-3 border-t border-line-soft pt-3.5">
              <span className="flex flex-1 flex-col">
                <span id={f('premium')} className="text-[15px] font-extrabold">
                  Premium-quiz
                </span>
                <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">Alleen te spelen met Premium.</span>
              </span>
              <Switch checked={quiz.isPremium} onCheckedChange={(checked) => update({ isPremium: checked })} aria-labelledby={f('premium')} />
            </div>
          </AdminSection>

          <AdminSection className="gap-3 pb-[18px]" aria-labelledby={f('import')}>
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-chip text-ink-soft" aria-hidden="true">
                <FileJson className="size-[18px]" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h2 id={f('import')} className="m-0 font-sans text-base font-extrabold leading-[22px]">
                  Importeren uit JSON
                </h2>
                <p className="mb-0 mt-0.5 text-[13px] font-semibold leading-[18px] text-ink-muted">
                  Vult alle velden in vanuit een bestand dat aan het quizschema voldoet. Alleen bij een nieuwe quiz.
                </p>
              </div>
            </div>
            <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleImport} />
            <Button
              type="button"
              variant="secondary"
              block
              className="px-4"
              loading={importing}
              disabled={isEdit}
              title={isEdit ? 'Importeren kan alleen bij een nieuwe quiz' : undefined}
              onClick={() => fileInput.current?.click()}
            >
              {!importing && <Upload className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />}
              {importing ? 'Laden...' : 'Kies JSON-bestand'}
            </Button>
            <details className="group text-[13px] text-ink-muted">
              <summary className="inline-flex cursor-pointer items-center gap-1.5 font-extrabold text-lapis">
                <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="fill-current transition-transform group-open:rotate-90">
                  <path d="M1 0l6 4-6 4z" />
                </svg>
                Voorbeeld van de structuur
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-[10px] bg-chip p-3 font-mono text-xs leading-[18px] text-ink-soft">{IMPORT_EXAMPLE}</pre>
            </details>
          </AdminSection>
        </div>
      </div>
    </form>
  );
}

/* ── Questions ──────────────────────────────────────────────────────────── */

function ClosedQuestion({
  index,
  question,
  error,
  onOpen,
}: {
  index: number;
  question: EditorQuestion;
  error?: string;
  onOpen: () => void;
}) {
  const correct = question.answers.filter((answer) => answer.isCorrect && answer.text.trim()).map((answer) => answer.text.trim());
  const meta = [correct.join(', '), question.bibleReference.trim()].filter(Boolean).join(' · ');
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-[16px] border bg-card py-2.5 pl-3.5 pr-2.5',
        error ? 'border-coral-strong' : 'border-line',
      )}
      data-editor-error={error ? true : undefined}
    >
      <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-chip text-sm font-extrabold text-ink-soft">
        {index + 1}
      </span>
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col border-0 bg-transparent p-0 text-left text-ink" tabIndex={-1}>
        <span className={cn('truncate text-[15px] font-bold leading-5', !question.text.trim() && 'text-ink-muted')}>
          {question.text.trim() || 'Nieuwe vraag'}
        </span>
        {error ? (
          <span className="truncate text-[13px] font-bold leading-[18px] text-coral-text">{error}</span>
        ) : (
          meta && (
            <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold leading-[18px] text-ink-muted">
              {correct.length > 0 && <Check className="size-3.5 shrink-0 text-green" strokeWidth={3} aria-label="Goed antwoord:" />}
              <span className="truncate">{meta}</span>
            </span>
          )
        )}
      </button>
      <button
        type="button"
        aria-expanded={false}
        aria-label={`Vraag ${index + 1} openen`}
        onClick={onOpen}
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border-0 bg-transparent p-0 text-ink-muted hover:bg-chip hover:text-ink"
      >
        <ChevronDown className="size-5" strokeWidth={2.4} aria-hidden="true" />
      </button>
    </li>
  );
}

function OpenQuestion({
  idBase,
  index,
  question,
  errors,
  canRemove,
  onChange,
  onRemove,
  onCollapse,
}: {
  idBase: string;
  index: number;
  question: EditorQuestion;
  errors: EditorErrors;
  canRemove: boolean;
  onChange: (patch: Partial<EditorQuestion>) => void;
  onRemove: () => void;
  onCollapse: () => void;
}) {
  const textError = errors[`q.${index}.text`];
  const answersError = errors[`q.${index}.answers`];
  const reference = question.bibleReference.trim();
  const referenceUnknown = reference.length > 0 && !parseBibleReference(reference);

  const setAnswer = (key: string, text: string) =>
    onChange({ answers: question.answers.map((answer) => (answer.key === key ? { ...answer, text } : answer)) });

  // One correct answer per question, like the player expects.
  const markCorrect = (key: string) =>
    onChange({ answers: question.answers.map((answer) => ({ ...answer, isCorrect: answer.key === key })) });

  const removeAnswer = (key: string) => {
    const removed = question.answers.find((answer) => answer.key === key);
    let answers = question.answers.filter((answer) => answer.key !== key);
    // Keep a correct answer marked when the removed one was it.
    if (removed?.isCorrect && answers.length > 0 && !answers.some((answer) => answer.isCorrect)) {
      answers = answers.map((answer, position) => ({ ...answer, isCorrect: position === 0 }));
    }
    onChange({ answers });
  };

  const addAnswer = () => {
    const key = newKey();
    onChange({ answers: [...question.answers, { key, text: '', isCorrect: false }] });
    window.setTimeout(() => document.getElementById(`${idBase}-a-${key}`)?.focus(), 30);
  };

  return (
    <li className="flex flex-col gap-4 rounded-[16px] border-[1.5px] border-lapis bg-card px-[18px] pb-5 pt-4">
      <div className="flex items-center gap-3">
        <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-lapis-tint text-sm font-extrabold text-lapis">
          {index + 1}
        </span>
        <h3 className="m-0 flex-1 font-sans text-base font-extrabold">Vraag {index + 1}</h3>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Vraag ${index + 1} verwijderen`}
          title="Vraag verwijderen"
          className={cn(adminIconButton, 'text-coral-text hover:bg-coral-tint hover:text-coral-text')}
        >
          <Trash2 className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-expanded
          aria-label={`Vraag ${index + 1} inklappen`}
          onClick={onCollapse}
          className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border-0 bg-transparent p-0 text-ink-muted hover:bg-chip hover:text-ink"
        >
          <ChevronUp className="size-5" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>

      <AdminField label="Vraag" htmlFor={`${idBase}-text`} error={textError}>
        <input
          id={`${idBase}-text`}
          type="text"
          value={question.text}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="Bijv. Wie was de vader van David?"
          aria-invalid={Boolean(textError) || undefined}
          data-editor-error={Boolean(textError) || undefined}
          className={adminInput}
        />
      </AdminField>

      <div className="flex flex-col gap-1.5" data-editor-error={answersError ? true : undefined}>
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span id={`${idBase}-answers`} className="text-[13px] font-extrabold leading-[18px] text-ink-soft">
            Antwoorden
          </span>
          <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">Vink het goede antwoord aan. Minimaal 2 antwoorden.</span>
        </span>
        <ul role="radiogroup" aria-labelledby={`${idBase}-answers`} className="-ml-2 flex list-none flex-col gap-2 p-0">
          {question.answers.map((answer, position) => (
            <li key={answer.key} className="flex items-center gap-1.5">
              <button
                type="button"
                role="radio"
                aria-checked={answer.isCorrect}
                aria-label={`Antwoord ${position + 1} is goed`}
                onClick={() => markCorrect(answer.key)}
                className="flex size-10 shrink-0 items-center justify-center border-0 bg-transparent p-0"
              >
                {answer.isCorrect ? (
                  <span className="flex size-[26px] items-center justify-center rounded-full bg-green text-white">
                    <Check className="size-4" strokeWidth={3.2} aria-hidden="true" />
                  </span>
                ) : (
                  <span className="block size-[26px] rounded-full border-2 border-input-line bg-card" />
                )}
              </button>
              <input
                id={`${idBase}-a-${answer.key}`}
                type="text"
                value={answer.text}
                onChange={(event) => setAnswer(answer.key, event.target.value)}
                aria-label={`Antwoord ${position + 1}`}
                placeholder={`Antwoord ${position + 1}`}
                className={cn(adminInput, 'flex-1', answer.isCorrect && 'border-[1.5px] border-green font-bold')}
              />
              <button
                type="button"
                onClick={() => removeAnswer(answer.key)}
                disabled={question.answers.length <= 2}
                aria-label={`Antwoord ${position + 1} verwijderen`}
                title="Antwoord verwijderen"
                className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border-0 bg-transparent p-0 text-ink-muted hover:bg-chip hover:text-ink disabled:opacity-40"
              >
                <X className="size-5" strokeWidth={2.4} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        {answersError && (
          <p role="alert" className="m-0 text-[13px] font-bold text-coral-text">
            {answersError}
          </p>
        )}
        <button
          type="button"
          onClick={addAnswer}
          className="mt-0.5 inline-flex h-10 items-center gap-1.5 self-start rounded-[10px] border-0 bg-transparent px-2.5 text-sm font-extrabold text-lapis hover:bg-lapis-tint"
        >
          <Plus className="size-4" strokeWidth={2.6} aria-hidden="true" />
          Antwoord toevoegen
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-3.5 m:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminField label="Uitleg na het antwoord" htmlFor={`${idBase}-explanation`}>
          <textarea
            id={`${idBase}-explanation`}
            rows={3}
            value={question.explanation}
            onChange={(event) => onChange({ explanation: event.target.value })}
            placeholder="Wat de speler na het antwoord leest"
            className={cn(adminTextarea, 'max-m:h-[136px]')}
          />
        </AdminField>
        <AdminField
          label="Bijbeltekst"
          htmlFor={`${idBase}-reference`}
          hint={
            referenceUnknown ? (
              <span className="text-coral-text">Niet herkend als bijbeltekst, er komt geen leeslink. Schrijf bijv. Genesis 37:3-4.</span>
            ) : (
              'Wordt een leeslink onder de uitleg.'
            )
          }
        >
          <input
            id={`${idBase}-reference`}
            type="text"
            value={question.bibleReference}
            onChange={(event) => onChange({ bibleReference: event.target.value })}
            placeholder="Bijv. 1 Samuël 16:1-13"
            className={adminInput}
          />
        </AdminField>
      </div>
    </li>
  );
}

/* ── Select ─────────────────────────────────────────────────────────────── */

function NativeSelect({
  id,
  value,
  onChange,
  invalid,
  children,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="relative flex min-w-0">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        data-editor-error={invalid || undefined}
        className={cn(adminInput, 'appearance-none pr-10 font-bold')}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -mt-2.5 size-5 text-ink-muted" strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}
