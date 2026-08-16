import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, API_BASE } from './client';
import type { Config } from '../types';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchOnce(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status',
    json: async () => body,
  } as Response);
}

describe('api client', () => {
  it('getConfig faz GET no endpoint certo', async () => {
    const fetchMock = mockFetchOnce(200, { pid_u: { kp: 5.0 } });
    await api.getConfig();
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/api/config`,
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('putConfig envia corpo JSON e método PUT', async () => {
    const fetchMock = mockFetchOnce(200, { ok: true });
    const cfg = { pid_u: { kp: 1 } } as unknown as Config;
    await api.putConfig(cfg);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toEqual({ pid_u: { kp: 1 } });
  });

  it('propaga erro com detail do backend', async () => {
    mockFetchOnce(422, { detail: 't1 deve ser > 0' });
    await expect(api.putConfig({} as Config)).rejects.toThrow('422');
  });
});
