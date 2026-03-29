#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_info() {
  printf '[setup] %s\n' "$1"
}

log_warn() {
  printf '[setup][warn] %s\n' "$1"
}

log_error() {
  printf '[setup][error] %s\n' "$1" >&2
}

if ! command -v node >/dev/null 2>&1; then
  log_error "Node.js is required. Install Node.js 24+ and rerun this script."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 24 ]]; then
  log_warn "Detected Node.js $(node -v). This project targets Node.js 24."
fi

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    log_info "pnpm not found. Enabling pnpm via Corepack..."
    corepack enable
    corepack prepare pnpm@10 --activate
  else
    log_error "pnpm not found and Corepack is unavailable. Install pnpm and rerun."
    exit 1
  fi
fi

log_info "Using pnpm $(pnpm -v)"

if [[ -f "pnpm-lock.yaml" ]]; then
  log_info "Installing dependencies from lockfile..."
  pnpm install --frozen-lockfile
else
  log_info "Installing dependencies..."
  pnpm install
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  log_info "DATABASE_URL detected. Applying database schema..."
  if ! pnpm --filter @workspace/db run push; then
    log_warn "Regular schema push failed. Retrying with --force..."
    pnpm --filter @workspace/db run push-force
  fi
else
  log_warn "DATABASE_URL is not set. Skipping database schema push."
fi

cat <<'EOF'

Setup complete.

Run the frontend:
  PORT=23665 BASE_PATH=/ pnpm --filter @workspace/fraud-detection run dev

Run the backend:
  PORT=8080 DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db> pnpm --filter @workspace/api-server run dev

Optional health check:
  curl http://localhost:8080/api/healthz
EOF
