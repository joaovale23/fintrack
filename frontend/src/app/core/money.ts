const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** R$ 1.234,56 */
export function formatBRL(value: number): string {
  return brl.format(value);
}

/** 1,2 mil — para eixos e rótulos curtos. */
export function formatCompact(value: number): string {
  return compact.format(value);
}
