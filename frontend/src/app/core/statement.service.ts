import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { StatementPreview, TransactionInput } from './models';

/** Importação de extrato: a API lê o arquivo (prévia) e depois grava o que a pessoa confirmou, em lote. */
@Injectable({ providedIn: 'root' })
export class StatementService {
  private readonly http = inject(HttpClient);

  preview(file: File): Observable<StatementPreview> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<StatementPreview>(`${environment.apiUrl}/api/statements/preview`, body);
  }

  importAll(items: TransactionInput[]): Observable<number> {
    return this.http
      .post<{ created: number }>(`${environment.apiUrl}/api/transactions/batch`, { items })
      .pipe(map((r) => r.created));
  }
}
