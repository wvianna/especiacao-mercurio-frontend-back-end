# Roadmap

**Current Milestone:** M1 – Fundação + Firmware DAQ
**Status:** Planning

---

## M1 – Fundação + Firmware DAQ

**Goal:** Arduino recebe JSON de escrita e responde JSON de leitura com termopares, com watchdog de segurança.
**Target:** Comunicação serial e watchdog validados em bancada.

### Features

**[firmware-daq]** - PLANNED

- Controle das saídas digitais (SV1–SV5, bomba) e PWM (fornos 1 e 2).
- Leitura de termopares T1/T2 via SPI.
- Parser/resposta JSON (config, escrita, leitura).
- Watchdog de segurança (desliga fornos após 1 s sem pacotes).

---

## M2 – Backend de Controle

**Goal:** RPi executa FSM, PID/rampa, persistência e expõe API + WebSocket.
**Target:** Ciclo T₀→T₃ controlável via API com telemetria em tempo real.

### Features

**[backend-controle]** - PLANNED

- Enlace serial 4 Hz com reconexão.
- FSM + matriz de atuadores T₀–T₃.
- PID Forno 2 + rampa Forno 1 (estratégia mista) e °C/s.
- Persistência JSON de parâmetros (LER/ESCREVER).
- API REST (config, control, manual) e WebSocket de telemetria.

---

## M3 – IHM Web

**Goal:** Operador supervisiona e comanda o processo pela web.
**Target:** Dashboard completo com sinótico, gráficos de tendência e controles.

### Features

**[ihm-web]** - PLANNED

- Sinótico animado do processo.
- Gráficos de tendência (VP×SP, °C/s, PWM) em 4 Hz.
- Controles manuais (SV1–SV5, bomba, sliders VM).
- Painel de configuração com persistência.
- Botão STOP de alta prioridade.

---

## M4 – Integração e Testes

**Goal:** Sistema completo validado e documentado.
**Target:** Testes E2E, segurança e HANDSOFF entregues.

### Features

**[integracao-sistema]** - PLANNED

- Simulador do DAQ para testes sem hardware.
- E2E do ciclo T₀→T₃.
- Teste de segurança (perda de serial → watchdog).
- Teste de estresse 4 Hz (4 h).
- Documentação (HANDSOFF.md, mapeamento JSON).

---

## Future Considerations

- Autenticação e perfis de operador com trilha de auditoria.
- Exportação de curvas (CSV/PDF).
- Auto-tune dos PIDs.
- Simulador de processo para treinamento.
