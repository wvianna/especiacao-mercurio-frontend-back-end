# Especiação de Mercúrio — Automação e IHM

Modernização do sistema de preparação de amostras para especiação de mercúrio: controle da rampa de temperatura do Tubo U e do Forno 2 com Raspberry Pi (Python), Arduino Uno (DAQ) e IHM Web.

```
├── backend/     # Python + FastAPI: FSM, PID/rampa, persistência, API + WebSocket
├── firmware/    # Arduino Uno (PlatformIO): I/O, PWM, termopares SPI, watchdog
├── frontend/    # React + Vite + TS: sinótico, gráficos de tendência, controles
├── docs/        # Especificação, requisitos e HANDSOFF.md
└── .specs/      # Planejamento Spec-Driven (spec/design/tasks por feature)
```

## Comece por aqui

1. **HANDSOFF:** [`docs/HANDSOFF.md`](docs/HANDSOFF.md) — como executar, mapeamento JSON, porta serial e interpolação da curva.
2. **Requisitos:** [`docs/requisitos.txt`](docs/requisitos.txt) e [`docs/especificacao.txt`](docs/especificacao.txt).
3. **Projeto:** [`docs/TDD.md`](docs/TDD.md) — decisões técnicas.

## Stack

- **Backend:** Python 3.11+, FastAPI, uvicorn, pyserial, pydantic.
- **Firmware:** C++ (Arduino Uno), ArduinoJson, PlatformIO.
- **Frontend:** React 18 + TypeScript + Vite + canvas (gráficos em tempo real).

## Status

Implementação inicial (M1–M4) concluída conforme `.specs/`. Veja o [HANDSOFF](docs/HANDSOFF.md) para executar.
