import {
  addMonths,
  fromIsoDate,
  monthLabel,
  monthName,
  relativeDay,
  toIsoDate,
  toYearMonth,
  untilLabel,
} from './dates';

describe('datas', () => {
  it('converte para ISO usando o dia local, sem pular para o dia anterior por causa do fuso', () => {
    expect(toIsoDate(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
    expect(fromIsoDate('2026-11-05').getDate()).toBe(5);
  });

  it('soma e subtrai meses atravessando o ano', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(toYearMonth(new Date(2026, 1, 28))).toBe('2026-02');
  });

  it('escreve o mês em português com inicial maiúscula', () => {
    expect(monthLabel('2026-03')).toBe('Março de 2026');
    expect(monthLabel('2026-08', 'short')).toBe('Ago');
    expect(monthName('2026-11')).toBe('Novembro');
  });

  it('chama os dias recentes de hoje e ontem', () => {
    const today = new Date(2026, 10, 23, 15, 0);
    expect(relativeDay('2026-11-23', today)).toBe('Hoje');
    expect(relativeDay('2026-11-22', today)).toBe('Ontem');
    expect(relativeDay('2026-11-21', today)).toBe('Sáb, 21 de nov');
  });

  it('conta quanto falta para a próxima conta', () => {
    const today = new Date(2026, 10, 23, 9, 0);
    expect(untilLabel('2026-11-23', today)).toBe('hoje');
    expect(untilLabel('2026-11-24', today)).toBe('amanhã');
    expect(untilLabel('2026-12-05', today)).toBe('em 12 dias');
  });
});
