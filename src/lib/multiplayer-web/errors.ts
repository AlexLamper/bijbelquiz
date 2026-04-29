import type { MultiplayerErrorCode } from '@/lib/multiplayer/errors';
import { MultiplayerClientHttpError } from './client';

export function toUserMessage(error: unknown): string {
  if (error instanceof MultiplayerClientHttpError) {
    const byCode: Partial<Record<MultiplayerErrorCode, string>> = {
      ROOM_NOT_FOUND: 'Room niet gevonden. Controleer de code en probeer opnieuw.',
      ROOM_FULL: 'Deze room zit vol.',
      ROOM_ALREADY_STARTED: 'Deze game is al gestart.',
      ROOM_FINISHED: 'Deze game is al afgerond.',
      PLAYER_NOT_IN_ROOM: 'Je bent geen deelnemer van deze room.',
      NOT_HOST: 'Alleen de host kan deze actie uitvoeren.',
      MIN_PLAYERS_REQUIRED: 'Er zijn minimaal 2 spelers nodig om te starten.',
      QUESTION_MISMATCH: 'De vraag is intussen gewijzigd. Vernieuw de roomstatus.',
      ANSWER_ALREADY_SUBMITTED: 'Je hebt al een antwoord ingestuurd.',
      GAME_NOT_IN_PROGRESS: 'De game is momenteel niet actief.',
      VALIDATION_ERROR: 'Ongeldige invoer. Controleer je gegevens.',
      PREMIUM_REQUIRED: 'Room maken is Premium. Gratis accounts kunnen eenmalig een room maken.',
      UNAUTHORIZED: 'Je sessie is verlopen. Log opnieuw in.',
      QUIZ_NOT_FOUND: 'De geselecteerde quiz bestaat niet meer.',
      INTERNAL_ERROR: 'Er ging iets mis op de server. Probeer opnieuw.',
    };

    return byCode[error.code as MultiplayerErrorCode] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Er is een onverwachte fout opgetreden.';
}
