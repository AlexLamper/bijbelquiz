#!/usr/bin/env bash
# Starts (or stops) a local MongoDB for development.
#
#   scripts/dev/mongod.sh            # start, in the background
#   scripts/dev/mongod.sh stop
#   scripts/dev/mongod.sh status
#
# Uses the mongod binary that mongodb-memory-server already downloaded for the
# tests, so nothing else has to be installed. Data and the log live in
# .local/mongo (gitignored). The port matches MONGODB_URI in
# scripts/dev/env.local.example.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${MONGO_PORT:-27027}"
DATA="$ROOT/.local/mongo/data"
LOG="$ROOT/.local/mongo/mongod.log"
PIDFILE="$ROOT/.local/mongo/mongod.pid"
BIN="${MONGOD_BIN:-$HOME/.cache/mongodb-binaries/mongod-x64-ubuntu-8.2.6}"

if [[ ! -x "$BIN" ]]; then
  # mongodb-memory-server's own cache, when the tests ran before.
  CANDIDATE="$(ls "$ROOT"/node_modules/.cache/mongodb-memory-server/mongod-* 2>/dev/null | head -n 1 || true)"
  if [[ -n "$CANDIDATE" ]]; then BIN="$CANDIDATE"; fi
fi

running() {
  [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

case "${1:-start}" in
  start)
    if running; then
      echo "mongod already running (pid $(cat "$PIDFILE")) on port $PORT"
      exit 0
    fi
    if [[ ! -x "$BIN" ]]; then
      echo "mongod binary not found at $BIN - run 'npm run test:duels' once (it downloads mongod) or set MONGOD_BIN." >&2
      exit 1
    fi
    mkdir -p "$DATA"
    "$BIN" --dbpath "$DATA" --port "$PORT" --bind_ip 127.0.0.1 --logpath "$LOG" --logappend --fork --pidfilepath "$PIDFILE" >/dev/null
    echo "mongod started on mongodb://127.0.0.1:$PORT (pid $(cat "$PIDFILE"), log $LOG)"
    ;;
  stop)
    if running; then
      kill "$(cat "$PIDFILE")"
      for _ in $(seq 1 50); do running || break; sleep 0.2; done
      rm -f "$PIDFILE"
      echo "mongod stopped"
    else
      echo "mongod is not running"
    fi
    ;;
  status)
    if running; then echo "running (pid $(cat "$PIDFILE")) on port $PORT"; else echo "not running"; exit 1; fi
    ;;
  *)
    echo "usage: $0 [start|stop|status]" >&2
    exit 2
    ;;
esac
