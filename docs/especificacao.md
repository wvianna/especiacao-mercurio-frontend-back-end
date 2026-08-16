# Especificação Técnica — Sistema de Automação para Especiação de Mercúrio

## Índice

1. [Visão Geral do Projeto e Objetivos Estratégicos](#1-visão-geral-do-projeto-e-objetivos-estratégicos)
2. [Arquitetura de Hardware e Mapeamento de I/O](#2-arquitetura-de-hardware-e-mapeamento-de-io)
3. [Protocolo de Comunicação JSON (Interface RPi-Arduino)](#3-protocolo-de-comunicação-json-interface-rpi-arduino)
4. [Lógica de Controle: Máquina de Estados Finita (FSM)](#4-lógica-de-controle-máquina-de-estados-finita-fsm)
5. [Sequenciamento de Processo e Controle PID](#5-sequenciamento-de-processo-e-controle-pid)
6. [Interface Web de Supervisão (IHM)](#6-interface-web-de-supervisão-ihm)
7. [Plano de Entregáveis, Testes e Handsoff](#7-plano-de-entregáveis-testes-e-handsoff)

## 1. Visão Geral do Projeto e Objetivos Estratégicos

Esta especificação define os requisitos técnicos para a modernização do sistema de preparação de amostras para especiação de mercúrio. O processo analítico exige um controle rigoroso de etapas sequenciais de derivatização, criofocalização (em nitrogênio líquido a $-196^\circ C$) e atomização térmica ($700^\circ C$). A transição de sistemas legados para uma arquitetura baseada em Python e Raspberry Pi visa aumentar a confiabilidade e a precisão da rampa de temperatura no Tubo U, garantindo a correta separação das espécies de mercúrio (Hg$^0$, metilmercúrio, etc.).

O objetivo central é a implementação de um controle lógico mestre (Backend RPi) integrado a uma interface de supervisão (Frontend Web) e a um módulo de aquisição de dados (DAQ Arduino) via protocolo estruturado, assegurando repetibilidade analítica e segurança operacional em ambiente laboratorial.

## 2. Arquitetura de Hardware e Mapeamento de I/O

O sistema utiliza uma topologia mestre-escravo. O Raspberry Pi atua como o processador de alto nível, gerenciando a IHM e a lógica da Máquina de Estados Finita (FSM). O Arduino Uno opera como o DAQ, executando comandos de campo e lendo sensores termopares via interface SPI. Esta escolha técnica provê isolamento entre a lógica de aplicação e a execução de tempo real, otimizando o custo-benefício.

### Mapeamento de I/O (Arduino Uno)

Conforme a análise dos requisitos e esquemáticos (Figuras 14, 22 e Tabela 11), o mapeamento de pinagem é definido abaixo. Note-se a inclusão da válvula SV2 (omitida na Tabela 11 original, mas crítica para a purga conforme Fig. 13), alocada logicamente ao Pino 4.

![Figura 14 - Diagrama de estados das saídas digitais](figura%2014%20-%20diagrama-estados-saidas%20digitais.png)
*Figura 14: Diagrama de estados das saídas digitais.*

![Figura 13 - Diagrama de processo](figura%2013%20-%20diagrama-processo.png)
*Figura 13: Diagrama de processo.*

| Componente | Pino Arduino | Tipo de Sinal | Função no Processo |
| --- | --- | --- | --- |
| Bomba Peristáltica | 2 | Digital | Injeção de solução TEBS |
| SV3 (Válvula 3-vias) | 3 | Digital | Direcionamento Vapor/Tubo U |
| SV2 (Válvula 3-vias) | 4 | Digital | Agitação de Amostra / Purga 1 |
| SV4 (Válvula Solenóide) | 5 | Digital | Entrada de gás para Purga 2 (Náfion) |
| SV5 (Pistão Criogênico) | 6 | Digital | Acionamento do Copo de N$_2$ |
| SV1 (Válvula de Hélio) | 7 | Digital | Entrada de Gás de Arraste ($T_0$, $T_1$, $T_2$) |
| CLK (Sensores T1/T2) | 8 | SPI | Clock da comunicação serial |
| Forno 1 (Tubo U) | 9 | PWM | Controle de Rampa de Temperatura |
| Forno 2 (Atomizador) | 10 | PWM | Controle Estático ($700^\circ C$) |
| S0 (Sensores T1/T2) | 11 | SPI | MISO - Dados dos termopares |
| CS (T1 - Tubo U) | 12 | SPI | Chip Select Termopar 1 |
| CS (T2 - Forno 2) | 13 | SPI | Chip Select Termopar 2 |

![Tabela 11 - Pinagem Arduino Uno](tabela%2011%20-%20pinagem%20arduino%20uno.png)
*Tabela 11: Pinagem Arduino Uno.*

## 3. Protocolo de Comunicação JSON (Interface RPi-Arduino)

Para garantir a robustez e a facilidade de depuração, a comunicação USB/Serial opera com pacotes JSON a uma frequência de varredura (Loop Rate) de 4 Hz.

### Handshake de Parametrização (RPi -> DAQ)

Enviado no início da execução para configurar os ganhos fixos:

```json
{
  "cmd": "config",
  "pid_u": {"kp": 5.0, "ti": 1.8, "td": 0.0},
  "pid_f2": {"kp": 44.67, "ti": 0.18, "td": 0.0}
}
```

### JSON de Escrita (Ciclo de Controle)

```json
{
  "valves": {"sv1": 1, "sv2": 0, "sv3": 0, "sv4": 0, "sv5": 1},
  "pump": 1,
  "pwm": {"u": 128, "f2": 255}
}
```

### JSON de Leitura (Ciclo de Aquisição)

```json
{
  "temp": {"t1": -45.2, "t2": 699.5},
  "status": "active",
  "error_code": 0
}
```

## 4. Lógica de Controle: Máquina de Estados Finita (FSM)

A execução do software segue a estrutura da Figura 28, garantindo transições seguras entre as fases químicas:

![Figura 28 - Máquina de estados modelo](figura%2028%20-%20maquina%20de%20estados%20modelo.png)
*Figura 28: Máquina de estados modelo.*

1. **Início (Safe State):** Todas as saídas (SV1-SV5, Bomba, PWMs) são forçadas a zero. O pistão (SV5) é mantido em estado baixo por segurança.
2. **Leitura/Escrita DAQ:** Troca de pacotes JSON a cada 250ms (4Hz).
3. **Event:** Listener de comandos (Iniciar, Parar, STOP, Manual).
4. **Controle (Tubo e Forno):** Execução simultânea das malhas PID. No Tubo U, a rampa é gerenciada dinamicamente.
5. **Manual:** Override total dos atuadores para manutenção.
6. **Parametrização:** Persistência de setpoints e tempos $T_1$, $T_2$, $T_3$ em disco.
7. **STOP / Emergência:** Estado crítico onde SV5 é desativado (abaixando o copo) e todos os aquecedores são desligados para evitar o congelamento permanente do tubo U ou sobreaquecimento.

## 5. Sequenciamento de Processo e Controle PID

### Matriz de Estados dos Atuadores

A sequência lógica obedece rigorosamente aos intervalos de tempo definidos:

| Fase | Descrição | SV1 | SV2 | SV3 | SV4 | SV5 | Bomba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $T_0$ | Derivação / Criofocalização | 1 | 0 | 0 | 0 | 1 | 1 |
| $T_1$ | Estabilização Térmica | 1 | 0 | 0 | 0 | 1 | 0 |
| $T_2$ | Rampa de Aquecimento / Purga | 1 | 0 | 0 | 0 | 0 | 0 |
| $T_3$ | Purga Total / Limpeza | 0 | 1 | 1 | 1 | 0 | 0 |

### Estratégia de Controle PID e Rampa

O sistema utiliza um PID Misto para o Forno 2 (setpoint fixo de $700^\circ C$). Para o Forno 1 (Tubo U), a lógica deve tratar a limitação física do sensor:

- **Piso de Leitura:** Embora o nitrogênio esteja a $-196^\circ C$, o termopar K reporta leituras confiáveis apenas a partir de $-50^\circ C$.
- **Cálculo da VM (Variável Manipulada):**
  - Se $T_{inicial} < 0^\circ C$: O percentual de PWM é calculado pela razão:
    $$\text{PWM} = \frac{\text{Taxa de Aquecimento}_{usuário}}{\text{Taxa de Aquecimento}_{sistema}}$$
  - Se $T \ge 0^\circ C$: O PID assume o controle em malha fechada para manter a linearidade da rampa até $230^\circ C$.
- **Taxa de Aquecimento:** Deve ser calculada e exibida em $^\circ C/s$ com base no tempo de rampa inserido pelo usuário.

## 6. Interface Web de Supervisão (IHM)

A IHM deve refletir o dashboard da Figura 25, focada na redução de erro humano:

![Figura 25 - Interface de supervisão](figura%2025%20-%20interface%20de%20supervisao.png)
*Figura 25: Interface de supervisão.*

- **Sinótico do Processo:** Fluxograma animado com indicação visual de fluxo (azul para hélio/vapor, vermelho para resistências ativas).
- **Monitoramento Térmico:** Gráficos de VP (Variável de Processo) vs. SP (Setpoint). Exibição obrigatória do Coeficiente de Aquecimento ($^\circ C/s$) calculado.
- **Controles Manuais:** Matriz de botões para SV1-SV5 e Bomba, além de sliders para VM manual.
- **Painel de Configuração:** Entradas para $T_1$, $T_2$, $T_3$, Tempo de Rampa e Temperatura do Nitrogênio.
- **Botão STOP:** Comando de alta prioridade com retorno imediato ao Safe State.

## 7. Plano de Entregáveis, Testes e Handsoff

### Requisitos de Entrega

1. **Repositório Estruturado:** /backend (Python/FSM), /frontend (Web UI), /firmware (Arduino/C++), /docs.
2. **Documentação de Interface:** Mapeamento completo dos campos JSON.
3. **HANDSOFF.md:** Guia de interpolação da curva de aquecimento e endereçamento de portas seriais.

### Plano de Testes

- **Unitário:** Validação do parser JSON no Arduino e cálculo da rampa no Python.
- **Integrado:** Teste de estresse da comunicação a 4Hz por 4 horas.
- **Funcional:** Execução completa do ciclo $T_0 \to T_3$ monitorando os estados da Matriz de Atuadores.
- **Segurança:** Simulação de perda de comunicação serial; o Arduino deve desligar os fornos (Watchdog) caso não receba pacotes por mais de 1 segundo.
