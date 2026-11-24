// The 3D map (docs/MAP-3D.md): the official map's tiles draped over our hand-drawn relief, with light, a water
// depth feel and pins as 3D markers at the same image pixels as the 2D map. Plain Three.js, loaded only when the
// visitor opens 3D (MapApp lazy-loads Map3D.tsx, which imports this file).
//
// World units: x and z are image pixels (x right, z down the image, so north is -z); y is height, also in image pixels.
// Terrain: a quadtree of the 512 px tile pyramid from zoom 3 (12 tiles) to zoom 5 (full resolution). Every chunk
// samples the same 32 px grid and the same height function, so neighbouring chunks at different levels share their
// edge vertices exactly and never crack. A chunk is refined when one of its texels would cover more than ~1.25 device
// pixels on screen, and children replace their parent only once all four have loaded.
// Rendering is on demand: a frame is drawn only when the camera, a tile, a pin or the theme changed.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { heightAt, maxHeight } from './relief';
import { icons, type IconName } from '../../ui/icons';
import type { MapMeta } from '../types';

export type Pin3D = { slug: string; x: number; y: number; icon: IconName; title: string };
export type Theme3D = { background: string; ground: string; accent: string; onAccent: string; inverseFill: string; inverseText: string; muted: boolean };
export type View2D = { x: number; y: number; zoom: number };

const GRID = 32; // terrain vertex spacing in image pixels; tile edges are multiples of it
const ROOT_LEVEL = 3;
const FOV = 35;
const TILT_MAX = THREE.MathUtils.degToRad(62); // steepest view, from straight down
const TILT_OPEN = THREE.MathUtils.degToRad(50); // the tilt 3D opens at
const MAX_TEXTURES = 72; // cached tile textures (about 1.4 MB of GPU memory each with mipmaps)
const PIN_PX = 40; // pin sprite height in CSS px (head 30 + stem)

// --ease-in-out from src/styles/tokens.css, cubic-bezier(0.77, 0, 0.175, 1): movement on screen (map fly).
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
const easeInOut = bezier(0.77, 0, 0.175, 1);

const VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
void main() {
  vUv = uv;
  vN = normal;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// Light keeps flat ground at exactly the map's own colour (shade 1.0) and only shades slopes. Water is found by colour
// (a saturated cyan to blue hue), never from any data: it gets a deeper tint away from the shore (from a blurred mip
// of the same tile) and a view-dependent sheen, so the sea reads as depth when you tilt.
const FRAG = /* glsl */ `
uniform sampler2D map;
uniform float hasMap;
uniform vec3 ground;
uniform vec3 lightDir;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform float muted;
uniform float waterOn;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
float waterness(vec3 lin) {
  vec3 s = pow(max(lin, vec3(0.0)), vec3(1.0 / 2.2));
  float mx = max(s.r, max(s.g, s.b));
  float mn = min(s.r, min(s.g, s.b));
  float sat = mx > 0.0 ? (mx - mn) / mx : 0.0;
  float hue = step(s.r + 0.04, s.g) * step(s.r + 0.04, s.b);
  return hue * smoothstep(0.6, 0.78, sat) * smoothstep(0.3, 0.5, mx);
}
void main() {
  vec4 t = texture2D(map, vUv);
  vec3 base = mix(ground, t.rgb, hasMap * t.a);
  vec3 n = normalize(vN);
  float d = max(dot(n, lightDir), 0.0);
  float shade = clamp(0.55 + 0.45 * d / lightDir.y, 0.5, 1.22);
  vec3 col = base * shade;
  float water = waterOn * hasMap * t.a * waterness(base);
  if (water > 0.0) {
    vec3 far = texture2D(map, vUv, 4.0).rgb;
    float deep = waterness(far);
    vec3 V = normalize(cameraPosition - vW);
    float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
    vec3 H = normalize(V + lightDir);
    float spec = pow(max(H.y, 0.0), 220.0);
    vec3 w = base * mix(1.0, 0.8, deep) * vec3(0.94, 0.98, 1.0);
    w += vec3(0.75, 0.88, 1.0) * (fres * 0.16 + spec * 0.28);
    col = mix(col, w, water);
  }
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, mix(col, vec3(l), 0.8) * 0.62, muted);
  float f = smoothstep(fogNear, fogFar, distance(cameraPosition, vW));
  col = mix(col, fogColor, f * 0.8);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

type Node = {
  key: string;
  level: number;
  tx: number;
  ty: number;
  x0: number; y0: number; x1: number; y1: number; // image pixel bounds, clamped to the image
  span: number; // image pixels covered by the full tile
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> | null;
  texture: THREE.Texture | null;
  state: 'idle' | 'loading' | 'ready' | 'error';
  used: number;
  box: THREE.Box3;
};

export type SceneOptions = {
  canvas: HTMLCanvasElement;
  meta: MapMeta;
  theme: Theme3D;
  reduced: boolean;
  start: View2D | null;
  onPick: (slug: string | null) => void;
  onPickCollectible: (id: string) => void;
  onChange: () => void;
};

export type Collectible3D = { id: string; x: number; y: number };

export class MapScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: MapControls;
  readonly scene = new THREE.Scene();
  readonly stats = { frames: [] as number[], renderMs: [] as number[], draws: 0, tiles: 0 };
  private opts: SceneOptions;
  private meta: MapMeta;
  private nodes = new Map<string, Node>();
  private roots: Node[] = [];
  private terrain = new THREE.Group();
  private pins = new THREE.Group();
  // Collectible layers (content/collectibles.json): one Points draw for all items, plus one for the selected item.
  private cItems: (Collectible3D & { wx: number; wz: number })[] = [];
  private cPoints: THREE.Points | null = null;
  private cSelected: THREE.Points | null = null;
  private cSelectedId: string | null = null;
  private pinData = new Map<string, { pin: Pin3D; sprite: THREE.Sprite }>();
  private pinTex = new Map<string, THREE.Texture>();
  private iconImages = new Map<string, HTMLImageElement>();
  private selected: string | null = null;
  private hovered: string | null = null;
  private uniforms: { ground: THREE.Color; fogColor: THREE.Color; muted: number };
  private loader = new THREE.ImageBitmapLoader();
  private raf = 0;
  private dirty = true;
  private anim: { from: Record<string, number>; to: Record<string, number>; t0: number; ms: number; done?: () => void } | null = null;
  private lastFrame = 0;
  private frustum = new THREE.Frustum();
  private projScreen = new THREE.Matrix4();
  private maxAniso: number;
  private disposed = false;
  private ro: ResizeObserver;
  private theme: Theme3D;

  constructor(opts: SceneOptions) {
    this.opts = opts;
    this.meta = opts.meta;
    this.theme = opts.theme;
    const { canvas } = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 10, 60000);
    this.scene.add(this.terrain, this.pins);
    this.uniforms = { ground: new THREE.Color(opts.theme.ground), fogColor: new THREE.Color(opts.theme.background), muted: opts.theme.muted ? 1 : 0 };
    this.scene.background = this.uniforms.fogColor.clone();

    this.controls = new MapControls(this.camera, canvas);
    this.controls.enableDamping = !opts.reduced; // momentum after a drag; off for reduced motion
    this.controls.dampingFactor = 0.12;
    this.controls.zoomToCursor = true;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = TILT_MAX;
    this.controls.minDistance = 450;
    this.controls.maxDistance = this.fitDistance() * 1.35;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 1.1;
    this.controls.addEventListener('change', () => { this.clampTarget(); this.invalidate(); this.opts.onChange(); });
    this.controls.addEventListener('start', () => { this.anim = null; });

    this.buildRoots();
    this.place(opts.start);

    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointermove', this.onHover);
    canvas.addEventListener('pointerleave', this.onLeave);
    canvas.addEventListener('keydown', this.onKey);
    canvas.addEventListener('webglcontextlost', this.onLost);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------------------------------------------------------------- camera

  /** Distance from which the whole map frame fits the viewport, straight down. */
  private fitDistance() {
    const f = this.meta.frame;
    const aspect = Math.max(0.3, this.camera.aspect || 1);
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    return Math.max((f.y1 - f.y0) / (2 * t), (f.x1 - f.x0) / (2 * t * aspect)) * 1.04;
  }

  /** Camera distance that shows the map at the same scale as Leaflet zoom `z` (image pixel = 2^(z - maxZoom) CSS px). */
  private distanceForZoom(z: number) {
    const h = this.opts.canvas.clientHeight || 800;
    return h / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * 2 ** (z - this.meta.maxZoom));
  }
  private zoomForDistance(d: number) {
    const h = this.opts.canvas.clientHeight || 800;
    return this.meta.maxZoom + Math.log2(h / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * d));
  }

  private setOrbit(o: { x: number; z: number; dist: number; polar: number; azimuth: number }) {
    const c = this.controls;
    c.target.set(o.x, 0, o.z);
    const s = new THREE.Spherical(o.dist, Math.max(0.0001, o.polar), o.azimuth);
    this.camera.position.setFromSpherical(s).add(c.target);
    this.camera.lookAt(c.target);
    this.clampTarget();
    c.update();
    this.invalidate();
  }

  private orbit() {
    const c = this.controls;
    const off = this.camera.position.clone().sub(c.target);
    const s = new THREE.Spherical().setFromVector3(off);
    return { x: c.target.x, z: c.target.z, dist: s.radius, polar: s.phi, azimuth: s.theta };
  }

  private place(start: View2D | null) {
    const f = this.meta.frame;
    if (start) this.setOrbit({ x: start.x, z: start.y, dist: Math.min(this.distanceForZoom(start.zoom), this.controls.maxDistance), polar: 0, azimuth: 0 });
    else this.setOrbit({ x: (f.x0 + f.x1) / 2, z: (f.y0 + f.y1) / 2, dist: this.fitDistance(), polar: 0, azimuth: 0 });
  }

  private clampTarget() {
    const t = this.controls.target;
    const x = THREE.MathUtils.clamp(t.x, 0, this.meta.width), z = THREE.MathUtils.clamp(t.z, 0, this.meta.height);
    if (x !== t.x || z !== t.z) {
      const d = new THREE.Vector3(x - t.x, 0, z - t.z);
      t.add(d);
      this.camera.position.add(d);
    }
  }

  /** Animate the orbit to new values. Interrupted by any drag, wheel or key. Instant under reduced motion. */
  private animateTo(to: Partial<ReturnType<MapScene['orbit']>>, ms: number, done?: () => void) {
    const from = this.orbit();
    const target = { ...from, ...to };
    // Turn the short way round.
    let da = target.azimuth - from.azimuth;
    da = ((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    target.azimuth = from.azimuth + da;
    if (this.opts.reduced || ms <= 0) { this.setOrbit(target); this.opts.onChange(); done?.(); return; }
    this.anim = { from, to: target, t0: performance.now(), ms, done };
    this.invalidate();
  }

  /** The opening move: the flat map tilts up into 3D (continuity with the 2D view underneath). */
  // It also moves in a little (0.82 of the distance) so the tilted map still fills the view instead of receding.
  open(instant = false) {
    const dist = Math.max(this.controls.minDistance, this.orbit().dist * 0.82);
    this.animateTo({ polar: TILT_OPEN, dist }, instant ? 0 : 700);
  }

  /** The closing move: back to straight down and north up, then `done` swaps to 2D. Exits run faster than entrances. */
  close(done: () => void) { this.animateTo({ polar: 0, azimuth: 0 }, 320, done); }

  view(): View2D {
    const o = this.orbit();
    return { x: o.x, y: o.z, zoom: this.zoomForDistance(o.dist * Math.cos(o.polar)) };
  }

  flyTo(x: number, y: number, opts: { offsetX?: number; offsetY?: number; instant?: boolean } = {}) {
    const o = this.orbit();
    const dist = Math.min(o.dist, 2400);
    // Shift the target so the pin sits off centre, beside the drawer or above the sheet, as in 2D.
    const h = this.opts.canvas.clientHeight || 800;
    const k = (2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h; // world units per CSS px at the target
    const right = new THREE.Vector3(Math.cos(o.azimuth), 0, -Math.sin(o.azimuth));
    const fwd = new THREE.Vector3(-Math.sin(o.azimuth), 0, -Math.cos(o.azimuth));
    const tx = x + right.x * (opts.offsetX ?? 0) * k - fwd.x * (opts.offsetY ?? 0) * k / Math.max(0.4, Math.cos(o.polar));
    const tz = y + right.z * (opts.offsetX ?? 0) * k - fwd.z * (opts.offsetY ?? 0) * k / Math.max(0.4, Math.cos(o.polar));
    this.animateTo({ x: tx, z: tz, dist }, opts.instant ? 0 : 600);
  }

  zoomBy(d: number) {
    const o = this.orbit();
    const dist = THREE.MathUtils.clamp(o.dist / 2 ** d, this.controls.minDistance, this.controls.maxDistance);
    this.animateTo({ dist }, 200);
  }

  resetNorth() { this.animateTo({ azimuth: 0, polar: TILT_OPEN }, 450); }

  /** Heading in degrees, 0 when north is up, for the compass. */
  heading() { return THREE.MathUtils.radToDeg(this.orbit().azimuth); }
  tilt() { return THREE.MathUtils.radToDeg(this.orbit().polar); }

  /** Where an image pixel is on screen, in CSS px from the canvas's top left, or null when behind the camera. */
  project(x: number, y: number) {
    const v = new THREE.Vector3(x, heightAt(x, y), y).project(this.camera);
    if (v.z > 1) return null;
    const c = this.opts.canvas;
    return { x: ((v.x + 1) / 2) * c.clientWidth, y: ((1 - v.y) / 2) * c.clientHeight }; // the ground point, as in 2D
  }

  // ---------------------------------------------------------------- terrain

  private buildRoots() {
    const T = this.meta.tileSize ?? 256;
    const span = T * 2 ** (this.meta.maxZoom - ROOT_LEVEL);
    for (let ty = 0; ty * span < this.meta.height; ty++) for (let tx = 0; tx * span < this.meta.width; tx++) this.roots.push(this.node(ROOT_LEVEL, tx, ty));
  }

  private node(level: number, tx: number, ty: number): Node {
    const key = `${level}/${tx}/${ty}`;
    let n = this.nodes.get(key);
    if (n) return n;
    const T = this.meta.tileSize ?? 256;
    const span = T * 2 ** (this.meta.maxZoom - level);
    const x0 = tx * span, y0 = ty * span;
    const x1 = Math.min(this.meta.width, x0 + span), y1 = Math.min(this.meta.height, y0 + span);
    n = { key, level, tx, ty, x0, y0, x1, y1, span, mesh: null, texture: null, state: 'idle', used: 0, box: new THREE.Box3(new THREE.Vector3(x0, 0, y0), new THREE.Vector3(x1, maxHeight, y1)) };
    this.nodes.set(key, n);
    return n;
  }

  private children(n: Node) {
    if (n.level >= this.meta.maxZoom) return [];
    const out: Node[] = [];
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const c = this.node(n.level + 1, n.tx * 2 + dx, n.ty * 2 + dy);
      if (c.x0 < this.meta.width && c.y0 < this.meta.height) out.push(c);
      else this.nodes.delete(c.key);
    }
    return out;
  }

  private geometry(n: Node) {
    const xs: number[] = [], ys: number[] = [];
    for (let x = n.x0; x < n.x1; x += GRID) xs.push(x);
    xs.push(n.x1);
    for (let y = n.y0; y < n.y1; y += GRID) ys.push(y);
    ys.push(n.y1);
    const nx = xs.length, ny = ys.length;
    const pos = new Float32Array(nx * ny * 3), nor = new Float32Array(nx * ny * 3), uv = new Float32Array(nx * ny * 2);
    let i = 0;
    for (let j = 0; j < ny; j++) for (let k = 0; k < nx; k++, i++) {
      const x = xs[k], y = ys[j], h = heightAt(x, y);
      pos.set([x, h, y], i * 3);
      // Normal from the same global height function, so shading matches across chunk edges.
      const hx = heightAt(x + GRID, y) - heightAt(x - GRID, y), hy = heightAt(x, y + GRID) - heightAt(x, y - GRID);
      const v = new THREE.Vector3(-hx, 2 * GRID, -hy).normalize();
      nor.set([v.x, v.y, v.z], i * 3);
      uv.set([(x - n.tx * n.span) / n.span, 1 - (y - n.ty * n.span) / n.span], i * 2);
    }
    const idx: number[] = [];
    for (let j = 0; j < ny - 1; j++) for (let k = 0; k < nx - 1; k++) {
      const a = j * nx + k, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeBoundingSphere();
    g.boundingBox = n.box.clone();
    return g;
  }

  private material() {
    const light = new THREE.Vector3(-0.55, 0.72, -0.42).normalize(); // from the north-west, the cartographer's light
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        map: { value: null },
        hasMap: { value: 0 },
        ground: { value: this.uniforms.ground },
        lightDir: { value: light },
        fogColor: { value: this.uniforms.fogColor },
        fogNear: { value: 9000 },
        fogFar: { value: 30000 },
        muted: { value: this.uniforms.muted },
        waterOn: { value: 1 },
      },
    });
  }

  private ensureMesh(n: Node) {
    if (n.mesh) return n.mesh;
    n.mesh = new THREE.Mesh(this.geometry(n), this.material());
    n.mesh.matrixAutoUpdate = false;
    n.mesh.visible = false;
    this.terrain.add(n.mesh);
    return n.mesh;
  }

  private load(n: Node) {
    if (n.state !== 'idle') return;
    n.state = 'loading';
    const url = this.meta.tileUrl.replace('{z}', String(n.level)).replace('{x}', String(n.tx)).replace('{y}', String(n.ty));
    this.loader.load(url, (bitmap) => {
      if (this.disposed) { (bitmap as ImageBitmap).close?.(); return; }
      const tex = new THREE.Texture(bitmap as unknown as HTMLImageElement);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false; // ImageBitmapLoader flipped it already
      tex.anisotropy = this.maxAniso; // keeps the map crisp when tilted
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      n.texture = tex;
      n.state = 'ready';
      const m = this.ensureMesh(n);
      m.material.uniforms.map.value = tex;
      m.material.uniforms.hasMap.value = 1;
      this.invalidate();
    }, undefined, () => {
      n.state = 'error'; // no tiles built (a deploy without the map): the chunk shows the ground colour
      this.ensureMesh(n);
      this.invalidate();
    });
  }

  private ready(n: Node) { return n.state === 'ready' || n.state === 'error'; }

  /** Texel size on screen in device pixels for a node, at its nearest point to the camera. */
  private texelPx(n: Node) {
    const p = this.camera.position;
    const cx = THREE.MathUtils.clamp(p.x, n.x0, n.x1), cz = THREE.MathUtils.clamp(p.z, n.y0, n.y1);
    const d = Math.max(1, Math.hypot(p.x - cx, p.y - Math.min(p.y, maxHeight * 0.5), p.z - cz));
    const h = this.renderer.domElement.height; // device px
    const pxPerUnit = h / (2 * d * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    return (n.span / (this.meta.tileSize ?? 256)) * pxPerUnit;
  }

  private select() {
    const now = performance.now();
    this.projScreen.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreen);
    for (const m of this.terrain.children) m.visible = false;
    let shown = 0;
    const visit = (n: Node) => {
      n.used = now;
      const inView = this.frustum.intersectsBox(n.box);
      if (!this.ready(n)) { this.load(n); return false; }
      const kids = inView && n.state === 'ready' && this.texelPx(n) > 1.25 ? this.children(n) : [];
      if (kids.length) {
        kids.forEach((k) => this.load(k));
        if (kids.every((k) => this.ready(k))) { kids.forEach(visit); return true; }
      }
      const m = this.ensureMesh(n);
      m.visible = true;
      shown++;
      return true;
    };
    for (const r of this.roots) {
      if (!visit(r)) { const m = this.ensureMesh(r); m.visible = true; shown++; } // still loading: the ground colour
    }
    this.stats.tiles = shown;
    this.evict(now);
  }

  private evict(now: number) {
    const loaded = [...this.nodes.values()].filter((n) => n.texture && n.level > ROOT_LEVEL);
    if (loaded.length <= MAX_TEXTURES) return;
    loaded.sort((a, b) => a.used - b.used);
    for (const n of loaded.slice(0, loaded.length - MAX_TEXTURES)) {
      if (n.used === now) continue;
      n.texture?.dispose();
      (n.texture?.image as ImageBitmap | undefined)?.close?.();
      n.texture = null;
      n.state = 'idle';
      if (n.mesh) { this.terrain.remove(n.mesh); n.mesh.geometry.dispose(); n.mesh.material.dispose(); n.mesh = null; }
    }
  }

  // ---------------------------------------------------------------- pins

  private iconImage(name: IconName, colour: string) {
    const key = `${name}|${colour}`;
    let img = this.iconImages.get(key);
    if (img) return img;
    const def = icons[name] as { line: string };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${colour}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${def.line}</svg>`;
    img = new Image();
    img.decoding = 'async';
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    img.onload = () => { for (const [slug, d] of this.pinData) this.stylePin(slug, d); this.invalidate(); };
    this.iconImages.set(key, img);
    return img;
  }

  private pinTexture(icon: IconName, state: 'rest' | 'hover' | 'selected') {
    const t = this.theme;
    const fill = state === 'selected' ? t.inverseFill : t.accent;
    const ink = state === 'selected' ? t.inverseText : t.onAccent;
    const key = `${icon}|${state}|${fill}|${ink}`;
    const cached = this.pinTex.get(key);
    const img = this.iconImage(icon, ink);
    if (cached && cached.userData.complete) return cached;
    const s = 4; // drawn at 4x for crisp edges on 2x screens
    const W = 30 * s, H = PIN_PX * s;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d')!;
    // Stem, from the ground point up to the head.
    g.fillStyle = state === 'selected' ? t.accent : fill;
    g.fillRect(W / 2 - 1.5 * s / 2, 26 * s, 1.5 * s, H - 26 * s);
    g.beginPath();
    g.arc(W / 2, H - 1.5 * s, 2.5 * s, 0, Math.PI * 2);
    g.fill();
    // Head: a disc with a 2px ring (selected: white disc, pink ring; hover: dark ring).
    g.beginPath();
    g.arc(W / 2, 14 * s, 13.5 * s, 0, Math.PI * 2);
    g.fillStyle = fill;
    g.fill();
    g.lineWidth = 2 * s;
    g.strokeStyle = state === 'selected' ? t.accent : state === 'hover' ? t.inverseFill : 'rgba(13,12,26,0.35)';
    g.stroke();
    if (img.complete && img.naturalWidth) g.drawImage(img, W / 2 - 8 * s, 6 * s, 16 * s, 16 * s);
    const tex = cached ?? new THREE.CanvasTexture(c);
    if (cached) { (cached.image as HTMLCanvasElement) = c; cached.needsUpdate = true; }
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.userData.complete = img.complete && !!img.naturalWidth;
    this.pinTex.set(key, tex);
    return tex;
  }

  private stylePin(slug: string, d: { pin: Pin3D; sprite: THREE.Sprite }) {
    const state = slug === this.selected ? 'selected' : slug === this.hovered ? 'hover' : 'rest';
    const mat = d.sprite.material as THREE.SpriteMaterial;
    mat.map = this.pinTexture(d.pin.icon, state);
    mat.needsUpdate = true;
    d.sprite.renderOrder = state === 'selected' ? 3 : state === 'hover' ? 2 : 1;
    this.scalePin(d.sprite, state === 'rest' ? 1 : 1.15);
  }

  private scalePin(s: THREE.Sprite, k = 1) {
    const h = this.opts.canvas.clientHeight || 800;
    const unit = (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h; // sprite scale per CSS px (sizeAttenuation off)
    s.scale.set(30 * unit * k, PIN_PX * unit * k, 1);
    s.userData.k = k;
  }

  setPins(list: Pin3D[]) {
    const keep = new Set(list.map((p) => p.slug));
    for (const [slug, d] of this.pinData) if (!keep.has(slug)) { this.pins.remove(d.sprite); (d.sprite.material as THREE.SpriteMaterial).dispose(); this.pinData.delete(slug); }
    for (const p of list) {
      let d = this.pinData.get(p.slug);
      if (!d) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ sizeAttenuation: false, depthTest: false, depthWrite: false, transparent: true }));
        sprite.center.set(0.5, 0); // the bottom of the stem is the exact pixel
        sprite.userData.slug = p.slug;
        d = { pin: p, sprite };
        this.pinData.set(p.slug, d);
        this.pins.add(sprite);
      }
      d.pin = p;
      d.sprite.position.set(p.x, heightAt(p.x, p.y), p.y);
      this.stylePin(p.slug, d);
    }
    this.invalidate();
  }

  setState(selected: string | null, hovered: string | null) {
    if (selected === this.selected && hovered === this.hovered) return;
    this.selected = selected;
    this.hovered = hovered;
    for (const [slug, d] of this.pinData) this.stylePin(slug, d);
    this.invalidate();
  }

  setSelected(slug: string | null) { this.setState(slug, this.hovered); }

  // ---------------------------------------------------------------- collectibles

  /** A small disc texture, drawn like the 2D `.cpin`: surface fill, text-coloured ring (selected: inverse fill, pink ring). */
  private discTexture(selected: boolean) {
    const css = (n: string, f: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    g.beginPath();
    g.arc(32, 32, 26, 0, Math.PI * 2);
    g.fillStyle = selected ? this.theme.inverseFill : css('--surface-1', '#1a1a2e');
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = selected ? this.theme.accent : css('--text-1', '#f2f2f2');
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  private pointsOf(items: { wx: number; wz: number; x: number; y: number }[], sizeCss: number, selected: boolean) {
    const pos = new Float32Array(items.length * 3);
    items.forEach((c, i) => pos.set([c.wx, heightAt(c.x, c.y) + 1, c.wz], i * 3));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: sizeCss * this.renderer.getPixelRatio(), sizeAttenuation: false, map: this.discTexture(selected), transparent: true, depthTest: false, depthWrite: false, alphaTest: 0.05 });
    const pts = new THREE.Points(geo, mat);
    pts.renderOrder = selected ? 2 : 0; // under the find pins, as in 2D
    pts.frustumCulled = false;
    return pts;
  }

  private disposePoints(p: THREE.Points | null) {
    if (!p) return;
    this.scene.remove(p);
    p.geometry.dispose();
    const m = p.material as THREE.PointsMaterial;
    m.map?.dispose();
    m.dispose();
  }

  /** The items of the layers that are on. Items sharing one spot sit on a small ring so each can be picked, as in 2D. */
  setCollectibles(list: Collectible3D[], selected: string | null) {
    const spots = new Map<string, Collectible3D[]>();
    for (const c of list) { const k = `${c.x},${c.y}`; spots.set(k, [...(spots.get(k) ?? []), c]); }
    this.cItems = list.map((c) => {
      const same = spots.get(`${c.x},${c.y}`)!;
      if (same.length < 2) return { ...c, wx: c.x, wz: c.y };
      const a = (2 * Math.PI * same.indexOf(c)) / same.length, r = 8 + same.length * 3;
      return { ...c, wx: c.x + Math.cos(a) * r, wz: c.y + Math.sin(a) * r };
    });
    this.cSelectedId = selected;
    this.disposePoints(this.cPoints);
    this.disposePoints(this.cSelected);
    this.cPoints = this.cSelected = null;
    const rest = this.cItems.filter((c) => c.id !== selected);
    if (rest.length) { this.cPoints = this.pointsOf(rest, 12, false); this.scene.add(this.cPoints); }
    const sel = this.cItems.find((c) => c.id === selected);
    if (sel) { this.cSelected = this.pointsOf([sel], 16, true); this.scene.add(this.cSelected); }
    this.invalidate();
  }

  /** Where a collectible is on screen, in CSS px (its ring position when it shares a spot), or null. */
  collectiblePoint(x: number, y: number) {
    const at = this.cItems.filter((i) => i.x === x && i.y === y);
    const c = at.find((i) => i.id === this.cSelectedId) ?? at[0];
    const v = new THREE.Vector3(c?.wx ?? x, heightAt(x, y), c?.wz ?? y).project(this.camera);
    if (v.z > 1) return null;
    const el = this.opts.canvas;
    return { x: ((v.x + 1) / 2) * el.clientWidth, y: ((1 - v.y) / 2) * el.clientHeight };
  }

  /** The collectible under the pointer: nearest centre within 18 px (a 36 px target around a 12 px disc). */
  private pickCollectible(e: PointerEvent) {
    if (!this.cItems.length) return null;
    const r = this.opts.canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const v = new THREE.Vector3();
    let best: { id: string; d: number } | null = null;
    for (const c of this.cItems) {
      v.set(c.wx, heightAt(c.x, c.y), c.wz).project(this.camera);
      if (v.z > 1) continue;
      const d = Math.hypot(((v.x + 1) / 2) * r.width - px, ((1 - v.y) / 2) * r.height - py);
      if (d <= 18 && (!best || d < best.d)) best = { id: c.id, d };
    }
    return best?.id ?? null;
  }

  setTheme(theme: Theme3D) {
    this.theme = theme;
    this.uniforms.ground.set(theme.ground);
    this.uniforms.fogColor.set(theme.background);
    (this.scene.background as THREE.Color).set(theme.background);
    this.uniforms.muted = theme.muted ? 1 : 0;
    for (const n of this.nodes.values()) if (n.mesh) n.mesh.material.uniforms.muted.value = this.uniforms.muted;
    for (const t of this.pinTex.values()) t.dispose();
    this.pinTex.clear();
    for (const [slug, d] of this.pinData) this.stylePin(slug, d);
    if (this.cItems.length) this.setCollectibles(this.cItems.map(({ id, x, y }) => ({ id, x, y })), this.cSelectedId);
    this.invalidate();
  }

  /**
   * The pin under the pointer. Screen-space test against each pin head with a 44 px target (the touch rule), so a
   * finger does not have to land on the 30 px disc. Ties go to the selected or hovered pin, then the nearest.
   */
  private pick(e: PointerEvent) {
    const c = this.opts.canvas.getBoundingClientRect();
    const px = e.clientX - c.left, py = e.clientY - c.top;
    let best: { slug: string; d: number; order: number } | null = null;
    for (const [slug, d] of this.pinData) {
      const p = this.project(d.pin.x, d.pin.y);
      if (!p) continue;
      const k = d.sprite.userData.k ?? 1;
      const dist = Math.hypot(px - p.x, py - (p.y - (PIN_PX - 14) * k));
      if (dist > 22 * k) continue;
      const order = d.sprite.renderOrder;
      if (!best || order > best.order || (order === best.order && dist < best.d)) best = { slug, d: dist, order };
    }
    return best?.slug ?? null;
  }

  // ---------------------------------------------------------------- input

  private down: { x: number; y: number; t: number } | null = null;
  private onDown = (e: PointerEvent) => { this.down = { x: e.clientX, y: e.clientY, t: performance.now() }; this.anim = null; };
  private onUp = (e: PointerEvent) => {
    const d = this.down;
    this.down = null;
    if (!d || e.button !== 0 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return; // a drag, not a tap
    const slug = this.pick(e);
    if (slug) { this.opts.onPick(slug); return; }
    const cid = this.pickCollectible(e); // find pins win over collectibles, as their layer sits above in 2D
    if (cid) this.opts.onPickCollectible(cid);
  };
  private onHover = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const slug = this.pick(e);
    this.opts.canvas.style.cursor = slug || this.pickCollectible(e) ? 'pointer' : '';
    if (slug !== this.hoverPick) { this.hoverPick = slug; this.setState(this.selected, slug ?? this.listHover); }
  };
  private hoverPick: string | null = null;
  private listHover: string | null = null;
  setListHover(slug: string | null) { this.listHover = slug; this.setState(this.selected, this.hoverPick ?? slug); }
  private onLeave = () => { this.hoverPick = null; this.opts.canvas.style.cursor = ''; this.setState(this.selected, this.listHover); };

  // Keyboard: arrows move, Shift + arrows turn and tilt, plus and minus zoom, 0 resets north. Keys never animate.
  private onKey = (e: KeyboardEvent) => {
    const o = this.orbit();
    const step = (o.dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) * 0.25;
    const right = new THREE.Vector3(Math.cos(o.azimuth), 0, -Math.sin(o.azimuth));
    const fwd = new THREE.Vector3(-Math.sin(o.azimuth), 0, -Math.cos(o.azimuth));
    let next: Partial<typeof o> | null = null;
    if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) next = { azimuth: o.azimuth + (e.key === 'ArrowLeft' ? 1 : -1) * THREE.MathUtils.degToRad(15) };
    else if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) next = { polar: THREE.MathUtils.clamp(o.polar + (e.key === 'ArrowUp' ? 1 : -1) * THREE.MathUtils.degToRad(8), 0, TILT_MAX) };
    else if (e.key === 'ArrowLeft') next = { x: o.x - right.x * step, z: o.z - right.z * step };
    else if (e.key === 'ArrowRight') next = { x: o.x + right.x * step, z: o.z + right.z * step };
    else if (e.key === 'ArrowUp') next = { x: o.x + fwd.x * step, z: o.z + fwd.z * step };
    else if (e.key === 'ArrowDown') next = { x: o.x - fwd.x * step, z: o.z - fwd.z * step };
    else if (e.key === '+' || e.key === '=') next = { dist: Math.max(this.controls.minDistance, o.dist / 1.5) };
    else if (e.key === '-' || e.key === '_') next = { dist: Math.min(this.controls.maxDistance, o.dist * 1.5) };
    else if (e.key === '0') next = { azimuth: 0, polar: TILT_OPEN };
    if (!next) return;
    e.preventDefault();
    this.anim = null;
    this.setOrbit({ ...o, ...next });
    this.opts.onChange();
  };

  private onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(this.raf); };

  // ---------------------------------------------------------------- frame loop

  private resize() {
    const c = this.opts.canvas;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.controls.maxDistance = this.fitDistance() * 1.35;
    for (const d of this.pinData.values()) this.scalePin(d.sprite, d.sprite.userData.k ?? 1);
    this.invalidate();
  }

  invalidate() { this.dirty = true; }

  private loop(now: number) {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    let moving = false;
    if (this.anim) {
      const a = this.anim;
      const p = Math.min(1, (now - a.t0) / a.ms);
      const e = easeInOut(p);
      const lerp = (k: string) => a.from[k] + (a.to[k] - a.from[k]) * e;
      this.setOrbit({ x: lerp('x'), z: lerp('z'), dist: lerp('dist'), polar: lerp('polar'), azimuth: lerp('azimuth') });
      this.opts.onChange();
      if (p >= 1) { this.anim = null; a.done?.(); }
      moving = true;
    } else if (this.controls.update()) moving = true;
    if (!this.dirty && !moving) { this.lastFrame = 0; return; }
    this.dirty = false;
    const t0 = performance.now();
    this.camera.near = Math.max(5, this.orbit().dist * 0.02);
    this.camera.far = this.orbit().dist * 6 + 20000;
    this.camera.updateProjectionMatrix();
    for (const n of this.nodes.values()) if (n.mesh) {
      const u = n.mesh.material.uniforms;
      u.fogNear.value = this.orbit().dist * 1.1;
      u.fogFar.value = this.orbit().dist * 4.5 + 4000;
    }
    this.select();
    this.renderer.render(this.scene, this.camera);
    const t1 = performance.now();
    this.stats.renderMs.push(t1 - t0);
    if (this.lastFrame) this.stats.frames.push(now - this.lastFrame);
    if (this.stats.frames.length > 600) this.stats.frames.splice(0, 300);
    if (this.stats.renderMs.length > 600) this.stats.renderMs.splice(0, 300);
    this.stats.draws = this.renderer.info.render.calls;
    this.lastFrame = now;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    const c = this.opts.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointermove', this.onHover);
    c.removeEventListener('pointerleave', this.onLeave);
    c.removeEventListener('keydown', this.onKey);
    c.removeEventListener('webglcontextlost', this.onLost);
    this.controls.dispose();
    for (const n of this.nodes.values()) {
      n.texture?.dispose();
      (n.texture?.image as ImageBitmap | undefined)?.close?.();
      if (n.mesh) { n.mesh.geometry.dispose(); n.mesh.material.dispose(); }
    }
    for (const t of this.pinTex.values()) t.dispose();
    for (const d of this.pinData.values()) (d.sprite.material as THREE.SpriteMaterial).dispose();
    this.disposePoints(this.cPoints);
    this.disposePoints(this.cSelected);
    this.renderer.dispose();
  }
}
