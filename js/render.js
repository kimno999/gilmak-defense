// 전장 그리기 (고급 도트). 장면은 칸당 32px 저해상도 캔버스에 도트로 그리고,
// 화면 캔버스에 2배로 키운 뒤 빛 효과(광원, 빛 번짐, 빛줄기, 위아래 흐림, 가장자리 어둡게)를 더한다.
import { COLS, ROWS, TILE, ELEMENTS } from './data.js';
import { OCC, cx, cy } from './map.js';
import { drawWorld, waterSparkles } from './hd-art.js';
import { towerSprite, monsterSprite, stoneSprite, flagSprite, portalSprite, gateSprite, drawText } from './sprites.js';

let W = COLS * TILE, H = ROWS * TILE;
const S = 2;
// 깃발 구간별 경로 색: 출발→1 하양, 1→2 노랑, 2→3 하늘, 3→4 분홍, 4→도착 주황
export const LEG_COLORS = ['rgba(255,255,255,0.9)', 'rgba(255,214,110,0.9)', 'rgba(127,212,255,0.92)', 'rgba(255,138,216,0.92)', 'rgba(255,160,74,0.92)'];
const AMBIENT = {
  meadow: ['#fff2d6', '#c9c0d8', '#6e78b8'],
  canyon: ['#ffe8c0', '#d8b898', '#8a6a78'],
  lake: ['#eef8ff', '#b8c8e0', '#5a70b0'],
  swamp: ['#e0f0d0', '#98b0a0', '#3a5a6a'],
  highland: ['#fff8e0', '#d0d0c8', '#7888b0'],
  mixed: ['#fff2d6', '#c9c0d8', '#6e78b8'],
};

export class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.dg = canvas.getContext('2d');
    this.low = document.createElement('canvas');
    this.g = this.low.getContext('2d');
    this.small = document.createElement('canvas');
    this.sg = this.small.getContext('2d');
    this.tmp = document.createElement('canvas');
    this.tg = this.tmp.getContext('2d');
    this.resize();
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.light = true;
    const c = document.createElement('canvas').getContext('2d');
    c.filter = 'blur(2px)';
    this.filterOK = c.filter === 'blur(2px)';
    this.motes = Array.from({ length: 36 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.15 + Math.random() * 0.3, p: Math.random() * 6 }));
    this.lastT = 0;
  }

  // 맵 크기가 바뀌면 버퍼를 다시 만든다
  resize() {
    W = COLS * TILE; H = ROWS * TILE;
    this.cols = COLS; this.rows = ROWS;
    this.cv.width = W * S; this.cv.height = H * S;
    this.cv.style.aspectRatio = `${COLS} / ${ROWS}`;
    this.low.width = W; this.low.height = H;
    this.g.imageSmoothingEnabled = false;
    this.small.width = W / 2; this.small.height = H / 2;
    this.tmp.width = W * S; this.tmp.height = H * S;
    this.terrain = null; this.terrainId = null;
  }

  buildTerrain(map) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    drawWorld(c.getContext('2d'), map.grid, COLS, ROWS, map.id & 0xffff, map.biomeKey || 'meadow');
    this.terrain = c;
    this.terrainId = map.id;
  }

  pixCircle(x, y, r, color, dotted) {
    const g = this.g;
    g.fillStyle = color;
    const steps = Math.max(32, Math.floor(r * 6.3));
    for (let i = 0; i < steps; i++) {
      if (dotted && i % 2) continue;
      const a = (i / steps) * Math.PI * 2;
      g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
    }
  }

  shadow(x, y, w) {
    const g = this.g;
    g.fillStyle = 'rgba(10,8,24,0.38)';
    g.beginPath(); g.ellipse(Math.round(x), Math.round(y), w, w * 0.32, 0, 0, Math.PI * 2); g.fill();
  }

  box(x, y, color, w = 32) {
    const g = this.g;
    g.fillStyle = color;
    g.fillRect(x, y, w, 1); g.fillRect(x, y + w - 1, w, 1); g.fillRect(x, y, 1, w); g.fillRect(x + w - 1, y, 1, w);
  }

  draw(game, view, now) {
    const g = this.g;
    const t = this.reduced ? 0 : now / 1000;
    const dt = Math.min(0.1, Math.max(0, t - this.lastT)); this.lastT = t;
    const fr = (speed, off = 0) => (this.reduced ? 0 : Math.floor(t * speed + off) % 4);
    if (this.cols !== COLS || this.rows !== ROWS) this.resize();
    if (this.terrainId !== game.map.id) this.buildTerrain(game.map);
    const m = game.map;
    const lights = [];
    g.drawImage(this.terrain, 0, 0);
    if (!this.reduced) waterSparkles(g, m.grid, COLS, ROWS, t);

    // 경로: 출발 → 도착 방향으로 흐르는 점선과 작은 화살표.
    // 깃발 구간마다 색이 다르고, 여러 구간이 같은 칸 사이를 지나면 줄을 옆으로 살짝 띄운다 (v0.6 1번)
    const path = game.path;
    if (path && path.length > 1) {
      const off = Math.floor(t * 16) % 10;
      const legs = game.legs && game.legs.length ? game.legs : [0];
      const legEnd = (k) => (k + 1 < legs.length ? legs[k + 1] : path.length - 1);
      const share = new Map(); // 칸 사이 이음 → 그 이음을 지나는 구간들
      for (let k = 0; k < legs.length; k++) {
        for (let n = legs[k]; n < legEnd(k); n++) {
          const a = path[n], b = path[n + 1], key = a < b ? `${a}-${b}` : `${b}-${a}`;
          const arr = share.get(key) || [];
          if (!arr.includes(k)) arr.push(k);
          share.set(key, arr);
        }
      }
      for (let k = 0; k < legs.length; k++) {
        g.fillStyle = game.block ? 'rgba(255,107,107,0.85)' : legs.length === 1 ? 'rgba(255,214,110,0.9)' : LEG_COLORS[k % LEG_COLORS.length];
        let d = 0;
        for (let n = legs[k]; n < legEnd(k); n++) {
          const a = path[n], b = path[n + 1], key = a < b ? `${a}-${b}` : `${b}-${a}`;
          const arr = share.get(key);
          const sh = arr.length > 1 ? Math.round((arr.indexOf(k) - (arr.length - 1) / 2) * 5) : 0;
          const ax0 = cx(a) * TILE + 16, ay0 = cy(a) * TILE + 16, bx0 = cx(b) * TILE + 16, by0 = cy(b) * TILE + 16;
          const sx = Math.sign(bx0 - ax0), sy = Math.sign(by0 - ay0);
          // 진행 방향에 수직으로 띄우기 (방향과 무관하게 같은 쪽)
          const px = sy !== 0 ? sh : 0, py = sx !== 0 ? sh : 0;
          const ax = ax0 + px, ay = ay0 + py, bx = bx0 + px, by = by0 + py;
          const len = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
          for (let q = 0; q < len; q++, d++) {
            if ((d - off + 10000) % 10 < 3) g.fillRect(ax + sx * q, ay + sy * q, 2, 2);
          }
          if ((n - legs[k]) % 3 === 1) {
            const mx = (ax + bx) / 2, my = (ay + by) / 2;
            for (let i2 = 0; i2 < 4; i2++) {
              g.fillRect(Math.round(mx + sx * (2 - i2) - sy * i2), Math.round(my + sy * (2 - i2) - sx * i2), 1, 1);
              g.fillRect(Math.round(mx + sx * (2 - i2) + sy * i2), Math.round(my + sy * (2 - i2) + sx * i2), 1, 1);
            }
          }
        }
      }
    }

    // 정렬해서 그릴 것들 (아래쪽이 앞)
    const items = [];
    const sp = m.spawn, go = m.goal;
    items.push({ y: sp.y * TILE + 30, draw: () => g.drawImage(portalSprite(this.reduced ? 0 : Math.floor(t * 8) % 8), sp.x * TILE, sp.y * TILE) });
    lights.push([sp.x * TILE + 16, sp.y * TILE + 18, 'rgba(190,110,255,0.8)', 30]);
    items.push({ y: go.y * TILE + 30, draw: () => g.drawImage(gateSprite(fr(6)), go.x * TILE, go.y * TILE) });
    lights.push([go.x * TILE + 6, go.y * TILE + 12, 'rgba(255,150,50,0.75)', 20], [go.x * TILE + 26, go.y * TILE + 12, 'rgba(255,150,50,0.75)', 20]);
    m.flags.forEach((f, i) => items.push({ y: f.y * TILE + 29, draw: () => { this.shadow(f.x * TILE + 9, f.y * TILE + 29, 4); g.drawImage(flagSprite(i + 1, fr(6, i)), f.x * TILE, f.y * TILE); } }));

    for (let i = 0; i < game.occ.length; i++) {
      if (game.occ[i] !== OCC.STONE) continue;
      const x = cx(i) * TILE, y = cy(i) * TILE;
      items.push({ y: y + 30, draw: () => g.drawImage(stoneSprite((cx(i) + cy(i)) % 2), x, y) });
    }

    // 오라 범위
    for (const tw of game.towers) {
      if (tw.pending || !tw.st) continue;
      const s = tw.st;
      const r = (s.buffR || s.auraR || 0) * TILE;
      if (!r) continue;
      // 오라 범위는 아주 연한 원으로 늘 보여 준다
      const rgb = s.pixieBuff ? '255,138,216' : s.buffSpd ? '255,224,102' : s.auraDmg ? '255,138,61' : '123,224,74';
      g.fillStyle = `rgba(${rgb},0.07)`;
      g.beginPath(); g.arc(tw.x * TILE + 16, tw.y * TILE + 16, r, 0, Math.PI * 2); g.fill();
      this.pixCircle(tw.x * TILE + 16, tw.y * TILE + 16, r, `rgba(${rgb},0.32)`, true);
      if (s.auraDmg) lights.push([tw.x * TILE + 16, tw.y * TILE + 16, 'rgba(255,120,40,0.35)', r]);
    }
    // 산성 늪
    for (const p of game.pools) {
      const a = Math.min(1, p.t / p.max), r = p.r * TILE;
      g.fillStyle = `rgba(123,224,74,${0.28 * a})`;
      for (let yy = -r; yy <= r; yy += 2) for (let xx = -r; xx <= r; xx += 2) if (xx * xx + yy * yy <= r * r && ((xx + yy) / 2) % 2 === 0) g.fillRect(Math.round(p.x * TILE + xx), Math.round(p.y * TILE + yy), 2, 2);
      lights.push([p.x * TILE, p.y * TILE, `rgba(140,255,80,${0.3 * a})`, r]);
    }

    const hl = new Set(view.highlight || []);
    for (const tw of game.towers) {
      const x = tw.x * TILE, y = tw.y * TILE;
      const sprite = towerSprite(tw, fr(5, tw.id));
      items.push({ y: y + 29, draw: () => {
        this.shadow(x + 16, y + 29, tw.kind === 'combo' || tw.grade >= 3 ? 11 : 8);
        g.drawImage(sprite, x, y);
        if (tw.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(sprite, x, y); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      } });
      for (const [lx, ly, col, r] of sprite.glow || []) lights.push([x + lx, y + ly, col, r * 3.2 * (0.9 + 0.1 * Math.sin(t * 6 + tw.id))]);
    }

    // 몬스터
    for (const e of game.enemies) {
      const big = e.boss;
      const sp2 = monsterSprite(e.kind, e.race, fr(8, e.id));
      const sz = sp2.width;
      const lift = e.fly ? 10 + Math.sin(t * 4 + e.id) * 2 : 0;
      const px = Math.round(e.x * TILE - sz / 2), py = Math.round(e.y * TILE - sz + 10 - lift);
      items.push({ y: e.y * TILE + 10 + (e.fly ? 40 : 0), draw: () => {
        this.shadow(e.x * TILE, e.y * TILE + 9, big ? 10 : e.fly ? 5 : 6);
        g.save();
        if (e.face < 0) { g.translate(px + sz, py); g.scale(-1, 1); g.drawImage(sp2, 0, 0); }
        else g.drawImage(sp2, px, py);
        g.restore();
        if (e.slow > 0) { g.fillStyle = '#8fd8ff'; for (let k = 4; k < sz - 4; k += 3) g.fillRect(px + k, py + sz - 3, 2, 1); }
        if (e.poisonT > 0) { g.fillStyle = '#7be04a'; g.fillRect(px + 6 + (Math.floor(t * 6) % 6) * 2, py + 4, 2, 2); }
        if (e.stunT > 0) for (let k = 0; k < 3; k++) { g.fillStyle = '#ffe066'; const a = t * 6 + k * 2.1; g.fillRect(Math.round(px + sz / 2 + Math.cos(a) * 6), Math.round(py + 2 + Math.sin(a) * 2), 2, 2); }
        if (e.breaking >= 0) drawText(g, '!', px + sz / 2, py - 12, '#ff6b6b', '#160f1c', 2);
        if (e.hp < e.max) {
          const w = big ? 30 : 20, bx = Math.round(e.x * TILE - w / 2), by = py - 4;
          g.fillStyle = '#160f1c'; g.fillRect(bx - 1, by - 1, w + 2, 4);
          const pr = Math.max(0, e.hp / e.max);
          g.fillStyle = pr > 0.5 ? '#7be04a' : pr > 0.25 ? '#ffcf4a' : '#ff6b6b';
          g.fillRect(bx, by, Math.max(1, Math.round(w * pr)), 2);
        }
      } });
      for (const [lx, ly, col, r] of sp2.glow || []) lights.push([px + (e.face < 0 ? sz - lx : lx), py + ly, col, r * 2.5]);
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    // 표시: 대기 중 후보, 원힛·콤바인 재료, 합성 대상
    for (const tw of game.towers) {
      const x = tw.x * TILE, y = tw.y * TILE;
      if (tw.pending) {
        g.fillStyle = (Math.floor(t * 4) % 2) ? '#ffcf4a' : '#ff8ad8';
        for (let k = 0; k < 32; k += 4) { g.fillRect(x + k, y, 2, 1); g.fillRect(x + k + 2, y + 31, 2, 1); g.fillRect(x, y + k + 2, 1, 2); g.fillRect(x + 31, y + k, 1, 2); }
      }
      const al = (view.alertMats || []).find((a) => a.id === tw.id);
      if (al) {
        const hues = al.kind === 'onehit' ? ['#ff8ad8', '#ffcf4a', '#8fd8ff', '#7be04a'] : ['#7be04a', '#dfffcf'];
        for (let k = 0; k < 32; k++) {
          g.fillStyle = hues[(Math.floor(k / 2) + Math.floor(t * 10)) % hues.length];
          g.fillRect(x + k, y - 1, 1, 2); g.fillRect(x + 31 - k, y + 31, 1, 2); g.fillRect(x - 1, y + 31 - k, 2, 1); g.fillRect(x + 31, y + k, 2, 1);
        }
        if (Math.floor(t * 5 + tw.id) % 3 === 0) { g.fillStyle = '#ffffff'; g.fillRect(x + 4 + (tw.id * 7) % 24, y + 3 + (tw.id * 5) % 20, 2, 2); }
        lights.push([x + 16, y + 16, al.kind === 'onehit' ? 'rgba(255,220,140,0.55)' : 'rgba(150,255,120,0.45)', 26]);
      }
      if (hl.has(tw.id)) this.box(x, y, (Math.floor(t * 5) % 2) ? '#7be04a' : '#dfffcf');
    }

    // 부서질 칸
    if (game.breaks && game.phase !== 'wave' && game.phase !== 'tester') {
      for (const i of game.breaks) {
        const x = cx(i) * TILE, y = cy(i) * TILE;
        g.fillStyle = (Math.floor(t * 3) % 2) ? '#ff6b6b' : '#ffd2d2';
        for (let k = 6; k < 26; k++) { g.fillRect(x + k, y + k, 2, 2); g.fillRect(x + 30 - k, y + k, 2, 2); }
      }
    }

    // 선택과 사거리
    if (view.selTower) {
      const tw = view.selTower, s = game.effStats(tw);
      this.box(tw.x * TILE - 1, tw.y * TILE - 1, '#ffcf4a', 34);
      if (s.range > 0) this.pixCircle(tw.x * TILE + 16, tw.y * TILE + 16, s.range * TILE, 'rgba(255,255,255,0.85)');
    }
    if (view.selStone) this.box(view.selStone.x * TILE - 1, view.selStone.y * TILE - 1, '#ffcf4a', 34);
    // 자리 바꾸기 중: 바꿀 수 있는 돌을 깜빡여 보여 준다
    if (view.swapFrom != null) {
      const from = game.getTower(view.swapFrom);
      if (from) this.box(from.x * TILE - 1, from.y * TILE - 1, '#8fd8ff', 34);
      if (view.swapTo) { if (Math.floor(t * 4) % 2 === 0) this.box(view.swapTo.x * TILE - 1, view.swapTo.y * TILE - 1, '#ffcf4a', 34); }
      else if (Math.floor(t * 3) % 2 === 0) for (let i = 0; i < game.occ.length; i++) if (game.occ[i] === OCC.STONE) this.box(cx(i) * TILE - 1, cy(i) * TILE - 1, '#8fd8ff', 34);
    }
    if (view.ghost) {
      const { x, y, sprite, ok, block, range } = view.ghost;
      g.globalAlpha = ok ? 0.65 : 0.3;
      g.drawImage(sprite, x * TILE, y * TILE);
      g.globalAlpha = 1;
      if (!ok) { g.fillStyle = 'rgba(255,107,107,0.35)'; g.fillRect(x * TILE, y * TILE, 32, 32); }
      if (ok && range) this.pixCircle(x * TILE + 16, y * TILE + 16, range * TILE, 'rgba(255,255,255,0.6)', true);
      if (ok && block) drawText(g, '!', x * TILE + 16, y * TILE - 12, block === 2 ? '#ff4040' : '#ff9a6b', '#160f1c', 2);
    }

    // 투사체
    for (const p of game.projs) {
      const col = ELEMENTS[p.elem].color;
      const x = Math.round(p.x * TILE), y = Math.round(p.y * TILE);
      const big = !!p.s.splash;
      g.fillStyle = '#160f1c'; g.fillRect(x - 2, y - 2, big ? 5 : 4, big ? 5 : 4);
      g.fillStyle = col; g.fillRect(x - 1, y - 1, big ? 3 : 2, big ? 3 : 2);
      g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1);
      lights.push([x, y, col, big ? 18 : 10]);
    }
    // 효과
    for (const f of game.fx) {
      const k = f.t / f.life, x = f.x * TILE, y = f.y * TILE;
      if (f.k === 'ring') { this.pixCircle(x, y, Math.max(1, f.r * TILE * (0.3 + 0.7 * k)), ELEMENTS[f.elem].color, k > 0.5); lights.push([x, y, ELEMENTS[f.elem].color, f.r * TILE * (1 - k)]); }
      else if (f.k === 'hit') { g.fillStyle = ELEMENTS[f.elem].color; g.fillRect(Math.round(x - 2), Math.round(y - 2 - k * 6), 2, 2); g.fillRect(Math.round(x + 2), Math.round(y - k * 6), 2, 2); }
      else if (f.k === 'gold') drawText(g, `+${f.v}`, x, y - 18 - k * 10, '#ffcf4a', '#160f1c', 2);
      else if (f.k === 'crit') drawText(g, '!', x, y - 22 - k * 8, '#ffffff', '#160f1c', 2);
      else if (f.k === 'pop') { g.fillStyle = '#ffffff'; const r = 3 + k * 10; for (let a = 0; a < 8; a++) g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 8 + Math.sin(a) * r), 2, 2); }
      else if (f.k === 'burst') { this.pixCircle(x, y, 3 + k * (f.big ? 32 : 20), f.color); if (f.big) this.pixCircle(x, y, 2 + k * 16, '#ffffff', true); lights.push([x, y, 'rgba(255,230,140,0.8)', (f.big ? 50 : 30) * (1 - k)]); }
      else if (f.k === 'break') { g.fillStyle = f.dragon ? '#ff6b6b' : '#8d95a0'; for (let a = 0; a < 10; a++) g.fillRect(Math.round(x + Math.cos(a) * (3 + k * 18)), Math.round(y + Math.sin(a) * (3 + k * 18) + k * 8), 3, 3); }
    }

    this.post(game, lights, t, dt, view);
  }

  post(game, lights, t, dt, view) {
    const dg = this.dg, DW = W * S, DH = H * S;
    dg.imageSmoothingEnabled = false;
    dg.globalCompositeOperation = 'source-over';
    dg.drawImage(this.low, 0, 0, DW, DH);
    if (this.light) {
      const amb = AMBIENT[game.map.biomeKey] || AMBIENT.meadow;
      const grade = dg.createLinearGradient(0, 0, DW, DH);
      grade.addColorStop(0, amb[0]); grade.addColorStop(0.55, amb[1]); grade.addColorStop(1, amb[2]);
      dg.globalCompositeOperation = 'multiply';
      dg.fillStyle = grade; dg.fillRect(0, 0, DW, DH);
      dg.globalCompositeOperation = 'screen';
      for (let k = 0; k < 4; k++) {
        const x0 = 100 + k * 340 + Math.sin(t * 0.3 + k) * 30;
        const grd = dg.createLinearGradient(x0, 0, x0 + 400, DH);
        grd.addColorStop(0, 'rgba(255,236,190,0.13)'); grd.addColorStop(1, 'rgba(255,236,190,0)');
        dg.fillStyle = grd;
        dg.beginPath(); dg.moveTo(x0, 0); dg.lineTo(x0 + 110, 0); dg.lineTo(x0 + 560, DH); dg.lineTo(x0 + 390, DH); dg.closePath(); dg.fill();
      }
      dg.globalCompositeOperation = 'lighter';
      for (const [x, y, col, r] of lights) {
        if (!(r > 0)) continue;
        const R = r * S;
        const grd = dg.createRadialGradient(x * S, y * S, 0, x * S, y * S, R);
        grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
        dg.fillStyle = grd; dg.fillRect(x * S - R, y * S - R, R * 2, R * 2);
      }
      for (const m of this.motes) {
        m.y -= m.s * 8 * dt; m.x += Math.sin(t + m.p) * 3 * dt;
        if (m.y < -2) { m.y = H + 2; m.x = Math.random() * W; }
        dg.fillStyle = `rgba(255,240,200,${0.22 + 0.22 * Math.sin(t * 2 + m.p)})`;
        dg.fillRect(Math.round(m.x) * S, Math.round(m.y) * S, S, S);
      }
      if (this.filterOK) {
        const sg = this.sg;
        sg.clearRect(0, 0, W / 2, H / 2);
        sg.filter = 'brightness(0.7) contrast(2.2) blur(2px)';
        sg.drawImage(this.cv, 0, 0, W / 2, H / 2);
        sg.filter = 'none';
        dg.globalCompositeOperation = 'screen';
        dg.globalAlpha = 0.45;
        dg.imageSmoothingEnabled = true;
        dg.drawImage(this.small, 0, 0, DW, DH);
        dg.globalAlpha = 1;
        const tg = this.tg;
        tg.globalCompositeOperation = 'source-over';
        tg.clearRect(0, 0, DW, DH);
        tg.filter = 'blur(2px)';
        tg.drawImage(this.cv, 0, 0);
        tg.filter = 'none';
        tg.globalCompositeOperation = 'destination-in';
        const mask = tg.createLinearGradient(0, 0, 0, DH);
        mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(0.12, 'rgba(0,0,0,0)');
        mask.addColorStop(0.88, 'rgba(0,0,0,0)'); mask.addColorStop(1, 'rgba(0,0,0,1)');
        tg.fillStyle = mask; tg.fillRect(0, 0, DW, DH);
        dg.globalCompositeOperation = 'source-over';
        dg.drawImage(this.tmp, 0, 0);
        dg.imageSmoothingEnabled = false;
      }
      dg.globalCompositeOperation = 'source-over';
      const v = dg.createRadialGradient(DW / 2, DH / 2, DH * 0.4, DW / 2, DH / 2, DW * 0.7);
      v.addColorStop(0, 'rgba(8,6,20,0)'); v.addColorStop(1, 'rgba(8,6,20,0.55)');
      dg.fillStyle = v; dg.fillRect(0, 0, DW, DH);
    }
    if (view.paused) { dg.fillStyle = 'rgba(10,8,18,0.55)'; dg.fillRect(0, 0, DW, DH); }
  }

  cellAt(clientX, clientY) {
    const r = this.cv.getBoundingClientRect();
    return { x: Math.floor(((clientX - r.left) / r.width) * COLS), y: Math.floor(((clientY - r.top) / r.height) * ROWS) };
  }
}
