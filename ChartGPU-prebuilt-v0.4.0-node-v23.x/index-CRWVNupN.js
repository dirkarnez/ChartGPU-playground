const Zs = Symbol("GPUContext.ownsDevice"), nd = (e) => e[Zs] ?? !0;
function sp(e) {
  return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function ap(e) {
  const t = e.clientWidth || e.width || 0, n = e.clientHeight || e.height || 0;
  if (!Number.isFinite(t) || !Number.isFinite(n))
    throw new Error(
      `GPUContext: Invalid canvas dimensions detected: width=${e.clientWidth || e.width}, height=${e.clientHeight || e.height}. Canvas must have finite dimensions. Ensure canvas is properly sized before initialization.`
    );
  return { width: t, height: n };
}
function id(e, t) {
  const n = (t == null ? void 0 : t.devicePixelRatio) ?? (typeof window < "u" ? window.devicePixelRatio : 1), i = Number.isFinite(n) && n > 0 ? n : 1, r = (t == null ? void 0 : t.alphaMode) ?? "opaque", o = (t == null ? void 0 : t.powerPreference) ?? "high-performance", s = !!(t != null && t.device && (t != null && t.adapter)), a = s ? t.adapter : null, l = s ? t.device : null, c = !s;
  return {
    adapter: a,
    device: l,
    initialized: !1,
    canvas: e || null,
    canvasContext: null,
    preferredFormat: null,
    devicePixelRatio: i,
    alphaMode: r,
    powerPreference: o,
    [Zs]: c
  };
}
async function rd(e) {
  var o, s, a;
  if (e.initialized)
    throw new Error("GPUContext: already initialized. Call destroyGPUContext() before reinitializing.");
  const t = Number.isFinite(e.devicePixelRatio) && e.devicePixelRatio > 0 ? e.devicePixelRatio : 1;
  if (!navigator.gpu)
    throw new Error(
      "WebGPU is not available in this browser. Please use a browser that supports WebGPU (Chrome 113+, Edge 113+, or Safari 18+). Ensure WebGPU is enabled in browser flags if needed."
    );
  let n = null, i = null, r = nd(e);
  try {
    if (e.adapter && e.device) {
      if (i = e.adapter, n = e.device, r = !1, typeof ((o = navigator.gpu) == null ? void 0 : o.getPreferredCanvasFormat) != "function")
        throw new Error(
          "GPUContext: Shared device requires navigator.gpu.getPreferredCanvasFormat() for canvas format selection, but it is not available in this environment. Use a browser with full WebGPU support."
        );
      const f = navigator.gpu.getPreferredCanvasFormat();
      if (f !== "bgra8unorm" && f !== "rgba8unorm")
        throw new Error(
          `GPUContext: Shared device preferred canvas format is not supported by ChartGPU. Received navigator.gpu.getPreferredCanvasFormat()="${f}". Supported formats: "bgra8unorm", "rgba8unorm".`
        );
      const d = n.limits.maxBufferSize;
      if (d < 33554432)
        throw new Error(
          `GPUContext: Injected device.limits.maxBufferSize is insufficient. Required >= 33554432 bytes, actual=${d} bytes.`
        );
      const m = n.limits.maxStorageBufferBindingSize;
      if (m < 33554432)
        throw new Error(
          `GPUContext: Injected device.limits.maxStorageBufferBindingSize is insufficient. Required >= 33554432 bytes, actual=${m} bytes.`
        );
    } else {
      const f = await navigator.gpu.requestAdapter({
        powerPreference: e.powerPreference
      });
      if (!f)
        throw new Error(
          "GPUContext: Failed to request WebGPU adapter. No compatible adapter found. This may occur if no GPU is available or WebGPU is disabled."
        );
      const d = await f.requestDevice();
      if (!d)
        throw new Error("GPUContext: Failed to request WebGPU device from adapter.");
      i = f, n = d, r = !0, n.addEventListener("uncapturederror", (m) => {
        console.error("WebGPU uncaptured error:", m.error);
      });
    }
    let c = null, u = null;
    if (e.canvas) {
      const f = e.canvas.getContext("webgpu");
      if (!f) {
        if (r && n)
          try {
            n.destroy();
          } catch (h) {
            console.warn("Error destroying device during canvas setup failure:", h);
          }
        throw new Error("GPUContext: Failed to get WebGPU context from canvas.");
      }
      const { width: d, height: m } = ap(e.canvas), p = t, y = Math.floor(d * p), g = Math.floor(m * p), S = n.limits.maxTextureDimension2D;
      if (!r && (y > S || g > S)) {
        const h = Math.max(y, g);
        throw new Error(
          `GPUContext: Injected device.limits.maxTextureDimension2D is insufficient. Required >= ${h} (for ${y}x${g} at devicePixelRatio=${p}), actual=${S}.`
        );
      }
      const A = Math.max(1, Math.min(y, S)), M = Math.max(1, Math.min(g, S));
      e.canvas.width = A, e.canvas.height = M, u = ((a = (s = navigator.gpu).getPreferredCanvasFormat) == null ? void 0 : a.call(s)) || "bgra8unorm", f.configure({
        device: n,
        format: u,
        alphaMode: e.alphaMode
      }), c = f;
    }
    return {
      adapter: i,
      device: n,
      initialized: !0,
      canvas: e.canvas,
      canvasContext: c,
      preferredFormat: u,
      devicePixelRatio: t,
      alphaMode: e.alphaMode,
      powerPreference: e.powerPreference,
      [Zs]: r
    };
  } catch (l) {
    if (r && n)
      try {
        n.destroy();
      } catch (c) {
        console.warn("Error destroying device during initialization failure:", c);
      }
    throw l instanceof Error ? l : new Error(`Failed to initialize GPUContext: ${String(l)}`);
  }
}
function od(e) {
  if (!e.canvas)
    throw new Error("GPUContext: Canvas is not configured. Provide a canvas element when creating the context.");
  if (!e.initialized || !e.canvasContext)
    throw new Error("GPUContext: not initialized. Call initializeGPUContext() first.");
  return e.canvasContext.getCurrentTexture();
}
function lp(e, t, n, i, r) {
  if (t < 0 || t > 1 || n < 0 || n > 1 || i < 0 || i > 1 || r < 0 || r > 1)
    throw new Error("GPUContext: Color components must be in the range [0.0, 1.0]");
  if (!e.canvas)
    throw new Error("GPUContext: Canvas is not configured. Provide a canvas element when creating the context.");
  if (!e.initialized || !e.device || !e.canvasContext)
    throw new Error("GPUContext: not initialized. Call initializeGPUContext() first.");
  const o = od(e), s = e.device.createCommandEncoder();
  s.beginRenderPass({
    colorAttachments: [
      {
        view: o.createView(),
        clearValue: { r: t, g: n, b: i, a: r },
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  }).end(), e.device.queue.submit([s.finish()]);
}
function cp(e) {
  if (e.canvasContext)
    try {
      e.canvasContext.unconfigure();
    } catch (t) {
      console.warn("Error unconfiguring GPU canvas context:", t);
    }
  if (nd(e) !== !1 && e.device)
    try {
      e.device.destroy();
    } catch (t) {
      console.warn("Error destroying GPU device:", t);
    }
  return {
    adapter: null,
    device: null,
    initialized: !1,
    canvas: e.canvas,
    canvasContext: null,
    preferredFormat: null,
    devicePixelRatio: e.devicePixelRatio,
    alphaMode: e.alphaMode,
    powerPreference: e.powerPreference,
    [Zs]: !1
  };
}
async function NM(e, t) {
  const n = id(e, t);
  return rd(n);
}
class Gl {
  /**
   * Gets the WebGPU adapter, or null if not initialized.
   */
  get adapter() {
    return this._state.adapter;
  }
  /**
   * Gets the WebGPU device, or null if not initialized.
   */
  get device() {
    return this._state.device;
  }
  /**
   * Checks if the context has been initialized.
   */
  get initialized() {
    return this._state.initialized;
  }
  /**
   * Gets the canvas element, or null if not provided.
   */
  get canvas() {
    return this._state.canvas;
  }
  /**
   * Gets the WebGPU canvas context, or null if canvas is not configured.
   */
  get canvasContext() {
    return this._state.canvasContext;
  }
  /**
   * Gets the preferred canvas format, or null if canvas is not configured.
   */
  get preferredFormat() {
    return this._state.preferredFormat;
  }
  /**
   * Gets the device pixel ratio used for canvas sizing.
   */
  get devicePixelRatio() {
    return this._state.devicePixelRatio;
  }
  /**
   * Updates the device pixel ratio used by layout helpers (e.g. `computeGridArea`).
   * Called from chart resize so grid margins stay consistent with the canvas backing store
   * when live `window.devicePixelRatio` changes (page zoom) or an explicit option is applied.
   *
   * Does not reconfigure the canvas; callers size `canvas.width/height` separately.
   */
  setDevicePixelRatio(t) {
    const n = Number.isFinite(t) && t > 0 ? t : 1;
    if (this._state.devicePixelRatio === n) return;
    const i = this._state;
    this._state = {
      ...i,
      devicePixelRatio: n
    };
  }
  /**
   * Gets the canvas alpha mode.
   */
  get alphaMode() {
    return this._state.alphaMode;
  }
  /**
   * Gets the GPU power preference.
   */
  get powerPreference() {
    return this._state.powerPreference;
  }
  /**
   * Creates a new GPUContext instance.
   *
   * @param canvas - Optional canvas element (HTMLCanvasElement) to configure for WebGPU rendering
   * @param options - Optional configuration for device pixel ratio, alpha mode, and power preference
   */
  constructor(t, n) {
    this._state = id(t, n);
  }
  /**
   * Initializes the WebGPU context by requesting an adapter and device.
   *
   * @throws {Error} If WebGPU is not available in the browser
   * @throws {Error} If adapter request fails
   * @throws {Error} If device request fails
   * @throws {Error} If already initialized
   */
  async initialize() {
    this._state = await rd(this._state);
  }
  /**
   * Static factory method to create and initialize a GPUContext instance.
   *
   * @param canvas - Optional canvas element (HTMLCanvasElement) to configure for WebGPU rendering
   * @param options - Optional configuration for device pixel ratio, alpha mode, and power preference
   * @returns A fully initialized GPUContext instance
   * @throws {Error} If initialization fails
   *
   * @example
   * ```typescript
   * const context = await GPUContext.create();
   * const device = context.device;
   * ```
   *
   * @example
   * ```typescript
   * const canvas = document.querySelector('canvas');
   * const context = await GPUContext.create(canvas);
   * const texture = context.getCanvasTexture();
   * ```
   */
  static async create(t, n) {
    const i = new Gl(t, n);
    return await i.initialize(), i;
  }
  /**
   * Gets the current texture from the canvas context.
   *
   * @returns The current canvas texture
   * @throws {Error} If canvas is not configured or context is not initialized
   *
   * @example
   * ```typescript
   * const texture = context.getCanvasTexture();
   * // Use texture in render pass
   * ```
   */
  getCanvasTexture() {
    return od(this._state);
  }
  /**
   * Clears the canvas to a solid color.
   * Creates a command encoder, begins a render pass with the specified clear color,
   * ends the pass, and submits it to the queue.
   *
   * @param r - Red component (0.0 to 1.0)
   * @param g - Green component (0.0 to 1.0)
   * @param b - Blue component (0.0 to 1.0)
   * @param a - Alpha component (0.0 to 1.0)
   * @throws {Error} If canvas is not configured or context is not initialized
   * @throws {Error} If device is not available
   *
   * @example
   * ```typescript
   * // Clear to dark purple (#1a1a2e)
   * context.clearScreen(0x1a / 255, 0x1a / 255, 0x2e / 255, 1.0);
   * ```
   */
  clearScreen(t, n, i, r) {
    lp(this._state, t, n, i, r);
  }
  /**
   * Destroys the WebGPU device and cleans up resources.
   * After calling destroy(), the context must be reinitialized before use.
   */
  destroy() {
    this._state = cp(this._state);
  }
}
const ni = {
  left: 60,
  right: 20,
  top: 40,
  bottom: 40
}, Ma = {
  /** No left-positioned Y (price on right only). */
  leftNoLeftY: 20,
  /** At least one left-positioned Y (e.g. volume dual-Y). */
  leftWithLeftY: 60,
  /**
   * Room for right-side price ladder labels + last-price badge.
   * ~70 was tight for 6-sig badge text (padding + tick) and clipped at the canvas edge.
   */
  right: 80
}, fs = [
  "#5470C6",
  "#91CC75",
  "#FAC858",
  "#EE6666",
  "#73C0DE",
  "#3BA272",
  "#FC8452",
  "#9A60B4",
  "#EA7CCC"
], Lo = {
  width: 2,
  opacity: 1
}, Sa = {
  opacity: 0.25
}, ai = {
  style: "classic",
  itemStyle: {
    upColor: "#22c55e",
    downColor: "#ef4444",
    upBorderColor: "#22c55e",
    downBorderColor: "#ef4444",
    borderWidth: 1
  },
  barWidth: "80%",
  barMinWidth: 1,
  barMaxWidth: 50,
  sampling: "ohlc",
  samplingThreshold: 5e3
}, Qn = {
  itemStyle: {
    upColor: "#22c55e",
    downColor: "#ef4444",
    upBorderColor: "#22c55e",
    downBorderColor: "#ef4444",
    borderWidth: 1
  },
  barWidth: "60%",
  barMinWidth: 1,
  barMaxWidth: 50,
  /** Stem thickness in CSS px. */
  stemWidth: 1,
  /**
   * Open/close tick length as fraction of resolved body width when a percent string,
   * or absolute CSS px when a number. Default ~half-category arms.
   */
  tickLength: "45%",
  sampling: "ohlc",
  samplingThreshold: 5e3
}, wr = {
  itemStyle: {
    borderWidth: 1.5,
    opacity: 1
  },
  /** Cap full width as fraction of category step when percent omitted. */
  capWidth: "40%",
  errorMode: "both",
  direction: "vertical",
  drawWhiskers: !0,
  drawConnector: !0,
  showCenter: !1,
  symbolSize: 6,
  sampling: "none"
}, Uo = {
  baseline: 0,
  /** Stem stroke width in CSS px. */
  lineStyle: {
    width: 2,
    opacity: 1
  },
  showMarker: !0,
  symbolSize: 6,
  sampling: "none"
}, _o = {
  mode: "points",
  // Bin size in CSS pixels for density mode. Must be > 0.
  binSize: 2,
  densityColormap: "viridis",
  densityNormalization: "log"
}, Co = {
  colormap: "viridis",
  zScale: "linear",
  opacity: 1,
  cellAnchor: "corner",
  nullHandling: "transparent",
  cellGapPx: 0
}, bc = {
  pointSize: 3,
  opacity: 0.9,
  color: "#38bdf8"
}, Qi = {
  colormap: "viridis",
  opacity: 1,
  wireframe: !1,
  lighting: 0.65,
  contoursShow: !1,
  contoursLevels: 12,
  contoursColor: "#e2e8f0",
  contoursWidth: 1.5,
  contoursOpacity: 0.85
}, sd = {
  showBox: !0,
  showGrid: !0,
  labelMode: "auto",
  tickCount: 5
}, Nr = {
  type: "perspective",
  fovY: Math.PI / 4,
  near: 0.01,
  far: 1e4,
  orthoSize: 1,
  up: [0, 1, 0]
}, Ca = {
  orbit: !0,
  pan: !0,
  zoom: !0,
  orbitSpeed: 5e-3,
  zoomSpeed: 1,
  panSpeed: 1
}, vc = {
  horizontal: {
    count: 5
  },
  vertical: {
    count: 6
  }
}, Bn = {
  grid: ni,
  xAxis: { type: "value" },
  yAxis: { type: "value", autoBounds: "visible" },
  autoScroll: !1,
  theme: "dark",
  palette: fs,
  series: []
}, wc = (e) => Math.min(1, Math.max(0, e)), Nc = (e) => Math.min(255, Math.max(0, e)), er = (e) => {
  const t = Number.parseInt(e, 16);
  return Number.isFinite(t) ? t : 0;
}, tr = (e) => {
  const t = Number.parseInt(e, 16);
  return Number.isFinite(t) ? t : 0;
}, up = (e) => {
  const t = e.trim();
  if (!t.startsWith("#")) return null;
  const n = t.slice(1);
  if (n.length === 3) {
    const i = er(n[0]), r = er(n[1]), o = er(n[2]);
    return [i * 17 / 255, r * 17 / 255, o * 17 / 255, 1];
  }
  if (n.length === 4) {
    const i = er(n[0]), r = er(n[1]), o = er(n[2]), s = er(n[3]);
    return [i * 17 / 255, r * 17 / 255, o * 17 / 255, s * 17 / 255];
  }
  if (n.length === 6) {
    const i = tr(n.slice(0, 2)), r = tr(n.slice(2, 4)), o = tr(n.slice(4, 6));
    return [i / 255, r / 255, o / 255, 1];
  }
  if (n.length === 8) {
    const i = tr(n.slice(0, 2)), r = tr(n.slice(2, 4)), o = tr(n.slice(4, 6)), s = tr(n.slice(6, 8));
    return [i / 255, r / 255, o / 255, s / 255];
  }
  return null;
}, Mr = (e) => {
  const t = e.trim();
  if (t.length === 0) return null;
  if (t.endsWith("%")) {
    const i = Number.parseFloat(t.slice(0, -1));
    return Number.isFinite(i) ? Nc(i / 100 * 255) : null;
  }
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? Nc(n) : null;
}, fp = (e) => {
  const t = e.trim();
  if (t.length === 0) return null;
  if (t.endsWith("%")) {
    const i = Number.parseFloat(t.slice(0, -1));
    return Number.isFinite(i) ? wc(i / 100) : null;
  }
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? wc(n) : null;
}, dp = (e) => {
  const t = e.trim(), n = /^(rgba?|RGBA?)\(\s*([^\)]*)\s*\)$/.exec(t);
  if (!n) return null;
  const i = n[1].toLowerCase(), o = n[2].split(",").map((s) => s.trim());
  if (i === "rgb") {
    if (o.length !== 3) return null;
    const s = Mr(o[0]), a = Mr(o[1]), l = Mr(o[2]);
    return s == null || a == null || l == null ? null : [s / 255, a / 255, l / 255, 1];
  }
  if (i === "rgba") {
    if (o.length !== 4) return null;
    const s = Mr(o[0]), a = Mr(o[1]), l = Mr(o[2]), c = fp(o[3]);
    return s == null || a == null || l == null || c == null ? null : [s / 255, a / 255, l / 255, c];
  }
  return null;
}, wn = (e) => {
  if (typeof e != "string") return null;
  const t = e.trim();
  if (t.length === 0) return null;
  const n = up(t);
  if (n) return n;
  const i = dp(t);
  return i || null;
}, mp = (e, t = { r: 0, g: 0, b: 0, a: 1 }) => {
  const n = wn(e);
  if (!n) return t;
  const [i, r, o, s] = n;
  return { r: i, g: r, b: o, a: s };
}, fo = (e) => Math.min(1, Math.max(0, e)), mo = (e, t, n) => Math.min(n, Math.max(t, e | 0)), zo = (e, t, n) => e + (t - e) * n, pp = (e, t, n) => [zo(e[0], t[0], n), zo(e[1], t[1], n), zo(e[2], t[2], n), zo(e[3], t[3], n)], hp = (e) => wn(e) ?? [0, 0, 0, 1];
function Mc(e) {
  return e === "plasma" ? ["#0d0887", "#6a00a8", "#b12a90", "#e16462", "#fca636", "#f0f921"] : e === "inferno" ? ["#000004", "#420a68", "#932667", "#dd513a", "#fca50a", "#fcffa4"] : e === "magma" ? ["#000004", "#3b0f70", "#8c2981", "#de4968", "#fe9f6d", "#fcfdbf"] : e === "grayscale" ? ["#000000", "#ffffff"] : ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"];
}
function Ol(e) {
  return e === "viridis" || e === "plasma" || e === "inferno" || e === "magma" || e === "grayscale";
}
function ad(e) {
  if (typeof e == "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "custom";
  }
}
function Hl(e) {
  const n = (typeof e == "string" ? Mc(e) : Array.isArray(e) && e.length > 0 ? e : Mc("viridis")).map(hp), i = Math.max(2, n.length), r = new Uint8Array(new ArrayBuffer(256 * 4));
  for (let o = 0; o < 256; o++) {
    const a = o / 255 * (i - 1), l = Math.min(i - 2, Math.max(0, Math.floor(a))), c = a - l, u = pp(n[l], n[l + 1], c);
    r[o * 4 + 0] = mo(Math.round(fo(u[0]) * 255), 0, 255), r[o * 4 + 1] = mo(Math.round(fo(u[1]) * 255), 0, 255), r[o * 4 + 2] = mo(Math.round(fo(u[2]) * 255), 0, 255), r[o * 4 + 3] = mo(Math.round(fo(u[3]) * 255), 0, 255);
  }
  return r;
}
function yp(e, t) {
  const n = Hl(e), i = fo(Number.isFinite(t) ? t : 0), o = mo(Math.round(i * 255), 0, 255) * 4;
  return [n[o] / 255, n[o + 1] / 255, n[o + 2] / 255, n[o + 3] / 255];
}
const Hi = (e) => typeof e == "number" && Number.isFinite(e);
function Ks(e, t = "corner") {
  const n = Math.max(1, Math.floor(e.columns) || 1), i = Math.max(1, Math.floor(e.rows) || 1), r = e.xStep, o = e.yStep;
  let s = e.xStart, a = e.yStart;
  return t === "center" && (s = e.xStart - r * 0.5, a = e.yStart - o * 0.5), {
    x0: s,
    y0: a,
    xExtent: n * r,
    yExtent: i * o,
    columns: n,
    rows: i,
    xStep: r,
    yStep: o
  };
}
function Yl(e, t = "corner") {
  const n = Ks(e, t), i = n.x0 + n.xExtent, r = n.y0 + n.yExtent;
  return {
    xMin: Math.min(n.x0, i),
    xMax: Math.max(n.x0, i),
    yMin: Math.min(n.y0, r),
    yMax: Math.max(n.y0, r)
  };
}
function gp(e, t, n, i = "corner") {
  if (!Hi(t) || !Hi(n) || !Hi(e.xStep) || e.xStep === 0 || !Hi(e.yStep) || e.yStep === 0) return null;
  const r = Math.floor(e.columns), o = Math.floor(e.rows);
  if (!(r >= 1) || !(o >= 1)) return null;
  const s = Ks(e, i), a = (t - s.x0) / s.xStep, l = (n - s.y0) / s.yStep;
  if (!Number.isFinite(a) || !Number.isFinite(l)) return null;
  const c = Math.floor(a), u = Math.floor(l);
  return c < 0 || c >= r || u < 0 || u >= o ? null : { i: c, j: u };
}
function xp(e, t, n, i = "corner") {
  const r = gp(e, t, n, i);
  if (!r) return null;
  const o = Ks(e, i), { i: s, j: a } = r, l = a * o.columns + s, c = e.z, u = l < c.length ? Number(c[l]) : Number.NaN, f = o.x0 + (s + 0.5) * o.xStep, d = o.y0 + (a + 0.5) * o.yStep;
  return { i: s, j: a, z: u, x: f, y: d, dataIndex: l };
}
function bp(e, t, n = "linear") {
  const i = Math.max(0, Math.min(t, e.length));
  let r = Number.POSITIVE_INFINITY, o = Number.NEGATIVE_INFINITY;
  for (let s = 0; s < i; s++) {
    const a = Number(e[s]);
    Number.isFinite(a) && (n === "log" && !(a > 0) || (a < r && (r = a), a > o && (o = a)));
  }
  if (!Number.isFinite(r) || !Number.isFinite(o))
    return { zMin: 0, zMax: 1 };
  if (r === o) {
    const s = r === 0 ? 1e-6 : Math.abs(r) * 1e-6;
    return { zMin: r - s, zMax: o + s };
  }
  return { zMin: r, zMax: o };
}
function vp(e, t, n, i = "linear") {
  if (!Number.isFinite(e) || !Number.isFinite(t) || !Number.isFinite(n))
    return Number.NaN;
  if (i === "log") {
    if (!(e > 0) || !(t > 0) || !(n > 0)) return Number.NaN;
    const o = Math.log(e), s = Math.log(t), a = Math.log(n);
    if (s === a) return 0;
    const l = (o - s) / (a - s);
    return Number.isFinite(l) ? Math.min(1, Math.max(0, l)) : Number.NaN;
  }
  if (t === n) return 0;
  const r = (e - t) / (n - t);
  return Number.isFinite(r) ? Math.min(1, Math.max(0, r)) : Number.NaN;
}
function Fa(e, t) {
  const n = Math.max(0, Math.min(t, e.length));
  let i = 2166136261;
  const r = new Float32Array(1), o = new Uint32Array(r.buffer);
  for (let s = 0; s < n; s++) {
    const a = Number(e[s]);
    let l;
    Number.isFinite(a) ? (r[0] = a, l = o[0]) : Number.isNaN(a) ? l = 2143289344 : l = a > 0 ? 2139095040 : 4286578688, l = (l ^ Math.imul(s + 1, 2654435761)) >>> 0, i ^= l, i = Math.imul(i, 16777619) >>> 0;
  }
  return i ^= n >>> 0, i = Math.imul(i, 16777619) >>> 0, i >>> 0;
}
function Js(e) {
  if (!e || typeof e != "object") return null;
  const t = Math.floor(Number(e.columns)), n = Math.floor(Number(e.rows));
  if (!(t >= 1) || !(n >= 1) || !Hi(e.xStart) || !Hi(e.yStart) || !Hi(e.xStep) || e.xStep === 0 || !Hi(e.yStep) || e.yStep === 0) return null;
  const i = e.z, r = i && typeof i.length == "number" ? i.length : 0, o = t * n, s = Math.min(r, o);
  return {
    columns: t,
    rows: n,
    xStart: e.xStart,
    xStep: e.xStep,
    yStart: e.yStart,
    yStep: e.yStep,
    zLength: r,
    drawCells: s
  };
}
function ld(e) {
  return e === "candlestick" || e === "ohlc";
}
function MM(e) {
  return e != null && ld(e.type);
}
function wp(e) {
  const n = (e.series ?? [])[0];
  return n != null && ld(n.type);
}
const Sc = Object.freeze({
  show: !1,
  showLine: !1,
  intervalMs: null,
  showCountdown: !1,
  nowMs: null,
  formatter: null,
  outOfDomain: "clamp",
  color: null,
  lineColor: null,
  lineWidth: 1
});
let Cc = !1;
const Np = () => {
  Cc || (Cc = !0, console.warn("[ChartGPU] priceLabel.showCountdown requires a finite intervalMs > 0; countdown disabled."));
}, Mp = (e) => typeof e != "number" || !Number.isFinite(e) || e <= 0 ? null : e, Sp = (e) => typeof e == "number" && Number.isFinite(e) && e > 0 ? e : 1, Fc = (e) => typeof e == "string" ? e : null;
function Ac(e, t) {
  if (e === !1)
    return Sc;
  if (e === void 0)
    return t.candlePrimary ? {
      show: !0,
      showLine: !0,
      intervalMs: null,
      showCountdown: !1,
      nowMs: null,
      formatter: null,
      outOfDomain: "clamp",
      color: null,
      lineColor: null,
      lineWidth: 1
    } : Sc;
  if (e === !0)
    return {
      show: !0,
      showLine: !0,
      intervalMs: null,
      showCountdown: !1,
      nowMs: null,
      formatter: null,
      outOfDomain: "clamp",
      color: null,
      lineColor: null,
      lineWidth: 1
    };
  const n = e.show ?? !0, i = Mp(e.intervalMs), r = n ? e.showLine ?? n : !1;
  n && e.showCountdown === !0 && i == null && Np();
  const o = n && i != null && (e.showCountdown ?? !0), s = e.outOfDomain === "hide" ? "hide" : "clamp", a = typeof e.nowMs == "function" ? e.nowMs : null, l = typeof e.formatter == "function" ? e.formatter : null;
  return {
    show: n,
    showLine: r,
    intervalMs: i,
    showCountdown: o,
    nowMs: a,
    formatter: l,
    outOfDomain: s,
    color: Fc(e.color),
    lineColor: Fc(e.lineColor),
    lineWidth: Sp(e.lineWidth)
  };
}
const Cp = ["#00E5FF", "#FF2D95", "#B026FF", "#00F5A0", "#FFD300", "#FF6B00", "#4D5BFF", "#FF3D3D"], Fp = {
  backgroundColor: "#1a1a2e",
  textColor: "#e0e0e0",
  axisLineColor: "rgba(224,224,224,0.35)",
  axisTickColor: "rgba(224,224,224,0.55)",
  gridLineColor: "rgba(255,255,255,0.1)",
  colorPalette: [...Cp],
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  fontSize: 12
}, Ap = ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD", "#8C564B", "#E377C2", "#17BECF"], Ip = {
  backgroundColor: "#ffffff",
  textColor: "#333333",
  axisLineColor: "rgba(0,0,0,0.35)",
  axisTickColor: "rgba(0,0,0,0.55)",
  gridLineColor: "rgba(0,0,0,0.1)",
  colorPalette: [...Ap],
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  fontSize: 12
};
function Aa(e) {
  return e === "dark" ? Fp : Ip;
}
function hn(e) {
  return typeof e == "object" && e !== null && e.__ring === !0 && typeof e.capacity == "number";
}
function bn(e) {
  return typeof e == "object" && e !== null && e.__stagingRing === !0 && typeof e.count == "number";
}
function Pp(e, t, n, i, r, o, s) {
  let a;
  if (o && o.__stagingRing ? (o.staging = e, o.start = t, o.capacity = n, o.count = i, o.xOffset = r, o.contentEpoch = (o.contentEpoch | 0) + 1, a = o) : a = {
    __stagingRing: !0,
    staging: e,
    start: t,
    capacity: n,
    count: i,
    xOffset: r,
    contentEpoch: 1
  }, (s == null ? void 0 : s.newBatchAllFinite) === !0) {
    const l = Vn.get(a);
    (!l || l.hadGaps === !1) && Vn.set(a, {
      hadGaps: !1,
      sticky: !1,
      count: a.count,
      contentEpoch: a.contentEpoch
    });
  } else (s == null ? void 0 : s.newBatchAllFinite) === !1 && Vn.set(a, {
    hadGaps: !0,
    sticky: !1,
    count: a.count,
    contentEpoch: a.contentEpoch
  });
  return a;
}
function cd(e) {
  const t = e.capacity > 0 ? e.capacity : Math.max(1, e.count), n = yo(t);
  for (let i = 0; i < e.count; i++) {
    const r = e.capacity > 0 ? (e.start + i) % e.capacity : i;
    n.x[i] = e.staging[r * 2] + e.xOffset, n.y[i] = e.staging[r * 2 + 1];
  }
  return n.start = 0, n.count = e.count, e.count > 0 && (n.contentEpoch = (n.contentEpoch | 0) + 1), n;
}
function Zi(e) {
  return hn(e) || bn(e) ? !1 : typeof e == "object" && e !== null && !Array.isArray(e) && "x" in e && "y" in e && typeof e.x == "object" && typeof e.y == "object" && "length" in e.x && "length" in e.y;
}
function yo(e, t = !1) {
  const n = Math.max(1, e | 0), i = {
    __ring: !0,
    x: new Float64Array(n),
    y: new Float64Array(n),
    start: 0,
    count: 0,
    capacity: n,
    contentEpoch: 0,
    rewriteGen: 0
  };
  return t && (i.size = new Float64Array(n)), i;
}
function Tp(e) {
  if (e.size) return e.size;
  const t = new Float64Array(e.capacity);
  return t.fill(Number.NaN), e.size = t, t;
}
function ud(e, t, n, i, r) {
  const o = e.capacity;
  (r > 0 || i > 0) && (e.contentEpoch = (e.contentEpoch | 0) + 1);
  let s = !1;
  if (r > 0 && (r >= e.count ? (e.start = 0, e.count = 0, e.rewriteGen = (e.rewriteGen | 0) + 1, s = !0) : (e.start = (e.start + r) % o, e.count -= r)), i <= 0) {
    if (r > 0) {
      const f = Vn.get(e);
      f && f.hadGaps === !1 && !s ? Vn.set(e, {
        hadGaps: !1,
        sticky: !1,
        count: e.count,
        contentEpoch: e.contentEpoch
      }) : s && Vn.set(e, {
        hadGaps: !1,
        sticky: !1,
        count: 0,
        contentEpoch: e.contentEpoch
      });
    }
    return;
  }
  let a = (e.start + e.count) % o, l = e.size, c = !1;
  for (let f = 0; f < i; f++) {
    const d = n + f, m = Te(t, d), p = ht(t, d);
    e.x[a] = m, e.y[a] = p, (!Number.isFinite(m) || !Number.isFinite(p)) && (c = !0);
    const y = Sn(t, d);
    y !== void 0 ? (l || (l = Tp(e)), l[a] = y) : l && (l[a] = Number.NaN), a++, a >= o && (a = 0);
  }
  e.count = Math.min(o, e.count + i);
  const u = Vn.get(e);
  c ? Vn.set(e, {
    hadGaps: !0,
    sticky: !1,
    count: e.count,
    contentEpoch: e.contentEpoch
  }) : s || e.count === i ? Vn.set(e, {
    hadGaps: !1,
    sticky: !1,
    count: e.count,
    contentEpoch: e.contentEpoch
  }) : u && u.hadGaps === !1 && Vn.set(e, {
    hadGaps: !1,
    sticky: !1,
    count: e.count,
    contentEpoch: e.contentEpoch
  });
}
function Ki(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && ArrayBuffer.isView(e);
}
function qi(e) {
  return Array.isArray(e);
}
function $e(e) {
  if (hn(e) || bn(e))
    return e.count;
  if (Zi(e))
    return Math.min(e.x.length, e.y.length);
  if (Ki(e)) {
    if (e instanceof DataView)
      throw new Error(
        "DataView is not supported for InterleavedXYData. Use typed arrays (Float32Array, Float64Array, etc.)."
      );
    return Math.floor(e.length / 2);
  }
  return e.length;
}
function Te(e, t) {
  if (hn(e))
    return t < 0 || t >= e.count ? NaN : e.x[(e.start + t) % e.capacity];
  if (bn(e)) {
    if (t < 0 || t >= e.count) return NaN;
    const i = e.capacity > 0 ? (e.start + t) % e.capacity : t;
    return e.staging[i * 2] + e.xOffset;
  }
  if (Zi(e))
    return e.x[t];
  if (Ki(e)) {
    if (e instanceof DataView)
      throw new Error(
        "DataView is not supported for InterleavedXYData. Use typed arrays (Float32Array, Float64Array, etc.)."
      );
    return e[t * 2];
  }
  const n = e[t];
  return n == null || typeof n != "object" ? NaN : qi(n) ? n[0] : n.x;
}
function ht(e, t) {
  if (hn(e))
    return t < 0 || t >= e.count ? NaN : e.y[(e.start + t) % e.capacity];
  if (bn(e)) {
    if (t < 0 || t >= e.count) return NaN;
    const i = e.capacity > 0 ? (e.start + t) % e.capacity : t;
    return e.staging[i * 2 + 1];
  }
  if (Zi(e))
    return e.y[t];
  if (Ki(e)) {
    if (e instanceof DataView)
      throw new Error(
        "DataView is not supported for InterleavedXYData. Use typed arrays (Float32Array, Float64Array, etc.)."
      );
    return e[t * 2 + 1];
  }
  const n = e[t];
  return n == null || typeof n != "object" ? NaN : qi(n) ? n[1] : n.y;
}
function Sn(e, t) {
  var i;
  if (hn(e)) {
    if (!e.size || t < 0 || t >= e.count) return;
    const r = e.size[(e.start + t) % e.capacity];
    return typeof r == "number" && Number.isFinite(r) ? r : void 0;
  }
  if (bn(e))
    return;
  if (Zi(e))
    return (i = e.size) == null ? void 0 : i[t];
  if (Ki(e))
    return;
  const n = e[t];
  if (!(n == null || typeof n != "object"))
    return qi(n) ? n[2] : n.size;
}
const Ic = /* @__PURE__ */ new WeakMap();
function Bp(e) {
  if (e != null && typeof e == "object") {
    const n = Ic.get(e);
    if (n !== void 0) return n;
  }
  let t = !1;
  if (hn(e)) {
    if (e.size) {
      const n = e.count, i = e.capacity;
      let r = e.start;
      for (let o = 0; o < n; o++) {
        const s = e.size[r];
        if (typeof s == "number" && Number.isFinite(s)) {
          t = !0;
          break;
        }
        r++, r >= i && (r = 0);
      }
    }
  } else if (Zi(e)) {
    if (e.size) {
      const n = Math.min(e.x.length, e.y.length, e.size.length);
      for (let i = 0; i < n; i++)
        if (e.size[i] !== void 0) {
          t = !0;
          break;
        }
    }
  } else if (Ki(e))
    t = !1;
  else {
    const n = e;
    for (let i = 0; i < n.length; i++) {
      const r = n[i];
      if (!(r == null || typeof r != "object")) {
        if (qi(r)) {
          if (r.length >= 3 && r[2] !== void 0) {
            t = !0;
            break;
          }
        } else if (r.size !== void 0) {
          t = !0;
          break;
        }
      }
    }
  }
  return e != null && typeof e == "object" && Ic.set(e, t), t;
}
function Jr(e, t, n, i, r, o) {
  const s = $e(n) - i, a = Math.min(r, s);
  if (a <= 0) return;
  const l = t + a * 2;
  if (l > e.length)
    throw new Error(`packXYInto: output buffer too small (need ${l} floats, have ${e.length})`);
  if (hn(n)) {
    const f = n.capacity;
    let d = (n.start + i) % f;
    for (let m = 0; m < a; m++) {
      const p = t + m * 2;
      e[p] = n.x[d] - o, e[p + 1] = n.y[d], d++, d >= f && (d = 0);
    }
    return;
  }
  if (bn(n)) {
    const f = n.xOffset - o, d = n.capacity;
    let m = d > 0 ? (n.start + i) % d : i;
    for (let p = 0; p < a; p++) {
      const y = t + p * 2;
      e[y] = n.staging[m * 2] + f, e[y + 1] = n.staging[m * 2 + 1], d > 0 ? (m++, m >= d && (m = 0)) : m++;
    }
    return;
  }
  if (Zi(n)) {
    const f = n.x, d = n.y;
    let m = t, p = i;
    const y = i + a;
    if (o === 0) {
      const g = y - 3;
      for (; p < g; p += 4, m += 8)
        e[m] = f[p], e[m + 1] = d[p], e[m + 2] = f[p + 1], e[m + 3] = d[p + 1], e[m + 4] = f[p + 2], e[m + 5] = d[p + 2], e[m + 6] = f[p + 3], e[m + 7] = d[p + 3];
      for (; p < y; p++, m += 2)
        e[m] = f[p], e[m + 1] = d[p];
    } else
      for (; p < y; p++, m += 2)
        e[m] = f[p] - o, e[m + 1] = d[p];
    return;
  }
  if (Ki(n)) {
    if (n instanceof DataView)
      throw new Error(
        "DataView is not supported for InterleavedXYData. Use typed arrays (Float32Array, Float64Array, etc.)."
      );
    const f = n;
    if (f instanceof Float32Array && o === 0 && Number.isFinite(t) && t >= 0) {
      const d = i * 2, m = d + a * 2;
      e.set(f.subarray(d, m), t);
      return;
    }
    for (let d = 0; d < a; d++) {
      const m = (i + d) * 2, p = t + d * 2;
      e[p] = f[m] - o, e[p + 1] = f[m + 1];
    }
    return;
  }
  const c = n;
  let u = !1;
  for (let f = 0; f < a; f++) {
    const d = c[i + f];
    if (d != null && typeof d == "object") {
      u = Array.isArray(d);
      break;
    }
  }
  if (u) {
    let f = o === 0 && a > 0;
    if (f) {
      const d = c[i], m = c[i + a - 1];
      if (d == null || !Array.isArray(d) || m == null || !Array.isArray(m))
        f = !1;
      else
        for (let p = 1; p < a - 1; p++) {
          const y = c[i + p];
          if (y == null || !Array.isArray(y)) {
            f = !1;
            break;
          }
        }
    }
    if (f) {
      let d = t;
      const m = i + a;
      for (let p = i; p < m; p++, d += 2) {
        const y = c[p];
        e[d] = y[0], e[d + 1] = y[1];
      }
      return;
    }
    for (let d = 0; d < a; d++) {
      const m = i + d, p = t + d * 2, y = c[m];
      if (y == null || typeof y != "object") {
        e[p] = NaN, e[p + 1] = NaN;
        continue;
      }
      Array.isArray(y) ? (e[p] = y[0] - o, e[p + 1] = y[1]) : (e[p] = y.x - o, e[p + 1] = y.y);
    }
    return;
  }
  for (let f = 0; f < a; f++) {
    const d = i + f, m = t + f * 2, p = c[d];
    if (p == null || typeof p != "object") {
      e[m] = NaN, e[m + 1] = NaN;
      continue;
    }
    if (Array.isArray(p)) {
      e[m] = p[0] - o, e[m + 1] = p[1];
      continue;
    }
    const y = p.x, g = p.y;
    e[m] = y - o, e[m + 1] = g;
  }
}
function Rn(e) {
  let t = Number.POSITIVE_INFINITY, n = Number.NEGATIVE_INFINITY, i = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  if (hn(e)) {
    const o = e.count, s = e.capacity;
    let a = e.start;
    for (let l = 0; l < o; l++) {
      const c = e.x[a], u = e.y[a];
      a++, a >= s && (a = 0), !(!Number.isFinite(c) || !Number.isFinite(u)) && (c < t && (t = c), c > n && (n = c), u < i && (i = u), u > r && (r = u));
    }
  } else if (bn(e)) {
    const o = e.count, s = e.capacity, a = e.xOffset;
    let l = s > 0 ? e.start : 0;
    for (let c = 0; c < o; c++) {
      const u = e.staging[l * 2] + a, f = e.staging[l * 2 + 1];
      s > 0 ? (l++, l >= s && (l = 0)) : l++, !(!Number.isFinite(u) || !Number.isFinite(f)) && (u < t && (t = u), u > n && (n = u), f < i && (i = f), f > r && (r = f));
    }
  } else if (Zi(e)) {
    const o = Math.min(e.x.length, e.y.length);
    for (let s = 0; s < o; s++) {
      const a = e.x[s], l = e.y[s];
      !Number.isFinite(a) || !Number.isFinite(l) || (a < t && (t = a), a > n && (n = a), l < i && (i = l), l > r && (r = l));
    }
  } else if (Ki(e)) {
    if (e instanceof DataView)
      throw new Error(
        "DataView is not supported for InterleavedXYData. Use typed arrays (Float32Array, Float64Array, etc.)."
      );
    const o = e, s = Math.floor(o.length / 2);
    for (let a = 0; a < s; a++) {
      const l = o[a * 2], c = o[a * 2 + 1];
      !Number.isFinite(l) || !Number.isFinite(c) || (l < t && (t = l), l > n && (n = l), c < i && (i = c), c > r && (r = c));
    }
  } else {
    const o = e.length;
    for (let s = 0; s < o; s++) {
      const a = e[s];
      if (a == null || typeof a != "object") continue;
      let l, c;
      Array.isArray(a) ? (l = a[0], c = a[1]) : (l = a.x, c = a.y), !(!Number.isFinite(l) || !Number.isFinite(c)) && (l < t && (t = l), l > n && (n = l), c < i && (i = c), c > r && (r = c));
    }
  }
  return !Number.isFinite(t) || !Number.isFinite(n) || !Number.isFinite(i) || !Number.isFinite(r) ? null : (t === n && (n = t + 1), i === r && (r = i + 1), { xMin: t, xMax: n, yMin: i, yMax: r });
}
function Rp(e) {
  let t = Number.POSITIVE_INFINITY, n = Number.NEGATIVE_INFINITY;
  if (hn(e)) {
    const i = e.count, r = e.capacity;
    let o = e.start;
    for (let s = 0; s < i; s++) {
      const a = e.x[o];
      o++, o >= r && (o = 0), Number.isFinite(a) && (a < t && (t = a), a > n && (n = a));
    }
  } else if (bn(e)) {
    const i = e.count, r = e.capacity, o = e.xOffset;
    let s = r > 0 ? e.start : 0;
    for (let a = 0; a < i; a++) {
      const l = e.staging[s * 2] + o;
      r > 0 ? (s++, s >= r && (s = 0)) : s++, Number.isFinite(l) && (l < t && (t = l), l > n && (n = l));
    }
  } else if (Zi(e)) {
    const i = e.x.length;
    for (let r = 0; r < i; r++) {
      const o = e.x[r];
      Number.isFinite(o) && (o < t && (t = o), o > n && (n = o));
    }
  } else if (Ki(e)) {
    if (e instanceof DataView)
      throw new Error(
        "DataView is not supported for InterleavedXYData. Use typed arrays (Float32Array, Float64Array, etc.)."
      );
    const i = e, r = Math.floor(i.length / 2);
    for (let o = 0; o < r; o++) {
      const s = i[o * 2];
      Number.isFinite(s) && (s < t && (t = s), s > n && (n = s));
    }
  } else {
    const i = e.length;
    for (let r = 0; r < i; r++) {
      const o = e[r];
      if (o == null || typeof o != "object") continue;
      const s = Array.isArray(o) ? o[0] : o.x;
      Number.isFinite(s) && (s < t && (t = s), s > n && (n = s));
    }
  }
  return !Number.isFinite(t) || !Number.isFinite(n) ? null : (t === n && (n = t + 1), { xMin: t, xMax: n });
}
const Vn = /* @__PURE__ */ new WeakMap();
function Dp(e) {
  if (hn(e) || bn(e)) {
    const t = typeof e.contentEpoch == "number" && Number.isFinite(e.contentEpoch) ? e.contentEpoch | 0 : 0;
    return { count: e.count, contentEpoch: t };
  }
  return { count: $e(e), contentEpoch: 0 };
}
function Fo(e) {
  if (e == null || typeof e != "object") return !1;
  const t = e, n = hn(e) || bn(e), i = Dp(e), r = Vn.get(t);
  if (n) {
    if (r && r.sticky === !1 && r.count === i.count && r.contentEpoch === i.contentEpoch)
      return r.hadGaps;
  } else if ((r == null ? void 0 : r.sticky) === !0 && r.hadGaps === !0)
    return !0;
  const s = (() => {
    if (Array.isArray(e)) {
      for (let l = 0; l < e.length; l++) {
        const c = e[l];
        if (c == null || typeof c != "object") return !0;
        const u = qi(c) ? c[0] : c.x, f = qi(c) ? c[1] : c.y;
        if (!Number.isFinite(u) || !Number.isFinite(f)) return !0;
      }
      return !1;
    }
    const a = i.count;
    for (let l = 0; l < a; l++) {
      const c = Te(e, l), u = ht(e, l);
      if (!Number.isFinite(c) || !Number.isFinite(u)) return !0;
    }
    return !1;
  })();
  return n ? Vn.set(t, {
    hadGaps: s,
    sticky: !1,
    count: i.count,
    contentEpoch: i.contentEpoch
  }) : s && Vn.set(t, { hadGaps: !0, sticky: !0 }), s;
}
function fd(e, t, n, i) {
  if (!(n <= 0)) {
    if (n >= e.length) {
      e.length = 0, t.length = 0, i && (i.length = 0);
      return;
    }
    e.copyWithin(0, n), t.copyWithin(0, n), e.length -= n, t.length -= n, i && (i.copyWithin(0, n), i.length -= n);
  }
}
function dd(e) {
  if (Array.isArray(e))
    return e.filter((i) => {
      if (i == null || typeof i != "object") return !1;
      const r = qi(i) ? i[0] : i.x, o = qi(i) ? i[1] : i.y;
      return Number.isFinite(r) && Number.isFinite(o);
    });
  const t = $e(e), n = [];
  for (let i = 0; i < t; i++) {
    const r = Te(e, i), o = ht(e, i);
    Number.isFinite(r) && Number.isFinite(o) && n.push([r, o]);
  }
  return n;
}
function ki(e) {
  return Array.isArray(e);
}
function kp(e, t) {
  const n = $e(e), i = n - 1;
  if (t <= 0 || n === 0) return new Int32Array(0);
  if (t === 1) return new Int32Array([0]);
  if (t === 2) return n >= 2 ? new Int32Array([0, i]) : new Int32Array([0]);
  if (n <= t) {
    const u = new Int32Array(n);
    for (let f = 0; f < n; f++) u[f] = f;
    return u;
  }
  const r = new Int32Array(t);
  r[0] = 0, r[t - 1] = i;
  const o = (n - 2) / (t - 2);
  let s = 0, a = 1;
  const l = Te(e, i), c = ht(e, i);
  for (let u = 0; u < t - 2; u++) {
    let f = Math.floor(o * u) + 1, d = Math.min(Math.floor(o * (u + 1)) + 1, i);
    f >= d && (f = Math.min(f, i - 1), d = Math.min(f + 1, i));
    const m = Math.floor(o * (u + 1)) + 1, p = Math.min(Math.floor(o * (u + 2)) + 1, i);
    let y = l, g = c;
    if (m < p) {
      let b = 0, v = 0, x = 0;
      for (let F = m; F < p; F++)
        b += Te(e, F), v += ht(e, F), x++;
      x > 0 && (y = b / x, g = v / x);
    }
    const S = Te(e, s), A = ht(e, s);
    let M = -1, h = f;
    for (let b = f; b < d; b++) {
      const v = Te(e, b), x = ht(e, b), F = (S - y) * (x - A) - (S - v) * (g - A), I = F < 0 ? -F : F;
      I > M && (M = I, h = b);
    }
    r[a++] = h, s = h;
  }
  return r;
}
function Qr(e, t) {
  const n = $e(e), i = Math.floor(t);
  if (i <= 0 || n === 0) return [];
  if (n <= i) {
    const s = new Array(n);
    for (let a = 0; a < n; a++) {
      const l = Sn(e, a);
      s[a] = l !== void 0 ? [Te(e, a), ht(e, a), l] : [Te(e, a), ht(e, a)];
    }
    return s;
  }
  const r = kp(e, i), o = new Array(r.length);
  for (let s = 0; s < r.length; s++) {
    const a = r[s], l = Sn(e, a);
    o[s] = l !== void 0 ? [Te(e, a), ht(e, a), l] : [Te(e, a), ht(e, a)];
  }
  return o;
}
function Ep(e, t) {
  const n = e.length >>> 1, i = n - 1;
  if (t <= 0 || n === 0) return new Int32Array(0);
  if (t === 1) return new Int32Array([0]);
  if (t === 2) return n >= 2 ? new Int32Array([0, i]) : new Int32Array([0]);
  if (n <= t) {
    const u = new Int32Array(n);
    for (let f = 0; f < n; f++) u[f] = f;
    return u;
  }
  const r = new Int32Array(t);
  r[0] = 0, r[t - 1] = i;
  const o = (n - 2) / (t - 2);
  let s = 0, a = 1;
  const l = e[i * 2 + 0], c = e[i * 2 + 1];
  for (let u = 0; u < t - 2; u++) {
    let f = Math.floor(o * u) + 1, d = Math.min(Math.floor(o * (u + 1)) + 1, i);
    f >= d && (f = Math.min(f, i - 1), d = Math.min(f + 1, i));
    const m = Math.floor(o * (u + 1)) + 1, p = Math.min(Math.floor(o * (u + 2)) + 1, i);
    let y = l, g = c;
    if (m < p) {
      let b = 0, v = 0, x = 0;
      for (let F = m; F < p; F++)
        b += e[F * 2 + 0], v += e[F * 2 + 1], x++;
      x > 0 && (y = b / x, g = v / x);
    }
    const S = e[s * 2 + 0], A = e[s * 2 + 1];
    let M = -1, h = f;
    for (let b = f; b < d; b++) {
      const v = e[b * 2 + 0], x = e[b * 2 + 1], F = (S - y) * (x - A) - (S - v) * (g - A), I = F < 0 ? -F : F;
      I > M && (M = I, h = b);
    }
    r[a++] = h, s = h;
  }
  return r;
}
function Lp(e, t) {
  const n = e.length, i = n - 1;
  if (t <= 0 || n === 0) return new Int32Array(0);
  if (t === 1) return new Int32Array([0]);
  if (t === 2) return n >= 2 ? new Int32Array([0, i]) : new Int32Array([0]);
  if (n <= t) {
    const f = new Int32Array(n);
    for (let d = 0; d < n; d++) f[d] = d;
    return f;
  }
  const r = new Int32Array(t);
  r[0] = 0, r[t - 1] = i;
  const o = (n - 2) / (t - 2);
  let s = 0, a = 1;
  const l = e[i], c = ki(l) ? l[0] : l.x, u = ki(l) ? l[1] : l.y;
  for (let f = 0; f < t - 2; f++) {
    let d = Math.floor(o * f) + 1, m = Math.min(Math.floor(o * (f + 1)) + 1, i);
    d >= m && (d = Math.min(d, i - 1), m = Math.min(d + 1, i));
    const p = Math.floor(o * (f + 1)) + 1, y = Math.min(Math.floor(o * (f + 2)) + 1, i);
    let g = c, S = u;
    if (p < y) {
      let x = 0, F = 0, I = 0;
      for (let R = p; R < y; R++) {
        const T = e[R], N = ki(T) ? T[0] : T.x, w = ki(T) ? T[1] : T.y;
        x += N, F += w, I++;
      }
      I > 0 && (g = x / I, S = F / I);
    }
    const A = e[s], M = ki(A) ? A[0] : A.x, h = ki(A) ? A[1] : A.y;
    let b = -1, v = d;
    for (let x = d; x < m; x++) {
      const F = e[x], I = ki(F) ? F[0] : F.x, R = ki(F) ? F[1] : F.y, T = (M - g) * (R - h) - (M - I) * (S - h), N = T < 0 ? -T : T;
      N > b && (b = N, v = x);
    }
    r[a++] = v, s = v;
  }
  return r;
}
function Up(e, t) {
  const n = Math.floor(t);
  if (e instanceof Float32Array) {
    const s = e.length >>> 1;
    if (n <= 0 || s === 0) return new Float32Array(0);
    if (s <= n) return e;
    const a = Ep(e, n), l = new Float32Array(a.length * 2);
    for (let c = 0; c < a.length; c++) {
      const u = a[c];
      l[c * 2 + 0] = e[u * 2 + 0], l[c * 2 + 1] = e[u * 2 + 1];
    }
    return l;
  }
  const i = e.length;
  if (n <= 0 || i === 0) return [];
  if (i <= n) return e;
  const r = Lp(e, n), o = new Array(r.length);
  for (let s = 0; s < r.length; s++)
    o[s] = e[r[s]];
  return o;
}
function md(e) {
  const t = Math.floor(e);
  return Number.isFinite(t) ? t : 0;
}
function _p(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && "x" in e && "y" in e && typeof e.x == "object" && typeof e.y == "object" && "length" in e.x && "length" in e.y;
}
function zp(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && ArrayBuffer.isView(e);
}
function Ia(e, t, n) {
  const i = $e(e), r = md(t);
  if (r <= 0 || i === 0) return [];
  if (r === 1) {
    const l = Te(e, 0), c = ht(e, 0), u = Sn(e, 0);
    return u !== void 0 ? [[l, c, u]] : [[l, c]];
  }
  if (r === 2)
    if (i >= 2) {
      const l = Te(e, 0), c = ht(e, 0), u = Sn(e, 0), f = Te(e, i - 1), d = ht(e, i - 1), m = Sn(e, i - 1);
      return [
        u !== void 0 ? [l, c, u] : [l, c],
        m !== void 0 ? [f, d, m] : [f, d]
      ];
    } else {
      const l = Te(e, 0), c = ht(e, 0), u = Sn(e, 0);
      return u !== void 0 ? [[l, c, u]] : [[l, c]];
    }
  const o = i - 1, s = new Array(r);
  {
    const l = Te(e, 0), c = ht(e, 0), u = Sn(e, 0);
    s[0] = u !== void 0 ? [l, c, u] : [l, c];
    const f = Te(e, o), d = ht(e, o), m = Sn(e, o);
    s[r - 1] = m !== void 0 ? [f, d, m] : [f, d];
  }
  const a = (i - 2) / (r - 2);
  for (let l = 0; l < r - 2; l++) {
    let c = Math.floor(a * l) + 1, u = Math.min(Math.floor(a * (l + 1)) + 1, o);
    c >= u && (c = Math.min(c, o - 1), u = Math.min(c + 1, o));
    let f = null;
    if (n === "average") {
      let d = 0, m = 0, p = 0, y = 0, g = 0;
      for (let S = c; S < u; S++) {
        const A = Te(e, S), M = ht(e, S);
        if (!Number.isFinite(A) || !Number.isFinite(M)) continue;
        d += A, m += M, y++;
        const h = Sn(e, S);
        typeof h == "number" && Number.isFinite(h) && (p += h, g++);
      }
      if (y > 0) {
        const S = d / y, A = m / y;
        g > 0 ? f = [S, A, p / g] : f = [S, A];
      }
    } else {
      let d = n === "max" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY, m = c;
      for (let S = c; S < u; S++) {
        const A = ht(e, S);
        Number.isFinite(A) && (n === "max" ? A > d && (d = A, m = S) : A < d && (d = A, m = S));
      }
      const p = Te(e, m), y = ht(e, m), g = Sn(e, m);
      f = g !== void 0 ? [p, y, g] : [p, y];
    }
    if (f === null) {
      const d = Te(e, c), m = ht(e, c), p = Sn(e, c);
      f = p !== void 0 ? [d, m, p] : [d, m];
    }
    s[l + 1] = f;
  }
  return s;
}
function Fi(e, t, n) {
  const i = md(n), r = $e(e);
  if (t === "none" || !(i > 0) || r <= i) return e;
  switch (t) {
    case "lttb": {
      if (e instanceof Float32Array)
        return Up(e, i);
      if (e instanceof Float64Array || zp(e) || _p(e))
        return Qr(e, i);
      const o = e;
      if (Fo(e)) {
        const s = o.filter((a) => a !== null);
        return Qr(s, i);
      }
      return Qr(o, i);
    }
    case "average":
      return Ia(e, i, "average");
    case "max":
      return Ia(e, i, "max");
    case "min":
      return Ia(e, i, "min");
    default:
      return e;
  }
}
function Gp(e) {
  return Array.isArray(e);
}
function wl(e, t) {
  const n = Math.floor(t), i = e.length;
  if (n < 2 || i <= n) return e;
  const r = new Array(n);
  if (r[0] = e[0], r[n - 1] = e[i - 1], n === 2) return r;
  const o = Gp(e[0]), s = (i - 2) / (n - 2);
  if (o) {
    const a = e;
    for (let l = 0; l < n - 2; l++) {
      let c = Math.floor(s * l) + 1, u = Math.min(Math.floor(s * (l + 1)) + 1, i - 1);
      c >= u && (c = Math.min(c, i - 2), u = Math.min(c + 1, i - 1));
      const f = a[c], d = a[u - 1], m = f[0], p = f[1], y = d[2];
      let g = -1 / 0, S = 1 / 0;
      for (let A = c; A < u; A++) {
        const M = a[A], h = M[3], b = M[4];
        b > g && (g = b), h < S && (S = h);
      }
      r[l + 1] = [m, p, y, S, g];
    }
  } else {
    const a = e;
    for (let l = 0; l < n - 2; l++) {
      let c = Math.floor(s * l) + 1, u = Math.min(Math.floor(s * (l + 1)) + 1, i - 1);
      c >= u && (c = Math.min(c, i - 2), u = Math.min(c + 1, i - 1));
      const f = a[c], d = a[u - 1], m = f.timestamp, p = f.open, y = d.close;
      let g = -1 / 0, S = 1 / 0;
      for (let A = c; A < u; A++) {
        const M = a[A], h = M.high, b = M.low;
        h > g && (g = h), b < S && (S = b);
      }
      r[l + 1] = { timestamp: m, open: p, close: y, low: S, high: g };
    }
  }
  return r;
}
function Ao(e) {
  if (typeof e != "string") return "";
  const t = e.trim();
  return t.length > 0 ? t : "";
}
function Yr(e) {
  return Ao(e.stack) === "" ? !1 : e.type === "area" || e.type === "line" && e.areaStyle != null;
}
function pd(e) {
  return e.sampling === "none" ? e.rawData ?? e.data ?? [] : e.data ?? e.rawData ?? [];
}
function Op(e) {
  const t = pd(e);
  return e.connectNulls ? dd(t) : t;
}
function Hp(e) {
  if (e.length <= 1) return !0;
  const t = $e(e[0].data);
  for (let n = 1; n < e.length; n++)
    if ($e(e[n].data) !== t) return !1;
  for (let n = 0; n < t; n++) {
    const i = Te(e[0].data, n), r = Number.isFinite(i);
    for (let o = 1; o < e.length; o++) {
      const s = Te(e[o].data, n), a = Number.isFinite(s);
      if (r !== a || r && s !== i) return !1;
    }
  }
  return !0;
}
function Yp(e) {
  const t = e.length === 0 ? 0 : $e(e[0].data), n = new Float64Array(t), i = new Float64Array(t), r = [];
  for (let o = 0; o < e.length; o++) {
    const s = e[o], a = s.data, l = new Float64Array(t), c = new Float64Array(t);
    for (let u = 0; u < t; u++) {
      const f = Te(a, u), d = ht(a, u);
      if (!Number.isFinite(f) || !Number.isFinite(d)) {
        l[u] = Number.NaN, c[u] = Number.NaN;
        continue;
      }
      if (d >= 0) {
        const m = n[u];
        l[u] = m, c[u] = m + d, n[u] = c[u];
      } else {
        const m = i[u];
        l[u] = m, c[u] = m + d, i[u] = c[u];
      }
    }
    r.push({ seriesIndex: s.seriesIndex, yBottom: l, yTop: c });
  }
  return r;
}
function Wp(e) {
  const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), i = [];
  for (let r = 0; r < e.length; r++) {
    const o = e[r], s = o.data, a = $e(s), l = new Float64Array(a), c = new Float64Array(a);
    for (let u = 0; u < a; u++) {
      const f = Te(s, u), d = ht(s, u);
      if (!Number.isFinite(f) || !Number.isFinite(d)) {
        l[u] = Number.NaN, c[u] = Number.NaN;
        continue;
      }
      if (d >= 0) {
        const m = t.get(f) ?? 0;
        l[u] = m, c[u] = m + d, t.set(f, c[u]);
      } else {
        const m = n.get(f) ?? 0;
        l[u] = m, c[u] = m + d, n.set(f, c[u]);
      }
    }
    i.push({ seriesIndex: o.seriesIndex, yBottom: l, yTop: c });
  }
  return i;
}
function Qs(e) {
  return e.length === 0 ? [] : Hp(e) ? Yp(e) : Wp(e);
}
function Xp(e) {
  let t = Number.POSITIVE_INFINITY, n = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < e.length; i++) {
    const { yBottom: r, yTop: o } = e[i], s = Math.min(r.length, o.length);
    for (let a = 0; a < s; a++) {
      const l = r[a], c = o[a];
      Number.isFinite(l) && (l < t && (t = l), l > n && (n = l)), Number.isFinite(c) && (c < t && (t = c), c > n && (n = c));
    }
  }
  return !Number.isFinite(t) || !Number.isFinite(n) ? null : (t === n && (n = t + 1), { yMin: t, yMax: n });
}
function Vp(e, t, n) {
  if (!Number.isFinite(n) || e.length === 0) return null;
  let i = 0, r = 0, o = !1;
  for (let s = 0; s < e.length; s++) {
    const a = e[s].data, l = t[s];
    if (!l) continue;
    const c = $e(a);
    for (let u = 0; u < c; u++) {
      const f = Te(a, u);
      if (!Number.isFinite(f) || f !== n) continue;
      const d = l.yTop[u], m = l.yBottom[u];
      !Number.isFinite(d) || !Number.isFinite(m) || (o = !0, d > i && (i = d), m < r && (r = m), d < r && (r = d), m > i && (i = m));
    }
  }
  return o ? i > 0 && r < 0 ? i + r : i > 0 ? i : r < 0 ? r : 0 : null;
}
function $p(e) {
  const { layers: t, geometries: n, xTarget: i, yTarget: r, xTolerance: o } = e;
  if (!Number.isFinite(i) || !Number.isFinite(r)) return null;
  const s = Number.isFinite(o) && o >= 0 ? o : 0;
  let a = null;
  for (let c = 0; c < t.length; c++) {
    const u = t[c].data, f = n[c];
    if (!f) continue;
    const d = $e(u);
    for (let m = 0; m < d; m++) {
      const p = Te(u, m), y = ht(u, m), g = f.yBottom[m], S = f.yTop[m];
      if (!Number.isFinite(p) || !Number.isFinite(y) || !Number.isFinite(g) || !Number.isFinite(S)) continue;
      const A = Math.abs(p - i);
      if (A > s) continue;
      const M = Math.min(g, S), h = Math.max(g, S);
      if (r < M || r > h) continue;
      const b = {
        seriesIndex: t[c].seriesIndex,
        dataIndex: m,
        contributionY: y,
        yBottom: g,
        yTop: S,
        x: p,
        layerOrder: c,
        dx: A
      };
      (a === null || b.dx < a.dx || b.dx === a.dx && b.layerOrder > a.layerOrder) && (a = b);
    }
  }
  if (!a) return null;
  const l = Vp(t, n, a.x);
  return {
    seriesIndex: a.seriesIndex,
    dataIndex: a.dataIndex,
    contributionY: a.contributionY,
    yBottom: a.yBottom,
    yTop: a.yTop,
    stackTotal: l ?? a.yTop,
    x: a.x
  };
}
function ea(e, t) {
  const n = (t == null ? void 0 : t.includeHidden) === !0, i = /* @__PURE__ */ new Map();
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    if (!n && o.visible === !1 || !Yr(o)) continue;
    const s = Ao(o.stack), l = `${o.yAxis ?? "y"}\0${s}`;
    let c = i.get(l);
    c || (c = [], i.set(l, c)), c.push({ seriesIndex: r, series: o });
  }
  return i;
}
function hd(e, t, n) {
  const i = ea(e, { includeHidden: (n == null ? void 0 : n.includeHidden) === !0 });
  if (i.size === 0) return null;
  const r = (n == null ? void 0 : n.xWindow) != null && Number.isFinite(n.xWindow.min) && Number.isFinite(n.xWindow.max), o = r ? n.xWindow.min : 0, s = r ? n.xWindow.max : 0;
  let a = Number.POSITIVE_INFINITY, l = Number.NEGATIVE_INFINITY, c = !1;
  for (const [u, f] of i) {
    if ((u.split("\0")[0] ?? "y") !== t) continue;
    const m = f.map((y) => {
      const g = y.series, S = (n == null ? void 0 : n.preferRawData) === !0 ? g.rawData ?? g.data ?? [] : g.data ?? g.rawData ?? [];
      return { seriesIndex: y.seriesIndex, data: S };
    }), p = Qs(m);
    for (let y = 0; y < p.length; y++) {
      const g = p[y], S = m[y].data, A = Math.min(g.yBottom.length, g.yTop.length, $e(S));
      for (let M = 0; M < A; M++) {
        if (r) {
          const v = Te(S, M);
          if (!Number.isFinite(v) || v < o || v > s) continue;
        }
        const h = g.yBottom[M], b = g.yTop[M];
        Number.isFinite(h) && (c = !0, h < a && (a = h), h > l && (l = h)), Number.isFinite(b) && (c = !0, b < a && (a = b), b > l && (l = b));
      }
    }
  }
  return !c || !Number.isFinite(a) || !Number.isFinite(l) ? null : (a === l && (l = a + 1), { yMin: a, yMax: l });
}
const Pc = /* @__PURE__ */ new Set();
function Tc(e, t) {
  Pc.has(e) || (Pc.add(e), console.warn(t));
}
function yd(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && !ArrayBuffer.isView(e) && "x" in e && "y" in e && "y1" in e && typeof e.x == "object" && typeof e.y == "object" && typeof e.y1 == "object" && "length" in e.x && "length" in e.y && "length" in e.y1;
}
function gd(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && ArrayBuffer.isView(e);
}
function qp(e) {
  return Array.isArray(e);
}
function jp(e) {
  return typeof e == "object" && !!e && !Array.isArray(e) && "x" in e && "y" in e && "y1" in e;
}
function yn(e) {
  if (Array.isArray(e))
    return e.length;
  if (yd(e)) {
    const t = e.x.length | 0, n = e.y.length | 0, i = e.y1.length | 0, r = Math.min(t, n, i);
    return (t !== n || n !== i) && Tc(
      "xyy-len",
      `ChartGPU band series: x/y/y1 length mismatch (x=${t}, y=${n}, y1=${i}); using min length ${r}.`
    ), Math.max(0, r);
  }
  if (gd(e)) {
    const n = e.length | 0;
    return n % 3 !== 0 && Tc(
      "interleaved-stride",
      `ChartGPU band series: interleaved Xyy length ${n} is not a multiple of 3; truncating to ${Math.floor(n / 3)} points.`
    ), Math.max(0, Math.floor(n / 3));
  }
  return 0;
}
function cn(e, t) {
  if (t < 0) return null;
  if (Array.isArray(e)) {
    if (t >= e.length) return null;
    const n = e[t];
    if (n == null) return null;
    if (qp(n)) {
      const i = n[0], r = n[1], o = n[2];
      return !Number.isFinite(i) && !Number.isFinite(r) && !Number.isFinite(o) ? null : { x: i, y: r, y1: o };
    }
    return jp(n) ? { x: n.x, y: n.y, y1: n.y1 } : null;
  }
  if (yd(e)) {
    const n = yn(e);
    return t >= n ? null : {
      x: Number(e.x[t]),
      y: Number(e.y[t]),
      y1: Number(e.y1[t])
    };
  }
  if (gd(e)) {
    const n = e, i = yn(e);
    if (t >= i) return null;
    const r = t * 3;
    return {
      x: Number(n[r]),
      y: Number(n[r + 1]),
      y1: Number(n[r + 2])
    };
  }
  return null;
}
function Wl(e, t) {
  const n = cn(e, t);
  return n ? n.x : Number.NaN;
}
function qn(e) {
  const t = yn(e);
  let n = Number.POSITIVE_INFINITY, i = Number.NEGATIVE_INFINITY, r = Number.POSITIVE_INFINITY, o = Number.NEGATIVE_INFINITY;
  for (let s = 0; s < t; s++) {
    const a = cn(e, s);
    a && (Number.isFinite(a.x) && (a.x < n && (n = a.x), a.x > i && (i = a.x)), Number.isFinite(a.y) && (a.y < r && (r = a.y), a.y > o && (o = a.y)), Number.isFinite(a.y1) && (a.y1 < r && (r = a.y1), a.y1 > o && (o = a.y1)));
  }
  return !Number.isFinite(n) || !Number.isFinite(i) || !Number.isFinite(r) || !Number.isFinite(o) ? null : (n === i && (i = n + 1), r === o && (o = r + 1), { xMin: n, xMax: i, yMin: r, yMax: o });
}
function Zp(e, t) {
  const n = yn(e);
  let i = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  const o = t != null && Number.isFinite(t.min) && Number.isFinite(t.max), s = o ? t.min : 0, a = o ? t.max : 0;
  for (let l = 0; l < n; l++) {
    const c = cn(e, l);
    c && (o && (!Number.isFinite(c.x) || c.x < s || c.x > a) || (Number.isFinite(c.y) && (c.y < i && (i = c.y), c.y > r && (r = c.y)), Number.isFinite(c.y1) && (c.y1 < i && (i = c.y1), c.y1 > r && (r = c.y1))));
  }
  return !Number.isFinite(i) || !Number.isFinite(r) ? null : (i === r && (r = i + 1), { yMin: i, yMax: r });
}
function Kp(e, t) {
  const n = yn(e);
  let i = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  const o = t != null && Number.isFinite(t.min) && Number.isFinite(t.max), s = o ? t.min : 0, a = o ? t.max : 0;
  for (let l = 0; l < n; l++) {
    const c = cn(e, l);
    c && (o && (!Number.isFinite(c.x) || c.x < s || c.x > a) || (Number.isFinite(c.y) && c.y > 0 && (c.y < i && (i = c.y), c.y > r && (r = c.y)), Number.isFinite(c.y1) && c.y1 > 0 && (c.y1 < i && (i = c.y1), c.y1 > r && (r = c.y1))));
  }
  return !Number.isFinite(i) || !Number.isFinite(r) || !(i > 0) || !(r > 0) ? null : { yMin: i, yMax: r };
}
function go(e) {
  const t = yn(e), n = new Array(t), i = new Array(t), r = new Array(t);
  for (let o = 0; o < t; o++) {
    const s = cn(e, o);
    n[o] = s ? s.x : Number.NaN, i[o] = s ? s.y : Number.NaN, r[o] = s ? s.y1 : Number.NaN;
  }
  return { x: n, y: i, y1: r };
}
function Xl(e) {
  if (e == null) return !1;
  if (Array.isArray(e)) {
    if (e.length === 0) return !0;
    for (let t = 0; t < e.length; t++) {
      const n = e[t];
      if (n != null)
        return Array.isArray(n) ? n.length >= 3 : typeof n == "object" ? "y1" in n : !1;
    }
    return !0;
  }
  if (ArrayBuffer.isView(e)) {
    const n = e.length | 0;
    return n === 0 || n % 3 === 0;
  }
  return typeof e == "object" && "y1" in e && "x" in e && "y" in e;
}
function Jp(e, t, n) {
  const i = n ?? yn(e), r = i * 4;
  if (t.length < r)
    throw new Error(`packBandPoints: out length ${t.length} < required ${r}`);
  for (let o = 0; o < i; o++) {
    const s = cn(e, o), a = o * 4;
    if (!s) {
      t[a] = Number.NaN, t[a + 1] = Number.NaN, t[a + 2] = Number.NaN, t[a + 3] = 0;
      continue;
    }
    t[a] = Number.isFinite(s.x) ? s.x : Number.NaN, t[a + 1] = Number.isFinite(s.y) ? s.y : Number.NaN, t[a + 2] = Number.isFinite(s.y1) ? s.y1 : Number.NaN, t[a + 3] = 0;
  }
  return i;
}
function Bc(e, t, n, i) {
  const r = i ?? yn(e), o = r * 2;
  if (t.length < o)
    throw new Error(`packBandStrokeXY: out length ${t.length} < required ${o}`);
  for (let s = 0; s < r; s++) {
    const a = cn(e, s), l = s * 2;
    if (!a) {
      t[l] = Number.NaN, t[l + 1] = Number.NaN;
      continue;
    }
    const c = n === 0 ? a.y : a.y1;
    !Number.isFinite(a.x) || !Number.isFinite(c) ? (t[l] = Number.NaN, t[l + 1] = Number.NaN) : (t[l] = a.x, t[l + 1] = c);
  }
  return r;
}
function xd(e) {
  const t = yn(e);
  for (let n = 0; n < t; n++) {
    if (Array.isArray(e) && e[n] == null) return !0;
    const i = cn(e, n);
    if (!i || !Number.isFinite(i.x) || !Number.isFinite(i.y) || !Number.isFinite(i.y1)) return !0;
  }
  return !1;
}
function Qp(e) {
  const t = yn(e), n = [], i = [], r = [];
  for (let o = 0; o < t; o++) {
    const s = cn(e, o);
    s && (!Number.isFinite(s.x) || !Number.isFinite(s.y) || !Number.isFinite(s.y1) || (n.push(s.x), i.push(s.y), r.push(s.y1)));
  }
  return { x: n, y: i, y1: r };
}
function bd(e) {
  const t = Math.floor(e);
  return Number.isFinite(t) ? t : 0;
}
function eh(e, t) {
  const n = yn(e), i = bd(t);
  if (i <= 0 || n === 0) return [];
  if (i === 1) {
    const f = cn(e, 0);
    return f ? [[f.x, f.y, f.y1]] : [];
  }
  if (n <= i) {
    const f = [];
    for (let d = 0; d < n; d++) {
      const m = cn(e, d);
      m ? f.push([m.x, m.y, m.y1]) : f.push([Number.NaN, Number.NaN, Number.NaN]);
    }
    return f;
  }
  const r = n - 1, o = new Int32Array(i);
  o[0] = 0, o[i - 1] = r;
  const s = (n - 2) / (i - 2);
  let a = 0;
  const l = (f) => {
    const d = cn(e, f);
    if (!d || !Number.isFinite(d.x)) return { x: Number.NaN, m: Number.NaN };
    const m = Number.isFinite(d.y) ? d.y : 0, p = Number.isFinite(d.y1) ? d.y1 : m;
    return { x: d.x, m: (m + p) / 2 };
  }, c = l(r);
  for (let f = 0; f < i - 2; f++) {
    let d = Math.floor(s * f) + 1, m = Math.min(Math.floor(s * (f + 1)) + 1, r);
    d >= m && (d = Math.min(d, r - 1), m = Math.min(d + 1, r));
    const p = Math.floor(s * (f + 1)) + 1, y = Math.min(Math.floor(s * (f + 2)) + 1, r);
    let g = c.x, S = c.m;
    if (p < y) {
      let b = 0, v = 0, x = 0;
      for (let F = p; F < y; F++) {
        const I = l(F);
        !Number.isFinite(I.x) || !Number.isFinite(I.m) || (b += I.x, v += I.m, x++);
      }
      x > 0 && (g = b / x, S = v / x);
    }
    const A = l(a);
    let M = -1, h = d;
    for (let b = d; b < m; b++) {
      const v = l(b), x = (A.x - g) * (v.m - A.m) - (A.x - v.x) * (S - A.m), F = x < 0 ? -x : x;
      F > M && (M = F, h = b);
    }
    o[f + 1] = h, a = h;
  }
  const u = new Array(i);
  for (let f = 0; f < i; f++) {
    const d = cn(e, o[f]);
    u[f] = d ? [d.x, d.y, d.y1] : [Number.NaN, Number.NaN, Number.NaN];
  }
  return u;
}
function th(e, t, n) {
  const i = yn(e), r = bd(t);
  if (r <= 0 || i === 0) return [];
  if (i <= r) {
    const a = [];
    for (let l = 0; l < i; l++) {
      const c = cn(e, l);
      a.push(c ? [c.x, c.y, c.y1] : [Number.NaN, Number.NaN, Number.NaN]);
    }
    return a;
  }
  const o = [], s = i / r;
  for (let a = 0; a < r; a++) {
    const l = Math.floor(a * s), c = Math.min(i, Math.floor((a + 1) * s));
    if (!(l >= c))
      if (n === "average") {
        let u = 0, f = 0, d = 0, m = 0, p = 0, y = 0;
        for (let g = l; g < c; g++) {
          const S = cn(e, g);
          S && (Number.isFinite(S.x) && (u += S.x, m++), Number.isFinite(S.y) && (f += S.y, p++), Number.isFinite(S.y1) && (d += S.y1, y++));
        }
        m === 0 && p === 0 && y === 0 ? o.push([Number.NaN, Number.NaN, Number.NaN]) : o.push([
          m > 0 ? u / m : Number.NaN,
          p > 0 ? f / p : Number.NaN,
          y > 0 ? d / y : Number.NaN
        ]);
      } else {
        let u = Number.POSITIVE_INFINITY, f = Number.NEGATIVE_INFINITY;
        const d = l + c - 1 >>> 1;
        for (let y = l; y < c; y++) {
          const g = cn(e, y);
          if (!g) continue;
          const S = Math.min(
            Number.isFinite(g.y) ? g.y : Number.POSITIVE_INFINITY,
            Number.isFinite(g.y1) ? g.y1 : Number.POSITIVE_INFINITY
          ), A = Math.max(
            Number.isFinite(g.y) ? g.y : Number.NEGATIVE_INFINITY,
            Number.isFinite(g.y1) ? g.y1 : Number.NEGATIVE_INFINITY
          );
          Number.isFinite(S) && S < u && (u = S), Number.isFinite(A) && A > f && (f = A);
        }
        const m = cn(e, d), p = m && Number.isFinite(m.x) ? m.x : Number.NaN;
        !Number.isFinite(u) || !Number.isFinite(f) ? o.push([p, Number.NaN, Number.NaN]) : o.push([p, u, f]);
      }
  }
  return o;
}
function vd(e, t, n) {
  const i = yn(e);
  return t === "none" || t === "ohlc" || i <= n || n <= 0 ? e : t === "lttb" ? eh(e, n) : t === "average" || t === "max" || t === "min" ? th(e, n, t) : e;
}
function Is(e, t, n) {
  const i = yn(e), r = [], o = Math.min(t, n), s = Math.max(t, n);
  for (let a = 0; a < i; a++) {
    const l = cn(e, a);
    !l || !Number.isFinite(l.x) || l.x < o || l.x > s || r.push([l.x, l.y, l.y1]);
  }
  return r;
}
function nh(e) {
  let i = 2166136261;
  return i = Math.imul(i ^ yn(e) >>> 0, 16777619) >>> 0, i = Math.imul(i ^ 762141, 16777619) >>> 0, i = Math.imul(i ^ 723485, 16777619) >>> 0, i >>> 0;
}
function wd(e, t, n) {
  const i = yn(t), r = (n == null ? void 0 : n.newSrcOffset) ?? 0, o = (n == null ? void 0 : n.keepNewCount) ?? i - r, s = Math.min(i, r + Math.max(0, o));
  for (let a = r; a < s; a++) {
    const l = cn(t, a);
    if (!l) {
      e.x.push(Number.NaN), e.y.push(Number.NaN), e.y1.push(Number.NaN);
      continue;
    }
    e.x.push(l.x), e.y.push(l.y), e.y1.push(l.y1);
  }
  return e.x.length;
}
function Nd(e, t) {
  const n = qn(t);
  return e ? n ? {
    xMin: Math.min(e.xMin, n.xMin),
    xMax: Math.max(e.xMax, n.xMax),
    yMin: Math.min(e.yMin, n.yMin),
    yMax: Math.max(e.yMax, n.yMax)
  } : e : n;
}
function ui(e) {
  return { x: e.x, y: e.y, y1: e.y1 };
}
const Rc = /* @__PURE__ */ new Set();
function Bi(e, t) {
  Rc.has(e) || (Rc.add(e), console.warn(t));
}
function dr(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && !ArrayBuffer.isView(e) && "x" in e && "y" in e && "high" in e && "low" in e && typeof e.x == "object" && typeof e.y == "object" && typeof e.high == "object" && typeof e.low == "object" && "length" in e.x && "length" in e.y && "length" in e.high && "length" in e.low;
}
function Vl(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && !ArrayBuffer.isView(e) && "x" in e && "y" in e && "yError" in e && !("high" in e) && !("low" in e);
}
function Md(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && !ArrayBuffer.isView(e) && "x" in e && "y" in e && "yErrorHigh" in e && "yErrorLow" in e && !("high" in e) && !("low" in e);
}
function Wr(e) {
  return Vl(e) || Md(e);
}
function Sd(e) {
  if (e == null) return !1;
  if (Array.isArray(e)) {
    if (e.length === 0) return !0;
    for (let t = 0; t < e.length; t++) {
      const n = e[t];
      if (n != null)
        return Array.isArray(n) ? n.length >= 4 : typeof n == "object" ? "high" in n && "low" in n || "yError" in n || "yErrorHigh" in n && "yErrorLow" in n : !1;
    }
    return !0;
  }
  return !!(dr(e) || Wr(e));
}
function Cd(e) {
  return Array.isArray(e);
}
function Fd(e) {
  return typeof e == "object" && !!e && !Array.isArray(e) && "x" in e && "y" in e && "high" in e && "low" in e;
}
function Ad(e) {
  return typeof e != "object" || !e || Array.isArray(e) || !("x" in e) || !("y" in e) || "high" in e || "low" in e ? !1 : "yError" in e || "yErrorHigh" in e && "yErrorLow" in e;
}
function Id(e) {
  const t = Number(e.x), n = Number(e.y);
  if (!Number.isFinite(n))
    return { x: t, y: n, high: Number.NaN, low: Number.NaN };
  if (typeof e.yError == "number") {
    const o = Math.abs(e.yError);
    return Number.isFinite(o) ? { x: t, y: n, high: n + o, low: n - o } : { x: t, y: n, high: Number.NaN, low: Number.NaN };
  }
  const i = Math.abs(Number(e.yErrorHigh)), r = Math.abs(Number(e.yErrorLow));
  return !Number.isFinite(i) || !Number.isFinite(r) ? { x: t, y: n, high: Number.NaN, low: Number.NaN } : { x: t, y: n, high: n + i, low: n - r };
}
function xo(e, t) {
  return !Number.isFinite(e) || !Number.isFinite(t) ? { high: e, low: t, swapped: !1 } : t > e ? (Bi("low-gt-high", "ChartGPU errorBar: low > high for at least one sample; swapping endpoints."), { high: t, low: e, swapped: !0 }) : { high: e, low: t, swapped: !1 };
}
function Pa(e, t) {
  return typeof e == "number" ? e : Number(e[t]);
}
function Pd(e) {
  const t = e.x.length | 0, n = e.y.length | 0;
  let i = Math.min(t, n);
  if (Vl(e)) {
    if (typeof e.yError != "number") {
      const p = e.yError.length | 0;
      (p !== t || t !== n) && Bi(
        "rel-sym-len",
        `ChartGPU errorBar: x/y/yError length mismatch (x=${t}, y=${n}, yError=${p}); using min length.`
      ), i = Math.min(i, p);
    } else t !== n && Bi("rel-sym-xy", `ChartGPU errorBar: x/y length mismatch (x=${t}, y=${n}); using min length ${i}.`);
    const u = new Array(i), f = new Array(i), d = new Array(i), m = new Array(i);
    for (let p = 0; p < i; p++) {
      const y = Number(e.x[p]), g = Number(e.y[p]), S = Math.abs(Pa(e.yError, p));
      u[p] = y, f[p] = g, Number.isFinite(g) && Number.isFinite(S) ? (d[p] = g + S, m[p] = g - S) : (d[p] = Number.NaN, m[p] = Number.NaN);
    }
    return { x: u, y: f, high: d, low: m };
  }
  const r = e.yErrorHigh, o = e.yErrorLow;
  if (typeof r != "number" && (i = Math.min(i, r.length | 0)), typeof o != "number" && (i = Math.min(i, o.length | 0)), t !== n || typeof r != "number" || typeof o != "number") {
    const u = typeof r == "number" ? i : r.length | 0, f = typeof o == "number" ? i : o.length | 0;
    (t !== n || u !== t || f !== t) && Bi(
      "rel-asym-len",
      `ChartGPU errorBar: relative channel length mismatch (x=${t}, y=${n}, yErrorHigh=${u}, yErrorLow=${f}); using min length ${i}.`
    );
  }
  const s = new Array(i), a = new Array(i), l = new Array(i), c = new Array(i);
  for (let u = 0; u < i; u++) {
    const f = Number(e.x[u]), d = Number(e.y[u]), m = Math.abs(Pa(r, u)), p = Math.abs(Pa(o, u));
    s[u] = f, a[u] = d, Number.isFinite(d) && Number.isFinite(m) && Number.isFinite(p) ? (l[u] = d + m, c[u] = d - p) : (l[u] = Number.NaN, c[u] = Number.NaN);
  }
  return { x: s, y: a, high: l, low: c };
}
function Xr(e) {
  if (Wr(e))
    return Pd(e);
  if (dr(e))
    return Dr(e);
  const t = e, n = t.length, i = new Array(n), r = new Array(n), o = new Array(n), s = new Array(n);
  for (let a = 0; a < n; a++) {
    const l = t[a];
    if (l == null) {
      i[a] = Number.NaN, r[a] = Number.NaN, o[a] = Number.NaN, s[a] = Number.NaN;
      continue;
    }
    if (Cd(l)) {
      if (l.length < 4) {
        Bi(
          "tuple-short",
          "ChartGPU errorBar: array tuples must be [x, y, high, low] (length ≥ 4); short tuples become gaps."
        ), i[a] = Number.NaN, r[a] = Number.NaN, o[a] = Number.NaN, s[a] = Number.NaN;
        continue;
      }
      const c = xo(Number(l[2]), Number(l[3]));
      i[a] = Number(l[0]), r[a] = Number(l[1]), o[a] = c.high, s[a] = c.low;
      continue;
    }
    if (Fd(l)) {
      const c = xo(Number(l.high), Number(l.low));
      i[a] = Number(l.x), r[a] = Number(l.y), o[a] = c.high, s[a] = c.low;
      continue;
    }
    if (Ad(l)) {
      const c = Id(l);
      i[a] = c.x, r[a] = c.y, o[a] = c.high, s[a] = c.low;
      continue;
    }
    Bi(
      "array-shape",
      "ChartGPU errorBar: unsupported array sample shape (need [x,y,high,low], {x,y,high,low}, or relative {x,y,yError*}); using NaN gap."
    ), i[a] = Number.NaN, r[a] = Number.NaN, o[a] = Number.NaN, s[a] = Number.NaN;
  }
  return { x: i, y: r, high: o, low: s };
}
function On(e) {
  if (Array.isArray(e))
    return e.length;
  if (dr(e)) {
    const t = e.x.length | 0, n = e.y.length | 0, i = e.high.length | 0, r = e.low.length | 0, o = Math.min(t, n, i, r);
    return (t !== n || n !== i || i !== r) && Bi(
      "hlc-len",
      `ChartGPU errorBar: x/y/high/low length mismatch (x=${t}, y=${n}, high=${i}, low=${r}); using min length ${o}.`
    ), Math.max(0, o);
  }
  if (Vl(e)) {
    const t = e.x.length | 0, n = e.y.length | 0;
    if (typeof e.yError == "number")
      return t !== n && Bi("rel-len-s", `ChartGPU errorBar: x/y length mismatch (x=${t}, y=${n}); using min.`), Math.max(0, Math.min(t, n));
    const i = e.yError.length | 0, r = Math.min(t, n, i);
    return (t !== n || n !== i) && Bi(
      "rel-len-s2",
      `ChartGPU errorBar: x/y/yError length mismatch (x=${t}, y=${n}, yError=${i}); using min ${r}.`
    ), Math.max(0, r);
  }
  if (Md(e)) {
    const t = e.x.length | 0, n = e.y.length | 0;
    let i = Math.min(t, n);
    return typeof e.yErrorHigh != "number" && (i = Math.min(i, e.yErrorHigh.length | 0)), typeof e.yErrorLow != "number" && (i = Math.min(i, e.yErrorLow.length | 0)), Math.max(0, i);
  }
  return 0;
}
function kn(e, t) {
  if (t < 0) return null;
  if (Wr(e)) {
    const n = Pd(e);
    return kn(n, t);
  }
  if (Array.isArray(e)) {
    if (t >= e.length) return null;
    const n = e[t];
    if (n == null) return null;
    if (Cd(n)) {
      if (n.length < 4) return null;
      const i = xo(Number(n[2]), Number(n[3]));
      return { x: Number(n[0]), y: Number(n[1]), high: i.high, low: i.low };
    }
    if (Fd(n)) {
      const i = xo(Number(n.high), Number(n.low));
      return { x: Number(n.x), y: Number(n.y), high: i.high, low: i.low };
    }
    return Ad(n) ? Id(n) : null;
  }
  if (dr(e)) {
    const n = On(e);
    if (t >= n) return null;
    const i = xo(Number(e.high[t]), Number(e.low[t]));
    return {
      x: Number(e.x[t]),
      y: Number(e.y[t]),
      high: i.high,
      low: i.low
    };
  }
  return null;
}
function Td(e, t = "both") {
  return !e || !Number.isFinite(e.x) || !Number.isFinite(e.y) ? !1 : t === "both" ? Number.isFinite(e.high) && Number.isFinite(e.low) : t === "high" ? Number.isFinite(e.high) : Number.isFinite(e.low);
}
function hi(e, t = "vertical") {
  const n = dr(e) && !Wr(e) ? e : Xr(e), i = On(n);
  let r = Number.POSITIVE_INFINITY, o = Number.NEGATIVE_INFINITY, s = Number.POSITIVE_INFINITY, a = Number.NEGATIVE_INFINITY;
  for (let l = 0; l < i; l++) {
    const c = kn(n, l);
    c && (t === "horizontal" ? (Number.isFinite(c.x) && (c.x < r && (r = c.x), c.x > o && (o = c.x)), Number.isFinite(c.high) && (c.high < r && (r = c.high), c.high > o && (o = c.high)), Number.isFinite(c.low) && (c.low < r && (r = c.low), c.low > o && (o = c.low)), Number.isFinite(c.y) && (c.y < s && (s = c.y), c.y > a && (a = c.y))) : (Number.isFinite(c.x) && (c.x < r && (r = c.x), c.x > o && (o = c.x)), Number.isFinite(c.y) && (c.y < s && (s = c.y), c.y > a && (a = c.y)), Number.isFinite(c.high) && (c.high < s && (s = c.high), c.high > a && (a = c.high)), Number.isFinite(c.low) && (c.low < s && (s = c.low), c.low > a && (a = c.low))));
  }
  return !Number.isFinite(r) || !Number.isFinite(o) || !Number.isFinite(s) || !Number.isFinite(a) ? null : (r === o && (o = r + 1), s === a && (a = s + 1), { xMin: r, xMax: o, yMin: s, yMax: a });
}
function Bd(e, t, n = "vertical") {
  const i = hi(t, n);
  return e ? i ? {
    xMin: Math.min(e.xMin, i.xMin),
    xMax: Math.max(e.xMax, i.xMax),
    yMin: Math.min(e.yMin, i.yMin),
    yMax: Math.max(e.yMax, i.yMax)
  } : e : i;
}
function Dr(e) {
  const t = dr(e) ? e : Xr(e), n = On(t), i = new Array(n), r = new Array(n), o = new Array(n), s = new Array(n);
  for (let a = 0; a < n; a++) {
    const l = kn(t, a);
    l ? (i[a] = l.x, r[a] = l.y, o[a] = l.high, s[a] = l.low) : (i[a] = Number.NaN, r[a] = Number.NaN, o[a] = Number.NaN, s[a] = Number.NaN);
  }
  return { x: i, y: r, high: o, low: s };
}
function Rd(e, t, n) {
  const i = Xr(t), r = On(i), o = (n == null ? void 0 : n.newSrcOffset) ?? 0, s = (n == null ? void 0 : n.keepNewCount) ?? r - o, a = Math.min(r, o + Math.max(0, s));
  for (let l = o; l < a; l++) {
    const c = kn(i, l);
    c ? (e.x.push(c.x), e.y.push(c.y), e.high.push(c.high), e.low.push(c.low)) : (e.x.push(Number.NaN), e.y.push(Number.NaN), e.high.push(Number.NaN), e.low.push(Number.NaN));
  }
}
function ih(e) {
  const t = On(e);
  if (t === 0) return 0;
  const n = Wr(e) || Array.isArray(e) ? Xr(e) : e, i = kn(n, 0), r = kn(n, t >> 1), o = kn(n, t - 1);
  let s = t * 2654435761;
  const a = (l) => {
    l && (s ^= Math.floor(l.x) | 0, s = s * 1664525 + Math.floor(l.y) | 0, s = s * 1664525 + Math.floor(l.high) | 0, s = s * 1664525 + Math.floor(l.low) | 0);
  };
  return a(i), a(r), a(o), s >>> 0;
}
function Nl(e, t = "vertical") {
  const n = dr(e) && !Wr(e) ? e : Xr(e), i = On(n), r = [];
  for (let s = 0; s < i; s++) {
    const a = kn(n, s);
    if (!a) continue;
    const l = t === "horizontal" ? a.y : a.x;
    Number.isFinite(l) && r.push(l);
  }
  if (r.length < 2) return 1;
  r.sort((s, a) => s - a);
  let o = Number.POSITIVE_INFINITY;
  for (let s = 1; s < r.length; s++) {
    const a = r[s] - r[s - 1];
    a > 0 && a < o && (o = a);
  }
  return Number.isFinite(o) && o > 0 ? o : 1;
}
const rh = 1e-15;
function oh(e, t, n) {
  if (!Number.isFinite(e) || !Number.isFinite(t)) return null;
  const i = Number.isFinite(n) ? n : 0, r = Math.abs(t - i) <= rh;
  return { x: e, y: t, baseline: i, zeroLength: r };
}
function sh(e, t) {
  if (e.zeroLength) return null;
  const n = Math.max(0, t), i = Math.min(e.baseline, e.y), r = Math.max(e.baseline, e.y);
  return {
    minX: e.x - n,
    maxX: e.x + n,
    minY: i,
    maxY: r
  };
}
function Gr(e, t) {
  const n = Rn(e), i = Number.isFinite(t) ? t : 0;
  if (!n)
    return Number.isFinite(i) ? { xMin: 0, xMax: 1, yMin: i, yMax: i } : null;
  let r = n.yMin, o = n.yMax;
  return Number.isFinite(i) && (i < r && (r = i), i > o && (o = i)), {
    xMin: n.xMin,
    xMax: n.xMax,
    yMin: r,
    yMax: o
  };
}
function Dc(e, t, n) {
  return e >= n.minX && e <= n.maxX && t >= n.minY && t <= n.maxY;
}
function kc(e, t, n) {
  const i = Math.max(0, t), r = Math.max(0, n);
  return {
    minX: e.minX - i,
    maxX: e.maxX + i,
    minY: e.minY - r,
    maxY: e.maxY + r
  };
}
function ah(e, t, n) {
  const i = Math.max(0, n);
  return {
    minX: e - i,
    maxX: e + i,
    minY: t - i,
    maxY: t + i
  };
}
const Dd = /* @__PURE__ */ new Set(["before", "middle", "after"]);
function Ps(e) {
  return e === !0 ? "after" : e === !1 || e == null ? null : typeof e == "string" && Dd.has(e) ? e : null;
}
function lh(e) {
  return e == null || e === !0 || e === !1 ? !1 : typeof e == "string" ? !Dd.has(e) : typeof e != "boolean";
}
function ch(e, t) {
  return Number.isFinite(e) && Number.isFinite(t);
}
function kd(e, t) {
  const n = Math.max(0, e | 0);
  return n <= 1 ? n : t === "middle" ? 3 * n - 2 : 2 * n - 1;
}
function uh(e, t, n) {
  const i = $e(e);
  if (i <= 0)
    return { x: new Float64Array(0), y: new Float64Array(0) };
  const r = kd(i, t), o = new Float64Array(r), s = new Float64Array(r);
  let a = 0, l = Number.NaN, c = Number.NaN, u = !1;
  const f = (d, m) => {
    o[a] = d, s[a] = m, a++;
  };
  for (let d = 0; d < i; d++) {
    const m = Te(e, d), p = ht(e, d);
    if (!ch(m, p)) {
      u = !1;
      continue;
    }
    if (!u) {
      f(m, p), l = m, c = p, u = !0;
      continue;
    }
    if (t === "after")
      f(m, c), f(m, p);
    else if (t === "before")
      f(l, p), f(m, p);
    else {
      const y = (l + m) * 0.5;
      f(y, c), f(y, p), f(m, p);
    }
    l = m, c = p;
  }
  return a === r ? { x: o, y: s } : {
    x: o.subarray(0, a),
    y: s.subarray(0, a)
  };
}
function fh(e, t, n, i, r) {
  const o = $e(e);
  if (o <= 0)
    return {
      x: new Float64Array(0),
      yBottom: new Float64Array(0),
      yTop: new Float64Array(0)
    };
  const s = kd(o, i), a = new Float64Array(s), l = new Float64Array(s), c = new Float64Array(s);
  let u = 0, f = Number.NaN, d = Number.NaN, m = Number.NaN, p = !1;
  const y = (g, S, A) => {
    a[u] = g, l[u] = S, c[u] = A, u++;
  };
  for (let g = 0; g < o; g++) {
    const S = Te(e, g), A = t[g], M = n[g];
    if (!Number.isFinite(S) || !Number.isFinite(A) || !Number.isFinite(M)) {
      p = !1;
      continue;
    }
    if (!p) {
      y(S, A, M), f = S, d = A, m = M, p = !0;
      continue;
    }
    if (i === "after")
      y(S, d, m), y(S, A, M);
    else if (i === "before")
      y(f, A, M), y(S, A, M);
    else {
      const h = (f + S) * 0.5;
      y(h, d, m), y(h, A, M), y(S, A, M);
    }
    f = S, d = A, m = M;
  }
  return u === s ? { x: a, yBottom: l, yTop: c } : {
    x: a.subarray(0, u),
    yBottom: l.subarray(0, u),
    yTop: c.subarray(0, u)
  };
}
function dh(e) {
  return { x: e.x, y: e.y };
}
const Ed = 2166136261, mh = 16777619;
let Lr = 0;
const Ur = (e, t) => Math.imul(e ^ t >>> 0, mh) >>> 0;
function eo(e) {
  Lr = Lr + 1 >>> 0;
  let t = Ed >>> 0;
  return t = Ur(t, $e(e)), t = Ur(t, Lr), t = Ur(t, 12648430), t >>> 0;
}
function Ec(e) {
  Lr = Lr + 1 >>> 0;
  let t = Ed >>> 0;
  return t = Ur(t, e.length), t = Ur(t, Lr), t = Ur(t, 61902), t >>> 0;
}
const Io = 1e-6;
function Ml(e) {
  const t = $e(e);
  if (t <= 0) return !1;
  const n = t === 1 ? [0] : t === 2 ? [0, 1] : [0, t / 2 | 0, t - 1];
  for (let i = 0; i < n.length; i++) {
    const r = n[i], o = Te(e, r);
    if (!Number.isFinite(o) || Math.abs(o - r) > Io) return !1;
  }
  for (let i = 0; i < t; i++) {
    const r = Te(e, i);
    if (!Number.isFinite(r) || Math.abs(r - i) > Io) return !1;
  }
  return !0;
}
function Sl(e) {
  const t = $e(e);
  if (t <= 0) return !1;
  const n = t === 1 ? [0] : t === 2 ? [0, 1] : [0, t / 4 | 0, t / 2 | 0, 3 * t / 4 | 0, t - 1];
  for (let i = 0; i < n.length; i++) {
    const r = n[i], o = Te(e, r);
    if (!Number.isFinite(o) || Math.abs(o - r) > Io) return !1;
  }
  return !0;
}
function or(e) {
  const t = $e(e);
  if (t <= 0) return 0;
  let n = (t | 0) * 2654435761;
  for (let i = 0; i < t; i++) {
    const r = Te(e, i), o = Number.isFinite(r) ? Math.round(r * 1e3) | 0 : 2147483647;
    n = Math.imul(n ^ o, 2246822507) + i;
  }
  return n | 0;
}
function ph(e, t, n) {
  if (e == null) return !1;
  const i = $e(t);
  if (i <= 0 || $e(e) !== i) return !1;
  const r = i === 1 ? [0] : i === 2 ? [0, 1] : [0, i / 4 | 0, i / 2 | 0, 3 * i / 4 | 0, i - 1];
  let o = !0, s = !0;
  for (let a = 0; a < r.length; a++) {
    const l = r[a], c = Te(t, l), u = Te(e, l);
    if ((!Number.isFinite(c) || Math.abs(c - l) > Io) && (o = !1), (!Number.isFinite(u) || Math.abs(u - l) > Io) && (s = !1), !o && !s) break;
  }
  if (o && s) {
    if (n != null && n.prevIndexSortedProven) {
      const a = or(t), l = n.prevIndexSortedFingerprint !== void 0 ? n.prevIndexSortedFingerprint : or(e);
      if (a === l && Sl(t))
        return "indexSorted";
    }
    if (Ml(t))
      return "indexSorted";
  }
  for (let a = 0; a < i; a++) {
    const l = Te(e, a), c = Te(t, a);
    if (!Number.isFinite(l) || !Number.isFinite(c) || l !== c) return !1;
  }
  return "equalX";
}
function hh(e, t, n, i) {
  const r = $e(e);
  if (r !== n || r <= 0 || t.length < r * 2) return !1;
  for (let o = 0; o < r; o++) {
    const s = Te(e, o), a = t[o * 2] + i;
    if (!Number.isFinite(s) || !Number.isFinite(a) || s !== a) return !1;
  }
  return !0;
}
function yh(e, t, n) {
  const i = $e(e);
  if (i !== n || i <= 0 || t.length < i) return !1;
  const r = i === 1 ? [0] : i === 2 ? [0, 1] : [0, i / 4 | 0, i / 2 | 0, 3 * i / 4 | 0, i - 1];
  for (let o = 0; o < r.length; o++) {
    const s = r[o], a = Te(e, s), l = t[s];
    if (!Number.isFinite(a) || !Number.isFinite(l) || a !== l) return !1;
  }
  for (let o = 0; o < i; o++) {
    const s = Te(e, o), a = t[o];
    if (!Number.isFinite(s) || !Number.isFinite(a) || s !== a) return !1;
  }
  return !0;
}
function gh(e, t, n) {
  const i = Math.min(n, $e(t));
  let r = !1;
  for (let o = 0; o < i; o++) {
    const s = ht(t, o), a = e[o * 2 + 1];
    s !== a && !(Number.isNaN(s) && Number.isNaN(a)) && (r = !0), e[o * 2 + 1] = s;
  }
  return r;
}
function xh(e, t, n) {
  const i = Math.min(n, $e(t));
  let r = !1;
  for (let o = 0; o < i; o++) {
    const s = ht(t, o);
    if (!Number.isFinite(s)) return null;
    const a = e[o];
    s !== a && (r = !0), e[o] = s;
  }
  return r;
}
function bh(e, t) {
  const n = $e(e), i = $e(t);
  if (n <= 0 || i <= 0) return null;
  const r = new Array(n);
  for (let o = 0; o < n; o++) {
    const s = Te(e, o);
    if (!Number.isFinite(s)) return null;
    const a = Math.round(s);
    if (a < 0 || a >= i) return null;
    r[o] = [s, ht(t, a)];
  }
  return r;
}
const ds = () => ({
  min: [1 / 0, 1 / 0, 1 / 0],
  max: [-1 / 0, -1 / 0, -1 / 0]
}), vh = (e) => Number.isFinite(e.min[0]) && Number.isFinite(e.min[1]) && Number.isFinite(e.min[2]) && Number.isFinite(e.max[0]) && Number.isFinite(e.max[1]) && Number.isFinite(e.max[2]) && e.min[0] <= e.max[0] && e.min[1] <= e.max[1] && e.min[2] <= e.max[2], _r = (e, t, n, i) => {
  !Number.isFinite(t) || !Number.isFinite(n) || !Number.isFinite(i) || (t < e.min[0] && (e.min[0] = t), n < e.min[1] && (e.min[1] = n), i < e.min[2] && (e.min[2] = i), t > e.max[0] && (e.max[0] = t), n > e.max[1] && (e.max[1] = n), i > e.max[2] && (e.max[2] = i));
}, SM = (e, t) => {
  _r(e, t.min[0], t.min[1], t.min[2]), _r(e, t.max[0], t.max[1], t.max[2]);
}, CM = (e) => [
  (e.min[0] + e.max[0]) * 0.5,
  (e.min[1] + e.max[1]) * 0.5,
  (e.min[2] + e.max[2]) * 0.5
], wh = (e) => [e.max[0] - e.min[0], e.max[1] - e.min[1], e.max[2] - e.min[2]], FM = (e) => {
  const t = wh(e), n = Math.max(t[0], 1e-6), i = Math.max(t[1], 1e-6), r = Math.max(t[2], 1e-6);
  return 0.5 * Math.hypot(n, i, r);
}, AM = (e) => {
  if (e && vh(e)) {
    const t = [e.min[0], e.min[1], e.min[2]], n = [e.max[0], e.max[1], e.max[2]];
    for (let i = 0; i < 3; i++)
      n[i] - t[i] < 1e-9 && (t[i] = t[i] - 0.5, n[i] = n[i] + 0.5);
    return { min: t, max: n };
  }
  return { min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] };
};
function bi(e) {
  if (!(e == null || !Number.isFinite(e) || e <= 0))
    return Math.floor(e);
}
function Nh(e) {
  const t = Math.min(e.maxBufferSize, e.maxStorageBufferBindingSize);
  return Math.max(1, Math.floor(t / (2 * 4)));
}
function Mh(e, t, n, i) {
  const r = bi(e);
  if (!i) return r;
  const o = Nh(i), s = Math.min(i.maxBufferSize, i.maxStorageBufferBindingSize), a = Math.max(0, t | 0), l = Math.max(0, n | 0), c = a + l, u = Math.max(4, c * 2 * 4);
  return r == null ? u > s || c > o ? o : void 0 : r <= o ? r : o;
}
function yi(e, t, n) {
  const i = Math.max(0, e | 0), r = Math.max(0, t | 0);
  if (r === 0) {
    const a = bi(n);
    return {
      nextCount: i,
      dropPrevCount: 0,
      newSrcOffset: 0,
      keepNewCount: 0,
      didWindow: !1,
      isStrictReplace: !1,
      ringCapacity: a ?? 0,
      isRing: a != null
    };
  }
  const o = bi(n);
  if (o == null)
    return {
      nextCount: i + r,
      dropPrevCount: 0,
      newSrcOffset: 0,
      keepNewCount: r,
      didWindow: !1,
      isStrictReplace: !1,
      ringCapacity: 0,
      isRing: !1
    };
  if (r >= o)
    return {
      nextCount: o,
      dropPrevCount: i,
      newSrcOffset: r - o,
      keepNewCount: o,
      didWindow: !0,
      isStrictReplace: !0,
      ringCapacity: o,
      isRing: !0
    };
  const s = i + r;
  if (s > o) {
    const a = s - o;
    return {
      nextCount: o,
      dropPrevCount: a,
      newSrcOffset: 0,
      keepNewCount: r,
      didWindow: !0,
      isStrictReplace: !1,
      ringCapacity: o,
      isRing: !0
    };
  }
  return {
    nextCount: s,
    dropPrevCount: 0,
    newSrcOffset: 0,
    keepNewCount: r,
    didWindow: !1,
    isStrictReplace: !1,
    ringCapacity: o,
    isRing: !0
  };
}
const Lc = 16, Sh = 1.5, Ch = (e) => {
  if (e == null || typeof e != "object" || Array.isArray(e) || ArrayBuffer.isView(e))
    return !1;
  const t = e;
  return "x" in t && "y" in t && "z" in t;
}, Fh = (e) => ArrayBuffer.isView(e), Ii = (e, t) => {
  const n = e[t];
  return typeof n == "number" ? n : Number.NaN;
}, Ta = () => ({
  packed: new Float32Array(0),
  count: 0,
  aabb: null,
  valueMin: 0,
  valueMax: 1,
  hasValue: !1
});
function Ah(e, t) {
  var n;
  if (e instanceof DataView)
    return t("ChartGPU pointCloud3d: DataView interleaved data is not supported."), null;
  if (e instanceof Float32Array)
    return { floats: e, floatCount: e.length };
  if (e instanceof Float64Array) {
    const i = new Float32Array(e.length);
    for (let r = 0; r < e.length; r++) i[r] = e[r];
    return { floats: i, floatCount: i.length };
  }
  return t(
    `ChartGPU pointCloud3d: interleaved typed array ${((n = e.constructor) == null ? void 0 : n.name) ?? "unknown"} is not supported (use Float32Array or Float64Array).`
  ), null;
}
function Ih(e, t) {
  const n = (t == null ? void 0 : t.warn) ?? ((r) => console.warn(r)), i = t == null ? void 0 : t.valueOverride;
  if (e == null) return Ta();
  if (Fh(e)) {
    const r = Ah(e, n);
    if (!r) return Ta();
    const { floats: o, floatCount: s } = r;
    (s < 3 || s % 3 !== 0) && s > 0 && n(`ChartGPU pointCloud3d: interleaved XYZ length (${s}) must be a multiple of 3; truncating.`);
    const a = Math.floor(s / 3), l = new Float32Array(a * 4), c = ds();
    let u = 1 / 0, f = -1 / 0, d = !1, m = 0;
    for (let g = 0; g < a; g++) {
      const S = Number(o[g * 3]), A = Number(o[g * 3 + 1]), M = Number(o[g * 3 + 2]);
      if (!Number.isFinite(S) || !Number.isFinite(A) || !Number.isFinite(M))
        continue;
      let h = 0;
      if (i && g < i.length) {
        const v = Ii(i, g);
        Number.isFinite(v) && (h = v, d = !0, h < u && (u = h), h > f && (f = h));
      }
      const b = m * 4;
      l[b] = S, l[b + 1] = A, l[b + 2] = M, l[b + 3] = h, _r(c, S, A, M), m++;
    }
    const p = m === a ? l : l.subarray(0, m * 4), y = m > 0 && Number.isFinite(c.min[0]) ? { min: [c.min[0], c.min[1], c.min[2]], max: [c.max[0], c.max[1], c.max[2]] } : null;
    return {
      packed: p,
      count: m,
      aabb: y,
      valueMin: d ? u : 0,
      valueMax: d ? f : 1,
      hasValue: d
    };
  }
  if (Ch(e)) {
    e.size != null && n(
      "ChartGPU pointCloud3d: data.size is reserved and ignored in v1; use pointStyle.size for billboard diameter (CSS px)."
    );
    const r = e.x.length, o = e.y.length, s = e.z.length, a = Math.min(r, o, s);
    (r !== o || o !== s) && n(`ChartGPU pointCloud3d: x/y/z length mismatch (${r},${o},${s}); using min length ${a}.`);
    const l = i ?? e.value;
    l && l.length < a && n(
      `ChartGPU pointCloud3d: value length (${l.length}) < point count (${a}); trailing values treated as 0.`
    );
    const c = new Float32Array(a * 4), u = ds();
    let f = 1 / 0, d = -1 / 0, m = !1, p = 0;
    for (let S = 0; S < a; S++) {
      const A = Ii(e.x, S), M = Ii(e.y, S), h = Ii(e.z, S);
      if (!Number.isFinite(A) || !Number.isFinite(M) || !Number.isFinite(h))
        continue;
      let b = 0;
      if (l && S < l.length) {
        const x = Ii(l, S);
        Number.isFinite(x) && (b = x, m = !0, b < f && (f = b), b > d && (d = b));
      }
      const v = p * 4;
      c[v] = A, c[v + 1] = M, c[v + 2] = h, c[v + 3] = b, _r(u, A, M, h), p++;
    }
    const y = p === a ? c : c.subarray(0, p * 4), g = p > 0 && Number.isFinite(u.min[0]) ? { min: [u.min[0], u.min[1], u.min[2]], max: [u.max[0], u.max[1], u.max[2]] } : null;
    return {
      packed: y,
      count: p,
      aabb: g,
      valueMin: m ? f : 0,
      valueMax: m ? d : 1,
      hasValue: m
    };
  }
  if (Array.isArray(e)) {
    const r = e.length, o = new Float32Array(r * 4), s = ds();
    let a = 1 / 0, l = -1 / 0, c = !1, u = 0;
    for (let m = 0; m < r; m++) {
      const p = e[m];
      if (p == null) continue;
      let y, g, S;
      if (Array.isArray(p))
        y = Number(p[0]), g = Number(p[1]), S = Number(p[2]);
      else if (typeof p == "object") {
        const h = p;
        y = Number(h.x), g = Number(h.y), S = Number(h.z);
      } else
        continue;
      if (!Number.isFinite(y) || !Number.isFinite(g) || !Number.isFinite(S)) continue;
      let A = 0;
      if (i && m < i.length) {
        const h = Ii(i, m);
        Number.isFinite(h) && (A = h, c = !0, A < a && (a = A), A > l && (l = A));
      }
      const M = u * 4;
      o[M] = y, o[M + 1] = g, o[M + 2] = S, o[M + 3] = A, _r(s, y, g, S), u++;
    }
    const f = u === r ? o : o.subarray(0, u * 4), d = u > 0 && Number.isFinite(s.min[0]) ? { min: [s.min[0], s.min[1], s.min[2]], max: [s.max[0], s.max[1], s.max[2]] } : null;
    return {
      packed: f,
      count: u,
      aabb: d,
      valueMin: c ? a : 0,
      valueMax: c ? l : 1,
      hasValue: c
    };
  }
  return n("ChartGPU pointCloud3d: unrecognized data format."), Ta();
}
const Go = (e, t, n, i, r) => {
  const o = ds();
  let s = 1 / 0, a = -1 / 0, l = !1;
  for (let u = 0; u < t; u++) {
    const f = e[u * 4], d = e[u * 4 + 1], m = e[u * 4 + 2], p = e[u * 4 + 3];
    _r(o, f, d, m), Number.isFinite(p) && (p !== 0 || r) && (l = l || r || p !== 0, p < s && (s = p), p > a && (a = p));
  }
  return {
    aabb: t > 0 && Number.isFinite(o.min[0]) ? { min: [o.min[0], o.min[1], o.min[2]], max: [o.max[0], o.max[1], o.max[2]] } : null,
    valueMin: l && Number.isFinite(s) ? s : n,
    valueMax: l && Number.isFinite(a) ? a : i,
    hasValue: l || r
  };
};
function IM(e, t, n, i) {
  const r = Ih(n, i), o = bi(i == null ? void 0 : i.maxPoints);
  if (r.count === 0) {
    if (o != null && t > o) {
      const d = t - o, m = new Float32Array(o * 4);
      m.set(e.subarray(d * 4, t * 4));
      const p = Go(m, o, 0, 1, !1);
      return { packed: m, count: o, ...p };
    }
    const f = Go(e, t, 0, 1, !1);
    return {
      packed: e,
      count: t,
      ...f
    };
  }
  const s = yi(t, r.count, o);
  if (s.isStrictReplace) {
    const f = s.keepNewCount, d = s.newSrcOffset, m = Math.max(f, o ?? f), p = new Float32Array(m * 4);
    p.set(r.packed.subarray(d * 4, (d + f) * 4), 0);
    const y = Go(p, f, r.valueMin, r.valueMax, r.hasValue);
    return { packed: p, count: f, ...y };
  }
  const a = t - s.dropPrevCount, l = s.nextCount;
  let c;
  if (s.dropPrevCount === 0 && e.length >= l * 4)
    c = e, c.set(r.packed.subarray(0, r.count * 4), t * 4);
  else {
    let f;
    if (o != null)
      f = Math.max(o, l, Lc);
    else
      for (f = Math.max(Lc, e.length / 4); f < l; ) f = Math.ceil(f * Sh);
    c = new Float32Array(f * 4), a > 0 && c.set(e.subarray(s.dropPrevCount * 4, t * 4), 0), c.set(
      r.packed.subarray(s.newSrcOffset * 4, (s.newSrcOffset + s.keepNewCount) * 4),
      a * 4
    );
  }
  const u = Go(c, l, r.valueMin, r.valueMax, r.hasValue);
  return {
    packed: c,
    count: l,
    ...u
  };
}
function Ph(e) {
  if (e == null) return !1;
  if (ArrayBuffer.isView(e)) {
    if (e instanceof DataView) return !1;
    if (e instanceof Float32Array || e instanceof Float64Array) {
      const t = Math.floor(e.length / 3);
      for (let n = 0; n < t; n++) {
        const i = e[n * 3], r = e[n * 3 + 1], o = e[n * 3 + 2];
        if (Number.isFinite(i) && Number.isFinite(r) && Number.isFinite(o)) return !0;
      }
      return !1;
    }
    return Math.floor(e.byteLength / 4 / 3) > 0;
  }
  if (Array.isArray(e)) {
    for (let t = 0; t < e.length; t++) {
      const n = e[t];
      if (n == null) continue;
      let i, r, o;
      if (Array.isArray(n))
        i = Number(n[0]), r = Number(n[1]), o = Number(n[2]);
      else if (typeof n == "object") {
        const s = n;
        i = Number(s.x), r = Number(s.y), o = Number(s.z);
      } else
        continue;
      if (Number.isFinite(i) && Number.isFinite(r) && Number.isFinite(o)) return !0;
    }
    return !1;
  }
  if (typeof e == "object" && "x" in e && "y" in e && "z" in e) {
    const t = e, n = Math.min(t.x.length, t.y.length, t.z.length);
    for (let i = 0; i < n; i++) {
      const r = Ii(t.x, i), o = Ii(t.y, i), s = Ii(t.z, i);
      if (Number.isFinite(r) && Number.isFinite(o) && Number.isFinite(s)) return !0;
    }
    return !1;
  }
  return !1;
}
function ji(e) {
  return e.type !== "pointCloud3d" && e.type !== "surface3d";
}
const Th = /* @__PURE__ */ new Set([
  "line",
  "area",
  "bar",
  "scatter",
  "pie",
  "candlestick",
  "ohlc",
  "heatmap",
  "band",
  "errorBar",
  "impulse"
]), Bh = /* @__PURE__ */ new Set(["pointCloud3d", "surface3d"]);
function Rh(e) {
  const t = (e == null ? void 0 : e.type) === "orthographic" ? "orthographic" : Nr.type, n = typeof (e == null ? void 0 : e.fovY) == "number" && Number.isFinite(e.fovY) && e.fovY > 0 ? e.fovY : Nr.fovY, i = typeof (e == null ? void 0 : e.near) == "number" && Number.isFinite(e.near) && e.near > 0 ? e.near : Nr.near, r = typeof (e == null ? void 0 : e.far) == "number" && Number.isFinite(e.far) && e.far > i ? e.far : Nr.far, o = typeof (e == null ? void 0 : e.orthoSize) == "number" && Number.isFinite(e.orthoSize) && e.orthoSize > 0 ? e.orthoSize : Nr.orthoSize, s = Array.isArray(e == null ? void 0 : e.up) && e.up.length === 3 && e.up.every((c) => typeof c == "number" && Number.isFinite(c)) ? [e.up[0], e.up[1], e.up[2]] : Nr.up, a = Array.isArray(e == null ? void 0 : e.eye) && e.eye.length === 3 && e.eye.every((c) => typeof c == "number" && Number.isFinite(c)) ? [e.eye[0], e.eye[1], e.eye[2]] : void 0, l = Array.isArray(e == null ? void 0 : e.target) && e.target.length === 3 && e.target.every((c) => typeof c == "number" && Number.isFinite(c)) ? [e.target[0], e.target[1], e.target[2]] : void 0;
  return { type: t, fovY: n, near: i, far: r, eye: a, target: l, up: s, orthoSize: o };
}
function Dh(e) {
  return {
    orbit: (e == null ? void 0 : e.orbit) !== !1,
    pan: (e == null ? void 0 : e.pan) !== !1,
    zoom: (e == null ? void 0 : e.zoom) !== !1,
    orbitSpeed: typeof (e == null ? void 0 : e.orbitSpeed) == "number" && Number.isFinite(e.orbitSpeed) ? e.orbitSpeed : Ca.orbitSpeed,
    zoomSpeed: typeof (e == null ? void 0 : e.zoomSpeed) == "number" && Number.isFinite(e.zoomSpeed) ? e.zoomSpeed : Ca.zoomSpeed,
    panSpeed: typeof (e == null ? void 0 : e.panSpeed) == "number" && Number.isFinite(e.panSpeed) ? e.panSpeed : Ca.panSpeed
  };
}
function Ba(e, t) {
  const n = typeof (e == null ? void 0 : e.name) == "string" && e.name.trim() ? e.name : t, i = typeof (e == null ? void 0 : e.tickCount) == "number" && Number.isFinite(e.tickCount) && e.tickCount >= 2 ? Math.min(20, Math.floor(e.tickCount)) : sd.tickCount, r = typeof (e == null ? void 0 : e.min) == "number" && Number.isFinite(e.min) ? e.min : void 0, o = typeof (e == null ? void 0 : e.max) == "number" && Number.isFinite(e.max) ? e.max : void 0;
  return {
    name: n,
    type: "value",
    min: r,
    max: o,
    tickCount: i,
    visible: (e == null ? void 0 : e.visible) !== !1
  };
}
function kh(e) {
  const t = Ba(e == null ? void 0 : e.x, "X"), n = Ba(e == null ? void 0 : e.y, "Y"), i = Ba(e == null ? void 0 : e.z, "Z"), r = (e == null ? void 0 : e.labelMode) === "dom" || (e == null ? void 0 : e.labelMode) === "gpu" || (e == null ? void 0 : e.labelMode) === "auto" ? e.labelMode : sd.labelMode;
  return {
    x: t,
    y: n,
    z: i,
    xName: t.name,
    yName: n.name,
    zName: i.name,
    showBox: (e == null ? void 0 : e.showBox) !== !1,
    showGrid: (e == null ? void 0 : e.showGrid) !== !1,
    labelMode: r
  };
}
function Eh(e, t) {
  var a, l, c;
  const n = typeof ((a = e.pointStyle) == null ? void 0 : a.size) == "number" && Number.isFinite(e.pointStyle.size) && e.pointStyle.size > 0 ? e.pointStyle.size : bc.pointSize, i = typeof ((l = e.pointStyle) == null ? void 0 : l.opacity) == "number" && Number.isFinite(e.pointStyle.opacity) ? Math.min(1, Math.max(0, e.pointStyle.opacity)) : bc.opacity, r = typeof ((c = e.pointStyle) == null ? void 0 : c.color) == "string" && e.pointStyle.color.trim() ? e.pointStyle.color : t.color;
  let o;
  if (e.colorBy != null) {
    const u = e.colorBy.colormap, f = typeof u == "string" && Ol(u) || Array.isArray(u) && u.length > 0 ? u : "viridis";
    o = {
      values: e.colorBy.values,
      colormap: f,
      min: typeof e.colorBy.min == "number" && Number.isFinite(e.colorBy.min) ? e.colorBy.min : void 0,
      max: typeof e.colorBy.max == "number" && Number.isFinite(e.colorBy.max) ? e.colorBy.max : void 0
    };
  }
  const s = Ph(e.data);
  return {
    type: "pointCloud3d",
    name: e.name,
    visible: t.visible,
    data: e.data,
    color: r,
    pointStyle: { size: n, color: r, opacity: i },
    colorBy: o,
    drawable: s
  };
}
function Lh(e, t) {
  var M, h;
  const n = e.colormap, i = typeof n == "string" && Ol(n) || Array.isArray(n) && n.length > 0 ? n : Qi.colormap, r = typeof e.opacity == "number" && Number.isFinite(e.opacity) ? Math.min(1, Math.max(0, e.opacity)) : Qi.opacity, o = typeof e.lighting == "number" && Number.isFinite(e.lighting) ? Math.min(1, Math.max(0, e.lighting)) : Qi.lighting, s = e.wireframe === !0, a = Math.floor(Number((M = e.data) == null ? void 0 : M.columns)), l = Math.floor(Number((h = e.data) == null ? void 0 : h.rows)), c = e.data != null && a >= 2 && l >= 2 && Number.isFinite(e.data.xStep) && e.data.xStep !== 0 && Number.isFinite(e.data.zStep) && e.data.zStep !== 0 && e.data.y != null && e.data.y.length > 0, u = typeof e.yMin == "number" && Number.isFinite(e.yMin) && typeof e.yMax == "number" && Number.isFinite(e.yMax);
  let f = typeof e.yMin == "number" && Number.isFinite(e.yMin) ? e.yMin : 0, d = typeof e.yMax == "number" && Number.isFinite(e.yMax) ? e.yMax : 1;
  if (c && (e.yMin == null || e.yMax == null) && e.data.y) {
    let b = 1 / 0, v = -1 / 0;
    const x = Math.min(e.data.y.length, a * l);
    for (let F = 0; F < x; F++) {
      const I = Number(e.data.y[F]);
      Number.isFinite(I) && (I < b && (b = I), I > v && (v = I));
    }
    Number.isFinite(b) && (e.yMin == null && (f = b), e.yMax == null && (d = v > b ? v : b + 1));
  }
  d > f || (d = f + 1);
  const m = e.contours, p = (m == null ? void 0 : m.show) === !0;
  let y = Qi.contoursLevels;
  (m == null ? void 0 : m.levels) != null && (Array.isArray(m.levels) ? y = m.levels.filter((b) => typeof b == "number" && Number.isFinite(b)) : typeof m.levels == "number" && Number.isFinite(m.levels) && m.levels > 0 && (y = Math.min(64, Math.floor(m.levels))));
  const g = typeof (m == null ? void 0 : m.color) == "string" && m.color.trim() ? m.color : Qi.contoursColor, S = typeof (m == null ? void 0 : m.width) == "number" && Number.isFinite(m.width) && m.width > 0 ? m.width : Qi.contoursWidth, A = typeof (m == null ? void 0 : m.opacity) == "number" && Number.isFinite(m.opacity) ? Math.min(1, Math.max(0, m.opacity)) : Qi.contoursOpacity;
  return {
    type: "surface3d",
    name: e.name,
    visible: t.visible,
    data: e.data,
    colormap: i,
    yMin: f,
    yMax: d,
    yDomainExplicit: u,
    wireframe: s,
    opacity: r,
    lighting: o,
    color: t.color,
    drawable: !!c,
    contours: {
      show: p,
      levels: y,
      color: g,
      width: S,
      opacity: A
    }
  };
}
const Uh = (e) => {
  if (!Array.isArray(e)) return;
  const t = [];
  for (const n of e) {
    if (n === null || typeof n != "object" || Array.isArray(n)) continue;
    const i = n, r = i.type;
    if (r !== "inside" && r !== "slider") continue;
    const o = i.xAxisIndex, s = i.start, a = i.end, l = i.minSpan, c = i.maxSpan, u = typeof o == "number" && Number.isFinite(o) ? o : void 0, f = typeof s == "number" && Number.isFinite(s) ? s : void 0, d = typeof a == "number" && Number.isFinite(a) ? a : void 0, m = typeof l == "number" && Number.isFinite(l) ? l : void 0, p = typeof c == "number" && Number.isFinite(c) ? c : void 0;
    t.push({ type: r, xAxisIndex: u, start: f, end: d, minSpan: m, maxSpan: p });
  }
  return t;
}, _h = (e) => {
  if (!Array.isArray(e)) return;
  const t = [], n = (c) => c === "start" || c === "center" || c === "end", i = (c) => c === "circle" || c === "rect" || c === "triangle", r = (c) => {
    if (typeof c != "string") return;
    const u = c.trim();
    return u.length > 0 ? u : void 0;
  }, o = (c) => typeof c == "number" && Number.isFinite(c) ? c : void 0, s = (c) => {
    const u = o(c);
    if (u != null)
      return Math.min(1, Math.max(0, u));
  }, a = (c) => {
    if (!Array.isArray(c)) return;
    const u = c.filter((f) => typeof f == "number" && Number.isFinite(f)).map((f) => f);
    if (u.length !== 0)
      return Object.freeze(u), u;
  }, l = (c) => {
    if (typeof c == "number" && Number.isFinite(c)) return c;
    if (!Array.isArray(c) || c.length !== 4) return;
    const u = o(c[0]), f = o(c[1]), d = o(c[2]), m = o(c[3]);
    if (!(u == null || f == null || d == null || m == null))
      return [u, f, d, m];
  };
  for (const c of e) {
    if (c === null || typeof c != "object" || Array.isArray(c)) continue;
    const u = c, f = u.type;
    if (f !== "lineX" && f !== "lineY" && f !== "point" && f !== "text" && f !== "bandX") continue;
    const d = r(u.id), m = u.layer, p = m === "belowSeries" || m === "aboveSeries" ? m : void 0, y = u.style, g = y && typeof y == "object" && !Array.isArray(y) ? (() => {
      const M = y, h = r(M.color), b = o(M.lineWidth), v = a(M.lineDash), x = s(M.opacity), F = {
        ...h ? { color: h } : {},
        ...b != null ? { lineWidth: b } : {},
        ...v ? { lineDash: v } : {},
        ...x != null ? { opacity: x } : {}
      };
      return Object.keys(F).length > 0 ? F : void 0;
    })() : void 0, S = u.label, A = S && typeof S == "object" && !Array.isArray(S) ? (() => {
      const M = S, h = r(M.text), b = r(M.template), v = M.decimals, x = typeof v == "number" && Number.isFinite(v) && v >= 0 ? Math.min(20, Math.floor(v)) : void 0, F = M.offset, I = Array.isArray(F) && F.length === 2 && typeof F[0] == "number" && Number.isFinite(F[0]) && typeof F[1] == "number" && Number.isFinite(F[1]) ? [F[0], F[1]] : void 0, R = M.anchor, T = n(R) ? R : void 0, N = M.background, w = N && typeof N == "object" && !Array.isArray(N) ? (() => {
        const B = N, _ = r(B.color), C = s(B.opacity), E = l(B.padding), U = o(B.borderRadius), G = {
          ..._ ? { color: _ } : {},
          ...C != null ? { opacity: C } : {},
          ...E != null ? { padding: E } : {},
          ...U != null ? { borderRadius: U } : {}
        };
        return Object.keys(G).length > 0 ? G : void 0;
      })() : void 0, P = {
        ...h ? { text: h } : {},
        ...b ? { template: b } : {},
        ...x != null ? { decimals: x } : {},
        ...I ? { offset: I } : {},
        ...T ? { anchor: T } : {},
        ...w ? { background: w } : {}
      };
      return Object.keys(P).length > 0 ? P : void 0;
    })() : void 0;
    if (f === "bandX") {
      const M = o(u.from), h = o(u.to);
      if (M == null || h == null) continue;
      const b = {
        type: "bandX",
        from: M,
        to: h,
        ...d ? { id: d } : {},
        ...p ? { layer: p } : {},
        ...g ? { style: g } : {}
      };
      t.push(b);
      continue;
    }
    if (f === "lineX") {
      const M = o(u.x);
      if (M == null) continue;
      const h = {
        type: "lineX",
        x: M,
        ...d ? { id: d } : {},
        ...p ? { layer: p } : {},
        ...g ? { style: g } : {},
        ...A ? { label: A } : {}
      };
      t.push(h);
      continue;
    }
    if (f === "lineY") {
      const M = o(u.y);
      if (M == null) continue;
      const h = {
        type: "lineY",
        y: M,
        ...d ? { id: d } : {},
        ...p ? { layer: p } : {},
        ...g ? { style: g } : {},
        ...A ? { label: A } : {}
      };
      t.push(h);
      continue;
    }
    if (f === "point") {
      const M = o(u.x), h = o(u.y);
      if (M == null || h == null) continue;
      const b = u.marker, v = b && typeof b == "object" && !Array.isArray(b) ? (() => {
        const F = b, I = F.symbol, R = i(I) ? I : void 0, T = o(F.size), N = F.style, w = N && typeof N == "object" && !Array.isArray(N) ? (() => {
          const B = N, _ = r(B.color), C = s(B.opacity), E = o(B.lineWidth), U = a(B.lineDash), G = {
            ..._ ? { color: _ } : {},
            ...C != null ? { opacity: C } : {},
            ...E != null ? { lineWidth: E } : {},
            ...U ? { lineDash: U } : {}
          };
          return Object.keys(G).length > 0 ? G : void 0;
        })() : void 0, P = {
          ...R ? { symbol: R } : {},
          ...T != null ? { size: T } : {},
          ...w ? { style: w } : {}
        };
        return Object.keys(P).length > 0 ? P : void 0;
      })() : void 0, x = {
        type: "point",
        x: M,
        y: h,
        ...v ? { marker: v } : {},
        ...d ? { id: d } : {},
        ...p ? { layer: p } : {},
        ...g ? { style: g } : {},
        ...A ? { label: A } : {}
      };
      t.push(x);
      continue;
    }
    {
      const M = u.position, h = r(u.text);
      if (!h || !M || typeof M != "object" || Array.isArray(M)) continue;
      const b = M, v = b.space;
      if (v !== "data" && v !== "plot") continue;
      const x = o(b.x), F = o(b.y);
      if (x == null || F == null) continue;
      const R = {
        type: "text",
        position: { space: v, x, y: F },
        text: h,
        ...d ? { id: d } : {},
        ...p ? { layer: p } : {},
        ...g ? { style: g } : {},
        ...A ? { label: A } : {}
      };
      t.push(R);
      continue;
    }
  }
  if (t.length !== 0)
    return Object.freeze(t), t;
}, po = (e) => Array.isArray(e) ? e.filter((t) => typeof t == "string").map((t) => t.trim()).filter((t) => t.length > 0) : [], zh = (e) => {
  const t = Aa("dark");
  if (typeof e == "string") {
    const a = e.trim().toLowerCase();
    return Aa(a === "light" ? "light" : "dark");
  }
  if (e === null || typeof e != "object" || Array.isArray(e))
    return t;
  const n = e, i = (a) => {
    const l = n[a];
    if (typeof l != "string") return;
    const c = l.trim();
    return c.length > 0 ? c : void 0;
  }, r = n.fontSize, o = typeof r == "number" && Number.isFinite(r) ? r : void 0, s = po(n.colorPalette);
  return {
    backgroundColor: i("backgroundColor") ?? t.backgroundColor,
    textColor: i("textColor") ?? t.textColor,
    axisLineColor: i("axisLineColor") ?? t.axisLineColor,
    axisTickColor: i("axisTickColor") ?? t.axisTickColor,
    gridLineColor: i("gridLineColor") ?? t.gridLineColor,
    colorPalette: s.length > 0 ? s : Array.from(t.colorPalette),
    fontFamily: i("fontFamily") ?? t.fontFamily,
    fontSize: o ?? t.fontSize
  };
}, Fn = (e) => {
  if (typeof e != "string") return;
  const t = e.trim();
  return t.length > 0 ? t : void 0;
}, Gh = (e) => {
  if (typeof e != "string") return;
  const t = e.trim().toLowerCase();
  return t === "none" || t === "lttb" || t === "average" || t === "max" || t === "min" || t === "ohlc" ? t : void 0;
}, Oh = (e) => {
  if (typeof e != "string") return;
  const t = e.trim().toLowerCase();
  return t === "points" || t === "density" ? t : void 0;
}, Hh = (e) => {
  if (typeof e != "string") return;
  const t = e.trim().toLowerCase();
  return t === "linear" || t === "sqrt" || t === "log" ? t : void 0;
}, Yh = (e) => {
  if (typeof e != "number" || !Number.isFinite(e)) return;
  const t = Math.floor(e);
  return t > 0 ? Math.max(1, t) : void 0;
}, Wh = (e) => {
  if (typeof e == "string") {
    const i = e.trim().toLowerCase();
    return i === "viridis" || i === "plasma" || i === "inferno" ? i : void 0;
  }
  if (!Array.isArray(e)) return;
  if (e.length > 0 && e.every((i) => typeof i == "string" && i.length > 0 && i === i.trim())) {
    const i = e;
    return Object.isFrozen(i) || Object.freeze(i), i;
  }
  const n = e.filter((i) => typeof i == "string").map((i) => i.trim()).filter((i) => i.length > 0);
  if (n.length !== 0)
    return Object.freeze(n), n;
}, Uc = (e) => {
  if (typeof e != "string") return;
  const t = e.trim().toLowerCase();
  return t === "none" || t === "ohlc" ? t : void 0;
}, Ra = (e) => {
  if (typeof e != "number" || !Number.isFinite(e)) return;
  const t = Math.floor(e);
  return t > 0 ? t : void 0;
}, Da = (e) => {
  if (typeof e != "string") return;
  const t = e.trim().toLowerCase();
  return t === "global" || t === "visible" ? t : void 0;
}, Xh = (e) => {
  if (typeof e != "string") return;
  const t = e.trim().toLowerCase();
  return t === "sticky" || t === "continuous" || t === "animated" ? t : void 0;
}, Vh = (e) => {
  if (typeof e == "number" && Number.isFinite(e) && e >= 0)
    return e;
  if (Array.isArray(e) && e.length >= 2) {
    const t = e[0], n = e[1];
    if (typeof t == "number" && Number.isFinite(t) && t >= 0 && typeof n == "number" && Number.isFinite(n) && n >= 0)
      return [t, n];
  }
}, $h = (e) => {
  if (typeof e != "number" || !Number.isFinite(e)) return;
  const t = Math.floor(e);
  return t >= 2 ? Math.min(20, t) : void 0;
}, qh = /* @__PURE__ */ new Set(["value", "time", "category", "log"]), ms = (e, t) => typeof e == "string" && qh.has(e) ? e : t, jh = (e, t) => {
  if (e === "log")
    return t == null ? 10 : typeof t == "number" && Number.isFinite(t) && t > 0 && t !== 1 ? t : (console.warn(`[ChartGPU] Invalid axis logBase (${String(t)}); falling back to 10.`), 10);
}, ka = (e) => {
  const t = ms(e.type, "value"), n = jh(t, e.logBase), i = Xh(e.autoRange), r = Vh(e.growBy), o = $h(e.tickCount);
  let s = e;
  return (t !== e.type || n !== e.logBase) && (s = n !== void 0 ? { ...s, type: t, logBase: n } : { ...s, type: t }), e.autoRange !== void 0 && (s = { ...s, autoRange: i ?? "sticky" }), e.growBy !== void 0 && (s = r !== void 0 ? { ...s, growBy: r } : { ...s, growBy: void 0 }), e.tickCount !== void 0 && (s = o !== void 0 ? { ...s, tickCount: o } : { ...s, tickCount: void 0 }), s;
}, Zh = (e) => Array.isArray(e), _c = (e) => {
  if (e.length === 0) return;
  let t = Number.POSITIVE_INFINITY, n = Number.NEGATIVE_INFINITY, i = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  if (Zh(e[0])) {
    const s = e;
    for (let a = 0; a < s.length; a++) {
      const l = s[a], c = l[0], u = l[3], f = l[4];
      if (!Number.isFinite(c) || !Number.isFinite(u) || !Number.isFinite(f)) continue;
      const d = Math.min(u, f), m = Math.max(u, f);
      c < t && (t = c), c > n && (n = c), d < i && (i = d), m > r && (r = m);
    }
  } else {
    const s = e;
    for (let a = 0; a < s.length; a++) {
      const l = s[a], c = l.timestamp, u = l.low, f = l.high;
      if (!Number.isFinite(c) || !Number.isFinite(u) || !Number.isFinite(f)) continue;
      const d = Math.min(u, f), m = Math.max(u, f);
      c < t && (t = c), c > n && (n = c), d < i && (i = d), m > r && (r = m);
    }
  }
  if (!(!Number.isFinite(t) || !Number.isFinite(n) || !Number.isFinite(i) || !Number.isFinite(r)))
    return t === n && (n = t + 1), i === r && (r = i + 1), { xMin: t, xMax: n, yMin: i, yMax: r };
}, Kh = (e) => {
  throw new Error(
    `Unhandled series type: ${(e == null ? void 0 : e.type) ?? "unknown"}`
  );
}, zc = /* @__PURE__ */ new Set();
function Jh(e, t) {
  const n = `${e}:${String(t)}`;
  zc.has(n) || (zc.add(n), console.warn(
    `ChartGPU: series[${e}] step value ${JSON.stringify(t)} is invalid; using linear geometry. Valid: true | false | 'before' | 'middle' | 'after'.`
  ));
}
function Gc(e, t) {
  if (e == null || e === !1) return;
  if (lh(e)) {
    Jh(t, e);
    return;
  }
  return Ps(e) ?? void 0;
}
const Oc = /* @__PURE__ */ new Set();
function Hc(e, t) {
  t === "none" || Oc.has(e) || (Oc.add(e), console.warn(
    `ChartGPU: series[${e}] has step + sampling '${t}'; step is applied after sampling and is approximate for digital signals — prefer sampling: 'none'.`
  ));
}
let Yc = !1;
const Wc = /* @__PURE__ */ new Set(), Qh = (e) => {
  Wc.has(e) || (Wc.add(e), console.warn(
    `ChartGPU: series[${e}] has both stack and baseline; baseline is ignored for stacked mountain/area layout (cumulative floor from 0).`
  ));
}, Xc = /* @__PURE__ */ new Set(), e0 = (e) => {
  Xc.has(e) || (Xc.add(e), console.warn(
    `ChartGPU: series[${e}] has stack without areaStyle; stack has no fill effect on stroke-only lines.`
  ));
};
function t0(e) {
  const t = ea(e, { includeHidden: !1 });
  if (t.size !== 0)
    for (const n of t.values()) {
      if (n.length === 0) continue;
      const i = n.map((s) => ({
        seriesIndex: s.seriesIndex,
        data: s.series.data ?? []
      })), r = Qs(i), o = Xp(r);
      if (o)
        for (const s of n) {
          const a = e[s.seriesIndex];
          if (!a) continue;
          const l = a.rawBounds;
          if (!l) {
            a.rawBounds = {
              xMin: 0,
              xMax: 1,
              yMin: o.yMin,
              yMax: o.yMax
            };
            continue;
          }
          a.rawBounds = {
            xMin: l.xMin,
            xMax: l.xMax,
            yMin: o.yMin,
            yMax: o.yMax
          };
        }
    }
}
const n0 = () => {
  Yc || (console.warn("ChartGPU: Candlestick series rendering is not yet implemented. Series will be skipped."), Yc = !0);
};
function i0(e) {
  const { previousResolvedSeries: t, previousUserOptions: n, userOptions: i, lastUserSeriesElements: r } = e;
  if (t == null || n == null) return !1;
  const o = i.series;
  if (o == null || n.theme !== i.theme || n.palette !== i.palette) return !1;
  const s = n.coordinateSystem ?? "cartesian2d", a = i.coordinateSystem ?? "cartesian2d";
  if (s !== a || t.length !== o.length) return !1;
  const l = n.series;
  if (l == null || l.length !== o.length || l === o && r == null)
    return !1;
  const c = r ?? l;
  if (c.length !== o.length) return !1;
  for (let u = 0; u < o.length; u++)
    if (c[u] !== o[u]) return !1;
  return !0;
}
function Ni(e, t, n, i, r, o, s) {
  if (!e || e.type !== t || e.type === "pie" || e.type === "heatmap") return !1;
  const a = e;
  return !((a.rawData ?? a.data) !== n || a.sampling !== i || a.samplingThreshold !== r || (a.connectNulls ?? !1) !== (o ?? !1) || typeof a.contentHash != "number" || a.contentHash !== s);
}
function Mi(e, t, n, i) {
  if (e && e.type === t && e.type !== "pie" && e.type !== "heatmap") {
    const r = e;
    if ((r.rawData ?? r.data) === n && typeof r.contentHash == "number")
      return r.contentHash;
  }
  return i();
}
const Vc = /* @__PURE__ */ new Set();
function $c(e, t) {
  Vc.has(e) || (Vc.add(e), console.warn(t));
}
function r0(e) {
  return Ol(e) || Array.isArray(e) && e.length > 0 && e.every((t) => typeof t == "string") ? e : Co.colormap;
}
function o0(e) {
  return e === "transparent" || e === "lowest" || e === "highest" ? e : Co.nullHandling;
}
function s0(e) {
  return e === "corner" || e === "center" ? e : Co.cellAnchor;
}
function a0(e, t) {
  const {
    sampling: n,
    samplingThreshold: i,
    color: r,
    ...o
  } = e, s = Js(e.data), a = s0(e.cellAnchor), l = r0(e.colormap), c = e.zScale === "log" ? "log" : Co.zScale, u = o0(e.nullHandling), f = typeof e.opacity == "number" && Number.isFinite(e.opacity) ? e.opacity : Co.opacity, d = Math.min(1, Math.max(0, f)), m = typeof e.cellGapPx == "number" && Number.isFinite(e.cellGapPx) && e.cellGapPx > 0 ? e.cellGapPx : 0;
  if (!s)
    return $c(
      `geom:${t.seriesIndex}`,
      `ChartGPU: heatmap series[${t.seriesIndex}] has invalid dimensions or zero/non-finite steps; series will not draw.`
    ), {
      ...o,
      type: "heatmap",
      visible: t.visible,
      yAxis: t.yAxis,
      color: t.color,
      data: e.data,
      colormap: l,
      zMin: 0,
      zMax: 1,
      zDomainExplicit: !1,
      zScale: c,
      opacity: d,
      cellAnchor: a,
      nullHandling: u,
      cellGapPx: m,
      drawable: !1,
      cellCount: 0
    };
  const p = s.columns * s.rows;
  s.zLength !== p && $c(
    `zlen:${t.seriesIndex}:${s.zLength}:${p}`,
    `ChartGPU: heatmap series[${t.seriesIndex}] z.length (${s.zLength}) !== columns*rows (${p}); drawing min(len, cols*rows) cells.`
  );
  const y = typeof e.zMin == "number" && Number.isFinite(e.zMin) ? e.zMin : void 0, g = typeof e.zMax == "number" && Number.isFinite(e.zMax) ? e.zMax : void 0, S = y != null && g != null, A = bp(e.data.z, p, c);
  let M = y ?? A.zMin, h = g ?? A.zMax;
  if (y != null && g == null && (h = Math.max(y, A.zMax)), g != null && y == null && (M = Math.min(g, A.zMin)), M === h) {
    const x = M === 0 ? 1e-6 : Math.abs(M) * 1e-6;
    M -= x, h += x;
  }
  const b = Yl(
    {
      xStart: s.xStart,
      xStep: s.xStep,
      yStart: s.yStart,
      yStep: s.yStep,
      columns: s.columns,
      rows: s.rows
    },
    a
  ), v = {
    xStart: s.xStart,
    xStep: s.xStep,
    yStart: s.yStart,
    yStep: s.yStep,
    columns: s.columns,
    rows: s.rows,
    z: e.data.z
  };
  return {
    ...o,
    type: "heatmap",
    visible: t.visible,
    yAxis: t.yAxis,
    color: t.color,
    data: v,
    colormap: l,
    zMin: M,
    zMax: h,
    zDomainExplicit: S,
    zScale: c,
    opacity: d,
    cellAnchor: a,
    nullHandling: u,
    cellGapPx: m,
    rawBounds: b,
    drawable: s.drawCells > 0,
    cellCount: p
  };
}
function Ld(e = {}, t) {
  var fe, X, z, $, Z, Q, K, ne;
  const n = (fe = t == null ? void 0 : t.previousResolved) == null ? void 0 : fe.series, i = (X = t == null ? void 0 : t.previousResolved) == null ? void 0 : X.theme, r = t == null ? void 0 : t.previousUserOptions, o = e.coordinateSystem === "cartesian3d" ? "cartesian3d" : "cartesian2d", s = Rh(e.camera), a = Dh(e.interaction3d), l = kh(e.axes3d), c = e.autoScroll, u = typeof c == "boolean" ? c : Bn.autoScroll, d = ((z = e.performance) == null ? void 0 : z.lod) === "strict" ? "strict" : "auto", m = { lod: d }, p = d === "strict", y = e.animation, S = (typeof y == "boolean" || y !== null && typeof y == "object" && !Array.isArray(y) ? y : void 0) ?? !0, A = i != null && r != null && r.theme === e.theme && r.palette === e.palette;
  let M;
  if (A)
    M = i;
  else {
    const L = zh(e.theme), le = po(e.palette), se = le.length > 0 ? { ...L, colorPalette: le } : L, ae = po(se.colorPalette), de = ae.length > 0 ? ae : po(Bn.palette ?? fs).length > 0 ? po(Bn.palette ?? fs) : Array.from(fs), re = de.length > 0 ? de : ["#000000"];
    M = {
      ...se,
      colorPalette: re.slice()
    };
  }
  const h = wp(e), v = ((L, le) => {
    const se = (L == null ? void 0 : L.show) !== !1, ae = Fn(L == null ? void 0 : L.color) ?? le.gridLineColor, de = typeof (L == null ? void 0 : L.opacity) == "number" && Number.isFinite(L.opacity) ? Math.min(1, Math.max(0, L.opacity)) : 1, re = (te, Be) => {
      if (Be === 1) return te;
      const Me = wn(te);
      return Me ? `rgba(${Math.round(Me[0] * 255)}, ${Math.round(Me[1] * 255)}, ${Math.round(Me[2] * 255)}, ${Me[3] * Be})` : te;
    }, ie = re(ae, de), be = (te, Be) => {
      if (te === !1)
        return { show: !1, count: 0, color: ie };
      if (te === !0 || te === void 0)
        return {
          show: se,
          count: Be,
          color: ie
        };
      const Me = te.show !== !1 && se, _e = typeof te.count == "number" && Number.isFinite(te.count) && te.count >= 0 ? Math.floor(te.count) : Be, Le = Fn(te.color), ge = Le != null ? re(Le, de) : ie;
      return {
        show: Me,
        count: _e,
        color: ge
      };
    };
    return {
      show: se,
      color: ie,
      opacity: de,
      horizontal: be(L == null ? void 0 : L.horizontal, vc.horizontal.count),
      vertical: be(L == null ? void 0 : L.vertical, vc.vertical.count)
    };
  })(e.gridLines, M), x = ka(
    e.xAxis ? {
      ...Bn.xAxis,
      ...e.xAxis,
      // runtime safety for JS callers
      type: ms(
        e.xAxis.type,
        Bn.xAxis.type
      ),
      autoBounds: Da(e.xAxis.autoBounds) ?? Bn.xAxis.autoBounds
    } : { ...Bn.xAxis }
  ), F = h ? "right" : "left", I = [];
  if (($ = e.axes) != null && $.y && e.axes.y.length > 0)
    for (let L = 0; L < e.axes.y.length; L++) {
      const le = e.axes.y[L], se = L === 0 ? F : "left";
      I.push(
        ka({
          ...Bn.yAxis,
          ...le,
          id: le.id ?? (L === 0 ? "y" : `y${L}`),
          position: le.position ?? se,
          type: ms(le.type, Bn.yAxis.type),
          autoBounds: Da(le.autoBounds) ?? Bn.yAxis.autoBounds
        })
      );
    }
  else
    I.push(
      ka(
        e.yAxis ? {
          ...Bn.yAxis,
          ...e.yAxis,
          id: e.yAxis.id ?? "y",
          position: e.yAxis.position ?? F,
          type: ms(
            e.yAxis.type,
            Bn.yAxis.type
          ),
          autoBounds: Da(
            e.yAxis.autoBounds
          ) ?? Bn.yAxis.autoBounds
        } : { ...Bn.yAxis, id: "y", position: F }
      )
    );
  const R = I.some((L) => (L.position ?? "left") === "left"), T = I.some((L) => (L.position ?? "left") === "right"), N = R ? Ma.leftWithLeftY : Ma.leftNoLeftY, w = Ma.right, P = () => {
    var le;
    const L = (le = e.grid) == null ? void 0 : le.right;
    return L === void 0 || T && L > 0 && L < w ? w : L;
  }, B = {
    left: ((Z = e.grid) == null ? void 0 : Z.left) ?? (h ? N : Bn.grid.left),
    right: h ? P() : ((Q = e.grid) == null ? void 0 : Q.right) ?? Bn.grid.right,
    top: ((K = e.grid) == null ? void 0 : K.top) ?? Bn.grid.top,
    bottom: ((ne = e.grid) == null ? void 0 : ne.bottom) ?? Bn.grid.bottom
  }, _ = I[0].id ?? "y", C = (L) => typeof L == "number" && Number.isFinite(L), E = C(x.min) && C(x.max), U = I.length > 0 && I.every((L) => C(L.min) && C(L.max)), O = E && U ? {
    xMin: x.min,
    xMax: x.max,
    yMin: I[0].min,
    yMax: I[0].max
  } : void 0, D = U ? {
    yMin: I[0].min,
    yMax: I[0].max
  } : void 0, k = (L, le, se, ae) => {
    if (O)
      return { bounds: O, mode: "synthetic" };
    if (D) {
      if (se && (L == null ? void 0 : L.rawBoundsMode) === "xDataYAxis" && L.rawBounds)
        return {
          bounds: {
            xMin: L.rawBounds.xMin,
            xMax: L.rawBounds.xMax,
            yMin: D.yMin,
            yMax: D.yMax
          },
          mode: "xDataYAxis"
        };
      let de, re, ie = !1;
      if (ae != null && ae.trustIndexSorted || Ml(le)) {
        const be = $e(le);
        de = 0, re = Math.max(1, be - 1), ie = !0;
      } else {
        const be = Rp(le);
        if (!be) return { bounds: void 0, mode: "xDataYAxis" };
        de = be.xMin, re = be.xMax;
      }
      return {
        bounds: {
          xMin: de,
          xMax: re,
          yMin: D.yMin,
          yMax: D.yMax
        },
        mode: "xDataYAxis",
        indexSortedHit: ie
      };
    }
    return se && (L == null ? void 0 : L.rawBoundsMode) === "data" && L.rawBounds ? { bounds: L.rawBounds, mode: "data" } : {
      bounds: Rn(le) ?? void 0,
      mode: "data"
    };
  }, W = t == null ? void 0 : t.previousUserOptions, j = i0({
    previousResolvedSeries: n,
    previousUserOptions: W,
    userOptions: e,
    lastUserSeriesElements: t == null ? void 0 : t.lastUserSeriesElements
  }), ee = j ? n : (e.series ?? []).map((L, le) => {
    var _e, Le, ge, Ee, Se, ve, xe, Pe, Oe, Xe, Ze, ze, Ue, Ae, Qe, At, It, Tt, Ot, Ht, xt, $t, Mt;
    const se = L.type;
    if (o === "cartesian3d" && Th.has(se))
      return console.warn(
        `ChartGPU: series[${le}] type '${se}' is not valid in coordinateSystem 'cartesian3d'; skipping.`
      ), null;
    if (o === "cartesian2d" && Bh.has(se))
      return console.warn(
        `ChartGPU: series[${le}] type '${se}' requires coordinateSystem 'cartesian3d'; skipping.`
      ), null;
    const ae = Fn(L.color), de = M.colorPalette[le % M.colorPalette.length], re = ae ?? de, ie = n == null ? void 0 : n[le], be = L.visible !== !1, te = Gh(L.sampling) ?? "lttb", Be = Ra(L.samplingThreshold) ?? 5e3, Me = L.yAxis ?? _;
    switch (L.type) {
      case "pointCloud3d":
        return Eh(L, { visible: be, color: re });
      case "surface3d":
        return Lh(L, { visible: be, color: re });
      case "area": {
        const Ie = Fn((_e = L.areaStyle) == null ? void 0 : _e.color) ?? ae ?? de, ke = {
          opacity: ((Le = L.areaStyle) == null ? void 0 : Le.opacity) ?? Sa.opacity,
          color: Ie
        }, Ke = Ao(L.stack);
        Ke !== "" && L.baseline !== void 0 && Number.isFinite(L.baseline) && Qh(le);
        const at = L.connectNulls ?? !1, yt = Mi(
          ie,
          "area",
          L.data,
          () => eo(L.data)
        ), mt = Ni(
          ie,
          "area",
          L.data,
          te,
          Be,
          at,
          yt
        ), nt = mt ? ie : null, { bounds: ct, mode: je } = k(nt, L.data, mt), pt = nt ? nt.data : te === "none" || Fo(L.data) ? L.data : Fi(L.data, te, Be), St = Gc(L.step, le);
        return St != null && Hc(le, te), {
          ...L,
          visible: be,
          rawData: L.data,
          data: pt,
          color: Ie,
          areaStyle: ke,
          sampling: te,
          samplingThreshold: Be,
          rawBounds: ct,
          rawBoundsMode: je,
          connectNulls: at,
          yAxis: Me,
          contentHash: yt,
          // Normalized stack id (empty → omitted / unstacked).
          ...Ke !== "" ? { stack: Ke } : { stack: void 0 },
          // Normalized step mode (true → 'after'); omit when linear.
          ...St != null ? { step: St } : { step: void 0 }
        };
      }
      case "line": {
        const Ie = Fn((ge = L.lineStyle) == null ? void 0 : ge.color) ?? ae ?? de, ke = {
          width: ((Ee = L.lineStyle) == null ? void 0 : Ee.width) ?? Lo.width,
          opacity: ((Se = L.lineStyle) == null ? void 0 : Se.opacity) ?? Lo.opacity,
          color: Ie
        }, { areaStyle: Ke, stack: at, step: yt, ...mt } = L, nt = Ao(L.stack);
        nt !== "" && L.areaStyle == null && e0(le);
        const ct = L.connectNulls ?? !1, je = Gc(L.step, le);
        je != null && Hc(le, te);
        const pt = Mi(
          ie,
          "line",
          L.data,
          () => eo(L.data)
        ), St = Ni(
          ie,
          "line",
          L.data,
          te,
          Be,
          ct,
          pt
        ), Zt = St ? ie : null, { bounds: Ge, mode: Ye } = k(Zt, L.data, St), rt = Zt ? Zt.data : te === "none" || Fo(L.data) ? L.data : Fi(L.data, te, Be);
        return {
          ...mt,
          visible: be,
          rawData: L.data,
          data: rt,
          color: Ie,
          lineStyle: ke,
          ...L.areaStyle ? {
            areaStyle: {
              opacity: L.areaStyle.opacity ?? Sa.opacity,
              // Fill color precedence: areaStyle.color → resolved stroke color
              color: Fn(L.areaStyle.color) ?? Ie
            }
          } : {},
          sampling: te,
          samplingThreshold: Be,
          rawBounds: Ge,
          rawBoundsMode: Ye,
          connectNulls: ct,
          yAxis: Me,
          contentHash: pt,
          ...nt !== "" ? { stack: nt } : { stack: void 0 },
          ...je != null ? { step: je } : { step: void 0 }
        };
      }
      case "bar": {
        const we = Mi(
          ie,
          "bar",
          L.data,
          () => eo(L.data)
        ), Ie = Ni(
          ie,
          "bar",
          L.data,
          te,
          Be,
          void 0,
          we
        ), ke = Ie ? ie : null, { bounds: Ke, mode: at } = k(ke, L.data, Ie);
        return {
          ...L,
          visible: be,
          rawData: L.data,
          data: ke ? ke.data : Fi(L.data, te, Be),
          color: re,
          sampling: te,
          samplingThreshold: Be,
          rawBounds: Ke,
          rawBoundsMode: at,
          yAxis: Me,
          contentHash: we
        };
      }
      case "scatter": {
        const we = Mi(
          ie,
          "scatter",
          L.data,
          () => eo(L.data)
        ), Ie = Ni(
          ie,
          "scatter",
          L.data,
          te,
          Be,
          void 0,
          we
        ), ke = (ie == null ? void 0 : ie.type) === "scatter" ? ie : null, Ke = Ie ? ie : null, at = $e(L.data), yt = (ke == null ? void 0 : ke.indexSortedProven) === !0 && ke.indexSortedPointCount === at;
        let mt, nt = !1, ct = yt && (ke == null ? void 0 : ke.indexSortedFingerprint) !== void 0 ? ke.indexSortedFingerprint : void 0;
        if (Ke)
          mt = Ke.data, nt = yt;
        else if (te === "lttb" && ke && ke.sampling === "lttb" && ke.samplingThreshold === Be)
          ph(
            ke.rawData,
            L.data,
            {
              prevIndexSortedProven: yt,
              prevIndexSortedFingerprint: ke.indexSortedFingerprint
            }
          ) === "indexSorted" ? (nt = !0, ct = or(L.data), p ? mt = Fi(L.data, te, Be) : mt = bh(ke.data, L.data) ?? Fi(L.data, te, Be)) : mt = Fi(L.data, te, Be);
        else if (yt && Sl(L.data)) {
          const Dt = or(L.data), wt = (ke == null ? void 0 : ke.indexSortedFingerprint) ?? ((ke == null ? void 0 : ke.rawData) != null ? or(ke.rawData) : Dt);
          Dt === wt && (nt = !0, ct = Dt), mt = Fi(L.data, te, Be);
        } else
          mt = Fi(L.data, te, Be), Sl(L.data) && Ml(L.data) && (nt = !0, ct = or(L.data));
        const {
          bounds: je,
          mode: pt,
          indexSortedHit: St
        } = k(Ke, L.data, Ie, {
          // Only trust when this frame re-validated sticky or cold-proved — never
          // after classify rejected (Brownian).
          trustIndexSorted: nt
        }), Zt = !!(nt || St);
        Zt && ct === void 0 && (ct = or(L.data));
        const Ge = Oh(L.mode) ?? _o.mode, Ye = Yh(L.binSize) ?? _o.binSize, rt = Wh(L.densityColormap) ?? _o.densityColormap, bt = Hh(
          L.densityNormalization
        ) ?? _o.densityNormalization;
        return {
          ...L,
          visible: be,
          rawData: L.data,
          data: mt,
          color: re,
          mode: Ge,
          binSize: Ye,
          densityColormap: rt,
          densityNormalization: bt,
          sampling: te,
          samplingThreshold: Be,
          rawBounds: je,
          rawBoundsMode: pt,
          yAxis: Me,
          contentHash: we,
          ...Zt ? {
            indexSortedProven: !0,
            indexSortedPointCount: at,
            ...ct !== void 0 ? { indexSortedFingerprint: ct } : {}
          } : {}
        };
      }
      case "pie": {
        const {
          sampling: we,
          samplingThreshold: Ie,
          ...ke
        } = L, Ke = (L.data ?? []).map((at, yt) => {
          const mt = Fn(at == null ? void 0 : at.color), nt = M.colorPalette[(le + yt) % M.colorPalette.length], ct = (at == null ? void 0 : at.visible) !== !1;
          return {
            ...at,
            color: mt ?? nt,
            visible: ct
          };
        });
        return { ...ke, visible: be, color: re, data: Ke };
      }
      case "heatmap":
        return a0(L, {
          visible: be,
          yAxis: Me,
          seriesIndex: le,
          color: re
        });
      case "band": {
        const Ie = Fn((ve = L.areaStyle) == null ? void 0 : ve.color) ?? ae ?? de, ke = {
          opacity: ((xe = L.areaStyle) == null ? void 0 : xe.opacity) ?? Sa.opacity,
          color: Ie
        };
        let Ke;
        if (L.lineStyle != null) {
          const Ye = Fn(L.lineStyle.color) ?? ae ?? de;
          Ke = {
            width: L.lineStyle.width ?? 1,
            opacity: L.lineStyle.opacity ?? Lo.opacity,
            color: Ye
          };
        }
        let at;
        if (L.lineStyleY1 != null) {
          const Ge = Fn(L.lineStyleY1.color) ?? ae ?? de;
          at = {
            width: L.lineStyleY1.width ?? 1,
            opacity: L.lineStyleY1.opacity ?? Lo.opacity,
            color: Ge
          };
        }
        let yt = te === "ohlc" ? "lttb" : te;
        te === "ohlc" && console.warn(`ChartGPU band series[${le}]: sampling 'ohlc' is not supported; using 'lttb'.`);
        const mt = L.connectNulls ?? !1, nt = Mi(
          ie,
          "band",
          L.data,
          () => nh(L.data)
        ), je = Ni(
          ie,
          "band",
          L.data,
          yt,
          Be,
          mt,
          nt
        ) ? ie : null;
        let pt, St;
        je != null && je.rawBounds && je.rawBoundsMode === "data" ? (pt = je.rawBounds, St = "data") : (pt = qn(L.data) ?? void 0, St = pt ? "data" : "synthetic"), yn(L.data);
        const Zt = je ? je.data : yt === "none" || xd(L.data) ? L.data : vd(L.data, yt, Be);
        return {
          type: "band",
          name: L.name,
          visible: be,
          rawData: L.data,
          data: Zt,
          color: Ie,
          areaStyle: ke,
          ...Ke ? { lineStyle: Ke } : {},
          ...at ? { lineStyleY1: at } : {},
          sampling: yt,
          samplingThreshold: Be,
          rawBounds: pt,
          rawBoundsMode: St,
          connectNulls: mt,
          yAxis: Me,
          contentHash: nt
        };
      }
      case "candlestick": {
        n0();
        const we = Uc(L.sampling) ?? ai.sampling, Ie = Ra(L.samplingThreshold) ?? ai.samplingThreshold, ke = {
          upColor: Fn((Pe = L.itemStyle) == null ? void 0 : Pe.upColor) ?? ai.itemStyle.upColor,
          downColor: Fn((Oe = L.itemStyle) == null ? void 0 : Oe.downColor) ?? ai.itemStyle.downColor,
          upBorderColor: Fn((Xe = L.itemStyle) == null ? void 0 : Xe.upBorderColor) ?? ai.itemStyle.upBorderColor,
          downBorderColor: Fn((Ze = L.itemStyle) == null ? void 0 : Ze.downBorderColor) ?? ai.itemStyle.downBorderColor,
          borderWidth: typeof ((ze = L.itemStyle) == null ? void 0 : ze.borderWidth) == "number" && Number.isFinite(L.itemStyle.borderWidth) ? L.itemStyle.borderWidth : ai.itemStyle.borderWidth
        }, Ke = Mi(
          ie,
          "candlestick",
          L.data,
          () => Ec(L.data)
        ), yt = Ni(
          ie,
          "candlestick",
          L.data,
          we,
          Ie,
          void 0,
          Ke
        ) ? ie : null, mt = (yt == null ? void 0 : yt.rawBounds) ?? _c(L.data), nt = yt ? yt.data : we === "ohlc" && L.data.length > Ie ? wl(L.data, Ie) : L.data, ct = Ac(L.priceLabel, { candlePrimary: h });
        return {
          ...L,
          visible: be,
          rawData: L.data,
          data: nt,
          color: re,
          style: L.style ?? ai.style,
          itemStyle: ke,
          barWidth: L.barWidth ?? ai.barWidth,
          barMinWidth: L.barMinWidth ?? ai.barMinWidth,
          barMaxWidth: L.barMaxWidth ?? ai.barMaxWidth,
          sampling: we,
          samplingThreshold: Ie,
          priceLabel: ct,
          rawBounds: mt,
          yAxis: Me,
          contentHash: Ke
        };
      }
      case "ohlc": {
        const we = L, Ie = Uc(we.sampling) ?? Qn.sampling, ke = Ra(
          we.samplingThreshold
        ) ?? Qn.samplingThreshold, Ke = {
          upColor: Fn((Ue = we.itemStyle) == null ? void 0 : Ue.upColor) ?? Qn.itemStyle.upColor,
          downColor: Fn((Ae = we.itemStyle) == null ? void 0 : Ae.downColor) ?? Qn.itemStyle.downColor,
          upBorderColor: Fn((Qe = we.itemStyle) == null ? void 0 : Qe.upBorderColor) ?? Qn.itemStyle.upBorderColor,
          downBorderColor: Fn((At = we.itemStyle) == null ? void 0 : At.downBorderColor) ?? Qn.itemStyle.downBorderColor,
          borderWidth: typeof ((It = we.itemStyle) == null ? void 0 : It.borderWidth) == "number" && Number.isFinite(we.itemStyle.borderWidth) ? we.itemStyle.borderWidth : Qn.itemStyle.borderWidth
        }, at = Mi(
          ie,
          "ohlc",
          we.data,
          () => Ec(we.data)
        ), mt = Ni(
          ie,
          "ohlc",
          we.data,
          Ie,
          ke,
          void 0,
          at
        ) ? ie : null, nt = (mt == null ? void 0 : mt.rawBounds) ?? _c(we.data), ct = mt ? mt.data : Ie === "ohlc" && we.data.length > ke ? wl(we.data, ke) : we.data, je = Ac(we.priceLabel, { candlePrimary: h }), pt = typeof we.stemWidth == "number" && Number.isFinite(we.stemWidth) && we.stemWidth > 0 ? we.stemWidth : Qn.stemWidth, St = we.tickLength ?? Qn.tickLength;
        return {
          type: "ohlc",
          name: we.name,
          visible: be,
          rawData: we.data,
          data: ct,
          color: re,
          itemStyle: Ke,
          barWidth: we.barWidth ?? Qn.barWidth,
          barMinWidth: we.barMinWidth ?? Qn.barMinWidth,
          barMaxWidth: we.barMaxWidth ?? Qn.barMaxWidth,
          stemWidth: pt,
          tickLength: St,
          sampling: Ie,
          samplingThreshold: ke,
          priceLabel: je,
          rawBounds: nt,
          yAxis: Me,
          contentHash: at
        };
      }
      case "errorBar": {
        const we = L, Ie = we.sampling;
        Ie != null && Ie !== "none" && console.warn(
          `ChartGPU errorBar series[${le}]: sampling '${String(Ie)}' is not supported; using 'none'.`
        );
        const ke = Fn((Tt = we.itemStyle) == null ? void 0 : Tt.color) ?? ae ?? de, Ke = typeof ((Ot = we.itemStyle) == null ? void 0 : Ot.borderWidth) == "number" && Number.isFinite(we.itemStyle.borderWidth) ? we.itemStyle.borderWidth : wr.itemStyle.borderWidth, at = typeof ((Ht = we.itemStyle) == null ? void 0 : Ht.opacity) == "number" && Number.isFinite(we.itemStyle.opacity) ? Math.min(1, Math.max(0, we.itemStyle.opacity)) : wr.itemStyle.opacity, yt = we.errorMode === "high" || we.errorMode === "low" || we.errorMode === "both" ? we.errorMode : wr.errorMode, mt = we.direction === "horizontal" || we.direction === "vertical" ? we.direction : wr.direction, nt = Mi(
          ie,
          "errorBar",
          we.data,
          () => ih(we.data)
        ), je = Ni(
          ie,
          "errorBar",
          we.data,
          "none",
          void 0,
          void 0,
          nt
        ) ? ie : null;
        On(we.data);
        const pt = je ? je.data : Xr(we.data);
        let St, Zt;
        je != null && je.rawBounds && je.rawBoundsMode === "data" && je.direction === mt ? (St = je.rawBounds, Zt = "data") : (St = hi(pt, mt) ?? void 0, Zt = St ? "data" : "synthetic");
        const Ge = we.capWidth ?? wr.capWidth, Ye = we.drawWhiskers !== !1, rt = we.drawConnector !== !1, bt = we.showCenter === !0, Dt = typeof we.symbolSize == "number" && Number.isFinite(we.symbolSize) && we.symbolSize > 0 ? we.symbolSize : wr.symbolSize;
        return {
          type: "errorBar",
          name: we.name,
          visible: be,
          color: ke,
          itemStyle: {
            color: ke,
            borderWidth: Ke,
            opacity: at
          },
          capWidth: Ge,
          errorMode: yt,
          direction: mt,
          drawWhiskers: Ye,
          drawConnector: rt,
          showCenter: bt,
          symbolSize: Dt,
          sampling: "none",
          rawData: we.data,
          data: pt,
          rawBounds: St,
          rawBoundsMode: Zt,
          yAxis: Me,
          contentHash: nt
        };
      }
      case "impulse": {
        const we = L, ke = Fn((xt = we.lineStyle) == null ? void 0 : xt.color) ?? ae ?? de, Ke = ($t = we.lineStyle) == null ? void 0 : $t.width, at = typeof Ke == "number" && Number.isFinite(Ke) && Ke > 0 ? Ke : Uo.lineStyle.width, yt = at > 0 ? at : 1, mt = typeof ((Mt = we.lineStyle) == null ? void 0 : Mt.opacity) == "number" && Number.isFinite(we.lineStyle.opacity) ? Math.min(1, Math.max(0, we.lineStyle.opacity)) : Uo.lineStyle.opacity;
        let nt = Uo.baseline;
        we.baseline !== void 0 && (Number.isFinite(we.baseline) ? nt = we.baseline : (console.warn(`ChartGPU impulse series[${le}]: non-finite baseline; using 0.`), nt = 0));
        const ct = we.showMarker !== !1, je = typeof we.symbolSize == "number" && Number.isFinite(we.symbolSize) && we.symbolSize > 0 ? we.symbolSize : Uo.symbolSize, pt = we.sampling;
        pt != null && pt !== "none" && console.warn(
          `ChartGPU impulse series[${le}]: sampling '${String(pt)}' is not supported; using 'none'.`
        );
        const St = Mi(
          ie,
          "impulse",
          we.data,
          () => eo(we.data)
        ), Ge = Ni(
          ie,
          "impulse",
          we.data,
          "none",
          void 0,
          void 0,
          St
        ) ? ie : null;
        let Ye, rt;
        return Ge != null && Ge.rawBounds && Ge.rawBoundsMode === "data" && Ge.baseline === nt ? (Ye = Ge.rawBounds, rt = "data") : (Ye = Gr(we.data, nt) ?? void 0, rt = Ye ? "data" : "synthetic"), {
          type: "impulse",
          name: we.name,
          visible: be,
          color: ke,
          baseline: nt,
          lineStyle: {
            width: yt,
            opacity: mt,
            color: ke
          },
          showMarker: ct,
          symbolSize: je,
          sampling: "none",
          rawData: we.data,
          data: Ge ? Ge.data : we.data,
          rawBounds: Ye,
          rawBoundsMode: rt,
          yAxis: Me,
          contentHash: St
        };
      }
      default:
        return Kh(L);
    }
  }).filter((L) => L != null);
  return !j && ee.some((L) => Yr(L)) && t0(ee), {
    coordinateSystem: o,
    camera: s,
    interaction3d: a,
    axes3d: l,
    grid: B,
    gridLines: v,
    xAxis: x,
    yAxes: I,
    autoScroll: u,
    dataZoom: Uh(e.dataZoom),
    annotations: _h(e.annotations),
    animation: S,
    theme: M,
    palette: M.colorPalette,
    series: ee,
    legend: e.legend,
    // Default true (4× MSAA). Explicit false → sampleCount 1 for multi-chart fill/memory.
    antialias: e.antialias !== !1,
    // Create-time canvas / text-overlay DPR. Undefined → live window.devicePixelRatio on resize.
    devicePixelRatio: e.devicePixelRatio,
    performance: m
  };
}
const l0 = 32, c0 = 8, u0 = l0 + c0, f0 = (e) => {
  var t;
  return ((t = e.dataZoom) == null ? void 0 : t.some((n) => (n == null ? void 0 : n.type) === "slider")) ?? !1;
};
function qc(e = {}, t) {
  const n = {
    ...Ld(e, t),
    tooltip: e.tooltip
  };
  return f0(e) ? {
    ...n,
    grid: {
      ...n.grid,
      bottom: n.grid.bottom + u0
    }
  } : n;
}
const PM = { resolve: Ld };
function d0(e, t) {
  return e == null || t == null ? !1 : t !== e;
}
const Ti = (e) => {
  const t = Number(e);
  return Number.isFinite(t) ? t : Number.NaN;
};
let jc = !1;
const $l = (e, t, n) => {
  jc || t < n && (jc = !0, console.warn(
    `ChartGPU.updateHeatmap(${e}): z.length (${t}) < required (${n}); missing cells filled with NaN.`
  ));
}, bo = (e, t) => t < 0 || t >= e.length ? Number.NaN : Ti(e[t]);
function Zc(e, t) {
  let n = 1 / 0, i = -1 / 0;
  const r = Math.min(e.length, t);
  for (let o = 0; o < r; o++) {
    const s = Number(e[o]);
    Number.isFinite(s) && (s < n && (n = s), s > i && (i = s));
  }
  return Number.isFinite(n) ? i > n ? { zMin: n, zMax: i } : { zMin: n, zMax: n + 1 } : { zMin: 0, zMax: 1 };
}
function m0(e, t) {
  const n = Js(e);
  if (!n)
    return {
      data: e,
      dimsChanged: !1,
      scrolled: !1,
      recomputeDomain: !0,
      ringAdvanceCols: 0
    };
  const i = n.columns * n.rows, r = new Float32Array(i), o = t.z;
  $l("replaceZ", o.length, i);
  for (let l = 0; l < i; l++)
    r[l] = l < o.length ? Ti(o[l]) : Number.NaN;
  const s = typeof t.zMin == "number" && Number.isFinite(t.zMin) ? t.zMin : void 0, a = typeof t.zMax == "number" && Number.isFinite(t.zMax) ? t.zMax : void 0;
  return {
    data: {
      xStart: n.xStart,
      xStep: n.xStep,
      yStart: n.yStart,
      yStep: n.yStep,
      columns: n.columns,
      rows: n.rows,
      z: r
    },
    dimsChanged: !1,
    scrolled: !1,
    zMin: s,
    zMax: a,
    recomputeDomain: s == null || a == null,
    ringAdvanceCols: 0
  };
}
function p0(e, t) {
  const n = Js(e);
  if (!n)
    return {
      data: e,
      dimsChanged: !1,
      scrolled: !1,
      recomputeDomain: !0,
      ringAdvanceCols: 0
    };
  const i = Math.max(0, Math.floor(t.columns));
  if (i === 0)
    return {
      data: {
        xStart: n.xStart,
        xStep: n.xStep,
        yStart: n.yStart,
        yStep: n.yStep,
        columns: n.columns,
        rows: n.rows,
        z: e.z
      },
      dimsChanged: !1,
      scrolled: !1,
      recomputeDomain: !1,
      ringAdvanceCols: 0
    };
  const r = n.rows, o = n.columns, s = t.scrollX !== !1, a = t.z, l = e.z;
  if ($l("appendColumns", a.length, i * r), s) {
    const f = Math.max(0, o - i), d = o - f, m = new Float32Array(o * r);
    if (i === 1 && f === o - 1 && o >= 2)
      for (let p = 0; p < r; p++) {
        const y = p * o;
        if (l instanceof Float32Array)
          m.set(l.subarray(y + 1, y + o), y);
        else
          for (let g = 0; g < f; g++)
            m[y + g] = bo(l, y + g + 1);
        m[y + f] = Ti(a[p]);
      }
    else if (i >= o)
      for (let p = 0; p < o; p++) {
        const y = i - o + p;
        for (let g = 0; g < r; g++)
          m[g * o + p] = Ti(a[y * r + g]);
      }
    else {
      for (let y = 0; y < f; y++) {
        const g = y + (o - f);
        for (let S = 0; S < r; S++)
          m[S * o + y] = bo(l, S * o + g);
      }
      const p = f;
      for (let y = 0; y < i; y++) {
        const g = p + y;
        if (g >= o) break;
        for (let S = 0; S < r; S++)
          m[S * o + g] = Ti(a[y * r + S]);
      }
    }
    return {
      data: {
        xStart: n.xStart + d * n.xStep,
        xStep: n.xStep,
        yStart: n.yStart,
        yStep: n.yStep,
        columns: o,
        rows: r,
        z: m
      },
      dimsChanged: !1,
      scrolled: d > 0 || i > 0,
      // Domain expands from new column in coordinator for cheap strip path
      recomputeDomain: i !== 1,
      // GPU ring: single-column scroll advances by 1; multi-column batch → full upload
      ringAdvanceCols: i === 1 && o >= 1 ? 1 : 0
    };
  }
  const c = o + i, u = new Float32Array(c * r);
  for (let f = 0; f < r; f++)
    for (let d = 0; d < o; d++)
      u[f * c + d] = bo(l, f * o + d);
  for (let f = 0; f < i; f++) {
    const d = o + f;
    for (let m = 0; m < r; m++)
      u[m * c + d] = Ti(a[f * r + m]);
  }
  return {
    data: {
      xStart: n.xStart,
      xStep: n.xStep,
      yStart: n.yStart,
      yStep: n.yStep,
      columns: c,
      rows: r,
      z: u
    },
    dimsChanged: !0,
    scrolled: !1,
    recomputeDomain: !0,
    ringAdvanceCols: 0
  };
}
function h0(e, t) {
  const n = Js(e);
  if (!n)
    return {
      data: e,
      dimsChanged: !1,
      scrolled: !1,
      recomputeDomain: !0,
      ringAdvanceCols: 0
    };
  const i = Math.max(0, Math.floor(t.rows));
  if (i === 0)
    return {
      data: {
        xStart: n.xStart,
        xStep: n.xStep,
        yStart: n.yStart,
        yStep: n.yStep,
        columns: n.columns,
        rows: n.rows,
        z: e.z
      },
      dimsChanged: !1,
      scrolled: !1,
      recomputeDomain: !1,
      ringAdvanceCols: 0
    };
  const r = n.columns, o = n.rows, s = t.scrollY !== !1, a = t.z, l = e.z;
  if ($l("appendRows", a.length, i * r), s) {
    const f = Math.max(0, o - i), d = new Float32Array(r * o);
    for (let p = 0; p < f; p++) {
      const y = p + (o - f);
      for (let g = 0; g < r; g++)
        d[p * r + g] = bo(l, y * r + g);
    }
    if (i >= o)
      for (let p = 0; p < o; p++) {
        const y = i - o + p;
        for (let g = 0; g < r; g++)
          d[p * r + g] = Ti(a[y * r + g]);
      }
    else
      for (let p = 0; p < i; p++) {
        const y = f + p;
        for (let g = 0; g < r; g++)
          d[y * r + g] = Ti(a[p * r + g]);
      }
    const m = o - f;
    return {
      data: {
        xStart: n.xStart,
        xStep: n.xStep,
        yStart: n.yStart + m * n.yStep,
        yStep: n.yStep,
        columns: r,
        rows: o,
        z: d
      },
      dimsChanged: !1,
      scrolled: m > 0 || i > 0,
      recomputeDomain: !0,
      ringAdvanceCols: 0
    };
  }
  const c = o + i, u = new Float32Array(r * c);
  for (let f = 0; f < o; f++)
    for (let d = 0; d < r; d++)
      u[f * r + d] = bo(l, f * r + d);
  for (let f = 0; f < i; f++) {
    const d = o + f;
    for (let m = 0; m < r; m++)
      u[d * r + m] = Ti(a[f * r + m]);
  }
  return {
    data: {
      xStart: n.xStart,
      xStep: n.xStep,
      yStart: n.yStart,
      yStep: n.yStep,
      columns: r,
      rows: c,
      z: u
    },
    dimsChanged: !0,
    scrolled: !1,
    recomputeDomain: !0,
    ringAdvanceCols: 0
  };
}
function y0(e, t) {
  return t.mode === "replaceZ" ? m0(e, t) : t.mode === "appendColumns" ? p0(e, t) : h0(e, t);
}
function g0(e) {
  const { zDomainExplicit: t, seriesZMin: n, seriesZMax: i, prevOverride: r, result: o, update: s } = e;
  if (o.zMin != null && o.zMax != null && !o.recomputeDomain)
    return { zMin: o.zMin, zMax: o.zMax };
  if (t)
    return null;
  if (s.mode === "appendColumns" && s.scrollX !== !1 && Math.floor(s.columns) === 1 && !o.recomputeDomain) {
    const a = r ?? { zMin: n, zMax: i }, l = s.z;
    let c = a.zMin, u = a.zMax;
    const f = Math.min(l.length, o.data.rows);
    for (let d = 0; d < f; d++) {
      const m = Number(l[d]);
      Number.isFinite(m) && (m < c && (c = m), m > u && (u = m));
    }
    if (!Number.isFinite(c)) {
      const d = Zc(o.data.z, o.data.columns * o.data.rows);
      c = d.zMin, u = d.zMax;
    }
    return { zMin: c, zMax: u > c ? u : c + 1 };
  }
  if (o.recomputeDomain) {
    const a = Zc(o.data.z, o.data.columns * o.data.rows), l = o.zMin ?? a.zMin, c = o.zMax ?? a.zMax;
    return { zMin: l, zMax: c > l ? c : l + 1 };
  }
  return r;
}
const sr = /* @__PURE__ */ new WeakMap(), ps = /* @__PURE__ */ new WeakMap(), Ts = /* @__PURE__ */ new WeakMap(), Bs = /* @__PURE__ */ new WeakMap();
function Cl(e) {
  const t = Bs.get(e);
  if (!t || t.length === 0) return;
  Bs.delete(e);
  const n = new Set(t);
  for (const i of n)
    try {
      i.destroy();
    } catch {
    }
}
function x0(e, t) {
  let n = sr.get(e);
  if (n || (n = [], sr.set(e, n)), n.push(t), ps.get(e)) return;
  ps.set(e, !0);
  const i = Ts.get(e) ?? 0;
  queueMicrotask(() => {
    if ((Ts.get(e) ?? 0) !== i) return;
    ps.set(e, !1);
    const r = sr.get(e);
    if (!r || r.length === 0) {
      Cl(e);
      return;
    }
    sr.set(e, []), e.queue.submit(r), Cl(e);
  });
}
function Ud(e) {
  Ts.set(e, (Ts.get(e) ?? 0) + 1), ps.set(e, !1);
  const t = sr.get(e);
  t && t.length > 0 && (sr.set(e, []), e.queue.submit(t)), Cl(e);
}
function b0(e, t) {
  const n = sr.get(e);
  if (!n || n.length === 0) {
    try {
      t.destroy();
    } catch {
    }
    return;
  }
  let i = Bs.get(e);
  i || (i = [], Bs.set(e, i)), i.push(t);
}
const v0 = (
  /* wgsl */
  `
struct Params {
  count : u32,
  _p0 : u32,
  _p1 : u32,
  _p2 : u32,
};
@group(0) @binding(0) var<storage, read_write> points : array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> yIn : array<f32>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= params.count) { return; }
  let p = points[i];
  points[i] = vec2<f32>(p.x, yIn[i]);
}
`
), Yi = 4, Ea = () => GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
function Gi(e) {
  return e + 3 & -4;
}
function hs(e) {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}
function Kc(e, t) {
  const n = Math.max(Yi, Gi(t)), i = Math.max(Yi, hs(n));
  return Math.max(e, i);
}
function La(e, t, n, i) {
  const r = Math.max(Yi, Gi(t)), o = Math.min(n, i);
  if (r > o)
    return r;
  const s = Math.max(Yi, Gi(e));
  return Math.min(o, Math.max(r, s));
}
function w0(e, t) {
  let n = e >>> 0;
  for (let i = 0; i < t.length; i++)
    n ^= t[i], n = Math.imul(n, 16777619) >>> 0;
  return n >>> 0;
}
function Jc(e) {
  const t = new Uint32Array(e.buffer, e.byteOffset, e.byteLength / 4);
  return w0(2166136261, t);
}
function to(e, t, n = 0) {
  let i = e + 2654435769 >>> 0;
  return i = Math.imul(i ^ t >>> 0, 16777619) >>> 0, n > 0 && (i = i + 2246822507 >>> 0), i === e >>> 0 && (i = i + 1 >>> 0), i;
}
function Qc(e, t, n, i, r) {
  if (r <= 0) return;
  if (i <= 0 || n === 0) {
    e !== t && e.set(t.subarray(0, r * 2));
    return;
  }
  const o = e === t, s = o ? new Float32Array(r * 2) : e;
  for (let a = 0; a < r; a++) {
    const l = (n + a) % i;
    s[a * 2] = t[l * 2], s[a * 2 + 1] = t[l * 2 + 1];
  }
  o && e.set(s);
}
function Ua(e, t, n, i) {
  if (i <= 0) return;
  const r = n.subarray(0, i * 2);
  r.byteLength !== 0 && e.queue.writeBuffer(t, 0, r.buffer, r.byteOffset, r.byteLength);
}
function N0(e, t, n, i, r, o) {
  if (o <= 0) return;
  const s = 8, a = e.createCommandEncoder({
    label: "DataStore/growCopy"
  });
  if (r <= 0 || i === 0) {
    const l = o * s;
    a.copyBufferToBuffer(t, 0, n, 0, l);
  } else {
    const l = Math.min(o, r - i);
    l > 0 && a.copyBufferToBuffer(t, i * s, n, 0, l * s);
    const c = o - l;
    c > 0 && a.copyBufferToBuffer(t, 0, n, l * s, c * s);
  }
  e.queue.submit([a.finish()]);
}
function M0(e) {
  const t = /* @__PURE__ */ new Map();
  let n = !1, i = new Float32Array(0);
  const r = (O) => {
    b0(e, O);
  }, o = (O) => {
    const D = Math.max(0, O | 0) * 2;
    if (i.length >= D) return i;
    const k = Math.max(D, i.length > 0 ? i.length * 2 : 64);
    let W = 64;
    for (; W < k; ) W *= 2;
    return i = new Float32Array(W), i;
  }, s = (O, D, k, W, j, ee, fe, X, z) => {
    if (fe <= 0) return;
    const $ = o(fe);
    if (Jr($, 0, j, ee, fe, X), z != null) {
      const L = fe * 2;
      O.set($.subarray(0, L), z * 2);
      const le = z * 2 * 4, se = L * 4;
      se > 0 && e.queue.writeBuffer(D, le, $.buffer, $.byteOffset, se);
      return;
    }
    const Q = Math.min(fe, W - k), K = Q * 2;
    Q > 0 && (O.set($.subarray(0, K), k * 2), e.queue.writeBuffer(D, k * 2 * 4, $.buffer, $.byteOffset, K * 4));
    const ne = fe - Q;
    if (ne > 0) {
      const L = ne * 2;
      O.set($.subarray(K, K + L), 0), e.queue.writeBuffer(D, 0, $.buffer, $.byteOffset + K * 4, L * 4);
    }
  };
  let a = null, l = null, c = null, u = 0, f = new Float32Array(0), d = null;
  const m = new Uint32Array(4);
  let p = null, y = null, g = null;
  const S = () => {
    if (a) return;
    const O = e.createShaderModule({
      label: "DataStore/yRewrite.wgsl",
      code: v0
    });
    l = e.createBindGroupLayout({
      label: "DataStore/yRewriteBGL",
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } }
      ]
    });
    const D = e.createPipelineLayout({
      label: "DataStore/yRewritePL",
      bindGroupLayouts: [l]
    });
    a = e.createComputePipeline({
      label: "DataStore/yRewritePipeline",
      layout: D,
      compute: { module: O, entryPoint: "main" }
    }), d = e.createBuffer({
      label: "DataStore/yRewriteParams",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  }, A = (O) => {
    const D = Math.max(4, Gi(O * 4));
    if (!c || u < D) {
      if (c)
        try {
          c.destroy();
        } catch {
        }
      const k = Math.max(D, hs(D));
      c = e.createBuffer({
        label: "DataStore/yChannelUpload",
        size: k,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      }), u = k, f = new Float32Array(k / 4);
    } else f.length < O && (f = new Float32Array(u / 4));
  }, M = (O, D, k) => {
    if (k <= 0) return;
    S(), A(k);
    for (let fe = 0; fe < k; fe++)
      f[fe] = D[fe * 2 + 1];
    const W = k * 4;
    e.queue.writeBuffer(c, 0, f.buffer, f.byteOffset, W), m[0] = k >>> 0, m[1] = 0, m[2] = 0, m[3] = 0, e.queue.writeBuffer(d, 0, m.buffer, m.byteOffset, 16), (p == null || y !== O || g !== c) && (p = e.createBindGroup({
      layout: l,
      entries: [
        { binding: 0, resource: { buffer: O } },
        { binding: 1, resource: { buffer: c } },
        { binding: 2, resource: { buffer: d } }
      ]
    }), y = O, g = c);
    const j = e.createCommandEncoder({ label: "DataStore/yRewrite" }), ee = j.beginComputePass({ label: "DataStore/yRewritePass" });
    ee.setPipeline(a), ee.setBindGroup(0, p), ee.dispatchWorkgroups(Math.ceil(k / 64)), ee.end(), e.queue.submit([j.finish()]);
  }, h = () => {
    if (n)
      throw new Error("DataStore is disposed.");
  }, b = (O) => {
    h();
    const D = t.get(O);
    if (!D)
      throw new Error(`Series ${O} has no data. Call setSeries(${O}, data) first.`);
    return D;
  }, v = 1e6, x = (O, D, k, W, j) => {
    if (D >= v) {
      const ee = j != null ? j >>> 0 : 2166136261;
      return to(ee, k, W);
    }
    return Jc(O);
  }, F = (O, D, k) => {
    const W = $e(D);
    if (W === 0) return;
    const j = bi(k == null ? void 0 : k.maxPoints);
    if (j == null)
      throw new Error(`Series ${O} has no data. Call setSeries(${O}, data) first.`);
    const ee = yi(0, W, j), fe = ee.nextCount, X = ee.newSrcOffset, z = ee.keepNewCount, $ = ee.ringCapacity, Z = Math.max(fe, $), Q = Gi(Z * 2 * 4), K = Math.max(Yi, Q), ne = e.limits.maxBufferSize, L = e.limits.maxStorageBufferBindingSize, le = Math.min(ne, L);
    if (K > le)
      throw new Error(
        `DataStore.appendSeries(${O}): required buffer size ${K} exceeds min(maxBufferSize=${ne}, maxStorageBufferBindingSize=${L}).`
      );
    const se = La(K, K, ne, L), ae = e.createBuffer({
      size: se,
      usage: Ea()
    }), de = new Float32Array(se / 4), re = 0;
    z > 0 && Jr(de, 0, D, X, z, re), Ua(e, ae, de, fe);
    const ie = fe > 0 ? de.subarray(0, fe * 2) : new Float32Array(0), be = x(ie, fe, z, ee.dropPrevCount, null);
    t.set(O, {
      buffer: ae,
      capacityBytes: se,
      pointCount: fe,
      hash32: be,
      xOffset: re,
      stagingBuffer: de,
      ringStart: 0,
      ringCapacityPoints: $ > 0 ? $ : 0
    });
  };
  return {
    setSeries: (O, D, k) => {
      h();
      const W = (k == null ? void 0 : k.xOffset) ?? 0, j = $e(D), ee = Gi(j * 2 * 4), fe = Math.max(Yi, ee), X = t.get(O);
      let z = (X == null ? void 0 : X.buffer) ?? null, $ = (X == null ? void 0 : X.capacityBytes) ?? 0;
      if (!z || fe > $) {
        const de = e.limits.maxBufferSize, re = e.limits.maxStorageBufferBindingSize, ie = Math.min(de, re);
        if (fe > ie)
          throw new Error(
            `DataStore.setSeries(${O}): required buffer size ${fe} exceeds min(maxBufferSize=${de}, maxStorageBufferBindingSize=${re}). Series buffers are storage-bound for line/decimation.`
          );
        z && r(z);
        let te = Kc($, fe);
        if (j >= 1e4) {
          const Me = hs(fe * 2);
          te = Math.max(te, Me);
        }
        $ = La(te, fe, de, re), z = e.createBuffer({
          size: $,
          usage: Ea()
        });
      } else
        $ = X.capacityBytes;
      const Z = $ / 4;
      let Q = X == null ? void 0 : X.stagingBuffer;
      (!Q || Q.length < Z) && (Q = new Float32Array(Z));
      const K = X != null && X.pointCount === j && X.xOffset === W && X.ringStart === 0 && X.ringCapacityPoints === 0 && X.buffer === z && hh(D, X.stagingBuffer, X.pointCount, X.xOffset);
      let ne = !1;
      if (K) {
        if (ne = gh(Q, D, j), !ne)
          return;
      } else j > 0 && Jr(Q, 0, D, 0, j, W);
      const L = j > 0 ? Q.subarray(0, j * 2) : new Float32Array(0), le = ne || (k == null ? void 0 : k.skipContentHash) === !0;
      let se;
      le && X ? se = X.hash32 + 2654435769 >>> 0 : !X && j >= v ? se = to(2166136261, j, 0) : se = Jc(L), !(!le && X && X.pointCount === j && X.hash32 === se && X.ringStart === 0 && X.buffer === z) && (ne && j > 0 ? M(z, Q, j) : L.byteLength > 0 && e.queue.writeBuffer(z, 0, L.buffer, L.byteOffset, L.byteLength), t.set(O, {
        buffer: z,
        capacityBytes: $,
        pointCount: j,
        hash32: se,
        xOffset: W,
        stagingBuffer: Q,
        ringStart: 0,
        ringCapacityPoints: 0
      }));
    },
    appendSeries: (O, D, k) => {
      h();
      const W = $e(D);
      if (W === 0) return;
      if (!t.has(O)) {
        if (bi(k == null ? void 0 : k.maxPoints) != null) {
          F(O, D, k);
          return;
        }
        throw new Error(`Series ${O} has no data. Call setSeries(${O}, data) first.`);
      }
      const j = b(O), ee = j.pointCount;
      let fe = bi(k == null ? void 0 : k.maxPoints), X = yi(ee, W, fe), z = X.nextCount, $ = X.dropPrevCount, Z = X.newSrcOffset, Q = X.keepNewCount, K = X.isStrictReplace, ne = X.ringCapacity, L = X.isRing, le = L && ne > 0 ? Math.max(z, ne) : z, se = Gi(le * 2 * 4), ae = Math.max(Yi, se), de = j.buffer, re = j.capacityBytes, ie = j.stagingBuffer, be = j.ringStart;
      const te = e.limits.maxBufferSize, Be = e.limits.maxStorageBufferBindingSize, Me = j.ringCapacityPoints, _e = j.ringStart, Le = Me > 0, ge = Math.min(te, Be);
      ae > ge && fe == null && (fe = Math.max(1, Math.floor(ge / 8)), X = yi(ee, W, fe), z = X.nextCount, $ = X.dropPrevCount, Z = X.newSrcOffset, Q = X.keepNewCount, K = X.isStrictReplace, ne = X.ringCapacity, L = X.isRing, le = L && ne > 0 ? Math.max(z, ne) : z, se = Gi(le * 2 * 4), ae = Math.max(Yi, se));
      const Ee = ae > re, Se = L && !Le && ne > 0 && ee <= ne, ve = L && Le && Me === ne && ne > 0 && ee <= Me, xe = (Se || ve) && !Ee && !K, Pe = !L && !Le && !Ee && !K && $ === 0;
      if (Ee) {
        if (ae > ge)
          throw new Error(
            `DataStore.appendSeries(${O}): required buffer size ${ae} exceeds min(maxBufferSize=${te}, maxStorageBufferBindingSize=${Be}).`
          );
        const Ze = j.buffer, ze = j.stagingBuffer, Ue = j.ringStart, Ae = j.ringCapacityPoints, Qe = j.pointCount;
        let At = Kc(re, ae);
        if (!L && z >= 1e5) {
          const Ot = hs(ae * 2), Ht = Math.min(Ot, 2e6 * 2 * 4);
          At = Math.max(At, Math.max(ae, Ht));
        }
        re = La(At, ae, te, Be), de = e.createBuffer({
          size: re,
          usage: Ea()
        }), ie = new Float32Array(re / 4), Qc(ie, ze, Ue, Ae, Qe);
        const It = !L && !K && $ === 0 && Q === W;
        if (It && Qe > 0 && N0(e, Ze, de, Ue, Ae, Qe), r(Ze), be = 0, It) {
          s(ie, de, 0, 0, D, 0, W, j.xOffset, Qe), t.set(O, {
            buffer: de,
            capacityBytes: re,
            pointCount: z,
            hash32: to(j.hash32, W, 0),
            xOffset: j.xOffset,
            stagingBuffer: ie,
            ringStart: 0,
            ringCapacityPoints: 0
          });
          return;
        }
      }
      if (K) {
        Jr(ie, 0, D, Z, Q, j.xOffset);
        const Ze = ie.subarray(0, z * 2);
        Ua(e, de, ie, z), t.set(O, {
          buffer: de,
          capacityBytes: re,
          pointCount: z,
          // Warm: chain existing.hash32 so successive multi‑M full replaces dirty present.
          hash32: x(Ze, z, Q, $, j.hash32),
          xOffset: j.xOffset,
          stagingBuffer: ie,
          ringStart: 0,
          ringCapacityPoints: L ? ne : 0
        });
        return;
      }
      if (xe) {
        const Ze = ne;
        Le ? be >= Ze && (be = be % Ze) : be = 0;
        const ze = ee >= Ze ? be : (be + ee) % Ze;
        s(
          ie,
          de,
          ze,
          Ze,
          D,
          Z,
          Q,
          j.xOffset,
          null
        );
        const Ue = $ > 0 ? (be + $) % Ze : be;
        t.set(O, {
          buffer: de,
          capacityBytes: re,
          pointCount: z,
          hash32: to(j.hash32, Q, $),
          xOffset: j.xOffset,
          stagingBuffer: ie,
          ringStart: Ue,
          ringCapacityPoints: Ze
        });
        return;
      }
      if (Pe) {
        s(ie, de, 0, 0, D, 0, W, j.xOffset, ee), t.set(O, {
          buffer: de,
          capacityBytes: re,
          pointCount: z,
          hash32: to(j.hash32, W, 0),
          xOffset: j.xOffset,
          stagingBuffer: ie,
          ringStart: 0,
          ringCapacityPoints: 0
        });
        return;
      }
      Ee || Me > 0 && _e !== 0 && Qc(ie, ie, _e, Me, ee), $ > 0 && $ < ee && ie.copyWithin(0, $ * 2, ee * 2);
      const Oe = $ >= ee ? 0 : ee - $;
      Q > 0 && Jr(ie, Oe * 2, D, Z, Q, j.xOffset), Ua(e, de, ie, z);
      const Xe = ie.subarray(0, z * 2);
      t.set(O, {
        buffer: de,
        capacityBytes: re,
        pointCount: z,
        // Warm rebuild: chain existing.hash32 (multi‑M absolute stamp is cold-only).
        hash32: x(Xe, z, Q, $, j.hash32),
        xOffset: j.xOffset,
        stagingBuffer: ie,
        ringStart: 0,
        ringCapacityPoints: L && ne > 0 ? ne : 0
      });
    },
    removeSeries: (O) => {
      h();
      const D = t.get(O);
      if (D) {
        try {
          D.buffer.destroy();
        } catch {
        }
        t.delete(O);
      }
    },
    getSeriesBuffer: (O) => b(O).buffer,
    getSeriesPointCount: (O) => b(O).pointCount,
    getSeriesRingLayout: (O) => {
      const D = b(O);
      return D.ringCapacityPoints > 0 ? { start: D.ringStart, capacity: D.ringCapacityPoints } : { start: 0, capacity: 0 };
    },
    isSeriesRingMode: (O) => b(O).ringCapacityPoints > 0,
    getSeriesEffectiveMaxPoints: (O) => {
      const D = b(O).ringCapacityPoints;
      return D > 0 ? D : null;
    },
    getSeriesContentHash: (O) => b(O).hash32,
    getSeriesStagingBuffer: (O) => b(O).stagingBuffer,
    getSeriesXOffset: (O) => b(O).xOffset,
    dispose: () => {
      if (!n) {
        n = !0;
        try {
          Ud(e);
        } catch {
        }
        for (const O of t.values())
          try {
            O.buffer.destroy();
          } catch {
          }
        if (t.clear(), c) {
          try {
            c.destroy();
          } catch {
          }
          c = null;
        }
        if (d) {
          try {
            d.destroy();
          } catch {
          }
          d = null;
        }
        a = null, l = null, p = null, y = null, g = null, u = 0, f = new Float32Array(0);
      }
    }
  };
}
const _d = /* @__PURE__ */ new Set([
  "lttb",
  "min",
  "max"
]);
function S0(e) {
  switch (e) {
    case "lttb":
      return "lttb";
    case "min":
      return "min";
    case "max":
      return "max";
    default:
      return null;
  }
}
function To(e, t) {
  if (e.type !== "line" || t == null || typeof t != "object" || Yr(e)) return !1;
  const n = e.step;
  return !(n != null && n !== !1 || !_d.has(e.sampling) || Fo(t));
}
function C0(e) {
  if (e.seriesType !== "line" && e.seriesType !== "area" || e.series != null && Yr(e.series)) return !1;
  if (e.series != null) {
    const l = e.series.step;
    if (Ps(l) != null) return !1;
  }
  if (e.series != null && e.series.connectNulls === !0)
    return !1;
  const t = e.kind, n = t === "gpuDecimationRaw", i = e.sampling, r = e.series ?? {
    type: e.seriesType === "area" ? "area" : "line",
    sampling: i ?? "lttb"
  }, o = e.rawData ?? null, s = e.seriesType === "line" && o != null && To(r, o);
  return t === "fullRawLine" || n || t === "unknown" && (s || i === "none") ? n || s || i === "none" : !1;
}
function ql(e) {
  const { series: t, raw: n, mode: i, sampleTarget: r } = e;
  if (t.type === "pie" || t.type === "candlestick" || t.type === "ohlc" || t.type === "heatmap" || t.type === "band" || t.type === "errorBar" || t.type === "impulse" || t.type === "pointCloud3d" || t.type === "surface3d" || To(t, n))
    return n;
  if (i === "setOptionsReuse")
    return t.data ?? n;
  const o = "sampling" in t ? t.sampling : "none", s = "samplingThreshold" in t ? t.samplingThreshold : 5e3;
  if (o !== "none" && Fo(n))
    return n;
  const a = r != null && Number.isFinite(r) ? Math.max(2, r | 0) : s;
  return Fi(n, o, a);
}
function zd(e) {
  const { sampling: t, samplingThreshold: n, rawOHLC: i, sampleTarget: r } = e, o = r != null && Number.isFinite(r) ? Math.max(1, r | 0) : Math.max(1, n | 0);
  return t === "ohlc" && i.length > o ? wl(i, o) : i;
}
function F0(e, t, n) {
  const s = Math.max(1e-3, Math.min(1, t)), a = Number.isFinite(e) ? Math.max(1, e | 0) : 1, l = Math.min(2e5, Math.max(2, a * 32)), c = Math.round(a / s);
  return Math.min(l, Math.max(2, c));
}
function Gd(e, t, n) {
  const i = e.sampling ?? "lttb";
  if (i === "none" || i === "ohlc" || xd(t)) return t;
  const r = n != null && Number.isFinite(n) ? Math.max(2, n | 0) : Math.max(2, (e.samplingThreshold ?? 5e3) | 0);
  return vd(t, i, r);
}
function A0(e, t, n) {
  if (e.type === "pie" || e.type === "heatmap") return e;
  if (e.type === "band") {
    const a = e, l = t ?? a.rawData ?? a.data, c = n ?? a.rawBounds ?? void 0, u = Gd(a, l);
    return {
      ...e,
      rawData: l,
      rawBounds: c,
      data: u
    };
  }
  if (e.type === "errorBar") {
    const a = e, l = t ?? a.rawData ?? a.data, c = n ?? a.rawBounds ?? void 0;
    return {
      ...e,
      rawData: l,
      rawBounds: c,
      data: l
    };
  }
  if (e.type === "impulse") {
    const a = e, l = t ?? a.rawData ?? a.data, c = n ?? a.rawBounds ?? void 0;
    return {
      ...e,
      rawData: l,
      rawBounds: c,
      data: l
    };
  }
  if (e.type === "candlestick" || e.type === "ohlc") {
    const a = e, l = t ?? a.rawData ?? a.data, c = n ?? a.rawBounds ?? void 0, u = zd({
      sampling: a.sampling,
      samplingThreshold: a.samplingThreshold ?? 0,
      rawOHLC: l
    });
    return {
      ...e,
      rawData: l,
      rawBounds: c,
      data: u
    };
  }
  const i = e, r = t ?? i.rawData ?? i.data, o = n ?? i.rawBounds ?? void 0, s = ql({
    series: e,
    raw: r,
    mode: "baseline"
  });
  return {
    ...e,
    rawData: r,
    rawBounds: o,
    data: s
  };
}
function I0(e, t, n) {
  const i = new Array(e.length);
  for (let r = 0; r < e.length; r++)
    i[r] = A0(e[r], t[r], n[r]);
  return i;
}
function P0(e, t, n) {
  if (e.type === "pie" || e.type === "heatmap") return e;
  const i = e;
  if (e.type === "candlestick" || e.type === "ohlc") {
    const a = t ?? i.rawData ?? i.data;
    return {
      ...e,
      rawData: a,
      rawBounds: n ?? i.rawBounds ?? void 0
    };
  }
  if (e.type === "band") {
    const a = t ?? i.rawData ?? i.data;
    return {
      ...e,
      rawData: a,
      rawBounds: n ?? i.rawBounds ?? void 0,
      // Keep OptionResolver-sampled data when present.
      data: i.data ?? a
    };
  }
  if (e.type === "errorBar") {
    const a = t ?? i.rawData ?? i.data;
    return {
      ...e,
      rawData: a,
      rawBounds: n ?? i.rawBounds ?? void 0,
      data: a ?? i.data
    };
  }
  if (e.type === "impulse") {
    const a = t ?? i.rawData ?? i.data;
    return {
      ...e,
      rawData: a,
      rawBounds: n ?? i.rawBounds ?? void 0,
      data: a
    };
  }
  const r = t ?? i.rawData ?? i.data, o = n ?? i.rawBounds ?? void 0, s = ql({
    series: e,
    raw: r,
    mode: "setOptionsReuse"
  });
  return {
    ...e,
    rawData: r,
    rawBounds: o,
    data: s
  };
}
function T0(e, t, n) {
  return e.map(
    (i, r) => P0(i, t[r], n[r])
  );
}
function B0(e) {
  const t = e.series, n = t, i = F0(n.samplingThreshold ?? 0, e.spanFraction);
  if (t.type === "candlestick" || t.type === "ohlc") {
    const l = e.rawSlot ?? n.rawData ?? n.data, c = e.sliceOHLC(l, e.bufferedMin, e.bufferedMax), u = zd({
      sampling: n.sampling,
      samplingThreshold: n.samplingThreshold ?? 0,
      rawOHLC: c,
      sampleTarget: i
    }), f = e.sliceOHLC(u, e.visibleMin, e.visibleMax);
    return {
      series: { ...t, data: f },
      cacheEntry: {
        data: u,
        cachedRange: { min: e.bufferedMin, max: e.bufferedMax }
      }
    };
  }
  if (t.type === "band") {
    const l = e.rawSlot ?? n.rawData ?? n.data;
    if (n.sampling === "none")
      return {
        series: { ...t, rawData: l, data: l },
        cacheEntry: null
      };
    const c = Is(l, e.bufferedMin, e.bufferedMax), u = Gd(n, c, i), f = Is(u, e.visibleMin, e.visibleMax);
    return {
      series: { ...t, data: f },
      cacheEntry: {
        data: u,
        cachedRange: { min: e.bufferedMin, max: e.bufferedMax }
      }
    };
  }
  if (t.type === "errorBar") {
    const l = e.rawSlot ?? n.rawData ?? n.data;
    return {
      series: { ...t, rawData: l, data: l },
      cacheEntry: null
    };
  }
  if (t.type === "impulse") {
    const l = e.rawSlot ?? n.rawData ?? n.data;
    return {
      series: { ...t, rawData: l, data: l },
      cacheEntry: null
    };
  }
  const r = e.rawSlot ?? n.rawData ?? n.data;
  if (n.sampling === "none")
    return {
      series: {
        ...t,
        rawData: r,
        data: r
      },
      cacheEntry: null
    };
  if (To(t, r))
    return {
      series: {
        ...t,
        rawData: r,
        data: r
      },
      cacheEntry: null
    };
  const o = e.sliceX(r, e.bufferedMin, e.bufferedMax), s = ql({
    series: t,
    raw: o,
    mode: "zoomed",
    sampleTarget: i
  }), a = e.sliceX(s, e.visibleMin, e.visibleMax);
  return {
    series: { ...t, data: a },
    cacheEntry: {
      data: s,
      cachedRange: { min: e.bufferedMin, max: e.bufferedMax }
    }
  };
}
function R0(e, t, n) {
  if (e.type !== "impulse") return n ?? void 0;
  const i = typeof e.baseline == "number" && Number.isFinite(e.baseline) ? e.baseline : 0, r = Gr(t, i);
  if (r) return r;
  if (!n) return;
  let o = n.yMin, s = n.yMax;
  return i < o && (o = i), i > s && (s = i), { xMin: n.xMin, xMax: n.xMax, yMin: o, yMax: s };
}
function D0(e) {
  return k0(e);
}
function k0(e) {
  var l, c, u;
  if (e.pendingAppendByIndex.size === 0) return !1;
  e.appendedGpuThisFrame.clear(), typeof e.invalidateStackedMountainCache == "function" && e.invalidateStackedMountainCache(), typeof e.invalidateStepExpandCache == "function" && e.invalidateStepExpandCache();
  const t = ((l = e.zoomState) == null ? void 0 : l.getRange()) ?? null, n = e.currentOptions.autoScroll === !0 && e.zoomState != null && e.currentOptions.xAxis.min == null && e.currentOptions.xAxis.max == null, i = e.computeBaseXDomain(e.currentOptions, e.runtimeRawBoundsByIndex), r = t ? e.computeVisibleXDomain(i, t) : null;
  let o = !1;
  for (const [f, d] of e.pendingAppendByIndex) {
    if (d.length === 0) continue;
    const m = e.currentOptions.series[f];
    if (!m || m.type === "pie" || m.type === "heatmap") continue;
    if (o = !0, m.type === "candlestick" || m.type === "ohlc") {
      let y = e.runtimeRawDataByIndex[f];
      if (!y) {
        const S = m.rawData ?? m.data;
        y = S.length === 0 ? [] : S.slice(), e.runtimeRawDataByIndex[f] = y, e.runtimeRawBoundsByIndex[f] = m.rawBounds ?? null;
      }
      let g = !1;
      for (const S of d) {
        const A = S.points, M = e.normalizeMaxPoints(S.maxPoints), h = y.length, b = e.planMaxPointsWindow(h, A.length, M);
        if (b.dropPrevCount > 0 && (y.splice(0, b.dropPrevCount), g = !0), b.keepNewCount > 0) {
          const v = b.newSrcOffset, x = v + b.keepNewCount;
          for (let F = v; F < x; F++)
            y.push(A[F]);
        }
        b.didWindow ? g = !0 : e.runtimeRawBoundsByIndex[f] = e.extendBoundsWithOHLCDataPoints(
          e.runtimeRawBoundsByIndex[f],
          A
        );
      }
      g && (e.runtimeRawBoundsByIndex[f] = e.extendBoundsWithOHLCDataPoints(null, y));
    } else if (m.type === "band") {
      let y = e.runtimeRawDataByIndex[f];
      if (!y || !("y1" in y)) {
        const S = m.rawData ?? m.data;
        y = go(S), e.runtimeRawDataByIndex[f] = ui(y), e.runtimeRawBoundsByIndex[f] = m.rawBounds ?? qn(S) ?? null;
      } else
        y = {
          x: Array.isArray(y.x) ? y.x : Array.from(y.x),
          y: Array.isArray(y.y) ? y.y : Array.from(y.y),
          y1: Array.isArray(y.y1) ? y.y1 : Array.from(y.y1)
        }, e.runtimeRawDataByIndex[f] = ui(y);
      let g = !1;
      for (const S of d) {
        const A = S.points;
        if (!Xl(A)) {
          console.warn(
            `RenderCoordinator.appendData(${f}, ...): band series requires Xyy payloads. Skipping batch.`
          );
          continue;
        }
        const M = e.normalizeMaxPoints(S.maxPoints), h = yn(A);
        if (h === 0) continue;
        const b = y.x.length, v = e.planMaxPointsWindow(b, h, M);
        v.dropPrevCount > 0 && (y.x.splice(0, v.dropPrevCount), y.y.splice(0, v.dropPrevCount), y.y1.splice(0, v.dropPrevCount), g = !0), wd(y, A, {
          newSrcOffset: v.newSrcOffset,
          keepNewCount: v.keepNewCount
        }), v.didWindow ? g = !0 : e.runtimeRawBoundsByIndex[f] = Nd(
          e.runtimeRawBoundsByIndex[f],
          A
        );
      }
      e.runtimeRawDataByIndex[f] = ui(y), g && (e.runtimeRawBoundsByIndex[f] = qn(ui(y)));
    } else if (m.type === "errorBar") {
      let y = e.runtimeRawDataByIndex[f];
      const g = m.direction === "horizontal" ? "horizontal" : "vertical";
      if (!y || !("high" in y) || !("low" in y)) {
        const A = m.rawData ?? m.data;
        y = Dr(A), e.runtimeRawDataByIndex[f] = y, e.runtimeRawBoundsByIndex[f] = m.rawBounds ?? hi(A, g) ?? null;
      } else
        y = {
          x: Array.isArray(y.x) ? y.x : Array.from(y.x),
          y: Array.isArray(y.y) ? y.y : Array.from(y.y),
          high: Array.isArray(y.high) ? y.high : Array.from(y.high),
          low: Array.isArray(y.low) ? y.low : Array.from(y.low)
        }, e.runtimeRawDataByIndex[f] = y;
      let S = !1;
      for (const A of d) {
        const M = A.points;
        if (!Sd(M)) {
          console.warn(
            `RenderCoordinator.appendData(${f}, ...): errorBar series requires HLC or relative-error payloads. Skipping batch.`
          );
          continue;
        }
        const h = e.normalizeMaxPoints(A.maxPoints), b = On(M);
        if (b === 0) continue;
        const v = y.x.length, x = e.planMaxPointsWindow(v, b, h);
        x.dropPrevCount > 0 && (y.x.splice(0, x.dropPrevCount), y.y.splice(0, x.dropPrevCount), y.high.splice(0, x.dropPrevCount), y.low.splice(0, x.dropPrevCount), S = !0), Rd(y, M, {
          newSrcOffset: x.newSrcOffset,
          keepNewCount: x.keepNewCount
        }), x.didWindow ? S = !0 : e.runtimeRawBoundsByIndex[f] = Bd(
          e.runtimeRawBoundsByIndex[f],
          M,
          g
        );
      }
      e.runtimeRawDataByIndex[f] = y, S && (e.runtimeRawBoundsByIndex[f] = hi(y, g));
    } else {
      const y = e.gpuSeriesKindByIndex[f] ?? "unknown", g = e.runtimeRawDataByIndex[f], S = g ?? m.rawData ?? m.data, A = e.canRangedAppendLine({
        seriesType: m.type,
        sampling: m.sampling,
        kind: y,
        rawData: S,
        series: m
      }), M = A;
      let h = null;
      M ? (e.isStagingRingView(g) || e.isRingXYColumns(g)) && (h = g) : h = e.ensureMutableRuntimeColumns(f, m);
      let b = !1;
      for (const v of d) {
        const x = v.points, F = e.normalizeMaxPoints(v.maxPoints), I = F != null ? { maxPoints: F } : void 0;
        let R = 0;
        if (e.isStagingRingView(h))
          R = h.count;
        else if (e.isRingXYColumns(h))
          R = h.count;
        else if (h != null && e.isOwnedMutableColumns(h))
          R = h.x.length;
        else
          try {
            R = e.dataStore.getSeriesPointCount(f);
          } catch {
            R = g ? e.getPointCount(g) : 0;
          }
        let T = F;
        if (A)
          try {
            if (e.dataStore.appendSeries(f, x, I), e.appendedGpuThisFrame.add(f), T == null)
              try {
                const C = e.dataStore.getSeriesEffectiveMaxPoints(f);
                C != null && C > 0 && (T = C);
              } catch {
              }
            else
              try {
                const C = e.dataStore.getSeriesEffectiveMaxPoints(f);
                C != null && C > 0 && C < T && (T = C);
              } catch {
              }
          } catch (C) {
            const E = C instanceof Error ? C.message : String(C);
            if (/maxStorageBufferBindingSize|maxBufferSize|required buffer size/i.test(E)) {
              typeof console < "u" && typeof console.warn == "function" && console.warn(
                `[ChartGPU] appendData() hit device buffer limit for series ${f}; skipping batch to keep domain in sync with GPU-resident data.`,
                C
              );
              continue;
            }
          }
        else if ((m.type === "line" || m.type === "area") && m.sampling !== "none" && !A && !e.warnedSamplingDefeatsFastPath.has(f)) {
          e.warnedSamplingDefeatsFastPath.add(f);
          const C = m.type === "area" ? "For optimal streaming performance, use sampling='none'. " : "For optimal streaming performance, use sampling='none' or rely on GPU decimation for lttb/min/max. ";
          console.warn(
            `[ChartGPU] appendData() on series ${f} with sampling='${m.sampling}' causes full buffer re-upload every frame. ` + C + "See docs/internal/INCREMENTAL_APPEND_OPTIMIZATION.md for details."
          );
        }
        if (M && e.appendedGpuThisFrame.has(f)) {
          const C = e.getPointCount(x), E = e.planMaxPointsWindow(R, C, T);
          try {
            const U = e.dataStore.getSeriesRingLayout(f), G = e.dataStore.getSeriesStagingBuffer(f), O = e.dataStore.getSeriesPointCount(f), D = e.dataStore.getSeriesXOffset(f), k = e.isStagingRingView(h) ? h : null, W = e.runtimeRawBoundsByIndex[f];
            let j = (W == null ? void 0 : W.yMin) ?? Number.POSITIVE_INFINITY, ee = (W == null ? void 0 : W.yMax) ?? Number.NEGATIVE_INFINITY;
            const fe = E.newSrcOffset + E.keepNewCount;
            let X = !0;
            const z = typeof x == "object" && x !== null && !Array.isArray(x) && !e.isStagingRingView(x) && !e.isRingXYColumns(x) && "y" in x ? x.y : null, $ = typeof x == "object" && x !== null && !Array.isArray(x) && !e.isStagingRingView(x) && !e.isRingXYColumns(x) && "x" in x ? x.x : null;
            if (z != null)
              for (let K = E.newSrcOffset; K < fe; K++) {
                const ne = z[K], L = $ != null ? $[K] : e.getX(x, K);
                (!Number.isFinite(L) || !Number.isFinite(ne)) && (X = !1), Number.isFinite(ne) && (ne < j && (j = ne), ne > ee && (ee = ne));
              }
            else
              for (let K = E.newSrcOffset; K < fe; K++) {
                const ne = e.getY(x, K), L = e.getX(x, K);
                (!Number.isFinite(L) || !Number.isFinite(ne)) && (X = !1), Number.isFinite(ne) && (ne < j && (j = ne), ne > ee && (ee = ne));
              }
            h = e.createStagingRingView(G, U.start, U.capacity, O, D, k, {
              newBatchAllFinite: X
            }), e.runtimeRawDataByIndex[f] = h;
            const Z = e.getX(h, 0), Q = e.getX(h, Math.max(0, O - 1));
            if (Number.isFinite(Z) && Number.isFinite(Q) && Number.isFinite(j) && Number.isFinite(ee)) {
              let K = Z, ne = Q;
              K === ne && (ne = K + 1), j === ee && (ee = j + 1), e.runtimeRawBoundsByIndex[f] = {
                xMin: K,
                xMax: ne,
                yMin: j,
                yMax: ee
              };
            } else E.didWindow && (b = !0);
          } catch {
            h = e.demoteStagingViewAfterRebindFailure(h);
          }
          if (e.isStagingRingView(h))
            continue;
        }
        (h == null || e.isStagingRingView(h)) && (h = e.ensureMutableRuntimeColumns(f, m));
        const N = e.getPointCount(x);
        let w = e.planMaxPointsWindow(R, N, T);
        if (e.isRingXYColumns(h)) {
          const C = w.isRing && w.ringCapacity > 0 && h.capacity !== w.ringCapacity;
          if (!w.isRing || C) {
            const E = h.size != null, U = e.brandOwnedColumns({
              x: [],
              y: [],
              ...E ? { size: [] } : {}
            }), G = h.count;
            for (let O = 0; O < G; O++)
              if (U.x.push(e.getX(h, O)), U.y.push(e.getY(h, O)), E && U.size) {
                const D = e.getSize(h, O);
                U.size.push(D);
              }
            h = U, e.runtimeRawDataByIndex[f] = U, R = U.x.length, w = e.planMaxPointsWindow(R, N, T);
          }
        }
        if (w.isRing && w.ringCapacity > 0 && !e.isRingXYColumns(h)) {
          const C = h, E = Array.isArray(C.size) && C.size.some((k) => typeof k == "number" && Number.isFinite(k)), U = e.createRingXYColumns(w.ringCapacity, E), G = Math.min(C.x.length, w.ringCapacity), O = Math.max(0, C.x.length - G);
          for (let k = 0; k < G; k++)
            if (U.x[k] = C.x[O + k], U.y[k] = C.y[O + k], U.size && C.size) {
              const W = C.size[O + k];
              U.size[k] = typeof W == "number" && Number.isFinite(W) ? W : Number.NaN;
            }
          U.count = G, U.start = 0, h = U, e.runtimeRawDataByIndex[f] = U;
          const D = e.planMaxPointsWindow(U.count, N, T);
          if (e.appendIntoRingXY(U, x, D.newSrcOffset, D.keepNewCount, D.dropPrevCount), D.didWindow) {
            const k = e.getX(U, 0), W = e.getX(U, U.count - 1), j = e.runtimeRawBoundsByIndex[f];
            let ee = (j == null ? void 0 : j.yMin) ?? Number.POSITIVE_INFINITY, fe = (j == null ? void 0 : j.yMax) ?? Number.NEGATIVE_INFINITY;
            const X = D.newSrcOffset + D.keepNewCount;
            for (let z = D.newSrcOffset; z < X; z++) {
              const $ = e.getY(x, z);
              Number.isFinite($) && ($ < ee && (ee = $), $ > fe && (fe = $));
            }
            if (Number.isFinite(k) && Number.isFinite(W) && Number.isFinite(ee) && Number.isFinite(fe)) {
              let z = k, $ = W;
              z === $ && ($ = z + 1), ee === fe && (fe = ee + 1), e.runtimeRawBoundsByIndex[f] = {
                xMin: z,
                xMax: $,
                yMin: ee,
                yMax: fe
              };
            } else
              b = !0;
          } else
            e.runtimeRawBoundsByIndex[f] = e.extendBoundsWithCartesianData(
              e.runtimeRawBoundsByIndex[f],
              x
            );
          continue;
        }
        if (e.isRingXYColumns(h)) {
          if (e.appendIntoRingXY(h, x, w.newSrcOffset, w.keepNewCount, w.dropPrevCount), w.didWindow) {
            const C = e.runtimeRawBoundsByIndex[f], E = e.getX(h, 0), U = e.getX(h, h.count - 1);
            let G = (C == null ? void 0 : C.yMin) ?? Number.POSITIVE_INFINITY, O = (C == null ? void 0 : C.yMax) ?? Number.NEGATIVE_INFINITY;
            const D = w.newSrcOffset + w.keepNewCount;
            for (let k = w.newSrcOffset; k < D; k++) {
              const W = e.getY(x, k);
              Number.isFinite(W) && (W < G && (G = W), W > O && (O = W));
            }
            if (Number.isFinite(E) && Number.isFinite(U) && Number.isFinite(G) && Number.isFinite(O)) {
              let k = E, W = U;
              k === W && (W = k + 1), G === O && (O = G + 1), e.runtimeRawBoundsByIndex[f] = {
                xMin: k,
                xMax: W,
                yMin: G,
                yMax: O
              };
            } else
              b = !0;
          } else
            e.runtimeRawBoundsByIndex[f] = e.extendBoundsWithCartesianData(
              e.runtimeRawBoundsByIndex[f],
              x
            );
          continue;
        }
        const P = h;
        w.dropPrevCount > 0 && (e.dropPrefixXY(P.x, P.y, w.dropPrevCount, P.size), b = !0);
        const B = P.x.length, _ = w.newSrcOffset + w.keepNewCount;
        for (let C = w.newSrcOffset; C < _; C++) {
          P.x.push(e.getX(x, C)), P.y.push(e.getY(x, C));
          const E = e.getSize(x, C);
          E !== void 0 ? (P.size || (P.size = new Array(B + (C - w.newSrcOffset))), P.size.push(E)) : P.size && P.size.push(void 0);
        }
        w.didWindow ? b = !0 : e.runtimeRawBoundsByIndex[f] = e.extendBoundsWithCartesianData(
          e.runtimeRawBoundsByIndex[f],
          x
        );
      }
      b && (e.runtimeRawBoundsByIndex[f] = e.computeRawBoundsFromCartesianData(h)), m.type === "impulse" && (e.runtimeRawBoundsByIndex[f] = R0(
        m,
        h,
        e.runtimeRawBoundsByIndex[f]
      ));
    }
    e.lastSampledData[f] = null, e.filterGapsCache.delete(f);
    const p = e.runtimeRawDataByIndex[f];
    if (p != null) {
      let y = 0;
      if (e.isStagingRingView(p))
        y = p.xOffset;
      else
        try {
          y = e.dataStore.getSeriesXOffset(f);
        } catch {
          y = 0;
        }
      e.lastSetSeriesCache.set(f, {
        data: p,
        xOffset: y
      });
    } else
      e.lastSetSeriesCache.delete(f);
  }
  if (e.pendingAppendByIndex.clear(), !o) return !1;
  if (n && (e.pendingZoomSourceKind = "auto-scroll"), e.zoomState) {
    const f = e.computeEffectiveZoomSpanConstraints(), d = e.zoomState;
    (c = d.setSpanConstraints) == null || c.call(d, f.minSpan, f.maxSpan);
  }
  if (n && t && r) {
    e.pendingZoomSourceKind = "auto-scroll";
    const f = t;
    if (f.end >= 99.5) {
      const d = f.end - f.start, m = e.zoomState;
      m.setRangeAnchored ? m.setRangeAnchored(100 - d, 100, "end") : e.zoomState.setRange(100 - d, 100);
    } else {
      const d = e.computeBaseXDomain(e.currentOptions, e.runtimeRawBoundsByIndex), m = d.max - d.min;
      if (Number.isFinite(m) && m > 0) {
        const p = (r.min - d.min) / m * 100, y = (r.max - d.min) / m * 100, g = Math.max(0, Math.min(100, p)), S = Math.max(0, Math.min(100, y));
        e.zoomState.setRange(g, S);
      }
    }
  }
  n && (e.pendingZoomSourceKind = void 0);
  let s = !1;
  if (e.runtimeBaseSeries.length === e.currentOptions.series.length && e.runtimeBaseSeries.length > 0) {
    s = !0;
    for (let f = 0; f < e.runtimeBaseSeries.length; f++) {
      const d = e.runtimeBaseSeries[f], m = e.currentOptions.series[f];
      if (d.type === "pie" || m.type === "pie" || d.type === "heatmap" || m.type === "heatmap") continue;
      if (d.type === "candlestick" || d.type === "ohlc" || m.type === "candlestick" || m.type === "ohlc") {
        s = !1;
        break;
      }
      const p = e.runtimeRawDataByIndex[f] ?? m.rawData ?? m.data;
      if (!e.isGpuDecimationEligible(m, p) || !e.isGpuDecimationEligible(d, p)) {
        s = !1;
        break;
      }
      const y = e.runtimeRawBoundsByIndex[f] ?? d.rawBounds ?? void 0;
      d.rawData = p, d.data = p, y && (d.rawBounds = y);
    }
  }
  s || e.recomputeRuntimeBaseSeries();
  const a = ((u = e.zoomState) == null ? void 0 : u.getRange()) ?? null;
  return (a == null || e.isFullSpanZoomRange(a)) && (e.renderSeries = e.runtimeBaseSeries, e.recomputeCachedVisibleYBoundsIfNeeded()), !0;
}
function E0(e) {
  return () => D0(e());
}
function Fl(e) {
  return e ? e.clientWidth : 0;
}
function lr(e) {
  const t = e.clientWidth, n = e.clientHeight;
  if (t > 0 && n > 0)
    return { width: t, height: n };
  const i = e.getBoundingClientRect();
  return { width: Math.max(0, i.width), height: Math.max(0, i.height) };
}
function Ri(e, t, n) {
  const i = e.getBoundingClientRect();
  if (!(i.width > 0) || !(i.height > 0)) return null;
  const r = e.clientWidth, o = e.clientHeight;
  if (!(r > 0) || !(o > 0))
    return {
      x: t - i.left,
      y: n - i.top,
      layoutWidth: i.width,
      layoutHeight: i.height
    };
  const s = r / i.width, a = o / i.height;
  return {
    x: (t - i.left) * s,
    y: (n - i.top) * a,
    layoutWidth: r,
    layoutHeight: o
  };
}
function Od(e) {
  return e ? e.clientHeight : 0;
}
function L0(e, t = typeof window < "u" ? window.devicePixelRatio : 1) {
  if (!e) return { width: 0, height: 0 };
  const n = Number.isFinite(t) && t > 0 ? t : 1;
  return { width: e.width / n, height: e.height / n };
}
function oi(e, t, n) {
  return Math.min(n, Math.max(t, e | 0));
}
function jn(e) {
  return Array.isArray(e);
}
const _a = /* @__PURE__ */ new WeakMap(), Oo = /* @__PURE__ */ new WeakMap(), Rs = 25e4;
function Hd(e, t) {
  let n = Number.NEGATIVE_INFINITY;
  const i = Math.max(1, Math.floor(t / 2048));
  for (let r = 0; r < t; r += i) {
    const o = Te(e, r);
    if (!Number.isFinite(o) || o < n) return !0;
    n = o;
  }
  if (t > 0) {
    const r = Te(e, t - 1);
    if (!Number.isFinite(r) || r < n) return !0;
  }
  return !1;
}
const eu = /* @__PURE__ */ new WeakMap();
function U0(e) {
  let t = Number.NEGATIVE_INFINITY;
  const n = $e(e);
  for (let i = 0; i < n; i++) {
    const r = Te(e, i);
    if (!Number.isFinite(r) || r < t)
      return { mono: !1, lastX: t };
    t = r;
  }
  return { mono: !0, lastX: t };
}
function Al(e, t, n, i) {
  let r = i;
  for (let o = t; o < n; o++) {
    const s = Te(e, o);
    if (!Number.isFinite(s) || s < r) return null;
    r = s;
  }
  return r;
}
function _0(e) {
  const t = e.contentEpoch;
  return typeof t == "number" && Number.isFinite(t) ? t | 0 : 0;
}
function z0(e) {
  if (bn(e)) return 0;
  const t = e.rewriteGen;
  return typeof t == "number" && Number.isFinite(t) ? t | 0 : 0;
}
function G0(e) {
  const t = e.start, n = e.count, i = e.capacity, r = bn(e) ? e.xOffset : 0, o = bn(e) ? e.staging : null, s = _0(e), a = z0(e), l = eu.get(e);
  if (l && l.proven && l.start === t && l.count === n && l.capacity === i && l.xOffset === r && l.staging === o && l.contentEpoch === s && l.rewriteGen === a)
    return l.mono;
  const c = (f, d, m) => {
    const p = (m == null ? void 0 : m.proven) ?? !0;
    return eu.set(e, {
      mono: f,
      start: t,
      count: n,
      capacity: i,
      xOffset: r,
      contentEpoch: s,
      rewriteGen: a,
      staging: o,
      lastX: d,
      proven: p,
      scanNext: (m == null ? void 0 : m.scanNext) ?? (p ? n : 0)
    }), p ? f : !1;
  }, u = () => {
    if (n <= Rs) {
      const y = U0(e);
      return c(y.mono, y.lastX, { proven: !0, scanNext: n });
    }
    const f = l && !l.proven && l.start === t && l.count === n && l.capacity === i && l.xOffset === r && l.staging === o && l.contentEpoch === s && l.rewriteGen === a;
    if (!f && Hd(e, n))
      return c(!1, Number.NEGATIVE_INFINITY, { proven: !0, scanNext: n });
    let d = f ? l.scanNext : 0, m = f ? l.lastX : Number.NEGATIVE_INFINITY;
    const p = Math.min(n, d + Rs);
    for (let y = d; y < p; y++) {
      const g = Te(e, y);
      if (!Number.isFinite(g) || g < m)
        return c(!1, m, { proven: !0, scanNext: n });
      m = g;
    }
    return p >= n ? c(!0, m, { proven: !0, scanNext: n }) : c(!0, m, { proven: !1, scanNext: p });
  };
  if (l && l.rewriteGen !== a)
    return u();
  if (l && l.proven && l.mono && l.capacity === i && l.xOffset === r && l.staging === o && l.start === t && n > l.count && s > l.contentEpoch) {
    const f = Al(e, l.count, n, l.lastX);
    return f == null ? c(!1, l.lastX, { proven: !0 }) : c(!0, f, { proven: !0 });
  }
  if (l && l.proven && l.mono && l.capacity === i && i > 0 && l.xOffset === r && l.staging === o && n === l.count && n === i && t !== l.start && s > l.contentEpoch && a === l.rewriteGen) {
    const f = (t - l.start + i) % i;
    if (f > 0 && f < n) {
      const d = n - f - 1, m = Te(e, d);
      if (!Number.isFinite(m)) return c(!1, l.lastX, { proven: !0 });
      const p = Al(e, n - f, n, m);
      return p == null ? c(!1, m, { proven: !0 }) : c(!0, p, { proven: !0 });
    }
  }
  return u();
}
function jl(e) {
  if (hn(e) || bn(e))
    return G0(e);
  const t = typeof e == "object" && e !== null ? e : null, n = $e(e), i = e, r = (u, f, d) => (t && _a.set(t, {
    mono: u,
    count: n,
    lastX: f,
    proven: d.proven,
    scanNext: d.scanNext
  }), d.proven ? u : !1);
  if (t) {
    const u = _a.get(t);
    if (u) {
      if (u.count === n && u.proven) return u.mono;
      if (u.proven && u.mono && n > u.count) {
        const f = Al(i, u.count, n, u.lastX);
        return f == null ? r(!1, u.lastX, { proven: !0, scanNext: n }) : r(!0, f, { proven: !0, scanNext: n });
      }
    }
  }
  if (n <= Rs) {
    let u = Number.NEGATIVE_INFINITY;
    for (let f = 0; f < n; f++) {
      const d = Te(i, f);
      if (!Number.isFinite(d) || d < u)
        return r(!1, u, { proven: !0, scanNext: n });
      u = d;
    }
    return r(!0, u, { proven: !0, scanNext: n });
  }
  const o = t ? _a.get(t) : void 0, s = !!(o && o.count === n && !o.proven);
  if (!s && Hd(i, n))
    return r(!1, Number.NEGATIVE_INFINITY, { proven: !0, scanNext: n });
  let a = s ? o.scanNext : 0, l = s ? o.lastX : Number.NEGATIVE_INFINITY;
  const c = Math.min(n, a + Rs);
  for (let u = a; u < c; u++) {
    const f = Te(i, u);
    if (!Number.isFinite(f) || f < l)
      return r(!1, l, { proven: !0, scanNext: n });
    l = f;
  }
  return c >= n ? r(!0, l, { proven: !0, scanNext: n }) : r(!0, l, { proven: !1, scanNext: c });
}
function O0(e) {
  const t = Oo.get(e);
  if (t !== void 0) return t;
  let n = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < e.length; i++) {
    const r = e[i], o = jn(r) ? r[0] : r.timestamp;
    if (!Number.isFinite(o) || o < n)
      return Oo.set(e, !1), !1;
    n = o;
  }
  return Oo.set(e, !0), !0;
}
function Yd(e, t) {
  let n = 0, i = $e(e);
  for (; n < i; ) {
    const r = n + i >>> 1;
    Te(e, r) < t ? n = r + 1 : i = r;
  }
  return n;
}
function Wd(e, t) {
  let n = 0, i = $e(e);
  for (; n < i; ) {
    const r = n + i >>> 1;
    Te(e, r) <= t ? n = r + 1 : i = r;
  }
  return n;
}
function H0(e, t) {
  let n = 0, i = e.length;
  for (; n < i; ) {
    const r = n + i >>> 1;
    e[r][0] < t ? n = r + 1 : i = r;
  }
  return n;
}
function Y0(e, t) {
  let n = 0, i = e.length;
  for (; n < i; ) {
    const r = n + i >>> 1;
    e[r][0] <= t ? n = r + 1 : i = r;
  }
  return n;
}
function W0(e, t) {
  let n = 0, i = e.length;
  for (; n < i; ) {
    const r = n + i >>> 1;
    e[r].timestamp < t ? n = r + 1 : i = r;
  }
  return n;
}
function X0(e, t) {
  let n = 0, i = e.length;
  for (; n < i; ) {
    const r = n + i >>> 1;
    e[r].timestamp <= t ? n = r + 1 : i = r;
  }
  return n;
}
function tu(e) {
  return hn(e) || bn(e) ? !1 : typeof e == "object" && e !== null && !Array.isArray(e) && "x" in e && "y" in e && typeof e.x == "object" && typeof e.y == "object" && "length" in e.x && "length" in e.y;
}
function nu(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e) && ArrayBuffer.isView(e);
}
function iu(e, t, n) {
  const i = new Array(Math.max(0, n - t));
  for (let r = t, o = 0; r < n; r++, o++)
    i[o] = [Te(e, r), ht(e, r)];
  return i;
}
function V0(e, t, n) {
  const i = $e(e), r = Math.max(0, Math.min(t, i)), o = Math.max(r, Math.min(n, i));
  if (r === 0 && o === i) return e;
  if (o <= r) {
    if (tu(e))
      return { x: [], y: [], ...e.size ? { size: [] } : {} };
    if (nu(e)) {
      if (e instanceof DataView)
        throw new Error("DataView is not supported for InterleavedXYData");
      const s = e.constructor;
      return new s(0);
    }
    return [];
  }
  if (hn(e) || bn(e))
    return iu(e, r, o);
  if (tu(e)) {
    const s = Array.isArray(e.x) ? e.x.slice(r, o) : "subarray" in e.x ? e.x.subarray(r, o) : Array.from(e.x).slice(r, o), a = Array.isArray(e.y) ? e.y.slice(r, o) : "subarray" in e.y ? e.y.subarray(r, o) : Array.from(e.y).slice(r, o), l = { x: s, y: a };
    if (e.size) {
      const c = Array.isArray(e.size) ? e.size.slice(r, o) : "subarray" in e.size ? e.size.subarray(r, o) : Array.from(e.size).slice(r, o);
      l.size = c;
    }
    return l;
  }
  if (nu(e)) {
    if (e instanceof DataView)
      throw new Error("DataView is not supported for InterleavedXYData");
    return e.subarray(r * 2, o * 2);
  }
  return Array.isArray(e) ? e.slice(r, o) : iu(e, r, o);
}
function za(e, t, n) {
  const i = $e(e);
  if (i === 0 || !Number.isFinite(t) || !Number.isFinite(n)) return e;
  if (jl(e)) {
    const s = Yd(e, t), a = Wd(e, n);
    return s <= 0 && a >= i ? e : V0(e, s, a);
  }
  if (Array.isArray(e)) {
    const s = e;
    let a = -1, l = -1;
    for (let u = 0; u < i; u++) {
      const f = s[u];
      if (f == null) continue;
      const d = Te(e, u);
      Number.isFinite(d) && d >= t && d <= n && (a < 0 && (a = u), l = u);
    }
    if (a < 0) return [];
    const c = [];
    for (let u = a; u <= l; u++) {
      const f = s[u];
      if (f === null) {
        c.push(null);
        continue;
      }
      if (f === void 0) continue;
      const d = Te(e, u);
      Number.isFinite(d) && d >= t && d <= n && c.push([d, ht(e, u)]);
    }
    return c;
  }
  const o = [];
  for (let s = 0; s < i; s++) {
    const a = Te(e, s);
    if (Number.isFinite(a) && a >= t && a <= n) {
      const l = ht(e, s);
      o.push([a, l]);
    }
  }
  return o;
}
function ru(e, t, n) {
  const i = $e(e);
  if (i === 0) return { start: 0, end: 0 };
  if (!Number.isFinite(t) || !Number.isFinite(n)) return { start: 0, end: i };
  if (!jl(e))
    return { start: 0, end: i };
  const o = Yd(e, t), s = Wd(e, n), a = oi(o, 0, i), l = oi(s, 0, i);
  return l <= a ? { start: a, end: a } : { start: a, end: l };
}
function Ga(e, t, n) {
  const i = e.length;
  if (i === 0 || !Number.isFinite(t) || !Number.isFinite(n)) return e;
  const r = O0(e), o = i > 0 && jn(e[0]);
  if (r) {
    const a = o ? H0(e, t) : W0(e, t), l = o ? Y0(e, n) : X0(e, n);
    return a <= 0 && l >= i ? e : l <= a ? [] : e.slice(a, l);
  }
  const s = [];
  for (let a = 0; a < i; a++) {
    const l = e[a], c = jn(l) ? l[0] : l.timestamp;
    Number.isFinite(c) && c >= t && c <= n && s.push(l);
  }
  return s;
}
function $0() {
  return { kind: "immediate" };
}
function q0(e, t, n) {
  {
    t.zoomResampleDue = !0, n();
    return;
  }
}
function j0(e) {
  return e != null && bn(e) ? null : e;
}
const gi = (e, t) => {
  if (!Number.isFinite(t))
    throw new Error(`${e} must be a finite number. Received: ${String(t)}`);
}, ur = 10;
function fr(e) {
  return e == null || !Number.isFinite(e) || e <= 0 || e === 1 ? ur : e;
}
function Z0() {
  let e = 0, t = 1, n = 0, i = 1;
  const r = {
    kind: "linear",
    domain(o, s) {
      return gi("domain min", o), gi("domain max", s), e = o, t = s, r;
    },
    range(o, s) {
      return gi("range min", o), gi("range max", s), n = o, i = s, r;
    },
    getDomain() {
      return { min: e, max: t };
    },
    getRange() {
      return { min: n, max: i };
    },
    scale(o) {
      if (!Number.isFinite(o)) return Number.NaN;
      if (e === t)
        return (n + i) / 2;
      const s = (o - e) / (t - e);
      return n + s * (i - n);
    },
    invert(o) {
      if (!Number.isFinite(o)) return Number.NaN;
      if (e === t)
        return e;
      if (n === i)
        return (e + t) / 2;
      const s = (o - n) / (i - n);
      return e + s * (t - e);
    }
  };
  return r;
}
function K0(e) {
  let t = fr(e), n = 1, i = t, r = 0, o = 1;
  const s = () => Math.log(t), a = (c) => Math.log(c) / s(), l = {
    kind: "log",
    get base() {
      return t;
    },
    domain(c, u) {
      gi("domain min", c), gi("domain max", u);
      const f = t > 1 ? t : 10;
      let d = Number.isFinite(c) && c > 0 ? c : 1, m = Number.isFinite(u) && u > 0 ? u : f;
      if (d === m)
        m = d * t;
      else if (d > m) {
        const p = d;
        d = m, m = p;
      }
      return n = d, i = m, l;
    },
    range(c, u) {
      return gi("range min", c), gi("range max", u), r = c, o = u, l;
    },
    getDomain() {
      return { min: n, max: i };
    },
    getRange() {
      return { min: r, max: o };
    },
    scale(c) {
      if (!Number.isFinite(c) || c <= 0) return Number.NaN;
      const u = a(n), f = a(i);
      if (u === f)
        return (r + o) / 2;
      const d = (a(c) - u) / (f - u);
      return r + d * (o - r);
    },
    invert(c) {
      if (!Number.isFinite(c)) return Number.NaN;
      const u = a(n), f = a(i);
      if (u === f)
        return n;
      if (r === o)
        return Math.sqrt(n * i);
      const d = (c - r) / (o - r), m = u + d * (f - u);
      return t ** m;
    }
  };
  return l;
}
function Pi(e) {
  return e.type === "log" ? K0(e.logBase) : Z0();
}
function TM() {
  let e = [], t = /* @__PURE__ */ new Map(), n = 0, i = 1;
  const r = (s) => {
    const a = /* @__PURE__ */ new Map();
    for (let l = 0; l < s.length; l++) {
      const c = s[l];
      if (a.has(c))
        throw new Error(`Category domain must not contain duplicates. Duplicate: ${JSON.stringify(c)}`);
      a.set(c, l);
    }
    t = a;
  }, o = {
    domain(s) {
      return e = [...s], r(e), o;
    },
    range(s, a) {
      return gi("range min", s), gi("range max", a), n = s, i = a, o;
    },
    categoryIndex(s) {
      const a = t.get(s);
      return a === void 0 ? -1 : a;
    },
    bandwidth() {
      const s = e.length;
      return s === 0 ? 0 : Math.abs((i - n) / s);
    },
    scale(s) {
      const a = e.length;
      if (a === 0)
        return (n + i) / 2;
      const l = o.categoryIndex(s);
      if (l < 0) return Number.NaN;
      const c = (i - n) / a;
      return n + (l + 0.5) * c;
    }
  };
  return o;
}
function Oa(e, t) {
  if (!(e > 0) || !Number.isFinite(e)) return 1;
  const n = Math.floor(Math.log10(e)), i = e / 10 ** n;
  let r;
  return t ? i < 1.5 ? r = 1 : i < 3 ? r = 2 : i < 7 ? r = 5 : r = 10 : i <= 1 ? r = 1 : i <= 2 ? r = 2 : i <= 5 ? r = 5 : r = 10, r * 10 ** n;
}
function Xd(e, t, n = 5, i) {
  const r = (i == null ? void 0 : i.clampToDomain) !== !1, o = Math.max(2, Math.min(20, Math.floor(n) || 5));
  let s = e, a = t;
  if (!Number.isFinite(s) || !Number.isFinite(a))
    return [0, 1];
  const l = s, c = a;
  if (s === a) {
    const b = Math.abs(s) > 1e-6 ? Math.abs(s) * 0.1 : 0.5;
    s -= b, a += b;
  }
  if (s > a) {
    const b = s;
    s = a, a = b;
  }
  const u = a - s, f = Oa(r ? u / (o - 1) : Oa(u, !1) / (o - 1), !0);
  if (!(f > 0) || !Number.isFinite(f))
    return [s, a];
  const d = Math.floor(s / f) * f, m = Math.ceil(a / f) * f, p = [], y = 64;
  let g = d;
  const S = f * 1e-9, A = l === c ? s : Math.min(l, c), M = l === c ? a : Math.max(l, c);
  for (let b = 0; b < y && g <= m + f * 0.5; b++) {
    const v = Math.abs(g) < f * 1e-12 ? 0 : g;
    r ? v >= A - S && v <= M + S && p.push(v) : (v >= s - S && v <= a + S || v >= d - S && v <= m + S) && p.push(v), g += f;
  }
  if (p.length < 2)
    return r && A !== M ? [A, M] : [s, a];
  const h = [];
  for (const b of p)
    (h.length === 0 || Math.abs(h[h.length - 1] - b) > S) && h.push(b);
  return h.length >= 2 ? h : r && A !== M ? [A, M] : [s, a];
}
const J0 = 8;
function Ds(e, t, n) {
  const i = Math.max(1, Math.floor(n)), r = new Array(i);
  for (let o = 0; o < i; o++) {
    const s = i === 1 ? 0.5 : o / (i - 1), a = e + s * (t - e);
    r[o] = a;
  }
  return r;
}
function ks(e, t, n = 5) {
  const i = Xd(e, t, n, { clampToDomain: !0 });
  return i.length >= 2 ? i : Ds(e, t, Math.max(2, Math.floor(n) || 5));
}
function Q0(e, t, n = ur) {
  const i = fr(n);
  let r = Math.min(e, t), o = Math.max(e, t);
  (!Number.isFinite(r) || !Number.isFinite(o) || !(r > 0) || !(o > 0)) && (r = 1, o = i > 1 ? i : 10), r === o && (o = r * i);
  const s = Math.log(r) / Math.log(i), a = Math.log(o) / Math.log(i), l = Math.ceil(s - 1e-12), c = Math.floor(a + 1e-12);
  if (l > c)
    return [r, o];
  const u = [];
  for (let d = l; d <= c; d++) {
    const m = i ** d;
    m >= r * (1 - 1e-12) && m <= o * (1 + 1e-12) && u.push(m);
  }
  u.sort((d, m) => d - m);
  const f = [];
  for (let d = 0; d < u.length; d++) {
    const m = u[d];
    (f.length === 0 || Math.abs(f[f.length - 1] - m) > Math.abs(m) * 1e-12) && f.push(m);
  }
  if (f.length === 0)
    return [r, o];
  if (f.length === 1) {
    const d = f[0];
    return d > r ? [r, d] : [d, o];
  }
  return f;
}
function Es(e, t, n = ur, i) {
  const r = Math.max(2, Math.floor((i == null ? void 0 : i.maxTicks) ?? 12)), o = fr(n);
  let s = Math.min(e, t), a = Math.max(e, t);
  (!Number.isFinite(s) || !Number.isFinite(a) || !(s > 0) || !(a > 0)) && (s = 1, a = o > 1 ? o : 10), s === a && (a = s * o);
  const l = Math.log(s) / Math.log(o), c = Math.log(a) / Math.log(o), u = c - l, f = Math.ceil(l - 1e-12), d = Math.floor(c + 1e-12), m = [];
  for (let p = f; p <= d; p++) {
    const y = o ** p;
    Il(y, s, a) && m.push(y);
  }
  return m.length >= 3 || m.length >= 2 && u >= 1.2 ? m.length <= r ? m : Pl(m, m, r) : ey(s, a, o, m, r);
}
function Il(e, t, n) {
  return e >= t * (1 - 1e-12) && e <= n * (1 + 1e-12);
}
function ar(e) {
  e.sort((n, i) => n - i);
  const t = [];
  for (let n = 0; n < e.length; n++) {
    const i = e[n];
    (t.length === 0 || Math.abs(t[t.length - 1] - i) > Math.abs(i) * 1e-12) && t.push(i);
  }
  return t;
}
function Pl(e, t, n) {
  if (e.length <= n) return e;
  const i = /* @__PURE__ */ new Set();
  for (const s of t)
    e.includes(s) && i.add(s);
  if (e.length > 0 && (i.add(e[0]), i.add(e[e.length - 1])), i.size >= n) {
    const s = ar([...i]);
    if (s.length <= n) return s;
    const a = [];
    for (let l = 0; l < n; l++) {
      const c = n === 1 ? 0 : Math.round(l * (s.length - 1) / (n - 1));
      a.push(s[c]);
    }
    return ar(a);
  }
  const r = n - i.size, o = e.filter((s) => !i.has(s));
  if (o.length > 0 && r > 0)
    for (let s = 0; s < r; s++) {
      const a = r === 1 ? Math.floor(o.length / 2) : Math.round(s * (o.length - 1) / (r - 1));
      i.add(o[Math.min(a, o.length - 1)]);
    }
  return ar([...i]).slice(0, n);
}
function ey(e, t, n, i, r) {
  if (Math.abs(n - 10) < 1e-9) {
    const d = [
      [1, 2, 5],
      [1, 2, 3, 5, 7],
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
    ], m = Math.log10(e), p = Math.log10(t), y = Math.floor(m - 1e-12), g = Math.ceil(p + 1e-12);
    let S = i.length > 0 ? [...i] : [e, t];
    for (let A = 0; A < d.length; A++) {
      const M = d[A], h = [];
      for (let v = y; v <= g; v++) {
        const x = 10 ** v;
        for (let F = 0; F < M.length; F++) {
          const I = M[F] * x;
          Il(I, e, t) && h.push(I);
        }
      }
      const b = ar(h);
      if (b.length !== 0 && (S = b, b.length >= 3 || A === d.length - 1))
        break;
    }
    S = ar([...S, e, t]);
    for (const A of i)
      S.some((M) => Math.abs(M - A) <= Math.abs(A) * 1e-12) || S.push(A);
    return S = ar(S), S.length > r ? Pl(S, i, r) : S;
  }
  const s = Math.log(e) / Math.log(n), a = Math.log(t) / Math.log(n), l = a - s, c = Math.min(r, Math.max(3, !Number.isFinite(l) || !(l > 0) ? 3 : Math.round(l * 4) + 1)), u = [...i];
  for (let d = 0; d < c; d++) {
    const m = c === 1 ? 0.5 : d / (c - 1), p = n ** (s + m * (a - s));
    Il(p, e, t) && u.push(p);
  }
  u.push(e, t);
  const f = ar(u);
  return f.length > r ? Pl(f, i, r) : f.length > 0 ? f : [e, t];
}
function Vd(e, t = ur) {
  if (!Number.isFinite(e) || e <= 0) return null;
  const n = fr(t), i = Math.log(e) / Math.log(n), r = Math.round(i), o = Math.abs(i - r) < 1e-9 * Math.max(1, Math.abs(r));
  if (o && n === 10) {
    if (Math.abs(r) >= 3)
      return `1e${r}`;
    if (r >= 0)
      return String(10 ** r);
    const a = -r;
    return (10 ** r).toFixed(a);
  }
  if (o && n !== 10)
    return `${ty(n)}^${r}`;
  const s = Math.abs(e);
  return s >= 1e3 || s < 0.01 ? e.toExponential(2).replace(/\.?0+e/, "e") : String(Number(e.toPrecision(6)));
}
function ty(e) {
  return Number.isInteger(e) ? String(e) : String(Number(e.toPrecision(6)));
}
function ny(e, t = J0) {
  const n = Math.abs(e);
  if (!Number.isFinite(n) || n === 0) return 0;
  for (let i = 0; i <= t; i++) {
    const r = n * 10 ** i, o = Math.round(r), s = Math.abs(r - o), a = 1e-9 * Math.max(1, Math.abs(r));
    if (s <= a) return i;
  }
  return Math.max(0, Math.min(t, 1 - Math.floor(Math.log10(n)) + 1));
}
function $d(e) {
  const t = ny(e);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: t });
}
function qd(e, t) {
  if (!Number.isFinite(t)) return null;
  const n = Math.abs(t) < 1e-12 ? 0 : t, i = e.format(n);
  return i === "NaN" ? null : i;
}
const Ls = (e) => typeof e == "number" && Number.isFinite(e) ? e : null, pi = (e) => typeof e == "number" && Number.isFinite(e) ? e : void 0, Tl = (e) => {
  throw new Error(`RenderCoordinator: unreachable value: ${String(e)}`);
}, jd = (e) => Array.isArray(e), Zd = (e) => jd(e) ? { x: e[0], y: e[1] } : { x: e.x, y: e.y }, $n = (e) => Array.isArray(e);
function mn(e) {
  return Math.max(0, Math.min(1, e));
}
function iy(e, t) {
  if (e === !1 || e == null) return null;
  const n = e === !0 ? {} : e;
  if (!n) return null;
  const i = n.duration ?? 300, r = n.delay ?? 0, o = Number.isFinite(i) ? Math.max(0, i) : 300, s = Number.isFinite(r) ? Math.max(0, r) : 0, a = n.easing ?? "cubicOut", l = typeof a == "string" ? t(a) : a;
  return {
    durationMs: o,
    delayMs: s,
    easing: l
  };
}
function ry(e, t, n) {
  return (i) => {
    const r = mn(i), o = e + t;
    if (!(o > 0)) return 1;
    const s = r * o;
    if (s < e) return 0;
    if (!(t > 0)) return 1;
    const a = (s - e) / t;
    return n(a);
  };
}
function oy(e) {
  return e === "heatmap" || e === "band" || e === "errorBar";
}
function sy(e) {
  switch (e.type) {
    case "pie":
      return e.data.some((t) => typeof (t == null ? void 0 : t.value) == "number" && Number.isFinite(t.value) && t.value > 0);
    case "heatmap": {
      const t = e.data, n = Math.floor(Number(t == null ? void 0 : t.columns)), i = Math.floor(Number(t == null ? void 0 : t.rows)), r = t != null && t.z && typeof t.z.length == "number" ? t.z.length : 0;
      return n >= 1 && i >= 1 && r > 0;
    }
    case "band": {
      const t = e.data;
      return Array.isArray(e.data) ? e.data.length > 0 : t && typeof t == "object" && "x" in t && t.x && typeof t.x.length == "number" ? t.x.length > 0 : ArrayBuffer.isView(e.data) ? e.data.byteLength > 0 : !1;
    }
    case "errorBar": {
      const t = e.data;
      return Array.isArray(e.data) ? e.data.length > 0 : t && typeof t == "object" && "x" in t && t.x && typeof t.x.length == "number" ? t.x.length > 0 : !1;
    }
    case "line":
    case "area":
    case "bar":
    case "scatter":
      return $e(e.data) > 0;
    case "candlestick":
    case "ohlc":
      return Array.isArray(e.data) ? e.data.length > 0 : $e(e.data) > 0;
    default:
      return !1;
  }
}
function ay(e) {
  for (let t = 0; t < e.length; t++)
    if (sy(e[t]))
      return !0;
  return !1;
}
function ho(e, t, n) {
  const i = mn(n);
  return {
    min: e.min + (t.min - e.min) * i,
    max: e.max + (t.max - e.max) * i
  };
}
function Ho(e, t, n) {
  const i = mn(n);
  return i === 0 ? { min: e.min, max: e.max } : i === 1 ? { min: t.min, max: t.max } : !(e.min > 0) || !(e.max > 0) || !(t.min > 0) || !(t.max > 0) || !Number.isFinite(e.min) || !Number.isFinite(e.max) || !Number.isFinite(t.min) || !Number.isFinite(t.max) ? ho(e, t, i) : {
    min: Math.exp(Math.log(e.min) + (Math.log(t.min) - Math.log(e.min)) * i),
    max: Math.exp(Math.log(e.max) + (Math.log(t.max) - Math.log(e.max)) * i)
  };
}
function Us(e, t, n) {
  return e + (t - e) * mn(n);
}
function ly(e, t, n, i) {
  const r = $e(t);
  if ($e(e) !== r) return null;
  if (r === 0) return i ?? [];
  const o = i && i.length === r ? i : (() => {
    const a = new Array(r);
    for (let l = 0; l < r; l++)
      a[l] = [Te(t, l), 0];
    return a;
  })(), s = mn(n);
  for (let a = 0; a < r; a++) {
    const l = Te(e, a), c = Te(t, a), u = ht(e, a), f = ht(t, a), d = Number.isFinite(l) && Number.isFinite(c) ? Us(l, c, s) : c, m = Number.isFinite(u) && Number.isFinite(f) ? Us(u, f, s) : f, p = o[a];
    jd(p) ? (p[0] = d, p[1] = m) : (p.x = d, p.y = m);
  }
  return o;
}
function cy(e, t) {
  return {
    ...e,
    data: t,
    rawData: t,
    rawBounds: null
  };
}
function uy(e, t, n, i) {
  var c, u;
  const r = e.data, o = t.data;
  if (r.length !== o.length) return t;
  const s = o.length;
  if (s === 0) return t;
  const a = i && i.length === s ? i : (() => {
    const f = new Array(s);
    for (let d = 0; d < s; d++)
      f[d] = { ...o[d], value: 0 };
    return f;
  })(), l = mn(n);
  for (let f = 0; f < s; f++) {
    const d = (c = r[f]) == null ? void 0 : c.value, m = (u = o[f]) == null ? void 0 : u.value, p = typeof d == "number" && typeof m == "number" && Number.isFinite(d) && Number.isFinite(m) ? Math.max(0, Us(d, m, l)) : typeof m == "number" && Number.isFinite(m) ? m : 0;
    a[f].value = p;
  }
  return { ...t, data: a };
}
function ou(e, t) {
  return e.min === t.min && e.max === t.max;
}
function fy(e, t, n, i = !1) {
  return i && e === "done" ? "pending" : e === "pending" && t && n ? "running" : e;
}
function dy(e, t, n, i) {
  const r = mn(i), o = t <= 0 && n >= 0 ? 0 : t;
  return Us(o, e, r);
}
const su = (e, t) => {
  const n = e.canvas;
  if (!n) throw new Error("RenderCoordinator: gpuContext.canvas is required.");
  const i = e.devicePixelRatio ?? 1, r = Number.isFinite(i) && i > 0 ? i : 1, o = n.width, s = n.height;
  if (!Number.isFinite(o) || !Number.isFinite(s))
    throw new Error(
      `RenderCoordinator: Invalid canvas dimensions: width=${o}, height=${s}. Canvas must be initialized with finite dimensions before rendering.`
    );
  const a = Math.max(1, Math.floor(o)), l = Math.max(1, Math.floor(s)), c = Number.isFinite(t.grid.left) ? t.grid.left : 0, u = Number.isFinite(t.grid.right) ? t.grid.right : 0, f = Number.isFinite(t.grid.top) ? t.grid.top : 0, d = Number.isFinite(t.grid.bottom) ? t.grid.bottom : 0, m = Math.max(0, c), p = Math.max(0, u), y = Math.max(0, f), g = Math.max(0, d);
  return {
    left: m,
    right: p,
    top: y,
    bottom: g,
    canvasWidth: a,
    // Device pixels (clamped above)
    canvasHeight: l,
    // Device pixels (clamped above)
    devicePixelRatio: r
    // Explicit DPR (validated above)
  };
}, my = (e) => {
  const t = Math.max(0, Math.min(255, Math.round(e[0] * 255))), n = Math.max(0, Math.min(255, Math.round(e[1] * 255))), i = Math.max(0, Math.min(255, Math.round(e[2] * 255))), r = Math.max(0, Math.min(1, e[3]));
  return `rgba(${t},${n},${i},${r})`;
}, au = (e, t) => {
  const n = wn(e);
  if (!n) return e;
  const i = Math.max(0, Math.min(1, n[3] * t));
  return my([n[0], n[1], n[2], i]);
}, py = (e) => {
  const { left: t, right: n, top: i, bottom: r, canvasWidth: o, canvasHeight: s, devicePixelRatio: a } = e, l = t * a, c = o - n * a, u = i * a, f = s - r * a, d = l / o * 2 - 1, m = c / o * 2 - 1, p = 1 - u / s * 2, y = 1 - f / s * 2;
  return {
    left: d,
    right: m,
    top: p,
    bottom: y
  };
}, Kd = (e) => {
  const { canvasWidth: t, canvasHeight: n, devicePixelRatio: i } = e, r = e.left * i, o = t - e.right * i, s = e.top * i, a = n - e.bottom * i, l = oi(Math.floor(r), 0, Math.max(0, t)), c = oi(Math.floor(s), 0, Math.max(0, n)), u = oi(Math.ceil(o), 0, Math.max(0, t)), f = oi(Math.ceil(a), 0, Math.max(0, n)), d = Math.max(0, u - l), m = Math.max(0, f - c);
  return { x: l, y: c, w: d, h: m };
}, ii = (e, t) => (e + 1) / 2 * t, fi = (e, t) => (1 - e) / 2 * t, hy = 1e3, yy = 6e4, gy = 36e5, _s = 24 * gy, xy = 30 * _s, by = 365 * _s, Oi = [
  1,
  2,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1e3,
  2e3,
  5e3,
  1e4,
  15e3,
  3e4,
  6e4,
  12e4,
  3e5,
  6e5,
  9e5,
  18e5,
  36e5,
  72e5,
  108e5,
  216e5,
  432e5,
  864e5,
  2 * 864e5,
  7 * 864e5,
  14 * 864e5,
  30 * 864e5,
  90 * 864e5,
  365 * 864e5
], zr = 9, Yo = 1, vy = 6, ys = 5, wy = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
], vo = (e, t) => {
  if (typeof e == "number") return Number.isFinite(e) ? e : null;
  if (typeof e != "string") return null;
  const n = e.trim();
  if (n.length === 0) return null;
  if (n.endsWith("%")) {
    const r = Number.parseFloat(n.slice(0, -1));
    return Number.isFinite(r) ? r / 100 * t : null;
  }
  const i = Number.parseFloat(n);
  return Number.isFinite(i) ? i : null;
}, Ny = (e, t, n) => {
  const i = (e == null ? void 0 : e[0]) ?? "50%", r = (e == null ? void 0 : e[1]) ?? "50%", o = vo(i, t), s = vo(r, n);
  return {
    x: Number.isFinite(o) ? o : t * 0.5,
    y: Number.isFinite(s) ? s : n * 0.5
  };
}, My = (e) => Array.isArray(e), Jd = (e, t) => {
  if (e == null) return { inner: 0, outer: t * 0.7 };
  if (My(e)) {
    const r = vo(e[0], t), o = vo(e[1], t), s = Math.max(0, Number.isFinite(r) ? r : 0), a = Math.max(s, Number.isFinite(o) ? o : t * 0.7);
    return { inner: s, outer: Math.min(t, a) };
  }
  const n = vo(e, t), i = Math.max(0, Number.isFinite(n) ? n : t * 0.7);
  return { inner: 0, outer: Math.min(t, i) };
}, Dn = (e) => String(Math.trunc(e)).padStart(2, "0"), Sy = (e) => String(Math.trunc(e)).padStart(3, "0"), Qd = (e, t) => {
  if (!Number.isFinite(e)) return null;
  (!Number.isFinite(t) || t < 0) && (t = 0);
  const n = new Date(e);
  if (!Number.isFinite(n.getTime())) return null;
  const i = n.getFullYear(), r = n.getMonth() + 1, o = n.getDate(), s = n.getHours(), a = n.getMinutes(), l = n.getSeconds(), c = n.getMilliseconds();
  return t < 2 * hy ? `${Dn(s)}:${Dn(a)}:${Dn(l)}.${Sy(c)}` : t < 5 * yy ? `${Dn(s)}:${Dn(a)}:${Dn(l)}` : t < _s ? `${Dn(s)}:${Dn(a)}` : t <= 7 * _s ? `${Dn(r)}/${Dn(o)} ${Dn(s)}:${Dn(a)}` : t < 3 * xy ? `${Dn(r)}/${Dn(o)}` : t <= by ? `${wy[n.getMonth()] ?? Dn(r)} ${Dn(o)}` : `${i}/${Dn(r)}`;
}, Cy = (e, t) => {
  if (!Number.isFinite(e) || e <= 0)
    return Oi[0];
  const n = Math.max(1, Math.floor(t) - 1), i = e / n;
  for (let r = 0; r < Oi.length; r++) {
    const o = Oi[r];
    if (o >= i) return o;
  }
  return Oi[Oi.length - 1];
}, Fy = (e, t, n) => {
  let i = Math.ceil(e / n) * n;
  return i < e && (i += n), i <= t ? i : null;
}, Ay = (e, t, n, i) => {
  const o = Math.ceil(i / zr) * n, s = [];
  for (let a = 0; s.length < zr; a++) {
    const l = e + a * o;
    if (l > t) break;
    s.push(l);
  }
  return s;
}, Ha = (e, t, n) => {
  if (!Number.isFinite(e) || !Number.isFinite(t)) return [];
  let i = e, r = t;
  if (r < i) {
    const l = i;
    i = r, r = l;
  }
  if (r === i) return [i];
  const o = r - i;
  let s = Cy(o, n), a = Oi.indexOf(s);
  for (a < 0 && (a = 0); ; ) {
    const l = Fy(i, r, s);
    if (l == null)
      return [i, r];
    if (a >= Oi.length - 1) {
      const d = Math.floor((r - l) / s) + 1;
      if (d <= zr) {
        const m = [];
        for (let p = 0; p < d; p++)
          m.push(l + p * s);
        return m;
      }
      return Ay(l, r, s, d);
    }
    const u = [];
    let f = l;
    for (; f <= r && (u.push(f), f += s, !(u.length > zr + 2)); )
      ;
    if (u.length <= zr)
      return u;
    a += 1, s = Oi[a];
  }
}, Iy = (e, t) => {
  if (t <= 1) return e.slice();
  const n = [];
  for (let i = 0; i < e.length; i += t)
    n.push(e[i]);
  return n;
}, Py = (e) => {
  const {
    axisMin: t,
    axisMax: n,
    xScale: i,
    plotClipLeft: r,
    plotClipRight: o,
    canvasCssWidth: s,
    visibleRangeMs: a,
    measureCtx: l,
    measureCache: c,
    fontSize: u,
    fontFamily: f,
    tickFormatter: d
  } = e, m = Ls(t) ?? i.invert(r), p = Ls(n) ?? i.invert(o);
  if (!l || s <= 0) {
    const M = Ha(m, p, ys);
    return {
      tickCount: M.length > 0 ? M.length : ys,
      tickValues: M.length > 0 ? M : Ds(m, p, ys)
    };
  }
  l.font = `${u}px ${f}`, c && c.size > 2e3 && c.clear();
  const y = c ? `${u}px ${f}@@` : null, g = (M) => {
    let h = Number.NEGATIVE_INFINITY;
    const b = M.length;
    for (let v = 0; v < b; v++) {
      const x = M[v], F = d ? d(x) : Qd(x, a);
      if (F == null) continue;
      const I = (() => {
        if (!y) return l.measureText(F).width;
        const B = y + F, _ = c.get(B);
        if (_ != null) return _;
        const C = l.measureText(F).width;
        return c.set(B, C), C;
      })(), R = i.scale(x), T = ii(R, s), N = b === 1 ? "middle" : v === 0 ? "start" : v === b - 1 ? "end" : "middle", w = N === "start" ? T : N === "end" ? T - I : T - I * 0.5, P = N === "start" ? T + I : N === "end" ? T : T + I * 0.5;
      if (w < h + vy)
        return !1;
      h = P;
    }
    return !0;
  };
  let S = null;
  for (let M = zr; M >= Yo; M--) {
    const h = Ha(m, p, M);
    if (h.length === 0) continue;
    const b = h.join(",");
    if (b === S) continue;
    S = b;
    const v = Math.max(1, h.length - 1);
    for (let x = 1; x <= v && x <= 3; x++) {
      const F = x === 1 ? h : Iy(h, x);
      if (F.length !== 0 && g(F))
        return { tickCount: F.length, tickValues: F };
    }
  }
  const A = Ha(m, p, Yo);
  return {
    tickCount: A.length > 0 ? A.length : Yo,
    tickValues: A.length > 0 ? A : Ds(m, p, Yo)
  };
};
function em(e) {
  return Math.max(e + 1, Math.round(e * 1.15));
}
const zs = "600";
function wo(e, t, n) {
  e.dir = "auto", e.style.fontFamily = n.fontFamily, e.style.fontWeight = t ? zs : "400", e.style.userSelect = "none", e.style.pointerEvents = "none";
}
const ta = 4, lu = 12;
function Ty(e, t) {
  return e - t - ta;
}
function By(e, t) {
  return e + t + ta;
}
function Ry(e, t, n) {
  return e - t - ta - n * 0.5;
}
function Dy(e, t, n) {
  return e + t + ta + n * 0.5;
}
function ky(e, t, n, i = lu) {
  if (!Number.isFinite(e) || !Number.isFinite(t) || !Number.isFinite(n))
    return "middle";
  const r = Math.min(t, n), o = Math.max(t, n), s = Number.isFinite(i) ? Math.max(0, i) : lu;
  return e <= r + s ? "start" : e >= o - s ? "end" : "middle";
}
const tm = 6, Bl = 4, Ey = 5;
let Ya = null, Wo = null, cu = "";
function Ly(e, t) {
  if (typeof document > "u") return null;
  try {
    if (Ya || (Ya = document.createElement("canvas"), Wo = Ya.getContext("2d")), !Wo) return null;
    const n = `${e}|${t}`;
    return n !== cu && (Wo.font = `${e}px ${t}`, cu = n), Wo;
  } catch {
    return null;
  }
}
function No(e, t) {
  return (e + 1) / 2 * t;
}
function gs(e, t) {
  return (1 - e) / 2 * t;
}
function Uy(e, t, n) {
  var w, P;
  const { gpuContext: i, currentOptions: r, xScale: o, xTickValues: s, plotClipRect: a, visibleXRangeMs: l } = n;
  if (!r.series.some((B) => B.type !== "pie") || !e || !t)
    return;
  const u = i.canvas;
  if (!u) return;
  const f = Fl(u), d = Od(u);
  if (f <= 0 || d <= 0) return;
  const m = u.offsetLeft || 0, p = u.offsetTop || 0, y = No(a.left, f), g = No(a.right, f), S = gs(a.bottom, d);
  e.clear();
  const A = r.xAxis.tickLength ?? tm, M = r.theme.fontSize, h = d - M * 0.5 - 1, b = Math.min(S + A + Bl + M * 0.5, h), v = r.xAxis.type === "time", x = r.xAxis.type === "log", F = r.xAxis.logBase ?? 10, I = (() => {
    if (v || x) return null;
    const B = s.length;
    let _ = 0;
    if (B >= 2)
      _ = Math.abs(s[1] - s[0]);
    else {
      const C = o.getDomain();
      _ = Math.abs(C.max - C.min);
    }
    return $d(_);
  })(), R = r.xAxis.tickFormatter;
  for (let B = 0; B < s.length; B++) {
    const _ = s[B], C = o.scale(_), E = No(C, f), U = s.length === 1 ? "middle" : ky(E, y, g), G = R ? R(_) : v ? Qd(_, l) : x ? Vd(_, F) : qd(I, _);
    if (G == null) continue;
    const O = e.addLabel(G, m + E, p + b, {
      fontSize: M,
      color: r.theme.textColor,
      fontFamily: r.theme.fontFamily,
      anchor: U
    });
    wo(O, !1, r.theme);
  }
  const T = em(M), N = ((w = r.xAxis.name) == null ? void 0 : w.trim()) ?? "";
  if (N.length > 0) {
    const B = (y + g) / 2, _ = b + M * 0.5, U = ((P = r.dataZoom) == null ? void 0 : P.some((k) => (k == null ? void 0 : k.type) === "slider")) ?? !1 ? d - 32 : d, G = U - T * 0.5 - 1, O = Math.min(
      Math.max(
        _ + Bl + T * 0.5,
        (_ + U) / 2
      ),
      G
    ), D = e.addLabel(N, m + B, p + O, {
      fontSize: T,
      color: r.theme.textColor,
      fontFamily: r.theme.fontFamily,
      fontWeight: zs,
      anchor: "middle"
    });
    wo(D, !0, r.theme);
  }
}
function _y(e) {
  var E, U;
  const {
    axisLabelOverlay: t,
    overlayContainer: n,
    yAxisConfig: i,
    yScale: r,
    plotClipRect: o,
    canvasCssWidth: s,
    canvasCssHeight: a,
    offsetX: l,
    offsetY: c,
    theme: u,
    yTickValues: f
  } = e;
  if (!t || !n || s <= 0 || a <= 0) return;
  const d = No(o.left, s), m = No(o.right, s), p = gs(o.top, a), y = gs(o.bottom, a), g = i.position === "right", S = i.tickLength ?? tm, A = r.getDomain(), M = A.min, h = A.max, b = i.type === "log", v = i.logBase ?? 10, x = f != null && f.length > 0 ? f : b ? Es(M, h, v) : ks(M, h, i.tickCount ?? Ey), F = x.length, I = F <= 1 ? 0 : Math.abs(x[Math.min(1, F - 1)] - x[0]), R = b ? null : $d(I), T = g ? By(m, S) : Ty(d, S), N = i.tickFormatter, w = Ly(u.fontSize, u.fontFamily);
  let P = 0;
  for (let G = 0; G < F; G++) {
    const O = x[G], D = r.scale(O), k = gs(D, a), W = N ? N(O) : b ? Vd(O, v) : qd(R, O);
    if (W == null) continue;
    w ? P = Math.max(P, w.measureText(W).width) : P = Math.max(P, W.length * u.fontSize * 0.6);
    const j = t.addLabel(W, l + T, c + k, {
      fontSize: u.fontSize,
      color: u.textColor,
      fontFamily: u.fontFamily,
      anchor: g ? "start" : "end"
    });
    wo(j, !1, u);
  }
  const B = ((E = i.header) == null ? void 0 : E.trim()) ?? "";
  if (B.length > 0) {
    const G = p - Bl - u.fontSize, O = t.addLabel(B, l + T, c + G, {
      fontSize: u.fontSize,
      color: u.textColor,
      fontFamily: u.fontFamily,
      fontWeight: zs,
      anchor: g ? "start" : "end"
    });
    wo(O, !0, u);
  }
  const _ = em(u.fontSize), C = ((U = i.name) == null ? void 0 : U.trim()) ?? "";
  if (C.length > 0) {
    const G = (p + y) / 2, O = g ? Dy(T, P, _) : Ry(T, P, _), D = t.addLabel(C, l + O, c + G, {
      fontSize: _,
      color: u.textColor,
      fontFamily: u.fontFamily,
      fontWeight: zs,
      anchor: "middle",
      rotation: g ? 90 : -90
    });
    wo(D, !0, u);
  }
}
function nm(e, t) {
  const n = wn(e) ?? [0, 0, 0, 1], i = mn(n[3] * mn(t)), r = Math.round(mn(n[0]) * 255), o = Math.round(mn(n[1]) * 255), s = Math.round(mn(n[2]) * 255);
  return `rgba(${r}, ${o}, ${s}, ${i})`;
}
function zy(e, t) {
  if (!Number.isFinite(e)) return "";
  if (t == null) return String(e);
  const n = Math.min(20, Math.max(0, Math.floor(t)));
  return e.toFixed(n);
}
const uu = /\{(x|y|value|name)\}/g;
function Gs(e, t, n) {
  return uu.lastIndex = 0, e.replace(uu, (i, r) => {
    if (r === "name") return t.name ?? "";
    const o = t[r];
    return o == null ? "" : zy(o, n);
  });
}
function im(e) {
  switch (e) {
    case "center":
      return "middle";
    case "end":
      return "end";
    case "start":
    default:
      return "start";
  }
}
function fu(e) {
  return "offsetLeft" in e;
}
function Wa(e, t) {
  return (e + 1) / 2 * t;
}
function Xa(e, t) {
  return (1 - e) / 2 * t;
}
function Gy(e, t, n) {
  var A, M, h;
  const {
    currentOptions: i,
    xScale: r,
    yScales: o,
    canvasCssWidthForAnnotations: s,
    canvasCssHeightForAnnotations: a,
    plotLeftCss: l,
    plotTopCss: c,
    plotWidthCss: u,
    plotHeightCss: f,
    canvas: d
  } = n, m = o.values().next().value ?? r;
  if (!i.series.some((b) => b.type !== "pie") || !e || !t)
    return;
  if (!d || s <= 0 || a <= 0 || u <= 0 || f <= 0) {
    e.clear();
    return;
  }
  const y = fu(d) ? d.offsetLeft : 0, g = fu(d) ? d.offsetTop : 0;
  e.clear();
  const S = i.annotations ?? [];
  if (S.length !== 0)
    for (let b = 0; b < S.length; b++) {
      const v = S[b], x = v.label;
      if (!(x != null || v.type === "text") || v.type === "bandX") continue;
      let I = null, R = null, T = {
        name: v.id ?? ""
      };
      switch (v.type) {
        case "lineX": {
          const X = r.scale(v.x);
          I = Wa(X, s), R = c, T = { ...T, x: v.x, value: v.x };
          break;
        }
        case "lineY": {
          const X = m.scale(v.y), z = Xa(X, a);
          I = l, R = z - 8, T = { ...T, y: v.y, value: v.y };
          break;
        }
        case "point": {
          const X = r.scale(v.x), z = m.scale(v.y), $ = Wa(X, s), Z = Xa(z, a);
          I = $, R = Z, T = { ...T, x: v.x, y: v.y, value: v.y };
          break;
        }
        case "text": {
          if (v.position.space === "data") {
            const X = r.scale(v.position.x), z = m.scale(v.position.y), $ = Wa(X, s), Z = Xa(z, a);
            I = $, R = Z, T = {
              ...T,
              x: v.position.x,
              y: v.position.y,
              value: v.position.y
            };
          } else {
            const X = l + v.position.x * u, z = c + v.position.y * f;
            I = X, R = z, T = {
              ...T,
              x: v.position.x,
              y: v.position.y,
              value: v.position.y
            };
          }
          break;
        }
        default:
          Tl(v);
      }
      if (I == null || R == null || !Number.isFinite(I) || !Number.isFinite(R))
        continue;
      const N = 200;
      if (I < l - N || I > l + u + N || R < c - N || R > c + f + N)
        continue;
      const w = ((A = x == null ? void 0 : x.offset) == null ? void 0 : A[0]) ?? 0, P = ((M = x == null ? void 0 : x.offset) == null ? void 0 : M[1]) ?? 0, B = I + w, _ = R + P, C = (x == null ? void 0 : x.text) ?? (x != null && x.template ? Gs(x.template, T, x.decimals) : x ? (() => {
        const X = v.type === "lineX" ? "x={x}" : v.type === "lineY" ? "y={y}" : v.type === "point" ? "({x}, {y})" : v.type === "text" ? v.text : "";
        return X.includes("{") ? Gs(X, T, x.decimals) : X;
      })() : v.type === "text" ? v.text : ""), E = typeof C == "string" ? C.trim() : "";
      if (E.length === 0) continue;
      const U = im(x == null ? void 0 : x.anchor), G = ((h = v.style) == null ? void 0 : h.color) ?? i.theme.textColor, O = i.theme.fontSize, D = x == null ? void 0 : x.background, k = (D == null ? void 0 : D.color) != null ? nm(D.color, D.opacity ?? 1) : void 0, W = (() => {
        const X = D == null ? void 0 : D.padding;
        return typeof X == "number" && Number.isFinite(X) ? [X, X, X, X] : Array.isArray(X) && X.length === 4 && X.every((z) => typeof z == "number" && Number.isFinite(z)) ? [X[0], X[1], X[2], X[3]] : D ? [2, 4, 2, 4] : void 0;
      })(), j = typeof (D == null ? void 0 : D.borderRadius) == "number" && Number.isFinite(D.borderRadius) ? D.borderRadius : void 0, ee = {
        x: y + B,
        y: g + _,
        ...k ? {
          background: {
            backgroundColor: k,
            ...W ? { padding: W } : {},
            ...j != null ? { borderRadius: j } : {}
          }
        } : {}
      }, fe = e.addLabel(E, ee.x, ee.y, {
        fontSize: O,
        color: G,
        anchor: U
      });
      if (ee.background) {
        if (fe.style.backgroundColor = ee.background.backgroundColor, fe.style.display = "inline-block", fe.style.boxSizing = "border-box", ee.background.padding) {
          const [X, z, $, Z] = ee.background.padding;
          fe.style.padding = `${X}px ${z}px ${$}px ${Z}px`;
        }
        ee.background.borderRadius != null && (fe.style.borderRadius = `${ee.background.borderRadius}px`);
      }
    }
}
function rm(e, t, n, i) {
  return Number.isFinite(i) && i > 0 && Number.isFinite(n) ? Math.round(n / i) : Number.isFinite(t) && t > 0 && Number.isFinite(e) ? Math.round(e / t) : Math.round(n * 1e6);
}
const du = 20, Oy = 0.01, Hy = 0.2, xs = 4, Yy = 8192, mu = 4096;
function Va(e, t) {
  let n = 0, i = $e(e);
  for (; n < i; ) {
    const r = n + i >>> 1;
    Te(e, r) < t ? n = r + 1 : i = r;
  }
  return n;
}
function Wy(e, t, n) {
  return e >= n.left && e <= n.right && t >= n.top && t <= n.bottom;
}
const $a = (e) => Math.min(1, Math.max(0, e)), Xy = (e) => {
  const t = e.trim().match(/^(\d+(?:\.\d+)?)%$/);
  if (!t) return null;
  const n = Number(t[1]) / 100;
  return Number.isFinite(n) ? n : null;
}, om = (e) => {
  if (typeof e != "string") return "";
  const t = e.trim();
  return t.length > 0 ? t : "";
}, sm = (e) => Array.isArray(e), Vy = (e) => {
  if (sm(e)) {
    const n = e[2];
    return typeof n == "number" && Number.isFinite(n) ? n : null;
  }
  const t = e.size;
  return typeof t == "number" && Number.isFinite(t) ? t : null;
}, $y = (e) => sm(e) ? e : [e.x, e.y, e.size], qy = (e, t) => {
  try {
    const n = e(t);
    return typeof n == "number" && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}, jy = (e, t) => {
  const n = Vy(t);
  if (n != null) return Math.max(0, n);
  const i = e.symbolSize;
  if (typeof i == "number")
    return Number.isFinite(i) ? Math.max(0, i) : xs;
  if (typeof i == "function") {
    const r = qy(i, $y(t));
    return r == null ? xs : Math.max(0, r);
  }
  return xs;
};
function Zy(e) {
  const t = /* @__PURE__ */ new Map(), n = new Array(e.length), i = new Array(e.length);
  let r = 0;
  for (let o = 0; o < e.length; o++) {
    const s = om(e[o].stack);
    if (i[o] = s, s !== "") {
      const a = t.get(s);
      if (a !== void 0)
        n[o] = a;
      else {
        const l = r++;
        t.set(s, l), n[o] = l;
      }
    } else
      n[o] = r++;
  }
  return {
    clusterIndexBySeries: n,
    clusterCount: Math.max(1, r),
    stackIdBySeries: i
  };
}
function Ky(e) {
  const t = [];
  for (let i = 0; i < e.length; i++) {
    const r = e[i].data, o = $e(r);
    for (let s = 0; s < o; s++) {
      const a = Te(r, s);
      Number.isFinite(a) && t.push(a);
    }
  }
  if (t.length < 2) return 1;
  t.sort((i, r) => i - r);
  let n = Number.POSITIVE_INFINITY;
  for (let i = 1; i < t.length; i++) {
    const r = t[i] - t[i - 1];
    r > 0 && r < n && (n = r);
  }
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function Jy(e, t, n) {
  if (Number.isFinite(n) && n > 0) {
    const s = t.scale(0), a = t.scale(0 + n), l = Math.abs(a - s);
    if (Number.isFinite(l) && l > 0) return l;
  }
  const i = [];
  for (let o = 0; o < e.length; o++) {
    const s = e[o].data, a = $e(s);
    for (let l = 0; l < a; l++) {
      const c = Te(s, l);
      if (!Number.isFinite(c)) continue;
      const u = t.scale(c);
      Number.isFinite(u) && i.push(u);
    }
  }
  if (i.length < 2) return 0;
  i.sort((o, s) => o - s);
  let r = Number.POSITIVE_INFINITY;
  for (let o = 1; o < i.length; o++) {
    const s = i[o] - i[o - 1];
    s > 0 && s < r && (r = s);
  }
  return Number.isFinite(r) && r > 0 ? r : 0;
}
const Qy = (e) => {
  let t, n, i;
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    t === void 0 && o.barWidth !== void 0 && (t = o.barWidth), n === void 0 && o.barGap !== void 0 && (n = o.barGap), i === void 0 && o.barCategoryGap !== void 0 && (i = o.barCategoryGap);
  }
  return { barWidth: t, barGap: n, barCategoryGap: i };
};
function am(e, t) {
  const n = Zy(e), i = n.clusterCount, r = Ky(e), o = Jy(e, t, r), s = Qy(e), a = $a(s.barGap ?? Oy), l = $a(s.barCategoryGap ?? Hy), c = Math.max(0, o * (1 - l)), u = i + Math.max(0, i - 1) * a, f = u > 0 ? c / u : 0;
  let d = 0;
  const m = s.barWidth;
  if (typeof m == "number")
    d = Math.max(0, m), d = Math.min(d, f);
  else if (typeof m == "string") {
    const g = Xy(m);
    d = g == null ? 0 : f * $a(g);
  }
  d > 0 || (d = f);
  const p = d * a, y = i * d + Math.max(0, i - 1) * p;
  return {
    categoryStep: r,
    categoryWidthPx: o,
    barWidthPx: d,
    gapPx: p,
    clusterWidthPx: y,
    clusterSlots: n
  };
}
const qa = (e) => {
  let t = Number.POSITIVE_INFINITY, n = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < e.length; i++) {
    const r = e[i].data, o = $e(r);
    for (let s = 0; s < o; s++) {
      const a = ht(r, s);
      Number.isFinite(a) && (a < t && (t = a), a > n && (n = a));
    }
  }
  return !Number.isFinite(t) || !Number.isFinite(n) || t <= 0 && 0 <= n ? 0 : Math.abs(t) < Math.abs(n) ? t : n;
};
function eg(e, t) {
  let n = 0;
  for (let i = 0; i < e.length; i++) {
    const r = e[i].data, o = $e(r);
    for (let s = 0; s < o; s++) {
      const a = ht(r, s);
      if (!Number.isFinite(a)) continue;
      const l = t.scale(a);
      Number.isFinite(l) && l > n && (n = l);
    }
  }
  return Math.max(0, n);
}
function tg(e, t, n) {
  const i = t.invert(n), r = t.invert(0), o = Math.min(i, r), s = Math.max(i, r);
  let a;
  !Number.isFinite(o) || !Number.isFinite(s) ? a = qa(e) : o <= 0 && 0 <= s ? a = 0 : o > 0 ? a = o : s < 0 ? a = s : a = qa(e);
  let l = t.scale(a);
  return Number.isFinite(l) || (a = qa(e), l = t.scale(a)), Number.isFinite(l) || (a = 0, l = t.scale(0)), { baselineDomain: a, baselinePx: l };
}
function Os(e, t, n, i, r, o = du, s) {
  var M, h, b;
  if (!Number.isFinite(t) || !Number.isFinite(n)) return null;
  const a = Number.isFinite(o) ? Math.max(0, o) : du, l = a * a, c = i.invert(t);
  if (!Number.isFinite(c)) return null;
  const u = (v) => {
    if (!s || s.size === 0) return r;
    const x = e[v], F = (x == null ? void 0 : x.yAxis) ?? "y";
    return s.get(F) ?? r;
  };
  let f = -1, d = -1, m = null, p = Number.POSITIVE_INFINITY;
  const y = [], g = [];
  for (let v = 0; v < e.length; v++) {
    const x = e[v];
    (x == null ? void 0 : x.type) === "bar" && x.visible !== !1 && (y.push(x), g.push(v));
  }
  {
    const v = ea(e, { includeHidden: !1 });
    if (v.size > 0) {
      const x = i.invert(t - a), F = i.invert(t + a), I = Number.isFinite(x) && Number.isFinite(F) ? Math.abs(F - x) / 2 : 0;
      let R = null;
      for (const T of v.values()) {
        if (T.length === 0) continue;
        const w = u(T[0].seriesIndex).invert(n);
        if (!Number.isFinite(w)) continue;
        const P = T.map((U) => ({
          seriesIndex: U.seriesIndex,
          data: Op(
            U.series
          )
        })), B = Qs(P), _ = $p({
          layers: P,
          geometries: B,
          xTarget: c,
          yTarget: w,
          xTolerance: I
        });
        if (!_) continue;
        const C = om((M = e[_.seriesIndex]) == null ? void 0 : M.stack), E = {
          seriesIndex: _.seriesIndex,
          dataIndex: _.dataIndex,
          // Tooltip / API: layer contribution. Highlight: cumulative yTop (stroke surface).
          point: [_.x, _.contributionY],
          distance: 0,
          highlightY: _.yTop,
          ...C !== "" ? { stack: C } : {},
          stackTotal: _.stackTotal
        };
        (R === null || E.seriesIndex > R.seriesIndex || E.seriesIndex === R.seriesIndex && E.dataIndex < R.dataIndex) && (R = E);
      }
      if (R) return R;
    }
  }
  if (y.length > 0) {
    const v = am(y, i);
    if (v.barWidthPx > 0 && v.clusterWidthPx >= 0) {
      const x = eg(y, r), { baselineDomain: F, baselinePx: I } = tg(y, r, x), { clusterSlots: R, barWidthPx: T, gapPx: N, clusterWidthPx: w, categoryWidthPx: P, categoryStep: B } = v, _ = /* @__PURE__ */ new Map();
      let C = null;
      for (let E = 0; E < y.length; E++) {
        const U = y[E], G = g[E] ?? -1;
        if (G < 0) continue;
        const O = U.data, D = $e(O), k = R.clusterIndexBySeries[E] ?? 0, W = R.stackIdBySeries[E] ?? "";
        for (let j = 0; j < D; j++) {
          const ee = Te(O, j), fe = ht(O, j);
          if (!Number.isFinite(ee) || !Number.isFinite(fe)) continue;
          const X = i.scale(ee);
          if (!Number.isFinite(X)) continue;
          const z = X - w / 2 + k * (T + N), $ = z + T;
          let Z = F, Q = fe;
          if (W !== "") {
            let se = _.get(W);
            se || (se = /* @__PURE__ */ new Map(), _.set(W, se));
            const ae = rm(X, P, ee, B);
            let de = se.get(ae);
            de || (de = { posSum: F, negSum: F }, se.set(ae, de)), fe >= 0 ? (Z = de.posSum, Q = Z + fe, de.posSum = Q) : (Z = de.negSum, Q = Z + fe, de.negSum = Q);
          } else
            Z = F, Q = fe;
          const K = W !== "" ? r.scale(Z) : I, ne = r.scale(Q);
          if (!Number.isFinite(K) || !Number.isFinite(ne)) continue;
          const L = {
            left: z,
            right: $,
            top: Math.min(K, ne),
            bottom: Math.max(K, ne)
          };
          if (!Wy(t, n, L)) continue;
          (C === null || L.top < C.top || L.top === C.top && G > C.seriesIndex) && (C = {
            seriesIndex: G,
            dataIndex: j,
            top: L.top
          });
        }
      }
      if (C) {
        const E = (h = e[C.seriesIndex]) == null ? void 0 : h.data;
        if (E) {
          const U = Te(E, C.dataIndex), G = ht(E, C.dataIndex), O = Sn(E, C.dataIndex), D = O !== void 0 ? [U, G, O] : [U, G];
          return {
            seriesIndex: C.seriesIndex,
            dataIndex: C.dataIndex,
            point: D,
            distance: 0
          };
        }
      }
    }
  }
  for (let v = 0; v < e.length; v++) {
    const x = e[v];
    if (x.type !== "band" || x.visible === !1) continue;
    const F = x.data, I = yn(F);
    if (I === 0) continue;
    let R = !0, T = Number.NEGATIVE_INFINITY;
    for (let w = 0; w < I; w++) {
      const P = cn(F, w);
      if (!P || !Number.isFinite(P.x)) {
        R = !1;
        break;
      }
      if (P.x < T) {
        R = !1;
        break;
      }
      T = P.x;
    }
    const N = (w) => {
      const P = cn(F, w);
      if (!P || !Number.isFinite(P.x)) return;
      const B = Number.isFinite(P.y) ? P.y : Number.NaN, _ = Number.isFinite(P.y1) ? P.y1 : Number.NaN;
      if (!Number.isFinite(B) && !Number.isFinite(_)) return;
      const C = Number.isFinite(B) && Number.isFinite(_) ? (B + _) / 2 : Number.isFinite(B) ? B : _, E = i.scale(P.x), U = r.scale(C);
      if (!Number.isFinite(E) || !Number.isFinite(U)) return;
      const G = E - t, O = U - n, D = G * G + O * O;
      if (D > l) return;
      (D < p || D === p && (m === null || v < f || v === f && w < d)) && (p = D, f = v, d = w, m = [P.x, Number.isFinite(B) ? B : C]);
    };
    if (R) {
      let w = 0, P = I;
      for (; w < P; ) {
        const _ = w + P >>> 1;
        (((b = cn(F, _)) == null ? void 0 : b.x) ?? Number.NaN) < c ? w = _ + 1 : P = _;
      }
      const B = w;
      for (let _ = B; _ < I; _++) {
        const C = cn(F, _);
        if (!C || !Number.isFinite(C.x)) continue;
        const E = i.scale(C.x);
        if (!Number.isFinite(E)) continue;
        const U = E - t;
        if (U * U > p && m !== null) break;
        N(_);
      }
      for (let _ = B - 1; _ >= 0; _--) {
        const C = cn(F, _);
        if (!C || !Number.isFinite(C.x)) continue;
        const E = i.scale(C.x);
        if (!Number.isFinite(E)) continue;
        const U = E - t;
        if (U * U > p && m !== null) break;
        N(_);
      }
    } else {
      let w = -1, P = Number.POSITIVE_INFINITY;
      for (let B = 0; B < I; B++) {
        const _ = cn(F, B);
        if (!_ || !Number.isFinite(_.x) || !Number.isFinite(_.y) && !Number.isFinite(_.y1)) continue;
        const C = i.scale(_.x);
        if (!Number.isFinite(C)) continue;
        const E = Math.abs(C - t);
        (E < P || E === P && (w < 0 || B < w)) && (P = E, w = B);
      }
      w >= 0 && N(w);
    }
  }
  const S = [], A = [];
  for (let v = 0; v < e.length; v++) {
    const x = e[v];
    x.type === "pie" || x.type === "candlestick" || x.type === "ohlc" || x.type === "heatmap" || x.type === "band" || x.type === "errorBar" || x.type === "impulse" || x.visible !== !1 && (S.push(x), A.push(v));
  }
  for (let v = 0; v < S.length; v++) {
    const x = S[v], F = A[v] ?? -1;
    if (F < 0) continue;
    const I = x.data, R = $e(I);
    if (R === 0) continue;
    const N = x.type === "scatter" ? x : null, w = R >= Yy || jl(I), P = (B) => {
      const _ = Te(I, B), C = ht(I, B);
      if (!Number.isFinite(_) || !Number.isFinite(C)) return !1;
      const E = i.scale(_), U = r.scale(C);
      if (!Number.isFinite(E) || !Number.isFinite(U)) return !1;
      const G = E - t, O = U - n, D = G * G;
      let k = l;
      if (N) {
        const ee = Sn(I, B), X = jy(N, ee !== void 0 ? [_, C, ee] : [_, C]), z = a + X;
        k = z * z;
      }
      if (D > k) return !0;
      const W = D + O * O;
      if (D > p) return !0;
      if (W > k) return !1;
      if (W < p || W === p && (m === null || F < f || F === f && B < d)) {
        p = W, f = F, d = B;
        const ee = Sn(I, B);
        m = ee !== void 0 ? [_, C, ee] : [_, C];
      }
      return !1;
    };
    if (w) {
      const B = Va(I, c), _ = N ? a + xs * 4 : a, C = i.invert(t - _), E = i.invert(t + _);
      let U = 0, G = R;
      if (Number.isFinite(C) && Number.isFinite(E)) {
        const D = Math.min(C, E), k = Math.max(C, E);
        for (U = Va(I, D), G = Va(I, k); G < R && Te(I, G) <= k; )
          G++;
      }
      U = Math.max(0, Math.min(U, B > 0 ? B - 1 : 0)), G = Math.min(R, Math.max(G, Math.min(R, B + 1)));
      const O = G - U;
      if (!(O <= 0)) if (O <= mu) {
        for (let D = B; D < G && !P(D); D++)
          ;
        for (let D = B - 1; D >= U && !P(D); D--)
          ;
      } else {
        const D = Math.max(1, Math.ceil(O / mu));
        for (let ee = U; ee < G; ee += D)
          P(ee);
        B < R && P(B), B > 0 && P(B - 1);
        const k = f === F && d >= 0 ? d : B, W = Math.max(U, k - D), j = Math.min(G, k + D + 1);
        for (let ee = W; ee < j; ee++)
          P(ee);
      }
    } else
      for (let B = 0; B < R; B++)
        P(B);
  }
  return m === null || !Number.isFinite(p) ? null : {
    seriesIndex: f,
    dataIndex: d,
    point: m,
    distance: Math.sqrt(p)
  };
}
function ng() {
  return {
    grid: null,
    xAxis: null,
    yAxes: /* @__PURE__ */ new Map()
  };
}
function ig(e) {
  e.grid = null, e.xAxis = null, e.yAxes.clear();
}
const pu = (e, t) => {
  if (e.length !== t.length) return !1;
  for (let n = 0; n < e.length; n++)
    if (e[n] !== t[n]) return !1;
  return !0;
};
function rg(e) {
  const { gridArea: t } = e;
  return {
    left: t.left,
    right: t.right,
    top: t.top,
    bottom: t.bottom,
    canvasWidth: t.canvasWidth,
    canvasHeight: t.canvasHeight,
    devicePixelRatio: t.devicePixelRatio,
    horizontalCount: e.horizontalCount,
    verticalCount: e.verticalCount,
    horizontalColor: e.horizontalColor,
    verticalColor: e.verticalColor,
    show: e.show,
    horizontalClipYs: e.horizontalClipYs != null ? e.horizontalClipYs.slice() : [],
    verticalClipXs: e.verticalClipXs != null ? e.verticalClipXs.slice() : [],
    xScaleKind: e.xScaleKind ?? "linear",
    yScaleKind: e.yScaleKind ?? "linear",
    logBase: e.logBase ?? 10
  };
}
function og(e, t) {
  return e == null ? !1 : e.left === t.left && e.right === t.right && e.top === t.top && e.bottom === t.bottom && e.canvasWidth === t.canvasWidth && e.canvasHeight === t.canvasHeight && e.devicePixelRatio === t.devicePixelRatio && e.horizontalCount === t.horizontalCount && e.verticalCount === t.verticalCount && e.horizontalColor === t.horizontalColor && e.verticalColor === t.verticalColor && e.show === t.show && pu(e.horizontalClipYs, t.horizontalClipYs) && pu(e.verticalClipXs, t.verticalClipXs) && e.xScaleKind === t.xScaleKind && e.yScaleKind === t.yScaleKind && e.logBase === t.logBase;
}
const sg = (e, t) => {
  if (e.length !== t.length) return !1;
  for (let n = 0; n < e.length; n++)
    if (e[n] !== t[n]) return !1;
  return !0;
};
function hu(e) {
  const { gridArea: t, scale: n, axisConfig: i } = e, r = e.tickValues != null && e.tickValues.length > 0 ? e.tickValues.slice() : [], o = typeof n.getDomain == "function" ? n.getDomain() : { min: Number.NaN, max: Number.NaN }, s = n.kind === "log" ? n.scale(o.min) : n.scale(0), a = n.kind === "log" ? n.scale(o.max) : n.scale(1);
  return {
    orientation: e.orientation,
    axisId: e.axisId,
    left: t.left,
    right: t.right,
    top: t.top,
    bottom: t.bottom,
    canvasWidth: t.canvasWidth,
    canvasHeight: t.canvasHeight,
    devicePixelRatio: t.devicePixelRatio,
    scaleAt0: s,
    scaleAt1: a,
    scaleKind: n.kind ?? "linear",
    scaleBase: n.base ?? 10,
    domainMin: o.min,
    domainMax: o.max,
    tickCount: e.tickCount,
    tickValues: r,
    tickLength: i.tickLength,
    position: i.position,
    min: i.min,
    max: i.max,
    axisLineColor: e.axisLineColor,
    axisTickColor: e.axisTickColor
  };
}
function yu(e, t) {
  return e == null ? !1 : e.orientation === t.orientation && e.axisId === t.axisId && e.left === t.left && e.right === t.right && e.top === t.top && e.bottom === t.bottom && e.canvasWidth === t.canvasWidth && e.canvasHeight === t.canvasHeight && e.devicePixelRatio === t.devicePixelRatio && e.scaleAt0 === t.scaleAt0 && e.scaleAt1 === t.scaleAt1 && e.scaleKind === t.scaleKind && e.scaleBase === t.scaleBase && e.domainMin === t.domainMin && e.domainMax === t.domainMax && e.tickCount === t.tickCount && sg(e.tickValues, t.tickValues) && e.tickLength === t.tickLength && e.position === t.position && e.min === t.min && e.max === t.max && e.axisLineColor === t.axisLineColor && e.axisTickColor === t.axisTickColor;
}
const gu = 5, ag = 1, lg = 4;
function cg(e, t) {
  var N, w;
  const {
    currentOptions: n,
    xScale: i,
    yScales: r,
    gridArea: o,
    xTickCount: s,
    xTickValues: a,
    yTickValuesByAxis: l,
    hasCartesianSeries: c,
    effectivePointer: u,
    interactionScales: f,
    seriesForRender: d,
    withAlpha: m,
    overlayPrepareMemo: p
  } = t, y = /* @__PURE__ */ new Map();
  for (const P of n.yAxes) {
    const B = P.id, _ = r.get(B) ?? r.values().next().value;
    if (!_) continue;
    const C = l == null ? void 0 : l.get(B);
    if (C != null && C.length > 0) {
      y.set(B, C);
      continue;
    }
    const { min: E, max: U } = _.getDomain();
    if (P.type === "log")
      y.set(B, Es(E, U, P.logBase ?? 10));
    else {
      const G = P.tickCount ?? gu;
      y.set(B, ks(E, U, G));
    }
  }
  const g = ((N = n.yAxes[0]) == null ? void 0 : N.id) ?? "y", S = y.get(g) ?? [], A = r.get(g) ?? r.values().next().value, M = n.gridLines, h = M.show && M.horizontal.show, b = M.show && M.vertical.show, v = [];
  if (h && A && S.length > 0)
    for (let P = 0; P < S.length; P++) {
      const B = A.scale(S[P]);
      Number.isFinite(B) && v.push(B);
    }
  const x = [];
  if (b && a != null && a.length > 0)
    for (let P = 0; P < a.length; P++) {
      const B = i.scale(a[P]);
      Number.isFinite(B) && x.push(B);
    }
  const F = h ? v.length > 0 ? v.length : M.horizontal.count : 0, I = b ? x.length > 0 ? x.length : M.vertical.count : 0, R = rg({
    gridArea: o,
    show: M.show,
    horizontalCount: F,
    verticalCount: I,
    horizontalColor: M.horizontal.color,
    verticalColor: M.vertical.color,
    horizontalClipYs: v,
    verticalClipXs: x,
    xScaleKind: i.kind,
    yScaleKind: (A == null ? void 0 : A.kind) ?? "linear",
    logBase: (A == null ? void 0 : A.kind) === "log" ? A.base ?? 10 : i.kind === "log" ? i.base ?? 10 : 10
  });
  if (!(p != null && og(p.grid, R))) {
    const P = (B) => {
      if (F === 0 && I === 0)
        B.prepare(o, {
          lineCount: { horizontal: 0, vertical: 0 }
        });
      else if (F > 0 && I > 0 && M.horizontal.color !== M.vertical.color)
        B.prepare(o, {
          lineCount: { horizontal: F, vertical: 0 },
          color: M.horizontal.color,
          horizontalClipYs: v.length > 0 ? v : void 0
        }), B.prepare(o, {
          lineCount: { horizontal: 0, vertical: I },
          color: M.vertical.color,
          verticalClipXs: x.length > 0 ? x : void 0,
          append: !0
        });
      else {
        const _ = F > 0 ? M.horizontal.color : M.vertical.color;
        B.prepare(o, {
          lineCount: { horizontal: F, vertical: I },
          color: _,
          horizontalClipYs: v.length > 0 ? v : void 0,
          verticalClipXs: x.length > 0 ? x : void 0
        });
      }
    };
    P(e.gridRenderer), e.gridRendererSS1 && P(e.gridRendererSS1), p && (p.grid = R);
  }
  if (c) {
    const P = n.theme.axisLineColor, B = n.theme.axisTickColor, _ = hu({
      axisConfig: n.xAxis,
      scale: i,
      orientation: "x",
      axisId: "x",
      gridArea: o,
      axisLineColor: P,
      axisTickColor: B,
      tickCount: s,
      tickValues: a
    });
    p != null && yu(p.xAxis, _) || (e.xAxisRenderer.prepare(
      n.xAxis,
      i,
      "x",
      o,
      P,
      B,
      s,
      a
    ), p && (p.xAxis = _));
    const E = /* @__PURE__ */ new Set();
    for (const U of n.yAxes) {
      const G = U.id;
      E.add(G);
      const O = e.yAxisRenderers.get(G);
      if (!O) continue;
      const D = r.get(G) ?? r.values().next().value, k = y.get(G) ?? [], W = k.length > 0 ? k.length : U.tickCount ?? gu, j = hu({
        axisConfig: U,
        scale: D,
        orientation: "y",
        axisId: G,
        gridArea: o,
        axisLineColor: P,
        axisTickColor: B,
        tickCount: W,
        tickValues: k
      });
      p != null && yu(p.yAxes.get(G), j) || (O.prepare(U, D, "y", o, P, B, W, k), p && p.yAxes.set(G, j));
    }
    if (p)
      for (const U of [...p.yAxes.keys()])
        E.has(U) || p.yAxes.delete(U);
  }
  if (u.hasPointer && u.isInGrid) {
    const P = {
      showX: !0,
      // Sync has no meaningful y, so avoid horizontal line.
      showY: u.source !== "sync",
      color: m(n.theme.axisLineColor, 0.6),
      lineWidth: ag
    };
    e.crosshairRenderer.prepare(u.x, u.y, o, P), e.crosshairRenderer.setVisible(!0);
  } else
    e.crosshairRenderer.setVisible(!1);
  if (u.source === "mouse" && u.hasPointer && u.isInGrid)
    if (f) {
      const P = t.nearestMatch !== void 0 ? t.nearestMatch : Os(
        d,
        u.gridX,
        u.gridY,
        f.xScale,
        f.yScales.values().next().value,
        void 0,
        f.yScales
      );
      if (P) {
        const { x: B, y: _ } = Zd(P.point), C = typeof P.highlightY == "number" && Number.isFinite(P.highlightY) ? P.highlightY : _, E = f.xScale.scale(B), U = d[P.seriesIndex], G = (U == null ? void 0 : U.yAxis) || "y", D = (f.yScales.get(G) ?? f.yScales.values().next().value).scale(C);
        if (Number.isFinite(E) && Number.isFinite(D)) {
          const k = o.left + E, W = o.top + D, j = Kd(o), ee = {
            centerDeviceX: k * o.devicePixelRatio,
            centerDeviceY: W * o.devicePixelRatio,
            devicePixelRatio: o.devicePixelRatio,
            canvasWidth: o.canvasWidth,
            canvasHeight: o.canvasHeight,
            scissor: j
          }, fe = ((w = n.series[P.seriesIndex]) == null ? void 0 : w.color) ?? "#888";
          e.highlightRenderer.prepare(ee, fe, lg), e.highlightRenderer.setVisible(!0);
        } else
          e.highlightRenderer.setVisible(!1);
      } else
        e.highlightRenderer.setVisible(!1);
    } else
      e.highlightRenderer.setVisible(!1);
  else
    e.highlightRenderer.setVisible(!1);
}
function ug() {
  return /* @__PURE__ */ new Map();
}
function ja(e, t, n) {
  const i = $e(n), r = e.get(t);
  if (r && r.data === n && r.pointCount === i)
    return r.filtered;
  const o = dd(n);
  return e.set(t, { data: n, pointCount: i, filtered: o }), o;
}
function lm(e, t) {
  var n, i, r, o, s, a;
  if (e.length !== t.length) return !0;
  for (let l = 0; l < e.length; l++) {
    const c = e[l], u = t[l];
    if (c.type !== u.type) return !0;
    if (c.type === "pie") {
      const f = c, d = u;
      if (f.data !== d.data || f.data.length !== d.data.length) return !0;
    } else if (c.type === "heatmap") {
      const f = c, d = u;
      if (f.data !== d.data || ((n = f.data) == null ? void 0 : n.z) !== ((i = d.data) == null ? void 0 : i.z) || ((r = f.data) == null ? void 0 : r.columns) !== ((o = d.data) == null ? void 0 : o.columns) || ((s = f.data) == null ? void 0 : s.rows) !== ((a = d.data) == null ? void 0 : a.rows)) return !0;
    } else {
      const f = c, d = u, m = f.rawData ?? f.data, p = d.rawData ?? d.data;
      if (m !== p || typeof f.contentHash == "number" && typeof d.contentHash == "number" && f.contentHash !== d.contentHash || Array.isArray(m) && Array.isArray(p) && m.length !== p.length)
        return !0;
    }
  }
  return !1;
}
function xu(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.type === "line" && t.areaStyle != null;
}
function fg(e, t) {
  if (e.length !== t.length) return !0;
  for (let n = 0; n < e.length; n++) {
    const i = e[n], r = t[n];
    if (i.sampling !== r.sampling || i.samplingThreshold !== r.samplingThreshold || (i.connectNulls ?? !1) !== (r.connectNulls ?? !1) || xu(i) !== xu(r)) return !0;
  }
  return !1;
}
function dg(e, t) {
  return lm(e, t) || fg(e, t);
}
function bu(e, t) {
  if (e.length === t.length && e.length > 0 && e[0] === t[0]) {
    let i = !0;
    for (let r = 1; r < e.length; r++)
      if (e[r] !== t[r]) {
        i = !1;
        break;
      }
    if (i)
      return t;
  }
  const n = new Array(e.length);
  for (let i = 0; i < e.length; i++) {
    const r = e[i], o = t[i];
    if (!o || o.type !== r.type || r.type === "pie" || r.type === "heatmap") {
      n[i] = r;
      continue;
    }
    if (r === o) {
      n[i] = o;
      continue;
    }
    const s = o, a = r, l = a.rawBoundsMode != null && a.rawBoundsMode !== s.rawBoundsMode, c = r.type === "impulse" && (typeof a.baseline == "number" ? a.baseline : 0) !== (typeof s.baseline == "number" ? s.baseline : 0), u = l || c, f = u ? a.rawBounds ?? s.rawBounds : s.rawBounds ?? a.rawBounds, d = u ? a.rawBoundsMode ?? s.rawBoundsMode : s.rawBoundsMode ?? a.rawBoundsMode;
    n[i] = {
      ...r,
      rawData: s.rawData ?? a.rawData,
      rawBounds: f,
      ...d != null ? { rawBoundsMode: d } : {},
      data: s.data ?? a.data,
      // Keep prior hash so later dirty checks stay consistent with retained content.
      ...typeof s.contentHash == "number" ? { contentHash: s.contentHash } : typeof a.contentHash == "number" ? { contentHash: a.contentHash } : {}
    };
  }
  return n;
}
function mg(e) {
  const { prev: t, next: n, runtimeRawDataByIndex: i, runtimeRawBoundsByIndex: r } = e;
  let o = !1;
  const s = Math.min(t.length, n.length, r.length);
  for (let a = 0; a < s; a++) {
    const l = n[a], c = t[a];
    if (l.type !== "impulse" || !c || c.type !== "impulse") continue;
    const u = typeof l.baseline == "number" && Number.isFinite(l.baseline) ? l.baseline : 0, f = typeof c.baseline == "number" && Number.isFinite(c.baseline) ? c.baseline : 0;
    if (u === f) continue;
    const d = i[a];
    if (d != null)
      r[a] = Gr(d, u);
    else {
      const m = l.rawData ?? l.data;
      r[a] = Gr(m, u) ?? l.rawBounds ?? null;
    }
    o = !0;
  }
  return o;
}
function pg(e, t) {
  const n = Math.min(e.length, t.length);
  for (let i = 0; i < n; i++) {
    const r = e[i], o = t[i];
    if (!r || !o || r.type === "pie" || o.type === "pie" || r.type === "heatmap" || o.type === "heatmap") continue;
    const s = r, a = o;
    if (a.rawBoundsMode != null && s.rawBoundsMode != null && a.rawBoundsMode !== s.rawBoundsMode)
      return !0;
  }
  return !1;
}
const vu = (e, t) => {
  if (e === t) return !0;
  if ($n(e) && $n(t))
    return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3] && e[4] === t[4];
  if (!$n(e) && !$n(t))
    return e.timestamp === t.timestamp && e.open === t.open && e.close === t.close && e.low === t.low && e.high === t.high;
  const n = $n(e) ? e : [e.timestamp, e.open, e.close, e.low, e.high], i = $n(t) ? t : [t.timestamp, t.open, t.close, t.low, t.high];
  return n[0] === i[0] && n[1] === i[1] && n[2] === i[2] && n[3] === i[3] && n[4] === i[4];
};
function hg(e) {
  const { series: t, runtimeRawDataByIndex: n, runtimeRawBoundsByIndex: i, extendBounds: r } = e, o = [];
  let s = !1, a = !1;
  for (let l = 0; l < t.length; l++) {
    const c = t[l];
    if (!(c.type === "candlestick" || c.type === "ohlc")) continue;
    const u = c.rawData ?? c.data;
    if (u == null || !Array.isArray(u)) continue;
    const f = n[l];
    if (f === u)
      continue;
    if (f == null || !Array.isArray(f)) {
      n[l] = u.slice(), i[l] = r(null, u), s = !0, a = !0, o.push(l);
      continue;
    }
    const d = f;
    if (d.length !== u.length) {
      if (u.length > d.length) {
        for (let g = 0; g < d.length; g++)
          vu(d[g], u[g]) || (d[g] = u[g]);
        for (let g = d.length; g < u.length; g++)
          d.push(u[g]);
      } else {
        d.length = u.length;
        for (let g = 0; g < u.length; g++)
          d[g] = u[g];
      }
      i[l] = r(null, d), s = !0, o.push(l);
      continue;
    }
    if (u.length === 0) continue;
    const m = u.length - 1, p = u[m], y = d[m];
    vu(y, p) || (d[m] = p, i[l] = r(i[l], [p]), s = !0, o.push(l));
  }
  return { didMutate: s, didReplaceRef: a, indices: o };
}
function wu(e, t, n) {
  const i = wn(e ?? n) ?? wn(n) ?? [1, 1, 1, 1], r = t == null ? 1 : mn(t);
  return [mn(i[0]), mn(i[1]), mn(i[2]), mn(i[3] * r)];
}
function yg(e) {
  var h, b, v, x, F, I, R, T, N, w, P, B, _, C;
  const {
    annotations: t,
    xScale: n,
    yScales: i,
    plotBounds: r,
    canvasCssWidth: o,
    canvasCssHeight: s,
    theme: a,
    offsetX: l = 0,
    offsetY: c = 0
  } = e, u = i.values().next().value ?? n, { leftCss: f, topCss: d, widthCss: m, heightCss: p } = r, y = [], g = [], S = [], A = [], M = [];
  if (t.length === 0 || o <= 0 || s <= 0 || m <= 0 || p <= 0)
    return { linesBelow: y, linesAbove: g, markersBelow: S, markersAbove: A, labels: M };
  for (let E = 0; E < t.length; E++) {
    const U = t[E], G = U.layer ?? "aboveSeries", O = G === "belowSeries" ? y : g, D = G === "belowSeries" ? S : A, k = (h = U.style) == null ? void 0 : h.color, W = (b = U.style) == null ? void 0 : b.opacity, j = typeof ((v = U.style) == null ? void 0 : v.lineWidth) == "number" && Number.isFinite(U.style.lineWidth) ? Math.max(0, U.style.lineWidth) : 1, ee = (x = U.style) == null ? void 0 : x.lineDash, fe = wu(k, W, a.textColor);
    switch (U.type) {
      case "lineX": {
        const ge = n.scale(U.x), Ee = ii(ge, o);
        if (!Number.isFinite(Ee)) break;
        O.push({
          axis: "vertical",
          positionCssPx: Ee,
          lineWidth: j,
          lineDash: ee,
          rgba: fe
        });
        break;
      }
      case "lineY": {
        const ge = u.scale(U.y), Ee = fi(ge, s);
        if (!Number.isFinite(Ee)) break;
        O.push({
          axis: "horizontal",
          positionCssPx: Ee,
          lineWidth: j,
          lineDash: ee,
          rgba: fe
        });
        break;
      }
      case "point": {
        const ge = n.scale(U.x), Ee = u.scale(U.y), Se = ii(ge, o), ve = fi(Ee, s);
        if (!Number.isFinite(Se) || !Number.isFinite(ve)) break;
        const xe = typeof ((F = U.marker) == null ? void 0 : F.size) == "number" && Number.isFinite(U.marker.size) ? Math.max(1, U.marker.size) : 6, Pe = ((R = (I = U.marker) == null ? void 0 : I.style) == null ? void 0 : R.color) ?? ((T = U.style) == null ? void 0 : T.color), Oe = ((w = (N = U.marker) == null ? void 0 : N.style) == null ? void 0 : w.opacity) ?? ((P = U.style) == null ? void 0 : P.opacity), Xe = wu(Pe, Oe, a.textColor);
        D.push({
          xCssPx: Se,
          yCssPx: ve,
          sizeCssPx: xe,
          fillRgba: Xe
        });
        break;
      }
      case "text":
        break;
      case "bandX": {
        const ge = ii(n.scale(U.from), o), Ee = ii(n.scale(U.to), o);
        if (!Number.isFinite(ge) || !Number.isFinite(Ee)) break;
        const Se = Math.abs(Ee - ge);
        if (!(Se > 0)) break;
        O.push({
          axis: "vertical",
          positionCssPx: (ge + Ee) / 2,
          lineWidth: Se,
          lineDash: void 0,
          rgba: fe
        });
        break;
      }
      default:
        Tl(U);
    }
    if (U.type === "bandX") continue;
    const X = U.label;
    if (!(X != null || U.type === "text")) continue;
    let $ = null, Z = null, Q = {
      name: U.id ?? ""
    };
    switch (U.type) {
      case "lineX": {
        const ge = n.scale(U.x);
        $ = ii(ge, o), Z = d, Q = { ...Q, x: U.x, value: U.x };
        break;
      }
      case "lineY": {
        const ge = u.scale(U.y), Ee = fi(ge, s);
        $ = f, Z = Ee - 8, Q = { ...Q, y: U.y, value: U.y };
        break;
      }
      case "point": {
        const ge = n.scale(U.x), Ee = u.scale(U.y), Se = ii(ge, o), ve = fi(Ee, s);
        $ = Se, Z = ve, Q = { ...Q, x: U.x, y: U.y, value: U.y };
        break;
      }
      case "text": {
        if (U.position.space === "data") {
          const ge = n.scale(U.position.x), Ee = u.scale(U.position.y), Se = ii(ge, o), ve = fi(Ee, s);
          $ = Se, Z = ve, Q = {
            ...Q,
            x: U.position.x,
            y: U.position.y,
            value: U.position.y
          };
        } else {
          const ge = f + U.position.x * m, Ee = d + U.position.y * p;
          $ = ge, Z = Ee, Q = {
            ...Q,
            x: U.position.x,
            y: U.position.y,
            value: U.position.y
          };
        }
        break;
      }
      default:
        Tl(U);
    }
    if ($ == null || Z == null || !Number.isFinite($) || !Number.isFinite(Z))
      continue;
    const K = 200;
    if ($ < r.leftCss - K || $ > r.leftCss + r.widthCss + K || Z < r.topCss - K || Z > r.topCss + r.heightCss + K)
      continue;
    const ne = ((B = X == null ? void 0 : X.offset) == null ? void 0 : B[0]) ?? 0, L = ((_ = X == null ? void 0 : X.offset) == null ? void 0 : _[1]) ?? 0, le = $ + ne, se = Z + L, ae = (X == null ? void 0 : X.text) ?? (X != null && X.template ? Gs(X.template, Q, X.decimals) : X ? (() => {
      const ge = U.type === "lineX" ? "x={x}" : U.type === "lineY" ? "y={y}" : U.type === "point" ? "({x}, {y})" : U.type === "text" ? U.text : "";
      return ge.includes("{") ? Gs(ge, Q, X.decimals) : ge;
    })() : U.type === "text" ? U.text : ""), de = typeof ae == "string" ? ae.trim() : "";
    if (de.length === 0) continue;
    const re = im(X == null ? void 0 : X.anchor), ie = ((C = U.style) == null ? void 0 : C.color) ?? a.textColor, be = a.fontSize, te = X == null ? void 0 : X.background, Be = (te == null ? void 0 : te.color) != null ? nm(te.color, te.opacity ?? 1) : void 0, Me = (() => {
      const ge = te == null ? void 0 : te.padding;
      return typeof ge == "number" && Number.isFinite(ge) ? [ge, ge, ge, ge] : Array.isArray(ge) && ge.length === 4 && ge.every((Ee) => typeof Ee == "number" && Number.isFinite(Ee)) ? [ge[0], ge[1], ge[2], ge[3]] : te ? [2, 4, 2, 4] : void 0;
    })(), _e = typeof (te == null ? void 0 : te.borderRadius) == "number" && Number.isFinite(te.borderRadius) ? te.borderRadius : void 0, Le = {
      text: de,
      x: l + le,
      y: c + se,
      anchor: re,
      color: ie,
      fontSize: be,
      ...Be ? {
        background: {
          backgroundColor: Be,
          ...Me ? { padding: Me } : {},
          ..._e != null ? { borderRadius: _e } : {}
        }
      } : {}
    };
    M.push(Le);
  }
  return {
    linesBelow: y,
    linesAbove: g,
    markersBelow: S,
    markersAbove: A,
    labels: M
  };
}
function Vr(e) {
  return e.appendedThisFrame ? "rangedAppend" : e.needsGrowth ? "growWithGpuCopy" : e.geometryCacheHit && e.residency.lastRef === e.dataRef ? "skip" : e.yOnlyRewrite ? "yOnlyRewrite" : "fullRewrite";
}
function Xo(e) {
  const { data: t, dataStore: n, seriesIndex: i, xAxisType: r } = e;
  if (r !== "time")
    return { packingXOffset: 0, xOffset: 0 };
  if (bn(t)) {
    const c = t.xOffset;
    return { packingXOffset: c, xOffset: c };
  }
  const o = (() => {
    const c = $e(t);
    for (let u = 0; u < c; u++) {
      const f = Te(t, u);
      if (Number.isFinite(f)) return f;
    }
    return 0;
  })();
  let s = null;
  try {
    s = n.getSeriesXOffset(i);
  } catch {
    s = null;
  }
  const a = s ?? o;
  return { packingXOffset: a, xOffset: s ?? a };
}
function gg(e, t, n) {
  return n != null && n.hasStackGeometry || (n == null ? void 0 : n.stepMode) != null ? !1 : To(e, t);
}
function xg() {
  return { fingerprint: null, byIndex: null, refIds: /* @__PURE__ */ new WeakMap(), nextRefId: 1 };
}
function Tr(e) {
  e.fingerprint = null, e.byIndex = null;
}
function bg(e, t, n) {
  const i = [String(e.length)];
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    if (!Yr(o)) {
      i.push(`${r}:-`);
      continue;
    }
    const a = Ao(o.stack), l = o.yAxis ?? "y", c = !!o.connectNulls, u = o.visible !== !1, f = t[r];
    let d = "0";
    if (f != null && typeof f == "object") {
      let p = n.refIds.get(f);
      p == null && (p = n.nextRefId++, n.refIds.set(f, p)), d = String(p);
    }
    const m = f != null ? $e(f) : 0;
    i.push(`${r}:${a}|${l}|${d}|${m}|${c ? 1 : 0}|${u ? 1 : 0}`);
  }
  return i.join(";");
}
function vg(e, t, n) {
  const i = e, r = pd(i);
  return i.connectNulls ? n(t, r) : r;
}
function wg(e, t, n) {
  const i = ea(e, { includeHidden: !1 });
  if (i.size === 0)
    return Tr(t), /* @__PURE__ */ new Map();
  const r = new Array(e.length).fill(null);
  for (let a = 0; a < e.length; a++) {
    const l = e[a];
    !Yr(l) || l.visible === !1 || (r[a] = vg(l, a, n));
  }
  const o = bg(e, r, t);
  if (t.byIndex && t.fingerprint === o)
    return t.byIndex;
  const s = /* @__PURE__ */ new Map();
  for (const a of i.values()) {
    const l = a.map((u) => ({
      seriesIndex: u.seriesIndex,
      data: r[u.seriesIndex] ?? u.series.data ?? []
    })), c = Qs(l);
    for (let u = 0; u < c.length; u++) {
      const f = c[u], d = l[u].data, m = $e(d), p = new Float64Array(m), y = new Float64Array(m);
      for (let g = 0; g < m; g++)
        p[g] = Te(d, g), y[g] = f.yTop[g];
      s.set(f.seriesIndex, {
        ...f,
        strokeData: { x: p, y },
        packData: d
      });
    }
  }
  return t.fingerprint = o, t.byIndex = s, s;
}
function Ng() {
  return { byIndex: /* @__PURE__ */ new Map() };
}
function no(e) {
  e.byIndex.clear();
}
function Nu(e, t, n, i, r) {
  const o = e == null ? void 0 : e.byIndex.get(t);
  if (o && o.source === n && o.mode === i && o.connectNulls === r && o.poly && o.cartesian)
    return { poly: o.poly, cartesian: o.cartesian };
  const s = uh(n, i), a = dh(s);
  return e && e.byIndex.set(t, {
    source: n,
    mode: i,
    connectNulls: r,
    poly: s,
    cartesian: a
  }), { poly: s, cartesian: a };
}
function Mu(e, t, n, i, r, o, s) {
  const a = e == null ? void 0 : e.byIndex.get(t);
  if (a && a.source === n && a.mode === o && a.connectNulls === s && a.stackYBottom === i && a.stackYTop === r && a.stacked && a.stackedPack)
    return {
      stacked: a.stacked,
      stackedPack: a.stackedPack,
      strokeData: a.stackedPack
    };
  const l = fh(n, i, r, o), c = { x: l.x, y: l.yTop };
  return e && e.byIndex.set(t, {
    source: n,
    mode: o,
    connectNulls: s,
    poly: { x: l.x, y: l.yTop },
    cartesian: c,
    stacked: l,
    stackedPack: c,
    stackYBottom: i,
    stackYTop: r
  }), { stacked: l, stackedPack: c, strokeData: c };
}
const Su = /* @__PURE__ */ new Set();
function Mg(e) {
  Su.has(e) || (Su.add(e), console.warn(
    `ChartGPU: line series ${e} is GPU-decimation eligible but decimationComputes[${e}] is missing; drawing raw undecimated stroke. Ensure ensureRendererPoolsForSeries sizes the decimation pool for lttb/min/max sampling.`
  ));
}
function na(e) {
  return e.type === "area" || e.type === "line" && !!e.areaStyle;
}
function Sg(e, t) {
  var C, E, U, G, O;
  const {
    currentOptions: n,
    seriesForRender: i,
    xScale: r,
    yScales: o,
    gridArea: s,
    dataStore: a,
    appendedGpuThisFrame: l,
    gpuSeriesKindByIndex: c,
    visibleXDomain: u,
    introPhase: f,
    introProgress01: d,
    withAlpha: m,
    maxRadiusCss: p,
    lastSetSeriesCache: y,
    filterGapsCache: g,
    stackedMountainCache: S,
    stepExpandCache: A
  } = t, M = (D) => {
    const k = D.yAxis || "y";
    return o.get(k) ?? o.values().next().value;
  }, h = (D, k, W) => {
    if (bn(k))
      return;
    const j = (W == null ? void 0 : W.xOffset) ?? 0, ee = y.get(D);
    if (Vr({
      residency: {
        kind: "dataStore",
        gpuBuffer: null,
        pointCount: 0,
        contentVersion: 0,
        lastRef: (ee == null ? void 0 : ee.data) ?? null
      },
      dataRef: k,
      geometryCacheHit: !!(ee && ee.data === k && ee.xOffset === j),
      appendedThisFrame: !1,
      needsGrowth: !1
    }) !== "skip") {
      if (hn(k))
        try {
          if (a.isSeriesRingMode(D)) {
            y.set(D, { data: k, xOffset: j });
            return;
          }
        } catch {
        }
      a.setSeries(D, k, {
        ...W,
        skipContentHash: !0
      }), y.set(D, { data: k, xOffset: j });
    }
  }, b = (D, k) => {
    const W = D.baseline;
    if (W !== void 0 && Number.isFinite(W))
      return W;
    const j = D.yAxis || "y", ee = n.yAxes.find((X) => X.id === j) ?? n.yAxes[0], fe = ee == null ? void 0 : ee.min;
    if (fe !== void 0 && Number.isFinite(fe))
      return fe;
    if (k.kind !== "log")
      return 0;
  }, v = [], x = f === "running" ? mn(d) : 1, F = ((C = n.performance) == null ? void 0 : C.lod) === "strict", I = Number.isFinite(s.devicePixelRatio) && s.devicePixelRatio > 0 ? s.devicePixelRatio : 1, R = Math.max(
    1,
    Math.floor(s.canvasWidth - (s.left + s.right) * I)
  ), T = {
    plotWidthDevicePx: R,
    forceStandardDraw: F
  };
  let N = 0;
  for (let D = 0; D < i.length; D++) {
    const k = i[D];
    k.type === "line" && k.visible !== !1 && N++;
  }
  const w = N === 0, P = wg(
    i,
    S,
    (D, k) => ja(g, D, k)
  );
  for (let D = 0; D < i.length; D++) {
    const k = i[D];
    switch (k.type) {
      case "area": {
        const W = b(k, M(k)), j = P.get(D), ee = Ps(k.step), fe = k.sampling === "none" ? k.rawData ?? k.data : k.data, X = k.connectNulls ? ja(g, D, fe) : fe;
        if (j) {
          if (ee) {
            const { stacked: L, stackedPack: le } = Mu(
              A,
              D,
              j.packData,
              j.yBottom,
              j.yTop,
              ee,
              !!k.connectNulls
            );
            e.areaRenderers[D].prepare(
              k,
              le,
              r,
              M(k),
              0,
              void 0,
              void 0,
              0,
              {
                yBottom: L.yBottom,
                yTop: L.yTop
              },
              T
            );
          } else
            e.areaRenderers[D].prepare(
              k,
              j.packData,
              r,
              M(k),
              0,
              void 0,
              void 0,
              0,
              {
                yBottom: j.yBottom,
                yTop: j.yTop
              },
              T
            );
          c[D] = "other";
          break;
        }
        if (ee) {
          const { cartesian: L } = Nu(
            A,
            D,
            X,
            ee,
            !!k.connectNulls
          );
          e.areaRenderers[D].prepare(
            k,
            L,
            r,
            M(k),
            W,
            void 0,
            void 0,
            0,
            void 0,
            T
          ), c[D] = "other";
          break;
        }
        const { packingXOffset: z, xOffset: $ } = Xo({
          data: X,
          dataStore: a,
          seriesIndex: D,
          xAxisType: n.xAxis.type
        }), Z = !!k.connectNulls;
        (!l.has(D) || Z) && h(D, X, { xOffset: z });
        const Q = a.getSeriesBuffer(D), K = Z ? { start: 0, capacity: 0 } : a.getSeriesRingLayout(D), ne = $e(X);
        K.capacity === 0 || K.start === 0 ? e.areaRenderers[D].prepare(
          k,
          X,
          r,
          M(k),
          W,
          Q,
          Z ? ne : a.getSeriesPointCount(D),
          $,
          void 0,
          T
        ) : e.areaRenderers[D].prepare(
          k,
          X,
          r,
          M(k),
          W,
          void 0,
          void 0,
          0,
          void 0,
          T
        ), Z ? c[D] = "other" : k.sampling === "none" ? c[D] = "fullRawLine" : c[D] = "other";
        break;
      }
      case "line": {
        const W = P.get(D), j = k.rawData, ee = Ps(k.step), fe = F || ee != null, X = gg(k, j, {
          hasStackGeometry: !!W,
          stepMode: ee
        });
        if (W && k.areaStyle) {
          let re = W.strokeData, ie = W.packData, be = W.yBottom, te = W.yTop;
          if (ee) {
            const {
              stacked: Se,
              strokeData: ve,
              stackedPack: xe
            } = Mu(
              A,
              D,
              ie,
              be,
              te,
              ee,
              !!k.connectNulls
            );
            re = ve, ie = xe, be = Se.yBottom, te = Se.yTop;
          }
          const { packingXOffset: Be, xOffset: Me } = Xo({
            data: re,
            dataStore: a,
            seriesIndex: D,
            xAxisType: n.xAxis.type
          });
          l.has(D) || h(D, re, { xOffset: Be });
          const _e = a.getSeriesBuffer(D), Le = { ...k, data: re };
          e.lineRenderers[D].prepare(
            Le,
            _e,
            r,
            M(k),
            Me,
            s.devicePixelRatio,
            s.canvasWidth,
            s.canvasHeight,
            void 0,
            N,
            a.getSeriesRingLayout(D),
            fe,
            R
          );
          const ge = M(k), Ee = {
            type: "area",
            name: k.name,
            rawData: ie,
            data: ie,
            color: k.areaStyle.color,
            areaStyle: k.areaStyle,
            sampling: k.sampling,
            samplingThreshold: k.samplingThreshold,
            connectNulls: k.connectNulls,
            yAxis: k.yAxis ?? "y",
            rawBounds: k.rawBounds,
            stack: k.stack
          };
          e.areaRenderers[D].prepare(
            Ee,
            ie,
            r,
            ge,
            0,
            void 0,
            void 0,
            0,
            {
              yBottom: be,
              yTop: te
            },
            T
          ), c[D] = "other";
          break;
        }
        if (X) {
          const { packingXOffset: re, xOffset: ie } = Xo({
            data: j,
            dataStore: a,
            seriesIndex: D,
            xAxisType: n.xAxis.type
          });
          l.has(D) || h(D, j, { xOffset: re });
          const be = a.getSeriesBuffer(D), te = a.getSeriesPointCount(D), Be = Math.max(1e-6, s.devicePixelRatio || 1), Me = Math.max(1, s.canvasWidth / Be - s.left - s.right), _e = Math.max(1, Math.floor(Me * Be)), Le = Math.max(128, _e * 2), ge = Number.isFinite(k.samplingThreshold) ? Math.max(2, k.samplingThreshold | 0) : Math.max(2, Le), Ee = Math.min(ge, Le, Math.max(2, te)), Se = a.getSeriesRingLayout(D), ve = k.rawBounds, xe = ve != null && Number.isFinite(ve.xMin) && Number.isFinite(ve.xMax) && u.min <= ve.xMin && u.max >= ve.xMax, Pe = j == null || xe ? { start: 0, end: te } : ru(j, u.min, u.max), Oe = S0(k.sampling);
          let Xe = be, Ze = te;
          if (te <= Ee || Oe === null)
            e.lineRenderers[D].prepare(
              k,
              be,
              r,
              M(k),
              ie,
              s.devicePixelRatio,
              s.canvasWidth,
              s.canvasHeight,
              te,
              N,
              Se,
              fe,
              R
            ), c[D] = "gpuDecimationRaw";
          else {
            const ze = e.decimationComputes[D];
            if (!ze) {
              Mg(D), e.lineRenderers[D].prepare(
                k,
                be,
                r,
                M(k),
                ie,
                s.devicePixelRatio,
                s.canvasWidth,
                s.canvasHeight,
                te,
                N,
                Se,
                fe,
                R
              ), c[D] = "gpuDecimationRaw";
              break;
            }
            const Ue = ze.prepare({
              algorithm: Oe,
              rawBuffer: be,
              rawPointCount: te,
              visibleStart: Pe.start,
              visibleEnd: Pe.end,
              targetBuckets: Ee,
              // DataStore hash changes when floats rewrite into the same buffer
              // at the same N (animation / equal-length replace) — WG-P0-2.
              contentVersion: a.getSeriesContentHash(D),
              // Modular ring FIFO: logical → physical index in decimation.wgsl.
              ringStart: Se.start,
              ringCapacity: Se.capacity
            }), Ae = ze.getOutputBuffer();
            Xe = Ae, Ze = Ue, e.lineRenderers[D].prepare(
              k,
              Ae,
              r,
              M(k),
              // Decimation preserves DataStore packing (x - xOffset). Fold the
              // same origin back into the line clip affine as the non-decimated path.
              ie,
              s.devicePixelRatio,
              s.canvasWidth,
              s.canvasHeight,
              Ue,
              N,
              void 0,
              fe,
              R,
              te
            ), c[D] = "gpuDecimationRaw";
          }
          if (k.areaStyle) {
            const ze = M(k), Ue = b(k, ze), Ae = {
              type: "area",
              name: k.name,
              rawData: j,
              data: k.data ?? j,
              color: k.areaStyle.color,
              areaStyle: k.areaStyle,
              sampling: k.sampling,
              samplingThreshold: k.samplingThreshold,
              connectNulls: k.connectNulls,
              yAxis: k.yAxis ?? "y",
              rawBounds: k.rawBounds
            }, Qe = Xe !== be, At = Se.capacity === 0 || Se.start === 0;
            Qe || At ? e.areaRenderers[D].prepare(
              Ae,
              Ae.data,
              r,
              ze,
              Ue,
              Xe,
              Ze,
              ie,
              void 0,
              T
            ) : e.areaRenderers[D].prepare(
              Ae,
              Ae.data,
              r,
              ze,
              Ue,
              void 0,
              void 0,
              0,
              void 0,
              T
            );
          }
          break;
        }
        const z = k.sampling === "none" ? k.rawData ?? k.data : k.data, $ = !!k.connectNulls, Z = $ ? ja(g, D, z) : z, Q = $ || ee != null, K = ee ? Nu(
          A,
          D,
          Z,
          ee,
          $
        ).cartesian : Z, { packingXOffset: ne, xOffset: L } = Xo({
          data: K,
          dataStore: a,
          seriesIndex: D,
          xAxisType: n.xAxis.type
        });
        (!l.has(D) || Q) && h(D, K, { xOffset: ne });
        const le = a.getSeriesBuffer(D), se = K !== k.data ? { ...k, data: K } : k, ae = Q ? { start: 0, capacity: 0 } : a.getSeriesRingLayout(D), de = $e(K);
        if (e.lineRenderers[D].prepare(
          se,
          le,
          r,
          M(k),
          L,
          s.devicePixelRatio,
          s.canvasWidth,
          s.canvasHeight,
          // Pin draw N to filtered/step upload (defensive vs residual DataStore mismatch).
          Q ? de : void 0,
          N,
          ae,
          fe,
          R
        ), Q ? c[D] = "other" : k.sampling === "none" ? c[D] = "fullRawLine" : c[D] = "other", k.areaStyle) {
          const re = M(k), ie = b(k, re), be = {
            type: "area",
            name: k.name,
            rawData: k.data,
            data: K,
            color: k.areaStyle.color,
            areaStyle: k.areaStyle,
            sampling: k.sampling,
            samplingThreshold: k.samplingThreshold,
            connectNulls: k.connectNulls,
            yAxis: k.yAxis ?? "y",
            // Forward resolver bounds so AreaRenderer can skip O(n) bounds scan.
            rawBounds: k.rawBounds
          }, te = Q ? { start: 0, capacity: 0 } : a.getSeriesRingLayout(D);
          te.capacity === 0 || te.start === 0 ? e.areaRenderers[D].prepare(
            be,
            be.data,
            r,
            re,
            ie,
            le,
            Q ? de : a.getSeriesPointCount(D),
            L,
            void 0,
            T
          ) : e.areaRenderers[D].prepare(
            be,
            be.data,
            r,
            re,
            ie,
            void 0,
            void 0,
            0,
            void 0,
            T
          );
        }
        break;
      }
      case "bar": {
        v.push(k);
        break;
      }
      case "scatter": {
        if (k.mode === "density") {
          const W = k.rawData ?? k.data, j = ru(W, u.min, u.max);
          l.has(D) || h(D, W);
          const ee = a.getSeriesBuffer(D), fe = a.getSeriesPointCount(D);
          let X = 0;
          try {
            X = a.getSeriesContentHash(D);
          } catch {
            X = 0;
          }
          e.scatterDensityRenderers[D].prepare(
            k,
            ee,
            fe,
            j.start,
            j.end,
            r,
            M(k),
            s,
            k.rawBounds,
            X
          ), c[D] = "other";
        } else {
          const W = x < 1 ? { ...k, color: m(k.color, x) } : k;
          e.scatterRenderers[D].prepare(
            W,
            k.data,
            r,
            M(k),
            s,
            F,
            w
          );
        }
        break;
      }
      case "pie": {
        if (x < 1 && p > 0) {
          const W = Jd(k.radius, p), j = Math.max(0, W.inner) * x, ee = Math.max(j, W.outer) * x, fe = {
            ...k,
            radius: [j, ee]
          };
          e.pieRenderers[D].prepare(fe, s);
          break;
        }
        e.pieRenderers[D].prepare(k, s);
        break;
      }
      case "heatmap": {
        const W = k;
        (E = e.heatmapRenderers[D]) == null || E.prepare(
          W,
          r,
          M(k),
          s,
          x < 1 ? { opacityOverride: x } : void 0
        ), c[D] = "other";
        break;
      }
      case "band": {
        const W = k, j = W.data, ee = Math.max(1e-6, s.devicePixelRatio || 1);
        (U = e.bandRenderers[D]) == null || U.prepare(
          W,
          j,
          r,
          M(k),
          ee,
          s.canvasWidth,
          s.canvasHeight
        ), c[D] = "other";
        break;
      }
      case "candlestick": {
        e.candlestickRenderers[D].prepare(
          k,
          k.data,
          r,
          M(k),
          s,
          n.theme.backgroundColor
        );
        break;
      }
      case "ohlc": {
        const W = k;
        e.ohlcRenderers[D].prepare(W, W.data, r, M(k), s);
        break;
      }
      case "errorBar": {
        const W = k;
        (G = e.errorBarRenderers[D]) == null || G.prepare(W, W.data, r, M(k), s), c[D] = "other";
        break;
      }
      case "impulse": {
        const W = k;
        (O = e.impulseRenderers[D]) == null || O.prepare(W, W.data, r, M(k), s), c[D] = "other";
        break;
      }
      case "pointCloud3d":
      case "surface3d":
        break;
      default: {
        const W = k;
        throw new Error(`Unhandled series type: ${W.type}`);
      }
    }
  }
  const B = i.map((D, k) => ({ series: D, originalIndex: k })).filter(({ series: D }) => D.visible !== !1), _ = v.filter((D) => D.visible !== !1);
  return {
    visibleSeriesForRender: B,
    barSeriesConfigs: v,
    visibleBarSeriesConfigs: _
  };
}
function Cg(e, t, n) {
  for (let i = 0; i < t.length; i++) {
    const r = t[i];
    r.visible !== !1 && r.type === "scatter" && r.mode === "density" && e.scatterDensityRenderers[i].encodeCompute(n);
  }
}
function Fg(e, t, n) {
  if (e.decimationComputes.length === 0) return;
  let i = null;
  for (let r = 0; r < t.length; r++) {
    const o = t[r];
    if (o.visible === !1 || o.type !== "line") continue;
    const s = e.decimationComputes[r];
    s != null && s.needsEncode() && (i == null && (i = n.beginComputePass({
      label: "decimationCompute/batchPass"
    })), s.encodeCompute(n, i));
  }
  i == null || i.end();
}
function Ag(e, t, n, i) {
  var p, y, g, S, A, M, h;
  const {
    hasCartesianSeries: r,
    gridArea: o,
    mainPass: s,
    plotScissor: a,
    introPhase: l,
    introProgress01: c,
    referenceLineBelowCount: u,
    markerBelowCount: f
  } = n, { visibleSeriesForRender: d } = i, m = l === "running" ? mn(c) : 1;
  for (let b = 0; b < d.length; b++) {
    const { series: v, originalIndex: x } = d[b];
    v.type === "pie" && e.pieRenderers[x].render(s);
  }
  if (r && a.w > 0 && a.h > 0 && (u > 0 || f > 0) && (s.setScissorRect(a.x, a.y, a.w, a.h), u > 0 && t.referenceLineRenderer.render(s, 0, u), f > 0 && t.annotationMarkerRenderer.render(s, 0, f), s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight)), a.w > 0 && a.h > 0) {
    let b = !1;
    for (let v = 0; v < d.length; v++)
      if (d[v].series.type === "heatmap") {
        b = !0;
        break;
      }
    if (b) {
      s.setScissorRect(a.x, a.y, a.w, a.h);
      for (let v = 0; v < d.length; v++) {
        const { series: x, originalIndex: F } = d[v];
        x.type === "heatmap" && ((p = e.heatmapRenderers[F]) == null || p.render(s));
      }
      s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight);
    }
  }
  if (a.w > 0 && a.h > 0) {
    let b = !1;
    for (let v = 0; v < d.length; v++)
      if (d[v].series.type === "band") {
        b = !0;
        break;
      }
    if (b) {
      s.setScissorRect(a.x, a.y, a.w, a.h);
      for (let v = 0; v < d.length; v++) {
        const { series: x, originalIndex: F } = d[v];
        if (x.type === "band")
          if (m < 1) {
            const I = oi(Math.floor(a.w * m), 0, a.w);
            I > 0 && a.h > 0 && (s.setScissorRect(a.x, a.y, I, a.h), (y = e.bandRenderers[F]) == null || y.render(s), s.setScissorRect(a.x, a.y, a.w, a.h));
          } else
            (g = e.bandRenderers[F]) == null || g.render(s);
      }
      s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight);
    }
  }
  if (a.w > 0 && a.h > 0) {
    let b = !1;
    for (let v = 0; v < d.length; v++)
      if (d[v].series.type === "errorBar") {
        b = !0;
        break;
      }
    if (b) {
      s.setScissorRect(a.x, a.y, a.w, a.h);
      for (let v = 0; v < d.length; v++) {
        const { series: x, originalIndex: F } = d[v];
        x.type === "errorBar" && ((S = e.errorBarRenderers[F]) == null || S.render(s));
      }
      s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight);
    }
  }
  if (a.w > 0 && a.h > 0) {
    let b = !1;
    for (let v = 0; v < d.length; v++)
      if (d[v].series.type === "impulse") {
        b = !0;
        break;
      }
    if (b) {
      s.setScissorRect(a.x, a.y, a.w, a.h);
      for (let v = 0; v < d.length; v++) {
        const { series: x, originalIndex: F } = d[v];
        x.type === "impulse" && ((A = e.impulseRenderers[F]) == null || A.render(s));
      }
      s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight);
    }
  }
  for (let b = 0; b < d.length; b++) {
    const { series: v, originalIndex: x } = d[b];
    if (na(v))
      if (m < 1) {
        const F = oi(Math.floor(a.w * m), 0, a.w);
        F > 0 && a.h > 0 && (s.setScissorRect(a.x, a.y, F, a.h), e.areaRenderers[x].render(s), s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight));
      } else
        s.setScissorRect(a.x, a.y, a.w, a.h), e.areaRenderers[x].render(s), s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight);
  }
  a.w > 0 && a.h > 0 && (s.setScissorRect(a.x, a.y, a.w, a.h), e.barRenderer.render(s), s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight));
  for (let b = 0; b < d.length; b++) {
    const { series: v, originalIndex: x } = d[b];
    v.type === "candlestick" ? e.candlestickRenderers[x].render(s) : v.type === "ohlc" && e.ohlcRenderers[x].render(s);
  }
  for (let b = 0; b < d.length; b++) {
    const { series: v, originalIndex: x } = d[b];
    v.type === "scatter" && (v.mode === "density" ? e.scatterDensityRenderers[x].render(s) : e.scatterRenderers[x].render(s));
  }
  if (m < 1) {
    const b = oi(Math.floor(a.w * m), 0, a.w);
    if (b > 0 && a.h > 0) {
      s.setScissorRect(a.x, a.y, b, a.h);
      for (let v = 0; v < d.length; v++) {
        const { series: x, originalIndex: F } = d[v];
        x.type === "line" && ((M = e.lineRenderers[F]) == null || M.render(s));
      }
      s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight);
    }
  } else if (a.w > 0 && a.h > 0) {
    s.setScissorRect(a.x, a.y, a.w, a.h);
    for (let b = 0; b < d.length; b++) {
      const { series: v, originalIndex: x } = d[b];
      v.type === "line" && ((h = e.lineRenderers[x]) == null || h.render(s));
    }
    s.setScissorRect(0, 0, o.canvasWidth, o.canvasHeight);
  }
}
function Ig(e, t) {
  const { visibleSeriesForRender: n } = t;
  for (let i = 0; i < n.length; i++) {
    const { series: r, originalIndex: o } = n[i];
    if (r.type !== "line") continue;
    const s = e.lineRenderers[o];
    if (s != null && s.isDenseHairline()) return !0;
  }
  return !1;
}
function Pg(e, t) {
  var i;
  const { visibleSeriesForRender: n } = t;
  for (let r = 0; r < n.length; r++) {
    const { series: o, originalIndex: s } = n[r];
    if (!na(o)) continue;
    const a = e.areaRenderers[s];
    if ((i = a == null ? void 0 : a.isDenseDeferred) != null && i.call(a)) return !0;
  }
  return !1;
}
function Tg(e, t) {
  var i;
  const { visibleSeriesForRender: n } = t;
  for (let r = 0; r < n.length; r++) {
    const { series: o, originalIndex: s } = n[r], a = o.type;
    if (a === "pie" || a === "heatmap" || a === "band" || a === "errorBar" || a === "impulse" || a === "bar" || a === "candlestick" || a === "ohlc") return !0;
    if (a === "scatter") {
      if (o.mode === "density") return !0;
      const l = e.scatterRenderers[s];
      if (!(l != null && l.isDenseDeferred())) return !0;
      continue;
    }
    if (na(o)) {
      const l = e.areaRenderers[s];
      if (!((i = l == null ? void 0 : l.isDenseDeferred) != null && i.call(l))) return !0;
      if (o.type === "area") continue;
    }
    if (a === "line") {
      const l = e.lineRenderers[s];
      if (!(l != null && l.isDenseHairline())) return !0;
      continue;
    }
    if (a !== "area") return !0;
  }
  return !1;
}
function Bg(e, t) {
  const { visibleSeriesForRender: n } = t;
  for (let i = 0; i < n.length; i++) {
    const { series: r, originalIndex: o } = n[i];
    if (r.type !== "scatter" || r.mode === "density") continue;
    const s = e.scatterRenderers[o];
    if (s != null && s.isDenseDeferred()) return !0;
  }
  return !1;
}
function Cu(e, t, n) {
  const { gridArea: i, densePass: r, plotScissor: o, introPhase: s, introProgress01: a } = t, { visibleSeriesForRender: l } = n, c = s === "running" ? mn(a) : 1, u = (f) => {
    var d;
    for (let m = 0; m < l.length; m++) {
      const { series: p, originalIndex: y } = l[m];
      if (!na(p)) continue;
      const g = e.areaRenderers[y];
      (d = g == null ? void 0 : g.isDenseDeferred) != null && d.call(g) && g.renderDense(f);
    }
  };
  if (c < 1) {
    const f = oi(Math.floor(o.w * c), 0, o.w);
    f > 0 && o.h > 0 && (r.setScissorRect(o.x, o.y, f, o.h), u(r), r.setScissorRect(0, 0, i.canvasWidth, i.canvasHeight));
  } else o.w > 0 && o.h > 0 && (r.setScissorRect(o.x, o.y, o.w, o.h), u(r), r.setScissorRect(0, 0, i.canvasWidth, i.canvasHeight));
}
function Fu(e, t, n) {
  const { gridArea: i, hairlinePass: r, plotScissor: o, introPhase: s, introProgress01: a } = t, { visibleSeriesForRender: l } = n, c = s === "running" ? mn(a) : 1, u = (f) => {
    let d = !1;
    for (let m = 0; m < l.length; m++) {
      const { series: p, originalIndex: y } = l[m];
      if (p.type !== "line") continue;
      const g = e.lineRenderers[y];
      g != null && g.isDenseHairline() && (d || (g.bindHairlinePipeline(f), d = !0), g.renderHairline(f, { skipSetPipeline: !0 }));
    }
  };
  if (c < 1) {
    const f = oi(Math.floor(o.w * c), 0, o.w);
    f > 0 && o.h > 0 && (r.setScissorRect(o.x, o.y, f, o.h), u(r), r.setScissorRect(0, 0, i.canvasWidth, i.canvasHeight));
  } else o.w > 0 && o.h > 0 && (r.setScissorRect(o.x, o.y, o.w, o.h), u(r), r.setScissorRect(0, 0, i.canvasWidth, i.canvasHeight));
}
function Au(e, t, n) {
  const { gridArea: i, densePass: r, plotScissor: o, introPhase: s, introProgress01: a } = t, { visibleSeriesForRender: l } = n, c = s === "running" ? mn(a) : 1, u = (f) => {
    for (let d = 0; d < l.length; d++) {
      const { series: m, originalIndex: p } = l[d];
      if (m.type !== "scatter" || m.mode === "density") continue;
      const y = e.scatterRenderers[p];
      y != null && y.isDenseDeferred() && y.renderDense(f);
    }
  };
  if (c < 1) {
    const f = oi(Math.floor(o.w * c), 0, o.w);
    f > 0 && o.h > 0 && (r.setScissorRect(o.x, o.y, f, o.h), u(r), r.setScissorRect(0, 0, i.canvasWidth, i.canvasHeight));
  } else o.w > 0 && o.h > 0 && (r.setScissorRect(o.x, o.y, o.w, o.h), u(r), r.setScissorRect(0, 0, i.canvasWidth, i.canvasHeight));
}
function Iu(e, t) {
  const { hasCartesianSeries: n, gridArea: i, overlayPass: r, plotScissor: o, referenceLineAboveCount: s, markerAboveCount: a } = t;
  n && o.w > 0 && o.h > 0 && (s > 0 || a > 0) && (r.setScissorRect(o.x, o.y, o.w, o.h), s > 0 && e.referenceLineRendererMsaa.render(r, 0, s), a > 0 && e.annotationMarkerRendererMsaa.render(r, 0, a), r.setScissorRect(0, 0, i.canvasWidth, i.canvasHeight));
}
function Rg(e) {
  return e ? ["main", "denseHairline", "annotationOverlay"] : ["main", "annotationOverlay"];
}
function Dg(e) {
  return !e.needsPostResolveDensePass;
}
function kg(e) {
  const t = e.msaaSampleCount > 1 && (e.hasDenseHairline || !!e.hasDenseScatter || !!e.hasDenseArea), n = Rg(t), i = Dg({
    needsPostResolveDensePass: t
  }), r = i && e.msaaSampleCount === 1;
  return {
    passOrder: n,
    needsDenseHairlinePass: t,
    useDirectSwapchainResolve: i,
    useSwapchainAsMainView: r,
    needResolveAndOverlay: !i,
    needMainColor: !r
  };
}
function Eg(e, t, n) {
  Cg(e, t, n), Fg(e, t, n);
}
function Pu(e, t, n, i) {
  Ag(e, t, n, i);
}
function Lg(e) {
  return e.passOrder.includes("denseHairline");
}
function Ug(e) {
  return e.passOrder.includes("annotationOverlay") && !e.useDirectSwapchainResolve;
}
const Hs = `// grid.wgsl
// Minimal grid line shader:
// - Vertex input: vec2<f32> position in clip-space coordinates
// - Uniforms: identity transform + solid RGBA color

struct VSUniforms {
  transform: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct FSUniforms {
  color: vec4<f32>,
};

@group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;

struct VSIn {
  @location(0) position: vec2<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
};

@vertex
fn vsMain(in: VSIn) -> VSOut {
  var out: VSOut;
  out.clipPosition = vsUniforms.transform * vec4<f32>(in.position, 0.0, 1.0);
  return out;
}

@fragment
fn fsMain() -> @location(0) vec4<f32> {
  return fsUniforms.color;
}
`, _g = "vsMain", zg = "fsMain", Gg = (e) => Number.isInteger(e) && e > 0 && (e & e - 1) === 0, Og = (e, t) => {
  if (!Number.isFinite(e) || e < 0)
    throw new Error(`alignTo(value): value must be a finite non-negative number. Received: ${String(e)}`);
  if (!Gg(t))
    throw new Error(`alignTo(alignment): alignment must be a positive power of two. Received: ${String(t)}`);
  return Math.floor(e) + t - 1 & ~(t - 1);
}, Tu = (e, t, n) => {
  if (n && n.device !== e)
    throw new Error("getStageModule(pipelineCache): cache.device must match the provided GPUDevice.");
  return "module" in t ? {
    module: t.module,
    entryPoint: t.entryPoint || "",
    constants: t.constants
  } : {
    module: Ys(e, t.code, t.label, n),
    entryPoint: t.entryPoint || "",
    constants: t.constants
  };
};
function Ys(e, t, n, i) {
  if (typeof t != "string" || t.length === 0)
    throw new Error("createShaderModule(code): WGSL code must be a non-empty string.");
  if (i) {
    if (i.device !== e)
      throw new Error("createShaderModule(pipelineCache): cache.device must match the provided GPUDevice.");
    return i.getOrCreateShaderModule(t, n);
  }
  return e.createShaderModule({ code: t, label: n });
}
function vn(e, t, n) {
  if (n && n.device !== e)
    throw new Error("createRenderPipeline(pipelineCache): cache.device must match the provided GPUDevice.");
  const i = Tu(e, t.vertex, n), r = i.entryPoint || _g;
  let o;
  if (t.fragment) {
    const u = Tu(e, t.fragment, n), f = u.entryPoint || zg;
    let d;
    if (t.fragment.targets)
      d = [...t.fragment.targets];
    else {
      const m = t.fragment.formats;
      if (!m)
        throw new Error(
          "createRenderPipeline(fragment): provide either `fragment.targets` or `fragment.formats` when a fragment stage is present."
        );
      if (typeof m == "string")
        d = [
          {
            format: m,
            blend: t.fragment.blend,
            writeMask: t.fragment.writeMask
          }
        ];
      else {
        d = new Array(m.length);
        for (let p = 0; p < m.length; p++)
          d[p] = {
            format: m[p],
            blend: t.fragment.blend,
            writeMask: t.fragment.writeMask
          };
      }
    }
    o = {
      module: u.module,
      entryPoint: f,
      targets: d,
      constants: u.constants
    };
  }
  const s = t.primitive ?? {
    topology: "triangle-list"
  }, a = t.multisample ?? { count: 1 };
  let l;
  t.layout != null ? l = t.layout : t.bindGroupLayouts ? l = e.createPipelineLayout({
    bindGroupLayouts: [...t.bindGroupLayouts]
  }) : l = "auto";
  const c = {
    label: t.label,
    layout: l,
    vertex: {
      module: i.module,
      entryPoint: r,
      buffers: t.vertex.buffers ? [...t.vertex.buffers] : [],
      constants: i.constants
    },
    fragment: o,
    primitive: s,
    depthStencil: t.depthStencil,
    multisample: a
  };
  return n ? n.getOrCreateRenderPipeline(c) : e.createRenderPipeline(c);
}
function Ai(e, t, n) {
  if (n && n.device !== e)
    throw new Error("createComputePipeline(pipelineCache): cache.device must match the provided GPUDevice.");
  return n ? n.getOrCreateComputePipeline(t) : e.createComputePipeline(t);
}
function un(e, t, n) {
  if (!Number.isFinite(t) || t <= 0)
    throw new Error(`createUniformBuffer(size): size must be a positive number. Received: ${String(t)}`);
  const i = (n == null ? void 0 : n.alignment) ?? 16, r = Og(t, Math.max(4, i)), o = e.limits.maxUniformBufferBindingSize;
  if (r > o)
    throw new Error(
      `createUniformBuffer(size): requested size ${r} exceeds device.limits.maxUniformBufferBindingSize (${o}).`
    );
  return e.createBuffer({
    label: n == null ? void 0 : n.label,
    size: r,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}
function fn(e, t, n) {
  const i = n instanceof ArrayBuffer ? { arrayBuffer: n, offset: 0, size: n.byteLength } : {
    arrayBuffer: n.buffer,
    offset: n.byteOffset,
    size: n.byteLength
  };
  if (i.size !== 0) {
    if (i.offset & 3 || i.size & 3)
      throw new Error(
        `writeUniformBuffer(data): data byteOffset (${i.offset}) and byteLength (${i.size}) must be multiples of 4 for queue.writeBuffer().`
      );
    if (i.size > t.size)
      throw new Error(`writeUniformBuffer(data): data byteLength (${i.size}) exceeds buffer.size (${t.size}).`);
    e.queue.writeBuffer(t, 0, i.arrayBuffer, i.offset, i.size);
  }
}
const Hg = "bgra8unorm", Yg = 5, Wg = 6, Xg = [1, 1, 1, 0.8], Vg = (() => {
  const e = new ArrayBuffer(64);
  return new Float32Array(e).set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), e;
})(), $g = (e) => Number.isFinite(e.left) && Number.isFinite(e.right) && Number.isFinite(e.top) && Number.isFinite(e.bottom) && Number.isFinite(e.canvasWidth) && Number.isFinite(e.canvasHeight), Bu = (e) => typeof e == "number" && Number.isFinite(e) ? e : void 0, qg = (e, t) => {
  let n = e, i = t;
  if ((!Number.isFinite(n) || !Number.isFinite(i)) && (n = 0, i = 1), n === i)
    i = n + 1;
  else if (n > i) {
    const r = n;
    n = i, i = r;
  }
  return { min: n, max: i };
}, jg = (e, t, n, i) => {
  if (i != null && i.length > 0) {
    const s = [];
    for (let a = 0; a < i.length; a++) {
      const l = i[a];
      Number.isFinite(l) && s.push(l);
    }
    if (s.length > 0) return s;
  }
  const r = e ?? Yg, o = Math.max(1, Math.floor(r));
  if (!Number.isFinite(r) || o < 1)
    throw new Error("AxisRenderer.prepare: tickCount must be a finite number >= 1.");
  return Xd(t, n, o, { clampToDomain: !0 });
}, Zg = (e, t, n, i, r, o) => {
  const { left: s, right: a, top: l, bottom: c, canvasWidth: u, canvasHeight: f } = i, d = Number.isFinite(i.devicePixelRatio) && i.devicePixelRatio > 0 ? i.devicePixelRatio : 1;
  if (!$g(i))
    throw new Error("AxisRenderer.prepare: gridArea dimensions must be finite numbers.");
  if (u <= 0 || f <= 0)
    throw new Error("AxisRenderer.prepare: canvas dimensions must be positive.");
  if (s < 0 || a < 0 || l < 0 || c < 0)
    throw new Error("AxisRenderer.prepare: gridArea margins must be non-negative.");
  const m = s * d, p = u - a * d, y = l * d, g = f - c * d, S = m / u * 2 - 1, A = p / u * 2 - 1, M = 1 - y / f * 2, h = 1 - g / f * 2, b = e.tickLength ?? Wg;
  if (!Number.isFinite(b) || b < 0)
    throw new Error("AxisRenderer.prepare: tickLength must be a finite non-negative number.");
  const v = b * d, x = v / u * 2, F = v / f * 2, I = Bu(e.min) ?? (n === "x" ? t.invert(S) : t.invert(h)), R = Bu(e.max) ?? (n === "x" ? t.invert(A) : t.invert(M)), T = qg(I, R), N = T.min, w = T.max, P = jg(r, N, w, o), B = P.length, _ = 1 + B, C = new Float32Array(_ * 2 * 2);
  let E = 0;
  if (n === "x") {
    C[E++] = S, C[E++] = h, C[E++] = A, C[E++] = h;
    const U = h, G = U - F;
    for (let O = 0; O < B; O++) {
      const D = t.scale(P[O]);
      C[E++] = D, C[E++] = U, C[E++] = D, C[E++] = G;
    }
  } else {
    const U = e.position === "right", G = U ? A : S;
    C[E++] = G, C[E++] = h, C[E++] = G, C[E++] = M;
    const O = G, D = U ? O + x : O - x;
    for (let k = 0; k < B; k++) {
      const W = t.scale(P[k]);
      C[E++] = O, C[E++] = W, C[E++] = D, C[E++] = W;
    }
  }
  return C;
};
function Za(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Hg, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, 64, {
    label: "axisRenderer/vsUniforms"
  }), c = un(e, 16, {
    label: "axisRenderer/fsUniformsLine"
  }), u = un(e, 16, {
    label: "axisRenderer/fsUniformsTick"
  }), f = e.createBindGroup({
    layout: a,
    entries: [
      { binding: 0, resource: { buffer: l } },
      { binding: 1, resource: { buffer: c } }
    ]
  }), d = e.createBindGroup({
    layout: a,
    entries: [
      { binding: 0, resource: { buffer: l } },
      { binding: 1, resource: { buffer: u } }
    ]
  }), m = vn(
    e,
    {
      label: "axisRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: Hs,
        label: "grid.wgsl",
        buffers: [
          {
            arrayStride: 8,
            stepMode: "vertex",
            attributes: [{ shaderLocation: 0, format: "float32x2", offset: 0 }]
          }
        ]
      },
      fragment: {
        code: Hs,
        label: "grid.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "line-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let p = null, y = 0;
  const g = () => {
    if (n) throw new Error("AxisRenderer is disposed.");
  };
  return { prepare: (h, b, v, x, F, I, R, T) => {
    if (g(), v !== "x" && v !== "y")
      throw new Error("AxisRenderer.prepare: orientation must be 'x' or 'y'.");
    const N = Zg(h, b, v, x, R, T), w = N.byteLength, P = Math.max(4, w);
    if (!p || p.size < P) {
      if (p)
        try {
          p.destroy();
        } catch {
        }
      p = e.createBuffer({
        label: "axisRenderer/vertexBuffer",
        size: P,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    e.queue.writeBuffer(p, 0, N.buffer, 0, N.byteLength), y = N.length / 2, fn(e, l, Vg);
    const B = F ?? "rgba(255,255,255,0.8)", _ = I ?? B, C = wn(B) ?? Xg, E = wn(_) ?? C, U = new ArrayBuffer(4 * 4);
    new Float32Array(U).set([C[0], C[1], C[2], C[3]]), fn(e, c, U);
    const G = new ArrayBuffer(4 * 4);
    new Float32Array(G).set([E[0], E[1], E[2], E[3]]), fn(e, u, G);
  }, render: (h) => {
    g(), !(y === 0 || !p) && (h.setPipeline(m), h.setVertexBuffer(0, p), h.setBindGroup(0, f), h.draw(Math.min(2, y)), y > 2 && (h.setBindGroup(0, d), h.draw(y - 2, 1, 2, 0)));
  }, dispose: () => {
    if (!n) {
      n = !0;
      try {
        l.destroy();
      } catch {
      }
      try {
        c.destroy();
      } catch {
      }
      try {
        u.destroy();
      } catch {
      }
      if (p)
        try {
          p.destroy();
        } catch {
        }
      p = null, y = 0;
    }
  } };
}
const Kg = "bgra8unorm", Jg = 5, Qg = 6, ex = "rgba(255,255,255,0.15)", tx = [1, 1, 1, 0.15], nx = 4, ix = (() => {
  const e = new ArrayBuffer(64);
  return new Float32Array(e).set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), e;
})(), rx = (e, t, n, i, r) => {
  const { left: o, right: s, top: a, bottom: l, canvasWidth: c, canvasHeight: u } = e, f = Number.isFinite(e.devicePixelRatio) && e.devicePixelRatio > 0 ? e.devicePixelRatio : 1, d = o * f, m = c - s * f, p = a * f, y = u - l * f, g = m - d, S = y - p, A = i != null && i.length > 0, M = r != null && r.length > 0, h = A ? i.length : t, b = M ? r.length : n, v = h + b, x = new Float32Array(v * 2 * 2);
  let F = 0;
  const I = d / c * 2 - 1, R = m / c * 2 - 1, T = 1 - p / u * 2, N = 1 - y / u * 2;
  for (let w = 0; w < h; w++) {
    let P;
    if (A)
      P = i[w];
    else {
      const B = h === 1 ? 0.5 : w / (h - 1);
      P = 1 - (p + B * S) / u * 2;
    }
    x[F++] = I, x[F++] = P, x[F++] = R, x[F++] = P;
  }
  for (let w = 0; w < b; w++) {
    let P;
    if (M)
      P = r[w];
    else {
      const B = b === 1 ? 0.5 : w / (b - 1);
      P = (d + B * g) / c * 2 - 1;
    }
    x[F++] = P, x[F++] = T, x[F++] = P, x[F++] = N;
  }
  return x;
};
function Ru(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Kg, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.limits.minUniformBufferOffsetAlignment, l = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        // Per-batch color via dynamic offset so multi-batch grids (e.g. distinct
        // H/V colors) each see their own FS uniform slot. Writing into a single
        // uniform between draws is not sequenced with those draws, so all
        // batches would otherwise render with the last color.
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform", hasDynamicOffset: !0 }
      }
    ]
  }), c = un(e, 64, {
    label: "gridRenderer/vsUniforms"
  });
  let u = nx, f = e.createBuffer({
    label: "gridRenderer/fsUniforms",
    size: u * a,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  }), d = e.createBindGroup({
    layout: l,
    entries: [
      { binding: 0, resource: { buffer: c } },
      {
        binding: 1,
        resource: {
          buffer: f,
          offset: 0,
          // Only cover one slot — dynamic offsets index into the full buffer.
          size: 16
        }
      }
    ]
  });
  const m = vn(
    e,
    {
      label: "gridRenderer/pipeline",
      bindGroupLayouts: [l],
      vertex: {
        code: Hs,
        label: "grid.wgsl",
        buffers: [
          {
            arrayStride: 8,
            // vec2<f32> = 2 * 4 bytes
            stepMode: "vertex",
            attributes: [{ shaderLocation: 0, format: "float32x2", offset: 0 }]
          }
        ]
      },
      fragment: {
        code: Hs,
        label: "grid.wgsl",
        formats: i,
        // Enable standard alpha blending so `fsUniforms.color.a` behaves as expected
        // (blends into the cleared background instead of making the canvas pixels transparent).
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "line-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let p = null, y = null, g = [];
  const S = new Float32Array(4), A = () => {
    if (n) throw new Error("GridRenderer is disposed.");
  }, M = (F) => {
    if (F <= u) return;
    let I = u;
    for (; I < F; ) I *= 2;
    try {
      f.destroy();
    } catch {
    }
    u = I, f = e.createBuffer({
      label: "gridRenderer/fsUniforms",
      size: u * a,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }), d = e.createBindGroup({
      layout: l,
      entries: [
        { binding: 0, resource: { buffer: c } },
        {
          binding: 1,
          resource: { buffer: f, offset: 0, size: 16 }
        }
      ]
    });
  }, h = (F, I) => {
    const R = F * a;
    S[0] = I[0], S[1] = I[1], S[2] = I[2], S[3] = I[3], e.queue.writeBuffer(f, R, S.buffer, 0, S.byteLength);
  };
  return { prepare: (F, I) => {
    A();
    const R = I != null && typeof I == "object" && ("lineCount" in I || "color" in I || "append" in I || "horizontalClipYs" in I || "verticalClipXs" in I), T = R ? I : void 0, N = R ? T == null ? void 0 : T.lineCount : I, w = T == null ? void 0 : T.horizontalClipYs, P = T == null ? void 0 : T.verticalClipXs, B = w != null && w.length > 0 ? w.length : (N == null ? void 0 : N.horizontal) ?? Jg, _ = P != null && P.length > 0 ? P.length : (N == null ? void 0 : N.vertical) ?? Qg, C = (T == null ? void 0 : T.color) ?? ex, E = (T == null ? void 0 : T.append) === !0;
    if (B < 0 || _ < 0)
      throw new Error("GridRenderer.prepare: line counts must be non-negative.");
    if (!Number.isFinite(F.left) || !Number.isFinite(F.right) || !Number.isFinite(F.top) || !Number.isFinite(F.bottom) || !Number.isFinite(F.canvasWidth) || !Number.isFinite(F.canvasHeight))
      throw new Error("GridRenderer.prepare: gridArea dimensions must be finite numbers.");
    if (F.canvasWidth <= 0 || F.canvasHeight <= 0)
      throw new Error("GridRenderer.prepare: canvas dimensions must be positive.");
    if (B === 0 && _ === 0) {
      E || (y = null, g = []);
      return;
    }
    const U = rx(F, B, _, w, P), G = (B + _) * 2, O = wn(C) ?? tx, D = E && y && g.length > 0 ? g.length : 0;
    M(D + 1), h(D, O);
    let k = 0;
    if (E && y && y.byteLength > 0 && g.length > 0) {
      k = y.byteLength;
      const ee = new Float32Array(y.length + U.length);
      ee.set(y, 0), ee.set(U, y.length), y = ee, g = g.concat([
        {
          vertexOffsetBytes: k,
          vertexCount: G,
          fsDynamicOffset: D * a
        }
      ]);
    } else
      y = U, g = [
        {
          vertexOffsetBytes: 0,
          vertexCount: G,
          fsDynamicOffset: 0
        }
      ];
    const W = y.byteLength, j = Math.max(4, W);
    if (!p || p.size < j) {
      if (p)
        try {
          p.destroy();
        } catch {
        }
      p = e.createBuffer({
        label: "gridRenderer/vertexBuffer",
        size: j,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    e.queue.writeBuffer(p, 0, y.buffer, 0, y.byteLength), fn(e, c, ix);
  }, render: (F) => {
    if (A(), !(g.length === 0 || !p)) {
      F.setPipeline(m);
      for (const I of g)
        F.setBindGroup(0, d, [I.fsDynamicOffset]), F.setVertexBuffer(0, p, I.vertexOffsetBytes), F.draw(I.vertexCount);
    }
  }, dispose: () => {
    if (!n) {
      n = !0;
      try {
        c.destroy();
      } catch {
      }
      try {
        f.destroy();
      } catch {
      }
      if (p)
        try {
          p.destroy();
        } catch {
        }
      p = null, y = null, g = [];
    }
  } };
}
const Vo = `// area.wgsl
// Area-fill from a storage buffer of domain points (shared with line stroke):
// - points[i] = vec2(x, y) in data coords (optionally x - xOffset packed)
// - Draw triangle-list with 6 vertices × drawSegmentCount instances
//   (one trapezoid per consecutive pair; optional dense LOD stride)
// - instance_index selects the segment; vertex_index selects the 6 quad corners
// - Dual-endpoint NaN check collapses gap-spanning segments (matches line.wgsl).
//   Continuous triangle-strip collapse to clip origin does NOT restart a strip
//   and incorrectly fans through (0,0,0,0) — see GitHub issue #153.
// - Dense LOD (performance.lod auto): lodStride > 1 samples every Nth point so
//   multi-M raw residency still draws ~plot-pixel budget (group 8 mountain).

struct VSUniforms {
  transform: mat4x4<f32>,
  baseline: f32,
  // Independent bases so dual-log X/Y project correctly.
  logBaseX: f32,
  logBaseY: f32,
  // bit0 = log X, bit1 = log Y (DataStore stays data-space; log before mat4).
  logFlags: u32,
  // Dense draw LOD: instance i connects points[i0] → points[i1] where
  //   i0 = min(i * lodStride, lastPointIndex)
  //   i1 = min(i0 + lodStride, lastPointIndex)
  // lodStride == 1 → classic consecutive segments.
  lodStride: u32,
  lastPointIndex: u32,
  _pad0: u32,
  _pad1: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct FSUniforms {
  color: vec4<f32>,
};

@group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;

@group(0) @binding(2) var<storage, read> points: array<vec2<f32>>;

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
};

// 6 vertices of a segment quad (2 triangles = trapezoid to baseline):
//   0: A top, 1: B top, 2: A baseline
//   3: A baseline, 4: B top, 5: B baseline
// uv.x: 0 → endpoint A, 1 → endpoint B
// uv.y: 0 → series y (top), 1 → baseline
fn segmentUv(vid: u32) -> vec2<f32> {
  switch (vid) {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    case 3u: { return vec2<f32>(0.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, 0.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

// Chrome Tint rejects NaN constants — use explicit positive checks instead.
fn canLogProject(p: vec2<f32>) -> bool {
  let flags = vsUniforms.logFlags;
  if ((flags & 1u) != 0u && p.x <= 0.0) {
    return false;
  }
  if ((flags & 2u) != 0u && p.y <= 0.0) {
    return false;
  }
  return true;
}

fn projectData(p: vec2<f32>) -> vec2<f32> {
  let flags = vsUniforms.logFlags;
  if (flags == 0u) {
    return p;
  }
  var x = p.x;
  var y = p.y;
  if ((flags & 1u) != 0u) {
    x = log(x) / log(vsUniforms.logBaseX);
  }
  if ((flags & 2u) != 0u) {
    y = log(y) / log(vsUniforms.logBaseY);
  }
  return vec2<f32>(x, y);
}

@vertex
fn vsMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VSOut {
  var out: VSOut;
  let stride = max(vsUniforms.lodStride, 1u);
  let last = vsUniforms.lastPointIndex;
  let i0 = min(instanceIndex * stride, last);
  let i1 = min(i0 + stride, last);
  // Degenerate (no advance) — collapse (should not happen with correct draw count).
  if (i0 == i1) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }
  let pA = points[i0];
  let pB = points[i1];

  // Dual-endpoint gap detection (same contract as line.wgsl).
  // Null entries are packed as NaN by the CPU. WGSL has no isnan(); use NaN != NaN.
  // Collapsing only one vertex of a continuous strip fans finite neighbors through
  // clip origin — per-segment instances fully discard when either endpoint is NaN.
  if (pA.x != pA.x || pA.y != pA.y || pB.x != pB.x || pB.y != pB.y) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }

  let uv = segmentUv(vertexIndex);
  let p = select(pA, pB, uv.x > 0.5);
  // Baseline is data-space; log projection applies after select so fill-to-min works on log Y.
  let y = select(p.y, vsUniforms.baseline, uv.y > 0.5);
  let domainPos = vec2<f32>(p.x, y);
  if (!canLogProject(domainPos)) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }
  let pos = projectData(domainPos);
  out.clipPosition = vsUniforms.transform * vec4<f32>(pos, 0.0, 1.0);
  return out;
}

@fragment
fn fsMain() -> @location(0) vec4<f32> {
  return fsUniforms.color;
}
`, $o = `// areaStacked.wgsl
// Stacked mountain/area fill: per-point yTop and yBottom (composition baselines).
// - points[i] = AreaPoint { x, y (top), y0 (bottom), _pad }
// - Triangle-list 6 verts × drawSegmentCount instances (same topology as area.wgsl)
// - Dual-endpoint NaN discard on x/y/y0
// - Dense LOD lodStride matches area.wgsl (performance.lod auto multi-M)

struct VSUniforms {
  transform: mat4x4<f32>,
  // Unused scalar baseline slot (layout parity with area.wgsl / affine helpers).
  _padBaseline: f32,
  logBaseX: f32,
  logBaseY: f32,
  logFlags: u32,
  lodStride: u32,
  lastPointIndex: u32,
  _pad0: u32,
  _pad1: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct FSUniforms {
  color: vec4<f32>,
};

@group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;

struct AreaPoint {
  x: f32,
  y: f32,
  y0: f32,
  _pad: f32,
};

@group(0) @binding(2) var<storage, read> points: array<AreaPoint>;

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
};

// 6 vertices of a segment quad between yTop and yBottom:
//   0: A top, 1: B top, 2: A bottom
//   3: A bottom, 4: B top, 5: B bottom
fn segmentUv(vid: u32) -> vec2<f32> {
  switch (vid) {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    case 3u: { return vec2<f32>(0.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, 0.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

fn canLogProject(p: vec2<f32>) -> bool {
  let flags = vsUniforms.logFlags;
  if ((flags & 1u) != 0u && p.x <= 0.0) {
    return false;
  }
  if ((flags & 2u) != 0u && p.y <= 0.0) {
    return false;
  }
  return true;
}

fn projectData(p: vec2<f32>) -> vec2<f32> {
  let flags = vsUniforms.logFlags;
  if (flags == 0u) {
    return p;
  }
  var x = p.x;
  var y = p.y;
  if ((flags & 1u) != 0u) {
    x = log(x) / log(vsUniforms.logBaseX);
  }
  if ((flags & 2u) != 0u) {
    y = log(y) / log(vsUniforms.logBaseY);
  }
  return vec2<f32>(x, y);
}

@vertex
fn vsMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VSOut {
  var out: VSOut;
  let stride = max(vsUniforms.lodStride, 1u);
  let last = vsUniforms.lastPointIndex;
  let i0 = min(instanceIndex * stride, last);
  let i1 = min(i0 + stride, last);
  if (i0 == i1) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }
  let pA = points[i0];
  let pB = points[i1];

  if (
    pA.x != pA.x || pA.y != pA.y || pA.y0 != pA.y0 ||
    pB.x != pB.x || pB.y != pB.y || pB.y0 != pB.y0
  ) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }

  let uv = segmentUv(vertexIndex);
  let x = select(pA.x, pB.x, uv.x > 0.5);
  let yTop = select(pA.y, pB.y, uv.x > 0.5);
  let yBot = select(pA.y0, pB.y0, uv.x > 0.5);
  let y = select(yTop, yBot, uv.y > 0.5);
  let domainPos = vec2<f32>(x, y);
  if (!canLogProject(domainPos)) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }
  let pos = projectData(domainPos);
  out.clipPosition = vsUniforms.transform * vec4<f32>(pos, 0.0, 1.0);
  return out;
}

@fragment
fn fsMain() -> @location(0) vec4<f32> {
  return fsUniforms.color;
}
`;
function cm(e, t) {
  if (e.kind === "log")
    return xn(e);
  const n = Number.isFinite(t) ? t : 0, i = e.scale(n), r = e.scale(n + 1);
  if (!Number.isFinite(i))
    return { a: 0, b: 0 };
  if (!Number.isFinite(r))
    return { a: 0, b: i };
  const o = r - i;
  return { a: Number.isFinite(o) ? o : 0, b: i };
}
function di(e, t, n) {
  const i = e.scale(t), r = e.scale(n);
  if (!Number.isFinite(t) || !Number.isFinite(n) || t === n || !Number.isFinite(i) || !Number.isFinite(r))
    return { a: 0, b: Number.isFinite(i) ? i : 0 };
  const o = (r - i) / (n - t), s = i - o * t;
  return { a: Number.isFinite(o) ? o : 0, b: Number.isFinite(s) ? s : 0 };
}
function xn(e) {
  if (e.kind !== "log")
    return di(e, 0, 1);
  const t = fr(e.base ?? ur), { min: n, max: i } = e.getDomain();
  let r = n, o = i;
  if ((!(r > 0) || !(o > 0) || !Number.isFinite(r) || !Number.isFinite(o)) && (r = 1, o = t > 1 ? t : 10), r === o)
    o = r * t;
  else if (r > o) {
    const m = r;
    r = o, o = m;
  }
  const s = Math.log(t), a = Math.log(r) / s, l = Math.log(o) / s, c = e.scale(r), u = e.scale(o);
  if (!Number.isFinite(a) || !Number.isFinite(l) || a === l || !Number.isFinite(c) || !Number.isFinite(u))
    return { a: 0, b: Number.isFinite(c) ? c : 0 };
  const f = (u - c) / (l - a), d = c - f * a;
  return { a: Number.isFinite(f) ? f : 0, b: Number.isFinite(d) ? d : 0 };
}
function ox(e, t) {
  return (e ? 1 : 0) | (t ? 2 : 0);
}
function Zn(e, t) {
  const n = e.kind === "log", i = t.kind === "log", r = n && e.base != null ? fr(e.base) : ur, o = i && t.base != null ? fr(t.base) : ur;
  return { logFlags: ox(n, i), logBaseX: r, logBaseY: o };
}
const sx = 8192, ax = 4, um = 1e6;
function lx(e) {
  const t = Number.isFinite(e) && e > 0 ? Math.floor(e) : 0, n = t > 0 ? t * ax : 0;
  return Math.max(sx, n);
}
function fm(e) {
  const t = Number.isFinite(e.pointCount) && e.pointCount > 0 ? Math.floor(e.pointCount) : 0;
  if (t < 2)
    return { stride: 1, drawSegmentCount: 0, lastPointIndex: 0, dense: !1 };
  const n = t - 1, i = n;
  if (e.forceStandard === !0 || t < um)
    return { stride: 1, drawSegmentCount: i, lastPointIndex: n, dense: !1 };
  const r = Number.isFinite(e.maxDrawSegments) && e.maxDrawSegments > 0 ? Math.floor(e.maxDrawSegments) : lx(e.plotWidthDevicePx);
  if (i <= r)
    return { stride: 1, drawSegmentCount: i, lastPointIndex: n, dense: !1 };
  const o = Math.max(1, Math.ceil(i / r)), s = Math.max(1, Math.ceil(i / o));
  return { stride: o, drawSegmentCount: s, lastPointIndex: n, dense: o > 1 };
}
function cx(e) {
  const t = fm({
    pointCount: e.pointCount,
    plotWidthDevicePx: e.plotWidthDevicePx,
    forceStandard: e.forceStandard
  });
  return {
    policy: t.dense ? "denseLod" : "standard",
    stride: t.stride,
    drawSegmentCount: t.drawSegmentCount,
    lastPointIndex: t.lastPointIndex
  };
}
const ux = "bgra8unorm", Du = (e) => Math.min(1, Math.max(0, e)), fx = (e) => wn(e) ?? [0, 0, 0, 1], ku = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, dx = (e, t, n, i, r) => {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
};
function mx(e, t, n) {
  for (let i = 0; i < n; i++) {
    const r = Te(t, i), o = ht(t, i);
    !Number.isFinite(r) || !Number.isFinite(o) ? (e[i * 2] = Number.NaN, e[i * 2 + 1] = Number.NaN) : (e[i * 2] = r, e[i * 2 + 1] = o);
  }
}
function px(e, t, n, i, r = 0) {
  if (n < 2) return n;
  const o = n - 1, s = Math.max(1, i | 0);
  let a = 0;
  for (let u = 0; u < o; u += s) {
    const f = Te(t, u), d = ht(t, u);
    !Number.isFinite(f) || !Number.isFinite(d) ? (e[a * 2] = Number.NaN, e[a * 2 + 1] = Number.NaN) : (e[a * 2] = r !== 0 ? f - r : f, e[a * 2 + 1] = d), a++;
  }
  const l = Te(t, o), c = ht(t, o);
  return !Number.isFinite(l) || !Number.isFinite(c) ? (e[a * 2] = Number.NaN, e[a * 2 + 1] = Number.NaN) : (e[a * 2] = r !== 0 ? l - r : l, e[a * 2 + 1] = c), a++, a;
}
function hx(e, t, n, i, r) {
  for (let o = 0; o < n; o++) {
    const s = Te(t, o), a = ht(t, o), l = r != null ? r[o] : a, c = i[o], u = o * 4;
    !Number.isFinite(s) || !Number.isFinite(l) || !Number.isFinite(c) ? (e[u] = Number.NaN, e[u + 1] = Number.NaN, e[u + 2] = Number.NaN, e[u + 3] = 0) : (e[u] = s, e[u + 1] = l, e[u + 2] = c, e[u + 3] = 0);
  }
}
function yx(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? ux, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" }
      }
    ]
  }), l = un(e, 96, {
    label: "areaRenderer/vsUniforms"
  }), c = un(e, 16, {
    label: "areaRenderer/fsUniforms"
  }), u = new ArrayBuffer(96), f = new Float32Array(u), d = new Float32Array(4), m = {
    color: {
      operation: "add",
      srcFactor: "src-alpha",
      dstFactor: "one-minus-src-alpha"
    },
    alpha: {
      operation: "add",
      srcFactor: "one",
      dstFactor: "one-minus-src-alpha"
    }
  }, p = vn(
    e,
    {
      label: "areaRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: Vo,
        label: "area.wgsl"
        // No vertex buffers — points come from storage (binding 2).
      },
      fragment: {
        code: Vo,
        label: "area.wgsl",
        formats: i,
        blend: m
      },
      // Instanced triangle-list: 6 verts × (N-1) segments (matches line AA path).
      // Per-segment topology allows dual-endpoint NaN discard without strip fans (#153).
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  ), y = vn(
    e,
    {
      label: "areaRenderer/pipelineStacked",
      bindGroupLayouts: [a],
      vertex: {
        code: $o,
        label: "areaStacked.wgsl"
      },
      fragment: {
        code: $o,
        label: "areaStacked.wgsl",
        formats: i,
        blend: m
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  ), g = o > 1 ? vn(
    e,
    {
      label: "areaRenderer/pipelineDenseSS1",
      bindGroupLayouts: [a],
      vertex: {
        code: Vo,
        label: "area.wgsl"
      },
      fragment: {
        code: Vo,
        label: "area.wgsl",
        formats: i,
        blend: m
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: 1 }
    },
    s
  ) : null, S = o > 1 ? vn(
    e,
    {
      label: "areaRenderer/pipelineStackedDenseSS1",
      bindGroupLayouts: [a],
      vertex: {
        code: $o,
        label: "areaStacked.wgsl"
      },
      fragment: {
        code: $o,
        label: "areaStacked.wgsl",
        formats: i,
        blend: m
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: 1 }
    },
    s
  ) : null;
  let A = null, M = null, h = null, b = 0, v = 0, x = 1, F = 0, I = !1, R = 0, T = 0, N = null, w = 0, P = Number.NaN, B = -1, _ = null, C = null, E = null, U = !1, G = null, O = new Float32Array(0);
  const D = () => {
    if (n) throw new Error("AreaRenderer is disposed.");
  }, k = (Se) => {
    if (Se <= O.length) return;
    const ve = Math.max(8, ku(Se));
    O = new Float32Array(ve);
  }, W = (Se) => {
    const ve = Math.max(4, Se);
    if (A && A.size >= ve) return;
    const xe = Math.max(Math.max(4, ku(ve)), A ? A.size : 0);
    if (A)
      try {
        A.destroy();
      } catch {
      }
    A = e.createBuffer({
      label: "areaRenderer/privatePoints",
      size: xe,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
  }, j = (Se) => {
    h && M === Se || (h = e.createBindGroup({
      layout: a,
      entries: [
        { binding: 0, resource: { buffer: l } },
        { binding: 1, resource: { buffer: c } },
        { binding: 2, resource: { buffer: Se } }
      ]
    }), M = Se);
  };
  let ee = Number.NaN, fe = Number.NaN, X = Number.NaN, z = Number.NaN, $ = Number.NaN, Z = 0, Q = Number.NaN, K = Number.NaN, ne = -1, L = -1, le = Number.NaN, se = Number.NaN, ae = Number.NaN, de = Number.NaN;
  const re = new Uint32Array(u), ie = (Se, ve, xe, Pe, Oe, Xe, Ze, ze, Ue, Ae) => {
    (ee !== Se || fe !== ve || X !== xe || z !== Pe || $ !== Oe || Z !== Xe || Q !== Ze || K !== ze || ne !== Ue || L !== Ae) && (dx(f, Se, ve, xe, Pe), f[16] = Oe, f[17] = Ze, f[18] = ze, re[19] = Xe >>> 0, re[20] = Ue >>> 0, re[21] = Ae >>> 0, re[22] = 0, re[23] = 0, fn(e, l, u), ee = Se, fe = ve, X = xe, z = Pe, $ = Oe, Z = Xe, Q = Ze, K = ze, ne = Ue, L = Ae);
  }, be = (Se, ve) => {
    const xe = cx({
      pointCount: Se,
      plotWidthDevicePx: ve == null ? void 0 : ve.plotWidthDevicePx,
      forceStandard: (ve == null ? void 0 : ve.forceStandardDraw) === !0
    });
    x = xe.stride, v = xe.drawSegmentCount, F = xe.lastPointIndex, I = xe.policy === "denseLod" && o > 1 && g != null;
  }, te = (Se, ve, xe) => {
    if (x <= 1 || ve < 2 || bn(Se) || hn(Se)) return !1;
    if (!(N === Se && w === ve && T === x && P === xe && R >= 2 && A != null)) {
      const Oe = v + 1;
      k(Math.max(Oe, 8) * 2);
      const Xe = px(O, Se, ve, x, xe), Ze = Math.max(4, Xe * 8);
      W(Ze), Xe > 0 && A && e.queue.writeBuffer(A, 0, O.buffer, O.byteOffset, Xe * 8), R = Xe, T = x, N = Se, w = ve, P = xe;
    }
    return !A || R < 2 ? !1 : (j(A), x = 1, F = R - 1, v = R - 1, !0);
  }, Be = (Se, ve, xe, Pe, Oe, Xe, Ze, ze = 0, Ue, Ae) => {
    if (D(), Ue) {
      U = !0;
      const xt = $e(ve), $t = bn(ve) || hn(ve);
      if (_ !== ve || xt !== b || $t || C !== Ue.yBottom || E !== (Ue.yTop ?? null)) {
        k(xt * 4), hx(O, ve, xt, Ue.yBottom, Ue.yTop);
        const St = Math.max(4, xt * 16);
        W(St), xt > 0 && A && e.queue.writeBuffer(A, 0, O.buffer, O.byteOffset, xt * 16), b = xt, _ = ve, C = Ue.yBottom, E = Ue.yTop ?? null;
        const Zt = Se.rawBounds;
        if (Zt)
          G = Zt;
        else {
          let Ge = Number.POSITIVE_INFINITY, Ye = Number.NEGATIVE_INFINITY, rt = Number.POSITIVE_INFINITY, bt = Number.NEGATIVE_INFINITY;
          for (let Dt = 0; Dt < xt; Dt++) {
            const wt = Te(ve, Dt), Yt = Ue.yTop != null ? Ue.yTop[Dt] : ht(ve, Dt), en = Ue.yBottom[Dt];
            if (!Number.isFinite(wt) || !Number.isFinite(Yt) || !Number.isFinite(en)) continue;
            wt < Ge && (Ge = wt), wt > Ye && (Ye = wt);
            const H = Math.min(en, Yt), q = Math.max(en, Yt);
            H < rt && (rt = H), q > bt && (bt = q);
          }
          Number.isFinite(Ge) && Number.isFinite(rt) ? (Ge === Ye && (Ye = Ge + 1), rt === bt && (bt = rt + 1), G = { xMin: Ge, xMax: Ye, yMin: rt, yMax: bt }) : G = null;
        }
      }
      A && j(A), be(b, Ae);
      const { xMin: we, xMax: Ie, yMin: ke, yMax: Ke } = G ?? {
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1
      }, { a: at, b: yt } = xe.kind === "log" ? xn(xe) : di(xe, we, Ie), { a: mt, b: nt } = Pe.kind === "log" ? xn(Pe) : di(Pe, ke, Ke), { logFlags: ct, logBaseX: je, logBaseY: pt } = Zn(xe, Pe);
      ie(at, yt, mt, nt, 0, ct, je, pt, x, F);
    } else if (Xe) {
      if (U = !1, C = null, E = null, typeof Ze != "number" || !Number.isFinite(Ze) || Ze < 0)
        throw new Error(
          "AreaRenderer.prepare(storageBuffer): pointCountOverride must be a finite non-negative number."
        );
      b = Math.floor(Ze), _ = null, be(b, Ae), te(ve, b, ze) || j(Xe);
      const { a: xt, b: $t } = cm(xe, ze), { a: Mt, b: we } = xn(Pe), { logFlags: Ie, logBaseX: ke, logBaseY: Ke } = Zn(xe, Pe), at = Pe.kind === "log" ? Pe.getDomain().min : 0, yt = Pe.kind === "log" ? Number.isFinite(Oe ?? Number.NaN) && Oe > 0 ? Oe : at : Number.isFinite(Oe ?? Number.NaN) ? Oe : at;
      ie(
        xt,
        $t,
        Mt,
        we,
        yt,
        Ie,
        ke,
        Ke,
        x,
        F
      );
    } else {
      U = !1, C = null, E = null;
      const xt = $e(ve), $t = bn(ve) || hn(ve);
      if (b = xt, be(b, Ae), !$t && te(ve, xt, 0)) {
        _ = ve, B = -1;
        const Ge = Se.rawBounds;
        Ge ? G = Ge : G || (G = Rn(ve) ?? null);
      } else {
        if (_ !== ve || B !== xt || R > 0 || $t) {
          k(xt * 2), mx(O, ve, xt);
          const Ge = Math.max(4, xt * 8);
          W(Ge), xt > 0 && A && e.queue.writeBuffer(A, 0, O.buffer, O.byteOffset, xt * 8), _ = ve, B = xt, R = 0, N = null, w = 0, T = 0, G = Se.rawBounds ?? Rn(ve) ?? null;
        }
        A && j(A);
      }
      const { xMin: we, xMax: Ie, yMin: ke, yMax: Ke } = G ?? {
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1
      }, { a: at, b: yt } = xe.kind === "log" ? xn(xe) : di(xe, we, Ie), { a: mt, b: nt } = Pe.kind === "log" ? xn(Pe) : di(Pe, ke, Ke), { logFlags: ct, logBaseX: je, logBaseY: pt } = Zn(xe, Pe), St = Pe.kind === "log" ? Pe.getDomain().min : Number.isFinite(ke) ? ke : 0, Zt = Pe.kind === "log" ? Number.isFinite(Oe ?? Number.NaN) && Oe > 0 ? Oe : St : Number.isFinite(Oe ?? Number.NaN) ? Oe : St;
      ie(at, yt, mt, nt, Zt, ct, je, pt, x, F);
    }
    const [Qe, At, It, Tt] = fx(Se.areaStyle.color), Ot = Du(Se.areaStyle.opacity), Ht = Du(Tt * Ot);
    (le !== Qe || se !== At || ae !== It || de !== Ht) && (d[0] = Qe, d[1] = At, d[2] = It, d[3] = Ht, fn(e, c, d), le = Qe, se = At, ae = It, de = Ht);
  }, Me = () => {
    _ = null, C = null, E = null, G = null, R = 0, N = null, w = 0, T = 0, P = Number.NaN, B = -1;
  }, _e = (Se) => {
    D(), !(!h || b < 2 || v < 1) && (I || (Se.setPipeline(U ? y : p), Se.setBindGroup(0, h), Se.draw(6, v)));
  }, Le = () => (D(), I && h != null && b >= 2 && v >= 1);
  return { prepare: Be, invalidateGeometry: Me, render: _e, isDenseDeferred: Le, renderDense: (Se) => {
    if (D(), !Le() || !h) return;
    const ve = U ? S : g;
    ve && (Se.setPipeline(ve), Se.setBindGroup(0, h), Se.draw(6, v));
  }, dispose: () => {
    if (!n) {
      if (n = !0, _ = null, C = null, E = null, G = null, h = null, M = null, b = 0, v = 0, x = 1, F = 0, I = !1, R = 0, N = null, w = 0, T = 0, P = Number.NaN, B = -1, O = new Float32Array(0), A)
        try {
          A.destroy();
        } catch {
        }
      A = null;
      try {
        l.destroy();
      } catch {
      }
      try {
        c.destroy();
      } catch {
      }
    }
  } };
}
const qo = `// line.wgsl — Screen-space quad expansion with SDF-based anti-aliasing.
//
// Each "instance" draws one line segment (point[i] → point[i+1]).
// 6 vertices per instance (2 triangles = 1 quad per segment).
//
// The vertex shader:
//   1. Reads endpoints from a storage buffer.
//   2. Transforms both to clip space using the mat4x4 transform.
//   3. Converts clip→screen (NDC * canvasSize * 0.5).
//   4. Computes the perpendicular direction in screen space.
//   5. Offsets vertices by ±(halfWidth + AA_PADDING) along the perpendicular.
//   6. Converts back to clip space.
//   7. Outputs \`acrossDevice\` varying for SDF-based AA.
//
// The fragment shader applies smoothstep AA on the distance-from-edge.

const AA_PADDING: f32 = 1.5;

struct VSUniforms {
  transform       : mat4x4<f32>,  // 64 bytes: (log-)data-coord → clip-space
  canvasSize      : vec2<f32>,     //  8 bytes: device pixels (width, height)
  devicePixelRatio: f32,           //  4 bytes
  lineWidthCssPx  : f32,           //  4 bytes: line width in CSS pixels
  // Fixed-capacity ring FIFO (matches decimation.wgsl): physical index of oldest
  // logical point. When ringCapacity == 0, storage is linear chronological.
  ringStart       : u32,           //  4 bytes
  ringCapacity    : u32,           //  4 bytes
  // Log projection (DataStore stays data-space): bit0 = log X, bit1 = log Y.
  // When set, VS applies log_b(v) before the mat4. Non-positive → degenerate gap.
  // Bases are independent so dual-log X/Y can use different bases.
  logBaseX        : f32,           //  4 bytes
  logBaseY        : f32,           //  4 bytes
  logFlags        : u32,           //  4 bytes
  // Dense draw LOD (hairline multi-M / mountain stroke): instance i connects
  // pointAt(i0) → pointAt(i1) with i0 = min(i*lodStride, lastPointIndex).
  // lodStride == 1 → classic consecutive segments.
  lodStride       : u32,           //  4 bytes
  lastPointIndex  : u32,           //  4 bytes
  _pad0           : u32,           //  4 bytes
};
// Total: 112 bytes (aligned to 16).

@group(0) @binding(0) var<uniform> vsUniforms : VSUniforms;

struct FSUniforms {
  color : vec4<f32>,
};

@group(0) @binding(1) var<uniform> fsUniforms : FSUniforms;

@group(0) @binding(2) var<storage, read> points : array<vec2<f32>>;

struct VSOut {
  @builtin(position) clipPosition : vec4<f32>,
  @location(0) acrossDevice       : f32,
  @location(1) @interpolate(flat) widthDevice : f32,
};

// Map chronological (logical) index → physical storage. After maxPoints wrap,
// DataStore keeps modular physical order; drawing must connect logical neighbors
// (same contract as decimation.wgsl rawAt).
fn pointAt(logicalIdx : u32) -> vec2<f32> {
  if (vsUniforms.ringCapacity == 0u) {
    return points[logicalIdx];
  }
  let phys = (vsUniforms.ringStart + logicalIdx) % vsUniforms.ringCapacity;
  return points[phys];
}

// True when log-enabled axes have strictly positive values (required for log).
// Chrome Tint rejects NaN constants (\`0.0/0.0\`, bitcast quiet-NaN), so gaps are
// handled by canLogProject + degenerate verts — never by synthesizing NaN in WGSL.
fn canLogProject(p : vec2<f32>) -> bool {
  let flags = vsUniforms.logFlags;
  if ((flags & 1u) != 0u && p.x <= 0.0) {
    return false;
  }
  if ((flags & 2u) != 0u && p.y <= 0.0) {
    return false;
  }
  return true;
}

// Optional log projection in data space before the clip affine (mat4).
// Flags off → identity. Precondition: canLogProject(p) when flags != 0.
fn projectData(p : vec2<f32>) -> vec2<f32> {
  let flags = vsUniforms.logFlags;
  if (flags == 0u) {
    return p;
  }
  var x = p.x;
  var y = p.y;
  if ((flags & 1u) != 0u) {
    x = log(x) / log(vsUniforms.logBaseX);
  }
  if ((flags & 2u) != 0u) {
    y = log(y) / log(vsUniforms.logBaseY);
  }
  return vec2<f32>(x, y);
}

// Returns UV for the 6 vertices of a quad (2 triangles):
//   uv.x: 0 → endpoint A, 1 → endpoint B
//   uv.y: 0 → +side, 1 → −side
fn quadUv(vid : u32) -> vec2<f32> {
  switch (vid) {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    case 3u: { return vec2<f32>(0.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, 0.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

@vertex
fn vsMain(
  @builtin(vertex_index) vid : u32,
  @builtin(instance_index) iid : u32,
) -> VSOut {
  let uv = quadUv(vid);

  // Dense LOD stride (usually 1 for AA quads; multi-M hairline may stride).
  let stride = max(vsUniforms.lodStride, 1u);
  let last = vsUniforms.lastPointIndex;
  let i0 = min(iid * stride, last);
  let i1 = min(i0 + stride, last);
  // Read segment endpoints in data coordinates (logical order under ring mode).
  let pA_raw = pointAt(i0);
  let pB_raw = pointAt(i1);

  // ── Gap detection ──────────────────────────────────────────────
  // Null entries in the data array are packed as NaN by the CPU.
  // Collapse the quad to a degenerate point so the rasterizer discards it.
  // WGSL has no isnan(); use the IEEE 754 property that NaN != NaN.
  if (pA_raw.x != pA_raw.x || pA_raw.y != pA_raw.y ||
      pB_raw.x != pB_raw.x || pB_raw.y != pB_raw.y ||
      !canLogProject(pA_raw) || !canLogProject(pB_raw)) {
    var out: VSOut;
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    out.acrossDevice = 0.0;
    out.widthDevice = 0.0;
    return out;
  }

  // Log axes: project data → log space, then affine (mat4) is in transformed space.
  let pA_data = projectData(pA_raw);
  let pB_data = projectData(pB_raw);

  // Transform to clip space.
  let clipA = vsUniforms.transform * vec4<f32>(pA_data, 0.0, 1.0);
  let clipB = vsUniforms.transform * vec4<f32>(pB_data, 0.0, 1.0);

  // Convert clip → screen (device pixels). 
  // screen = (ndc * 0.5 + 0.5) * canvasSize, but Y is flipped.
  let ndcA = clipA.xy / clipA.w;
  let ndcB = clipB.xy / clipB.w;
  let screenA = vec2<f32>(
    (ndcA.x * 0.5 + 0.5) * vsUniforms.canvasSize.x,
    (1.0 - (ndcA.y * 0.5 + 0.5)) * vsUniforms.canvasSize.y,
  );
  let screenB = vec2<f32>(
    (ndcB.x * 0.5 + 0.5) * vsUniforms.canvasSize.x,
    (1.0 - (ndcB.y * 0.5 + 0.5)) * vsUniforms.canvasSize.y,
  );

  // Segment direction and perpendicular in screen space.
  let delta = screenB - screenA;
  let segLen = length(delta);

  // Degenerate segment: collapse quad to a degenerate triangle.
  if (segLen < 1e-6) {
    var out : VSOut;
    out.clipPosition = clipA;
    out.acrossDevice = 0.0;
    out.widthDevice = 0.0;
    return out;
  }

  let dir = delta / segLen;
  // Perpendicular: rotate 90° CW → (dy, -dx).
  let perp = vec2<f32>(dir.y, -dir.x);

  // Compute line width in device pixels + AA padding.
  let dpr = max(vsUniforms.devicePixelRatio, 1e-6);
  let widthDevice = max(1.0, vsUniforms.lineWidthCssPx * dpr);
  let halfExtent = widthDevice * 0.5 + AA_PADDING;

  // Select endpoint: uv.x=0 → A, uv.x=1 → B.
  let baseScreen = mix(screenA, screenB, uv.x);

  // Offset perpendicular: uv.y selects +side (0) vs −side (1).
  let side = mix(1.0, -1.0, uv.y);
  let screenPos = baseScreen + perp * halfExtent * side;

  // acrossDevice: 0 at −side edge, widthDevice at +side edge.
  // Map from [−halfExtent, +halfExtent] to [0, widthDevice + 2*AA_PADDING].
  let totalExtent = 2.0 * halfExtent;
  let acrossDevice = (side * halfExtent + halfExtent) / totalExtent * totalExtent;
  // Simplified: acrossDevice = halfExtent * (1 + side) = halfExtent + halfExtent * side
  // But for the fragment shader we want [0, totalExtent]:
  // Let's define it properly:
  // At side=+1: screenPos is at +halfExtent from center → acrossDevice = totalExtent
  // At side=-1: screenPos is at -halfExtent from center → acrossDevice = 0
  let acrossDeviceVal = halfExtent * (1.0 + side);

  // Convert screen → clip.
  let clipX = (screenPos.x / vsUniforms.canvasSize.x) * 2.0 - 1.0;
  let clipY = 1.0 - (screenPos.y / vsUniforms.canvasSize.y) * 2.0;

  var out : VSOut;
  out.clipPosition = vec4<f32>(clipX, clipY, 0.0, 1.0);
  out.acrossDevice = acrossDeviceVal;
  out.widthDevice = widthDevice;
  return out;
}

@fragment
fn fsMain(in : VSOut) -> @location(0) vec4<f32> {
  let totalExtent = in.widthDevice + 2.0 * AA_PADDING;
  let edgeDist = min(in.acrossDevice, totalExtent - in.acrossDevice);

  // Smooth step from 0 to AA zone for anti-aliased edges.
  let aa = max(fwidth(in.acrossDevice), 1e-3) * 1.25;
  let edgeCoverage = smoothstep(0.0, aa, edgeDist);

  // Also fade out in the AA_PADDING region (beyond the nominal half-width).
  // The padding zone is [0, AA_PADDING] at each edge.
  // Distance from the nominal edge = edgeDist - AA_PADDING (negative means inside).
  // Actually, remap: the nominal line occupies [AA_PADDING, AA_PADDING + widthDevice].
  let nominalDist = min(in.acrossDevice - AA_PADDING, (AA_PADDING + in.widthDevice) - in.acrossDevice);
  let paddingCoverage = smoothstep(0.0, aa, nominalDist);

  // Combine: paddingCoverage handles the SDF fade, edgeCoverage handles the outer trim.
  // For thin lines (< 1 device px), paddingCoverage alone provides the desired fade.
  let coverage = min(edgeCoverage, paddingCoverage);

  var color = fsUniforms.color;
  color = vec4<f32>(color.rgb, color.a * coverage);
  return color;
}

// ── Dense hairline path (group 3 @ ≥DENSE_HAIRLINE_POINT_THRESHOLD) ─────────
// WebGPU line-list: 2 vertices per instance, native 1 device-px stroke.
// Avoids AA-quad expansion (6 verts + SDF fill) that cliffs ~50k under 4× MSAA.
// Used only when resolveLineDrawPolicy returns denseHairline; does not change data/sampling.

@vertex
fn vsMainHairline(
  @builtin(vertex_index) vid : u32,
  @builtin(instance_index) iid : u32,
) -> VSOut {
  // Dual-endpoint gap check (matches AA path): if either endpoint is NaN, collapse
  // the whole segment so one-sided nulls cannot draw a spur to clip origin.
  // Modular ring remap matches vsMain / decimation so wrap does not draw physical
  // newest→oldest edges.
  // Dense LOD: multi-M mountain/unsorted stroke caps instances toward pixel budget.
  let stride = max(vsUniforms.lodStride, 1u);
  let last = vsUniforms.lastPointIndex;
  let i0 = min(iid * stride, last);
  let i1 = min(i0 + stride, last);
  let pA_raw = pointAt(i0);
  let pB_raw = pointAt(i1);
  if (pA_raw.x != pA_raw.x || pA_raw.y != pA_raw.y || pB_raw.x != pB_raw.x || pB_raw.y != pB_raw.y ||
      !canLogProject(pA_raw) || !canLogProject(pB_raw)) {
    var out: VSOut;
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    out.acrossDevice = 0.0;
    out.widthDevice = 0.0;
    return out;
  }
  let pA = projectData(pA_raw);
  let pB = projectData(pB_raw);

  // vid is 0 or 1 for line-list topology.
  let p = select(pA, pB, vid != 0u);
  let clip = vsUniforms.transform * vec4<f32>(p, 0.0, 1.0);
  var out: VSOut;
  out.clipPosition = clip;
  // Solid coverage for fsMainHairline (varyings unused except color path).
  out.acrossDevice = 1.0;
  out.widthDevice = 1.0;
  return out;
}

@fragment
fn fsMainHairline(_in : VSOut) -> @location(0) vec4<f32> {
  return fsUniforms.color;
}
`, gx = 25e3, xx = 5e5, bx = 1;
function vx(e) {
  const t = Number.isFinite(e.lineWidthCssPx) && e.lineWidthCssPx > 0 ? e.lineWidthCssPx : 2, n = Number.isFinite(e.pointCount) && e.pointCount > 0 ? Math.floor(e.pointCount) : 0, i = Number.isFinite(e.lineSeriesCount) && e.lineSeriesCount > 0 ? Math.floor(e.lineSeriesCount) : 1;
  if (e.forceStandard === !0)
    return { policy: "standard", effectiveLineWidthCssPx: t };
  if ((Number.isFinite(e.msaaSampleCount) && e.msaaSampleCount > 0 ? Math.floor(e.msaaSampleCount) : 4) <= 1)
    return { policy: "standard", effectiveLineWidthCssPx: t };
  const o = n >= gx, s = Math.max(0, n - 1), a = i * s, l = i >= 2 && a >= xx;
  return !o && !l ? { policy: "standard", effectiveLineWidthCssPx: t } : {
    policy: "denseHairline",
    effectiveLineWidthCssPx: Math.min(t, bx)
  };
}
const wx = "bgra8unorm", Nx = 2, Eu = (e) => Math.min(1, Math.max(0, e)), Mx = (e) => wn(e) ?? [0, 0, 0, 1], Sx = (e, t, n, i, r) => {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
}, Lu = /* @__PURE__ */ new WeakMap();
function Cx(e) {
  let t = Lu.get(e);
  return t || (t = e.createBindGroupLayout({
    label: "lineRenderer/bindGroupLayout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" }
      }
    ]
  }), Lu.set(e, t), t);
}
function Rl(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? wx, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = Cx(e), l = un(e, 112, {
    label: "lineRenderer/vsUniforms"
  }), c = un(e, 16, {
    label: "lineRenderer/fsUniforms"
  }), u = new ArrayBuffer(112), f = new Float32Array(u), d = new Uint32Array(u), m = new Float32Array(4);
  let p = null, y = null, g = Number.NaN, S = Number.NaN, A = Number.NaN, M = Number.NaN, h = null, b = Number.NaN, v = Number.NaN, x = Number.NaN, F = Number.NaN, I = Number.NaN, R = Number.NaN, T = Number.NaN, N = Number.NaN, w = Number.NaN, P = Number.NaN, B = Number.NaN, _ = Number.NaN, C = 0, E = 0, U = 0, G = Number.NaN, O = Number.NaN, D = -1, k = -1, W = l;
  const j = {
    color: {
      operation: "add",
      srcFactor: "src-alpha",
      dstFactor: "one-minus-src-alpha"
    },
    alpha: {
      operation: "add",
      srcFactor: "one",
      dstFactor: "one-minus-src-alpha"
    }
  }, ee = vn(
    e,
    {
      label: "lineRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: qo,
        label: "line.wgsl",
        buffers: []
        // No vertex buffers — points are read from storage buffer.
      },
      fragment: {
        code: qo,
        label: "line.wgsl",
        formats: i,
        // Enable standard alpha blending so per-series `lineStyle.opacity` and AA transparency work.
        blend: j
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  ), fe = vn(
    e,
    {
      label: "lineRenderer/hairlinePipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: qo,
        label: "line.wgsl",
        entryPoint: "vsMainHairline",
        buffers: []
      },
      fragment: {
        code: qo,
        label: "line.wgsl",
        entryPoint: "fsMainHairline",
        formats: i,
        blend: j
      },
      primitive: { topology: "line-list", cullMode: "none" },
      multisample: { count: 1 }
    },
    s
  );
  let X = 0, z = "standard", $ = 0, Z = 1, Q = 0, K = null, ne = new Float32Array(0), L = 0, le = 0, se = null, ae = 0, de = Number.NaN;
  const re = () => {
    if (n) throw new Error("LineRenderer is disposed.");
  }, ie = (xe) => {
    if (xe <= ne.length) return;
    let Pe = 8;
    for (; Pe < xe; ) Pe *= 2;
    ne = new Float32Array(Pe);
  }, be = (xe) => {
    const Pe = Math.max(4, xe);
    if (K && K.size >= Pe) return;
    if (K)
      try {
        K.destroy();
      } catch {
      }
    let Oe = 256;
    for (; Oe < Pe; ) Oe *= 2;
    K = e.createBuffer({
      label: "lineRenderer/lodCompactPoints",
      size: Oe,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
  }, te = (xe, Pe, Oe, Xe, Ze) => {
    if (Xe <= 1 || Oe < 2 || xe == null || bn(xe) || hn(xe)) return Pe;
    if (!(se === xe && ae === Oe && le === Xe && de === Ze && L >= 2 && K != null)) {
      const Ue = Oe - 1, Ae = Math.ceil(Ue / Xe) + 1;
      ie(Ae * 2);
      let Qe = 0;
      for (let Tt = 0; Tt < Ue; Tt += Xe) {
        const Ot = Te(xe, Tt), Ht = ht(xe, Tt);
        !Number.isFinite(Ot) || !Number.isFinite(Ht) ? (ne[Qe * 2] = Number.NaN, ne[Qe * 2 + 1] = Number.NaN) : (ne[Qe * 2] = Ze !== 0 ? Ot - Ze : Ot, ne[Qe * 2 + 1] = Ht), Qe++;
      }
      const At = Te(xe, Ue), It = ht(xe, Ue);
      !Number.isFinite(At) || !Number.isFinite(It) ? (ne[Qe * 2] = Number.NaN, ne[Qe * 2 + 1] = Number.NaN) : (ne[Qe * 2] = Ze !== 0 ? At - Ze : At, ne[Qe * 2 + 1] = It), Qe++, be(Qe * 8), K && Qe > 0 && e.queue.writeBuffer(K, 0, ne.buffer, ne.byteOffset, Qe * 8), L = Qe, le = Xe, se = xe, ae = Oe, de = Ze;
    }
    return !K || L < 2 ? Pe : (Z = 1, Q = L - 1, $ = L - 1, K);
  }, Be = (xe, Pe, Oe, Xe, Ze = 0, ze = 1, Ue = 1, Ae = 1, Qe, At, It, Tt, Ot, Ht) => {
    re(), X = typeof Qe == "number" && Number.isFinite(Qe) && Qe >= 0 ? Math.floor(Qe) : $e(xe.data);
    const { a: xt, b: $t } = cm(Oe, Ze), { a: Mt, b: we } = xn(Xe), { logFlags: Ie, logBaseX: ke, logBaseY: Ke } = Zn(Oe, Xe);
    Sx(f, xt, $t, Mt, we);
    const at = Number.isFinite(ze) && ze > 0 ? ze : 1, yt = Number.isFinite(Ue) && Ue > 0 ? Ue : 1, mt = Number.isFinite(Ae) && Ae > 0 ? Ae : 1, nt = Number.isFinite(xe.lineStyle.width) && xe.lineStyle.width > 0 ? xe.lineStyle.width : Nx, ct = typeof Ht == "number" && Number.isFinite(Ht) && Ht > 0 ? Math.floor(Ht) : 0, je = ct >= um ? Math.max(X, ct) : X, pt = vx({
      pointCount: je,
      lineWidthCssPx: nt,
      lineSeriesCount: At,
      msaaSampleCount: o,
      forceStandard: Tt === !0
    });
    z = pt.policy;
    const St = pt.effectiveLineWidthCssPx, Zt = Number.isFinite(Ot) && Ot > 0 ? Math.floor(Ot) : yt, Ge = fm({
      pointCount: X,
      plotWidthDevicePx: Zt,
      // Only stride when already on the dense hairline path (or forceStandard).
      forceStandard: Tt === !0 || pt.policy !== "denseHairline"
    });
    Z = Ge.stride, $ = Ge.drawSegmentCount, Q = Ge.lastPointIndex;
    let Ye = It && Number.isFinite(It.capacity) && It.capacity > 0 ? Math.floor(It.capacity) : 0, rt = Ye > 0 && It && Number.isFinite(It.start) && It.start >= 0 ? Math.floor(It.start) : 0, bt = Pe;
    pt.policy === "denseHairline" && Ge.stride > 1 && Ye === 0 && (bt = te(
      xe.data,
      Pe,
      X,
      Ge.stride,
      Ze
    ), bt !== Pe && (Ye = 0, rt = 0)), f[16] = yt, f[17] = mt, f[18] = at, f[19] = St, d[20] = rt >>> 0, d[21] = Ye >>> 0, f[22] = ke, f[23] = Ke, d[24] = Ie >>> 0, d[25] = Z >>> 0, d[26] = Q >>> 0, d[27] = 0;
    let Dt = l;
    (I !== xt || R !== $t || T !== Mt || N !== we || w !== yt || P !== mt || B !== at || _ !== St || C !== rt || E !== Ye || U !== Ie || G !== ke || O !== Ke || D !== Z || k !== Q) && (fn(e, l, u), I = xt, R = $t, T = Mt, N = we, w = yt, P = mt, B = at, _ = St, C = rt, E = Ye, U = Ie, G = ke, O = Ke, D = Z, k = Q);
    const wt = xe.color, Yt = Eu(xe.lineStyle.opacity);
    if (h !== wt) {
      const [he, Fe, et, pe] = Mx(wt);
      b = he, v = Fe, x = et, F = pe, h = wt;
    }
    const en = b, H = v, q = x, ue = Eu(F * Yt);
    (g !== en || S !== H || A !== q || M !== ue) && (m[0] = en, m[1] = H, m[2] = q, m[3] = ue, fn(e, c, m), g = en, S = H, A = q, M = ue), (p === null || y !== bt || W !== Dt) && (p = e.createBindGroup({
      layout: a,
      entries: [
        { binding: 0, resource: { buffer: Dt } },
        { binding: 1, resource: { buffer: c } },
        { binding: 2, resource: { buffer: bt } }
      ]
    }), y = bt, W = Dt);
  }, Me = () => z === "denseHairline";
  return { prepare: Be, invalidateGeometry: () => {
    L = 0, se = null, ae = 0, le = 0, de = Number.NaN;
  }, render: (xe) => {
    re(), !(!p || X < 2 || $ < 1) && (Me() || (xe.setPipeline(ee), xe.setBindGroup(0, p), xe.draw(6, $)));
  }, isDenseHairline: () => (re(), Me() && X >= 2 && p != null), renderHairline: (xe, Pe) => {
    re(), !(!Me() || !p || X < 2 || $ < 1) && (Pe != null && Pe.skipSetPipeline || xe.setPipeline(fe), xe.setBindGroup(0, p), xe.draw(2, $));
  }, bindHairlinePipeline: (xe) => {
    re(), xe.setPipeline(fe);
  }, dispose: () => {
    if (!n) {
      if (n = !0, p = null, y = null, X = 0, $ = 0, Z = 1, Q = 0, z = "standard", L = 0, se = null, ae = 0, le = 0, de = Number.NaN, ne = new Float32Array(0), K)
        try {
          K.destroy();
        } catch {
        }
      K = null;
      try {
        l.destroy();
      } catch {
      }
      try {
        c.destroy();
      } catch {
      }
    }
  } };
}
const Sr = `// scatter.wgsl
// Instanced anti-aliased circle shader (SDF):
// - Variable-radius path (vsMain): per-instance center (vec2) + radiusPx.
// - Const-radius dual-buffer (vsMainConstRadiusSplit, production Option A):
//   separate float32 x and y instance buffers (shaderLocation 0/1); radius from
//   VSUniforms.radiusPx. Enables equal-N y-only upload of N×4 y bytes only.
// - Legacy interleaved const-radius entry (vsMainConstRadius): float32x2 centers
//   in one buffer — kept for shader completeness; renderer uses split path.
// - Draw call: draw(6, instanceCount) using triangle-list expansion in VS
// - Uniforms:
//   - @group(0) @binding(0): VSUniforms { transform, viewportPx, radiusPx }
//   - @group(0) @binding(1): FSUniforms { color }
//
// Notes:
// - \`viewportPx\` is the current render target size in pixels (width, height).
// - The quad is expanded in clip space using \`radiusPx\` and \`viewportPx\`.

struct VSUniforms {
  transform: mat4x4<f32>,
  viewportPx: vec2<f32>,
  // Constant-radius path: used by vsMainConstRadius. Per-instance path ignores this.
  radiusPx: f32,
  // Independent bases so dual-log X/Y project correctly.
  logBaseX: f32,
  logBaseY: f32,
  // bit0 = log X, bit1 = log Y. Pad to 16-byte trailing alignment.
  logFlags: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct FSUniforms {
  color: vec4<f32>,
};

@group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;

struct VSIn {
  @location(0) center: vec2<f32>,
  @location(1) radiusPx: f32,
};

struct VSInCenterOnly {
  @location(0) center: vec2<f32>,
};

// Dual-buffer const-radius: x and y in separate instance buffers so equal-N
// y-only rewrites upload only the y channel (N×4 bytes).
struct VSInXYSplit {
  @location(0) x: f32,
  @location(1) y: f32,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) localPx: vec2<f32>,
  @location(1) radiusPx: f32,
};

// Chrome Tint rejects NaN constants — use explicit positive checks instead.
fn canLogProject(p: vec2<f32>) -> bool {
  let flags = vsUniforms.logFlags;
  if ((flags & 1u) != 0u && p.x <= 0.0) {
    return false;
  }
  if ((flags & 2u) != 0u && p.y <= 0.0) {
    return false;
  }
  return true;
}

fn projectData(p: vec2<f32>) -> vec2<f32> {
  let flags = vsUniforms.logFlags;
  if (flags == 0u) {
    return p;
  }
  var x = p.x;
  var y = p.y;
  if ((flags & 1u) != 0u) {
    x = log(x) / log(vsUniforms.logBaseX);
  }
  if ((flags & 2u) != 0u) {
    y = log(y) / log(vsUniforms.logBaseY);
  }
  return vec2<f32>(x, y);
}

fn expandCircle(center: vec2<f32>, radiusPx: f32, vertexIndex: u32) -> VSOut {
  // Fixed local corners for 2 triangles (triangle-list).
  // \`localNdc\` is a quad in [-1, 1]^2; we convert it to pixel offsets via radiusPx.
  let localNdc = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0)
  );

  let corner = localNdc[vertexIndex];
  let localPx = corner * radiusPx;

  // Convert pixel offset to clip-space offset.
  // Clip space spans [-1, 1] across the viewport, so px -> clip is (2 / viewportPx).
  let localClip = localPx * (2.0 / vsUniforms.viewportPx);

  // Non-positive on log axis: collapse marker (omit).
  if (!canLogProject(center)) {
    var out: VSOut;
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    out.localPx = vec2<f32>(0.0, 0.0);
    out.radiusPx = 0.0;
    return out;
  }
  let projected = projectData(center);

  let centerClip = (vsUniforms.transform * vec4<f32>(projected, 0.0, 1.0)).xy;

  var out: VSOut;
  out.clipPosition = vec4<f32>(centerClip + localClip, 0.0, 1.0);
  out.localPx = localPx;
  out.radiusPx = radiusPx;
  return out;
}

@vertex
fn vsMain(in: VSIn, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  return expandCircle(in.center, in.radiusPx, vertexIndex);
}

@vertex
fn vsMainConstRadius(in: VSInCenterOnly, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  return expandCircle(in.center, vsUniforms.radiusPx, vertexIndex);
}

@vertex
fn vsMainConstRadiusSplit(in: VSInXYSplit, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  return expandCircle(vec2<f32>(in.x, in.y), vsUniforms.radiusPx, vertexIndex);
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  // Signed distance to the circle boundary (negative inside).
  let dist = length(in.localPx) - in.radiusPx;

  // Analytic-ish AA: smooth edge based on derivative of dist in screen space.
  let w = fwidth(dist);
  let a = 1.0 - smoothstep(0.0, w, dist);

  // Discard fully outside to avoid unnecessary blending work.
  if (a <= 0.0) {
    discard;
  }

  return vec4<f32>(fsUniforms.color.rgb, fsUniforms.color.a * a);
}
`, Ka = 0.08, Fx = 0.3, Ax = 25e4, Ix = 1;
function Px(e) {
  const t = Number.isFinite(e.radiusDevicePx) && e.radiusDevicePx > 0 ? e.radiusDevicePx : 0;
  if (e.pointCount <= 0 || t <= 0)
    return { policy: "standard", effectiveRadiusDevicePx: t, fullyCompact: !1 };
  if (e.forceStandard === !0)
    return { policy: "standard", effectiveRadiusDevicePx: t, fullyCompact: !1 };
  const n = Math.max(1, e.plotWidthDevicePx | 0), i = Math.max(1, e.plotHeightDevicePx | 0), r = e.pointCount / (n * i), o = Math.min(t, Ix);
  if (e.pointCount >= Ax)
    return { policy: "denseCompact", effectiveRadiusDevicePx: o, fullyCompact: !0 };
  if (r < Ka)
    return { policy: "standard", effectiveRadiusDevicePx: t, fullyCompact: !1 };
  const s = Math.max(1e-6, Fx - Ka), a = Math.min(1, Math.max(0, (r - Ka) / s)), l = t * (1 - a) + o * a, c = a >= 1;
  return {
    policy: a > 0.05 ? "denseCompact" : "standard",
    effectiveRadiusDevicePx: l,
    fullyCompact: c
  };
}
const Tx = "bgra8unorm", jo = 4, bs = 16, Ja = bs / 4, Si = 4, Bx = (e) => Math.min(1, Math.max(0, e)), Zo = (e, t, n) => Math.min(n, Math.max(t, e | 0)), Rx = (e) => wn(e) ?? [0, 0, 0, 1], Cr = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, Dx = (e, t, n, i, r) => {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
}, kx = (e) => {
  const { canvasWidth: t, canvasHeight: n, devicePixelRatio: i } = e, r = e.left * i, o = t - e.right * i, s = e.top * i, a = n - e.bottom * i, l = Zo(Math.floor(r), 0, Math.max(0, t)), c = Zo(Math.floor(s), 0, Math.max(0, n)), u = Zo(Math.ceil(o), 0, Math.max(0, t)), f = Zo(Math.ceil(a), 0, Math.max(0, n)), d = Math.max(0, u - l), m = Math.max(0, f - c);
  return { x: l, y: c, w: d, h: m };
};
function Ex(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Tx, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, 96, {
    label: "scatterRenderer/vsUniforms"
  }), c = un(e, 16, {
    label: "scatterRenderer/fsUniforms"
  }), u = new ArrayBuffer(96), f = new Float32Array(u), d = new Uint32Array(u), m = new Float32Array(4), p = e.createBindGroup({
    layout: a,
    entries: [
      { binding: 0, resource: { buffer: l } },
      { binding: 1, resource: { buffer: c } }
    ]
  }), y = {
    color: {
      operation: "add",
      srcFactor: "src-alpha",
      dstFactor: "one-minus-src-alpha"
    },
    alpha: {
      operation: "add",
      srcFactor: "one",
      dstFactor: "one-minus-src-alpha"
    }
  }, g = vn(
    e,
    {
      label: "scatterRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: Sr,
        label: "scatter.wgsl",
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: bs,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32x2", offset: 0 },
              { shaderLocation: 1, format: "float32", offset: 8 }
            ]
          }
        ]
      },
      fragment: {
        code: Sr,
        label: "scatter.wgsl",
        formats: i,
        blend: y
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  ), S = vn(
    e,
    {
      label: "scatterRenderer/pipelineConstRadiusSplit",
      bindGroupLayouts: [a],
      vertex: {
        code: Sr,
        label: "scatter.wgsl",
        entryPoint: "vsMainConstRadiusSplit",
        buffers: [
          {
            arrayStride: Si,
            stepMode: "instance",
            attributes: [{ shaderLocation: 0, format: "float32", offset: 0 }]
          },
          {
            arrayStride: Si,
            stepMode: "instance",
            attributes: [{ shaderLocation: 1, format: "float32", offset: 0 }]
          }
        ]
      },
      fragment: {
        code: Sr,
        label: "scatter.wgsl",
        formats: i,
        blend: y
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  ), A = o > 1 ? vn(
    e,
    {
      label: "scatterRenderer/pipelineConstRadiusDenseSS1",
      bindGroupLayouts: [a],
      vertex: {
        code: Sr,
        label: "scatter.wgsl",
        entryPoint: "vsMainConstRadiusSplit",
        buffers: [
          {
            arrayStride: Si,
            stepMode: "instance",
            attributes: [{ shaderLocation: 0, format: "float32", offset: 0 }]
          },
          {
            arrayStride: Si,
            stepMode: "instance",
            attributes: [{ shaderLocation: 1, format: "float32", offset: 0 }]
          }
        ]
      },
      fragment: {
        code: Sr,
        label: "scatter.wgsl",
        formats: i,
        blend: y
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: 1 }
    },
    s
  ) : null;
  let M = null, h = null, b = null, v = 0, x = !1, F = 0, I = !1, R = new ArrayBuffer(0), T = new Float32Array(R), N = new ArrayBuffer(0), w = new Float32Array(N), P = new ArrayBuffer(0), B = new Float32Array(P), _ = null, C = null, E = null, U = Number.NaN, G = 0, O = 0, D = 0, k = [1, 1], W = null;
  const j = () => {
    if (n) throw new Error("ScatterRenderer is disposed.");
  }, ee = (se) => {
    if (se <= T.length) return;
    const ae = Math.max(8, Cr(se));
    R = new ArrayBuffer(ae * 4), T = new Float32Array(R);
  }, fe = (se) => {
    if (se > w.length) {
      const ae = Math.max(8, Cr(se));
      N = new ArrayBuffer(ae * 4), w = new Float32Array(N);
    }
    if (se > B.length) {
      const ae = Math.max(8, Cr(se));
      P = new ArrayBuffer(ae * 4), B = new Float32Array(P);
    }
  }, X = (se) => {
    const ae = Math.max(Math.max(4, Cr(se)), h ? h.size : 0);
    if (!h || h.size < se) {
      if (h)
        try {
          h.destroy();
        } catch {
        }
      h = e.createBuffer({
        label: "scatterRenderer/xInstanceBuffer",
        size: ae,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    if (!b || b.size < se) {
      const de = Math.max(Math.max(4, Cr(se)), b ? b.size : 0);
      if (b)
        try {
          b.destroy();
        } catch {
        }
      b = e.createBuffer({
        label: "scatterRenderer/yInstanceBuffer",
        size: de,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
  }, z = (se, ae, de, re, ie, be, te, Be, Me, _e) => {
    const Le = Number.isFinite(ie) && ie > 0 ? ie : 1, ge = Number.isFinite(be) && be > 0 ? be : 1;
    Dx(f, se, ae, de, re), f[16] = Le, f[17] = ge, f[18] = te, f[19] = Me, f[20] = _e, d[21] = Be >>> 0, d[22] = 0, d[23] = 0, fn(e, l, u), k = [Le, ge];
  }, $ = (se, ae, de, re, ie, be, te) => {
    j();
    const { a: Be, b: Me } = xn(de), { a: _e, b: Le } = xn(re), { logFlags: ge, logBaseX: Ee, logBaseY: Se } = Zn(de, re), ve = (ie == null ? void 0 : ie.devicePixelRatio) ?? 1, xe = ve > 0 && Number.isFinite(ve), Pe = se.symbolSize, Oe = [0, 0, void 0], Xe = typeof Pe == "number" && Number.isFinite(Pe) ? Pe : typeof Pe == "function" ? null : jo, Ze = typeof Pe == "function" ? (Ke, at, yt) => {
      Oe[0] = Ke, Oe[1] = at, Oe[2] = yt;
      const mt = Pe(Oe);
      return typeof mt == "number" && Number.isFinite(mt) ? mt : jo;
    } : Xe != null ? (Ke, at, yt) => Xe : (Ke, at, yt) => jo, ze = $e(ae), Ue = Xe != null ? xe ? Xe * ve : Xe : null, Ae = Ue != null && Ue > 0 && !Bp(ae);
    x = Ae, F = Ae ? Ue : 0;
    const Qe = (ie == null ? void 0 : ie.canvasWidth) ?? k[0], At = (ie == null ? void 0 : ie.canvasHeight) ?? k[1];
    ie ? (O = ie.canvasWidth, D = ie.canvasHeight, W = kx(ie)) : W = null;
    let It = F;
    if (I = !1, Ae && F > 0) {
      const Ke = (W == null ? void 0 : W.w) ?? Qe, at = (W == null ? void 0 : W.h) ?? At, yt = Px({
        pointCount: ze,
        plotWidthDevicePx: Ke,
        plotHeightDevicePx: at,
        radiusDevicePx: F,
        forceStandard: be === !0
      });
      It = yt.effectiveRadiusDevicePx, I = yt.fullyCompact && o > 1 && te !== !1;
    }
    z(Be, Me, _e, Le, Qe, At, It, ge, Ee, Se);
    const [Tt, Ot, Ht, xt] = Rx(se.color);
    m[0] = Tt, m[1] = Ot, m[2] = Ht, m[3] = Bx(xt), fn(e, c, m);
    const $t = Ae ? "const" : "variable", Mt = Ae ? h != null && b != null : M != null, we = _ === ae && C === $t && Mt && (Ae ? E === Xe : U === ve), Ie = Ae && C === "const" && Mt && G > 0 && ze === G && ze === v && yh(ae, w, G), ke = Vr({
      residency: {
        kind: "privateInstance",
        gpuBuffer: Ae ? b : M,
        pointCount: v,
        contentVersion: 0,
        lastRef: _
      },
      dataRef: ae,
      geometryCacheHit: we,
      appendedThisFrame: !1,
      needsGrowth: !1,
      yOnlyRewrite: Ie
    });
    if (ke !== "skip") {
      if (ke === "yOnlyRewrite" && Ae) {
        fe(ze);
        const Ke = xh(B, ae, ze);
        if (Ke !== null) {
          Ke && b && ze > 0 && e.queue.writeBuffer(b, 0, P, 0, ze * Si), _ = ae, C = $t, E = Xe, U = ve, G = ze;
          return;
        }
      }
      if (Ae) {
        fe(ze);
        const Ke = w, at = B;
        let yt = !0;
        if (Array.isArray(ae)) {
          const nt = ae;
          for (let ct = 0; ct < ze; ct++) {
            const je = nt[ct];
            if (je == null || typeof je != "object") {
              yt = !1;
              break;
            }
            let pt, St;
            if (Array.isArray(je) ? (pt = je[0], St = je[1]) : (pt = je.x, St = je.y), !Number.isFinite(pt) || !Number.isFinite(St)) {
              yt = !1;
              break;
            }
            Ke[ct] = pt, at[ct] = St;
          }
        } else if (ae instanceof Float32Array) {
          Math.floor(ae.length / 2) !== ze && (yt = !1);
          for (let ct = 0; ct < ze && yt; ct++) {
            const je = ae[ct * 2], pt = ae[ct * 2 + 1];
            if (!Number.isFinite(je) || !Number.isFinite(pt)) {
              yt = !1;
              break;
            }
            Ke[ct] = je, at[ct] = pt;
          }
        } else if (
          // Split XY columns. Float32Array channels can zero-copy
          // writeBuffer when every value is finite (scanned once; non-finite
          // falls through to the pack path below). Exclude internal ring /
          // staging aliases (modular getX/getY).
          typeof ae == "object" && ae !== null && !Array.isArray(ae) && "x" in ae && "y" in ae && !ae.__ring && !ae.__stagingRing
        ) {
          const nt = ae.x, ct = ae.y;
          if (nt instanceof Float32Array && ct instanceof Float32Array && nt.length >= ze && ct.length >= ze) {
            let je = !0;
            for (let pt = 0; pt < ze; pt++)
              if (!Number.isFinite(nt[pt]) || !Number.isFinite(ct[pt])) {
                je = !1;
                break;
              }
            if (je) {
              fe(ze), w.set(nt.subarray(0, ze)), B.set(ct.subarray(0, ze)), v = ze, G = ze;
              const pt = Math.max(4, ze * Si);
              if (X(pt), h && b && ze > 0) {
                const St = ze * Si;
                e.queue.writeBuffer(h, 0, nt.buffer, nt.byteOffset, St), e.queue.writeBuffer(b, 0, ct.buffer, ct.byteOffset, St);
              }
              _ = ae, C = $t, E = Xe, U = ve;
              return;
            }
          }
          for (let je = 0; je < ze; je++) {
            const pt = nt[je], St = ct[je];
            if (!Number.isFinite(pt) || !Number.isFinite(St)) {
              yt = !1;
              break;
            }
            Ke[je] = pt, at[je] = St;
          }
        } else
          for (let nt = 0; nt < ze; nt++) {
            const ct = Te(ae, nt), je = ht(ae, nt);
            if (!Number.isFinite(ct) || !Number.isFinite(je)) {
              yt = !1;
              break;
            }
            Ke[nt] = ct, at[nt] = je;
          }
        if (yt)
          v = ze, G = ze;
        else {
          let nt = 0;
          for (let ct = 0; ct < ze; ct++) {
            const je = Te(ae, ct), pt = ht(ae, ct);
            !Number.isFinite(je) || !Number.isFinite(pt) || (Ke[nt] = je, at[nt] = pt, nt++);
          }
          v = nt, G = 0;
        }
        const mt = Math.max(4, v * Si);
        if (X(mt), h && b && v > 0) {
          const nt = v * Si;
          e.queue.writeBuffer(h, 0, N, 0, nt), e.queue.writeBuffer(b, 0, P, 0, nt);
        }
      } else {
        ee(ze * Ja);
        const Ke = T;
        let at = 0;
        for (let mt = 0; mt < ze; mt++) {
          const nt = Te(ae, mt), ct = ht(ae, mt);
          if (!Number.isFinite(nt) || !Number.isFinite(ct)) continue;
          const je = Sn(ae, mt), pt = je ?? Ze(nt, ct, je), St = Number.isFinite(pt) ? Math.max(0, pt) : jo, Zt = xe ? St * ve : St;
          Zt > 0 && (Ke[at + 0] = nt, Ke[at + 1] = ct, Ke[at + 2] = Zt, Ke[at + 3] = 0, at += Ja);
        }
        v = at / Ja, G = 0;
        const yt = Math.max(4, v * bs);
        if (!M || M.size < yt) {
          const mt = Math.max(Math.max(4, Cr(yt)), M ? M.size : 0);
          if (M)
            try {
              M.destroy();
            } catch {
            }
          M = e.createBuffer({
            label: "scatterRenderer/instanceBuffer",
            size: mt,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
          });
        }
        M && v > 0 && e.queue.writeBuffer(M, 0, R, 0, v * bs);
      }
      _ = ae, C = $t, E = Ae ? Xe : null, U = ve;
    }
  }, Z = () => {
    _ = null, C = null, E = null, U = Number.NaN, G = 0;
  }, Q = () => (j(), I && x && v > 0 && h != null && b != null), K = (se, ae, de) => {
    if (!h || !b || v === 0) return;
    const re = (de == null ? void 0 : de.manageScissor) !== !1;
    re && W && O > 0 && D > 0 && se.setScissorRect(W.x, W.y, W.w, W.h), se.setPipeline(ae), se.setBindGroup(0, p), se.setVertexBuffer(0, h), se.setVertexBuffer(1, b), se.draw(6, v), re && W && O > 0 && D > 0 && se.setScissorRect(0, 0, O, D);
  };
  return { prepare: $, invalidateGeometry: Z, render: (se) => {
    if (j(), v !== 0 && !(I && x)) {
      if (x) {
        K(se, S);
        return;
      }
      M && (W && O > 0 && D > 0 && se.setScissorRect(W.x, W.y, W.w, W.h), se.setPipeline(g), se.setBindGroup(0, p), se.setVertexBuffer(0, M), se.draw(6, v), W && O > 0 && D > 0 && se.setScissorRect(0, 0, O, D));
    }
  }, isDenseDeferred: Q, renderDense: (se) => {
    j(), !(!Q() || !A) && K(se, A, { manageScissor: !1 });
  }, dispose: () => {
    if (!n) {
      if (n = !0, M)
        try {
          M.destroy();
        } catch {
        }
      if (M = null, h)
        try {
          h.destroy();
        } catch {
        }
      if (h = null, b)
        try {
          b.destroy();
        } catch {
        }
      b = null, v = 0;
      try {
        l.destroy();
      } catch {
      }
      try {
        c.destroy();
      } catch {
      }
      O = 0, D = 0, k = [1, 1], W = null, _ = null, C = null, E = null, U = Number.NaN, G = 0, I = !1;
    }
  } };
}
const Lx = `struct ComputeUniforms {
  transform: mat4x4<f32>,
  viewportPx: vec2f,
  // Log projection before transform (bins still accumulate in screen space).
  // Independent bases so dual-log X/Y project correctly.
  logBaseX: f32,
  logBaseY: f32,
  logFlags: u32, // bit0 = log X, bit1 = log Y
  _padLog: u32,
  plotOriginPx: vec2<u32>,
  plotSizePx: vec2<u32>,
  binSizePx: u32,
  binCountX: u32,
  binCountY: u32,
  visibleStart: u32,
  visibleEnd: u32,
  normalization: u32,
};

@group(0) @binding(0) var<uniform> u: ComputeUniforms;
@group(0) @binding(1) var<storage, read> points: array<vec2f>;
@group(0) @binding(2) var<storage, read_write> bins: array<atomic<u32>>;

struct MaxBuffer {
  value: atomic<u32>,
};
@group(0) @binding(3) var<storage, read_write> maxBuf: MaxBuffer;

fn clipToDevicePx(clip: vec2f) -> vec2f {
  // clip in [-1,1] -> device pixel in [0, viewport]
  return vec2f(
    (clip.x * 0.5 + 0.5) * u.viewportPx.x,
    (-clip.y * 0.5 + 0.5) * u.viewportPx.y
  );
}

@compute @workgroup_size(256)
fn binPoints(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = u.visibleStart + gid.x;
  if (idx >= u.visibleEnd) {
    return;
  }

  var p = points[idx];
  // Non-positive on log axes: skip (omit from bins).
  let flags = u.logFlags;
  if (flags != 0u) {
    if ((flags & 1u) != 0u) {
      if (p.x <= 0.0) {
        return;
      }
      p.x = log(p.x) / log(u.logBaseX);
    }
    if ((flags & 2u) != 0u) {
      if (p.y <= 0.0) {
        return;
      }
      p.y = log(p.y) / log(u.logBaseY);
    }
  }
  let clip4 = u.transform * vec4f(p.x, p.y, 0.0, 1.0);
  let clip = clip4.xy / max(1e-9, clip4.w);
  let px = clipToDevicePx(clip);

  // Scissor bounds in device px
  let left = f32(u.plotOriginPx.x);
  let top = f32(u.plotOriginPx.y);
  let right = left + f32(u.plotSizePx.x);
  let bottom = top + f32(u.plotSizePx.y);

  if (px.x < left || px.x >= right || px.y < top || px.y >= bottom) {
    return;
  }

  let localX = u32((px.x - left) / f32(u.binSizePx));
  let localY = u32((px.y - top) / f32(u.binSizePx));
  if (localX >= u.binCountX || localY >= u.binCountY) {
    return;
  }

  let binIndex = localY * u.binCountX + localX;
  atomicAdd(&bins[binIndex], 1u);
}

@compute @workgroup_size(256)
fn reduceMax(@builtin(global_invocation_id) gid: vec3<u32>) {
  let binTotal = u.binCountX * u.binCountY;
  let i = gid.x;
  if (i >= binTotal) {
    return;
  }

  let v = atomicLoad(&bins[i]);
  atomicMax(&maxBuf.value, v);
}

`, Uu = `struct RenderUniforms {
  plotOriginPx: vec2<u32>,
  plotSizePx: vec2<u32>,
  binSizePx: u32,
  binCountX: u32,
  binCountY: u32,
  normalization: u32,
  _pad: vec2<u32>,
};

@group(0) @binding(0) var<uniform> u: RenderUniforms;
@group(0) @binding(1) var<storage, read> bins: array<u32>;
@group(0) @binding(2) var<storage, read> maxBuf: array<u32>;
@group(0) @binding(3) var lutTex: texture_2d<f32>;

struct VsOut {
  @builtin(position) position: vec4f,
};

@vertex
fn vsMain(@builtin(vertex_index) vid: u32) -> VsOut {
  // Fullscreen triangle (covers clip space).
  // (0,0)->(-1,-1), (2,0)->(3,-1), (0,2)->(-1,3)
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  var out: VsOut;
  out.position = vec4f(pos[vid], 0.0, 1.0);
  return out;
}

fn applyNormalization(count: f32, maxCount: f32, mode: u32) -> f32 {
  if (maxCount <= 0.0) {
    return 0.0;
  }
  let t = clamp(count / maxCount, 0.0, 1.0);
  if (mode == 1u) { // sqrt
    return sqrt(t);
  }
  if (mode == 2u) { // log
    // log1p(count) / log1p(max)
    return clamp(log(1.0 + count) / max(1e-9, log(1.0 + maxCount)), 0.0, 1.0);
  }
  return t; // linear
}

@fragment
fn fsMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  // pos.xy is framebuffer pixel coords (device px) with origin top-left.
  let x = pos.x;
  let y = pos.y;

  let left = f32(u.plotOriginPx.x);
  let top = f32(u.plotOriginPx.y);
  // plot scissor also applied on CPU; keep a guard anyway.
  if (x < left || y < top) {
    return vec4f(0.0);
  }

  let localX = u32((x - left) / f32(u.binSizePx));
  let localY = u32((y - top) / f32(u.binSizePx));
  if (localX >= u.binCountX || localY >= u.binCountY) {
    return vec4f(0.0);
  }

  let idx = localY * u.binCountX + localX;
  let c = f32(bins[idx]);
  let maxC = f32(maxBuf[0]);

  let t = applyNormalization(c, maxC, u.normalization);
  let lutX = i32(round(t * 255.0));
  let lut = textureLoad(lutTex, vec2<i32>(lutX, 0), 0);
  return vec4f(lut.rgb, 1.0);
}

`, Ux = "bgra8unorm", Ko = (e, t, n) => Math.min(n, Math.max(t, e | 0)), _x = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, zx = (e, t, n, i, r) => {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
}, Gx = (e) => {
  const { canvasWidth: t, canvasHeight: n, devicePixelRatio: i } = e, r = e.left * i, o = t - e.right * i, s = e.top * i, a = n - e.bottom * i, l = Ko(Math.floor(r), 0, Math.max(0, t)), c = Ko(Math.floor(s), 0, Math.max(0, n)), u = Ko(Math.ceil(o), 0, Math.max(0, t)), f = Ko(Math.ceil(a), 0, Math.max(0, n)), d = Math.max(0, u - l), m = Math.max(0, f - c);
  return { x: l, y: c, w: d, h: m };
}, Ox = (e) => e === "sqrt" ? 1 : e === "log" ? 2 : 0, _u = new Uint32Array([0]).buffer;
function Hx(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Ux, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" }
      }
    ]
  }), l = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      // `scatterDensityColormap.wgsl` declares these as `var<storage, read>`, so they must be read-only-storage.
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "unfilterable-float" }
      }
    ]
  }), c = un(e, 128, {
    label: "scatterDensity/computeUniforms"
  }), u = new ArrayBuffer(128), f = new Float32Array(u, 0, 20), d = new Uint32Array(u), m = un(e, 48, {
    label: "scatterDensity/renderUniforms"
  }), p = new ArrayBuffer(48), y = new Uint32Array(p), g = Ys(
    e,
    Lx,
    "scatterDensityBinning.wgsl",
    s
  ), S = e.createPipelineLayout({
    bindGroupLayouts: [a]
  }), A = Ai(
    e,
    {
      label: "scatterDensity/binPointsPipeline",
      layout: S,
      compute: { module: g, entryPoint: "binPoints" }
    },
    s
  ), M = Ai(
    e,
    {
      label: "scatterDensity/reduceMaxPipeline",
      layout: S,
      compute: { module: g, entryPoint: "reduceMax" }
    },
    s
  ), h = vn(
    e,
    {
      label: "scatterDensity/renderPipeline",
      bindGroupLayouts: [l],
      vertex: {
        code: Uu,
        label: "scatterDensityColormap.wgsl"
      },
      fragment: {
        code: Uu,
        label: "scatterDensityColormap.wgsl",
        formats: i,
        blend: void 0
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let b = null, v = null, x = 0, F = null, I = null, R = "", T = null, N = null, w = null, P = -1, B = 0, _ = 0, C = 0, E = 0, U = 0, G = null, O = 0, D = 0, k = 2, W = 0, j = Number.NaN, ee = Number.NaN, fe = Number.NaN, X = Number.NaN, z = Number.NaN, $ = Number.NaN, Z = Number.NaN, Q = !0, K = !1, ne = new Uint32Array(0);
  const L = () => {
    if (n) throw new Error("ScatterDensityRenderer is disposed.");
  }, le = (te) => {
    const Be = ad(te.densityColormap);
    if (F || (F = e.createTexture({
      label: "scatterDensity/lutTexture",
      size: { width: 256, height: 1, depthOrArrayLayers: 1 },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    }), I = F.createView(), R = ""), Be === R) return;
    const Me = Hl(te.densityColormap);
    e.queue.writeTexture(
      { texture: F },
      Me,
      { bytesPerRow: 256 * 4, rowsPerImage: 1 },
      { width: 256, height: 1, depthOrArrayLayers: 1 }
    ), R = Be;
  }, se = (te, Be) => {
    const Me = Math.max(1, te | 0) * Math.max(1, Be | 0);
    if (b && v && Me <= x) return;
    const _e = Math.max(1, Me);
    if (x = Math.max(256, _x(_e)), b) {
      try {
        b.destroy();
      } catch {
      }
      b = null;
    }
    if (v) {
      try {
        v.destroy();
      } catch {
      }
      v = null;
    }
    b = e.createBuffer({
      label: "scatterDensity/binsBuffer",
      size: x * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }), v = e.createBuffer({
      label: "scatterDensity/maxBuffer",
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }), ne = new Uint32Array(x), T = null, N = null, Q = !0;
  }, ae = () => {
    !b || !v || !I || !w || (T || (T = e.createBindGroup({
      label: "scatterDensity/computeBindGroup",
      layout: a,
      entries: [
        { binding: 0, resource: { buffer: c } },
        { binding: 1, resource: { buffer: w } },
        { binding: 2, resource: { buffer: b } },
        { binding: 3, resource: { buffer: v } }
      ]
    })), N || (N = e.createBindGroup({
      label: "scatterDensity/renderBindGroup",
      layout: l,
      entries: [
        { binding: 0, resource: { buffer: m } },
        { binding: 1, resource: { buffer: b } },
        { binding: 2, resource: { buffer: v } },
        { binding: 3, resource: I }
      ]
    })));
  };
  return { prepare: (te, Be, Me, _e, Le, ge, Ee, Se, ve, xe) => {
    L(), K = !0;
    const Pe = Gx(Se), Oe = Se.devicePixelRatio, Xe = Number.isFinite(te.binSize) ? Math.max(1e-6, te.binSize) : 2, Ze = Math.max(1, Math.round(Xe * (Number.isFinite(Oe) && Oe > 0 ? Oe : 1))), ze = Math.max(1, Math.ceil(Pe.w / Ze)), Ue = Math.max(1, Math.ceil(Pe.h / Ze));
    se(ze, Ue), le(te);
    const Ae = Ox(te.densityNormalization), Qe = ve, At = (Qe == null ? void 0 : Qe.xMin) ?? 0, It = (Qe == null ? void 0 : Qe.xMax) ?? 1, Tt = (Qe == null ? void 0 : Qe.yMin) ?? 0, Ot = (Qe == null ? void 0 : Qe.yMax) ?? 1, { a: Ht, b: xt } = ge.kind === "log" ? xn(ge) : di(ge, At, It), { a: $t, b: Mt } = Ee.kind === "log" ? xn(Ee) : di(Ee, Tt, Ot), { logFlags: we, logBaseX: Ie, logBaseY: ke } = Zn(ge, Ee);
    w !== Be && (w = Be, T = null, N = null, Q = !0), P !== Me && (P = Me, Q = !0), (B !== _e || _ !== Le) && (B = _e, _ = Le, Q = !0), (C !== Ze || E !== ze || U !== Ue) && (C = Ze, E = ze, U = Ue, Q = !0), (!G || G.x !== Pe.x || G.y !== Pe.y || G.w !== Pe.w || G.h !== Pe.h) && (G = Pe, Q = !0), (O !== Se.canvasWidth || D !== Se.canvasHeight) && (O = Se.canvasWidth, D = Se.canvasHeight, Q = !0), k !== Ae && (k = Ae, Q = !0), (fe !== Ht || X !== xt || z !== $t || $ !== Mt || W !== we || j !== Ie || ee !== ke) && (fe = Ht, X = xt, z = $t, $ = Mt, W = we, j = Ie, ee = ke, Q = !0), xe !== void 0 && Z !== xe && (Z = xe, Q = !0), zx(f, Ht, xt, $t, Mt), f[16] = Se.canvasWidth > 0 ? Se.canvasWidth : 1, f[17] = Se.canvasHeight > 0 ? Se.canvasHeight : 1, f[18] = Ie, f[19] = ke, d[20] = we >>> 0, d[21] = 0, d[22] = Pe.x >>> 0, d[23] = Pe.y >>> 0, d[24] = Pe.w >>> 0, d[25] = Pe.h >>> 0, d[26] = Ze >>> 0, d[27] = ze >>> 0, d[28] = Ue >>> 0, d[29] = (Math.max(0, _e) | 0) >>> 0, d[30] = (Math.max(0, Le) | 0) >>> 0, d[31] = Ae >>> 0, fn(e, c, u), y[0] = Pe.x >>> 0, y[1] = Pe.y >>> 0, y[2] = Pe.w >>> 0, y[3] = Pe.h >>> 0, y[4] = Ze >>> 0, y[5] = ze >>> 0, y[6] = Ue >>> 0, y[7] = Ae >>> 0, fn(e, m, p), ae();
  }, encodeCompute: (te) => {
    if (L(), !K || !Q) return;
    if (!b || !v) {
      Q = !1;
      return;
    }
    if (P <= 0) {
      ne && x > 0 && (e.queue.writeBuffer(b, 0, ne.buffer, 0, x * 4), e.queue.writeBuffer(v, 0, _u)), Q = !1;
      return;
    }
    if (!T) {
      Q = !1;
      return;
    }
    if (!G || G.w <= 0 || G.h <= 0) {
      Q = !1;
      return;
    }
    e.queue.writeBuffer(b, 0, ne.buffer, 0, x * 4), e.queue.writeBuffer(v, 0, _u);
    const Be = E * U | 0, Me = Math.max(0, _ - B | 0), _e = te.beginComputePass({
      label: "scatterDensity/computePass"
    });
    _e.setBindGroup(0, T), _e.setPipeline(A);
    const Le = 256, ge = Math.ceil(Me / Le);
    ge > 0 && _e.dispatchWorkgroups(ge), _e.setPipeline(M);
    const Ee = Math.ceil(Be / Le);
    Ee > 0 && _e.dispatchWorkgroups(Ee), _e.end(), Q = !1;
  }, render: (te) => {
    L(), K && (P <= 0 || !N || !G || !I || G.w <= 0 || G.h <= 0 || (te.setScissorRect(G.x, G.y, G.w, G.h), te.setPipeline(h), te.setBindGroup(0, N), te.draw(3), O > 0 && D > 0 && te.setScissorRect(0, 0, O, D)));
  }, dispose: () => {
    if (!n) {
      n = !0;
      try {
        c.destroy();
      } catch {
      }
      try {
        m.destroy();
      } catch {
      }
      if (b)
        try {
          b.destroy();
        } catch {
        }
      if (v)
        try {
          v.destroy();
        } catch {
        }
      if (b = null, v = null, x = 0, F)
        try {
          F.destroy();
        } catch {
        }
      F = null, I = null, T = null, N = null, w = null;
    }
  } };
}
const zu = `// pie.wgsl
// Instanced anti-aliased pie-slice shader (instanced quad + SDF mask).
//
// - Per-instance vertex input:
//   - center        = vec2<f32> slice center (transformed by VSUniforms.transform)
//   - startAngleRad = f32 start angle in radians
//   - endAngleRad   = f32 end angle in radians
//   - radiiPx       = vec2<f32>(innerRadiusPx, outerRadiusPx) in *device pixels*
//   - color         = vec4<f32> RGBA color in [0..1]
//
// - Draw call: draw(6, instanceCount) using triangle-list expansion in VS
//
// - Uniforms:
//   - @group(0) @binding(0): VSUniforms { transform, viewportPx }
//
// Notes:
// - The quad is expanded in clip space using \`radiusPx\` and \`viewportPx\`.
// - Fragment uses an SDF mask for the circle boundary + an angular wedge mask.
// - Fully outside fragments are discarded to avoid unnecessary blending work.
//
// Conventions: matches other shaders in this repo (vsMain/fsMain, group 0 bindings,
// and explicit uniform padding/alignment where needed).

const PI: f32 = 3.141592653589793;
const TAU: f32 = 6.283185307179586; // 2*pi

struct VSUniforms {
  transform: mat4x4<f32>,
  viewportPx: vec2<f32>,
  // Pad to 16-byte alignment (mat4x4 is 64B; vec2 adds 8B; pad to 80B).
  _pad0: vec2<f32>,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
  @location(0) center: vec2<f32>,
  @location(1) startAngleRad: f32,
  @location(2) endAngleRad: f32,
  @location(3) radiiPx: vec2<f32>, // (innerPx, outerPx)
  @location(4) color: vec4<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) localPx: vec2<f32>,
  @location(1) startAngleRad: f32,
  @location(2) endAngleRad: f32,
  @location(3) radiiPx: vec2<f32>,
  @location(4) color: vec4<f32>,
};

@vertex
fn vsMain(in: VSIn, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  // Fixed local corners for 2 triangles (triangle-list).
  // \`localNdc\` is a quad in [-1, 1]^2; we convert it to pixel offsets via radiusPx.
  let localNdc = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0)
  );

  let corner = localNdc[vertexIndex];
  let outerPx = in.radiiPx.y;
  let localPx = corner * outerPx;

  // Convert pixel offset to clip-space offset.
  // Clip space spans [-1, 1] across the viewport, so px -> clip is (2 / viewportPx).
  let localClip = localPx * (2.0 / vsUniforms.viewportPx);

  let centerClip = (vsUniforms.transform * vec4<f32>(in.center, 0.0, 1.0)).xy;

  var out: VSOut;
  out.clipPosition = vec4<f32>(centerClip + localClip, 0.0, 1.0);
  out.localPx = localPx;
  out.startAngleRad = in.startAngleRad;
  out.endAngleRad = in.endAngleRad;
  out.radiiPx = in.radiiPx;
  out.color = in.color;
  return out;
}

fn wrapToTau(theta: f32) -> f32 {
  // Maps theta to [0, TAU). (Input often comes from atan2 in [-PI, PI].)
  return select(theta, theta + TAU, theta < 0.0);
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  let p = in.localPx;
  let r = length(p);

  let innerPx = in.radiiPx.x;
  let outerPx = in.radiiPx.y;

  // --- Radial mask: ring between inner and outer radii (inner==0 => pie) ---
  // Positive inside the ring, negative outside.
  let radialDist = min(r - innerPx, outerPx - r);
  let radialW = fwidth(radialDist);
  let radialA = smoothstep(-radialW, radialW, radialDist);

  if (radialA <= 0.0) {
    discard;
  }

  // Compute fragment angle in [0, TAU).
  let angle = wrapToTau(atan2(p.y, p.x));

  // --- Angular mask: wedge between start/end angles with wrap ---
  let start = in.startAngleRad;
  let end = in.endAngleRad;

  // Compute span in [0, 2π) with wrap.
  var span = end - start;
  span = span + select(0.0, TAU, span < 0.0);

  // Compute rel in [0, 2π) with wrap.
  var rel = angle - start;
  rel = rel + select(0.0, TAU, rel < 0.0);

  let inside = rel <= span;

  // Signed angular distance (in radians) to nearest boundary.
  // - Inside: +min(rel, span-rel)
  // - Outside: -min(rel-span, 2π-rel)
  let dIn = min(rel, max(span - rel, 0.0));
  let dOutA = max(rel - span, 0.0);
  let dOutB = max(TAU - rel, 0.0);
  let dOut = min(dOutA, dOutB);

  let signedAngleDist = select(-dOut, dIn, inside);

  // Convert to approximate pixel distance to the boundary ray.
  // (For small angles, perpendicular distance to a ray ≈ r * angle.)
  let angleDistPx = signedAngleDist * max(r, 1.0);

  let angW = fwidth(angleDistPx);
  let angularA = smoothstep(-angW, angW, angleDistPx);

  let aOut = radialA * angularA;
  if (aOut <= 0.0) {
    discard;
  }

  return vec4<f32>(in.color.rgb, in.color.a * aOut);
}

`, Yx = "bgra8unorm", vs = 40, Qa = vs / 4, kr = Math.PI * 2, Gu = (e) => Math.min(1, Math.max(0, e)), Jo = (e, t, n) => Math.min(n, Math.max(t, e | 0)), Ou = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, el = (e) => {
  if (!Number.isFinite(e)) return 0;
  const t = e % kr;
  return t < 0 ? t + kr : t;
}, Wx = (e, t) => {
  const n = wn(e);
  if (n) return [n[0], n[1], n[2], Gu(n[3])];
  const i = wn(t);
  return i ? [i[0], i[1], i[2], Gu(i[3])] : [0, 0, 0, 1];
}, Mo = (e, t) => {
  if (typeof e == "number") return Number.isFinite(e) ? e : null;
  if (typeof e != "string") return null;
  const n = e.trim();
  if (n.length === 0) return null;
  if (n.endsWith("%")) {
    const r = Number.parseFloat(n.slice(0, -1));
    return Number.isFinite(r) ? r / 100 * t : null;
  }
  const i = Number.parseFloat(n);
  return Number.isFinite(i) ? i : null;
}, Xx = (e, t, n) => {
  const i = (e == null ? void 0 : e[0]) ?? "50%", r = (e == null ? void 0 : e[1]) ?? "50%", o = Mo(i, t), s = Mo(r, n);
  return {
    x: Number.isFinite(o) ? o : t * 0.5,
    y: Number.isFinite(s) ? s : n * 0.5
  };
}, Vx = (e) => Array.isArray(e), $x = (e, t) => {
  if (e == null) return { inner: 0, outer: t * 0.7 };
  if (Vx(e)) {
    const r = Mo(e[0], t), o = Mo(e[1], t), s = Math.max(0, Number.isFinite(r) ? r : 0), a = Math.max(s, Number.isFinite(o) ? o : t * 0.7);
    return { inner: s, outer: Math.min(t, a) };
  }
  const n = Mo(e, t), i = Math.max(0, Number.isFinite(n) ? n : t * 0.7);
  return { inner: 0, outer: Math.min(t, i) };
}, qx = (e) => {
  const { canvasWidth: t, canvasHeight: n, devicePixelRatio: i } = e, r = e.left * i, o = t - e.right * i, s = e.top * i, a = n - e.bottom * i, l = Jo(Math.floor(r), 0, Math.max(0, t)), c = Jo(Math.floor(s), 0, Math.max(0, n)), u = Jo(Math.ceil(o), 0, Math.max(0, t)), f = Jo(Math.ceil(a), 0, Math.max(0, n)), d = Math.max(0, u - l), m = Math.max(0, f - c);
  return { x: l, y: c, w: d, h: m };
}, jx = new Float32Array([
  1,
  0,
  0,
  0,
  // col0
  0,
  1,
  0,
  0,
  // col1
  0,
  0,
  1,
  0,
  // col2
  0,
  0,
  0,
  1
  // col3
]);
function Zx(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Yx, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, 80, {
    label: "pieRenderer/vsUniforms"
  }), c = new ArrayBuffer(80), u = new Float32Array(c), f = e.createBindGroup({
    layout: a,
    entries: [{ binding: 0, resource: { buffer: l } }]
  }), d = vn(
    e,
    {
      label: "pieRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: zu,
        label: "pie.wgsl",
        buffers: [
          {
            arrayStride: vs,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32x2", offset: 0 },
              // center
              { shaderLocation: 1, format: "float32", offset: 8 },
              // startAngleRad
              { shaderLocation: 2, format: "float32", offset: 12 },
              // endAngleRad
              { shaderLocation: 3, format: "float32x2", offset: 16 },
              // radiiPx
              { shaderLocation: 4, format: "float32x4", offset: 24 }
              // color
            ]
          }
        ]
      },
      fragment: {
        code: zu,
        label: "pie.wgsl",
        formats: i,
        // Standard alpha blending for AA edges and translucent slice colors.
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let m = null, p = 0, y = new ArrayBuffer(0), g = new Float32Array(y), S = 0, A = 0, M = null;
  const h = () => {
    if (n) throw new Error("PieRenderer is disposed.");
  }, b = (R) => {
    if (R <= g.length) return;
    const T = Math.max(8, Ou(R));
    y = new ArrayBuffer(T * 4), g = new Float32Array(y);
  }, v = (R, T) => {
    const N = Number.isFinite(R) && R > 0 ? R : 1, w = Number.isFinite(T) && T > 0 ? T : 1;
    u.set(jx, 0), u[16] = N, u[17] = w, u[18] = 0, u[19] = 0, fn(e, l, c);
  };
  return { prepare: (R, T) => {
    h();
    const N = T.devicePixelRatio, w = N > 0 && Number.isFinite(N) ? N : 1;
    S = T.canvasWidth, A = T.canvasHeight, v(T.canvasWidth, T.canvasHeight), M = qx(T);
    const P = T.canvasWidth / w, B = T.canvasHeight / w;
    if (!(P > 0) || !(B > 0)) {
      p = 0;
      return;
    }
    const _ = P - T.left - T.right, C = B - T.top - T.bottom;
    if (!(_ > 0) || !(C > 0)) {
      p = 0;
      return;
    }
    const E = 0.5 * Math.min(_, C);
    if (!(E > 0)) {
      p = 0;
      return;
    }
    const U = Xx(R.center, _, C), G = T.left + U.x, O = T.top + U.y, D = G / P * 2 - 1, k = 1 - O / B * 2;
    if (!Number.isFinite(D) || !Number.isFinite(k)) {
      p = 0;
      return;
    }
    const W = $x(R.radius, E), j = Math.max(0, Math.min(W.inner, W.outer)), ee = Math.max(j, W.outer), fe = j * w, X = ee * w;
    if (!(X > 0)) {
      p = 0;
      return;
    }
    let z = 0, $ = 0;
    for (let ae = 0; ae < R.data.length; ae++) {
      const de = R.data[ae], re = de == null ? void 0 : de.value;
      typeof re == "number" && Number.isFinite(re) && re > 0 && de.visible !== !1 && (z += re, $++);
    }
    if (!(z > 0) || $ === 0) {
      p = 0;
      return;
    }
    b($ * Qa);
    const Z = g, Q = typeof R.startAngle == "number" && Number.isFinite(R.startAngle) ? R.startAngle : 90;
    let K = el(Q * Math.PI / 180), ne = 0, L = 0, le = 0;
    for (let ae = 0; ae < R.data.length; ae++) {
      const de = R.data[ae], re = de == null ? void 0 : de.value;
      if (typeof re != "number" || !Number.isFinite(re) || re <= 0 || de.visible === !1) continue;
      le++;
      const ie = le === $;
      let te = re / z * kr;
      if (ie ? te = Math.max(0, kr - ne) : te = Math.max(0, Math.min(kr, te)), ne += te, !(te > 0)) continue;
      const Be = K, Me = $ === 1 ? K + kr : el(K + te);
      K = el(K + te);
      const [_e, Le, ge, Ee] = Wx(de.color, R.color);
      Z[L + 0] = D, Z[L + 1] = k, Z[L + 2] = Be, Z[L + 3] = Me, Z[L + 4] = fe, Z[L + 5] = X, Z[L + 6] = _e, Z[L + 7] = Le, Z[L + 8] = ge, Z[L + 9] = Ee, L += Qa;
    }
    p = L / Qa;
    const se = Math.max(4, p * vs);
    if (!m || m.size < se) {
      const ae = Math.max(Math.max(4, Ou(se)), m ? m.size : 0);
      if (m)
        try {
          m.destroy();
        } catch {
        }
      m = e.createBuffer({
        label: "pieRenderer/instanceBuffer",
        size: ae,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    m && p > 0 && e.queue.writeBuffer(m, 0, y, 0, p * vs);
  }, render: (R) => {
    h(), !(!m || p === 0) && (M && S > 0 && A > 0 && R.setScissorRect(M.x, M.y, M.w, M.h), R.setPipeline(d), R.setBindGroup(0, f), R.setVertexBuffer(0, m), R.draw(6, p), M && S > 0 && A > 0 && R.setScissorRect(0, 0, S, A));
  }, dispose: () => {
    if (!n) {
      if (n = !0, m)
        try {
          m.destroy();
        } catch {
        }
      m = null, p = 0;
      try {
        l.destroy();
      } catch {
      }
      S = 0, A = 0, M = null;
    }
  } };
}
const Hu = `// heatmap.wgsl — Uniform data-space heatmap (texture + colormap LUT).
//
// One data-space quad (6 verts). VS places corners via signed origin+extent so
// UV (0,0) always maps to cell (0,0) even when xStep/yStep are negative (matches
// heatmapCellIndex / heatmapHitTest on CPU).
// FS: textureLoad raw z (r32float) → normalize → sample 1D LUT.
// ringStart: modular column ring for spectrogram streaming (strategy C).

struct VSUniforms {
  transform  : mat4x4<f32>, // (log-)data-coord → clip-space
  // Signed grid placement (not sorted AABB):
  //   p = gridOrigin + uv * gridExtent
  gridOrigin : vec2<f32>,   // cell (0,0) min-corner after cellAnchor
  gridExtent : vec2<f32>,   // (columns*xStep, rows*yStep) — may be negative
  logBaseX   : f32,
  logBaseY   : f32,
  logFlags   : u32,         // bit0 = log X, bit1 = log Y
  _pad0      : u32,
};
// layout: mat4=64 + origin=8 + extent=8 + 4+4+4+4 = 96 bytes

struct FSUniforms {
  zMin         : f32,
  zMax         : f32,
  opacity      : f32,
  // 0 = linear, 1 = log
  zScaleMode   : u32,
  // 0 = transparent, 1 = lowest, 2 = highest
  nullHandling : u32,
  columns      : u32,
  rows         : u32,
  // Oldest logical column lives at this texel X (modular ring). 0 = linear.
  ringStart    : u32,
  // UV inset for cellGap (0 = none)
  gapTexels    : f32,
  _pad1        : f32,
  _pad2        : f32,
  _pad3        : f32,
};
// 48 bytes

@group(0) @binding(0) var<uniform> vsUniforms : VSUniforms;
@group(0) @binding(1) var<uniform> fsUniforms : FSUniforms;
@group(0) @binding(2) var zTex : texture_2d<f32>;
@group(0) @binding(3) var lutTex : texture_2d<f32>;

struct VSOut {
  @builtin(position) clipPosition : vec4<f32>,
  @location(0) uv : vec2<f32>, // 0..1 across grid (u = col index frac, v = row)
};

fn canLogProject(p : vec2<f32>) -> bool {
  let flags = vsUniforms.logFlags;
  if ((flags & 1u) != 0u && p.x <= 0.0) {
    return false;
  }
  if ((flags & 2u) != 0u && p.y <= 0.0) {
    return false;
  }
  return true;
}

fn projectData(p : vec2<f32>) -> vec2<f32> {
  let flags = vsUniforms.logFlags;
  if (flags == 0u) {
    return p;
  }
  var x = p.x;
  var y = p.y;
  if ((flags & 1u) != 0u) {
    x = log(x) / log(vsUniforms.logBaseX);
  }
  if ((flags & 2u) != 0u) {
    y = log(y) / log(vsUniforms.logBaseY);
  }
  return vec2<f32>(x, y);
}

// 6-vertex unit quad: uv in [0,1]^2 covering the grid.
fn quadUv(vid : u32) -> vec2<f32> {
  switch (vid) {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    case 3u: { return vec2<f32>(0.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, 0.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

@vertex
fn vsMain(@builtin(vertex_index) vid : u32) -> VSOut {
  let uv = quadUv(vid);
  // Signed placement: u=0 is always column 0 (not axis-sorted left edge).
  let p = vsUniforms.gridOrigin + uv * vsUniforms.gridExtent;

  var out : VSOut;
  out.uv = uv;

  if (!canLogProject(p)) {
    // Degenerate off-screen for log-invalid corners.
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }

  let pp = projectData(p);
  out.clipPosition = vsUniforms.transform * vec4<f32>(pp.x, pp.y, 0.0, 1.0);
  return out;
}

fn normalizeZ(z : f32) -> f32 {
  let zMin = fsUniforms.zMin;
  let zMax = fsUniforms.zMax;
  if (fsUniforms.zScaleMode == 1u) {
    // log
    if (!(z > 0.0) || !(zMin > 0.0) || !(zMax > 0.0)) {
      return -1.0; // sentinel → nullHandling
    }
    let lz = log(z);
    let l0 = log(zMin);
    let l1 = log(zMax);
    if (l0 == l1) {
      return 0.0;
    }
    return clamp((lz - l0) / (l1 - l0), 0.0, 1.0);
  }
  if (zMin == zMax) {
    return 0.0;
  }
  return clamp((z - zMin) / (zMax - zMin), 0.0, 1.0);
}

@fragment
fn fsMain(in : VSOut) -> @location(0) vec4f {
  let cols = fsUniforms.columns;
  let rows = fsUniforms.rows;
  if (cols == 0u || rows == 0u) {
    return vec4f(0.0);
  }

  // UV → logical texel: u=0 → column 0, v=0 → row 0 (matches heatmapCellIndex).
  let u = in.uv.x;
  let v = in.uv.y;

  let gap = fsUniforms.gapTexels;
  if (gap > 0.0) {
    let fx = u * f32(cols);
    let fy = v * f32(rows);
    let localX = fract(fx);
    let localY = fract(fy);
    // Approximate: discard near cell borders in UV space
    let border = clamp(gap * 0.5 / max(f32(cols), 1.0), 0.0, 0.45);
    if (localX < border || localX > (1.0 - border) || localY < border || localY > (1.0 - border)) {
      return vec4f(0.0);
    }
  }

  let logicalIx = u32(clamp(floor(u * f32(cols)), 0.0, f32(cols - 1u)));
  let iy = i32(clamp(floor(v * f32(rows)), 0.0, f32(rows - 1u)));
  // Modular ring: logical col 0 (oldest after scroll) is at texture ringStart.
  let texIx = i32((logicalIx + fsUniforms.ringStart) % cols);

  let zSample = textureLoad(zTex, vec2<i32>(texIx, iy), 0).r;

  // Non-finite detection: compare with self (NaN != NaN).
  if (zSample != zSample) {
    if (fsUniforms.nullHandling == 1u) {
      let lut = textureLoad(lutTex, vec2<i32>(0, 0), 0);
      return vec4f(lut.rgb, lut.a * fsUniforms.opacity);
    }
    if (fsUniforms.nullHandling == 2u) {
      let lut = textureLoad(lutTex, vec2<i32>(255, 0), 0);
      return vec4f(lut.rgb, lut.a * fsUniforms.opacity);
    }
    return vec4f(0.0);
  }

  var t = normalizeZ(zSample);
  if (t < 0.0) {
    if (fsUniforms.nullHandling == 1u) {
      t = 0.0;
    } else if (fsUniforms.nullHandling == 2u) {
      t = 1.0;
    } else {
      return vec4f(0.0);
    }
  }

  let lutX = i32(round(t * 255.0));
  let lut = textureLoad(lutTex, vec2<i32>(lutX, 0), 0);
  return vec4f(lut.rgb, lut.a * fsUniforms.opacity);
}
`, Kx = "bgra8unorm", Yu = 256, Wu = (e) => Math.min(1, Math.max(0, e)), Jx = (e, t, n, i, r) => {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
}, Qx = (e) => e === "lowest" ? 1 : e === "highest" ? 2 : 0;
function eb(e, t, n, i) {
  const r = new Float32Array(new ArrayBuffer(i * n * 4)), o = e.length;
  for (let s = 0; s < n; s++) {
    const a = s * t, l = s * i;
    for (let c = 0; c < t; c++) {
      const u = a + c;
      r[l + c] = u < o ? Number(e[u]) : Number.NaN;
    }
  }
  return r;
}
function tb(e, t, n) {
  const i = Dl(1), r = new Float32Array(new ArrayBuffer(i * n * 4));
  for (let o = 0; o < n; o++) {
    const s = t * n + o, a = s < e.length ? Number(e[s]) : Number.NaN;
    r[o * i] = Number.isFinite(a) ? a : Number.NaN;
  }
  return { data: r, paddedColumns: i, bytesPerRow: i * 4 };
}
function Dl(e) {
  const t = e * 4, n = Math.ceil(t / Yu) * Yu;
  return Math.max(e, n / 4);
}
function nb(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Kx, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = un(e, 96, { label: "heatmap/vsUniforms" }), l = new Float32Array(24), c = new Uint32Array(l.buffer), u = un(e, 48, { label: "heatmap/fsUniforms" }), f = new Float32Array(12), d = new Uint32Array(f.buffer), m = e.createBindGroupLayout({
    label: "heatmap/bindGroupLayout",
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "unfilterable-float", viewDimension: "2d" }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float", viewDimension: "2d" }
      }
    ]
  }), p = vn(
    e,
    {
      label: "heatmap/pipeline",
      bindGroupLayouts: [m],
      vertex: { code: Hu, label: "heatmap.wgsl" },
      fragment: {
        code: Hu,
        label: "heatmap.wgsl",
        formats: i,
        blend: {
          color: { operation: "add", srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
          alpha: { operation: "add", srcFactor: "one", dstFactor: "one-minus-src-alpha" }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let y = null, g = null, S = null, A = null, M = null, h = 0, b = 0, v = 0, x = null, F = 0, I = null, R = 0, T = 0, N = 0, w = 0, P = "", B = !1, _ = !1, C = 0;
  const E = () => {
    if (n) throw new Error("HeatmapRenderer is disposed.");
  }, U = () => {
    if (y)
      try {
        y.destroy();
      } catch {
      }
    y = null, g = null, M = null, h = 0, b = 0, v = 0, C = 0;
  }, G = (z) => {
    const $ = ad(z.colormap);
    if (S || (S = e.createTexture({
      label: "heatmap/lutTexture",
      size: { width: 256, height: 1, depthOrArrayLayers: 1 },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    }), A = S.createView(), P = ""), $ === P) return;
    const Z = Hl(z.colormap);
    e.queue.writeTexture(
      { texture: S },
      Z,
      { bytesPerRow: 256 * 4, rowsPerImage: 1 },
      { width: 256, height: 1, depthOrArrayLayers: 1 }
    ), P = $, w += 1;
  }, O = (z, $) => {
    if (y && h === z && b === $) return !1;
    U();
    const Z = Dl(z);
    return y = e.createTexture({
      label: "heatmap/zTexture",
      size: { width: z, height: $, depthOrArrayLayers: 1 },
      format: "r32float",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    }), g = y.createView(), h = z, b = $, v = Z, x = null, F = 0, C = 0, M = null, !0;
  }, D = (z, $, Z, Q) => {
    if (!y) return;
    const K = v > 0 ? v : Dl($), ne = eb(z, $, Z, K);
    e.queue.writeTexture(
      { texture: y },
      ne,
      { bytesPerRow: K * 4, rowsPerImage: Z },
      { width: $, height: Z, depthOrArrayLayers: 1 }
    ), R += 1, x = z, F = Q, C = 0;
  }, k = () => {
    !g || !A || M || (M = e.createBindGroup({
      label: "heatmap/bindGroup",
      layout: m,
      entries: [
        { binding: 0, resource: { buffer: a } },
        { binding: 1, resource: { buffer: u } },
        { binding: 2, resource: g },
        { binding: 3, resource: A }
      ]
    }));
  };
  return {
    prepare: (z, $, Z, Q, K) => {
      if (E(), B = !0, _ = !1, !z.drawable || z.visible === !1) {
        I = z;
        return;
      }
      const { data: ne } = z, L = ne.columns | 0, le = ne.rows | 0;
      if (L < 1 || le < 1) {
        I = z;
        return;
      }
      G(z);
      const se = O(L, le), ae = ne.z, de = L * le, re = I !== z;
      let ie = se || x !== ae;
      if (!ie && re) {
        const Xe = Fa(ae, de);
        Xe !== F ? D(ae, L, le, Xe) : F = Xe;
      } else ie && D(ae, L, le, Fa(ae, de));
      I = z;
      const be = z.rawBounds ?? Yl(ne, z.cellAnchor), te = Ks(ne, z.cellAnchor), { a: Be, b: Me } = $.kind === "log" ? xn($) : di($, be.xMin, be.xMax), { a: _e, b: Le } = Z.kind === "log" ? xn(Z) : di(Z, be.yMin, be.yMax), { logFlags: ge, logBaseX: Ee, logBaseY: Se } = Zn($, Z);
      Jx(l, Be, Me, _e, Le), l[16] = te.x0, l[17] = te.y0, l[18] = te.xExtent, l[19] = te.yExtent, l[20] = Ee, l[21] = Se, c[22] = ge >>> 0, c[23] = 0, fn(e, a, l);
      const ve = Wu(z.opacity), xe = (K == null ? void 0 : K.opacityOverride) !== void 0 ? Wu(ve * K.opacityOverride) : ve;
      f[0] = z.zMin, f[1] = z.zMax, f[2] = xe, d[3] = z.zScale === "log" ? 1 : 0, d[4] = Qx(z.nullHandling), d[5] = L >>> 0, d[6] = le >>> 0, d[7] = C >>> 0;
      const Pe = Math.max(
        1,
        Q.canvasWidth / Math.max(1e-6, Q.devicePixelRatio) - Q.left - Q.right
      ), Oe = z.cellGapPx > 0 && Pe > 0 ? Math.min(0.4, z.cellGapPx / Pe * L) : 0;
      f[8] = Oe, f[9] = 0, f[10] = 0, f[11] = 0, fn(e, u, f), k(), _ = M != null;
    },
    render: (z) => {
      n || !B || !_ || !M || (z.setPipeline(p), z.setBindGroup(0, M), z.draw(6, 1, 0, 0));
    },
    dispose: () => {
      if (!n) {
        if (n = !0, U(), S) {
          try {
            S.destroy();
          } catch {
          }
          S = null, A = null;
        }
        try {
          a.destroy();
        } catch {
        }
        try {
          u.destroy();
        } catch {
        }
        M = null;
      }
    },
    uploadColumnStrip: (z, $, Z, Q, K) => {
      E();
      const ne = Math.max(0, Math.floor($)), L = Math.max(0, Math.floor(Z)), le = Math.max(0, Math.floor(Q));
      if (ne < 1 || L < 1 || le < 1 || !y || h !== le || b !== L) return !1;
      for (let se = 0; se < ne; se++) {
        const ae = (C + se) % le, { data: de, bytesPerRow: re } = tb(z, se, L);
        e.queue.writeTexture(
          { texture: y, origin: { x: ae, y: 0, z: 0 } },
          de,
          { bytesPerRow: re, rowsPerImage: L },
          { width: 1, height: L, depthOrArrayLayers: 1 }
        ), T += 1, N += L;
      }
      return C = (C + ne) % le, x = K, F = Fa(K, le * L), !0;
    },
    resetRing: () => {
      E(), C = 0, x = null, F = 0;
    },
    getRingStart: () => C,
    getZUploadCount: () => R,
    getZStripUploadCount: () => T,
    getZStripUploadFloats: () => N,
    getLutUploadCount: () => w,
    hasZTexture: () => y != null
  };
}
const Xu = `// candlestick.wgsl
// Instanced candlestick shader (bodies + wicks):
// - Per-instance vertex input is in **relative domain space** (issue 1.3):
//   - x = timestamp - packingOrigin (f32-safe; ms epoch collapses as absolute f32)
//   - open, close, low, high, bodyWidthDomain (5 more floats)
//   - bodyColor rgba (4 floats)
// - Geometry is expanded in relative domain; VSUniforms.transform maps →clip
//   with origin baked into the translation column (bx' = bx + ax * packingOrigin).
// - wickWidth is also domain units (CSS px converted each frame) so pan/zoom
//   updates uniforms only when instance layout is stable.
// - Draw call: draw(18, instanceCount) using triangle-list expansion in VS
//   - vertices 0-5: body quad (2 triangles)
//   - vertices 6-11: upper wick (2 triangles)
//   - vertices 12-17: lower wick (2 triangles)

struct VSUniforms {
  transform: mat4x4<f32>,
  wickWidth: f32,
  // Independent bases so dual-log X/Y project correctly.
  logBaseX: f32,
  logBaseY: f32,
  // bit0 = log X, bit1 = log Y
  logFlags: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
  @location(0) x: f32,
  @location(1) open: f32,
  @location(2) close: f32,
  @location(3) low: f32,
  @location(4) high: f32,
  @location(5) bodyWidth: f32,
  @location(6) bodyColor: vec4<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vsMain(in: VSIn, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  // Domain-space body bounds (transform maps to clip)
  let bodyTop = max(in.open, in.close);
  let bodyBottom = min(in.open, in.close);
  let bodyLeft = in.x - in.bodyWidth * 0.5;
  let bodyRight = in.x + in.bodyWidth * 0.5;

  // Wick bounds (wickWidth is domain units converted from CSS px each frame)
  let wickLeft = in.x - vsUniforms.wickWidth * 0.5;
  let wickRight = in.x + vsUniforms.wickWidth * 0.5;

  var pos: vec2<f32>;

  if (vertexIndex < 6u) {
    // Body quad (vertices 0-5)
    let corners = array<vec2<f32>, 6>(
      vec2<f32>(0.0, 0.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(1.0, 1.0)
    );
    let corner = corners[vertexIndex];
    let bodyMin = vec2<f32>(bodyLeft, bodyBottom);
    let bodyMax = vec2<f32>(bodyRight, bodyTop);
    pos = bodyMin + corner * (bodyMax - bodyMin);
  } else if (vertexIndex < 12u) {
    // Upper wick (vertices 6-11): from bodyTop to high
    let idx = vertexIndex - 6u;
    let corners = array<vec2<f32>, 6>(
      vec2<f32>(0.0, 0.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(1.0, 1.0)
    );
    let corner = corners[idx];
    let wickMin = vec2<f32>(wickLeft, bodyTop);
    let wickMax = vec2<f32>(wickRight, in.high);
    pos = wickMin + corner * (wickMax - wickMin);
  } else {
    // Lower wick (vertices 12-17): from low to bodyBottom
    let idx = vertexIndex - 12u;
    let corners = array<vec2<f32>, 6>(
      vec2<f32>(0.0, 0.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(1.0, 1.0)
    );
    let corner = corners[idx];
    let wickMin = vec2<f32>(wickLeft, in.low);
    let wickMax = vec2<f32>(wickRight, bodyBottom);
    pos = wickMin + corner * (wickMax - wickMin);
  }

  // Log projection per-corner (OHLC stay data-space in instance buffer).
  let flags = vsUniforms.logFlags;
  if (flags != 0u) {
    if ((flags & 1u) != 0u) {
      if (pos.x <= 0.0) {
        var outBad: VSOut;
        outBad.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        outBad.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        return outBad;
      }
      pos.x = log(pos.x) / log(vsUniforms.logBaseX);
    }
    if ((flags & 2u) != 0u) {
      if (pos.y <= 0.0) {
        var outBad: VSOut;
        outBad.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        outBad.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        return outBad;
      }
      pos.y = log(pos.y) / log(vsUniforms.logBaseY);
    }
  }

  var out: VSOut;
  out.clipPosition = vsUniforms.transform * vec4<f32>(pos, 0.0, 1.0);
  out.color = in.bodyColor;
  return out;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  return in.color;
}
`, dm = (e) => {
  const t = e.trim().match(/^(\d+(?:\.\d+)?)%$/);
  if (!t) return null;
  const n = Number(t[1]) / 100;
  return Number.isFinite(n) ? n : null;
}, ib = (e) => Array.isArray(e), mr = (e) => ib(e) ? { timestamp: e[0], open: e[1], close: e[2], low: e[3], high: e[4] } : {
  timestamp: e.timestamp,
  open: e.open,
  close: e.close,
  low: e.low,
  high: e.high
}, mm = (e) => {
  const t = [];
  for (let i = 0; i < e.length; i++) {
    const { timestamp: r } = mr(e[i]);
    Number.isFinite(r) && t.push(r);
  }
  if (t.length < 2) return 1;
  t.sort((i, r) => i - r);
  let n = Number.POSITIVE_INFINITY;
  for (let i = 1; i < t.length; i++) {
    const r = t[i] - t[i - 1];
    r > 0 && r < n && (n = r);
  }
  return Number.isFinite(n) && n > 0 ? n : 1;
};
function rb(e, t) {
  return t > e ? "up" : "down";
}
function ob(e) {
  const t = e.defaultFraction ?? 0.45, n = Number.isFinite(e.bodyWidthDomain) ? Math.max(0, e.bodyWidthDomain) : 0;
  if (typeof e.tickLength == "number") {
    const i = e.tickLengthAsDomain;
    return typeof i == "number" && Number.isFinite(i) ? Math.max(0, i) : Number.isFinite(e.tickLength) ? Math.max(0, e.tickLength) : 0;
  }
  if (typeof e.tickLength == "string") {
    const i = e.tickLength.trim().match(/^(\d+(?:\.\d+)?)%$/);
    if (i) {
      const r = Number(i[1]) / 100;
      if (Number.isFinite(r)) return n * Math.min(1, Math.max(0, r));
    }
    return sb(e.tickLength), n * t;
  }
  return n * t;
}
let Vu = !1;
function sb(e) {
  Vu || (Vu = !0, console.warn(
    `ChartGPU: ohlc tickLength "${e}" is not a percent string (e.g. "45%") or CSS-px number; using default ${0.45 * 100}% of body width.`
  ));
}
const Or = (e) => Math.min(1, Math.max(0, e)), Qo = (e, t, n) => Math.min(n, Math.max(t, e | 0)), xi = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, Qt = (e, t) => Math.abs(e - t) <= 1e-9 * Math.max(1, Math.abs(e), Math.abs(t));
function ia(e) {
  const t = e.devicePixelRatio;
  if (!(t > 0)) return null;
  const n = e.canvasWidth / t, i = e.canvasHeight / t, r = n - e.left - e.right, o = i - e.top - e.bottom;
  return !(r > 0) || !(o > 0) ? null : { plotWidthCss: r, plotHeightCss: o };
}
function ra(e) {
  const { left: t, right: n, top: i, bottom: r, canvasWidth: o, canvasHeight: s, devicePixelRatio: a } = e, l = t * a, c = o - n * a, u = i * a, f = s - r * a, d = l / o * 2 - 1, m = c / o * 2 - 1, p = 1 - u / s * 2, y = 1 - f / s * 2;
  return {
    left: d,
    right: m,
    top: p,
    bottom: y,
    width: m - d,
    height: p - y
  };
}
function oa(e) {
  const { canvasWidth: t, canvasHeight: n, devicePixelRatio: i } = e, r = e.left * i, o = t - e.right * i, s = e.top * i, a = n - e.bottom * i, l = Qo(Math.floor(r), 0, Math.max(0, t)), c = Qo(Math.floor(s), 0, Math.max(0, n)), u = Qo(Math.ceil(o), 0, Math.max(0, t)), f = Qo(Math.ceil(a), 0, Math.max(0, n)), d = Math.max(0, u - l), m = Math.max(0, f - c);
  return { x: l, y: c, w: d, h: m };
}
function sa(e, t, n, i, r) {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
}
function aa(e) {
  const { xScale: t, yScale: n, ax: i, ay: r, clipPerCssX: o, clipPerCssY: s } = e;
  return { cssWidthToDomainX: (c) => {
    const u = Math.max(0, c) * o;
    if (!(u > 0)) return 0;
    if (t.kind === "log") {
      const { min: d, max: m } = t.getDomain(), p = Math.sqrt(Math.max(d, Number.MIN_VALUE) * Math.max(m, Number.MIN_VALUE)), y = t.scale(p), g = t.invert(y - u * 0.5), S = t.invert(y + u * 0.5);
      return Number.isFinite(g) && Number.isFinite(S) ? Math.abs(S - g) : 0;
    }
    const f = Math.abs(i);
    return f > 1e-20 ? u / f : 0;
  }, cssHeightToDomainY: (c) => {
    const u = Math.max(0, c) * Math.abs(s);
    if (!(u > 0)) return 0;
    if (n.kind === "log") {
      const { min: d, max: m } = n.getDomain(), p = Math.sqrt(Math.max(d, Number.MIN_VALUE) * Math.max(m, Number.MIN_VALUE)), y = n.scale(p), g = n.invert(y - u * 0.5), S = n.invert(y + u * 0.5);
      return Number.isFinite(g) && Number.isFinite(S) ? Math.abs(S - g) : 0;
    }
    const f = Math.abs(r);
    return f > 1e-20 ? u / f : 0;
  } };
}
const ab = "bgra8unorm", lb = 1, Br = 40, nr = Br / 4, io = (e) => wn(e) ?? [0, 0, 0, 1], cb = mm, ub = (e) => e.length === 0 ? {
  timestamp: Number.NaN,
  open: Number.NaN,
  close: Number.NaN,
  low: Number.NaN,
  high: Number.NaN
} : mr(e[e.length - 1]), fb = (e) => {
  for (let t = 0; t < e.length; t++) {
    const { timestamp: n } = mr(e[t]);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};
function db(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? ab, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, 80, {
    label: "candlestickRenderer/vsUniforms"
  }), c = new ArrayBuffer(80), u = new Float32Array(c), f = e.createBindGroup({
    layout: a,
    entries: [{ binding: 0, resource: { buffer: l } }]
  }), d = vn(
    e,
    {
      label: "candlestickRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: Xu,
        label: "candlestick.wgsl",
        buffers: [
          {
            arrayStride: Br,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32", offset: 0 },
              { shaderLocation: 1, format: "float32", offset: 4 },
              { shaderLocation: 2, format: "float32", offset: 8 },
              { shaderLocation: 3, format: "float32", offset: 12 },
              { shaderLocation: 4, format: "float32", offset: 16 },
              { shaderLocation: 5, format: "float32", offset: 20 },
              { shaderLocation: 6, format: "float32x4", offset: 24 }
            ]
          }
        ]
      },
      fragment: {
        code: Xu,
        label: "candlestick.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let m = null, p = 0, y = new ArrayBuffer(0), g = new Float32Array(y), S = 0, A = 0, M = null, h = !1, b = null, v = 0, x = new ArrayBuffer(0), F = new Float32Array(x), I = null;
  const R = () => {
    if (n) throw new Error("CandlestickRenderer is disposed.");
  }, T = (C) => {
    if (C <= g.length) return;
    const E = Math.max(8, xi(C));
    y = new ArrayBuffer(E * 4), g = new Float32Array(y);
  }, N = (C) => {
    if (C <= F.length) return;
    const E = Math.max(8, xi(C));
    x = new ArrayBuffer(E * 4), F = new Float32Array(x);
  };
  return { prepare: (C, E, U, G, O, D) => {
    if (R(), E.length === 0) {
      p = 0, v = 0, I = null;
      return;
    }
    const k = ia(O);
    if (!k) {
      p = 0, v = 0, I = null;
      return;
    }
    const W = ra(O), j = k.plotWidthCss > 0 ? W.width / k.plotWidthCss : 0;
    S = O.canvasWidth, A = O.canvasHeight, M = oa(O), h = C.style === "hollow";
    const ee = I && I.data === E ? I.categoryStep : cb(E), fe = U.kind === "log" ? 0 : I && I.data === E ? I.packingOrigin : fb(E);
    let X, z;
    if (U.kind === "log") {
      const Tt = xn(U);
      X = Tt.a, z = Tt.b;
    } else {
      const Tt = Number.isFinite(ee) && ee > 0 ? ee : 1, Ot = U.scale(fe), Ht = U.scale(fe + Tt);
      X = Number.isFinite(Ot) && Number.isFinite(Ht) && Tt !== 0 ? (Ht - Ot) / Tt : 0, z = Number.isFinite(Ot) ? Ot : 0;
    }
    const { a: $, b: Z } = xn(G), { logFlags: Q, logBaseX: K, logBaseY: ne } = Zn(U, G), L = k.plotHeightCss > 0 ? W.height / k.plotHeightCss : 0, { cssWidthToDomainX: le } = aa({
      xScale: U,
      yScale: G,
      ax: X,
      ay: $,
      clipPerCssX: j,
      clipPerCssY: L
    });
    let se = 0;
    const ae = C.barWidth;
    if (typeof ae == "number")
      se = le(ae);
    else if (typeof ae == "string") {
      const Tt = dm(ae);
      se = Tt == null ? 0 : ee * Or(Tt);
    }
    const de = le(C.barMinWidth), re = le(C.barMaxWidth);
    se = Math.min(Math.max(se, de), re);
    const ie = C.itemStyle.borderWidth ?? lb, be = le(ie), te = h ? le(C.itemStyle.borderWidth) : 0, Be = C.itemStyle.upColor, Me = C.itemStyle.downColor, _e = C.itemStyle.upBorderColor, Le = C.itemStyle.downBorderColor, ge = ub(E), Ee = I != null && m != null && I.data === E && I.dataLength === E.length && Qt(I.lastTimestamp, ge.timestamp) && Qt(I.lastOpen, ge.open) && Qt(I.lastClose, ge.close) && Qt(I.lastLow, ge.low) && Qt(I.lastHigh, ge.high) && Qt(I.packingOrigin, fe) && Qt(I.categoryStep, ee) && Qt(I.bodyWidthDomain, se) && Qt(I.hollowBorderDomain, te) && I.hollowMode === h && I.upColor === Be && I.downColor === Me && I.upBorderColor === _e && I.downBorderColor === Le && I.backgroundColor === D, Se = Vr({
      residency: {
        kind: "privateInstance",
        gpuBuffer: m,
        pointCount: (I == null ? void 0 : I.instanceCount) ?? 0,
        contentVersion: 0,
        lastRef: (I == null ? void 0 : I.data) ?? null
      },
      dataRef: E,
      geometryCacheHit: Ee,
      appendedThisFrame: !1,
      needsGrowth: !1
    }), ve = new Uint32Array(c), xe = () => {
      sa(u, X, z, $, Z), u[16] = be, u[17] = K, u[18] = ne, ve[19] = Q >>> 0, fn(e, l, c);
    };
    if (Se === "skip" && I) {
      p = I.instanceCount, v = I.hollowInstanceCount, xe();
      return;
    }
    const Pe = io(Be), Oe = io(Me), Xe = io(_e), Ze = io(Le), ze = D ? io(D) : [0, 0, 0, 1];
    xe(), T(E.length * nr);
    const Ue = g;
    let Ae = 0;
    h && N(E.length * nr);
    const Qe = F;
    let At = 0;
    for (let Tt = 0; Tt < E.length; Tt++) {
      const { timestamp: Ot, open: Ht, close: xt, low: $t, high: Mt } = mr(E[Tt]);
      if (!Number.isFinite(Ot) || !Number.isFinite(Ht) || !Number.isFinite(xt) || !Number.isFinite($t) || !Number.isFinite(Mt))
        continue;
      const we = xt > Ht, Ie = Ot - fe;
      if (h) {
        const ke = we ? Xe : Ze;
        if (Ue[Ae + 0] = Ie, Ue[Ae + 1] = Ht, Ue[Ae + 2] = xt, Ue[Ae + 3] = $t, Ue[Ae + 4] = Mt, Ue[Ae + 5] = se, Ue[Ae + 6] = ke[0], Ue[Ae + 7] = ke[1], Ue[Ae + 8] = ke[2], Ue[Ae + 9] = ke[3], Ae += nr, we) {
          const Ke = Math.max(0, se - 2 * te);
          Qe[At + 0] = Ie, Qe[At + 1] = Ht, Qe[At + 2] = xt, Qe[At + 3] = $t, Qe[At + 4] = Mt, Qe[At + 5] = Ke, Qe[At + 6] = ze[0], Qe[At + 7] = ze[1], Qe[At + 8] = ze[2], Qe[At + 9] = ze[3], At += nr;
        }
      } else {
        const ke = we ? Pe : Oe;
        Ue[Ae + 0] = Ie, Ue[Ae + 1] = Ht, Ue[Ae + 2] = xt, Ue[Ae + 3] = $t, Ue[Ae + 4] = Mt, Ue[Ae + 5] = se, Ue[Ae + 6] = ke[0], Ue[Ae + 7] = ke[1], Ue[Ae + 8] = ke[2], Ue[Ae + 9] = ke[3], Ae += nr;
      }
    }
    p = Ae / nr, v = At / nr;
    const It = Math.max(4, p * Br);
    if (!m || m.size < It) {
      const Tt = Math.max(Math.max(4, xi(It)), m ? m.size : 0);
      if (m)
        try {
          m.destroy();
        } catch {
        }
      m = e.createBuffer({
        label: "candlestickRenderer/instanceBuffer",
        size: Tt,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    if (p > 0 && e.queue.writeBuffer(m, 0, y, 0, p * Br), h && v > 0) {
      const Tt = Math.max(4, v * Br);
      if (!b || b.size < Tt) {
        const Ot = Math.max(
          Math.max(4, xi(Tt)),
          b ? b.size : 0
        );
        if (b)
          try {
            b.destroy();
          } catch {
          }
        b = e.createBuffer({
          label: "candlestickRenderer/hollowInstanceBuffer",
          size: Ot,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
      }
      e.queue.writeBuffer(
        b,
        0,
        x,
        0,
        v * Br
      );
    }
    I = {
      data: E,
      dataLength: E.length,
      lastTimestamp: ge.timestamp,
      lastOpen: ge.open,
      lastClose: ge.close,
      lastLow: ge.low,
      lastHigh: ge.high,
      packingOrigin: fe,
      categoryStep: ee,
      bodyWidthDomain: se,
      hollowBorderDomain: te,
      hollowMode: h,
      upColor: Be,
      downColor: Me,
      upBorderColor: _e,
      downBorderColor: Le,
      backgroundColor: D,
      instanceCount: p,
      hollowInstanceCount: v
    };
  }, invalidateGeometry: () => {
    I = null;
  }, render: (C) => {
    R(), !(!m || p === 0) && (M && S > 0 && A > 0 && C.setScissorRect(M.x, M.y, M.w, M.h), C.setPipeline(d), C.setBindGroup(0, f), C.setVertexBuffer(0, m), C.draw(18, p), h && b && v > 0 && (C.setVertexBuffer(0, b), C.draw(6, v)), M && S > 0 && A > 0 && C.setScissorRect(0, 0, S, A));
  }, dispose: () => {
    if (!n) {
      if (n = !0, m)
        try {
          m.destroy();
        } catch {
        }
      if (m = null, p = 0, b)
        try {
          b.destroy();
        } catch {
        }
      b = null, v = 0;
      try {
        l.destroy();
      } catch {
      }
      S = 0, A = 0, M = null, I = null;
    }
  } };
}
const $u = `// ohlc.wgsl
// Instanced thin OHLC bars (stem + open tick + close tick):
// - Per-instance vertex input is in **relative domain space** (same as candlestick):
//   - x = timestamp - packingOrigin (f32-safe; ms epoch collapses as absolute f32)
//   - open, close, low, high, tickLengthDomain (5 more floats)
//   - bodyColor rgba (4 floats)
// - Geometry expanded in relative domain; VSUniforms.transform maps →clip
//   with origin baked into the translation column (bx' = bx + ax * packingOrigin).
// - stemWidth is domain **X** units (CSS px → X) for vertical stem thickness.
// - tickThicknessY is domain **Y** units (CSS px → Y) for open/close tick thickness.
//   These must not share the X conversion: timestamp-scale X widths are huge in price Y
//   and would paint full-height slabs.
// - Draw call: draw(18, instanceCount) using triangle-list expansion in VS
//   - vertices 0-5: vertical stem (low → high)
//   - vertices 6-11: open tick (left of center)
//   - vertices 12-17: close tick (right of center)

struct VSUniforms {
  transform: mat4x4<f32>,
  stemWidth: f32,       // domain X
  tickThicknessY: f32,  // domain Y (full thickness; half applied in VS)
  logBaseX: f32,
  logBaseY: f32,
  // bit0 = log X, bit1 = log Y
  logFlags: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
  @location(0) x: f32,
  @location(1) open: f32,
  @location(2) close: f32,
  @location(3) low: f32,
  @location(4) high: f32,
  @location(5) tickLength: f32,
  @location(6) bodyColor: vec4<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) color: vec4<f32>,
};

fn quadCorners(idx: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0)
  );
  return corners[idx];
}

@vertex
fn vsMain(in: VSIn, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  let stemHalf = vsUniforms.stemWidth * 0.5;
  // Horizontal tick thickness in **Y** domain (not stemWidth / domain X).
  let tickHalfH = vsUniforms.tickThicknessY * 0.5;

  var pos: vec2<f32>;

  if (vertexIndex < 6u) {
    // Vertical stem: (x ± stemHalf, low → high)
    let corner = quadCorners(vertexIndex);
    let minP = vec2<f32>(in.x - stemHalf, in.low);
    let maxP = vec2<f32>(in.x + stemHalf, in.high);
    pos = minP + corner * (maxP - minP);
  } else if (vertexIndex < 12u) {
    // Open tick: left of center at y = open
    let idx = vertexIndex - 6u;
    let corner = quadCorners(idx);
    let minP = vec2<f32>(in.x - in.tickLength, in.open - tickHalfH);
    let maxP = vec2<f32>(in.x, in.open + tickHalfH);
    pos = minP + corner * (maxP - minP);
  } else {
    // Close tick: right of center at y = close
    let idx = vertexIndex - 12u;
    let corner = quadCorners(idx);
    let minP = vec2<f32>(in.x, in.close - tickHalfH);
    let maxP = vec2<f32>(in.x + in.tickLength, in.close + tickHalfH);
    pos = minP + corner * (maxP - minP);
  }

  // Log projection per-corner (OHLC stay data-space in instance buffer).
  let flags = vsUniforms.logFlags;
  if (flags != 0u) {
    if ((flags & 1u) != 0u) {
      if (pos.x <= 0.0) {
        var outBad: VSOut;
        outBad.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        outBad.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        return outBad;
      }
      pos.x = log(pos.x) / log(vsUniforms.logBaseX);
    }
    if ((flags & 2u) != 0u) {
      if (pos.y <= 0.0) {
        var outBad: VSOut;
        outBad.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        outBad.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        return outBad;
      }
      pos.y = log(pos.y) / log(vsUniforms.logBaseY);
    }
  }

  var out: VSOut;
  out.clipPosition = vsUniforms.transform * vec4<f32>(pos, 0.0, 1.0);
  out.color = in.bodyColor;
  return out;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  return in.color;
}
`, mb = "bgra8unorm", pb = 1, ws = 40, tl = ws / 4, qu = (e) => wn(e) ?? [0, 0, 0, 1], hb = mm, yb = (e) => e.length === 0 ? {
  timestamp: Number.NaN,
  open: Number.NaN,
  close: Number.NaN,
  low: Number.NaN,
  high: Number.NaN
} : mr(e[e.length - 1]), gb = (e) => {
  for (let t = 0; t < e.length; t++) {
    const { timestamp: n } = mr(e[t]);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};
function xb(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? mb, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, 96, {
    label: "ohlcRenderer/vsUniforms"
  }), c = new ArrayBuffer(96), u = new Float32Array(c), f = e.createBindGroup({
    layout: a,
    entries: [{ binding: 0, resource: { buffer: l } }]
  }), d = vn(
    e,
    {
      label: "ohlcRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: $u,
        label: "ohlc.wgsl",
        buffers: [
          {
            arrayStride: ws,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32", offset: 0 },
              { shaderLocation: 1, format: "float32", offset: 4 },
              { shaderLocation: 2, format: "float32", offset: 8 },
              { shaderLocation: 3, format: "float32", offset: 12 },
              { shaderLocation: 4, format: "float32", offset: 16 },
              { shaderLocation: 5, format: "float32", offset: 20 },
              { shaderLocation: 6, format: "float32x4", offset: 24 }
            ]
          }
        ]
      },
      fragment: {
        code: $u,
        label: "ohlc.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let m = null, p = 0, y = new ArrayBuffer(0), g = new Float32Array(y), S = 0, A = 0, M = null, h = null;
  const b = () => {
    if (n) throw new Error("OhlcRenderer is disposed.");
  }, v = (T) => {
    if (T <= g.length) return;
    const N = Math.max(8, xi(T));
    y = new ArrayBuffer(N * 4), g = new Float32Array(y);
  };
  return { prepare: (T, N, w, P, B) => {
    if (b(), N.length === 0) {
      p = 0, h = null;
      return;
    }
    const _ = ia(B);
    if (!_) {
      p = 0, h = null;
      return;
    }
    const C = ra(B), E = _.plotWidthCss > 0 ? C.width / _.plotWidthCss : 0;
    S = B.canvasWidth, A = B.canvasHeight, M = oa(B);
    const U = h && h.data === N ? h.categoryStep : hb(N), G = w.kind === "log" ? 0 : h && h.data === N ? h.packingOrigin : gb(N);
    let O, D;
    if (w.kind === "log") {
      const xe = xn(w);
      O = xe.a, D = xe.b;
    } else {
      const xe = Number.isFinite(U) && U > 0 ? U : 1, Pe = w.scale(G), Oe = w.scale(G + xe);
      O = Number.isFinite(Pe) && Number.isFinite(Oe) && xe !== 0 ? (Oe - Pe) / xe : 0, D = Number.isFinite(Pe) ? Pe : 0;
    }
    const { a: k, b: W } = xn(P), { logFlags: j, logBaseX: ee, logBaseY: fe } = Zn(w, P), X = _.plotHeightCss > 0 ? C.height / _.plotHeightCss : 0, { cssWidthToDomainX: z, cssHeightToDomainY: $ } = aa({
      xScale: w,
      yScale: P,
      ax: O,
      ay: k,
      clipPerCssX: E,
      clipPerCssY: X
    });
    let Z = 0;
    const Q = T.barWidth;
    if (typeof Q == "number")
      Z = z(Q);
    else if (typeof Q == "string") {
      const xe = dm(Q);
      Z = xe == null ? 0 : U * Or(xe);
    }
    const K = z(T.barMinWidth), ne = z(T.barMaxWidth);
    Z = Math.min(Math.max(Z, K), ne);
    const L = typeof T.stemWidth == "number" && Number.isFinite(T.stemWidth) && T.stemWidth > 0 ? T.stemWidth : pb, le = z(L), se = $(L);
    let ae;
    typeof T.tickLength == "number" && Number.isFinite(T.tickLength) && (ae = z(T.tickLength));
    const de = ob({
      tickLength: T.tickLength,
      bodyWidthDomain: Z,
      tickLengthAsDomain: ae
    }), re = T.itemStyle.upColor, ie = T.itemStyle.downColor, be = yb(N), te = h != null && m != null && h.data === N && h.dataLength === N.length && Qt(h.lastTimestamp, be.timestamp) && Qt(h.lastOpen, be.open) && Qt(h.lastClose, be.close) && Qt(h.lastLow, be.low) && Qt(h.lastHigh, be.high) && Qt(h.packingOrigin, G) && Qt(h.categoryStep, U) && Qt(h.bodyWidthDomain, Z) && Qt(h.tickLengthDomain, de) && h.upColor === re && h.downColor === ie, Be = Vr({
      residency: {
        kind: "privateInstance",
        gpuBuffer: m,
        pointCount: (h == null ? void 0 : h.instanceCount) ?? 0,
        contentVersion: 0,
        lastRef: (h == null ? void 0 : h.data) ?? null
      },
      dataRef: N,
      geometryCacheHit: te,
      appendedThisFrame: !1,
      needsGrowth: !1
    }), Me = new Uint32Array(c), _e = () => {
      sa(u, O, D, k, W), u[16] = le, u[17] = se, u[18] = ee, u[19] = fe, Me[20] = j >>> 0, Me[21] = 0, Me[22] = 0, Me[23] = 0, fn(e, l, c);
    };
    if (Be === "skip" && h) {
      p = h.instanceCount, _e();
      return;
    }
    const Le = qu(re), ge = qu(ie);
    _e(), v(N.length * tl);
    const Ee = g;
    let Se = 0;
    for (let xe = 0; xe < N.length; xe++) {
      const { timestamp: Pe, open: Oe, close: Xe, low: Ze, high: ze } = mr(N[xe]);
      if (!Number.isFinite(Pe) || !Number.isFinite(Oe) || !Number.isFinite(Xe) || !Number.isFinite(Ze) || !Number.isFinite(ze))
        continue;
      const Ue = rb(Oe, Xe) === "up", Ae = Pe - G, Qe = Ue ? Le : ge;
      Ee[Se + 0] = Ae, Ee[Se + 1] = Oe, Ee[Se + 2] = Xe, Ee[Se + 3] = Ze, Ee[Se + 4] = ze, Ee[Se + 5] = de, Ee[Se + 6] = Qe[0], Ee[Se + 7] = Qe[1], Ee[Se + 8] = Qe[2], Ee[Se + 9] = Qe[3], Se += tl;
    }
    p = Se / tl;
    const ve = Math.max(4, p * ws);
    if (!m || m.size < ve) {
      const xe = Math.max(Math.max(4, xi(ve)), m ? m.size : 0);
      if (m)
        try {
          m.destroy();
        } catch {
        }
      m = e.createBuffer({
        label: "ohlcRenderer/instanceBuffer",
        size: xe,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    p > 0 && e.queue.writeBuffer(m, 0, y, 0, p * ws), h = {
      data: N,
      dataLength: N.length,
      lastTimestamp: be.timestamp,
      lastOpen: be.open,
      lastClose: be.close,
      lastLow: be.low,
      lastHigh: be.high,
      packingOrigin: G,
      categoryStep: U,
      bodyWidthDomain: Z,
      tickLengthDomain: de,
      upColor: re,
      downColor: ie,
      instanceCount: p
    };
  }, invalidateGeometry: () => {
    h = null;
  }, render: (T) => {
    b(), !(!m || p === 0) && (M && S > 0 && A > 0 && T.setScissorRect(M.x, M.y, M.w, M.h), T.setPipeline(d), T.setBindGroup(0, f), T.setVertexBuffer(0, m), T.draw(18, p), M && S > 0 && A > 0 && T.setScissorRect(0, 0, S, A));
  }, dispose: () => {
    if (!n) {
      if (n = !0, m)
        try {
          m.destroy();
        } catch {
        }
      m = null, p = 0;
      try {
        l.destroy();
      } catch {
      }
      S = 0, A = 0, M = null, h = null;
    }
  } };
}
const ju = `// bar.wgsl
// Instanced bar/rect shader:
// - Per-instance vertex input:
//   - rect  = vec4<f32>(x, y, width, height) in DATA DOMAIN space
//   - color = vec4<f32>(r, g, b, a) in [0..1]
// - Draw call: draw(6, instanceCount) using triangle-list expansion in VS
// - Uniforms:
//   - @group(0) @binding(0): VSUniforms { transform }  // domain → clip affine mat4
//
// Rect corners are expanded in domain space, then mapped to clip via:
//   clip = transform * vec4(domainPos, 0, 1)
// where transform encodes xClip = ax*x + bx, yClip = ay*y + by.

struct VSUniforms {
  transform: mat4x4<f32>,
  // Independent bases so dual-log X/Y project correctly.
  logBaseX: f32,
  logBaseY: f32,
  // bit0 = log X, bit1 = log Y
  logFlags: u32,
  _pad0: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
  // rect.xy = origin (domain), rect.zw = size (domain width, domain height)
  @location(0) rect: vec4<f32>,
  @location(1) color: vec4<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vsMain(in: VSIn, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  // Fixed local corners for 2 triangles (triangle-list).
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0)
  );

  // Normalize negative width/height by computing min/max extents (domain space).
  let p0 = in.rect.xy;
  let p1 = in.rect.xy + in.rect.zw;
  let rectMin = min(p0, p1);
  let rectMax = max(p0, p1);
  let rectSize = rectMax - rectMin;

  let corner = corners[vertexIndex];
  let domainPos = rectMin + corner * rectSize;

  // Log projection per-corner (data-space rect → log space → clip affine).
  var pos = domainPos;
  let flags = vsUniforms.logFlags;
  if (flags != 0u) {
    if ((flags & 1u) != 0u) {
      if (pos.x <= 0.0) {
        var outBad: VSOut;
        outBad.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        outBad.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        return outBad;
      }
      pos.x = log(pos.x) / log(vsUniforms.logBaseX);
    }
    if ((flags & 2u) != 0u) {
      if (pos.y <= 0.0) {
        var outBad: VSOut;
        outBad.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        outBad.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        return outBad;
      }
      pos.y = log(pos.y) / log(vsUniforms.logBaseY);
    }
  }

  var out: VSOut;
  out.clipPosition = vsUniforms.transform * vec4<f32>(pos, 0.0, 1.0);
  out.color = in.color;
  return out;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  return in.color;
}
`, bb = "bgra8unorm", vb = 0.01, wb = 0.2, rr = 32, ro = rr / 4, nl = (e) => Math.min(1, Math.max(0, e)), Nb = (e) => wn(e) ?? [0, 0, 0, 1], Zu = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, Mb = (e, t, n, i, r) => {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
}, Sb = (e) => {
  const t = e.trim().match(/^(\d+(?:\.\d+)?)%$/);
  if (!t) return null;
  const n = Number(t[1]) / 100;
  return Number.isFinite(n) ? n : null;
}, oo = (e) => {
  if (typeof e != "string") return "";
  const t = e.trim();
  return t.length > 0 ? t : "";
}, Cb = (e) => {
  const t = e.devicePixelRatio;
  if (!(t > 0)) return null;
  const n = e.canvasWidth / t, i = e.canvasHeight / t, r = n - e.left - e.right, o = i - e.top - e.bottom;
  return !(r > 0) || !(o > 0) ? null : { plotWidthCss: r, plotHeightCss: o };
}, Fb = (e) => {
  const { left: t, right: n, top: i, bottom: r, canvasWidth: o, canvasHeight: s, devicePixelRatio: a } = e, l = t * a, c = o - n * a, u = i * a, f = s - r * a, d = l / o * 2 - 1, m = c / o * 2 - 1, p = 1 - u / s * 2, y = 1 - f / s * 2;
  return {
    left: d,
    right: m,
    top: p,
    bottom: y
  };
}, Ab = (e, t) => {
  const n = Math.max(1, Math.abs(e), Math.abs(t));
  return Math.abs(e - t) <= 1e-9 * n;
};
function Ib(e, t) {
  var fe;
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? bb, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = (fe = e.limits) == null ? void 0 : fe.maxBufferSize, l = typeof a == "number" && Number.isFinite(a) && a > 0 ? a : 256 * 1024 * 1024, c = Math.max(1, Math.floor(l / rr)), u = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), f = un(e, 80, {
    label: "barRenderer/vsUniforms"
  }), d = new ArrayBuffer(80), m = new Float32Array(d), p = new Uint32Array(d), y = e.createBindGroup({
    layout: u,
    entries: [{ binding: 0, resource: { buffer: f } }]
  }), g = vn(
    e,
    {
      label: "barRenderer/pipeline",
      bindGroupLayouts: [u],
      vertex: {
        code: ju,
        label: "bar.wgsl",
        buffers: [
          {
            arrayStride: rr,
            // rect vec4 + color vec4
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32x4", offset: 0 },
              { shaderLocation: 1, format: "float32x4", offset: 16 }
            ]
          }
        ]
      },
      fragment: {
        code: ju,
        label: "bar.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let S = null, A = 0, M = new ArrayBuffer(0), h = new Float32Array(M);
  const b = [];
  let v = null;
  const x = () => {
    if (n) throw new Error("BarRenderer is disposed.");
  }, F = (X) => {
    if (X <= h.length) return;
    const z = Math.max(8, Zu(X));
    M = new ArrayBuffer(z * 4), h = new Float32Array(M);
  };
  let I = Number.NaN, R = Number.NaN, T = Number.NaN, N = Number.NaN, w = 0, P = Number.NaN, B = Number.NaN;
  const _ = (X, z, $, Z, Q, K, ne) => {
    I === X && R === z && T === $ && N === Z && w === Q && P === K && B === ne || (Mb(m, X, z, $, Z), m[16] = K, m[17] = ne, p[18] = Q >>> 0, p[19] = 0, fn(e, f, d), I = X, R = z, T = $, N = Z, w = Q, P = K, B = ne);
  }, C = (X) => {
    let z = Number.POSITIVE_INFINITY, $ = 0, Z = !1;
    for (let K = 0; K < X.length; K++) {
      const ne = X[K].data, L = $e(ne);
      let le = Number.NaN;
      for (let se = 0; se < L; se++) {
        const ae = Te(ne, se);
        if (Number.isFinite(ae)) {
          if ($++, Number.isFinite(le)) {
            const de = ae - le;
            de > 0 && de < z ? z = de : de < 0 && (Z = !0);
          }
          le = ae;
        }
      }
    }
    if ($ < 2) return 1;
    if (!Z)
      return Number.isFinite(z) && z > 0 ? z : 1;
    b.length = 0;
    const Q = 5e4;
    for (let K = 0; K < X.length; K++) {
      const ne = X[K].data, L = $e(ne), le = L > Q ? Math.ceil(L / Q) : 1;
      for (let se = 0; se < L && b.length < Q; se += le) {
        const ae = Te(ne, se);
        Number.isFinite(ae) && b.push(ae);
      }
    }
    if (b.length < 2)
      return Number.isFinite(z) && z > 0 ? z : 1;
    b.sort((K, ne) => K - ne);
    for (let K = 1; K < b.length; K++) {
      const ne = b[K] - b[K - 1];
      ne > 0 && ne < z && (z = ne);
    }
    return Number.isFinite(z) && z > 0 ? z : 1;
  }, E = (X) => {
    let z, $, Z;
    for (let Q = 0; Q < X.length; Q++) {
      const K = X[Q];
      z === void 0 && K.barWidth !== void 0 && (z = K.barWidth), $ === void 0 && K.barGap !== void 0 && ($ = K.barGap), Z === void 0 && K.barCategoryGap !== void 0 && (Z = K.barCategoryGap);
    }
    return { barWidth: z, barGap: $, barCategoryGap: Z };
  }, U = (X) => {
    let z = Number.POSITIVE_INFINITY, $ = Number.NEGATIVE_INFINITY;
    for (let Z = 0; Z < X.length; Z++) {
      const Q = X[Z].data, K = $e(Q);
      for (let ne = 0; ne < K; ne++) {
        const L = ht(Q, ne);
        Number.isFinite(L) && (L < z && (z = L), L > $ && ($ = L));
      }
    }
    return !Number.isFinite(z) || !Number.isFinite($) || z <= 0 && 0 <= $ ? 0 : Math.abs(z) < Math.abs($) ? z : $;
  }, G = (X, z, $) => {
    const Z = z.invert($.bottom), Q = z.invert($.top), K = Math.min(Z, Q), ne = Math.max(Z, Q);
    return !Number.isFinite(K) || !Number.isFinite(ne) ? U(X) : K <= 0 && 0 <= ne ? 0 : K > 0 ? K : ne < 0 ? ne : U(X);
  }, O = (X, z, $, Z, Q, K, ne) => {
    const L = nl(z.barGap ?? vb), le = nl(z.barCategoryGap ?? wb);
    let se = 0;
    if (Number.isFinite(X) && X > 0)
      se = X;
    else {
      const Me = Z.invert(K.left), _e = Z.invert(K.right), Le = Math.abs(_e - Me), ge = Math.max(1, Math.floor(ne));
      se = Le > 0 ? Le / ge : 1;
    }
    const ae = Math.max(0, se * (1 - le)), de = $ + Math.max(0, $ - 1) * L, re = de > 0 ? ae / de : 0;
    let ie = 0;
    const be = z.barWidth;
    if (typeof be == "number") {
      const Me = K.right - K.left, _e = Q.plotWidthCss > 0 ? Me / Q.plotWidthCss : 0, Le = Math.max(0, be) * _e;
      if (Z.kind === "log") {
        const { min: ge, max: Ee } = Z.getDomain(), Se = Math.sqrt(Math.max(ge, Number.MIN_VALUE) * Math.max(Ee, Number.MIN_VALUE)), ve = Z.scale(Se), xe = Z.invert(ve - Le * 0.5), Pe = Z.invert(ve + Le * 0.5);
        ie = Number.isFinite(xe) && Number.isFinite(Pe) ? Math.abs(Pe - xe) : 0;
      } else {
        const { a: ge } = xn(Z), Ee = Math.abs(ge);
        ie = Ee > 0 && Number.isFinite(Ee) ? Le / Ee : 0;
      }
      ie = Math.min(ie, re);
    } else if (typeof be == "string") {
      const Me = Sb(be);
      ie = Me == null ? 0 : re * nl(Me);
    }
    ie > 0 || (ie = re);
    const te = ie * L, Be = $ * ie + Math.max(0, $ - 1) * te;
    return { barWidthDomain: ie, gapDomain: te, clusterWidthDomain: Be };
  }, D = (X, z) => {
    if (X.length !== z.seriesCount) return !1;
    for (let $ = 0; $ < X.length; $++) {
      const Z = X[$];
      if (Z.data !== z.dataRefs[$] || $e(Z.data) !== z.dataLengths[$] || Z.color !== z.colors[$] || oo(Z.stack) !== z.stacks[$]) return !1;
    }
    return !0;
  };
  return { prepare: (X, z, $, Z) => {
    x();
    const Q = () => {
      if (A = 0, v = null, S) {
        try {
          S.destroy();
        } catch {
        }
        S = null;
      }
    };
    if (X.length === 0) {
      Q();
      return;
    }
    const K = Cb(Z);
    if (!K) {
      Q();
      return;
    }
    const ne = Fb(Z), { a: L, b: le } = xn(z), { a: se, b: ae } = xn($), { logFlags: de, logBaseX: re, logBaseY: ie } = Zn(z, $);
    _(L, le, se, ae, de, re, ie);
    const be = L < 0 ? -1 : 1, te = /* @__PURE__ */ new Map(), Be = new Array(X.length);
    let Me = 0;
    for (let Ie = 0; Ie < X.length; Ie++) {
      const ke = oo(X[Ie].stack);
      if (ke !== "") {
        const Ke = te.get(ke);
        if (Ke !== void 0)
          Be[Ie] = Ke;
        else {
          const at = Me++;
          te.set(ke, at), Be[Ie] = at;
        }
      } else
        Be[Ie] = Me++;
    }
    Me = Math.max(1, Me);
    const _e = E(X);
    let Le = G(X, $, ne), ge = $.scale(Le);
    if ((!Number.isFinite(Le) || !Number.isFinite(ge)) && (Le = U(X), ge = $.scale(Le)), (!Number.isFinite(Le) || !Number.isFinite(ge)) && (Le = 0, ge = $.scale(0)), !Number.isFinite(Le) || !Number.isFinite(ge)) {
      Q();
      return;
    }
    const Ee = v != null && D(X, v);
    if (v && S && Ee && v.barWidth === _e.barWidth && v.barGap === _e.barGap && v.barCategoryGap === _e.barCategoryGap && v.clusterCount === Me && v.baselineDomain === Le && v.xDir === be) {
      let ke = !0;
      if (typeof _e.barWidth == "number") {
        const Ke = O(
          v.categoryStep,
          _e,
          Me,
          z,
          K,
          ne,
          1
        );
        ke = Ab(Ke.barWidthDomain, v.barWidthDomain);
      }
      if (ke) {
        A = v.instanceCount;
        return;
      }
    }
    let Se = 1;
    for (let Ie = 0; Ie < X.length; Ie++) {
      const ke = $e(X[Ie].data);
      Se = Math.max(Se, Math.floor(ke));
    }
    const ve = v && Ee ? v.categoryStep : C(X), { barWidthDomain: xe, gapDomain: Pe, clusterWidthDomain: Oe } = O(
      ve,
      _e,
      Me,
      z,
      K,
      ne,
      Se
    ), Xe = Math.max(1, X.length), Ze = Math.max(1, Math.floor(c / Xe)), ze = Math.min(c, Xe * Ze), Ue = new Array(X.length), Ae = /* @__PURE__ */ new Map();
    for (let Ie = 0; Ie < X.length; Ie++) {
      const ke = Math.max(0, $e(X[Ie].data));
      Ue[Ie] = ke;
      const Ke = oo(X[Ie].stack);
      if (Ke !== "") {
        const at = Ae.get(Ke) ?? 0;
        ke > at && Ae.set(Ke, ke);
      }
    }
    const Qe = new Array(X.length);
    for (let Ie = 0; Ie < X.length; Ie++) {
      const ke = oo(X[Ie].stack), Ke = ke !== "" ? Ae.get(ke) ?? Ue[Ie] : Ue[Ie];
      Qe[Ie] = Ke > Ze ? Math.ceil(Ke / Ze) : 1;
    }
    F(ze * ro);
    const At = h;
    let It = 0;
    const Tt = ze * ro, Ot = /* @__PURE__ */ new Map(), Ht = new Array(X.length), xt = new Array(X.length), $t = new Array(X.length), Mt = new Array(X.length);
    for (let Ie = 0; Ie < X.length; Ie++) {
      const ke = X[Ie], Ke = ke.data;
      Ht[Ie] = Ke, xt[Ie] = Ue[Ie], $t[Ie] = ke.color;
      const at = oo(ke.stack);
      Mt[Ie] = at;
      const [yt, mt, nt, ct] = Nb(ke.color), je = Be[Ie] ?? 0, pt = Ue[Ie], St = Qe[Ie], Zt = xe * St, Ge = Pe * St, Ye = Oe * St, rt = Math.min(Tt, It + Ze * ro);
      for (let bt = 0; bt < pt && !(It >= rt); bt += St) {
        const Dt = Te(Ke, bt), wt = ht(Ke, bt);
        if (!Number.isFinite(Dt) || !Number.isFinite(wt)) continue;
        const Yt = be < 0 ? Me - 1 - je : je, en = Dt - Ye / 2 + Yt * (Zt + Ge);
        let H = Le, q = 0;
        if (at !== "") {
          let ue = Ot.get(at);
          ue || (ue = /* @__PURE__ */ new Map(), Ot.set(at, ue));
          const he = rm(0, 0, Dt, ve);
          let Fe = ue.get(he);
          Fe || (Fe = { posSum: Le, negSum: Le }, ue.set(he, Fe));
          let et, pe;
          wt >= 0 ? (et = Fe.posSum, pe = et + wt, Fe.posSum = pe) : (et = Fe.negSum, pe = et + wt, Fe.negSum = pe), H = et, q = pe - et;
        } else
          q = wt - Le;
        At[It + 0] = en, At[It + 1] = H, At[It + 2] = Zt, At[It + 3] = q, At[It + 4] = yt, At[It + 5] = mt, At[It + 6] = nt, At[It + 7] = ct, It += ro;
      }
    }
    A = It / ro, A > c && (A = c);
    const we = Math.max(4, A * rr);
    if (!S || S.size < we) {
      let Ie = Math.max(Math.max(4, Zu(we)), S ? S.size : 0);
      if (Ie > l && (Ie = Math.min(l, Math.max(4, we))), Ie = Math.max(4, Math.ceil(Ie / 4) * 4), Ie > l && (Ie = Math.floor(l / 4) * 4), A * rr > Ie && (A = Math.floor(Ie / rr)), S)
        try {
          S.destroy();
        } catch {
        }
      S = e.createBuffer({
        label: "barRenderer/instanceBuffer",
        size: Ie,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    A > 0 && e.queue.writeBuffer(S, 0, M, 0, A * rr), v = {
      seriesCount: X.length,
      dataRefs: Ht,
      dataLengths: xt,
      colors: $t,
      stacks: Mt,
      barWidth: _e.barWidth,
      barGap: _e.barGap,
      barCategoryGap: _e.barCategoryGap,
      baselineDomain: Le,
      barWidthDomain: xe,
      categoryStep: ve,
      clusterCount: Me,
      xDir: be,
      instanceCount: A
    };
  }, invalidateGeometry: () => {
    v = null;
  }, render: (X) => {
    x(), !(!S || A === 0) && (X.setPipeline(g), X.setBindGroup(0, y), X.setVertexBuffer(0, S), X.draw(6, A));
  }, dispose: () => {
    if (!n) {
      if (n = !0, v = null, S)
        try {
          S.destroy();
        } catch {
        }
      S = null, A = 0;
      try {
        f.destroy();
      } catch {
      }
    }
  } };
}
const Ku = `// band.wgsl
// Band fill between two curves sharing x:
// - points[i] = BandPoint { x, y, y1, _pad } in data coords
// - Draw triangle-list with 6 vertices × (pointCount - 1) instances
//   (one trapezoid per consecutive pair between y and y1 curves)
// - Dual-endpoint NaN check collapses gap-spanning segments (matches area.wgsl).

struct VSUniforms {
  transform: mat4x4<f32>,
  // Unused pad kept so layout matches area VS for shared affine helpers.
  _padBaseline: f32,
  logBaseX: f32,
  logBaseY: f32,
  logFlags: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct FSUniforms {
  color: vec4<f32>,
};

@group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;

struct BandPoint {
  x: f32,
  y: f32,
  y1: f32,
  _pad: f32,
};

@group(0) @binding(2) var<storage, read> points: array<BandPoint>;

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
};

// 6 vertices of a segment quad between the two curves:
//   0: A y,  1: B y,  2: A y1
//   3: A y1, 4: B y,  5: B y1
// uv.x: 0 → endpoint A, 1 → endpoint B
// uv.y: 0 → y curve, 1 → y1 curve
fn segmentUv(vid: u32) -> vec2<f32> {
  switch (vid) {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    case 3u: { return vec2<f32>(0.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, 0.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

fn canLogProject(p: vec2<f32>) -> bool {
  let flags = vsUniforms.logFlags;
  if ((flags & 1u) != 0u && p.x <= 0.0) {
    return false;
  }
  if ((flags & 2u) != 0u && p.y <= 0.0) {
    return false;
  }
  return true;
}

fn projectData(p: vec2<f32>) -> vec2<f32> {
  let flags = vsUniforms.logFlags;
  if (flags == 0u) {
    return p;
  }
  var x = p.x;
  var y = p.y;
  if ((flags & 1u) != 0u) {
    x = log(x) / log(vsUniforms.logBaseX);
  }
  if ((flags & 2u) != 0u) {
    y = log(y) / log(vsUniforms.logBaseY);
  }
  return vec2<f32>(x, y);
}

@vertex
fn vsMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VSOut {
  var out: VSOut;
  let pA = points[instanceIndex];
  let pB = points[instanceIndex + 1u];

  // Dual-endpoint gap detection: any NaN in x/y/y1 at A or B discards the segment.
  // WGSL has no isnan(); use NaN != NaN.
  if (
    pA.x != pA.x || pA.y != pA.y || pA.y1 != pA.y1 ||
    pB.x != pB.x || pB.y != pB.y || pB.y1 != pB.y1
  ) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }

  let uv = segmentUv(vertexIndex);
  let x = select(pA.x, pB.x, uv.x > 0.5);
  let yCurve = select(pA.y, pB.y, uv.x > 0.5);
  let y1Curve = select(pA.y1, pB.y1, uv.x > 0.5);
  let y = select(yCurve, y1Curve, uv.y > 0.5);
  let domainPos = vec2<f32>(x, y);
  if (!canLogProject(domainPos)) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }
  let pos = projectData(domainPos);
  out.clipPosition = vsUniforms.transform * vec4<f32>(pos, 0.0, 1.0);
  return out;
}

@fragment
fn fsMain() -> @location(0) vec4<f32> {
  return fsUniforms.color;
}
`, Pb = "bgra8unorm", Ju = (e) => Math.min(1, Math.max(0, e)), Tb = (e) => wn(e) ?? [0, 0, 0, 1], es = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, Bb = (e, t, n, i, r) => {
  e[0] = t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = n, e[13] = r, e[14] = 0, e[15] = 1;
};
function Qu(e) {
  return e ? e.width > 0 && e.opacity > 0 : !1;
}
function Rb(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Pb, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" }
      }
    ]
  }), l = un(e, 80, {
    label: "bandRenderer/vsUniforms"
  }), c = un(e, 16, {
    label: "bandRenderer/fsUniforms"
  }), u = new ArrayBuffer(80), f = new Float32Array(u), d = new Uint32Array(u), m = new Float32Array(4), p = vn(
    e,
    {
      label: "bandRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: Ku,
        label: "band.wgsl"
      },
      fragment: {
        code: Ku,
        label: "band.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let y = null, g = null, S = null, A = 0, M = null, h = null, b = new Float32Array(0), v = !1, x = null, F = null, I = null, R = null, T = new Float32Array(0), N = !1, w = !1;
  const P = () => (x || (x = Rl(e, { targetFormat: i, pipelineCache: s, sampleCount: o })), x), B = () => (F || (F = Rl(e, { targetFormat: i, pipelineCache: s, sampleCount: o })), F), _ = () => {
    if (n) throw new Error("BandRenderer is disposed.");
  }, C = (re) => {
    re <= b.length || (b = new Float32Array(Math.max(8, es(re))));
  }, E = (re) => {
    re <= T.length || (T = new Float32Array(Math.max(8, es(re))));
  }, U = (re) => {
    const ie = Math.max(4, re);
    if (y && y.size >= ie) return;
    const be = Math.max(Math.max(4, es(ie)), y ? y.size : 0);
    if (y)
      try {
        y.destroy();
      } catch {
      }
    y = e.createBuffer({
      label: "bandRenderer/privatePoints",
      size: be,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
  }, G = (re, ie) => {
    const be = Math.max(4, ie), te = re === "y" ? I : R;
    if (te && te.size >= be) return te;
    const Be = Math.max(Math.max(4, es(be)), te ? te.size : 0);
    if (te)
      try {
        te.destroy();
      } catch {
      }
    const Me = e.createBuffer({
      label: re === "y" ? "bandRenderer/strokeY" : "bandRenderer/strokeY1",
      size: Be,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
    });
    return re === "y" ? I = Me : R = Me, Me;
  }, O = (re) => {
    S && g === re || (S = e.createBindGroup({
      layout: a,
      entries: [
        { binding: 0, resource: { buffer: l } },
        { binding: 1, resource: { buffer: c } },
        { binding: 2, resource: { buffer: re } }
      ]
    }), g = re);
  };
  let D = Number.NaN, k = Number.NaN, W = Number.NaN, j = Number.NaN, ee = 0, fe = Number.NaN, X = Number.NaN, z = Number.NaN, $ = Number.NaN, Z = Number.NaN, Q = Number.NaN;
  const K = (re, ie, be, te, Be, Me, _e) => {
    (D !== re || k !== ie || W !== be || j !== te || ee !== Be || fe !== Me || X !== _e) && (Bb(f, re, ie, be, te), f[16] = 0, f[17] = Me, f[18] = _e, d[19] = Be >>> 0, fn(e, l, u), D = re, k = ie, W = be, j = te, ee = Be, fe = Me, X = _e);
  }, ne = (re, ie) => {
    const be = ie === "y" ? re.lineStyle : re.lineStyleY1;
    return {
      type: "line",
      name: re.name,
      color: be.color,
      lineStyle: be,
      sampling: "none",
      samplingThreshold: re.samplingThreshold,
      connectNulls: re.connectNulls,
      data: [],
      rawData: [],
      yAxis: re.yAxis,
      visible: re.visible
    };
  };
  return { prepare: (re, ie, be, te, Be = 1, Me, _e) => {
    _(), v = !1;
    const Le = re.connectNulls ? Qp(ie) : ie, ge = yn(Le), Ee = Qu(re.lineStyle), Se = Qu(re.lineStyleY1);
    if (M !== ie || ge !== A) {
      C(ge * 4), Jp(Le, b, ge);
      const Mt = Math.max(4, ge * 16);
      U(Mt), ge > 0 && y && e.queue.writeBuffer(y, 0, b.buffer, b.byteOffset, ge * 16), A = ge, M = ie, v = !0, h = re.rawBounds ?? qn(Le) ?? null;
    }
    if (N = Ee, w = Se, (N || w) && ge > 0) {
      const Mt = N && (!I || v), we = w && (!R || v);
      if (Mt || we) {
        if (E(ge * 2), Mt) {
          Bc(Le, T, 0, ge);
          const Ie = G("y", ge * 8);
          e.queue.writeBuffer(Ie, 0, T.buffer, T.byteOffset, ge * 8);
        }
        if (we) {
          Bc(Le, T, 1, ge);
          const Ie = G("y1", ge * 8);
          e.queue.writeBuffer(Ie, 0, T.buffer, T.byteOffset, ge * 8);
        }
      }
    }
    y && O(y);
    const { xMin: ve, xMax: xe, yMin: Pe, yMax: Oe } = h ?? {
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1
    }, { a: Xe, b: Ze } = be.kind === "log" ? xn(be) : di(be, ve, xe), { a: ze, b: Ue } = te.kind === "log" ? xn(te) : di(te, Pe, Oe), { logFlags: Ae, logBaseX: Qe, logBaseY: At } = Zn(be, te);
    K(Xe, Ze, ze, Ue, Ae, Qe, At);
    const [It, Tt, Ot, Ht] = Tb(re.areaStyle.color), xt = Ju(re.areaStyle.opacity), $t = Ju(Ht * xt);
    (z !== It || $ !== Tt || Z !== Ot || Q !== $t) && (m[0] = It, m[1] = Tt, m[2] = Ot, m[3] = $t, fn(e, c, m), z = It, $ = Tt, Z = Ot, Q = $t), N && I && A >= 2 && P().prepare(
      ne(re, "y"),
      I,
      be,
      te,
      0,
      Be,
      Me,
      _e,
      A,
      1,
      { start: 0, capacity: 0 },
      !0
    ), w && R && A >= 2 && B().prepare(
      ne(re, "y1"),
      R,
      be,
      te,
      0,
      Be,
      Me,
      _e,
      A,
      1,
      { start: 0, capacity: 0 },
      !0
    );
  }, invalidateGeometry: () => {
    M = null, h = null;
  }, render: (re) => {
    if (_(), S && A >= 2) {
      const ie = A - 1;
      re.setPipeline(p), re.setBindGroup(0, S), re.draw(6, ie);
    }
    N && A >= 2 && x && x.render(re), w && A >= 2 && F && F.render(re);
  }, dispose: () => {
    if (!n) {
      n = !0, M = null, h = null, S = null, g = null, A = 0, b = new Float32Array(0), T = new Float32Array(0), x == null || x.dispose(), F == null || F.dispose(), x = null, F = null;
      for (const re of [y, I, R, l, c])
        if (re)
          try {
            re.destroy();
          } catch {
          }
      y = null, I = null, R = null;
    }
  }, didRewritePointsLastPrepare: () => v };
}
const Ws = `// errorBar.wgsl
// Instanced error bars (stem + high/low whisker caps + optional center marker):
// - Per-instance vertex input is in **relative domain space** (x = domainX - packingOrigin):
//   - x, y (center), high, low (4 floats)
//   - bodyColor rgba (4 floats)
// - Geometry expanded in relative domain; VSUniforms.transform maps → clip
//   with origin baked into the translation column (bx' = bx + ax * packingOrigin).
// - Vertical: stem thickness stemWidth in domain **X**; cap thickness capThickness in domain **Y**.
// - Horizontal: stem thickness stemWidth in domain **Y**; cap thickness capThickness in domain **X**.
// - Never reuse domain-X units as Y thickness (OHLC lesson).
// - Draw: draw(24, instanceCount) triangle-list
//   - vertices 0-5: stem
//   - vertices 6-11: high cap
//   - vertices 12-17: low cap
//   - vertices 18-23: center marker (square)

struct VSUniforms {
  transform: mat4x4<f32>,
  stemWidth: f32,       // full thickness (domain cross-axis of stem)
  capThickness: f32,    // full thickness of caps (domain along stem axis)
  capHalfLength: f32,   // half tip-to-tip cap length (domain along cap)
  symbolHalf: f32,      // half center marker size (domain square)
  logBaseX: f32,
  logBaseY: f32,
  // bit0 = log X, bit1 = log Y
  logFlags: u32,
  // bit0-1: errorMode 0=both 1=high 2=low
  // bit2: drawWhiskers
  // bit3: drawConnector
  // bit4: showCenter
  // bit5: direction horizontal (0=vertical)
  drawFlags: u32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
  @location(0) x: f32,
  @location(1) y: f32,
  @location(2) high: f32,
  @location(3) low: f32,
  @location(4) bodyColor: vec4<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) color: vec4<f32>,
};

fn quadCorners(idx: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0)
  );
  return corners[idx];
}

fn discardOut() -> VSOut {
  var outBad: VSOut;
  outBad.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outBad.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  return outBad;
}

@vertex
fn vsMain(in: VSIn, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  let flags = vsUniforms.drawFlags;
  let errorMode = flags & 3u;
  let drawWhiskers = (flags & 4u) != 0u;
  let drawConnector = (flags & 8u) != 0u;
  let showCenter = (flags & 16u) != 0u;
  let horizontal = (flags & 32u) != 0u;

  let stemHalf = vsUniforms.stemWidth * 0.5;
  let capHalfT = vsUniforms.capThickness * 0.5;
  let capHalfL = vsUniforms.capHalfLength;
  let symHalf = vsUniforms.symbolHalf;

  // Stem range by errorMode
  var stemA: f32;
  var stemB: f32;
  if (errorMode == 1u) {
    // high only: y → high
    stemA = in.y;
    stemB = in.high;
  } else if (errorMode == 2u) {
    // low only: low → y
    stemA = in.low;
    stemB = in.y;
  } else {
    stemA = in.low;
    stemB = in.high;
  }
  let stemLo = min(stemA, stemB);
  let stemHi = max(stemA, stemB);

  var pos: vec2<f32>;
  // Note: \`active\` is a WGSL reserved keyword — use drawPart.
  var drawPart = false;

  if (vertexIndex < 6u) {
    // Stem
    if (drawConnector) {
      drawPart = true;
      let corner = quadCorners(vertexIndex);
      if (horizontal) {
        let minP = vec2<f32>(stemLo, in.y - stemHalf);
        let maxP = vec2<f32>(stemHi, in.y + stemHalf);
        pos = minP + corner * (maxP - minP);
      } else {
        let minP = vec2<f32>(in.x - stemHalf, stemLo);
        let maxP = vec2<f32>(in.x + stemHalf, stemHi);
        pos = minP + corner * (maxP - minP);
      }
    }
  } else if (vertexIndex < 12u) {
    // High cap
    let drawHigh = drawWhiskers && (errorMode == 0u || errorMode == 1u);
    if (drawHigh) {
      drawPart = true;
      let idx = vertexIndex - 6u;
      let corner = quadCorners(idx);
      if (horizontal) {
        let minP = vec2<f32>(in.high - capHalfT, in.y - capHalfL);
        let maxP = vec2<f32>(in.high + capHalfT, in.y + capHalfL);
        pos = minP + corner * (maxP - minP);
      } else {
        let minP = vec2<f32>(in.x - capHalfL, in.high - capHalfT);
        let maxP = vec2<f32>(in.x + capHalfL, in.high + capHalfT);
        pos = minP + corner * (maxP - minP);
      }
    }
  } else if (vertexIndex < 18u) {
    // Low cap
    let drawLow = drawWhiskers && (errorMode == 0u || errorMode == 2u);
    if (drawLow) {
      drawPart = true;
      let idx = vertexIndex - 12u;
      let corner = quadCorners(idx);
      if (horizontal) {
        let minP = vec2<f32>(in.low - capHalfT, in.y - capHalfL);
        let maxP = vec2<f32>(in.low + capHalfT, in.y + capHalfL);
        pos = minP + corner * (maxP - minP);
      } else {
        let minP = vec2<f32>(in.x - capHalfL, in.low - capHalfT);
        let maxP = vec2<f32>(in.x + capHalfL, in.low + capHalfT);
        pos = minP + corner * (maxP - minP);
      }
    }
  } else {
    // Center marker (square)
    if (showCenter) {
      drawPart = true;
      let idx = vertexIndex - 18u;
      let corner = quadCorners(idx);
      let minP = vec2<f32>(in.x - symHalf, in.y - symHalf);
      let maxP = vec2<f32>(in.x + symHalf, in.y + symHalf);
      pos = minP + corner * (maxP - minP);
    }
  }

  if (!drawPart) {
    return discardOut();
  }

  let logF = vsUniforms.logFlags;
  if (logF != 0u) {
    if ((logF & 1u) != 0u) {
      if (pos.x <= 0.0) {
        return discardOut();
      }
      pos.x = log(pos.x) / log(vsUniforms.logBaseX);
    }
    if ((logF & 2u) != 0u) {
      if (pos.y <= 0.0) {
        return discardOut();
      }
      pos.y = log(pos.y) / log(vsUniforms.logBaseY);
    }
  }

  var out: VSOut;
  out.clipPosition = vsUniforms.transform * vec4<f32>(pos, 0.0, 1.0);
  out.color = in.bodyColor;
  return out;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  return in.color;
}
`;
function pm(e) {
  const t = e.defaultFraction ?? 0.4, n = Number.isFinite(e.categoryStep) ? Math.max(0, e.categoryStep) : 0;
  if (typeof e.capWidth == "number") {
    const i = e.capWidthAsDomain;
    return typeof i == "number" && Number.isFinite(i) ? Math.max(0, i) : Number.isFinite(e.capWidth) ? Math.max(0, e.capWidth) : 0;
  }
  if (typeof e.capWidth == "string") {
    const i = e.capWidth.trim().match(/^(\d+(?:\.\d+)?)%$/);
    if (i) {
      const r = Number(i[1]) / 100;
      if (Number.isFinite(r)) return n * Math.min(1, Math.max(0, r));
    }
    return Db(e.capWidth), n * t;
  }
  return n * t;
}
let ef = !1;
function Db(e) {
  ef || (ef = !0, console.warn(
    `ChartGPU: errorBar capWidth "${e}" is not a percent string (e.g. "40%") or CSS-px number; using default ${0.4 * 100}% of category step.`
  ));
}
function kb(e) {
  return !Number.isFinite(e) || e <= 0 ? 0 : e;
}
function Eb(e) {
  return kb(e) * 0.5;
}
function Lb(e, t) {
  return t === "high" ? { a: e.y, b: e.high } : t === "low" ? { a: e.low, b: e.y } : { a: e.low, b: e.high };
}
function Ub(e) {
  const t = e.errorMode ?? "both", n = e.drawWhiskers !== !1, i = e.drawConnector !== !1, r = e.direction ?? "vertical", o = Math.max(0, e.stemHalf), s = Math.max(0, e.capHalf), a = Math.max(0, e.capHalfThick), l = { x: e.x, y: e.y, high: e.high, low: e.low }, c = Lb(l, t), u = Math.min(c.a, c.b), f = Math.max(c.a, c.b);
  let d = null, m = null, p = null;
  return r === "horizontal" ? (i && (d = { minX: u, maxX: f, minY: e.y - o, maxY: e.y + o }), n && ((t === "both" || t === "high") && (m = {
    minX: e.high - a,
    maxX: e.high + a,
    minY: e.y - s,
    maxY: e.y + s
  }), (t === "both" || t === "low") && (p = {
    minX: e.low - a,
    maxX: e.low + a,
    minY: e.y - s,
    maxY: e.y + s
  }))) : (i && (d = { minX: e.x - o, maxX: e.x + o, minY: u, maxY: f }), n && ((t === "both" || t === "high") && (m = {
    minX: e.x - s,
    maxX: e.x + s,
    minY: e.high - a,
    maxY: e.high + a
  }), (t === "both" || t === "low") && (p = {
    minX: e.x - s,
    maxX: e.x + s,
    minY: e.low - a,
    maxY: e.low + a
  }))), { stem: d, highCap: m, lowCap: p };
}
function il(e, t, n) {
  return {
    minX: e.minX - t,
    maxX: e.maxX + t,
    minY: e.minY - n,
    maxY: e.maxY + n
  };
}
function _b(e, t, n) {
  return e >= n.minX && e <= n.maxX && t >= n.minY && t <= n.maxY;
}
const zb = "bgra8unorm", Gb = 1.5, Ns = 32, rl = Ns / 4, tf = 96, Ob = (e, t) => {
  const n = wn(e) ?? [0, 0, 0, 1], i = Or(n[3] * Or(t));
  return [n[0], n[1], n[2], i];
}, Hb = (e) => {
  const t = On(e);
  if (t === 0)
    return { x: Number.NaN, y: Number.NaN, high: Number.NaN, low: Number.NaN };
  const n = kn(e, t - 1);
  return n ? { x: n.x, y: n.y, high: n.high, low: n.low } : { x: Number.NaN, y: Number.NaN, high: Number.NaN, low: Number.NaN };
}, Yb = (e) => {
  const t = On(e);
  for (let n = 0; n < t; n++) {
    const i = kn(e, n);
    if (i && Number.isFinite(i.x)) return i.x;
  }
  return 0;
};
function Wb(e) {
  return e === "high" ? 1 : e === "low" ? 2 : 0;
}
function Xb(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? zb, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, tf, {
    label: "errorBarRenderer/vsUniforms"
  }), c = new ArrayBuffer(tf), u = new Float32Array(c), f = e.createBindGroup({
    layout: a,
    entries: [{ binding: 0, resource: { buffer: l } }]
  }), d = vn(
    e,
    {
      label: "errorBarRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: Ws,
        label: "errorBar.wgsl",
        buffers: [
          {
            arrayStride: Ns,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32", offset: 0 },
              { shaderLocation: 1, format: "float32", offset: 4 },
              { shaderLocation: 2, format: "float32", offset: 8 },
              { shaderLocation: 3, format: "float32", offset: 12 },
              { shaderLocation: 4, format: "float32x4", offset: 16 }
            ]
          }
        ]
      },
      fragment: {
        code: Ws,
        label: "errorBar.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let m = null, p = 0, y = new ArrayBuffer(0), g = new Float32Array(y), S = 0, A = 0, M = null, h = null, b = !1;
  const v = () => {
    if (n) throw new Error("ErrorBarRenderer is disposed.");
  }, x = (w) => {
    if (w <= g.length) return;
    const P = Math.max(8, xi(w));
    y = new ArrayBuffer(P * 4), g = new Float32Array(y);
  };
  return {
    prepare: (w, P, B, _, C) => {
      v();
      const E = On(P);
      if (E === 0) {
        p = 0, h = null;
        return;
      }
      const U = ia(C);
      if (!U) {
        p = 0, h = null;
        return;
      }
      const G = ra(C), O = U.plotWidthCss > 0 ? G.width / U.plotWidthCss : 0, D = U.plotHeightCss > 0 ? G.height / U.plotHeightCss : 0;
      S = C.canvasWidth, A = C.canvasHeight, M = oa(C);
      const k = w.direction === "horizontal", W = h && h.data === P && h.direction === w.direction ? h.categoryStep : Nl(P, w.direction), j = k ? Nl(P, "vertical") : W, ee = B.kind === "log" ? 0 : h && h.data === P ? h.packingOrigin : Yb(P);
      let fe, X;
      if (B.kind === "log") {
        const ze = xn(B);
        fe = ze.a, X = ze.b;
      } else {
        const ze = Number.isFinite(j) && j > 0 ? j : 1, Ue = B.scale(ee), Ae = B.scale(ee + ze);
        fe = Number.isFinite(Ue) && Number.isFinite(Ae) && ze !== 0 ? (Ae - Ue) / ze : 0, X = Number.isFinite(Ue) ? Ue : 0;
      }
      const { a: z, b: $ } = xn(_), { logFlags: Z, logBaseX: Q, logBaseY: K } = Zn(B, _), { cssWidthToDomainX: ne, cssHeightToDomainY: L } = aa({
        xScale: B,
        yScale: _,
        ax: fe,
        ay: z,
        clipPerCssX: O,
        clipPerCssY: D
      }), le = typeof w.itemStyle.borderWidth == "number" && Number.isFinite(w.itemStyle.borderWidth) && w.itemStyle.borderWidth > 0 ? w.itemStyle.borderWidth : Gb, se = k ? L(le) : ne(le), ae = k ? ne(le) : L(le);
      let de;
      typeof w.capWidth == "number" && Number.isFinite(w.capWidth) && (de = k ? L(w.capWidth) : ne(w.capWidth));
      const ie = pm({
        capWidth: w.capWidth,
        categoryStep: W,
        capWidthAsDomain: de
      }) * 0.5, be = w.capWidth ?? "40%", te = typeof w.symbolSize == "number" && Number.isFinite(w.symbolSize) && w.symbolSize > 0 ? w.symbolSize : 6, Be = Math.max(ne(te), L(te)) * 0.5, Me = w.itemStyle.color, _e = w.itemStyle.opacity, Le = Hb(P), ge = h != null && m != null && h.data === P && h.dataLength === E && Qt(h.lastX, Le.x) && Qt(h.lastY, Le.y) && Qt(h.lastHigh, Le.high) && Qt(h.lastLow, Le.low) && Qt(h.packingOrigin, ee) && Qt(h.categoryStep, W) && h.capWidthKey === be && h.color === Me && Qt(h.opacity, _e) && Qt(h.borderWidth, le) && h.errorMode === w.errorMode && h.direction === w.direction && h.drawWhiskers === w.drawWhiskers && h.drawConnector === w.drawConnector && h.showCenter === w.showCenter && Qt(h.symbolSize, te), Ee = Vr({
        residency: {
          kind: "privateInstance",
          gpuBuffer: m,
          pointCount: (h == null ? void 0 : h.instanceCount) ?? 0,
          contentVersion: 0,
          lastRef: (h == null ? void 0 : h.data) ?? null
        },
        dataRef: P,
        geometryCacheHit: ge,
        appendedThisFrame: !1,
        needsGrowth: !1
      });
      let Se = Wb(w.errorMode);
      w.drawWhiskers && (Se |= 4), w.drawConnector && (Se |= 8), w.showCenter && (Se |= 16), k && (Se |= 32);
      const ve = new Uint32Array(c), xe = () => {
        sa(u, fe, X, z, $), u[16] = se, u[17] = ae, u[18] = ie, u[19] = Be, u[20] = Q, u[21] = K, ve[22] = Z >>> 0, ve[23] = Se >>> 0, fn(e, l, c);
      };
      if (Ee === "skip" && h) {
        p = h.instanceCount, b = !1, xe();
        return;
      }
      b = !0;
      const Pe = Ob(Me, _e);
      xe(), x(E * rl);
      const Oe = g;
      let Xe = 0;
      for (let ze = 0; ze < E; ze++) {
        const Ue = kn(P, ze);
        if (!Td(Ue, w.errorMode)) continue;
        const Ae = Ue.x - ee, Qe = k ? Ue.high - ee : Ue.high, At = k ? Ue.low - ee : Ue.low;
        Oe[Xe + 0] = Ae, Oe[Xe + 1] = Ue.y, Oe[Xe + 2] = Qe, Oe[Xe + 3] = At, Oe[Xe + 4] = Pe[0], Oe[Xe + 5] = Pe[1], Oe[Xe + 6] = Pe[2], Oe[Xe + 7] = Pe[3], Xe += rl;
      }
      p = Xe / rl;
      const Ze = Math.max(4, p * Ns);
      if (!m || m.size < Ze) {
        const ze = Math.max(Math.max(4, xi(Ze)), m ? m.size : 0);
        if (m)
          try {
            m.destroy();
          } catch {
          }
        m = e.createBuffer({
          label: "errorBarRenderer/instanceBuffer",
          size: ze,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
      }
      p > 0 && e.queue.writeBuffer(m, 0, y, 0, p * Ns), h = {
        data: P,
        dataLength: E,
        lastX: Le.x,
        lastY: Le.y,
        lastHigh: Le.high,
        lastLow: Le.low,
        packingOrigin: ee,
        categoryStep: W,
        capWidthKey: be,
        color: Me,
        opacity: _e,
        borderWidth: le,
        errorMode: w.errorMode,
        direction: w.direction,
        drawWhiskers: w.drawWhiskers,
        drawConnector: w.drawConnector,
        showCenter: w.showCenter,
        symbolSize: te,
        instanceCount: p
      };
    },
    invalidateGeometry: () => {
      h = null;
    },
    render: (w) => {
      v(), !(!m || p === 0) && (M && S > 0 && A > 0 && w.setScissorRect(M.x, M.y, M.w, M.h), w.setPipeline(d), w.setBindGroup(0, f), w.setVertexBuffer(0, m), w.draw(24, p), M && S > 0 && A > 0 && w.setScissorRect(0, 0, S, A));
    },
    dispose: () => {
      if (!n) {
        if (n = !0, m)
          try {
            m.destroy();
          } catch {
          }
        m = null, p = 0;
        try {
          l.destroy();
        } catch {
        }
        S = 0, A = 0, M = null, h = null;
      }
    },
    // Test/diagnostic hook (not part of public ErrorBarRenderer surface in types, but present on instance)
    didRewritePointsLastPrepare: () => b
  };
}
const Vb = "bgra8unorm", $b = 2, Ms = 32, ol = Ms / 4, nf = 96, qb = (e, t) => {
  const n = wn(e) ?? [0, 0, 0, 1], i = Or(n[3] * Or(t));
  return [n[0], n[1], n[2], i];
}, jb = (e) => {
  const t = $e(e);
  return t === 0 ? { x: Number.NaN, y: Number.NaN } : { x: Te(e, t - 1), y: ht(e, t - 1) };
}, Zb = (e) => {
  const t = $e(e);
  for (let n = 0; n < t; n++) {
    const i = Te(e, n);
    if (Number.isFinite(i)) return i;
  }
  return 0;
};
function Kb(e) {
  return e ? 24 : 8;
}
function Jb(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Vb, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, nf, {
    label: "impulseRenderer/vsUniforms"
  }), c = new ArrayBuffer(nf), u = new Float32Array(c), f = e.createBindGroup({
    layout: a,
    entries: [{ binding: 0, resource: { buffer: l } }]
  }), d = vn(
    e,
    {
      label: "impulseRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: Ws,
        label: "errorBar.wgsl",
        buffers: [
          {
            arrayStride: Ms,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32", offset: 0 },
              { shaderLocation: 1, format: "float32", offset: 4 },
              { shaderLocation: 2, format: "float32", offset: 8 },
              { shaderLocation: 3, format: "float32", offset: 12 },
              { shaderLocation: 4, format: "float32x4", offset: 16 }
            ]
          }
        ]
      },
      fragment: {
        code: Ws,
        label: "errorBar.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let m = null, p = 0, y = new ArrayBuffer(0), g = new Float32Array(y), S = 0, A = 0, M = null, h = null, b = !1;
  const v = () => {
    if (n) throw new Error("ImpulseRenderer is disposed.");
  }, x = (w) => {
    if (w <= g.length) return;
    const P = Math.max(8, xi(w));
    y = new ArrayBuffer(P * 4), g = new Float32Array(y);
  };
  return {
    prepare: (w, P, B, _, C) => {
      v();
      const E = $e(P);
      if (E === 0) {
        p = 0, h = null;
        return;
      }
      const U = ia(C);
      if (!U) {
        p = 0, h = null;
        return;
      }
      const G = ra(C), O = U.plotWidthCss > 0 ? G.width / U.plotWidthCss : 0, D = U.plotHeightCss > 0 ? G.height / U.plotHeightCss : 0;
      S = C.canvasWidth, A = C.canvasHeight, M = oa(C);
      const k = B.kind === "log" ? 0 : h && h.data === P ? h.packingOrigin : Zb(P);
      let W, j;
      if (B.kind === "log") {
        const Oe = xn(B);
        W = Oe.a, j = Oe.b;
      } else {
        const Oe = B.scale(k), Xe = B.scale(k + 1);
        W = Number.isFinite(Oe) && Number.isFinite(Xe) ? Xe - Oe : 0, j = Number.isFinite(Oe) ? Oe : 0;
      }
      const { a: ee, b: fe } = xn(_), { logFlags: X, logBaseX: z, logBaseY: $ } = Zn(B, _), { cssWidthToDomainX: Z, cssHeightToDomainY: Q } = aa({
        xScale: B,
        yScale: _,
        ax: W,
        ay: ee,
        clipPerCssX: O,
        clipPerCssY: D
      }), K = typeof w.lineStyle.width == "number" && Number.isFinite(w.lineStyle.width) && w.lineStyle.width > 0 ? w.lineStyle.width : $b, ne = Z(K), L = Q(K), le = 0, se = typeof w.symbolSize == "number" && Number.isFinite(w.symbolSize) && w.symbolSize > 0 ? w.symbolSize : 6, ae = Math.max(Z(se), Q(se)) * 0.5, de = w.lineStyle.color, re = w.lineStyle.opacity, ie = Number.isFinite(w.baseline) ? w.baseline : 0, be = w.showMarker !== !1, te = jb(P), Be = h != null && m != null && h.data === P && h.dataLength === E && Qt(h.lastX, te.x) && Qt(h.lastY, te.y) && Qt(h.packingOrigin, k) && h.color === de && Qt(h.opacity, re) && Qt(h.borderWidth, K) && Qt(h.baseline, ie) && h.showMarker === be && Qt(h.symbolSize, se), Me = Vr({
        residency: {
          kind: "privateInstance",
          gpuBuffer: m,
          pointCount: (h == null ? void 0 : h.instanceCount) ?? 0,
          contentVersion: 0,
          lastRef: (h == null ? void 0 : h.data) ?? null
        },
        dataRef: P,
        geometryCacheHit: Be,
        appendedThisFrame: !1,
        needsGrowth: !1
      }), _e = Kb(be), Le = new Uint32Array(c), ge = () => {
        sa(u, W, j, ee, fe), u[16] = ne, u[17] = L, u[18] = le, u[19] = ae, u[20] = z, u[21] = $, Le[22] = X >>> 0, Le[23] = _e >>> 0, fn(e, l, c);
      };
      if (Me === "skip" && h) {
        p = h.instanceCount, b = !1, ge();
        return;
      }
      b = !0;
      const Ee = qb(de, re);
      ge(), x(E * ol);
      const Se = g;
      let ve = 0;
      const xe = 1e-15;
      for (let Oe = 0; Oe < E; Oe++) {
        const Xe = Te(P, Oe), Ze = ht(P, Oe);
        if (!Number.isFinite(Xe) || !Number.isFinite(Ze) || Math.abs(Ze - ie) <= xe && !be) continue;
        const Ue = Xe - k;
        Se[ve + 0] = Ue, Se[ve + 1] = Ze, Se[ve + 2] = Ze, Se[ve + 3] = ie, Se[ve + 4] = Ee[0], Se[ve + 5] = Ee[1], Se[ve + 6] = Ee[2], Se[ve + 7] = Ee[3], ve += ol;
      }
      p = ve / ol;
      const Pe = Math.max(4, p * Ms);
      if (!m || m.size < Pe) {
        const Oe = Math.max(Math.max(4, xi(Pe)), m ? m.size : 0);
        if (m)
          try {
            m.destroy();
          } catch {
          }
        m = e.createBuffer({
          label: "impulseRenderer/instanceBuffer",
          size: Oe,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
      }
      p > 0 && e.queue.writeBuffer(m, 0, y, 0, p * Ms), h = {
        data: P,
        dataLength: E,
        lastX: te.x,
        lastY: te.y,
        packingOrigin: k,
        color: de,
        opacity: re,
        borderWidth: K,
        baseline: ie,
        showMarker: be,
        symbolSize: se,
        instanceCount: p
      };
    },
    invalidateGeometry: () => {
      h = null;
    },
    render: (w) => {
      v(), !(!m || p === 0) && (M && S > 0 && A > 0 && w.setScissorRect(M.x, M.y, M.w, M.h), w.setPipeline(d), w.setBindGroup(0, f), w.setVertexBuffer(0, m), w.draw(24, p), M && S > 0 && A > 0 && w.setScissorRect(0, 0, S, A));
    },
    dispose: () => {
      if (!n) {
        if (n = !0, m)
          try {
            m.destroy();
          } catch {
          }
        m = null, p = 0;
        try {
          l.destroy();
        } catch {
        }
        S = 0, A = 0, M = null, h = null;
      }
    },
    didRewritePointsLastPrepare: () => b
  };
}
const Qb = `// decimation.wgsl — GPU-side line-series decimation (downsampling).
//
// Three compute entry points, all at \`@workgroup_size(64)\` (the portable
// sweet-spot recommended by the WebGPU fundamentals compute-shader lesson).
//
// Output contract (shared across entry points):
//   output[0]               = raw[visibleStart]                  (first anchor, fixed)
//   output[targetBuckets-1] = raw[visibleEnd - 1]                (last anchor, fixed)
//   output[1..targetBuckets-2] = one decimated point per interior bucket
//
// Total output point count = \`targetBuckets\`. The caller draws \`targetBuckets\`
// vertices as a connected line strip of segments.
//
// Interior bucket index convention:
//   "interior bucket b" ∈ [0, targetBuckets - 2), covering raw index range
//     rangeStart = visibleStart + 1 + floor(span * b       / (targetBuckets - 2))
//     rangeEnd   = visibleStart + 1 + floor(span * (b + 1) / (targetBuckets - 2))
//   where \`span = (visibleEnd - visibleStart) - 2\`.
//
// Entry points:
//   1. \`minMaxDecimate\` — per-bucket argmin or argmax on y, mode bit 0 picks
//      min (0) vs max (1). Emits one point per bucket.
//   2. \`computeBucketAverages\` — per-bucket mean written into \`averages\`, used
//      as the stable anchor set for the parallel-LTTB pass.
//   3. \`parallelLttbDecimate\` — per-bucket triangle-area maximization where
//      the anchor is \`averages[b - 1]\` and the next reference is
//      \`averages[b + 1]\`. Standard "parallel LTTB" variant.
//
// Uniformity notes (Tint is strict):
//   - \`workgroup_id.x\` is uniform within a workgroup; it's safe to use as a
//     condition that gates a barrier.
//   - Every \`workgroupBarrier()\` in this file is reached by ALL threads of the
//     workgroup (no partial-workgroup returns before a barrier).

struct DecimationUniforms {
  rawPointCount : u32,
  visibleStart  : u32,
  visibleEnd    : u32,
  targetBuckets : u32,
  // Mode bit 0: 0 = min, 1 = max. Only consulted by min/max entry points.
  mode          : u32,
  // Fixed-capacity ring FIFO: physical index of the oldest logical point.
  // When ringCapacity == 0, raw storage is linear chronological (raw[i] = logical i).
  ringStart     : u32,
  ringCapacity  : u32,
  // Bit 0: hierarchy present path is active for this encode (TS sets from policy).
  hierarchyFlags : u32,
  // Number of valid physical tiles in \`tiles\` storage (ceil(physicalCap / 1024)).
  tileCount     : u32,
  // Physical capacity used to bound tile physical ranges (ringCapacity or N).
  physicalCapacity : u32,
  pad1          : u32,
  pad2          : u32,
};

// Physical tile aggregate (matches decimationHierarchy.wgsl \`Tile\`, 32 bytes).
struct HierarchyTile {
  minY   : f32,
  maxY   : f32,
  minIdx : u32,
  maxIdx : u32,
  sumX   : f32,
  sumY   : f32,
  count  : u32,
  pad    : u32,
};

@group(0) @binding(0) var<uniform> uni : DecimationUniforms;
@group(0) @binding(1) var<storage, read> rawPoints : array<vec2<f32>>;
@group(0) @binding(2) var<storage, read_write> output : array<vec2<f32>>;
@group(0) @binding(3) var<storage, read_write> averages : array<vec2<f32>>;
// Hierarchy tiles (physical). Always bound; legacy entry points ignore them.
@group(0) @binding(4) var<storage, read> tiles : array<HierarchyTile>;

// Map a chronological (logical) raw index into physical storage. Ring mode
// stores points modularly after FIFO wrap; linear mode is a no-op.
//
// Full-ring FIFO (suite G7 steady state): logicalIdx < ringCapacity, so
// ringStart + logicalIdx wraps **at most once**. Prefer a compare + subtract
// over \`%\` — integer modulo is expensive in the dense LTTB candidate loop
// (Phase B multi-M).
fn rawAt(logicalIdx : u32) -> vec2<f32> {
  if (uni.ringCapacity == 0u) {
    return rawPoints[logicalIdx];
  }
  let sum = uni.ringStart + logicalIdx;
  let phys = select(sum, sum - uni.ringCapacity, sum >= uni.ringCapacity);
  return rawPoints[phys];
}

// Shared-memory scratchpads for the intra-workgroup reductions. Sized to the
// literal workgroup width (64) so WGSL front-ends don't have to resolve a
// module-scope \`const\` into the array size.
var<workgroup> sharedIdx   : array<u32, 64>;
var<workgroup> sharedScore : array<f32, 64>;
var<workgroup> sharedSumX  : array<f32, 64>;
var<workgroup> sharedSumY  : array<f32, 64>;
var<workgroup> sharedCount : array<u32, 64>;

// floor(a * b / denom) for u32 without intermediate overflow.
//
// Direct \`(span * bucketId) / interior\` wraps at 2^32 when the product exceeds
// ~4.29e9. With default samplingThreshold=5000 (interior=4998) that first
// hits around visible span ≈ 859k points — the ultimate-benchmark "cut":
// early buckets stay correct (dense band on the left) while later buckets
// map to the wrong raw indices (thin wrong stroke on the right).
//
// Identity: floor(a*b/d) = floor(a/d)*b + floor((a%d)*b/d).
// Call sites pass b ≤ denom (bucketId ≤ interior), so floor(a/d)*b ≤ a.
fn umul64(a : u32, b : u32) -> vec2<u32> {
  // Returns (hi, lo) of the full 64-bit product a*b.
  let aLo = a & 0xFFFFu;
  let aHi = a >> 16u;
  let bLo = b & 0xFFFFu;
  let bHi = b >> 16u;
  let p0 = aLo * bLo;
  let p1 = aLo * bHi;
  let p2 = aHi * bLo;
  let p3 = aHi * bHi;
  let mid = (p0 >> 16u) + (p1 & 0xFFFFu) + (p2 & 0xFFFFu);
  let lo = (p0 & 0xFFFFu) | ((mid & 0xFFFFu) << 16u);
  let hi = p3 + (p1 >> 16u) + (p2 >> 16u) + (mid >> 16u);
  return vec2<u32>(hi, lo);
}

// floor((hi<<32 | lo) / d) as u32. Requires the true quotient to fit in 32 bits.
// Uses 32-step restoring division with remainder always < d (so rem*2 fits
// whenever d ≤ 2^31 — true for all ChartGPU bucket counts).
fn udiv64by32(hi : u32, lo : u32, d : u32) -> u32 {
  if (d == 0u) {
    return 0u;
  }
  var rem = hi % d;
  var quot : u32 = 0u;
  for (var i = 0u; i < 32u; i = i + 1u) {
    let bit = 31u - i;
    let loBit = (lo >> bit) & 1u;
    // rem < d ⇒ rem*2 + loBit < 2*d ≤ 2^32 when d ≤ 2^31.
    let candidate = rem * 2u + loBit;
    quot = quot << 1u;
    if (candidate >= d) {
      rem = candidate - d;
      quot = quot | 1u;
    } else {
      rem = candidate;
    }
  }
  return quot;
}

fn mulDivU32(a : u32, b : u32, denom : u32) -> u32 {
  if (denom == 0u || a == 0u || b == 0u) {
    return 0u;
  }
  // Fast path: a*b fits in u32.
  if (a <= 0xFFFFFFFFu / b) {
    return (a * b) / denom;
  }
  let q = a / denom;
  let r = a % denom;
  let main = q * b;
  if (r == 0u) {
    return main;
  }
  // Remainder term: floor(r*b/denom). Prefer direct mul when it fits.
  if (r <= 0xFFFFFFFFu / b) {
    return main + (r * b) / denom;
  }
  let prod = umul64(r, b);
  return main + udiv64by32(prod.x, prod.y, denom);
}

// Max raw points examined per interior bucket. When the bucket range is
// larger, candidates are uniformly subsampled (including endpoints).
//
// Rationale (FIFO extreme-N, e.g. 5M–10M × 5 series, samplingThreshold=2500):
//   Parallel LTTB otherwise full-scans the visible span twice per series
//   (~100M raw reads/frame at 10M×5). Cap keeps quality on dense waveforms
//   while bounding GPU bandwidth so period=1 (G2) stays interactive.
//
// At 1M × 2500 buckets ≈ 400 pts/bucket → full scan (exact; no 1M×5 regression).
// At 5M ≈ 2000 pts/bucket → DENSE_MAX candidates (~4× less bandwidth than a
//   512-cap; ~16× less than an uncapped scan).
// At 10M ≈ 4000 pts/bucket → same DENSE_MAX cap.
//
// **Approximation (all three entry points when rangeLen > 512):**
//   - LTTB / averages: triangle-area / mean over the uniform candidate set.
//   - min/max: argmin/argmax over candidates only — not the true bucket
//     extremum. Dense ECG/noise still preserves peaks well at 128 samples.
//   - Averages at extreme density use an even tighter set (see
//     bucketAverageCandidateCount) — coarse anchors are enough for parallel
//     LTTB while nearly free vs a second full candidate scan.
//
// Literal (not module const) so Chrome's WGSL front-end never couples this
// to workgroup_size / array-size resolution (see AGENTS.md WG_SIZE note).
//
// Map candidate index s ∈ [0, candCount) → raw index in [rangeStart, rangeEnd).
fn candidateRawIndex(rangeStart : u32, rangeLen : u32, s : u32, candCount : u32) -> u32 {
  if (candCount <= 1u || rangeLen <= 1u) {
    return rangeStart;
  }
  if (candCount >= rangeLen) {
    return rangeStart + s;
  }
  // Uniform including endpoints: floor(s * (rangeLen - 1) / (candCount - 1)).
  return rangeStart + mulDivU32(rangeLen - 1u, s, candCount - 1u);
}

// Exact scan while pts/bucket ≤ 512 (covers 1M×2500 ≈ 400). Above that,
// Phase B tight cap (128) for honest every-frame LTTB bandwidth.
// Shared by min/max + LTTB selection. Averages use bucketAverageCandidateCount.
fn bucketCandidateCount(rangeLen : u32) -> u32 {
  if (rangeLen > 512u) {
    return 128u;
  }
  return rangeLen;
}

// Averages only need coarse triangle anchors. At extreme density, scan far
// fewer points than LTTB selection (still endpoint-inclusive via candidateRawIndex).
fn bucketAverageCandidateCount(rangeLen : u32) -> u32 {
  if (rangeLen > 512u) {
    return 64u;
  }
  return rangeLen;
}

// Interior-bucket raw-index range, exclusive upper bound. Guarantees a
// non-empty range so reductions always have at least one candidate.
fn interiorBucketRange(bucketId : u32) -> vec2<u32> {
  let visStart = uni.visibleStart;
  let visEnd   = uni.visibleEnd;
  let buckets  = uni.targetBuckets;

  var result : vec2<u32> = vec2<u32>(visStart, visStart);

  if (buckets >= 3u && visEnd >= visStart + 2u) {
    let span     = visEnd - visStart - 2u;
    let interior = buckets - 2u;
    // Overflow-safe: see mulDivU32 (span*bucket u32 wrap).
    let lo       = visStart + 1u + mulDivU32(span, bucketId, interior);
    let hi       = visStart + 1u + mulDivU32(span, bucketId + 1u, interior);

    let maxIdx = visEnd - 1u;
    var loClamped = lo;
    if (loClamped > maxIdx) {
      loClamped = maxIdx;
    }
    var hiClamped = hi;
    if (hiClamped > maxIdx) {
      hiClamped = maxIdx;
    }
    if (hiClamped <= loClamped) {
      hiClamped = loClamped + 1u;
    }
    result = vec2<u32>(loClamped, hiClamped);
  }

  return result;
}

// WGSL has no isnan(); x != x is the IEEE-754 way to detect NaN.
fn isFiniteVec2(v : vec2<f32>) -> bool {
  return v.x == v.x && v.y == v.y;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point 1: min/max per-bucket (argmin or argmax on y).
// Dispatched with \`max(targetBuckets - 2, 1)\` workgroups.
// ─────────────────────────────────────────────────────────────────────────────

@compute @workgroup_size(64)
fn minMaxDecimate(
  @builtin(workgroup_id) wgid : vec3<u32>,
  @builtin(local_invocation_id) lid : vec3<u32>,
) {
  let tid      = lid.x;
  let bucketId = wgid.x;
  let buckets  = uni.targetBuckets;
  let visStart = uni.visibleStart;
  let visEnd   = uni.visibleEnd;

  // Thread 0 of workgroup 0 writes the two fixed anchors (first/last points).
  // Writes are scalar; no barrier interaction.
  if (bucketId == 0u && tid == 0u && buckets >= 1u && visEnd > visStart) {
    output[0] = rawAt(visStart);
    if (buckets >= 2u) {
      output[buckets - 1u] = rawAt(visEnd - 1u);
    }
  }

  let range      = interiorBucketRange(bucketId);
  let rangeStart = range.x;
  let rangeEnd   = range.y;
  let wantMax    = (uni.mode & 1u) == 1u;

  // Sentinel initialization: start at opposite extreme of what we're seeking.
  var bestY   : f32 = 3.4e38;
  if (wantMax) {
    bestY = -3.4e38;
  }
  var bestIdx : u32 = rangeStart;

  // Stride over candidates in workgroup-sized chunks (64 threads each).
  // Oversized buckets are uniformly subsampled (see bucketCandidateCount).
  // Degenerate empty range → candCount 0 → every thread skips; reduction safe.
  let rangeLenMm = rangeEnd - rangeStart;
  let candCountMm = bucketCandidateCount(rangeLenMm);
  var sMm : u32 = tid;
  while (sMm < candCountMm) {
    let i = candidateRawIndex(rangeStart, rangeLenMm, sMm, candCountMm);
    let p = rawAt(i);
    if (isFiniteVec2(p)) {
      if (wantMax) {
        if (p.y > bestY) {
          bestY = p.y;
          bestIdx = i;
        }
      } else {
        if (p.y < bestY) {
          bestY = p.y;
          bestIdx = i;
        }
      }
    }
    sMm = sMm + 64u;
  }

  sharedScore[tid] = bestY;
  sharedIdx[tid]   = bestIdx;
  workgroupBarrier();

  // Tree reduction (workgroup size is a power of two — 64).
  var stride : u32 = 32u;
  while (stride > 0u) {
    if (tid < stride) {
      let otherScore = sharedScore[tid + stride];
      let otherIdx   = sharedIdx[tid + stride];
      let mine       = sharedScore[tid];
      var take : bool = false;
      if (wantMax) {
        take = otherScore > mine;
      } else {
        take = otherScore < mine;
      }
      if (take) {
        sharedScore[tid] = otherScore;
        sharedIdx[tid]   = otherIdx;
      }
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  // Only workgroups that correspond to actual interior buckets write an output.
  // Workgroup id 0 maps to interior bucket 0 → output slot 1. The last
  // dispatched workgroup maps to interior bucket (buckets - 3) → slot buckets-2.
  if (tid == 0u && buckets >= 3u && bucketId <= buckets - 3u) {
    output[bucketId + 1u] = rawAt(sharedIdx[0]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point 2: per-bucket averages (pre-pass for parallel LTTB).
// Dispatched with \`targetBuckets\` workgroups.
//
// Workgroup 0 writes averages[0] = raw[visibleStart] (first anchor).
// Workgroup (targetBuckets - 1) writes averages[last] = raw[visibleEnd - 1].
// Interior workgroups compute the mean of raw points in their interior bucket.
// ─────────────────────────────────────────────────────────────────────────────

@compute @workgroup_size(64)
fn computeBucketAverages(
  @builtin(workgroup_id) wgid : vec3<u32>,
  @builtin(local_invocation_id) lid : vec3<u32>,
) {
  let tid      = lid.x;
  let bucketId = wgid.x;
  let buckets  = uni.targetBuckets;
  let visStart = uni.visibleStart;
  let visEnd   = uni.visibleEnd;

  // Partition: isFirstAnchor (bucket 0), isLastAnchor (bucket last), else
  // interior. All three branches are uniform per workgroup because \`bucketId\`
  // and \`buckets\` are both workgroup-uniform.
  let isFirstAnchor = buckets >= 1u && bucketId == 0u;
  let isLastAnchor  = buckets >= 2u && bucketId + 1u == buckets;
  let isInterior    = buckets >= 3u && bucketId >= 1u && bucketId + 1u < buckets;

  // Anchor writes are single-scalar, so a non-uniform guard on tid is fine.
  if (isFirstAnchor && tid == 0u && visEnd > visStart) {
    averages[0] = rawAt(visStart);
  }
  if (isLastAnchor && tid == 0u && visEnd > visStart) {
    averages[buckets - 1u] = rawAt(visEnd - 1u);
  }

  // Interior bucket reduction. Even when !isInterior, all threads participate
  // in the shared-memory writes + barriers so the barrier is unconditionally
  // reached by the whole workgroup (single-exit uniform control flow).
  let range      = interiorBucketRange(bucketId - select(0u, 1u, isInterior));
  var rangeStart = range.x;
  var rangeEnd   = range.y;
  if (!isInterior) {
    // Collapse the range to zero so the accumulation loop is a no-op but the
    // barrier structure still fires for the whole workgroup.
    rangeStart = 0u;
    rangeEnd   = 0u;
  }

  var sumX : f32 = 0.0;
  var sumY : f32 = 0.0;
  var cnt  : u32 = 0u;

  // Uniform subsample when range is huge. Extreme density uses a tighter
  // average-only cap (bucketAverageCandidateCount) — anchors need less
  // precision than LTTB selection (Phase B bandwidth).
  let rangeLenAvg = rangeEnd - rangeStart;
  let candCountAvg = bucketAverageCandidateCount(rangeLenAvg);
  var sAvg : u32 = tid;
  while (sAvg < candCountAvg) {
    let i = candidateRawIndex(rangeStart, rangeLenAvg, sAvg, candCountAvg);
    let p = rawAt(i);
    if (isFiniteVec2(p)) {
      sumX = sumX + p.x;
      sumY = sumY + p.y;
      cnt  = cnt + 1u;
    }
    sAvg = sAvg + 64u;
  }

  sharedSumX[tid]  = sumX;
  sharedSumY[tid]  = sumY;
  sharedCount[tid] = cnt;
  workgroupBarrier();

  var stride : u32 = 32u;
  while (stride > 0u) {
    if (tid < stride) {
      sharedSumX[tid]  = sharedSumX[tid]  + sharedSumX[tid + stride];
      sharedSumY[tid]  = sharedSumY[tid]  + sharedSumY[tid + stride];
      sharedCount[tid] = sharedCount[tid] + sharedCount[tid + stride];
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  if (isInterior && tid == 0u) {
    let totalCount = sharedCount[0];
    if (totalCount == 0u) {
      // Defensive fallback: empty bucket (all NaN). Use first raw point in the
      // nominal range so the downstream LTTB pass has a usable anchor.
      averages[bucketId] = rawAt(range.x);
    } else {
      let inv = 1.0 / f32(totalCount);
      averages[bucketId] = vec2<f32>(sharedSumX[0] * inv, sharedSumY[0] * inv);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point 3: parallel LTTB.
// Dispatched with \`targetBuckets\` workgroups (one per output slot).
//
// Workgroup 0 writes output[0] = first anchor.
// Workgroup (targetBuckets - 1) writes output[last] = last anchor.
// Interior workgroups maximize triangle area against (averages[b-1], averages[b+1]).
// ─────────────────────────────────────────────────────────────────────────────

@compute @workgroup_size(64)
fn parallelLttbDecimate(
  @builtin(workgroup_id) wgid : vec3<u32>,
  @builtin(local_invocation_id) lid : vec3<u32>,
) {
  let tid      = lid.x;
  let bucketId = wgid.x;
  let buckets  = uni.targetBuckets;
  let visStart = uni.visibleStart;
  let visEnd   = uni.visibleEnd;

  let isFirstAnchor = buckets >= 1u && bucketId == 0u;
  let isLastAnchor  = buckets >= 2u && bucketId + 1u == buckets;
  let isInterior    = buckets >= 3u && bucketId >= 1u && bucketId + 1u < buckets;

  if (isFirstAnchor && tid == 0u && visEnd > visStart) {
    output[0] = rawAt(visStart);
  }
  if (isLastAnchor && tid == 0u && visEnd > visStart) {
    output[buckets - 1u] = rawAt(visEnd - 1u);
  }

  // Interior reduction — same uniform-barrier structure as computeBucketAverages.
  let range      = interiorBucketRange(bucketId - select(0u, 1u, isInterior));
  var rangeStart = range.x;
  var rangeEnd   = range.y;
  if (!isInterior) {
    rangeStart = 0u;
    rangeEnd   = 0u;
  }

  // Safe to read \`averages[bucketId ± 1]\` only when interior; otherwise we read
  // a zeroed slot (harmless since we won't write output in those workgroups).
  var anchor  : vec2<f32> = vec2<f32>(0.0, 0.0);
  var nextRef : vec2<f32> = vec2<f32>(0.0, 0.0);
  if (isInterior) {
    anchor  = averages[bucketId - 1u];
    nextRef = averages[bucketId + 1u];
  }

  var bestScore : f32 = -1.0;
  var bestIdx   : u32 = rangeStart;

  // Cap candidates on oversized buckets (see bucketCandidateCount).
  let rangeLenLttb = rangeEnd - rangeStart;
  let candCountLttb = bucketCandidateCount(rangeLenLttb);
  var sLttb : u32 = tid;
  while (sLttb < candCountLttb) {
    let i = candidateRawIndex(rangeStart, rangeLenLttb, sLttb, candCountLttb);
    let c = rawAt(i);
    if (isFiniteVec2(c)) {
      // Unsigned triangle area (scaled by 2) via the cross product.
      let area2 = abs((anchor.x - nextRef.x) * (c.y - anchor.y)
                    - (anchor.x - c.x)     * (nextRef.y - anchor.y));
      if (area2 > bestScore) {
        bestScore = area2;
        bestIdx   = i;
      }
    }
    sLttb = sLttb + 64u;
  }

  sharedScore[tid] = bestScore;
  sharedIdx[tid]   = bestIdx;
  workgroupBarrier();

  var stride : u32 = 32u;
  while (stride > 0u) {
    if (tid < stride) {
      let otherScore = sharedScore[tid + stride];
      if (otherScore > sharedScore[tid]) {
        sharedScore[tid] = otherScore;
        sharedIdx[tid]   = sharedIdx[tid + stride];
      }
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  if (isInterior && tid == 0u) {
    output[bucketId] = rawAt(sharedIdx[0]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hierarchy-backed present (Phase B multi‑M FIFO)
//
// Tiles are physical (buffer index). Logical bucket ranges map to ≤2 physical
// spans via ringStart. Full tiles contribute aggregates without raw re-scan;
// partial edge tiles scan raw on tid 0 (≤ TILE points per edge).
//
// Present kernels are **tid-0 only** and **O(tiles per bucket)** — never
// full-scan partial tiles (that path was as expensive as legacy at 1M×2500
// where each bucket is ~1 partial tile). Candidates:
//   - tile min/max when arg index falls in the bucket physical range
//   - else tile min/max y still used as shape proxy for LTTB (G4 residual)
//   - partial edges: ≤8 uniform raw samples + endpoints (not ≤128/full)
//
// This is the G4 hierarchy residual class: approximate extrema/shape vs full
// scan, same intent as the 128-candidate dense cap, but much cheaper at multi‑M.
// ─────────────────────────────────────────────────────────────────────────────

fn physicalAt(physIdx : u32) -> vec2<f32> {
  return rawPoints[physIdx];
}

fn logicalToPhysical(logicalIdx : u32) -> u32 {
  if (uni.ringCapacity == 0u) {
    return logicalIdx;
  }
  let sum = uni.ringStart + logicalIdx;
  return select(sum, sum - uni.ringCapacity, sum >= uni.ringCapacity);
}

fn logicalSpanPhysical(rangeStart : u32, rangeEnd : u32, spanIdx : u32) -> vec3<u32> {
  let logLen = rangeEnd - rangeStart;
  if (logLen == 0u) {
    return vec3<u32>(0u, 0u, 0u);
  }
  if (uni.ringCapacity == 0u) {
    if (spanIdx == 0u) {
      return vec3<u32>(rangeStart, rangeEnd, 1u);
    }
    return vec3<u32>(0u, 0u, 0u);
  }
  let phys0 = logicalToPhysical(rangeStart);
  if (phys0 + logLen <= uni.ringCapacity) {
    if (spanIdx == 0u) {
      return vec3<u32>(phys0, phys0 + logLen, 1u);
    }
    return vec3<u32>(0u, 0u, 0u);
  }
  let firstLen = uni.ringCapacity - phys0;
  if (spanIdx == 0u) {
    return vec3<u32>(phys0, uni.ringCapacity, 1u);
  }
  if (spanIdx == 1u) {
    return vec3<u32>(0u, logLen - firstLen, 1u);
  }
  return vec3<u32>(0u, 0u, 0u);
}

@compute @workgroup_size(64)
fn hierarchyMinMaxDecimate(
  @builtin(workgroup_id) wgid : vec3<u32>,
  @builtin(local_invocation_id) lid : vec3<u32>,
) {
  let tid      = lid.x;
  let bucketId = wgid.x;
  let buckets  = uni.targetBuckets;
  let visStart = uni.visibleStart;
  let visEnd   = uni.visibleEnd;

  if (tid != 0u) {
    return;
  }

  if (bucketId == 0u && buckets >= 1u && visEnd > visStart) {
    output[0] = rawAt(visStart);
    if (buckets >= 2u) {
      output[buckets - 1u] = rawAt(visEnd - 1u);
    }
  }

  if (buckets < 3u || bucketId > buckets - 3u) {
    return;
  }

  let range      = interiorBucketRange(bucketId);
  let rangeStart = range.x;
  let rangeEnd   = range.y;
  let wantMax    = (uni.mode & 1u) == 1u;

  var bestY : f32 = 3.4e38;
  if (wantMax) {
    bestY = -3.4e38;
  }
  var bestPhys : u32 = logicalToPhysical(rangeStart);

  let cap = select(uni.rawPointCount, uni.ringCapacity, uni.ringCapacity > 0u);
  let tileCap = uni.tileCount;

  for (var spanIdx = 0u; spanIdx < 2u; spanIdx = spanIdx + 1u) {
    let sp = logicalSpanPhysical(rangeStart, rangeEnd, spanIdx);
    if (sp.z == 0u) { continue; }
    let pLo = sp.x;
    let pHi = sp.y;
    if (pHi <= pLo) { continue; }

    var tStart = pLo / 1024u;
    var tEnd = (pHi - 1u) / 1024u + 1u;
    if (tEnd > tileCap) { tEnd = tileCap; }
    var t = tStart;
    while (t < tEnd) {
      let tilePhys0 = t * 1024u;
      var tilePhys1 = tilePhys0 + 1024u;
      if (tilePhys1 > cap) { tilePhys1 = cap; }
      let fullyCovered = tilePhys0 >= pLo && tilePhys1 <= pHi;
      let tile = tiles[t];
      if (tile.count > 0u) {
        // Prefer tile arg if it lands in this bucket's physical span.
        if (wantMax) {
          if (tile.maxIdx >= pLo && tile.maxIdx < pHi && tile.maxY > bestY) {
            bestY = tile.maxY;
            bestPhys = tile.maxIdx;
          } else if (fullyCovered && tile.maxY > bestY) {
            bestY = tile.maxY;
            bestPhys = tile.maxIdx;
          }
        } else {
          if (tile.minIdx >= pLo && tile.minIdx < pHi && tile.minY < bestY) {
            bestY = tile.minY;
            bestPhys = tile.minIdx;
          } else if (fullyCovered && tile.minY < bestY) {
            bestY = tile.minY;
            bestPhys = tile.minIdx;
          }
        }
      }
      if (!fullyCovered) {
        let sLo = select(pLo, tilePhys0, tilePhys0 > pLo);
        let sHi = select(pHi, tilePhys1, tilePhys1 < pHi);
        if (sHi > sLo) {
          let rangeLen = sHi - sLo;
          var candCount = rangeLen;
          if (candCount > 8u) { candCount = 8u; }
          var s = 0u;
          while (s < candCount) {
            var i = sLo;
            if (candCount > 1u && rangeLen > 1u) {
              i = sLo + mulDivU32(rangeLen - 1u, s, candCount - 1u);
            }
            let p = physicalAt(i);
            if (isFiniteVec2(p)) {
              if (wantMax) {
                if (p.y > bestY) { bestY = p.y; bestPhys = i; }
              } else {
                if (p.y < bestY) { bestY = p.y; bestPhys = i; }
              }
            }
            s = s + 1u;
          }
        }
      }
      t = t + 1u;
    }
  }

  output[bucketId + 1u] = physicalAt(bestPhys);
}

@compute @workgroup_size(64)
fn hierarchyBucketAverages(
  @builtin(workgroup_id) wgid : vec3<u32>,
  @builtin(local_invocation_id) lid : vec3<u32>,
) {
  let tid      = lid.x;
  let bucketId = wgid.x;
  let buckets  = uni.targetBuckets;
  let visStart = uni.visibleStart;
  let visEnd   = uni.visibleEnd;

  if (tid != 0u) {
    return;
  }

  let isFirstAnchor = buckets >= 1u && bucketId == 0u;
  let isLastAnchor  = buckets >= 2u && bucketId + 1u == buckets;
  let isInterior    = buckets >= 3u && bucketId >= 1u && bucketId + 1u < buckets;

  if (isFirstAnchor && visEnd > visStart) {
    averages[0] = rawAt(visStart);
  }
  if (isLastAnchor && visEnd > visStart) {
    averages[buckets - 1u] = rawAt(visEnd - 1u);
  }
  if (!isInterior) {
    return;
  }

  let range      = interiorBucketRange(bucketId - 1u);
  let rangeStart = range.x;
  let rangeEnd   = range.y;

  var sumX : f32 = 0.0;
  var sumY : f32 = 0.0;
  var cnt  : u32 = 0u;

  let cap = select(uni.rawPointCount, uni.ringCapacity, uni.ringCapacity > 0u);
  let tileCap = uni.tileCount;

  for (var spanIdx = 0u; spanIdx < 2u; spanIdx = spanIdx + 1u) {
    let sp = logicalSpanPhysical(rangeStart, rangeEnd, spanIdx);
    if (sp.z == 0u) { continue; }
    let pLo = sp.x;
    let pHi = sp.y;
    if (pHi <= pLo) { continue; }

    var tStart = pLo / 1024u;
    var tEnd = (pHi - 1u) / 1024u + 1u;
    if (tEnd > tileCap) { tEnd = tileCap; }
    var t = tStart;
    while (t < tEnd) {
      let tilePhys0 = t * 1024u;
      var tilePhys1 = tilePhys0 + 1024u;
      if (tilePhys1 > cap) { tilePhys1 = cap; }
      let fullyCovered = tilePhys0 >= pLo && tilePhys1 <= pHi;
      let tile = tiles[t];
      if (fullyCovered) {
        sumX = sumX + tile.sumX;
        sumY = sumY + tile.sumY;
        cnt = cnt + tile.count;
      } else if (tile.count > 0u) {
        // Partial: scale tile mean by overlap count estimate (no full raw scan).
        let sLo = select(pLo, tilePhys0, tilePhys0 > pLo);
        let sHi = select(pHi, tilePhys1, tilePhys1 < pHi);
        let overlap = sHi - sLo;
        let tileLen = tilePhys1 - tilePhys0;
        if (tileLen > 0u && overlap > 0u) {
          let frac = f32(overlap) / f32(tileLen);
          let estCount = u32(f32(tile.count) * frac + 0.5);
          let useCount = select(1u, estCount, estCount > 0u);
          let inv = 1.0 / f32(tile.count);
          let meanX = tile.sumX * inv;
          let meanY = tile.sumY * inv;
          sumX = sumX + meanX * f32(useCount);
          sumY = sumY + meanY * f32(useCount);
          cnt = cnt + useCount;
        }
      }
      t = t + 1u;
    }
  }

  if (cnt == 0u) {
    averages[bucketId] = rawAt(rangeStart);
  } else {
    let inv = 1.0 / f32(cnt);
    averages[bucketId] = vec2<f32>(sumX * inv, sumY * inv);
  }
}

@compute @workgroup_size(64)
fn hierarchyParallelLttb(
  @builtin(workgroup_id) wgid : vec3<u32>,
  @builtin(local_invocation_id) lid : vec3<u32>,
) {
  let tid      = lid.x;
  let bucketId = wgid.x;
  let buckets  = uni.targetBuckets;
  let visStart = uni.visibleStart;
  let visEnd   = uni.visibleEnd;

  if (tid != 0u) {
    return;
  }

  let isFirstAnchor = buckets >= 1u && bucketId == 0u;
  let isLastAnchor  = buckets >= 2u && bucketId + 1u == buckets;
  let isInterior    = buckets >= 3u && bucketId >= 1u && bucketId + 1u < buckets;

  if (isFirstAnchor && visEnd > visStart) {
    output[0] = rawAt(visStart);
  }
  if (isLastAnchor && visEnd > visStart) {
    output[buckets - 1u] = rawAt(visEnd - 1u);
  }
  if (!isInterior) {
    return;
  }

  let range      = interiorBucketRange(bucketId - 1u);
  let rangeStart = range.x;
  let rangeEnd   = range.y;
  let anchor     = averages[bucketId - 1u];
  let nextRef    = averages[bucketId + 1u];

  var bestScore : f32 = -1.0;
  var bestPhys  : u32 = logicalToPhysical(rangeStart);

  let cap = select(uni.rawPointCount, uni.ringCapacity, uni.ringCapacity > 0u);
  let tileCap = uni.tileCount;

  for (var spanIdx = 0u; spanIdx < 2u; spanIdx = spanIdx + 1u) {
    let sp = logicalSpanPhysical(rangeStart, rangeEnd, spanIdx);
    if (sp.z == 0u) { continue; }
    let pLo = sp.x;
    let pHi = sp.y;
    if (pHi <= pLo) { continue; }

    var tStart = pLo / 1024u;
    var tEnd = (pHi - 1u) / 1024u + 1u;
    if (tEnd > tileCap) { tEnd = tileCap; }
    var t = tStart;
    while (t < tEnd) {
      let tilePhys0 = t * 1024u;
      var tilePhys1 = tilePhys0 + 1024u;
      if (tilePhys1 > cap) { tilePhys1 = cap; }
      let fullyCovered = tilePhys0 >= pLo && tilePhys1 <= pHi;
      let tile = tiles[t];
      if (tile.count > 0u) {
        // Always score tile min/max as LTTB candidates (O(1) per tile).
        // If arg is outside the bucket span, still use it as a shape proxy (G4)
        // but prefer clamping pick to an in-range endpoint when needed.
        var i0 = tile.minIdx;
        var i1 = tile.maxIdx;
        if (i0 < pLo || i0 >= pHi) {
          i0 = pLo;
        }
        if (i1 < pLo || i1 >= pHi) {
          i1 = select(pLo, pHi - 1u, pHi > pLo);
        }
        let c0 = physicalAt(i0);
        let c1 = physicalAt(i1);
        // Also score true tile extrema samples when in range (already handled)
        // and tile mean snapped to mid physical of overlap.
        let sLo = select(pLo, tilePhys0, tilePhys0 > pLo);
        let sHi = select(pHi, tilePhys1, tilePhys1 < pHi);
        let mid = sLo + (sHi - sLo) / 2u;
        let cMid = physicalAt(mid);

        let candidates = array<vec2<f32>, 3>(c0, c1, cMid);
        let candIdx = array<u32, 3>(i0, i1, mid);
        for (var ci = 0u; ci < 3u; ci = ci + 1u) {
          let c = candidates[ci];
          if (isFiniteVec2(c)) {
            let area2 = abs((anchor.x - nextRef.x) * (c.y - anchor.y)
                          - (anchor.x - c.x) * (nextRef.y - anchor.y));
            if (area2 > bestScore) {
              bestScore = area2;
              bestPhys = candIdx[ci];
            }
          }
        }

        // When tile arg is inside range, also score the exact tile extreme point
        // (may differ from clamped i0/i1 when we replaced out-of-range args).
        if (tile.minIdx >= pLo && tile.minIdx < pHi) {
          let c = physicalAt(tile.minIdx);
          let area2 = abs((anchor.x - nextRef.x) * (c.y - anchor.y)
                        - (anchor.x - c.x) * (nextRef.y - anchor.y));
          if (area2 > bestScore) {
            bestScore = area2;
            bestPhys = tile.minIdx;
          }
        }
        if (tile.maxIdx >= pLo && tile.maxIdx < pHi) {
          let c = physicalAt(tile.maxIdx);
          let area2 = abs((anchor.x - nextRef.x) * (c.y - anchor.y)
                        - (anchor.x - c.x) * (nextRef.y - anchor.y));
          if (area2 > bestScore) {
            bestScore = area2;
            bestPhys = tile.maxIdx;
          }
        }
      }
      if (!fullyCovered) {
        // Bounded edge refine: ≤8 samples (not 128 / not full tile).
        let sLo = select(pLo, tilePhys0, tilePhys0 > pLo);
        let sHi = select(pHi, tilePhys1, tilePhys1 < pHi);
        let rangeLen = sHi - sLo;
        var candCount = rangeLen;
        if (candCount > 8u) { candCount = 8u; }
        var s = 0u;
        while (s < candCount) {
          var i = sLo;
          if (candCount > 1u && rangeLen > 1u) {
            i = sLo + mulDivU32(rangeLen - 1u, s, candCount - 1u);
          }
          let c = physicalAt(i);
          if (isFiniteVec2(c)) {
            let area2 = abs((anchor.x - nextRef.x) * (c.y - anchor.y)
                          - (anchor.x - c.x) * (nextRef.y - anchor.y));
            if (area2 > bestScore) {
              bestScore = area2;
              bestPhys = i;
            }
          }
          s = s + 1u;
        }
      }
      t = t + 1u;
    }
  }

  output[bucketId] = physicalAt(bestPhys);
}
`, ev = `// decimationHierarchy.wgsl — GPU tile hierarchy maintain for streaming decimation.
//
// Physical-index tiles of size 1024 store min/max/sum aggregates over the raw
// storage buffer. Maintain is O(touched tiles): full rebuild on cold / equal-N
// rewrite, range invalidate on modular FIFO append overwrite or linear growth.
//
// Present path (hierarchyMinMax / hierarchyAverages / hierarchyLttb) lives in
// decimation.wgsl and reads these tiles. Tile layout is **physical** so ring
// wrap only rebuilds the overwritten physical range (not a full logical shift).
//
// Tile struct (32 bytes, 8 × u32/f32):
//   minY, maxY : f32
//   minIdx, maxIdx : u32   (physical indices of argmin/argmax y)
//   sumX, sumY : f32
//   count : u32
//   pad : u32
//
// Workgroup size is the literal 64 (Chrome WGSL lesson — do not use a shared
// const for both @workgroup_size and workgroup array sizes).

struct HierarchyMaintainUniforms {
  // Logical point count currently valid in the ring / linear buffer.
  rawPointCount    : u32,
  ringStart        : u32,
  // 0 = linear chronological; else fixed physical capacity of the ring.
  ringCapacity     : u32,
  // Physical indices that exist in raw storage (ringCapacity or rawPointCount).
  physicalCapacity : u32,
  // Inclusive-start tile index for this maintain dispatch.
  maintainStartTile : u32,
  // Number of tiles this dispatch rebuilds (workgroup count).
  maintainTileCount : u32,
  pad0 : u32,
  pad1 : u32,
};

struct Tile {
  minY   : f32,
  maxY   : f32,
  minIdx : u32,
  maxIdx : u32,
  sumX   : f32,
  sumY   : f32,
  count  : u32,
  pad    : u32,
};

@group(0) @binding(0) var<uniform> uni : HierarchyMaintainUniforms;
@group(0) @binding(1) var<storage, read> rawPoints : array<vec2<f32>>;
@group(0) @binding(2) var<storage, read_write> tiles : array<Tile>;

var<workgroup> sharedMinY   : array<f32, 64>;
var<workgroup> sharedMaxY   : array<f32, 64>;
var<workgroup> sharedMinIdx : array<u32, 64>;
var<workgroup> sharedMaxIdx : array<u32, 64>;
var<workgroup> sharedSumX   : array<f32, 64>;
var<workgroup> sharedSumY   : array<f32, 64>;
var<workgroup> sharedCount  : array<u32, 64>;

fn isFiniteVec2(v : vec2<f32>) -> bool {
  return v.x == v.x && v.y == v.y;
}

// Rebuild one physical tile per workgroup. Tile size is literal 1024.
@compute @workgroup_size(64)
fn maintainTiles(
  @builtin(workgroup_id) wgid : vec3<u32>,
  @builtin(local_invocation_id) lid : vec3<u32>,
) {
  let tid = lid.x;
  let localTile = wgid.x;
  if (localTile >= uni.maintainTileCount) {
    // Still participate in barriers via zeroed reduction below.
  }

  let tileId = uni.maintainStartTile + localTile;
  // TILE = 1024 (literal).
  let physStart = tileId * 1024u;
  var physEnd = physStart + 1024u;
  if (physEnd > uni.physicalCapacity) {
    physEnd = uni.physicalCapacity;
  }

  // Only physical indices that currently hold live points contribute.
  // Linear: live = [0, rawPointCount).
  // Ring full (rawPointCount == ringCapacity): all physical indices live.
  // Ring filling (ringStart == 0, N < cap): live = [0, N).
  // After wrap, all physical slots hold live data when N == ringCapacity.
  var liveEnd = uni.rawPointCount;
  if (uni.ringCapacity > 0u && uni.rawPointCount >= uni.ringCapacity) {
    liveEnd = uni.ringCapacity;
  }
  if (physEnd > liveEnd && uni.ringCapacity == 0u) {
    physEnd = liveEnd;
  }
  // Ring mode after wrap: entire physicalCapacity is live when full.
  // During fill (ringStart==0): live is [0, rawPointCount).
  if (uni.ringCapacity > 0u && uni.rawPointCount < uni.ringCapacity) {
    if (physEnd > uni.rawPointCount) {
      physEnd = uni.rawPointCount;
    }
  }

  var bestMinY : f32 = 3.4e38;
  var bestMaxY : f32 = -3.4e38;
  var bestMinIdx : u32 = physStart;
  var bestMaxIdx : u32 = physStart;
  var sumX : f32 = 0.0;
  var sumY : f32 = 0.0;
  var cnt  : u32 = 0u;

  if (localTile < uni.maintainTileCount && physStart < physEnd) {
    var i = physStart + tid;
    while (i < physEnd) {
      let p = rawPoints[i];
      if (isFiniteVec2(p)) {
        if (p.y < bestMinY) {
          bestMinY = p.y;
          bestMinIdx = i;
        }
        if (p.y > bestMaxY) {
          bestMaxY = p.y;
          bestMaxIdx = i;
        }
        sumX = sumX + p.x;
        sumY = sumY + p.y;
        cnt = cnt + 1u;
      }
      i = i + 64u;
    }
  }

  sharedMinY[tid] = bestMinY;
  sharedMaxY[tid] = bestMaxY;
  sharedMinIdx[tid] = bestMinIdx;
  sharedMaxIdx[tid] = bestMaxIdx;
  sharedSumX[tid] = sumX;
  sharedSumY[tid] = sumY;
  sharedCount[tid] = cnt;
  workgroupBarrier();

  var stride : u32 = 32u;
  while (stride > 0u) {
    if (tid < stride) {
      let oMinY = sharedMinY[tid + stride];
      if (oMinY < sharedMinY[tid]) {
        sharedMinY[tid] = oMinY;
        sharedMinIdx[tid] = sharedMinIdx[tid + stride];
      }
      let oMaxY = sharedMaxY[tid + stride];
      if (oMaxY > sharedMaxY[tid]) {
        sharedMaxY[tid] = oMaxY;
        sharedMaxIdx[tid] = sharedMaxIdx[tid + stride];
      }
      sharedSumX[tid] = sharedSumX[tid] + sharedSumX[tid + stride];
      sharedSumY[tid] = sharedSumY[tid] + sharedSumY[tid + stride];
      sharedCount[tid] = sharedCount[tid] + sharedCount[tid + stride];
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  if (tid == 0u && localTile < uni.maintainTileCount) {
    var t : Tile;
    let total = sharedCount[0];
    if (total == 0u) {
      t.minY = 0.0;
      t.maxY = 0.0;
      t.minIdx = physStart;
      t.maxIdx = physStart;
      t.sumX = 0.0;
      t.sumY = 0.0;
      t.count = 0u;
      t.pad = 0u;
    } else {
      t.minY = sharedMinY[0];
      t.maxY = sharedMaxY[0];
      t.minIdx = sharedMinIdx[0];
      t.maxIdx = sharedMaxIdx[0];
      t.sumX = sharedSumX[0];
      t.sumY = sharedSumY[0];
      t.count = total;
      t.pad = 0u;
    }
    tiles[tileId] = t;
  }
}
`, Xs = 1024, tv = 8192, nv = 32;
function Fr(e, t = Xs) {
  const n = Math.max(0, e | 0);
  return n <= 0 ? 0 : Math.ceil(n / t);
}
function sl(e, t, n = Xs) {
  const i = Math.max(0, e | 0), r = Math.max(i, t | 0);
  if (r <= i) return null;
  const o = Math.floor(i / n), s = Math.floor((r - 1) / n) + 1;
  return { startTile: o, endTileExclusive: s };
}
function rf(e, t, n) {
  const i = n | 0;
  if (i <= 0) return [];
  const r = (e % i + i) % i, o = (t % i + i) % i;
  if (r === o) return [];
  if (o > r)
    return [{ start: r, end: o }];
  const s = [{ start: r, end: i }];
  return o > 0 && s.push({ start: 0, end: o }), s;
}
function iv(e) {
  if (!e.hierarchyReady) return !1;
  const t = e.rawPointCount | 0;
  if (t < tv) return !1;
  const n = Math.max(2, e.targetBuckets | 0), i = Math.max(0, (e.visibleEnd | 0) - (e.visibleStart | 0)), r = Math.max(1, n - 2);
  return i / r > 512 || (e.ringCapacity | 0) > 0 || t >= 25e4 || t >= 512 * n;
}
const al = 64, rv = 8, of = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
}, sf = 48, ll = 32, ov = 0, sv = 1;
function av(e, t) {
  let n = !1;
  const i = t == null ? void 0 : t.pipelineCache, r = e.createBindGroupLayout({
    label: "decimationCompute/bindGroupLayout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" }
      },
      {
        binding: 4,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" }
      }
    ]
  }), o = e.createBindGroupLayout({
    label: "decimationCompute/maintainBindGroupLayout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" }
      }
    ]
  }), s = Ys(e, Qb, "decimation.wgsl", i), a = Ys(
    e,
    ev,
    "decimationHierarchy.wgsl",
    i
  ), l = (Ge, Ye) => {
    var bt;
    const rt = (bt = Ge.getCompilationInfo) == null ? void 0 : bt.bind(Ge);
    rt && rt().then((Dt) => {
      for (const wt of Dt.messages)
        wt.type === "error" ? console.error(`[${Ye}:${wt.lineNum ?? 0}:${wt.linePos ?? 0}] ${wt.message}`) : wt.type === "warning" && console.warn(`[${Ye}:${wt.lineNum ?? 0}:${wt.linePos ?? 0}] ${wt.message}`);
    }).catch(() => {
    });
  };
  l(s, "decimation.wgsl"), l(a, "decimationHierarchy.wgsl");
  const c = e.createPipelineLayout({
    bindGroupLayouts: [r]
  }), u = e.createPipelineLayout({
    bindGroupLayouts: [o]
  }), f = Ai(
    e,
    {
      label: "decimationCompute/minMaxPipeline",
      layout: c,
      compute: { module: s, entryPoint: "minMaxDecimate" }
    },
    i
  ), d = Ai(
    e,
    {
      label: "decimationCompute/averagesPipeline",
      layout: c,
      compute: { module: s, entryPoint: "computeBucketAverages" }
    },
    i
  ), m = Ai(
    e,
    {
      label: "decimationCompute/lttbPipeline",
      layout: c,
      compute: { module: s, entryPoint: "parallelLttbDecimate" }
    },
    i
  ), p = Ai(
    e,
    {
      label: "decimationCompute/hierarchyMinMaxPipeline",
      layout: c,
      compute: { module: s, entryPoint: "hierarchyMinMaxDecimate" }
    },
    i
  ), y = Ai(
    e,
    {
      label: "decimationCompute/hierarchyAveragesPipeline",
      layout: c,
      compute: { module: s, entryPoint: "hierarchyBucketAverages" }
    },
    i
  ), g = Ai(
    e,
    {
      label: "decimationCompute/hierarchyLttbPipeline",
      layout: c,
      compute: { module: s, entryPoint: "hierarchyParallelLttb" }
    },
    i
  ), S = Ai(
    e,
    {
      label: "decimationCompute/maintainPipeline",
      layout: u,
      compute: { module: a, entryPoint: "maintainTiles" }
    },
    i
  ), A = un(e, sf, {
    label: "decimationCompute/uniforms"
  }), M = new ArrayBuffer(sf), h = new Uint32Array(M), b = un(e, ll, {
    label: "decimationCompute/maintainUniforms0"
  }), v = un(e, ll, {
    label: "decimationCompute/maintainUniforms1"
  }), x = new ArrayBuffer(ll), F = new Uint32Array(x);
  let I = null, R = null, T = 0, N = null, w = null, P = null, B = 0, _ = null, C = null, E = null, U = !1, G = !1, O = null, D = null, k = -1, W = -1, j = -1, ee = -1, fe, X = 0, z = 0, $ = !1, Z = 0, Q = !1, K = null, ne = null, L = -1, le = -1, se = -1, ae = -1, de, re = 0, ie = 0, be = !1, te = !1, Be = !0, Me = 0, _e = [], Le = null, ge = -1, Ee = 0, Se = 0, ve, xe = !1, Pe = 0;
  const Oe = 2048, Xe = (Ge, Ye) => Ye > 0 ? Ye : Math.max(0, Ge), Ze = (Ge) => {
    Be = !0, Me = 0, _e = [], te = !1, Ge <= 0 && (Me = 0);
  }, ze = (Ge, Ye, rt) => {
    const bt = Math.max(0, Math.min(rt, Ge)), Dt = Math.max(bt, Math.min(rt, Ye));
    if (Dt <= bt) return;
    if (Be) {
      bt < Me && (Me = bt);
      return;
    }
    const wt = [];
    let Yt = bt, en = Dt;
    for (const q of _e) {
      if (en < q.start || Yt > q.endExclusive) {
        wt.push(q);
        continue;
      }
      Yt = Math.min(Yt, q.start), en = Math.max(en, q.endExclusive);
    }
    wt.push({ start: Yt, endExclusive: en }), wt.sort((q, ue) => q.start - ue.start);
    const H = [];
    for (const q of wt) {
      const ue = H[H.length - 1];
      !ue || q.start > ue.endExclusive ? H.push({ ...q }) : ue.endExclusive = Math.max(ue.endExclusive, q.endExclusive);
    }
    H.length <= 2 ? _e = H : Ze(rt);
  }, Ue = (Ge) => {
    if (Ge <= 0) return 0;
    if (Be)
      return Math.max(0, Ge - Me);
    let Ye = 0;
    for (const rt of _e)
      Ye += Math.max(0, rt.endExclusive - rt.start);
    return Ye;
  }, Ae = (Ge) => {
    const Ye = Math.max(al, Ge);
    if (I && R && Ye <= T)
      return;
    T = Math.max(T, Math.max(al, of(Ye)));
    const rt = T * 2 * 4;
    if (I)
      try {
        I.destroy();
      } catch {
      }
    if (R)
      try {
        R.destroy();
      } catch {
      }
    I = e.createBuffer({
      label: "decimationCompute/outputBuffer",
      size: rt,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    }), R = e.createBuffer({
      label: "decimationCompute/averagesBuffer",
      size: rt,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    }), N = null, w = null, be = !0;
  }, Qe = (Ge) => {
    const Ye = Math.max(
      rv,
      Fr(Math.max(Ge, Xs))
    );
    if (P && Ye <= B)
      return;
    B = Math.max(B, of(Ye));
    const rt = B * nv;
    if (P)
      try {
        P.destroy();
      } catch {
      }
    P = e.createBuffer({
      label: "decimationCompute/tilesBuffer",
      size: rt,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    }), Ze(B > 0 ? B : Ye), N = null, w = null, _ = null, C = null, E = null, be = !0;
  }, At = (Ge) => {
    N && w === Ge || !I || !R || !P || (N = e.createBindGroup({
      label: "decimationCompute/bindGroup",
      layout: r,
      entries: [
        { binding: 0, resource: { buffer: A } },
        { binding: 1, resource: { buffer: Ge } },
        { binding: 2, resource: { buffer: I } },
        { binding: 3, resource: { buffer: R } },
        { binding: 4, resource: { buffer: P } }
      ]
    }), w = Ge, be = !0);
  }, It = (Ge) => {
    _ && C && E === Ge || P && (_ = e.createBindGroup({
      label: "decimationCompute/maintainBindGroup0",
      layout: o,
      entries: [
        { binding: 0, resource: { buffer: b } },
        { binding: 1, resource: { buffer: Ge } },
        { binding: 2, resource: { buffer: P } }
      ]
    }), C = e.createBindGroup({
      label: "decimationCompute/maintainBindGroup1",
      layout: o,
      entries: [
        { binding: 0, resource: { buffer: v } },
        { binding: 1, resource: { buffer: Ge } },
        { binding: 2, resource: { buffer: P } }
      ]
    }), E = Ge);
  }, Tt = (Ge, Ye, rt, bt, Dt) => {
    const wt = Xe(Ye, bt);
    Qe(wt);
    const Yt = Fr(wt), en = Le != null, H = en && Le !== Ge, q = en && Se !== bt, ue = en && te && !H && !q && ge === Ye && Ee === rt && ve !== Dt;
    if (Yt === 0) {
      Ze(0);
      return;
    }
    if (H || q || ue) {
      Ze(Yt);
      return;
    }
    if (!te && Be) {
      if (Me > Yt && (Me = 0), Mt && $t !== Dt && Ye === xt && rt === Ot && bt === Ht) {
        Ze(Yt);
        return;
      }
      return;
    }
    if (!te) {
      Ze(Yt);
      return;
    }
    if (Ye > ge && rt === Ee) {
      const he = sl(ge, Ye);
      he && ze(he.startTile, Math.min(Yt, he.endTileExclusive), Yt);
      return;
    }
    if (bt > 0 && Ye >= bt && ge >= bt && rt !== Ee) {
      const he = rf(Ee, rt, bt);
      for (const Fe of he) {
        const et = sl(Fe.start, Fe.end);
        et && ze(et.startTile, Math.min(Yt, et.endTileExclusive), Yt);
      }
      return;
    }
    if (Ye !== ge || rt !== Ee) {
      Ze(Yt);
      return;
    }
  };
  let Ot = 0, Ht = 0, xt = -1, $t, Mt = !1;
  const we = (Ge, Ye, rt) => {
    if (!Be || te || !Mt || rt <= 0 || Ht <= 0 || Ge < rt || xt < Ht || Ye === Ot) return;
    const bt = rf(Ot, Ye, rt);
    for (const Dt of bt) {
      const wt = sl(Dt.start, Dt.end);
      wt && wt.startTile < Me && (Me = wt.startTile);
    }
  }, Ie = () => {
    if (!P) return !1;
    const Ge = k >= 0 ? Fr(Xe(k, z)) : B;
    return Be ? Me < Math.max(Ge, 1) || !te : _e.some((Ye) => Ye.endExclusive > Ye.start);
  }, ke = () => {
    if (n) throw new Error("DecimationCompute is disposed.");
  }, Ke = (Ge) => {
    ke();
    const {
      algorithm: Ye,
      rawBuffer: rt,
      rawPointCount: bt,
      visibleStart: Dt,
      visibleEnd: wt,
      targetBuckets: Yt,
      contentVersion: en,
      ringStart: H,
      ringCapacity: q
    } = Ge, ue = Math.max(0, bt | 0), he = Math.min(ue, Math.max(0, Dt | 0)), Fe = Math.min(ue, Math.max(he, wt | 0)), et = Math.max(2, Yt | 0), pe = en, Ne = Math.max(0, (q ?? 0) | 0), Je = Ne > 0 ? Math.max(0, (H ?? 0) | 0) % Ne : 0;
    be = !1, Ae(et);
    const We = Xe(ue, Ne);
    Qe(Math.max(We, 1)), At(rt), It(rt);
    const ut = be, st = Math.max(0, Fe - he);
    if (ut && (Q = !1, K = null, ne = null, L = -1, le = -1, se = -1, ae = -1, de = void 0, re = 0, ie = 0), Tt(rt, ue, Je, Ne, pe), we(ue, Je, Ne), O = Ye, D = rt, k = ue, W = he, j = Fe, ee = et, fe = pe, X = Je, z = Ne, Ot = Je, Ht = Ne, xt = ue, $t = pe, Mt = !0, st <= 0)
      return U = !0, G = !1, $ = !1, Z = 0, 0;
    const Ut = Q && K === Ye && ne === rt && L === ue && le === he && se === Fe && ae === et && de === pe && re === Je && ie === Ne, ye = Fr(Xe(ue, Ne)), Ce = Ue(ye), tt = Be && Ce > 0 && Ce <= Oe, Ve = !Be && Ce > 0, ft = iv({
      rawPointCount: ue,
      targetBuckets: et,
      visibleStart: he,
      visibleEnd: Fe,
      ringCapacity: Ne,
      hierarchyReady: te || tt || Ve
    });
    if (Ut)
      G = !1, $ = ft, Z = ae;
    else {
      G = !0, $ = ft;
      const gt = Xe(ue, Ne), kt = Fr(gt);
      h[0] = ue >>> 0, h[1] = he >>> 0, h[2] = Fe >>> 0, h[3] = et >>> 0, h[4] = Ye === "max" ? sv : Ye === "min" ? ov : 0, h[5] = Je >>> 0, h[6] = Ne >>> 0, h[7] = 0, h[8] = kt >>> 0, h[9] = gt >>> 0, h[10] = 0, h[11] = 0, fn(e, A, M), Z = et;
    }
    return U = !0, Z;
  }, at = () => {
    if (n || !U || !N) return !1;
    const Ge = ee, Ye = j - W;
    return Ge < 2 || Ye <= 0 ? !1 : G ? !0 : Ie();
  }, yt = (Ge, Ye, rt, bt, Dt, wt, Yt, en) => {
    if (bt <= 0 || !D) return;
    It(D);
    const H = Ye === 0 ? b : v, q = Ye === 0 ? _ : C;
    q && (F[0] = Dt >>> 0, F[1] = wt >>> 0, F[2] = Yt >>> 0, F[3] = en >>> 0, F[4] = rt >>> 0, F[5] = bt >>> 0, F[6] = 0, F[7] = 0, fn(e, H, x), Ge.setPipeline(S), Ge.setBindGroup(0, q), Ge.dispatchWorkgroups(bt));
  }, mt = (Ge) => {
    if (!D || !P || !Ie()) return 0;
    const Ye = k, rt = z, bt = X, Dt = Xe(Ye, rt), wt = Fr(Dt);
    if (wt <= 0) return 0;
    let Yt = 0;
    if (Be) {
      let q = Math.max(0, Math.min(wt, Me)), ue = wt, he = ue - q;
      return he <= 0 ? (Be = !1, _e = [], Me = 0, te = !0, Le = D, ge = Ye, Ee = bt, Se = rt, ve = fe, 0) : (he > Oe && (ue = q + Oe, he = Oe), yt(Ge, 0, q, he, Ye, bt, rt, Dt), Yt = he, Me = ue, Me < wt ? (te = !1, Be = !0, Yt) : (Be = !1, Me = 0, _e = [], te = !0, Le = D, ge = Ye, Ee = bt, Se = rt, ve = fe, Yt));
    }
    const en = _e.slice();
    _e = [];
    let H = 0;
    for (const q of en) {
      const ue = Math.max(0, Math.min(wt, q.start)), Fe = Math.max(ue, Math.min(wt, q.endExclusive)) - ue;
      Fe <= 0 || (yt(Ge, H, ue, Fe, Ye, bt, rt, Dt), Yt += Fe, H = 1);
    }
    return te = !0, Le = D, ge = Ye, Ee = bt, Se = rt, ve = fe, Yt;
  }, nt = (Ge) => {
    if (!N) return;
    const Ye = ee, rt = $ && te;
    if (Ge.setBindGroup(0, N), O === "min" || O === "max") {
      Ge.setPipeline(rt ? p : f);
      const bt = Math.max(1, Ye - 2);
      Ge.dispatchWorkgroups(bt);
    } else
      Ge.setPipeline(rt ? y : d), Ge.dispatchWorkgroups(Ye), Ge.setPipeline(rt ? g : m), Ge.dispatchWorkgroups(Ye);
  };
  return {
    prepare: Ke,
    needsEncode: at,
    encodeCompute: (Ge, Ye) => {
      if (ke(), !U || !N) return;
      const rt = ee, bt = j - W;
      if (rt < 2 || bt <= 0) {
        G = !1;
        return;
      }
      const Dt = Ie(), wt = G;
      if (!Dt && !wt) return;
      const Yt = wt, en = Ye == null, H = Ye ?? Ge.beginComputePass({
        label: "decimationCompute/computePass"
      });
      Pe = Dt ? mt(H) : 0, $ && !te && ($ = !1), Yt && (xe = $ && te, nt(H), G = !1, Q = !0, K = O, ne = D, L = k, le = W, se = j, ae = ee, de = fe, re = X, ie = z), en && H.end();
    },
    getOutputBuffer: () => (I || (Ae(al), Qe(Xs)), I),
    getOutputPointCount: () => Z,
    getHierarchyDebug: () => ({
      hierarchyReady: te,
      lastPresentHierarchy: xe,
      lastMaintainTileCount: Pe,
      preparedRawPointCount: k,
      preparedRingCapacity: z
    }),
    dispose: () => {
      if (!n) {
        n = !0;
        try {
          A.destroy();
        } catch {
        }
        try {
          b.destroy();
        } catch {
        }
        try {
          v.destroy();
        } catch {
        }
        if (I)
          try {
            I.destroy();
          } catch {
          }
        if (R)
          try {
            R.destroy();
          } catch {
          }
        if (P)
          try {
            P.destroy();
          } catch {
          }
        I = null, R = null, P = null, N = null, _ = null, C = null, w = null, E = null, T = 0, B = 0, U = !1, G = !1, Q = !1, te = !1, Be = !0, Me = 0, _e = [], Mt = !1, $t = void 0, K = null, ne = null, L = -1, le = -1, se = -1, ae = -1, de = void 0, re = 0, ie = 0, O = null, D = null, k = -1, W = -1, j = -1, ee = -1, fe = void 0, X = 0, z = 0, Z = 0, Le = null, ge = -1, Ee = 0, Se = 0, ve = void 0;
      }
    }
  };
}
function lv(e) {
  const t = e.length;
  let n = !1, i = !1, r = !1, o = !1, s = !1, a = !1, l = !1, c = !1, u = !1, f = !1, d = !1, m = !1;
  for (let p = 0; p < t; p++) {
    const y = e[p];
    switch (y.type) {
      case "line": {
        i = !0, y.areaStyle && (n = !0), _d.has(y.sampling) && (m = !0);
        break;
      }
      case "area":
        n = !0;
        break;
      case "scatter":
        y.mode === "density" ? o = !0 : r = !0;
        break;
      case "pie":
        s = !0;
        break;
      case "heatmap":
        a = !0;
        break;
      case "band":
        l = !0;
        break;
      case "candlestick":
        c = !0;
        break;
      case "ohlc":
        u = !0;
        break;
      case "errorBar":
        f = !0;
        break;
      case "impulse":
        d = !0;
        break;
    }
  }
  return {
    seriesCount: t,
    area: n ? t : 0,
    line: i ? t : 0,
    scatter: r ? t : 0,
    scatterDensity: o ? t : 0,
    pie: s ? t : 0,
    heatmap: a ? t : 0,
    band: l ? t : 0,
    candlestick: c ? t : 0,
    ohlc: u ? t : 0,
    errorBar: f ? t : 0,
    impulse: d ? t : 0,
    decimation: m ? t : 0
  };
}
function af(e, t) {
  const n = lv(t);
  return e.ensureAreaRendererCount(n.area), e.ensureLineRendererCount(n.line), e.ensureDecimationComputeCount(n.decimation), e.ensureScatterRendererCount(n.scatter), e.ensureScatterDensityRendererCount(n.scatterDensity), e.ensurePieRendererCount(n.pie), e.ensureHeatmapRendererCount(n.heatmap), e.ensureBandRendererCount(n.band), e.ensureCandlestickRendererCount(n.candlestick), e.ensureOhlcRendererCount(n.ohlc), e.ensureErrorBarRendererCount(n.errorBar), e.ensureImpulseRendererCount(n.impulse), n;
}
function cv(e) {
  const { device: t, targetFormat: n, pipelineCache: i, sampleCount: r } = e, o = [], s = [], a = [], l = [], c = [], u = [], f = [], d = [], m = [], p = [], y = [], g = [], S = Ib(t, {
    targetFormat: n,
    pipelineCache: i,
    sampleCount: r
  });
  function A(C) {
    for (; o.length > C; ) {
      const E = o.pop();
      E == null || E.dispose();
    }
    for (; o.length < C; )
      o.push(
        yx(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function M(C) {
    for (; s.length > C; ) {
      const E = s.pop();
      E == null || E.dispose();
    }
    for (; s.length < C; )
      s.push(
        Rl(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function h(C) {
    for (; a.length > C; ) {
      const E = a.pop();
      E == null || E.dispose();
    }
    for (; a.length < C; )
      a.push(
        Ex(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function b(C) {
    for (; l.length > C; ) {
      const E = l.pop();
      E == null || E.dispose();
    }
    for (; l.length < C; )
      l.push(
        Hx(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function v(C) {
    for (; c.length > C; ) {
      const E = c.pop();
      E == null || E.dispose();
    }
    for (; c.length < C; )
      c.push(Zx(t, { targetFormat: n, pipelineCache: i, sampleCount: r }));
  }
  function x(C) {
    for (; u.length > C; ) {
      const E = u.pop();
      E == null || E.dispose();
    }
    for (; u.length < C; )
      u.push(nb(t, { targetFormat: n, pipelineCache: i, sampleCount: r }));
  }
  function F(C) {
    for (; f.length > C; ) {
      const E = f.pop();
      E == null || E.dispose();
    }
    for (; f.length < C; )
      f.push(Rb(t, { targetFormat: n, pipelineCache: i, sampleCount: r }));
  }
  function I(C) {
    for (; d.length > C; ) {
      const E = d.pop();
      E == null || E.dispose();
    }
    for (; d.length < C; )
      d.push(
        db(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function R(C) {
    for (; m.length > C; ) {
      const E = m.pop();
      E == null || E.dispose();
    }
    for (; m.length < C; )
      m.push(
        xb(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function T(C) {
    for (; p.length > C; ) {
      const E = p.pop();
      E == null || E.dispose();
    }
    for (; p.length < C; )
      p.push(
        Xb(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function N(C) {
    for (; y.length > C; ) {
      const E = y.pop();
      E == null || E.dispose();
    }
    for (; y.length < C; )
      y.push(
        Jb(t, {
          targetFormat: n,
          pipelineCache: i,
          sampleCount: r
        })
      );
  }
  function w(C) {
    for (; g.length > C; ) {
      const E = g.pop();
      E == null || E.dispose();
    }
    for (; g.length < C; )
      g.push(av(t, { pipelineCache: i }));
  }
  let P = null;
  function B() {
    return P || (P = {
      areaRenderers: o,
      lineRenderers: s,
      scatterRenderers: a,
      scatterDensityRenderers: l,
      pieRenderers: c,
      heatmapRenderers: u,
      bandRenderers: f,
      candlestickRenderers: d,
      ohlcRenderers: m,
      errorBarRenderers: p,
      impulseRenderers: y,
      decimationComputes: g,
      barRenderer: S
    }), P;
  }
  function _() {
    for (let C = 0; C < o.length; C++)
      o[C].dispose();
    o.length = 0;
    for (let C = 0; C < s.length; C++)
      s[C].dispose();
    s.length = 0;
    for (let C = 0; C < a.length; C++)
      a[C].dispose();
    a.length = 0;
    for (let C = 0; C < l.length; C++)
      l[C].dispose();
    l.length = 0;
    for (let C = 0; C < c.length; C++)
      c[C].dispose();
    c.length = 0;
    for (let C = 0; C < u.length; C++)
      u[C].dispose();
    u.length = 0;
    for (let C = 0; C < f.length; C++)
      f[C].dispose();
    f.length = 0;
    for (let C = 0; C < d.length; C++)
      d[C].dispose();
    d.length = 0;
    for (let C = 0; C < m.length; C++)
      m[C].dispose();
    m.length = 0;
    for (let C = 0; C < p.length; C++)
      p[C].dispose();
    p.length = 0;
    for (let C = 0; C < y.length; C++)
      y[C].dispose();
    y.length = 0;
    for (let C = 0; C < g.length; C++)
      g[C].dispose();
    g.length = 0, S.dispose();
  }
  return {
    ensureAreaRendererCount: A,
    ensureLineRendererCount: M,
    ensureScatterRendererCount: h,
    ensureScatterDensityRendererCount: b,
    ensurePieRendererCount: v,
    ensureHeatmapRendererCount: x,
    ensureBandRendererCount: F,
    ensureCandlestickRendererCount: I,
    ensureOhlcRendererCount: R,
    ensureErrorBarRendererCount: T,
    ensureImpulseRendererCount: N,
    ensureDecimationComputeCount: w,
    getState: B,
    dispose: _
  };
}
const uv = 4, fv = 4, lf = `
struct VSOut { @builtin(position) pos: vec4f };

@vertex
fn vsMain(@builtin(vertex_index) i: u32) -> VSOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0)
  );
  var o: VSOut;
  o.pos = vec4f(positions[i], 0.0, 1.0);
  return o;
}

// Using textureLoad (no filtering) for pixel-exact blit into the MSAA overlay pass.
@group(0) @binding(0) var srcTex: texture_2d<f32>;

@fragment
fn fsMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let xy = vec2<i32>(pos.xy);
  return textureLoad(srcTex, xy, 0);
}
`;
function Ci(e) {
  if (e)
    try {
      e.destroy();
    } catch {
    }
}
function dv(e) {
  const { device: t, targetFormat: n } = e, i = e.sampleCount === 1 ? 1 : 4, r = {
    mainColorTexture: null,
    mainColorView: null,
    mainResolveTexture: null,
    mainResolveView: null,
    overlayMsaaTexture: null,
    overlayMsaaView: null,
    overlayBlitBindGroup: null,
    overlayTargetsWidth: 0,
    overlayTargetsHeight: 0,
    overlayTargetsFormat: null
  }, o = t.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float", viewDimension: "2d" }
      }
    ]
  }), s = vn(
    t,
    {
      label: "textureManager/overlayBlitPipeline",
      bindGroupLayouts: [o],
      vertex: {
        code: lf,
        label: "textureManager/overlayBlit.wgsl"
      },
      fragment: {
        code: lf,
        label: "textureManager/overlayBlit.wgsl",
        formats: n
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: i }
    },
    e.pipelineCache
  );
  function a(f, d, m) {
    const p = Number.isFinite(f) ? Math.max(1, Math.floor(f)) : 1, y = Number.isFinite(d) ? Math.max(1, Math.floor(d)) : 1, g = (m == null ? void 0 : m.needResolveAndOverlay) !== !1, S = (m == null ? void 0 : m.needMainColor) !== !1, A = r.overlayTargetsWidth === p && r.overlayTargetsHeight === y && r.overlayTargetsFormat === n, M = !S || !!r.mainColorTexture, h = !g || r.mainResolveTexture && r.overlayMsaaTexture && r.overlayBlitBindGroup;
    if (A && M && h) {
      let b = !1;
      !S && r.mainColorTexture && (Ci(r.mainColorTexture), r.mainColorTexture = null, r.mainColorView = null, b = !0), !g && (r.mainResolveTexture || r.overlayMsaaTexture) && (Ci(r.mainResolveTexture), Ci(r.overlayMsaaTexture), r.mainResolveTexture = null, r.mainResolveView = null, r.overlayMsaaTexture = null, r.overlayMsaaView = null, r.overlayBlitBindGroup = null, b = !0), b && (l = null);
      return;
    }
    Ci(r.mainColorTexture), Ci(r.mainResolveTexture), Ci(r.overlayMsaaTexture), r.mainColorTexture = null, r.mainColorView = null, r.mainResolveTexture = null, r.mainResolveView = null, r.overlayMsaaTexture = null, r.overlayMsaaView = null, r.overlayBlitBindGroup = null, S && (r.mainColorTexture = t.createTexture({
      label: "textureManager/mainColorTexture",
      size: { width: p, height: y },
      sampleCount: i,
      format: n,
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    }), r.mainColorView = r.mainColorTexture.createView()), g && (r.mainResolveTexture = t.createTexture({
      label: "textureManager/mainResolveTexture",
      size: { width: p, height: y },
      format: n,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    }), r.mainResolveView = r.mainResolveTexture.createView(), r.overlayMsaaTexture = t.createTexture({
      label: "textureManager/annotationOverlayMsaaTexture",
      size: { width: p, height: y },
      sampleCount: i,
      format: n,
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    }), r.overlayMsaaView = r.overlayMsaaTexture.createView(), r.overlayBlitBindGroup = t.createBindGroup({
      label: "textureManager/overlayBlitBindGroup",
      layout: o,
      entries: [{ binding: 0, resource: r.mainResolveView }]
    })), r.overlayTargetsWidth = p, r.overlayTargetsHeight = y, r.overlayTargetsFormat = n, l = null;
  }
  let l = null;
  function c() {
    return l || (l = {
      mainColorView: r.mainColorView,
      mainResolveView: r.mainResolveView,
      overlayMsaaView: r.overlayMsaaView,
      overlayBlitBindGroup: r.overlayBlitBindGroup,
      overlayBlitPipeline: s,
      msaaSampleCount: i,
      mainSceneMsaaSampleCount: i
    }), l;
  }
  function u() {
    Ci(r.mainColorTexture), Ci(r.mainResolveTexture), Ci(r.overlayMsaaTexture), r.mainColorTexture = null, r.mainColorView = null, r.mainResolveTexture = null, r.mainResolveView = null, r.overlayMsaaTexture = null, r.overlayMsaaView = null, r.overlayBlitBindGroup = null, r.overlayTargetsWidth = 0, r.overlayTargetsHeight = 0, r.overlayTargetsFormat = null, l = null;
  }
  return {
    ensureTextures: a,
    getState: c,
    dispose: u
  };
}
const Vs = 0.1, cf = 0, $s = 0.05;
function hm(e, t) {
  return e === void 0 && t === void 0;
}
function mv(e) {
  return e === "continuous" || e === "animated" || e === "sticky" ? e : "sticky";
}
function pv(e, t = $s) {
  const n = Number.isFinite(t) && t >= 0 ? t : $s;
  if (e == null)
    return { min: n, max: n };
  if (typeof e == "number") {
    const i = Number.isFinite(e) && e >= 0 ? e : n;
    return { min: i, max: i };
  }
  if (Array.isArray(e) && e.length >= 2) {
    const i = e[0], r = e[1], o = typeof i == "number" && Number.isFinite(i) && i >= 0 ? i : n, s = typeof r == "number" && Number.isFinite(r) && r >= 0 ? r : n;
    return { min: o, max: s };
  }
  return { min: n, max: n };
}
function ym(e, t) {
  if (e === t)
    t = e + 1;
  else if (e > t) {
    const n = e;
    e = t, t = n;
  }
  return { min: e, max: t };
}
function kl(e, t, n = $s) {
  const { min: i, max: r } = e;
  if (!Number.isFinite(i) || !Number.isFinite(r))
    return { min: i, max: r };
  const o = Math.max(Math.abs(r - i), Number.EPSILON), s = pv(t, n);
  return ym(i - o * s.min, r + o * s.max);
}
function uf(e, t = 10, n, i = $s) {
  const { min: r, max: o } = e;
  if (!Number.isFinite(r) || !Number.isFinite(o) || !(r > 0) || !(o > 0))
    return { min: r, max: o };
  const s = Number.isFinite(t) && t > 0 && t !== 1 ? t : 10, a = Math.log(s), l = kl(
    { min: Math.log(r) / a, max: Math.log(o) / a },
    n,
    i
  );
  return {
    min: s ** l.min,
    max: s ** l.max
  };
}
function hv(e, t, n) {
  const i = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
  if (e == null || !Number.isFinite(e.min) || !Number.isFinite(e.max))
    return { domain: { min: t.min, max: t.max }, settled: !0 };
  if (i >= 1)
    return { domain: { min: t.min, max: t.max }, settled: !0 };
  const r = e.min + (t.min - e.min) * i, o = e.max + (t.max - e.max) * i, s = ym(r, o), l = Math.max(Math.abs(t.max - t.min), Number.EPSILON) * 1e-4, c = Math.abs(s.min - t.min) <= l && Math.abs(s.max - t.max) <= l;
  return {
    domain: c ? { min: t.min, max: t.max } : s,
    settled: c
  };
}
function yv(e, t, n) {
  return e === !0 || !hm(t, n);
}
function gv(e, t, n) {
  return n.skipSticky ? { min: e.min, max: e.max } : t != null && Number.isFinite(t.min) && Number.isFinite(t.max) ? t : { min: e.min, max: e.max };
}
function Zl(e, t, n = Vs) {
  const { min: i, max: r } = e;
  if (!Number.isFinite(i) || !Number.isFinite(r))
    return { min: i, max: r };
  const o = Math.max(r - i, Number.EPSILON), s = o * n, a = Math.max(o * 1e-9, Number.EPSILON), l = (f, d) => {
    if (f === d)
      d = f + 1;
    else if (f > d) {
      const m = f;
      f = d, d = m;
    }
    return { min: f, max: d };
  };
  if (!t || !Number.isFinite(t.min) || !Number.isFinite(t.max))
    return l(i, r);
  if (i >= t.min && r <= t.max)
    return i > t.min + a ? l(i, r) : t;
  let c, u;
  return i > t.min + a && r > t.max ? (c = i, u = r + s) : (c = i < t.min ? i - s : t.min, i > t.min + a && (c = i), u = r > t.max ? r + s : t.max), l(c, u);
}
function gm(e, t, n = 10, i = Vs) {
  const { min: r, max: o } = e;
  if (!Number.isFinite(r) || !Number.isFinite(o) || !(r > 0) || !(o > 0))
    return { min: r, max: o };
  const s = Number.isFinite(n) && n > 0 && n !== 1 ? n : 10, a = Math.log(s), l = Math.log(r) / a, c = Math.log(o) / a, u = t != null && t.min > 0 && t.max > 0 && Number.isFinite(t.min) && Number.isFinite(t.max) ? { min: Math.log(t.min) / a, max: Math.log(t.max) / a } : null, f = Zl({ min: l, max: c }, u, i);
  return {
    min: s ** f.min,
    max: s ** f.max
  };
}
function ff(e) {
  if (e.updateTransitionActive) {
    const o = e.transitionDomain ?? e.dataDomain;
    return {
      domain: { min: o.min, max: o.max },
      mode: "transition",
      nextSticky: null,
      nextAnimatedDisplay: null,
      needsFrame: !1
    };
  }
  if (!hm(e.explicitMin, e.explicitMax))
    return {
      domain: { min: e.dataDomain.min, max: e.dataDomain.max },
      mode: "explicit",
      nextSticky: null,
      nextAnimatedDisplay: null,
      needsFrame: !1
    };
  const t = e.axisType === "log", n = e.logBase ?? 10, i = mv(e.autoRange);
  if (i === "continuous")
    return {
      domain: t ? uf(e.dataDomain, n, e.growBy) : kl(e.dataDomain, e.growBy),
      mode: "continuous",
      nextSticky: null,
      nextAnimatedDisplay: null,
      needsFrame: !1
    };
  if (i === "animated") {
    const o = t ? uf(e.dataDomain, n, e.growBy) : kl(e.dataDomain, e.growBy), s = typeof e.animatedAlpha == "number" && Number.isFinite(e.animatedAlpha) ? e.animatedAlpha : 0.22, a = hv(e.animatedDisplay, o, s);
    return {
      domain: a.domain,
      mode: "animated",
      nextSticky: null,
      nextAnimatedDisplay: a.domain,
      needsFrame: !a.settled
    };
  }
  if (t) {
    const o = gm(e.dataDomain, e.sticky, n, Vs);
    return {
      domain: o,
      mode: "sticky",
      nextSticky: o,
      nextAnimatedDisplay: null,
      needsFrame: !1
    };
  }
  const r = Zl(e.dataDomain, e.sticky, Vs);
  return {
    domain: r,
    mode: "sticky",
    nextSticky: r,
    nextAnimatedDisplay: null,
    needsFrame: !1
  };
}
function xv(e, t = 120) {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const n = Number.isFinite(t) && t > 0 ? t : 120, i = 1 - Math.exp(-e / n);
  return i >= 1 ? 1 : i;
}
const bv = 50;
function df(e) {
  const t = e.indexOf("epoch:");
  return t < 0 ? "" : e.slice(t, t + 24);
}
function mf(e) {
  const t = e.indexOf("th:");
  if (t < 0) return "";
  const n = e.indexOf("|", t);
  return n < 0 ? e.slice(t) : e.slice(t, n + 1);
}
function vv(e) {
  if (e.nextFullSignature === e.lastFullSignature && e.lastFullSignature !== "")
    return {
      shouldUpdate: !1,
      positionOnly: !1,
      contentChanged: !1,
      epochChanged: !1,
      tickSetChanged: !1,
      reason: "unchanged"
    };
  if (e.lastFullSignature === "")
    return {
      shouldUpdate: !0,
      positionOnly: !1,
      contentChanged: !0,
      epochChanged: !0,
      tickSetChanged: !0,
      reason: "first"
    };
  const t = e.nextContentSignature !== e.lastContentSignature, n = df(e.lastContentSignature) !== df(e.nextContentSignature), i = e.lastTickHashSegment ?? mf(e.lastContentSignature), r = e.nextTickHashSegment ?? mf(e.nextContentSignature), o = i !== r && r !== "";
  return t ? n ? {
    shouldUpdate: !0,
    positionOnly: !1,
    contentChanged: !0,
    epochChanged: !0,
    tickSetChanged: o,
    reason: "epoch"
  } : o ? {
    shouldUpdate: !0,
    positionOnly: !1,
    contentChanged: !0,
    epochChanged: !1,
    tickSetChanged: !0,
    reason: "tick-set"
  } : e.nowMs - e.lastUpdateMs >= bv ? {
    shouldUpdate: !0,
    positionOnly: !1,
    contentChanged: !0,
    epochChanged: !1,
    tickSetChanged: !1,
    reason: "structural-throttle"
  } : {
    shouldUpdate: !1,
    positionOnly: !1,
    contentChanged: !0,
    epochChanged: !1,
    tickSetChanged: !1,
    reason: "skip-throttle"
  } : {
    shouldUpdate: !0,
    positionOnly: !0,
    contentChanged: !1,
    epochChanged: !1,
    tickSetChanged: !1,
    reason: "position-only"
  };
}
function wv(e) {
  if (e == null) return !0;
  const { start: t, end: n } = e;
  if (!Number.isFinite(t) || !Number.isFinite(n)) return !0;
  const i = 0.5;
  return t <= i && n >= 100 - i;
}
const pf = wv;
function xm(e, t) {
  const n = t == null ? void 0 : t.xWindow, i = (t == null ? void 0 : t.positiveOnly) === !0, r = (t == null ? void 0 : t.expandEqual) ?? !i;
  let o = Number.POSITIVE_INFINITY, s = Number.NEGATIVE_INFINITY;
  const a = n != null && Number.isFinite(n.min) && Number.isFinite(n.max), l = a ? n.min : 0, c = a ? n.max : 0, u = $e(e);
  for (let f = 0; f < u; f++) {
    if (a) {
      const m = Te(e, f);
      if (!Number.isFinite(m) || m < l || m > c) continue;
    }
    const d = ht(e, f);
    Number.isFinite(d) && (i && !(d > 0) || (d < o && (o = d), d > s && (s = d)));
  }
  return !Number.isFinite(o) || !Number.isFinite(s) || i && (!(o > 0) || !(s > 0)) ? null : (r && o === s && (s = o + 1), { yMin: o, yMax: s });
}
function Nv(e, t) {
  return xm(e, { xWindow: t, positiveOnly: !1, expandEqual: !0 });
}
function Mv(e, t) {
  return xm(e, { xWindow: t, positiveOnly: !0, expandEqual: !1 });
}
const hf = `// crosshair.wgsl
// Minimal crosshair line shader:
// - Vertex input: vec2<f32> position in clip-space coordinates
// - VS uniform: transform mat4 (identity)
// - FS uniform: solid RGBA color

struct VSUniforms {
  transform: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct FSUniforms {
  color: vec4<f32>,
};

@group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;

struct VSIn {
  @location(0) position: vec2<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
};

@vertex
fn vsMain(in: VSIn) -> VSOut {
  var out: VSOut;
  out.clipPosition = vsUniforms.transform * vec4<f32>(in.position, 0.0, 1.0);
  return out;
}

@fragment
fn fsMain() -> @location(0) vec4<f32> {
  return fsUniforms.color;
}

`, Sv = (e) => e + 3 & -4, Cv = 1024, Fv = 128, Av = 16384, Iv = (e) => {
  if (e.byteOffset & 3)
    throw new Error("createStreamBuffer.write: data.byteOffset must be 4-byte aligned.");
  return new Uint32Array(e.buffer, e.byteOffset, e.byteLength >>> 2);
};
function Pv(e, t) {
  if (!Number.isFinite(t) || t <= 0)
    throw new Error(
      `createStreamBuffer(maxSize): maxSize (bytes) must be a positive number. Received: ${String(t)}`
    );
  const n = Math.max(4, Math.floor(t)), i = Sv(n), r = e.limits.maxBufferSize;
  if (i > r)
    throw new Error(
      `createStreamBuffer(maxSize): requested size ${i} bytes exceeds device.limits.maxBufferSize (${r}).`
    );
  const o = i >>> 2, s = (A) => ({
    buffer: e.createBuffer({
      label: A,
      size: i,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    }),
    mirror: new Uint32Array(o)
  }), a = [s("streamBuffer/a"), s("streamBuffer/b")];
  let l = !1, c = 0, u = 0;
  const f = () => {
    if (l) throw new Error("createStreamBuffer: StreamBuffer is disposed.");
  }, d = (A, M, h) => {
    const b = a[A], v = b.mirror;
    if (h < 0 || h > M.length)
      throw new Error("createStreamBuffer.write: internal error (invalid usedWords).");
    if (h === 0) return;
    const x = h << 2;
    e.queue.writeBuffer(b.buffer, 0, M.buffer, M.byteOffset, x), v.set(M.subarray(0, h), 0);
  }, m = (A, M, h) => {
    const b = a[A], v = b.mirror;
    if (h < 0 || h > M.length)
      throw new Error("createStreamBuffer.write: internal error (invalid usedWords).");
    const x = h << 2;
    if (x > 0 && x <= Cv) {
      d(A, M, h);
      return;
    }
    const F = [];
    let I = 0, R = 0, T = 0;
    for (; T < h; ) {
      for (; T < h && v[T] === M[T]; ) T++;
      if (T >= h) break;
      const N = T;
      for (T++; T < h && v[T] !== M[T]; ) T++;
      const w = T;
      if (F.push([N, w]), I++, R += w - N, I > Fv || R > Av) {
        d(A, M, h);
        return;
      }
    }
    for (let N = 0; N < F.length; N++) {
      const [w, P] = F[N], B = w << 2, _ = P - w << 2;
      e.queue.writeBuffer(b.buffer, B, M.buffer, M.byteOffset + B, _), v.set(M.subarray(w, P), w);
    }
  };
  return { write: (A) => {
    if (f(), A.length & 1)
      throw new Error("createStreamBuffer.write: data length must be even (vec2<f32> vertices).");
    const M = A.byteLength;
    if (M > i)
      throw new Error(
        `createStreamBuffer.write: data.byteLength (${M}) exceeds capacity (${i}). Increase maxSize.`
      );
    const h = A.length >>> 1;
    if (M === 0) {
      u = h;
      return;
    }
    const b = Iv(A), v = 1 - c;
    m(v, b, b.length), c = v, u = h;
  }, getBuffer: () => (f(), a[c].buffer), getVertexCount: () => (f(), u), dispose: () => {
    if (!l) {
      l = !0, u = 0;
      for (const A of a)
        try {
          A.buffer.destroy();
        } catch {
        }
    }
  } };
}
const Tv = "bgra8unorm", Bv = [1, 1, 1, 0.8], Rv = 8, Dv = 6, kv = 4, bm = 8192, Ev = (() => {
  const e = new ArrayBuffer(64);
  return new Float32Array(e).set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), e;
})(), Lv = (e) => Number.isFinite(e.left) && Number.isFinite(e.right) && Number.isFinite(e.top) && Number.isFinite(e.bottom) && Number.isFinite(e.canvasWidth) && Number.isFinite(e.canvasHeight), ts = (e, t, n) => Math.min(n, Math.max(t, e | 0)), Uv = (e, t) => {
  if (!Number.isFinite(e) || e < 0)
    throw new Error("CrosshairRenderer.prepare: lineWidth must be a finite non-negative number.");
  if (e === 0) return [];
  const n = e * t, i = Math.max(1, Math.min(Rv, Math.round(n))), r = (i - 1) / 2, o = [];
  for (let s = 0; s < i; s++) o.push(s - r);
  return o;
}, Ar = (e, t) => e / t * 2 - 1, Ir = (e, t) => 1 - e / t * 2, ns = (e, t) => {
  e.push(t[0], t[1], t[2], t[3]);
}, yf = (e, t) => {
  if (!Number.isFinite(e) || !Number.isFinite(t)) return [];
  const n = Math.min(e, t), i = Math.max(e, t);
  if (i <= n) return [];
  const r = Dv, s = r + kv;
  if (!Number.isFinite(s)) return [];
  const a = Math.ceil((i - n) / s);
  if (!Number.isFinite(a) || a <= 0) return [];
  const l = [];
  let c = n;
  for (; c < i; ) {
    const u = c, f = Math.min(c + r, i);
    f > u && l.push([u, f]), c += s;
  }
  return l;
}, _v = (e, t, n, i) => {
  if (!Number.isFinite(e) || !Number.isFinite(t))
    throw new Error("CrosshairRenderer.prepare: x and y must be finite numbers.");
  if (!Lv(n))
    throw new Error("CrosshairRenderer.prepare: gridArea dimensions must be finite numbers.");
  if (n.canvasWidth <= 0 || n.canvasHeight <= 0)
    throw new Error("CrosshairRenderer.prepare: canvas dimensions must be positive.");
  if (n.left < 0 || n.right < 0 || n.top < 0 || n.bottom < 0)
    throw new Error("CrosshairRenderer.prepare: gridArea margins must be non-negative.");
  const { canvasWidth: r, canvasHeight: o } = n, s = Number.isFinite(n.devicePixelRatio) && n.devicePixelRatio > 0 ? n.devicePixelRatio : 1, a = n.left * s, l = r - n.right * s, c = n.top * s, u = o - n.bottom * s, f = ts(Math.floor(a), 0, Math.max(0, r)), d = ts(Math.floor(c), 0, Math.max(0, o)), m = ts(Math.ceil(l), 0, Math.max(0, r)), p = ts(Math.ceil(u), 0, Math.max(0, o)), y = Math.max(0, m - f), g = Math.max(0, p - d), S = e * s, A = t * s, M = Uv(i.lineWidth, s);
  if (M.length === 0 || !i.showX && !i.showY)
    return {
      vertices: new Float32Array(0),
      scissor: { x: f, y: d, w: y, h: g }
    };
  const h = [], b = i.showX ? yf(c, u) : [], v = i.showY ? yf(a, l) : [], F = ((i.showX ? b.length : 0) + (i.showY ? v.length : 0)) * M.length * 2, I = F > 0 && F <= bm, R = (w) => {
    const P = Ar(w, r), B = Ir(c, o), _ = Ir(u, o);
    ns(h, [P, B, P, _]);
  }, T = (w) => {
    const P = Ir(w, o), B = Ar(a, r), _ = Ar(l, r);
    ns(h, [B, P, _, P]);
  };
  if (i.showX)
    for (let w = 0; w < M.length; w++) {
      const P = S + M[w];
      if (!I) {
        R(P);
        continue;
      }
      const B = Ar(P, r);
      for (let _ = 0; _ < b.length; _++) {
        const [C, E] = b[_], U = Ir(C, o), G = Ir(E, o);
        ns(h, [B, U, B, G]);
      }
    }
  if (i.showY)
    for (let w = 0; w < M.length; w++) {
      const P = A + M[w];
      if (!I) {
        T(P);
        continue;
      }
      const B = Ir(P, o);
      for (let _ = 0; _ < v.length; _++) {
        const [C, E] = v[_], U = Ar(C, r), G = Ar(E, r);
        ns(h, [U, B, G, B]);
      }
    }
  return {
    vertices: new Float32Array(h),
    scissor: { x: f, y: d, w: y, h: g }
  };
};
function zv(e, t) {
  let n = !1, i = !0;
  const r = (t == null ? void 0 : t.targetFormat) ?? Tv, o = (t == null ? void 0 : t.sampleCount) ?? 1, s = Number.isFinite(o) ? Math.max(1, Math.floor(o)) : 1, a = t == null ? void 0 : t.pipelineCache, l = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      }
    ]
  }), c = un(e, 64, {
    label: "crosshairRenderer/vsUniforms"
  }), u = un(e, 16, {
    label: "crosshairRenderer/fsUniforms"
  }), f = e.createBindGroup({
    layout: l,
    entries: [
      { binding: 0, resource: { buffer: c } },
      { binding: 1, resource: { buffer: u } }
    ]
  }), d = vn(
    e,
    {
      label: "crosshairRenderer/pipeline",
      bindGroupLayouts: [l],
      vertex: {
        code: hf,
        label: "crosshair.wgsl",
        buffers: [
          {
            arrayStride: 8,
            stepMode: "vertex",
            attributes: [{ shaderLocation: 0, format: "float32x2", offset: 0 }]
          }
        ]
      },
      fragment: {
        code: hf,
        label: "crosshair.wgsl",
        formats: r,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "line-list", cullMode: "none" },
      multisample: { count: s }
    },
    a
  ), m = Pv(e, bm * 8);
  let p = 0, y = 0, g = 0, S = { x: 0, y: 0, w: 0, h: 0 };
  const A = () => {
    if (n) throw new Error("CrosshairRenderer is disposed.");
  };
  return { prepare: (x, F, I, R) => {
    if (A(), typeof R.showX != "boolean" || typeof R.showY != "boolean")
      throw new Error("CrosshairRenderer.prepare: showX/showY must be boolean.");
    if (typeof R.color != "string")
      throw new Error("CrosshairRenderer.prepare: color must be a string.");
    if (!Number.isFinite(R.lineWidth) || R.lineWidth < 0)
      throw new Error("CrosshairRenderer.prepare: lineWidth must be a finite non-negative number.");
    const { vertices: T, scissor: N } = _v(x, F, I, R);
    T.byteLength === 0 ? p = 0 : (m.write(T), p = m.getVertexCount()), fn(e, c, Ev);
    const w = wn(R.color) ?? Bv, P = new ArrayBuffer(4 * 4);
    new Float32Array(P).set([w[0], w[1], w[2], w[3]]), fn(e, u, P), y = I.canvasWidth, g = I.canvasHeight, S = N;
  }, render: (x) => {
    A(), i && p !== 0 && (y <= 0 || g <= 0 || (x.setScissorRect(S.x, S.y, S.w, S.h), x.setPipeline(d), x.setBindGroup(0, f), x.setVertexBuffer(0, m.getBuffer()), x.draw(p), x.setScissorRect(0, 0, y, g)));
  }, setVisible: (x) => {
    A(), i = !!x;
  }, dispose: () => {
    if (!n) {
      n = !0;
      try {
        c.destroy();
      } catch {
      }
      try {
        u.destroy();
      } catch {
      }
      m.dispose(), p = 0, y = 0, g = 0, S = { x: 0, y: 0, w: 0, h: 0 };
    }
  } };
}
const gf = `// highlight.wgsl
// Draws an anti-aliased ring highlight around a point.
//
// Contract:
// - \`@builtin(position)\` in the fragment stage is framebuffer-space pixels.
// - The renderer supplies \`center\` and ring sizes in *device pixels*.

struct Uniforms {
  center: vec2<f32>,
  radius: f32,
  thickness: f32,
  color: vec4<f32>,
  outlineColor: vec4<f32>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
  @builtin(position) position: vec4<f32>,
};

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> VSOut {
  // Fullscreen triangle.
  // Covers clip-space [-1,1] with 3 verts: (-1,-1), (3,-1), (-1,3)
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );

  var out: VSOut;
  out.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  return out;
}

fn ringCoverage(distancePx: f32, radiusPx: f32, thicknessPx: f32) -> f32 {
  let aa = 1.0; // ~1px antialias band (device pixels)
  let halfT = max(0.5, thicknessPx * 0.5);
  let a0 = smoothstep(radiusPx - halfT - aa, radiusPx - halfT + aa, distancePx);
  let a1 = smoothstep(radiusPx + halfT - aa, radiusPx + halfT + aa, distancePx);
  return clamp(a0 - a1, 0.0, 1.0);
}

@fragment
fn fsMain(@builtin(position) fragPos: vec4<f32>) -> @location(0) vec4<f32> {
  let d = distance(fragPos.xy, u.center);

  let ring = ringCoverage(d, u.radius, u.thickness);
  let outline = ringCoverage(d, u.radius, u.thickness + 2.0);

  let cover = max(ring, outline);
  if (cover <= 0.0) {
    discard;
  }

  // Blend between outline and ring color based on relative coverage,
  // then apply total coverage as alpha.
  let t = clamp(select(0.0, ring / cover, cover > 0.0), 0.0, 1.0);
  let rgb = mix(u.outlineColor.rgb, u.color.rgb, t);
  let a = mix(u.outlineColor.a, u.color.a, t) * cover;
  return vec4<f32>(rgb, a);
}

`, Gv = "bgra8unorm", Ov = [1, 1, 1, 1], is = (e) => Math.min(1, Math.max(0, e)), rs = (e, t, n) => Math.min(n, Math.max(t, e | 0)), Hv = (e) => Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.w) && Number.isFinite(e.h), Yv = (e, t) => {
  const n = Number.isFinite(t) ? t : 1;
  return [is(e[0] * n), is(e[1] * n), is(e[2] * n), is(e[3])];
}, Wv = (e) => 0.2126 * e[0] + 0.7152 * e[1] + 0.0722 * e[2];
function Xv(e, t) {
  let n = !1, i = !0;
  const r = (t == null ? void 0 : t.targetFormat) ?? Gv, o = (t == null ? void 0 : t.sampleCount) ?? 1, s = Number.isFinite(o) ? Math.max(1, Math.floor(o)) : 1, a = t == null ? void 0 : t.pipelineCache, l = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      }
    ]
  }), c = un(e, 48, {
    label: "highlightRenderer/uniforms"
  }), u = e.createBindGroup({
    layout: l,
    entries: [{ binding: 0, resource: { buffer: c } }]
  }), f = vn(
    e,
    {
      label: "highlightRenderer/pipeline",
      bindGroupLayouts: [l],
      vertex: { code: gf, label: "highlight.wgsl" },
      fragment: {
        code: gf,
        label: "highlight.wgsl",
        formats: r,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: s }
    },
    a
  );
  let d = 0, m = 0, p = { x: 0, y: 0, w: 0, h: 0 }, y = !1;
  const g = () => {
    if (n) throw new Error("HighlightRenderer is disposed.");
  };
  return { prepare: (b, v, x) => {
    if (g(), !Number.isFinite(b.centerDeviceX) || !Number.isFinite(b.centerDeviceY))
      throw new Error("HighlightRenderer.prepare: point center must be finite.");
    if (!Number.isFinite(b.canvasWidth) || !Number.isFinite(b.canvasHeight) || b.canvasWidth <= 0 || b.canvasHeight <= 0)
      throw new Error("HighlightRenderer.prepare: canvasWidth/canvasHeight must be positive finite numbers.");
    if (!Hv(b.scissor))
      throw new Error("HighlightRenderer.prepare: scissor must be finite.");
    if (!Number.isFinite(x) || x < 0)
      throw new Error("HighlightRenderer.prepare: size must be a finite non-negative number.");
    const F = b.devicePixelRatio, I = Number.isFinite(F) && F > 0 ? F : 1, R = x * I, T = Math.max(1, R * 1.5), N = Math.max(1, Math.round(Math.max(2, T * 0.25))), w = wn(v) ?? Ov, P = Yv(w, 1.25), _ = Wv(w) > 0.7 ? [0, 0, 0, 0.9] : [1, 1, 1, 0.9], C = new ArrayBuffer(12 * 4);
    new Float32Array(C).set([
      b.centerDeviceX,
      b.centerDeviceY,
      T,
      N,
      P[0],
      P[1],
      P[2],
      1,
      _[0],
      _[1],
      _[2],
      _[3]
    ]), fn(e, c, C), d = b.canvasWidth, m = b.canvasHeight;
    const E = rs(Math.floor(b.scissor.x), 0, Math.max(0, b.canvasWidth)), U = rs(Math.floor(b.scissor.y), 0, Math.max(0, b.canvasHeight)), G = rs(Math.ceil(b.scissor.x + b.scissor.w), 0, Math.max(0, b.canvasWidth)), O = rs(Math.ceil(b.scissor.y + b.scissor.h), 0, Math.max(0, b.canvasHeight));
    p = {
      x: E,
      y: U,
      w: Math.max(0, G - E),
      h: Math.max(0, O - U)
    }, y = !0;
  }, render: (b) => {
    g(), i && y && (d <= 0 || m <= 0 || p.w === 0 || p.h === 0 || (b.setScissorRect(p.x, p.y, p.w, p.h), b.setPipeline(f), b.setBindGroup(0, u), b.draw(3), b.setScissorRect(0, 0, d, m)));
  }, setVisible: (b) => {
    g(), i = !!b;
  }, dispose: () => {
    if (!n) {
      n = !0;
      try {
        c.destroy();
      } catch {
      }
      d = 0, m = 0, p = { x: 0, y: 0, w: 0, h: 0 }, y = !1;
    }
  } };
}
const xf = `// Reference line renderer (axis-aligned, instanced quads).
//
// Coordinate conventions:
// - Instance position is provided in CANVAS-LOCAL CSS pixels (same coordinate space as pointer events).
// - Plot rect is provided in DEVICE pixels (computed from grid margins + DPR).
// - Line width and dash lengths are provided in CSS pixels and converted in-shader using DPR.
//
// Scissoring/clipping:
// - The render coordinator is expected to set a scissor rect for the plot area before drawing.
// - This shader simply draws full-height/full-width quads; clipping is handled by scissor.
//
// Dash semantics:
// - lineDash is a repeating on/off sequence in CSS pixels, starting with "on" at t=0.
// - Up to 8 dash entries are supported per line (truncated on CPU).
//
// Performance:
// - Vertex stage expands each instance into a quad (2 triangles, 6 vertices).
// - We intentionally avoid snapping to integer device pixels to prevent visible stepping/jiggle
//   while zooming; edge AA is handled in the fragment stage.

struct VSUniforms {
  canvasSize : vec2<f32>,     // device pixels (canvas.width, canvas.height)
  plotOrigin : vec2<f32>,     // device pixels (plotLeft, plotTop)
  plotSize : vec2<f32>,       // device pixels (plotWidth, plotHeight)
  devicePixelRatio : f32,
  _pad0 : f32,
};

@group(0) @binding(0) var<uniform> u : VSUniforms;

struct VSIn {
  // axisPos.x = axis (0 = vertical, 1 = horizontal)
  // axisPos.y = position in CANVAS-LOCAL CSS pixels (x for vertical, y for horizontal)
  @location(0) axisPos : vec2<f32>,

  // widthDashCount.x = lineWidth in CSS px
  // widthDashCount.y = dashCount (float, cast to u32)
  @location(1) widthDashCount : vec2<f32>,

  // dashMeta.x = dashTotal (CSS px)
  // dashMeta.y = reserved (unused)
  @location(2) dashMeta : vec2<f32>,

  @location(3) dash0_3 : vec4<f32>,
  @location(4) dash4_7 : vec4<f32>,

  // Premultiplied or straight alpha is fine; blending is handled by pipeline state.
  @location(5) color : vec4<f32>,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,

  // Distance along the line in CSS pixels (0..plotLengthCss).
  @location(0) alongCss : f32,

  // Packed dash metadata to avoid extra varyings.
  // dashInfo.x = dashCount (float, cast to u32)
  // dashInfo.y = dashTotal (CSS px)
  @location(1) @interpolate(flat) dashInfo : vec2<f32>,

  @location(2) @interpolate(flat) dash0_3 : vec4<f32>,
  @location(3) @interpolate(flat) dash4_7 : vec4<f32>,
  @location(4) @interpolate(flat) color : vec4<f32>,

  // Axis-aligned quad anti-aliasing (device pixels).
  // acrossDevice ranges [0..widthDevice] across the stroke thickness.
  @location(5) acrossDevice : f32,
  @location(6) @interpolate(flat) widthDevice : f32,
};

fn quadUv(vid : u32) -> vec2<f32> {
  // Two triangles covering [0,1]x[0,1].
  // 0: (0,0) 1:(1,0) 2:(0,1) 3:(0,1) 4:(1,0) 5:(1,1)
  switch (vid) {
    case 0u: { return vec2<f32>(0.0, 0.0); }
    case 1u: { return vec2<f32>(1.0, 0.0); }
    case 2u: { return vec2<f32>(0.0, 1.0); }
    case 3u: { return vec2<f32>(0.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, 0.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

@vertex
fn vsMain(in : VSIn, @builtin(vertex_index) vid : u32) -> VSOut {
  let uv = quadUv(vid);
  let dpr = max(1e-6, u.devicePixelRatio);
  // IMPORTANT: Do NOT snap reference lines to integer device pixels.
  // Snapping looks crisp at rest but causes visible "jiggle" / stepping while zooming because
  // the line position is continuously changing (data-space → screen-space), and rounding
  // quantizes that motion to adjacent pixels. We rely on analytic AA in the fragment stage
  // to keep strokes stable and reasonably crisp across DPRs.

  let axis = in.axisPos.x;
  let posCss = in.axisPos.y;
  let widthCss = max(0.0, in.widthDashCount.x);
  let widthDevice = max(1.0, widthCss * dpr);

  var xDevice : f32;
  var yDevice : f32;
  var alongCss : f32;
  var acrossDevice : f32;

  if (axis < 0.5) {
    // Vertical line at x = posCss (canvas-local CSS px), spanning plot height.
    let centerX = posCss * dpr;
    let startX = centerX - 0.5 * widthDevice;
    xDevice = startX + uv.x * widthDevice;
    yDevice = u.plotOrigin.y + uv.y * u.plotSize.y;
    alongCss = (uv.y * u.plotSize.y) / dpr;
    acrossDevice = uv.x * widthDevice;
  } else {
    // Horizontal line at y = posCss (canvas-local CSS px), spanning plot width.
    let centerY = posCss * dpr;
    let startY = centerY - 0.5 * widthDevice;
    xDevice = u.plotOrigin.x + uv.x * u.plotSize.x;
    yDevice = startY + uv.y * widthDevice;
    alongCss = (uv.x * u.plotSize.x) / dpr;
    acrossDevice = uv.y * widthDevice;
  }

  let clipX = (xDevice / u.canvasSize.x) * 2.0 - 1.0;
  let clipY = 1.0 - (yDevice / u.canvasSize.y) * 2.0;

  var out : VSOut;
  out.position = vec4<f32>(clipX, clipY, 0.0, 1.0);
  out.alongCss = alongCss;
  out.dashInfo = vec2<f32>(in.widthDashCount.y, in.dashMeta.x);
  out.dash0_3 = in.dash0_3;
  out.dash4_7 = in.dash4_7;
  out.color = in.color;
  out.acrossDevice = acrossDevice;
  out.widthDevice = widthDevice;
  return out;
}

fn dashValue(i : u32, d0 : vec4<f32>, d1 : vec4<f32>) -> f32 {
  switch (i) {
    case 0u: { return d0.x; }
    case 1u: { return d0.y; }
    case 2u: { return d0.z; }
    case 3u: { return d0.w; }
    case 4u: { return d1.x; }
    case 5u: { return d1.y; }
    case 6u: { return d1.z; }
    default: { return d1.w; }
  }
}

@fragment
fn fsMain(in : VSOut) -> @location(0) vec4<f32> {
  // Analytic edge anti-aliasing for axis-aligned quads (reduces shimmering during zoom).
  // This is a lightweight alternative to full MSAA for thin strokes.
  let edgeDist = min(in.acrossDevice, in.widthDevice - in.acrossDevice);
  // Slightly widen AA to reduce temporal shimmer on moving 1-2px strokes.
  // Keep conservative so lines remain reasonably crisp.
  let aa = max(fwidth(in.acrossDevice), 1e-3) * 1.25;
  let edgeCoverage = smoothstep(0.0, aa, edgeDist);
  var color = in.color;
  color.a = color.a * edgeCoverage;

  let dashCount = u32(round(in.dashInfo.x));
  let dashTotal = in.dashInfo.y;

  // IMPORTANT: derivative ops (fwidth) must execute in uniform control flow.
  // So compute the dash parameterization unconditionally (using a safe total) BEFORE any early-return.
  let dashTotalSafe = max(dashTotal, 1.0);
  let t = in.alongCss - floor(in.alongCss / dashTotalSafe) * dashTotalSafe;
  // Anti-alias dash edges along the line axis (CSS pixels).
  // This reduces shimmer during zoom for dashed reference lines without requiring MSAA.
  let dashAa = max(fwidth(t), 1e-3);

  // Solid line (no dash pattern).
  if (dashCount == 0u || dashTotal <= 0.0) {
    return color;
  }

  var acc = 0.0;
  var on = true;

  for (var i : u32 = 0u; i < 8u; i = i + 1u) {
    if (i >= dashCount) { break; }
    let seg = dashValue(i, in.dash0_3, in.dash4_7);
    if (seg <= 0.0) { continue; }

    if (t < acc + seg) {
      // IMPORTANT: Avoid \`discard\` for off segments.
      // Discard can cause temporal popping on moving dashed edges; prefer a smooth alpha mask.
      //
      // Fade in/out near dash boundaries for smooth edges. This produces coverage in [0..1]
      // within the current segment, going to 0 at segment boundaries.
      let inFromStart = smoothstep(0.0, dashAa, t - acc);
      let inFromEnd = smoothstep(0.0, dashAa, (acc + seg) - t);
      let segCoverage = min(inFromStart, inFromEnd);

      // On segments contribute alpha; off segments contribute 0 alpha (no discard).
      let dashMask = select(0.0, segCoverage, on);
      color.a = color.a * dashMask;
      return color;
    }

    acc = acc + seg;
    on = !on;
  }

  // Defensive fallback if the dash list is degenerate.
  // If we didn't find a segment (shouldn't happen), default to transparent (safer than solid).
  color.a = 0.0;
  return color;
}
`, Rr = 8, Vv = "bgra8unorm", $v = (e) => Number.isFinite(e.left) && Number.isFinite(e.right) && Number.isFinite(e.top) && Number.isFinite(e.bottom) && Number.isFinite(e.canvasWidth) && Number.isFinite(e.canvasHeight), qv = (e) => {
  if (!e || e.length === 0)
    return {
      dashCount: 0,
      dashTotal: 0,
      values: new Array(Rr).fill(0)
    };
  const t = [];
  for (let s = 0; s < e.length; s++) {
    const a = e[s];
    typeof a == "number" && Number.isFinite(a) && a > 0 && t.push(a);
  }
  if (t.length === 0)
    return {
      dashCount: 0,
      dashTotal: 0,
      values: new Array(Rr).fill(0)
    };
  const n = t.length % 2 === 1 ? t.concat(t) : t, i = Math.min(Rr, n.length), r = new Array(Rr).fill(0);
  let o = 0;
  for (let s = 0; s < i; s++)
    r[s] = n[s], o += n[s];
  return !Number.isFinite(o) || o <= 0 ? {
    dashCount: 0,
    dashTotal: 0,
    values: new Array(Rr).fill(0)
  } : { dashCount: i, dashTotal: o, values: r };
};
function bf(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? Vv, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, 32, {
    label: "referenceLineRenderer/vsUniforms"
  }), c = e.createBindGroup({
    layout: a,
    entries: [{ binding: 0, resource: { buffer: l } }]
  }), u = 72, f = u / 4, d = vn(
    e,
    {
      label: "referenceLineRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: xf,
        label: "referenceLine.wgsl",
        buffers: [
          {
            arrayStride: u,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32x2", offset: 0 },
              // axisPos
              { shaderLocation: 1, format: "float32x2", offset: 8 },
              // widthDashCount
              { shaderLocation: 2, format: "float32x2", offset: 16 },
              // dashMeta
              { shaderLocation: 3, format: "float32x4", offset: 24 },
              // dash0_3
              { shaderLocation: 4, format: "float32x4", offset: 40 },
              // dash4_7
              { shaderLocation: 5, format: "float32x4", offset: 56 }
              // color
            ]
          }
        ]
      },
      fragment: {
        code: xf,
        label: "referenceLine.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let m = null, p = 0, y = 0;
  const g = () => {
    if (n) throw new Error("ReferenceLineRenderer is disposed.");
  };
  return { prepare: (h, b) => {
    if (g(), !Array.isArray(b))
      throw new Error("ReferenceLineRenderer.prepare: lines must be an array.");
    if (!$v(h))
      throw new Error("ReferenceLineRenderer.prepare: gridArea dimensions must be finite numbers.");
    if (h.canvasWidth <= 0 || h.canvasHeight <= 0)
      throw new Error("ReferenceLineRenderer.prepare: canvas dimensions must be positive.");
    if (h.left < 0 || h.right < 0 || h.top < 0 || h.bottom < 0)
      throw new Error("ReferenceLineRenderer.prepare: gridArea margins must be non-negative.");
    const v = Number.isFinite(h.devicePixelRatio) && h.devicePixelRatio > 0 ? h.devicePixelRatio : 1, x = h.left * v, F = h.top * v, I = h.canvasWidth - h.right * v, R = h.canvasHeight - h.bottom * v, T = I - x, N = R - F;
    if (!(T > 0) || !(N > 0)) {
      y = 0;
      return;
    }
    const w = new Float32Array(8);
    if (w[0] = h.canvasWidth, w[1] = h.canvasHeight, w[2] = x, w[3] = F, w[4] = T, w[5] = N, w[6] = v, w[7] = 0, fn(e, l, w), b.length === 0) {
      y = 0;
      return;
    }
    if (!m || p < b.length) {
      const B = Math.max(1, Math.ceil(b.length * 1.5)), _ = Math.max(4, B * u);
      if (m)
        try {
          m.destroy();
        } catch {
        }
      m = e.createBuffer({
        label: "referenceLineRenderer/instanceBuffer",
        size: _,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      }), p = B;
    }
    const P = new Float32Array(b.length * f);
    for (let B = 0; B < b.length; B++) {
      const _ = b[B], C = B * f;
      if (_.axis !== "vertical" && _.axis !== "horizontal")
        throw new Error("ReferenceLineRenderer.prepare: line.axis must be 'vertical' or 'horizontal'.");
      if (!Number.isFinite(_.positionCssPx))
        throw new Error("ReferenceLineRenderer.prepare: line.positionCssPx must be a finite number.");
      if (!Number.isFinite(_.lineWidth) || _.lineWidth < 0)
        throw new Error("ReferenceLineRenderer.prepare: line.lineWidth must be a finite non-negative number.");
      const E = _.rgba;
      if (!Array.isArray(E) || E.length !== 4)
        throw new Error("ReferenceLineRenderer.prepare: line.rgba must be a tuple [r,g,b,a].");
      const U = qv(_.lineDash);
      P[C + 0] = _.axis === "vertical" ? 0 : 1, P[C + 1] = _.positionCssPx, P[C + 2] = _.lineWidth, P[C + 3] = U.dashCount, P[C + 4] = U.dashTotal, P[C + 5] = 0;
      for (let G = 0; G < Rr; G++)
        P[C + 6 + G] = U.values[G];
      P[C + 14] = E[0], P[C + 15] = E[1], P[C + 16] = E[2], P[C + 17] = E[3];
    }
    e.queue.writeBuffer(m, 0, P.buffer, P.byteOffset, P.byteLength), y = b.length;
  }, render: (h, b = 0, v) => {
    if (g(), y === 0 || !m) return;
    const x = Number.isFinite(b) ? Math.max(0, Math.floor(b)) : 0, F = Math.max(0, y - x), I = v == null ? F : Number.isFinite(v) ? Math.max(0, Math.min(F, Math.floor(v))) : F;
    I !== 0 && (h.setPipeline(d), h.setBindGroup(0, c), h.setVertexBuffer(0, m), h.draw(6, I, 0, x));
  }, dispose: () => {
    if (!n) {
      n = !0;
      try {
        l.destroy();
      } catch {
      }
      if (m)
        try {
          m.destroy();
        } catch {
        }
      m = null, p = 0, y = 0;
    }
  } };
}
const vf = `// annotationMarker.wgsl
// Instanced annotation marker shader (circle SDF with optional stroke).
//
// Coordinate contract:
// - Instance center is CANVAS-LOCAL CSS pixels (xCssPx, yCssPx)
// - Instance size is diameter in CSS pixels (sizeCssPx)
// - Uniform provides render target size in *device* pixels and DPR for CSS→device conversion.
//
// Draw call: draw(6, instanceCount) using triangle-list quad expansion in VS.

struct VSUniforms {
  viewportPx: vec2<f32>, // render target size in device pixels (width, height)
  dpr: f32,              // device pixel ratio (CSS px -> device px)
  _pad0: f32,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
  // Center in CANVAS-LOCAL CSS pixels.
  @location(0) centerCssPx: vec2<f32>,
  // Marker diameter in CSS pixels.
  @location(1) sizeCssPx: f32,
  // Stroke width in CSS pixels (0 disables stroke).
  @location(2) strokeWidthCssPx: f32,
  // Colors are straight-alpha RGBA in 0..1.
  @location(3) fillRgba: vec4<f32>,
  @location(4) strokeRgba: vec4<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  // Local quad coordinates in [-1, 1]^2 (used for circle SDF).
  @location(0) local: vec2<f32>,
  // Half-size in device pixels (radius in screen space).
  @location(1) halfSizePx: f32,
  @location(2) strokeWidthPx: f32,
  @location(3) fillRgba: vec4<f32>,
  @location(4) strokeRgba: vec4<f32>,
};

@vertex
fn vsMain(in: VSIn, @builtin(vertex_index) vertexIndex: u32) -> VSOut {
  // Fixed local corners for 2 triangles (triangle-list).
  let localCorners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0)
  );

  let corner = localCorners[vertexIndex];

  let dpr = select(1.0, vsUniforms.dpr, vsUniforms.dpr > 0.0);
  let centerPx = in.centerCssPx * dpr;
  let halfSizePx = 0.5 * max(0.0, in.sizeCssPx) * dpr;
  let strokeWidthPx = max(0.0, in.strokeWidthCssPx) * dpr;

  let posPx = centerPx + corner * halfSizePx;

  // Convert device pixels to clip-space with origin at top-left:
  // x: [0..w] -> [-1..1], y: [0..h] -> [1..-1]
  let clipX = (posPx.x / vsUniforms.viewportPx.x) * 2.0 - 1.0;
  let clipY = 1.0 - (posPx.y / vsUniforms.viewportPx.y) * 2.0;

  var out: VSOut;
  out.clipPosition = vec4<f32>(clipX, clipY, 0.0, 1.0);
  out.local = corner;
  out.halfSizePx = halfSizePx;
  out.strokeWidthPx = strokeWidthPx;
  out.fillRgba = in.fillRgba;
  out.strokeRgba = in.strokeRgba;
  return out;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  if (in.halfSizePx <= 0.0) {
    discard;
  }

  // Circle SDF in normalized space: dist == 1 at the circle boundary.
  let dist = length(in.local);
  let aa = max(1e-6, fwidth(dist));

  // Coverage inside the circle.
  let outerCoverage = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, dist);
  if (outerCoverage <= 0.0) {
    discard;
  }

  // Optional stroke: compute inner radius in normalized units.
  let strokeNorm = clamp(in.strokeWidthPx / max(1e-6, in.halfSizePx), 0.0, 1.0);
  let inner = max(0.0, 1.0 - strokeNorm);
  let innerCoverage = 1.0 - smoothstep(inner - aa, inner + aa, dist);

  let fillCoverage = clamp(innerCoverage, 0.0, 1.0);
  let strokeCoverage = clamp(outerCoverage - innerCoverage, 0.0, 1.0);

  let fillA = clamp(in.fillRgba.a, 0.0, 1.0) * fillCoverage;
  let strokeA = clamp(in.strokeRgba.a, 0.0, 1.0) * strokeCoverage;
  let outA = fillA + strokeA;
  if (outA <= 0.0) {
    discard;
  }

  // Straight-alpha output: compute a weighted average RGB for correct blending.
  let rgb = (in.fillRgba.rgb * fillA + in.strokeRgba.rgb * strokeA) / outA;
  return vec4<f32>(rgb, outA);
}

`, jv = "bgra8unorm", Ss = 12, cl = Ss * 4, Ei = (e) => Math.min(1, Math.max(0, e)), wf = (e) => {
  if (!Number.isFinite(e) || e <= 0) return 1;
  const t = Math.ceil(e);
  return 2 ** Math.ceil(Math.log2(t));
};
function Nf(e, t) {
  let n = !1;
  const i = (t == null ? void 0 : t.targetFormat) ?? jv, r = (t == null ? void 0 : t.sampleCount) ?? 1, o = Number.isFinite(r) ? Math.max(1, Math.floor(r)) : 1, s = t == null ? void 0 : t.pipelineCache, a = e.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      }
    ]
  }), l = un(e, 16, {
    label: "annotationMarkerRenderer/vsUniforms"
  }), c = new Float32Array(4), u = e.createBindGroup({
    layout: a,
    entries: [{ binding: 0, resource: { buffer: l } }]
  }), f = vn(
    e,
    {
      label: "annotationMarkerRenderer/pipeline",
      bindGroupLayouts: [a],
      vertex: {
        code: vf,
        label: "annotationMarker.wgsl",
        buffers: [
          {
            arrayStride: cl,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, format: "float32x2", offset: 0 },
              // centerCssPx
              { shaderLocation: 1, format: "float32", offset: 8 },
              // sizeCssPx
              { shaderLocation: 2, format: "float32", offset: 12 },
              // strokeWidthCssPx
              { shaderLocation: 3, format: "float32x4", offset: 16 },
              // fillRgba
              { shaderLocation: 4, format: "float32x4", offset: 32 }
              // strokeRgba
            ]
          }
        ]
      },
      fragment: {
        code: vf,
        label: "annotationMarker.wgsl",
        formats: i,
        blend: {
          color: {
            operation: "add",
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha"
          },
          alpha: {
            operation: "add",
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha"
          }
        }
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: o }
    },
    s
  );
  let d = null, m = 0, p = new ArrayBuffer(0), y = new Float32Array(p);
  const g = () => {
    if (n) throw new Error("AnnotationMarkerRenderer is disposed.");
  }, S = (v) => {
    if (v <= y.length) return;
    const x = Math.max(32, wf(v));
    p = new ArrayBuffer(x * 4), y = new Float32Array(p);
  }, A = (v, x, F) => {
    const I = Number.isFinite(v) && v > 0 ? v : 1, R = Number.isFinite(x) && x > 0 ? x : 1, T = Number.isFinite(F) && F > 0 ? F : 1;
    c[0] = I, c[1] = R, c[2] = T, c[3] = 0, fn(e, l, c);
  };
  return { prepare: ({ canvasWidth: v, canvasHeight: x, devicePixelRatio: F, instances: I }) => {
    if (g(), !Number.isFinite(v) || !Number.isFinite(x) || v <= 0 || x <= 0)
      throw new Error("AnnotationMarkerRenderer.prepare: canvasWidth/canvasHeight must be positive finite numbers.");
    if (!Array.isArray(I))
      throw new Error("AnnotationMarkerRenderer.prepare: instances must be an array.");
    A(v, x, F), S(I.length * Ss);
    const R = y;
    let T = 0;
    for (let w = 0; w < I.length; w++) {
      const P = I[w];
      if (!Number.isFinite(P.xCssPx) || !Number.isFinite(P.yCssPx) || !Number.isFinite(P.sizeCssPx) || P.sizeCssPx <= 0) continue;
      const B = P.strokeWidthCssPx ?? 0, _ = P.strokeRgba ?? [0, 0, 0, 0], C = Ei(P.fillRgba[0]), E = Ei(P.fillRgba[1]), U = Ei(P.fillRgba[2]), G = Ei(P.fillRgba[3]), O = Ei(_[0]), D = Ei(_[1]), k = Ei(_[2]), W = Ei(_[3]);
      R[T + 0] = P.xCssPx, R[T + 1] = P.yCssPx, R[T + 2] = P.sizeCssPx, R[T + 3] = Number.isFinite(B) ? Math.max(0, B) : 0, R[T + 4] = C, R[T + 5] = E, R[T + 6] = U, R[T + 7] = G, R[T + 8] = O, R[T + 9] = D, R[T + 10] = k, R[T + 11] = W, T += Ss;
    }
    if (m = T / Ss, m === 0)
      return;
    const N = Math.max(4, m * cl);
    if (!d || d.size < N) {
      const w = Math.max(Math.max(4, wf(N)), d ? d.size : 0);
      if (d)
        try {
          d.destroy();
        } catch {
        }
      d = e.createBuffer({
        label: "annotationMarkerRenderer/instanceBuffer",
        size: w,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    e.queue.writeBuffer(d, 0, p, 0, m * cl);
  }, render: (v, x = 0, F) => {
    if (g(), !d || m === 0) return;
    const I = Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0, R = Math.max(0, m - I), T = F == null ? R : Number.isFinite(F) ? Math.max(0, Math.min(R, Math.floor(F))) : R;
    T !== 0 && (v.setPipeline(f), v.setBindGroup(0, u), v.setVertexBuffer(0, d), v.draw(6, T, 0, I));
  }, dispose: () => {
    if (!n) {
      if (n = !0, d)
        try {
          d.destroy();
        } catch {
        }
      d = null, m = 0;
      try {
        l.destroy();
      } catch {
      }
    }
  } };
}
const Zv = 6, Kv = 500;
function Jv(e, t) {
  let n = !1, i = t;
  const r = {
    mousemove: /* @__PURE__ */ new Set(),
    click: /* @__PURE__ */ new Set(),
    mouseleave: /* @__PURE__ */ new Set()
  };
  let o = null, s = null;
  const a = (h) => {
    const b = Ri(e, h.clientX, h.clientY);
    if (!b) return null;
    const v = b.x, x = b.y, F = i.left, I = i.top, R = b.layoutWidth - i.left - i.right, T = b.layoutHeight - i.top - i.bottom, N = v - F, w = x - I, P = N >= 0 && N <= R && w >= 0 && w <= T;
    return {
      x: v,
      y: x,
      gridX: N,
      gridY: w,
      plotWidthCss: R,
      plotHeightCss: T,
      isInGrid: P,
      originalEvent: h
    };
  }, l = (h, b) => {
    const v = a(b);
    if (v)
      for (const x of r[h]) x(v);
  }, c = (h) => {
    o && h.isPrimary && h.pointerId === o.pointerId && (o = null);
  }, u = (h) => {
    n || l("mousemove", h);
  }, f = (h) => {
    n || (c(h), l("mouseleave", h));
  }, d = (h) => {
    n || (c(h), l("mouseleave", h));
  }, m = (h) => {
    if (!n) {
      if (s === h.pointerId) {
        s = null;
        return;
      }
      c(h), l("mouseleave", h);
    }
  }, p = (h) => {
    if (n || !h.isPrimary || h.pointerType === "mouse" && h.button !== 0) return;
    const b = e.getBoundingClientRect();
    if (!(b.width === 0 || b.height === 0)) {
      o = {
        pointerId: h.pointerId,
        startClientX: h.clientX,
        startClientY: h.clientY,
        startTimeMs: h.timeStamp
      };
      try {
        e.setPointerCapture(h.pointerId);
      } catch {
      }
    }
  }, y = (h) => {
    if (n || !h.isPrimary || !o || h.pointerId !== o.pointerId) return;
    const b = h.timeStamp - o.startTimeMs, v = h.clientX - o.startClientX, x = h.clientY - o.startClientY, F = v * v + x * x;
    o = null;
    try {
      e.hasPointerCapture(h.pointerId) && (s = h.pointerId, e.releasePointerCapture(h.pointerId));
    } catch {
    }
    const I = Zv;
    b <= Kv && F <= I * I && l("click", h);
  };
  return e.addEventListener("pointermove", u, { passive: !0 }), e.addEventListener("pointerleave", f, { passive: !0 }), e.addEventListener("pointercancel", d, { passive: !0 }), e.addEventListener("lostpointercapture", m, {
    passive: !0
  }), e.addEventListener("pointerdown", p, { passive: !0 }), e.addEventListener("pointerup", y, { passive: !0 }), { canvas: e, on: (h, b) => {
    n || r[h].add(b);
  }, off: (h, b) => {
    r[h].delete(b);
  }, updateGridArea: (h) => {
    i = h;
  }, dispose: () => {
    n || (n = !0, o = null, s = null, e.removeEventListener("pointermove", u), e.removeEventListener("pointerleave", f), e.removeEventListener("pointercancel", d), e.removeEventListener("lostpointercapture", m), e.removeEventListener("pointerdown", p), e.removeEventListener("pointerup", y), r.mousemove.clear(), r.click.clear(), r.mouseleave.clear());
  } };
}
const os = (e, t, n) => Math.min(n, Math.max(t, e)), Qv = (e, t) => {
  const n = e.deltaY;
  if (!Number.isFinite(n) || n === 0) return 0;
  switch (e.deltaMode) {
    case WheelEvent.DOM_DELTA_PIXEL:
      return n;
    case WheelEvent.DOM_DELTA_LINE:
      return n * 16;
    case WheelEvent.DOM_DELTA_PAGE:
      return n * (Number.isFinite(t) && t > 0 ? t : 800);
    default:
      return n;
  }
}, ew = (e, t) => {
  const n = e.deltaX;
  if (!Number.isFinite(n) || n === 0) return 0;
  switch (e.deltaMode) {
    case WheelEvent.DOM_DELTA_PIXEL:
      return n;
    case WheelEvent.DOM_DELTA_LINE:
      return n * 16;
    case WheelEvent.DOM_DELTA_PAGE:
      return n * (Number.isFinite(t) && t > 0 ? t : 800);
    default:
      return n;
  }
}, tw = (e) => {
  const t = Math.abs(e);
  if (!Number.isFinite(t) || t === 0) return 1;
  const n = Math.min(t, 200);
  return Math.exp(n * 2e-3);
}, nw = (e) => e.pointerType === "mouse" && (e.buttons & 4) !== 0, iw = (e) => e.pointerType === "mouse" && e.shiftKey && (e.buttons & 1) !== 0;
function rw(e, t) {
  let n = !1, i = !1, r = null, o = !1, s = 0;
  const a = typeof navigator < "u" && navigator.maxTouchPoints > 0, l = /* @__PURE__ */ new Map();
  let c = 0, u = "";
  const f = () => {
    c = 0;
  }, d = () => {
    o = !1, s = 0;
  }, m = (I) => {
    if (r = I, !i) return;
    const R = I.originalEvent;
    if (!(I.isInGrid && (iw(R) || nw(R)))) {
      d();
      return;
    }
    const N = I.plotWidthCss;
    if (!(N > 0) || !Number.isFinite(N)) {
      d();
      return;
    }
    if (!o) {
      o = !0, s = I.gridX;
      return;
    }
    const w = I.gridX - s;
    if (s = I.gridX, !Number.isFinite(w) || w === 0) return;
    const { start: P, end: B } = t.getRange(), _ = B - P;
    if (!Number.isFinite(_) || _ === 0) return;
    const C = -(w / N) * _;
    !Number.isFinite(C) || C === 0 || t.pan(C);
  }, p = (I) => {
    r = null, d();
  }, y = (I) => {
    if (!i || n) return;
    const R = r;
    if (!R || !R.isInGrid) return;
    const T = R.plotWidthCss, N = R.plotHeightCss;
    if (!(T > 0) || !(N > 0)) return;
    const w = Qv(I, N), P = ew(I, T);
    if (Math.abs(P) > Math.abs(w) && P !== 0) {
      const { start: O, end: D } = t.getRange(), k = D - O;
      if (!Number.isFinite(k) || k === 0) return;
      const W = P / T * k;
      if (!Number.isFinite(W) || W === 0) return;
      I.preventDefault(), t.pan(W);
      return;
    }
    if (w === 0) return;
    const B = tw(w);
    if (!(B > 1)) return;
    const { start: _, end: C } = t.getRange(), E = C - _;
    if (!Number.isFinite(E) || E === 0) return;
    const U = os(R.gridX / T, 0, 1), G = os(_ + U * E, 0, 100);
    I.preventDefault(), w < 0 ? t.zoomIn(G, B) : t.zoomOut(G, B);
  }, g = (I, R) => {
    const T = Ri(R, I.clientX, I.clientY);
    return T ? T.x >= 0 && T.x <= T.layoutWidth && T.y >= 0 && T.y <= T.layoutHeight : !1;
  }, S = (I, R) => {
    const T = Ri(R, I.clientX, I.clientY);
    return T ? { x: T.x, y: T.y } : null;
  }, A = (I) => {
    if (!i || n || I.pointerType !== "touch" || (I.preventDefault(), !(r ? r.isInGrid : g(I, e.canvas))) || l.size >= 2) return;
    const T = S(I, e.canvas);
    T && (l.set(I.pointerId, T), e.canvas.setPointerCapture(I.pointerId), f());
  }, M = (I) => {
    if (!i || n || I.pointerType !== "touch" || !l.has(I.pointerId)) return;
    const R = l.size;
    if (R === 1) {
      const T = l.get(I.pointerId);
      if (!T) return;
      const N = S(I, e.canvas);
      if (!N) return;
      const w = N.x - T.x;
      if (l.set(I.pointerId, N), !Number.isFinite(w) || w === 0) return;
      const P = (r == null ? void 0 : r.plotWidthCss) ?? 0;
      if (!(P > 0)) return;
      const { start: B, end: _ } = t.getRange(), C = _ - B;
      if (!Number.isFinite(C) || C === 0) return;
      const E = -(w / P) * C;
      if (!Number.isFinite(E) || E === 0) return;
      t.pan(E);
    } else if (R === 2) {
      const T = S(I, e.canvas);
      if (!T) return;
      l.set(I.pointerId, T);
      const N = l.values(), w = N.next().value, P = N.next().value, B = Math.hypot(w.x - P.x, w.y - P.y), _ = (w.x + P.x) / 2;
      if (!Number.isFinite(B) || B === 0) return;
      if (c > 0 && Number.isFinite(c)) {
        const C = c / B, E = (r == null ? void 0 : r.plotWidthCss) ?? 0;
        if (!(E > 0)) {
          c = B;
          return;
        }
        const U = r ? r.x - r.gridX : 0, G = _ - U, O = os(G / E, 0, 1), { start: D, end: k } = t.getRange(), W = k - D;
        if (!Number.isFinite(W) || W === 0) {
          c = B;
          return;
        }
        const j = os(D + O * W, 0, 100);
        C > 1 ? t.zoomOut(j, C) : C > 0 && C < 1 && t.zoomIn(j, 1 / C);
      }
      c = B;
    }
  }, h = (I) => {
    !i || n || I.pointerType === "touch" && (l.delete(I.pointerId), f());
  }, b = (I) => {
    !i || n || I.pointerType === "touch" && (l.delete(I.pointerId), f());
  }, v = () => {
    if (!(n || i) && (i = !0, e.on("mousemove", m), e.on("mouseleave", p), e.canvas.addEventListener("wheel", y, { passive: !1 }), a)) {
      const I = e.canvas;
      u = I.style.touchAction, I.style.touchAction = "none", I.addEventListener("pointerdown", A, {
        passive: !1
      }), I.addEventListener("pointermove", M, {
        passive: !1
      }), I.addEventListener("pointerup", h), I.addEventListener("pointercancel", b);
    }
  }, x = () => {
    if (!(n || !i)) {
      if (i = !1, e.off("mousemove", m), e.off("mouseleave", p), e.canvas.removeEventListener("wheel", y), a) {
        const I = e.canvas;
        I.style.touchAction = u, I.removeEventListener("pointerdown", A), I.removeEventListener("pointermove", M), I.removeEventListener("pointerup", h), I.removeEventListener("pointercancel", b);
      }
      l.clear(), f(), r = null, d();
    }
  };
  return { enable: v, disable: x, dispose: () => {
    n || (x(), n = !0);
  } };
}
const ow = 0.5, sw = 100, ci = (e, t, n) => Math.min(n, Math.max(t, e)), ul = (e) => ci(e, 0, 1), Mf = (e) => Object.is(e, -0) ? 0 : e, aw = (e) => ({ start: e.start, end: e.end });
function lw(e, t, n) {
  let i = 0, r = 100, o = null;
  const s = /* @__PURE__ */ new Set();
  let a = (() => {
    const v = Number.isFinite(n == null ? void 0 : n.minSpan) ? n.minSpan : ow;
    return ci(Number.isFinite(v) ? v : 0, 0, 100);
  })(), l = (() => {
    const v = Number.isFinite(n == null ? void 0 : n.maxSpan) ? n.maxSpan : sw;
    return ci(Number.isFinite(v) ? v : 100, 0, 100);
  })(), c = Math.min(a, l), u = Math.max(a, l);
  const f = () => {
    const v = { start: i, end: r };
    if (o !== null && o.start === v.start && o.end === v.end)
      return;
    o = aw(v);
    const x = Array.from(s);
    for (const F of x) F({ start: i, end: r });
  }, d = (v, x, F) => {
    if (F) {
      if (typeof F == "string")
        switch (F) {
          case "start":
            return { center: v, ratio: 0 };
          case "end":
            return { center: x, ratio: 1 };
          case "center":
            return { center: (v + x) * 0.5, ratio: 0.5 };
        }
      if (F && Number.isFinite(F.center) && Number.isFinite(F.ratio))
        return { center: F.center, ratio: F.ratio };
    }
  }, m = (v, x, F) => {
    if (!Number.isFinite(v) || !Number.isFinite(x)) return;
    let I = v, R = x;
    if (I > R) {
      const w = I;
      I = R, R = w;
    }
    let T = R - I;
    if (!Number.isFinite(T) || T < 0) return;
    const N = ci(T, c, u);
    if (N !== T) {
      const w = F != null && F.anchor && Number.isFinite(F.anchor.center) ? ci(F.anchor.center, 0, 100) : (I + R) * 0.5, P = F != null && F.anchor && Number.isFinite(F.anchor.ratio) ? ul(F.anchor.ratio) : 0.5;
      I = w - P * N, R = I + N, T = N;
    }
    if (T > 100 && (I = 0, R = 100, T = 100), I < 0) {
      const w = -I;
      I += w, R += w;
    }
    if (R > 100) {
      const w = R - 100;
      I -= w, R -= w;
    }
    I = ci(I, 0, 100), R = ci(R, 0, 100), I = Mf(I), R = Mf(R), !(I === i && R === r) && (i = I, r = R, (F == null ? void 0 : F.emit) !== !1 && f());
  };
  return m(e, t, { emit: !1 }), {
    getRange: () => ({ start: i, end: r }),
    setRange: (v, x) => {
      m(v, x);
    },
    setRangeAnchored: (v, x, F) => {
      m(v, x, {
        anchor: d(v, x, F)
      });
    },
    setSpanConstraints: (v, x) => {
      const F = typeof v == "number" && Number.isFinite(v) ? ci(v, 0, 100) : a, I = typeof x == "number" && Number.isFinite(x) ? ci(x, 0, 100) : l;
      if (F === a && I === l) return;
      a = F, l = I, c = Math.min(a, l), u = Math.max(a, l);
      const R = i, T = r, N = 1e-6, w = T >= 100 - N ? "end" : R <= 0 + N ? "start" : "center";
      m(R, T, { anchor: d(R, T, w) });
    },
    zoomIn: (v, x) => {
      if (!Number.isFinite(v) || !Number.isFinite(x) || x <= 1) return;
      const F = ci(v, 0, 100), I = r - i, R = I === 0 ? 0.5 : ul((F - i) / I), T = I / x, N = F - R * T, w = N + T;
      m(N, w, { anchor: { center: F, ratio: R } });
    },
    zoomOut: (v, x) => {
      if (!Number.isFinite(v) || !Number.isFinite(x) || x <= 1) return;
      const F = ci(v, 0, 100), I = r - i, R = I === 0 ? 0.5 : ul((F - i) / I), T = I * x, N = F - R * T, w = N + T;
      m(N, w, { anchor: { center: F, ratio: R } });
    },
    pan: (v) => {
      Number.isFinite(v) && m(i + v, r + v);
    },
    onChange: (v) => (s.add(v), () => {
      s.delete(v);
    })
  };
}
const fl = /* @__PURE__ */ new WeakMap(), Sf = (e) => {
  const t = typeof e == "object" && e !== null ? e : null;
  if (t && fl.has(t))
    return fl.get(t);
  let n = !1;
  const i = $e(e);
  for (let r = 0; r < i; r++) {
    const o = Te(e, r);
    if (Number.isNaN(o)) {
      n = !0;
      break;
    }
  }
  return t && fl.set(t, n), n;
}, cw = (e, t) => {
  const n = [];
  for (let l = 0; l < e.length; l++) {
    const c = e[l];
    (c == null ? void 0 : c.type) === "bar" && n.push({ globalSeriesIndex: l, s: c });
  }
  if (n.length === 0) return null;
  const i = am(
    n.map((l) => l.s),
    t
  ), r = i.barWidthPx, o = i.gapPx, s = i.clusterWidthPx;
  if (!Number.isFinite(r) || !(r > 0)) return null;
  const a = /* @__PURE__ */ new Map();
  for (let l = 0; l < n.length; l++) {
    const c = n[l].globalSeriesIndex, u = i.clusterSlots.clusterIndexBySeries[l] ?? 0;
    a.set(c, u);
  }
  return {
    barWidth: r,
    gap: o,
    clusterWidth: s,
    clusterIndexByGlobalSeriesIndex: a
  };
}, Cf = (e, t) => {
  let n = 0, i = $e(e);
  for (; n < i; ) {
    const r = n + i >>> 1;
    Te(e, r) < t ? n = r + 1 : i = r;
  }
  return n;
};
function Ff(e, t, n, i) {
  if (!Number.isFinite(t)) return [];
  const r = Number.POSITIVE_INFINITY, o = r * r, s = n.invert(t);
  if (!Number.isFinite(s)) return [];
  const a = [], l = cw(e, n);
  for (let c = 0; c < e.length; c++) {
    const u = e[c];
    if (u.type === "pie" || u.type === "candlestick" || u.type === "ohlc" || u.type === "heatmap" || u.visible === !1) continue;
    if (u.type === "impulse") {
      const S = u.data, A = $e(S);
      if (A === 0) continue;
      let M = -1, h = Number.POSITIVE_INFINITY;
      for (let b = 0; b < A; b++) {
        const v = Te(S, b);
        if (!Number.isFinite(v)) continue;
        const x = n.scale(v);
        if (!Number.isFinite(x)) continue;
        const F = Math.abs(x - t);
        if (F < h || F === h && (M < 0 || b < M)) {
          if (F > r) continue;
          h = F, M = b;
        }
      }
      M >= 0 && a.push({
        seriesIndex: c,
        dataIndex: M,
        point: [Te(S, M), ht(S, M)]
      });
      continue;
    }
    if (u.type === "errorBar") {
      const S = u.data, A = On(S);
      if (A === 0) continue;
      let M = -1, h = Number.POSITIVE_INFINITY;
      for (let b = 0; b < A; b++) {
        const v = kn(S, b);
        if (!v || !Number.isFinite(v.x)) continue;
        const x = n.scale(v.x);
        if (!Number.isFinite(x)) continue;
        const F = Math.abs(x - t);
        if (F < h || F === h && (M < 0 || b < M)) {
          if (F > r) continue;
          h = F, M = b;
        }
      }
      if (M >= 0) {
        const b = kn(S, M);
        a.push({
          seriesIndex: c,
          dataIndex: M,
          point: [b.x, b.y]
        });
      }
      continue;
    }
    if (u.type === "band") {
      const S = u.data, A = yn(S);
      if (A === 0) continue;
      let M = -1, h = Number.POSITIVE_INFINITY;
      for (let b = 0; b < A; b++) {
        const v = cn(S, b);
        if (!v || !Number.isFinite(v.x)) continue;
        const x = n.scale(v.x);
        if (!Number.isFinite(x)) continue;
        const F = Math.abs(x - t);
        if (F < h || F === h && (M < 0 || b < M)) {
          if (F > r) continue;
          h = F, M = b;
        }
      }
      if (M >= 0) {
        const b = cn(S, M);
        a.push({
          seriesIndex: c,
          dataIndex: M,
          point: [b.x, b.y]
        });
      }
      continue;
    }
    const f = u.data, d = $e(f);
    if (d === 0) continue;
    if (u.type === "bar" && l) {
      const S = l.clusterIndexByGlobalSeriesIndex.get(c);
      if (S !== void 0) {
        const { barWidth: A, gap: M, clusterWidth: h } = l, b = -h / 2 + S * (A + M), v = 0;
        if (Number.isFinite(A) && A > 0 && Number.isFinite(b)) {
          let x = -1;
          const F = (I) => {
            if (!Number.isFinite(I)) return !1;
            const R = I + b, T = R + A;
            return t >= R - v && t < T + v;
          };
          if (Sf(f))
            for (let I = 0; I < d; I++) {
              const R = Te(f, I);
              if (!Number.isFinite(R)) continue;
              const T = n.scale(R);
              F(T) && (x = x < 0 ? I : Math.min(x, I));
            }
          else {
            const I = n.invert(t - b);
            if (Number.isFinite(I)) {
              const R = Cf(f, I), T = (N) => {
                if (N < 0 || N >= d) return null;
                const w = Te(f, N);
                if (!Number.isFinite(w)) return null;
                const P = n.scale(w);
                return Number.isFinite(P) ? P : null;
              };
              for (let N = R - 1; N >= 0; N--) {
                const w = T(N);
                if (w === null) continue;
                const P = w + b, B = P + A;
                if (B + v <= t) break;
                t >= P - v && t < B + v && (x = x < 0 ? N : Math.min(x, N));
              }
              for (let N = R; N < d; N++) {
                const w = T(N);
                if (w === null) continue;
                const P = w + b;
                if (P - v > t) break;
                const B = P + A;
                t < B + v && (x = x < 0 ? N : Math.min(x, N));
              }
            }
          }
          if (x >= 0) {
            const I = Te(f, x), R = ht(f, x), T = Sn(f, x), N = T !== void 0 ? [I, R, T] : [I, R];
            a.push({ seriesIndex: c, dataIndex: x, point: N });
            continue;
          }
        }
      }
    }
    let m = -1, p = null, y = o;
    const g = (S, A) => {
      if (!Number.isFinite(A) || !(A < y || A === y && (m < 0 || S < m))) return;
      y = A, m = S;
      const h = Te(f, S), b = ht(f, S), v = Sn(f, S);
      p = v !== void 0 ? [h, b, v] : [h, b];
    };
    if (Sf(f))
      for (let S = 0; S < d; S++) {
        const A = Te(f, S);
        if (!Number.isFinite(A)) continue;
        const M = n.scale(A);
        if (!Number.isFinite(M)) continue;
        const h = M - t;
        g(S, h * h);
      }
    else {
      const S = Cf(f, s);
      let A = S - 1, M = S;
      const h = (b) => {
        const v = Te(f, b);
        if (!Number.isFinite(v)) return null;
        const x = n.scale(v);
        if (!Number.isFinite(x)) return null;
        const F = x - t;
        return F * F;
      };
      for (; A >= 0 || M < d; ) {
        for (; A >= 0 && h(A) === null; ) A--;
        for (; M < d && h(M) === null; ) M++;
        if (A < 0 && M >= d) break;
        const b = A >= 0 ? h(A) ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY, v = M < d ? h(M) ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
        if (b > y && v > y) break;
        b <= v ? (A >= 0 && b <= y && g(A, b), A--, M < d && v <= y && v === b && (g(M, v), M++)) : (M < d && v <= y && g(M, v), M++);
      }
    }
    p !== null && a.push({
      seriesIndex: c,
      dataIndex: m,
      point: p
    });
  }
  return a;
}
const Kl = 16, uw = 0.75, Jl = {
  throttleMs: Kl,
  moveEpsPx: uw
};
function fw() {
  return {
    lastMs: Number.NEGATIVE_INFINITY,
    lastGridX: Number.NaN,
    lastGridY: Number.NaN,
    cachedMatch: void 0
  };
}
function dw(e, t, n, i, r = Jl) {
  if (e.cachedMatch === void 0 || !Number.isFinite(e.lastGridX) || !Number.isFinite(e.lastGridY)) return !0;
  const o = r.throttleMs;
  return !(t - e.lastMs < o);
}
function mw(e, t, n, i, r) {
  e.lastMs = t, e.lastGridX = n, e.lastGridY = i, e.cachedMatch = r;
}
function Af(e) {
  e.cachedMatch = void 0, e.lastGridX = Number.NaN, e.lastGridY = Number.NaN;
}
function pw(e) {
  const t = e.options ?? Jl;
  if (dw(e.state, e.nowMs, e.gridX, e.gridY, t)) {
    const r = e.findNearest();
    return mw(e.state, e.nowMs, e.gridX, e.gridY, r), { match: r, recomputed: !0, scheduleFollowupMs: null };
  }
  const n = e.state.cachedMatch ?? null, i = e.nowMs - e.state.lastMs;
  return {
    match: n,
    recomputed: !1,
    // Always schedule a follow-up while suppressed so continuous motion is
    // sampled at the throttle rate even if no further mousemove arrives
    // exactly on the boundary (e.g. pointer stopped mid-window).
    scheduleFollowupMs: Math.max(0, t.throttleMs - i)
  };
}
function hw(e, t, n = Kl) {
  const i = t - e;
  return Number.isFinite(e) && i < n ? {
    allowed: !1,
    nextLastSyncMs: e,
    scheduleFollowupMs: Math.max(0, n - i)
  } : { allowed: !0, nextLastSyncMs: t, scheduleFollowupMs: null };
}
const yw = (e) => Math.min(1, Math.max(0, e)), gw = (e) => {
  const t = e.trim().match(/^(\d+(?:\.\d+)?)%$/);
  if (!t) return null;
  const n = Number(t[1]) / 100;
  return Number.isFinite(n) ? n : null;
}, Bo = (e) => Array.isArray(e), cr = (e) => Bo(e) ? e[0] : e.timestamp, xw = (e) => Bo(e) ? e[1] : e.open, bw = (e) => Bo(e) ? e[2] : e.close, vw = (e) => Bo(e) ? e[3] : e.low, ww = (e) => Bo(e) ? e[4] : e.high, If = /* @__PURE__ */ new WeakMap(), Nw = (e) => {
  const t = If.get(e);
  if (t !== void 0) return t;
  const n = [];
  for (let o = 0; o < e.length; o++) {
    const s = cr(e[o]);
    Number.isFinite(s) && n.push(s);
  }
  if (n.length < 2) return 1;
  n.sort((o, s) => o - s);
  let i = Number.POSITIVE_INFINITY;
  for (let o = 1; o < n.length; o++) {
    const s = n[o] - n[o - 1];
    s > 0 && s < i && (i = s);
  }
  const r = Number.isFinite(i) && i > 0 ? i : 1;
  return If.set(e, r), r;
};
function El(e, t, n, i) {
  if (t.length === 0) return 0;
  const r = Nw(t);
  let o = 0;
  if (Number.isFinite(r) && r > 0) {
    let f = null;
    for (let d = 0; d < t.length; d++) {
      const m = cr(t[d]);
      if (Number.isFinite(m)) {
        f = m;
        break;
      }
    }
    if (f != null) {
      const d = n.scale(f), m = n.scale(f + r), p = Math.abs(m - d);
      Number.isFinite(p) && p > 0 && (o = p);
    }
  }
  (!(o > 0) || !Number.isFinite(o)) && (o = (Number.isFinite(i ?? Number.NaN) ? i : 0) / Math.max(1, t.length));
  let s = 0;
  const a = e.barWidth;
  if (typeof a == "number")
    s = Number.isFinite(a) ? Math.max(0, a) : 0;
  else if (typeof a == "string") {
    const f = gw(a);
    s = f == null ? 0 : o * yw(f);
  }
  const l = Number.isFinite(e.barMinWidth) ? Math.max(0, e.barMinWidth) : 0, c = Number.isFinite(e.barMaxWidth) ? Math.max(0, e.barMaxWidth) : Number.POSITIVE_INFINITY, u = Math.max(l, c);
  return s = Math.min(Math.max(s, l), u), Number.isFinite(s) ? s : 0;
}
const ss = /* @__PURE__ */ new WeakMap(), Mw = (e) => {
  const t = ss.get(e);
  if (t !== void 0) return t;
  let n = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < e.length; i++) {
    const r = cr(e[i]);
    if (!Number.isFinite(r) || r < n)
      return ss.set(e, !1), !1;
    n = r;
  }
  return ss.set(e, !0), !0;
}, Sw = (e, t) => {
  let n = 0, i = e.length;
  for (; n < i; ) {
    const r = n + i >>> 1;
    cr(e[r]) < t ? n = r + 1 : i = r;
  }
  return n;
};
function Ll(e, t, n, i, r, o, s) {
  if (!Number.isFinite(t) || !Number.isFinite(n) || !Number.isFinite(o) || !(o > 0)) return null;
  const a = i.invert(t);
  if (!Number.isFinite(a)) return null;
  const l = o / 2, c = (s == null ? void 0 : s.yHitMode) === "lowHigh" ? "lowHigh" : "openClose";
  let u = null, f = Number.POSITIVE_INFINITY;
  const d = (p, y, g, S) => {
    if (Number.isFinite(S)) {
      if (S < f) {
        f = S, u = { seriesIndex: p, dataIndex: y, point: g };
        return;
      }
      S === f && u && (y < u.dataIndex ? u = { seriesIndex: p, dataIndex: y, point: g } : y === u.dataIndex && p < u.seriesIndex && (u = { seriesIndex: p, dataIndex: y, point: g }));
    }
  }, m = (p) => {
    if (c === "lowHigh") {
      const b = vw(p), v = ww(p);
      if (!Number.isFinite(b) || !Number.isFinite(v)) return !1;
      const x = r.scale(b), F = r.scale(v);
      if (!Number.isFinite(x) || !Number.isFinite(F)) return !1;
      const I = Math.min(x, F), R = Math.max(x, F);
      return n >= I && n <= R;
    }
    const y = xw(p), g = bw(p);
    if (!Number.isFinite(y) || !Number.isFinite(g)) return !1;
    const S = r.scale(y), A = r.scale(g);
    if (!Number.isFinite(S) || !Number.isFinite(A)) return !1;
    const M = Math.min(S, A), h = Math.max(S, A);
    return n >= M && n <= h;
  };
  for (let p = 0; p < e.length; p++) {
    const g = e[p].data, S = g.length;
    if (S === 0) continue;
    if (!Mw(g)) {
      for (let h = 0; h < S; h++) {
        const b = g[h], v = cr(b);
        if (!Number.isFinite(v)) continue;
        const x = i.scale(v);
        if (!Number.isFinite(x)) continue;
        const F = Math.abs(t - x);
        F > l || m(b) && d(p, h, b, F);
      }
      continue;
    }
    const M = Sw(g, a);
    for (let h = M - 1; h >= 0; h--) {
      const b = g[h], v = cr(b), x = i.scale(v);
      if (!Number.isFinite(x)) continue;
      if (x < t - l) break;
      const F = Math.abs(t - x);
      F > l || m(b) && d(p, h, b, F);
    }
    for (let h = M; h < S; h++) {
      const b = g[h], v = cr(b), x = i.scale(v);
      if (!Number.isFinite(x)) continue;
      if (x > t + l) break;
      const F = Math.abs(t - x);
      F > l || m(b) && d(p, h, b, F);
    }
  }
  return u;
}
const zi = Math.PI * 2, as = (e) => {
  if (!Number.isFinite(e)) return 0;
  const t = e % zi;
  return t < 0 ? t + zi : t;
};
function Ul(e, t, n, i, r) {
  if (!Number.isFinite(e) || !Number.isFinite(t) || !Number.isFinite(i.x) || !Number.isFinite(i.y)) return null;
  const o = Number.isFinite(r.inner) ? Math.max(0, r.inner) : 0, s = Number.isFinite(r.outer) ? Math.max(0, r.outer) : 0;
  if (!(s > 0)) return null;
  const a = e - i.x, l = i.y - t, c = Math.hypot(a, l);
  if (!Number.isFinite(c) || c <= o || c > s) return null;
  const u = as(Math.atan2(l, a)), f = n.series, d = f.data;
  let m = 0, p = 0;
  for (let M = 0; M < d.length; M++) {
    const h = d[M], b = h == null ? void 0 : h.value;
    typeof b == "number" && Number.isFinite(b) && b > 0 && h.visible !== !1 && (m += b, p++);
  }
  if (!(m > 0) || p === 0) return null;
  const y = typeof f.startAngle == "number" && Number.isFinite(f.startAngle) ? f.startAngle : 90;
  let g = as(y * Math.PI / 180), S = 0, A = 0;
  for (let M = 0; M < d.length; M++) {
    const h = d[M], b = h == null ? void 0 : h.value;
    if (typeof b != "number" || !Number.isFinite(b) || b <= 0 || (h == null ? void 0 : h.visible) === !1) continue;
    A++;
    const v = A === p;
    let F = b / m * zi;
    if (v ? F = Math.max(0, zi - S) : F = Math.max(0, Math.min(zi, F)), S += F, !(F > 0)) continue;
    const I = g, R = p === 1 ? g + zi : as(g + F);
    g = as(g + F);
    let T = R - I;
    T < 0 && (T += zi);
    let N = u - I;
    if (N < 0 && (N += zi), N <= T)
      return { seriesIndex: n.seriesIndex, dataIndex: M, slice: h };
  }
  return null;
}
function Cw(e, t, n, i) {
  if (e.visible === !1 || e.drawable === !1 || !Number.isFinite(n) || !Number.isFinite(i)) return null;
  const r = xp(e.data, n, i, e.cellAnchor);
  if (!r || e.nullHandling === "transparent" && !Number.isFinite(r.z))
    return null;
  const o = vp(r.z, e.zMin, e.zMax, e.zScale), s = yp(
    e.colormap,
    Number.isFinite(o) ? o : e.nullHandling === "highest" ? 1 : 0
  ), a = `rgba(${Math.round(s[0] * 255)},${Math.round(s[1] * 255)},${Math.round(s[2] * 255)},${s[3]})`;
  return {
    seriesName: e.name ?? "",
    seriesIndex: t,
    dataIndex: r.dataIndex,
    value: [r.x, r.y],
    color: a,
    z: r.z
  };
}
const Fw = 5;
function so(e, t, n) {
  if (!(n > 0) || !(e > 0)) return 0;
  const { min: i, max: r } = t.getDomain(), o = Math.abs(r - i);
  return o > 0 ? o / n * e : 0;
}
function ao(e, t, n) {
  if (!(n > 0) || !(e > 0)) return 0;
  const { min: i, max: r } = t.getDomain(), o = Math.abs(r - i);
  return o > 0 ? o / n * e : 0;
}
function Pf(e, t) {
  return typeof e.invert == "function" ? e.invert(t) : t;
}
function vm(e, t, n, i, r, o, s) {
  const a = Fw, l = Pf(i, t), c = Pf(r, n);
  if (!Number.isFinite(l) || !Number.isFinite(c)) return null;
  for (let u = e.length - 1; u >= 0; u--) {
    const f = e[u], d = f.series;
    if (d.visible === !1) continue;
    const m = d.data, p = On(m);
    if (p === 0) continue;
    const y = d.direction === "horizontal", g = Nl(m, d.direction), S = typeof d.itemStyle.borderWidth == "number" && Number.isFinite(d.itemStyle.borderWidth) ? Math.max(1, d.itemStyle.borderWidth) : 1.5, A = y ? ao(S, r, o.height) : so(S, i, o.width), M = Eb(A), b = (y ? so(S, i, o.width) : ao(S, r, o.height)) * 0.5;
    let v;
    typeof d.capWidth == "number" && Number.isFinite(d.capWidth) && (v = y ? ao(d.capWidth, r, o.height) : so(d.capWidth, i, o.width));
    const F = pm({
      capWidth: d.capWidth,
      categoryStep: g,
      capWidthAsDomain: v
    }) * 0.5, I = so(a, i, o.width), R = ao(a, r, o.height), T = y ? R : I, N = y ? I : R;
    let w = null, P = Number.POSITIVE_INFINITY;
    for (let B = 0; B < p; B++) {
      const _ = kn(m, B);
      if (!Td(_, d.errorMode)) continue;
      const C = Ub({
        x: _.x,
        y: _.y,
        high: _.high,
        low: _.low,
        stemHalf: Math.max(M, T * 0.25),
        capHalf: F,
        capHalfThick: Math.max(b, N * 0.25),
        errorMode: d.errorMode,
        drawWhiskers: d.drawWhiskers,
        drawConnector: d.drawConnector,
        direction: d.direction
      }), E = [];
      C.stem && E.push(il(C.stem, I, R)), C.highCap && E.push(il(C.highCap, I, R)), C.lowCap && E.push(il(C.lowCap, I, R));
      let U = !1;
      for (let k = 0; k < E.length; k++)
        if (_b(l, c, E[k])) {
          U = !0;
          break;
        }
      if (!U && d.showCenter) {
        const k = so(d.symbolSize * 0.5 + a, i, o.width), W = ao(d.symbolSize * 0.5 + a, r, o.height);
        Math.abs(l - _.x) <= k && Math.abs(c - _.y) <= W && (U = !0);
      }
      if (!U) continue;
      const G = l - _.x, O = c - _.y, D = G * G + O * O;
      D < P && (P = D, w = {
        seriesIndex: f.seriesIndex,
        dataIndex: B,
        point: _,
        series: d
      });
    }
    if (w) return w;
  }
  return null;
}
const Aw = 5;
function dl(e, t, n) {
  if (!(n > 0) || !(e > 0)) return 0;
  const { min: i, max: r } = t.getDomain(), o = Math.abs(r - i);
  return o > 0 ? o / n * e : 0;
}
function Tf(e, t, n) {
  if (!(n > 0) || !(e > 0)) return 0;
  const { min: i, max: r } = t.getDomain(), o = Math.abs(r - i);
  return o > 0 ? o / n * e : 0;
}
function Bf(e, t) {
  return typeof e.invert == "function" ? e.invert(t) : t;
}
function wm(e, t, n, i, r, o, s) {
  const a = Aw, l = Bf(i, t), c = Bf(r, n);
  if (!Number.isFinite(l) || !Number.isFinite(c)) return null;
  for (let u = e.length - 1; u >= 0; u--) {
    const f = e[u], d = f.series;
    if (d.visible === !1) continue;
    const m = d.data, p = $e(m);
    if (p === 0) continue;
    const y = typeof d.lineStyle.width == "number" && Number.isFinite(d.lineStyle.width) ? Math.max(1, d.lineStyle.width) : 2, g = dl(y, i, o.width) * 0.5, S = dl(a, i, o.width), A = Tf(a, r, o.height), M = typeof d.symbolSize == "number" && Number.isFinite(d.symbolSize) && d.symbolSize > 0 ? d.symbolSize : 6, h = Math.max(
      dl(M, i, o.width),
      Tf(M, r, o.height)
    ) * 0.5, b = Number.isFinite(d.baseline) ? d.baseline : 0, v = d.showMarker !== !1;
    for (let x = p - 1; x >= 0; x--) {
      const F = Te(m, x), I = ht(m, x), R = oh(F, I, b);
      if (!R) continue;
      let T = !1;
      const N = sh(R, g);
      if (N) {
        const w = kc(N, S, A);
        Dc(l, c, w) && (T = !0);
      }
      if (!T && v) {
        const w = kc(ah(R.x, R.y, h), S, A);
        Dc(l, c, w) && (T = !0);
      }
      if (T)
        return {
          seriesIndex: f.seriesIndex,
          dataIndex: x,
          x: R.x,
          y: R.y,
          baseline: R.baseline,
          series: d
        };
    }
  }
  return null;
}
function Rf(e, t) {
  const n = getComputedStyle(e), i = n.position, r = n.overflow, o = (t == null ? void 0 : t.clip) ?? !1, s = (t == null ? void 0 : t.devicePixelRatio) != null && Number.isFinite(t.devicePixelRatio) && t.devicePixelRatio > 0 ? t.devicePixelRatio : null, a = i === "static", l = !o && (r === "hidden" || r === "scroll" || r === "auto"), c = a ? e.style.position : null, u = l ? e.style.overflow : null;
  a && (e.style.position = "relative"), l && (e.style.overflow = "visible");
  const f = document.createElement("canvas");
  f.style.position = "absolute", f.style.inset = "0", f.style.width = "100%", f.style.height = "100%", f.style.pointerEvents = "none", f.style.zIndex = "10", o && (f.style.overflow = "hidden"), e.appendChild(f);
  const d = f.getContext("2d");
  let m = !1, p = s ?? (typeof window < "u" && window.devicePixelRatio || 1);
  const y = [], g = typeof document < "u" ? document.createElement("span") : {}, S = typeof window < "u" && getComputedStyle(e).fontFamily || "system-ui, sans-serif", A = () => {
    if (!d) return;
    const I = e.clientWidth || 0, R = e.clientHeight || 0;
    p = s ?? (typeof window < "u" && window.devicePixelRatio || 1);
    const T = Math.max(1, Math.round(I * p)), N = Math.max(1, Math.round(R * p));
    (f.width !== T || f.height !== N) && (f.width = T, f.height = N), d.setTransform(p, 0, 0, p, 0, 0);
  }, M = () => {
    if (m || !d) return;
    A();
    const I = f.width / p, R = f.height / p;
    d.clearRect(0, 0, I, R);
    for (let T = 0; T < y.length; T++) {
      const N = y[T];
      d.save();
      const w = N.fontWeight !== void 0 && N.fontWeight !== "" ? `${N.fontWeight} ` : "";
      d.font = `${w}${N.fontSize}px ${N.fontFamily}`, d.fillStyle = N.color, d.textBaseline = "middle", N.anchor === "middle" ? d.textAlign = "center" : N.anchor === "end" ? d.textAlign = "right" : d.textAlign = "left", N.rotation !== 0 ? (d.translate(N.x, N.y), d.rotate(N.rotation * Math.PI / 180), d.fillText(N.text, 0, 0)) : d.fillText(N.text, N.x, N.y), d.restore();
    }
  };
  let h = !1;
  const b = () => {
    h || (h = !0, queueMicrotask(() => {
      h = !1, m || M();
    }));
  };
  return { clear: () => {
    m || (y.length = 0, b());
  }, addLabel: (I, R, T, N) => (m || (y.push({
    text: I,
    x: R,
    y: T,
    fontSize: (N == null ? void 0 : N.fontSize) ?? 12,
    color: (N == null ? void 0 : N.color) ?? "#000",
    fontFamily: (N == null ? void 0 : N.fontFamily) ?? S,
    fontWeight: N == null ? void 0 : N.fontWeight,
    anchor: (N == null ? void 0 : N.anchor) ?? "start",
    rotation: (N == null ? void 0 : N.rotation) ?? 0
  }), b()), g), dispose: () => {
    if (!m) {
      m = !0, y.length = 0;
      try {
        f.remove();
      } finally {
        c !== null && (e.style.position = c), u !== null && (e.style.overflow = u);
      }
    }
  } };
}
const Df = (e, t) => {
  var i;
  const n = (i = e.name) == null ? void 0 : i.trim();
  return n || `Series ${t + 1}`;
}, Iw = (e, t, n) => {
  var o, s, a, l, c;
  const i = (o = e.color) == null ? void 0 : o.trim();
  if (i) return i;
  if (e.type === "candlestick" || e.type === "ohlc") {
    const u = (a = (s = e.itemStyle) == null ? void 0 : s.upColor) == null ? void 0 : a.trim();
    if (u) return u;
  }
  if (e.type === "errorBar") {
    const u = (c = (l = e.itemStyle) == null ? void 0 : l.color) == null ? void 0 : c.trim();
    if (u) return u;
  }
  const r = n.colorPalette;
  return r.length > 0 ? r[t % r.length] ?? "#000000" : "#000000";
}, kf = (e, t) => {
  const n = e == null ? void 0 : e.trim();
  return n || `Slice ${t + 1}`;
}, Pw = (e, t, n, i) => {
  const r = e == null ? void 0 : e.trim();
  if (r) return r;
  const o = i.colorPalette, s = o.length;
  return s > 0 ? o[(t + n) % s] ?? "#000000" : "#000000";
};
function Tw(e, t = "right", n) {
  const r = getComputedStyle(e).position === "static", o = r ? e.style.position : null;
  r && (e.style.position = "relative");
  const s = document.createElement("div");
  s.style.position = "absolute", s.style.pointerEvents = "auto", s.style.userSelect = "none", s.style.boxSizing = "border-box", s.style.zIndex = "15", s.style.padding = "8px", s.style.borderRadius = "8px", s.style.borderStyle = "solid", s.style.borderWidth = "1px", s.style.maxHeight = "calc(100% - 16px)", s.style.overflow = "auto";
  const a = document.createElement("div");
  a.style.display = "flex", a.style.gap = "8px", s.appendChild(a), n && (a.addEventListener("click", (y) => {
    const S = y.target.closest("[data-series-index]");
    if (S) {
      const A = parseInt(S.dataset.seriesIndex, 10);
      if (!isNaN(A)) {
        const M = S.dataset.sliceIndex;
        if (M !== void 0) {
          const h = parseInt(M, 10);
          if (!isNaN(h)) {
            n(A, h);
            return;
          }
        }
        n(A);
      }
    }
  }), a.addEventListener("keydown", (y) => {
    if (y.key === "Enter" || y.key === " ") {
      const S = y.target.closest("[data-series-index]");
      if (S) {
        y.preventDefault();
        const A = parseInt(S.dataset.seriesIndex, 10);
        if (!isNaN(A)) {
          const M = S.dataset.sliceIndex;
          if (M !== void 0) {
            const h = parseInt(M, 10);
            if (!isNaN(h)) {
              n(A, h);
              return;
            }
          }
          n(A);
        }
      }
    }
  })), ((y) => {
    switch (s.style.top = "", s.style.right = "", s.style.bottom = "", s.style.left = "", s.style.maxWidth = "", a.style.flexDirection = "", a.style.flexWrap = "", a.style.alignItems = "", y) {
      case "right": {
        s.style.top = "8px", s.style.right = "8px", s.style.maxWidth = "40%", a.style.flexDirection = "column", a.style.flexWrap = "nowrap", a.style.alignItems = "flex-start";
        return;
      }
      case "left": {
        s.style.top = "8px", s.style.left = "8px", s.style.maxWidth = "40%", a.style.flexDirection = "column", a.style.flexWrap = "nowrap", a.style.alignItems = "flex-start";
        return;
      }
      case "top": {
        s.style.top = "8px", s.style.left = "8px", s.style.right = "8px", a.style.flexDirection = "row", a.style.flexWrap = "wrap", a.style.alignItems = "center";
        return;
      }
      case "bottom": {
        s.style.bottom = "8px", s.style.left = "8px", s.style.right = "8px", a.style.flexDirection = "row", a.style.flexWrap = "wrap", a.style.alignItems = "center";
        return;
      }
    }
  })(t), e.appendChild(s);
  let c = !1, u = null, f = null, d = -1;
  return { update: (y, g) => {
    if (c || (s.style.color = g.textColor, s.style.background = g.backgroundColor, s.style.borderColor = g.axisLineColor, s.style.fontFamily = g.fontFamily, s.style.fontSize = `${g.fontSize}px`, u === y && f === g && d === y.length))
      return;
    u = y, f = g, d = y.length;
    const S = [];
    for (let A = 0; A < y.length; A++) {
      const M = y[A];
      if (M.type === "pie")
        for (let h = 0; h < M.data.length; h++) {
          const b = M.data[h], v = (b == null ? void 0 : b.visible) !== !1, x = document.createElement("div");
          x.style.display = "flex", x.style.alignItems = "center", x.style.gap = "6px", x.style.lineHeight = "1.1", x.style.whiteSpace = "nowrap", x.style.cursor = n ? "pointer" : "default", x.style.opacity = v ? "1" : "0.5", x.style.transition = "opacity 0.2s", n && (x.setAttribute("role", "button"), x.setAttribute("aria-pressed", String(v)), x.setAttribute("aria-label", `Toggle ${kf(b == null ? void 0 : b.name, h)} visibility`), x.tabIndex = 0, x.dataset.seriesIndex = String(A), x.dataset.sliceIndex = String(h));
          const F = document.createElement("div");
          F.style.width = "10px", F.style.height = "10px", F.style.borderRadius = "2px", F.style.flex = "0 0 auto", F.style.background = Pw(b == null ? void 0 : b.color, A, h, g), F.style.border = `1px solid ${g.axisLineColor}`;
          const I = document.createElement("span");
          I.textContent = kf(b == null ? void 0 : b.name, h), I.style.textDecoration = v ? "none" : "line-through", x.appendChild(F), x.appendChild(I), S.push(x);
        }
      else {
        const h = M.visible !== !1, b = document.createElement("div");
        b.style.display = "flex", b.style.alignItems = "center", b.style.gap = "6px", b.style.lineHeight = "1.1", b.style.whiteSpace = "nowrap", b.style.cursor = n ? "pointer" : "default", b.style.opacity = h ? "1" : "0.5", b.style.transition = "opacity 0.2s", n && (b.setAttribute("role", "button"), b.setAttribute("aria-pressed", String(h)), b.setAttribute("aria-label", `Toggle ${Df(M, A)} visibility`), b.tabIndex = 0, b.dataset.seriesIndex = String(A));
        const v = document.createElement("div");
        v.style.width = "10px", v.style.height = "10px", v.style.borderRadius = "2px", v.style.flex = "0 0 auto", v.style.background = Iw(M, A, g), v.style.border = `1px solid ${g.axisLineColor}`;
        const x = document.createElement("span");
        x.textContent = Df(M, A), x.style.textDecoration = h ? "none" : "line-through", b.appendChild(v), b.appendChild(x), S.push(b);
      }
    }
    a.replaceChildren(...S);
  }, dispose: () => {
    if (!c) {
      c = !0;
      try {
        s.remove();
      } finally {
        o !== null && (e.style.position = o);
      }
    }
  } };
}
const Ef = (e, t, n) => n < t || e < t ? t : e > n ? n : e;
function Lf(e) {
  const n = getComputedStyle(e).position === "static", i = n ? e.style.position : null;
  n && (e.style.position = "relative");
  const r = document.createElement("div");
  r.style.position = "absolute", r.style.left = "0", r.style.top = "0", r.style.pointerEvents = "none", r.style.userSelect = "none", r.style.boxSizing = "border-box", r.style.zIndex = "var(--chartgpu-tooltip-z, 20)", r.style.padding = "var(--chartgpu-tooltip-padding, 6px 8px)", r.style.borderRadius = "var(--chartgpu-tooltip-radius, 8px)", r.style.borderStyle = "solid", r.style.borderWidth = "var(--chartgpu-tooltip-border-width, 1px)", r.style.borderColor = "var(--chartgpu-tooltip-border, rgba(224,224,224,0.35))", r.style.boxShadow = "var(--chartgpu-tooltip-shadow, 0 6px 18px rgba(0,0,0,0.35))", r.style.maxWidth = "var(--chartgpu-tooltip-max-width, min(320px, 100%))", r.style.overflow = "hidden", r.style.fontFamily = 'var(--chartgpu-tooltip-font-family, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji")', r.style.fontSize = "var(--chartgpu-tooltip-font-size, 12px)", r.style.lineHeight = "var(--chartgpu-tooltip-line-height, 1.2)", r.style.color = "var(--chartgpu-tooltip-color, #e0e0e0)", r.style.background = "var(--chartgpu-tooltip-bg, rgba(26,26,46,0.95))", r.style.whiteSpace = "normal", r.style.opacity = "0", r.style.transitionProperty = "opacity";
  const o = 140;
  r.style.transitionDuration = `${o}ms`, r.style.transitionTimingFunction = "ease", r.style.willChange = "opacity", r.style.display = "none", r.style.visibility = "hidden", r.setAttribute("role", "tooltip"), e.appendChild(r);
  let s = !1, a = 0, l = null, c = null;
  const u = () => {
    l != null && (window.clearTimeout(l), l = null), c != null && (window.cancelAnimationFrame(c), c = null);
  }, f = () => r.style.display === "none" || r.style.visibility === "hidden", d = () => {
    const g = r.style.visibility;
    r.style.visibility = "hidden";
    const S = r.offsetWidth, A = r.offsetHeight;
    return r.style.visibility = g, { width: S, height: A };
  };
  return { show: (g, S, A) => {
    if (s) return;
    a += 1, u();
    const M = f();
    r.innerHTML = A;
    const h = 12, b = 12, v = 8;
    r.style.display = "block", r.style.visibility = "hidden";
    const { width: x, height: F } = d(), I = e.clientWidth, R = e.clientHeight;
    let T = g + h, N = S + b;
    if (T + x > I - v && (T = g - h - x), N + F > R - v && (N = S - b - F), T = Ef(T, v, I - v - x), N = Ef(N, v, R - v - F), r.style.left = `${T}px`, r.style.top = `${N}px`, r.style.visibility = "visible", M) {
      r.style.opacity = "0";
      const w = a;
      c = window.requestAnimationFrame(() => {
        c = null, !s && w === a && (r.style.opacity = "1");
      });
    } else
      r.style.opacity = "1";
  }, hide: () => {
    if (s) return;
    if (a += 1, u(), r.style.display === "none" || r.style.visibility === "hidden") {
      r.style.opacity = "0", r.style.visibility = "hidden", r.style.display = "none";
      return;
    }
    r.style.opacity = "0";
    const g = a;
    l = window.setTimeout(() => {
      l = null, !s && g === a && (r.style.visibility = "hidden", r.style.display = "none");
    }, o + 50);
  }, dispose: () => {
    if (!s) {
      s = !0;
      try {
        u(), r.remove();
      } finally {
        i !== null && (e.style.position = i);
      }
    }
  } };
}
function Uf(e) {
  const t = getComputedStyle(e).position, n = t === "static" || t === "", i = n ? e.style.position : null;
  n && (e.style.position = "relative");
  const r = document.createElement("div");
  r.style.position = "absolute", r.style.left = "0", r.style.top = "0", r.style.pointerEvents = "none", r.style.userSelect = "none", r.style.boxSizing = "border-box", r.style.zIndex = "12", r.style.padding = "2px 6px", r.style.borderRadius = "2px", r.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', r.style.fontSize = "11px", r.style.lineHeight = "1.25", r.style.fontVariantNumeric = "tabular-nums", r.style.whiteSpace = "nowrap", r.style.overflow = "visible", r.style.textOverflow = "clip", r.style.display = "none", r.style.visibility = "hidden", r.setAttribute("role", "status"), r.setAttribute("aria-live", "polite");
  const o = document.createElement("div");
  o.style.fontWeight = "600", o.style.whiteSpace = "nowrap";
  const s = document.createElement("div");
  s.style.fontWeight = "400", s.style.fontSize = "10px", s.style.opacity = "0.95", s.style.whiteSpace = "nowrap", s.style.display = "none", r.appendChild(o), r.appendChild(s), e.appendChild(r);
  let a = !1, l = null, c = !1, u = Number.NaN, f = Number.NaN, d = "", m = "", p = "", y = null, g = Number.NaN;
  const S = (x) => x == null || x.length === 0 ? null : x, A = (x) => {
    if (x == null) {
      s.textContent = "", s.style.display = "none", l = null;
      return;
    }
    s.textContent = x, s.style.display = "block", l = x;
  }, M = (x) => {
    r.style.transform = x === "left" ? "translate(-100%, -50%)" : "translateY(-50%)";
  };
  return { update: (x) => {
    if (a) return;
    if (!x.visible) {
      c && (r.style.display = "none", r.style.visibility = "hidden", c = !1);
      return;
    }
    const F = x.opacity ?? 1, I = S(x.countdownText);
    c && u === x.x && f === x.y && d === x.priceText && m === x.background && p === x.color && y === x.side && g === F && l === I || (r.style.display = "block", r.style.visibility = "visible", r.style.left = `${x.x}px`, r.style.top = `${x.y}px`, r.style.background = x.background, r.style.color = x.color, r.style.opacity = String(F), M(x.side), d !== x.priceText && (o.textContent = x.priceText, d = x.priceText), l !== I && A(I), c = !0, u = x.x, f = x.y, m = x.background, p = x.color, y = x.side, g = F);
  }, setCountdown: (x) => {
    if (a) return;
    const F = S(x);
    F !== l && A(F);
  }, dispose: () => {
    if (!a) {
      a = !0;
      try {
        r.remove();
      } finally {
        i !== null && (e.style.position = i);
      }
    }
  } };
}
const Cs = "—";
function Pn(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function an(e) {
  if (!Number.isFinite(e)) return Cs;
  const i = (Object.is(e, -0) ? 0 : e).toFixed(2).replace(/\.?0+$/, "");
  return i === "-0" ? "0" : i;
}
function Nm(e) {
  const t = e.seriesName.trim();
  return t.length > 0 ? t : `Series ${e.seriesIndex + 1}`;
}
function Mm(e) {
  const t = e.trim();
  return t.length === 0 ? "#888" : /^#[0-9a-fA-F]{3}$/.test(t) || /^#[0-9a-fA-F]{6}$/.test(t) || /^#[0-9a-fA-F]{8}$/.test(t) || /^rgba?\(\s*\d{1,3}\s*(?:,\s*|\s+)\d{1,3}\s*(?:,\s*|\s+)\d{1,3}(?:\s*(?:,\s*|\/\s*)(?:0|1|0?\.\d+))?\s*\)$/.test(t) || /^[a-zA-Z]+$/.test(t) ? t : "#888";
}
function Sm(e) {
  return e.length === 5;
}
function Bw(e, t) {
  if (!Number.isFinite(e) || !Number.isFinite(t) || e === 0) return Cs;
  const n = (t - e) / e * 100;
  return Number.isFinite(n) ? `${n > 0 ? "+" : ""}${n.toFixed(2)}%` : Cs;
}
function ri(e, t, n) {
  const i = Pn(Nm(e)), r = n ?? Pn(t);
  return [
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">',
    '<span style="display:flex;align-items:center;gap:8px;min-width:0;">',
    `<span style="width:8px;height:8px;border-radius:999px;flex:0 0 auto;background-color:${Pn(Mm(e.color))};"></span>`,
    `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i}</span>`,
    "</span>",
    `<span style="font-variant-numeric:tabular-nums;white-space:nowrap;">${r}</span>`,
    "</div>"
  ].join("");
}
function Wi(e) {
  return `<span style="opacity:0.7">${Pn(e)}</span>`;
}
function Cm(e) {
  const [, t, n, i, r] = e.value, o = Pn(Nm(e)), s = Pn(Mm(e.color)), a = an(t), l = an(r), c = an(i), u = an(n), f = n > t, d = f ? "▲" : "▼", m = f ? "#22c55e" : "#ef4444", p = Bw(t, n), y = `O: ${a} H: ${l} L: ${c} C: ${u}`, g = Pn(y), S = Pn(d), A = Pn(p), M = Pn(m);
  return [
    '<div style="display:flex;flex-direction:column;gap:4px;">',
    // Series name row
    '<div style="display:flex;align-items:center;gap:8px;">',
    `<span style="width:8px;height:8px;border-radius:999px;flex:0 0 auto;background-color:${s};"></span>`,
    `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;">${o}</span>`,
    "</div>",
    // OHLC values row
    `<div style="font-variant-numeric:tabular-nums;white-space:nowrap;font-size:0.9em;">${g}</div>`,
    // Change row with arrow
    '<div style="display:flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums;">',
    `<span style="color:${M};font-weight:700;">${S}</span>`,
    `<span style="color:${M};font-weight:600;">${A}</span>`,
    "</div>",
    "</div>"
  ].join("");
}
function Rw(e) {
  return Cm(e);
}
function Li(e) {
  if (Sm(e.value))
    return Rw(e);
  if (typeof e.z == "number") {
    const t = an(e.z), n = `x=${an(e.value[0])} y=${an(e.value[1])}`;
    return ri(e, `${t} (${n})`, `${Pn(t)} ${Wi(`(${n})`)}`);
  }
  if (typeof e.y1 == "number" && Number.isFinite(e.y1)) {
    const t = e.value[1], n = e.y1, i = an(Math.min(t, n)), r = an(Math.max(t, n));
    return ri(e, `${i} … ${r}`);
  }
  if (typeof e.stackTotal == "number" && Number.isFinite(e.stackTotal)) {
    const t = an(e.value[1]), n = an(e.stackTotal);
    return ri(e, `${t} (total ${n})`, `${Pn(t)} ${Wi(`total ${n}`)}`);
  }
  if (typeof e.high == "number" && typeof e.low == "number") {
    const t = an(e.value[1]), n = an(e.high), i = an(e.low), r = `${t} [${i} … ${n}]`;
    return ri(e, r, `${Pn(t)} ${Wi(`[${i} … ${n}]`)}`);
  }
  if (typeof e.baseline == "number" && Number.isFinite(e.baseline)) {
    const t = an(e.value[1]), n = an(e.baseline);
    return ri(e, `${t} (base ${n})`, `${Pn(t)} ${Wi(`base ${n}`)}`);
  }
  return ri(e, an(e.value[1]));
}
function ls(e) {
  if (e.length === 0) return "";
  const t = `x: ${an(e[0].value[0])}`, n = `<div style="margin:0 0 6px 0;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;">${Pn(
    t
  )}</div>`, i = e.map((r) => {
    if (Sm(r.value))
      return Cm(r);
    if (typeof r.z == "number") {
      const o = an(r.z), s = `x=${an(r.value[0])} y=${an(r.value[1])}`;
      return ri(r, `${o} (${s})`, `${Pn(o)} ${Wi(`(${s})`)}`);
    }
    if (typeof r.y1 == "number" && Number.isFinite(r.y1)) {
      const o = r.value[1], s = r.y1, a = an(Math.min(o, s)), l = an(Math.max(o, s));
      return ri(r, `${a} … ${l}`);
    }
    if (typeof r.stackTotal == "number" && Number.isFinite(r.stackTotal)) {
      const o = an(r.value[1]), s = an(r.stackTotal);
      return ri(r, `${o} (total ${s})`, `${Pn(o)} ${Wi(`total ${s}`)}`);
    }
    if (typeof r.high == "number" && typeof r.low == "number") {
      const o = an(r.value[1]), s = an(r.high), a = an(r.low);
      return ri(r, `${o} [${a} … ${s}]`, `${Pn(o)} ${Wi(`[${a} … ${s}]`)}`);
    }
    if (typeof r.baseline == "number" && Number.isFinite(r.baseline)) {
      const o = an(r.value[1]), s = an(r.baseline);
      return ri(r, `${o} (base ${s})`, `${Pn(o)} ${Wi(`base ${s}`)}`);
    }
    return ri(r, an(r.value[1]));
  }).join('<div style="height:4px;"></div>');
  return `${n}${i}`;
}
const Dw = (e) => Number.isFinite(e) ? e : 0, kw = (e) => Number.isFinite(e) ? e : null;
function _f() {
  const e = /* @__PURE__ */ new Map();
  function t(o, s, a, l, c, u) {
    const f = Symbol("Animation");
    if (Array.isArray(o) || Array.isArray(s)) {
      if (!Array.isArray(o) || !Array.isArray(s))
        throw new Error('Array animation requires both "from" and "to" to be arrays');
      if (o.length !== s.length)
        throw new Error(`Array animation length mismatch: from.length=${o.length}, to.length=${s.length}`);
      const d = new Array(o.length);
      return e.set(f, {
        kind: "array",
        from: o,
        to: s,
        duration: a,
        easing: l,
        onUpdate: c,
        onComplete: u,
        startTime: null,
        out: d
      }), f;
    }
    return e.set(f, {
      kind: "scalar",
      from: o,
      to: s,
      duration: a,
      easing: l,
      onUpdate: c,
      onComplete: u,
      startTime: null
    }), f;
  }
  function n(o) {
    e.delete(o);
  }
  function i() {
    e.clear();
  }
  function r(o) {
    var l;
    const s = kw(o);
    if (s === null) return;
    const a = Array.from(e.keys());
    for (const c of a) {
      const u = e.get(c);
      if (!u) continue;
      const f = u.startTime ?? s;
      u.startTime === null && e.set(c, { ...u, startTime: f });
      const d = Dw(u.duration), m = Math.max(0, s - f), p = d <= 0 || m >= d, y = d <= 0 ? 1 : m / d, g = p ? 1 : u.easing(y);
      if (u.kind === "scalar") {
        const S = u.from + (u.to - u.from) * g;
        if (u.onUpdate(S), !e.has(c)) continue;
      } else {
        const S = u.out.length;
        for (let A = 0; A < S; A++) {
          const M = u.from[A] ?? 0, h = u.to[A] ?? 0;
          u.out[A] = M + (h - M) * g;
        }
        if (u.onUpdate(u.out), !e.has(c)) continue;
      }
      p && ((l = u.onComplete) == null || l.call(u), e.delete(c));
    }
  }
  return {
    animate: t,
    cancel: n,
    cancelAll: i,
    update: r
  };
}
const la = (e) => Number.isNaN(e) || e <= 0 ? 0 : e >= 1 ? 1 : e;
function zf(e) {
  return la(e);
}
function Ew(e) {
  const n = 1 - la(e);
  return 1 - n * n * n;
}
function Lw(e) {
  const t = la(e);
  if (t < 0.5) return 4 * t * t * t;
  const n = -2 * t + 2;
  return 1 - n * n * n / 2;
}
function Uw(e) {
  const t = la(e), n = 7.5625, i = 2.75;
  if (t < 1 / i)
    return n * t * t;
  if (t < 2 / i) {
    const o = t - 1.5 / i;
    return n * o * o + 0.75;
  }
  if (t < 2.5 / i) {
    const o = t - 2.25 / i;
    return n * o * o + 0.9375;
  }
  const r = t - 2.625 / i;
  return n * r * r + 0.984375;
}
function _w(e) {
  switch (e) {
    case "linear":
      return zf;
    case "cubicOut":
      return Ew;
    case "cubicInOut":
      return Lw;
    case "bounceOut":
      return Uw;
    default:
      return zf;
  }
}
const ml = (e, t) => {
  if (t.length === 0) return e;
  let n = (e == null ? void 0 : e.xMin) ?? Number.POSITIVE_INFINITY, i = (e == null ? void 0 : e.xMax) ?? Number.NEGATIVE_INFINITY, r = (e == null ? void 0 : e.yMin) ?? Number.POSITIVE_INFINITY, o = (e == null ? void 0 : e.yMax) ?? Number.NEGATIVE_INFINITY;
  for (let s = 0; s < t.length; s++) {
    const a = t[s], l = $n(a) ? a[0] : a.timestamp, c = $n(a) ? a[3] : a.low, u = $n(a) ? a[4] : a.high;
    !Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(u) || (l < n && (n = l), l > i && (i = l), c < r && (r = c), u > o && (o = u));
  }
  return !Number.isFinite(n) || !Number.isFinite(i) || !Number.isFinite(r) || !Number.isFinite(o) ? e : (n === i && (i = n + 1), r === o && (o = r + 1), { xMin: n, xMax: i, yMin: r, yMax: o });
}, Po = (e, t) => {
  let n = e, i = t;
  if ((!Number.isFinite(n) || !Number.isFinite(i)) && (n = 0, i = 1), n === i)
    i = n + 1;
  else if (n > i) {
    const r = n;
    n = i, i = r;
  }
  return { min: n, max: i };
}, Gf = /* @__PURE__ */ new Map();
function Xi(e, t, n) {
  const i = (n == null ? void 0 : n.base) != null && Number.isFinite(n.base) && n.base > 0 && n.base !== 1 ? n.base : 10, r = i > 1 ? i : 10;
  let o = !1, s = e, a = t;
  const l = (c, u) => {
    if (Number.isFinite(c) && c > 0) return c;
    o = !0;
    const f = n == null ? void 0 : n.positiveDataMin;
    if (f != null && Number.isFinite(f) && f > 0) {
      const d = f * 0.5, m = Math.log(Math.max(d, Number.MIN_VALUE)) / Math.log(i), p = i ** Math.floor(m);
      return Math.max(p, Number.MIN_VALUE);
    }
    return u === "min" ? 1 : r;
  };
  if (s = l(s, "min"), a = l(a, "max"), s === a)
    a = s * i;
  else if (s > a) {
    const c = s;
    s = a, a = c;
  }
  if ((!Number.isFinite(s) || !Number.isFinite(a) || !(s > 0) || !(a > 0)) && (o = !0, s = 1, a = r), o && (n == null ? void 0 : n.warn) !== !1) {
    const c = (n == null ? void 0 : n.warnKey) ?? "default", u = `${s}|${a}|${i}`;
    Gf.get(c) !== u && (Gf.set(c, u), console.warn(
      `[ChartGPU] Log axis domain was non-positive or invalid; using [${s}, ${a}]. Log axes require strictly positive min/max.`
    ));
  }
  return { min: s, max: a, warned: o };
}
function zw() {
  return {
    content: null,
    x: null,
    y: null
  };
}
function ei(e, t, n, i) {
  return e.content !== t || e.x !== n || e.y !== i;
}
function ti(e, t, n, i) {
  e.content = t, e.x = n, e.y = i;
}
function Of(e) {
  e.content = null, e.x = null, e.y = null;
}
function Gw(e) {
  return Array.isArray(e) ? e.length === 5 : e && typeof e == "object" ? "timestamp" in e && "open" in e && "close" in e && "low" in e && "high" in e : !1;
}
function Ow(e, t) {
  if (t) {
    const n = e.get(t);
    if (n) return n;
  }
  for (const n of ["price", "y", "default"]) {
    const i = e.get(n);
    if (i) return i;
  }
  return e.values().next().value;
}
function Hw(e, t, n, i, r) {
  const o = e.point, s = $n(o) ? o[0] : o.timestamp, a = $n(o) ? o[1] : o.open, l = $n(o) ? o[2] : o.close;
  if (!Number.isFinite(s) || !Number.isFinite(a) || !Number.isFinite(l))
    return null;
  const c = (a + l) / 2, u = t.scale(s), f = Ow(n, e.yAxisId), d = f ? f.scale(c) : 0;
  if (!Number.isFinite(u) || !Number.isFinite(d))
    return null;
  const m = i.left + u, p = i.top + d, y = typeof r.offsetLeft == "number" ? r.offsetLeft + m : m, g = typeof r.offsetLeft == "number" ? r.offsetTop + p : p;
  return !Number.isFinite(y) || !Number.isFinite(g) ? null : { x: y, y: g };
}
function Yw() {
  return {
    source: "mouse",
    x: 0,
    y: 0,
    gridX: 0,
    gridY: 0,
    isInGrid: !1,
    hasPointer: !1
  };
}
function Ww(e, t, n, i, r) {
  return {
    source: "mouse",
    x: e,
    y: t,
    gridX: n,
    gridY: i,
    isInGrid: r,
    hasPointer: !0
  };
}
function Xw(e) {
  return {
    ...e,
    isInGrid: !1,
    hasPointer: !1
  };
}
function Vw(e, t) {
  const n = t.scale(e);
  return Number.isFinite(n) ? n : null;
}
function $w(e, t) {
  const n = t.invert(e);
  return Number.isFinite(n) ? n : null;
}
function qw(e, t, n) {
  if (e === null)
    return null;
  const i = Vw(e, t.xScale);
  if (i === null)
    return null;
  const r = t.plotHeightCss * 0.5, o = i >= 0 && i <= t.plotWidthCss && r >= 0 && r <= t.plotHeightCss;
  return {
    source: "sync",
    gridX: i,
    gridY: r,
    // Canvas-local CSS pixels (grid-relative + grid offset)
    x: n.left + i,
    y: n.top + r,
    isInGrid: o,
    hasPointer: o
  };
}
function jw(e, t, n, i) {
  if (e.source === "mouse")
    return e;
  if (!n)
    return { ...e, hasPointer: !1, isInGrid: !1 };
  const r = qw(t, n, i);
  return r || { ...e, hasPointer: !1, isInGrid: !1 };
}
function Zw(e) {
  return e !== null && Number.isFinite(e) ? e : null;
}
function Kw() {
  const e = /* @__PURE__ */ new Set();
  return {
    add: (t) => {
      e.add(t);
    },
    remove: (t) => {
      e.delete(t);
    },
    emit: (t, n) => {
      const i = Array.from(e);
      for (const r of i)
        r(t, n);
    },
    clear: () => {
      e.clear();
    }
  };
}
function Jw(e, t, n, i) {
  return e !== n || t !== i;
}
function Qw(e) {
  if (!Number.isFinite(e)) return "";
  const t = Object.is(e, -0) ? 0 : e, n = Math.abs(t);
  return n >= 1e3 ? t.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n >= 1 ? t.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.toLocaleString("en-US", { maximumSignificantDigits: 6 });
}
function Fm(e) {
  const t = Math.max(0, Math.floor(Number.isFinite(e) ? e : 0)), n = Math.floor(t / 1e3), i = Math.floor(n / 3600), r = Math.floor(n % 3600 / 60), o = n % 60, s = (a) => a < 10 ? `0${a}` : String(a);
  return `${s(i)}:${s(r)}:${s(o)}`;
}
function Am(e, t) {
  return e == null || !Number.isFinite(e) || !Number.isFinite(t) ? 0 : Math.max(0, e - t);
}
function eN(e) {
  if ($n(e)) {
    const t = e;
    return { timestamp: t[0], open: t[1], close: t[2] };
  }
  return { timestamp: e.timestamp, open: e.open, close: e.close };
}
function Im(e) {
  const t = e.raw;
  if (t == null || t.length === 0) return null;
  const n = t[t.length - 1], { timestamp: i, open: r, close: o } = eN(n);
  if (!Number.isFinite(r) || !Number.isFinite(o)) return null;
  const s = o >= r, a = s ? e.upColor : e.downColor, l = e.intervalMs, c = l != null && Number.isFinite(i) ? i + l : null;
  return {
    seriesIndex: e.seriesIndex,
    yAxisId: e.yAxisId,
    open: r,
    close: o,
    timestamp: Number.isFinite(i) ? i : Number.NaN,
    isUp: s,
    upColor: e.upColor,
    downColor: e.downColor,
    directionColor: a,
    barEndMs: c
  };
}
function tN(e, t) {
  if (!(e.type === "candlestick" || e.type === "ohlc") || e.visible === !1) return !1;
  const n = e.priceLabel;
  return n === !1 || n === null ? !1 : n === !0 ? !0 : n === void 0 ? t : typeof n == "object" ? n.show ?? !0 : !1;
}
function qs(e, t) {
  var o;
  const n = (t == null ? void 0 : t.candlePrimary) ?? !1;
  let i = null, r = !1;
  for (let s = 0; s < e.length; s++) {
    const a = e[s];
    if (tN(a, n)) {
      if (i == null) {
        i = s;
        continue;
      }
      r || (r = !0, (o = t == null ? void 0 : t.onWarn) == null || o.call(t, "ChartGPU: multiple candlestick series have priceLabel.show; only the first is used (v1)."));
    }
  }
  return i;
}
const nN = 250, lo = Object.freeze({
  active: !1,
  intervalMs: null,
  nowMs: null
});
function iN(e, t) {
  return typeof window > "u" || typeof window.setInterval != "function" ? null : window.setInterval(e, t);
}
function rN(e) {
  typeof window < "u" && typeof window.clearInterval == "function" ? window.clearInterval(e) : typeof clearInterval == "function" && clearInterval(e);
}
function Hf(e) {
  const t = e.setCountdown, n = typeof e.tickMs == "number" && Number.isFinite(e.tickMs) && e.tickMs > 0 ? e.tickMs : nN, i = e.setIntervalFn ?? ((S, A) => iN(S, A)), r = e.clearIntervalFn ?? rN;
  let o = null, s = null, a = lo, l = !1;
  const c = () => {
    const S = a.nowMs;
    return typeof S == "function" ? S() : Date.now();
  }, u = () => {
    if (l) return;
    if (s == null) {
      t(null);
      return;
    }
    const S = Am(s, c());
    t(Fm(S));
  }, f = () => {
    o != null && (r(o), o = null);
  }, d = () => {
    f(), u(), o = i(u, n) ?? null;
  };
  return {
    setDesired: (S) => {
      if (l) return;
      const A = S ?? lo;
      if (!A.active) {
        f(), t(null), a = lo;
        return;
      }
      const M = o != null && a.active && a.intervalMs === A.intervalMs && a.nowMs === A.nowMs;
      a = A, !M && d();
    },
    setBarEndMs: (S) => {
      if (l) return;
      const A = S != null && Number.isFinite(S) ? S : null;
      s !== A && (s = A, (o != null || a.active) && o != null && u());
    },
    clear: (S) => {
      f(), a = lo, (S == null ? void 0 : S.clearText) !== !1 && t(null);
    },
    dispose: () => {
      l || (l = !0, f(), s = null, a = lo, t(null));
    },
    isRunning: () => o != null
  };
}
function Pm(e) {
  const t = e.show === !0 && e.showCountdown === !0 && e.intervalMs != null && Number.isFinite(e.intervalMs) && e.intervalMs > 0;
  return {
    active: t,
    intervalMs: t ? e.intervalMs : null,
    nowMs: t ? e.nowMs : null
  };
}
const oN = 6, Yf = 2, sN = 0.85, Tm = "#ffffff", Vi = Object.freeze({
  countdownDesired: Object.freeze({
    active: !1,
    intervalMs: null,
    nowMs: null
  }),
  barEndMs: null
});
function aN(e, t, n) {
  if (!t || e.barEndMs == null) return null;
  const i = typeof n == "function" ? n() : Date.now();
  return Fm(Am(e.barEndMs, i));
}
const lN = {
  visible: !1,
  x: 0,
  y: 0,
  priceText: "",
  countdownText: null,
  background: "#000000",
  color: Tm,
  side: "right"
};
function Ui(e) {
  e.update(lN);
}
function cN(e, t) {
  const n = qs(e, {
    candlePrimary: !1,
    onWarn: t == null ? void 0 : t.onWarn
  });
  if (n == null)
    return Vi.countdownDesired;
  const i = e[n];
  if (!i || !(i.type === "candlestick" || i.type === "ohlc"))
    return Vi.countdownDesired;
  const o = i.priceLabel;
  return o ? Pm({
    show: o.show,
    showCountdown: o.showCountdown,
    intervalMs: o.intervalMs,
    nowMs: o.nowMs
  }) : Vi.countdownDesired;
}
function uN(e) {
  const t = e.priceLabel;
  return t ? Pm({
    show: t.show,
    showCountdown: t.showCountdown,
    intervalMs: t.intervalMs,
    nowMs: t.nowMs
  }) : Vi.countdownDesired;
}
function fN(e) {
  const t = e.priceLabelUi;
  if (!t) return Vi;
  const {
    series: n,
    runtimeRawDataByIndex: i,
    yScales: r,
    yAxes: o,
    plotClipRect: s,
    canvasCssWidth: a,
    canvasCssHeight: l,
    offsetX: c,
    offsetY: u,
    onWarn: f
  } = e, d = qs(n, {
    candlePrimary: !1,
    onWarn: f
  });
  if (d == null)
    return Ui(t), Vi;
  const m = n[d];
  if (!m || !(m.type === "candlestick" || m.type === "ohlc"))
    return Ui(t), Vi;
  const p = m, y = p.priceLabel, g = uN(p);
  if (!(y != null && y.show))
    return Ui(t), Vi;
  if (!(a > 0) || !(l > 0))
    return Ui(t), { countdownDesired: g, barEndMs: null };
  const S = p.yAxis, A = r.get(S);
  if (!A)
    return Ui(t), { countdownDesired: g, barEndMs: null };
  const M = o.find((W) => (W.id ?? "y") === S) ?? o[0] ?? null, h = (M == null ? void 0 : M.position) === "right" ? "right" : "left", b = typeof (M == null ? void 0 : M.tickLength) == "number" && Number.isFinite(M.tickLength) && M.tickLength >= 0 ? M.tickLength : oN, v = i[d], x = Im({
    seriesIndex: d,
    yAxisId: S,
    raw: v,
    upColor: p.itemStyle.upColor,
    downColor: p.itemStyle.downColor,
    intervalMs: y.intervalMs
  });
  if (!x)
    return Ui(t), { countdownDesired: g, barEndMs: null };
  const F = A.scale(x.close);
  if (!Number.isFinite(F))
    return Ui(t), { countdownDesired: g, barEndMs: x.barEndMs };
  const I = fi(F, l), R = fi(s.top, l), T = fi(s.bottom, l), N = ii(s.left, a), w = ii(s.right, a), P = A.getDomain(), B = Math.min(P.min, P.max), _ = Math.max(P.min, P.max), C = x.close >= B && x.close <= _;
  if (!C && y.outOfDomain === "hide")
    return Ui(t), { countdownDesired: g, barEndMs: x.barEndMs };
  let E = I, U = 1;
  if (!C) {
    const W = Math.min(R, T), j = Math.max(R, T);
    E = Math.min(j, Math.max(W, I)), U = sN;
  }
  const G = h === "right" ? c + w + b + Yf : c + N - b - Yf, O = u + E, D = typeof y.formatter == "function" ? y.formatter(x.close) : Qw(x.close), k = aN(x, y.showCountdown, y.nowMs);
  return t.update({
    visible: !0,
    x: G,
    y: O,
    priceText: D,
    countdownText: k,
    background: x.directionColor,
    color: y.color ?? Tm,
    side: h,
    opacity: U
  }), { countdownDesired: g, barEndMs: x.barEndMs };
}
const dN = [1, 1, 1, 1];
function mN(e) {
  const { last: t, outOfDomain: n, yScale: i, canvasCssHeight: r, lineWidth: o, lineColor: s } = e;
  if (t == null) return [];
  if (!(r > 0)) return [];
  if (!(typeof o == "number" && Number.isFinite(o) && o > 0))
    return [];
  const a = i.getDomain(), l = Math.min(a.min, a.max), c = Math.max(a.min, a.max);
  if (!(t.close >= l && t.close <= c) && n === "hide") return [];
  const f = i.scale(t.close);
  if (!Number.isFinite(f)) return [];
  const d = fi(f, r);
  if (!Number.isFinite(d)) return [];
  const m = s ?? t.directionColor, p = wn(m) ?? wn(t.directionColor) ?? dN;
  return [
    {
      axis: "horizontal",
      positionCssPx: d,
      lineWidth: o,
      rgba: p
    }
  ];
}
const pl = Hw, Pr = sp, pN = "bgra8unorm", hN = 2166136261, yN = 16777619, Bm = new Float64Array(1), Wf = new Uint32Array(Bm.buffer), js = (e, t) => Math.imul(e ^ t >>> 0, yN) >>> 0, cs = (e, t) => {
  Bm[0] = t;
  let n = js(e, Wf[0]);
  return n = js(n, Wf[1]), n;
}, gN = 2e4, Rm = Symbol.for("chartgpu.ownedMutableXYColumns"), Fs = (e) => (e[Rm] = !0, e), xN = (e) => {
  const t = $e(e);
  if (t === 0) return Fs({ x: [], y: [] });
  const n = new Array(t), i = new Array(t);
  let r = !1, o;
  for (let s = 0; s < t; s++) {
    n[s] = Te(e, s), i[s] = ht(e, s);
    const a = Sn(e, s);
    a !== void 0 ? (r = !0, o || (o = new Array(s)), o[s] = a) : o && (o[s] = void 0);
  }
  return Fs(r && o ? { x: n, y: i, size: o } : { x: n, y: i });
}, bN = (e, t) => {
  const n = Rn(t);
  if (!n) return e;
  if (!e) return n;
  let i = Math.min(e.xMin, n.xMin), r = Math.max(e.xMax, n.xMax), o = Math.min(e.yMin, n.yMin), s = Math.max(e.yMax, n.yMax);
  return i === r && (r = i + 1), o === s && (s = o + 1), { xMin: i, xMax: r, yMin: o, yMax: s };
}, vN = (e, t) => {
  let n = Number.POSITIVE_INFINITY, i = Number.NEGATIVE_INFINITY;
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    if (o.type === "pie" || !ji(o)) continue;
    const s = (t == null ? void 0 : t[r]) ?? null;
    if (s) {
      const u = s;
      if (Number.isFinite(u.xMin) && Number.isFinite(u.xMax)) {
        u.xMin < n && (n = u.xMin), u.xMax > i && (i = u.xMax);
        continue;
      }
    }
    const a = o.rawBounds;
    if (a) {
      const u = a;
      if (Number.isFinite(u.xMin) && Number.isFinite(u.xMax)) {
        u.xMin < n && (n = u.xMin), u.xMax > i && (i = u.xMax);
        continue;
      }
    }
    if (o.type === "candlestick" || o.type === "ohlc") {
      const u = o.rawData ?? o.data;
      for (let f = 0; f < u.length; f++) {
        const d = u[f], m = jn(d) ? d[0] : d.timestamp;
        Number.isFinite(m) && (m < n && (n = m), m > i && (i = m));
      }
      continue;
    }
    if (o.type === "band") {
      const u = o.rawData ?? o.data, f = yn(u);
      for (let d = 0; d < f; d++) {
        const m = Wl(u, d);
        Number.isFinite(m) && (m < n && (n = m), m > i && (i = m));
      }
      continue;
    }
    const l = o.data, c = $e(l);
    for (let u = 0; u < c; u++) {
      const f = Te(l, u);
      Number.isFinite(f) && (f < n && (n = f), f > i && (i = f));
    }
  }
  return !Number.isFinite(n) || !Number.isFinite(i) ? { xMin: 0, xMax: 1 } : (n === i && (i = n + 1), { xMin: n, xMax: i });
}, Dm = (e, t, n) => {
  let i = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  for (let s = 0; s < e.length; s++) {
    const a = e[s];
    if (a.type === "pie" || !ji(a) || a.yAxis !== t) continue;
    const l = (n == null ? void 0 : n[s]) ?? null;
    if (l) {
      const d = l;
      if (Number.isFinite(d.yMin) && Number.isFinite(d.yMax)) {
        d.yMin < i && (i = d.yMin), d.yMax > r && (r = d.yMax);
        continue;
      }
    }
    const c = a.rawBounds;
    if (c) {
      const d = c;
      if (Number.isFinite(d.yMin) && Number.isFinite(d.yMax)) {
        d.yMin < i && (i = d.yMin), d.yMax > r && (r = d.yMax);
        continue;
      }
    }
    if (a.type === "candlestick" || a.type === "ohlc") {
      const d = a.rawData ?? a.data;
      for (let m = 0; m < d.length; m++) {
        const p = d[m], y = jn(p) ? p[3] : p.low, g = jn(p) ? p[4] : p.high;
        if (!Number.isFinite(y) || !Number.isFinite(g)) continue;
        const S = Math.min(y, g), A = Math.max(y, g);
        S < i && (i = S), A > r && (r = A);
      }
      continue;
    }
    if (a.type === "band") {
      const d = a.rawData ?? a.data, m = qn(d);
      m && (m.yMin < i && (i = m.yMin), m.yMax > r && (r = m.yMax));
      continue;
    }
    const u = a.data, f = $e(u);
    for (let d = 0; d < f; d++) {
      const m = ht(u, d);
      Number.isFinite(m) && (m < i && (i = m), m > r && (r = m));
    }
  }
  const o = hd(e, t, {
    includeHidden: !1,
    preferRawData: !0
  });
  return o && (o.yMin < i && (i = o.yMin), o.yMax > r && (r = o.yMax)), !Number.isFinite(i) || !Number.isFinite(r) ? { yMin: 0, yMax: 1 } : (i === r && (r = i + 1), { yMin: i, yMax: r });
}, Xf = (e, t, n, i, r) => {
  if (i && i.yMin > 0 && i.yMax > 0 && Number.isFinite(i.yMin) && Number.isFinite(i.yMax))
    return i;
  let o = Number.POSITIVE_INFINITY, s = Number.NEGATIVE_INFINITY;
  const a = r != null && Number.isFinite(r.min) && Number.isFinite(r.max), l = a ? r.min : 0, c = a ? r.max : 0, u = i != null;
  for (let f = 0; f < e.length; f++) {
    const d = e[f];
    if (d.type === "pie" || !ji(d) || d.yAxis !== t) continue;
    if (d.type === "heatmap") {
      const y = d.rawBounds;
      y && y.yMin > 0 && y.yMax > 0 && (y.yMin < o && (o = y.yMin), y.yMax > s && (s = y.yMax));
      continue;
    }
    if (d.type === "candlestick" || d.type === "ohlc") {
      const y = d.rawData ?? d.data;
      for (let g = 0; g < y.length; g++) {
        const S = y[g], A = jn(S) ? S[0] : S.timestamp;
        if (a && Number.isFinite(A) && (A < l || A > c))
          continue;
        const M = jn(S) ? S[3] : S.low, h = jn(S) ? S[4] : S.high;
        if (!Number.isFinite(M) || !Number.isFinite(h)) continue;
        const b = Math.min(M, h), v = Math.max(M, h);
        b > 0 && b < o && (o = b), v > 0 && v > s && (s = v);
      }
      continue;
    }
    if (d.type === "band") {
      const y = d.rawData ?? d.data, g = Kp(y, a ? r : null);
      g && (g.yMin < o && (o = g.yMin), g.yMax > s && (s = g.yMax));
      continue;
    }
    const m = d.rawData ?? d.data, p = Mv(m, a ? r : null);
    p && (p.yMin < o && (o = p.yMin), p.yMax > s && (s = p.yMax));
  }
  if ((!(o > 0) || !(s > 0)) && !(u && a))
    for (let f = 0; f < e.length; f++) {
      const d = e[f];
      if (d.type === "pie" || !ji(d) || d.yAxis !== t) continue;
      const m = (n == null ? void 0 : n[f]) ?? d.rawBounds ?? null;
      m && m.yMin > 0 && m.yMax > 0 && (m.yMin < o && (o = m.yMin), m.yMax > s && (s = m.yMax));
    }
  return !(o > 0) || !(s > 0) || !Number.isFinite(o) || !Number.isFinite(s) ? { yMin: 1, yMax: 10 } : (o === s && (s = o * 10), { yMin: o, yMax: s });
}, Vf = (e) => {
  let t = Number.POSITIVE_INFINITY, n = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < e.length; i++) {
    const r = e[i];
    if (r.type === "pie" || r.type === "candlestick" || r.type === "ohlc" || !ji(r)) continue;
    if (r.type === "heatmap") {
      const a = r.rawBounds;
      a && a.xMin > 0 && a.xMax > 0 && (a.xMin < t && (t = a.xMin), a.xMax > n && (n = a.xMax));
      continue;
    }
    if (r.type === "band") {
      const a = r.rawData ?? r.data, l = yn(a);
      for (let c = 0; c < l; c++) {
        const u = Wl(a, c);
        !Number.isFinite(u) || !(u > 0) || (u < t && (t = u), u > n && (n = u));
      }
      continue;
    }
    if (r.type !== "line" && r.type !== "area" && r.type !== "bar" && r.type !== "scatter")
      continue;
    const o = r.rawData ?? r.data, s = $e(o);
    for (let a = 0; a < s; a++) {
      const l = Te(o, a);
      !Number.isFinite(l) || !(l > 0) || (l < t && (t = l), l > n && (n = l));
    }
  }
  return !(t > 0) || !(n > 0) || !Number.isFinite(t) || !Number.isFinite(n) ? { xMin: Number.NaN, xMax: Number.NaN } : { xMin: t, xMax: n };
}, co = (e, t) => {
  const n = pi(e.xAxis.min), i = pi(e.xAxis.max), r = e.xAxis.type === "log", o = e.xAxis.logBase ?? 10;
  if (n !== void 0 && i !== void 0) {
    const c = Po(n, i);
    if (!r) return c;
    const u = Vf(e.series);
    return Xi(c.min, c.max, {
      base: o,
      positiveDataMin: u.xMin > 0 ? u.xMin : void 0,
      warn: !0,
      warnKey: "x"
    });
  }
  const s = vN(e.series, t);
  let a = n ?? s.xMin, l = i ?? s.xMax;
  if (r) {
    const c = Vf(e.series);
    return (!(a > 0) || !(l > 0)) && c.xMin > 0 && c.xMax > 0 && (a = n ?? c.xMin, l = i ?? c.xMax), Xi(a, l, {
      base: o,
      positiveDataMin: c.xMin > 0 ? c.xMin : void 0,
      warn: !0,
      warnKey: "x"
    });
  }
  return Po(a, l);
}, wN = (e, t, n) => {
  let i = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  const o = n != null && Number.isFinite(n.min) && Number.isFinite(n.max), s = o ? n.min : 0, a = o ? n.max : 0;
  for (let c = 0; c < e.length; c++) {
    const u = e[c];
    if (u.type === "pie" || !ji(u) || u.yAxis !== t) continue;
    if (u.type === "heatmap") {
      const d = u.rawBounds;
      d && Number.isFinite(d.yMin) && Number.isFinite(d.yMax) && (!o || Number.isFinite(d.xMin) && Number.isFinite(d.xMax) && d.xMax >= s && d.xMin <= a) && (d.yMin < i && (i = d.yMin), d.yMax > r && (r = d.yMax));
      continue;
    }
    if (u.type === "band") {
      const d = Zp(u.data, n);
      d && (d.yMin < i && (i = d.yMin), d.yMax > r && (r = d.yMax));
      continue;
    }
    if (u.type === "candlestick" || u.type === "ohlc") {
      const d = u.data;
      for (let m = 0; m < d.length; m++) {
        const p = d[m], y = jn(p) ? p[0] : p.timestamp;
        if (o && Number.isFinite(y) && (y < s || y > a))
          continue;
        const g = jn(p) ? p[3] : p.low, S = jn(p) ? p[4] : p.high;
        if (!Number.isFinite(g) || !Number.isFinite(S)) continue;
        const A = Math.min(g, S), M = Math.max(g, S);
        A < i && (i = A), M > r && (r = M);
      }
      continue;
    }
    const f = Nv(u.data, n);
    f && (f.yMin < i && (i = f.yMin), f.yMax > r && (r = f.yMax));
  }
  const l = hd(e, t, {
    includeHidden: !1,
    xWindow: o ? n : null
  });
  return l && (l.yMin < i && (i = l.yMin), l.yMax > r && (r = l.yMax)), !Number.isFinite(i) || !Number.isFinite(r) || i === Number.POSITIVE_INFINITY ? { yMin: 0, yMax: 1 } : (i === r && (r = i + 1), { yMin: i, yMax: r });
}, hl = (e, t, n, i, r) => {
  const o = e.yAxes.find((p) => p.id === t) || e.yAxes[0], s = pi(o.min), a = pi(o.max), l = o.type === "log", c = o.logBase ?? 10;
  if (s !== void 0 && a !== void 0) {
    const p = Po(s, a);
    if (!l) return p;
    const y = Xf(
      e.series,
      t,
      n,
      i,
      r
    );
    return Xi(p.min, p.max, {
      base: c,
      positiveDataMin: y.yMin > 0 ? y.yMin : void 0,
      warn: !0,
      warnKey: `y:${t}`
    });
  }
  const u = o.autoBounds ?? "visible";
  let f;
  u === "visible" && i ? f = i : f = Dm(e.series, t, n);
  let d = s ?? f.yMin, m = a ?? f.yMax;
  if (l) {
    const p = Xf(
      e.series,
      t,
      n,
      i,
      r
    );
    return (!(d > 0) || !(m > 0)) && (d = s ?? p.yMin, m = a ?? p.yMax), Xi(d, m, {
      base: c,
      positiveDataMin: p.yMin > 0 ? p.yMin : void 0,
      warn: !0,
      warnKey: `y:${t}`
    });
  }
  return Po(d, m);
}, _i = (e, t) => {
  if (!t) return { ...e, spanFraction: 1 };
  const n = e.max - e.min;
  if (!Number.isFinite(n) || n === 0) return { ...e, spanFraction: 1 };
  const i = t.start, r = t.end, o = e.min + i / 100 * n, s = e.min + r / 100 * n, a = Po(o, s), l = (r - i) / 100, c = Number.isFinite(l) ? Math.max(0, Math.min(1, l)) : 1;
  return { min: a.min, max: a.max, spanFraction: c };
}, NN = (e, t, n) => {
  const i = mn(n);
  if (i >= 1) return e;
  const r = e.invert(t.bottom), o = e.invert(t.top), s = Math.min(r, o), a = Math.max(r, o), l = {
    kind: e.kind,
    base: e.base,
    domain(c, u) {
      return e.domain(c, u), l;
    },
    range(c, u) {
      return e.range(c, u), l;
    },
    getDomain() {
      return e.getDomain();
    },
    getRange() {
      return e.getRange();
    },
    scale(c) {
      const u = dy(c, s, a, i);
      return e.scale(u);
    },
    invert(c) {
      return e.invert(c);
    }
  };
  return l;
}, km = (e) => iy(e, _w), MN = (e) => km(e), SN = (e) => km(e), yl = ys;
function CN(e, t, n) {
  var sc, ac, lc;
  if (!e.initialized)
    throw new Error("RenderCoordinator: gpuContext must be initialized.");
  const i = e.device;
  if (!i)
    throw new Error("RenderCoordinator: gpuContext.device is required.");
  if (!e.canvas)
    throw new Error("RenderCoordinator: gpuContext.canvas is required.");
  if (!e.canvasContext)
    throw new Error("RenderCoordinator: gpuContext.canvasContext is required.");
  const r = e.preferredFormat ?? pN, o = n == null ? void 0 : n.pipelineCache, s = typeof t.devicePixelRatio == "number" && Number.isFinite(t.devicePixelRatio) && t.devicePixelRatio > 0 ? t.devicePixelRatio : void 0, a = s != null ? { devicePixelRatio: s } : void 0, l = Pr(e.canvas) ? e.canvas.parentElement : null, c = l ? Rf(l, a) : null, u = l ? Rf(l, { clip: !0, ...a }) : null, f = (Y, ce) => {
    if (y) return;
    const V = g.series;
    if (Y < 0 || Y >= V.length) return;
    const J = V[Y];
    if (!J) return;
    if (ce !== void 0 && J.type === "pie") {
      const me = J.data;
      if (ce < 0 || ce >= me.length) return;
      const lt = me.map(
        (vt, Wt) => Wt === ce ? { ...vt, visible: vt.visible === !1 } : vt
      ), it = V.map(
        (vt, Wt) => Wt === Y ? { ...vt, data: lt } : vt
      );
      fa({ ...g, series: it });
      return;
    }
    const oe = V.map(
      (me, lt) => lt === Y ? {
        ...me,
        visible: me.visible === !1
      } : me
    );
    fa({ ...g, series: oe });
  }, d = l && ((sc = t.legend) == null ? void 0 : sc.show) !== !1 ? Tw(l, (ac = t.legend) == null ? void 0 : ac.position, f) : null, m = (() => {
    if (typeof document > "u")
      return null;
    try {
      return document.createElement("canvas").getContext("2d");
    } catch {
      return null;
    }
  })(), p = m ? /* @__PURE__ */ new Map() : null;
  let y = !1, g = t, S = t.series.length, A = "pending", M = 0;
  const h = _f();
  let b = null, v = !1;
  const x = _f();
  let F = null, I = 1, R = null;
  const T = {
    cartesianDataBySeriesIndex: [],
    pieDataBySeriesIndex: []
  }, N = () => {
    T.cartesianDataBySeriesIndex.length = 0, T.pieDataBySeriesIndex.length = 0;
  }, w = (Y, ce, V, J, oe) => ly(Y, ce, J, oe), P = (Y, ce, V, J) => uy(Y, ce, V, J), B = (Y, ce, V, J) => {
    if (Y.length !== ce.length) return ce;
    const oe = new Array(ce.length);
    for (let me = 0; me < ce.length; me++) {
      const lt = Y[me], it = ce[me];
      if (lt.type !== it.type) {
        oe[me] = it;
        continue;
      }
      if (it.type === "pie") {
        const Yn = (J == null ? void 0 : J.pieDataBySeriesIndex[me]) ?? null, Kn = P(
          lt,
          it,
          V,
          Yn
        );
        J && (J.pieDataBySeriesIndex[me] = Kn.data), oe[me] = Kn;
        continue;
      }
      if (oy(it.type)) {
        oe[me] = it;
        continue;
      }
      const vt = lt.data, Wt = it.data, Et = $e(vt), Ft = $e(Wt);
      if (Et !== Ft) {
        oe[me] = it;
        continue;
      }
      if (Ft > gN) {
        oe[me] = it;
        continue;
      }
      const gn = (J == null ? void 0 : J.cartesianDataBySeriesIndex[me]) ?? null, In = w(vt, Wt, Et, V, gn);
      if (!In) {
        oe[me] = it;
        continue;
      }
      J && (J.cartesianDataBySeriesIndex[me] = In), oe[me] = cy(it, In);
    }
    return oe;
  }, _ = (Y, ce, V) => {
    let J = g.xAxis.type === "log" ? Ho(Y.from.xBaseDomain, Y.to.xBaseDomain, ce) : ho(Y.from.xBaseDomain, Y.to.xBaseDomain, ce);
    g.xAxis.type === "log" && (J = Xi(J.min, J.max, {
      base: g.xAxis.logBase ?? 10,
      warn: !1
    }));
    const oe = _i(J, V), me = /* @__PURE__ */ new Map();
    for (const it of Y.from.series[0] ? g.yAxes : []) {
      const vt = it.id, Wt = Y.from.yBaseDomains.get(vt) || { min: 0, max: 1 }, Et = Y.to.yBaseDomains.get(vt) || { min: 0, max: 1 };
      if (it.type === "log") {
        const Ft = Ho(Wt, Et, ce);
        me.set(vt, Xi(Ft.min, Ft.max, { base: it.logBase ?? 10, warn: !1 }));
      } else
        me.set(vt, ho(Wt, Et, ce));
    }
    const lt = B(Y.from.series, Y.to.series, ce, null);
    return {
      xBaseDomain: J,
      xVisibleDomain: { min: oe.min, max: oe.max },
      yBaseDomains: me,
      series: lt
    };
  }, C = /* @__PURE__ */ new Set(), E = /* @__PURE__ */ new Set(), U = /* @__PURE__ */ new Set();
  let G = new Array(
    t.series.length
  ).fill(null), O = new Array(t.series.length).fill(null);
  const D = new Array(t.series.length).fill(null), k = new Array(t.series.length).fill(null), W = new Array(t.series.length).fill(
    null
  );
  let j = g.series, ee = g.series, fe = /* @__PURE__ */ new Map(), X = null;
  const z = /* @__PURE__ */ new Map(), $ = /* @__PURE__ */ new Map();
  let Z = !1, Q = 0, K = null;
  function ne(Y, ce) {
    const V = (ce == null ? void 0 : ce.dataXDomain) ?? co(g, O);
    if (ce != null && ce.updateTransitionActive)
      return Y === "paint" && (X = null), V;
    const J = pi(g.xAxis.min), oe = pi(g.xAxis.max), me = yv(g.autoScroll, J, oe);
    if (Y === "paint") {
      if (me)
        return X = null, V;
      if (g.xAxis.type === "log") {
        const it = gm(
          V,
          X,
          g.xAxis.logBase ?? 10,
          cf
        );
        return X = it, it;
      }
      const lt = Zl(V, X, cf);
      return X = lt, lt;
    }
    return gv(V, X, { skipSticky: me });
  }
  const L = (Y, ce) => {
    const V = Y.yAxes.find((lt) => lt.id === ce) || Y.yAxes[0];
    if ((V.autoBounds ?? "visible") !== "visible") return !1;
    const oe = pi(V.min), me = pi(V.max);
    return !(oe !== void 0 && me !== void 0);
  }, le = () => {
    fe.clear();
    const Y = (Bt == null ? void 0 : Bt.getRange()) ?? null, ce = pf(Y), V = j.length > 0 ? j : g.series;
    let J = null;
    if (!ce && Y) {
      const oe = ne("read"), me = _i(oe, Y);
      J = { min: me.min, max: me.max };
    }
    K = J;
    for (const oe of g.yAxes)
      L(g, oe.id) && (ce ? fe.set(
        oe.id,
        Dm(V, oe.id, O)
      ) : fe.set(oe.id, wN(ee, oe.id, J)));
  };
  let se = [], ae = !1, de = null, re = null, ie = !1, be = !1;
  const te = /* @__PURE__ */ new Map();
  let Be = new Array(g.series.length).fill("unknown");
  const Me = /* @__PURE__ */ new Set(), _e = /* @__PURE__ */ new Map(), Le = xg(), ge = Ng(), Ee = ug(), Se = ng();
  let ve = l && ((lc = g.tooltip) == null ? void 0 : lc.show) !== !1 ? Lf(l) : null, xe = l ? Uf(l) : null, Pe = !1;
  const Oe = (Y) => {
    Pe || (Pe = !0, console.warn(Y));
  };
  let Xe = xe ? Hf({
    setCountdown: (Y) => {
      xe == null || xe.setCountdown(Y);
    }
  }) : null;
  const Ze = () => {
    Xe == null || Xe.dispose(), Xe = null;
  }, ze = () => xe ? (Xe || (Xe = Hf({
    setCountdown: (Y) => {
      xe == null || xe.setCountdown(Y);
    }
  })), Xe) : (Ze(), null), Ue = () => {
    const Y = ze();
    if (!Y) return;
    const ce = cN(g.series, {
      onWarn: Oe
    });
    Y.setDesired(ce);
  }, Ae = zw(), Qe = Kl, At = fw();
  let It = Number.NEGATIVE_INFINITY, Tt = null;
  const Ot = () => {
    Tt !== null && (clearTimeout(Tt), Tt = null);
  }, Ht = (Y) => {
    if (Tt !== null) return;
    const ce = Math.max(0, Y);
    Tt = setTimeout(() => {
      Tt = null, Je();
    }, ce);
  }, xt = (Y, ce, V, J) => {
    ve == null || ve.show(Y, ce, V);
  }, $t = () => {
    ve == null || ve.hide();
  }, Mt = () => {
    Of(Ae), $t();
  };
  ((Y, ce) => {
    d == null || d.update(Y, ce);
  })(g.series, g.theme);
  let Ie = M0(i), ke = "", Ke = "", at = 0, yt = 0;
  const mt = g.antialias === !1 ? 1 : uv, nt = g.antialias === !1 ? 1 : fv, ct = Ru(i, {
    targetFormat: r,
    sampleCount: mt,
    pipelineCache: o
  }), je = mt > 1 ? Ru(i, {
    targetFormat: r,
    sampleCount: 1,
    pipelineCache: o
  }) : null, pt = Za(i, {
    targetFormat: r,
    sampleCount: nt,
    pipelineCache: o
  }), St = /* @__PURE__ */ new Map(), Zt = zv(i, {
    targetFormat: r,
    sampleCount: nt,
    pipelineCache: o
  });
  Zt.setVisible(!1);
  const Ge = Xv(i, {
    targetFormat: r,
    sampleCount: nt,
    pipelineCache: o
  });
  Ge.setVisible(!1);
  const Ye = nt > 1 ? Za(i, { targetFormat: r, sampleCount: 1, pipelineCache: o }) : null, rt = /* @__PURE__ */ new Map(), bt = bf(i, {
    targetFormat: r,
    sampleCount: mt,
    pipelineCache: o
  }), Dt = Nf(i, {
    targetFormat: r,
    sampleCount: mt,
    pipelineCache: o
  }), wt = bf(i, {
    targetFormat: r,
    sampleCount: nt,
    pipelineCache: o
  }), Yt = Nf(i, {
    targetFormat: r,
    sampleCount: nt,
    pipelineCache: o
  }), en = dv({
    device: i,
    targetFormat: r,
    pipelineCache: o,
    sampleCount: mt
  }), H = su(e, g), q = Pr(e.canvas) ? Jv(e.canvas, H) : null;
  let ue = Yw(), he = null, Fe;
  const et = Kw();
  let pe = null;
  const Ne = (Y, ce) => {
    const V = Zw(Y);
    Jw(he, Fe, V, ce) && (he = V, Fe = ce, et.emit(he, Fe));
  }, Je = () => {
    var Y;
    (Y = n == null ? void 0 : n.onRequestRender) == null || Y.call(n);
  }, We = (Y) => pf(Y), ut = () => {
    de !== null && (cancelAnimationFrame(de), de = null), re !== null && (clearTimeout(re), re = null), ae = !1;
  }, st = E0(
    () => ({
      pendingAppendByIndex: te,
      appendedGpuThisFrame: Me,
      zoomState: Bt,
      currentOptions: g,
      dataStore: Ie,
      runtimeRawDataByIndex: G,
      runtimeRawBoundsByIndex: O,
      gpuSeriesKindByIndex: Be,
      lastSetSeriesCache: _e,
      filterGapsCache: Ee,
      invalidateStackedMountainCache: () => Tr(Le),
      invalidateStepExpandCache: () => no(ge),
      lastSampledData: se,
      warnedSamplingDefeatsFastPath: E,
      recomputeRuntimeBaseSeries: Do,
      recomputeCachedVisibleYBoundsIfNeeded: le,
      ensureMutableRuntimeColumns: Hm,
      isOwnedMutableColumns: nc,
      brandOwnedColumns: Fs,
      computeBaseXDomain: co,
      computeVisibleXDomain: _i,
      isFullSpanZoomRange: We,
      computeEffectiveZoomSpanConstraints: ca,
      extendBoundsWithCartesianData: bN,
      extendBoundsWithOHLCDataPoints: ml,
      canRangedAppendLine: C0,
      isGpuDecimationEligible: To,
      normalizeMaxPoints: bi,
      planMaxPointsWindow: yi,
      getPointCount: $e,
      getX: Te,
      getY: ht,
      getSize: Sn,
      createRingXYColumns: yo,
      appendIntoRingXY: ud,
      dropPrefixXY: fd,
      createStagingRingView: Pp,
      isRingXYColumns: hn,
      isStagingRingView: bn,
      demoteStagingViewAfterRebindFailure: j0,
      computeRawBoundsFromCartesianData: Rn,
      get runtimeBaseSeries() {
        return j;
      },
      set runtimeBaseSeries(Y) {
        j = Y;
      },
      get renderSeries() {
        return ee;
      },
      set renderSeries(Y) {
        ee = Y;
      },
      get pendingZoomSourceKind() {
        return Hn;
      },
      set pendingZoomSourceKind(Y) {
        Hn = Y;
      }
    })
  ), Ut = (Y) => {
    if (y) return;
    const ce = (Y == null ? void 0 : Y.requestRenderAfter) ?? !0, V = st(), J = (Bt == null ? void 0 : Bt.getRange()) ?? null, oe = We(J), me = J != null && !oe;
    let lt = !1;
    ie ? (ie = !1, !J || oe ? (ee = j, le()) : qr(), lt = !0) : V && me && (ie = !1, qr(), lt = !0), (V || lt) && ce && Je();
  }, ye = (Y) => {
    y || ae && !(Y != null && Y.immediate) || (de !== null && (cancelAnimationFrame(de), de = null), re !== null && (clearTimeout(re), re = null), ae = !0, de = requestAnimationFrame(() => {
      if (de = null, y) {
        ut();
        return;
      }
      re !== null && (clearTimeout(re), re = null), ae = !1, Ut();
    }), re = (typeof self < "u" ? self : window).setTimeout(() => {
      if (y) {
        ut();
        return;
      }
      ae && (de !== null && (cancelAnimationFrame(de), de = null), ae = !1, re = null, Ut());
    }, 16));
  }, Ce = () => {
    if (y) return;
    const Y = { zoomResampleDue: ie };
    q0($0(), Y, ye), ie = Y.zoomResampleDue;
  }, tt = (Y, ce) => {
    const V = Y.clientWidth, J = Y.clientHeight;
    if (!(V > 0) || !(J > 0)) return null;
    const oe = V - ce.left - ce.right, me = J - ce.top - ce.bottom;
    return !(oe > 0) || !(me > 0) ? null : { plotWidthCss: oe, plotHeightCss: me };
  }, Ve = (Y, ce) => {
    const V = e.canvas;
    if (!V) return null;
    const J = tt(V, Y);
    if (!J) return null;
    const oe = Pi(g.xAxis).domain(ce.xDomain.min, ce.xDomain.max).range(0, J.plotWidthCss), me = /* @__PURE__ */ new Map();
    for (const [lt, it] of ce.yDomains) {
      const vt = g.yAxes.find((Wt) => Wt.id === lt) ?? g.yAxes[0];
      me.set(lt, Pi(vt).domain(it.min, it.max).range(J.plotHeightCss, 0));
    }
    return {
      xScale: oe,
      yScales: me,
      plotWidthCss: J.plotWidthCss,
      plotHeightCss: J.plotHeightCss
    };
  }, dt = (Y, ce, V, J) => {
    var Wt, Et;
    const oe = g.series[Y], { x: me, y: lt } = Zd(V);
    if ((oe == null ? void 0 : oe.type) === "band") {
      const Ft = cn(oe.data, ce), gn = Ft && Number.isFinite(Ft.y1) ? Ft.y1 : void 0, In = Ft && Number.isFinite(Ft.y) ? Ft.y : lt, Yn = gn !== void 0 && Number.isFinite(In) ? (In + gn) / 2 : void 0, Kn = gn !== void 0 && Number.isFinite(In) ? Math.abs(gn - In) : void 0;
      return {
        seriesName: (oe == null ? void 0 : oe.name) ?? "",
        seriesIndex: Y,
        dataIndex: ce,
        value: [me, In],
        color: (oe == null ? void 0 : oe.color) ?? "#888",
        ...gn !== void 0 ? { y1: gn } : {},
        ...Yn !== void 0 ? { yMid: Yn } : {},
        ...Kn !== void 0 ? { yRange: Kn } : {}
      };
    }
    if ((oe == null ? void 0 : oe.type) === "errorBar") {
      const Ft = kn(oe.data, ce), gn = Ft && Number.isFinite(Ft.y) ? Ft.y : lt, In = Ft && Number.isFinite(Ft.high) ? Ft.high : void 0, Yn = Ft && Number.isFinite(Ft.low) ? Ft.low : void 0, Kn = In !== void 0 && Number.isFinite(gn) ? In - gn : void 0, pr = Yn !== void 0 && Number.isFinite(gn) ? gn - Yn : void 0;
      return {
        seriesName: (oe == null ? void 0 : oe.name) ?? "",
        seriesIndex: Y,
        dataIndex: ce,
        value: [Ft && Number.isFinite(Ft.x) ? Ft.x : me, gn],
        color: ((Wt = oe.itemStyle) == null ? void 0 : Wt.color) ?? oe.color ?? "#888",
        ...In !== void 0 ? { high: In } : {},
        ...Yn !== void 0 ? { low: Yn } : {},
        ...Kn !== void 0 ? { yErrorHigh: Kn } : {},
        ...pr !== void 0 ? { yErrorLow: pr } : {}
      };
    }
    if ((oe == null ? void 0 : oe.type) === "impulse") {
      const Ft = typeof oe.baseline == "number" && Number.isFinite(oe.baseline) ? oe.baseline : 0;
      return {
        seriesName: (oe == null ? void 0 : oe.name) ?? "",
        seriesIndex: Y,
        dataIndex: ce,
        value: [me, lt],
        color: ((Et = oe.lineStyle) == null ? void 0 : Et.color) ?? oe.color ?? "#888",
        baseline: Ft
      };
    }
    const it = (J == null ? void 0 : J.stack) ?? (typeof (oe == null ? void 0 : oe.stack) == "string" ? oe.stack : void 0), vt = J == null ? void 0 : J.stackTotal;
    return {
      seriesName: (oe == null ? void 0 : oe.name) ?? "",
      seriesIndex: Y,
      dataIndex: ce,
      value: [me, lt],
      color: (oe == null ? void 0 : oe.color) ?? "#888",
      ...it != null && it !== "" ? { stack: it } : {},
      ...typeof vt == "number" && Number.isFinite(vt) ? { stackTotal: vt } : {}
    };
  }, ft = (Y, ce, V) => {
    var it;
    const J = g.series[Y], oe = Number.isFinite(V.high) && Number.isFinite(V.y) ? V.high - V.y : void 0, me = Number.isFinite(V.low) && Number.isFinite(V.y) ? V.y - V.low : void 0, lt = J && J.type === "errorBar" ? ((it = J.itemStyle) == null ? void 0 : it.color) ?? J.color ?? "#888" : (J == null ? void 0 : J.color) ?? "#888";
    return {
      seriesName: (J == null ? void 0 : J.name) ?? "",
      seriesIndex: Y,
      dataIndex: ce,
      value: [V.x, V.y],
      color: lt,
      high: V.high,
      low: V.low,
      ...oe !== void 0 ? { yErrorHigh: oe } : {},
      ...me !== void 0 ? { yErrorLow: me } : {}
    };
  }, gt = (Y, ce, V, J) => {
    for (let oe = Y.length - 1; oe >= 0; oe--) {
      const me = Y[oe];
      if (me.type !== "errorBar" || me.visible === !1) continue;
      const lt = J.yScales.get(me.yAxis || "y") ?? J.yScales.values().next().value;
      if (!lt) continue;
      const it = vm([{ seriesIndex: oe, series: me }], ce, V, J.xScale, lt, {
        width: J.plotWidthCss,
        height: J.plotHeightCss
      });
      if (it)
        return {
          params: ft(it.seriesIndex, it.dataIndex, it.point),
          seriesIndex: it.seriesIndex
        };
    }
    return null;
  }, kt = (Y, ce, V) => {
    var me;
    const J = g.series[Y], oe = J && J.type === "impulse" ? ((me = J.lineStyle) == null ? void 0 : me.color) ?? J.color ?? "#888" : (J == null ? void 0 : J.color) ?? "#888";
    return {
      seriesName: (J == null ? void 0 : J.name) ?? "",
      seriesIndex: Y,
      dataIndex: ce,
      value: [V.x, V.y],
      color: oe,
      baseline: V.baseline
    };
  }, tn = (Y, ce, V, J) => {
    for (let oe = Y.length - 1; oe >= 0; oe--) {
      const me = Y[oe];
      if (me.type !== "impulse" || me.visible === !1) continue;
      const lt = J.yScales.get(me.yAxis || "y") ?? J.yScales.values().next().value;
      if (!lt) continue;
      const it = wm([{ seriesIndex: oe, series: me }], ce, V, J.xScale, lt, {
        width: J.plotWidthCss,
        height: J.plotHeightCss
      });
      if (it)
        return {
          params: kt(it.seriesIndex, it.dataIndex, {
            x: it.x,
            y: it.y,
            baseline: it.baseline
          }),
          seriesIndex: it.seriesIndex
        };
    }
    return null;
  }, qt = (Y, ce, V) => {
    const J = g.series[Y];
    return Gw(V) ? jn(V) ? {
      seriesName: (J == null ? void 0 : J.name) ?? "",
      seriesIndex: Y,
      dataIndex: ce,
      value: [V[0], V[1], V[2], V[3], V[4]],
      color: (J == null ? void 0 : J.color) ?? "#888"
    } : {
      seriesName: (J == null ? void 0 : J.name) ?? "",
      seriesIndex: Y,
      dataIndex: ce,
      value: [V.timestamp, V.open, V.close, V.low, V.high],
      color: (J == null ? void 0 : J.color) ?? "#888"
    } : {
      seriesName: (J == null ? void 0 : J.name) ?? "",
      seriesIndex: Y,
      dataIndex: ce,
      value: [0, 0, 0, 0, 0],
      color: (J == null ? void 0 : J.color) ?? "#888"
    };
  }, ot = (Y, ce, V, J, oe) => {
    const me = 0.5 * Math.min(J, oe);
    if (!(me > 0)) return null;
    for (let lt = Y.length - 1; lt >= 0; lt--) {
      const it = Y[lt];
      if (it.type !== "pie" || it.visible === !1) continue;
      const vt = it, Wt = Ny(vt.center, J, oe), Et = Jd(vt.radius, me), Ft = Ul(ce, V, { seriesIndex: lt, series: vt }, Wt, Et);
      if (Ft) return Ft;
    }
    return null;
  }, _t = (Y, ce, V, J) => {
    const oe = J.xScale.invert(ce);
    if (!Number.isFinite(oe)) return null;
    for (let me = Y.length - 1; me >= 0; me--) {
      const lt = Y[me];
      if (lt.type !== "heatmap") continue;
      const it = lt, vt = J.yScales.get(it.yAxis || "y") ?? J.yScales.values().next().value;
      if (!vt) continue;
      const Wt = vt.invert(V), Et = Cw(it, me, oe, Wt);
      if (Et) return Et;
    }
    return null;
  }, He = (Y, ce, V, J) => {
    for (let oe = Y.length - 1; oe >= 0; oe--) {
      const me = Y[oe];
      if (!(me.type === "candlestick" || me.type === "ohlc") || me.visible === !1) continue;
      const lt = me, it = typeof me.yAxis == "string" && me.yAxis || (J.yScales.has("price") ? "price" : "y"), vt = J.yScales.get(it) ?? J.yScales.get("price") ?? J.yScales.get("y") ?? J.yScales.values().next().value;
      if (!vt) continue;
      const Wt = El(
        lt,
        lt.data,
        J.xScale,
        J.plotWidthCss
      ), Et = Ll(
        [lt],
        ce,
        V,
        J.xScale,
        vt,
        Wt,
        // OHLC bars: hit stem [low, high] (same as ChartGPU.hitTest). Candles stay body-only.
        { yHitMode: me.type === "ohlc" ? "lowHigh" : "openClose" }
      );
      if (!Et) continue;
      return { params: qt(oe, Et.dataIndex, Et.point), match: { point: Et.point, yAxisId: it }, seriesIndex: oe };
    }
    return null;
  }, Ct = (Y) => {
    if (ue = Ww(Y.x, Y.y, Y.gridX, Y.gridY, Y.isInGrid), Y.isInGrid && pe) {
      const ce = pe.xScale.invert(Y.gridX);
      Ne(Number.isFinite(ce) ? ce : null, "mouse");
    } else Y.isInGrid || Ne(null, "mouse");
    Zt.setVisible(Y.isInGrid), Je();
  }, ln = (Y) => {
    ue.source === "mouse" && (ue = Xw(ue), Zt.setVisible(!1), Mt(), Ne(null, "mouse"), Je());
  };
  q && (q.on("mousemove", Ct), q.on("mouseleave", ln));
  let Bt = null, Kt = null, An = null, Nn = null, Hn;
  const Ro = /* @__PURE__ */ new Set(), _m = (Y, ce) => {
    const V = Array.from(Ro);
    for (const J of V) J(Y, ce);
  }, zm = (Y) => {
    var lt, it;
    const ce = (lt = Y.dataZoom) == null ? void 0 : lt.find((vt) => (vt == null ? void 0 : vt.type) === "inside"), V = (it = Y.dataZoom) == null ? void 0 : it.find((vt) => (vt == null ? void 0 : vt.type) === "slider"), J = ce ?? V;
    if (!J) return null;
    const oe = Number.isFinite(J.start) ? J.start : 0, me = Number.isFinite(J.end) ? J.end : 100;
    return { start: oe, end: me, hasInside: !!ce };
  }, $r = (Y) => Math.min(100, Math.max(0, Y)), Gm = (Y) => {
    let ce = null, V = null;
    const J = Y.dataZoom ?? [];
    for (const oe of J)
      if (oe && !(oe.type !== "inside" && oe.type !== "slider")) {
        if (Number.isFinite(oe.minSpan)) {
          const me = $r(oe.minSpan);
          ce = ce == null ? me : Math.max(ce, me);
        }
        if (Number.isFinite(oe.maxSpan)) {
          const me = $r(oe.maxSpan);
          V = V == null ? me : Math.min(V, me);
        }
      }
    return { minSpan: ce ?? void 0, maxSpan: V ?? void 0 };
  }, Om = () => {
    if (g.xAxis.type === "category") return null;
    let Y = 0;
    for (let V = 0; V < g.series.length; V++) {
      const J = g.series[V];
      if (J.type === "pie") continue;
      if (J.type === "heatmap") {
        Y = Math.max(Y, J.data.columns * J.data.rows);
        continue;
      }
      if (J.type === "band") {
        const lt = G[V] ?? J.rawData ?? J.data;
        Y = Math.max(Y, yn(lt));
        continue;
      }
      if (J.type === "candlestick" || J.type === "ohlc") {
        const lt = G[V] ?? J.rawData ?? J.data;
        Y = Math.max(Y, lt.length);
        continue;
      }
      if (!ji(J) || J.type !== "line" && J.type !== "area" && J.type !== "bar" && J.type !== "scatter")
        continue;
      const oe = G[V], me = $e(oe || (J.rawData ?? J.data));
      Y = Math.max(Y, me);
    }
    if (Y < 2) return null;
    const ce = 100 / (Y - 1);
    return Number.isFinite(ce) ? $r(ce) : null;
  }, ca = () => {
    const Y = Gm(g), ce = Om(), V = Number.isFinite(Y.minSpan) ? $r(Y.minSpan) : ce ?? 0.5, J = Number.isFinite(Y.maxSpan) ? $r(Y.maxSpan) : 100;
    return { minSpan: V, maxSpan: J };
  }, ua = () => {
    var ce;
    const Y = zm(g);
    if (!Y) {
      Kt == null || Kt.dispose(), Kt = null, An == null || An(), An = null, Bt = null, Nn = null;
      return;
    }
    if (Bt) {
      const V = ca(), J = Bt;
      (ce = J.setSpanConstraints) == null || ce.call(J, V.minSpan, V.maxSpan), (Nn == null || Nn.start !== Y.start || Nn.end !== Y.end) && (Bt.setRange(Y.start, Y.end), Nn = { start: Y.start, end: Y.end });
    } else {
      const V = ca();
      Bt = lw(Y.start, Y.end, V), Nn = { start: Y.start, end: Y.end }, An = Bt.onChange((J) => {
        be = !0, Je(), Ce();
        const oe = Hn;
        _m({ start: J.start, end: J.end }, oe), Hn = void 0;
      });
    }
    Y.hasInside && q ? Kt || (Kt = rw(q, Bt), Kt.enable()) : (Kt == null || Kt.dispose(), Kt = null);
  }, tc = () => {
    const Y = g.series.length;
    G = new Array(Y).fill(null), O = new Array(Y).fill(null), te.clear(), _e.clear(), Ee.clear(), Tr(Le), no(ge);
    for (let ce = 0; ce < Y; ce++) {
      const V = g.series[ce];
      if (V.type === "pie") continue;
      if (V.type === "heatmap") {
        G[ce] = null, O[ce] = V.rawBounds ?? null;
        continue;
      }
      if (V.type === "band") {
        const oe = V.rawData ?? V.data;
        G[ce] = ui(go(oe)), O[ce] = V.rawBounds ?? qn(oe) ?? null;
        continue;
      }
      if (V.type === "candlestick" || V.type === "ohlc") {
        const oe = V.rawData ?? V.data, me = oe.length === 0 ? [] : oe.slice();
        G[ce] = me, O[ce] = V.rawBounds ?? null;
        continue;
      }
      if (!ji(V)) {
        G[ce] = null, O[ce] = null;
        continue;
      }
      if (V.type !== "line" && V.type !== "area" && V.type !== "bar" && V.type !== "scatter" && V.type !== "impulse" && V.type !== "errorBar") {
        G[ce] = null, O[ce] = null;
        continue;
      }
      if (V.type === "errorBar") {
        G[ce] = null, O[ce] = V.rawBounds ?? null;
        continue;
      }
      const J = V.rawData ?? V.data;
      if (G[ce] = J, V.type === "impulse") {
        const oe = typeof V.baseline == "number" && Number.isFinite(V.baseline) ? V.baseline : 0;
        O[ce] = V.rawBounds ?? Gr(J, oe);
      } else
        O[ce] = V.rawBounds ?? Rn(J);
    }
  }, nc = (Y) => Y == null || typeof Y != "object" || Array.isArray(Y) || hn(Y) ? !1 : Y[Rm] === !0, Hm = (Y, ce) => {
    const V = G[Y];
    if (hn(V) || nc(V)) return V;
    if (bn(V)) {
      const lt = cd(V);
      return G[Y] = lt, O[Y] == null && (O[Y] = Rn(
        lt
      )), lt;
    }
    const J = ce, oe = V ?? J.rawData ?? J.data, me = xN(oe);
    return G[Y] = me, O[Y] == null && (O[Y] = J.rawBounds ?? Rn(oe)), me;
  }, Do = () => {
    j = I0(g.series, G, O);
  };
  function Ym() {
    const Y = (Bt == null ? void 0 : Bt.getRange()) ?? null, ce = ne("read"), V = _i(ce, Y);
    if (We(Y)) {
      ee = j, le();
      return;
    }
    const J = new Array(j.length);
    for (let oe = 0; oe < j.length; oe++) {
      const me = j[oe];
      if (me.type === "pie" || me.type === "heatmap" || me.type === "pointCloud3d" || me.type === "surface3d") {
        J[oe] = me;
        continue;
      }
      if (me.type === "errorBar" || me.type === "impulse") {
        J[oe] = me;
        continue;
      }
      if (me.sampling === "none" && me.type !== "candlestick" && me.type !== "ohlc") {
        J[oe] = me;
        continue;
      }
      const lt = se[oe];
      if (lt && V.min >= lt.cachedRange.min && V.max <= lt.cachedRange.max) {
        me.type === "candlestick" || me.type === "ohlc" ? J[oe] = {
          ...me,
          data: Ga(lt.data, V.min, V.max)
        } : me.type === "band" ? J[oe] = {
          ...me,
          data: Is(lt.data, V.min, V.max)
        } : J[oe] = {
          ...me,
          data: za(lt.data, V.min, V.max)
        };
        continue;
      }
      me.type === "candlestick" || me.type === "ohlc" ? J[oe] = {
        ...me,
        data: Ga(me.data, V.min, V.max)
      } : me.type === "band" ? J[oe] = {
        ...me,
        data: Is(me.data, V.min, V.max)
      } : J[oe] = {
        ...me,
        data: za(me.data, V.min, V.max)
      };
    }
    ee = J, le();
  }
  function qr() {
    const Y = (Bt == null ? void 0 : Bt.getRange()) ?? null, ce = ne("read"), V = _i(ce, Y), me = (V.max - V.min) * 0.1, lt = V.min - me, it = V.max + me, vt = Math.max(1e-3, Math.min(1, V.spanFraction)), Wt = new Array(j.length);
    for (let Et = 0; Et < j.length; Et++) {
      const Ft = j[Et];
      if (Ft.type === "pie" || Ft.type === "heatmap") {
        Wt[Et] = Ft;
        continue;
      }
      if (We(Y)) {
        Wt[Et] = Ft;
        continue;
      }
      if (Ft.type === "candlestick" || Ft.type === "ohlc" || Ft.type === "line" || Ft.type === "area" || Ft.type === "bar" || Ft.type === "scatter" || Ft.type === "band") {
        const gn = B0({
          series: Ft,
          rawSlot: G[Et],
          bufferedMin: lt,
          bufferedMax: it,
          visibleMin: V.min,
          visibleMax: V.max,
          spanFraction: vt,
          sliceX: za,
          sliceOHLC: Ga
        });
        Wt[Et] = gn.series, gn.cacheEntry && (se[Et] = {
          data: gn.cacheEntry.data,
          cachedRange: gn.cacheEntry.cachedRange,
          timestamp: Date.now()
        });
        continue;
      }
      Wt[Et] = Ft;
    }
    ee = Wt, le();
  }
  tc(), Do(), ua(), qr(), se = new Array(g.series.length).fill(null);
  const Ji = cv({
    device: i,
    targetFormat: r,
    pipelineCache: o,
    sampleCount: mt
  });
  af(Ji, g.series);
  const mi = () => {
    if (y) throw new Error("RenderCoordinator is disposed.");
  }, ic = () => {
    if (F)
      try {
        x.cancel(F);
      } catch {
      }
    F = null, I = 1, R = null, N();
  }, fa = (Y) => {
    var yr, jr, gr;
    mi();
    const ce = (Bt == null ? void 0 : Bt.getRange()) ?? null, V = (() => {
      if (R && F) {
        try {
          x.update(performance.now());
        } catch {
        }
        return _(R, I, ce);
      }
      const zt = co(g, O), Cn = _i(zt, ce), jt = /* @__PURE__ */ new Map();
      for (const sn of g.yAxes)
        jt.set(
          sn.id,
          hl(
            g,
            sn.id,
            O,
            fe.get(sn.id) ?? null,
            K
          )
        );
      return {
        xBaseDomain: zt,
        xVisibleDomain: { min: Cn.min, max: Cn.max },
        yBaseDomains: jt,
        series: ee
      };
    })();
    ic();
    const J = g.series, oe = lm(J, Y.series), me = dg(J, Y.series);
    g = Y, yt++, (oe || me || J.length !== Y.series.length) && Af(At), rc(Y.series.length);
    for (let zt = 0; zt < Y.series.length; zt++) {
      const Cn = Y.series[zt];
      if (Cn.type !== "heatmap") {
        D[zt] = null, k[zt] = null, W[zt] = null;
        continue;
      }
      const jt = k[zt];
      d0(jt, Cn.data) && (D[zt] = null, W[zt] = null, (yr = Ji.getState().heatmapRenderers[zt]) == null || yr.resetRing()), k[zt] = Cn.data;
    }
    for (let zt = Y.series.length; zt < D.length; zt++)
      D[zt] = null, k[zt] = null, W[zt] = null;
    if (oe && (j = Y.series, ee = Y.series, Be = new Array(Y.series.length).fill("unknown"), se = new Array(Y.series.length).fill(null), ie = !1, ut(), tc()), fe.clear(), K = null, X = null, z.clear(), $.clear(), d == null || d.update(Y.series, Y.theme), me)
      oe ? j = T0(
        g.series,
        G,
        O
      ) : (Be = new Array(Y.series.length).fill("unknown"), _e.clear(), Ee.clear(), Tr(Le), no(ge), se = new Array(Y.series.length).fill(null), Do()), ua(), qr();
    else {
      const zt = pg(J, Y.series);
      if (zt)
        for (let jt = 0; jt < Y.series.length; jt++) {
          const sn = Y.series[jt];
          if (sn.type === "pie" || sn.type === "heatmap") continue;
          const nn = sn.rawBoundsMode, Tn = sn.rawBounds ?? null;
          if (nn === "data" || nn === "xDataYAxis") {
            const En = G[jt];
            if (En != null && !(sn.type === "candlestick" || sn.type === "ohlc"))
              O[jt] = Rn(En) ?? Tn ?? null;
            else if (sn.type === "candlestick" || sn.type === "ohlc") {
              const wi = En ?? sn.rawData ?? sn.data;
              O[jt] = ml(null, wi) ?? Tn ?? null;
            } else
              O[jt] = Tn;
          } else (nn === "synthetic" && Tn || Tn) && (O[jt] = Tn);
        }
      if (j = bu(Y.series, j), ee = bu(j, ee), mg({
        prev: J,
        next: Y.series,
        runtimeRawDataByIndex: G,
        runtimeRawBoundsByIndex: O
      })) {
        const jt = (sn) => sn.map((nn, Tn) => {
          if (nn.type !== "impulse") return nn;
          const En = O[Tn], wi = Y.series[Tn];
          return En ? {
            ...nn,
            rawBounds: En,
            baseline: (wi == null ? void 0 : wi.baseline) ?? 0
          } : nn;
        });
        j = jt(j), ee = jt(ee);
      }
      if (zt) {
        const jt = (sn) => sn.map((nn, Tn) => {
          if (nn.type === "pie" || nn.type === "heatmap") return nn;
          const En = O[Tn];
          return En ? { ...nn, rawBounds: En } : nn;
        });
        j = jt(j), ee = jt(ee);
      }
      ua(), le();
    }
    {
      const zt = hg({
        series: Y.series,
        runtimeRawDataByIndex: G,
        runtimeRawBoundsByIndex: O,
        extendBounds: ml
      });
      zt.didReplaceRef ? (Do(), qr()) : zt.didMutate && le();
    }
    {
      let zt = !1;
      const Cn = g.series.slice();
      for (let jt = 0; jt < Cn.length; jt++) {
        const sn = Cn[jt];
        if (sn.type !== "heatmap") continue;
        const nn = sn, Tn = D[jt];
        nn.zDomainExplicit && (W[jt] = null);
        const En = nn.zDomainExplicit ? null : W[jt];
        !Tn && !En || (zt = !0, Cn[jt] = oc(nn, Tn ?? nn.data, En), O[jt] = Cn[jt].rawBounds ?? null);
      }
      zt && (g = { ...g, series: Cn }, j = j.map((jt, sn) => {
        var nn;
        return ((nn = Cn[sn]) == null ? void 0 : nn.type) === "heatmap" ? Cn[sn] : jt;
      }), ee = ee.map((jt, sn) => {
        var nn;
        return ((nn = Cn[sn]) == null ? void 0 : nn.type) === "heatmap" ? Cn[sn] : jt;
      }));
    }
    if (l) {
      const zt = ((jr = g.tooltip) == null ? void 0 : jr.show) !== !1;
      zt && !ve && (ve = Lf(l), Of(Ae)), !zt && ve && Mt(), xe || (xe = Uf(l)), qs(g.series, {
        candlePrimary: !1,
        onWarn: Oe
      }) == null && xe.update({
        visible: !1,
        x: 0,
        y: 0,
        priceText: "",
        countdownText: null,
        background: "#000000",
        color: "#ffffff",
        side: "right"
      }), Ue();
    } else
      Mt(), Ze(), xe && (xe.dispose(), xe = null);
    const lt = Y.series.length;
    if (af(Ji, Y.series), lt < S)
      for (let zt = lt; zt < S; zt++)
        Ie.removeSeries(zt), _e.delete(zt), Ee.delete(zt), ge.byIndex.delete(zt);
    if (S = lt, g.animation === !1 && A === "running" && (h.cancelAll(), b = null, A = "done", M = 1), g.animation === !1) {
      ic(), Je();
      return;
    }
    const it = (Bt == null ? void 0 : Bt.getRange()) ?? null, vt = co(g, O), Wt = _i(vt, it), Et = /* @__PURE__ */ new Map();
    for (const zt of g.yAxes)
      Et.set(
        zt.id,
        hl(
          g,
          zt.id,
          O,
          fe.get(zt.id) ?? null,
          K
        )
      );
    const Ft = ee, gn = ((gr = g.yAxes[0]) == null ? void 0 : gr.id) ?? "y", In = V.yBaseDomains.get(gn) ?? { min: 0, max: 1 }, Yn = Et.get(gn) ?? { min: 0, max: 1 }, Kn = !ou(V.xBaseDomain, vt) || !ou(In, Yn);
    if (!(v && (Kn || oe))) {
      Je();
      return;
    }
    const _n = SN(g.animation);
    if (!_n) return;
    R = {
      from: {
        xBaseDomain: V.xBaseDomain,
        xVisibleDomain: V.xVisibleDomain,
        yBaseDomains: V.yBaseDomains,
        series: V.series
      },
      to: {
        xBaseDomain: vt,
        xVisibleDomain: { min: Wt.min, max: Wt.max },
        yBaseDomains: Et,
        series: Ft
      }
    }, N();
    const hr = _n.delayMs + _n.durationMs, vi = (zt) => {
      const Cn = mn(zt);
      if (!(hr > 0)) return 1;
      const jt = Cn * hr;
      if (jt <= _n.delayMs) return 0;
      if (!(_n.durationMs > 0)) return 1;
      const sn = (jt - _n.delayMs) / _n.durationMs;
      return _n.easing(sn);
    };
    I = 0;
    const Jn = x.animate(
      0,
      1,
      hr,
      vi,
      (zt) => {
        y || F !== Jn || (I = mn(zt), I < 1 && Je());
      },
      () => {
        y || F !== Jn || (I = 1, R = null, F = null, N());
      }
    );
    F = Jn, Je();
  }, Wm = (Y) => (mi(), !Number.isFinite(Y) || Y < 0 || Y >= g.series.length ? null : (te.size > 0 && (ut(), Ut({ requestRenderAfter: !1 })), G[Y] ?? null)), Xm = (Y) => (mi(), !Number.isFinite(Y) || Y < 0 || Y >= g.series.length ? null : (te.size > 0 && (ut(), Ut({ requestRenderAfter: !1 })), O[Y] ?? null)), rc = (Y) => {
    for (; D.length < Y; )
      D.push(null), k.push(null), W.push(null);
    D.length > Y && (D.length = Y, k.length = Y, W.length = Y);
  }, oc = (Y, ce, V) => {
    const J = Yl(ce, Y.cellAnchor), oe = (V == null ? void 0 : V.zMin) ?? Y.zMin, me = (V == null ? void 0 : V.zMax) ?? Y.zMax;
    return {
      ...Y,
      data: ce,
      rawBounds: J,
      zMin: oe,
      zMax: me > oe ? me : oe + 1,
      cellCount: ce.columns * ce.rows,
      drawable: ce.columns >= 1 && ce.rows >= 1 && Y.visible !== !1
    };
  }, Vm = (Y, ce) => {
    const V = (J) => {
      if (Y < 0 || Y >= J.length) return J;
      const oe = J.slice();
      return oe[Y] = ce, oe;
    };
    g = { ...g, series: V(g.series) }, j = V(j), ee = V(ee), O[Y] = ce.rawBounds ?? null;
  };
  return {
    setOptions: fa,
    appendData: (Y, ce, V) => {
      if (mi(), !Number.isFinite(Y) || Y < 0 || Y >= g.series.length || !ce) return;
      const J = g.series[Y];
      if (J.type === "pie" || J.type === "heatmap") {
        C.has(Y) || (C.add(Y), console.warn(
          `RenderCoordinator.appendData(${Y}, ...): ${J.type} series are not supported by streaming append.` + (J.type === "heatmap" ? " Use chart.updateHeatmap(...) for replaceZ / appendColumns / appendRows." : "")
        ));
        return;
      }
      if (J.type === "band" && !Xl(ce)) {
        console.warn(
          `RenderCoordinator.appendData(${Y}, ...): band series requires Xyy payloads ({x,y,y1}, [x,y,y1] tuples/objects, or interleaved stride-3). Skipping batch.`
        );
        return;
      }
      if ((J.type === "candlestick" || J.type === "ohlc" ? ce.length : J.type === "band" ? yn(ce) : $e(ce)) === 0) return;
      const me = bi(V == null ? void 0 : V.maxPoints), lt = {
        points: ce,
        ...me != null ? { maxPoints: me } : {}
      }, it = te.get(Y);
      it ? it.push(lt) : te.set(Y, [lt]), ye();
    },
    updateHeatmap: (Y, ce) => {
      if (mi(), !Number.isFinite(Y) || Y < 0 || Y >= g.series.length) return !1;
      rc(g.series.length);
      const V = g.series[Y];
      if (!V || V.type !== "heatmap")
        return U.has(Y) || (U.add(Y), console.warn(
          `ChartGPU.updateHeatmap(${Y}, ...): series is not heatmap (got ${(V == null ? void 0 : V.type) ?? "missing"}).`
        )), !1;
      const J = V;
      k[Y] == null && (k[Y] = J.data);
      const oe = D[Y] ?? J.data, me = y0(oe, ce);
      D[Y] = me.data, W[Y] = g0({
        zDomainExplicit: J.zDomainExplicit === !0,
        seriesZMin: J.zMin,
        seriesZMax: J.zMax,
        prevOverride: W[Y],
        result: me,
        update: ce
      });
      const lt = W[Y], it = oc(J, me.data, lt);
      Vm(Y, it);
      const Wt = Ji.getState().heatmapRenderers[Y];
      return Wt && (ce.mode === "appendColumns" && ce.scrollX !== !1 && me.ringAdvanceCols === 1 && !me.dimsChanged && Wt.hasZTexture() && Wt.uploadColumnStrip(ce.z, 1, me.data.rows, me.data.columns, me.data.z) || Wt.resetRing()), X = null, z.clear(), $.clear(), fe.clear(), K = null, !0;
    },
    getRuntimeSeriesData: Wm,
    getRuntimeSeriesBounds: Xm,
    getInteractionX: () => he,
    setInteractionX: (Y, ce) => {
      mi();
      const V = Y !== null && Number.isFinite(Y) ? Y : null;
      ue = {
        ...ue,
        source: V === null ? "mouse" : "sync"
      }, Ne(V, ce), V === null && ue.hasPointer === !1 && (Zt.setVisible(!1), Ge.setVisible(!1), $t()), Je();
    },
    onInteractionXChange: (Y) => (mi(), et.add(Y), () => {
      et.remove(Y);
    }),
    getZoomRange: () => (Bt == null ? void 0 : Bt.getRange()) ?? null,
    setZoomRange: (Y, ce) => {
      mi(), Bt && Bt.setRange(Y, ce);
    },
    onZoomRangeChange: (Y) => (mi(), Ro.add(Y), () => {
      Ro.delete(Y);
    }),
    render: () => {
      var pc, hc, yc, gc, xc;
      if (mi(), !e.canvasContext || !e.canvas) return;
      (te.size > 0 || ie) && (ut(), Ut({ requestRenderAfter: !1 })), be && (be = !1, Ym());
      const Y = g.series.some((Re) => Re.type !== "pie"), ce = ee;
      if (A !== "done") {
        const Re = MN(g.animation), De = ay(ce);
        if (fy(A, De, !!Re, !1) === "running" && A === "pending" && Re) {
          const qe = Re.delayMs + Re.durationMs, Nt = ry(Re.delayMs, Re.durationMs, Re.easing);
          M = 0, A = "running", b = h.animate(
            0,
            1,
            qe,
            Nt,
            (Pt) => {
              y || A !== "running" || (M = mn(Pt), M < 1 && Je());
            },
            () => {
              y || (A = "done", M = 1, b = null);
            }
          );
        }
        h.update(performance.now());
      }
      R !== null && F && x.update(performance.now());
      const V = su(e, g);
      q == null || q.updateGridArea(V);
      const J = (Bt == null ? void 0 : Bt.getRange()) ?? null, oe = R ? mn(I) : 1, me = R ? (() => {
        const Re = R.from.xBaseDomain, De = R.to.xBaseDomain;
        if (g.xAxis.type === "log") {
          const Gt = g.xAxis.logBase ?? 10, qe = Ho(Re, De, oe);
          return Xi(qe.min, qe.max, { base: Gt, warn: !1 });
        }
        return ho(Re, De, oe);
      })() : co(g, O), lt = ne("paint", {
        dataXDomain: me,
        updateTransitionActive: !!(R && oe < 1)
      }), it = _i(lt, J), vt = py(V), Wt = Kd(V), Et = Pi(g.xAxis).domain(it.min, it.max).range(vt.left, vt.right), Ft = /* @__PURE__ */ new Map(), gn = /* @__PURE__ */ new Map();
      Z = !1;
      const In = performance.now(), Yn = Q > 0 ? Math.max(0, In - Q) : 16;
      Q = In;
      const Kn = xv(Yn, 120);
      for (const Re of g.yAxes) {
        const De = Re.id;
        let Gt;
        if (R && oe < 1) {
          const qe = R.from.yBaseDomains.get(De) ?? { min: 0, max: 1 }, Nt = R.to.yBaseDomains.get(De) ?? { min: 0, max: 1 };
          let Pt;
          if (Re.type === "log") {
            const Xt = Re.logBase ?? 10, Jt = Ho(qe, Nt, oe);
            Pt = Xi(Jt.min, Jt.max, { base: Xt, warn: !1 });
          } else
            Pt = ho(qe, Nt, oe);
          Gt = ff({
            dataDomain: Pt,
            explicitMin: void 0,
            explicitMax: void 0,
            autoRange: Re.autoRange,
            growBy: Re.growBy,
            axisType: Re.type,
            logBase: Re.logBase,
            updateTransitionActive: !0,
            transitionDomain: Pt,
            sticky: z.get(De) ?? null,
            animatedDisplay: $.get(De) ?? null
          }).domain, z.delete(De), $.delete(De);
        } else {
          const qe = hl(
            g,
            De,
            O,
            fe.get(De) ?? null,
            K
          ), Nt = pi(Re.min), Pt = pi(Re.max), Lt = ff({
            dataDomain: qe,
            explicitMin: Nt,
            explicitMax: Pt,
            autoRange: Re.autoRange,
            growBy: Re.growBy,
            axisType: Re.type,
            logBase: Re.logBase,
            updateTransitionActive: !1,
            sticky: z.get(De) ?? null,
            animatedDisplay: $.get(De) ?? null,
            animatedAlpha: Kn
          });
          Gt = Lt.domain, Lt.nextSticky ? z.set(De, Lt.nextSticky) : z.delete(De), Lt.nextAnimatedDisplay ? $.set(De, Lt.nextAnimatedDisplay) : $.delete(De), Lt.needsFrame && (Z = !0);
        }
        gn.set(De, Gt), Ft.set(
          De,
          Pi(Re).domain(Gt.min, Gt.max).range(vt.bottom, vt.top)
        );
      }
      const pr = Ft.values().next().value, _n = e.canvas, hr = L0(
        _n,
        e.devicePixelRatio ?? (typeof window < "u" ? window.devicePixelRatio : 1)
      ), vi = hr.width, Jn = hr.height, yr = vi > 0 ? ii(vt.left, vi) : 0, jr = vi > 0 ? ii(vt.right, vi) : 0, gr = Jn > 0 ? fi(vt.top, Jn) : 0, zt = Jn > 0 ? fi(vt.bottom, Jn) : 0, Cn = Math.max(0, jr - yr), jt = Math.max(0, zt - gr), sn = Y ? g.annotations ?? [] : [], nn = yg({
        annotations: sn,
        xScale: Et,
        yScales: Ft,
        plotBounds: {
          leftCss: yr,
          rightCss: jr,
          topCss: gr,
          bottomCss: zt,
          widthCss: Cn,
          heightCss: jt
        },
        canvasCssWidth: vi,
        canvasCssHeight: Jn,
        theme: g.theme
      }), Tn = nn.linesBelow;
      let En = nn.linesAbove;
      if (Y) {
        const Re = qs(
          g.series,
          { candlePrimary: !1, onWarn: Oe }
        );
        if (Re != null) {
          const De = g.series[Re];
          if (De.type === "candlestick" || De.type === "ohlc") {
            const Gt = De, qe = Gt.priceLabel;
            if (qe != null && qe.show && qe.showLine) {
              const Nt = Gt.yAxis, Pt = Ft.get(Nt);
              if (Pt) {
                const Lt = G[Re], Xt = Im({
                  seriesIndex: Re,
                  yAxisId: Nt,
                  raw: Lt,
                  upColor: Gt.itemStyle.upColor,
                  downColor: Gt.itemStyle.downColor,
                  intervalMs: qe.intervalMs
                }), Jt = mN({
                  last: Xt,
                  outOfDomain: qe.outOfDomain,
                  yScale: Pt,
                  canvasCssHeight: Jn,
                  lineWidth: qe.lineWidth,
                  lineColor: qe.lineColor
                });
                Jt.length > 0 && (En = [...nn.linesAbove, ...Jt]);
              }
            }
          }
        }
      }
      const wi = Tn.length, da = En.length, ma = nn.markersBelow.length, pa = nn.markersAbove.length, $m = Fl(e.canvas), ha = Math.abs(it.max - it.min);
      let Di = yl, Wn = [];
      if (g.xAxis.type === "time") {
        const Re = Py({
          axisMin: Ls(g.xAxis.min),
          axisMax: Ls(g.xAxis.max),
          xScale: Et,
          plotClipLeft: vt.left,
          plotClipRight: vt.right,
          canvasCssWidth: $m,
          visibleRangeMs: ha,
          measureCtx: m,
          measureCache: p ?? void 0,
          fontSize: g.theme.fontSize,
          fontFamily: g.theme.fontFamily || "sans-serif",
          tickFormatter: g.xAxis.tickFormatter
        });
        Di = Re.tickCount, Wn = Re.tickValues;
      } else if (g.xAxis.type === "log") {
        const Re = it.min, De = it.max, Gt = g.xAxis.logBase ?? 10, qe = Es(Re, De, Gt);
        Wn = qe.length > 0 ? qe : Q0(Re, De, Gt), Di = Math.max(1, Wn.length);
      } else if (g.xAxis.type === "category") {
        const Re = it.min, De = it.max, Gt = g.xAxis.tickCount ?? Di;
        Wn = Ds(Re, De, Gt), Di = Math.max(1, Wn.length);
      } else {
        const Re = it.min, De = it.max, Gt = g.xAxis.tickCount ?? Di;
        Wn = ks(Re, De, Gt), Di = Math.max(1, Wn.length);
      }
      const xr = /* @__PURE__ */ new Map();
      for (const Re of g.yAxes) {
        const De = Re.id, Gt = gn.get(De);
        Gt && (Re.type === "log" ? xr.set(De, Es(Gt.min, Gt.max, Re.logBase ?? 10)) : xr.set(
          De,
          ks(Gt.min, Gt.max, Re.tickCount ?? yl)
        ));
      }
      const rn = Ve(V, {
        xDomain: { min: it.min, max: it.max },
        yDomains: gn
      });
      pe = rn;
      const Gn = R && oe < 1 ? B(
        R.from.series,
        R.to.series,
        oe,
        T
      ) : ee;
      if (R && oe < 1) {
        _e.clear(), Ee.clear(), Tr(Le), no(ge);
        const Re = Ji.getState(), De = Re.areaRenderers;
        for (let Rt = 0; Rt < De.length; Rt++)
          De[Rt].invalidateGeometry();
        const Gt = Re.lineRenderers;
        for (let Rt = 0; Rt < Gt.length; Rt++)
          Gt[Rt].invalidateGeometry();
        Re.barRenderer.invalidateGeometry();
        const qe = Re.scatterRenderers;
        for (let Rt = 0; Rt < qe.length; Rt++)
          qe[Rt].invalidateGeometry();
        const Nt = Re.candlestickRenderers;
        for (let Rt = 0; Rt < Nt.length; Rt++)
          Nt[Rt].invalidateGeometry();
        const Pt = Re.ohlcRenderers;
        for (let Rt = 0; Rt < Pt.length; Rt++)
          Pt[Rt].invalidateGeometry();
        const Lt = Re.bandRenderers;
        for (let Rt = 0; Rt < Lt.length; Rt++)
          Lt[Rt].invalidateGeometry();
        const Xt = Re.errorBarRenderers;
        for (let Rt = 0; Rt < Xt.length; Rt++)
          Xt[Rt].invalidateGeometry();
        const Jt = Re.impulseRenderers;
        for (let Rt = 0; Rt < Jt.length; Rt++)
          Jt[Rt].invalidateGeometry();
      }
      ue.source === "mouse" && ue.hasPointer && ue.isInGrid && rn && Ne($w(ue.gridX, rn.xScale), "mouse");
      const qm = rn ? {
        xScale: rn.xScale,
        yScale: rn.yScales.values().next().value ?? rn.xScale,
        plotWidthCss: rn.plotWidthCss,
        plotHeightCss: rn.plotHeightCss
      } : null, on = jw(
        ue,
        he,
        qm,
        {
          left: V.left,
          top: V.top,
          width: Math.max(
            0,
            V.canvasWidth / Math.max(1e-6, V.devicePixelRatio || 1) - V.left - V.right
          ),
          height: Math.max(
            0,
            V.canvasHeight / Math.max(1e-6, V.devicePixelRatio || 1) - V.top - V.bottom
          )
        }
      );
      let Zr, cc = !1;
      const uc = on.hasPointer && on.isInGrid && rn != null, ya = uc && on.source === "mouse";
      if (ya && rn) {
        const Re = performance.now(), De = rn, Gt = pw({
          state: At,
          nowMs: Re,
          gridX: on.gridX,
          gridY: on.gridY,
          options: Jl,
          findNearest: () => Os(
            Gn,
            on.gridX,
            on.gridY,
            De.xScale,
            De.yScales.values().next().value,
            void 0,
            De.yScales
          )
        });
        Zr = Gt.match, cc = Gt.recomputed, Gt.scheduleFollowupMs == null ? Ot() : Ht(Gt.scheduleFollowupMs);
      } else uc ? Zr = null : (Zr = null, Af(At), Ot());
      cg(
        {
          gridRenderer: ct,
          gridRendererSS1: je,
          xAxisRenderer: pt,
          yAxisRenderers: St,
          crosshairRenderer: Zt,
          highlightRenderer: Ge
        },
        {
          currentOptions: g,
          xScale: Et,
          yScales: Ft,
          gridArea: V,
          xTickCount: Di,
          xTickValues: Wn,
          yTickValuesByAxis: xr,
          hasCartesianSeries: Y,
          effectivePointer: on,
          interactionScales: rn,
          seriesForRender: Gn,
          withAlpha: au,
          nearestMatch: Zr,
          overlayPrepareMemo: Se
        }
      );
      const fc = on.hasPointer && on.isInGrid && ((pc = g.tooltip) == null ? void 0 : pc.show) !== !1;
      let ga = !0;
      if (fc)
        if (ya)
          ga = cc;
        else {
          const Re = performance.now(), De = hw(It, Re, Qe);
          It = De.nextLastSyncMs, ga = De.allowed, De.scheduleFollowupMs != null ? Ht(De.scheduleFollowupMs) : Ot();
        }
      else ya || Ot();
      if (fc) {
        if (ga) {
          const Re = e.canvas;
          if (rn && Re && Pr(Re)) {
            const De = (hc = g.tooltip) == null ? void 0 : hc.formatter, Gt = ((yc = g.tooltip) == null ? void 0 : yc.trigger) ?? "item", qe = Re.offsetLeft + on.x, Nt = Re.offsetTop + on.y;
            if (on.source === "sync") {
              const Pt = Ff(Gn, on.gridX, rn.xScale);
              if (Pt.length === 0)
                Mt();
              else if (Gt === "axis") {
                const Lt = Pt.map((Jt) => dt(Jt.seriesIndex, Jt.dataIndex, Jt.point)), Xt = De ? De(Lt) : ls(Lt);
                Xt && ei(Ae, Xt, qe, Nt) ? (ti(Ae, Xt, qe, Nt), xt(qe, Nt, Xt)) : Xt || Mt();
              } else {
                const Lt = Pt[0], Xt = dt(Lt.seriesIndex, Lt.dataIndex, Lt.point), Jt = De ? De(Xt) : Li(Xt);
                Jt && ei(Ae, Jt, qe, Nt) ? (ti(Ae, Jt, qe, Nt), xt(qe, Nt, Jt)) : Jt || Mt();
              }
            } else if (Gt === "axis") {
              const Pt = ot(
                Gn,
                on.gridX,
                on.gridY,
                rn.plotWidthCss,
                rn.plotHeightCss
              );
              if (Pt) {
                const Lt = {
                  seriesName: Pt.slice.name,
                  seriesIndex: Pt.seriesIndex,
                  dataIndex: Pt.dataIndex,
                  value: [0, Pt.slice.value],
                  color: Pt.slice.color
                }, Xt = De ? De([Lt]) : Li(Lt);
                Xt && ei(Ae, Xt, qe, Nt) ? (ti(Ae, Xt, qe, Nt), xt(qe, Nt, Xt)) : Xt || Mt();
              } else {
                const Lt = He(
                  Gn,
                  on.gridX,
                  on.gridY,
                  rn
                ), Xt = Ff(Gn, on.gridX, rn.xScale), Jt = _t(
                  Gn,
                  on.gridX,
                  on.gridY,
                  rn
                );
                if (Xt.length === 0 && !Lt)
                  if (Jt) {
                    const Rt = De ? De([Jt]) : ls([Jt]);
                    Rt && ei(Ae, Rt, qe, Nt) ? (ti(Ae, Rt, qe, Nt), xt(qe, Nt, Rt)) : Rt || Mt();
                  } else
                    Mt();
                else if (Xt.length === 0) {
                  const Rt = [Lt.params];
                  Jt && Rt.push(Jt);
                  const Ln = De ? De(Rt) : ls(Rt);
                  if (Ln) {
                    const Vt = pl(
                      Lt.match,
                      rn.xScale,
                      rn.yScales,
                      V,
                      Re
                    ), Mn = (Vt == null ? void 0 : Vt.x) ?? qe, si = (Vt == null ? void 0 : Vt.y) ?? Nt;
                    ei(Ae, Ln, Mn, si) && (ti(Ae, Ln, Mn, si), xt(Mn, si, Ln));
                  } else
                    Mt();
                } else {
                  const Rt = Xt.map((Vt) => dt(Vt.seriesIndex, Vt.dataIndex, Vt.point));
                  Lt && Rt.push(Lt.params), Jt && Rt.push(Jt);
                  const Ln = De ? De(Rt) : ls(Rt);
                  if (Ln) {
                    let Vt = qe, Mn = Nt;
                    if (Lt) {
                      const si = pl(
                        Lt.match,
                        rn.xScale,
                        rn.yScales,
                        V,
                        Re
                      );
                      si && (Vt = si.x, Mn = si.y);
                    }
                    ei(Ae, Ln, Vt, Mn) && (ti(Ae, Ln, Vt, Mn), xt(Vt, Mn, Ln));
                  } else
                    Mt();
                }
              }
            } else {
              const Pt = ot(
                Gn,
                on.gridX,
                on.gridY,
                rn.plotWidthCss,
                rn.plotHeightCss
              );
              if (Pt) {
                const Lt = {
                  seriesName: Pt.slice.name,
                  seriesIndex: Pt.seriesIndex,
                  dataIndex: Pt.dataIndex,
                  value: [0, Pt.slice.value],
                  color: Pt.slice.color
                }, Xt = De ? De(Lt) : Li(Lt);
                Xt && ei(Ae, Xt, qe, Nt) ? (ti(Ae, Xt, qe, Nt), xt(qe, Nt, Xt)) : Xt || Mt();
              } else {
                const Lt = He(
                  Gn,
                  on.gridX,
                  on.gridY,
                  rn
                );
                if (Lt) {
                  const Vt = De ? De(Lt.params) : Li(Lt.params);
                  if (Vt) {
                    const Mn = pl(
                      Lt.match,
                      rn.xScale,
                      rn.yScales,
                      V,
                      Re
                    ), si = (Mn == null ? void 0 : Mn.x) ?? qe, Na = (Mn == null ? void 0 : Mn.y) ?? Nt;
                    ei(Ae, Vt, si, Na) && (ti(Ae, Vt, si, Na), xt(si, Na, Vt, Lt.params));
                  } else
                    Mt();
                  return;
                }
                const Xt = gt(
                  Gn,
                  on.gridX,
                  on.gridY,
                  rn
                );
                if (Xt) {
                  const Vt = De ? De(Xt.params) : Li(Xt.params);
                  Vt && ei(Ae, Vt, qe, Nt) ? (ti(Ae, Vt, qe, Nt), xt(qe, Nt, Vt, Xt.params)) : Vt || Mt();
                  return;
                }
                const Jt = tn(
                  Gn,
                  on.gridX,
                  on.gridY,
                  rn
                );
                if (Jt) {
                  const Vt = De ? De(Jt.params) : Li(Jt.params);
                  Vt && ei(Ae, Vt, qe, Nt) ? (ti(Ae, Vt, qe, Nt), xt(qe, Nt, Vt, Jt.params)) : Vt || Mt();
                  return;
                }
                const Rt = Zr ?? null;
                if (Rt) {
                  const Vt = dt(Rt.seriesIndex, Rt.dataIndex, Rt.point, {
                    stack: Rt.stack,
                    stackTotal: Rt.stackTotal
                  }), Mn = De ? De(Vt) : Li(Vt);
                  Mn && ei(Ae, Mn, qe, Nt) ? (ti(Ae, Mn, qe, Nt), xt(qe, Nt, Mn)) : Mn || Mt();
                  return;
                }
                const Ln = _t(
                  Gn,
                  on.gridX,
                  on.gridY,
                  rn
                );
                if (Ln) {
                  const Vt = De ? De(Ln) : Li(Ln);
                  Vt && ei(Ae, Vt, qe, Nt) ? (ti(Ae, Vt, qe, Nt), xt(qe, Nt, Vt)) : Vt || Mt();
                } else
                  Mt();
              }
            }
          } else
            Mt();
        }
      } else
        Mt();
      const Kr = rn ?? (_n && Pr(_n) ? tt(_n, V) : null), jm = Kr && typeof Kr.plotWidthCss == "number" && typeof Kr.plotHeightCss == "number" ? 0.5 * Math.min(Kr.plotWidthCss, Kr.plotHeightCss) : 0, zn = Ji.getState(), Xn = Sg(zn, {
        currentOptions: g,
        seriesForRender: Gn,
        xScale: Et,
        yScales: Ft,
        gridArea: V,
        dataStore: Ie,
        appendedGpuThisFrame: Me,
        gpuSeriesKindByIndex: Be,
        visibleXDomain: it,
        introPhase: A,
        introProgress01: M,
        withAlpha: au,
        maxRadiusCss: jm,
        lastSetSeriesCache: _e,
        filterGapsCache: Ee,
        stackedMountainCache: Le,
        stepExpandCache: ge
      });
      Me.clear();
      const { visibleBarSeriesConfigs: Zm } = Xn, dc = A === "running" ? mn(M) : 1, Km = dc < 1 ? NN(pr, vt, dc) : pr;
      zn.barRenderer.prepare(Zm, Et, Km, V), Y ? (bt.prepare(V, Tn), wt.prepare(V, En), Dt.prepare({
        canvasWidth: V.canvasWidth,
        canvasHeight: V.canvasHeight,
        devicePixelRatio: V.devicePixelRatio,
        instances: nn.markersBelow
      }), Yt.prepare({
        canvasWidth: V.canvasWidth,
        canvasHeight: V.canvasHeight,
        devicePixelRatio: V.devicePixelRatio,
        instances: nn.markersAbove
      })) : (bt.prepare(V, []), wt.prepare(V, []), Dt.prepare({
        canvasWidth: V.canvasWidth,
        canvasHeight: V.canvasHeight,
        devicePixelRatio: V.devicePixelRatio,
        instances: []
      }), Yt.prepare({
        canvasWidth: V.canvasWidth,
        canvasHeight: V.canvasHeight,
        devicePixelRatio: V.devicePixelRatio,
        instances: []
      }));
      const Jm = Ig(zn, Xn), Qm = Bg(zn, Xn), ep = Pg(zn, Xn), xa = kg({
        msaaSampleCount: mt,
        hasDenseHairline: Jm,
        hasDenseScatter: Qm,
        hasDenseArea: ep
      }), { useDirectSwapchainResolve: ba, useSwapchainAsMainView: tp, needResolveAndOverlay: np, needMainColor: ip } = xa, va = Lg(xa), mc = Ug(xa), rp = wi > 0 || ma > 0 || da > 0 || pa > 0, op = on.hasPointer && on.isInGrid, wa = va && mt > 1 && !Tg(zn, Xn) && je != null && Ye != null && !rp && !op;
      en.ensureTextures(V.canvasWidth, V.canvasHeight, {
        needResolveAndOverlay: np && !wa,
        // Direct sampleCount-1 path needs no offscreen color target.
        needMainColor: ip && !wa
      });
      const br = en.getState(), ko = e.canvasContext.getCurrentTexture().createView(), vr = i.createCommandEncoder({
        label: "renderCoordinator/commandEncoder"
      }), Eo = mp(g.theme.backgroundColor, { r: 0, g: 0, b: 0, a: 1 });
      if (Eg(zn, Gn, vr), wa) {
        const Re = vr.beginRenderPass({
          label: "renderCoordinator/denseOnlyDirectSS1",
          colorAttachments: [
            {
              view: ko,
              clearValue: Eo,
              loadOp: "clear",
              storeOp: "store"
            }
          ]
        });
        je.render(Re), Pu(
          zn,
          {
            referenceLineRenderer: bt,
            annotationMarkerRenderer: Dt
          },
          {
            hasCartesianSeries: Y,
            gridArea: V,
            mainPass: Re,
            plotScissor: Wt,
            introPhase: A,
            introProgress01: M,
            referenceLineBelowCount: wi,
            markerBelowCount: ma
          },
          Xn
        ), Cu(
          zn,
          {
            gridArea: V,
            densePass: Re,
            plotScissor: Wt,
            introPhase: A,
            introProgress01: M
          },
          Xn
        ), Au(
          zn,
          {
            gridArea: V,
            densePass: Re,
            plotScissor: Wt,
            introPhase: A,
            introProgress01: M
          },
          Xn
        ), Fu(
          zn,
          {
            gridArea: V,
            hairlinePass: Re,
            plotScissor: Wt,
            introPhase: A,
            introProgress01: M
          },
          Xn
        );
        {
          const De = g.theme.axisLineColor, Gt = g.theme.axisTickColor;
          Ye.prepare(
            g.xAxis,
            Et,
            "x",
            V,
            De,
            Gt,
            Di,
            Wn
          );
          for (const qe of g.yAxes) {
            const Nt = qe.id;
            let Pt = rt.get(Nt);
            Pt || (Pt = Za(i, { targetFormat: r, sampleCount: 1, pipelineCache: o }), rt.set(Nt, Pt));
            const Lt = Ft.get(Nt) ?? Ft.values().next().value;
            if (!Lt) continue;
            const Xt = xr.get(Nt) ?? [], Jt = Xt.length > 0 ? Xt.length : qe.tickCount ?? yl;
            Pt.prepare(qe, Lt, "y", V, De, Gt, Jt, Xt);
          }
        }
        if (Y) {
          Ye.render(Re);
          for (const De of rt.values())
            De.render(Re);
        }
        Re.end();
      } else {
        const Re = vr.beginRenderPass({
          label: ba ? "renderCoordinator/mainPassDirect" : "renderCoordinator/mainPass",
          colorAttachments: [
            tp ? {
              view: ko,
              clearValue: Eo,
              loadOp: "clear",
              storeOp: "store"
            } : {
              view: br.mainColorView,
              // MSAA (4×) main color
              resolveTarget: ba ? ko : br.mainResolveView,
              // intermediate resolve for hairline/overlay path
              clearValue: Eo,
              loadOp: "clear",
              storeOp: "discard"
              // MSAA content discarded after resolve
            }
          ]
        });
        if (ct && ct.render(Re), Pu(
          zn,
          {
            referenceLineRenderer: bt,
            annotationMarkerRenderer: Dt
          },
          {
            hasCartesianSeries: Y,
            gridArea: V,
            mainPass: Re,
            plotScissor: Wt,
            introPhase: A,
            introProgress01: M,
            referenceLineBelowCount: wi,
            markerBelowCount: ma
          },
          Xn
        ), ba) {
          if (Iu(
            {
              referenceLineRendererMsaa: wt,
              annotationMarkerRendererMsaa: Yt
            },
            {
              hasCartesianSeries: Y,
              gridArea: V,
              overlayPass: Re,
              plotScissor: Wt,
              referenceLineAboveCount: da,
              markerAboveCount: pa
            }
          ), Ge.render(Re), Y) {
            pt.render(Re);
            for (const De of St.values())
              De.render(Re);
          }
          Zt.render(Re);
        }
        if (Re.end(), va || mc) {
          if (va) {
            const De = vr.beginRenderPass({
              label: "renderCoordinator/denseHairlinePass",
              colorAttachments: [
                {
                  view: br.mainResolveView,
                  loadOp: "load",
                  storeOp: "store"
                }
              ]
            });
            Cu(
              zn,
              {
                gridArea: V,
                densePass: De,
                plotScissor: Wt,
                introPhase: A,
                introProgress01: M
              },
              Xn
            ), Au(
              zn,
              {
                gridArea: V,
                densePass: De,
                plotScissor: Wt,
                introPhase: A,
                introProgress01: M
              },
              Xn
            ), Fu(
              zn,
              {
                gridArea: V,
                hairlinePass: De,
                plotScissor: Wt,
                introPhase: A,
                introProgress01: M
              },
              Xn
            ), De.end();
          }
          if (mc) {
            const De = vr.beginRenderPass({
              label: "renderCoordinator/annotationOverlayMsaaPass",
              colorAttachments: [
                {
                  view: br.overlayMsaaView,
                  resolveTarget: ko,
                  clearValue: Eo,
                  loadOp: "clear",
                  storeOp: "discard"
                }
              ]
            });
            if (De.setPipeline(br.overlayBlitPipeline), De.setBindGroup(0, br.overlayBlitBindGroup), De.draw(3), Iu(
              {
                referenceLineRendererMsaa: wt,
                annotationMarkerRendererMsaa: Yt
              },
              {
                hasCartesianSeries: Y,
                gridArea: V,
                overlayPass: De,
                plotScissor: Wt,
                referenceLineAboveCount: da,
                markerAboveCount: pa
              }
            ), Ge.render(De), Y) {
              pt.render(De);
              for (const Gt of St.values())
                Gt.render(De);
            }
            Zt.render(De), De.end();
          }
        }
      }
      x0(i, vr.finish()), v = !0;
      {
        let Re = hN >>> 0;
        Re = js(Re, Wn.length);
        for (let qe = 0; qe < Wn.length; qe++)
          Re = cs(Re, Wn[qe]);
        for (const qe of g.yAxes) {
          const Nt = qe.id, Pt = xr.get(Nt) ?? [];
          Re = js(Re, Pt.length);
          for (let Lt = 0; Lt < Pt.length; Lt++)
            Re = cs(Re, Pt[Lt]);
          Re = cs(Re, qe.min ?? Number.NaN), Re = cs(Re, qe.max ?? Number.NaN);
        }
        let De = `${vt.left},${vt.right},${vt.top},${vt.bottom}|`;
        De += `${g.theme.fontSize}|${g.theme.textColor}|`, De += `${g.theme.fontFamily ?? ""}|`, De += `epoch:${yt}|xr:${ha}|xt:${g.xAxis.type ?? ""}|`, De += `x:${g.xAxis.name ?? ""}|`, De += `th:${Re >>> 0}|`;
        for (const qe of g.yAxes) {
          const Nt = qe.id;
          De += `y:${Nt}:${((gc = qe.name) == null ? void 0 : gc.trim()) ?? ""}:${((xc = qe.header) == null ? void 0 : xc.trim()) ?? ""}:${qe.position ?? "left"}:`, De += `yt:${qe.type ?? ""};yb:${qe.logBase ?? ""};ar:${qe.autoRange ?? ""};`;
        }
        let Gt = De;
        {
          const qe = Et.getDomain(), Nt = Et.kind === "log" ? Et.scale(qe.min) : Et.scale(0), Pt = Et.kind === "log" ? Et.scale(qe.max) : Et.scale(1);
          Gt += `xs:${Nt},${Pt}|xk:${Et.kind}|xb:${Et.base ?? ""}|`;
        }
        for (const qe of g.yAxes) {
          const Nt = qe.id, Pt = Ft.get(Nt);
          if (!Pt) continue;
          const Lt = Pt.getDomain(), Xt = Pt.kind === "log" ? Pt.scale(Lt.min) : Pt.scale(0), Jt = Pt.kind === "log" ? Pt.scale(Lt.max) : Pt.scale(1);
          Gt += `ya:${Nt}:${Xt},${Jt}|`;
        }
        if (Gt !== ke) {
          const qe = performance.now();
          if (vv({
            lastFullSignature: ke,
            lastContentSignature: Ke,
            nextFullSignature: Gt,
            nextContentSignature: De,
            nowMs: qe,
            lastUpdateMs: at
          }).shouldUpdate) {
            ke = Gt, Ke = De, at = qe, Uy(c, l, {
              gpuContext: e,
              currentOptions: g,
              xScale: Et,
              xTickValues: Wn,
              plotClipRect: vt,
              visibleXRangeMs: ha
            });
            const Pt = e.canvas;
            if (Pt) {
              const Lt = Fl(Pt), Xt = Od(Pt), Jt = Pt.offsetLeft || 0, Rt = Pt.offsetTop || 0;
              for (const Ln of g.yAxes) {
                const Vt = Ln.id, Mn = Ft.get(Vt);
                Mn && _y({
                  axisLabelOverlay: c,
                  overlayContainer: l,
                  yAxisConfig: Ln,
                  yScale: Mn,
                  plotClipRect: vt,
                  canvasCssWidth: Lt,
                  canvasCssHeight: Xt,
                  offsetX: Jt,
                  offsetY: Rt,
                  theme: g.theme,
                  yTickValues: xr.get(Vt)
                });
              }
            }
          }
        }
      }
      Gy(u, l, {
        currentOptions: g,
        xScale: Et,
        yScales: Ft,
        canvasCssWidthForAnnotations: vi,
        canvasCssHeightForAnnotations: Jn,
        plotLeftCss: yr,
        plotTopCss: gr,
        plotWidthCss: Cn,
        plotHeightCss: jt,
        canvas: _n
      });
      {
        const Re = _n, De = Re && Pr(Re) && Re.offsetLeft || 0, Gt = Re && Pr(Re) && Re.offsetTop || 0, qe = fN({
          priceLabelUi: xe,
          series: g.series,
          runtimeRawDataByIndex: G,
          yScales: Ft,
          yAxes: g.yAxes,
          plotClipRect: vt,
          // Same CSS size as annotation path so badge Y matches plot clip.
          canvasCssWidth: vi,
          canvasCssHeight: Jn,
          offsetX: De,
          offsetY: Gt,
          onWarn: Oe
        }), Nt = ze();
        Nt && (Nt.setDesired(qe.countdownDesired), Nt.setBarEndMs(qe.barEndMs));
      }
      Z && !y && Je();
    },
    dispose: () => {
      if (!y) {
        y = !0;
        try {
          Ud(i);
        } catch {
        }
        try {
          b && h.cancel(b), h.cancelAll();
        } catch {
        }
        b = null, A = "done", M = 1;
        try {
          F && x.cancel(F), x.cancelAll();
        } catch {
        }
        F = null, I = 1, R = null, ut(), Ot(), ie = !1, te.clear(), _e.clear(), Ee.clear(), Tr(Le), no(ge), ig(Se), X = null, z.clear(), $.clear(), D.length = 0, k.length = 0, W.length = 0, Kt == null || Kt.dispose(), Kt = null, An == null || An(), An = null, Bt = null, Nn = null, Ro.clear(), q == null || q.dispose(), Zt.dispose(), Ge.dispose(), Ji.dispose(), ct.dispose(), je == null || je.dispose(), pt.dispose(), Ye == null || Ye.dispose();
        for (const Y of St.values()) Y.dispose();
        St.clear();
        for (const Y of rt.values()) Y.dispose();
        rt.clear(), bt.dispose(), wt.dispose(), Dt.dispose(), Yt.dispose(), en.dispose(), Ie.dispose(), ve == null || ve.dispose(), ve = null, Ze(), xe == null || xe.dispose(), xe = null, d == null || d.dispose(), c == null || c.dispose(), u == null || u.dispose();
      }
    }
  };
}
const _l = (e, t, n) => Math.min(n, Math.max(t, e)), FN = (e) => {
  let { start: t, end: n } = e;
  if (t > n) {
    const i = t;
    t = n, n = i;
  }
  return { start: _l(t, 0, 100), end: _l(n, 0, 100) };
};
function AN(e, t, n) {
  const i = n == null ? void 0 : n.height, r = n == null ? void 0 : n.marginTop, o = (n == null ? void 0 : n.zIndex) ?? 4, s = (n == null ? void 0 : n.showPreview) ?? !1, a = document.createElement("div");
  a.style.display = "block", a.style.width = "100%", a.style.height = `${i}px`, a.style.marginTop = `${r}px`, a.style.boxSizing = "border-box", a.style.position = "relative", a.style.zIndex = `${o}`, a.style.userSelect = "none", a.style.touchAction = "none";
  const l = document.createElement("div");
  l.style.position = "relative", l.style.height = "100%", l.style.width = "100%", l.style.boxSizing = "border-box", l.style.borderRadius = "8px", l.style.borderStyle = "solid", l.style.borderWidth = "1px", l.style.overflow = "hidden", a.appendChild(l);
  const c = document.createElement("div");
  c.style.position = "absolute", c.style.inset = "0", c.style.pointerEvents = "none", c.style.opacity = "0.4", c.style.display = s ? "block" : "none", l.appendChild(c);
  const u = document.createElement("div");
  u.style.position = "absolute", u.style.top = "0", u.style.bottom = "0", u.style.left = "0%", u.style.width = "100%", u.style.boxSizing = "border-box", u.style.cursor = "grab", l.appendChild(u);
  const f = document.createElement("div");
  f.style.position = "absolute", f.style.left = "0", f.style.top = "0", f.style.bottom = "0", f.style.width = "10px", f.style.cursor = "ew-resize", u.appendChild(f);
  const d = document.createElement("div");
  d.style.position = "absolute", d.style.right = "0", d.style.top = "0", d.style.bottom = "0", d.style.width = "10px", d.style.cursor = "ew-resize", u.appendChild(d);
  const m = document.createElement("div");
  m.style.position = "absolute", m.style.left = "10px", m.style.right = "10px", m.style.top = "0", m.style.bottom = "0", m.style.cursor = "grab", u.appendChild(m), e.appendChild(a);
  let p = !1, y = null;
  const g = (N) => {
    const w = FN(N), P = _l(w.end - w.start, 0, 100);
    u.style.left = `${w.start}%`, u.style.width = `${P}%`;
  }, S = () => {
    const N = l.getBoundingClientRect().width;
    return Number.isFinite(N) && N > 0 ? N : null;
  }, A = (N) => {
    const w = S();
    if (w === null) return null;
    const P = N / w * 100;
    return Number.isFinite(P) ? P : null;
  }, M = (N, w) => {
    try {
      N.setPointerCapture(w);
    } catch {
    }
  }, h = (N, w) => {
    try {
      N.releasePointerCapture(w);
    } catch {
    }
  }, b = (N, w) => {
    if (p || N.button !== 0) return;
    N.preventDefault(), y == null || y(), y = null;
    const P = N.clientX, B = t.getRange(), _ = N.currentTarget instanceof Element ? N.currentTarget : u;
    M(_, N.pointerId), w === "pan-window" && (u.style.cursor = "grabbing", m.style.cursor = "grabbing");
    const C = (O) => {
      if (p || O.pointerId !== N.pointerId) return;
      O.preventDefault();
      const D = A(O.clientX - P);
      if (D !== null)
        switch (w) {
          case "left-handle": {
            const k = Math.min(B.end, B.start + D), W = t;
            W.setRangeAnchored ? W.setRangeAnchored(k, B.end, "end") : t.setRange(k, B.end);
            return;
          }
          case "right-handle": {
            const k = Math.max(B.start, B.end + D), W = t;
            W.setRangeAnchored ? W.setRangeAnchored(B.start, k, "start") : t.setRange(B.start, k);
            return;
          }
          case "pan-window": {
            t.setRange(B.start + D, B.end + D);
            return;
          }
        }
    };
    let E = !1;
    const U = () => {
      E || (E = !0, window.removeEventListener("pointermove", C), window.removeEventListener("pointerup", G), window.removeEventListener("pointercancel", G), w === "pan-window" && (u.style.cursor = "grab", m.style.cursor = "grab"), h(_, N.pointerId), y === U && (y = null));
    }, G = (O) => {
      O.pointerId === N.pointerId && U();
    };
    y = U, window.addEventListener("pointermove", C, { passive: !1 }), window.addEventListener("pointerup", G, { passive: !0 }), window.addEventListener("pointercancel", G, { passive: !0 });
  }, v = (N) => b(N, "left-handle"), x = (N) => b(N, "right-handle"), F = (N) => b(N, "pan-window");
  f.addEventListener("pointerdown", v, { passive: !1 }), d.addEventListener("pointerdown", x, { passive: !1 }), m.addEventListener("pointerdown", F, { passive: !1 });
  const I = t.onChange((N) => {
    p || g(N);
  });
  return g(t.getRange()), { update: (N) => {
    if (p) return;
    l.style.background = N.backgroundColor, l.style.borderColor = N.axisLineColor, c.style.background = N.gridLineColor, u.style.background = N.gridLineColor, u.style.border = `1px solid ${N.axisTickColor}`, u.style.borderRadius = "8px", u.style.boxSizing = "border-box";
    const w = `1px solid ${N.axisLineColor}`;
    f.style.background = N.axisTickColor, f.style.borderRight = w, d.style.background = N.axisTickColor, d.style.borderLeft = w, m.style.background = "transparent", m.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,0.0) 0, rgba(255,255,255,0.0) 42%, rgba(255,255,255,0.18) 42%, rgba(255,255,255,0.18) 46%, rgba(255,255,255,0.0) 46%, rgba(255,255,255,0.0) 54%, rgba(255,255,255,0.18) 54%, rgba(255,255,255,0.18) 58%, rgba(255,255,255,0.0) 58%, rgba(255,255,255,0.0) 100%)", m.style.mixBlendMode = "normal";
  }, dispose: () => {
    if (!p) {
      p = !0, y == null || y(), y = null;
      try {
        I();
      } catch {
      }
      f.removeEventListener("pointerdown", v), d.removeEventListener("pointerdown", x), m.removeEventListener("pointerdown", F), a.remove();
    }
  } };
}
const $f = 0.01, IN = (e, t) => e <= $f && t >= 100 - $f, PN = () => typeof navigator < "u" && navigator.maxTouchPoints > 0;
function TN(e, t, n) {
  let i = !1;
  const r = PN(), o = document.createElement("button");
  o.setAttribute("data-chartgpu-zoom-reset", ""), o.setAttribute("aria-label", "Reset zoom"), o.type = "button", o.style.position = "absolute", o.style.top = "8px", o.style.right = "8px", o.style.zIndex = "10", o.style.width = "32px", o.style.height = "32px", o.style.border = "none", o.style.borderRadius = "6px", o.style.cursor = "pointer", o.style.display = "none", o.style.alignItems = "center", o.style.justifyContent = "center", o.style.fontSize = "16px", o.style.lineHeight = "1", o.style.padding = "0", o.style.touchAction = "manipulation", o.textContent = "↺";
  const s = (u) => {
    o.style.backgroundColor = u.backgroundColor, o.style.opacity = "0.8", o.style.color = u.textColor;
  };
  s(n);
  const a = () => {
    if (!r) {
      o.style.display = "none";
      return;
    }
    const { start: u, end: f } = t.getRange();
    o.style.display = IN(u, f) ? "none" : "flex";
  };
  a();
  const l = () => {
    i || t.setRange(0, 100);
  };
  o.addEventListener("click", l);
  const c = t.onChange(() => {
    i || a();
  });
  return e.appendChild(o), {
    update(u) {
      i || s(u);
    },
    dispose() {
      if (!i) {
        i = !0, o.removeEventListener("click", l);
        try {
          c();
        } catch {
        }
        o.remove();
      }
    }
  };
}
let us = null;
async function BN() {
  return us || (us = (async () => {
    if (typeof window > "u")
      return {
        supported: !1,
        reason: "Not running in a browser environment (window is undefined)."
      };
    if (typeof navigator > "u")
      return {
        supported: !1,
        reason: "Navigator is not available in this environment."
      };
    if (!navigator.gpu)
      return {
        supported: !1,
        reason: "WebGPU API (navigator.gpu) is not available. Your browser does not support WebGPU."
      };
    try {
      let e = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance"
      });
      return e || (e = await navigator.gpu.requestAdapter()), e ? (e = null, { supported: !0 }) : {
        supported: !1,
        reason: "No compatible WebGPU adapter found. This may occur if: (1) no GPU is available, (2) GPU drivers are outdated or incompatible, (3) running in a VM or headless environment, or (4) WebGPU is disabled in browser settings."
      };
    } catch (e) {
      let t = "Failed to request WebGPU adapter.";
      return e instanceof DOMException ? (t = `Failed to request WebGPU adapter: ${e.name}`, e.message && (t += ` - ${e.message}`)) : e instanceof Error ? t = `Failed to request WebGPU adapter: ${e.message}` : t = `Failed to request WebGPU adapter: ${String(e)}`, { supported: !1, reason: t };
    }
  })(), us);
}
const As = /* @__PURE__ */ new Set();
let qf = !1;
function RN() {
  const e = [...As];
  for (const t of e)
    try {
      t.dispose();
    } catch {
    }
}
function DN(e) {
  e.persisted || RN();
}
function jf() {
  qf || typeof window > "u" || typeof window.addEventListener != "function" || (qf = !0, window.addEventListener("pagehide", DN));
}
const li = 120, kN = 1e3 / 60, EN = 1.5, LN = 6, UN = 500, _N = (e) => Array.isArray(e), Hr = (e) => Array.isArray(e), Zf = (e) => _N(e) ? { x: e[0], y: e[1] } : { x: e.x, y: e.y }, gl = (e) => {
  const t = $e(e);
  if (t === 0) return { x: [], y: [] };
  const n = new Array(t), i = new Array(t), r = [];
  let o = !1;
  for (let s = 0; s < t; s++) {
    n[s] = Te(e, s), i[s] = ht(e, s);
    const a = Sn(e, s);
    r[s] = a, a !== void 0 && (o = !0);
  }
  return o ? { x: n, y: i, size: r } : { x: n, y: i };
}, Er = (e) => Hr(e) ? e[0] : e.timestamp, Kf = (e) => Hr(e) ? e[2] : e.close, zN = (e) => {
  var t;
  return ((t = e.dataZoom) == null ? void 0 : t.some((n) => (n == null ? void 0 : n.type) === "slider")) ?? !1;
}, GN = (e) => {
  var t;
  return ((t = e.dataZoom) == null ? void 0 : t.some((n) => (n == null ? void 0 : n.type) === "inside")) ?? !1;
}, xl = (e, t, n) => Math.min(n, Math.max(t, e)), Jf = (e, t) => {
  const n = $e(t);
  if (n === 0) return e;
  let i = e;
  if (!i)
    return Rn(t);
  let r = i.xMin, o = i.xMax, s = i.yMin, a = i.yMax;
  const l = typeof t == "object" && t !== null && !Array.isArray(t) && "x" in t && "y" in t, c = typeof t == "object" && t !== null && !Array.isArray(t) && ArrayBuffer.isView(t);
  if (l) {
    const u = t;
    for (let f = 0; f < n; f++) {
      const d = u.x[f], m = u.y[f];
      !Number.isFinite(d) || !Number.isFinite(m) || (d < r && (r = d), d > o && (o = d), m < s && (s = m), m > a && (a = m));
    }
  } else if (c) {
    const u = t;
    for (let f = 0; f < n; f++) {
      const d = u[f * 2], m = u[f * 2 + 1];
      !Number.isFinite(d) || !Number.isFinite(m) || (d < r && (r = d), d > o && (o = d), m < s && (s = m), m > a && (a = m));
    }
  } else
    for (let u = 0; u < n; u++) {
      const f = Te(t, u), d = ht(t, u);
      !Number.isFinite(f) || !Number.isFinite(d) || (f < r && (r = f), f > o && (o = f), d < s && (s = d), d > a && (a = d));
    }
  return r === o && (o = r + 1), s === a && (a = s + 1), { xMin: r, xMax: o, yMin: s, yMax: a };
}, bl = (e, t) => {
  if (t.length === 0) return e;
  let n = (e == null ? void 0 : e.xMin) ?? Number.POSITIVE_INFINITY, i = (e == null ? void 0 : e.xMax) ?? Number.NEGATIVE_INFINITY, r = (e == null ? void 0 : e.yMin) ?? Number.POSITIVE_INFINITY, o = (e == null ? void 0 : e.yMax) ?? Number.NEGATIVE_INFINITY;
  for (let s = 0; s < t.length; s++) {
    const a = t[s], l = Er(a), c = Hr(a) ? a[3] : a.low, u = Hr(a) ? a[4] : a.high;
    !Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(u) || (l < n && (n = l), l > i && (i = l), c < r && (r = c), u > o && (o = u));
  }
  return !Number.isFinite(n) || !Number.isFinite(i) || !Number.isFinite(r) || !Number.isFinite(o) ? e : (n === i && (i = n + 1), r === o && (o = r + 1), { xMin: n, xMax: i, yMin: r, yMax: o });
}, uo = (e, t) => {
  let n = Number.POSITIVE_INFINITY, i = Number.NEGATIVE_INFINITY, r = Number.POSITIVE_INFINITY, o = Number.NEGATIVE_INFINITY;
  for (let s = 0; s < e.length; s++) {
    const a = e[s];
    if (a.type === "pie") continue;
    const l = (t == null ? void 0 : t[s]) ?? null;
    if (l) {
      const f = l;
      if (Number.isFinite(f.xMin) && Number.isFinite(f.xMax) && Number.isFinite(f.yMin) && Number.isFinite(f.yMax)) {
        f.xMin < n && (n = f.xMin), f.xMax > i && (i = f.xMax), f.yMin < r && (r = f.yMin), f.yMax > o && (o = f.yMax);
        continue;
      }
    }
    const c = a.rawBounds ?? null;
    if (c) {
      const f = c;
      if (Number.isFinite(f.xMin) && Number.isFinite(f.xMax) && Number.isFinite(f.yMin) && Number.isFinite(f.yMax)) {
        f.xMin < n && (n = f.xMin), f.xMax > i && (i = f.xMax), f.yMin < r && (r = f.yMin), f.yMax > o && (o = f.yMax);
        continue;
      }
    }
    if (a.type === "candlestick" || a.type === "ohlc") {
      const f = a.data;
      for (let d = 0; d < f.length; d++) {
        const m = f[d], p = Er(m), y = Hr(m) ? m[3] : m.low, g = Hr(m) ? m[4] : m.high;
        !Number.isFinite(p) || !Number.isFinite(y) || !Number.isFinite(g) || (p < n && (n = p), p > i && (i = p), y < r && (r = y), g > o && (o = g));
      }
      continue;
    }
    if (a.type === "band") {
      const f = qn(a.rawData ?? a.data);
      if (!f) continue;
      f.xMin < n && (n = f.xMin), f.xMax > i && (i = f.xMax), f.yMin < r && (r = f.yMin), f.yMax > o && (o = f.yMax);
      continue;
    }
    if (a.type === "errorBar") {
      const f = a.direction === "horizontal" ? "horizontal" : "vertical", d = hi(a.rawData ?? a.data, f);
      if (!d) continue;
      d.xMin < n && (n = d.xMin), d.xMax > i && (i = d.xMax), d.yMin < r && (r = d.yMin), d.yMax > o && (o = d.yMax);
      continue;
    }
    if (a.type === "impulse") {
      const f = typeof a.baseline == "number" && Number.isFinite(a.baseline) ? a.baseline : 0, d = Gr(a.rawData ?? a.data, f);
      if (!d) continue;
      d.xMin < n && (n = d.xMin), d.xMax > i && (i = d.xMax), d.yMin < r && (r = d.yMin), d.yMax > o && (o = d.yMax);
      continue;
    }
    const u = Rn(a.data);
    u && (u.xMin < n && (n = u.xMin), u.xMax > i && (i = u.xMax), u.yMin < r && (r = u.yMin), u.yMax > o && (o = u.yMax));
  }
  return !Number.isFinite(n) || !Number.isFinite(i) || !Number.isFinite(r) || !Number.isFinite(o) ? { xMin: 0, xMax: 1, yMin: 0, yMax: 1 } : (n === i && (i = n + 1), r === o && (o = r + 1), { xMin: n, xMax: i, yMin: r, yMax: o });
}, ir = (e, t) => {
  let n = e, i = t;
  if ((!Number.isFinite(n) || !Number.isFinite(i)) && (n = 0, i = 1), n === i)
    i = n + 1;
  else if (n > i) {
    const r = n;
    n = i, i = r;
  }
  return { min: n, max: i };
}, So = (e, t) => {
  if (typeof e == "number") return Number.isFinite(e) ? e : null;
  if (typeof e != "string") return null;
  const n = e.trim();
  if (n.length === 0) return null;
  if (n.endsWith("%")) {
    const r = Number.parseFloat(n.slice(0, -1));
    return Number.isFinite(r) ? r / 100 * t : null;
  }
  const i = Number.parseFloat(n);
  return Number.isFinite(i) ? i : null;
}, Qf = (e, t, n) => {
  const i = (e == null ? void 0 : e[0]) ?? "50%", r = (e == null ? void 0 : e[1]) ?? "50%", o = So(i, t), s = So(r, n);
  return {
    x: Number.isFinite(o) ? o : t * 0.5,
    y: Number.isFinite(s) ? s : n * 0.5
  };
}, ON = (e) => Array.isArray(e), ed = (e, t) => {
  if (e == null) return { inner: 0, outer: t * 0.7 };
  if (ON(e)) {
    const r = So(e[0], t), o = So(e[1], t), s = Math.max(0, Number.isFinite(r) ? r : 0), a = Math.max(s, Number.isFinite(o) ? o : t * 0.7);
    return { inner: s, outer: Math.min(t, a) };
  }
  const n = So(e, t), i = Math.max(0, Number.isFinite(n) ? n : t * 0.7);
  return { inner: 0, outer: Math.min(t, i) };
};
async function HN(e, t, n) {
  var en;
  if (t.coordinateSystem === "cartesian3d") {
    const { createChartGPU3D: H } = await import("./createChartGPU3D-BcKKfBzM.js");
    return H(e, t, n, (q) => {
      As.add(q), jf();
    });
  }
  if (n) {
    if (typeof navigator > "u" || !navigator.gpu)
      throw new Error("ChartGPU: Shared device mode requires WebGPU globals (navigator.gpu) to be available.");
  } else {
    const H = await BN();
    if (!H.supported) {
      const q = H.reason || "Unknown reason";
      throw new Error(
        `ChartGPU: WebGPU is not available.
Reason: ${q}
Browser support: Chrome/Edge 113+, Safari 18+, Firefox not yet supported.
Resources:
  - MDN WebGPU API: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
  - Browser compatibility: https://caniuse.com/webgpu
  - WebGPU specification: https://www.w3.org/TR/webgpu/
  - Check your system: https://webgpureport.org/`
      );
    }
  }
  if (n != null && n.pipelineCache && n.pipelineCache.device !== n.device)
    throw new Error(
      "ChartGPU: pipelineCache.device must match the GPUDevice in the creation context. Create the pipeline cache with the same device: createPipelineCache(device)."
    );
  const i = document.createElement("canvas");
  i.style.display = "block", i.style.width = "100%", i.style.height = "100%", e.appendChild(i);
  const r = !!n;
  let o = !1, s = t.renderMode ?? "auto", a = !1, l = !1, c = null, u = null, f = null, d = null, m = null, p, y = !1, g = null, S = null, A = null, M = t, h = qc(M);
  const b = (() => {
    const H = t.devicePixelRatio;
    return typeof H == "number" && Number.isFinite(H) && H > 0 ? H : null;
  })();
  let v = M.series ? M.series.slice() : null, x = !1, F = 0;
  const I = Symbol("chartgpu.hitTestOwned");
  let R = new Array(
    h.series.length
  ).fill(null).map(() => ({ x: [], y: [] })), T = new Array(h.series.length).fill(null), N = new Array(h.series.length).fill(null), w = new Array(h.series.length).fill(null), P = new Array(h.series.length).fill(null), B = null;
  const _ = () => {
    if (!u || !x) return;
    const H = h.series.length, q = new Array(H), ue = new Array(H), he = new Array(H), Fe = new Array(H).fill(null), et = new Array(H);
    for (let pe = 0; pe < H; pe++) {
      const Ne = h.series[pe], Je = Ne.type === "pie" || Ne.type === "heatmap" ? null : Ne.rawData ?? Ne.data;
      if (Ne.type === "pie" || Ne.type === "heatmap") {
        q[pe] = { x: [], y: [] }, ue[pe] = Ne.type === "heatmap" ? Ne.rawBounds ?? null : null, he[pe] = null, Fe[pe] = null, et[pe] = null;
        continue;
      }
      const We = u.getRuntimeSeriesData(pe), ut = u.getRuntimeSeriesBounds(pe);
      if (We == null) {
        if (Ne.type === "candlestick" || Ne.type === "ohlc") {
          const st = Ne.data ?? [];
          q[pe] = st.length === 0 ? [] : st.slice(), ue[pe] = Ne.rawBounds ?? null;
        } else if (Ne.type === "band") {
          const st = Ne.data ?? { x: [], y: [], y1: [] };
          q[pe] = ui(go(st)), ue[pe] = Ne.rawBounds ?? qn(st) ?? null;
        } else if (Ne.type === "errorBar") {
          const st = Ne.data ?? { x: [], y: [], high: [], low: [] };
          q[pe] = Dr(st);
          const Ut = Ne.direction === "horizontal" ? "horizontal" : "vertical";
          ue[pe] = Ne.rawBounds ?? hi(st, Ut) ?? null;
        } else {
          const st = Ne.data ?? [];
          q[pe] = gl(st), ue[pe] = Rn(st);
        }
        he[pe] = I, et[pe] = Je;
        continue;
      }
      if (Ne.type === "candlestick" || Ne.type === "ohlc") {
        const st = We;
        q[pe] = st.length === 0 ? [] : st.slice();
      } else if (Ne.type === "band")
        q[pe] = ui(go(We));
      else if (Ne.type === "errorBar")
        q[pe] = Dr(We);
      else if (hn(We)) {
        const st = We, Ut = st.size != null, ye = yo(st.capacity, Ut);
        for (let Ce = 0; Ce < st.count; Ce++)
          if (ye.x[Ce] = Te(st, Ce), ye.y[Ce] = ht(st, Ce), ye.size) {
            const tt = Sn(st, Ce);
            ye.size[Ce] = typeof tt == "number" && Number.isFinite(tt) ? tt : Number.NaN;
          }
        ye.start = 0, ye.count = st.count, q[pe] = ye;
      } else bn(We) ? q[pe] = cd(We) : q[pe] = gl(We);
      if (ut)
        ue[pe] = ut;
      else if (Ne.type === "band")
        ue[pe] = qn(q[pe]) ?? Ne.rawBounds ?? null;
      else if (Ne.type === "errorBar") {
        const st = Ne.direction === "horizontal" ? "horizontal" : "vertical";
        ue[pe] = hi(q[pe], st) ?? Ne.rawBounds ?? null;
      } else Ne.type === "candlestick" || Ne.type === "ohlc" ? ue[pe] = bl(null, q[pe]) ?? Ne.rawBounds ?? null : ue[pe] = Rn(
        q[pe]
      );
      he[pe] = I, et[pe] = Je, Fe[pe] = Ne.rawBoundsMode ?? null;
    }
    R = q, T = ue, N = he, w = et, P = Fe, x = !1, B = null, U = uo(h.series, T), G = null;
  }, C = () => {
    var Ut;
    if (x && ((Ut = h.tooltip) == null ? void 0 : Ut.show) !== !1 && u) {
      _(), B = null;
      return;
    }
    F++;
    const H = h.series.length, q = R, ue = T, he = N, Fe = q.length, et = new Array(H), pe = new Array(H), Ne = new Array(H), Je = new Array(H), We = new Array(H), ut = P, st = w;
    for (let ye = 0; ye < H; ye++) {
      const Ce = h.series[ye], tt = Ce.rawBoundsMode ?? null;
      if (Ce.type === "pie" || Ce.type === "heatmap") {
        et[ye] = { x: [], y: [] }, pe[ye] = Ce.type === "heatmap" ? Ce.rawBounds ?? null : null, Ne[ye] = null, Je[ye] = null, We[ye] = null;
        continue;
      }
      if (Ce.type === "errorBar") {
        const ot = Ce.rawData ?? Ce.data, _t = Ce.rawBounds ?? null, He = Ce.direction === "horizontal" ? "horizontal" : "vertical", Ct = ye < Fe ? q[ye] : null, ln = ye < Fe && he[ye] === I, Bt = ye < Fe && st[ye] === ot, Kt = Ct != null && typeof Ct == "object" && !Array.isArray(Ct) && "high" in Ct && "low" in Ct, An = ln && Kt && Bt && !x, Nn = ye < Fe && he[ye] === ot && Kt && !x;
        if (An || Nn) {
          et[ye] = q[ye], Ne[ye] = ln ? I : ot, We[ye] = ot, tt != null && ut[ye] != null && tt !== ut[ye] ? pe[ye] = hi(q[ye], He) ?? _t ?? null : pe[ye] = ue[ye] ?? _t ?? null, Je[ye] = tt;
          continue;
        }
        et[ye] = Dr(ot), pe[ye] = _t ?? hi(ot, He) ?? null, Ne[ye] = ot, We[ye] = ot, Je[ye] = tt;
        continue;
      }
      if (Ce.type === "band") {
        const ot = Ce.rawData ?? Ce.data, _t = Ce.rawBounds ?? null, He = ye < Fe ? q[ye] : null, Ct = ye < Fe && he[ye] === I, ln = ye < Fe && st[ye] === ot, Bt = He != null && typeof He == "object" && !Array.isArray(He) && "y1" in He, Kt = Ct && Bt && ln && !x, An = ye < Fe && he[ye] === ot && Bt && !x;
        if (Kt || An)
          et[ye] = q[ye], Ne[ye] = Ct ? I : ot, We[ye] = ot, tt != null && ut[ye] != null && tt !== ut[ye] ? pe[ye] = qn(
            ui(
              q[ye]
            )
          ) ?? _t ?? ue[ye] ?? null : pe[ye] = ue[ye] ?? _t ?? null;
        else {
          const Nn = go(ot);
          et[ye] = ui(Nn), pe[ye] = _t ?? qn(ot) ?? null, Ne[ye] = ot, We[ye] = ot;
        }
        Je[ye] = tt;
        continue;
      }
      if (Ce.type === "candlestick" || Ce.type === "ohlc") {
        const ot = Ce.rawData ?? Ce.data, _t = Ce.rawBounds ?? null;
        ye < Fe && he[ye] === ot && q[ye] != null && Array.isArray(q[ye]) ? (et[ye] = q[ye], pe[ye] = ue[ye] ?? _t ?? null, Ne[ye] = ot, We[ye] = ot) : ye < Fe && he[ye] === I && st[ye] === ot && q[ye] != null && Array.isArray(q[ye]) ? (et[ye] = q[ye], pe[ye] = ue[ye] ?? _t ?? null, Ne[ye] = I, We[ye] = ot) : (et[ye] = ot.length === 0 ? [] : ot.slice(), pe[ye] = _t, Ne[ye] = ot, We[ye] = ot), Je[ye] = tt;
        continue;
      }
      const Ve = Ce.rawData ?? Ce.data, dt = Ce.rawBounds ?? null, ft = ye < Fe ? q[ye] : null, gt = ye < Fe && he[ye] === I, kt = ye < Fe && st[ye] === Ve, tn = gt && ft != null && !Array.isArray(ft) && kt && !x, qt = ye < Fe && he[ye] === Ve && q[ye] != null && !Array.isArray(q[ye]) && !x;
      tn || qt ? (et[ye] = q[ye], Ne[ye] = gt ? I : Ve, We[ye] = Ve, tt != null && ut[ye] != null && tt !== ut[ye] ? pe[ye] = Rn(q[ye]) ?? dt ?? ue[ye] ?? null : pe[ye] = ue[ye] ?? dt ?? null) : (et[ye] = gl(Ve), pe[ye] = dt ?? Rn(Ve), Ne[ye] = Ve, We[ye] = Ve), Je[ye] = tt;
    }
    R = et, T = pe, N = Ne, w = We, P = Je, B = null;
  }, E = () => B || (B = h.series.map((H, q) => {
    if (H.type === "pie" || H.type === "heatmap") return H;
    if (H.type === "candlestick" || H.type === "ohlc")
      return {
        ...H,
        data: R[q] ?? H.data
      };
    if (H.type === "band") {
      const he = R[q];
      return he != null && typeof he == "object" && !Array.isArray(he) && "y1" in he ? { ...H, data: he } : { ...H, data: H.rawData ?? H.data };
    }
    if (H.type === "errorBar") {
      const he = R[q];
      return he != null && typeof he == "object" && !Array.isArray(he) && "high" in he && "low" in he ? { ...H, data: he } : { ...H, data: H.rawData ?? H.data };
    }
    const ue = R[q];
    return { ...H, data: ue };
  }), B);
  C();
  let U = uo(h.series, T), G = null;
  const O = {
    click: /* @__PURE__ */ new Set(),
    mouseover: /* @__PURE__ */ new Set(),
    mouseout: /* @__PURE__ */ new Set(),
    crosshairMove: /* @__PURE__ */ new Set(),
    zoomRangeChange: /* @__PURE__ */ new Set(),
    deviceLost: /* @__PURE__ */ new Set(),
    dataAppend: /* @__PURE__ */ new Set()
  };
  let D = !1, k = null, W = null, j = null;
  const ee = /* @__PURE__ */ new Set();
  let fe = null, X = null, z = !0;
  const $ = new Float64Array(li);
  let Z = 0, Q = 0, K = 0, ne = 0, L = 0, le = 0;
  const se = performance.now();
  let ae = 0, de = 0;
  const re = /* @__PURE__ */ new Set(), ie = () => O.mouseover.size > 0 || O.mouseout.size > 0, be = () => O.click.size > 0, te = () => {
    fe !== null && (cancelAnimationFrame(fe), fe = null);
  }, Be = () => {
    ae = 0, ne = 0, L = 0, le = 0, Z = 0, Q = 0;
  }, Me = (H) => {
    if (o || l || a) return;
    a = !0;
    const q = performance.now();
    try {
      if ($[Z] = q, Z = (Z + 1) % li, Q < li && Q++, K++, H && (ae > 0 && (q - ae > kN * EN ? (ne++, L++, le = q) : L = 0), ae = q), Mt(!1), !u || !(c != null && c.device)) return;
      if (z) {
        z = !1;
        try {
          u.render();
        } catch {
          z = !0;
        }
      }
      de = performance.now() - q;
      const ue = nt();
      for (const he of re)
        try {
          he(ue);
        } catch (Fe) {
          console.error("Error in performance update callback:", Fe);
        }
    } finally {
      a = !1;
    }
  }, _e = () => {
    o || (z = !0, s !== "external" && fe === null && (fe = requestAnimationFrame(() => {
      fe = null, !o && Me(!0);
    })));
  }, Le = () => {
    if (d)
      try {
        d();
      } finally {
        d = null;
      }
  }, ge = () => {
    if (m)
      try {
        m();
      } finally {
        m = null;
      }
  }, Ee = () => {
    S == null || S.dispose(), S = null;
  }, Se = () => {
    g == null || g.remove(), g = null;
  }, ve = () => {
    Ee(), Se();
  }, xe = 32, Pe = 8, Oe = xe + Pe, Xe = () => {
    if (g) return g;
    try {
      window.getComputedStyle(e).position === "static" && (e.style.position = "relative");
    } catch {
    }
    const H = document.createElement("div");
    return H.style.position = "absolute", H.style.left = "0", H.style.right = "0", H.style.bottom = "0", H.style.height = `${Oe}px`, H.style.paddingTop = `${Pe}px`, H.style.boxSizing = "border-box", H.style.pointerEvents = "auto", H.style.zIndex = "5", e.appendChild(H), g = H, H;
  }, Ze = (H, q) => {
    const ue = H.end - H.start;
    return !Number.isFinite(ue) || ue === 0 ? 0.5 : xl((q - H.start) / ue, 0, 1);
  }, ze = () => ({ getRange: () => (u == null ? void 0 : u.getZoomRange()) ?? { start: 0, end: 100 }, setRange: (pe, Ne) => {
    u == null || u.setZoomRange(pe, Ne);
  }, zoomIn: (pe, Ne) => {
    if (!Number.isFinite(pe) || !Number.isFinite(Ne) || Ne <= 1) return;
    const Je = u == null ? void 0 : u.getZoomRange();
    if (!Je) return;
    const We = xl(pe, 0, 100), ut = Ze(Je, We), Ut = (Je.end - Je.start) / Ne, ye = We - ut * Ut;
    u == null || u.setZoomRange(ye, ye + Ut);
  }, zoomOut: (pe, Ne) => {
    if (!Number.isFinite(pe) || !Number.isFinite(Ne) || Ne <= 1) return;
    const Je = u == null ? void 0 : u.getZoomRange();
    if (!Je) return;
    const We = xl(pe, 0, 100), ut = Ze(Je, We), Ut = (Je.end - Je.start) * Ne, ye = We - ut * Ut;
    u == null || u.setZoomRange(ye, ye + Ut);
  }, pan: (pe) => {
    if (!Number.isFinite(pe)) return;
    const Ne = u == null ? void 0 : u.getZoomRange();
    Ne && (u == null || u.setZoomRange(Ne.start + pe, Ne.end + pe));
  }, onChange: (pe) => (u == null ? void 0 : u.onZoomRangeChange(pe)) ?? (() => {
  }) }), Ue = () => {
    if (!zN(M)) {
      ve();
      return;
    }
    if (!u || !u.getZoomRange()) return;
    const q = Xe();
    S || (S = AN(q, ze(), {
      height: xe,
      marginTop: 0
      // host provides vertical spacing
    })), S.update(h.theme);
  }, Ae = () => {
    A == null || A.dispose(), A = null;
  }, Qe = () => {
    if (!GN(M)) {
      Ae();
      return;
    }
    u && u.getZoomRange() && (A ? A.update(h.theme) : A = TN(e, ze(), h.theme));
  }, At = {
    x: null,
    source: void 0
  }, It = {
    start: 0,
    end: 100,
    source: void 0,
    sourceKind: void 0
  }, Tt = {
    seriesIndex: 0,
    count: 0,
    xExtent: { min: 0, max: 0 }
  }, Ot = () => {
    Le(), !o && u && (d = u.onInteractionXChange((H, q) => {
      At.x = H, At.source = q, je("crosshairMove", At);
    }));
  }, Ht = () => {
    ge(), !o && u && (m = u.onZoomRangeChange((H, q) => {
      const ue = y, he = p;
      y = !1, p = void 0;
      const Fe = he !== void 0 ? he : void 0, et = q ?? (ue ? "api" : void 0);
      It.start = H.start, It.end = H.end, It.source = Fe, It.sourceKind = et, je("zoomRangeChange", It);
    }));
  }, xt = () => {
    if (o || !c || !c.initialized) return;
    const H = (u == null ? void 0 : u.getZoomRange()) ?? null;
    Le(), ge(), Ee(), Ae(), u == null || u.dispose(), y = !1, p = void 0;
    const q = {
      onRequestRender: _e,
      pipelineCache: n == null ? void 0 : n.pipelineCache
    };
    u = CN(
      c,
      {
        ...h,
        devicePixelRatio: b ?? void 0
      },
      q
    ), f = c.preferredFormat, Ot(), Ht(), H && u.setZoomRange(H.start, H.end), Ue(), Qe();
  }, $t = () => b ?? ((typeof window < "u" ? window.devicePixelRatio : 1) || 1), Mt = (H) => {
    var Ut;
    if (o) return;
    const q = i.clientWidth, ue = i.clientHeight, he = $t();
    c && c.setDevicePixelRatio(he);
    const Fe = ((Ut = c == null ? void 0 : c.device) == null ? void 0 : Ut.limits.maxTextureDimension2D) ?? 8192, et = Math.min(Fe, Math.max(1, Math.round(q * he))), pe = Math.min(Fe, Math.max(1, Math.round(ue * he))), Ne = i.width !== et || i.height !== pe;
    Ne && (i.width = et, i.height = pe);
    const Je = c == null ? void 0 : c.device, We = c == null ? void 0 : c.canvasContext, ut = c == null ? void 0 : c.preferredFormat;
    let st = !1;
    Je && We && ut && (Ne || !X || X.width !== i.width || X.height !== i.height || X.format !== ut) && (We.configure({
      device: Je,
      format: ut,
      alphaMode: "opaque"
    }), X = {
      width: i.width,
      height: i.height,
      format: ut
    }, st = !0, u && f !== ut && xt()), H && (Ne || st) && _e();
  }, we = () => Mt(!0), Ie = (H, q, ue) => {
    var We;
    const he = ((We = h.yAxes[0]) == null ? void 0 : We.id) ?? "y";
    if (H === he) return q;
    const Fe = h.yAxes.find((ut) => (ut.id ?? "y") === H) ?? h.yAxes[0] ?? { type: "value" };
    let et = Number.POSITIVE_INFINITY, pe = Number.NEGATIVE_INFINITY;
    const Ne = E();
    for (let ut = 0; ut < Ne.length; ut++) {
      const st = Ne[ut];
      if (st.visible === !1 || (st.yAxis || "y") !== H) continue;
      const ye = T[ut] ?? st.rawBounds ?? null;
      ye && (Number.isFinite(ye.yMin) && ye.yMin < et && (et = ye.yMin), Number.isFinite(ye.yMax) && ye.yMax > pe && (pe = ye.yMax));
    }
    (!Number.isFinite(et) || !Number.isFinite(pe)) && (et = U.yMin, pe = U.yMax), typeof Fe.min == "number" && Number.isFinite(Fe.min) && (et = Fe.min), typeof Fe.max == "number" && Number.isFinite(Fe.max) && (pe = Fe.max);
    const Je = ir(et, pe);
    return Pi(Fe).domain(Je.min, Je.max).range(ue, 0);
  }, ke = (H, q, ue, he, Fe, et) => {
    const pe = E();
    for (let Ne = pe.length - 1; Ne >= 0; Ne--) {
      const Je = pe[Ne];
      if (Je.type !== "errorBar" || Je.visible === !1) continue;
      const We = Je, ut = We.yAxis || "y", st = Ie(ut, he, et), Ut = vm([{ seriesIndex: Ne, series: We }], H, q, ue, st, {
        width: Fe,
        height: et
      });
      if (Ut)
        return {
          kind: "errorBar",
          seriesIndex: Ut.seriesIndex,
          dataIndex: Ut.dataIndex,
          point: Ut.point
        };
    }
    return null;
  }, Ke = (H, q, ue, he, Fe, et) => {
    const pe = E();
    for (let Ne = pe.length - 1; Ne >= 0; Ne--) {
      const Je = pe[Ne];
      if (Je.type !== "impulse" || Je.visible === !1) continue;
      const We = Je, ut = We.yAxis || "y", st = Ie(ut, he, et), Ut = wm([{ seriesIndex: Ne, series: We }], H, q, ue, st, {
        width: Fe,
        height: et
      });
      if (Ut)
        return {
          kind: "impulse",
          seriesIndex: Ut.seriesIndex,
          dataIndex: Ut.dataIndex,
          point: { x: Ut.x, y: Ut.y, baseline: Ut.baseline }
        };
    }
    return null;
  }, at = (H) => {
    var ot, _t;
    const q = Ri(i, H.clientX, H.clientY);
    if (!q) return { match: null, isInGrid: !1 };
    const ue = q.x, he = q.y, Fe = h.grid.left, et = h.grid.top, pe = q.layoutWidth - h.grid.left - h.grid.right, Ne = q.layoutHeight - h.grid.top - h.grid.bottom;
    if (!(pe > 0) || !(Ne > 0)) return { match: null, isInGrid: !1 };
    const Je = ue - Fe, We = he - et;
    if (!(Je >= 0 && Je <= pe && We >= 0 && We <= Ne)) return { match: null, isInGrid: !1 };
    const st = h.xAxis.min ?? U.xMin, Ut = h.xAxis.max ?? U.xMax, ye = ((ot = h.yAxes[0]) == null ? void 0 : ot.min) ?? U.yMin, Ce = ((_t = h.yAxes[0]) == null ? void 0 : _t.max) ?? U.yMax, tt = ir(st, Ut), Ve = (u == null ? void 0 : u.getZoomRange()) ?? null, dt = (() => {
      if (!Ve) return tt;
      const He = tt.max - tt.min;
      if (!Number.isFinite(He) || He === 0) return tt;
      const Ct = Ve.start, ln = Ve.end, Bt = tt.min + Ct / 100 * He, Kt = tt.min + ln / 100 * He;
      return ir(Bt, Kt);
    })(), ft = ir(ye, Ce);
    if (!(G !== null && G.rectWidthCss === q.layoutWidth && G.rectHeightCss === q.layoutHeight && G.plotWidthCss === pe && G.plotHeightCss === Ne && G.xDomainMin === dt.min && G.xDomainMax === dt.max && G.yDomainMin === ft.min && G.yDomainMax === ft.max)) {
      const He = Pi(h.xAxis).domain(dt.min, dt.max).range(0, pe), Ct = h.yAxes[0] ?? { type: "value" }, ln = Pi(Ct).domain(ft.min, ft.max).range(Ne, 0);
      G = {
        rectWidthCss: q.layoutWidth,
        rectHeightCss: q.layoutHeight,
        plotWidthCss: pe,
        plotHeightCss: Ne,
        xDomainMin: dt.min,
        xDomainMax: dt.max,
        yDomainMin: ft.min,
        yDomainMax: ft.max,
        xScale: He,
        yScale: ln
      };
    }
    const kt = G, tn = (() => {
      const He = 0.5 * Math.min(pe, Ne);
      if (!(He > 0)) return null;
      for (let Ct = h.series.length - 1; Ct >= 0; Ct--) {
        const ln = h.series[Ct];
        if (ln.type !== "pie" || ln.visible === !1) continue;
        const Bt = ln, Kt = Qf(Bt.center, pe, Ne), An = ed(Bt.radius, He), Nn = Ul(Je, We, { seriesIndex: Ct, series: Bt }, Kt, An);
        if (!Nn) continue;
        const Hn = Nn.slice.value;
        return {
          kind: "pie",
          seriesIndex: Nn.seriesIndex,
          dataIndex: Nn.dataIndex,
          sliceValue: typeof Hn == "number" && Number.isFinite(Hn) ? Hn : 0
        };
      }
      return null;
    })();
    if (tn) return { match: tn, isInGrid: !0 };
    for (let He = h.series.length - 1; He >= 0; He--) {
      const Ct = h.series[He];
      if (!(Ct.type === "candlestick" || Ct.type === "ohlc") || Ct.visible === !1) continue;
      const ln = Ct, Bt = El(ln, ln.data, kt.xScale, pe), Kt = Ll([ln], Je, We, kt.xScale, kt.yScale, Bt, {
        yHitMode: Ct.type === "ohlc" ? "lowHigh" : "openClose"
      });
      if (Kt)
        return {
          match: {
            kind: Ct.type === "ohlc" ? "ohlc" : "candlestick",
            seriesIndex: He,
            dataIndex: Kt.dataIndex,
            point: Kt.point
          },
          isInGrid: !0
        };
    }
    {
      const He = ke(Je, We, kt.xScale, kt.yScale, pe, Ne);
      if (He) return { match: He, isInGrid: !0 };
    }
    {
      const He = Ke(Je, We, kt.xScale, kt.yScale, pe, Ne);
      if (He) return { match: He, isInGrid: !0 };
    }
    const qt = Os(E(), Je, We, kt.xScale, kt.yScale);
    return {
      match: qt ? { kind: "cartesian", match: qt } : null,
      isInGrid: !0
    };
  }, yt = () => {
    if (Q < 2)
      return 0;
    const H = (Z - Q + li) % li;
    let q = 0;
    for (let Fe = 1; Fe < Q; Fe++) {
      const et = (H + Fe - 1) % li, pe = (H + Fe) % li, Ne = $[pe] - $[et];
      q += Ne;
    }
    const ue = q / (Q - 1);
    return ue > 0 ? 1e3 / ue : 0;
  }, mt = () => {
    if (Q < 2)
      return {
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    const H = (Z - Q + li) % li, q = new Array(Q - 1);
    let ue = Number.POSITIVE_INFINITY, he = Number.NEGATIVE_INFINITY, Fe = 0;
    for (let We = 1; We < Q; We++) {
      const ut = (H + We - 1) % li, st = (H + We) % li, Ut = $[st] - $[ut];
      q[We - 1] = Ut, Ut < ue && (ue = Ut), Ut > he && (he = Ut), Fe += Ut;
    }
    const et = Fe / q.length;
    q.sort((We, ut) => We - ut);
    const pe = Math.floor(q.length * 0.5), Ne = Math.floor(q.length * 0.95), Je = Math.floor(q.length * 0.99);
    return {
      min: ue,
      max: he,
      avg: et,
      p50: q[pe],
      p95: q[Ne],
      p99: q[Je]
    };
  }, nt = () => {
    const H = yt(), q = mt(), ue = {
      enabled: !1,
      // GPU timing not yet implemented for main thread
      cpuTime: de,
      gpuTime: 0
    }, he = {
      used: 0,
      peak: 0,
      allocated: 0
    }, Fe = s === "external" ? {
      totalDrops: 0,
      consecutiveDrops: 0,
      lastDropTimestamp: 0
    } : {
      totalDrops: ne,
      consecutiveDrops: L,
      lastDropTimestamp: le
    }, et = performance.now() - se;
    return {
      fps: H,
      frameTimeStats: q,
      gpuTiming: ue,
      memory: he,
      frameDrops: Fe,
      totalFrames: K,
      elapsedTime: et
    };
  }, ct = (H, q) => {
    if (!H)
      return {
        seriesIndex: null,
        dataIndex: null,
        value: null,
        seriesName: null,
        event: q
      };
    const ue = H.kind === "cartesian" ? H.match.seriesIndex : H.seriesIndex, he = H.kind === "cartesian" ? H.match.dataIndex : H.dataIndex, Fe = h.series[ue], et = (Fe == null ? void 0 : Fe.name) ?? null, pe = et && et.trim().length > 0 ? et : null;
    if (H.kind === "pie")
      return {
        seriesIndex: ue,
        dataIndex: he,
        value: [0, H.sliceValue],
        seriesName: pe,
        event: q
      };
    if (H.kind === "candlestick" || H.kind === "ohlc") {
      const We = Er(H.point), ut = Kf(H.point);
      return {
        seriesIndex: ue,
        dataIndex: he,
        value: [We, ut],
        seriesName: pe,
        event: q
      };
    }
    if (H.kind === "errorBar")
      return {
        seriesIndex: ue,
        dataIndex: he,
        value: [H.point.x, H.point.y],
        seriesName: pe,
        event: q
      };
    if (H.kind === "impulse")
      return {
        seriesIndex: ue,
        dataIndex: he,
        value: [H.point.x, H.point.y],
        seriesName: pe,
        event: q
      };
    if (H.kind !== "cartesian")
      return {
        seriesIndex: ue,
        dataIndex: he,
        value: null,
        seriesName: pe,
        event: q
      };
    const { x: Ne, y: Je } = Zf(H.match.point);
    return {
      seriesIndex: ue,
      dataIndex: he,
      value: [Ne, Je],
      seriesName: pe,
      event: q
    };
  }, je = (H, q) => {
    if (!o)
      for (const ue of O[H]) ue(q);
  }, pt = (H, q) => {
    const ue = j;
    if (j = H, ue === null && H === null) return;
    if (ue === null && H !== null) {
      je("mouseover", ct(H, q));
      return;
    }
    if (ue !== null && H === null) {
      je("mouseout", ct(ue, q));
      return;
    }
    if (ue === null || H === null) return;
    const he = ue.kind === "cartesian" ? ue.match.seriesIndex : ue.seriesIndex, Fe = ue.kind === "cartesian" ? ue.match.dataIndex : ue.dataIndex, et = H.kind === "cartesian" ? H.match.seriesIndex : H.seriesIndex, pe = H.kind === "cartesian" ? H.match.dataIndex : H.dataIndex;
    he === et && Fe === pe || (je("mouseout", ct(ue, q)), je("mouseover", ct(H, q)));
  }, St = (H) => {
    k && H.isPrimary && H.pointerId === k.pointerId && (k = null);
  }, Zt = (H) => {
    if (o || !ie()) return;
    const { match: q, isInGrid: ue } = at(H);
    if (!ue) {
      pt(null, H);
      return;
    }
    pt(q, H);
  }, Ge = (H) => {
    o || !ie() && !k || (St(H), pt(null, H));
  }, Ye = (H) => {
    o || !ie() && !k || (St(H), pt(null, H));
  }, rt = (H) => {
    if (!o && !(!ie() && !k && W !== H.pointerId)) {
      if (W === H.pointerId) {
        W = null;
        return;
      }
      St(H), pt(null, H);
    }
  }, bt = (H) => {
    if (!o && be() && H.isPrimary && !(H.pointerType === "mouse" && H.button !== 0)) {
      k = {
        pointerId: H.pointerId,
        startClientX: H.clientX,
        startClientY: H.clientY,
        startTimeMs: H.timeStamp
      };
      try {
        i.setPointerCapture(H.pointerId);
      } catch {
      }
    }
  }, Dt = (H) => {
    if (o || !be() || !H.isPrimary || !k || H.pointerId !== k.pointerId) return;
    const q = H.timeStamp - k.startTimeMs, ue = H.clientX - k.startClientX, he = H.clientY - k.startClientY, Fe = ue * ue + he * he;
    k = null;
    try {
      i.hasPointerCapture(H.pointerId) && (W = H.pointerId, i.releasePointerCapture(H.pointerId));
    } catch {
    }
    const et = LN;
    if (!(q <= UN && Fe <= et * et)) return;
    const { match: Ne } = at(H);
    je("click", ct(Ne, H));
  };
  i.addEventListener("pointermove", Zt, { passive: !0 }), i.addEventListener("pointerleave", Ge, { passive: !0 }), i.addEventListener("pointercancel", Ye, { passive: !0 }), i.addEventListener("lostpointercapture", rt, {
    passive: !0
  }), i.addEventListener("pointerdown", bt, { passive: !0 }), i.addEventListener("pointerup", Dt, { passive: !0 });
  const wt = () => {
    if (!o) {
      o = !0;
      try {
        te(), ve(), Ae(), Le(), ge(), u == null || u.dispose(), u = null, f = null, c == null || c.destroy();
      } finally {
        k = null, W = null, j = null, G = null, y = !1, p = void 0, i.removeEventListener("pointermove", Zt), i.removeEventListener("pointerleave", Ge), i.removeEventListener("pointercancel", Ye), i.removeEventListener("lostpointercapture", rt), i.removeEventListener("pointerdown", bt), i.removeEventListener("pointerup", Dt), O.click.clear(), O.mouseover.clear(), O.mouseout.clear(), O.crosshairMove.clear(), O.zoomRangeChange.clear(), O.deviceLost.clear(), O.dataAppend.clear(), D = !1, c = null, i.remove(), As.delete(Yt);
      }
    }
  }, Yt = {
    get options() {
      return M;
    },
    get disposed() {
      return o;
    },
    /**
     * Number of times the ChartGPU hit-test columnar store was fully rebuilt.
     * Used in tests to prove tooltip-off setOption dual-store skip.
     * @internal
     */
    getHitTestStoreRebuildCount() {
      return F;
    },
    getHitTestSeriesPointCount(H) {
      if (!Number.isFinite(H) || H < 0 || H >= R.length)
        return 0;
      const q = R[H];
      return q == null ? 0 : hn(q) ? q.count : Array.isArray(q) ? q.length : typeof q == "object" && "x" in q && Array.isArray(q.x) ? q.x.length : 0;
    },
    setOption(H) {
      var Fe;
      if (o) return;
      const q = M, ue = v;
      M = H, h = qc(H, {
        previousResolved: h,
        previousUserOptions: q,
        lastUserSeriesElements: ue
      }), v = H.series ? H.series.slice() : null, u == null || u.setOptions(h);
      const he = ((Fe = h.tooltip) == null ? void 0 : Fe.show) !== !1;
      he ? C() : x = !0, U = uo(
        h.series,
        he ? T : null
      ), G = null, Ue(), Qe(), _e();
    },
    appendData(H, q, ue) {
      var Ut, ye;
      if (o || !Number.isFinite(H) || H < 0 || H >= h.series.length) return;
      const he = h.series[H];
      if (he.type === "pie" || he.type === "heatmap") {
        ee.has(H) || (ee.add(H), console.warn(
          `ChartGPU.appendData(${H}, ...): ${he.type} series are not supported by streaming append. ` + (he.type === "heatmap" ? "Use updateHeatmap(...) for replaceZ / appendColumns / appendRows (or equal-size setOption z replace)." : "Use setOption(...) to replace pie data.")
        ));
        return;
      }
      let Fe = 0;
      if (he.type === "candlestick" || he.type === "ohlc") {
        if (!Array.isArray(q)) return;
        Fe = q.length;
      } else if (he.type === "band") {
        if (!Xl(q)) {
          console.warn(
            `ChartGPU.appendData(${H}, ...): band series requires Xyy payloads ({x,y,y1}, [x,y,y1] tuples/objects, or interleaved stride-3). Skipping batch.`
          );
          return;
        }
        Fe = yn(q);
      } else if (he.type === "errorBar") {
        if (!Sd(q)) {
          console.warn(
            `ChartGPU.appendData(${H}, ...): errorBar series requires HLC or relative-error payloads ({x,y,high,low}, {x,y,yError}, tuples/objects). Skipping batch.`
          );
          return;
        }
        Fe = On(q);
      } else
        Fe = $e(q);
      if (Fe === 0) return;
      const et = bi(ue == null ? void 0 : ue.maxPoints), pe = ((Ut = h.tooltip) == null ? void 0 : Ut.show) !== !1;
      pe ? x && _() : x = !0;
      const Ne = (() => {
        if (!pe) return 0;
        const Ce = R[H];
        return he.type === "candlestick" || he.type === "ohlc" ? Array.isArray(Ce) ? Ce.length : 0 : hn(Ce) ? Ce.count : Ce && typeof Ce == "object" && "x" in Ce && Array.isArray(Ce.x) ? Ce.x.length : 0;
      })(), Je = ((ye = c == null ? void 0 : c.device) == null ? void 0 : ye.limits) ?? null, We = Mh(et, Ne, Fe, Je);
      u == null || u.appendData(H, q, We != null ? { maxPoints: We } : void 0);
      let ut = Number.POSITIVE_INFINITY, st = Number.NEGATIVE_INFINITY;
      if (pe && (he.type === "candlestick" || he.type === "ohlc")) {
        const Ce = R[H], tt = Array.isArray(Ce) ? Ce : [], Ve = q;
        if (D)
          for (let ft = 0; ft < Fe; ft++) {
            const gt = Er(Ve[ft]);
            Number.isFinite(gt) && (gt < ut && (ut = gt), gt > st && (st = gt));
          }
        const dt = yi(tt.length, Fe, We);
        if (dt.dropPrevCount > 0 && tt.splice(0, dt.dropPrevCount), dt.keepNewCount > 0) {
          const ft = dt.newSrcOffset, gt = ft + dt.keepNewCount;
          for (let kt = ft; kt < gt; kt++)
            tt.push(Ve[kt]);
        }
        dt.didWindow ? T[H] = bl(null, tt) : T[H] = bl(
          T[H],
          Ve
        ), R[H] = tt;
      } else if (pe && he.type === "band") {
        let Ce = R[H];
        if (!Ce || !("y1" in Ce)) {
          const dt = he.rawData ?? he.data, ft = yn(dt), gt = new Array(ft), kt = new Array(ft), tn = new Array(ft);
          for (let qt = 0; qt < ft; qt++) {
            const ot = cn(dt, qt);
            gt[qt] = ot ? ot.x : Number.NaN, kt[qt] = ot ? ot.y : Number.NaN, tn[qt] = ot ? ot.y1 : Number.NaN;
          }
          Ce = { x: gt, y: kt, y1: tn };
        } else
          Ce = {
            x: Array.isArray(Ce.x) ? Ce.x : Array.from(Ce.x),
            y: Array.isArray(Ce.y) ? Ce.y : Array.from(Ce.y),
            y1: Array.isArray(Ce.y1) ? Ce.y1 : Array.from(Ce.y1)
          };
        const tt = q;
        if (D)
          for (let dt = 0; dt < Fe; dt++) {
            const ft = cn(tt, dt);
            ft && Number.isFinite(ft.x) && (ft.x < ut && (ut = ft.x), ft.x > st && (st = ft.x));
          }
        const Ve = yi(Ce.x.length, Fe, We);
        Ve.dropPrevCount > 0 && (Ce.x.splice(0, Ve.dropPrevCount), Ce.y.splice(0, Ve.dropPrevCount), Ce.y1.splice(0, Ve.dropPrevCount)), wd(Ce, tt, {
          newSrcOffset: Ve.newSrcOffset,
          keepNewCount: Ve.keepNewCount
        }), Ve.didWindow ? T[H] = qn(ui(Ce)) : T[H] = Nd(
          T[H],
          tt
        ), R[H] = ui(Ce);
      } else if (pe && he.type === "errorBar") {
        let Ce = R[H];
        const tt = he.direction === "horizontal" ? "horizontal" : "vertical";
        if (!Ce || !("high" in Ce) || !("low" in Ce)) {
          const ft = he.rawData ?? he.data;
          Ce = Dr(ft);
        } else
          Ce = {
            x: Array.isArray(Ce.x) ? Ce.x : Array.from(Ce.x),
            y: Array.isArray(Ce.y) ? Ce.y : Array.from(Ce.y),
            high: Array.isArray(Ce.high) ? Ce.high : Array.from(Ce.high),
            low: Array.isArray(Ce.low) ? Ce.low : Array.from(Ce.low)
          };
        const Ve = q;
        if (D)
          for (let ft = 0; ft < Fe; ft++) {
            const gt = kn(Ve, ft);
            gt && Number.isFinite(gt.x) && (gt.x < ut && (ut = gt.x), gt.x > st && (st = gt.x));
          }
        const dt = yi(Ce.x.length, Fe, We);
        dt.dropPrevCount > 0 && (Ce.x.splice(0, dt.dropPrevCount), Ce.y.splice(0, dt.dropPrevCount), Ce.high.splice(0, dt.dropPrevCount), Ce.low.splice(0, dt.dropPrevCount)), Rd(Ce, Ve, {
          newSrcOffset: dt.newSrcOffset,
          keepNewCount: dt.keepNewCount
        }), dt.didWindow ? T[H] = hi(Ce, tt) : T[H] = Bd(
          T[H],
          Ve,
          tt
        ), R[H] = Ce;
      } else if (pe) {
        let Ce = R[H];
        const tt = q;
        if (We != null) {
          if (hn(Ce)) {
            if (Ce.capacity !== We) {
              const dt = Ce, ft = { x: [], y: [] }, gt = dt.size != null;
              gt && (ft.size = []);
              for (let ot = 0; ot < dt.count; ot++)
                if (ft.x.push(Te(dt, ot)), ft.y.push(ht(dt, ot)), gt && ft.size) {
                  const _t = Sn(dt, ot);
                  ft.size.push(_t);
                }
              const kt = yo(We, gt), tn = Math.min(ft.x.length, We), qt = Math.max(0, ft.x.length - tn);
              for (let ot = 0; ot < tn; ot++)
                if (kt.x[ot] = ft.x[qt + ot], kt.y[ot] = ft.y[qt + ot], kt.size && ft.size) {
                  const _t = ft.size[qt + ot];
                  kt.size[ot] = typeof _t == "number" && Number.isFinite(_t) ? _t : Number.NaN;
                }
              kt.count = tn, kt.start = 0, Ce = kt, R[H] = kt;
            }
          } else {
            const dt = Ce, ft = dt.size != null && dt.size.some((qt) => qt !== void 0 && Number.isFinite(qt)), gt = yo(We, ft), kt = Math.min(dt.x.length, We), tn = Math.max(0, dt.x.length - kt);
            for (let qt = 0; qt < kt; qt++)
              if (gt.x[qt] = dt.x[tn + qt], gt.y[qt] = dt.y[tn + qt], gt.size && dt.size) {
                const ot = dt.size[tn + qt];
                gt.size[qt] = typeof ot == "number" && Number.isFinite(ot) ? ot : Number.NaN;
              }
            gt.count = kt, gt.start = 0, Ce = gt, R[H] = gt;
          }
          const Ve = yi(Ce.count, Fe, We);
          if (ud(
            Ce,
            tt,
            Ve.newSrcOffset,
            Ve.keepNewCount,
            Ve.dropPrevCount
          ), D) {
            const dt = Ve.newSrcOffset + Ve.keepNewCount;
            for (let ft = Ve.newSrcOffset; ft < dt; ft++) {
              const gt = Te(tt, ft);
              Number.isFinite(gt) && (gt < ut && (ut = gt), gt > st && (st = gt));
            }
          }
          if (!Ve.didWindow)
            T[H] = Jf(
              T[H],
              tt
            );
          else {
            const dt = Ce, ft = T[H], gt = Te(dt, 0), kt = Te(dt, Math.max(0, dt.count - 1));
            let tn = (ft == null ? void 0 : ft.yMin) ?? Number.POSITIVE_INFINITY, qt = (ft == null ? void 0 : ft.yMax) ?? Number.NEGATIVE_INFINITY;
            const ot = Ve.newSrcOffset + Ve.keepNewCount;
            for (let _t = Ve.newSrcOffset; _t < ot; _t++) {
              const He = ht(tt, _t);
              Number.isFinite(He) && (He < tn && (tn = He), He > qt && (qt = He));
            }
            if (Number.isFinite(gt) && Number.isFinite(kt) && Number.isFinite(tn) && Number.isFinite(qt)) {
              let _t = gt, He = kt;
              _t === He && (He = _t + 1), tn === qt && (qt = tn + 1), T[H] = { xMin: _t, xMax: He, yMin: tn, yMax: qt };
            } else
              T[H] = Rn(
                dt
              );
          }
        } else {
          if (hn(Ce)) {
            const ot = Ce, _t = { x: [], y: [] };
            for (let He = 0; He < ot.count; He++)
              _t.x.push(Te(ot, He)), _t.y.push(ht(ot, He));
            Ce = _t, R[H] = _t;
          }
          const Ve = Ce, dt = typeof tt == "object" && tt !== null && !Array.isArray(tt) && "x" in tt && "y" in tt, ft = typeof tt == "object" && tt !== null && !Array.isArray(tt) && ArrayBuffer.isView(tt), gt = yi(Ve.x.length, Fe, We);
          gt.dropPrevCount > 0 && fd(Ve.x, Ve.y, gt.dropPrevCount, Ve.size);
          let kt = !1;
          const tn = new Array(gt.keepNewCount), qt = Ve.x.length;
          if (dt) {
            const ot = tt, _t = gt.newSrcOffset + gt.keepNewCount;
            for (let He = gt.newSrcOffset; He < _t; He++) {
              const Ct = ot.x[He];
              Ve.x.push(Ct), Ve.y.push(ot.y[He]), D && Number.isFinite(Ct) && (Ct < ut && (ut = Ct), Ct > st && (st = Ct));
            }
            if (ot.size) {
              kt = !0;
              for (let He = 0; He < gt.keepNewCount; He++)
                tn[He] = ot.size[gt.newSrcOffset + He];
            }
          } else if (ft) {
            const ot = tt, _t = gt.newSrcOffset + gt.keepNewCount;
            for (let He = gt.newSrcOffset; He < _t; He++) {
              const Ct = ot[He * 2];
              Ve.x.push(Ct), Ve.y.push(ot[He * 2 + 1]), D && Number.isFinite(Ct) && (Ct < ut && (ut = Ct), Ct > st && (st = Ct));
            }
          } else {
            const ot = gt.newSrcOffset + gt.keepNewCount;
            for (let _t = gt.newSrcOffset; _t < ot; _t++) {
              const He = Te(tt, _t);
              Ve.x.push(He), Ve.y.push(ht(tt, _t));
              const Ct = Sn(tt, _t);
              tn[_t - gt.newSrcOffset] = Ct, Ct !== void 0 && (kt = !0), D && Number.isFinite(He) && (He < ut && (ut = He), He > st && (st = He));
            }
          }
          (Ve.size || kt) && (Ve.size || (Ve.size = new Array(qt)), Ve.size.push(...tn)), gt.didWindow ? T[H] = Rn(
            Ve
          ) : T[H] = Jf(
            T[H],
            tt
          );
        }
      } else if (D)
        if (he.type === "candlestick" || he.type === "ohlc") {
          const Ce = q;
          for (let tt = 0; tt < Fe; tt++) {
            const Ve = Er(Ce[tt]);
            Number.isFinite(Ve) && (Ve < ut && (ut = Ve), Ve > st && (st = Ve));
          }
        } else if (he.type === "band") {
          const Ce = q;
          for (let tt = 0; tt < Fe; tt++) {
            const Ve = Wl(Ce, tt);
            Number.isFinite(Ve) && (Ve < ut && (ut = Ve), Ve > st && (st = Ve));
          }
        } else if (he.type === "errorBar") {
          const Ce = q;
          for (let tt = 0; tt < Fe; tt++) {
            const Ve = kn(Ce, tt);
            Ve && Number.isFinite(Ve.x) && (Ve.x < ut && (ut = Ve.x), Ve.x > st && (st = Ve.x));
          }
        } else {
          const Ce = q;
          for (let tt = 0; tt < Fe; tt++) {
            const Ve = Te(Ce, tt);
            Number.isFinite(Ve) && (Ve < ut && (ut = Ve), Ve > st && (st = Ve));
          }
        }
      pe && (U = uo(h.series, T), B = null, G = null), _e(), D && ((!Number.isFinite(ut) || !Number.isFinite(st)) && (ut = 0, st = 0), Tt.seriesIndex = H, Tt.count = Fe, Tt.xExtent.min = ut, Tt.xExtent.max = st, je("dataAppend", Tt));
    },
    updateHeatmap(H, q) {
      if (o || !Number.isFinite(H) || H < 0 || H >= h.series.length || !u || !u.updateHeatmap(H, q)) return;
      const he = h.series[H];
      if ((he == null ? void 0 : he.type) === "heatmap") {
        const Fe = u.getRuntimeSeriesBounds(H);
        if (Fe) {
          const et = h.series.slice();
          et[H] = { ...he, rawBounds: Fe }, h = { ...h, series: et }, U = uo(h.series, null), G = null;
        }
      }
      _e();
    },
    renderFrame() {
      if (o || l) return !1;
      if (s === "auto")
        return console.warn(
          'renderFrame() called in auto mode - this is a no-op. Set renderMode to "external" to use manual rendering.'
        ), !1;
      if (a || !u || !(c != null && c.device) || !z) return !1;
      try {
        return Me(!1), !0;
      } catch {
        return !1;
      }
    },
    needsRender: () => o ? !1 : z,
    getRenderMode: () => s,
    setRenderMode(H) {
      if (!o) {
        if (H !== "auto" && H !== "external") {
          console.warn(`setRenderMode(): invalid mode '${String(H)}', ignoring.`);
          return;
        }
        s !== H && (Be(), s = H, H === "external" ? te() : z && _e());
      }
    },
    resize: we,
    dispose: wt,
    on(H, q) {
      o || (O[H].add(q), H === "dataAppend" && (D = !0));
    },
    off(H, q) {
      O[H].delete(q), H === "dataAppend" && (D = O.dataAppend.size > 0);
    },
    getInteractionX() {
      return o ? null : (u == null ? void 0 : u.getInteractionX()) ?? null;
    },
    setInteractionX(H, q) {
      o || u == null || u.setInteractionX(H, q);
    },
    setCrosshairX(H, q) {
      o || u == null || u.setInteractionX(H, q);
    },
    onInteractionXChange(H) {
      return o ? () => {
      } : (u == null ? void 0 : u.onInteractionXChange(H)) ?? (() => {
      });
    },
    getZoomRange() {
      return o ? null : (u == null ? void 0 : u.getZoomRange()) ?? null;
    },
    setZoomRange(H, q, ue) {
      if (o || !u) return;
      const he = u.getZoomRange();
      if (!he) return;
      y = !0, p = ue, u.setZoomRange(H, q);
      const Fe = u.getZoomRange();
      (!Fe || Fe.start === he.start && Fe.end === he.end) && (y = !1, p = void 0);
    },
    getPerformanceMetrics() {
      return o ? null : nt();
    },
    getPerformanceCapabilities() {
      return o ? null : {
        gpuTimingSupported: !1,
        // Not yet implemented for main thread
        highResTimerSupported: typeof performance < "u" && typeof performance.now == "function",
        performanceMetricsSupported: !0
      };
    },
    onPerformanceUpdate(H) {
      return o ? () => {
      } : (re.add(H), () => {
        re.delete(H);
      });
    },
    hitTest(H) {
      var ot, _t;
      x && _();
      const q = Ri(i, H.clientX, H.clientY), ue = (q == null ? void 0 : q.x) ?? 0, he = (q == null ? void 0 : q.y) ?? 0;
      if (o || !q)
        return {
          isInGrid: !1,
          canvasX: ue,
          canvasY: he,
          gridX: 0,
          gridY: 0,
          match: null
        };
      const Fe = h.grid.left, et = h.grid.top, pe = q.layoutWidth - h.grid.left - h.grid.right, Ne = q.layoutHeight - h.grid.top - h.grid.bottom, Je = ue - Fe, We = he - et;
      if (!(pe > 0) || !(Ne > 0))
        return {
          isInGrid: !1,
          canvasX: ue,
          canvasY: he,
          gridX: Je,
          gridY: We,
          match: null
        };
      if (!(Je >= 0 && Je <= pe && We >= 0 && We <= Ne))
        return {
          isInGrid: !1,
          canvasX: ue,
          canvasY: he,
          gridX: Je,
          gridY: We,
          match: null
        };
      const st = h.xAxis.min ?? U.xMin, Ut = h.xAxis.max ?? U.xMax, ye = ((ot = h.yAxes[0]) == null ? void 0 : ot.min) ?? U.yMin, Ce = ((_t = h.yAxes[0]) == null ? void 0 : _t.max) ?? U.yMax, tt = ir(st, Ut), Ve = (u == null ? void 0 : u.getZoomRange()) ?? null, dt = (() => {
        if (!Ve) return tt;
        const He = tt.max - tt.min;
        if (!Number.isFinite(He) || He === 0) return tt;
        const Ct = Ve.start, ln = Ve.end, Bt = tt.min + Ct / 100 * He, Kt = tt.min + ln / 100 * He;
        return ir(Bt, Kt);
      })(), ft = ir(ye, Ce);
      if (!(G !== null && G.rectWidthCss === q.layoutWidth && G.rectHeightCss === q.layoutHeight && G.plotWidthCss === pe && G.plotHeightCss === Ne && G.xDomainMin === dt.min && G.xDomainMax === dt.max && G.yDomainMin === ft.min && G.yDomainMax === ft.max)) {
        const He = Pi(h.xAxis).domain(dt.min, dt.max).range(0, pe), Ct = h.yAxes[0] ?? { type: "value" }, ln = Pi(Ct).domain(ft.min, ft.max).range(Ne, 0);
        G = {
          rectWidthCss: q.layoutWidth,
          rectHeightCss: q.layoutHeight,
          plotWidthCss: pe,
          plotHeightCss: Ne,
          xDomainMin: dt.min,
          xDomainMax: dt.max,
          yDomainMin: ft.min,
          yDomainMax: ft.max,
          xScale: He,
          yScale: ln
        };
      }
      const kt = G, tn = (() => {
        const He = 0.5 * Math.min(pe, Ne);
        if (!(He > 0)) return null;
        for (let Ct = h.series.length - 1; Ct >= 0; Ct--) {
          const ln = h.series[Ct];
          if (ln.type !== "pie" || ln.visible === !1) continue;
          const Bt = ln, Kt = Qf(Bt.center, pe, Ne), An = ed(Bt.radius, He), Nn = Ul(Je, We, { seriesIndex: Ct, series: Bt }, Kt, An);
          if (!Nn) continue;
          const Hn = Nn.slice.value;
          return {
            kind: "pie",
            seriesIndex: Nn.seriesIndex,
            dataIndex: Nn.dataIndex,
            sliceValue: typeof Hn == "number" && Number.isFinite(Hn) ? Hn : 0
          };
        }
        return null;
      })();
      if (tn)
        return {
          isInGrid: !0,
          canvasX: ue,
          canvasY: he,
          gridX: Je,
          gridY: We,
          match: {
            kind: "pie",
            seriesIndex: tn.seriesIndex,
            dataIndex: tn.dataIndex,
            value: [0, tn.sliceValue]
          }
        };
      for (let He = h.series.length - 1; He >= 0; He--) {
        const Ct = h.series[He];
        if (!(Ct.type === "candlestick" || Ct.type === "ohlc") || Ct.visible === !1) continue;
        const ln = Ct, Bt = El(ln, ln.data, kt.xScale, pe), Kt = Ll([ln], Je, We, kt.xScale, kt.yScale, Bt, {
          yHitMode: Ct.type === "ohlc" ? "lowHigh" : "openClose"
        });
        if (!Kt) continue;
        const An = Er(Kt.point), Nn = Kf(Kt.point);
        return {
          isInGrid: !0,
          canvasX: ue,
          canvasY: he,
          gridX: Je,
          gridY: We,
          match: {
            kind: Ct.type === "ohlc" ? "ohlc" : "candlestick",
            seriesIndex: He,
            dataIndex: Kt.dataIndex,
            value: [An, Nn]
          }
        };
      }
      {
        const He = ke(Je, We, kt.xScale, kt.yScale, pe, Ne);
        if (He)
          return {
            isInGrid: !0,
            canvasX: ue,
            canvasY: he,
            gridX: Je,
            gridY: We,
            match: {
              kind: "errorBar",
              seriesIndex: He.seriesIndex,
              dataIndex: He.dataIndex,
              value: [He.point.x, He.point.y]
            }
          };
      }
      {
        const He = Ke(Je, We, kt.xScale, kt.yScale, pe, Ne);
        if (He)
          return {
            isInGrid: !0,
            canvasX: ue,
            canvasY: he,
            gridX: Je,
            gridY: We,
            match: {
              kind: "impulse",
              seriesIndex: He.seriesIndex,
              dataIndex: He.dataIndex,
              value: [He.point.x, He.point.y]
            }
          };
      }
      const qt = Os(E(), Je, We, kt.xScale, kt.yScale);
      if (qt) {
        const { x: He, y: Ct } = Zf(qt.point);
        return {
          isInGrid: !0,
          canvasX: ue,
          canvasY: he,
          gridX: Je,
          gridY: We,
          match: {
            kind: "cartesian",
            seriesIndex: qt.seriesIndex,
            dataIndex: qt.dataIndex,
            value: [He, Ct]
          }
        };
      }
      return {
        isInGrid: !0,
        canvasX: ue,
        canvasY: he,
        gridX: Je,
        gridY: We,
        match: null
      };
    }
  };
  try {
    Mt(!1);
    try {
      const H = t.devicePixelRatio, q = typeof H == "number" && Number.isFinite(H) && H > 0 ? H : void 0, ue = n ? {
        device: n.device,
        adapter: n.adapter,
        ...q != null ? { devicePixelRatio: q } : {}
      } : q != null ? { devicePixelRatio: q } : void 0;
      c = await Gl.create(i, ue);
    } catch (H) {
      const q = H instanceof Error ? H.message : String(H);
      throw new Error(
        `ChartGPU: WebGPU is not available.
Reason: ${q}
Browser support: Chrome/Edge 113+, Safari 18+, Firefox not yet supported.
Resources:
  - MDN WebGPU API: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
  - Browser compatibility: https://caniuse.com/webgpu
  - WebGPU specification: https://www.w3.org/TR/webgpu/
  - Check your system: https://webgpureport.org/`
      );
    }
    return (en = c.device) == null || en.lost.then((H) => {
      l = !0, !o && (H.reason !== "destroyed" && console.warn("WebGPU device lost:", H), r && H.reason !== "destroyed" && je("deviceLost", { reason: H.reason, message: H.message }), wt());
    }), Mt(!1), xt(), Ue(), Qe(), s === "auto" && _e(), As.add(Yt), jf(), Yt;
  } catch (H) {
    throw Yt.dispose(), H;
  }
}
const YN = {
  create: HN
};
function BM(e, t) {
  const n = (t == null ? void 0 : t.syncCrosshair) ?? !0, i = (t == null ? void 0 : t.syncZoom) ?? !1, r = Symbol("ChartGPU.connectCharts");
  let o = !1;
  const s = [];
  let a = !1, l = null, c = !1, u = 0, f = 100;
  const d = (p, y) => {
    if (!(a && y === l)) {
      a = !0, l = y;
      for (const g of e)
        g !== p && (g.disposed || g.setCrosshairX(y, r));
    }
  }, m = (p, y, g) => {
    if (!(c && y === u && g === f)) {
      c = !0, u = y, f = g;
      for (const S of e)
        S !== p && (S.disposed || S.setZoomRange(y, g, r));
    }
  };
  for (const p of e)
    if (!p.disposed) {
      if (n) {
        const y = (S) => {
          o || S.source !== r && (p.disposed || d(p, S.x));
        };
        p.on("crosshairMove", y);
        const g = () => p.off("crosshairMove", y);
        s.push(g);
      }
      if (i) {
        const y = (S) => {
          o || S.source !== r && S.sourceKind !== "auto-scroll" && (p.disposed || m(p, S.start, S.end));
        };
        p.on("zoomRangeChange", y);
        const g = () => p.off("zoomRangeChange", y);
        s.push(g);
      }
    }
  return () => {
    if (!o) {
      o = !0;
      for (const p of s) p();
      s.length = 0;
      for (const p of e)
        p.disposed || n && p.setCrosshairX(null, r);
    }
  };
}
function WN(e, t, n = {}) {
  const i = n.lineTolerance ?? 20, r = n.textTolerance ?? 8, o = n.pointTolerance ?? 16;
  let s = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), l = !1;
  const c = (N) => Array.isArray(N), u = (N) => Array.isArray(N), f = (N) => c(N) ? N[0] : N.x, d = (N) => c(N) ? N[1] : N.y, m = (N) => u(N) ? N[0] : N.timestamp, p = (N) => u(N) ? N[2] : N.high, y = (N) => u(N) ? N[3] : N.low;
  function g() {
    var _, C;
    const N = e.options;
    let w = (_ = N.xAxis) == null ? void 0 : _.min, P = (C = N.xAxis) == null ? void 0 : C.max;
    if (w === void 0 || P === void 0) {
      const E = N.series ?? [];
      let U = Number.POSITIVE_INFINITY, G = Number.NEGATIVE_INFINITY;
      for (const O of E)
        if (O.type !== "pie")
          if (O.type === "candlestick" || O.type === "ohlc") {
            const D = O.data;
            for (const k of D) {
              const W = m(k);
              W < U && (U = W), W > G && (G = W);
            }
          } else {
            const D = O.data;
            for (const k of D) {
              const W = f(k);
              W < U && (U = W), W > G && (G = W);
            }
          }
      w === void 0 && (w = Number.isFinite(U) ? U : 0), P === void 0 && (P = Number.isFinite(G) ? G : 100);
    }
    const B = e.getZoomRange();
    if (B) {
      const E = P - w, U = w + B.start / 100 * E, G = w + B.end / 100 * E;
      return { min: U, max: G };
    }
    return { min: w, max: P };
  }
  function S() {
    var B, _;
    const N = e.options;
    let w = (B = N.yAxis) == null ? void 0 : B.min, P = (_ = N.yAxis) == null ? void 0 : _.max;
    if (w === void 0 || P === void 0) {
      const C = N.series ?? [];
      let E = Number.POSITIVE_INFINITY, U = Number.NEGATIVE_INFINITY;
      for (const G of C)
        if (G.type !== "pie")
          if (G.type === "candlestick" || G.type === "ohlc") {
            const O = G.data;
            for (const D of O) {
              const k = p(D), W = y(D);
              k > U && (U = k), W < E && (E = W);
            }
          } else {
            const O = G.data;
            for (const D of O) {
              const k = d(D);
              k < E && (E = k), k > U && (U = k);
            }
          }
      w === void 0 && (w = Number.isFinite(E) ? E : 0), P === void 0 && (P = Number.isFinite(U) ? U : 100);
    }
    return { min: w, max: P };
  }
  function A(N, w) {
    const P = e.options, { width: B, height: _ } = lr(t), C = P.grid ?? {
      left: 60,
      right: 20,
      top: 40,
      bottom: 40
    }, E = C.left ?? 60, U = B - (C.right ?? 20), G = C.top ?? 40, O = _ - (C.bottom ?? 40), D = U - E, k = O - G, W = P.xAxis, j = P.yAxis;
    let ee = 0, fe = 0;
    if (N !== void 0 && W)
      if (W.type === "category" && Array.isArray(W.data)) {
        const X = W.data, z = X.indexOf(String(N));
        if (z >= 0) {
          const $ = z / (X.length - 1 || 1);
          ee = E + $ * D;
        }
      } else {
        const X = g(), z = X.min, $ = X.max, Z = (N - z) / ($ - z || 1);
        ee = E + Z * D;
      }
    if (w !== void 0 && j) {
      const X = S(), z = X.min, $ = X.max, Z = (w - z) / ($ - z || 1);
      fe = O - Z * k;
    }
    return { x: ee, y: fe };
  }
  function M(N, w) {
    const P = e.options, { width: B, height: _ } = lr(t), C = P.grid ?? {
      left: 60,
      right: 20,
      top: 40,
      bottom: 40
    }, E = C.left ?? 60, U = B - (C.right ?? 20), G = C.top ?? 40, O = _ - (C.bottom ?? 40), D = U - E, k = O - G;
    return {
      x: E + N * D,
      y: G + w * k
    };
  }
  function h(N) {
    s.clear(), N.forEach((w, P) => {
      const B = {};
      if (w.type === "lineX" && w.x !== void 0) {
        const { x: _ } = A(w.x, void 0);
        B.canvasX = _;
      } else if (w.type === "lineY" && w.y !== void 0) {
        const { y: _ } = A(void 0, w.y);
        B.canvasY = _;
      } else if (w.type === "point" && w.x !== void 0 && w.y !== void 0) {
        const { x: _, y: C } = A(w.x, w.y);
        B.canvasX = _, B.canvasY = C;
      } else if (w.type === "text") {
        const _ = w.position;
        if (_.space === "plot") {
          const { x: C, y: E } = M(_.x, _.y);
          B.canvasX = C, B.canvasY = E;
        } else if (_.space === "data") {
          const { x: C, y: E } = A(_.x, _.y);
          B.canvasX = C, B.canvasY = E;
        }
      }
      s.set(P, B);
    }), l = !0;
  }
  function b(N, w, P, B) {
    return P !== void 0 ? Math.abs(N - P) : B !== void 0 ? Math.abs(w - B) : 1 / 0;
  }
  function v(N, w, P, B) {
    const _ = N - P, C = w - B;
    return Math.sqrt(_ * _ + C * C);
  }
  function x(N, w, P, B) {
    return N >= P.left - B && N <= P.right + B && w >= P.top - B && w <= P.bottom + B;
  }
  function F(N, w) {
    const P = e.options.annotations ?? [];
    if (P.length === 0)
      return null;
    l || h(P);
    let B = null, _ = 1 / 0;
    for (let C = 0; C < P.length; C++) {
      const E = P[C], U = s.get(C);
      if (U) {
        if (E.type === "lineX" && U.canvasX !== void 0) {
          const G = b(N, w, U.canvasX, void 0);
          G <= i && G < _ && (_ = G, B = {
            annotationIndex: C,
            annotation: E,
            hitType: "line",
            distanceCssPx: G
          });
        } else if (E.type === "lineY" && U.canvasY !== void 0) {
          const G = b(N, w, void 0, U.canvasY);
          G <= i && G < _ && (_ = G, B = {
            annotationIndex: C,
            annotation: E,
            hitType: "line",
            distanceCssPx: G
          });
        }
      }
    }
    for (let C = 0; C < P.length; C++) {
      const E = P[C], U = a.get(C);
      if (E.type === "text" && U && x(N, w, U, r)) {
        const G = U.left + U.width / 2, O = U.top + U.height / 2, D = v(N, w, G, O);
        D < _ && (_ = D, B = {
          annotationIndex: C,
          annotation: E,
          hitType: "text",
          distanceCssPx: D
        });
      }
    }
    for (let C = 0; C < P.length; C++) {
      const E = P[C], U = s.get(C);
      if (U && E.type === "point" && U.canvasX !== void 0 && U.canvasY !== void 0) {
        const G = v(N, w, U.canvasX, U.canvasY);
        G <= o && G < _ && (_ = G, B = {
          annotationIndex: C,
          annotation: E,
          hitType: "point",
          distanceCssPx: G
        });
      }
    }
    return B;
  }
  function I(N) {
    a = new Map(N);
  }
  function R() {
    l = !1;
  }
  function T() {
    s.clear(), a.clear();
  }
  return {
    hitTest: F,
    updateTextBounds: I,
    invalidateCache: R,
    dispose: T
  };
}
function XN(e, t, n) {
  let i = null;
  const r = (x) => Array.isArray(x), o = (x) => Array.isArray(x), s = (x) => r(x) ? x[0] : x.x, a = (x) => r(x) ? x[1] : x.y, l = (x) => o(x) ? x[0] : x.timestamp, c = (x) => o(x) ? x[2] : x.high, u = (x) => o(x) ? x[3] : x.low;
  function f() {
    var T, N;
    const x = e.options;
    let F = (T = x.xAxis) == null ? void 0 : T.min, I = (N = x.xAxis) == null ? void 0 : N.max;
    if (F === void 0 || I === void 0) {
      const w = x.series ?? [];
      let P = Number.POSITIVE_INFINITY, B = Number.NEGATIVE_INFINITY;
      for (const _ of w)
        if (_.type !== "pie")
          if (_.type === "candlestick" || _.type === "ohlc") {
            const C = _.data;
            for (const E of C) {
              const U = l(E);
              U < P && (P = U), U > B && (B = U);
            }
          } else {
            const C = _.data;
            for (const E of C) {
              const U = s(E);
              U < P && (P = U), U > B && (B = U);
            }
          }
      F === void 0 && (F = Number.isFinite(P) ? P : 0), I === void 0 && (I = Number.isFinite(B) ? B : 100);
    }
    const R = e.getZoomRange();
    if (R) {
      const w = I - F, P = F + R.start / 100 * w, B = F + R.end / 100 * w;
      return { min: P, max: B };
    }
    return { min: F, max: I };
  }
  function d() {
    var R, T;
    const x = e.options;
    let F = (R = x.yAxis) == null ? void 0 : R.min, I = (T = x.yAxis) == null ? void 0 : T.max;
    if (F === void 0 || I === void 0) {
      const N = x.series ?? [];
      let w = Number.POSITIVE_INFINITY, P = Number.NEGATIVE_INFINITY;
      for (const B of N)
        if (B.type !== "pie")
          if (B.type === "candlestick" || B.type === "ohlc") {
            const _ = B.data;
            for (const C of _) {
              const E = c(C), U = u(C);
              E > P && (P = E), U < w && (w = U);
            }
          } else {
            const _ = B.data;
            for (const C of _) {
              const E = a(C);
              E < w && (w = E), E > P && (P = E);
            }
          }
      F === void 0 && (F = Number.isFinite(w) ? w : 0), I === void 0 && (I = Number.isFinite(P) ? P : 100);
    }
    return { min: F, max: I };
  }
  function m(x, F) {
    const I = e.options, { width: R, height: T } = lr(t), N = I.grid ?? {
      left: 60,
      right: 20,
      top: 40,
      bottom: 40
    }, w = N.left ?? 60, P = R - (N.right ?? 20), B = N.top ?? 40, _ = T - (N.bottom ?? 40), C = P - w, E = _ - B, U = I.xAxis, G = I.yAxis;
    let O = 0, D = 0;
    if (U) {
      const k = (x - w) / C;
      if (U.type === "category" && Array.isArray(U.data)) {
        const W = U.data, j = Math.round(k * (W.length - 1 || 1));
        O = W[Math.max(0, Math.min(j, W.length - 1))];
      } else {
        const W = f();
        O = W.min + k * (W.max - W.min);
      }
    }
    if (G) {
      const k = (_ - F) / E, W = d();
      D = W.min + k * (W.max - W.min);
    }
    return { x: O, y: D };
  }
  function p(x, F) {
    const I = e.options, { width: R, height: T } = lr(t), N = I.grid ?? {
      left: 60,
      right: 20,
      top: 40,
      bottom: 40
    }, w = N.left ?? 60, P = R - (N.right ?? 20), B = N.top ?? 40, _ = T - (N.bottom ?? 40), C = P - w, E = _ - B, U = (x - w) / C, G = (F - B) / E;
    return {
      x: Math.max(0, Math.min(1, U)),
      y: Math.max(0, Math.min(1, G))
    };
  }
  function y(x) {
    if (!i)
      return;
    x.preventDefault();
    const F = Ri(t, x.clientX, x.clientY);
    if (!F) return;
    const I = F.x, R = F.y, T = i.annotation, N = {};
    if (T.type === "lineX") {
      const { x: w } = m(I, 0);
      N.x = w;
    } else if (T.type === "lineY") {
      const { y: w } = m(0, R);
      N.y = w;
    } else if (T.type === "text") {
      const w = T.position.space;
      if (w === "plot") {
        const { x: P, y: B } = p(I, R);
        N.position = { space: w, x: P, y: B };
      } else {
        const { x: P, y: B } = m(I, R);
        N.position = { space: w, x: P, y: B };
      }
    } else if (T.type === "point") {
      const { x: w, y: P } = m(I, R);
      N.x = w, N.y = P;
    }
    n.onDragMove(i.annotationIndex, N);
  }
  function g(x) {
    if (!i) return;
    const F = Ri(t, x.clientX, x.clientY);
    if (!F) return;
    const I = F.x, R = F.y, T = i.annotation, N = {};
    if (T.type === "lineX") {
      const { x: w } = m(I, 0);
      N.x = w;
    } else if (T.type === "lineY") {
      const { y: w } = m(0, R);
      N.y = w;
    } else if (T.type === "text") {
      const w = T.position.space;
      if (w === "plot") {
        const { x: P, y: B } = p(I, R);
        N.position = { space: w, x: P, y: B };
      } else {
        const { x: P, y: B } = m(I, R);
        N.position = { space: w, x: P, y: B };
      }
    } else if (T.type === "point") {
      const { x: w, y: P } = m(I, R);
      N.x = w, N.y = P;
    }
    n.onDragEnd(i.annotationIndex, N), M();
  }
  function S() {
    i && (n.onDragCancel(), M());
  }
  function A(x) {
    i && x.key === "Escape" && (x.preventDefault(), S());
  }
  function M() {
    if (i) {
      if (window.removeEventListener("pointermove", y), window.removeEventListener("pointerup", g), window.removeEventListener("pointercancel", S), document.removeEventListener("keydown", A), i.pointerId !== null)
        try {
          t.releasePointerCapture(i.pointerId);
        } catch {
        }
      document.body.style.cursor = "", i = null;
    }
  }
  function h(x, F, I, R) {
    i && M(), i = {
      annotationIndex: x,
      annotation: F,
      startPointerX: I,
      startPointerY: R,
      pointerId: null
    }, F.type === "lineX" ? document.body.style.cursor = "ew-resize" : F.type === "lineY" ? document.body.style.cursor = "ns-resize" : document.body.style.cursor = "grabbing", window.addEventListener("pointermove", y, { passive: !1 }), window.addEventListener("pointerup", g, { passive: !0 }), window.addEventListener("pointercancel", S, {
      passive: !0
    }), document.addEventListener("keydown", A, { passive: !1 }), n.onDragMove(x, {
      style: { ...F.style, opacity: 0.7 }
    });
  }
  function b() {
    return i !== null;
  }
  function v() {
    M();
  }
  return {
    startDrag: h,
    isDragging: b,
    dispose: v
  };
}
const VN = [
  "#ef4444",
  // Red (critical)
  "#f97316",
  // Orange (warning)
  "#eab308",
  // Yellow (caution)
  "#22c55e",
  // Green (success)
  "#06b6d4",
  // Cyan (info)
  "#3b82f6",
  // Blue (primary)
  "#8b5cf6",
  // Purple (accent)
  "#ec4899",
  // Pink (highlight)
  "#ffffff",
  // White (high contrast)
  "#94a3b8",
  // Gray (neutral)
  "#64748b",
  // Dark gray (subtle)
  "#1e293b"
  // Near-black (background)
];
function $N(e, t = {}) {
  const n = t.palette ?? VN, i = t.zIndex ?? 1e3;
  let r = null, o = null, s = null, a = null, l = "create";
  function c() {
    const N = document.createElement("div");
    return N.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: ${i + 1};
      display: flex;
      align-items: center;
      justify-content: center;
    `, N.addEventListener("click", (w) => {
      w.target === N && v();
    }), N;
  }
  function u() {
    const N = document.createElement("div");
    return N.style.cssText = `
      width: 320px;
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e0e0e0;
    `, N;
  }
  function f(N, w) {
    const P = document.createElement("div");
    P.style.cssText = `
      margin-bottom: 16px;
    `;
    const B = document.createElement("label");
    return B.textContent = N, B.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #b0b0b0;
    `, P.appendChild(B), P.appendChild(w), P;
  }
  function d(N, w, P = "") {
    const B = document.createElement("input");
    return B.type = "text", B.placeholder = N, B.maxLength = w, B.value = P, B.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: #2a2a3e;
      border: 1px solid #444;
      border-radius: 4px;
      color: #e0e0e0;
      font-size: 14px;
      box-sizing: border-box;
    `, B.addEventListener("focus", () => {
      B.style.borderColor = "#3b82f6";
    }), B.addEventListener("blur", () => {
      B.style.borderColor = "#444";
    }), B;
  }
  function m(N, w, P = "") {
    const B = document.createElement("textarea");
    return B.placeholder = N, B.maxLength = w, B.value = P, B.rows = 3, B.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: #2a2a3e;
      border: 1px solid #444;
      border-radius: 4px;
      color: #e0e0e0;
      font-size: 14px;
      box-sizing: border-box;
      resize: vertical;
      font-family: inherit;
    `, B.addEventListener("focus", () => {
      B.style.borderColor = "#3b82f6";
    }), B.addEventListener("blur", () => {
      B.style.borderColor = "#444";
    }), B;
  }
  function p(N) {
    const w = document.createElement("div");
    w.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    `;
    let P = N;
    return n.forEach((B) => {
      const _ = document.createElement("button");
      _.type = "button", _.dataset.color = B, _.style.cssText = `
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        background: ${B};
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
        box-shadow: ${B === P ? "inset 0 0 0 2px #ffffff, inset 0 0 0 3px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)" : "inset 0 0 0 1px rgba(255, 255, 255, 0.1)"};
        transform: ${B === P ? "scale(1.05)" : "scale(1)"};
      `;
      const C = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      C.setAttribute("viewBox", "0 0 24 24"), C.setAttribute("fill", "none"), C.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60%;
        height: 60%;
        pointer-events: none;
        opacity: ${B === P ? "1" : "0"};
        transition: opacity 0.15s ease-out;
      `;
      const E = document.createElementNS("http://www.w3.org/2000/svg", "path");
      E.setAttribute("d", "M20 6L9 17l-5-5"), E.setAttribute("stroke", "#ffffff"), E.setAttribute("stroke-width", "3"), E.setAttribute("stroke-linecap", "round"), E.setAttribute("stroke-linejoin", "round"), E.style.cssText = `
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.9));
      `, C.appendChild(E), _.appendChild(C), _.addEventListener("click", () => {
        P = B, Array.from(w.children).forEach((U) => {
          const G = U, D = G.dataset.color === B;
          G.style.boxShadow = D ? "inset 0 0 0 2px #ffffff, inset 0 0 0 3px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)" : "inset 0 0 0 1px rgba(255, 255, 255, 0.1)", G.style.transform = D ? "scale(1.05)" : "scale(1)";
          const k = G.querySelector("svg");
          k && (k.style.opacity = D ? "1" : "0");
        });
      }), _.addEventListener("mouseenter", () => {
        B !== P && (_.style.transform = "scale(1.1)", _.style.boxShadow = "inset 0 0 0 2px rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4)");
      }), _.addEventListener("mouseleave", () => {
        B !== P && (_.style.transform = "scale(1)", _.style.boxShadow = "inset 0 0 0 1px rgba(255, 255, 255, 0.1)");
      }), w.appendChild(_);
    }), {
      container: w,
      getValue: () => P
    };
  }
  function y(N, w) {
    const P = document.createElement("select");
    return P.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: #2a2a3e;
      border: 1px solid #444;
      border-radius: 4px;
      color: #e0e0e0;
      font-size: 14px;
      cursor: pointer;
    `, N.forEach((B) => {
      const _ = document.createElement("option");
      _.value = B.value, _.textContent = B.label, B.value === w && (_.selected = !0), P.appendChild(_);
    }), {
      container: P,
      getValue: () => P.value
    };
  }
  function g(N, w, P, B, _ = "") {
    const C = document.createElement("div");
    C.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    const E = document.createElement("input");
    E.type = "range", E.min = String(N), E.max = String(w), E.step = String(P), E.value = String(B), E.style.cssText = `
      flex: 1;
      cursor: pointer;
    `;
    const U = document.createElement("span");
    return U.textContent = `${B}${_}`, U.style.cssText = `
      min-width: 40px;
      text-align: right;
      font-size: 13px;
      color: #b0b0b0;
    `, E.addEventListener("input", () => {
      U.textContent = `${E.value}${_}`;
    }), C.appendChild(E), C.appendChild(U), {
      container: C,
      getValue: () => parseFloat(E.value)
    };
  }
  function S(N, w, P) {
    const B = document.createElement("div");
    B.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    `;
    const _ = document.createElement("button");
    _.type = "button", _.textContent = "Cancel", _.style.cssText = `
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #444;
      border-radius: 4px;
      color: #888;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s;
    `, _.addEventListener("mouseenter", () => {
      _.style.background = "#2a2a3e";
    }), _.addEventListener("mouseleave", () => {
      _.style.background = "transparent";
    }), _.addEventListener("click", P);
    const C = document.createElement("button");
    return C.type = "button", C.textContent = N, C.style.cssText = `
      padding: 8px 16px;
      background: #2a2a3e;
      border: 1px solid #444;
      border-radius: 4px;
      color: #e0e0e0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    `, C.addEventListener("mouseenter", () => {
      C.style.background = "#3a3a4e";
    }), C.addEventListener("mouseleave", () => {
      C.style.background = "#2a2a3e";
    }), C.addEventListener("click", w), B.appendChild(_), B.appendChild(C), B;
  }
  function A(N) {
    var G, O, D, k;
    const w = document.createElement("div"), P = ((G = N.label) == null ? void 0 : G.text) ?? "", B = d("Line label", 100, P), _ = p(((O = N.style) == null ? void 0 : O.color) ?? n[0]), C = y(
      [
        { label: "Solid", value: "solid" },
        { label: "Dashed", value: "dashed" },
        { label: "Dotted", value: "dotted" }
      ],
      (D = N.style) != null && D.lineDash ? N.style.lineDash.length === 4 ? "dashed" : "dotted" : "solid"
    ), E = g(1, 8, 1, ((k = N.style) == null ? void 0 : k.lineWidth) ?? 2, "px");
    w.appendChild(f("Label (optional)", B)), w.appendChild(f("Color", _.container)), w.appendChild(f("Line Style", C.container)), w.appendChild(f("Line Width", E.container));
    const U = S(
      l === "create" ? "Create" : "Save",
      () => {
        const W = {
          solid: void 0,
          dashed: [4, 4],
          dotted: [2, 2]
        }, j = B.value.trim(), ee = {
          ...N,
          label: j ? {
            ...N.label,
            text: j
          } : void 0,
          style: {
            ...N.style,
            color: _.getValue(),
            lineWidth: E.getValue(),
            lineDash: W[C.getValue()]
          }
        };
        b(ee);
      },
      () => v()
    );
    return w.appendChild(U), w;
  }
  function M(N) {
    var E;
    const w = document.createElement("div"), P = N.text ?? "", B = m("Text content", 500, P), _ = p(((E = N.style) == null ? void 0 : E.color) ?? n[0]);
    w.appendChild(f("Text", B)), w.appendChild(f("Color", _.container));
    const C = S(
      l === "create" ? "Create" : "Save",
      () => {
        const U = B.value.trim();
        if (!U) {
          B.style.borderColor = "#ef4444", B.focus();
          return;
        }
        const G = {
          ...N,
          text: U,
          style: {
            ...N.style,
            color: _.getValue()
          }
        };
        b(G);
      },
      () => v()
    );
    return w.appendChild(C), w;
  }
  function h(N) {
    var G, O, D, k, W;
    const w = document.createElement("div"), P = ((G = N.label) == null ? void 0 : G.text) ?? "", B = d("Point label", 100, P), _ = p(((O = N.style) == null ? void 0 : O.color) ?? n[0]), C = ((D = N.marker) == null ? void 0 : D.size) ?? ((W = (k = N.marker) == null ? void 0 : k.style) == null ? void 0 : W.markerSize) ?? 8, E = g(4, 16, 1, C, "px");
    w.appendChild(f("Label (optional)", B)), w.appendChild(f("Color", _.container)), w.appendChild(f("Marker Size", E.container));
    const U = S(
      l === "create" ? "Create" : "Save",
      () => {
        var fe;
        const j = B.value.trim(), ee = {
          ...N,
          label: j ? {
            ...N.label,
            text: j
          } : void 0,
          marker: {
            ...N.marker,
            size: E.getValue(),
            style: {
              ...(fe = N.marker) == null ? void 0 : fe.style,
              color: _.getValue()
            }
          }
        };
        b(ee);
      },
      () => v()
    );
    return w.appendChild(U), w;
  }
  function b(N) {
    s && s(N), R();
  }
  function v() {
    a && a(), R();
  }
  function x(N) {
    N.key === "Escape" && (N.preventDefault(), v());
  }
  function F(N, w, P, B) {
    l = "create", s = P, a = B, r = c(), o = u();
    const _ = document.createElement("h3");
    _.textContent = `Add ${N === "lineX" ? "Vertical Line" : N === "lineY" ? "Horizontal Line" : N === "text" ? "Text Note" : "Point Marker"}`, _.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    `, o.appendChild(_);
    let C;
    N === "lineX" || N === "lineY" ? C = A(w) : N === "text" ? C = M(w) : C = h(w), o.appendChild(C), r.appendChild(o), e.appendChild(r), document.addEventListener("keydown", x);
    const E = o.querySelector("input, textarea");
    E && setTimeout(() => E.focus(), 50);
  }
  function I(N, w, P) {
    l = "edit", s = w, a = P, r = c(), o = u();
    const B = document.createElement("h3");
    B.textContent = "Edit Annotation", B.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    `, o.appendChild(B);
    let _;
    N.type === "lineX" || N.type === "lineY" ? _ = A(N) : N.type === "text" ? _ = M(N) : _ = h(N), o.appendChild(_), r.appendChild(o), e.appendChild(r), document.addEventListener("keydown", x);
    const C = o.querySelector("input, textarea");
    C && setTimeout(() => C.focus(), 50);
  }
  function R() {
    r && r.parentNode && r.parentNode.removeChild(r), r = null, o = null, s = null, a = null, document.removeEventListener("keydown", x);
  }
  function T() {
    R();
  }
  return {
    showCreate: F,
    showEdit: I,
    hide: R,
    dispose: T
  };
}
const Em = (e) => Array.isArray(e), zl = (e) => Array.isArray(e), qN = (e) => Em(e) ? e[0] : e.x, jN = (e) => Em(e) ? e[1] : e.y, ZN = (e) => zl(e) ? e[0] : e.timestamp;
function RM(e, t, n = {}) {
  const { menuZIndex: i = 1e3, enableContextMenu: r = !0 } = n, o = e.querySelector("canvas");
  if (!o)
    throw new Error("createAnnotationAuthoring: canvas element not found in container");
  let s = [{ annotations: t.options.annotations ?? [] }], a = 0, l = !1;
  const c = WN(t, o, {
    lineTolerance: 20,
    textTolerance: 8,
    pointTolerance: 16
  }), u = $N(e, {
    zIndex: i
  }), f = XN(t, o, {
    onDragMove: (z, $) => {
      const Q = d().map((K, ne) => ne === z ? { ...K, ...$ } : K);
      p(Q);
    },
    onDragEnd: (z, $) => {
      const Q = d().map((K, ne) => ne === z ? { ...K, ...$ } : K);
      p(Q), m(Q);
    },
    onDragCancel: () => {
      const z = s[a];
      z && p(z.annotations);
    }
  }), d = () => t.options.annotations ?? [], m = (z) => {
    s = s.slice(0, a + 1), s.push({ annotations: [...z] }), a = s.length - 1, s.length > 50 && (s.shift(), a--);
  }, p = (z) => {
    t.setOption({
      ...t.options,
      annotations: [...z]
    }), c.invalidateCache();
  };
  let y = null;
  const g = () => {
    const z = document.createElement("div");
    return z.style.position = "fixed", z.style.display = "none", z.style.backgroundColor = "#1a1a2e", z.style.border = "1px solid #333", z.style.borderRadius = "8px", z.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.5)", z.style.zIndex = String(i), z.style.minWidth = "180px", z.style.padding = "6px 0", z.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', z.style.fontSize = "14px", z.style.color = "#e0e0e0", document.body.appendChild(z), z;
  }, S = (z, $) => {
    const Z = document.createElement("div");
    return Z.textContent = z, Z.style.padding = "8px 16px", Z.style.cursor = "pointer", Z.style.transition = "background-color 0.15s", Z.style.userSelect = "none", Z.addEventListener("mouseenter", () => {
      Z.style.backgroundColor = "#2a2a3e";
    }), Z.addEventListener("mouseleave", () => {
      Z.style.backgroundColor = "transparent";
    }), Z.addEventListener("click", () => {
      $(), x();
    }), Z;
  }, A = () => {
    const z = document.createElement("div");
    return z.style.height = "1px", z.style.backgroundColor = "#333", z.style.margin = "6px 0", z;
  }, M = (z, $, Z) => {
    z.innerHTML = "", z.appendChild(S("Edit annotation...", () => B($, Z))), z.appendChild(S("Delete annotation", () => _($))), z.appendChild(A()), z.appendChild(S("Add vertical line here", () => N())), z.appendChild(S("Add horizontal line here", () => w())), z.appendChild(S("Add text note here", () => P()));
  }, h = (z) => {
    z.innerHTML = "", z.appendChild(S("Add vertical line here", () => N())), z.appendChild(S("Add horizontal line here", () => w())), z.appendChild(S("Add text note here", () => P()));
  };
  let b = null;
  const v = (z) => {
    if (!y) return;
    b = t.hitTest(z);
    const $ = Ri(o, z.clientX, z.clientY);
    if (!$) return;
    const Z = $.x, Q = $.y, K = c.hitTest(Z, Q);
    K ? M(y, K.annotationIndex, K.annotation) : h(y), y.style.display = "block", y.style.left = `${z.clientX}px`, y.style.top = `${z.clientY}px`, requestAnimationFrame(() => {
      if (!y || y.style.display !== "block") return;
      const ne = y.getBoundingClientRect();
      let L = z.clientX, le = z.clientY;
      ne.right > window.innerWidth && (L = Math.max(0, z.clientX - ne.width)), ne.bottom > window.innerHeight && (le = Math.max(0, z.clientY - ne.height)), (L !== z.clientX || le !== z.clientY) && (y.style.left = `${L}px`, y.style.top = `${le}px`);
    });
  }, x = () => {
    y && (y.style.display = "none", b = null);
  }, F = () => {
    var K, ne;
    const z = t.options;
    let $ = (K = z.xAxis) == null ? void 0 : K.min, Z = (ne = z.xAxis) == null ? void 0 : ne.max;
    if ($ === void 0 || Z === void 0) {
      const L = z.series ?? [];
      let le = Number.POSITIVE_INFINITY, se = Number.NEGATIVE_INFINITY;
      for (const ae of L)
        if (ae.type !== "pie")
          if (ae.type === "candlestick" || ae.type === "ohlc") {
            const de = ae.data;
            for (const re of de) {
              const ie = ZN(re);
              ie < le && (le = ie), ie > se && (se = ie);
            }
          } else {
            const de = ae.data;
            for (const re of de) {
              const ie = qN(re);
              ie < le && (le = ie), ie > se && (se = ie);
            }
          }
      $ === void 0 && ($ = Number.isFinite(le) ? le : 0), Z === void 0 && (Z = Number.isFinite(se) ? se : 100);
    }
    const Q = t.getZoomRange();
    if (Q) {
      const L = Z - $, le = $ + Q.start / 100 * L, se = $ + Q.end / 100 * L;
      return { min: le, max: se };
    }
    return { min: $, max: Z };
  }, I = () => {
    var Q, K;
    const z = t.options;
    let $ = (Q = z.yAxis) == null ? void 0 : Q.min, Z = (K = z.yAxis) == null ? void 0 : K.max;
    if ($ === void 0 || Z === void 0) {
      const ne = z.series ?? [];
      let L = Number.POSITIVE_INFINITY, le = Number.NEGATIVE_INFINITY;
      for (const se of ne)
        if (se.type !== "pie")
          if (se.type === "candlestick" || se.type === "ohlc") {
            const ae = se.data;
            for (const de of ae) {
              const re = zl(de) ? de[3] : de.low, ie = zl(de) ? de[4] : de.high;
              re < L && (L = re), ie > le && (le = ie);
            }
          } else {
            const ae = se.data;
            for (const de of ae) {
              const re = jN(de);
              re < L && (L = re), re > le && (le = re);
            }
          }
      $ === void 0 && ($ = Number.isFinite(L) ? L : 0), Z === void 0 && (Z = Number.isFinite(le) ? le : 100);
    }
    return { min: $, max: Z };
  }, R = (z) => {
    const { width: $ } = lr(o), Z = t.options.grid ?? ni, Q = $ - (Z.left ?? ni.left) - (Z.right ?? ni.right), K = F(), ne = Q > 0 ? z / Q : 0;
    return K.min + ne * (K.max - K.min);
  }, T = (z, $) => {
    const { width: Z, height: Q } = lr(o), K = t.options.grid ?? ni, ne = Z - (K.left ?? ni.left) - (K.right ?? ni.right), L = Q - (K.top ?? ni.top) - (K.bottom ?? ni.bottom), le = ne > 0 ? z / ne : 0, se = L > 0 ? $ / L : 0;
    return { x: le, y: se };
  }, N = () => {
    if (!b) return;
    const { match: z, isInGrid: $, gridX: Z } = b;
    let Q;
    if (z)
      Q = z.value[0];
    else if ($)
      Q = R(Z);
    else
      return;
    u.showCreate(
      "lineX",
      {
        type: "lineX",
        x: Q,
        layer: "aboveSeries",
        style: {
          color: "#ffa500",
          lineWidth: 2
        }
      },
      (K) => {
        const L = [...d(), K];
        p(L), m(L);
      },
      () => {
      }
    );
  }, w = () => {
    if (!b) return;
    const { match: z, isInGrid: $, gridY: Z } = b;
    let Q;
    if (z)
      Q = z.value[1];
    else if ($) {
      const { height: K } = lr(o), ne = t.options.grid ?? ni, L = K - (ne.top ?? ni.top) - (ne.bottom ?? ni.bottom), le = I(), se = L > 0 ? 1 - Z / L : 0.5;
      Q = le.min + se * (le.max - le.min);
    } else
      return;
    u.showCreate(
      "lineY",
      {
        type: "lineY",
        y: Q,
        layer: "aboveSeries",
        style: {
          color: "#ffa500",
          lineWidth: 2
        }
      },
      (K) => {
        const L = [...d(), K];
        p(L), m(L);
      },
      () => {
      }
    );
  }, P = () => {
    if (!b) return;
    const { match: z, isInGrid: $, gridX: Z, gridY: Q } = b;
    let K, ne, L;
    if (z)
      K = "data", ne = z.value[0], L = z.value[1];
    else if ($) {
      const le = T(Z, Q);
      K = "plot", ne = le.x, L = le.y;
    } else
      return;
    u.showCreate(
      "text",
      {
        type: "text",
        position: { space: K, x: ne, y: L },
        text: "Note",
        layer: "aboveSeries",
        style: {
          color: "#00d4ff"
        }
      },
      (le) => {
        const ae = [...d(), le];
        p(ae), m(ae);
      },
      () => {
      }
    );
  }, B = (z, $) => {
    u.showEdit(
      $,
      (Z) => {
        const K = d().map((ne, L) => L === z ? { ...ne, ...Z } : ne);
        p(K), m(K);
      },
      () => {
      }
    );
  }, _ = (z) => {
    const Z = d().filter((Q, K) => K !== z);
    p(Z), m(Z);
  }, C = (z) => {
    if (l || z.button === 2) return;
    const $ = Ri(o, z.clientX, z.clientY);
    if (!$) return;
    const Z = $.x, Q = $.y, K = c.hitTest(Z, Q);
    K && (z.preventDefault(), f.startDrag(K.annotationIndex, K.annotation, z.clientX, z.clientY));
  }, E = (z) => {
    l || !r || (z.preventDefault(), z.stopPropagation(), v(z));
  }, U = (z) => {
    l || y && !y.contains(z.target) && x();
  }, G = (z) => {
    l || z.key === "Escape" && y && y.style.display === "block" && x();
  }, O = () => {
    l || y && y.style.display === "block" && x();
  }, D = (z) => {
    const $ = d(), Z = {
      type: "lineX",
      x: z,
      layer: "aboveSeries",
      style: {
        color: "#ffa500",
        lineWidth: 2,
        opacity: 0.9
      }
    }, Q = [...$, Z];
    p(Q), m(Q);
  }, k = (z, $, Z, Q = "data") => {
    const K = d(), ne = {
      type: "text",
      position: { space: Q, x: z, y: $ },
      text: Z,
      layer: "aboveSeries",
      style: {
        color: "#00d4ff",
        opacity: 1
      }
    }, L = [...K, ne];
    p(L), m(L);
  }, W = () => {
    if (a <= 0) return !1;
    a--;
    const z = s[a];
    return z ? (p(z.annotations), !0) : !1;
  }, j = () => {
    if (a >= s.length - 1) return !1;
    a++;
    const z = s[a];
    return z ? (p(z.annotations), !0) : !1;
  }, ee = () => {
    const z = d();
    return JSON.stringify(z, null, 2);
  }, fe = () => d(), X = () => {
    l || (l = !0, o.removeEventListener("pointerdown", C), o.removeEventListener("contextmenu", E), document.removeEventListener("click", U), document.removeEventListener("keydown", G), window.removeEventListener("scroll", O, !0), window.removeEventListener("resize", O), y == null || y.remove(), y = null, c.dispose(), f.dispose(), u.dispose(), s = []);
  };
  return r && (y = g(), o.addEventListener("contextmenu", E), document.addEventListener("click", U), document.addEventListener("keydown", G), window.addEventListener("scroll", O, !0), window.addEventListener("resize", O)), o.addEventListener("pointerdown", C), {
    addVerticalLine: D,
    addTextNote: k,
    undo: W,
    redo: j,
    exportJSON: ee,
    getAnnotations: fe,
    dispose: X
  };
}
const $i = /* @__PURE__ */ new Map();
function Ql() {
  const e = Symbol("RenderScheduler"), t = {
    id: e,
    running: !1
  };
  return $i.set(e, {
    rafId: null,
    callback: null,
    lastFrameTime: 0,
    dirty: !1,
    frameHandler: null
  }), t;
}
function Lm(e, t) {
  if (!t)
    throw new Error("Render callback is required");
  const n = $i.get(e.id);
  if (!n)
    throw new Error("Invalid scheduler state. Use createRenderScheduler() to create a new state.");
  if (e.running)
    throw new Error("RenderScheduler is already running. Call stopRenderScheduler() before starting again.");
  n.callback = t, n.lastFrameTime = performance.now(), n.dirty = !0;
  const i = e.id, r = (o) => {
    const s = $i.get(i);
    if (!s || !s.callback)
      return;
    s.rafId = null;
    let a = o - s.lastFrameTime;
    const l = 100;
    if (a > l && (a = l), s.lastFrameTime = o, s.dirty) {
      s.dirty = !1, s.callback(a);
      const c = $i.get(i);
      c && c.callback && c.dirty && (c.rafId = requestAnimationFrame(r));
    }
  };
  return n.frameHandler = r, n.rafId = requestAnimationFrame(r), {
    id: e.id,
    running: !0
  };
}
function KN(e) {
  const t = $i.get(e.id);
  if (!t)
    throw new Error("Invalid scheduler state. Use createRenderScheduler() to create a new state.");
  return t.callback = null, t.frameHandler = null, t.rafId !== null && (cancelAnimationFrame(t.rafId), t.rafId = null), {
    id: e.id,
    running: !1
  };
}
function JN(e) {
  const t = $i.get(e.id);
  if (!t)
    throw new Error("Invalid scheduler state. Use createRenderScheduler() to create a new state.");
  t.dirty = !0, t.callback !== null && t.rafId === null && (t.lastFrameTime = performance.now(), t.frameHandler && (t.rafId = requestAnimationFrame(t.frameHandler)));
}
function QN(e) {
  const t = $i.get(e.id);
  return t && (t.rafId !== null && (cancelAnimationFrame(t.rafId), t.rafId = null), t.callback = null, t.frameHandler = null, $i.delete(e.id)), Ql();
}
function DM(e) {
  const t = Ql();
  return Lm(t, e);
}
class kM {
  /**
   * Checks if the scheduler is currently running.
   */
  get running() {
    return this._state.running;
  }
  /**
   * Creates a new RenderScheduler instance.
   */
  constructor() {
    this._state = Ql();
  }
  /**
   * Starts the render loop.
   *
   * @param callback - Function to call each frame with delta time
   * @throws {Error} If callback is not provided or scheduler already running
   */
  start(t) {
    this._state = Lm(this._state, t);
  }
  /**
   * Stops the render loop.
   */
  stop() {
    this._state = KN(this._state);
  }
  /**
   * Marks the current frame as dirty, indicating it needs to be rendered.
   */
  requestRender() {
    JN(this._state);
  }
  /**
   * Destroys the render scheduler and cleans up resources.
   * After calling destroy(), the scheduler must be recreated before use.
   */
  destroy() {
    this._state = QN(this._state);
  }
}
const eM = 0xcbf29ce484222325n, tM = 0x100000001b3n, nM = 0xffffffffffffffffn, iM = (e) => {
  let t = eM;
  for (let n = 0; n < e.length; n++)
    t ^= BigInt(e.charCodeAt(n)), t = BigInt(t * tM) & nM;
  return t.toString(16).padStart(16, "0");
}, rM = 15, pn = (e, t) => {
  e.push(t, "|");
}, dn = (e, t) => {
  e.push("s", String(t.length), ":", t, "|");
}, Un = (e, t) => {
  e.push("n", String(t), "|");
}, ec = (e, t) => {
  e.push(t ? "t|" : "f|");
}, Um = (e) => {
  e.push("0|");
}, vl = (e, t) => {
  if (!t) {
    pn(e, "C0");
    return;
  }
  const n = Object.keys(t);
  if (n.length === 0) {
    pn(e, "C0");
    return;
  }
  n.sort(), pn(e, "C1"), Un(e, n.length);
  for (let i = 0; i < n.length; i++) {
    const r = n[i];
    dn(e, r);
    const o = t[r];
    Un(e, o);
  }
}, oM = (e, t) => e < t ? -1 : e > t ? 1 : 0, sM = (e, t) => {
  if (!t || t.length === 0) {
    pn(e, "B0");
    return;
  }
  let n = 0;
  for (let i = 0; i < t.length; i++)
    t[i] && n++;
  if (n === 0) {
    pn(e, "B0");
    return;
  }
  pn(e, "B1"), Un(e, n);
  for (let i = 0; i < t.length; i++) {
    const r = t[i];
    if (!r) continue;
    Un(e, r.arrayStride), dn(e, r.stepMode ?? "vertex");
    const o = Array.from(r.attributes ?? []);
    if (o.length === 0) {
      pn(e, "A0");
      continue;
    }
    o.sort((s, a) => s.shaderLocation !== a.shaderLocation ? s.shaderLocation - a.shaderLocation : s.offset !== a.offset ? s.offset - a.offset : oM(s.format, a.format)), pn(e, "A1"), Un(e, o.length);
    for (let s = 0; s < o.length; s++) {
      const a = o[s];
      Un(e, a.shaderLocation), Un(e, a.offset), dn(e, a.format);
    }
  }
}, aM = (e, t) => {
  if (!t) {
    pn(e, "BL0");
    return;
  }
  pn(e, "BL1"), dn(e, t.color.operation), dn(e, t.color.srcFactor), dn(e, t.color.dstFactor), dn(e, t.alpha.operation), dn(e, t.alpha.srcFactor), dn(e, t.alpha.dstFactor);
}, lM = (e, t) => {
  if (!t || t.length === 0) {
    pn(e, "T0");
    return;
  }
  pn(e, "T1"), Un(e, t.length);
  for (let n = 0; n < t.length; n++) {
    const i = t[n];
    if (!i) {
      Um(e);
      continue;
    }
    dn(e, i.format), aM(e, i.blend);
    const r = i.writeMask ?? rM;
    Un(e, r);
  }
}, cM = (e, t) => {
  const n = (t == null ? void 0 : t.topology) ?? "triangle-list", i = (t == null ? void 0 : t.stripIndexFormat) ?? null, r = (t == null ? void 0 : t.frontFace) ?? "ccw", o = (t == null ? void 0 : t.cullMode) ?? "none", s = (t == null ? void 0 : t.unclippedDepth) ?? !1;
  dn(e, n), i == null ? Um(e) : dn(e, i), dn(e, r), dn(e, o), ec(e, s);
}, uM = (e, t) => {
  const n = (t == null ? void 0 : t.count) ?? 1, i = (t == null ? void 0 : t.mask) ?? 4294967295, r = (t == null ? void 0 : t.alphaToCoverageEnabled) ?? !1;
  Un(e, n), Un(e, i), ec(e, r);
}, td = (e, t) => {
  if (!t) {
    pn(e, "SF0");
    return;
  }
  pn(e, "SF1"), dn(e, t.compare), dn(e, t.failOp), dn(e, t.depthFailOp), dn(e, t.passOp);
}, fM = (e, t) => {
  if (!t) {
    pn(e, "DS0");
    return;
  }
  pn(e, "DS1"), dn(e, t.format), ec(e, t.depthWriteEnabled ?? !1), dn(e, t.depthCompare ?? "always"), td(e, t.stencilFront), td(e, t.stencilBack), Un(e, t.stencilReadMask ?? 4294967295), Un(e, t.stencilWriteMask ?? 4294967295), Un(e, t.depthBias ?? 0), Un(e, t.depthBiasSlopeScale ?? 0), Un(e, t.depthBiasClamp ?? 0);
};
function EM(e) {
  const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let r = 0, o = 0, s = 0, a = 0, l = 0, c = 0, u = 0, f = 0, d = 0, m = /* @__PURE__ */ new WeakMap(), p = /* @__PURE__ */ new WeakMap(), y = 0, g = 0;
  const S = (F) => {
    const I = m.get(F);
    if (I) return I;
    const R = `ext:${++y}`;
    return m.set(F, R), R;
  }, A = (F) => {
    const I = p.get(F);
    if (I) return I;
    const R = `layout:${++g}`;
    return p.set(F, R), R;
  }, M = () => {
    t.clear(), n.clear(), i.clear(), r = 0, o = 0, s = 0, a = 0, l = 0, c = 0, u = 0, f = 0, d = 0, m = /* @__PURE__ */ new WeakMap(), p = /* @__PURE__ */ new WeakMap(), y = 0, g = 0;
  };
  try {
    e.lost.then(() => {
      M();
    }).catch((F) => {
      typeof F == "object" && F !== null && "message" in F && console.warn("PipelineCache: device.lost promise rejected:", F), M();
    });
  } catch {
  }
  return {
    device: e,
    getStats: () => ({
      shaderModules: {
        total: r,
        hits: o,
        misses: s,
        entries: t.size
      },
      renderPipelines: {
        total: a,
        hits: l,
        misses: c,
        entries: n.size
      },
      computePipelines: {
        total: u,
        hits: f,
        misses: d,
        entries: i.size
      }
    }),
    clear: M,
    getOrCreateShaderModule: (F, I) => {
      r++;
      const R = t.get(F);
      if (R)
        return o++, R;
      s++;
      const T = e.createShaderModule({ code: F, label: I });
      t.set(F, T);
      const N = `wgsl:${iM(F)}:${F.length}`;
      return m.set(T, N), T;
    },
    getOrCreateRenderPipeline: (F) => {
      a++;
      const I = F.layout ?? "auto", R = I === "auto" ? "auto" : A(I), T = F.vertex, N = F.fragment, w = [];
      pn(w, "rp1"), pn(w, "L"), dn(w, R), pn(w, "V"), dn(w, S(T.module)), dn(w, T.entryPoint ?? ""), vl(w, T.constants), sM(w, T.buffers), pn(w, "F"), N ? (pn(w, "F1"), dn(w, S(N.module)), dn(w, N.entryPoint ?? ""), vl(w, N.constants), lM(w, N.targets)) : pn(w, "F0"), pn(w, "P"), cM(w, F.primitive), fM(w, F.depthStencil), pn(w, "M"), uM(w, F.multisample);
      const P = w.join(""), B = n.get(P);
      if (B)
        return l++, B;
      c++;
      const _ = e.createRenderPipeline(F);
      return n.set(P, _), _;
    },
    getOrCreateComputePipeline: (F) => {
      u++;
      const I = F.layout ?? "auto", R = I === "auto" ? "auto" : A(I), T = F.compute, N = [];
      pn(N, "cp1"), pn(N, "L"), dn(N, R), pn(N, "CS"), dn(N, S(T.module)), dn(N, T.entryPoint ?? ""), vl(N, T.constants);
      const w = N.join(""), P = i.get(w);
      if (P)
        return f++, P;
      d++;
      const B = e.createComputePipeline(F);
      return i.set(w, B), B;
    }
  };
}
function LM(e) {
  return e.getStats();
}
function UM(e) {
  e.clear();
}
const _M = "1.0.0", zM = YN;
export {
  Ip as $,
  Uo as A,
  Bn as B,
  zM as C,
  Co as D,
  bc as E,
  Qi as F,
  Gl as G,
  Nr as H,
  Ca as I,
  sd as J,
  wp as K,
  ld as L,
  MM as M,
  Ld as N,
  PM as O,
  Ac as P,
  ji as Q,
  yp as R,
  Mc as S,
  Yl as T,
  Ks as U,
  gp as V,
  xp as W,
  bp as X,
  vp as Y,
  Fa as Z,
  Fp as _,
  vn as a,
  Aa as a0,
  Z0 as a1,
  K0 as a2,
  Pi as a3,
  TM as a4,
  fr as a5,
  ur as a6,
  Ds as a7,
  ks as a8,
  Q0 as a9,
  Es as aa,
  Vd as ab,
  $d as ac,
  qd as ad,
  Oa as ae,
  BM as af,
  RM as ag,
  id as ah,
  NM as ai,
  rd as aj,
  od as ak,
  lp as al,
  cp as am,
  Ql as an,
  DM as ao,
  Lm as ap,
  KN as aq,
  JN as ar,
  QN as as,
  kM as at,
  EM as au,
  LM as av,
  UM as aw,
  Uf as ax,
  Qw as ay,
  wn as b,
  un as c,
  ad as d,
  Hl as e,
  CM as f,
  Xd as g,
  FM as h,
  IM as i,
  Tw as j,
  Lf as k,
  mp as l,
  x0 as m,
  bi as n,
  SM as o,
  Ih as p,
  ds as q,
  BN as r,
  AM as s,
  qc as t,
  HN as u,
  _M as v,
  fn as w,
  ai as x,
  Qn as y,
  wr as z
};
//# sourceMappingURL=index-CRWVNupN.js.map
