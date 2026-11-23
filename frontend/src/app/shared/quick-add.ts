import { Component, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { readApiError } from '../core/api-error';
import { CategoryStore } from '../core/category-store';
import { relativeDay } from '../core/dates';
import { formatBRL } from '../core/money';
import { parseQuickAdd } from '../core/quick-add';
import { TransactionEditor } from '../core/transaction-editor';
import { TransactionService } from '../core/transaction.service';
import { CategoryIcon } from './category-icon';

/**
 * Lançamento rápido em linguagem natural: "mercado 230,50 ontem".
 * Enquanto a pessoa digita, mostra o que entendeu; Enter grava, Shift+Enter abre o formulário completo.
 */
@Component({
  selector: 'app-quick-add',
  imports: [CategoryIcon],
  template: `
    <div class="box" [class.focused]="focused()">
      <span class="material-symbols-rounded bolt">bolt</span>
      <input
        #field
        [value]="text()"
        (input)="text.set(field.value)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        (keydown.enter)="submit($event)"
        placeholder="Lançamento rápido: mercado 230,50 ontem"
        aria-label="Lançamento rápido. Escreva descrição, valor e data; Enter grava"
        autocomplete="off"
        [readOnly]="saving()"
      />
      <button
        class="btn primary go"
        (click)="submit()"
        [disabled]="!text().trim() || saving()"
        aria-label="Lançar"
      >
        <span class="material-symbols-rounded">{{
          saving() ? 'hourglass_top' : 'arrow_upward'
        }}</span>
      </button>
    </div>

    @if (text().trim()) {
      <div class="preview" aria-live="polite">
        @let p = parsed();
        @if (p.category; as c) {
          <span class="pill" animate.enter="pop"
            ><app-category-icon [icon]="c.icon" [color]="c.color" [size]="22" /> {{ c.name }}</span
          >
        } @else {
          <span class="pill missing" animate.enter="pop">categoria? use #nome</span>
        }
        @if (p.amount !== null) {
          <span class="pill num" [class.in]="p.category?.type === 'INCOME'" animate.enter="pop">{{
            brl(p.amount)
          }}</span>
        } @else {
          <span class="pill missing" animate.enter="pop">valor?</span>
        }
        <span class="pill" animate.enter="pop">{{ day(p.date) }}</span>
        @if (p.description) {
          <span class="pill desc" animate.enter="pop">“{{ p.description }}”</span>
        }
        <span class="hint"
          ><span class="kbd">Enter</span> lança · <span class="kbd">⇧ Enter</span> detalha</span
        >
      </div>
    }
  `,
  styleUrl: './quick-add.scss',
})
export class QuickAdd {
  private readonly store = inject(CategoryStore);
  private readonly service = inject(TransactionService);
  private readonly editor = inject(TransactionEditor);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly text = signal('');
  protected readonly focused = signal(false);
  protected readonly saving = signal(false);
  protected readonly parsed = computed(() => parseQuickAdd(this.text(), this.store.all()));
  protected readonly brl = formatBRL;

  protected day(iso: string): string {
    return relativeDay(iso);
  }

  submit(event?: Event): void {
    const p = this.parsed();
    if (!this.text().trim()) return;
    const keyboard = event as KeyboardEvent | undefined;
    const draft = {
      description: p.description,
      amount: p.amount ?? undefined,
      date: p.date,
      categoryId: p.category?.id,
    };

    // Faltou algo (ou Shift+Enter): abre o formulário completo já preenchido.
    if (keyboard?.shiftKey || p.amount === null || !p.category || !p.description) {
      this.editor.open(undefined, draft).subscribe((saved) => saved && this.text.set(''));
      return;
    }
    this.saving.set(true);
    this.service
      .create({
        description: p.description,
        amount: p.amount,
        date: p.date,
        categoryId: p.category.id,
      })
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.text.set('');
          this.editor.changed();
          this.snackBar.open(
            `${saved.description} · ${formatBRL(saved.amount)} lançado`,
            undefined,
          );
        },
        error: (e: unknown) => {
          this.saving.set(false);
          this.snackBar.open(readApiError(e).message, 'Fechar');
        },
      });
  }
}
