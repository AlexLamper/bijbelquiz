'use client';

import * as React from 'react';

import { Button, Modal, Skeleton } from '@/components/bq';
import { readGuestAllowance } from '@/lib/free-quiz-limit';
import { cn } from '@/lib/utils';
import { BookIcon } from './illustrations';

interface ChapterVerse {
  verse: number;
  text: string;
}

/**
 * "Lees Johannes 6" / "Lees eerst Johannes 6": the chapter of the quiz in a
 * dialog, from the same `/api/bible/chapter` the player's reader uses, with
 * the start button at the end so reading leads straight into the quiz.
 */
export function PassageReaderButton({
  book,
  chapter,
  label,
  playHref,
  variant,
}: {
  /** The book as the questions cite it, which is what the chapter API expects. */
  book: string;
  chapter: number;
  /** "Johannes 6". */
  label: string;
  playHref: string;
  variant: 'pill' | 'link';
}) {
  const [open, setOpen] = React.useState(false);
  const [verses, setVerses] = React.useState<ChapterVerse[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!open || verses || failed) return;
    let cancelled = false;
    fetch(`/api/bible/chapter?book=${encodeURIComponent(book)}&chapter=${chapter}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload: { verses?: ChapterVerse[] }) => {
        if (cancelled) return;
        if (payload.verses?.length) setVerses(payload.verses);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, verses, failed, book, chapter]);

  return (
    <>
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lapis-tint px-3.5 text-sm font-extrabold text-lapis hover:bg-lapis-wash"
        >
          <BookIcon size={15} strokeWidth={2.4} />
          Lees {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center justify-center px-2 text-[15px] font-bold text-lapis hover:text-lapis-edge"
        >
          Lees eerst {label}
        </button>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={label}
        description="Lees het hoofdstuk rustig door. De vragen gaan hierover."
        size="lg"
        footer={
          <Button href={playHref} size="lg">
            Start quiz
          </Button>
        }
      >
        {failed && (
          <p className="m-0 rounded-[12px] bg-chip px-4 py-3 text-[15px] font-semibold text-ink-soft">
            Dit hoofdstuk kon nu niet geladen worden. Je kunt gewoon met de quiz beginnen.
          </p>
        )}
        {!failed && !verses && (
          <div className="flex flex-col gap-3" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className={cn('h-4', index % 3 === 2 ? 'w-2/3' : 'w-full')} />
            ))}
          </div>
        )}
        {verses && (
          <div className="flex flex-col gap-3">
            {verses.map((verse) => (
              <p key={verse.verse} className="m-0 flex gap-3 text-[17px] font-semibold leading-[27px] text-ink-body">
                <span className="w-6 shrink-0 pt-0.5 text-right text-xs font-extrabold tabular-nums text-ink-faint">{verse.verse}</span>
                <span>{verse.text}</span>
              </p>
            ))}
            <p className="m-0 border-t border-line-soft pt-3 text-[13px] font-semibold text-ink-muted">Statenvertaling</p>
          </div>
        )}
      </Modal>
    </>
  );
}

/**
 * "Nog 2 gratis quizzen" for a player without Premium. Signed-in players get
 * the number from the server; a guest's count lives in this browser, so it is
 * read here after mount. Hidden for Premium and when no free quiz is left
 * (the player then shows the locked paywall itself).
 */
export function FreeQuizzesLine({ remaining }: { remaining: number | null | 'guest' }) {
  const [guestRemaining, setGuestRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (remaining !== 'guest') return;
    setGuestRemaining(readGuestAllowance().remaining);
  }, [remaining]);

  const value = remaining === 'guest' ? guestRemaining : remaining;
  if (value === null || value <= 0) return null;

  return (
    <p className="m-0 text-sm font-semibold text-ink-muted">
      Nog <span className="font-extrabold text-ink">{value}</span> gratis {value === 1 ? 'quiz' : 'quizzen'}
    </p>
  );
}
