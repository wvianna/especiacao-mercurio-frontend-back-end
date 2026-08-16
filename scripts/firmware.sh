#!/usr/bin/env bash
# Compila e/ou carrega o firmware no Arduino Uno.
# Uso: ./scripts/firmware.sh [build|upload]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FW_DIR="$ROOT/firmware"
ACTION="${1:-build}"

cd "$FW_DIR"

case "$ACTION" in
  build)
    echo "▶ Compilando firmware para Arduino Uno..."
    pio run -e uno
    echo "✔ Build concluído: .pio/build/uno/firmware.hex"
    ;;
  upload)
    echo "▶ Compilando e carregando firmware no Arduino Uno (USB)..."
    pio run -e uno -t upload
    echo "✔ Firmware carregado no Arduino."
    ;;
  *)
    echo "Uso: $0 [build|upload]" >&2
    exit 1
    ;;
esac
