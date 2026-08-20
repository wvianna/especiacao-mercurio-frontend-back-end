import { useState } from 'react';
import { api } from '../api/client';

/** Botão STOP de alta prioridade. */
export function StopButton() {
  const [busy, setBusy] = useState(false);
  const [pressed, setPressed] = useState(false);

  const stop = () => {
    setPressed(true);
    setBusy(true);
    api
      .emergency()
      .catch((e) => console.error('emergency:', e))
      .finally(() => {
        setBusy(false);
        setTimeout(() => setPressed(false), 1500);
      });
  };

  return (
    <button
      className={`stop-btn${pressed ? ' pressed' : ''}`}
      onClick={stop}
      disabled={busy}
      data-tip="STOP — parada de emergência de alta prioridade (desce o copo de N₂ e desliga os fornos)"
      data-tip-pos="bottom"
      aria-label="Parada de emergência"
    >
      <span className="stop-icon">■</span>
      <span className="stop-text">STOP</span>
    </button>
  );
}
