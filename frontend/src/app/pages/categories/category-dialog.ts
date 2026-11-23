import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { filter, switchMap } from 'rxjs';
import { readApiError } from '../../core/api-error';
import { CategoryStore } from '../../core/category-store';
import { formatBRL } from '../../core/money';
import { Category, CategoryInput, CategoryType } from '../../core/models';
import { parseMoney } from '../../core/quick-add';
import { CategoryIcon } from '../../shared/category-icon';
import { ConfirmData, ConfirmDialog } from '../../shared/confirm-dialog';

export interface CategoryDialogData {
  category?: Category;
  /** Tipo já escolhido quando a criação começa pela seção "Saídas" ou "Entradas". */
  type?: CategoryType;
}

export const PALETTE = [
  '#1f8a5b',
  '#3aa6a0',
  '#2d8fd5',
  '#6c5ce7',
  '#9b59b6',
  '#e0457b',
  '#d64545',
  '#f08a24',
  '#e9a52a',
  '#a0703c',
  '#5f6b73',
  '#1b1a17',
];

export const ICONS = [
  'restaurant',
  'shopping_cart',
  'local_cafe',
  'home',
  'bolt',
  'wifi',
  'directions_car',
  'directions_bus',
  'local_gas_station',
  'celebration',
  'movie',
  'sports_esports',
  'flight',
  'favorite',
  'medication',
  'fitness_center',
  'school',
  'menu_book',
  'pets',
  'child_care',
  'checkroom',
  'redeem',
  'phone_iphone',
  'subscriptions',
  'payments',
  'laptop_mac',
  'savings',
  'trending_up',
  'work',
  'storefront',
  'volunteer_activism',
  'sell',
];

@Component({
  selector: 'app-category-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, CategoryIcon],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.scss',
})
export class CategoryDialog {
  private readonly ref = inject(MatDialogRef<CategoryDialog, Category | 'deleted'>);
  private readonly store = inject(CategoryStore);
  private readonly dialog = inject(MatDialog);
  private readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);
  protected readonly category = this.data.category;
  protected readonly palette = PALETTE;
  protected readonly icons = ICONS;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.category?.name ?? '', [Validators.required, Validators.maxLength(40)]],
    type: [(this.category?.type ?? this.data.type ?? 'EXPENSE') as CategoryType],
    color: [this.category?.color ?? PALETTE[3]],
    icon: [this.category?.icon ?? 'sell'],
    monthlyLimit: [
      this.category?.monthlyLimit
        ? this.category.monthlyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '',
    ],
  });

  /** Prévia ao vivo: o cartão no topo muda enquanto a pessoa preenche. */
  protected readonly preview = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly limitPreview = computed(() => {
    const raw = this.preview().monthlyLimit ?? '';
    const value = raw ? parseMoney(raw) : 0;
    return value > 0 ? `Meta de ${formatBRL(value)} por mês` : null;
  });

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    const limit = v.type === 'EXPENSE' && v.monthlyLimit ? parseMoney(v.monthlyLimit) : 0;
    const input: CategoryInput = {
      name: v.name.trim(),
      type: v.type,
      color: v.color,
      icon: v.icon,
      monthlyLimit: limit > 0 ? limit : null,
    };
    this.saving.set(true);
    this.error.set(null);
    const request = this.category
      ? this.store.update(this.category.id, input)
      : this.store.create(input);
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.saving.set(false);
      },
    });
  }

  remove(): void {
    const c = this.category!;
    this.dialog
      .open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
        data: {
          title: 'Apagar categoria?',
          message: `"${c.name}" só pode ser apagada se não tiver lançamentos.`,
          confirmLabel: 'Apagar',
        },
        backdropClass: 'soft-backdrop',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.store.delete(c.id)),
      )
      .subscribe({
        next: () => this.ref.close('deleted'),
        // A API responde 409 explicando que a categoria tem lançamentos.
        error: (e: unknown) => this.error.set(readApiError(e).message),
      });
  }
}
