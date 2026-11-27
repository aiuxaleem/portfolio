/* The Process illustrations (owner request, 24 November 2026: "create illustrations or icons ... to improve overall
   aesthetics"): one small drawing per step of what that step produces, on a 240 × 100 stage, every shape kept inside
   y 8 to 92. Drawn by hand from simple shapes so they stay light (about a dozen elements each, since /_states renders
   them twice) and take every colour from the semantic tokens through the classes styled in process.astro (.pa-*), so
   both themes and the ink card work without a single colour in this file.
   One vocabulary: outlines 1.5, connectors 2, accents and ticks 3, text bars 4 (the score ring 8); placeholder blocks in
   the skeleton fill; the success disc with its tick means only an approval by people (steps 7 and 8), so it keeps its weight; each drawing's one accent carries the colour.
   Decorative: the step's words carry the meaning, so the stage is aria-hidden. With motion on, lines marked data-draw
   draw themselves (pathLength 1) and shapes marked data-pop settle in, one after another in the order --i gives, as the
   card scrolls into view (motion.css, [data-process] .pr-art); otherwise they are drawn whole. */
import type { ProcessArt } from '../../lib/process';

const d = (i: number) => `data-draw="" pathLength="1" style="--i:${i}"`;
const p = (i: number) => `data-pop="" style="--i:${i}"`;

export const PROCESS_ART: Record<ProcessArt, string> = {
  /* Brief and research: a person and the AI agent acting for them, both tied to the journey they share, marked where it breaks. */
  brief: `
    <rect class="pa-card" x="18" y="10" width="78" height="50" rx="9"/>
    <circle class="pa-ring" ${p(0)} cx="37" cy="30" r="9"/>
    <path class="pa-line" d="M54 26h30M54 37h20"/>
    <rect class="pa-card" x="144" y="10" width="78" height="50" rx="9"/>
    <rect class="pa-ring" ${p(1)} x="155" y="21" width="19" height="18" rx="5"/>
    <path class="pa-accent" d="M161 29v2M168 29v2M164.5 17v4"/>
    <path class="pa-line" d="M182 26h28M182 37h18"/>
    <path class="pa-stroke" d="M57 60v19M183 60v13"/>
    <path class="pa-accent" ${d(2)} d="M22 84c34-16 58 12 98 0s66-14 98 0"/>
    <circle class="pa-fill" cx="22" cy="84" r="4"/>
    <circle class="pa-fill" cx="218" cy="84" r="4"/>
    <circle class="pa-break" ${p(3)} cx="120" cy="84" r="6"/>`,
  /* Problem and structure: the content as a tree, and the path people took to the label in a tree test, traced in the accent. */
  structure: `
    <rect class="pa-fill" ${p(0)} x="98" y="8" width="44" height="16" rx="6"/>
    <path class="pa-stroke" ${d(1)} d="M120 24v9M50 33h140M50 33v9M120 33v9M190 33v9M120 56v8M98 64h44M98 64v6M142 64v6"/>
    <rect class="pa-card" x="26" y="42" width="48" height="14" rx="5"/>
    <rect class="pa-card" x="96" y="42" width="48" height="14" rx="5"/>
    <rect class="pa-card" x="166" y="42" width="48" height="14" rx="5"/>
    <rect class="pa-soft pa-edge" x="80" y="70" width="36" height="14" rx="5"/>
    <path class="pa-accent" ${d(2)} d="M120 24v18M120 56v8h22v6"/>
    <rect class="pa-card pa-found" ${p(3)} x="124" y="70" width="36" height="14" rx="5"/>`,
  /* Logo and design language: a mark, a type specimen and the palette, with lines of voice. */
  language: `
    <rect class="pa-fill" ${p(0)} x="18" y="20" width="56" height="56" rx="14"/>
    <path class="pa-on-fill" ${d(1)} d="M33 64l13-30 13 30M38 54h16"/>
    <text class="pa-type" x="84" y="66">Aa</text>
    <circle class="pa-fill" ${p(2)} cx="161" cy="30" r="9"/>
    <circle class="pa-link" ${p(3)} cx="182" cy="30" r="9"/>
    <circle class="pa-strong" ${p(4)} cx="203" cy="30" r="9"/>
    <circle class="pa-soft pa-edge" ${p(5)} cx="224" cy="30" r="9"/>
    <path class="pa-line" d="M154 58h70M154 72h46"/>`,
  /* Design system in Claude Design (on the ink card): the tokens flow into the components. */
  system: `
    <circle class="pa-fill" ${p(0)} cx="28" cy="22" r="9"/>
    <circle class="pa-strong" ${p(1)} cx="52" cy="22" r="9"/>
    <circle class="pa-soft pa-edge" ${p(2)} cx="76" cy="22" r="9"/>
    <path class="pa-stroke" d="M96 16v12M96 22h22M118 16v12"/>
    <path class="pa-accent" ${d(3)} d="M52 34v8c0 10 6 14 16 14h68"/>
    <path class="pa-accent" ${d(4)} d="M131 51l5 5-5 5"/>
    <rect class="pa-fill" ${p(5)} x="18" y="64" width="64" height="20" rx="10"/>
    <rect class="pa-soft pa-edge" x="94" y="66" width="34" height="16" rx="8"/>
    <circle class="pa-strong" ${p(6)} cx="120" cy="74" r="5.5"/>
    <rect class="pa-card" x="142" y="10" width="80" height="78" rx="10"/>
    <path class="pa-line" d="M156 28h40M156 41h52M156 54h30"/>
    <rect class="pa-fill" ${p(7)} x="156" y="66" width="34" height="12" rx="6"/>`,
  /* Templates for two audiences: a dense product screen with its side navigation for product teams, and a slide for
     colleagues who don't design, both carrying the same brand bar. */
  templates: `
    <rect class="pa-card" x="20" y="8" width="94" height="84" rx="8"/>
    <rect class="pa-fill" ${p(0)} x="28" y="16" width="78" height="8" rx="4"/>
    <rect class="pa-soft" x="28" y="32" width="16" height="50" rx="4"/>
    <rect class="pa-soft" x="50" y="32" width="26" height="22" rx="4"/>
    <rect class="pa-soft" x="80" y="32" width="26" height="22" rx="4"/>
    <rect class="pa-soft" x="50" y="60" width="26" height="22" rx="4"/>
    <rect class="pa-soft" x="80" y="60" width="26" height="22" rx="4"/>
    <rect class="pa-card" x="126" y="18" width="96" height="56" rx="6"/>
    <rect class="pa-fill" ${p(1)} x="134" y="27" width="48" height="8" rx="4"/>
    <path class="pa-line" d="M134 48h30M134 59h22"/>
    <rect class="pa-soft" x="176" y="43" width="38" height="23" rx="4"/>
    <circle class="pa-fill" ${p(2)} cx="162" cy="84" r="3.5"/>
    <circle class="pa-soft pa-edge" cx="174" cy="84" r="3.5"/>
    <circle class="pa-soft pa-edge" cx="186" cy="84" r="3.5"/>`,
  /* Audit, score and refine: a checklist ticked line by line beside the score ring that stops at its mark. */
  audit: `
    <rect class="pa-card" x="18" y="10" width="110" height="80" rx="9"/>
    <path class="pa-ok" ${d(0)} d="M30 28l4 4 8-9M30 49l4 4 8-9M30 70l4 4 8-9"/>
    <path class="pa-line" d="M52 28h62M52 49h50M52 70h56"/>
    <circle class="pa-track" cx="182" cy="50" r="30"/>
    <circle class="pa-arc" ${d(1)} cx="182" cy="50" r="30" transform="rotate(-90 182 50)"/>
    <path class="pa-ok" ${d(2)} d="M171 50l7 7 14-15"/>`,
  /* Mockups, prototypes and approval: a tap on the phone prototype's button leads to the screen stakeholders approve. */
  mockups: `
    <rect class="pa-card" x="30" y="8" width="54" height="84" rx="11"/>
    <rect class="pa-fill" ${p(0)} x="39" y="18" width="36" height="7" rx="3.5"/>
    <rect class="pa-soft" x="39" y="31" width="36" height="18" rx="4"/>
    <path class="pa-line" d="M39 57h30M39 65h16"/>
    <rect class="pa-fill" ${p(1)} x="39" y="71" width="36" height="9" rx="4.5"/>
    <path class="pa-ring" ${p(2)} d="M62 70l-2-2M66 69v-3M70 70l2-2"/>
    <path class="pa-cursor" ${p(2)} d="M66 75v11l3.3-3.3 2.2 4.4 2.2-1.1-2.2-4.4h4.4z"/>
    <path class="pa-accent" ${d(3)} d="M92 50h38M125 45l5 5-5 5"/>
    <rect class="pa-card" x="140" y="20" width="80" height="60" rx="8"/>
    <rect class="pa-soft" x="150" y="32" width="60" height="20" rx="4"/>
    <path class="pa-line" d="M150 62h44M150 71h28"/>
    <circle class="pa-ok-disc" ${p(4)} cx="216" cy="22" r="11"/>
    <path class="pa-on-ok" ${d(5)} d="M211 22l3.5 3.5 6.5-7"/>`,
  /* Handoff and build review: a spec any engineer or agent can read, then the design and the build approved as equal. */
  handoff: `
    <rect class="pa-card" x="18" y="10" width="72" height="80" rx="8"/>
    <path class="pa-accent" ${d(0)} d="M36 26l-8 8 8 8M54 26l8 8-8 8"/>
    <path class="pa-line" d="M30 58h48M30 69h34M30 80h42"/>
    <path class="pa-accent" ${d(1)} d="M96 40h16M107 35l5 5-5 5"/>
    <rect class="pa-card" x="120" y="22" width="44" height="36" rx="5"/>
    <rect class="pa-fill" ${p(2)} x="126" y="28" width="32" height="6" rx="3"/>
    <rect class="pa-soft" x="126" y="40" width="32" height="12" rx="3"/>
    <rect class="pa-card" x="178" y="22" width="44" height="36" rx="5"/>
    <rect class="pa-fill" ${p(3)} x="184" y="28" width="32" height="6" rx="3"/>
    <path class="pa-accent" d="M195 41l-4 4 4 4M205 41l4 4-4 4"/>
    <path class="pa-stroke pa-equal" d="M166 36h10M166 44h10"/>
    <circle class="pa-ok-disc" ${p(4)} cx="171" cy="76" r="11"/>
    <path class="pa-on-ok" ${d(5)} d="M166 76l3.5 3.5 6.5-7"/>`,
};

/* The phase icons: Lucide drawings (ISC licence) already in the site's icon data (category-icons.ts, admin-icons.ts). */
export const PHASE_ICONS: Record<string, string> = {
  Empathise: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
  Define: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  Ideate: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  Prototype: '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/>',
  Test: '<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/>',
  Implement: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
};
