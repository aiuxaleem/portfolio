# Mohammad Abdul Aleem · Portfolio

**Lead AI Product Designer.** I design AI products people can trust, and the design systems behind them.

**Live site: https://aiuxaleem.github.io/portfolio/**

[LinkedIn](https://www.linkedin.com/in/aiuxaleem) · [Behance](https://be.net/uxaleem) · aiuxaleem@gmail.com

This repository is the complete source of that site: every page, component, style and piece of content you see there is built from the files here.

## Credit

| | |
|---|---|
| Design, content, case studies and direction | **Mohammad Abdul Aleem** |
| How it was built | Designed and directed by me. Claude Code (Anthropic) worked as the coding agent under my direction, and every decision about the design, the content and what ships was mine. |
| Copyright | © 2026 Mohammad Abdul Aleem. All rights reserved. See [Rights](#rights) and [LICENSE.md](LICENSE.md). |

## What is on the site

### Case studies

| Case study | What it covers |
|---|---|
| [Colaberry Design System](https://aiuxaleem.github.io/portfolio/case-studies/colaberry-design-system) | One component library under five brands, and a school design system with 20 components and 15 templates that a marketer, a developer and an AI agent can all build from |
| [Freight platform rebrand](https://aiuxaleem.github.io/portfolio/case-studies/freight-platform-rebrand) | One identity from wordmark to product UI, built as a token-driven theme |
| [AI ad reel pipeline](https://aiuxaleem.github.io/portfolio/case-studies/ai-ad-reel-pipeline) | A repeatable, branded pipeline that turns a script into a finished 9:16 video ad |

### Projects

| Project | What it is |
|---|---|
| [Colaberry Design System](https://aiuxaleem.github.io/portfolio/work/colaberry-design-system) | Tokens, components and templates for decks, web pages, social posts, print and email |
| [Multi-brand token system](https://aiuxaleem.github.io/portfolio/work/multi-brand-token-system) | Five brands on one component library, each brand a set of tokens held as data |
| [Freight platform design system](https://aiuxaleem.github.io/portfolio/work/freight-design-system) | 43 React components, six templates and a control-tower UI kit for an AI freight platform, with a skill pack so AI builds on-system screens |
| [WoT AI Design System](https://aiuxaleem.github.io/portfolio/work/wot-ai-design-system) | A design system people and AI agents read from the same source, with a prompt-to-interface playground |

### Also on the site

About and career history, services, writing (blog, LinkedIn articles and posts), videos, a resume page, a "now" page, a contact page, and Arabic versions of the home page and one case study, laid out right to left.

## How it is built

- **Astro 5, fully static.** No UI framework is sent to visitors. Each page loads about 2 to 3 KB of script and one inlined stylesheet of about 14 KB (gzipped).
- **Design tokens as the single source of truth.** Colour, type, spacing, radius, shadow and motion are defined once in `src/styles/tokens.css`. Components never use a raw colour.
- **Typed content.** Projects, case studies, posts, videos and certifications are files in `src/content/`, checked against schemas in `src/content.config.ts`. A metric is shown as a number only when it is marked verified with a source.
- **Light and dark themes**, applied before first paint so there is no flash, following the visitor's system setting and remembering their choice.
- **Motion with restraint.** Hover feedback, a single fade as content scrolls in, and a reading progress bar. All of it switches off under the reduced-motion setting, and nothing is hidden when JavaScript is off.
- **No third-party requests.** Fonts are self-hosted. YouTube and LinkedIn embeds load only when a visitor asks for them.

## Quality checks

The repository carries its own test suite, and a page is not considered done until it passes. Measured on 6 October 2026, on a local production build:

| Check | Result |
|---|---|
| Automated checks across every page, ten screen sizes and both themes | 780 views, 0 failures |
| Text contrast (WCAG 2.2 AA) | 0 findings across 9,268 text elements and 2,460 hover and focus states |
| Keyboard | 2,975 of 2,975 interactive elements reachable by Tab |
| Lighthouse accessibility | 100 on all 16 page templates |
| Lighthouse performance (mobile, throttled) | 95 to 100 on 15 of 16 templates; the Arabic home page scores 77 and is the known exception |
| Reduced motion and theme behaviour | 0 findings |

These are automated measurements. They do not replace testing with real users or with assistive technology.

## Run it locally

Requires Node 20 or newer.

```
npm install
npm run dev
```

The site opens at `http://localhost:4321`.

| Command | What it does |
|---|---|
| `npm run dev` | Local site, with the content editor at `/keystatic` and every component state at `/_states` |
| `npm run build` | Production build into `dist/` |
| `npm run check` | Type and content schema check |
| `npm run quality` | The automated checks on every page |
| `npm run perf` | Page weights and Lighthouse on every template |

A few scripts compare the site with the original design export, which is not part of this repository; those commands (`legacy`, `baseline:*`, `quality:legacy`, `visual`) do not run here.

## Where things are

| Path | Contents |
|---|---|
| `src/content/` | All content: projects, case studies, posts, videos, certifications, site settings |
| `src/components/` | Components, grouped by purpose, each with its styles |
| `src/pages/` | One file per route |
| `src/styles/` | Tokens, base styles and page styles |
| `src/components/islands/` | The small browser scripts |
| `scripts/` | Quality, accessibility, performance, motion and screenshot checks |
| `docs/` | Guides for adding content and adding a page |
| `.github/workflows/pages.yml` | Builds and publishes the site to GitHub Pages on every push to `main` |

## Rights

© 2026 Mohammad Abdul Aleem. All rights reserved.

- **You may** read this code, run it locally to see how it works, and link to this repository or the live site.
- **You may not** copy, republish or reuse the site design, writing, case studies, images or screenshots, or present any of this work as your own, without my written permission.
- **Third-party marks.** Company and product names, logos and screenshots shown in the case studies (including Colaberry, Refactored.ai, Career Pathways Network, AI Flotation and WorldOfTaxonomy) belong to their owners and appear here only to describe work I did.
- **Fonts and libraries** keep their own licences: Plus Jakarta Sans, IBM Plex Sans Arabic and Noto Kufi Arabic under the SIL Open Font License, and the npm packages listed in `package.json` under theirs.

To ask about reuse, or about working together: aiuxaleem@gmail.com
