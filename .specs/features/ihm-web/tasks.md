# IHM Web Tasks

**Design**: `.specs/features/ihm-web/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Componentes (Parallel OK)

```
           ┌→ T4 ─┐
T3 ────────┼→ T5 ─┼──→ T7
           └→ T6 ─┘
```

### Phase 3: Integração visual (Sequential)

```
T7 → T8 → T9
```

---

## Task Breakdown

### T1: Scaffold do projeto (Vite + React + TS + tema)

**What**: Criar projeto Vite React TS, tokens de tema (CSS variables), fontes e base visual.
**Where**: `frontend/`
**Depends on**: None
**Reuses**: skill frontend-design (direção estética).
**Requirement**: IHM-01

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Projeto roda (`npm run dev`) e build passa (`npm run build`).
- [ ] Tokens de tema e tipografia distintiva definidos (sem Inter/Arial/padrões genéricos).
- [ ] Layout base com grade assimétrica e tema escuro "instrumento".

**Tests**: none
**Gate**: build

### T2: Cliente API REST

**What**: Implementar `ApiClient` (config/control/manual).
**Where**: `frontend/src/api/client.ts`
**Depends on**: T1
**Reuses**: endpoints do TDD.
**Requirement**: IHM-03, IHM-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Métodos `getConfig/putConfig/start/stop/emergency/manual` implementados.
- [ ] Erros (422) propagam detalhes por campo.
- [ ] Testes unitários passam.

**Tests**: unit
**Gate**: quick

### T3: Store de telemetria + WebSocket

**What**: Implementar `TelemetryStore` com conexão WS e buffer de séries (≥15 min).
**Where**: `frontend/src/store/telemetry.ts`, `frontend/src/ws/connection.ts`
**Depends on**: T1
**Reuses**: payload do TDD.
**Requirement**: IHM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Conexão `/ws/telemetry` com reconexão automática.
- [ ] `applyTelemetry` atualiza estado e buffer rolante.
- [ ] Testes unitários do buffer passam.

**Tests**: unit
**Gate**: quick

### T4: Gráfico de tendência (canvas) [P]

**What**: Implementar `TrendChart` (VP×SP, °C/s, PWM) em canvas 60 fps.
**Where**: `frontend/src/components/TrendChart.tsx`
**Depends on**: T3
**Reuses**: TelemetryStore.
**Requirement**: IHM-02

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Plota VP e SP sobrepostos (Tubo U e Forno 2).
- [ ] Plota °C/s e PWM das resistências.
- [ ] Janela rolante ≥ 15 min.
- [ ] Testes de renderização (mock) passam.

**Tests**: unit
**Gate**: quick

### T5: Sinótico animado (SVG) [P]

**What**: Implementar `Synoptic` com fluxograma e estados visuais.
**Where**: `frontend/src/components/Synoptic.tsx`
**Depends on**: T3
**Reuses**: TelemetryStore.
**Requirement**: IHM-01

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Válvulas/bomba/resistências destacadas (vermelho ativo, azul fluxo).
- [ ] Pistão indica copo levantado/abaixado.
- [ ] Atualiza em ≤ 250 ms com telemetria mockada.

**Tests**: unit
**Gate**: quick

### T6: Controles manuais + painel de configuração [P]

**What**: Implementar `ManualPanel` e `ConfigPanel` (com LER/ESCREVER).
**Where**: `frontend/src/components/ManualPanel.tsx`, `frontend/src/components/ConfigPanel.tsx`
**Depends on**: T2
**Reuses**: ApiClient.
**Requirement**: IHM-03

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Botões SV1–SV5, bomba e sliders VM chamam `manual`.
- [ ] Entradas T₁/T₂/T₃, rampa, N₂, PID com LER/ESCREVER (`getConfig`/`putConfig`).
- [ ] Campos inválidos (422) destacados.
- [ ] Testes de interação passam.

**Tests**: unit
**Gate**: quick

### T7: STOP + barra de status/alertas

**What**: Implementar `StopButton`, `StatusBar` e alertas.
**Where**: `frontend/src/components/StopButton.tsx`, `frontend/src/components/StatusBar.tsx`
**Depends on**: T2, T3
**Reuses**: ApiClient + TelemetryStore.
**Requirement**: IHM-04, IHM-05

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] STOP chama `emergency` com feedback imediato.
- [ ] Status de fase + alertas (falha serial, desvio, erro) visíveis.
- [ ] Testes passam.

**Tests**: unit
**Gate**: quick

### T8: Montagem do dashboard

**What**: Integrar todos os componentes no layout final com motion e micro-interações.
**Where**: `frontend/src/App.tsx`, `frontend/src/styles/`
**Depends on**: T4, T5, T6, T7
**Reuses**: todos os componentes.
**Requirement**: IHM-01..05

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Dashboard completo e coeso (sinótico + gráficos + controles + STOP + status).
- [ ] Page load com staggered reveals e hover states.
- [ ] Build passa (`npm run build`).

**Tests**: none
**Gate**: build

### T9: Testes de integração visual + build final

**What**: Suíte de testes de componentes + build de produção.
**Where**: `frontend/src/**/*.test.tsx`
**Depends on**: T8
**Reuses**: TESTING.md.
**Requirement**: IHM-01..05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Todos os testes de componentes verdes (`npx vitest run`).
- [ ] Build de produção sem erros.
- [ ] Sem regressão visual óbvia.

**Tests**: unit
**Gate**: full

---

## Parallel Execution Map

```
Phase 1 (Sequential): T1 → T2 → T3
Phase 2 (Parallel):   T3 completo, então: T4 [P], T5 [P], T6 [P]
Phase 3 (Sequential): T4,T5,T6 → T7 → T8 → T9
```

> T4/T5/T6 têm testes unit (parallel-safe: Sim) e não compartilham estado mutável — podem rodar em subagentes simultâneos.

---

## Task Granularity Check

- [x] Cada task = um componente/cliente com responsabilidade única.
- [x] Dependências explícitas.
- [x] Tasks `[P]` sem dependências entre si.

## Diagram-Definition Cross-Check

| Diagrama        | Depends on no arquivo              | Consistente |
| --------------- | ---------------------------------- | ----------- |
| T1→T2→T3        | T2: T1 · T3: T1                    | ✅          |
| T3 → T4/T5/T6   | T4: T3 · T5: T3 · T6: T2           | ✅          |
| T4-T7 → T8 → T9 | T7: T2,T3 · T8: T4,T5,T6,T7 · T9: T8 | ✅        |

## Test Co-location Validation

| Task | Tests no arquivo | TESTING.md exige | OK |
| ---- | ---------------- | ---------------- | -- |
| T1   | none             | build            | ✅ |
| T2   | unit             | unit             | ✅ |
| T3   | unit             | unit             | ✅ |
| T4   | unit             | unit             | ✅ |
| T5   | unit             | unit             | ✅ |
| T6   | unit             | unit             | ✅ |
| T7   | unit             | unit             | ✅ |
| T8   | none             | build            | ✅ |
| T9   | unit             | unit + build     | ✅ |
