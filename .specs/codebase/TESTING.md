# TESTING — Cobertura e Gates

> Referência canônica para `Tests` e `Gate` de cada task. Greenfield — comandos definidos abaixo.

## Gate Check Commands

| Nível  | Comando                                                                                     |
| ------ | ------------------------------------------------------------------------------------------- |
| Quick  | `cd backend && python -m pytest -q` OU `cd frontend && npx vitest run` (conforme módulo)    |
| Full   | `cd backend && python -m pytest -q` + `cd frontend && npx vitest run`                       |
| Build  | `arduino-cli compile --fqbn arduino:avr:uno firmware/` OU `cd frontend && npm run build`    |

## Test Coverage Matrix

| Camada / módulo                        | Tipo de teste         | Comando                                    |
| -------------------------------------- | --------------------- | ------------------------------------------ |
| backend: persistência, pid, rampa      | unit (pytest)         | `cd backend && python -m pytest -q`        |
| backend: serial, FSM, API/WS           | unit + integration    | `cd backend && python -m pytest -q`        |
| firmware: parser JSON, watchdog lógica | unit (host-based)     | `cd firmware && platformio test -e native` |
| firmware: build para Uno               | build                 | `arduino-cli compile --fqbn arduino:avr:uno firmware/` |
| frontend: componentes, store           | unit (vitest)         | `cd frontend && npx vitest run`            |
| frontend: build                        | build                 | `cd frontend && npm run build`             |
| integração: E2E com simulador          | integration (pytest)  | `cd backend && python -m pytest -q -m e2e` |

## Parallelism Assessment

| Tipo de teste | Parallel-Safe | Observação                                      |
| ------------- | ------------- | ----------------------------------------------- |
| unit (pytest/vitest)  | Sim  | Sem estado compartilhado                        |
| build (compile)       | Sim  | Processos isolados                              |
| integration/E2E       | Não  | Compartilham o simulador do DAQ (porta/processo)|

**Regras de paralelismo (`[P]`):**

- Tasks com testes **unit/build** podem ser `[P]` (desde que sem dependências não concluídas).
- Tasks com testes **integration/E2E** NÃO podem ser `[P]` — executam em sequência.
