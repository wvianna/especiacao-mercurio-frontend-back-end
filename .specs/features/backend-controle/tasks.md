# Backend de Controle Tasks

**Design**: `.specs/features/backend-controle/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Core (Parallel OK)

```
           ┌→ T4 ─┐
T3 ────────┼→ T5 ─┼──→ T7 → T8
           └→ T6 ─┘
```

### Phase 3: Integração (Sequential)

```
T8 → T9
```

---

## Task Breakdown

### T1: Modelos e persistência (ConfigStore + Params)

**What**: Implementar `Params` (pydantic) e `ConfigStore` com leitura/escrita atômica e backup.
**Where**: `backend/app/models.py`, `backend/app/config_store.py`
**Depends on**: None
**Reuses**: modelo persistido do TDD.
**Requirement**: BEC-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `load()` retorna defaults do TDD se arquivo ausente.
- [ ] `save()` grava atômico + backup rotativo do anterior.
- [ ] `validate()` rejeita faixas inválidas.
- [ ] Testes de ida/volta (gravar→ler) passam.

**Tests**: unit
**Gate**: quick

### T2: PID genérico

**What**: Implementar `PidController` (P+I com anti-windup) retornando 0–255.
**Where**: `backend/app/pid.py`
**Depends on**: None
**Reuses**: ganhos do TDD.
**Requirement**: BEC-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `update(sp, pv, dt)` converge para setpoint em teste sintético.
- [ ] Saída saturada em [0, 255].
- [ ] Testes de convergência e anti-windup passam.

**Tests**: unit
**Gate**: quick

### T3: Rampa do Tubo U

**What**: Implementar `RampController` (razão de taxas T<0, PID T≥0) e °C/s.
**Where**: `backend/app/ramp.py`
**Depends on**: T2
**Reuses**: PidController; TDD "Estratégia de Controle PID e Rampa".
**Requirement**: BEC-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] T < 0 °C → VM = taxa_usuário/taxa_sistema.
- [ ] T ≥ 0 °C → PID até 230 °C.
- [ ] `heating_rate_c_per_s()` calculado do tempo de rampa.
- [ ] Testes cobrem as duas regiões.

**Tests**: unit
**Gate**: quick

### T4: Enlace serial (pyserial + codec JSON) [P]

**What**: Implementar `SerialLink` com handshake `config`, escrita/leitura JSON e reconexão.
**Where**: `backend/app/serial_link.py`
**Depends on**: T1
**Reuses**: contratos JSON do TDD.
**Requirement**: BEC-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `connect()` envia handshake `config`.
- [ ] `write_command`/`read_report` usam JSON line-delimited.
- [ ] Reconexão com backoff e notificação de falha.
- [ ] Testes com porta serial mockada passam.

**Tests**: unit
**Gate**: quick

### T5: FSM + matriz T₀→T₃ [P]

**What**: Implementar `StateMachine` com Safe State, ciclo T₀→T₃, Manual e STOP.
**Where**: `backend/app/fsm.py`
**Depends on**: T1, T3
**Reuses**: matriz de atuadores do TDD.
**Requirement**: BEC-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] INICIAR percorre T₀→T₁→T₂→T₃ conforme matriz.
- [ ] STOP e emergency retornam ao Safe State de qualquer estado.
- [ ] Manual aplica override.
- [ ] Testes de transição de estados passam.

**Tests**: unit
**Gate**: quick

### T6: API REST + WebSocket [P]

**What**: Implementar endpoints `/api/config`, `/api/control/*`, `/api/manual` e `/ws/telemetry`.
**Where**: `backend/app/api.py`, `backend/app/main.py`
**Depends on**: T1
**Reuses**: payload de telemetria do TDD.
**Requirement**: BEC-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `GET/PUT /api/config` funcionam (422 em faixa inválida).
- [ ] `POST /api/control/{start,stop,emergency}` e `PUT /api/manual` funcionam.
- [ ] `/ws/telemetry` transmite payload a 4 Hz.
- [ ] Testes de endpoints (TestClient) passam.

**Tests**: unit
**Gate**: quick

### T7: Loop de controle 4 Hz + integração

**What**: Integrar FSM, serial, PID/rampa e broadcast em thread de 250 ms.
**Where**: `backend/app/loop.py`
**Depends on**: T4, T5, T6
**Reuses**: módulos anteriores.
**Requirement**: BEC-02, BEC-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Loop a 4 Hz envia escrita e consome leitura.
- [ ] Telemetria publicada com VP/SP/VM/°C/s.
- [ ] Falha serial → Safe State + reconexão.
- [ ] Teste de integração com simulador passa.

**Tests**: integration
**Gate**: full

### T8: Log estruturado

**What**: Logger JSON com transições da FSM e erros de serial.
**Where**: `backend/app/logging_setup.py`
**Depends on**: T5, T7
**Reuses**: formato de log do TDD.
**Requirement**: BEC-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Transições de estado registradas em JSON.
- [ ] Erros de serial registrados com timestamp.
- [ ] Não registra segredos/dados pessoais.

**Tests**: unit
**Gate**: quick

### T9: Testes de integração E2E com simulador

**What**: Suíte `-m e2e` validando ciclo T₀→T₃ e reconexão contra o simulador.
**Where**: `backend/tests/test_e2e.py`
**Depends on**: T8
**Reuses**: simulador (feature integracao-sistema).
**Requirement**: BEC-02, BEC-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Ciclo T₀→T₃ validado contra matriz.
- [ ] Reconexão pós-falha validada.
- [ ] `python -m pytest -q -m e2e` verde.

**Tests**: integration
**Gate**: full

---

## Parallel Execution Map

```
Phase 1 (Sequential): T1 → T2 → T3
Phase 2 (Parallel):   T3 completo, então: T4 [P], T5 [P], T6 [P]
Phase 3 (Sequential): T7 → T8 → T9
```

> T7 (integração) e T9 (E2E) são sequenciais: compartilham o simulador e têm testes de integração (parallel-safe: Não).

---

## Task Granularity Check

- [x] Cada task = um módulo/endpoint com responsabilidade única.
- [x] Dependências explícitas por task.
- [x] Tasks `[P]` sem estado compartilhado (serial, FSM e API tocam módulos distintos).

## Diagram-Definition Cross-Check

| Diagrama     | Depends on no arquivo                | Consistente |
| ------------ | ------------------------------------ | ----------- |
| T1→T2→T3     | T2: None · T3: T2                    | ✅          |
| T3 → T4/T5/T6| T4: T1 · T5: T1,T3 · T6: T1          | ✅          |
| T7→T8→T9     | T7: T4,T5,T6 · T8: T5,T7 · T9: T8    | ✅          |

## Test Co-location Validation

| Task | Tests no arquivo | TESTING.md exige | OK |
| ---- | ---------------- | ---------------- | -- |
| T1   | unit             | unit             | ✅ |
| T2   | unit             | unit             | ✅ |
| T3   | unit             | unit             | ✅ |
| T4   | unit             | unit             | ✅ |
| T5   | unit             | unit             | ✅ |
| T6   | unit             | unit             | ✅ |
| T7   | integration      | integration      | ✅ |
| T8   | unit             | unit             | ✅ |
| T9   | integration      | integration      | ✅ |
