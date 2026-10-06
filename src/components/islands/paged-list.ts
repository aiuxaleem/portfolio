/* Shows a list a page at a time (components/blog/list-pager.astro). Every item is in the page; this only hides the
   ones on other pages. Changing page moves focus to the section's heading, so keyboard and screen reader users land at
   the top of the new page, and the address keeps the page number. */
document.querySelectorAll<HTMLElement>('[data-pager]').forEach(nav => {
  const id = nav.dataset.pager!, size = Number(nav.dataset.size) || 6;
  const list = document.querySelector<HTMLElement>(`[data-paged="${id}"]`);
  if (!list) return;
  const items = [...list.children] as HTMLElement[], pages = Math.ceil(items.length / size);
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('[data-pager-page]')];
  const prev = nav.querySelector<HTMLAnchorElement>('[data-pager-prev]'), next = nav.querySelector<HTMLAnchorElement>('[data-pager-next]');
  const range = document.querySelector<HTMLElement>(`[data-paged-range="${id}"]`);
  const heading = document.getElementById(`${id}-title`);
  const href = (n: number) => `?${id}=${n}#${id}`;
  let current = 1;

  const show = (page: number, moved: boolean) => {
    current = Math.min(Math.max(page, 1), pages);
    items.forEach((item, i) => { item.hidden = Math.floor(i / size) + 1 !== current; });
    links.forEach(link => { if (Number(link.dataset.pagerPage) === current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    if (prev) { prev.href = href(current - 1); prev.style.visibility = current > 1 ? '' : 'hidden'; }
    if (next) { next.href = href(current + 1); next.style.visibility = current < pages ? '' : 'hidden'; }
    const from = (current - 1) * size + 1, to = Math.min(current * size, items.length);
    if (range) range.textContent = ` · showing ${from} to ${to}, page ${current} of ${pages}`;
    if (!moved) return;
    const url = new URL(location.href);
    if (current === 1) url.searchParams.delete(id); else url.searchParams.set(id, String(current));
    url.hash = '';
    history.replaceState(null, '', url);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: 'start' }); }
  };

  nav.addEventListener('click', event => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    show(link.dataset.pagerPage ? Number(link.dataset.pagerPage) : link === prev ? current - 1 : current + 1, true);
  });

  const asked = Number(new URL(location.href).searchParams.get(id));
  if (asked > 1 && asked <= pages) show(asked, false);
});
