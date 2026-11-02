import { useEffect, useState } from 'react'
import { fetchNearby } from '../api/client'
import { sampleNearby } from '../data/sampleNearby'
import { llToXZ } from '../lib/geo'

const TYPES = { tour: '12', food: '39' } // 관광지, 음식점
const withXZ = (p) => ({ ...p, ...llToXZ(p.lat, p.lng) })

// 영등 여정의 각 장소(stops) 주변 명소·맛집을 TourAPI 로 불러온다.
// 실패하면(키 없음 등) 자리표시 데이터로 대체하고 error 에 이유를 남긴다.
// 반환: { [stop.id]: { loading, error, sample, tour: [], food: [] } }
export function useNearby(stops, radius = 5000, rows = 6) {
  const [state, setState] = useState(() => Object.fromEntries(stops.map((s) => [s.id, { loading: true, error: '', sample: false, tour: [], food: [] }])))

  useEffect(() => {
    let alive = true
    stops.forEach(async (s) => {
      const call = (type) => fetchNearby({ lat: s.lat, lng: s.lng, type, radius, rows })
      let next
      try {
        const [tour, food] = await Promise.all([call(TYPES.tour), call(TYPES.food)])
        next = { loading: false, error: '', sample: false, tour: tour.map(withXZ), food: food.map(withXZ) }
      } catch (e) {
        next = {
          loading: false, error: e.message, sample: true,
          tour: sampleNearby(s, TYPES.tour).map(withXZ), food: sampleNearby(s, TYPES.food).map(withXZ),
        }
      }
      if (alive) setState((prev) => ({ ...prev, [s.id]: next }))
    })
    return () => { alive = false }
  }, [stops, radius, rows])

  return state
}
