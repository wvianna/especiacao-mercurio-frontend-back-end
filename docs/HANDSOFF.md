# HANDSOFF — Sistema de Especiação de Mercúrio

Guia de operação e integração do sistema modernizado (RPi + Arduino + IHM Web).

---

## 1. Visão geral

| Componente | Tecnologia          | Pasta    | Porta/comunicação        |
| ---------- | ------------------- | -------- | ------------------------ |
| Backend    | Python + FastAPI    | `backend/` | HTTP/WS na porta **8000** |
| Firmware   | Arduino Uno (C++)   | `firmware/` | USB serial @115200 baud |
| IHM Web    | React + Vite + TS   | `frontend/` | servida pelo backend     |

Topologia mestre-escravo: o RPi (mestre) executa a FSM/PID e envia comandos; o Arduino (escravo/DAQ) executa em tempo real e lê termopares.

---

## 2. Como executar

### Backend + IHM

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
SERIAL_PORT=/dev/ttyUSB0 .venv/bin/python -m app
# IHM em http://<ip-do-rpi>:8000
```

Variáveis de ambiente:

| Variável     | Default        | Descrição                       |
| ------------ | -------------- | ------------------------------- |
| `SERIAL_PORT`| `/dev/ttyUSB0` | Porta serial do Arduino         |
| `HOST`       | `0.0.0.0`      | Interface de escuta             |
| `PORT`       | `8000`         | Porta HTTP/WS                   |

### Firmware

```bash
cd firmware
pio run -e uno          # compila
pio run -e uno -t upload  # grava no Arduino (via USB)
```

---

## 3. Endereçamento de portas seriais

- **Linux/RPi:** identificar com `ls /dev/ttyUSB* /dev/ttyACM*` e `dmesg | grep tty` após conectar o Arduino.
- **USB-UART (CH340/CP210x):** `/dev/ttyUSB0`
- **Arduino nativo (ATMega16U2):** `/dev/ttyACM0`
- Configurar via `SERIAL_PORT` antes de iniciar o backend. Se a porta mudar, o backend tenta reconectar no próximo ciclo (4 Hz).

> **Validação:** `python -m tests.stress_4hz --duration 10` testa o enlace a 4 Hz com simulador via socat.

---

## 4. Mapeamento JSON (RPi ↔ Arduino)

### Handshake de parametrização (RPi → DAQ, no connect)

```json
{
  "cmd": "config",
  "pid_u":  { "kp": 5.0,  "ti": 1.8,  "td": 0.0 },
  "pid_f2": { "kp": 44.67, "ti": 0.18, "td": 0.0 }
}
```

### Escrita (ciclo de controle, 4 Hz)

```json
{
  "valves": { "sv1": 1, "sv2": 0, "sv3": 0, "sv4": 0, "sv5": 1 },
  "pump": 1,
  "pwm": { "u": 128, "f2": 255 }
}
```

> `pwm.u` = VM do Forno 1 (Tubo U); `pwm.f2` = VM do Forno 2 (Atomizador), 0–255.

### Leitura (ciclo de aquisição)

```json
{
  "temp": { "t1": -45.2, "t2": 699.5 },
  "status": "active",
  "error_code": 0
}
```

### Telemetria (Backend → IHM, WebSocket `/ws/telemetry`, 4 Hz)

```json
{
  "ts": 1755388800.250,
  "temp":  { "t1": -45.2, "t2": 699.5 },
  "sp":    { "u": 12.5, "f2": 700.0 },
  "pwm":   { "u": 128,  "f2": 255 },
  "rate_c_per_s": 0.42,
  "state": "T2_RAMPA",
  "valves": { "sv1": 1, "sv2": 0, "sv3": 0, "sv4": 0, "sv5": 1 },
  "pump": 1,
  "error_code": 0
}
```

### Estados possíveis (`state`)

`SAFE` · `T0_DERIV` · `T1_STAB` · `T2_RAMPA` · `T3_PURGA` · `MANUAL`

### Mapeamento de I/O (Arduino Uno)

| Componente            | Pino | Tipo    | Função                        |
| --------------------- | ---- | ------- | ----------------------------- |
| Bomba Peristáltica    | 2    | Digital | Injeção de TEBS               |
| SV3                   | 3    | Digital | Direcionamento Vapor/Tubo U   |
| SV2                   | 4    | Digital | Agitação / Purga 1            |
| SV4                   | 5    | Digital | Purga 2 (Náfion)              |
| SV5 (Pistão)          | 6    | Digital | Copo de N₂                    |
| SV1 (Hélio)           | 7    | Digital | Gás de arraste                |
| CLK (T1/T2)           | 8    | SPI     | Clock                         |
| Forno 1 (Tubo U)      | 9    | PWM     | Rampa de temperatura          |
| Forno 2 (Atomizador)  | 10   | PWM     | Estático 700 °C               |
| S0 (T1/T2)            | 11   | SPI     | MISO                          |
| CS T1 (Tubo U)        | 12   | SPI     | Chip Select termopar 1        |
| CS T2 (Forno 2)       | 13   | SPI     | Chip Select termopar 2        |

---

## 5. Matriz de estados dos atuadores

| Fase | SV1 | SV2 | SV3 | SV4 | SV5 | Bomba |
| ---- | --- | --- | --- | --- | --- | ----- |
| T₀   | 1   | 0   | 0   | 0   | 1   | 1     |
| T₁   | 1   | 0   | 0   | 0   | 1   | 0     |
| T₂   | 1   | 0   | 0   | 0   | 0   | 0     |
| T₃   | 0   | 1   | 1   | 1   | 0   | 0     |
| SAFE | 0   | 0   | 0   | 0   | 0   | 0     |

**Mapeamento de durações** (decisão registrada em `.specs/project/STATE.md`):

| Parâmetro persistido | Fase que dura           |
| -------------------- | ----------------------- |
| `times_s.t1`         | T₀ (derivação/criofocalização) |
| `times_s.t2`         | T₁ (estabilização térmica)     |
| `ramp.time_s`        | T₂ (rampa de temperatura)      |
| `times_s.t3`         | T₃ (purga total)               |

---

## 6. Interpolação da curva de aquecimento (Taxa × % PWM)

Para calcular a VM quando a temperatura do Tubo U está abaixo de 0 °C:

1. **Medir a taxa real do sistema** em bancada: com o Forno 1 em um PWM fixo conhecido, registrar a derivada de temperatura (°C/s) na faixa de interesse.
2. Construir a curva **Taxa de Aquecimento × % PWM** com alguns pontos (ex.: 20%, 50%, 80%) e interpolar linearmente entre os pontos medidos.
3. No código, informar a taxa do sistema via `RampController.set_system_rate(rate)` (calibração).
4. O controle calcula a VM:

$$\text{VM} = \frac{\text{Taxa de Aquecimento}_{\text{usuário}}}{\text{Taxa de Aquecimento}_{\text{sistema}}} \times 255$$

> Quando T ≥ 0 °C, o PID assume a malha fechada seguindo o setpoint dinâmico da rampa até 230 °C. O Coeficiente de Aquecimento (°C/s) exibido na IHM é `(target - N₂) / tempo_de_rampa`.

---

## 7. Persistência de parâmetros

- Arquivo: `backend/data/params.json` (gerado em runtime).
- Escrita **atômica** com backup rotativo em `params.json.bak`.
- Parâmetros: ganhos PID (Tubo U e Forno 2), tempos T₁/T₂/T₃, rampa (tempo, N₂, alvo), setpoint do Forno 2.
- Operação: botões **LER** (recarrega do disco) e **ESCREVER** (persiste) na IHM; a API `PUT /api/config` também valida faixas (422 em valor inválido).

---

## 8. Testes

```bash
# backend (unit + API + E2E + segurança — usa socat para serial virtual)
cd backend && .venv/bin/python -m pytest -q

# firmware (parser + watchdog, host-based) e build para Uno
cd firmware && pio test -e native && pio run -e uno

# frontend
cd frontend && npm test && npm run build

# estresse 4 Hz (simulador via socat)
cd backend && .venv/bin/python -m tests.stress_4hz --duration 3600
```

### Watchdog de segurança

- **Arduino:** sem pacote válido por > 1 s → Safe State (fornos a 0, SV5 baixo).
- **Backend:** sem resposta do DAQ por > 1 s → `EMERGENCY` → Safe State.

---

## 9. Simulação sem hardware

```bash
# cria um par de portas virtuais (socat)
socat -d -d pty,raw,echo=0 pty,raw,echo=0
# use uma das portas no simulador e a outra no backend:
SERIAL_PORT=/dev/pts/X .venv/bin/python -m app
```

O simulador do DAQ vive em `backend/tests/simulator.py` e emula o protocolo JSON.
