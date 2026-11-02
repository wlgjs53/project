import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Col, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import ConfirmButton from '../components/ConfirmButton'
import { Empty, Loading } from '../components/Status'
import { useAppStore } from '../store/useAppStore'
import { useFavoriteMeta } from '../hooks/useFavoriteMeta'
import { useWindForecast } from '../hooks/useWindForecast'
import { exposure, exposureLabel } from '../lib/advice'
import { MAX_PLACES } from '../lib/course'
import { dirName } from '../lib/geo'
import { currentWind } from '../lib/wind'

// 즐겨찾기 = 할망따라 코스의 재료 바구니. 종류별로 묶어 보여 주고, 오늘 바람 기준 표시를 달아 바로 코스로 이어 준다.
const GROUPS = [
  { key: 'sight', title: '명소·문화시설', icon: 'geo-alt' },
  { key: 'oreum', title: '오름', icon: 'triangle' },
  { key: 'food', title: '맛집', icon: 'egg-fried' },
  { key: 'heritage', title: '국가유산', icon: 'bank' },
]
// 저장된 출처(+TourAPI 분류) → 묶음. 분류를 아직 못 불러왔으면 명소로 둔다.
const groupOf = (f, m) => (f.source === 'oreum' ? 'oreum' : f.source === 'heritage' ? 'heritage' : m?.type === '39' ? 'food' : 'sight')

export default function My() {
  const { nickname, favorites, favLoading, loadFavorites, removeFavorite, removeFavorites } = useAppStore()
  const { meta } = useFavoriteMeta(favorites)
  const forecast = useWindForecast()
  const wind = currentWind(forecast.slots)

  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])

  const metaOf = (f) => meta[`${f.source}:${f.item_id}`]
  const grouped = GROUPS.map((g) => ({ ...g, items: favorites.filter((f) => groupOf(f, metaOf(f)) === g.key) })).filter((g) => g.items.length)
  const usable = favorites.filter((f) => f.source !== 'heritage').length // 위치 정보가 있어 코스에 쓸 수 있는 곳
  const heritageCount = favorites.length - usable

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
      <PageHeader icon="star" title="내 즐겨찾기" subtitle="마음에 든 곳을 담아 두면 할망따라가 오늘의 바람에 맞는 코스로 엮어 줘요 — 닉네임별로 Supabase에 저장됩니다" />
      <p className="small text-muted mb-4"><i className="bi bi-person-circle me-1" />{nickname ? <>‘{nickname}’의 즐겨찾기예요.</> : <>닉네임을 정하지 않아 ‘익명’으로 저장돼요.</>} 닉네임은 오른쪽 위에서 바꿀 수 있어요.</p>

      {favLoading ? <Loading /> : favorites.length === 0 ? (
        <Empty text="아직 담은 곳이 없어요. 명소·맛집이나 바람따라 오름에서 ★를 눌러 보세요" />
      ) : (
        <>
          <div className="my-basket rounded-3 p-3 mb-4">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="me-auto">
                <div className="fw-bold fs-5">{favorites.length}곳 담았어요</div>
                <div className="small text-muted">
                  {grouped.map((g) => `${g.title} ${g.items.length}`).join(' · ')}
                  {wind && <> · 지금 {dirName(wind.dir)}풍 {wind.speed.toFixed(1)}m/s</>}
                </div>
              </div>
              {usable > 0 && (
                <Link to="/course" className="btn btn-primary">
                  <i className="bi bi-signpost-split me-1" />이 {Math.min(usable, MAX_PLACES)}곳으로 오늘 코스 만들기
                </Link>
              )}
            </div>
            <div className="small text-muted mt-2">
              {usable > MAX_PLACES && `코스는 한 번에 ${MAX_PLACES}곳까지예요. 할망따라에서 넣을 곳을 고를 수 있어요. `}
              {heritageCount > 0 && `국가유산 ${heritageCount}곳은 위치 정보가 없어 코스에는 들어가지 않아요.`}
            </div>
          </div>

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
