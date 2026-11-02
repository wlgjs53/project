import { useEffect, useState } from 'react'
import { fetchWeather } from '../api/client'

// 기상청 단기예보에서 가장 가까운 시각의 풍속·풍향을 가져온다. 실패하면 null (샘플 바람 유지)
export function useLiveWind(place = '제주시') {
  const [live, setLive] = useState(null)
  useEffect(() => {
    let alive = true
    fetchWeather(place)
      .then((rows) => {
        const r = rows.find((x) => Number.isFinite(x.wind) && Number.isFinite(x.windDir))
        if (alive && r) setLive({ speed: r.wind, dir: r.windDir, place: r.place, time: r.time })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [place])
  return live
}
