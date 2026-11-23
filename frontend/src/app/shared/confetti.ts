/**
 * Explosão de confete a partir de um elemento, com a Web Animations API (sem biblioteca).
 * Não faz nada se a pessoa preferir menos movimento.
 */
export function confetti(
  from: HTMLElement,
  colors = ['#0e6b4f', '#e9a52a', '#e0533c', '#2d8fd5', '#6c5ce7'],
): void {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
    return;
  const rect = from.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 3;
  for (let i = 0; i < 46; i++) {
    const piece = document.createElement('i');
    const size = 6 + Math.random() * 6;
    Object.assign(piece.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size * (Math.random() > 0.5 ? 0.45 : 1)}px`,
      background: colors[i % colors.length],
      borderRadius: Math.random() > 0.6 ? '50%' : '2px',
      pointerEvents: 'none',
      zIndex: '2000',
    });
    document.body.appendChild(piece);
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 160;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 80;
    piece
      .animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 540}deg)`,
            opacity: 1,
            offset: 0.6,
          },
          {
            transform: `translate(${dx * 1.1}px, ${dy + 220}px) rotate(${Math.random() * 720}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
      )
      .finished.then(() => piece.remove());
  }
}
