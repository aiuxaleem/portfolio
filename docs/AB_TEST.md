# A/B test: version 1 and version 2

Started 24 October 2026, on the owner's instruction: "create a version 2, don't make changes to the current one … make both of them live … then we can do the A/B testing".

## What the two versions are

**Version 1** is the site as it was: Home, Services and Contact speak to hiring teams and clients at once.

**Version 2** separates the two audiences and connects them:

| Page | Version 1 | Version 2 |
| --- | --- | --- |
| Home | `/` | `/v2`: version 1's Home plus two doors under the teams strip, "Hiring for a design lead?" and "Building a product?" |
| For hiring teams | (none) | `/v2/hiring`: who, level, what for, the facts a recruiter screens for, three case studies, expertise, experience, certifications, the call |
| Services | `/services` | `/v2/services`: the page for clients; its "Full-time role" card leads to `/v2/hiring` |
| Contact | `/contact` | `/v2/contact`: the two doors under the lead; the subject comes from the address (`?topic=role` or `?topic=project`) |

Every other page (projects, case studies, writing, videos, resources, About, Resume, Now) is shared by both versions. Content entries and the admin are shared too: anything published appears in both.

## How the split works

- **Where:** on the Vercel site (and in `npm run dev`), the only builds where visits are counted. Static copies (GitHub Pages) always show version 1.
- **Who:** a new visitor who opens Home, Services or Contact is given version 1 or 2 at random, half and half. The choice is kept in the visitor's own browser (`localStorage`, key `aiuxaleem-ab`), with no cookie and nothing sent anywhere, so the site's "no cookies" promise holds.
- **Staying in a version:** a version 2 visitor who opens Home, Services or Contact is taken to the version 2 page before it paints; on every shared page, the header and footer links to Home, Services and Contact lead to version 2.
- **Left out:** search robots, link previews and automated browsers (including the quality checks) always see version 1. Version 2's pages are `noindex` with their canonical on version 1's page, and are not in the sitemap.
- **Choosing by hand:** add `?ab=2` or `?ab=1` to any address to switch your browser to that version (it is remembered).

The script is in `src/layouts/base-layout.astro` (`abScript`); the link handling in `src/components/islands/site-chrome.ts`; version 2's pages in `src/pages/v2/` and its pieces in `src/components/v2/`.

## Reading the result

The admin dashboard has a card, **Version 1 and version 2**, for the chosen period:

- **Visits:** a visit (one visitor on one day) is in version 2 when it opened any `/v2` page, and in version 1 when it opened Home, Services or Contact and no `/v2` page.
- **Reached Contact:** visits that opened either version's Contact page.
- **Share:** shown once a version has 20 visits, like every share on the dashboard.
- **Opened the page for hiring teams:** version 2 only.

Read the result only when both versions have well over 20 visits each, and for at least two weeks; with a handful of visits a difference is chance. Booking a call happens on cal.com and email opens the visitor's mail app, so neither is counted; Contact is the nearest step the site can see.

## Ending the test

- **Keep version 2:** move `src/pages/v2/*` over their version 1 pages (Home, Services, Contact) and add `/hiring`, remove the split script and the `ab` props, delete `src/pages/v2/`, and add the page for hiring teams to the navigation and footer. One commit.
- **Keep version 1:** delete `src/pages/v2/` and `src/components/v2/`, remove the split script, the link handling and the dashboard card.

Either way, record the decision and the numbers in `docs/AUDIT_FINDINGS.md`.

## Checks

`node scripts/quality/check-ab.mjs --origin=<running site>` tests the split, both overrides, staying in version 2, robots and automated browsers left out, and the contact subject. `npm run quality` checks version 2's pages like every other page.
