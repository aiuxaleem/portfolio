/* Behaviour for page bodies that are still rendered from snapshots: hero work deck and certificate dialog on Home.
   Each block does nothing when its elements are not on the page. These move into their components as pages are componentised. */
import { openImagePreview } from './image-preview';

/* ---------- Hero work deck: three stacked cards; arrows bring the next one to the front ---------- */
const stack = document.querySelector<HTMLElement>('[data-hero-stack]');
if (stack) {
  const cards = [...stack.querySelectorAll<HTMLElement>('[data-stack-card]')];
  const header = stack.previousElementSibling;
  const counter = header?.querySelector('bdi');
  const [prev, next] = header ? [...header.querySelectorAll<HTMLButtonElement>('button')] : [];
  let front = 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  const paint = () => {
    cards.forEach((card, i) => {
      const pos = (i - front + cards.length) % cards.length;
      card.setAttribute('data-pos', String(pos));
      card.setAttribute('aria-hidden', String(pos !== 0));
      card.querySelector('a')?.setAttribute('tabindex', pos === 0 ? '0' : '-1');
    });
    if (counter) counter.textContent = `${pad(front + 1)} / ${pad(cards.length)}`;
  };
  /* The back cards' pictures (hidden until a card comes to the front) load once the page has finished, so they never compete
     with the first screen on a slow connection; a click that brings a card forward loads them at once. */
  const later = () => stack.querySelectorAll<HTMLImageElement>('img[data-deck-src]').forEach(img => { img.srcset = img.dataset.deckSrcset || ''; img.src = img.dataset.deckSrc || ''; delete img.dataset.deckSrc; });
  if (document.readyState === 'complete') window.setTimeout(later, 1500); else window.addEventListener('load', () => window.setTimeout(later, 1500), { once: true });
  if (cards.length > 1 && prev && next) {
    prev.addEventListener('click', () => { later(); front = (front - 1 + cards.length) % cards.length; paint(); });
    next.addEventListener('click', () => { later(); front = (front + 1) % cards.length; paint(); });
  }
}

/* ---------- Now: the learning grid shows the studying-now card and four certificates; the rest open with one button ----------
   Without JavaScript everything is shown. The button says how many it adds and, once open, offers to show fewer. */
const learning = document.querySelector<HTMLElement>('#now ul.cory-bento:has(> li.hero)');
if (learning) {
  const extra = [...learning.children].slice(5) as HTMLElement[];
  if (extra.length > 1) {
    const wrap = document.createElement('p'); wrap.className = 'now-more';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'ui-button ui-button-secondary ui-button-md';
    const label = document.createElement('span'); label.className = 'ui-button-label'; button.append(label); wrap.append(button);
    (learning.closest('[data-bento-cq]') || learning).after(wrap);
    const set = (open: boolean) => { extra.forEach(li => { li.hidden = !open; }); button.setAttribute('aria-expanded', String(open)); label.textContent = open ? 'Show fewer' : `Show ${extra.length} more`; };
    button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') !== 'true'; set(open); if (open) (extra[0].querySelector('a, button') as HTMLElement | null)?.focus(); });
    set(false);
  }
}

/* ---------- Certificates: a click opens the picture in the page's image preview (L-60), full size, with zoom ---------- */
document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="dialog"]').forEach(btn => btn.addEventListener('click', () => {
  const item = btn.closest('li'); const thumb = btn.querySelector('img'); if (!item || !thumb) return;
  const name = item.querySelector('h4')?.textContent?.trim() || thumb.alt || 'Certificate';
  const org = item.querySelector('h4 + span')?.textContent?.trim() || '';
  openImagePreview({ full: thumb.getAttribute('src')!.replace('/certs/', '/certs/full/'), thumb: thumb.currentSrc || thumb.src, alt: name, caption: org ? `${name} · ${org}` : name, opener: btn });
}));
