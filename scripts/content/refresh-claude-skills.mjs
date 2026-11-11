// Refreshes the live part of Resources > Claude Skills (/claude-skills, L-63) from Anthropic's official plugin directory
// (github.com/anthropics/claude-plugins-official, `.claude-plugin/marketplace.json`, managed by Anthropic), and writes
// src/content/feeds/claude-plugins.json, which the page is built from. Run by hand or by the weekly workflow
// (.github/workflows/refresh-claude-skills.yml):   node scripts/content/refresh-claude-skills.mjs
// Rules it keeps:
//  - One source, Anthropic-curated: nothing from an unvetted list reaches the site by itself.
//  - Every field is checked and clamped before it is written; a fetch or a shape that fails leaves the file as it was and
//    exits 1, so the site keeps its last good copy.
//  - The directory records no date for when a plugin joined it, so the date this script first saw each one is kept
//    (`firstSeen`); "new" on the page means new since tracking began, and the first run marks none as new.
//  - The file changes only when the directory does (the check time is kept apart), so the workflow commits only real news.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'src/content/feeds/claude-plugins.json');
const SOURCE = 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json';
const HOME = 'https://github.com/anthropics/claude-plugins-official';
const today = new Date().toISOString().slice(0, 10);

const clamp = (s, n) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const cut = t.slice(0, n); const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; ')); return (end > n * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…'); };
const httpsUrl = u => (typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u) ? u : undefined);
const slug = s => typeof s === 'string' && /^[a-z0-9][a-z0-9._-]{0,80}$/i.test(s);
/* A name like ui-theme-designer reads as a title in the site's sentence case, with common acronyms kept in capitals. */
const ACRONYMS = new Set(['ai', 'api', 'ui', 'ux', 'sdk', 'mcp', 'cli', 'sap', 'aws', 'gcp', 'sql', 'pr', 'ci', 'cd', 'qa', 'seo', 'crm', 'cms', 'ios', 'lsp', 'adlc', 'dbt', 'gpt', 'llm', 'json', 'html', 'css']);
const titleOf = name => name.split(/[-_]+/).filter(Boolean).map((w, i) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');

let data;
try {
  const res = await fetch(SOURCE, { headers: { 'user-agent': 'aiuxaleem-skills-refresh' } });
  if (!res.ok) throw new Error(`the directory answered ${res.status}`);
  data = await res.json();
  if (!Array.isArray(data?.plugins) || data.plugins.length < 20) throw new Error('the directory has an unexpected shape');
} catch (e) { console.error(`Not refreshed, the last good copy stays: ${e.message}`); process.exit(1); }

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const seen = new Map((previous?.plugins || []).map(p => [p.name, p.firstSeen]));
const first = !previous;
const repoOf = src => { const u = typeof src === 'string' ? src : src?.url || (src?.repo ? `https://github.com/${src.repo}` : ''); const m = String(u).match(/github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?(?:[/#]|$)/); return m ? `https://github.com/${m[1]}` : undefined; };

const plugins = data.plugins.filter(p => slug(p?.name) && typeof p.description === 'string').map(p => ({
  name: p.name,
  title: clamp(p.displayName || titleOf(p.name), 80),
  description: clamp(p.description, 320),
  author: clamp(p.author?.name || '', 60),
  official: /^anthropic$/i.test(p.author?.name || ''),
  category: /^[a-z-]{2,30}$/.test(p.category || '') ? p.category : 'other',
  link: httpsUrl(p.homepage) || repoOf(p.source) || HOME,
  install: `/plugin install ${p.name}@claude-plugins-official`,
  firstSeen: seen.has(p.name) ? seen.get(p.name) : (first ? null : today),
})).sort((a, b) => a.name.localeCompare(b.name));

const body = { source: HOME, plugins };
const before = previous ? JSON.stringify({ source: previous.source, plugins: previous.plugins }) : '';
if (before === JSON.stringify(body)) { console.log(`No change in the directory (${plugins.length} plugins).`); process.exit(0); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ checked: today, ...body }, null, 1) + '\n');
const fresh = plugins.filter(p => p.firstSeen === today).length;
console.log(`Written ${plugins.length} plugins (${fresh} new since the last check) to ${path.relative(ROOT, OUT)}.`);
