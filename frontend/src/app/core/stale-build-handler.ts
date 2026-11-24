import { ErrorHandler, Injectable } from '@angular/core';

const RELOADED_AT_KEY = 'fintrack.reloadedForNewBuild';

/** O navegador não achou um pedaço do app (chunk) que foi carregado sob demanda. */
export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    message,
  );
}

/**
 * Cada deploy no GitHub Pages troca os arquivos e apaga os antigos. Uma aba aberta antes do deploy
 * ainda pede os pedaços da versão anterior, que dão 404 ao trocar de página. Nesse caso, recarrega
 * uma vez para pegar a versão nova. A marca de tempo evita recarregar em loop se o erro persistir.
 */
@Injectable()
export class StaleBuildHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    if (isStaleChunkError(error) && this.canReload()) {
      location.reload();
      return;
    }
    super.handleError(error);
  }

  private canReload(): boolean {
    try {
      const last = Number(sessionStorage.getItem(RELOADED_AT_KEY) ?? 0);
      if (Date.now() - last < 30_000) return false;
      sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
    } catch {
      // Sem sessionStorage: recarrega mesmo assim, no pior caso uma vez por erro.
    }
    return true;
  }
}
