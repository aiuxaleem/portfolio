// Font swap check: Work, Writing and Blog laid out with the web font blocked and with it loaded, at ten widths.
// A view whose layout differs will shift when the font arrives. node scripts/motion/font-swap.mjs (after a production build)
import { serve, launch } from '../lib.mjs';
const server = await serve('dist', 4450), browser = await launch(); let bad = 0;
for (const route of ['/work', '/writing', '/blog']) for (const w of [320, 360, 390, 412, 414, 640, 768, 844, 1024, 1280]) { const r = {}; for (const mode of ['fallback', 'webfont']) { const ctx = await browser.newContext({ viewport: { width: w, height: 823 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); if (mode === 'fallback') await p.route('**/*.woff2', x => x.abort()); await p.goto('http://127.0.0.1:4450' + route, { waitUntil: 'load' }); await p.waitForTimeout(350);
  r[mode] = await p.evaluate(() => [...document.querySelectorAll('.project-filter-group, .post-tags, .project-filters')].map(g => Math.round(g.getBoundingClientRect().height)).join('/') + ' | page ' + [...document.querySelectorAll('main h1, main ul, main .project-filter-count')].map(e => Math.round(e.getBoundingClientRect().top + scrollY)).slice(0, 4).join(',')); await ctx.close(); }
  const same = r.fallback === r.webfont; if (!same) bad++; console.log(route.padEnd(9), String(w).padEnd(5), same ? 'same' : 'DIFFERENT', same ? r.webfont : `fallback ${r.fallback} | webfont ${r.webfont}`); }
console.log(bad ? `${bad} views shift when the font arrives` : 'no view shifts when the font arrives'); await browser.close(); server.close();
