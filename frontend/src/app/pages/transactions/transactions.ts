import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { readApiError } from '../../core/api-error';
import { CategoryStore } from '../../core/category-store';
import { relativeDay, toYearMonth } from '../../core/dates';
import { formatBRL } from '../../core/money';
import { CategoryType, MonthlySummary, Transaction, TransactionFilter } from '../../core/models';
import { TransactionEditor } from '../../core/transaction-editor';
import { TransactionService } from '../../core/transaction.service';
import { CategoryIcon } from '../../shared/category-icon';
import { InfiniteScroll } from '../../shared/infinite-scroll';
import { MonthSwitcher } from '../../shared/month-switcher';
import { QuickAdd } from '../../shared/quick-add';

const PAGE_SIZE = 30;

interface DayGroup {
  date: string;
  label: string;
  net: number;
  items: Transaction[];
}

@Component({
  selector: 'app-transactions',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTooltipModule,
    MonthSwitcher,
    QuickAdd,
    CategoryIcon,
    InfiniteScroll,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class TransactionsPage {
  private readonly service = inject(TransactionService);
  private readonly editor = inject(TransactionEditor);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly store = inject(CategoryStore);

  /** ?categoria=<id> na URL (vindo da busca rápida) já abre a lista filtrada. */
  readonly categoria = input<string>();
  protected readonly month = signal(toYearMonth(new Date()));
  protected readonly type = signal<CategoryType | null>(null);
  protected readonly categoryId = signal<string | null>(null);
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly searchTerm = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(300),
      map((s) => s.trim()),
      distinctUntilChanged(),
    ),
    {
      initialValue: '',
    },
  );

  /** Os filtros viram uma consulta; qualquer mudança recomeça da primeira página. */
  private readonly query = computed<TransactionFilter>(() => ({
    month: this.month(),
    type: this.type() ?? undefined,
    categoryId: this.categoryId() ?? undefined,
    search: this.searchTerm() || undefined,
  }));

  protected readonly items = signal<Transaction[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly page = signal(0);
  private readonly totalPages = signal(0);
  protected readonly total = signal(0);
  protected readonly hasMore = computed(() => this.page() + 1 < this.totalPages());

  /** Totais do mês (não só da parte já carregada da lista). */
  protected readonly summary = httpResource<MonthlySummary>(() => ({
    url: `${environment.apiUrl}/api/summary`,
    params: { month: this.month() },
  }));

  protected readonly visibleCategories = computed(() => {
    const t = this.type();
    return t === 'INCOME'
      ? this.store.incomes()
      : t === 'EXPENSE'
        ? this.store.expenses()
        : this.store.all();
  });

  protected readonly groups = computed<DayGroup[]>(() => {
    const byDay = new Map<string, DayGroup>();
    for (const t of this.items()) {
      const g = byDay.get(t.date) ?? {
        date: t.date,
        label: relativeDay(t.date),
        net: 0,
        items: [],
      };
      g.items.push(t);
      g.net += t.category.type === 'INCOME' ? t.amount : -t.amount;
      byDay.set(t.date, g);
    }
    return [...byDay.values()];
  });

  protected readonly filtered = computed(
    () => !!(this.type() || this.categoryId() || this.searchTerm()),
  );
  protected readonly brl = formatBRL;
  protected readonly abs = Math.abs;

  private readonly requests = new Subject<{ query: TransactionFilter; page: number }>();

  constructor() {
    // switchMap: se o filtro muda no meio de uma busca, a resposta antiga é descartada.
    this.requests
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ query, page }) =>
          this.service.list(query, page, PAGE_SIZE).pipe(
            map((result) => ({ result, page })),
            catchError((e) => {
              this.error.set(readApiError(e).message);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ result, page }) => {
        this.items.update((list) => (page === 0 ? result.content : [...list, ...result.content]));
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.total.set(result.totalElements);
        this.loading.set(false);
      });

    effect(() => {
      const query = this.query();
      this.editor.version(); // recarrega quando algo é salvo em outro lugar
      untracked(() => {
        this.requests.next({ query, page: 0 });
        this.summary.reload();
      });
    });

    effect(() => {
      const fromUrl = this.categoria();
      if (fromUrl) untracked(() => this.categoryId.set(fromUrl));
    });

    // Ao trocar entre entradas/saídas, solta a categoria se ela for do outro tipo.
    effect(() => {
      const t = this.type();
      const selected = untracked(() => this.store.all().find((c) => c.id === this.categoryId()));
      if (t && selected && selected.type !== t) untracked(() => this.categoryId.set(null));
    });
  }

  loadMore(): void {
    if (!this.loading() && this.hasMore())
      this.requests.next({ query: this.query(), page: this.page() + 1 });
  }

  toggleCategory(id: string): void {
    this.categoryId.update((current) => (current === id ? null : id));
  }

  clearFilters(): void {
    this.type.set(null);
    this.categoryId.set(null);
    this.search.setValue('');
  }

  edit(t: Transaction): void {
    this.editor.open(t).subscribe();
  }

  importStatement(): void {
    this.editor.openImport();
  }

  create(): void {
    this.editor.open().subscribe();
  }

  /** Some da lista na hora; a exclusão de verdade só acontece se a pessoa não clicar em "Desfazer". */
  remove(t: Transaction, event: Event): void {
    event.stopPropagation();
    const snapshot = this.items();
    this.items.update((list) => list.filter((i) => i.id !== t.id));
    this.snackBar
      .open(`"${t.description}" apagado`, 'Desfazer', { duration: 5000 })
      .afterDismissed()
      .subscribe(({ dismissedByAction }) => {
        if (dismissedByAction) {
          this.items.set(snapshot);
          return;
        }
        this.service.delete(t.id).subscribe({
          next: () => this.summary.reload(),
          error: (e) => {
            this.items.set(snapshot);
            this.snackBar.open(readApiError(e).message, 'Fechar');
          },
        });
      });
  }

  protected stagger(index: number): number {
    return Math.min(index, 8);
  }
}
