import { MonthlySummary, Transaction } from '../../core/models';
import { buildSlides } from './retro';

const moradia = {
  id: 'c1',
  name: 'Moradia',
  type: 'EXPENSE' as const,
  color: '#6c5ce7',
  icon: 'home',
  monthlyLimit: null,
};

const summary: MonthlySummary = {
  month: '2026-11',
  income: 5000,
  expense: 2000,
  balance: 3000,
  incomesByCategory: [],
  expensesByCategory: [
    {
      categoryId: 'c1',
      name: 'Moradia',
      color: '#6c5ce7',
      icon: 'home',
      total: 1600,
      monthlyLimit: null,
      limitUsedPercent: null,
    },
  ],
  daily: [
    { date: '2026-11-01', income: 5000, expense: 0 },
    { date: '2026-11-02', income: 0, expense: 0 },
    { date: '2026-11-03', income: 0, expense: 0 },
    { date: '2026-11-04', income: 0, expense: 2000 },
  ],
  trend: [
    { month: '2026-10', income: 5000, expense: 2500 },
    { month: '2026-11', income: 5000, expense: 2000 },
  ],
};

const transactions: Transaction[] = [
  { id: 't1', description: 'Aluguel', amount: 1600, date: '2026-11-04', category: moradia },
  { id: 't2', description: 'Mercado', amount: 400, date: '2026-11-04', category: moradia },
];

describe('buildSlides', () => {
  const slides = buildSlides(summary, transactions, new Date(2026, 10, 4));

  it('conta a história do mês na ordem certa', () => {
    expect(slides.map((s) => s.eyebrow)).toEqual([
      'Retrospectiva',
      'Sobrou',
      'Categoria campeã',
      'O dia mais caro',
      'Maior gasto único',
      'Dias sem gastar',
      'Comparado a outubro',
      'Fim',
    ]);
  });

  it('calcula os destaques', () => {
    expect(slides[2].text).toContain('80%');
    expect(slides[4].big).toBe('Aluguel');
    expect(slides[5].big).toBe('3 dias');
    expect(slides[6].big).toBe('-20%');
  });
});
