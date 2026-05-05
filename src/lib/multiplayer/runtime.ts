import { randomUUID } from 'node:crypto';
import { MongoMultiplayerDataProvider } from './provider';
import { MultiplayerService } from './service';
import { MultiplayerWsHub } from './ws-hub';

export interface MultiplayerRuntime {
  /**
   * A short identifier that is generated once per process boot and persisted
   * via `globalThis`. All multiplayer log lines include this ID so we can tell
   * exactly which runtime instance handled a given request — invaluable when
   * diagnosing "ROOM_NOT_FOUND" errors that turn out to be cross-process state
   * fragmentation.
   */
  instanceId: string;
  /** Wallclock time the runtime was first created. */
  bootedAt: number;
  service: MultiplayerService;
  wsHub: MultiplayerWsHub;
}

declare global {
  // eslint-disable-next-line no-var
  var __multiplayerRuntime: MultiplayerRuntime | undefined;
}

function makeInstanceId(): string {
  // Short unique-ish ID: first 8 hex chars of a UUID, prefixed so it stands out
  // in logs. `r-XXXXXXXX` is short enough not to bloat logs and long enough to
  // disambiguate even after multiple reloads in a dev session.
  return `r-${randomUUID().slice(0, 8)}`;
}

export function getMultiplayerRuntime(): MultiplayerRuntime {
  if (!globalThis.__multiplayerRuntime) {
    const instanceId = makeInstanceId();
    const bootedAt = Date.now();

    if (process.env.NODE_ENV !== 'production' || process.env.MULTIPLAYER_DEBUG === '1') {
      console.info('[multiplayer-runtime] Bootstrapping new runtime instance', {
        instanceId,
        bootedAt,
        pid: process.pid,
      });
    }

    const service = new MultiplayerService({
      provider: new MongoMultiplayerDataProvider(),
    });

    const wsHub = new MultiplayerWsHub(service, instanceId);

    globalThis.__multiplayerRuntime = {
      instanceId,
      bootedAt,
      service,
      wsHub,
    };
  }

  return globalThis.__multiplayerRuntime;
}
