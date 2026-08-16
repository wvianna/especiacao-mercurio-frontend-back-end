#!/usr/bin/env bash
# Inicia os serviços do backend e frontend do sistema.
# Uso: ./scripts/start.sh [--dev]
#
#   --dev        também inicia o servidor de desenvolvimento do frontend (Vite :5173)
#   SERIAL_PORT  porta serial do Arduino (padrão /dev/ttyUSB0)
#   PORT         porta HTTP/WS do backend (padrão 8000)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

SERIAL_PORT="${SERIAL_PORT:-/dev/ttyUSB0}"
PORT="${PORT:-8000}"

# ---------------------------------------------------------------------------
# Backend (FastAPI — serve API + WebSocket + IHM compilada)
# ---------------------------------------------------------------------------
if [ -f "$LOG_DIR/backend.pid" ] && kill -0 "$(cat "$LOG_DIR/backend.pid")" 2>/dev/null; then
  echo "✔ Backend já em execução (pid $(cat "$LOG_DIR/backend.pid"))."
else
  echo "▶ Preparando ambiente do backend..."
  if [ ! -d "$ROOT/backend/.venv" ]; then
    python3 -m venv "$ROOT/backend/.venv"
    "$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"
  fi
  echo "▶ Iniciando backend na porta $PORT (serial $SERIAL_PORT)..."
  (
    cd "$ROOT/backend"
    SERIAL_PORT="$SERIAL_PORT" PORT="$PORT" nohup .venv/bin/python -m app \
      > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$LOG_DIR/backend.pid"
  )
  echo "✔ Backend iniciado (pid $(cat "$LOG_DIR/backend.pid")) — log: $LOG_DIR/backend.log"
fi

# ---------------------------------------------------------------------------
# Frontend (dev opcional) — em produção a IHM é servida pelo próprio backend
# ---------------------------------------------------------------------------
if [ "${1:-}" = "--dev" ]; then
  if [ -f "$LOG_DIR/frontend.pid" ] && kill -0 "$(cat "$LOG_DIR/frontend.pid")" 2>/dev/null; then
    echo "✔ Frontend (dev) já em execução (pid $(cat "$LOG_DIR/frontend.pid"))."
  else
    echo "▶ Iniciando frontend (dev) em http://localhost:5173 ..."
    (
      cd "$ROOT/frontend"
      nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
      echo $! > "$LOG_DIR/frontend.pid"
    )
    echo "✔ Frontend dev iniciado (pid $(cat "$LOG_DIR/frontend.pid")) — log: $LOG_DIR/frontend.log"
  fi
else
  echo "• IHM servida pelo backend em http://localhost:$PORT (use frontend/dist compilado)."
  echo "  Para o servidor de desenvolvimento, use: ./scripts/start.sh --dev"
fi
