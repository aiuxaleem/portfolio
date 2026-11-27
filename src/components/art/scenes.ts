/* The page-head illustrations (owner request, 24 November 2026: "create illustrations where ever seem fit; there should not
   be deadspace: where there is a heading and paragraph on the left there should always be a respective illustration").
   One scene per index page, of what that page holds, on a 480 × 360 stage with every shape inside 16 to 464 across and
   16 to 344 down. The same vocabulary as the Process drawings (home/process-art.ts): outlines 1.5, connectors 2, accents 3,
   text bars 4, titles 7; placeholder blocks in the skeleton fill; every colour a semantic token through the .pa-* classes
   styled in hero-art.astro, so both themes work with no colour in this file. Decorative: the page's words carry the meaning.
   With motion on, lines marked data-draw draw themselves and shapes marked data-pop settle in, in the order --i gives, once,
   after the heading (motion.css, .hero-art); otherwise they are drawn whole. */
const d = (i: number) => `data-draw="" pathLength="1" style="--i:${i}"`;
const p = (i: number) => `data-pop="" style="--i:${i}"`;

/* A post or article card of the feed: avatar, name, time, two body lines, reactions. */
const feedCard = (y: number, i: number, badge = false) => `
    <rect class="pa-card" x="110" y="${y}" width="260" height="104" rx="14"/>
    <circle class="pa-fill" ${p(i)} cx="136" cy="${y + 26}" r="12"/>
    <path class="pa-title" d="M158 ${y + 20}h64"/>
    <path class="pa-line" d="M158 ${y + 34}h36"/>
    <path class="pa-line" d="M126 ${y + 58}h222M126 ${y + 72}h176"/>
    <circle class="pa-link" cx="132" cy="${y + 90}" r="5.5"/><circle class="pa-strong" cx="145" cy="${y + 90}" r="5.5"/><circle class="pa-soft pa-edge" cx="158" cy="${y + 90}" r="5.5"/>
    <path class="pa-line" d="M172 ${y + 90}h24M310 ${y + 90}h40"/>${badge ? `
    <rect class="pa-chip" ${p(i + 1)} x="290" y="${y + 12}" width="64" height="24" rx="12"/>
    <path class="pa-accent" d="M302 ${y + 24}h40"/>` : ''}`;

/* A topic's hash mark, about 12 across, centred on x, y. */
const hash = (x: number, y: number, cls = 'pa-accent') => `<path class="${cls} pa-glyph" d="M${x - 2} ${y - 7}l-2 14M${x + 4} ${y - 7}l-2 14M${x - 6} ${y - 3}h12M${x - 7} ${y + 3}h12"/>`;

export const SCENES = {
  /* Blog: the articles as a fanned stack, the front one open on its cover picture, and the topics, each with its hash mark, beside it. */
  blog: `
    <rect class="pa-card" x="168" y="34" width="232" height="282" rx="16" transform="rotate(7 284 175)"/>
    <rect class="pa-card" x="148" y="40" width="232" height="282" rx="16" transform="rotate(-4 264 181)"/>
    <rect class="pa-card" x="150" y="52" width="236" height="288" rx="16"/>
    <rect class="pa-fill" ${p(0)} x="166" y="68" width="204" height="104" rx="10"/><clipPath id="blog-cover"><rect x="166" y="68" width="204" height="104" rx="10"/></clipPath>
    <circle class="pa-play" cx="210" cy="104" r="12"/><path class="pa-play pa-faint" clip-path="url(#blog-cover)" d="M166 172v-22l46-34 36 26 30-20 92 50z"/>
    <rect class="pa-link" x="166" y="188" width="62" height="10" rx="5"/>
    <path class="pa-title" d="M166 218h176M166 240h118"/>
    <path class="pa-line" d="M166 266h196M166 282h160"/>
    <circle class="pa-soft pa-edge" cx="176" cy="316" r="9"/>
    <path class="pa-line" d="M192 316h52"/>
    <rect class="pa-chip" x="304" y="305" width="66" height="22" rx="11"/>
    <path class="pa-accent" d="M318 316h38"/>
    <rect class="pa-chip" ${p(2)} x="40" y="96" width="112" height="32" rx="16"/>
    ${hash(60, 112)}<path class="pa-line" d="M76 112h58"/>
    <rect class="pa-chip" ${p(3)} x="58" y="140" width="96" height="32" rx="16"/>
    ${hash(78, 156)}<path class="pa-line" d="M94 156h42"/>
    <rect class="pa-chip" ${p(4)} x="30" y="184" width="104" height="32" rx="16"/>
    ${hash(50, 200)}<path class="pa-line" d="M66 200h50"/>`,

  /* A topic: the topics as a row of chips with one lit, and under it only the posts that carry it, each marked with it. */
  tag: `
    <rect class="pa-chip" x="28" y="24" width="120" height="36" rx="18"/>${hash(50, 42, 'pa-stroke')}<path class="pa-line" d="M68 42h60"/>
    <rect class="pa-fill" ${p(0)} x="164" y="24" width="152" height="36" rx="18"/>${hash(188, 42, 'pa-on-fill')}<path class="pa-on-fill" d="M206 42h86"/>
    <rect class="pa-chip" x="332" y="24" width="120" height="36" rx="18"/>${hash(354, 42, 'pa-stroke')}<path class="pa-line" d="M372 42h60"/>
    <path class="pa-accent" ${d(1)} d="M240 66v20"/><path class="pa-accent" d="M233 80l7 7 7-7"/>
    ${[0, 1].map(k => { const y = 100 + k * 124; return `
    <rect class="pa-card" ${p(2 + k)} x="64" y="${y}" width="352" height="108" rx="16"/>
    <rect class="pa-soft" x="80" y="${y + 14}" width="104" height="80" rx="10"/>
    <path class="pa-title" d="M202 ${y + 30}h150"/><path class="pa-line" d="M202 ${y + 52}h190M202 ${y + 68}h130"/>
    <rect class="pa-fill" x="202" y="${y + 80}" width="70" height="18" rx="9"/><path class="pa-on-fill pa-glyph" d="M216 ${y + 89}h42"/>`; }).join('')}`,

  /* Posts: a feed of LinkedIn posts, one of them part of a series. */
  posts: `${feedCard(20, 0)}${feedCard(136, 1, true)}
    <rect class="pa-card" x="110" y="252" width="260" height="88" rx="14"/>
    <circle class="pa-fill" ${p(3)} cx="136" cy="278" r="12"/>
    <path class="pa-title" d="M158 272h64"/><path class="pa-line" d="M158 286h36M126 310h222M126 324h140"/>`,

  /* Articles: a LinkedIn article with its author line, cover, headline, paragraphs and pull quote; the reading time as a
     ring, and the arrow that says it opens on LinkedIn, in a new tab. */
  articles: `
    <rect class="pa-card" x="120" y="16" width="272" height="328" rx="16"/>
    <circle class="pa-fill" ${p(0)} cx="148" cy="46" r="12"/><path class="pa-title" d="M168 40h70"/><path class="pa-line" d="M168 54h44"/>
    <rect class="pa-fill" ${p(1)} x="144" y="76" width="224" height="86" rx="10"/>
    <path class="pa-on-fill" d="M164 106h128M164 126h84"/>
    <path class="pa-title" d="M144 188h200M144 210h140"/>
    <path class="pa-line" d="M144 238h224M144 254h208M144 270h216"/>
    <path class="pa-accent" ${d(2)} d="M148 292v36"/>
    <path class="pa-title pa-quote" d="M164 302h160M164 320h110"/>
    <circle class="pa-fill pa-rim" ${p(3)} cx="392" cy="22" r="20"/>
    <path class="pa-on-fill pa-glyph" d="M385 29l14-14M389 15h10v10"/>
    <circle class="pa-track" cx="62" cy="112" r="30"/>
    <circle class="pa-arc" ${d(4)} cx="62" cy="112" r="30" transform="rotate(-90 62 112)"/>
    <path class="pa-stroke" d="M62 100v13l8 6"/>`,

  /* Videos: a player with its chapters marked on the timeline, and the other videos as a filmstrip under it. */
  videos: `
    <rect class="pa-card" x="32" y="24" width="416" height="250" rx="18"/>
    <rect class="pa-fill" ${p(0)} x="48" y="40" width="384" height="180" rx="12"/>
    <path class="pa-on-fill pa-faint" d="M64 196c40-34 72-34 104-10s70 22 104-12 80-26 144 8"/>
    <circle class="pa-play" ${p(1)} cx="240" cy="130" r="34"/>
    <path class="pa-fill" d="M231 113v34l28-17z"/>
    <path class="pa-track pa-thin" d="M48 246h384"/>
    <path class="pa-progress" ${d(2)} d="M48 246h150"/>
    <path class="pa-tick" d="M128 240v12M262 240v12M352 240v12"/>
    <circle class="pa-fill pa-rim" ${p(3)} cx="198" cy="246" r="9"/>
    <rect class="pa-card" ${p(4)} x="32" y="292" width="124" height="52" rx="10"/>
    <rect class="pa-card" ${p(5)} x="178" y="292" width="124" height="52" rx="10"/>
    <rect class="pa-card" ${p(6)} x="324" y="292" width="124" height="52" rx="10"/>
    <path class="pa-link" d="M88 309v18l14-9zM234 309v18l14-9zM380 309v18l14-9z"/>`,

  /* Now: what I am building beside what I am learning, the next thing waiting, and a book open on the learning side. */
  now: `
    <rect class="pa-fill" ${p(0)} x="32" y="24" width="96" height="26" rx="13"/>
    <path class="pa-on-fill" d="M48 37h64"/>
    <rect class="pa-card" x="32" y="64" width="196" height="92" rx="14"/>
    <path class="pa-title" d="M50 90h120"/><path class="pa-line" d="M50 110h150"/>
    <path class="pa-track pa-thin" d="M50 134h156"/><path class="pa-progress" ${d(1)} d="M50 134h112"/>
    <rect class="pa-card" x="32" y="168" width="196" height="92" rx="14"/>
    <path class="pa-title" d="M50 194h96"/><path class="pa-line" d="M50 214h140"/>
    <rect class="pa-chip" ${p(2)} x="50" y="228" width="78" height="22" rx="11"/><path class="pa-accent" d="M62 239h54"/>
    <rect class="pa-dashed" x="32" y="272" width="196" height="64" rx="14"/>
    <path class="pa-line" d="M50 304h90"/>
    <rect class="pa-chip" ${p(3)} x="252" y="24" width="96" height="26" rx="13"/>
    <path class="pa-accent" d="M268 37h64"/>
    <rect class="pa-card" x="252" y="64" width="196" height="132" rx="14"/>
    <circle class="pa-track" cx="300" cy="130" r="28"/>
    <circle class="pa-arc pa-arc-60" ${d(4)} cx="300" cy="130" r="28" transform="rotate(-90 300 130)"/>
    <path class="pa-title" d="M344 112h84"/><path class="pa-line" d="M344 132h76M344 148h58"/>
    <path class="pa-card" ${p(5)} d="M350 232c-26-12-56-12-84 0v96c28-12 58-12 84 0z"/>
    <path class="pa-card" d="M350 232c26-12 56-12 84 0v96c-28-12-58-12-84 0z"/>
    <path class="pa-line" d="M282 258h52M282 274h44M282 290h48M366 258h52M366 274h40M366 290h48"/>
    <path class="pa-accent" ${d(6)} d="M350 232v96"/>`,

  /* Sitemap: every page in one tree, the home at its root, the sections, their pages, and one path traced to a page. */
  sitemap: `
    <rect class="pa-fill" ${p(0)} x="24" y="158" width="88" height="44" rx="12"/>
    <path class="pa-on-fill" d="M50 186v-8l18-12 18 12v8"/>
    <path class="pa-stroke" ${d(1)} d="M112 180h24M136 52v256M136 52h30M136 138h30M136 222h30M136 308h30"/>
    <rect class="pa-card" x="166" y="34" width="96" height="36" rx="10"/><path class="pa-title" d="M182 52h60"/>
    <rect class="pa-card" x="166" y="120" width="96" height="36" rx="10"/><path class="pa-title" d="M182 138h48"/>
    <rect class="pa-card" x="166" y="204" width="96" height="36" rx="10"/><path class="pa-title" d="M182 222h56"/>
    <rect class="pa-card" x="166" y="290" width="96" height="36" rx="10"/><path class="pa-title" d="M182 308h40"/>
    <path class="pa-stroke" d="M262 52h22M284 32v40M284 32h20M284 72h20M262 222h22M284 202v40M284 202h20M284 242h20M262 308h42M262 138h22M284 118v40M284 118h20M284 158h20"/>
    <rect class="pa-soft pa-edge" x="304" y="22" width="120" height="20" rx="10"/><rect class="pa-soft pa-edge" x="304" y="62" width="96" height="20" rx="10"/>
    <rect class="pa-soft pa-edge" x="304" y="108" width="132" height="20" rx="10"/><rect class="pa-soft pa-edge" x="304" y="148" width="104" height="20" rx="10"/>
    <rect class="pa-soft pa-edge" x="304" y="192" width="112" height="20" rx="10"/>
    <rect class="pa-soft pa-edge" x="304" y="298" width="100" height="20" rx="10"/>
    <path class="pa-accent" ${d(2)} d="M112 180h24v62h30M262 222h22v20h20"/>
    <rect class="pa-found" ${p(3)} x="304" y="232" width="140" height="20" rx="10"/>`,

  /* Skills I built: a skill as a package that opens on its SKILL.md, uploaded once, then used in a Claude chat. */
  skills: `
    <path class="pa-fill" ${p(0)} d="M28 112a10 10 0 0 1 10-10h44l14 14h66a10 10 0 0 1 10 10v150a10 10 0 0 1-10 10H38a10 10 0 0 1-10-10z"/>
    <rect class="pa-card" ${p(1)} x="52" y="70" width="112" height="140" rx="10" transform="rotate(-6 108 140)"/>
    <text class="pa-mono" x="66" y="104" transform="rotate(-6 108 140)">SKILL.md</text>
    <path class="pa-line" d="M66 124h76M66 140h60M66 156h70" transform="rotate(-6 108 140)"/>
    <path class="pa-on-fill" d="M52 248h120"/>
    <path class="pa-accent" ${d(2)} d="M196 190c28 0 34-30 62-30"/>
    <path class="pa-accent" d="M250 152l9 8-9 8"/>
    <rect class="pa-card" x="270" y="40" width="186" height="280" rx="18"/>
    <rect class="pa-soft" x="270" y="40" width="186" height="36" rx="18"/>
    <rect class="pa-soft" x="270" y="58" width="186" height="18"/>
    <circle class="pa-strong" cx="292" cy="58" r="7"/><path class="pa-title" d="M308 58h60"/>
    <rect class="pa-soft pa-edge" ${p(3)} x="330" y="96" width="110" height="44" rx="14"/>
    <path class="pa-line" d="M344 112h80M344 126h52"/>
    <rect class="pa-chip" ${p(4)} x="286" y="156" width="150" height="76" rx="14"/>
    <path class="pa-line" d="M300 178h118M300 194h104M300 210h80"/>
    <path class="pa-accent" ${d(5)} d="M296 260l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/>
    <rect class="pa-dashed" x="286" y="282" width="154" height="24" rx="12"/>`,

  /* Claude Skills: the directory searched, its tiles, the one picked for designers, ready to add, and the weekly refresh. */
  claudeSkills: `
    <rect class="pa-card" x="32" y="20" width="364" height="42" rx="21"/>
    <circle class="pa-stroke" cx="58" cy="41" r="9"/><path class="pa-stroke" d="M65 48l7 7"/>
    <path class="pa-line" d="M84 41h150"/>
    <circle class="pa-chip" ${p(0)} cx="432" cy="41" r="22"/>
    <path class="pa-accent" ${d(1)} d="M422 36a11 11 0 0 1 20 1M442 46a11 11 0 0 1-20-1M442 28v9h-9M422 54v-9h9"/>
    ${[0, 1, 2].map(c => [0, 1].map(r => {
      const x = 32 + c * 144, y = 84 + r * 132, picked = c === 1 && r === 0;
      return `<rect class="${picked ? 'pa-card pa-found-edge' : 'pa-card'}" ${picked ? p(2) : ''} x="${x}" y="${y}" width="128" height="116" rx="14"/>
    <rect class="${picked ? 'pa-fill' : 'pa-soft'}" x="${x + 16}" y="${y + 16}" width="32" height="32" rx="9"/>
    <path class="pa-title" d="M${x + 16} ${y + 66}h${picked ? 82 : 70}"/><path class="pa-line" d="M${x + 16} ${y + 84}h92M${x + 16} ${y + 98}h64"/>`;
    }).join('')).join('')}
    <circle class="pa-fill pa-rim" ${p(3)} cx="300" cy="88" r="15"/>
    <path class="pa-on-fill" d="M293 88h14M300 81v14"/>`,

  /* Design systems: the layers a system is made of, from the tokens at the back to the patterns at the front. */
  designSystems: `
    <rect class="pa-card" x="40" y="24" width="300" height="150" rx="16"/>
    <circle class="pa-fill" ${p(0)} cx="74" cy="58" r="14"/><circle class="pa-link" ${p(1)} cx="110" cy="58" r="14"/>
    <circle class="pa-strong" ${p(2)} cx="146" cy="58" r="14"/><circle class="pa-soft pa-edge" ${p(3)} cx="182" cy="58" r="14"/>
    <path class="pa-line" d="M220 52h96M220 68h70"/>
    <rect class="pa-card" x="80" y="84" width="300" height="150" rx="16"/>
    <text class="pa-type" x="104" y="140">Aa</text>
    <path class="pa-title" d="M184 120h160"/><path class="pa-line" d="M184 140h120M104 170h176"/>
    <rect class="pa-card" x="120" y="144" width="300" height="150" rx="16"/>
    <rect class="pa-fill" ${p(4)} x="144" y="170" width="96" height="32" rx="16"/>
    <rect class="pa-soft pa-edge" x="252" y="170" width="44" height="24" rx="12"/><circle class="pa-strong" cx="284" cy="182" r="8"/>
    <rect class="pa-card" x="160" y="204" width="300" height="140" rx="16"/>
    <rect class="pa-fill" x="160" y="204" width="300" height="30" rx="16"/><rect class="pa-fill" x="160" y="218" width="300" height="16"/>
    <rect class="pa-soft" x="180" y="250" width="70" height="78" rx="8"/>
    <path class="pa-title" d="M266 262h120"/><path class="pa-line" d="M266 282h170M266 298h150"/>
    <rect class="pa-chip" ${p(5)} x="266" y="312" width="80" height="22" rx="11"/><path class="pa-accent" d="M280 323h52"/>
    <path class="pa-accent" ${d(6)} d="M354 110c40 0 64 30 64 78"/><path class="pa-accent" d="M410 180l8 10 8-10"/>`,

  /* 404: the page that was asked for is not in the window (a dashed space, the lens finding nothing), and the three ways
     out the page offers, the projects first. */
  notFound: `
    <rect class="pa-card" x="40" y="24" width="400" height="196" rx="16"/><path class="pa-stroke" d="M40 52h400"/>
    <circle class="pa-soft pa-edge" cx="58" cy="38" r="4"/><circle class="pa-soft pa-edge" cx="72" cy="38" r="4"/><circle class="pa-soft pa-edge" cx="86" cy="38" r="4"/>
    <rect class="pa-soft pa-edge" x="110" y="32" width="220" height="12" rx="6"/>
    <rect class="pa-dashed" x="72" y="76" width="212" height="120" rx="10"/>
    <circle class="pa-chip" ${p(0)} cx="316" cy="132" r="38"/><path class="pa-line pa-faint" d="M298 132h36"/>
    <path class="pa-accent" ${d(1)} d="M344 160l30 30"/>
    <path class="pa-stroke" ${d(2)} d="M240 220v14M100 234h280M100 234v16M240 234v16M380 234v16"/>
    <rect class="pa-fill" ${p(3)} x="40" y="252" width="120" height="84" rx="14"/>
    <rect class="pa-play" x="84" y="268" width="13" height="13" rx="3"/><rect class="pa-play" x="101" y="268" width="13" height="13" rx="3"/><rect class="pa-play" x="84" y="285" width="13" height="13" rx="3"/><rect class="pa-play" x="101" y="285" width="13" height="13" rx="3"/>
    <path class="pa-on-fill" d="M64 318h72"/>
    <rect class="pa-card" ${p(4)} x="180" y="252" width="120" height="84" rx="14"/>
    <rect class="pa-chip" x="228" y="266" width="24" height="32" rx="4"/><path class="pa-line pa-glyph" d="M234 277h12M234 285h12"/>
    <path class="pa-title pa-thin" d="M206 318h68"/>
    <rect class="pa-card" ${p(5)} x="320" y="252" width="120" height="84" rx="14"/>
    <path class="pa-chip" d="M366 298v-16l14-12 14 12v16z"/>
    <path class="pa-title pa-thin" d="M350 318h60"/>`,
} as const;

export type SceneName = keyof typeof SCENES;
