// 서바이벌 순위표: 서버(클라우드플레어)와 이 브라우저에 남기는 내 최고 기록
const NICK_KEY = 'dmm-nick-v1';
const BEST_KEY = 'dmm-survival-best-v1';
const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 */ } };

export function better(a, b) {
  if (a.cleared !== b.cleared) return a.cleared ? -1 : 1;
  if (a.cleared && a.damage !== b.damage) return b.damage - a.damage;
  if (a.round !== b.round) return b.round - a.round;
  return (a.at || 0) - (b.at || 0);
}

export const nick = { get: () => get(NICK_KEY, ''), set: (v) => set(NICK_KEY, v) };

export function myBest(map) { return (get(BEST_KEY, {}) || {})[map] || null; }
export function saveBest(map, rec) {
  const all = get(BEST_KEY, {}) || {};
  const cur = all[map];
  const isNew = !cur || better(rec, cur) < 0;
  if (isNew) { all[map] = { ...rec, at: Date.now() }; set(BEST_KEY, all); }
  return isNew;
}

export function recordText(r) {
  if (!r) return '기록 없음';
  return r.cleared ? `80라운드 완주 · 데미지 ${r.damage.toLocaleString('ko-KR')}` : `${r.round}라운드 도달`;
}

export async function fetchRank(map) {
  try {
    const res = await fetch(`/api/rank?map=${encodeURIComponent(map)}`, { cache: 'no-store' });
    const j = await res.json();
    return j.ok ? { ok: true, list: j.list } : { ok: false };
  } catch (e) { return { ok: false }; }
}

export async function submitRank(map, name, rec) {
  try {
    const res = await fetch('/api/rank', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ map, name, round: rec.round, damage: rec.damage, cleared: rec.cleared }),
    });
    const j = await res.json();
    return j.ok ? { ok: true, list: j.list, rank: j.rank, kept: !!j.kept } : { ok: false };
  } catch (e) { return { ok: false }; }
}
