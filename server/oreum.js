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
