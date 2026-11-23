import { Component, computed, linkedSignal, model } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { addMonths, monthLabel, toYearMonth } from '../core/dates';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Seletor de mês em forma de pílula, com two-way binding: [(month)].
 * As setas andam um mês; clicar no nome abre um painel com o ano e os 12 meses para pular direto.
 */
@Component({
  selector: 'app-month-switcher',
  imports: [MatMenuModule],
  template: `
    <button type="button" class="icon-button" (click)="shift(-1)" aria-label="Mês anterior">
      <span class="material-symbols-rounded">chevron_left</span>
    </button>
    <button
      type="button"
      class="label"
      [matMenuTriggerFor]="picker"
      aria-label="Escolher mês"
      (menuOpened)="year.set(selectedYear())"
    >
      <span aria-live="polite">{{ label() }}</span>
      <span class="material-symbols-rounded caret">expand_more</span>
    </button>
    <button type="button" class="icon-button" (click)="shift(1)" aria-label="Próximo mês">
      <span class="material-symbols-rounded">chevron_right</span>
    </button>
    @if (!isCurrent()) {
      <button type="button" class="today" (click)="month.set(current)" animate.enter="pop">
        Hoje
      </button>
    }

    <mat-menu #picker="matMenu" class="month-menu" xPosition="after">
      <div class="panel" (keydown.arrowleft)="$event.stopPropagation()">
        <div class="year">
          <button
            type="button"
            class="icon-button"
            (click)="$event.stopPropagation(); year.set(year() - 1)"
            aria-label="Ano anterior"
          >
            <span class="material-symbols-rounded">chevron_left</span>
          </button>
          <b>{{ year() }}</b>
          <button
            type="button"
            class="icon-button"
            (click)="$event.stopPropagation(); year.set(year() + 1)"
            aria-label="Próximo ano"
          >
            <span class="material-symbols-rounded">chevron_right</span>
          </button>
        </div>
        <div class="grid">
          @for (m of months; track $index; let i = $index) {
            <button
              type="button"
              mat-menu-item
              class="month"
              [class.selected]="key(i) === month()"
              [class.now]="key(i) === current"
              (click)="month.set(key(i))"
            >
              {{ m }}
            </button>
          }
        </div>
      </div>
    </mat-menu>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 4px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--line);
    }
    .icon-button {
      width: 34px;
      height: 34px;
      border-radius: 50%;
    }
    .label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-width: 160px;
      height: 34px;
      padding: 0 8px 0 14px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--ink);
      font:
        600 14px 'Instrument Sans',
        sans-serif;
      cursor: pointer;
      transition: background 0.2s;
    }
    .label:hover,
    .label[aria-expanded='true'] {
      background: var(--surface-2);
    }
    .caret {
      font-size: 18px;
      color: var(--ink-3);
      transition: transform 0.25s;
    }
    .label[aria-expanded='true'] .caret {
      transform: rotate(180deg);
    }
    .today {
      border: 0;
      border-radius: 999px;
      padding: 0 12px;
      height: 34px;
      margin-left: 2px;
      background: var(--brand-soft);
      color: var(--ink);
      font:
        600 12px 'Instrument Sans',
        sans-serif;
      cursor: pointer;
    }
    .panel {
      padding: 6px 10px 10px;
      width: 260px;
    }
    .year {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .year b {
      font:
        700 18px 'Bricolage Grotesque',
        sans-serif;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .month {
      position: relative;
      min-height: 40px;
      padding: 0;
      justify-content: center;
      border-radius: 999px;
      font:
        600 14px 'Instrument Sans',
        sans-serif;
      text-transform: capitalize;
    }
    .month.selected {
      background: var(--brand);
      color: var(--brand-ink);
    }
    .month.now:not(.selected)::after {
      content: '';
      position: absolute;
      bottom: 5px;
      left: 50%;
      width: 5px;
      height: 5px;
      margin-left: -2.5px;
      border-radius: 50%;
      background: var(--goal);
    }
  `,
})
export class MonthSwitcher {
  readonly month = model.required<string>();
  protected readonly months = MONTHS;
  protected readonly current = toYearMonth(new Date());
  protected readonly label = computed(() => monthLabel(this.month()));
  protected readonly isCurrent = computed(() => this.month() === this.current);
  protected readonly selectedYear = computed(() => Number(this.month().slice(0, 4)));
  /** Ano mostrado no painel: segue o mês escolhido, mas pode ser navegado à parte (linkedSignal). */
  protected readonly year = linkedSignal(() => this.selectedYear());

  protected key(index: number): string {
    return `${this.year()}-${String(index + 1).padStart(2, '0')}`;
  }

  shift(delta: number): void {
    this.month.update((m) => addMonths(m, delta));
  }
}
