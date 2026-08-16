# STATE — Memória do Projeto

> Atualizar a cada decisão, bloqueio, lição ou ideia adiada.

## Decisions

- Arquitetura mestre-escravo: RPi (FSM/PID/IHM) + Arduino Uno (DAQ em tempo real). **Decidido** no TDD.
- Protocolo RPi↔Arduino: JSON sobre USB/Serial a 4 Hz (250 ms). **Decidido**.
- Watchdog no Arduino: desliga fornos se não houver pacotes por > 1 s. **Decidido**.
- Persistência de parâmetros: arquivo JSON em disco no RPi (leitura/escrita atômica + backup rotativo). **Decidido**.
- Gráficos de tendência: VP×SP, °C/s e PWM, amostragem 4 Hz, buffer ≥ 15 min. **Decidido**.
- Frontend: React + Vite + TypeScript + canvas customizado (sem lib de gráficos pesada). **Decidido**.

## Open Questions / Gray Areas

- Part number exato do amplificador SPI do termopar (MAX31855 vs MAX6675) — **confirmar com hardware** antes do T2 do firmware.
- Interpolação da curva "Taxa de Aquecimento × % PWM" do Tubo U — necessária para o cálculo de VM quando T < 0 °C. **Aberto**.
- Margem de proteção de temperatura (valor acima do target que dispara STOP). **Aberto**.
- Persistência automática ao validar edição vs. somente via botão ESCREVER. **Em discussão**.
- Porta serial definitiva no RPi (/dev/ttyUSB0 vs /dev/ttyACM0). **Validar em M2**.

## Blockers

- Nenhum no momento.

## Lessons

- **Includes de lib local no PlatformIO**: headers de `lib/<nome>/` são incluídos como `<header.h>` (sem o prefixo da pasta).
- **Pin order no AVR**: declarar funções antes do uso em headers inline (`safeState` antes de `initPins`).
- **Router WebSocket**: o contrato do TDD exige `/ws/telemetry` — o router REST usa prefixo `/api`, então o WS precisa de um router separado sem prefixo.
- **Loop thread**: `serial.Serial()` lança `SerialException` (não `SerialError`) — capturar amplamente para a thread não morrer silenciosamente.
- **pydantic**: dar default a campos obrigatórios quando o modelo tem instância default (ex.: `RampConfig.time_s`).
- **FSM/atuadores**: manter o payload aninhado (`pwm.u`/`pwm.f2`) consistente na FSM para casar com o contrato do TDD.
- **Socat + pyserial** funciona como porta virtual para testes E2E reais do enlace.

## Todos

- [x] Validar E2E com simulador via socat (porta virtual).
- [ ] Confirmar part number do termopar SPI (hardware).
- [ ] Mapear porta serial no RPi antes da integração.
- [ ] Definir margem de proteção de temperatura.
- [ ] Calibrar curva Taxa × PWM e `set_system_rate`.

## Deferred Ideas

- Auto-tune de PID.
- Exportação de curvas (CSV/PDF).
- Autenticação multiusuário.
