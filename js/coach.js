// 튜토리얼 모드: 정해진 4라운드를 직접 해 보며 규칙을 익힌다.
// 단계마다 안내 문구를 보여 주고, 그 단계에서 배울 행동만 허락한다.

// 연습 맵: 16 × 10칸, 깃발 2개
export const TUTORIAL = {
  def: { v: 1, type: 'cross', cols: 16, rows: 10, spawn: { x: 0, y: 5 }, goal: { x: 15, y: 5 }, flags: [{ x: 5, y: 1 }, { x: 10, y: 8 }], terrain: [] },
  gold: 30,
  // 라운드별로 나오는 5마리 [종류, 등급]
  draws: [
    [['red', 0], ['red', 0], ['blue', 0], ['gold', 0], ['shadow', 0]], // 2마리 합성
    [['red', 1], ['blue', 0], ['gold', 0], ['green', 0], ['shadow', 0]], // 필드 수, 남기기, 돌 깨기
    [['red', 1], ['blue', 0], ['green', 0], ['shadow', 0], ['gold', 0]], // 3마리 합성, 승급
    [['green', 0], ['black', 0], ['pixie', 0], ['blue', 0], ['gold', 0]], // 럭키 원힛
  ],
};

const cnt = (g, type, grade) => g.fieldCount(type, grade);
const isRed1 = (t) => t && t.kind === 'dragon' && t.type === 'red' && t.grade === 1;
const placeDone = (g) => g.phase !== 'place';

export const STEPS = [
  {
    title: '환영해요!',
    text: [
      '몬스터는 출발(보라색 포털) → 깃발 1 → 깃발 2 → 도착(성문) 순서로 걸어가요. 노란 점선이 지금 몬스터가 갈 길이에요.',
      '드래곤을 놓아 그 길을 길게 꼬아 놓으면, 오래 걷는 동안 드래곤이 몬스터를 공격해요. 4라운드만 직접 해 볼게요.',
      '튜토리얼을 끝까지 하면, 이 연습 맵에서 잘 만든 미로를 하나 보여 드려요!',
    ],
    btn: '다음', only: [],
  },
  {
    title: '드래곤은 5단계예요',
    text: [
      '모든 드래곤은 알 → 해츨링 → 어린 비룡 → 성체 드래곤 → 고위 드래곤, 5단계가 있어요. 단계가 높을수록 훨씬 강해요.',
      '처음엔 알과 해츨링만 나오지만, 골드로 "승급"할수록 높은 단계가 나올 확률이 올라가요. 지금 확률은 지도 맨 아래 한 줄에서 늘 볼 수 있어요.',
    ],
    grades: true, btn: '시작하기', only: [],
  },
  {
    title: '드래곤 5마리 놓기',
    text: [
      '라운드마다 드래곤 5마리가 나와요. 오른쪽 목록에서 하나를 고르고 지도 빈칸을 누르면 놓여요.',
      '점선(길) 위에 놓으면 몬스터가 돌아가야 해서 경로가 길어져요. 잘못 놓았으면 그 드래곤을 누르고 다른 빈칸을 누르면 옮겨져요.',
    ],
    done: placeDone, only: [],
  },
  {
    title: '1마리만 남기기 · 2마리 합성',
    text: [
      '5마리 중 1마리만 남길 수 있고, 남기지 않은 4마리는 돌이 돼요.',
      '그런데 같은 드래곤(레드 알)이 2마리 있죠? 같은 종류·같은 등급 2마리는 합쳐서 한 단계 높게 남길 수 있어요. 반짝이는 레드 알을 누르고 "2마리 합성해서 남기기"를 눌러 보세요.',
    ],
    done: (g) => cnt(g, 'red', 1) >= 1,
    only: ['merge2'], deny: '이번엔 레드 알 2마리를 합성해서 남겨 보세요',
    check: (a, t) => (t && t.type !== 'red' ? '이번엔 레드 알을 합성해 보세요' : true),
    hl: (g) => g.pendings().filter((t) => t.type === 'red'),
  },
  {
    title: '돌은 미로의 벽',
    text: [
      '남기지 않은 드래곤은 돌이 됐어요. 돌과 드래곤은 몬스터가 지나갈 수 없는 벽이에요.',
      '길을 완전히 막으면 몬스터가 돌을 부수고, 그래도 막히면 드래곤까지 부숴요. 부서진 드래곤은 영영 사라지니, 막지 말고 길게 꼬는 게 핵심이에요.',
    ],
    btn: '알겠어요', only: [],
  },
  {
    title: '웨이브 시작',
    text: [
      '준비됐으면 지도 아래 "웨이브 시작"을 누르세요.',
      '몬스터가 깃발 순서대로 걸어가고, 드래곤은 사거리 안의 몬스터를 공격해요. 몬스터를 잡고 웨이브를 막으면 골드를 받아요.',
    ],
    done: (g) => g.round >= 2, only: ['wave'],
  },
  {
    title: '필드에 몇 마리 있나',
    text: [
      '새 5마리가 나왔어요. 목록 아래 "필드 n"은 지도에 이미 남겨 둔 같은 종류·같은 등급 드래곤 수예요. 레드 해츨링에 "필드 1"이 보이죠?',
      '5마리를 모두 놓아 보세요.',
    ],
    done: placeDone, only: [],
  },
  {
    title: '남길 드래곤 고르기',
    text: [
      '이번엔 레드 해츨링을 누르고 "이 드래곤 남기기"를 눌러 보세요. 같은 드래곤을 3마리 모으면 합성할 수 있어요.',
      '하늘색 "추천" 말풍선은 남기면 조합이나 합성이 되는 드래곤을 알려 줘요.',
    ],
    done: (g) => cnt(g, 'red', 1) >= 2,
    only: ['keep'], deny: '이번엔 레드 해츨링을 "이 드래곤 남기기"로 남겨 보세요',
    check: (a, t) => (!isRed1(t) ? '이번엔 레드 해츨링을 남겨 보세요' : true),
    hl: (g) => g.pendings().filter(isRed1),
  },
  {
    title: '돌 깨기',
    text: [
      '자리가 모자라거나 길을 바꾸고 싶으면 돌을 깰 수 있어요. 배치·정비 시간에는 무료예요.',
      '돌 하나를 누르고 "돌 깨기"를 눌러 보세요.',
    ],
    enter: (g, c) => { c.stones0 = g.stats.stonesRemoved || 0; },
    done: (g, c) => (g.stats.stonesRemoved || 0) > c.stones0, only: ['stone'],
  },
  {
    title: '두 번째 웨이브',
    text: ['"웨이브 시작"을 눌러 막아 보세요. 속도 버튼으로 빠르게 볼 수도 있어요.'],
    done: (g) => g.round >= 3, only: ['wave'],
  },
  {
    title: '5마리 놓기',
    text: ['레드 해츨링이 또 나왔어요. 지금은 "필드 2"예요. 5마리를 모두 놓으세요.'],
    done: placeDone, only: [],
  },
  {
    title: '3마리 모으기',
    text: [
      '레드 해츨링을 남기면 필드에 3마리가 돼요. 레드 해츨링 위에 "추천 · 3마리 합성" 말풍선이 떴죠?',
      '레드 해츨링을 남겨 보세요.',
    ],
    done: (g) => cnt(g, 'red', 1) >= 3,
    only: ['keep'], deny: '이번엔 레드 해츨링을 "이 드래곤 남기기"로 남겨 보세요',
    check: (a, t) => (!isRed1(t) ? '이번엔 레드 해츨링을 남겨 보세요' : true),
    hl: (g) => g.pendings().filter(isRed1),
  },
  {
    title: '3마리 합성',
    text: [
      '이제 정비 시간이에요. 웨이브와 웨이브 사이인 이 시간에 같은 드래곤 3마리를 합성할 수 있어요.',
      '레드 해츨링 하나를 누르고 "3마리 합성"을 누르세요. 누른 자리가 한 단계 높아지고, 나머지 2마리는 돌이 돼요.',
    ],
    done: (g) => cnt(g, 'red', 2) >= 1, only: ['merge3'],
    hl: (g) => g.placed().filter(isRed1),
  },
  {
    title: '승급',
    text: [
      '드래곤 5단계 기억나죠? 골드로 "승급"을 하면 다음 라운드부터 높은 단계가 나올 확률이 올라가요. 승급은 8번까지 할 수 있어요.',
      '지도 맨 아래 한 줄 끝의 "승급" 버튼(또는 오른쪽 승급 패널)을 눌러 보세요. 확률 숫자가 바뀌는 걸 확인해 보세요.',
    ],
    done: (g) => g.luck >= 1, only: ['luck'],
  },
  {
    title: '세 번째 웨이브',
    text: ['"웨이브 시작"을 누르세요.'],
    done: (g) => g.round >= 4, only: ['wave'],
  },
  {
    title: '마지막 라운드',
    text: ['5마리를 모두 놓으세요.'],
    done: placeDone, only: [],
  },
  {
    title: '럭키 원힛!',
    text: [
      '이번 5마리에 그린 알·블랙 알·픽시 알이 모두 있어요. 셋을 합치면 "픽시 스웜"이라는 조합 드래곤이 돼요.',
      '조합 재료가 한 라운드 5마리 안에 다 모이면 "럭키 원힛"이에요! 셋 중 하나를 누르고 무지개색 "원힛" 버튼을 누르세요.',
    ],
    done: (g) => g.towers.some((t) => t.kind === 'combo'),
    only: ['onehit'], deny: '이번엔 그린·블랙·픽시 알 중 하나를 눌러 "원힛" 버튼을 눌러 보세요',
    hl: (g) => g.pendings().filter((t) => ['green', 'black', 'pixie'].includes(t.type)),
  },
  {
    title: '콤바인',
    text: [
      '조합 재료를 꼭 한 라운드에 모을 필요는 없어요. 라운드마다 하나씩 남겨 필드에 모아 두면, 정비 시간에 "콤바인"으로 합칠 수 있어요.',
      '어떤 조합이 있는지는 위의 "조합 도감"에서 보고, 드래곤을 누르면 그 드래곤이 쓰이는 조합이 나와요. 조합 드래곤은 골드로 업그레이드도 돼요.',
    ],
    btn: '알겠어요', only: [],
  },
  {
    title: '마지막 웨이브',
    text: ['"웨이브 시작"을 눌러 마무리하세요.'],
    done: (g) => g.phase === 'tutdone', only: ['wave'],
  },
  {
    title: '잘 만든 미로 구경하기',
    text: [
      '약속한 미로예요! 같은 연습 맵에서 돌과 드래곤 40칸으로 만든, 최적에 가까운 미로예요. 빈 맵이면 29칸이던 길이 211칸이 됐어요.',
      '벽을 일자로 쌓기보다 비스듬히 엇갈려 놓으면 몬스터가 지그재그로 오래 돌아가요. 드래곤은 길이 여러 번 지나가는 굽은 곳에 두면 같은 몬스터를 여러 번 때려요.',
    ],
    enter: (g) => g.showcase(SHOWCASE.stones, SHOWCASE.towers),
    btn: '튜토리얼 끝내기', only: [], last: true,
  },
];

// 연습 맵의 잘 만든 미로 (돌·드래곤 40칸, 경로 211칸. 빈 맵은 29칸). 탐색으로 찾은 배치
const MAZE = [4, 17, 20, 23, 26, 34, 37, 38, 40, 43, 51, 53, 57, 60, 64, 67, 71, 74, 77, 81, 84, 85, 86, 91, 94, 99, 103, 108, 111, 114, 120, 122, 125, 129, 134, 137, 139, 142, 149, 155];
const SHOW_TOWERS = [
  { i: 34, kind: 'combo', type: 'hellfire' }, { i: 125, kind: 'combo', type: 'blizzard' }, { i: 38, kind: 'combo', type: 'tempest' },
  { i: 74, kind: 'combo', type: 'eclipseQueen' }, { i: 84, kind: 'combo', type: 'basilisk' }, { i: 120, kind: 'combo', type: 'royalSlayer' },
  { i: 129, kind: 'combo', type: 'frozen' }, { i: 149, kind: 'combo', type: 'shadowWyvern' },
];
export const SHOWCASE = { stones: MAZE.filter((i) => !SHOW_TOWERS.some((t) => t.i === i)), towers: SHOW_TOWERS, length: 211, empty: 29 };

// 지금 단계에서 허락하는 행동인지 (true 또는 막는 이유)
export function stepGuard(step) {
  return (action, t) => {
    if (step.only && !step.only.includes(action)) return step.deny || (step.btn ? '먼저 안내를 읽고 위의 버튼을 눌러 주세요' : '지금은 안내에 따라 해 보세요');
    if (step.check) return step.check(action, t);
    return true;
  };
}
