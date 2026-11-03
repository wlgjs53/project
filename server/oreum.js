// 제주특별자치도 제주오름요약설명 (공공데이터포털 파일데이터 → 오픈API 자동변환, odcloud)
// 오름 90곳의 이름·위치·표고·좌표·설명. 자주 바뀌지 않는 자료라 서버 메모리에도 한 번 담아 둔다.
const URL_ = 'https://api.odcloud.kr/api/15096996/v1/uddi:6738a90c-ec96-4245-a187-9528cea62904';
let memo = null; // { at, items }

export async function getOreums() {
  if (memo && Date.now() - memo.at < 24 * 3600e3) return memo.items;
  const q = new URLSearchParams({ page: '1', perPage: '200', serviceKey: process.env.DATA_GO_KR_KEY ?? '' });
  const r = await fetch(`${URL_}?${q}`, { signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error(`오름 API 응답 오류 (${r.status})`);
  const j = await r.json();
  const items = (j.data ?? [])
    .map((d) => ({
      id: `o:${d['오름영문명'] || d['오름명']}`, title: d['오름명'], en: d['오름영문명'], addr: d['위치'],
      height: Number(d['표고(m)']) || null,   // 해발 표고(m)
      rise: Number(d['비고(m)']) || null,     // 오름 자체의 높이(비고, m)
      desc: d['설명'], lat: Number(d['위도']), lng: Number(d['경도']),
    }))
    .filter((o) => o.title && Number.isFinite(o.lat) && Number.isFinite(o.lng) && o.lat > 33 && o.lat < 34);
  if (!items.length) throw new Error('오름 데이터를 받지 못했어요');
  memo = { at: Date.now(), items };
  return items;
}

// ── 에이전트 도구용: 오늘의 바람으로 오름 견주기 ─────────────────────────────
// 화면(src/pages/Oreum.jsx, src/lib/advice.js)과 같은 단순 계산이다. 고치면 양쪽을 같이 고칠 것.
const toXZ = (lat, lng) => ({ x: (lng - 126.55) * 92.9, z: -(lat - 33.38) * 110.95 }); // 위경도 → 장면 좌표(km)
const HAL = toXZ(33.3617, 126.5292);                                                     // 한라산 백록담 부근

export async function rankOreums({ windSpeed = 4, windDir = 0, keyword = '', area = '', limit = 8 } = {}) {
  const r = (Number(windDir) * Math.PI) / 180;
  const fx = Math.sin(r), fz = -Math.cos(r);
  const rows = (await getOreums())
    .filter((o) => (!keyword || o.title.includes(keyword) || o.addr.includes(keyword)) && (!area || o.addr.startsWith(area)))
    .map((o) => {
      const { x, z } = toXZ(o.lat, o.lng);
      const dx = x - HAL.x, dz = z - HAL.z;
      const e = (dx * fx + dz * fz) / (Math.hypot(dx, dz) + 0.001); // +1 에 가까울수록 한라산 기준 바람이 불어오는 쪽
      const feel = Number(windSpeed) * (1 + Math.min(o.height ?? 0, 500) / 700) * (e > 0.35 ? 1.2 : e < -0.35 ? 0.8 : 1);
      return {
        id: o.id, name: o.title, addr: o.addr, height_m: o.height, summit_wind_ms: Math.round(feel * 10) / 10,
        side: e > 0.35 ? '바람 맞는 쪽' : e < -0.35 ? '바람 비낀 쪽' : '바람이 비스듬히 지나는 쪽',
        verdict: feel < 5 ? '오르기 좋아요' : feel < 9 ? '바람 적당' : '바람 조심',
        lat: o.lat, lng: o.lng, desc: o.desc,
      };
    })
    .sort((a, b) => a.summit_wind_ms - b.summit_wind_ms);
  return rows.slice(0, Math.min(15, Math.max(1, Number(limit) || 8)));
}
