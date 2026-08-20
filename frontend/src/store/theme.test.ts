import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, useTheme } from './theme';

afterEach(() => {
  localStorage.clear();
  applyTheme('dark');
  useTheme.setState({ theme: 'dark' });
});

describe('theme store', () => {
  it('inicia no tema escuro por padrão', () => {
    expect(useTheme.getState().theme).toBe('dark');
  });

  it('alterna para claro, aplica ao <html> e persiste', () => {
    useTheme.getState().toggle();
    expect(useTheme.getState().theme).toBe('light');
    expect(localStorage.getItem('ihm-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('alterna de volta para escuro', () => {
    useTheme.getState().toggle(); // -> claro
    useTheme.getState().toggle(); // -> escuro
    expect(useTheme.getState().theme).toBe('dark');
    expect(localStorage.getItem('ihm-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
