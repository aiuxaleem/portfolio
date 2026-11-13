# Aleem Brand Kit

Version 1.0, 12 November 2026. Everything you need to put the Aleem brand on a page, a deck, a post or a product. The full rules are in `06-Guidelines/Aleem-Brand-Guidelines.html`. Open it in a browser while you are online, so it loads Plus Jakarta Sans.

## Which file do I need?

| I am making… | Use |
|---|---|
| A website or app header | `01-Logo/SVG/aleem-logo.svg`, or `aleem-logo-dark.svg` on dark backgrounds |
| Anything about the design system (docs, decks, showcase) | `01-Logo/SVG/aleem-ds-logo.svg` / `-dark.svg`, or `aleem-ds-stacked.svg` in narrow spaces |
| A slide, document or email | The PNG of the same file in `01-Logo/PNG`. `aleem-logo-128px.png` suits an email signature, shown at 32px tall |
| A favicon or app icon | `02-Favicon-and-app-icons` and the tags in `head-tags.html` |
| A profile picture | `05-Social/aleem-avatar-800.png` (it crops cleanly to a circle) |
| A link preview, LinkedIn or X header | `05-Social` |
| One-colour print, embossing or a photo background | `01-Logo/SVG/aleem-logo-mono-navy.svg` or `aleem-logo-mono-white.svg` |
| Colours in Figma, Adobe or code | `04-Colour`: `.ase` swatches, `aleem-colors.css`, `aleem-colors.json`, `tokens.json` |

## Folders

- `01-Logo/SVG`: 19 outlined vector files.
  - Design System lockups, horizontal and stacked, for light and dark backgrounds.
  - The product logo: horizontal, vertical and dark versions.
  - Mono navy and mono white.
  - The mark (navy, dark, white and mono), the ai glyph alone, and the wordmark.
- `01-Logo/PNG`: every SVG as a transparent PNG.
  - Lockups at 128, 256 and 512px tall.
  - Marks and glyphs at 256, 512 and 1024px.
- `02-Favicon-and-app-icons`:
  - `favicon.ico` (16, 32 and 48px), `aleem-favicon.svg` and the favicon PNGs;
  - Apple touch icon (180px);
  - Android icons (192 and 512px, maskable);
  - a 1024px app-store icon with no transparency, and `aleem-app-icon.svg`;
  - `site.webmanifest` and `head-tags.html`.
- `03-Mascot`: the Cory mascot tiles and the older Cory wordmark. Cory is a separate character, so never lock it up with the Aleem logo.
- `04-Colour`: the palette and every design token.
- `05-Social`: avatar (800×800), Open Graph image (1200×630), LinkedIn banner (1584×396) and X header (1500×500).
- `06-Guidelines`: the brand guidelines page.

## The rules in one minute

- **The idea.** The mark is an "a" whose bowl is a chat bubble. The dot on its stem makes it "ai". That dot is the only gradient in the logo.
- **Clear space.** Keep a quarter of the tile's height free on every side.
- **Minimum sizes:**
  - mark: 24px (the favicon file works down to 16px);
  - product logo: 20px tall;
  - Design System lockups: 40px tall.
- **Backgrounds.** Light backgrounds take the navy tile. Night and navy backgrounds take the `-dark` files. The gradient and photos take the white or mono files.
- **Never:**
  - stretch, rotate, recolour or outline the logo;
  - add shadows or glows;
  - put the gradient on the letters;
  - retype "aleem" in a font.
- **Colour.**
  - Navy `#0B1F36` carries the words.
  - The gradient `#258AFD → #29BEDD` appears once per view.
  - The page background is Cloud `#F4F5FA`.
- **Type.**
  - Plus Jakarta Sans (free on Google Fonts): ExtraBold headlines, Regular body.
  - JetBrains Mono for data.
  - IBM Plex Sans Arabic for Arabic.
- **Voice.** Aleem speaks in the first person, leads with the number and talks about the reader's team.

The source of truth is the Aleem Design System: `assets/Logo` and `assets/Logo/README.md`.
