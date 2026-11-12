// 화면 연결: 패널, 모달(타이틀·튜토리얼·도감·영구 강화·결과), 입력, 게임 루프
import {
  COLS, ROWS, GRADES, DRAGONS, DRAGON_KEYS, COMBOS, COMBO_BY_ID, ELEMENTS, RACES, MATCHUP, MONSTER_NAMES,
  LUCK_TABLE, MAX_LUCK, META_ITEMS, metaCost, metaValue, STONE_REMOVE_COST, ROUNDS_PER_STAGE, HILL_RANGE, T,
} from './data.js';
import { Game, towerName } from './game.js';
import { Renderer } from './render.js';
import { dragonSprite, comboSprite, towerSprite, monsterSprite, stoneSprite, flagSprite, gateSprite, portalSprite, iconCanvas } from './sprites.js';
import { idx } from './map.js';
import { TUTORIAL } from './tutorial.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 */ } },
};
const META_KEY = 'gilmak-meta-v1';
const SEEN_KEY = 'gilmak-seen-v1';
let meta = store.get(META_KEY, { mileage: 0, levels: {}, best: '' });
meta.levels ||= {};
let seen = store.get(SEEN_KEY, {});
const saveMeta = () => store.set(META_KEY, meta);
const markSeen = (k) => { seen[k] = true; store.set(SEEN_KEY, seen); };

const renderer = new Renderer($('cv'));
let game = null;
let running = false;
let speed = 1;
let paused = false;
const view = { selPiece: null, selTower: null, selStone: null, hover: null, highlight: [], ghost: null, paused: false };
let dirty = true;

const gradeColors = ['#9d96b8', '#7be04a', '#4aa8ff', '#c07cff', '#ffcf4a'];

// ---------- 공통 도우미 ----------
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
const icon = (sprite, scale = 3) => iconCanvas(sprite, scale);
const put = (box, ...kids) => box.append(...kids.flat().filter((k) => k != null && k !== false));
const setKids = (box, ...kids) => box.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
const pieceSprite = (p) => (p.kind === 'combo' ? comboSprite(p.type, p.up || 0) : dragonSprite(p.type, p.grade));
const pieceName = (p) => towerName(p);
const elemTag = (e) => el('span', { class: 'tag el', style: `border-color:${ELEMENTS[e].color};color:${ELEMENTS[e].color}`, text: ELEMENTS[e].name });
const targetText = (t) => (t === 'air' ? '공중만' : t === 'ground' ? '지상만' : '지상·공중');
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n * 10) / 10));

let toastTimer = 0;
function toast(msg, kind) {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast ${kind || ''}`;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
}

// ---------- 모달 ----------
function openModal(title, body, foot = [], { closable = true } = {}) {
  $('modalTitle').textContent = title;
  const b = $('modalBody'); b.replaceChildren(...[].concat(body));
  const f = $('modalFoot'); f.replaceChildren(...foot);
  $('modalClose').hidden = !closable;
  $('modal').hidden = false;
  const first = f.querySelector('.btn.primary') || f.querySelector('.btn') || $('modalClose');
  setTimeout(() => first && first.focus(), 30);
}
function closeModal() { $('modal').hidden = true; }
$('modalClose').addEventListener('click', closeModal);
$('modal').addEventListener('click', (e) => { if (e.target === $('modal') && !$('modalClose').hidden) closeModal(); });

// ---------- 타이틀 ----------
function showTitle() {
  const hero = el('div', { class: 'hero' }, ...DRAGON_KEYS.map((k) => icon(dragonSprite(k, 4), 4)));
  const body = el('div', { class: 'title' },
    hero,
    el('p', { text: '라운드마다 드래곤 5마리를 놓고 1마리만 남기세요. 나머지는 돌이 되어 미로가 됩니다. 몬스터를 오래 돌아가게 만들어 섬멸하세요.' }),
    meta.best ? el('p', { text: `최고 기록 ${meta.best} · 보유 마일리지 ${meta.mileage}` }) : el('p', { text: `보유 마일리지 ${meta.mileage}` }),
  );
  openModal('Dragon Merge & Maze', body, [
    el('button', { class: 'btn', type: 'button', text: '영구 강화', onclick: () => showMeta(showTitle) }),
    el('button', { class: 'btn', type: 'button', text: '튜토리얼', onclick: () => showTutorial(0, showTitle) }),
    el('button', { class: 'btn primary', type: 'button', text: '게임 시작', onclick: () => {
      if (!seen.tutorial) showTutorial(0, () => startGame()); else startGame();
    } }),
  ], { closable: false });
}

// ---------- 튜토리얼 ----------
function showTutorial(page, after) {
  const p = TUTORIAL[page];
  const pic = el('div', { class: 'tutpic' });
  for (const it of p.pic) {
    if (it === '>') pic.append(el('span', { class: 'arrow', text: '→' }));
    else if (it === '+') pic.append(el('span', { class: 'plus', text: '+' }));
    else if (typeof it === 'string') pic.append(el('span', { class: 'cap', text: it }));
    else pic.append(icon(spriteFor(it), 3));
  }
  const body = el('div', { class: 'tut' }, pic, el('h3', { text: p.title }), el('ul', {}, ...p.lines.map((l) => el('li', { text: l }))));
  const dots = el('div', { class: 'dots', 'aria-label': `${page + 1} / ${TUTORIAL.length}` }, ...TUTORIAL.map((_, i) => el('i', { class: i === page ? 'on' : '' })));
  const last = page === TUTORIAL.length - 1;
  const done = () => { markSeen('tutorial'); closeModal(); if (after) after(); };
  openModal(`튜토리얼 ${page + 1} / ${TUTORIAL.length}`, body, [
    dots,
    page > 0 ? el('button', { class: 'btn', type: 'button', text: '이전', onclick: () => showTutorial(page - 1, after) }) : null,
    !last ? el('button', { class: 'btn', type: 'button', text: '건너뛰기', onclick: done }) : null,
    el('button', { class: 'btn primary', type: 'button', text: last ? '시작하기' : '다음', onclick: () => (last ? done() : showTutorial(page + 1, after)) }),
  ].filter(Boolean));
}
function spriteFor(it) {
  if (it.d) return dragonSprite(it.d, it.g || 0);
  if (it.c) return comboSprite(it.c, it.up || 0);
  if (it.m) return monsterSprite(it.m, it.r || 'human');
  if (it.s === 'stone') return stoneSprite();
  if (it.s === 'flag') return flagSprite(it.n || 1);
  if (it.s === 'gate') return gateSprite();
  if (it.s === 'portal') return portalSprite();
  return stoneSprite();
}

// ---------- 조합 도감 ----------
function showBook() {
  const have = new Set();
  if (game) for (const t of game.placed()) if (t.kind === 'dragon') have.add(`${t.grade}:${t.type}`);
  const cards = COMBOS.map((c) => {
    const ready = game && game.placed().some((t) => game.matchRecipe(c, t, game.placed()));
    return el('div', { class: `recipe${ready ? ' ready' : ''}` },
      el('div', { class: 'rh' }, icon(comboSprite(c.id, 0), 2.5),
        el('div', {}, el('div', { class: 'rn', text: c.name }), el('div', {}, elemTag(c.elem), el('span', { class: 'tag', text: targetText(c.target) })))),
      el('div', { class: 'rd', text: c.desc }),
      el('div', { class: 'mats' }, ...c.recipe.map(([g, k]) => el('span', { class: `mat${have.has(`${g}:${k}`) ? ' have' : ''}` },
        iconCanvas(dragonSprite(k, g), 1.5), `${GRADES[g].name} ${DRAGONS[k].short}`))),
      el('div', { class: 'rd', text: `업그레이드: ${c.ups.join(' → ')}${ready ? ' · 지금 콤바인 가능!' : ''}` }),
    );
  });
  const bases = DRAGON_KEYS.map((k) => {
    const d = DRAGONS[k];
    return el('div', { class: 'recipe' },
      el('div', { class: 'rh' }, icon(dragonSprite(k, 3), 2.5), el('div', {}, el('div', { class: 'rn', text: d.name }), el('div', {}, elemTag(d.elem), el('span', { class: 'tag', text: targetText(d.target) })))),
      el('div', { class: 'rd', text: d.desc }));
  });
  const elems = ['fire', 'ice', 'poison', 'dark', 'light', 'phys'];
  const table = el('div', { class: 'book' }, ...['human', 'demon', 'fairy'].map((r) => el('div', { class: 'recipe' },
    el('div', { class: 'rh' }, icon(monsterSprite('normal', r), 2.5), el('div', { class: 'rn', text: `${RACES[r].name} 몬스터` })),
    el('div', { class: 'mu' }, ...elems.map((e) => {
      const v = MATCHUP[e][r];
      return el('span', { class: v > 1 ? 'up' : v < 1 ? 'down' : '', text: `${ELEMENTS[e].name} ${v * 100}%` });
    })))));
  openModal('조합 도감', [
    el('p', { text: '초록 테두리는 지금 맵에 재료가 모여서 정비 시간에 콤바인할 수 있는 조합이에요. 재료 칸의 초록 표시는 맵에 있는 재료예요.' }),
    el('div', { class: 'book' }, ...cards),
    el('h3', { class: 'race', style: 'margin:18px 0 8px', text: '기본 드래곤 8종' }),
    el('div', { class: 'book' }, ...bases),
    el('h3', { class: 'race', style: 'margin:18px 0 8px', text: '종족 상성표' }),
    table,
  ]);
}

// ---------- 영구 강화 ----------
function spent() { let s = 0; for (const it of META_ITEMS) { const lv = meta.levels[it.id] || 0; for (let n = 1; n <= lv; n++) s += metaCost(it, n); } return s; }
function showMeta(back) {
  const items = META_ITEMS.map((it) => {
    const lv = meta.levels[it.id] || 0;
    const max = lv >= it.max;
    const cost = max ? null : metaCost(it, lv + 1);
    const sp = it.dragon ? dragonSprite(it.dragon, 2) : it.id === 'life' ? gateSprite() : flagSprite(1);
    return el('div', { class: 'mitem' }, iconCanvas(sp, 2),
      el('div', { class: 'mt' }, el('div', { class: 'ml', text: it.label }), el('div', { class: 'mv', text: `Lv.${lv}/${it.max} · ${it.fmt(lv * it.per)}` })),
      el('button', { class: 'btn', type: 'button', disabled: max || meta.mileage < cost, text: max ? '최대' : `+ ${cost}`, onclick: () => {
        if (meta.mileage < cost) return;
        meta.mileage -= cost; meta.levels[it.id] = lv + 1; saveMeta(); showMeta(back);
      } }));
  });
  const used = spent();
  const body = [
    el('div', { class: 'metahead' }, el('div', {}, el('div', { class: 'tag', text: '보유 마일리지' }), el('div', { class: 'mileage', text: meta.mileage })),
      el('p', { class: 'meta', text: '한 판이 끝나면 도달한 진도만큼 마일리지를 얻어요. 강화는 다음 판부터 적용돼요. 조합 드래곤은 재료 강화의 25%를 이어받아요.' })),
    el('div', { class: 'metagrid' }, ...items),
  ];
  openModal('영구 강화', body, [
    el('button', { class: 'btn', type: 'button', disabled: used === 0, text: `다시 찍기 (무료, ${used} 돌려받기)`, onclick: () => {
      meta.mileage += used; meta.levels = {}; saveMeta(); showMeta(back);
    } }),
    el('button', { class: 'btn primary', type: 'button', text: '돌아가기', onclick: () => { closeModal(); if (back) back(); } }),
  ], { closable: false });
}

// ---------- 게임 시작 ----------
function startGame() {
  closeModal();
  game = new Game({ meta: { levels: { ...meta.levels } } });
  view.selPiece = game.draw[0] ? game.draw[0].pid : null;
  view.selTower = null; view.selStone = null;
  running = true; paused = false; speed = 1;
  game.on('toast', (m, k) => toast(m, k));
  game.on('change', () => { dirty = true; });
  game.on('stage', () => { dirty = true; });
  game.on('alert', onAlert);
  game.on('leak', () => { flashLives(); });
  game.on('stageclear', onStageClear);
  game.on('over', onOver);
  dirty = true;
  sfx.unlock();
  maybeHint();
}

// ---------- 원힛·콤바인 알림: 맵 표시, 배너, 효과음, 도감 버튼 (다음 제작 목록 2번) ----------
const sfx = (() => {
  let ac = null;
  let on = store.get('gilmak-sound', true);
  const tone = (f, t0, dur, type = 'triangle', vol = 0.18) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, ac.currentTime + t0);
    g.gain.setValueAtTime(0.0001, ac.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + 0.05);
  };
  return {
    get on() { return on; },
    set on(v) { on = v; store.set('gilmak-sound', v); },
    unlock() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; } },
    play(kind) {
      if (!on || !ac) return;
      try {
        if (kind === 'onehit') {
          [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.35));
          [1568, 2093].forEach((f, i) => tone(f, 0.4 + i * 0.06, 0.5, 'sine', 0.1));
        } else if (kind === 'combine') {
          tone(659, 0, 0.25); tone(988, 0.1, 0.4);
        } else if (kind === 'merge') {
          tone(440, 0, 0.15); tone(660, 0.07, 0.25);
        }
      } catch (e) { /* 소리 실패는 무시 */ }
    },
  };
})();

let bannerTimer = 0;
function showBanner(kind, text) {
  const b = $('banner');
  b.hidden = true; void b.offsetWidth;
  b.className = `banner ${kind}`;
  $('bannerKind').textContent = kind === 'onehit' ? '럭키 원힛!' : '콤바인 가능!';
  $('bannerText').textContent = text;
  b.hidden = false;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { b.hidden = true; }, 2700);
}

function renderBubbles() {
  const box = $('bubbles');
  box.replaceChildren();
  view.alertMats = [];
  if (!game || !running) return;
  const o = game.opportunities();
  const list = [...o.oneHit.map((x) => ({ ...x, kind: 'onehit' })), ...o.combine.map((x) => ({ ...x, kind: 'combine' }))];
  const used = new Set();
  for (const it of list) {
    for (const m of it.mats) view.alertMats.push({ id: m.id, kind: it.kind });
    const head = it.mats[0];
    if (used.has(head.id)) continue;
    used.add(head.id);
    box.append(el('div', {
      class: `bubble ${it.kind}`,
      style: `left:${((head.x + 0.5) / COLS) * 100}%;top:${(head.y / ROWS) * 100}%`,
      text: it.kind === 'onehit' ? `원힛! ${it.combo.name}` : `콤바인! ${it.combo.name}`,
    }));
  }
  const n = list.length;
  const badge = $('bookBadge');
  badge.hidden = !n; badge.textContent = n;
  $('btnBook').classList.toggle('blink', n > 0);
}

function onAlert(a) {
  if (a.type === 'onehit') {
    showBanner('onehit', `${a.combo.name}을(를) 이번 라운드에 바로 만들 수 있어요`);
    sfx.play('onehit');
    game.fx.push({ k: 'burst', x: a.mats[0].x + 0.5, y: a.mats[0].y + 0.5, t: 0, life: 1.2, color: '#ffe066', big: true });
  } else {
    showBanner('combine', `${a.combo.name} · 정비 시간에 콤바인할 수 있어요`);
    sfx.play('combine');
  }
  dirty = true;
}

$('btnSound').addEventListener('click', () => {
  sfx.on = !sfx.on;
  sfx.unlock();
  $('btnSound').textContent = sfx.on ? '소리 켜짐' : '소리 꺼짐';
  $('btnSound').setAttribute('aria-pressed', String(sfx.on));
  if (sfx.on) sfx.play('combine');
});
$('btnSound').textContent = sfx.on ? '소리 켜짐' : '소리 꺼짐';
$('btnSound').setAttribute('aria-pressed', String(sfx.on));

// ---------- 메뉴: 다시 시작, 게임 포기 (다음 제작 목록 9번) ----------
function showMenu() {
  if (!game || !running) { showTitle(); return; }
  const m = game.mileageNow();
  openModal('메뉴', [
    el('p', { text: `지금 ${game.roundLabel()}${game.phase === 'wave' ? ' 웨이브 진행 중' : ''}이에요. 게임은 멈춰 있어요.` }),
    el('p', { text: `지금 그만두면 클리어한 라운드까지 계산해서 마일리지 +${m}을(를) 받아요.${game.phase === 'wave' ? ' 진행 중인 라운드는 빼고 계산해요.' : ''}` }),
  ], [
    el('button', { class: 'btn', type: 'button', text: '게임 포기', onclick: () => confirmQuit('giveup', m) }),
    el('button', { class: 'btn', type: 'button', text: '다시 시작', onclick: () => confirmQuit('restart', m) }),
    el('button', { class: 'btn', type: 'button', text: '도움말', onclick: () => showTutorial(0, null) }),
    el('button', { class: 'btn primary', type: 'button', text: '계속하기', onclick: closeModal }),
  ]);
}
function confirmQuit(kind, m) {
  openModal(kind === 'restart' ? '다시 시작할까요?' : '게임을 포기할까요?', [
    el('p', { text: `마일리지 +${m}을(를) 받고 ${kind === 'restart' ? '새 게임을 바로 시작해요' : '결과 화면으로 가요'}. 되돌릴 수 없어요.` }),
  ], [
    el('button', { class: 'btn', type: 'button', text: '취소', onclick: showMenu }),
    el('button', { class: 'btn primary', type: 'button', text: kind === 'restart' ? `+${m} 받고 다시 시작` : `+${m} 받고 포기`, onclick: () => {
      quitKind = kind;
      game.giveUp();
    } }),
  ]);
}
let quitKind = null;
$('btnMenu').addEventListener('click', showMenu);
// 빛 효과 켜기/끄기 (느린 컴퓨터용)
renderer.light = store.get('gilmak-light', true);
const syncLight = () => { $('btnLight').textContent = renderer.light ? '빛 효과 켜짐' : '빛 효과 꺼짐'; $('btnLight').setAttribute('aria-pressed', String(renderer.light)); };
$('btnLight').addEventListener('click', () => { renderer.light = !renderer.light; store.set('gilmak-light', renderer.light); syncLight(); });
syncLight();

function onStageClear() {
  openModal(`스테이지 ${game.stage} 클리어!`, [
    el('p', { text: `${ROUNDS_PER_STAGE}라운드를 모두 막았어요! 마일리지 보너스 +${30 * game.stage}이 쌓였어요.` }),
    el('p', { text: '다음 스테이지는 새 지형에서 알부터 다시 시작해요. 드래곤과 돌은 모두 사라지고, 골드와 승급 단계는 처음으로 돌아가요. 남은 생명은 그대로 이어 가요.' }),
  ], [el('button', { class: 'btn primary', type: 'button', text: `스테이지 ${game.stage + 1} 시작`, onclick: () => { closeModal(); game.nextStage(); view.selPiece = game.draw[0] && game.draw[0].pid; view.selTower = null; view.selStone = null; dirty = true; } })], { closable: false });
}

function onOver(mileage) {
  running = false;
  meta.mileage += mileage;
  const label = game.roundLabel();
  const better = !meta.best || cmpRound(label, meta.best) > 0;
  if (better) meta.best = label;
  saveMeta();
  const s = game.stats;
  if (quitKind === 'restart') { quitKind = null; toast(`마일리지 +${mileage}을(를) 받았어요`, 'good'); startGame(); return; }
  const gave = quitKind === 'giveup';
  quitKind = null;
  openModal(gave ? '게임 포기' : '게임 오버', [
    el('div', { class: 'result' },
      el('div', {}, el('span', { text: '도달' }), el('b', { text: label })),
      el('div', {}, el('span', { text: '처치' }), el('b', { text: s.kills })),
      el('div', {}, el('span', { text: '부서진 돌' }), el('b', { text: s.stonesBroken })),
      el('div', {}, el('span', { text: '잃은 드래곤' }), el('b', { text: s.dragonsLost })),
      el('div', {}, el('span', { text: '얻은 마일리지' }), el('b', { text: `+${mileage}` })),
      el('div', {}, el('span', { text: '보유 마일리지' }), el('b', { text: meta.mileage })),
    ),
    el('p', { text: better ? '최고 기록이에요! 마일리지로 영구 강화를 하면 다음 판이 조금 수월해져요.' : '마일리지로 영구 강화를 하면 다음 판이 조금 수월해져요.' }),
  ], [
    el('button', { class: 'btn', type: 'button', text: '영구 강화', onclick: () => showMeta(() => onOverMenu()) }),
    el('button', { class: 'btn primary', type: 'button', text: '다시 시작', onclick: () => startGame() }),
  ], { closable: false });
}
function onOverMenu() {
  openModal('다음 판 준비', [el('p', { text: `보유 마일리지 ${meta.mileage}. 준비되면 다시 시작하세요.` })], [
    el('button', { class: 'btn', type: 'button', text: '영구 강화', onclick: () => showMeta(onOverMenu) }),
    el('button', { class: 'btn primary', type: 'button', text: '다시 시작', onclick: () => startGame() }),
  ], { closable: false });
}
function cmpRound(a, b) { const [as, ar] = a.split('-').map(Number); const [bs, br] = b.split('-').map(Number); return as - bs || ar - br; }

function flashLives() { const v = $('hLives'); v.classList.add('low'); setTimeout(() => { if (game && game.lives > 5) v.classList.remove('low'); }, 300); }

// ---------- 상황별 도움말 (첫 판) ----------
const HINTS = {
  place: '오른쪽 "이번 라운드 드래곤"에서 하나를 고르고 지도의 빈칸을 누르면 놓여요. 노란 점선이 몬스터 경로예요. 잘못 놓았으면 그 드래곤을 누르고 다른 빈칸을 눌러 옮길 수 있어요.',
  choose: '이제 하나만 남길 차례예요. 깜빡이는 테두리의 드래곤을 눌러 "이 드래곤 남기기"를 누르세요. 나머지 4마리는 돌이 되어 미로 벽이 돼요.',
  merge2: '이번 라운드에 같은 종류·같은 등급이 2마리 나왔어요! 그중 하나를 누르고 "2마리 합성해서 남기기"를 누르면 한 단계 높은 드래곤이 돼요.',
  onehit: '럭키 원힛! 이번 라운드 5마리 안에 조합 재료가 다 있어요. 재료 하나를 누르고 무지개색 "원힛" 버튼을 누르면 그 자리에 조합 드래곤이 생겨요.',
  prep: '정비 시간이에요. 3마리 합성, 콤바인, 업그레이드, 돌 치우기를 할 수 있어요. 준비되면 "웨이브 시작"을 누르세요.',
  merge3: '맵에 같은 종류·같은 등급 드래곤이 3마리 모였어요. 하나를 누르고 "3마리 합성"을 누르면 그 자리가 한 단계 높아지고, 나머지 2자리는 돌이 돼요.',
  combine: '조합 재료가 맵에 모였어요! 재료 하나를 누르고 "콤바인"을 누르면 그 자리에 조합 드래곤이 생겨요. 웨이브 중에는 할 수 없어요.',
  luck: '골드가 모였어요. 오른쪽 "승급"에서 골드를 쓰면 높은 등급 드래곤이 나올 확률이 올라가요. 승급은 스테이지가 바뀌면 처음으로 돌아가요.',
  block: '길이 완전히 막혔어요! 이대로면 몬스터가 빨간 X 칸의 돌을 부수고, 그래도 막히면 드래곤까지 부숴요. 부서진 드래곤은 영구히 사라져요.',
};
let hintKey = null;
$('hintClose').addEventListener('click', () => { if (hintKey) markSeen(`hint_${hintKey}`); hintKey = null; maybeHint(); });
function wantedHint() {
  const ph = game.phase;
  if (ph === 'wave' || ph === 'over' || ph === 'stageclear') return null;
  const cands = [];
  if (game.block) cands.push('block');
  if (ph === 'choose') {
    if (game.pendings().some((t) => game.oneHits(t).length)) cands.push('onehit');
    if (game.pendings().some((t) => game.merge2Partner(t))) cands.push('merge2');
    cands.push('choose');
  } else if (ph === 'prep') {
    if (game.placed().some((t) => game.combines(t).length)) cands.push('combine');
    if (game.placed().some((t) => game.merge3Partners(t))) cands.push('merge3');
    if (game.gold >= 20 && game.luck === 0) cands.push('luck');
    cands.push('prep');
  } else if (ph === 'place') cands.push('place');
  return cands.find((k) => !seen[`hint_${k}`]) || null;
}
function maybeHint() {
  if (!game || !running) { $('hint').hidden = true; return; }
  const k = wantedHint();
  if (!k) { hintKey = null; $('hint').hidden = true; return; }
  if (k !== hintKey) { hintKey = k; $('hintText').textContent = HINTS[k]; }
  $('hint').hidden = false;
}

// ---------- 패널 ----------
function renderTray() {
  const tray = $('tray');
  tray.replaceChildren();
  const ph = game.phase;
  $('trayTitle').textContent = ph === 'place' ? `이번 라운드 드래곤 (${game.draw.length}마리 남음)` : '이번 라운드 드래곤';
  if (ph === 'place' && game.draw.length) {
    if (!game.draw.find((p) => p.pid === view.selPiece)) view.selPiece = game.draw[0].pid;
    for (const p of game.draw) {
      tray.append(el('button', {
        class: `piece${p.pid === view.selPiece ? ' on' : ''}`, type: 'button',
        'aria-label': pieceName(p), onclick: () => { view.selPiece = p.pid; view.selTower = null; view.selStone = null; dirty = true; },
      }, icon(pieceSprite(p), 2.5), el('span', { class: 'n', text: pieceName(p) }), el('span', { class: 'c', text: ELEMENTS[p.kind === 'combo' ? COMBO_BY_ID[p.type].elem : DRAGONS[p.type].elem].name })));
    }
    if (!game.hasFreeCell()) {
      tray.append(el('button', { class: 'btn small', type: 'button', style: 'grid-column:1/-1', text: '놓을 자리가 없어요 · 남은 드래곤 보내기', onclick: () => game.discardRemaining() }));
    }
  } else {
    const msg = ph === 'choose' ? '5마리를 모두 놓았어요. 지도에서 남길 드래곤을 고르세요.'
      : ph === 'prep' ? '이번 라운드 선택 완료. 정비 후 웨이브를 시작하세요.'
        : ph === 'wave' ? '웨이브가 끝나면 새 드래곤 5마리가 나와요.' : '';
    tray.append(el('p', { class: 'empty', text: msg }));
  }
}

function statsBlock(t, s) {
  const items = [];
  if (s.dmg > 0) items.push(['공격력', fmt(s.dmg)]);
  if (s.dmg > 0) items.push(['공격 간격', `${s.rate.toFixed(2)}초`]);
  if (s.range > 0) items.push(['사거리', `${s.range.toFixed(1)}칸`]);
  if (s.splash) items.push(['범위', `${s.splash.toFixed(1)}칸`]);
  if (s.multi > 1) items.push(['동시 공격', `${s.multi}마리`]);
  if (s.crit) items.push(['치명타', `${Math.round(s.crit * 100)}% ×${s.critX}`]);
  if (s.slow) items.push(['슬로우', `${Math.round(s.slow * 100)}%`]);
  if (s.poison) items.push(['독', `초당 ${fmt(s.poison)}`]);
  if (s.stun) items.push(['기절', `${s.stun.toFixed(1)}초${s.stunChance < 1 ? ` (${Math.round(s.stunChance * 100)}%)` : ''}`]);
  if (s.shred) items.push(['방어력 감소', `−${fmt(s.shred)}`]);
  if (s.pool) items.push(['산성 늪', `−${fmt(s.pool.shred)} 방어`]);
  if (s.auraDmg) items.push(['화염 오라', `초당 ${fmt(s.auraDmg)}`]);
  if (s.auraSlow) items.push(['슬로우 오라', `${Math.round(s.auraSlow * 100)}%`]);
  if (s.auraPoison) items.push(['독기 오라', `초당 ${fmt(s.auraPoison)}`]);
  if (s.pixieBuff) items.push(['공속 버프', `+${Math.round(s.pixieBuff * 100)}%`]);
  if (s.buffSpd) items.push(['아군 버프', `공속+${Math.round(s.buffSpd * 100)}% 공+${Math.round(s.buffDmg * 100)}%`]);
  if (s.auraShred) items.push(['방어 감소 오라', `−${fmt(s.auraShred)}`]);
  if (s.buffR || s.auraR) items.push(['오라 범위', `${(s.buffR || s.auraR).toFixed(1)}칸`]);
  return el('dl', { class: 'stats' }, ...items.slice(0, 9).map(([k, v]) => el('div', {}, el('dt', { text: k }), el('dd', { text: v }))));
}

function towerDesc(t) {
  return t.kind === 'combo' ? COMBO_BY_ID[t.type].desc : DRAGONS[t.type].desc;
}

function setHighlight(list) { view.highlight = list.map((t) => t.id); }

// 이 드래곤이 재료로 쓰이는 조합 (다음 제작 목록 3번)
function usesBlock(type, grade, selfId) {
  const exactOf = (c) => Number(c.recipe.some(([g, k]) => k === type && g === grade));
  const list = COMBOS.filter((c) => c.recipe.some(([, k]) => k === type)).sort((a, b) => exactOf(b) - exactOf(a));
  if (!list.length) return null;
  const onMap = (g, k) => game.towers.some((t) => t.kind === 'dragon' && t.type === k && t.grade === g && t.id !== selfId);
  const items = list.map((c) => {
    const exact = c.recipe.some(([g, k]) => k === type && g === grade);
    const mats = c.recipe.map(([g, k]) => {
      const me = exact && k === type && g === grade;
      const have = me || onMap(g, k);
      return el('span', { class: me ? 'me' : have ? 'ok' : 'no', text: `${me ? '이 드래곤' : `${GRADES[g].name} ${DRAGONS[k].short}`} ${me ? '' : have ? '✓' : '✗'}`.trim() });
    });
    const need = c.recipe.filter(([, k]) => k === type).map(([g]) => GRADES[g].name).join(', ');
    return el('div', { class: 'use' },
      el('div', { class: 'un' }, iconCanvas(comboSprite(c.id, 0), 1.5), c.name),
      el('div', { class: 'um' }, ...mats),
      exact ? null : el('div', { class: 'meta', style: 'margin:4px 0 0', text: `이 조합에는 ${need} 단계가 필요해요` }));
  });
  return el('div', { class: 'uses' }, el('h5', { text: `이 드래곤이 쓰이는 조합 (${list.length})` }), ...items);
}

function renderInfo() {
  const box = $('info');
  box.replaceChildren();
  view.highlight = [];
  const ph = game.phase;
  const t = view.selTower ? game.getTower(view.selTower.id) : null;
  if (view.selTower && !t) view.selTower = null;

  if (view.selStone) {
    const can = (ph === 'prep' || ph === 'place') && game.isStone(view.selStone.x, view.selStone.y);
    put(box, el('h4', {}, icon(stoneSprite(), 2.5), '돌'),
      el('p', { class: 'meta', text: '남기지 않은 드래곤이 변한 벽이에요. 치우면 그 칸이 비고 경로가 달라져요.' }),
      el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', disabled: !can || game.gold < STONE_REMOVE_COST, text: `돌 치우기 ${STONE_REMOVE_COST}골드`, onclick: () => { if (game.removeStone(view.selStone.x, view.selStone.y)) view.selStone = null; } })));
    return;
  }

  if (t) {
    const s = game.effStats(t);
    const head = el('h4', {}, icon(towerSprite(t), 2.5), towerName(t));
    const tags = el('div', {}, elemTag(s.elem), el('span', { class: 'tag', text: targetText(s.target) }),
      t.kind === 'combo' ? el('span', { class: 'tag', text: t.up ? '조합 · 업그레이드' : '조합' }) : el('span', { class: 'tag', text: `${t.grade + 1}단계` }),
      t.hill ? el('span', { class: 'tag', text: `고지대 +${HILL_RANGE}` }) : null,
      t.pixieIn ? el('span', { class: 'tag', text: `픽시 버프 +${Math.round(t.pixieIn * 100)}%` }) : null,
      t.eclipseIn ? el('span', { class: 'tag', text: `일식 버프 +${Math.round(t.eclipseIn * 100)}%` }) : null);
    put(box, head, tags, el('p', { class: 'meta', text: towerDesc(t) }), statsBlock(t, s));
    const acts = el('div', { class: 'acts' });
    if (game.canRelocate(t)) {
      acts.append(el('p', { class: 'meta', style: 'margin:0;color:#8fd8ff', text: '이번 라운드 드래곤이라 옮길 수 있어요. 빈칸을 누르면 그 자리로 옮겨져요.' }));
      acts.append(el('button', { class: 'btn small', type: 'button', text: '되돌리기 (목록으로)', onclick: () => {
        const p = game.returnTower(t); view.selTower = null; if (p) view.selPiece = p.pid; dirty = true;
      } }));
    }
    if (ph === 'choose' && t.pending) {
      for (const c of game.oneHits(t)) {
        acts.append(el('button', { class: 'btn lucky', type: 'button', text: `원힛! ${c.name} 만들기`, onclick: () => { game.oneHit(t, c.id); view.selTower = null; } }));
      }
      const p2 = game.merge2Partner(t);
      if (p2) {
        acts.append(el('button', { class: 'btn good', type: 'button', text: `2마리 합성해서 남기기 → ${GRADES[t.grade + 1].name} ${DRAGONS[t.type].short}`, onclick: () => { game.merge2(t); view.selTower = null; } }));
        setHighlight([p2]);
      }
      acts.append(el('button', { class: 'btn primary', type: 'button', text: '이 드래곤 남기기', onclick: () => { game.keep(t); view.selTower = null; } }));
      acts.append(el('p', { class: 'meta', text: '남기지 않은 나머지 4마리는 돌이 돼요.' }));
    } else if (ph === 'prep' && !t.pending) {
      const ps = game.merge3Partners(t);
      if (ps) {
        acts.append(el('button', { class: 'btn good', type: 'button', text: `3마리 합성 → ${GRADES[t.grade + 1].name} ${DRAGONS[t.type].short}`, onclick: () => game.merge3(t), onmouseenter: () => { setHighlight(ps); } }));
        setHighlight(ps);
      }
      for (const c of game.combines(t)) {
        const ms = game.combineMaterials(t, c.id);
        acts.append(el('button', { class: 'btn lucky', type: 'button', text: `콤바인: ${c.name}`, onclick: () => game.combine(t, c.id), onmouseenter: () => setHighlight(ms) }));
        if (!ps) setHighlight(ms);
      }
      const uc = game.upgradeCost(t);
      if (uc != null) {
        const c = COMBO_BY_ID[t.type];
        acts.append(el('button', { class: 'btn', type: 'button', disabled: game.gold < uc, text: `업그레이드 → ${c.ups[t.up]} (${uc}골드)`, onclick: () => game.upgrade(t) }));
      }
      if (!acts.children.length) acts.append(el('p', { class: 'meta', text: t.kind === 'dragon' ? '같은 종류·등급 3마리를 모으거나, 조합 도감의 재료를 모으면 여기에 버튼이 생겨요.' : '더 업그레이드할 수 없어요.' }));
    } else if (ph === 'wave') {
      acts.append(el('p', { class: 'meta', text: '웨이브 중에는 합성·콤바인을 할 수 없어요.' }));
    }
    put(box, acts, t.kind === 'dragon' ? usesBlock(t.type, t.grade, t.id) : null);
    return;
  }

  // 선택 없음: 단계별 안내
  if (ph === 'place') {
    const p = game.draw.find((q) => q.pid === view.selPiece);
    if (p) {
      const fake = { ...p, id: -1, x: 0, y: 0, hill: false };
      const s = game.baseStats(fake);
      put(box, el('h4', {}, icon(pieceSprite(p), 2.5), pieceName(p)),
        el('div', {}, elemTag(s.elem), el('span', { class: 'tag', text: targetText(s.target) })),
        el('p', { class: 'meta', text: `${p.kind === 'combo' ? COMBO_BY_ID[p.type].desc : DRAGONS[p.type].desc}. 지도의 빈칸을 눌러 놓으세요.` }),
        statsBlock(fake, s), p.kind === 'dragon' ? usesBlock(p.type, p.grade, -1) : null);
    }
  } else if (ph === 'choose') {
    const anyOne = game.pendings().some((q) => game.oneHits(q).length);
    const any2 = game.pendings().some((q) => game.merge2Partner(q));
    put(box, el('h4', { text: '하나만 남기기' }),
      el('p', { class: 'meta', text: '깜빡이는 테두리의 드래곤을 눌러 남길 드래곤을 고르세요. 나머지 4마리는 돌이 되어 미로 벽이 돼요.' }),
      anyOne ? el('p', { class: 'meta', style: 'color:#ffcf4a', text: '럭키 원힛 가능! 조합 재료가 이번 라운드에 다 모였어요.' }) : null,
      any2 ? el('p', { class: 'meta', style: 'color:#7be04a', text: '같은 드래곤 2마리가 있어서 합성해서 남길 수 있어요.' }) : null);
  } else if (ph === 'prep') {
    const n3 = game.placed().filter((q) => game.merge3Partners(q)).length;
    const nc = game.placed().filter((q) => game.combines(q).length).length;
    put(box, el('h4', { text: '정비 시간' }),
      el('p', { class: 'meta', text: '드래곤을 눌러 합성·콤바인·업그레이드를 하고, 돌을 눌러 치울 수 있어요. 준비되면 웨이브를 시작하세요.' }),
      n3 ? el('p', { class: 'meta', style: 'color:#7be04a', text: '3마리 합성할 수 있는 드래곤이 있어요.' }) : null,
      nc ? el('p', { class: 'meta', style: 'color:#ffcf4a', text: '콤바인할 수 있는 조합이 있어요! 조합 도감에서 확인하세요.' }) : null);
  } else if (ph === 'wave') {
    put(box, el('h4', { text: '웨이브 진행 중' }), el('p', { class: 'meta', text: '드래곤을 눌러 능력치와 사거리를 볼 수 있어요.' }));
  }
}

function renderLuck() {
  const box = $('luckPanel');
  const row = LUCK_TABLE[game.luck];
  const bar = el('div', { class: 'luckbar' }, ...[1, 2, 3, 4, 5].map((i) => el('span', { style: `width:${row[i]}%;background:${gradeColors[i - 1]}` })));
  const legend = el('div', { class: 'legend5' }, ...GRADES.map((g, i) => el('div', {}, el('b', { class: `g${i}` }), `${g.name}`, el('br'), `${row[i + 1]}%`)));
  const cost = game.luckCost();
  const next = cost != null ? LUCK_TABLE[game.luck + 1] : null;
  setKids(box, el('h3', { text: `승급 ${game.luck} / ${MAX_LUCK}단계` }), bar, legend,
    el('button', {
      class: 'btn small block', type: 'button', style: 'margin-top:8px', disabled: cost == null || game.gold < cost || game.phase === 'wave' || game.phase === 'over',
      text: cost == null ? '최대 승급' : `승급하기 ${cost}골드 → 다음: ${next.slice(1).map((v) => `${v}`).join('/')}%`, onclick: () => game.buyLuck(),
    }));
}

function renderWave() {
  const box = $('wavePanel');
  const w = game.nextWave();
  const counts = {};
  for (const k of w.list) counts[k] = (counts[k] || 0) + 1;
  const comp = Object.entries(counts).map(([k, n]) => `${MONSTER_NAMES[w.race][k]} ${n}`).join(' · ');
  const elems = ['fire', 'ice', 'poison', 'dark', 'light'];
  const strong = elems.filter((e) => MATCHUP[e][w.race] > 1).map((e) => ELEMENTS[e].name);
  const weak = elems.filter((e) => MATCHUP[e][w.race] < 1).map((e) => ELEMENTS[e].name);
  setKids(box, el('h3', { text: game.phase === 'wave' ? `진행 중 · 라운드 ${game.roundLabel()}` : `다음 웨이브 · 라운드 ${game.roundLabel()}` }),
    el('div', {}, icon(monsterSprite(w.list.includes('boss') ? 'boss' : w.list[0], w.race), 2), ' ', el('span', { class: `race ${w.race}`, text: `${RACES[w.race].name} 종족` })),
    el('p', { class: 'meta', style: 'margin:4px 0', text: comp }),
    el('div', { class: 'mu' }, el('span', { class: 'up', text: `잘 듣는 속성: ${strong.join(', ')} 125%` }), el('span', { class: 'down', text: `약한 속성: ${weak.join(', ')} 75%` })),
    w.list.includes('flying') ? el('p', { class: 'meta', style: 'margin:6px 0 0;color:#8fd8ff', text: '비행 몬스터는 길을 무시하고 깃발 사이를 날아가요. 실버는 못 맞히고 쉐도우가 강해요.' }) : null,
    w.list.includes('boss') ? el('p', { class: 'meta', style: 'margin:6px 0 0;color:#ff6b6b', text: '보스 라운드! 보스가 새면 생명 5를 잃어요.' }) : null);
}

function renderHud() {
  $('hRound').textContent = game.roundLabel();
  $('hGold').textContent = Math.floor(game.gold);
  $('hLives').textContent = game.lives;
  $('hLives').classList.toggle('low', game.lives <= 5);
  $('hPath').textContent = `${Math.max(0, game.path.length - 1)}칸`;
  const ph = game.phase;
  $('phaseLine').textContent = ph === 'place' ? `드래곤 배치: ${game.draw.length}마리를 지도에 놓으세요`
    : ph === 'choose' ? '하나만 남기기: 남길 드래곤을 고르세요'
      : ph === 'prep' ? '정비 시간: 합성·콤바인 후 웨이브를 시작하세요'
        : ph === 'wave' ? '웨이브 진행 중' : ph === 'over' ? '게임 오버' : '스테이지 클리어';
  const st = $('btnStart');
  st.disabled = ph !== 'prep';
  st.textContent = ph === 'prep' ? `웨이브 시작 (${game.roundLabel()})` : ph === 'place' ? `드래곤 배치 중 (${game.draw.length}마리 남음)` : ph === 'choose' ? '남길 드래곤을 고르세요' : ph === 'wave' ? '웨이브 진행 중…' : '대기';
  $('btnSpeed').textContent = `속도 ×${speed}`;
  $('btnPause').textContent = paused ? '계속하기' : '일시정지';
  $('mapName').textContent = `스테이지 ${game.stage} · ${game.map.biome}`;
  const cnt = [0, 0, 0, 0, 0];
  for (const t of game.map.grid) cnt[t]++;
  $('mapTags').textContent = `깃발 4 · 바위 ${cnt[T.ROCK]} · 물 ${cnt[T.WATER]} · 진흙 ${cnt[T.MUD]} · 고지대 ${cnt[T.HILL]}`;
}

function renderAll() {
  if (!game) return;
  renderHud();
  renderTray();
  renderInfo();
  renderLuck();
  renderWave();
  renderBubbles();
  maybeHint();
}

// ---------- 입력 ----------
const cv = $('cv');
cv.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const c = renderer.cellAt(e.clientX, e.clientY);
  if (!view.hover || view.hover.x !== c.x || view.hover.y !== c.y) { view.hover = c; updateGhost(); }
});
cv.addEventListener('pointerleave', () => { view.hover = null; view.ghost = null; });
cv.addEventListener('click', (e) => {
  if (!game || !running) return;
  const { x, y } = renderer.cellAt(e.clientX, e.clientY);
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  const t = game.towerAtCell(x, y);
  if (t) { view.selTower = view.selTower && view.selTower.id === t.id ? null : t; view.selStone = null; dirty = true; return; }
  if (game.isStone(x, y)) { view.selStone = view.selStone && view.selStone.x === x && view.selStone.y === y ? null : { x, y }; view.selTower = null; dirty = true; return; }
  // 이번 라운드 드래곤을 고른 상태에서 빈칸을 누르면 옮긴다
  if (view.selTower && game.canRelocate(view.selTower)) {
    const mv = view.selTower;
    if (game.moveTower(mv, x, y)) { view.selTower = game.getTower(mv.id); dirty = true; return; }
  }
  if (view.selTower || view.selStone) { view.selTower = null; view.selStone = null; dirty = true; if (game.phase !== 'place') return; }
  if (game.phase === 'place' && view.selPiece != null) {
    if (game.placePiece(view.selPiece, x, y)) {
      view.selPiece = game.draw[0] ? game.draw[0].pid : null;
      if (e.pointerType === 'touch') view.hover = null;
      updateGhost();
    }
  }
});

let ghostKey = '';
function updateGhost() {
  view.ghost = null;
  if (!game || game.phase !== 'place' || !view.hover || view.selPiece == null) return;
  const { x, y } = view.hover;
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  if (game.towerAtCell(x, y) || game.isStone(x, y)) return;
  const p = game.draw.find((q) => q.pid === view.selPiece);
  if (!p) return;
  const c = game.canPlace(x, y);
  const key = `${x},${y},${p.pid},${game.towers.length}`;
  let block = 0;
  if (c.ok) block = game.previewBlock(x, y);
  ghostKey = key;
  const s = game.baseStats({ ...p, id: -1 });
  view.ghost = { x, y, sprite: pieceSprite(p), ok: c.ok, block, range: s.range + (game.map.grid[idx(x, y)] === T.HILL && s.range > 0 ? HILL_RANGE : 0) };
}

$('btnStart').addEventListener('click', () => { if (game && game.startWave()) { view.selTower = null; view.selStone = null; } });
$('btnSpeed').addEventListener('click', () => { speed = speed % 3 + 1; dirty = true; });
$('btnPause').addEventListener('click', () => { paused = !paused; dirty = true; });
$('btnBook').addEventListener('click', showBook);
$('btnHelp').addEventListener('click', () => showTutorial(0, null));
document.addEventListener('keydown', (e) => {
  if (!game || !$('modal').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); game.startWave(); }
  else if (e.key === 'Escape') { view.selTower = null; view.selStone = null; dirty = true; }
  else if (/^[1-9]$/.test(e.key) && game.phase === 'place') { const p = game.draw[+e.key - 1]; if (p) { view.selPiece = p.pid; dirty = true; updateGhost(); } }
});

// ---------- 루프 ----------
let last = performance.now();
let lastHud = '';
function frame(now) {
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
  last = now;
  if (game) {
    view.paused = paused && game.phase === 'wave';
    if (running && !paused && game.phase === 'wave' && $('modal').hidden) {
      const h = dt * speed, n = Math.max(1, Math.ceil(h / 0.034));
      for (let i = 0; i < n && game.phase === 'wave'; i++) game.update(h / n);
      const hk = `${Math.floor(game.gold)}|${game.lives}`;
      if (hk !== lastHud) { lastHud = hk; $('hGold').textContent = Math.floor(game.gold); $('hLives').textContent = game.lives; }
    } else game.tickFx(dt);
    if (dirty) { dirty = false; renderAll(); updateGhost(); }
    view.selTower = view.selTower ? game.getTower(view.selTower.id) : null;
    renderer.draw(game, view, now);
  }
  requestAnimationFrame(frame);
}

// 배경에 보여 줄 맵을 먼저 만든 뒤 타이틀
game = new Game({ meta: { levels: { ...meta.levels } } });
game.on('change', () => { dirty = true; });
renderAll();
showTitle();
requestAnimationFrame(frame);

// 테스트용: 브라우저 콘솔에서 현재 게임 상태를 볼 수 있게 한다
window.gilmak = { get game() { return game; }, start: () => startGame() };
