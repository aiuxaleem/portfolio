// Serves a production build that includes the admin, the way Vercel serves it: static files from dist/client and every
// other request through the server bundle's own handler (the same code, the same inlined stylesheet order, the same
// middleware as the live site). The development server orders a page's stylesheets differently from a build, which is
// how the sign-in page's Show password box was broken on the live site for three weeks while every check on the
// development server passed (docs/AUDIT_FINDINGS.md L-40). So the admin checks run against this as well:
//   ADMIN_APP=1 npm run build                       (the Vercel adapter's last step may fail on a machine that cannot make
//                                                    symlinks; dist/server and dist/client are complete before it)
//   node scripts/quality/serve-production.mjs       serves it at http://localhost:4323
//   node scripts/quality/check-admin-ui.mjs --origin=http://localhost:4323
//   node scripts/quality/check-admin.mjs --origin=http://localhost:4323
// Settings come from .env.local (the test sign-in, the database, the GitHub token for a throwaway branch), as in dev.
//   node scripts/quality/serve-production.mjs [--root=<folder with dist/>] [--port=4323]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, arg } from '../lib.mjs';

const root = path.resolve(ROOT, String(arg('root', '.')));
const port = Number(arg('port', 4323));
const envFile = path.join(ROOT, '.env.local');
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=("?)(.*)\2$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[3];
}
process.env.COUNT_LOCAL ||= '1';
/* A complete adapter build moves the server into .vercel/output/_functions; in a junctioned worktree that move fails and
   the server stays in dist/server (see the note above). Either is served. */
const entry = ['dist/server/entry.mjs', '.vercel/output/_functions/entry.mjs'].map(f => path.join(root, f)).find(f => fs.existsSync(f));
if (!entry) { console.error(`No server build under ${root} (dist/server or .vercel/output/_functions). Run ADMIN_APP=1 npm run build first.`); process.exit(1); }
const { default: handler } = await import(pathToFileURL(entry).href);
const client = path.join(root, 'dist/client');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname).replace(/\/$/, '') || '/';
  for (const candidate of [clean, clean + '.html', clean + '/index.html']) {
    const file = path.join(client, candidate);
    if (file.startsWith(client) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
  }
  handler(req, res);
});
server.listen(port, '127.0.0.1', () => console.log(`production build of ${root} on http://localhost:${port}/ (Ctrl+C stops it)`));
