import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Badge, Button, Form } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { ErrorAlert, Loading } from '../components/Status'
import { useAppStore } from '../store/useAppStore'
import { useFavoriteMeta } from '../hooks/useFavoriteMeta'
import { useWindForecast } from '../hooks/useWindForecast'
import { KIND_LABEL, MAX_PLACES, buildCourse, hhmm, kindOf, pickDay } from '../lib/course'
import { exposureLabel, windLevel } from '../lib/advice'
import { dirName } from '../lib/geo'

// 시간대별 풍속 막대. 코스에서 각 곳에 도착하는 시각 아래에 순서 번호를 붙인다.
function WindBars({ slots, steps }) {
  const maxV = Math.max(10, ...slots.map((s) => s.speed))
  const visits = new Map()
  steps?.forEach((st, i) => {
    const h = Math.floor(st.arrive / 60)
    visits.set(h, [...(visits.get(h) ?? []), i + 1])
  })
  return (
    <>
      <div className="course-bars">
        {slots.map((s) => (
          <div key={s.time} className={`course-bar ${windLevel(s.speed)}`}>
            <span className="v">{s.speed.toFixed(1)}</span>
            <div className="fill" style={{ height: `${Math.max(8, (s.speed / maxV) * 88)}px` }} />
            <small>{s.hour}시</small>
            <div className="visit">{(visits.get(s.hour) ?? []).map((n) => <span key={n} className="dot">{n}</span>)}</div>
          </div>
        ))}
      </div>
      <div className="small text-muted mt-2 d-flex flex-wrap gap-3">
        <span><i className="course-sw calm" /> 잔잔 5 미만</span>
        <span><i className="course-sw normal" /> 보통 5~10</span>
        <span><i className="course-sw strong" /> 강함 10 이상 (m/s)</span>
      </div>
    </>
  )
}

// 바람따라 — 즐겨찾기한 곳들을 시간대별 바람에 맞춰 하루 코스로 엮어 준다 (규칙 기반)
export default function Course() {
  const favorites = useAppStore((s) => s.favorites)
  const favLoading = useAppStore((s) => s.favLoading)
  const toast = useAppStore((s) => s.toast)
  const { meta, retry } = useFavoriteMeta(favorites)
  const forecast = useWindForecast()
  const [chosen, setChosen] = useState(null) // null = 처음 6곳 자동 선택

  const tourFavs = favorites.filter((f) => f.source === 'tour')
  const heritageCount = favorites.length - tourFavs.length // 국가유산은 위치 정보가 없어 코스에 못 넣는다
  const candidates = tourFavs.map((f) => {
    const m = meta[`tour:${f.item_id}`]
    return m && !m.failed && Number.isFinite(m.lat) && Number.isFinite(m.lng) && m.lat > 0
      ? { id: f.item_id, title: f.title, type: m.type, lat: m.lat, lng: m.lng, image: m.image, addr: m.subtitle }
      : null
  }).filter(Boolean)
  const selIds = chosen ?? candidates.slice(0, MAX_PLACES).map((c) => c.id)
  const places = candidates.filter((c) => selIds.includes(c.id))

  const day = pickDay(forecast.slots)
  const course = buildCourse({ places, slots: day.slots })

  function toggle(id) {
    if (selIds.includes(id)) setChosen(selIds.filter((x) => x !== id))
    else if (selIds.length < MAX_PLACES) setChosen([...selIds, id])
  }

  async function copy() {
    const s = course.summary
    const lines = [`바람따라 코스 (${day.label} ${hhmm(s.from)}~${hhmm(s.to)})`,
      ...course.steps.map((st, i) => `${i + 1}. ${hhmm(st.arrive)} ${st.place.title} — ${st.reason}`)]
    try { await navigator.clipboard.writeText(lines.join('\n')); toast('코스를 복사했어요') }
    catch { toast('복사하지 못했어요', 'danger') }
  }

  return (
    <>
      <PageHeader icon="signpost-split" title="바람따라" subtitle="즐겨찾기한 곳을 오늘의 바람에 맞춰 시간대별 하루 코스로 엮어 드려요" />

      {favLoading || forecast.loading ? <Loading /> : (
        <>
          <ErrorAlert error={forecast.error} />

          {favorites.length === 0 && (
            <Alert variant="secondary">
              아직 즐겨찾기가 없어요. 명소·맛집에서 마음에 드는 곳을 ★로 담으면 그 곳들로 코스를 짜 드려요.
              <div className="mt-2"><Link to="/places" className="btn btn-primary btn-sm">명소·맛집 보러 가기</Link></div>
            </Alert>
          )}
          {favorites.length > 0 && tourFavs.length === 0 && (
            <Alert variant="secondary">
              국가유산만 담겨 있어요. 코스는 위치 정보가 있는 명소·맛집으로 짤 수 있어요.
              <div className="mt-2"><Link to="/places" className="btn btn-primary btn-sm">명소·맛집 보러 가기</Link></div>
            </Alert>
          )}

          {tourFavs.length > 0 && (
            <>
              <h6 className="fw-bold mt-2">코스에 넣을 곳 <small className="text-muted fw-normal">(최대 {MAX_PLACES}곳)</small></h6>
              <div className="d-flex flex-column gap-1 mb-3">
                {candidates.map((c) => {
                  const on = selIds.includes(c.id)
                  return (
                    <Form.Check key={c.id} type="checkbox" id={`pick-${c.id}`} checked={on} disabled={!on && selIds.length >= MAX_PLACES}
                      onChange={() => toggle(c.id)}
                      label={<>{c.title} <Badge bg="secondary" className="ms-1">{KIND_LABEL[kindOf(c.type)]}</Badge></>} />
                  )
                })}
                {candidates.length < tourFavs.length && (
                  tourFavs.some((f) => meta[`tour:${f.item_id}`]?.failed)
                    ? <span className="small text-warning">일부 장소의 위치를 불러오지 못했어요. <Button variant="link" size="sm" className="p-0 align-baseline" onClick={retry}>다시 불러오기</Button></span>
                    : <span className="small text-muted">위치 정보를 불러오는 중…</span>
                )}
              </div>
              {heritageCount > 0 && <p className="small text-muted">국가유산 {heritageCount}곳은 위치 정보가 없어 코스에서 제외했어요.</p>}
            </>
          )}

          {!forecast.error && day.slots.length < 3 && tourFavs.length > 0 && (
            <Alert variant="warning">코스를 짤 만큼의 예보가 아직 없어요. 잠시 뒤 다시 열어 보세요.</Alert>
          )}

          {course && (
            <>
              <div className="rounded-3 p-3 mb-3 course-summary">
                <div className="fw-bold">{day.label} {hhmm(course.summary.from)} ~ {hhmm(course.summary.to)}</div>
                <div className="small text-muted">
                  {course.steps.length}곳 · 이동 약 {course.summary.totalKm.toFixed(1)}km · 바람 {course.summary.minW.toFixed(1)}~{course.summary.maxW.toFixed(1)}m/s ({dirName(course.summary.windDir)}풍)
                </div>
              </div>
              {course.summary.overtime && <Alert variant="warning" className="py-2">예보가 있는 시간(저녁 7시경)을 넘기는 코스예요. 곳 수를 줄여 보세요.</Alert>}

              <h6 className="fw-bold">{day.label}의 시간대별 바람</h6>
              <WindBars slots={day.slots} steps={course.steps} />

              <h6 className="fw-bold mt-4">추천 코스</h6>
              <ol className="course-steps">
                {course.steps.map((s, i) => (
                  <li key={s.place.id}>
                    {i > 0 && <div className="course-leg">↓ 이동 약 {s.travel}분 · {s.km.toFixed(1)}km (직선거리 기준 대략)</div>}
                    <div className="course-card">
                      <div className="course-time"><b>{hhmm(s.arrive)}</b><small>~{hhmm(s.depart)}</small></div>
                      {s.place.image && <img src={s.place.image} alt="" loading="lazy" />}
                      <div className="course-body">
                        <div className="d-flex flex-wrap gap-1 mb-1">
                          <Badge bg="primary">{i + 1}</Badge>
                          <Badge bg="secondary">{KIND_LABEL[s.kind]}</Badge>
                          {s.kind === 'sight' && exposureLabel(s.e) && <Badge bg={s.e > 0 ? 'warning' : 'info'} text="dark">{exposureLabel(s.e)}</Badge>}
                          <Badge bg="dark" className="border">바람 {s.wind.toFixed(1)}m/s</Badge>
                        </div>
                        <div className="fw-bold">{s.place.title}</div>
                        {s.place.addr && <div className="small text-muted">{s.place.addr}</div>}
                        <p className="course-reason mb-0">{s.reason}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <Button variant="outline-primary" size="sm" onClick={copy}><i className="bi bi-clipboard me-1" />코스 복사</Button>
                <Link to="/" className="btn btn-outline-secondary btn-sm"><i className="bi bi-wind me-1" />바람길 지도 보기</Link>
              </div>
              <p className="small text-muted mt-3 mb-0">
                이동 시간은 두 곳 사이 직선거리로 어림한 값이라 실제와 다를 수 있어요. 영업시간·휴무는 반영하지 않았으니 각 장소의 상세 정보에서 확인해 주세요.
                바람은 기상청 단기예보(제주시·서귀포시 평균)이며, "바람 맞는 쪽·비낀 쪽"은 한라산을 기준으로 한 단순 판정이에요.
              </p>
            </>
          )}
        </>
      )}
    </>
  )
}
