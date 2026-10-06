// Reports files and CSS that nothing uses. It only reports; removal is a separate, reviewed step.
// node scripts/perf/unused.mjs [--remove-css]   (run after a quality build, so dist/ includes /_states and the fixture pages)
// --remove-css deletes the unused rules it found from the stylesheets; check the visual diff afterwards.
//  - files in public/ and src/assets/ that no source file and no built page names
//  - snapshots that no page imports
//  - CSS rules whose class names and data attributes appear nowhere outside the stylesheets
//  - packages in package.json that no source, script or config file imports
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib.mjs';

const walk = d => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
const read = f => fs.readFileSync(f, 'utf8');
const TEXT = /\.(astro|ts|mjs|js|json|mdx|md|yaml|css|html|xml|txt)$/;
const src = walk(path.join(ROOT, 'src')).filter(f => TEXT.test(f));
const dist = walk(path.join(ROOT, 'dist')).filter(f => /\.(html|css|js|xml)$/.test(f));
const config = ['astro.config.mjs', 'keystatic.config.ts', 'package.json', 'vercel.json'].map(f => path.join(ROOT, f)).filter(fs.existsSync);
const scripts = walk(path.join(ROOT, 'scripts'));
const haystack = [...src, ...dist, ...config].map(f => ({ f: rel(f), s: read(f) }));
const named = (needle, skip = () => false) => haystack.some(h => !skip(h.f) && h.s.includes(needle));
const kb = f => +(fs.statSync(f).size / 1024).toFixed(1);
const out = {};

/* Used without being named in full: the certificate dialog builds the full-size path from the thumbnail path, and the
   fonts are named by the generated stylesheet (which is not in the search list as a source of truth for itself). */
const DYNAMIC = [/^\/assets\/certs\/full\//];
out.publicFiles = walk(path.join(ROOT, 'public')).filter(f => { const p = '/' + path.relative(path.join(ROOT, 'public'), f).replace(/\\/g, '/'); const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(`(?<!\\.\\.)(${esc(p)}|${esc(encodeURI(p))})`);
  return !DYNAMIC.some(d => d.test(p)) && !haystack.some(h => re.test(h.s)) && !/^\/(robots\.txt|favicon\.ico)$/.test(p); }).map(f => `${rel(f)} (${kb(f)} KB)`);
out.srcAssets = walk(path.join(ROOT, 'src/assets')).filter(f => !named(path.basename(f), f => f.startsWith('dist/'))).map(f => `${rel(f)} (${kb(f)} KB)`);
out.snapshots = walk(path.join(ROOT, 'src/snapshots')).filter(f => !src.some(s => !s.includes('snapshots') && read(s).includes(`snapshots/${path.basename(f)}`))).map(f => `${rel(f)} (${kb(f)} KB)`);

// CSS: a rule is unused when every selector in it needs a class or data attribute that appears in no template, script,
// snapshot or built page. Rules that only use element names, pseudo-classes or attributes set by scripts are kept.
const outside = [...src.filter(f => !f.endsWith('.css')), ...dist.filter(f => f.endsWith('.html')), ...walk(path.join(ROOT, 'src/components/islands'))].map(read).join('\n');
/* A data attribute may be set from a script as dataset.someName, so its camel-case name counts as a use. */
const camel = id => id.replace(/^data-/, '').replace(/-(\w)/g, (_, c) => c.toUpperCase());
const has = new Map(); const known = id => { if (!has.has(id)) has.set(id, outside.includes(id) || (id.startsWith('data-') && new RegExp(`dataset\\.${camel(id)}\\b`).test(outside))); return has.get(id); };
out.css = {};
for (const file of walk(path.join(ROOT, 'src/styles')).filter(f => f.endsWith('.css'))) {
  const raw = read(file), css = raw.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)); const dead = [], spans = []; let bytes = 0;
  for (const m of css.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{([^{}]*)\}/g)) {
    const selectors = m[2].split(',').map(s => s.trim()).filter(Boolean);
    if (!selectors.length || /^(from|to|\d+%)/.test(selectors[0])) continue;
    const need = sel => [...sel.matchAll(/\.([\w-]+)/g)].map(x => x[1]).concat([...sel.matchAll(/\[(data-[\w-]+)/g)].map(x => x[1]));
    if (selectors.every(sel => { const ids = need(sel); return ids.length > 0 && ids.some(id => !known(id)); })) { dead.push(m[2].replace(/\s+/g, ' ').slice(0, 110)); const start = m.index + m[1].length; spans.push([start, m.index + m[0].length]); bytes += m[0].length - m[1].length; }
  }
  if (dead.length) out.css[rel(file)] = { rules: dead.length, bytes, selectors: dead };
  if (dead.length && process.argv.includes('--remove-css')) { let next = raw; for (const [a, b] of spans.reverse()) next = next.slice(0, a) + next.slice(b); fs.writeFileSync(file, next.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n')); }
}

const pkg = JSON.parse(read(path.join(ROOT, 'package.json')));
const code = [...src, ...scripts, ...config.filter(f => !f.endsWith('package.json'))].map(read).join('\n');
/* Needed without an import statement: the font packages are read by path when share images are drawn, react-dom is the
   editor's peer dependency, and typescript and @astrojs/check are what `astro check` runs. */
const IMPLICIT = ['@fontsource/jetbrains-mono', '@fontsource/plus-jakarta-sans', 'react-dom', '@astrojs/check', 'typescript'];
out.packages = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter(name => !IMPLICIT.includes(name) && !code.includes(`'${name}`) && !code.includes(`"${name}`) && !code.includes(`@fontsource', '${name.replace('@fontsource/', '')}`) && !code.includes(`${name}/`));

fs.mkdirSync(path.join(ROOT, 'reports/perf'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports/perf/unused.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, css: Object.fromEntries(Object.entries(out.css).map(([f, v]) => [f, `${v.rules} rules, ${v.bytes} bytes`])) }, null, 1));
