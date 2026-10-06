// GitHub Pages project sites live under a folder (https://<account>.github.io/<repository>/), but the site is written for
// the root of a domain. This rewrites a finished build so every internal address carries the folder.
// node scripts/pages/apply-base.mjs --base=/portfolio --origin=https://aiuxaleem.github.io [--dir=dist]
// Run it after `astro build`. It changes files in the build folder only.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, arg } from '../lib.mjs';

/* The folder may be given with or without its leading slash (some Windows shells rewrite an argument that starts with one). */
const base = '/' + String(arg('base', '')).replace(/^\/+|\/+$/g, '');
const origin = String(arg('origin', '')).replace(/\/$/, '');
const dir = path.resolve(ROOT, String(arg('dir', 'dist')));
if (!/^\/[\w-]+$/.test(base) || !/^https:\/\/[\w.-]+$/.test(origin)) throw new Error('Pass --base=/folder and --origin=https://host');

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
// A root-relative address that is not already under the folder and is not protocol-relative (//host).
const local = u => u.startsWith('/') && !u.startsWith('//') && u !== base && !u.startsWith(base + '/');
const fix = u => (local(u) ? base + u : u);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Full addresses on this host, in canonical links, share images, structured data, the sitemap and the feeds.
const absolute = text => text.replace(new RegExp(esc(origin) + '(?!' + esc(base) + '(?:/|["\'<\\s?#]|$))(?=/|["\'<\\s?#]|$)', 'g'), origin + base);
const cssUrls = text => text.replace(/url\(\s*(['"]?)(\/[^)'"]*)\1\s*\)/g, (m, q, u) => `url(${q}${fix(u)}${q})`);

const counts = { html: 0, css: 0, js: 0, other: 0, links: 0 };
for (const file of walk(dir)) {
  const ext = path.extname(file).toLowerCase();
  if (!['.html', '.css', '.js', '.xml', '.txt', '.json', '.webmanifest'].includes(ext)) continue;
  const before = fs.readFileSync(file, 'utf8'); let text = before;
  if (ext === '.html') {
    // Attributes that hold one address.
    text = text.replace(/(\s(?:href|src|poster|action|data-embed-poster|data-full|data-src)=)(["'])([^"']*)\2/g, (m, a, q, u) => { const v = fix(u); if (v !== u) counts.links++; return a + q + v + q; });
    // A page that has moved leaves a stub that sends the visitor on: <meta http-equiv="refresh" content="0;url=/read">.
    text = text.replace(/(<meta http-equiv="refresh" content="\d+;\s*url=)([^"]*)"/gi, (m, a, u) => { const v = fix(u); if (v !== u) counts.links++; return a + v + '"'; });
    // srcset and imagesrcset hold a comma-separated list.
    text = text.replace(/(\s(?:srcset|imagesrcset)=)(["'])([^"']*)\2/g, (m, a, q, list) => a + q + list.split(',').map(part => { const t = part.trim(); const [u, ...rest] = t.split(/\s+/); return [fix(u), ...rest].join(' '); }).join(', ') + q);
    // Inline stylesheets and style attributes.
    text = cssUrls(text);
    // Bundled scripts imported by path.
    text = text.replace(/(["'`])\/_astro\//g, `$1${base}/_astro/`);
    text = absolute(text); counts.html++;
  } else if (ext === '.css') { text = cssUrls(text); counts.css++; }
  else if (ext === '.js') { text = text.replace(/(["'`])\/_astro\//g, `$1${base}/_astro/`); counts.js++; }
  else { text = absolute(text); counts.other++; }
  if (text !== before) fs.writeFileSync(file, text);
}
console.log(`base ${base} applied in ${path.relative(ROOT, dir)}: ${counts.html} pages (${counts.links} links and sources), ${counts.css} stylesheets, ${counts.js} scripts, ${counts.other} feeds and data files`);
