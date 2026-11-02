import { nearbyTour } from '../server/tour.js';

// GET /api/nearby?lat=33.5&lng=126.5&type=12&radius=5000&rows=6
// 좌표 주변의 관광지(12)·문화시설(14)·축제(15)·음식점(39)을 가까운 순으로 돌려준다.
export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'lat, lng 숫자가 필요해요' });
    }
    const radius = Math.min(20000, Math.max(100, Number(req.query.radius) || 5000));
    const rows = Math.min(20, Math.max(1, Number(req.query.rows) || 6));
    const type = ['12', '14', '15', '39'].includes(req.query.type) ? req.query.type : '12';
    res.status(200).json(await nearbyTour({ lat, lng, radius, rows, contentTypeId: type }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
