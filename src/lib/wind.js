// 지금(또는 가장 가까운 예보 시각)의 바람 { speed, dir } — useWindForecast 의 slots 에서 고른다
export function currentWind(slots) {
  if (!slots.length) return null
  const kst = new Date(Date.now() + 9 * 3600e3).toISOString()
  const now = kst.slice(0, 10).replaceAll('-', '') + ' ' + kst.slice(11, 13) + '00'
  const s = slots.filter((x) => x.time <= now).at(-1) ?? slots[0]
  return { speed: s.speed, dir: s.dir }
}
