import { Component, input } from '@angular/core';

/** Bolha colorida com o ícone da categoria. */
@Component({
  selector: 'app-category-icon',
  template: `<span class="material-symbols-rounded filled" aria-hidden="true">{{ icon() }}</span>`,
  host: {
    '[style.--c]': 'color()',
    '[style.--s.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: var(--s);
      height: var(--s);
      border-radius: 50%;
      background: color-mix(in srgb, var(--c) 16%, var(--surface));
      color: var(--c);
    }
    span {
      font-size: calc(var(--s) * 0.52);
    }
  `,
})
export class CategoryIcon {
  readonly icon = input('sell');
  readonly color = input('#888888');
  readonly size = input(40);
}
