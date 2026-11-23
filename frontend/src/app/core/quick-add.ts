import { toIsoDate } from './dates';
import { Category } from './models';

export interface QuickAddResult {
  description: string;
  amount: number | null;
  date: string;
  category: Category | null;
}

/** Palavras que denunciam a categoria. Só valem se o usuário tiver uma categoria com esse nome. */
const KEYWORDS: Record<string, string[]> = {
  alimentacao: [
    'mercado',
    'supermercado',
    'padaria',
    'ifood',
    'restaurante',
    'almoco',
    'jantar',
    'lanche',
    'cafe',
    'pizza',
    'feira',
    'acougue',
    'hamburguer',
  ],
  transporte: [
    'uber',
    '99',
    'gasolina',
    'combustivel',
    'onibus',
    'metro',
    'estacionamento',
    'pedagio',
    'taxi',
    'etanol',
  ],
  moradia: ['aluguel', 'condominio', 'luz', 'agua', 'internet', 'energia', 'gas', 'iptu'],
  lazer: [
    'cinema',
    'show',
    'bar',
    'netflix',
    'spotify',
    'viagem',
    'jogo',
    'ingresso',
    'praia',
    'festa',
  ],
  saude: ['farmacia', 'remedio', 'consulta', 'academia', 'dentista', 'exame', 'medico'],
  educacao: [
    'curso',
    'livro',
    'livraria',
    'faculdade',
    'escola',
    'aula',
    'mensalidade',
    'udemy',
    'alura',
  ],
  salario: ['salario', 'pagamento', 'holerite', 'adiantamento', 'decimo', 'bonus', 'ferias'],
  freelance: ['freela', 'freelance', 'projeto', 'cliente', 'job'],
};

const DATE_WORDS: Record<string, number> = { hoje: 0, ontem: -1, anteontem: -2 };

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Sugere a categoria de uma descrição ("PIX ENVIADO UBER" → Transporte), considerando só as do tipo certo.
 * Usada na importação de extrato.
 */
export function guessCategory(
  description: string,
  type: Category['type'],
  categories: Category[],
): Category | null {
  const words = normalize(description)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const candidates = categories.filter((c) => c.type === type);
  return (
    candidates.find((c) => words.includes(normalize(c.name))) ??
    // Prefixo também vale, para nomes de loja: "cinemark" bate com "cinema", "farmaciasaojoao" com "farmacia".
    candidates.find((c) =>
      (KEYWORDS[normalize(c.name)] ?? []).some((k) =>
        words.some((w) => w === k || (k.length >= 4 && w.startsWith(k))),
      ),
    ) ??
    null
  );
}

/**
 * Interpreta um lançamento escrito em linguagem natural, por exemplo:
 * "mercado 230,50 ontem", "uber 18,9 #transporte", "salário 5.200 05/11".
 */
export function parseQuickAdd(
  text: string,
  categories: Category[],
  today = new Date(),
): QuickAddResult {
  let rest = ` ${text.trim()} `;
  let date = today;
  let category: Category | null = null;

  // Categoria explícita: #lazer
  const tag = rest.match(/\s#([\p{L}\d_-]+)/u);
  if (tag) {
    const wanted = normalize(tag[1]);
    category = categories.find((c) => normalize(c.name).startsWith(wanted)) ?? null;
    rest = rest.replace(tag[0], ' ');
  }

  // Datas: hoje, ontem, anteontem ou dd/mm[/aaaa]
  for (const [word, offset] of Object.entries(DATE_WORDS)) {
    const re = new RegExp(`\\s${word}(?=\\s)`, 'i');
    if (re.test(rest)) {
      date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      rest = rest.replace(re, ' ');
    }
  }
  const dm = rest.match(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/);
  if (dm) {
    const year = dm[3] ? Number(dm[3].length === 2 ? `20${dm[3]}` : dm[3]) : today.getFullYear();
    const candidate = new Date(year, Number(dm[2]) - 1, Number(dm[1]));
    if (!Number.isNaN(candidate.getTime()) && candidate.getDate() === Number(dm[1])) {
      date = candidate;
      rest = rest.replace(dm[0], ' ');
    }
  }

  // Valor: o último número com cara de dinheiro ("1.200,50", "35,9", "18.5", "R$ 40")
  let amount: number | null = null;
  const money = [
    ...rest.matchAll(/\s(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?=\s)/gi),
  ];
  const last = money.at(-1);
  if (last) {
    amount = parseMoney(last[1]);
    rest = rest.slice(0, last.index) + ' ' + rest.slice(last.index! + last[0].length);
  }

  const words = rest.trim().split(/\s+/).filter(Boolean);

  // Sem #tag: tenta o nome de uma categoria e depois as palavras-chave.
  if (!category) {
    const normalizedWords = words.map(normalize);
    category =
      categories.find((c) => normalizedWords.includes(normalize(c.name))) ??
      categories.find((c) =>
        (KEYWORDS[normalize(c.name)] ?? []).some((k) => normalizedWords.includes(k)),
      ) ??
      null;
  }

  const description = capitalize(words.join(' ')) || category?.name || '';
  return { description, amount, date: toIsoDate(date), category };
}

/** "1.200,50", "35,9", "18.5" ou "1.200" → número. */
export function parseMoney(raw: string): number {
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(raw)
      ? raw.replace(/\./g, '')
      : raw;
  return Math.round(Number(normalized) * 100) / 100;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
