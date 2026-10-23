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

## Part 4: The admin area, 21 October 2026

The owner asked for the same treatment on the admin pages: icons, a bento layout, better information architecture, Hick's law and the law of proximity. Method: three proposals from different angles (the owner's weekly tasks, information density through bento tiles, the Laws of UX as the brief), scored by three judges (a design systems lead, an accessibility specialist, the owner's own view), merged into one plan; the build was then reviewed by four adversarial readers (Hick's and proximity, icon meaning, the 2.11 rules, the design lock) and every finding was checked by a skeptic. 42 findings were raised, 30 confirmed, 27 fixed in the same session.

What the owner sees now:

- The side panel says how many entries each section holds and how many are waiting to be published, so the place to go is known before anything is opened (Zeigarnik, serial position).
- The home opens with Waiting to be published beside Recently published, then the visitor numbers on a bento grid with four stat tiles, the chart, two tables, and the long tail folded away: seven open blocks became two tiles, one control, four numbers, one chart and two tables (Hick's law).
- Period chips sit on the heading of the numbers they change; a list's count sits under its search box; a row's facts sit under its title; a folder's name and count sit over its pictures (law of proximity).
- One icon set with one meaning per icon: the pencil means unpublished changes only, the inbox means waiting, the chain link means referrers only, the eye means page views only.
- Discard asks before deleting; Copy shows Copied; busy forms say so.

Found by the review and fixed: the Copy and Copied labels both showing (an author display rule beat the hidden attribute); Discard with no question; 37 pictures in one phone column with no search; the pencil icon used for three states; two icons for one YouTube action; the chain link with two meanings; a recent list filled by one entry published three times; empty facts on phone rows; the Top pages header clipped at 390 px; the chart framed inside a framed card; the show-password box drawn twice; a legend icon alone of its kind; heading icons of one size for two heading sizes; dead CSS.

Waiting for the owner's yes: renaming the home page and its link from Visitors to Overview (the design names it Visitors); storing titles in the publish log so Recently published shows titles instead of addresses (a migration); keeping the side-panel totals in the database instead of asking the repository (today they come from the repository, cached for twenty seconds and capped at 1.5 s, and are left out when late); regrouping the side panel by publishing frequency; folding blank optional editor sections.


## Part 5: The visitor dashboard, 21 October 2026

The owner asked why the dashboard had gone, then for "a really well thought-out analytics dashboard", checked against the Laws of UX and rated out of ten, with at least a nine before stopping. Method: the dashboard was rebuilt, then rated by a panel of three independent judges (a product designer reading it against the Laws of UX, a data-visualisation reviewer reading it against the site's charting rules, and an accessibility and front-end engineer), each given screenshots at 1280, 1024 and 390 in both themes, the fixtures on `/_states`, and the code. Every judge had to cite a screenshot or a file and line for each finding. The findings were fixed between rounds and the panel ran again on new screenshots. Ten rounds: 7.6, 8.2, 8.6, 8.7, 8.7, 8.8, 8.8, 8.9, 8.9 (one judge; two stopped on a usage limit), then 9.0, 9.0 and 9.0.

### What the owner sees

The admin home (`src/admin/components/dashboard.astro`, numbers from `src/admin/lib/analytics.ts`, names from `src/admin/lib/titles.ts`) answers six questions in order, each in its own card on the bento grid:

1. Is attention growing: four tiles (page views, visits, pages per visit, visits from Saudi Arabia and the UAE) with the change against the previous period as an arrow, a signed change and "was N".
2. Did what I published bring people: page views over time as thin columns with the previous period as a dashed line beneath them, today in gray, a dot under every day something was published, the busiest day and what went out that day in the card head, then the list of what was published with the views its page has had since (titles, not file names, linked to the page).
3. What they read: the parts of the site, with Contact and resume marked as the key pages, and the top ten pages in a fold, named in words with the address under the name.
4. Where they are and what they use: Saudi Arabia and the UAE always first with a badge, even at zero; devices under them.
5. Where they came from: LinkedIn always first, even at zero.
6. When they visit: hour of the day in Gulf time and day of the week over the last 90 days, each shown once the log holds enough days.

The standing definitions sit in one closed fold at the foot. The period (7, 30 or 90 days) is one row of chips; pressing one dims the numbers until the next page arrives.

### Honesty rules the dashboard keeps

- A percentage only when the earlier value is 20 or more; a share only when a list holds 20 visits or more; otherwise the absolute change and the count.
- Nothing drawn for days before counting began; the head line says how many of the period's days are in the log.
- An earlier period only partly in the log is not compared: the change rows are left out and the head line says why.
- Today is still being counted: drawn in gray and named in the key only when it holds a value.
- A zero is no mark, in columns, in the comparison line and in bar lists; a lone earlier value between zeros is a dot above the columns.
- From 90 days the columns are calendar weeks, Monday to Sunday, a short week saying how many of its days are in.
- A visit is one visitor on one day; its source, country, device, hour and weekday come from its first page view.
- A shared page's views (Read, Videos, Resources) are stated once per page and day; the next entry says "same page and day as above".
- Shares are rounded by largest remainder so they add to 100.

### The Laws of UX, final round

| Law | Finding | Where |
| --- | --- | --- |
| Hick's law | The first screen offers three period chips and nothing else to choose; tables, the seventh publish on, the top pages and the definitions are folded. | Head and folds |
| Proximity and common region | One card per question; what was published sits in the chart card beside the markers that point at it; devices under countries; definitions in one fold. | Bento |
| Miller's law | Four tiles, six publishes before the fold, lists capped at ten, five definition bullets. | Lists |
| Serial position | Tiles and the chart first; the publishing pair last. | Page order |
| Von Restorff | One accent per list; a delta carries an icon as well as colour; target markets and key pages carry badges. | Lists and tiles |
| Fitts's law | Chips, fold summaries and row links are 44px targets; a column's hover target is its whole slot. | Everywhere |
| Jakob's law | Period chips, stat tiles with deltas, a time series with a dashed previous period, bar lists: the shapes of every analytics product. | Layout |
| Doherty threshold | Server-rendered; a period press dims the numbers at once; a restored page is never left dimmed. | Period chips |
| Tesler's law | What a visit is, UTC days against Gulf hours and the 20 floor live in one closed fold. | Definitions fold |
| Zeigarnik and Peak-end | "Nothing is waiting. Every saved change is on the site." closes the publishing loop; each publish closes with its views since. | Foot |
| Similarity | What you published and Recently published share one row anatomy; links that leave the admin carry the same icon. | Rows |

Fixed along the way, each found by a judge with evidence: the previous-period line drawn against the wrong box, then over the columns, then lying on the axis at zero; tick labels under publish dots; a hover note that could not be reached or dismissed; days before counting began drawn as zeros; percentages on tiny bases; the ratio tile swinging on one visit; shares that added to 101; a stepped-back gray at 1.2:1; table twins that scrolled sideways on a phone; weekly labels colliding at 390; a wrapped page name painted over its address; file names where titles belong; two lists of the same entries; the same explanation repeated in four tiles.

### Evidence

- `node scripts/quality/check-admin.mjs`: PASSED (sign-in, counting, the dashboard, the hover note shown, kept, dismissed and returned, a modifier-key chip click and Back).
- `node scripts/quality/check-admin-ui.mjs`: PASSED, 540 views of 27 admin pages, 0 findings (the run before the last two wording changes; the final run is reported in the session message).
- Screenshots: `reports/admin-redesign/dash23-*.png` (live dashboard at 1280, 1024 and 390 in both themes; the full, partial and empty fixtures).
- The panel's findings: the workflow journals under the session's `subagents/workflows/` folder.

### Proposals for the owner (not done)

- Draw the axis and max hairlines in `--border-interactive` (4.6:1) instead of `--border-default` (1.4:1): a token choice, so the owner's call.
- Draw the tile icons as outline icons on the card and keep the ink fill for one tile, so the data rather than the icons carries the weight.
- Order the weekday chart Sunday first, or mark the Gulf weekend, since the target markets' week runs Sunday to Thursday.
- Print publish times in Gulf time (they are UTC everywhere in the admin today) so the page keeps one clock.
- Render the two foot cards' titles at the card-title size: they are h2s and currently the largest titles on the page.
- Say "Published before this period" over Recently published when it holds rows, and move the chart's table fold under the publish list so every card ends with its fold.
- Announce "Loading the N-day figures" on a period press for screen readers.
- Add a round y-reference under the max hairline; draw a short first week gray like the last; explain the ratio tile's 20-visit floor in the definitions fold; name the measure in the "Previous period" column; drop the visible word Period on phones from the landmark name; keep a dismissed hover note away until the pointer leaves the column.
- `lh` has no fallback: in a browser without it, a row link's hit area is one line of text.


## Part 6: The whole site against the owner's bar of 8, 22 October 2026

The owner asked for an honest rating of the whole site, public and admin ("a lot of issues with primary and secondary buttons, filters, search"), with everything below 8 fixed within the locked design language. Method: full-page screenshots of every public page (from the built copy, served statically, every section laid out) and every admin page (from the dev server, signed in), at 1280 in both themes and at 390; three independent judges, each given the screenshots, the code and the design export, each citing a screenshot or a file and line for every finding, each rating out of ten with only musts and shoulds counted: a product design lead reading the public site as a hiring manager, an internal-tools designer reading the admin as the owner, and a design-systems and accessibility reviewer reading both against `legacy/` and `design/claude-design/`. The musts and shoulds were fixed between rounds and the panel ran again on new captures.

Final readings: public 8.3, admin 8.2, fidelity of the whole 8.3, each with nothing left at must or should level in the code. Rounds today (public, admin, fidelity of the whole):

| Round | Public | Admin | Fidelity | What the round found |
| --- | --- | --- | --- | --- |
| 1 | 7.8 | 7.5 | 7.8 | One must each: a video entry whose poster showed another talk; a hidden entry's editor offering a View link to a page the build never makes. Shoulds: wording and count-line grammar, chip and button fidelity, placeholder colour, the primary hover's contrast, admin title and card values, list columns, one clock. |
| 2 | 7.9 | 7.8 | (cut off by a restart) | No musts. Shoulds: the project page's column rhythm, the phone video facade, the play disc, the Blog paging line, the phone footer, the list columns, editors without an index, the Career Add button, fold dates, the YouTube page width, blur validation. |
| 3 | 8.0 | 7.6 | 8.0 | One must: the editor form's first submit button was Delete, so Enter in a field would have asked to remove the entry. Shoulds: pager wording, the Topic label, the Read heads, the resume page's footer band, states coverage, list columns again, side-panel totals, "Published on", the Images action, announced errors; the Read jumps back to the design's chips, admin heading weights. |
| 4 | [R4-PUBLIC] | 7.5 | 7.8 | One must, found by both: the Remove form, moved out of the editor, had fallen into the section-index column at 1280px. Shoulds: a failed Delete redrawing the editor empty, orphaned time stamps, two Upload buttons, side-panel totals built on a missing folder, the editor sections and stat tiles still at the old radius, certification badges without the dot. |
| 5 | | 7.9 | 8.0 | No musts. Shoulds: the Last edited column's width, totals that survive one missing folder, one Upload; focus tints for the side panel's foot links and the section index; L-07 (larger field messages) restored to the design's values as a proposal. |
| 6 | 8.3 (re-read after the header fixes) | 8.2 (re-read after the fixes) | 8.3 (re-read after the fixes) | No musts. Public: the header's nav shifted on the three pages that hide the Get in touch button (fixed: the slot stays in the flow). Admin: the Remove card's layout rule missed the live markup, two hints pointed where the control is not, the upload form had no sending state (all fixed). Fidelity: focus twins for the buttons' tints, the invalid state at the design's border colour and weight (fixed). |

### What changed

Public:
- Buttons: the primary's hover keeps its rise and brand shadow and drops the brightness filter that took the white label to about 4.0:1 at the cyan end of the gradient (4.6:1 at rest); a small size that is narrower, not shorter; a disabled state; the design's tracking token on every button and chip.
- Filters, search and counts: one chip anatomy everywhere (a 40px pill inside a 44px target, a check mark as well as the fill when pressed, a 1px rise under the pointer and on focus unless pressed or current); counts on every topic and status chip on Work, Blog and Resources, with chips that would lead to an empty list left out; one count grammar on Work, Blog, Read and Resources ("N projects", "Showing 12 of 51 resources", "Showing 1 to 6 of 13 LinkedIn posts · Page 1 of 3") with the count under the chips; a Clear filters action beside the count once a filter is on; the Resources search first, with a visible label, and paging by twelve; Read's "On this page" row as links, not chips; placeholder text from a token.
- Pages: the header's primary steps aside where a hero already carries one (Case Studies, Services, Contact, project, case-study and post pages); the About page's article follows the headline's first letter; the career grid and the suggest form rows align at the top; the resume's certifications as rows and its primary saying where the file is; the project page's Updates section only when there are updates and its Gallery heading on the reading column; case-study process figures at their own ratio; the Case Studies heading counting the published case studies; the legacy post's back link, reading time and date the same as its card's; a video's duration as 4:30; the first video's mismatched poster removed; the status badge carrying a tone dot beside its word and no outline, as the design's Badge.
- Tokens: `--tap-target` and `--blue-800` moved into `tokens.css`, the one source of truth.
- Behaviour: the aurora island (`src/components/islands/ink-aurora.ts`) reads every dark card's size before it writes anything, so a page with dozens of such cards lays out once instead of once per card; the fixtures page, which had grown to 13,000 nodes with this round's admin fixtures, loads in 26 s instead of 45 (measured on the built copy), inside the quality suite's limit.
- The fixtures page itself: with this round's admin fixtures it had grown to 13,000 nodes and a layout pass took seconds (a browser interaction between the dashboard fixtures' container queries and their tables; with container queries switched off it laid out in under a second), so the admin's pieces now sit on their own page, /_states-admin, and every fixture block on both pages is laid out only when near the viewport (content-visibility: auto, revealed by the capture helper and in print). Both pages load in under a second (623 ms and 337 ms on the built copy, from 45 to 100 s before), and the quality suite checks both.

Admin:
- Frame: the side panel scrolls instead of clipping its last entries; the title at the design's `--text-h1` and cards at `--radius-xl` with `--shadow-sm`, as Admin.dc.html draws them; a notice on every page when the admin reads a branch other than main; the brand mark at the design's radius.
- Lists: the search box first with a live count under it; the title column two fifths of the table; "Publishing" as the column's name; one chip for a published entry kept off the site ("Published, hidden from the site"); a "Last edited" that falls back to the last publish; an empty list that says what to press.
- Editors: required marks; the title field wide and the Markdown help folded; filled repeat rows as named folds with one open spare row headed like them, a cut fold line ending with an ellipsis; a Body box that grows with its text; the legacy-post notice before the sections; a hidden entry's editor saying so and offering no View link to a page the build never makes; a new entry's chip with the "new" icon; Delete with its icon and a confirmation; picture previews and the Images page asking for 640px WebP thumbnails instead of the originals; the YouTube page with one action.
- Time: every publish and edit time in Gulf time (GMT+3), the clock the dashboard's hour chart keeps, said once in the definitions fold.

### Deviations from the design recorded today

`docs/AUDIT_FINDINGS.md` L-05 (no hover brightness filter on the primary button), L-06 (placeholder colour from `--text-subtle`), L-07 (field messages kept at 14px and the invalid border at 2px, recorded, not changed) and L-08 (admin title, cards and badges restored to the design's values).

### Evidence

- `npm run check`: 0 errors, 0 warnings.
- `npm run quality`: PASSED, 0 failures in the checks that are wired: 840 views of 42 routes (including /_states and /_states-admin) at ten sizes in both themes, plus budgets, SEO and structured data, and owner facts.
- `node scripts/quality/check-admin-ui.mjs`: 540 views of 27 admin pages; the full run ended with three page-load timeouts on the posts and videos lists under load (each page loads in about 2 s when measured alone), and the rerun of those lists passed: 60 views, 0 findings.
- `node scripts/quality/check-admin.mjs`: PASSED (sign-in, sign-out, refusals, the attempt limit, visitor counting and the dashboard).
- `npm run unused`: no unused files, CSS rules or packages.
- The editor form's default submit verified in the browser: Enter in a field submits Save draft; the Delete button is in its own form after the editor.
- Screenshots the judges read: `reports/audit3/` to `reports/audit10/` (public from the built copy, admin from the dev server, 1280 and 390 in light, 1280 in dark). The judges' reports are in the session transcript.

### Left for the owner (content or decisions, not code defects)

- Video posters: every video card uses the typographic fallback. Proposal: fetch each video's own YouTube thumbnail at build time into `src/assets/media/posters/` (self-hosted, so nothing loads from YouTube before a click) and set it as the poster with an alt the owner writes.
- The cover fallback repeats the title in display type above the title in the card body (blog and video cards). Proposal: show the category or index and the brand gradient instead; a design change.
- The Now page's status words ("In production", "Ongoing") differ from Work's ("Shipped", "In progress") and carry no tone dot; content words in `profile.json`.
- The Multi-brand token system cover is cropped at the card ratio; re-export at `--aspect-case`.
- The case-study process figures are small exports; re-export at 1440×900.
- Read and Videos hero primaries: the follow/subscribe action is the primary today; swapping it with the on-site action is a design change.
- Blog topics stay links to tag pages (the list is paginated, so filtering in place would hide posts on other pages); the pager uses the chip look for page numbers. Recorded as a decision, not a defect.
- The Work grid at four entries (three and one), the Home page's length at phone width, character counters on limited admin fields, a Remove button per repeat row, a "Last edited" that falls back to the entry's own date, the side-panel counts in the sans face.
