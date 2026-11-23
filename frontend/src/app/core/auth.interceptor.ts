import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Coloca o token em toda chamada à API e, se a API responder 401 (token vencido ou inválido),
 * encerra a sessão e volta para o login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  // Só as chamadas para a nossa API levam o token; nunca um servidor de terceiros.
  const isApi = environment.apiUrl
    ? req.url.startsWith(environment.apiUrl)
    : req.url.startsWith('/api/');
  const isAuthCall = req.url.includes('/api/auth/');
  const token = isApi && !isAuthCall ? auth.token() : null;
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApi && !isAuthCall) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
