#!/usr/bin/env bash
# Inicia os serviços do backend e frontend do sistema.
# Uso: ./scripts/start.sh [--dev]
#
#   --dev        também inicia o servidor de desenvolvimento do frontend (Vite :5173)
#   SERIAL_PORT  porta serial do Arduino (padrão /dev/ttyUSB0)
#   PORT         porta HTTP/WS do backend (padrão 8000)
#
# Em um clone novo o script prepara o que faltar: venv + dependências do backend e
# dependências do frontend (npm). Sem --dev, também compila a IHM (frontend/dist)
# para que o próprio backend a sirva.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

SERIAL_PORT="${SERIAL_PORT:-/dev/ttyUSB0}"
PORT="${PORT:-8000}"

DEV_MODE=0
if [ "${1:-}" = "--dev" ]; then
  DEV_MODE=1
fi

# ---------------------------------------------------------------------------
# Dependências (executadas antes de subir os processos)
# ---------------------------------------------------------------------------
# Valida o venv importando as bibliotecas — a pasta existir não basta: um clone
# novo pode ter .venv criado com o pip interrompido (sem as dependências).
ensure_backend_env() {
  if "$ROOT/backend/.venv/bin/python" -c 'import fastapi, uvicorn, serial' >/dev/null 2>&1; then
    return 0
  fi
  echo "▶ Preparando ambiente do backend (venv + dependências)..."
  if ! python3 -m venv "$ROOT/backend/.venv"; then
    echo "✖ Falha ao criar o venv do backend — no Raspberry Pi OS: sudo apt install python3-venv" >&2
    exit 1
  fi
  "$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"
}

# Instala node_modules quando ausente. Retorna 1 se o npm não estiver disponível.
ensure_frontend_deps() {
  if [ -d "$ROOT/frontend/node_modules" ]; then
    return 0
  fi
  if ! command -v npm >/dev/null 2>&1; then
    echo "⚠ npm não encontrado — instale Node.js 18+ e npm para usar a IHM." >&2
    return 1
  fi
  echo "▶ Instalando dependências do frontend (pode demorar alguns minutos)..."
  if [ -f "$ROOT/frontend/package-lock.json" ]; then
    (cd "$ROOT/frontend" && npm ci)
  else
    (cd "$ROOT/frontend" && npm install)
  fi
}

ensure_backend_env

BACKEND_RUNNING=0
if [ -f "$LOG_DIR/backend.pid" ] && kill -0 "$(cat "$LOG_DIR/backend.pid")" 2>/dev/null; then
  BACKEND_RUNNING=1
fi

if [ "$DEV_MODE" = "1" ]; then
  if ! ensure_frontend_deps; then
    echo "✖ Sem as dependências do frontend, o Vite (:5173) não será iniciado." >&2
    DEV_MODE=0
  fi
fi

# O backend monta a IHM apenas se frontend/dist já existir no momento do start.
if [ "$DEV_MODE" = "0" ] && [ ! -d "$ROOT/frontend/dist" ]; then
  if ensure_frontend_deps; then
    echo "▶ Compilando a IHM (frontend/dist)..."
    if ! (cd "$ROOT/frontend" && npm run build); then
      echo "⚠ Falha ao compilar a IHM — o backend seguirá servindo apenas API/WebSocket." >&2
    elif [ "$BACKEND_RUNNING" = "1" ]; then
      echo "ℹ Backend já em execução: rode ./scripts/stop.sh && ./scripts/start.sh para servir a IHM compilada."
    fi
  fi
fi

# ---------------------------------------------------------------------------
# Backend (FastAPI — serve API + WebSocket + IHM compilada)
# ---------------------------------------------------------------------------
if [ "$BACKEND_RUNNING" = "1" ]; then
  echo "✔ Backend já em execução (pid $(cat "$LOG_DIR/backend.pid"))."
else
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
if [ "$DEV_MODE" = "1" ]; then
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
  if [ -d "$ROOT/frontend/dist" ]; then
    echo "• IHM servida pelo backend em http://localhost:$PORT (frontend/dist compilado)."
  else
    echo "• Backend (API/WebSocket) em http://localhost:$PORT — IHM não compilada (frontend/dist ausente)."
    echo "  Compile com: cd frontend && npm install && npm run build"
  fi
  echo "  Para o servidor de desenvolvimento, use: ./scripts/start.sh --dev"
fi
