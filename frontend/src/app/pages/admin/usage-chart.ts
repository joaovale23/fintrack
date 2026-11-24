import { Component, computed, input, signal } from '@angular/core';
import { UsageDay } from '../../core/support.service';

const W = 900;
const H = 200;
const PAD = { top: 16, right: 8, bottom: 26, left: 8 };

/** Últimos 30 dias: contas reais ativas (verde) empilhadas com visitantes (dourado); bolinha = cadastro novo. */
@Component({
  selector: 'app-usage-chart',
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + W + ' ' + H"
      role="img"
      aria-label="Uso nos últimos 30 dias"
      (mouseleave)="hover.set(null)"
    >
      <line
        class="base"
        [attr.x1]="PAD.left"
        [attr.x2]="W - PAD.right"
        [attr.y1]="baseY"
        [attr.y2]="baseY"
      />
      @for (d of days(); track d.date; let i = $index) {
        <g [class.dim]="hover() !== null && hover() !== i" (mouseenter)="hover.set(i)">
          <rect
            class="hit"
            [attr.x]="x(i)"
            [attr.y]="PAD.top"
            [attr.width]="slot()"
            [attr.height]="baseY - PAD.top"
          />
          <rect
            class="visitors"
            [attr.x]="x(i) + gap()"
            [attr.width]="bar()"
            [attr.y]="baseY - h(d.active + d.visitors)"
            [attr.height]="h(d.visitors)"
            rx="3"
          />
          <rect
            class="active"
            [attr.x]="x(i) + gap()"
            [attr.width]="bar()"
            [attr.y]="baseY - h(d.active)"
            [attr.height]="h(d.active)"
            rx="3"
          />
          @if (d.signups) {
            <circle
              class="signup"
              [attr.cx]="x(i) + slot() / 2"
              [attr.cy]="baseY - h(d.active + d.visitors) - 9"
              r="4"
            />
          }
          @if (i % 5 === 4 || i === days().length - 1) {
            <text class="axis" [attr.x]="x(i) + slot() / 2" [attr.y]="H - 6" text-anchor="middle">
              {{ label(d.date) }}
            </text>
          }
        </g>
      }
    </svg>
    <p class="hover-line" aria-live="polite">
      @if (hover() !== null) {
        @let d = days()[hover()!];
        <b>{{ label(d.date) }}</b>: {{ d.active }} {{ d.active === 1 ? 'pessoa' : 'pessoas' }} com
        conta, {{ d.visitors }} {{ d.visitors === 1 ? 'visitante' : 'visitantes'
        }}{{
          d.signups
            ? ', ' + d.signups + (d.signups === 1 ? ' cadastro novo' : ' cadastros novos')
            : ''
        }}
      } @else {
        <span class="legend"
          ><i class="active"></i> com conta <i class="visitors"></i> visitantes
          <i class="signup"></i> cadastro novo</span
        >
      }
    </p>
  `,
  styles: `
    :host {
      display: block;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .base {
      stroke: var(--line);
    }
    .hit {
      fill: transparent;
    }
    .active {
      fill: var(--brand);
      transition: opacity 0.2s;
    }
    .visitors {
      fill: var(--goal);
      opacity: 0.75;
      transition: opacity 0.2s;
    }
    .signup {
      fill: var(--accent);
      stroke: var(--surface);
      stroke-width: 2;
    }
    .dim .active,
    .dim .visitors {
      opacity: 0.35;
    }
    .axis {
      font:
        12px 'Instrument Sans',
        sans-serif;
      fill: var(--ink-3);
    }
    rect.active,
    rect.visitors {
      animation: grow 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      transform-box: fill-box;
      transform-origin: bottom;
    }
    .hover-line {
      margin: 6px 0 0;
      font-size: 13px;
      color: var(--ink-2);
      min-height: 18px;
    }
    .legend {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .legend i {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 3px;
      margin-left: 8px;
    }
    .legend i:first-child {
      margin-left: 0;
    }
    .legend i.active {
      background: var(--brand);
    }
    .legend i.visitors {
      background: var(--goal);
    }
    .legend i.signup {
      background: var(--accent);
      border-radius: 50%;
    }
    @keyframes grow {
      from {
        transform: scaleY(0);
      }
    }
  `,
})
export class UsageChart {
  readonly days = input.required<UsageDay[]>();

  protected readonly W = W;
  protected readonly H = H;
  protected readonly PAD = PAD;
  protected readonly baseY = H - PAD.bottom;
  protected readonly hover = signal<number | null>(null);

  protected readonly slot = computed(
    () => (W - PAD.left - PAD.right) / Math.max(this.days().length, 1),
  );
  protected readonly gap = computed(() => this.slot() * 0.18);
  protected readonly bar = computed(() => this.slot() - this.gap() * 2);
  private readonly top = computed(() =>
    Math.max(2, ...this.days().map((d) => d.active + d.visitors)),
  );

  protected x(i: number): number {
    return PAD.left + i * this.slot();
  }

  /** Altura proporcional, deixando espaço em cima para a bolinha de cadastro. */
  protected h(value: number): number {
    return (value / this.top()) * (this.baseY - PAD.top - 16);
  }

  protected label(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }
}
