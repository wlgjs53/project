import { searchHeritage, getHeritageDetail } from '../server/heritage.js';

// GET /api/heritage?keyword=영등            → 목록 (대표 사진·요약 포함)
// GET /api/heritage?kdcd=17&ctcd=50&asno=…  → 상세 (공식 설명문·사진 여러 장)
export default async function handler(req, res) {
  try {
    // 공공 데이터라 자주 바뀌지 않는다 → 한 시간 캐시해서 외부 API 호출을 줄인다
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    const { kdcd, ctcd, asno, keyword } = req.query;
    if (asno) {
      if (![kdcd, ctcd, asno].every((v) => /^\d+$/.test(v ?? ''))) {
        return res.status(400).json({ error: 'kdcd, ctcd, asno 는 숫자여야 해요' });
      }
      return res.status(200).json(await getHeritageDetail({ kdcd, ctcd, asno }));
    }
    res.status(200).json(await searchHeritage({ keyword, detail: true }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
