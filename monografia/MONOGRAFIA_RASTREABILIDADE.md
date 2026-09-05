# MONOGRAFIA — RASTREABILIDADE

## Objetivos

| Objetivo específico | Método | Evidência | Resultado | Status |
|---|---|---|---|---|
| 1. Modelar processo (T0–T3) em FSM com matriz de atuadores | Análise da especificação; projeto da FSM; testes de transição | `fsm.py` (`State`, `Event`, `MATRIX`); `test_fsm.py` | FSM com SAFE/T0–T3/MANUAL e matriz validada por testes | ✅ Concluído (1ª versão) |
| 2. Implementar PID misto (Tubo U e Forno 2) | Implementação e testes de unidade | `pid.py`, `ramp.py`; `test_pid.py`, `test_ramp.py` | PID P+I anti-windup; rampa com razão de taxas/PID | ✅ Concluído (1ª versão) |
| 3. Protocolo JSON estruturado a 4 Hz | Contrato de interface; codec serial; testes | `serial_link.py`, `json_protocol.cpp`; `test_serial_link.py` | Troca line-delimited JSON 4 Hz com handshake | ✅ Concluído (1ª versão) |
| 4. Firmware DAQ (SPI, atuadores, watchdog) | Firmware C++ e testes host | `firmware/src/*`, `lib/daqcore/*`; `test_daqcore.cpp` | Watchdog 1 s, toggle de bomba, leitura MAX6675 | ✅ Concluído (1ª versão) |
| 5. IHM Web com monitoramento e controle | Frontend React/TS + API/WS | `frontend/src/*` | MONITOR/CONFIG, Diagrama de Tempos, AUTO/MANUAL | ✅ Concluído (1ª versão) |
| 6. Persistência atômica com backup | Implementação e testes | `config_store.py`; `test_config_store.py` | params.json + .bak com escrita atômica | ✅ Concluído (1ª versão) |
| 7. Validar o sistema por testes automatizados (TDD) | Execução das suítes de testes | pytest; PlatformIO test; Vitest | 67 testes aprovados (40 backend + 14 firmware + 13 frontend), 05/09/2026 | ✅ Concluído (1ª versão) |
| 8. Validação em bancada (rampa e estabilidade) | Curvas VP×SP e calibração | — | Pendente | 🔴 Continuidade |

## Consistência global

| Problema | Objetivo geral | Objetivos específicos | Método | Resultado |
|---|---|---|---|---|
| Rampa inadequada; parâmetros não persistentes; IHM frágil; sem watchdog; acoplamento app/tempo real | Sistema de automação e supervisão moderno e seguro para especiação de Hg | 1–7 | SDD + TDD: arquitetura mestre-escravo, FSM+PID, JSON 4 Hz, firmware DAQ, IHM Web, persistência, testes | Implementação validada por testes; pendente validação física em bancada |
