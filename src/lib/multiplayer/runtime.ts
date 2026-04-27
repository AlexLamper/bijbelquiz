import { MongoMultiplayerDataProvider } from './provider';
import { MultiplayerService } from './service';
import { MultiplayerWsHub } from './ws-hub';

export interface MultiplayerRuntime {
  service: MultiplayerService;
  wsHub: MultiplayerWsHub;
}

declare global {
  // eslint-disable-next-line no-var
  var __multiplayerRuntime: MultiplayerRuntime | undefined;
}

export function getMultiplayerRuntime(): MultiplayerRuntime {
  if (!global.__multiplayerRuntime) {
    const service = new MultiplayerService({
      provider: new MongoMultiplayerDataProvider(),
    });

    global.__multiplayerRuntime = {
      service,
      wsHub: new MultiplayerWsHub(service),
    };
  }

  return global.__multiplayerRuntime;
}
