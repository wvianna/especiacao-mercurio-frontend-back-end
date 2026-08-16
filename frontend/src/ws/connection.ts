import type { Telemetry } from '../types';

/**
 * Conecta ao WebSocket de telemetria com reconexão automática.
 * Retorna uma função de limpeza.
 */
export function connectTelemetry(
  onMessage: (t: Telemetry) => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  const url =
    import.meta.env.VITE_WS_URL ??
    `ws://${window.location.hostname}:8000/ws/telemetry`;

  let closed = false;
  let retry = 0;
  let ws: WebSocket | null = null;

  const open = () => {
    if (closed) return;
    ws = new WebSocket(url);
    ws.onopen = () => {
      retry = 0;
      onStatus?.(true);
    };
    ws.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data as string) as Telemetry);
      } catch {
        /* pacote inválido — ignora */
      }
    };
    ws.onclose = () => {
      onStatus?.(false);
      if (closed) return;
      retry = Math.min(retry + 1, 8);
      setTimeout(open, 750 * retry);
    };
    ws.onerror = () => ws?.close();
  };

  open();

  return () => {
    closed = true;
    ws?.close();
  };
}
