import { isOffHours } from './server-status';

describe('isOffHours', () => {
  it('considera o horário de São Paulo, não o do navegador', () => {
    // 11h UTC = 8h em São Paulo (UTC−3): a API já está acordada.
    expect(isOffHours(new Date('2026-11-23T11:00:00Z'))).toBe(false);
    // 21h59 UTC = 18h59 em São Paulo: ainda dentro do horário.
    expect(isOffHours(new Date('2026-11-23T21:59:00Z'))).toBe(false);
  });

  it('fica fora do horário de 19h às 8h', () => {
    expect(isOffHours(new Date('2026-11-23T22:00:00Z'))).toBe(true); // 19h
    expect(isOffHours(new Date('2026-11-24T05:30:00Z'))).toBe(true); // 2h30
    expect(isOffHours(new Date('2026-11-23T10:59:00Z'))).toBe(true); // 7h59
  });
});
