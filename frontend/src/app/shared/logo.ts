import { Component, input } from '@angular/core';

/**
 * Marca do fintrack: um cromossomo. Duas cromátides, a verde (o que entra) e a vermelha (o que sai),
 * se cruzam no centrômero, que é o ponto: o saldo. O ponto muda com o tema.
 */
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 48 32" [attr.height]="size()" aria-hidden="true">
      <path class="a" d="M4 4.5 C 15 4.5, 17.5 16, 24 16 C 30.5 16, 33 27.5, 44 27.5" />
      <path class="b" d="M4 27.5 C 15 27.5, 17.5 16, 24 16 C 30.5 16, 33 4.5, 44 4.5" />
      <circle class="dot" cx="24" cy="16" r="4.4" />
    </svg>
    @if (withName()) {
      <span class="name">fintrack</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: var(--ink);
    }
    svg {
      display: block;
      overflow: visible;
    }
    path {
      fill: none;
      stroke-width: 5.5;
      stroke-linecap: round;
      stroke-dasharray: 52;
      animation: draw 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .a {
      stroke: var(--income);
    }
    .b {
      stroke: var(--expense);
      animation-delay: 0.12s;
    }
    .dot {
      fill: currentColor;
      stroke: var(--bg);
      stroke-width: 2.5;
      animation: pop 0.4s 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      transform-origin: 24px 16px;
    }
    .name {
      font:
        800 22px/1 'Bricolage Grotesque',
        sans-serif;
      letter-spacing: -0.045em;
    }
    @keyframes draw {
      from {
        stroke-dashoffset: 52;
      }
    }
  `,
})
export class Logo {
  readonly size = input(24);
  readonly withName = input(true);
}
