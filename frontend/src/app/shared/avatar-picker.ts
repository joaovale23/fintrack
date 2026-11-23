import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { readApiError } from '../core/api-error';
import { AuthService } from '../core/auth.service';
import { AVATARS, Avatar } from './avatar';

/** Escolha do personagem da foto de perfil (ou voltar para as iniciais). Salva na conta. */
@Component({
  selector: 'app-avatar-picker',
  imports: [MatDialogModule, Avatar],
  template: `
    <div class="box">
      <span class="eyebrow">Foto de perfil</span>
      <h2>Escolha seu personagem</h2>
      <div class="grid" role="radiogroup" aria-label="Personagens">
        @for (a of avatars; track a.id; let i = $index) {
          <button
            type="button"
            role="radio"
            [class.active]="current() === a.id"
            [attr.aria-checked]="current() === a.id"
            (click)="choose(a.id)"
            [disabled]="saving()"
            [style.--i]="i"
          >
            <app-avatar [avatar]="a.id" [size]="76" />
            <span>{{ a.label }}</span>
          </button>
        }
        <button
          type="button"
          role="radio"
          class="initials"
          [class.active]="!current()"
          [attr.aria-checked]="!current()"
          (click)="choose(null)"
          [disabled]="saving()"
          [style.--i]="avatars.length"
        >
          <app-avatar [avatar]="null" [name]="name()" [size]="76" />
          <span>Iniciais</span>
        </button>
      </div>
      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
      <button class="btn ghost close" mat-dialog-close>Fechar</button>
    </div>
  `,
  styles: `
    .box {
      display: grid;
      gap: 6px;
      padding: 26px;
      width: min(470px, 94vw);
    }
    h2 {
      font-size: 24px;
      margin-bottom: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px 8px;
    }
    .grid button {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 10px 4px;
      border: 0;
      background: none;
      color: var(--ink-2);
      font:
        600 13px 'Instrument Sans',
        sans-serif;
      cursor: pointer;
      animation: pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      animation-delay: calc(var(--i) * 50ms);
    }
    .grid app-avatar {
      transition:
        transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
        box-shadow 0.2s;
    }
    .grid button:hover app-avatar {
      transform: translateY(-4px) rotate(-4deg);
    }
    .grid button.active {
      color: var(--ink);
    }
    .grid button.active app-avatar {
      box-shadow:
        0 0 0 3px var(--surface),
        0 0 0 6px var(--brand);
    }
    .error {
      color: var(--expense);
      margin: 8px 0 0;
    }
    .close {
      justify-self: end;
      margin-top: 12px;
    }
  `,
})
export class AvatarPicker {
  private readonly auth = inject(AuthService);
  private readonly ref = inject(MatDialogRef<AvatarPicker>);
  protected readonly avatars = AVATARS;
  protected readonly current = signal(this.auth.user()?.avatar ?? null);
  protected readonly name = signal(this.auth.user()?.name ?? '');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  choose(avatar: string | null): void {
    this.current.set(avatar);
    this.saving.set(true);
    this.error.set(null);
    this.auth.updateAvatar(avatar).subscribe({
      next: () => this.ref.close(),
      error: (e: unknown) => {
        this.error.set(readApiError(e).message);
        this.saving.set(false);
      },
    });
  }
}
