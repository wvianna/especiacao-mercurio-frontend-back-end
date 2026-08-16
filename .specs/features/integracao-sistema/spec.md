# Integração e Testes de Sistema Specification

## Problem Statement

Para validar o sistema completo sem depender do hardware físico em todas as iterações, é necessário um simulador do DAQ, testes E2E do ciclo T₀→T₃, teste de segurança (perda de serial → watchdog) e teste de estresse a 4 Hz, além da documentação de handoff (HANDSOFF.md).

## Goals

- [ ] Simulador do DAQ que responde ao protocolo JSON do TDD.
- [ ] Teste E2E do ciclo T₀→T₃ validando a matriz de atuadores.
- [ ] Teste de segurança: perda de serial desliga fornos (watchdog) e backend em Safe State.
- [ ] Teste de estresse 4 Hz por 4 h sem degradação.
- [ ] Documentação de handoff (HANDSOFF.md, mapeamento JSON, endereçamento serial).

## Out of Scope

| Feature              | Reason                       |
| -------------------- | ---------------------------- |
| Calibração física    | Realizada em bancada (manual)|
| Auto-tune            | V2                           |

---

## User Stories

### P1: Simulador do DAQ ⭐ MVP

**User Story**: Como desenvolvedor, quero um simulador que emule o Arduino para testar backend e frontend sem hardware.

**Why P1**: Habilita os testes E2E/estresse.

**Acceptance Criteria**:

1. WHEN o backend envia JSON de escrita THEN o simulador SHALL responder JSON de leitura coerente com as temperaturas.
2. WHEN o simulador recebe handshake `config` THEN ele SHALL aceitar e continuar o ciclo.
3. WHEN o simulador é instruído a falhar THEN ele SHALL parar de responder (para testar watchdog).

**Independent Test**: conectar backend ao simulador e observar o ciclo.

### P1: Teste E2E do ciclo T₀→T₃ ⭐ MVP

**User Story**: Como responsável técnico, quero validar a sequência completa de fases automaticamente.

**Why P1**: Confirma a automação do processo.

**Acceptance Criteria**:

1. WHEN o teste roda o ciclo completo THEN a matriz de atuadores SHALL corresponder ao TDD em cada fase (T₀,T₁,T₂,T₃).
2. WHEN o teste termina THEN o sistema SHALL retornar ao Safe State.

**Independent Test**: executar `pytest -m e2e` e conferir asserts por fase.

### P1: Teste de segurança (perda de serial) ⭐ MVP

**User Story**: Como responsável de segurança, quero provar que a perda de comunicação desliga os fornos.

**Why P1**: Segurança crítica do equipamento.

**Acceptance Criteria**:

1. WHEN a serial é cortada por > 1 s THEN o watchdog SHALL desligar os PWMs (simulado).
2. WHEN a serial é cortada THEN o backend SHALL entrar em Safe State.

**Independent Test**: simular desconexão e verificar estados.

### P2: Teste de estresse 4 Hz (4 h)

**User Story**: Como responsável técnico, quero garantir estabilidade da comunicação por 4 horas.

**Why P2**: Validação de robustez; não bloqueia MVP.

**Acceptance Criteria**:

1. WHEN o teste roda 4 h a 4 Hz THEN a perda de pacotes SHALL ser 0.
2. WHEN o teste termina THEN não SHALL haver vazamento de memória/degradação.

**Independent Test**: script de estresse com contador de pacotes.

### P2: Documentação de handoff

**User Story**: Como operador, quero HANDSOFF.md com interpolação da curva e endereçamento de portas.

**Why P2**: Entrega obrigatória do TDD.

**Acceptance Criteria**:

1. WHEN o operador abre HANDSOFF.md THEN SHALL encontrar mapeamento JSON completo e endereçamento serial.
2. WHEN o operador precisa da interpolação da curva THEN HANDSOFF SHALL descrever o método.

**Independent Test**: revisão do documento.

---

## Edge Cases

- WHEN o simulador recebe JSON inválido THEN ele SHALL ignorar e continuar.
- WHEN o teste de estresse é interrompido THEN o relatório parcial SHALL ser preservado.
- WHEN o watchdog é testado sem hardware THEN o teste SHALL usar o simulador/emulador.

---

## Requirement Traceability

| Requirement ID | Story                      | Phase  | Status  |
| -------------- | -------------------------- | ------ | ------- |
| INT-01         | P1: Simulador do DAQ       | Design | Pending |
| INT-02         | P1: E2E T₀→T₃              | Design | Pending |
| INT-03         | P1: Segurança (serial)     | Design | Pending |
| INT-04         | P2: Estresse 4 Hz          | Design | Pending |
| INT-05         | P2: Documentação handoff   | Design | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped ⚠️

---

## Success Criteria

- [ ] Simulador substitui o hardware em testes E2E/estresse.
- [ ] Ciclo T₀→T₃ validado automaticamente.
- [ ] Watchdog comprovado (fornos desligam em ≤ 1 s).
- [ ] Estresse 4 h sem perda de pacotes.
