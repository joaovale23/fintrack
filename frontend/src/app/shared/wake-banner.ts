import { Component, inject } from '@angular/core';
import { AWAKE_HOURS, ServerStatus } from '../core/server-status';

/** Aviso fixo no topo enquanto a API gratuita acorda. Some sozinho quando ela responde. */
@Component({
  selector: 'app-wake-banner',
  template: `
    @let s = status.state();
    @if (s === 'waking' || s === 'ready') {
      <aside
        class="banner"
        [class.ready]="s === 'ready'"
        role="status"
        aria-live="polite"
        animate.enter="drop"
        animate.leave="lift"
      >
        <span class="icon material-symbols-rounded filled" aria-hidden="true">{{
          s === 'ready' ? 'check_circle' : status.offHours() ? 'bedtime' : 'hourglass_top'
        }}</span>
        <div class="text">
          @if (s === 'ready') {
            <b>Servidor pronto!</b>
            <span>Carregando suas informações.</span>
          } @else {
            <b>
              @if (status.offHours()) {
                Estamos fora do horário comercial: o servidor está acordando
              } @else {
                O servidor está ligando
              }
            </b>
            <span>
              @if (status.offHours()) {
                Das {{ hours.from }}h às {{ hours.to }}h a API fica sempre pronta. Fora desse
                horário ela dorme, por ser gratuita, e leva cerca de <b>1 minuto</b> para ligar.
              } @else {
                Leva menos de 1 minuto.
              }
              Aguarde um instante: a página continua sozinha.
              @if (status.slow()) {
                Está demorando mais que o normal, mas ainda estamos tentando.
              }
            </span>
          }
          <div class="bar" aria-hidden="true"><i [style.width.%]="status.progress()"></i></div>
        </div>
        @if (s === 'waking') {
          <span class="timer num" aria-label="Tempo de espera">{{ status.elapsed() }}s</span>
        }
      </aside>
    }
  `,
  styles: `
    .banner {
      position: fixed;
      z-index: 2000;
      top: 14px;
      left: 50%;
      translate: -50% 0;
      width: min(560px, calc(100vw - 24px));
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 22px;
      background: var(--contrast-bg);
      color: var(--contrast-fg);
      box-shadow:
        var(--shadow),
        0 18px 50px -20px rgb(0 0 0 / 45%);
    }
    .banner {
      /* Dourado ajustado ao fundo invertido, para ter contraste nos dois temas. */
      --wait: color-mix(in srgb, var(--goal) 60%, var(--contrast-fg));
    }
    .icon {
      font-size: 28px;
      color: var(--wait);
      animation: breathe 2.4s ease-in-out infinite;
    }
    .ready .icon {
      color: var(--income);
      animation: none;
    }
    .text {
      flex: 1;
      display: grid;
      gap: 4px;
      min-width: 0;
    }
    .text > b {
      font:
        700 16px/1.25 'Bricolage Grotesque',
        sans-serif;
      letter-spacing: -0.01em;
    }
    .text > span {
      font-size: 13.5px;
      line-height: 1.4;
      opacity: 0.82;
    }
    .bar {
      height: 6px;
      margin-top: 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--contrast-fg) 16%, transparent);
      overflow: hidden;
    }
    .bar i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--wait);
      transition: width 1s linear;
    }
    .ready .bar i {
      background: var(--income);
      transition-duration: 0.3s;
    }
    .timer {
      font:
        700 15px 'Bricolage Grotesque',
        sans-serif;
      opacity: 0.7;
      min-width: 3ch;
      text-align: right;
    }
    .drop {
      animation: drop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lift {
      animation: drop 0.3s ease-in reverse both;
    }
    @keyframes drop {
      from {
        opacity: 0;
        transform: translateY(-24px);
      }
    }
    @keyframes breathe {
      50% {
        transform: scale(0.86);
        opacity: 0.7;
      }
    }
  `,
})
export class WakeBanner {
  protected readonly status = inject(ServerStatus);
  protected readonly hours = AWAKE_HOURS;
}
