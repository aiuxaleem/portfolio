# A/B test: version 1 and version 2

Started 24 October 2026, on the owner's instruction: "create a version 2, don't make changes to the current one … make both of them live … then we can do the A/B testing".

## What the two versions are

**Version 1** is the main portfolio as it was: Home, Services and Contact speak to hiring teams and clients at once.

**Version 2** (changed 25 October 2026 on the owner's instruction) is two websites, one per audience, described in `docs/SITES.md`: the website for hiring teams (aiuxaleem-job.vercel.app, planned job.aiuxaleem.com) and the website for clients (aiuxaleem-clients.vercel.app, planned clients.aiuxaleem.com). On the main site, a version 2 visitor's Home is the fork, `/v2`: version 1's Home with two doors, "Hiring for a design lead?" and "Building a product?", each leading to its website. Services leads straight to the website for clients.

The first form of version 2 (24 October: `/v2/hiring`, `/v2/services`, `/v2/contact` on the main site) was replaced by the two websites; those addresses redirect to them.

## How the split works

- **Where:** on the Vercel site (and in `npm run dev`), the only builds where visits are counted. Static copies (GitHub Pages) always show version 1.
- **Who:** a new visitor who opens Home or Services on the main site is given version 1 or 2 at random, half and half. The audience websites themselves are never split: whoever opens them directly sees them. The choice is kept in the visitor's own browser (`localStorage`, key `aiuxaleem-ab`), with no cookie and nothing sent anywhere, so the site's "no cookies" promise holds.
- **Staying in a version:** a version 2 visitor who opens Home is taken to the fork before it paints, and Services takes them to the website for clients; on every shared page, the header and footer links to Home and Services do the same.
- **Left out:** search robots, link previews and automated browsers (including the quality checks) always see version 1. Version 2's pages are `noindex` with their canonical on version 1's page, and are not in the sitemap.
- **Choosing by hand:** add `?ab=2` or `?ab=1` to any address to switch your browser to that version (it is remembered).

The script is in `src/layouts/base-layout.astro` (`abScript`); the link handling in `src/components/islands/site-chrome.ts`; version 2's pages in `src/pages/v2/` and its pieces in `src/components/v2/`.

## Reading the result

The admin dashboard has a card, **Version 1 and version 2**, for the chosen period:

- **Visits:** a visit (one visitor on one day) is in version 2 when it opened the fork or either audience website (counted as `/v2`, `/job/...`, `/clients/...`), and in version 1 when it opened Home, Services or Contact on the main site and none of those. A visitor who comes straight to an audience website (a link shared on LinkedIn, for example) counts as version 2 too.
- **Reached Contact:** visits that opened any Contact page: the main site's, or either website's.
- **Share:** shown once a version has 20 visits, like every share on the dashboard.
- **Opened the website for hiring teams, for clients:** version 2 only.

Read the result only when both versions have well over 20 visits each, and for at least two weeks; with a handful of visits a difference is chance. Booking a call happens on cal.com and email opens the visitor's mail app, so neither is counted; Contact is the nearest step the site can see.

## Ending the test

- **Keep version 2:** make the main Home the fork (move `src/pages/v2/index.astro` over `src/pages/index.astro`), remove the split script and the `ab` props, delete `src/pages/v2/`. The two websites stay as they are. One commit.
- **Keep version 1:** delete `src/pages/v2/`, remove the split script, the link handling and the dashboard card. Decide separately whether the two websites stay up (they cost nothing to keep and can be left unlinked).

Either way, record the decision and the numbers in `docs/AUDIT_FINDINGS.md`.

## Checks

`node scripts/quality/check-ab.mjs --origin=<running site>` tests the split, both overrides, staying in version 2, robots and automated browsers left out, and the contact subject. `npm run quality` checks version 2's pages like every other page.
