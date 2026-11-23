import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { filter, switchMap } from 'rxjs';
import { readApiError } from '../../core/api-error';
import { CategoryStore } from '../../core/category-store';
import { addMonths, toYearMonth } from '../../core/dates';
import { CategoryType, RecurringBill, RecurringBillInput } from '../../core/models';
import { parseMoney } from '../../core/quick-add';
import { RecurringService } from '../../core/recurring.service';
import { CategoryIcon } from '../../shared/category-icon';
import { ConfirmData, ConfirmDialog } from '../../shared/confirm-dialog';

function amountValidator(control: AbstractControl<string>): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) return { required: true };
  return /^\d[\d.]*(,\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(raw) && parseMoney(raw) > 0
    ? null
    : { format: true };
}

/** Criar ou editar uma conta recorrente: valor, categoria e o dia do mês num "calendário" de 1 a 31. */
@Component({
  selector: 'app-recurring-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, CategoryIcon],
  templateUrl: './recurring-dialog.html',
  styleUrl: './recurring-dialog.scss',
})
export class RecurringDialog {
  private readonly ref = inject(MatDialogRef<RecurringDialog, RecurringBill | 'deleted'>);
  private readonly service = inject(RecurringService);
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(CategoryStore);
  protected readonly bill = inject<RecurringBill | undefined>(MAT_DIALOG_DATA);

  protected readonly days = Array.from({ length: 31 }, (_, i) => i + 1);
  protected readonly thisMonth = toYearMonth(new Date());
  protected readonly nextMonth = addMonths(this.thisMonth, 1);
  protected readonly today = new Date().getDate();
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    type: [(this.bill?.category.type ?? 'EXPENSE') as CategoryType],
    amount: [
      this.bill ? this.bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
      amountValidator,
    ],
    description: [this.bill?.description ?? '', [Validators.required, Validators.maxLength(120)]],
    categoryId: [this.bill?.category.id ?? '', Validators.required],
    dayOfMonth: [this.bill?.dayOfMonth ?? new Date().getDate(), Validators.required],
    startMonth: [this.bill?.startMonth ?? this.thisMonth],
  });

  protected readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly options = computed(() =>
    this.value().type === 'INCOME' ? this.store.incomes() : this.store.expenses(),
  );
  /** Começando neste mês com um dia que já passou, a primeira cobrança é lançada na hora. */
  protected readonly launchesNow = computed(
    () =>
      !this.bill &&
      this.value().startMonth === this.thisMonth &&
      (this.value().dayOfMonth ?? 99) <= this.today,
  );

  setType(type: CategoryType): void {
    if (type === this.form.controls.type.value) return;
    this.form.controls.type.setValue(type);
    this.form.controls.categoryId.setValue('');
  }

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    const input: RecurringBillInput = {
      description: v.description.trim(),
      amount: parseMoney(v.amount.trim()),
      categoryId: v.categoryId,
      dayOfMonth: v.dayOfMonth,
      startMonth: v.startMonth,
      active: this.bill?.active ?? true,
    };
    this.saving.set(true);
    this.error.set(null);
    const request = this.bill
      ? this.service.update(this.bill.id, input)
      : this.service.create(input);
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.saving.set(false);
      },
    });
  }

  remove(): void {
    const b = this.bill!;
    this.dialog
      .open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
        data: {
          title: 'Parar de repetir?',
          message: `"${b.description}" deixa de ser lançada. O que já foi lançado continua no histórico.`,
          confirmLabel: 'Parar',
        },
        backdropClass: 'soft-backdrop',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(b.id)),
      )
      .subscribe({
        next: () => this.ref.close('deleted'),
        error: (e: unknown) => this.error.set(readApiError(e).message),
      });
  }
}
