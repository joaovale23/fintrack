import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmData {
  title: string;
  message: string;
  confirmLabel: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule],
  template: `
    <div class="box">
      <span class="material-symbols-rounded icon">delete</span>
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="actions">
        <button class="btn ghost" [mat-dialog-close]="false">Cancelar</button>
        <button class="btn danger" [mat-dialog-close]="true">{{ data.confirmLabel }}</button>
      </div>
    </div>
  `,
  styles: `
    .box {
      padding: 28px;
      max-width: 380px;
      text-align: center;
    }
    .icon {
      display: inline-grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--expense) 15%, var(--surface));
      color: var(--expense);
      margin-bottom: 14px;
    }
    h2 {
      font-size: 22px;
    }
    p {
      color: var(--ink-2);
      margin: 8px 0 22px;
    }
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .danger {
      background: var(--expense);
      color: #fff;
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
