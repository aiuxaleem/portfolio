// node scripts/perf/make-card-icons.cjs .   Builds src/components/cards/card-icons.ts: one icon per category of the AI tools, the Claude plugin directory, the
// design-system library and the Claude skills, from the Lucide drawings already in the repo (resource categories and the
// admin set) plus a few drawn in Lucide's grammar where the repo had none.
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const lib = {};
for (const f of ['src/components/resources/category-icons.ts', 'src/admin/components/admin-icons.ts']) {
  const src = read(f);
  for (const m of src.matchAll(/name: '([a-z0-9-]+)', paths: ("(?:[^"\\]|\\.)*")/g)) lib[m[1]] = JSON.parse(m[2]);
}
/* Drawn here on Lucide's 24-unit grid (stroke set by the svg: 1.75, round caps and joins), for meanings the repo had no icon for. */
Object.assign(lib, {
  code: '<path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /><path d="m14.5 4-5 16" />',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" />',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" />',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z" /><path d="M12 15 9 12a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z" /><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0" /><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" />',
  building: '<rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />',
  landmark: '<path d="M3 22h18" /><path d="M6 18v-7M10 18v-7M14 18v-7M18 18v-7" /><path d="M12 2 20 7H4z" />',
  presentation: '<path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" />',
  download: '<path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />',
  'person-agent': '<circle cx="8" cy="7" r="3" /><path d="M3 20v-1a5 5 0 0 1 10 0v1" /><rect x="14" y="6" width="8" height="7" rx="2" /><path d="M18 6V3.5" /><path d="M16.5 9.5h.01M19.5 9.5h.01" /><path d="M15 20v-2.5a3 3 0 0 1 6 0V20" />',
  package: '<path d="M11 21.7a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7z" /><path d="M12 22V12" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="m7.5 4.3 9 5.1" />',
});
const maps = {
  AI_TOOL_ICONS: { assistants: 'message-square-text', 'ui-generation': 'layout-dashboard', code: 'code', images: 'image', 'video-and-motion': 'video', 'audio-and-voice': 'mic', research: 'users', testing: 'eye', 'diagrams-and-slides': 'presentation', 'colour-and-type': 'palette', patterns: 'sparkles', accessibility: 'accessibility' },
  PLUGIN_ICONS: { design: 'pen-tool', development: 'code', productivity: 'clipboard-check', database: 'database', monitoring: 'activity', security: 'shield', deployment: 'rocket', automation: 'refresh-cw', learning: 'graduation-cap', testing: 'flask-conical', migration: 'split', location: 'globe', math: 'chart-column', other: 'puzzle' },
  DS_KIND_ICONS: { company: 'building', government: 'landmark', 'open-source': 'code' },
  SKILL_ICONS: { 'design-to-code': 'code', 'design-systems': 'layout-grid', 'brand-and-visuals': 'palette', motion: 'activity', 'review-and-research': 'search', 'content-and-docs': 'file-text', 'making-skills': 'package' },
};
/* Icons the numbered tiles use by name (ui/tile-icon.astro). */
const TILE = ['download', 'upload', 'message-square', 'folder', 'eye', 'monitor-smartphone', 'swatch-book', 'layout-grid', 'shapes', 'accessibility', 'message-square-text', 'sparkles', 'shield', 'package', 'search', 'pencil-line', 'users', 'person-agent', 'target', 'send'];
const used = new Set(Object.values(maps).flatMap(m => Object.values(m)).concat('puzzle', ...TILE));
for (const n of used) if (!lib[n]) throw new Error(`no drawing for ${n}`);
const lines = [
  '/* The card tiles\' icons (owner request, 24 November 2026: "improve the iconography"): one icon for each category of the',
  '   AI tools, the Claude plugin directory, the design-system library and the Claude skills, in place of the first letter of',
  '   the title, which repeated (two "C", two "F", two "U") and said nothing. Lucide drawings (ISC licence) as the resource',
  '   categories and the admin already use, plus a few drawn on its grid; built by a script from those files, so the set stays',
  '   one style. The tile is decorative: the category is written on the card. */',
  'export const CARD_ICON_PATHS: Record<string, string> = {',
  ...[...used].sort().map(n => `  '${n}': ${JSON.stringify(lib[n])},`),
  '};',
  ...Object.entries(maps).map(([k, m]) => `export const ${k}: Record<string, string> = ${JSON.stringify(m)};`),
  "/** The drawing for a category in one of the maps; an unknown category (a new one in the plugin directory) gets the puzzle piece. */",
  "export const cardIcon = (map: Record<string, string>, key: string) => CARD_ICON_PATHS[map[key] ?? 'puzzle'];",
  '',
];
fs.writeFileSync(path.join(root, 'src/components/cards/card-icons.ts'), lines.join('\n'));
console.log('icons:', [...used].length);
