/* Section drawings that play in every browser (owner request, 27 November 2026, L-93: animated infographics that work in
   all browsers and devices). Until now a strip drew on a CSS scroll timeline, which only Chromium runs, so Safari and
   Firefox showed it still. Here an IntersectionObserver marks a drawing [data-play] once a third of it is on screen, and
   motion.css plays a timed sequence: the shapes settle, the lines draw, the ticks check in order, then a pulse runs once
   along each flow (SVG animateMotion, which every browser runs). It ends within four seconds, since nothing on the site
   moves for more than five unless the visitor is interacting; pointing at or focusing the section plays it again.
   Motion on (html[data-motion="on"]): the full sequence. Fade mode: the drawing fades in. Reduced motion in an automated
   browser (no data-motion): nothing runs and the drawing stays as authored, which is how every check sees it. */
const SVG = 'http://www.w3.org/2000/svg';
const mode = document.documentElement.getAttribute('data-motion');
const LIMIT = 4000;

function prepare(art: HTMLElement) {
  const svg = art.querySelector('svg');
  if (!svg) return;
  if (mode === 'on') {
    /* Ticks and accent lines with no order of their own join the drawing after the ordered pieces. */
    const ordered = [...svg.querySelectorAll<SVGElement>('[data-draw], [data-pop]')].map(e => parseInt(e.style.getPropertyValue('--art-i'), 10) || 0);
    let next = (ordered.length ? Math.max(...ordered) : 0) + 1;
    svg.querySelectorAll<SVGElement>('path.pa-ok:not([data-draw]), path.pa-accent:not([data-draw]):not(.pa-loop)').forEach(el => {
      el.setAttribute('pathLength', '1');
      el.setAttribute('data-draw', '');
      el.style.setProperty('--art-i', String(next++));
    });
    /* One pulse along each of up to three flows: accent paths long enough to carry one. It is invisible until it runs. */
    let pulses = 0;
    svg.querySelectorAll<SVGPathElement>('path.pa-accent').forEach(path => {
      const d = path.getAttribute('d');
      if (!d || pulses >= 3) return;
      let length = 0;
      try { length = path.getTotalLength(); } catch { return; }
      if (length < 40) return;
      const dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('r', '4');
      dot.setAttribute('class', 'pa-pulse');
      dot.setAttribute('opacity', '0');
      const move = document.createElementNS(SVG, 'animateMotion');
      move.setAttribute('path', d); move.setAttribute('dur', '1.1s'); move.setAttribute('begin', 'indefinite'); move.setAttribute('fill', 'remove');
      const show = document.createElementNS(SVG, 'animate');
      show.setAttribute('attributeName', 'opacity'); show.setAttribute('values', '0;1;1;0'); show.setAttribute('keyTimes', '0;0.15;0.8;1');
      show.setAttribute('dur', '1.1s'); show.setAttribute('begin', 'indefinite'); show.setAttribute('fill', 'remove');
      dot.append(move, show);
      svg.append(dot);
      pulses++;
    });
  }
  art.setAttribute('data-art', 'ready');
}

function play(art: HTMLElement) {
  if (art.dataset.playing) return;
  art.dataset.playing = '1';
  art.removeAttribute('data-play');
  void art.offsetWidth; // restart the CSS animations
  art.setAttribute('data-play', '');
  if (mode === 'on') {
    art.querySelectorAll<SVGElement>('.pa-pulse').forEach((dot, n) => {
      window.setTimeout(() => dot.querySelectorAll<SVGAnimationElement>('animate, animateMotion').forEach(a => { try { a.beginElement(); } catch { /* an old engine without SMIL keeps the drawing still */ } }), 1500 + n * 350);
    });
  }
  window.setTimeout(() => { delete art.dataset.playing; }, LIMIT);
}

if ((mode === 'on' || mode === 'fade') && 'IntersectionObserver' in window) {
  const arts = [...document.querySelectorAll<HTMLElement>('.section-art')];
  arts.forEach(prepare);
  const seen = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    seen.unobserve(e.target);
    play(e.target as HTMLElement);
  }), { threshold: 0.35 });
  arts.forEach(art => {
    seen.observe(art);
    /* Pointing at or focusing the section's head plays the drawing again, once it has finished. */
    if (mode !== 'on') return;
    const head = art.parentElement;
    if (!head) return;
    const again = () => { if (art.hasAttribute('data-play')) play(art); };
    head.addEventListener('pointerenter', again);
    head.addEventListener('focusin', again);
  });
}

export {};
