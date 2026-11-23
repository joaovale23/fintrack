import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryStore } from '../../core/category-store';
import { monthName, toYearMonth } from '../../core/dates';
import { formatBRL } from '../../core/money';
import { Category, CategoryType, MonthlySummary } from '../../core/models';
import { TransactionEditor } from '../../core/transaction-editor';
import { BudgetRing } from '../../shared/budget-ring';
import { CategoryIcon } from '../../shared/category-icon';
import { EmptyState } from '../../shared/empty-state';
import { CategoryDialog, CategoryDialogData } from './category-dialog';

@Component({
  selector: 'app-categories',
  imports: [CategoryIcon, BudgetRing, EmptyState],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class CategoriesPage {
  protected readonly store = inject(CategoryStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly editor = inject(TransactionEditor);

  private readonly month = toYearMonth(new Date());
  protected readonly monthName = monthName(this.month).toLowerCase();
  private readonly summary = httpResource<MonthlySummary>(() => ({
    url: `${environment.apiUrl}/api/summary`,
    params: { month: this.month },
  }));

  /** Quanto cada categoria movimentou neste mês. */
  private readonly totals = computed(() => {
    const s = this.summary.hasValue() ? this.summary.value() : null;
    return new Map(
      [...(s?.expensesByCategory ?? []), ...(s?.incomesByCategory ?? [])].map((c) => [
        c.categoryId,
        c.total,
      ]),
    );
  });

  protected readonly sections = computed(() => [
    { title: 'Saídas', type: 'EXPENSE' as CategoryType, items: this.store.expenses() },
    { title: 'Entradas', type: 'INCOME' as CategoryType, items: this.store.incomes() },
  ]);

  protected readonly brl = formatBRL;

  constructor() {
    effect(() => {
      if (this.editor.version() > 0) untracked(() => this.summary.reload());
    });
  }

  protected total(c: Category): number {
    return this.totals().get(c.id) ?? 0;
  }

  protected percent(c: Category): number {
    return c.monthlyLimit ? Math.round((this.total(c) / c.monthlyLimit) * 100) : 0;
  }

  open(category?: Category, type?: CategoryType): void {
    this.dialog
      .open<CategoryDialog, CategoryDialogData, Category | 'deleted'>(CategoryDialog, {
        data: { category, type },
        backdropClass: 'soft-backdrop',
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((result) => {
        this.snackBar.open(
          result === 'deleted'
            ? 'Categoria apagada'
            : category
              ? 'Categoria atualizada'
              : 'Categoria criada',
        );
        this.summary.reload();
      });
  }
}
