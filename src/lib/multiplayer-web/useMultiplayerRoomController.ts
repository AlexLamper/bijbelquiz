"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RoomResultEntry, RoomSnapshot } from '@/lib/multiplayer/types';
import type { MultiplayerConnectionStatus, MultiplayerWsInboundEvent } from './contracts';
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
import type { MultiplayerRealtimeDebugEntry } from './realtime';
import { MultiplayerRealtimeClient } from './realtime';
import { resolveRoomStatus } from './state-machine';

interface UseMultiplayerRoomControllerOptions {
  roomCode: string;
  userId: string | null;
  autoJoin?: boolean;
}

interface MultiplayerControllerState {
  loading: boolean;
  room: RoomSnapshot | null;
  results: RoomResultEntry[];
  token: string | null;
  errorMessage: string | null;
  connectionStatus: MultiplayerConnectionStatus;
  isStarting: boolean;
  isSubmittingAnswer: boolean;
  isLeaving: boolean;
  roomClosed: boolean;
  debugEvents: string[];
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
};

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

function asDebugLine(entry: MultiplayerRealtimeDebugEntry): string {
  return `${entry.timestamp} [${entry.level}] ${entry.message}${serializeDebugDetails(entry.details)}`;
}

function isRealtimeConnectionError(error: Error): boolean {
  return error.name === 'MultiplayerRealtimeConnectionError';
}

function isRealtimeSnapshotError(error: Error): boolean {
  return error.name === 'MultiplayerSnapshotRefreshError';
}

/**
 * Encapsulates one room session: token fetch → HTTP join → realtime client →
 * debug log capture. Construction is synchronous; bootstrapping happens via
 * `start()`. `dispose()` is idempotent so React Strict Mode's mount-unmount
 * dance is safe.
 */
class RoomSession {
  private disposed = false;
  private realtime: MultiplayerRealtimeClient | null = null;
  private token: string | null = null;

  constructor(
    private readonly roomCode: string,
    private readonly userId: string,
    private readonly autoJoin: boolean,
    private readonly callbacks: {
      onState: (updater: (current: MultiplayerControllerState) => MultiplayerControllerState) => void;
      onDebugEntry: (entry: MultiplayerRealtimeDebugEntry) => void;
    },
  ) {}

  isDisposed(): boolean {
    return this.disposed;
  }

  getToken(): string | null {
    return this.token;
  }

  emitDebug(level: 'info' | 'warn' | 'error', message: string, details?: Record<string, unknown>): void {
    this.callbacks.onDebugEntry({
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
    }));

    try {
      const token = await getMultiplayerAuthToken();
      if (this.disposed) {
        this.emitDebug('warn', 'Session disposed during token fetch; aborting start');
        return;
      }
      this.token = token;
      this.emitDebug('info', 'Fetched multiplayer auth token', {
        tokenLength: token.length,
      });

      const room = this.autoJoin
        ? await joinRoom({ token, roomCode: this.roomCode })
        : await getRoomSnapshot({ token, roomCode: this.roomCode });

      if (this.disposed) {
        this.emitDebug('warn', 'Session disposed after join/snapshot; aborting start');
        return;
      }

      this.emitDebug('info', this.autoJoin ? 'Joined room successfully' : 'Loaded room snapshot', {
        roomCode: room.code,
        status: room.status,
        players: room.players.length,
      });

      this.callbacks.onState((current) => ({
        ...current,
        token,
        loading: false,
        errorMessage: null,
        room: {
          ...room,
          status: resolveRoomStatus(current.room?.status ?? null, room.status),
        },
        roomClosed: false,
      }));

      if (room.status === 'finished') {
        try {
          const results = await getResults({ token, roomCode: this.roomCode });
          if (this.disposed) return;
          this.callbacks.onState((current) => ({ ...current, results }));
        } catch {
          // results may be unavailable, that's ok
        }
      }

      this.openRealtime(token);
    } catch (error) {
      if (this.disposed) return;
      this.emitDebug('error', 'Failed to start room session', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });

      const isRoomNotFound = error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND';

      this.callbacks.onState((current) => ({
        ...current,
        loading: false,
        roomClosed: isRoomNotFound,
        errorMessage: toUserMessage(error),
      }));
    }
  }

  private openRealtime(token: string): void {
    if (this.disposed) return;

    const realtime = new MultiplayerRealtimeClient({
      token,
      roomCode: this.roomCode,
      getSnapshot: () => getRoomSnapshot({ token, roomCode: this.roomCode }),
      onSnapshot: (room) => {
        if (this.disposed) return;
        this.applyRoom(room);
      },
      onEvent: (event) => {
        if (this.disposed) return;
        this.handleEvent(event);
      },
      onConnectionStatus: (status) => {
        if (this.disposed) return;
        this.emitDebug('info', 'Realtime connection status changed', { status });
        this.callbacks.onState((current) =>
          current.connectionStatus === status ? current : { ...current, connectionStatus: status },
        );
      },
      onError: (error) => {
        if (this.disposed) return;
        this.emitDebug('warn', 'Realtime onError', { name: error.name, message: error.message });

        // Connection / polling failures are transient; don't surface to UI.
        if (isRealtimeConnectionError(error) || isRealtimeSnapshotError(error)) {
          return;
        }

        this.callbacks.onState((current) => ({
          ...current,
          errorMessage: toUserMessage(error),
        }));
      },
      onDebug: (entry) => {
        this.callbacks.onDebugEntry(entry);
      },
    });

    this.realtime = realtime;
    realtime.connect();
  }

  private applyRoom(nextRoom: RoomSnapshot): void {
    this.callbacks.onState((current) => {
      const resolvedStatus = resolveRoomStatus(current.room?.status ?? null, nextRoom.status);
      // Reject snapshots that would walk the state machine backwards.
      if (current.room && resolvedStatus !== nextRoom.status) {
        return current;
      }
      return {
        ...current,
        room: { ...nextRoom, status: resolvedStatus },
        roomClosed: false,
        loading: false,
      };
    });
  }

  private handleEvent(event: MultiplayerWsInboundEvent): void {
    this.emitDebug('info', 'Realtime event received', { type: event.type });

    if (event.type === 'error') {
      this.emitDebug('warn', 'Realtime payload contained error event', {
        code: event.payload.code,
        message: event.payload.message,
      });
      this.callbacks.onState((current) => ({ ...current, errorMessage: event.payload.message }));
      return;
    }

    if ('room' in event.payload) {
      this.applyRoom(event.payload.room);
    }

    if (event.type === 'game_finished') {
      this.callbacks.onState((current) => ({ ...current, results: event.payload.results }));
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.emitDebug('info', 'Disposing room session');
    if (this.realtime) {
      this.realtime.disconnect();
      this.realtime = null;
    }
  }
}

export function useMultiplayerRoomController(options: UseMultiplayerRoomControllerOptions) {
  const normalizedRoomCode = useMemo(() => normalizeRoomCode(options.roomCode), [options.roomCode]);
  const sessionRef = useRef<RoomSession | null>(null);

  const [state, setState] = useState<MultiplayerControllerState>(INITIAL_STATE);

  const pushDebugEntry = useCallback((entry: MultiplayerRealtimeDebugEntry) => {
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

  // Effect: own a single RoomSession scoped to (roomCode, userId, autoJoin).
  useEffect(() => {
    if (!options.userId) {
      pushDebugEntry({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Skipping room controller init — userId is null. Will retry once authenticated.',
      });
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    const session = new RoomSession(normalizedRoomCode, options.userId, options.autoJoin !== false, {
      onState: setState,
      onDebugEntry: pushDebugEntry,
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
    const token = session?.getToken() ?? state.token;

    if (!token) {
      pushDebugEntry({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Skipped snapshot refresh — no token available',
      });
      return;
    }

    try {
      const room = await getRoomSnapshot({ token, roomCode: normalizedRoomCode });
      setState((current) => {
        const resolvedStatus = resolveRoomStatus(current.room?.status ?? null, room.status);
        if (current.room && resolvedStatus !== room.status) return current;
        return {
          ...current,
          room: { ...room, status: resolvedStatus },
          roomClosed: false,
          loading: false,
        };
      });

      if (room.status === 'finished') {
        const results = await getResults({ token, roomCode: normalizedRoomCode });
        setState((current) => ({ ...current, results }));
      }
    } catch (error) {
      if (error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND') {
        setState((current) => ({
          ...current,
          roomClosed: true,
          loading: false,
          errorMessage: toUserMessage(error),
        }));
        return;
      }
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    }
  }, [normalizedRoomCode, pushDebugEntry, state.token]);

  const start = useCallback(async () => {
    const token = sessionRef.current?.getToken() ?? state.token;
    if (!token) return;

    setState((current) => ({ ...current, isStarting: true, errorMessage: null }));
    try {
      const room = await startRoom({ token, roomCode: normalizedRoomCode });
      setState((current) => {
        const resolvedStatus = resolveRoomStatus(current.room?.status ?? null, room.status);
        if (current.room && resolvedStatus !== room.status) return current;
        return {
          ...current,
          room: { ...room, status: resolvedStatus },
        };
      });
    } catch (error) {
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    } finally {
      setState((current) => ({ ...current, isStarting: false }));
    }
  }, [normalizedRoomCode, state.token]);

  const answer = useCallback(async (questionId: string, answerId: string) => {
    const token = sessionRef.current?.getToken() ?? state.token;
    if (!token || state.isSubmittingAnswer) return;

    const currentPlayer = state.room?.players.find((p) => p.id === options.userId);
    if (currentPlayer?.hasAnswered) return;

    setState((current) => ({ ...current, isSubmittingAnswer: true, errorMessage: null }));

    try {
      await submitAnswer({ token, roomCode: normalizedRoomCode, questionId, answerId });
    } catch (error) {
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    } finally {
      setState((current) => ({ ...current, isSubmittingAnswer: false }));
    }
  }, [normalizedRoomCode, options.userId, state.isSubmittingAnswer, state.room?.players, state.token]);

  const leave = useCallback(async () => {
    const token = sessionRef.current?.getToken() ?? state.token;
    if (!token) return;

    setState((current) => ({ ...current, isLeaving: true, errorMessage: null }));
    try {
      await leaveRoom({ token, roomCode: normalizedRoomCode });

      // Tear down the realtime client immediately so the WS doesn't try to
      // reconnect after we navigated away.
      sessionRef.current?.dispose();
      sessionRef.current = null;
    } catch (error) {
      setState((current) => ({ ...current, errorMessage: toUserMessage(error) }));
    } finally {
      setState((current) => ({ ...current, isLeaving: false }));
    }
  }, [normalizedRoomCode, state.token]);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, errorMessage: null }));
  }, []);

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
    debugEvents: state.debugEvents,
  };
}
