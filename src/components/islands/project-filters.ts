/* Project list filters. A project is shown when it has every selected topic and, if any status is selected, one of them.
   The result count is announced through the aria-live region; an empty result shows the empty state. */
const bar = document.querySelector<HTMLElement>('[data-project-filters]');
const list = document.querySelector<HTMLElement>('[data-project-list]');
if (bar && list) {
  const empty = document.querySelector<HTMLElement>('[data-project-empty]');
  const count = bar.querySelector<HTMLElement>('[data-result-count]');
  const chips = [...bar.querySelectorAll<HTMLButtonElement>('.ui-chip')];
  const items = [...list.querySelectorAll<HTMLElement>('[data-project]')].map(card => ({ card, row: (card.closest('li') as HTMLElement) || card, tags: (card.dataset.tags || '').split('|').filter(Boolean), status: card.dataset.status || '' }));
  const apply = () => {
    const tags = chips.filter(c => c.dataset.filterTag && c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filterTag!);
    const statuses = chips.filter(c => c.dataset.filterStatus && c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filterStatus!);
    let shown = 0;
    for (const item of items) {
      const ok = tags.every(t => item.tags.includes(t)) && (statuses.length === 0 || statuses.includes(item.status));
      item.row.hidden = !ok; if (ok) shown++;
    }
    if (count) count.textContent = `Showing ${shown} of ${items.length} ${bar.dataset.noun || 'project'}${items.length === 1 ? '' : 's'}`;
    if (empty) empty.hidden = shown !== 0;
    list.hidden = shown === 0;
  };
  chips.forEach(chip => chip.addEventListener('click', () => { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); apply(); }));
  empty?.querySelector('[data-clear-filters]')?.addEventListener('click', () => { chips.forEach(c => c.setAttribute('aria-pressed', 'false')); apply(); chips[0]?.focus(); });
  apply();
}
