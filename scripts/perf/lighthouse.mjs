// Lighthouse (mobile, simulated slow 4G and 4x CPU slowdown: Lighthouse's default mobile settings) on one page per template,
// against the built site served locally with gzip, in headless Edge or Chrome.
// node scripts/perf/lighthouse.mjs --label=before [--dir=dist] [--only=home,about]
// Writes reports/perf/lighthouse-<label>.json and one full report per page in reports/perf/<label>/.
// INP cannot be measured without a real interaction; Total Blocking Time is reported as its lab stand-in.
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { ROOT, serve, arg } from '../lib.mjs';
import { TEMPLATES } from './templates.mjs';

const label = arg('label', 'run'), dir = arg('dir', 'dist'), only = arg('only', '') ? String(arg('only')).split(',') : null;
const PORT = 4410, outDir = path.join(ROOT, 'reports/perf', label);
fs.mkdirSync(outDir, { recursive: true });
const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
const server = await serve(dir, PORT); const rows = [];
for (const [name, route] of TEMPLATES.filter(t => !only || only.includes(t[0]))) {
  const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH || EDGE, chromeFlags: ['--headless=new', '--no-first-run'] });
  try {
    const r = await lighthouse(`http://127.0.0.1:${PORT}${route}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
    const l = r.lhr, a = l.audits, num = k => (a[k] ? a[k].numericValue : null), score = c => Math.round(l.categories[c].score * 100);
    fs.writeFileSync(path.join(outDir, name + '.json'), r.report);
    const lcpNode = a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node || a['lcp-breakdown-insight']?.details?.items?.find(i => i.type === 'node');
    const row = { name, route, performance: score('performance'), accessibility: score('accessibility'), bestPractices: score('best-practices'), seo: score('seo'),
      lcpMs: Math.round(num('largest-contentful-paint')), fcpMs: Math.round(num('first-contentful-paint')), cls: +(num('cumulative-layout-shift') || 0).toFixed(3), tbtMs: Math.round(num('total-blocking-time')), speedIndexMs: Math.round(num('speed-index')),
      transferKB: Math.round(num('total-byte-weight') / 1024), requests: a['network-requests']?.details?.items?.length,
      thirdPartyHosts: [...new Set((a['network-requests']?.details?.items || []).map(i => new URL(i.url).host).filter(h => !h.startsWith('127.0.0.1')))],
      renderBlocking: (a['render-blocking-resources']?.details?.items || a['render-blocking-insight']?.details?.items || []).map(i => i.url.replace(`http://127.0.0.1:${PORT}`, '')),
      lcpElement: (lcpNode?.snippet || '').replace(/\s+/g, ' ').slice(0, 200),
      failedAudits: Object.values(a).filter(x => x.score !== null && x.score < 0.9 && !['informative', 'notApplicable', 'manual'].includes(x.scoreDisplayMode)).map(x => x.id + (x.displayValue ? ` (${x.displayValue})` : '')) };
    rows.push(row);
    console.log(`${name.padEnd(13)} perf ${row.performance} a11y ${row.accessibility} bp ${row.bestPractices} seo ${row.seo} | LCP ${row.lcpMs} ms, CLS ${row.cls}, TBT ${row.tbtMs} ms, ${row.transferKB} KB, ${row.requests} requests`);
  } catch (e) { rows.push({ name, route, error: String(e.message).slice(0, 300) }); console.log(name, 'ERROR', String(e.message).slice(0, 200)); }
  await chrome.kill();
}
server.close();
fs.writeFileSync(path.join(ROOT, 'reports/perf', `lighthouse-${label}.json`), JSON.stringify(rows, null, 1));
