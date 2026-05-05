import { randomUUID } from 'node:crypto';
import { MongoMultiplayerDataProvider } from './provider';
import { MongoRoomRepository } from './repository-mongo';
import { MultiplayerService } from './service';

export interface MultiplayerRuntime {
  /**
   * Short identifier generated once per process boot, included in all log
   * lines so we can tell which serverless instance handled a given request.
   */
  instanceId: string;
  /** Wallclock time the runtime was first created. */
  bootedAt: number;
  service: MultiplayerService;
}

declare global {
  // eslint-disable-next-line no-var
  var __multiplayerRuntime: MultiplayerRuntime | undefined;
}

function makeInstanceId(): string {
  return `r-${randomUUID().slice(0, 8)}`;
}

/**
 * Lazy-initialised runtime singleton. Cached on `globalThis` so:
 *  - Across hot reloads in dev we keep the same instance (no rebuilding the
 *    service / DB connection on every code change).
 *  - Across requests within a single Vercel serverless instance we share the
 *    same service object — though importantly the service no longer keeps
 *    *room state* in memory, so cross-instance fragmentation doesn't matter.
 */
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
      repository: new MongoRoomRepository(),
    });

    globalThis.__multiplayerRuntime = {
      instanceId,
      bootedAt,
      service,
    };
  }

  return globalThis.__multiplayerRuntime;
}
