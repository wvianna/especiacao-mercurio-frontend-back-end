# Requisitos — Sistema de Automação para Especiação de Mercúrio

## Objetivos Específicos

- Projetar e implementar sistema de automação e controle de preparação de amostras para especiação de mercúrio;
- Validar o controle e automação para a preparação de amostras para análise.

---

## Descrição do Processo

De acordo com a **Figura 11**, uma amostra líquida é inserida no frasco de reação fixado à bancada onde ocorre o processo de derivatização com o tetraetilborato de sódio, que volatiliza as diversas espécies de mercúrio. Através do sequenciamento das válvulas, o vapor destas formas de mercúrio é levado até um **tubo U** que se encontra envolvido por um filamento que oferece resistência elétrica, entregando ao sistema energia na forma de calor, sendo chamado de **forno 1**, como pode ser visto na **Figura 12**.

![Figura 11 - Diagrama do processo](figura%2011%20-%20diagrama-processo.png)
*Figura 11: Diagrama do processo.*

Tal tubo U tem anexado ao seu corpo um outro tubo U idêntico, o qual está envolvido pela mesma resistência elétrica, para que a junta quente do termopar (sensor) possa ser colocada em seu interior e assim haja a leitura da temperatura, já que ambos se encontram na mesma temperatura. O tubo U está dentro do copo contendo nitrogênio à uma temperatura de aproximadamente $-196^\circ C$.

![Figura 12 - Ligação dos módulos de medição de temperatura (forno e tubo U)](figura%2012%20-%20ligacao%20modulos%20medicao%20temperatura%20forno%20e%20tubo%20em%20U.png)
*Figura 12: Ligação dos módulos de medição de temperatura do forno e do tubo U.*

![Figura 12 - Diagrama do processo](figura%2012%20-%20diagrama-processo.png)
*Figura 12: Diagrama do processo.*

Depois da derivatização no frasco de reação e da criofocalização dentro do tubo U, devida à baixa temperatura no nitrogênio líquido contido no copo (período de tempo definido pelo operador), o copo desce e o forno 1 é acionado. Neste instante a temperatura começa a aumentar gradativamente e, nesse período de aquecimento, as espécies de mercúrio vão sendo liberadas. Um sensor de temperatura (termopar do tipo K) foi posicionado para medir a temperatura no tubo U e começa a leitura em $-196^\circ C$ indo até $230^\circ C$. Essa mudança de temperatura origina uma função do tipo **rampa (Tempo × Temperatura)** que é capaz de informar em que intervalo de tempo, dada uma temperatura, uma substância é liberada de acordo com sua temperatura de volatilização.

Primeiramente ocorrem as passagens de amostras padrão que contêm quantidades conhecidas de cada uma das espécies que estão sendo analisadas. A função rampa ocorrerá num período de **cinco a sete minutos**. Após a passagem pelo forno 1, a substância segue para o forno 2 (Figuras 11 e 12), onde terá a sua temperatura aumentada diretamente para $700^\circ C$ para que ocorra a atomização do mercúrio. Antes deste passo, o mercúrio está sob diversas formas químicas e, a $700^\circ C$, as espécies são degradadas e então o detector Lumex lê apenas o mercúrio metálico atomizado.

O **Lumex** é um espectrofotômetro de absorção atômica com correção do efeito Zeeman, específico para medir concentrações de mercúrio. Ele se distingue dos outros equipamentos de medição de Hg por ter um eixo ótico de aproximadamente 5 metros. O vapor de mercúrio entra neste eixo e vai absorvendo o comprimento de onda da lâmpada. Por ter um eixo ótico muito longo (conta com um sistema de espelhos), o Lumex é capaz de medir concentrações muito mais baixas que um espectrofotômetro comum, cuja célula tem normalmente poucos centímetros.

Já o forno 2 é composto por um bloco de cerâmica para isolação com dois tubos de quartzo em seu interior envolvidos por um resistor elétrico. Por um tubo passa o fluido e por outro é lida a temperatura com a inserção do termopar em seu interior.

---

## Definição do Escopo

### Primeira etapa de acionamento

Na primeira etapa de acionamento, de acordo com a **Figura 12**, a amostra líquida já deve encontrar-se no frasco de reação, e o rotâmetro 1 deve começar a regular a vazão do gás hélio (deve ser ultra-puro, tipo 5.0) que entra no sistema. O gás hélio é o elemento químico responsável por agitar a amostra dentro do copo, já que é um gás inerte e não reage com a mesma. Além disso, é utilizado para purgar o mercúrio da tubulação. O tetraetilborato de sódio faz as espécies ficarem em uma forma mais volátil e o hélio purga estas formas para dentro da coluna.

Ao purgar os vapores de mercúrio, o hélio leva consigo um pouco de água da solução. Esta água poderia ser um importante interferente no processo de criofocalização e na medição do Lumex e precisa ser retirada. É para isto que usamos o **náfion**, um dessecador de gases. Para que o gás hélio chegue até o frasco com a amostra, a válvula **SV1** se abre e a válvula **SV2** permanece na sua posição não acionada 1-2. Ainda nesta primeira etapa, a **bomba peristáltica** é ligada para a entrada de **10 mL de TEBS** no sistema, que é a substância responsável por reagir com o mercúrio, fazendo-o ser derivatizado da amostra mais facilmente.

### Segunda etapa

Na segunda etapa, a bomba que injeta a solução TEBS no sistema é desligada e a válvula **SV3** permanece na sua posição não acionada, que é a posição 1-2, recebendo assim o vapor que contém o gás hélio juntamente com as espécies de mercúrio (no sentido 2-1) que passou pelo dissecante para que fosse retirada a umidade. Após passar pela SV3, o gás é levado até o tubo U, que se encontra envolvido pelo forno 1 (filamento que funciona como uma resistência térmica).

O pistão se encontra acionado e, por consequência, o copo contendo nitrogênio líquido fixado a ele se encontra suspenso ao redor do tubo U, fazendo com que haja o processo de **criofocalização** (congelamento) das diferentes espécies do mercúrio contidas no tubo U. O copo de nitrogênio deve estar a uma temperatura de $-196^\circ C$.

### Terceira etapa

Na terceira etapa, após toda a derivatização do Hg (tempo que é definido pelo operador), o copo de nitrogênio desce e o forno 1 é ligado. Fixado ao forno 1 encontra-se um sensor de temperatura que começa a fazer a leitura quando a temperatura chega em torno de $-196^\circ C$. Esse sensor é o responsável por indicar a temperatura corrente do forno 1 para que um posterior controle **PID** seja realizado para manter a temperatura dentro do valor de setpoint dinâmico de até $230^\circ C$.

Cada substância composta por mercúrio possui uma faixa de temperatura na qual é volatilizada. As diferentes espécies do mercúrio serão liberadas através de uma função rampa (Tempo × Temperatura) que associa a cada intervalo de tempo uma temperatura, e essa temperatura indica qual a substância derivada do mercúrio está sendo liberada. É possível se fazer esta avaliação baseando-se exclusivamente na temperatura, mas o normal e o mais seguro é que passaremos amostras padrão e estas vão indicar o tempo em que cada espécie vai sair da coluna em U.

Após a saída do forno 1 (coluna em U), a substância é conduzida através da tubulação para dentro de um tubo de quartzo presente no forno 2, onde há outra resistência térmica e onde outro controle PID é aplicado. No forno 2 a temperatura é contínua e fixada em $700^\circ C$. Após a passagem pelo forno 2, o vapor é levado até o detector Lumex para se identificar as substâncias através da fluorescência emitida pelo mercúrio quando atravessado por uma radiação com um específico comprimento de onda.

As três primeiras etapas constituem-se basicamente da preparação da amostra, como é apresentado na **Figura 12**.

### Quarta etapa (purga total)

Na quarta etapa, o sistema é preparado para a **purga total**, de acordo com a **Figura 13**, que será constituída por duas purgas concomitantes: a **purga 1**, responsável por fazer a limpeza no tubo U, e a **purga 2**, que tem como função retirar os líquidos retidos na membrana de náfion (dissecante).

![Figura 13 - Diagrama do processo](figura%2013%20-%20diagrama-processo.png)
*Figura 13: Diagrama do processo (purga total).*

Para que a purga do tubo U aconteça:

- a válvula **SV1** se abre para que haja a entrada do gás hélio no sistema através da regulagem de vazão de gás do rotâmetro 1;
- a válvula **SV2** vai para a posição 1-3;
- a válvula **SV3** também vai para a posição de acionamento 1-3 (sendo que o fluido passa no sentido 3-1) para que o gás possa ir em direção ao tubo U para limpá-lo.

Na purga 2, o gás hélio também é liberado pelo rotâmetro 2 e a válvula **SV4** é aberta, permitindo a passagem do fluido no sentido 1-2 para o dissecante. Ao final da limpeza total do sistema, as válvulas SV1 e SV4 são desacionadas para que não haja desperdício de gás hélio, como se pode ver na **Figura 13**.

### Pontos-chave

Os pontos-chave da automação e controle do processo são o correto sequenciamento das etapas descritas anteriormente e, além disso, é necessário que o controle PID nos dois fornos seja eficiente para que as temperaturas estejam dentro dos valores de setpoint estabelecidos.

De acordo com o **diagrama de estados das saídas digitais (Figura 14)**, para melhor exemplificar as etapas que ocorrem em cada intervalo de tempo foram criados **4 tempos de acionamento**: $t_0$, $t_1$, $t_2$ e $t_3$.

![Figura 14 - Diagrama de estados das saídas digitais](figura%2014%20-%20diagrama-estados-saidas%20digitais.png)
*Figura 14: Diagrama de estados das saídas digitais.*

- **$t_0$:**
  - O rotâmetro 1 abre para que a vazão do gás hélio seja regulada;
  - A válvula solenóide SV1 se abre para que haja a entrada do gás no sistema;
  - A válvula SV2 permanece na posição não acionada 1-2 para que o hélio entre no recipiente com a função de agitar a amostra;
  - A bomba é ligada para que seja injetado a solução TEBS no sistema;
  - O copo de nitrogênio já se encontra elevado a uma temperatura de $-196^\circ C$.
- **$t_1$:**
  - A bomba injetora do TEBS é desligada;
  - A válvula SV3 permanece na posição não acionada 1-2, que é o sentido oriundo do dissecante, para que o fluido possa ir para o tubo U (que está envolvido pelo forno 1);
  - O copo de nitrogênio neste instante continua elevado.
- **$t_2$:**
  - O copo de nitrogênio se abaixa automaticamente;
  - O forno 1 é acionado e desta forma se inicia o aquecimento (que chegará ao máximo de $230^\circ C$);
  - A rampa de temperatura se inicia indo de aproximadamente $-50^\circ C$ (que é a temperatura mínima que pode ser lida pelo sensor acoplado ao forno 1) até $230^\circ C$;
  - As espécies do mercúrio passam agora pelo forno 2 para ter sua temperatura aumentada para $700^\circ C$ com sua atomização;
  - Começa a leitura no detector Lumex;
  - A válvula SV1 é aberta para que comece a purga do tubo U ao mesmo tempo em que é realizada a leitura.
- **$t_3$:**
  - A válvula solenóide SV4 é acionada;
  - O rotâmetro 2 abre para que a vazão de hélio seja regulada e assim se inicie a purga do dissecante;
  - A válvula solenóide SV2 muda para a posição 1-3;
  - A válvula solenóide SV3 muda para a posição 1-3;
  - Após a limpeza total do sistema, a válvula SV1 e a válvula SV4 são fechadas.

**Legenda da Figura 14:**

- **T0** — início do processo;
- **T1** — preparação para rampa de temperatura;
- **T2** — período de rampa de temperatura e purga do tubo U;
- **T3** — purga do restante do sistema (dissecante e recipiente da amostra).

---

## Dispositivo de Aquisição de Dados (DAQ)

Haja vista a necessidade da utilização de um dispositivo DAQ para a aquisição dos valores das entradas e saídas do processo, optou-se pela utilização do **Arduino Uno**. O Arduino Uno pode ser alimentado por uma conexão USB que oferece uma tensão de até 5 V e/ou por uma fonte externa com tensão de alimentação de 7 V a 12 V. A tensão de funcionamento do Arduino é de 5 V e, para garantir que essa tensão não seja ultrapassada, existe um regulador de tensão acoplado à placa.

O Arduino apresenta 6 pinos para entradas analógicas e 14 pinos de saídas digitais, dos quais 6 são PWM. O Arduino é um DAQ de grande praticidade, versatilidade e baixo custo se comparado a outros DAQs existentes no mercado, como o caso de um CLP, por exemplo.

O Arduino intermedia a comunicação do software de supervisão e controle com o processo. O código de programação elaborado, através de uma comunicação serial, irá acionar e desacionar os pinos referentes às saídas digitais de acordo com os tempos de acionamento estabelecidos.

A **Tabela 1** é composta pela sequência da pinagem do Arduino e suas respectivas associações. As ligações das válvulas e da bomba passam pelo **Módulo Relé (Figura 19)**, as ligações com os termopares passam pelo **Módulo Micro SD Arduino SPI (Figura 22)** e as ligações para o acionamento dos resistores dos fornos 1 e 2 passam cada uma por seu respectivo **Relé de Estado Sólido (Figura 23)**.

![Tabela 1 - Pinagem Arduino Uno](tabela%2011%20-%20pinagem%20arduino%20uno.png)
*Tabela 1: Pinagem do Arduino Uno.*

No circuito da **Figura 23**, é possível ver o acionamento dos dois relés de estado sólido responsáveis pelo acionamento dos dois fornos: o forno 1 (tubo U) e o forno 2 (bloco de cerâmica). Em série com o relé de estado sólido é possível observar um controlador de potência de 110 VCA que fornece uma corrente de 10 A. O regulador foi utilizado para controlar a potência fornecida aos fornos.

> **Nota:** as Figuras 19, 22 e 23 são citadas no texto, mas não há arquivos de imagem correspondentes no diretório `docs/`.

---

## Interface de Supervisão (Figura 15)

A interface de supervisão conta com os seguintes elementos (Figura 15):

- **1:** Botão Manual/Automático — o usuário pode colocar o sistema em modo manual ou automático;
- **2:** Botão Iniciar Processo — o sequenciamento das etapas do processo acontece e, além disso, começa a ser feita a rampa de temperatura no tubo U;
- **3:** Parar Processo — as etapas do processo param de ser feitas e a rampa de temperatura no tubo U também para de acontecer;
- **4:** Indicador do tempo decorrido do processo (tanto em modo manual quanto em automático);
- **5:** Acionamento manual da válvula SV1;
- **6:** Acionamento manual da válvula SV2;
- **7:** Acionamento manual da bomba peristáltica;
- **8:** Acionamento manual da válvula SV3;
- **9:** Acionamento manual da válvula SV4;
- **10:** VM-F — controle responsável pela inserção de porcentagem PWM para aquecer o forno 2 em modo manual;
- **11:** SP-F — controle responsável pela inserção do setpoint para o forno 2 pelo usuário;
- **12:** Indicador visual de quando o forno 2 está recebendo porcentagem PWM maior do que zero;
- **13:** Botão STOP — responsável por parar de executar o código de programação;
- **14:** Acionamento manual da válvula SV5;
- **15:** Indicador visual de quando o forno 1 (tubo U) está recebendo porcentagem PWM maior do que zero;
- **16:** Indica se o copo criogênico se encontra abaixado ou levantado;
- **17:** VM-U — controle responsável pela inserção de porcentagem PWM para aquecer o forno 1 (tubo U) em modo manual;
- **18:** SP-U — controle responsável pela inserção do setpoint para o forno 1 (tubo U) pelo usuário;
- **19:** Indicador da taxa de aquecimento em °C/s calculada pelo processo;
- **20:** Diagrama de estados das saídas digitais;
- **21:** Indicador de taxa de aquecimento em °C/s que pode ser inserida pelo usuário (calculada através da interpolação da curva gerada pelo gráfico da dinâmica do tubo U — Taxa de Aquecimento × Porcentagem PWM);
- **22:** Tempo T1 — tempo necessário para a preparação para rampa de temperatura no tubo U;
- **23:** Tempo T2 — tempo necessário ao período de rampa de temperatura e purga no tubo U;
- **24:** Tempo T3 — purga do restante do sistema (dissecante e recipiente da amostra);
- **25:** Matriz de acionamentos — cada elemento da matriz representa o estado de uma saída digital (SV1, SV2, SV3, SV4, SV5 e a bomba) em cada tempo de acionamento (T0, T1, T2 e T3);
- **26:** Através do botão LER é possível ler os parâmetros inseridos no sistema (parâmetros Kp, Ti e Td dos dois controladores; os tempos de acionamento T1, T2 e T3; a data e a hora) em um arquivo;
- **27:** Através do botão ESCREVER é possível escrever os parâmetros do sistema (parâmetros Kp, Ti e Td dos dois controladores; os tempos de acionamento T1, T2 e T3; a data e a hora) em um arquivo;
- **28:** A temperatura do nitrogênio (de onde se iniciará a rampa de temperatura no tubo U) é inserida pelo usuário;
- **29:** O tempo total da rampa de temperatura é inserido pelo usuário em segundos.

> **Nota:** não há arquivo de imagem da Figura 15 no diretório `docs/`.

---

## Parametrização dos Controladores PID (Figura 27)

A **Figura 27** demonstra a interface de entrada para os parâmetros utilizados. O controle das temperaturas dos fornos e, de acordo com o diagrama das saídas digitais, a sequência de acionamento das válvulas ocorrem como esperado.

![Figura 27 - Parametrização dos controles PID](figura%2027%20-%20parametricacao%20controles%20pid.png)
*Figura 27: Parametrização dos controles PID.*

**Legenda da Figura 27:**

- **1:** Kp — ganho proporcional do controlador de temperatura do forno 2;
- **2:** Ti — tempo integral do controlador de temperatura do forno 2, em minutos;
- **3:** Td — tempo derivativo do controlador de temperatura do forno 2, em minutos;
- **4:** Kp — ganho proporcional do controlador de temperatura do forno 1 (tubo U);
- **5:** Ti — tempo integral do controlador de temperatura do forno 1 (tubo U), em minutos;
- **6:** Td — tempo derivativo do controlador de temperatura do forno 1 (tubo U), em minutos;
- **7:** Error Out — VI de status do código do LabVIEW em relação a erros;
- **8:** Serial Port — indicação da porta serial na máquina virtual que é utilizada pelo Arduino e que deve ser mapeada antes da execução;
- **9:** Loop Rate — frequência de varredura do programa num determinado período de tempo.

### Operação (Manual e Automática)

O operador precisa entrar com os tempos **T1, T2, T3** e **Tempo de Rampa**, em segundos, e com a **temperatura do nitrogênio** em graus Celsius. Os valores dos ganhos PID são fixos e pré-definidos. Feita tal parametrização, o operador deve acionar a função **Run** no software para rodar o programa.

Como já mencionado, se o processo estiver no modo **MANUAL**, o operador poderá alterar não só o valor de setpoint das temperaturas mas também a porcentagem de PWM, além de fazer o acionamento manual da bomba e das válvulas, podendo parar todo o processo usando o botão virtual **STOP**. Já se o processo estiver em modo **AUTOMÁTICO**, basta o operador acionar o botão virtual **INICIAR PROCESSO** que todos os acionamentos serão feitos de acordo com os parâmetros informados pelo operador previamente, e de forma automática, além da atuação do PID no controle de temperatura do forno de acordo com o setpoint informado. Neste caso, a única variável que o operador informa depois do sistema já estar atuando automaticamente é o setpoint.

Finalmente, como é fácil perceber na **Figura 26**, para parar o processo a qualquer momento, basta acionar **PARAR PROCESSO**.

> **Nota:** não há arquivo de imagem da Figura 26 no diretório `docs/`.

A interface também conta com outros recursos visuais, tais como: mudança de cor dos fornos, bomba e tubulação para indicar acionamento; indicadores de VP, SP e VM; gráfico com setpoint e VP de temperatura; contagem de tempo e status do pistão; além dos tempos de acionamento, parâmetros PID, diagrama de estados das saídas digitais e porta serial utilizada no mapeamento.

---

## Máquina de Estados Finita (Figura 28)

A estrutura utilizada para garantir o funcionamento do processo é baseada no conceito de **Máquina de Estados**. O processo é modelado através da divisão do mesmo em etapas sequenciais, em que cada etapa tem uma entrada, é responsável por executar uma função e, ao final disso, deve existir uma saída que influencia o próximo estado. As informações adquiridas vão sendo levadas para o próximo estado e desta forma um fluxo de informações é criado, como pode ser visto na **Figura 28**.

![Figura 28 - Máquina de estados modelo](figura%2028%20-%20maquina%20de%20estados%20modelo.png)
*Figura 28: Máquina de estados modelo.*

**Legenda da Figura 28:**

- **Início:** etapa em que o processo insere o valor lógico zero em todas as saídas digitais, mantendo-as assim desacionadas;
- **Leitura/Escrita DAQ:** etapa em que o processo faz a leitura e a escrita do valor das variáveis no DAQ;
- **Event:** etapa onde são tomadas a maior parte das decisões do programa. Partindo deste estado é possível ir para os estados Ler, Escrever, Manual ou Controle Tubo, conforme o acontecimento dos eventos descritos na Figura 28;
- **Controle Tubo:** etapa onde é feito o controle do tubo U através dos valores de Kp, Ti e Td para se encontrar a porcentagem PWM necessária para que a temperatura do tubo U se aproxime do setpoint, caso a temperatura inicial do nitrogênio seja maior que zero. Caso a temperatura inicial de nitrogênio seja menor que zero, a porcentagem PWM será calculada dividindo-se a taxa de aquecimento inserida pelo usuário pela taxa de aquecimento calculada pelo sistema;
- **Controle Forno:** etapa onde é feito o controle do forno 2 através dos valores de Kp, Ti e Td para se encontrar a porcentagem PWM necessária para que a temperatura do forno 2 se aproxime do valor de setpoint;
- **Manual:** etapa onde todo o processo se encontra em manual e cada saída digital pode ser acionada pelo usuário;
- **Atualizar IHM:** etapa em que todos os valores do processo são atualizados na IHM;
- **Ler Parâmetros:** etapa em que os parâmetros do processo (parâmetros Kp, Ti e Td dos dois controladores; os tempos de acionamento T1, T2 e T3; a data e a hora) são lidos de um arquivo;
- **Escrever Parâmetros:** etapa em que os parâmetros do processo (parâmetros Kp, Ti e Td dos dois controladores; os tempos de acionamento T1, T2 e T3; a data e a hora) são escritos num arquivo.

---

## Controle PID (Figura 30)

O controle de temperatura dos dois fornos é essencial para garantir a temperatura ideal em que o mercúrio é liberado nas suas diferentes formas e posteriormente identificado no detector Lumex. O controle de temperatura que será utilizado para ambos os fornos será o **PID misto**, como pode ser visto na **Figura 30**.

![Figura 30 - Controles de temperatura](figura%2030%20-%20controles%20de%20temperatura.png)
*Figura 30: Controles de temperatura.*

O valor da temperatura é comparado com o setpoint e então um sinal de erro é calculado e utilizado em conjunto com os parâmetros do controlador (proporcional, integrativo e derivativo), que são definidos pelo operador, para que seja calculada a porcentagem PWM que atua em cada forno e, dessa forma, a temperatura possa se manter próxima do setpoint requerido pelo operador. Ou seja, **malhas fechadas** usando o sinal de leitura de cada sensor como realimentação.
