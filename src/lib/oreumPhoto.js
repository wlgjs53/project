import { fetchPlaces } from '../api/client'
import { distKm } from './course'
import snapshot from '../data/oreumPhotos.json'
import kakao from '../data/oreumPhotosKakao.json'

// 오름 90곳(제주오름요약설명)에는 사진이 없어서 두 곳에서 찾아 붙인다.
//  ① 한국관광공사 관광사진정보(PhotoGalleryService1) — scripts/build-oreum-photos.mjs 로 미리 찾아 둔 목록(snapshot)
//  ② 한국관광공사 TourAPI 오름 목록(약 30곳) — 이름이 같거나 600m 안에 있으면 같은 오름으로 본다
//  ③ 위 둘에 없으면 카카오(다음) 이미지 검색 결과 — scripts/build-oreum-kakao.mjs 로 미리 찾아 둔 목록. 블로그·뉴스 등 원 저작자가 있는 사진이라 출처(사이트·원문 링크)를 함께 표시한다.
let list = null
export const loadOreumPhotos = () => (list ??= fetchPlaces('오름', '12').then((r) => r.items).catch(() => { list = null; return [] }))

const norm = (t) => t.replace(/\(.*?\)/g, '').replace(/\s/g, '')
export function findOreumPhoto(photos, o) {
  const s = snapshot[o.id]
  if (s) return { image: s.url, thumb: s.url, credit: s.by }
  const t = photos.find((p) => norm(o.title) === norm(p.title) || distKm(o, p) < 0.6)
  if (t) return t
  const k = kakao[o.id]
  return k ? { image: k.url, thumb: k.url, thumbFallback: k.thumb, source: { site: k.site, url: k.src } } : null
}
