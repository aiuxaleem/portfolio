/* Fixes applied to the pages still served from a legacy snapshot, when the page is built.
   Loading fixes change nothing that is drawn:
   - Tool logos come from public/assets/tools/ (downloaded once by scripts/perf/fetch-icons.mjs) instead of a third-party CDN.
   - A link that opens a new tab says so in visually hidden text.
   - Images named by the page as below its first view on every screen size, and with no loading attribute, become lazy.
   Owner facts (decided 5 October 2026) replace what the legacy pages had hard-coded:
   - the job title, the contact email and the resume link all come from site settings and the profile file. */
import { site, resumeExternal } from '../content/site';
import { profile } from '../content/profile';

/** The three home-page images that sit far below the first view (portrait, reel thumbnail, author avatar). */
export const HOME_BELOW_FOLD = ['/assets/media/portrait-home.webp', '/assets/media/reel-thumb.webp', '/assets/author-avatar.jpg'];

const LEGACY_EMAIL = 'hello@aiuxaleem.com';
const LEGACY_RESUME = 'https://drive.google.com/uc?export=download&amp;id=1cmkjeMQc1S9gIePpRh29T4nFkBBe3izm';
/* Job title, as the legacy English pages wrote it, and what replaces it. The legacy Arabic pages already say "lead product
   designer", so their wording is left alone. */
const TITLES: [string, string][] = [
  ['AI-first Senior Product Designer', profile.headline],
  ['Lead product designer with 13+ years', `${profile.headline} with 13+ years`],
  ['Lead product designer', profile.headline],
  /* One place on the Arabic Home said "senior"; it takes the "lead" wording the Arabic case study already uses. */
  ['مصمّم منتجات أول', 'مصمّم منتجات رئيسي'],
];

const RESUME_LABELS: [string, string][] = [['Download resume', 'View resume'], ['Resume (PDF)', 'View resume'], ['تحميل السيرة الذاتية', 'عرض السيرة الذاتية'], ['السيرة الذاتية (PDF)', 'عرض السيرة الذاتية']];

export function tuneSnapshot(html: string, lazy: string[] = [], newTab = '(opens in a new tab)'): string {
  let out = html.split(LEGACY_EMAIL).join(site.email);
  for (const [from, to] of TITLES) out = out.split(from).join(to);
  /* The resume link: the legacy pages linked a direct download. A link to another site cannot be a download, so it opens in a new tab. */
  /* Its label says what it does: "View resume" for a link to another site, "Download resume" for a file on this one. */
  if (resumeExternal) out = out.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, link => (link.includes(LEGACY_RESUME) ? RESUME_LABELS.reduce((l, [from, to]) => l.split(from).join(to), link) : link));
  out = out.replace(/<a\b[^>]*>/g, tag => {
    if (!tag.includes(LEGACY_RESUME)) return tag;
    const next = tag.replace(LEGACY_RESUME, site.resumeUrl.replace(/&/g, '&amp;'));
    if (!resumeExternal) return next;
    const plain = next.replace(/\sdownload(="[^"]*")?/, '');
    return /\btarget=/.test(plain) ? plain : plain.replace(/>$/, ' target="_blank" rel="noopener">');
  });
  return out
    .replace(/https:\/\/cdn\.simpleicons\.org\/([\w-]+)\/([0-9A-Fa-f]{6})/g, (_, slug, colour) => `/assets/tools/${slug}-${colour.toLowerCase()}.svg`)
    /* A link that opens a new tab says so, in text only screen readers get. Links that already say it are left alone. */
    .replace(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g, link => (/new tab|تبويب/.test(link) ? link : link.replace(/<\/a>$/, `<span class="cory-visually-hidden"> ${newTab}</span></a>`)))
    .replace(/<img\b[^>]*>/g, tag => (lazy.some(src => tag.includes(`src="${src}"`)) && !/\bloading=/.test(tag) ? tag.replace('<img', '<img loading="lazy" decoding="async"') : tag));
}
