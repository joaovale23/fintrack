import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { readApiError } from '../../core/api-error';
import { untilLabel } from '../../core/dates';
import { formatBRL } from '../../core/money';
import { RecurringBill } from '../../core/models';
import { RecurringService } from '../../core/recurring.service';
import { CategoryIcon } from '../../shared/category-icon';
import { CountUp } from '../../shared/count-up';
import { EmptyState } from '../../shared/empty-state';
import { RecurringDialog } from './recurring-dialog';

interface Marker {
  bill: RecurringBill;
  left: number;
  /** Contas no mesmo dia se empilham. */
  stack: number;
}

@Component({
  selector: 'app-recurring',
  imports: [CategoryIcon, CountUp, MatTooltipModule, EmptyState],
  templateUrl: './recurring.html',
  styleUrl: './recurring.scss',
})
export class RecurringPage {
  protected readonly service = inject(RecurringService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly today = new Date().getDate();
  protected readonly daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  protected readonly hovered = signal<string | null>(null);
  protected readonly brl = formatBRL;

  protected readonly sections = computed(() => [
    {
      title: 'Contas a pagar',
      items: this.service.bills().filter((b) => b.category.type === 'EXPENSE'),
    },
    {
      title: 'Entradas fixas',
      items: this.service.bills().filter((b) => b.category.type === 'INCOME'),
    },
  ]);

  /** Posição de cada conta na linha do mês (1 a 31). */
  protected readonly markers = computed<Marker[]>(() => {
    const perDay = new Map<number, number>();
    return this.service
      .bills()
      .filter((b) => b.active)
      .map((bill) => {
        const day = Math.min(bill.dayOfMonth, this.daysInMonth);
        const stack = perDay.get(day) ?? 0;
        perDay.set(day, stack + 1);
        return { bill, left: ((day - 1) / (this.daysInMonth - 1)) * 100, stack };
      });
  });

  protected readonly todayLeft = computed(() => ((this.today - 1) / (this.daysInMonth - 1)) * 100);

  protected next(bill: RecurringBill): string {
    return bill.nextDate ? untilLabel(bill.nextDate) : 'pausada';
  }

  open(bill?: RecurringBill): void {
    this.dialog
      .open<RecurringDialog, RecurringBill | undefined, RecurringBill | 'deleted'>(
        RecurringDialog,
        { data: bill, backdropClass: 'soft-backdrop' },
      )
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((result) =>
        this.snackBar.open(
          result === 'deleted' ? 'Conta removida' : bill ? 'Conta atualizada' : 'Conta criada',
        ),
      );
  }

  toggle(bill: RecurringBill, event: Event): void {
    event.stopPropagation();
    const input = {
      description: bill.description,
      amount: bill.amount,
      categoryId: bill.category.id,
      dayOfMonth: bill.dayOfMonth,
      startMonth: bill.startMonth,
      active: !bill.active,
    };
    this.service.update(bill.id, input).subscribe({
      next: (b) =>
        this.snackBar.open(
          b.active ? `${b.description} voltou a repetir` : `${b.description} pausada`,
        ),
      error: (e) => this.snackBar.open(readApiError(e).message, 'Fechar'),
    });
  }
}
