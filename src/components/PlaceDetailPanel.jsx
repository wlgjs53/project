import { useEffect, useState } from 'react'
import { Badge, Button, Offcanvas } from 'react-bootstrap'
import { fetchPlaceDetail } from '../api/client'
import { exposure, exposureLabel, whyText } from '../lib/advice'
import { useAppStore } from '../store/useAppStore'
import { ErrorAlert, Loading } from './Status'

const cache = new Map() // 같은 장소를 다시 열 때 서버를 또 부르지 않도록
const KIND = { tour: '명소', food: '맛집' }

// 카드를 눌렀을 때 열리는 장소 상세: 사진 갤러리, 소개, 이용 정보, 그리고 "왜 추천했는지"
// sel: { place, kind } — place 는 useNearby 의 항목(+ e: 바람 노출도)
export default function PlaceDetailPanel({ sel, show, wind, placement, onHide }) {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const place = sel?.place
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!place) return
    setActive(0); setError('')
    if (place.sample) { setDetail(null); setLoading(false); return }
    const hit = cache.get(place.id)
    if (hit) { setDetail(hit); setLoading(false); return }
    let alive = true
    setDetail(null); setLoading(true)
    fetchPlaceDetail({ id: place.id, type: place.type })
      .then((d) => { cache.set(place.id, d); if (alive) setDetail(d) })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [place])

  // 사진: 상세의 갤러리 → 없으면 목록의 대표 사진 한 장
  const photos = detail?.images?.length ? detail.images : place?.image ? [{ url: place.image, thumb: place.thumb || place.image, desc: place.title }] : []
  const shown = photos[active]
  const e = place ? exposure(place, wind.dir) : 0 // 지도에서 직접 골라도 되도록 현재 바람으로 계산
  const label = sel?.kind === 'tour' ? exposureLabel(e) : ''
  const dist = place?.dist === undefined ? '' : place.dist >= 1000 ? `${(place.dist / 1000).toFixed(1)}km` : `${Math.round(place.dist)}m`
  const route = place ? `https://map.kakao.com/link/to/${encodeURIComponent(place.title)},${place.lat},${place.lng}` : '#'

  return (
    <Offcanvas show={show} onHide={onHide} placement={placement} backdrop={false} scroll className="w-detail">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="fs-5 fw-bold">{place?.title}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {place && (
          <>
            <div className="mb-2 d-flex flex-wrap gap-1">
              <Badge bg="secondary">{KIND[sel.kind]}</Badge>
              {dist && <Badge bg="dark" className="border">여정 장소에서 {dist}</Badge>}
              {label && <Badge bg={e > 0 ? 'warning' : 'info'} text="dark">{label}</Badge>}
            </div>

            {shown ? (
              <figure className="mb-2">
                <img src={shown.url} alt={shown.desc || place.title} className="w-100 rounded"
                  style={{ maxHeight: 260, objectFit: 'cover' }} />
                {shown.desc && shown.desc !== place.title && <figcaption className="small text-muted mt-1">{shown.desc}</figcaption>}
              </figure>
            ) : (
              <div className="placeholder-img rounded mb-2" style={{ height: 160 }}><i className="bi bi-image" /></div>
            )}
            {photos.length > 1 && (
              <div className="d-flex gap-2 overflow-auto pb-2 mb-2">
                {photos.slice(0, 12).map((p, i) => (
                  <img key={p.url} src={p.thumb} alt={p.desc} loading="lazy" role="button" onClick={() => setActive(i)}
                    className={`rounded ${i === active ? 'border border-2 border-primary' : 'opacity-75'}`}
                    style={{ height: 52, width: 78, objectFit: 'cover', cursor: 'pointer' }} />
                ))}
              </div>
            )}

            <div className="w-why mb-3">
              <b><i className="bi bi-wind me-1" />왜 이곳을 추천했나요?</b>
              <p className="mb-0">{whyText({ ...place, e }, wind, sel.kind)}</p>
            </div>

            {place.sample && <p className="small text-muted">샘플 데이터라 자세한 정보가 없어요. TourAPI가 연결되면 실제 정보가 나옵니다.</p>}
            {loading && <Loading />}
            <ErrorAlert error={error} />
            {detail?.overview && detail.overview.split(/\n+/).map((t, i) => <p key={i} className="mb-2">{t}</p>)}

            {detail && (
              <dl className="small mt-3 mb-3">
                {[['주소', detail.addr], ['전화', detail.tel], ...detail.info].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="d-flex gap-3 mb-1">
                    <dt className="text-muted fw-normal flex-shrink-0" style={{ minWidth: 64 }}>{k}</dt>
                    <dd className="mb-0">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button size="sm" variant="outline-primary" disabled={place.sample}
                onClick={() => addFavorite({ source: 'tour', id: place.id, title: place.title })}>
                <i className="bi bi-star me-1" />즐겨찾기
              </Button>
              <Button size="sm" variant="outline-secondary" href={route} target="_blank" rel="noopener noreferrer">
                <i className="bi bi-signpost-split me-1" />길찾기
              </Button>
              {detail?.homepage && (
                <Button size="sm" variant="outline-secondary" href={detail.homepage} target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-link-45deg me-1" />홈페이지
                </Button>
              )}
            </div>
            <p className="small text-muted mb-0">
              출처: 한국관광공사 TourAPI{detail?.copyright ? ` · 사진 ${detail.copyright}` : ''}
            </p>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  )
}
