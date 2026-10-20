# UX resources: the page, the editor and the API

The Resources page (`/resources`) is a curated directory of tools, references and reading for AI product design. This guide covers the three ways a resource gets there, and the one address that takes a resource from outside the site.

## Where a resource lives

One file per resource in `src/content/resources/`, named after its page address, for example `figma.yaml`:

```yaml
title: "Figma"
url: https://www.figma.com/
category: prototyping
type: tool
cost: freemium
description: "Collaborative design, prototyping and design system tooling in the browser."
added: 2026-10-20
tags: ["Design tools", "Prototyping"]
```

| Field | Rule |
| --- | --- |
| `title` | Needed. 120 characters at most. |
| `url` | Needed. A full address starting with `https://` (or `http://`), 300 characters at most. The card opens it in a new tab. |
| `category` | Needed. One of the words in the first column of the category table below. |
| `type` | `tool`, `ai`, `article`, `library`, `template`, `course`, `book`, `plugin`, `video` or `community`. Default `tool`. `ai` is what the "AI tools" count on the page counts. |
| `cost` | `free`, `freemium` (shown as "Free tier") or `paid`. Default `free`. |
| `description` | Optional. One or two sentences in your own words, 220 characters at most, shown whole on the card. |
| `added` | Needed. A day, `YYYY-MM-DD`. The list is newest first. |
| `tags` | Optional. Short topics shown on the card. |
| `draft` | `true` keeps the resource off the site. |

Categories, with the word to write in the file:

| Word | Shown as |
| --- | --- |
| `ai-design-patterns` | AI design patterns |
| `prompting-and-evaluation` | Prompting and evaluation |
| `design-systems` | Design systems |
| `design-tokens` | Design tokens |
| `accessibility` | Accessibility |
| `research-and-testing` | Research and testing |
| `prototyping` | Prototyping |
| `typography` | Typography |
| `colour` | Colour |
| `icons-and-illustration` | Icons and illustration |
| `motion` | Motion |
| `handoff-and-documentation` | Handoff and documentation |
| `learning` | Learning |
| `inspiration` | Inspiration |
| `utilities` | Utilities |
| `communities` | Communities |

The lists live in `RESOURCE_CATEGORIES`, `RESOURCE_TYPES` and `RESOURCE_COSTS` in `src/lib/content-schemas.ts`. A new category is added there (the word and how it is shown) and given a one-line description in `categoryBlurb` in `src/lib/resources.ts`; the page, the editor and the API pick it up from there. The build refuses any value outside the lists.

## Three ways in

1. **By file.** Add the YAML file, commit, push. This is what the other two do for you.
2. **In the admin area.** `/admin/resources` on the live site lists every resource; **Add a resource** opens the editor. **Save draft** keeps it in the database, **Publish** writes the file as one commit and the site rebuilds in about two minutes. A visitor's suggestion arrives in the same list marked "Draft, not published", with a note at the top of the editor saying when it came and who sent it. Check the link and the words, then publish it or discard the draft.
3. **Through the API**, below.

## The API: `POST /api/resources`

One address, two callers. It exists on the Vercel site and on a development server (`npm run dev`); the static copy on GitHub Pages has no server, so the page there offers email instead of the form.

### A visitor suggests a resource

This is what the form on `/resources` does. No key is needed; the request has to come from the site itself (the browser's `Origin` header is checked), and a hidden field (`_gotcha`) that people never see catches machines.

```
POST /api/resources
Content-Type: application/json

{ "title": "Figma", "url": "https://www.figma.com/", "category": "prototyping",
  "type": "tool", "cost": "freemium", "description": "Why it is useful.",
  "name": "Who is suggesting (optional)", "email": "their address (optional)" }
```

What happens: the suggestion is saved as a draft with its own address (`suggested-figma-k3x9`) for the owner to review. It is never published by itself. The suggester's name and email go into the note shown to the owner in the editor, never into the content file.

Answers:

| Status | Meaning |
| --- | --- |
| `202` `{ "ok": true, "state": "suggested" }` | Saved for review. |
| `422` `{ "ok": false, "problems": [{ "field": "url", "message": "..." }] }` | A field was refused. The messages are written for the person. |
| `429` | Five suggestions from one address within an hour is the limit. |
| `403` | The request did not come from the site. |
| `503` | The database is not set up on the host. |

A form posted without JavaScript (`application/x-www-form-urlencoded`, no `Accept: application/json`) gets a `303` back to the page instead, at the note that fits: `/resources#suggest-sent`, `#suggest-refused`, `#suggest-later` or `#suggest-failed`.

### The owner adds or publishes a resource

Set a secret in the hosting project's settings as `RESOURCES_API_KEY` (a long random string; `openssl rand -base64 32` makes one) and redeploy. Until it is set, every request with an `Authorization` header is refused with `401`.

```
POST https://aiuxaleem.com/api/resources
Authorization: Bearer <RESOURCES_API_KEY>
Content-Type: application/json

{ "slug": "figma", "title": "Figma", "url": "https://www.figma.com/", "category": "prototyping",
  "type": "tool", "cost": "freemium", "description": "Why it is useful.", "added": "2026-10-20",
  "tags": ["Design tools", "Prototyping"], "publish": true }
```

- `slug` is optional: without it the address is made from the title.
- Without `"publish": true` the resource is saved as a draft under that address, exactly as **Save draft** in the editor does, and the answer gives the editor's link: `{ "ok": true, "state": "draft", "slug": "figma", "edit": "/admin/resources/figma" }`.
- With `"publish": true` the resource is checked with the same rules as the build, written into `src/content/resources/<slug>.yaml` as one commit on `main`, and the site rebuilds. The answer is `{ "ok": true, "state": "published", "slug": "figma", "commit": "<sha>", "page": "/resources" }`. Publishing a slug that already exists updates that file.
- `"draft": true` in the body keeps a published resource off the site (the same as the editor's "Keep off the public site" box).
- No rate limit and no spam trap apply to a request with the key. The same field rules do: a refused field comes back as `422` with `problems`.
- `409` means the file changed in the repository while the request ran: read it again and resend. `503` means `GITHUB_TOKEN` is missing on the host, so nothing can be published.

A ready-made call from a terminal:

```
curl -X POST https://aiuxaleem.com/api/resources \
  -H "Authorization: Bearer $RESOURCES_API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"Figma","url":"https://www.figma.com/","category":"prototyping","type":"tool","cost":"freemium","description":"Collaborative design and prototyping in the browser.","publish":true}'
```

Replace the host with `http://localhost:4321` against a development server. There, publishing goes to the branch named by `GITHUB_BRANCH` in `.env.local`, never to `main`.

### Settings the API needs on the host

| Setting | Used for |
| --- | --- |
| `DATABASE_URL` | Drafts and the suggestion limit. Already set for the admin area. |
| `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` | Publishing with the key. Already set for the admin area. |
| `RESOURCES_API_KEY` | Owner access to the API. New; without it the API takes visitor suggestions only. |

The database needs migration `004_suggestions.sql` applied once: `node scripts/db/migrate.mjs`.

## Checks

- `npm run quality` covers `/resources` like every other page (it is in the sitemap) and `/_states` shows the resource card, the filter bar and every state of the suggestion form.
- `node scripts/quality/check-admin-ui.mjs` covers `/admin/resources`, the editor and the new-resource form.
