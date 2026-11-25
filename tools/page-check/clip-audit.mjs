// Finds text that is cut off. For every visible text line it compares the line's box with each
// ancestor that clips (overflow hidden or clip, clip-path inset) and reports lines that are partly cut.
// Lines fully outside a clip box (off-screen carousel slides) are not cut glyphs and are skipped.
// Line clamps and ellipses are intentional and listed apart, as "truncated".
//
// Run: node tools/page-check/clip-audit.mjs [--url=http://localhost:4321/] [--widths=375,768,1280,1440,1920]
//      [--themes=dark,light] [--settle=900] [--mid=120] [--json]
// Exit code 1 when any settled line is cut. Lines cut only mid-animation are listed but do not fail.
// Media is blocked (cdp.mjs), so the check never loads Rockstar material.

import { launch, openPage, parseArgs } from './cdp.mjs';

const args = parseArgs(process.argv.slice(2), { url: 'http://localhost:4321/', widths: '375,768,1280,1440,1920', themes: 'dark,light', settle: '900', mid: '120', tolerance: '1' });
const widths = String(args.widths).split(',').map(Number);
const themes = String(args.themes).split(',');

// Runs in the page. Returns cut and truncated lines in the current viewport, with a selector path.
const AUDIT = (tol) => `(() => {
  const tol = ${tol};
  const vh = innerHeight, vw = innerWidth;
  const path = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      let p = e.tagName.toLowerCase();
      const cls = [...e.classList].filter((c) => !c.startsWith('astro-')).slice(0, 2);
      if (cls.length) p += '.' + cls.join('.');
      parts.unshift(p);
    }
    return parts.join(' > ');
  };
  const hidden = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return true;
      if (cs.position === 'absolute' && e.offsetWidth <= 1 && e.offsetHeight <= 1) return true; // sr-only
    }
    return false;
  };
  const clipBox = (e, cs) => {
    const r = e.getBoundingClientRect();
    const bl = parseFloat(cs.borderLeftWidth), bt = parseFloat(cs.borderTopWidth);
    const box = { l: r.left + bl, t: r.top + bt, r: r.left + bl + e.clientWidth, b: r.top + bt + e.clientHeight };
    const ox = cs.overflowX, oy = cs.overflowY;
    const clipX = ox === 'hidden' || ox === 'clip', clipY = oy === 'hidden' || oy === 'clip';
    // clip-path: inset(t r b l) only; other shapes are skipped.
    const m = cs.clipPath.match(/^inset\\(([^)]*)\\)/);
    if (m) {
      const v = m[1].split(/\\s+round\\s+/)[0].trim().split(/\\s+/).map((x) => x.endsWith('%') ? x : parseFloat(x));
      const [t, rr = t, b = t, l = rr] = v;
      const px = (x, size) => typeof x === 'string' ? parseFloat(x) / 100 * size : x;
      return { box: { l: r.left + px(l, r.width), t: r.top + px(t, r.height), r: r.right - px(rr, r.width), b: r.bottom - px(b, r.height) }, clipX: true, clipY: true, why: 'clip-path' };
    }
    return clipX || clipY ? { box, clipX, clipY, why: 'overflow ' + ox + ' ' + oy } : null;
  };
  const cut = [], truncated = [];
  const ctx = document.createElement('canvas').getContext('2d');
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;letter-spacing:0';
  document.body.append(probe);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const seenTrunc = new Set();
  for (let n; (n = walker.nextNode());) {
    const el = n.parentElement;
    if (!el || el.closest('script,style,noscript,svg,canvas')) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw);
    if (!rects.length || hidden(el)) continue;
    // Layout boxes miss ink that spills past them (negative letter-spacing, tight leading), so measure
    // the real glyph ink with canvas and grow each line box by it: sideways by the overhang, and
    // vertically to the ink above and below the baseline.
    const ecs = getComputedStyle(el);
    // The computed 'font' shorthand is empty when font-variant-numeric or similar is set, and an empty
    // assignment is ignored (the last font would stay), so build it from the longhands.
    ctx.font = ecs.fontStyle + ' ' + ecs.fontWeight + ' ' + ecs.fontSize + ' ' + ecs.fontFamily;
    ctx.letterSpacing = ecs.letterSpacing === 'normal' ? '0px' : ecs.letterSpacing;
    const raw = n.data.trim();
    const text = ecs.textTransform === 'uppercase' ? raw.toUpperCase() : ecs.textTransform === 'lowercase' ? raw.toLowerCase() : raw;
    const m = ctx.measureText(text);
    // Sideways, the ink edge is the glyph's advance edge minus its side bearing. The layout box ends
    // letter-spacing past the last glyph's advance (inside it when the spacing is negative). Canvas
    // cannot set tabular figures, so the bearings come from canvas and are corrected by the advance
    // the page really uses, read from a hidden probe (tabular figures sit centred in a wider or
    // narrower advance).
    const ls = ecs.letterSpacing === 'normal' ? 0 : parseFloat(ecs.letterSpacing);
    const bearings = (ch) => {
      ctx.letterSpacing = '0px';
      const g = ctx.measureText(ch);
      probe.style.font = ''; probe.style.fontStyle = ecs.fontStyle; probe.style.fontWeight = ecs.fontWeight; probe.style.fontSize = ecs.fontSize;
      probe.style.fontFamily = ecs.fontFamily; probe.style.fontVariantNumeric = ecs.fontVariantNumeric;
      probe.style.fontFeatureSettings = ecs.fontFeatureSettings; probe.style.fontVariationSettings = ecs.fontVariationSettings;
      probe.textContent = ch;
      const adj = (probe.getBoundingClientRect().width - g.width) / 2;
      return { lsb: -g.actualBoundingBoxLeft + adj, rsb: g.width - g.actualBoundingBoxRight + adj };
    };
    const first = bearings([...text][0]), last = bearings([...text].at(-1));
    const inks = rects.map((r) => {
      const base = r.top + m.fontBoundingBoxAscent * (r.height / (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent));
      return { left: r.left + first.lsb, right: r.right - ls - last.rsb, top: base - m.actualBoundingBoxAscent, bottom: base + m.actualBoundingBoxDescent };
    });
    let scrolled = false; // a scroll container between the text and the clip pans it, like a transform
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.webkitLineClamp !== 'none' && a.scrollHeight > a.clientHeight + tol || cs.textOverflow === 'ellipsis' && a.scrollWidth > a.clientWidth + tol) {
        if (!seenTrunc.has(a)) { seenTrunc.add(a); truncated.push({ where: path(a), text: a.textContent.trim().slice(0, 60) }); }
        break;
      }
      // overflow-x: hidden alone turns overflow-y into auto; that element still clips sideways, so only an
      // element that clips on neither axis counts as a scroll container.
      const clips = (o) => o === 'hidden' || o === 'clip';
      if (!clips(cs.overflowX) && !clips(cs.overflowY) && /auto|scroll/.test(cs.overflowX + cs.overflowY)) { scrolled = true; continue; }
      const c = clipBox(a, cs);
      if (!c) continue;
      // A stage that pans content through the screen (a transform between the text and the clip, like the
      // GTAverse rail) cuts items at the screen edge on purpose. Only then is a clip edge on the screen
      // edge ignored; plain overflow at the screen edge (a long word on a phone) still counts.
      let panned = scrolled;
      for (let e = el; e && e !== a; e = e.parentElement) {
        const ts = getComputedStyle(e);
        if (ts.transform !== 'none' || ts.translate !== 'none') { panned = true; break; }
      }
      const edge = (v, at) => panned && Math.abs(v - at) <= 1;
      const b = c.box;
      for (const r of inks) {
        const outside = r.right <= b.l || r.left >= b.r || r.bottom <= b.t || r.top >= b.b;
        if (outside) continue;
        const dx = c.clipX ? Math.max(edge(b.l, 0) ? 0 : b.l - r.left, edge(b.r, vw) ? 0 : r.right - b.r, 0) : 0;
        const dy = c.clipY ? Math.max(edge(b.t, 0) ? 0 : b.t - r.top, edge(b.b, vh) ? 0 : r.bottom - b.b, 0) : 0;
        if (dx > tol || dy > tol) {
          cut.push({ where: path(el), clippedBy: path(a), why: c.why, text: n.data.trim().slice(0, 60), px: { x: Math.round(dx * 10) / 10, y: Math.round(dy * 10) / 10 } });
          break;
        }
      }
    }
  }
  probe.remove();
  return { cut, truncated };
})()`;

const browser = await launch();
const settled = new Map(), mid = new Map(), truncated = new Map();
const key = (h) => `${h.where} | ${h.text}`;
try {
  for (const theme of themes) {
    for (const width of widths) {
      const height = width < 768 ? 812 : width < 1280 ? 1024 : 900;
      const page = await openPage(browser, { width, height });
      const u = new URL(args.url);
      u.searchParams.set('theme', theme);
      await page.goto(u.href);
      const total = await page.evaluate('document.documentElement.scrollHeight');
      const step = Math.round(height * 0.6);
      for (let y = 0; y < total; y += step) {
        await page.evaluate(`scrollTo(0, ${y})`);
        await page.sleep(Number(args.mid));
        for (const h of (await page.evaluate(AUDIT(args.tolerance))).cut) mid.set(key(h), { ...h, at: `${theme} ${width}px y=${y}` });
        await page.sleep(Number(args.settle));
        const r = await page.evaluate(AUDIT(args.tolerance));
        for (const h of r.cut) if (!settled.has(key(h))) settled.set(key(h), { ...h, at: `${theme} ${width}px y=${y}` });
        for (const h of r.truncated) truncated.set(key(h), { ...h, at: `${theme} ${width}px y=${y}` });
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}
for (const k of settled.keys()) mid.delete(k);

if (args.json) {
  console.log(JSON.stringify({ cut: [...settled.values()], cutMidAnimation: [...mid.values()], truncated: [...truncated.values()] }, null, 2));
} else {
  const print = (title, list, fmt) => {
    console.log(`\n${title}: ${list.length}`);
    for (const h of list) console.log('  ' + fmt(h));
  };
  print('CUT (settled)', [...settled.values()], (h) => `"${h.text}"  ${h.where}\n      clipped by ${h.clippedBy} (${h.why}) by x ${h.px.x}px y ${h.px.y}px  [${h.at}]`);
  print('Cut only mid-animation', [...mid.values()], (h) => `"${h.text}"  ${h.where}  by x ${h.px.x}px y ${h.px.y}px  [${h.at}]`);
  print('Truncated on purpose (clamp or ellipsis)', [...truncated.values()], (h) => `"${h.text}"  ${h.where}  [${h.at}]`);
}
process.exit(settled.size ? 1 : 0);
