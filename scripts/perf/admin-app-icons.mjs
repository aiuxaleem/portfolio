// The admin area can be installed as a small app on a phone (so the LinkedIn app's share sheet can send a post to it,
// docs/LINKEDIN_CAPTURE.md). An installed app needs icons as PNG files: these are the brand kit's mark (L-67): the rounded
// favicon (public/aleem-favicon.svg) at the two sizes the manifest names, and the kit's full-bleed app icon for Android's
// adaptive icon mask. Run again only when the mark changes:
//   node scripts/perf/admin-app-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { ROOT } from '../lib.mjs';

const mark = fs.readFileSync(path.join(ROOT, 'public/aleem-favicon.svg'), 'utf8');
const square = fs.readFileSync(path.join(ROOT, 'Aleem-Brand-Kit/Aleem-Brand-Kit/02-Favicon-and-app-icons/aleem-app-icon.svg'), 'utf8');
const out = path.join(ROOT, 'public/assets/admin');
fs.mkdirSync(out, { recursive: true });
const render = (svg, size, file) => { const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng(); fs.writeFileSync(path.join(out, file), png); console.log(`${file}: ${size}x${size}, ${png.length} bytes`); };
/* "any": the rounded mark as it is. */
render(mark, 192, 'icon-192.png');
render(mark, 512, 'icon-512.png');
/* "maskable": the kit's square app icon, navy to every edge, so whatever shape the launcher cuts out is all mark and no corner. */
render(square, 512, 'icon-512-maskable.png');
