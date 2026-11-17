/* Cards that stack as the page scrolls (owner request, 16 November 2026, L-76: "if there are more than 3 cards ... animate
   them in a card stack on scroll, next cards will show up"). A list marked `data-stack-scroll` with four or more cards
   showing: each row of cards sticks under the header, the next row slides over it, and the row underneath recedes (a
   little smaller, dimmed toward the page) as it is covered. The cards keep their place in the flow, so the page is no
   longer than before and nothing shifts (CLS); only `position: sticky` and two custom properties change (motion.css).
   - A row taller than the screen sticks only once its foot is on screen (its top goes above the header), so no part of a
     card is covered before it has been seen.
   - Rows are found from the layout, so a grid of three, two or one column stacks row by row, and a filter or "Show more"
     that changes the list rebuilds the rows.
   - A focused card comes to the front (motion.css, 2.4.11: focus never hidden).
   - Only with motion on (html[data-motion="on"]): reduced motion, fade mode and the automated checks see the plain list.
     Not on a short screen (under 600 px tall: phone landscape), where a stuck row would take the whole view. */
const root = document.documentElement;
const lists = [...document.querySelectorAll<HTMLElement>('[data-stack-scroll]')];
const tall = matchMedia('(min-height: 600px)');

if (lists.length && root.dataset.motion === 'on') {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const EDGE = 10; /* each later row sticks this much lower, so the edges of the rows beneath show as a deck */
  const GAP = 16;

  type Row = { items: HTMLElement[]; natural: number; height: number; top: number; recede: number };
  const state = new Map<HTMLElement, Row[]>();

  /* Where the header's foot is once the page has scrolled, which is when cards stick: scrolled, the header slides the bar of
     websites away (site.css, by --tap-target), so a measure taken at the top of the page would leave a band under it. */
  const headerFoot = () => {
    if (!header) return 0;
    const t = getComputedStyle(header).transform;
    let foot = header.getBoundingClientRect().bottom - (t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0);
    if (header.querySelector('[data-site-switch]')) foot -= parseFloat(getComputedStyle(root).getPropertyValue('--tap-target')) || 0;
    return foot;
  };

  const visible = (list: HTMLElement) => [...list.children].filter((li): li is HTMLElement => li instanceof HTMLElement && !li.hidden && li.offsetParent !== null);

  const measure = (list: HTMLElement) => {
    const items = visible(list);
    /* Not a row that scrolls sideways (cards on a narrow container, L-56): it is its own scroller. */
    const sideways = /auto|scroll/.test(getComputedStyle(list).overflowX);
    const on = tall.matches && items.length >= 4 && !sideways;
    /* Natural places are read with the stacking off, so a stuck card does not report where it is stuck. */
    list.removeAttribute('data-stacking');
    if (!on) { state.delete(list); items.forEach(li => { li.style.removeProperty('--stack-top'); li.style.removeProperty('--stack-recede'); }); return; }
    const base = headerFoot() + GAP;
    const y = window.scrollY;
    const rows: Row[] = [];
    for (const li of items) {
      const box = li.getBoundingClientRect();
      const natural = Math.round(box.top + y);
      const row = rows.find(r => Math.abs(r.natural - natural) < 4);
      if (row) { row.items.push(li); row.height = Math.max(row.height, box.height); }
      else rows.push({ items: [li], natural, height: box.height, top: 0, recede: -1 });
    }
    /* One row has nothing to stack on. */
    if (rows.length < 2) { state.delete(list); items.forEach(li => li.style.removeProperty('--stack-top')); return; }
    const edge = base - GAP; /* the header's foot */
    rows.forEach((r, i) => {
      r.top = Math.round(Math.min(base + Math.min(i, 3) * EDGE, window.innerHeight - r.height - GAP));
      /* A row that fits between the header and the screen's foot gives up the gap and the deck's offset before it would go
         under the header: only a row taller than that rises above the header's foot. */
      if (r.height <= window.innerHeight - edge) r.top = Math.max(r.top, Math.round(edge));
      r.items.forEach(li => li.style.setProperty('--stack-top', `${r.top}px`));
    });
    state.set(list, rows);
    list.setAttribute('data-stacking', '');
  };

  /* How far each row is covered by the next: 0 while the next row is below its foot, 1 once the next row is stuck on it. */
  const paint = () => {
    const y = window.scrollY;
    state.forEach(rows => rows.forEach((r, i) => {
      const next = rows[i + 1];
      let p = 0;
      if (next) {
        const nextAt = Math.max(next.natural - y, next.top);
        const span = r.top + r.height - next.top;
        p = span > 0 ? Math.min(1, Math.max(0, (r.top + r.height - nextAt) / span)) : 0;
      }
      p = Math.round(p * 50) / 50;
      if (p !== r.recede) { r.recede = p; r.items.forEach(li => li.style.setProperty('--stack-recede', String(p))); }
    }));
  };

  let frame = 0;
  const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(); }); };
  let rebuild = 0;
  const remeasure = () => { cancelAnimationFrame(rebuild); rebuild = requestAnimationFrame(() => { lists.forEach(measure); paint(); }); };

  lists.forEach(list => {
    /* A filter or "Show more" hides and shows rows of the list. */
    new MutationObserver(remeasure).observe(list, { subtree: false, childList: true, attributes: true, attributeFilter: ['hidden'] });
    [...list.children].forEach(li => new MutationObserver(remeasure).observe(li, { attributes: true, attributeFilter: ['hidden'] }));
  });
  new ResizeObserver(remeasure).observe(document.body);
  tall.addEventListener('change', remeasure);
  addEventListener('scroll', schedule, { passive: true });
  /* Pictures and fonts that arrive late change the cards' heights. */
  addEventListener('load', remeasure, { once: true });
  remeasure();
}

/* A module, so its names stay its own (site-chrome.ts has a root too). */
export {};
