/* /og/<page path>.png: one generated Open Graph image per page listed in src/lib/seo.ts, plus /og/default.png. */
import type { APIRoute } from 'astro';
import { ogEntries } from '../../lib/seo';
import { renderOg } from '../../lib/og-image';

export async function getStaticPaths() {
  return (await ogEntries()).map(e => ({ params: { path: e.path }, props: e }));
}
export const GET: APIRoute = async ({ props }) => new Response(new Uint8Array(await renderOg(props as { title: string; kicker?: string })), { headers: { 'Content-Type': 'image/png' } });
