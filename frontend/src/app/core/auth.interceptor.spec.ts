import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const api = (path: string) => `${environment.apiUrl}${path}`;

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const auth = { token: vi.fn<() => string | null>(), logout: vi.fn() };

  beforeEach(() => {
    auth.token.mockReset();
    auth.logout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('manda o token no cabeçalho Authorization', () => {
    auth.token.mockReturnValue('jwt-abc');
    http.get(api('/api/transactions')).subscribe();
    expect(backend.expectOne(api('/api/transactions')).request.headers.get('Authorization')).toBe(
      'Bearer jwt-abc',
    );
  });

  it('não manda token nas rotas de login e cadastro', () => {
    auth.token.mockReturnValue('jwt-abc');
    http.post(api('/api/auth/login'), {}).subscribe();
    expect(backend.expectOne(api('/api/auth/login')).request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('encerra a sessão quando a API responde 401', () => {
    auth.token.mockReturnValue('jwt-vencido');
    http.get(api('/api/summary')).subscribe({ error: () => undefined });
    backend.expectOne(api('/api/summary')).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('não mexe em chamadas para outros servidores', () => {
    auth.token.mockReturnValue('jwt-abc');
    http.get('https://outro-site.dev/dados').subscribe();
    expect(
      backend.expectOne('https://outro-site.dev/dados').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('não encerra a sessão em outros erros', () => {
    auth.token.mockReturnValue('jwt-abc');
    http.delete(api('/api/categories/1')).subscribe({ error: () => undefined });
    backend
      .expectOne(api('/api/categories/1'))
      .flush(null, { status: 409, statusText: 'Conflict' });
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
