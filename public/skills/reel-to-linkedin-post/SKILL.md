---
name: reel-to-linkedin-post
description: Turn a short-form video file (Reel, Short, TikTok, mp4/mov) into a caption-accurate transcript, per-step key frames, a where-to-find-it guide and one copy-ready LinkedIn post in Aleem's voice. Use when a video is attached with "turn this reel into a post", "transcribe this and write a post", or "extract the frames and find these tools".
---

# Reel to LinkedIn post

A creator's reel is treated as a reference, the same way a reference infographic is: its structure (the hook device, the numbered steps, the promised payoff) is the prompt, the post is Aleem's. The run produces five things, in this order: a transcript from the burned-in captions, labelled key frames per step, a short guide to where the things the reel mentions actually live, a finished post with a copy button, and a project reference doc so the next session does not redo the work.

Proven on 19 Oct 2026 with a 77 s reel ("how to build an AI agent, even if you're a complete beginner"), 16 frames, 1,631-character post, reference doc `claude/first-ai-agent-five-steps.md`.

## Inputs

- The video file (the upload path is given with the attachment; read it from there, never move it).
- What Aleem says the reel is about. Treat that as a hypothesis: the captions decide.
- Optional: the creator's URL or handle, a hook he says he likes, an angle.

## Step 0. Duplicate check (before any extraction)

1. Read memory `preferences.md` (queue summary) and every `areas/linkedin-queue-log*.md`; search the project docs for the topic (`project_search`).
2. Compare the reel's actual topic, not the title Aleem gave it. If the same topic or the same creator's piece is already queued or posted, stop and tell him which slot has it. Continue only on "skip", "you decide" or an explicit override.
3. If Aleem's description and the reel disagree (he said "five secret skills", the reel is "five steps"), the first line of the reply says so, and the duplicate check covers both readings.

## Step 1. Inspect and sheet the frames

```bash
V="<upload path>"; W=/tmp/claude-0/.../scratchpad/reel; mkdir -p $W/frames && cd $W
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of default=noprint_wrappers=1 "$V"
ffmpeg -v error -y -i "$V" -vf "fps=1,scale=360:-1" frames/f_%03d.jpg      # 1 fps, small
python3 sheets.py frames sheet                                              # 4x4 labelled contact sheets
```

```python
# sheets.py <frames_dir> <out_prefix>   (16 frames per sheet, t= label on each cell)
from PIL import Image, ImageDraw; import glob, os, sys
files=sorted(glob.glob(f'{sys.argv[1]}/f_*.jpg')); W,H=Image.open(files[0]).size
for s in range(0,len(files),16):
    sheet=Image.new('RGB',(4*W,4*H),'white'); d=ImageDraw.Draw(sheet)
    for i,f in enumerate(files[s:s+16]):
        x,y=(i%4)*W,(i//4)*H; sheet.paste(Image.open(f),(x,y))
        d.rectangle([x,y,x+70,y+26],fill='black'); d.text((x+6,y+6),f"t={int(os.path.basename(f)[2:5])-1}s",fill='yellow')
    sheet.save(f'{sys.argv[2]}_{s//16+1}.jpg',quality=85)
```

Read every sheet (a 77 s reel is five sheets). Note: the structure (hook, numbered sections, payoff), where the caption band sits as a fraction of height, which frames are talking-head with an animation card above the speaker, and which are full-screen illustrations. For videos over 3 minutes use `fps=0.5` and read the sheets that matter.

## Step 2. Transcript from the captions

Whisper is usually not installable (pip has no network in the container) and `faster-whisper` import fails; check once with `python3 -c "import whisper"` and move on. Reels carry burned-in captions, and `tesseract` is installed, so OCR the caption band at 4 fps. 1 fps misses words between cuts; 4 fps with de-duplication catches every caption change.

```python
# captions.py <video> <band_top_frac> <band_bottom_frac>   e.g. 0.72 0.83 for a band centred at 77% of the height
import subprocess, sys, glob, os, re
from PIL import Image; import pytesseract
v,top,bot=sys.argv[1],float(sys.argv[2]),float(sys.argv[3])
w,h=[int(x) for x in subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0',
     '-show_entries','stream=width,height','-of','csv=p=0',v]).decode().strip().split(',')]
os.makedirs('cap',exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',v,'-vf',f'fps=4,crop={w}:{int((bot-top)*h)}:0:{int(top*h)}','cap/c_%04d.png'],check=True)
prev=None
for f in sorted(glob.glob('cap/c_*.png')):
    im=Image.open(f).convert('L').point(lambda p:0 if p>150 else 255)   # light text on a dark box -> black on white; flip for dark text
    im=im.resize((im.width*2,im.height*2))
    t=' '.join(re.sub(r"[^A-Za-z0-9 ,.'\-\"]",'',pytesseract.image_to_string(im,config='--psm 6')).split())
    if t and t!=prev: print(f"{(int(os.path.basename(f)[2:6])-1)/4:6.2f}  {t}"); prev=t
```

Assemble the lines into sentences, fix OCR slips against what the sheets show, keep the creator's wording (it is quoted in the reference doc, never in the post). Keep the timestamps: they become the step boundaries.

## Step 3. Segment and extract key frames

1. Map each section to a time range from the caption timestamps (hook, step 1..n, payoff).
2. Pick one or two timestamps per section, mid-animation, never on a cut: frames at section boundaries are fades. Prefer the frame where the card is complete (typing finished, all tiles in).
3. Extract at full resolution and crop. Two kinds of frame:
   - card: a white animation card above the speaker's head; detect it as the rows in the top 45% that are mostly bright and crop to it.
   - full: a full-screen illustration; drop the caption band and the top margin.

```python
# keyframes.py <video> spec.txt     spec lines:  <label>|<seconds>|card|full
import subprocess, sys, os, numpy as np
from PIL import Image
v=sys.argv[1]; os.makedirs('out',exist_ok=True)
for line in open(sys.argv[2]):
    if not line.strip(): continue
    label,t,kind=[s.strip() for s in line.split('|')]
    subprocess.run(['ffmpeg','-v','error','-y','-ss',t,'-i',v,'-frames:v','1','key.png'],check=True)
    im=Image.open('key.png'); a=np.asarray(im.convert('L'))
    if kind=='card':
        br=a>228; rows=np.where(br[:int(a.shape[0]*0.45)].mean(1)>0.55)[0]
        y0,y1=max(0,rows.min()-10),rows.max()+10; cols=np.where(br[y0:y1].mean(0)>0.5)[0]
        im=im.crop((max(0,cols.min()-10),y0,min(im.width,cols.max()+10),y1))
    else:
        im=im.crop((0,int(im.height*0.085),im.width,int(im.height*0.71)))
    im.save(f"out/{label}.png")
```

Name files so they sort by step and carry the timestamp: `01 One specific job - focused (0-17)`, `03 Clear instructions - markdown files (0-46)`, `06 Bonus - it creates for you (1-13)`. Build one labelled storyboard JPG of all crops (4 columns, 350 px wide each, label above the image) and review it once: re-grab any frame that is faded, mid-typing or missing its card. Put a `README.txt` in `out/` with the section list, time ranges and the full transcript, zip the folder.

Deliver the storyboard with `display: render` (he sees it inline) and the zip with `display: attach`, each with a one-line caption. The storyboard goes out as soon as it is clean, before the research, so he can redirect early.

## Step 4. Find where the things live

The reel will name tools, files or a freebie gated behind "comment X to get it". The reply gives him the real locations; the post never carries links.

1. Identify the creator: web-search the hook sentence in quotes plus a distinctive term (the gated file's name, a step label). Fetch the creator's site; record brand, person if stated, channels. Needed only so the credit option in the reply is accurate.
2. Find the gated file in public: creators usually publish it on their site, ungated, under a guide page. Fetch it, confirm it is the same thing (same steps, same outputs), note version and date.
3. For every tool the reel names (ChatGPT, Claude, Gemini, Figma and so on), fetch the vendor's own help page for the exact feature the step maps to, and record plan limits and any retirement or rename. Vendor docs change monthly: Gemini Gems became Skills (Nov 2026), custom GPTs need a Business workspace and are being retired for Plugins, Claude Projects are on every plan with five on free. Never state a plan limit from memory.
4. Verify any date, price or number the reel shows before it goes in the post or the doc; drop what cannot be verified.
5. Keep a Sources list of every URL used for the reply.

## Step 5. Write the post

Read `claude/linkedin-post-rules.md` first. Then, if the `linkedin-skills` collection is installed, run `linkedin-post-writer` for the draft and `linkedin-humanizer` on it; Aleem's rules win wherever the skill disagrees (it prefers number-first hooks and offers hook options; he wants neither).

Hook, in the reel's structure, never its words:
- Line 1 is the promise plus the objection the reel disarms: "You can build your first AI agent this week, even if you have never written a line of code." Not a number, not a question, not "Here's how", not "Stop X".
- Line 2 is the portability or simplifying truth: "The same five steps work in ChatGPT, Claude and Gemini, and the whole setup is a handful of plain text files."
- Line 3 is Aleem's stance, from the project's beliefs: why a designer should care, what these steps are in design terms.

Body:
- One numbered paragraph per step: the reel's instruction in one sentence, then one sentence of Aleem's angle (the design-terms equivalent: problem statement, research repo, spec with acceptance criteria, authority map, usability test; or the way the step fails).
- The reel's concrete example may be used as an example, never as his own experience ("A competitor table that comes back with an empty price column is a missing line in the instructions").
- No claim about his own agents, projects or numbers unless he has stated it; write a view instead ("In my experience...") and tell him in the reply which dated fact of his own would strengthen the post.
- The gated freebie and the "comment X" mechanic never appear. A tip in his voice may replace it ("ask the model itself to interview you and write the files").
- Close with one direct question, then two or three hashtags (one broad, the rest niche).
- No creator names. The reply offers one credit line he can add ("The five steps come from a reel by <brand>").

Save as `post.txt` and run the check; it writes `post_spaced.txt` with U+2800 on every blank line.

```python
# check_post.py post.txt
import sys, re
t=open(sys.argv[1]).read().rstrip('\n'); L=t.split('\n'); first=L[0].strip(); bad=[]
if re.match(r'^\d',first) or first.endswith('?'): bad.append('hook is a number or a question')
if re.match(r"^(here's|here is|stop )",first.lower()): bad.append("hook opens with Here's or Stop")
if '—' in t or '–' in t: bad.append('dash')   # em dash, en dash
if any(ord(c)>0x2FFF for c in t): bad.append('emoji or symbol')
if 'http' in t or 'comment' in t.lower(): bad.append('link or comment mention')
tags=[w for w in t.split() if w.startswith('#')]
if not 2<=len(tags)<=3: bad.append(f'{len(tags)} hashtags')
body=[l for l in L if l.strip() and not l.strip().startswith('#')]
if not body[-1].strip().endswith('?'): bad.append('no closing question before the hashtags')
spaced='\n'.join(l if l.strip() else '⠀' for l in L); open('post_spaced.txt','w').write(spaced)   # braille blank keeps LinkedIn spacing
if len(spaced)>2960: bad.append(f'{len(spaced)} chars with spacers')
print('OK' if not bad else 'FIX: '+'; '.join(bad), len(spaced),'chars')
```

Then the copy card: an HTML artifact with the post in a `<pre>` and a Copy button that writes the exact spaced text (`navigator.clipboard.writeText` inside the click handler, fall back to selecting the text). Theme-aware tokens, Plus Jakarta Sans from Google Fonts, title a name ("First Agent Post"), one line in the reply saying what it is. Inject the text with `json.dumps(spaced, ensure_ascii=False)` so the braille blanks survive.

```python
# card.py  -> first-agent-post.html (reads post_spaced.txt)
import json; s=open('post_spaced.txt').read(); n=len(s)
open('post-card.html','w').write(f'''<title>First Agent Post</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">
<style>:root{{--bg:#f4f7fb;--card:#fff;--fg:#0b1a33;--muted:#52627a;--line:#d9e2ee;--a:#0b57d0;--b:#13b6d9}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0b1324;--card:#121c31;--fg:#e8eef8;--muted:#9fb0c8;--line:#243352;--a:#6aa5ff;--b:#35c8e6;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0b1324;--card:#121c31;--fg:#e8eef8;--muted:#9fb0c8;--line:#243352;--a:#6aa5ff;--b:#35c8e6;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font-family:"Plus Jakarta Sans",system-ui,sans-serif;margin:0;padding-block:28px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:680px;margin:0 auto;display:grid;gap:18px}}h1{{font-size:1.35rem;margin:0}}
.bar{{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}}.meta{{font-size:.8rem;color:var(--muted)}}
button{{font:600 .95rem inherit;color:#fff;border:0;border-radius:10px;padding:12px 20px;cursor:pointer;background:linear-gradient(90deg,var(--a),var(--b))}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;min-width:0}}pre{{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:400 1rem/1.6 inherit}}</style>
<main><h1>Your first AI agent in five steps</h1><div class="bar"><button id="c" type="button">Copy post</button><div class="meta">{n} characters, spacers included</div></div>
<section class="card"><pre id="p"></pre></section></main>
<script>(function(){{var t={json.dumps(s,ensure_ascii=False)};var p=document.getElementById('p');p.textContent=t;var b=document.getElementById('c');
function sel(){{var r=document.createRange();r.selectNodeContents(p);var x=getSelection();x.removeAllRanges();x.addRange(r);b.textContent='Selected, press Ctrl+C'}}
b.onclick=function(){{try{{navigator.clipboard.writeText(t).then(function(){{b.textContent='Copied';setTimeout(function(){{b.textContent='Copy post'}},2200)}},sel)}}catch(e){{sel()}}}}}})();</script>''')
```

Load the `artifact-design` skill before publishing (its page contract applies), publish with `icon: clipboard`, and do not paste the URL in the reply.

## Step 6. Save the reference and report

Write `claude/<topic-slug>.md` to the project with: source (brand, channels, hook line, how the payoff was gated), the steps table with time ranges and on-screen examples, where to get each thing (with plan limits and dates as verified), and the corrected transcript. The earlier doc `claude/first-ai-agent-five-steps.md` is the model. The queue log entry is not this skill's job; the scheduling routine writes it when the post is booked.

Reply shape, in this order:
1. One line: the post card is published, the frames and storyboard are sent, the doc is saved.
2. If his description and the reel differ, say what the reel actually is and that the queue was checked for both.
3. A small table: section, time range, what is on screen.
4. "Where to find it": the ungated file, then one line per tool with the feature that maps to the steps and its plan limit.
5. Notes on the post: which hook device was kept, that the creator is not named with the credit line he can add, and the one fact of his own that would strengthen it.
6. One offer: run the board and scheduling routine on it (next free slot).
7. Sources.

## Lessons

- Ask what the reel is before trusting the title or the request; "five secret skills" turned out to be "five steps" and a different reel from the one already in the project.
- 1 fps frames are enough to understand a reel and wrong for transcribing it; the 4 fps caption OCR is the transcript.
- Frames at the start of a section are fades; take them a few tenths of a second in, and re-grab typing animations once the line has finished.
- Everything gated behind "comment X" was published free on the creator's site; look there before saying it is unavailable.
- Vendor features move: verify Projects, GPTs, Gems or Skills on the vendor's help page on the day, and date the claim in the doc.
- Token budget: five contact sheets plus one keysheet and one storyboard is the whole image spend for a 77 s reel; do not read the 1 fps frames individually.
