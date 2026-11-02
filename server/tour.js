// 한국관광공사 TourAPI (국문 관광정보 서비스 KorService2)
const BASE = 'https://apis.data.go.kr/B551011/KorService2';

// TourAPI 호출 공통: 오퍼레이션 이름과 추가 파라미터를 받아 항목 배열을 돌려준다
async function callTour(op, extra) {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, // ★ Decoding 키
    MobileOS: 'ETC',
    MobileApp: 'JejuIP',
    _type: 'json',
    pageNo: '1',
    ...extra,
  });
  const r = await fetch(`${BASE}/${op}?${params}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('TourAPI 응답이 JSON이 아님: ' + text.slice(0, 120)); }

  const item = data?.response?.body?.items?.item;
  return !item ? [] : Array.isArray(item) ? item : [item];
}

const toPlace = (p) => ({
  id: p.contentid, title: p.title, addr: p.addr1,
  image: p.firstimage, lng: Number(p.mapx), lat: Number(p.mapy), type: p.contenttypeid,
  dist: p.dist === undefined ? undefined : Number(p.dist), // 위치 검색일 때만: 기준점까지 거리(m)
});

export async function searchTour({ keyword = '', contentTypeId = '12', rows = 10 } = {}) {
  const extra = { numOfRows: String(rows), areaCode: '39' }; // 39 = 제주
  if (contentTypeId) extra.contentTypeId = contentTypeId;
  if (keyword) extra.keyword = keyword;
  return (await callTour(keyword ? 'searchKeyword2' : 'areaBasedList2', extra)).map(toPlace);
}

// 좌표 주변 검색 (locationBasedList2). radius 단위는 m, 가까운 순(arrange=E)
export async function nearbyTour({ lat, lng, radius = 5000, contentTypeId = '12', rows = 6 } = {}) {
  const list = await callTour('locationBasedList2', {
    numOfRows: String(rows), mapX: String(lng), mapY: String(lat),
    radius: String(radius), contentTypeId, arrange: 'E',
  });
  return list.map(toPlace);
}
