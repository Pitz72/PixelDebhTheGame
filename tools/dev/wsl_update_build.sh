#!/usr/bin/env bash
set -euo pipefail
source "$HOME/.cargo/env"
export PATH="$HOME/.local/node/bin:$PATH"
export APPIMAGE_EXTRACT_AND_RUN=1 CI=true
SRC=/mnt/c/Users/Utente/Documents/GitHub/PIXELDEBH
cd "$HOME/pixeldebh-build"
git fetch -q "$SRC" v2-tauri
git reset --hard -q FETCH_HEAD
git log --oneline -1
npm ci --no-audit --no-fund 2>&1 | tail -2
npx tsc --noEmit && echo "tsc OK"
npx vitest run 2>&1 | grep -E "Test Files|Tests "
npx tauri build --bundles deb,rpm,appimage 2>&1 | tail -12
echo BUILD_DONE
