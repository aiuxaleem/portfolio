/* Private work (docs/PRIVATE_WORK.md): what the public side needs without the server. The request form's rules and words
   (shared with the server's check in src/admin/lib/private-work.ts, which the public GitHub Pages copy leaves out), the
   time limits the pages and the email speak of, and where a page sends a visitor who wants the private links. */
import { MAIN_LIVE } from './sites';

/** How long a sign-in link works, a signed-in browser stays signed in, and a request is kept once it stops being useful. */
export const TOKEN_DAYS = 7;
export const SESSION_DAYS = 30;
export const KEEP_DAYS = 90;
/** Requests one address may send in an hour. */
export const PER_HOUR = 3;

export interface RequestInput { name: string; email: string; company: string; role: string; reason: string; consent: boolean }
/** The longest each answer may be: the form says so with maxlength, and the server refuses longer, never cuts silently. */
export const LIMITS = { name: 100, email: 200, company: 120, role: 120, reason: 1000 } as const;
/** The message for each field: the server's, and the browser's blur check reads the same words from the form. */
export const FIELD_ERRORS = {
  name: 'Enter your name.',
  email: 'Enter your work email, like name@example.com.',
  company: 'Enter the company you work for.',
  role: 'Enter your role.',
  reason: `Keep this to ${LIMITS.reason} characters.`,
  consent: 'Tick the box to agree to keep the work confidential.',
} as const;
export type RequestField = keyof typeof FIELD_ERRORS;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* /private-work is a server page, part of a build only where the admin is (Vercel, ADMIN_APP=1, and dev: COUNT_VISITS is
   '1' exactly there, astro.config.mjs, as the UX Library's suggestion form also relies on). Every other build is fully
   static (the GitHub Pages copy, quality runs), where a link to /private-work would be a 404, so there the link goes to
   the page on the live Vercel site. The audience websites' hosts send /private-work on to the main site (vercel.json). */
const served = import.meta.env.COUNT_VISITS === '1';

/** The request page, with the page the visitor came from (case-studies/<slug> or work/<slug>) so the request can name it. */
export const privateWorkHref = (from?: string) => `${served ? '' : MAIN_LIVE}/private-work${from ? `?from=${encodeURIComponent(from)}` : ''}`;
