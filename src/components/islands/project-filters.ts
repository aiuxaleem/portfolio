/* Project list filters. A project is shown when, for every group with a selection (topics, status), one of its
   selected values matches: within a group choices widen, between groups they narrow, as on the Resources page.
   The result count is announced through the aria-live region; the bar's "Clear filters" shows once a filter is on;
   an empty result shows the empty state. */
import { smoothList } from './smooth-list';

const bar = document.querySelector<HTMLElement>('[data-project-filters]');
const list = document.querySelector<HTMLElement>('[data-project-list]');
if (bar && list) {
  const empty = document.querySelector<HTMLElement>('[data-project-empty]');
  const count = bar.querySelector<HTMLElement>('[data-result-count]');
  const barClear = bar.querySelector<HTMLButtonElement>('[data-clear-filters]');
  const chips = [...bar.querySelectorAll<HTMLButtonElement>('.ui-chip')];
  const items = [...list.querySelectorAll<HTMLElement>('[data-project]')].map(card => ({ card, row: (card.closest('li') as HTMLElement) || card, tags: (card.dataset.tags || '').split('|').filter(Boolean), text: (card.dataset.text || card.textContent || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), status: card.dataset.status || '' }));
  const search = bar.querySelector<HTMLInputElement>('[data-filter-search]');
  const state = bar.querySelector<HTMLElement>('[data-filter-disclosure] [data-disclosure-state]');
  const fold = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const apply = () => {
    const q = search ? fold(search.value) : '';
    const tags = chips.filter(c => c.dataset.filterTag && c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filterTag!);
    const statuses = chips.filter(c => c.dataset.filterStatus && c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filterStatus!);
    let shown = 0;
    for (const item of items) {
      const ok = (tags.length === 0 || tags.some(t => item.tags.includes(t))) && (statuses.length === 0 || statuses.includes(item.status)) && (!q || q.split(/\s+/).every(w => item.text.includes(w)));
      item.row.hidden = !ok; if (ok) shown++;
    }
    const active = tags.length > 0 || statuses.length > 0 || !!q;
    const noun = `${bar.dataset.noun || 'project'}${items.length === 1 ? '' : 's'}`;
    if (count) count.textContent = active ? `Showing ${shown} of ${items.length} ${noun}` : `${items.length} ${noun}`;
    if (barClear) barClear.hidden = !active || shown === 0;
    if (empty) empty.hidden = shown !== 0;
    list.hidden = shown === 0;
    /* A folded first group still says which of its values are chosen. */
    if (state) state.textContent = tags.length ? `Chosen: ${chips.filter(c => c.dataset.filterTag && c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.filterLabel || c.dataset.filterTag).join(', ')}` : state.dataset.default || '';
  };
  const smooth = (fn: () => void) => smoothList('pf', () => items.map(i => i.row), fn);
  const clear = () => { chips.forEach(c => c.setAttribute('aria-pressed', 'false')); if (search) search.value = ''; smooth(apply); (search || chips[0])?.focus(); };
  let typing = 0; search?.addEventListener('input', () => { window.clearTimeout(typing); typing = window.setTimeout(() => smooth(apply), 120); });
  chips.forEach(chip => chip.addEventListener('click', () => { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); smooth(apply); }));
  document.querySelectorAll<HTMLButtonElement>('[data-clear-filters]').forEach(button => button.addEventListener('click', clear));
  apply();
}

