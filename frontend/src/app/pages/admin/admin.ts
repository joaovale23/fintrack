import { Component, computed, inject, signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { readApiError } from '../../core/api-error';
import { AppError, Overview, SupportReport, SupportService } from '../../core/support.service';
import { EmptyState } from '../../shared/empty-state';
import { UsageChart } from './usage-chart';

/** "há 5 min", "há 3 h", "há 2 dias": para a lista de relatos e erros. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'ontem' : `há ${days} dias`;
}

/**
 * Painel do dono do app: quem está usando, o que as pessoas relataram e os erros que o app pegou sozinho.
 * Só contagens de uso: nenhum lançamento ou valor de ninguém aparece aqui.
 */
@Component({
  selector: 'app-admin',
  imports: [UsageChart, EmptyState, MatTooltipModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminPage {
  private readonly support = inject(SupportService);

  protected readonly overview = signal<Overview | null>(null);
  protected readonly reports = signal<SupportReport[]>([]);
  protected readonly errors = signal<AppError[]>([]);
  protected readonly showResolved = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly openDetail = signal<string | null>(null);
  protected readonly ago = timeAgo;

  protected readonly cards = computed(() => {
    const o = this.overview();
    if (!o) return [];
    return [
      {
        icon: 'group',
        value: o.realUsers,
        label: 'contas reais',
        extra: o.newRealUsers7d ? `+${o.newRealUsers7d} na semana` : null,
        tone: 'brand',
      },
      { icon: 'today', value: o.activeToday, label: 'usaram hoje', extra: null, tone: 'brand' },
      {
        icon: 'date_range',
        value: o.active7d,
        label: 'usaram em 7 dias',
        extra: null,
        tone: 'brand',
      },
      {
        icon: 'person',
        value: o.visitorsToday,
        label: 'visitantes hoje',
        extra: null,
        tone: 'goal',
      },
      {
        icon: 'receipt_long',
        value: o.transactions7d,
        label: 'lançamentos em 7 dias',
        extra: null,
        tone: 'income',
      },
    ];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    const open = !this.showResolved();
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      overview: this.support.overview(),
      reports: this.support.reports(open),
      errors: this.support.errors(open),
    }).subscribe({
      next: (r) => {
        this.overview.set(r.overview);
        this.reports.set(r.reports);
        this.errors.set(r.errors);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loadError.set(readApiError(e).message);
        this.loading.set(false);
      },
    });
  }

  protected toggleResolved(): void {
    this.showResolved.update((v) => !v);
    this.load();
  }

  protected resolveReport(r: SupportReport): void {
    this.support.resolveReport(r.id, !r.resolved).subscribe(() => this.load());
  }

  protected resolveError(e: AppError): void {
    this.support.resolveError(e.id, !e.resolved).subscribe(() => this.load());
  }

  protected toggleDetail(id: string): void {
    this.openDetail.update((cur) => (cur === id ? null : id));
  }

  protected kindLabel(kind: SupportReport['kind']): string {
    return kind === 'BUG' ? 'Problema' : kind === 'IDEA' ? 'Ideia' : 'Outro';
  }

  protected kindIcon(kind: SupportReport['kind']): string {
    return kind === 'BUG' ? 'bug_report' : kind === 'IDEA' ? 'lightbulb' : 'chat_bubble';
  }

  /** "Chrome no Android", "Safari no iPhone"...: o suficiente para reproduzir, sem a string inteira. */
  protected browser(ua: string | null): string {
    if (!ua) return 'navegador desconhecido';
    const name = /Edg\//.test(ua)
      ? 'Edge'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Navegador';
    const os = /iPhone|iPad/.test(ua)
      ? 'iPhone'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X/.test(ua)
          ? 'Mac'
          : /Windows/.test(ua)
            ? 'Windows'
            : /Linux/.test(ua)
              ? 'Linux'
              : '';
    return os ? `${name} no ${os}` : name;
  }
}
