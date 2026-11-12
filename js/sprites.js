// 도트 스프라이트. 문자 하나가 픽셀 하나. 외곽선은 자동으로 그린다.
// 드래곤 역할: b 몸, d 그림자, l 배, w 날개, x 날개 그림자, h 뿔·발톱, e 눈
import { DRAGONS, COMBO_BY_ID, ELEMENTS } from './data.js';

const OUTLINE = '#160f1c';

export const DRAGON_ART = [
  // 0 알
  [
    '................',
    '................',
    '................',
    '.......bb.......',
    '......bbbb......',
    '.....bblbbb.....',
    '.....blbbdb.....',
    '....bbbbbbbb....',
    '....bdbbbbbb....',
    '....bbbbldbb....',
    '....bbbbbbbb....',
    '....bbdbbbdb....',
    '.....bbbbbd.....',
    '.....ddbbdd.....',
    '................',
    '................',
  ],
  // 1 해츨링
  [
    '................',
    '................',
    '................',
    '.........h..h...',
    '........bbbbb...',
    '.......bbbbebb..',
    '.......bbbbbbbb.',
    '...ww..bblbbdd..',
    '..wxw..blllbb...',
    '..wwxbbblllbb...',
    '...bbbbbllbbb...',
    '...bbbbbllbbb...',
    '...dbbbbbbbbd...',
    '....hddbbbdh....',
    '................',
    '................',
  ],
  // 2 어린 비룡
  [
    '................',
    '..w..........h..',
    '..ww........bbh.',
    '..wxw......bbbbb',
    '..wxxw....bbebbl',
    '...wxxw..bbbbbl.',
    '....wxxbbbbb....',
    '.....bbbbbbb....',
    '...bbbbllllbb...',
    '.bbbbbbllllbb...',
    'bb..bbbllllbb...',
    'b....bbbbbbbd...',
    '.....bd...bd....',
    '.....hh...hh....',
    '................',
    '................',
  ],
  // 3 성체 드래곤
  [
    'w.............h.',
    'ww..........hh..',
    'wxw.........bbb.',
    'wxxw.......bbebb',
    'wxxxw.....bbbbbl',
    '.wxxxw...bbbbl..',
    '..wxxxwbbbbb....',
    '...wwbbbbbbb....',
    '....bbbllllbbb..',
    '..bbbbbllllbbbd.',
    '.bbbbbbllllbbbd.',
    'bb..bbbbllbbbd..',
    'b...dbbbbbbbd...',
    '....bd.....bd...',
    '....hh.....hh...',
    '................',
  ],
  // 4 고위 드래곤
  [
    '.w.....h...h....',
    'www....hb..hb...',
    'wxww...bbbbbbb..',
    'wxxww.bbbebbbbb.',
    'wxxxwwbbbbbbblll',
    '.wxxxwbbbbbb..ll',
    '..wxxxbbbbb.....',
    '...wxbbbbbbbbw..',
    '...bbbbllllbbww.',
    '..bbbbbllllbbwxw',
    '.bbbbbbllllbbwxw',
    'bb.bbbbllllbbbww',
    'b..dbbbbbbbbbd..',
    '...bd..bd..bd...',
    '...hh..hh..hh...',
    '................',
  ],
];

// 몬스터 역할: b 옷, d 옷 그림자, s 피부, a 장비, e 눈, w 날개
const MONSTER_ART = {
  normal: [
    '................',
    '................',
    '......aaa.......',
    '.....aaaaa......',
    '.....sesss......',
    '.....sssss......',
    '......sss.......',
    '....bbbbbbb.....',
    '...sbbbbbbbs....',
    '...sbbbabbbs....',
    '....bbbbbbb.....',
    '....bbb.bbb.....',
    '....dd...dd.....',
    '....dd...dd.....',
    '...ddd...ddd....',
    '................',
  ],
  fast: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '..........aa....',
    '.........sssa...',
    '.........sess...',
    '..bbbbbbbsss....',
    '.bbbbbbbbbb.....',
    'b.bbbbbbbbd.....',
    '..dd..d..dd.....',
    '..d...d...d.....',
    '..s...s...s.....',
    '................',
    '................',
  ],
  armored: [
    '................',
    '.....aaaa.......',
    '....aaaaaa......',
    '....aeaaea......',
    '....aaaaaa......',
    '..aabbbbbbaa....',
    '.aaabbbbbbaaaa..',
    '.aaabbaabbaaaaa.',
    '.aaabbbbbbaaaaa.',
    '.aa.bbbbbb.aaa..',
    '....bbbbbb......',
    '....dddddd......',
    '....dd..dd......',
    '....aa..aa......',
    '...aaa..aaa.....',
    '................',
  ],
  flying: [
    '................',
    '................',
    'ww............ww',
    'www....aa....www',
    '.www..sess..www.',
    '..wwwwssssww ww.',
    '...wwwbbbbwww...',
    '....wwbbbbww....',
    '......bbbb......',
    '......bddb......',
    '.......dd.......',
    '.......d........',
    '................',
    '................',
    '................',
    '................',
  ],
  boss: [
    '....a.a.a.a.....',
    '....aaaaaaa.....',
    '....sssssss.....',
    '....sesssse.....',
    '....sssssss.....',
    '..bbbbbbbbbbb...',
    '.sbbbbbaabbbbs..',
    'ssbbbbaaaabbbss.',
    'ssbbbbbaabbbbss.',
    '.sbbbbbbbbbbbs..',
    '...bbbbbbbbbb...',
    '...dddd..dddd...',
    '...dddd..dddd...',
    '...ddd....ddd...',
    '..aaaa....aaaa..',
    '................',
  ],
};

export const RACE_PAL = {
  human: { b: '#3d6fb8', d: '#24406e', s: '#f0c39a', a: '#c9d1d9', e: '#1b1b1b', w: '#d8c8a0' },
  demon: { b: '#7a1f2b', d: '#4a0f18', s: '#e0503a', a: '#2b1a1a', e: '#ffe14a', w: '#5a2030' },
  fairy: { b: '#2f8f7a', d: '#1a5a4c', s: '#b8f0a8', a: '#ffd86a', e: '#2a1a40', w: '#c8f8ff' },
};
// 종족별 덧그림: 악마 뿔, 요정 더듬이
const RACE_EXTRA = {
  demon: { normal: [[4, 1], [8, 1], [4, 2], [8, 2]], armored: [[3, 0], [8, 0]], boss: [[3, 0], [11, 0]], fast: [[12, 4]], flying: [[6, 2], [9, 2]] },
  fairy: { normal: [[5, 0], [8, 0], [5, 1], [8, 1]], armored: [[4, 0], [7, 0]], boss: [[5, 0], [9, 0]], fast: [[13, 4]], flying: [[6, 1], [9, 1]] },
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// 문자 그림을 캔버스로. pal: 역할 → 색. 외곽선 자동
function renderArt(art, pal, opts = {}) {
  const h = art.length, w = art[0].length;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && art[y][x] !== '.' && art[y][x] !== ' ';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (filled(x, y)) {
      const ch = art[y][x];
      g.fillStyle = ch === 'e' ? (pal.e || '#fff6c4') : (pal[ch] || pal.b);
      g.fillRect(x, y, 1, 1);
    } else if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) {
      g.fillStyle = opts.outline || OUTLINE;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

export function dragonSprite(type, grade) {
  return cached(`d:${type}:${grade}`, () => renderArt(DRAGON_ART[grade], { ...DRAGONS[type].pal, e: '#fff6c4' }));
}

// 조합 드래곤: 재료 색을 섞고, 가슴에 보석, 업그레이드하면 왕관과 빛
export function comboSprite(id, up) {
  return cached(`c:${id}:${up}`, () => {
    const c = COMBO_BY_ID[id];
    if (id === 'sealedRed') {
      const g = up === 0 ? 1 : up === 1 ? 3 : 4;
      const base = renderArt(DRAGON_ART[g], { ...DRAGONS.red.pal, e: '#fff6c4' });
      const out = makeCanvas(16, 16);
      const x = out.getContext('2d');
      x.drawImage(base, 0, 0);
      if (up === 0) chains(x);
      if (up >= 2) {
        x.fillStyle = '#ffe066';
        x.fillRect(0, 14, 1, 1); x.fillRect(1, 13, 1, 3); x.fillRect(2, 14, 1, 1);
        x.fillRect(14, 12, 1, 1); x.fillRect(13, 13, 3, 1); x.fillRect(14, 14, 1, 1);
      }
      return out;
    }
    const p1 = DRAGONS[c.recipe[0][1]].pal, p2 = DRAGONS[c.recipe[1][1]].pal, p3 = DRAGONS[c.recipe[2][1]].pal;
    const pal = { b: p1.b, d: p1.d, l: p3.l, w: p2.w, x: p2.x, h: p2.h, e: '#fff6c4' };
    const g = c.tier === 0 ? 3 : 4;
    const base = renderArt(DRAGON_ART[g], pal);
    const out = makeCanvas(16, 16);
    const x = out.getContext('2d');
    x.drawImage(base, 0, 0);
    // 가슴의 속성 문양 (마름모)
    const ec = ELEMENTS[c.elem].color;
    x.fillStyle = ec;
    x.fillRect(9, 9, 1, 1); x.fillRect(8, 10, 3, 1); x.fillRect(9, 11, 1, 1);
    if (up) {
      // 업그레이드: 금관과 반짝임
      x.fillStyle = OUTLINE; x.fillRect(0, 13, 4, 3);
      x.fillStyle = '#ffe066'; x.fillRect(0, 14, 1, 1); x.fillRect(2, 14, 1, 1); x.fillRect(1, 15, 3, 1); x.fillRect(3, 13, 1, 1);
      x.fillStyle = '#fff6c4'; x.fillRect(14, 12, 1, 1); x.fillRect(13, 13, 3, 1); x.fillRect(14, 14, 1, 1);
    }
    return out;
  });
}

function glow(x, base, color, alpha = 1) {
  const s = makeCanvas(16, 16);
  const g = s.getContext('2d');
  g.drawImage(base, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, 16, 16);
  x.save();
  x.globalAlpha = alpha * 0.6;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) x.drawImage(s, dx, dy);
  x.restore();
}

function chains(x) {
  x.fillStyle = '#b07cff';
  for (let i = 0; i < 16; i += 2) { x.fillRect(i, 9, 1, 1); x.fillRect(i + 1, 10, 1, 1); }
  x.fillStyle = '#3f2466';
  x.fillRect(6, 9, 2, 3);
}

export function towerSprite(t) {
  return t.kind === 'combo' ? comboSprite(t.type, t.up) : dragonSprite(t.type, t.grade);
}

export function monsterSprite(kind, race) {
  return cached(`m:${kind}:${race}`, () => {
    const art = MONSTER_ART[kind].map((r) => r.padEnd(16, '.').slice(0, 16));
    const extra = (RACE_EXTRA[race] || {})[kind] || [];
    const rows = art.map((r) => r.split(''));
    for (const [x, y] of extra) if (rows[y]) rows[y][x] = race === 'demon' ? 'h' : 'a';
    const pal = { ...RACE_PAL[race], h: '#f0e0c0' };
    return renderArt(rows.map((r) => r.join('')), pal);
  });
}

// 3x5 숫자 글꼴
const DIGITS = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'], '+': ['000', '010', '111', '010', '000'], '-': ['000', '000', '111', '000', '000'],
  '!': ['010', '010', '010', '000', '010'],
};
export function drawText(g, text, x, y, color, shadow = '#160f1c') {
  const s = String(text);
  const w = s.length * 4 - 1;
  let px = Math.round(x - w / 2);
  const py = Math.round(y);
  for (const ch of s) {
    const d = DIGITS[ch];
    if (d) for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (d[r][c] === '1') {
      if (shadow) { g.fillStyle = shadow; g.fillRect(px + c + 1, py + r + 1, 1, 1); }
      g.fillStyle = color; g.fillRect(px + c, py + r, 1, 1);
    }
    px += 4;
  }
}

// 지형 타일 (16x16, 결정적 난수)
function hash(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  return () => {
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    h ^= h >>> 16;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export function drawTerrainTile(g, type, x, y, seed, grid, cols, rows) {
  const r = hash(x + 1, y + 1, seed);
  const px = x * 16, py = y * 16;
  const GRASS = ['#3e6b3a', '#43723d', '#3a6536'];
  g.fillStyle = GRASS[Math.floor(r() * 3)];
  g.fillRect(px, py, 16, 16);
  for (let i = 0; i < 10; i++) {
    g.fillStyle = r() < 0.5 ? '#4f8546' : '#335a30';
    g.fillRect(px + Math.floor(r() * 16), py + Math.floor(r() * 16), 1, r() < 0.4 ? 2 : 1);
  }
  if (type === 4) { // 고지대: 밝은 풀 언덕, 가장자리 경사
    const at = (xx, yy) => xx >= 0 && yy >= 0 && xx < cols && yy < rows && grid[yy * cols + xx] === 4;
    g.fillStyle = '#5b8f45'; g.fillRect(px, py, 16, 16);
    for (let i = 0; i < 12; i++) { g.fillStyle = r() < 0.5 ? '#6fa652' : '#4f7f3c'; g.fillRect(px + Math.floor(r() * 16), py + Math.floor(r() * 16), 1, r() < 0.4 ? 2 : 1); }
    g.fillStyle = '#86bd62';
    if (!at(x, y - 1)) g.fillRect(px, py, 16, 2);
    if (!at(x - 1, y)) g.fillRect(px, py, 2, 16);
    g.fillStyle = '#365c2c';
    if (!at(x, y + 1)) g.fillRect(px, py + 13, 16, 3);
    if (!at(x + 1, y)) g.fillRect(px + 14, py, 2, 16);
    g.fillStyle = '#2c4a24';
    if (!at(x, y + 1)) g.fillRect(px, py + 15, 16, 1);
  } else if (type === 3) { // 진흙
    g.fillStyle = '#5a4430'; g.fillRect(px, py, 16, 16);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#463424';
      const w = 3 + Math.floor(r() * 4);
      g.fillRect(px + Math.floor(r() * (16 - w)), py + Math.floor(r() * 14), w, 2);
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = '#76593d'; g.fillRect(px + Math.floor(r() * 16), py + Math.floor(r() * 16), 1, 1); }
  } else if (type === 2) { // 물
    g.fillStyle = '#25537a'; g.fillRect(px, py, 16, 16);
    const at = (xx, yy) => xx >= 0 && yy >= 0 && xx < cols && yy < rows && grid[yy * cols + xx] === 2;
    g.fillStyle = '#6ea8c8';
    if (!at(x, y - 1)) g.fillRect(px, py, 16, 1);
    if (!at(x, y + 1)) g.fillRect(px, py + 15, 16, 1);
    if (!at(x - 1, y)) g.fillRect(px, py, 1, 16);
    if (!at(x + 1, y)) g.fillRect(px + 15, py, 1, 16);
  } else if (type === 1) { // 바위
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(px + 3, py + 12, 11, 2);
    const art = [
      '................', '................', '................', '.....dddd.......', '...ddbbbbd......',
      '..dbblllbbd.....', '..dbllbbbbdd....', '.dbbbbbbbbbbd...', '.dbbbbbbbbbbbd..', '.dbbbbbbbdbbbd..',
      '..dbbbbbbbbbd...', '...ddbbbbbdd....', '.....ddddd......', '................', '................', '................',
    ];
    const pal = { b: '#7d8790', d: '#4c555c', l: '#a9b3ba' };
    const s = cached('rock', () => renderArt(art, pal));
    g.drawImage(s, px + (r() < 0.5 ? 0 : 1), py);
  }
}

export function stoneSprite() {
  return cached('stone', () => {
    const c = makeCanvas(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = OUTLINE; g.fillRect(1, 1, 14, 14);
    g.fillStyle = '#6b7380'; g.fillRect(2, 2, 12, 12);
    g.fillStyle = '#8b94a3'; g.fillRect(2, 2, 12, 1); g.fillRect(2, 2, 1, 12);
    g.fillStyle = '#4a515c'; g.fillRect(2, 13, 12, 1); g.fillRect(13, 2, 1, 12);
    g.fillStyle = '#4a515c';
    g.fillRect(2, 6, 12, 1); g.fillRect(2, 10, 12, 1);
    g.fillRect(7, 2, 1, 4); g.fillRect(5, 7, 1, 3); g.fillRect(10, 7, 1, 3); g.fillRect(8, 11, 1, 2);
    return c;
  });
}

export function flagSprite(n) {
  return cached(`flag:${n}`, () => {
    const c = makeCanvas(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,207,92,0.18)'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = OUTLINE; g.fillRect(4, 2, 3, 13);
    g.fillStyle = '#d9c7a0'; g.fillRect(5, 3, 1, 12);
    g.fillStyle = OUTLINE; g.fillRect(6, 2, 9, 8);
    g.fillStyle = '#ffcf5c'; g.fillRect(6, 3, 8, 6);
    g.fillStyle = '#e0a92a'; g.fillRect(6, 8, 8, 1);
    drawText(g, n, 10, 4, '#3a2306', null);
    return c;
  });
}

export function portalSprite() {
  return cached('portal', () => {
    const c = makeCanvas(16, 16);
    const g = c.getContext('2d');
    const art = ['................', '.....dddddd.....', '...ddbbbbbbdd...', '..dbbllllllbbd..', '..dbl......lbd..',
      '.dbl..pppp..lbd.', '.dbl.pp..pp.lbd.', '.dbl.p....p.lbd.', '.dbl.p....p.lbd.', '.dbl.pp..pp.lbd.',
      '.dbl..pppp..lbd.', '..dbl......lbd..', '..dbbllllllbbd..', '...ddbbbbbbdd...', '.....dddddd.....', '................'];
    g.drawImage(renderArt(art, { d: '#2e1a4a', b: '#7a4ab0', l: '#c69cff', p: '#ff8ad8' }), 0, 0);
    return c;
  });
}

export function gateSprite() {
  return cached('gate', () => {
    const art = ['................', '..a.a.a..a.a.a..', '..aaaaa..aaaaa..', '..abbba..abbba..', '..abbbaaaabbba..',
      '..abbbbbbbbbba..', '..abbbddddbbba..', '..abbdddddbbba..', '..abbdd..ddbba..', '..abbd....dbba..',
      '..abbd....dbba..', '..abbd....dbba..', '..abbd....dbba..', '..aaaa....aaaa..', '................', '................'];
    return renderArt(art, { a: '#8a94a0', b: '#c9d1d9', d: '#3a2a20' });
  });
}

// 작은 아이콘 캔버스 (UI용): 스프라이트를 배율로 키워 반환
export function iconCanvas(sprite, scale = 3) {
  const c = makeCanvas(16 * scale, 16 * scale);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, 0, 0, 16 * scale, 16 * scale);
  c.className = 'px';
  return c;
}
