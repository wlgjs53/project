// 바람 조건에 따른 장소 추천 로직 (단순 기준 — 발표 때 "기준을 직접 정했다"고 설명할 것)
import { HAL } from './terrain'
import { dirName, llToXZ } from './geo'

// 풍속(m/s) 단계: 5 미만 잔잔 / 5~10 보통 / 10 이상 강함
export const windLevel = (speed) => (speed >= 10 ? 'strong' : speed >= 5 ? 'normal' : 'calm')

export const ADVICE = {
  strong: '바람이 강한 날이에요. 바람을 비껴가는 곳과 실내(식당·전시) 위주로 둘러보세요. 우도 배편은 운항 여부를 먼저 확인하세요.',
  normal: '바람이 적당해요. 해안 명소와 오름을 함께 둘러보기 좋아요.',
  calm: '바람이 잔잔한 날이에요. 바다와 가까운 해안 명소를 즐기기 좋아요.',
}

// 한라산에서 본 장소의 방향이 바람이 불어오는 쪽이면 +1 에 가깝고, 반대편(바람 그늘)이면 -1 에 가깝다.
export function exposure(place, windDir) {
  const { x, z } = place.x !== undefined ? place : llToXZ(place.lat, place.lng)
  const r = (windDir * Math.PI) / 180
  const fx = Math.sin(r), fz = -Math.cos(r)
  const dx = x - HAL.x, dz = z - HAL.z
  return (dx * fx + dz * fz) / (Math.hypot(dx, dz) + 0.001)
}

export const exposureLabel = (e) => (e > 0.35 ? '바람 맞는 쪽' : e < -0.35 ? '바람 비낀 쪽' : '')

// "왜 이곳을 추천했나요?" 문구 — 현재 바람과 장소의 방향으로 만든다.
export function whyText(place, wind, kind) {
  const now = `지금 ${dirName(wind.dir)}풍 ${wind.speed.toFixed(1)}m/s.`
  if (kind === 'food') return `${now} 식당은 실내라 바람과 상관없이 편하게 들를 수 있어요. 가까운 순으로 골랐어요.`
  const e = place.e ?? exposure(place, wind.dir)
  const windward = e > 0.35, leeward = e < -0.35
  const side = windward ? '한라산에서 보아 바람이 불어오는 쪽' : leeward ? '한라산에서 보아 바람을 비껴가는 쪽' : '바람이 비스듬히 지나는 쪽'
  const level = windLevel(wind.speed)
  const tip = level === 'strong'
    ? (windward ? '바람이 센 날엔 해안이 거칠 수 있으니 방풍 옷차림을 챙기세요.' : '바람이 센 날에도 비교적 편하게 둘러볼 수 있어요.')
    : level === 'calm'
      ? (windward ? '잔잔한 날이라 바람을 느끼며 걷기 좋아요.' : '잔잔한 날이라 어디든 편하게 둘러볼 수 있어요.')
      : '바람이 적당해 둘러보기 좋아요.'
  return `${now} 이곳은 ${side}이에요. ${tip}`
}

// 명소는 바람에 맞춰 정렬하고, 음식점(실내)은 가까운 순으로 둔다.
export function rankPlaces(items, windSpeed, windDir, indoor = false) {
  const withE = items.map((p) => ({ ...p, e: exposure(p, windDir) }))
  const level = windLevel(windSpeed)
  if (indoor || level === 'normal') return withE.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))
  return withE.sort((a, b) => (level === 'strong' ? a.e - b.e : b.e - a.e))
}
