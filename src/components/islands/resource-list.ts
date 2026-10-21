/* Resource list behaviour: filter chips, sort chips, the result count, the clear action and the empty state.
   A resource is shown when, for every group with a selection, one of its selected values matches the card.
   The sort reorders the list items in place (newest first, or by title); the order is stable because every card has a
   date and a title. A choice is kept in the address (?category=design-systems), so a filtered view can be shared.
   A link elsewhere on the page that points at a filtered list (a category tile, a row in the hero panel) is handled
   here without reloading the page: the chips are set, the list is filtered and focus lands on its heading. Without
   JavaScript those links still work (the page opens at the list) and every resource is listed. */
const bar = document.querySelector<HTMLElement>('[data-resource-filters]');
const list = document.querySelector<HTMLElement>('[data-resource-list]');
if (bar && list) {
  const empty = document.querySelector<HTMLElement>('[data-resource-empty]');
  const count = bar.querySelector<HTMLElement>('[data-result-count]');
  const clears = [...document.querySelectorAll<HTMLButtonElement>('[data-clear-filters]')];
  const barClear = bar.querySelector<HTMLButtonElement>('[data-clear-filters]');
  const groups = [...bar.querySelectorAll<HTMLElement>('[data-filter-group]')].map(g => ({ key: g.dataset.filterGroup!, chips: [...g.querySelectorAll<HTMLButtonElement>('[data-filter-value]')] }));
  const sorts = [...bar.querySelectorAll<HTMLButtonElement>('[data-sort]')];
  const items = [...list.querySelectorAll<HTMLElement>('[data-resource]')].map(card => ({ card, row: (card.closest('li') as HTMLElement) || card, values: { category: card.dataset.category || '', type: card.dataset.type || '', cost: card.dataset.cost || '' } as Record<string, string>, added: card.dataset.added || '', title: (card.dataset.title || '').toLocaleLowerCase() }));
  const section = list.closest<HTMLElement>('section');
  const heading = section?.querySelector<HTMLElement>('h2');
  const pressed = (chips: HTMLButtonElement[]) => chips.filter(c => c.getAttribute('aria-pressed') === 'true');
  const disclosure = bar.querySelector<HTMLElement>('[data-filter-disclosure] [data-disclosure-state]');
  const categoryChips = groups.find(g => g.key === 'category')?.chips || [];
  /* The closed disclosure still says which categories are chosen. */
  const describe = () => { if (!disclosure) return; const on = pressed(categoryChips).map(c => c.dataset.filterLabel || ''); disclosure.textContent = on.length ? `Chosen: ${on.join(', ')}` : `${categoryChips.length} to choose from`; };

  const apply = (remember: boolean) => {
    const chosen = groups.map(g => ({ key: g.key, values: pressed(g.chips).map(c => c.dataset.filterValue!) }));
    const order = sorts.find(s => s.getAttribute('aria-pressed') === 'true')?.dataset.sort || 'newest';
    let shown = 0;
    for (const item of items) { const ok = chosen.every(g => g.values.length === 0 || g.values.includes(item.values[g.key])); item.row.hidden = !ok; if (ok) shown++; }
    const sorted = [...items].sort((a, b) => (order === 'title' ? a.title.localeCompare(b.title) || b.added.localeCompare(a.added) : b.added.localeCompare(a.added) || a.title.localeCompare(b.title)));
    sorted.forEach(item => list.append(item.row));
    const active = chosen.some(g => g.values.length > 0);
    describe();
    if (count) count.textContent = `Showing ${shown} of ${items.length} ${items.length === 1 ? 'resource' : 'resources'}`;
    if (barClear) barClear.hidden = !active || shown === 0;
    if (empty) empty.hidden = shown !== 0;
    list.hidden = shown === 0;
    if (!remember) return;
    const url = new URL(location.href);
    for (const g of chosen) { if (g.values.length) url.searchParams.set(g.key, g.values.join(',')); else url.searchParams.delete(g.key); }
    if (order === 'newest') url.searchParams.delete('sort'); else url.searchParams.set('sort', order);
    history.replaceState(null, '', url);
  };
  const set = (params: URLSearchParams) => {
    groups.forEach(g => { const wanted = (params.get(g.key) || '').split(',').filter(Boolean); g.chips.forEach(c => c.setAttribute('aria-pressed', String(wanted.includes(c.dataset.filterValue!)))); });
    if (params.has('sort')) sorts.forEach(s => s.setAttribute('aria-pressed', String(s.dataset.sort === params.get('sort'))));
  };
  const clear = () => { groups.forEach(g => g.chips.forEach(c => c.setAttribute('aria-pressed', 'false'))); apply(true); groups[0]?.chips[0]?.focus(); };

  groups.forEach(g => g.chips.forEach(chip => chip.addEventListener('click', () => { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); apply(true); })));
  sorts.forEach(chip => chip.addEventListener('click', () => { sorts.forEach(s => s.setAttribute('aria-pressed', String(s === chip))); apply(true); }));
  clears.forEach(button => button.addEventListener('click', clear));

  /* Links on this page into the filtered list: handled here, no reload. */
  document.addEventListener('click', event => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const to = new URL(link.href, location.href);
    if (to.pathname !== location.pathname || to.hash !== '#resources-list' || !to.search) return;
    event.preventDefault();
    set(to.searchParams); apply(true);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    section?.scrollIntoView({ block: 'start' });
  });

  /* A choice carried in the address when the page opened: from a shared link. */
  set(new URL(location.href).searchParams);
  apply(false);
}

/* Keeps this file a module of its own, so its names never clash with the other islands. */
export {};
