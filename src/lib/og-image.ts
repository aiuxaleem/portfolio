/* Open Graph images, drawn at build time (1200 x 630 PNG) with the site's own fonts and colours.
   Colours are read from src/styles/tokens.css, so the token file stays the one source of truth.
   The layout follows the existing home card (public/assets/og-home.png): the logo, title, name line, address, kicker.
   The logo is the brand kit's dark-ground file as it is (L-67): the kit never sets "aleem" in a font. */
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from '../content/site';
import { profile } from '../content/profile';

const root = process.cwd();
const css = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
/** The first (light theme, :root) value of a token, with var() references resolved. */
function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`og-image: token --${name} not found in tokens.css`);
  return m[1].trim().replace(/var\(--([\w-]+)\)/g, (_, n) => token(n));
}
/* The kit's logo on the card's navy gradient: its white file's colours (a white tile, a navy a, the gradient dot) beside the
   white wordmark, made from the kit's dark file by swapping the tile's and the letter's fills. */
const logoSvg = (() => { const s = fs.readFileSync(path.join(root, 'Aleem-Brand-Kit/Aleem-Brand-Kit/01-Logo/SVG/aleem-logo-dark.svg'), 'utf8'); const [tile, letter] = [...s.matchAll(/<path d="[^"]+" fill="(#[0-9A-F]{6})"\/>/g)]; if (!tile || !letter) throw new Error('og-image: the logo file changed shape'); return s.replace(tile[0], tile[0].replace(tile[1], token('white'))).replace(letter[0], letter[0].replace(letter[1], token('navy-800'))); })();
const logo = 'data:image/svg+xml;base64,' + Buffer.from(logoSvg).toString('base64');
const LOGO_H = 48, LOGO_W = Math.round((LOGO_H * 423.566) / 120);
const font = (pkg: string, file: string) => fs.readFileSync(path.join(root, 'node_modules/@fontsource', pkg, 'files', file));
const fonts = [
  { name: 'Plus Jakarta Sans', data: font('plus-jakarta-sans', 'plus-jakarta-sans-latin-800-normal.woff'), weight: 800 as const, style: 'normal' as const },
  { name: 'Plus Jakarta Sans', data: font('plus-jakarta-sans', 'plus-jakarta-sans-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];

export const OG = { width: 1200, height: 630 };
const el = (style: Record<string, unknown>, children?: unknown) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });

/** Title size steps down with length; anything longer than four lines is cut with an ellipsis. */
const titleSize = (t: string) => (t.length <= 28 ? 88 : t.length <= 48 ? 74 : t.length <= 80 ? 60 : 50);

export async function renderOg({ title, kicker }: { title: string; kicker?: string }): Promise<Buffer> {
  const strong = token('on-ink-strong'), body = token('on-ink-body'), muted = token('on-ink-muted');
  const tree = el({ position: 'relative', width: OG.width, height: OG.height, flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', backgroundImage: token('gradient-ink'), color: strong, fontFamily: 'Plus Jakarta Sans' }, [
    el({ position: 'absolute', top: -220, right: -160, width: 760, height: 760, backgroundImage: token('glow-cyan') }),
    el({ alignItems: 'center' }, [{ type: 'img', props: { src: logo, width: LOGO_W, height: LOGO_H } }]),
    el({ flexDirection: 'column', gap: 24 }, [
      el({ display: 'block', fontSize: titleSize(title), fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.035em', lineClamp: 4, wordBreak: 'break-word', maxWidth: 1040 }, title),
      el({ fontSize: 28, fontWeight: 500, color: body }, `${site.name} · ${profile.headline}`),
    ]),
    el({ justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }, [
      el({ fontSize: 24, fontWeight: 500, color: muted }, new URL(import.meta.env.SITE).host),
      kicker ? el({ display: 'block', fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 500, color: body, lineClamp: 1, maxWidth: 640 }, kicker) : el({}),
    ]),
  ]);
  const svg = await satori(tree as any, { ...OG, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG.width } }).render().asPng();
}
