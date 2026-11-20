/* Content shared by the two audience landing pages (L-83) and the main site's Home.
   - twoUsers: the "Two users" heading and paragraph, the owner's words (5 November 2026, L-53), also used by
     components/home/two-users.astro, so the idea is worded once.
   - landingFigures: the numbers on both landing pages, each as its case study states it (the same figures as the career
     highlights, L-82); none is rounded, combined or estimated here. */
import type { Figure } from '../components/landing/landing-figures.astro';

export const twoUsers = {
  title: 'Two users now: the person, and the agent acting for them',
  /** The words of the title drawn in the brand gradient on the landing pages. */
  accent: 'the agent acting for them',
  body: 'When someone sends an AI agent to book, file or cancel something, the agent reads the product first. The person still decides whether it worked, and may never see a screen. I design for both, and for the moment the work passes between them.',
};

export const landingFigures: Figure[] = [
  { value: 13, suffix: '+', spoken: '13 or more years', label: 'Years in product design, from enterprise UX to AI products.' },
  { value: 7, from: 1646, spoken: 'From 1,646 to 7', label: 'Text nodes below WCAG AA contrast on an AI freight platform’s console, in light mode across 97 screens in testing.', href: '/case-studies/design-system-audit-skill' },
  { value: 80, suffix: ' of 80', spoken: '80 of 80', label: 'Measured colour pairs meeting WCAG AA in light and dark, across five brands on one component library.', href: '/case-studies/multi-brand-component-system' },
  { value: 231, spoken: '231', label: 'Token values in the Colaberry Design System, behind 20 React components and 15 templates.', href: '/case-studies/colaberry-design-system' },
];
