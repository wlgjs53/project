import { useEffect, useState } from 'react'
import { fetchWeather } from '../api/client'

// 기상청 단기예보에서 가장 가까운 시각의 풍속·풍향을 가져온다. 실패하면 null (샘플 바람 유지)
export function useLiveWind(place = '제주시') {
  const [live, setLive] = useState(null)
  useEffect(() => {
    let alive = true
    fetchWeather(place)
      .then((rows) => {
        // 예보 시각(KST "YYYYMMDD HH00") 중 지금 이전의 가장 최근 것, 없으면 첫 번째
        const kst = new Date(Date.now() + 9 * 3600e3).toISOString()
        const now = kst.slice(0, 10).replaceAll('-', '') + ' ' + kst.slice(11, 13) + '00'
        const ok = rows.filter((x) => Number.isFinite(x.wind) && Number.isFinite(x.windDir))
        const r = ok.filter((x) => x.time <= now).at(-1) ?? ok[0]
        if (alive && r) setLive({ speed: r.wind, dir: r.windDir, place: r.place, time: r.time })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [place])
  return live
}
