import { fetchPlaces } from '../api/client'
import { distKm } from './course'
import snapshot from '../data/oreumPhotos.json'

// 오름 90곳(제주오름요약설명)에는 사진이 없어서 두 곳에서 찾아 붙인다.
//  ① 한국관광공사 관광사진정보(PhotoGalleryService1) — scripts/build-oreum-photos.mjs 로 미리 찾아 둔 목록(snapshot)
//  ② 한국관광공사 TourAPI 오름 목록(약 30곳) — 이름이 같거나 600m 안에 있으면 같은 오름으로 본다
// 둘 다 없는 오름은 사진 없이 보여 준다.
let list = null
export const loadOreumPhotos = () => (list ??= fetchPlaces('오름', '12').then((r) => r.items).catch(() => { list = null; return [] }))

const norm = (t) => t.replace(/\(.*?\)/g, '').replace(/\s/g, '')
export function findOreumPhoto(photos, o) {
  const s = snapshot[o.id]
  if (s) return { image: s.url, thumb: s.url, credit: s.by }
  return photos.find((p) => norm(o.title) === norm(p.title) || distKm(o, p) < 0.6) ?? null
}
