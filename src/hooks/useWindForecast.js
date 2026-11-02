import { useEffect, useState } from 'react'
import { fetchWeather } from '../api/client'

const round1 = (v) => Math.round(v * 10) / 10

// 제주시·서귀포시 두 곳의 시간대별 예보를 시각별로 합쳐 [{ time, date, hour, speed, dir, temp, sky, rain, pop }] 로 돌려준다.
// speed = 풍속 평균(m/s), dir = 풍향 벡터 평균(°). 한 곳만 성공해도 그 값을 쓴다.
export function useWindForecast() {
  const [state, setState] = useState({ loading: true, error: '', slots: [] })

  useEffect(() => {
    let alive = true
    Promise.allSettled(['제주시', '서귀포시'].map((p) => fetchWeather(p, 48))).then((results) => {
      if (!alive) return
      const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
      if (!ok.length) return setState({ loading: false, error: results[0].reason?.message || '예보를 불러오지 못했어요', slots: [] })

      const byTime = new Map()
      for (const rows of ok) {
        for (const r of rows) {
          if (!Number.isFinite(r.wind) || !Number.isFinite(r.windDir)) continue
          byTime.set(r.time, [...(byTime.get(r.time) ?? []), r])
        }
      }
      const slots = [...byTime.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([time, rs]) => {
        const sx = rs.reduce((a, r) => a + Math.sin((r.windDir * Math.PI) / 180), 0)
        const sz = rs.reduce((a, r) => a + Math.cos((r.windDir * Math.PI) / 180), 0)
        return {
          time, date: time.slice(0, 8), hour: Number(time.slice(9, 11)),
          speed: round1(rs.reduce((a, r) => a + r.wind, 0) / rs.length),
          dir: Math.round(((Math.atan2(sx, sz) * 180) / Math.PI + 360) % 360),
          temp: Math.round(rs.reduce((a, r) => a + r.temp, 0) / rs.length),
          sky: rs[0].sky, rain: rs.find((r) => r.rain !== '없음')?.rain ?? '없음', pop: Math.max(...rs.map((r) => r.pop || 0)),
        }
      })
      setState({ loading: false, error: '', slots })
    })
    return () => { alive = false }
  }, [])

  return state
}
