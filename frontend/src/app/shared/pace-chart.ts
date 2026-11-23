import { Component, computed, input, signal } from '@angular/core';
import { toIsoDate } from '../core/dates';
import { formatBRL, formatCompact } from '../core/money';
import { DaySpending } from '../core/models';
import { EmptyState } from './empty-state';

const W = 900;
const H = 230;
const PAD = { top: 22, right: 70, bottom: 26, left: 52 };

export interface Pace {
  /** Saldo acumulado em cada dia já vivido do mês. */
  actual: number[];
  /** Projeção do hoje até o último dia (vazia se o mês já acabou). */
  projected: number[];
  final: number;
  averageDailyExpense: number;
  isProjection: boolean;
}

/**
 * Calcula o saldo acumulado dia a dia e, no mês corrente, projeta o fim do mês
 * mantendo o gasto médio diário até hoje.
 */
export function computePace(daily: DaySpending[], today = new Date()): Pace {
  const todayIso = toIsoDate(today);
  const lived = daily.filter((d) => d.date <= todayIso);
  const actual: number[] = [];
  let running = 0;
  for (const d of lived) {
    running += d.income - d.expense;
    actual.push(Math.round(running * 100) / 100);
  }
  const spent = lived.reduce((s, d) => s + d.expense, 0);
  const averageDailyExpense = lived.length ? spent / lived.length : 0;
  const daysLeft = daily.length - lived.length;
  const isProjection = daysLeft > 0 && lived.length > 0;
  const projected = isProjection
    ? Array.from(
        { length: daysLeft + 1 },
        (_, i) => Math.round((running - averageDailyExpense * i) * 100) / 100,
      )
    : [];
  return {
    actual,
    projected,
    final: isProjection ? projected.at(-1)! : running,
    averageDailyExpense,
    isProjection,
  };
}

/** "Ritmo do mês": o saldo acumulado em linha cheia e a projeção tracejada até o fim do mês. */
@Component({
  selector: 'app-pace-chart',
  imports: [EmptyState],
  template: `
    @let p = pace();
    @if (!hasMovement()) {
      <app-empty-state
        art="pace"
        [compact]="true"
        title="Sem movimento ainda"
        text="Quando houver entradas e saídas, o saldo de cada dia e a projeção do fim do mês aparecem aqui."
      />
    } @else {
      <p class="headline">
        @if (p.isProjection) {
          No ritmo atual, você termina o mês com
          <b class="num" [class.neg]="p.final < 0"
            >{{ p.final < 0 ? '−' : '' }}{{ brl(abs(p.final)) }}</b
          >
        } @else if (p.actual.length) {
          O mês terminou com
          <b class="num" [class.neg]="p.final < 0"
            >{{ p.final < 0 ? '−' : '' }}{{ brl(abs(p.final)) }}</b
          >
        }
      </p>
      @if (p.actual.length) {
        <p class="sub">
          Gasto médio de <b class="num">{{ brl(p.averageDailyExpense) }}</b> por dia
        </p>
        <svg
          [attr.viewBox]="'0 0 ' + W + ' ' + H"
          role="img"
          aria-label="Saldo acumulado ao longo do mês"
          (mouseleave)="hover.set(null)"
        >
          <line
            class="zero"
            [attr.x1]="PAD.left"
            [attr.x2]="W - PAD.right"
            [attr.y1]="y(0)"
            [attr.y2]="y(0)"
          />
          <text class="axis" [attr.x]="PAD.left - 10" [attr.y]="y(0) + 4" text-anchor="end">0</text>
          <text class="axis" [attr.x]="PAD.left - 10" [attr.y]="y(top()) + 4" text-anchor="end">
            {{ compact(top()) }}
          </text>
          @if (bottom() < 0) {
            <text
              class="axis"
              [attr.x]="PAD.left - 10"
              [attr.y]="y(bottom()) + 4"
              text-anchor="end"
            >
              −{{ compact(-bottom()) }}
            </text>
          }
          <path class="area" [attr.d]="area()" />
          <path class="line" [attr.d]="actualPath()" pathLength="1" />
          @if (p.isProjection) {
            <path class="line projected" [attr.d]="projectedPath()" [class.neg]="p.final < 0" />
            <circle
              class="today"
              [attr.cx]="x(p.actual.length - 1)"
              [attr.cy]="y(p.actual.at(-1)!)"
              r="6"
            />
            <circle
              class="pulse"
              [attr.cx]="x(p.actual.length - 1)"
              [attr.cy]="y(p.actual.at(-1)!)"
              r="6"
            />
          }
          <circle
            class="end"
            [class.neg]="p.final < 0"
            [attr.cx]="x(days() - 1)"
            [attr.cy]="y(p.final)"
            r="5"
          />
          <text class="end-label num" [attr.x]="x(days() - 1) + 10" [attr.y]="y(p.final) + 5">
            {{ compact(p.final) }}
          </text>
          @for (d of dayIndexes(); track d) {
            <rect
              class="hit"
              [attr.x]="x(d) - colW() / 2"
              [attr.y]="PAD.top"
              [attr.width]="colW()"
              [attr.height]="H - PAD.top - PAD.bottom"
              (mouseenter)="hover.set(d)"
            />
          }
          @if (hover() !== null) {
            <line
              class="guide"
              [attr.x1]="x(hover()!)"
              [attr.x2]="x(hover()!)"
              [attr.y1]="PAD.top"
              [attr.y2]="H - PAD.bottom"
            />
          }
          @for (d of [1, 10, 20, days()]; track d) {
            <text class="axis" [attr.x]="x(d - 1)" [attr.y]="H - 6" text-anchor="middle">
              {{ d }}
            </text>
          }
        </svg>
        <p class="hover-line" aria-live="polite">
          @if (hover() !== null) {
            Dia {{ hover()! + 1 }}: saldo <b class="num">{{ brl(valueAt(hover()!)) }}</b>
            {{ hover()! >= p.actual.length ? '(projeção)' : '' }}
          } @else {
            &nbsp;
          }
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .headline {
      margin: 0;
      font:
        600 22px/1.25 'Bricolage Grotesque',
        sans-serif;
      letter-spacing: -0.02em;
    }
    .headline b {
      color: var(--income);
      font-weight: 800;
    }
    .headline b.neg {
      color: var(--expense);
    }
    .sub {
      margin: 4px 0 6px;
      color: var(--ink-2);
      font-size: 14px;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
      overflow: visible;
    }
    .zero {
      stroke: var(--ink-3);
      stroke-dasharray: 2 5;
    }
    .axis {
      font:
        12px 'Instrument Sans',
        sans-serif;
      fill: var(--ink-3);
    }
    .area {
      fill: color-mix(in srgb, var(--brand) 14%, transparent);
      animation: fade 1s 0.3s both;
    }
    .line {
      fill: none;
      stroke: var(--brand);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      animation: draw 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .line.projected {
      stroke-dasharray: 2 7;
      animation: fade 0.8s 1.2s both;
      stroke: var(--goal);
    }
    .line.projected.neg {
      stroke: var(--expense);
    }
    .today {
      fill: var(--brand);
      stroke: var(--surface);
      stroke-width: 3;
    }
    .pulse {
      fill: none;
      stroke: var(--brand);
      stroke-width: 2;
      transform-box: fill-box;
      transform-origin: center;
      animation: pulse 2s ease-out infinite;
    }
    .end {
      fill: var(--goal);
    }
    .end.neg {
      fill: var(--expense);
    }
    .end-label {
      font-size: 13px;
      font-weight: 700;
      fill: var(--ink);
    }
    .hit {
      fill: transparent;
    }
    .guide {
      stroke: var(--ink-3);
      stroke-dasharray: 2 4;
    }
    .hover-line {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--ink-2);
      min-height: 18px;
    }
    @keyframes draw {
      from {
        stroke-dashoffset: 1;
      }
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes pulse {
      from {
        transform: scale(1);
        opacity: 0.8;
      }
      to {
        transform: scale(3.2);
        opacity: 0;
      }
    }
  `,
})
export class PaceChart {
  readonly daily = input.required<DaySpending[]>();

  protected readonly W = W;
  protected readonly H = H;
  protected readonly PAD = PAD;
  protected readonly hover = signal<number | null>(null);
  protected readonly brl = formatBRL;
  protected readonly compact = formatCompact;
  protected readonly abs = Math.abs;

  protected readonly pace = computed(() => computePace(this.daily() ?? []));
  /** Sem nenhuma entrada ou saída no mês, mostra a ilustração em vez de uma linha reta em zero. */
  protected readonly hasMovement = computed(() =>
    (this.daily() ?? []).some((d) => d.income > 0 || d.expense > 0),
  );
  protected readonly days = computed(() => Math.max(this.daily()?.length ?? 0, 1));
  protected readonly dayIndexes = computed(() => Array.from({ length: this.days() }, (_, i) => i));
  protected readonly colW = computed(() => (W - PAD.left - PAD.right) / this.days());

  private readonly values = computed(() => [
    ...this.pace().actual,
    ...this.pace().projected.slice(1),
  ]);
  protected readonly top = computed(() => Math.max(1, ...this.values()));
  protected readonly bottom = computed(() => Math.min(0, ...this.values()));

  /** Linha reta entre os dias: saldo acumulado não deve "inventar" picos como uma curva suavizada faria. */
  protected readonly actualPath = computed(() =>
    this.pace()
      .actual.map((v, i) => `${i === 0 ? 'M' : 'L'}${this.x(i)},${this.y(v)}`)
      .join(' '),
  );
  protected readonly projectedPath = computed(() => {
    const start = this.pace().actual.length - 1;
    return this.pace()
      .projected.map((v, i) => `${i === 0 ? 'M' : 'L'}${this.x(start + i)},${this.y(v)}`)
      .join(' ');
  });
  protected readonly area = computed(() => {
    const a = this.pace().actual;
    if (!a.length) return '';
    return `${this.actualPath()} L${this.x(a.length - 1)},${this.y(0)} L${this.x(0)},${this.y(0)} Z`;
  });

  x(dayIndex: number): number {
    const inner = W - PAD.left - PAD.right;
    return PAD.left + (this.days() === 1 ? 0 : (inner * dayIndex) / (this.days() - 1));
  }

  y(value: number): number {
    const span = this.top() - this.bottom() || 1;
    return PAD.top + ((this.top() - value) / span) * (H - PAD.top - PAD.bottom);
  }

  protected valueAt(index: number): number {
    return this.values()[index] ?? 0;
  }
}
