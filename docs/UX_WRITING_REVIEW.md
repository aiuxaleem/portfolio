# UX writing review (5 November 2026)

Owner's request: "do UX writing review of entire website and make changes", alongside the "Human + Agent" positioning (row L-53 in `docs/AUDIT_FINDINGS.md`). Every public English page was read from the production build (54 pages: title, description, headings, leads, overlines, every action label, form labels, states, badges and image alt text; the inventory script is in the session's scratch folder and the method is repeatable from `dist/`). The Arabic pages were not reviewed: their copy needs a native reader. The admin was not in scope.

The bar is CLAUDE.md's: credible, specific, calm, written for hiring managers, never promotional. Three laws did most of the work: Jakob's (a label should mean what it means everywhere else), Hick's (fewer, more distinct choices) and the plain rule that one thing has one name.

## 1. What was good and left alone

- The voice is consistently first person and concrete: "A new brand is a token file, not a rebuild", "Understand the workflow, redesign it, build it with AI, validate it with people".
- Every empty, loading and error state says what happened and what to do next: the embed facades ("The post didn't load here. Your network may block LinkedIn embeds. Use the link above to read it on LinkedIn, or try again."), the form ("Your message was not sent. The form service did not answer. What you typed is still in the form."), the empty tag page.
- Links that leave the site say so ("opens in a new tab", "opens chatgpt.com in a new tab"), and the external icon buttons carry their destination in the name.
- Counts and filters are honest and specific: "Showing 12 of 52 resources", "13 posts", "10 earned, 2 in progress".
- Image alt text describes the picture and its data ("Family check: the same card, button and input shown side by side in five brands").
- The case-study scaffolding ("In short", "Problem and context", "Key decisions and trade-offs", "What shipped, and who uses it", "Reflection") is the same on every study, so a reader learns it once.

## 2. Findings and changes

| # | Where | Finding | Rule | Change |
|---|---|---|---|---|
| W-1 | Header, footer, sitemap, every page's overline | Two groups were both called resources: "My Resources" held the blog, posts and articles, and "Resources" held the library and the AI tools. "My Recent Work", "My Videos" and "About me" carried a "My" that no other label did, and "Blogs" named one blog in the plural. Title case ("Case Studies", "AI Tools") sat beside sentence case everywhere else. | Hick's law; one name for one thing; the site's sentence case | Groups are now **Work** (Projects, Case studies), **Writing** (Blog, Posts, Articles), **Videos**, **Resources** (UX Library, AI tools) and **About**. The footer's last column is "About and more" so its first link can be "About". The sitemap follows the header by code. |
| W-2 | /resources, its nav label, the admin section, the client website | The page was called "UX Glossary". A glossary is a list of terms with definitions; this page is a library of tools, references, reading and the owner's own workflows, and its own copy says "In the library". A visitor opening a glossary and finding a tools directory has been misled by the label. | Jakob's law (a label means what it means everywhere) | Renamed **UX Library** everywhere the label appears: the header and footer, the page's title, overline and h1 ("The UX library for AI product design."), the client website's copy, the AI tools page's empty state, the admin's section name and the share image. The address `/resources` is unchanged, so no link breaks. |
| W-3 | Home hero, share image | "I design AI products people actually trust": "actually" is a defensive intensifier, the kind of word a promotional voice reaches for. | Never promotional | "I design AI products people **can** trust." The two coloured words (AI, trust) are unchanged. |
| W-4 | About hero, share image | "I make AI feel like something you can rely on." The owner's own principle is "Trust is designed, not declared"; "feel like" claims the appearance of reliability, not the thing. | Credible, specific | "I make AI products people can rely on." |
| W-5 | Home closing panel, every project page, About, the client website, the Services page | The recurring closing question "Have a product that needs to feel trustworthy?" and "Hiring, or building something that needs to feel trustworthy?" had the same "feel". | Credible | "Have a product people need to trust?" and "Hiring, or building something people need to trust?" |
| W-6 | Home, About, Services | The same object had three names: "Read the design system case", "Read the Colaberry case", "Read the freight platform case" beside "Read the case study" everywhere else. | One name for one thing | Each is now "… case study". |
| W-7 | Home, project pages, 404, About | List links mixed "See the work", "See every post", "All projects", "All case studies", "All work" (on a page whose heading is Projects). | One pattern for one action | Links to a list say "All …" ("All posts", "All projects"); the 404 and About buttons say "See the projects", matching the page they open. |
| W-8 | Home "In public" | The blog teaser's overline said "Latest guide", but the blog holds guides and articles and is called Blog. | One name | "Latest from the blog". |
| W-9 | Services | "Hiring a Lead AI Product Designer? That's me." and "Need it designed and built, not just advised? Also me." The patter is the one promotional note on the site. | Never promotional; calm | The two questions stand on their own; the paragraphs under them already answer. |
| W-10 | Blog tags | Tags came in two cases ("Design systems", "Design Tokens", "AI-Assisted Development", "AI-assisted design"), so the topic filter showed near-duplicates. | Consistency | Sentence case throughout ("Design tokens", "AI-assisted development"). Tag addresses are unchanged (they are lower-cased already). |
| W-11 | Home hero facts | "Focus: AI products and design systems" no longer said what the owner designs for. | Positioning (L-53) | "AI products, agents and design systems". |

Not changed, on purpose: the case study and project titles (content, the owner's); the blog post titles in title case (content); "Let's talk" as the primary call (it is short, consistent and already the brand's line); "Book a 15-min call", "Email me" and "Send message" as the three ways in (a clear hierarchy, not duplication); the Arabic navigation (kept as the legacy labels until a native reader reviews them).

## 3. What the "two users" positioning added

- **Home**: a new section after the point of view, built from the site's tokens: the line "User Experience Design" with "User" struck out and "Human + Agent" written above it, the heading "Two users now: the person, and the agent acting for them.", a lead, three checks in the owner's words, a link to the piece and a note that the site itself is readable by an agent.
- **About**: a sentence in the summary, the AI product design expertise extended with the handoff, and a fifth step in the method, "Design for both users".
- **Blog**: "Two users now: the person, and the agent acting for them" (`/blog/designing-for-two-users`), the owner's view at length, crediting Nielsen Norman Group's "Experience Design: Dropping the 'User' from 'User Experience'" (Raluca Budiu, 30 October 2026) for the field's move.
- **For agents**: `/llms.txt`, a plain-text index of the site built from its content, so what the site says about agents is also true of the site.

## 4. Evidence

- `astro check`: 0 errors, 0 warnings.
- `node scripts/quality/check-seo.mjs`: PASSED (titles, descriptions, canonical and alternate links, structured data, the sitemap, the new post and its tag pages).
- `node scripts/motion/check.mjs`: PASSED, sections 1 to 7, with the new Home section among the heads.
- `check-writing.mjs`, `check-projects.mjs`, `check-case-studies.mjs`, `check-blog.mjs`, `check-brand.mjs`: run on the same build and read by hand; the header menu reads Writing, the Home order carries the new section, no heading skips, no overflow at 390 px.
- `npm run quality:quick`: PASSED, 0 failures, 448 views (6 November 2026).
- Pixel comparison with the previous build: 97 of 106 shared sampled views differ, every one explained by the renamed header and footer on every page and by the content added; read as a list, not a pass (`docs/VERIFICATION_REPORT.md` section 16).
- Read back from the build: 0 "UX Glossary", 0 "My Resources", 0 "Blogs", 0 "actually trust", 0 "feel trustworthy" on any public English page.
