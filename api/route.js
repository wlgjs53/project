import { getMatrix, getRoute, parsePoints } from '../server/route.js';

// GET /api/route?mode=table&pts=126.86,33.52;126.47,33.50;…  → { durations, distances }  (모든 쌍의 시간(초)·거리(m))
// GET /api/route?mode=route&pts=…                           → { distance, duration, legs, line }  (정해진 순서의 경로)
export default async function handler(req, res) {
  try {
    const pts = parsePoints(req.query.pts);
    // 같은 구간은 결과가 거의 변하지 않는다 → 하루 캐시
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json(req.query.mode === 'route' ? await getRoute(pts) : await getMatrix(pts));
  } catch (e) {
    res.status(e.status ?? 502).json({ error: e.message });
  }
}
