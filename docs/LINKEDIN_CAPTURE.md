# LinkedIn posts and articles: from the phone to the site

You post on LinkedIn; the site should show the post without you typing it in again. LinkedIn gives no way to read your own posts by machine (its read permission is closed to individuals, there is no feed, and the EU data-portability route is closed to a member in India: `docs/LINKEDIN_RESEARCH.md`), so the site takes each post in at the moment you share it. Three ways in, all ending in the same place: a draft in the admin, opened in its editor, published with one click.

Nothing is read from LinkedIn. The link, and whatever words the sharing app sends with it, are all the site has. A post's day is read from its link when the link carries an `activity` number (that number holds the moment the post was published; checked against every post on the site on 3 November 2026). A link with a `share` number holds the moment the post was scheduled, which can be a week earlier, so that post is given the day you shared it, as is an article. The editor shows the day either way; change it if it is wrong.

## 1. From the phone (Android), in three taps

Once: install the admin as an app.

1. Open `https://aiuxaleem-portfolio-app.vercel.app/admin` in Chrome on the phone and sign in.
2. From Chrome's menu choose **Install app** (on some phones **Add to Home screen**). The app is called **AIUXAleem Admin** and uses the site's mark as its icon.

Every post after that:

1. Under your post in the LinkedIn app, tap **Share**, then **Share via**.
2. Choose **AIUXAleem Admin**.
3. The admin opens on the post's editor with the link and the day filled in. Type the title (the first line of the post works well), then **Publish**.

If the LinkedIn app sends the post's words along with the link, the title and an excerpt are filled in from them: the first line becomes the title, the next whole sentences (up to 240 characters) the excerpt. Whether it does is a one-time test on your phone: share one post and see what arrives. If you are signed out, the sign-in page opens first and the share is kept through it.

The same works from the LinkedIn app's share sheet for an article, and from Chrome's own share sheet on any page of a post. An iPhone cannot receive a share this way (Safari does not support it), so there it is **Copy link** on the post, then the box in section 2.

## 2. From a link, on any device

Open **LinkedIn posts** in the admin and press **Add from a link** (or go to `/admin/share`). Paste the link to a post ("Copy link to post" in the post's menu) or to an article, press **Add as a draft**, and the editor opens. A short `lnkd.in` link is followed to the full one.

A link that is already on the site, or already a draft, opens that entry instead of making another. A link that is not a post or an article is refused and the box is shown again with the link kept.

## 3. From a Shortcut or a script: `POST /api/linkedin`

The same key as the resources API (`RESOURCES_API_KEY` in the hosting project's settings; `docs/RESOURCES_API.md`). Without it, every request is refused with `401`.

```
POST https://aiuxaleem-portfolio-app.vercel.app/api/linkedin
Authorization: Bearer <RESOURCES_API_KEY>
Content-Type: application/json

{ "url": "https://www.linkedin.com/posts/aiuxaleem_...-activity-7511236061377748993-4xzs/" }
```

Fields: `url` (needed; it may also sit inside `text`, as a share sheet sends it), `title`, `text` (the post's words: the first line becomes the title when no `title` is given, the next sentences the excerpt), `published` (`YYYY-MM-DD`, otherwise read from the link or the day of the request), `excerpt`, `series`, `tags` (a list or a comma-separated string), `embed` (posts; default `true`), `readingTime` (articles), `slug` (otherwise made from the title, or `linkedin-post-<number>`), and `publish`.

| Answer | Meaning |
| --- | --- |
| `200` `{ "ok": true, "state": "draft", "kind": "linkedin-posts", "slug": "...", "edit": "/admin/linkedin-posts/..." }` | Saved as a draft for the editor. |
| `200` `{ "ok": true, "state": "exists", ... }` | The post or article is already here; nothing was added. |
| `200` `{ "ok": true, "state": "published", "slug": "...", "commit": "<sha>", "page": "/posts" }` | With `"publish": true`: written into the content files as one commit on `main`; the site rebuilds. Needs a title. |
| `422` `{ "ok": false, "problems": [{ "field": "url", "message": "..." }] }` | Not a LinkedIn post or article link, or something to fix before publishing. |
| `401` | No key, or the wrong one. |
| `409` | The entry changed in the repository while the request ran; send it again. |
| `503` | The database is not set up on the host. |

An iPhone Shortcut: **Receive** URLs and text from the share sheet, then **Get Contents of URL** with the method POST, a JSON body of `url` (and `text`), and the `Authorization` header. One tap in the share sheet then does what section 1 does on Android.

## What it cannot do

- Catch a post you did not share. The site learns of a post only when you send it.
- Store the post's words or pictures beyond a title and an excerpt: the site keeps a title, a link, a day and the optional excerpt, series, reach and topics, and shows the post itself only when a visitor presses "Load the post here" (loaded from LinkedIn then, with LinkedIn's own cookies).
- Fill in older posts by itself. For those, "Download your data" on LinkedIn (desktop only; the posts arrive in the slower tier within about 48 hours as `Shares.csv`) and the box in section 2, one link at a time, or the API in a loop.

## How it is built

- `src/admin/lib/linkedin.ts`: the one function (`capture`) the three ways in call. Finds the link in what was shared, follows a short link, works out whether it is a post or an article, looks for it among the drafts and the entries on the site, reads the day from the number, and saves the draft (or publishes when asked and the entry is complete).
- `src/admin/pages/share.astro` (`/admin/share`): the box, and the address a shared post opens. A link that arrives from another site (`Sec-Fetch-Site: cross-site`, or `?confirm=1` after sign-in) is shown in the box and not acted on until the owner presses the button, because the session cookie joins such a navigation (9 November 2026, L-57). A GET with no link shows the box; with a link it does the work and opens the editor (`?captured=1`, or `?exists=1` for one already here). Safe to repeat.
- `src/admin/pages/linkedin-api.ts` (`POST /api/linkedin`).
- `src/admin/pages/manifest.ts` (`/admin/manifest.webmanifest`): what makes the admin installable on a phone and tells the phone that a share opens `/admin/share`. Its colours are the site's tokens; its icons are the site's mark, drawn by `node scripts/perf/admin-app-icons.mjs` into `public/assets/admin/`. The middleware lets this one address through without a session; every other admin page still needs one, and a page asked for while signed out (a shared link) is kept through sign-in (`?next=`).
- `src/admin/components/share-box.astro`: the box, also shown on `/_states-admin` in its empty and refused states.

## Checks

- `node scripts/quality/check-admin.mjs` section 7, against a running site: the share page signed out and through sign-in, the day read from the link, the same link twice, words with the link, a refused link, the manifest and its icons, and the API with and without the key. Its test drafts are deleted at the end. It needs `RESOURCES_API_KEY` in `.env.local` (any long random string) to test the key.
- `node scripts/quality/check-admin-ui.mjs` covers `/admin/share` and its refused state at every size in both themes.
