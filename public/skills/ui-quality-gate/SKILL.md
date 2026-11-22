---
name: ui-quality-gate
description: Use when checking a web page, a site or a component for release quality and fixing what fails, with evidence. Measures a live UI at ten screen widths in both themes (accessibility, contrast, overflow, reflow, touch targets, states, the first view, what an AI agent can read), sorts every finding into a defect to fix or an enhancement to propose, makes the smallest safe fix inside a locked design, proves it with a re-run, and has independent reviewers rate it against a bar of 8. Triggers on "run the quality gate", "QA this page", "is this ready to ship", "check this UI on mobile and in dark mode", "audit accessibility and responsiveness", "fix the UI defects", "prove it is fixed".
---

# UI quality gate

By Mohammad Abdul Aleem, Lead AI Product Designer (aiuxaleem-portfolio-app.vercel.app). This is the method that holds his own portfolio to a product's quality bar: a locked design, an automated gate on every page, independent reviewers, and no claim without evidence. It is written so you can run it on any web UI.

It complements a design critique. A critique asks whether the design is right; this gate asks whether the build is correct, in every state, at every width, in both themes, for both of its users: the person, and the AI agent that may read the page on their behalf.

## Four rules that hold throughout

1. **The design is locked.** Colours, type, spacing, radii, motion and copy tone stay as they are. Every finding is one of two kinds:
   - **Defect:** an accessibility failure, a contrast failure, text overflow, a broken layout at some width, a missing state, a theme bug. Fix it with the smallest visual change, after the owner approves it.
   - **Enhancement:** any change made for taste. Write it up as a proposal and change nothing until the owner approves that item.
2. **Evidence or it did not happen.** Never write "done", "fixed", "perfect" or "no issues" without a measured value, a passing check or a screenshot path. If something was not verified, say so in those words.
3. **Never invent content.** No made-up metrics, names, quotes or outcomes. Use a visible placeholder such as `[METRIC: …]` and list it for the owner.
4. **Never weaken a check to make it pass.** Fix the cause. A flaky test may be repaired (wait for the right thing, remove a race), and the repair is reported.

## Step 1: Agree the scope

Ask only what you cannot find out:
- The pages to check (a list of URLs, a sitemap, or a running local build). Prefer the production build served locally over a development server: the two can bundle stylesheets in a different order, and a page can pass in development and break live.
- Whether you may change code, or only report.
- Where the design tokens live, so a fix uses them and adds none.
- Who approves defects and enhancements, and where findings are logged (a file such as `docs/AUDIT_FINDINGS.md` works well: one row per finding, kept for good as the decision record).

## Step 2: Measure with the script

`scripts/ui-check.mjs` opens every page at ten widths (320, 360, 390, 414, 768, 1024, 1280, 1440, 1920, and 844×390 landscape) in light and dark, and records per view:
- axe-core violations at WCAG 2.2 A and AA,
- sideways scroll on the page,
- text cut off inside its box,
- touch targets under 24 px (a failure) and under 44 px (a note),
- images without `alt`, or without width and height,
- a viewport that blocks zoom,
- the number of h1 headings and any skipped heading level,
- the landmarks an agent reads first (header, nav, main, footer).

```bash
npm i -D playwright-core axe-core          # once, in the project or a scratch folder
node scripts/ui-check.mjs http://localhost:4321/ http://localhost:4321/about --out=reports/ui-check
node scripts/ui-check.mjs --sitemap=http://localhost:4321/sitemap-index.xml --quick   # two widths per theme
```

Options: `--widths=320,390,1440`, `--theme-attr=data-theme` (if the site sets its theme with an attribute instead of the system setting), `--shots` (a screenshot per view), `--channel=msedge|chrome|chromium`. The run writes `results.json` and ends with `PASSED` or `FAILED n`. Read `references/script-notes.md` if a result looks wrong.

Long runs: run one at a time, with nothing else building, on a machine that is plugged in and kept awake. Standby or a restart in the middle shows up as failures that are not the site's fault; read the system's power log before blaming the page.

## Step 3: Check what a script cannot

Walk `references/standards.md` by hand for each page template. The parts a script misses most often:
- **Keyboard:** a skip link, a logical order, no traps, a visible focus style that a sticky header never hides.
- **States:** default, loading (skeletons the size of the final layout), empty (why, and what to do next), error (what happened, how to recover), success, and partial (optional fields missing).
- **Stress content:** a 120-character title, an unbroken 60-character URL, a one-word title, missing optional fields, eight or more tags.
- **Contrast in every state:** hover, focus, active, visited, selected and placeholder text, in both themes, and text over images at the worst spot of the image.
- **Motion:** reduced motion removes movement; nothing flashes more than three times a second; hover never shifts layout.
- **The first five seconds:** can a visitor tell who this is for, what level it works at, and what to do next, with one primary action per view?
- **The second user:** an agent reading the page gets real landmarks, one h1, named controls, structured data that matches the visible content, and links with words in them.

## Step 4: Log every finding

One row per finding, in this shape:

| ID | Severity | Kind | Rule | Where | Evidence | Proposed fix |
|---|---|---|---|---|---|---|
| F-01 | High | Defect | Contrast 1.4.3 | /pricing, dark, hover | 3.1:1 measured, needs 4.5:1 | Lighten `--link-hover` in dark, same hue |

Severity: High blocks a task or fails WCAG AA; Medium hurts it; Low is polish. Group repeats of one cause into one row.

## Step 5: Fix the approved defects, smallest change first

- Use existing tokens and components only. A new token needs the owner's approval.
- A contrast fix changes the token's lightness and keeps its hue. Report the ratio before and after.
- Text containers get no fixed heights; flex and grid children get `min-width: 0`; long strings get `overflow-wrap: anywhere`.
- After each fix, re-run the script on the affected pages and widths, and attach the before and after numbers or screenshots.
- A refactor must be pixel-identical: compare screenshots before and after.

## Step 6: Independent review against a bar of 8

Your own review is anchored on your own fixes. Ask three or four fresh reviewers (subagents with no access to your conclusions) to rate the pages from 1 to 10, each through one lens: accessibility, visual hierarchy and craft, mobile and touch, content and the first five seconds. Give them the screenshots and the code, not your opinion. Anything under 8 becomes a finding; fix the defects, log the enhancements as proposals, and ask again until every lens is at 8 or the remaining items are the owner's to decide.

## Step 7: Report

Fill `assets/report-template.html` (it follows the Aleem brand: navy and blue-to-cyan, Plus Jakarta Sans, light and dark): the scope, the run (pages, views, duration, browser, commit), the numbers, the findings table, what was fixed with its evidence, the proposals waiting for approval, and what was not verified. If HTML is not wanted, give the same sections in Markdown.

End with what the owner should review and decide. Then stop and wait.
