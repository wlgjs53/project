// 지금(또는 가장 가까운 예보 시각)의 바람 { speed, dir } — useWindForecast 의 slots 에서 고른다
export function currentWind(slots) {
  if (!slots.length) return null
  const kst = new Date(Date.now() + 9 * 3600e3).toISOString()
  const now = kst.slice(0, 10).replaceAll('-', '') + ' ' + kst.slice(11, 13) + '00'
  const s = slots.filter((x) => x.time <= now).at(-1) ?? slots[0]
  return { speed: s.speed, dir: s.dir, pop: s.pop, rainMm: s.rainMm, pcp: s.pcp, type: s.rain }
}

// 비 정보 해석: rain = { pop(강수확률 %), rainMm(시간당 강수량 mm), pcp(기상청 원문), type('없음'|'비'|…) }
// level: dry(비 걱정 없음) / chance(비가 올 수 있음) / wet(비 예상) — 오름·해안 같은 야외 장소를 권할 때 쓴다.
export function rainInfo(rain) {
  if (!rain) return null
  const pop = rain.pop ?? 0, mm = rain.rainMm ?? 0
  const raining = (rain.type && rain.type !== '없음') || mm >= 1
  const level = raining || pop >= 60 ? 'wet' : pop >= 30 || mm > 0 ? 'chance' : 'dry'
  const text = `강수확률 ${pop}%${mm > 0 ? ` · 시간당 ${rain.pcp}` : ''}`
  const tip = level === 'wet' ? '비가 올 가능성이 높아요. 야외 오름·해안은 미끄럽고 시야가 나쁠 수 있어 실내 장소도 함께 고려하세요.'
    : level === 'chance' ? '비가 올 수 있어요. 우산이나 방수 재킷을 챙기세요.' : '비 걱정 없는 날씨예요.'
  return { level, text, tip }
}
