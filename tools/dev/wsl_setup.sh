#!/usr/bin/env bash
set -euo pipefail
source "$HOME/.cargo/env"

echo "== verify rustup-init checksum (re-download, compare with the published sha256)"
cd /tmp
curl -fsSL https://static.rust-lang.org/rustup/dist/x86_64-unknown-linux-gnu/rustup-init -o rustup-init.check
curl -fsSL https://static.rust-lang.org/rustup/dist/x86_64-unknown-linux-gnu/rustup-init.sha256 -o rustup-init.sha256
expected=$(cut -d' ' -f1 rustup-init.sha256)
actual=$(sha256sum rustup-init.check | cut -d' ' -f1)
echo "expected $expected"
echo "actual   $actual"
[ "$expected" = "$actual" ] && echo "CHECKSUM OK" || echo "CHECKSUM MISMATCH"
rm -f rustup-init.check

echo "== toolchain"
rustc --version; cargo --version; rustup show active-toolchain

echo "== Node 22 (official tarball, checksum verified)"
NODE_VER=v22.22.3
if ! command -v node >/dev/null 2>&1 && [ ! -x "$HOME/.local/node/bin/node" ]; then
  cd /tmp
  curl -fsSL "https://nodejs.org/dist/${NODE_VER}/node-${NODE_VER}-linux-x64.tar.xz" -o node.tar.xz
  curl -fsSL "https://nodejs.org/dist/${NODE_VER}/SHASUMS256.txt" -o SHASUMS256.txt
  grep " node-${NODE_VER}-linux-x64.tar.xz\$" SHASUMS256.txt > node.sha256
  sed -i 's/ node-.*/ node.tar.xz/' node.sha256
  sha256sum -c node.sha256
  mkdir -p "$HOME/.local/node"
  tar -xJf node.tar.xz -C "$HOME/.local/node" --strip-components=1
fi
export PATH="$HOME/.local/node/bin:$PATH"
node --version; npm --version
echo SETUP_DONE
