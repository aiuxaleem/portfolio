# Visual refresh: proposals for the owner (23 October 2026)

Branch `feat/visual-refresh`. CLAUDE.md section 1 locks the design language, so each change needed the owner's yes. **On 23 October 2026 the owner delegated that approval to the reviewer, and all ten changes were approved and shipped** (docs/AUDIT_FINDINGS.md L-17). Services now names the job title from the profile ("Lead AI Product Designer").

## How it was judged

The owner asked for a senior UI/UX and product design review of the visual design, information hierarchy and interaction design, checked against the laws of maths and design principles, rated 1 to 10, and improved until it scored above 8. Two independent judges read full-page captures of every public page (before: `reports/audit10/`; after: `reports/vr1/` to `reports/vr5/`) and the code: a hiring principal who hires Lead AI Product Designers in Riyadh and Dubai, and a reviewer who measures against the laws of maths and design principles. Every finding cites a capture position or a file and line. Six rounds of fixes followed.

| | Live site | This branch |
| --- | --- | --- |
| Hiring principal (first 5 and first 60 seconds) | 7.4 | 8.4 |
| Maths and design principles | 7.0 | 8.1 |

## The maths, measured

- Type scale: 72 / 60 / 48 / 40 / 34 / 28 / 22 / 18 / 16 / 14, steps of 1.18 to 1.27, a minor-third modular scale (about 1.2). The small end compresses (16/14 = 1.14) and five UI sizes sit off the scale (17, 15, 13, 12, 11); recorded, not changed, since the tokens are locked.
- Spacing: a 4px base, mostly on the 8-point grid (20 and 28 are on the 4 grid).
- Line length 54ch for body text (within 45 to 75); body leading 1.65.
- Section rhythm: one token, `--section-y` = clamp(56px, 7vw, 96px), so every reordering kept the gaps between sections.
- Media: cards at 16:10 = 1.60 (near the golden ratio 1.618), video at 16:9.
- Home length at 1280: 10,527px live, 10,042px on this branch.

## The changes

1. **Home order: proof before claims.** Projects moved from the fifth screen (y≈4,620 at 1280) to the second (y≈1,200), right after the teams band. Shipped projects first; the one project the hero deck already shows is left out, so the row is Freight, Multi-brand, WoT. Serial position, F-pattern. `src/pages/index.astro`, `src/components/home/home-feeds.astro`.
2. **Hero facts instead of claims.** The four "Designer who solves problems / shapes strategy / leads decisions / drives clarity" lines (22px extrabold, the second-loudest type in the first view) became four facts at 16px semibold: Now (Colaberry, since 2025), Based in (Hyderabad, on GCC hours), Open to (Roles in KSA and the UAE), Focus (AI products and design systems). The H1 is the one loud line. Two values ("Open to", "Focus") are written in the component; say if they should become settings. `src/components/home/hero.astro`.
3. **One primary per view.** The header's "Get in touch" is the secondary (outline) button, so each page hero owns the one filled button (CLAUDE.md 2.8). The mobile menu keeps it filled. On Contact, the form's submit is outlined so "Book a 15-min call" is the only filled button. `src/components/layout/site-header.astro`, `src/components/forms/contact-form.astro`, `src/pages/contact.astro`.
4. **Header that never moves or wraps.** The nav keeps one position on every page (measured x=268 at 1280 on pages with and without the button); on pages without the button its invisible twin sits before the theme and language controls, so the controls stay flush right. The button and the Arabic language name never wrap. A centred three-column header was tried and dropped: at the 1200px container it cannot fit (1,185px needed in a 1,136px box). `site-header.astro`, `src/styles/site.css`.
5. **Cover without a picture says what it is.** Cards and covers without a picture showed their title in display type above the same title. They now show a short mono label ("Blog post · Design systems", "Project · Design systems", "Case study"), on the body's 24px edge; a video without a poster shows only its play button; dark theme draws a hairline under the cover. Real covers and posters are content for the owner. `src/components/cards/*.astro`, `src/components/embeds/youtube.astro`, `src/pages/work/[slug].astro`, `src/pages/case-studies/[slug].astro`, `src/styles/site.css`, `src/styles/components.css`.
6. **Home video tile tells the truth.** It was a placeholder ("New video coming soon", no link) although three videos are published. It now shows the latest video, its poster, and one link over the whole tile to /videos. `src/components/home/design-section.astro`, `site.css`.
7. **Less to wade through on Home.** The 26 tool chips fold behind "Show all 26" under their heading (the heading stays a heading; the summary says "Show fewer" when open). The learning grid in Now shows the studying-now card and four certificates, with "Show 3 more" for the rest (everything shows without JavaScript). Hick's law. `src/components/home/skills.astro`, `src/components/islands/page-behaviours.ts`, `components.css`.
8. **Project page: the case study in the first view.** "Read the case study" sits beside Live site and View on GitHub (filled, outline, text link: three clear weights), as well as at the foot. `src/pages/work/[slug].astro`.
9. **Contact in two columns.** At 1024px and wider the call, email and facts sit beside the form, so the first view is balanced and the form needs no scroll. `src/pages/contact.astro`.
10. **About: the career reads down, then across.** Newest first down the first column, then the second, instead of a zig-zag. `src/components/profile/career.astro`, `src/styles/profile.css`.

## Left open (content or later decisions)

- Video posters and post covers (content). Until they exist, three videos share the same ink tile.
- The Home skills bento is still about 1,400px; leading with the six strongest tiles and folding the rest is a larger change to the owner's design.
- Services says "senior" where the site targets Lead, and the case study's outcomes band counts artefacts rather than effects (content; invent nothing, use [METRIC: …] where real numbers exist).
- On /read each LinkedIn card repeats its section's name as a kicker.

## Evidence

- `npm run check`: 0 errors. `npm run quality:quick` on the final code: [QUICK].
- Captures: `reports/audit10/` (live), `reports/vr5/` (this branch, final).
