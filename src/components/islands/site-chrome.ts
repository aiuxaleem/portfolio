/* Behaviour for the shared layout: theme toggle, mobile menu, email copy. No dependencies. */
const THEME_KEY = 'aiuxaleem-theme';
const root = document.documentElement;

/* ---------- Theme (CLAUDE.md 2.5): follows the system until the visitor chooses; the choice persists ---------- */
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
  root.setAttribute('data-theme-switching', '');
  root.setAttribute('data-theme', next);
  if (store) { try { localStorage.setItem(THEME_KEY, next); } catch { /* storage may be blocked */ } }
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-theme-switching')));
  paintTheme();
}
document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true)));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  let stored: string | null = null; try { stored = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
  if (stored !== 'light' && stored !== 'dark') setTheme(e.matches ? 'dark' : 'light', false); // a system change is never stored as a choice
});
paintTheme();

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
    const say = (text: string, ms: number) => { status.textContent = text; clearTimeout(timer); timer = window.setTimeout(() => { status.textContent = ''; }, ms); };
    try { await navigator.clipboard.writeText(link.textContent || ''); say(wrap.dataset.copied || '', 2200); }
    catch { const range = document.createRange(); range.selectNodeContents(link); const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(range); say(wrap.dataset.fallback || '', 5000); }
  });
});
