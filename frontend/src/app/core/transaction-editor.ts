import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, tap } from 'rxjs';
import { Transaction, TransactionInput } from './models';
import { ImportDialog } from '../pages/transactions/import-dialog';
import { TransactionSheet, TransactionSheetData } from '../pages/transactions/transaction-sheet';

/**
 * Ponto único para criar e editar lançamentos: o atalho "N", o botão "+" e as listas usam o mesmo painel.
 * Cada gravação incrementa {@link version}; quem mostra dados financeiros reage a esse signal e recarrega.
 */
@Injectable({ providedIn: 'root' })
export class TransactionEditor {
  private readonly dialog = inject(MatDialog);
  private readonly breakpoints = inject(BreakpointObserver);
  readonly version = signal(0);

  open(
    transaction?: Transaction,
    draft?: Partial<TransactionInput>,
  ): Observable<Transaction | undefined> {
    if (this.dialog.openDialogs.length > 0) return new Observable((s) => s.complete());
    const mobile = this.breakpoints.isMatched('(max-width: 720px)');
    return this.dialog
      .open<TransactionSheet, TransactionSheetData, Transaction | 'deleted'>(TransactionSheet, {
        data: { transaction, draft },
        panelClass: mobile ? ['sheet-panel', 'bottom'] : 'sheet-panel',
        backdropClass: 'soft-backdrop',
        position: mobile ? { bottom: '0' } : { right: '0', top: '0' },
        width: mobile ? '100vw' : '460px',
        maxWidth: '100vw',
        height: mobile ? 'auto' : '100dvh',
        maxHeight: mobile ? '92dvh' : '100dvh',
        enterAnimationDuration: 0,
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .pipe(
        tap((result) => result && this.changed()),
        map((result) => (result && result !== 'deleted' ? result : undefined)),
      );
  }

  /** Importar extrato. Se algo foi lançado, as telas recarregam. */
  openImport(): void {
    if (this.dialog.openDialogs.length > 0) return;
    this.dialog
      .open<ImportDialog, void, number>(ImportDialog, {
        backdropClass: 'soft-backdrop',
        maxWidth: '96vw',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((created) => created && this.changed());
  }

  /** Avisa que os dados mudaram (criação, edição ou exclusão feita em outro lugar). */
  changed(): void {
    this.version.update((v) => v + 1);
  }
}
