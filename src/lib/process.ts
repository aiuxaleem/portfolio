/* The owner's design process, shown on Home as a timeline (owner requests, 22 November 2026: "I really do these things in my
   work as a designer ... show it in a step by step or timeline kind of layout ... include my design system integration into
   every design I am now doing in AI era", then "incorporate design thinking process and improve the overall writing").
   The steps follow his own account, in his order: a brief, the logo and design language, a design system in Claude Design
   built to the top ten UX laws, templates for technical and non-technical users, audit rounds scored out of 10 until they
   reach 9, high-fidelity mockups and prototypes, approval, handoff, then a review of the build with UI fixes made on the
   production branch. Each step carries its design-thinking phase; Prototype comes back after Test because his process loops.
   The twelve terms are the ones he chose, each said as how he uses it; Design language, UX laws, Quality gate, Component
   spec and Design QA are added where a step had none of its own. No step claims an outcome or a number. A step's proof
   links only to a page that exists and shows that step. */
export type ProcessPhase = 'Empathise' | 'Define' | 'Ideate' | 'Prototype' | 'Test' | 'Implement';
export interface ProcessTerm { term: string; meaning: string }
export interface ProcessStep {
  phase: ProcessPhase;
  title: string;
  body: string;
  terms?: ProcessTerm[];
  /** How the design system enters this step. */
  system?: string;
  /** A page that shows this step in real work. */
  proof?: { label: string; href: string };
  /** The design system itself: drawn as the ink card, the hub of the timeline. */
  hub?: boolean;
}
export interface ProcessRoute { title: string; body: string }

export const processHead = {
  overline: 'Process',
  title: 'From brief to live build, with the design system in every step',
  lead: 'I follow design thinking and stay with the work until it is live. When AI can draw a screen in seconds, the design system is what keeps every screen consistent, accessible and ready to build, so it runs through every step.',
  phasesLabel: 'Design thinking phases',
  loop: 'Testing sends the work back to earlier phases as often as it needs.',
  thread: 'The design system runs through every step',
  termsLabel: 'How I use these',
};

export const processSteps: ProcessStep[] = [
  {
    phase: 'Empathise',
    title: 'Brief and research',
    body: 'Every project starts with a brief. Before I draw anything, I map who has the problem, the job they need done and where their journey breaks, for the person and for the AI agent acting for them.',
    terms: [
      { term: 'Persona', meaning: 'One for the person, and one for the AI agent that acts on their behalf.' },
      { term: 'Jobs-to-be-done', meaning: 'The task people hire the product for. Every screen has to move it forward.' },
      { term: 'Journey map', meaning: 'The path from first step to last, marked where trust or effort breaks.' },
    ],
    system: 'I check what the design system already covers, so the work starts from patterns that exist and every gap has a name.',
    proof: { label: 'Designing for two users', href: '/blog/designing-for-two-users' },
  },
  {
    phase: 'Define',
    title: 'Problem and structure',
    body: 'I write the problem as one sentence the team can agree on, then organise and label the content. Where the structure is in doubt, I test it before any visual design.',
    terms: [
      { term: 'Information architecture', meaning: 'Content grouped and named the way people look for it, with labels an agent can rely on.' },
      { term: 'Tree testing', meaning: 'People find items in the bare structure, so the labels are proven before anything is drawn.' },
    ],
    system: 'Page types and labels become named patterns, so every new page uses the same words.',
  },
  {
    phase: 'Ideate',
    title: 'Logo and design language',
    body: 'From the brief I create the logo and the design language: colour, type, imagery and voice. With AI I explore many directions quickly, then keep the one that serves the people from the first step.',
    terms: [
      { term: 'Design language', meaning: 'The logo, colour, type, imagery and voice that make the product recognisable anywhere.' },
      { term: 'Visual hierarchy', meaning: 'Size, weight and contrast rank every action, with one primary action per view.' },
    ],
    system: 'Each choice is named as a token from the first day, so the language becomes a system without being redrawn.',
  },
  {
    phase: 'Prototype',
    title: 'Design system in Claude Design',
    body: 'I turn the language into a design system in Claude Design: tokens, components and every state, built to ten UX laws and WCAG AA. It is not finished until every component holds up in both themes and at every screen size.',
    terms: [
      { term: 'Design token', meaning: 'Every colour, space and type size gets a name before any screen uses it.' },
      { term: 'UX laws', meaning: 'The ten I design by become system rules. Fitts’s law, for one, sets a 44 px minimum touch target.' },
      { term: 'WCAG AA', meaning: 'The floor in every theme and state, such as 4.5:1 contrast for body text.' },
    ],
    system: 'Claude Design holds it, so designers, engineers and AI tools read the same tokens and rules.',
    proof: { label: 'The design systems I built', href: '/my-design-systems' },
    hub: true,
  },
  {
    phase: 'Prototype',
    title: 'Templates for two audiences',
    body: 'Inside the system I build templates for product teams and for colleagues who don’t design. Wireframes settle the structure before the visual design goes on.',
    terms: [
      { term: 'Wireframe', meaning: 'Structure and content settled in grey, before colour and type.' },
    ],
    system: 'Templates use only system components, so a page made by someone who doesn’t design is on brand by construction.',
  },
  {
    phase: 'Test',
    title: 'Audit, score and refine',
    body: 'I audit the system and its templates against a fixed checklist: heuristics, spacing and overflow, every screen width, every state, contrast in both themes, motion and page speed. Each round is scored out of 10, and I keep refining until it reaches at least 9.',
    terms: [
      { term: 'Usability heuristic', meaning: 'Nielsen’s ten rules of thumb, checked in every audit round.' },
      { term: 'Quality gate', meaning: 'A checklist every page passes before release. On this site it runs as automated checks.' },
    ],
    system: 'Every fix becomes a rule in the system, so new pages meet it from the start.',
    proof: { label: 'The quality gate', href: '/blog/portfolio-quality-gate' },
  },
  {
    phase: 'Prototype',
    title: 'Mockups, prototypes and approval',
    body: 'From the audited system I design high-fidelity mockups and clickable prototypes, each with its loading, empty, error and success states, and take them to stakeholders for approval.',
    terms: [
      { term: 'Mockup', meaning: 'The finished look of a screen, assembled from system components rather than drawn from scratch.' },
      { term: 'Prototype', meaning: 'A clickable flow stakeholders can try before they approve it.' },
    ],
    system: 'What stakeholders approve is made of the same tokens and components the product will ship with.',
  },
  {
    phase: 'Implement',
    title: 'Handoff and build review',
    body: 'Specs are written so an engineer, or an AI agent, can build without guessing. Then I review the build by hand and with UI audit skills, and make the UI fixes on the production branch myself. The work is done when the live product matches the design.',
    terms: [
      { term: 'Component spec', meaning: 'A file listing each component’s parts, states and rules, readable by people and by AI agents.' },
      { term: 'Design QA', meaning: 'The built product checked against the approved design, screen by screen.' },
    ],
    system: 'The system ships with the product: tokens, components and specs the next team, and the next agent, build on.',
    proof: { label: 'The component spec template', href: '/blog/component-spec-files' },
  },
];

/* The route for people who don't design (owner, 22 November 2026): guides on using artifacts, or a first draft from
   ChatGPT, an image tool or slides that he rebuilds in the design language with prompts and brand artifacts. */
export const processBranch = {
  title: 'When the first draft comes from someone who doesn’t design',
  lead: 'Many of the people I design for are not designers. They reach the same design language by one of two routes.',
  routes: [
    { title: 'They make it themselves', body: 'I write short guides on making on-brand work with Claude artifacts and the system’s templates, so they can start without waiting for me.' },
    { title: 'They bring me a draft', body: 'A first version from ChatGPT, an image tool or a slide deck comes to me. I rebuild it in the brand’s design language with prompts and brand artifacts, keeping their content.' },
  ] as ProcessRoute[],
};
