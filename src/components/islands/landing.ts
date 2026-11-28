/* The two audience landing pages (owner request, 18 November 2026, L-83: "a modern, awwwards-worthy landing page … GSAP
   and/or Three.js"; the owner chose a hand-written shader over Three.js so the page stays inside the 100 KB budget).
   Two things live here:
   1. The hero's field (components/landing/landing-hero.astro): a WebGL fragment shader that draws the site's idea, two
      users and the handoff between them. Two bodies of light (cyan, the person; blue, the agent acting for them) drift in a
      warped flow, joined by a ribbon of light that bends with it; around the agent, and along the ribbon as it nears the
      agent, a fine lattice of points lights up (the structure an agent reads); they draw closer as the hero scrolls away, and a soft halo
      follows the pointer. Its rules:
      - Live only with motion on (html[data-motion="on"]). In fade mode (a person's browser asking for reduced motion) it
        draws one still frame, which fades in and never moves. The automated checks (no data-motion) and a browser without
        WebGL keep the CSS picture under the canvas, which has the same composition.
      - Started after the load event, on an idle moment: never on the path to the first or the largest paint.
      - Nothing moves for more than five seconds unless the visitor is interacting (CLAUDE.md 2.7): the flow slows to a stop
        five seconds after the last pointer move, scroll or key, and the loop ends; any of those wakes it.
      - Stops while the hero is off screen or the tab is hidden; drawn at half the device's pixels (the field is soft), at
        most two device pixels per CSS pixel.
      - Colours are read from the theme's tokens (--lp-a, --lp-b on the field), again when the theme changes, so no colour
        is written here. The canvas is transparent where the light is not (premultiplied alpha), so the page's own surface
        and grid show through; the strength (--lp-gain, the most the light covers) is set by measurement so the hero's
        text keeps its contrast.
   2. Figures that count up once as they come into view ([data-count] in landing-figures.astro): the final number is in the
      markup and in a visually hidden copy for screen readers; the counting copy is aria-hidden. Motion on only. */
const root = document.documentElement;
const on = () => root.dataset.motion === 'on';

/* ---------- 1. The field ---------- */
const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `precision mediump float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uPtr;uniform float uPtrOn;uniform float uScroll;uniform float uWide;
uniform vec3 uA;uniform vec3 uB;uniform float uGain;uniform vec4 uR[20];uniform float uN;uniform float uFloor;uniform float uSoft;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
void main(){
  float s=min(uRes.x,uRes.y);vec2 p=(gl_FragCoord.xy-.5*uRes)/s;float asp=uRes.x/uRes.y;float t=uTime;
  vec2 ua=mix(vec2(.90,.80),vec2(.79,.74),uWide);vec2 ub=mix(vec2(.62,.97),vec2(.95,.38),uWide);
  vec2 a=(ua*uRes-.5*uRes)/s;vec2 b=(ub*uRes-.5*uRes)/s;vec2 m=.5*(a+b);
  a=mix(a,m,uScroll*.7)+.05*vec2(sin(t*.7),cos(t*.9));b=mix(b,m,uScroll*.7)+.05*vec2(cos(t*.6+1.),sin(t*.8+2.));
  vec2 q=p*1.7;vec2 w=vec2(fbm(q+vec2(0.,t*.12)),fbm(q+vec2(5.2,1.3)-t*.1));float flow=fbm(q+2.2*w+.3*t);
  vec2 da=p-a,db=p-b;float ga=exp(-dot(da,da)*34.)+exp(-dot(da,da)*7.)*.3;float gb=exp(-dot(db,db)*34.)+exp(-dot(db,db)*7.)*.3;
  float d=seg(p+(w-.5)*.2,a,b);float rib=exp(-d*d*900.)*.9+exp(-d*d*60.)*.25;
  float h=clamp(dot(p-a,b-a)/dot(b-a,b-a),0.,1.);
  vec2 pt=(uPtr*uRes-.5*uRes)/s;vec2 dp=p-pt;float gp=uPtrOn*exp(-dot(dp,dp)*26.);
  float fl=smoothstep(.5,.95,flow)*.35;
  vec2 g=fract(gl_FragCoord.xy/12.)-.5;float lat=smoothstep(.2,.07,length(g))*clamp(exp(-dot(db,db)*20.)*1.8+rib*h*.9,0.,1.)*.8;
  float sum=ga+gb+rib+gp*.5+fl*.35+lat*1.6;
  vec3 tint=uA*ga+uB*gb+mix(uA,uB,h)*rib+mix(uA,uB,.5)*gp*.5+mix(uB,uA,flow)*fl*.35+uB*lat*1.6;
  float amt=clamp(sum*uGain,0.,uGain);
  float keep=1.;for(int i=0;i<20;i++){if(float(i)>=uN)break;vec4 r=uR[i];vec2 e=abs(gl_FragCoord.xy-r.xy)-r.zw;float dd=length(max(e,0.))+min(max(e.x,e.y),0.);keep=min(keep,smoothstep(0.,uSoft,dd));}
  amt=mix(min(amt,uFloor),amt,keep);
  amt=clamp(amt+(hash(gl_FragCoord.xy+fract(t))-.5)/255.,0.,1.);
  gl_FragColor=vec4(tint/max(sum,.001)*amt,amt);
}`;

function rgb(value: string): [number, number, number] | null {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) { const h = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1]; return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]; }
  const m = v.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i);
  return m ? [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255] : null;
}

function field(host: HTMLElement, still = false) {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas');
  const hero = host.closest<HTMLElement>('[data-lp-hero]') ?? host;
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;
  const shader = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = { res: u('uRes'), time: u('uTime'), ptr: u('uPtr'), ptrOn: u('uPtrOn'), scroll: u('uScroll'), wide: u('uWide'), a: u('uA'), b: u('uB'), gain: u('uGain'), rects: u('uR'), count: u('uN'), floor: u('uFloor'), soft: u('uSoft') };

  /* The theme's colours and the measured strength, from the tokens on the field. */
  const colours = () => {
    const cs = getComputedStyle(host);
    const a = rgb(cs.getPropertyValue('--lp-a')), b = rgb(cs.getPropertyValue('--lp-b'));
    if (!a || !b) return false;
    gl.uniform3fv(U.a, a); gl.uniform3fv(U.b, b);
    gl.uniform1f(U.gain, Number(cs.getPropertyValue('--lp-gain')) || 0.4);
    gl.uniform1f(U.floor, Number(cs.getPropertyValue('--lp-floor')) || 0.08);
    return true;
  };
  if (!colours()) return;

  /* Where the hero's text is, in the canvas's pixels (origin at its foot): the light under each box is held to --lp-floor,
     with a soft edge 64 CSS px wide outside the padded box (wide enough that no box shows as a rectangle against the
     brightest glow; the canvas is drawn at half resolution, so the width is given in its pixels), so it flows around the words and every one keeps its contrast (L-83, measured by
     scripts/quality/check-landing-field.mjs, quality step 3e). The words are boxes of their own; a longer headline is one box. */
  const textBoxes = () => {
    const words = [...hero.querySelectorAll<HTMLElement>('.lp-word')];
    const rest = [...hero.querySelectorAll<HTMLElement>('.lp-kicker, .lp-hero-lead, .lp-hero-ctas > *, .lp-hero-aside dl > div, .lp-hero-aside li, .lp-hero-aside p')];
    const title = hero.querySelector<HTMLElement>('.lp-hero-title');
    const list = words.length + rest.length <= 20 ? [...words, ...rest] : [...(title ? [title] : []), ...rest].slice(0, 20);
    return list.map(el => el.getBoundingClientRect());
  };
  const rects = () => {
    const c = canvas.getBoundingClientRect(); if (!c.width) return;
    const k = canvas.width / c.width, pad = 10;
    const data = new Float32Array(80); let n = 0;
    for (const r of textBoxes()) { if (n >= 20 || !r.width) continue;
      data.set([(r.left + r.width / 2 - c.left) * k, canvas.height - (r.top + r.height / 2 - c.top) * k, (r.width / 2 + pad) * k, (r.height / 2 + pad) * k], n * 4); n++; }
    gl.uniform4fv(U.rects, data); gl.uniform1f(U.count, n); gl.uniform1f(U.soft, 64 * k);
  };
  let w = 0, h = 0;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 2) * 0.5;
    const nw = Math.max(1, Math.round(r.width * scale)), nh = Math.max(1, Math.round(r.height * scale));
    if (nw !== w || nh !== h) { w = nw; h = nh; canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(U.res, w, h); }
    gl.uniform1f(U.wide, r.width >= 900 && r.width / Math.max(1, r.height) > 1.15 ? 1 : 0);
    rects();
  };

  /* State: time runs at the flow's pace times its energy; energy falls to zero over the last of five quiet seconds. */
  const QUIET = 3500, STOP = 5000;
  let time = Math.random() * 40, energy = 1, lastInput = performance.now(), prev = 0, raf = 0, visible = true;
  const ptr = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6, on: 0, ton: 0 };
  let scroll = 0;

  let moved = false;
  const draw = () => {
    if (moved) { rects(); moved = false; }
    gl.uniform1f(U.time, time);
    gl.uniform2f(U.ptr, ptr.x, ptr.y); gl.uniform1f(U.ptrOn, ptr.on);
    gl.uniform1f(U.scroll, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now: number) => {
    const dt = Math.min(64, prev ? now - prev : 16); prev = now;
    const idle = now - lastInput;
    energy = idle < QUIET ? Math.min(1, energy + dt / 400) : Math.max(0, 1 - (idle - QUIET) / (STOP - QUIET));
    time += dt * 0.001 * 0.55 * energy;
    const k = 1 - Math.pow(0.001, dt / 1000);
    ptr.x += (ptr.tx - ptr.x) * k * 0.9; ptr.y += (ptr.ty - ptr.y) * k * 0.9; ptr.on += (ptr.ton - ptr.on) * k * 0.6;
    draw();
    if (energy > 0 && visible && !document.hidden) raf = requestAnimationFrame(frame); else { raf = 0; prev = 0; }
  };
  const wake = () => { lastInput = performance.now(); if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

  const progress = () => { const r = hero.getBoundingClientRect(); scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))); };
  /* Fade mode (reduced motion): one still frame, drawn again only when the size or the theme changes. */
  if (still) {
    new ResizeObserver(() => { colours(); size(); draw(); }).observe(canvas);
    new MutationObserver(() => { requestAnimationFrame(() => { colours(); draw(); }); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    size(); ptr.on = 0; draw(); host.dataset.ready = '';
    return;
  }
  hero.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    ptr.tx = (e.clientX - r.left) / r.width; ptr.ty = 1 - (e.clientY - r.top) / r.height; ptr.ton = e.pointerType === 'mouse' ? 1 : 0.6;
    wake();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { ptr.ton = 0; wake(); });
  hero.addEventListener('focusin', wake);
  addEventListener('scroll', () => { if (!visible) return; progress(); moved = true; wake(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); }).observe(hero);
  new ResizeObserver(() => { colours(); size(); draw(); }).observe(canvas);
  new MutationObserver(() => { requestAnimationFrame(() => { colours(); draw(); }); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; delete host.dataset.ready; });

  size(); progress(); draw();
  host.dataset.ready = '';
  /* The headline's words finish rising after the first view's animation; measure them again then. */
  setTimeout(() => { moved = true; if (!raf) draw(); }, 1600);
  /* And as soon as a word ends its rise and when the fonts have loaded, so the light is never held under where a word was
     (heuristic review and quality run of 28 November 2026, L-92: between a word's arrival and the 1.6 s measure, the field
     brightened under "your team." on /clients to 2.31 : 1). */
  hero.addEventListener('animationend', () => { moved = true; if (!raf) draw(); }); /* the words, the kicker and the foot (the index's numbers) all rise in */
  document.fonts?.ready.then(() => { moved = true; if (!raf) draw(); });
  raf = requestAnimationFrame(frame);
}

/* ---------- 2. Figures that count up ---------- */
function counters() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-count]')];
  if (!els.length) return;
  const fmt = new Intl.NumberFormat('en');
  const run = (el: HTMLElement) => {
    const to = Number(el.dataset.count), from = Number(el.dataset.from ?? 0); if (!Number.isFinite(to) || !Number.isFinite(from)) return;
    const start = performance.now(), dur = 1400;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt.format(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt.format(from);
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { io.unobserve(entry.target); run(entry.target as HTMLElement); } }), { rootMargin: '0px 0px -12% 0px' });
  /* Only a figure still below the screen counts; one already in view keeps its number (nothing in the first view hides). */
  els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) io.observe(el); });
}

if (on() || root.dataset.motion === 'fade') {
  const still = !on();
  const start = () => (self.requestIdleCallback || ((f: () => void) => setTimeout(f, 200)))(() => {
    document.querySelectorAll<HTMLElement>('[data-lp-field]').forEach(h => field(h, still));
  }, { timeout: 2000 });
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
  if (!still) counters();
}

export {};
