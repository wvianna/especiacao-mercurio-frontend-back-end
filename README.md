# ESPECIAÇÃO DE MERCÚRIO — Automação e IHM

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](#arquitetura)
[![Firmware](https://img.shields.io/badge/firmware-Arduino_Uno-00979D)](#firmware)
[![Frontend](https://img.shields.io/badge/frontend-React%2BTS-61DAFB)](#ihm)

Sistema de automação e supervisão para **preparação de amostras em especiação de mercúrio**: controle do acionamento das válvulas, bomba e aquecedores, e controle da rampa de temperatura do Tubo U (−190 → 230 °C) e do Forno 2 (700 °C), com Raspberry Pi (Python), Arduino Uno (DAQ em tempo real) e IHM Web.

> [!NOTE]
> Este projeto moderniza um sistema legado (LabVIEW) e é guiado pelas especificações em [`docs/especificacao.md`](docs/especificacao.md) e [`docs/requisitos.md`](docs/requisitos.md).

## Funcionalidades

- 🔁 **Ciclo automático T₀ → T₃** com Máquina de Estados Finita (derivação, criofocalização, rampa e purga) e **Diagrama de Tempos** (Gantt) com set-point × progresso real.
- 🌡️ **Controle PID misto**: rampa dinâmica no Tubo U (PWM fixo persistido com T ≤ 0 °C — sem leitura do termopar —, PID acima) e setpoint fixo de 700 °C no Forno 2.
- 🖥️ **IHM Web em tempo real (4 Hz)** com dois modos — **MONITOR** (Diagrama de Tempos, progresso da etapa, atuadores e gráficos por forno) e **CONFIG** (set-points persistentes).
- 🔧 **Modo manual** com o painel unificado **"Controles e Atuadores"** (válvulas SV1–SV5, bomba e sliders de VM dos fornos).
- 💾 **Persistência de parâmetros** (ganhos PID, tempos, rampa, setpoints) em JSON com backup rotativo.
- 🛡️ **Segurança**: watchdog no Arduino (desliga fornos em ≤ 1 s sem pacotes), interlock da matriz de acionamento e botão STOP de alta prioridade.
- 🔄 **Bomba por pulso (toggle)**: o firmware gera um pulso de 600 ms nas transições liga/desliga da bomba peristáltica.

## Arquitetura

Topologia mestre-escravo: o **Raspberry Pi** executa a lógica de alto nível (FSM, PID, persistência e IHM); o **Arduino Uno** opera como DAQ em tempo real (I/O, PWM e leitura de termopares via SPI), isolando a execução de campo da aplicação.

```mermaid
graph LR
    F[IHM Web<br/>React] -->|HTTP/WebSocket| B[Backend RPi<br/>Python + FastAPI]
    B -->|JSON em disco| S[(params.json)]
    B <-->|USB Serial JSON @4Hz| D[DAQ Arduino<br/>C++]
    D --> P[Processo<br/>Válvulas/Bomba/Fornos/Termopares]
```

| Componente | Tecnologia | Pasta | Comunicação |
| ---------- | ---------- | ----- | ----------- |
| Backend    | Python 3.11+ · FastAPI · pyserial | `backend/` | HTTP/WS :8000 |
| Firmware   | C++ · ArduinoJson · PlatformIO | `firmware/` | USB serial 115200 baud |
| IHM Web    | React 18 · Vite · TypeScript | `frontend/` | servida pelo backend |

### Portas TCP em uso

```mermaid
flowchart LR
    subgraph EXT["Cliente"]
        BROWSER["Navegador com a IHM Web<br/>http://IP-do-Raspberry:8000"]
    end

    subgraph RPI["Raspberry Pi"]
        subgraph P8000["Porta TCP 8000 — Backend FastAPI (uvicorn)"]
            R_DIST["/ — IHM compilada (frontend/dist)"]
            R_API["/api/* — HTTP"]
            R_WS["/ws/telemetry — WebSocket"]
        end
        subgraph P5173["Porta TCP 5173 — Vite dev (somente com --dev)"]
            R_DEV["IHM em desenvolvimento<br/>bind: localhost"]
        end
    end

    R_DAQ["DAQ Arduino Uno<br/>/dev/ttyUSB0 a 115200 baud (serial, não TCP)"]

    BROWSER -->|"HTTP 8000"| R_DIST
    BROWSER -->|"HTTP 8000"| R_API
    BROWSER <-->|"WebSocket 8000"| R_WS
    R_DEV -->|"API/WS em localhost:8000"| P8000
    P8000 ==>|"USB serial"| R_DAQ
```

| Porta TCP | Serviço | Escuta em | Endpoints | Quando existe |
| --------- | ------- | --------- | --------- | ------------- |
| **8000** | Backend FastAPI (uvicorn) | `0.0.0.0` — todas as interfaces | `/` (IHM compilada), `/api/*` (HTTP), `/ws/telemetry` (WebSocket) | Sempre (`PORT=<n> ./scripts/start.sh` altera) |
| **5173** | Vite dev server | `localhost` — apenas a própria máquina | página da IHM em desenvolvimento | Somente com `./scripts/start.sh --dev` |
| — | Enlace serial do DAQ | `/dev/ttyUSB0` a 115200 baud | JSON de uma linha por ciclo (4 Hz) | Sempre — **não é TCP** |

- Em produção (sem `--dev`) apenas a porta **8000** fica aberta: a IHM é servida na mesma origem da API e do WebSocket.
- No modo `--dev`, a página em **:5173** consome a API em `http://localhost:8000` (padrão de `VITE_API_BASE`); para acesso remoto use a IHM compilada em **:8000** ou defina `VITE_API_BASE`.

## Pré-requisitos

- Python 3.11+
- Node.js 18+ e npm
- PlatformIO Core (`pip install platformio` ou [site oficial](https://platformio.org/install/cli))
- `socat` (opcional — usado nos testes E2E sem hardware)

## Instalação

```bash
git clone <url-do-repositorio>
cd especiacao-mercurio-ihm

# Backend (venv + dependências)
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cd ..

# Frontend (dependências + build da IHM)
cd frontend
npm install
npm run build
cd ..
```

## Execução

### Início rápido (servidor único)

```bash
./scripts/start.sh              # backend + IHM em http://localhost:8000
./scripts/start.sh --dev        # + servidor de desenvolvimento do frontend (:5173)
./scripts/stop.sh               # encerra os serviços
```

> [!TIP]
> Configure a porta serial do Arduino antes de iniciar: `SERIAL_PORT=/dev/ttyACM0 ./scripts/start.sh`

> [!NOTE]
> Em um clone novo o `start.sh` prepara o que faltar: venv/dependências do backend e
> `npm ci` no frontend; sem `--dev` ele também compila a IHM (`frontend/dist`).
> A seção [Instalação](#instalação) continua sendo o caminho recomendado.

### Serviço systemd (início automático no boot)

O modelo de unidade está em [`scripts/systemd/especiacao-mercurio-ihm.service.template`](scripts/systemd/especiacao-mercurio-ihm.service.template): um serviço `Type=forking` que executa `scripts/start.sh` / `scripts/stop.sh` e acompanha o PID registrado em `logs/backend.pid`.

**1. Conclua a seção [Instalação](#instalação) uma única vez** — o serviço não deve precisar de rede ou `npm` durante o boot.

**2. Instale a unidade** (raiz e usuário já preenchidos: `/home/dietpi/especiacao-mercurio-frontend-back-end` · `dietpi`):

```bash
sudo cp scripts/systemd/especiacao-mercurio-ihm.service.template \
        /etc/systemd/system/especiacao-mercurio-ihm.service
# outra raiz/usuário: ajuste User=, Group=, WorkingDirectory=, Exec* e PIDFile=
sudo systemctl daemon-reload
```

**3. Habilite e inicie** (o `ExecStartPre` da unidade encerra uma instância manual de `./scripts/start.sh`, se houver):

```bash
sudo systemctl enable --now especiacao-mercurio-ihm
```

| Ação | Comando |
| ---- | ------- |
| Estado e PID do backend | `systemctl status especiacao-mercurio-ihm` |
| Iniciar · parar · reiniciar | `sudo systemctl {start,stop,restart} especiacao-mercurio-ihm` |
| Logs do serviço (journal) | `journalctl -u especiacao-mercurio-ihm -f` |
| Logs do backend (arquivo) | `tail -f logs/backend.log` |
| Desinstalar | `sudo systemctl disable --now especiacao-mercurio-ihm && sudo rm /etc/systemd/system/especiacao-mercurio-ihm.service` |

**Personalização** — use um *drop-in* (não edite a cópia instalada em `/etc/systemd/system/`):

```bash
sudo systemctl edit especiacao-mercurio-ihm
```

```ini
[Service]
Environment=SERIAL_PORT=/dev/ttyACM0
Environment=PORT=8000
```

> [!IMPORTANT]
> O serviço roda como o usuário dono do repositório com `SupplementaryGroups=dialout` — exigido para acessar `/dev/ttyUSB0` e `/dev/ttyACM0`. Alternativamente, defina as variáveis em `/etc/default/especiacao-mercurio-ihm` (`SERIAL_PORT=…`, `PORT=…`, `HOST=…`), lido pela unidade como `EnvironmentFile` opcional.

> [!TIP]
> Para subir também o servidor de desenvolvimento do Vite junto ao serviço, crie um *drop-in* com `ExecStart=` (linha vazia, que limpa o valor anterior) seguido de `ExecStart=<caminho-do-repo>/scripts/start.sh --dev`.

### Configuração

| Variável | Padrão | Descrição |
| -------- | ------ | --------- |
| `SERIAL_PORT` | `/dev/ttyUSB0` | Porta serial do Arduino |
| `PORT` | `8000` | Porta HTTP/WS do backend |
| `HOST` | `0.0.0.0` | Interface de escuta |

## IHM — Uso

![IHM Web — Especiação de Mercúrio](imagens/frontendweb.png)

*Painel de monitoramento (modo MONITOR): Diagrama de Tempos, progresso da etapa, Controles e Atuadores e gráficos de tendência por forno.*

1. **MONITOR / CONFIG**: alternância no cabeçalho. **MONITOR** exibe o painel de acompanhamento do processo; **CONFIG** foca a parametrização.
2. **Modo AUTO / MANUAL**: em **MANUAL**, o painel "Controles e Atuadores" habilita o acionamento direto (válvulas, bomba e sliders de VM); em **AUTO**, vira apenas status (somente leitura).
3. **INICIAR**: executa o ciclo automático T₀ → T₃ — a etapa em execução pisca à direita da barra de status. **PARAR** encerra com retorno ao *Safe State*.
4. **STOP**: parada de emergência de alta prioridade.
5. **Diagrama de Tempos**: faixas T₀–T₃ com set-points, matriz de atuadores e LED de status por dispositivo (vermelho = ligado, cinza = desligado).
6. **Gráficos de Tendência**: um painel por forno com temperatura/setpoint (°C, eixo esquerdo) e PWM (%, eixo direito).
7. **Configuração do Método** (modo CONFIG): edite tempos T₁/T₂/T₃, rampa (incl. PWM fixo ≤ 0 °C), temperatura do N₂ e ganhos PID; use **LER** e **SALVAR CONFIGURAÇÕES** (persiste em disco).

## Firmware

```bash
./scripts/firmware.sh build    # compila para Arduino Uno
./scripts/firmware.sh upload   # compila e grava via USB
```

## Testes

```bash
./scripts/test.sh all           # backend + frontend + firmware
./scripts/test.sh backend       # pytest (unit + integração + E2E com simulador)
./scripts/test.sh frontend      # vitest
./scripts/test.sh firmware      # PlatformIO (host-based)
```

> [!NOTE]
> Os testes E2E usam `socat` para criar uma serial virtual e o simulador em `backend/tests/simulator.py` — não exigem hardware físico.

## API

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| GET | `/api/config` | Parâmetros persistidos |
| PUT | `/api/config` | Valida e persiste parâmetros |
| POST | `/api/control/start` | Inicia o ciclo automático |
| POST | `/api/control/stop` | Para o processo (Safe State) |
| POST | `/api/control/emergency` | STOP de alta prioridade |
| PUT | `/api/control/mode` | `{ "mode": "auto" \| "manual" }` |
| PUT | `/api/manual` | Override manual de atuadores |
| WS | `/ws/telemetry` | Telemetria em tempo real (4 Hz) |

## Estrutura do projeto

```
├── backend/        # Python + FastAPI (FSM, PID, persistência, API + WebSocket)
├── firmware/       # Arduino Uno (PlatformIO): I/O, PWM, termopares SPI, watchdog
├── frontend/       # React + Vite + TS: Diagrama de Tempos, atuadores, gráficos por forno e configuração
├── scripts/        # start.sh · stop.sh · firmware.sh · test.sh · systemd/ (unidade de serviço)
├── docs/           # Especificação, requisitos, HANDSOFF e TDD
└── .specs/         # Planejamento Spec-Driven (spec/design/tasks por feature)
```

## Documentação

- **[HANDSOFF](docs/HANDSOFF.md)** — guia de operação, arquitetura e integração para dar continuidade ao projeto.
- **[TDD](docs/TDD.md)** — documento de design técnico.
- **[Especificação](docs/especificacao.md)** e **[Requisitos](docs/requisitos.md)** — base do processo analítico.
- **[.specs](.specs/)** — planejamento Spec-Driven com specs, designs e tasks por feature.
- **[Estatísticas](docs/estatisticas.md)** — contagem de linhas de código e documentação por área.

## Autoria

- William da Silva Vianna
- Renato Gomes Sobral Barcellos
------

Desenvolvido com auxílio do TDD (Test-Driven Development) e Spec-Driven Development (SDD) para garantir rastreabilidade entre requisitos, design, implementação e testes.

Implementação baseada em [especificações](.specs/) e [requisitos](docs/requisitos.md) do sistema de automação para especiação de mercúrio.

Execução da implementação com auxílio dos modelos de inteligência artificial DeepSeek V4 Flash e Pro.

------
Se gostou deixe um like ⭐ no repositório e compartilhe com colegas de laboratório.
Se não gostou também deixe um like ⭐ e abra uma issue com sugestões de melhoria.
------
