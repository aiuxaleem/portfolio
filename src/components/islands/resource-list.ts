/* Resource list behaviour: filter chips, sort chips, the result count and the empty state.
   A resource is shown when, for every group with a selection, one of its selected values matches the card.
   The sort reorders the list items in place (newest first, or by title); the order is stable because every card has a
   date and a title. A choice is kept in the address (?category=design-systems), so a category tile can link to a filtered
   list and a filtered view can be shared. Without JavaScript the bar is hidden and every resource is listed. */
const bar = document.querySelector<HTMLElement>('[data-resource-filters]');
const list = document.querySelector<HTMLElement>('[data-resource-list]');
if (bar && list) {
  const empty = document.querySelector<HTMLElement>('[data-resource-empty]');
  const count = bar.querySelector<HTMLElement>('[data-result-count]');
  const groups = [...bar.querySelectorAll<HTMLElement>('[data-filter-group]')].map(g => ({ key: g.dataset.filterGroup!, chips: [...g.querySelectorAll<HTMLButtonElement>('[data-filter-value]')] }));
  const sorts = [...bar.querySelectorAll<HTMLButtonElement>('[data-sort]')];
  const items = [...list.querySelectorAll<HTMLElement>('[data-resource]')].map(card => ({ card, row: (card.closest('li') as HTMLElement) || card, values: { category: card.dataset.category || '', type: card.dataset.type || '', cost: card.dataset.cost || '' } as Record<string, string>, added: card.dataset.added || '', title: (card.dataset.title || '').toLocaleLowerCase() }));
  const pressed = (chips: HTMLButtonElement[]) => chips.filter(c => c.getAttribute('aria-pressed') === 'true');

  const apply = (remember: boolean) => {
    const chosen = groups.map(g => ({ key: g.key, values: pressed(g.chips).map(c => c.dataset.filterValue!) }));
    const order = sorts.find(s => s.getAttribute('aria-pressed') === 'true')?.dataset.sort || 'newest';
    let shown = 0;
    for (const item of items) { const ok = chosen.every(g => g.values.length === 0 || g.values.includes(item.values[g.key])); item.row.hidden = !ok; if (ok) shown++; }
    const sorted = [...items].sort((a, b) => (order === 'title' ? a.title.localeCompare(b.title) || b.added.localeCompare(a.added) : b.added.localeCompare(a.added) || a.title.localeCompare(b.title)));
    sorted.forEach(item => list.append(item.row));
    if (count) count.textContent = `Showing ${shown} of ${items.length} ${items.length === 1 ? 'resource' : 'resources'}`;
    if (empty) empty.hidden = shown !== 0;
    list.hidden = shown === 0;
    if (!remember) return;
    const url = new URL(location.href);
    for (const g of chosen) { if (g.values.length) url.searchParams.set(g.key, g.values.join(',')); else url.searchParams.delete(g.key); }
    if (order === 'newest') url.searchParams.delete('sort'); else url.searchParams.set('sort', order);
    history.replaceState(null, '', url);
  };

  groups.forEach(g => g.chips.forEach(chip => chip.addEventListener('click', () => { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); apply(true); })));
  sorts.forEach(chip => chip.addEventListener('click', () => { sorts.forEach(s => s.setAttribute('aria-pressed', String(s === chip))); apply(true); }));
  empty?.querySelector('[data-clear-filters]')?.addEventListener('click', () => { groups.forEach(g => g.chips.forEach(c => c.setAttribute('aria-pressed', 'false'))); apply(true); groups[0]?.chips[0]?.focus(); });

  /* A choice carried in the address when the page opened: from a category tile, or a shared link. */
  const asked = new URL(location.href).searchParams;
  groups.forEach(g => { const wanted = (asked.get(g.key) || '').split(',').filter(Boolean); g.chips.forEach(c => c.setAttribute('aria-pressed', String(wanted.includes(c.dataset.filterValue!)))); });
  if (asked.get('sort') === 'title') sorts.forEach(s => s.setAttribute('aria-pressed', String(s.dataset.sort === 'title')));
  apply(false);
}

/* Keeps this file a module of its own, so its names never clash with the other islands. */
export {};
