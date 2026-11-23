import { Component, computed, input, signal } from '@angular/core';
import { fromIsoDate, relativeDay, toIsoDate } from '../core/dates';
import { formatBRL } from '../core/money';
import { DaySpending } from '../core/models';

interface Cell {
  iso: string;
  day: number;
  expense: number;
  income: number;
  /** Intensidade da cor (0–100), proporcional à raiz do gasto: dias pequenos continuam visíveis. */
  heat: number;
  future: boolean;
  today: boolean;
}

/** Calendário do mês em que cada dia ganha a cor do quanto se gastou nele. */
@Component({
  selector: 'app-spend-calendar',
  template: `
    <div class="weekdays" aria-hidden="true">
      @for (w of weekdays; track $index) {
        <span>{{ w }}</span>
      }
    </div>
    <div class="grid" role="grid" aria-label="Gastos por dia">
      @for (blank of blanks(); track $index) {
        <span></span>
      }
      @for (c of cells(); track c.iso) {
        <button
          type="button"
          class="day"
          [style.--p.%]="c.heat"
          [class.future]="c.future"
          [class.today]="c.today"
          [class.has-income]="c.income > 0"
          [class.active]="selected()?.iso === c.iso"
          (mouseenter)="selected.set(c)"
          (focus)="selected.set(c)"
          [attr.aria-label]="describe(c)"
        >
          <span>{{ c.day }}</span>
          @if (c.income > 0) {
            <span class="income-badge material-symbols-rounded" aria-hidden="true">north_east</span>
          }
        </button>
      }
    </div>
    <p class="detail" aria-live="polite">
      @if (selected(); as c) {
        <b>{{ label(c.iso) }}</b>
        @if (c.expense > 0) {
          <span class="out">− {{ brl(c.expense) }}</span>
        }
        @if (c.income > 0) {
          <span class="in">+ {{ brl(c.income) }}</span>
        }
        @if (c.expense === 0 && c.income === 0) {
          <span class="muted">Nenhum lançamento</span>
        }
      } @else if (peak(); as p) {
        <span class="muted">Dia mais pesado:</span> <b>{{ label(p.iso) }}</b>
        <span class="out">− {{ brl(p.expense) }}</span>
      } @else {
        <span class="muted">Nenhum gasto neste mês ainda.</span>
      }
    </p>
    <div class="legend" aria-hidden="true">
      <span><i class="heat"></i> Quanto mais forte, mais se gastou</span>
      <span><i class="ring"></i> Dia com entrada</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .weekdays,
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }
    .weekdays span {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink-3);
      padding-bottom: 6px;
    }
    .day {
      position: relative;
      aspect-ratio: 1;
      border: 0;
      border-radius: 50%;
      cursor: default;
      background: color-mix(in srgb, var(--expense) var(--p), var(--surface-2));
      color: var(--ink);
      font:
        600 12px 'Instrument Sans',
        sans-serif;
      transition:
        transform 0.15s,
        box-shadow 0.15s;
      animation: pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .day:hover,
    .day.active {
      transform: scale(1.08);
      box-shadow: 0 0 0 2px var(--ink);
      z-index: 1;
    }
    .day.future {
      opacity: 0.35;
    }
    .day.today::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 4px;
      width: 12px;
      height: 2.5px;
      border-radius: 2px;
      background: var(--ink);
      transform: translateX(-50%);
    }
    .day.today {
      font-weight: 800;
    }
    /* Dia de entrada: anel verde e um selo com seta, bem visível mesmo em dia sem gasto. */
    .day.has-income {
      box-shadow: inset 0 0 0 2.5px var(--income);
    }
    .income-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      display: grid;
      place-items: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--income);
      color: var(--brand-ink);
      font-size: 13px;
      font-variation-settings: 'wght' 700;
      box-shadow: 0 0 0 2px var(--surface);
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 16px;
      margin-top: 10px;
      font-size: 12px;
      color: var(--ink-3);
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .legend i {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
    .legend .heat {
      width: 34px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--surface-2), var(--expense));
    }
    .legend .ring {
      box-shadow: inset 0 0 0 2.5px var(--income);
    }
    .detail {
      margin: 14px 0 0;
      min-height: 22px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: baseline;
    }
    .out {
      color: var(--expense);
      font-weight: 600;
    }
    .in {
      color: var(--income);
      font-weight: 600;
    }
    .muted {
      color: var(--ink-2);
    }
  `,
})
export class SpendCalendar {
  readonly daily = input.required<DaySpending[]>();

  protected readonly weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  protected readonly selected = signal<Cell | null>(null);
  protected readonly brl = formatBRL;
  private readonly todayIso = toIsoDate(new Date());

  protected readonly blanks = computed(() => {
    const first = this.daily()?.[0];
    return first ? Array.from({ length: fromIsoDate(first.date).getDay() }) : [];
  });

  protected readonly cells = computed<Cell[]>(() => {
    const days = this.daily() ?? [];
    const max = Math.max(1, ...days.map((d) => d.expense));
    return days.map((d) => ({
      iso: d.date,
      day: fromIsoDate(d.date).getDate(),
      expense: d.expense,
      income: d.income,
      heat: d.expense > 0 ? Math.round(12 + Math.sqrt(d.expense / max) * 78) : 0,
      future: d.date > this.todayIso,
      today: d.date === this.todayIso,
    }));
  });

  protected readonly peak = computed(() => {
    const top = [...this.cells()].sort((a, b) => b.expense - a.expense)[0];
    return top && top.expense > 0 ? top : null;
  });

  protected label(iso: string): string {
    return relativeDay(iso);
  }

  protected describe(c: Cell): string {
    return `${relativeDay(c.iso)}: saídas ${formatBRL(c.expense)}, entradas ${formatBRL(c.income)}`;
  }
}
