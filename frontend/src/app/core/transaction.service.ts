import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page, Transaction, TransactionFilter, TransactionInput } from './models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/transactions`;

  list(filter: TransactionFilter, page: number, size: number): Observable<Page<Transaction>> {
    let params = new HttpParams().set('page', page).set('size', size);
    // Só manda os filtros preenchidos.
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<Page<Transaction>>(this.url, { params });
  }

  create(input: TransactionInput): Observable<Transaction> {
    return this.http.post<Transaction>(this.url, input);
  }

  update(id: string, input: TransactionInput): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.url}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
