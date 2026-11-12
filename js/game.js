// Dragon Merge & Maze 게임 로직 (화면과 분리). 규칙의 기준은 RULES.md.
import {
  COLS, ROWS, N, T, ROUNDS_PER_STAGE, START_LIVES, START_GOLD, STONE_REMOVE_COST, HILL_RANGE,
  GRADES, MAX_GRADE, GRADE_DMG, GRADE_RANGE, GRADE_RATE, MATCHUP,
  DRAGONS, DRAGON_KEYS, PIXIE_BUFF, PIXIE_RADIUS, COMBOS, COMBO_BY_ID, UPGRADE_COST,
  MONSTER_KINDS, waveFor, hpFor, goldPerKill, roundBonus, raceFor,
  LUCK_TABLE, MAX_LUCK, rollGrade, metaValue, COMBO_INHERIT, mileageFor,
} from './data.js';
import { genStage, computeFields, fullPath, blockLevel, isBuildable, OCC, idx, cx, cy } from './map.js';

const SHRED_TIME = 3;
const BREAK_TIME = 0.5;

export function armorFactor(a) {
  return a >= 0 ? 1 / (1 + 0.06 * a) : 2 - Math.pow(0.94, -a);
}

export function towerName(t) {
  if (t.kind === 'combo') {
    const c = COMBO_BY_ID[t.type];
    return t.up > 0 ? c.ups[t.up - 1] : c.name;
  }
  return `${GRADES[t.grade].name} ${DRAGONS[t.type].short}`;
}

export class Game {
  constructor({ seed, meta, rand } = {}) {
    this.rand = rand || Math.random;
    this.seed = seed ?? ((this.rand() * 4294967296) >>> 0);
    this.meta = meta || { levels: {} };
    this.listeners = {};
    this.nextId = 1;
    this.stage = 1;
    this.lives = START_LIVES + Math.round(metaValue(this.meta, 'life'));
    this.gold = START_GOLD;
    this.stats = { roundsCleared: 0, bossKills: 0, stagesCleared: 0, kills: 0, dragonsLost: 0, stonesBroken: 0 };
    this.time = 0;
    this.startStage(genStage(1, this.seed), []);
  }

  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  emit(ev, ...a) { (this.listeners[ev] || []).forEach((f) => f(...a)); }
  toast(msg, kind) { this.emit('toast', msg, kind); }

  // ---------- 스테이지와 라운드 ----------
  startStage(map, carried) {
    this.map = map;
    this.stage = map.stage;
    this.round = 1;
    this.luck = 0; // 승급은 스테이지마다 초기화 (규칙 8)
    this.occ = new Uint8Array(N);
    this.towerAt = new Int32Array(N).fill(-1);
    this.towers = [];
    this.enemies = [];
    this.projs = [];
    this.fx = [];
    this.pools = [];
    this.spawnQ = [];
    this.draw = carried.map((p) => ({ ...p, pid: this.nextId++, carried: true }));
    this.newDraw();
    this.phase = 'place';
    this.refresh();
    this.emit('stage');
  }

  newDraw() {
    for (let i = 0; i < 5; i++) {
      this.draw.push({
        pid: this.nextId++, kind: 'dragon',
        type: DRAGON_KEYS[Math.floor(this.rand() * DRAGON_KEYS.length)],
        grade: rollGrade(this.luck, this.rand()), up: 0, carried: false,
      });
    }
  }

  refresh() {
    this.fields = computeFields(this.map, this.occ);
    const fp = fullPath(this.map, this.fields, this.occ);
    this.path = fp.path;
    this.breaks = fp.breaks;
    this.block = blockLevel(this.map, this.fields);
    this.recalcBuffs();
    this.emit('change');
  }

  // ---------- 배치 ----------
  canPlace(x, y) {
    if (this.phase !== 'place') return { ok: false, msg: '' };
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return { ok: false, msg: '' };
    const i = idx(x, y);
    if (this.map.points.indexOf(i) >= 0) return { ok: false, msg: '출발·도착·깃발 칸에는 놓을 수 없어요' };
    const t = this.map.grid[i];
    if (t === T.MUD) return { ok: false, msg: '진흙 위에는 놓을 수 없어요' };
    if (!isBuildable(this.map, i)) return { ok: false, msg: '여기에는 놓을 수 없어요' };
    if (this.occ[i] !== OCC.EMPTY) return { ok: false, msg: '' };
    return { ok: true };
  }

  // 놓았을 때 막힘 정도 미리보기
  previewBlock(x, y) {
    const i = idx(x, y);
    const occ = this.occ.slice();
    occ[i] = OCC.DRAGON;
    const f = computeFields(this.map, occ);
    return blockLevel(this.map, f);
  }

  placePiece(pid, x, y) {
    const c = this.canPlace(x, y);
    if (!c.ok) { if (c.msg) this.toast(c.msg, 'bad'); return false; }
    const k = this.draw.findIndex((p) => p.pid === pid);
    if (k < 0) return false;
    const p = this.draw[k];
    const i = idx(x, y);
    const t = {
      id: this.nextId++, x, y, kind: p.kind, type: p.type, grade: p.grade, up: p.up || 0,
      pending: !p.carried, cool: 0.3, angle: 0, hill: this.map.grid[i] === T.HILL,
    };
    this.towers.push(t);
    this.occ[i] = OCC.DRAGON;
    this.towerAt[i] = t.id;
    this.draw.splice(k, 1);
    const before = this.block;
    const len0 = this.path.length;
    this.refresh();
    if (this.block > before) {
      this.toast(this.block === 2 ? '길이 완전히 막혀서 몬스터가 드래곤을 부수게 돼요!' : '길이 막혀서 몬스터가 돌을 부수게 돼요', 'bad');
    } else if (this.path.length !== len0 && this.block === 0) {
      const d = this.path.length - len0;
      this.toast(`경로 ${d > 0 ? '+' : ''}${d}칸`, d > 0 ? 'good' : 'bad');
    }
    if (!this.draw.length) {
      this.phase = this.towers.some((q) => q.pending) ? 'choose' : 'prep';
      if (this.phase === 'choose') this.toast('남길 드래곤 하나를 고르세요. 나머지는 돌이 돼요');
    }
    this.emit('change');
    return true;
  }

  getTower(id) { return this.towers.find((t) => t.id === id) || null; }
  towerAtCell(x, y) { const id = this.towerAt[idx(x, y)]; return id >= 0 ? this.getTower(id) : null; }
  isStone(x, y) { return this.occ[idx(x, y)] === OCC.STONE; }

  removeTower(t, toStone) {
    const i = idx(t.x, t.y);
    this.towers = this.towers.filter((q) => q !== t);
    this.towerAt[i] = -1;
    this.occ[i] = toStone ? OCC.STONE : OCC.EMPTY;
  }

  // 놓을 자리가 하나도 없으면 남은 드래곤은 버린다
  hasFreeCell() {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (this.canPlace(x, y).ok) return true;
    return false;
  }

  discardRemaining() {
    if (this.phase !== 'place' || this.hasFreeCell()) return false;
    const n = this.draw.length;
    this.draw = [];
    this.phase = this.towers.some((q) => q.pending) ? 'choose' : 'prep';
    this.toast(`놓을 자리가 없어서 드래곤 ${n}마리를 놓아 보냈어요`, 'bad');
    this.emit('change');
    return true;
  }

  // ---------- 선택 단계: 남기기, 2마리 합성, 럭키 원힛 (규칙 1, 3, 5) ----------
  pendings() { return this.towers.filter((t) => t.pending); }

  finishChoose(keep) {
    for (const t of this.pendings()) if (t !== keep) this.removeTower(t, true);
    keep.pending = false;
    this.phase = 'prep';
    this.refresh();
  }

  keep(t) {
    if (this.phase !== 'choose' || !t || !t.pending) return false;
    this.finishChoose(t);
    this.toast(`${towerName(t)} 남김. 나머지는 돌이 됐어요`, 'good');
    return true;
  }

  merge2Partner(t) {
    if (this.phase !== 'choose' || !t || !t.pending || t.kind !== 'dragon' || t.grade >= MAX_GRADE) return null;
    return this.pendings().find((o) => o !== t && o.kind === 'dragon' && o.type === t.type && o.grade === t.grade) || null;
  }

  merge2(t) {
    const p = this.merge2Partner(t);
    if (!p) return false;
    t.grade++;
    this.finishChoose(t);
    this.fxBurst(t, DRAGONS[t.type].pal.l);
    this.toast(`합성! ${towerName(t)}`, 'good');
    return true;
  }

  // pool 안에서 t를 한 자리로 쓰는 조합 재료 찾기
  matchRecipe(combo, t, pool) {
    const slots = combo.recipe;
    for (let s = 0; s < 3; s++) {
      if (t.kind !== 'dragon' || slots[s][1] !== t.type || slots[s][0] !== t.grade) continue;
      const rest = slots.filter((_, j) => j !== s);
      const cands = (slot) => pool.filter((o) => o !== t && o.kind === 'dragon' && o.type === slot[1] && o.grade === slot[0])
        .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y));
      for (const a of cands(rest[0])) {
        const b = cands(rest[1]).find((o) => o !== a);
        if (b) return [a, b];
      }
    }
    return null;
  }

  oneHits(t) {
    if (this.phase !== 'choose' || !t || !t.pending) return [];
    const pool = this.pendings();
    return COMBOS.filter((c) => this.matchRecipe(c, t, pool));
  }

  oneHit(t, comboId) {
    const c = COMBO_BY_ID[comboId];
    if (!c || this.oneHits(t).indexOf(c) < 0) return false;
    t.kind = 'combo'; t.type = c.id; t.grade = 0; t.up = 0;
    this.finishChoose(t);
    this.fxBurst(t, '#ffe066', true);
    this.toast(`럭키 원힛! ${c.name}`, 'good');
    this.emit('onehit', t);
    return true;
  }

  // ---------- 정비 단계: 3마리 합성, 콤바인, 업그레이드, 돌 치우기 (규칙 3, 4) ----------
  placed() { return this.towers.filter((t) => !t.pending); }

  merge3Partners(t) {
    if (this.phase !== 'prep' || !t || t.pending || t.kind !== 'dragon' || t.grade >= MAX_GRADE) return null;
    const c = this.placed().filter((o) => o !== t && o.kind === 'dragon' && o.type === t.type && o.grade === t.grade)
      .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y));
    return c.length >= 2 ? c.slice(0, 2) : null;
  }

  merge3(t) {
    const ps = this.merge3Partners(t);
    if (!ps) return false;
    for (const p of ps) this.removeTower(p, true);
    t.grade++;
    this.refresh();
    this.fxBurst(t, DRAGONS[t.type].pal.l);
    this.toast(`합성! ${towerName(t)}`, 'good');
    return true;
  }

  combines(t) {
    if (this.phase !== 'prep' || !t || t.pending || t.kind !== 'dragon') return [];
    const pool = this.placed();
    return COMBOS.filter((c) => this.matchRecipe(c, t, pool));
  }

  combineMaterials(t, comboId) {
    const c = COMBO_BY_ID[comboId];
    if (!c || this.phase !== 'prep') return null;
    return this.matchRecipe(c, t, this.placed());
  }

  combine(t, comboId) {
    const ms = this.combineMaterials(t, comboId);
    if (!ms) return false;
    const c = COMBO_BY_ID[comboId];
    for (const m of ms) this.removeTower(m, true);
    t.kind = 'combo'; t.type = c.id; t.grade = 0; t.up = 0;
    this.refresh();
    this.fxBurst(t, '#ffe066', true);
    this.toast(`콤바인! ${c.name}`, 'good');
    return true;
  }

  upgradeCost(t) {
    if (!t || t.kind !== 'combo') return null;
    const c = COMBO_BY_ID[t.type];
    const costs = UPGRADE_COST[c.tier];
    if (c.id !== 'sealedRed' && t.up >= 1) return null;
    if (t.up >= costs.length) return null;
    return costs[t.up];
  }

  upgrade(t) {
    if (this.phase !== 'prep' && this.phase !== 'place') return false;
    const cost = this.upgradeCost(t);
    if (cost == null || t.pending) return false;
    if (this.gold < cost) { this.toast(`골드가 부족해요 (${cost} 필요)`, 'bad'); return false; }
    this.gold -= cost;
    t.up++;
    this.recalcBuffs();
    this.fxBurst(t, '#ffe066', true);
    this.toast(`업그레이드! ${towerName(t)}`, 'good');
    this.emit('change');
    return true;
  }

  removeStone(x, y) {
    if (this.phase !== 'prep' && this.phase !== 'place') return false;
    const i = idx(x, y);
    if (this.occ[i] !== OCC.STONE) return false;
    if (this.gold < STONE_REMOVE_COST) { this.toast(`골드가 부족해요 (${STONE_REMOVE_COST} 필요)`, 'bad'); return false; }
    this.gold -= STONE_REMOVE_COST;
    this.occ[i] = OCC.EMPTY;
    this.refresh();
    this.toast('돌을 치웠어요');
    return true;
  }

  luckCost() { return this.luck >= MAX_LUCK ? null : LUCK_TABLE[this.luck + 1][0]; }

  buyLuck() {
    const c = this.luckCost();
    if (c == null || this.phase === 'wave' || this.phase === 'over') return false;
    if (this.gold < c) { this.toast(`골드가 부족해요 (${c} 필요)`, 'bad'); return false; }
    this.gold -= c;
    this.luck++;
    this.toast(`승급 ${this.luck}단계! 다음 라운드부터 높은 등급이 더 잘 나와요`, 'good');
    this.emit('change');
    return true;
  }

  // ---------- 능력치 계산 ----------
  metaBonus(t) {
    if (t.kind === 'dragon') {
      return { atk: metaValue(this.meta, `atk_${t.type}`), spd: metaValue(this.meta, `spd_${t.type}`) };
    }
    const c = COMBO_BY_ID[t.type];
    let atk = 0, spd = 0;
    for (const [, k] of c.recipe) { atk += metaValue(this.meta, `atk_${k}`); spd += metaValue(this.meta, `spd_${k}`); }
    return { atk: (atk / 3) * COMBO_INHERIT, spd: (spd / 3) * COMBO_INHERIT };
  }

  baseStats(t) {
    if (t.kind === 'dragon') {
      const d = DRAGONS[t.type], g = t.grade;
      const s = {
        elem: d.elem, target: d.target,
        dmg: d.dmg * GRADE_DMG[g], rate: d.rate * GRADE_RATE[g], range: d.range + GRADE_RANGE[g],
        splash: d.splash || 0, multi: d.multi || 1, crit: d.crit || 0, critX: d.critX || 1,
        slow: d.slow ? Math.min(0.6, d.slow + 0.05 * g) : 0, slowT: d.slowT || 0,
        poison: d.poison ? d.poison * GRADE_DMG[g] : 0, poisonT: d.poisonT || 0,
        stun: 0, stunChance: 0, shred: 0,
      };
      if (d.pixie) { s.buffR = PIXIE_RADIUS[g]; s.pixieBuff = PIXIE_BUFF[g]; }
      return s;
    }
    const c = COMBO_BY_ID[t.type];
    const s = {
      elem: c.elem, target: c.target, dmg: c.dmg, rate: c.rate, range: c.range,
      splash: c.splash || 0, multi: c.multi || 1, crit: c.crit || 0, critX: c.critX || 1,
      slow: c.slow || 0, slowT: c.slowT || 0, poison: c.poison || 0, poisonT: c.poisonT || 0,
      stun: c.stun || 0, stunChance: c.stunChance || 0, shred: c.shred || 0,
      pool: c.pool ? { ...c.pool } : null,
      auraR: c.auraR || 0, auraDmg: c.auraDmg || 0, auraSlow: c.auraSlow || 0, auraPoison: c.auraPoison || 0,
      buffR: c.buffR || 0, buffSpd: c.buffSpd || 0, buffDmg: c.buffDmg || 0, auraShred: c.auraShred || 0,
    };
    if (c.id === 'sealedRed') {
      if (t.up >= 1) { s.dmg = 120; s.range = 3.4; s.splash = 1.2; }
      if (t.up >= 2) { s.dmg *= 2; s.auraDmg *= 2; s.auraR = 2.4; s.splash = 1.6; }
    } else if (t.up >= 1) {
      // 일반 업그레이드: 공격력 2배, 핵심 효과 1.5배, 사거리 +0.5 (규칙 3)
      s.dmg *= 2; s.range += 0.5;
      s.slow = Math.min(0.8, s.slow * 1.5); s.poison *= 1.5; s.stun *= 1.5; s.shred *= 1.5;
      s.auraR = Math.min(5, s.auraR * 1.5); s.auraDmg *= 1.5; s.auraSlow = Math.min(0.8, s.auraSlow * 1.5); s.auraPoison *= 1.5;
      s.buffR = Math.min(5, s.buffR * 1.5); s.buffSpd *= 1.5; s.buffDmg *= 1.5; s.auraShred *= 1.5;
      if (s.pool) { s.pool.poison *= 1.5; s.pool.slow = Math.min(0.8, s.pool.slow * 1.5); s.pool.shred *= 1.5; s.pool.r *= 1.5; }
      if (s.multi > 1) s.multi += 1;
    }
    return s;
  }

  // 픽시 버프는 가장 큰 것 하나만, 이클립스 퀸 버프는 다른 버프와 중첩 (규칙 7, 3)
  recalcBuffs() {
    for (const t of this.towers) { t.st = this.baseStats(t); }
    for (const t of this.towers) {
      if (t.pending) { t.bSpd = 0; t.bDmg = 0; continue; }
      let pix = 0, eSpd = 0, eDmg = 0;
      for (const o of this.towers) {
        if (o === t || o.pending) continue;
        const d = Math.hypot(o.x - t.x, o.y - t.y);
        if (o.st.pixieBuff && d <= o.st.buffR) pix = Math.max(pix, o.st.pixieBuff);
        if (o.st.buffSpd && d <= o.st.buffR) { eSpd += o.st.buffSpd; eDmg += o.st.buffDmg; }
      }
      const m = this.metaBonus(t);
      t.bSpd = pix + eSpd + m.spd;
      t.bDmg = eDmg + m.atk;
      t.pixieIn = pix;
      t.eclipseIn = eSpd;
    }
  }

  effStats(t) {
    const s = t.st || this.baseStats(t);
    return {
      ...s,
      dmg: s.dmg * (1 + (t.bDmg || 0)),
      rate: s.rate / (1 + (t.bSpd || 0)),
      range: s.range + (t.hill && s.range > 0 ? HILL_RANGE : 0),
    };
  }

  // ---------- 웨이브 ----------
  nextWave() { return waveFor(this.stage, this.round); }

  startWave() {
    if (this.phase !== 'prep') return false;
    const w = this.nextWave();
    const hp = hpFor(this.stage, this.round);
    this.spawnQ = w.list.map((k) => ({ kind: k, race: w.race, hp }));
    this.spawnT = 0.3;
    this.phase = 'wave';
    this.waveRace = w.race;
    this.emit('change');
    return true;
  }

  spawn(s) {
    const K = MONSTER_KINDS[s.kind];
    const sp = this.map.spawn;
    const hp = Math.max(1, Math.round(s.hp * K.hp));
    const e = {
      id: this.nextId++, kind: s.kind, race: s.race, hp, max: hp,
      speed: K.speed, armor: K.armor(this.round), fly: !!K.fly, boss: !!K.boss, life: K.life,
      leg: 0, x: sp.x + 0.5, y: sp.y + 0.5, ox: (this.rand() - 0.5) * 0.3, oy: (this.rand() - 0.5) * 0.3,
      slow: 0, slowT: 0, poison: 0, poisonT: 0, stunT: 0, shreds: {}, breakT: 0, breaking: -1,
      dead: false, gone: false, face: 1, anim: this.rand() * 10,
    };
    this.enemies.push(e);
  }

  shredOf(e) {
    let s = 0;
    for (const k in e.shreds) s += e.shreds[k].v;
    return s;
  }

  damage(e, raw, elem, opts = {}) {
    if (e.dead || e.gone) return 0;
    let d = raw * MATCHUP[elem][e.race];
    if (!opts.trueDmg) d *= armorFactor(e.armor - this.shredOf(e));
    e.hp -= d;
    if (opts.crit) this.fx.push({ k: 'crit', x: e.x, y: e.y - 0.4, t: 0, life: 0.6 });
    if (e.hp <= 0) this.kill(e);
    return d;
  }

  kill(e) {
    e.dead = true;
    const g = goldPerKill(this.round) * (e.boss ? 10 : 1);
    this.gold += g;
    this.stats.kills++;
    if (e.boss) this.stats.bossKills++;
    this.fx.push({ k: 'gold', x: e.x, y: e.y - 0.3, t: 0, life: 0.9, v: g });
    this.fx.push({ k: 'pop', x: e.x, y: e.y, t: 0, life: 0.35, race: e.race });
  }

  applyHit(e, s, src) {
    if (s.slow) { if (s.slow >= e.slow) { e.slow = s.slow; e.slowT = Math.max(e.slowT, s.slowT); } }
    if (s.poison) { if (s.poison >= e.poison) { e.poison = s.poison; e.poisonElem = s.elem; } e.poisonT = Math.max(e.poisonT, s.poisonT); }
    if (s.stun && this.rand() < s.stunChance) e.stunT = Math.max(e.stunT, s.stun);
    if (s.shred) { const k = src; if (!e.shreds[k] || e.shreds[k].v <= s.shred) e.shreds[k] = { v: s.shred, t: SHRED_TIME }; else e.shreds[k].t = SHRED_TIME; }
  }

  canTarget(s, e) {
    if (s.target === 'air') return e.fly;
    if (s.target === 'ground') return !e.fly;
    return true;
  }

  progress(e) {
    // 클수록 도착에 가까움
    const nLegs = this.map.points.length - 1;
    const tgt = this.map.points[Math.min(e.leg + 1, nLegs)];
    let d;
    if (e.fly) d = Math.hypot(e.x - (cx(tgt) + 0.5), e.y - (cy(tgt) + 0.5));
    else {
      const ci = idx(Math.max(0, Math.min(COLS - 1, Math.floor(e.x))), Math.max(0, Math.min(ROWS - 1, Math.floor(e.y))));
      d = this.fields[Math.min(e.leg, nLegs - 1)].dist[ci];
      if (!isFinite(d)) d = 1e9;
    }
    return e.leg * 1e10 - d;
  }

  fire(t, targets, s) {
    for (const e of targets) {
      const crit = s.crit && this.rand() < s.crit;
      this.projs.push({
        x: t.x + 0.5, y: t.y + 0.5, tx: e.x, ty: e.y, target: e, src: t.kind === 'combo' ? t.type : t.type,
        elem: s.elem, dmg: s.dmg * (crit ? s.critX : 1), crit, s,
        speed: t.type === 'silver' || t.type === 'royalSlayer' ? 18 : (s.splash ? 9 : 12), life: 3,
        kind: t.kind === 'combo' ? 'combo' : t.type,
      });
    }
    t.flash = 0.12;
  }

  hitProj(p) {
    const s = p.s;
    if (s.splash) {
      this.fx.push({ k: 'ring', x: p.tx, y: p.ty, t: 0, life: 0.35, r: s.splash, elem: p.elem });
      for (const e of this.enemies) {
        if (e.dead || e.gone || !this.canTarget(s, e)) continue;
        if (Math.hypot(e.x - p.tx, e.y - p.ty) <= s.splash) {
          this.damage(e, p.dmg, p.elem, { crit: p.crit && e === p.target });
          this.applyHit(e, s, p.src);
        }
      }
    } else if (p.target && !p.target.dead && !p.target.gone) {
      this.damage(p.target, p.dmg, p.elem, { crit: p.crit });
      this.applyHit(p.target, s, p.src);
    }
    if (s.pool) {
      this.pools.push({ x: p.tx, y: p.ty, r: s.pool.r, t: s.pool.t, max: s.pool.t, ...s.pool, src: p.src });
    }
    this.fx.push({ k: 'hit', x: p.tx, y: p.ty, t: 0, life: 0.2, elem: p.elem });
  }

  leak(e) {
    e.gone = true;
    this.lives -= e.life;
    this.emit('leak', e);
    if (this.lives <= 0) { this.lives = 0; this.gameOver(); }
  }

  breakCell(i, e) {
    const t = this.towerAt[i] >= 0 ? this.getTower(this.towerAt[i]) : null;
    if (t) {
      this.removeTower(t, false);
      this.stats.dragonsLost++;
      this.toast(`${towerName(t)}이(가) 부서졌어요! 영구히 사라집니다`, 'bad');
    } else if (this.occ[i] === OCC.STONE) {
      this.occ[i] = OCC.EMPTY;
      this.stats.stonesBroken++;
    }
    this.fx.push({ k: 'break', x: cx(i) + 0.5, y: cy(i) + 0.5, t: 0, life: 0.5, dragon: !!t });
    this.refresh();
  }

  stepToward(e, tx, ty, d) {
    const dx = tx - e.x, dy = ty - e.y, dist = Math.hypot(dx, dy);
    if (dx) e.face = dx > 0 ? 1 : -1;
    if (dist <= d) { e.x = tx; e.y = ty; return d - dist; }
    e.x += (dx / dist) * d; e.y += (dy / dist) * d;
    return 0;
  }

  moveEnemy(e, dt) {
    if (e.stunT > 0) return;
    const pts = this.map.points, nLegs = pts.length - 1;
    const curCell = idx(Math.max(0, Math.min(COLS - 1, Math.floor(e.x))), Math.max(0, Math.min(ROWS - 1, Math.floor(e.y))));
    let rem = e.speed * (1 - e.slow) * dt;
    if (!e.fly && this.map.grid[curCell] === T.MUD) rem *= 0.6;
    for (let step = 0; step < 6 && rem > 1e-6; step++) {
      const wp = pts[e.leg + 1];
      let tIdx, arrive = false;
      if (e.fly) { tIdx = wp; arrive = true; }
      else {
        const ci = idx(Math.max(0, Math.min(COLS - 1, Math.floor(e.x))), Math.max(0, Math.min(ROWS - 1, Math.floor(e.y))));
        if (ci === wp) { tIdx = wp; arrive = true; }
        else {
          const n = this.fields[e.leg].next[ci];
          if (n < 0) return;
          if (this.occ[n] !== OCC.EMPTY) {
            // 막힌 칸: 한 대 때려서 부순다 (규칙 6)
            if (e.breaking !== n) { e.breaking = n; e.breakT = 0; }
            e.breakT += dt;
            e.face = cx(n) > e.x ? 1 : -1;
            if (e.breakT >= BREAK_TIME) { e.breaking = -1; this.breakCell(n, e); }
            return;
          }
          tIdx = n;
        }
      }
      const tx = cx(tIdx) + 0.5 + (arrive && e.leg + 1 === nLegs ? 0 : e.ox);
      const ty = cy(tIdx) + 0.5 + (arrive && e.leg + 1 === nLegs ? 0 : e.oy);
      rem = this.stepToward(e, tx, ty, rem);
      if (arrive && e.x === tx && e.y === ty) {
        if (e.leg + 1 >= nLegs) { this.leak(e); return; }
        e.leg++;
      }
    }
  }

  update(dt) {
    if (this.phase !== 'wave') return;
    this.time += dt;
    if (this.spawnQ.length) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        const s = this.spawnQ.shift();
        this.spawn(s);
        this.spawnT = s.kind === 'fast' ? 0.45 : s.kind === 'boss' ? 1.2 : 0.75;
      }
    }
    // 상태 효과와 이동
    for (const e of this.enemies) {
      if (e.dead || e.gone) continue;
      e.anim += dt;
      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 0; }
      if (e.stunT > 0) e.stunT -= dt;
      for (const k in e.shreds) { e.shreds[k].t -= dt; if (e.shreds[k].t <= 0) delete e.shreds[k]; }
      if (e.poisonT > 0) {
        e.poisonT -= dt;
        this.damage(e, e.poison * dt, e.poisonElem || 'poison', { trueDmg: true });
        if (e.poisonT <= 0) e.poison = 0;
      }
      if (e.dead) continue;
      e.auraSlow = 0;
    }
    // 오라 (봉인된 레드 화염, 역병의 군주 슬로우·독, 이클립스 퀸 방어력 감소)
    for (const t of this.towers) {
      if (t.pending) continue;
      const s = this.effStats(t);
      if (s.auraR) {
        for (const e of this.enemies) {
          if (e.dead || e.gone) continue;
          if (Math.hypot(e.x - (t.x + 0.5), e.y - (t.y + 0.5)) > s.auraR) continue;
          if (s.auraDmg) this.damage(e, s.auraDmg * (1 + (t.bDmg || 0)) * dt, s.elem, { trueDmg: false });
          if (s.auraSlow) { e.slow = Math.max(e.slow, s.auraSlow); e.slowT = Math.max(e.slowT, 0.3); }
          if (s.auraPoison) { e.poison = Math.max(e.poison, s.auraPoison); e.poisonElem = s.elem; e.poisonT = Math.max(e.poisonT, 0.5); }
        }
      }
      if (s.auraShred) {
        for (const e of this.enemies) {
          if (e.dead || e.gone) continue;
          if (Math.hypot(e.x - (t.x + 0.5), e.y - (t.y + 0.5)) > s.buffR) continue;
          const k = 'eclipse';
          if (!e.shreds[k] || e.shreds[k].v <= s.auraShred) e.shreds[k] = { v: s.auraShred, t: 0.5 };
        }
      }
    }
    // 산성 늪
    for (const p of this.pools) {
      p.t -= dt;
      for (const e of this.enemies) {
        if (e.dead || e.gone || e.fly) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) > p.r) continue;
        if (p.poison >= e.poison) { e.poison = p.poison; e.poisonElem = 'poison'; }
        e.poisonT = Math.max(e.poisonT, 0.6);
        e.slow = Math.max(e.slow, p.slow); e.slowT = Math.max(e.slowT, 0.4);
        const k = p.src;
        if (!e.shreds[k] || e.shreds[k].v <= p.shred) e.shreds[k] = { v: p.shred, t: 0.6 };
      }
    }
    this.pools = this.pools.filter((p) => p.t > 0);
    for (const e of this.enemies) {
      if (e.dead || e.gone) continue;
      this.moveEnemy(e, dt);
      if (this.phase === 'over') return;
    }
    // 드래곤 공격
    for (const t of this.towers) {
      if (t.pending) continue;
      t.cool -= dt;
      if (t.flash > 0) t.flash -= dt;
      const s = this.effStats(t);
      if (!(s.dmg > 0) || !(s.range > 0)) continue;
      const tx = t.x + 0.5, ty = t.y + 0.5;
      const inRange = [];
      for (const e of this.enemies) {
        if (e.dead || e.gone || !this.canTarget(s, e)) continue;
        if (Math.hypot(e.x - tx, e.y - ty) <= s.range) inRange.push(e);
      }
      if (!inRange.length) continue;
      inRange.sort((a, b) => this.progress(b) - this.progress(a));
      t.angle = Math.atan2(inRange[0].y - ty, inRange[0].x - tx);
      if (t.cool <= 0) {
        this.fire(t, inRange.slice(0, s.multi || 1), s);
        t.cool = s.rate;
      }
    }
    // 투사체
    for (const p of this.projs) {
      p.life -= dt;
      if (p.target && !p.target.dead && !p.target.gone) { p.tx = p.target.x; p.ty = p.target.y; }
      const step = p.speed * dt, dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.hypot(dx, dy);
      if (dist <= step + 0.05) { this.hitProj(p); p.done = true; }
      else { p.x += (dx / dist) * step; p.y += (dy / dist) * step; }
      if (p.life <= 0) p.done = true;
    }
    this.projs = this.projs.filter((p) => !p.done);
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.life);
    this.enemies = this.enemies.filter((e) => !e.dead && !e.gone);
    if (this.phase === 'wave' && !this.spawnQ.length && !this.enemies.length) this.waveCleared();
  }

  // 화면 효과만 시간 흐르게 (웨이브가 아닐 때)
  tickFx(dt) {
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.life);
  }

  fxBurst(t, color, big) {
    this.fx.push({ k: 'burst', x: t.x + 0.5, y: t.y + 0.5, t: 0, life: big ? 0.9 : 0.6, color, big: !!big });
  }

  interest() {
    const rate = metaValue(this.meta, 'interest');
    if (!rate) return 0;
    return Math.min(Math.floor(this.gold * rate), this.round * 2);
  }

  waveCleared() {
    const bonus = roundBonus(this.round);
    const intr = this.interest();
    this.gold += bonus + intr;
    this.stats.roundsCleared++;
    this.projs = []; this.pools = [];
    this.emit('wavecleared', { round: this.round, bonus, interest: intr });
    if (this.round >= ROUNDS_PER_STAGE) {
      this.stats.stagesCleared++;
      this.phase = 'stageclear';
      this.emit('stageclear');
      this.emit('change');
      return;
    }
    this.round++;
    this.newDraw();
    this.phase = 'place';
    this.toast(`라운드 클리어! 보너스 +${bonus}${intr ? `, 이자 +${intr}` : ''} 골드`, 'good');
    this.emit('change');
  }

  nextStage() {
    if (this.phase !== 'stageclear') return;
    const carried = this.towers.map((t) => ({ kind: t.kind, type: t.type, grade: t.grade, up: t.up }));
    this.startStage(genStage(this.stage + 1, this.seed), carried);
  }

  gameOver() {
    if (this.phase === 'over') return;
    this.phase = 'over';
    this.mileage = mileageFor(this.stats);
    this.emit('over', this.mileage);
    this.emit('change');
  }

  // 정보
  roundLabel() { return `${this.stage}-${this.round}`; }
  nextRace() { return raceFor(this.round); }
}
