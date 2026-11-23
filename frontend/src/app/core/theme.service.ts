import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'fintrack.theme';

/**
 * Tema claro/escuro num signal. A troca usa a View Transitions API:
 * o tema novo se abre num círculo a partir do ponto clicado.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<Theme>(
    (this.document.documentElement.dataset['theme'] as Theme) ?? 'light',
  );

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.dataset['theme'] = theme;
      this.document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((m) => m.setAttribute('content', theme === 'dark' ? '#11130f' : '#f4f1ea'));
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* navegação privada */
      }
    });
  }

  toggle(origin?: { x: number; y: number }): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    const doc = this.document;
    const reduce = doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce || !origin) {
      this.theme.set(next);
      return;
    }
    const html = doc.documentElement;
    html.classList.add('theme-switching');
    const transition = doc.startViewTransition(() => {
      this.theme.set(next);
      html.dataset['theme'] = next;
    });
    const radius = Math.hypot(
      Math.max(origin.x, innerWidth - origin.x),
      Math.max(origin.y, innerHeight - origin.y),
    );
    void transition.ready.then(() =>
      html.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: 520,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      ),
    );
    void transition.finished.finally(() => html.classList.remove('theme-switching'));
  }
}
