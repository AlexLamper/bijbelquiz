import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { Swords } from 'lucide-react';

import { Button, Container } from '@/components/bq';
import { FinishedList, MyTurnCard, WaitingList } from '@/components/web2/duels/DuelCards';
import { NewDuelPanel } from '@/components/web2/duels/NewDuelPanel';
import { DUEL_RULES_LINE } from '@/components/web2/duels/format';
import { authOptions } from '@/lib/auth';
import { listDuelPlayers, listDuels, type DuelListView, type DuelPlayerListItem } from '@/lib/duels/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Duels - BijbelQuiz',
  description: 'Daag een vriend of een willekeurige speler uit voor een bijbelquiz-duel: 1 tegen 1, 3 rondes van 3 vragen, om de beurt. Gratis voor iedereen.',
  alternates: { canonical: '/duels' },
};

const sectionTitle = 'm-0 text-[26px] leading-8';

/**
 * Your duels: whose turn it is, what you are waiting for and what is over,
 * with "Nieuw duel" beside it (under it on phones). Everything comes from
 * the same service as `/api/duels`, which the app uses too.
 */
export default async function DuelsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? String(session.user.id) : null;

  if (!userId) return <GuestDuels />;

  const [list, players] = await Promise.all([
    listDuels(userId).catch((): DuelListView | null => null),
    listDuelPlayers(userId, null)
      .then((result) => result.players)
      .catch((): DuelPlayerListItem[] => []),
  ]);

  const myTurn = list?.myTurn ?? [];
  const waiting = list?.waiting ?? [];
  const finished = list?.finished ?? [];
  const record = list?.record ?? { wins: 0, losses: 0, ties: 0 };
  const hasRecord = record.wins + record.losses > 0;
  const empty = myTurn.length + waiting.length + finished.length === 0;

  return (
    <Container className="flex flex-col gap-7 px-5 pb-[72px] pt-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">Duels</h1>
          {hasRecord && (
            <span
              aria-label={`${record.wins} gewonnen, ${record.losses} verloren`}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-card px-3.5 text-sm font-bold text-ink-soft"
            >
              <span className="font-extrabold text-green">{record.wins}</span> gewonnen
              <span aria-hidden="true" className="text-input-line">
                |
              </span>
              <span className="font-extrabold">{record.losses}</span> verloren
            </span>
          )}
        </div>
        <Button href="#nieuw-duel" size="xl" block className="m:hidden">
          <Swords className="size-5" strokeWidth={2.2} aria-hidden="true" />
          Nieuw duel
        </Button>
      </div>

      {!list && (
        <p role="alert" className="m-0 rounded-[16px] border border-line bg-card px-5 py-4 text-[15px] font-semibold text-ink-muted">
          Je duels konden niet laden. Ververs de pagina om het opnieuw te proberen.
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-10 m:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          {myTurn.length > 0 && (
            <section aria-labelledby="beurt-titel" className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <h2 id="beurt-titel" className={sectionTitle}>
                  Jouw beurt
                </h2>
                <span
                  aria-label={myTurn.length === 1 ? '1 duel' : `${myTurn.length} duels`}
                  className="flex h-6 min-w-6 items-center justify-center rounded-full bg-coral-strong px-[7px] text-[13px] font-extrabold text-white"
                >
                  {myTurn.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {myTurn.map((duel) => (
                  <MyTurnCard key={duel.id} duel={duel} />
                ))}
              </div>
            </section>
          )}

          {waiting.length > 0 && (
            <section aria-labelledby="wachten-titel" className="flex flex-col gap-3">
              <h2 id="wachten-titel" className={sectionTitle}>
                Wachten op tegenstander
              </h2>
              <WaitingList duels={waiting} />
            </section>
          )}

          {finished.length > 0 && (
            <section aria-labelledby="afgelopen-titel" className="flex flex-col gap-3">
              <h2 id="afgelopen-titel" className={sectionTitle}>
                Afgelopen
              </h2>
              <FinishedList duels={finished} />
            </section>
          )}

          {list && empty && (
            <div className="flex flex-col items-center gap-3 rounded-[16px] border border-line bg-card px-6 py-10 text-center">
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-[12px] bg-coral-tint text-coral-text">
                <Swords className="size-6" strokeWidth={2.2} />
              </span>
              <p className="m-0 font-display text-xl font-semibold text-ink">Nog geen duels</p>
              <p className="m-0 max-w-[44ch] text-[15px] font-semibold leading-[22px] text-ink-muted">
                Daag een vriend uit of speel tegen een willekeurige speler. Jullie spelen om de beurt, dus je hoeft niet tegelijk online te zijn.
              </p>
            </div>
          )}
        </div>

        <NewDuelPanel players={players} />
      </div>
    </Container>
  );
}

function GuestDuels() {
  return (
    <Container className="flex flex-col gap-7 px-5 pb-[72px] pt-10">
      <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">Duels</h1>
      <section
        aria-labelledby="gast-titel"
        className="flex max-w-[720px] flex-col items-start gap-4 rounded-[16px] border border-line bg-card p-6 m:flex-row m:items-center m:gap-6 m:p-7"
      >
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-coral-tint text-coral-text">
          <Swords className="size-7" strokeWidth={2.2} />
        </span>
        <div className="flex min-w-0 grow flex-col gap-1">
          <h2 id="gast-titel" className="m-0 text-[22px] leading-7">
            Daag iemand uit voor een duel
          </h2>
          <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-muted">
            {DUEL_RULES_LINE}. Duels zijn gratis voor iedereen. Log in om je duels te zien en iemand uit te dagen.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2.5 m:w-auto">
          <Button href="/inloggen?callbackUrl=/duels" size="lg">
            Inloggen
          </Button>
          <Button href="/registreren?callbackUrl=/duels" variant="secondary" size="lg">
            Account maken
          </Button>
        </div>
      </section>
    </Container>
  );
}
