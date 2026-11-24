import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TOUR_STEPS, TourService, TourStep } from '../core/tour.service';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const GAP = 14;
const PAD = 8;
const MARGIN = 16;

/**
 * Tour guiado: escurece a tela, abre um "holofote" em volta de cada parte do app e mostra um cartão
 * explicando. O holofote e o cartão deslizam de um alvo para o outro. Setas do teclado navegam e Esc fecha.
 */
@Component({
  selector: 'app-tour',
  template: `
    @if (tour.active()) {
      <div class="catcher" (click)="$event.stopPropagation()"></div>
      <div
        class="spot"
        [class.empty]="!spot()"
        [style.top.px]="spot()?.top ?? centerY()"
        [style.left.px]="spot()?.left ?? centerX()"
        [style.width.px]="spot()?.width ?? 0"
        [style.height.px]="spot()?.height ?? 0"
      ></div>
      <section
        #card
        class="card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        [style.top.px]="cardPos().top"
        [style.left.px]="cardPos().left"
      >
        @for (s of [step()]; track index()) {
          <div class="content" animate.enter="tour-in">
            <span class="badge material-symbols-rounded filled" aria-hidden="true">{{
              s.icon
            }}</span>
            <span class="count">{{ index() + 1 }} de {{ steps().length }}</span>
            <h2 id="tour-title">{{ s.title }}</h2>
            <p>{{ mobile && s.mobileText ? s.mobileText : s.text }}</p>
            @if (s.items) {
              <ul>
                @for (item of s.items; track item.label) {
                  <li>
                    <span class="material-symbols-rounded" aria-hidden="true">{{ item.icon }}</span>
                    <span
                      ><b>{{ item.label }}</b>
                      {{ mobile && item.mobileText ? item.mobileText : item.text }}</span
                    >
                  </li>
                }
              </ul>
            }
          </div>
        }
        <div class="dots" aria-hidden="true">
          @for (s of steps(); track $index) {
            <i [class.on]="$index === index()" [class.done]="$index < index()"></i>
          }
        </div>
        <footer [class.final]="isLast()">
          @if (isLast()) {
            <button class="btn ghost" (click)="finish(false)">Explorar sozinho</button>
            <button class="btn primary" (click)="finish(true)">
              <span class="material-symbols-rounded">add</span> Primeiro lançamento
            </button>
          } @else {
            <button class="skip" (click)="finish(false)">Pular tour</button>
            @if (index() > 0) {
              <button class="icon-button" (click)="back()" aria-label="Voltar">
                <span class="material-symbols-rounded">arrow_back</span>
              </button>
            }
            <button class="btn primary" (click)="next()">
              Próximo <span class="material-symbols-rounded">arrow_forward</span>
            </button>
          }
        </footer>
      </section>
    }
  `,
  styles: `
    .catcher {
      position: fixed;
      inset: 0;
      z-index: 1000;
    }
    .spot {
      position: fixed;
      z-index: 1001;
      border-radius: 20px;
      pointer-events: none;
      box-shadow:
        0 0 0 3px var(--accent),
        0 0 0 9999px rgb(8 10 7 / 62%);
      transition:
        top 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
        left 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
        width 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
        height 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
      animation: dim-in 0.35s ease both;
    }
    .spot:not(.empty)::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: inherit;
      border: 3px solid var(--accent);
      animation: ring 1.8s ease-out infinite;
    }
    .spot.empty {
      box-shadow: 0 0 0 9999px rgb(8 10 7 / 62%);
    }
    .card {
      position: fixed;
      z-index: 1002;
      width: min(360px, calc(100vw - 32px));
      padding: 20px 20px 16px;
      border-radius: 24px;
      background: var(--surface);
      color: var(--ink);
      border: 1px solid var(--line);
      box-shadow: 0 30px 70px -20px rgb(0 0 0 / 55%);
      transition:
        top 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
        left 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
      animation: card-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .content {
      display: grid;
      gap: 6px;
    }
    .badge {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin-bottom: 6px;
      border-radius: 50%;
      font-size: 24px;
      color: var(--accent-ink);
      background: var(--accent);
    }
    .count {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-3);
    }
    h2 {
      margin: 0;
      font:
        800 22px/1.15 'Bricolage Grotesque',
        sans-serif;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      color: var(--ink-2);
      font-size: 14.5px;
      line-height: 1.5;
    }
    ul {
      list-style: none;
      margin: 6px 0 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    li {
      display: flex;
      gap: 10px;
      font-size: 13.5px;
      line-height: 1.4;
      color: var(--ink-2);
    }
    li .material-symbols-rounded {
      flex: none;
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 18px;
      color: var(--brand);
      background: color-mix(in srgb, var(--brand) 12%, var(--surface));
    }
    li b {
      color: var(--ink);
    }
    .dots {
      display: flex;
      gap: 5px;
      margin: 16px 0 12px;
    }
    .dots i {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--line);
      transition:
        width 0.3s,
        background 0.3s;
    }
    .dots i.done {
      background: color-mix(in srgb, var(--accent) 55%, var(--line));
    }
    .dots i.on {
      width: 22px;
      background: var(--accent);
    }
    footer {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    footer .btn {
      height: 42px;
      white-space: nowrap;
    }
    /* Último passo: o convite ocupa a largura toda e "explorar" fica embaixo. */
    footer.final {
      flex-direction: column-reverse;
      align-items: stretch;
    }
    footer.final .btn.btn {
      justify-content: center;
      margin: 0;
    }
    footer .btn.primary {
      margin-left: auto;
    }
    footer .btn .material-symbols-rounded {
      font-size: 19px;
    }
    .skip {
      margin-right: auto;
      padding: 6px 0;
      border: 0;
      background: none;
      color: var(--ink-3);
      font:
        600 13px 'Instrument Sans',
        sans-serif;
      cursor: pointer;
    }
    .skip:hover {
      color: var(--ink);
    }
    .tour-in {
      animation: content-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    @keyframes content-in {
      from {
        opacity: 0;
        transform: translateX(14px);
      }
    }
    @keyframes card-in {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.97);
      }
    }
    @keyframes dim-in {
      from {
        opacity: 0;
      }
    }
    @keyframes ring {
      from {
        opacity: 0.9;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(1.08);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .spot,
      .card {
        transition: none;
      }
      .spot::after {
        animation: none;
      }
    }
  `,
  host: {
    '(document:keydown)': 'onKey($event)',
    '(window:resize)': 'measure()',
    '(window:scroll)': 'measure()',
  },
})
export class Tour {
  protected readonly tour = inject(TourService);
  /** true quando a pessoa escolheu fazer o primeiro lançamento no fim. */
  readonly finished = output<boolean>();

  protected readonly mobile = matchMedia('(max-width: 900px)').matches;
  protected readonly steps = signal<TourStep[]>(
    TOUR_STEPS.filter((s) => !(s.desktopOnly && this.mobile)),
  );
  protected readonly index = signal(0);
  protected readonly step = computed(() => this.steps()[this.index()]);
  protected readonly isLast = computed(() => this.index() === this.steps().length - 1);
  protected readonly spot = signal<Box | null>(null);
  protected readonly centerX = signal(innerWidth / 2);
  protected readonly centerY = signal(innerHeight / 2);

  private readonly card = viewChild<ElementRef<HTMLElement>>('card');
  private readonly cardSize = signal({ width: 360, height: 260 });
  private direction = 1;

  /** Embaixo do alvo se couber; senão em cima; para itens da barra lateral, à direita. */
  protected readonly cardPos = computed(() => {
    const { width, height } = this.cardSize();
    const s = this.spot();
    if (!s) return { top: (innerHeight - height) / 2, left: (innerWidth - width) / 2 };
    const clampX = (x: number) => Math.min(Math.max(x, MARGIN), innerWidth - width - MARGIN);
    const clampY = (y: number) => Math.min(Math.max(y, MARGIN), innerHeight - height - MARGIN);
    const sideFits =
      s.left + s.width + GAP + width + MARGIN <= innerWidth && s.left < innerWidth / 3;
    if (!this.mobile && sideFits && s.height > height * 0.35) {
      return { top: clampY(s.top), left: s.left + s.width + GAP };
    }
    if (s.top + s.height + GAP + height + MARGIN <= innerHeight) {
      return { top: s.top + s.height + GAP, left: clampX(s.left + s.width / 2 - width / 2) };
    }
    if (s.top - GAP - height >= MARGIN) {
      return { top: s.top - GAP - height, left: clampX(s.left + s.width / 2 - width / 2) };
    }
    if (sideFits) return { top: clampY(s.top), left: s.left + s.width + GAP };
    return { top: clampY(innerHeight - height - MARGIN), left: clampX((innerWidth - width) / 2) };
  });

  constructor() {
    // Cada vez que o tour abre, começa do primeiro passo.
    effect(() => {
      if (this.tour.active()) untracked(() => this.go(0));
    });
    // O tamanho do cartão muda com o texto de cada passo: mede depois de desenhar.
    effect(() => {
      this.index();
      const el = this.card()?.nativeElement;
      if (el)
        requestAnimationFrame(() =>
          this.cardSize.set({ width: el.offsetWidth, height: el.offsetHeight }),
        );
    });
  }

  protected next(): void {
    if (this.isLast()) return this.finish(true);
    this.direction = 1;
    this.go(this.index() + 1);
  }

  protected back(): void {
    this.direction = -1;
    this.go(Math.max(0, this.index() - 1));
  }

  protected finish(firstEntry: boolean): void {
    this.tour.stop();
    this.finished.emit(firstEntry);
  }

  protected onKey(event: KeyboardEvent): void {
    if (!this.tour.active()) return;
    if (event.key === 'Escape') this.finish(false);
    else if (event.key === 'ArrowRight' || event.key === 'Enter') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') this.back();
  }

  /** Recalcula o holofote (rolagem, mudança de tamanho da janela). */
  protected measure(): void {
    if (!this.tour.active()) return;
    this.centerX.set(innerWidth / 2);
    this.centerY.set(innerHeight / 2);
    const el = this.findTarget(this.step());
    if (!el) return this.spot.set(null);
    const r = el.getBoundingClientRect();
    this.spot.set({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
  }

  private go(i: number): void {
    const step = this.steps()[i];
    const el = this.findTarget(step);
    // Alvo que não está na tela (por exemplo, sem dados ainda): pula para o próximo na mesma direção.
    if (step.target && !el) {
      const nextIndex = i + this.direction;
      if (nextIndex >= 0 && nextIndex < this.steps().length) return this.go(nextIndex);
    }
    this.index.set(i);
    if (el && !this.isFixed(el)) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => this.measure(), 450);
    }
    this.measure();
  }

  private findTarget(step: TourStep): HTMLElement | null {
    if (!step.target) return null;
    const all = document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`);
    return (
      [...all].find(
        (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0,
      ) ?? null
    );
  }

  /** Barra lateral, barra de abas e botão flutuante não rolam com a página. */
  private isFixed(el: HTMLElement): boolean {
    for (let node: HTMLElement | null = el; node; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === 'fixed' || position === 'sticky') return true;
    }
    return false;
  }
}
