// Pixel comparison of two PNG files. Returns { same, diffPixels, total, sizeMismatch }.
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export function diffPng(fileA, fileB, diffOut) {
  const a = PNG.sync.read(fs.readFileSync(fileA)), b = PNG.sync.read(fs.readFileSync(fileB));
  if (a.width !== b.width || a.height !== b.height) return { same: false, sizeMismatch: `${a.width}x${a.height} vs ${b.width}x${b.height}`, diffPixels: -1, total: a.width * a.height };
  const diff = new PNG({ width: a.width, height: a.height });
  // threshold 0.1 is pixelmatch's per-pixel colour tolerance (anti-aliasing noise); the pass rule is 0 differing pixels.
  const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  if (diffPixels && diffOut) fs.writeFileSync(diffOut, PNG.sync.write(diff));
  return { same: diffPixels === 0, diffPixels, total: a.width * a.height };
}
