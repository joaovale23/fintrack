export type CategoryType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  name: string;
  email: string;
  demo: boolean;
  /** Personagem escolhido (porquinho, raposa...); nulo mostra as iniciais. */
  avatar?: string | null;
  /** Vê o painel /admin (uso, relatos e erros). */
  admin?: boolean;
  /** false só para quem ainda não passou pela primeira entrada (avatar e tour). */
  onboarded?: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  /** Nome de um ícone do Material Symbols. */
  icon: string;
  monthlyLimit: number | null;
}

export type CategoryInput = Omit<Category, 'id'>;

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  /** Data no formato ISO (yyyy-MM-dd), sem fuso. */
  date: string;
  category: Category;
  /** Veio de uma conta recorrente. */
  recurring?: boolean;
}

export interface TransactionInput {
  description: string;
  amount: number;
  date: string;
  categoryId: string;
}

export interface TransactionFilter {
  month?: string;
  categoryId?: string;
  type?: CategoryType;
  search?: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CategorySpending {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
}

export interface DaySpending {
  date: string;
  income: number;
  expense: number;
}

export interface MonthTrend {
  month: string;
  income: number;
  expense: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  incomesByCategory: CategorySpending[];
  expensesByCategory: CategorySpending[];
  daily: DaySpending[];
  trend: MonthTrend[];
}

export interface SavingsMove {
  id: string;
  /** Positivo: guardado. Negativo: resgatado. */
  amount: number;
  date: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  deadline: string | null;
  saved: number;
  percent: number;
  monthlyNeeded: number | null;
  recentMoves: SavingsMove[];
}

export interface SavingsGoalInput {
  name: string;
  icon: string;
  color: string;
  target: number;
  deadline: string | null;
}

export interface RecurringBill {
  id: string;
  description: string;
  amount: number;
  category: Category;
  dayOfMonth: number;
  /** "2026-11" */
  startMonth: string;
  active: boolean;
  /** Próxima vez que vira lançamento (nulo se pausada). */
  nextDate: string | null;
}

export interface RecurringBillInput {
  description: string;
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  startMonth?: string;
  active?: boolean;
}

export interface StatementRow {
  date: string;
  description: string;
  /** Positivo: entrada. Negativo: saída. */
  amount: number;
  duplicate: boolean;
}

export interface StatementPreview {
  format: 'CSV' | 'OFX';
  rows: StatementRow[];
}
