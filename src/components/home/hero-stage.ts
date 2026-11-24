// The hero stage: three background modes (trailer, key art, line art) that rotate on their own, with the active
// circle's ring as the timer. Choosing a circle jumps to that mode and stops the rotation (choosing it again resumes).
// Loading rules: the trailer video loads only after the page has loaded and while the hero is on screen; reduced
// motion, Save-Data and slow connections keep the poster; everything pauses when the tab is hidden or the hero has
// scrolled away. The line art module and the key art images load just before they are needed.
import type { LineArt } from './line-art';

type Mode = 'trailer' | 'keyart' | 'line';
type NetInfo = { saveData?: boolean; effectiveType?: string };

const LINE_SECONDS = 10;

// A pausable countdown that drives both the ring and the rotation.
class Countdown {
  private left = 0;
  private started = 0;
  private id = 0;
  private running = false;
  constructor(private done: () => void) {}
  start(ms: number) {
    this.stop();
    this.left = ms;
    this.resume();
  }
  resume() {
    if (this.running || this.left <= 0) return;
    this.running = true;
    this.started = performance.now();
    this.id = window.setTimeout(() => {
      this.running = false;
      this.left = 0;
      this.done();
    }, this.left);
  }
  pause() {
    if (!this.running) return;
    clearTimeout(this.id);
    this.running = false;
    this.left -= performance.now() - this.started;
  }
  stop() {
    clearTimeout(this.id);
    this.running = false;
    this.left = 0;
  }
}

export function initStage(hero: HTMLElement) {
  const found = hero.querySelector<HTMLElement>('[data-stage]');
  if (!found) return;
  const stage: HTMLElement = found;
  const buttons = [...hero.querySelectorAll<HTMLButtonElement>('[data-mode-btn]')];
  const modesEl = hero.querySelector<HTMLElement>('[data-modes]');
  const layers = new Map([...stage.querySelectorAll<HTMLElement>('[data-layer]')].map((l) => [l.dataset.layer as Mode, l]));
  const modes = (buttons.length ? buttons.map((b) => b.dataset.modeBtn) : ['line']) as Mode[];
  const credit = hero.querySelector<HTMLElement>('[data-credit]');
  const credits = JSON.parse(credit?.dataset.credits ?? '{}') as Record<Mode, string>;
  const video = stage.querySelector<HTMLVideoElement>('[data-video]');
  const trailerLayer = layers.get('trailer');
  const arts = [...stage.querySelectorAll<HTMLElement>('[data-art]')];
  const canvas = stage.querySelector<HTMLCanvasElement>('[data-line]');
  const soundBtn = hero.querySelector<HTMLButtonElement>('[data-sound-btn]');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const net = (navigator as Navigator & { connection?: NetInfo }).connection;
  const lite = Boolean(net?.saveData) || /(^|-)2g$|^3g$/.test(net?.effectiveType ?? '');
  const videoAllowed = Boolean(video) && !reduce && !lite;

  const seconds: Record<Mode, number> = {
    trailer: Number(stage.dataset.trailerSeconds) || 9,
    keyart: Number(stage.dataset.keyartSeconds) || 8,
    line: LINE_SECONDS,
  };

  let mode: Mode = modes[0];
  let pinned = reduce; // reduced motion: no rotation, the visitor picks
  let onScreen = true;
  let pageLoaded = document.readyState === 'complete';
  let videoState: 'idle' | 'loading' | 'playing' = 'idle';
  let artIndex = -1;
  let shotIndex = -1;
  let lineArt: LineArt | null = null;
  let lineArtLoading: Promise<LineArt | null> | null = null;
  let lineIdle = true; // the line art has been away and its shot should start over
  let ringAnim: Animation | null = null;
  let waitForVideo = 0;
  let soundOn = false;
  let audio: HTMLAudioElement | null = null;

  const active = () => onScreen && !document.hidden;
  const next = () => modes[(modes.indexOf(mode) + 1) % modes.length];

  // ---------------------------------------------------------------- ring
  const ringOf = (m: Mode) => buttons.find((b) => b.dataset.modeBtn === m)?.querySelector<SVGCircleElement>('[data-ring]') ?? null;
  // When it ends: the next mode, or (for a chosen mode) the next image or shot within it.
  const countdown = new Countdown(() => (pinned || modes.length === 1 ? go(mode, { step: true }) : go(next())));
  function startRing(ms: number) {
    ringAnim?.cancel();
    ringAnim = null;
    const ring = ringOf(mode);
    if (ring && typeof ring.animate === 'function') {
      ringAnim = ring.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, easing: 'linear', fill: 'forwards' });
      if (!active()) ringAnim.pause();
    }
    countdown.start(ms);
    if (!active()) countdown.pause();
  }
  function stopRing() {
    ringAnim?.cancel();
    ringAnim = null;
    countdown.stop();
    clearTimeout(waitForVideo);
  }

  // ---------------------------------------------------------------- trailer
  function loadVideo() {
    if (!video || !videoAllowed || videoState !== 'idle' || !pageLoaded || !onScreen) return;
    videoState = 'loading';
    const portrait = matchMedia('(max-width: 767px)').matches; // the phone layout, as the posters
    const src = JSON.parse((portrait ? video.dataset.portrait : video.dataset.landscape) ?? '{}') as { webm: string; type: string; mp4: string };
    for (const [url, type] of [[src.webm, src.type], [src.mp4, 'video/mp4']]) {
      const s = document.createElement('source');
      s.src = url;
      s.type = type;
      video.append(s);
    }
    video.preload = 'auto';
    video.addEventListener('playing', () => {
      videoState = 'playing';
      trailerLayer?.classList.add('is-playing');
      syncSound();
    });
    video.load();
    if (mode === 'trailer' && active()) void video.play().catch(() => {});
  }
  function enterTrailer(rewind: boolean) {
    if (!video || !videoAllowed) return startTimer();
    if (videoState === 'idle') loadVideo();
    if (rewind) {
      try {
        video.currentTime = 0;
      } catch {
        /* not seekable yet */
      }
    }
    if (active()) void video.play().catch(() => {});
    if (videoState === 'playing') return startTimer();
    // First play: the ring waits for the reel to start (or 2.5 s at most) so the two stay together.
    const begin = () => {
      clearTimeout(waitForVideo);
      video.removeEventListener('playing', begin);
      if (mode === 'trailer') startTimer();
    };
    video.addEventListener('playing', begin);
    waitForVideo = window.setTimeout(begin, 2500);
  }

  // ---------------------------------------------------------------- sound
  function syncSound() {
    const show = mode === 'trailer' && videoState === 'playing';
    if (soundBtn) soundBtn.hidden = !show;
    if (!audio) return;
    if (show && soundOn && active()) void audio.play().catch(() => {});
    else audio.pause();
  }
  soundBtn?.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn && !audio && stage.dataset.sound) {
      audio = new Audio(stage.dataset.sound);
      audio.loop = true;
      audio.preload = 'auto';
    }
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.setAttribute('aria-label', soundOn ? 'Turn the trailer sound off' : 'Turn the trailer sound on');
    syncSound();
  });

  // ---------------------------------------------------------------- key art
  function loadArt(i: number) {
    const pic = arts[i];
    if (!pic || pic.dataset.loaded) return;
    pic.dataset.loaded = 'true';
    pic.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((s) => (s.srcset = s.dataset.srcset!));
    const img = pic.querySelector<HTMLImageElement>('img[data-src]');
    if (img) img.src = img.dataset.src!;
  }
  function showArt(step: boolean) {
    if (!arts.length) return;
    if (step || artIndex < 0) artIndex = (artIndex + 1) % arts.length;
    loadArt(artIndex);
    arts.forEach((a, k) => {
      a.classList.toggle('is-active', k === artIndex);
      // Restart the push in on the image that is coming up.
      if (k === artIndex && !reduce) {
        const img = a.querySelector('img');
        if (img) {
          img.style.animation = 'none';
          void img.offsetWidth;
          img.style.animation = '';
        }
      }
    });
    loadArt((artIndex + 1) % arts.length);
  }

  // ---------------------------------------------------------------- line art
  async function getLineArt() {
    if (lineArt || !canvas) return lineArt;
    lineArtLoading ??= (async () => {
      const { createLineArt } = await import('./line-art');
      let coast = null;
      if (stage.dataset.coast) {
        try {
          const res = await fetch(stage.dataset.coast);
          if (res.ok) coast = await res.json();
        } catch {
          /* draw the other shots */
        }
      }
      lineArt = createLineArt(canvas, coast);
      return lineArt;
    })();
    return lineArtLoading;
  }
  async function showLine(step: boolean) {
    const la = await getLineArt();
    if (!la || mode !== 'line') return;
    const fresh = step || shotIndex < 0;
    if (fresh) shotIndex = (shotIndex + 1) % la.shots.length;
    if (fresh || lineIdle) la.show(shotIndex, reduce);
    lineIdle = false;
    if (credit) credit.textContent = la.shots[shotIndex].credit;
    if (active()) la.play();
  }

  // ---------------------------------------------------------------- modes
  function startTimer() {
    if (pinned) {
      // A chosen mode keeps living: key art and line art move on to their next image or shot.
      if (mode !== 'trailer' && !reduce) countdown.start(seconds[mode] * 1000);
      if (!active()) countdown.pause();
      return;
    }
    startRing(seconds[mode] * 1000);
  }

  function go(to: Mode, opts: { instant?: boolean; step?: boolean; keep?: boolean } = {}) {
    const from = mode;
    mode = to;
    stopRing();
    if (!opts.step && !opts.keep) {
      hero.dataset.mode = to;
      stage.classList.toggle('is-instant', Boolean(opts.instant));
      layers.forEach((l, m) => l.classList.toggle('is-active', m === to));
      if (opts.instant) requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('is-instant')));
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modeBtn === to)));
      if (credit && to !== 'line') credit.textContent = credits[to] ?? '';
    }
    if (from === 'trailer' && to !== 'trailer') video?.pause();
    if (from === 'line' && to !== 'line') {
      lineArt?.pause();
      lineIdle = true;
    }
    syncSound();

    // Returning to a mode, or stepping within it, moves to its next image or shot; keep holds the current one.
    const advance = !opts.keep && (from !== to || Boolean(opts.step));
    if (to === 'trailer') enterTrailer(from !== 'trailer');
    else if (to === 'keyart') {
      showArt(advance);
      startTimer();
    } else {
      void showLine(advance);
      startTimer();
    }
    // Get the next mode ready while this one plays.
    if (!pinned) {
      if (next() === 'line') void getLineArt();
      if (next() === 'keyart') loadArt((artIndex + 1) % Math.max(arts.length, 1));
    }
  }

  buttons.forEach((b) =>
    b.addEventListener('click', (e) => {
      const to = b.dataset.modeBtn as Mode;
      // Keyboard activation (detail 0) switches without animation.
      const instant = (e as MouseEvent).detail === 0;
      if (to === mode && pinned && !reduce) {
        // Choosing the chosen mode again resumes the rotation from it.
        pinned = false;
        delete modesEl?.dataset.pinned;
        go(to, { instant, keep: true });
        return;
      }
      const wasPinned = pinned;
      pinned = true;
      if (modesEl) modesEl.dataset.pinned = '';
      // Pinning the mode already showing keeps its current image or shot.
      go(to, { instant, keep: to === mode && !wasPinned });
    }),
  );

  // ---------------------------------------------------------------- pause and resume
  function pauseAll() {
    countdown.pause();
    ringAnim?.pause();
    video?.pause();
    audio?.pause();
    lineArt?.pause();
  }
  function resumeAll() {
    countdown.resume();
    ringAnim?.play();
    if (mode === 'trailer' && video && videoState !== 'idle') void video.play().catch(() => {});
    if (mode === 'line') lineArt?.play();
    syncSound();
    loadVideo();
  }
  const update = () => (active() ? resumeAll() : pauseAll());
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    }, { threshold: 0.15 }).observe(stage);
  }
  if (!pageLoaded) {
    window.addEventListener('load', () => {
      pageLoaded = true;
      loadVideo();
    }, { once: true });
  }

  if (pinned && modesEl) modesEl.dataset.pinned = '';
  go(mode, { instant: true });
}
