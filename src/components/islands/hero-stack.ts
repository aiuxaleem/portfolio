/* The stacks on the audience websites' first screens (components/sites/hero-stack.astro): the arrows bring the next card
   forward, the counter says which card is in front, and only the front card's link can be reached. The same poses as the
   Home deck (islands/page-behaviours.ts); several stacks on one page (/_states) each work on their own. A card can also be
   swiped or dragged aside, or moved with the arrow keys (islands/stack-swipe.ts, L-76). */
import { swipeable } from './stack-swipe';
document.querySelectorAll<HTMLElement>('[data-site-stack]').forEach(stack => {
  const cards = [...stack.querySelectorAll<HTMLElement>('[data-stack-card]')];
  const head = stack.previousElementSibling;
  const counter = head?.querySelector('bdi');
  const [prev, next] = head ? [...head.querySelectorAll<HTMLButtonElement>('button')] : [];
  if (cards.length < 2 || !prev || !next) return;
  let front = 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  /* What the counter says when the deck moves (heuristic review, 28 November 2026, L-94): "02 / 03" on screen, "Case study 2
     of 3" to a screen reader; on an Arabic page the numbers alone. */
  const noun = (next.getAttribute('aria-label') || '').replace(/^Next\s+/i, '');
  const spoken = !document.documentElement.lang.startsWith('ar') && noun;
  const say = (n: number, total: number) => {
    if (!counter) return;
    const seen = document.createElement('span'); seen.textContent = `${pad(n)} / ${pad(total)}`;
    if (!spoken) { counter.replaceChildren(seen); return; }
    seen.setAttribute('aria-hidden', 'true');
    const heard = document.createElement('span'); heard.className = 'cory-visually-hidden'; heard.textContent = `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${n} of ${total}`;
    counter.replaceChildren(seen, heard);
  };
  const paint = () => {
    cards.forEach((card, i) => {
      const pos = (i - front + cards.length) % cards.length;
      card.dataset.pos = String(pos);
      card.setAttribute('aria-hidden', String(pos !== 0));
      card.querySelector('a')?.setAttribute('tabindex', pos === 0 ? '0' : '-1');
    });
    say(front + 1, cards.length);
  };
  const go = (step: 1 | -1) => { front = (front + step + cards.length) % cards.length; paint(); };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  swipeable(stack, go);
});
