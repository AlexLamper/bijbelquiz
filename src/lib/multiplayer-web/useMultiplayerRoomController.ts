"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RoomResultEntry, RoomSnapshot, RoomStatus } from '@/lib/multiplayer/types';
import {
  advanceRoom,
  getResults,
  getRoomSnapshot,
  isAbortError,
  joinRoom,
  leaveRoom,
  startRoom,
  submitAnswer,
  MultiplayerClientHttpError,
} from './client';
import { toUserMessage } from './errors';
import { resolveRoomStatus } from './state-machine';
import { MultiplayerTokenStore } from './token-store';

interface UseMultiplayerRoomControllerOptions {
  roomCode: string;
  userId: string | null;
  autoJoin?: boolean;
  /**
   * True when the user arrived through a shared invite link. Only labels the
   * funnel event; it changes nothing about the join itself.
   */
  viaInvite?: boolean;
}

export type MultiplayerControllerConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

export type MultiplayerDebugLevel = 'info' | 'warn' | 'error';

export interface MultiplayerDebugEntry {
  timestamp: string;
  level: MultiplayerDebugLevel;
  message: string;
  details?: Record<string, unknown>;
}

interface MultiplayerControllerState {
  loading: boolean;
  room: RoomSnapshot | null;
  results: RoomResultEntry[];
  errorMessage: string | null;
  connectionStatus: MultiplayerControllerConnectionStatus;
  isStarting: boolean;
  isSubmittingAnswer: boolean;
  isLeaving: boolean;
  isSkipping: boolean;
  roomClosed: boolean;
  /** Newest first, capped to 200 entries. */
  debugEvents: string[];
  lastSyncedAtMs: number | null;
  /** Number of consecutive failed polls. Drives the connection-status UI. */
  consecutiveFailures: number;
}

const INITIAL_STATE: MultiplayerControllerState = {
  loading: true,
  room: null,
  results: [],
  errorMessage: null,
  connectionStatus: 'idle',
  isStarting: false,
  isSubmittingAnswer: false,
  isLeaving: false,
  isSkipping: false,
  roomClosed: false,
  debugEvents: [],
  lastSyncedAtMs: null,
  consecutiveFailures: 0,
};

/**
 * Polling cadence (ms) per room status. Kept in sync with
 * `RECOMMENDED_POLL_INTERVALS_MS` on the server.
 *
 * - lobby:           2000  - players joining/leaving must feel near-instant
 * - in_progress:      900  - keep the timer accurate-ish on the client
 * - question_result: 1200  - show feedback then transition to next question
 * - finished:        4000  - almost no updates expected, slow down
 */
const POLL_INTERVALS_MS: Record<RoomStatus, number> = {
  lobby: 2000,
  // Deadline-free, host-advanced: same relaxed cadence as the lobby.
  reading: 2000,
  in_progress: 900,
  question_result: 1200,
  finished: 4000,
};

/** When polling fails we back off; this is the absolute ceiling. */
const POLL_FAILURE_MAX_BACKOFF_MS = 6000;
/** Never schedule a poll tighter than this, whatever the maths says. */
const MIN_POLL_INTERVAL_MS = 250;
/**
 * Grace period added after a server-side deadline before we poll for the
 * transition, so we don't arrive a few milliseconds early and waste a request.
 */
const DEADLINE_POLL_GRACE_MS = 200;
/**
 * How many polls in a row must report ROOM_NOT_FOUND before we declare the game
 * gone. A single 404 is not proof: it can also be a request that raced a token
 * refresh, a dropped connection, or a proxy answering for something else. The
 * old code latched the "Spel niet beschikbaar" screen on the first one and
 * never polled again, so a live room stayed unreachable until a full reload.
 */
const NOT_FOUND_CONFIRMATIONS = 2;

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

function serializeDebugDetails(details: Record<string, unknown> | undefined): string {
  if (!details) return '';
  try {
    return ` ${JSON.stringify(details)}`;
  } catch {
    return ' [details_unserializable]';
  }
}

function asDebugLine(entry: MultiplayerDebugEntry): string {
  return `${entry.timestamp} [${entry.level}] ${entry.message}${serializeDebugDetails(entry.details)}`;
}

/**
 * Encapsulates a single room session: token bootstrap, optional join, and the
 * perpetual snapshot polling loop.
 *
 * Everything that is *not* React state - the poll timer, the abort handle, the
 * failure counter, the server clock offset - lives on the instance rather than
 * in `useState`. That matters: React's StrictMode double-invokes state updater
 * functions in development, so scheduling a timer from inside an updater used
 * to queue two timers per poll, doubling the request rate on every tick until
 * the tab was hammering the API. Updaters here are pure.
 *
 * Lifecycle:
 *  - construct(roomCode, userId, autoJoin, callbacks)
 *  - start()      - fetches token + (optionally) joins room + starts polling
 *  - dispose()    - cancels in-flight work, stops polling, marks disposed
 *
 * Idempotency: dispose() is safe to call multiple times. start() is not meant
 * to be called more than once on the same instance - to restart a session,
 * dispose the old one and create a new one.
 */
class RoomSession {
  private disposed = false;
  private readonly tokens = new MultiplayerTokenStore();
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollAbort: AbortController | null = null;
  private polling = false;
  /** Resolves once the in-flight poll has finished unwinding. */
  private pollSettled: Promise<void> | null = null;
  private consecutiveFailures = 0;
  private consecutiveNotFound = 0;
  private lastRoom: RoomSnapshot | null = null;
  private resultsFetchedForRoom = false;
  /** localNow - serverTimeMs at the last successful read. */
  private clockOffsetMs = 0;

  constructor(
    private readonly roomCode: string,
    private readonly userId: string,
    private readonly autoJoin: boolean,
    private readonly viaInvite: boolean,
    private readonly callbacks: {
      onState: (updater: (current: MultiplayerControllerState) => MultiplayerControllerState) => void;
      onDebug: (entry: MultiplayerDebugEntry) => void;
    },
  ) {}

  isDisposed(): boolean {
    return this.disposed;
  }

  emitDebug(level: MultiplayerDebugLevel, message: string, details?: Record<string, unknown>): void {
    if (this.disposed && level !== 'info') return;
    this.callbacks.onDebug({
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    });
  }

  private patch(partial: Partial<MultiplayerControllerState>): void {
    this.callbacks.onState((current) => ({ ...current, ...partial }));
  }

  async start(): Promise<void> {
    this.emitDebug('info', 'Starting room session', {
      roomCode: this.roomCode,
      userId: this.userId,
      autoJoin: this.autoJoin,
    });

    this.patch({
      loading: true,
      errorMessage: null,
      roomClosed: false,
      results: [],
      connectionStatus: 'connecting',
      consecutiveFailures: 0,
    });

    try {
      const room = await this.tokens.run((token) => this.enterRoom(token));
      if (this.disposed) return;

      this.emitDebug('info', this.autoJoin ? 'Joined room' : 'Loaded room snapshot', {
        roomCode: room.code,
        status: room.status,
        players: room.players.length,
        revision: room.revision,
      });

      this.applySnapshot(room, { clearError: true });
      this.patch({ loading: false, connectionStatus: 'connected' });

      if (room.status === 'finished') {
        void this.fetchResults();
      }

      this.scheduleNextPoll();
    } catch (error) {
      if (this.disposed || isAbortError(error)) return;

      this.emitDebug('error', 'Failed to start room session', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });

      const isRoomNotFound =
        error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND';

      if (isRoomNotFound) {
        // Count this as the first strike and hand over to the polling loop
        // instead of closing the session outright. If the room is genuinely
        // gone the next poll confirms it and we show the same screen a moment
        // later; if the 404 was a blip, the session recovers by itself.
        this.consecutiveNotFound = 1;
        this.patch({
          loading: false,
          errorMessage: toUserMessage(error),
          connectionStatus: 'reconnecting',
        });
        this.scheduleNextPoll();
        return;
      }

      this.patch({
        loading: false,
        roomClosed: false,
        errorMessage: toUserMessage(error),
        connectionStatus: 'disconnected',
      });
    }
  }

  /**
   * Join the room, falling back to a plain read when joining is not possible
   * but the room is still viewable. A player who reloads mid-game, or who
   * follows a link to a game already in progress, should see the live room
   * rather than a dead-end error card.
   */
  private async enterRoom(token: string): Promise<RoomSnapshot> {
    if (!this.autoJoin) {
      return getRoomSnapshot({ token, roomCode: this.roomCode });
    }

    try {
      return await joinRoom({
        token,
        roomCode: this.roomCode,
        viaInvite: this.viaInvite,
      });
    } catch (error) {
      const canStillWatch =
        error instanceof MultiplayerClientHttpError &&
        (error.code === 'ROOM_ALREADY_STARTED' ||
          error.code === 'ROOM_FINISHED' ||
          error.code === 'ROOM_FULL');

      if (!canStillWatch) {
        throw error;
      }

      this.emitDebug('warn', 'Join rejected, falling back to read-only snapshot', {
        code: error.code,
      });
      return getRoomSnapshot({ token, roomCode: this.roomCode });
    }
  }

  /**
   * Poll immediately, cancelling anything already in flight. Used after a
   * state-changing action so the UI updates without waiting a full interval.
   */
  async refreshNow(): Promise<void> {
    if (this.disposed) return;

    this.clearTimer();
    this.abortInFlight();

    // Aborting a fetch rejects it asynchronously, so `polling` is still true
    // here and the call below would hit the re-entrancy guard in `runPoll()`
    // and do nothing - leaving no timer armed and no request in flight, which
    // silently killed the loop for the rest of the session. Wait for the
    // superseded poll to unwind before starting its replacement.
    if (this.pollSettled) {
      await this.pollSettled;
    }

    await this.runPoll();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.clearTimer();
    this.abortInFlight();
    this.emitDebug('info', 'Disposing room session');
    this.patch({ connectionStatus: 'disconnected' });
  }

  /** Token accessor for one-off authenticated calls (start/answer/leave). */
  runAuthenticated<T>(call: (token: string) => Promise<T>): Promise<T> {
    return this.tokens.run(call);
  }

  // ── Polling loop ────────────────────────────────────────────────────────

  private clearTimer(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private abortInFlight(): void {
    if (this.pollAbort) {
      this.pollAbort.abort();
      this.pollAbort = null;
    }
  }

  /**
   * Pick the delay before the next poll. Normally the per-status cadence, but
   * when the server has published a deadline that lands sooner (the question
   * timer, or the end of the between-questions pause) we poll just after it so
   * the transition shows up immediately instead of up to a full interval late.
   */
  private computeDelayMs(): number {
    if (this.consecutiveFailures > 0) {
      const base = POLL_INTERVALS_MS[this.lastRoom?.status ?? 'lobby'];
      return Math.min(base * 2 ** Math.min(this.consecutiveFailures, 4), POLL_FAILURE_MAX_BACKOFF_MS);
    }

    const room = this.lastRoom;
    const base = POLL_INTERVALS_MS[room?.status ?? 'lobby'];
    if (!room) return base;

    const serverDeadline =
      room.status === 'in_progress'
        ? room.currentQuestion?.deadlineAtMs ?? null
        : room.status === 'question_result'
          ? room.resultPhaseEndsAtMs
          : null;

    if (serverDeadline == null) return base;

    const untilDeadlineMs = serverDeadline + this.clockOffsetMs - Date.now() + DEADLINE_POLL_GRACE_MS;
    if (untilDeadlineMs > 0 && untilDeadlineMs < base) {
      return Math.max(MIN_POLL_INTERVAL_MS, untilDeadlineMs);
    }

    return base;
  }

  private scheduleNextPoll(): void {
    if (this.disposed) return;

    this.clearTimer();
    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      void this.runPoll();
    }, this.computeDelayMs());
  }

  private async runPoll(): Promise<void> {
    if (this.disposed || this.polling) return;

    this.polling = true;
    const abort = new AbortController();
    this.pollAbort = abort;

    let markSettled: () => void = () => {};
    this.pollSettled = new Promise<void>((resolve) => {
      markSettled = resolve;
    });

    // Every exit path re-arms the timer except two: a poll that `refreshNow()`
    // superseded (its replacement is already on its way) and a room we have
    // confirmed is gone.
    let reschedule = true;

    try {
      const room = await this.tokens.run(
        (token) => getRoomSnapshot({ token, roomCode: this.roomCode, signal: abort.signal }),
        abort.signal,
      );
      if (this.disposed) return;

      this.consecutiveFailures = 0;
      this.consecutiveNotFound = 0;
      const previousStatus = this.lastRoom?.status ?? null;
      this.applySnapshot(room, { clearError: true });
      this.patch({
        loading: false,
        roomClosed: false,
        connectionStatus: 'connected',
        consecutiveFailures: 0,
      });

      if (previousStatus !== 'finished' && room.status === 'finished') {
        void this.fetchResults();
      }
    } catch (error) {
      if (this.disposed) return;

      if (isAbortError(error)) {
        reschedule = false;
        return;
      }

      // A room that no longer exists is terminal - but only once we've seen it
      // missing often enough to be sure. Closing on a single 404 turned any
      // transient blip into a permanent "Spel niet beschikbaar" dead end.
      if (error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND') {
        this.consecutiveNotFound += 1;

        if (this.consecutiveNotFound >= NOT_FOUND_CONFIRMATIONS) {
          this.emitDebug('warn', 'Polling confirmed ROOM_NOT_FOUND - closing session', {
            attempts: this.consecutiveNotFound,
          });
          reschedule = false;
          this.patch({
            loading: false,
            roomClosed: true,
            errorMessage: toUserMessage(error),
            connectionStatus: 'disconnected',
          });
          return;
        }

        this.emitDebug('warn', 'Snapshot poll returned ROOM_NOT_FOUND - reconfirming', {
          attempt: this.consecutiveNotFound,
        });
      }

      this.consecutiveFailures += 1;
      this.emitDebug('warn', 'Snapshot poll failed', {
        attempt: this.consecutiveFailures,
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
      this.patch({
        consecutiveFailures: this.consecutiveFailures,
        connectionStatus: this.consecutiveFailures >= 2 ? 'reconnecting' : 'connected',
      });
    } finally {
      this.polling = false;
      if (this.pollAbort === abort) {
        this.pollAbort = null;
      }
      markSettled();
      if (!this.disposed && reschedule) {
        this.scheduleNextPoll();
      }
    }
  }

  /**
   * Merge a freshly received snapshot into state, dropping any that arrived
   * out of order, and refresh the server clock offset used for countdowns.
   */
  applySnapshot(next: RoomSnapshot, options: { clearError?: boolean } = {}): void {
    const merged = this.mergeRoom(this.lastRoom, next);
    if (merged === this.lastRoom && this.lastRoom !== null) {
      return;
    }

    this.clockOffsetMs = Date.now() - next.serverTimeMs;
    this.lastRoom = merged;

    this.patch({
      room: merged,
      lastSyncedAtMs: Date.now(),
      ...(options.clearError ? { errorMessage: null } : {}),
    });
  }

  private mergeRoom(current: RoomSnapshot | null, next: RoomSnapshot): RoomSnapshot {
    if (!current) {
      return next;
    }

    // Reject snapshots that walk the state machine backwards (e.g. due to an
    // out-of-order response on a slow link).
    const resolvedStatus = resolveRoomStatus(current.status, next.status);
    if (resolvedStatus !== next.status) {
      return current;
    }

    // Same status but an older revision means a stale response overtook a
    // fresher one; keep what we have.
    if (current.status === next.status && current.revision > next.revision) {
      return current;
    }

    return next;
  }

  private async fetchResults(): Promise<void> {
    if (this.disposed || this.resultsFetchedForRoom) return;
    this.resultsFetchedForRoom = true;

    try {
      const results = await this.tokens.run((token) =>
        getResults({ token, roomCode: this.roomCode }),
      );
      if (this.disposed) return;
      this.patch({ results });
    } catch (error) {
      if (this.disposed || isAbortError(error)) return;
      this.resultsFetchedForRoom = false;
      this.emitDebug('warn', 'Failed to fetch results', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }
}

export function useMultiplayerRoomController(options: UseMultiplayerRoomControllerOptions) {
  const normalizedRoomCode = useMemo(() => normalizeRoomCode(options.roomCode), [options.roomCode]);
  const autoJoin = options.autoJoin !== false;
  const viaInvite = options.viaInvite === true;
  const sessionRef = useRef<RoomSession | null>(null);

  const [state, setState] = useState<MultiplayerControllerState>(INITIAL_STATE);

  const pushDebugEntry = useCallback((entry: MultiplayerDebugEntry) => {
    setState((current) => ({
      ...current,
      debugEvents: [asDebugLine(entry), ...current.debugEvents].slice(0, 200),
    }));

    if (process.env.NODE_ENV !== 'production') {
      const fn = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.info;
      if (entry.details) {
        fn(`[multiplayer-web] ${entry.message}`, entry.details);
      } else {
        fn(`[multiplayer-web] ${entry.message}`);
      }
    }
  }, []);

  useEffect(() => {
    if (!options.userId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    const session = new RoomSession(normalizedRoomCode, options.userId, autoJoin, viaInvite, {
      onState: setState,
      onDebug: pushDebugEntry,
    });

    sessionRef.current = session;
    void session.start();

    return () => {
      sessionRef.current = null;
      session.dispose();
    };
  }, [normalizedRoomCode, options.userId, autoJoin, viaInvite, pushDebugEntry]);

  /**
   * Poll immediately when the tab becomes visible again. Browsers throttle
   * background timers hard, so a tab restored after a minute is otherwise
   * showing a stale room until the next (throttled) tick lands.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void sessionRef.current?.refreshNow();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, []);

  const refreshSnapshot = useCallback(async () => {
    await sessionRef.current?.refreshNow();
  }, []);

  const start = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    setState((current) => ({ ...current, isStarting: true, errorMessage: null }));
    try {
      const room = await session.runAuthenticated((token) =>
        startRoom({ token, roomCode: normalizedRoomCode }),
      );
      session.applySnapshot(room);
      await session.refreshNow();
    } catch (error) {
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    } finally {
      setState((current) => ({ ...current, isStarting: false }));
    }
  }, [normalizedRoomCode]);

  const skip = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    setState((current) => ({ ...current, isSkipping: true, errorMessage: null }));
    try {
      const room = await session.runAuthenticated((token) =>
        advanceRoom({ token, roomCode: normalizedRoomCode }),
      );
      session.applySnapshot(room);
      await session.refreshNow();
    } catch (error) {
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    } finally {
      setState((current) => ({ ...current, isSkipping: false }));
    }
  }, [normalizedRoomCode]);

  const answer = useCallback(
    async (questionId: string, answerId: string) => {
      const session = sessionRef.current;
      if (!session) return;

      const currentSnapshot = stateSnapshotRef.current;
      if (currentSnapshot.isSubmittingAnswer) return;

      const currentPlayer = currentSnapshot.room?.players.find((p) => p.id === options.userId);
      if (currentPlayer?.hasAnswered) return;

      setState((current) => ({ ...current, isSubmittingAnswer: true, errorMessage: null }));

      try {
        const room = await session.runAuthenticated((token) =>
          submitAnswer({ token, roomCode: normalizedRoomCode, questionId, answerId }),
        );
        // The answer endpoint returns the post-answer snapshot, so the choice
        // is reflected instantly instead of after the next poll.
        if (room) session.applySnapshot(room);
        await session.refreshNow();
      } catch (error) {
        setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
        // Whatever went wrong, re-sync so the UI matches the server.
        void session.refreshNow();
      } finally {
        setState((current) => ({ ...current, isSubmittingAnswer: false }));
      }
    },
    [normalizedRoomCode, options.userId],
  );

  const leave = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    setState((current) => ({ ...current, isLeaving: true, errorMessage: null }));
    try {
      await session.runAuthenticated((token) => leaveRoom({ token, roomCode: normalizedRoomCode }));
      session.dispose();
      sessionRef.current = null;
    } catch (error) {
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    } finally {
      setState((current) => ({ ...current, isLeaving: false }));
    }
  }, [normalizedRoomCode]);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, errorMessage: null }));
  }, []);

  // Stable ref for the latest state - used inside `answer` so we don't recreate
  // the callback on every render.
  const stateSnapshotRef = useRef(state);
  stateSnapshotRef.current = state;

  const currentPlayer = state.room?.players.find((p) => p.id === options.userId) ?? null;
  const isHost = currentPlayer?.isHost ?? false;
  const canStart = Boolean(state.room && state.room.status === 'lobby' && isHost && state.room.players.length >= 2);
  const canAnswer = Boolean(
    state.room?.status === 'in_progress' && !currentPlayer?.hasAnswered && !state.isSubmittingAnswer,
  );

  return {
    ...state,
    currentPlayer,
    isHost,
    canStart,
    canAnswer,
    start,
    skip,
    answer,
    leave,
    refreshSnapshot,
    clearError,
  };
}
