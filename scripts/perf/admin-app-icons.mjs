// The admin area can be installed as a small app on a phone (so the LinkedIn app's share sheet can send a post to it,
// docs/LINKEDIN_CAPTURE.md). An installed app needs icons as PNG files: these are the site's own mark
// (public/assets/favicon.svg) drawn at the two sizes the manifest names, plus a full-bleed one for Android's adaptive
// icon mask. Run again only when the mark changes:
//   node scripts/perf/admin-app-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { ROOT } from '../lib.mjs';

const mark = fs.readFileSync(path.join(ROOT, 'public/assets/favicon.svg'), 'utf8').replace(/<metadata>[\s\S]*?<\/metadata>/, '');
const out = path.join(ROOT, 'public/assets/admin');
fs.mkdirSync(out, { recursive: true });
const render = (svg, size, file) => { const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng(); fs.writeFileSync(path.join(out, file), png); console.log(`${file}: ${size}x${size}, ${png.length} bytes`); };
/* "any": the rounded mark as it is. */
render(mark, 192, 'icon-192.png');
render(mark, 512, 'icon-512.png');
/* "maskable": the gradient fills the whole square, so whatever shape the launcher cuts out is all mark and no corner. */
render(mark.replace(/rx="[\d.]+"/, 'rx="0"'), 512, 'icon-512-maskable.png');
