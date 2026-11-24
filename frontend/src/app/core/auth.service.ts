import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from './models';

const STORAGE_KEY = 'fintrack.session';

interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

/** Guarda a sessão (token + usuário) num signal e no localStorage, para sobreviver a um F5. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  token(): string | null {
    const session = this.session();
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.clear();
      return null;
    }
    return session.token;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(tap((r) => this.store(r)));
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, { name, email, password })
      .pipe(tap((r) => this.store(r)));
  }

  /** Conta de visitante: vazia, para usar o app sem e-mail nem senha. */
  guest(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/guest`, {})
      .pipe(tap((r) => this.store(r)));
  }

  /** Demonstração: conta temporária já preenchida com seis meses de dados de exemplo. */
  demo(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/demo`, {})
      .pipe(tap((r) => this.store(r)));
  }

  /** Troca o personagem da foto de perfil e atualiza a sessão guardada. */
  updateAvatar(avatar: string | null): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/api/me/avatar`, { avatar }).pipe(
      tap((user) => {
        const session = this.session();
        if (session) this.persist({ ...session, user });
      }),
    );
  }

  logout(): void {
    this.clear();
    void this.router.navigate(['/login']);
  }

  private store(response: AuthResponse): void {
    this.persist({ token: response.token, expiresAt: response.expiresAt, user: response.user });
  }

  private persist(session: Session): void {
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Navegação privada pode bloquear o localStorage: a sessão continua valendo só nesta aba.
    }
  }

  private clear(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* idem */
    }
  }
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
  } catch {
    return null;
  }
}
