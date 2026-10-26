/* A list that changes (filters, a sort, Show more) changes smoothly: each row that stays glides to its new place, a row
   that arrives scales in and one that leaves scales out (a same-page view transition, styled in motion.css under
   html[data-vt="list"]). Browsers without view transitions, and visitors who ask for reduced motion, get the change at
   once. Rows carry a view-transition-name only while a change runs. */
export function smoothList(prefix: string, rows: () => HTMLElement[], change: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { change(); return; }
  const all = rows(); const root = document.documentElement;
  const name = () => all.forEach((row, i) => { row.style.viewTransitionName = row.hidden ? '' : `${prefix}-${i}`; });
  name(); root.dataset.vt = 'list';
  const t = doc.startViewTransition(() => { change(); name(); });
  t.finished.finally(() => { all.forEach(row => { row.style.viewTransitionName = ''; }); delete root.dataset.vt; });
}
