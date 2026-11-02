// React 화면이 우리 서버 함수(/api/...)를 부를 때 쓰는 함수 모음
// 공공데이터 API를 브라우저에서 직접 부르지 않습니다 (키 노출 + CORS 문제) → 반드시 /api 를 거칩니다.

// 응답을 JSON으로 읽고, 실패하면 에러를 던집니다
async function readJson(r) {
  let data
  try { data = await r.json() }
  catch { throw new Error(`서버 응답이 JSON이 아님 (${r.status}) — vercel dev 로 실행했는지 확인`) }
  if (!r.ok) throw new Error(data.error || r.statusText)
  return data
}

export async function get(path) {
  return readJson(await fetch(path))
}

export async function post(path, body) {
  return readJson(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

// 동작 확인용
export const ping = () => get('/api/hello')

// STEP 2~4: 공공데이터 API
// 사진이 있는 곳만: { items, total, withImage }.  area: '' 전체 | 'jeju' | 'seogwipo'
export const fetchPlaces = (keyword = '', type = '12', area = '') =>
  get(`/api/tour?keyword=${encodeURIComponent(keyword)}&type=${type}&area=${area}`)
// 좌표 주변 관광지(12)·음식점(39) 등 — 가까운 순
export const fetchNearby = ({ lat, lng, type = '12', radius = 5000, rows = 6 }) =>
  get(`/api/nearby?lat=${lat}&lng=${lng}&type=${type}&radius=${radius}&rows=${rows}`)
// 실제 도로 기준 길찾기 (할망따라 코스): mode 'table' = 모든 쌍의 시간·거리 행렬, 'route' = 정해진 순서의 경로(지도 선 포함)
export const fetchRoute = (points, mode = 'table') =>
  get(`/api/route?mode=${mode}&pts=${encodeURIComponent(points.map((p) => `${p.lng},${p.lat}`).join(';'))}`)
// 제주 오름 90곳 (이름·표고·좌표·설명) — 공공데이터포털 제주오름요약설명
export const fetchOreums = () => get('/api/oreum')
// 장소 하나의 상세(설명·사진·이용 정보) — 카드를 눌렀을 때만 부른다
export const fetchPlaceDetail = ({ id, type = '12' }) => get(`/api/place?id=${id}&type=${type}`)
// 이름·주소·사진만 (즐겨찾기 목록에서 사진을 다시 불러올 때)
export const fetchPlaceBrief = (id) => get(`/api/place?id=${id}&brief=1`)
export const fetchWeather = (place = '제주시', hours = 6) =>
  get(`/api/weather?place=${encodeURIComponent(place)}&hours=${hours}`)
export const fetchHeritage = (keyword = '') =>
  get(`/api/heritage?keyword=${encodeURIComponent(keyword)}`)
// 국가유산 상세(공식 설명문·사진 여러 장) — 목록 항목의 kdcd/ctcd/asno 로 조회
export const fetchHeritageDetail = ({ kdcd, ctcd, asno }) =>
  get(`/api/heritage?kdcd=${kdcd}&ctcd=${ctcd}&asno=${asno}`)

// STEP 6: 에이전트
export const askAgent = (message, history) => post('/api/agent', { message, history })
