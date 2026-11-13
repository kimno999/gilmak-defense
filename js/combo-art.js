// 조합 드래곤 13종 전용 도트 그림 (32px, 오른쪽을 본다).
// 이름에 맞는 몸 형태를 따로 그린다: 무리, 얼음 수정, 산성, 와이번, 날개 없는 바실리스크,
// 저주받은 은룡, 역병, 기사, 일식 여왕, 지옥불, 눈보라 웜, 폭풍.
// up: 업그레이드 단계 (1이면 강화된 모습)
import { Sprite, dragonArt, DRAGON_THEMES } from './hd-art.js';

const R = {
  pinkB: ['#360c28', '#641846', '#9a2a6a', '#cc4494', '#ee6cba', '#ff9cd6', '#ffd6f0'],
  greenB: ['#0a2012', '#143c1c', '#1f5c28', '#2f8038', '#4aa446', '#76c85a', '#b4ea84'],
  blackB: ['#040406', '#0e0e14', '#1c1c26', '#2e2e3a', '#46465a', '#666680'],
  fairyW: ['#123c4a', '#22647a', '#3c94aa', '#64c0d4', '#9ae4f0', '#d8fbff'],
  ice: ['#0e2a4a', '#1c4a78', '#3474a8', '#5ea4d4', '#94d0f0', '#cdeeff', '#ffffff'],
  crystal: ['#164a7a', '#2a7ab8', '#58b0e8', '#9ad8ff', '#d6f4ff', '#ffffff'],
  frostBelly: ['#3a5a78', '#6a8eae', '#9cc0da', '#cde4f2', '#f0faff', '#ffffff'],
  acid: ['#1a2006', '#34400c', '#566a14', '#7e9a1c', '#a8c42a', '#d2ec4a', '#f2ffa0'],
  acidBelly: ['#3a3010', '#6a5a1c', '#9a8a2c', '#c8bc48', '#eee87a', '#fffcc0'],
  slime: ['#244a06', '#3e7a0a', '#62ac12', '#8ee020', '#c4ff5a', '#efffb0'],
  wyvB: ['#0c0616', '#1a0e2e', '#2c1a4a', '#40286a', '#5a3e8c', '#7e5eb4'],
  fireMem: ['#3a0a10', '#7a1414', '#b82a18', '#e8551e', '#ff8a2a', '#ffc15a'],
  wbone: ['#06020c', '#10061c', '#1c0c30', '#2c1648', '#422466'],
  basB: ['#121a08', '#22300e', '#3a4c16', '#566c22', '#7a9030', '#a2b648', '#ccdc7a'],
  basBelly: ['#3a3218', '#6a5a2c', '#9a8644', '#c8b462', '#ecdc90', '#fff6c8'],
  crest: ['#3a0e06', '#7a240a', '#c04a10', '#ee7a1c', '#ffb03a', '#ffe08a'],
  stone: ['#1a1c22', '#30343c', '#4a5058', '#69707a', '#8d959e', '#b6bcc4'],
  silver: ['#161a24', '#2e3646', '#4e5a72', '#7884a0', '#a2aec6', '#ccd6e8', '#f4f8ff'],
  silverBelly: ['#3a4250', '#626e80', '#8e9aae', '#b8c4d6', '#e0e8f4', '#ffffff'],
  curseWing: ['#0c0614', '#1e0e2c', '#341a48', '#4e2a66', '#6a3c88', '#8e58ae'],
  plague: ['#140c18', '#261a2a', '#3a2c3a', '#52444c', '#6e6060', '#8e8478'],
  plagueBelly: ['#28301a', '#3e4a22', '#5a6a2e', '#7a8c3c', '#a0b250', '#c8d878'],
  rag: ['#0a0808', '#181412', '#2a221c', '#3e3428', '#564836', '#706048'],
  bone: ['#3a3226', '#6a5e4a', '#a09478', '#cec4a6', '#eee8d2', '#fffcf0'],
  miasma: ['#1c3a0a', '#2e5a10', '#4a8418', '#6eae24', '#9cd640', '#ccf080'],
  gold: ['#361a06', '#64360a', '#985c10', '#cc8c1a', '#f0b834', '#ffdc72', '#fff4c4'],
  steel: ['#1e2430', '#3a4456', '#5f6c82', '#8e9bb0', '#c4cfde', '#f0f6ff'],
  royalB: ['#2a0c08', '#4a1a10', '#702a18', '#9a4022', '#c45e30', '#e88a4a'],
  cape: ['#1a0420', '#3a0a40', '#5e1466', '#86228c', '#ae3cb2', '#d468d4'],
  pearl: ['#3a2a46', '#64527a', '#9684aa', '#c4b6d2', '#ece2f2', '#ffffff'],
  queenWing: ['#4a3a10', '#7a6420', '#b09238', '#dcc05a', '#f6e292', '#fff8d4'],
  eclipse: ['#000000', '#06040c', '#0e0a1a', '#18122a', '#241c3c'],
  hell: ['#0e0404', '#200808', '#3a0c0a', '#5a140c', '#821e0e', '#b02e10'],
  magma: ['#5a1008', '#a8260c', '#ff5a10', '#ffa21c', '#ffe066', '#fffbd0'],
  flameMem: ['#3a0804', '#7a1606', '#c0360a', '#ff6a1a', '#ffaa3a', '#ffe07a'],
  wyrm: ['#0c1e3a', '#183660', '#28548a', '#3e78b4', '#62a2d8', '#9acdf0', '#e0f6ff'],
  wyrmBelly: ['#4a6a86', '#7e9cb6', '#b0cade', '#dcecf6', '#f6fcff', '#ffffff'],
  storm: ['#06061a', '#0e0e2e', '#1a1a48', '#2a2a66', '#3e3e88', '#5a5aac', '#8282cc'],
  cloud: ['#1a1a28', '#2c2c40', '#44445c', '#62627a', '#868698', '#b0b0c0'],
  stormBelly: ['#10283a', '#1c4460', '#2a6a8a', '#3c94b4', '#62c0dc', '#a2e6f6'],
};

const bob = (f) => [0, 0.3, 0.5, 0.3][f % 4];
const flapOf = (f) => [0, 1, 2, 1][f % 4];
function eye(s, x, y, col, glow, big) {
  s.dot(x, y, col); s.dot(x + 1, y, '#120810');
  if (big) { s.dot(x, y + 1, col); s.dot(x + 1, y + 1, col); }
  if (glow) s.light(x + 0.5, y, glow, 2.2);
}
// 강화 왕관 (머리 위치 기준)
function crown(s, x, y, col = '#ffe066', gem = '#ff5a8a') {
  for (const [dx, dy] of [[-2, 0], [0, -2], [2, -1], [-1, 1], [1, 1], [0, 1]]) s.dot(x + dx, y + dy, col);
  s.dot(x, y - 1, '#fff6c4'); s.dot(x, y, gem);
  s.light(x, y, 'rgba(255,230,120,0.9)', 4);
}
// 박쥐 날개 막 (뿌리 → 끝점들)
function batWing(s, part, bonePart, root, tips, endPt) {
  const mem = [root];
  tips.forEach(([x, y], k) => {
    mem.push([x, y]);
    if (k < tips.length - 1) { const [nx, ny] = tips[k + 1]; mem.push([(x * 2 + nx) / 3 + 1, (y * 2 + ny) / 3 + 4]); mem.push([(x + nx * 2) / 3 + 1, (y + ny * 2) / 3 + 3]); }
  });
  mem.push(endPt);
  s.poly(part, mem, { base: 0.62, grad: [0.03, 0.035] });
  if (bonePart != null) for (const [x, y] of tips) s.limb(bonePart, root[0], root[1], x, y, 0.55, 0.3);
}

// 1. 픽시 스웜: 작은 드래곤 세 마리(그린·블랙·픽시)가 무리 지어 독침을 쏜다
function pixieSwarm(up, f) {
  const s = new Sprite(32, 32);
  const W = s.addPart(R.fairyW, { layer: 1 });
  const minis = [[8, 13, R.greenB, 0], [22, 9, R.blackB, 1], [16, 22, R.pinkB, 2]];
  if (up) minis.push([6, 25, R.pinkB, 3], [26, 21, R.greenB, 1]);
  for (const [cx0, cy0, ramp, ph] of minis) {
    const fl = [0, 1, 2, 1][(f + ph) % 4], cy = cy0 + [0, -0.5, -1, -0.5][(f + ph) % 4];
    const B = s.addPart(ramp, { layer: 2 }), H = s.addPart(ramp, { layer: 3 });
    s.ellipse(W, cx0 - 1.6, cy - 3 - fl * 0.6, 2.3, 1.9, { flat: 0.4, bias: 0.15 });
    s.ellipse(W, cx0 + 0.6, cy - 3.3 - fl * 0.6, 1.9, 1.7, { flat: 0.4, bias: 0.1 });
    s.limb(B, cx0 - 2.6, cy + 0.6, cx0 - 5.4, cy + 2.2, 1.1, 0.45);
    s.ellipse(B, cx0, cy, 3.4, 2.5);
    s.limb(H, cx0 + 2, cy - 1, cx0 + 3, cy - 2, 1.4, 1.2);
    s.ellipse(H, cx0 + 3.6, cy - 2.3, 2.5, 2.1);
    s.ellipse(H, cx0 + 5.6, cy - 1.7, 1.3, 1.1);
    s.dot(cx0 + 2.4, cy - 4.4, '#f6e6aa'); s.dot(cx0 + 3.2, cy - 4.6, '#f6e6aa');
    s.dot(cx0 + 4, cy - 2.8, '#ffffff'); s.dot(cx0 + 4.8, cy - 2.8, '#1a0a10');
    s.dot(cx0 - 5.6, cy + 2.4, '#b6ff5a'); s.light(cx0 - 5.6, cy + 2.4, 'rgba(150,255,80,0.8)', 1.8);
  }
  // 독 가루
  for (const [x, y] of [[13, 6], [28, 15], [4, 19], [24, 28], [11, 29]]) { const o = (f % 2) * 1; s.dot(x, y - o, '#d8ff8a'); s.light(x, y - o, 'rgba(150,255,80,0.55)', 1.6); }
  if (up) s.light(16, 16, 'rgba(255,150,230,0.45)', 12);
  return s.render();
}

// 2. 프로즌 드래곤: 막 날개 대신 등에 거대한 얼음 수정, 차가운 숨결
function frozen(up, f) {
  const th = { ...DRAGON_THEMES.blue, body: R.ice, belly: R.frostBelly, horn: R.crystal, spikes: null };
  return dragonArt(th, up ? 4 : 3, f, {
    wings: false, glow: 'rgba(140,220,255,0.95)', mark: ['#8fd8ff', '#ffffff', '#4aa8ff'],
    pre: ({ s, br }) => {
      const C = s.addPart(R.crystal, { layer: 1 });
      const shards = up ? [[8, 15, 4, 12], [12, 13, 5, 16], [16, 14, 4, 13], [5, 17, 3, 8]] : [[9, 15, 3.4, 10], [13, 13.5, 4, 13], [16.5, 15, 3, 9]];
      for (const [x, y, w, h] of shards) s.poly(C, [[x - w / 2, y - br], [x - w / 4, y - h - br], [x + w / 4, y - h - 1 - br], [x + w / 2, y - br]], { base: 0.7, grad: [-0.07, -0.02] });
    },
    post: ({ s, br }) => {
      for (const [x, y] of [[31, 11], [30, 13], [31, 14], [29, 12]]) s.dot(x, y - br, '#e8f8ff');
      s.light(30.5, 12.5 - br, 'rgba(180,235,255,0.8)', 3);
      for (const [x, y] of [[3, 6], [6, 3], [27, 2]]) { s.dot(x, y, '#ffffff'); s.light(x, y, 'rgba(180,235,255,0.6)', 1.6); }
      if (up) for (const [x, y] of [[21, 29], [12, 29], [4, 28]]) { s.dot(x, y, '#cdeeff'); s.dot(x + 1, y, '#ffffff'); }
    },
  });
}

// 3. 애시드 드래곤: 축 늘어진 산성 드래곤, 턱에서 산이 떨어지고 발밑에 산성 웅덩이
function acid(up, f) {
  const th = { ...DRAGON_THEMES.green, body: R.acid, belly: R.acidBelly, wing: R.slime, drip: false, spikes: 'bone', horn: R.bone };
  return dragonArt(th, up ? 4 : 3, f, {
    glow: 'rgba(190,255,60,0.9)', mark: ['#c4ff5a', '#f2ffa0', '#62ac12'],
    pre: ({ s }) => {
      const P = s.addPart(R.slime, { layer: 0 });
      s.ellipse(P, 16, 30, 13, 2, { flat: 0.6, bias: 0.1 });
    },
    post: ({ s, br }) => {
      const k = f % 4;
      for (const [x, y] of [[29, 11 + k], [28, 12 + ((k + 2) % 4)], [30, 13 + ((k + 1) % 3)]]) { s.dot(x, y - br, '#d2ff4a'); s.light(x, y - br, 'rgba(190,255,60,0.7)', 1.6); }
      for (const [x, y] of [[6, 29], [12, 30], [24, 29], [19, 30]]) { s.dot(x, y - ((f + x) % 2), '#efffb0'); }
      if (up) { s.light(16, 29, 'rgba(190,255,60,0.6)', 8); for (const [x, y] of [[27.5, 11], [29.5, 11]]) s.dot(x, y - br, '#ffffff'); }
    },
  });
}

// 4. 쉐도우 와이번: 앞다리가 곧 날개인 와이번. 공중에 떠서 불붙은 날개를 펼친다
function shadowWyvern(up, f) {
  const s = new Sprite(32, 32);
  const fl = [0, 2, 4, 2][f % 4], by = 4 + [0, -0.6, -1, -0.6][f % 4];
  const WB = s.addPart(R.fireMem, { layer: 0 }), WBb = s.addPart(R.wbone, { layer: 1, rim: false });
  const BODY = s.addPart(R.wyvB, { layer: 2 }), LEG = s.addPart(R.wyvB, { layer: 3 });
  const HEAD = s.addPart(R.wyvB, { layer: 4 }), HORN = s.addPart(R.bone, { layer: 5 });
  const WF = s.addPart(R.fireMem, { layer: 5 }), WFb = s.addPart(R.wbone, { layer: 6, rim: false });
  const sc = up ? 1.15 : 1;
  batWing(s, WB, WBb, [14, 13 + by], [[3, 3 + fl - 3 * sc], [8, 1 + fl - 3 * sc], [13, 3 + fl - 2]], [15, 15 + by]);
  // 꼬리 (가시 끝)
  s.limb(BODY, 9, 16 + by, 4, 19 + by, 1.8, 1); s.limb(BODY, 4, 19 + by, 1, 23 + by, 1, 0.5);
  s.poly(HORN, [[0, 22 + by], [2, 21 + by], [1.5, 25 + by]], { base: 0.6 });
  s.ellipse(BODY, 14, 15 + by, 6, 3.8);
  // 늘어진 뒷다리와 발톱
  s.limb(LEG, 12, 18 + by, 11, 23 + by, 1.5, 1); s.limb(LEG, 16, 18 + by, 17, 23.5 + by, 1.6, 1);
  for (const [x, y] of [[10, 24], [11, 24.5], [16.5, 24.5], [17.5, 25]]) s.dot(x, y + by, '#d6c8a8');
  s.limb(BODY, 18, 13 + by, 22, 9 + by, 2, 1.6);
  s.ellipse(HEAD, 23.5, 8 + by, 3.4, 2.7);
  s.ellipse(HEAD, 27, 9 + by, 2.4, 1.6);
  s.limb(HORN, 22, 6 + by, 19, 4 + by, 0.8, 0.3); s.limb(HORN, 23.5, 5.6 + by, 22.5, 3 + by, 0.7, 0.3);
  batWing(s, WF, WFb, [17, 13 + by], [[12, 1 + fl * 0.5 - 2 * sc], [19, -1 + fl * 0.5 - 2 * sc], [25, 3 + fl * 0.5 - sc], [28, 11 + fl * 0.3]], [20, 15 + by]);
  eye(s, 24, 7 + by, '#ff9a3a', 'rgba(255,150,60,0.8)');
  // 입 속 불꽃
  s.dot(29, 9.5 + by, '#ffe066'); s.dot(30, 9 + by, '#ffa21c'); s.dot(31, 10 + by, '#ff5a10');
  s.light(30, 9.5 + by, 'rgba(255,140,40,0.9)', 3.5);
  for (const [x, y] of [[6, 7], [10, 5], [24, 4]]) s.dot(x, y + fl * 0.5, '#ffc15a');
  if (up) crown(s, 23, 3 + by);
  return s.render();
}

// 5. 바실리스크 드래곤: 날개 없는 육지 드래곤. 낮고 긴 몸, 여섯 다리, 머리 볏, 돌로 만드는 눈
function basilisk(up, f) {
  const s = new Sprite(32, 32);
  const br = bob(f), step = [0, 1, 0, -1][f % 4];
  const TAIL = s.addPart(R.basB, { layer: 0 }), LB = s.addPart(R.basB, { layer: 1 });
  const BODY = s.addPart(R.basB, { layer: 2 }), BELLY = s.addPart(R.basBelly, { layer: 3 });
  const LF = s.addPart(R.basB, { layer: 4 }), HEAD = s.addPart(R.basB, { layer: 5 });
  const CREST = s.addPart(up ? R.stone : R.crest, { layer: 4 }), CLAW = s.addPart(R.bone, { layer: 6 });
  // 꼬리: 땅을 따라 길게
  s.limb(TAIL, 6, 23, 2, 26, 2.6, 1.6); s.limb(TAIL, 2, 26, 1, 29, 1.6, 0.6);
  // 뒤쪽 다리 3개
  for (const [x, d] of [[9, 1], [15, -1], [21, 1]]) s.limb(LB, x + 1, 23, x + 2 + step * d, 28.5, 1.4, 1.1);
  // 낮고 긴 몸
  s.ellipse(BODY, 14, 22.5 - br, 10.5, 4.4);
  s.ellipse(BELLY, 15, 25 - br, 8, 1.8, { bias: 0.05 });
  // 등의 뿔판
  const PL = s.addPart(R.crest, { layer: 3 });
  for (const x of [7, 10, 13, 16, 19]) s.poly(PL, [[x - 1.2, 19 - br], [x, 15.8 - br - (x % 2)], [x + 1.2, 19 - br]], { base: 0.65, grad: [-0.04, -0.03] });
  // 앞쪽 다리 3개
  for (const [x, d] of [[7, -1], [13, 1], [19, -1]]) { s.limb(LF, x, 24, x - 1 + step * d, 29, 1.6, 1.2); s.limb(CLAW, x - 2.3 + step * d, 29.5, x + 0.3 + step * d, 29.5, 0.6); }
  // 넓적한 머리 (낮게)
  s.limb(BODY, 22, 21 - br, 25, 19 - br, 3, 2.6);
  s.ellipse(HEAD, 26, 18.5 - br, 4.4, 3.3);
  s.ellipse(HEAD, 29.5, 19.6 - br, 2.4, 2);
  // 머리 볏 (부채꼴)
  s.poly(CREST, [[22, 17 - br], [21, 11 - br], [24, 13.5 - br], [25, 10 - br], [27, 14 - br], [29, 12.5 - br], [28.5, 16.5 - br]], { base: 0.7, grad: [0.02, 0.05] });
  // 돌로 만드는 노란 눈
  s.dot(27, 17.6 - br, '#fff6a0'); s.dot(28, 17.6 - br, '#ffe14a'); s.dot(28, 18.6 - br, '#1a0a10');
  s.light(27.8, 17.8 - br, 'rgba(255,230,80,0.95)', 3.5);
  s.dot(31, 20 - br, '#1a0a10'); s.dot(29, 21.5 - br, '#fff6e0');
  for (const x of [9, 12, 15, 18]) s.dot(x, 21 - br, R.basB[5]);
  if (up) {
    // 고르곤 고룡: 볏 대신 작은 뱀들, 돌 조각
    const SN = s.addPart(R.basB, { layer: 6 });
    for (const [x0, y0, x1, y1] of [[23, 16, 20, 11], [25, 15, 24, 9.5], [27, 15.5, 28.5, 10], [29, 16.5, 31, 13]]) {
      const w = (f % 2) * 0.6;
      s.limb(SN, x0, y0 - br, x1 + w, y1 - br, 0.9, 0.75); s.ellipse(SN, x1 + w + 0.5, y1 - br - 0.5, 1.3, 1); s.dot(x1 + w + 1, y1 - br - 0.8, '#ff5a3a');
    }
    for (const [x, y] of [[4, 18], [3, 14]]) { s.dot(x, y, '#b6bcc4'); s.dot(x + 1, y, '#8d959e'); }
  }
  return s.render();
}

// 6. 저주받은 은룡: 은빛 갑각에 보라 저주 균열, 찢어진 날개, 붉은 눈, 목의 사슬
function cursedSilver(up, f) {
  const th = { ...DRAGON_THEMES.silver, wing: R.curseWing, wbone: R.wbone, eye: '#ff3a4a', plates: true };
  return dragonArt(th, up ? 4 : 3, f, {
    glow: 'rgba(190,110,255,0.95)', mark: ['#c07cff', '#ff8af0', '#7a3ad0'], backRamp: R.curseWing,
    post: ({ s, br }) => {
      // 날개 찢김
      for (const [x, y] of [[8, 7], [9, 8], [12, 5], [13, 6], [6, 10]]) s.set(x, y - flapOf(f) * 1.5, -1, 0);
      // 몸의 저주 균열
      for (const [x, y] of [[11, 18], [12, 19], [13, 18], [14, 20], [17, 17], [18, 18], [23, 8], [24, 9]]) { s.dot(x, y - br, '#c07cff'); }
      s.light(13, 19 - br, 'rgba(190,110,255,0.7)', 3);
      // 목의 사슬
      for (let k = 0; k < 4; k++) s.dot(19 + k, 14 - k * 1.2 - br, k % 2 ? '#8e9bb0' : '#c4cfde');
      s.light(25.5, 6.5 - br, 'rgba(255,60,80,0.8)', 2.2);
      if (up) {
        // 폴른 플래티넘: 부서진 후광
        for (const [x, y] of [[18, 0], [20, -0], [22, 0], [26, 0], [28, 1], [29, 3]]) s.dot(x, y + 1, '#f4f8ff');
        s.light(23, 1, 'rgba(230,240,255,0.7)', 5);
      }
    },
  });
}

// 7. 역병의 군주: 웅크린 몸에 누더기 날개를 망토처럼 두르고, 해골 가면, 주변에 독기 구름
function plagueLord(up, f) {
  const s = new Sprite(32, 32);
  const br = bob(f);
  const CL = s.addPart(R.miasma, { layer: 0 }), RAG = s.addPart(R.rag, { layer: 1 });
  const BODY = s.addPart(R.plague, { layer: 2 }), BELLY = s.addPart(R.plagueBelly, { layer: 3 });
  const HEAD = s.addPart(R.plague, { layer: 4 }), MASK = s.addPart(R.bone, { layer: 5 }), HORN = s.addPart(R.bone, { layer: 6 });
  // 독기 구름
  const k = f % 4;
  for (const [x, y, r] of [[4, 24, 3.4], [27, 27, 3], [3, 12, 2.4], [29, 18, 2.2]]) s.ellipse(CL, x + (k % 2), y - (k > 1 ? 1 : 0), r, r * 0.75, { flat: 0.5, bias: 0.1 });
  // 누더기 망토 날개 (아래가 찢어진 모양)
  s.poly(RAG, [[11, 8 - br], [5, 12], [3, 20], [4, 27], [6, 25], [8, 28], [10, 25], [12, 28.5], [14, 25], [16, 15 - br]], { base: 0.45, grad: [0.02, 0.025] });
  // 부푼 몸
  s.ellipse(BODY, 15, 20 - br, up ? 8.5 : 7.5, up ? 7.5 : 6.8);
  s.ellipse(BELLY, 17, 22 - br, 4.8, 4.2, { bias: 0.05 });
  for (const [x, y] of [[15, 18], [18, 25], [12, 23]]) { s.dot(x, y - br, '#9cd640'); s.light(x, y - br, 'rgba(150,230,60,0.55)', 1.6); }
  // 굽은 목, 낮은 머리
  s.limb(BODY, 19, 16 - br, 23, 14 - br, 2.6, 2.2);
  s.ellipse(HEAD, 25, 15 - br, 3.8, 3.2);
  // 해골 가면
  s.ellipse(MASK, 26.5, 15 - br, 3.4, 2.8, { bias: 0.1 });
  s.dot(26, 14.5 - br, '#1a1010'); s.dot(28, 14.5 - br, '#1a1010');
  s.dot(26, 14 - br, '#b6ff5a'); s.light(26, 14.5 - br, 'rgba(160,255,80,0.9)', 2.4);
  for (const x of [25.5, 27, 28.5]) s.dot(x, 17 - br, '#2a2018');
  // 뼈 뿔
  s.limb(HORN, 24, 12.5 - br, 21, 9 - br, 0.9, 0.35); s.limb(HORN, 26, 12 - br, 26.5, 8.5 - br, 0.8, 0.3);
  if (up) { s.limb(HORN, 23, 13 - br, 19, 11.5 - br, 0.8, 0.3); s.limb(HORN, 27.5, 12.5 - br, 29.5, 9.5 - br, 0.7, 0.3); s.light(16, 20, 'rgba(150,230,60,0.45)', 12); }
  // 다리
  const LG = s.addPart(R.plague, { layer: 3 });
  s.limb(LG, 12, 25, 11, 29, 2, 1.6); s.limb(LG, 19, 25, 20, 29, 2, 1.6);
  for (const x of [10, 12, 19, 21]) s.dot(x, 30, '#cec4a6');
  return s.render();
}

// 8. 로열 슬레이어: 두 발로 선 기사 드래곤. 금빛 갑옷, 망토, 땅을 짚은 거대한 대검
function royalSlayer(up, f) {
  const s = new Sprite(32, 32);
  const br = bob(f);
  const CAPE = s.addPart(R.cape, { layer: 0 }), TAIL = s.addPart(R.royalB, { layer: 0 });
  const LEG = s.addPart(R.royalB, { layer: 1 }), ARMOR = s.addPart(R.gold, { layer: 2 });
  const BODY = s.addPart(R.royalB, { layer: 3 }), HEAD = s.addPart(R.royalB, { layer: 4 }), HELM = s.addPart(R.gold, { layer: 5 });
  const BLADE = s.addPart(R.steel, { layer: 6 }), HILT = s.addPart(R.gold, { layer: 7 }), ARM = s.addPart(R.royalB, { layer: 8 });
  // 망토
  s.poly(CAPE, [[10, 9 - br], [16, 9 - br], [15, 27], [11, 29], [6, 28], [7, 18]], { base: 0.45, grad: [0.02, 0.02] });
  s.limb(TAIL, 9, 24, 3, 27, 2, 1); s.limb(TAIL, 3, 27, 1, 24, 1, 0.5);
  // 다리 (두 발로 섬)
  s.limb(LEG, 12, 22, 11, 29, 2.2, 1.8); s.limb(LEG, 16, 22, 17, 29, 2.2, 1.8);
  for (const x of [10, 12, 17, 19]) s.dot(x, 30, '#f0d488');
  // 갑옷 몸통
  s.ellipse(ARMOR, 14, 17 - br, 5.2, 6.4);
  for (const y of [14, 17, 20]) for (let x = 11; x <= 17; x += 2) s.dot(x, y - br, '#fff4c4');
  s.dot(14, 15.5 - br, '#ff5a3a'); s.light(14, 15.5 - br, 'rgba(255,230,140,0.7)', 2.5);
  // 목과 투구 쓴 머리
  s.limb(BODY, 15, 11 - br, 17, 7 - br, 2, 1.8);
  s.ellipse(HEAD, 19, 6 - br, 3.6, 3);
  s.ellipse(HEAD, 22.5, 7 - br, 2.4, 1.7);
  s.poly(HELM, [[15.5, 6 - br], [17, 2 - br], [21, 2.5 - br], [22, 5 - br], [18, 4.5 - br]], { base: 0.7, grad: [-0.03, -0.04] });
  s.poly(HELM, [[16.5, 2.5 - br], [14, -0.5 - br], [18, 2 - br]], { base: 0.8 });
  s.dot(20, 5.5 - br, '#bff4ff'); s.light(20, 5.5 - br, 'rgba(200,240,255,0.8)', 2);
  // 대검: 땅을 짚고 손잡이를 잡음
  const sx = 24;
  s.poly(BLADE, [[sx - 1.2, 11], [sx + 1.2, 11], [sx + 1, 27], [sx, 30], [sx - 1, 27]], { base: 0.62, grad: [-0.08, -0.01] });
  s.limb(HILT, sx - 3.2, 10.5, sx + 3.2, 10.5, 0.8); s.limb(HILT, sx, 10, sx, 6.5, 0.7); s.ellipse(HILT, sx, 6, 1.2, 1.2);
  for (let y = 13; y < 26; y += 3) s.dot(sx - 0.4, y, '#ffffff');
  s.light(sx, 18, 'rgba(255,240,170,0.75)', up ? 7 : 5);
  // 팔
  s.limb(ARM, 17, 13 - br, sx - 1, 9.5, 1.6, 1.3);
  if (up) {
    // 임페리얼 브레이커: 왕관과 빛나는 검
    crown(s, 19, 1 - br);
    for (const [x, y] of [[sx + 3, 14], [sx - 3, 20], [sx + 2.5, 25]]) { s.dot(x, y, '#fff6c4'); s.light(x, y, 'rgba(255,240,170,0.8)', 1.6); }
  }
  return s.render();
}

// 9. 이클립스 퀸: 똬리 튼 우아한 여왕 드래곤, 머리 뒤에 검은 해와 금빛 코로나(일식)
function eclipseQueen(up, f) {
  const s = new Sprite(32, 32);
  const br = bob(f), fl = flapOf(f);
  const SUN = s.addPart(R.eclipse, { layer: 0, rim: false }), WG = s.addPart(R.queenWing, { layer: 1 });
  const BODY = s.addPart(R.pearl, { layer: 2 }), BODY2 = s.addPart(R.pearl, { layer: 3 }), HEAD = s.addPart(R.pearl, { layer: 4 });
  const HORN = s.addPart(R.gold, { layer: 5 });
  // 일식: 검은 원과 코로나
  const ex = 20, ey = 8;
  s.ellipse(SUN, ex, ey, 6.5, 6.5, { flat: 0.9 });
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2 + f * 0.1;
    const r = 7.6 + (a % 2) * 0.9;
    s.dot(ex + Math.cos(t) * r, ey + Math.sin(t) * r, a % 2 ? '#ffe066' : '#fff6c4');
  }
  s.light(ex, ey, 'rgba(255,220,110,0.95)', up ? 11 : 9);
  // 깃털 같은 날개 (등 뒤)
  for (const [x1, y1, w] of [[1, 5, 2.2], [0, 10, 2.2], [1, 15, 2], [3, 19, 1.8]]) s.limb(WG, 12, 17 - br, x1 + 1, y1 - fl * (1 - y1 / 22), w, 0.9);
  for (const [x, y] of [[5, 8], [4, 12], [5, 16]]) s.dot(x, y - fl * 0.5, '#fff8d4');
  // 똬리: 아래쪽 고리 두 개와 일어선 몸
  s.ellipse(BODY, 14, 27, 10, 3.4);
  s.ellipse(BODY2, 12, 23.5, 7.5, 3);
  s.limb(BODY2, 16, 22, 19, 15 - br, 3, 2.4);
  s.limb(BODY2, 19, 15 - br, 20, 11 - br, 2.4, 2.1);
  for (const [x, y] of [[8, 27], [12, 28], [16, 28], [20, 27], [10, 24], [14, 24]]) s.dot(x, y, '#ffe9a8');
  // 머리 (일식 앞)
  s.ellipse(HEAD, 21.5, 8.5 - br, 3.6, 3);
  s.ellipse(HEAD, 25, 9.5 - br, 2.4, 1.7);
  s.limb(HORN, 20, 6 - br, 17, 3 - br, 0.9, 0.35); s.limb(HORN, 22, 5.6 - br, 22, 2.5 - br, 0.8, 0.3);
  s.dot(22.5, 8 - br, '#ff8ad8'); s.dot(23.5, 8 - br, '#3a1030'); s.light(22.5, 8 - br, 'rgba(255,150,230,0.8)', 2);
  // 이마의 보석
  s.dot(20.5, 6.8 - br, '#ff5a8a');
  if (up) {
    // 셀레스티얼: 별 무리와 두 번째 고리
    for (const [x, y] of [[3, 4], [8, 2], [29, 3], [30, 16], [27, 22], [2, 25]]) { s.dot(x, y, '#ffffff'); s.light(x, y, 'rgba(255,250,210,0.8)', 1.8); }
    crown(s, 21, 3.5 - br, '#fff6c4', '#7ae0ff');
  }
  return s.render();
}

// 10. 헬파이어 드래곤: 검붉은 몸에 마그마 균열, 불타는 날개, 불길을 뿜는 입
function hellfire(up, f) {
  const th = { ...DRAGON_THEMES.red, body: R.hell, belly: R.magma, wing: R.flameMem, wbone: R.hell, horn: R.bone, eye: '#ffe066', spikes: 'bone' };
  return dragonArt(th, up ? 4 : 4, f, {
    glow: 'rgba(255,120,30,1)', mark: ['#ffa21c', '#ffe066', '#ff5a10'], backRamp: R.flameMem,
    post: ({ s, br }) => {
      const k = f % 4;
      // 날개 끝 불꽃
      for (const [x, y] of [[4, -1], [9, -3], [15, -1], [21, 5]]) { const h = 1 + ((x + k) % 3); for (let d = 0; d < h; d++) s.dot(x, y + 1 - d + flapOf(f) * 1.5, d ? '#ffe066' : '#ff8a2a'); }
      // 몸의 마그마 균열
      for (const [x, y] of [[9, 18], [10, 19], [11, 18], [13, 21], [14, 22], [17, 17], [18, 18]]) s.dot(x, y - br, '#ff7a1a');
      s.light(13, 19 - br, 'rgba(255,110,20,0.7)', 4);
      // 불길 숨결
      const len = up ? 4 : 3;
      for (let d = 0; d <= len; d++) { s.dot(31 - (d === 0 ? 0 : 0), 9 + d - br, ['#fffbd0', '#ffe066', '#ffa21c', '#ff5a10', '#c0360a'][d]); }
      s.light(31, 11 - br, 'rgba(255,150,40,0.95)', up ? 6 : 4.5);
      if (up) { for (const [x, y] of [[2, 29], [8, 30], [26, 30]]) { s.dot(x, y - (k % 2), '#ffa21c'); s.light(x, y, 'rgba(255,120,30,0.6)', 2); } crown(s, 23, 1, '#ff8a2a', '#fffbd0'); }
    },
  });
}

// 11. 블리자드 웜: 다리도 날개도 없는 거대한 얼음 뱀(웜). 똬리, 서리 갈기, 눈보라
function blizzard(up, f) {
  const s = new Sprite(32, 32);
  const br = bob(f);
  const B1 = s.addPart(R.wyrm, { layer: 1 }), B2 = s.addPart(R.wyrm, { layer: 2 }), BL = s.addPart(R.wyrmBelly, { layer: 3 });
  const B3 = s.addPart(R.wyrm, { layer: 4 }), HEAD = s.addPart(R.wyrm, { layer: 5 }), MANE = s.addPart(R.crystal, { layer: 4 });
  // 아래 똬리
  s.ellipse(B1, 15, 26.5, 12, 3.6);
  s.limb(B2, 4, 25, 2, 21, 2.2, 1.2);
  s.ellipse(B2, 18, 22.5, 9, 3.4);
  s.ellipse(BL, 19, 24, 6.5, 1.4, { bias: 0.05 });
  // 일어선 몸 (S자)
  s.limb(B3, 24, 21, 26, 15 - br, 3.2, 2.8);
  s.limb(B3, 26, 15 - br, 22, 10 - br, 2.8, 2.5);
  // 등 서리 갈기
  for (const [x, y, h] of [[27.5, 17, 3], [28, 13, 3.5], [25.5, 9.5, 4], [12, 20, 2.5], [16, 19.5, 2.8], [20, 19.8, 2.5]]) s.poly(MANE, [[x - 1, y - br], [x + 0.6, y - h - br], [x + 1.4, y - br]], { base: 0.75, grad: [-0.06, -0.03] });
  // 머리 (왼쪽 아래를 노려봄 → 오른쪽 보기로 통일: 앞으로 내민 머리)
  s.ellipse(HEAD, 21, 7.5 - br, 4, 3.2);
  s.ellipse(HEAD, 25, 8.5 - br, 2.8, 1.9);
  s.limb(MANE, 19, 5 - br, 15, 2 - br, 1.1, 0.4); s.limb(MANE, 21, 4.6 - br, 20, 1 - br, 1, 0.4);
  s.dot(22, 7 - br, '#e0f6ff'); s.dot(23, 7 - br, '#0a1838'); s.light(22.5, 7 - br, 'rgba(180,235,255,0.9)', 2.4);
  s.dot(27, 9.5 - br, '#e8f8ff'); s.dot(28, 10 - br, '#ffffff');
  // 눈송이
  const k = f % 4;
  for (const [x, y] of [[3, 5], [9, 3], [30, 4], [6, 13], [30, 26], [11, 16]]) { const yy = (y + k) % 30; s.dot(x, yy, '#ffffff'); }
  s.light(16, 16, 'rgba(160,220,255,0.4)', up ? 13 : 9);
  if (up) crown(s, 20, 2 - br, '#cdeeff', '#4aa8ff');
  return s.render();
}

// 12. 템페스트 드래곤: 먹구름 날개, 몸을 감는 번개, 전기 눈
function tempest(up, f) {
  const s = new Sprite(32, 32);
  const br = bob(f), fl = flapOf(f);
  const CLB = s.addPart(R.cloud, { layer: 0 }), TAIL = s.addPart(R.storm, { layer: 1 });
  const BODY = s.addPart(R.storm, { layer: 2 }), BELLY = s.addPart(R.stormBelly, { layer: 3 });
  const LEG = s.addPart(R.storm, { layer: 3 }), HEAD = s.addPart(R.storm, { layer: 4 }), HORN = s.addPart(R.stormBelly, { layer: 5 });
  const CLF = s.addPart(R.cloud, { layer: 6 });
  // 먹구름 날개 (뒤)
  for (const [x, y, r] of [[8, 8, 4.5], [4, 11, 3.4], [12, 5, 3.4]]) s.ellipse(CLB, x, y - fl * 0.6, r, r * 0.75, { flat: 0.3 });
  // 꼬리 (번개 모양으로 꺾임)
  s.limb(TAIL, 8, 21, 4, 19, 2.2, 1.6); s.limb(TAIL, 4, 19, 3, 24, 1.6, 1); s.limb(TAIL, 3, 24, 0.5, 22, 1, 0.5);
  // 날렵한 몸 (앞으로 기울어 달려드는 자세)
  s.ellipse(BODY, 14, 19.5 - br, 7.5, 4.6);
  s.ellipse(BELLY, 16, 21.5 - br, 5, 2.2, { bias: 0.05 });
  s.limb(LEG, 10, 22, 8, 29, 1.9, 1.4); s.limb(LEG, 18, 22, 21, 28.5, 2, 1.4);
  s.limb(BODY, 19, 17 - br, 23, 11 - br, 2.6, 2.1);
  s.ellipse(HEAD, 24.5, 9.5 - br, 3.8, 3);
  s.ellipse(HEAD, 28, 10.5 - br, 2.6, 1.7);
  s.limb(HORN, 22.5, 7 - br, 19, 4.5 - br, 0.9, 0.3); s.limb(HORN, 24.5, 6.6 - br, 25, 3.2 - br, 0.8, 0.3);
  // 먹구름 날개 (앞)
  for (const [x, y, r] of [[15, 10, 4], [19, 7, 3], [11, 12, 3]]) s.ellipse(CLF, x, y - fl, r, r * 0.7, { flat: 0.3, bias: 0.05 });
  // 몸의 파란 줄무늬
  for (const [x, y] of [[10, 18], [13, 17], [16, 17], [19, 18]]) s.dot(x, y - br, '#62c0dc');
  // 전기 눈
  s.dot(25, 8.8 - br, '#ffffff'); s.dot(26, 8.8 - br, '#7af0ff'); s.light(25.5, 9 - br, 'rgba(130,240,255,0.95)', 2.6);
  // 번개 (프레임마다 위치가 바뀌며 번쩍)
  const bolts = [[[17, 3], [16, 5], [18, 6], [17, 8]], [[6, 14], [8, 15], [7, 17], [9, 18]], [[27, 14], [29, 16], [28, 17], [30, 19]]];
  const shown = up ? bolts : bolts.filter((_, i) => (i + f) % 2 === 0);
  for (const bl of shown) { for (const [x, y] of bl) s.dot(x, y, '#fff07a'); const [lx, ly] = bl[1]; s.light(lx, ly, 'rgba(255,240,120,0.9)', 2.6); }
  if (up) { for (const [x, y] of [[21, 23], [23, 24], [22, 26], [24, 27]]) s.dot(x, y, '#fff07a'); s.light(16, 16, 'rgba(150,170,255,0.45)', 12); crown(s, 24, 4 - br, '#fff07a', '#7af0ff'); }
  return s.render();
}

export const COMBO_ART = {
  pixieSwarm, frozen, acid, shadowWyvern, basilisk, cursedSilver, plagueLord, royalSlayer, eclipseQueen, hellfire, blizzard, tempest,
};
