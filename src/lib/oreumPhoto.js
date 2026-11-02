import { fetchPlaces } from '../api/client'
import { distKm } from './course'

// 오름 90곳(제주오름요약설명)에는 사진이 없어서, 사진이 있는 TourAPI 오름 목록(약 30곳)을 한 번만 받아 두고
// 이름이 같거나 600m 안에 있으면 같은 오름으로 보고 그 사진을 쓴다.
let list = null
export const loadOreumPhotos = () => (list ??= fetchPlaces('오름', '12').then((r) => r.items).catch(() => { list = null; return [] }))

const norm = (t) => t.replace(/\(.*?\)/g, '').replace(/\s/g, '')
export const findOreumPhoto = (photos, o) => photos.find((p) => norm(o.title) === norm(p.title) || distKm(o, p) < 0.6) ?? null
