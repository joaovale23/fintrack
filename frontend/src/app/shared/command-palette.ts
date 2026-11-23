import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError, debounceTime, map, of, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CategoryStore } from '../core/category-store';
import { relativeDay } from '../core/dates';
import { formatBRL } from '../core/money';
import { PrivacyService } from '../core/privacy.service';
import { normalize } from '../core/quick-add';
import { SavingsService } from '../core/savings.service';
import { ThemeService } from '../core/theme.service';
import { TransactionEditor } from '../core/transaction-editor';
import { TransactionService } from '../core/transaction.service';
import { RecurringDialog } from '../pages/recurring/recurring-dialog';
import { GoalDialog } from '../pages/savings/goal-dialog';
import { CategoryIcon } from './category-icon';

interface Item {
  id: string;
  section: string;
  icon: string;
  color?: string;
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void;
}

/**
 * Busca rápida (Ctrl+K): ações, páginas, categorias, cofrinhos e lançamentos de qualquer mês
 * (estes buscados na API conforme se digita). Setas para navegar, Enter para abrir.
 */
@Component({
  selector: 'app-command-palette',
  imports: [CategoryIcon],
  host: { '(keydown)': 'onKey($event)' },
  template: `
    <div class="search">
      <span class="material-symbols-rounded">search</span>
      <input
        #field
        [value]="query()"
        (input)="query.set(field.value); active.set(0)"
        placeholder="Buscar lançamentos, categorias, ações…"
        aria-label="Busca rápida"
        role="combobox"
        aria-controls="palette-list"
        [attr.aria-activedescendant]="'palette-' + active()"
        autocomplete="off"
      />
      <span class="kbd">Esc</span>
    </div>
    <ul id="palette-list" role="listbox">
      @for (item of items(); track item.id; let i = $index) {
        @if (i === 0 || items()[i - 1].section !== item.section) {
          <li class="section" role="presentation">{{ item.section }}</li>
        }
        <li
          [id]="'palette-' + i"
          role="option"
          [attr.aria-selected]="i === active()"
          [class.active]="i === active()"
          (mouseenter)="active.set(i)"
          (click)="choose(item)"
        >
          @if (item.color) {
            <app-category-icon [icon]="item.icon" [color]="item.color" [size]="30" />
          } @else {
            <span class="glyph material-symbols-rounded">{{ item.icon }}</span>
          }
          <span class="label">{{ item.label }}</span>
          @if (item.hint) {
            <span class="hint" [class.num]="item.section === 'Lançamentos'">{{ item.hint }}</span>
          }
        </li>
      } @empty {
        <li class="none">
          {{ searching() ? 'Buscando…' : 'Nada encontrado para “' + query() + '”' }}
        </li>
      }
    </ul>
    <p class="foot">
      <span class="kbd">↑</span><span class="kbd">↓</span> navegar ·
      <span class="kbd">Enter</span> abrir
    </p>
  `,
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  private readonly ref = inject(MatDialogRef<CommandPalette>);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly editor = inject(TransactionEditor);
  private readonly transactions = inject(TransactionService);
  private readonly categories = inject(CategoryStore);
  private readonly savings = inject(SavingsService);
  private readonly theme = inject(ThemeService);
  private readonly privacy = inject(PrivacyService);
  private readonly auth = inject(AuthService);
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly searching = signal(false);

  private readonly fixed: Item[] = [
    {
      id: 'a-new',
      section: 'Ações',
      icon: 'add_circle',
      label: 'Novo lançamento',
      hint: 'N',
      keywords: 'adicionar criar gasto',
      run: () => this.editor.open().subscribe(),
    },
    {
      id: 'a-import',
      section: 'Ações',
      icon: 'upload_file',
      label: 'Importar extrato',
      hint: 'CSV ou OFX',
      keywords: 'banco ofx csv',
      run: () => this.editor.openImport(),
    },
    {
      id: 'a-rec',
      section: 'Ações',
      icon: 'event_repeat',
      label: 'Nova conta recorrente',
      keywords: 'fixa aluguel assinatura',
      run: () => this.dialog.open(RecurringDialog, { backdropClass: 'soft-backdrop' }),
    },
    {
      id: 'a-goal',
      section: 'Ações',
      icon: 'savings',
      label: 'Novo cofrinho',
      keywords: 'objetivo guardar meta',
      run: () => this.dialog.open(GoalDialog, { backdropClass: 'soft-backdrop' }),
    },
    {
      id: 'a-theme',
      section: 'Ações',
      icon: 'contrast',
      label: 'Alternar tema claro/escuro',
      keywords: 'dark modo escuro',
      run: () => this.theme.toggle(),
    },
    {
      id: 'a-privacy',
      section: 'Ações',
      icon: 'visibility_off',
      label: 'Modo discreto',
      hint: 'H',
      keywords: 'esconder valores',
      run: () => this.privacy.toggle(),
    },
    {
      id: 'p-home',
      section: 'Ir para',
      icon: 'donut_large',
      label: 'Painel',
      run: () => this.go('/'),
    },
    {
      id: 'p-tx',
      section: 'Ir para',
      icon: 'receipt_long',
      label: 'Lançamentos',
      run: () => this.go('/lancamentos'),
    },
    {
      id: 'p-rec',
      section: 'Ir para',
      icon: 'event_repeat',
      label: 'Recorrentes',
      keywords: 'contas fixas',
      run: () => this.go('/recorrentes'),
    },
    {
      id: 'p-goals',
      section: 'Ir para',
      icon: 'savings',
      label: 'Cofrinhos',
      run: () => this.go('/cofrinhos'),
    },
    {
      id: 'p-cat',
      section: 'Ir para',
      icon: 'category',
      label: 'Categorias',
      run: () => this.go('/categorias'),
    },
    { id: 'a-out', section: 'Conta', icon: 'logout', label: 'Sair', run: () => this.auth.logout() },
  ];

  /** Lançamentos de qualquer mês que batem com a busca (na API, com espera de 220 ms entre teclas). */
  private readonly found = toSignal(
    toObservable(this.query).pipe(
      debounceTime(220),
      switchMap((q) => {
        if (q.trim().length < 2) return of([]);
        this.searching.set(true);
        return this.transactions.list({ search: q.trim() }, 0, 6).pipe(
          map((p) => p.content),
          catchError(() => of([])),
        );
      }),
      map((list) => {
        this.searching.set(false);
        return list;
      }),
    ),
    { initialValue: [] },
  );

  protected readonly items = computed<Item[]>(() => {
    const q = normalize(this.query());
    const match = (item: Item) =>
      !q || normalize(`${item.label} ${item.keywords ?? ''}`).includes(q);
    const categories: Item[] = this.categories.all().map((c) => ({
      id: `c-${c.id}`,
      section: 'Categorias',
      icon: c.icon,
      color: c.color,
      label: c.name,
      hint: 'ver lançamentos',
      run: () => this.go('/lancamentos', { categoria: c.id }),
    }));
    const goals: Item[] = this.savings.goals().map((g) => ({
      id: `g-${g.id}`,
      section: 'Cofrinhos',
      icon: g.icon,
      color: g.color,
      label: g.name,
      hint: `${g.percent}%`,
      run: () => this.go('/cofrinhos'),
    }));
    const transactions: Item[] = this.found().map((t) => ({
      id: `t-${t.id}`,
      section: 'Lançamentos',
      icon: t.category.icon,
      color: t.category.color,
      label: t.description,
      hint: `${relativeDay(t.date)} · ${t.category.type === 'INCOME' ? '+' : '−'} ${formatBRL(t.amount)}`,
      run: () => this.editor.open(t).subscribe(),
    }));
    if (!q) return this.fixed.filter((i) => i.section !== 'Conta');
    return [
      ...transactions,
      ...this.fixed.filter(match),
      ...categories.filter(match),
      ...goals.filter(match),
    ];
  });

  constructor() {
    setTimeout(() => this.field()?.nativeElement.focus());
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.items().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.update((i) => (count ? (i + 1) % count : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.update((i) => (count ? (i - 1 + count) % count : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.items()[this.active()];
      if (item) this.choose(item);
    } else {
      return;
    }
    queueMicrotask(() =>
      document.getElementById(`palette-${this.active()}`)?.scrollIntoView({ block: 'nearest' }),
    );
  }

  protected choose(item: Item): void {
    this.ref.close();
    // Espera o painel fechar para a próxima janela (se houver) abrir sem conflito.
    this.ref.afterClosed().subscribe(() => item.run());
  }

  private go(path: string, queryParams?: Record<string, string>): void {
    void this.router.navigate([path], { queryParams });
  }
}
