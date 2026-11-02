// 실제 도로 기준 거리·시간·경로 (OSRM 공개 서버 — 키 불필요). 공개 데모 서버라 실패할 수 있으니 호출하는 쪽에서 대체 방법을 준비한다.
const OSRM = 'https://router.project-osrm.org';

// 제주 안의 좌표만 받는다 (남용 방지)
const inJeju = ([lng, lat]) => lat > 33.0 && lat < 33.7 && lng > 126.0 && lng < 127.2;

// "lng,lat;lng,lat;…" → [[lng, lat], …] (2~8곳)
export function parsePoints(text) {
  const pts = String(text ?? '').split(';').map((p) => p.split(',').map(Number));
  if (pts.length < 2 || pts.length > 8 || pts.some((p) => p.length !== 2 || p.some((n) => !Number.isFinite(n)) || !inJeju(p))) {
    throw Object.assign(new Error('pts 는 제주 안의 "경도,위도;경도,위도" 형식이어야 해요 (2~8곳)'), { status: 400 });
  }
  return pts;
}

async function osrm(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(OSRM + path, { signal: ctrl.signal, headers: { 'User-Agent': 'jeju-yeongdeung-student-project' } });
    const j = await r.json();
    if (j.code !== 'Ok') throw new Error('길찾기 서버 응답: ' + j.code);
    return j;
  } finally { clearTimeout(timer); }
}

const coords = (pts) => pts.map(([lng, lat]) => `${lng},${lat}`).join(';');

// 모든 쌍의 소요 시간(초)·거리(m) 행렬 — 한 번의 호출로 순서를 비교할 때 쓴다
export async function getMatrix(pts) {
  const j = await osrm(`/table/v1/driving/${coords(pts)}?annotations=duration,distance`);
  return { durations: j.durations, distances: j.distances };
}

// 정해진 순서로 이어 달리는 경로: 구간별 시간·거리와 지도에 그릴 선([위도, 경도] 배열)
export async function getRoute(pts) {
  const j = await osrm(`/route/v1/driving/${coords(pts)}?overview=full&geometries=geojson`);
  const r = j.routes[0];
  const line = [];
  let last = null;
  r.geometry.coordinates.forEach(([lng, lat], i, all) => { // 25m 이내의 점은 건너뛰어 크기를 줄인다 (마지막 점은 항상 남김)
    if (!last || i === all.length - 1 || Math.hypot((lat - last[0]) * 111, (lng - last[1]) * 92.9) > 0.025) {
      last = [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5];
      line.push(last);
    }
  });
  return { distance: r.distance, duration: r.duration, legs: r.legs.map((l) => ({ distance: l.distance, duration: l.duration })), line };
}
