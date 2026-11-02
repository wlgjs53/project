import { listTour } from '../server/tour.js';

// GET /api/tour?type=39&keyword=해녀&area=jeju
//   type: 12 관광지 · 14 문화시설 · 39 음식점,  area: (없음)=전체 · jeju=제주시 · seogwipo=서귀포시
//   → { items: [사진이 있는 곳], total: 조건에 맞는 전체 수, withImage: 사진이 있는 수 }
export default async function handler(req, res) {
  try {
    const { keyword = '', type = '12', area = '' } = req.query;
    if (!['12', '14', '39'].includes(type)) return res.status(400).json({ error: 'type 은 12, 14, 39 중 하나예요' });
    if (!['', 'jeju', 'seogwipo'].includes(area)) return res.status(400).json({ error: 'area 는 jeju 또는 seogwipo 예요' });
    // 등록 정보는 자주 바뀌지 않는다 → 한 시간 캐시해서 외부 API 호출을 줄인다
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(await listTour({ keyword: String(keyword).slice(0, 30), contentTypeId: type, area }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
