/* Section-head illustrations (owner request, 24 November 2026): where a section's heading and lead sat on the left with
   the right side empty, a wide strip of what the section is about, 480 × 200 with every shape inside 12 to 468 across and
   12 to 188 down. The vocabulary and colours of styles/art.css, as the page-head scenes (art/scenes.ts). Decorative: the
   section's words carry the meaning. With motion on, the lines draw and the shapes settle as the strip scrolls into view
   (motion.css, .section-art). */
import { CARD_ICON_PATHS } from '../cards/card-icons';

const d = (i: number) => `data-draw="" pathLength="1" style="--art-i:${i}"`;
const p = (i: number) => `data-pop="" style="--art-i:${i}"`;

/* The AI agent, as on Home's "Two users" and the Process brief: a rounded head with two eyes and an antenna. */
const agent = (x: number, y: number, i: number) => `
    <path class="pa-accent" d="M${x + 32} ${y}v-12"/><circle class="pa-link" cx="${x + 32}" cy="${y - 16}" r="5"/>
    <rect class="pa-fill" ${p(i)} x="${x}" y="${y}" width="64" height="58" rx="18"/>
    <circle class="pa-play" cx="${x + 21}" cy="${y + 26}" r="5.5"/><circle class="pa-play" cx="${x + 43}" cy="${y + 26}" r="5.5"/>
    <path class="pa-on-fill" d="M${x + 22} ${y + 40}q10 8 20 0"/>`;

/* A card's own icon (cards/card-icons.ts, Lucide), outlined at the cards' stroke, so a strip shows the same sign as the
   tile below it (eighth review, 27 November 2026: the strips drew other signs, filled). */
const icon = (name: string, x: number, y: number, size: number) => `<g class="pa-icon" transform="translate(${x} ${y}) scale(${size / 24})">${CARD_ICON_PATHS[name]}</g>`;

export const SECTION_SCENES = {
  /* Built for AI agents too: a design system publishes an MCP server, an llms.txt and skills, and an agent reads all three. */
  agents: `
    <rect class="pa-card" x="16" y="36" width="128" height="128" rx="16"/>
    <circle class="pa-fill" ${p(0)} cx="44" cy="64" r="10"/><circle class="pa-link" ${p(1)} cx="70" cy="64" r="10"/><circle class="pa-strong" ${p(2)} cx="96" cy="64" r="10"/>
    <rect class="pa-fill" x="34" y="92" width="70" height="22" rx="11"/>
    <path class="pa-line" d="M34 134h88M34 148h60"/>
    <path class="pa-stroke" ${d(3)} d="M144 100c24 0 24-62 52-62M144 100h52M144 100c24 0 24 62 52 62"/>
    <rect class="pa-chip" x="196" y="20" width="112" height="36" rx="12"/><text class="pa-mono" x="214" y="43">MCP</text><path class="pa-line" d="M256 38h36"/>
    <rect class="pa-chip" x="196" y="82" width="112" height="36" rx="12"/><text class="pa-mono" x="214" y="105">llms.txt</text>
    <rect class="pa-chip" x="196" y="144" width="112" height="36" rx="12"/><text class="pa-mono" x="214" y="167">SKILL.md</text>
    <path class="pa-accent" ${d(4)} d="M308 38c32 0 32 62 64 62M308 100h64M308 162c32 0 32-62 64-62"/>
    ${agent(384, 74, 5)}`,

  /* From brand to a system agents can read: the mark and its wordmark, its colours, the components, then the agent that
     builds with them. */
  brandToAgents: `
    <rect class="pa-fill" ${p(0)} x="28" y="44" width="64" height="64" rx="18"/>
    <circle class="pa-on-fill pa-glyph" cx="52" cy="70" r="9"/><rect class="pa-on-fill pa-glyph" x="58" y="76" width="18" height="18" rx="5"/>
    <path class="pa-title" d="M24 128h72"/><path class="pa-line" d="M32 146h56"/>
    <path class="pa-accent" ${d(1)} d="M112 96h28M134 90l6 6-6 6"/>
    <rect class="pa-card" x="148" y="52" width="96" height="88" rx="16"/>
    <circle class="pa-fill" ${p(2)} cx="176" cy="80" r="13"/><circle class="pa-link" cx="216" cy="80" r="13"/>
    <circle class="pa-strong" cx="176" cy="114" r="13"/><circle class="pa-soft pa-edge" cx="216" cy="114" r="13"/>
    <path class="pa-accent" ${d(3)} d="M252 96h28M274 90l6 6-6 6"/>
    <rect class="pa-card" x="284" y="44" width="96" height="104" rx="16"/>
    <rect class="pa-fill" ${p(4)} x="300" y="62" width="64" height="22" rx="11"/>
    <rect class="pa-soft pa-edge" x="300" y="96" width="36" height="18" rx="9"/><circle class="pa-strong" cx="327" cy="105" r="6"/>
    <rect class="pa-card" x="300" y="122" width="64" height="16" rx="5"/>
    <path class="pa-accent" ${d(5)} d="M386 96h12M392 90l6 6-6 6"/>
    ${agent(404, 76, 6)}`,

  /* Four ways into my work, in the order of the cards below and with the same icons as their kickers (a swatch book, a
     briefcase, an open book and the skill mark), outlined at the cards' stroke in one tile each, every card named in words;
     the first, design systems, edged in the link colour (eleventh review, 27 November 2026: the pictograms were drawn at twice
     the icons' weight, in two colours). */
  workWays: `
    <rect class="pa-chip" ${p(0)} x="16" y="28" width="98" height="144" rx="14"/><rect class="pa-play pa-edge" x="35" y="46" width="60" height="60" rx="16"/>${icon('swatch-book', 47, 58, 36)}<text class="pa-mono" x="65" y="148" text-anchor="middle">systems</text>
    <rect class="pa-card" ${p(1)} x="130" y="28" width="98" height="144" rx="14"/><rect class="pa-play pa-edge" x="149" y="46" width="60" height="60" rx="16"/>${icon('briefcase', 161, 58, 36)}<text class="pa-mono" x="179" y="148" text-anchor="middle">projects</text>
    <rect class="pa-card" ${p(2)} x="244" y="28" width="98" height="144" rx="14"/><rect class="pa-play pa-edge" x="263" y="46" width="60" height="60" rx="16"/>${icon('book-open', 275, 58, 36)}<text class="pa-mono" x="293" y="140" text-anchor="middle">case</text><text class="pa-mono" x="293" y="156" text-anchor="middle">studies</text>
    <rect class="pa-card" ${p(3)} x="358" y="28" width="98" height="144" rx="14"/><rect class="pa-play pa-edge" x="377" y="46" width="60" height="60" rx="16"/>${icon('skill-mark', 389, 58, 36)}<text class="pa-mono" x="407" y="148" text-anchor="middle">skills</text>
    <path class="pa-accent" ${d(4)} d="M114 76h16M228 76h16M342 76h16"/>`,

  /* What I share: a video, a reel (the camera), a post and the newsletter with its podcast (the waveform), fanned like cards in a hand. */
  channels: `
    <rect class="pa-card" x="20" y="40" width="132" height="120" rx="14" transform="rotate(-6 86 100)"/>
    <rect class="pa-fill" ${p(0)} x="32" y="52" width="108" height="62" rx="8" transform="rotate(-6 86 100)"/>
    <circle class="pa-play" cx="86" cy="83" r="15" transform="rotate(-6 86 100)"/><path class="pa-fill" d="M82 75v16l13-8z" transform="rotate(-6 86 100)"/>
    <path class="pa-line" d="M34 132h88M34 146h56" transform="rotate(-6 86 100)"/>
    <rect class="pa-card" x="132" y="24" width="104" height="152" rx="18" transform="rotate(-2 184 100)"/>
    <rect class="pa-soft" x="144" y="38" width="80" height="96" rx="10" transform="rotate(-2 184 100)"/>
    <rect class="pa-chip" ${p(1)} x="156" y="58" width="56" height="56" rx="16" transform="rotate(-2 184 100)"/><circle class="pa-accent" cx="184" cy="86" r="13" transform="rotate(-2 184 100)"/><circle class="pa-link" cx="200" cy="70" r="3.5" transform="rotate(-2 184 100)"/>
    <path class="pa-line" d="M148 152h56" transform="rotate(-2 184 100)"/>
    <rect class="pa-card" x="226" y="30" width="128" height="140" rx="14" transform="rotate(3 290 100)"/>
    <circle class="pa-fill" ${p(2)} cx="250" cy="56" r="11" transform="rotate(3 290 100)"/>
    <path class="pa-title" d="M268 52h56" transform="rotate(3 290 100)"/><path class="pa-line" d="M268 64h30M242 90h96M242 106h80M242 122h90" transform="rotate(3 290 100)"/>
    <circle class="pa-link" cx="248" cy="148" r="5" transform="rotate(3 290 100)"/><circle class="pa-strong" cx="260" cy="148" r="5" transform="rotate(3 290 100)"/>
    <rect class="pa-card" x="344" y="44" width="120" height="116" rx="14" transform="rotate(7 404 102)"/>
    <path class="pa-fill" ${p(3)} d="M362 66h84v52h-84z" transform="rotate(7 404 102)"/>
    <path class="pa-on-fill" d="M366 70l38 28 38-28" transform="rotate(7 404 102)"/>
    <path class="pa-accent pa-glyph" d="M364 136v0M372 131v10M380 126v20M388 132v8M396 128v16M404 133v6M412 127v18M420 131v10M428 134v4M436 132v8" transform="rotate(7 404 102)"/>
    <path class="pa-accent" ${d(4)} d="M60 186c90-16 270-16 380 0"/>`,

  /* From brief to live build, with the design system in every step: the brief, the system's layers, the live page with
     its check. */
  process: `
    <path class="pa-card" ${p(0)} d="M28 36h66l22 22v98a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8V44a8 8 0 0 1 8-8z"/><path class="pa-stroke" d="M94 36v22h22"/>
    <path class="pa-title" d="M36 78h46"/><path class="pa-line" d="M36 100h64M36 116h52M36 132h58"/>
    <path class="pa-accent" ${d(1)} d="M128 100h28M150 94l6 6-6 6"/>
    <rect class="pa-card" x="172" y="112" width="132" height="44" rx="12"/><path class="pa-line" d="M188 144h60"/>
    <rect class="pa-chip" x="172" y="80" width="132" height="44" rx="12"/><rect class="pa-soft pa-edge" x="188" y="96" width="36" height="14" rx="7"/><path class="pa-line" d="M234 103h50"/>
    <rect class="pa-fill" ${p(2)} x="172" y="48" width="132" height="44" rx="12"/>
    <circle class="pa-play" cx="194" cy="70" r="6"/><circle class="pa-play" cx="214" cy="70" r="6"/><circle class="pa-play" cx="234" cy="70" r="6"/><path class="pa-on-fill" d="M254 70h32"/>
    <path class="pa-accent" ${d(3)} d="M316 100h24M334 94l6 6-6 6"/>
    <rect class="pa-card" x="352" y="40" width="112" height="120" rx="14"/><path class="pa-stroke" d="M352 62h112"/>
    <circle class="pa-soft pa-edge" cx="366" cy="51" r="3.5"/><circle class="pa-soft pa-edge" cx="378" cy="51" r="3.5"/><circle class="pa-soft pa-edge" cx="390" cy="51" r="3.5"/>
    <rect class="pa-soft" x="366" y="74" width="84" height="30" rx="6"/><path class="pa-line" d="M366 120h62M366 136h44"/>
    <circle class="pa-fill pa-rim" ${p(4)} cx="446" cy="152" r="16"/><path class="pa-on-fill pa-glyph" d="M439 152l5 5 10-10"/>`,

  /* Picks for designers, checked by hand: three skill cards, two already read and ticked, the third under the lens. */
  picks: `
    ${[0, 1, 2].map(i => { const x = 24 + i * 148; return `
    <rect class="pa-card" ${p(i)} x="${x}" y="34" width="132" height="132" rx="14"/>
    <rect class="pa-chip" x="${x + 16}" y="50" width="28" height="28" rx="8"/><path class="pa-accent pa-glyph" d="M${x + 27} 58l-5 6 5 6M${x + 33} 58l5 6-5 6"/>
    <path class="pa-title" d="M${x + 16} 100h72"/><path class="pa-line" d="M${x + 16} 118h96M${x + 16} 132h68"/>
    <rect class="pa-soft pa-edge" x="${x + 16}" y="144" width="100" height="10" rx="5"/>
    ${i < 2 ? `<circle class="pa-fill pa-rim" cx="${x + 112}" cy="54" r="12"/><path class="pa-on-fill pa-glyph" d="M${x + 106} 54l4 4 8-8"/>` : ''}`; }).join('')}
    <circle class="pa-found" ${p(3)} cx="412" cy="108" r="26"/><path class="pa-title" d="M396 102h32"/><path class="pa-line" d="M396 118h22"/><path class="pa-accent" ${d(4)} d="M431 127l16 16"/>`,

  /* New in the official directory, checked every week: the week on a calendar, and the cards it brought, the newest
     marked. */
  newInDirectory: `
    <rect class="pa-card" x="24" y="40" width="148" height="128" rx="14"/><path class="pa-stroke" d="M24 68h148"/>
    <path class="pa-accent" d="M60 30v18M136 30v18"/><path class="pa-title" d="M40 54h40"/>
    ${[86, 110, 134].map(y => [0, 1, 2, 3, 4, 5, 6].map(k => `<circle class="pa-soft pa-edge" cx="${42 + k * 19}" cy="${y + 6}" r="4.5"/>`).join('')).join('')}
    <circle class="pa-fill pa-rim" ${p(0)} cx="137" cy="116" r="10"/>
    <path class="pa-accent" ${d(1)} d="M184 104h28M206 98l6 6-6 6"/>
    ${[0, 1, 2].map(k => { const y = 30 + k * 50; return `
    <rect class="pa-card${k === 2 ? ' pa-faint' : ''}" ${p(2 + k)} x="224" y="${y}" width="228" height="42" rx="12"/>
    <rect class="pa-chip" x="238" y="${y + 9}" width="24" height="24" rx="7"/><path class="pa-title" d="M276 ${y + 15}h86"/><path class="pa-line" d="M276 ${y + 29}h124"/>
    ${k < 2 ? `<circle class="pa-link" cx="434" cy="${y + 21}" r="5.5"/>` : ''}`; }).join('')}`,

  /* Anthropic's official directory, design first: the directory as a window with its search and filters, and its plugins
     in rows, the design row lit. */
  directory: `
    <rect class="pa-card" x="24" y="20" width="432" height="160" rx="16"/>
    <rect class="pa-soft pa-edge" x="44" y="36" width="212" height="28" rx="14"/><circle class="pa-stroke" cx="62" cy="50" r="6"/><path class="pa-stroke" d="M67 55l5 5"/><path class="pa-line" d="M82 50h84"/>
    <rect class="pa-fill" ${p(0)} x="272" y="36" width="80" height="28" rx="14"/><path class="pa-on-fill" d="M290 50h44"/>
    <rect class="pa-chip" x="362" y="36" width="74" height="28" rx="14"/><path class="pa-line" d="M380 50h38"/>
    ${[0, 1].map(r => [0, 1, 2, 3].map(c => { const x = 44 + c * 100, y = 80 + r * 50; return `<rect class="${r === 0 ? 'pa-chip' : 'pa-card'}" ${r === 0 ? p(1 + c) : ''} x="${x}" y="${y}" width="92" height="42" rx="10"/><rect class="${r === 0 ? 'pa-fill' : 'pa-soft pa-edge'}" x="${x + 10}" y="${y + 11}" width="20" height="20" rx="6"/><path class="pa-title pa-thin" d="M${x + 40} ${y + 16}h40"/><path class="pa-line" d="M${x + 40} ${y + 29}h28"/>`; }).join('')).join('')}`,

  /* How to install a skill: the downloaded zip, the one folder inside kept whole, then the app where it runs. */
  install: `
    <rect class="pa-card" x="24" y="44" width="96" height="112" rx="12"/>
    <path class="pa-stroke" d="M66 52h6M72 60h6M66 68h6M72 76h6M66 84h6"/><rect class="pa-fill" ${p(0)} x="64" y="92" width="16" height="22" rx="4"/>
    <text class="pa-mono" x="50" y="144">.zip</text>
    <path class="pa-accent" ${d(1)} d="M132 100h24M150 94l6 6-6 6"/>
    <path class="pa-chip" ${p(2)} d="M172 70a8 8 0 0 1 8-8h24l10 10h40a8 8 0 0 1 8 8v52a8 8 0 0 1-8 8h-74a8 8 0 0 1-8-8z"/>
    <path class="pa-accent" d="M190 110h52"/><text class="pa-mono" x="176" y="166">SKILL.md</text>
    <path class="pa-accent" ${d(3)} d="M274 100h24M292 94l6 6-6 6"/>
    <rect class="pa-card" x="312" y="40" width="144" height="120" rx="14"/><path class="pa-stroke" d="M312 62h144"/>
    <circle class="pa-soft pa-edge" cx="326" cy="51" r="3.5"/><circle class="pa-soft pa-edge" cx="338" cy="51" r="3.5"/><circle class="pa-soft pa-edge" cx="350" cy="51" r="3.5"/>
    <rect class="pa-fill" ${p(4)} x="326" y="74" width="116" height="36" rx="8"/><path class="pa-on-fill pa-glyph" d="M338 86l6 6-6 6"/><path class="pa-on-fill" d="M354 98h56"/>
    <path class="pa-ok" d="M328 134l6 6 12-12"/><path class="pa-line" d="M358 134h70"/>`,

  /* What a design system is made of: six layers stacked from the ground up, the ground (tokens) lit, and the six listed
     beside the stack in the same order. */
  layers: `
    ${[0, 1, 2, 3, 4, 5].map(k => { const cy = 160 - k * 20, cx = 160; return `<path class="${k === 0 ? 'pa-fill' : 'pa-card'}" ${p(k)} d="M${cx - 112} ${cy}L${cx} ${cy - 26}L${cx + 112} ${cy}L${cx} ${cy + 26}z"/>`; }).join('')}
    <path class="pa-accent" ${d(6)} d="M282 160h26"/>
    ${[0, 1, 2, 3, 4, 5].map(k => { const y = 164 - k * 26; return `<circle class="${k === 0 ? 'pa-fill' : 'pa-soft pa-edge'}" cx="326" cy="${y}" r="6"/><path class="${k === 0 ? 'pa-title' : 'pa-line'}" d="M344 ${y}h${k === 0 ? 96 : 82 - (k % 3) * 12}"/>`; }).join('')}`,

  /* The library: every system on a shelf, filtered by what you want to learn; the ones the filter keeps are lit. */
  library: `
    <rect class="pa-fill" ${p(0)} x="24" y="20" width="96" height="28" rx="14"/><path class="pa-on-fill" d="M42 34h60"/>
    <rect class="pa-chip" x="128" y="20" width="88" height="28" rx="14"/><path class="pa-line" d="M146 34h52"/>
    <rect class="pa-chip" x="224" y="20" width="72" height="28" rx="14"/><path class="pa-line" d="M242 34h36"/>
    ${(() => { let x = 32; return [[30, 104, 0], [26, 92, 1], [34, 112, 0], [28, 84, 0], [30, 100, 1], [26, 96, 0], [36, 108, 0], [28, 88, 1], [30, 104, 0], [26, 94, 0], [32, 110, 0]].map(([w, h, lit], k) => { const s = `<rect class="${lit ? 'pa-fill' : k % 3 === 2 ? 'pa-soft pa-edge' : 'pa-card'}" ${lit ? p(1 + k) : ''} x="${x}" y="${170 - h}" width="${w}" height="${h}" rx="5"/><path class="${lit ? 'pa-on-fill' : 'pa-stroke'}" d="M${x + 8} ${182 - h}h${w - 16}"/>`; x += w + 6; return s; }).join(''); })()}
    <rect class="pa-card" x="436" y="72" width="10" height="98" rx="4" transform="rotate(-12 441 170)"/>
    <path class="pa-stroke" ${d(14)} d="M24 172h432"/>`,

  /* Further reading: a standard with its seal, a book open, and a gallery of examples. */
  reading: `
    <rect class="pa-card" x="28" y="30" width="110" height="140" rx="12"/>
    <path class="pa-title" d="M44 56h64"/><path class="pa-line" d="M44 78h78M44 94h66M44 110h74"/>
    <circle class="pa-fill pa-rim" ${p(0)} cx="110" cy="142" r="16"/><path class="pa-on-fill pa-glyph" d="M103 142l5 5 10-10"/>
    <path class="pa-card" ${p(1)} d="M240 60c-26-12-56-12-84 0v96c28-12 58-12 84 0z"/>
    <path class="pa-card" d="M240 60c26-12 56-12 84 0v96c-28-12-58-12-84 0z"/>
    <path class="pa-line" d="M172 86h52M172 102h44M172 118h48M256 86h52M256 102h40M256 118h48"/>
    <path class="pa-accent" ${d(2)} d="M240 60v96"/>
    <rect class="pa-card" x="344" y="36" width="112" height="128" rx="12"/>
    <rect class="pa-soft pa-edge" x="358" y="50" width="38" height="38" rx="6"/><rect class="pa-soft pa-edge" x="404" y="50" width="38" height="38" rx="6"/>
    <rect class="pa-soft pa-edge" x="358" y="96" width="38" height="38" rx="6"/><rect class="pa-fill" ${p(3)} x="404" y="96" width="38" height="38" rx="6"/>
    <path class="pa-line" d="M358 150h60"/>`,

  /* The systems I built: three systems side by side, each with its colours, a component and its parts, the counts taken
     from each system itself. */
  systems: `
    ${[0, 1, 2].map(i => { const x = 20 + i * 152, cls = [['pa-fill', 'pa-link', 'pa-strong'], ['pa-link', 'pa-strong', 'pa-soft pa-edge'], ['pa-strong', 'pa-fill', 'pa-soft pa-edge']][i]; return `
    <rect class="pa-card" ${p(i)} x="${x}" y="28" width="136" height="144" rx="14"/>
    ${cls.map((c, k) => `<circle class="${c}" cx="${x + 26 + k * 24}" cy="54" r="9"/>`).join('')}
    <path class="pa-title" d="M${x + 16} 86h70"/>
    <rect class="pa-fill" x="${x + 16}" y="102" width="62" height="22" rx="11"/><path class="pa-on-fill" d="M${x + 30} 113h34"/>
    <rect class="pa-chip" x="${x + 86}" y="102" width="34" height="22" rx="11"/>
    <path class="pa-line" d="M${x + 16} 144h${88 - i * 14}M${x + 16} 158h${56 + i * 10}"/>`; }).join('')}`,

  /* The skills I made: a skill's folder, its SKILL.md with the order of steps and the checks done, and the shield that
     says read it before you add it, as you would any software. */
  skillFolders: `
    <path class="pa-chip" ${p(0)} d="M24 64a8 8 0 0 1 8-8h28l12 12h52a8 8 0 0 1 8 8v64a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8z"/>
    <path class="pa-accent" d="M44 112h64"/>
    <path class="pa-accent" ${d(1)} d="M140 100h24"/>
    <rect class="pa-card" x="172" y="20" width="196" height="160" rx="14"/><text class="pa-mono" x="188" y="44">SKILL.md</text><path class="pa-stroke" d="M172 56h196"/>
    ${[0, 1, 2].map(k => { const y = 82 + k * 32; return `<circle class="${k < 2 ? 'pa-fill' : 'pa-chip'}" ${p(2 + k)} cx="194" cy="${y}" r="10"/>${k < 2 ? `<path class="pa-on-fill pa-glyph" d="M189 ${y}l4 4 7-7"/>` : ''}<path class="pa-line" d="M214 ${y}h${[124, 104, 116][k]}"/>`; }).join('')}
    <path class="pa-accent" ${d(5)} d="M368 100h14"/>
    <path class="pa-chip" ${p(6)} d="M420 50l36 12v32c0 26-16 44-36 52-20-8-36-26-36-52V62z"/>
    <path class="pa-accent" d="M406 98l10 10 20-20"/>`,

  /* Know a resource I should list? A link sent over, the inbox it lands in, and the list it joins once I have looked at
     it; the last row waits its turn. */
  suggest: `
    <rect class="pa-card" x="24" y="60" width="132" height="88" rx="14"/>
    <rect class="pa-soft pa-edge" x="40" y="76" width="100" height="20" rx="10"/><circle class="pa-stroke" cx="52" cy="86" r="4"/><path class="pa-line" d="M62 86h60"/>
    <path class="pa-title pa-thin" d="M40 114h76"/><path class="pa-line" d="M40 130h54"/>
    <circle class="pa-fill pa-rim" ${p(0)} cx="152" cy="60" r="14"/><path class="pa-on-fill pa-glyph" d="M146 60h12M152 54v12"/>
    <path class="pa-accent" ${d(1)} d="M172 104h28M194 98l6 6-6 6"/>
    <rect class="pa-chip" ${p(2)} x="236" y="40" width="64" height="44" rx="8"/><path class="pa-line" d="M250 56h36M250 68h24"/>
    <path class="pa-card" d="M226 88h84l20 40v32a8 8 0 0 1-8 8H214a8 8 0 0 1-8-8v-32z"/>
    <path class="pa-stroke" d="M206 128h38l8 12h32l8-12h38"/>
    <path class="pa-accent" ${d(3)} d="M342 128h22M358 122l6 6-6 6"/>
    <rect class="pa-card" x="374" y="56" width="82" height="112" rx="12"/>
    <path class="pa-ok" d="M386 82l4 4 8-8"/><path class="pa-line" d="M406 82h36"/>
    <path class="pa-ok" d="M386 108l4 4 8-8"/><path class="pa-line" d="M406 108h30"/>
    <circle class="pa-dashed" cx="392" cy="138" r="7"/><path class="pa-line pa-faint" d="M406 138h34"/>`,

  /* Case studies: what each one gives (the problem, the constraints, the decisions, the result), and the screen before and
     after, divided as the case studies compare them. */
  caseStudy: `
    <rect class="pa-card" x="24" y="20" width="176" height="160" rx="14"/><path class="pa-title" d="M44 46h88"/>
    <rect class="pa-chip"  x="44" y="64" width="20" height="20" rx="6"/><path class="pa-line" d="M76 74h100"/><rect class="pa-chip"  x="44" y="90" width="20" height="20" rx="6"/><path class="pa-line" d="M76 100h88"/><rect class="pa-chip"  x="44" y="116" width="20" height="20" rx="6"/><path class="pa-line" d="M76 126h76"/><rect class="pa-fill" ${p(0)} x="44" y="142" width="20" height="20" rx="6"/><path class="pa-line" d="M76 152h64"/>
    <path class="pa-accent" ${d(1)} d="M208 100h20M222 94l6 6-6 6"/>
    <rect class="pa-card" x="240" y="28" width="216" height="144" rx="14"/><path class="pa-stroke" d="M240 50h216"/>
    <circle class="pa-soft pa-edge" cx="254" cy="39" r="3.5"/><circle class="pa-soft pa-edge" cx="266" cy="39" r="3.5"/><circle class="pa-soft pa-edge" cx="278" cy="39" r="3.5"/>
    <rect class="pa-soft" x="256" y="62" width="74" height="14" rx="4"/><rect class="pa-soft" x="264" y="86" width="50" height="10" rx="3"/><rect class="pa-soft" x="254" y="104" width="68" height="10" rx="3"/>
    <path class="pa-line pa-faint" d="M258 132h58M268 148h44"/>
    <rect class="pa-chip" x="362" y="62" width="78" height="14" rx="7"/><path class="pa-line" d="M362 92h76M362 108h58"/>
    <rect class="pa-fill" ${p(2)} x="362" y="130" width="58" height="22" rx="11"/><path class="pa-ok" d="M428 141l5 5 9-9"/>
    <path class="pa-accent" d="M348 50v122"/><circle class="pa-fill pa-rim" ${p(3)} cx="348" cy="111" r="13"/><path class="pa-on-fill pa-glyph" d="M344 106l-4 5 4 5M352 106l4 5-4 5"/>`,

  /* What the work measured: the method behind the figures beside it, without repeating them: a screen whose text fails contrast, the audit, the same screen passing (seventh review, 26 November 2026: the figure drawn above the same figure read twice). */
  measured: `
    <rect class="pa-card" ${p(0)} x="24" y="28" width="176" height="144" rx="14"/><text class="pa-mono" x="44" y="56">before</text>
    <path class="pa-line" d="M44 80h92"/><circle class="pa-fill pa-rim" cx="176" cy="80" r="8"/><path class="pa-on-fill pa-glyph" d="M176 76v4M176 84v.5"/>
    <path class="pa-line" d="M44 104h108"/><circle class="pa-fill pa-rim" cx="176" cy="104" r="8"/><path class="pa-on-fill pa-glyph" d="M176 100v4M176 108v.5"/>
    <path class="pa-line" d="M44 128h76"/><circle class="pa-fill pa-rim" cx="176" cy="128" r="8"/><path class="pa-on-fill pa-glyph" d="M176 124v4M176 132v.5"/>
    <path class="pa-line" d="M44 152h96"/><circle class="pa-fill pa-rim" cx="176" cy="152" r="8"/><path class="pa-on-fill pa-glyph" d="M176 148v4M176 156v.5"/>
    <rect class="pa-chip" ${p(1)} x="212" y="70" width="56" height="28" rx="8"/><text class="pa-mono" x="240" y="89" text-anchor="middle">audit</text>
    <path class="pa-accent" ${d(2)} d="M212 120h52M258 114l6 6-6 6"/>
    <rect class="pa-card" ${p(3)} x="280" y="28" width="176" height="144" rx="14"/><text class="pa-mono" x="300" y="56">after</text>
    <circle class="pa-fill pa-rim" cx="436" cy="50" r="12"/><path class="pa-on-fill pa-glyph" d="M430 50l4 4 8-8"/>
    <path class="pa-ok" d="M300 80l4 4 8-8"/><path class="pa-title pa-thin" d="M320 80h92"/>
    <path class="pa-ok" d="M300 104l4 4 8-8"/><path class="pa-title pa-thin" d="M320 104h108"/>
    <path class="pa-ok" d="M300 128l4 4 8-8"/><path class="pa-title pa-thin" d="M320 128h76"/>
    <path class="pa-ok" d="M300 152l4 4 8-8"/><path class="pa-title pa-thin" d="M320 152h96"/>`,

  /* Work experience: the five companies on one line, each over the year it began (profile.json), the one I am at now lit (sixth review, 26 November 2026: the rising cards were generic). */
  career: `
    <path class="pa-stroke" ${d(0)} d="M28 150h424"/>
    <path class="pa-stroke" d="M60 142V124"/><circle class="pa-soft pa-edge" cx="60" cy="150" r="7"/><rect class="pa-card" ${p(0)} x="21.5" y="96" width="77" height="28" rx="8"/><text class="pa-mono" x="60" y="115" text-anchor="middle">Ray SEO</text><text class="pa-mono" x="60" y="178" text-anchor="middle">2014</text>
    <path class="pa-stroke" d="M152 142V86"/><circle class="pa-soft pa-edge" cx="152" cy="150" r="7"/><rect class="pa-card" ${p(1)} x="93.5" y="58" width="117" height="28" rx="8"/><text class="pa-mono" x="152" y="77" text-anchor="middle">Click2Clinic</text><text class="pa-mono" x="152" y="178" text-anchor="middle">2015</text>
    <path class="pa-stroke" d="M236 142V124"/><circle class="pa-soft pa-edge" cx="236" cy="150" r="7"/><rect class="pa-card" ${p(2)} x="201.5" y="96" width="69" height="28" rx="8"/><text class="pa-mono" x="236" y="115" text-anchor="middle">Teqsar</text><text class="pa-mono" x="236" y="178" text-anchor="middle">2019</text>
    <path class="pa-stroke" d="M322 142V86"/><circle class="pa-soft pa-edge" cx="322" cy="150" r="7"/><rect class="pa-card" ${p(3)} x="279.5" y="58" width="85" height="28" rx="8"/><text class="pa-mono" x="322" y="77" text-anchor="middle">NTT DATA</text><text class="pa-mono" x="322" y="178" text-anchor="middle">2022</text>
    <path class="pa-stroke" d="M414 142V124"/><circle class="pa-fill pa-rim" cx="414" cy="150" r="7"/><rect class="pa-fill" ${p(4)} x="367.5" y="96" width="93" height="28" rx="8"/><text class="pa-mono pa-num" x="414" y="115" text-anchor="middle">Colaberry</text><text class="pa-mono" x="414" y="178" text-anchor="middle">2025</text>`,

  /* Certifications: a verified certificate with its seal (Anthropic, Introduction to Agent Skills) and one in progress beside it (Google Cloud, Generative AI Leader), the issuers as certifications/ lists them. */
  certs: `
    <rect class="pa-card" ${p(0)} x="24" y="30" width="252" height="144" rx="12"/><rect class="pa-stroke" x="36" y="42" width="228" height="120" rx="8"/>
    <text class="pa-mono" x="62" y="72">Anthropic</text><path class="pa-title pa-thin" d="M62 92h132"/><path class="pa-line" d="M62 112h108"/>
    <path class="pa-fill" d="M222 138l-8 30 12-6 8 10 4-30zM246 138l8 30-12-6-8 10-4-30z"/>
    <circle class="pa-fill pa-rim" ${p(1)} cx="234" cy="132" r="18"/><path class="pa-on-fill pa-glyph" d="M226 132l5 5 11-11"/>
    <rect class="pa-card" x="300" y="50" width="156" height="112" rx="12"/><text class="pa-mono" x="318" y="80">Google Cloud</text><path class="pa-line" d="M318 100h112M318 114h80"/>
    <rect class="pa-soft pa-edge" x="318" y="134" width="120" height="10" rx="5"/><path class="pa-progress" ${d(2)} d="M323 139h52"/>`,

  /* Where I do my best work, and what I'll ask you: your question, and my answer with what I check, as a conversation. */
  conversation: `
    <path class="pa-card" ${p(0)} d="M40 28h176a12 12 0 0 1 12 12v52a12 12 0 0 1-12 12H84l-22 18v-18H40a12 12 0 0 1-12-12V40a12 12 0 0 1 12-12z"/>
    <path class="pa-title pa-thin" d="M48 52h124"/><path class="pa-line" d="M48 72h150M48 88h96"/>
    <path class="pa-chip" ${p(1)} d="M440 84H252a12 12 0 0 0-12 12v56a12 12 0 0 0 12 12h140l22 18v-18h26a12 12 0 0 0 12-12V96a12 12 0 0 0-12-12z"/>
    <path class="pa-ok" d="M258 110l4 4 8-8"/><path class="pa-line" d="M280 110h124"/>
    <path class="pa-ok" d="M258 132l4 4 8-8"/><path class="pa-line" d="M280 132h96"/>
    <path class="pa-ok" d="M258 154l4 4 8-8"/><path class="pa-line pa-faint" d="M280 154h110"/>`,

  /* What a skill is: a folder with one required file, SKILL.md, whose name and description Claude reads first (lit), the
     instructions below read only when a request matches (faint), and the agent reading. */
  skillIdea: `
    <path class="pa-chip" ${p(0)} d="M24 70a8 8 0 0 1 8-8h26l12 12h48a8 8 0 0 1 8 8v56a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8z"/>
    <path class="pa-accent" d="M44 112h58"/>
    <path class="pa-accent" ${d(1)} d="M136 104h22M152 98l6 6-6 6"/>
    <rect class="pa-card" x="168" y="20" width="176" height="160" rx="14"/><text class="pa-mono" x="184" y="44">SKILL.md</text><path class="pa-stroke" d="M168 56h176"/>
    <rect class="pa-chip" ${p(2)} x="180" y="66" width="152" height="46" rx="8"/>
    <path class="pa-title pa-thin" d="M194 82h64"/><path class="pa-line" d="M194 98h118"/>
    <path class="pa-line pa-faint" d="M194 130h120M194 146h96M194 162h108"/>
    <path class="pa-accent" ${d(3)} d="M384 106L340 92"/>
    ${agent(388, 80, 4)}`,

  /* Three steps, once: download the zip, add it to Claude, say what you want; each step a card in the order of the tiles.  Each card names its step in words, not bars (L-89 proposal 8). */
  threeSteps: `
    <rect class="pa-card" x="24" y="36" width="120" height="128" rx="14"/><text class="pa-mono" x="84" y="146" text-anchor="middle">download</text><rect class="pa-card" x="180" y="36" width="120" height="128" rx="14"/><text class="pa-mono" x="240" y="146" text-anchor="middle">add to Claude</text><rect class="pa-card" x="336" y="36" width="120" height="128" rx="14"/><text class="pa-mono" x="396" y="146" text-anchor="middle">ask</text>
    <rect class="pa-fill" ${p(0)} x="62" y="58" width="44" height="50" rx="8"/><path class="pa-on-fill pa-glyph" d="M84 68v24M76 84l8 8 8-8M74 100h20"/>
    <path class="pa-accent" ${d(1)} d="M148 100h28M170 94l6 6-6 6"/>
    <rect class="pa-chip" ${p(2)} x="206" y="60" width="68" height="48" rx="8"/><path class="pa-stroke" d="M206 72h68"/><path class="pa-accent pa-glyph" d="M240 100V80M232 88l8-8 8 8"/>
    <path class="pa-accent" ${d(3)} d="M304 100h28M326 94l6 6-6 6"/>
    <path class="pa-chip" ${p(4)} d="M362 60h56a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8h-34l-14 12v-12h-8a8 8 0 0 1-8-8V68a8 8 0 0 1 8-8z"/>
    <path class="pa-line" d="M368 76h42M368 90h28"/>`,

  /* My AI workflows, skills and artifacts: a workflow of three steps, a skill (the radiating mark), and an artifact page
     that opens where it lives. */
  madeByMe: `
    <rect class="pa-card"  x="24" y="30" width="92" height="36" rx="10"/><path class="pa-line" d="M40 48h52"/><rect class="pa-fill" ${p(0)} x="24" y="82" width="92" height="36" rx="10"/><path class="pa-on-fill" d="M40 100h60"/><rect class="pa-card"  x="24" y="134" width="92" height="36" rx="10"/><path class="pa-line" d="M40 152h44"/>
    <path class="pa-stroke" d="M70 66v16M70 118v16"/>
    <path class="pa-accent" ${d(1)} d="M126 100h20"/>
    <rect class="pa-card" x="156" y="36" width="116" height="128" rx="14"/>
    <path class="pa-accent" d="M214 62v10M214 102v10M188 87h10M230 87h10M196 69l7 7M225 98l7 7M196 105l7-7M225 76l7-7"/><circle class="pa-fill" ${p(2)} cx="214" cy="87" r="8"/>
    <path class="pa-title pa-thin" d="M176 138h64"/>
    <path class="pa-accent" ${d(3)} d="M282 100h20"/>
    <rect class="pa-card" x="312" y="24" width="144" height="152" rx="14"/><path class="pa-stroke" d="M312 46h144"/>
    <circle class="pa-soft pa-edge" cx="326" cy="35" r="3.5"/><circle class="pa-soft pa-edge" cx="338" cy="35" r="3.5"/><circle class="pa-soft pa-edge" cx="350" cy="35" r="3.5"/>
    <rect class="pa-soft" x="328" y="60" width="80" height="14" rx="4"/><path class="pa-line" d="M328 92h108M328 108h84"/>
    <rect class="pa-fill" ${p(4)} x="380" y="134" width="60" height="26" rx="13"/><path class="pa-on-fill pa-glyph" d="M403 153l12-12M405 141h10v10"/>`,

  /* By category: the categories as tiles, the fullest ones wide, one chosen, and the list it opens, filtered to it. */
  categories: `
    <rect class="pa-fill" ${p(0)} x="24" y="28" width="140" height="64" rx="12"/><rect class="pa-play" x="38" y="42" width="18" height="18" rx="5"/><path class="pa-on-fill" d="M38 76h70"/><rect class="pa-card" x="172" y="28" width="140" height="64" rx="12"/><rect class="pa-chip" x="184" y="40" width="18" height="18" rx="5"/><path class="pa-line" d="M184 76h64"/><rect class="pa-card" x="24" y="104" width="66" height="64" rx="12"/><rect class="pa-chip" x="36" y="116" width="18" height="18" rx="5"/><path class="pa-line" d="M36 152h36"/><rect class="pa-card" x="98" y="104" width="66" height="64" rx="12"/><rect class="pa-chip" x="110" y="116" width="18" height="18" rx="5"/><path class="pa-line" d="M110 152h36"/><rect class="pa-card" x="172" y="104" width="66" height="64" rx="12"/><rect class="pa-chip" x="184" y="116" width="18" height="18" rx="5"/><path class="pa-line" d="M184 152h36"/><rect class="pa-card" x="246" y="104" width="66" height="64" rx="12"/><rect class="pa-chip" x="258" y="116" width="18" height="18" rx="5"/><path class="pa-line" d="M258 152h36"/>
    <path class="pa-accent" ${d(1)} d="M322 98h20M336 92l6 6-6 6"/>
    <rect class="pa-card" x="352" y="28" width="104" height="140" rx="12"/>
    <rect class="pa-chip" ${p(2)} x="364" y="40" width="64" height="18" rx="9"/><path class="pa-accent pa-glyph" d="M374 49h36"/>
    <rect class="pa-soft pa-edge" x="364" y="71" width="14" height="14" rx="4"/><path class="pa-line" d="M386 78h54"/><rect class="pa-soft pa-edge" x="364" y="95" width="14" height="14" rx="4"/><path class="pa-line" d="M386 102h44"/><rect class="pa-soft pa-edge" x="364" y="119" width="14" height="14" rx="4"/><path class="pa-line" d="M386 126h50"/><rect class="pa-soft pa-edge" x="364" y="143" width="14" height="14" rx="4"/><path class="pa-line" d="M386 150h38"/>`,

  /* Filter and sort: the bar (a search, the chosen kind, the order) over the cards it leaves; the last one filtered out. */
  filterSort: `
    <rect class="pa-card" x="24" y="24" width="432" height="44" rx="22"/>
    <circle class="pa-stroke" cx="50" cy="45" r="7"/><path class="pa-stroke" d="M55 50l5 5"/><path class="pa-line" d="M70 46h48"/>
    <rect class="pa-fill" ${p(0)} x="140" y="34" width="68" height="24" rx="12"/><path class="pa-on-fill" d="M154 46h40"/>
    <rect class="pa-soft pa-edge" x="216" y="34" width="56" height="24" rx="12"/><rect class="pa-soft pa-edge" x="280" y="34" width="56" height="24" rx="12"/>
    <rect class="pa-soft pa-edge" x="356" y="34" width="88" height="24" rx="12"/><path class="pa-line" d="M370 46h30"/><path class="pa-accent pa-glyph" ${d(1)} d="M418 43l5 5 5-5"/>
    <rect class="pa-card" ${p(2)} x="24" y="84" width="210" height="40" rx="10"/><rect class="pa-chip" x="36" y="94" width="20" height="20" rx="6"/><path class="pa-title pa-thin" d="M68 99h96"/><path class="pa-line" d="M68 112h64"/><rect class="pa-card" ${p(3)} x="246" y="84" width="210" height="40" rx="10"/><rect class="pa-chip" x="258" y="94" width="20" height="20" rx="6"/><path class="pa-title pa-thin" d="M290 99h80"/><path class="pa-line" d="M290 112h72"/><rect class="pa-card" ${p(4)} x="24" y="132" width="210" height="40" rx="10"/><rect class="pa-chip" x="36" y="142" width="20" height="20" rx="6"/><path class="pa-title pa-thin" d="M68 147h104"/><path class="pa-line" d="M68 160h56"/><rect class="pa-dashed" x="246" y="132" width="210" height="40" rx="10"/>`,
  /* Three things I will not trade away, as three cards with the same icons as the cards below them (trust: a shield; the system: a package; accessible by default), outlined as the cards draw them (eighth review, 27 November 2026: the strip drew other signs, filled).  Each card names its principle in a word, not bars (L-89 proposal 8). */
  principles: `
    <rect class="pa-card" ${p(0)} x="20" y="24" width="132" height="152" rx="14"/><rect class="pa-play pa-edge" x="54" y="40" width="64" height="64" rx="16"/>${icon('shield', 66, 52, 40)}<text class="pa-mono" x="86" y="140" text-anchor="middle">trust</text>
    <rect class="pa-card" ${p(2)} x="174" y="24" width="132" height="152" rx="14"/><rect class="pa-play pa-edge" x="208" y="40" width="64" height="64" rx="16"/>${icon('package', 220, 52, 40)}<text class="pa-mono" x="240" y="140" text-anchor="middle">the system</text>
    <rect class="pa-card" ${p(4)} x="328" y="24" width="132" height="152" rx="14"/><rect class="pa-play pa-edge" x="362" y="40" width="64" height="64" rx="16"/>${icon('accessibility', 374, 52, 40)}<text class="pa-mono" x="394" y="140" text-anchor="middle">accessible</text>
    `,

  /* What I bring to a product team: the six areas as tiles in the order of the cards below, each with the same icon as its card (AI product design, enterprise UX, design systems, research, interaction, leadership), outlined as the cards draw them, the first, my lead area, edged in the link colour.  Each tile shows its icon over the area's name, not bars (L-89 proposal 8). */
  expertise: `
    <rect class="pa-chip" ${p(0)} x="20" y="28" width="136" height="64" rx="14"/>${icon('sparkles', 77, 38, 22)}<text class="pa-mono" x="88" y="80" text-anchor="middle">AI product</text>
    <rect class="pa-card" ${p(1)} x="172" y="28" width="136" height="64" rx="14"/>${icon('layout-dashboard', 229, 38, 22)}<text class="pa-mono" x="240" y="80" text-anchor="middle">Enterprise UX</text>
    <rect class="pa-card" ${p(2)} x="324" y="28" width="136" height="64" rx="14"/>${icon('swatch-book', 381, 38, 22)}<text class="pa-mono" x="392" y="80" text-anchor="middle">Design systems</text>
    <rect class="pa-card" ${p(3)} x="20" y="108" width="136" height="64" rx="14"/>${icon('target', 77, 118, 22)}<text class="pa-mono" x="88" y="160" text-anchor="middle">Research</text>
    <rect class="pa-card" ${p(4)} x="172" y="108" width="136" height="64" rx="14"/>${icon('pen-tool', 229, 118, 22)}<text class="pa-mono" x="240" y="160" text-anchor="middle">Interaction</text>
    <rect class="pa-card" ${p(5)} x="324" y="108" width="136" height="64" rx="14"/>${icon('users', 381, 118, 22)}<text class="pa-mono" x="392" y="160" text-anchor="middle">Leadership</text>`,

  /* How I work with AI, its five steps in order with the same icons as the cards below (understand the workflow, redesign it, build it with AI, validate it with people, design for both users), outlined at the cards' stroke and numbered as the cards are, the last, both users, edged in the link colour (tenth review, 27 November 2026: filled figures above outline icons). */
  aiMethod: `
    <path class="pa-accent" ${d(0)} d="M94 98h16M186 98h16M278 98h16M370 98h16"/>
    <rect class="pa-card" ${p(1)} x="24" y="66" width="64" height="64" rx="16"/>${icon('search', 42, 84, 28)}<text class="pa-mono" x="56" y="160" text-anchor="middle">01</text>
    <rect class="pa-card" ${p(2)} x="116" y="66" width="64" height="64" rx="16"/>${icon('pencil-line', 134, 84, 28)}<text class="pa-mono" x="148" y="160" text-anchor="middle">02</text>
    <rect class="pa-card" ${p(3)} x="208" y="66" width="64" height="64" rx="16"/>${icon('sparkles', 226, 84, 28)}<text class="pa-mono" x="240" y="160" text-anchor="middle">03</text>
    <rect class="pa-card" ${p(4)} x="300" y="66" width="64" height="64" rx="16"/>${icon('users', 318, 84, 28)}<text class="pa-mono" x="332" y="160" text-anchor="middle">04</text>
    <rect class="pa-chip" ${p(5)} x="392" y="66" width="64" height="64" rx="16"/>${icon('person-agent', 410, 84, 28)}<text class="pa-mono" x="424" y="160" text-anchor="middle">05</text>`,

  /* Work in hand: a board of what I am building, its columns named with the statuses the list below uses (In production,
     Ongoing, Shipped; ninth review, 27 November 2026: the columns were unnamed bars). */
  building: `
    <rect class="pa-card" ${p(0)} x="20" y="22" width="440" height="156" rx="16"/>
    <text class="pa-mono" x="44" y="51">In production</text><text class="pa-mono" x="190" y="51">Ongoing</text><text class="pa-mono" x="336" y="51">Shipped</text><path class="pa-stroke" d="M166 38v124M312 38v124"/>
    <rect class="pa-chip" ${p(1)} x="40" y="64" width="110" height="54" rx="10"/><path class="pa-line" d="M54 82h64"/><rect class="pa-soft pa-edge" x="54" y="98" width="82" height="8" rx="4"/><path class="pa-progress" ${d(2)} d="M58 102h44"/>
    <rect class="pa-card" x="40" y="128" width="110" height="36" rx="10"/><path class="pa-line pa-faint" d="M54 146h70"/>
    <rect class="pa-card" ${p(3)} x="186" y="64" width="110" height="54" rx="10"/><path class="pa-line" d="M200 82h70"/><circle class="pa-track" cx="208" cy="102" r="7"/><path class="pa-line pa-faint" d="M224 102h48"/>
    <rect class="pa-card" ${p(4)} x="332" y="64" width="110" height="54" rx="10"/><path class="pa-line" d="M346 82h60"/><path class="pa-ok" ${d(5)} d="M346 102l5 5 10-10"/><path class="pa-line pa-faint" d="M370 102h52"/>`,

  /* Studying now: an open course book, a certificate badge part way earned (its ring part way round, its ribbons below,
     "in progress" as the list marks it; ninth review, 27 November 2026), and a calendar with the days studied ticked. */
  studying: `
    <path class="pa-card" ${p(0)} d="M28 58q44-16 88 0v104q-44-16-88 0zM116 58q44-16 88 0v104q-44-16-88 0z"/>
    <path class="pa-line" d="M44 78q28-8 56 0M44 98q28-8 56 0M44 118q28-8 40 0M132 78q28-8 56 0M132 98q28-8 56 0"/>
    <path class="pa-fill" d="M256 128l-8 34 14-7 8 11 4-34zM284 128l8 34-14-7-8 11-4-34z"/><circle class="pa-play pa-edge" cx="270" cy="96" r="34"/><circle class="pa-track" cx="270" cy="96" r="26"/><circle class="pa-arc pa-arc-60" ${d(1)} cx="270" cy="96" r="26" transform="rotate(-90 270 96)"/><text class="pa-mono" x="270" y="186" text-anchor="middle">in progress</text>
    <rect class="pa-card" ${p(2)} x="336" y="40" width="120" height="124" rx="14"/><rect class="pa-fill" x="336" y="40" width="120" height="28" rx="14"/><path class="pa-fill" d="M336 54h120v14H336z"/>
    <path class="pa-ok" ${d(3)} d="M352 88l4 4 8-8M384 88l4 4 8-8M416 88l4 4 8-8M352 116l4 4 8-8"/>
    <rect class="pa-soft pa-edge" x="382" y="108" width="18" height="16" rx="5"/><rect class="pa-soft pa-edge" x="414" y="108" width="18" height="16" rx="5"/><rect class="pa-soft pa-edge" x="350" y="136" width="18" height="16" rx="5"/>`,

  /* What I do, what you get, and the proof: the three services as the section lists them, each with its own sign (cards/card-icons.ts) and a picture of the work itself (a model's states in order for AI product design, token swatches over a component for design systems, a failing check turned into a pass for audits), all leading to the case study that proves it (eighth review, 27 November 2026: bars that rose said nothing of the services). */
  offerProof: `
    <rect class="pa-card" ${p(0)} x="20" y="22" width="304" height="48" rx="12"/><rect class="pa-play pa-edge" x="30" y="30" width="32" height="32" rx="9"/>${icon('sparkles', 38, 38, 16)}<path class="pa-title pa-thin" d="M74 46h84"/><rect class="pa-soft pa-edge" x="184" y="36" width="36" height="20" rx="10"/><rect class="pa-chip" x="228" y="36" width="36" height="20" rx="10"/><rect class="pa-fill" x="272" y="36" width="36" height="20" rx="10"/><path class="pa-on-fill pa-glyph" d="M284 46l3 3 6-6"/>
    <rect class="pa-card" ${p(1)} x="20" y="76" width="304" height="48" rx="12"/><rect class="pa-play pa-edge" x="30" y="84" width="32" height="32" rx="9"/>${icon('swatch-book', 38, 92, 16)}<path class="pa-title pa-thin" d="M74 100h84"/><circle class="pa-fill" cx="194" cy="100" r="9"/><circle class="pa-link" cx="218" cy="100" r="9"/><circle class="pa-strong" cx="242" cy="100" r="9"/><rect class="pa-fill" x="260" y="90" width="48" height="20" rx="10"/>
    <rect class="pa-card" ${p(2)} x="20" y="130" width="304" height="48" rx="12"/><rect class="pa-play pa-edge" x="30" y="138" width="32" height="32" rx="9"/>${icon('clipboard-check', 38, 146, 16)}<path class="pa-title pa-thin" d="M74 154h84"/><circle class="pa-fill pa-rim" cx="198" cy="154" r="9"/><path class="pa-on-fill pa-glyph" d="M198 149v5M198 159v.5"/><path class="pa-accent" d="M214 154h40M248 148l6 6-6 6"/><circle class="pa-fill pa-rim" cx="282" cy="154" r="9"/><path class="pa-on-fill pa-glyph" d="M277 154l3 3 6-6"/>
    <path class="pa-accent" ${d(3)} d="M324 46c14 0 14 54 28 54M324 100h28M324 154c14 0 14-54 28-54"/>
    <rect class="pa-chip" ${p(4)} x="352" y="40" width="108" height="120" rx="14"/><text class="pa-mono" x="366" y="66">case study</text>
    <path class="pa-line" d="M366 88h76M366 104h60M366 120h68"/><circle class="pa-fill pa-rim" cx="440" cy="142" r="11"/><path class="pa-on-fill pa-glyph" d="M434 142l4 4 8-8"/>`,

  /* Before you write: your question, the short answer, and the two things to expect, a 15-minute call and a reply within
     48 hours (the contact section says both). */
  askFirst: `
    <path class="pa-fill" ${p(0)} d="M36 28h104a14 14 0 0 1 14 14v40a14 14 0 0 1-14 14H74l-20 16V96H36a14 14 0 0 1-14-14V42a14 14 0 0 1 14-14z"/>
    <path class="pa-on-fill pa-glyph" d="M80 52q0-10 9-10t9 9q0 6-9 9v6"/><circle class="pa-play" cx="89" cy="78" r="2.5"/>
    <path class="pa-card" ${p(1)} d="M188 52h256a14 14 0 0 1 14 14v52a14 14 0 0 1-14 14h-26v16l-20-16H188a14 14 0 0 1-14-14V66a14 14 0 0 1 14-14z"/>
    <path class="pa-title pa-thin" d="M196 76h150"/><path class="pa-line" d="M196 96h220M196 112h160"/>
    <rect class="pa-chip" ${p(2)} x="28" y="136" width="118" height="40" rx="12"/><circle class="pa-stroke" cx="50" cy="156" r="9"/><path class="pa-stroke" d="M50 151v5l4 3"/><text class="pa-mono" x="68" y="161">15 min</text>
    <rect class="pa-chip" ${p(3)} x="160" y="136" width="118" height="40" rx="12"/><path class="pa-accent pa-glyph" d="M186 149l-7 7 7 7M179 156h16q6 0 6 6"/><text class="pa-mono" x="208" y="161">48 h</text>`,

  /* Four moves from brief to handoff for a client: four numbered steps climbing to the delivered product, its flag at the top. */
  fourMoves: `
    <path class="pa-stroke" ${d(0)} d="M40 168h400"/>
    <rect class="pa-card" ${p(1)} x="24" y="128" width="96" height="40" rx="10"/><circle class="pa-fill" cx="46" cy="148" r="10"/><text class="pa-mono pa-num" x="46" y="153" text-anchor="middle">1</text><path class="pa-line" d="M64 148h40"/>
    <rect class="pa-card" ${p(2)} x="130" y="98" width="96" height="70" rx="10"/><circle class="pa-fill" cx="152" cy="118" r="10"/><text class="pa-mono pa-num" x="152" y="123" text-anchor="middle">2</text><path class="pa-line" d="M170 118h40M146 144h64"/>
    <rect class="pa-card" ${p(3)} x="236" y="68" width="96" height="100" rx="10"/><circle class="pa-fill" cx="258" cy="88" r="10"/><text class="pa-mono pa-num" x="258" y="93" text-anchor="middle">3</text><path class="pa-line" d="M276 88h40M252 114h64M252 130h48"/>
    <rect class="pa-chip" ${p(4)} x="342" y="38" width="112" height="130" rx="10"/><circle class="pa-fill" cx="364" cy="58" r="10"/><text class="pa-mono pa-num" x="364" y="63" text-anchor="middle">4</text><path class="pa-line" d="M382 58h52M358 84h80M358 100h60"/>
    <path class="pa-accent" ${d(5)} d="M420 150V118"/><path class="pa-fill" ${p(6)} d="M420 118h22l-6 7 6 7h-22z"/>`,
  /* The career in one span: 13+ years, the year each company began in its pill (profile.json), the pills of one width (eighth review, 27 November 2026), the newest lit, and what the role is now. */
  careerSpan: `
    <rect class="pa-chip" ${p(0)} x="300" y="24" width="156" height="78" rx="12"/><path class="pa-title pa-thin" d="M316 44h90"/>
    <path class="pa-ok" d="M316 64l4 4 8-8M316 84l4 4 8-8"/><path class="pa-line" d="M336 64h96M336 84h70"/>
    <path class="pa-stroke" ${d(1)} d="M396 102v26"/>
    <rect class="pa-soft pa-edge" x="24" y="130" width="72" height="24" rx="12"/><text class="pa-mono" x="60" y="147" text-anchor="middle">2014</text>
    <rect class="pa-soft pa-edge" x="108" y="130" width="72" height="24" rx="12"/><text class="pa-mono" x="144" y="147" text-anchor="middle">2015</text>
    <rect class="pa-soft pa-edge" x="192" y="130" width="72" height="24" rx="12"/><text class="pa-mono" x="228" y="147" text-anchor="middle">2019</text>
    <rect class="pa-soft pa-edge" x="276" y="130" width="72" height="24" rx="12"/><text class="pa-mono" x="312" y="147" text-anchor="middle">2022</text>
    <rect class="pa-fill" ${p(2)} x="360" y="130" width="72" height="24" rx="12"/><text class="pa-mono pa-num" x="396" y="147" text-anchor="middle">2025</text>
    <rect class="pa-card" ${p(3)} x="24" y="34" width="128" height="52" rx="12"/><text class="pa-mono" x="40" y="66">13+ years</text>
    <path class="pa-accent" ${d(4)} d="M40 172h400M432 166l8 6-8 6"/>`,
  /* Education and training: a degree (a cap over a rolled diploma with its ribbon) and a course whose modules are ticked. */
  education: `
    <path class="pa-fill" ${p(0)} d="M110 34l66 26-66 26-66-26z"/><path class="pa-stroke" d="M78 74v22q32 16 64 0V74"/><path class="pa-accent" ${d(1)} d="M176 60v30"/><circle class="pa-link" cx="176" cy="94" r="5"/>
    <rect class="pa-card" ${p(2)} x="48" y="126" width="136" height="38" rx="19"/><path class="pa-line" d="M70 145h72"/><path class="pa-fill" d="M156 158l-6 18 9-4 6 7 2-18zM170 158l6 18-9-4-6 7-2-18z"/><circle class="pa-fill pa-rim" cx="163" cy="152" r="10"/>
    <path class="pa-accent" ${d(3)} d="M206 100h44M244 94l6 6-6 6"/>
    <rect class="pa-card" ${p(4)} x="264" y="30" width="192" height="140" rx="14"/><path class="pa-title pa-thin" d="M284 54h100"/>
    <path class="pa-ok" ${d(5)} d="M286 82l4 4 8-8M286 108l4 4 8-8M286 134l4 4 8-8"/><path class="pa-line" d="M308 82h120M308 108h100M308 134h112"/>
    <rect class="pa-soft pa-edge" x="286" y="150" width="148" height="8" rx="4"/><path class="pa-progress" d="M290 154h120"/>`,
  /* Before you install anyone's skill: the folder under a lens, and the four things the note says to read first, the last
     (network calls that do not match what the skill says) as the question to ask. */
  skillCheck: `
    <path class="pa-chip" ${p(0)} d="M28 56a8 8 0 0 1 8-8h40l12 12h76a8 8 0 0 1 8 8v76a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8z"/>
    <text class="pa-mono" x="46" y="112">SKILL.md</text>
    <circle class="pa-play pa-edge" ${p(1)} cx="166" cy="134" r="26"/><path class="pa-accent" ${d(2)} d="M185 153l22 22"/><path class="pa-line" d="M154 128h24M154 140h16"/>
    <path class="pa-accent" ${d(3)} d="M214 100h24M232 94l6 6-6 6"/>
    <rect class="pa-card" ${p(4)} x="252" y="24" width="204" height="152" rx="14"/>
    <path class="pa-ok" d="M272 54l4 4 8-8"/><text class="pa-mono" x="296" y="59">SKILL.md</text>
    <path class="pa-ok" d="M272 86l4 4 8-8"/><text class="pa-mono" x="296" y="91">scripts/</text>
    <path class="pa-ok" d="M272 118l4 4 8-8"/><text class="pa-mono" x="296" y="123">images</text>
    <circle class="pa-fill pa-rim" ${p(5)} cx="278" cy="150" r="10"/><path class="pa-on-fill pa-glyph" d="M278 145v5M278 155v.5"/><text class="pa-mono" x="296" y="155">network calls?</text>`,
  /* Every role, with what it shipped (/job/experience; owner's choice, 27 November 2026, L-89 proposal 4, so the hiring site does not repeat About's company line): the seven roles at five companies (profile.json) on a rail, the current one lit, beside the screens they shipped, the front one checked. */
  careerRoles: `
    <rect class="pa-card" ${p(0)} x="24" y="20" width="252" height="160" rx="14"/><text class="pa-mono" x="44" y="46">7 roles · 5 companies</text>
    <path class="pa-stroke" ${d(1)} d="M52 66v100"/><circle class="pa-fill pa-rim" cx="52" cy="66" r="6"/><path class="pa-title pa-thin" d="M68 66h120"/><circle class="pa-soft pa-edge" cx="52" cy="83" r="4"/><path class="pa-line" d="M68 83h96"/><circle class="pa-soft pa-edge" cx="52" cy="100" r="4"/><path class="pa-line" d="M68 100h84"/><circle class="pa-soft pa-edge" cx="52" cy="117" r="4"/><path class="pa-line" d="M68 117h104"/><circle class="pa-soft pa-edge" cx="52" cy="134" r="4"/><path class="pa-line" d="M68 134h72"/><circle class="pa-soft pa-edge" cx="52" cy="151" r="4"/><path class="pa-line" d="M68 151h90"/><circle class="pa-soft pa-edge" cx="52" cy="166" r="4"/><path class="pa-line" d="M68 166h64"/>
    <text class="pa-mono" x="300" y="46">shipped</text>
    <rect class="pa-card" ${p(2)} x="300" y="58" width="120" height="76" rx="10"/><path class="pa-line" d="M312 74h56"/><rect class="pa-soft pa-edge" x="312" y="86" width="96" height="34" rx="6"/>
    <rect class="pa-card" ${p(3)} x="322" y="84" width="120" height="76" rx="10"/><path class="pa-line" d="M334 100h60"/><rect class="pa-soft pa-edge" x="334" y="112" width="96" height="34" rx="6"/>
    <rect class="pa-chip" ${p(4)} x="344" y="104" width="112" height="72" rx="10"/><path class="pa-title pa-thin" d="M356 122h56"/><path class="pa-ok" d="M358 148l5 5 10-10"/><path class="pa-line" d="M382 150h56"/>`,
  /* Certifications as credentials, for the hiring site (/job/experience; L-89 proposal 4): the verified one with its seal and the one in progress with its ring, by issuer as certifications/ lists them. */
  certsCredentials: `
    <rect class="pa-card" ${p(0)} x="24" y="26" width="432" height="68" rx="14"/><circle class="pa-fill pa-rim" cx="62" cy="60" r="18"/><path class="pa-on-fill pa-glyph" d="M54 60l5 5 11-11"/>
    <text class="pa-mono" x="94" y="54">Anthropic</text><path class="pa-line" d="M94 72h132"/>
    <rect class="pa-chip" x="332" y="46" width="104" height="28" rx="14"/><path class="pa-ok" d="M346 60l4 4 8-8"/><text class="pa-mono" x="366" y="65">verified</text>
    <rect class="pa-card" ${p(1)} x="24" y="108" width="432" height="68" rx="14"/><circle class="pa-play pa-edge" cx="62" cy="142" r="18"/><circle class="pa-track" cx="62" cy="142" r="10"/><circle class="pa-arc pa-arc-60" ${d(2)} cx="62" cy="142" r="10" transform="rotate(-90 62 142)"/>
    <text class="pa-mono" x="94" y="136">Google Cloud</text><rect class="pa-soft pa-edge" x="94" y="148" width="132" height="10" rx="5"/><path class="pa-progress" ${d(3)} d="M99 153h56"/>
    <text class="pa-mono" x="340" y="147">in progress</text>`,
  /* Three things I will not trade away, as a design review on the hiring site (/job/experience; L-89 proposal 4): each principle a line of the checklist with its card's icon, each ticked. */
  principlesReview: `
    <rect class="pa-card" ${p(0)} x="60" y="18" width="360" height="164" rx="16"/><text class="pa-mono" x="84" y="46">design review</text><circle class="pa-fill pa-rim" cx="392" cy="40" r="11"/><path class="pa-on-fill pa-glyph" d="M386 40l4 4 8-8"/>
    <rect class="pa-play pa-edge" x="84" y="62" width="30" height="30" rx="8"/>${icon('shield', 90, 68, 18)}<path class="pa-title pa-thin" d="M128 73h150"/><path class="pa-line" d="M128 86h96"/><path class="pa-ok" ${d(1)} d="M378 77l5 5 10-10"/>
    <rect class="pa-play pa-edge" x="84" y="100" width="30" height="30" rx="8"/>${icon('package', 90, 106, 18)}<path class="pa-title pa-thin" d="M128 111h136"/><path class="pa-line" d="M128 124h110"/><path class="pa-ok" ${d(2)} d="M378 115l5 5 10-10"/>
    <rect class="pa-play pa-edge" x="84" y="138" width="30" height="30" rx="8"/>${icon('accessibility', 90, 144, 18)}<path class="pa-title pa-thin" d="M128 149h124"/><path class="pa-line" d="M128 162h84"/><path class="pa-ok" ${d(3)} d="M378 153l5 5 10-10"/>`,
  /* How I work with AI on the hiring site (/job/experience; L-89 proposal 4): the five steps on a loop, since the last, design for both users, starts the next round; the same icons as the cards below. */
  aiMethodLoop: `
    <ellipse class="pa-accent pa-loop" ${d(0)} cx="240" cy="100" rx="150" ry="62"/>
    <rect class="pa-card" ${p(1)} x="216" y="16" width="48" height="48" rx="14"/>${icon('search', 228, 28, 24)}
    <rect class="pa-card" ${p(2)} x="348" y="54" width="48" height="48" rx="14"/>${icon('pencil-line', 360, 66, 24)}
    <rect class="pa-card" ${p(3)} x="302" y="130" width="48" height="48" rx="14"/>${icon('sparkles', 314, 142, 24)}
    <rect class="pa-card" ${p(4)} x="130" y="130" width="48" height="48" rx="14"/>${icon('users', 142, 142, 24)}
    <rect class="pa-chip" ${p(5)} x="84" y="54" width="48" height="48" rx="14"/>${icon('person-agent', 96, 66, 24)}
    <text class="pa-mono" x="240" y="106" text-anchor="middle">and again</text>`,
  /* Three things I will not trade away, for clients (/clients/about; L-89 proposal 4): a signed page of what a client can count on, each line with its principle's icon, sealed. */
  principlesPledge: `
    <rect class="pa-card" ${p(0)} x="110" y="14" width="260" height="172" rx="14"/><text class="pa-mono" x="132" y="42">what you can count on</text>
    ${icon('shield', 132, 58, 18)}<path class="pa-line" d="M160 67h150"/>
    ${icon('package', 132, 88, 18)}<path class="pa-line" d="M160 97h132"/>
    ${icon('accessibility', 132, 118, 18)}<path class="pa-line" d="M160 127h140"/>
    <path class="pa-accent" ${d(1)} d="M134 160c10-14 18-14 22 0s14 10 22-4 16-6 22 4"/><path class="pa-stroke" d="M132 172h110"/><circle class="pa-fill pa-rim" ${p(2)} cx="336" cy="158" r="14"/><path class="pa-on-fill pa-glyph" d="M329 158l5 5 10-10"/>`,
  /* What I bring to a product team, for clients (/clients/about; L-89 proposal 4): the six areas, with their cards' icons, all feeding one product, as a client gets them from one designer. */
  expertiseHub: `
    <rect class="pa-chip" ${p(0)} x="176" y="52" width="128" height="96" rx="14"/><rect class="pa-fill" x="176" y="52" width="128" height="20" rx="10"/><path class="pa-fill" d="M176 62h128v10H176z"/><path class="pa-title pa-thin" d="M192 92h72"/><path class="pa-line" d="M192 110h92M192 126h64"/>
    <path class="pa-stroke" d="M84 44C140 44 150 100 176 100"/><rect class="pa-card" ${p(1)} x="40" y="22" width="44" height="44" rx="12"/>${icon('sparkles', 51, 33, 22)}
    <path class="pa-stroke" d="M84 100C140 100 150 100 176 100"/><rect class="pa-card" ${p(2)} x="40" y="78" width="44" height="44" rx="12"/>${icon('layout-dashboard', 51, 89, 22)}
    <path class="pa-stroke" d="M84 156C140 156 150 100 176 100"/><rect class="pa-card" ${p(3)} x="40" y="134" width="44" height="44" rx="12"/>${icon('swatch-book', 51, 145, 22)}
    <path class="pa-stroke" d="M396 44C340 44 330 100 304 100"/><rect class="pa-card" ${p(4)} x="396" y="22" width="44" height="44" rx="12"/>${icon('target', 407, 33, 22)}
    <path class="pa-stroke" d="M396 100C340 100 330 100 304 100"/><rect class="pa-card" ${p(5)} x="396" y="78" width="44" height="44" rx="12"/>${icon('pen-tool', 407, 89, 22)}
    <path class="pa-stroke" d="M396 156C340 156 330 100 304 100"/><rect class="pa-card" ${p(6)} x="396" y="134" width="44" height="44" rx="12"/>${icon('users', 407, 145, 22)}`,
  /* How I work with AI, for clients (/clients/about; L-89 proposal 4): the five steps as a project plan, each starting while the one before is under way, the last, design for both users, carried to the end; the cards' icons; no dates, which belong to each engagement. */
  aiMethodPlan: `
    <path class="pa-stroke pa-faint" d="M80 22v164M150 22v164M220 22v164M290 22v164M360 22v164M430 22v164"/>
    <rect class="pa-play pa-edge" x="28" y="26" width="28" height="28" rx="8"/>${icon('search', 33, 31, 18)}<rect class="pa-soft pa-edge" ${p(0)} x="80" y="32" width="130" height="16" rx="8"/>
    <rect class="pa-play pa-edge" x="28" y="58" width="28" height="28" rx="8"/>${icon('pencil-line', 33, 63, 18)}<rect class="pa-soft pa-edge" ${p(1)} x="140" y="64" width="130" height="16" rx="8"/>
    <rect class="pa-play pa-edge" x="28" y="90" width="28" height="28" rx="8"/>${icon('sparkles', 33, 95, 18)}<rect class="pa-soft pa-edge" ${p(2)} x="200" y="96" width="130" height="16" rx="8"/>
    <rect class="pa-play pa-edge" x="28" y="122" width="28" height="28" rx="8"/>${icon('users', 33, 127, 18)}<rect class="pa-soft pa-edge" ${p(3)} x="260" y="128" width="130" height="16" rx="8"/>
    <rect class="pa-play pa-edge" x="28" y="154" width="28" height="28" rx="8"/>${icon('person-agent', 33, 159, 18)}<rect class="pa-fill" ${p(4)} x="320" y="160" width="160" height="16" rx="8"/>`,
  /* Certifications for clients (/clients/about; L-89 proposal 4): two badges by issuer, the verified one sealed with its ribbons, the one in progress a ring part way round. */
  certsBadges: `
    <path class="pa-fill" d="M144 112l-10 38 15-7 10 12 5-40zM176 112l10 38-15-7-10 12-5-40z"/><circle class="pa-chip" ${p(0)} cx="160" cy="74" r="50"/><circle class="pa-fill pa-rim" cx="160" cy="74" r="30"/><path class="pa-on-fill pa-glyph" d="M147 74l9 9 17-17"/>
    <text class="pa-mono" x="160" y="170" text-anchor="middle">Anthropic</text><text class="pa-mono" x="160" y="186" text-anchor="middle">verified</text>
    <circle class="pa-play pa-edge" ${p(1)} cx="328" cy="74" r="50"/><circle class="pa-track" cx="328" cy="74" r="32"/><circle class="pa-arc pa-arc-60" ${d(2)} cx="328" cy="74" r="32" transform="rotate(-90 328 74)"/>
    <text class="pa-mono" x="328" y="170" text-anchor="middle">Google Cloud</text><text class="pa-mono" x="328" y="186" text-anchor="middle">in progress</text>`,
} as const;

export type SectionSceneName = keyof typeof SECTION_SCENES;
