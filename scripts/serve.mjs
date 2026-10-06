// Serves a folder (default: legacy) for local viewing: npm run legacy
import { serve } from './lib.mjs';
const dir = process.argv[2] || 'legacy';
const port = Number(process.argv[3] || 4321);
await serve(dir, port);
console.log(`Serving ${dir}/ at http://127.0.0.1:${port}/`);
