import { getOreums } from '../server/oreum.js';

// GET /api/oreum → 제주 오름 90곳 { items: [{ id, title, addr, height, rise, desc, lat, lng }] }
export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({ items: await getOreums() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
