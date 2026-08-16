# Firmware DAQ Tasks

**Design**: `.specs/features/firmware-daq/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Core (Sequencial — estado de pinos compartilhado)

```
T3 → T4 → T5 → T6
```

### Phase 3: Verificação (Sequencial)

```
T6 → T7
```

> Firmware possui estado de pinos compartilhado e sem testes paralelizáveis em hardware — tasks executam em sequência (sem `[P]`).

---

## Task Breakdown

### T1: Estrutura do sketch + PinMap

**What**: Criar `firmware/firmware.ino` mínimo e `pin_map.h` com inicialização segura.
**Where**: `firmware/src/pin_map.h`, `firmware/firmware.ino`
**Depends on**: None
**Reuses**: mapa de I/O do TDD (seção Mapeamento de I/O).
**Requirement**: DAQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `initPins()` configura pinos 2–7 como saída digital, 9 e 10 como PWM, e desliga tudo.
- [ ] `safeState()` zera válvulas, bomba e PWMs (SV5 em nível baixo).
- [ ] Compila: `arduino-cli compile --fqbn arduino:avr:uno firmware/`

**Tests**: none
**Gate**: build

### T2: Leitura de termopares via SPI

**What**: Implementar leitura de T1/T2 com dois chips termopar em barramento SPI compartilhado.
**Where**: `firmware/src/thermocouple_reader.{h,cpp}`
**Depends on**: T1
**Reuses**: SPI core + lib termopar (MAX31855/MAX6675 — confirmar part no STATE.md).
**Requirement**: DAQ-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `readTemps(t1, t2)` retorna temperaturas em °C e `false` em erro de leitura.
- [ ] Erro de termopar aberto reportado via `error_code`.
- [ ] Compila para Uno.

**Tests**: none
**Gate**: build

### T3: Protocolo JSON (parser + serializador)

**What**: Parsear `config`/escrita e serializar JSON de leitura com ArduinoJson.
**Where**: `firmware/src/json_protocol.{h,cpp}`
**Depends on**: T1
**Reuses**: contratos JSON do TDD (handshake, escrita, leitura).
**Requirement**: DAQ-01, DAQ-04, DAQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `parseIncoming` reconhece `cmd:config` (ignora ganhos) e pacote de escrita (válvulas/bomba/pwm).
- [ ] `buildReport` emite `{"temp":{...},"status":"...","error_code":N}`.
- [ ] Pacote inválido é descartado sem efeito colateral.
- [ ] Teste host-based compila (native).

**Tests**: unit
**Gate**: quick

### T4: Acionamento de atuadores (digitais + PWM)

**What**: Aplicar `Command` aos pinos com saturação de PWM.
**Where**: `firmware/src/actuator_driver.{h,cpp}`
**Depends on**: T3
**Reuses**: PinMap (T1).
**Requirement**: DAQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `apply(Command)` aciona SV1–SV5 (pinos 7,4,3,5,6), bomba (pino 2) e PWM 9/10.
- [ ] PWM saturado em 255.
- [ ] Compila para Uno.

**Tests**: none
**Gate**: build

### T5: Watchdog de segurança

**What**: Implementar watchdog de 1 s que força Safe State.
**Where**: `firmware/src/watchdog.{h,cpp}`
**Depends on**: T4
**Reuses**: PinMap.safeState().
**Requirement**: DAQ-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `feed()` chamado a cada pacote válido.
- [ ] `tripped()` true após >1000 ms sem feed.
- [ ] Ao disparar, PWMs e válvulas vão a zero.
- [ ] Teste host-based da lógica (millis injetável).

**Tests**: unit
**Gate**: quick

### T6: Loop principal (integração serial a 4 Hz)

**What**: Integrar parser, atuadores, termopares e watchdog no loop a 250 ms.
**Where**: `firmware/firmware.ino`
**Depends on**: T2, T4, T5
**Reuses**: todos os módulos anteriores.
**Requirement**: DAQ-01, DAQ-02, DAQ-03, DAQ-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Loop lê serial, aplica comando, lê T1/T2, envia resposta a cada 250 ms.
- [ ] Watchdog alimentado apenas em pacote válido.
- [ ] `status` alterna `"active"`/`"safe"` corretamente.
- [ ] Compila para Uno.

**Tests**: none
**Gate**: build

### T7: Testes host-based (parser + watchdog)

**What**: Suíte de teste nativa para parser e watchdog (sem hardware).
**Where**: `firmware/test/`
**Depends on**: T6
**Reuses**: TESTING.md (gate quick).
**Requirement**: DAQ-01, DAQ-03, DAQ-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Testes cobrem JSON válido/inválido/truncado e saturação de PWM.
- [ ] Testes cobrem disparo do watchdog em 1 s.
- [ ] `platformio test -e native` verde.

**Tests**: unit
**Gate**: quick

---

## Parallel Execution Map

```
Phase 1 (Sequential): T1 → T2 → T3
Phase 2 (Sequential): T3 → T4 → T5 → T6
Phase 3 (Sequential): T6 → T7
```

**Constraint**: sem tasks `[P]` — estado de hardware compartilhado e testes dependentes de build sequencial.

---

## Task Granularity Check

- [x] Cada task = um módulo/arquivo com responsabilidade única.
- [x] Dependências definidas em cadeia.
- [x] Nenhuma task agrupa múltiplas funcionalidades.

## Diagram-Definition Cross-Check

| Diagrama | Depends on no arquivo | Consistente |
| -------- | --------------------- | ----------- |
| T1→T2→T3 | T2: T1 · T3: T1       | ✅          |
| T3→T4→T5→T6 | T4: T3 · T5: T4 · T6: T2,T4,T5 | ✅ |
| T6→T7 | T7: T6               | ✅          |

## Test Co-location Validation

| Task | Tests no arquivo | TESTING.md exige | OK |
| ---- | ---------------- | ---------------- | -- |
| T1   | none             | build            | ✅ |
| T2   | none             | build            | ✅ |
| T3   | unit             | unit             | ✅ |
| T4   | none             | build            | ✅ |
| T5   | unit             | unit             | ✅ |
| T6   | none             | build            | ✅ |
| T7   | unit             | unit             | ✅ |
