import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { AdminPageHeader } from '@/components/bq/AdminShell';
import { Button } from '@/components/bq/Button';
import { EmptyRow, TableCard, Tag, Td, formatNumber } from '@/components/web2/beheer-2/parts';
import { formatAdminDate } from '@/components/web2/beheer/ui';
import { PlatformCell, PremiumCell, lastActiveLabel } from '@/components/web2/beheer-users/display';
import { GrantPremiumButton } from '@/components/web2/beheer-users/GrantPremium';
import { UserFilters } from '@/components/web2/beheer-users/UserFilters';
import { PLATFORM_LABELS } from '@/lib/admin/platform-labels';
import { listAdminUsers, readUserListQuery, type UserListQuery, type UserSort } from '@/lib/admin/users';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Gebruikers - Beheer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function hrefWith(params: SearchParams, changes: Record<string, string | null>): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) next.set(key, v);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  const query = next.toString();
  return query ? `/beheer/gebruikers?${query}` : '/beheer/gebruikers';
}

/** A column header that sorts the list; clicking the active one flips the order. */
function SortTh({
  label,
  sort,
  query,
  params,
  align = 'left',
  defaultOrder = 'desc',
}: {
  label: string;
  sort: UserSort;
  query: UserListQuery;
  params: SearchParams;
  align?: 'left' | 'right';
  defaultOrder?: 'asc' | 'desc';
}) {
  const active = query.sort === sort;
  const order = active ? (query.order === 'asc' ? 'desc' : 'asc') : defaultOrder;
  const Icon = query.order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (query.order === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(
        'whitespace-nowrap border-b border-line px-4 py-2.5 text-[13px] font-bold text-ink-muted first:pl-5 last:pr-5',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      <Link
        href={hrefWith(params, { sort, order, page: null })}
        className={cn('inline-flex items-center gap-1 no-underline', active ? 'text-ink' : 'text-ink-muted hover:text-ink')}
      >
        {label}
        {active && <Icon className="size-3.5" strokeWidth={2.6} aria-hidden="true" />}
      </Link>
    </th>
  );
}

function PlainTh({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-line px-4 py-2.5 text-[13px] font-bold text-ink-muted first:pl-5 last:pr-5',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

/**
 * Every account: search on name or e-mail, filter on platform, Premium and
 * test accounts, sort on any column, 25 per page. The same loader answers
 * `/api/mobile/admin/users` for the app.
 */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') redirect('/');

  const params = await searchParams;
  const query = readUserListQuery(params);
  const result = await listAdminUsers(query);
  const now = new Date();
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);
  const filtered = Boolean(query.q || query.platform || query.premium || query.source || query.test !== 'include');

  return (
    <>
      <AdminPageHeader
        title="Gebruikers"
        description="Alle accounts: waar ze vandaan komen, wanneer ze actief waren en hoe ze Premium hebben. Geef iemand hier ook gratis Premium."
      />

      <Suspense fallback={<div className="h-11" aria-hidden="true" />}>
        <UserFilters />
      </Suspense>

      <TableCard
        title={filtered ? `${formatNumber(result.total)} gevonden` : `${formatNumber(result.total)} accounts`}
        description={
          query.platform
            ? `Aangemeld via ${PLATFORM_LABELS[query.platform]}. Bij oudere accounts is het platform afgeleid uit hun eerste activiteit.`
            : 'Bij oudere accounts is het platform afgeleid uit hun eerste activiteit.'
        }
        caption="Gebruikers"
        minWidth={1040}
        stack
        head={
          <>
            <SortTh label="Gebruiker" sort="name" query={query} params={params} defaultOrder="asc" />
            <SortTh label="Aangemeld" sort="createdAt" query={query} params={params} />
            <PlainTh>Platform</PlainTh>
            <SortTh label="Laatst actief" sort="lastActive" query={query} params={params} />
            <SortTh label="Premium" sort="premiumUntil" query={query} params={params} />
            <SortTh label="Quizzen" sort="quizzesPlayed" query={query} params={params} align="right" />
            <SortTh label="XP" sort="xp" query={query} params={params} align="right" />
            <PlainTh>
              <span className="sr-only">Acties</span>
            </PlainTh>
          </>
        }
        footer={
          result.total > result.pageSize ? (
            <nav aria-label="Pagina's" className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold text-ink-muted tabular-nums">
                {formatNumber(from)}-{formatNumber(to)} van {formatNumber(result.total)}
              </span>
              <span className="flex gap-2">
                <Button
                  href={hrefWith(params, { page: String(result.page - 1) })}
                  variant="secondary"
                  size="sm"
                  aria-disabled={result.page <= 1}
                  className={cn(result.page <= 1 && 'pointer-events-none opacity-50')}
                >
                  <ChevronLeft className="size-4" strokeWidth={2.6} aria-hidden="true" />
                  Vorige
                </Button>
                <Button
                  href={hrefWith(params, { page: String(result.page + 1) })}
                  variant="secondary"
                  size="sm"
                  aria-disabled={result.page >= result.pages}
                  className={cn(result.page >= result.pages && 'pointer-events-none opacity-50')}
                >
                  Volgende
                  <ChevronRight className="size-4" strokeWidth={2.6} aria-hidden="true" />
                </Button>
              </span>
            </nav>
          ) : undefined
        }
      >
        {result.users.length === 0 ? (
          <EmptyRow columns={8}>{filtered ? 'Niemand gevonden met deze filters.' : 'Nog geen accounts.'}</EmptyRow>
        ) : (
          result.users.map((user) => (
            <tr key={user.id}>
              <Td valign="middle" style={{ minWidth: 240 }}>
                <span className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/beheer/gebruikers/${user.id}`} className="font-extrabold text-ink no-underline hover:text-lapis">
                      {user.name}
                    </Link>
                    {user.isInternal && <Tag>Testaccount</Tag>}
                    {user.role === 'admin' && <Tag tone="accent">Beheer</Tag>}
                  </span>
                  <span className="truncate text-[13px] font-semibold text-ink-muted [overflow-wrap:anywhere]">{user.email}</span>
                </span>
              </Td>
              <Td valign="middle" numeric label="Aangemeld">
                {formatAdminDate(user.createdAt) || '-'}
              </Td>
              <Td valign="middle" label="Platform">
                <PlatformCell platform={user.signupPlatform} derived={user.signupPlatformDerived} method={user.signupMethod} />
              </Td>
              <Td valign="middle" numeric label="Laatst actief">
                {lastActiveLabel(user.lastActiveAt, now)}
                {user.lastSeenPlatform && <span className="block text-xs font-semibold text-ink-muted">{PLATFORM_LABELS[user.lastSeenPlatform]}</span>}
              </Td>
              <Td valign="middle" label="Premium">
                <PremiumCell premium={user.premium} />
              </Td>
              <Td valign="middle" align="right" numeric tone="strong" label="Quizzen">
                {formatNumber(user.quizzesPlayed)}
              </Td>
              <Td valign="middle" align="right" numeric label="XP">
                {formatNumber(user.xp)}
              </Td>
              <Td valign="middle" align="right">
                <span className="flex justify-end gap-2">
                  <GrantPremiumButton
                    userId={user.id}
                    userName={user.name}
                    hasGrant={user.premium.sources.includes('manual')}
                    variant="secondary"
                    iconOnly
                  />
                  <Button href={`/beheer/gebruikers/${user.id}`} variant="secondary" size="sm" aria-label={`Bekijken: ${user.name}`}>
                    Bekijken
                  </Button>
                </span>
              </Td>
            </tr>
          ))
        )}
      </TableCard>
    </>
  );
}
