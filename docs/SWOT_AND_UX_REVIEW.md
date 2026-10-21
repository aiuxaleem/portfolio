# SWOT analysis and UX review: aiuxaleem.com

Date: 20 October 2026. Reviewed on `main` after the UX resources directory was added. Part 1 is a SWOT of the whole project. Part 2 walks every flow of the resources feature and records what was found and what was changed. Part 3 checks the same feature against the Laws of UX (lawsofux.com). Every claim names its evidence; where something was not measured it says so.

## Part 1: SWOT of the project

Evidence used: the repository (129 commits, 6 to 20 October 2026), the built sitemap (42 routes), `reports/perf/lighthouse-latest.json`, the quality runs of 20 October (860 views, PASSED), the live site at `aiuxaleem-portfolio-app.vercel.app`, and `docs/HEURISTIC_REVIEW.md` (6 October).

### Strengths

- **A locked design system, enforced by machines.** Every colour, size and space is a token; new pages are built from existing components; `npm run quality` checks every route at ten widths in both themes for overflow, clipped text, target size, headings, landmarks, image attributes, metadata, axe rules and keyboard focus. Evidence: 860 views, 0 failures, three times on 20 October.
- **Measured performance.** Lighthouse on the home page: performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.1 s; no third-party hosts; no render-blocking requests. The Work page: 99/100/100/100. Evidence: `reports/perf/lighthouse-latest.json`.
- **A real content system, not a static export.** Typed collections for projects, case studies, posts, videos, LinkedIn items, certifications, testimonials and now resources; an admin area with drafts in Postgres and publishing as commits through the GitHub API; four copies (folder, private GitHub, Vercel, public GitHub Pages) kept in step by one command. Evidence: `src/content.config.ts`, `src/admin/`, `scripts/publish/sync.mjs`, `IN STEP` on 20 October.
- **Honesty rules built in.** A case study figure is shown as a number only when it is marked verified with a source; a `[VERIFY]` or `[METRIC]` placeholder fails the quality run; a testimonial cannot be published without permission. Evidence: `src/lib/content-schemas.ts`, `scripts/quality/`.
- **Accessibility as a habit.** Skip link, one h1 per page, visible focus everywhere, 44 px targets, reduced-motion handling, cookieless visit counting with a sentence in the footer saying so. Evidence: the quality run; the heuristic review of 6 October found no finding above severity 3.
- **The resources directory adds a reason to return.** 49 curated entries with the owner's own words, filters, a suggestion flow with review, and an API; it is the first part of the site that is useful to a visitor who is not hiring. Evidence: `/resources`, `docs/RESOURCES_API.md`.

### Weaknesses

- **Test content is live.** `/blog/test` (title "test", excerpt "bnb") and `/case-studies/test` are published and listed on the Blog page. A hiring manager who finds them reads carelessness. Both are the owner's entries from the admin editor; they should be deleted or marked as drafts. Evidence: live site answers 200 for both; `/blog` links to the post.
- **Outcomes are mostly unverified.** Of the 12 case study figures, 5 are marked verified; the rest render as prose, and four content files still carry a placeholder note. For a Lead or Principal role, verified outcomes are the strongest evidence the site can offer. Evidence: `grep verified src/content/case-studies`.
- **No resume file.** `public/resume.pdf` does not exist; every resume link opens a Google Drive folder. Evidence: `ls public/resume.pdf`; `src/content/site/config.json`.
- **Half the site is still a snapshot of the old export.** Home, the Arabic Home, Services, the component-spec guide and parts of About are served from `src/snapshots/*.json` (11 files), not from components. They cannot be edited in the admin area and they drift from the design in Claude Design, which already has a rebuilt Version 1 that has not been carried over. Evidence: `src/snapshots/`, `docs/DESIGN_SYNC.md`, memory of the 17th pull.
- **No domain.** The site is configured for `aiuxaleem.com` but lives at a `vercel.app` address; canonical links and share images point at a domain that does not resolve. Evidence: `astro.config.mjs` (`site: siteUrl`), the live address.
- **Arabic is a start, not a version.** One Home page and one case study; the Arabic navigation points at Home sections. For KSA and UAE roles this is a visible gap. Evidence: `src/pages/ar/`.
- **Thin video and writing volume.** Four videos (one with a markdown-formatted description showing literal asterisks on the page), one real blog post, three LinkedIn articles. Evidence: `/videos`, `/read`.
- **The desktop header is full.** Six links fit at 1024 px; Resources had to go in the footer and the phone menu. Evidence: a seventh link wrapped "Case Studies" in the 1024 px screenshot.
- **Everything in the directory is dated the same day**, so "Newest first" and "Added 20 Oct 2026" say nothing yet. Evidence: `src/content/resources/`.

### Opportunities

- **Search traffic from the directory.** A curated, described list of AI product design resources is the kind of page that earns links and searches; each category could become its own indexable page, with an `ItemList` in the structured data and an RSS feed of new entries. The glossary idea from the review of uxresources.info is the natural next step.
- **Verified outcomes.** Confirming the seven unverified figures (or replacing them with ones that can be sourced) would do more for the goal of the site than any new page.
- **Finish Arabic for the target market.** Case studies and About in Arabic, with a native reader's review, would set the site apart for GCC hiring managers.
- **Carry the Claude Design rebuild into the site.** The rebuilt Version 1 (public pages and Admin) exists; carrying it over would retire the snapshots and make every page editable.
- **The API as a workflow.** With `RESOURCES_API_KEY` set, an agent or a browser extension can add a resource in one call; the same pattern could take LinkedIn posts and videos.
- **The "Designing the AI" section** of case studies (behaviour, trust, guardrails, failure states, evaluation) is a differentiator few portfolios have; filling it in on every case study would show the level claimed in the title.
- **A custom domain** and a resume PDF are a day's work and remove two credibility gaps.

### Threats

- **Credibility leaks.** Test entries, placeholder notes and unverified numbers are small, but a hiring manager reads a portfolio looking for care. The quality run already fails on placeholders; it does not catch a published post called "test".
- **Link rot in the directory.** Forty-nine outbound links with no link checker ("link check" is listed as not yet wired into `npm run quality`). A dead resource reflects on the curator.
- **Staleness.** A directory that stays at 49 entries dated one day looks abandoned within months. The suggestion flow and the API lower the cost of adding, but only if the owner reviews what arrives.
- **Abuse of the suggestion endpoint.** Mitigated (origin check, spam trap, five per address per hour, review before publish), not removed: a determined sender can still fill the drafts list with nonsense that the owner has to discard.
- **Hosting limits.** The free Vercel plan has refused builds before (deployment rate limit, 2026-10-07) and blocks deploys whose commit author is not the account owner; publishing depends on a GitHub token and a Neon database that both expire or change.
- **Generic AI-sounding copy.** Descriptions written quickly can read like every other directory. The resource descriptions were written in the site's voice, but they have not been read by the owner yet.
- **Two design sources.** The site follows Claude Design, but the design keeps moving (18 pulls in two weeks). Without the carry-over step the two will diverge.

## Part 2: UX flows of the resources feature

Each flow was walked on the development server with a script (`flows.mjs`, `flows-2.mjs`, 20 October) and, where a browser was needed, in Chrome. "Fixed" means the change is in this commit.

| Flow | What a visitor does | Found | State |
|---|---|---|---|
| 1 | Reads the hero, picks a category from the ink panel | The row reloaded the page before landing on the list. Now the list filters in place, focus moves to its heading, the address carries the choice. | Fixed |
| 2 | Narrows by category, type and cost | Chips for values with no resources led to an empty list; the only "Clear filters" was inside the empty state, so a non-empty filtered list had no way back but unpressing chips one by one. Now only values that exist are offered, each with its count, and a "Clear filters" action sits beside the count whenever a filter is on. | Fixed |
| 3 | Sorts A to Z and back | Works; order is stable (date, then title). | OK |
| 4 | Picks a category tile under "By category" | Same reload as flow 1. | Fixed |
| 5 | Opens a resource | Whole card is the link; opens the resource's site in a new tab; the card says so to screen readers and shows a diagonal arrow. | OK |
| 6 | Suggests a resource | **The form could not be sent.** The script locked the menus before reading the form, so category, type and cost were missing and the server refused every send with "This is needed." The first version went live with this defect; the by-hand checks had posted to the API directly and missed it. Also: the section heading and the name field shared an id, so the field's label pointed at the heading; a link typed without `https://` was refused; a refusal did not name the field. All four fixed: the form is read before it is locked, ids are unique, `figma.com` becomes `https://figma.com` on the way out, and the server's messages name the field. | Fixed |
| 7 | Uses the page without JavaScript | The filter bar hides, every resource is listed, the form posts and the visitor is sent back to a thank-you note. | OK |
| 8 | The owner reviews a suggestion | It appeared on the dashboard and in the list as an ordinary new draft, indistinguishable from the owner's own; the note in the editor had the red edge of an error; the note said "Delete" where the button says "Discard"; the list said "ux resources". Now the dashboard and the list say "Sent in by a visitor", the note has a blue edge, the wording matches the button, and "UX" keeps its capitals. | Fixed |
| 9 | The owner adds a resource through the API | Works for drafts; publishing was not exercised against the throwaway branch in this session (it would make a commit and a Vercel preview). | Not tested |

Residual, proposed for the owner's decision (section 1 of `CLAUDE.md`: enhancements wait for approval):

- ~~On a phone the filter bar is tall (16 category chips before the first card).~~ Done on 21 October at the owner's request: the category chips sit in a closed disclosure whose line names the chosen categories; the categories themselves are a bento grid with an icon per category (Lucide, the set the site's inline icons already follow), the fullest four taking two columns and coming first; on a narrow screen the other tiles keep only icon, name and count.
- The hero's primary button goes to the category tiles, two steps from a resource. Pointing it at the list, with the tiles as the second route, would be one step shorter. Not done: a judgement call on the page's story.
- Category pages (`/resources/design-systems`) would make each category shareable and indexable. Not done: 16 more routes in the quality run and the sitemap.

## Part 3: The resources feature against the Laws of UX

| Law | Applied to this feature | Verdict | Evidence or change |
|---|---|---|---|
| Aesthetic-usability effect | The first screen is a balanced split with the ink panel; the cards share the site's recipe. | Pass | Hero screenshots at 1280, 1024, 390 |
| Choice overload | 31 chips at first. Now only values with resources, each counted, and a visible way to clear. | Improved; residual on phones (Part 2) | Flow 2 |
| Chunking | Four sections (hero, categories, list, suggest); card meta grouped as badges, then title, then source line, then words, then topics. | Pass | Page structure |
| Cognitive load | Counts on chips and tiles give the scent before a click; "Visit resource" says what the card does. | Pass | Flow 2, card |
| Doherty threshold | Filtering and sorting are instant and in place; a tile no longer reloads the page. | Pass (was a fail) | Flow 1, 4 |
| Fitts's law | Chips and rows are 44 px; the whole card and the whole tile are the target. | Pass | Quality run target-size check |
| Flow | Focus follows the action: to the list heading after a tile, to the summary after a refused send, to the success note after a send. | Pass | Flows 1, 6 |
| Goal-gradient effect | "Showing 6 of 49 resources" shows progress through a narrowing. | Pass | Flow 2 |
| Hick's law | The hero offers two actions and six categories, not all sixteen. | Pass | Hero panel |
| Jakob's law | Outbound cards open a new tab with the diagonal arrow and a spoken note; the form, chips and sort follow the site's own conventions. | Pass | Card, filters |
| Law of common region | Each chip group sits under its label; the panel frames its contents. | Pass | Filter bar |
| Law of proximity | Count and "Clear filters" sit together; counts sit beside their labels. | Pass | Filter bar |
| Law of Prägnanz | A note to the owner no longer wears the red edge of an error. | Pass (was a fail) | Flow 8 |
| Law of similarity | Category, type and cost badges share one style; pressed chips share one style. | Pass | Card, filters |
| Law of uniform connectedness | Rows in the ink panel are joined by rules; chips of one group sit on one line set. | Pass | Hero panel |
| Mental model | "I look at every suggestion before it goes on the page" sets the expectation; the owner's side says "waiting for your review". | Pass | Flows 6, 8 |
| Miller's law | Three counts; six categories in the panel. | Pass | Hero panel |
| Occam's razor | No detail pages, no "Most viewed" (no data behind it), no featured flag. | Pass | Design decision |
| Paradox of the active user | Tiles, panel rows and chips all reach the same filtered list. | Pass | Flows 1, 2, 4 |
| Parkinson's law | Three required fields; the rest optional and said so. | Pass | Form |
| Peak-end rule | A send ends with thanks and a plain promise; a failure keeps the words and offers email. | Pass | Flow 6 |
| Postel's law | A link without its scheme is accepted; the API takes JSON or a posted form. | Pass (was a fail) | Flow 6, `resources-api.ts` |
| Selective attention | On success the form is replaced by the note, so there is one thing to read. | Pass | Flow 6 |
| Serial position effect | The primary action is first in the hero; the suggestion is the last section. | Pass | Page order |
| Tesler's law | Validation, rate limiting and review live on the server and in the admin area, not with the visitor. | Pass | `resources-api.ts` |
| Von Restorff effect | One primary button; a pressed chip is dark with a check mark, not colour alone. | Pass | Filter bar |
| Working memory | The chosen filters stay visible as pressed chips and in the address. | Pass | Flow 2 |
| Zeigarnik effect | A suggestion waiting for review is listed on the owner's dashboard until it is published or discarded. | Pass | Flow 8 |

Not covered by this review: a real visitor, a screen reader session, Safari, and the API's publish path (Part 2, flow 9).
