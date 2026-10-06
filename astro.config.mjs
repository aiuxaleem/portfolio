import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';
import fs from 'node:fs';

/* /_states shows every component in every state. It exists in dev and in quality runs only:
   it is never part of a normal production build and never in the sitemap (CLAUDE.md 2.6). */
const withStates = process.env.QUALITY_BUILD === '1';
/* The content editor (Keystatic, local mode) runs with `npm run dev` only, at /keystatic. */
const isDev = process.argv.includes('dev');
/* Hosting differences. Vercel serves about.html at /about, so pages are built as files. GitHub Pages redirects /work to
   /work/ whenever a work/ folder exists, so its build sets BUILD_FORMAT=directory (work/index.html). SITE_URL is the
   address used for canonical links, the sitemap and share images; it defaults to the main domain. */
const siteUrl = process.env.SITE_URL || 'https://aiuxaleem.com';
const asFolders = process.env.BUILD_FORMAT === 'directory';
/* The admin area (sign-in, and later the dashboard and editors) needs a server. It is part of the build only on Vercel,
   or when ADMIN_APP=1 is set to try that build locally. Every other build (quality runs, GitHub Pages) stays fully static
   and does not contain the admin routes at all. In dev the routes are always there. */
const withAdmin = !!process.env.VERCEL || process.env.ADMIN_APP === '1';
const devOnly = {
  name: 'dev-only-routes',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev' || withStates) injectRoute({ pattern: '/_states', entrypoint: './src/dev/states.astro' });
      if (command === 'dev' || withAdmin) {
        injectRoute({ pattern: '/admin', entrypoint: './src/admin/pages/index.astro' });
        injectRoute({ pattern: '/admin/login', entrypoint: './src/admin/pages/login.astro' });
        injectRoute({ pattern: '/admin/logout', entrypoint: './src/admin/pages/logout.ts' });
        injectRoute({ pattern: '/api/hit', entrypoint: './src/admin/pages/hit.ts' });
        injectRoute({ pattern: '/admin/youtube', entrypoint: './src/admin/pages/youtube.astro' });
        injectRoute({ pattern: '/admin/images', entrypoint: './src/admin/pages/images.astro' });
        injectRoute({ pattern: '/admin/images/file', entrypoint: './src/admin/pages/image-file.ts' });
        // One list and one editor for every kind of entry: /admin/projects, /admin/case-studies, /admin/posts.
        injectRoute({ pattern: '/admin/[kind]', entrypoint: './src/admin/pages/entries/index.astro' });
        injectRoute({ pattern: '/admin/[kind]/new', entrypoint: './src/admin/pages/entries/edit.astro' });
        injectRoute({ pattern: '/admin/[kind]/[slug]', entrypoint: './src/admin/pages/entries/edit.astro' });
      }
    },
  },
};

/* The sitemap is written after the pages, so a page's own noindex tag can be read from the built file. */
const inSitemap = page => {
  if (page.includes('/_states')) return false;
  if (withStates) return true;
  const route = new URL(page).pathname.replace(/\/$/, '');
  // With the Vercel adapter the built pages are under dist/client.
  const file = ['dist', 'dist/client'].flatMap(d => [`${d}${route || '/index'}.html`, `${d}${route}/index.html`]).find(f => fs.existsSync(f));
  return !(file && /<meta name="robots" content="noindex/.test(fs.readFileSync(file, 'utf8')));
};

export default defineConfig({
  site: siteUrl,
  /* Astro's own cross-site check compares the full address of the request with the Origin header. Behind Vercel's proxy
     those differ for genuine posts, so it refused every sign-in and page view (403). The admin routes do the check
     themselves by host name: sameOrigin() in src/admin/lib/auth.ts, covered by scripts/quality/check-admin.mjs. */
  security: { checkOrigin: false },
  ...(withAdmin ? { adapter: vercel() } : {}),
  /* 'never' in builds (clean URLs); 'ignore' in dev, where a strict setting breaks the editor's own script requests. */
  trailingSlash: isDev ? 'ignore' : 'never',
  /* The one stylesheet (about 14 KB gzipped) is inlined into each page, so the first paint does not wait for a second request. */
  build: { format: asFolders ? 'directory' : 'file', inlineStylesheets: 'always' },
  /* Code blocks are plain <pre><code>, styled with tokens so they follow the theme. A highlighter would inline fixed colours. */
  markdown: { syntaxHighlight: false },
  /* The editor's server entry imports an Astro virtual module that the dev dependency optimiser cannot resolve; leave it unbundled. */
  /* COUNT_VISITS tells the page head whether to send a page view: only where the /api/hit route exists. */
  vite: { optimizeDeps: { exclude: ['@keystatic/astro'] }, define: { 'import.meta.env.COUNT_VISITS': JSON.stringify(withAdmin || isDev ? '1' : '') } },
  /* The Read page was at /writing until Phase 24. Old links keep working. */
  redirects: { '/writing': '/read' },
  integrations: [mdx(), sitemap({ filter: inSitemap }), devOnly, ...(isDev ? [react(), keystatic()] : [])],
});
