import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

/** Cada página é carregada só quando a pessoa entra nela (lazy loading). */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Entrar · fintrack',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        title: 'Painel · fintrack',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'lancamentos',
        title: 'Lançamentos · fintrack',
        loadComponent: () =>
          import('./pages/transactions/transactions').then((m) => m.TransactionsPage),
      },
      {
        path: 'recorrentes',
        title: 'Recorrentes · fintrack',
        loadComponent: () => import('./pages/recurring/recurring').then((m) => m.RecurringPage),
      },
      { path: 'caixinhas', redirectTo: 'cofrinhos' },
      {
        path: 'cofrinhos',
        title: 'Cofrinhos · fintrack',
        loadComponent: () => import('./pages/savings/savings').then((m) => m.SavingsPage),
      },
      {
        path: 'categorias',
        title: 'Categorias · fintrack',
        loadComponent: () => import('./pages/categories/categories').then((m) => m.CategoriesPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
