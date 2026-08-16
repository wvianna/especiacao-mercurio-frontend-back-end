# Integração e Testes de Sistema Tasks

**Design**: `.specs/features/integracao-sistema/design.md`
**Status**: Done

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: Validação (Sequencial — compartilham simulador)

```
T2 → T3 → T4
```

### Phase 3: Documentação (Sequential)

```
T4 → T5
```

> Testes de integração/E2E são parallel-safe: Não (compartilham o simulador) — tasks executam em sequência.

---

## Task Breakdown

### T1: Simulador do DAQ

**What**: Implementar `DaqSimulator` que emula o Arduino (JSON write/read, `fail()`).
**Where**: `backend/tests/simulator.py`
**Depends on**: None
**Reuses**: contratos JSON do TDD.
**Requirement**: INT-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Responde JSON de leitura coerente ao JSON de escrita.
- [ ] Aceita handshake `config`.
- [ ] `fail()` para de responder (para watchdog).
- [ ] Testes do próprio simulador passam.

**Tests**: unit
**Gate**: quick

### T2: Teste E2E do ciclo T₀→T₃

**What**: Suíte `-m e2e` validando a matriz de atuadores por fase.
**Where**: `backend/tests/test_e2e.py`
**Depends on**: T1
**Reuses**: simulador + backend FSM.
**Requirement**: INT-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Ciclo completo percorre T₀,T₁,T₂,T₃ conforme matriz.
- [ ] Retorno ao Safe State ao final.
- [ ] `pytest -q -m e2e` verde.

**Tests**: integration
**Gate**: full

### T3: Teste de segurança (perda de serial)

**What**: Validar watchdog + Safe State ao cortar a comunicação.
**Where**: `backend/tests/test_safety.py`
**Depends on**: T2
**Reuses**: simulador `fail()` + backend Safe State.
**Requirement**: INT-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Corte > 1 s desliga PWMs (watchdog).
- [ ] Backend entra em Safe State.
- [ ] Teste verde.

**Tests**: integration
**Gate**: full

### T4: Teste de estresse 4 Hz (4 h)

**What**: Script de estresse medindo perda de pacotes e degradação.
**Where**: `backend/tests/stress_4hz.py`
**Depends on**: T3
**Reuses**: simulador.
**Requirement**: INT-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Roda 4 h a 4 Hz com contador de pacotes.
- [ ] Relatório com perda = 0 e sem degradação.
- [ ] Saída registrada em log.

**Tests**: integration
**Gate**: full

### T5: Documentação de handoff (HANDSOFF.md)

**What**: Escrever HANDSOFF.md + mapeamento JSON + endereçamento serial + interpolação da curva.
**Where**: `docs/HANDSOFF.md`, `docs/`
**Depends on**: T4
**Reuses**: TDD + especificação + requisitos.
**Requirement**: INT-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mapeamento completo dos campos JSON documentado.
- [ ] Endereçamento de portas seriais descrito.
- [ ] Método de interpolação da curva de aquecimento descrito.
- [ ] Revisão de conteúdo aprovada.

**Tests**: none
**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential): T1 → T2
Phase 2 (Sequential): T2 → T3 → T4
Phase 3 (Sequential): T4 → T5
```

> Sem tasks `[P]` — testes de integração/E2E compartilham o simulador (parallel-safe: Não).

---

## Task Granularity Check

- [x] Cada task = um artefato testável (simulador, suíte, script, documento).
- [x] Dependências em cadeia.

## Diagram-Definition Cross-Check

| Diagrama     | Depends on no arquivo        | Consistente |
| ------------ | ---------------------------- | ----------- |
| T1→T2        | T2: T1                       | ✅          |
| T2→T3→T4     | T3: T2 · T4: T3              | ✅          |
| T4→T5        | T5: T4                       | ✅          |

## Test Co-location Validation

| Task | Tests no arquivo | TESTING.md exige | OK |
| ---- | ---------------- | ---------------- | -- |
| T1   | unit             | unit             | ✅ |
| T2   | integration      | integration      | ✅ |
| T3   | integration      | integration      | ✅ |
| T4   | integration      | integration      | ✅ |
| T5   | none             | build            | ✅ |
