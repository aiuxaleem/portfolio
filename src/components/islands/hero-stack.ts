/* The stacks on the audience websites' first screens (components/sites/hero-stack.astro): the arrows bring the next card
   forward, the counter says which card is in front, and only the front card's link can be reached. The same poses as the
   Home deck (islands/page-behaviours.ts); several stacks on one page (/_states) each work on their own. */
document.querySelectorAll<HTMLElement>('[data-site-stack]').forEach(stack => {
  const cards = [...stack.querySelectorAll<HTMLElement>('[data-stack-card]')];
  const head = stack.previousElementSibling;
  const counter = head?.querySelector('bdi');
  const [prev, next] = head ? [...head.querySelectorAll<HTMLButtonElement>('button')] : [];
  if (cards.length < 2 || !prev || !next) return;
  let front = 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  const paint = () => {
    cards.forEach((card, i) => {
      const pos = (i - front + cards.length) % cards.length;
      card.dataset.pos = String(pos);
      card.setAttribute('aria-hidden', String(pos !== 0));
      card.querySelector('a')?.setAttribute('tabindex', pos === 0 ? '0' : '-1');
    });
    if (counter) counter.textContent = `${pad(front + 1)} / ${pad(cards.length)}`;
  };
  prev.addEventListener('click', () => { front = (front - 1 + cards.length) % cards.length; paint(); });
  next.addEventListener('click', () => { front = (front + 1) % cards.length; paint(); });
});
