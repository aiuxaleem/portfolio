/* The sitemap of the job website (docs/SITES.md), on its own host: /sitemap.xml there. */
import type { APIRoute } from 'astro';
import { siteSitemap } from '../../lib/site-feeds';
export const GET: APIRoute = async () => new Response(await siteSitemap('job'), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
