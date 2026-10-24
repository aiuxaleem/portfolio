// Video posters from YouTube (owner's permission, 24 October 2026). Runs before every build (`prebuild` in package.json),
// so a video published from the admin gets its poster on the next Vercel build with nothing to do by hand.
//
// For every video in src/content/videos/*.yaml that has a real YouTube id and no poster of its own, the script saves
// YouTube's thumbnail as src/assets/media/youtube/<id>.jpg (the largest size YouTube has, else the standard one).
// src/lib/videos.ts picks the file up by the video's id; a poster set in the entry always wins.
// A file that is already there is kept. Only a JPEG is saved. A network fault never stops the build: the card keeps its
// drawn cover until the next build.
//   node scripts/content/youtube-posters.mjs            fetch what is missing
//   node scripts/content/youtube-posters.mjs --check    only list what is missing
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VIDEOS = path.join(ROOT, 'src/content/videos');
const OUT = path.join(ROOT, 'src/assets/media/youtube');
const check = process.argv.includes('--check');

const entries = fs.readdirSync(VIDEOS).filter(f => /\.ya?ml$/.test(f)).map(f => {
  const text = fs.readFileSync(path.join(VIDEOS, f), 'utf8');
  const id = text.match(/^youtubeId:\s*["']?([\w-]{11})["']?\s*$/m)?.[1];
  return { file: f, id, ownPoster: /^poster:/m.test(text), fixture: /^fixture:\s*true/m.test(text) };
});
const wanted = entries.filter(e => e.id && !e.ownPoster && !e.fixture && !fs.existsSync(path.join(OUT, `${e.id}.jpg`)));
if (!wanted.length) { console.log('youtube posters: none missing'); process.exit(0); }
if (check) { console.log('youtube posters missing:', wanted.map(e => `${e.file} (${e.id})`).join(', ')); process.exit(0); }

fs.mkdirSync(OUT, { recursive: true });
const isJpeg = b => b.length > 2000 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
for (const e of wanted) {
  let saved = false;
  for (const size of ['maxresdefault', 'hqdefault']) {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${e.id}/${size}.jpg`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const body = Buffer.from(await res.arrayBuffer());
      if (!isJpeg(body) || body.length > 3_000_000) continue;
      fs.writeFileSync(path.join(OUT, `${e.id}.jpg`), body);
      console.log(`youtube posters: saved ${e.id}.jpg (${size}, ${Math.round(body.length / 1024)} KB) for ${e.file}`);
      saved = true; break;
    } catch { /* try the next size */ }
  }
  if (!saved) console.log(`youtube posters: could not fetch a poster for ${e.file} (${e.id}); the card keeps its drawn cover`);
}
