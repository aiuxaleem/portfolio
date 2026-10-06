// In-page checks. Each function runs inside the browser and returns a list of failures: { check, detail }.
// Never loosen a threshold here to make a page pass (CLAUDE.md 3). Fix the page or ask the owner.

export function pageChecks() {
  const fails = [];
  const iw = innerWidth;
  const de = document.documentElement;
  const visible = el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none'; };
  const label = el => ((el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)) || '<' + el.tagName.toLowerCase() + '>';
  const where = el => { const s = el.closest('section[id], header, footer, nav, dialog'); return s ? (s.id ? '#' + s.id : s.tagName.toLowerCase()) : 'main'; };

  // 2.4 No horizontal scroll
  if (de.scrollWidth > iw + 1) fails.push({ check: 'horizontal-scroll', detail: `document is ${de.scrollWidth}px wide in a ${iw}px viewport` });

  // 2.3 No clipped or off-screen text
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const node = walker.currentNode; if (!node.nodeValue.trim()) continue;
    const el = node.parentElement; if (!el || seen.has(el) || !visible(el)) continue; seen.add(el);
    if (el.closest('.cory-visually-hidden, [aria-hidden="true"], script, style, template, noscript')) continue;
    const range = document.createRange(); range.selectNodeContents(node); const r = range.getBoundingClientRect(); if (!r.width) continue;
    let why = null;
    if (r.right > iw + 1 || r.left < -1) { let p = el, scroller = false; while (p && p !== document.body) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) { scroller = true; break; } p = p.parentElement; } if (!scroller) why = 'outside the viewport'; }
    // Text inside a deliberate horizontal scroller (overflow-x: auto or scroll) is reachable, so it is not clipped.
    if (!why) for (let p = el; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p), pr = p.getBoundingClientRect(); if (/(auto|scroll)/.test(s.overflowX)) break; if (/(hidden|clip)/.test(s.overflowX) && (r.right > pr.right + 1.5 || r.left < pr.left - 1.5)) { why = 'cut by an ancestor'; break; } }
    if (why) fails.push({ check: 'text-clipped', detail: `"${node.nodeValue.trim().slice(0, 40)}" ${why} (x ${Math.round(r.left)} to ${Math.round(r.right)}) in ${where(el)}` });
  }

  // 2.4 Targets at least 44x44, and fully inside the viewport horizontally
  document.querySelectorAll('a[href], button, [role="button"], [role="switch"], summary, input, select, textarea').forEach(el => {
    if (!visible(el) || el.closest('[aria-hidden="true"]') || el.disabled) return;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const inline = cs.display === 'inline' && el.parentElement && el.parentElement.innerText.trim().length > (el.innerText || '').trim().length + 8;
    if (!inline && (r.width < 44 || r.height < 44)) fails.push({ check: 'target-size', detail: `"${label(el)}" is ${Math.round(r.width)}x${Math.round(r.height)} in ${where(el)}` });
    if (r.right > iw + 1 || r.left < -1) fails.push({ check: 'target-off-screen', detail: `"${label(el)}" spans x ${Math.round(r.left)} to ${Math.round(r.right)} in ${where(el)}` });
  });

  // 2.1 Landmarks, one h1, no skipped levels, lang
  const h1 = document.querySelectorAll('h1').length;
  if (h1 !== 1) fails.push({ check: 'one-h1', detail: `${h1} <h1> elements` });
  const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].filter(visible).map(h => (/^H\d$/.test(h.tagName) ? +h.tagName[1] : +(h.getAttribute('aria-level') || 2)));
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) { fails.push({ check: 'heading-order', detail: `h${levels[i - 1]} is followed by h${levels[i]}` }); break; }
  if (document.querySelectorAll('main').length !== 1) fails.push({ check: 'landmarks', detail: 'exactly one <main> is required' });
  if (!de.lang) fails.push({ check: 'lang', detail: '<html> has no lang' });

  // 2.1 / 2.4 Images: alt attribute, intrinsic size or an aspect-ratio box
  document.querySelectorAll('img').forEach(img => {
    if (!img.getClientRects().length) return;
    const src = (img.currentSrc || img.src).split('/').slice(-2).join('/');
    if (!img.hasAttribute('alt')) fails.push({ check: 'img-alt', detail: `${src} has no alt attribute` });
    let boxed = false; for (let p = img; p && p !== document.body; p = p.parentElement) { const a = getComputedStyle(p).aspectRatio; if (a && a !== 'auto') { boxed = true; break; } }
    if (!(img.hasAttribute('width') && img.hasAttribute('height')) && !boxed) fails.push({ check: 'img-size', detail: `${src} has no width/height and no aspect-ratio box` });
    if (img.complete && img.naturalWidth === 0) fails.push({ check: 'img-broken', detail: `${src} failed to load` });
  });

  // 2.9 Metadata
  if (!document.title.trim()) fails.push({ check: 'meta-title', detail: 'empty <title>' });
  if (!document.querySelector('meta[name="description"]')) fails.push({ check: 'meta-description', detail: 'no meta description' });
  if (!document.querySelector('link[rel="canonical"]')) fails.push({ check: 'meta-canonical', detail: 'no canonical link' });
  const viewport = (document.querySelector('meta[name="viewport"]') || {}).content || '';
  if (!/width=device-width/.test(viewport) || /user-scalable=no|maximum-scale/.test(viewport)) fails.push({ check: 'viewport-meta', detail: `viewport is "${viewport}"` });

  // 2.5 Theme applied and colour-scheme set
  const theme = de.getAttribute('data-theme');
  if (theme !== 'light' && theme !== 'dark') fails.push({ check: 'theme', detail: 'data-theme is not set on <html>' });
  else if (!getComputedStyle(de).colorScheme.includes(theme)) fails.push({ check: 'color-scheme', detail: `color-scheme is "${getComputedStyle(de).colorScheme}" in ${theme} theme` });
  return fails;
}

/** Reads the focused element after a Tab press. A control passes only with a real outline (not a halo alone). */
export function focusProbe() {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  if (!el || el === document.body) return null;
  const s = getComputedStyle(el), r = el.getBoundingClientRect();
  let opacity = 1; for (let p = el; p; p = p.parentElement || (p.getRootNode && p.getRootNode().host)) opacity *= +getComputedStyle(p).opacity;
  const section = el.closest('section[id], header, footer, nav, dialog');
  return {
    key: el.tagName + '|' + (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40) + '|' + Math.round(r.top + scrollY),
    label: ((el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)) || '<' + el.tagName.toLowerCase() + '>',
    where: section ? (section.id ? '#' + section.id : section.tagName.toLowerCase()) : 'main',
    outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2,
    invisible: opacity < 0.05 || r.width === 0 || r.height === 0,
  };
}
