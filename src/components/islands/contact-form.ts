/* Contact form behaviour. Validation runs on blur and on submit; the first submit with errors shows a summary that links
   to each field. A failed send keeps every value and offers a ready-made email with the same text. */
const SEND_TIMEOUT = 15000;

document.querySelectorAll<HTMLElement>('[data-contact-form]:not([data-static])').forEach(root => {
  const form = root.querySelector('form'); if (!form) return;
  form.noValidate = true; // our messages replace the browser's bubbles; without JavaScript the browser's own apply
  const fields = [...form.querySelectorAll<HTMLElement>('[data-field]')].map(wrap => {
    const input = wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')!;
    return { wrap, input, error: wrap.querySelector<HTMLElement>('[data-field-error]')!, text: wrap.dataset.errorText || 'Check this field.', hint: wrap.querySelector('.form-hint')?.id };
  });
  const summary = form.querySelector<HTMLElement>('[data-form-summary]')!, list = summary.querySelector<HTMLElement>('[data-form-summary-list]')!, summaryTitle = summary.querySelector<HTMLElement>('[data-form-summary-title]')!;
  const failure = form.querySelector<HTMLElement>('[data-form-failure]')!, success = root.querySelector<HTMLElement>('[data-form-success]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-form-submit]')!, status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const label = submit.querySelector<HTMLElement>('.ui-button-label')!;
  let tried = false;

  const check = (f: (typeof fields)[number]) => {
    const value = f.input.value.trim();
    const ok = value !== '' && (f.input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    f.error.hidden = ok; f.error.querySelector('span')!.textContent = ok ? '' : f.text;
    if (ok) f.input.removeAttribute('aria-invalid'); else f.input.setAttribute('aria-invalid', 'true');
    f.input.setAttribute('aria-describedby', [f.hint, ok ? '' : f.error.id].filter(Boolean).join(' '));
    if (!f.input.getAttribute('aria-describedby')) f.input.removeAttribute('aria-describedby');
    return ok;
  };
  const summarise = () => {
    const bad = fields.filter(f => f.input.getAttribute('aria-invalid') === 'true');
    summary.hidden = bad.length === 0;
    summaryTitle.textContent = bad.length ? `Fix ${bad.length} field${bad.length === 1 ? '' : 's'} to send your message` : '';
    list.replaceChildren(...bad.map(f => { const li = document.createElement('li'), a = document.createElement('a'); a.href = `#${f.input.id}`; a.textContent = f.text; a.addEventListener('click', e => { e.preventDefault(); f.input.focus(); }); li.append(a); return li; }));
    return bad;
  };
  fields.forEach(f => {
    f.input.addEventListener('blur', () => { if (f.input.value.trim() !== '' || tried) { check(f); if (tried) summarise(); } });
    f.input.addEventListener('input', () => { if (f.input.getAttribute('aria-invalid') === 'true') { check(f); if (tried) summarise(); } });
  });
  const busy = (on: boolean) => {
    root.dataset.state = on ? 'submitting' : root.dataset.state || 'idle';
    submit.disabled = on; fields.forEach(f => { f.input.readOnly = on; });
    label.textContent = on ? 'Sending' : 'Send message';
    status.textContent = on ? 'Sending your message. This can take a few seconds.' : '';
  };

  form.addEventListener('submit', async event => {
    event.preventDefault(); tried = true; failure.hidden = true;
    fields.forEach(check);
    if (summarise().length) { root.dataset.state = 'invalid'; summary.focus(); return; }
    if ((form.elements.namedItem('_gotcha') as HTMLInputElement | null)?.value) return; // filled by a bot
    busy(true);
    const data = Object.fromEntries(fields.map(f => [f.input.name, f.input.value.trim()]));
    const stop = new AbortController(), timer = window.setTimeout(() => stop.abort(), SEND_TIMEOUT);
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: stop.signal });
      if (!res.ok) throw new Error(String(res.status));
      busy(false); root.dataset.state = 'success'; form.hidden = true; success.hidden = false; success.focus();
    } catch {
      busy(false); root.dataset.state = 'failure';
      const mail = failure.querySelector<HTMLAnchorElement>('[data-form-mailto]');
      if (mail) mail.href = `mailto:${root.dataset.email}?subject=${encodeURIComponent('Message from ' + data.name)}&body=${encodeURIComponent(`${data.message}\n\n${data.name}\n${data.email}`)}`;
      failure.hidden = false; failure.focus();
    } finally { clearTimeout(timer); }
  });
});
