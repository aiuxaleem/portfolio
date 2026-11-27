/* The card tiles' icons (owner request, 24 November 2026: "improve the iconography"): one icon for each category of the
   AI tools, the Claude plugin directory, the design-system library and the Claude skills, in place of the first letter of
   the title, which repeated (two "C", two "F", two "U") and said nothing. Lucide drawings (ISC licence) as the resource
   categories and the admin already use, plus a few drawn on its grid; built by a script from those files, so the set stays
   one style. The tile is decorative: the category is written on the card. */
export const CARD_ICON_PATHS: Record<string, string> = {
  /* The Work bento's own icons (home/work-bento.astro), for the Four ways strip above it. */
  'briefcase': "<path d=\"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\" /><rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\" />",
  'book-open': "<path d=\"M12 7v14\" /><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />",
  'skill-mark': "<path d=\"M12 7V3\" /><path d=\"M12 21v-4\" /><path d=\"M4.93 4.93l2.83 2.83\" /><path d=\"M16.24 16.24l2.83 2.83\" /><path d=\"M3 12h4\" /><path d=\"M17 12h4\" /><circle cx=\"12\" cy=\"12\" r=\"2\" />",
  'accessibility': "<circle cx=\"16\" cy=\"4\" r=\"1\" /><path d=\"m18 19 1-7-6 1\" /><path d=\"m5 8 3-3 5.5 3-2.36 3.5\" /><path d=\"M4.24 14.5a5 5 0 0 0 6.88 6\" /><path d=\"M13.76 17.5a5 5 0 0 0-6.88-6\" />",
  'activity': "<path d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\" />",
  'building': "<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\" /><path d=\"M9 22v-4h6v4\" /><path d=\"M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01\" />",
  'chart-column': "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /><path d=\"M18 17V9\" /><path d=\"M13 17V5\" /><path d=\"M8 17v-3\" />",
  'clipboard-check': "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /><path d=\"m9 14 2 2 4-4\" />",
  'code': "<path d=\"m16 18 6-6-6-6\" /><path d=\"m8 6-6 6 6 6\" /><path d=\"m14.5 4-5 16\" />",
  'database': "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\" /><path d=\"M3 5v14a9 3 0 0 0 18 0V5\" /><path d=\"M3 12a9 3 0 0 0 18 0\" />",
  'download': "<path d=\"M12 15V3\" /><path d=\"m7 10 5 5 5-5\" /><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" />",
  'eye': "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
  'file-text': "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /><path d=\"M10 9H8\" /><path d=\"M16 13H8\" /><path d=\"M16 17H8\" />",
  'flask-conical': "<path d=\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\" /><path d=\"M6.453 15h11.094\" /><path d=\"M8.5 2h7\" />",
  'folder': "<path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z\" />",
  'globe': "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /><path d=\"M2 12h20\" />",
  'graduation-cap': "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\" /><path d=\"M22 10v6\" /><path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\" />",
  'image': "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /><circle cx=\"9\" cy=\"9\" r=\"2\" /><path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />",
  'landmark': "<path d=\"M3 22h18\" /><path d=\"M6 18v-7M10 18v-7M14 18v-7M18 18v-7\" /><path d=\"M12 2 20 7H4z\" />",
  'layout-dashboard': "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\" /><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" />",
  'layout-grid': "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  'message-square': "<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\" />",
  'message-square-text': "<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\" /><path d=\"M7 11h10\" /><path d=\"M7 15h6\" /><path d=\"M7 7h8\" />",
  'mic': "<rect x=\"9\" y=\"2\" width=\"6\" height=\"13\" rx=\"3\" /><path d=\"M19 10v2a7 7 0 0 1-14 0v-2\" /><path d=\"M12 19v3\" />",
  'monitor-smartphone': "<path d=\"M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8\" /><path d=\"M10 19v-3.96 3.15\" /><path d=\"M7 19h5\" /><rect width=\"6\" height=\"10\" x=\"16\" y=\"12\" rx=\"2\" />",
  'package': "<path d=\"M11 21.7a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7z\" /><path d=\"M12 22V12\" /><path d=\"m3.3 7 8.7 5 8.7-5\" /><path d=\"m7.5 4.3 9 5.1\" />",
  'palette': "<path d=\"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z\" /><circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />",
  'pen-tool': "<path d=\"M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z\" /><path d=\"m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18\" /><path d=\"m2.3 2.3 7.286 7.286\" /><circle cx=\"11\" cy=\"11\" r=\"2\" />",
  'pencil-line': "<path d=\"M13 21h8\" /><path d=\"m15 5 4 4\" /><path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" />",
  'person-agent': "<circle cx=\"8\" cy=\"7\" r=\"3\" /><path d=\"M3 20v-1a5 5 0 0 1 10 0v1\" /><rect x=\"14\" y=\"6\" width=\"8\" height=\"7\" rx=\"2\" /><path d=\"M18 6V3.5\" /><path d=\"M16.5 9.5h.01M19.5 9.5h.01\" /><path d=\"M15 20v-2.5a3 3 0 0 1 6 0V20\" />",
  'presentation': "<path d=\"M2 3h20\" /><path d=\"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3\" /><path d=\"m7 21 5-5 5 5\" />",
  'puzzle': "<path d=\"M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z\" />",
  'refresh-cw': "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /><path d=\"M21 3v5h-5\" /><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /><path d=\"M8 16H3v5\" />",
  'rocket': "<path d=\"M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z\" /><path d=\"M12 15 9 12a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z\" /><path d=\"M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0\" /><path d=\"M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5\" />",
  'search': "<path d=\"m21 21-4.34-4.34\" /><circle cx=\"11\" cy=\"11\" r=\"8\" />",
  'send': "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\" /><path d=\"m21.854 2.147-10.94 10.939\" />",
  'shapes': "<path d=\"M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z\" /><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" /><circle cx=\"17.5\" cy=\"17.5\" r=\"3.5\" />",
  'shield': "<path d=\"M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z\" /><path d=\"m9 12 2 2 4-4\" />",
  'sparkles': "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\" /><path d=\"M20 2v4\" /><path d=\"M22 4h-4\" /><circle cx=\"4\" cy=\"20\" r=\"2\" />",
  'split': "<path d=\"M16 3h5v5\" /><path d=\"M8 3H3v5\" /><path d=\"M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3\" /><path d=\"m15 9 6-6\" />",
  'swatch-book': "<path d=\"M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z\" /><path d=\"M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7\" /><path d=\"M 7 17h.01\" /><path d=\"m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8\" />",
  'target': "<circle cx=\"12\" cy=\"12\" r=\"10\" /><circle cx=\"12\" cy=\"12\" r=\"6\" /><circle cx=\"12\" cy=\"12\" r=\"2\" />",
  'upload': "<path d=\"M12 3v12\" /><path d=\"m17 8-5-5-5 5\" /><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" />",
  'users': "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /><path d=\"M16 3.128a4 4 0 0 1 0 7.744\" /><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /><circle cx=\"9\" cy=\"7\" r=\"4\" />",
  'video': "<path d=\"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5\" /><rect x=\"2\" y=\"6\" width=\"14\" height=\"12\" rx=\"2\" />",
};
export const AI_TOOL_ICONS: Record<string, string> = {"assistants":"message-square-text","ui-generation":"layout-dashboard","code":"code","images":"image","video-and-motion":"video","audio-and-voice":"mic","research":"users","testing":"eye","diagrams-and-slides":"presentation","colour-and-type":"palette","patterns":"sparkles","accessibility":"accessibility"};
export const PLUGIN_ICONS: Record<string, string> = {"design":"pen-tool","development":"code","productivity":"clipboard-check","database":"database","monitoring":"activity","security":"shield","deployment":"rocket","automation":"refresh-cw","learning":"graduation-cap","testing":"flask-conical","migration":"split","location":"globe","math":"chart-column","other":"puzzle"};
export const DS_KIND_ICONS: Record<string, string> = {"company":"building","government":"landmark","open-source":"code"};
export const SKILL_ICONS: Record<string, string> = {"design-to-code":"code","design-systems":"layout-grid","brand-and-visuals":"palette","motion":"activity","review-and-research":"search","content-and-docs":"file-text","making-skills":"package"};
/** The drawing for a category in one of the maps; an unknown category (a new one in the plugin directory) gets the puzzle piece. */
/* A picked skill's own sign, for what it does, so the cards of one group differ (ninth review, 27 November 2026: every card
   in a group showed the group's sign, which its heading already names). Plain signifiers, never a maker's logo; a skill not
   listed keeps its category's sign. */
export const SKILL_ITEM_ICONS: Record<string, string> = {
  'frontend-design': 'layout-dashboard', 'web-artifacts-builder': 'shapes', 'figma': 'pen-tool', 'framer-agent': 'globe',
  'brand-guidelines': 'shield', 'ui-ux-pro-max': 'layout-grid',
  'adobe-for-creativity': 'image', 'algorithmic-art': 'sparkles', 'canva': 'presentation', 'canvas-design': 'palette', 'theme-factory': 'swatch-book',
  'design-plugin': 'eye', 'impeccable': 'target', 'web-design-guidelines': 'clipboard-check',
  'motion-ai-kit': 'activity', 'pptx': 'presentation', 'skill-creator': 'package',
};
export const cardIcon = (map: Record<string, string>, key: string) => CARD_ICON_PATHS[map[key] ?? 'puzzle'];
