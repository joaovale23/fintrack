import { Component, computed, input } from '@angular/core';

export const AVATARS = [
  { id: 'porquinho', label: 'Porquinho' },
  { id: 'raposa', label: 'Raposa' },
  { id: 'coruja', label: 'Coruja' },
  { id: 'gato', label: 'Gato' },
  { id: 'panda', label: 'Panda' },
  { id: 'sapo', label: 'Sapo' },
  { id: 'coala', label: 'Coala' },
  { id: 'lobo', label: 'Lobo' },
] as const;

/**
 * Foto de perfil: um dos personagens desenhados em SVG ou, se a pessoa não escolheu, as iniciais.
 * Os desenhos são formas simples (sem contorno), no mesmo estilo dos ícones do app.
 */
@Component({
  selector: 'app-avatar',
  template: `
    @switch (avatar()) {
      @case ('porquinho') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#f8dadd" />
          <!-- moeda entrando na fenda do cofrinho -->
          <g class="coin-drop">
            <circle cx="32" cy="15" r="6" fill="#f2c14e" />
            <circle cx="32" cy="15" r="3.7" fill="none" stroke="#c9962b" stroke-width="1.3" />
          </g>
          <path d="M16 27 L19 12 L29 21 Z M48 27 L45 12 L35 21 Z" fill="#e98a97" />
          <ellipse cx="32" cy="37" rx="19" ry="17" fill="#f4a9b3" />
          <rect x="27.5" y="22" width="9" height="2.6" rx="1.3" fill="#c96a78" />
          <circle cx="24.5" cy="33" r="2.5" fill="#2a1d1f" />
          <circle cx="39.5" cy="33" r="2.5" fill="#2a1d1f" />
          <circle cx="25.3" cy="32.2" r="0.8" fill="#fff" />
          <circle cx="40.3" cy="32.2" r="0.8" fill="#fff" />
          <ellipse cx="32" cy="42" rx="8" ry="5.6" fill="#e98a97" />
          <ellipse cx="29.3" cy="42" rx="1.3" ry="2" fill="#b4566a" />
          <ellipse cx="34.7" cy="42" rx="1.3" ry="2" fill="#b4566a" />
          <circle cx="18.5" cy="40" r="3" fill="#ef7f8f" opacity="0.45" />
          <circle cx="45.5" cy="40" r="3" fill="#ef7f8f" opacity="0.45" />
        </svg>
      }
      @case ('raposa') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#fde4d0" />
          <path
            d="M32 56 C 19 56 11 46 11 35 L 13 14 L 25 25 C 29 24 35 24 39 25 L 51 14 L 53 35 C 53 46 45 56 32 56 Z"
            fill="#ee8236"
          />
          <path d="M15.5 19 L 22 25.5 L 16.5 28 Z M48.5 19 L 42 25.5 L 47.5 28 Z" fill="#fff3e8" />
          <path
            d="M32 56 C 23 56 16 49 14 40 C 21 42 27 41 32 47 C 37 41 43 42 50 40 C 48 49 41 56 32 56 Z"
            fill="#fff7ef"
          />
          <path
            d="M21 36 Q 24.5 32.5 28 36 Q 24.5 38 21 36 Z M36 36 Q 39.5 32.5 43 36 Q 39.5 38 36 36 Z"
            fill="#2a1d1f"
          />
          <ellipse cx="32" cy="47.5" rx="2.8" ry="2.1" fill="#2a1d1f" />
          <!-- monóculo de ouro com corrente -->
          <circle
            cx="39.5"
            cy="35.5"
            r="6"
            fill="#fff"
            fill-opacity="0.18"
            stroke="#f2c14e"
            stroke-width="2"
          />
          <path
            d="M45 39 C 48 44, 46 49, 50 53"
            fill="none"
            stroke="#f2c14e"
            stroke-width="1.3"
            stroke-dasharray="1.6 1.4"
            stroke-linecap="round"
          />
        </svg>
      }
      @case ('coruja') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#d9ebe2" />
          <path d="M14 29 L15 14 L25 22 Z M50 29 L49 14 L39 22 Z" fill="#7d5f49" />
          <ellipse cx="32" cy="41" rx="19" ry="19" fill="#8c6b53" />
          <ellipse cx="32" cy="53" rx="11" ry="7.5" fill="#c9a98b" />
          <circle cx="24.5" cy="35" r="8" fill="#fff6ea" />
          <circle cx="39.5" cy="35" r="8" fill="#fff6ea" />
          <circle cx="25.5" cy="36" r="4" fill="#2a1d1f" />
          <circle cx="38.5" cy="36" r="4" fill="#2a1d1f" />
          <circle cx="26.7" cy="34.7" r="1.3" fill="#fff" />
          <circle cx="39.7" cy="34.7" r="1.3" fill="#fff" />
          <path d="M32 41 L 28.8 44.5 L 32 48.5 L 35.2 44.5 Z" fill="#f0ad35" />
          <!-- cartola com faixa dourada -->
          <rect x="21" y="19.5" width="22" height="3.4" rx="1.7" fill="#24201c" />
          <rect x="24.5" y="6" width="15" height="15" rx="2" fill="#2e2924" />
          <rect x="24.5" y="15.5" width="15" height="3" fill="#f2c14e" />
        </svg>
      }
      @case ('gato') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#e3e1f4" />
          <path d="M13 32 L15 11 L29 22 Z M51 32 L49 11 L35 22 Z" fill="#5d6177" />
          <path d="M17 26 L18 16 L25 22 Z M47 26 L46 16 L39 22 Z" fill="#f0a3b1" />
          <ellipse cx="32" cy="37" rx="20" ry="17" fill="#5d6177" />
          <ellipse cx="25" cy="35" rx="3.4" ry="4" fill="#c8e36e" />
          <ellipse cx="39" cy="35" rx="3.4" ry="4" fill="#c8e36e" />
          <ellipse cx="25" cy="35" rx="1.1" ry="3.3" fill="#1f2128" />
          <ellipse cx="39" cy="35" rx="1.1" ry="3.3" fill="#1f2128" />
          <path d="M30 41 L34 41 L32 43.5 Z" fill="#f0a3b1" />
          <path
            d="M28.5 45 Q 32 48 32 44 Q 32 48 35.5 45"
            fill="none"
            stroke="#1f2128"
            stroke-width="1.4"
            stroke-linecap="round"
          />
          <path
            d="M8 40 L 19 41 M8 45 L 19 44 M56 40 L 45 41 M56 45 L 45 44"
            stroke="#c8cadb"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <!-- coleira vermelha com plaquinha de moeda -->
          <path
            d="M17 50 Q 32 57 47 50"
            fill="none"
            stroke="#d64545"
            stroke-width="3.2"
            stroke-linecap="round"
          />
          <circle cx="32" cy="57.5" r="4.6" fill="#f2c14e" />
          <circle cx="32" cy="57.5" r="2.9" fill="none" stroke="#c9962b" stroke-width="1.3" />
        </svg>
      }
      @case ('panda') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#e2eedb" />
          <circle cx="17" cy="21" r="7" fill="#2b2b30" />
          <circle cx="47" cy="21" r="7" fill="#2b2b30" />
          <ellipse cx="32" cy="38" rx="20" ry="18" fill="#fbfaf5" />
          <ellipse cx="24" cy="37" rx="5.2" ry="7" transform="rotate(-28 24 37)" fill="#2b2b30" />
          <ellipse cx="40" cy="37" rx="5.2" ry="7" transform="rotate(28 40 37)" fill="#2b2b30" />
          <circle cx="24.8" cy="36" r="2.1" fill="#fff" />
          <circle cx="39.2" cy="36" r="2.1" fill="#fff" />
          <circle cx="25.2" cy="36.3" r="1" fill="#2b2b30" />
          <circle cx="38.8" cy="36.3" r="1" fill="#2b2b30" />
          <ellipse cx="32" cy="45" rx="3.4" ry="2.4" fill="#2b2b30" />
          <path
            d="M29 49.5 Q 32 51.5 35 49.5"
            fill="none"
            stroke="#2b2b30"
            stroke-width="1.4"
            stroke-linecap="round"
          />
          <circle cx="18" cy="46" r="2.8" fill="#f3a9a0" opacity="0.5" />
          <circle cx="46" cy="46" r="2.8" fill="#f3a9a0" opacity="0.5" />
          <!-- viseira verde de contador -->
          <path d="M13 27 Q 32 15 51 27 L 49 31 Q 32 22 15 31 Z" fill="#2f9e6a" />
          <path d="M15 31 Q 32 22 49 31" fill="none" stroke="#1d6b47" stroke-width="1.2" />
        </svg>
      }
      @case ('sapo') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#dcf0d4" />
          <circle cx="21" cy="28" r="9" fill="#68bd66" />
          <circle cx="43" cy="28" r="9" fill="#68bd66" />
          <ellipse cx="32" cy="43" rx="22" ry="15" fill="#68bd66" />
          <circle cx="21" cy="27" r="6" fill="#fff" />
          <circle cx="43" cy="27" r="6" fill="#fff" />
          <circle cx="22" cy="28" r="3.1" fill="#1e2a1f" />
          <circle cx="42" cy="28" r="3.1" fill="#1e2a1f" />
          <circle cx="23" cy="27" r="1" fill="#fff" />
          <circle cx="43" cy="27" r="1" fill="#fff" />
          <path
            d="M19 44 Q 32 55 45 44"
            fill="none"
            stroke="#2c6e36"
            stroke-width="2.4"
            stroke-linecap="round"
          />
          <circle cx="15.5" cy="46" r="3" fill="#f29b8a" opacity="0.55" />
          <circle cx="48.5" cy="46" r="3" fill="#f29b8a" opacity="0.55" />
          <!-- coroa de ouro (o sapo virou rei do orçamento) -->
          <path
            d="M24 26 L 25.5 15 L 29 20 L 32 12.5 L 35 20 L 38.5 15 L 40 26 Z"
            fill="#f2c14e"
            stroke="#c9962b"
            stroke-width="1"
            stroke-linejoin="round"
          />
          <circle cx="32" cy="22" r="1.6" fill="#d64545" />
        </svg>
      }
      @case ('coala') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#dde7f0" />
          <circle cx="13" cy="24" r="11" fill="#8e98a6" />
          <circle cx="51" cy="24" r="11" fill="#8e98a6" />
          <circle cx="13.5" cy="24.5" r="6.5" fill="#f3e9ec" />
          <circle cx="50.5" cy="24.5" r="6.5" fill="#f3e9ec" />
          <ellipse cx="32" cy="36" rx="18" ry="17" fill="#a3acb9" />
          <ellipse cx="32" cy="43" rx="11" ry="8" fill="#c3cad3" />
          <circle cx="24.5" cy="32" r="2.4" fill="#262a31" />
          <circle cx="39.5" cy="32" r="2.4" fill="#262a31" />
          <circle cx="25.2" cy="31.3" r="0.8" fill="#fff" />
          <circle cx="40.2" cy="31.3" r="0.8" fill="#fff" />
          <path
            d="M26.5 35 C 26.5 31.5 37.5 31.5 37.5 35 L 37 41.5 C 36 45.5 28 45.5 27 41.5 Z"
            fill="#3a3f48"
          />
          <ellipse cx="29.5" cy="36.6" rx="1.6" ry="1" fill="#6b7280" opacity="0.8" />
          <circle cx="19" cy="40" r="2.6" fill="#f2a7b3" opacity="0.5" />
          <circle cx="45" cy="40" r="2.6" fill="#f2a7b3" opacity="0.5" />
          <!-- abraçado a uma moeda -->
          <circle cx="32" cy="57" r="8.5" fill="#f2c14e" />
          <circle cx="32" cy="57" r="5.3" fill="none" stroke="#c9962b" stroke-width="1.3" />
          <ellipse cx="22.5" cy="55" rx="4.5" ry="3.6" fill="#8e98a6" />
          <ellipse cx="41.5" cy="55" rx="4.5" ry="3.6" fill="#8e98a6" />
        </svg>
      }
      @case ('lobo') {
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" fill="#e2e6ee" />
          <path d="M13 32 L15 7 L29 20 Z M51 32 L49 7 L35 20 Z" fill="#6f7a8a" />
          <path d="M17 25 L18 13 L25 20 Z M47 25 L46 13 L39 20 Z" fill="#c9cfd8" />
          <path
            d="M32 55 C 19 55 11 47 12 37 C 12.5 27 20 19 32 19 C 44 19 51.5 27 52 37 C 53 47 45 55 32 55 Z"
            fill="#7b8696"
          />
          <path d="M32 21 L28.5 30 L32 35 L35.5 30 Z" fill="#949fae" />
          <path
            d="M32 55 C 25 55 20 50.5 20 45 C 24 44 28.5 42 32 39 C 35.5 42 40 44 44 45 C 44 50.5 39 55 32 55 Z"
            fill="#e9edf2"
          />
          <ellipse cx="24.5" cy="34" rx="3.3" ry="2.6" fill="#f2b134" />
          <ellipse cx="39.5" cy="34" rx="3.3" ry="2.6" fill="#f2b134" />
          <circle cx="24.8" cy="34" r="1.3" fill="#1d2026" />
          <circle cx="39.2" cy="34" r="1.3" fill="#1d2026" />
          <ellipse cx="32" cy="44" rx="3.3" ry="2.3" fill="#22252b" />
          <path
            d="M29.5 48.5 Q 32 50.5 34.5 48.5"
            fill="none"
            stroke="#22252b"
            stroke-width="1.3"
            stroke-linecap="round"
          />
          <!-- lobo de Wall Street: colarinho e gravata -->
          <path d="M22 64 L26 55 L32 58 L38 55 L42 64 Z" fill="#2f3542" />
          <path d="M26 55 L32 58 L29 61.5 Z M38 55 L32 58 L35 61.5 Z" fill="#fff" />
          <path d="M30.6 58 L33.4 58 L34.6 64 L29.4 64 Z" fill="#c0392b" />
          <rect x="29.6" y="60" width="4.8" height="1.4" fill="#f2c14e" />
        </svg>
      }
      @default {
        <span class="initials">{{ initials() }}</span>
      }
    }
  `,
  host: { '[style.--size.px]': 'size()', '[attr.title]': 'label()' },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: var(--size);
      height: var(--size);
      border-radius: 50%;
      overflow: hidden;
      background: var(--brand);
      color: var(--brand-ink);
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    /* A moeda do porquinho cai na fenda quando o avatar aparece. */
    .coin-drop {
      animation: coin-drop 1.4s cubic-bezier(0.5, 0, 0.3, 1) both;
    }
    @keyframes coin-drop {
      from {
        transform: translateY(-14px);
        opacity: 0;
      }
      40% {
        opacity: 1;
      }
    }
    .initials {
      font:
        700 calc(var(--size) * 0.37) 'Bricolage Grotesque',
        sans-serif;
    }
  `,
})
export class Avatar {
  readonly avatar = input<string | null | undefined>(null);
  readonly name = input('');
  readonly size = input(38);

  protected readonly initials = computed(
    () =>
      this.name()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('') || '?',
  );
  protected readonly label = computed(
    () => AVATARS.find((a) => a.id === this.avatar())?.label ?? this.name(),
  );
}
