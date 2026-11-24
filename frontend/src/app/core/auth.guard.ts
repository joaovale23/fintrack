import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Páginas internas: sem sessão, vai para o login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token() ? true : inject(Router).createUrlTree(['/login']);
};

/** Painel de administração: só para quem a API marca como admin. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user()?.admin ? true : inject(Router).createUrlTree(['/']);
};

/** Página de login: quem já entrou vai direto para o painel. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token() ? inject(Router).createUrlTree(['/']) : true;
};
