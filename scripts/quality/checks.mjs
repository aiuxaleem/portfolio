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
    // 2.3 A short word is never broken across lines: a label, a heading or a table cell squeezed to a letter a line (found on the
    //     live sign-in page's "Show password" and the dashboard's A/B table on a phone, 3 November 2026, L-40 and L-41). Whole words of
    //     2 to 12 letters or digits only (a token between spaces): a longer string, an address or a path may break anywhere by design, and hyphenated text is left alone.
    if (range.getClientRects().length > 1 && getComputedStyle(el).hyphens !== 'auto') {
      /* A token is what sits between spaces; an address or a path is one long token and is left out by its length. */
      const text = node.nodeValue, re = /(?<=^|\s)([\p{L}\p{N}]{2,12})[.,;:!?)]*(?=\s|$)/gu; let m, broken = null;
      while ((m = re.exec(text))) { const wr = document.createRange(); wr.setStart(node, m.index); wr.setEnd(node, m.index + m[1].length); const rects = [...wr.getClientRects()].filter(x => x.width > 0); if (rects.length > 1 && Math.abs(rects[0].top - rects[rects.length - 1].top) > 2) { broken = m[1]; break; } }
      if (broken) fails.push({ check: 'word-broken', detail: `the word "${broken}" is broken across lines in "${text.trim().slice(0, 40)}" in ${where(el)}` });
      // 2.3 A number stays with its unit (L-57): "15-minute" or "15-min" broken after the hyphen left "15-" alone at a line's
      //     end on a 320 px phone (mobile review, 16 November 2026, L-74; the text now carries a word joiner after the hyphen).
      const unit = /\d+[-‐–](?:⁠)?\p{L}+/gu; let u;
      while ((u = unit.exec(text))) { const ur = document.createRange(); ur.setStart(node, u.index); ur.setEnd(node, u.index + u[0].length); const rects = [...ur.getClientRects()].filter(x => x.width > 0); if (rects.length > 1 && Math.abs(rects[0].top - rects[rects.length - 1].top) > 2) { fails.push({ check: 'number-unit-split', detail: `"${u[0].replace('⁠', '')}" is broken across lines in "${text.trim().slice(0, 40)}" in ${where(el)}` }); break; } }
    }
  }

  // 2.4 Targets at least 44x44, and fully inside the viewport horizontally. A target inside a row that scrolls sideways on
  //     purpose (overflow-x auto or scroll, wider than itself, itself on screen, and a tab stop so the keyboard can reach it:
  //     site.css [data-scroll-row], L-56) is reached by scrolling the row; the motion check (7j) measures that focusing such
  //     a card scrolls it into view. Anything else beyond the screen's edge still fails.
  const sidewaysScroller = el => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (/(auto|scroll)/.test(cs.overflowX) && a.scrollWidth > a.clientWidth + 2) return a; } return null; };
  const reachableByRow = el => { const s = sidewaysScroller(el); if (!s || s.tabIndex < 0) return false; const b = s.getBoundingClientRect(); return b.left >= -1 && b.right <= iw + 1; };
  document.querySelectorAll('a[href], button, [role="button"], [role="switch"], summary, input, select, textarea').forEach(el => {
    if (!visible(el) || el.closest('[aria-hidden="true"]') || el.disabled) return;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const inline = cs.display === 'inline' && el.parentElement && el.parentElement.innerText.trim().length > (el.innerText || '').trim().length + 8;
    if (!inline && (r.width < 44 || r.height < 44)) fails.push({ check: 'target-size', detail: `"${label(el)}" is ${Math.round(r.width)}x${Math.round(r.height)} in ${where(el)}` });
    if ((r.right > iw + 1 || r.left < -1) && !reachableByRow(el)) fails.push({ check: 'target-off-screen', detail: `"${label(el)}" spans x ${Math.round(r.left)} to ${Math.round(r.right)} in ${where(el)}` });
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
    // 2.4 A content picture is never cut by its frame (owner instruction, 9 November 2026, L-60): drawn with object-fit cover into
    //     a box of another shape, a picture loses its edges. The site shows every uploaded picture whole (ui/fitted-image.astro,
    //     the gallery tiles, the before/after panes), so a cut here is a fault. A square portrait in a round 44px frame keeps its
    //     shape and passes; a designed scene may opt out with data-crop="scene"; anything under 24px is left alone.
    if (img.naturalWidth && img.naturalHeight && getComputedStyle(img).objectFit === 'cover' && !img.closest('[data-crop="scene"]')) {
      const r = img.getBoundingClientRect();
      if (r.width > 24 && r.height > 24) { const box = r.width / r.height, nat = img.naturalWidth / img.naturalHeight; if (Math.abs(box - nat) / nat > 0.03) fails.push({ check: 'img-cropped', detail: `${src} (${img.naturalWidth}x${img.naturalHeight}) is cut to a ${Math.round(r.width)}x${Math.round(r.height)} frame in ${where(img)}` }); }
    }
    // 2.4 The same rule for a picture drawn whole in its own box (contain, scale-down, none, or fill) whose box runs past an
    //     ancestor that clips (overflow hidden or clip): the ancestor cuts what the picture shows. Found on the Home and
    //     audience-site decks, whose tilted window ran past the card's side and foot (mobile review, 16 November 2026, L-74).
    //     An ancestor that scrolls (auto or scroll) is not a cut: the picture is reached by scrolling. Pictures inside a
    //     transformed frame are measured by their bounding box, so 4 px of slack is allowed for a tilt.
    //     A picture nobody sees (visibility hidden: the cards stacked behind a deck's front card) is left out.
    if (img.naturalWidth && img.naturalHeight && getComputedStyle(img).objectFit !== 'cover' && getComputedStyle(img).visibility !== 'hidden' && !img.closest('[data-crop="scene"]') && !/blur/.test(getComputedStyle(img).filter)) {
      const r = img.getBoundingClientRect(), cs = getComputedStyle(img);
      if (r.width > 24 && r.height > 24) {
        let pw = r.width, ph = r.height;
        if (cs.objectFit === 'contain' || cs.objectFit === 'scale-down' || cs.objectFit === 'none') {
          const s = cs.objectFit === 'none' ? 1 : Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight, cs.objectFit === 'scale-down' ? 1 : Infinity);
          pw = img.naturalWidth * s; ph = img.naturalHeight * s;
        }
        const pos = cs.objectPosition.split(' '), at = (v, free) => (v.endsWith('%') ? (parseFloat(v) / 100) * free : parseFloat(v) || 0);
        const left = r.left + at(pos[0] || '50%', r.width - pw), top = r.top + at(pos[1] || '50%', r.height - ph);
        let shown = { left, top, right: left + pw, bottom: top + ph };
        for (let a = img.parentElement; a && a !== document.body; a = a.parentElement) {
          const acs = getComputedStyle(a);
          /* Inside a scroller the whole picture is reached by scrolling, so from there outwards what must not be cut is the
             scroller's own window onto it (the image preview's zoomed stage inside its rounded frame). */
          if (/(auto|scroll)/.test(acs.overflowX + ' ' + acs.overflowY)) { const s = a.getBoundingClientRect(); shown = { left: Math.max(shown.left, s.left), top: Math.max(shown.top, s.top), right: Math.min(shown.right, s.right), bottom: Math.min(shown.bottom, s.bottom) }; continue; }
          if (!/(hidden|clip)/.test(acs.overflowX + ' ' + acs.overflowY)) continue;
          const b = a.getBoundingClientRect(), slack = 4;
          const cut = Math.max(b.left - shown.left, shown.right - b.right, b.top - shown.top, shown.bottom - b.bottom);
          if (cut > slack && cut > 0.03 * Math.min(pw, ph)) { fails.push({ check: 'img-cropped', detail: `${src} is drawn whole (${Math.round(pw)}x${Math.round(ph)}) but ${Math.round(cut)} px of it lies outside a clipping ${a.tagName.toLowerCase()}${a.className && typeof a.className === 'string' ? '.' + a.className.split(' ')[0] : ''} in ${where(img)}` }); break; }
        }
      }
    }
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

/* Touch targets at least 8 px apart (CLAUDE.md 2.4, as written: the gap between the edges of two targets). Measured between
   visible targets that are not inline in running text (a link in a sentence is exempt, as in WCAG 2.5.8), where neither holds
   the other, and on the same layer: a target in a fixed or sticky bar and one scrolling beneath it overlap by position, which is
   a question of covering (checked elsewhere), not of spacing. Runs in the page; used on touch devices (check-mobile.mjs,
   check-admin-mobile.mjs, since 16 November 2026, L-74). */
export function targetSpacing() {
  /* checkVisibility(): a closed <details> keeps its contents laid out but hidden (content-visibility), so their boxes sit on the page without being there for a finger. */
  const shown = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && el.checkVisibility?.() !== false && !el.closest('[hidden], dialog:not([open]), [aria-hidden="true"], [inert]'); };
  const label = el => ((el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30)) || '<' + el.tagName.toLowerCase() + '>';
  const inline = el => getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.innerText.trim().length > (el.innerText || '').trim().length + 8;
  /* A control hidden for sight (a 1 px radio inside its chip, the visually-hidden pattern) is reached through its label, not touched itself. */
  const t = [...document.querySelectorAll('a[href], button, [role="button"], summary, input:not([type=hidden]), select, textarea')].filter(el => shown(el) && !el.disabled && !inline(el) && el.getBoundingClientRect().width >= 4 && el.getBoundingClientRect().height >= 4);
  const layer = el => { for (let n = el; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return n; } return null; };
  const boxes = t.map(el => ({ el, r: el.getBoundingClientRect(), layer: layer(el) }));
  const out = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.el.contains(b.el) || b.el.contains(a.el) || a.layer !== b.layer) continue;
    const dx = Math.max(0, Math.max(a.r.left, b.r.left) - Math.min(a.r.right, b.r.right)), dy = Math.max(0, Math.max(a.r.top, b.r.top) - Math.min(a.r.bottom, b.r.bottom));
    const gap = dx && dy ? Math.hypot(dx, dy) : Math.max(dx, dy);
    if (gap < 7.5) out.push(`"${label(a.el)}" and "${label(b.el)}" are ${gap.toFixed(1)} px apart`);
  }
  return out;
}

/** Waits, up to four seconds, for every picture on the page to finish loading, so the picture checks measure real sizes
    (the pages are scrolled through first, which starts the lazy ones). Runs in the page. */
export function settleImages() {
  const waiting = [...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }));
  return Promise.race([Promise.all(waiting), new Promise(r => setTimeout(r, 4000))]).then(() => undefined);
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
