import { timeAgo } from './admin';

describe('timeAgo', () => {
  const now = new Date('2026-11-24T12:00:00Z').getTime();

  it('escreve o tempo em português, do mais curto ao mais longo', () => {
    expect(timeAgo('2026-11-24T11:59:40Z', now)).toBe('agora');
    expect(timeAgo('2026-11-24T11:55:00Z', now)).toBe('há 5 min');
    expect(timeAgo('2026-11-24T09:00:00Z', now)).toBe('há 3 h');
    expect(timeAgo('2026-11-23T10:00:00Z', now)).toBe('ontem');
    expect(timeAgo('2026-11-20T12:00:00Z', now)).toBe('há 4 dias');
  });
});
