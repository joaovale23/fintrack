import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PrivacyService } from '../core/privacy.service';
import { ThemeService } from '../core/theme.service';
import { TransactionEditor } from '../core/transaction-editor';
import { CommandPalette } from '../shared/command-palette';
import { Avatar } from '../shared/avatar';
import { AvatarPicker } from '../shared/avatar-picker';
import { SupportDialog } from '../shared/support-dialog';
import { Logo } from '../shared/logo';

/**
 * Moldura das páginas internas. No desktop, barra lateral; no celular, barra inferior e um botão flutuante
 * que mostra "Lançar" no topo da página e encolhe para só o "+" quando a pessoa rola.
 * Atalhos: N abre um novo lançamento, H liga o modo discreto.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatTooltipModule,
    Logo,
    Avatar,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  host: {
    '(document:keydown)': 'onKey($event)',
    '(window:scroll)': 'onScroll()',
  },
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly editor = inject(TransactionEditor);
  private readonly dialog = inject(MatDialog);
  protected readonly theme = inject(ThemeService);
  protected readonly privacy = inject(PrivacyService);
  protected readonly user = this.auth.user;
  protected readonly compactFab = signal(false);

  protected readonly links = [
    { path: '/', icon: 'donut_large', label: 'Painel', mobile: true },
    { path: '/lancamentos', icon: 'receipt_long', label: 'Lançamentos', mobile: true },
    { path: '/recorrentes', icon: 'event_repeat', label: 'Recorrentes', mobile: false },
    { path: '/cofrinhos', icon: 'savings', label: 'Cofrinhos', mobile: true },
    { path: '/categorias', icon: 'category', label: 'Categorias', mobile: true },
  ];
  protected readonly mobileLinks = this.links.filter((l) => l.mobile);
  protected readonly isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

  constructor() {
    // Traz o usuário atualizado (por exemplo, a marca de admin) sem precisar sair e entrar de novo.
    this.auth.refreshMe();
  }

  /** "Relatar problema": chega por e-mail ao dono do app. */
  openSupport(): void {
    this.dialog.open(SupportDialog, { backdropClass: 'soft-backdrop' });
  }

  /** Busca rápida (Ctrl+K / ⌘K). */
  openPalette(): void {
    if (this.dialog.openDialogs.length) return;
    this.dialog.open(CommandPalette, {
      panelClass: 'palette-panel',
      backdropClass: 'soft-backdrop',
      width: '640px',
      maxWidth: '94vw',
      position: { top: '12vh' },
      autoFocus: false,
    });
  }

  pickAvatar(): void {
    this.dialog.open(AvatarPicker, { backdropClass: 'soft-backdrop', autoFocus: false });
  }

  newTransaction(): void {
    this.editor.open().subscribe();
  }

  toggleTheme(event: MouseEvent): void {
    this.theme.toggle({ x: event.clientX, y: event.clientY });
  }

  logout(): void {
    this.auth.logout();
  }

  protected onScroll(): void {
    this.compactFab.set(window.scrollY > 72);
  }

  protected onKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openPalette();
      return;
    }
    const target = event.target as HTMLElement | null;
    if (
      target?.closest('input, textarea, select, [contenteditable="true"]') ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;
    const key = event.key.toLowerCase();
    if (key === 'n') {
      event.preventDefault();
      this.newTransaction();
    } else if (key === 'h') {
      this.privacy.toggle();
    }
  }
}
