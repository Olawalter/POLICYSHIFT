#!/usr/bin/env bash
# Installs dependencies with EXACT versions and writes the lockfile. Commit package-lock.json afterwards.
# Versions were not pinned in this repo because the authoring environment had no registry access.
set -euo pipefail
npm install --save-exact next react react-dom genlayer-js
npm install --save-exact --save-dev typescript @types/node @types/react @types/react-dom
npm run typecheck
