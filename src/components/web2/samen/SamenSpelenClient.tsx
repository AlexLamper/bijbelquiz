'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, LogIn, Plus, Users } from 'lucide-react';

import { Button, Card, Container } from '@/components/bq';
import { trackEvent } from '@/components/GoogleAnalytics';
import { createRoom, getActiveRoom, joinRoom } from '@/lib/multiplayer-web/client';
import { MultiplayerTokenStore } from '@/lib/multiplayer-web/token-store';
import { toUserMessage } from '@/lib/multiplayer-web/errors';
import { QUESTION_TIMER_CHOICES } from '@/lib/user-settings';
import { cn } from '@/lib/utils';
import { CodeInput, ROOM_CODE_LENGTH } from './CodeInput';
import { QuizPicker, type PickerCategory, type PickerQuiz } from './QuizPicker';
import { routeForRoom } from './routes';

export type SamenQuiz = PickerQuiz;
export type SamenCategory = PickerCategory;

interface SamenSpelenClientProps {
  quizzes: SamenQuiz[];
  categories: SamenCategory[];
  /** Whether this account holds Premium. Reported to analytics, never enforced. */
  isPremiumUser: boolean;
  /** Room capacity: the same number for everybody. */
  maxPlayers: number;
  /** From `?quiz=` (the "Wijzig" link in the waiting room). */
  initialQuizId: string | null;
}

const PLAYER_CHOICES = [2, 3, 4, 6, 8, 10, 12, 15, 20];

const STEPS = [
  { title: 'Maak een kamer', text: 'Kies een quiz en het aantal spelers. Je krijgt een code.' },
  { title: 'Deel de code', text: 'De anderen vullen de code in of openen je uitnodiging, en wachten in de wachtkamer.' },
  { title: 'Speel samen', text: 'Jij start de quiz. Iedereen antwoordt tegelijk en ziet direct de stand.' },
];

function CardHeading({ icon, title, subtitle, id }: { icon: React.ReactNode; title: string; subtitle: string; id: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-lapis-tint text-lapis" aria-hidden="true">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <h2 id={id} className="m-0 text-2xl leading-[30px]">
          {title}
        </h2>
        <span className="text-[15px] font-semibold leading-5 text-ink-muted">{subtitle}</span>
      </span>
    </div>
  );
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="m-0 rounded-[12px] border border-coral-line bg-coral-tint px-4 py-3 text-[15px] font-bold text-coral-text">
      {children}
    </p>
  );
}

export default function SamenSpelenClient({
  quizzes,
  categories,
  isPremiumUser,
  maxPlayers: capacity,
  initialQuizId,
}: SamenSpelenClientProps) {
  const router = useRouter();
  // Owns the bearer token and silently re-mints it when it has expired, so a
  // page left open for hours still creates/joins on the first click.
  const [tokens] = useState(() => new MultiplayerTokenStore());

  const quizLabelId = useId();
  const playersId = useId();
  const tempoLabelId = useId();

  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId ?? quizzes[0]?.id ?? '');
  const [maxPlayers, setMaxPlayers] = useState<number>(capacity);
  const [readChapterFirst, setReadChapterFirst] = useState(false);
  const [questionTimerSeconds, setQuestionTimerSeconds] = useState<number>(0);
  const [joinCode, setJoinCode] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<{ code: string; status: string; quizTitle: string } | null>(null);

  const selectedQuiz = useMemo(() => quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null, [quizzes, selectedQuizId]);
  const playerChoices = useMemo(
    () => Array.from(new Set([...PLAYER_CHOICES.filter((count) => count <= capacity), capacity])).sort((a, b) => a - b),
    [capacity],
  );

  // Pick up the room this user is still in, so they can jump back into it.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const room = await tokens.run((token) => getActiveRoom({ token }));
        if (!cancelled && room) {
          setActiveRoom({ code: room.code, status: room.status, quizTitle: room.quizTitle });
        }
      } catch {
        // Purely additive: if this fails the page still works normally.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  async function handleCreateRoom() {
    trackEvent('multiplayer_room_create_clicked', {
      is_premium: isPremiumUser,
      requested_players: maxPlayers,
    });

    if (!selectedQuizId) {
      setCreateError('Kies eerst een quiz.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      const room = await tokens.run((token) =>
        createRoom({
          token,
          quizId: selectedQuizId,
          maxPlayers,
          readChapterFirst,
          questionTimerSeconds,
        }),
      );

      trackEvent('multiplayer_room_created', {
        is_premium: isPremiumUser,
        max_players: maxPlayers,
      });
      router.push(`/samen-spelen/${room.code}/lobby`);
    } catch (error) {
      setCreateError(toUserMessage(error));
      setIsCreating(false);
    }
  }

  async function handleJoinRoom(codeOverride?: string) {
    const roomCode = (codeOverride ?? joinCode).trim().toUpperCase();

    if (roomCode.length < 4) {
      setJoinError(`Vul de code van ${ROOM_CODE_LENGTH} tekens in.`);
      return;
    }

    setJoinError(null);
    setIsJoining(true);
    trackEvent('multiplayer_room_join_clicked');

    try {
      const room = await tokens.run((token) => joinRoom({ token, roomCode }));
      trackEvent('multiplayer_room_joined', { status: room.status });
      router.push(routeForRoom(room.code, room.status));
    } catch (error) {
      setJoinError(toUserMessage(error));
      setIsJoining(false);
    }
  }

  const chapterHint = selectedQuiz?.passageLabel
    ? `Iedereen leest ${selectedQuiz.passageLabel} voordat de vragen beginnen. Werkt alleen als de quiz over 1 hoofdstuk gaat.`
    : 'Iedereen leest het hoofdstuk voordat de vragen beginnen. Werkt alleen als de quiz over 1 hoofdstuk gaat.';

  return (
    <Container className="flex flex-col gap-7 pb-[72px] pt-10 max-m:px-5">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">Samen spelen</h1>
        <p className="m-0 max-w-[70ch] text-[17px] font-semibold leading-[26px] text-ink-soft">
          Iedereen speelt tegelijk dezelfde quiz, ieder op een eigen telefoon.
        </p>
        <span className="flex items-center gap-2 text-[15px] font-bold text-ink-muted">
          <Users className="size-[18px] shrink-0 text-lapis" strokeWidth={2.2} aria-hidden="true" />
          Tot {capacity} spelers · gratis, zo vaak je wilt
        </span>
      </div>

      {activeRoom && (
        <Card padding="none" className="flex flex-col gap-3 px-5 py-4 m:flex-row m:items-center m:justify-between">
          <p className="m-0 text-base font-bold text-ink">
            Je doet nog mee aan kamer <span className="font-extrabold tracking-[0.06em]">{activeRoom.code}</span>
            {activeRoom.quizTitle ? <span className="font-semibold text-ink-muted"> · {activeRoom.quizTitle}</span> : null}
          </p>
          <Button href={routeForRoom(activeRoom.code, activeRoom.status)} size="md">
            Verder spelen
            <ArrowRight className="size-4" strokeWidth={2.4} aria-hidden="true" />
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section aria-labelledby="maken-titel" className="flex min-w-0 flex-col gap-[22px] rounded-[16px] border border-line bg-card p-6">
          <CardHeading
            id="maken-titel"
            icon={<Plus className="size-6" strokeWidth={2.2} />}
            title="Kamer maken"
            subtitle="Jij bent de host"
          />

          <div className="flex flex-col gap-2">
            <span id={quizLabelId} className="text-[15px] font-extrabold">
              Quiz
            </span>
            {quizzes.length > 0 ? (
              <QuizPicker
                quizzes={quizzes}
                categories={categories}
                value={selectedQuizId}
                onChange={setSelectedQuizId}
                labelId={quizLabelId}
                disabled={isCreating}
              />
            ) : (
              <p className="m-0 text-[15px] font-semibold text-ink-muted">Er zijn nog geen quizzen om te kiezen.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={playersId} className="text-[15px] font-extrabold">
              Maximaal aantal spelers
            </label>
            <span className="relative flex w-full m:w-[260px]">
              <select
                id={playersId}
                value={maxPlayers}
                onChange={(event) => setMaxPlayers(Number(event.target.value))}
                disabled={isCreating}
                className="h-12 w-full appearance-none rounded-[12px] border border-line bg-card pl-3.5 pr-10 text-base font-bold text-ink outline-none focus-visible:border-lapis focus-visible:ring-2 focus-visible:ring-lapis/25"
              >
                {playerChoices.map((count) => (
                  <option key={count} value={count}>
                    {count} spelers
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-muted"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span id={tempoLabelId} className="text-[15px] font-extrabold">
              Tijd per vraag
            </span>
            <div role="group" aria-labelledby={tempoLabelId} className="grid grid-cols-2 gap-1 rounded-[12px] bg-segment p-1 m:grid-cols-4">
              {QUESTION_TIMER_CHOICES.map((choice) => {
                const active = questionTimerSeconds === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setQuestionTimerSeconds(choice)}
                    className={cn(
                      'h-11 whitespace-nowrap rounded-[9px] px-1 text-[15px] transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lapis',
                      active
                        ? 'border border-line bg-card font-extrabold text-lapis'
                        : 'border border-transparent bg-transparent font-bold text-ink-muted hover:text-ink',
                    )}
                  >
                    {choice === 0 ? 'Geen timer' : `${choice} sec`}
                  </button>
                );
              })}
            </div>
            <span className="text-sm font-semibold leading-5 text-ink-muted">
              Zonder timer druk jij zelf door naar het antwoord en de volgende vraag.
            </span>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-line px-4 py-3.5">
            <input
              type="checkbox"
              checked={readChapterFirst}
              onChange={(event) => setReadChapterFirst(event.target.checked)}
              className="mt-px size-5 shrink-0 accent-lapis"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-base font-bold">Lees eerst het bijbelhoofdstuk</span>
              <span className="text-sm font-semibold leading-5 text-ink-muted">{chapterHint}</span>
            </span>
          </label>

          {createError && <FormError>{createError}</FormError>}

          <Button
            size="xl"
            block
            onClick={() => void handleCreateRoom()}
            loading={isCreating}
            disabled={quizzes.length === 0 || !selectedQuiz}
          >
            {isCreating ? 'Kamer wordt gemaakt...' : 'Kamer maken'}
          </Button>
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <section aria-labelledby="meedoen-titel" className="flex flex-col gap-[18px] rounded-[16px] border border-line bg-card p-6">
            <CardHeading
              id="meedoen-titel"
              icon={<LogIn className="size-6" strokeWidth={2.2} />}
              title="Meedoen met code"
              subtitle={`De host deelt een code van ${ROOM_CODE_LENGTH} tekens`}
            />
            <CodeInput
              value={joinCode}
              onChange={(code) => {
                setJoinCode(code);
                if (joinError) setJoinError(null);
              }}
              onComplete={(code) => void handleJoinRoom(code)}
              disabled={isJoining}
              invalid={Boolean(joinError)}
            />
            {joinError && <FormError>{joinError}</FormError>}
            <Button variant="secondary" size="xl" block onClick={() => void handleJoinRoom()} loading={isJoining}>
              {isJoining ? 'Bezig met verbinden...' : 'Meedoen'}
            </Button>
          </section>

          <section aria-labelledby="hoe-titel" className="flex flex-col gap-[18px] rounded-[16px] border border-line bg-card p-6">
            <h2 id="hoe-titel" className="m-0 text-xl leading-[26px]">
              Hoe werkt het?
            </h2>
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lapis-tint text-sm font-extrabold text-lapis"
                  >
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-base font-bold leading-[22px]">{step.title}</span>
                    <span className="text-sm font-semibold leading-5 text-ink-muted">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </Container>
  );
}

