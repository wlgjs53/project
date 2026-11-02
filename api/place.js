import { getPlaceDetail, getPlaceBrief } from '../server/tour.js';

// GET /api/place?id=316058&type=12 → 장소 하나의 설명·사진·이용 정보 (클릭했을 때만 호출)
// GET /api/place?id=316058&brief=1 → 이름·주소·사진만 (즐겨찾기 목록용)
export default async function handler(req, res) {
  try {
    const { id, type = '12', brief } = req.query;
    if (!/^\d+$/.test(id ?? '')) return res.status(400).json({ error: 'id 는 숫자여야 해요' });
    if (!['12', '14', '15', '39'].includes(type)) return res.status(400).json({ error: 'type 은 12, 14, 15, 39 중 하나예요' });
    // 장소 정보는 자주 바뀌지 않는다 → 한 시간 캐시해서 외부 API 호출을 줄인다
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(brief ? await getPlaceBrief({ id }) : await getPlaceDetail({ id, type }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
