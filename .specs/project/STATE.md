# STATE — Memória do Projeto

> Atualizar a cada decisão, bloqueio, lição ou ideia adiada.

## Decisions

- Arquitetura mestre-escravo: RPi (FSM/PID/IHM) + Arduino Uno (DAQ em tempo real). **Decidido** no TDD.
- Protocolo RPi↔Arduino: JSON sobre USB/Serial a 4 Hz (250 ms). **Decidido**.
- Watchdog no Arduino: desliga fornos se não houver pacotes por > 1 s. **Decidido**.
- Persistência de parâmetros: arquivo JSON em disco no RPi (leitura/escrita atômica + backup rotativo). **Decidido**.
- Gráficos de tendência: VP×SP, °C/s e PWM, amostragem 4 Hz, buffer ≥ 15 min. **Decidido**.
- Frontend: React + Vite + TypeScript + canvas customizado (sem lib de gráficos pesada). **Decidido**.
- Implantação como serviço: unidade systemd em `scripts/systemd/especiacao-mercurio-ihm.service.template` (`Type=forking` + `PIDFile=logs/backend.pid`), com `start.sh`/`stop.sh` como `ExecStart`/`ExecStop`. **Raiz alvo: `/home/dietpi/especiacao-mercurio-frontend-back-end` (usuário `dietpi`) — DietPi/RPi**. **Decidido**.
- Controle do Tubo U abaixo de 0 °C: PWM fixo persistido (`ramp.pwm_below_zero`, 0–255, default 128) em malha aberta; PID assume em T > 0 °C. A estratégia de razão de taxas/curva Taxa × PWM foi suprimida. **Decidido** (solicitação do operador, 2026-09-18).
- Ajuda na IHM: botão no cabeçalho abre painel com instruções do processo, Figura 11 embarcada em `frontend/src/assets/` (offline) e link do repositório GitHub. **Decidido** (2026-09-18).

## Open Questions / Gray Areas

- Part number exato do amplificador SPI do termopar (MAX31855 vs MAX6675) — **confirmar com hardware**; premissa operacional atual: MAX6675 (sem leitura abaixo de 0 °C).
- Interpolação da curva "Taxa de Aquecimento × % PWM" do Tubo U — **Suprimida** (2026-09-18): substituída pelo PWM fixo persistido `ramp.pwm_below_zero`.
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
- **`start.sh` daemoniza** (nohup + `logs/*.pid`): em systemd exige `Type=forking` com `PIDFile` — `Type=simple` considera o serviço encerrado assim que o script retorna; `ExecStartPre=-…/stop.sh` limpa PIDs órfãos de execuções manuais.

## Todos

- [x] Validar E2E com simulador via socat (porta virtual).
- [ ] Confirmar part number do termopar SPI (hardware).
- [ ] Mapear porta serial no RPi antes da integração.
- [ ] Definir margem de proteção de temperatura.
- [ ] Calibrar em bancada o PWM fixo da fase ≤ 0 °C (`ramp.pwm_below_zero`) e validar a transição para o PID.

## Deferred Ideas

- Auto-tune de PID.
- Exportação de curvas (CSV/PDF).
- Autenticação multiusuário.
