"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RoomResultEntry, RoomSnapshot, RoomStatus } from '@/lib/multiplayer/types';
import {
  getMultiplayerAuthToken,
  getResults,
  getRoomSnapshot,
  joinRoom,
  leaveRoom,
  startRoom,
  submitAnswer,
  MultiplayerClientHttpError,
} from './client';
import { toUserMessage } from './errors';
import { resolveRoomStatus } from './state-machine';

interface UseMultiplayerRoomControllerOptions {
  roomCode: string;
  userId: string | null;
  autoJoin?: boolean;
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
  token: string | null;
  errorMessage: string | null;
  connectionStatus: MultiplayerControllerConnectionStatus;
  isStarting: boolean;
  isSubmittingAnswer: boolean;
  isLeaving: boolean;
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
  token: null,
  errorMessage: null,
  connectionStatus: 'idle',
  isStarting: false,
  isSubmittingAnswer: false,
  isLeaving: false,
  roomClosed: false,
  debugEvents: [],
  lastSyncedAtMs: null,
  consecutiveFailures: 0,
};

/**
 * Polling cadence (ms) for room state. Tuned to balance responsiveness with
 * Mongo write load (each poll triggers a heartbeat update at most every 10s
 * server-side).
 *
 * - lobby:           2000  - players joining/leaving must feel near-instant
 * - in_progress:      900  - keep the timer accurate-ish on the client
 * - question_result: 1500  - show feedback then transition to next question
 * - finished:        4000  - almost no updates expected, slow down
 */
const POLL_INTERVALS_MS: Record<RoomStatus, number> = {
  lobby: 2000,
  in_progress: 900,
  question_result: 1500,
  finished: 4000,
};

/** When polling fails we back off; this is the absolute ceiling. */
const POLL_FAILURE_MAX_BACKOFF_MS = 6000;

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

function pickPollInterval(status: RoomStatus | null, failures: number): number {
  const base = status ? POLL_INTERVALS_MS[status] : POLL_INTERVALS_MS.lobby;
  if (failures === 0) return base;
  // Exponential backoff with cap.
  const backoff = Math.min(base * 2 ** Math.min(failures, 4), POLL_FAILURE_MAX_BACKOFF_MS);
  return backoff;
}

/**
 * Encapsulates a single room session: token bootstrap, optional join, and
 * the perpetual snapshot polling loop.
 *
 * Lifecycle:
 *  - construct(roomCode, userId, autoJoin, callbacks)
 *  - start()      - fetches token + (optionally) joins room + starts polling
 *  - dispose()    - cancels in-flight work, stops polling, marks disposed
 *
 * Idempotency: dispose() is safe to call multiple times. start() is NOT
 * meant to be called more than once on the same instance - to "restart"
 * a session, dispose the old one and create a new one.
 */
class RoomSession {
  private disposed = false;
  private token: string | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlightPoll: AbortController | null = null;

  constructor(
    private readonly roomCode: string,
    private readonly userId: string,
    private readonly autoJoin: boolean,
    private readonly callbacks: {
      onState: (updater: (current: MultiplayerControllerState) => MultiplayerControllerState) => void;
      onDebug: (entry: MultiplayerDebugEntry) => void;
    },
  ) {}

  isDisposed(): boolean {
    return this.disposed;
  }

  getToken(): string | null {
    return this.token;
  }

  emitDebug(level: MultiplayerDebugLevel, message: string, details?: Record<string, unknown>): void {
    this.callbacks.onDebug({
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    });
  }

  async start(): Promise<void> {
    this.emitDebug('info', 'Starting room session', {
      roomCode: this.roomCode,
      userId: this.userId,
      autoJoin: this.autoJoin,
    });

    this.callbacks.onState((current) => ({
      ...current,
      loading: true,
      errorMessage: null,
      roomClosed: false,
      results: [],
      connectionStatus: 'connecting',
      consecutiveFailures: 0,
    }));

    try {
      const token = await getMultiplayerAuthToken();
      if (this.disposed) return;
      this.token = token;
      this.emitDebug('info', 'Fetched multiplayer auth token', { tokenLength: token.length });

      const room = this.autoJoin
        ? await joinRoom({ token, roomCode: this.roomCode })
        : await getRoomSnapshot({ token, roomCode: this.roomCode });

      if (this.disposed) return;

      this.emitDebug('info', this.autoJoin ? 'Joined room successfully' : 'Loaded room snapshot', {
        roomCode: room.code,
        status: room.status,
        players: room.players.length,
        revision: room.revision,
      });

      this.callbacks.onState((current) => ({
        ...current,
        token,
        loading: false,
        errorMessage: null,
        room: this.mergeRoom(current.room, room),
        roomClosed: false,
        connectionStatus: 'connected',
        consecutiveFailures: 0,
        lastSyncedAtMs: Date.now(),
      }));

      if (room.status === 'finished') {
        await this.fetchResults(token);
      }

      this.scheduleNextPoll(room.status, 0);
    } catch (error) {
      if (this.disposed) return;

      this.emitDebug('error', 'Failed to start room session', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });

      const isRoomNotFound =
        error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND';

      this.callbacks.onState((current) => ({
        ...current,
        loading: false,
        roomClosed: isRoomNotFound,
        errorMessage: toUserMessage(error),
        connectionStatus: 'disconnected',
      }));
    }
  }

  /**
   * Triggered manually after a state-changing action (e.g. submitAnswer)
   * so the UI updates immediately rather than waiting for the next poll.
   */
  async refreshNow(): Promise<void> {
    const token = this.token;
    if (!token || this.disposed) return;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.inFlightPoll) {
      this.inFlightPoll.abort();
      this.inFlightPoll = null;
    }
    await this.runPoll();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.inFlightPoll) {
      this.inFlightPoll.abort();
      this.inFlightPoll = null;
    }
    this.emitDebug('info', 'Disposing room session');
    this.callbacks.onState((current) => ({
      ...current,
      connectionStatus: 'disconnected',
    }));
  }

  // ── Polling loop ────────────────────────────────────────────────────────

  private scheduleNextPoll(currentStatus: RoomStatus, failures: number): void {
    if (this.disposed) return;

    const intervalMs = pickPollInterval(currentStatus, failures);
    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      void this.runPoll();
    }, intervalMs);
  }

  private async runPoll(): Promise<void> {
    if (this.disposed) return;
    const token = this.token;
    if (!token) return;

    this.inFlightPoll = new AbortController();

    let success = false;
    let nextStatus: RoomStatus = 'lobby';

    try {
      const room = await getRoomSnapshot({ token, roomCode: this.roomCode });
      if (this.disposed) return;

      success = true;
      nextStatus = room.status;

      this.callbacks.onState((current) => {
        const merged = this.mergeRoom(current.room, room);
        // If we just transitioned to `finished`, schedule a results fetch on
        // the next tick rather than blocking this update.
        const willFetchResults = current.room?.status !== 'finished' && room.status === 'finished';
        if (willFetchResults) {
          void this.fetchResults(token);
        }
        return {
          ...current,
          room: merged,
          loading: false,
          roomClosed: false,
          connectionStatus: 'connected',
          consecutiveFailures: 0,
          errorMessage: this.shouldRetainError(current.errorMessage) ? current.errorMessage : null,
          lastSyncedAtMs: Date.now(),
        };
      });
    } catch (error) {
      if (this.disposed) return;

      // Auth/structural errors require a different reaction than transient
      // network ones - don't keep polling forever if the room is gone.
      if (error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND') {
        this.emitDebug('warn', 'Polling discovered ROOM_NOT_FOUND - closing session');
        this.callbacks.onState((current) => ({
          ...current,
          loading: false,
          roomClosed: true,
          errorMessage: toUserMessage(error),
          connectionStatus: 'disconnected',
        }));
        return;
      }

      this.callbacks.onState((current) => {
        const failures = current.consecutiveFailures + 1;
        this.emitDebug('warn', 'Snapshot poll failed', {
          attempt: failures,
          reason: error instanceof Error ? error.message : 'unknown_error',
        });
        return {
          ...current,
          consecutiveFailures: failures,
          connectionStatus: failures >= 2 ? 'reconnecting' : current.connectionStatus,
        };
      });
      nextStatus = 'lobby';
    } finally {
      this.inFlightPoll = null;
    }

    if (this.disposed) return;

    this.callbacks.onState((current) => {
      this.scheduleNextPoll(success ? nextStatus : (current.room?.status ?? 'lobby'), current.consecutiveFailures);
      return current;
    });
  }

  private mergeRoom(current: RoomSnapshot | null, next: RoomSnapshot): RoomSnapshot {
    // Reject snapshots that walk the state machine backwards (e.g. due to
    // an out-of-order response on a slow link).
    const resolvedStatus = resolveRoomStatus(current?.status ?? null, next.status);
    if (current && resolvedStatus !== next.status) {
      return current;
    }
    if (current && current.revision > next.revision) {
      // Stale snapshot.
      return current;
    }
    return { ...next, status: resolvedStatus };
  }

  private async fetchResults(token: string): Promise<void> {
    try {
      const results = await getResults({ token, roomCode: this.roomCode });
      if (this.disposed) return;
      this.callbacks.onState((current) => ({ ...current, results }));
    } catch (error) {
      if (this.disposed) return;
      this.emitDebug('warn', 'Failed to fetch results', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  private shouldRetainError(message: string | null): boolean {
    if (!message) return false;
    // Retain the last server-supplied user-facing error until the user
    // explicitly clears it. Network reconnection alone shouldn't.
    return false;
  }
}

export function useMultiplayerRoomController(options: UseMultiplayerRoomControllerOptions) {
  const normalizedRoomCode = useMemo(() => normalizeRoomCode(options.roomCode), [options.roomCode]);
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
      pushDebugEntry({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Skipping room controller init - userId is null. Will retry once authenticated.',
      });
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    const session = new RoomSession(normalizedRoomCode, options.userId, options.autoJoin !== false, {
      onState: setState,
      onDebug: pushDebugEntry,
    });

    sessionRef.current = session;
    void session.start();

    return () => {
      sessionRef.current = null;
      session.dispose();
    };
  }, [normalizedRoomCode, options.userId, options.autoJoin, pushDebugEntry]);

  const refreshSnapshot = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    await session.refreshNow();
  }, []);

  const start = useCallback(async () => {
    const session = sessionRef.current;
    const token = session?.getToken();
    if (!token || !session) return;

    setState((current) => ({ ...current, isStarting: true, errorMessage: null }));
    try {
      const room = await startRoom({ token, roomCode: normalizedRoomCode });
      setState((current) => {
        const resolvedStatus = resolveRoomStatus(current.room?.status ?? null, room.status);
        if (current.room && resolvedStatus !== room.status) return current;
        return {
          ...current,
          room: { ...room, status: resolvedStatus },
          lastSyncedAtMs: Date.now(),
        };
      });
      await session.refreshNow();
    } catch (error) {
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    } finally {
      setState((current) => ({ ...current, isStarting: false }));
    }
  }, [normalizedRoomCode]);

  const answer = useCallback(
    async (questionId: string, answerId: string) => {
      const session = sessionRef.current;
      const token = session?.getToken();
      if (!token || !session) return;

      const currentSnapshot = stateSnapshotRef.current;
      if (currentSnapshot.isSubmittingAnswer) return;

      const currentPlayer = currentSnapshot.room?.players.find((p) => p.id === options.userId);
      if (currentPlayer?.hasAnswered) return;

      setState((current) => ({ ...current, isSubmittingAnswer: true, errorMessage: null }));

      try {
        await submitAnswer({ token, roomCode: normalizedRoomCode, questionId, answerId });
        await session.refreshNow();
      } catch (error) {
        setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
      } finally {
        setState((current) => ({ ...current, isSubmittingAnswer: false }));
      }
    },
    [normalizedRoomCode, options.userId],
  );

  const leave = useCallback(async () => {
    const session = sessionRef.current;
    const token = session?.getToken();
    if (!token || !session) return;

    setState((current) => ({ ...current, isLeaving: true, errorMessage: null }));
    try {
      await leaveRoom({ token, roomCode: normalizedRoomCode });
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
  useEffect(() => {
    stateSnapshotRef.current = state;
  }, [state]);

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
    answer,
    leave,
    refreshSnapshot,
    clearError,
  };
}
