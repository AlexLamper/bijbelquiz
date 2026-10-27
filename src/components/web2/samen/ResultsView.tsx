'use client';

import { useState } from 'react';
import { BookOpen, Users } from 'lucide-react';

import { Avatar, Button, Container, RankBadge } from '@/components/bq';
import StudieLink from '@/components/StudieLink';
import { passageFromBookName } from '@/lib/ecosystem-links';
import type { RoomResultEntry, RoomSnapshot } from '@/lib/multiplayer/types';
import { cn } from '@/lib/utils';
import { HomeButton } from '@/components/web2/quiz-result/HomeButton';
import { playerName } from './players';
import { pointsLabel, questionCountLabel, quizDisplayTitle } from './quiz-display';

interface ResultsViewProps {
  room: RoomSnapshot;
  userId: string | null;
  results: RoomResultEntry[];
  isLeaving: boolean;
  /** Leave the room, then go to `target` (the Samen spelen page by default). */
  onLeave: (target?: string) => void;
  errorBar: React.ReactNode;
  debug: React.ReactNode;
}

const PODIUM = {
  1: { ring: 'gold', avatar: 82, block: 'h-24 bg-gold-wash text-gold-text pt-2', points: 'text-gold-text' },
  2: { ring: 'silver', avatar: 66, block: 'h-16 bg-silver-tint text-silver-text pt-2', points: 'text-silver-text' },
  3: { ring: 'bronze', avatar: 66, block: 'h-11 bg-bronze-tint text-bronze-text pt-1.5', points: 'text-bronze-text' },
} as const;

function Crown() {
  return (
    <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true" className="text-gold">
      <path
        d="M3 6l6 6 6-9 6 9 6-6-2.5 13h-19z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PodiumPlace({ entry, place, userId }: { entry: RoomResultEntry; place: 1 | 2 | 3; userId: string | null }) {
  const style = PODIUM[place];
  const isMe = entry.playerId === userId;
  const name = playerName({ id: entry.playerId, name: entry.playerName }, userId);
  return (
    <li className="flex min-w-0 flex-col items-center gap-1.5">
      {place === 1 && <Crown />}
      <Avatar
        name={entry.playerName}
        size={style.avatar}
        tone={isMe ? 'solid' : 'auto'}
        ring={style.ring}
        badge={<RankBadge rank={place} tone={style.ring} />}
        title={name}
      />
      <span className="mt-2 max-w-full truncate text-base font-extrabold">{name}</span>
      <span className={cn('text-[15px] font-bold', style.points)}>{pointsLabel(entry.score)}</span>
      <span
        aria-hidden="true"
        className={cn('mt-1 flex w-full justify-center rounded-t-[14px] font-display text-[28px] font-semibold leading-8', style.block)}
      >
        {place}
      </span>
    </li>
  );
}

type GroupState = 'idle' | 'saving' | 'saved' | 'error';

export function ResultsView({ room, userId, results, isLeaving, onLeave, errorBar, debug }: ResultsViewProps) {
  /**
   * Offering to keep the people you just played with. Asked here and nowhere
   * else: this is the one moment the group demonstrably exists. Dismissable,
   * and gone once saved.
   */
  const [groupState, setGroupState] = useState<GroupState>('idle');
  const [groupError, setGroupError] = useState<string | null>(null);
  const [savedGroupName, setSavedGroupName] = useState<string | null>(null);
  const [groupDismissed, setGroupDismissed] = useState(false);
  const [leavingHome, setLeavingHome] = useState(false);

  async function saveGroup() {
    setGroupState('saving');
    setGroupError(null);
    try {
      const response = await fetch('/api/player-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: room.code }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setGroupError(payload?.error || 'Groep bewaren is niet gelukt.');
        setGroupState('error');
        return;
      }
      setSavedGroupName(payload?.group?.name ?? null);
      setGroupState('saved');
    } catch {
      setGroupError('Groep bewaren is niet gelukt.');
      setGroupState('error');
    }
  }

  const passageLabel = room.passage?.label ?? null;
  const studiePassage = passageFromBookName(room.passage?.book, room.passage?.chapter);
  const top = results.slice(0, 3);
  const rest = results.slice(3);
  // Second, first, third, as a podium stands.
  const podium: Array<{ entry: RoomResultEntry; place: 1 | 2 | 3 } | null> = [
    top[1] ? { entry: top[1], place: 2 } : null,
    top[0] ? { entry: top[0], place: 1 } : null,
    top[2] ? { entry: top[2], place: 3 } : null,
  ];
  const playerCount = room.players.length;

  return (
    <Container className="flex flex-col gap-7 pb-[72px] pt-10 max-m:px-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">Eindstand</h1>
        <p className="m-0 text-[17px] font-semibold leading-[26px] text-ink-muted">
          <span className="whitespace-nowrap">{quizDisplayTitle(room.quizTitle, passageLabel)}</span> ·{' '}
          <span className="whitespace-nowrap">
            {questionCountLabel(room.totalQuestions)} · {playerCount} {playerCount === 1 ? 'speler' : 'spelers'}
          </span>
        </p>
      </div>

      {errorBar}

      <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,1fr)_360px] m:grid-rows-[auto_1fr]">
        <section aria-label="Eindstand" className="flex min-w-0 flex-col gap-6 m:col-start-1 m:row-start-1">
          {results.length === 0 ? (
            <p role="status" className="m-0 rounded-[16px] border border-line bg-card px-5 py-6 text-center text-[15px] font-semibold text-ink-muted">
              De uitslag wordt geladen...
            </p>
          ) : (
            <div className="flex flex-col pt-2">
              <ol aria-label="Top 3" className="mx-auto grid w-full max-w-[560px] list-none grid-cols-3 items-end gap-4 p-0">
                {podium.map((spot, index) =>
                  spot ? (
                    <PodiumPlace key={spot.entry.playerId} entry={spot.entry} place={spot.place} userId={userId} />
                  ) : (
                    <li key={`leeg-${index}`} aria-hidden="true" />
                  ),
                )}
              </ol>

              {rest.length > 0 && (
                <ol
                  start={4}
                  aria-label={`Plek 4 tot ${results.length}`}
                  className="m-0 flex list-none flex-col overflow-hidden rounded-[16px] border border-line bg-card p-0"
                >
                  {rest.map((entry, index) => {
                    const isMe = entry.playerId === userId;
                    return (
                      <li
                        key={entry.playerId}
                        aria-current={isMe || undefined}
                        className={cn('flex items-center gap-3.5 border-b border-line-soft px-5 py-3 last:border-b-0', isMe && 'bg-lapis-tint')}
                      >
                        <span className="w-7 shrink-0 text-center text-[15px] font-extrabold text-ink-soft">{entry.rank ?? index + 4}</span>
                        <Avatar name={entry.playerName} size={40} tone={isMe ? 'solid' : 'auto'} />
                        <span className="min-w-0 flex-1 truncate text-base font-bold">
                          {playerName({ id: entry.playerId, name: entry.playerName }, userId)}
                        </span>
                        <span className="whitespace-nowrap text-[15px] font-extrabold text-ink-soft">{pointsLabel(entry.score)}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 m:flex-row">
            <Button href="/samen-spelen" size="xl">
              Nieuw spel
            </Button>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => {
                setLeavingHome(false);
                onLeave();
              }}
              loading={isLeaving && !leavingHome}
              disabled={isLeaving}
            >
              Spel verlaten
            </Button>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-5 m:col-start-2 m:row-span-2 m:row-start-1">
          {playerCount >= 2 && !groupDismissed && groupState !== 'saved' && (
            <section aria-labelledby="groep-titel" className="flex flex-col gap-3.5 rounded-[16px] border border-line bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-lapis-tint text-lapis" aria-hidden="true">
                  <Users className="size-[22px]" strokeWidth={2.2} />
                </span>
                <h2 id="groep-titel" className="m-0 text-xl leading-[26px]">
                  Deze groep bewaren?
                </h2>
              </div>
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-soft">
                Dan houd je een eigen ranglijst bij met deze {playerCount} spelers, en nodig je ze de volgende keer met één klik weer uit.
              </p>
              {groupError && (
                <p role="alert" className="m-0 text-sm font-bold text-coral-text">
                  {groupError}
                </p>
              )}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => void saveGroup()}
                  disabled={groupState === 'saving'}
                  className="h-11 rounded-[10px] border-b-[3px] border-b-lapis-pale bg-lapis-tint px-[18px] text-[15px] font-extrabold text-lapis-edge transition-colors hover:bg-lapis-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis disabled:opacity-60"
                >
                  {groupState === 'saving' ? 'Bewaren...' : 'Groep bewaren'}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupDismissed(true)}
                  className="h-11 px-1 text-[15px] font-bold text-ink-muted hover:text-ink"
                >
                  Nee, bedankt
                </button>
              </div>
            </section>
          )}

          {groupState === 'saved' && (
            <section aria-labelledby="groep-titel" className="flex flex-col gap-3 rounded-[16px] border border-line bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-lapis-tint text-lapis" aria-hidden="true">
                  <Users className="size-[22px]" strokeWidth={2.2} />
                </span>
                <h2 id="groep-titel" className="m-0 text-xl leading-[26px]">
                  {savedGroupName ? `"${savedGroupName}" is bewaard` : 'Groep bewaard'}
                </h2>
              </div>
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-soft">Je vindt de stand van deze groep op de ranglijst.</p>
              <Button href="/ranglijst" variant="secondary" size="md" className="self-start">
                Naar de ranglijst
              </Button>
            </section>
          )}

          {/* The one moment this product speaks to a whole group at once, so the
              chapter they just played about is offered to everyone. */}
          <section aria-labelledby="lees-titel" className="flex flex-col gap-3 rounded-[16px] border border-line bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-green-tint text-green" aria-hidden="true">
                <BookOpen className="size-[22px]" strokeWidth={2.2} />
              </span>
              <h2 id="lees-titel" className="m-0 text-xl leading-[26px]">
                {studiePassage && passageLabel ? `Verder met ${passageLabel}` : 'Verder met BijbelStudie'}
              </h2>
            </div>
            <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-soft">
              {studiePassage ? 'Lees het hoofdstuk op BijbelStudie, met uitleg erbij.' : 'Lees verder op BijbelStudie, met uitleg erbij.'}
            </p>
            <StudieLink
              passage={studiePassage}
              surface="multiplayer_end"
              quizSlug={room.quizTitle}
              className="inline-flex items-center gap-1.5 self-start text-[15px] font-extrabold text-lapis no-underline hover:text-lapis-edge"
            />
          </section>
        </aside>

        {/* Last on the page: under the standings on a wide screen, after the side column on a phone. */}
        <div className="flex min-w-0 flex-col m:col-start-1 m:row-start-2">
          <HomeButton
            onClick={() => {
              setLeavingHome(true);
              onLeave('/dashboard');
            }}
            loading={isLeaving && leavingHome}
          />
        </div>
      </div>

      {debug}
    </Container>
  );
}
