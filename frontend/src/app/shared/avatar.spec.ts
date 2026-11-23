import { TestBed } from '@angular/core/testing';
import { AVATARS, Avatar } from './avatar';

describe('Avatar', () => {
  it('sem personagem, mostra as iniciais do nome', async () => {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('name', 'João Vitor Vale');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim()).toBe('JV');
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });

  it('com personagem, desenha o SVG dele', async () => {
    for (const a of AVATARS) {
      const fixture = TestBed.createComponent(Avatar);
      fixture.componentRef.setInput('avatar', a.id);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
      expect(fixture.nativeElement.getAttribute('title')).toBe(a.label);
    }
  });
});
