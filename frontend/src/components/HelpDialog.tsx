import { useEffect, useRef } from 'react';
import figura11 from '../assets/figura-11-diagrama-processo.png';

export const GITHUB_URL =
  'https://github.com/wvianna/especiacao-mercurio-frontend-backend-firmware';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Ajuda: instruções de funcionamento do processo, Figura 11 e link do repositório. */
export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="help-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <header className="help-head">
          <h2 id="help-title">Ajuda · funcionamento do processo</h2>
          <button
            ref={closeRef}
            className="help-close"
            onClick={onClose}
            aria-label="Fechar ajuda"
            data-tip="Fechar (Esc)"
          >
            ✕
          </button>
        </header>

        <div className="help-body">
          <section>
            <h3>Visão geral</h3>
            <p>
              Esta IHM supervisiona a preparação de amostras para <b>especiação de
              mercúrio</b>: derivatização, criofocalização em nitrogênio líquido, rampa
              de aquecimento do <b>Tubo U</b> (Forno 1), atomização a 700 °C no{' '}
              <b>Forno 2</b> e envio ao detector Lumex. O backend no Raspberry Pi executa
              a máquina de estados e as malhas de controle; o Arduino Uno atua como DAQ
              em tempo real (válvulas, bomba, PWM e termopares).
            </p>
          </section>

          <section>
            <h3>Ciclo automático T₀ → T₃</h3>
            <ul>
              <li>
                <b>T₀ · Derivação / Criofocalização</b> — SV1 aberta, copo de N₂
                abaixado (SV5) e bomba ligada; o TEBS volatiliza as espécies.
              </li>
              <li>
                <b>T₁ · Estabilização térmica</b> — SV1 e copo de N₂ mantidos; bomba
                desligada.
              </li>
              <li>
                <b>T₂ · Rampa de aquecimento</b> — copo sobe (SV5) e o Tubo U aquece de
                −196 °C até o alvo; o Forno 2 estabiliza em 700 °C.
              </li>
              <li>
                <b>T₃ · Purga total</b> — SV2, SV3 e SV4 abertas para limpar o
                dissecante e as linhas.
              </li>
            </ul>
          </section>

          <section>
            <h3>Controle de temperatura do Tubo U</h3>
            <ul>
              <li>
                <b>Abaixo de 0 °C</b> o termopar não fornece leitura confiável:
                aplica-se a <b>potência fixa de PWM</b> definida no modo CONFIG (campo
                "PWM fixo ≤ 0 °C"), em malha aberta.
              </li>
              <li>
                <b>Acima de 0 °C</b> o PID assume e segue a rampa linear definida por
                "N₂ inicial", "Alvo" e "Tempo de rampa".
              </li>
            </ul>
          </section>

          <section>
            <h3>Operação</h3>
            <ul>
              <li>
                <b>MONITOR / CONFIG</b> — acompanhar o processo em tempo real ou
                parametrizar o método.
              </li>
              <li>
                <b>INICIAR / PARAR</b> — executa ou encerra o ciclo automático (retorno
                ao Safe State).
              </li>
              <li>
                <b>STOP</b> — parada de emergência de alta prioridade.
              </li>
              <li>
                <b>AUTO / MANUAL</b> — no modo manual, válvulas, bomba e PWM são
                acionados diretamente.
              </li>
              <li>
                <b>LER / SALVAR CONFIGURAÇÕES</b> — os parâmetros são persistidos em{' '}
                <code>params.json</code> com backup rotativo.
              </li>
            </ul>
          </section>

          <section>
            <h3>Segurança</h3>
            <ul>
              <li>
                O Arduino desliga os fornos (watchdog) se ficar mais de 1 s sem
                comunicação com o backend.
              </li>
              <li>
                No Safe State todas as saídas ficam desligadas e o copo criogênico é
                levantado ao final do ciclo.
              </li>
            </ul>
          </section>

          <figure className="help-figure">
            <img
              src={figura11}
              alt="Figura 11 — diagrama do processo: fluxo de hélio, frasco de reação com TEBS, válvulas SV1–SV4, dissecante, Tubo U com copo criogênico de nitrogênio, Forno 2, detector Lumex e computador de supervisão"
            />
            <figcaption>
              Figura 11 — Diagrama do processo: hélio (rotâmetros), TEBS (bomba
              peristáltica), frasco de reação (derivatização), válvulas SV1–SV4,
              dissecante, Tubo U (Forno 1) com copo criogênico de N₂ e pistão (SV5),
              Forno 2 (atomizador), detector Lumex e computador (IHM).
            </figcaption>
          </figure>

          <p className="help-github">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              Projeto no GitHub — wvianna/especiacao-mercurio-frontend-backend-firmware
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
