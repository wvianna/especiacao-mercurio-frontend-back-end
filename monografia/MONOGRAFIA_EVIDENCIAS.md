# MONOGRAFIA — EVIDÊNCIAS

Matriz de evidências do projeto. Cada afirmação técnica importante deve ter
sustentação em bibliografia, código, especificação, teste ou documentação.

| Afirmação | Evidência | Arquivo/Fonte | Seção |
|---|---|---|---|
| Processo exige sequência derivatização→criofocalização→atomização a 700 °C | Especificação e requisitos do processo | `docs/requisitos.md`; `docs/especificacao.md` | 1.1; 2.1 |
| Tubo U envolto por resistência (forno 1), rampa de −50 a 230 °C | Descrição do processo | `docs/requisitos.md`; `docs/especificacao.md` §5 | 2.1; 4 |
| Derivatização com TEBS volatiliza espécies de Hg | Descrição química do processo (refs. Bloom; Liang et al.) | `docs/requisitos.md`; bibliografia | 2.1 |
| Arquitetura mestre-escravo RPi (mestre) / Arduino (DAQ) | Código e diagrama de arquitetura | `backend/app/main.py`; `README.md`; HANDSOFF §1.1 | 4.2; 5.1 |
| FSM com estados SAFE, T0–T3 e MANUAL | Enum e lógica implementados | `backend/app/fsm.py` | 5.2 |
| Matriz de atuadores por fase (SV1–SV5, bomba) | Constante `MATRIX` e testes | `backend/app/fsm.py`; `backend/tests/test_fsm.py` | 5.2; 6.1 |
| PID com P+I e anti-windup, saída 0–255 | Implementação | `backend/app/pid.py`; `backend/tests/test_pid.py` | 5.3 |
| Rampa: razão de taxas T<0; PID T≥0 | Implementação | `backend/app/ramp.py`; `backend/tests/test_ramp.py` | 5.3 |
| Protocolo JSON line-delimited a 4 Hz | Codec e testes | `backend/app/serial_link.py`; `backend/tests/test_serial_link.py` | 5.5 |
| Firmware aplica atuadores, lê termopares SPI, watchdog 1 s | Firmware | `firmware/src/firmware.ino`; `lib/daqcore/watchdog.*` | 5.4 |
| Bomba por pulso (toggle 600 ms) | Firmware | `firmware/src/actuator_driver.cpp`; `lib/daqcore/pump_toggle.*` | 5.4 |
| Leitura MAX6675 (bit-bang SPI, LSB 0,25 °C) | Firmware | `firmware/src/thermocouple_reader.cpp` | 5.4 |
| Persistência atômica com backup rotativo | Implementação | `backend/app/config_store.py`; `backend/tests/test_config_store.py` | 5.6 |
| API REST + WebSocket `/ws/telemetry` | Implementação | `backend/app/api.py`; `backend/tests/test_api.py` | 5.7 |
| IHM React com Diagrama de Tempos, gráficos, modos AUTO/MANUAL | Frontend | `frontend/src/*` | 5.8 |
| Watchdog de backend: SAFE após 1 s sem resposta | Implementação | `backend/app/loop.py`; `backend/tests/test_safety.py` | 5.9 |
| Testes verdes (36 backend, 9 firmware host, 6 frontend) | Relatório HANDSOFF; execução de testes | `docs/HANDSOFF.md` §13; execução pytest/pio/npm | 6.1 |
| Estresse de comunicação a 4 Hz via simulador/socat | Script de teste | `backend/tests/stress_4hz.py` | 6.1 |

## Evidências planejadas mas NÃO disponíveis (continuidade)
| Afirmação | Evidência necessária | Status |
|---|---|---|
| Linearidade da rampa real (±2 °C) | Curva VP×SP em bancada | `[DADO NECESSÁRIO]` |
| Curva Taxa de aquecimento × %PWM do Tubo U | Calibração em bancada | `[DADO NECESSÁRIO]` |
| Estabilidade do forno 2 (±5 °C em 700 °C) | Medição em bancada | `[DADO NECESSÁRIO]` |
| Part number do amplificador SPI do termopar | Confirmação de hardware (MAX31855 vs MAX6675) | `[VALIDAR COM O AUTOR]` |
