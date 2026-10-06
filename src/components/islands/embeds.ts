/* Click-to-load embeds (YouTube, LinkedIn post). States on the figure: facade -> loading -> loaded, or failed.
   A cross-origin iframe cannot report an error, so "failed" means the browser is offline or the frame did not finish
   loading within the time limit. The link to the original is always on the page as the fallback. */
const TIMEOUT = 12000;

document.querySelectorAll<HTMLElement>('[data-embed]:not([data-static])').forEach(figure => {
  const src = figure.dataset.embedSrc, frame = figure.querySelector<HTMLElement>('.embed-frame');
  if (!src || !frame) return;
  const status = figure.querySelector<HTMLElement>('.embed-status');
  const say = (text: string) => { if (status) status.textContent = text; };
  let timer = 0;
  const fail = () => {
    clearTimeout(timer);
    frame.querySelector('iframe')?.remove();
    figure.dataset.state = 'failed'; say('');
    (figure.querySelector<HTMLElement>('[data-embed-retry]') || figure.querySelector<HTMLElement>('[data-embed-load]'))?.focus();
  };
  const load = () => {
    clearTimeout(timer);
    frame.querySelector('iframe')?.remove();
    figure.dataset.state = 'loading'; say(figure.dataset.embedLoading || 'Loading');
    if (navigator.onLine === false) { fail(); return; }
    const iframe = document.createElement('iframe');
    iframe.title = figure.dataset.embedTitle || 'Embedded content';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture'; iframe.allowFullscreen = true;
    iframe.addEventListener('load', () => { if (figure.dataset.state !== 'loading') return; clearTimeout(timer); figure.dataset.state = 'loaded'; say(''); iframe.focus(); });
    iframe.src = src;
    timer = window.setTimeout(() => { if (figure.dataset.state === 'loading') fail(); }, TIMEOUT);
    frame.appendChild(iframe);
    /* The control that was pressed is hidden while loading, so keyboard focus moves to the frame instead of being lost. */
    frame.tabIndex = -1; frame.focus({ preventScroll: true });
  };
  figure.querySelector('[data-embed-load]')?.addEventListener('click', load);
  figure.querySelector('[data-embed-retry]')?.addEventListener('click', load);
});
