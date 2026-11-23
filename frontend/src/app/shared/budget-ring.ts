import { Component, computed, input } from '@angular/core';

/** Anel de progresso da meta: verde até 75%, amarelo até 100%, vermelho quando estoura. */
@Component({
  selector: 'app-budget-ring',
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="track" cx="50" cy="50" r="42" />
      <circle
        class="value"
        cx="50"
        cy="50"
        r="42"
        pathLength="100"
        [style.stroke-dasharray]="dash()"
      />
    </svg>
    <span class="label num">{{ percent() }}<small>%</small></span>
  `,
  host: { '[attr.data-state]': 'state()', '[style.--size.px]': 'size()' },
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      place-items: center;
      width: var(--size);
      height: var(--size);
      flex: none;
    }
    svg {
      position: absolute;
      inset: 0;
      transform: rotate(-90deg);
    }
    circle {
      fill: none;
      stroke-width: 9;
      stroke-linecap: round;
    }
    .track {
      stroke: var(--surface-2);
    }
    .value {
      stroke: var(--brand);
      transition: stroke-dasharray 1s cubic-bezier(0.2, 0.8, 0.2, 1);
      animation: ring-in 1.1s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    :host([data-state='near']) .value {
      stroke: var(--goal);
    }
    :host([data-state='over']) .value {
      stroke: var(--expense);
    }
    :host([data-state='over']) .label {
      color: var(--expense);
    }
    .label {
      font-size: calc(var(--size) * 0.24);
      font-weight: 700;
    }
    small {
      font-size: 0.55em;
      font-weight: 600;
      margin-left: 1px;
    }
    @keyframes ring-in {
      from {
        stroke-dasharray: 0 100;
      }
    }
  `,
})
export class BudgetRing {
  readonly percent = input.required<number>();
  readonly size = input(76);

  protected readonly dash = computed(() => `${Math.min(this.percent(), 100)} 100`);
  protected readonly state = computed(() =>
    this.percent() > 100 ? 'over' : this.percent() >= 75 ? 'near' : 'ok',
  );
}
