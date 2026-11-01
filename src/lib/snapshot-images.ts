/* Pictures the legacy snapshots name as files in public/assets/ are served through the build pipeline wherever the same
   file is kept in src/assets/: WebP in a few widths, so a phone gets a file sized for its screen (CLAUDE.md 2.9). The
   case pictures have come through here since 31 October 2026; the portrait since 1 November 2026, with the owner's
   approval, because resampling a photograph is not pixel-identical (docs/AUDIT_FINDINGS.md L-35). The public file stays
   for the share image and the person record (src/lib/seo.ts). Used by layouts/snapshot-page.astro and
   components/home/design-section.astro. */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const CASES = import.meta.glob<{ default: ImageMetadata }>('../assets/cases/*.{jpg,jpeg,png}', { eager: true });
const PEOPLE = import.meta.glob<{ default: ImageMetadata }>('../assets/people/*.{jpg,jpeg,png}', { eager: true });
const byName = (mods: Record<string, { default: ImageMetadata }>) => new Map(Object.entries(mods).map(([file, mod]) => [file.split('/').pop()!, mod.default]));
const cases = byName(CASES), people = byName(PEOPLE);

/** Every `<img src="/assets/cases/<file>">` and the portrait `<img src="/assets/author-portrait.jpg">` in the HTML, through the pipeline. */
export async function pipelineImages(html: string): Promise<string> {
  const jobs: { from: string; source: ImageMetadata; sizes: string }[] = [];
  for (const name of new Set([...html.matchAll(/<img src="\/assets\/cases\/([\w.-]+\.(?:jpe?g|png))"/g)].map(m => m[1]))) {
    const source = cases.get(name);
    if (source) jobs.push({ from: `/assets/cases/${name}`, source, sizes: '(min-width: 1024px) 50vw, 100vw' });
  }
  const portrait = people.get('author-portrait.jpg');
  /* The portrait sits in a box of at most about 420 px on a laptop and most of the width on a phone. */
  if (portrait && html.includes('<img src="/assets/author-portrait.jpg"')) jobs.push({ from: '/assets/author-portrait.jpg', source: portrait, sizes: '(min-width: 768px) 420px, 90vw' });
  for (const { from, source, sizes } of jobs) {
    const widths = [480, 800, 1200, 1600].filter(w => w < source.width).concat(source.width);
    const img = await getImage({ src: source, format: 'webp', widths });
    html = html.split(`<img src="${from}"`).join(`<img src="${img.src}" srcset="${img.srcSet.attribute}" sizes="${sizes}"`);
  }
  return html;
}
