class AsyncMutex {
  private tail: Promise<void> = Promise.resolve();

  async runExclusive<T>(task: () => Promise<T> | T): Promise<T> {
    let release: () => void = () => undefined;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.tail;
    this.tail = previous.then(() => next);

    await previous;

    try {
      return await task();
    } finally {
      release();
    }
  }
}

export class RoomLockManager {
  private readonly roomLocks = new Map<string, AsyncMutex>();

  async runExclusive<T>(roomCode: string, task: () => Promise<T> | T): Promise<T> {
    let lock = this.roomLocks.get(roomCode);
    if (!lock) {
      lock = new AsyncMutex();
      this.roomLocks.set(roomCode, lock);
    }

    return lock.runExclusive(task);
  }
}
