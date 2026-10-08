/* Ink aurora: the site's own motion for its dark blue cards. Glows in the brand's cyan and blue travel across each
   large ink surface, and a light runs along its edge. They move when the card first comes into view, then come to rest;
   they wake again while the pointer or the keyboard is on the card, when a glow and the edge light follow the pointer.
   Only transform and opacity are animated.
   - It never runs for more than five seconds without the visitor asking for it (WCAG 2.2.2).
   - With reduced motion the glows are still, and nothing follows the pointer.
   - Without JavaScript the cards are as they were: this adds nothing the page needs.
   Styles: site.css (.ink-aurora). The idea came from an animated-gradient card the owner liked; the colours, shapes,
   timing and behaviour here are the site's. */
const SURFACES = '.project-cta, .cory-ink, .case-quote, main [style*="background: var(--gradient-ink)"], main [style*="background:var(--gradient-ink)"]';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const WAKE_MS = 4500;

const cards = [...document.querySelectorAll<HTMLElement>(SURFACES)].filter(el => {
  // Cards only: not icon tiles or buttons, not the hero's stack (it has its own motion), not one card inside another.
  if (el.closest('[data-hero-stack], header, footer, dialog') || el.parentElement?.closest('[data-aurora]')) return false;
  // A frame that holds a picture is covered by it: there is nothing to see behind it.
  if (el.querySelector('[data-image-box], [data-cover-fallback]')) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 260 || r.height < 150) return false;
  el.setAttribute('data-aurora', 'rest');
  return true;
});

for (const card of cards) {
  const layer = document.createElement('span');
  layer.className = 'ink-aurora'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<i></i><i></i><i></i><i data-follow></i>';
  const edge = document.createElement('span');
  edge.className = 'ink-edge'; edge.setAttribute('aria-hidden', 'true'); edge.innerHTML = '<b></b>';
  card.prepend(layer, edge);
  const follow = layer.querySelector<HTMLElement>('[data-follow]')!, light = edge.querySelector<HTMLElement>('b')!;
  /* The paths are written in the card's own width and height, so they cross all of it at any size. */
  const measure = () => { const r = card.getBoundingClientRect(); card.style.setProperty('--aw', `${Math.round(r.width)}px`); card.style.setProperty('--ah', `${Math.round(r.height)}px`); };
  measure(); new ResizeObserver(measure).observe(card);
  let timer = 0, held = false, frame = 0;
  const rest = () => { if (!held) card.setAttribute('data-aurora', 'rest'); };
  const wake = (ms?: number) => { if (reduced.matches) return; clearTimeout(timer); card.setAttribute('data-aurora', 'awake'); if (ms) timer = window.setTimeout(rest, ms); };

  // Once, when the card comes into view.
  const seen = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { wake(WAKE_MS); seen.disconnect(); } }, { threshold: 0.35 });
  seen.observe(card);

  // While the visitor is on it: pointer or keyboard.
  const hold = () => { held = true; wake(); };
  const release = () => { held = false; clearTimeout(timer); timer = window.setTimeout(rest, 600); card.removeAttribute('data-aurora-pointer'); light.style.transform = ''; };
  card.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') hold(); });
  card.addEventListener('pointerleave', release);
  card.addEventListener('focusin', hold);
  card.addEventListener('focusout', e => { if (!card.contains(e.relatedTarget as Node)) release(); });
  card.addEventListener('pointermove', e => {
    if (reduced.matches || e.pointerType === 'touch' || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; const r = card.getBoundingClientRect(); const at = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0) translate(-50%, -50%)`; follow.style.transform = at; light.style.transform = at; card.setAttribute('data-aurora-pointer', ''); });
  });
}
