import { Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { fromIsoDate, relativeDay } from '../../core/dates';
import { formatBRL } from '../../core/money';
import { SavingsGoal } from '../../core/models';
import { SavingsService } from '../../core/savings.service';
import { CountUp } from '../../shared/count-up';
import { confetti } from '../../shared/confetti';
import { Jar } from '../../shared/jar';
import { GoalDialog } from './goal-dialog';
import { MoveDialog, MoveDialogData } from './move-dialog';

@Component({
  selector: 'app-savings',
  imports: [Jar, CountUp, MatTooltipModule],
  templateUrl: './savings.html',
  styleUrl: './savings.scss',
})
export class SavingsPage {
  protected readonly savings = inject(SavingsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cards = viewChildren<ElementRef<HTMLElement>>('card');

  /** id do cofrinho → contador que dispara a moeda caindo no pote. */
  protected readonly drops = signal<Record<string, number>>({});
  protected readonly brl = formatBRL;

  protected deadlineLabel(goal: SavingsGoal): string | null {
    if (!goal.deadline) return null;
    return fromIsoDate(goal.deadline)
      .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      .replace('.', '')
      .replace(' de ', ' ');
  }

  protected day(iso: string): string {
    return relativeDay(iso);
  }

  protected abs(n: number): number {
    return Math.abs(n);
  }

  openGoal(goal?: SavingsGoal): void {
    this.dialog
      .open<GoalDialog, SavingsGoal | undefined, SavingsGoal | 'deleted'>(GoalDialog, {
        data: goal,
        backdropClass: 'soft-backdrop',
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((result) =>
        this.snackBar.open(
          result === 'deleted'
            ? 'Cofrinho apagado'
            : goal
              ? 'Cofrinho atualizado'
              : 'Cofrinho criado',
        ),
      );
  }

  move(goal: SavingsGoal, kind: 'DEPOSIT' | 'WITHDRAW', index: number): void {
    this.dialog
      .open<MoveDialog, MoveDialogData, SavingsGoal>(MoveDialog, {
        data: { goal, kind },
        backdropClass: 'soft-backdrop',
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((updated) => {
        if (kind === 'DEPOSIT') {
          this.drops.update((d) => ({ ...d, [updated.id]: (d[updated.id] ?? 0) + 1 }));
        }
        // Completou agora: comemora.
        if (goal.percent < 100 && updated.percent >= 100) {
          const el = this.cards()[index]?.nativeElement;
          if (el) setTimeout(() => confetti(el), 700);
          this.snackBar.open(`Objetivo alcançado: ${updated.name}!`);
        } else {
          const verb = kind === 'DEPOSIT' ? 'guardado em' : 'resgatado de';
          const amount = Math.abs(updated.saved - goal.saved);
          this.snackBar.open(`${formatBRL(amount)} ${verb} ${updated.name}`);
        }
      });
  }
}
