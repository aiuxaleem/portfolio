/* Profile data for /about, /resume, /now and the contact form: src/content/site/profile.json, editable at /admin.
   The file is validated here, so a missing or mistyped field stops the build.
   Fields named "verify" are notes for the owner. They are never rendered on a public page; /_states lists them. */
import { z } from 'astro/zod';
import data from './site/profile.json';

const month = z.string().regex(/^(\d{4}-\d{2})?$/, 'Use YYYY-MM, or leave empty');
const item = z.object({ title: z.string(), body: z.string() });
const schema = z.object({
  headline: z.string(),
  positioning: z.string(),
  summary: z.array(z.string()),
  principles: z.array(item),
  career: z.array(z.object({ company: z.string(), role: z.string(), start: month, end: month, location: z.string(), summary: z.string(), highlights: z.array(z.string()), verify: z.string() })),
  expertise: z.array(item),
  aiWorkflow: z.array(item),
  tools: z.array(z.string()),
  education: z.array(z.object({ school: z.string(), qualification: z.string(), verify: z.string() })),
  now: z.object({ updated: month, building: z.array(item.extend({ status: z.string() })), verify: z.string() }),
  contactForm: z.object({ formspreeId: z.string().regex(/^[a-z0-9]*$/i, 'Only the id, not the whole address'), verify: z.string() }),
});

export const profile = schema.parse(data);
export type Role = (typeof profile.career)[number];

const fmt = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
/** "Jan 2025 to present", "Jun 2022 to Jan 2024", or nothing when the start is unknown. */
export const period = (r: { start: string; end: string }) => (r.start ? `${fmt(r.start)} to ${r.end ? fmt(r.end) : 'present'}` : '');
export const monthLabel = (ym: string) => (ym ? new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');

/** Consecutive roles at the same company, grouped, in the order of the file (newest first). */
export function careerByCompany() {
  const groups: { company: string; roles: Role[] }[] = [];
  for (const r of profile.career) { const last = groups.at(-1); if (last && last.company === r.company) last.roles.push(r); else groups.push({ company: r.company, roles: [r] }); }
  return groups;
}

/** Every open note for the owner, for /_states and the phase report. */
export function verifyNotes(): { where: string; note: string }[] {
  return [
    ...profile.career.map(r => ({ where: `Career: ${r.company}, ${r.role}`, note: r.verify })),
    ...profile.education.map(e => ({ where: `Education: ${e.school}`, note: e.verify })),
    { where: 'Now', note: profile.now.verify },
    { where: 'Contact form', note: profile.contactForm.formspreeId ? '' : profile.contactForm.verify },
  ].filter(n => n.note);
}

/** The Formspree address, or nothing while no form id is set. */
export const formEndpoint = profile.contactForm.formspreeId ? `https://formspree.io/f/${profile.contactForm.formspreeId}` : undefined;
