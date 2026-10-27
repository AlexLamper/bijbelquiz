'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RefreshCcw, X } from 'lucide-react';

import { Button, Card, Container, EmptyState, PlayHeader, Spinner } from '@/components/bq';
import { track } from '@/lib/analytics/client';
import { buildRoomInviteMessage, INVITE_SOURCE_PARAM, INVITE_SOURCE_VALUE } from '@/lib/multiplayer/invite';
import { useMultiplayerRoomController } from '@/lib/multiplayer-web/useMultiplayerRoomController';
import type { RoomResultEntry, RoomSnapshot } from '@/lib/multiplayer/types';
import { DebugPanel } from './DebugPanel';
import { GameView } from './GameView';
import { LobbyView } from './LobbyView';
import { ResultsView } from './ResultsView';
import { routeForRoom, statusBelongsTo, type RoomView } from './routes';

interface RoomClientProps {
  roomCode: string;
  view: RoomView;
  /** From the server: the quiz's category, for the waiting room's quiz card. */
  categoryTitle?: string | null;
}

function buildResultsFallback(players: RoomSnapshot['players']): RoomResultEntry[] {
  return [...players]
    .sort((a, b) => b.score - a.score || b.correctAnswers - a.correctAnswers || a.name.localeCompare(b.name))
    .map((player, index) => ({
      rank: index + 1,
      playerId: player.id,
      playerName: player.name,
      score: player.score,
      correctAnswers: player.correctAnswers,
    }));
}

export type ShareState = 'idle' | 'shared' | 'copied';

/**
 * One room, three screens. Owns the polling controller (join, reconnect,
 * heartbeat, start/answer/advance/leave), moves the browser to the screen that
 * belongs to the room's status, and hands the snapshot to the lobby, game or
 * results view. The transport and its protocol live in
 * `src/lib/multiplayer-web`; this file only renders.
 */
export default function RoomClient({ roomCode, view, categoryTitle = null }: RoomClientProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const normalizedRoomCode = useMemo(() => roomCode.trim().toUpperCase(), [roomCode]);

  // Read once, before the router can strip the parameter, so a re-render does
  // not turn an invited join into a direct one.
  const [arrivedViaInvite] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get(INVITE_SOURCE_PARAM) === INVITE_SOURCE_VALUE;
  });
  const [showDebug] = useState(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return false;
    return new URLSearchParams(window.location.search).has('debug');
  });

  const userId = session?.user?.id ?? null;

  const controller = useMultiplayerRoomController({
    roomCode: normalizedRoomCode,
    userId,
    autoJoin: true,
    viaInvite: arrivedViaInvite,
  });
  const { loading, room, results, errorMessage, roomClosed, leave, refreshSnapshot, clearError } = controller;

  const [shareState, setShareState] = useState<ShareState>('idle');
  const [codeCopied, setCodeCopied] = useState(false);

  // Follow the room: lobby -> spel -> uitslag, for every device at once.
  useEffect(() => {
    if (!room) return;
    if (statusBelongsTo(view, room.status)) return;
    router.replace(routeForRoom(room.code, room.status));
  }, [room, router, view]);

  const displayedResults = useMemo(() => {
    if (results.length > 0) return results;
    return room ? buildResultsFallback(room.players) : [];
  }, [results, room]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(normalizedRoomCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1600);
    } catch {
      setCodeCopied(false);
    }
  }

  /**
   * Share the room as a link: the native share sheet where there is one (on a
   * phone that is one tap into WhatsApp), otherwise the whole message is
   * copied.
   */
  async function shareInvite() {
    const message = buildRoomInviteMessage(normalizedRoomCode, room?.quizTitle ?? '', window.location.origin);

    track('room_invite_shared', {
      roomCode: normalizedRoomCode,
      method: typeof navigator.share === 'function' ? 'share_sheet' : 'clipboard',
    });

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'BijbelQuiz', text: message });
        return;
      } catch {
        // Cancelled, or unavailable here: fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(message);
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 1800);
    } catch {
      setShareState('idle');
    }
  }

  async function leaveAndExit(target = '/samen-spelen') {
    await leave();
    router.push(target);
  }

  const isGame = view === 'game';

  const frame = (content: React.ReactNode) =>
    isGame ? (
      <div className="flex min-h-screen flex-col bg-canvas">
        <PlayHeader
          leaveLabel="Spel verlaten"
          leaveHref="/samen-spelen"
          icon={<X className="size-4" strokeWidth={2.6} aria-hidden="true" />}
        />
        <main id="inhoud" className="flex flex-1 flex-col">
          {content}
        </main>
      </div>
    ) : (
      content
    );

  if (sessionStatus === 'loading' || (loading && !room)) {
    return frame(
      <Container className="flex flex-1 items-center justify-center py-24">
        <Spinner label="Kamer laden" size={32} />
      </Container>,
    );
  }

  if (!session) {
    return frame(
      <Container width="form" className="py-16">
        <EmptyState
          title="Inloggen vereist"
          description="Log in om samen te spelen."
          action={<Button href="/inloggen?callbackUrl=/samen-spelen">Inloggen</Button>}
        />
      </Container>,
    );
  }

  if (roomClosed || !room) {
    return frame(
      <Container width="form" className="py-16">
        <EmptyState
          icon={<RefreshCcw />}
          tone="grey"
          title={roomClosed ? 'Kamer niet beschikbaar' : 'Kamer laden mislukt'}
          description={
            roomClosed
              ? 'Deze kamer bestaat niet meer of is gesloten door de host.'
              : errorMessage ?? 'Probeer het opnieuw, of ga terug naar Samen spelen.'
          }
          action={
            <div className="flex flex-col gap-2.5 m:flex-row">
              <Button variant="secondary" onClick={() => void refreshSnapshot()}>
                Opnieuw proberen
              </Button>
              <Button href="/samen-spelen">Terug naar Samen spelen</Button>
            </div>
          }
        />
      </Container>,
    );
  }

  const errorBar = errorMessage ? (
    <Card padding="none" role="alert" className="flex flex-col gap-3 border-coral-line px-5 py-4 m:flex-row m:items-center">
      <p className="m-0 flex-1 text-[15px] font-bold text-coral-text">{errorMessage}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={clearError}>
          Sluiten
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void refreshSnapshot()}>
          Verversen
        </Button>
      </div>
    </Card>
  ) : null;

  const debug = showDebug ? (
    <DebugPanel
      debugEvents={controller.debugEvents}
      connectionStatus={controller.connectionStatus}
      roomStatus={room.status}
      playerCount={room.players.length}
      userId={userId}
      onSnapshot={() => void refreshSnapshot()}
    />
  ) : null;

  if (view === 'lobby') {
    return (
      <LobbyView
        room={room}
        userId={userId}
        isHost={controller.isHost}
        canStart={controller.canStart}
        isStarting={controller.isStarting}
        isLeaving={controller.isLeaving}
        connectionStatus={controller.connectionStatus}
        categoryTitle={categoryTitle}
        shareState={shareState}
        codeCopied={codeCopied}
        onShare={() => void shareInvite()}
        onCopyCode={() => void copyCode()}
        onStart={() => void controller.start()}
        onLeave={(target) => void leaveAndExit(target)}
        errorBar={errorBar}
        debug={debug}
      />
    );
  }

  if (view === 'results') {
    return (
      <ResultsView
        room={room}
        userId={userId}
        results={displayedResults}
        isLeaving={controller.isLeaving}
        onLeave={() => void leaveAndExit()}
        errorBar={errorBar}
        debug={debug}
      />
    );
  }

  return (
    <GameView
      room={room}
      userId={userId}
      isHost={controller.isHost}
      canAnswer={controller.canAnswer}
      isSubmittingAnswer={controller.isSubmittingAnswer}
      isSkipping={controller.isSkipping}
      isLeaving={controller.isLeaving}
      connectionStatus={controller.connectionStatus}
      onAnswer={(questionId, answerId) => void controller.answer(questionId, answerId)}
      onSkip={() => void controller.skip()}
      onLeave={() => void leaveAndExit()}
      errorBar={errorBar}
      debug={debug}
    />
  );
}
