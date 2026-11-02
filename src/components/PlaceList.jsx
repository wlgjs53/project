import { useMemo } from 'react'
import { HAL } from '../lib/terrain'

// 현재 풍향 기준으로 바람을 정면으로 맞는 곳 / 비껴가는 곳을 나눠 보여 준다.
// places: [{ n: 이름, x, z, t: 설명 }] (장면 좌표 km)
export default function PlaceList({ places, windDir }) {
  const { windward, leeward } = useMemo(() => {
    const r = (windDir * Math.PI) / 180
    const fx = Math.sin(r), fz = -Math.cos(r)
    const arr = places
      .map((p) => {
        const dx = p.x - HAL.x, dz = p.z - HAL.z, d = Math.hypot(dx, dz) + 0.001
        return { ...p, e: (dx * fx + dz * fz) / d }
      })
      .sort((a, b) => b.e - a.e)
    return { windward: arr.slice(0, 2), leeward: arr.slice(-2).reverse() }
  }, [places, windDir])

  const row = (p, cls) => (
    <div key={p.n} className={cls}><b>{p.n}</b><em>{p.t}</em></div>
  )

  return (
    <div className="w-plist">
      <small>바람을 정면으로 맞는 곳</small>
      {windward.map((p) => row(p, 'w'))}
      <small>바람을 비껴가는 곳</small>
      {leeward.map((p) => row(p, 'l'))}
    </div>
  )
}
