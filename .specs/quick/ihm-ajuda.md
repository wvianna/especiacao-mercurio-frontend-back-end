# Quick — Ajuda da IHM (botão no cabeçalho)

**Data**: 2026-09-18 · **Fluxo**: quick (mudança pequena, risco baixo) · **Feature**: ihm-web

## Requisitos

- **FR-01**: o cabeçalho da IHM SHALL exibir um botão de ajuda (acessível por teclado) nos modos MONITOR e CONFIG, sem deslocar ou esconder o STOP.
- **FR-02**: o botão SHALL abrir uma interface com instruções de funcionamento do processo (pt-BR), a **figura 11** (`docs/figura 11 - diagrama-processo.png`, embarcada localmente em `frontend/src/assets/` — sem CDN, pois o ambiente pode estar offline) e o link do repositório `https://github.com/wvianna/especiacao-mercurio-frontend-backend-firmware` (nova aba).

## Critérios de aceite

- **CA-01** botão visível com `aria-label` e tooltip; STOP preservado.
- **CA-02** conteúdo com visão geral, ciclo T₀→T₃, controle do Tubo U (PWM fixo ≤ 0 °C / PID > 0 °C), operação e segurança; figura 11 com `alt` descritivo; link com `target="_blank"` e `rel="noopener noreferrer"`.
- **CA-03** fecha pelo botão ✕, Esc e clique no fundo; foco retorna ao botão de ajuda.
- **CA-04** legível nos temas escuro e claro; asset local (sem CDN).
- **CA-05** sem regressão: `npm run build` e `npm test` verdes.

## Evidência (HOST)

- `cd frontend && npm test` — inclui os testes do `HelpDialog` (abertura, alt da figura, link, fechamentos).
- `cd frontend && npm run build` — tsc + vite limpos.
