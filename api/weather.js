import { getWeather } from '../server/weather.js';

// GET /api/weather?place=제주시&hours=24 → 시간대별 예보 (hours 생략 시 6시간)
export default async function handler(req, res) {
  try {
    res.status(200).json(await getWeather({ place: req.query.place, hours: req.query.hours }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
