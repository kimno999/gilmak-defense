// 고급 도트 샘플 엔진 (32px).
// 도형마다 입체 법선을 계산해 왼쪽 위 빛으로 4~6단계 명암을 칠하고,
// 색에 맞춘 외곽선(밝은 쪽은 한 단계 밝게)을 자동으로 넣는다.

import { COMBO_ART } from './combo-art.js'; // 조합 드래곤 13종 전용 그림

const L = (() => { const v = [-0.55, -0.75, 0.62]; const m = Math.hypot(...v); return v.map((a) => a / m); })();

// 색 경로: 그림자는 보라 쪽, 밝은 쪽은 노랑 쪽으로 색상을 틀어 풍부하게
export const RAMPS = {
  red: ['#2a0a1e', '#561327', '#8c1d2c', '#c22f2e', '#e8553a', '#ff8a4c', '#ffc173'],
  belly: ['#5a2420', '#94452c', '#c97a3e', '#eeac5c', '#ffd68e', '#fff1c8'],
  wing: ['#2e0a22', '#55122e', '#86203a', '#b5363f', '#dc5a48', '#f5875a'],
  horn: ['#3a2a2a', '#6c5444', '#a68a68', '#d6bf94', '#f6e8c4', '#fffbea'],
  eggSpot: ['#3a0d1c', '#6a1828', '#9c2a30', '#c8463a'],
  straw: ['#3a2814', '#6e4c22', '#a37a36', '#d1a94e', '#f0d488'],
  shell: ['#6a5a50', '#a8968a', '#d8c8b8', '#f2e8dc', '#ffffff'],
  steel: ['#1e2430', '#3a4456', '#5f6c82', '#8e9bb0', '#c4cfde', '#f0f6ff'],
  tunic: ['#101a3a', '#1c2e66', '#2c4a98', '#3f6cc4', '#6a98e6', '#a8c8ff'],
  skin: ['#4a2420', '#8a4a38', '#c47c58', '#eaa880', '#ffd2b0'],
  leather: ['#20140e', '#3e2818', '#664226', '#8e6236', '#b88a52'],
  plume: ['#3a0812', '#7a1020', '#c01e2a', '#ee4a3a', '#ff8a6a'],
  stone: ['#1a1c26', '#30343f', '#4a505c', '#69707c', '#8d95a0', '#b6bcc4', '#dfe3e8'],
  moss: ['#1c3018', '#2e4f24', '#477430', '#6a9a3e', '#9cc456'],
  wood: ['#24140c', '#45291a', '#6c4428', '#95633a', '#c08a52'],
  cloth: ['#4a2a06', '#8a5410', '#c88a1c', '#f2b830', '#ffe07a', '#fff4c0'],
  wbone: ['#1e0816', '#3e0e22', '#661628', '#8c1d2c', '#b02a30'],
  magma: ['#5a1008', '#a8260c', '#ff5a10', '#ffa21c', '#ffe066', '#fffbd0'],
};

export class Sprite {
  constructor(w = 32, h = 32) {
    this.w = w; this.h = h;
    this.part = new Int16Array(w * h).fill(-1);
    this.val = new Float32Array(w * h);
    this.parts = [];
    this.over = new Map(); // 직접 찍는 색 (눈, 빛나는 점 등)
    this.glow = []; // 빛나는 점 [x, y, color, r]
  }
  addPart(ramp, opts = {}) { this.parts.push({ ramp: RAMPS[ramp] || ramp, ...opts }); return this.parts.length - 1; }
  set(x, y, p, v) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    this.part[i] = p; this.val[i] = v;
  }
  // 타원 (입체 구)
  ellipse(p, cx, cy, rx, ry, o = {}) {
    const bias = o.bias || 0, flat = o.flat || 0;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(Math.max(0, 1 - d));
      let v = nx * L[0] + ny * L[1] + nz * L[2];
      v = v * (1 - flat) + flat * 0.6;
      this.set(x, y, p, Math.max(0, Math.min(1, 0.18 + 0.82 * v + bias)));
    }
  }
  // 굵은 선 (원통)
  limb(p, x0, y0, x1, y1, r0, r1 = r0, o = {}) {
    const bias = o.bias || 0;
    const minx = Math.floor(Math.min(x0, x1) - Math.max(r0, r1) - 1), maxx = Math.ceil(Math.max(x0, x1) + Math.max(r0, r1) + 1);
    const miny = Math.floor(Math.min(y0, y1) - Math.max(r0, r1) - 1), maxy = Math.ceil(Math.max(y0, y1) + Math.max(r0, r1) + 1);
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1;
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const px = x + 0.5, py = y + 0.5;
      let t = ((px - x0) * dx + (py - y0) * dy) / len2; t = Math.max(0, Math.min(1, t));
      const qx = x0 + dx * t, qy = y0 + dy * t, r = r0 + (r1 - r0) * t;
      const ex = px - qx, ey = py - qy, d = Math.hypot(ex, ey);
      if (d > r) continue;
      const nx = ex / r, ny = ey / r, nz = Math.sqrt(Math.max(0, 1 - (nx * nx + ny * ny)));
      const v = nx * L[0] + ny * L[1] + nz * L[2];
      this.set(x, y, p, Math.max(0, Math.min(1, 0.2 + 0.8 * v + bias)));
    }
  }
  // 다각형 (평면 + 방향 그라데이션)
  poly(p, pts, o = {}) {
    const base = o.base ?? 0.55, g = o.grad || [0, 0];
    let minx = 99, maxx = -99, miny = 99, maxy = -99;
    for (const [x, y] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    for (let y = Math.floor(miny); y <= maxy; y++) for (let x = Math.floor(minx); x <= maxx; x++) {
      const px = x + 0.5, py = y + 0.5;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (!inside) continue;
      const v = base + (px - cx) * g[0] + (py - cy) * g[1];
      this.set(x, y, p, Math.max(0, Math.min(1, v)));
    }
  }
  dot(x, y, color) { this.over.set(Math.floor(y) * this.w + Math.floor(x), color); }
  light(x, y, color, r = 6) { this.glow.push([x, y, color, r]); }

  render() {
    const { w, h } = this;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const put = (i, hex, a = 255) => {
      const n = parseInt(hex.slice(1), 16);
      img.data[i * 4] = (n >> 16) & 255; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = a;
    };
    const tone = (i) => {
      const P = this.parts[this.part[i]];
      const r = P.ramp, n = r.length;
      let k = Math.round(this.val[i] * (n - 1));
      return [P, Math.max(0, Math.min(n - 1, k))];
    };
    for (let i = 0; i < w * h; i++) {
      if (this.part[i] < 0) continue;
      let [P, k] = tone(i);
      // 다른 부위와 맞닿은 경계는 한 단계 어둡게 (부위 구분선)
      if (P.rim !== false) {
        const x = i % w, y = (i / w) | 0;
        const nb = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        for (const [dx, dy] of nb) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = this.part[ny * w + nx];
          if (q >= 0 && q !== this.part[i] && this.parts[q].layer > P.layer) { k = Math.max(0, k - 1); break; }
        }
      }
      put(i, P.ramp[k]);
    }
    // 외곽선: 닿은 부위의 가장 어두운 색. 빛 쪽(왼쪽 위)은 한 단계 밝게
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (this.part[i] >= 0) continue;
      let best = -1, lightSide = false;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = this.part[ny * w + nx];
        if (q >= 0) { best = q; if (dx > 0 || dy > 0) lightSide = true; }
      }
      if (best >= 0) put(i, this.parts[best].ramp[lightSide && this.parts[best].ramp.length > 4 ? 1 : 0]);
    }
    for (const [i, col] of this.over) put(i, col);
    g.putImageData(img, 0, 0);
    c.glow = this.glow;
    return c;
  }
}

// ---------- 드래곤 (종류별 테마) ----------
// 테마: 색 경로와 특징. body·belly·wing·wbone·horn·spot 은 RAMPS 의 키 또는 색 배열
export const DRAGON_THEMES = {
  red: { body: 'red', belly: 'belly', wing: 'wing', wbone: 'wbone', horn: 'horn', spot: 'eggSpot', eye: '#ffd23a', glow: 'rgba(255,140,40,0.95)', crack: '#ffb34a', mark: ['#ffa21c', '#ffe066', '#ff5a10'] },
  blue: {
    body: ['#0a1430', '#12244c', '#1b3c78', '#2a5cac', '#3f84d4', '#6cb0ee', '#b4e0ff'],
    belly: ['#20405e', '#3e6c92', '#6ea2c6', '#a2d4ec', '#d6f2ff', '#ffffff'],
    wing: ['#0c1838', '#183060', '#264e90', '#3a74be', '#5c9ee2', '#90cbf8'],
    wbone: ['#06102a', '#0e2048', '#183466', '#224a88', '#2e62a8'],
    horn: ['#2e4a6a', '#5e8cb4', '#9ccaec', '#d2f0ff', '#f0fbff', '#ffffff'],
    spot: ['#0a1838', '#163464', '#22508e', '#3070b0'], eye: '#bff4ff', glow: 'rgba(120,210,255,0.95)', crack: '#bff4ff', mark: ['#8fd8ff', '#ffffff', '#4aa8ff'], spikes: 'ice',
  },
  green: {
    body: ['#0a2012', '#143c1c', '#1f5c28', '#2f8038', '#4aa446', '#76c85a', '#b4ea84'],
    belly: ['#3a4a18', '#62782a', '#90a63e', '#bcd25a', '#e0f08a', '#f8ffc8'],
    wing: ['#0c2414', '#18402a', '#24603a', '#348650', '#52aa64', '#82d07e'],
    wbone: ['#06140a', '#0e2614', '#163a1e', '#205028', '#2c6834'],
    horn: ['#2a1e12', '#4e3a22', '#7a5c36', '#a8864e', '#d2b070', '#f0daa0'],
    spot: ['#0c2a10', '#1c4a1e', '#2e6e2c', '#46943c'], eye: '#e8ff6a', glow: 'rgba(150,255,80,0.9)', crack: '#c8ff6a', mark: ['#7be04a', '#d8ff8a', '#3aa02a'], drip: true,
  },
  gold: {
    body: ['#361a06', '#64360a', '#985c10', '#cc8c1a', '#f0b834', '#ffdc72', '#fff4c4'],
    belly: ['#6a4416', '#a87a2a', '#dab048', '#f6d878', '#fff0b4', '#ffffff'],
    wing: ['#4a2808', '#7c4a0e', '#b07818', '#dca42a', '#f6cc52', '#ffe896'],
    wbone: ['#2a1404', '#462408', '#6a380c', '#8c5010', '#b06a16'],
    horn: ['#6a5a3a', '#a8946a', '#dccaa0', '#f6ead0', '#fffaf0', '#ffffff'],
    spot: ['#5a3008', '#8a5410', '#ba7e1a', '#e2a42a'], eye: '#ffffff', glow: 'rgba(255,220,100,0.95)', crack: '#fff4a0', mark: ['#ffe066', '#ffffff', '#ffb01a'], crown: true,
  },
  silver: {
    body: ['#161a24', '#2e3646', '#4e5a72', '#7884a0', '#a2aec6', '#ccd6e8', '#f4f8ff'],
    belly: ['#3a4250', '#626e80', '#8e9aae', '#b8c4d6', '#e0e8f4', '#ffffff'],
    wing: ['#1e2430', '#363e50', '#566276', '#7e8aa2', '#a8b4cc', '#d2dcee'],
    wbone: ['#0e1018', '#1c2230', '#2c3446', '#3e485e', '#525e78'],
    horn: ['#1e222c', '#3a404e', '#5c6476', '#868ea2', '#b4bccc', '#e6ecf6'],
    spot: ['#262c3a', '#404a5e', '#5e6a82', '#8290a8'], eye: '#9ff0ff', glow: 'rgba(200,230,255,0.9)', crack: '#e0f4ff', mark: ['#ffffff', '#cfe8ff', '#8ab0d8'], plates: true,
  },
  shadow: {
    body: ['#08040e', '#140a24', '#22103a', '#341c56', '#4c2c7c', '#6c48a8', '#9672d2'],
    belly: ['#1a0e2a', '#2e1a46', '#4a2c6c', '#6c4696', '#9670c2', '#c4a6ec'],
    wing: ['#06020c', '#10061c', '#1c0c30', '#2c1648', '#422466', '#5e388c'],
    wbone: ['#020006', '#08020e', '#10061a', '#1a0c28', '#261438'],
    horn: ['#1a1222', '#342642', '#54426a', '#7c6896', '#a896c4', '#d6c8f0'],
    spot: ['#120822', '#24123e', '#3a205e', '#563484'], eye: '#ff6af0', glow: 'rgba(190,110,255,0.95)', crack: '#e0a0ff', mark: ['#c07cff', '#ff8af0', '#7a3ad0'], wisps: true,
  },
  black: {
    body: ['#040406', '#0c0c10', '#16161c', '#24242c', '#363642', '#4e4e5c', '#6e6e7e'],
    belly: ['#1a0808', '#341010', '#521a1a', '#722828', '#963c38', '#c06454'],
    wing: ['#060608', '#0e0e12', '#18181e', '#26262e', '#363642', '#4c4c5a'],
    wbone: ['#020203', '#060608', '#0c0c10', '#141418', '#1e1e24'],
    horn: ['#2a2420', '#4c423a', '#766a5c', '#a49682', '#d0c4ae', '#f4ecdc'],
    spot: ['#0a0a0e', '#18181e', '#2a2a32', '#3e3e4a'], eye: '#ff3a3a', glow: 'rgba(255,60,60,0.9)', crack: '#ff6a5a', mark: ['#ff3a3a', '#ff9a6a', '#a01414'], spikes: 'bone',
  },
  pixie: {
    body: ['#360c28', '#641846', '#9a2a6a', '#cc4494', '#ee6cba', '#ff9cd6', '#ffd6f0'],
    belly: ['#5a3050', '#906086', '#c496bc', '#ead0e6', '#fff0fa', '#ffffff'],
    wing: ['#123c4a', '#22647a', '#3c94aa', '#64c0d4', '#9ae4f0', '#d8fbff'],
    wbone: ['#0a2a34', '#144450', '#20606e', '#2e7e8e', '#3c9cae'],
    horn: ['#5a4a2a', '#9a8450', '#d6c27e', '#f6e6aa', '#fff8dc', '#ffffff'],
    spot: ['#5a1a46', '#8a2c6c', '#bc4a96', '#e06cb6'], eye: '#ffffff', glow: 'rgba(255,150,230,0.9)', crack: '#ffd6f0', mark: ['#ff8ad8', '#ffffff', '#9ff0ff'], butterfly: true,
  },
};

const rampOf = (r) => (typeof r === 'string' ? RAMPS[r] : r);

export function redDragon(grade, f = 0) { return dragonArt(DRAGON_THEMES.red, grade, f); }
export function dragon(type, grade, f = 0) { return dragonArt(DRAGON_THEMES[type], grade, f); }

export function dragonArt(th, grade, f = 0, extra = {}) {
  const s = new Sprite(32, 32);
  const flap = [0, 1, 2, 1][f % 4];
  const br = [0, 0.3, 0.5, 0.3][f % 4];
  const B = rampOf(th.body), BL = rampOf(th.belly), WG = rampOf(th.wing), WBR = rampOf(th.wbone), HR = rampOf(th.horn);
  const BODY = s.addPart(B, { layer: 2 });
  const BELLY = s.addPart(BL, { layer: 3 });
  const WING = s.addPart(WG, { layer: 1 });
  const WINGF = s.addPart(WG, { layer: 4 });
  const BACK = s.addPart(extra.backRamp || B, { layer: 0 });
  const HORN = s.addPart(HR, { layer: 5 });
  const HEAD = s.addPart(B, { layer: 4 });
  const SNOUT = s.addPart(B, { layer: 5 });
  const CLAW = s.addPart(HR, { layer: 6 });
  const eye = (x, y, big) => {
    s.dot(x, y, '#fff7c8'); s.dot(x + 1, y, th.eye);
    if (big) { s.dot(x, y + 1, th.eye); s.dot(x + 1, y + 1, '#1a0a10'); s.dot(x, y - 1, '#ffffff'); }
    else s.dot(x + 1, y, '#1a0a10');
    if (th.wisps || th.spikes === 'bone') s.light(x + 1, y, th.glow, 2);
  };
  const dark = B[0], belly2 = BL[2], belly3 = BL[3];
  // 나비 날개 (픽시): 박쥐 날개 대신 둥근 두 장
  const butterfly = (cx, cy, sc, layerPart) => {
    s.ellipse(layerPart, cx - 4 * sc, cy - 4 * sc - flap, 5 * sc, 4.2 * sc, { flat: 0.35, bias: 0.1 });
    s.ellipse(layerPart, cx - 3 * sc, cy + 1 * sc - flap * 0.5, 3.6 * sc, 3 * sc, { flat: 0.35 });
  };

  if (grade === 0) {
    // 둥지 위의 알: 반점, 금, 윤기
    const STRAW = s.addPart('straw', { layer: 0 });
    const EGG = s.addPart(B, { layer: 2 });
    const SPOT = s.addPart(rampOf(th.spot), { layer: 3 });
    for (let k = 0; k < 9; k++) s.limb(STRAW, 5 + k * 2.6, 27 + (k % 2), 8 + k * 2.4, 25 + ((k + 1) % 3), 1.1);
    s.ellipse(STRAW, 16, 27.5, 11, 3, { flat: 0.3 });
    s.ellipse(EGG, 16, 16.5 - br * 0.5, 7.5, 10.2);
    for (const [x, y, r] of [[13, 12, 1.6], [18.5, 15, 1.3], [14, 20, 1.9], [19, 21.5, 1.2], [16.5, 9, 1]]) s.ellipse(SPOT, x, y, r, r * 0.8, { flat: 0.4 });
    // 갈라진 금 (안쪽 빛)
    for (const [x, y] of [[17, 7], [18, 8], [17, 9], [18, 10]]) s.dot(x, y, th.crack);
    s.light(17.5, 9, th.glow, 5);
    s.dot(12, 9, '#fff1d8'); s.dot(12, 10, '#ffd0a0'); s.dot(13, 8, '#ffd0a0');
    for (const [x, y] of [[9, 26], [22, 26], [25, 27]]) s.dot(x, y, '#f0d488');
    return s.render();
  }

  if (grade === 1) {
    // 껍질에서 막 나온 해츨링
    const SHELL = s.addPart('shell', { layer: 6 });
    const CAP = s.addPart('shell', { layer: 7 });
    s.ellipse(BODY, 15, 21 - br, 6.5, 5.5);
    s.ellipse(BELLY, 17.5, 22 - br, 3.5, 4);
    s.limb(BODY, 10, 22, 5, 24, 1.8, 1);
    if (th.butterfly) butterfly(11, 16, 0.7, WING);
    else s.poly(WING, [[11, 16], [6, 11 - flap], [8, 15], [10, 18]], { base: 0.55, grad: [0.05, 0.05] });
    s.ellipse(HEAD, 19, 12 - br, 6.2, 5.6);
    s.ellipse(SNOUT, 24, 14 - br, 3.4, 2.6);
    s.limb(HORN, 16, 7.5, 14.5, 5.5, 1.1, 0.5);
    s.limb(HORN, 20, 7, 20.5, 5, 1, 0.5);
    eye(20, 11 - br, true);
    s.dot(26, 13 - br, dark);
    s.dot(23, 16 - br, B[1]); s.dot(24, 16 - br, B[1]);
    s.poly(SHELL, [[7, 23], [25, 23], [24, 28], [20, 30], [12, 30], [8, 28]], { base: 0.55, grad: [-0.02, -0.04] });
    for (const [x, y] of [[9, 22], [12, 21], [15, 22], [18, 21], [21, 22], [24, 21]]) s.set(x, y, SHELL, 0.85);
    s.poly(CAP, [[14, 7], [17, 4], [22, 5], [24, 8], [21, 7], [18, 8]], { base: 0.7, grad: [0, -0.05] });
    return s.render();
  }

  if (grade === 2) {
    // 어린 비룡: 네 발, 작은 날개
    if (th.butterfly) butterfly(13, 15, 0.9, WING);
    else s.poly(BACK, [[12, 15], [5, 4 - flap], [8, 9 - flap], [10, 6 - flap], [12, 11], [14, 9 - flap], [15, 15]], { base: 0.3, grad: [0.02, 0.03] });
    s.limb(BODY, 8, 22, 4, 25, 2.4, 1.6); s.limb(BODY, 4, 25, 1.5, 24, 1.6, 0.8);
    s.ellipse(BODY, 14, 20 - br, 7.5, 5.2);
    s.ellipse(BELLY, 16, 22.5 - br, 5, 2.6, { bias: 0.05 });
    s.limb(BODY, 10, 23, 9, 28, 1.8, 1.5); s.limb(BODY, 18, 23, 19, 28, 1.9, 1.5);
    s.limb(BODY, 19, 18, 22, 12, 2.6, 2.2);
    s.ellipse(HEAD, 23.5, 10 - br, 4.6, 3.8);
    s.ellipse(SNOUT, 27.5, 11.5 - br, 3, 2.1);
    s.limb(HORN, 21.5, 7, 19, 4.5, 1, 0.4); s.limb(HORN, 23.5, 6.5, 22.5, 3.5, 1, 0.4);
    if (th.butterfly) butterfly(16, 16, 0.9, WINGF);
    else {
      s.poly(WINGF, [[14, 17], [9, 6 - flap], [11, 10 - flap], [13, 7 - flap], [15, 12], [17, 9 - flap], [18, 17]], { base: 0.6, grad: [0.03, 0.03] });
      const WB = s.addPart(WBR, { layer: 6, rim: false });
      for (const [x0, y0] of [[9, 6 - flap], [13, 7 - flap], [17, 9 - flap]]) s.limb(WB, x0, y0, 15, 16, 0.45);
    }
    s.limb(CLAW, 9, 28.5, 10.5, 28.5, 0.7); s.limb(CLAW, 19, 28.5, 20.5, 28.5, 0.7);
    eye(24, 9 - br);
    s.dot(29, 11 - br, dark);
    for (let x = 12; x <= 19; x += 2) s.dot(x, 24 - br, belly2);
    features(s, th, 2, br, HORN);
    return s.render();
  }

  // 3 성체 드래곤, 4 고위 드래곤
  const big = grade === 4;
  const wy = flap * 1.5;
  const ctx = { s, br, flap, big, B, BODY, HEAD, HORN, WING, WINGF, BACK, th };
  if (extra.pre) extra.pre(ctx);
  // 뒤쪽 날개
  if (extra.wings === false) { /* 날개 없음 */ }
  else if (th.butterfly) butterfly(13, 13, big ? 1.35 : 1.15, WING);
  else s.poly(BACK, big
    ? [[11, 14], [1, 2 - wy], [5, 5 - wy], [6, 1 - wy], [10, 5 - wy], [12, 0 - wy], [15, 7], [16, 14]]
    : [[12, 15], [3, 3 - wy], [7, 7 - wy], [9, 3 - wy], [12, 8 - wy], [15, 5 - wy], [16, 15]], { base: 0.28, grad: [0.02, 0.03] });
  // 꼬리
  s.limb(BODY, 7, 22, 3, 25, big ? 3 : 2.6, 2); s.limb(BODY, 3, 25, 1, 21, 2, 1.2);
  s.poly(HORN, [[0, 21], [2, 17], [3, 21]], { base: 0.6 });
  // 몸통
  s.ellipse(BODY, 14, 19.5 - br, big ? 9 : 8, big ? 6.4 : 5.8);
  s.ellipse(BELLY, 16.5, 22 - br, big ? 6 : 5.2, 3, { bias: 0.05 });
  // 다리
  s.limb(BODY, 9, 22, 8, 28.5, 2.4, 1.8); s.limb(BODY, 19, 22, 20.5, 28.5, 2.6, 1.9);
  s.limb(CLAW, 7, 29.5, 10, 29.5, 0.8); s.limb(CLAW, 19.5, 29.5, 22.5, 29.5, 0.8);
  // 목과 머리
  s.limb(BODY, 19, 17, 23, 9, 3, 2.4);
  s.ellipse(HEAD, 24.5, 7.5 - br, 4.8, 3.9);
  s.ellipse(SNOUT, 28.5, 9 - br, 3.3, 2.3);
  s.limb(HORN, 22, 4.5, 18, 1, 1.2, 0.4); s.limb(HORN, 24.5, 4, 23, 0.3, 1.1, 0.4);
  if (big) { s.limb(HORN, 21, 6, 17, 4.5, 0.9, 0.3); s.limb(HORN, 26, 4.5, 26.5, 1.5, 0.8, 0.3); }
  // 앞쪽 날개 (뼈대 + 막, 막 끝은 물결 모양)
  const tips = big ? [[4, 0 - wy], [9, -2 - wy], [15, 0 - wy], [21, 6 - wy * 0.5]] : [[6, 2 - wy], [11, 1 - wy], [16, 4 - wy]];
  const root = [15, 15];
  const mem = [root];
  tips.forEach(([x, y], k) => {
    mem.push([x, y]);
    if (k < tips.length - 1) { const [nx, ny] = tips[k + 1]; mem.push([(x * 2 + nx) / 3 + 1, (y * 2 + ny) / 3 + 5]); mem.push([(x + nx * 2) / 3 + 1, (y + ny * 2) / 3 + 4]); }
  });
  mem.push([20, 16]);
  if (extra.wings === false) { /* 날개 없음 */ }
  else if (th.butterfly) {
    butterfly(17, 14, big ? 1.35 : 1.15, WINGF);
    for (const [x, y] of [[11, 7 - flap], [14, 5 - flap], [12, 12 - flap]]) { s.dot(x, y, '#ffffff'); s.dot(x + 1, y, th.mark[0]); }
  } else {
    s.poly(WINGF, mem, { base: 0.66, grad: [0.03, 0.035] });
    const WB = s.addPart(WBR, { layer: 6, rim: false });
    s.limb(WB, root[0], root[1], tips[0][0], tips[0][1], 0.7, 0.35);
    for (const [x, y] of tips.slice(1)) s.limb(WB, root[0], root[1], x, y, 0.5, 0.3);
    s.ellipse(WB, root[0], root[1], 1.3, 1.1);
  }
  // 배 비늘 줄
  for (let x = 12; x <= 20; x += 2) { s.dot(x, 23 - br, belly2); s.dot(x + 1, 21 - br, belly3); }
  // 등 가시
  for (const [x, y] of [[10, 13.5], [13, 12.8], [16, 13]]) s.poly(HORN, [[x - 1, y + 1], [x, y - 1.8], [x + 1, y + 1]], { base: 0.65 });
  eye(25, 6.5 - br);
  s.dot(31, 8.5 - br, dark);
  // 입가 이빨
  s.dot(28, 11 - br, '#fff6e0'); s.dot(30, 11 - br, '#fff6e0');
  features(s, th, grade, br, HORN);
  const mk = extra.mark || th.mark;
  if (big || extra.mark) {
    // 가슴의 빛나는 문양
    for (const [x, y, k] of [[21, 18, 0], [22, 19, 1], [21, 20, 2], [22, 21, 0], [20, 19, 2]]) s.dot(x, y - br, mk[k]);
    s.light(21.5, 19.5, extra.glow || th.glow, big ? 7 : 5);
  }
  if (big) {
    s.light(31, 9, extra.glow || th.glow, 3.5);
    for (const [x, y] of [[20.5, 4], [22, 2.5], [24, 2.5]]) s.dot(x, y, '#ffe066');
    s.dot(23, 3, '#fff6c4');
  }
  if (extra.crown) {
    for (const [x, y] of [[21, 2], [23, 0], [25, 1], [22, 3], [24, 3]]) s.dot(x, y, '#ffe066');
    s.dot(23, 1, '#fff6c4'); s.dot(23, 2, '#ff5a8a');
    s.light(23, 2, 'rgba(255,230,120,0.9)', 4);
  }
  if (extra.post) extra.post(ctx);
  return s.render();
}

// 종류별 특징 덧그리기
function features(s, th, grade, br, HORN) {
  if (grade < 2) return;
  const y0 = grade === 2 ? 15 : 12.8;
  if (th.spikes === 'ice') {
    for (const [x, y, h] of [[9, y0 + 1, 3], [12, y0, 3.6], [15, y0 + 0.4, 3]]) s.poly(HORN, [[x - 1.2, y + 1 - br], [x, y - h - br], [x + 1.2, y + 1 - br]], { base: 0.75, grad: [-0.06, -0.02] });
  } else if (th.spikes === 'bone') {
    for (const [x, y, h] of [[8, y0 + 1.5, 2.6], [10.5, y0 + 0.5, 3], [13, y0, 3.2], [15.5, y0 + 0.3, 3], [18, y0 + 1, 2.6]]) s.poly(HORN, [[x - 0.9, y + 1 - br], [x, y - h - br], [x + 0.9, y + 1 - br]], { base: 0.6 });
  }
  if (th.drip) for (const [x, y] of [[29, 13], [29, 14], [28, 15]]) s.dot(x, y - br - (grade === 2 ? -2 : 0), '#b6ff5a');
  if (th.plates) for (let x = 9; x <= 18; x += 3) { s.dot(x, 16 - br, '#f4f8ff'); s.dot(x + 1, 17 - br, '#ccd6e8'); }
  if (th.wisps) for (const [x, y] of [[6, 18], [4, 15], [26, 14]]) { s.dot(x, y - br, '#9672d2'); s.light(x, y, 'rgba(160,100,255,0.6)', 2.5); }
  if (th.crown) for (const [x, y] of [[21, 3], [23, 1.5], [25, 2.5]]) s.dot(x, y - br, '#fff6c4');
}

// ---------- 인간 병사 (걷기 4프레임) ----------
export function soldier(f = 0) {
  const s = new Sprite(32, 32);
  const step = [0, 1, 0, -1][f % 4];
  const bob = f % 2 ? -0.5 : 0;
  const LEG_B = s.addPart('leather', { layer: 0 });
  const LEG_F = s.addPart('leather', { layer: 3 });
  const ARM_B = s.addPart('tunic', { layer: 0 });
  const BODY = s.addPart('tunic', { layer: 1 });
  const BELT = s.addPart('leather', { layer: 2 });
  const HEAD = s.addPart('skin', { layer: 3 });
  const HELM = s.addPart('steel', { layer: 4 });
  const PLUME = s.addPart('plume', { layer: 5 });
  const ARM_F = s.addPart('tunic', { layer: 5 });
  const SPEAR = s.addPart('wood', { layer: 6 });
  const TIP = s.addPart('steel', { layer: 7 });
  const SHIELD = s.addPart('steel', { layer: 6 });
  s.limb(LEG_B, 14, 22, 14 - step * 2, 28.5, 1.6, 1.4);
  s.limb(ARM_B, 12, 15 + bob, 10 + step, 21 + bob, 1.4, 1.2);
  s.ellipse(BODY, 15.5, 18 + bob, 4.6, 5.4);
  s.limb(BELT, 11.5, 21 + bob, 19.5, 21 + bob, 0.9);
  s.dot(15, 21 + bob, '#ffd23a');
  s.limb(LEG_F, 17, 22, 17 + step * 2, 28.5, 1.7, 1.5);
  s.ellipse(LEG_F, 17.5 + step * 2, 29.3, 2.2, 1, { flat: 0.3 });
  s.ellipse(LEG_B, 14.5 - step * 2, 29.3, 2, 1, { flat: 0.3 });
  s.ellipse(HEAD, 16, 9.5 + bob, 3.6, 3.8, { bias: 0.22 });
  s.ellipse(HELM, 16, 8 + bob, 4.2, 3.4);
  s.poly(HELM, [[12, 9 + bob], [20.5, 9 + bob], [20.5, 10.5 + bob], [12, 10.5 + bob]], { base: 0.4 });
  s.limb(PLUME, 15, 4.5 + bob, 11, 6 + bob, 1.4, 0.8);
  s.dot(18, 11 + bob, '#1a1018'); s.dot(17, 12 + bob, '#c47c58');
  s.limb(SPEAR, 22 + step * 0.5, 4, 21 + step * 0.5, 28, 0.6);
  s.poly(TIP, [[21 + step * 0.5, 4], [22.5 + step * 0.5, 0], [24 + step * 0.5, 4]], { base: 0.75, grad: [-0.05, -0.05] });
  s.limb(ARM_F, 18, 15 + bob, 21 + step * 0.5, 18 + bob, 1.5, 1.3);
  s.ellipse(SHIELD, 11.5, 18 + bob, 3, 4.2);
  s.dot(11, 17 + bob, '#ffd23a'); s.dot(11, 18 + bob, '#ffd23a');
  return s.render();
}

// ---------- 지형 ----------
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sm = (t) => t * t * (3 - 2 * t);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * sm(xf) + (c - a) * sm(yf) + (a - b - c + d) * sm(xf) * sm(yf);
}
const GRASS = ['#1f3a22', '#2b4f2a', '#3a6834', '#4f843e', '#69a04a', '#8cbc5a'];
const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// 지형 전체를 한 번에 그린다. grid: 0 풀, 2 물
export function drawTerrain(g, grid, cols, rows, seed = 7) {
  const W = cols * 32, H = rows * 32;
  const img = g.createImageData(W, H);
  const isW = (tx, ty) => tx >= 0 && ty >= 0 && tx < cols && ty < rows && grid[ty * cols + tx] === 2;
  // 물까지의 거리 (부드러운 물가)
  const wd = (px, py) => {
    let best = 99;
    const tx = Math.floor(px / 32), ty = Math.floor(py / 32);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = tx + dx, ny = ty + dy;
      if (!isW(nx, ny)) continue;
      const cx = Math.max(nx * 32 + 4, Math.min(nx * 32 + 28, px)), cy = Math.max(ny * 32 + 4, Math.min(ny * 32 + 28, py));
      best = Math.min(best, Math.hypot(px - cx, py - cy) - 4);
    }
    return best;
  };
  const WATER = ['#0e2a4a', '#123c66', '#18517f', '#22699a', '#3a8ab4', '#6cb4d4', '#bfe8f4'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = vnoise(x / 9, y / 9, seed) * 0.6 + vnoise(x / 3.5, y / 3.5, seed + 1) * 0.4;
    const d = wd(x + 0.5, y + 0.5);
    let col;
    if (d < 0) {
      const depth = Math.min(1, -d / 10);
      const k = Math.round((1 - depth) * 3 + n * 1.2);
      col = WATER[Math.max(0, Math.min(4, k))];
    } else if (d < 1.2) col = '#d8f2f8';
    else if (d < 3) col = n > 0.5 ? '#8a7a54' : '#6e6040';
    else {
      let k = Math.floor(1.5 + n * 3.2);
      if (hash2(x, y, seed + 3) > 0.985) k = 5;
      col = GRASS[Math.max(0, Math.min(5, k))];
    }
    const [r, gg, b] = hexToRgb(col);
    const i = (y * W + x) * 4;
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // 풀잎 다발, 꽃, 자갈
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
    if (isW(tx, ty)) continue;
    for (let k = 0; k < 7; k++) {
      const x = tx * 32 + Math.floor(hash2(tx * 13 + k, ty, seed) * 30) + 1, y = ty * 32 + Math.floor(hash2(tx, ty * 7 + k, seed) * 28) + 3;
      if (wd(x, y) < 4) continue;
      g.fillStyle = '#2b4f2a'; g.fillRect(x, y, 1, 3); g.fillRect(x + 2, y + 1, 1, 2);
      g.fillStyle = '#69a04a'; g.fillRect(x + 1, y - 1, 1, 3);
      g.fillStyle = '#9fd06a'; g.fillRect(x + 1, y - 1, 1, 1);
    }
    const r = hash2(tx, ty, seed + 9);
    if (r > 0.55) {
      const x = tx * 32 + 6 + Math.floor(r * 18), y = ty * 32 + 8 + Math.floor(hash2(ty, tx, seed) * 16);
      const pc = r > 0.8 ? ['#fff6e0', '#ffd23a'] : ['#ff9ac8', '#fff1a0'];
      if (wd(x, y) > 4) {
        g.fillStyle = '#2b4f2a'; g.fillRect(x, y + 2, 1, 2);
        g.fillStyle = pc[0]; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
        g.fillStyle = pc[1]; g.fillRect(x, y, 1, 1);
      }
    }
    if (hash2(tx + 5, ty + 3, seed) > 0.7) {
      const x = tx * 32 + 4 + Math.floor(hash2(tx, ty, 99) * 22), y = ty * 32 + 20 + Math.floor(hash2(ty, tx, 98) * 8);
      if (wd(x, y) > 4) { g.fillStyle = '#4a505c'; g.fillRect(x, y + 1, 3, 1); g.fillStyle = '#8d95a0'; g.fillRect(x, y, 2, 1); g.fillStyle = '#b6bcc4'; g.fillRect(x, y, 1, 1); }
    }
  }
}

// 물 반짝임 (프레임마다)
export function waterSparkles(g, grid, cols, rows, t) {
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
    if (grid[ty * cols + tx] !== 2) continue;
    for (let k = 0; k < 3; k++) {
      const ph = (t * 0.6 + hash2(tx, ty, k) * 10) % 3;
      if (ph > 1.2) continue;
      const x = tx * 32 + 6 + Math.floor(hash2(tx, ty, k + 5) * 20), y = ty * 32 + 6 + Math.floor(hash2(ty, tx, k + 6) * 20);
      g.fillStyle = ph < 0.4 ? '#bfe8f4' : '#6cb4d4';
      g.fillRect(x, y, ph < 0.4 ? 3 : 2, 1);
      if (ph < 0.25) { g.fillStyle = '#ffffff'; g.fillRect(x + 1, y, 1, 1); }
    }
  }
}

// 입체 돌 블록: 윗면은 밝게, 앞면은 벽돌 무늬, 모서리에 이끼
export function stoneBlock(variant = 0) {
  const s = new Sprite(32, 32);
  const FRONT = s.addPart('stone', { layer: 1, rim: false });
  const TOP = s.addPart('stone', { layer: 2, rim: false });
  const MOSS = s.addPart('moss', { layer: 3, rim: false });
  s.poly(FRONT, [[2, 12], [30, 12], [30, 30], [2, 30]], { base: 0.35, grad: [-0.006, -0.01] });
  s.poly(TOP, [[2, 3], [30, 3], [30, 12], [2, 12]], { base: 0.66, grad: [-0.012, -0.012] });
  const c = s.render();
  const g = c.getContext('2d');
  g.fillStyle = '#30343f';
  for (const y of [18, 24]) g.fillRect(3, y, 27, 1);
  for (const [x, y0] of [[10, 12], [22, 12], [6, 18], [16, 18], [26, 18], [11, 24], [21, 24]]) g.fillRect(x, y0 + 1, 1, 5);
  g.fillStyle = '#8d95a0';
  for (const y of [19, 25]) g.fillRect(3, y, 27, 1);
  for (let k = 0; k < 40; k++) { const x = 3 + ((k * 37) % 26), y = 4 + ((k * 53) % 25); g.fillStyle = y < 12 ? '#8d95a0' : '#3a3f4a'; g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#dfe3e8'; g.fillRect(3, 4, 26, 1); g.fillRect(3, 4, 1, 7);
  g.fillStyle = '#4a505c'; g.fillRect(3, 11, 27, 1);
  // 이끼
  const mossPx = variant ? [[3, 12], [4, 12], [5, 13], [4, 13], [27, 12], [28, 13], [28, 12], [26, 12], [3, 14]] : [[24, 12], [25, 12], [26, 13], [25, 13], [3, 12], [4, 13]];
  for (const [x, y] of mossPx) { g.fillStyle = (x + y) % 2 ? '#6a9a3e' : '#477430'; g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#9cc456'; g.fillRect(mossPx[0][0], mossPx[0][1], 1, 1);
  return c;
}

// 펄럭이는 깃발
export function flag(n, f = 0) {
  const s = new Sprite(32, 32);
  const POLE = s.addPart('wood', { layer: 1 });
  const CL = s.addPart('cloth', { layer: 2 });
  const KNOB = s.addPart('cloth', { layer: 3 });
  s.limb(POLE, 9, 3, 9, 29, 1.1);
  s.ellipse(KNOB, 9, 3, 1.6, 1.6);
  const wv = (x) => Math.sin(x * 0.45 + f * 1.4) * 1.3;
  const top = [], bot = [];
  for (let x = 10; x <= 27; x++) { top.push([x, 5 + wv(x) + (x - 10) * 0.05]); bot.push([x, 16 + wv(x) - (x - 10) * 0.12]); }
  s.poly(CL, [...top, ...bot.reverse()], { base: 0.62, grad: [0.012, 0.01] });
  s.ellipse(POLE, 9, 29.5, 3, 1, { flat: 0.4 });
  const c = s.render();
  const g = c.getContext('2d');
  // 숫자
  const D = { 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'] }[n];
  const ox = 17, oy = 8 + Math.round(wv(18));
  for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (D[r][k] === '1') { g.fillStyle = '#4a2a06'; g.fillRect(ox + k, oy + r, 1, 1); }
  return c;
}

// ---------- 드래곤의 정수 (v0.6): 지으면 랜덤 드래곤이 나오는 빛나는 수정 ----------
export function essence(f = 0) {
  const s = new Sprite(32, 32);
  const fl = [0, -0.5, -1, -0.5][f % 4];
  const RUNE = s.addPart(['#1a1030', '#2e1c52', '#46307a', '#6448a6', '#8a6ad0'], { layer: 0 });
  const CRY = s.addPart(['#2a0e4a', '#4a1c7a', '#7a34b0', '#ae5ad8', '#da8cf2', '#f6c8ff', '#ffffff'], { layer: 2 });
  const CORE = s.addPart(['#7a3a10', '#c06a14', '#f0a42a', '#ffd25a', '#fff0a8', '#ffffff'], { layer: 3 });
  // 바닥의 마법진
  s.ellipse(RUNE, 16, 28, 10, 2.6, { flat: 0.7, bias: -0.1 });
  for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2 + f * 0.4; s.dot(16 + Math.cos(t) * 8.5, 28 + Math.sin(t) * 2, a % 2 ? '#c8a8ff' : '#ffe066'); }
  // 위아래로 뾰족한 수정
  s.poly(CRY, [[16, 4 + fl], [22, 13 + fl], [19.5, 22 + fl], [16, 25 + fl], [12.5, 22 + fl], [10, 13 + fl]], { base: 0.6, grad: [-0.05, -0.02] });
  s.poly(CRY, [[16, 4 + fl], [19, 13 + fl], [16, 24 + fl], [13, 13 + fl]], { base: 0.82, grad: [-0.04, -0.02] });
  // 안쪽의 금빛 핵
  s.ellipse(CORE, 16, 14 + fl, 2.6, 3.4, { bias: 0.15 });
  s.dot(15, 12 + fl, '#ffffff');
  s.light(16, 14 + fl, 'rgba(255,220,120,0.95)', 6);
  s.light(16, 14 + fl, 'rgba(200,140,255,0.7)', 10);
  // 주위를 도는 작은 빛
  for (let k = 0; k < 3; k++) { const t = f * 0.8 + k * 2.1; const x = 16 + Math.cos(t) * 9, y = 15 + Math.sin(t) * 4 + fl; s.dot(x, y, k === 1 ? '#ffe066' : '#e8d0ff'); s.light(x, y, 'rgba(230,200,255,0.7)', 1.6); }
  return s.render();
}

// ---------- 조합 드래곤 ----------
const ELEM_GLOW = {
  fire: ['rgba(255,140,40,0.95)', ['#ffa21c', '#ffe066', '#ff5a10']],
  ice: ['rgba(140,220,255,0.95)', ['#8fd8ff', '#ffffff', '#4aa8ff']],
  poison: ['rgba(150,255,80,0.9)', ['#7be04a', '#d8ff8a', '#3aa02a']],
  dark: ['rgba(190,110,255,0.95)', ['#c07cff', '#ff8af0', '#7a3ad0']],
  light: ['rgba(255,230,120,0.95)', ['#ffe066', '#ffffff', '#ffb01a']],
  phys: ['rgba(220,230,255,0.85)', ['#ffffff', '#cfe8ff', '#8ab0d8']],
};

// combo: data.js 의 COMBOS 항목
export function comboArt(combo, up = 0, f = 0) {
  if (COMBO_ART[combo.id]) return COMBO_ART[combo.id](up, f);
  if (combo.id === 'sealedRed') {
    const th = DRAGON_THEMES.red;
    if (up === 0) {
      const c = dragonArt(th, 1, f);
      const g = c.getContext('2d');
      // 쉐도우의 봉인 사슬
      for (let x = 4; x < 28; x += 2) { g.fillStyle = (x / 2) % 2 ? '#b07cff' : '#5e388c'; g.fillRect(x, 19 + ((x / 2) % 2), 2, 1); }
      g.fillStyle = '#2e1a4a'; g.fillRect(14, 18, 4, 4);
      g.fillStyle = '#c07cff'; g.fillRect(15, 19, 2, 2);
      c.glow = [...(c.glow || []), [16, 20, 'rgba(255,120,40,0.85)', 6], [16, 20, 'rgba(170,100,255,0.6)', 3]];
      return c;
    }
    return dragonArt(th, up === 1 ? 3 : 4, f, up === 2 ? { crown: true, glow: 'rgba(255,170,60,1)' } : {});
  }
  const [m1, m2, m3] = combo.recipe.map(([, k]) => DRAGON_THEMES[k]);
  const [glow, mark] = ELEM_GLOW[combo.elem];
  const th = {
    body: m1.body, belly: m3.belly, wing: m2.wing, wbone: m2.wbone, horn: m1.horn, spot: m1.spot,
    eye: mark[1], glow, crack: mark[0], mark, butterfly: m1.butterfly,
    spikes: m1.spikes || m2.spikes, wisps: m1.wisps || m2.wisps, drip: m1.drip, plates: m1.plates,
  };
  return dragonArt(th, combo.tier === 0 ? 3 : 4, f, { mark, glow, crown: up > 0 });
}

// ---------- 몬스터 ----------
RAMPS.demonSkin = ['#1e0406', '#460a0c', '#7a1610', '#b0281a', '#de4a30', '#ff8458'];
RAMPS.demonCloth = ['#0c0408', '#1c0a12', '#30121e', '#4a1c2c', '#682a3c', '#8e3e50'];
RAMPS.iron = ['#0a080c', '#18141c', '#2a2430', '#3e3646', '#56505e', '#76707e'];
RAMPS.ember = ['#3a0a04', '#7a1a06', '#c0360a', '#ff6a1a', '#ffaa3a', '#ffe07a'];
RAMPS.fairySkin = ['#16301c', '#2a5232', '#46784a', '#6ea66c', '#a2d49a', '#dcf6cc'];
RAMPS.leaf = ['#0c2618', '#164428', '#246638', '#368c4a', '#52b05e', '#86d684'];
RAMPS.bark = ['#1c120a', '#34220e', '#523616', '#744e22', '#9a6c34', '#c4944e'];
RAMPS.fwing = ['#123c4a', '#22647a', '#3c94aa', '#64c0d4', '#9ae4f0', '#d8fbff'];
RAMPS.feather = ['#3a2a1a', '#6a5034', '#9c7c54', '#cab082', '#ecdcb6', '#fffaf0'];
RAMPS.gargoyle = ['#14141a', '#26262e', '#3c3c46', '#56565f', '#74747c', '#9a9aa2'];
RAMPS.cape = ['#2a0410', '#5a0a1e', '#8e1430', '#c02a44', '#e8505e', '#ff8a8a'];

const RACE_TH = {
  human: { skin: 'skin', cloth: 'tunic', armor: 'steel', accent: 'plume', legs: 'leather', weapon: 'spear', head: 'helm', eye: '#1a1018' },
  demon: { skin: 'demonSkin', cloth: 'demonCloth', armor: 'iron', accent: 'ember', legs: 'iron', weapon: 'trident', head: 'horns', eye: '#ffe14a', tail: true },
  fairy: { skin: 'fairySkin', cloth: 'leaf', armor: 'bark', accent: 'cloth', legs: 'leaf', weapon: 'staff', head: 'antenna', eye: '#2a1a40', wings: true },
};

function humanoid(th, f, o = {}) {
  const sc = o.sc || 1, W = Math.round(32 * sc);
  const s = new Sprite(W, W);
  const P = (x, y) => [x * sc, y * sc];
  const step = [0, 1, 0, -1][f % 4], bob = f % 2 ? -0.5 : 0;
  const bulky = !!o.bulky;
  const L_B = s.addPart(th.legs, { layer: 0 }), L_F = s.addPart(th.legs, { layer: 3 });
  const ARMB = s.addPart(bulky ? th.armor : th.cloth, { layer: 0 });
  const BODY = s.addPart(bulky ? th.armor : th.cloth, { layer: 1 });
  const BELT = s.addPart('leather', { layer: 2 });
  const HEAD = s.addPart(th.skin, { layer: 3 });
  const GEAR = s.addPart(th.head === 'horns' ? 'horn' : th.head === 'antenna' ? th.accent : th.armor, { layer: 4 });
  const ACC = s.addPart(th.accent, { layer: 5 });
  const ARMF = s.addPart(bulky ? th.armor : th.cloth, { layer: 5 });
  const WEAP = s.addPart(th.weapon === 'staff' ? 'bark' : th.weapon === 'trident' ? 'iron' : 'wood', { layer: 6 });
  const TIP = s.addPart(th.weapon === 'staff' ? 'fwing' : th.weapon === 'trident' ? 'ember' : 'steel', { layer: 7 });
  const SH = s.addPart(th.armor, { layer: 6 });
  const EL = (p, x, y, rx, ry, op) => s.ellipse(p, x * sc, y * sc, rx * sc, ry * sc, op);
  const LI = (p, x0, y0, x1, y1, r0, r1, op) => s.limb(p, x0 * sc, y0 * sc, x1 * sc, y1 * sc, r0 * sc, (r1 ?? r0) * sc, op);
  const PO = (p, pts, op) => s.poly(p, pts.map(([x, y]) => P(x, y)), op);
  if (o.cape) PO(s.addPart('cape', { layer: 0 }), [[11, 13 + bob], [21, 13 + bob], [23, 27], [9, 27]], { base: 0.4, grad: [0.01, 0.02] });
  if (th.wings) { const WGp = s.addPart('fwing', { layer: 0 }); EL(WGp, 9, 14 + bob - (f % 2), 4, 5, { flat: 0.4, bias: 0.15 }); EL(WGp, 23, 14 + bob - (f % 2), 4, 5, { flat: 0.4 }); }
  if (th.tail) LI(s.addPart(th.skin, { layer: 0 }), 12, 22, 7, 26 + step, 1, 0.5);
  LI(L_B, 14, 22, 14 - step * 2, 28.5, bulky ? 2.2 : 1.6, bulky ? 1.9 : 1.4);
  LI(ARMB, 12, 15 + bob, 10 + step, 21 + bob, bulky ? 2 : 1.4, bulky ? 1.7 : 1.2);
  EL(BODY, 15.5, 18 + bob, bulky ? 6.2 : 4.6, bulky ? 6.4 : 5.4);
  if (!bulky) { LI(BELT, 11.5, 21 + bob, 19.5, 21 + bob, 0.9); s.dot(15 * sc, (21 + bob) * sc, '#ffd23a'); }
  else for (const y of [16, 19]) for (let x = 11; x <= 20; x += 3) s.dot(x * sc, (y + bob) * sc, '#dfe3e8');
  LI(L_F, 17, 22, 17 + step * 2, 28.5, bulky ? 2.3 : 1.7, bulky ? 2 : 1.5);
  EL(L_F, 17.5 + step * 2, 29.3, 2.2, 1, { flat: 0.3 });
  EL(L_B, 14.5 - step * 2, 29.3, 2, 1, { flat: 0.3 });
  EL(HEAD, 16, 9.5 + bob, 3.6, 3.8, { bias: 0.22 });
  if (th.head === 'helm') {
    EL(GEAR, 16, 8 + bob, 4.2, 3.4);
    PO(GEAR, [[12, 9 + bob], [20.5, 9 + bob], [20.5, 10.5 + bob], [12, 10.5 + bob]], { base: 0.4 });
    LI(ACC, 15, 4.5 + bob, 11, 6 + bob, 1.4, 0.8);
  } else if (th.head === 'horns') {
    LI(GEAR, 14, 7 + bob, 11.5, 3.5 + bob, 1, 0.4); LI(GEAR, 18, 7 + bob, 20.5, 3.5 + bob, 1, 0.4);
  } else {
    PO(GEAR, [[11.5, 8 + bob], [16, 3.5 + bob], [20.5, 8 + bob], [16, 7 + bob]], { base: 0.6, grad: [-0.03, -0.03] });
    LI(GEAR, 15, 5 + bob, 13, 1.5 + bob, 0.4); LI(GEAR, 17, 5 + bob, 19, 1.5 + bob, 0.4);
    s.dot(13 * sc, 1.5 * sc, '#fff6c4'); s.dot(19 * sc, 1.5 * sc, '#fff6c4');
  }
  if (o.crown) {
    for (const x of [12.5, 15, 17.5, 20]) PO(s.addPart('cloth', { layer: 8 }), [[x - 1.2, 6 + bob], [x, 2.5 + bob], [x + 1.2, 6 + bob]], { base: 0.75 });
    s.dot(16 * sc, 5 * sc, '#ff5a8a');
    s.light(16 * sc, 5 * sc, 'rgba(255,220,120,0.8)', 3 * sc);
  }
  s.dot(18 * sc, (10.5 + bob) * sc, th.eye);
  if (th.eye === '#ffe14a') s.light(18 * sc, 10.5 * sc, 'rgba(255,200,60,0.6)', 2);
  // 무기
  const wx = 22 + step * 0.5;
  LI(WEAP, wx, 4, wx - 1, 28, 0.6, 0.6);
  if (th.weapon === 'spear') PO(TIP, [[wx - 1, 4], [wx + 0.5, 0], [wx + 2, 4]], { base: 0.75, grad: [-0.05, -0.05] });
  else if (th.weapon === 'trident') { for (const dx of [-1.5, 0, 1.5]) LI(TIP, wx + dx, 4, wx + dx, 0.8, 0.45); LI(TIP, wx - 1.6, 4, wx + 1.6, 4, 0.5); s.light(wx * sc, 2 * sc, 'rgba(255,120,40,0.6)', 3); }
  else { EL(TIP, wx, 3, 2, 2); s.light(wx * sc, 3 * sc, 'rgba(140,240,255,0.9)', 4); }
  LI(ARMF, 18, 15 + bob, wx - 1, 18 + bob, bulky ? 1.9 : 1.5, bulky ? 1.6 : 1.3);
  if (o.shield || bulky) {
    EL(SH, 11, 18.5 + bob, bulky ? 4 : 3, bulky ? 5.5 : 4.2);
    s.dot(11 * sc, (17.5 + bob) * sc, '#ffd23a'); s.dot(11 * sc, (18.5 + bob) * sc, '#ffd23a');
  }
  return s.render();
}

function beast(th, race, f) {
  const s = new Sprite(32, 32);
  const g4 = [0, 1, 0, -1][f % 4], up = f % 2 ? -0.6 : 0;
  const ramp = race === 'human' ? 'leather' : race === 'demon' ? 'demonSkin' : 'fwing';
  const BODY = s.addPart(ramp, { layer: 2 }), LEGB = s.addPart(ramp, { layer: 0 }), LEGF = s.addPart(ramp, { layer: 3 });
  const MANE = s.addPart(race === 'demon' ? 'ember' : race === 'human' ? 'bark' : 'shell', { layer: 4 });
  s.limb(BODY, 6, 18 + up, 2, 14 - g4, 1.4, 0.7);
  s.limb(LEGB, 9, 21, 8 - g4 * 2, 28, 1.3, 1.1); s.limb(LEGB, 20, 21, 21 + g4 * 2, 28, 1.3, 1.1);
  s.ellipse(BODY, 14, 19 + up, 8, 4.4);
  s.limb(LEGF, 11, 21, 12 + g4 * 2, 28, 1.4, 1.2); s.limb(LEGF, 18, 21, 17 - g4 * 2, 28, 1.4, 1.2);
  s.limb(BODY, 20, 17 + up, 23, 13 + up, 2.6, 2.2);
  s.ellipse(BODY, 24.5, 12 + up, 3.6, 3);
  s.ellipse(BODY, 28, 13.5 + up, 2.6, 1.7);
  s.poly(BODY, [[22.5, 10 + up], [23.5, 6.5 + up], [25, 10 + up]], { base: 0.6 });
  s.limb(MANE, 19, 15 + up, 22, 11 + up, 1.6, 1.2);
  s.dot(25, 11 + up, race === 'human' ? '#1a1018' : race === 'demon' ? '#ffe14a' : '#ffffff');
  if (race === 'demon') { s.light(20, 13, 'rgba(255,110,30,0.75)', 5); s.light(25, 11, 'rgba(255,200,60,0.6)', 2); }
  if (race === 'fairy') for (const [x, y] of [[4, 12], [8, 10], [3, 17]]) { s.dot(x, y, '#ffffff'); s.light(x, y, 'rgba(160,240,255,0.7)', 2); }
  if (race === 'human') { s.limb(s.addPart('cape', { layer: 5 }), 12, 15 + up, 17, 15 + up, 1.2); }
  return s.render();
}

function flyer(th, race, f) {
  const s = new Sprite(32, 32);
  const fl = [0, 3, 5, 3][f % 4];
  const bodyR = race === 'human' ? 'feather' : race === 'demon' ? 'gargoyle' : 'leaf';
  const wingR = race === 'human' ? 'shell' : race === 'demon' ? 'gargoyle' : 'fwing';
  const WB = s.addPart(wingR, { layer: 0 }), BODY = s.addPart(bodyR, { layer: 2 }), WF = s.addPart(wingR, { layer: 4 }), HEAD = s.addPart(race === 'fairy' ? 'fairySkin' : bodyR, { layer: 3 });
  if (race === 'fairy') {
    s.ellipse(WB, 9, 10 + fl * 0.4, 6, 5 - fl * 0.3, { flat: 0.4, bias: 0.15 }); s.ellipse(WB, 10, 17, 4, 3, { flat: 0.4 });
  } else s.poly(WB, [[14, 14], [2, 4 + fl], [6, 10 + fl * 0.5], [4, 14 + fl * 0.3], [12, 18]], { base: 0.35, grad: [0.02, 0.02] });
  s.ellipse(BODY, 16, 17, 5.5, 4);
  s.limb(BODY, 12, 19, 9, 23, 1.2, 0.6);
  s.ellipse(HEAD, 21.5, 13, 3.3, 3);
  if (race === 'human') s.poly(s.addPart('cloth', { layer: 5 }), [[24, 13], [28, 14], [24, 15]], { base: 0.7 });
  if (race === 'demon') { s.limb(s.addPart('horn', { layer: 5 }), 20.5, 11, 19, 8, 0.7, 0.3); s.dot(22.5, 12.5, '#ffe14a'); s.light(22.5, 12.5, 'rgba(255,200,60,0.6)', 2); }
  else s.dot(22.5, 12.5, '#1a1018');
  if (race === 'fairy') {
    s.ellipse(WF, 21, 10 + fl * 0.4, 6, 5 - fl * 0.3, { flat: 0.4 }); s.ellipse(WF, 20, 17, 4, 3, { flat: 0.4 });
    for (const [x, y] of [[19, 8], [23, 11]]) s.dot(x, y + fl * 0.4, '#ffffff');
    s.light(16, 17, 'rgba(160,240,255,0.6)', 5);
  } else s.poly(WF, [[16, 14], [26, 3 + fl], [24, 9 + fl * 0.5], [28, 12 + fl * 0.3], [19, 18]], { base: 0.65, grad: [0.02, 0.02] });
  return s.render();
}

const monsterCache = new Map();
export function monster(kind, race, f = 0) {
  const key = `${kind}:${race}:${f % 4}`;
  if (monsterCache.has(key)) return monsterCache.get(key);
  const th = RACE_TH[race];
  let c;
  if (kind === 'normal') c = humanoid(th, f);
  else if (kind === 'armored') c = humanoid(race === 'fairy' ? { ...th, cloth: 'bark', armor: 'bark', legs: 'bark', head: 'antenna', accent: 'leaf', wings: false } : th, f, { bulky: true });
  else if (kind === 'boss') c = humanoid(th, f, { sc: 1.5, crown: true, cape: true, shield: race === 'human' });
  else if (kind === 'fast') c = beast(th, race, f);
  else c = flyer(th, race, f);
  monsterCache.set(key, c);
  return c;
}

// ---------- 지형 전체 (0 풀, 1 바위, 2 물, 3 진흙, 4 고지대) ----------
const BIOME_GRASS = {
  meadow: ['#1f3a22', '#2b4f2a', '#3a6834', '#4f843e', '#69a04a', '#8cbc5a'],
  canyon: ['#3a3220', '#54482a', '#706234', '#8c7c40', '#a8964e', '#c8b468'],
  lake: ['#16342a', '#204a36', '#2c6444', '#3c8052', '#529c62', '#78bc78'],
  swamp: ['#16261e', '#1e3628', '#284a32', '#34603c', '#447848', '#5e9458'],
  highland: ['#24401e', '#325a28', '#447a32', '#5a963e', '#76b04c', '#9ccc64'],
  mixed: ['#1f3a22', '#2b4f2a', '#3a6834', '#4f843e', '#69a04a', '#8cbc5a'],
};

export function drawWorld(g, grid, cols, rows, seed = 7, biome = 'meadow') {
  const W = cols * 32, H = rows * 32;
  const GR = BIOME_GRASS[biome] || BIOME_GRASS.meadow;
  const img = g.createImageData(W, H);
  const at = (tx, ty, t) => tx >= 0 && ty >= 0 && tx < cols && ty < rows && grid[ty * cols + tx] === t;
  const dist = (px, py, t) => {
    let best = 99;
    const tx = Math.floor(px / 32), ty = Math.floor(py / 32);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = tx + dx, ny = ty + dy;
      if (!at(nx, ny, t)) continue;
      const cx = Math.max(nx * 32 + 4, Math.min(nx * 32 + 28, px)), cy = Math.max(ny * 32 + 4, Math.min(ny * 32 + 28, py));
      best = Math.min(best, Math.hypot(px - cx, py - cy) - 4);
    }
    return best;
  };
  const WATER = ['#0e2a4a', '#123c66', '#18517f', '#22699a', '#3a8ab4', '#6cb4d4', '#bfe8f4'];
  const MUD = ['#2a1c12', '#3a2818', '#4e3620', '#62452a', '#7a5a38', '#96744a'];
  const HILL = GR.map((c, i) => GR[Math.min(GR.length - 1, i + 1)]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = vnoise(x / 9, y / 9, seed) * 0.6 + vnoise(x / 3.5, y / 3.5, seed + 1) * 0.4;
    const tx = Math.floor(x / 32), ty = Math.floor(y / 32), t = grid[ty * cols + tx];
    const dw = dist(x + 0.5, y + 0.5, 2), dm = dist(x + 0.5, y + 0.5, 3);
    let col;
    if (dw < 0) { const depth = Math.min(1, -dw / 10); col = WATER[Math.max(0, Math.min(4, Math.round((1 - depth) * 3 + n * 1.2)))]; }
    else if (dw < 1.2) col = '#d8f2f8';
    else if (dw < 3) col = n > 0.5 ? '#8a7a54' : '#6e6040';
    else if (dm < 0) { const k = Math.round(1.2 + n * 3 + (hash2(x, y, seed + 7) > 0.97 ? 1 : 0)); col = MUD[Math.max(0, Math.min(5, k))]; if (vnoise(x / 5, y / 5, seed + 9) > 0.72) col = '#24323a'; }
    else if (dm < 1.5) col = MUD[1];
    else {
      const R = t === 4 ? HILL : GR;
      let k = Math.floor(1.5 + n * 3.2);
      if (hash2(x, y, seed + 3) > 0.985) k = 5;
      col = R[Math.max(0, Math.min(5, k))];
      // 고지대: 위·왼쪽 가장자리는 밝게, 아래쪽은 절벽
      if (t === 4) {
        const ly = y - ty * 32, lx = x - tx * 32;
        if (!at(tx, ty - 1, 4) && ly < 2) col = HILL[5];
        if (!at(tx - 1, ty, 4) && lx < 2) col = HILL[4];
        if (!at(tx, ty + 1, 4) && ly >= 25) col = ly >= 30 ? '#20242a' : ['#5a5048', '#6e6458', '#4a4038', '#3a3430', '#2c2824'][Math.min(4, Math.floor((ly - 25) / 1.2 + n))];
        if (!at(tx + 1, ty, 4) && lx >= 30) col = '#2c3a24';
      }
    }
    const [r, gg, b] = hexToRgb(col);
    const i = (y * W + x) * 4;
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // 풀잎, 꽃, 자갈
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
    const t = grid[ty * cols + tx];
    if (t !== 0 && t !== 4) continue;
    for (let k = 0; k < 6; k++) {
      const x = tx * 32 + Math.floor(hash2(tx * 13 + k, ty, seed) * 30) + 1, y = ty * 32 + Math.floor(hash2(tx, ty * 7 + k, seed) * 22) + 3;
      if (dist(x, y, 2) < 4 || dist(x, y, 3) < 3) continue;
      g.fillStyle = GR[1]; g.fillRect(x, y, 1, 3); g.fillRect(x + 2, y + 1, 1, 2);
      g.fillStyle = GR[4]; g.fillRect(x + 1, y - 1, 1, 3);
      g.fillStyle = GR[5]; g.fillRect(x + 1, y - 1, 1, 1);
    }
    const r = hash2(tx, ty, seed + 9);
    if (r > 0.6 && biome !== 'canyon') {
      const x = tx * 32 + 6 + Math.floor(r * 18), y = ty * 32 + 8 + Math.floor(hash2(ty, tx, seed) * 14);
      const pc = r > 0.82 ? ['#fff6e0', '#ffd23a'] : r > 0.7 ? ['#ff9ac8', '#fff1a0'] : ['#a8c8ff', '#ffffff'];
      if (dist(x, y, 2) > 4 && dist(x, y, 3) > 3) {
        g.fillStyle = GR[1]; g.fillRect(x, y + 2, 1, 2);
        g.fillStyle = pc[0]; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
        g.fillStyle = pc[1]; g.fillRect(x, y, 1, 1);
      }
    }
  }
  // 바위
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
    if (grid[ty * cols + tx] !== 1) continue;
    g.fillStyle = 'rgba(10,8,24,0.35)';
    g.beginPath(); g.ellipse(tx * 32 + 17, ty * 32 + 27, 12, 3.5, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(boulder(Math.floor(hash2(tx, ty, seed) * 3)), tx * 32, ty * 32);
  }
}

const boulderCache = [];
function boulder(v) {
  if (boulderCache[v]) return boulderCache[v];
  const s = new Sprite(32, 32);
  const R = s.addPart('stone', { layer: 1 }), R2 = s.addPart('stone', { layer: 2 }), M = s.addPart('moss', { layer: 3 });
  if (v === 0) { s.ellipse(R, 15, 18, 11, 9); s.ellipse(R2, 22, 21, 6, 5); s.ellipse(M, 12, 11, 5, 2.2, { flat: 0.3 }); }
  else if (v === 1) { s.ellipse(R, 17, 17, 10, 10); s.ellipse(R2, 9, 22, 5, 4); s.ellipse(M, 18, 9, 4, 2, { flat: 0.3 }); }
  else { s.ellipse(R, 13, 19, 9, 8); s.ellipse(R2, 21, 16, 7, 8); s.ellipse(M, 20, 9, 3.5, 1.8, { flat: 0.3 }); }
  const c = s.render();
  const g = c.getContext('2d');
  g.fillStyle = '#30343f';
  for (const [x, y, l] of [[12, 16, 4], [19, 20, 3], [15, 22, 2]]) for (let k = 0; k < l; k++) g.fillRect(x + k, y + (k % 2), 1, 1);
  boulderCache[v] = c;
  return c;
}

// 출발 포털 (4프레임 소용돌이)
export function portal(f = 0) {
  const s = new Sprite(32, 32);
  const RIM = s.addPart(['#1a0a2e', '#2e1450', '#4a2478', '#6c3aa8', '#9a62d8', '#c8a0ff'], { layer: 1 });
  const CORE = s.addPart(['#0a0414', '#1a0a30', '#2e1452', '#4a2276', '#6e38a0', '#9a5ac8'], { layer: 2 });
  s.ellipse(RIM, 16, 18, 11, 12);
  s.ellipse(CORE, 16, 18, 8, 9, { flat: 0.5 });
  const c = s.render();
  const g = c.getContext('2d');
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + f * 0.6, r = 2 + (k % 3) * 2.2;
    g.fillStyle = k % 2 ? '#ff8ad8' : '#c8a0ff';
    g.fillRect(Math.round(16 + Math.cos(a) * r * 1.1), Math.round(18 + Math.sin(a) * r), 1, 1);
  }
  g.fillStyle = '#ffffff'; g.fillRect(16, 18, 1, 1);
  c.glow = [[16, 18, 'rgba(190,110,255,0.9)', 9]];
  return c;
}

// 도착 성문 (횃불 2개)
export function gate(f = 0) {
  const s = new Sprite(32, 32);
  const ST = s.addPart('stone', { layer: 1, rim: false }), DOOR = s.addPart('wood', { layer: 2 }), TORCH = s.addPart('wood', { layer: 3 });
  s.poly(ST, [[3, 8], [29, 8], [29, 30], [3, 30]], { base: 0.55, grad: [-0.01, -0.012] });
  for (const x of [3, 9, 15, 21, 27]) s.poly(ST, [[x, 4], [x + 2.5, 4], [x + 2.5, 9], [x, 9]], { base: 0.7 });
  s.poly(DOOR, [[10, 30], [10, 18], [16, 13], [22, 18], [22, 30]], { base: 0.45, grad: [0.01, 0.02] });
  s.limb(TORCH, 6, 14, 6, 20, 0.7); s.limb(TORCH, 26, 14, 26, 20, 0.7);
  const c = s.render();
  const g = c.getContext('2d');
  g.fillStyle = '#24140c'; for (const x of [13, 16, 19]) g.fillRect(x, 18, 1, 12);
  g.fillStyle = '#ffd23a'; g.fillRect(17, 24, 1, 1);
  g.fillStyle = '#30343f'; for (const y of [14, 20, 26]) { g.fillRect(4, y, 5, 1); g.fillRect(24, y, 5, 1); }
  const fl = [0, 1, 0, -1][f % 4];
  for (const x of [6, 26]) {
    g.fillStyle = '#ff5a10'; g.fillRect(x - 1, 11, 3, 3);
    g.fillStyle = '#ffa21c'; g.fillRect(x, 10 + fl * 0.5, 1, 3);
    g.fillStyle = '#fffbd0'; g.fillRect(x, 12, 1, 1);
  }
  c.glow = [[6, 12, 'rgba(255,150,50,0.9)', 7], [26, 12, 'rgba(255,150,50,0.9)', 7]];
  return c;
}
