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

- Nenhum no momento (Fase de planejamento).

## Lessons

- (vazio — registrar lições conforme a implementação avança)

## Todos

- [ ] Confirmar part number do termopar SPI (hardware).
- [ ] Mapear porta serial no RPi antes da integração.
- [ ] Definir margem de proteção de temperatura.

## Deferred Ideas

- Auto-tune de PID.
- Exportação de curvas (CSV/PDF).
- Autenticação multiusuário.
