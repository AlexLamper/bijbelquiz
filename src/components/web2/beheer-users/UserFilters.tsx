'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { SearchInput, Select } from '@/components/bq/Field';
import { Button } from '@/components/bq/Button';
import { PLATFORM_KEYS, PLATFORM_LABELS } from '@/lib/admin/platform-labels';
import { PREMIUM_SOURCES, PREMIUM_SOURCE_LABELS } from '@/lib/admin/grant-options';
import { PREMIUM_KINDS, PREMIUM_KIND_LABELS } from '@/lib/admin/premium-kind-labels';

/**
 * Search and filters for `/beheer/gebruikers`. Everything lives in the URL
 * (the page is server-rendered from it), so a filtered list can be shared
 * and the back button works. A select applies at once; the search box on
 * Enter or after a short pause.
 */
export function UserFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get('q') ?? '');
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      // A new filter starts at the first page.
      next.delete('page');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const premiumValue = params.get('kind')
    ? `kind:${params.get('kind')}`
    : params.get('source')
      ? `source:${params.get('source')}`
      : params.get('premium') ?? '';
  const filtered = ['q', 'platform', 'premium', 'source', 'kind', 'test'].some((key) => params.get(key));

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        apply({ q: q.trim() || null });
      }}
      className="grid grid-cols-2 gap-2.5 m:grid-cols-[minmax(0,1fr)_200px_200px_190px] m:items-center [&>*:first-child]:col-span-2 m:[&>*:first-child]:col-span-1"
    >
      <SearchInput
        size="sm"
        aria-label="Zoek op naam of e-mail"
        placeholder="Zoek op naam of e-mail"
        value={q}
        onChange={(event) => {
          const value = event.target.value;
          setQ(value);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => apply({ q: value.trim() || null }), 400);
        }}
      />
      <Select
        size="sm"
        aria-label="Platform"
        value={params.get('platform') ?? ''}
        onChange={(event) => apply({ platform: event.target.value || null })}
      >
        <option value="">Alle platforms</option>
        {PLATFORM_KEYS.map((key) => (
          <option key={key} value={key}>
            {PLATFORM_LABELS[key]}
          </option>
        ))}
      </Select>
      <Select
        size="sm"
        aria-label="Premium"
        value={premiumValue}
        onChange={(event) => {
          const value = event.target.value;
          if (value.startsWith('kind:')) apply({ kind: value.slice(5), source: null, premium: null });
          else if (value.startsWith('source:')) apply({ source: value.slice(7), premium: null, kind: null });
          else apply({ premium: value || null, source: null, kind: null });
        }}
      >
        <option value="">Premium en gratis</option>
        <option value="yes">Alleen Premium</option>
        <option value="no">Alleen gratis</option>
        <optgroup label="Hoe ze Premium hebben">
          {PREMIUM_KINDS.map((kind) => (
            <option key={kind} value={`kind:${kind}`}>
              {PREMIUM_KIND_LABELS[kind]}
            </option>
          ))}
        </optgroup>
        <optgroup label="Via">
        {PREMIUM_SOURCES.map((source) => (
          <option key={source} value={`source:${source}`}>
            Premium: {PREMIUM_SOURCE_LABELS[source]}
          </option>
        ))}
        </optgroup>
      </Select>
      <Select size="sm" aria-label="Testaccounts" className="col-span-2 m:col-span-1" value={params.get('test') ?? ''} onChange={(event) => apply({ test: event.target.value || null })}>
        <option value="">Met testaccounts</option>
        <option value="exclude">Zonder testaccounts</option>
        <option value="only">Alleen testaccounts</option>
      </Select>
      {filtered && (
        <div className="col-span-2 m:col-span-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0"
            onClick={() => {
              setQ('');
              const next = new URLSearchParams();
              for (const key of ['sort', 'order']) {
                const value = params.get(key);
                if (value) next.set(key, value);
              }
              const query = next.toString();
              router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
            }}
          >
            Filters wissen
          </Button>
        </div>
      )}
    </form>
  );
}
