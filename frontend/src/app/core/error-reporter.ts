import { environment } from '../../environments/environment';

const MAX_PER_SESSION = 10;
const sent = new Set<string>();

/**
 * Manda um erro inesperado do navegador para a API, que agrupa e avisa o dono do app.
 * Usa fetch (e não HttpClient) para não depender de nada do Angular que possa ser a própria causa do erro.
 * O mesmo erro só vai uma vez por sessão, e no máximo 10 erros diferentes.
 */
export function reportClientError(error: unknown): void {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = `${err.name}: ${err.message}`.slice(0, 500);
    if (sent.has(message) || sent.size >= MAX_PER_SESSION) return;
    sent.add(message);
    void fetch(`${environment.apiUrl}/api/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        detail: err.stack?.slice(0, 4000) ?? null,
        page: location.pathname + location.search,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Reportar erro nunca pode gerar outro erro.
  }
}

/** Erros de rede e de HTTP já aparecem para a pessoa e são registrados na API; não precisam ir de novo. */
export function isWorthReporting(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name;
  return name !== 'HttpErrorResponse';
}
