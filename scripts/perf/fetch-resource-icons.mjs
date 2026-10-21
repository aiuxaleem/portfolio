// The icons of the resource categories come from Lucide (ISC licence, https://lucide.dev), the set whose grid, caps and
// joins the site's own inline icons already follow. This downloads the chosen icons once and writes their drawing
// commands into src/components/resources/category-icons.ts, so the site makes no request for them and ships only the
// sixteen it uses. Run again only when a category or its icon changes:
//   node scripts/perf/fetch-resource-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib.mjs';

const VERSION = '0.544.0';
/* One icon per category, by the word used in the content files (src/lib/content-schemas.ts). */
const ICONS = {
  'ai-design-patterns': 'sparkles', 'prompting-and-evaluation': 'message-square-text', 'design-systems': 'layout-grid', 'design-tokens': 'swatch-book',
  accessibility: 'accessibility', 'research-and-testing': 'flask-conical', prototyping: 'pen-tool', typography: 'type', colour: 'palette',
  'icons-and-illustration': 'shapes', motion: 'activity', 'handoff-and-documentation': 'file-text', learning: 'graduation-cap',
  inspiration: 'lightbulb', utilities: 'wrench', communities: 'users',
};

const out = {};
for (const [category, name] of Object.entries(ICONS)) {
  const res = await fetch(`https://unpkg.com/lucide-static@${VERSION}/icons/${name}.svg`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  const svg = await res.text();
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
  if (!inner || /<script|<style|href=|url\(/i.test(inner)) throw new Error(`${name}: unexpected content`);
  out[category] = { name, inner };
}
const lines = [
  '/* The resource categories\' icons: drawing commands from Lucide (ISC licence, https://lucide.dev), fetched once by',
  `   scripts/perf/fetch-resource-icons.mjs (lucide-static ${VERSION}). Do not edit by hand; change the list there and run it. */`,
  'import type { ResourceCategory } from \'../../lib/content-schemas\';',
  '',
  'export const CATEGORY_ICONS: Record<ResourceCategory, { name: string; paths: string }> = {',
  ...Object.entries(out).map(([c, { name, inner }]) => `  '${c}': { name: '${name}', paths: ${JSON.stringify(inner)} },`),
  '};',
  '',
];
fs.writeFileSync(path.join(ROOT, 'src/components/resources/category-icons.ts'), lines.join('\n'));
console.log(`${Object.keys(out).length} icons written to src/components/resources/category-icons.ts`);
