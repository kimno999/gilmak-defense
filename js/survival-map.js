// 서바이벌 기준 맵 (기획자가 맵 만들기 화면에서 확정한 코드). 바꾸려면 새 코드로 교체한다.
// 맵 1: 십자경로맵 (26×21, 깃발 4개). 2026-11-12에 22×15에서 바꿈
export const SURVIVAL_MAP_CODE = 'DMM1:eyJ2IjoxLCJ0eXBlIjoiY3Jvc3MiLCJjb2xzIjoyNiwicm93cyI6MjEsInNwYXduIjp7IngiOjAsInkiOjB9LCJnb2FsIjp7IngiOjI1LCJ5IjoyMH0sImZsYWdzIjpbeyJ4IjoyLCJ5IjoxMH0seyJ4IjoyMiwieSI6MTB9LHsieCI6MTIsInkiOjJ9LHsieCI6MTIsInkiOjE4fV0sInRlcnJhaW4iOltdfQ==';
// 예전 십자경로맵 (22×15), 기록용
export const OLD_CROSS_MAP_CODE_22x15 = 'DMM1:eyJ2IjoxLCJjb2xzIjoyMiwicm93cyI6MTUsInNwYXduIjp7IngiOjAsInkiOjB9LCJnb2FsIjp7IngiOjIxLCJ5IjoxMn0sImZsYWdzIjpbeyJ4IjozLCJ5Ijo3fSx7IngiOjE3LCJ5Ijo3fSx7IngiOjEwLCJ5IjoxfSx7IngiOjEwLCJ5IjoxM31dLCJ0ZXJyYWluIjpbXX0=';
// 맵 2: 다이렉트맵 (18×12, 깃발 없음, 출발 (0,6) → 도착 (17,5))
export const DIRECT_MAP_CODE = 'DMM1:eyJ2IjoxLCJ0eXBlIjoiZGlyZWN0IiwiY29scyI6MTgsInJvd3MiOjEyLCJzcGF3biI6eyJ4IjowLCJ5Ijo2fSwiZ29hbCI6eyJ4IjoxNywieSI6NX0sImZsYWdzIjpbXSwidGVycmFpbiI6W119';

export const SURVIVAL_MAPS = [
  { key: 'cross', rankKey: 'cross2', name: '십자경로맵', desc: '지정된 십자 경로로 이동합니다', code: SURVIVAL_MAP_CODE },
  { key: 'direct', rankKey: 'direct', name: '다이렉트맵', desc: '출발과 도착만 있는 순수 미로 맵', code: DIRECT_MAP_CODE },
];

export function decodeMapCode(code) {
  const m = String(code).trim().match(/^DMM1:([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error('맵 코드 형식이 달라요');
  const json = typeof atob === 'function' ? decodeURIComponent(escape(atob(m[1]))) : Buffer.from(m[1], 'base64').toString('utf8');
  return JSON.parse(json);
}
