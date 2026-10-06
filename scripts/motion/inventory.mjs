// Motion inventory (Phase 17, audit): every transition, animation and keyframe rule in the source, with its trigger,
// properties, duration, easing, file and line; plus what scripts do to move things.
// node scripts/motion/inventory.mjs   -> reports/motion/inventory.json and a table on the console
// Reads source only. Changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib.mjs';

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
const tokensCss = fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');
const tokenValue = name => { const m = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`)); return m ? m[1].trim().replace(/\s*\/\*.*$/, '') : '?'; };
const resolve = v => v.replace(/var\(--([\w-]+)\)/g, (m, n) => `${tokenValue(n)}`);
const ALLOWED = /^(transform|opacity|clip-path|filter|translate|scale|rotate)$/;
const LAYOUT = /^(width|height|top|left|right|bottom|margin|padding|inset|inline-size|block-size|max-height|max-width|all)/;
const rows = [], keyframes = [], scriptMotion = [];

const trigger = sel => [/:hover/.test(sel) && 'hover', /:focus-visible|:focus/.test(sel) && 'focus', /:active/.test(sel) && 'press', /\[aria-(pressed|expanded|current|hidden)|\[data-(state|open|pos|enhanced)|\[hidden\]/.test(sel) && 'state change'].filter(Boolean).join(', ') || 'whenever a listed property changes (hover, focus, press or state)';
const parseTransition = decl => decl.split(/,(?![^(]*\))/).map(part => { const t = part.trim().replace(/\s*!important/, ''); const prop = (t.match(/^([a-z-]+|all)\b/) || [, 'all'])[1]; const times = [...t.matchAll(/(var\(--duration-[\w-]+\)|\b\d*\.?\d+m?s\b)/g)].map(m => m[1]); const ease = (t.match(/var\(--ease-[\w-]+\)|cubic-bezier\([^)]*\)|\b(ease(-in|-out|-in-out)?|linear)\b|steps\([^)]*\)/) || ['ease (browser default)'])[0]; return { prop, duration: times[0] || '0s', delay: times[1] || '', ease }; });

for (const file of [...walk(path.join(ROOT, 'src/styles')), ...walk(path.join(ROOT, 'src/components')), ...walk(path.join(ROOT, 'src/pages')), ...walk(path.join(ROOT, 'src/layouts')), ...walk(path.join(ROOT, 'src/dev'))].filter(f => /\.(css|astro)$/.test(f))) {
  const src = fs.readFileSync(file, 'utf8'); const lineOf = i => src.slice(0, i).split('\n').length; const legacy = /tokens\.css|base\.css|utilities\.css|site\.css|legacy-shell\.css/.test(file);
  // CSS rules (stylesheets and <style> blocks)
  for (const m of src.matchAll(/([^{}@;]+)\{([^{}]*\b(?:transition|animation)[^{}]*)\}/g)) { const selector = m[1].trim().replace(/\s+/g, ' ').slice(-140); const before = src.slice(0, m.index); const media = (before.match(/@media[^{]*\{(?![\s\S]*\}\s*\}\s*$)/g) || []).pop() || ''; const inHoverMedia = /hover:\s*hover/.test(before.slice(before.lastIndexOf('@media')).split('}')[0] + (before.slice(before.lastIndexOf('@media')).includes('{') ? '' : ''));
    for (const d of m[2].matchAll(/(?:^|;|\s)(transition|animation)(?:-[a-z-]+)?\s*:\s*([^;]+)/g)) { if (/^animation/.test(d[1]) && !/animation\s*:/.test(d[0]) && !/animation-name/.test(d[0])) continue; if (/transition-(property|duration|timing-function|delay|behavior)|animation-(duration|timing|delay|iteration|direction|fill|play|timeline|range)/.test(d[0])) continue;
      const kind = d[1]; const parts = kind === 'transition' ? parseTransition(d[2]) : [{ prop: (d[2].match(/^\s*([\w-]+)/) || [, '?'])[1], duration: (d[2].match(/var\(--duration-[\w-]+\)|\b\d*\.?\d+m?s\b/) || ['?'])[0], delay: '', ease: (d[2].match(/var\(--ease-[\w-]+\)|cubic-bezier\([^)]*\)|\b(ease(-in|-out|-in-out)?|linear)\b/) || ['ease (browser default)'])[0], loop: /infinite/.test(d[2]) }];
      for (const p of parts) rows.push({ kind, where: 'stylesheet rule', file: rel(file), line: lineOf(m.index + m[0].indexOf(d[0])), element: selector, trigger: kind === 'animation' ? (p.loop ? 'on load, loops' : 'on load or state') : trigger(selector), property: p.prop, duration: `${p.duration}${p.duration.startsWith('var') ? ' = ' + resolve(p.duration) : ''}`, delay: p.delay, easing: `${p.ease}${p.ease.startsWith('var') ? ' = ' + resolve(p.ease) : ''}`, legacy, loop: !!p.loop }); } }
  // inline style="" attributes
  for (const m of src.matchAll(/<([a-zA-Z0-9-]+)\b([^>]*?)style="([^"]*\btransition\s*:[^"]*)"/g)) { const decl = (m[3].match(/transition\s*:\s*([^;]+)/) || [, ''])[1]; const label = (m[2].match(/(?:aria-label|data-[\w-]+|class)="?[^"\s>]*"?/) || [''])[0]; for (const p of parseTransition(decl)) rows.push({ kind: 'transition', where: 'inline style', file: rel(file), line: lineOf(m.index), element: `<${m[1]} ${label}>`.trim(), trigger: 'whenever the property changes (hover or press rules, or a script)', property: p.prop, duration: `${p.duration}${p.duration.startsWith('var') ? ' = ' + resolve(p.duration) : ''}`, delay: p.delay, easing: `${p.ease}${p.ease.startsWith('var') ? ' = ' + resolve(p.ease) : ''}`, legacy: true }); }
  for (const m of src.matchAll(/@keyframes\s+([\w-]+)/g)) keyframes.push({ name: m[1], file: rel(file), line: lineOf(m.index), used: new RegExp(`animation[^;{}]*\\b${m[1]}\\b`).test(src) });
}
// The same in the snapshots still in use (their markup carries inline transitions)
for (const f of walk(path.join(ROOT, 'src/snapshots'))) { const main = JSON.parse(fs.readFileSync(f, 'utf8')).main; const seen = {}; for (const m of main.matchAll(/style="[^"]*\btransition\s*:\s*([^;"]+)/g)) seen[m[1].trim()] = (seen[m[1].trim()] || 0) + 1; for (const [decl, n] of Object.entries(seen)) for (const p of parseTransition(decl)) rows.push({ kind: 'transition', where: `inline style in a legacy snapshot (${n} elements)`, file: rel(f), line: 1, element: 'buttons, links and cards carried over from the legacy page', trigger: 'hover, press or script', property: p.prop, duration: `${p.duration}${p.duration.startsWith('var') ? ' = ' + resolve(p.duration) : ''}`, delay: p.delay, easing: `${p.ease}${p.ease.startsWith('var') ? ' = ' + resolve(p.ease) : ''}`, legacy: true }); }
// Scripts
for (const f of walk(path.join(ROOT, 'src/components/islands'))) { const src = fs.readFileSync(f, 'utf8'); src.split('\n').forEach((l, i) => { const hit = l.match(/\.animate\(|requestAnimationFrame|scrollIntoView|scrollTo\(|IntersectionObserver|startViewTransition|behavior:\s*'smooth'|setTimeout|classList\.(add|toggle)|style\.(setProperty|transform|opacity)|matchMedia\([^)]*reduced-motion/); if (hit) scriptMotion.push({ file: rel(f), line: i + 1, what: hit[0], code: l.trim().slice(0, 150) }); }); }
// Hooks left in the markup with nothing behind them
const hooks = {}; for (const f of [...walk(path.join(ROOT, 'src/components')), ...walk(path.join(ROOT, 'src/snapshots')), ...walk(path.join(ROOT, 'src/pages'))]) { const s = fs.readFileSync(f, 'utf8'); for (const h of ['data-reveal', 'data-reveal-group', 'data-stat', 'data-scene-section', 'data-manifesto', 'data-hero-el', 'data-scene-poster', 'data-atmosphere-dots', 'data-magnetic', 'data-parallax']) { const n = s.split(h + '=').length - 1 + (s.split(h + ' ').length - 1); if (n) (hooks[h] ||= {})[rel(f)] = n; } }
const all = [...walk(path.join(ROOT, 'src/styles')), ...walk(path.join(ROOT, 'src/components/islands'))].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const deadHooks = Object.entries(hooks).map(([h, files]) => ({ hook: h, uses: Object.values(files).reduce((a, b) => a + b, 0), files: Object.keys(files), styledOrScripted: all.includes(h) }));

const issues = [];
for (const r of rows) { if (LAYOUT.test(r.property)) issues.push(`${r.file}:${r.line} transitions "${r.property}" (${r.element.slice(0, 50)}): a layout property, or "all"`); else if (!ALLOWED.test(r.property)) (issues.paint ||= new Set()).add(r.property); if (!/var\(--duration|^0s|^1ms/.test(r.duration)) issues.push(`${r.file}:${r.line} duration ${r.duration} is not a token (${r.element.slice(0, 50)})`); if (!/var\(--ease/.test(r.easing)) issues.push(`${r.file}:${r.line} easing "${r.easing}" is not a token (${r.element.slice(0, 50)})`); if (r.loop) issues.push(`${r.file}:${r.line} looping animation "${r.property}"`); }
const tokens = [...tokensCss.matchAll(/--((?:duration|ease|reveal|lift|press|parallax|stagger)[\w-]*):\s*([^;]+);/g)].map(m => `--${m[1]}: ${m[2].trim().replace(/\s*\/\*.*$/, '')}`);
const out = { rows, keyframes, scriptMotion, deadHooks, tokens: [...new Set(tokens)], paintPropertiesTransitioned: [...(issues.paint || [])], issues: issues.filter(x => typeof x === 'string') };
fs.mkdirSync(path.join(ROOT, 'reports/motion'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/motion/inventory.json'), JSON.stringify(out, null, 1));
const uniq = {}; for (const r of rows) { const k = [r.kind, r.property, r.duration, r.easing, r.where.replace(/\(\d+ elements\)/, '')].join(' | '); (uniq[k] ||= []).push(r); }
console.log(`${rows.length} transition/animation declarations (${Object.keys(uniq).length} distinct), ${keyframes.length} keyframe rules, ${scriptMotion.length} script lines that move or time something\n`);
for (const [k, list] of Object.entries(uniq).sort((a, b) => b[1].length - a[1].length)) console.log(String(list.length).padStart(4) + 'x  ' + k + '   e.g. ' + list[0].file + ':' + list[0].line);
console.log('\nkeyframes:', keyframes.map(k => `${k.name} (${k.file}:${k.line}${k.used ? '' : ', not used in that file'})`).join('; ') || 'none');
console.log('\nmotion tokens:\n  ' + out.tokens.join('\n  '));
console.log('\nscripts:'); for (const s of scriptMotion) console.log(`  ${s.file}:${s.line}  ${s.code}`);
console.log('\nhooks in the markup:'); for (const h of deadHooks) console.log(`  ${h.hook}: ${h.uses} uses in ${h.files.length} file(s); ${h.styledOrScripted ? 'referenced by a stylesheet or script' : 'NOTHING styles or scripts it'}`);
console.log(`\npaint properties being transitioned (not transform/opacity/clip-path/filter): ${out.paintPropertiesTransitioned.join(', ') || 'none'}`);
console.log(`\nissues: ${out.issues.length}`); for (const i of out.issues.slice(0, 40)) console.log('  - ' + i);
