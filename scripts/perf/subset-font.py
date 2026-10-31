"""Cut one font file down for the web, keeping it pixel-identical for the characters it keeps.
python -I scripts/perf/subset-font.py <in.woff2> <out.woff2> <drop> [<min>:<max>]
Keeps every code point the file has except those in <drop> (a pyftsubset range list, U+FB50-FDFF,U+FE70-FEFF,...), with
every glyph the font's own layout rules can reach from them (the initial, medial and final forms, ligatures, marks), all
layout features, the hinting and the name table, so what is kept renders exactly as before. Drops glyph names. With <min>:<max> and a variable font, limits the weight axis to that
range; the default master moves to <min>, which re-rounds the outlines (not pixel-identical, see subset-fonts.mjs). Prints one JSON line: bytes, glyphs, and the unicode-range the file now covers.
Called by scripts/perf/subset-fonts.mjs. Needs fonttools and brotli (pip install fonttools brotli)."""
import io, json, os, sys
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer

src, out, drop = sys.argv[1:4]
wght = sys.argv[4] if len(sys.argv) > 4 else None
font = TTFont(src)
# Already cut (no code point in the dropped ranges, weight axis already the declared range): say so and stop, so a
# second run changes nothing and the file keeps its name.
dropped = set(subset.parse_unicodes(drop))
keep = [c for c in font.getBestCmap() if c not in dropped]
axis_done = True
if wght and 'fvar' in font:
    lo, hi = (float(v) for v in wght.split(':'))
    axis = next(a for a in font['fvar'].axes if a.axisTag == 'wght')
    axis_done = (axis.minValue, axis.maxValue) == (lo, hi)
if axis_done and len(keep) == len(font.getBestCmap()):
    print(json.dumps({'already': True, 'bytes': os.path.getsize(src), 'glyphs': font['maxp'].numGlyphs})); sys.exit(0)
if wght and 'fvar' in font:
    lo, hi = (float(v) for v in wght.split(':'))
    axis = next(a for a in font['fvar'].axes if a.axisTag == 'wght')
    if (axis.minValue, axis.maxValue) != (lo, hi):
        font = instancer.instantiateVariableFont(font, {'wght': (lo, lo, hi)}, inplace=False, updateFontNames=False)
        buf = io.BytesIO(); font.save(buf); buf.seek(0); font = TTFont(buf)  # a saved-and-reopened font: the instancer leaves gvar half-loaded, which trips the subsetter
opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
opts.name_IDs = ['*']
opts.notdef_outline = True
opts.hinting = True
opts.glyph_names = False
opts.recalc_timestamp = False
s = subset.Subsetter(opts)
s.populate(unicodes=keep)
s.subset(font)
font.flavor = 'woff2'
font.save(out)
cps = sorted(TTFont(out).getBestCmap())
ranges, start, prev = [], None, None
for c in cps + [None]:
    if start is not None and (c is None or c != prev + 1):
        ranges.append(f'U+{start:04X}' if start == prev else f'U+{start:04X}-{prev:04X}'); start = None
    if c is not None and start is None: start = c
    prev = c
print(json.dumps({'bytes': os.path.getsize(out), 'glyphs': font['maxp'].numGlyphs, 'codePoints': len(cps), 'ranges': ', '.join(ranges)}))
