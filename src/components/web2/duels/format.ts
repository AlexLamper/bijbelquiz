import type { DuelView } from '@/lib/duels/service';

/**
 * Copy for a duel, shared by the list (`/duels`), the play page and the
 * dashboard-style cards. Pure, so server and client components both use it.
 */

export function opponentName(duel: DuelView): string {
  if (duel.opponent) return duel.opponent.name;
  return duel.mode === 'invite' ? 'Je vriend' : 'Tegenstander';
}

export function scoreLabel(duel: DuelView): string {
  return `${duel.myScore} - ${duel.opponentScore}`;
}

/** The second line of a row under "Wachten op tegenstander". */
export function waitingLine(duel: DuelView): string {
  if (duel.turn === 'matching') {
    return duel.mode === 'invite' ? 'Wacht tot je vriend meedoet' : 'We zoeken een tegenstander';
  }
  return `${opponentName(duel)} speelt ronde ${duel.currentRound}`;
}

export type FinishedTone = 'won' | 'neutral';

/** The second line of a row under "Afgelopen", and whether it reads as a win. */
export function finishedLine(duel: DuelView): { text: string; tone: FinishedTone } {
  const name = opponentName(duel);
  switch (duel.endReason) {
    case 'declined':
      return { text: duel.isChallenger ? `${name} wees het duel af` : 'Je wees dit duel af', tone: 'neutral' };
    case 'cancelled':
      return { text: 'Geannuleerd', tone: 'neutral' };
    case 'expired':
      return { text: 'Verlopen', tone: 'neutral' };
    default:
      break;
  }

  if (duel.outcome === 'won') {
    if (duel.endReason === 'forfeit') return { text: `Gewonnen, ${name} gaf op`, tone: 'won' };
    if (duel.endReason === 'timeout') return { text: `Gewonnen, ${name} speelde niet verder`, tone: 'won' };
    return { text: 'Gewonnen', tone: 'won' };
  }
  if (duel.outcome === 'lost') {
    if (duel.endReason === 'forfeit') return { text: 'Verloren, je gaf op', tone: 'neutral' };
    if (duel.endReason === 'timeout') return { text: 'Verloren, je speelde niet verder', tone: 'neutral' };
    return { text: 'Verloren', tone: 'neutral' };
  }
  if (duel.outcome === 'tie') return { text: 'Gelijkspel', tone: 'neutral' };
  return { text: 'Afgelopen', tone: 'neutral' };
}

/** "Lotte wacht op jou" above the play button. */
export function myTurnLine(duel: DuelView): string {
  if (duel.canDecline) return `${opponentName(duel)} daagt je uit`;
  if (!duel.opponent) return 'Speel de eerste ronde';
  return `${opponentName(duel)} wacht op jou`;
}

export const DUEL_RULES_LINE = '1 tegen 1 · 3 rondes van 3 vragen · om de beurt';
