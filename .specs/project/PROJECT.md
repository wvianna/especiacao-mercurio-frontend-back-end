# Sistema de Automação para Especiação de Mercúrio

**Vision:** Modernizar o sistema de preparação de amostras para especiação de mercúrio, substituindo o legado (LabVIEW) por uma arquitetura Python + Raspberry Pi + Arduino Uno + IHM Web, com controle rigoroso da rampa de temperatura do Tubo U e do Forno 2.
**For:** Operadores de laboratório e responsável técnico de análises de mercúrio.
**Solves:** Repetibilidade analítica, segurança operacional e rastreabilidade de parâmetros — eliminando erro humano e legado frágil.

## Goals

- Controle linear da rampa de temperatura do Tubo U (−50 °C → 230 °C) com desvio ≤ ±2 °C do setpoint.
- Estabilidade do Forno 2 em 700 °C (±5 °C).
- Comunicação serial RPi↔Arduino a 4 Hz com watchdog (desligamento dos fornos em ≤ 1 s sem pacotes).
- Parâmetros ajustados (ganhos PID, T₁/T₂/T₃, rampa, N₂) persistentes entre execuções.
- IHM Web com sinótico animado, gráficos de tendência (VP×SP, °C/s, PWM) e STOP de alta prioridade.

## Tech Stack

**Core:**

- Backend: Python 3.11+, FastAPI + uvicorn[standard] (HTTP + WebSocket), pyserial, pydantic.
- Firmware: C++ (Arduino Uno), ArduinoJson.
- Frontend: React 18 + TypeScript + Vite, gráficos em canvas customizado.

**Key dependencies:** FastAPI, uvicorn, pyserial, pydantic, ArduinoJson, React, Vite, Vitest.

## Scope

**v1 includes:**

- Firmware DAQ no Arduino (I/O digital, PWM, leitura de termopares via SPI, JSON, watchdog).
- Backend RPi (FSM, PID, rampa, persistência JSON, API REST + WebSocket).
- IHM Web (sinótico, gráficos de tendência, controles manuais, painel de configuração, STOP).
- Integração e testes (simulador, ciclo T₀→T₃, estresse 4 Hz, segurança).
- Documentação (HANDSOFF.md, mapeamento JSON, endereçamento serial).

**Explicitly out of scope:**

- Integração automática com o detector Lumex (apenas indicação de início de leitura).
- Calibração automática de termopares.
- Controle de vazão dos rotâmetros.
- Autenticação multi-usuário (V2).
- Log remoto em nuvem.

## Constraints

- Timeline: ~8 semanas (estimativa do TDD).
- Technical: Loop Rate fixo de 4 Hz (250 ms); watchdog de 1 s no Arduino; termopar tipo K confiável a partir de −50 °C.
- Resources: hardware disponível (RPi, Arduino Uno, termopares SPI, relés de estado sólido); porta serial a mapear antes da integração.
