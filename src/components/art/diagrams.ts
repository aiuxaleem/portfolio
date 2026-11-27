/* Diagrams for long-form bodies (content/diagram.astro, the MDX block Diagram), drawn in the site's illustration style
   (styles/art.css: every colour a semantic token). Each has its own view box and words read out in its place, since a
   diagram in an article carries meaning (seventh review, 26 November 2026: a 23-minute case study had no figure). */
export const DIAGRAMS = {
  /* The loop of the iterative-prompting case study, its eight steps as the body lists them, in two rows that read left to
     right and back, the review's return to Change dashed, and the approval, the step that sends work live, lit. */
  promptLoop: {
    viewBox: '0 0 480 300',
    label: 'The loop in eight steps: rules, request, measure, change, gate, review, record, approve. Below the bar, the review sends the work back to change.',
    svg: `
    <path class="pa-stroke" d="M122 72h10M128 68l4 4-4 4"/>
    <path class="pa-stroke" d="M234 72h10M240 68l4 4-4 4"/>
    <path class="pa-stroke" d="M346 72h10M352 68l4 4-4 4"/>
    <path class="pa-stroke" d="M408 106v86M404 188l4 4 4-4"/>
    <path class="pa-stroke" d="M358 228h-10M352 224l-4 4 4 4"/>
    <path class="pa-stroke" d="M246 228h-10M240 224l-4 4 4 4"/>
    <path class="pa-stroke" d="M134 228h-10M128 224l-4 4 4 4"/>
    <path class="pa-accent pa-loop" d="M296 192C296 150 320 128 352 108"/><path class="pa-accent" d="M343 106l9 2-2 9"/>
    <text class="pa-mono" x="288" y="152" text-anchor="end">below the bar</text>
    <rect class="pa-card" x="24" y="40" width="96" height="64" rx="12"/><text class="pa-mono" x="38" y="64">01</text><text class="pa-label" x="38" y="88">Rules</text>
    <rect class="pa-card" x="136" y="40" width="96" height="64" rx="12"/><text class="pa-mono" x="150" y="64">02</text><text class="pa-label" x="150" y="88">Request</text>
    <rect class="pa-card" x="248" y="40" width="96" height="64" rx="12"/><text class="pa-mono" x="262" y="64">03</text><text class="pa-label" x="262" y="88">Measure</text>
    <rect class="pa-card" x="360" y="40" width="96" height="64" rx="12"/><text class="pa-mono" x="374" y="64">04</text><text class="pa-label" x="374" y="88">Change</text>
    <rect class="pa-card" x="360" y="196" width="96" height="64" rx="12"/><text class="pa-mono" x="374" y="220">05</text><text class="pa-label" x="374" y="244">Gate</text>
    <rect class="pa-chip" x="248" y="196" width="96" height="64" rx="12"/><text class="pa-mono" x="262" y="220">06</text><text class="pa-label" x="262" y="244">Review</text>
    <rect class="pa-card" x="136" y="196" width="96" height="64" rx="12"/><text class="pa-mono" x="150" y="220">07</text><text class="pa-label" x="150" y="244">Record</text>
    <rect class="pa-fill" x="24" y="196" width="96" height="64" rx="12"/><text class="pa-mono pa-num" x="38" y="220">08</text><text class="pa-label pa-num" x="38" y="244">Approve</text>`,
  },
} as const;

export type DiagramName = keyof typeof DIAGRAMS;
