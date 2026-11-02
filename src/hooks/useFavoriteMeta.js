import { useEffect, useState } from 'react'
import { fetchHeritage, fetchPlaceBrief } from '../api/client'

// 즐겨찾기 표에는 이름만 저장되어 있어서, 목록에 보여 줄 사진·주소는 저장된 항목 번호로 다시 불러온다.
// 같은 항목은 한 번만 불러오도록 결과(약속)를 모듈 안에 보관한다.
const cache = new Map()

function load(f) {
  if (f.source === 'tour') {
    return fetchPlaceBrief(f.item_id).then((p) => ({ image: p.image, subtitle: p.addr }))
  }
  if (f.source === 'heritage') { // 유산은 이름이 곧 id
    return fetchHeritage(f.title).then((list) => {
      const h = list.find((x) => x.name === f.title) ?? list[0]
      return { image: h?.image ?? '', subtitle: h ? [h.kind, h.city].filter(Boolean).join(' · ') : '' }
    })
  }
  return Promise.resolve({})
}

// favorites: store 의 즐겨찾기 행들 → { "출처:항목번호": { image, subtitle } } (불러오는 동안은 없음)
export function useFavoriteMeta(favorites) {
  const [meta, setMeta] = useState({})

  useEffect(() => {
    let alive = true
    favorites.forEach((f) => {
      const key = `${f.source}:${f.item_id}`
      if (!cache.has(key)) cache.set(key, load(f).catch(() => { cache.delete(key); return {} })) // 실패는 다음에 다시 시도
      cache.get(key).then((m) => { if (alive) setMeta((prev) => (prev[key] ? prev : { ...prev, [key]: m })) })
    })
    return () => { alive = false }
  }, [favorites])

  return meta
}
