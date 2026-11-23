/** Datas sempre no fuso local: "2026-11-05" não pode virar dia 4 por causa de UTC. */

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Mês no formato da API: "2026-11". */
export function toYearMonth(date: Date): string {
  return toIsoDate(date).slice(0, 7);
}

export function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return toYearMonth(new Date(y, m - 1 + delta, 1));
}

export function monthLabel(yearMonth: string, style: 'long' | 'short' = 'long'): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: style,
    year: style === 'long' ? 'numeric' : undefined,
  });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
}

/** Só o nome do mês: "Novembro". */
export function monthName(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "Hoje", "Ontem" ou "Sáb, 21 nov". */
export function relativeDay(iso: string, today = new Date()): string {
  const date = fromIsoDate(iso);
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - date.getTime()) /
      86_400_000,
  );
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  const label = date
    .toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "hoje", "amanhã", "em 5 dias" ou "há 2 dias". */
export function untilLabel(iso: string, today = new Date()): string {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((fromIsoDate(iso).getTime() - start) / 86_400_000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  if (diff > 1) return `em ${diff} dias`;
  return diff === -1 ? 'ontem' : `há ${-diff} dias`;
}
