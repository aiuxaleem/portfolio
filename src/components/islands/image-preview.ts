/* The image preview (ui/image-preview.astro; owner request, 9 November 2026, L-60). A click on a picture marked data-preview
   (a link to its full file) opens the page's dialog with the picture it shows at once and the full file as soon as it
   arrives, fitted to the stage. Zoom in, zoom out and fit change the picture's size in steps (fit, then 150, 200, 300 and
   400 per cent of the fitted size), keeping the point in the middle of the view where it was; the stage scrolls, and drags
   with a mouse or pen, when the picture is larger than it. Keys: + and = zoom in, - zooms out, 0 fits, Escape closes (the
   native dialog); a double click zooms in at that point or fits again. Focus moves to Close and returns to the opener.
   Without JavaScript the link opens the file. Snapshot pages open it themselves (the certificates on Home, page-behaviours.ts)
   through openImagePreview. States: loading (the smaller copy shown, a note), open, zoomed, error (the smaller copy kept). */
const STEPS = [1, 1.5, 2, 3, 4];
export interface PreviewRequest { full: string; thumb?: string; alt: string; caption?: string; opener?: HTMLElement | null }
let api: ((p: PreviewRequest) => void) | null = null;

const dialog = document.querySelector<HTMLDialogElement>('dialog[data-image-preview]');
if (dialog) {
  const frame = dialog.querySelector<HTMLElement>('.image-preview-frame')!;
  const stage = dialog.querySelector<HTMLElement>('.image-preview-stage')!;
  const img = dialog.querySelector<HTMLImageElement>('.image-preview-image')!;
  const caption = dialog.querySelector<HTMLElement>('.image-preview-caption')!;
  const level = dialog.querySelector<HTMLElement>('.image-preview-level')!;
  const status = dialog.querySelector<HTMLElement>('.image-preview-status')!;
  const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-close]')!;
  const zoomIn = dialog.querySelector<HTMLButtonElement>('[data-zoom="in"]')!;
  const zoomOut = dialog.querySelector<HTMLButtonElement>('[data-zoom="out"]')!;
  const fitBtn = dialog.querySelector<HTMLButtonElement>('[data-zoom="fit"]')!;
  let zoom = 1, opener: HTMLElement | null = null, natural = { w: 0, h: 0 }, pending: HTMLImageElement | null = null;

  /* The picture's size at "Fit": as large as the stage allows while whole. */
  const fitSize = () => {
    const sw = stage.clientWidth, sh = stage.clientHeight; const { w, h } = natural;
    if (!w || !h || !sw || !sh) return { w: sw, h: sh };
    const s = Math.min(sw / w, sh / h); return { w: w * s, h: h * s };
  };
  const layout = (focal?: { x: number; y: number }) => {
    const before = { w: img.offsetWidth || 1, h: img.offsetHeight || 1, sl: stage.scrollLeft, st: stage.scrollTop };
    const fit = fitSize(); const w = Math.round(fit.w * zoom), h = Math.round(fit.h * zoom);
    img.style.inlineSize = `${w}px`; img.style.blockSize = `${h}px`;
    level.textContent = zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= 1; fitBtn.disabled = zoom <= 1; zoomIn.disabled = zoom >= STEPS[STEPS.length - 1];
    if (frame.dataset.state !== 'loading' && frame.dataset.state !== 'error') frame.dataset.state = zoom > 1 ? 'zoomed' : 'open';
    /* The point under the pointer, or the middle of the view, stays where it was. */
    const fx = focal?.x ?? stage.clientWidth / 2, fy = focal?.y ?? stage.clientHeight / 2;
    stage.scrollLeft = (before.sl + fx) * (w / before.w) - fx;
    stage.scrollTop = (before.st + fy) * (h / before.h) - fy;
  };
  const setZoom = (z: number, focal?: { x: number; y: number }) => { zoom = Math.min(STEPS[STEPS.length - 1], Math.max(1, z)); layout(focal); };
  const step = (dir: 1 | -1) => { const i = Math.max(0, STEPS.indexOf(zoom)); setZoom(STEPS[Math.min(STEPS.length - 1, Math.max(0, i + dir))]); };

  const open = ({ full, thumb, alt, caption: words, opener: from }: PreviewRequest) => {
    opener = from || (document.activeElement as HTMLElement | null); zoom = 1; natural = { w: 0, h: 0 };
    caption.textContent = words || alt || 'Picture'; img.alt = alt || ''; img.removeAttribute('style');
    frame.dataset.state = 'loading'; status.textContent = 'Loading the full picture…';
    if (thumb) img.src = thumb; else img.removeAttribute('src');
    if (!dialog.open) dialog.showModal();
    closeBtn.focus();
    if (img.naturalWidth) { natural = { w: img.naturalWidth, h: img.naturalHeight }; layout(); }
    const loader = new Image(); pending = loader; loader.decoding = 'async';
    loader.onload = () => {
      if (pending !== loader) return;
      natural = { w: loader.naturalWidth, h: loader.naturalHeight }; img.src = full;
      frame.dataset.state = zoom > 1 ? 'zoomed' : 'open'; status.textContent = ''; layout();
    };
    loader.onerror = () => {
      if (pending !== loader) return;
      frame.dataset.state = 'error'; status.textContent = thumb ? 'The full picture could not be loaded. This is the smaller copy.' : 'The picture could not be loaded.';
      if (img.naturalWidth) { natural = { w: img.naturalWidth, h: img.naturalHeight }; layout(); }
    };
    loader.src = full;
  };
  api = open;

  /* Pictures placed in a post's or a case study's body (Markdown images) carry no link of their own: each becomes a preview
     link here, named after its alt text, so it opens from the pointer and the keyboard alike. Without JavaScript the
     picture shows as written. Cards, decks and pictures already in a link are left alone. */
  document.querySelectorAll<HTMLImageElement>('.prose img').forEach(pic => {
    if (pic.closest('a, button, .project-card, [data-stack-card]')) return;
    const link = document.createElement('a');
    link.className = 'image-preview-body-link'; link.href = pic.currentSrc || pic.src; link.dataset.preview = '';
    link.setAttribute('aria-label', `View larger: ${pic.alt || 'picture'}`);
    pic.replaceWith(link); link.append(pic);
  });

  document.addEventListener('click', e => {
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-preview]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const t = a.querySelector('img');
    open({ full: a.href, thumb: t?.currentSrc || t?.src, alt: t?.alt || (a.getAttribute('aria-label') || '').replace(/^View larger: /, ''), caption: a.dataset.caption, opener: a });
  });
  zoomIn.addEventListener('click', () => step(1));
  zoomOut.addEventListener('click', () => step(-1));
  fitBtn.addEventListener('click', () => setZoom(1));
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=') { e.preventDefault(); step(1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); step(-1); }
    else if (e.key === '0') { e.preventDefault(); setZoom(1); }
  });
  img.addEventListener('dblclick', e => { const r = stage.getBoundingClientRect(); setZoom(zoom > 1 ? 1 : 2, { x: e.clientX - r.left, y: e.clientY - r.top }); });
  /* Drag to move around a zoomed picture with a mouse or pen; a finger scrolls the stage natively. */
  let drag: { x: number; y: number; sl: number; st: number } | null = null;
  stage.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' || zoom <= 1 || e.button !== 0) return; drag = { x: e.clientX, y: e.clientY, sl: stage.scrollLeft, st: stage.scrollTop }; stage.setPointerCapture(e.pointerId); stage.classList.add('is-dragging'); });
  stage.addEventListener('pointermove', e => { if (!drag) return; stage.scrollLeft = drag.sl - (e.clientX - drag.x); stage.scrollTop = drag.st - (e.clientY - drag.y); });
  const endDrag = () => { drag = null; stage.classList.remove('is-dragging'); };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  dialog.addEventListener('close', () => { pending = null; frame.dataset.state = 'closed'; img.removeAttribute('src'); img.removeAttribute('style'); opener?.focus(); });
  new ResizeObserver(() => { if (dialog.open) layout(); }).observe(stage);
}

/** Opens the preview from a script (a snapshot page's own buttons); without the dialog the file opens in a new tab. */
export function openImagePreview(p: PreviewRequest) { if (api) api(p); else if (p.full) window.open(p.full, '_blank', 'noopener'); }
