/* Admin frame (src/admin/components/admin-shell.astro).
   1. The Menu button under 1024px: opens and closes the list of sections, Escape closes it and returns focus.
   2. A form marked data-guard warns before the page is left with changes that have not been saved; pressing one of its
      own buttons (Publish, Save draft, Discard) is not leaving.
   3. A list filter: an input marked data-filter-rows hides the rows of the table it names that do not contain the text,
      and says how many are shown.
   4. A Copy button puts its text on the clipboard and says so.
   5. After a refused publish, focus goes to the list of what to fix.
   6. A form marked data-busy says it has been sent: its buttons dim and the pressed one shows its busy words.
   7. A Show password box shows the password field's text while it is ticked.
   10. A repeating group in an editor offers one empty row; "Add another" reveals the next (the rows are in the markup).
   11. A path field shows the picture it names, small, while the path is one the repository holds.
   12. A required field left empty says "This is needed." when it loses focus, and stops saying it once it is filled;
       the server's check stays the source of truth.
   13. A thumbnail on the Images page that cannot be loaded says so.
   Every part is selector-guarded, so the file is a no-op on a page that has none of it (the sign-in page has 6 and 7 only). */
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
  const rows = [...table.querySelectorAll<HTMLElement>('tbody tr, [data-filter-row]')], noun = count?.dataset.noun || 'entry', nouns = count?.dataset.nouns || 'entries';
  /* Rows grouped in folds (the Images page): while a search is on, a fold with a match opens and one with none is hidden; cleared, each fold goes back to how it was. */
  const folds = [...table.querySelectorAll<HTMLDetailsElement>('details')], wasOpen = new Map<HTMLDetailsElement, boolean>(); let searching = false;
  const run = () => {
    const q = input.value.trim().toLowerCase(); let shown = 0;
    for (const row of rows) { const hit = !q || (row.textContent || '').toLowerCase().includes(q); row.hidden = !hit; if (hit) shown++; }
    if (q && !searching) { searching = true; for (const f of folds) wasOpen.set(f, f.open); }
    if (q) for (const f of folds) { const any = rows.some(r => !r.hidden && f.contains(r)); f.hidden = !any; if (any) f.open = true; }
    else if (searching) { searching = false; for (const f of folds) { f.hidden = false; f.open = wasOpen.get(f) ?? true; } }
    if (count) count.textContent = q ? `Showing ${shown} of ${rows.length} ${rows.length === 1 ? noun : nouns}` : `${rows.length} ${rows.length === 1 ? noun : nouns}`;
    if (empty) empty.hidden = shown > 0; table.closest<HTMLElement>('[data-filter-table]')?.toggleAttribute('hidden', shown === 0);
  };
  input.addEventListener('input', run);
  document.querySelector('[data-filter-clear]')?.addEventListener('click', () => { input.value = ''; run(); input.focus(); });
});

/* 4. A button marked data-copy puts its text on the clipboard and says so, in its label and to screen readers. */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  const label = btn.querySelector<HTMLElement>('.ui-button-label'), status = btn.parentElement?.querySelector<HTMLElement>('[role="status"]'), was = label?.innerHTML ?? '';
  const idle = btn.querySelector<HTMLElement>('[data-copy-idle]'), done = btn.querySelector<HTMLElement>('[data-copy-done]');
  try { await navigator.clipboard.writeText(btn.dataset.copy || ''); if (idle && done) { idle.hidden = true; done.hidden = false; } else if (label) label.textContent = btn.dataset.copied || 'Copied'; if (status) status.textContent = 'Copied to the clipboard'; }
  catch { if (label) label.textContent = 'Select the text above and copy it'; if (status) status.textContent = 'Copying did not work. Select the text and copy it.'; }
  window.setTimeout(() => { if (label) label.innerHTML = was; if (status) status.textContent = ''; }, 2500);
}));

/* 6. A sent form: aria-busy on the form dims its buttons (admin.css) and the pressed button shows its busy words. The
   buttons are not disabled: a button disabled inside its own submit event can drop its name and value from what is
   sent, and the server needs them to know which action was asked for. */
document.querySelectorAll<HTMLFormElement>('form[data-busy]').forEach(form => form.addEventListener('submit', event => {
  /* Discarding deletes the draft and cannot be undone, so it asks first. The browser's own question works from the keyboard and is read out. */
  const pressed = (event as SubmitEvent).submitter as HTMLElement | null;
  if (pressed?.getAttribute('value') === 'discard' && !confirm('Discard this draft? The saved draft is deleted. The published version, if there is one, is kept.')) { event.preventDefault(); return; }
  /* Removing an entry deletes its file from the repository: it asks first, in the same way. A button may carry its own
     question (data-confirm) when what it removes is not a file of the site. */
  if (pressed?.getAttribute('value') === 'delete' && !confirm(pressed.getAttribute('data-confirm') || 'Remove this entry from the site? Its file is deleted from the repository and any draft with it. This cannot be undone from here.')) { event.preventDefault(); return; }
  form.setAttribute('aria-busy', 'true');
  form.querySelectorAll<HTMLButtonElement>('button[type="submit"]').forEach(b => b.setAttribute('aria-disabled', 'true'));
  const label = pressed?.querySelector<HTMLElement>('.ui-button-label');
  if (label && pressed?.dataset.busyLabel) label.textContent = pressed.dataset.busyLabel;
}));

/* 8. A period chip on the dashboard: the numbers step back until the next page arrives, so the press is seen to have worked. */
document.querySelectorAll<HTMLAnchorElement>('[data-period-link]').forEach(a => a.addEventListener('click', e => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; a.closest('.dash')?.setAttribute('aria-busy', 'true'); }));
window.addEventListener('pageshow', () => { document.querySelector('.dash[aria-busy]')?.removeAttribute('aria-busy'); });

/* 9. A chart's hover note goes on Escape and comes back when the pointer moves, so it can be dismissed without moving away (WCAG 1.4.13). */
if (document.querySelector('.dash-tip')) {
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.documentElement.setAttribute('data-tips-off', ''); });
  document.addEventListener('pointermove', () => { document.documentElement.removeAttribute('data-tips-off'); }, { passive: true });
}

/* 10. A repeating group: one empty row stays in view and the other spare rows are hidden; Add another reveals the next one
   and puts focus in it. A row with anything typed in it is never hidden. Without JavaScript every spare row is shown. */
document.querySelectorAll<HTMLElement>('[data-repeat]').forEach(group => {
  const rows = [...group.querySelectorAll<HTMLElement>(':scope > .admin-repeat, :scope > .admin-repeat-fold > .admin-repeat')], button = group.querySelector<HTMLButtonElement>('[data-repeat-add]');
  const filled = (row: HTMLElement) => [...row.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type=hidden]):not([type=checkbox]), textarea')].some(f => f.value.trim() !== '') || [...row.querySelectorAll<HTMLInputElement>('input[type=checkbox]')].some(b => b.checked);
  let kept = false;
  for (const row of rows) { if (filled(row)) continue; if (!kept) { kept = true; continue; } row.hidden = true; }
  const next = () => rows.find(r => r.hidden);
  if (!button) return;
  /* With every spare row in use the button stays, disabled, and says why: saving the draft brings new rows. */
  const exhausted = () => { button.setAttribute('aria-disabled', 'true'); if (!button.parentElement?.querySelector('[data-add-hint]')) { const hint = document.createElement('p'); hint.className = 'form-hint'; hint.dataset.addHint = ''; hint.textContent = 'Save the draft to add more.'; button.parentElement?.append(hint); } };
  if (!next()) exhausted();
  button.addEventListener('click', () => { if (button.getAttribute('aria-disabled') === 'true') return; const row = next(); if (!row) return; row.hidden = false; row.querySelector<HTMLElement>('input:not([type=hidden]), textarea, select')?.focus(); if (!next()) exhausted(); });
});

/* 11. A picture preview under a path field: shown while the path is one of the pictures the repository holds (the
   datalist the field offers), from the same route the Images page draws its thumbnails with. */
const pictures = new Set([...document.querySelectorAll<HTMLOptionElement>('#image-list option')].map(o => o.value));
/* Under an image field (11b), the whole picture and the picture as a 16:10 card cuts it: a click on the whole picture
   writes the focus point into its field, the cut follows the field as it is typed, and a picture far from 16:10 is
   shown whole with a note, as the site shows it (components/ui/fitted-image.astro). */
const FOCUS = /^(100|\d{1,2})% (100|\d{1,2})%$/;
document.querySelectorAll<HTMLElement>('[data-preview]').forEach(box => {
  const field = document.getElementById(box.dataset.preview!) as HTMLInputElement | null, imgs = [...box.querySelectorAll('img')];
  if (!field || !imgs.length) return;
  const focus = box.dataset.focus ? document.getElementById(box.dataset.focus) as HTMLInputElement | null : null;
  const pick = box.querySelector<HTMLElement>('[data-pick]'), mark = box.querySelector<HTMLElement>('.admin-focus-mark'), note = box.querySelector<HTMLElement>('[data-fit-note]');
  /* Where the picture is drawn inside its box (it is shown whole, so it may not fill the box). */
  const drawn = (img: HTMLImageElement) => {
    const r = img.getBoundingClientRect(), scale = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    return { r, w, h, x: (r.width - w) / 2, y: (r.height - h) / 2 };
  };
  const paint = () => {
    const v = focus?.value.trim() ?? '', at = FOCUS.test(v) ? v : '';
    const img = imgs[0], whole = img.naturalWidth > 0 && Math.abs(Math.log(img.naturalWidth / img.naturalHeight / 1.6)) > Math.log(1.15);
    box.querySelectorAll<HTMLElement>('[data-shape] img').forEach(i => { i.style.objectFit = whole ? 'contain' : ''; i.style.objectPosition = whole ? 'center' : at; });
    if (note) note.hidden = !whole;
    if (mark) {
      mark.hidden = !at || !img.naturalWidth;
      if (at && img.naturalWidth) { const [px, py] = at.split(' ').map(s => parseFloat(s) / 100); const d = drawn(img); mark.style.left = `${d.x + px * d.w}px`; mark.style.top = `${d.y + py * d.h}px`; }
    }
  };
  const show = () => { const v = field.value.trim(); if (!pictures.has(v)) { box.hidden = true; return; } const src = '/admin/images/file?path=' + encodeURIComponent(v.replace(/^\.\.\/\.\.\/assets\//, '')) + '&size=thumb'; imgs.forEach(i => { if (i.getAttribute('src') !== src) i.src = src; }); box.hidden = false; paint(); };
  field.addEventListener('input', show); field.addEventListener('change', show);
  imgs[0].addEventListener('load', paint);
  imgs.forEach(i => i.addEventListener('error', () => { box.hidden = true; }));
  focus?.addEventListener('input', paint);
  // The picture in the pick box is shown whole (object-fit: contain), so a click is measured against the drawn picture.
  pick?.addEventListener('click', event => {
    const img = imgs[0]; if (!focus || !img.naturalWidth) return;
    const d = drawn(img), pct = (n: number) => Math.round(Math.min(100, Math.max(0, n * 100)));
    focus.value = `${pct((event.clientX - d.r.left - d.x) / d.w)}% ${pct((event.clientY - d.r.top - d.y) / d.h)}%`;
    focus.dispatchEvent(new Event('input', { bubbles: true }));
  });
  paint();
});

/* 12. Blur validation: the same error line the server draws (cloned from a template in the editor), under an empty
   required field when focus leaves it, removed as soon as something is typed. Only the lines this adds are removed. */
const errorTemplate = document.querySelector<HTMLTemplateElement>('template[data-field-error]');
if (errorTemplate) {
  type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const isField = (t: EventTarget | null): t is Field => t instanceof HTMLElement && t.matches('input[aria-required="true"], textarea[aria-required="true"], select[aria-required="true"]') && !!t.id;
  const described = (f: Field) => (f.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
  const clear = (f: Field) => { const id = f.id + '-error', node = document.getElementById(id); if (!node || !('clientError' in node.dataset)) return; node.remove(); f.removeAttribute('aria-invalid'); const rest = described(f).filter(x => x !== id); if (rest.length) f.setAttribute('aria-describedby', rest.join(' ')); else f.removeAttribute('aria-describedby'); };
  const mark = (f: Field) => { if (f.value.trim()) { clear(f); return; } const id = f.id + '-error'; if (document.getElementById(id)) return; const node = errorTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement; node.id = id; node.dataset.clientError = ''; node.querySelector('span')!.textContent = 'This is needed.'; f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', [...described(f), id].join(' ')); (f.closest('.form-field') || f.parentElement)?.append(node); };
  document.addEventListener('focusout', e => { if (isField(e.target)) mark(e.target); });
  document.addEventListener('input', e => { if (isField(e.target) && e.target.value.trim()) clear(e.target); });
}

/* 13. A thumbnail that cannot be loaded leaves words, not a blank box. */
document.querySelectorAll<HTMLImageElement>('.admin-thumb img').forEach(img => img.addEventListener('error', () => { const box = img.parentElement; if (!box) return; img.remove(); box.dataset.failed = ''; box.textContent = 'Preview not available'; }));

/* 7. Show password. */
document.querySelectorAll<HTMLInputElement>('[data-show-password]').forEach(box => {
  const field = document.getElementById(box.dataset.showPassword!) as HTMLInputElement | null;
  if (field) box.addEventListener('change', () => { field.type = box.checked ? 'text' : 'password'; });
});

/* 5. After a publish is refused the page comes back with a list of what to fix. Focus goes to that list, so it is the
   first thing read out and the first thing a keyboard reaches; each item in it links to its field. */
document.getElementById('problems')?.focus({ preventScroll: false });
