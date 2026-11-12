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

## 5. Second pass: every page, and the metadata (11 November 2026, L-64)

The owner: "you are an Senior UX writer, i need you to improve the overall writing across pages titles, paragraphs etc." and "meta data also". All 80 public English pages were read again from the production build (metadata, structured data, headings, leads, paragraphs, labels, states, image alt text and the share cards). The bar is unchanged: credible, specific, calm, written for hiring managers, never promotional; nothing invented. The long-form bodies of case studies, projects and posts are specific and in the owner's voice, so they were read for faults only.

### Metadata

| # | Where | Finding | Change |
|---|---|---|---|
| W-12 | Six case studies and one project | The entry's own SEO title carried its kind and the template added it again: "One kit, five brands · Case study · Case study · AIUXAleem", "Loan onboarding on a design system · Fintech case study · Case study", "Walk-in drive poster · Project · Work". | The kind is the template's alone. `check-seo.mjs` now fails a title that names a part twice (`title-repeat`), so an entry published from the admin cannot bring it back. |
| W-13 | Project pages, /work | Titled "Work" while the menu calls them My Projects and the page heading is Projects. | "Projects · AIUXAleem"; each project "… · Project · AIUXAleem". |
| W-14 | Home, About, Contact | The titles hiring managers search for carried the brand only ("AIUXAleem · Lead AI Product Designer", "About · AIUXAleem"). | "Mohammad Abdul Aleem, Lead AI Product Designer · AIUXAleem", "About Mohammad Abdul Aleem · AIUXAleem", "Contact Mohammad Abdul Aleem · AIUXAleem". |
| W-15 | Share images | Every `og:image:alt` repeated the page title, which says nothing about the picture. Several share cards still carried the retired labels "My recent work", "My resources", "My videos" and "AI Tools", the Services card said "Three ways to work together." while the page says "Three things I can do for your team.", and the two skills pages had no card of their own. | The alt text says what the card shows (its title, then the name line under it); the labels follow the menu; the skills pages have their own cards. |
| W-16 | Descriptions | Mixed person in search results ("What I can do for your team", "plus my own"), filler ("New recordings are listed here as they are published"), two descriptions under 90 characters, "KSA, UAE and anywhere", and three over 165. | Third person throughout, each one specific to its page and drawn from it, all between 50 and 165 characters. The footer and the structured data share the Home line. |
| W-17 | Blog | Post titles in title case beside sentence case everywhere else; the component-spec guide's title lacked "Blog". | Sentence case ("How I build one LinkedIn infographic a day"); the guide is "… · Blog · AIUXAleem". |

### Pages

| # | Where | Finding | Change |
|---|---|---|---|
| W-18 | Footer, overlines | "My Videos" in the footer beside "Videos" in the header; overlines "My recent work · Projects" and "My videos" from before the menu changed. | "Videos"; "Work · Projects", "Work · Case studies". |
| W-19 | Home, Services, the client website, the spec guide | Service names in title case ("AI Product Design", "Design System Build"); "consume" for what people do with a design system, where the rest of the site says "build from"; "KSA and UAE" beside "KSA and the UAE"; "doesn't feel trustworthy yet", the "feel" retired in W-5. | Sentence case; "build from"; "KSA and the UAE"; "people don't yet trust the product around it". |
| W-20 | Home, "In public" | The lead put reels on LinkedIn while the panel beside it puts them on Instagram. | "Long-form videos on YouTube, short reels on Instagram, and articles and post series on LinkedIn." The heading names all three. |
| W-21 | About, principles | Lists dropped into the middle of a clause between commas ("Every AI state, thinking, unsure, wrong, recovering, gets…", "Everything I know, design, systems, …, goes into…"); "the fastest way to make AI output readable by everyone", a claim no one can check; "Businesses that last"; the portrait's alt text "Portrait". | The list after a colon; "It also makes AI output usable by more people"; "The business around the product"; "Portrait: Mohammad Abdul Aleem". |
| W-22 | Dates | British English short months now print "Sept", so posts and roles read "29 Sept 2026" and "Sept 2015" beside "Sep 2025" and "Sep to Oct 2026". | "Sep" everywhere (five formatters). |
| W-23 | Blog topics | Two tags for one topic, "Laws of UX" and "UX laws". | "UX laws". The site's proper name, Laws of UX, stays where the text means the site. |
| W-24 | Forms | "Name, email and message are needed." | "… are required.", the word every form uses. |
| W-25 | Case studies | "Each case below is that method applied to a different kind of trust problem" (a hiring poster is not a trust problem); "the work people actually request". | "Each case study below applies that method to a different problem"; "the work people request most". |
| W-26 | My Claude Skills, Claude Skills | A skill said twice that it is not offered as a download; directory picks opened with a command ("Let an agent…", "Edit Canva designs…") beside others that describe ("Steers…"); "Here: the ones I would hand a designer…"; a link's hidden text read "Read the SKILL.md first of …". | One sentence for the case-study skill; every pick describes what it does; plain sentences; "Read the SKILL.md first: <name> (opens in a new tab)". |

Not changed, on purpose: case study, project and LinkedIn titles (the owner's content, and LinkedIn's own titles are what a reader finds there); the Arabic pages; "Let's talk", "Book a 15-min call" and "Email me" (W-9's hierarchy); a quoted prompt in a post.
