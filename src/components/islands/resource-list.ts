/* Resource list behaviour: the search field, filter chips, sort chips, the result count, the clear action, the empty
   state and the "Show more" control.
   A resource is shown when the search words all appear in its title, site or tags and, for every group with a
   selection, one of its selected values matches the card. The sort reorders the list items in place (newest first,
   or by title); the order is stable because every card has a date and a title. Twelve cards are shown at a time;
   "Show more" reveals the next twelve and moves focus to the first of them; any change of search, filter or sort
   starts again from the first twelve. A choice is kept in the address (?category=design-systems&q=figma), so a
   filtered view can be shared. A link elsewhere on the page that points at a filtered list (a category tile, a row in
   the hero panel) is handled here without reloading the page: the chips are set, the category disclosure opens, the
   list is filtered and focus lands on its heading. Without JavaScript those links still work (the page opens at the
   list) and every resource is listed. */
import { smoothList } from './smooth-list';

const bar = document.querySelector<HTMLElement>('[data-resource-filters]');
const list = document.querySelector<HTMLElement>('[data-resource-list]');
if (bar && list) {
  const PAGE = 12;
  const empty = document.querySelector<HTMLElement>('[data-resource-empty]');
  const count = bar.querySelector<HTMLElement>('[data-result-count]');
  const clears = [...document.querySelectorAll<HTMLButtonElement>('[data-clear-filters]')];
  const barClear = bar.querySelector<HTMLButtonElement>('[data-clear-filters]');
  const search = bar.querySelector<HTMLInputElement>('[data-resource-search]');
  const more = document.querySelector<HTMLElement>('[data-resource-more]');
  const moreButton = more?.querySelector<HTMLButtonElement>('[data-show-more]') || null;
  const groups = [...bar.querySelectorAll<HTMLElement>('[data-filter-group]')].map(g => ({ key: g.dataset.filterGroup!, chips: [...g.querySelectorAll<HTMLButtonElement>('[data-filter-value]')] }));
  const sorts = [...bar.querySelectorAll<HTMLButtonElement>('[data-sort]')];
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const items = [...list.querySelectorAll<HTMLElement>('[data-resource]')].map(card => ({ card, row: (card.closest('li') as HTMLElement) || card, values: { category: card.dataset.category || '', type: card.dataset.type || '', cost: card.dataset.cost || '' } as Record<string, string>, title: card.dataset.title || '', added: card.dataset.added || '', text: fold(`${card.dataset.title || ''} ${card.dataset.host || ''} ${(card.dataset.tags || '').replace(/\|/g, ' ')}`) }));
  const section = list.closest<HTMLElement>('section');
  const heading = section?.querySelector<HTMLElement>('h2');
  const pressed = (chips: HTMLButtonElement[]) => chips.filter(c => c.getAttribute('aria-pressed') === 'true');
  const details = bar.querySelector<HTMLDetailsElement>('[data-filter-disclosure]');
  const disclosure = details?.querySelector<HTMLElement>('[data-disclosure-state]') || null;
  const categoryChips = groups.find(g => g.key === 'category')?.chips || [];
  /* The closed disclosure still says which categories are chosen. */
  const describe = () => { if (!disclosure) return; const on = pressed(categoryChips).map(c => c.dataset.filterLabel || ''); disclosure.textContent = on.length ? `Chosen: ${on.join(', ')}` : `${categoryChips.length} to choose from`; };
  let limit = PAGE;

  const apply = (remember: boolean, focusFirstNew = false) => {
    const chosen = groups.map(g => ({ key: g.key, values: pressed(g.chips).map(c => c.dataset.filterValue!) }));
    const words = fold(search?.value || '').split(/\s+/).filter(Boolean);
    const order = sorts.find(s => s.getAttribute('aria-pressed') === 'true')?.dataset.sort || 'newest';
    const sorted = [...items].sort((a, b) => (order === 'title' ? a.title.localeCompare(b.title) || b.added.localeCompare(a.added) : b.added.localeCompare(a.added) || a.title.localeCompare(b.title)));
    sorted.forEach(item => list.append(item.row));
    const matching = sorted.filter(item => chosen.every(g => g.values.length === 0 || g.values.includes(item.values[g.key])) && words.every(w => item.text.includes(w)));
    const visible = matching.slice(0, limit);
    let firstNew: HTMLElement | undefined;
    for (const item of items) { const show = visible.includes(item); if (show && item.row.hidden && !firstNew && focusFirstNew) firstNew = item.row; item.row.hidden = !show; }
    const shown = matching.length;
    const active = chosen.some(g => g.values.length > 0) || words.length > 0;
    describe();
    const noun = shown === 1 ? 'resource' : 'resources';
    if (count) count.textContent = active || visible.length < shown ? `Showing ${visible.length} of ${shown}${active ? ' matching' : ''} ${noun}` : `${shown} ${noun}`;
    if (barClear) barClear.hidden = !active || shown === 0;
    if (empty) empty.hidden = shown !== 0;
    list.hidden = shown === 0;
    if (more) more.hidden = visible.length >= shown;
    if (moreButton && visible.length < shown) moreButton.textContent = `Show ${Math.min(PAGE, shown - visible.length)} more`;
    if (firstNew) { const link = firstNew.querySelector<HTMLElement>('a, button'); (link || firstNew).focus({ preventScroll: false }); }
    if (!remember) return;
    const url = new URL(location.href);
    for (const g of chosen) { if (g.values.length) url.searchParams.set(g.key, g.values.join(',')); else url.searchParams.delete(g.key); }
    if (words.length) url.searchParams.set('q', (search?.value || '').trim()); else url.searchParams.delete('q');
    if (order === 'newest') url.searchParams.delete('sort'); else url.searchParams.set('sort', order);
    history.replaceState(null, '', url);
  };
  const set = (params: URLSearchParams) => {
    groups.forEach(g => { const wanted = (params.get(g.key) || '').split(',').filter(Boolean); g.chips.forEach(c => c.setAttribute('aria-pressed', String(wanted.includes(c.dataset.filterValue!)))); });
    if (params.has('sort')) sorts.forEach(s => s.setAttribute('aria-pressed', String(s.dataset.sort === params.get('sort'))));
    if (search && params.has('q')) search.value = params.get('q') || '';
    if (details) details.open = pressed(categoryChips).length > 0;
    limit = PAGE;
  };
  const smooth = (fn: () => void) => smoothList('rl', () => items.map(i => i.row), fn);
  const clear = () => { groups.forEach(g => g.chips.forEach(c => c.setAttribute('aria-pressed', 'false'))); if (search) search.value = ''; if (details) details.open = false; limit = PAGE; smooth(() => apply(true)); (search || groups[0]?.chips[0])?.focus(); };

  groups.forEach(g => g.chips.forEach(chip => chip.addEventListener('click', () => { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); limit = PAGE; smooth(() => apply(true)); })));
  sorts.forEach(chip => chip.addEventListener('click', () => { sorts.forEach(s => s.setAttribute('aria-pressed', String(s === chip))); limit = PAGE; smooth(() => apply(true)); }));
  clears.forEach(button => button.addEventListener('click', clear));
  if (search) { let timer = 0; search.addEventListener('input', () => { window.clearTimeout(timer); timer = window.setTimeout(() => { limit = PAGE; smooth(() => apply(true)); }, 120); }); search.addEventListener('search', () => { limit = PAGE; apply(true); }); }
  moreButton?.addEventListener('click', () => { limit += PAGE; apply(false, true); });

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

