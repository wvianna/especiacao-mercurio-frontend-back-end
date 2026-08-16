# Backend de Controle (RPi) Specification

## Problem Statement

O backend no Raspberry Pi concentra a inteligência do sistema: Máquina de Estados Finita (FSM), controle PID/rampa dos fornos, persistência de parâmetros e a interface (API + WebSocket) que alimenta a IHM e dialoga com o DAQ a 4 Hz.

## Goals

- [ ] Enlace serial 4 Hz com o Arduino (JSON de escrita/leitura) com reconexão automática.
- [ ] FSM com Safe State, ciclo T₀→T₃ e STOP/emergência.
- [ ] PID do Forno 2 (setpoint 700 °C) e rampa do Forno 1 (estratégia mista) com cálculo de °C/s.
- [ ] Persistência atômica de parâmetros (JSON em disco) com LER/ESCREVER.
- [ ] API REST (config/control/manual) e WebSocket de telemetria (4 Hz).

## Out of Scope

| Feature                 | Reason                       |
| ----------------------- | ---------------------------- |
| Lógica de I/O em hardware | Pertence ao firmware DAQ     |
| Renderização da IHM     | Pertence ao frontend         |
| Auto-tune de PID        | V2                           |

---

## User Stories

### P1: Persistência de parâmetros ⭐ MVP

**User Story**: Como operador, quero que os parâmetros ajustados (ganhos PID, T₁/T₂/T₃, rampa, N₂) sejam gravados em disco e lidos na inicialização.

**Why P1**: Repetibilidade analítica e rastreabilidade — requisito explícito do TDD.

**Acceptance Criteria**:

1. WHEN o backend inicializa THEN ele SHALL carregar o JSON de parâmetros; se ausente, usar defaults do TDD.
2. WHEN a API recebe `PUT /api/config` válido THEN o backend SHALL validar faixas e gravar atomicamente (backup rotativo do anterior).
3. WHEN a gravação falha THEN o backend SHALL manter o arquivo anterior íntegro e retornar erro.
4. WHEN o operador aciona LER THEN a IHM SHALL refletir os valores persistidos.

**Independent Test**: gravar, reiniciar o processo e confirmar leitura idêntica via `GET /api/config`.

### P1: Enlace serial 4 Hz ⭐ MVP

**User Story**: Como backend, quero trocar JSON com o Arduino a 4 Hz para comandar e supervisionar o DAQ.

**Why P1**: Base de todo o controle.

**Acceptance Criteria**:

1. WHEN a porta serial abre THEN o backend SHALL enviar o handshake `config` com os ganhos PID.
2. WHEN a cada 250 ms THEN o backend SHALL enviar JSON de escrita e consumir JSON de leitura.
3. WHEN a serial falha THEN o backend SHALL entrar em Safe State, tentar reconectar e alertar a IHM.

**Independent Test**: com simulador, verificar 4 pacotes/s e reconexão após desconectar.

### P1: FSM + sequenciamento T₀→T₃ ⭐ MVP

**User Story**: Como operador, quero acionar INICIAR para que o processo execute a matriz de atuadores T₀→T₃ automaticamente.

**Why P1**: Automação do processo.

**Acceptance Criteria**:

1. WHEN `POST /api/control/start` THEN a FSM SHALL partir de Safe State e percorrer T₀→T₁→T₂→T₃ conforme a Matriz de Atuadores do TDD.
2. WHEN `POST /api/control/stop` THEN a FSM SHALL retornar ao Safe State (SV5 desce, fornos desligados).
3. WHEN `POST /api/control/emergency` THEN a FSM SHALL retornar imediatamente ao Safe State de qualquer estado.

**Independent Test**: com simulador, validar a matriz em cada fase.

### P1: Controle PID e rampa ⭐ MVP

**User Story**: Como operador, quero que os fornos sigam seus setpoints (rampa no Tubo U, 700 °C no Forno 2) com cálculo de °C/s.

**Why P1**: Separação correta das espécies de mercúrio.

**Acceptance Criteria**:

1. WHEN T < 0 °C no Tubo U THEN a VM SHALL ser `Taxa usuário / Taxa sistema`.
2. WHEN T ≥ 0 °C no Tubo U THEN o PID SHALL manter a linearidade da rampa até 230 °C.
3. WHEN o Forno 2 opera THEN o PID SHALL manter 700 °C.
4. WHEN a rampa está ativa THEN o backend SHALL calcular e expor o Coeficiente de Aquecimento (°C/s).

**Independent Test**: com simulador de temperatura, verificar VM e °C/s.

### P1: API + WebSocket de telemetria ⭐ MVP

**User Story**: Como IHM, quero consumir config/control/manual via REST e telemetria em tempo real via WebSocket.

**Why P1**: Interface com o frontend.

**Acceptance Criteria**:

1. WHEN `GET /api/config` THEN SHALL retornar os parâmetros persistidos.
2. WHEN `/ws/telemetry` conecta THEN o backend SHALL enviar o payload de telemetria do TDD a 4 Hz.
3. WHEN `PUT /api/manual` THEN o backend SHALL aplicar override manual de atuadores/PWM.

**Independent Test**: consumir endpoints e WS com cliente de teste.

### P2: Log estruturado

**User Story**: Como responsável técnico, quero logs JSON das transições e do ciclo para auditoria.

**Why P2**: Diagnóstico; não bloqueia MVP.

**Acceptance Criteria**:

1. WHEN a FSM transita de estado THEN o backend SHALL registrar a transição em log JSON.
2. WHEN a serial falha THEN o backend SHALL registrar erro com timestamp.

---

## Edge Cases

- WHEN o arquivo de parâmetros está corrompido THEN o backend SHALL restaurar backup e alertar.
- WHEN a serial desconecta durante T₂ (rampa) THEN o backend SHALL entrar em Safe State.
- WHEN o termopar reporta erro de leitura THEN o controle SHALL manter o último valor válido e sinalizar.
- WHEN parâmetros fora de faixa chegam via API THEN o backend SHALL rejeitar com 422.

---

## Requirement Traceability

| Requirement ID | Story                  | Phase  | Status  |
| -------------- | ---------------------- | ------ | ------- |
| BEC-01         | P1: Persistência       | Design | Pending |
| BEC-02         | P1: Enlace serial      | Design | Pending |
| BEC-03         | P1: FSM/sequenciamento | Design | Pending |
| BEC-04         | P1: PID e rampa        | Design | Pending |
| BEC-05         | P1: API + WebSocket    | Design | Pending |
| BEC-06         | P2: Log estruturado    | Design | Pending |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped ⚠️

---

## Success Criteria

- [ ] Parâmetros persistidos sobrevivem a reinício (teste funcional).
- [ ] Ciclo T₀→T₃ respeita a matriz de atuadores (teste E2E).
- [ ] Telemetria em 4 Hz com VP/SP/VM/°C/s (teste integrado).
- [ ] Serial com reconexão e Safe State (teste de segurança).
