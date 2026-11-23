import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { filter, switchMap } from 'rxjs';
import { readApiError } from '../../core/api-error';
import { CategoryStore } from '../../core/category-store';
import { addMonths, fromIsoDate, toIsoDate, toYearMonth } from '../../core/dates';
import { CategoryType, Transaction, TransactionInput } from '../../core/models';
import { parseMoney } from '../../core/quick-add';
import { RecurringService } from '../../core/recurring.service';
import { TransactionService } from '../../core/transaction.service';
import { CategoryIcon } from '../../shared/category-icon';
import { ConfirmData, ConfirmDialog } from '../../shared/confirm-dialog';

export interface TransactionSheetData {
  transaction?: Transaction;
  /** Rascunho vindo do lançamento rápido. */
  draft?: Partial<TransactionInput>;
}

/** Aceita "1.234,56", "1234.56" ou "35,9"; precisa ser maior que zero. */
function amountValidator(control: AbstractControl<string>): ValidationErrors | null {
  const raw = (control.value ?? '')
    .toString()
    .replace(/r\$\s*/i, '')
    .trim();
  if (!raw) return { required: true };
  if (!/^\d[\d.]*(,\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(raw)) return { format: true };
  return parseMoney(raw) > 0 ? null : { min: true };
}

/**
 * Painel de lançamento (lateral no desktop, folha de baixo no celular).
 * Formulário reativo: tipo, valor em destaque, categorias em grade, data com atalhos.
 */
@Component({
  selector: 'app-transaction-sheet',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    CategoryIcon,
  ],
  templateUrl: './transaction-sheet.html',
  styleUrl: './transaction-sheet.scss',
})
export class TransactionSheet {
  private readonly ref = inject(MatDialogRef<TransactionSheet, Transaction | 'deleted'>);
  private readonly service = inject(TransactionService);
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(CategoryStore);
  protected readonly data = inject<TransactionSheetData>(MAT_DIALOG_DATA);

  protected readonly editing = !!this.data.transaction;
  private readonly recurring = inject(RecurringService);
  /** Ao criar: também cadastra como conta recorrente, a partir do mês seguinte. */
  protected readonly repeat = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly initial = this.data.transaction;
  private readonly draftCategory = this.store
    .all()
    .find((c) => c.id === this.data.draft?.categoryId);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    type: [(this.initial?.category.type ?? this.draftCategory?.type ?? 'EXPENSE') as CategoryType],
    amount: [
      this.initial
        ? formatAmount(this.initial.amount)
        : this.data.draft?.amount
          ? formatAmount(this.data.draft.amount)
          : '',
      amountValidator,
    ],
    description: [
      this.initial?.description ?? this.data.draft?.description ?? '',
      [Validators.required, Validators.maxLength(120)],
    ],
    date: [
      fromIsoDate(this.initial?.date ?? this.data.draft?.date ?? toIsoDate(new Date())),
      Validators.required,
    ],
    categoryId: [
      this.initial?.category.id ?? this.data.draft?.categoryId ?? '',
      Validators.required,
    ],
  });

  protected readonly type = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });
  private readonly selectedId = toSignal(this.form.controls.categoryId.valueChanges, {
    initialValue: this.form.controls.categoryId.value,
  });
  private readonly dateValue = toSignal(this.form.controls.date.valueChanges, {
    initialValue: this.form.controls.date.value,
  });

  protected readonly options = computed(() =>
    this.type() === 'INCOME' ? this.store.incomes() : this.store.expenses(),
  );
  protected readonly selected = computed(
    () => this.store.all().find((c) => c.id === this.selectedId()) ?? null,
  );
  protected readonly dateIso = computed(() =>
    this.dateValue() ? toIsoDate(this.dateValue()) : '',
  );
  protected readonly todayIso = toIsoDate(new Date());
  protected readonly yesterdayIso = toIsoDate(new Date(Date.now() - 86_400_000));

  setType(type: CategoryType): void {
    if (type === this.form.controls.type.value) return;
    this.form.controls.type.setValue(type);
    // Categoria de receita não serve para despesa (e vice-versa).
    if (this.selected()?.type !== type) this.form.controls.categoryId.setValue('');
  }

  setDate(iso: string): void {
    this.form.controls.date.setValue(fromIsoDate(iso));
  }

  formatAmountField(): void {
    const c = this.form.controls.amount;
    if (c.valid) c.setValue(formatAmount(parseMoney(c.value.replace(/r\$\s*/i, ''))));
  }

  toInput(): TransactionInput {
    const v = this.form.getRawValue();
    return {
      description: v.description.trim(),
      amount: parseMoney(v.amount.replace(/r\$\s*/i, '').trim()),
      date: toIsoDate(v.date),
      categoryId: v.categoryId,
    };
  }

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.saving.set(true);
    this.error.set(null);
    const input = this.toInput();
    const request = this.initial
      ? this.service.update(this.initial.id, input)
      : this.service.create(input);
    request.subscribe({
      next: (saved) => {
        if (this.repeat() && !this.initial) this.createRecurring(input);
        this.ref.close(saved);
      },
      error: (e: unknown) => {
        const apiError = readApiError(e);
        for (const [field, message] of Object.entries(apiError.fieldErrors))
          this.form.get(field)?.setErrors({ server: message });
        this.error.set(apiError.message);
        this.saving.set(false);
      },
    });
  }

  /** O lançamento de agora é o deste mês; a conta recorrente começa no próximo, no mesmo dia. */
  private createRecurring(input: TransactionInput): void {
    const date = fromIsoDate(input.date);
    this.recurring
      .create({
        description: input.description,
        amount: input.amount,
        categoryId: input.categoryId,
        dayOfMonth: date.getDate(),
        startMonth: addMonths(toYearMonth(date), 1),
      })
      .subscribe();
  }

  remove(): void {
    const t = this.initial!;
    this.dialog
      .open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
        data: {
          title: 'Apagar lançamento?',
          message: `"${t.description}" sai do histórico e dos totais.`,
          confirmLabel: 'Apagar',
        },
        backdropClass: 'soft-backdrop',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(t.id)),
      )
      .subscribe({
        next: () => this.ref.close('deleted'),
        error: (e: unknown) => this.error.set(readApiError(e).message),
      });
  }

  close(): void {
    this.ref.close();
  }
}

function formatAmount(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
