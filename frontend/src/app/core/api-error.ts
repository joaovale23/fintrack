import { HttpErrorResponse } from '@angular/common/http';

/** Lê o corpo Problem Details (RFC 9457) que a API devolve em todo erro. */
export interface ApiError {
  message: string;
  fieldErrors: Record<string, string>;
}

export function readApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        message:
          'Não foi possível falar com o servidor. Ele pode estar acordando; tente de novo em alguns segundos.',
        fieldErrors: {},
      };
    }
    const body = error.error as { detail?: string; errors?: Record<string, string> } | null;
    return {
      message: body?.detail ?? 'Algo deu errado. Tente de novo.',
      fieldErrors: body?.errors ?? {},
    };
  }
  return { message: 'Algo deu errado. Tente de novo.', fieldErrors: {} };
}
