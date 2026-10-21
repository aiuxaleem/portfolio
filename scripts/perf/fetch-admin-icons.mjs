// The admin area's icons come from Lucide (ISC licence, https://lucide.dev), the set whose grid, caps and joins the
// site's own inline icons already follow. This downloads the chosen icons once and writes their drawing commands into
// src/admin/components/admin-icons.ts, so the admin ships only the icons it uses and makes no request for them.
// Run again only when an icon is added or changed:
//   node scripts/perf/fetch-admin-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib.mjs';

const VERSION = '0.544.0';
/* One icon per use, by the key the admin pages ask for. */
export const ICONS = {
  // sections (also used for image folders and the empty list)
  visitors: 'layout-dashboard', projects: 'folder-kanban', 'case-studies': 'book-open', posts: 'file-pen', videos: 'video', 'linkedin-posts': 'message-square', 'linkedin-articles': 'newspaper', resources: 'library', site: 'settings', profile: 'user', images: 'image',
  // the frame
  view: 'external-link', dark: 'moon', light: 'sun', signout: 'log-out', menu: 'menu', close: 'x', back: 'arrow-left', chevron: 'chevron-down', sections: 'list-ordered',
  // states of an entry
  published: 'check', changes: 'pencil-line', new: 'file-plus', hidden: 'eye-off', suggested: 'mail',
  // actions
  search: 'search', nomatch: 'search-x', add: 'plus', youtube: 'youtube', refresh: 'refresh-cw', upload: 'upload', publish: 'send', draft: 'save', discard: 'trash-2', copy: 'copy', copied: 'clipboard-check',
  // dashboard
  waiting: 'inbox', recent: 'history', clock: 'clock', numbers: 'activity', views: 'eye', people: 'users', pages: 'files', busiest: 'calendar-days', chart: 'chart-column', top: 'trending-up', referrers: 'link', countries: 'globe', devices: 'monitor-smartphone',
  // messages
  info: 'info', alert: 'circle-alert', ok: 'circle-check',
};

const out = {};
for (const [key, name] of Object.entries(ICONS)) {
  const res = await fetch(`https://unpkg.com/lucide-static@${VERSION}/icons/${name}.svg`);
  if (!res.ok) throw new Error(`${key} (${name}): ${res.status}`);
  const svg = await res.text();
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
  if (!inner || /<script|<style|href=|url\(/i.test(inner)) throw new Error(`${name}: unexpected content`);
  out[key] = { name, inner };
}
const lines = [
  '/* The admin area\'s icons: drawing commands from Lucide (ISC licence, https://lucide.dev), fetched once by',
  `   scripts/perf/fetch-admin-icons.mjs (lucide-static ${VERSION}). Do not edit by hand; change the list there and run it. */`,
  'export type AdminIcon = ' + Object.keys(out).map(k => `'${k}'`).join(' | ') + ';',
  '',
  'export const ADMIN_ICONS: Record<AdminIcon, { name: string; paths: string }> = {',
  ...Object.entries(out).map(([k, { name, inner }]) => `  '${k}': { name: '${name}', paths: ${JSON.stringify(inner)} },`),
  '};',
  '',
];
fs.writeFileSync(path.join(ROOT, 'src/admin/components/admin-icons.ts'), lines.join('\n'));
console.log(`${Object.keys(out).length} icons written to src/admin/components/admin-icons.ts`);
