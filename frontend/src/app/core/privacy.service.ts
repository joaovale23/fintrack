import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

const STORAGE_KEY = 'fintrack.privacy';

/** Modo discreto: borra os valores na tela, para abrir o app em público. Atalho: H. */
@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly document = inject(DOCUMENT);
  readonly on = signal(readStored());

  constructor() {
    effect(() => {
      const on = this.on();
      this.document.documentElement.classList.toggle('privacy', on);
      try {
        localStorage.setItem(STORAGE_KEY, String(on));
      } catch {
        /* navegação privada */
      }
    });
  }

  toggle(): void {
    this.on.update((v) => !v);
  }
}

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}
