/* The site's GSAP motion (owner, 1 November 2026: "improve interaction design of whole project … use the GSAP skill …
   scroll animation, text animation"; 5 November 2026: "a good animated front end with proper flow without affecting
   overall layout and experience"). One module for every public page, bundled with GSAP by scripts/perf/bundle-motion.mjs
   and fetched by the page head after the load event, on an idle moment, so it is never on the path to the first paint or
   the largest paint (the first view is CSS, motion.css). Built the way the GSAP skills describe: transforms and autoAlpha
   only, named eases, staggers instead of chained delays, gsap.matchMedia() for reduced motion, SplitText reverted once it
   has done its work.

   What animates, once, as it comes into view:
   - a section, as one piece: the overline slides in, the heading rises line by line out of masks (SplitText), the lead
     rises, and then the body that sits with the head (the first row of cards, tiles or rows) follows one after another; in the closing panel the buttons follow. A head on a dark panel brings the panel in with it. Anything further
     down the section reveals on its own as it is reached (islands/reveal.ts);
   - the big statement on Home (its heading, the same way);
   - the skills diagram: its four lines draw themselves from the centre;
   - the career: each company's line draws down as its roles rise in;
   - the names on the "worked with" band pop up one after another.
   A piece is hidden only while it is still below the screen and about to scroll in, never in the first view (the same
   rule as islands/reveal.ts, whose block fades stay for everything else; a block this script owns is marked
   data-motion-owned and reveal.ts leaves it, whichever of the two reached it first). A card's title is not a section
   head: cards reveal as cards. Long reading text (article and case study bodies, the resume) is left alone. When an
   animation ends, SplitText puts the heading's markup back and every element gets its authored style attribute back, so
   the DOM is as written for anything that reads it later (hover rules, the pointer effects, the checks).
   Only under (prefers-reduced-motion: no-preference): the head does not even fetch this file otherwise, and
   gsap.matchMedia() reverts everything if the setting changes while the page is open. The admin area is skipped.
   Durations and staggers are the motion tokens in motion.css, read at run time (--duration-reveal, --duration-enter,
   --stagger-line, --stagger-item); the eases are GSAP's named curves nearest the site's tokens (power4.out for
   --ease-out, back.out for the soft spring). */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

type El = HTMLElement;
const main = document.querySelector<El>('main');
const OWNED = 'data-motion-owned';
/* Reading text, cards (a card's heading is its title, not a section head) and the places where a heading must stay still. */
const LEAVE = '.prose, .post-body, .case-body, .case-section, .resume-block, .project-card, .embed-card, .video-card, form, .admin-app';

if (main && !document.querySelector('.admin-app, [data-admin-js]')) {
  gsap.registerPlugin(SplitText);
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => run(main));
}

function run(main: El) {
  const css = getComputedStyle(document.documentElement);
  const seconds = (name: string, fallback: number) => { const v = parseFloat(css.getPropertyValue(name)); return Number.isFinite(v) && v > 1 ? v / 1000 : fallback; };
  const D = { reveal: seconds('--duration-reveal', 0.8), enter: seconds('--duration-enter', 0.6), line: seconds('--stagger-line', 0.08), item: seconds('--stagger-item', 0.06) };
  const dir = css.direction === 'rtl' ? -1 : 1;
  const q = <T extends Element = El>(sel: string, from: ParentNode = main) => [...from.querySelectorAll<T>(sel)];
  const visible = (el: Element) => !el.closest('[hidden], .cory-visually-hidden') && (el as El).getBoundingClientRect().height > 0;
  /* A card in a grid also leans in with the scroll (motion.css, lean-l and lean-r, where the browser has view timelines):
     here it only fades, so the two never pull it in different directions. */
  const leans = CSS.supports('animation-timeline: view()');

  /* Every element animated here gets its authored style attribute back when its animation ends. */
  const authored = new Map<El, string | null>();
  const keep = (els: El[]) => els.forEach(el => { if (!authored.has(el)) authored.set(el, el.getAttribute('style')); });
  const restore = (els: El[]) => els.forEach(el => { if (!authored.has(el)) return; const s = authored.get(el); if (s === null || s === undefined) el.removeAttribute('style'); else el.setAttribute('style', s); authored.delete(el); });

  /* A heading's lines. The split is made at once (so the lines can be hidden while still out of sight); the tween starts
     on play(). autoSplit re-splits when the web font arrives or the width changes, and GSAP carries the tween's progress
     over. When the tween ends the markup is put back. */
  function textLines(el: El, vars: gsap.TweenVars, onDone?: () => void) {
    let current: gsap.core.Tween | undefined, started = false, finished = false;
    const finish = () => { if (finished) return; finished = true; onDone?.(); };
    const make = (targets: Element[] | El, revert?: () => void) => (current = gsap.from(targets, { ...vars, paused: !started, onComplete: () => { revert?.(); finish(); } }));
    try {
      SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'motion-line', autoSplit: true, aria: 'auto', onSplit: self => make(self.lines, () => self.revert()) });
    } catch { make(el); }
    return { play: () => { started = true; current?.play(); }, skip: () => { started = true; current?.progress(1); } };
  }

  type Target = { prep: () => void; play: (skip: boolean) => void };
  const targets = new Map<Element, Target>();
  /* Owning a block: reveal.ts leaves it from here on, and any state it set before this module arrived is dropped. */
  const own = (els: (Element | null | undefined)[]) => els.forEach(el => { if (!el) return; el.setAttribute(OWNED, ''); el.removeAttribute('data-reveal-state'); (el as El).style.removeProperty('--i'); });
  const taken = (el: Element) => el.hasAttribute(OWNED) || !!el.querySelector(`[${OWNED}]`) || !!el.closest(`[${OWNED}]`);

  /* The skills diagram: its four lines draw themselves from the centre as the card comes into view. */
  for (const svg of new Set(q<SVGElement>('[data-core-link]').map(p => p.closest('svg')!))) {
    const paths = q<SVGPathElement>('[data-core-link]', svg), tile = (svg.closest('li') || svg.parentElement) as El;
    const length = (p: SVGPathElement) => parseFloat(p.style.strokeDasharray || '140') || 140;
    let tl: gsap.core.Timeline | undefined;
    own([tile]);
    targets.set(tile, {
      prep() { paths.forEach(p => p.style.setProperty('--core-draw', String(length(p)))); tl = gsap.timeline({ paused: true, onComplete: () => paths.forEach(p => p.style.removeProperty('--core-draw')) }); tl.to(paths, { '--core-draw': 0, duration: D.reveal, stagger: 0.12, ease: 'power2.inOut' }, 0.2); },
      play(skip) { skip ? tl?.progress(1) : tl?.play(); },
    });
  }

  /* The career: each company's line draws down as its roles rise in. */
  for (const company of q('.career-company')) {
    const list = company.closest('.career') as El | null; own([list, company]);
    const children = ([...company.children] as El[]).filter(visible);
    let tl: gsap.core.Timeline | undefined;
    targets.set(company, {
      prep() { keep([company, ...children]); tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: () => restore([company, ...children]) }); tl.set(company, { '--draw': 0 }, 0).to(company, { '--draw': 1, duration: D.reveal, ease: 'power2.inOut' }, 0).from(children, { autoAlpha: 0, y: 16, duration: D.enter, stagger: D.item }, 0.15); },
      play(skip) { skip ? tl?.progress(1) : tl?.play(); },
    });
  }

  /* The names on the "worked with" band pop up one after another. */
  for (const band of q('[data-section] [aria-hidden="true"] [data-reveal]').filter(el => el.children.length > 2)) {
    const names = [...band.children] as El[]; own([band]);
    let tl: gsap.core.Timeline | undefined;
    targets.set(band, {
      prep() { keep(names); tl = gsap.timeline({ paused: true, onComplete: () => restore(names) }); tl.from(names, { autoAlpha: 0, y: 18, scale: 0.94, duration: D.enter, stagger: D.item, ease: 'back.out(1.4)' }); },
      play(skip) { skip ? tl?.progress(1) : tl?.play(); },
    });
  }

  /* A section's head and the body that sits with it, as one piece: the overline slides in, the heading's lines rise out
     of their masks, the lead rises, then the body follows item by item; in the closing panel the buttons follow. The h2's
     parent is the head (a .page-section-head, or the div that holds the heading on the pages carried over from the
     design). The body is what comes after the head up to the next heading, taken item by item when it is a list, and only
     as far as six tenths of a screen below the head (the first row): anything further reveals on its own as it is reached
     (islands/reveal.ts), and a
     block another piece here owns (the career, the band, the diagram) keeps its own motion. A head that sits on its own
     surface (the closing panel) brings the surface in with it. */
  const LIST = 'ul, ol, [data-reveal-group], [data-cq-grid], [data-cq-balance]';
  for (const h2 of q('h2')) {
    if (h2.closest(`${LEAVE}, li`) || !h2.parentElement || h2.parentElement === main) continue;
    const box = h2.parentElement as El;
    if (box.hasAttribute(OWNED)) continue;
    const overline = ([...box.children] as El[]).find(el => el.matches('.cory-overline'));
    const leads = ([...box.children] as El[]).filter(el => el !== h2 && el !== overline && el.matches('p') && visible(el));
    const ctas = box.matches('[data-closing] *, .contact-block, [data-contact]') ? q('a, button', box.querySelector('[data-cta-row]') || document.createElement('div')) : [];
    const style = getComputedStyle(box);
    const panel = style.backgroundImage !== 'none' || !/^(rgba\(0, 0, 0, 0\)|transparent)$/.test(style.backgroundColor);
    /* The first row or so: within six tenths of a screen of the head. Further rows cascade on their own as they are reached, so
       a row the visitor has not scrolled to yet is never played out of sight. */
    const limit = box.getBoundingClientRect().top + innerHeight * 0.6;
    const body: El[] = [];
    for (let el = box.nextElementSibling as El | null; el && !el.matches('h2') && !el.querySelector('h2'); el = el.nextElementSibling as El | null) {
      if (el.matches('noscript, script, style, template, [aria-hidden="true"]') || el.closest(LEAVE) || taken(el) || !visible(el)) continue;
      const list = el.matches(LIST) ? el : el.querySelector<El>(`:scope > :is(${LIST}), :scope > * > :is(${LIST})`);
      const items = list && list.children.length > 1 ? ([...list.children] as El[]) : [el];
      for (const item of items) if (!taken(item) && visible(item) && item.getBoundingClientRect().top < limit) body.push(item);
    }
    own([box, h2, overline, ...leads, ...body]);
    let tl: gsap.core.Timeline | undefined, text: ReturnType<typeof textLines> | undefined;
    const els = [box, h2, ...(overline ? [overline] : []), ...leads, ...ctas, ...body];
    targets.set(box, {
      prep() {
        keep(els);
        tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: () => restore(els.filter(el => el !== h2)) });
        if (panel) tl.from(box, { autoAlpha: 0, y: 24, duration: D.enter }, 0);
        if (overline) tl.from(overline, { autoAlpha: 0, x: -24 * dir, duration: D.enter }, 0);
        text = textLines(h2, { yPercent: 110, autoAlpha: 0, duration: D.reveal, stagger: D.line, ease: 'power4.out', delay: overline ? 0.12 : 0 }, () => restore([h2]));
        if (leads.length) tl.from(leads, { autoAlpha: 0, y: 16, duration: D.enter, stagger: D.item }, 0.3);
        if (ctas.length) tl.from(ctas, { autoAlpha: 0, y: 16, duration: D.enter, stagger: D.item }, 0.45);
        if (body.length) tl.from(body, { autoAlpha: 0, y: (i: number) => leans && body[i].matches(':has(> .project-card)') ? 0 : 20, duration: D.enter, stagger: D.item }, 0.5);
      },
      play(skip) { if (skip) { tl?.progress(1); text?.skip(); } else { tl?.play(); text?.play(); } },
    });
  }

  /* Step 2: the block reaches the screen (or was jumped past) and plays. The root reaches far above the screen, so a
     block the visitor jumped past with a link in the page is finished at once rather than left hidden. */
  const enter = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      enter.unobserve(entry.target);
      targets.get(entry.target)?.play(entry.boundingClientRect.bottom < 0);
    }
  }, { rootMargin: '400% 0px -10% 0px' });
  /* Step 1: the block comes within three quarters of a screen below the fold and is hidden while still out of sight.
     A block already on screen (the first view, a jump) is left as it is. */
  const approach = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      approach.unobserve(entry.target);
      if (entry.boundingClientRect.top <= innerHeight) continue;
      targets.get(entry.target)?.prep();
      enter.observe(entry.target);
    }
  }, { rootMargin: '0px 0px 75% 0px' });
  for (const el of targets.keys()) approach.observe(el);

  return () => { approach.disconnect(); enter.disconnect(); };
}
