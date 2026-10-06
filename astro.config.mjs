import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import fs from 'node:fs';

/* /_states shows every component in every state. It exists in dev and in quality runs only:
   it is never part of a normal production build and never in the sitemap (CLAUDE.md 2.6). */
const withStates = process.env.QUALITY_BUILD === '1';
/* The content editor (Keystatic, local mode) runs with `npm run dev` only, at /keystatic; /admin redirects to it.
   The production build stays fully static. Editing on the live site needs GitHub mode and a server adapter (hosting phase). */
const isDev = process.argv.includes('dev');
/* Hosting differences. Vercel serves about.html at /about, so pages are built as files. GitHub Pages redirects /work to
   /work/ whenever a work/ folder exists, so its build sets BUILD_FORMAT=directory (work/index.html). SITE_URL is the
   address used for canonical links, the sitemap and share images; it defaults to the main domain. */
const siteUrl = process.env.SITE_URL || 'https://aiuxaleem.com';
const asFolders = process.env.BUILD_FORMAT === 'directory';
const devOnly = {
  name: 'dev-only-routes',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev' || withStates) injectRoute({ pattern: '/_states', entrypoint: './src/dev/states.astro' });
      if (command === 'dev') injectRoute({ pattern: '/admin', entrypoint: './src/dev/admin.astro' });
    },
  },
};

/* The sitemap is written after the pages, so a page's own noindex tag can be read from the built file. */
const inSitemap = page => {
  if (page.includes('/_states')) return false;
  if (withStates) return true;
  const route = new URL(page).pathname.replace(/\/$/, '');
  const file = [`dist${route || '/index'}.html`, `dist${route}/index.html`].find(f => fs.existsSync(f));
  return !(file && /<meta name="robots" content="noindex/.test(fs.readFileSync(file, 'utf8')));
};

export default defineConfig({
  site: siteUrl,
  /* 'never' in builds (clean URLs); 'ignore' in dev, where a strict setting breaks the editor's own script requests. */
  trailingSlash: isDev ? 'ignore' : 'never',
  /* The one stylesheet (about 14 KB gzipped) is inlined into each page, so the first paint does not wait for a second request. */
  build: { format: asFolders ? 'directory' : 'file', inlineStylesheets: 'always' },
  /* Code blocks are plain <pre><code>, styled with tokens so they follow the theme. A highlighter would inline fixed colours. */
  markdown: { syntaxHighlight: false },
  /* The editor's server entry imports an Astro virtual module that the dev dependency optimiser cannot resolve; leave it unbundled. */
  vite: { optimizeDeps: { exclude: ['@keystatic/astro'] } },
  integrations: [mdx(), sitemap({ filter: inSitemap }), devOnly, ...(isDev ? [react(), keystatic()] : [])],
});
