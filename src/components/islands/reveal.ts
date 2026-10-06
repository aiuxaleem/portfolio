/* Scroll reveal: section heads, section bodies, card grids and closing panels fade up once as they scroll into view.
   Cards in a grid follow each other by one stagger step. Long reading text (article and case study bodies) is left alone.
   A block is hidden only while it is still below the screen and about to scroll in, never in the first view, so the
   first view and the LCP image are never touched and the page is not restyled as a whole when it loads.
   Does nothing under reduced motion. Styles: site.css ([data-reveal-state]). */
const BLOCKS = '[data-reveal], .page-section-head, .page-section-head ~ *, .resume-block, .project-related, .project-pager, .project-cta';
const GROUPS = '[data-reveal-group], ul:has(> li > .project-card), ul:has(> li > .video-card)';

if (matchMedia('(prefers-reduced-motion: no-preference)').matches && 'IntersectionObserver' in window) {
  const grouped = new Set<Element>();
  document.querySelectorAll(GROUPS).forEach(group => [...group.children].forEach(child => grouped.add(child)));
  const all = [...new Set<Element>([...document.querySelectorAll(BLOCKS), ...grouped])] as HTMLElement[];
  // A block inside another revealing block moves with it.
  const items = all.filter(el => !all.some(other => other !== el && other.contains(el)));
  const settle = (el: HTMLElement) => { delete el.dataset.revealState; el.style.removeProperty('--i'); };

  // Step 2: the block reaches the screen and fades up.
  const enter = new IntersectionObserver(entries => {
    const step = new Map<Element | null, number>();
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      enter.unobserve(el);
      if (grouped.has(el)) { const i = step.get(el.parentElement) ?? 0; step.set(el.parentElement, i + 1); el.style.setProperty('--i', String(i)); }
      el.dataset.revealState = 'in';
      // The state comes off when the fade ends, so the block's own hover transition applies again.
      el.addEventListener('transitionend', e => { if (e.target === el && e.propertyName === 'opacity') settle(el); });
      window.setTimeout(() => settle(el), 2000);
    }
  }, { rootMargin: '0px 0px -10% 0px' });

  // Step 1: the block comes within three quarters of a screen below the fold and is hidden while still out of sight.
  // A block that is already on screen (first view, or reached by a jump) is left as it is.
  const approach = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      approach.unobserve(el);
      if (entry.boundingClientRect.top <= innerHeight) continue;
      el.dataset.revealState = 'pending';
      enter.observe(el);
    }
  }, { rootMargin: '0px 0px 75% 0px' });
  for (const el of items) approach.observe(el);
}
