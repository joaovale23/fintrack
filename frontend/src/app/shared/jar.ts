import { Component, computed, input } from '@angular/core';

let nextId = 0;

/**
 * Pote de vidro em SVG: o líquido sobe até a porcentagem do cofrinho, com duas ondas
 * se movendo em sentidos opostos. Quando {@link dropKey} muda, uma moeda cai dentro do pote.
 */
@Component({
  selector: 'app-jar',
  template: `
    <svg viewBox="0 0 120 150" role="img" [attr.aria-label]="percent() + '% guardado'">
      <defs>
        <clipPath [attr.id]="clipId">
          <path [attr.d]="body" />
        </clipPath>
      </defs>
      <g [attr.clip-path]="'url(#' + clipId + ')'">
        <rect x="0" y="0" width="120" height="150" class="glass-fill" />
        <g class="level" [style.transform]="'translateY(' + offset() + 'px)'">
          <path class="wave back" [attr.d]="wave" [style.fill]="color()" />
          <path class="wave front" [attr.d]="wave" [style.fill]="color()" />
        </g>
        @if (dropKey(); as key) {
          @for (k of [key]; track k) {
            <circle class="coin" cx="60" cy="0" r="9" />
          }
        }
      </g>
      <path [attr.d]="body" class="glass" />
      <path d="M22 50 C 18 70, 18 100, 22 122" class="shine" />
      <rect x="27" y="12" width="66" height="16" rx="6" class="lid" />
    </svg>
    <span class="pct num">{{ percent() }}<small>%</small></span>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      width: var(--jar-w, 120px);
      flex: none;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .glass-fill {
      fill: color-mix(in srgb, var(--ink) 4%, transparent);
    }
    .glass {
      fill: none;
      stroke: var(--ink-3);
      stroke-width: 2.5;
    }
    .shine {
      fill: none;
      stroke: var(--surface);
      stroke-width: 4;
      stroke-linecap: round;
      opacity: 0.55;
    }
    .lid {
      fill: var(--ink);
    }
    .level {
      transition: transform 1.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .wave {
      animation: wave 3.2s linear infinite;
    }
    .wave.back {
      opacity: 0.4;
      animation-duration: 4.6s;
      animation-direction: reverse;
      transform: translateY(-4px);
    }
    .coin {
      fill: var(--goal);
      stroke: color-mix(in srgb, var(--goal) 60%, #000);
      stroke-width: 2;
      animation: drop 0.9s cubic-bezier(0.5, 0, 0.75, 0) both;
    }
    .pct {
      position: absolute;
      left: 0;
      right: 0;
      top: 54%;
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      color: var(--ink);
      text-shadow: 0 1px 0 var(--surface);
    }
    .pct small {
      font-size: 0.55em;
    }
    @keyframes wave {
      from {
        translate: 0 0;
      }
      to {
        translate: -120px 0;
      }
    }
    @keyframes drop {
      0% {
        transform: translateY(-20px);
        opacity: 0;
      }
      15% {
        opacity: 1;
      }
      100% {
        transform: translateY(var(--floor, 120px));
        opacity: 0;
      }
    }
  `,
  host: { '[style.--floor.px]': 'offset() + 12' },
})
export class Jar {
  readonly percent = input.required<number>();
  readonly color = input('#1f8a5b');
  /** Mude o valor para disparar a animação da moeda caindo. */
  readonly dropKey = input<number | null>(null);

  protected readonly clipId = `jar-${nextId++}`;
  protected readonly body =
    'M32 28 H88 V36 C100 42 106 52 106 66 V122 C106 138 96 146 80 146 H40 C24 146 14 138 14 122 V66 C14 52 20 42 32 36 Z';
  protected readonly wave =
    'M0 0 Q15 -7 30 0 T60 0 T90 0 T120 0 T150 0 T180 0 T210 0 T240 0 V200 H0 Z';

  /** O líquido vai do fundo (y=146) até a boca do pote (y=40). */
  protected readonly offset = computed(() => {
    const p = Math.max(0, Math.min(this.percent(), 100)) / 100;
    return 146 - p * 106;
  });
}
