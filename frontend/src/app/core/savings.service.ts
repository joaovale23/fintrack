import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SavingsGoal, SavingsGoalInput } from './models';

/** Cofrinhos do usuário (httpResource) e as operações sobre eles. */
@Injectable({ providedIn: 'root' })
export class SavingsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/api/savings`;
  private readonly resource = httpResource<SavingsGoal[]>(
    () => (this.auth.user() ? { url: this.url } : undefined),
    { defaultValue: [] },
  );

  readonly goals = computed(() => (this.resource.hasValue() ? this.resource.value() : []));
  readonly loading = this.resource.isLoading;
  readonly error = this.resource.error;
  readonly totalSaved = computed(() => this.goals().reduce((sum, g) => sum + g.saved, 0));

  reload(): void {
    this.resource.reload();
  }

  create(input: SavingsGoalInput): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(this.url, input).pipe(tap(() => this.reload()));
  }

  update(id: string, input: SavingsGoalInput): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.url}/${id}`, input).pipe(tap(() => this.reload()));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(tap(() => this.reload()));
  }

  /** Atualiza só o cofrinho mexido na lista, sem recarregar tudo (e sem "piscar" o pote). */
  move(id: string, amount: number, kind: 'DEPOSIT' | 'WITHDRAW'): Observable<SavingsGoal> {
    return this.http
      .post<SavingsGoal>(`${this.url}/${id}/moves`, { amount, kind })
      .pipe(
        tap((updated) =>
          this.resource.update((list) =>
            (list ?? []).map((g) => (g.id === updated.id ? updated : g)),
          ),
        ),
      );
  }
}
