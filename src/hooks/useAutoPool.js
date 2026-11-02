import { useEffect, useState } from 'react'
import { fetchPlaces } from '../api/client'

// "오늘의 추천 코스"를 고를 후보(명소·문화시설·맛집, 사진 있는 곳만). 권역별로 한 번만 불러온다.
const cache = new Map()
const ok = (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat > 33 && p.image

function load(area) {
  if (!cache.has(area)) {
    const p = Promise.all([
      fetchPlaces('', '12', area), fetchPlaces('', '14', area), fetchPlaces('', '39', area), fetchPlaces('해녀', '39', area), fetchPlaces('오름', '12', area),
    ]).then(([s, i, f, h, o]) => {
      const seen = new Set()
      const foods = [...h.items, ...f.items].filter((x) => !seen.has(x.id) && seen.add(x.id))
      return { oreums: o.items.filter((x) => /오름|봉$/.test(x.title)).filter(ok), sights: s.items.filter(ok), indoors: i.items.filter(ok), foods: foods.filter(ok) }
    })
    cache.set(area, p.catch((e) => { cache.delete(area); throw e }))
  }
  return cache.get(area)
}

export function useAutoPool(area, enabled) {
  const [res, setRes] = useState({ area: null, pool: null, error: null })

  useEffect(() => {
    if (!enabled) return
    let alive = true
    load(area)
      .then((pool) => alive && setRes({ area, pool, error: null }))
      .catch((e) => alive && setRes({ area, pool: null, error: e }))
    return () => { alive = false }
  }, [area, enabled])

  const cur = res.area === area
  return { pool: cur ? res.pool : null, error: cur ? res.error : null, loading: enabled && !cur }
}
