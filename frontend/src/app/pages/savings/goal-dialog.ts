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
import { SavingsGoal, SavingsGoalInput } from '../../core/models';
import { parseMoney } from '../../core/quick-add';
import { SavingsService } from '../../core/savings.service';
import { ConfirmData, ConfirmDialog } from '../../shared/confirm-dialog';
import { Jar } from '../../shared/jar';
import { PALETTE } from '../categories/category-dialog';

const GOAL_ICONS = [
  'savings',
  'flight',
  'beach_access',
  'home',
  'directions_car',
  'laptop_mac',
  'school',
  'favorite',
  'pets',
  'celebration',
  'sports_esports',
  'shield',
];

/** Criar ou editar um cofrinho, com o pote de prévia mudando de cor junto. */
@Component({
  selector: 'app-goal-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, Jar],
  templateUrl: './goal-dialog.html',
  styleUrl: './goal-dialog.scss',
})
export class GoalDialog {
  private readonly ref = inject(MatDialogRef<GoalDialog, SavingsGoal | 'deleted'>);
  private readonly savings = inject(SavingsService);
  private readonly dialog = inject(MatDialog);
  protected readonly goal = inject<SavingsGoal | undefined>(MAT_DIALOG_DATA);
  protected readonly palette = PALETTE;
  protected readonly icons = GOAL_ICONS;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.goal?.name ?? '', [Validators.required, Validators.maxLength(60)]],
    target: [
      this.goal ? this.goal.target.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
      Validators.required,
    ],
    /** Mês do prazo no formato do <input type="month">: "2027-06". */
    deadline: [this.goal?.deadline?.slice(0, 7) ?? ''],
    icon: [this.goal?.icon ?? 'savings'],
    color: [this.goal?.color ?? PALETTE[2]],
  });

  protected readonly preview = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly previewPercent = computed(() => {
    const target = parseMoney(this.preview().target || '0');
    return this.goal && target > 0
      ? Math.min(100, Math.round((this.goal.saved / target) * 100))
      : 35;
  });

  save(): void {
    const v = this.form.getRawValue();
    const target = parseMoney(v.target.replace(/r\$\s*/i, '').trim() || '0');
    if (this.form.invalid || !(target > 0)) {
      this.form.markAllAsTouched();
      if (!(target > 0)) this.error.set('Informe quanto quer juntar');
      return;
    }
    const input: SavingsGoalInput = {
      name: v.name.trim(),
      icon: v.icon,
      color: v.color,
      target,
      // Prazo no último dia do mês escolhido.
      deadline: v.deadline ? lastDayOf(v.deadline) : null,
    };
    this.saving.set(true);
    this.error.set(null);
    const request = this.goal
      ? this.savings.update(this.goal.id, input)
      : this.savings.create(input);
    request.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.saving.set(false);
      },
    });
  }

  remove(): void {
    const g = this.goal!;
    this.dialog
      .open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
        data: {
          title: 'Apagar cofrinho?',
          message: `"${g.name}" e o histórico dele serão apagados.`,
          confirmLabel: 'Apagar',
        },
        backdropClass: 'soft-backdrop',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.savings.delete(g.id)),
      )
      .subscribe({
        next: () => this.ref.close('deleted'),
        error: (e: unknown) => this.error.set(readApiError(e).message),
      });
  }
}

export function lastDayOf(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const day = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(day).padStart(2, '0')}`;
}
