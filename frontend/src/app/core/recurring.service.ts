import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { RecurringBill, RecurringBillInput } from './models';
import { TransactionEditor } from './transaction-editor';

/** Contas recorrentes. Criar ou mudar uma pode gerar lançamentos na hora, então avisa as outras telas. */
@Injectable({ providedIn: 'root' })
export class RecurringService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly editor = inject(TransactionEditor);
  private readonly url = `${environment.apiUrl}/api/recurring`;
  private readonly resource = httpResource<RecurringBill[]>(
    () => (this.auth.user() ? { url: this.url } : undefined),
    { defaultValue: [] },
  );

  readonly bills = computed(() => (this.resource.hasValue() ? this.resource.value() : []));
  readonly loading = this.resource.isLoading;
  /** Total mensal das contas ativas de saída e de entrada. */
  readonly monthlyOut = computed(() => this.sum('EXPENSE'));
  readonly monthlyIn = computed(() => this.sum('INCOME'));

  reload(): void {
    this.resource.reload();
  }

  create(input: RecurringBillInput): Observable<RecurringBill> {
    return this.http.post<RecurringBill>(this.url, input).pipe(tap(() => this.changed()));
  }

  update(id: string, input: RecurringBillInput): Observable<RecurringBill> {
    return this.http.put<RecurringBill>(`${this.url}/${id}`, input).pipe(tap(() => this.changed()));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(tap(() => this.reload()));
  }

  private changed(): void {
    this.reload();
    this.editor.changed();
  }

  private sum(type: 'INCOME' | 'EXPENSE'): number {
    return this.bills()
      .filter((b) => b.active && b.category.type === type)
      .reduce((total, b) => total + b.amount, 0);
  }
}
