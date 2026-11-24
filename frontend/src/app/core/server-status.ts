import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';

/** Horário em que um ping externo mantém a API acordada (fuso de São Paulo). Fora dele, ela dorme. */
export const AWAKE_HOURS = { from: 8, to: 19 };

/** Quanto a API gratuita do Render costuma levar para ligar depois de dormir. */
const EXPECTED_WAKE_SECONDS = 60;
/** Se a API responder antes disso, ninguém precisa ver aviso nenhum. */
const SHOW_AFTER_MS = 2500;

export function isOffHours(now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now),
  );
  return hour < AWAKE_HOURS.from || hour >= AWAKE_HOURS.to;
}

/**
 * Descobre se a API está dormindo. Assim que o app abre, chama o endpoint de liveness (não toca no banco).
 * Se ele demorar, o aviso aparece com um cronômetro e some sozinho quando a API responde.
 */
@Injectable({ providedIn: 'root' })
export class ServerStatus {
  readonly state = signal<'checking' | 'waking' | 'ready' | 'up'>('checking');
  readonly elapsed = signal(0);
  readonly offHours = signal(isOffHours());
  /** Barra de progresso estimada: anda até 95% no tempo esperado e espera a resposta para fechar. */
  readonly progress = computed(() =>
    this.state() === 'ready'
      ? 100
      : Math.min(95, Math.round((this.elapsed() / EXPECTED_WAKE_SECONDS) * 100)),
  );
  readonly slow = computed(() => this.elapsed() > EXPECTED_WAKE_SECONDS * 2);

  private readonly startedAt = Date.now();
  private ticker?: ReturnType<typeof setInterval>;

  constructor() {
    const reveal = setTimeout(() => this.startWaking(), SHOW_AFTER_MS);
    void this.poll().then(() => clearTimeout(reveal));
  }

  private startWaking(): void {
    if (this.state() !== 'checking') return;
    this.state.set('waking');
    this.ticker = setInterval(
      () => this.elapsed.set(Math.floor((Date.now() - this.startedAt) / 1000)),
      1000,
    );
  }

  /** Tenta de novo a cada poucos segundos: enquanto acorda, o Render pode devolver erro em vez de segurar a conexão. */
  private async poll(): Promise<void> {
    for (;;) {
      try {
        const response = await fetch(`${environment.apiUrl}/actuator/health/liveness`, {
          cache: 'no-store',
        });
        if (response.ok) break;
      } catch {
        // Rede ou CORS durante o boot: tenta de novo.
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    clearInterval(this.ticker);
    if (this.state() === 'waking') {
      this.state.set('ready');
      setTimeout(() => this.state.set('up'), 1600);
    } else {
      this.state.set('up');
    }
  }
}
