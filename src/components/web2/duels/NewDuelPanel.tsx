'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Link2, Search, Shuffle } from 'lucide-react';

import { Avatar, Spinner, toast } from '@/components/bq';
import type { DuelPlayerListItem } from '@/lib/duels/service';
import { cn } from '@/lib/utils';
import { createDuelRequest, errorMessage, searchPlayersRequest } from './api';
import { DUEL_RULES_LINE } from './format';
import { InviteLinkModal, type InviteLink } from './InviteLinkModal';

/**
 * "Nieuw duel": a random opponent, a name search, the people you played with
 * before (saved groups and earlier duels - there is no friends list) and an
 * invite link. Every start goes through `POST /api/duels` and then straight
 * to the play page; challenging somebody you already duel opens that duel.
 */
export function NewDuelPanel({ players }: { players: DuelPlayerListItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ query: string; players: DuelPlayerListItem[] } | null>(null);
  const [invite, setInvite] = useState<InviteLink | null>(null);
  const requestId = useRef(0);

  const trimmed = query.trim();
  const showingSearch = trimmed.length >= 2;
  const searching = showingSearch && results?.query !== trimmed;

  useEffect(() => {
    if (trimmed.length < 2) return;
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      searchPlayersRequest(trimmed)
        .then((found) => {
          if (id === requestId.current) setResults({ query: trimmed, players: found });
        })
        .catch((error) => {
          if (id === requestId.current) {
            setResults({ query: trimmed, players: [] });
            toast.error(errorMessage(error));
          }
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [trimmed]);

  const start = async (key: string, run: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await run();
    } catch (error) {
      toast.error(errorMessage(error));
      setBusy(null);
    }
  };

  const playRandom = () =>
    start('random', async () => {
      const result = await createDuelRequest({ mode: 'random' });
      router.push(`/duels/${result.duel.id}`);
    });

  const challenge = (player: DuelPlayerListItem) =>
    start(player.id, async () => {
      const result = await createDuelRequest({ mode: 'friend', opponentId: player.id });
      if (!result.created) toast.info(`Je speelt al een duel met ${player.name}.`);
      router.push(`/duels/${result.duel.id}`);
    });

  const makeInvite = () =>
    start('invite', async () => {
      const result = await createDuelRequest({ mode: 'invite' });
      setInvite({
        duelId: result.duel.id,
        url: result.inviteToken ? `${window.location.origin}/duel/${result.inviteToken}` : result.inviteUrl ?? '',
        message: result.inviteMessage,
      });
      setBusy(null);
    });

  const list = showingSearch ? (results?.query === trimmed ? results.players : []) : players;

  return (
    <aside id="nieuw-duel" aria-labelledby="nieuw-titel" className="flex min-w-0 scroll-mt-6 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="nieuw-titel" className="m-0 text-[26px] leading-8">
          Nieuw duel
        </h2>
        <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-muted">{DUEL_RULES_LINE}</p>
      </div>

      <button
        type="button"
        onClick={playRandom}
        disabled={!!busy}
        className="relative flex items-center gap-3.5 overflow-hidden rounded-[16px] border-0 border-b-[3px] border-b-lapis-edge bg-lapis p-[18px] text-left text-white transition-colors hover:bg-lapis-edge disabled:opacity-70"
      >
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-white text-lapis">
          {busy === 'random' ? <Spinner size={24} label="Tegenstander zoeken" /> : <Shuffle className="size-[26px]" strokeWidth={2.4} aria-hidden="true" />}
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="font-display text-[20px] font-semibold leading-6">Willekeurige speler</span>
          <span className="text-sm font-semibold text-lapis-pale-strong">Direct een tegenstander vinden</span>
        </span>
        <ChevronRight className="size-5 shrink-0" strokeWidth={2.6} aria-hidden="true" />
      </button>

      <label className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 size-5 text-ink-faint" strokeWidth={2.2} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Zoek een speler op naam"
          placeholder="Zoek een speler op naam"
          maxLength={40}
          className="h-12 w-full rounded-[12px] border border-line bg-card pl-11 pr-3.5 text-[15px] font-semibold text-ink placeholder:text-ink-muted focus:border-lapis focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
        />
      </label>

      <section aria-labelledby="vrienden-titel" aria-busy={searching} className="flex flex-col gap-2">
        <h3 id="vrienden-titel" className="mb-0 mt-1 font-sans text-base font-extrabold leading-[22px]">
          {showingSearch ? 'Zoekresultaten' : 'Vrienden'}
        </h3>
        {list.length > 0 ? (
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[16px] border border-line bg-card p-0">
            {list.map((player) => (
              <li key={player.id} className="flex items-center gap-3 border-b border-line-soft py-2.5 pl-4 pr-3.5 last:border-b-0">
                <Avatar name={player.name} size={40} title="" />
                <span className="flex min-w-0 grow flex-col">
                  <span className="truncate text-[15px] font-bold">{player.name}</span>
                  <span className="text-[13px] font-semibold text-ink-muted">Level {player.level}</span>
                </span>
                <button
                  type="button"
                  onClick={() => challenge(player)}
                  disabled={!!busy}
                  aria-label={`${player.name} uitdagen`}
                  className={cn(
                    'inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] border-0 border-b-[3px] border-b-lapis-pale bg-lapis-tint px-3.5 text-sm font-extrabold text-lapis-edge transition-colors hover:bg-lapis-wash disabled:opacity-60',
                  )}
                >
                  {busy === player.id && <Spinner size={14} label="Duel starten" />}
                  Uitdagen
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 rounded-[16px] border border-line bg-card px-4 py-4 text-sm font-semibold leading-5 text-ink-muted">
            {showingSearch
              ? searching
                ? 'Zoeken...'
                : `Geen speler gevonden die "${trimmed}" heet.`
              : 'Hier staan de spelers met wie je eerder speelde of een groep deelt. Zoek iemand op naam of nodig een vriend uit met een link.'}
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={makeInvite}
        disabled={!!busy}
        className="flex items-center gap-3 rounded-[16px] border border-line bg-card px-4 py-3.5 text-left text-ink transition-colors hover:border-input-line disabled:opacity-70"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-green-tint text-green">
          {busy === 'invite' ? <Spinner size={18} label="Link maken" /> : <Link2 className="size-5" strokeWidth={2.2} aria-hidden="true" />}
        </span>
        <span className="flex min-w-0 grow flex-col">
          <span className="text-[15px] font-bold">Nodig iemand uit met een link</span>
          <span className="text-[13px] font-semibold text-green">Je vriend speelt dit duel gratis</span>
        </span>
        <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
      </button>

      <InviteLinkModal invite={invite} onClose={() => setInvite(null)} />
    </aside>
  );
}
