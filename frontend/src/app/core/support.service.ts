import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ReportKind = 'BUG' | 'IDEA' | 'OTHER';

export interface ReportInput {
  kind: ReportKind;
  message: string;
  contactEmail: string | null;
  page: string;
}

export interface SupportReport {
  id: string;
  userName: string;
  kind: ReportKind;
  message: string;
  contactEmail: string | null;
  page: string | null;
  userAgent: string | null;
  resolved: boolean;
  createdAt: string;
}

export interface AppError {
  id: string;
  source: 'WEB' | 'API';
  message: string;
  detail: string | null;
  page: string | null;
  userAgent: string | null;
  occurrences: number;
  resolved: boolean;
  firstSeen: string;
  lastSeen: string;
}

export interface UsageDay {
  date: string;
  active: number;
  visitors: number;
  signups: number;
}

export interface Overview {
  realUsers: number;
  newRealUsers7d: number;
  activeToday: number;
  active7d: number;
  visitorsToday: number;
  transactions7d: number;
  openReports: number;
  openErrors: number;
  days: UsageDay[];
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api`;

  send(input: ReportInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.api}/support`, input);
  }

  overview(): Observable<Overview> {
    return this.http.get<Overview>(`${this.api}/admin/overview`);
  }

  reports(open: boolean): Observable<SupportReport[]> {
    return this.http.get<SupportReport[]>(`${this.api}/admin/reports`, { params: { open } });
  }

  errors(open: boolean): Observable<AppError[]> {
    return this.http.get<AppError[]>(`${this.api}/admin/errors`, { params: { open } });
  }

  resolveReport(id: string, resolved: boolean): Observable<SupportReport> {
    return this.http.put<SupportReport>(`${this.api}/admin/reports/${id}`, { resolved });
  }

  resolveError(id: string, resolved: boolean): Observable<void> {
    return this.http.put<void>(`${this.api}/admin/errors/${id}`, { resolved });
  }
}
