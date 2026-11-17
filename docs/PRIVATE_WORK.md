# Private work: live links and prototypes for approved visitors

Owner's decisions, 16 November 2026. Much of the owner's work is under NDA. The case studies already show its screens without names or logos; the Figma files and live prototypes behind them cannot be published. This feature lets a visitor the owner approves (a hiring manager, a client) see those links, one person at a time.

**Status: built and run; behaviour tested (16 November 2026).** Type-checked and built, the migration applied, and items 3 to 9 of section 7 tested in a browser against the production build with the admin (`scripts/quality/check-private-work.mjs`, `PASSED`). Section 7 says what is verified, with the evidence, and what is still open.

---

## 1. How it works

1. **A visitor asks.** On a case study or project marked `nda: true`, the NDA notice now says "Live links and prototypes are available to approved visitors" with an **Ask for access** link to `/private-work`. That page explains the area and holds a form: name, work email, company, role, "What would you like to see?" (optional), and a required box: "I'll keep what I see confidential and won't share the links." A short note says what is kept and for how long.
2. **The owner decides.** The request appears in the admin under **Private work → Access requests** (`/admin/access`), in the **Waiting** tab, with a count beside the section in the side panel. Actions: **Approve**, **Decline**, and for an approved request **Send a new link** and **Revoke access**. A declined or revoked request can be approved again.
3. **The visitor gets a sign-in link.** Approving makes a one-time link, `https://<host>/private-work/enter?token=…`, valid for **7 days**.
   - When sending is set up (section 3), the link is emailed through Resend. The admin says so: to whom, until when.
   - Until then, or when sending fails, the admin says plainly why it was not emailed and shows the link once, with **Copy the link** and **Open in your email** (the same message, already written, in the owner's own mail program).
4. **The visitor signs in.** Opening the link shows a **Continue to the private work** button. Pressing it uses the link and signs that browser in for **30 days** (the `viewer_session` cookie). The visitor lands on `/private-work`, which now lists every NDA project that has private links, each link opening in a new tab, and a **Sign out** button.
5. **The owner keeps the links.** Under **Private work → Private links** (`/admin/access/links`) the owner adds, edits and removes links: the case study or project (a menu of the site's pages, NDA ones first and marked), what the link is, its `https://` address, and an optional note for the visitor. Approved visitors see a change at once.

The private links never go into content files, the repository, the Vercel build or the GitHub Pages copy. They live only in Postgres.

### Pages and files

| Path | File | Who |
| --- | --- | --- |
| `GET, POST /private-work` | `src/admin/pages/private-work/index.astro` | anyone; the links only with a viewer session |
| `GET, POST /private-work/enter` | `src/admin/pages/private-work/enter.astro` | anyone with a link |
| `POST /private-work/leave` | `src/admin/pages/private-work/leave.ts` | a signed-in visitor |
| `GET, POST /admin/access` | `src/admin/pages/access/index.astro` | the owner |
| `GET /admin/access/links` | `src/admin/pages/access/links.astro` | the owner |
| `GET, POST /admin/access/links/new`, `/admin/access/links/<id>` | `src/admin/pages/access/link-edit.astro` | the owner |

Logic: `src/admin/lib/private-work.ts` (requests, decisions, links, tokens, sessions, retention), `src/admin/lib/access-email.ts` (the email and the Resend call), `src/lib/private-work.ts` (the form's rules and words, the time limits, and where public pages link). Components: `src/components/private-work/` (the NDA notice, the request form, the signed-in list, the sign-in step) and `src/admin/components/access-request.astro`, `access-link.astro`, `private-link-table.astro`. Behaviour: `src/components/islands/private-work-form.ts`. Every component's states are on `/_states` (public pieces) and `/_states-admin` (admin pieces).

All of these routes are injected only where the admin is (`withAdmin` in `astro.config.mjs`: Vercel, or `ADMIN_APP=1`; and `npm run dev`). Every other build stays fully static and has none of them.

### Where the "Ask for access" link points

A static build (the GitHub Pages copy, quality builds) has no `/private-work`, so a relative link there would be a 404. `privateWorkHref()` in `src/lib/private-work.ts` therefore links:

- **relatively** (`/private-work?from=…`) where the page exists: the builds where `COUNT_VISITS` is `'1'`, which is exactly Vercel, `ADMIN_APP=1` and dev (the UX Library's suggestion form relies on the same flag);
- **to the live Vercel site** everywhere else: `MAIN_LIVE` in `src/lib/sites.ts`, today `https://aiuxaleem-portfolio-app.vercel.app`. When `aiuxaleem.com` is connected and `MAIN_LIVE` changes, the link follows.

On the two audience websites' hosts (`job`, `clients`), `vercel.json` already sends any address they do not serve, `/private-work` included, to the main site. The `?from=case-studies/<slug>` part fills the request's last field with "The live links and prototypes for <title>."

---

## 2. The data kept

Migration `db/migrations/006_private_work.sql` adds four tables (all `create table if not exists`).

| Table | Columns | Notes |
| --- | --- | --- |
| `access_requests` | `id`, `name`, `email`, `company`, `role`, `reason`, `consented_at`, `status` (`waiting`, `approved`, `declined`, `revoked`), `decided_at`, `access_until`, `ip_hash`, `created_at` | `access_until` is the latest moment a link or session of the request was good until, so an approved request can be deleted 90 days after its access ended (not in the brief; added for the retention rule). `ip_hash` is the visitor's address as a salted SHA-256 (`addressHash()` in `auth.ts`), used only for the limit of 3 requests per hour. Indexes: `(status, created_at desc)`, `(ip_hash, created_at desc)`, `lower(email)`. |
| `access_tokens` | `token_hash` (primary key), `request_id`, `expires_at`, `used_at`, `created_at` | One-time sign-in links. Only the hash is stored. Deleted with their request. |
| `viewer_sessions` | `token_hash` (primary key), `request_id`, `expires_at`, `created_at` | A signed-in visitor's browser. Only the hash is stored. Deleted with their request, and at once when it is declined or revoked. |
| `private_links` | `id`, `project_key`, `label`, `url`, `note`, `sort_order`, `created_at`, `updated_at` | `project_key` is `case-study:<slug>` or `project:<slug>`, so a case study and a project with the same slug are never confused. Index `(project_key, sort_order, id)`. |

### Retention

`tidy()` runs when a request arrives and whenever the owner opens `/admin/access`. It deletes:

- declined and revoked requests 90 days after the decision;
- requests never answered, 90 days after they were made;
- approved requests 90 days after their access ended (`access_until`);
- sign-in links a week after they expired (kept that long so a late click is told "expired", not "unknown");
- expired sessions.

The public page says "Declined and expired requests are deleted after 90 days" and gives the owner's email (read from `src/content/site/config.json`, never written into the page) for deleting a request sooner. To delete one by hand: `delete from access_requests where id = <id>;` (its links and sessions go with it).

---

## 3. Settings

| Name | Needed? | Effect |
| --- | --- | --- |
| `DATABASE_URL` | Yes (already set) | Without it the request page says requests cannot be taken here and offers email; the admin pages say the database is not set up. |
| `RESEND_API_KEY` | For email | Resend's API key. With `ACCESS_EMAIL_FROM`, approving emails the link. |
| `ACCESS_EMAIL_FROM` | For email | The sender, on a domain verified in Resend, for example `Mohammad Abdul Aleem <access@aiuxaleem.com>`. |

Sending is on only when **both** email settings are set. The admin names whichever is missing (never its value) in a note at the top of `/admin/access`. The email is sent with `reply_to` set to the site's contact address, so a visitor's reply reaches the owner.

The email: subject "Your access to Aleem's private work"; the body greets the visitor by first name, says the request was approved, gives the link, says it works once and when it expires (Gulf time, written out), that the browser then stays signed in for 30 days, and that the work is covered by confidentiality agreements and the links must not be shared. Plain text and simple HTML. The words are in `accessEmail()`; the owner's copy-and-send fallback uses the same words.

---

## 4. What the owner must do

1. **Run the migration** before deploying this code: `node scripts/db/migrate.mjs` (reads `DATABASE_URL` from `.env.local`; `vercel env pull .env.local --scope aiuxaleem`). Until it runs, `/private-work` refuses requests with "The site could not save it just now", and the admin pages say: "The private work has no tables in the database yet. Run node scripts/db/migrate.mjs once…".
2. That is enough to start: approve requests and send the links yourself from the admin.
3. To have links emailed:
   1. Register the domain `aiuxaleem.com` (it does not resolve today; `docs/VERIFICATION_REPORT.md`).
   2. Create a Resend account (resend.com).
   3. In Resend, add the domain and add the DNS records it lists (SPF, DKIM, and the return-path record) at the domain's DNS host. Wait until Resend shows the domain as verified.
   4. Create an API key in Resend with sending access.
   5. In the Vercel project `aiuxaleem-portfolio-app`, set `RESEND_API_KEY` and `ACCESS_EMAIL_FROM` (Production), then redeploy (a setting change needs a deploy).
   6. Approve a test request with your own email address and check that it arrives, then revoke it.
4. Add the private links under **Private work → Private links**, and mark NDA projects with the new **Show a confidentiality notice at the top** box on a project (case studies already have it).

---

## 5. Security choices

- **Hashed tokens.** Sign-in links and sessions are 32 random bytes (`randomBytes`, base64url). The database keeps only their SHA-256, as the admin's sessions do; a copy of the database cannot be used to sign in.
- **A prefetch-safe sign-in step.** Email programs and link scanners open links to check them. `GET /private-work/enter` only reads what the link is good for and shows **Continue**; only the `POST` uses it. A second press, or a visitor already signed in, goes straight on.
- **One use, checked in one statement.** `useToken()` marks the link used in the same `update … where used_at is null and expires_at > now() and status = 'approved'` that checks it, so two presses at once cannot both pass.
- **A separate cookie.** `viewer_session`: HttpOnly, Secure on the live site, SameSite=Lax, sent only to `/private-work`. It never opens the admin; the admin's `admin_session` (path `/admin`) never opens the private work.
- **Revocation at once.** Declining or revoking deletes the request's sessions and unused links, and every session check also requires the request to be approved. A new link replaces the request's unused ones.
- **Same site only.** Every POST (the request, Continue, Sign out, the admin's actions and the link editor) is refused from another site (`sameOrigin()`), as elsewhere in the admin.
- **Rate limits and a spam trap.** At most 3 requests per address per hour, counted on the salted address hash; the row is written before the count is read, so a burst cannot slip past (the lesson of `login_attempts`). A hidden field a person never fills (`_gotcha`) makes the server thank the sender and keep nothing.
- **Headers.** The middleware gives every `/private-work` response `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY` and `Referrer-Policy: same-origin` (so the enter page's address, which carries the token, is never sent to another site). The admin's sign-in guard is not applied to them. The pages also carry `<meta name="robots" content="noindex">` and are left out of the sitemap; like the admin, they are not listed in `robots.txt` (a `Disallow` there would stop crawlers from reading the `noindex`).
- **What a visitor is told.** A link that cannot be used says whether it was used or expired; a link that is unknown, replaced or withdrawn says only that it is not one the site can use.
- **Links open safely.** Private links open in a new tab with `rel="noopener noreferrer"`; only `https://` addresses are accepted.

---

## 6. Decisions made while building (for the owner to confirm)

- **Required fields:** name, work email, company, role and the confidentiality box. "What would you like to see?" is optional.
- **Any email domain is accepted** (many recruiters use a personal address); the hint asks for a company address.
- **Statuses and icons:** Waiting (inbox), Approved (check), Declined (the cross also used for Close), Revoked (eye-off). The side panel uses the existing `people` and `link` icons; no icon was fetched.
- **"Approve again"** is offered on declined and revoked requests.
- **The admin does not email the owner** when a request arrives; the count in the side panel shows it. Easy to add once sending is set up.
- **`reply_to`** is added to the Resend call (the brief listed `from, to, subject, text, html`).
- **The project menu** is built from the case studies and projects the deployed site was built with (`getCollection`), so a page added since the last deploy appears after the next one.

---

## 7. What is verified, and what is not yet

### 7.1 Verified on 16 November 2026

Items 1 and 2 (type check, both builds, the migration) were done before the behaviour test (`npm run check`: 0 errors; `ADMIN_APP=1 npm run build`: OK; `006_private_work.sql` applied). Items 3 to 9 are tested by `node scripts/quality/check-private-work.mjs` against `ADMIN_APP=1` production build served by `serve-production.mjs` at `http://localhost:4323`, with the shared Neon database and sending off (no `RESEND_API_KEY`, `ACCESS_EMAIL_FROM`). Two consecutive runs ended with `PASSED: the request form, the owner's decisions, the sign-in link, the viewer session, the private links, the headers of 62 /private-work answers, the NDA notice and the sitemap behave as specified.` (report: `reports/quality/check-private-work.json`). No defect was found; no source file was changed.

The test writes to the shared database only rows marked with its run: requests from `<name>@pw-<run>.example.test` named "Check PW <run> …", from made-up documentation addresses (`2001:db8::/32`, one per request, so the hourly limit only ever counts the run's rows), and links labelled "Check PW <run> …". The owner's buttons are pressed only on rows found by the run's addresses. At the end (in a `finally`, so also on failure) it deletes them and checks none is left: run 1 deleted 8 requests (with their links and sessions) and 1 link, signed the test owner out and removed its one sign-in attempt; 0 rows of the run remained.

| Item | What was observed |
| --- | --- |
| 3 Visitor flow | An untouched empty field says nothing when left; a wrong email is flagged on blur (`aria-invalid`, the error in `aria-describedby`) and cleared as soon as it is right. Sending empty posts nothing, shows "Fix 5 fields to send your request" with 5 links, takes focus; a link puts focus in its field. From the NDA notice the reason starts "The live links and prototypes for A design system that audits its own product."; sending stores a waiting row with `consented_at`, the reason, and the address only as the salted hash; the confirmation is focused and names the email. A server refusal answers 422, keeps every field and the box, focuses the summary, stores nothing. The spam trap answers 200 "Request sent." and stores nothing. From one address: 200, 200, 200, then 429 with "more than 3 requests in an hour", focused, the input kept; 0 rows for the fourth, 3 for the address. Posted from another site: `/private-work`, `/enter` and `/leave` answer 403, nothing stored. No cookie before sign-in. |
| 4 Owner flow | 8 requests of the run in Waiting, the Waiting tab selected, the side panel's badge "8 waiting for your decision" equal to the database's count. The note names `RESEND_API_KEY` and `ACCESS_EMAIL_FROM`, never a value. Approve asks nothing, answers "Approved, but the sign-in link was not emailed." with the reason, shows the link once (gone after a reload), Copy puts exactly the link on the clipboard and says "Copied", Open in your email is a `mailto:` to the visitor with the link in the body; one unused token stored. Decline and Revoke ask first ("Decline …'s request?", "Revoke …'s access?"); No changes nothing; Yes says "Declined." / "Access revoked." with the name; a declined request offers Approve again. Declining in a second, stale tab says "Nothing was done. This request is declined now: it was changed in another tab or window" and changes nothing; an action on a request that is gone says "That request is no longer here"; an approval posted from another site is 403. Send a new link: "A new sign-in link is ready, but it was not emailed.", the old link then answers 410 "It is not one this site can use.", the new one 200, one unused token. Tabs read "Waiting · 3", "Approved · 2", "Closed · 3" (the database's counts); Closed shows only declined and revoked; the arrow key moves to Approved. Searching for one name shows 1 row ("Showing 1 of 8 requests") with the tabs set aside; searching the run's mark finds all 8 across the three statuses; no match shows the empty state; Clear restores the tabs and returns focus to the box. |
| 5 Sign-in | Opening the link twice answers 200 both times, uses nothing and sets no cookie. Continue answers 303 to `/private-work`, which says "Signed in as …". The cookie: `viewer_session=…; Path=/private-work; Expires=<30 days>; HttpOnly; Secure; SameSite=Lax` (Secure is set on `http://localhost` too, because the build is a production one and the browser accepts Secure cookies from localhost). A second Continue in the same browser answers 303 and makes no second session; in another browser the used link answers 410 "It has already been used." (POST and GET) and sets no cookie. Made-up, cut-short, missing and odd-character tokens answer 410 "It is not one this site can use." (and a POST of one, 410). A link whose expiry was moved back in the database answers 410 "It has expired." on GET and POST. A link of a revoked request answers 410 "not one this site can use". Answering No to Revoke leaves the visitor signed in; Yes deletes the sessions (0 left) and the visitor's next request shows the request form. The viewer cookie does not open `/admin`; the admin's session does not open the private work. Sign out answers 303 to `/private-work?left=1`, which says "You are signed out.", the cookie and the session row are gone; a sign-out posted from another site is 403 and leaves the visitor signed in; `GET /private-work/leave` is 303 to `/private-work`. |
| 6 Links | The page menu lists 15 options with the one NDA page first and marked "(under NDA)". `http://`, `ftp://`, `javascript:`, `https://localhost/…`, an address without a scheme and one with a space are all refused (422; through the form: "Use a full address starting with https://.", focused, the input kept); a link posted from another site is 403. Adding answers 303 to the link's editor with "Saved."; the signed-in visitor at once sees it under the case study's title with its page link, its host, its note, `target="_blank"` and `rel="noopener noreferrer"`. An edit is saved and the visitor sees the new label, not the old. A link whose page left the site shows to the visitor under its key without a page link, and its editor keeps "No longer on the site: …" chosen. The list's search finds "Showing 2 of 2 links" and says when nothing matches. Delete asks first; No sends nothing; Yes answers 303 to "Removed.", the row is gone and the visitor no longer sees it. |
| 7 Headers | Every `/private-work` answer the run saw, 62 of them (200 ×37, 303 ×5, 403 ×4, 410 ×14, 422, 429), carried `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY` and `Referrer-Policy: same-origin`, the redirects included. |
| 8 NDA notice | On the served case study the link is `/private-work?from=case-studies%2Fdesign-system-audit-skill` and reaches the request page with the reason filled in. In `dist/client` (the `ADMIN_APP=1` build) all 3 built pages with the notice (the case study and its `job/` and `clients/` copies) link relatively. A case study without `nda` has no notice. |
| 9 Indexing | Not in either sitemap (1 sitemap listed, 53 addresses; `dist/client/sitemap-0.xml` and `sitemap-index.xml` checked too); `robots.txt` does not name it; `<meta name="robots" content="noindex, nofollow">` on `/private-work` and `/enter`, and the header on every answer. |
| Accessibility | axe (WCAG 2.2 AA rules) found 0 violations on every state the run passed through (request form with errors, sent, 422, 429; the request page, the signed-in list and the unknown-link page in both themes; enter ready, used, expired; the access requests with the link shown and in both themes; the link editor new and refused; the links list in both themes; signed out). `/private-work` and the signed-in list do not scroll sideways at 320 px. |

### 7.2 Not yet verified

- **Item 4, Approve with sending on**: not tested, by design: no `RESEND_API_KEY` here, so no email is sent. Owner's step 3.6 in section 4 is that test.
- **Item 6, a project with `nda: true`**: no project in the content has `nda: true` today, so the project page's notice and its menu entry are untested; the case study's are.
- **Item 7 on Vercel**: `vercel.json` gives every path (`^/(.*)$`, `continue: true`) `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy: strict-origin-when-cross-origin`. Whether those replace the middleware's `DENY` and `same-origin` on `/private-work` on the live site was not tested (only the local production server was); check with `curl -I` on the deployed site, as for the admin.
- **Item 8, other builds and hosts**: the static build's absolute link to the Vercel site (GitHub Pages copy, quality builds) was not checked, because no static build was made in this session; the `job` and `clients` hosts sending `/private-work` on to the main site need the live host names.
- **Items 10 and 11** below: not run (`npm run quality`, `check-admin-ui.mjs`, `check-mobile.mjs`; the 90-day tidy-up with dates moved back).

### 7.3 The original list

1. `npm run check`, `npm run build`, `ADMIN_APP=1 npm run build`: zero errors (type errors in the new `.astro` files are possible; they were only read, not compiled).
2. `node scripts/db/migrate.mjs` on a branch database: four tables and their indexes made; running it again changes nothing.
3. Visitor flow on `npm run dev` or `serve-production.mjs`: the form's blur checks, the error summary and focus, submitting, success; a server refusal keeps the input (422); the spam trap; the fourth request in an hour from one address is refused (429) and nothing is stored for it; a cross-site POST is refused (403).
4. Owner flow: the request in Waiting with the side-panel badge; Approve with sending off (the link shown once, Copy, Open in your email); Approve with sending on (a real email arrives, its words, the expiry in Gulf time); Decline and Revoke ask first and say what happened; a request changed in another tab says "Nothing was done"; Send a new link makes the old link stop working; the tabs, and searching across them.
5. Sign-in: GET of the enter link uses nothing (open it twice, then press Continue: it works); POST signs in and lands on the list; a second POST says nothing new and goes on; used, expired, unknown and revoked links show their pages (410); the cookie is HttpOnly, Secure, SameSite=Lax, path `/private-work`; revoking signs the visitor out on their next request; Sign out works and says so.
6. Links: add, edit, remove; only `https://` accepted; the NDA projects first and marked in the menu; the list's search; the visitor sees changes at once; a link whose page left the site still shows.
7. Headers on every `/private-work` response, including redirects (and whether `vercel.json`'s site-wide `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy` override them on Vercel, as for the admin).
8. The NDA notice's link on a case study and on a project with `nda: true`: relative on the Vercel build, absolute to the Vercel site on the GitHub Pages copy and in quality builds; from the `job` and `clients` hosts it reaches the main site.
9. `/private-work` is not in the sitemap and answers `noindex`.
10. `npm run quality` (the `/_states` and `/_states-admin` fixtures in both themes at every width) and `node scripts/quality/check-admin-ui.mjs` (the four new admin routes) end with `PASSED`; `check-mobile.mjs` on `/private-work`.
11. The tidy-up: rows past 90 days are deleted as described (with dates moved back in a test database).
