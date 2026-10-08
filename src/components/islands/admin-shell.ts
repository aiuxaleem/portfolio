/* Admin frame (src/admin/components/admin-shell.astro).
   1. The Menu button under 1024px: opens and closes the list of sections, Escape closes it and returns focus.
   2. A form marked data-guard warns before the page is left with changes that have not been saved; pressing one of its
      own buttons (Publish, Save draft, Discard) is not leaving.
   3. A list filter: an input marked data-filter-rows hides the rows of the table it names that do not contain the text,
      and says how many are shown. */
const button = document.querySelector<HTMLButtonElement>('[data-admin-menu]'), panel = document.querySelector<HTMLElement>('[data-admin-panel]');
if (button && panel) {
  const set = (open: boolean) => { button.setAttribute('aria-expanded', String(open)); if (open) panel.setAttribute('data-open', ''); else panel.removeAttribute('data-open'); };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { set(false); button.focus(); } });
}

document.querySelectorAll<HTMLFormElement>('form[data-guard]').forEach(form => {
  let dirty = false, leaving = false;
  const note = document.querySelector<HTMLElement>('[data-unsaved]');
  const mark = () => { if (!dirty) { dirty = true; if (note) note.hidden = false; } };
  form.addEventListener('input', mark); form.addEventListener('change', mark);
  form.addEventListener('submit', () => { leaving = true; });
  window.addEventListener('beforeunload', e => { if (dirty && !leaving) { e.preventDefault(); e.returnValue = ''; } });
});

document.querySelectorAll<HTMLInputElement>('[data-filter-rows]').forEach(input => {
  const table = document.getElementById(input.dataset.filterRows!), count = document.querySelector<HTMLElement>('[data-filter-count]'), empty = document.querySelector<HTMLElement>('[data-filter-empty]');
  if (!table) return;
  const rows = [...table.querySelectorAll<HTMLElement>('tbody tr')], noun = count?.dataset.noun || 'entry', nouns = count?.dataset.nouns || 'entries';
  const run = () => {
    const q = input.value.trim().toLowerCase(); let shown = 0;
    for (const row of rows) { const hit = !q || (row.textContent || '').toLowerCase().includes(q); row.hidden = !hit; if (hit) shown++; }
    if (count) count.textContent = q ? `Showing ${shown} of ${rows.length} ${rows.length === 1 ? noun : nouns}` : `${rows.length} ${rows.length === 1 ? noun : nouns}`;
    if (empty) empty.hidden = shown > 0; table.closest<HTMLElement>('[data-filter-table]')?.toggleAttribute('hidden', shown === 0);
  };
  input.addEventListener('input', run);
  document.querySelector('[data-filter-clear]')?.addEventListener('click', () => { input.value = ''; run(); input.focus(); });
});

/* 4. A button marked data-copy puts its text on the clipboard and says so, in its label and to screen readers. */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  const label = btn.querySelector<HTMLElement>('.ui-button-label'), status = btn.parentElement?.querySelector<HTMLElement>('[role="status"]'), was = label?.innerHTML ?? '';
  try { await navigator.clipboard.writeText(btn.dataset.copy || ''); if (label) label.textContent = btn.dataset.copied || 'Copied'; if (status) status.textContent = 'Copied to the clipboard'; }
  catch { if (label) label.textContent = 'Select the text above and copy it'; if (status) status.textContent = 'Copying did not work. Select the text and copy it.'; }
  window.setTimeout(() => { if (label) label.innerHTML = was; if (status) status.textContent = ''; }, 2500);
}));
