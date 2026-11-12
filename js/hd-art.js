// 고급 도트 샘플 엔진 (32px).
// 도형마다 입체 법선을 계산해 왼쪽 위 빛으로 4~6단계 명암을 칠하고,
// 색에 맞춘 외곽선(밝은 쪽은 한 단계 밝게)을 자동으로 넣는다.

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

// ---------- 레드 드래곤 5단계 ----------
// f: 애니메이션 프레임 0~3 (날갯짓·숨쉬기)
export function redDragon(grade, f = 0) {
  const s = new Sprite(32, 32);
  const flap = [0, 1, 2, 1][f % 4];
  const br = [0, 0.3, 0.5, 0.3][f % 4];
  const BODY = s.addPart('red', { layer: 2 });
  const BELLY = s.addPart('belly', { layer: 3 });
  const WING = s.addPart('wing', { layer: 1 });
  const WINGF = s.addPart('wing', { layer: 4 });
  const BACK = s.addPart('red', { layer: 0 });
  const HORN = s.addPart('horn', { layer: 5 });
  const HEAD = s.addPart('red', { layer: 4 });
  const SNOUT = s.addPart('red', { layer: 5 });
  const CLAW = s.addPart('horn', { layer: 6 });
  const eye = (x, y, big) => {
    s.dot(x, y, '#fff7c8'); s.dot(x + 1, y, '#ffd23a');
    if (big) { s.dot(x, y + 1, '#ffb01a'); s.dot(x + 1, y + 1, '#1a0a10'); s.dot(x, y - 1, '#ffffff'); }
    else s.dot(x + 1, y, '#1a0a10');
  };

  if (grade === 0) {
    // 둥지 위의 알: 반점, 금, 윤기
    const STRAW = s.addPart('straw', { layer: 0 });
    const EGG = s.addPart('red', { layer: 2 });
    const SPOT = s.addPart('eggSpot', { layer: 3 });
    for (let k = 0; k < 9; k++) s.limb(STRAW, 5 + k * 2.6, 27 + (k % 2), 8 + k * 2.4, 25 + ((k + 1) % 3), 1.1);
    s.ellipse(STRAW, 16, 27.5, 11, 3, { flat: 0.3 });
    s.ellipse(EGG, 16, 16.5 - br * 0.5, 7.5, 10.2);
    for (const [x, y, r] of [[13, 12, 1.6], [18.5, 15, 1.3], [14, 20, 1.9], [19, 21.5, 1.2], [16.5, 9, 1]]) s.ellipse(SPOT, x, y, r, r * 0.8, { flat: 0.4 });
    // 갈라진 금 (안쪽 빛)
    for (const [x, y] of [[17, 7], [18, 8], [17, 9], [18, 10]]) s.dot(x, y, '#ffb34a');
    s.light(17.5, 9, 'rgba(255,150,60,0.9)', 5);
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
    s.poly(WING, [[11, 16], [6, 11 - flap], [8, 15], [10, 18]], { base: 0.55, grad: [0.05, 0.05] });
    s.ellipse(HEAD, 19, 12 - br, 6.2, 5.6);
    s.ellipse(SNOUT, 24, 14 - br, 3.4, 2.6);
    s.limb(HORN, 16, 7.5, 14.5, 5.5, 1.1, 0.5);
    s.limb(HORN, 20, 7, 20.5, 5, 1, 0.5);
    eye(20, 11 - br, true);
    s.dot(26, 13 - br, '#2a0a1e');
    s.dot(23, 16 - br, '#561327'); s.dot(24, 16 - br, '#561327');
    s.poly(SHELL, [[7, 23], [25, 23], [24, 28], [20, 30], [12, 30], [8, 28]], { base: 0.55, grad: [-0.02, -0.04] });
    for (const [x, y] of [[9, 22], [12, 21], [15, 22], [18, 21], [21, 22], [24, 21]]) s.set(x, y, SHELL, 0.85);
    s.poly(CAP, [[14, 7], [17, 4], [22, 5], [24, 8], [21, 7], [18, 8]], { base: 0.7, grad: [0, -0.05] });
    return s.render();
  }

  if (grade === 2) {
    // 어린 비룡: 네 발, 작은 날개
    s.poly(BACK, [[12, 15], [5, 4 - flap], [8, 9 - flap], [10, 6 - flap], [12, 11], [14, 9 - flap], [15, 15]], { base: 0.3, grad: [0.02, 0.03] });
    s.limb(BODY, 8, 22, 4, 25, 2.4, 1.6); s.limb(BODY, 4, 25, 1.5, 24, 1.6, 0.8);
    s.ellipse(BODY, 14, 20 - br, 7.5, 5.2);
    s.ellipse(BELLY, 16, 22.5 - br, 5, 2.6, { bias: 0.05 });
    s.limb(BODY, 10, 23, 9, 28, 1.8, 1.5); s.limb(BODY, 18, 23, 19, 28, 1.9, 1.5);
    s.limb(BODY, 19, 18, 22, 12, 2.6, 2.2);
    s.ellipse(HEAD, 23.5, 10 - br, 4.6, 3.8);
    s.ellipse(SNOUT, 27.5, 11.5 - br, 3, 2.1);
    s.limb(HORN, 21.5, 7, 19, 4.5, 1, 0.4); s.limb(HORN, 23.5, 6.5, 22.5, 3.5, 1, 0.4);
    s.poly(WINGF, [[14, 17], [9, 6 - flap], [11, 10 - flap], [13, 7 - flap], [15, 12], [17, 9 - flap], [18, 17]], { base: 0.6, grad: [0.03, 0.03] });
    const WB = s.addPart('wbone', { layer: 6, rim: false });
    for (const [x0, y0] of [[9, 6 - flap], [13, 7 - flap], [17, 9 - flap]]) s.limb(WB, x0, y0, 15, 16, 0.45);
    s.limb(CLAW, 9, 28.5, 10.5, 28.5, 0.7); s.limb(CLAW, 19, 28.5, 20.5, 28.5, 0.7);
    eye(24, 9 - br);
    s.dot(29, 11 - br, '#2a0a1e');
    for (let x = 12; x <= 19; x += 2) s.dot(x, 24 - br, '#c97a3e');
    return s.render();
  }

  // 3 성체 드래곤, 4 고위 드래곤
  const big = grade === 4;
  const wy = flap * 1.5;
  // 뒤쪽 날개
  s.poly(BACK, big
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
  s.poly(WINGF, mem, { base: 0.66, grad: [0.03, 0.035] });
  const WB = s.addPart('wbone', { layer: 6, rim: false });
  s.limb(WB, root[0], root[1], tips[0][0], tips[0][1], 0.7, 0.35);
  for (const [x, y] of tips.slice(1)) s.limb(WB, root[0], root[1], x, y, 0.5, 0.3);
  s.ellipse(WB, root[0], root[1], 1.3, 1.1);
  // 배 비늘 줄
  for (let x = 12; x <= 20; x += 2) { s.dot(x, 23 - br, '#c97a3e'); s.dot(x + 1, 21 - br, '#eeac5c'); }
  // 등 가시
  for (const [x, y] of [[10, 13.5], [13, 12.8], [16, 13]]) s.poly(HORN, [[x - 1, y + 1], [x, y - 1.8], [x + 1, y + 1]], { base: 0.65 });
  eye(25, 6.5 - br);
  s.dot(31, 8.5 - br, '#2a0a1e');
  // 입가 이빨
  s.dot(28, 11 - br, '#fff6e0'); s.dot(30, 11 - br, '#fff6e0');
  if (big) {
    // 가슴의 마그마 균열 (빛남)
    for (const [x, y, c] of [[21, 18, '#ffa21c'], [22, 19, '#ffe066'], [21, 20, '#ff5a10'], [22, 21, '#ffa21c'], [20, 19, '#ff5a10']]) s.dot(x, y - br, c);
    s.light(21.5, 19.5, 'rgba(255,140,40,0.95)', 7);
    // 콧김
    s.light(31, 9, 'rgba(255,120,40,0.7)', 4);
    // 금빛 왕관 가시
    for (const [x, y] of [[20.5, 4], [22, 2.5], [24, 2.5]]) s.dot(x, y, '#ffe066');
    s.dot(23, 3, '#fff6c4');
  }
  return s.render();
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
