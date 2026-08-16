# IHM Web (Frontend) Specification

## Problem Statement

A interface de supervisão deve reduzir o erro humano e dar visibilidade total do processo: sinótico animado, gráficos de tendência (VP×SP, °C/s, PWM das resistências), controles manuais, painel de configuração com persistência e botão STOP de alta prioridade — tudo consumindo a API/WebSocket do backend a 4 Hz.

## Goals

- [ ] Sinótico animado (fluxo azul = hélio/vapor; vermelho = resistências ativas).
- [ ] Gráficos de tendência em tempo real (4 Hz): VP×SP, °C/s e PWM.
- [ ] Controles manuais (SV1–SV5, bomba, sliders VM) e painel de configuração (T₁/T₂/T₃, rampa, N₂, PID).
- [ ] Botão STOP de alta prioridade e indicadores de fase/status.
- [ ] Visual distinto e coeso (skill frontend-design), não "genérico de IA".

## Out of Scope

| Feature               | Reason                            |
| --------------------- | --------------------------------- |
| Lógica de controle    | Pertence ao backend               |
| Persistência no disco | Pertence ao backend               |
| Autenticação          | V2                                |

---

## User Stories

### P1: Sinótico animado do processo ⭐ MVP

**User Story**: Como operador, quero ver o fluxograma do processo com estados visuais para entender o que está ativo.

**Why P1**: Redução de erro humano e consciência situacional.

**Acceptance Criteria**:

1. WHEN uma válvula/bomba/resistência está ativa THEN o sinótico SHALL destacá-la (vermelho = resistência ativa; azul = fluxo de hélio/vapor).
2. WHEN o estado muda via telemetria THEN o sinótico SHALL atualizar em ≤ 250 ms.
3. WHEN o pistão (SV5) muda THEN o sinótico SHALL indicar copo levantado/abaixado.

**Independent Test**: com telemetria mockada, alternar estados e observar o sinótico.

### P1: Gráficos de tendência (VP×SP, °C/s, PWM) ⭐ MVP

**User Story**: Como operador, quero acompanhar VP × SP, o Coeficiente de Aquecimento e o PWM das resistências ao longo do tempo.

**Why P1**: Requisito explícito do TDD para repetibilidade analítica.

**Acceptance Criteria**:

1. WHEN chega telemetria a 4 Hz THEN o gráfico SHALL plotar VP e SP sobrepostos (Tubo U e Forno 2).
2. WHEN a rampa está ativa THEN o Coeficiente de Aquecimento (°C/s) SHALL ser exibido e plotado.
3. WHEN os fornos recebem PWM THEN o gráfico SHALL exibir a VM enviada a cada resistência.
4. WHEN o histórico excede o buffer THEN o gráfico SHALL manter janela rolante ≥ 15 min.

**Independent Test**: alimentar telemetria mockada e verificar séries plotadas.

### P1: Controles manuais e painel de configuração ⭐ MVP

**User Story**: Como operador, quero acionar manualmente atuadores e editar parâmetros com persistência.

**Why P1**: Operação manual e parametrização do método.

**Acceptance Criteria**:

1. WHEN o operador alterna SV1–SV5/bomba em modo Manual THEN o backend SHALL receber o comando (`PUT /api/manual`).
2. WHEN o operador move sliders de VM THEN o backend SHALL receber o PWM manual.
3. WHEN o operador edita T₁/T₂/T₃, rampa, N₂ ou PID e aciona ESCREVER THEN o frontend SHALL chamar `PUT /api/config` e confirmar sucesso.
4. WHEN o operador aciona LER THEN o painel SHALL refletir `GET /api/config`.

**Independent Test**: interagir com a UI e observar chamadas de rede + estado.

### P1: STOP de alta prioridade ⭐ MVP

**User Story**: Como operador, quero parar tudo imediatamente com um único botão.

**Why P1**: Segurança — retorno ao Safe State.

**Acceptance Criteria**:

1. WHEN o operador aciona STOP THEN o frontend SHALL chamar `POST /api/control/emergency` (ou stop) com prioridade e feedback imediato.
2. WHEN o estado retorna a Safe State THEN a UI SHALL refletir em ≤ 250 ms.

**Independent Test**: acionar STOP e verificar comando + estado Safe.

### P2: Alertas e indicadores de status

**User Story**: Como operador, quero ver alertas (falha serial, desvio térmico, erro) em destaque.

**Why P2**: Diagnóstico; não bloqueia MVP.

**Acceptance Criteria**:

1. WHEN `error_code` ≠ 0 ou desvio térmico THEN a UI SHALL exibir alerta visível.
2. WHEN a comunicação cai THEN a UI SHALL indicar desconexão.

---

## Edge Cases

- WHEN o WebSocket desconecta THEN a UI SHALL indicar e tentar reconectar automaticamente.
- WHEN o backend retorna 422 na configuração THEN a UI SHALL mostrar os campos inválidos.
- WHEN múltiplas atualizações chegam no mesmo frame THEN a UI SHALL aplicar a última.

---

## Requirement Traceability

| Requirement ID | Story                            | Phase  | Status  |
| -------------- | -------------------------------- | ------ | ------- |
| IHM-01         | P1: Sinótico animado             | Design | Pending |
| IHM-02         | P1: Gráficos de tendência        | Design | Pending |
| IHM-03         | P1: Controles + configuração     | Design | Pending |
| IHM-04         | P1: STOP alta prioridade         | Design | Pending |
| IHM-05         | P2: Alertas/status               | Design | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped ⚠️

---

## Success Criteria

- [ ] Dashboard completo operável (sinótico + gráficos + controles + STOP).
- [ ] Gráficos atualizam a 4 Hz sem travamento (60 fps de renderização).
- [ ] Visual distinto, coeso e profissional (avaliação de design).
