// The tool logos on the home page were loaded from cdn.simpleicons.org on every visit. This downloads each one once
// into public/assets/tools/ so the site makes no third-party request for them. The files are the same SVGs.
// node scripts/perf/fetch-icons.mjs   (run again only if the migrated home page gains a logo)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib.mjs';

const dir = path.join(ROOT, 'public/assets/tools'); fs.mkdirSync(dir, { recursive: true });
const snapshots = fs.readdirSync(path.join(ROOT, 'src/snapshots')).map(f => fs.readFileSync(path.join(ROOT, 'src/snapshots', f), 'utf8')).join('');
const urls = [...new Set([...snapshots.matchAll(/https:\/\/cdn\.simpleicons\.org\/([\w-]+)\/([0-9A-Fa-f]{6})/g)].map(m => m[0]))];
let bytes = 0;
for (const url of urls) { const [, slug, colour] = url.match(/org\/([\w-]+)\/(\w+)$/); const res = await fetch(url); if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const svg = await res.text(); if (!svg.includes('<svg')) throw new Error(`${url}: not an SVG`); fs.writeFileSync(path.join(dir, `${slug}-${colour.toLowerCase()}.svg`), svg); bytes += svg.length; }
console.log(`${urls.length} logos, ${(bytes / 1024).toFixed(1)} KB in public/assets/tools`);
