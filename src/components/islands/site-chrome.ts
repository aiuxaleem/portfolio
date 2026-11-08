/* Behaviour for the shared layout: theme toggle, mobile menu, email copy. No dependencies. */
const THEME_KEY = 'aiuxaleem-theme';
const root = document.documentElement;

/* ---------- Theme (CLAUDE.md 2.5): dark until the visitor chooses (owner instruction, 2 November 2026, L-38); the choice
   persists. The OS preference is not consulted, so a change of it is not followed either. ---------- */
function paintTheme() {
  const dark = root.getAttribute('data-theme') === 'dark';
  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(dark));
    const label = dark ? btn.dataset.labelLight : btn.dataset.labelDark;
    if (btn.hasAttribute('data-menu-theme')) { const text = btn.querySelector('[data-theme-text]'); if (text && label) text.textContent = label; }
    else if (label) { btn.setAttribute('aria-label', label); btn.title = (dark ? btn.dataset.tipLight : btn.dataset.tipDark) || label; }
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--surface-page').trim() || meta.getAttribute('content') || '');
}
function setTheme(next: 'light' | 'dark', store: boolean) {
  const apply = () => {
    root.setAttribute('data-theme-switching', '');
    root.setAttribute('data-theme', next);
    if (store) { try { localStorage.setItem(THEME_KEY, next); } catch { /* storage may be blocked */ } }
    requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-theme-switching')));
    paintTheme();
  };
  /* The page cross-fades to its new colours (a same-document view transition, styled in motion.css under
     html[data-vt="theme"]). Without the API, with reduced motion, or while a list is already changing, the colours change
     at once. */
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches && !root.dataset.vt) {
    root.dataset.vt = 'theme';
    doc.startViewTransition(apply).finished.finally(() => { if (root.dataset.vt === 'theme') delete root.dataset.vt; });
  } else apply();
}
document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true)));
paintTheme();

/* ---------- The bar of the three websites (layout/site-switch.astro): the header carries it at the top of the page; from
   the first scroll the header is marked, and site.css slides the bar up out of view. ---------- */
const header = document.querySelector<HTMLElement>('[data-site-header]');
if (header?.querySelector('[data-site-switch]')) {
  let queued = false;
  const mark = () => { header.toggleAttribute('data-scrolled', window.scrollY > 8); queued = false; };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(mark); } }, { passive: true });
  mark();
}

/* ---------- Header menus: one open state for mouse, touch and keyboard, so one menu is open at a time. A mouse opens a
   group on hover and closes it a moment after leaving (time to travel down to the card), so a mouse click on the button
   keeps it open rather than toggling it shut under the pointer. Touch and keyboard toggle it with a tap, Enter or Space;
   Escape, a click outside or focus leaving the group closes it. Without this script, the header's hover rule still opens
   the cards. ---------- */
const groups = [...document.querySelectorAll<HTMLElement>('[data-nav-group]')];
if (groups.length) root.setAttribute('data-nav-ready', '');
const LEAVE_DELAY = 200;
let leaveTimer = 0, pressedWith = '';
const buttonOf = (g: HTMLElement) => g.querySelector<HTMLButtonElement>('.nav-group-button');
const isOpen = (g: HTMLElement) => buttonOf(g)?.getAttribute('aria-expanded') === 'true';
const setOpen = (group: HTMLElement, open: boolean) => {
  clearTimeout(leaveTimer);
  groups.forEach(g => buttonOf(g)?.setAttribute('aria-expanded', String(open && g === group)));
};
const shut = () => { clearTimeout(leaveTimer); groups.forEach(g => buttonOf(g)?.setAttribute('aria-expanded', 'false')); };
groups.forEach(group => {
  const button = buttonOf(group);
  if (!button) return;
  group.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; clearTimeout(leaveTimer); if (!isOpen(group)) setOpen(group, true); });
  // A keyboard user's focus inside the card keeps it open when the mouse wanders off.
  group.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse' || group.contains(document.activeElement) && document.activeElement !== button) return; clearTimeout(leaveTimer); leaveTimer = window.setTimeout(() => { if (isOpen(group)) setOpen(group, false); }, LEAVE_DELAY); });
  button.addEventListener('pointerdown', e => { pressedWith = e.pointerType; });
  button.addEventListener('click', e => {
    const mouse = e.detail > 0 && pressedWith === 'mouse'; pressedWith = '';
    setOpen(group, mouse || !isOpen(group));
  });
  group.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen(group)) { setOpen(group, false); button.focus(); } });
  group.addEventListener('focusout', e => { if (!group.contains(e.relatedTarget as Node | null) && isOpen(group)) setOpen(group, false); });
});
document.addEventListener('click', e => { if (!(e.target as HTMLElement).closest?.('[data-nav-group]')) shut(); });

/* ---------- Mobile menu: focus moves in, Tab stays inside, Escape closes, focus returns, page behind is inert ---------- */
const menu = document.querySelector<HTMLElement>('[data-menu]');
const menuOpener = document.querySelector<HTMLElement>('[data-menu-open]');
if (menu && menuOpener) {
  const outside = () => [...document.body.querySelectorAll<HTMLElement>(':scope > *, #dc-root > .sc-host > *')].filter(el => !el.contains(menu) && el !== menu && !menu.contains(el));
  const focusables = () => [...menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(el => el.offsetParent !== null);
  const close = (restore = true) => {
    if (menu.hidden) return;
    menu.hidden = true; menuOpener.setAttribute('aria-expanded', 'false'); root.style.overflow = '';
    outside().forEach(el => el.removeAttribute('inert'));
    if (restore) menuOpener.focus();
  };
  const open = () => {
    menu.hidden = false; menuOpener.setAttribute('aria-expanded', 'true'); root.style.overflow = 'hidden';
    outside().forEach(el => el.setAttribute('inert', ''));
    (menu.querySelector<HTMLElement>('[data-menu-close]') || menu).focus();
  };
  menuOpener.addEventListener('click', open);
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => close());
  menu.querySelectorAll('a[href]').forEach(a => a.addEventListener('click', () => close(false)));
  document.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = focusables(); if (!items.length) return;
    const first = items[0], last = items[items.length - 1], active = document.activeElement;
    if (e.shiftKey && (active === first || active === menu)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  });
  // The menu only exists below the header's 960px breakpoint; close it if the layout grows past that.
  matchMedia('(min-width: 1100px)').addEventListener('change', e => { if (e.matches) close(false); });
}

/* ---------- Skip link: move focus to <main> ---------- */
document.querySelector('.skip-link')?.addEventListener('click', () => { const main = document.getElementById('main'); if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: false }); } });

/* ---------- Email copy: idle -> copied, or select the address when the clipboard is blocked ---------- */
document.querySelectorAll<HTMLElement>('[data-email-copy]').forEach(wrap => {
  const link = wrap.querySelector<HTMLElement>('[data-email]'), button = wrap.querySelector('button'), status = wrap.querySelector('[role="status"]');
  if (!link || !button || !status) return;
  let timer = 0;
  button.addEventListener('click', async () => {
    const say = (text: string, ms: number) => { status.textContent = text; clearTimeout(timer); timer = window.setTimeout(() => { status.textContent = ''; delete wrap.dataset.state; }, ms); };
    try { await navigator.clipboard.writeText(link.textContent || ''); wrap.dataset.state = 'copied'; say(wrap.dataset.copied || '', 2200); }
    catch { const range = document.createRange(); range.selectNodeContents(link); const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(range); say(wrap.dataset.fallback || '', 5000); }
  });
});

/* ---------- Rows that scroll sideways on a narrow screen (site.css [data-scroll-row]): the row can be reached and scrolled with
   the keyboard only while it has something to scroll, so it is no empty tab stop on a wide screen. ---------- */
document.querySelectorAll<HTMLElement>('[data-scroll-row]').forEach(row => {
  if (!row.getAttribute('aria-label')) row.setAttribute('aria-label', row.dataset.scrollRow || 'Scroll sideways for more');
  const fit = () => { row.tabIndex = row.scrollWidth > row.clientWidth + 2 ? 0 : -1; };
  fit(); new ResizeObserver(fit).observe(row);
  /* A card that peeks in from the edge counts as visible to the browser, so focusing its link would not scroll the row: bring the
     whole card to the start when anything in it takes focus (smoothly when motion is allowed). */
  row.addEventListener('focusin', e => { const item = (e.target as HTMLElement).closest('li'); if (item && row.scrollWidth > row.clientWidth + 2) item.scrollIntoView({ block: 'nearest', inline: 'start', behavior: root.getAttribute('data-motion') === 'on' ? 'smooth' : 'auto' }); });
});
