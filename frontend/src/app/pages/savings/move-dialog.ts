import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { readApiError } from '../../core/api-error';
import { formatBRL } from '../../core/money';
import { SavingsGoal } from '../../core/models';
import { parseMoney } from '../../core/quick-add';
import { SavingsService } from '../../core/savings.service';

export interface MoveDialogData {
  goal: SavingsGoal;
  kind: 'DEPOSIT' | 'WITHDRAW';
}

/** Guardar ou resgatar dinheiro de um cofrinho, com atalhos de valor. */
@Component({
  selector: 'app-move-dialog',
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <form class="box" (submit)="save($event)" [attr.data-kind]="data.kind">
      <span class="eyebrow">{{ deposit ? 'Guardar em' : 'Resgatar de' }}</span>
      <h2>{{ data.goal.name }}</h2>
      <label class="amount">
        <span class="currency">R$</span>
        <input
          [formControl]="amount"
          inputmode="decimal"
          placeholder="0,00"
          autocomplete="off"
          cdkFocusInitial
          aria-label="Valor"
        />
      </label>
      <div class="quick">
        @for (v of shortcuts(); track v.label) {
          <button type="button" class="chip-button" (click)="amount.setValue(v.value)">
            {{ v.label }}
          </button>
        }
      </div>
      <p class="hint">
        @if (deposit) {
          Depois disso: <b class="num">{{ brl(after()) }}</b> de {{ brl(data.goal.target) }}
        } @else {
          Disponível para resgatar: <b class="num">{{ brl(data.goal.saved) }}</b>
        }
      </p>
      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
      <footer>
        <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
        <button type="submit" class="btn primary go" [disabled]="saving() || value() <= 0">
          {{ saving() ? 'Salvando…' : deposit ? 'Guardar' : 'Resgatar' }}
        </button>
      </footer>
    </form>
  `,
  styles: `
    .box {
      display: grid;
      gap: 12px;
      padding: 26px;
      width: min(400px, 92vw);
      --tone: var(--income);
    }
    .box[data-kind='WITHDRAW'] {
      --tone: var(--expense);
    }
    h2 {
      font-size: 24px;
      margin-top: -6px;
    }
    .amount {
      display: flex;
      align-items: baseline;
      gap: 8px;
      border-bottom: 2px solid var(--line);
      padding-bottom: 8px;
    }
    .amount:focus-within {
      border-color: var(--tone);
    }
    .currency {
      font:
        600 22px 'Bricolage Grotesque',
        sans-serif;
      color: var(--ink-3);
    }
    input {
      width: 100%;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--tone);
      font:
        700 44px/1.1 'Bricolage Grotesque',
        sans-serif;
      font-variant-numeric: tabular-nums;
    }
    input::placeholder {
      color: var(--surface-3);
    }
    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .hint {
      margin: 0;
      color: var(--ink-2);
    }
    .error {
      margin: 0;
      color: var(--expense);
      font-weight: 500;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }
    .go {
      background: var(--tone);
      color: var(--brand-ink);
    }
  `,
})
export class MoveDialog {
  private readonly ref = inject(MatDialogRef<MoveDialog, SavingsGoal>);
  private readonly savings = inject(SavingsService);
  protected readonly data = inject<MoveDialogData>(MAT_DIALOG_DATA);
  protected readonly deposit = this.data.kind === 'DEPOSIT';
  protected readonly amount = new FormControl('', { nonNullable: true });
  private readonly text = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly brl = formatBRL;

  protected readonly value = computed(() =>
    /^\d[\d.]*(,\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(this.text().trim())
      ? parseMoney(this.text().trim())
      : 0,
  );
  protected readonly after = computed(() => this.data.goal.saved + this.value());
  protected readonly shortcuts = computed(() => {
    const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    if (!this.deposit) return [{ label: 'Tudo', value: fmt(this.data.goal.saved) }];
    const list = [50, 100, 500].map((n) => ({ label: `+ R$ ${n}`, value: fmt(n) }));
    if (this.data.goal.monthlyNeeded)
      list.push({ label: 'Valor do mês', value: fmt(this.data.goal.monthlyNeeded) });
    return list;
  });

  constructor() {
    this.amount.valueChanges.subscribe((v) => this.text.set(v));
  }

  save(event?: Event): void {
    // Formulário sem FormGroup: impede o envio nativo (que recarregaria a página).
    event?.preventDefault();
    if (this.value() <= 0) return;
    this.saving.set(true);
    this.error.set(null);
    this.savings.move(this.data.goal.id, this.value(), this.data.kind).subscribe({
      next: (updated) => this.ref.close(updated),
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.saving.set(false);
      },
    });
  }
}
