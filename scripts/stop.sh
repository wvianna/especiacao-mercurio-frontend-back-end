#!/usr/bin/env bash
# Para os serviços iniciados por ./scripts/start.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"

for name in backend frontend; do
  pid_file="$LOG_DIR/$name.pid"
  if [ -f "$pid_file" ]; then
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" && echo "✔ $name parado (pid $pid)."
    else
      echo "• $name não está em execução."
    fi
    rm -f "$pid_file"
  else
    echo "• $name: sem pid registrado."
  fi
done
