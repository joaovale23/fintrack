import { TOUR_STEPS } from './tour.service';

describe('TOUR_STEPS', () => {
  it('termina num passo sem alvo, centralizado, com o convite final', () => {
    expect(TOUR_STEPS.at(-1)!.target).toBeUndefined();
  });

  it('não repete alvos e todo passo tem título e texto', () => {
    const targets = TOUR_STEPS.map((s) => s.target).filter(Boolean);
    expect(new Set(targets).size).toBe(targets.length);
    for (const s of TOUR_STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.text.length).toBeGreaterThan(0);
    }
  });
});
