import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Category, CategoryInput } from './models';

/**
 * Categorias do usuário, carregadas uma vez e compartilhadas entre as telas.
 * O httpResource expõe a lista como signal; cada alteração recarrega a lista para todo mundo.
 */
@Injectable({ providedIn: 'root' })
export class CategoryStore {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/categories`;
  private readonly auth = inject(AuthService);
  /** Depende do usuário logado: sem sessão não busca nada; trocou de conta, busca de novo. */
  private readonly resource = httpResource<Category[]>(
    () => (this.auth.user() ? { url: this.url } : undefined),
    { defaultValue: [] },
  );

  readonly all = computed(() => (this.resource.hasValue() ? this.resource.value() : []));
  readonly incomes = computed(() => this.all().filter((c) => c.type === 'INCOME'));
  readonly expenses = computed(() => this.all().filter((c) => c.type === 'EXPENSE'));
  readonly loading = this.resource.isLoading;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  create(input: CategoryInput): Observable<Category> {
    return this.http.post<Category>(this.url, input).pipe(tap(() => this.reload()));
  }

  update(id: string, input: CategoryInput): Observable<Category> {
    return this.http.put<Category>(`${this.url}/${id}`, input).pipe(tap(() => this.reload()));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(tap(() => this.reload()));
  }
}
