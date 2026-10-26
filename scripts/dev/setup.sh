#!/usr/bin/env bash
# One-time local setup: .env.local, local MongoDB, seed data.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
if [[ ! -f .env.local ]]; then
  cp scripts/dev/env.local.example .env.local
  echo "created .env.local from scripts/dev/env.local.example"
else
  echo ".env.local exists, left as is"
fi
bash scripts/dev/mongod.sh start
node --import tsx scripts/dev/seed.mts "$@"
echo
echo "Next: npm run dev   (then open http://localhost:3000, or /dev/ui for the component gallery)"
