// Owner facts on every built page: one job title, one contact email, the resume link from site settings, no phone number.
// node scripts/quality/check-owner-facts.mjs [--dir=dist]   Exit code 1 when anything is off.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, arg } from '../lib.mjs';

const dir = path.join(ROOT, arg('dir', 'dist'));
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/site/config.json'), 'utf8'));
const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/site/profile.json'), 'utf8'));
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(dir).filter(f => /\.(html|xml|txt)$/.test(f)), fails = [], seen = { title: 0, email: 0, resume: 0 };
/* Titles the site used before the owner settled on the current one. "Lead product designer" without "AI" is the legacy wording. */
/* "Lead product designer" as the owner's own title is an old title. The Services page also says who it is for, "companies hiring a
   senior or lead product designer": that names a kind of role, not the owner, and is the one wording let through (8 October 2026). */
const OLD_TITLES = /AI-first (Senior|Lead) Product Designer|Senior AI Product Designer|(?<!hiring a senior or )Lead product designer|UX Designer (&amp;|&) Analyst|مصمّم منتجات أول/gi;
const PHONE = /(\+?\d[\d\s().-]{8,}\d)/g;
for (const f of files) { const rel = path.relative(dir, f).replace(/\\/g, '/'); const s = fs.readFileSync(f, 'utf8'); const text = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, m => (/ld\+json/.test(m) ? m : '')).replace(/<svg[\s\S]*?<\/svg>/g, '');
  /* /_states lists the owner's own notes, which quote the old titles on purpose. */
  if (!rel.startsWith('_states')) for (const m of text.matchAll(OLD_TITLES)) fails.push(`${rel}: old job title "${m[0]}"`);
  if (text.includes(profile.headline)) seen.title++;
  for (const raw of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)) { const m = [raw[0].replace(/\.$/, '')]; if (/^(name|test|fixture)@example\.com$/.test(m[0]) || m[0].endsWith('.png') || m[0].endsWith('.webp') || m[0].endsWith('.jpg')) continue; if (m[0] === site.email) seen.email++; else fails.push(`${rel}: an email address other than ${site.email}: ${m[0]}`); }
  for (const m of text.matchAll(/href="([^"]*drive\.google\.com[^"]*)"/g)) { const href = m[1].replace(/&amp;/g, '&'); if (href === site.resume.fallbackUrl) seen.resume++; else fails.push(`${rel}: a resume link other than the one in site settings: ${href.slice(0, 70)}`); }
  const visible = text.replace(/<[^>]+>/g, ' ');
  for (const m of visible.matchAll(PHONE)) { const digits = m[0].replace(/\D/g, ''); if (digits.length >= 10 && digits.length <= 13 && !/^(19|20)\d{2}/.test(digits) && !/^\d{4}\s*-\s*\d{2}/.test(m[0]) && !/U\+|^0{6,}/.test(m[0])) fails.push(`${rel}: looks like a phone number: "${m[0].trim()}"`); } }
console.log(`${files.length} files in ${path.relative(ROOT, dir)}: title "${profile.headline}" on ${seen.title}; ${site.email} appears ${seen.email} times; resume link appears ${seen.resume} times`);
if (fails.length) { for (const x of [...new Set(fails)].slice(0, 40)) console.log('  - ' + x); console.log(`FAILED: ${new Set(fails).size} finding(s)`); process.exit(1); }
/* A resume link that leaves the site must not be labelled as a download. */
const wrong = files.filter(f => f.endsWith('.html')).flatMap(f => [...fs.readFileSync(f, 'utf8').matchAll(/<a\b[^>]*drive\.google\.com[^>]*>([\s\S]*?)<\/a>/g)].filter(m => /Download|تحميل/.test(m[1].replace(/<[^>]+>/g, ''))).map(() => path.relative(dir, f)));
if (wrong.length) { console.log(`FAILED: a link to the Drive folder is labelled as a download on: ${[...new Set(wrong)].join(', ')}`); process.exit(1); }
console.log('PASSED: one job title, one email address, one resume link (labelled as a view, not a download), no phone number.');
