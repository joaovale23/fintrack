import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { readApiError } from '../core/api-error';
import { AuthService } from '../core/auth.service';
import { AVATARS, Avatar } from './avatar';

/**
 * Primeira entrada: boas-vindas e a escolha do personagem. O escolhido aparece grande no topo e
 * "pula" a cada troca. Ao continuar, o avatar é salvo e o tour guiado começa.
 */
@Component({
  selector: 'app-welcome-dialog',
  imports: [Avatar],
  template: `
    <div class="box">
      <div class="hero">
        @for (a of [current()]; track a) {
          <div class="chosen" animate.enter="bounce">
            <app-avatar [avatar]="a" [name]="name()" [size]="112" />
          </div>
        }
        <span class="eyebrow">Boas-vindas ao fintrack</span>
        <h2>Que bom ter você aqui, {{ firstName() }}!</h2>
        <p>Antes de tudo, escolha quem vai te acompanhar nas contas.</p>
      </div>

      <div class="grid" role="radiogroup" aria-label="Personagens">
        @for (a of avatars; track a.id; let i = $index) {
          <button
            type="button"
            role="radio"
            [class.active]="current() === a.id"
            [attr.aria-checked]="current() === a.id"
            [attr.aria-label]="a.label"
            (click)="current.set(a.id)"
            [style.--i]="i"
          >
            <app-avatar [avatar]="a.id" [size]="58" />
            <span>{{ a.label }}</span>
          </button>
        }
      </div>

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <footer>
        <button class="btn ghost" (click)="save(null)" [disabled]="saving()">
          Escolher depois
        </button>
        <button class="btn primary" (click)="save(current())" [disabled]="saving()">
          {{ saving() ? 'Salvando…' : 'Continuar' }}
          <span class="material-symbols-rounded">arrow_forward</span>
        </button>
      </footer>
    </div>
  `,
  styles: `
    .box {
      display: grid;
      gap: 16px;
      padding: 26px 24px 22px;
      width: min(500px, 94vw);
    }
    .hero {
      display: grid;
      justify-items: center;
      text-align: center;
      gap: 4px;
    }
    .chosen {
      margin-bottom: 10px;
      border-radius: 50%;
      box-shadow:
        0 0 0 4px var(--surface),
        0 0 0 7px var(--accent),
        0 20px 40px -18px rgb(0 0 0 / 50%);
    }
    .bounce {
      animation: bounce 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both;
    }
    h2 {
      margin: 2px 0 0;
      font:
        800 26px/1.15 'Bricolage Grotesque',
        sans-serif;
      letter-spacing: -0.03em;
    }
    p {
      margin: 0;
      color: var(--ink-2);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .grid button {
      display: grid;
      justify-items: center;
      gap: 6px;
      padding: 10px 2px 8px;
      border: 0;
      border-radius: 18px;
      background: none;
      color: var(--ink-2);
      font:
        600 12.5px 'Instrument Sans',
        sans-serif;
      cursor: pointer;
      transition: background 0.2s;
      animation: pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      animation-delay: calc(120ms + var(--i) * 45ms);
    }
    .grid button:hover {
      background: var(--surface-2);
    }
    .grid app-avatar {
      transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .grid button:hover app-avatar {
      transform: translateY(-3px) rotate(-5deg);
    }
    .grid button.active {
      color: var(--ink);
      background: color-mix(in srgb, var(--accent) 16%, transparent);
    }
    .error {
      color: var(--expense);
    }
    footer {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    footer .btn .material-symbols-rounded {
      font-size: 19px;
    }
    @keyframes bounce {
      from {
        transform: scale(0.6) rotate(-10deg);
        opacity: 0;
      }
    }
    @media (max-width: 420px) {
      .box {
        padding: 22px 16px 18px;
      }
      h2 {
        font-size: 23px;
      }
    }
  `,
})
export class WelcomeDialog {
  private readonly auth = inject(AuthService);
  private readonly ref = inject(MatDialogRef<WelcomeDialog>);
  protected readonly avatars = AVATARS;
  /** Começa com um personagem sorteado, para a tela já abrir viva. */
  protected readonly current = signal<string | null>(
    this.auth.user()?.avatar ?? AVATARS[Math.floor(Math.random() * AVATARS.length)].id,
  );
  protected readonly name = computed(() => this.auth.user()?.name ?? '');
  protected readonly firstName = computed(() => this.name().split(' ')[0] || 'pessoa');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  /** "Escolher depois" fica com as iniciais; o tour começa do mesmo jeito. */
  save(avatar: string | null): void {
    this.saving.set(true);
    this.error.set(null);
    this.auth.updateAvatar(avatar).subscribe({
      next: () => this.ref.close(true),
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.saving.set(false);
      },
    });
  }
}
