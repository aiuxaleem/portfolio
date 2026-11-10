---
name: linkedin-board-aleem-ds
description: Turn a reference infographic (or a topic) into a 1080x1350 LinkedIn board drawn in the Aleem Design System light mode, plus a post in the author's voice, checked mechanically for overflow and legibility, optionally scheduled on LinkedIn. Use when asked to make a LinkedIn infographic, carousel-style board, daily post graphic, or to "redesign this card in my style".
---

# LinkedIn board in the Aleem Design System

A reference card going around LinkedIn is treated as a prompt, not a template. The output is a board that keeps the reference's subject (and its layout only when the author asks for it), carries a one-sentence claim of the author's, is drawn from code in the Aleem Design System with the author's footer, and is checked by a script before anyone sees it. The post explains the board; the board shows only what matters in large type.

Design system: https://github.com/aleemcolaberry/Aleem-Design-System (by Md Abdul Aleem). This skill carries the light-mode subset a board needs in `templates/board.css` and `references/design-system.md`.

## Setup (once)

Requirements: Node with Playwright and a Chromium build (`npm i playwright && npx playwright install chromium`), Python 3 with Pillow (`pip install pillow`).

1. Put the author's square photo at `assets/avatar.png` (replace the placeholder).
2. Edit `AUTHOR` at the top of `templates/board_gen.py`: name, one-line title, avatar path. These never change between boards.
3. Create `work/` next to `templates/` and an empty `work/queue-log.md`.
4. Test: `cd work && cp ../templates/board_gen.py demo_gen.py && python3 demo_gen.py && node ../scripts/render.js "$PWD/demo.html" "$PWD/demo.png"`. The output must say both fonts `loaded` and `"bad":[]`.

## Inputs, every round

- The reference image and its original post text (or, with no reference, a topic and the author's angle).
- Any layout instruction from the author: "I like this wheel", "different layout", "cartoon rows like this".
- The author's context: who they are, what they believe, how they write, what they never claim. Without it, ask before writing the post.

## Workflow

### Step 0. Duplicate check

Read `work/queue-log.md`. If the subject or the claim is already queued, stop and tell the author which slot has it and how many boards in the queue share the cluster. Continue only on "skip" (drop it), "you decide", or an explicit override. An override means a claim that is not yet in the queue, never a second version of the same argument. If three boards inside a week would share one taxonomy, park the new one two weeks out. Refuse when the only angle left is generic or would weaken the author's positioning.

### Step 1. Read the reference, write the claim

Read the card for what it claims, what it leaves out, and the single detail a practitioner in the author's field notices first. Verify any fact that will be reused (prices, licence terms, regulator names, product features) on the web; a wrong fact becomes a correction in the post, never a repetition. Write the claim as one sentence before any layout. It becomes the two-line h1. Example: "Climb a layer, lose a guarantee."

### Step 2. Choose the composition

Pick a hero shape different from the last two boards (catalogue in `references/compositions-and-audit.md`). Decide the one oversized element in the hero, the two strip sentences (why it matters, the test), and which single element carries the red or amber accent. Plan the words: headline, up to five mono labels, at most one line per card. Everything else goes to the post.

### Step 3. Build

Copy `templates/board_gen.py` to `work/<name>_gen.py`. Fill `CONTENT`, write `EXTRA` (this round's layout classes) and `hero()` (HTML grid or inline SVG). Read `references/design-system.md` for tokens, type sizes and parts; use token names where they exist and the listed hex for deep and tint semantics. Brand marks are real (cropped from the reference or captured from the brand's own site) or absent, with the name set in text. Icons for abstract concepts are original 24px stroke SVGs.

### Step 4. Render and check until clean

```bash
cd work && python3 <name>_gen.py && node ../scripts/render.js "$PWD/<name>.html" "$PWD/<name>.png"
node ../scripts/measure.js "$PWD/<name>.html" ".head,.hero,.strip,.foot,.hero svg"
python3 ../scripts/export.py <name>.png
```

Loop until `bad` is `[]` and both fonts are `loaded`. Use `measure.js` to confirm head, hero, strip and foot fill the 1262px inner height; a hero that is half empty fails. Open `<name>_preview.png` and the 2x crops and look for what the renderer cannot see (list in `references/compositions-and-audit.md`). Then score the board 1 to 10 against the audit in that file. Below 7, rework; do not ship. Report the score.

### Step 5. Deliver the image

`export.py` writes the 1x preview and a JPG. Hand the author the PNG (2160x2700) and the JPG. If a path on the author's machine is agreed, write the PNG there too.

### Step 6. Write the post

Follow `references/post-rules.md`: concrete first line (never a number or a question), one idea per short paragraph, a U+2800 character on every blank line, one closing question, two or three varied hashtags, no links, no em dashes, no emoji, under 3,000 characters with 40 to spare. Never name the person whose content the reference came from; never invent the author's projects, numbers or usage ("I would" where the author has not stated the fact). If the `linkedin-skills` collection is installed, run its Humanizer on the draft. Save as `work/<name>-post.txt` and run `python3 scripts/check_post.py work/<name>-post.txt` until it prints OK.

### Step 7. Schedule (optional)

Only with a browser-automation tool in the author's own signed-in browser, and only under the rules in `references/scheduling.md`: never click Post, never handle credentials, stop at the "Post scheduled" toast, report one fixed sentence. Otherwise hand over the files and stop.

### Step 8. Log

Append the slot to `work/queue-log.md` using the template in `references/scheduling.md`: date, name, title, reference described without its author's name, claim, composition, accent, marks, verified facts, post length and hashtags, score, lesson. This is what makes Step 0 possible tomorrow.

## Output contract

- `work/<name>.png` (2160x2700, 2x of 1080x1350), `work/<name>.jpg`, `work/<name>_preview.png`
- `work/<name>-post.txt` passing `check_post.py`
- A stated audit score out of 10 (7 or higher)
- One line appended to `work/queue-log.md`

## Fixed rules

1. Light mode only; dark is a panel colour, never the board.
2. Plus Jakarta Sans and JetBrains Mono, no other faces.
3. Real brand marks or none. Never draw a stand-in for a logo.
4. One accent per board.
5. The author's footer on every board, identical each time; never the reference's branding.
6. No em dashes, no emoji, no ellipses, on the board or in the post.
7. No clipped text, no overflow, no half-empty hero; `bad` must be `[]`.
8. Never post on the author's behalf; scheduling is the furthest automated step, and it stops at the confirmation.

## Files

- `templates/board.css`: the fixed frame (tokens, header, hero shell, cards, strip, footer)
- `templates/board_gen.py`: generator template with `AUTHOR`, `CONTENT`, `EXTRA`, `hero()`
- `scripts/render.js`: render at 2x and report clipped or overflowing elements
- `scripts/measure.js`: section boxes and content bottoms
- `scripts/export.py`: 1x preview, JPG, 2x crops
- `scripts/check_post.py`: post checks
- `references/design-system.md`: tokens, type, parts, rules
- `references/post-rules.md`: writing rules and skeleton
- `references/compositions-and-audit.md`: shapes, render loop, what the renderer misses, audit, pitfalls
- `references/scheduling.md`: LinkedIn scheduling brief, safety rules, queue log template
- `fonts/`: Latin-subset variable builds of the two typefaces (SIL OFL)
- `assets/avatar.png`: placeholder photo to replace
