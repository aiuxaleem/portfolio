/* Swipe through a card stack (owner request, 16 November 2026, L-76): the Home deck (islands/page-behaviours.ts) and the
   hero stacks of the list pages (islands/hero-stack.ts). The front card follows a finger or a pointer sideways and turns a
   little with it; let go past a quarter of its width (or with a flick) and it leaves to that side while the next card
   comes forward; short of that it springs back. A vertical drag is left to the page, so the stack never traps a scroll
   (touch-action: pan-y in site.css). A drag never opens the card's link; a tap still does. The arrow keys on the front
   card do the same as the arrow buttons. The arrow buttons stay, so nothing needs a gesture (2.5.1, 2.5.7).
   With reduced motion the card still follows the finger (the visitor is moving it), but the next card comes forward at
   once instead of the front one flying off. */
export function swipeable(stack: HTMLElement, go: (step: 1 | -1) => void): void {
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const front = () => stack.querySelector<HTMLElement>('[data-stack-card][data-pos="0"]');
  let id = -1, x0 = 0, y0 = 0, t0 = 0, dx = 0, mode: 'idle' | 'maybe' | 'drag' | 'scroll' = 'idle', moved = false, card: HTMLElement | null = null;

  const set = (el: HTMLElement, x: number) => { el.style.setProperty('--drag-x', `${x}px`); el.style.setProperty('--drag-r', `${Math.max(-12, Math.min(12, x / 24))}deg`); };
  const clear = (el: HTMLElement) => { el.removeAttribute('data-drag'); el.removeAttribute('data-fly'); el.style.removeProperty('--drag-x'); el.style.removeProperty('--drag-r'); };

  stack.addEventListener('pointerdown', e => {
    if (mode !== 'idle' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    card = front();
    if (!card || !card.contains(e.target as Node)) return;
    id = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); dx = 0; moved = false; mode = 'maybe';
  });
  stack.addEventListener('pointermove', e => {
    if (e.pointerId !== id || !card) return;
    const x = e.clientX - x0, y = e.clientY - y0;
    if (mode === 'maybe') {
      if (Math.abs(y) > 10 && Math.abs(y) > Math.abs(x)) { mode = 'scroll'; return; }
      if (Math.abs(x) > 8) { mode = 'drag'; moved = true; card.setAttribute('data-drag', ''); try { stack.setPointerCapture(id); } catch { /* the pointer has gone */ } }
    }
    if (mode === 'drag') { dx = x; set(card, dx); }
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    const el = card, dragged = mode === 'drag';
    id = -1; mode = 'idle'; card = null;
    if (!el || !dragged) return;
    const speed = Math.abs(dx) / Math.max(1, performance.now() - t0);
    const far = Math.abs(dx) > Math.min(110, el.offsetWidth * 0.25) || (speed > 0.6 && Math.abs(dx) > 30);
    if (e.type === 'pointercancel' || !far) { el.removeAttribute('data-drag'); el.style.removeProperty('--drag-x'); el.style.removeProperty('--drag-r'); return; }
    const step: 1 | -1 = dx < 0 ? 1 : -1;
    if (still()) { clear(el); go(step); return; }
    /* It flies off to the side it was thrown, then takes its place at the back as the next card comes forward. */
    el.removeAttribute('data-drag'); el.setAttribute('data-fly', ''); set(el, (dx < 0 ? -1 : 1) * el.offsetWidth * 1.2);
    let done = false;
    /* At the back at once, not travelling back across the stack from where it was thrown. */
    const finish = () => { if (done) return; done = true; el.style.transition = 'none'; clear(el); go(step); void el.offsetWidth; requestAnimationFrame(() => el.style.removeProperty('transition')); };
    el.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, 320);
  };
  stack.addEventListener('pointerup', end);
  stack.addEventListener('pointercancel', end);
  /* A drag is not a click: the link it started on stays shut. A mouse never drags the link or a picture out. */
  stack.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  stack.addEventListener('dragstart', e => e.preventDefault());
  stack.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!(e.target instanceof HTMLElement) || !e.target.closest('[data-stack-card][data-pos="0"]')) return;
    e.preventDefault();
    const rtl = getComputedStyle(stack).direction === 'rtl';
    go((e.key === 'ArrowRight') !== rtl ? 1 : -1);
    front()?.querySelector<HTMLElement>('a')?.focus();
  });
}
