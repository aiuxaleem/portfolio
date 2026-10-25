/* robots.txt of the clients website (docs/SITES.md), on its own host: /robots.txt there. */
import type { APIRoute } from 'astro';
import { SUB_SITES } from '../../lib/sites';
export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SUB_SITES.clients.origin}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
