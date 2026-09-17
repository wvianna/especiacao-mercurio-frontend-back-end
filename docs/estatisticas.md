# Estatísticas do repositório

> **Medição:** 2026-09-17 · base `53d0e63`, working tree com alterações não commitadas. Inclui este documento.
> Comando de reprodução no fim do documento.

## Metodologia

- Contagem por `wc -l` (linhas terminadas por `\n`); a última linha de um arquivo sem newline final não é contada.
- **Excluídos:** `node_modules/`, `.venv/`, `dist/`, `build/`, `.pio/`, `__pycache__/`, `.vite/`, `.pytest_cache/`, `logs/`, `package-lock.json` e artefatos LaTeX (`*.aux`, `*.bbl`, `*.blg`, `*.toc`, `*.pdf`… — do LaTeX contam apenas `.tex` e `.bib`).
- Não incluem arquivos de configuração (JSON/TOML/INI) nem lockfiles; `frontend/index.html` e `frontend/vite.config.ts` entram por serem `.html`/`.ts`.

## Código

### Frontend — React + Vite + TypeScript (`frontend/`)

| Tipo | Arquivos | Linhas |
| ---- | -------- | ------ |
| `*.ts` | 15 | 614 |
| `*.tsx` | 10 | 1.043 |
| `*.css` | 1 | 1.537 |
| `*.html` | 1 | 12 |
| **Total** | **27** | **3.206** |

> Dos quais testes (`*.test.*` / `*.spec.*` em `frontend/src`): **205 linhas** em 4 arquivos.

### Backend — Python + FastAPI (`backend/`)

| Área | Arquivos | Linhas |
| ---- | -------- | ------ |
| Aplicação (`backend/app/`) | 13 | 888 |
| Testes (`backend/tests/`) | 11 | 786 |
| **Total** | **24** | **1.674** |

### Firmware — Arduino Uno / PlatformIO (`firmware/`)

| Área | Arquivos | Linhas |
| ---- | -------- | ------ |
| Headers (`*.h`) | 6 | 199 |
| Implementação (`*.cpp`) | 6 | 432 |
| Sketch (`*.ino`) | 1 | 68 |
| **Total** | **13** | **699** |

> Dos quais testes de host (`firmware/test/`): **206 linhas** em 1 arquivo.

### Scripts — shell

| Arquivo | Linhas |
| ------- | ------ |
| `scripts/daq.sh` | 141 |
| `scripts/start.sh` | 56 |
| `scripts/test.sh` | 48 |
| `scripts/firmware.sh` | 27 |
| `scripts/stop.sh` | 21 |
| `monografia/build.sh` | 19 |
| `artigo/build.sh` | 9 |
| **Total** | **321** (7 arquivos) |

### Total de código

| Área | Arquivos | Linhas |
| ---- | -------- | ------ |
| Frontend | 27 | 3.206 |
| Backend | 24 | 1.674 |
| Firmware | 13 | 699 |
| Scripts | 7 | 321 |
| **Total** | **71** | **5.900** |

## Documentação

### Markdown

| Área | Arquivos | Linhas |
| ---- | -------- | ------ |
| Raiz (`README.md`, `README-AGENTIC.md`, `AVALIACAO.md`, `AGENTS.md`) | 4 | 468 |
| `docs/` (10 `.md` + 2 `.txt`) | 12 | 2.036 |
| `.specs/` (spec / design / tasks por feature) | 16 | 2.172 |
| `.github/` (instruções, agentes e skills) | 45 | 2.082 |
| `.agents/` (skills) | 25 | 1.484 |
| `monografia/` (planos, status e rastreabilidade) | 5 | 203 |
| `artigo/` (README) | 1 | 42 |
| **Subtotal** | **108** | **8.487** |

### LaTeX — documentos acadêmicos

| Área | Arquivos | Linhas |
| ---- | -------- | ------ |
| `monografia/` (11 `.tex` + 1 `.bib`) | 12 | 2.190 |
| `artigo/` (7 `.tex` + 1 `.bib`) | 8 | 675 |
| **Subtotal** | **20** | **2.865** |

### Total de documentação

**11.352 linhas** em **128 arquivos** (8.487 em Markdown + 2.865 em LaTeX).

## Totais finais

| Categoria | Arquivos | Linhas | Participação |
| --------- | -------- | ------ | ------------ |
| Código (frontend + backend + firmware + scripts) | 71 | **5.900** | 34,2 % |
| Documentação (Markdown + LaTeX) | 128 | **11.352** | 65,8 % |
| **Total geral** | **199** | **17.252** | 100 % |

- **Total de linhas de código: 5.900**
- **Total de linhas de documentação: 11.352**

## Reprodução

```bash
cd /caminho/do/repositorio
PRUNE=(-name node_modules -o -name .venv -o -name dist -o -name build -o -name .pio \
       -o -name __pycache__ -o -name .vite -o -name .pytest_cache -o -name logs -o -name package-lock.json)
sum() { local root="$1"; shift; find "$root" \( "${PRUNE[@]}" \) -prune -o -type f \( "$@" \) -print0 \
        | xargs -0 -r wc -l | awk '$NF!="total"{s+=$1} END{print s+0}'; }

sum frontend -name '*.ts' -o -name '*.tsx' -o -name '*.css' -o -name '*.html'
sum backend/app -name '*.py'
sum backend/tests -name '*.py'
sum firmware -name '*.c' -o -name '*.cpp' -o -name '*.h' -o -name '*.ino'
sum . -name '*.sh'
find . -maxdepth 1 -name '*.md' -print0 | xargs -0 wc -l | awk '$NF!="total"{s+=$1} END{print s+0}'
sum docs -name '*.md' -o -name '*.txt'
sum .specs -name '*.md'
sum .github -name '*.md'
sum .agents -name '*.md'
sum monografia -name '*.md' -o -name '*.tex' -o -name '*.bib'
sum artigo -name '*.md' -o -name '*.tex' -o -name '*.bib'
```
