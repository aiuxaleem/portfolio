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
  ['an AI-first Senior Product Designer', `${/^[aeiou]/i.test(profile.headline) ? 'an' : 'a'} ${profile.headline}`], // the article follows the headline's first letter
  ['AI-first Senior Product Designer', profile.headline],
  ['Lead product designer with 13+ years', `${profile.headline} with 13+ years`],
  ['Lead product designer', profile.headline],
  /* Services spoke of hiring a senior product designer; it names the job title from the profile instead. */
  ['hiring a senior product designer', `hiring a ${profile.headline}`],
  ['Hiring a senior product designer?', `Hiring a ${profile.headline}?`],
  /* One place on the Arabic Home said "senior"; it takes the "lead" wording the Arabic case study already uses. */
  ['مصمّم منتجات أول', 'مصمّم منتجات رئيسي'],
];

const RESUME_LABELS: [string, string][] = [['Download resume', 'View resume'], ['Resume (PDF)', 'View resume'], ['تحميل السيرة الذاتية', 'عرض السيرة الذاتية'], ['السيرة الذاتية (PDF)', 'عرض السيرة الذاتية']];

export function tuneSnapshot(html: string, lazy: string[] = [], newTab = '(opens in a new tab)', subject = 'subject'): string {
  let out = themeColours(html.split(LEGACY_EMAIL).join(site.email));
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
    .replace(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g, link => {
      if (/new tab|تبويب/.test(link)) return link;
      /* A link named by an aria-label is read by that label alone, so the phrase goes into the label (the Home reel card). */
      const label = link.match(/^<a\b[^>]*?\baria-label="([^"]*)"/);
      if (label) return link.replace(`aria-label="${label[1]}"`, `aria-label="${label[1]} ${newTab}"`);
      return link.replace(/<\/a>$/, `<span class="cory-visually-hidden"> ${newTab}</span></a>`);
    })
    /* The address link that carries a mail subject says so in hidden text, so its name differs from the footer's plain
       address link (WCAG 2.4.4: the same name for two destinations). */
    .replace(/<a\b[^>]*data-email[^>]*href="mailto:[^"?]*\?subject=([^"&]+)"[^>]*>[\s\S]*?<\/a>/g, (link, enc) => (link.includes('data-subject-said') ? link : link.replace(/<\/a>$/, `<span class="cory-visually-hidden" data-subject-said=""> (${subject}: ${decodeURIComponent(enc).replace(/&/g, '&amp;').replace(/</g, '&lt;')})</span></a>`)))
    .replace(/<img\b[^>]*>/g, tag => (lazy.some(src => tag.includes(`src="${src}"`)) && !/\bloading=/.test(tag) ? tag.replace('<img', '<img loading="lazy" decoding="async"') : tag))
    /* A status chip of the design with no dot of its own (Home's Now section says "Shipped" in a plain pill) gets the tone the
       Now page's badge carries for the same word, and components.css draws the dot (L-59 l). */
    .replace(/data-badge=""><span class="sc-interp">(Shipped|In progress)<\/span>/g, (_, word: string) => `data-badge="" data-tone="${word === 'Shipped' ? 'success' : 'brand'}"><span class="sc-interp">${word}</span>`)
    /* The design's own certificate dialog goes: the certificates open in the page's image preview, with zoom (L-60). */
    .replace(/<dialog aria-labelledby="cert-dlg-title"[\s\S]*?<\/dialog>/g, '');
}

/* The Skills section tools tile shows every chip (owner instruction, 2 November 2026, L-37): the two groups the owner named
   become the cells of a small bento inside the tile (.home-tools, .home-tools-group in components.css). Applied to the
   Home section (skills.astro) and to the Arabic Home snapshot; a page without a skills section is returned as it is. */
/* Hard-coded light-theme colours in the legacy markup become the semantic tokens with the same light values, so the dark
   theme gets its own (panel of 2 November 2026, L-39): the grey pills (slate-100 on slate-700 = sunken on body text), the
   blue pills (blue-100 on blue-700 = the ghost tint on link text) and the blue icon tiles (blue-100 with a blue-600 icon = the
   ghost tint with the primary hover blue, 4.9:1 on a dark card). Applied by tuneSnapshot and by skills.astro. */
export function themeColours(src: string): string {
  return src
    .split('background: var(--slate-100); color: var(--slate-700)').join('background: var(--surface-sunken); color: var(--text-body)')
    .split('background: var(--blue-100); color: var(--blue-700)').join('background: var(--action-ghost-hover); color: var(--text-link)')
    .split('background: var(--blue-100); color: var(--blue-600)').join('background: var(--action-ghost-hover); color: var(--action-primary-hover)');
}

export function bentoTools(src: string): string {
  const sec = src.indexOf('id="skills'); if (sec < 0) return src;
  const at = src.indexOf('<h4', sec); if (at < 0) return src;
  const liStart = src.lastIndexOf('<li', src.lastIndexOf('<h3', at)); if (liStart < 0) return src;
  let depth = 0, liEnd = -1;
  const re = /<li\b|<\/li>/g; re.lastIndex = liStart;
  for (let m; (m = re.exec(src));) { depth += m[0] === '</li>' ? -1 : 1; if (depth === 0) { liEnd = m.index; break; } }
  if (liEnd < 0) return src;
  const tile = src.slice(liStart, liEnd)
    .replace('<div style="display: grid; gap: var(--space-6);">', '<div class="home-tools">')
    .replace(/<div style="display: grid; gap: var\(--space-3\);">/g, '<div class="home-tools-group">');
  return src.slice(0, liStart) + tile + src.slice(liEnd);
}
