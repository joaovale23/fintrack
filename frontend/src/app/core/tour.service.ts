import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface TourStep {
  /** Valor de data-tour do elemento destacado. Sem alvo, o cartão aparece no centro. */
  target?: string;
  icon: string;
  title: string;
  text: string;
  /** Itens com ícone, para explicar várias coisas num passo só (as abas). */
  items?: { icon: string; label: string; text: string; mobileText?: string }[];
  /** Texto diferente no celular, quando o lugar das coisas muda. */
  mobileText?: string;
  /** Passo que só existe no computador (a busca com atalho de teclado, por exemplo). */
  desktopOnly?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'new',
    icon: 'add_circle',
    title: 'Tudo começa por aqui',
    text: 'Lance entradas e saídas em poucos segundos. No teclado, a tecla N abre o lançamento de qualquer tela.',
    mobileText:
      'Lance entradas e saídas em poucos segundos. Este botão fica sempre à mão, em qualquer tela.',
  },
  {
    target: 'search',
    icon: 'search',
    title: 'Busca rápida',
    text: 'Ctrl+K (⌘K no Mac) encontra lançamentos, categorias, cofrinhos e atalhos sem tirar a mão do teclado.',
    desktopOnly: true,
  },
  {
    target: 'month',
    icon: 'calendar_month',
    title: 'Viaje pelos meses',
    text: 'Use as setas ou toque no nome do mês para pular direto para qualquer um.',
  },
  {
    target: 'balance',
    icon: 'account_balance_wallet',
    title: 'Quanto sobrou',
    text: 'O saldo do mês, com a barra de entradas e saídas. Se o mês fechar no vermelho, o número avisa.',
  },
  {
    target: 'flow',
    icon: 'conversion_path',
    title: 'Para onde foi o dinheiro',
    text: 'Cada faixa é uma categoria: siga o caminho do que entrou até onde foi gasto. Passe o mouse para destacar uma.',
    mobileText:
      'Cada cor é uma categoria: veja quanto do que entrou foi para cada uma e quanto sobrou.',
  },
  {
    target: 'nav',
    icon: 'tab',
    title: 'As abas',
    text: 'Cada parte do app tem o seu lugar:',
    items: [
      {
        icon: 'receipt_long',
        label: 'Lançamentos',
        text: 'histórico, filtros e o lançamento rápido em linguagem natural',
      },
      {
        icon: 'event_repeat',
        label: 'Recorrentes',
        text: 'contas fixas que se lançam sozinhas todo mês',
        mobileText: 'contas fixas que se lançam sozinhas (no celular, ficam dentro de Lançamentos)',
      },
      { icon: 'savings', label: 'Cofrinhos', text: 'guarde dinheiro para um objetivo e acompanhe' },
      { icon: 'category', label: 'Categorias', text: 'cores, ícones e um teto de gastos por mês' },
    ],
  },
  {
    target: 'privacy',
    icon: 'visibility_off',
    title: 'Modo discreto',
    text: 'Vai abrir o app em público? Um clique borra todos os valores. Atalho: H.',
    mobileText: 'Vai abrir o app em público? Um toque borra todos os valores.',
  },
  {
    target: 'help',
    icon: 'support',
    title: 'Fale comigo',
    text: 'Achou um problema ou teve uma ideia? “Relatar problema” chega direto para quem fez o app.',
    mobileText:
      'Achou um problema ou teve uma ideia? “Relatar problema” fica no menu da sua foto e chega direto para quem fez o app.',
  },
  {
    icon: 'celebration',
    title: 'Tudo pronto!',
    text: 'Que tal começar com o seu primeiro lançamento? Dá para rever este tour quando quiser: na busca (Ctrl+K) ou na bandeirinha ao lado de “Sair”.',
    mobileText:
      'Que tal começar com o seu primeiro lançamento? Dá para rever este tour quando quiser, no menu da sua foto.',
  },
];

/** Estado do tour guiado: se está aberto e em que passo. */
@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly router = inject(Router);
  readonly active = signal(false);

  /** Os alvos do tour estão no painel: vai para lá e espera ele desenhar antes de começar. */
  start(): void {
    const onDashboard = this.router.url.split('?')[0] === '/';
    void this.router.navigate(['/']).then(() => {
      setTimeout(() => this.active.set(true), onDashboard ? 50 : 700);
    });
  }

  stop(): void {
    this.active.set(false);
  }
}
