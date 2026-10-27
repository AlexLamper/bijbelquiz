'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, Eye, Pencil, Plus, RefreshCw, Search, Trash2, Undo2, Upload, X } from 'lucide-react';

import { AdminPageHeader, Button, toast } from '@/components/bq';
import { adminIconButton, formatAdminDate } from '@/components/web2/beheer/ui';
import { cn } from '@/lib/utils';

export type StatusFilter = 'pending' | 'approved' | 'rejected' | 'draft';

interface QuizRow {
  _id: string;
  title: string;
  slug?: string;
  status: StatusFilter;
  isPremium?: boolean;
  categoryId?: { title?: string } | null;
  createdBy?: { name?: string } | null;
  questionCount: number;
  createdAt: string;
}

const TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'In afwachting' },
  { value: 'approved', label: 'Goedgekeurd' },
  { value: 'rejected', label: 'Afgewezen' },
  { value: 'draft', label: 'Concepten' },
];

function heading(status: StatusFilter, count: number): string {
  const one = count === 1;
  switch (status) {
    case 'pending':
      return one ? '1 quiz wacht op goedkeuring' : `${count} quizzen wachten op goedkeuring`;
    case 'approved':
      return one ? '1 goedgekeurde quiz' : `${count} goedgekeurde quizzen`;
    case 'rejected':
      return one ? '1 afgewezen quiz' : `${count} afgewezen quizzen`;
    default:
      return one ? '1 concept' : `${count} concepten`;
  }
}

/** Lowercase without accents, so "daniel" finds "Daniël". */
function fold(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const ROW_GRID = 'min-[1101px]:grid-cols-[minmax(0,1fr)_150px_60px_100px_400px] min-[1101px]:gap-4';

/**
 * The beheer quiz list (P-BeheerQuizzen): status tabs, a search box and one
 * row per quiz with the moderation actions - approve/reject a quiz that waits,
 * publish or unpublish, the Premium flag, view, edit and delete.
 *
 * Loads the whole list once in the light `?view=summary` shape and filters
 * on the client, so switching tabs and searching are instant.
 */
export default function QuizModerationList({ initialStatus }: { initialStatus: StatusFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>(initialStatus);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/quizzes?view=summary', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      setQuizzes(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Quizzen laden is niet gelukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const selectTab = (value: StatusFilter) => {
    setFilter(value);
    // Keep the tab in the URL so a refresh or a shared link opens the same list.
    router.replace(`${pathname}?status=${value}`, { scroll: false });
  };

  const visible = useMemo(() => {
    const needle = fold(query.trim());
    return quizzes.filter((quiz) => {
      if (quiz.status !== filter) return false;
      if (!needle) return true;
      return fold(`${quiz.title} ${quiz.categoryId?.title ?? ''}`).includes(needle);
    });
  }, [quizzes, filter, query]);

  const patchLocal = (id: string, patch: Partial<QuizRow>) =>
    setQuizzes((rows) => rows.map((row) => (row._id === id ? { ...row, ...patch } : row)));

  const updateStatus = async (quiz: QuizRow, status: StatusFilter, message: string) => {
    setBusyId(quiz._id);
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      patchLocal(quiz._id, { status });
      toast.success(message);
    } catch {
      toast.error('Status wijzigen is niet gelukt');
    } finally {
      setBusyId(null);
    }
  };

  const togglePremium = async (quiz: QuizRow) => {
    const next = !quiz.isPremium;
    setBusyId(quiz._id);
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: next }),
      });
      if (!res.ok) throw new Error();
      patchLocal(quiz._id, { isPremium: next });
      toast.success(next ? `"${quiz.title}" is nu een Premium-quiz` : `"${quiz.title}" is nu gratis`);
    } catch {
      toast.error('Premium wijzigen is niet gelukt');
    } finally {
      setBusyId(null);
    }
  };

  const deleteQuiz = async (quiz: QuizRow) => {
    if (!window.confirm(`Weet je zeker dat je "${quiz.title}" wilt verwijderen? Dit kan niet ongedaan worden.`)) return;
    setBusyId(quiz._id);
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setQuizzes((rows) => rows.filter((row) => row._id !== quiz._id));
      toast.success('Quiz verwijderd');
    } catch {
      toast.error('Verwijderen is niet gelukt');
    } finally {
      setBusyId(null);
    }
  };

  const tabLabel = TABS.find((tab) => tab.value === filter)?.label ?? '';

  return (
    <>
      <AdminPageHeader
        title="Quizzen"
        description="Beheer, publiceer en bewerk alle quizzen."
        actions={
          <>
            <Button type="button" variant="secondary" size="md" className="px-4" onClick={fetchQuizzes} disabled={loading}>
              <RefreshCw className={cn('size-[18px]', loading && 'animate-spin')} strokeWidth={2.4} aria-hidden="true" />
              Verversen
            </Button>
            <Button href="/beheer/quizzen/aanmaken" size="md">
              <Plus className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
              Nieuwe quiz
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Status" className="-mx-4 flex max-w-[calc(100%+32px)] gap-2 overflow-x-auto px-4 [scrollbar-width:none] m:mx-0 m:max-w-full m:px-0">
          {TABS.map((tab) => {
            const selected = tab.value === filter;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectTab(tab.value)}
                className={cn(
                  'h-10 shrink-0 rounded-full px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
                  selected
                    ? 'border border-lapis bg-lapis font-extrabold text-white'
                    : 'border border-line bg-card font-bold text-ink-soft hover:border-input-line hover:text-ink',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <label className="flex h-11 min-w-[220px] flex-[1_1_100%] items-center gap-2.5 rounded-[12px] border border-line bg-card px-3.5 text-ink-muted focus-within:border-lapis focus-within:ring-2 focus-within:ring-lapis/25 m:flex-[0_1_340px]">
          <Search className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <span className="sr-only">Zoek een quiz</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek op titel of bijbelboek"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] font-semibold text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>

      <section aria-label={`Quizzen: ${tabLabel}`} className="overflow-hidden rounded-[16px] border border-line bg-card" role="tabpanel">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 border-b border-line-soft px-5 py-4">
          <h2 className="m-0 font-sans text-[17px] font-extrabold leading-6" aria-live="polite">
            {loading && quizzes.length === 0 ? 'Laden...' : heading(filter, visible.length)}
          </h2>
          <span className="text-[13px] font-semibold text-ink-muted">Nieuwste eerst</span>
        </div>

        {!loading && failed && quizzes.length === 0 ? (
          <p className="m-0 px-5 py-10 text-center text-[15px] font-semibold text-ink-muted">
            De quizzen konden niet geladen worden. Probeer het opnieuw met Verversen.
          </p>
        ) : visible.length === 0 && !(loading && quizzes.length === 0) ? (
          <p className="m-0 px-5 py-10 text-center text-[15px] font-semibold text-ink-muted">
            {query.trim() ? `Geen quizzen gevonden voor "${query.trim()}".` : 'Geen quizzen met deze status.'}
          </p>
        ) : (
          <>
            <div
              aria-hidden="true"
              className={cn('hidden items-center border-b border-line px-5 py-2.5 text-[13px] font-bold text-ink-muted min-[1101px]:grid', ROW_GRID)}
            >
              <span>Quiz</span>
              <span>Gemaakt door</span>
              <span className="text-right">Vragen</span>
              <span>Datum</span>
              <span className="text-right">Acties</span>
            </div>
            <ul className="m-0 list-none p-0">
              {visible.map((quiz) => (
                <QuizListRow
                  key={quiz._id}
                  quiz={quiz}
                  busy={busyId === quiz._id}
                  onStatus={updateStatus}
                  onPremium={togglePremium}
                  onDelete={deleteQuiz}
                />
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

function QuizListRow({
  quiz,
  busy,
  onStatus,
  onPremium,
  onDelete,
}: {
  quiz: QuizRow;
  busy: boolean;
  onStatus: (quiz: QuizRow, status: StatusFilter, message: string) => void;
  onPremium: (quiz: QuizRow) => void;
  onDelete: (quiz: QuizRow) => void;
}) {
  const author = quiz.createdBy?.name?.trim();
  const book = quiz.categoryId?.title || 'Geen categorie';
  const date = formatAdminDate(quiz.createdAt);
  const meta = [author && `Door ${author}`, `${quiz.questionCount} vragen`, date].filter(Boolean).join(' · ');

  return (
    <li className={cn('grid grid-cols-1 items-center gap-2.5 border-t border-line-soft px-5 py-3 first:border-t-0', ROW_GRID)}>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-extrabold leading-5">{quiz.title}</span>
        <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">{book}</span>
        <span className="text-[13px] font-semibold leading-[18px] text-ink-muted min-[1101px]:hidden">{meta}</span>
      </span>
      <span className="hidden truncate text-sm font-semibold text-ink-soft min-[1101px]:block">{author || '-'}</span>
      <span className="tabular hidden text-right text-sm font-bold text-ink-soft min-[1101px]:block">{quiz.questionCount}</span>
      <span className="tabular hidden text-sm font-semibold text-ink-soft min-[1101px]:block">{date}</span>

      <div className="grid min-w-0 grid-cols-2 items-center gap-1.5 min-[1101px]:flex min-[1101px]:justify-end">
        <StatusActions quiz={quiz} busy={busy} onStatus={onStatus} onPremium={onPremium} />
        <span className="col-span-2 flex gap-1.5">
          <a
            href={`/quiz/${quiz._id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bekijken (nieuw tabblad): ${quiz.title}`}
            title="Bekijken (nieuw tabblad)"
            className={adminIconButton}
          >
            <Eye className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </a>
          <Link
            href={`/beheer/quizzen/${quiz._id}/bewerken`}
            aria-label={`Bewerken: ${quiz.title}`}
            title="Bewerken"
            className={adminIconButton}
          >
            <Pencil className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(quiz)}
            disabled={busy}
            aria-label={`Verwijderen: ${quiz.title}`}
            title="Verwijderen"
            className={cn(adminIconButton, 'text-coral-text hover:bg-coral-tint hover:text-coral-text')}
          >
            <Trash2 className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </span>
      </div>
    </li>
  );
}

const actionBase =
  'inline-flex h-10 min-w-0 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-b-[3px] px-3.5 text-sm font-extrabold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis active:translate-y-px';
const actionGreen = cn(actionBase, 'border-green/25 bg-green-tint text-green-text hover:border-green/45');
const actionCoral = cn(actionBase, 'border-line bg-card text-coral-text hover:bg-coral-tint');
const actionPlain = cn(actionBase, 'border-line bg-card text-ink hover:bg-chip');

function StatusActions({
  quiz,
  busy,
  onStatus,
  onPremium,
}: {
  quiz: QuizRow;
  busy: boolean;
  onStatus: (quiz: QuizRow, status: StatusFilter, message: string) => void;
  onPremium: (quiz: QuizRow) => void;
}) {
  const icon = 'size-4';
  switch (quiz.status) {
    case 'pending':
      return (
        <>
          <button type="button" disabled={busy} className={actionGreen} onClick={() => onStatus(quiz, 'approved', 'Quiz goedgekeurd')}>
            <Check className={icon} strokeWidth={2.6} aria-hidden="true" />
            Goedkeuren
          </button>
          <button type="button" disabled={busy} className={actionCoral} onClick={() => onStatus(quiz, 'rejected', 'Quiz afgewezen')}>
            <X className={icon} strokeWidth={2.6} aria-hidden="true" />
            Afwijzen
          </button>
        </>
      );
    case 'rejected':
      return (
        <>
          <button type="button" disabled={busy} className={actionGreen} onClick={() => onStatus(quiz, 'approved', 'Quiz goedgekeurd')}>
            <Check className={icon} strokeWidth={2.6} aria-hidden="true" />
            Goedkeuren
          </button>
          <button type="button" disabled={busy} className={actionPlain} onClick={() => onStatus(quiz, 'draft', 'Quiz staat bij de concepten')}>
            <Undo2 className={icon} strokeWidth={2.4} aria-hidden="true" />
            Naar concept
          </button>
        </>
      );
    case 'approved':
      return (
        <>
          <button type="button" disabled={busy} className={actionPlain} onClick={() => onStatus(quiz, 'draft', 'Quiz gedepubliceerd')}>
            <Undo2 className={icon} strokeWidth={2.4} aria-hidden="true" />
            Depubliceren
          </button>
          <PremiumToggle quiz={quiz} busy={busy} onPremium={onPremium} />
        </>
      );
    default:
      return (
        <>
          <button type="button" disabled={busy} className={actionGreen} onClick={() => onStatus(quiz, 'approved', 'Quiz gepubliceerd')}>
            <Upload className={icon} strokeWidth={2.4} aria-hidden="true" />
            Publiceren
          </button>
          <PremiumToggle quiz={quiz} busy={busy} onPremium={onPremium} />
        </>
      );
  }
}

function PremiumToggle({ quiz, busy, onPremium }: { quiz: QuizRow; busy: boolean; onPremium: (quiz: QuizRow) => void }) {
  const on = Boolean(quiz.isPremium);
  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={on}
      title={on ? 'Premium-quiz: alleen te spelen met Premium. Klik om gratis te maken.' : 'Gratis quiz. Klik om alleen voor Premium te maken.'}
      onClick={() => onPremium(quiz)}
      className={cn(actionBase, on ? 'border-gold-edge/40 bg-gold-tint text-gold-text hover:border-gold-edge/70' : 'border-line bg-card text-ink-soft hover:bg-chip')}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1.8} strokeLinejoin="round" className={on ? 'fill-gold stroke-gold-text' : 'fill-none stroke-current'}>
        <path d="M3 18L5 7l5 5 2-7 2 7 5-5 2 11z" />
      </svg>
      Premium
    </button>
  );
}
