import { DestroyRef, Directive, ElementRef, effect, inject, input, untracked } from '@angular/core';
import { formatBRL } from '../core/money';

/**
 * Mostra um valor em reais "contando" do valor anterior até o novo (easeOutExpo).
 * Uso: <span [appCountUp]="saldo"></span>. Respeita prefers-reduced-motion.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUp {
  readonly appCountUp = input.required<number>();
  readonly duration = input(900);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private current = 0;
  private frame = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
    effect(() => {
      const target = this.appCountUp();
      untracked(() => this.animate(target));
    });
  }

  private animate(target: number): void {
    cancelAnimationFrame(this.frame);
    const reduce =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof requestAnimationFrame !== 'function') {
      this.render(target);
      return;
    }
    const from = this.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / this.duration());
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      this.render(from + (target - from) * eased);
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  private render(value: number): void {
    this.current = value;
    this.el.textContent = formatBRL(Math.round(value * 100) / 100);
  }
}
