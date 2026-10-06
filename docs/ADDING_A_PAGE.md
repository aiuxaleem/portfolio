# Adding a page

A checklist for any new page, so it meets the standards in `CLAUDE.md` section 2 without extra work. Follow it in order. The page is done when `npm run quality` ends with `PASSED`.

## Before you start

- [ ] The design language is locked (`CLAUDE.md` section 1). A new page uses existing tokens and components only. If it needs a new token or a new component style, stop and ask the owner.
- [ ] Decide where the page's content lives. Text that will change belongs in a content collection or a data file in `src/content/`, not in the page file.
- [ ] No invented facts. Unknown numbers, clients, quotes and dates stay out of the page. Keep them as notes in a data file (a `verify` field) or keep the entry a draft.

## 1. Create the page

- [ ] Add `src/pages/your-page.astro` (kebab-case). The address is the file name.
- [ ] Use `PageLayout` from `src/layouts/page-layout.astro`. It supplies the head, the theme script, the skip link, the header, `<main id="main">` and the footer.
- [ ] Give it a unique `title` (about 60 characters or fewer, ending ` · AIUXAleem`) and a `description` (50 to 165 characters).
- [ ] Copy the structure of an existing page of the same kind: `src/pages/now.astro` for a simple page, `src/pages/work/index.astro` for a list with filters, `src/pages/blog/[slug].astro` for a page per content entry.

## 2. Structure

- [ ] Exactly one `<h1>`. Headings go in order: no `<h3>` straight after an `<h1>`.
- [ ] Page width comes from `.cory-container` (add `.cory-container-narrow` for a reading page). Do not hand-build a width.
- [ ] Each section starts with `<p class="cory-overline">` and a heading.
- [ ] Sections alternate between the page surface and the card surface (`.page-section` with `data-surface="card"`). Two card-surface sections never touch.
- [ ] Above the fold at 1280×720 and 390×844: what the page is, one sentence of value, and one primary button. One primary button per view.

## 3. Use what exists

| Need | Use |
| --- | --- |
| Button or button-style link | `src/components/ui/button.astro` (variants `primary`, `ink`, `secondary`, `ghost`, `on-ink`, `on-ink-solid`) |
| Icon-only button | `src/components/ui/icon-button.astro` (give it a `label`) |
| Card that links somewhere | `project-card`, `case-card`, `post-card`, `feed-card` in `src/components/cards/`, or the `.project-card` classes |
| Card without a link | `.tile` |
| Tag or status | `<span class="ui-badge">` |
| Filter or page chip | `.ui-chip` |
| Empty state | `.project-empty` with a title, one sentence and a next action |
| Filters with a result count | `src/components/projects/project-filters.astro` |
| Long-form text | `.prose`, with the blocks in `src/components/content/` |
| YouTube, LinkedIn | `src/components/embeds/` (they load only on click) |
| Form | `src/components/forms/contact-form.astro` as the pattern |
| Closing call to action | The `data-contact` section at the end of `src/pages/about.astro` |
| Image | `Image` from `astro:assets`, file in `src/assets/` |

## 4. Rules that are easy to break

- [ ] **Colour:** semantic tokens only (`--text-*`, `--surface-*`, `--border-*`, `--action-*`; `--on-ink-*` on ink panels). No hex values, no `rgb()`, no opacity to mute text.
- [ ] **Type:** sizes from tokens only. Paragraph width `--measure-body` or `--measure-lead`.
- [ ] **Spacing:** `gap` with `--space-*` tokens; sections use `--section-y`.
- [ ] **Layout:** logical properties (`margin-inline`, `padding-block`, `inset-inline-start`). Grids use `minmax(0, 1fr)`, `data-cq` grids, or `repeat(auto-fit, minmax(min(100%, Npx), 1fr))`.
- [ ] **Text never clips:** no fixed height on a box that holds text, no `nowrap` on anything longer than a short label, no ellipsis except on teaser text.
- [ ] **Targets:** every link and button is at least 44×44 px. A link inside a sentence is exempt.
- [ ] **Focus:** never `outline: none` on something a person can focus.
- [ ] **Hover:** inside `@media (hover: hover)`, with a matching `:focus-visible` style. Only a card that is itself a link lifts on hover.
- [ ] **Motion:** transform and opacity only, with duration and easing tokens.
- [ ] **Images:** alt text on every one. The image at the top of the page is `loading="eager"` with `fetchpriority="high"`; every other image is `loading="lazy" decoding="async"`.
- [ ] **Landmarks:** a `<section>` or `<form>` with a name is a landmark, and two landmarks on one page cannot share a name.
- [ ] **External links:** `target="_blank" rel="noopener"`, a diagonal arrow, and hidden text "(opens in a new tab)".
- [ ] **Third parties:** nothing loads from another site until the visitor asks for it.
- [ ] **Scripts:** only when the page needs behaviour. Put the script in `src/components/islands/` and import it from the component that needs it, so pages without that component do not load it. The page must still be readable with JavaScript off.

## 5. States

- [ ] Every component that shows data handles: default, empty, partial (optional fields missing), and where it applies loading, error and success.
- [ ] Add the page's new components to `src/dev/states.astro`, in every state, so they appear on `/_states` in both themes.
- [ ] Test with the stress content in `src/fixtures/stress.ts`: a 120-character title, a 60-character unbroken string, a one-word title, missing optional fields, eight or more tags. Collection pages get a `stress-fixture` entry with `fixture: true`.

## 6. Make it discoverable

- [ ] Link to the page from somewhere a visitor will find it.
- [ ] If it should have its own share image, add it to the list in `ogEntries()` in `src/lib/seo.ts`. Otherwise it uses the default image.
- [ ] If it describes a thing search engines have a type for (a post, a case study, a video, a person), pass `jsonLd` built with the helpers in `src/lib/seo.ts`.
- [ ] A page that must stay out of search gets `noindex`. It is then left out of the sitemap automatically.
- [ ] Add the page to the template list in `scripts/perf/templates.mjs` if it is a new kind of page.

## 7. Check

- [ ] `npm run dev`, then look at the page in light and dark theme at 320, 390, 768, 1280 and 1920 px wide, and in landscape on a phone.
- [ ] Tab through it. Focus is always visible and the order makes sense.
- [ ] `npm run quality`. It finds the new page on its own (routes come from the sitemap) and checks it at ten screen sizes in both themes: horizontal scroll, clipped text, target sizes, headings, landmarks, image attributes, meta tags, accessibility rules, keyboard focus, script and style budgets, placeholders, and SEO tags. It must end with `PASSED`. Never weaken or skip a check to get there.
- [ ] `npm run perf` if the page has images or scripts. Budgets: LCP under 2.5 s, CLS under 0.1, Lighthouse 95 or more.
- [ ] Capture the screens and compare with the baseline (below). Only the new page, and pages you meant to change, may differ.

```
node scripts/visual/capture.mjs --target=dist --out=reports/visual-new
node scripts/visual/diff-current.mjs --in=reports/visual-new
```

When the differences are the ones you intended, add `--promote` to the second command to make them the new baseline, then run `node scripts/visual/manifest.mjs`.

## 8. Finish

- [ ] Follow the phase finish routine in `CLAUDE.md` section 5: zero errors, quality passes, visual diff explained, commit on a feature branch, report with evidence.
