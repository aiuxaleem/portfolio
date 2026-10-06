/* Behaviour for page bodies that are still rendered from snapshots: hero work deck and certificate dialog on Home.
   Each block does nothing when its elements are not on the page. These move into their components as pages are componentised. */

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
  if (cards.length > 1 && prev && next) {
    prev.addEventListener('click', () => { front = (front - 1 + cards.length) % cards.length; paint(); });
    next.addEventListener('click', () => { front = (front + 1) % cards.length; paint(); });
  }
}

/* ---------- Certificate dialog: native <dialog>; focus moves in, Escape closes, focus returns to the opener ---------- */
const dialog = document.querySelector<HTMLDialogElement>('dialog[aria-labelledby="cert-dlg-title"]');
if (dialog) {
  const title = dialog.querySelector<HTMLElement>('#cert-dlg-title');
  const org = title?.parentElement?.querySelector('p');
  const closeBtn = dialog.querySelector<HTMLButtonElement>('button');
  const card = dialog.querySelector<HTMLElement>('[data-cert-card]');
  const frame = card?.lastElementChild as HTMLElement | null;
  let opener: HTMLElement | null = null;
  document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="dialog"]').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('li'); const thumb = btn.querySelector('img'); if (!item || !thumb || !frame) return;
    const name = item.querySelector('h4')?.textContent?.trim() || '';
    if (title) title.textContent = name;
    if (org) org.textContent = item.querySelector('h4 + span')?.textContent?.trim() || '';
    const img = document.createElement('img');
    img.src = thumb.getAttribute('src')!.replace('/certs/', '/certs/full/'); img.alt = name; img.decoding = 'async';
    img.style.cssText = 'display:block; inline-size:100%; max-block-size:calc(100svh - 14rem); object-fit:contain; background:var(--surface-sunken); border-radius:var(--radius-lg);';
    frame.replaceChildren(img);
    opener = btn; dialog.showModal(); closeBtn?.focus();
  }));
  closeBtn?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
}
