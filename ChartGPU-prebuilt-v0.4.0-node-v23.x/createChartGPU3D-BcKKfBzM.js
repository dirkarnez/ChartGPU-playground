import { c as Ve, a as Ae, p as st, b as Oe, w as _e, d as It, e as Ot, g as Jt, s as Yt, f as Qt, h as kt, n as en, i as tn, j as nn, k as rn, l as on, m as an, o as gt, q as sn, r as ln, t as St, G as cn } from "./index-CRWVNupN.js";
const bt = `// pointCloud3d.wgsl
// Camera-facing billboard quads for 3D point clouds (screen-constant size in CSS px).
// Instance data: storage buffer of struct { x, y, z, value } (16-byte stride).
// Draw: draw(6, instanceCount) triangle-list expansion in VS.

struct VSUniforms {
  viewProj: mat4x4<f32>,
  // xy = viewport CSS px, z = point size CSS px (default), w = dpr (unused for size)
  viewport: vec4<f32>,
  // x = valueMin, y = valueMax, z = useColormap (0/1), w = opacity
  colorParams: vec4<f32>,
  // solid RGBA when not colormapping
  solidColor: vec4<f32>,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(0) @binding(1) var<storage, read> points: array<vec4<f32>>;
@group(0) @binding(2) var colormapLut: texture_2d<f32>;

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) localPx: vec2<f32>,
  @location(1) radiusPx: f32,
  @location(2) color: vec4<f32>,
};

fn cornerOffset(corner: u32) -> vec2<f32> {
  // 0:(-1,-1) 1:(1,-1) 2:(-1,1) 3:(-1,1) 4:(1,-1) 5:(1,1) for two tris
  switch corner {
    case 0u: { return vec2<f32>(-1.0, -1.0); }
    case 1u: { return vec2<f32>(1.0, -1.0); }
    case 2u: { return vec2<f32>(-1.0, 1.0); }
    case 3u: { return vec2<f32>(-1.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, -1.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

@vertex
fn vsMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VSOut {
  var out: VSOut;
  let p = points[instanceIndex];
  let world = vec4<f32>(p.xyz, 1.0);
  let clip = vsUniforms.viewProj * world;

  let radiusPx = max(0.5, vsUniforms.viewport.z * 0.5);
  let corner = cornerOffset(vertexIndex % 6u);
  let viewport = max(vsUniforms.viewport.xy, vec2<f32>(1.0, 1.0));

  // Expand in NDC by pixel size (constant screen size)
  let ndcOffset = vec2<f32>(
    corner.x * radiusPx * 2.0 / viewport.x,
    corner.y * radiusPx * 2.0 / viewport.y,
  );

  // Apply offset in clip space proportional to w so size is stable after perspective divide
  out.clipPosition = vec4<f32>(
    clip.x + ndcOffset.x * clip.w,
    clip.y + ndcOffset.y * clip.w,
    clip.z,
    clip.w,
  );
  out.localPx = corner * radiusPx;
  out.radiusPx = radiusPx;

  let useColormap = vsUniforms.colorParams.z > 0.5;
  let opacity = clamp(vsUniforms.colorParams.w, 0.0, 1.0);
  if (useColormap) {
    let vmin = vsUniforms.colorParams.x;
    let vmax = vsUniforms.colorParams.y;
    let span = max(vmax - vmin, 1e-12);
    let t = clamp((p.w - vmin) / span, 0.0, 1.0);
    // 256-wide 1D LUT stored as 256x1 texture
    let texW = f32(textureDimensions(colormapLut).x);
    let u = (t * (texW - 1.0) + 0.5) / texW;
    let sample = textureLoad(colormapLut, vec2<i32>(i32(t * 255.0), 0), 0);
    out.color = vec4<f32>(sample.rgb, sample.a * opacity);
  } else {
    out.color = vec4<f32>(vsUniforms.solidColor.rgb, vsUniforms.solidColor.a * opacity);
  }
  return out;
}

@fragment
fn fsMain(input: VSOut) -> @location(0) vec4<f32> {
  let d = length(input.localPx);
  let aa = fwidth(d);
  let alpha = 1.0 - smoothstep(input.radiusPx - aa, input.radiusPx, d);
  if (alpha <= 0.001) {
    discard;
  }
  let c = input.color;
  // Premultiply for correct blend with depth write on opaque-ish points
  let a = c.a * alpha;
  return vec4<f32>(c.rgb * a, a);
}
`, un = "bgra8unorm", Ie = 16, vt = 112, fn = {
  color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
}, dn = {
  format: "depth24plus",
  depthWriteEnabled: !0,
  depthCompare: "less"
};
function hn(e, t) {
  let n = !1;
  const o = (t == null ? void 0 : t.targetFormat) ?? un, r = 1, i = t == null ? void 0 : t.pipelineCache, l = Ve(e, vt, { label: "pointCloud3d/vsUniforms" }), a = new Float32Array(vt / 4);
  let s = null, y = 0, c = 0, d = null, p = null, x = null, S = 0, h = null, m = null, f = "";
  const g = (C, A) => {
    if (m && f === C) return m;
    const V = Ot(A);
    return h || (h = e.createTexture({
      label: "pointCloud3d/colormapLut",
      size: { width: 256, height: 1 },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    }), m = h.createView()), e.queue.writeTexture({ texture: h }, V, { bytesPerRow: 256 * 4 }, { width: 256, height: 1 }), f = C, m;
  }, v = () => g("__solid__", ["#ffffff", "#ffffff"]), w = e.createBindGroupLayout({
    label: "pointCloud3d/bindGroupLayout",
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        texture: { sampleType: "float", viewDimension: "2d" }
      }
    ]
  }), G = Ae(
    e,
    {
      label: "pointCloud3d/pipeline",
      bindGroupLayouts: [w],
      vertex: { code: bt, label: "pointCloud3d/shader" },
      fragment: {
        code: bt,
        label: "pointCloud3d/shader",
        formats: o,
        blend: fn
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      depthStencil: dn,
      multisample: { count: r }
    },
    i
  );
  let D = null, N = !1;
  const U = (C) => {
    const A = Math.max(Ie, C);
    if (s && y >= A) return s;
    s == null || s.destroy();
    let V = y > 0 ? y : Ie * 64;
    for (; V < A; ) V = Math.ceil(V * 1.5);
    return V = Math.ceil(V / 16) * 16, s = e.createBuffer({
      label: "pointCloud3d/points",
      size: V,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }), y = V, D = null, s;
  }, z = (C, A) => {
    const V = A * Ie, E = U(Math.max(V, Ie));
    A > 0 && e.queue.writeBuffer(E, 0, C.buffer, C.byteOffset, V), c = A, d = A > 0 ? C.subarray(0, A * 4) : null, S++, D = null;
  }, b = (C, A, V) => {
    var ee, te;
    const E = A.viewProj;
    a.set(E, 0), a[16] = A.viewportCssW, a[17] = A.viewportCssH, a[18] = C.pointStyle.size, a[19] = 1;
    const O = C.colorBy != null && (V.hasValue || C.colorBy.values != null), M = ((ee = C.colorBy) == null ? void 0 : ee.min) != null && Number.isFinite(C.colorBy.min) ? C.colorBy.min : V.valueMin, q = ((te = C.colorBy) == null ? void 0 : te.max) != null && Number.isFinite(C.colorBy.max) ? C.colorBy.max : V.valueMax;
    a[20] = M, a[21] = q > M ? q : M + 1, a[22] = O ? 1 : 0;
    const H = mn((A.opacityOverride ?? 1) * C.pointStyle.opacity);
    a[23] = H;
    const J = Oe(C.pointStyle.color) ?? [0.22, 0.74, 0.97, 1];
    a[24] = J[0], a[25] = J[1], a[26] = J[2], a[27] = J[3], _e(e, l, a);
    const oe = O ? g(It(C.colorBy.colormap), C.colorBy.colormap) : v();
    s || U(Ie), D = e.createBindGroup({
      label: "pointCloud3d/bindGroup",
      layout: w,
      entries: [
        { binding: 0, resource: { buffer: l } },
        { binding: 1, resource: { buffer: s } },
        { binding: 2, resource: oe }
      ]
    }), N = !0;
  };
  return {
    prepare: (C, A) => {
      var E, O, M;
      if (n) return;
      const V = C.data;
      if (V !== p) {
        const q = (E = C.colorBy) == null ? void 0 : E.values, H = st(V, { valueOverride: q });
        z(H.packed, H.count), p = V, x = H.packed, b(C, A, H);
      } else
        b(C, A, {
          valueMin: ((O = C.colorBy) == null ? void 0 : O.min) ?? 0,
          valueMax: ((M = C.colorBy) == null ? void 0 : M.max) ?? 1,
          hasValue: C.colorBy != null
        });
    },
    preparePacked: (C, A, V) => {
      n || ((x !== A.packed || c !== A.count) && (z(A.packed, A.count), x = A.packed, p = null), b(C, V, A));
    },
    render(C) {
      n || !N || !D || c <= 0 || (C.setPipeline(G), C.setBindGroup(0, D), C.draw(6, c, 0, 0));
    },
    dispose() {
      n || (n = !0, s == null || s.destroy(), s = null, l.destroy(), h == null || h.destroy(), h = null, m = null, D = null, d = null);
    },
    getPointCount: () => c,
    getUploadCount: () => S,
    getPackedForPick: () => d
  };
}
const mn = (e) => Math.min(1, Math.max(0, e)), Xe = `// surface3d.wgsl
// Uniform grid surface mesh: heights in storage buffer; position/normal expanded in VS.
// Steady-state replaceY uploads 4 B/cell (not 32 B interleaved vertices).

struct VSUniforms {
  viewProj: mat4x4<f32>,
  // xyz = light direction (world), w = lighting strength 0..1
  light: vec4<f32>,
  // x = yMin, y = yMax, z = opacity, w = unused
  colorParams: vec4<f32>,
  // ambient RGB + pad
  ambient: vec4<f32>,
  // xStart, xStep, zStart, zStep
  grid: vec4<f32>,
  // columns, rows, unused, unused (as f32 for uniform packing)
  gridDims: vec4<f32>,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(0) @binding(1) var colormapLut: texture_2d<f32>;
@group(0) @binding(2) var<storage, read> heights: array<f32>;

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) worldNormal: vec3<f32>,
  @location(1) color: vec4<f32>,
};

// Non-finite heights → 0 (matches prior packSurface3D heightAt policy).
fn heightAt(idx: u32, count: u32) -> f32 {
  if (idx >= count) {
    return 0.0;
  }
  let h = heights[idx];
  // NaN != NaN; also reject ±Inf via abs check against huge threshold is unnecessary —
  // WGSL select with isnan-equivalent: h == h is false for NaN.
  if (h != h) {
    return 0.0;
  }
  // ±Inf: treat as hole (0) for stable normals/positions
  if (h > 1e30 || h < -1e30) {
    return 0.0;
  }
  return h;
}

fn sampleVertex(vid: u32) -> VSOut {
  var out: VSOut;
  let columns = u32(vsUniforms.gridDims.x);
  let rows = u32(vsUniforms.gridDims.y);
  let count = columns * rows;
  if (columns < 2u || rows < 2u || vid >= count) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    out.worldNormal = vec3<f32>(0.0, 1.0, 0.0);
    out.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }

  let i = vid % columns;
  let j = vid / columns;
  let xStart = vsUniforms.grid.x;
  let xStep = vsUniforms.grid.y;
  let zStart = vsUniforms.grid.z;
  let zStep = vsUniforms.grid.w;
  let x = xStart + f32(i) * xStep;
  let z = zStart + f32(j) * zStep;
  let h = heightAt(vid, count);

  // Central differences (edge-clamped), same as packSurface3D.
  // Use min/max — avoid u32 underflow from i-1 when i==0 in select() args.
  let iL = max(i, 1u) - 1u;
  let iR = min(i + 1u, columns - 1u);
  let jD = max(j, 1u) - 1u;
  let jU = min(j + 1u, rows - 1u);
  let hL = heightAt(j * columns + iL, count);
  let hR = heightAt(j * columns + iR, count);
  let hD = heightAt(jD * columns + i, count);
  let hU = heightAt(jU * columns + i, count);
  let dx = select(xStep, f32(iR - iL) * xStep, iR != iL);
  let dz = select(zStep, f32(jU - jD) * zStep, jU != jD);
  var nx = -(hR - hL) / dx;
  var ny = 1.0;
  var nz = -(hU - hD) / dz;
  let len = max(length(vec3<f32>(nx, ny, nz)), 1e-12);
  nx = nx / len;
  ny = ny / len;
  nz = nz / len;

  out.clipPosition = vsUniforms.viewProj * vec4<f32>(x, h, z, 1.0);
  out.worldNormal = vec3<f32>(nx, ny, nz);

  let ymin = vsUniforms.colorParams.x;
  let ymax = vsUniforms.colorParams.y;
  let span = max(ymax - ymin, 1e-12);
  let t = clamp((h - ymin) / span, 0.0, 1.0);
  let sample = textureLoad(colormapLut, vec2<i32>(i32(t * 255.0), 0), 0);
  let opacity = clamp(vsUniforms.colorParams.z, 0.0, 1.0);
  out.color = vec4<f32>(sample.rgb, sample.a * opacity);
  return out;
}

@vertex
fn vsMain(@builtin(vertex_index) vid: u32) -> VSOut {
  return sampleVertex(vid);
}

@fragment
fn fsMain(input: VSOut) -> @location(0) vec4<f32> {
  let n = normalize(input.worldNormal);
  let lightDir = normalize(vsUniforms.light.xyz);
  let strength = clamp(vsUniforms.light.w, 0.0, 1.0);
  let ndotl = max(dot(n, lightDir), 0.0);
  let ambient = vsUniforms.ambient.rgb;
  // lighting=0 → unlit colormap; lighting=1 → ambient + diffuse
  let lit = mix(vec3<f32>(1.0), ambient + vec3<f32>(ndotl), strength);
  let rgb = input.color.rgb * lit;
  let a = input.color.a;
  return vec4<f32>(rgb * a, a);
}

@vertex
fn vsMainWire(@builtin(vertex_index) vid: u32) -> VSOut {
  var out = sampleVertex(vid);
  // Slightly brighten wire (matches prior vsMainWire)
  out.color = vec4<f32>(out.color.rgb * 0.85 + 0.15, out.color.a);
  return out;
}

@fragment
fn fsMainWire(input: VSOut) -> @location(0) vec4<f32> {
  let a = input.color.a;
  return vec4<f32>(input.color.rgb * a, a);
}
`;
function $e(e) {
  if (!e || typeof e != "object") return null;
  const t = Math.floor(Number(e.columns)), n = Math.floor(Number(e.rows));
  return !(t >= 2) || !(n >= 2) || !Number.isFinite(e.xStart) || !Number.isFinite(e.zStart) || !Number.isFinite(e.xStep) || e.xStep === 0 || !Number.isFinite(e.zStep) || e.zStep === 0 || !e.y || typeof e.y.length != "number" ? null : (e.y.length < t * n && console.warn(
    `ChartGPU surface3d: y length (${e.y.length}) < columns*rows (${t * n}); missing cells use 0.`
  ), {
    xStart: e.xStart,
    xStep: e.xStep,
    zStart: e.zStart,
    zStep: e.zStep,
    columns: t,
    rows: n,
    y: e.y
  });
}
function pn(e) {
  const t = $e(e);
  if (!t) return null;
  const { columns: n, rows: o, xStart: r, xStep: i, zStart: l, zStep: a, y: s } = t, y = r, c = r + (n - 1) * i, d = l, p = l + (o - 1) * a, x = Math.min(y, c), S = Math.max(y, c), h = Math.min(d, p), m = Math.max(d, p);
  let f = 1 / 0, g = -1 / 0, v = !1;
  const w = n * o, G = s;
  for (let D = 0; D < w; D++) {
    const N = Number(G[D]), U = Number.isFinite(N) ? N : 0;
    U < f && (f = U), U > g && (g = U), v = !0;
  }
  return !v || !Number.isFinite(f) ? null : {
    min: [x, f, h],
    max: [S, g, m]
  };
}
function yn(e, t, n, o) {
  let r = e.min[1], i = e.max[1];
  const l = Math.min(o, n.length);
  for (let a = 0; a < l; a++) {
    const s = Number(n[a]);
    Number.isFinite(s) && (s < r && (r = s), s > i && (i = s));
  }
  return {
    min: [e.min[0] + t, r, e.min[2]],
    max: [e.max[0] + t, i, e.max[2]]
  };
}
function Mt(e, t) {
  const n = t * (e - 1), o = e * (t - 1), r = new Uint32Array((n + o) * 2);
  let i = 0;
  for (let l = 0; l < t; l++)
    for (let a = 0; a < e - 1; a++) {
      const s = l * e + a;
      r[i++] = s, r[i++] = s + 1;
    }
  for (let l = 0; l < t - 1; l++)
    for (let a = 0; a < e; a++) {
      const s = l * e + a;
      r[i++] = s, r[i++] = s + e;
    }
  return r;
}
const xn = "bgra8unorm", wt = 144, Pt = {
  color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
}, Ct = {
  format: "depth24plus",
  depthWriteEnabled: !0,
  depthCompare: "less"
};
function gn(e, t) {
  const n = (e - 1) * (t - 1), o = new Uint32Array(n * 6);
  let r = 0;
  for (let i = 0; i < t - 1; i++)
    for (let l = 0; l < e - 1; l++) {
      const a = i * e + l, s = a + 1, y = a + e, c = y + 1;
      o[r++] = a, o[r++] = y, o[r++] = s, o[r++] = s, o[r++] = y, o[r++] = c;
    }
  return o;
}
function Sn(e, t, n) {
  const o = n.length >= t ? n.length === t ? n : n.subarray(0, t) : new Float32Array(t);
  for (let r = 0; r < t; r++)
    if (r < e.length) {
      const i = Number(e[r]);
      o[r] = Number.isFinite(i) ? i : Number.NaN;
    } else
      o[r] = Number.NaN;
  return o;
}
function bn(e, t) {
  let n = !1;
  const o = (t == null ? void 0 : t.targetFormat) ?? xn, r = 1, i = t == null ? void 0 : t.pipelineCache, l = Ve(e, wt, { label: "surface3d/vsUniforms" }), a = new Float32Array(wt / 4);
  let s = null, y = 0, c = null, d = null, p = 0, x = 0, S = null, h = null, m = !1, f = -1, g = -1, v = NaN, w = NaN, G = NaN, D = NaN, N = 0, U = !1, z = !1, b = null, B = null, F = null, C = "";
  const A = (_, $) => {
    if (F && C === _) return F;
    const Q = Ot($);
    return B || (B = e.createTexture({
      label: "surface3d/colormapLut",
      size: { width: 256, height: 1 },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    }), F = B.createView()), e.queue.writeTexture({ texture: B }, Q, { bytesPerRow: 256 * 4 }, { width: 256, height: 1 }), C = _, F;
  }, V = e.createBindGroupLayout({
    label: "surface3d/bindGroupLayout",
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        texture: { sampleType: "float", viewDimension: "2d" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" }
      }
    ]
  }), E = Ae(
    e,
    {
      label: "surface3d/solid",
      bindGroupLayouts: [V],
      vertex: {
        code: Xe,
        label: "surface3d/shader",
        entryPoint: "vsMain",
        buffers: []
      },
      fragment: {
        code: Xe,
        label: "surface3d/shader",
        entryPoint: "fsMain",
        formats: o,
        blend: Pt
      },
      primitive: { topology: "triangle-list", cullMode: "none", frontFace: "ccw" },
      depthStencil: Ct,
      multisample: { count: r }
    },
    i
  ), O = Ae(
    e,
    {
      label: "surface3d/wire",
      bindGroupLayouts: [V],
      vertex: {
        code: Xe,
        label: "surface3d/shader",
        entryPoint: "vsMainWire",
        buffers: []
      },
      fragment: {
        code: Xe,
        label: "surface3d/shader",
        entryPoint: "fsMainWire",
        formats: o,
        blend: Pt
      },
      primitive: { topology: "line-list", cullMode: "none" },
      depthStencil: Ct,
      multisample: { count: r }
    },
    i
  );
  let M = null, q = "", H = null, J = !1, oe = !1, ee = 0, te = 0;
  const ae = () => {
    var Q, X;
    const _ = ((Q = e.limits) == null ? void 0 : Q.maxStorageBufferBindingSize) ?? Number.POSITIVE_INFINITY, $ = ((X = e.limits) == null ? void 0 : X.maxBufferSize) ?? Number.POSITIVE_INFINITY;
    return Math.min(_, $);
  }, ve = (_) => {
    const $ = Math.max(Math.ceil(_ / 4) * 4, 4), Q = ae();
    if ($ > Q)
      return z || (z = !0, console.warn(
        `ChartGPU surface3d: height field (${$} bytes) exceeds device storage limit (min(maxStorageBufferBindingSize, maxBufferSize)=${Q}). Skipping mesh draw.`
      )), null;
    if (!s || y < $) {
      s == null || s.destroy();
      const X = s ? Math.max($, y * 2) : $, K = Math.min(X, Q);
      if (K < $)
        return null;
      s = e.createBuffer({
        label: "surface3d/heights",
        size: K,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      }), y = K, M = null, H = null;
    }
    return s;
  }, me = (_, $) => {
    const Q = $ * 4, X = ve(Q);
    if (!X) return !1;
    if (_ instanceof Float32Array && _.length >= $) {
      const K = _.length === $ ? _ : _.subarray(0, $);
      e.queue.writeBuffer(X, 0, K.buffer, K.byteOffset, Q);
    } else {
      (!b || b.length < $) && (b = new Float32Array($));
      const K = Sn(_, $, b);
      K !== b && K.length >= $ && (b = K), e.queue.writeBuffer(X, 0, K.buffer, K.byteOffset, Q);
    }
    return N++, !0;
  }, ye = (_, $, Q) => {
    if (_ === f && $ === g && c != null)
      if (Q && !d) {
        const K = Mt(_, $), se = K.byteLength, he = Math.ceil(se / 4) * 4;
        d = e.createBuffer({
          label: "surface3d/wireIndices",
          size: Math.max(he, 4),
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        }), e.queue.writeBuffer(d, 0, K.buffer, K.byteOffset, se), x = K.length;
      } else Q || (d == null || d.destroy(), d = null, x = 0);
    else {
      c == null || c.destroy(), d == null || d.destroy();
      const K = gn(_, $), se = K.byteLength, he = Math.ceil(se / 4) * 4;
      if (c = e.createBuffer({
        label: "surface3d/indices",
        size: Math.max(he, 4),
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      }), e.queue.writeBuffer(c, 0, K.buffer, K.byteOffset, se), p = K.length, Q) {
        const fe = Mt(_, $), xe = fe.byteLength, ge = Math.ceil(xe / 4) * 4;
        d = e.createBuffer({
          label: "surface3d/wireIndices",
          size: Math.max(ge, 4),
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        }), e.queue.writeBuffer(d, 0, fe.buffer, fe.byteOffset, xe), x = fe.length;
      } else
        d = null, x = 0;
      f = _, g = $;
    }
  };
  return {
    prepare: (_, $) => {
      if (n) return;
      if (!_.drawable) {
        J = !1;
        return;
      }
      const Q = _.data, X = $e(Q);
      if (!X) {
        U = !1, J = !1;
        return;
      }
      const K = Q == null ? void 0 : Q.y, se = _.wireframe, he = X.xStart !== v || X.xStep !== w || X.zStart !== G || X.zStep !== D, fe = Q !== S || K !== h || he;
      if (fe || se !== m) {
        const pe = X.columns * X.rows;
        if (fe && !me(X.y, pe)) {
          U = !1, J = !1;
          return;
        }
        ye(X.columns, X.rows, se), S = Q, h = K, m = se, v = X.xStart, w = X.xStep, G = X.zStart, D = X.zStep, ee = X.columns, te = X.rows, U = pe > 0 && s != null && p > 0;
      } else !U && s != null && c != null && p > 0 && (U = !0);
      if (!U || !s || ee < 2 || te < 2) {
        J = !1;
        return;
      }
      const ge = It(_.colormap), we = A(ge, _.colormap);
      a.set($.viewProj, 0), a[16] = 0.4, a[17] = 0.85, a[18] = 0.35, a[19] = _.lighting, a[20] = _.yMin, a[21] = _.yMax > _.yMin ? _.yMax : _.yMin + 1, a[22] = _.opacity, a[23] = 0, a[24] = 0.35, a[25] = 0.35, a[26] = 0.4, a[27] = 1, a[28] = X.xStart, a[29] = X.xStep, a[30] = X.zStart, a[31] = X.zStep, a[32] = ee, a[33] = te, a[34] = 0, a[35] = 0, _e(e, l, a), (!M || q !== ge || H !== s) && (M = e.createBindGroup({
        label: "surface3d/bindGroup",
        layout: V,
        entries: [
          { binding: 0, resource: { buffer: l } },
          { binding: 1, resource: we },
          { binding: 2, resource: { buffer: s } }
        ]
      }), q = ge, H = s), oe = se, J = !0;
    },
    render(_) {
      n || !J || !U || !M || !s || !c || (_.setBindGroup(0, M), oe && d && x > 0 ? (_.setPipeline(O), _.setIndexBuffer(d, "uint32"), _.drawIndexed(x)) : (_.setPipeline(E), _.setIndexBuffer(c, "uint32"), _.drawIndexed(p)));
    },
    dispose() {
      n || (n = !0, s == null || s.destroy(), c == null || c.destroy(), d == null || d.destroy(), l.destroy(), B == null || B.destroy(), s = null, c = null, d = null, B = null, F = null, M = null, b = null);
    },
    getUploadCount: () => N,
    hasGeometry: () => U
  };
}
const Ke = `// axisBox3d.wgsl — simple 12-edge AABB wireframe for 3D charts.

struct VSUniforms {
  viewProj: mat4x4<f32>,
  color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
  @location(0) position: vec3<f32>,
};

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vsMain(input: VSIn) -> VSOut {
  var out: VSOut;
  out.clipPosition = vsUniforms.viewProj * vec4<f32>(input.position, 1.0);
  out.color = vsUniforms.color;
  return out;
}

@fragment
fn fsMain(input: VSOut) -> @location(0) vec4<f32> {
  let a = input.color.a;
  return vec4<f32>(input.color.rgb * a, a);
}
`;
function Qe(e, t, n = 5) {
  return Jt(e, t, n, { clampToDomain: !1 });
}
function ke(e) {
  if (!Number.isFinite(e)) return "—";
  const t = Math.abs(e);
  return t === 0 ? "0" : t >= 1e6 || t < 1e-3 ? e.toExponential(2) : Number.isInteger(e) || Math.abs(e - Math.round(e)) < 1e-9 ? String(Math.round(e)) : e.toPrecision(4).replace(/\.?0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
function et(e, t, n, o) {
  const r = typeof e == "number" && Number.isFinite(e) ? e : n, i = typeof t == "number" && Number.isFinite(t) ? t : o;
  return r === i ? { min: r - 0.5, max: i + 0.5 } : r <= i ? { min: r, max: i } : { min: i, max: r };
}
const zt = 80, vn = {
  format: "depth24plus",
  depthWriteEnabled: !1,
  depthCompare: "less-equal"
}, tt = 0.03;
function Mn(e, t, n) {
  const [o, r, i] = e.min, [l, a, s] = e.max, y = [], c = (f, g, v, w, G, D) => {
    y.push(f, g, v, w, G, D);
  };
  if (t.showBox && (c(o, r, i, l, r, i), c(l, r, i, l, a, i), c(l, a, i, o, a, i), c(o, a, i, o, r, i), c(o, r, s, l, r, s), c(l, r, s, l, a, s), c(l, a, s, o, a, s), c(o, a, s, o, r, s), c(o, r, i, o, r, s), c(l, r, i, l, r, s), c(l, a, i, l, a, s), c(o, a, i, o, a, s)), t.showGrid) {
    if (t.x.visible)
      for (const f of n.xTicks)
        f < Math.min(o, l) - 1e-9 || f > Math.max(o, l) + 1e-9 || c(f, r, i, f, r, s);
    if (t.z.visible)
      for (const f of n.zTicks)
        f < Math.min(i, s) - 1e-9 || f > Math.max(i, s) + 1e-9 || c(o, r, f, l, r, f);
    if (t.x.visible)
      for (const f of n.xTicks)
        f < Math.min(o, l) - 1e-9 || f > Math.max(o, l) + 1e-9 || c(f, r, i, f, a, i);
    if (t.y.visible)
      for (const f of n.yTicks)
        f < Math.min(r, a) - 1e-9 || f > Math.max(r, a) + 1e-9 || c(o, f, i, l, f, i);
    if (t.z.visible)
      for (const f of n.zTicks)
        f < Math.min(i, s) - 1e-9 || f > Math.max(i, s) + 1e-9 || c(o, r, f, o, a, f);
    if (t.y.visible)
      for (const f of n.yTicks)
        f < Math.min(r, a) - 1e-9 || f > Math.max(r, a) + 1e-9 || c(o, f, i, o, f, s);
  }
  const d = Math.abs(l - o) || 1, p = Math.abs(a - r) || 1, x = Math.abs(s - i) || 1, S = d * tt, h = p * tt, m = x * tt;
  if (t.x.visible)
    for (const f of n.xTicks)
      c(f, r, i, f, r - h, i), c(f, r, i, f, r, i - m);
  if (t.y.visible)
    for (const f of n.yTicks)
      c(o, f, i, o - S, f, i), c(o, f, i, o, f, i - m);
  if (t.z.visible)
    for (const f of n.zTicks)
      c(o, r, f, o - S, r, f), c(o, r, f, o, r - h, f);
  return new Float32Array(y);
}
function Ut(e, t) {
  const n = et(t.x.min, t.x.max, e.min[0], e.max[0]), o = et(t.y.min, t.y.max, e.min[1], e.max[1]), r = et(t.z.min, t.z.max, e.min[2], e.max[2]);
  return {
    xTicks: t.x.visible ? Qe(n.min, n.max, t.x.tickCount) : [],
    yTicks: t.y.visible ? Qe(o.min, o.max, t.y.tickCount) : [],
    zTicks: t.z.visible ? Qe(r.min, r.max, t.z.tickCount) : [],
    xDomain: n,
    yDomain: o,
    zDomain: r
  };
}
function wn(e, t) {
  let n = !1;
  const o = (t == null ? void 0 : t.targetFormat) ?? "bgra8unorm", r = 1, i = t == null ? void 0 : t.pipelineCache, l = Ve(e, zt, { label: "axisBox3d/vsUniforms" }), a = new Float32Array(zt / 4);
  let s = null, y = 0, c = 0, d = !1;
  const p = e.createBindGroupLayout({
    label: "axisBox3d/bgl",
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }]
  }), x = Ae(
    e,
    {
      label: "axisBox3d/pipeline",
      bindGroupLayouts: [p],
      vertex: {
        code: Ke,
        label: "axisBox3d/shader",
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
          }
        ]
      },
      fragment: {
        code: Ke,
        formats: o,
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
        }
      },
      primitive: { topology: "line-list" },
      depthStencil: vn,
      multisample: { count: r }
    },
    i
  );
  let S = null;
  const h = (m) => {
    const f = Math.max(4, Math.ceil(m * 4 / 4) * 4);
    if (s && y >= f) return;
    s == null || s.destroy();
    let g = Math.max(f, 1024);
    for (; g < f; ) g = Math.ceil(g * 1.5);
    s = e.createBuffer({
      label: "axisBox3d/vbo",
      size: g,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    }), y = g;
  };
  return {
    prepare(m, f, g, v, w) {
      if (n)
        return Ut(m, v);
      const G = Ut(m, v);
      if (!(v.showBox || v.showGrid || v.x.visible || v.y.visible || v.z.visible))
        return d = !1, c = 0, G;
      const N = Mn(m, v, G);
      if (c = Math.floor(N.length / 3), c === 0)
        return d = !1, G;
      h(N.length), e.queue.writeBuffer(s, 0, N.buffer, N.byteOffset, N.byteLength);
      const U = w ?? g, z = v.showGrid && v.showBox ? [
        (g[0] + U[0]) * 0.5,
        (g[1] + U[1]) * 0.5,
        (g[2] + U[2]) * 0.5,
        Math.min(1, (g[3] + U[3]) * 0.5 + 0.15)
      ] : g;
      return a.set(f, 0), a[16] = z[0], a[17] = z[1], a[18] = z[2], a[19] = z[3], _e(e, l, a), S || (S = e.createBindGroup({
        layout: p,
        entries: [{ binding: 0, resource: { buffer: l } }]
      })), d = !0, G;
    },
    render(m) {
      n || !d || !S || !s || c < 2 || (m.setPipeline(x), m.setBindGroup(0, S), m.setVertexBuffer(0, s), m.draw(c));
    },
    dispose() {
      n || (n = !0, s == null || s.destroy(), l.destroy(), s = null, S = null);
    }
  };
}
function Pn(e, t, n) {
  if (Array.isArray(e)) {
    const a = [];
    for (const s of e)
      typeof s == "number" && Number.isFinite(s) && a.push(s);
    return a;
  }
  const o = typeof e == "number" && Number.isFinite(e) ? Math.max(0, Math.min(64, Math.floor(e))) : 0;
  if (o <= 0) return [];
  let r = t, i = n;
  if (!Number.isFinite(r) || !Number.isFinite(i)) return [];
  if (r === i) return [r];
  if (r > i) {
    const a = r;
    r = i, i = a;
  }
  const l = [];
  for (let a = 1; a <= o; a++) {
    const s = a / (o + 1);
    l.push(r + s * (i - r));
  }
  return l;
}
const je = (e, t, n, o) => {
  const r = o * t + n;
  return r < 0 || r >= e.length ? Number.NaN : Number(e[r]);
};
function Cn(e, t) {
  const n = Math.floor(e.columns), o = Math.floor(e.rows);
  if (n < 2 || o < 2 || t.length === 0) return new Float32Array(0);
  const r = [];
  for (const i of t)
    if (Number.isFinite(i))
      for (let l = 0; l < o - 1; l++)
        for (let a = 0; a < n - 1; a++) {
          const s = je(e.y, n, a, l), y = je(e.y, n, a + 1, l), c = je(e.y, n, a + 1, l + 1), d = je(e.y, n, a, l + 1);
          if (![s, y, c, d].every((U) => Number.isFinite(U))) continue;
          let p = 0;
          if (s >= i && (p |= 1), y >= i && (p |= 2), c >= i && (p |= 4), d >= i && (p |= 8), p === 0 || p === 15) continue;
          const x = e.xStart + a * e.xStep, S = e.xStart + (a + 1) * e.xStep, h = e.zStart + l * e.zStep, m = e.zStart + (l + 1) * e.zStep, f = (U, z) => {
            const b = z - U;
            return Math.abs(b) > 1e-12 ? Math.min(1, Math.max(0, (i - U) / b)) : 0.5;
          }, g = () => {
            const U = f(s, y);
            return [x + U * (S - x), i, h];
          }, v = () => {
            const U = f(y, c);
            return [S, i, h + U * (m - h)];
          }, w = () => {
            const U = f(d, c);
            return [x + U * (S - x), i, m];
          }, G = () => {
            const U = f(s, d);
            return [x, i, h + U * (m - h)];
          }, D = 1e-3 * (Math.abs(i) + 1), N = (U, z) => {
            r.push(U[0], U[1] + D, U[2], z[0], z[1] + D, z[2]);
          };
          switch (p) {
            case 1:
            case 14:
              N(G(), g());
              break;
            case 2:
            case 13:
              N(g(), v());
              break;
            case 3:
            case 12:
              N(G(), v());
              break;
            case 4:
            case 11:
              N(v(), w());
              break;
            case 5:
              N(G(), g()), N(v(), w());
              break;
            case 6:
            case 9:
              N(g(), w());
              break;
            case 7:
            case 8:
              N(G(), w());
              break;
            case 10:
              N(g(), v()), N(G(), w());
              break;
          }
        }
  return new Float32Array(r);
}
function zn(e) {
  return Math.floor(e.length / 3);
}
const Ft = 80, Un = {
  format: "depth24plus",
  depthWriteEnabled: !0,
  depthCompare: "less-equal"
};
function Fn(e, t) {
  let n = !1;
  const o = (t == null ? void 0 : t.targetFormat) ?? "bgra8unorm", r = 1, i = t == null ? void 0 : t.pipelineCache, l = Ve(e, Ft, { label: "contour3d/vsUniforms" }), a = new Float32Array(Ft / 4);
  let s = null, y = 0, c = 0, d = !1, p = null, x = null, S = "", h = NaN, m = NaN, f = !1, g = 0;
  const v = 120;
  let w = !1;
  const G = e.createBindGroupLayout({
    label: "contour3d/bgl",
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }]
  }), D = Ae(
    e,
    {
      label: "contour3d/pipeline",
      bindGroupLayouts: [G],
      vertex: {
        code: Ke,
        label: "contour3d/shader",
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
          }
        ]
      },
      fragment: {
        code: Ke,
        formats: o,
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
        }
      },
      primitive: { topology: "line-list" },
      depthStencil: Un,
      multisample: { count: r }
    },
    i
  );
  let N = null;
  const U = (z) => Array.isArray(z) ? z.join(",") : String(z);
  return {
    prepare(z, b) {
      if (n) return;
      const B = z.contours;
      if (!z.drawable || !B.show) {
        d = !1, c = 0, f = !1;
        return;
      }
      const F = z.data, C = F == null ? void 0 : F.y, A = U(B.levels), V = !f || F !== p || C !== x || A !== S || z.yMin !== h || z.yMax !== m, E = performance.now();
      if (V && (!f || A !== S || w || w || E - g >= v)) {
        const oe = Pn(B.levels, z.yMin, z.yMax), ee = Cn(
          {
            xStart: F.xStart,
            xStep: F.xStep,
            zStart: F.zStart,
            zStep: F.zStep,
            columns: F.columns,
            rows: F.rows,
            y: F.y
          },
          oe
        );
        if (c = zn(ee), c >= 2) {
          const te = ee.byteLength;
          if (!s || y < te) {
            s == null || s.destroy();
            const ae = Math.max(te, 1024);
            s = e.createBuffer({
              label: "contour3d/vbo",
              size: ae,
              usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            }), y = ae;
          }
          e.queue.writeBuffer(s, 0, ee.buffer, ee.byteOffset, te);
        }
        p = F, x = C, S = A, h = z.yMin, m = z.yMax, f = !0, g = E, w = !1;
      }
      if (c < 2 || !s) {
        d = !1;
        return;
      }
      const q = Oe(B.color) ?? [0.89, 0.91, 0.94, B.opacity], H = Math.min(1, Math.max(0, B.opacity)) * (q[3] ?? 1), J = Math.min(1, H * (0.75 + 0.15 * Math.min(4, B.width)));
      a.set(b, 0), a[16] = q[0], a[17] = q[1], a[18] = q[2], a[19] = J, _e(e, l, a), N || (N = e.createBindGroup({
        layout: G,
        entries: [{ binding: 0, resource: { buffer: l } }]
      })), d = !0;
    },
    render(z) {
      n || !d || !N || !s || c < 2 || (z.setPipeline(D), z.setBindGroup(0, N), z.setVertexBuffer(0, s), z.draw(c));
    },
    invalidate() {
      p = null, x = null, S = "", f = !1, d = !1, w = !0, g = 0;
    },
    dispose() {
      n || (n = !0, s == null || s.destroy(), l.destroy(), s = null, N = null);
    }
  };
}
const Ge = () => new Float32Array(16), Dn = (e, t, n) => {
  const o = t[0], r = t[1], i = t[2], l = t[3], a = t[4], s = t[5], y = t[6], c = t[7], d = t[8], p = t[9], x = t[10], S = t[11], h = t[12], m = t[13], f = t[14], g = t[15], v = n[0], w = n[1], G = n[2], D = n[3], N = n[4], U = n[5], z = n[6], b = n[7], B = n[8], F = n[9], C = n[10], A = n[11], V = n[12], E = n[13], O = n[14], M = n[15];
  return e[0] = o * v + a * w + d * G + h * D, e[1] = r * v + s * w + p * G + m * D, e[2] = i * v + y * w + x * G + f * D, e[3] = l * v + c * w + S * G + g * D, e[4] = o * N + a * U + d * z + h * b, e[5] = r * N + s * U + p * z + m * b, e[6] = i * N + y * U + x * z + f * b, e[7] = l * N + c * U + S * z + g * b, e[8] = o * B + a * F + d * C + h * A, e[9] = r * B + s * F + p * C + m * A, e[10] = i * B + y * F + x * C + f * A, e[11] = l * B + c * F + S * C + g * A, e[12] = o * V + a * E + d * O + h * M, e[13] = r * V + s * E + p * O + m * M, e[14] = i * V + y * E + x * O + f * M, e[15] = l * V + c * E + S * O + g * M, e;
}, Ce = (e) => {
  const t = Math.hypot(e[0], e[1], e[2]);
  return t > 0 ? [e[0] / t, e[1] / t, e[2] / t] : [0, 1, 0];
}, nt = (e, t) => [
  e[1] * t[2] - e[2] * t[1],
  e[2] * t[0] - e[0] * t[2],
  e[0] * t[1] - e[1] * t[0]
], Je = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], Nn = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], Dt = (e, t) => [e[0] * t, e[1] * t, e[2] * t], rt = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2], Gn = (e, t, n, o) => {
  const r = Ce(Je(t, n));
  let i = Ce(nt(o, r));
  if (!(Math.hypot(i[0], i[1], i[2]) > 1e-12)) {
    const a = Math.abs(o[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    i = Ce(nt(a, r));
  }
  const l = nt(r, i);
  return e[0] = i[0], e[1] = l[0], e[2] = r[0], e[3] = 0, e[4] = i[1], e[5] = l[1], e[6] = r[1], e[7] = 0, e[8] = i[2], e[9] = l[2], e[10] = r[2], e[11] = 0, e[12] = -rt(i, t), e[13] = -rt(l, t), e[14] = -rt(r, t), e[15] = 1, e;
}, An = (e, t, n, o, r) => {
  const i = 1 / Math.tan(t / 2), l = 1 / (o - r), a = n > 0 && Number.isFinite(n) ? n : 1;
  return e[0] = i / a, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = i, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = r * l, e[11] = -1, e[12] = 0, e[13] = 0, e[14] = r * o * l, e[15] = 0, e;
}, Rn = (e, t, n, o, r) => {
  const i = t > 0 && Number.isFinite(t) ? t : 1, l = n > 0 && Number.isFinite(n) ? n : 1, a = i * l, s = 1 / (a - -a), y = 1 / (i - -i), c = 1 / (r - o);
  return e[0] = 2 * s, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 2 * y, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = -1 * c, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = -o * c, e[15] = 1, e;
}, Re = (e, t, n, o) => {
  const r = e[0] * t + e[4] * n + e[8] * o + e[12], i = e[1] * t + e[5] * n + e[9] * o + e[13], l = e[2] * t + e[6] * n + e[10] * o + e[14], a = e[3] * t + e[7] * n + e[11] * o + e[15];
  return [r, i, l, a];
}, Bn = (e, t = Ge()) => {
  const n = e[0], o = e[1], r = e[2], i = e[3], l = e[4], a = e[5], s = e[6], y = e[7], c = e[8], d = e[9], p = e[10], x = e[11], S = e[12], h = e[13], m = e[14], f = e[15], g = n * a - o * l, v = n * s - r * l, w = n * y - i * l, G = o * s - r * a, D = o * y - i * a, N = r * y - i * s, U = c * h - d * S, z = c * m - p * S, b = c * f - x * S, B = d * m - p * h, F = d * f - x * h, C = p * f - x * m;
  let A = g * C - v * F + w * B + G * b - D * z + N * U;
  return Math.abs(A) > 1e-12 ? (A = 1 / A, t[0] = (a * C - s * F + y * B) * A, t[1] = (r * F - o * C - i * B) * A, t[2] = (h * N - m * D + f * G) * A, t[3] = (p * D - d * N - x * G) * A, t[4] = (s * b - l * C - y * z) * A, t[5] = (n * C - r * b + i * z) * A, t[6] = (m * w - S * N - f * v) * A, t[7] = (c * N - p * w + x * v) * A, t[8] = (l * F - a * b + y * U) * A, t[9] = (o * b - n * F - i * U) * A, t[10] = (S * D - h * w + f * g) * A, t[11] = (d * w - c * D - x * g) * A, t[12] = (a * z - l * B - s * U) * A, t[13] = (n * B - o * z + r * U) * A, t[14] = (h * v - S * G - m * g) * A, t[15] = (c * G - d * v + p * g) * A, t) : null;
}, En = Math.PI / 4, Tn = 0.01, Ln = 1e4, In = 1, We = Math.PI / 2 - 0.05, ot = (e) => Array.isArray(e) && e.length === 3 && typeof e[0] == "number" && Number.isFinite(e[0]) && typeof e[1] == "number" && Number.isFinite(e[1]) && typeof e[2] == "number" && Number.isFinite(e[2]), On = () => ({
  type: "perspective",
  fovY: En,
  near: Tn,
  far: Ln,
  target: [0, 0, 0],
  yaw: Math.PI / 4,
  pitch: Math.PI / 6,
  distance: 3,
  orthoSize: In,
  up: [0, 1, 0],
  needsFit: !0,
  userLocked: !1
}), lt = (e) => {
  const t = Math.cos(e.pitch), n = Math.sin(e.pitch), o = Math.cos(e.yaw), r = Math.sin(e.yaw), i = e.target[0] + e.distance * t * r, l = e.target[1] + e.distance * n, a = e.target[2] + e.distance * t * o;
  return [i, l, a];
}, Yn = (e) => ({
  type: e.type,
  fovY: e.fovY,
  near: e.near,
  far: e.far,
  eye: lt(e),
  target: [e.target[0], e.target[1], e.target[2]],
  up: [e.up[0], e.up[1], e.up[2]],
  orthoSize: e.orthoSize
}), it = (e, t) => {
  if (!t) return;
  (t.type === "orthographic" || t.type === "perspective") && (e.type = t.type), typeof t.fovY == "number" && Number.isFinite(t.fovY) && t.fovY > 0 && (e.fovY = t.fovY), typeof t.near == "number" && Number.isFinite(t.near) && t.near > 0 && (e.near = t.near), typeof t.far == "number" && Number.isFinite(t.far) && t.far > e.near && (e.far = t.far), typeof t.orthoSize == "number" && Number.isFinite(t.orthoSize) && t.orthoSize > 0 && (e.orthoSize = t.orthoSize), ot(t.up) && (e.up = [t.up[0], t.up[1], t.up[2]]);
  const n = ot(t.eye), o = ot(t.target);
  if (o && (e.target = [t.target[0], t.target[1], t.target[2]]), n && o) {
    const r = t.eye, i = t.target, l = Je(r, i), a = Math.hypot(l[0], l[1], l[2]);
    e.distance = a > 1e-6 ? a : 1, e.pitch = Math.asin(Math.max(-1, Math.min(1, l[1] / e.distance))), e.yaw = Math.atan2(l[0], l[2]), e.userLocked = !0, e.needsFit = !1;
  } else if (n && !o) {
    const r = t.eye, i = Je(r, e.target), l = Math.hypot(i[0], i[1], i[2]);
    e.distance = l > 1e-6 ? l : 1, e.pitch = Math.asin(Math.max(-1, Math.min(1, i[1] / e.distance))), e.yaw = Math.atan2(i[0], i[2]), e.userLocked = !0, e.needsFit = !1;
  }
}, Vn = (e, t) => {
  const n = Yt(t), o = Qt(n);
  e.target = [o[0], o[1], o[2]];
  const r = kt(n), i = 1.35;
  if (e.type === "orthographic")
    e.orthoSize = r * i, e.distance = Math.max(r * 3, e.near * 10);
  else {
    const a = e.fovY * 0.5, s = r * i / Math.sin(Math.max(a, 0.05));
    e.distance = Math.max(s, e.near * 10);
  }
  const l = e.distance + r * 4;
  e.far < l && (e.far = l), e.needsFit = !1, e.userLocked = !1;
}, _n = (e, t, n, o) => {
  e.yaw -= t * o, e.pitch += n * o, e.pitch > We && (e.pitch = We), e.pitch < -We && (e.pitch = -We);
}, $n = (e, t, n, o, r) => {
  const i = lt(e), l = Ce(Je(e.target, i)), a = Ce(e.up);
  let s = Ce([
    l[1] * a[2] - l[2] * a[1],
    l[2] * a[0] - l[0] * a[2],
    l[0] * a[1] - l[1] * a[0]
  ]);
  Math.hypot(s[0], s[1], s[2]) > 1e-8 || (s = [1, 0, 0]);
  const y = Ce([
    s[1] * l[2] - s[2] * l[1],
    s[2] * l[0] - s[0] * l[2],
    s[0] * l[1] - s[1] * l[0]
  ]), c = e.type === "orthographic" ? 2 * e.orthoSize / Math.max(1, o) : 2 * e.distance * Math.tan(e.fovY * 0.5) / Math.max(1, o), d = Nn(Dt(s, -t * c * r), Dt(y, n * c * r));
  e.target[0] += d[0], e.target[1] += d[1], e.target[2] += d[2];
}, Xn = (e, t, n) => {
  const o = Math.exp(t * 1e-3 * n);
  e.type === "orthographic" ? e.orthoSize = Math.max(1e-6, e.orthoSize * o) : e.distance = Math.max(e.near * 2, e.distance * o);
}, Nt = (e, t, n = Ge()) => {
  const o = lt(e), r = Ge();
  Gn(r, o, e.target, e.up);
  const i = Ge();
  return e.type === "orthographic" ? Rn(i, e.orthoSize, t, e.near, e.far) : An(i, e.fovY, t, e.near, e.far), Dn(n, i, r);
}, Vt = 5e4;
function jn(e, t = Vt) {
  return e > t ? Math.ceil(e / t) : 1;
}
function _t(e, t, n, o, r, i, l, a = 10, s = Vt) {
  if (!(t > 0) || !(i > 0) || !(l > 0)) return null;
  const y = a * a, c = jn(t, s);
  let d = null, p = y;
  for (let x = 0; x < t; x += c) {
    const S = e[x * 4], h = e[x * 4 + 1], m = e[x * 4 + 2], f = e[x * 4 + 3], g = Re(n, S, h, m);
    if (!(Math.abs(g[3]) > 1e-8)) continue;
    const v = g[0] / g[3], w = g[1] / g[3];
    if (v < -1.2 || v > 1.2 || w < -1.2 || w > 1.2) continue;
    const G = (v * 0.5 + 0.5) * i, D = (1 - (w * 0.5 + 0.5)) * l, N = G - o, U = D - r, z = N * N + U * U;
    z < p && (p = z, d = { dataIndex: x, x: S, y: h, z: m, value: f, dist2: z });
  }
  return d;
}
const $t = 16;
function Wn() {
  return {
    cells: [],
    cols: 0,
    rows: 0,
    cellSize: $t,
    viewportW: 0,
    viewportH: 0,
    stamp: "",
    count: 0,
    packedRef: null
  };
}
function Xt(e, t, n, o, r) {
  var s, y, c, d, p, x, S;
  const i = e > 0 ? `${r[0]},${r[1]},${r[2]},${r[3]}` : "", l = e > 1 ? `${r[(e - 1) * 4]},${r[(e - 1) * 4 + 1]},${r[(e - 1) * 4 + 2]},${r[(e - 1) * 4 + 3]}` : "", a = e > 2 ? `${r[Math.floor(e / 2) * 4]},${r[Math.floor(e / 2) * 4 + 1]}` : "";
  return [
    e,
    t | 0,
    n | 0,
    r.length,
    r.byteOffset,
    i,
    a,
    l,
    // viewProj fingerprint
    (s = o[0]) == null ? void 0 : s.toFixed(5),
    (y = o[5]) == null ? void 0 : y.toFixed(5),
    (c = o[10]) == null ? void 0 : c.toFixed(5),
    (d = o[12]) == null ? void 0 : d.toFixed(4),
    (p = o[13]) == null ? void 0 : p.toFixed(4),
    (x = o[14]) == null ? void 0 : x.toFixed(4),
    (S = o[15]) == null ? void 0 : S.toFixed(5)
  ].join("|");
}
function qn(e, t, n, o, r, i, l = $t) {
  const a = Math.max(8, l), s = Math.max(1, Math.ceil(r / a)), y = Math.max(1, Math.ceil(i / a)), c = new Array(s * y), d = new Array(s * y);
  for (let p = 0; p < d.length; p++) d[p] = [];
  for (let p = 0; p < n; p++) {
    const x = t[p * 4], S = t[p * 4 + 1], h = t[p * 4 + 2], m = Re(o, x, S, h);
    if (!(Math.abs(m[3]) > 1e-8) || m[3] <= 0) continue;
    const f = m[0] / m[3], g = m[1] / m[3];
    if (f < -1.2 || f > 1.2 || g < -1.2 || g > 1.2) continue;
    const v = (f * 0.5 + 0.5) * r, w = (1 - (g * 0.5 + 0.5)) * i, G = Math.min(s - 1, Math.max(0, Math.floor(v / a))), D = Math.min(y - 1, Math.max(0, Math.floor(w / a)));
    d[D * s + G].push(p);
  }
  for (let p = 0; p < d.length; p++)
    c[p] = d[p].length > 0 ? Int32Array.from(d[p]) : new Int32Array(0);
  e.cells = c, e.cols = s, e.rows = y, e.cellSize = a, e.viewportW = r, e.viewportH = i, e.count = n, e.packedRef = t, e.stamp = Xt(n, r, i, o, t);
}
function Hn(e, t, n, o, r, i, l, a, s = 10) {
  if (!(n > 0) || !(l > 0) || !(a > 0)) return null;
  if (e.cells.length === 0 || e.count !== n || e.packedRef !== t || e.viewportW !== l || e.viewportH !== a)
    return _t(t, n, o, r, i, l, a, s);
  const y = s * s, c = e.cellSize, d = e.cols, p = e.rows, x = Math.floor(r / c), S = Math.floor(i / c), h = Math.max(1, Math.ceil(s / c) + 1);
  let m = null, f = y;
  for (let g = -h; g <= h; g++)
    for (let v = -h; v <= h; v++) {
      const w = x + v, G = S + g;
      if (w < 0 || G < 0 || w >= d || G >= p) continue;
      const D = e.cells[G * d + w];
      if (!(!D || D.length === 0))
        for (let N = 0; N < D.length; N++) {
          const U = D[N], z = t[U * 4], b = t[U * 4 + 1], B = t[U * 4 + 2], F = t[U * 4 + 3], C = Re(o, z, b, B);
          if (!(Math.abs(C[3]) > 1e-8) || C[3] <= 0) continue;
          const A = C[0] / C[3], V = C[1] / C[3], E = (A * 0.5 + 0.5) * l, O = (1 - (V * 0.5 + 0.5)) * a, M = E - r, q = O - i, H = M * M + q * q;
          H < f && (f = H, m = { dataIndex: U, x: z, y: b, z: B, value: F, dist2: H });
        }
    }
  return m;
}
function jt(e, t, n, o, r, i) {
  const l = Re(e, t, n, o), a = l[3];
  if (!(Math.abs(a) > 1e-8))
    return { x: 0, y: 0, visible: !1, ndcX: 0, ndcY: 0, ndcZ: 0, clipW: a };
  const s = l[0] / a, y = l[1] / a, c = l[2] / a, d = (s * 0.5 + 0.5) * r, p = (1 - (y * 0.5 + 0.5)) * i, x = a > 0 && s >= -1.25 && s <= 1.25 && y >= -1.25 && y <= 1.25 && c >= -0.05 && c <= 1.05;
  return { x: d, y: p, visible: x, ndcX: s, ndcY: y, ndcZ: c, clipW: a };
}
function Zn(e, t, n, o, r) {
  if (!(o > 0) || !(r > 0)) return null;
  const i = t / o * 2 - 1, l = 1 - n / r * 2, a = Re(e, i, l, 0), s = Re(e, i, l, 1);
  if (!(Math.abs(a[3]) > 1e-8) || !(Math.abs(s[3]) > 1e-8)) return null;
  const y = a[0] / a[3], c = a[1] / a[3], d = a[2] / a[3], p = s[0] / s[3], x = s[1] / s[3], S = s[2] / s[3];
  let h = p - y, m = x - c, f = S - d;
  const g = Math.hypot(h, m, f);
  return g > 1e-12 ? (h /= g, m /= g, f /= g, { origin: [y, c, d], dir: [h, m, f] }) : null;
}
const qe = (e, t, n) => {
  if (t < 0 || n < 0 || t >= e.columns || n >= e.rows) return null;
  const o = n * e.columns + t;
  if (o < 0 || o >= e.y.length) return null;
  const r = Number(e.y[o]);
  return Number.isFinite(r) ? r : null;
}, He = (e, t, n, o, r) => {
  const i = qe(e, t, n), l = qe(e, t + 1, n), a = qe(e, t, n + 1), s = qe(e, t + 1, n + 1);
  if (i == null || l == null || a == null || s == null) return null;
  const y = i * (1 - o) + l * o, c = a * (1 - o) + s * o;
  return y * (1 - r) + c * r;
};
function Kn(e, t, n, o, r, i) {
  const l = Math.floor(e.columns), a = Math.floor(e.rows);
  if (l < 2 || a < 2 || !(Number.isFinite(e.xStep) && e.xStep !== 0) || !(Number.isFinite(e.zStep) && e.zStep !== 0)) return null;
  const s = Bn(t);
  if (!s) return null;
  const y = Zn(s, n, o, r, i);
  if (!y) return null;
  const [c, d, p] = y.origin, [x, S, h] = y.dir, m = e.xStart, f = e.zStart, g = e.xStart + (l - 1) * e.xStep, v = e.zStart + (a - 1) * e.zStep, w = Math.min(m, g), G = Math.max(m, g), D = Math.min(f, v), N = Math.max(f, v), U = Math.abs(S);
  let z = null, b = Number.POSITIVE_INFINITY;
  const B = [];
  Math.abs(x) > 1e-12 && B.push((w - c) / x, (G - c) / x), Math.abs(h) > 1e-12 && B.push((D - p) / h, (N - p) / h), B.push(0.01, 1, 10, 100);
  let F = 1 / 0, C = -1 / 0;
  for (const E of B) {
    if (!Number.isFinite(E) || E < 0) continue;
    const O = c + x * E, M = p + h * E;
    O >= w - Math.abs(e.xStep) && O <= G + Math.abs(e.xStep) && M >= D - Math.abs(e.zStep) && M <= N + Math.abs(e.zStep) && (E < F && (F = E), E > C && (C = E));
  }
  if ((!Number.isFinite(F) || !Number.isFinite(C)) && (F = 0, C = Math.hypot(G - w, N - D) * 4 + Math.abs(d) * 4 + 10), C < F) {
    const E = F;
    F = C, C = E;
  }
  F = Math.max(0, F - 1), C = Math.max(F + 1e-3, C + 1);
  const A = Math.min(512, Math.max(64, (l + a) * 2)), V = (C - F) / A;
  for (let E = 0; E <= A; E++) {
    const O = F + E * V, M = c + x * O, q = d + S * O, H = p + h * O;
    if (M < w || M > G || H < D || H > N) continue;
    const J = (M - e.xStart) / e.xStep, oe = (H - e.zStart) / e.zStep, ee = Math.floor(J), te = Math.floor(oe);
    if (ee < 0 || te < 0 || ee >= l - 1 || te >= a - 1) continue;
    const ae = J - ee, ve = oe - te, me = He(e, ee, te, ae, ve);
    if (me == null) continue;
    const ye = q - me;
    if (Math.abs(ye) < Math.max(1e-4, Math.abs(me) * 1e-4 + Math.abs(S) * V * 2)) {
      O < b && (b = O, z = { i: ee, j: te, x: M, y: me, z: H, height: me, t: O });
      continue;
    }
    if (E < A) {
      const Se = O + V, _ = d + S * Se, $ = c + x * Se, Q = p + h * Se, X = ($ - e.xStart) / e.xStep, K = (Q - e.zStart) / e.zStep, se = Math.floor(X), he = Math.floor(K);
      if (se < 0 || he < 0 || se >= l - 1 || he >= a - 1) continue;
      const fe = He(e, se, he, X - se, K - he);
      if (fe == null) continue;
      const xe = _ - fe;
      if (ye * xe > 0) continue;
      const ge = ye - xe, we = Math.abs(ge) > 1e-12 ? ye / ge : 0.5, pe = O + we * V, ze = c + x * pe, Be = p + h * pe, Ee = (ze - e.xStart) / e.xStep, Pe = (Be - e.zStart) / e.zStep, Ue = Math.max(0, Math.min(l - 2, Math.floor(Ee))), Fe = Math.max(0, Math.min(a - 2, Math.floor(Pe))), De = He(e, Ue, Fe, Ee - Ue, Pe - Fe);
      if (De == null) continue;
      pe >= 0 && pe < b && (b = pe, z = { i: Ue, j: Fe, x: ze, y: De, z: Be, height: De, t: pe });
    }
  }
  if (!z && U > 0.85) {
    const E = Math.abs(S) > 1e-8 ? -d / S : F, O = Number.isFinite(E) && E > 0 ? E : (F + C) * 0.5, M = c + x * O, q = p + h * O;
    if (M >= w && M <= G && q >= D && q <= N) {
      const H = (M - e.xStart) / e.xStep, J = (q - e.zStart) / e.zStep, oe = Math.max(0, Math.min(l - 2, Math.floor(H))), ee = Math.max(0, Math.min(a - 2, Math.floor(J))), te = He(e, oe, ee, H - oe, J - ee);
      if (te != null) {
        const ae = Math.abs(S) > 1e-8 ? (te - d) / S : O;
        ae >= 0 && (z = {
          i: oe,
          j: ee,
          x: c + x * ae,
          y: te,
          z: p + h * ae,
          height: te,
          t: ae
        });
      }
    }
  }
  return z;
}
const Jn = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~°±µ—–…·";
function Qn(e, t) {
  const n = Math.max(64, Math.min(4096, Math.floor(t.maxAtlasSize) || 512)), o = Math.max(0, Math.floor(t.padPx)), r = Math.max(1, Math.ceil(t.lineHeightPx) + o * 2);
  let i = o, l = o, a = r, s = o, y = o;
  const c = [], d = /* @__PURE__ */ new Set();
  for (const h of e) {
    if (!h.ch || d.has(h.ch)) continue;
    d.add(h.ch);
    const m = Math.max(1, Math.ceil(h.widthPx) + o * 2), f = Math.max(1, Math.ceil(h.heightPx) + o * 2);
    if (m > n - o * 2 || f > n - o * 2 || (i + m + o > n && (i = o, l += a, a = r), l + f + o > n)) return null;
    c.push({ ch: h.ch, x: i, y: l, w: m, h: f, m: h }), s = Math.max(s, i + m + o), y = Math.max(y, l + f + o), a = Math.max(a, f), i += m;
  }
  const p = Math.min(n, Math.max(4, Math.ceil(s / 4) * 4)), x = Math.min(n, Math.max(4, Math.ceil(y / 4) * 4));
  if (p > n || x > n) return null;
  const S = /* @__PURE__ */ new Map();
  for (const h of c) {
    const m = h.x + o, f = h.y + o, g = Math.max(1, Math.ceil(h.m.widthPx)), v = Math.max(1, Math.ceil(h.m.heightPx));
    S.set(h.ch, {
      u0: m / p,
      v0: f / x,
      u1: (m + g) / p,
      v1: (f + v) / x,
      widthPx: g,
      heightPx: v,
      advancePx: h.m.advancePx,
      bearingXPx: h.m.bearingXPx,
      bearingYPx: h.m.bearingYPx
    });
  }
  return { width: p, height: x, glyphs: S, placements: c };
}
const Gt = (e, t) => {
  if (typeof OffscreenCanvas < "u")
    try {
      return new OffscreenCanvas(e, t);
    } catch {
    }
  if (typeof document < "u" && typeof document.createElement == "function") {
    const n = document.createElement("canvas");
    return n.width = e, n.height = t, n;
  }
  return null;
};
function kn(e) {
  const t = e.fontSizePx, n = e.pixelScale > 0 ? Math.min(4, e.pixelScale) : 2, o = t * n, r = (e == null ? void 0 : e.fontFamily) ?? 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', i = e == null ? void 0 : e.fontWeight, l = e == null ? void 0 : e.maxAtlasSize, a = (e == null ? void 0 : e.padPx) ?? 2, s = (e == null ? void 0 : e.charset) ?? Jn, y = [], c = /* @__PURE__ */ new Set();
  for (const w of s)
    c.has(w) || (c.add(w), y.push(w));
  if (y.length === 0) return null;
  const d = Gt(4, 4);
  if (!d) return null;
  const p = d.getContext("2d", { willReadFrequently: !0 });
  if (!p) return null;
  p.font = `${i} ${o}px ${r}`, p.textBaseline = "alphabetic", p.textAlign = "left";
  const x = Math.ceil(o * 1.35), S = Math.ceil(o * 1.05), h = [];
  for (const w of y) {
    const G = p.measureText(w), D = G.width, N = G.actualBoundingBoxLeft ?? 0, U = G.actualBoundingBoxRight ?? D, z = G.actualBoundingBoxAscent ?? o * 0.8, b = G.actualBoundingBoxDescent ?? o * 0.2, B = Math.max(1, Math.ceil(N + U + 1)), F = Math.max(1, Math.ceil(z + b + 1));
    h.push({
      ch: w,
      advancePx: D,
      bearingXPx: -N,
      bearingYPx: z,
      widthPx: B,
      heightPx: F
    });
  }
  const m = Qn(h, { maxAtlasSize: l, padPx: a, lineHeightPx: x });
  if (!m) return null;
  const f = Gt(m.width, m.height);
  if (!f) return null;
  f.width = m.width, f.height = m.height;
  const g = f.getContext("2d", { willReadFrequently: !0 });
  if (!g) return null;
  g.clearRect(0, 0, m.width, m.height), g.font = `${i} ${o}px ${r}`, g.textBaseline = "alphabetic", g.textAlign = "left", g.fillStyle = "#ffffff";
  for (const w of m.placements) {
    const G = w.x + a + w.m.bearingXPx, D = w.y + a + w.m.bearingYPx;
    g.fillText(w.ch, G, D);
  }
  let v;
  return g.getImageData, v = g.getImageData(0, 0, m.width, m.height).data, {
    width: m.width,
    height: m.height,
    pixels: v,
    glyphs: m.glyphs,
    bakeFontPx: o,
    lineHeightPx: x,
    baselineFromTopPx: S,
    charset: y.join(""),
    pixelScale: n
  };
}
function At(e, t) {
  const n = e.glyphs.get(t);
  if (n) return n;
  if (t === "—" || t === "–") return e.glyphs.get("-");
  if (t === "…")
    return e.glyphs.get(".");
}
function er(e, t) {
  return e === "dom" ? "dom" : t.atlasReady ? "gpu" : "dom";
}
function Wt(e, t, n) {
  const [o, r, i] = e.min, [l, a, s] = e.max, y = [];
  if (n.x.visible) {
    for (const c of t.xTicks)
      y.push({ x: c, y: r, z: i, text: ke(c), title: !1 });
    n.x.name && y.push({
      x: (o + l) * 0.5,
      y: r,
      z: i - Math.abs(s - i) * 0.08,
      text: n.x.name,
      title: !0
    });
  }
  if (n.y.visible) {
    for (const c of t.yTicks)
      y.push({ x: o, y: c, z: i, text: ke(c), title: !1 });
    n.y.name && y.push({
      x: o - Math.abs(l - o) * 0.08,
      y: (r + a) * 0.5,
      z: i,
      text: n.y.name,
      title: !0
    });
  }
  if (n.z.visible) {
    for (const c of t.zTicks)
      y.push({ x: o, y: r, z: c, text: ke(c), title: !1 });
    n.z.name && y.push({
      x: o - Math.abs(l - o) * 0.08,
      y: r,
      z: (i + s) * 0.5,
      text: n.z.name,
      title: !0
    });
  }
  return y;
}
function tr(e, t, n, o, r, i, l) {
  const [a, s, y] = e.min, [c, d, p] = e.max;
  return [
    a,
    s,
    y,
    c,
    d,
    p,
    t.xTicks.join(","),
    t.yTicks.join(","),
    t.zTicks.join(","),
    n.x.visible ? 1 : 0,
    n.y.visible ? 1 : 0,
    n.z.visible ? 1 : 0,
    n.x.name,
    n.y.name,
    n.z.name,
    Math.round(o),
    Math.round(r),
    i,
    l
  ].join("|");
}
function nr(e, t, n) {
  return !(n && t === e);
}
function rr(e) {
  const t = e.slice(0, 16).map((o) => JSON.stringify(o)).join(", "), n = e.length > 16 ? "…" : "";
  return `ChartGPU 3D: axes3d GPU labels missing glyphs (showing '?'): ${t}${n}`;
}
const Ze = 12, at = Ze * 4;
function or(e, t) {
  const { atlas: n, viewProj: o } = t, r = t.viewportCssW, i = t.viewportCssH, l = t.tickCssPx ?? 10, a = t.titleCssPx ?? 12, s = Math.max(0, Math.min(16384, t.maxGlyphs ?? 4096)), y = t.trackMissing !== !1, c = (f) => (f ? a : l) / Math.max(1e-6, n.bakeFontPx), d = /* @__PURE__ */ new Set(), p = [], x = new Float32Array(s * Ze);
  let S = 0, h = 0;
  const m = (f, g, v, w, G, D, N, U) => {
    if (S >= s) return !1;
    const z = S * Ze;
    return x[z] = f, x[z + 1] = g, x[z + 2] = v, x[z + 3] = w, x[z + 4] = G, x[z + 5] = D, x[z + 6] = N, x[z + 7] = U.u0, x[z + 8] = U.v0, x[z + 9] = U.u1, x[z + 10] = U.v1, x[z + 11] = 0, S++, !0;
  };
  for (const f of e) {
    if (!f.text) continue;
    const g = jt(o, f.x, f.y, f.z, r, i);
    if (g.visible) {
      let b = !1;
      for (const B of p)
        if ((B.x - g.x) ** 2 + (B.y - g.y) ** 2 < (f.title ? 400 : 196)) {
          b = !0;
          break;
        }
      if (b && !f.title) continue;
    }
    const v = c(f.title);
    let w = 0;
    const G = [];
    for (const b of f.text) {
      const B = At(n, b);
      if (!B) {
        y && d.add(b);
        const C = At(n, "?");
        if (!C) continue;
        G.push({ g: C, advance: C.advancePx * v }), w += C.advancePx * v;
        continue;
      }
      const F = B.advancePx * v;
      G.push({ g: B, advance: F }), w += F;
    }
    if (G.length === 0) continue;
    const N = n.lineHeightPx * v * 0.25;
    let U = -w * 0.5, z = !0;
    for (const { g: b, advance: B } of G) {
      const F = b.widthPx * v, C = b.heightPx * v, A = F * 0.5, V = C * 0.5, E = U + b.bearingXPx * v, O = N - b.bearingYPx * v, M = E + A, q = O + V;
      if (!m(f.x, f.y, f.z, M, q, A, V, b)) {
        z = !1;
        break;
      }
      U += B;
    }
    if (!z && S >= s) break;
    g.visible && p.push({ x: g.x, y: g.y }), h++;
  }
  return {
    instances: S > 0 ? x.subarray(0, S * Ze) : new Float32Array(0),
    instanceCount: S,
    labelCount: h,
    missingChars: [...d]
  };
}
const ir = (e, t, n) => {
  e.style.position = "absolute", e.style.left = "0", e.style.top = "0", e.style.pointerEvents = "none", e.style.userSelect = "none", e.style.whiteSpace = "nowrap", e.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', e.style.fontSize = n ? "12px" : "10px", e.style.fontWeight = n ? "600" : "400", e.style.color = t, e.style.textShadow = "0 1px 2px rgba(0,0,0,0.85)", e.style.transform = "translate(-50%, -50%)", e.style.zIndex = "8", e.style.opacity = "0.92";
};
function ar() {
  let e = null, t = !1, n = null, o = !1, r = null, i = [];
  const l = (a) => (e && e.parentElement === a || (e != null && e.parentElement && e.parentElement.removeChild(e), n && n !== a && o && (n.style.position = r ?? ""), n = a, e = document.createElement("div"), e.setAttribute("data-chartgpu-axes3d-labels", "true"), e.style.position = "absolute", e.style.left = "0", e.style.top = "0", e.style.right = "0", e.style.bottom = "0", e.style.pointerEvents = "none", e.style.overflow = "hidden", e.style.zIndex = "8", i = [], getComputedStyle(a).position === "static" ? (r = a.style.position, a.style.position = "relative", o = !0) : (o = !1, r = null), a.appendChild(e)), e);
  return {
    update(a, s, y, c, d, p, x, S) {
      if (t) return;
      const h = l(a), m = Wt(s, y, c), f = [];
      let g = 0;
      for (const v of m) {
        const w = jt(d, v.x, v.y, v.z, p, x);
        if (!w.visible || w.x < -20 || w.y < -20 || w.x > p + 20 || w.y > x + 20) continue;
        let G = !1;
        for (const N of f)
          if ((N.x - w.x) ** 2 + (N.y - w.y) ** 2 < (v.title ? 400 : 196)) {
            G = !0;
            break;
          }
        if (G && !v.title) continue;
        f.push({ x: w.x, y: w.y });
        let D = i[g];
        D || (D = document.createElement("span"), h.appendChild(D), i[g] = D), ir(D, S, v.title), D.textContent !== v.text && (D.textContent = v.text), D.style.transform = `translate(${w.x}px, ${w.y}px) translate(-50%, -50%)`, D.style.display = "", g++;
      }
      for (let v = g; v < i.length; v++) {
        const w = i[v];
        w && (w.style.display = "none");
      }
    },
    /**
     * Hide labels and detach the overlay root (e.g. when switching to GPU mode).
     * Restores host `position` if we had forced `relative`. Safe to call every frame
     * but coordinator should call once on transition into GPU mode.
     */
    clear() {
      e != null && e.parentElement && e.parentElement.removeChild(e), e = null, i = [], n && o && (n.style.position = r ?? ""), n = null, o = !1, r = null;
    },
    dispose() {
      t = !0, e != null && e.parentElement && e.parentElement.removeChild(e), e = null, i = [], n && o && (n.style.position = r ?? ""), n = null, o = !1, r = null;
    }
  };
}
const Rt = `// axes3dGpuLabels.wgsl
// Camera-facing (screen-constant CSS px) glyph billboards for 3D axis labels.
// Instance storage: 12 floats —
//   world.xyz, pxOffset.x, pxOffset.y, halfW, halfH, u0, v0, u1, v1, pad
// Draw: draw(6, instanceCount). Depth test on, depth write off (pipeline state).

struct VSUniforms {
  viewProj: mat4x4<f32>,
  // xy = viewport CSS px, z = depth bias toward camera (NDC-ish * w), w = unused
  viewport: vec4<f32>,
  // theme text color (premul applied in FS with atlas alpha)
  color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(0) @binding(1) var<storage, read> instances: array<vec4<f32>>;
@group(0) @binding(2) var atlasTex: texture_2d<f32>;
@group(0) @binding(3) var atlasSamp: sampler;

struct VSOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
};

fn cornerOffset(corner: u32) -> vec2<f32> {
  // CSS-ish: +x right, +y down for pixel offsets
  switch corner {
    case 0u: { return vec2<f32>(-1.0, -1.0); } // top-left if y-down
    case 1u: { return vec2<f32>(1.0, -1.0); }
    case 2u: { return vec2<f32>(-1.0, 1.0); }
    case 3u: { return vec2<f32>(-1.0, 1.0); }
    case 4u: { return vec2<f32>(1.0, -1.0); }
    default: { return vec2<f32>(1.0, 1.0); }
  }
}

@vertex
fn vsMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VSOut {
  var out: VSOut;
  // 3 vec4s per instance (12 floats)
  let base = instanceIndex * 3u;
  let a = instances[base + 0u];
  let b = instances[base + 1u];
  let c = instances[base + 2u];

  let world = vec3<f32>(a.x, a.y, a.z);
  let pxOffset = vec2<f32>(a.w, b.x);
  let halfSize = vec2<f32>(b.y, b.z);
  let uv0 = vec2<f32>(b.w, c.x);
  let uv1 = vec2<f32>(c.y, c.z);

  let clip = vsUniforms.viewProj * vec4<f32>(world, 1.0);
  // Hide behind-camera anchors (camera-only frames keep geometry without CPU cull).
  if (clip.w <= 1e-6) {
    out.clipPosition = vec4<f32>(0.0, 0.0, 2.0, 1.0);
    out.uv = vec2<f32>(0.0, 0.0);
    out.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return out;
  }
  let corner = cornerOffset(vertexIndex % 6u);
  let px = pxOffset + corner * halfSize;
  let viewport = max(vsUniforms.viewport.xy, vec2<f32>(1.0, 1.0));

  // Expand in clip space (constant CSS px after perspective divide).
  // CSS y down → flip for NDC y up.
  let ndcOffset = vec2<f32>(
    px.x * 2.0 / viewport.x,
    -px.y * 2.0 / viewport.y,
  );

  // Pull slightly toward camera so labels win over box edges (depth write off).
  let zBias = vsUniforms.viewport.z;
  out.clipPosition = vec4<f32>(
    clip.x + ndcOffset.x * clip.w,
    clip.y + ndcOffset.y * clip.w,
    clip.z + zBias * clip.w,
    clip.w,
  );

  // corner (-1,-1) → uv0, (1,1) → uv1
  let uu = mix(uv0.x, uv1.x, corner.x * 0.5 + 0.5);
  let vv = mix(uv0.y, uv1.y, corner.y * 0.5 + 0.5);
  out.uv = vec2<f32>(uu, vv);
  out.color = vsUniforms.color;
  return out;
}

@fragment
fn fsMain(input: VSOut) -> @location(0) vec4<f32> {
  let s = textureSample(atlasTex, atlasSamp, input.uv);
  // Atlas is white glyphs + alpha (coverage). Colorize with theme textColor.
  let a = s.a * input.color.a;
  if (a <= 0.001) {
    discard;
  }
  // Premultiplied alpha for correct blend
  return vec4<f32>(input.color.rgb * a, a);
}
`, Bt = 96, sr = -8e-4, lr = {
  color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
}, cr = {
  format: "depth24plus",
  depthWriteEnabled: !1,
  depthCompare: "less-equal",
  depthBias: -2,
  depthBiasSlopeScale: -1,
  depthBiasClamp: 0
};
function ur(e) {
  return Math.ceil(e * 4 / 256) * 256;
}
function fr(e, t) {
  const n = e.createTexture({
    label: "axes3dGpuLabels/atlas",
    size: { width: t.width, height: t.height },
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
  });
  try {
    const o = ur(t.width), r = t.width * 4, i = new Uint8Array(o * t.height);
    for (let l = 0; l < t.height; l++)
      i.set(t.pixels.subarray(l * r, l * r + r), l * o);
    return e.queue.writeTexture(
      { texture: n },
      i,
      { bytesPerRow: o, rowsPerImage: t.height },
      { width: t.width, height: t.height }
    ), { texture: n, view: n.createView() };
  } catch (o) {
    throw n.destroy(), o;
  }
}
function dr(e, t) {
  let n = !1;
  const o = (t == null ? void 0 : t.targetFormat) ?? "bgra8unorm", r = (t == null ? void 0 : t.sampleCount) === 4 ? 4 : 1, i = t == null ? void 0 : t.pipelineCache, l = (t == null ? void 0 : t.tickCssPx) ?? 10, a = (t == null ? void 0 : t.titleCssPx) ?? 12, s = (t == null ? void 0 : t.maxGlyphs) ?? 4096;
  let y;
  if (t && Object.prototype.hasOwnProperty.call(t, "atlas"))
    y = t.atlas ?? null;
  else
    try {
      y = kn({
        fontSizePx: 16,
        pixelScale: 2,
        maxAtlasSize: 512,
        // Titles slightly heavier via second bake is overkill; one atlas is enough.
        fontWeight: "500"
      });
    } catch {
      y = null;
    }
  const c = () => ({
    ready: !1,
    prepare() {
    },
    render() {
    },
    dispose() {
      n = !0;
    },
    getInstanceCount: () => 0,
    getInstanceRebuildCount: () => 0
  });
  if (!y || y.glyphs.size === 0)
    return c();
  const d = y;
  let p = null, x = null;
  try {
    const E = fr(e, d);
    p = E.texture, x = E.view;
  } catch {
    return c();
  }
  const S = e.createSampler({
    label: "axes3dGpuLabels/sampler",
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge"
  }), h = Ve(e, Bt, { label: "axes3dGpuLabels/vsUniforms" }), m = new Float32Array(Bt / 4);
  let f = null, g = 0, v = 0, w = !1, G = "", D = 0, N = !1, U = null;
  const z = e.createBindGroupLayout({
    label: "axes3dGpuLabels/bgl",
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float", viewDimension: "2d" }
      },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } }
    ]
  }), b = Ae(
    e,
    {
      label: "axes3dGpuLabels/pipeline",
      bindGroupLayouts: [z],
      vertex: { code: Rt, label: "axes3dGpuLabels/shader" },
      fragment: {
        code: Rt,
        label: "axes3dGpuLabels/shader",
        formats: o,
        blend: lr
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      depthStencil: cr,
      multisample: { count: r }
    },
    i
  ), B = (E) => {
    const O = Math.max(at, E);
    if (f && g >= O) return f;
    f == null || f.destroy();
    let M = g > 0 ? g : at * 64;
    for (; M < O; ) M = Math.ceil(M * 1.5);
    return M = Math.ceil(M / 4) * 4, f = e.createBuffer({
      label: "axes3dGpuLabels/instances",
      size: M,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }), g = M, U = null, f;
  };
  B(at);
  const F = new Float32Array(12);
  e.queue.writeBuffer(f, 0, F.buffer, F.byteOffset, F.byteLength);
  const C = () => {
    !f || !x || (U = e.createBindGroup({
      layout: z,
      entries: [
        { binding: 0, resource: { buffer: h } },
        { binding: 1, resource: { buffer: f } },
        { binding: 2, resource: x },
        { binding: 3, resource: S }
      ]
    }));
  };
  C();
  const A = (E, O, M, q) => {
    m.set(E, 0), m[16] = O, m[17] = M, m[18] = sr, m[19] = 0, m[20] = q[0], m[21] = q[1], m[22] = q[2], m[23] = q[3], _e(e, h, m);
  }, V = (E) => {
    if (v = E.instanceCount, w = !0, v <= 0) return;
    const O = E.instances.byteLength, M = B(O);
    e.queue.writeBuffer(M, 0, E.instances.buffer, E.instances.byteOffset, O), U || C();
  };
  return {
    ready: !0,
    prepare(E, O, M, q, H, J, oe) {
      if (n) return;
      A(q, H, J, oe);
      const ee = tr(E, O, M, H, J, l, a);
      if (!nr(G, ee, w))
        return;
      G = ee, D++;
      const te = Wt(E, O, M), ae = or(te, {
        atlas: d,
        viewProj: q,
        viewportCssW: H,
        viewportCssH: J,
        tickCssPx: l,
        titleCssPx: a,
        maxGlyphs: s,
        trackMissing: !N
      });
      ae.missingChars.length > 0 && !N && (N = !0, console.warn(rr(ae.missingChars))), V(ae);
    },
    render(E) {
      n || !w || !U || !f || v <= 0 || (E.setPipeline(b), E.setBindGroup(0, U), E.draw(6, v));
    },
    dispose() {
      n || (n = !0, f == null || f.destroy(), p == null || p.destroy(), h.destroy(), f = null, p = null, x = null, U = null);
    },
    getInstanceCount: () => v,
    getInstanceRebuildCount: () => D
  };
}
function hr(e, t) {
  return t ?? (e != null && typeof e == "object" && !Array.isArray(e) && !ArrayBuffer.isView(e) && "value" in e ? e.value ?? null : null);
}
function Et(e, t) {
  return e == null || e.data !== t.data || e.valueChannel !== t.valueChannel;
}
function mr(e, t) {
  return e == null || t == null ? !1 : t !== e;
}
const be = (e) => {
  const t = Number(e);
  return Number.isFinite(t) ? t : Number.NaN;
}, Ye = (e, t) => t < 0 || t >= e.length ? Number.NaN : be(e[t]);
function Tt(e, t) {
  let n = 1 / 0, o = -1 / 0;
  const r = Math.min(e.length, t);
  for (let i = 0; i < r; i++) {
    const l = Number(e[i]);
    Number.isFinite(l) && (l < n && (n = l), l > o && (o = l));
  }
  return Number.isFinite(n) ? o > n ? { yMin: n, yMax: o } : { yMin: n, yMax: n + 1 } : { yMin: 0, yMax: 1 };
}
function pr(e, t, n) {
  const o = $e(e);
  if (!o)
    return { data: e, dimsChanged: !1, scrolled: !1, recomputeDomain: !0 };
  const r = o.columns * o.rows, i = t.y;
  let l;
  if (i instanceof Float32Array && i.length >= r)
    l = i.length === r ? i : i.subarray(0, r);
  else {
    const y = n == null ? void 0 : n.targetY;
    l = y && y.length >= r ? y.length === r ? y : y.subarray(0, r) : new Float32Array(r);
    for (let c = 0; c < r; c++)
      l[c] = c < i.length ? be(i[c]) : Number.NaN;
  }
  const a = typeof t.yMin == "number" && Number.isFinite(t.yMin) ? t.yMin : void 0, s = typeof t.yMax == "number" && Number.isFinite(t.yMax) ? t.yMax : void 0;
  return {
    data: {
      xStart: o.xStart,
      xStep: o.xStep,
      zStart: o.zStart,
      zStep: o.zStep,
      columns: o.columns,
      rows: o.rows,
      y: l
    },
    dimsChanged: !1,
    scrolled: !1,
    yMin: a,
    yMax: s,
    recomputeDomain: a == null || s == null
  };
}
function yr(e, t) {
  const n = $e(e);
  if (!n)
    return { data: e, dimsChanged: !1, scrolled: !1, recomputeDomain: !0 };
  const o = Math.max(0, Math.floor(t.columns));
  if (o === 0)
    return { data: n, dimsChanged: !1, scrolled: !1, recomputeDomain: !1 };
  const r = n.rows, i = n.columns, l = t.scrollX !== !1, a = t.y;
  if (l) {
    const c = Math.max(0, i - o), d = i - c, p = new Float32Array(i * r), x = n.y;
    if (o === 1 && c === i - 1 && i >= 2)
      for (let S = 0; S < r; S++) {
        const h = S * i;
        if (x instanceof Float32Array)
          p.set(x.subarray(h + 1, h + i), h);
        else
          for (let m = 0; m < c; m++)
            p[h + m] = Ye(x, h + m + 1);
        p[h + c] = be(a[S]);
      }
    else if (o >= i)
      for (let S = 0; S < i; S++) {
        const h = o - i + S;
        for (let m = 0; m < r; m++)
          p[m * i + S] = be(a[h * r + m]);
      }
    else {
      for (let h = 0; h < c; h++) {
        const m = h + (i - c);
        for (let f = 0; f < r; f++)
          p[f * i + h] = Ye(x, f * i + m);
      }
      const S = c;
      for (let h = 0; h < o; h++) {
        const m = S + h;
        if (m >= i) break;
        for (let f = 0; f < r; f++)
          p[f * i + m] = be(a[h * r + f]);
      }
    }
    return {
      data: {
        xStart: n.xStart + d * n.xStep,
        xStep: n.xStep,
        zStart: n.zStart,
        zStep: n.zStep,
        columns: i,
        rows: r,
        y: p
      },
      dimsChanged: !1,
      scrolled: d > 0 || o > 0,
      // Domain expands from new column in coordinator for cheap strip path
      recomputeDomain: o !== 1
    };
  }
  const s = i + o, y = new Float32Array(s * r);
  for (let c = 0; c < r; c++)
    for (let d = 0; d < i; d++)
      y[c * s + d] = Ye(n.y, c * i + d);
  for (let c = 0; c < o; c++) {
    const d = i + c;
    for (let p = 0; p < r; p++)
      y[p * s + d] = be(a[c * r + p]);
  }
  return {
    data: {
      xStart: n.xStart,
      xStep: n.xStep,
      zStart: n.zStart,
      zStep: n.zStep,
      columns: s,
      rows: r,
      y
    },
    dimsChanged: !0,
    scrolled: !1,
    recomputeDomain: !0
  };
}
function xr(e, t) {
  const n = $e(e);
  if (!n)
    return { data: e, dimsChanged: !1, scrolled: !1, recomputeDomain: !0 };
  const o = Math.max(0, Math.floor(t.rows));
  if (o === 0)
    return { data: n, dimsChanged: !1, scrolled: !1, recomputeDomain: !1 };
  const r = n.columns, i = n.rows, l = t.scrollZ !== !1, a = t.y;
  if (l) {
    const c = Math.max(0, i - o), d = new Float32Array(r * i);
    for (let x = 0; x < c; x++) {
      const S = x + (i - c);
      for (let h = 0; h < r; h++)
        d[x * r + h] = Ye(n.y, S * r + h);
    }
    if (o >= i)
      for (let x = 0; x < i; x++) {
        const S = o - i + x;
        for (let h = 0; h < r; h++)
          d[x * r + h] = be(a[S * r + h]);
      }
    else
      for (let x = 0; x < o; x++) {
        const S = c + x;
        for (let h = 0; h < r; h++)
          d[S * r + h] = be(a[x * r + h]);
      }
    const p = i - c;
    return {
      data: {
        xStart: n.xStart,
        xStep: n.xStep,
        zStart: n.zStart + p * n.zStep,
        zStep: n.zStep,
        columns: r,
        rows: i,
        y: d
      },
      dimsChanged: !1,
      scrolled: p > 0 || o > 0,
      recomputeDomain: !0
    };
  }
  const s = i + o, y = new Float32Array(r * s);
  for (let c = 0; c < i; c++)
    for (let d = 0; d < r; d++)
      y[c * r + d] = Ye(n.y, c * r + d);
  for (let c = 0; c < o; c++) {
    const d = i + c;
    for (let p = 0; p < r; p++)
      y[d * r + p] = be(a[c * r + p]);
  }
  return {
    data: {
      xStart: n.xStart,
      xStep: n.xStep,
      zStart: n.zStart,
      zStep: n.zStep,
      columns: r,
      rows: s,
      y
    },
    dimsChanged: !0,
    scrolled: !1,
    recomputeDomain: !0
  };
}
function gr(e, t, n) {
  return t.mode === "replaceY" ? pr(e, t, n) : t.mode === "appendColumns" ? yr(e, t) : xr(e, t);
}
function Sr(e) {
  return e.mode === "appendColumns" && e.scrollX !== !1 && e.columns === 1 && !e.recomputeDomain && !e.yDomainExplicit;
}
function br(e) {
  return e.mode === "replaceY" && e.contoursShow === !0;
}
function vr(e) {
  return typeof e.resultYMin == "number" && Number.isFinite(e.resultYMin) && typeof e.resultYMax == "number" && Number.isFinite(e.resultYMax) ? { yMin: e.resultYMin, yMax: e.resultYMax } : e.streamDomain && Number.isFinite(e.streamDomain.yMin) && Number.isFinite(e.streamDomain.yMax) ? { yMin: e.streamDomain.yMin, yMax: e.streamDomain.yMax } : e.yDomainExplicit && Number.isFinite(e.seriesYMin) && Number.isFinite(e.seriesYMax) ? { yMin: e.seriesYMin, yMax: e.seriesYMax } : null;
}
function Mr(e, t, n, o) {
  if (!e || !t || !Number.isFinite(t.yMin) || !Number.isFinite(t.yMax))
    return null;
  const r = Math.min(t.yMin, t.yMax), i = Math.max(t.yMin, t.yMax);
  return {
    data: n,
    y: o,
    aabb: {
      min: [e.min[0], r, e.min[2]],
      max: [e.max[0], i, e.max[2]]
    }
  };
}
function wr(e) {
  if (e.streamCleared) return !0;
  const t = e.prev;
  return t == null ? !1 : !!(e.yDomainExplicit && !t.yDomainExplicit || e.seriesYMin !== t.yMin || e.seriesYMax !== t.yMax);
}
function Pr(e, t, n) {
  return t.yMin != null && t.yMax != null && !t.recomputeDomain ? { kind: "setFromUpdate", yMin: t.yMin, yMax: t.yMax } : Sr({
    mode: e.mode,
    scrollX: e.mode === "appendColumns" ? e.scrollX : void 0,
    columns: e.mode === "appendColumns" ? e.columns : void 0,
    recomputeDomain: t.recomputeDomain,
    yDomainExplicit: n
  }) ? { kind: "expandStrip" } : t.recomputeDomain ? n ? { kind: "clearToSeriesExplicit" } : { kind: "autoFull" } : { kind: "noop" };
}
const Cr = 1, zr = 33;
function Ur(e, t, n) {
  let o = !1, r = t;
  const i = e.device;
  if (!i)
    throw new Error("createRenderCoordinator3D: GPUContext has no device.");
  const l = n == null ? void 0 : n.pipelineCache, a = e.preferredFormat ?? "bgra8unorm", s = On();
  it(s, {
    type: t.camera.type,
    fovY: t.camera.fovY,
    near: t.camera.near,
    far: t.camera.far,
    eye: t.camera.eye,
    target: t.camera.target,
    up: t.camera.up,
    orthoSize: t.camera.orthoSize
  }), t.camera.eye && t.camera.target && (s.needsFit = !1, s.userLocked = !0);
  let y = null, c = null, d = 0, p = 0;
  const x = (u, R) => ((!y || !c || d !== u || p !== R) && (y == null || y.destroy(), y = i.createTexture({
    label: "coordinator3d/depth",
    size: { width: Math.max(1, u), height: Math.max(1, R) },
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  }), c = y.createView(), d = u, p = R), c), S = [], h = [], m = [], f = [], g = [], v = [], w = [], G = [], D = [], N = [], U = [], z = [], b = wn(i, {
    targetFormat: a,
    pipelineCache: l
  }), B = ar(), F = dr(i, {
    targetFormat: a,
    sampleCount: Cr,
    pipelineCache: l
  });
  let C = !1, A = null, V = null, E = null, O = null;
  const M = e.canvas, q = () => {
    var L, P, T;
    if (!M || !M.parentElement) return;
    const u = M.parentElement;
    ((L = r.legend) == null ? void 0 : L.show) !== !1 && r.series.length > 0 ? (E || (E = nn(u, ((P = r.legend) == null ? void 0 : P.position) ?? "right")), E.update(r.series, r.theme)) : E && (E.dispose(), E = null), ((T = r.tooltip) == null ? void 0 : T.show) !== !1 ? O || (O = rn(u)) : O && (O.dispose(), O = null);
  }, H = (u) => {
    var R;
    return {
      data: u.data,
      valueChannel: hr(u.data, (R = u.colorBy) == null ? void 0 : R.values)
    };
  }, J = (u, R) => {
    var T;
    const L = H(R);
    if (f[u] && !Et(g[u], L))
      return f[u];
    const P = st(R.data, { valueOverride: (T = R.colorBy) == null ? void 0 : T.values });
    return f[u] = P, g[u] = L, z[u] = null, P;
  }, oe = (u, R) => {
    const L = w[u], P = D[u];
    return !L && !P ? R : {
      ...R,
      data: L ?? R.data,
      yMin: (P == null ? void 0 : P.yMin) ?? R.yMin,
      yMax: (P == null ? void 0 : P.yMax) ?? R.yMax,
      // Preserve explicit-domain flag for stream hot-path skips (spread already does).
      yDomainExplicit: R.yDomainExplicit
    };
  }, ee = (u, R) => {
    var j;
    const L = oe(u, R), P = (j = L.data) == null ? void 0 : j.y, T = v[u];
    if (T && T.data === L.data && T.y === P)
      return T.aabb;
    const Y = pn(L.data);
    return v[u] = { data: L.data, y: P, aabb: Y }, Y;
  }, te = () => {
    const u = sn();
    let R = !1;
    for (let L = 0; L < r.series.length; L++) {
      const P = r.series[L];
      if (P.visible) {
        if (P.type === "pointCloud3d") {
          const T = J(L, P);
          T.aabb && (gt(u, T.aabb), R = !0);
        } else if (P.type === "surface3d") {
          const T = ee(L, P);
          T && (gt(u, T), R = !0);
        }
      }
    }
    return R ? {
      min: [u.min[0], u.min[1], u.min[2]],
      max: [u.max[0], u.max[1], u.max[2]]
    } : null;
  }, ae = () => {
    var R, L, P, T, Y, j;
    const u = r.series.length;
    for (; S.length < u; ) S.push(null);
    for (; h.length < u; ) h.push(null);
    for (; m.length < u; ) m.push(null);
    for (; f.length < u; ) f.push(null);
    for (; g.length < u; ) g.push(null);
    for (; v.length < u; ) v.push(null);
    for (; w.length < u; ) w.push(null);
    for (; G.length < u; ) G.push(null);
    for (; D.length < u; ) D.push(null);
    for (; N.length < u; ) N.push(null);
    for (; U.length < u; ) U.push(null);
    for (; z.length < u; ) z.push(null);
    for (let I = 0; I < u; I++) {
      const le = r.series[I];
      le.type === "pointCloud3d" ? (S[I] || (S[I] = hn(i, {
        targetFormat: a,
        pipelineCache: l
      })), (R = h[I]) == null || R.dispose(), h[I] = null, (L = m[I]) == null || L.dispose(), m[I] = null, v[I] = null, w[I] = null, G[I] = null, D[I] = null, N[I] = null, U[I] = null) : le.type === "surface3d" && (h[I] || (h[I] = bn(i, {
        targetFormat: a,
        pipelineCache: l
      })), m[I] || (m[I] = Fn(i, {
        targetFormat: a,
        pipelineCache: l
      })), (P = S[I]) == null || P.dispose(), S[I] = null, f[I] = null, g[I] = null, z[I] = null);
    }
    for (let I = u; I < S.length; I++)
      (T = S[I]) == null || T.dispose(), S[I] = null, (Y = h[I]) == null || Y.dispose(), h[I] = null, (j = m[I]) == null || j.dispose(), m[I] = null, f[I] = null, g[I] = null, v[I] = null, w[I] = null, G[I] = null, D[I] = null, N[I] = null, U[I] = null, z[I] = null;
  };
  let ve = null, me = 0, ye = 0, Se = !1, _ = !1, $ = null, Q = 0, X = null, K = null, se = 0, he = 0, fe = !1;
  const xe = () => {
    X != null && (cancelAnimationFrame(X), X = null), K = null;
  }, ge = (u, R, L, P, T) => {
    let Y = z[u];
    Y || (Y = Wn(), z[u] = Y);
    const j = Xt(R.count, P, T, L, R.packed);
    return Y.stamp !== j && qn(Y, R.packed, R.count, L, P, T), Y;
  }, we = (u, R, L = 10) => {
    const P = (M == null ? void 0 : M.clientWidth) ?? 0, T = (M == null ? void 0 : M.clientHeight) ?? 0;
    if (P <= 0 || T <= 0) return null;
    const Y = P / T, j = Nt(s, Y, Ge());
    let I = null, le = Number.POSITIVE_INFINITY, W = null, k = Number.POSITIVE_INFINITY;
    for (let Z = 0; Z < r.series.length; Z++) {
      const ie = r.series[Z];
      if (ie.visible) {
        if (ie.type === "pointCloud3d") {
          const ce = J(Z, ie), ne = ge(Z, ce, j, P, T), ue = Hn(ne, ce.packed, ce.count, j, u, R, P, T, L) ?? _t(ce.packed, ce.count, j, u, R, P, T, L);
          ue && ue.dist2 < le && (le = ue.dist2, I = {
            kind: "pointCloud3d",
            seriesIndex: Z,
            dataIndex: ue.dataIndex,
            x: ue.x,
            y: ue.y,
            z: ue.z,
            value: ue.value,
            seriesName: ie.name ?? null,
            color: ie.pointStyle.color,
            screenDistancePx: Math.sqrt(ue.dist2)
          });
        } else if (ie.type === "surface3d") {
          const ce = oe(Z, ie), ne = Kn(
            {
              xStart: ce.data.xStart,
              xStep: ce.data.xStep,
              zStart: ce.data.zStart,
              zStep: ce.data.zStep,
              columns: ce.data.columns,
              rows: ce.data.rows,
              y: ce.data.y
            },
            j,
            u,
            R,
            P,
            T
          );
          ne && ne.t < k && (k = ne.t, W = {
            kind: "surface3d",
            seriesIndex: Z,
            i: ne.i,
            j: ne.j,
            dataIndex: ne.j * ce.data.columns + ne.i,
            x: ne.x,
            y: ne.y,
            z: ne.z,
            height: ne.height,
            seriesName: ie.name ?? null,
            color: ie.color
          });
        }
      }
    }
    return I && W ? I.screenDistancePx <= L * 0.75 || I.screenDistancePx < 6 ? I : W : I ?? W;
  }, pe = (u) => {
    if (u.kind === "pointCloud3d") {
      const L = u.seriesName ?? `Series ${u.seriesIndex + 1}`;
      return `<div style="font-weight:600;margin-bottom:4px;color:${u.color}">${Lt(L)}</div><div>x: ${Me(u.x)}</div><div>y: ${Me(u.y)}</div><div>z: ${Me(u.z)}</div>` + (Number.isFinite(u.value) ? `<div>value: ${Me(u.value)}</div>` : "");
    }
    const R = u.seriesName ?? `Series ${u.seriesIndex + 1}`;
    return `<div style="font-weight:600;margin-bottom:4px;color:${u.color}">${Lt(R)}</div><div>cell: (${u.i}, ${u.j})</div><div>x: ${Me(u.x)}</div><div>y: ${Me(u.y)}</div><div>z: ${Me(u.z)}</div><div>height: ${Me(u.height)}</div>`;
  }, ze = (u) => {
    if (!(o || !M)) {
      xe(), ve = u.pointerId, me = u.clientX, ye = u.clientY, se = u.clientX, he = u.clientY, fe = !1, Se = !0, _ = u.button === 2 || u.shiftKey || u.button === 1;
      try {
        M.setPointerCapture(u.pointerId);
      } catch {
      }
      u.preventDefault();
    }
  }, Be = (u) => {
    var I, le, W, k;
    if (o || !M || Se) return;
    Q = performance.now();
    const R = M.getBoundingClientRect(), L = u.clientX - R.left, P = u.clientY - R.top, T = we(L, P, 12);
    O && ((I = r.tooltip) == null ? void 0 : I.show) !== !1 && (T ? O.show(L, P, pe(T)) : O.hide());
    const Y = $ ? $.kind === "pointCloud3d" ? `c:${$.seriesIndex}:${$.dataIndex}` : `s:${$.seriesIndex}:${$.i}:${$.j}` : null, j = T ? T.kind === "pointCloud3d" ? `c:${T.seriesIndex}:${T.dataIndex}` : `s:${T.seriesIndex}:${T.i}:${T.j}` : null;
    Y !== j && ($ && !T ? (le = n == null ? void 0 : n.onPickEvent) == null || le.call(n, "mouseout", $) : T && Y !== j && ($ && ((W = n == null ? void 0 : n.onPickEvent) == null || W.call(n, "mouseout", $)), (k = n == null ? void 0 : n.onPickEvent) == null || k.call(n, "mouseover", T)), $ = T);
  }, Ee = (u) => {
    var L;
    if (o) return;
    if (Se && ve === u.pointerId) {
      const P = u.clientX - me, T = u.clientY - ye;
      me = u.clientX, ye = u.clientY, Math.hypot(u.clientX - se, u.clientY - he) > 4 && (fe = !0);
      const Y = r.interaction3d, j = (M == null ? void 0 : M.clientHeight) ?? 1;
      _ && Y.pan ? $n(s, P, T, j, Y.panSpeed) : !_ && Y.orbit && _n(s, P, T, Y.orbitSpeed), s.userLocked = !0, (L = n == null ? void 0 : n.onRequestRender) == null || L.call(n);
      return;
    }
    if (performance.now() - Q < zr) {
      K = u, X == null && (X = requestAnimationFrame(() => {
        X = null;
        const P = K;
        K = null, P && Be(P);
      }));
      return;
    }
    K = null, Be(u);
  }, Pe = (u) => {
    var R;
    if (ve === u.pointerId && (Se = !1, ve = null, !fe && M)) {
      const L = M.getBoundingClientRect(), P = u.clientX - L.left, T = u.clientY - L.top, Y = we(P, T, 12);
      (R = n == null ? void 0 : n.onPickEvent) == null || R.call(n, "click", Y);
    }
  }, Ue = (u) => {
    var R;
    o || r.interaction3d.zoom && (u.preventDefault(), Xn(s, u.deltaY, r.interaction3d.zoomSpeed), s.userLocked = !0, (R = n == null ? void 0 : n.onRequestRender) == null || R.call(n));
  }, Fe = () => {
    var u;
    o || (Te(), (u = n == null ? void 0 : n.onRequestRender) == null || u.call(n));
  }, De = (u) => {
    u.preventDefault();
  }, ct = () => {
    var u;
    xe(), $ && ((u = n == null ? void 0 : n.onPickEvent) == null || u.call(n, "mouseout", $), $ = null), O == null || O.hide();
  };
  M && (M.addEventListener("pointerdown", ze), M.addEventListener("pointermove", Ee), M.addEventListener("pointerup", Pe), M.addEventListener("pointercancel", Pe), M.addEventListener("pointerleave", ct), M.addEventListener("wheel", Ue, { passive: !1 }), M.addEventListener("dblclick", Fe), M.addEventListener("contextmenu", De));
  const Te = () => {
    const u = te();
    Vn(s, u);
  }, qt = (u) => {
    var R, L;
    if (!o) {
      r = u, it(s, {
        type: u.camera.type,
        fovY: u.camera.fovY,
        near: u.camera.near,
        far: u.camera.far,
        eye: u.camera.eye,
        target: u.camera.target,
        up: u.camera.up,
        orthoSize: u.camera.orthoSize
      });
      for (let P = 0; P < u.series.length; P++) {
        const T = u.series[P];
        if (T.type === "pointCloud3d") {
          const Y = H(T);
          Et(g[P], Y) && (f[P] = null, g[P] = null, z[P] = null);
        } else
          f[P] = null, g[P] = null, z[P] = null;
        if (T.type === "surface3d") {
          const Y = G[P], j = mr(Y, T.data);
          j && (w[P] = null, U[P] = null, T.contours.show && ((R = m[P]) == null || R.invalidate())), wr({
            streamCleared: j,
            yDomainExplicit: T.yDomainExplicit,
            seriesYMin: T.yMin,
            seriesYMax: T.yMax,
            prev: N[P]
          }) && (D[P] = null), N[P] = {
            yDomainExplicit: T.yDomainExplicit,
            yMin: T.yMin,
            yMax: T.yMax
          }, G[P] = T.data;
          const I = w[P] ?? T.data, le = I == null ? void 0 : I.y, W = v[P];
          (!W || W.data !== I || W.y !== le) && (v[P] = null);
        } else
          v[P] = null, w[P] = null, G[P] = null, D[P] = null, N[P] = null, U[P] = null;
      }
      for (let P = u.series.length; P < f.length; P++)
        f[P] = null, g[P] = null, v[P] = null, w[P] = null, G[P] = null, D[P] = null, N[P] = null, U[P] = null, z[P] = null;
      ae(), q(), s.needsFit && !s.userLocked && Te(), (L = n == null ? void 0 : n.onRequestRender) == null || L.call(n);
    }
  }, Ht = () => {
    var dt, ht, mt, pt, yt, xt;
    if (o) return;
    const u = e.canvasContext;
    if (!u || !i) return;
    const R = (M == null ? void 0 : M.width) ?? 1, L = (M == null ? void 0 : M.height) ?? 1, P = (M == null ? void 0 : M.clientWidth) || R, T = (M == null ? void 0 : M.clientHeight) || L, Y = P / Math.max(1, T);
    s.needsFit && !s.userLocked && Te();
    const j = Nt(s, Y, Ge()), I = x(R, L), le = u.getCurrentTexture().createView(), W = on(r.theme.backgroundColor ?? "#0a0a0a", {
      r: 0.04,
      g: 0.04,
      b: 0.06,
      a: 1
    });
    ae();
    for (let re = 0; re < r.series.length; re++) {
      const de = r.series[re];
      if (de.visible) {
        if (de.type === "surface3d") {
          const Le = oe(re, de);
          (dt = h[re]) == null || dt.prepare(Le, { viewProj: j }), (ht = m[re]) == null || ht.prepare(Le, j);
        } else if (de.type === "pointCloud3d") {
          const Le = de, Kt = J(re, Le);
          (mt = S[re]) == null || mt.preparePacked(Le, Kt, {
            viewProj: j,
            viewportCssW: P,
            viewportCssH: T
          });
        }
      }
    }
    const k = r.axes3d, Z = Yt(te()), ie = Oe(r.theme.axisLineColor ?? "rgba(255,255,255,0.35)") ?? [
      0.6,
      0.6,
      0.65,
      0.5
    ], ce = Oe(r.theme.gridLineColor ?? "rgba(255,255,255,0.12)") ?? [
      0.4,
      0.4,
      0.45,
      0.25
    ];
    V = b.prepare(Z, j, ie, k, ce);
    const ne = er(k.labelMode, {
      atlasReady: F.ready
    });
    !F.ready && (k.labelMode === "gpu" || k.labelMode === "auto") && !C && (C = !0, console.warn(
      "ChartGPU 3D: axes3d GPU label atlas failed to init; falling back to labelMode 'dom' for this chart instance."
    ));
    const ue = r.theme.textColor ?? "rgba(224,224,224,0.9)", ut = typeof ue == "string" ? ue : "#e0e0e0", Zt = Oe(ut) ?? [0.88, 0.88, 0.88, 0.92];
    ne === "gpu" && V ? (A !== "gpu" && B.clear(), A = "gpu", F.prepare(Z, V, k, j, P, T, Zt)) : M != null && M.parentElement && V && (A = "dom", B.update(M.parentElement, Z, V, k, j, P, T, ut));
    const ft = i.createCommandEncoder({ label: "coordinator3d/frame" }), Ne = ft.beginRenderPass({
      label: "coordinator3d/main",
      colorAttachments: [
        {
          view: le,
          clearValue: W,
          loadOp: "clear",
          storeOp: "store"
        }
      ],
      depthStencilAttachment: {
        view: I,
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    });
    for (let re = 0; re < r.series.length; re++) {
      const de = r.series[re];
      !de.visible || de.type !== "surface3d" || (pt = h[re]) == null || pt.render(Ne);
    }
    for (let re = 0; re < r.series.length; re++) {
      const de = r.series[re];
      !de.visible || de.type !== "surface3d" || (yt = m[re]) == null || yt.render(Ne);
    }
    for (let re = 0; re < r.series.length; re++) {
      const de = r.series[re];
      !de.visible || de.type !== "pointCloud3d" || (xt = S[re]) == null || xt.render(Ne);
    }
    b.render(Ne), ne === "gpu" && F.render(Ne), Ne.end(), an(i, ft.finish());
  };
  return ae(), q(), s.needsFit && Te(), {
    setOptions: qt,
    render: Ht,
    dispose() {
      if (!o) {
        o = !0, xe(), M && (M.removeEventListener("pointerdown", ze), M.removeEventListener("pointermove", Ee), M.removeEventListener("pointerup", Pe), M.removeEventListener("pointercancel", Pe), M.removeEventListener("pointerleave", ct), M.removeEventListener("wheel", Ue), M.removeEventListener("dblclick", Fe), M.removeEventListener("contextmenu", De));
        for (const u of S) u == null || u.dispose();
        for (const u of h) u == null || u.dispose();
        for (const u of m) u == null || u.dispose();
        b.dispose(), B.dispose(), F.dispose(), y == null || y.destroy(), E == null || E.dispose(), O == null || O.dispose(), E = null, O = null;
      }
    },
    resetCamera() {
      var u;
      Te(), (u = n == null ? void 0 : n.onRequestRender) == null || u.call(n);
    },
    setCamera(u) {
      var R;
      it(s, u), (R = n == null ? void 0 : n.onRequestRender) == null || R.call(n);
    },
    getCamera: () => Yn(s),
    pick: (u, R, L) => we(u, R, L),
    appendPointCloudData(u, R, L) {
      var k, Z, ie;
      if (o) return null;
      const P = r.series[u];
      if (!P || P.type !== "pointCloud3d")
        return console.warn(
          `ChartGPU 3D: appendData seriesIndex ${u} is not pointCloud3d (resolved index after OptionResolver filtering).`
        ), null;
      const T = J(u, P), Y = en(L == null ? void 0 : L.maxPoints), j = tn(T.packed, T.count, R, {
        valueOverride: (k = P.colorBy) == null ? void 0 : k.values,
        maxPoints: Y
      });
      f[u] = j, g[u] = H(P), z[u] = null, (Z = n == null ? void 0 : n.onRequestRender) == null || Z.call(n);
      const I = j.aabb, le = st(R, { valueOverride: (ie = P.colorBy) == null ? void 0 : ie.values });
      return {
        appended: Y != null && le.count >= Y ? Y : le.count,
        totalCount: j.count,
        xExtent: {
          min: I ? I.min[0] : 0,
          max: I ? I.max[0] : 0
        }
      };
    },
    updateSurface3D(u, R) {
      var I, le;
      if (o) return !1;
      const L = r.series[u];
      if (!L || L.type !== "surface3d")
        return console.warn(
          `ChartGPU 3D: updateSurface3D seriesIndex ${u} is not surface3d (got ${(L == null ? void 0 : L.type) ?? "missing"}).`
        ), !1;
      const P = w[u] ?? L.data;
      G[u] == null && (G[u] = L.data);
      let T;
      if (R.mode === "replaceY") {
        const W = Math.max(0, Math.floor(P.columns) * Math.floor(P.rows));
        if (!(R.y instanceof Float32Array && R.y.length >= W) && W > 0) {
          let Z = U[u];
          (!Z || Z.length < W) && (Z = new Float32Array(W), U[u] = Z), T = { targetY: Z };
        }
      }
      const Y = gr(P, R, T);
      w[u] = Y.data;
      const j = Pr(R, Y, L.yDomainExplicit);
      if (j.kind === "setFromUpdate")
        D[u] = { yMin: j.yMin, yMax: j.yMax };
      else if (j.kind === "expandStrip" && R.mode === "appendColumns") {
        const W = D[u], k = R.y;
        let Z = (W == null ? void 0 : W.yMin) ?? 1 / 0, ie = (W == null ? void 0 : W.yMax) ?? -1 / 0;
        const ce = Math.min(k.length, Y.data.rows);
        for (let ne = 0; ne < ce; ne++) {
          const ue = Number(k[ne]);
          Number.isFinite(ue) && (ue < Z && (Z = ue), ue > ie && (ie = ue));
        }
        if (!Number.isFinite(Z)) {
          const ne = Tt(Y.data.y, Y.data.columns * Y.data.rows);
          Z = ne.yMin, ie = ne.yMax;
        }
        D[u] = {
          yMin: Z,
          yMax: ie > Z ? ie : Z + 1
        };
      } else if (j.kind === "clearToSeriesExplicit")
        D[u] = null;
      else if (j.kind === "autoFull") {
        const W = Tt(Y.data.y, Y.data.columns * Y.data.rows), k = Y.yMin ?? W.yMin, Z = Y.yMax ?? W.yMax;
        D[u] = {
          yMin: k,
          yMax: Z > k ? Z : k + 1
        };
      }
      if (R.mode === "appendColumns" && R.scrollX !== !1 && R.columns === 1 && Y.scrolled) {
        const W = v[u], k = Y.data.xStep * Math.max(0, Math.floor(R.columns));
        if (W != null && W.aabb && k !== 0) {
          const Z = yn(W.aabb, k, R.y, Y.data.rows);
          v[u] = {
            data: Y.data,
            y: Y.data.y,
            aabb: Z
          };
        } else
          v[u] = null;
      } else if (R.mode === "replaceY" && !Y.dimsChanged) {
        const W = v[u], k = vr({
          resultYMin: Y.yMin,
          resultYMax: Y.yMax,
          streamDomain: D[u],
          yDomainExplicit: L.yDomainExplicit,
          seriesYMin: L.yMin,
          seriesYMax: L.yMax
        }), Z = Mr((W == null ? void 0 : W.aabb) ?? null, k, Y.data, Y.data.y);
        v[u] = Z;
      } else
        v[u] = null;
      return br({ mode: R.mode, contoursShow: L.contours.show }) && ((I = m[u]) == null || I.invalidate()), (le = n == null ? void 0 : n.onRequestRender) == null || le.call(n), !0;
    },
    getPointCloudCount(u) {
      const R = f[u];
      if (R) return R.count;
      const L = r.series[u];
      return (L == null ? void 0 : L.type) === "pointCloud3d" ? J(u, L).count : 0;
    },
    getCanvas: () => M
  };
}
const Me = (e) => {
  if (!Number.isFinite(e)) return "—";
  const t = Math.abs(e);
  return t >= 1e6 || t > 0 && t < 1e-3 ? e.toExponential(3) : e.toPrecision(6).replace(/\.?0+$/, "");
}, Lt = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
async function Nr(e, t, n, o) {
  var z;
  if (n) {
    if (typeof navigator > "u" || !navigator.gpu)
      throw new Error("ChartGPU: Shared device mode requires WebGPU globals (navigator.gpu).");
  } else {
    const b = await ln();
    if (!b.supported) {
      const B = b.reason || "Unknown reason";
      throw new Error(
        `ChartGPU: WebGPU is not available.
Reason: ${B}
Browser support: Chrome/Edge 113+, Safari 18+, Firefox not yet supported.`
      );
    }
  }
  if (n != null && n.pipelineCache && n.pipelineCache.device !== n.device)
    throw new Error("ChartGPU: pipelineCache.device must match the GPUDevice in the creation context.");
  const r = document.createElement("canvas");
  r.style.display = "block", r.style.width = "100%", r.style.height = "100%", e.appendChild(r);
  const i = !!n;
  let l = !1, a = t.renderMode ?? "auto", s = !1, y = !1, c = null, d = null, p = !0, x = null, S = t, h = St(S);
  const m = (() => {
    const b = t.devicePixelRatio;
    return typeof b == "number" && Number.isFinite(b) && b > 0 ? b : null;
  })(), f = {
    click: /* @__PURE__ */ new Set(),
    mouseover: /* @__PURE__ */ new Set(),
    mouseout: /* @__PURE__ */ new Set(),
    crosshairMove: /* @__PURE__ */ new Set(),
    zoomRangeChange: /* @__PURE__ */ new Set(),
    deviceLost: /* @__PURE__ */ new Set(),
    dataAppend: /* @__PURE__ */ new Set()
  }, g = (b, B) => {
    const F = f[b];
    if (F)
      for (const C of F)
        try {
          C(B);
        } catch (A) {
          console.error("ChartGPU event listener error:", A);
        }
  }, v = () => m ?? ((typeof window < "u" ? window.devicePixelRatio : 1) || 1);
  let w = null;
  const G = (b) => {
    var oe;
    if (l) return;
    const B = r.clientWidth, F = r.clientHeight, C = v();
    c && c.setDevicePixelRatio(C);
    const A = ((oe = c == null ? void 0 : c.device) == null ? void 0 : oe.limits.maxTextureDimension2D) ?? 8192, V = Math.min(A, Math.max(1, Math.round(B * C))), E = Math.min(A, Math.max(1, Math.round(F * C))), O = r.width !== V || r.height !== E;
    O && (r.width = V, r.height = E);
    const M = c == null ? void 0 : c.device, q = c == null ? void 0 : c.canvasContext, H = c == null ? void 0 : c.preferredFormat;
    let J = !1;
    M && q && H && (O || !w || w.width !== r.width || w.height !== r.height || w.format !== H) && (q.configure({
      device: M,
      format: H,
      alphaMode: "opaque"
    }), w = { width: r.width, height: r.height, format: H }, J = !0), b && (O || J) && N();
  }, D = () => {
    if (!(l || y || !d) && !s) {
      s = !0;
      try {
        d.render(), p = !1;
      } finally {
        s = !1;
      }
    }
  }, N = () => {
    l || y || (p = !0, a === "auto" && x == null && (x = requestAnimationFrame(() => {
      x = null, p && D();
    })));
  }, U = {
    get options() {
      return S;
    },
    get disposed() {
      return l;
    },
    setOption(b) {
      if (l) return;
      const B = S, F = h;
      S = {
        ...S,
        ...b,
        series: b.series ?? S.series,
        coordinateSystem: "cartesian3d"
      }, b.coordinateSystem != null && b.coordinateSystem !== "cartesian3d" && console.warn(
        "ChartGPU 3D: coordinateSystem cannot switch to 2D via setOption; keeping 'cartesian3d'. Dispose and recreate for 2D."
      ), h = St(S, {
        previousResolved: F,
        previousUserOptions: B
      }), d == null || d.setOptions(h), N();
    },
    getHitTestStoreRebuildCount: () => 0,
    getHitTestSeriesPointCount: () => 0,
    appendData(b, B, F) {
      if (l || !d) return;
      const C = h.series[b];
      if (!C || C.type !== "pointCloud3d") {
        console.warn(
          `ChartGPU 3D: appendData is only supported for pointCloud3d at a resolved series index (got ${(C == null ? void 0 : C.type) ?? "missing"} at ${b}). Modality-skipped series compact the resolved array — use the index after filtering. surface3d: use updateSurface3D or replace data.y via setOption.`
        );
        return;
      }
      const A = d.appendPointCloudData(b, B, {
        maxPoints: F == null ? void 0 : F.maxPoints
      });
      A && A.appended > 0 && g("dataAppend", {
        seriesIndex: b,
        count: A.appended,
        xExtent: A.xExtent
      });
    },
    resize: () => G(!0),
    dispose() {
      if (!l) {
        l = !0, x != null && (cancelAnimationFrame(x), x = null), d == null || d.dispose(), d = null, c && (c.destroy(), c = null), r.parentElement === e && e.removeChild(r);
        for (const b of Object.keys(f)) f[b].clear();
      }
    },
    on(b, B) {
      var F;
      (F = f[b]) == null || F.add(B);
    },
    off(b, B) {
      var F;
      (F = f[b]) == null || F.delete(B);
    },
    getInteractionX: () => null,
    setInteractionX() {
    },
    setCrosshairX() {
    },
    onInteractionXChange: () => () => {
    },
    getZoomRange: () => null,
    setZoomRange() {
    },
    getPerformanceMetrics: () => null,
    getPerformanceCapabilities: () => null,
    onPerformanceUpdate: () => () => {
    },
    hitTest(b) {
      const B = r.getBoundingClientRect(), F = b.clientX - B.left, C = b.clientY - B.top, A = (d == null ? void 0 : d.pick(F, C, 12)) ?? null;
      return {
        isInGrid: !0,
        canvasX: F,
        canvasY: C,
        gridX: F,
        gridY: C,
        match: Fr(A)
      };
    },
    getRenderMode: () => a,
    setRenderMode(b) {
      a = b, b === "auto" && p && N();
    },
    renderFrame() {
      return a !== "external" || !p ? !1 : (D(), !0);
    },
    needsRender: () => p,
    // 3D camera API (also attached below for typing)
    resetCamera() {
      d == null || d.resetCamera();
    },
    setCamera(b) {
      d == null || d.setCamera(b);
    },
    getCamera() {
      return (d == null ? void 0 : d.getCamera()) ?? null;
    },
    updateSurface3D(b, B) {
      if (l || !d) return;
      d.updateSurface3D(b, B);
      const F = h.series[b];
      F == null || F.type, N();
    }
  };
  try {
    G(!1);
    try {
      const b = m ?? void 0, B = n ? {
        device: n.device,
        adapter: n.adapter,
        ...b != null ? { devicePixelRatio: b } : {}
      } : b != null ? { devicePixelRatio: b } : void 0;
      c = await cn.create(r, B);
    } catch (b) {
      const B = b instanceof Error ? b.message : String(b);
      throw new Error(`ChartGPU: WebGPU is not available.
Reason: ${B}`);
    }
    return (z = c.device) == null || z.lost.then((b) => {
      y = !0, !l && (b.reason !== "destroyed" && console.warn("WebGPU device lost:", b), i && b.reason !== "destroyed" && g("deviceLost", { reason: b.reason, message: b.message }), U.dispose());
    }), G(!1), d = Ur(c, h, {
      onRequestRender: N,
      pipelineCache: n == null ? void 0 : n.pipelineCache,
      onPickEvent: (b, B) => {
        g(b, B);
      }
    }), a === "auto" && N(), o(U), U;
  } catch (b) {
    throw U.dispose(), b;
  }
}
function Fr(e) {
  return e ? e.kind === "pointCloud3d" ? {
    kind: "pointCloud3d",
    seriesIndex: e.seriesIndex,
    dataIndex: e.dataIndex,
    value: [e.x, e.y, e.z],
    valueChannel: e.value
  } : {
    kind: "surface3d",
    seriesIndex: e.seriesIndex,
    dataIndex: e.dataIndex,
    value: [e.x, e.y, e.z],
    i: e.i,
    j: e.j,
    height: e.height
  } : null;
}
export {
  Nr as createChartGPU3D
};
//# sourceMappingURL=createChartGPU3D-BcKKfBzM.js.map
