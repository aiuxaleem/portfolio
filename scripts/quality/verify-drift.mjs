// Drift check (Phase 15): values in the pages and components written during the rebuild that do not come from the token set.
// node scripts/quality/verify-drift.mjs   -> reports/verify/drift.json
// Scans the Astro pages, components, layouts and the stylesheets written for the rebuild. It does not scan the files
// carried over from the legacy design (tokens.css, base.css, utilities.css, site.css, legacy-shell.css, fonts.css, the
// snapshots) or the dev-only /_states page.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib.mjs';

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
const LEGACY_CSS = ['tokens.css', 'base.css', 'utilities.css', 'site.css', 'legacy-shell.css', 'fonts.css'];
const files = [...walk(path.join(ROOT, 'src/pages')), ...walk(path.join(ROOT, 'src/components')), ...walk(path.join(ROOT, 'src/layouts')), ...walk(path.join(ROOT, 'src/styles'))]
  .filter(f => /\.(astro|css)$/.test(f) && !LEGACY_CSS.includes(path.basename(f)));
const tokens = fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');
const defined = new Set([...tokens.matchAll(/--([\w-]+)\s*:/g)].map(m => m[1]));
for (const f of ['site.css', 'base.css', 'utilities.css', 'legacy-shell.css']) for (const m of fs.readFileSync(path.join(ROOT, 'src/styles', f), 'utf8').matchAll(/--([\w-]+)\s*:/g)) defined.add(m[1]);

const RULES = [
  ['hex colour', /(?<![&\w])#[0-9a-fA-F]{3,8}\b(?![^<]*<\/(?:title|text)>)/g, v => !/^#(main|contact|top|[a-z-]+)$/.test(v)],
  ['rgb or hsl colour', /\b(?:rgba?|hsla?)\([^)]*\)/g],
  ['named colour', /(?<=(?:color|background|background-color|border-color|fill|stroke)\s*:\s*)(?:white|black|red|blue|green|gray|grey)\b/g],
  ['font-size not from a token', /font-size\s*:(?!\s*(?:var\(|inherit|0\.9em|1em))[^;"}]+/g],
  ['font-family not from a token', /font-family\s*:(?!\s*(?:var\(|inherit))[^;"}]+/g],
  ['font-weight not from a token', /font-weight\s*:(?!\s*(?:var\(|inherit))[^;"}]+/g],
  ['line-height not from a token', /line-height\s*:(?!\s*(?:var\(|inherit))[^;"}]+/g],
  ['letter-spacing not from a token', /letter-spacing\s*:(?!\s*(?:var\(|inherit|normal))[^;"}]+/g],
  ['radius not from a token', /border(?:-[\w-]+)?-radius\s*:(?!\s*(?:var\(|inherit|0\b))[^;"}]+/g],
  ['shadow not from a token', /box-shadow\s*:(?!\s*(?:var\(|none|inherit))[^;"}]+/g],
  ['duration or easing not from a token', /transition(?:-duration|-timing-function)?\s*:\s*[^;"}]*?(?<![\w-])\d*\.?\d+m?s\b[^;"}]*/g],
  ['z-index not from a token', /z-index\s*:(?!\s*var\()[^;"}]+/g],
  ['spacing in px', /(?:^|[\s;{"])(?:margin|padding|gap|row-gap|column-gap|inset)(?:-[\w-]+)?\s*:\s*[^;"}]*\b\d+px[^;"}]*/g],
  ['physical property', /(?:^|[\s;{"])(?:margin|padding|border)-(?:left|right)(?:-[\w-]+)?\s*:|(?:^|[\s;{"])(?:left|right)\s*:\s*[^;"}]+|text-align\s*:\s*(?:left|right)/g],
  ['opacity used on text or content', /(?:^|[\s;{"])opacity\s*:\s*0?\.\d+/g],
  ['breakpoint not in the design', /@media[^{]*\((?:min|max)-width:\s*(?!640px|768px|1024px|1280px)\d+px\)/g],
  ['100vh', /\b100vh\b/g],
  ['outline: none', /outline\s*:\s*(?:none|0)\b/g],
  ['white-space: nowrap', /white-space\s*:\s*nowrap/g],
];
const out = { files: files.length, byRule: {}, unknownTokens: [] };
for (const f of files) { const src = fs.readFileSync(f, 'utf8'); const body = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/^---[\s\S]*?^---/m, m => (f.endsWith('.astro') ? m.replace(/\/\/[^\n]*/g, x => ' '.repeat(x.length)) : m));
  const line = i => body.slice(0, i).split('\n').length;
  for (const [name, re, keep] of RULES) for (const m of body.matchAll(re)) { const v = m[0].trim().replace(/^[;{"\s]+/, '').slice(0, 90); if (keep && !keep(v)) continue; (out.byRule[name] ||= []).push(`${rel(f)}:${line(m.index)}  ${v}`); }
  for (const m of body.matchAll(/var\(--([\w-]+)/g)) if (!defined.has(m[1]) && !['pos', 'dir-x'].includes(m[1])) out.unknownTokens.push(`${rel(f)}:${line(m.index)}  --${m[1]}`); }
out.unknownTokens = [...new Set(out.unknownTokens)];
fs.mkdirSync(path.join(ROOT, 'reports/verify'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/verify/drift.json'), JSON.stringify(out, null, 1));
console.log(`${files.length} files scanned`);
for (const [name] of RULES) { const list = out.byRule[name] || []; console.log(`\n${name}: ${list.length}`); const seen = {}; for (const x of list) { const v = x.split('  ')[1]; (seen[v] ||= []).push(x.split('  ')[0]); } for (const [v, where] of Object.entries(seen).slice(0, 12)) console.log(`   ${v}   (${where.length}x, e.g. ${where[0]})`); if (Object.keys(seen).length > 12) console.log(`   ... ${Object.keys(seen).length - 12} more distinct values`); }
console.log(`\ntokens used but not defined: ${out.unknownTokens.length}`); for (const t of out.unknownTokens.slice(0, 20)) console.log('   ' + t);
