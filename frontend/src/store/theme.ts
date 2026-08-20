import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ihm-theme';

function readInitial(): Theme {
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'light') return 'light';
  } catch {
    /* storage indisponível — usa o padrão */
  }
  return 'dark';
}

/** Aplica o tema ao elemento raiz (<html data-theme="...">). */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: readInitial(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignora falha de persistência */
    }
    set({ theme: next });
  },
}));

// Aplica o tema salvo assim que o módulo é carregado (evita "flash" no boot).
applyTheme(readInitial());
