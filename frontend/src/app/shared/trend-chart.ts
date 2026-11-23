import { Component, computed, input, signal } from '@angular/core';
import { monthLabel } from '../core/dates';
import { formatBRL, formatCompact } from '../core/money';
import { MonthTrend } from '../core/models';

const W = 900;
const H = 250;
const PAD = { top: 16, right: 16, bottom: 30, left: 48 };

interface Point {
  x: number;
  y: number;
}

/**
 * Evolução de entradas e saídas em curvas suaves, com área preenchida, desenho animado
 * e uma régua que acompanha o mouse mostrando os valores do mês.
 */
@Component({
  selector: 'app-trend-chart',
  template: `
    <div class="wrap">
      <svg
        [attr.viewBox]="'0 0 ' + W + ' ' + H"
        role="img"
        [attr.aria-label]="'Entradas e saídas dos últimos ' + data().length + ' meses'"
        (mouseleave)="active.set(null)"
      >
        <defs>
          <linearGradient id="g-in" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--income)" stop-opacity="0.28" />
            <stop offset="100%" stop-color="var(--income)" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="g-out" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--expense)" stop-opacity="0.22" />
            <stop offset="100%" stop-color="var(--expense)" stop-opacity="0" />
          </linearGradient>
        </defs>

        @for (t of ticks(); track t.y) {
          <line
            class="grid"
            [attr.x1]="PAD.left"
            [attr.x2]="W - PAD.right"
            [attr.y1]="t.y"
            [attr.y2]="t.y"
          />
          <text class="axis" [attr.x]="PAD.left - 10" [attr.y]="t.y + 4" text-anchor="end">
            {{ t.label }}
          </text>
        }

        <path class="area" [attr.d]="incomeArea()" fill="url(#g-in)" />
        <path class="area" [attr.d]="expenseArea()" fill="url(#g-out)" />
        <path class="line income" [attr.d]="incomeLine()" pathLength="1" />
        <path class="line expense" [attr.d]="expenseLine()" pathLength="1" />

        @for (p of points(); track p.label; let i = $index) {
          <text
            class="axis"
            [attr.x]="p.x"
            [attr.y]="H - 8"
            text-anchor="middle"
            [class.strong]="active() === i"
          >
            {{ p.label }}
          </text>
          <rect
            class="hit"
            [attr.x]="p.x - colW() / 2"
            [attr.y]="PAD.top"
            [attr.width]="colW()"
            [attr.height]="H - PAD.top - PAD.bottom"
            (mouseenter)="active.set(i)"
          />
        }

        @if (active() !== null) {
          @let p = points()[active()!];
          <line
            class="guide"
            [attr.x1]="p.x"
            [attr.x2]="p.x"
            [attr.y1]="PAD.top"
            [attr.y2]="H - PAD.bottom"
          />
          <circle class="dot income" [attr.cx]="p.x" [attr.cy]="p.inY" r="5" />
          <circle class="dot expense" [attr.cx]="p.x" [attr.cy]="p.outY" r="5" />
        }
      </svg>

      @if (active() !== null) {
        @let p = points()[active()!];
        <div class="tip" [style.left.%]="(p.x / W) * 100" animate.enter="pop">
          <b>{{ p.full }}</b>
          <span class="in">Entradas {{ brl(p.income) }}</span>
          <span class="out">Saídas {{ brl(p.expense) }}</span>
        </div>
      }
    </div>
    <div class="legend">
      <span><i class="income"></i> Entradas</span>
      <span><i class="expense"></i> Saídas</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .wrap {
      position: relative;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
      overflow: visible;
    }
    .grid {
      stroke: var(--line);
      stroke-dasharray: 3 5;
    }
    .axis {
      font:
        12px 'Instrument Sans',
        sans-serif;
      fill: var(--ink-3);
    }
    .axis.strong {
      fill: var(--ink);
      font-weight: 700;
    }
    .line {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 1;
      animation: line-draw 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .line.income {
      stroke: var(--income);
    }
    .line.expense {
      stroke: var(--expense);
      animation-delay: 0.15s;
    }
    .area {
      animation: fade 1s ease 0.4s both;
    }
    .hit {
      fill: transparent;
    }
    .guide {
      stroke: var(--ink-3);
      stroke-dasharray: 2 4;
    }
    .dot {
      stroke: var(--surface);
      stroke-width: 3;
    }
    .dot.income {
      fill: var(--income);
    }
    .dot.expense {
      fill: var(--expense);
    }
    .tip {
      position: absolute;
      top: -6px;
      transform: translateX(-50%);
      pointer-events: none;
      display: grid;
      gap: 2px;
      padding: 10px 12px;
      border-radius: 14px;
      white-space: nowrap;
      background: var(--contrast-bg);
      color: var(--contrast-fg);
      font-size: 13px;
      box-shadow: var(--shadow);
    }
    .tip .in {
      color: color-mix(in srgb, var(--income) 70%, var(--bg));
    }
    .tip .out {
      color: color-mix(in srgb, var(--expense) 70%, var(--bg));
    }
    .legend {
      display: flex;
      gap: 18px;
      justify-content: center;
      font-size: 13px;
      color: var(--ink-2);
      margin-top: 6px;
    }
    .legend i {
      display: inline-block;
      width: 18px;
      height: 4px;
      border-radius: 4px;
      margin-right: 6px;
      vertical-align: middle;
    }
    .legend .income {
      background: var(--income);
    }
    .legend .expense {
      background: var(--expense);
    }
    @keyframes line-draw {
      from {
        stroke-dashoffset: 1;
      }
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
  `,
})
export class TrendChart {
  readonly data = input.required<MonthTrend[]>();

  protected readonly W = W;
  protected readonly H = H;
  protected readonly PAD = PAD;
  protected readonly active = signal<number | null>(null);
  protected readonly brl = formatBRL;

  private readonly max = computed(() =>
    niceMax(Math.max(1, ...this.data().flatMap((d) => [d.income, d.expense]))),
  );
  protected readonly colW = computed(
    () => (W - PAD.left - PAD.right) / Math.max(this.data().length, 1),
  );

  protected readonly points = computed(() => {
    const n = this.data().length;
    const innerW = W - PAD.left - PAD.right;
    return this.data().map((d, i) => ({
      x: PAD.left + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1)),
      inY: this.y(d.income),
      outY: this.y(d.expense),
      income: d.income,
      expense: d.expense,
      label: monthLabel(d.month, 'short'),
      full: monthLabel(d.month),
    }));
  });

  protected readonly ticks = computed(() =>
    [0, 0.5, 1].map((f) => ({
      y: this.y(this.max() * f),
      label: f === 0 ? '0' : formatCompact(this.max() * f),
    })),
  );

  protected readonly incomeLine = computed(() =>
    smooth(this.points().map((p) => ({ x: p.x, y: p.inY }))),
  );
  protected readonly expenseLine = computed(() =>
    smooth(this.points().map((p) => ({ x: p.x, y: p.outY }))),
  );
  protected readonly incomeArea = computed(() => this.area(this.incomeLine()));
  protected readonly expenseArea = computed(() => this.area(this.expenseLine()));

  private y(value: number): number {
    return PAD.top + (1 - value / this.max()) * (H - PAD.top - PAD.bottom);
  }

  private area(line: string): string {
    const pts = this.points();
    if (!pts.length) return '';
    const base = H - PAD.bottom;
    return `${line} L${pts.at(-1)!.x},${base} L${pts[0].x},${base} Z`;
  }
}

/** Arredonda o topo do eixo para um número "bonito" (1, 2 ou 5 × 10ⁿ). */
export function niceMax(value: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}

/** Curva suave passando pelos pontos (Catmull-Rom convertido em Bézier cúbica). */
export function smooth(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
}
