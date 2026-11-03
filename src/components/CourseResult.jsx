import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Badge, Button } from 'react-bootstrap'
import RouteMap from './RouteMap'
import FavStar from './FavStar'
import { Loading } from './Status'
import { useAppStore } from '../store/useAppStore'
import { useFavorites } from '../hooks/useFavorites'
import { useDistanceMatrix, useRouteLine } from '../hooks/useCourseRoute'
import { fetchNearby } from '../api/client'
import { KIND_LABEL, MAX_PLACES, buildCourse, hhmm, isOreum, kindOf, pickDay } from '../lib/course'
import { exposureLabel, windLevel } from '../lib/advice'
import { dirName } from '../lib/geo'
import { kakaoRoute, kakaoTo } from '../lib/nav'

// 시간대별 풍속 막대. 코스에서 각 곳에 도착하는 시각 아래에 순서 번호를 붙인다.
function WindBars({ slots, steps }) {
  const maxV = Math.max(10, ...slots.map((s) => s.speed))
  const visits = new Map()
  steps?.forEach((st, i) => {
    const h = Math.floor(st.arrive / 60)
    visits.set(h, [...(visits.get(h) ?? []), i + 1])
  })
  return (
    <div className="course-bars">
      {slots.map((s) => (
        <div key={s.time} className={`course-bar ${windLevel(s.speed)}`}>
          <span className="v">{s.speed.toFixed(1)}</span>
          <div className="fill" style={{ height: `${Math.max(6, (s.speed / maxV) * 56)}px` }} />
          <small>{s.hour}시</small>
          <div className="visit">{(visits.get(s.hour) ?? []).map((n) => <span key={n} className="dot">{n}</span>)}</div>
          <span className={`pop${(s.pop ?? 0) >= 60 ? ' high' : ''}`}>{(s.pop ?? 0) >= 30 ? `${s.pop}%` : ''}</span>
        </div>
      ))}
    </div>
  )
}

const favSource = (p) => (String(p.id).startsWith('o:') ? 'oreum' : 'tour') // 오름 목록의 오름은 oreum, 나머지는 TourAPI 장소

// 코스 결과 화면 (할망따라의 추천 코스와 내 즐겨찾기의 "코스 만들기"가 함께 쓴다):
// places(장소 목록)를 오늘의 바람(slots)에 맞춰 순서·시간을 정하고, 실제 도로 시간·경로선·길안내 링크와 함께 보여 준다.
// 이동 시간·거리·경로선은 실제 도로(OSRM) 기준이고, 길안내(내비·대중교통)는 카카오맵으로 이어 준다.
// places 가 바뀌면 부모가 key 를 바꿔 다시 만든다 ("코스에 추가"한 곳 초기화).
export default function CourseResult({ places: base, slots }) {
  const toast = useAppStore((s) => s.toast)
  const setCourseStops = useAppStore((s) => s.setCourseStops)
  const { isFav, toggle: toggleFav } = useFavorites()
  const [extras, setExtras] = useState([]) // "코스 근처 맛집"에서 "코스에 추가"한 곳
  const [active, setActive] = useState(null)
  const cardRefs = useRef([])

  const day = useMemo(() => pickDay(slots), [slots])
  const enoughWind = day.slots.length >= 3
  const places = useMemo(() => {
    const ids = new Set(base.map((p) => p.id))
    return [...base, ...extras.filter((e) => !ids.has(e.id))].slice(0, MAX_PLACES)
  }, [base, extras])

  // 실제 도로 시간으로 순서·시간 정하기 → 그 순서의 경로선
  const { matrix, ready } = useDistanceMatrix(places)
  const course = useMemo(() => (ready && enoughWind ? buildCourse({ places, slots: day.slots, matrix }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [places, ready, matrix, slots])
  const stops = useMemo(() => course?.steps.map((s) => s.place) ?? [], [course])
  const { line } = useRouteLine(stops)

  // 바람길 지도의 "동선 안내"가 이어서 보여 줄 수 있게 마지막 코스를 기억해 둔다
  useEffect(() => {
    if (stops.length > 1) setCourseStops(stops.map((p) => ({ id: p.id, title: p.title, lat: p.lat, lng: p.lng })))
  }, [stops, setCourseStops])

  // 코스에 식사할 곳이 없으면 코스 중심 근처의 맛집(사진 있는 곳)을 권한다
  const hasFood = stops.some((p) => kindOf(p.type) === 'food')
  const [foodTips, setFoodTips] = useState({ k: '', items: [] })
  const center = stops.length ? { lat: stops.reduce((a, p) => a + p.lat, 0) / stops.length, lng: stops.reduce((a, p) => a + p.lng, 0) / stops.length } : null
  const tipKey = center && !hasFood ? `${center.lat.toFixed(3)},${center.lng.toFixed(3)}` : ''
  useEffect(() => {
    if (!tipKey) return
    let alive = true
    const [lat, lng] = tipKey.split(',').map(Number)
    fetchNearby({ lat, lng, type: '39', radius: 8000, rows: 12 })
      .then((r) => alive && setFoodTips({ k: tipKey, items: (r.items ?? r).filter((p) => p.image).slice(0, 2) }))
      .catch(() => alive && setFoodTips({ k: tipKey, items: [] }))
    return () => { alive = false }
  }, [tipKey])
  const tips = tipKey && foodTips.k === tipKey ? foodTips.items : []

  const pickFromMap = (i) => { setActive(i); cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  async function copy() {
    const s = course.summary
    const lines = [`할망따라 코스 (${day.label} ${hhmm(s.from)}~${hhmm(s.to)})`,
      ...course.steps.map((st, i) => `${i + 1}. ${hhmm(st.arrive)} ${st.place.title} — ${st.reason}`)]
    try { await navigator.clipboard.writeText(lines.join('\n')); toast('코스를 복사했어요') }
    catch { toast('복사하지 못했어요', 'danger') }
  }

  if (!places.length) return null
  if (!enoughWind) return <Alert variant="warning">코스를 짤 만큼의 예보가 아직 없어요. 잠시 뒤 다시 열어 보세요.</Alert>
  if (!course) return <Loading text="코스를 만드는 중..." />

  return (
    <>
      <div className="course-summary rounded-3 p-3 mb-3">
        <div className="d-flex flex-wrap align-items-baseline gap-x-3 gap-2">
          <span className="fw-bold fs-5">{day.label} {hhmm(course.summary.from)} ~ {hhmm(course.summary.to)}</span>
          <span className="text-muted">{course.steps.length}곳 · 차로 약 {course.summary.driveMin}분 ({course.summary.totalKm.toFixed(0)}km)</span>
        </div>
        <div className="small text-muted mt-1">
          바람 {course.summary.minW.toFixed(1)}~{course.summary.maxW.toFixed(1)}m/s · {dirName(course.summary.windDir)}풍
          {' · '}<i className="bi bi-cloud-rain me-1" />강수확률 최대 {course.summary.maxPop}%{course.summary.rainTotal > 0 && ` · 예상 강수 약 ${course.summary.rainTotal}mm`}
        </div>
        <WindBars slots={day.slots} steps={course.steps} />
      </div>
      {course.summary.overtime && <Alert variant="warning" className="py-2">예보가 있는 시간(저녁 7시경)을 넘기는 코스예요. 곳 수를 줄여 보세요.</Alert>}

      <div className="course-layout">
        <div className="course-map-col">
          <RouteMap stops={stops} line={line} activeIdx={active} onPick={pickFromMap} />
        </div>

        <div className="course-list-col">
          <ol className="course-steps">
            {course.steps.map((s, i) => {
              const prev = course.steps[i - 1]?.place
              return (
                <li key={s.place.id}>
                  {prev && (
                    <div className="course-leg">
                      <span><i className="bi bi-car-front me-1" />{s.travel}분 · {s.km.toFixed(1)}km</span>
                      <span className="course-links">
                        <a href={kakaoRoute('car', prev, s.place)} target="_blank" rel="noreferrer">자동차</a>
                        <a href={kakaoRoute('traffic', prev, s.place)} target="_blank" rel="noreferrer">대중교통</a>
                        <a href={kakaoRoute('walk', prev, s.place)} target="_blank" rel="noreferrer">도보</a>
                      </span>
                    </div>
                  )}
                  <div ref={(el) => { cardRefs.current[i] = el }} className={`course-card ${active === i ? 'active' : ''}`} onClick={() => setActive(i)}>
                    <span className="course-no">{i + 1}</span>
                    <FavStar saved={isFav(favSource(s.place), s.place.id)} onToggle={() => toggleFav({ source: favSource(s.place), id: s.place.id, title: s.place.title })} />
                    {s.place.image && <img src={s.place.image} alt="" loading="lazy" />}
                    <div className="course-body">
                      <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
                        <b>{hhmm(s.arrive)}</b><small className="text-muted me-1">~{hhmm(s.depart)}</small>
                        <Badge bg={isOreum(s.place) ? 'success' : 'secondary'}>{isOreum(s.place) ? '오름' : KIND_LABEL[s.kind]}</Badge>
                        {s.kind === 'sight' && exposureLabel(s.e) && <Badge bg={s.e > 0 ? 'warning' : 'info'} text="dark">{exposureLabel(s.e)}</Badge>}
                        {s.pop >= 50 && <Badge bg="primary"><i className="bi bi-cloud-rain me-1" />강수 {s.pop}%</Badge>}
                      </div>
                      <div className="fw-bold">{s.place.title}</div>
                      {s.place.addr && <div className="small text-muted">{s.place.addr}</div>}
                      <p className="course-reason mb-0">{s.reason}</p>
                      {i === 0 && <a className="btn btn-outline-primary btn-sm mt-2" href={kakaoTo(s.place)} target="_blank" rel="noreferrer"><i className="bi bi-cursor me-1" />내 위치에서 길찾기</a>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {tips.length > 0 && places.length < MAX_PLACES && (
            <div className="course-tip mt-3">
              <div className="small fw-bold mb-2"><i className="bi bi-egg-fried me-1" />코스 근처 맛집, 어떠세요?</div>
              {tips.map((p) => (
                <div key={p.id} className="d-flex align-items-center gap-2 mb-2">
                  <img src={p.thumb || p.image} alt="" />
                  <div className="flex-grow-1 min-w-0"><div className="fw-bold text-truncate">{p.title}</div><div className="small text-muted text-truncate">{p.addr}</div></div>
                  <Button size="sm" variant="outline-primary" onClick={() => setExtras((x) => [...x, { id: p.id, title: p.title, type: '39', lat: p.lat, lng: p.lng, image: p.image, addr: p.addr }])}>코스에 추가</Button>
                </div>
              ))}
            </div>
          )}

          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button variant="outline-primary" size="sm" onClick={copy}><i className="bi bi-clipboard me-1" />코스 복사</Button>
            <Link to="/?route=course" className="btn btn-outline-secondary btn-sm"><i className="bi bi-wind me-1" />바람길 지도에서 동선 보기</Link>
          </div>
        </div>
      </div>

      <p className="small text-muted mt-3 mb-0">
        {course.estimated
          ? '도로 정보를 불러오지 못해 두 곳 사이 직선거리로 어림했어요. 실제 시간과 다를 수 있어요. '
          : '이동 시간·거리·경로선은 실제 도로(OSRM) 기준 자동차 값이에요. '}
        길안내(내비·대중교통·도보)는 카카오맵으로 이어져요. 영업시간·휴무는 반영하지 않았으니 각 장소의 상세 정보에서 확인해 주세요.
        바람은 기상청 단기예보(제주시·서귀포시 평균)이며, "바람 맞는 쪽·비낀 쪽"은 한라산을 기준으로 한 단순 판정이에요.
      </p>
    </>
  )
}
