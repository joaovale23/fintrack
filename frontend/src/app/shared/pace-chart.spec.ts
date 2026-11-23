import { DaySpending } from '../core/models';
import { computePace } from './pace-chart';

const day = (d: number, income = 0, expense = 0): DaySpending => ({
  date: `2026-11-${String(d).padStart(2, '0')}`,
  income,
  expense,
});

describe('computePace', () => {
  const daily = Array.from({ length: 30 }, (_, i) => day(i + 1));
  daily[0] = day(1, 3000, 100);
  daily[1] = day(2, 0, 200);
  daily[2] = day(3, 0, 300);

  it('acumula o saldo dia a dia até hoje e projeta o resto com o gasto médio', () => {
    const pace = computePace(daily, new Date(2026, 10, 3, 18, 0));
    expect(pace.actual).toEqual([2900, 2700, 2400]);
    expect(pace.averageDailyExpense).toBe(200);
    expect(pace.isProjection).toBe(true);
    // 27 dias restantes × 200 = 5400 → 2400 − 5400
    expect(pace.final).toBe(-3000);
    expect(pace.projected).toHaveLength(28);
  });

  it('mês já encerrado não tem projeção: o final é o saldo real', () => {
    const pace = computePace(daily, new Date(2026, 11, 10));
    expect(pace.isProjection).toBe(false);
    expect(pace.final).toBe(2400);
    expect(pace.projected).toEqual([]);
  });

  it('mês futuro não tem dados', () => {
    const pace = computePace(daily, new Date(2026, 9, 10));
    expect(pace.actual).toEqual([]);
    expect(pace.final).toBe(0);
  });
});
