import { useEffect, useState } from 'react'
import { fetchRoute } from '../api/client'

// 같은 좌표 조합은 한 번만 불러온다 (실패는 보관하지 않음)
const cache = new Map()
const keyOf = (pts) => pts.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(';')

function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make().catch((e) => { cache.delete(key); throw e }))
  return cache.get(key)
}

// 장소들 사이의 실제 도로 시간·거리 행렬 → { matrix: { minutes, km } | null, ready }
// 불러오지 못하면 matrix 는 null (코스는 직선거리 추정으로 짠다). places 의 순서가 행렬의 번호가 된다.
export function useDistanceMatrix(places) {
  const k = places.length >= 2 ? keyOf(places) : ''
  const [res, setRes] = useState({ k: null, matrix: null })

  useEffect(() => {
    if (!k) return
    let alive = true
    cached('T' + k, () => fetchRoute(places, 'table'))
      .then((r) => alive && setRes({ k, matrix: { minutes: r.durations.map((row) => row.map((s) => s / 60)), km: r.distances.map((row) => row.map((m) => m / 1000)) } }))
      .catch(() => alive && setRes({ k, matrix: null }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k])

  return { matrix: res.k === k ? res.matrix : null, ready: !k || res.k === k }
}

// 정해진 순서의 실제 도로 경로 → { line: [[위도, 경도], …] | null, legs: [{ distance(m), duration(초) }] | null }
export function useRouteLine(points) {
  const k = points.length >= 2 ? keyOf(points) : ''
  const [res, setRes] = useState({ k: null, line: null, legs: null })

  useEffect(() => {
    if (!k) return
    let alive = true
    cached('R' + k, () => fetchRoute(points, 'route'))
      .then((r) => alive && setRes({ k, line: r.line, legs: r.legs }))
      .catch(() => alive && setRes({ k, line: null, legs: null }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k])

  const cur = res.k === k
  return { line: cur ? res.line : null, legs: cur ? res.legs : null, ready: !k || cur }
}
