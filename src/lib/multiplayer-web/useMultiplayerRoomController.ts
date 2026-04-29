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

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

function serializeDebugDetails(details: Record<string, unknown> | undefined): string {
  if (!details) {
    return '';
  }

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

export function useMultiplayerRoomController(options: UseMultiplayerRoomControllerOptions) {
  const normalizedRoomCode = useMemo(() => normalizeRoomCode(options.roomCode), [options.roomCode]);
  const realtimeRef = useRef<MultiplayerRealtimeClient | null>(null);

  const pushDebugEvent = useCallback((entry: MultiplayerRealtimeDebugEntry) => {
    setState((current) => {
      const nextEvents = [asDebugLine(entry), ...current.debugEvents].slice(0, 120);
      return {
        ...current,
        debugEvents: nextEvents,
      };
    });

    if (process.env.NODE_ENV !== 'production') {
      const method = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'info';

      if (entry.details) {
        console[method](`[multiplayer-web] ${entry.message}`, entry.details);
      } else {
        console[method](`[multiplayer-web] ${entry.message}`);
      }
    }
  }, []);

  const debug = useCallback(
    (level: MultiplayerRealtimeDebugEntry['level'], message: string, details?: Record<string, unknown>) => {
      pushDebugEvent({
        timestamp: new Date().toISOString(),
        level,
        message,
        details,
      });
    },
    [pushDebugEvent],
  );

  const [state, setState] = useState<MultiplayerControllerState>({
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
  });

  const applyRoom = useCallback((nextRoom: RoomSnapshot) => {
    setState((current) => {
      const resolvedStatus = resolveRoomStatus(current.room?.status ?? null, nextRoom.status);

      if (current.room && resolvedStatus !== nextRoom.status) {
        return current;
      }

      return {
        ...current,
        room: {
          ...nextRoom,
          status: resolvedStatus,
        },
        roomClosed: false,
        loading: false,
      };
    });

    debug('info', 'Applied room snapshot', {
      roomCode: nextRoom.code,
      status: nextRoom.status,
      players: nextRoom.players.length,
      currentQuestionIndex: nextRoom.currentQuestionIndex,
    });
  }, [debug]);

  const handleRealtimeEvent = useCallback(
    (event: MultiplayerWsInboundEvent) => {
      debug('info', 'Received realtime event', {
        type: event.type,
      });

      if (event.type === 'error') {
        debug('warn', 'Realtime payload contained server error event', {
          code: event.payload.code,
          message: event.payload.message,
        });

        setState((current) => ({
          ...current,
          errorMessage: event.payload.message,
        }));
        return;
      }

      if ('room' in event.payload) {
        applyRoom(event.payload.room);
      }

      if (event.type === 'game_finished') {
        setState((current) => ({
          ...current,
          results: event.payload.results,
        }));
      }
    },
    [applyRoom, debug],
  );

  const refreshSnapshot = useCallback(async () => {
    if (!state.token) {
      debug('warn', 'Skipped snapshot refresh because auth token is missing');
      return;
    }

    debug('info', 'Refreshing room snapshot via HTTP', {
      roomCode: normalizedRoomCode,
    });

    try {
      const room = await getRoomSnapshot({
        token: state.token,
        roomCode: normalizedRoomCode,
      });
      applyRoom(room);

      if (room.status === 'finished') {
        const latestResults = await getResults({
          token: state.token,
          roomCode: normalizedRoomCode,
        });

        setState((current) => ({
          ...current,
          results: latestResults,
        }));
      }
    } catch (error) {
      if (error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND') {
        debug('warn', 'Snapshot refresh returned ROOM_NOT_FOUND', {
          roomCode: normalizedRoomCode,
        });

        setState((current) => ({
          ...current,
          roomClosed: true,
          loading: false,
          errorMessage: toUserMessage(error),
        }));
        return;
      }

      debug('error', 'Snapshot refresh failed', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });

      setState((current) => ({
        ...current,
        errorMessage: toUserMessage(error),
      }));
    }
  }, [applyRoom, debug, normalizedRoomCode, state.token]);

  useEffect(() => {
    let cancelled = false;

    debug('info', 'Initializing room controller', {
      roomCode: normalizedRoomCode,
      autoJoin: options.autoJoin !== false,
      userId: options.userId,
    });

    setState((current) => ({
      ...current,
      loading: true,
      errorMessage: null,
      roomClosed: false,
      results: [],
    }));

    void (async () => {
      try {
        const token = await getMultiplayerAuthToken();
        debug('info', 'Fetched multiplayer auth token', {
          roomCode: normalizedRoomCode,
          tokenLength: token.length,
        });

        if (cancelled) {
          debug('warn', 'Init aborted after token fetch because effect was cancelled');
          return;
        }

        const room = options.autoJoin === false
          ? await getRoomSnapshot({ token, roomCode: normalizedRoomCode })
          : await joinRoom({ token, roomCode: normalizedRoomCode });

        debug('info', options.autoJoin === false ? 'Loaded room snapshot without auto-join' : 'Joined room successfully', {
          roomCode: room.code,
          status: room.status,
          players: room.players.length,
        });

        if (cancelled) {
          debug('warn', 'Init aborted after join/snapshot because effect was cancelled');
          return;
        }

        setState((current) => ({
          ...current,
          token,
          loading: false,
          errorMessage: null,
        }));
        applyRoom(room);

        if (room.status === 'finished') {
          const latestResults = await getResults({ token, roomCode: normalizedRoomCode });
          if (!cancelled) {
            setState((current) => ({
              ...current,
              results: latestResults,
            }));
          }
        }

        const realtime = new MultiplayerRealtimeClient({
          token,
          roomCode: normalizedRoomCode,
          snapshotIntervalMs: 1500,
          getSnapshot: () =>
            getRoomSnapshot({
              token,
              roomCode: normalizedRoomCode,
            }),
          onSnapshot: (snapshotRoom) => {
            applyRoom(snapshotRoom);
          },
          onEvent: handleRealtimeEvent,
          onConnectionStatus: (status) => {
            debug('info', 'Realtime connection status changed', {
              status,
            });

            setState((current) => ({
              ...current,
              connectionStatus: status,
            }));
          },
          onDebug: (entry) => {
            pushDebugEvent(entry);
          },
          onError: (error) => {
            debug('warn', 'Realtime onError callback triggered', {
              name: error.name,
              message: error.message,
            });

            // Connection and polling failures are transient; keep syncing and avoid noisy UI banners.
            if (isRealtimeConnectionError(error) || isRealtimeSnapshotError(error)) {
              return;
            }

            setState((current) => ({
              ...current,
              errorMessage: toUserMessage(error),
            }));
          },
        });

        realtimeRef.current?.disconnect();
        realtimeRef.current = realtime;
        realtime.connect();
      } catch (error) {
        debug('error', 'Failed to initialize room controller', {
          reason: error instanceof Error ? error.message : 'unknown_error',
        });

        if (cancelled) {
          return;
        }

        const isRoomNotFound = error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND';

        setState((current) => ({
          ...current,
          loading: false,
          roomClosed: isRoomNotFound,
          errorMessage: toUserMessage(error),
        }));
      }
    })();

    return () => {
      cancelled = true;
      debug('info', 'Disposing room controller effect', {
        roomCode: normalizedRoomCode,
      });
      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
    };
  }, [
    applyRoom,
    debug,
    handleRealtimeEvent,
    normalizedRoomCode,
    options.autoJoin,
    options.userId,
    pushDebugEvent,
  ]);

  const start = useCallback(async () => {
    if (!state.token) {
      debug('warn', 'Cannot start game because token is missing');
      return;
    }

    debug('info', 'Attempting to start room', {
      roomCode: normalizedRoomCode,
    });

    setState((current) => ({ ...current, isStarting: true, errorMessage: null }));

    try {
      const room = await startRoom({
        token: state.token,
        roomCode: normalizedRoomCode,
      });
      applyRoom(room);
    } catch (error) {
      debug('warn', 'Start room failed', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });

      setState((current) => ({
        ...current,
        errorMessage: toUserMessage(error),
      }));
    } finally {
      setState((current) => ({ ...current, isStarting: false }));
    }
  }, [applyRoom, debug, normalizedRoomCode, state.token]);

  const answer = useCallback(
    async (questionId: string, answerId: string) => {
      if (!state.token || state.isSubmittingAnswer) {
        debug('warn', 'Skipped answer submission', {
          hasToken: Boolean(state.token),
          isSubmittingAnswer: state.isSubmittingAnswer,
        });
        return;
      }

      const currentPlayer = state.room?.players.find((player) => player.id === options.userId);
      if (currentPlayer?.hasAnswered) {
        debug('warn', 'Skipped answer submission because player already answered', {
          roomCode: normalizedRoomCode,
          userId: options.userId,
        });
        return;
      }

      debug('info', 'Submitting answer', {
        roomCode: normalizedRoomCode,
        questionId,
        answerId,
      });

      setState((current) => ({
        ...current,
        isSubmittingAnswer: true,
        errorMessage: null,
      }));

      try {
        await submitAnswer({
          token: state.token,
          roomCode: normalizedRoomCode,
          questionId,
          answerId,
        });
      } catch (error) {
        debug('warn', 'Submit answer failed', {
          reason: error instanceof Error ? error.message : 'unknown_error',
        });

        setState((current) => ({
          ...current,
          errorMessage: toUserMessage(error),
        }));
      } finally {
        setState((current) => ({ ...current, isSubmittingAnswer: false }));
      }
    },
    [debug, normalizedRoomCode, options.userId, state.isSubmittingAnswer, state.room?.players, state.token],
  );

  const leave = useCallback(async () => {
    if (!state.token) {
      debug('warn', 'Cannot leave room because token is missing');
      return;
    }

    debug('info', 'Leaving room', {
      roomCode: normalizedRoomCode,
    });

    setState((current) => ({ ...current, isLeaving: true, errorMessage: null }));

    try {
      await leaveRoom({
        token: state.token,
        roomCode: normalizedRoomCode,
      });

      debug('info', 'Leave room request succeeded', {
        roomCode: normalizedRoomCode,
      });

      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
    } catch (error) {
      debug('warn', 'Leave room failed', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });

      setState((current) => ({
        ...current,
        errorMessage: toUserMessage(error),
      }));
    } finally {
      setState((current) => ({ ...current, isLeaving: false }));
    }
  }, [debug, normalizedRoomCode, state.token]);

  const clearError = useCallback(() => {
    debug('info', 'Cleared visible error banner');
    setState((current) => ({ ...current, errorMessage: null }));
  }, [debug]);

  const currentPlayer = state.room?.players.find((player) => player.id === options.userId) ?? null;
  const isHost = currentPlayer?.isHost ?? false;
  const canStart = Boolean(state.room && state.room.status === 'lobby' && isHost && state.room.players.length >= 2);
  const canAnswer = Boolean(state.room?.status === 'in_progress' && !currentPlayer?.hasAnswered && !state.isSubmittingAnswer);

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
