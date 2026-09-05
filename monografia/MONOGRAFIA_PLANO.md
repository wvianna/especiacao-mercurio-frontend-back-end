# MONOGRAFIA — PLANO

## Identificação
- Título provisório: Desenvolvimento de sistema de automação e supervisão para preparação de amostras em especiação de mercúrio
- Curso: `[CURSO]`
- Instituição: Instituto Federal Fluminense
- Autor: William da Silva Vianna; Renato Gomes Sobral Barcellos
- Orientador: Os próprios autores

## Problema
O sistema legado (LabVIEW) de preparação de amostras para especiação de mercúrio
apresenta: (i) controle inadequado da rampa de temperatura do Tubo U, sem garantir
a linearidade de −50 °C a 230 °C, comprometendo a separação e a identificação das
espécies de mercúrio; (ii) parâmetros não persistentes e pouco rastreáveis entre
execuções; (iii) interface de supervisão propensa a erro humano e sem indicadores
de tendência; (iv) acoplamento entre a lógica de aplicação e a execução em tempo
real; e (v) ausência de parada segura automática (watchdog) em falha de comunicação.

## Justificativa
A especiação de mercúrio exige repetibilidade analítica e controle rigoroso de uma
sequência química (derivatização, criofocalização e atomização). A modernização
para arquitetura baseada em Raspberry Pi (Python), Arduino Uno (DAQ) e IHM Web de
baixo custo aumenta a confiabilidade da rampa de temperatura, torna os parâmetros
persistentes e auditáveis, reduz o erro humano e adiciona camadas de segurança
operacional — atendendo exigência laboratorial de métodos reproduzíveis.

## Objetivo geral
Projetar e implementar um sistema de automação e supervisão para a preparação de
amostras em especiação de mercúrio, baseado em máquina de estados finita, controle
PID misto, DAQ em tempo real e IHM Web, com parâmetros persistentes e segurança
operacional (watchdog e Safe State).

## Objetivos específicos
1. Modelar o processo de preparação de amostras (fases T0–T3) em uma máquina de estados finita com matriz de acionamento de atuadores (SV1–SV5, bomba e fornos).
2. Implementar o controle PID misto do Forno 1 (Tubo U) — razão de taxas para T < 0 °C e PID em malha fechada para T ≥ 0 °C — e o controle do Forno 2 (atomizador) a 700 °C.
3. Definir e implementar o protocolo JSON estruturado entre Raspberry Pi e Arduino a 4 Hz, incluindo handshake de parametrização, pacotes de escrita e leitura.
4. Desenvolver o firmware DAQ no Arduino Uno com leitura de termopares via SPI, acionamento de atuadores e watchdog de segurança.
5. Desenvolver uma IHM Web (React + TypeScript) com monitoramento em tempo real, Diagrama de Tempos, gráficos de tendência e painéis de controle e configuração.
6. Implementar persistência atômica de parâmetros em JSON com backup rotativo e validação de faixas.
7. Validar o sistema por testes unitários, de integração, funcionais e de segurança, seguindo a estratégia TDD do projeto.

## Delimitação
Foco na modernização do software de automação e supervisão (V1). Fora do escopo:
integração automática com o detector Lumex, calibração automática de termopares,
controle de vazão dos rotâmetros (manual) e autenticação multiusuário. Os testes
são realizados em ambiente de desenvolvimento com simulador de hardware (socat);
a validação em bancada com o processo físico e a calibração da curva Taxa × PWM
são itens de continuidade.

## Estrutura planejada
1. Introdução
2. Fundamentação teórica
3. Trabalhos relacionados
4. Metodologia
5. Desenvolvimento
6. Experimentos e resultados (com seção de discussão)
7. Conclusão
(+ Referências, Apêndice A)

## Meta de extensão
65–100 páginas de conteúdo acadêmico, sem preenchimento artificial. 1ª versão
gerada autonomamente em 2026-09-05 com conteúdo denso e evidências reais do
repositório; a expansão deve ocorrer por aprofundamento técnico (fundamentação,
comparação crítica, descrição detalhada), nunca por repetição ou conteúdo fictício.

## LaTeX
- Classe/modelo institucional: memoir + formatação manual ABNT (modelo institucional
  não disponível no workspace — `[VALIDAR COM O AUTOR]`).
- Compilador: pdflatex (TeX Live), bibtex (estilo `plain`, citações numéricas).
- Ferramenta de compilação: `build.sh` (pdflatex → bibtex → pdflatex → pdflatex).
- Pacotes confirmados: memoir, babel (brazilian), mathptmx, booktabs, hyperref,
  xcolor, tikz, graphicx, amsmath, caption, longtable, enumitem, listings, natbib.

## Pendências
- Dados da capa/folha de rosto (instituição, curso, autor, orientador).
- Modelo institucional do curso (para alinhar capa e formatação).
- Confirmação de edições normativas ABNT citadas.
- Dados de validação em bancada (curva Taxa × PWM, rampa real) — item de continuidade.
