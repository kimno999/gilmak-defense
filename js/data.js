// Dragon Merge & Maze 게임 데이터. 수치의 기준은 RULES.md 이다.

export const COLS = 22;
export const ROWS = 15;
export const N = COLS * ROWS;
export const TILE = 16;
export const ROUNDS_PER_STAGE = 30;
export const CHECKPOINTS = 4;
export const START_LIVES = 20;
export const START_GOLD = 10;
export const STONE_REMOVE_COST = 40;

// 지형
export const T = { GRASS: 0, ROCK: 1, WATER: 2, MUD: 3, HILL: 4 };
export const HILL_RANGE = 0.9;

// 드래곤 등급 (규칙 4, 7)
export const GRADES = [
  { key: 'C', name: '알', en: 'Dragon Egg' },
  { key: 'F', name: '해츨링', en: 'Hatchling' },
  { key: 'N', name: '어린 비룡', en: 'Whelp' },
  { key: 'FL', name: '성체 드래곤', en: 'Drake' },
  { key: 'P', name: '고위 드래곤', en: 'Dragon' },
];
export const MAX_GRADE = GRADES.length - 1;
export const GRADE_DMG = [1, 2.6, 6.5, 16, 40];
export const GRADE_RANGE = [0, 0.2, 0.4, 0.6, 0.8];
export const GRADE_RATE = [1, 0.95, 0.9, 0.85, 0.8];

// 공격 속성과 종족 상성 (규칙 10)
export const ELEMENTS = {
  fire: { name: '화염', color: '#ff8a3d' },
  ice: { name: '냉기', color: '#8fd8ff' },
  poison: { name: '독', color: '#7be04a' },
  dark: { name: '암흑', color: '#b07cff' },
  light: { name: '빛', color: '#ffe066' },
  phys: { name: '물리', color: '#e8e8e8' },
};
export const RACES = {
  human: { name: '인간' },
  demon: { name: '악마' },
  fairy: { name: '요정' },
};
export const RACE_ORDER = ['human', 'demon', 'fairy'];
export const MATCHUP = {
  fire: { human: 1, demon: 0.75, fairy: 1.25 },
  ice: { human: 0.75, demon: 1.25, fairy: 1 },
  poison: { human: 1.25, demon: 1, fairy: 0.75 },
  dark: { human: 1.25, demon: 0.75, fairy: 1 },
  light: { human: 0.75, demon: 1.25, fairy: 1 },
  phys: { human: 1, demon: 1, fairy: 1 },
};

// 기본 드래곤 8종 (규칙 7). pal: 도트 색 (b 몸, d 그림자, l 배, w 날개, x 날개 그림자, h 뿔·발톱)
export const DRAGON_KEYS = ['red', 'blue', 'green', 'gold', 'silver', 'shadow', 'black', 'pixie'];
export const DRAGONS = {
  red: {
    name: '레드 드래곤', short: '레드', elem: 'fire', target: 'both',
    dmg: 12, rate: 1.2, range: 3.0, splash: 1.0,
    desc: '화염 범위 공격',
    pal: { b: '#d8402f', d: '#8f2219', l: '#ffb15c', w: '#f27a3a', x: '#b3401f', h: '#ffe2a8' },
  },
  blue: {
    name: '블루 드래곤', short: '블루', elem: 'ice', target: 'both',
    dmg: 6, rate: 1.0, range: 3.0, splash: 1.0, slow: 0.3, slowT: 1.5,
    desc: '범위 슬로우',
    pal: { b: '#3a7bd5', d: '#1f4a8a', l: '#a8e0ff', w: '#5fb0f0', x: '#2a6aa8', h: '#e6f6ff' },
  },
  green: {
    name: '그린 드래곤', short: '그린', elem: 'poison', target: 'both',
    dmg: 8, rate: 0.9, range: 3.2, poison: 6, poisonT: 3,
    desc: '단일 독 데미지',
    pal: { b: '#3fa34d', d: '#21622b', l: '#c6f08a', w: '#7bcf5a', x: '#3a8a3a', h: '#f0f8c8' },
  },
  gold: {
    name: '골드 드래곤', short: '골드', elem: 'light', target: 'both',
    dmg: 9, rate: 1.0, range: 3.2, multi: 3,
    desc: '한 번에 3마리 공격 (스플릿)',
    pal: { b: '#e0a92a', d: '#9a6a12', l: '#fff0a0', w: '#f5cc4a', x: '#b88a1c', h: '#fffbe0' },
  },
  silver: {
    name: '실버 드래곤', short: '실버', elem: 'phys', target: 'ground',
    dmg: 30, rate: 1.6, range: 3.6, crit: 0.25, critX: 2.5,
    desc: '단일 강력한 공격 (크리티컬), 지상만',
    pal: { b: '#b8c4d0', d: '#6d7a88', l: '#f2f6fa', w: '#d8e2ec', x: '#8a98a8', h: '#ffffff' },
  },
  shadow: {
    name: '쉐도우 드래곤', short: '쉐도우', elem: 'dark', target: 'air',
    dmg: 22, rate: 1.2, range: 3.8, splash: 1.2,
    desc: '공중 범위 공격, 공중만',
    pal: { b: '#5b3a8a', d: '#2e1a4a', l: '#a87ad8', w: '#7a4ab0', x: '#3f2466', h: '#d8c0ff' },
  },
  black: {
    name: '블랙 드래곤', short: '블랙', elem: 'phys', target: 'both',
    dmg: 5, rate: 0.25, range: 2.0,
    desc: '짧은 사거리, 엄청난 공격속도',
    pal: { b: '#3a3640', d: '#1c1a20', l: '#6e6878', w: '#524c5a', x: '#2a262e', h: '#ff5a5a' },
  },
  pixie: {
    name: '픽시 드래곤', short: '픽시', elem: 'light', target: 'both',
    dmg: 3, rate: 1.0, range: 2.8, pixie: true,
    desc: '주변 드래곤 공격속도 버프 (중첩 안 됨)',
    pal: { b: '#f08ad0', d: '#b04a90', l: '#ffd8f2', w: '#9ff0ff', x: '#5ac8e0', h: '#fffbe0' },
  },
};
// 픽시 버프: 등급별 공속 증가와 범위 (규칙 7)
export const PIXIE_BUFF = [0.10, 0.15, 0.20, 0.27, 0.35];
export const PIXIE_RADIUS = [2.0, 2.4, 2.8, 3.2, 3.6];

// 조합 드래곤 13종 (규칙 3). recipe: [등급 인덱스, 드래곤]. tier: 0 초급, 1 중급, 2 상급
export const UPGRADE_COST = [[60, 150], [150], [300]];
export const COMBOS = [
  {
    id: 'pixieSwarm', name: '픽시 스웜', tier: 0, elem: 'poison', target: 'both',
    recipe: [[0, 'green'], [0, 'black'], [0, 'pixie']],
    dmg: 30, rate: 0.8, range: 3.2, multi: 3, poison: 25, poisonT: 3,
    desc: '여러 갈래 독침 (멀티샷 + 독)', ups: ['픽시 리전'],
  },
  {
    id: 'frozen', name: '프로즌 드래곤', tier: 0, elem: 'ice', target: 'both',
    recipe: [[0, 'blue'], [0, 'gold'], [0, 'silver']],
    dmg: 45, rate: 1.2, range: 3.2, splash: 1.3, slow: 0.4, slowT: 2,
    desc: '빙결 충격파 (스플래시 슬로우)', ups: ['글레이셔 크러셔'],
  },
  {
    id: 'sealedRed', name: '봉인된 레드 해츨링', tier: 0, elem: 'fire', target: 'both',
    recipe: [[0, 'red'], [1, 'red'], [1, 'shadow']],
    dmg: 0, rate: 1.2, range: 0, auraDmg: 40, auraR: 1.6,
    desc: '직접 공격 없이 주변에 화염 오라', ups: ['봉인이 풀린 레드 드래곤', '각성한 레드 드래곤'],
  },
  {
    id: 'acid', name: '애시드 드래곤', tier: 1, elem: 'poison', target: 'both',
    recipe: [[2, 'green'], [2, 'pixie'], [1, 'blue']],
    dmg: 90, rate: 1.0, range: 3.4, pool: { r: 1.0, t: 3, poison: 60, slow: 0.3, shred: 3 },
    desc: '방어구를 녹이는 산성 늪 (독 + 슬로우 + 방어력 감소)', ups: ['베놈 엠퍼러'],
  },
  {
    id: 'shadowWyvern', name: '쉐도우 와이번', tier: 1, elem: 'fire', target: 'air',
    recipe: [[3, 'green'], [2, 'red'], [1, 'shadow']],
    dmg: 260, rate: 0.9, range: 4.2, multi: 3,
    desc: '하늘의 적만 쫓아 불태우는 다중 공격', ups: ['와이번 군주'],
  },
  {
    id: 'basilisk', name: '바실리스크 드래곤', tier: 2, elem: 'poison', target: 'both',
    recipe: [[4, 'green'], [3, 'blue'], [1, 'gold']],
    dmg: 1400, rate: 2.0, range: 4.0, stun: 0.6, stunChance: 1, poison: 150, poisonT: 3,
    desc: '강력한 단일 피해 + 기절', ups: ['고르곤 고룡'],
  },
  {
    id: 'cursedSilver', name: '저주받은 은룡', tier: 2, elem: 'dark', target: 'ground',
    recipe: [[4, 'shadow'], [3, 'shadow'], [1, 'silver']],
    dmg: 900, rate: 1.4, range: 4.0, crit: 0.35, critX: 3, shred: 4,
    desc: '방어력 감소 + 치명타 특화, 지상만', ups: ['폴른 플래티넘'],
  },
  {
    id: 'plagueLord', name: '역병의 군주', tier: 2, elem: 'poison', target: 'both',
    recipe: [[4, 'gold'], [3, 'blue'], [2, 'pixie']],
    dmg: 200, rate: 1.0, range: 3.4, auraR: 3.0, auraSlow: 0.5, auraPoison: 220,
    desc: '주변 적을 기어가게 하는 슬로우 오라 + 독기 오라', ups: ['아포칼립스 드래곤'],
  },
  {
    id: 'royalSlayer', name: '로열 슬레이어', tier: 2, elem: 'light', target: 'ground',
    recipe: [[4, 'silver'], [3, 'gold'], [2, 'silver']],
    dmg: 2600, rate: 1.8, range: 4.6, crit: 0.4, critX: 3,
    desc: '지상 적에게 압도적인 단일 크리티컬, 보스 킬러', ups: ['임페리얼 브레이커'],
  },
  {
    id: 'eclipseQueen', name: '이클립스 퀸', tier: 2, elem: 'light', target: 'both',
    recipe: [[4, 'pixie'], [3, 'silver'], [2, 'black']],
    dmg: 150, rate: 1.0, range: 3.4, buffR: 3.4, buffSpd: 0.3, buffDmg: 0.2, auraShred: 2,
    desc: '아군 공속·공격력 극대화 + 적 방어력 감소 (다른 버프와 중첩)', ups: ['셀레스티얼 드래곤'],
  },
  {
    id: 'hellfire', name: '헬파이어 드래곤', tier: 2, elem: 'fire', target: 'both',
    recipe: [[4, 'red'], [3, 'black'], [2, 'shadow']],
    dmg: 420, rate: 0.35, range: 3.4, splash: 1.0, crit: 0.2, critX: 2.5,
    desc: '화염구 난사, 광역 폭발 치명타', ups: ['아마겟돈 드래곤'],
  },
  {
    id: 'blizzard', name: '블리자드 웜', tier: 2, elem: 'ice', target: 'both',
    recipe: [[4, 'blue'], [3, 'gold'], [3, 'red']],
    dmg: 700, rate: 1.3, range: 4.0, splash: 2.2, slow: 0.55, slowT: 2.5,
    desc: '맵 일대를 얼리는 광역 빙결', ups: ['앱솔루트 제로'],
  },
  {
    id: 'tempest', name: '템페스트 드래곤', tier: 2, elem: 'dark', target: 'both',
    recipe: [[4, 'black'], [3, 'pixie'], [1, 'green']],
    dmg: 380, rate: 0.18, range: 2.0, stun: 0.5, stunChance: 0.08, shred: 3,
    desc: '근접 초고속 난타 + 기절 + 방어력 감소', ups: ['라이트닝 퓨리'],
  },
];
export const COMBO_BY_ID = Object.fromEntries(COMBOS.map((c) => [c.id, c]));

// 몬스터 (규칙 6, 10)
export const MONSTER_KINDS = {
  normal: { hp: 1, speed: 1.0, armor: (r) => r / 6, life: 1 },
  fast: { hp: 0.6, speed: 1.7, armor: () => 0, life: 1 },
  armored: { hp: 1.8, speed: 0.7, armor: (r) => 3 + r / 3, life: 1 },
  flying: { hp: 0.8, speed: 1.1, armor: (r) => 1 + r / 6, life: 1, fly: true },
  boss: { hp: 16, speed: 0.55, armor: (r) => 5 + r / 3, life: 5, boss: true, ground: true },
};
export const MONSTER_NAMES = {
  human: { normal: '병사', fast: '척후병', armored: '중갑기사', flying: '그리폰 기수', boss: '인간 대장군' },
  demon: { normal: '임프', fast: '헬하운드', armored: '지옥 거인', flying: '가고일', boss: '마왕' },
  fairy: { normal: '요정 전사', fast: '바람 정령', armored: '나무 골렘', flying: '나비 요정', boss: '요정 여왕' },
};

export function raceFor(round) {
  return RACE_ORDER[(round - 1) % RACE_ORDER.length];
}

// 웨이브 구성 (규칙 6, 다음 제작 목록 6·10번)
// 5라운드마다 공중, 10라운드마다 보스 + 공중. 일반 라운드에는 공중이 섞이지 않는다. 보스는 항상 지상.
export function waveFor(stage, round) {
  const race = raceFor(round);
  const n = 6 + Math.floor(round * 0.75);
  const list = [];
  if (round % 10 === 0) {
    for (let i = 0; i < Math.ceil(n * 0.5); i++) list.push('flying');
    list.push('boss');
  } else if (round % 5 === 0) {
    for (let i = 0; i < Math.ceil(n * 0.7); i++) list.push('flying');
  } else {
    for (let i = 0; i < n; i++) {
      let k = 'normal';
      if (round >= 3 && i % 4 === 3) k = 'fast';
      if (round >= 6 && i % 6 === 5) k = 'armored';
      list.push(k);
    }
  }
  return { race, list };
}
export const HP_BASE = 20;
export const HP_GROWTH = 1.25;
export const STAGE_HP = 1.3;
export function hpFor(stage, round) {
  return HP_BASE * Math.pow(HP_GROWTH, round - 1) * Math.pow(STAGE_HP, stage - 1);
}
export function goldPerKill(round) {
  return 1 + Math.floor(round / 6);
}
export function roundBonus(round) {
  return 5 + Math.floor(round / 3) + (round % 10 === 0 ? 30 + round * 2 : 0);
}

// 승급 확률표 (규칙 8): [비용, 알, 해츨링, 어린 비룡, 성체, 고위]
export const LUCK_TABLE = [
  [0, 80, 20, 0, 0, 0],
  [20, 60, 30, 10, 0, 0],
  [35, 50, 32, 15, 3, 0],
  [55, 40, 33, 20, 7, 0],
  [85, 32, 32, 25, 10, 1],
  [120, 25, 30, 30, 13, 2],
  [165, 20, 27, 33, 16, 4],
  [215, 15, 24, 37, 18, 6],
  [275, 10, 20, 40, 20, 10],
];
export const MAX_LUCK = LUCK_TABLE.length - 1;

export function rollGrade(luck, u) {
  const row = LUCK_TABLE[luck];
  let acc = 0;
  for (let g = 0; g <= MAX_GRADE; g++) {
    acc += row[g + 1];
    if (u * 100 < acc) return g;
  }
  return 0;
}

// 영구 능력치 (규칙 9)
export const META_ITEMS = [];
for (const k of DRAGON_KEYS) {
  META_ITEMS.push({ id: `atk_${k}`, dragon: k, label: `${DRAGONS[k].short} 공격력`, per: 0.01, max: 20, base: 5, step: 3, fmt: (v) => `+${(v * 100).toFixed(0)}%` });
  META_ITEMS.push({ id: `spd_${k}`, dragon: k, label: `${DRAGONS[k].short} 공격속도`, per: 0.005, max: 20, base: 5, step: 3, fmt: (v) => `+${(v * 100).toFixed(1)}%` });
}
META_ITEMS.push({ id: 'life', label: '시작 생명', per: 1, max: 10, base: 10, step: 5, fmt: (v) => `+${v}` });
META_ITEMS.push({ id: 'interest', label: '골드 이자', per: 0.005, max: 10, base: 15, step: 8, fmt: (v) => `${(v * 100).toFixed(1)}%` });
export const META_BY_ID = Object.fromEntries(META_ITEMS.map((m) => [m.id, m]));
export function metaCost(item, nextLevel) {
  return item.base + item.step * (nextLevel - 1);
}
export function metaValue(meta, id) {
  const it = META_BY_ID[id];
  return ((meta && meta.levels && meta.levels[id]) || 0) * it.per;
}
export const COMBO_INHERIT = 0.25;

export function mileageFor(stats) {
  // 클리어 라운드 1, 보스 처치 5, 스테이지 클리어 30 × 스테이지 번호
  let m = stats.roundsCleared + stats.bossKills * 5;
  for (let s = 1; s <= stats.stagesCleared; s++) m += 30 * s;
  return m;
}
