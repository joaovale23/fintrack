import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, map, of } from 'rxjs';
import { fromIsoDate, monthName, toIsoDate } from '../../core/dates';
import { formatBRL } from '../../core/money';
import { MonthlySummary, Transaction } from '../../core/models';
import { TransactionService } from '../../core/transaction.service';
import { CategoryIcon } from '../../shared/category-icon';

export interface Slide {
  tone: 'brand' | 'ink' | 'goal' | 'expense' | 'paper' | 'category';
  color?: string;
  eyebrow: string;
  big: string;
  text: string;
  icon?: string;
}

const DURATION = 5200;

/** Monta as telas da retrospectiva a partir do resumo do mês e dos lançamentos. */
export function buildSlides(
  s: MonthlySummary,
  transactions: Transaction[],
  today = new Date(),
): Slide[] {
  const name = monthName(s.month);
  const slides: Slide[] = [
    {
      tone: 'brand',
      eyebrow: 'Retrospectiva',
      big: name,
      text: `${transactions.length} lançamentos contam como foi o seu mês.`,
      icon: 'auto_awesome',
    },
    {
      tone: 'ink',
      eyebrow: s.balance >= 0 ? 'Sobrou' : 'Faltou',
      big: formatBRL(Math.abs(s.balance)),
      text: `Entraram ${formatBRL(s.income)} e saíram ${formatBRL(s.expense)}.`,
      icon: s.balance >= 0 ? 'savings' : 'trending_down',
    },
  ];
  const top = s.expensesByCategory[0];
  if (top && s.expense > 0) {
    slides.push({
      tone: 'category',
      color: top.color,
      eyebrow: 'Categoria campeã',
      big: top.name,
      text: `${formatBRL(top.total)}, ou ${Math.round((top.total / s.expense) * 100)}% de tudo que saiu.`,
      icon: top.icon,
    });
  }
  const peak = [...s.daily].sort((a, b) => b.expense - a.expense)[0];
  if (peak && peak.expense > 0) {
    const label = fromIsoDate(peak.date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    slides.push({
      tone: 'expense',
      eyebrow: 'O dia mais caro',
      big: formatBRL(peak.expense),
      text: `Foi ${label}.`,
      icon: 'local_fire_department',
    });
  }
  const biggest = transactions
    .filter((t) => t.category.type === 'EXPENSE')
    .sort((a, b) => b.amount - a.amount)[0];
  if (biggest) {
    slides.push({
      tone: 'paper',
      color: biggest.category.color,
      eyebrow: 'Maior gasto único',
      big: biggest.description,
      text: `${formatBRL(biggest.amount)} em ${biggest.category.name}.`,
      icon: biggest.category.icon,
    });
  }
  const todayIso = toIsoDate(today);
  const lived = s.daily.filter((d) => d.date <= todayIso);
  const quiet = lived.filter((d) => d.expense === 0).length;
  let streak = 0;
  let best = 0;
  for (const d of lived) {
    streak = d.expense === 0 ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  if (lived.length) {
    slides.push({
      tone: 'goal',
      eyebrow: 'Dias sem gastar',
      big: `${quiet} ${quiet === 1 ? 'dia' : 'dias'}`,
      text:
        best > 1
          ? `A maior sequência foi de ${best} dias seguidos.`
          : 'Quase todo dia teve alguma saída.',
      icon: 'spa',
    });
  }
  const prev = s.trend.at(-2);
  if (prev && prev.expense > 0 && s.expense > 0) {
    const diff = Math.round(((s.expense - prev.expense) / prev.expense) * 100);
    slides.push({
      tone: diff <= 0 ? 'brand' : 'expense',
      eyebrow: `Comparado a ${monthName(prev.month).toLowerCase()}`,
      big: `${diff > 0 ? '+' : ''}${diff}%`,
      text: diff <= 0 ? 'Você gastou menos. Bom sinal.' : 'Você gastou mais. Vale olhar as metas.',
      icon: diff <= 0 ? 'trending_down' : 'trending_up',
    });
  }
  slides.push({
    tone: 'ink',
    eyebrow: 'Fim',
    big: 'Até o próximo mês',
    text: 'O fluxo continua no painel.',
    icon: 'waving_hand',
  });
  return slides;
}

/**
 * Retrospectiva do mês em telas cheias, como stories: avança sozinha, pausa enquanto se segura,
 * toque à esquerda volta, à direita avança; setas e Esc no teclado.
 */
@Component({
  selector: 'app-retro',
  imports: [CategoryIcon],
  host: {
    '(document:keydown.arrowright)': 'next()',
    '(document:keydown.arrowleft)': 'prev()',
    '(document:keydown.space)': 'next()',
  },
  template: `
    @let s = slide();
    <div
      class="story"
      [attr.data-tone]="s?.tone"
      [style.--c]="s?.color"
      (pointerdown)="hold(true)"
      (pointerup)="tap($event)"
      (pointerleave)="hold(false)"
    >
      <div class="bars">
        @for (x of slides(); track $index) {
          <span
            ><i
              [class.full]="$index < index()"
              [class.run]="$index === index()"
              [class.paused]="paused()"
              [style.animation-duration.ms]="duration"
            ></i
          ></span>
        }
      </div>
      <button
        class="close"
        (click)="close(); $event.stopPropagation()"
        (pointerdown)="$event.stopPropagation()"
        aria-label="Fechar"
      >
        <span class="material-symbols-rounded">close</span>
      </button>

      @if (s) {
        @for (k of [index()]; track k) {
          <section class="content" aria-live="polite">
            @if (s.tone === 'category' || s.tone === 'paper') {
              <app-category-icon
                class="token"
                [icon]="s.icon ?? 'sell'"
                [color]="s.color ?? 'var(--brand)'"
                [size]="88"
              />
            } @else {
              <span class="material-symbols-rounded filled glyph">{{ s.icon }}</span>
            }
            <span class="eyebrow">{{ s.eyebrow }}</span>
            <h2 [class.long]="s.big.length > 14">{{ s.big }}</h2>
            <p>{{ s.text }}</p>
          </section>
        }
      } @else {
        <section class="content"><h2 class="long">Montando…</h2></section>
      }
    </div>
  `,
  styleUrl: './retro.scss',
})
export class Retro {
  private readonly ref = inject(MatDialogRef<Retro>);
  private readonly summary = inject<MonthlySummary>(MAT_DIALOG_DATA);
  private readonly transactions = inject(TransactionService);

  protected readonly duration = DURATION;
  protected readonly index = signal(0);
  protected readonly paused = signal(false);
  private pressedAt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private remaining = DURATION;
  private startedAt = 0;

  private readonly list = toSignal(
    this.transactions.list({ month: this.summary.month }, 0, 100).pipe(
      map((p) => p.content),
      catchError(() => of([] as Transaction[])),
    ),
  );
  protected readonly slides = computed(() => {
    const list = this.list();
    return list ? buildSlides(this.summary, list) : [];
  });
  protected readonly slide = computed(() => this.slides()[this.index()]);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    // Começa a contar quando os lançamentos chegam (as telas dependem deles).
    let started = false;
    effect(() => {
      if (!started && this.slides().length) {
        started = true;
        untracked(() => this.schedule(DURATION));
      }
    });
  }

  next(): void {
    if (this.index() >= this.slides().length - 1) return this.close();
    this.index.update((i) => i + 1);
    this.schedule(DURATION);
  }

  prev(): void {
    this.index.update((i) => Math.max(0, i - 1));
    this.schedule(DURATION);
  }

  close(): void {
    this.ref.close();
  }

  /** Segurar pausa (como nos stories); soltar rápido conta como toque. */
  protected hold(down: boolean): void {
    if (down) {
      this.pressedAt = performance.now();
      this.paused.set(true);
      clearTimeout(this.timer);
      this.remaining -= performance.now() - this.startedAt;
    } else if (this.paused()) {
      this.paused.set(false);
      this.schedule(this.remaining);
    }
  }

  protected tap(event: PointerEvent): void {
    const quick = performance.now() - this.pressedAt < 250;
    this.paused.set(false);
    if (!quick) return this.schedule(this.remaining);
    const target = event.currentTarget as HTMLElement;
    const left = event.clientX - target.getBoundingClientRect().left < target.clientWidth / 3;
    if (left) this.prev();
    else this.next();
  }

  private schedule(ms: number): void {
    clearTimeout(this.timer);
    this.remaining = ms;
    this.startedAt = performance.now();
    this.timer = setTimeout(() => this.next(), ms);
  }
}
