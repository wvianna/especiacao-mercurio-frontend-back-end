#!/usr/bin/env bash
# Roda os testes unitários e de integração (backend, frontend e firmware).
# Uso: ./scripts/test.sh [all|backend|frontend|firmware]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-all}"

ensure_backend_env() {
  if [ ! -d "$ROOT/backend/.venv" ]; then
    echo "  ▶ Criando venv do backend..."
    python3 -m venv "$ROOT/backend/.venv"
    "$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements-dev.txt"
  fi
}

run_backend() {
  ensure_backend_env
  echo "▶ Backend: pytest (unit + integração + E2E com simulador)..."
  ( cd "$ROOT/backend" && .venv/bin/python -m pytest -q )
}

run_frontend() {
  echo "▶ Frontend: vitest..."
  ( cd "$ROOT/frontend" && npm test )
}

run_firmware() {
  echo "▶ Firmware: testes host-based (native)..."
  ( cd "$ROOT/firmware" && pio test -e native )
}

case "$TARGET" in
  all)
    run_backend
    run_frontend
    run_firmware
    ;;
  backend) run_backend ;;
  frontend) run_frontend ;;
  firmware) run_firmware ;;
  *)
    echo "Uso: $0 [all|backend|frontend|firmware]" >&2
    exit 1
    ;;
esac

echo "✔ Testes concluídos."
