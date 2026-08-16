# Firmware DAQ (Arduino) Specification

## Problem Statement

O Arduino Uno atua como DAQ em tempo real, isolando a execução de campo (válvulas, bomba, fornos, termopares) da lógica de aplicação no RPi. Ele precisa aplicar comandos recebidos via JSON, reportar temperaturas lidas por termopares SPI e desligar os fornos sozinho se a comunicação cair.

## Goals

- [ ] Aplicar o estado de 6 saídas digitais (SV1–SV5, bomba) e 2 PWMs (fornos) a partir de um JSON de escrita.
- [ ] Ler dois termopares via SPI e responder um JSON de leitura a 4 Hz.
- [ ] Aceitar handshake de configuração (ganhos PID) sem alterar o comportamento do ciclo.
- [ ] Watchdog: desligar fornos e retornar ao Safe State se não houver pacotes por > 1 s.

## Out of Scope

| Feature                    | Reason                                   |
| -------------------------- | ---------------------------------------- |
| Lógica PID no Arduino      | Pertence ao backend RPi                  |
| Controle de vazão          | Rotâmetros manuais                       |
| Persistência de parâmetros | Pertence ao backend RPi                  |

---

## User Stories

### P1: Aplicar saídas e PWMs via JSON ⭐ MVP

**User Story**: Como backend RPi, quero enviar um JSON de escrita para que o Arduino acione válvulas, bomba e PWMs dos fornos.

**Why P1**: Sem isso não há atuação no processo.

**Acceptance Criteria**:

1. WHEN o Arduino recebe `{"valves": {...}, "pump": N, "pwm": {"u": N, "f2": N}}` THEN ele SHALL acionar os pinos correspondentes (mapa de I/O do TDD).
2. WHEN um campo é omitido ou inválido THEN o Arduino SHALL ignorar o pacote e reportar `error_code` adequado.
3. WHEN `pwm.u` ou `pwm.f2` excede 255 THEN o Arduino SHALL saturar em 255.

**Independent Test**: enviar JSON pela serial e medir os níveis dos pinos com multímetro/led.

### P1: Ler termopares e responder JSON ⭐ MVP

**User Story**: Como backend RPi, quero receber `{"temp": {"t1": X, "t2": Y}, ...}` a 4 Hz para controlar os fornos.

**Why P1**: Realimentação do controle.

**Acceptance Criteria**:

1. WHEN o Arduino lê os dois termopares SPI THEN ele SHALL incluir `t1` (Tubo U) e `t2` (Forno 2) em °C no JSON de leitura.
2. WHEN a leitura falha (erro SPI / termopar aberto) THEN o Arduino SHALL reportar `error_code` de leitura e manter a última temperatura válida.

**Independent Test**: conectar termopares e observar valores no monitor serial.

### P1: Watchdog de segurança ⭐ MVP

**User Story**: Como responsável de segurança, quero que o Arduino desligue os fornos sozinho se parar de receber pacotes.

**Why P1**: Evita sobreaquecimento/congelamento em caso de falha do RPi.

**Acceptance Criteria**:

1. WHEN o Arduino não recebe nenhum pacote válido por mais de 1000 ms THEN ele SHALL desligar os dois PWMs e acionar o Safe State.
2. WHEN a comunicação é restabelecida THEN o Arduino SHALL voltar a aplicar os comandos recebidos.

**Independent Test**: desconectar o cabo serial durante operação e observar os fornos desligarem em ≤ 1 s.

### P2: Reportar estado e erro

**User Story**: Como operador, quero ver `status` e `error_code` para diagnosticar o DAQ.

**Why P2**: Facilita diagnóstico; não bloqueia o MVP.

**Acceptance Criteria**:

1. WHEN o ciclo está ativo THEN `status` SHALL ser `"active"`.
2. WHEN ocorre erro (SPI, parser, watchdog) THEN `error_code` SHALL ser não-nulo e estável até a recuperação.

---

## Edge Cases

- WHEN o pacote JSON chega truncado/corrompido THEN o Arduino SHALL descartar e aguardar o próximo pacote.
- WHEN o watchdog dispara no meio de T₂ (rampa) THEN o Arduino SHALL priorizar o desligamento dos fornos sobre qualquer estado anterior.
- WHEN dois pacotes chegam no mesmo ciclo de 250 ms THEN o último SHALL prevalecer.

---

## Requirement Traceability

| Requirement ID | Story                     | Phase  | Status  |
| -------------- | ------------------------- | ------ | ------- |
| DAQ-01         | P1: Aplicar saídas/PWMs   | Design | Pending |
| DAQ-02         | P1: Ler termopares        | Design | Pending |
| DAQ-03         | P1: Watchdog              | Design | Pending |
| DAQ-04         | P2: Estado e erro         | Design | Pending |
| DAQ-05         | P1: Handshake de config   | Design | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped ⚠️

---

## Success Criteria

- [ ] JSON de escrita refletido nos pinos em < 250 ms.
- [ ] JSON de leitura emitido a 4 Hz com temperaturas coerentes.
- [ ] Fornos desligados em ≤ 1 s sem pacotes (teste de segurança).
