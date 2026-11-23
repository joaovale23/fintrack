import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from './models';

const response = (expiresInMs: number): AuthResponse => ({
  token: 'jwt-123',
  expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  user: { id: 'u1', name: 'Ana Souza', email: 'ana@teste.dev', demo: false },
});

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('guarda o token e o usuário depois do login', () => {
    service.login('ana@teste.dev', 'segredo-123').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/api/auth/login'));
    expect(req.request.body).toEqual({ email: 'ana@teste.dev', password: 'segredo-123' });
    req.flush(response(60_000));

    expect(service.token()).toBe('jwt-123');
    expect(service.user()?.name).toBe('Ana Souza');
    expect(localStorage.getItem('fintrack.session')).toContain('jwt-123');
  });

  it('descarta o token vencido', () => {
    service.demo().subscribe();
    http.expectOne((r) => r.url.endsWith('/api/auth/demo')).flush(response(-1));

    expect(service.token()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('logout limpa a sessão e volta para o login', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service.login('ana@teste.dev', 'segredo-123').subscribe();
    http.expectOne((r) => r.url.endsWith('/api/auth/login')).flush(response(60_000));

    service.logout();

    expect(service.token()).toBeNull();
    expect(localStorage.getItem('fintrack.session')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
