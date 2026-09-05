# Automação e supervisão da preparação de amostras para especiação de mercúrio

## Autores
- William da Silva Vianna
- Renato Gomes Sobral Barcellos

Afiliação: Instituto Federal Fluminense (IFF) — Campos dos Goytacazes, RJ, Brasil.

## Objetivo
Apresentar o projeto, a implementação e a validação de um sistema de automação e
supervisão para a preparação de amostras em especiação de mercúrio, com
arquitetura mestre-escravo (Raspberry Pi + Arduino + IHM Web), controle PID misto
da rampa do Tubo U e segurança funcional (watchdog duplo).

## Estrutura do projeto
```
main.tex            # preâmbulo, resumo e entrada das seções
references.bib      # referências bibliográficas
sections/           # introduction, literature, methodology, results, discussion, conclusion
figures/            # frontendweb.png (captura da IHM)
build/              # PDF gerado
build.sh            # compilação pdflatex -> bibtex -> pdflatex -> pdflatex
```

## Como compilar
```bash
./build.sh          # gera main.pdf
```

## Requisitos
- TeX Live com `pdflatex` e `bibtex` (sem `latexmk`/`biber` no ambiente).
- Pacotes: `mathptmx`, `natbib`, `booktabs`, `tikz`, `graphicx`, `caption`,
  `hyperref`, `float`.

## Dados de validação
Execuções reais em 05/09/2026: 40 testes backend (pytest) + 14 testes firmware
(PlatformIO native) + 13 testes frontend (Vitest) = 67 testes aprovados.

## Pendências (não fabricadas)
- Validação experimental em bancada (rampa real, curva Taxa × PWM, estabilidade
  do Forno 2).
- Confirmação do circuito integrado do termopar (MAX6675 vs MAX31855).
