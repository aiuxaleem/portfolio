/* Case study page behaviour: before/after comparison, table of contents (collapsible on small screens, scroll-spy). */

/* ---------- Before/after: range input and two buttons move the divider ---------- */
document.querySelectorAll<HTMLElement>('[data-before-after]').forEach(figure => {
  const stage = figure.querySelector<HTMLElement>('.ba-stage'), controls = figure.querySelector<HTMLElement>('.ba-controls'), range = figure.querySelector<HTMLInputElement>('input[type="range"]');
  if (!stage || !controls || !range) return;
  const set = (value: number) => { range.value = String(value); stage.style.setProperty('--pos', value + '%'); range.setAttribute('aria-valuetext', `${value}% before, ${100 - value}% after`); };
  range.addEventListener('input', () => set(Number(range.value)));
  controls.querySelectorAll<HTMLButtonElement>('[data-ba-set]').forEach(b => b.addEventListener('click', () => set(Number(b.dataset.baSet))));
  figure.setAttribute('data-enhanced', ''); controls.hidden = false; set(50);
});

/* ---------- Table of contents ---------- */
const toc = document.querySelector<HTMLElement>('[data-case-toc]');
if (toc) {
  const toggle = toc.querySelector<HTMLButtonElement>('[data-toc-toggle]');
  const links = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  // Collapsible on small screens: closed until asked for. On wide screens the list is always shown (CSS).
  toc.setAttribute('data-enhanced', '');
  toggle?.addEventListener('click', () => { const open = toc.toggleAttribute('data-open'); toggle.setAttribute('aria-expanded', String(open)); });
  links.forEach(a => a.addEventListener('click', () => { toc.removeAttribute('data-open'); toggle?.setAttribute('aria-expanded', 'false'); }));
  // Scroll-spy: the section nearest the top of the viewport is marked as the current location.
  const targets = links.map(a => document.getElementById(a.hash.slice(1))).filter((el): el is HTMLElement => !!el);
  const mark = () => {
    const line = innerHeight * 0.3; let current = targets[0];
    for (const t of targets) if (t.getBoundingClientRect().top <= line) current = t;
    const atTop = targets.length > 0 && targets[0].getBoundingClientRect().top > line;
    links.forEach(a => { if (!atTop && current && a.hash === '#' + current.id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  };
  let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { mark(); ticking = false; }); }, { passive: true });
  mark();
}
