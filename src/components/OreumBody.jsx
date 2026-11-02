import { useEffect, useState } from 'react'
import { Badge, Button } from 'react-bootstrap'
import { fetchNearby } from '../api/client'
import OreumImg from './OreumImg'
import { exposure, exposureLabel, windLevel } from '../lib/advice'
import { dirName } from '../lib/geo'
import { kakaoTo } from '../lib/nav'
import { findOreumPhoto, loadOreumPhotos } from '../lib/oreumPhoto'

const cache = new Map() // 오름 id → { photo, foods }

// 오름 상세(바람길 지도의 오름 점을 눌렀을 때): 표고·설명(제주오름요약설명) + 같은 이름의 TourAPI 사진 + 오름 근처 맛집
export default function OreumBody({ place, wind }) {
  const [extra, setExtra] = useState(() => cache.get(place.id) ?? null)

  useEffect(() => {
    const hit = cache.get(place.id)
    if (hit) { setExtra(hit); return }
    setExtra(null)
    let alive = true
    Promise.allSettled([
      loadOreumPhotos(),
      fetchNearby({ lat: place.lat, lng: place.lng, type: '39', radius: 6000, rows: 12 }),
    ]).then(([p, f]) => {
      const photo = p.status === 'fulfilled' ? findOreumPhoto(p.value, place) : null
      const foods = f.status === 'fulfilled' ? (f.value.items ?? f.value).filter((x) => x.image).slice(0, 3) : []
      const v = { photo, foods }
      cache.set(place.id, v)
      if (alive) setExtra(v)
    })
    return () => { alive = false }
  }, [place])

  const e = exposure(place, wind.dir)
  const label = exposureLabel(e)
  const lvl = windLevel(wind.speed)
  const side = e > 0.35 ? '한라산에서 보아 바람이 불어오는 쪽' : e < -0.35 ? '한라산에서 보아 바람을 비껴가는 쪽' : '바람이 비스듬히 지나는 쪽'
  const summit = place.height >= 300 && lvl !== 'calm'
    ? '정상부는 지상보다 바람이 더 셀 수 있어요. 모자·방풍 옷차림을 챙기세요.'
    : lvl === 'strong' ? '바람이 센 날이에요. 능선 탐방은 조심하세요.' : '바람이 약한 편이라 탐방하기 좋아요.'

  return (
    <>
      <div className="mb-2 d-flex flex-wrap gap-1">
        <Badge bg="success">오름</Badge>
        {place.height && <Badge bg="dark" className="border">표고 {place.height}m</Badge>}
        {place.rise && <Badge bg="dark" className="border">오름 높이 {place.rise}m</Badge>}
        {label && <Badge bg={e > 0 ? 'warning' : 'info'} text="dark">{label}</Badge>}
      </div>
      <div className="small text-muted mb-2">{place.addr}</div>

      {extra?.photo?.image ? (
        <figure className="mb-2">
          <OreumImg photo={extra.photo} alt={place.title} className="w-100 rounded" style={{ height: 150, objectFit: 'cover' }} />
          <figcaption className="small text-muted mt-1">
            {extra.photo.source
              ? <>사진 출처: <a href={extra.photo.source.url} target="_blank" rel="noopener noreferrer">{extra.photo.source.site} 원문 ↗</a> (검색 결과)</>
              : '사진: 한국관광공사'}
          </figcaption>
        </figure>
      ) : extra && (
        <div className="d-flex align-items-center gap-2 rounded mb-2 px-3 py-2 small text-muted" style={{ background: 'var(--bs-secondary-bg)' }}>
          <i className="bi bi-image fs-5" />
          <span className="flex-grow-1">등록된 사진이 없는 오름이에요.</span>
          <a href={`https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(place.title)}`} target="_blank" rel="noopener noreferrer">사진 검색 ↗</a>
        </div>
      )}

      <div className="w-why mb-3">
        <b><i className="bi bi-wind me-1" />바람 따라 걷기</b>
        <p className="mb-0">지금 {dirName(wind.dir)}풍 {wind.speed.toFixed(1)}m/s. 이 오름은 {side}이에요. {summit}</p>
      </div>

      {place.desc && <p>{place.desc}</p>}

      <div className="mb-3">
        <b className="small"><i className="bi bi-egg-fried me-1" />오름 근처 맛집</b>
        {!extra && <div className="small text-muted mt-1">불러오는 중…</div>}
        {extra && !extra.foods.length && <div className="small text-muted mt-1">근처(6km)에서 사진이 있는 맛집을 찾지 못했어요.</div>}
        {extra?.foods.map((f) => (
          <div key={f.id} className="d-flex align-items-center gap-2 mt-2">
            <img src={f.thumb || f.image} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flex: 'none' }} />
            <div className="min-w-0"><div className="fw-bold text-truncate">{f.title}</div><div className="small text-muted">{f.dist ? `${(f.dist / 1000).toFixed(1)}km` : ''} {f.addr}</div></div>
          </div>
        ))}
      </div>

      <Button size="sm" variant="outline-secondary" href={kakaoTo(place)} target="_blank" rel="noopener noreferrer" className="mb-3">
        <i className="bi bi-signpost-split me-1" />길찾기
      </Button>
      <p className="small text-muted mb-0">출처: 제주특별자치도 제주오름요약설명(공공데이터포털){extra?.foods.length ? ' · 맛집 한국관광공사 TourAPI' : ''}</p>
    </>
  )
}
