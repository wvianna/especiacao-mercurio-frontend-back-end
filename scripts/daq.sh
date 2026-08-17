#!/usr/bin/env bash
# DAQ manual — firmware Arduino (Especiação de Mercúrio)
#
# Aciona as saídas discretas (SV1–SV5, bomba) ligando/desligando a cada
# intervalo (1 s), envia valores de PWM de controle aos fornos (Tubo U e
# Forno 2) e lê as temperaturas T1/T2 (termopares MAX6675), ecoando todos
# os valores na interface (terminal). O estado é reenviado a 4 Hz para
# manter o watchdog de 1 s do firmware alimentado.
#
# Dependências: stty, jq e a porta serial do Arduino (padrão /dev/ttyUSB0).
#
# Uso: ./scripts/daq.sh [--ciclos N] [--porta DEV] [--intervalo S] [--baud B]
#   --ciclos N     nº de alternâncias (padrão: 0 = infinito; Ctrl+C para parar)
#   --porta DEV    porta serial (padrão: $SERIAL_PORT ou /dev/ttyUSB0)
#   --intervalo S  segundos entre alternâncias (padrão: 1)
#   --baud B       taxa de transmissão (padrão: 115200)
#
# Exemplo: ./scripts/daq.sh --ciclos 10 --intervalo 1
set -euo pipefail

PORT="${SERIAL_PORT:-/dev/ttyUSB0}"
BAUD="${SERIAL_BAUD:-115200}"
INTERVALO=1
CICLOS=0

while [ $# -gt 0 ]; do
  case "$1" in
    --ciclos)    CICLOS="$2";    shift 2 ;;
    --porta)     PORT="$2";      shift 2 ;;
    --intervalo) INTERVALO="$2"; shift 2 ;;
    --baud)      BAUD="$2";      shift 2 ;;
    *)
      echo "Argumento desconhecido: $1" >&2
      echo "Uso: $0 [--ciclos N] [--porta DEV] [--intervalo S] [--baud B]" >&2
      exit 1
      ;;
  esac
done

command -v stty >/dev/null 2>&1 || { echo "Erro: stty não encontrado." >&2; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo "Erro: jq não encontrado (parse do JSON)." >&2; exit 1; }

if [ ! -e "$PORT" ]; then
  echo "Erro: porta serial '$PORT' não encontrada." >&2
  exit 1
fi

# Abre a porta em leitura/escrita e configura modo raw (sem eco/mapeamento).
exec 3<>"$PORT" || { echo "Erro: não foi possível abrir '$PORT'." >&2; exit 1; }
if ! stty -F "$PORT" "$BAUD" cs8 -cstopb -parenb -ixon raw -echo 2>/dev/null; then
  echo "Erro: não foi possível configurar '$PORT' em $BAUD baud." >&2
  exec 3>&-
  exit 1
fi

STATE=0
N=0

# Handshake de parametrização (ganhos PID) — aceito sem efeito nos atuadores.
printf '%s\n' \
  '{"cmd":"config","pid_u":{"kp":5.0,"ti":1.8,"td":0.0},"pid_f2":{"kp":44.67,"ti":0.18,"td":0.0}}' >&3

# Abrir a porta dispara o reset do Uno (via DTR); aguarda o firmware estabilizar
# e começar a emitir relatórios a 4 Hz antes do primeiro ciclo.
sleep 0.4

# Safe State: todas as saídas em zero (desliga fornos, válvulas e bomba).
safe_state() {
  printf '%s\n' \
    '{"valves":{"sv1":0,"sv2":0,"sv3":0,"sv4":0,"sv5":0},"pump":0,"pwm":{"u":0,"f2":0}}' >&3 2>/dev/null || true
}

cleanup() {
  echo ""
  safe_state
  exec 3>&- 2>/dev/null || true
  echo "✔ Safe State aplicado e porta '$PORT' fechada."
}
trap cleanup EXIT INT TERM

# Mostra um relatório JSON de leitura recebido do firmware.
mostrar_relatorio() {
  local linha="$1" t1 t2 status err
  t1=$(jq -r '.temp.t1 // "n/a"' <<<"$linha" 2>/dev/null) || t1="?"
  t2=$(jq -r '.temp.t2 // "n/a"' <<<"$linha" 2>/dev/null) || t2="?"
  status=$(jq -r '.status // "?"' <<<"$linha" 2>/dev/null) || status="?"
  err=$(jq -r '.error_code // "?"' <<<"$linha" 2>/dev/null) || err="?"
  printf '    T1 = %s °C | T2 = %s °C | status: %s | error_code: %s\n' "$t1" "$t2" "$status" "$err"
}

echo "▶ DAQ manual — porta: $PORT @ $BAUD baud | intervalo: ${INTERVALO}s | ciclos: ${CICLOS:-∞}"
echo "  Alterna SV1–SV5 + bomba (liga/desliga) e PWM de controle a cada ${INTERVALO}s; lê T1/T2."
echo "  Estado reenviado a 4 Hz (watchdog alimentado). Ctrl+C para interromper (Safe State)."
echo ""

# O firmware tem watchdog de 1 s: o estado é reenviado a cada 250 ms (4 Hz),
# enquanto as saídas discretas alternam (liga/desliga) a cada $INTERVALO s.
STEPS_PER_CICLO=$((INTERVALO * 4))   # 4 envios por segundo
[ "$STEPS_PER_CICLO" -lt 1 ] && STEPS_PER_CICLO=1

step=0
while :; do
  # Alterna as saídas no início de cada ciclo de $INTERVALO segundos.
  if [ $((step % STEPS_PER_CICLO)) -eq 0 ]; then
    STATE=$((1 - STATE))
    N=$((N + 1))

    # PWM de controle: valores representativos de rampa (Tubo U) e estático (Forno 2).
    if [ "$STATE" -eq 1 ]; then
      PWM_U=128
      PWM_F2=255
    else
      PWM_U=0
      PWM_F2=0
    fi

    JSON="{\"valves\":{\"sv1\":$STATE,\"sv2\":$STATE,\"sv3\":$STATE,\"sv4\":$STATE,\"sv5\":$STATE},\"pump\":$STATE,\"pwm\":{\"u\":$PWM_U,\"f2\":$PWM_F2}}"
    echo "── ciclo $N (${STATE}es) ──"
    echo "  estado: $JSON"
  fi

  printf '%s\n' "$JSON" >&3   # mantém o watchdog alimentado

  # Lê e ecoa os relatórios de leitura que chegarem (o firmware emite a 4 Hz).
  lidos=0
  for _ in 1 2 3 4; do
    linha=""
    if IFS= read -r -t 0.1 linha <&3 && [ -n "$linha" ]; then
      mostrar_relatorio "$linha"
      lidos=$((lidos + 1))
    fi
    [ "$lidos" -ge 2 ] && break
  done

  sleep 0.25
  step=$((step + 1))

  if [ "$CICLOS" -gt 0 ] && [ "$N" -ge "$CICLOS" ]; then
    break
  fi
done
