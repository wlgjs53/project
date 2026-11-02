import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Badge, Button, Nav } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import RouteMap from '../components/RouteMap'
import ConfirmButton from '../components/ConfirmButton'
import { ErrorAlert, Loading } from '../components/Status'
import { useAppStore } from '../store/useAppStore'
import { useFavoriteMeta } from '../hooks/useFavoriteMeta'
import { useWindForecast } from '../hooks/useWindForecast'
import { useAutoPool } from '../hooks/useAutoPool'
import { useDistanceMatrix, useRouteLine } from '../hooks/useCourseRoute'
import { fetchNearby } from '../api/client'
import { useFavorites } from '../hooks/useFavorites'
import { KIND_LABEL, MAX_PLACES, autoPick, buildCourse, hhmm, kindOf, pickDay } from '../lib/course'
import { exposureLabel, windLevel } from '../lib/advice'
import { dirName } from '../lib/geo'
import { kakaoRoute, kakaoTo } from '../lib/nav'
import { isOreum } from '../lib/course'

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
        </div>
      ))}
    </div>
  )
}

const toCandidate = (f, m) => (m && !m.failed && Number.isFinite(m.lat) && Number.isFinite(m.lng) && m.lat > 0
  ? { id: f.item_id, title: f.title, type: m.type, lat: m.lat, lng: m.lng, image: m.image, addr: m.subtitle }
  : null)

// 할망따라 — 오늘의 바람에 맞춰 "어디를 어떤 순서로, 어떻게 갈지"를 정해 준다.
//   · 내 즐겨찾기로: 담아 둔 곳들을 바람에 맞는 순서로 엮는다
//   · 오늘의 추천: 즐겨찾기가 없어도 오늘 바람에 맞는 곳을 골라 코스를 만든다
// 이동 시간·거리·경로선은 실제 도로(OSRM) 기준이고, 길안내(내비·대중교통)는 카카오맵으로 이어 준다.
export default function Course() {
  const favorites = useAppStore((s) => s.favorites)
  const favLoading = useAppStore((s) => s.favLoading)
  const toast = useAppStore((s) => s.toast)
  const removeFavorites = useAppStore((s) => s.removeFavorites)
  const { isFav, toggle: toggleFav } = useFavorites()
  const favSource = (p) => (String(p.id).startsWith('o:') ? 'oreum' : 'tour') // 오름 목록의 오름은 oreum, 나머지는 TourAPI 장소
  const setCourseStops = useAppStore((s) => s.setCourseStops)
  const { meta, retry } = useFavoriteMeta(favorites)
  const forecast = useWindForecast()

  const [mode, setMode] = useState(null)      // null = 즐겨찾기가 있으면 "내 즐겨찾기로", 없으면 "오늘의 추천"
  const [area, setArea] = useState('jeju')
  const [variant, setVariant] = useState(0)
  const [theme, setTheme] = useState('wind') // 오늘의 추천 주제: 'wind' 바람 맞춤 / 'oreum' 오름 코스
  const [chosen, setChosen] = useState(null)  // 즐겨찾기 중 코스에 넣을 곳 (null = 처음 6곳)
  const [extras, setExtras] = useState([])    // 추천에서 "코스에 추가"한 곳
  const [active, setActive] = useState(null)
  const cardRefs = useRef([])

  const tourFavs = favorites.filter((f) => f.source === 'tour' || f.source === 'oreum') // 명소·맛집·오름(위치 정보가 있는 것)
  const heritageCount = favorites.length - tourFavs.length // 국가유산은 위치 정보가 없어 코스에 못 넣는다
  const mine = mode ?? (tourFavs.length ? 'mine' : 'auto')

  const day = pickDay(forecast.slots)
  const enoughWind = day.slots.length >= 3

  // 1) 코스에 넣을 장소 정하기
  const candidates = useMemo(() => tourFavs.map((f) => toCandidate(f, meta[`${f.source}:${f.item_id}`])).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favorites, meta])
  // 직접 고른 목록(chosen)이 지금 즐겨찾기와 하나도 안 맞으면(닉네임을 바꿨거나 다 삭제한 경우) 처음 6곳으로 되돌린다. 일부러 전부 해제한 경우([])는 그대로 둔다.
  const known = (id) => candidates.some((c) => c.id === id)
  const picked = chosen === null ? null : chosen.length === 0 ? [] : chosen.some(known) ? chosen.filter(known) : null
  const selIds = picked ?? candidates.slice(0, MAX_PLACES).map((c) => c.id)
  const auto = useAutoPool(area, mine === 'auto')
  const autoPlaces = useMemo(() => (auto.pool && enoughWind ? autoPick({ ...auto.pool, sights: theme === 'oreum' && auto.pool.oreums.length >= 3 ? auto.pool.oreums : auto.pool.sights, slots: day.slots, variant }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auto.pool, enoughWind, variant, theme, forecast.slots])
  const base = mine === 'mine' ? candidates.filter((c) => selIds.includes(c.id)) : autoPlaces
  const places = useMemo(() => {
    const ids = new Set(base.map((p) => p.id))
    return [...base, ...extras.filter((e) => !ids.has(e.id))].slice(0, MAX_PLACES)
  }, [base, extras])

  // 2) 실제 도로 시간으로 순서·시간 정하기 → 3) 그 순서의 경로선
  const { matrix, ready } = useDistanceMatrix(places)
  const course = useMemo(() => (ready && enoughWind ? buildCourse({ places, slots: day.slots, matrix }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [places, ready, matrix, forecast.slots])
  const stops = useMemo(() => course?.steps.map((s) => s.place) ?? [], [course])
  const { line } = useRouteLine(stops)

  // 바람길 지도의 "동선 안내"가 이어서 보여 줄 수 있게 마지막 코스를 기억해 둔다
  useEffect(() => {
    if (stops.length > 1) setCourseStops(stops.map((p) => ({ id: p.id, title: p.title, lat: p.lat, lng: p.lng })))
  }, [stops, setCourseStops])

  // 오늘 코스에 식사할 곳이 없으면 코스 중심 근처의 맛집(사진 있는 곳)을 권한다
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

  function toggle(id) {
    if (selIds.includes(id)) setChosen(selIds.filter((x) => x !== id))
    else if (selIds.length < MAX_PLACES) setChosen([...selIds, id])
  }
  // 삭제 = 즐겨찾기에서 빼기 (Supabase 에서도 지워짐). 선택 삭제는 지금 코스에 체크된 곳들.
  const favOf = (id) => tourFavs.find((f) => f.item_id === String(id))
  const deleteSelected = async () => { await removeFavorites(selIds.map(favOf).filter(Boolean)); setChosen(null) }
  const deleteAll = async () => { await removeFavorites(tourFavs); setChosen(null) }
  const switchMode =(m) => { setMode(m); setExtras([]); setActive(null) }
  const pickFromMap = (i) => { setActive(i); cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  async function copy() {
    const s = course.summary
    const lines = [`할망따라 코스 (${day.label} ${hhmm(s.from)}~${hhmm(s.to)})`,
      ...course.steps.map((st, i) => `${i + 1}. ${hhmm(st.arrive)} ${st.place.title} — ${st.reason}`)]
    try { await navigator.clipboard.writeText(lines.join('\n')); toast('코스를 복사했어요') }
    catch { toast('복사하지 못했어요', 'danger') }
  }

  const pending = mine === 'mine' ? candidates.length < tourFavs.length : false
  const noPlaces = places.length === 0

  return (
    <>
      <PageHeader icon="signpost-split" title="할망따라" subtitle="오늘의 바람에 맞춰, 어디를 어떤 순서로 어떻게 갈지 정해 드려요" />

      {favLoading || forecast.loading ? <Loading /> : (
        <>
          <ErrorAlert error={forecast.error} />

          <Nav variant="pills" className="course-tabs mb-3" activeKey={mine} onSelect={switchMode}>
            <Nav.Item><Nav.Link eventKey="mine"><i className="bi bi-star-fill me-1" />내 즐겨찾기로{tourFavs.length > 0 && <small className="ms-1 opacity-75">{tourFavs.length}</small>}</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="auto"><i className="bi bi-stars me-1" />오늘의 추천</Nav.Link></Nav.Item>
          </Nav>

          {mine === 'mine' && (
            tourFavs.length === 0 ? (
              <Alert variant="secondary">
                {favorites.length ? '국가유산만 담겨 있어요. 코스는 위치 정보가 있는 명소·맛집으로 짤 수 있어요.' : '아직 즐겨찾기가 없어요. 명소·맛집에서 마음에 드는 곳을 ★로 담으면 그 곳들로 코스를 짜 드려요.'}
                <div className="mt-2 d-flex gap-2">
                  <Link to="/places" className="btn btn-primary btn-sm">명소·맛집 보러 가기</Link>
                  <Button size="sm" variant="outline-secondary" onClick={() => switchMode('auto')}>오늘의 추천 보기</Button>
                </div>
              </Alert>
            ) : (
              <div className="mb-3">
                <div className="small text-muted mb-2">코스에 넣을 곳을 골라 보세요 (최대 {MAX_PLACES}곳)</div>
                <div className="d-flex flex-wrap gap-2">
                  {candidates.map((c) => {
                    const on = selIds.includes(c.id)
                    return (
                      <button key={c.id} type="button" className={`course-chip ${on ? 'on' : ''}`} disabled={!on && selIds.length >= MAX_PLACES} onClick={() => toggle(c.id)}>
                        {c.image && <img src={c.image} alt="" />}
                        <span>{c.title}</span>
                        {on && <i className="bi bi-check-lg" />}
                      </button>
                    )
                  })}
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3">
                  <ConfirmButton label={`선택한 ${selIds.length}곳 삭제`} question={`선택한 ${selIds.length}곳을 즐겨찾기에서 삭제할까요?`} disabled={!selIds.length} onConfirm={deleteSelected} />
                  <ConfirmButton label="전체 삭제" question={`즐겨찾기 ${tourFavs.length}곳을 모두 삭제할까요?`} onConfirm={deleteAll} />
                </div>
                {pending && (
                  tourFavs.some((f) => meta[`${f.source}:${f.item_id}`]?.failed)
                    ? <div className="small text-warning mt-2">일부 장소의 위치를 불러오지 못했어요. <Button variant="link" size="sm" className="p-0 align-baseline" onClick={retry}>다시 불러오기</Button></div>
                    : <div className="small text-muted mt-2">위치 정보를 불러오는 중…</div>
                )}
                {heritageCount > 0 && <div className="small text-muted mt-2">국가유산 {heritageCount}곳은 위치 정보가 없어 코스에서 제외했어요.</div>}
              </div>
            )
          )}

          {mine === 'auto' && (
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              {[['jeju', '제주시 쪽'], ['seogwipo', '서귀포시 쪽']].map(([k, label]) => (
                <button key={k} type="button" className={`course-chip ${area === k ? 'on' : ''}`} onClick={() => { setArea(k); setVariant(0); setExtras([]) }}><span>{label}</span></button>
              ))}
              <span className="vr mx-1" />
              {[['wind', '바람 맞춤'], ['oreum', '오름 코스']].map(([k, label]) => (
                <button key={k} type="button" className={`course-chip ${theme === k ? 'on' : ''}`} onClick={() => { setTheme(k); setVariant(0); setExtras([]) }}><span>{label}</span></button>
              ))}
              <Button variant="outline-primary" size="sm" className="ms-auto" disabled={auto.loading} onClick={() => { setVariant((v) => v + 1); setExtras([]) }}>
                <i className="bi bi-shuffle me-1" />다른 코스
              </Button>
            </div>
          )}

          {mine === 'auto' && auto.loading && <Loading />}
          {mine === 'auto' && <ErrorAlert error={auto.error} />}
          {!forecast.error && !enoughWind && !noPlaces && <Alert variant="warning">코스를 짤 만큼의 예보가 아직 없어요. 잠시 뒤 다시 열어 보세요.</Alert>}
          {!noPlaces && enoughWind && !course && <Loading />}

          {course && (
            <>
              <div className="course-summary rounded-3 p-3 mb-3">
                <div className="d-flex flex-wrap align-items-baseline gap-x-3 gap-2">
                  <span className="fw-bold fs-5">{day.label} {hhmm(course.summary.from)} ~ {hhmm(course.summary.to)}</span>
                  <span className="text-muted">{course.steps.length}곳 · 차로 약 {course.summary.driveMin}분 ({course.summary.totalKm.toFixed(0)}km)</span>
                </div>
                <div className="small text-muted mt-1">
                  바람 {course.summary.minW.toFixed(1)}~{course.summary.maxW.toFixed(1)}m/s · {dirName(course.summary.windDir)}풍
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
                            <button type="button" className={`course-star${isFav(favSource(s.place), s.place.id) ? ' on' : ''}`} aria-label="즐겨찾기" title="즐겨찾기에 담기"
                              onClick={(e) => { e.stopPropagation(); toggleFav({ source: favSource(s.place), id: s.place.id, title: s.place.title }) }}>
                              <i className={`bi bi-star${isFav(favSource(s.place), s.place.id) ? '-fill' : ''}`} />
                            </button>
                            {s.place.image && <img src={s.place.image} alt="" loading="lazy" />}
                            <div className="course-body">
                              <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
                                <b>{hhmm(s.arrive)}</b><small className="text-muted me-1">~{hhmm(s.depart)}</small>
                                <Badge bg={isOreum(s.place) ? 'success' : 'secondary'}>{isOreum(s.place) ? '오름' : KIND_LABEL[s.kind]}</Badge>
                                {s.kind === 'sight' && exposureLabel(s.e) && <Badge bg={s.e > 0 ? 'warning' : 'info'} text="dark">{exposureLabel(s.e)}</Badge>}
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
          )}
        </>
      )}
    </>
  )
}
