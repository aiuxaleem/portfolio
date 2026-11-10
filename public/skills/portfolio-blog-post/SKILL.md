---
name: "portfolio-blog-post"
description: "Turn a project, build or process into a post for Aleem's portfolio blog (aiuxaleem) plus a LinkedIn article copy, in his blog template, with admin fields and a copy page."
---

# Portfolio blog post + LinkedIn article

Use when Aleem asks to write up something he built or did (a project, a workflow, a case study, a lesson) as a blog post for his portfolio, a LinkedIn article, or both. Also use when he says "turn this into a blog post", "write an article about this", or "format this for my blog".

The output is one post that works in two places: his portfolio admin (Markdown body + form fields) and a LinkedIn article (formatted paste). The blog is the original; LinkedIn gets the copy.

## Step 1: Ground it in real facts

1. Read his project memory before drafting: topics/linkedin-profile.md, profile.md, areas/career-search.md and areas/personal-brand.md. Use his real roles, projects and numbers. Use "13+ years" for experience.
2. Gather the material from the conversation: what he built, the order it happened, the tools, what went wrong, what fixed it.
3. Never invent facts, numbers, quotes, tools, features or outcomes. If something is unclear (for example, which backend he used, or whether a feature shipped), write it cautiously and list it under "Check before publishing" in the reply. If a section needs a figure he has not given, ask or leave the figure out.

## Step 2: Write in his blog template

Always use this structure, in this order. Drop a section only if there is truly nothing for it.

- **Opening (no heading):** open with the point. Two or three sentences on who this is for and what they will be able to do after reading.
- **## The problem:** what was going wrong, for whom, and why it mattered. One real example beats a general statement.
- **## What I did:** the approach, in the order it happened. Start with a short numbered overview (1. 2. 3.) when order matters, then one `###` subsection per stage, numbered ("### 1. Explored the ideas in Claude Design"). Suggest a picture where it saves a paragraph.
- **## What happened:** what changed. Only figures with a source he can show (dashboard counts, live URLs, analytics he shared). No estimates.
- **## What I would do differently:** one or two honest lessons, drawn from what actually happened in the work. Do not invent regrets.
- **## Try it yourself:** the one thing the reader can do today, plus a link if there is one.

For design or build posts, show the thinking: name the UX laws behind decisions (Hick's, Fitts's, Jakob's, Miller's, Von Restorff, Doherty, Peak-end, Goal-gradient, Common Region) and what each one decided. Include one or two real prompt examples in fenced code blocks when the post is about prompting. Label an example as illustrative if it is not his actual prompt.

## Step 3: Voice and style

- Practitioner and design leader, not a marketer. Clear, confident, specific. No heavy self-promotion.
- No em dashes. No emoji.
- Run the linkedin-humanizer rules before finalising: no reveal bridges ("The result?"), no "It's not X, it's Y" framing, no staccato fragment runs, no stacked triads, no sincerity announcements ("let me be honest"), and keep vocabulary like crucial, leverage, robust, seamless, landscape to a minimum.
- Plain, active sentences. Bold lead-ins on list items are fine.

## Step 4: Markdown rules for his site

His admin Body field is Markdown read by the site (MDX-style). Follow these exactly:

- Headings with `##` and `###`; lists with `-` or `1.`; links as `[words](address)`; bold with `**two stars**`.
- Pictures: `![what it shows](../../assets/posts/name.jpg)`, only after he uploads the image under Images. Otherwise suggest the picture in the reply instead.
- Highlighted note: `<Callout title="Heading">` on its own line, the text, then `</Callout>` on its own line. Use at most one or two per post, for the key takeaway or formula.
- A `<` or `{` typed as an ordinary character breaks the page. Outside fenced code blocks, never use them: describe tags in words ("the root html element", "a bdi element") or write `&lt;` / `&#123;`. Avoid code snippets that contain braces or angle brackets; describe them in words instead.
- Do not repeat the title as an H1 in the body; the Title field carries it.

## Step 5: Admin fields

Fill every field of Admin > Blog posts > New post:

- **Title** (required): specific and descriptive, under about 80 characters.
- **Page address:** lowercase kebab-case slug, short. It cannot be changed later, so make it durable (no dates).
- **Subtitle:** one line.
- **Excerpt** (required): one or two sentences for cards, feeds and search.
- **Category:** one category.
- **Topics:** comma-separated; these become topic pages, so reuse existing topic names where possible.
- **Published on:** today's date (YYYY-MM-DD).
- **Cover image description:** alt text for the suggested cover image.
- **Search title:** 60 characters or fewer.
- **Search description:** about 150 to 160 characters.
- Leave **Download** blank unless he offers a file. Leave **Republished from elsewhere** blank when the blog is the original.

## Step 6: Deliver as a copy page

Publish one artifact page (load artifact-design first) that he can use for both destinations:

- A sticky bar with **Copy blog body (Markdown)** and **Copy for LinkedIn**.
- An "Admin fields" panel listing every field with its own Copy button.
- A short "For LinkedIn" panel: publish on the blog first; on LinkedIn choose Write article, paste the title into the headline, then Copy for LinkedIn into the body; if a code block pastes as plain text, use LinkedIn's Code snippet option.
- A rendered preview of the article. Keep the Markdown source in a `<script type="text/plain">` block as the single source, render it with marked from cdnjs, and convert `<Callout>` to a blockquote with a bold heading for the preview and the LinkedIn copy.
- Copy for LinkedIn writes text/html plus a text/plain fallback via ClipboardItem; fall back to selecting the article if the clipboard is blocked. Every copy action reports success or tells him to press Ctrl+C.
- Light and dark themes via tokens; works at phone width.

When revising a post, update the same artifact file so the link stays the same.

## Step 7: Reply

One or two sentences on what the page is, then a short "Check before publishing" list: any claim you could not verify, any illustrative example he should swap for a real one, and any suggested picture. Do not paste the article into the reply.