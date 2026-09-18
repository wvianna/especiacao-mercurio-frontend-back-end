import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GITHUB_URL, HelpDialog } from '../components/HelpDialog';

describe('HelpDialog', () => {
  it('não renderiza nada quando fechado', () => {
    const { container } = render(<HelpDialog open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('mostra instruções, Figura 11 com alt e link do repositório', () => {
    render(<HelpDialog open onClose={() => {}} />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/funcionamento do processo/i)).toBeTruthy();
    expect(screen.getByText(/Ciclo automático T₀ → T₃/)).toBeTruthy();

    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.getAttribute('alt')).toMatch(/Figura 11/);
    expect(img.getAttribute('src')).toBeTruthy();

    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(GITHUB_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('fecha pelo botão ✕, por Esc e pelo clique no fundo', () => {
    const onClose = vi.fn();
    render(<HelpDialog open onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /fechar ajuda/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.mouseDown(overlay);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
