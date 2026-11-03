import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Col, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import ConfirmButton from '../components/ConfirmButton'
import CourseResult from '../components/CourseResult'
import { Empty, Loading } from '../components/Status'
import { useAppStore } from '../store/useAppStore'
import { useFavoriteMeta } from '../hooks/useFavoriteMeta'
import { useWindForecast } from '../hooks/useWindForecast'
import { exposure, exposureLabel } from '../lib/advice'
import { MAX_PLACES } from '../lib/course'
import { dirName } from '../lib/geo'
import { currentWind } from '../lib/wind'

// 내 즐겨찾기 = 담아 둔 곳 + 그 곳들로 나만의 하루 코스 만들기. 종류별로 묶어 보여 주고, 오늘 바람 기준 표시를 단다.
const GROUPS = [
  { key: 'sight', title: '명소·문화시설', icon: 'geo-alt' },
  { key: 'oreum', title: '오름', icon: 'triangle' },
  { key: 'food', title: '맛집', icon: 'egg-fried' },
  { key: 'heritage', title: '국가유산', icon: 'bank' },
]
// 저장된 출처(+TourAPI 분류) → 묶음. 분류를 아직 못 불러왔으면 명소로 둔다.
const groupOf = (f, m) => (f.source === 'oreum' ? 'oreum' : f.source === 'heritage' ? 'heritage' : m?.type === '39' ? 'food' : 'sight')

// 즐겨찾기 한 줄 + 불러온 정보(위치·사진) → 코스에 넣을 장소 (위치를 못 불러왔으면 null)
const toCandidate = (f, m) => (m && !m.failed && Number.isFinite(m.lat) && Number.isFinite(m.lng) && m.lat > 0
  ? { id: f.item_id, title: f.title, type: m.type, lat: m.lat, lng: m.lng, image: m.image, addr: m.subtitle }
  : null)

export default function My() {
  const { nickname, favorites, favLoading, loadFavorites, removeFavorite, removeFavorites } = useAppStore()
  const { meta, retry } = useFavoriteMeta(favorites)
  const forecast = useWindForecast()
  const wind = currentWind(forecast.slots)
  const [chosen, setChosen] = useState(null) // 코스에 넣을 곳 (null = 처음 6곳)

  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])

  const metaOf = (f) => meta[`${f.source}:${f.item_id}`]
  const grouped = GROUPS.map((g) => ({ ...g, items: favorites.filter((f) => groupOf(f, metaOf(f)) === g.key) })).filter((g) => g.items.length)
  const placeFavs = favorites.filter((f) => f.source !== 'heritage') // 위치 정보가 있어 코스에 쓸 수 있는 곳 (명소·맛집·오름)
  const heritageCount = favorites.length - placeFavs.length

  // 코스에 넣을 곳 고르기
  const candidates = useMemo(() => placeFavs.map((f) => toCandidate(f, meta[`${f.source}:${f.item_id}`])).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favorites, meta])
  // 직접 고른 목록(chosen)이 지금 즐겨찾기와 하나도 안 맞으면(닉네임을 바꿨거나 다 삭제한 경우) 처음 6곳으로 되돌린다. 일부러 전부 해제한 경우([])는 그대로 둔다.
  const known = (id) => candidates.some((c) => c.id === id)
  const picked = chosen === null ? null : chosen.length === 0 ? [] : chosen.some(known) ? chosen.filter(known) : null
  const selIds = picked ?? candidates.slice(0, MAX_PLACES).map((c) => c.id)
  const selected = useMemo(() => candidates.filter((c) => selIds.includes(c.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidates, selIds.join('|')])
  const pending = candidates.length < placeFavs.length

  function toggle(id) {
    if (selIds.includes(id)) setChosen(selIds.filter((x) => x !== id))
    else if (selIds.length < MAX_PLACES) setChosen([...selIds, id])
  }
  // 삭제 = 즐겨찾기에서 빼기 (Supabase 에서도 지워짐). 선택 삭제는 지금 코스에 체크된 곳들.
  const favOf = (id) => placeFavs.find((f) => f.item_id === String(id))
  const deleteSelected = async () => { await removeFavorites(selIds.map(favOf).filter(Boolean)); setChosen(null) }

  // 오늘 바람 기준 표시: 바람 맞는 쪽·비낀 쪽(실외), 맛집은 실내
  function windTag(f) {
    const m = metaOf(f)
    if (!wind || !m || m.failed || !Number.isFinite(m.lat)) return null
    if (m.type === '39') return <Badge bg="dark" className="border">실내 · 바람 걱정 없음</Badge>
    const label = exposureLabel(exposure({ lat: m.lat, lng: m.lng }, wind.dir))
    return label ? <Badge bg={label === '바람 맞는 쪽' ? 'warning' : 'info'} text="dark">오늘 {label}</Badge> : null
  }

  return (
    <>
      <PageHeader icon="star" title="내 즐겨찾기" subtitle="마음에 든 곳을 담아 두고, 그 곳들로 오늘의 바람에 맞는 나만의 코스를 만들어요 — 닉네임별로 Supabase에 저장됩니다" />
      <p className="small text-muted mb-4"><i className="bi bi-person-circle me-1" />{nickname ? <>‘{nickname}’의 즐겨찾기예요.</> : <>닉네임을 정하지 않아 ‘익명’으로 저장돼요.</>} 닉네임은 오른쪽 위에서 바꿀 수 있어요.</p>

      {favLoading ? <Loading /> : favorites.length === 0 ? (
        <Empty text="아직 담은 곳이 없어요. 명소·맛집이나 바람따라 오름에서 ★를 눌러 보세요" />
      ) : (
        <>
          <div className="my-basket rounded-3 p-3 mb-4">
            <div className="fw-bold fs-5">{favorites.length}곳 담았어요</div>
            <div className="small text-muted">
              {grouped.map((g) => `${g.title} ${g.items.length}`).join(' · ')}
              {wind && <> · 지금 {dirName(wind.dir)}풍 {wind.speed.toFixed(1)}m/s</>}
            </div>
          </div>

          <section className="mb-5">
            <h5 className="fw-bold mb-1"><i className="bi bi-signpost-split me-2 text-primary" />오늘 코스 만들기</h5>
            <p className="small text-muted">
              담은 곳 중 코스에 넣을 곳을 고르면 오늘의 바람에 맞는 순서와 시간으로 짜 드려요 (최대 {MAX_PLACES}곳).
              {heritageCount > 0 && ` 국가유산 ${heritageCount}곳은 위치 정보가 없어 코스에는 들어가지 않아요.`}
            </p>

            {placeFavs.length === 0 ? (
              <p className="small text-muted">코스는 위치 정보가 있는 명소·맛집·오름으로 짤 수 있어요. 명소·맛집이나 바람따라 오름에서 ★를 눌러 담아 보세요.</p>
            ) : (
              <>
                <div className="d-flex flex-wrap gap-2">
                  {candidates.map((c) => {
                    const on = selIds.includes(c.id)
                    return (
                      <button key={c.id} type="button" className={`course-chip ${on ? 'on' : ''}`} disabled={!on && selIds.length >= MAX_PLACES} onClick={() => toggle(c.id)}>
                        {c.image && <img src={c.image} alt="" referrerPolicy="no-referrer" />}
                        <span>{c.title}</span>
                        {on && <i className="bi bi-check-lg" />}
                      </button>
                    )
                  })}
                </div>
                {pending && (
                  placeFavs.some((f) => metaOf(f)?.failed)
                    ? <div className="small text-warning mt-2">일부 장소의 위치를 불러오지 못했어요. <Button variant="link" size="sm" className="p-0 align-baseline" onClick={retry}>다시 불러오기</Button></div>
                    : <div className="small text-muted mt-2">위치 정보를 불러오는 중…</div>
                )}
                <div className="mt-3 mb-3">
                  <ConfirmButton label={`선택한 ${selIds.length}곳 삭제`} question={`선택한 ${selIds.length}곳을 즐겨찾기에서 삭제할까요?`} disabled={!selIds.length} onConfirm={deleteSelected} />
                </div>

                {forecast.loading ? <Loading /> : forecast.error ? (
                  <p className="small text-warning">{forecast.error}</p>
                ) : selected.length > 0 ? (
                  <CourseResult key={selIds.join('|')} places={selected} slots={forecast.slots} />
                ) : (
                  <p className="small text-muted">코스에 넣을 곳을 위에서 골라 주세요.</p>
                )}
              </>
            )}
          </section>

          {grouped.map((g) => (
            <section key={g.key} className="mb-4">
              <h5 className="fw-bold mb-3"><i className={`bi bi-${g.icon} me-2 text-primary`} />{g.title} <small className="text-muted fw-normal">{g.items.length}</small></h5>
              <Row xs={1} sm={2} lg={3} className="g-3">
                {g.items.map((f) => {
                  const m = metaOf(f)
                  return (
                    <Col key={f.id}>
                      <ItemCard title={f.title} badge={g.title} image={m?.image} subtitle={m?.subtitle} extra={windTag(f)}
                        description={`저장: ${new Date(f.created_at).toLocaleString('ko-KR')}`} onRemove={() => removeFavorite(f)} />
                    </Col>
                  )
                })}
              </Row>
            </section>
          ))}

          <div className="text-end">
            <ConfirmButton size="md" label={`전체 삭제 (${favorites.length})`} question={`즐겨찾기 ${favorites.length}곳을 모두 삭제할까요?`} onConfirm={() => removeFavorites(favorites)} />
          </div>
        </>
      )}
    </>
  )
}
