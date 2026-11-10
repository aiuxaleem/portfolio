---
name: colaberry-reel-studio
description: Produce Colaberry-branded 9:16 story-ad reels (Editorial Motion Graphics paper-collage style, cherry-red accent, multi-voice dialogue, burned captions, logo reveal) from any idea or verbatim script, using the Higgsfield MCP. Use this skill whenever the user asks for a Colaberry reel, ad, story video, "Reel N", a video from a script or idea, mentions the Michael/Ethan/Manager cast, the AI-learning-platform ads, or wants "the usual video pipeline" — even if they only paste a script with no other instructions. Also use it when they ask to recast characters, change a scene, or re-render any prior Colaberry reel.
---

# Colaberry Reel Studio

Turns an idea or a verbatim dialogue script into a finished, branded, captioned
9:16 ad reel in the locked Colaberry house style. Battle-tested pipeline:
character-consistent AI video (Higgsfield `gemini_omni`), per-line multi-voice
TTS (`seed_audio`), variable-length scene assembly, clean burned captions,
Topaz 1080p upscale, and the transparent Colaberry logo reveal on the CTA.

**Prerequisites:** Higgsfield MCP connected (with credits). A full reel costs
roughly 9-12 video generations + 15-20 audio takes + 1 upscale and takes
20-40 minutes wall-clock. Confirm with the user before spending.

## Read next (progressive)

- `references/design-system.md` — the locked visual style formula, prompt
  boilerplate (style block, palette lock, negative), shot grammar, caption
  style, default cast + voice palette, logo asset + overlay recipe.
  **Read before writing any image/video prompt.**
- `references/pipeline.md` — the full technical pipeline: phase-by-phase
  commands, block-packing math, audio assembly, the mega-filtergraph, caption
  invocation, upscale, checkpointing, sandbox-survival doctrine, and a
  troubleshooting table of every failure already hit and fixed.
  **Read before running any sandbox command.**
- `references/channel-dna.md` — the registry you fill with your own reusable
  asset IDs (characters, locations, props, style key) after the first run, and
  the casting descriptors to regenerate any of them. **Read before generating
  new assets — reuse beats regenerate.**
- `assets/logo.webp(.b64)` — your compressed transparent logo for the CTA
  reveal (base64 fits in one sandbox call). Not included: see `assets/README.md`.

## Operating principles (non-negotiable)

1. **Verbatim means verbatim.** If the user supplies dialogue, never rewrite,
   trim, or paraphrase a line to satisfy pacing rules. Change the *structure*
   (scene lengths, line-to-scene packing) instead. Ideas (not scripts) may be
   expanded into dialogue freely — then show the script for approval first.
2. **Variable-length scenes.** Scenes are 6-10s each, sized to their dialogue:
   pick window W per scene so speech extent E satisfies `W-1.4 <= E <= W`
   (see pipeline.md "Packing"). Total = sum of windows. Zero dead air.
3. **Character consistency = asset reuse.** Same character asset ID across all
   scenes and all future reels. Recasting = regenerate the character asset
   (same wardrobe/pose prompt, change only the casting descriptors), then
   re-shoot only the scenes that character appears in.
4. **Server truth for URLs.** Never retype media filenames or UUIDs from
   memory. Get URLs from `jobs_wait` results, and validate every input URL
   with a ranged GET (`curl -r 0-0`, expect 200/206) before heavy work.
5. **Checkpoint to cloud.** The Higgsfield sandbox recycles without warning
   and each `sandbox_exec` is capped at 120s. Structure work so every call
   ends with its artifact PUT to a presigned slot (then `media_confirm`).
   Anything not uploaded when a call returns may be lost.
6. **Default cast & voice palette** (user-editable, applied when the script
   doesn't specify): characters are American-accent English speakers; the
   default on-screen cast mixes Black and white characters and includes a
   woman in a leadership role (current house cast: Manager = white woman,
   Michael = white senior man, Ethan = young Black man). Honor any explicit
   casting the user gives; these are only the fill-in defaults.

## Phase map

Run phases in order. Details, exact params, and copy-paste command templates
for every phase live in `references/pipeline.md`.

0. **Intake** — Idea or script? Idea → draft verbatim-style dialogue script in
   the house voice, get approval. Script → confirm "verbatim" and target
   platform (default 9:16, Reels/Shorts).
1. **Pack** — Split dialogue into scenes; compute per-scene windows W from
   measured/estimated line durations; build the manifest (n, vo_line,
   location, 5-shot list, assets per scene).
2. **Assets** — Reuse channel DNA. Generate only missing characters/locations/
   props/style-key (seedream_v5_pro, prompts in design-system.md).
3. **Video** — One `generate_video_batch`: per-scene 5-hard-cut prompts using
   the style boilerplate + `@ImageN` references. gemini_omni, 720p, 9:16, 10s.
   Retry with `declined_preset_id` if the preset interceptor fires.
4. **Audio** — One line = one `seed_audio` take with the right voice preset
   and delivery bracket. Batch max 12 per call; 429 → wait and retry.
5. **Collect** — `jobs_wait` for all IDs → authoritative result URLs.
6. **Assemble** — One self-contained sandbox call: validate URLs → build
   per-scene voice tracks (0.5s lead, 0.35s gaps, 0.9s pre-CTA gap, 48k mono
   pcm) → mega-filtergraph (trim clips to W, center speech, duck scene SFX to
   0.12, concat, loudnorm -16) → PUT 720p master → confirm.
7. **Captions** — Second sandbox call: pull master, rebuild voice tracks,
   write timing sidecar, `audio_to_captions.py` + `burn_caps_clean.sh`,
   AV-sync gate (|v-a| <= 0.25s) → PUT captioned master → confirm.
8. **Upscale** — `upscale_video` (topaz, 1080p, params nested under `params`),
   poll with `jobs_wait` (timeout <= 15, may queue several minutes).
9. **Brand** — One sandbox call: logo overlay (two-layer soft shadow, slide-in
   `y=150+240*exp(-10*(t-T))` where T = CTA voice start) → PUT final →
   confirm. Extract a cover frame near the end if asked.
10. **Deliver** — Post both links (upload.higgsfield.ai/<user>/<id>.mp4),
    list what was produced, note scene structure and total runtime.

## Quality gates (all must pass before delivery)

- Every input URL validated 200/206 before assembly.
- Per-scene speech extent within `[W-1.4, W]` (by construction in Pack).
- Caption transcript spot-check matches vo_lines (whisper similarity >= 0.9
  when the verify path is used).
- AV duration delta <= 0.25s on the captioned master.
- Final duration = sum of windows (+/- 0.05s).
- Logo appears only during the CTA line; nothing overlaps captions' safe area.

## Recasting / edits to an existing reel

Character swap: regenerate the character asset (identical prompt, new casting
descriptors) → re-shoot only scenes listing that asset in `assets_used` →
re-run phases 6-9 with the new clips substituted. Voice edits: regenerate only
the affected line takes and re-run 6-9. Never re-generate untouched scenes.
