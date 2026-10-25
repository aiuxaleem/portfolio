# The audience websites

Built 25 October 2026 on the owner's instruction: "two separate websites targeting two different audiences, clients.aiuxaleem and job.aiuxaleem, with one admin to manage both; keep content only relevant to the respective page, remove unrelated content and pages, add new as per your suggestion."

## The three websites

| Website | Address today | Planned address | For | Pages |
| --- | --- | --- | --- | --- |
| Main portfolio (version 1) | aiuxaleem-portfolio-app.vercel.app | aiuxaleem.com | everyone | everything |
| Hiring teams | aiuxaleem-job.vercel.app | job.aiuxaleem.com | recruiters, hiring managers | Home, Case Studies, Projects, Experience, Resume, Contact |
| Clients | aiuxaleem-clients.vercel.app | clients.aiuxaleem.com | founders and product teams | Services (Home), Case Studies, Projects, UX Glossary, AI Tools, About, Contact |

What each website leaves out:

- **Hiring teams:** no services, no client offer, no resources directories, no videos or LinkedIn posts. The call is about a role; the contact form's subject is set to a role.
- **Clients:** no resume, no job search ("Open to roles", relocation), no career timeline. The call is a scoping call; the contact form's subject is set to a project.

Each website links to the other once (a band on the hiring Home, the "Hiring instead?" card on the clients Home, and the footer's Elsewhere column) and to the full portfolio.

## How it is built

One repository, one build, one Vercel project, one admin.

- **Pages:** `src/pages/job/` and `src/pages/clients/`. Where a page is the same as the main site's (case study, project, resume, Projects list, UX Glossary, AI Tools) the website's file renders the main site's page as a component, so there is one source for it. New pages: the hiring Home, Experience, the clients Case Studies list, About, both Contact pages.
- **Header and footer:** `src/lib/sites.ts` holds each website's menu, footer columns, call to action and addresses. The header, footer and page head read the page's path (`/job/...`, `/clients/...`) and take that website's settings: its menu, its audience label beside the brand, no language switch (English only), its own canonical address.
- **Addresses:** `vercel.json` routes by host name. On the website's own host, its pages are served from its folder (`/experience` is `/job/experience`), its sitemap and robots file from its folder, and any other path goes to the main site. On the main host, `/job/...` and `/clients/...` redirect to the website's own host.
- **Search engines:** each website has its own sitemap and robots file on its own host (`src/pages/<site>/sitemap.xml.ts`, `robots.txt.ts`); the main sitemap leaves both out. Canonical addresses use the planned domain.
- **Content:** shared. Projects, case studies, certifications, the profile and the directories are the same files for every website, so anything published from the admin appears wherever it belongs, on every website, with one publish.
- **Visits:** counted under the website's prefix (`/job/experience`), so the admin dashboard tells the websites apart ("Website for hiring teams", "Website for clients").

## Connecting the domain (owner)

`aiuxaleem.com` does not answer at the moment. To move the websites onto it:

1. Add `aiuxaleem.com`, `job.aiuxaleem.com` and `clients.aiuxaleem.com` to the Vercel project `aiuxaleem-portfolio-app` (Settings, Domains).
2. At the domain's registrar, create the DNS records Vercel shows (a CNAME to `cname.vercel-dns.com` for each subdomain).
3. In `src/lib/sites.ts`, set `MAIN_LIVE`, `JOB_LIVE` and `CLIENTS_LIVE` to the new addresses, and in `vercel.json` change the main-site address in the redirects. One commit.

The host rules in `vercel.json` already accept both the `vercel.app` addresses and the planned subdomains.

## Checks

- `npm run quality` checks every page of both websites (the quality build lists them).
- `node scripts/quality/check-seo.mjs` (after `npm run build`) checks that each website's pages are in its own sitemap, not in the main one, and that their canonical addresses are on their own host.
- `node scripts/quality/check-ab.mjs --origin=<running site>` checks that the A/B split leaves the websites alone.
