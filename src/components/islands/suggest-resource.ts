/* Suggest-a-resource form behaviour. Validation runs on blur and on submit; the first submit with errors shows a summary
   that links to each field. The suggestion is posted as JSON to /api/resources. A refusal from the site (a field it
   will not accept, or too many suggestions from one place) is shown in its own words; a failed send keeps every value
   and offers a ready-made email with the same text. */
const SEND_TIMEOUT = 15000;

document.querySelectorAll<HTMLElement>('[data-suggest-form]:not([data-static])').forEach(root => {
  const form = root.querySelector('form'); if (!form) return;
  form.noValidate = true; // our messages replace the browser's bubbles; without JavaScript the browser's own apply
  type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const fields = [...form.querySelectorAll<HTMLElement>('[data-field]')].map(wrap => {
    const input = wrap.querySelector<Control>('input, select, textarea')!;
    return { wrap, input, error: wrap.querySelector<HTMLElement>('[data-field-error]')!, text: wrap.dataset.errorText || 'Check this field.', hint: wrap.querySelector('.form-hint')?.id };
  });
  const summary = form.querySelector<HTMLElement>('[data-form-summary]')!, list = summary.querySelector<HTMLElement>('[data-form-summary-list]')!, summaryTitle = summary.querySelector<HTMLElement>('[data-form-summary-title]')!;
  const failure = form.querySelector<HTMLElement>('[data-form-failure]')!, failureText = failure.querySelector<HTMLElement>('[data-form-failure-text]')!, success = root.querySelector<HTMLElement>('[data-form-success]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-form-submit]')!, status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const label = submit.querySelector<HTMLElement>('.ui-button-label')!;
  const plainFailure = failureText.innerHTML;
  let tried = false;

  const check = (f: (typeof fields)[number]) => {
    // A link typed without its scheme ("figma.com") is taken as https, not refused.
    if (f.input.getAttribute('type') === 'url' && /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(f.input.value.trim())) f.input.value = 'https://' + f.input.value.trim();
    const value = f.input.value.trim();
    const ok = value !== '' && (f.input.getAttribute('type') !== 'url' || /^https?:\/\/\S+\.\S+/.test(value));
    f.error.hidden = ok; f.error.querySelector('span')!.textContent = ok ? '' : f.text;
    if (ok) f.input.removeAttribute('aria-invalid'); else f.input.setAttribute('aria-invalid', 'true');
    const by = [f.hint, ok ? '' : f.error.id].filter(Boolean).join(' ');
    if (by) f.input.setAttribute('aria-describedby', by); else f.input.removeAttribute('aria-describedby');
    return ok;
  };
  const summarise = () => {
    const bad = fields.filter(f => f.input.getAttribute('aria-invalid') === 'true');
    summary.hidden = bad.length === 0;
    summaryTitle.textContent = bad.length ? `Fix ${bad.length} field${bad.length === 1 ? '' : 's'} to send your suggestion` : '';
    list.replaceChildren(...bad.map(f => { const li = document.createElement('li'), a = document.createElement('a'); a.href = `#${f.input.id}`; a.textContent = f.text; a.addEventListener('click', e => { e.preventDefault(); f.input.focus(); }); li.append(a); return li; }));
    return bad;
  };
  fields.forEach(f => {
    f.input.addEventListener('blur', () => { if (f.input.value.trim() !== '' || tried) { check(f); if (tried) summarise(); } });
    f.input.addEventListener('input', () => { if (f.input.getAttribute('aria-invalid') === 'true') { check(f); if (tried) summarise(); } });
    f.input.addEventListener('change', () => { if (f.input.getAttribute('aria-invalid') === 'true') { check(f); if (tried) summarise(); } });
  });
  const controls = [...form.querySelectorAll<Control>('input:not([type=hidden]), select, textarea')];
  const busy = (on: boolean) => {
    root.dataset.state = on ? 'submitting' : root.dataset.state || 'idle';
    submit.disabled = on; controls.forEach(c => { if (c instanceof HTMLSelectElement) c.disabled = on; else c.readOnly = on; });
    label.textContent = on ? 'Sending' : 'Send suggestion';
    status.textContent = on ? 'Sending your suggestion. This can take a few seconds.' : '';
  };
  const fail = (text?: string) => {
    busy(false); root.dataset.state = 'failure';
    failureText.innerHTML = plainFailure;
    if (text) failureText.textContent = text;
    const mail = failure.querySelector<HTMLAnchorElement>('[data-form-mailto]');
    const data = Object.fromEntries(new FormData(form).entries());
    if (mail) mail.href = `mailto:${root.dataset.email}?subject=${encodeURIComponent('Resource suggestion: ' + String(data.title || ''))}&body=${encodeURIComponent(`${data.title}\n${data.url}\nCategory: ${data.category}\n\n${data.description || ''}\n\n${data.name || ''}\n${data.email || ''}`)}`;
    failure.hidden = false; failure.focus();
  };

  form.addEventListener('submit', async event => {
    event.preventDefault(); tried = true; failure.hidden = true;
    fields.forEach(check);
    if (summarise().length) { root.dataset.state = 'invalid'; summary.focus(); return; }
    if ((form.elements.namedItem('_gotcha') as HTMLInputElement | null)?.value) return; // filled by a bot
    // Read the form before locking it: a disabled menu is left out of the form's data.
    const data = Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, String(v).trim()]));
    busy(true);
    const stop = new AbortController(), timer = window.setTimeout(() => stop.abort(), SEND_TIMEOUT);
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: stop.signal });
      if (res.ok) { busy(false); root.dataset.state = 'success'; form.hidden = true; success.hidden = false; success.focus(); return; }
      let said = '';
      try { const body = await res.json() as { message?: string; problems?: { field: string; message: string }[] }; said = body.message || (body.problems || []).map(p => p.message).join(' '); } catch { /* no words from the site */ }
      fail(said ? `${said} What you typed is still in the form.` : undefined);
    } catch { fail(); } finally { clearTimeout(timer); }
  });
});

/* Keeps this file a module of its own, so its names never clash with the other islands. */
export {};
