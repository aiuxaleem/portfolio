/* The "In public" tiles of the Arabic Home (pages/ar/index.astro) that the design froze (a placeholder video, one LinkedIn
   post, one blog guide, three LinkedIn articles) read the newest published entries instead (L-57, L-59). The English Home
   has its own In public section since L-69 (components/home/in-public.astro), so only the Arabic words are kept here. */
import { getImage } from 'astro:assets';
import { listedVideos, posterOf } from './videos';
import { listedPosts, postUrl } from './posts';
import { feedItems, linkedinEntries } from './writing';
import { chrome } from '../i18n/chrome';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/* English words set into the Arabic page keep their own direction, so a leading number or a final full stop stays in place. */
const EN = ' lang="en" dir="ltr"';
const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ARROW = '<svg data-dir-icon width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>';

/** The design's words in the Arabic snapshot, so each replacement finds its place. */
const W = {
  badge: 'التسجيل قريبًا', fallback: 'تصميم منتجات ذكاء اصطناعي يثق بها الناس · 24 دقيقة', heading: 'تصميم منتجات ذكاء اصطناعي يثق بها الناس · 24 دقيقة', videoLabel: 'فيديو على YouTube', suffix: ' (بالإنجليزية)',
  postOverline: 'أحدث منشور على LinkedIn', postBody: '8 كتب أنصح بها أي مصمّم ينتقل إلى تصميم منتجات الذكاء الاصطناعي.',
  /* The design's Arabic headline named the old title; the footer's own Arabic words for the current one replace it. */
  postHeadline: 'مصمّم منتجات أول يضع الذكاء الاصطناعي أولًا',
  guideOverline: 'أحدث دليل', guideOverlineNew: 'أحدث تدوينة', guideTitle: 'ملفات مواصفات المكوّنات: قالب من ثمانية أقسام',
  guideExcerpt: 'صيغة المواصفات المتدرّجة التي أستخدمها ليقرأ المصمّمون والمهندسون ووكلاء الذكاء الاصطناعي مصدر الحقيقة نفسه.', guideCta: 'اقرأ الدليل (بالإنجليزية)', postCta: 'اقرأ المنشور (بالإنجليزية)',
};
const OLD_POST_HREF = 'href="https://www.linkedin.com/posts/aiuxaleem_ai-x-ux-reading-list-activity-7511236061377748993-4xzs/"';

export async function freshenInPublic(html: string): Promise<string> {
  const w = W;
  /* The video tile: the placeholder badge goes (the overline already says what the tile is), the fallback becomes the label
     kind, the heading links to /videos with the newest video's title, and its poster fills the frame. */
  const latest = (await listedVideos()).find(v => !v.data.fixture);
  if (latest) {
    html = html.replace(new RegExp(`<span style="[^"]*"><div class="sc-host-x" style="display: contents;"><span [^>]*data-badge=""><span [^>]*></span><span class="sc-interp">${rx(w.badge)}</span></span></div></span>`), '');
    html = html.replace(`<div data-cover-fallback="" aria-hidden="true"><span><span class="sc-interp">${w.fallback}</span></span></div>`, `<div data-cover-fallback="label" aria-hidden="true"><span>${w.videoLabel}</span></div>`);
    html = html.replace(new RegExp(`(<div role="heading" aria-level="4"[^>]*>)<span class="sc-interp">${rx(w.heading)}</span>(</div>)`), `$1<a href="/videos" data-link class="home-video-link" style="display: inline-flex; align-items: center; gap: var(--space-2); min-block-size: var(--tap-target); color: var(--text-link); text-decoration: none;"><bdi${EN}>${esc(latest.data.title)}</bdi>${w.suffix}${ARROW}</a>$2`);
    const poster = posterOf(latest);
    if (poster) {
      const src = (await getImage({ src: poster, width: 960 })).src;
      html = html.replace(/<span data-image-box="video-thumb"[^>]*><\/span>/, `<img src="${src}" alt="" width="960" height="540" loading="lazy" decoding="async" style="position: absolute; inset: 0; inline-size: 100%; block-size: 100%; object-fit: cover;" />`);
    }
  }
  /* The LinkedIn post card: the newest post's words and address; the English overline carries its date on one line. */
  const post = (await linkedinEntries()).find(e => !e.fixture);
  if (post) {
    html = html
      .replace(`<span class="sc-interp">${w.postOverline}</span>`, `<span class="sc-interp">${w.postOverline}</span>`)
      .replace(`<span class="sc-interp">${w.postBody}</span>`, `<span class="sc-interp"${EN}>${esc(post.title)}</span>`)
      .replace(OLD_POST_HREF, `href="${esc(post.url)}"`);
    html = html.replace(`<span class="sc-interp">${w.postHeadline}</span>`, `<span class="sc-interp">${esc(chrome.ar.bio.split('،')[1]?.split('.')[0].trim() || w.postHeadline)}</span>`);
  }
  /* The blog card: the newest published post (title, excerpt, address). */
  const blog = (await listedPosts()).find(p => !p.data.fixture);
  if (blog) {
    html = html
      .replace(new RegExp(`<a href="[^"]*"([^>]*>(?:(?!</a>)[\\s\\S])*?${rx(w.guideOverline)})`), (_, rest: string) => `<a href="${postUrl(blog)}"${rest}`)
      .replace(`<span class="sc-interp">${w.guideTitle}</span>`, `<span class="sc-interp"${EN}>${esc(blog.data.title)}</span>`)
      .replace(`<span class="sc-interp">${w.guideExcerpt}</span>`, `<span class="sc-interp"${EN}>${esc(blog.data.excerpt || '')}</span>`)
      .replace(`<span class="sc-interp">${w.guideCta}</span>`, `<span class="sc-interp">${w.postCta}</span>`);
    html = html.replace(`<span class="sc-interp">${w.guideOverline}</span>`, `<span class="sc-interp">${w.guideOverlineNew}</span>`);
  }
  /* The three article rows: the newest three, in the order the Articles page uses. */
  const articles = (await feedItems()).filter(i => i.type === 'article' && !i.fixture).slice(0, 3);
  articles.forEach((a, n) => {
    html = html.replace(new RegExp(`(<span class="sc-interp">0${n + 1}</span></span>\\s*<a data-link="" href=")[^"]*(" [^>]*><span style="flex: 0 1 auto;"><span class="sc-interp">)[^<]*(</span>)`), (_, p1: string, p2: string, p3: string) => `${p1}${esc(a.href)}${p2.replace(/<span class="sc-interp">$/, `<span class="sc-interp"${EN}>`)}${esc(a.title)}${p3}`);
  });
  return html;
}
