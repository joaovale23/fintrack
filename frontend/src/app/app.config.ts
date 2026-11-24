import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  ErrorHandler,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { PrivacyService } from './core/privacy.service';
import { StaleBuildHandler } from './core/stale-build-handler';
import { ThemeService } from './core/theme.service';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Aba aberta antes de um deploy: recarrega em vez de quebrar ao trocar de página.
    { provide: ErrorHandler, useClass: StaleBuildHandler },
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Transição suave entre páginas com a View Transitions API do navegador.
      withViewTransitions({ skipInitialTransition: true }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter(),
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
      inject(ThemeService);
      inject(PrivacyService);
    }),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
    },
    // Todo modal cabe na tela: altura e largura limitadas, com rolagem por dentro.
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        maxHeight: 'calc(100dvh - 32px)',
        maxWidth: '96vw',
        backdropClass: 'soft-backdrop',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      },
    },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000, panelClass: 'toast' } },
  ],
};
