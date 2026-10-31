// Subsets the Arabic font files (CLAUDE.md 2.9: self-hosted, subset). Runs after fetch-fonts.mjs as part of npm run fonts;
// can also be run alone:  node scripts/perf/subset-fonts.mjs [--narrow-weights]
// Google serves each Arabic face as an "arabic" file that also carries the Arabic Presentation Forms (U+FB50-FDFF, U+FE70-FEFF),
// the Rumi and Coptic numerals and the Arabic mathematical alphabet: code points no keyboard produces and no browser needs
// for ordinary text, because the joined forms come from the font's own shaping rules, which are kept. Dropping them makes the
// IBM Plex Sans Arabic files 21 % smaller and the Noto Kufi Arabic file 37 % smaller, and every glyph that stays renders
// pixel for pixel as before (checked in headless Edge, 31 October 2026). Each new file gets a new content hash, and fonts.css
// and fonts.json are rewritten to point at it with the unicode-range the file now covers.
// --narrow-weights also limits a variable font's weight axis to the range its @font-face rule declares (Noto Kufi 700-800:
// 78 KB to 40 KB). That moves the font's default master, which re-rounds every outline: 29 to 55 pixels of a test page
// differ, so it is off until the owner approves the change (docs/VERIFICATION_REPORT.md, section 5).
// Needs Python with fonttools and brotli (pip install fonttools brotli); scripts/perf/subset-font.py does the cutting.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../lib.mjs';

const PY = process.env.PYTHON || 'python', dir = path.join(ROOT, 'public/fonts'), narrow = process.argv.includes('--narrow-weights');
const cssPath = path.join(ROOT, 'src/styles/fonts.css'), jsonPath = path.join(ROOT, 'src/styles/fonts.json');
/* Dropped: the Arabic Presentation Forms A and B, the Coptic epact and Rumi numerals and the Arabic mathematical alphabet.
   Everything else the file has stays: the Arabic blocks a keyboard can produce, the joining and direction controls, the space. */
const DROP = 'U+FB50-FDFF,U+FE70-FEFF,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EEFF';

const probe = spawnSync(PY, ['-I', '-c', 'import fontTools, brotli'], { encoding: 'utf8' });
if (probe.status !== 0) { console.error(`Python with fonttools and brotli is needed (pip install fonttools brotli):\n${probe.stderr || probe.error}`); process.exit(1); }

let css = fs.readFileSync(cssPath, 'utf8'), json = fs.readFileSync(jsonPath, 'utf8');
const rules = [...css.matchAll(/\/\* ([^*\n]+?), arabic \*\/\n@font-face \{[^}]*\}/g)];
if (!rules.length) { console.error('No "arabic" @font-face rule found in src/styles/fonts.css'); process.exit(1); }
let changed = 0;
for (const m of rules) {
  const rule = m[0], family = m[1];
  const file = rule.match(/url\(\/fonts\/([^)]+)\)/)[1], weights = rule.match(/font-weight: ([^;]+);/)[1].trim().split(/\s+/);
  const src = path.join(dir, file); if (!fs.existsSync(src)) throw new Error(`${file} is named in fonts.css but is not in public/fonts`);
  const tmp = path.join(dir, `.subset-${process.pid}.woff2`);
  const args = ['-I', path.join(ROOT, 'scripts/perf/subset-font.py'), src, tmp, DROP]; if (narrow && weights.length === 2) args.push(`${weights[0]}:${weights[1]}`);
  const r = spawnSync(PY, args, { encoding: 'utf8' });
  if (r.status !== 0) { fs.rmSync(tmp, { force: true }); throw new Error(`subsetting ${file} failed:\n${r.stderr}`); }
  const info = JSON.parse(r.stdout.trim().split('\n').pop());
  if (info.already) { fs.rmSync(tmp, { force: true }); console.log(`${file}: already subset (${(info.bytes / 1024).toFixed(1)} KB, ${info.glyphs} glyphs)`); continue; }
  const buf = fs.readFileSync(tmp);
  const name = `${file.replace(/\.[0-9a-f]{8}\.woff2$/, '')}.${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8)}.woff2`;
  const before = fs.statSync(src).size;
  fs.renameSync(tmp, path.join(dir, name)); fs.rmSync(src);
  const newRule = rule.replace(`url(/fonts/${file})`, `url(/fonts/${name})`).replace(/unicode-range: [^;]+;/, `unicode-range: ${info.ranges};`);
  css = css.replace(rule, newRule); json = json.split(file).join(name); changed++;
  fs.writeFileSync(cssPath, css); fs.writeFileSync(jsonPath, json); // after every file, so a failure part-way leaves the folder and the stylesheet in step
  console.log(`${family} ${weights.join('-')}: ${file} ${(before / 1024).toFixed(1)} KB -> ${name} ${(buf.length / 1024).toFixed(1)} KB (${Math.round(100 - buf.length * 100 / before)} % smaller), ${info.glyphs} glyphs, ${info.codePoints} code points`);
}
console.log(changed ? `${changed} file(s) subset; fonts.css and fonts.json updated.` : 'Nothing to do: every Arabic file is already subset.');
