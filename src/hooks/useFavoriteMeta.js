import { useCallback, useEffect, useState } from 'react'
import { fetchHeritage, fetchPlaceBrief } from '../api/client'

// 즐겨찾기 표에는 이름만 저장되어 있어서, 목록에 보여 줄 사진·주소·좌표는 저장된 항목 번호로 다시 불러온다.
// 같은 항목은 한 번만 불러오도록 결과(약속)를 모듈 안에 보관한다. 실패는 보관하지 않아 다시 시도할 수 있다.
const cache = new Map()

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
// 일시적으로 막히는 경우가 있어 한두 번은 잠깐 뒤에 다시 시도한다
const retry = (fn, n = 2) => fn().catch((e) => (n > 0 ? wait(900).then(() => retry(fn, n - 1)) : Promise.reject(e)))

function load(f) {
  if (f.source === 'tour') {
    return retry(() => fetchPlaceBrief(f.item_id)).then((p) => ({ image: p.image, subtitle: p.addr, lat: p.lat, lng: p.lng, type: p.type }))
  }
  if (f.source === 'heritage') { // 유산은 이름이 곧 id
    return retry(() => fetchHeritage(f.title)).then((list) => {
      const h = list.find((x) => x.name === f.title) ?? list[0]
      return { image: h?.image ?? '', subtitle: h ? [h.kind, h.city].filter(Boolean).join(' · ') : '' }
    })
  }
  return Promise.resolve({})
}

// favorites: store 의 즐겨찾기 행들
// 반환: { meta: { "출처:항목번호": { image, subtitle, lat, lng, type } | { failed: true } }, retry }
//   불러오는 동안은 meta 에 없고, 끝내 실패하면 { failed: true } — retry() 로 실패한 것만 다시 불러온다.
export function useFavoriteMeta(favorites) {
  const [meta, setMeta] = useState({})
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    favorites.forEach((f) => {
      const key = `${f.source}:${f.item_id}`
      if (!cache.has(key)) cache.set(key, load(f).catch(() => { cache.delete(key); return { failed: true } }))
      cache.get(key).then((m) => { if (alive) setMeta((prev) => (prev[key] && !prev[key].failed ? prev : { ...prev, [key]: m })) })
    })
    return () => { alive = false }
  }, [favorites, tick])

  const retryFailed = useCallback(() => setTick((n) => n + 1), [])
  return { meta, retry: retryFailed }
}
