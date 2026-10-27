import type {
  CreateDuelInput,
  CreateDuelResult,
  DuelPlayerListItem,
  DuelView,
  SubmitAnswerResult,
} from '@/lib/duels/service';

/**
 * Browser calls to the duel API (`/api/duels/*`). Errors arrive in the
 * `{ error: { code, message } }` envelope; the Dutch message is shown as is.
 */

export class DuelApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DuelApiError';
  }
}

async function call<T>(url: string, init?: { method?: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: init?.method ?? 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new DuelApiError('Geen verbinding. Controleer je internet en probeer het opnieuw.', 'NETWORK', 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error;
    throw new DuelApiError(
      typeof error?.message === 'string' ? error.message : 'Er ging iets mis. Probeer het zo opnieuw.',
      typeof error?.code === 'string' ? error.code : 'INTERNAL_ERROR',
      response.status,
    );
  }
  return payload as T;
}

export function createDuelRequest(input: CreateDuelInput): Promise<CreateDuelResult> {
  return call<CreateDuelResult>('/api/duels', { method: 'POST', body: input });
}

export function joinDuelRequest(token: string): Promise<{ duel: DuelView; joined: boolean }> {
  return call('/api/duels/join', { method: 'POST', body: { token } });
}

export async function getDuelRequest(id: string): Promise<DuelView> {
  const { duel } = await call<{ duel: DuelView }>(`/api/duels/${encodeURIComponent(id)}`);
  return duel;
}

export function answerRequest(
  id: string,
  input: { roundIndex: number; questionIndex: number; answerId: string },
): Promise<SubmitAnswerResult> {
  return call(`/api/duels/${encodeURIComponent(id)}/answer`, { method: 'POST', body: input });
}

export async function declineRequest(id: string): Promise<DuelView> {
  const { duel } = await call<{ duel: DuelView }>(`/api/duels/${encodeURIComponent(id)}/decline`, { method: 'POST', body: {} });
  return duel;
}

export async function forfeitRequest(id: string): Promise<DuelView> {
  const { duel } = await call<{ duel: DuelView }>(`/api/duels/${encodeURIComponent(id)}/forfeit`, { method: 'POST', body: {} });
  return duel;
}

export async function searchPlayersRequest(query: string): Promise<DuelPlayerListItem[]> {
  const { players } = await call<{ players: DuelPlayerListItem[] }>(
    `/api/duels/players?q=${encodeURIComponent(query)}`,
  );
  return players;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Er ging iets mis. Probeer het zo opnieuw.';
}
