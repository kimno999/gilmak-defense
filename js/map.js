// 맵 생성과 길찾기
// 경로 비용: 빈칸 1, 진흙 2, 돌 STONE_COST, 드래곤 DRAGON_COST, 바위·물은 지날 수 없음.
// 이 비용 덕분에 몬스터는 (1) 뚫린 길이 있으면 아무리 멀어도 그 길로,
// (2) 없으면 부술 돌이 가장 적은 길로, (3) 그래도 없으면 드래곤까지 부수는 길로 간다. (규칙 6)
import { COLS, ROWS, N, T, CHECKPOINTS } from './data.js';

export const STONE_COST = 1000;
export const DRAGON_COST = 1e6;
export const OCC = { EMPTY: 0, STONE: 1, DRAGON: 2 };

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const idx = (x, y) => y * COLS + x;
export const cx = (i) => i % COLS;
export const cy = (i) => (i / COLS) | 0;

const BIOMES = [
  { key: 'meadow', name: '초원', rock: [3, 5], water: [2, 3], mud: [2, 3], hill: [4, 5] },
  { key: 'canyon', name: '바위 협곡', rock: [10, 13], water: [1, 2], mud: [2, 3], hill: [3, 4] },
  { key: 'lake', name: '호수 지대', rock: [3, 4], water: [5, 7], mud: [2, 3], hill: [3, 4] },
  { key: 'swamp', name: '진흙 늪', rock: [3, 4], water: [2, 3], mud: [7, 9], hill: [2, 3] },
  { key: 'highland', name: '고원', rock: [3, 5], water: [2, 3], mud: [2, 3], hill: [8, 10] },
  { key: 'mixed', name: '혼합 지형', rock: [5, 7], water: [3, 4], mud: [3, 5], hill: [4, 6] },
];

export function genStage(stage, seed) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const id = ((seed * 1315423911) ^ (stage * 2654435761) ^ (attempt * 40503)) >>> 0;
    const rnd = mulberry32(id);
    const biome = stage === 1 ? BIOMES[0] : BIOMES[1 + Math.floor(rnd() * (BIOMES.length - 1))];
    const grid = new Uint8Array(N);
    const rr = (a) => a[0] + Math.floor(rnd() * (a[1] - a[0] + 1));
    const blob = (type, count, rmin, rmax, onlyGrass) => {
      for (let k = 0; k < count; k++) {
        const bx = Math.floor(rnd() * COLS), by = Math.floor(rnd() * ROWS);
        const r = rmin + rnd() * (rmax - rmin);
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          const d = Math.hypot(x - bx, y - by) + (rnd() - 0.5) * 0.9;
          if (d < r) { const i = idx(x, y); if (!onlyGrass || grid[i] === T.GRASS) grid[i] = type; }
        }
      }
    };
    blob(T.WATER, rr(biome.water), 0.9, 2.0, false);
    blob(T.ROCK, rr(biome.rock), 0.6, 1.4, false);
    blob(T.MUD, rr(biome.mud), 1.0, 2.2, true);
    blob(T.HILL, rr(biome.hill), 0.9, 1.8, true);

    const sy = 2 + Math.floor(rnd() * (ROWS - 4));
    const gy = 2 + Math.floor(rnd() * (ROWS - 4));
    const flags = [];
    let top = rnd() < 0.5;
    for (let k = 0; k < CHECKPOINTS; k++) {
      let fx = Math.round(((k + 1) * (COLS - 1)) / (CHECKPOINTS + 1) + (rnd() - 0.5) * 2);
      fx = Math.max(3, Math.min(COLS - 4, fx));
      const fy = top ? 1 + Math.floor(rnd() * 3) : ROWS - 2 - Math.floor(rnd() * 3);
      top = !top;
      flags.push({ x: fx, y: fy });
    }
    const keyCells = [{ x: 0, y: sy }, ...flags, { x: COLS - 1, y: gy }];
    // 깃발과 출발·도착 주변은 풀로 비워서 바로 막히지 않게 한다
    for (const c of keyCells) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = c.x + dx, y = c.y + dy;
        if (x >= 0 && y >= 0 && x < COLS && y < ROWS) grid[idx(x, y)] = T.GRASS;
      }
    }
    const points = keyCells.map((c) => idx(c.x, c.y));
    const map = { grid, spawn: keyCells[0], goal: keyCells[keyCells.length - 1], flags, points, biome: biome.name, biomeKey: biome.key, id, stage };
    const fields = computeFields(map, new Uint8Array(N));
    if (!fields) continue;
    // 자연 지형만으로 길이 막히면 안 된다 (돌을 부숴야 하는 상태면 실패)
    let ok = true;
    for (let k = 0; k < fields.length; k++) if (fields[k].dist[points[k]] >= STONE_COST) ok = false;
    if (!ok) continue;
    let build = 0;
    for (let i = 0; i < N; i++) if ((grid[i] === T.GRASS || grid[i] === T.HILL) && points.indexOf(i) < 0) build++;
    if (build < 200) continue;
    return map;
  }
  throw new Error('맵 생성 실패');
}

export function isBuildable(map, i) {
  const t = map.grid[i];
  return (t === T.GRASS || t === T.HILL) && map.points.indexOf(i) < 0;
}

function buildCost(map, occ) {
  const c = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const t = map.grid[i];
    if (t === T.ROCK || t === T.WATER) c[i] = Infinity;
    else if (occ[i] === OCC.STONE) c[i] = STONE_COST;
    else if (occ[i] === OCC.DRAGON) c[i] = DRAGON_COST;
    else c[i] = t === T.MUD ? 2 : 1;
  }
  return c;
}

// 최소 힙 다익스트라. dist[i] = i에서 goal까지의 비용 (i 자신 포함, goal 제외)
function dijkstra(cost, goal) {
  const dist = new Float64Array(N).fill(Infinity);
  const heapI = new Int32Array(N * 4 + 8), heapD = new Float64Array(N * 4 + 8);
  let size = 0;
  const push = (i, d) => {
    let k = size++;
    heapI[k] = i; heapD[k] = d;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (heapD[p] <= heapD[k]) break;
      [heapI[p], heapI[k]] = [heapI[k], heapI[p]];
      [heapD[p], heapD[k]] = [heapD[k], heapD[p]];
      k = p;
    }
  };
  const pop = () => {
    const i = heapI[0], d = heapD[0];
    size--;
    heapI[0] = heapI[size]; heapD[0] = heapD[size];
    let k = 0;
    for (;;) {
      const l = 2 * k + 1, r = l + 1;
      let m = k;
      if (l < size && heapD[l] < heapD[m]) m = l;
      if (r < size && heapD[r] < heapD[m]) m = r;
      if (m === k) break;
      [heapI[m], heapI[k]] = [heapI[k], heapI[m]];
      [heapD[m], heapD[k]] = [heapD[k], heapD[m]];
      k = m;
    }
    return [i, d];
  };
  dist[goal] = 0;
  push(goal, 0);
  while (size) {
    const [i, d] = pop();
    if (d > dist[i]) continue;
    const x = i % COLS, y = (i / COLS) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = ny * COLS + nx;
      const nc = cost[ni];
      if (nc === Infinity) continue;
      const nd = d + nc;
      if (nd < dist[ni]) { dist[ni] = nd; push(ni, nd); }
    }
  }
  // 다음 칸: 이웃 중 (이웃까지의 비용 + 이웃의 dist)가 가장 작은 칸. 동점이면 직진에 가까운 순서
  const next = new Int32Array(N).fill(-1);
  for (let i = 0; i < N; i++) {
    if (dist[i] === Infinity || i === goal) continue;
    const x = i % COLS, y = (i / COLS) | 0;
    let best = -1, bv = Infinity;
    for (let k = 0; k < 4; k++) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = ny * COLS + nx;
      if (dist[ni] < bv) { bv = dist[ni]; best = ni; }
    }
    next[i] = best;
  }
  return { dist, next };
}

export function computeFields(map, occ) {
  const cost = buildCost(map, occ);
  const fields = [];
  for (let k = 0; k < map.points.length - 1; k++) {
    const f = dijkstra(cost, map.points[k + 1]);
    if (f.dist[map.points[k]] === Infinity) return null;
    fields.push(f);
  }
  return fields;
}

// 전체 경로 칸 목록과, 그 경로에서 부서질 돌·드래곤 칸
export function fullPath(map, fields, occ) {
  const path = [];
  const breaks = [];
  for (let k = 0; k < fields.length; k++) {
    let i = map.points[k];
    const goal = map.points[k + 1];
    if (k === 0) path.push(i);
    let guard = 0;
    while (i !== goal && guard++ < N) {
      i = fields[k].next[i];
      if (i < 0) break;
      path.push(i);
      if (occ[i] !== OCC.EMPTY) breaks.push(i);
    }
  }
  return { path, breaks };
}

// 막힘 정도: 0 뚫림, 1 돌을 부숴야 함, 2 드래곤까지 부숴야 함
export function blockLevel(map, fields) {
  let lv = 0;
  for (let k = 0; k < fields.length; k++) {
    const d = fields[k].dist[map.points[k]];
    if (d >= DRAGON_COST) lv = Math.max(lv, 2);
    else if (d >= STONE_COST) lv = Math.max(lv, 1);
  }
  return lv;
}

// 기획자가 맵 만들기 화면에서 확정한 고정 맵(서바이벌)을 게임 맵으로 만든다. 먼저 setGridSize(def.cols, def.rows) 를 불러야 한다.
export function fixedMap(def, name, key) {
  const grid = new Uint8Array(N).fill(T.GRASS);
  for (const [x, y, t] of def.terrain || []) grid[idx(x, y)] = t;
  const flags = (def.flags || []).map((f) => ({ x: f.x, y: f.y }));
  const keyCells = [def.spawn, ...flags, def.goal];
  return {
    grid, spawn: { ...def.spawn }, goal: { ...def.goal }, flags, points: keyCells.map((p) => idx(p.x, p.y)),
    biome: name, biomeKey: 'meadow', id: key === 'direct' ? 7702 : key === 'tutorial' ? 7703 : 7701, stage: 1, fixed: true, key,
  };
}
