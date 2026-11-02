import { useEffect, useState } from 'react'
import { fetchOreums } from '../api/client'
import { llToXZ } from '../lib/geo'

// 오름 90곳 — 한 번만 불러와 3D 좌표(x, z)를 붙여 둔다. 실패하면 빈 목록(지도는 오름 없이 그대로 동작).
let promise = null
const load = () => (promise ??= fetchOreums()
  .then((r) => r.items.map((o) => ({ ...o, ...llToXZ(o.lat, o.lng), type: 'oreum' })))
  .catch((e) => { promise = null; throw e }))

export function useOreums() {
  const [state, setState] = useState({ items: [], error: null })
  useEffect(() => {
    let alive = true
    load().then((items) => alive && setState({ items, error: null })).catch((error) => alive && setState({ items: [], error }))
    return () => { alive = false }
  }, [])
  return state
}
