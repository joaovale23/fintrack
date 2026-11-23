import { TestBed } from '@angular/core/testing';
import { CategorySpending } from '../core/models';
import { provideRouter } from '@angular/router';
import { FlowChart, flowItems, spreadLabels } from './flow-chart';
import { TrendChart, niceMax, smooth } from './trend-chart';

const spending = (name: string, total: number): CategorySpending => ({
  categoryId: name,
  name,
  color: '#000000',
  icon: 'sell',
  total,
  monthlyLimit: null,
  limitUsedPercent: null,
});

describe('TrendChart', () => {
  it('arredonda o topo do eixo para um valor redondo', () => {
    expect(niceMax(4_300)).toBe(5_000);
    expect(niceMax(6_009)).toBe(10_000);
    expect(niceMax(180)).toBe(200);
  });

  it('desenha a curva passando por todos os pontos', () => {
    const d = smooth([
      { x: 0, y: 10 },
      { x: 50, y: 0 },
      { x: 100, y: 10 },
    ]);
    expect(d.startsWith('M0,10')).toBe(true);
    expect(d.endsWith('100,10')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(2);
  });

  it('mostra um rótulo por mês e o maior valor no topo do eixo', async () => {
    const fixture = TestBed.createComponent(TrendChart);
    fixture.componentRef.setInput('data', [
      { month: '2026-10', income: 5000, expense: 2500 },
      { month: '2026-11', income: 0, expense: 1000 },
    ]);
    await fixture.whenStable();
    const labels = [...fixture.nativeElement.querySelectorAll('text.axis')].map((t: Element) =>
      t.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(labels).toContain('Out');
    expect(labels).toContain('Nov');
    expect(labels).toContain('5 mil');
  });
});

describe('FlowChart', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('fecha a conta: o que entra vira cada saída mais o que sobrou', async () => {
    const fixture = TestBed.createComponent(FlowChart);
    fixture.componentRef.setInput('incomes', [spending('Salário', 5000)]);
    fixture.componentRef.setInput('expenses', [spending('Moradia', 1600), spending('Lazer', 400)]);
    fixture.componentRef.setInput('income', 5000);
    fixture.componentRef.setInput('expense', 2000);
    await fixture.whenStable();

    const names = [...fixture.nativeElement.querySelectorAll('text.name')].map((t: Element) =>
      t.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(names.some((n: string) => n.startsWith('Sobrou') && n.includes('3.000,00'))).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.ribbon')).toHaveLength(3);
  });

  it('quando gasta mais do que ganha, a coluna de entradas mostra o que saiu da reserva', async () => {
    const fixture = TestBed.createComponent(FlowChart);
    fixture.componentRef.setInput('incomes', [spending('Salário', 1000)]);
    fixture.componentRef.setInput('expenses', [spending('Moradia', 1500)]);
    fixture.componentRef.setInput('income', 1000);
    fixture.componentRef.setInput('expense', 1500);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Tirado da reserva');
  });

  it('agrupa as categorias muito pequenas em "Outros"', () => {
    const items = flowItems(
      [spending('Moradia', 2000), spending('Saúde', 50), spending('Educação', 90)],
      5000,
      2140,
    );
    expect(items.map((i) => i.name)).toEqual(['Moradia', 'Outros (2)', 'Sobrou']);
    expect(items[1].total).toBe(140);
    expect(items[1].categoryId).toBeNull();
  });

  it('uma categoria pequena sozinha continua com o próprio nome', () => {
    const items = flowItems([spending('Moradia', 2000), spending('Saúde', 50)], 2050, 2050);
    expect(items.map((i) => i.name)).toEqual(['Moradia', 'Saúde']);
  });

  it('afasta rótulos que ficariam colados', () => {
    const nodes = spreadLabels([{ labelY: 100 }, { labelY: 105 }, { labelY: 108 }], 20);
    expect(nodes.map((n) => n.labelY)).toEqual([100, 120, 140]);
  });
});
