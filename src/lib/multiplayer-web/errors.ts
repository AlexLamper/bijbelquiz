import type { MultiplayerErrorCode } from '@/lib/multiplayer/errors';
import { MultiplayerClientHttpError } from './client';

export function toUserMessage(error: unknown): string {
  if (error instanceof MultiplayerClientHttpError) {
    const byCode: Partial<Record<MultiplayerErrorCode, string>> = {
      ROOM_NOT_FOUND: 'Kamer niet gevonden. Controleer de code en probeer het opnieuw.',
      ROOM_FULL: 'Deze kamer zit vol.',
      ROOM_ALREADY_STARTED: 'Deze quiz is al begonnen.',
      ROOM_FINISHED: 'Deze quiz is al afgelopen.',
      PLAYER_NOT_IN_ROOM: 'Je doet niet mee in deze kamer.',
      NOT_HOST: 'Alleen de host kan deze actie uitvoeren.',
      MIN_PLAYERS_REQUIRED: 'Er zijn minimaal 2 spelers nodig om te starten.',
      QUESTION_MISMATCH: 'De vraag is intussen veranderd. Ververs de pagina.',
      ANSWER_ALREADY_SUBMITTED: 'Je hebt al een antwoord ingestuurd.',
      GAME_NOT_IN_PROGRESS: 'De quiz is nu niet bezig.',
      VALIDATION_ERROR: 'Ongeldige invoer. Controleer je gegevens.',
      // PREMIUM_REQUIRED is intentionally omitted: the server returns a
      // contextual message (free quota used vs. above free player cap) that
      // we want to surface verbatim to drive the right paywall framing.
      UNAUTHORIZED: 'Je sessie is verlopen. Log opnieuw in.',
      QUIZ_NOT_FOUND: 'De geselecteerde quiz bestaat niet meer.',
      INTERNAL_ERROR: 'Er ging iets mis op de server. Probeer het opnieuw.',
    };

    return byCode[error.code as MultiplayerErrorCode] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Er is een onverwachte fout opgetreden.';
}
