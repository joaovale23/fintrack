import { lastDayOf } from './goal-dialog';

describe('lastDayOf', () => {
  it('usa o último dia do mês escolhido como prazo', () => {
    expect(lastDayOf('2027-02')).toBe('2027-02-28');
    expect(lastDayOf('2028-02')).toBe('2028-02-29');
    expect(lastDayOf('2027-06')).toBe('2027-06-30');
  });
});
