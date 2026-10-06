# Content guide

How to add and change content on aiuxaleem.com. Written for you as the designer and owner: no code is needed for any of this.

There are two ways to edit, and they change the same files:

- **The editor**, in the browser. Best for most edits.
- **The files**, in `src/content/`. Best when you want to paste a lot of text or work offline.

## Start the editor

1. Open a terminal in the project folder and run `npm run dev`.
2. Open `http://localhost:4321/keystatic` in your browser. It opens the editor.
3. Pick a collection on the left, open an entry or press **Create**, edit, and press **Save**.

Saving writes a file in `src/content/`. The site at `http://localhost:4321` updates at once, so you can check the page before you publish.

The editor runs on your own computer only. It is not on the live site. Publishing is covered in `docs/DEPLOYMENT.md`.

## Two switches on every entry

- **Draft:** the entry is never published. Use it while you are writing.
- **Stress fixture:** test content with very long titles and missing fields. Never published. Leave it off for real content.

## Rules that the build enforces

- **Every image needs alt text.** Describe the image for someone who cannot see it. The build stops if it is empty.
- **No placeholders on a public page.** If a published entry still contains `[VERIFY]` or `[METRIC: ...]`, `npm run quality` fails and names the page. Keep an entry as a draft until its facts are confirmed.
- **Numbers need a source.** A case study metric is shown as a figure only when its **Verified** box is ticked. Fill in **Source** (how and when it was measured) first.
- **A testimonial needs permission.** It cannot be published until the permission box is ticked.

## Add a blog post

In the editor: **Blog posts → Create**.

In the admin area (`/admin` on the live site, **Blog posts → New post**) the text box of a new post starts with a suggested layout: an opening, then The problem, What I did, What happened, What I would do differently and Try it yourself. Each part holds a note in square brackets that begins `[WRITE:` and says what belongs there. Replace each note with your own words and delete any part you do not need. A post cannot be published while a note is left, while its text has a mistake the site cannot build, or while it names a picture that is not in the repository; the editor says which.

| Field | What to write |
| --- | --- |
| Title | The headline. The page address comes from it (`/blog/your-title`). |
| Subtitle | One line under the headline. Optional. |
| Excerpt | One or two sentences. Shown on cards, in the feed and in search results. Required. |
| Category | One or two words, for example "Design systems". Optional. |
| Published / Updated | Dates. Leave Published empty if you do not know it; nothing is invented. |
| Cover | Image and alt text. Optional: a post without one gets a typographic cover. |
| Tags | Topics. Each tag gets its own page at `/blog/tag/...`. |
| Canonical URL, Originally published elsewhere | Only for a post you first published on another site (see "Republish a LinkedIn article" below). |
| Body | The post itself. |

In the body, type `/` on an empty line to insert a block. The list shows 18 blocks at a time, so keep typing to narrow it: `/you` brings up the YouTube block, which is otherwise below the fold of the list.

- **Heading 2, Heading 3:** use them in order. The page title is the only Heading 1.
- **Image**, or **Image with caption**.
- **Gallery:** two or more images in equal tiles.
- **Callout:** a note or a warning.
- **Blockquote, Code block, Table:** code and tables scroll sideways inside their own box on a phone.
- **YouTube video, LinkedIn post, LinkedIn article:** see "Embeds" below.

By file: create `src/content/posts/your-title.mdx`. The top of the file holds the fields; the text below it is the body.

```mdx
---
title: Your title
excerpt: One or two sentences.
published: 2026-11-02
tags: [Design systems]
cover:
  src: ../../assets/posts/your-cover.jpg
  alt: What the image shows
---

The first paragraph.

## A heading

<Callout title="Note">
Text of the note.
</Callout>
```

## Add a case study

In the editor: **Case studies → Create**. Every section is optional. The page shows only the sections you fill in, and the table of contents lists exactly those.

- **Subtitle:** the outcome in one sentence. What changed, not what was made.
- **Meta:** role, company (or tick "Show the company as Confidential"), timeline, team, platform, tools.
- **NDA notice:** tick it to show the notice at the top.
- **In short:** three to five lines for a reader with thirty seconds.
- **Problem and context, Research, Process, AI section, Key decisions, Outcomes, Reflection:** fill in what applies.
- **Before and after comparison:** two images of the same screen. Visitors compare them with a slider or two buttons.
- **Outcomes → Metrics:** up to four. Each has a value, a label, a source, and a Verified box. Unverified metrics are not shown as figures.
- **Featured on the home page:** tick it to show the case study in the home page's "Featured case studies" section.
- **Order:** lower numbers come first.

By file: `src/content/case-studies/your-title.mdx`. Copy `colaberry-design-system.mdx` as a starting point.

## Add a project

In the editor: **Projects → Create**.

- **Status:** In progress, Shipped or Concept. Projects marked In progress appear in the home page's "Current projects" section.
- **Summary:** up to 220 characters. Shown on the card.
- **Links:** live site and repository. Each becomes a button.
- **Related case study:** the last part of the case study's address, for example `colaberry-design-system`.
- **Gallery:** images with alt text and optional captions.

By file: `src/content/projects/your-title.mdx`.

## Add an update to a project

Open the project in the editor, find **Updates log**, press **Add**, and fill in the date, a title and a short note. Save. The project page lists updates newest first.

By file: add an item under `updates:` in the project's file.

```yaml
updates:
  - date: 2026-11-02
    title: Dark theme shipped
    body: All components now have a dark variant.
```

## Add a YouTube video

In the editor: **YouTube videos → Create**.

- **YouTube id:** the 11 characters after `v=` in the video's address. For `https://www.youtube.com/watch?v=AbCdEfGhIjK` the id is `AbCdEfGhIjK`.
- **Published, Duration, Description, Tags:** all optional, but a video needs a description and a date to get search markup.
- **Poster:** optional. Without one the video shows a typographic cover.

The video appears on `/videos`, and the newest one on the home page. Nothing loads from YouTube until a visitor presses play.

By file: `src/content/videos/your-title.yaml`.

## Add a LinkedIn post

In the editor: **LinkedIn posts → Create**. Fill in the title (the first line of the post works well), the link to the post, the date, and optionally the series it belongs to and tags. It appears under **LinkedIn posts** on the Read page (`/read`), newest first, six to a page.

**Let visitors load this post on the page** is ticked for a new post. The card then has a button that shows the post itself, from LinkedIn, without leaving the site. Nothing is loaded from LinkedIn until a visitor presses it. It needs the link LinkedIn gives you under the post's menu, **Copy link to post**, because that link carries the post's number. Untick the box and the card is a title and a link only.

By file: `src/content/linkedin-posts/your-title.yaml`.

```yaml
title: "8 books I'd recommend to any designer moving into AI product design"
url: https://www.linkedin.com/posts/aiuxaleem_...
published: 2026-10-01
series: "AI x UX book series"
embed: true
```

## Add a LinkedIn article

In the editor: **LinkedIn articles → Create**. Title, link, and if you have them the date and an excerpt. It appears under **LinkedIn articles** on the Read page (`/read`) and opens on LinkedIn.

By file: `src/content/linkedin-articles/your-title.yaml`.

### Republish a LinkedIn article on your own site

Create a blog post with the full text, then fill in **Originally published elsewhere** (site name, link, date) and set **Canonical URL** to the LinkedIn address. The post shows an "Originally published on LinkedIn" note, and search engines are told the LinkedIn version is the original.

## Embeds inside a post, case study or project

Type `/` in the body and choose one.

- **YouTube video:** the id and a title. Shows a cover and a play button; the video loads on click.
- **LinkedIn post:** the post's URN, its link, a title and an excerpt. Shows a card with a "Load the post here" button. If LinkedIn is blocked on the visitor's network, the card stays with its link.
- **LinkedIn article:** a link card. LinkedIn does not allow articles to be embedded, so nothing loads from LinkedIn.

### Get a LinkedIn post's URN

1. Open the post on LinkedIn.
2. Press the three dots at the top right of the post and choose **Embed this post**.
3. LinkedIn shows a block of code. Inside it is an address like `https://www.linkedin.com/embed/feed/update/urn:li:share:7511236061377748993`.
4. Copy the part that starts with `urn:li:`. That is the URN. It begins with `urn:li:share:`, `urn:li:activity:` or `urn:li:ugcPost:`, followed by a long number.

If the menu has no "Embed this post", the post is not public and cannot be embedded. Use the link card instead.

## Profile pages: About, Resume, Now, contact form

In the editor: **Profile (About, Resume, Now, contact form)**. One file feeds all four pages.

- **Career:** one entry per role, newest first. Roles at the same company are grouped on the page.
- **Note to self** fields hold things you still need to check. They are never shown on the site. `/_states` lists them all.
- **Now page:** set "Last updated" when you change the list.
- **Contact form:** paste your Formspree form id (the part after `formspree.io/f/`). The form appears on `/contact` once the id is set.

Certifications are their own collection: **Certifications → Create**. Status "In progress" puts one on the Now page.

Site-wide settings (availability line, email, calendar link, social links, resume PDF path) are under **Site settings**.

### Resume PDF

Save the PDF as `public/resume.pdf`. The download button on `/resume` appears when the file exists and is hidden when it does not.

## Image sizes

Upload one good original. The build makes the smaller sizes and the WebP versions.

| Image | Size to upload | Notes |
| --- | --- | --- |
| Cover (post, project, case study) | 1,600 px wide, 16:9 or wider | JPEG or PNG. Keep the important part away from the edges: cards crop to a fixed shape and show the top of the image. |
| Screenshot in a body or gallery | 1,600 px wide | A full screen at its real proportions. |
| Before and after | Two images of the same size | Same screen, same crop. |
| Portrait | 840 px wide, 4:5 | |
| Certificate thumbnail | 720 px wide | |
| Testimonial photo | 176 px square | |

Keep an original under about 500 KB. Do not put text that matters inside an image; write it in the page.

## Check your work

- **Look at the page** at `http://localhost:4321` in light and dark theme, and narrow the window to phone width.
- **Open `http://localhost:4321/_states`.** It shows every component in every state, in both themes, with stress content, plus the list of facts still to check. It exists only on your computer.
- **Run `npm run quality`** before you publish. It builds the site and checks every page at ten screen sizes in both themes. It takes about half an hour. It must end with `PASSED`.
