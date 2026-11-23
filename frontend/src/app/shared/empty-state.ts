import { Component, input } from '@angular/core';

export type EmptyArt = 'calendar' | 'target' | 'flow' | 'pace' | 'tags';

/**
 * Estado vazio com ilustração própria (SVG no estilo do app), título, texto e ações projetadas.
 * Nenhuma área do app fica só com uma frase solta quando não há dados.
 */
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="art" aria-hidden="true">
      @switch (art()) {
        @case ('calendar') {
          <svg viewBox="0 0 140 110">
            <rect x="22" y="20" width="86" height="76" rx="14" class="paper" />
            <rect x="22" y="20" width="86" height="20" rx="10" class="band" />
            <rect x="36" y="12" width="6" height="16" rx="3" class="ink" />
            <rect x="88" y="12" width="6" height="16" rx="3" class="ink" />
            @for (c of [0, 1, 2, 3]; track c) {
              @for (r of [0, 1, 2]; track r) {
                <circle [attr.cx]="40 + c * 17" [attr.cy]="54 + r * 14" r="3.5" class="dot" />
              }
            }
            <circle cx="108" cy="82" r="20" class="accent" />
            <path d="M99 80 a9 9 0 1 1 3 7 M99 80 v-6 M99 80 h6" class="arrow" />
          </svg>
        }
        @case ('target') {
          <svg viewBox="0 0 140 110">
            <circle cx="66" cy="58" r="40" class="paper" />
            <circle cx="66" cy="58" r="27" class="ring" />
            <circle cx="66" cy="58" r="14" class="ring" />
            <circle cx="66" cy="58" r="5" class="accent" />
            <path d="M66 58 L112 18" class="shaft" />
            <path d="M104 14 L116 14 L116 26" class="arrow" />
            <circle cx="24" cy="24" r="4" class="spark" />
          </svg>
        }
        @case ('flow') {
          <svg viewBox="0 0 140 110">
            <rect x="18" y="30" width="12" height="52" rx="6" class="brand" />
            <path
              d="M30 34 C 70 34, 70 22, 112 22 L112 34 C 70 34, 70 46, 30 46 Z"
              class="ribbon r1"
            />
            <path
              d="M30 48 C 70 48, 70 56, 112 56 L112 66 C 70 66, 70 60, 30 60 Z"
              class="ribbon r2"
            />
            <path
              d="M30 62 C 70 62, 70 84, 112 84 L112 92 C 70 92, 70 78, 30 78 Z"
              class="ribbon r3"
            />
            <rect x="112" y="22" width="8" height="12" rx="4" class="accent" />
            <rect x="112" y="56" width="8" height="10" rx="4" class="out" />
            <rect x="112" y="84" width="8" height="8" rx="4" class="brand" />
          </svg>
        }
        @case ('pace') {
          <svg viewBox="0 0 140 110">
            <rect x="14" y="18" width="112" height="78" rx="14" class="paper" />
            <path d="M26 80 L40 46 L58 56 L76 50" class="line" />
            <path d="M76 50 L112 70" class="dashed" />
            <circle cx="76" cy="50" r="6" class="accent" />
            <circle cx="112" cy="70" r="5" class="out" />
          </svg>
        }
        @default {
          <svg viewBox="0 0 140 110">
            <path
              d="M30 30 h50 l24 24 l-38 38 l-36 -36 z"
              class="paper"
              transform="rotate(-8 70 60)"
            />
            <circle cx="46" cy="44" r="6" class="accent" />
            <path d="M60 40 h40 l18 18 l-28 28" class="ring" />
          </svg>
        }
      }
    </div>
    <h3>{{ title() }}</h3>
    @if (text()) {
      <p>{{ text() }}</p>
    }
    <div class="actions"><ng-content /></div>
  `,
  host: { '[class.compact]': 'compact()' },
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: 6px;
      padding: 18px 8px;
      text-align: center;
      animation: pop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .art {
      width: 150px;
      margin-bottom: 4px;
    }
    :host(.compact) .art {
      width: 112px;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
      overflow: visible;
    }
    .paper {
      fill: var(--surface-2);
      stroke: var(--line);
      stroke-width: 2;
    }
    .band {
      fill: var(--surface-3);
    }
    .ink {
      fill: var(--ink-3);
    }
    .dot {
      fill: var(--surface-3);
    }
    .accent {
      fill: var(--goal);
      animation: pop 0.6s 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      transform-box: fill-box;
      transform-origin: center;
    }
    .brand {
      fill: var(--brand);
    }
    .out {
      fill: var(--expense);
    }
    .ring {
      fill: none;
      stroke: var(--ink-3);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .arrow {
      fill: none;
      stroke: #1b1a17;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .shaft {
      stroke: var(--ink-2);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 70;
      animation: draw 0.8s 0.2s ease both;
    }
    .spark {
      fill: var(--brand);
      animation: pop 0.6s 0.4s both;
    }
    .ribbon {
      opacity: 0.45;
      animation: fade 0.8s ease both;
    }
    .r1 {
      fill: var(--goal);
    }
    .r2 {
      fill: var(--expense);
      animation-delay: 0.1s;
    }
    .r3 {
      fill: var(--brand);
      animation-delay: 0.2s;
    }
    .line {
      fill: none;
      stroke: var(--brand);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 120;
      animation: draw 1s ease both;
    }
    .dashed {
      fill: none;
      stroke: var(--goal);
      stroke-width: 3;
      stroke-dasharray: 3 6;
      stroke-linecap: round;
    }
    h3 {
      font:
        700 18px 'Bricolage Grotesque',
        sans-serif;
      margin: 0;
    }
    :host(.compact) h3 {
      font-size: 16px;
    }
    p {
      margin: 0;
      max-width: 34ch;
      color: var(--ink-2);
      font-size: 14px;
    }
    .actions:not(:empty) {
      margin-top: 8px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    @keyframes draw {
      from {
        stroke-dashoffset: 120;
      }
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
  `,
})
export class EmptyState {
  readonly art = input<EmptyArt>('tags');
  readonly title = input.required<string>();
  readonly text = input('');
  readonly compact = input(false);
}
