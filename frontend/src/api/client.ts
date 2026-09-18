import type { Config, ManualState } from '../types';

// Em produção a IHM é servida pelo próprio backend: os comandos devem ir para a
// MESMA origem da página (senão um navegador remoto enviaria tudo para o próprio
// localhost). No modo dev (Vite :5173) a API continua em localhost:8000.
// VITE_API_BASE sobrescreve ambos os casos.
export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = JSON.stringify(body.detail ?? body);
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getConfig: () => req<Config>('/api/config'),
  putConfig: (params: Config) => req<{ ok: boolean }>('/api/config', { method: 'PUT', body: JSON.stringify(params) }),
  start: () => req<{ state: string }>('/api/control/start', { method: 'POST' }),
  stop: () => req<{ state: string }>('/api/control/stop', { method: 'POST' }),
  emergency: () => req<{ state: string }>('/api/control/emergency', { method: 'POST' }),
  setMode: (mode: 'auto' | 'manual') =>
    req<{ state: string }>('/api/control/mode', { method: 'PUT', body: JSON.stringify({ mode }) }),
  manual: (state: ManualState) => req<{ state: string }>('/api/manual', { method: 'PUT', body: JSON.stringify(state) }),
};
