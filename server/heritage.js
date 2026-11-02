// 국가유산청 국가유산 오픈API (키 불필요, XML 응답)
//  - SearchKindOpenapiList.do : 목록 (이름·종목·지역·관리번호)
//  - SearchKindOpenapiDt.do   : 상세 (대표 사진·공식 설명문·지정일)
//  - SearchImageOpenapi.do    : 사진 목록 (여러 장 + 설명)
import { XMLParser } from 'fast-xml-parser';
// parseTagValue: false → 값을 숫자로 바꾸지 않는다. (관리번호 "0000710000000" 의 앞자리 0 이 사라지면 조회가 실패한다)
const parser = new XMLParser({ parseTagValue: false });
const BASE = 'https://www.khs.go.kr/cha';

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]); // 1개면 값, 여러 개면 배열로 오므로 통일
const str = (v) => String(v ?? '').trim();
const https = (u) => str(u).replace(/^http:/, 'https:'); // https 사이트에서 막히지 않도록

async function getXml(op, params) {
  const r = await fetch(`${BASE}/${op}?${new URLSearchParams(params)}`);
  return parser.parse(await r.text());
}

// 설명문의 첫 문장(없으면 앞부분)을 카드용 요약으로
function summarize(content, max = 110) {
  const t = str(content).replace(/\s+/g, ' ');
  const first = t.match(/^.+?[다요]\./)?.[0] ?? t;
  return first.length > max ? first.slice(0, max) + '…' : first;
}

// 상세: 대표 사진, 공식 설명문, 지정일, 분류 (+ withImages 면 사진 목록까지)
// 사진 목록은 호출이 한 번 더 들어가므로 상세 화면에서만 켠다.
export async function getHeritageDetail({ kdcd, ctcd, asno, withImages = true }) {
  const q = { ccbaKdcd: kdcd, ccbaCtcd: ctcd, ccbaAsno: asno };
  const [dt, im] = await Promise.all([getXml('SearchKindOpenapiDt.do', q), withImages ? getXml('SearchImageOpenapi.do', q) : null]);
  const it = dt?.result?.item ?? {};
  const urls = arr(im?.result?.item?.imageUrl);
  const descs = arr(im?.result?.item?.ccimDesc);
  const d = str(it.ccbaAsdt); // 예: 19801117
  return {
    image: https(it.imageUrl),
    content: str(it.content),
    designated: d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}` : '',
    category: [it.gcodeName, it.bcodeName, it.mcodeName].map(str).filter(Boolean).join(' · '),
    address: str(it.ccbaLcad),
    keeper: str(it.ccbaAdmin),
    images: urls.map((u, i) => ({ url: https(u), desc: str(descs[i]) })),
  };
}

// 목록. detail=true 면 항목마다 대표 사진(image)과 요약(summary)을 붙인다.
export async function searchHeritage({ keyword = '', rows = 8, detail = false } = {}) {
  const params = { ccbaCtcd: '50', pageUnit: String(rows), pageIndex: '1' }; // 50 = 제주
  if (keyword) params.ccbaMnm1 = keyword;
  const data = await getXml('SearchKindOpenapiList.do', params);
  const items = arr(data?.result?.item).map((h) => ({
    name: str(h.ccbaMnm1), kind: str(h.ccmaName), city: str(h.ccsiName),
    lat: Number(h.latitude) || 0, lng: Number(h.longitude) || 0,
    kdcd: str(h.ccbaKdcd), ctcd: str(h.ccbaCtcd), asno: str(h.ccbaAsno),
  }));
  if (!detail) return items;
  return Promise.all(items.map(async (h) => {
    try {
      const d = await getHeritageDetail({ ...h, withImages: false });
      return { ...h, image: d.image, summary: summarize(d.content) };
    } catch {
      return h; // 상세 조회가 실패해도 목록은 보여 준다
    }
  }));
}
