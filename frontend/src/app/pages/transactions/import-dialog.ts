import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { readApiError } from '../../core/api-error';
import { CategoryStore } from '../../core/category-store';
import { addMonths, fromIsoDate, toIsoDate, toYearMonth } from '../../core/dates';
import { formatBRL } from '../../core/money';
import { Category, StatementRow } from '../../core/models';
import { guessCategory } from '../../core/quick-add';
import { StatementService } from '../../core/statement.service';
import { CategoryIcon } from '../../shared/category-icon';

interface ReviewRow extends StatementRow {
  key: number;
  selected: boolean;
  categoryId: string;
}

type Step = 'pick' | 'reading' | 'review' | 'saving' | 'done';

/**
 * Importar extrato em três passos: escolher o arquivo (CSV ou OFX), revisar o que a API leu
 * (categorias sugeridas, duplicados já desmarcados) e confirmar. Grava tudo de uma vez.
 */
@Component({
  selector: 'app-import-dialog',
  imports: [MatDialogModule, CategoryIcon],
  templateUrl: './import-dialog.html',
  styleUrl: './import-dialog.scss',
})
export class ImportDialog {
  private readonly ref = inject(MatDialogRef<ImportDialog, number>);
  private readonly statements = inject(StatementService);
  protected readonly store = inject(CategoryStore);

  protected readonly step = signal<Step>('pick');
  protected readonly dragging = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly format = signal('');
  protected readonly fileName = signal('');
  protected readonly rows = signal<ReviewRow[]>([]);
  protected readonly created = signal(0);
  protected readonly brl = formatBRL;

  protected readonly selected = computed(() => this.rows().filter((r) => r.selected));
  protected readonly duplicates = computed(() => this.rows().filter((r) => r.duplicate).length);
  protected readonly missing = computed(() => this.selected().filter((r) => !r.categoryId).length);
  protected readonly total = computed(() => this.selected().reduce((sum, r) => sum + r.amount, 0));

  protected options(row: StatementRow): Category[] {
    return row.amount >= 0 ? this.store.incomes() : this.store.expenses();
  }

  protected categoryOf(row: ReviewRow): Category | undefined {
    return this.store.all().find((c) => c.id === row.categoryId);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.read(file);
  }

  protected onPick(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (file) this.read(file);
    input.value = '';
  }

  /** Extrato fictício gerado aqui mesmo, para quem visita o portfólio testar sem ter um arquivo. */
  protected trySample(): void {
    const month = addMonths(toYearMonth(new Date()), -1);
    const d = (day: number) => {
      const date = fromIsoDate(`${month}-${String(day).padStart(2, '0')}`);
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };
    const lines = [
      'Data;Histórico;Valor',
      `${d(2)};PIX RECEBIDO - CLIENTE ACME;1.250,00`,
      `${d(3)};COMPRA CARTAO - SUPERMERCADO BOM PRECO;-287,43`,
      `${d(4)};UBER *TRIP;-23,90`,
      `${d(7)};NETFLIX.COM;-55,90`,
      `${d(9)};FARMACIA SAO JOAO;-64,20`,
      `${d(12)};POSTO SHELL - GASOLINA;-180,00`,
      `${d(15)};IFOOD *RESTAURANTE;-48,70`,
      `${d(18)};CINEMARK;-62,00`,
      `${d(21)};PADARIA PAO QUENTE;-18,50`,
      `${d(25)};COMPRA CARTAO - LIVRARIA;-79,90`,
    ];
    this.read(new File([lines.join('\n')], 'extrato-exemplo.csv', { type: 'text/csv' }));
  }

  private read(file: File): void {
    if (file.size > 2 * 1024 * 1024) {
      this.error.set('O arquivo passa de 2 MB.');
      return;
    }
    this.error.set(null);
    this.fileName.set(file.name);
    this.step.set('reading');
    this.statements.preview(file).subscribe({
      next: (preview) => {
        const categories = this.store.all();
        this.format.set(preview.format);
        this.rows.set(
          preview.rows.map((row, key) => ({
            ...row,
            key,
            // Duplicados começam desmarcados: a pessoa decide se quer lançar de novo.
            selected: !row.duplicate,
            categoryId:
              guessCategory(row.description, row.amount >= 0 ? 'INCOME' : 'EXPENSE', categories)
                ?.id ?? '',
          })),
        );
        this.step.set('review');
      },
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.step.set('pick');
      },
    });
  }

  protected toggle(key: number): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.key === key ? { ...r, selected: !r.selected } : r)),
    );
  }

  protected toggleAll(): void {
    const all = this.selected().length === this.rows().length;
    this.rows.update((rows) => rows.map((r) => ({ ...r, selected: !all })));
  }

  protected setCategory(key: number, categoryId: string): void {
    this.rows.update((rows) => rows.map((r) => (r.key === key ? { ...r, categoryId } : r)));
  }

  /** Aplica uma categoria a todos os selecionados do mesmo tipo que ainda estão sem. */
  protected fillMissing(categoryId: string): void {
    const category = this.store.all().find((c) => c.id === categoryId);
    if (!category) return;
    this.rows.update((rows) =>
      rows.map((r) =>
        r.selected && !r.categoryId && r.amount >= 0 === (category.type === 'INCOME')
          ? { ...r, categoryId }
          : r,
      ),
    );
  }

  protected confirm(): void {
    const items = this.selected().map((r) => ({
      description: r.description,
      amount: Math.abs(r.amount),
      date: r.date,
      categoryId: r.categoryId,
    }));
    this.step.set('saving');
    this.statements.importAll(items).subscribe({
      next: (count) => {
        this.created.set(count);
        this.step.set('done');
      },
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.step.set('review');
      },
    });
  }

  protected back(): void {
    this.rows.set([]);
    this.step.set('pick');
  }

  close(): void {
    this.ref.close(this.created());
  }

  protected shortDate(iso: string): string {
    return fromIsoDate(iso)
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      .replace('.', '');
  }

  protected readonly todayIso = toIsoDate(new Date());
}
