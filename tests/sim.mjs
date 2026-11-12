// 자동 시뮬레이션: 간단한 봇으로 여러 판을 돌려 오류와 난이도를 확인한다.
import { Game, towerName } from '../js/game.js';
import { COLS, ROWS, MAX_GRADE } from '../js/data.js';
import { mulberry32, idx } from '../js/map.js';
import { SURVIVAL_MAPS, decodeMapCode } from '../js/survival-map.js';

function bot(g, rnd) {
  let guard = 0;
  while (g.phase !== 'over' && guard++ < 1e6) {
    if (g.phase === 'place') {
      // 승급: 골드의 60%까지
      while (g.luckCost() != null && g.gold * 0.6 >= g.luckCost()) g.buyLuck();
      const p = g.draw[0];
      // 경로 옆 빈칸 중 경로가 길어지고 막히지 않는 곳
      const cand = [];
      for (const i of g.path) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
        const x = (i % COLS) + dx, y = ((i / COLS) | 0) + dy;
        if (g.canPlace(x, y).ok) cand.push([x, y]);
      }
      let best = null, bv = -1;
      const sample = cand.sort(() => rnd() - 0.5).slice(0, 25);
      for (const [x, y] of sample) {
        if (g.previewBlock(x, y) > 0) continue;
        const v = rnd();
        if (v > bv) { bv = v; best = [x, y]; }
      }
      if (!best && !g.hasFreeCell()) {
        // 자리가 없으면 돌을 하나 깬다 (v0.5: 무료)
        const stones = [];
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g.isStone(x, y)) stones.push([x, y]);
        if (stones.length) { const [x, y] = stones[Math.floor(rnd() * stones.length)]; g.removeStone(x, y); continue; }
      }
      if (!best) { for (let y = 0; y < ROWS && !best; y++) for (let x = 0; x < COLS && !best; x++) if (g.canPlace(x, y).ok) best = [x, y]; }
      if (!best) { if (!g.discardRemaining()) return 'stuck'; continue; }
      g.placePiece(p.pid, best[0], best[1]);
      continue;
    }
    if (g.phase === 'choose') {
      const ps = g.pendings();
      let done = false;
      for (const t of ps) { const oh = g.oneHits(t); if (oh.length) { g.oneHit(t, oh[0].id); done = true; break; } }
      if (!done) for (const t of ps) if (g.merge2Partner(t)) { g.merge2(t); done = true; break; }
      if (!done) { ps.sort((a, b) => b.grade - a.grade); g.keep(ps[0]); }
      continue;
    }
    if (g.phase === 'prep') {
      let acted = true;
      while (acted) {
        acted = false;
        for (const t of g.placed()) {
          const cs = g.combines(t); if (cs.length) { g.combine(t, cs[0].id); acted = true; break; }
          if (g.merge3Partners(t)) { g.merge3(t); acted = true; break; }
        }
        for (const t of g.placed()) { if (g.upgradeCost(t) != null && g.gold >= g.upgradeCost(t) + 20) { g.upgrade(t); acted = true; } }
      }
      const l0 = g.lives;
      g.startWave();
      let n = 0;
      while (g.isFighting() && n++ < 200000) g.update(1 / 30);
      if (n >= 200000) { console.log('WAVE TIMEOUT', g.roundLabel()); return 'timeout'; }
      if (l0 > g.lives) (g._leaks ||= []).push(`${g.roundLabel()}:${l0 - g.lives}`);
      continue;
    }
    if (g.phase === 'stageclear') { if (g.stage >= maxStage) return 'cleared'; g.nextStage(); continue; }
  }
  return g.phase;
}

const runs = +(process.argv[2] || 6);
const maxStage = +(process.argv[3] || 99);
const mode = process.argv[4] || 'normal'; // normal | cross | direct (서바이벌 맵)
const res = [];
for (let s = 1; s <= runs; s++) {
  const rnd = mulberry32(s * 7919);
  const sm = SURVIVAL_MAPS.find((m) => m.key === mode);
  const g = sm ? new Game({ seed: s * 101, rand: rnd, mode: 'survival', survivalMap: { key: sm.key, name: sm.name, def: decodeMapCode(sm.code) } })
    : new Game({ seed: s * 101, rand: rnd });
  const errs = [];
  let combos = 0, oneHits = 0;
  g.on('onehit', () => oneHits++);
  const t0 = Date.now();
  let r;
  try { r = bot(g, rnd); } catch (e) { errs.push(e.stack); }
  combos = g.towers.filter((t) => t.kind === 'combo').length;
  const rec = g.survivalRecord && g.survivalRecord();
  res.push({ seed: s, end: g.roundLabel(), dmg: rec ? rec.damage : '', result: r, lives: g.lives, mileage: g.mileage, kills: g.stats.kills, lost: g.stats.dragonsLost, broken: g.stats.stonesBroken, combos, oneHits, luck: g.luck, leaks: (g._leaks || []).slice(0, 8).join(' '), ms: Date.now() - t0, errs: errs.length });
  if (errs.length) console.log(errs[0]);
}
console.table(res);
