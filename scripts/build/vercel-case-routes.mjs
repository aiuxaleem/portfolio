// Runs after every build (npm "postbuild"). On a build with the Vercel adapter (the live site, or ADMIN_APP=1), it marks every
// route that sends a request to the server function as case-sensitive in .vercel/output/config.json.
//
// Why: Vercel matches a route's `src` without regard to case unless the route says otherwise, while Astro's own router inside
// the function is case-sensitive. So `/ADMIN` or `/API/hit` reached the function, which found no page, then tried to fetch the
// prebuilt 404 page without catching the failure and crashed: "500 FUNCTION_INVOCATION_FAILED" (docs/AUDIT_FINDINGS.md L-71).
// With `caseSensitive: true` such an address falls through to the last route, the static 404 page, like any unknown address.
// Static pages are untouched: they are served from files before these routes are read. A build without the adapter has no
// config.json and is left alone.
//
// It lives in scripts/build/, not scripts/publish/: the host leaves scripts/publish/ out of the upload (.vercelignore), so from
// there the live build could not find it and failed (16 November 2026, L-73). The public copy keeps it and it exits at once.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* The project folder, found from this file (not scripts/lib.mjs, which loads Playwright: this runs inside the host's build). */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const file = path.join(ROOT, '.vercel/output/config.json');
if (!fs.existsSync(file)) process.exit(0);
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
let marked = 0;
for (const route of config.routes ?? []) {
  if (route.src && route.dest === '_render' && route.caseSensitive !== true) { route.caseSensitive = true; marked++; }
}
const total = (config.routes ?? []).filter(r => r.dest === '_render').length;
if (marked) fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
console.log(`vercel-case-routes: ${total} server route(s) are case-sensitive (${marked} marked now).`);
