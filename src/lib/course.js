// "할망따라" 코스: 장소들을 시간대별 바람에 맞춰 순서·시간을 정한다. (규칙 기반 — AI 키 없이 동작)
// 이동 시간·거리는 실제 도로(OSRM) 값을 쓰고, 불러오지 못하면 직선거리로 어림한다(estimated).
// 영업시간·휴무·주차·혼잡은 반영하지 않는다.
import { exposure, windLevel } from './advice'

export const MAX_PLACES = 6        // 순서를 모두 따져 보므로 6곳까지 (6! = 720가지)
const SPEED_KMH = 35               // (대체용) 직선거리 추정 시 평균 이동 속도
const STAY_MIN = 60                // 한 곳에서 머무는 시간
const LUNCH = 12.5 * 60, DINNER = 18 * 60

export const isOreum = (p) => p.type === 'oreum' || /오름/.test(p.title)
export const kindOf = (type) => (type === '39' ? 'food' : type === '14' ? 'indoor' : 'sight')
export const KIND_LABEL = { sight: '명소', indoor: '문화시설', food: '맛집' }

export function distKm(a, b) {
  const R = 6371, rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const estimateMin = (km) => Math.round((km / SPEED_KMH) * 60 + 5) // (대체용) 직선거리 → 시간

export function hhmm(min) {
  const m = Math.round(min / 5) * 5
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// 코스를 짤 하루: 오후 2시 전이면 오늘(지금 이후), 그 뒤면 내일 — 오전 9시~오후 7시 예보만 쓴다.
export function pickDay(slots, now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600e3)
  const ymd = (d) => d.toISOString().slice(0, 10).replaceAll('-', '')
  const hr = kst.getUTCHours()
  const useToday = hr <= 13
  const target = useToday ? ymd(kst) : ymd(new Date(kst.getTime() + 864e5))
  const day = slots.filter((s) => s.date === target && s.hour >= Math.max(9, useToday ? hr : 9) && s.hour <= 19)
  return { label: useToday ? '오늘' : '내일', slots: day }
}

export const meanDir = (slots) => {
  const sx = slots.reduce((a, s) => a + Math.sin((s.dir * Math.PI) / 180), 0)
  const sz = slots.reduce((a, s) => a + Math.cos((s.dir * Math.PI) / 180), 0)
  return Math.round(((Math.atan2(sx, sz) * 180) / Math.PI + 360) % 360)
}

function* permutations(arr) {
  if (arr.length <= 1) { yield arr; return }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const p of permutations(rest)) yield [arr[i], ...p]
  }
}

// places: [{ id, title, type, lat, lng, image, addr }], slots: pickDay 의 slots (시각 순)
// matrix: 실제 도로 행렬 { minutes[i][j], km[i][j] } (places 의 순서와 같은 번호) — 없으면 직선거리로 어림한다
// 반환: { steps, summary, estimated } — steps[i] = { place, kind, e, arrive, depart, travel, km, wind, level, reason }
export function buildCourse({ places, slots, matrix = null }) {
  if (!places.length || slots.length < 2) return null
  const windDir = meanDir(slots)
  const speeds = slots.map((s) => s.speed)
  const minW = Math.min(...speeds), maxW = Math.max(...speeds)
  const startMin = slots[0].hour * 60
  const endLimit = (slots.at(-1).hour + 1) * 60

  const items = places.slice(0, MAX_PLACES).map((p, idx) => {
    const e = exposure(p, windDir)            // 한라산 기준: 바람이 불어오는 쪽(+) / 비껴가는 쪽(−)
    return { ...p, idx, kind: kindOf(p.type), e, windward: e > 0.35, leeward: e < -0.35 }
  })

  const legOf = (a, b) => (matrix && matrix.minutes[a.idx]?.[b.idx] != null
    ? { min: Math.max(1, Math.round(matrix.minutes[a.idx][b.idx])), km: matrix.km[a.idx][b.idx] }
    : { min: estimateMin(distKm(a, b)), km: distKm(a, b) })

  const windAt = (min) => {
    const h = Math.floor(min / 60)
    return (slots.find((s) => s.hour === h) ?? (min < startMin ? slots[0] : slots.at(-1))).speed
  }

  function evaluate(order) {
    let t = startMin, prev = null, cost = 0, foodNo = 0
    const steps = []
    for (const it of order) {
      const leg = prev ? legOf(prev, it) : { min: 0, km: 0 }
      const arrive = t + leg.min
      const w = windAt(arrive)
      cost += leg.min * 0.03
      if (it.kind === 'sight') cost += it.windward ? w * 1.0 : it.leeward ? (maxW - w) * 0.25 : w * 0.3 // 바람 맞는 곳은 약한 시간에
      if (it.kind === 'indoor') cost += (maxW - w) * 0.5                                                  // 실내는 바람이 센 시간에
      if (it.kind === 'food') {
        // 첫 식당은 점심 시간대에, 두 번째부터는 오후(3시 이후)의 식사·카페로 — 식당 두 곳이 연달아 점심이 되지 않게
        cost += foodNo === 0 ? Math.abs(arrive - LUNCH) * 0.02 : Math.max(0, 15 * 60 - arrive) * 0.03
        foodNo += 1
      }
      steps.push({
        place: it, kind: it.kind, e: it.e, windward: it.windward, leeward: it.leeward, foodNo: it.kind === 'food' ? foodNo - 1 : -1,
        arrive, depart: arrive + STAY_MIN, travel: leg.min, km: leg.km, wind: w, level: windLevel(w),
      })
      t = arrive + STAY_MIN
      prev = it
    }
    if (t > endLimit) cost += (t - endLimit) * 0.5 // 예보가 있는 시간을 넘기면 불리하게
    return { cost, steps }
  }

  let best = null
  for (const order of permutations(items)) {
    const r = evaluate(order)
    if (!best || r.cost < best.cost) best = r
  }

  const steps = best.steps.map((s, i) => ({ ...s, reason: reasonFor(s, i, { minW, maxW }) }))
  return {
    steps,
    estimated: !matrix,
    summary: {
      from: startMin, to: steps.at(-1).depart,
      totalKm: steps.reduce((a, s) => a + s.km, 0), driveMin: steps.reduce((a, s) => a + s.travel, 0),
      minW, maxW, windDir,
      overtime: steps.at(-1).depart > endLimit, // 예보가 있는 시간(오후 7시경)을 넘기는 코스
    },
  }
}

// 즐겨찾기 없이 "오늘 바람에 맞춰 이렇게 가 보세요"를 자동으로 고른다.
//  - 바람이 잔잔한 날: 바람 맞는 쪽 해안 명소를, 센 날: 바람을 비껴가는 명소를 우선
//  - 시작 명소 근처(30km 안)에서 명소를 더 고르고, 문화시설 하나, 코스 중심 근처의 식당(가능하면 해녀의집)을 넣는다
//  - variant: 0, 1, 2… 를 바꾸면 다른 시작 명소로 다른 코스를 만든다
export function autoPick({ sights = [], indoors = [], foods = [], slots, variant = 0 }) {
  if (!sights.length || slots.length < 2) return []
  const dir = meanDir(slots)
  const avg = slots.reduce((a, s) => a + s.speed, 0) / slots.length
  const calm = avg < 6
  const score = (p) => (calm ? 1 : -1) * exposure(p, dir) + (/해녀/.test(p.title) ? 0.4 : 0)

  const ranked = [...sights].sort((a, b) => score(b) - score(a))
  const seed = ranked[variant % Math.min(5, ranked.length)]
  const more = ranked
    .filter((p) => p.id !== seed.id && distKm(seed, p) <= 30)
    .sort((a, b) => (score(b) - distKm(seed, b) * 0.03) - (score(a) - distKm(seed, a) * 0.03))
    .slice(0, 2)
  const picked = [seed, ...more]

  const indoor = indoors.filter((p) => distKm(seed, p) <= 40).sort((a, b) => distKm(seed, a) - distKm(seed, b))[0]
  if (indoor && (avg >= 5 || picked.length < 3)) picked.push(indoor)

  const center = { lat: picked.reduce((a, p) => a + p.lat, 0) / picked.length, lng: picked.reduce((a, p) => a + p.lng, 0) / picked.length }
  const nearFoods = foods.map((f) => ({ f, d: distKm(center, f) })).sort((a, b) => a.d - b.d)
  const food = (nearFoods.find((o) => /해녀/.test(o.f.title) && o.d <= 15) ?? nearFoods[0])?.f // 영등·해녀 문화와 이어지는 해녀의집 우선
  if (food) picked.push(food)
  return picked.slice(0, MAX_PLACES)
}

// "왜 이 시간에 이곳인지" 한 줄 설명
function reasonFor(s, i, { minW, maxW }) {
  const w = `${s.wind.toFixed(1)}m/s`
  const calm = s.wind <= minW + (maxW - minW) * 0.35
  const strong = s.wind >= maxW - (maxW - minW) * 0.35
  if (s.kind === 'food') {
    if (s.foodNo > 0) return `한 번 더 쉬어 가는 식사·카페 코스예요. (바람 ${w})`
    return Math.abs(s.arrive - LUNCH) <= Math.abs(s.arrive - DINNER) ? `점심 시간대에 맞춰 들르는 곳이에요. (바람 ${w})` : `이른 저녁 시간대에 들르는 곳이에요. (바람 ${w})`
  }
  if (s.kind === 'indoor') {
    return strong ? `바람이 센 시간(${w})이라 실내인 이곳이 편해요.` : `실내라 바람과 상관없이 둘러볼 수 있어요. (바람 ${w})`
  }
  if (isOreum(s.place)) { // 오름은 해안이 아니라 능선·정상의 바람을 말한다
    if (strong) return `바람이 센 시간(${w})이에요. 정상부는 더 셀 수 있으니 능선은 조심하고 방풍 옷차림을 챙기세요.`
    if (calm) return `바람이 약한 시간(${w})이라 오름에 오르기 좋아요. 정상에서는 바람이 조금 더 셀 수 있어요.`
    return `${w}로 적당한 바람이에요. 정상부는 조금 더 셀 수 있어요.`
  }
  if (s.windward) {
    if (calm) return `바람이 비교적 약한 시간(${w})이라 바람 맞는 쪽 해안을 둘러보기 좋아요.`
    if (strong) return `바람 맞는 쪽이라 ${w}로 거셀 수 있어요. 방풍 옷차림을 챙기세요.`
    return `바람 맞는 쪽이에요. 바람은 ${w}로 적당해요.`
  }
  if (s.leeward) return strong ? `바람을 비껴가는 곳이라 바람이 센 시간(${w})에도 비교적 편해요.` : `바람을 비껴가는 곳이에요. (바람 ${w})`
  return i === 0 ? `코스의 시작이에요. (바람 ${w})` : `${w}로 둘러보기 무난한 시간이에요.`
}
