/* Anthropic's official plugin directory, as the weekly refresh last wrote it (scripts/content/refresh-claude-skills.mjs,
   src/content/feeds/claude-plugins.json; L-63). Built into /claude-skills at build time, so the page makes no request of its
   own. "New" means first seen by the refresh within the last 30 days; the first run marked none as new. */
import feed from '../content/feeds/claude-plugins.json';

export interface Plugin { name: string; title: string; description: string; author: string; official: boolean; category: string; link: string; install: string; firstSeen: string | null }
export const directory = feed as { checked: string; source: string; plugins: Plugin[] };

export const CATEGORY_LABEL: Record<string, string> = {
  design: 'Design', development: 'Development', productivity: 'Productivity', database: 'Data', monitoring: 'Monitoring',
  security: 'Security', deployment: 'Deployment', automation: 'Automation', learning: 'Learning', testing: 'Testing',
  migration: 'Migration', location: 'Location', math: 'Maths', other: 'Other',
};
export const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c.replace(/^\w/, x => x.toUpperCase());

const DAY = 86_400_000;
const builtAt = Date.now();
export const isNew = (p: Plugin) => !!p.firstSeen && builtAt - Date.parse(p.firstSeen) < 30 * DAY;

/** Design first, then the rest by name: the page is for designers, the directory is for everyone. */
export const plugins = [...directory.plugins].sort((a, b) => Number(b.category === 'design') - Number(a.category === 'design') || a.title.localeCompare(b.title));
export const newPlugins = plugins.filter(isNew);
export const categories = [...new Set(plugins.map(p => p.category))].sort((a, b) => Number(b === 'design') - Number(a === 'design') || categoryLabel(a).localeCompare(categoryLabel(b)));
export const checkedOn = (locale = 'en-GB') => new Date(directory.checked).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
