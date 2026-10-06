/* Stress fixtures required by CLAUDE.md 2.3. Every component must pass each of them on /_states. */
export const stress = {
  /** A 120-character title. */
  longTitle: 'A deliberately long one hundred and twenty character title used to test how every heading wraps across narrow screens ok',
  /** An unbroken 60-character string or URL. */
  unbroken: 'https://example.com/an-unbroken-string-of-sixty-characters-x1',
  /** A one-word title. */
  oneWord: 'Work',
  /** A missing optional field. */
  missing: '',
  /** Eight or more tags. */
  tags: ['Design systems', 'Accessibility', 'Tokens', 'AI workflow', 'Prototyping', 'Research', 'Motion', 'Arabic and RTL', 'Handoff'],
} as const;
