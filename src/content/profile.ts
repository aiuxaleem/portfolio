/* Profile data for /about, /resume, /now and the contact form: src/content/site/profile.json, editable at /admin.
   The file is validated here, so a missing or mistyped field stops the build.
   Fields named "verify" are notes for the owner. They are never rendered on a public page; /_states lists them. */
import { profileSchema } from '../lib/content-schemas';
import data from './site/profile.json';


export const profile = profileSchema.parse(data);
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
