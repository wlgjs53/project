import { useWindForecast } from '../hooks/useWindForecast'
import { windLevel } from '../lib/advice'
import { dirName } from '../lib/geo'
import { currentWind } from '../lib/wind'
import RainNote from './RainNote'

const LEVEL = { calm: '잔잔', normal: '보통', strong: '강함' }

// 카테고리 화면 오른쪽(장바구니 아래)의 "오늘의 날씨": 야외 장소는 바람과 비에 영향이 커서 늘 보이게 둔다.
// 지금 바람·강수확률(+조언)과 앞으로 6시간의 강수확률을 보여 준다. (기상청 단기예보, 제주시·서귀포시 평균)
// compact: 좁은 화면용 한 줄 요약
export default function WeatherCard({ compact = false }) {
  const { loading, error, slots } = useWindForecast()
  const now = currentWind(slots)

  if (loading) return compact ? null : <div className="weather-card small text-muted">날씨 불러오는 중…</div>
  if (error || !now) return compact ? null : <div className="weather-card small text-muted">날씨를 불러오지 못했어요.</div>

  if (compact) {
    return (
      <div className="weather-compact">
        <i className="bi bi-cloud-rain me-1" />강수확률 {now.pop}% · {dirName(now.dir)}풍 {now.speed.toFixed(1)}m/s
      </div>
    )
  }

  // 지금 시각부터 6시간
  const kst = new Date(Date.now() + 9 * 3600e3).toISOString()
  const nowKey = kst.slice(0, 10).replaceAll('-', '') + ' ' + kst.slice(11, 13) + '00'
  const start = Math.max(0, slots.findIndex((s) => s.time >= nowKey))
  const next = slots.slice(start, start + 6)

  return (
    <div className="weather-card">
      <div className="fw-bold mb-2"><i className="bi bi-cloud-sun me-1" />오늘의 날씨 <small className="text-muted fw-normal">제주시·서귀포시</small></div>
      <div className="d-flex align-items-baseline gap-2 mb-2">
        <span className="fs-4 fw-bold">{now.speed.toFixed(1)}<small className="fs-6 fw-normal text-muted">m/s</small></span>
        <span className="small text-muted">{dirName(now.dir)}풍 · 바람 {LEVEL[windLevel(now.speed)]}</span>
      </div>
      <RainNote rain={now} />
      <div className="small text-muted mt-3 mb-1">앞으로 6시간 강수확률</div>
      <div className="weather-hours">
        {next.map((s) => (
          <div key={s.time} className={`h${s.pop >= 60 ? ' high' : s.pop >= 30 ? ' mid' : ''}`}>
            <span className="p">{s.pop}%</span>
            <i style={{ height: `${Math.max(4, s.pop * 0.36)}px` }} />
            <span className="t">{s.hour}시</span>
          </div>
        ))}
      </div>
    </div>
  )
}
