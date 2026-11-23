import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { readApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { CategoryStore } from '../../core/category-store';
import { monthLabel, monthName, toIsoDate, toYearMonth, untilLabel } from '../../core/dates';
import { formatBRL } from '../../core/money';
import { MonthlySummary } from '../../core/models';
import { RecurringService } from '../../core/recurring.service';
import { TransactionEditor } from '../../core/transaction-editor';
import { BudgetRing } from '../../shared/budget-ring';
import { CategoryIcon } from '../../shared/category-icon';
import { CountUp } from '../../shared/count-up';
import { EmptyState } from '../../shared/empty-state';
import { FlowChart } from '../../shared/flow-chart';
import { MonthSwitcher } from '../../shared/month-switcher';
import { PaceChart } from '../../shared/pace-chart';
import { SpendCalendar } from '../../shared/spend-calendar';
import { TrendChart } from '../../shared/trend-chart';
import { Retro } from './retro';

interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  limit: number;
  percent: number;
}

/** Destaque do mês: um número grande e uma frase curta explicando. */
interface Insight {
  icon: string;
  value: string;
  caption: string;
  tone: 'good' | 'bad' | 'neutral';
  /** Desempate dentro do mesmo tom: menor aparece antes. */
  weight?: number;
}

const TONE_ORDER = { bad: 0, neutral: 1, good: 2 } as const;

/** R$ 136 (sem centavos), para números de destaque. */
function wholeBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    MonthSwitcher,
    CountUp,
    FlowChart,
    BudgetRing,
    CategoryIcon,
    SpendCalendar,
    TrendChart,
    PaceChart,
    EmptyState,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly editor = inject(TransactionEditor);
  private readonly categories = inject(CategoryStore);
  private readonly user = inject(AuthService).user;
  private readonly dialog = inject(MatDialog);
  private readonly recurring = inject(RecurringService);

  protected readonly month = signal(toYearMonth(new Date()));
  protected readonly monthName = computed(() => monthName(this.month()));
  protected readonly year = computed(() => this.month().slice(0, 4));

  /** O resumo é um httpResource: trocar o mês (signal) já dispara a nova busca e cancela a anterior. */
  protected readonly summary = httpResource<MonthlySummary>(() => ({
    url: `${environment.apiUrl}/api/summary`,
    params: { month: this.month() },
  }));

  protected readonly data = computed(() => (this.summary.hasValue() ? this.summary.value() : null));
  protected readonly errorMessage = computed(() =>
    this.summary.error() ? readApiError(this.summary.error()).message : null,
  );

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const first = this.user()?.name.split(' ')[0] ?? '';
    return `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}, ${first}`;
  });

  protected readonly incomeShare = computed(() => {
    const d = this.data();
    const total = d ? d.income + d.expense : 0;
    return total ? (d!.income / total) * 100 : 50;
  });

  /** Metas: categorias de despesa com teto, inclusive as que ainda não tiveram gasto no mês. */
  protected readonly goals = computed<Goal[]>(() => {
    const spent = new Map(
      (this.data()?.expensesByCategory ?? []).map((c) => [c.categoryId, c.total]),
    );
    return this.categories
      .expenses()
      .filter((c) => c.monthlyLimit)
      .map((c) => {
        const s = spent.get(c.id) ?? 0;
        return {
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          spent: s,
          limit: c.monthlyLimit!,
          percent: Math.round((s / c.monthlyLimit!) * 100),
        };
      })
      .sort((a, b) => b.percent - a.percent);
  });

  protected readonly insights = computed<Insight[]>(() => {
    const d = this.data();
    if (!d) return [];
    const list: Insight[] = [];
    const prev = d.trend.at(-2);
    if (prev && prev.expense > 0 && d.expense > 0) {
      const diff = Math.round(((d.expense - prev.expense) / prev.expense) * 100);
      if (diff !== 0)
        list.push({
          icon: diff < 0 ? 'trending_down' : 'trending_up',
          value: `${diff < 0 ? '−' : '+'}${Math.abs(diff)}%`,
          caption: `de saídas em relação a ${monthName(prev.month).toLowerCase()}`,
          tone: diff < 0 ? 'good' : 'bad',
        });
    }
    const top = d.expensesByCategory[0];
    if (top && d.expense > 0) {
      list.push({
        icon: top.icon,
        value: `${Math.round((top.total / d.expense) * 100)}%`,
        caption: `das saídas foram para ${top.name}`,
        tone: 'neutral',
      });
    }
    const now = new Date();
    if (this.month() === toYearMonth(now) && d.balance > 0) {
      const daysLeft =
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
      list.push({
        icon: 'savings',
        value: wholeBRL(d.balance / daysLeft),
        caption: 'por dia, até o fim do mês, sem ficar no vermelho',
        tone: 'good',
      });
    }
    const todayIso = toIsoDate(new Date());
    const lived = (d.daily ?? []).filter((day) => day.date <= todayIso);
    const quiet = lived.filter((day) => day.expense === 0).length;
    // Só faz sentido contar dias sem gasto quando houve algum gasto no mês.
    if (lived.length > 3 && quiet > 0 && d.expense > 0) {
      list.push({
        icon: 'spa',
        value: String(quiet),
        caption: `${quiet === 1 ? 'dia' : 'dias'} sem gastar nada neste mês`,
        tone: 'good',
      });
    }
    const over = this.goals().filter((g) => g.percent > 100);
    if (over.length) {
      list.push({
        icon: 'warning',
        value: String(over.length),
        caption: `${over.length === 1 ? 'meta estourou' : 'metas estouraram'}: ${over.map((g) => g.name).join(', ')}`,
        tone: 'bad',
        weight: -1,
      });
    }
    // Do mais preocupante ao mais positivo: o que pede atenção aparece primeiro.
    return list.sort(
      (a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone] || (a.weight ?? 0) - (b.weight ?? 0),
    );
  });

  /** Próximas contas recorrentes (as quatro mais próximas). */
  protected readonly upcoming = computed(() =>
    this.recurring
      .bills()
      .filter((b) => b.active && b.nextDate)
      .sort((a, b) => a.nextDate!.localeCompare(b.nextDate!))
      .slice(0, 4),
  );
  protected readonly until = untilLabel;
  protected readonly brl = formatBRL;
  protected readonly monthLabel = monthLabel;

  constructor() {
    // Um lançamento salvo em qualquer lugar (atalho N, botão +) atualiza o painel.
    effect(() => {
      if (this.editor.version() > 0)
        untracked(() => {
          this.summary.reload();
          this.recurring.reload();
        });
    });
  }

  /** Abre a retrospectiva do mês em tela cheia (no celular) ou num "telefone" no centro (desktop). */
  openRetro(): void {
    const d = this.data();
    if (!d) return;
    const mobile = matchMedia('(max-width: 640px)').matches;
    this.dialog.open(Retro, {
      data: d,
      panelClass: 'story-panel',
      backdropClass: 'soft-backdrop',
      width: mobile ? '100vw' : '420px',
      maxWidth: '100vw',
      height: mobile ? '100dvh' : 'min(760px, 92dvh)',
      maxHeight: '100dvh',
      autoFocus: false,
    });
  }

  newTransaction(): void {
    this.editor.open().subscribe();
  }
}
