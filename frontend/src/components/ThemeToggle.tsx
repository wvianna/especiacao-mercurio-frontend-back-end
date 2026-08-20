import { useTheme } from '../store/theme';

/** Botão de alternância de tema (escuro ↔ claro) com persistência. */
export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);

  return (
    <button
      className="theme-btn"
      onClick={toggle}
      data-tip={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      data-tip-pos="bottom"
      aria-label="Alternar tema claro/escuro"
    >
      <span aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
}
