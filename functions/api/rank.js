// 서바이벌 순위표 서버 (Cloudflare Pages Functions + KV). 맵마다 따로 기록한다.
// KV 바인딩 이름: RANK  (클라우드플레어 대시보드 → Pages 프로젝트 → 설정 → 바인딩)
// GET  /api/rank?map=cross            → { ok, list }
// POST /api/rank { map, name, round, damage, cleared } → { ok, list, rank }
const MAPS = ['cross', 'direct'];
const MAX_ROUND = 80;
const KEEP = 100;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// 끝까지 간 기록(데미지 순) → 도달 라운드 순 → 먼저 세운 기록 순
function better(a, b) {
  if (a.cleared !== b.cleared) return a.cleared ? -1 : 1;
  if (a.cleared && a.damage !== b.damage) return b.damage - a.damage;
  if (a.round !== b.round) return b.round - a.round;
  return a.at - b.at;
}

function cleanName(v) {
  return String(v || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 12);
}

async function load(env, map) {
  const raw = await env.RANK.get(`rank:${map}`);
  try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

export async function onRequest({ request, env }) {
  if (!env.RANK) return json({ ok: false, reason: 'no-store' }, 503);
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const map = url.searchParams.get('map');
    if (!MAPS.includes(map)) return json({ ok: false, reason: 'bad-map' }, 400);
    return json({ ok: true, list: (await load(env, map)).slice(0, 50) });
  }
  if (request.method !== 'POST') return json({ ok: false, reason: 'method' }, 405);
  let b;
  try { b = await request.json(); } catch (e) { return json({ ok: false, reason: 'bad-json' }, 400); }
  const map = b.map;
  const name = cleanName(b.name);
  const round = Math.floor(Number(b.round));
  const cleared = b.cleared === true && round === MAX_ROUND;
  const damage = cleared ? Math.floor(Number(b.damage)) : 0;
  if (!MAPS.includes(map) || !name || !(round >= 1 && round <= MAX_ROUND) || !(damage >= 0 && damage < 1e13)) {
    return json({ ok: false, reason: 'bad-entry' }, 400);
  }
  const entry = { name, round, cleared, damage, at: Date.now() };
  let list = await load(env, map);
  const old = list.find((e) => e.name === name);
  if (old && better(old, entry) <= 0) {
    return json({ ok: true, kept: true, list: list.slice(0, 50), rank: list.indexOf(old) + 1 });
  }
  list = list.filter((e) => e.name !== name);
  list.push(entry);
  list.sort(better);
  list = list.slice(0, KEEP);
  await env.RANK.put(`rank:${map}`, JSON.stringify(list));
  const rank = list.indexOf(entry) + 1;
  return json({ ok: true, list: list.slice(0, 50), rank: rank || null });
}
