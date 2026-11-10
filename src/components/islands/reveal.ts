/* Scroll reveal: section heads, section bodies, card grids and closing panels fade up once as they scroll into view.
   The items of a grid or a list (cards, tiles, rows, the footer's columns) follow each other by one stagger step, and a
   block that holds such items gives way to them, so a list always cascades rather than arriving as one slab. Long reading
   text (article and case study bodies) is left alone.
   A block is hidden only while it is still below the screen and about to scroll in, never in the first view, so the
   first view and the LCP image are never touched and the page is not restyled as a whole when it loads.
   Under reduced motion it runs as fades only (the head script sets html[data-motion="fade"]; site.css then transitions
   opacity alone and the rise distance is 0), and not at all in an automated browser under reduced motion, where the
   page must stay as authored. Styles: site.css ([data-reveal-state]).
   A block that islands/motion.ts animates itself (a section head with the body that sits with it, the career, the names
   on the "worked with" band) is marked data-motion-owned and left alone here, whether it was marked before this ran or
   after (the module arrives after the load event), so no element is moved by both. */
const BLOCKS = '[data-reveal], .page-section-head, .page-section-head ~ *, .resume-block, .project-related, .project-pager, .project-cta';
const GROUPS = '[data-reveal-group], :is(ul, ol):has(> li > :is(.project-card, .video-card, .embed-card, .tile, .cert-name, [data-project])), :is(ul, ol):has(> li > div > :is(.project-card, .embed-card)), .articles-rest, .sitemap-list, .cert-list, .footer-columns';
const OWNED = 'data-motion-owned';

const mode = document.documentElement.getAttribute('data-motion');
if ((mode === 'on' || mode === 'fade') && 'IntersectionObserver' in window) {
  const grouped = new Set<Element>();
  document.querySelectorAll(GROUPS).forEach(group => [...group.children].forEach(child => grouped.add(child)));
  const blocks = [...document.querySelectorAll(BLOCKS)].filter(b => ![...grouped].some(g => b.contains(g)));
  const all = [...new Set<Element>([...blocks, ...grouped])].filter(el => !el.hasAttribute(OWNED)) as HTMLElement[];
  // A block inside another revealing block moves with it.
  const items = all.filter(el => !all.some(other => other !== el && other.contains(el)));
  const settle = (el: HTMLElement) => { pending.delete(el); delete el.dataset.revealState; delete el.dataset.revealLean; delete el.dataset.revealSide; el.style.removeProperty('--i'); };
  const pending = new Set<HTMLElement>();

  // Step 2: the block reaches the screen and fades up.
  const reveal = (el: HTMLElement, i = 0) => {
    pending.delete(el); enter.unobserve(el);
    if (el.hasAttribute(OWNED)) { settle(el); return; }
    if (grouped.has(el)) el.style.setProperty('--i', String(i));
    el.dataset.revealState = 'in';
    // The state comes off when the fade ends, so the block's own hover transition applies again.
    el.addEventListener('transitionend', e => { if (e.target === el && e.propertyName === 'opacity') settle(el); });
    window.setTimeout(() => settle(el), 2000);
  };
  const enter = new IntersectionObserver(entries => {
    const step = new Map<Element | null, number>();
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      const i = grouped.has(el) ? step.get(el.parentElement) ?? 0 : 0; if (grouped.has(el)) step.set(el.parentElement, i + 1);
      reveal(el, i);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  /* The safety net (L-61): an observer reports a block only when it crosses into the screen between two frames, so a fast
     scroll can carry a hidden block from below the screen to above it unseen, and it would stay hidden. While any block is
     pending, each scroll checks that small set once a frame: a block on screen fades in, a block already above is shown. */
  let queued = false;
  const sweep = () => {
    queued = false;
    for (const el of [...pending]) { const r = el.getBoundingClientRect(); if (r.bottom <= 0) settle(el); else if (r.top < innerHeight * 0.9) reveal(el); }
  };
  addEventListener('scroll', () => { if (pending.size && !queued) { queued = true; requestAnimationFrame(sweep); } }, { passive: true });

  // Step 1: the block comes within three quarters of a screen below the fold and is hidden while still out of sight.
  // A block that is already on screen (first view, or reached by a jump) is left as it is.
  const approach = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      approach.unobserve(el);
      if (el.hasAttribute(OWNED) || entry.boundingClientRect.top <= innerHeight) continue;
      el.dataset.revealState = 'pending';
      // A card in a grid leans in with the scroll (motion.css): the fade then adds no second rise.
      if (el.firstElementChild?.matches('.project-card')) el.dataset.revealLean = '';
      // The two halves of a split section come from their own sides (site.css, data-reveal-side); nothing else moves sideways.
      const parent = el.parentElement;
      if (parent?.matches('.cory-split, [data-case-grid], [data-cq-aside]') && parent.children.length === 2) el.dataset.revealSide = parent.firstElementChild === el ? 'start' : 'end';
      pending.add(el);
      enter.observe(el);
    }
  }, { rootMargin: '0px 0px 75% 0px' });
  for (const el of items) approach.observe(el);
}
