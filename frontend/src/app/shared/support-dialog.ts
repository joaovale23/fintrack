import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { readApiError } from '../core/api-error';
import { AuthService } from '../core/auth.service';
import { ReportKind, SupportService } from '../core/support.service';

/** "Relatar problema": chega por e-mail ao dono do app e fica no painel de administração. */
@Component({
  selector: 'app-support-dialog',
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    @if (!sent()) {
      <form [formGroup]="form" (ngSubmit)="send()" class="box">
        <header>
          <span class="eyebrow">Suporte</span>
          <h2>Fale com quem fez o app</h2>
          <p>Achou um erro ou tem uma ideia? Conte aqui: a mensagem chega direto para mim.</p>
        </header>

        <div class="kinds" role="radiogroup" aria-label="Tipo">
          @for (k of kinds; track k.id) {
            <button
              type="button"
              role="radio"
              class="chip-button"
              [class.active]="form.controls.kind.value === k.id"
              [attr.aria-checked]="form.controls.kind.value === k.id"
              [style.--c]="k.color"
              (click)="form.controls.kind.setValue(k.id)"
            >
              <span
                class="material-symbols-rounded"
                [class.filled]="form.controls.kind.value === k.id"
                >{{ k.icon }}</span
              >
              {{ k.label }}
            </button>
          }
        </div>

        <label class="field">
          <span>{{ placeholderTitle() }}</span>
          <textarea
            formControlName="message"
            rows="5"
            maxlength="2000"
            [placeholder]="placeholder()"
            cdkFocusInitial
          ></textarea>
        </label>
        @if (form.controls.message.touched && form.controls.message.invalid) {
          <p class="error">Conte o que aconteceu</p>
        }

        <label class="field">
          <span>E-mail para resposta <em>(opcional)</em></span>
          <input
            type="email"
            formControlName="contactEmail"
            autocomplete="email"
            placeholder="voce@email.com"
          />
        </label>
        @if (form.controls.contactEmail.touched && form.controls.contactEmail.invalid) {
          <p class="error">E-mail inválido</p>
        }

        <p class="note">
          <span class="material-symbols-rounded">info</span>
          Junto vão a página em que você está e o navegador, para ajudar a encontrar o problema.
          Nenhum lançamento ou valor seu é enviado.
        </p>

        @if (error(); as message) {
          <p class="error" role="alert">{{ message }}</p>
        }

        <footer>
          <button type="button" class="btn ghost" mat-dialog-close>Cancelar</button>
          <button type="submit" class="btn primary" [disabled]="sending()">
            <span class="material-symbols-rounded">send</span>
            {{ sending() ? 'Enviando…' : 'Enviar' }}
          </button>
        </footer>
      </form>
    } @else {
      <div class="box done" animate.enter="pop">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="44" />
          <path d="M40 61 L 54 75 L 82 46" />
        </svg>
        <h2>Recebido, obrigado!</h2>
        <p>
          @if (form.controls.contactEmail.value) {
            Vou olhar com carinho e, se precisar, respondo em
            <b>{{ form.controls.contactEmail.value }}</b>.
          } @else {
            Vou olhar com carinho. Cada relato ajuda a deixar o fintrack melhor.
          }
        </p>
        <button class="btn primary" mat-dialog-close>Fechar</button>
      </div>
    }
  `,
  styles: `
    .box {
      display: grid;
      gap: 14px;
      padding: 24px;
      width: min(500px, 92vw);
    }
    header h2 {
      margin: 4px 0 6px;
      font:
        700 24px/1.15 'Bricolage Grotesque',
        sans-serif;
      letter-spacing: -0.02em;
    }
    header p {
      margin: 0;
      color: var(--ink-2);
      font-size: 14px;
    }
    .kinds {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kinds .material-symbols-rounded {
      font-size: 18px;
      color: var(--c);
    }
    .field {
      display: grid;
      gap: 6px;
    }
    .field span {
      font-size: 13px;
      font-weight: 600;
      color: var(--ink-2);
    }
    .field em {
      font-style: normal;
      font-weight: 400;
    }
    .field input,
    .field textarea {
      padding: 12px 14px;
      border-radius: 14px;
      border: 1.5px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      font:
        500 15px/1.45 'Instrument Sans',
        sans-serif;
      outline: 0;
      resize: vertical;
      transition: border-color 0.2s;
    }
    .field input {
      height: 46px;
      padding-block: 0;
    }
    .field input:focus,
    .field textarea:focus {
      border-color: var(--brand);
    }
    .note {
      display: flex;
      gap: 8px;
      margin: 0;
      font-size: 12.5px;
      line-height: 1.45;
      color: var(--ink-3);
    }
    .note .material-symbols-rounded {
      font-size: 17px;
    }
    .error {
      margin: 0;
      color: var(--expense);
      font-size: 13px;
      font-weight: 500;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }
    .done {
      justify-items: center;
      text-align: center;
      padding: 32px 28px 26px;
    }
    .done svg {
      width: 104px;
      height: 104px;
    }
    .done circle {
      fill: color-mix(in srgb, var(--income) 14%, var(--surface));
      stroke: var(--income);
      stroke-width: 3;
    }
    .done path {
      fill: none;
      stroke: var(--income);
      stroke-width: 7;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 70;
      animation: tick 0.6s 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .done h2 {
      margin: 0;
      font:
        700 24px 'Bricolage Grotesque',
        sans-serif;
    }
    .done p {
      margin: 0 0 6px;
      color: var(--ink-2);
      max-width: 34ch;
    }
    @keyframes tick {
      from {
        stroke-dashoffset: 70;
      }
    }
  `,
})
export class SupportDialog {
  private readonly support = inject(SupportService);
  private readonly user = inject(AuthService).user();

  protected readonly kinds: { id: ReportKind; label: string; icon: string; color: string }[] = [
    { id: 'BUG', label: 'Algo deu errado', icon: 'bug_report', color: 'var(--expense)' },
    { id: 'IDEA', label: 'Tenho uma ideia', icon: 'lightbulb', color: 'var(--goal)' },
    { id: 'OTHER', label: 'Outro assunto', icon: 'chat_bubble', color: 'var(--brand)' },
  ];
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    kind: ['BUG' as ReportKind],
    message: ['', [Validators.required, Validators.maxLength(2000)]],
    // Conta real já vem com o e-mail dela; visitante informa se quiser resposta.
    contactEmail: [this.user && !this.user.demo ? this.user.email : '', [Validators.email]],
  });

  protected placeholderTitle(): string {
    const kind = this.form.controls.kind.value;
    return kind === 'BUG' ? 'O que aconteceu?' : kind === 'IDEA' ? 'Qual é a ideia?' : 'Mensagem';
  }

  protected placeholder(): string {
    return this.form.controls.kind.value === 'BUG'
      ? 'Ex.: cliquei em "Salvar" no lançamento e nada aconteceu.'
      : this.form.controls.kind.value === 'IDEA'
        ? 'Ex.: seria ótimo poder dividir um gasto entre duas categorias.'
        : 'Escreva aqui…';
  }

  send(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    this.sending.set(true);
    this.error.set(null);
    this.support
      .send({
        kind: v.kind,
        message: v.message.trim(),
        contactEmail: v.contactEmail.trim() || null,
        page: location.pathname,
      })
      .subscribe({
        next: () => this.sent.set(true),
        error: (e: unknown) => {
          this.error.set(readApiError(e).message);
          this.sending.set(false);
        },
      });
  }
}
