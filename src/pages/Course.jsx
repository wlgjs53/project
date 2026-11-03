import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import CourseResult from '../components/CourseResult'
import { ErrorAlert, Loading } from '../components/Status'
import { useWindForecast } from '../hooks/useWindForecast'
import { useAutoPool } from '../hooks/useAutoPool'
import { autoPick, pickDay } from '../lib/course'

// 할망따라 — 오늘의 바람에 맞춰 "어디를 어떤 순서로, 어떻게 갈지"를 추천해 준다. (즐겨찾기와는 따로 — 내가 담은 곳으로 코스를 만들려면 내 즐겨찾기에서)
//   · 바람 맞춤: 오늘 바람에 맞는 명소·문화시설·식당(해녀의집 우선)
//   · 오름 코스: 사진이 있는 오름 위주
// "다른 코스"로 다른 시작 장소의 코스를 볼 수 있고, 마음에 드는 곳은 카드의 ★로 담을 수 있다.
export default function Course() {
  const forecast = useWindForecast()
  const [area, setArea] = useState('jeju')
  const [theme, setTheme] = useState('wind') // 'wind' 바람 맞춤 / 'oreum' 오름 코스
  const [variant, setVariant] = useState(0)

  const day = useMemo(() => pickDay(forecast.slots), [forecast.slots])
  const enoughWind = day.slots.length >= 3
  const auto = useAutoPool(area, true)
  const places = useMemo(() => (auto.pool && enoughWind
    ? autoPick({ ...auto.pool, sights: theme === 'oreum' && auto.pool.oreums.length >= 3 ? auto.pool.oreums : auto.pool.sights, slots: day.slots, variant })
    : []), [auto.pool, enoughWind, theme, variant, day.slots])

  return (
    <>
      <PageHeader icon="signpost-split" title="할망따라" subtitle="영등할망의 길을 따라, 오늘의 바람에 맞는 하루 코스를 추천해 드려요" />

      {forecast.loading ? <Loading /> : (
        <>
          <ErrorAlert error={forecast.error} />

          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            {[['jeju', '제주시 쪽'], ['seogwipo', '서귀포시 쪽']].map(([k, label]) => (
              <button key={k} type="button" className={`course-chip ${area === k ? 'on' : ''}`} onClick={() => { setArea(k); setVariant(0) }}><span>{label}</span></button>
            ))}
            <span className="vr mx-1" />
            {[['wind', '바람 맞춤'], ['oreum', '오름 코스']].map(([k, label]) => (
              <button key={k} type="button" className={`course-chip ${theme === k ? 'on' : ''}`} onClick={() => { setTheme(k); setVariant(0) }}><span>{label}</span></button>
            ))}
            <Button variant="outline-primary" size="sm" className="ms-auto" disabled={auto.loading} onClick={() => setVariant((v) => v + 1)}>
              <i className="bi bi-shuffle me-1" />다른 코스
            </Button>
          </div>

          {auto.loading && <Loading />}
          <ErrorAlert error={auto.error} />

          <CourseResult key={`${area}-${theme}-${variant}`} places={places} slots={forecast.slots} />

          <p className="small text-muted mt-3">
            마음에 드는 곳은 카드의 ★로 담아 두세요. 담아 둔 곳으로 나만의 코스를 짜려면{' '}
            <Link to="/my">내 즐겨찾기</Link>에서 만들 수 있어요.
          </p>
        </>
      )}
    </>
  )
}
