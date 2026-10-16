#!/usr/bin/env bash
# Quick Linux rebuild from the Windows working tree (uncommitted changes included): frontend + binary only.
set -euo pipefail
source "$HOME/.cargo/env"
export PATH="$HOME/.local/node/bin:$PATH"
SRC=/mnt/c/Users/Utente/Documents/GitHub/PIXELDEBH
DST=$HOME/pixeldebh-build
cd "$DST"
# sync source files (not node_modules / target / dist)
rsync -a --delete --exclude node_modules --exclude target --exclude dist --exclude .git --exclude 'src-tauri/target' --exclude 'src-tauri/gen' "$SRC"/ "$DST"/ 2>/dev/null || {
  apt-get install -y -qq rsync >/dev/null 2>&1
  rsync -a --delete --exclude node_modules --exclude target --exclude dist --exclude .git --exclude 'src-tauri/target' --exclude 'src-tauri/gen' "$SRC"/ "$DST"/
}
npm ci --no-audit --no-fund 2>&1 | tail -1
npx tauri build --no-bundle 2>&1 | tail -3
echo QUICK_DONE
