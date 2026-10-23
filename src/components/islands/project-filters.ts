/* Project list filters. A project is shown when, for every group with a selection (topics, status), one of its
   selected values matches: within a group choices widen, between groups they narrow, as on the Resources page.
   The result count is announced through the aria-live region; the bar's "Clear filters" shows once a filter is on;
   an empty result shows the empty state. */
const bar = document.querySelector<HTMLElement>('[data-project-filters]');
const list = document.querySelector<HTMLElement>('[data-project-list]');
if (bar && list) {
  const empty = document.querySelector<HTMLElement>('[data-project-empty]');
  const count = bar.querySelector<HTMLElement>('[data-result-count]');
  const barClear = bar.querySelector<HTMLButtonElement>('[data-clear-filters]');
  const chips = [...bar.querySelectorAll<HTMLButtonElement>('.ui-chip')];
  const items = [...list.querySelectorAll<HTMLElement>('[data-project]')].map(card => ({ card, row: (card.closest('li') as HTMLElement) || card, tags: (card.dataset.tags || '').split('|').filter(Boolean), status: card.dataset.status || '' }));
  const apply = () => {
    const tags = chips.filter(c => c.dataset.filterTag && c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filterTag!);
    const statuses = chips.filter(c => c.dataset.filterStatus && c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filterStatus!);
    let shown = 0;
    for (const item of items) {
      const ok = (tags.length === 0 || tags.some(t => item.tags.includes(t))) && (statuses.length === 0 || statuses.includes(item.status));
      item.row.hidden = !ok; if (ok) shown++;
    }
    const active = tags.length > 0 || statuses.length > 0;
    const noun = `${bar.dataset.noun || 'project'}${items.length === 1 ? '' : 's'}`;
    if (count) count.textContent = active ? `Showing ${shown} of ${items.length} ${noun}` : `${items.length} ${noun}`;
    if (barClear) barClear.hidden = !active || shown === 0;
    if (empty) empty.hidden = shown !== 0;
    list.hidden = shown === 0;
  };
  const clear = () => { chips.forEach(c => c.setAttribute('aria-pressed', 'false')); apply(); chips[0]?.focus(); };
  chips.forEach(chip => chip.addEventListener('click', () => { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); apply(); }));
  document.querySelectorAll<HTMLButtonElement>('[data-clear-filters]').forEach(button => button.addEventListener('click', clear));
  apply();
}

/* Keeps this file a module of its own, so its names never clash with the other islands. */
export {};
