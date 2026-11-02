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

const https = (u) => String(u ?? '').trim().replace(/^http:/, 'https:'); // https 사이트에서 막히지 않도록

const toPlace = (p) => ({
  id: p.contentid, title: p.title, addr: p.addr1,
  image: https(p.firstimage),
  thumb: https(p.firstimage2), // 목록용 작은 사진
  lng: Number(p.mapx), lat: Number(p.mapy), type: p.contenttypeid,
  dist: p.dist === undefined ? undefined : Number(p.dist), // 위치 검색일 때만: 기준점까지 거리(m)
});

export async function searchTour({ keyword = '', contentTypeId = '12', rows = 10 } = {}) {
  const extra = { numOfRows: String(rows), areaCode: '39' }; // 39 = 제주
  if (contentTypeId) extra.contentTypeId = contentTypeId;
  if (keyword) extra.keyword = keyword;
  return (await callTour(keyword ? 'searchKeyword2' : 'areaBasedList2', extra)).map(toPlace);
}

// 목록 화면용: 한 번에 최대 500건을 받아(제주 음식점 전체가 388곳) **사진이 있는 곳만** 남긴다.
// 화면에서 "더 보기"로 나눠 보여 주므로 쪽 나누기는 하지 않는다. area: '' 전체 | 'jeju' 제주시 | 'seogwipo' 서귀포시
export async function listTour({ keyword = '', contentTypeId = '39', area = '' } = {}) {
  const extra = { numOfRows: '500', areaCode: '39', contentTypeId }; // 39 = 제주
  if (keyword) extra.keyword = keyword;
  const all = (await callTour(keyword ? 'searchKeyword2' : 'areaBasedList2', extra)).map(toPlace);
  const word = area === 'jeju' ? '제주시' : area === 'seogwipo' ? '서귀포시' : '';
  const inArea = word ? all.filter((p) => (p.addr || '').includes(word)) : all; // "제주특별자치도 제주시 …" / "… 서귀포시 …"
  const items = inArea.filter((p) => p.image); // 사진이 없는 곳은 뺀다
  return { items, total: inArea.length, withImage: items.length };
}

// ── 장소 상세 (설명·사진·이용 정보) ─────────────────────────────
const clean = (html) => String(html ?? '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/[ \t]+\n/g, '\n').trim();
const hrefOf = (html) => String(html ?? '').match(/href=["']([^"']+)/i)?.[1] ?? '';

// 콘텐츠 유형별로 보여 줄 이용 정보 항목 [응답 필드, 화면 이름]
const INTRO_FIELDS = {
  12: [['usetime', '이용시간'], ['restdate', '쉬는 날'], ['parking', '주차'], ['expguide', '체험 안내'], ['infocenter', '문의']],
  14: [['usetimeculture', '이용시간'], ['restdateculture', '쉬는 날'], ['usefee', '이용요금'], ['parkingculture', '주차'], ['infocenterculture', '문의']],
  15: [['eventstartdate', '시작일'], ['eventenddate', '종료일'], ['eventplace', '장소'], ['playtime', '공연시간'], ['usetimefestival', '이용요금']],
  39: [['firstmenu', '대표 메뉴'], ['treatmenu', '취급 메뉴'], ['opentimefood', '영업시간'], ['restdatefood', '쉬는 날'], ['parkingfood', '주차'], ['reservationfood', '예약'], ['infocenterfood', '문의']],
};

// 공공누리 유형 표기 ("Type1" → "공공누리 제1유형")
const nuri = (c) => { const n = /(\d)/.exec(String(c ?? ''))?.[1]; return n ? `공공누리 제${n}유형` : ''; };

// 장소의 이름·주소·사진만 가볍게 (호출 1번). 즐겨찾기 목록처럼 id 만 알고 있을 때 쓴다.
export async function getPlaceBrief({ id } = {}) {
  const c = (await callTour('detailCommon2', { contentId: id }))[0] ?? {};
  return {
    id, title: c.title, type: c.contenttypeid,
    addr: [c.addr1, c.addr2].filter(Boolean).join(' '),
    image: https(c.firstimage), thumb: https(c.firstimage2),
  };
}

export async function getPlaceDetail({ id, type = '12' } = {}) {
  const [common, intro, imgs] = await Promise.all([
    callTour('detailCommon2', { contentId: id }),
    callTour('detailIntro2', { contentId: id, contentTypeId: type }),
    callTour('detailImage2', { contentId: id, imageYN: 'Y', numOfRows: '12' }),
  ]);
  const c = common[0] ?? {};
  const i = intro[0] ?? {};
  return {
    id, type, title: c.title, addr: [c.addr1, c.addr2].filter(Boolean).join(' '),
    tel: clean(c.tel), homepage: hrefOf(c.homepage), overview: clean(c.overview),
    image: https(c.firstimage), copyright: nuri(c.cpyrhtDivCd),
    images: imgs.map((m) => ({ url: https(m.originimgurl), thumb: https(m.smallimageurl || m.originimgurl), desc: clean(m.imgname) })),
    info: (INTRO_FIELDS[type] ?? []).map(([k, label]) => [label, clean(i[k])]).filter(([, v]) => v),
  };
}

// 좌표 주변 검색 (locationBasedList2). radius 단위는 m, 가까운 순(arrange=E)
export async function nearbyTour({ lat, lng, radius = 5000, contentTypeId = '12', rows = 6 } = {}) {
  const list = await callTour('locationBasedList2', {
    numOfRows: String(rows), mapX: String(lng), mapY: String(lat),
    radius: String(radius), contentTypeId, arrange: 'E',
  });
  return list.map(toPlace);
}
