import { DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

/**
 * Avisa quando o elemento chega perto da área visível (IntersectionObserver),
 * para carregar a próxima página sem botão "ver mais".
 */
@Directive({ selector: '[appInfiniteScroll]' })
export class InfiniteScroll {
  readonly reached = output<void>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && this.reached.emit(),
      {
        rootMargin: '0px 0px 320px 0px',
      },
    );
    observer.observe(el);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
