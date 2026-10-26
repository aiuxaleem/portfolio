/* Cards and buttons that answer the pointer (owner, 26 October 2026: "make interaction design more engaging"). A card
   tilts toward the pointer in 3D with a soft light that follows it; a hero's main buttons lean a few pixels toward the
   pointer as it nears. Only on a fine pointer that can hover, and never with reduced motion: on touch and for the
   keyboard nothing moves here. The look is in motion.css ([data-tilt], [data-magnet]); this only sets the numbers,
   once a frame. */
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const still = matchMedia('(prefers-reduced-motion: reduce)');

if (fine.matches && !still.matches) {
  const MAX_TILT = 3; // degrees at a card's corner: more than this softens the card's text
  let frame = 0;
  const later = (fn: () => void) => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fn); };

  document.querySelectorAll<HTMLElement>('.project-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const r = card.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5, y = (event.clientY - r.top) / r.height - 0.5;
      later(() => {
        card.dataset.tilt = '';
        // Rotate about the axis at right angles to the pointer's offset, so the near corner dips toward it.
        card.style.setProperty('--tilt-axis', `${(-y).toFixed(3)} ${x.toFixed(3)} 0`);
        card.style.setProperty('--tilt-angle', `${(Math.hypot(x, y) * 2 * MAX_TILT).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
    });
    card.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); delete card.dataset.tilt; card.style.removeProperty('--tilt-angle'); });
  });

  const magnets = [...document.querySelectorAll<HTMLElement>('main :is([data-hero-ctas], .site-hero-ctas) :is(a, button)')];
  magnets.forEach(button => {
    button.dataset.magnet = '';
    const zone = button.parentElement!;
    zone.addEventListener('pointermove', event => {
      const r = button.getBoundingClientRect();
      const dx = event.clientX - (r.left + r.width / 2), dy = event.clientY - (r.top + r.height / 2);
      const reach = Math.max(r.width, r.height);
      const pull = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
      button.style.setProperty('--magnet-x', `${(dx * 0.18 * pull).toFixed(1)}px`);
      button.style.setProperty('--magnet-y', `${(dy * 0.28 * pull).toFixed(1)}px`);
    });
    zone.addEventListener('pointerleave', () => { button.style.removeProperty('--magnet-x'); button.style.removeProperty('--magnet-y'); });
  });
}

export {};
