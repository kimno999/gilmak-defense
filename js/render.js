// 전장 그리기. 내부 해상도 384x256 (칸당 16px), CSS로 키워 도트 느낌을 살린다.
import { COLS, ROWS, TILE, ELEMENTS } from './data.js';
import { OCC, idx, cx, cy } from './map.js';
import {
  drawTerrainTile, towerSprite, monsterSprite, stoneSprite, flagSprite, portalSprite, gateSprite, drawText,
} from './sprites.js';

const W = COLS * TILE, H = ROWS * TILE;

export class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.terrain = null;
    this.terrainId = null;
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  buildTerrain(map) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) drawTerrainTile(g, map.grid[idx(x, y)], x, y, map.id & 0xffff, map.grid, COLS, ROWS);
    // 격자 아주 옅게
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = 1; x < COLS; x++) g.fillRect(x * TILE, 0, 1, H);
    for (let y = 1; y < ROWS; y++) g.fillRect(0, y * TILE, W, 1);
    this.terrain = c;
    this.terrainId = map.id;
  }

  pixCircle(x, y, r, color, dotted) {
    const g = this.g;
    g.fillStyle = color;
    const steps = Math.max(24, Math.floor(r * 6.3));
    for (let i = 0; i < steps; i++) {
      if (dotted && i % 2) continue;
      const a = (i / steps) * Math.PI * 2;
      g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
    }
  }

  draw(game, view, now) {
    const g = this.g;
    const anim = this.reduced ? 0 : now / 1000;
    if (this.terrainId !== game.map.id) this.buildTerrain(game.map);
    g.drawImage(this.terrain, 0, 0);
    const m = game.map;

    // 물결
    if (!this.reduced) {
      g.fillStyle = 'rgba(200,235,255,0.45)';
      for (let i = 0; i < m.grid.length; i++) {
        if (m.grid[i] !== 2) continue;
        const ox = Math.floor((anim * 4 + cx(i) * 5 + cy(i) * 3) % 12);
        g.fillRect(cx(i) * TILE + 2 + ox, cy(i) * TILE + 6, 3, 1);
        g.fillRect(cx(i) * TILE + ((ox + 6) % 12) + 1, cy(i) * TILE + 11, 2, 1);
      }
    }

    // 출발·도착·깃발
    g.drawImage(portalSprite(), m.spawn.x * TILE, m.spawn.y * TILE);
    g.drawImage(gateSprite(), m.goal.x * TILE, m.goal.y * TILE);
    m.flags.forEach((f, i) => g.drawImage(flagSprite(i + 1), f.x * TILE, f.y * TILE));

    // 경로 (움직이는 점선)
    const path = game.path;
    if (path && path.length > 1) {
      const off = Math.floor(anim * 8) % 6;
      let step = 0;
      for (let k = 0; k < path.length - 1; k++) {
        const a = path[k], b = path[k + 1];
        const ax = cx(a) * TILE + 8, ay = cy(a) * TILE + 8, bx = cx(b) * TILE + 8, by = cy(b) * TILE + 8;
        const len = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let s = 0; s < len; s++, step++) {
          if ((step + off) % 6 < 2) {
            const px = ax + Math.sign(bx - ax) * s, py = ay + Math.sign(by - ay) * s;
            g.fillStyle = game.block ? '#ff6b6b' : '#ffcf4a';
            g.fillRect(px, py, 1, 1);
          }
        }
      }
    }

    // 돌
    const stone = stoneSprite();
    for (let i = 0; i < game.occ.length; i++) if (game.occ[i] === OCC.STONE) g.drawImage(stone, cx(i) * TILE, cy(i) * TILE);
    // 부서질 칸 표시
    if (game.breaks && game.phase !== 'wave') {
      for (const i of game.breaks) {
        const x = cx(i) * TILE, y = cy(i) * TILE;
        g.fillStyle = (Math.floor(anim * 3) % 2) ? '#ff6b6b' : '#ffd2d2';
        for (let k = 3; k < 13; k++) { g.fillRect(x + k, y + k, 1, 1); g.fillRect(x + 15 - k, y + k, 1, 1); }
      }
    }

    // 하이라이트 대상 (합성·콤바인 재료)
    const hl = new Set(view.highlight || []);

    // 오라 범위 (픽시, 이클립스, 봉인된 레드, 역병)
    for (const t of game.towers) {
      if (t.pending || !t.st) continue;
      const s = t.st;
      const r = (s.buffR || s.auraR || 0) * TILE;
      if (!r) continue;
      const col = s.pixieBuff ? 'rgba(255,138,216,0.55)' : s.buffSpd ? 'rgba(255,224,102,0.6)' : s.auraDmg ? 'rgba(255,138,61,0.6)' : 'rgba(123,224,74,0.5)';
      this.pixCircle(t.x * TILE + 8, t.y * TILE + 8, r, col, true);
    }

    // 산성 늪
    for (const p of game.pools) {
      const a = Math.min(1, p.t / p.max);
      g.fillStyle = `rgba(123,224,74,${0.25 * a})`;
      const r = p.r * TILE;
      for (let yy = -r; yy <= r; yy += 2) for (let xx = -r; xx <= r; xx += 2) {
        if (xx * xx + yy * yy <= r * r && ((xx + yy) / 2) % 2 === 0) g.fillRect(Math.round(p.x * TILE + xx), Math.round(p.y * TILE + yy), 2, 2);
      }
    }

    // 드래곤
    for (const t of game.towers) {
      const x = t.x * TILE, y = t.y * TILE;
      const bob = !this.reduced && t.kind === 'dragon' && t.grade === 0 ? 0 : (!this.reduced && Math.floor(anim * 2 + t.id) % 2 ? -1 : 0);
      if (t.pending) {
        g.fillStyle = (Math.floor(anim * 4) % 2) ? '#ffcf4a' : '#ff8ad8';
        for (let k = 0; k < 16; k += 2) { g.fillRect(x + k, y, 1, 1); g.fillRect(x + k + 1, y + 15, 1, 1); g.fillRect(x, y + k + 1, 1, 1); g.fillRect(x + 15, y + k, 1, 1); }
      }
      if (hl.has(t.id)) {
        g.fillStyle = (Math.floor(anim * 5) % 2) ? '#7be04a' : '#dfffcf';
        g.fillRect(x, y, 16, 1); g.fillRect(x, y + 15, 16, 1); g.fillRect(x, y, 1, 16); g.fillRect(x + 15, y, 1, 16);
      }
      // 그림자
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(x + 4, y + 14, 9, 1);
      g.save();
      if (t.flash > 0) g.filter = 'brightness(1.6)';
      g.drawImage(towerSprite(t), x, y + bob);
      g.restore();
    }

    // 선택된 드래곤 사거리
    if (view.selTower) {
      const t = view.selTower;
      const s = game.effStats(t);
      const x = t.x * TILE, y = t.y * TILE;
      g.fillStyle = '#ffcf4a';
      g.fillRect(x - 1, y - 1, 18, 1); g.fillRect(x - 1, y + 16, 18, 1); g.fillRect(x - 1, y - 1, 1, 18); g.fillRect(x + 16, y - 1, 1, 18);
      if (s.range > 0) this.pixCircle(x + 8, y + 8, s.range * TILE, 'rgba(255,255,255,0.8)');
    }
    if (view.selStone) {
      const { x, y } = view.selStone;
      g.fillStyle = '#ffcf4a';
      g.fillRect(x * TILE - 1, y * TILE - 1, 18, 1); g.fillRect(x * TILE - 1, y * TILE + 16, 18, 1);
      g.fillRect(x * TILE - 1, y * TILE - 1, 1, 18); g.fillRect(x * TILE + 16, y * TILE - 1, 1, 18);
    }

    // 배치 미리보기
    if (view.ghost) {
      const { x, y, sprite, ok, block, range } = view.ghost;
      g.globalAlpha = ok ? 0.65 : 0.3;
      g.drawImage(sprite, x * TILE, y * TILE);
      g.globalAlpha = 1;
      if (!ok) { g.fillStyle = 'rgba(255,107,107,0.35)'; g.fillRect(x * TILE, y * TILE, 16, 16); }
      if (ok && range) this.pixCircle(x * TILE + 8, y * TILE + 8, range * TILE, 'rgba(255,255,255,0.55)', true);
      if (ok && block) {
        g.fillStyle = block === 2 ? '#ff4040' : '#ff9a6b';
        g.fillRect(x * TILE + 6, y * TILE - 7, 4, 6);
        drawText(g, '!', x * TILE + 8, y * TILE - 6, '#fff', null);
      }
    }

    // 몬스터
    const list = game.enemies.slice().sort((a, b) => (a.fly - b.fly) || (a.y - b.y));
    for (const e of list) {
      const sp = monsterSprite(e.kind, e.race);
      const scale = e.boss ? 1.5 : 1;
      const sz = 16 * scale;
      const bob = this.reduced ? 0 : Math.floor(e.anim * 6) % 2;
      const lift = e.fly ? 6 : 0;
      const px = Math.round(e.x * TILE - sz / 2), py = Math.round(e.y * TILE - sz + 4 - lift - bob);
      if (e.fly) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(e.x * TILE) - 4, Math.round(e.y * TILE) + 3, 8, 2); }
      g.save();
      if (e.face < 0) { g.translate(px + sz, py); g.scale(-1, 1); g.drawImage(sp, 0, 0, sz, sz); }
      else g.drawImage(sp, px, py, sz, sz);
      g.restore();
      // 상태 표시
      if (e.slow > 0) { g.fillStyle = '#8fd8ff'; g.fillRect(px + 2, py + sz - 2, sz - 4, 1); }
      if (e.poisonT > 0) { g.fillStyle = '#7be04a'; g.fillRect(px + 3 + (Math.floor(anim * 6) % 4), py + 2, 1, 1); }
      if (e.stunT > 0) { g.fillStyle = '#ffe066'; g.fillRect(px + 4 + (Math.floor(anim * 8) % 8), py - 2, 1, 1); }
      if (e.breaking >= 0) { g.fillStyle = '#ff6b6b'; drawText(g, '!', px + sz / 2, py - 7, '#ff6b6b'); }
      // 체력
      if (e.hp < e.max) {
        const w = Math.round(sz - 4), bx = px + 2, by = py - 3;
        g.fillStyle = '#160f1c'; g.fillRect(bx - 1, by - 1, w + 2, 3);
        const p = Math.max(0, e.hp / e.max);
        g.fillStyle = p > 0.5 ? '#7be04a' : p > 0.25 ? '#ffcf4a' : '#ff6b6b';
        g.fillRect(bx, by, Math.max(1, Math.round(w * p)), 1);
      }
    }

    // 투사체
    for (const p of game.projs) {
      const col = ELEMENTS[p.elem].color;
      const x = Math.round(p.x * TILE), y = Math.round(p.y * TILE);
      g.fillStyle = '#160f1c'; g.fillRect(x - 1, y - 1, 3, 3);
      g.fillStyle = col; g.fillRect(x, y, p.s.splash ? 2 : 1, p.s.splash ? 2 : 1);
      if (p.crit) { g.fillStyle = '#fff'; g.fillRect(x, y, 1, 1); }
    }

    // 효과
    for (const f of game.fx) {
      const k = f.t / f.life;
      const x = f.x * TILE, y = f.y * TILE;
      if (f.k === 'ring') this.pixCircle(x, y, Math.max(1, f.r * TILE * (0.3 + 0.7 * k)), ELEMENTS[f.elem].color, k > 0.5);
      else if (f.k === 'hit') { g.fillStyle = ELEMENTS[f.elem].color; g.fillRect(Math.round(x - 1), Math.round(y - 1 - k * 3), 1, 1); g.fillRect(Math.round(x + 1), Math.round(y - k * 3), 1, 1); }
      else if (f.k === 'gold') drawText(g, `+${f.v}`, x, y - 8 - k * 6, '#ffcf4a');
      else if (f.k === 'crit') drawText(g, '!', x, y - 10 - k * 5, '#ffffff');
      else if (f.k === 'pop') { g.fillStyle = '#ffffff'; const r = 2 + k * 5; for (let a = 0; a < 6; a++) g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 4 + Math.sin(a) * r), 1, 1); }
      else if (f.k === 'burst') { this.pixCircle(x, y, 2 + k * (f.big ? 16 : 10), f.color); if (f.big) this.pixCircle(x, y, 1 + k * 8, '#ffffff', true); }
      else if (f.k === 'break') { g.fillStyle = f.dragon ? '#ff6b6b' : '#8b94a3'; for (let a = 0; a < 8; a++) g.fillRect(Math.round(x + Math.cos(a) * (2 + k * 9)), Math.round(y + Math.sin(a) * (2 + k * 9) + k * 4), 2, 2); }
    }

    if (view.paused) {
      g.fillStyle = 'rgba(10,8,18,0.55)'; g.fillRect(0, 0, W, H);
    }
  }

  cellAt(clientX, clientY) {
    const r = this.cv.getBoundingClientRect();
    return { x: Math.floor(((clientX - r.left) / r.width) * COLS), y: Math.floor(((clientY - r.top) / r.height) * ROWS) };
  }
}
