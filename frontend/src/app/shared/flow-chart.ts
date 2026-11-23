import { BreakpointObserver } from '@angular/cdk/layout';
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { formatBRL } from '../core/money';
import { CategorySpending } from '../core/models';

/** Uma "saída" do mês: categoria de despesa, o grupo "Outros" ou o que sobrou. */
export interface FlowItem {
  key: string;
  name: string;
  color: string;
  total: number;
  /** Categoria a abrir no clique (nulo para "Sobrou" e "Outros"). */
  categoryId: string | null;
  /** Categorias que foram agrupadas em "Outros". */
  members?: string[];
}

export interface FlowRow extends FlowItem {
  y: number;
  h: number;
  /** Onde a faixa nasce na coluna de entradas. */
  sy: number;
  labelY: number;
  percent: number;
  /** Faixa curva. */
  d: string;
  /** Barra da categoria: reta do lado da faixa, arredondada para fora. */
  node: string;
}

interface Source {
  key: string;
  name: string;
  color: string;
  total: number;
  y: number;
  h: number;
  /** Fatia da coluna de entradas: reta do lado das faixas, arredondada para fora nas pontas. */
  d: string;
}

const W = 880;
const H = 360;
const POOL_X = 150;
const POOL_W = 16;
const NODE_X = W - 250;
const NODE_W = 10;
const GAP = 14;
const MIN_H = 8;
/** Categorias abaixo disso (fração do total) entram em "Outros", para não virarem fiapos impossíveis de apontar. */
const SMALL = 0.035;

/**
 * Agrupa as categorias pequenas em "Outros" e acrescenta "Sobrou" quando entrou mais do que saiu.
 * Exportado para teste.
 */
export function flowItems(
  expenses: CategorySpending[],
  income: number,
  expense: number,
): FlowItem[] {
  const total = Math.max(income, expense) || 1;
  const big = expenses.filter((c) => c.total / total >= SMALL);
  const small = expenses.filter((c) => c.total / total < SMALL);
  const items: FlowItem[] = big.map((c) => ({
    key: c.categoryId,
    name: c.name,
    color: c.color,
    total: c.total,
    categoryId: c.categoryId,
  }));
  if (small.length === 1) {
    const c = small[0];
    items.push({
      key: c.categoryId,
      name: c.name,
      color: c.color,
      total: c.total,
      categoryId: c.categoryId,
    });
  } else if (small.length > 1) {
    items.push({
      key: 'others',
      name: `Outros (${small.length})`,
      color: 'var(--ink-3)',
      total: small.reduce((s, c) => s + c.total, 0),
      categoryId: null,
      members: small.map((c) => `${c.name} ${formatBRL(c.total)}`),
    });
  }
  const surplus = income - expense;
  if (surplus > 0)
    items.push({
      key: 'surplus',
      name: 'Sobrou',
      color: 'var(--brand)',
      total: surplus,
      categoryId: null,
    });
  return items;
}

/** Empurra os rótulos que ficariam colados e, se passar do fim, sobe o bloco. */
export function spreadLabels<T extends { labelY: number }>(
  nodes: T[],
  gap: number,
  bottom = H - 8,
): T[] {
  for (let i = 1; i < nodes.length; i++)
    nodes[i].labelY = Math.max(nodes[i].labelY, nodes[i - 1].labelY + gap);
  const overflow = (nodes.at(-1)?.labelY ?? 0) - bottom;
  if (overflow > 0) {
    nodes.at(-1)!.labelY -= overflow;
    for (let i = nodes.length - 2; i >= 0; i--)
      nodes[i].labelY = Math.min(nodes[i].labelY, nodes[i + 1].labelY - gap);
  }
  return nodes;
}

/**
 * "Para onde foi o dinheiro": as entradas formam uma coluna à esquerda e dela saem faixas,
 * com degradê, até cada categoria de despesa (e o que sobrou). A linha inteira (faixa, barra e rótulo)
 * reage ao mouse; o clique abre os lançamentos da categoria. No celular vira uma barra empilhada.
 */
@Component({
  selector: 'app-flow-chart',
  imports: [DecimalPipe],
  templateUrl: './flow-chart.html',
  styleUrl: './flow-chart.scss',
})
export class FlowChart {
  readonly incomes = input.required<CategorySpending[]>();
  readonly expenses = input.required<CategorySpending[]>();
  readonly income = input.required<number>();
  readonly expense = input.required<number>();

  private readonly router = inject(Router);
  protected readonly W = W;
  protected readonly H = H;
  protected readonly POOL_X = POOL_X;
  protected readonly POOL_W = POOL_W;
  protected readonly NODE_X = NODE_X;
  protected readonly NODE_W = NODE_W;
  protected readonly hovered = signal<string | null>(null);
  protected readonly brl = formatBRL;
  protected readonly narrow = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 640px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  private readonly total = computed(() => Math.max(this.income(), this.expense()));
  protected readonly empty = computed(() => this.total() === 0);
  private readonly items = computed(() =>
    flowItems(this.expenses(), this.income(), this.expense()),
  );

  /** Altura útil: a mesma escala para a coluna de entradas e para as saídas (que têm os vãos entre si). */
  private readonly scale = computed(() => {
    const n = Math.max(this.items().length, 1);
    return (H - 24 - GAP * (n - 1) - MIN_H) / (this.total() || 1);
  });

  /** Coluna de entradas, centralizada e empilhada; se faltou dinheiro, a reserva completa a coluna. */
  protected readonly sources = computed<Source[]>(() => {
    const scale = this.scale();
    const list = this.incomes().map((c) => ({
      key: c.categoryId,
      name: c.name,
      color: c.color,
      total: c.total,
    }));
    const deficit = this.expense() - this.income();
    if (deficit > 0)
      list.push({
        key: 'reserve',
        name: 'Tirado da reserva',
        color: 'var(--ink-3)',
        total: deficit,
      });
    const height = this.total() * scale;
    let y = (H - height) / 2;
    return list.map((s, i) => {
      const h = s.total * scale;
      const source = {
        ...s,
        y,
        h,
        d: capLeft(POOL_X, y, POOL_W, h, i === 0, i === list.length - 1),
      };
      y += h;
      return source;
    });
  });

  protected readonly pool = computed(() => {
    const s = this.sources();
    return s.length ? { y: s[0].y, h: s.at(-1)!.y + s.at(-1)!.h - s[0].y } : { y: H / 2, h: 0 };
  });

  protected readonly rows = computed<FlowRow[]>(() => {
    const scale = this.scale();
    const items = this.items();
    const heights = items.map((i) => Math.max(MIN_H, i.total * scale));
    const column = heights.reduce((a, b) => a + b, 0) + GAP * Math.max(items.length - 1, 0);
    let y = (H - column) / 2;
    let sy = this.pool().y;
    const rows = items.map((item, i) => {
      const h = heights[i];
      // Na coluna de entradas a faixa ocupa a fatia proporcional (sem o mínimo visual).
      const sh = item.total * scale;
      const row: FlowRow = {
        ...item,
        y,
        h,
        sy,
        labelY: y + h / 2,
        percent: Math.round((item.total / (this.income() || this.total())) * 100),
        // A faixa entra 1px na coluna e na barra: sem fresta de antialiasing na emenda.
        d: ribbon(POOL_X + POOL_W - 1, sy, sh, NODE_X + 1, y, h),
        node: capRight(NODE_X, y, NODE_W, h),
      };
      y += h + GAP;
      sy += sh;
      return row;
    });
    return spreadLabels(rows, 24);
  });

  protected readonly active = computed(
    () => this.rows().find((r) => r.key === this.hovered()) ?? null,
  );

  /** Barra empilhada para o celular. */
  protected readonly bars = computed(() => {
    const total = this.total() || 1;
    return this.items().map((i) => ({ ...i, pct: (i.total / total) * 100 }));
  });

  protected open(row: FlowItem): void {
    if (row.categoryId)
      void this.router.navigate(['/lancamentos'], { queryParams: { categoria: row.categoryId } });
  }

  protected toggle(key: string): void {
    this.hovered.update((k) => (k === key ? null : key));
  }
}

/** Retângulo com os cantos da direita arredondados e o lado esquerdo reto (onde a faixa encosta). */
export function capRight(x: number, y: number, w: number, h: number): string {
  const r = Math.min(w / 2, h / 2, 6);
  return `M${x},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x} Z`;
}

/** Fatia da coluna de entradas: lado direito reto; arredonda à esquerda só no topo da primeira e na base da última. */
export function capLeft(
  x: number,
  y: number,
  w: number,
  h: number,
  top: boolean,
  bottom: boolean,
): string {
  const r = Math.min(w / 2, h / 2, 7);
  const rt = top ? r : 0;
  const rb = bottom ? r : 0;
  return `M${x + w},${y} V${y + h} H${x + rb} A${rb},${rb} 0 0 1 ${x},${y + h - rb} V${y + rt} A${rt},${rt} 0 0 1 ${x + rt},${y} Z`;
}

/** Faixa curva: nasce com altura {@code sh} na coluna de entradas e chega com altura {@code h} na categoria. */
function ribbon(x0: number, y0: number, sh: number, x1: number, y1: number, h: number): string {
  const c0 = x0 + (x1 - x0) * 0.45;
  const c1 = x0 + (x1 - x0) * 0.55;
  return `M${x0},${y0} C${c0},${y0} ${c1},${y1} ${x1},${y1} L${x1},${y1 + h} C${c1},${y1 + h} ${c0},${y0 + sh} ${x0},${y0 + sh} Z`;
}
