/* The private work pages (docs/PRIVATE_WORK.md).
   1. The request form (components/private-work/request-form.astro). A field is checked when it loses focus, once
      something was typed in it or a send was tried; the first send with errors shows a summary that links to each field
      and takes focus. A valid form is posted as it is (the server checks the same rules and answers with the form in its
      state): the button steps back, the fields lock (read-only, so their values are still sent) and a status line says
      it is sending. When the server's answer arrives with a summary, a failure or the confirmation, focus goes to it.
   2. A form marked data-once (the Continue button on /private-work/enter, the Sign out button) is sent once: a second
      press would use up the sign-in link a second time and show "already used" over the first answer.
   Without JavaScript the browser's own required checks apply and the server's answer does the rest. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.querySelectorAll<HTMLElement>('[data-access-form]:not([data-static])').forEach(root => {
  const form = root.querySelector<HTMLFormElement>('form[data-access-request]'); if (!form) return;
  form.noValidate = true; // these messages replace the browser's bubbles
  const fields = [...form.querySelectorAll<HTMLElement>('[data-field]')].map(wrap => {
    const input = wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')!;
    return { input, error: wrap.querySelector<HTMLElement>('[data-field-error]')!, text: wrap.dataset.errorText || 'Check this field.', hint: wrap.querySelector('.form-hint')?.id };
  });
  const summary = form.querySelector<HTMLElement>('[data-form-summary]')!, list = summary.querySelector<HTMLElement>('[data-form-summary-list]')!, summaryTitle = summary.querySelector<HTMLElement>('[data-form-summary-title]')!;
  const failure = form.querySelector<HTMLElement>('[data-form-failure]')!, success = root.querySelector<HTMLElement>('[data-form-success]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-form-submit]')!, status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const label = submit.querySelector<HTMLElement>('.ui-button-label')!, idleLabel = label.textContent || 'Send the request';
  let tried = root.dataset.state === 'invalid', sending = false;

  const isBox = (i: HTMLInputElement | HTMLTextAreaElement): i is HTMLInputElement => i instanceof HTMLInputElement && i.type === 'checkbox';
  const valid = (i: HTMLInputElement | HTMLTextAreaElement) => {
    if (isBox(i)) return !i.required || i.checked;
    const v = i.value.trim();
    if (i.required && !v) return false;
    return !(i.type === 'email' && v && !EMAIL.test(v));
  };
  const check = (f: (typeof fields)[number]) => {
    const ok = valid(f.input);
    f.error.hidden = ok; f.error.querySelector('span')!.textContent = ok ? '' : f.text;
    if (ok) f.input.removeAttribute('aria-invalid'); else f.input.setAttribute('aria-invalid', 'true');
    const ids = [f.hint, ok ? '' : f.error.id].filter(Boolean).join(' ');
    if (ids) f.input.setAttribute('aria-describedby', ids); else f.input.removeAttribute('aria-describedby');
    return ok;
  };
  const summarise = () => {
    const bad = fields.filter(f => f.input.getAttribute('aria-invalid') === 'true');
    summary.hidden = bad.length === 0;
    summaryTitle.textContent = bad.length ? `Fix ${bad.length} field${bad.length === 1 ? '' : 's'} to send your request` : '';
    list.replaceChildren(...bad.map(f => { const li = document.createElement('li'), a = document.createElement('a'); a.href = `#${f.input.id}`; a.textContent = f.error.querySelector('span')!.textContent || f.text; a.addEventListener('click', e => { e.preventDefault(); f.input.focus(); }); li.append(a); return li; }));
    return bad;
  };
  fields.forEach(f => {
    const typed = () => (isBox(f.input) ? f.input.checked : f.input.value.trim() !== '');
    f.input.addEventListener('blur', () => { if (typed() || tried) { check(f); if (tried) summarise(); } });
    f.input.addEventListener(isBox(f.input) ? 'change' : 'input', () => { if (f.input.getAttribute('aria-invalid') === 'true') { check(f); if (tried) summarise(); } });
  });
  /* The server's summary links jump to their fields and put focus there. */
  list.querySelectorAll('a').forEach(a => a.addEventListener('click', e => { const target = document.getElementById(a.getAttribute('href')!.slice(1)); if (target) { e.preventDefault(); target.focus(); } }));

  const lock = (on: boolean) => {
    sending = on; root.dataset.state = on ? 'submitting' : 'idle';
    if (on) submit.setAttribute('aria-disabled', 'true'); else submit.removeAttribute('aria-disabled');
    fields.forEach(f => { if (!isBox(f.input)) f.input.readOnly = on; });
    label.textContent = on ? 'Sending' : idleLabel;
    status.textContent = on ? 'Sending your request. This takes a moment.' : '';
  };
  form.addEventListener('submit', event => {
    if (sending) { event.preventDefault(); return; }
    tried = true; failure.hidden = true;
    fields.forEach(check);
    if (summarise().length) { event.preventDefault(); root.dataset.state = 'invalid'; summary.focus(); return; }
    lock(true);
  });
  /* Back to this page from the next one (the browser's page cache): the form is usable again. */
  window.addEventListener('pageshow', e => { if (e.persisted) lock(false); });

  /* The server's answer: focus goes to what it says, so it is read first. */
  const answer = root.dataset.state === 'success' ? success : root.dataset.state === 'invalid' ? summary : root.dataset.state === 'failure' ? failure : null;
  if (answer && !answer.hidden) answer.focus();
});

/* 2. Sent once. */
document.querySelectorAll<HTMLFormElement>('form[data-once]').forEach(form => {
  let sent = false;
  form.addEventListener('submit', event => {
    if (sent) { event.preventDefault(); return; }
    sent = true;
    const pressed = form.querySelector<HTMLButtonElement>('button[type="submit"]'), text = pressed?.querySelector<HTMLElement>('.ui-button-label');
    pressed?.setAttribute('aria-disabled', 'true');
    if (text && pressed?.dataset.busyLabel) text.textContent = pressed.dataset.busyLabel;
  });
  window.addEventListener('pageshow', e => { if (e.persisted) { sent = false; form.querySelector('button[type="submit"]')?.removeAttribute('aria-disabled'); } });
});
