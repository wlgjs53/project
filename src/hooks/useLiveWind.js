import { useEffect, useState } from 'react'
import { fetchWeather } from '../api/client'
import { llToXZ } from '../lib/geo'

// 실제 예보를 가져올 두 지점 — 기상청 단기예보 격자가 있는 제주시(북)·서귀포시(남). x,z 는 3D 장면 좌표(km)
const SITES = [
  { place: '제주시', ...llToXZ(33.4996, 126.5312) },
  { place: '서귀포시', ...llToXZ(33.2541, 126.5601) },
]

// 예보 시각(KST "YYYYMMDD HH00") 중 지금 이전의 가장 최근 값, 없으면 첫 번째
function pick(rows) {
  const kst = new Date(Date.now() + 9 * 3600e3).toISOString()
  const now = kst.slice(0, 10).replaceAll('-', '') + ' ' + kst.slice(11, 13) + '00'
  const ok = rows.filter((x) => Number.isFinite(x.wind) && Number.isFinite(x.windDir))
  return ok.filter((x) => x.time <= now).at(-1) ?? ok[0] ?? null
}

// 제주시·서귀포시의 실제 풍속·풍향을 가져온다. 하나라도 성공하면 값을 돌려주고, 모두 실패하면 null (샘플 바람 유지)
// 반환: { speed, dir  ← 섬 전체를 대표하는 값(풍속 평균·풍향 벡터 평균), label, stations ← 두 곳 다 성공했을 때만: 바람장에 넣을 실제 관측점 }
export function useLiveWind() {
  const [live, setLive] = useState(null)
  useEffect(() => {
    let alive = true
    Promise.allSettled(SITES.map((s) => fetchWeather(s.place).then(pick))).then((results) => {
      const pts = results
        .map((r, i) => (r.status === 'fulfilled' && r.value ? { ...SITES[i], speed: r.value.wind, dir: r.value.windDir } : null))
        .filter(Boolean)
      if (!alive || !pts.length) return
      const speed = Math.round((pts.reduce((a, p) => a + p.speed, 0) / pts.length) * 10) / 10
      const sx = pts.reduce((a, p) => a + Math.sin((p.dir * Math.PI) / 180), 0)
      const sz = pts.reduce((a, p) => a + Math.cos((p.dir * Math.PI) / 180), 0)
      const dir = Math.round(((Math.atan2(sx, sz) * 180) / Math.PI + 360) % 360)
      setLive({
        speed, dir,
        label: pts.length === 2 ? '제주시·서귀포시 평균' : pts[0].place,
        stations: pts.length === 2 ? pts.map(({ x, z, speed: sp, dir: d }) => ({ x, z, speed: sp, dir: d })) : null,
      })
    })
    return () => { alive = false }
  }, [])
  return live
}
