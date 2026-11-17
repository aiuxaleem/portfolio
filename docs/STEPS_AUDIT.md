# Steps audit: how many steps each visitor takes, and which ones can go

17 November 2026. Asked for by the owner on 16 November 2026 ("we need to reduce the steps for users"), with his choice "audit first, then fix". This is the audit. Nothing in the site has changed. Every item below is a proposal until the owner approves it, as CLAUDE.md section 1 requires; the one defect is also a proposal until it is approved in docs/AUDIT_FINDINGS.md.

Method: the audit reads the source only (src/, docs/, CLAUDE.md). No build, browser or test was run, because the quality gate was running in this folder. Each claim cites the file and line it comes from. Step counts come from reading the markup, not from a session recording, so they are counts of the clicks, taps, page loads, folds and long scrolls the code requires. They are not measured times.

How steps are counted: a click or tap is one step. A click that loads a page or opens a new tab is still one step, and the page load is noted. A fold (a `<details>`), a "Show more" press, a carousel arrow and a form submit are one step each. A form field is one step. Scrolling past one or more whole sections is counted as "a long scroll" and named, because its cost depends on the screen.

---

## 1. Summary

The site is already short where it matters most. A hiring manager can judge the level from the Home hero without a click (`hero.astro:25-39`: the title, the lead, and four facts: Now, Based in, Open to, Focus). A case study is one click from the hero deck, and every case study opens with a 30-second "In short" (`case-studies/[slug].astro:72-77`). The two contact routes, the call and email, are never more than one click from any page through the fixed header's "Let's talk".

Most of the extra steps come from one thing: **the resume**. Its button opens a Google Drive folder, not a file. On a desktop the header does not link to it. A hiring manager who has just finished a case study has no resume link in front of them. The top five:

1. **The resume is a Google Drive folder, not a file.** `public/resume.pdf` does not exist, so every resume button falls back to `"fallbackUrl": "https://drive.google.com/drive/folders/1sWu8wfz28YeLLNz4agRaa_PD8B8a4sY5?usp=sharing"` (`src/content/site/config.json:18`, chosen in `src/content/site.ts:15-16`). Today: 3 steps (button, open the file in the folder, download) and a new tab. After: 1. This needs the owner's PDF, not a design change.
2. **There is no resume link in the desktop header.** On desktop the header holds the six navigation entries and "Let's talk" (`site-header.astro:39-52, 64`). The resume link exists only in the phone menu (`:82`). From most pages the route is the footer, then /resume, then Drive: 4 to 5 steps and a long scroll. After: 1.
3. **A case study ends without a resume link.** The closing panel offers the call and email (`case-studies/[slug].astro:173`), and the page hides the footer's call-to-action band (`:45`, `hideCta`). Today: a long scroll and 4 to 5 steps. After: 1, using the text link the Home closing panel already has (`home/closing.astro:31`).
4. **Two of the three featured case studies are hidden behind the deck's arrows**, on Home and on the hiring managers' website. The Work bento names only the other case studies, and as plain text, not links (`work-bento.astro:36-37, 110`). Today: 2 and 3 steps to open the second and third featured cases. After: 1 each.
5. **On a phone, the resume link sits after 14 menu links** (`site-header.astro:75-82`). Today: open the menu, then a long scroll inside it, then a tap. After: open the menu, then a tap.

The one **defect** is a link whose words do not match where it goes. "See the projects" opens the case studies list on Services, the clients' Home and About (`src/lib/routes.ts:4`: `'Work.dc.html': '/case-studies'`). That is WCAG 2.4.4, link purpose, under CLAUDE.md 2.1.

**Already in hand**: Posts (L-75). A post can now show its own text on the page. But none of the 12 real posts has text yet (`grep -c "^text:"` over `src/content/linkedin-posts/` finds it only in the stress fixture). So until the owner pastes the text, every post on /posts is still behind its "Load" button (`linkedin-post.astro:6-7`).

---

## 2. Ranked findings

Ranked by impact on the hiring manager first, then the client, then the reader. The NDA visitor is ranked as the hiring manager or client they usually are. "D" is a defect (it breaks a rule in CLAUDE.md section 2). "E" is an enhancement (taste; proposal only, CLAUDE.md section 1).

| # | Class | Journey | Page and source | Today | Proposed change | After | Rule touched | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | E (owner content) | Hiring manager: get the resume | Every resume button: `config.json:16-19`, `site.ts:15-23`; Home hero `hero.astro:29`; /resume `resume.astro:20-22` ("Open on Google Drive") | 3 steps and a new tab: button, open the file in the Drive folder, download | Add `public/resume.pdf`; the code already switches every button to a direct download when the file exists (`site.ts:15-23`, `resumeAttrs = { download: true }`). Second best: set `fallbackUrl` to a link to the file, not the folder. The legacy pages linked a file directly (`snapshot-tune.ts:17`, `uc?export=download&id=…`); whether that file is still current is [VERIFY] | 1 (direct download) | CLAUDE.md 2.9 ("Only truly static files go in public/"; a PDF qualifies); "Never invent content" | Privacy: the phone number may appear only in the resume file (CLAUDE.md, About the owner), so the owner checks the PDF before it goes in. No design change. Budget: the PDF downloads only on request |
| 2 | E | Hiring manager: get the resume from any page | Header `site-header.astro:39-52` (nav), `:64` (only "Let's talk"); nav in `site.ts:34-56` | From a project, blog post, posts, resources or similar page: a long scroll to the footer, "Resume" (`site.ts:62`, loads /resume), "Open on Google Drive" (new tab), then the file in the folder and download: 4 to 5 steps | Put the resume in the desktop header: either About becomes a group (About, Resume, Now), the way Work and Resources are, or a quiet "Resume" link sits beside "Let's talk" and goes to the file | 1 (2 with a group menu) | 2.8 (one primary CTA per view: the new link must not compete with "Let's talk", so a text link or a group entry, not a second button) | Design lock: the header is locked. `site-header.astro:109` notes that seven links fit only from 960 px, so an extra top-level link needs a measured check at 960 to 1023 px |
| 3 | E | Hiring manager: after reading a case study | Closing panel `case-studies/[slug].astro:165-177` (call and email only); `hideCta` on the layout `:45` | A long scroll to the footer, then the same route as #2: 4 to 5 steps | Add the resume as the third action, a text link under the two buttons, exactly as the Home closing panel does (`home/closing.astro:31`, `{resumeExternal ? 'View resume' : 'Download resume'}`). The same for the project page panel (`work/[slug].astro`, the "Next step" section) | 1 | 2.8 (L-59: on an ink panel, on-ink-solid and on-ink; a third action as a text link keeps one look per kind of action) | Design lock: a small addition using an existing pattern; needs a visual diff |
| 4 | E | Hiring manager: see the best proof | Home deck `case-deck.astro:13` (three featured), `:36` (only the first card is reachable, `aria-hidden` on the others), `:23-25` (arrows); bento `work-bento.astro:36-37` (leaves the deck's cases out), `:110` (names the others as plain text); hiring managers' Home `job/index.astro:25-26, 53` | Featured case 2: arrow and card, 2 steps. Case 3: 3 steps. A case named in the bento: card, /case-studies loads, find it, open it: 3 steps and a search | Under the deck, list the featured titles as links (the counter "01 / 03" already says there are three), or let the bento's list name and link all cases, the featured ones first. On the hiring managers' Home, the "More case studies" grid could include the featured ones the stack hides | 1 each | 2.7 (one primary link per card: the bento's titles cannot become links inside the card; a list beside the card, or a change to the card, is needed) | Design lock: the deck comes from Claude Design (`hero.astro:2`), and the hero stacks are the owner's request (L-76). The list must not push the hero facts below the first view on a 1280 × 720 screen (2.8, the 5-second rule) |
| 5 | E | Hiring manager on a phone: get the resume | Phone menu `site-header.astro:75-81` (14 links in groups), `:82` (resume after them); the sticky menu foot `:84-91`, `:143` | Open the menu, then a long scroll past 14 links (the sticky foot covers the end of the list), then the resume: 3 steps | Move the resume into the sticky foot beside "Let's talk", or to the top of the list | 2 | 2.4 (44 px targets, 8 px apart, in the foot) | Design lock: the menu foot's height is tuned (L-74); a third row in it must keep the list readable on a 600 px tall screen |
| 6 | E | Hiring manager: About, then the resume | About `about.astro:29-30` ("Full detail is in the resume", to /resume); /resume `resume.astro:33` | 1 page load to a page whose timeline is the same component with the same highlights (`<Career wide />` on About, `<Career level={3} />` on /resume, both with highlights on by default), then Drive: 4 steps | Point the link at the file ("Download the resume", the file itself), or label it for what /resume adds (summary, education, tools) | 1 | none (wording) | None beyond the wording; UX writing review rules apply (`docs/UX_WRITING_REVIEW.md`) |
| 7 | E | Hiring manager: finishes reading the resume page | `/resume` `resume.astro:12` (`hideCta`), actions only at the top `:19-24`; `/job/resume` `job/resume.astro:20` (`hideCta`) | After the last section (Certifications), a long scroll back to the top to download or email | Show the footer's call-to-action band on both resume pages (remove `hideCta`); it already holds "Book a 15-min call" and the resume (`site-footer.astro:28-41`) | 1 | 2.8 (one primary CTA per view: the band is the only call in its view) | Low: an existing component; visual diff on two pages |
| 8 | **D** | Hiring manager on About; client on Services and the clients' Home: see the projects | `src/lib/routes.ts:4` maps `Work.dc.html` to `/case-studies`; the link reads "See the projects" in `snapshots/services.json` (the AI product design offer) and `snapshots/about-direction.json` | The visitor lands on the case studies list, not the projects. Recovering takes 2 steps (back, then Work > My Projects) | Change only those two links: send "See the projects" to `/work` (a swap in `tuneSnapshot` or the page's `rewrite`, as `clients/index.astro:15` does), not the whole route map. `Work.dc.html` is also the "Work" link of the guide and Arabic snapshots, which should keep going to /case-studies | 0 extra | 2.1 (WCAG 2.2 AA; 2.4.4 Link purpose: the words name one page, the link opens another) | Low: an href only, no visual change. The snapshot is served as-is, so the change goes in the rewrite, not the snapshot (CLAUDE.md 5.2) |
| 9 | E | Hiring manager and client: send a message from /contact on a phone | `/contact` `contact.astro:10` (no `formFirst`); `contact-block.astro:94-100` (the form moves up only with `formFirst`), `:65` (the form after the intro) | Below 1024 px: a long scroll past "What happens next" (3 steps) and the facts (Based in, Availability, Elsewhere) to reach the form | Use `formFirst` on /contact, as `job/contact.astro:7` and `clients/contact.astro:7` already do: the form follows the call button, and the rest follows the form | 0 long scrolls | 2.6 (forms: unchanged); 2.8 (one primary per view: the call stays primary, and the form's submit is secondary, `submit="secondary"` at `:65`) | Low: an existing option. Note that `formFirst` also drops the "Email me" button and keeps the address with its copy button (`contact-block.astro:24, 50`) |
| 10 | E | Client: scope a project from the clients' Home | `clients/index.astro:43` (the snapshot page, `hideCta`); its closing panel holds the call and email only (`snapshots/services.json`, section `cta-title`) | Header "Let's talk" (loads /contact, form first), then the form: 1 page load before the first field | End the page with the contact block (`ContactBlock`, `formFirst`, `topic="project"`), in place of the snapshot's closing panel or under it | 0 page loads | 2.8 (one primary per view) | Design lock: the snapshot is the owner's Claude Design page (5.2), so the block goes in through the page's `rewrite`, as the hero already does |
| 11 | E | Client: proof for the AI product design service | `snapshots/services.json`, offer `offer-ai`: "See the projects" goes to /case-studies (the other two offers link a named case study) | 2 steps to an AI case: the list, then a card | Link the AI offer to the AI case study the owner names (for example `ai-ad-reel-pipeline` or `design-system-audit-skill`) [VERIFY which] | 1 | none | As #8: the rewrite, not the snapshot |
| 12 | E | NDA visitor (hiring manager or client): ask for access on a phone | Notice link `lib/private-work.ts:35` (`/private-work?from=…`, no anchor); page `admin/pages/private-work/index.astro:76-97` ("How it works" and "What is kept" before the form `#ask`), two columns only from 1024 px `:119` | Below 1024 px: a long scroll past two text blocks to the form | Below 1024 px, put the form before the two blocks (the `formFirst` order), or end the link with `#ask` on small screens only. On a desktop, the two columns already show the form on arrival | 0 long scrolls | 2.6 (form states unchanged) | Low. Privacy: "What is kept" must stay on the page and before the submit button; it can follow the form's heading as a short line with a link down to the full text |
| 13 | E | NDA visitor: a private design system | `cards/design-system-showcase.astro:72` (a system without a prompt: "Ask for a walkthrough", to /contact) | For a client system with private links, the visitor writes through the contact form, and the owner then has to send them to /private-work: an extra round trip by email | Where the system's project or case study is marked `nda`, link "Ask for access" to `/private-work?from=work/<slug>`; keep /contact for the rest | 1 request, no round trip | none | Content: only one real entry is marked `nda: true` today (`case-studies/design-system-audit-skill.mdx:17`); the freight project and its case study are not, although the project says "The client is not named here" (`projects/freight-design-system.mdx:38`). Which entries are under NDA is the owner's call [VERIFY] |
| 14 | E | Reader: copy a skill's prompt or install line | `cards/skill-showcase.astro:33` (the "Say this to start it" lines as quotes), `:53` (the Claude Code path in a code block); `cards/skill-card.astro:52` and `cards/plugin-card.astro:25` (install lines on /claude-skills); Home `work-bento.astro:121` | Select by hand: on a phone, press and hold, drag the handles, then Copy: about 3 steps, easy to get wrong | Add the copy control My Design Systems already uses (`design-system-showcase.astro:55-61`, run by `site-chrome.ts:121`, with "Copied" and a fallback that selects the text) | 1 | 2.7 (one primary link per card, no nested interactive conflicts); 2.6 (copied and blocked states) | Low on /skills and Home, where the cards are not whole-card links (`skill-showcase.astro`, the "mine" branch of `skill-card.astro:21`). On /claude-skills the install-line cards are whole-card links (`skill-card.astro:46`, `plugin-card.astro:20`), so a copy button there is a second control inside the card: it must sit above the stretched link and pass the keyboard walk, or the install line stays as text. Add the states to /_states (CLAUDE.md section 3) |
| 15 | E | Reader: find an AI tool by what it does | /ai-tools `ai-tools.astro:37` (filters), `:45` (`data-page-size="12"` over the grouped list), `:57` (Show more); `projects/project-filters.astro:33-44` (more than six categories go into a closed fold, at every width); compare `resource-list.ts:76` (the UX Library opens the same fold from 1024 px) | 12 categories, 52 tools, shown 12 at a time in category order: the first screenful holds Assistants (5) and part of UI generation (10). Reaching User research takes 3 "Show more" presses, Accessibility 4. Or 2 steps: open the Category fold, then a chip | Open the category fold from 1024 px, as the UX Library does, so a category is one tap; or put the category names as jump links above the list | 1 | 2.8 (twelve and "Show more" stays: L-59) | Low: brings the two directories into line |
| 16 | E | Reader: the UX Library on a phone | `resources.astro:52` (hero "Browse by category"), `:66-69` (the six fullest categories in the hero panel), `:83-90` (Made by me), `:92-99` (the category bento), `:101-110` (the list); `resource-filters.astro:35` (category chips again) | Categories are offered three times. On a phone, the list is after Made by me and the bento: a long scroll | Let the hero's main button go to the list's search ("Find a resource", focused, as the clients' AI tools page does in `clients/ai-tools.astro:20-28`), and keep the bento as the browse route | 1 to the search | 2.8 | Design lock on the page order; a proposal for the owner's taste |
| 17 | E | Reader: follow after reading a blog post | `blog/[slug].astro:32` (`hideCta`), `:66-79` (the end panel: "Email me" only); the social links are in the footer's small print (`site-footer.astro:56`) | A long scroll to the footer, then find LinkedIn, Substack or RSS among the small links | Add "Follow on LinkedIn" as the panel's second action (on-ink), as /posts and /articles already put it first (`posts.astro:25`, `articles.astro:59`) | 1 | 2.8 (L-59: on an ink panel, on-ink-solid and on-ink) | Low |
| 18 | E (owner content) | Reader: choose an article | /articles `articles.astro:51, 67`; entries hold a title and a link only (`linkedin-articles/trust-before-intelligence.yaml:1-2`) | Each article is judged from its title alone, then read on LinkedIn: 1 step that leaves the site | An excerpt line per article (written by the owner), so a reader chooses before leaving; later, the article on the page the way L-75 does for posts | 1 (better informed) | "Never invent content": excerpts are the owner's to write | Content only |
| 19 | E | Reader: Home "Everything to read" | `home/in-public.astro:120` (goes to /blog) | Posts and articles, which sit in the same "Latest posts and articles" group, are on other pages: 2 steps (blog, then Writing > Posts) | Label it "All blog posts", or point it at a page that holds all three (none exists today) | 1 | none (wording) | Low |

---

## 3. Journeys, step by step

### 3.1 Hiring manager (Saudi Arabia or the UAE, Senior, Lead or Principal AI Product Designer)

**Lands on Home (`src/pages/index.astro`).** Sections in order (`index.astro:32-40`): Hero, Worked with, Work bento, Point of view, Two users, Skills, In public, Now, Closing.

| Goal | Steps today | Where |
| --- | --- | --- |
| Judge the level in 5 seconds | 0. The title "I design AI products people can trust", the lead "a {profile.headline} with 13+ years", and four facts | `hero.astro:25-39` |
| See proof (a case study) | 1: the deck's front card ("Read the case study"). Or 2: "Read the case studies" (loads /case-studies), then a card. Featured cases 2 and 3: 2 and 3 steps (finding 4) | `case-deck.astro:38`; `hero.astro:28` |
| Read the case quickly | 0 more: "In short", a 30-second read, is the first section | `case-studies/[slug].astro:72-77` |
| Get the resume | From the hero: 3 steps and a new tab (finding 1). From a case study: a long scroll and 4 to 5 steps (findings 2 and 3) | `hero.astro:29`; `config.json:18` |
| Book a call | 2 steps on the site: header "Let's talk" (loads /contact), then "Book a 15-min call" (cal.com in a new tab, where cal.com asks for a time and details). Or 1 from the Home closing panel, after a long scroll past 7 sections, or from a case study's closing panel | `site-header.astro:64`; `closing.astro:18`; `case-studies/[slug].astro:173` |
| Email | 1: "Email me" (mailto) or the copy button beside the address | `closing.astro:19-28`; `contact-block.astro:50-52` |

On a phone under 480 px the header's "Let's talk" is hidden (`site.css:182`), so the call takes one more step: open the menu, "Let's talk" in its sticky foot (`site-header.astro:90`), then the call. That is fine and stays.

**Lands on the hiring managers' website (`src/pages/job/index.astro`).** The hero's main button is the call and the second is the resume (`:51`). The four facts include "Open to: Design Lead or Principal roles, KSA, the UAE or remote" (`:46`). The header holds Resume as a page (`lib/sites.ts:34`). Proof: the stack's front card is 1 step, and featured cases 2 and 3 are behind arrows (`:53`, finding 4). "More case studies" lists the others as cards, 1 step each (`:56-64`). Resume: 1 step from the hero, then the Drive folder (finding 1). From the header: Resume (loads /resume), "Open on Google Drive", then the folder: 3 to 4 steps. A case study on this website is the main site's page (`job/case-studies/[slug].astro:4`), so findings 3 and 12 apply here too.

**Total today, Home to "has the resume and has booked a call", the shortest path:** deck card (1), read, then a long scroll to the footer, Resume (2), Open on Google Drive (3), file (4), download (5), back, "Let's talk" (6), Book (7). **After findings 1 to 3:** deck card (1), the resume link in the case study's closing panel (2), Book in the same panel (3).

### 3.2 Client

**Lands on the clients' website (`src/pages/clients/index.astro`)**, the Services page with its own first screen. The hero's main button is "Book a 15-min call", and the second is "How I work", which jumps to the process (`:44`). The stack shows the three services and jumps to each one's "What you get" (`:28`).

| Goal | Steps today | Where |
| --- | --- | --- |
| Understand the services | 0 to 1: the stack's front card, or a long scroll through three offers, each with "Good fit when" and "What you get" | `snapshots/services.json` (`offer-ai`, `offer-ds`, `offer-audit`) |
| See proof | AI product design: 2 (the list, then a card) and the link says "projects" (findings 8 and 11). Design systems: 1 ("Read the Colaberry case study"). Audit: 1 ("Read the freight platform case study") | `services.json` links, rewritten by `routes.ts:16-31` |
| Questions before writing | 1 per question: three FAQ folds (Full-time or project, What you need from us, How you hand off) | `services.json`, three `<details>` |
| Scope a project in writing | 1 page load, then the form: "Let's talk" (loads /contact with the form first and the topic set to a project), then 3 required fields and Send (finding 10) | `clients/contact.astro:7`; `contact-form.astro:14-18` |
| Book a call | 1 (the hero or the closing panel) | `clients/index.astro:44` |

**Lands on the main site's Home as a client.** Home no longer has a services teaser (L-69, `index.astro:6`). The way across is the bar of websites at the top, "For clients", 1 step (`site-switch.astro`). /services is linked only from the footer ("About and more", `site.ts:62`). That stays: the clients' website is the client's door.

### 3.3 Reader and peer

| Goal | Steps today | Where | Note |
| --- | --- | --- | --- |
| Read a LinkedIn post | 1 per post ("Load"), then LinkedIn's frame loads | `linkedin-post.astro:6-7` | 0 once the owner pastes the text (L-75) |
| Read an article | 1, leaves the site (LinkedIn, new tab) | `articles.astro:57` ("Each one opens on LinkedIn, in a new tab") | Finding 18 |
| Read a blog post | 1 (a card) | `blog/index.astro` | Stays |
| Watch a video | 1 (play; YouTube loads only then) | `youtube.astro:1-3` | Stays (2.9) |
| Find a resource (UX Library) | Hero "Browse by category" (jump), a tile (the list filtered, no reload: `resource-list.ts:88-97`), then the resource (new tab): 3. Or a long scroll to the list and the search | `resources.astro:52, 92-110` | Finding 16 |
| Find an AI tool by use | Open the Category fold, then a chip: 2. Or up to 4 "Show more" presses | `project-filters.astro:33-44`; `ai-tools.astro:45, 57` | Finding 15 |
| Use one of the owner's skills | "See the skills" (jump), Download (1), then the install steps in Claude. Copying the prompt or path: by hand | `skills.astro:28`; `skill-showcase.astro:33, 43, 53` | Finding 14 |
| Build with one of the owner's design systems | 1: the copy button, then paste into Claude | `design-system-showcase.astro:55-61` | Already one step; the model for finding 14 |
| Install a skill from /claude-skills | Copy the install line by hand | `skill-card.astro:52`; `plugin-card.astro:25` | Finding 14 |
| Follow or subscribe | 1 from /posts, /articles ("Follow on LinkedIn") or /videos ("Subscribe on YouTube"). From a blog post: a long scroll to the footer's small links | `posts.astro:25`; `videos.astro:99`; `site-footer.astro:56` | Finding 17 |

### 3.4 NDA visitor

Today only one real entry is marked `nda: true`: the case study "A design system that audits its own product" (`case-studies/design-system-audit-skill.mdx:17`). /private-work is linked from nowhere else (`grep private-work src/pages` finds only `case-studies/[slug].astro` and `work/[slug].astro`).

| Step | Action | Where | Count |
| --- | --- | --- | --- |
| 1 | On the case study, the notice under the lead: "Live links and prototypes are available to approved visitors. Ask for access" | `nda-notice.astro:10`; `case-studies/[slug].astro:53` | 1 (loads /private-work) |
| 2 | On a phone, a long scroll past "How it works" and "What is kept" | `private-work/index.astro:76-97` | 1 long scroll (finding 12) |
| 3 | The form: Your name, Work email, Company, Your role (required), "What would you like to see?" (optional, already filled with the case study's name from `?from=`), the confidentiality box | `request-form.astro:32-38, 82`; `private-work/index.astro:49-52` | 5 inputs (the reason is prefilled) |
| 4 | Send the request | `request-form.astro` (submit) | 1 |
| 5 | Wait for the owner's decision; the email with the link | L-78: until the domain and Resend are set up, "the admin shows the sign-in link once for the owner to send himself" | Owner's step; adds delay |
| 6 | Open the link, press "Continue to the private work" | `enter-panel.astro:27-31` | 2 |
| 7 | The private links page; open a link (new tab) | `private-links.astro` | 1 |

About 11 visitor actions and the owner's approval. Findings 12 and 13 save a long scroll and an email round trip. The rest is deliberate (section 4).

---

## 4. What deliberately stays

These steps are there on purpose. Removing them would break a rule, the owner's privacy decisions, or a performance budget.

- **YouTube loads only on play** (`youtube.astro:1-3`). CLAUDE.md 2.9: "YouTube and LinkedIn load only on user interaction." One press per video is the minimum.
- **A LinkedIn post without its text keeps its "Load" button** (`linkedin-post.astro:6-7`). Same rule, and the owner's decision of 4 November 2026: nothing is read from LinkedIn. The way to zero steps is the owner pasting the text (L-75), not loading the frame up front.
- **The private work request stays a request.** The owner approves each visitor (L-78). The required fields (name, work email, company, role) are what he decides on ("A company address helps me see who is asking", `request-form.astro:34`). The confidentiality box is the visitor's agreement.
- **The extra "Continue" press on the sign-in link** (`enter-panel.astro:2-4`): "Email programs and link scanners open links to check them, and a link that signed in on opening would be used up before the visitor ever saw it."
- **"What is kept, and for how long" stays on the request page** (`private-work/index.astro:86-90`). It is the privacy notice for the form. Finding 12 moves it, it does not remove it.
- **The contact form asks for three things** (name, email, message) plus an optional topic that the audience websites fill in (`contact-form.astro:14-18`). It is already as short as a reply allows.
- **"Show more" after twelve** on the UX Library, AI tools, Posts and the directories (CLAUDE.md 2.8, L-59). Without JavaScript the whole list shows.
- **The hero stacks on list pages repeat the owner's picks above the full list** (L-76, the owner's request). On a phone they add one card's height before the list. They stay as asked.
- **"Let's talk" goes to /contact, not straight to cal.com.** /contact offers the call, email and the form, and says what happens next. A visitor who does not want a call is not sent to a calendar.
- **The case study's "On this page" folds on small screens** (`case-studies/[slug].astro:64-68`). It is navigation, not content.
- **The three FAQ folds on Services**, and the "Courses completed" fold on About (`about.astro:53`). Each is the long tail of a page, closed so the first screen holds few choices (CLAUDE.md 2.11's pattern, applied to the public site).
- **Snapshot pages** (Services, the clients' Home, parts of About, the guide, the Arabic pages) are served as the owner designed them in Claude Design (CLAUDE.md 5.2). Findings 8, 10 and 11 change them through the page's `rewrite` or `tuneSnapshot`, never by editing the snapshot.

---

## 5. Suggested order of work, if approved

1. The owner adds `public/resume.pdf` (finding 1). That shortens every resume route on the site with no code change.
2. Finding 8 (the defect), then 3, 7 and 9: small, existing patterns, low risk.
3. Findings 2, 4 and 5: header, deck and phone menu, under the design lock. Each needs a proposal drawn in the site's tokens, with screenshots at 320, 390, 960, 1024 and 1280 px in both themes.
4. Findings 12 to 17: reader and NDA improvements that use components the site already has.
5. Findings 18 and 19, and the posts' text (L-75), are the owner's writing.

Each change, when approved, gets its row in docs/AUDIT_FINDINGS.md (L-79 onward), its states on /_states, and a passing `npm run quality` before it is called done (CLAUDE.md section 3).
