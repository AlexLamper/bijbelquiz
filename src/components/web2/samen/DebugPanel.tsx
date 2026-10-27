'use client';

import { Button } from '@/components/bq';

interface DebugPanelProps {
  debugEvents: string[];
  connectionStatus: string;
  roomStatus: string;
  playerCount: number;
  userId: string | null;
  onSnapshot: () => void;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

/**
 * Transport diagnostics for development: shown only outside production and
 * only with `?debug` in the URL, so it never sits in the designed screens.
 */
export function DebugPanel({ debugEvents, connectionStatus, roomStatus, playerCount, userId, onSnapshot }: DebugPanelProps) {
  return (
    <section aria-label="Debug" className="flex flex-col gap-3 rounded-[16px] border border-dashed border-input-line bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13px] font-bold text-ink-muted">
          Debug - HTTP polling · {connectionStatus} · kamer: {roomStatus} · spelers: {playerCount} · userId: {userId ?? '(geen)'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSnapshot}>
            Snapshot
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void copy(debugEvents.join('\n'))} disabled={debugEvents.length === 0}>
            Kopieer logs
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch('/api/multiplayer/debug', { cache: 'no-store' });
                await copy(await response.text());
              } catch {
                // ignore
              }
            }}
          >
            Server status
          </Button>
        </div>
      </div>
      {debugEvents.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-[10px] bg-chip p-3 font-mono text-[11px] leading-relaxed">
          {debugEvents.map((entry, index) => (
            <p
              key={`${index}-${entry.slice(0, 30)}`}
              className={`m-0 break-all ${entry.includes('[error]') ? 'text-coral-text' : entry.includes('[warn]') ? 'text-gold-text' : 'text-ink-muted'}`}
            >
              {entry}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
