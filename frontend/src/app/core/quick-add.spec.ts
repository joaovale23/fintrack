import { Category } from './models';
import { guessCategory, parseMoney, parseQuickAdd } from './quick-add';

const cat = (name: string, type: Category['type'] = 'EXPENSE'): Category => ({
  id: name.toLowerCase(),
  name,
  type,
  color: '#000000',
  icon: 'sell',
  monthlyLimit: null,
});

const categories = [cat('Alimentação'), cat('Transporte'), cat('Lazer'), cat('Salário', 'INCOME')];
const today = new Date(2026, 10, 23); // 23/11/2026

describe('parseQuickAdd', () => {
  it('entende descrição, valor com vírgula e "ontem", e acha a categoria pela palavra-chave', () => {
    const r = parseQuickAdd('mercado 230,50 ontem', categories, today);
    expect(r).toEqual({
      description: 'Mercado',
      amount: 230.5,
      date: '2026-11-22',
      category: categories[0],
    });
  });

  it('aceita categoria explícita com # mesmo sem acento e abreviada', () => {
    const r = parseQuickAdd('presente da Ana 120 #laz', categories, today);
    expect(r.category?.name).toBe('Lazer');
    expect(r.description).toBe('Presente da Ana');
    expect(r.amount).toBe(120);
  });

  it('lê data no formato dd/mm e valor com milhar', () => {
    const r = parseQuickAdd('salário 5.200 05/11', categories, today);
    expect(r.amount).toBe(5200);
    expect(r.date).toBe('2026-11-05');
    expect(r.category?.type).toBe('INCOME');
  });

  it('sem valor nem categoria conhecida, devolve o que conseguiu', () => {
    const r = parseQuickAdd('presente', categories, today);
    expect(r.amount).toBeNull();
    expect(r.category).toBeNull();
    expect(r.date).toBe('2026-11-23');
  });

  it('usa o nome da categoria quando só sobra o valor', () => {
    const r = parseQuickAdd('#transporte 18.9', categories, today);
    expect(r.description).toBe('Transporte');
    expect(r.amount).toBe(18.9);
  });
});

describe('parseMoney', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['35,9', 35.9],
    ['18.5', 18.5],
    ['1.200', 1200],
    ['40', 40],
  ])('%s → %d', (raw, expected) => {
    expect(parseMoney(raw)).toBe(expected);
  });
});

describe('guessCategory (importação de extrato)', () => {
  const all = [...categories, cat('Freelance', 'INCOME')];

  it('reconhece palavras-chave e nomes de loja pelo prefixo', () => {
    expect(guessCategory('COMPRA CARTAO - SUPERMERCADO BOM PRECO', 'EXPENSE', all)?.name).toBe(
      'Alimentação',
    );
    expect(guessCategory('CINEMARK', 'EXPENSE', all)?.name).toBe('Lazer');
    expect(guessCategory('UBER *TRIP', 'EXPENSE', all)?.name).toBe('Transporte');
  });

  it('só sugere categorias do tipo certo', () => {
    expect(guessCategory('PIX RECEBIDO - CLIENTE ACME', 'INCOME', all)?.name).toBe('Freelance');
    expect(guessCategory('Salário', 'EXPENSE', all)).toBeNull();
  });

  it('sem pista nenhuma, não chuta', () => {
    expect(guessCategory('TED 00123', 'EXPENSE', all)).toBeNull();
  });
});
