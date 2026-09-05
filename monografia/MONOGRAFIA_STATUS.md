# MONOGRAFIA — STATUS

## Estado atual
- Estado: `EM DESENVOLVIMENTO` (1ª versão completa gerada e compilada em PDF)
- Última etapa concluída: redação de todos os capítulos + compilação LaTeX sem erros (53 páginas)
- Próxima etapa: revisão em camadas pelo autor/orientador e expansão conforme pendências
- Última atualização: 2026-09-05

## Capítulos
- [x] Introdução (Cap. 1)
- [x] Fundamentação teórica (Cap. 2)
- [x] Trabalhos relacionados (Cap. 3)
- [x] Metodologia (Cap. 4)
- [x] Desenvolvimento (Cap. 5)
- [x] Experimentos e resultados (Cap. 6)
- [x] Discussão (Seção 6.5)
- [x] Conclusão (Cap. 7)
- [x] Apêndice A — mapa dos módulos

## LaTeX
- [x] `main.tex`
- [x] `references.bib` (20 referências reais)
- [x] estrutura modular (`chapters/`, `figures/`)
- [x] compilação sem erros (0 overfull, 0 citações indefinidas)
- [x] PDF gerado (`main.pdf`, 53 páginas)
- [x] PDF inspecionado (capa, listas, sumário, figuras TikZ, tabelas, equações, referências, apêndice)

## Evidências de validação (execuções reais em 05/09/2026)
- Backend: 40 testes aprovados (pytest)
- Firmware (host): 14 testes aprovados (PlatformIO native)
- Frontend: 13 testes aprovados (Vitest)
- Total: 67 testes aprovados (reportados no Cap. 6)

## Pendências críticas
- Curso (capa/folha de rosto) — P-001 (instituição, autores, orientador, título a conferir e cidade já preenchidos).
- Validação em bancada (linearidade da rampa, estabilidade do Forno 2, curva Taxa × PWM) — P-004.

## Informações ausentes
- Dados institucionais; modelo institucional do curso; séries temporais reais (VP × SP) para gráficos de tendência.

## Revisões
- Conteúdo: 1ª leitura pendente (autor/orientador).
- Engenharia: baseada no código real; módulos conferidos um a um (FSM, PID, rampa, firmware, protocolo, loop, persistência, API/WS, IHM).
- Evidências: matriz em `MONOGRAFIA_EVIDENCIAS.md`; resultados de testes executados de fato.
- ABNT: citações numéricas (NBR 10520) e estrutura conforme NBR 14724; revisão fina das referências (NBR 6023) pendente (P-007).
- Linguagem: pt-BR acadêmico.
- LaTeX/PDF: compilado e inspecionado (0 erros, 0 overfull).
