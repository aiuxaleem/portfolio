// Bundles the motion script (src/components/islands/motion.ts, GSAP included) into public/_m/motion.<hash>.js and writes
// its address to src/components/islands/motion.json, which the page head reads (layouts/base-layout.astro).
// Why not an Astro <script>: Astro places every processed script at the end of the body, and a script named with ?url is
// copied as the raw TypeScript file. In the head, with a modulepreload link, the file is fetched with the fonts and runs
// as soon as the page is parsed, so the first view starts at the first paint. Runs before every build and dev start
// (package.json prebuild and predev); run it by hand after editing motion.ts while `npm run dev` is up:
//   node scripts/perf/bundle-motion.mjs
// The output and the JSON are committed, so a checkout works without this step; the hash changes only when the bundle does.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import { ROOT } from '../lib.mjs';

const entry = path.join(ROOT, 'src/components/islands/motion.ts'), dir = path.join(ROOT, 'public/_m'), json = path.join(ROOT, 'src/components/islands/motion.json');
const result = await build({ entryPoints: [entry], bundle: true, minify: true, format: 'esm', target: ['es2022'], write: false, legalComments: 'none', logLevel: 'error' });
const code = result.outputFiles[0].contents;
const name = `motion.${crypto.createHash('sha1').update(code).digest('hex').slice(0, 8)}.js`;
fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir)) if (/^motion\.[0-9a-f]{8}\.js$/.test(f) && f !== name) fs.rmSync(path.join(dir, f));
const file = path.join(dir, name);
const same = fs.existsSync(file) && fs.readFileSync(file).equals(Buffer.from(code));
if (!same) fs.writeFileSync(file, code);
const url = `/_m/${name}`;
if (!fs.existsSync(json) || JSON.parse(fs.readFileSync(json, 'utf8')).url !== url) fs.writeFileSync(json, JSON.stringify({ url }, null, 2) + '\n');
console.log(`${same ? 'unchanged' : 'written'}: ${url} (${(code.length / 1024).toFixed(1)} KB)`);
