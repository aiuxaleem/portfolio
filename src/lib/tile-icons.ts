/* Which icon each numbered tile shows (ui/tile-icon.astro; owner request, 24 November 2026), by the tile's title, so the
   icon follows the item if the order changes; a title not listed here (a renamed item, a new one) shows its number alone.
   The names are drawings in components/cards/card-icons.ts. */
const BY_TITLE: Record<string, string> = {
  /* What I believe and how I work with AI (content/site/profile.json: principles, aiWorkflow). */
  'Trust is designed, not declared': 'shield',
  'Ship the system, not the screen': 'package',
  'Accessible by default': 'accessibility',
  'Understand the workflow': 'search',
  'Redesign it': 'pencil-line',
  'Build it with AI': 'sparkles',
  'Validate it with people': 'users',
  'Design for both users': 'person-agent',
  /* What I bring to a product team (content/site/profile.json: expertise; third review, 25 November 2026: the only tiles on
     About without a sign). */
  'AI product design': 'sparkles',
  'Enterprise UX': 'layout-dashboard',
  'Design systems': 'swatch-book',
  'Research and UX strategy': 'target',
  'Interaction design and prototyping': 'pen-tool',
  'Design leadership': 'users',
  /* My Claude skills: three steps (pages/skills.astro). */
  'Download a skill': 'download',
  'Add it to Claude': 'upload',
  'Say what you want': 'message-square',
  /* How I build a design system (pages/my-design-systems.astro). */
  'Start from the brand and the brief': 'target',
  'Tokens first, in Claude Design': 'swatch-book',
  'Components and templates on top': 'layout-grid',
  'Publish it for people and agents': 'send',
  /* What a skill is (pages/claude-skills.astro). */
  'A folder with one required file': 'folder',
  'Claude reads the description first': 'eye',
  'It works where you use Claude': 'monitor-smartphone',
  /* What a design system is made of (lib/design-systems.ts, LAYERS). */
  'Tokens': 'swatch-book',
  'Components': 'layout-grid',
  'Patterns': 'shapes',
  'Accessibility': 'accessibility',
  'Content and voice': 'message-square-text',
  'AI patterns': 'sparkles',
};

export const tileIcon = (title: string) => BY_TITLE[title.trim()];
