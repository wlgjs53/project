import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Col, Offcanvas, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import BasketLayout from '../components/BasketLayout'
import OreumBody from '../components/OreumBody'
import OreumImg from '../components/OreumImg'
import FavStar from '../components/FavStar'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { useOreums } from '../hooks/useOreums'
import { useWindForecast } from '../hooks/useWindForecast'
import { useFavorites } from '../hooks/useFavorites'
import { exposure, exposureLabel, windLevel } from '../lib/advice'
import { dirName } from '../lib/geo'
import { findOreumPhoto, loadOreumPhotos } from '../lib/oreumPhoto'
import { currentWind } from '../lib/wind'

const PAGE = 24
const AREAS = [['', '전체'], ['제주시', '제주시'], ['서귀포시', '서귀포시']]
const HEIGHTS = [['', '표고 전체'], ['low', '낮은 오름 (200m 미만)'], ['mid', '보통 (200~350m)'], ['high', '높은 오름 (350m 이상)']]
const SIDES = [['', '바람 전체'], ['wind', '바람 맞는 쪽'], ['lee', '바람 비낀 쪽']]
const heightKind = (h) => (h < 200 ? 'low' : h < 350 ? 'mid' : 'high')

// 오늘 정상 부근에서 느낄 바람(m/s)의 어림값: 높을수록, 바람이 불어오는 쪽일수록 더 세게 느낀다. (단순 기준)
function feelOf(o, wind) {
  const e = exposure(o, wind.dir)
  const feel = wind.speed * (1 + Math.min(o.height ?? 0, 500) / 700) * (e > 0.35 ? 1.2 : e < -0.35 ? 0.8 : 1)
  const tag = feel < 5 ? { text: '오르기 좋아요', bg: 'success' } : feel < 9 ? { text: '바람 적당', bg: 'warning' } : { text: '바람 조심', bg: 'danger' }
  return { e, feel, tag }
}

// 표고에 비례하는 작은 산 그림 (사진이 없는 오름용)
function HillArt({ height }) {
  const peak = 70 - Math.min(Math.max(height ?? 100, 50), 500) / 500 * 46
  return (
    <svg viewBox="0 0 200 90" className="oreum-art" aria-hidden="true">
      <path d={`M0 90 L0 74 Q50 ${peak + 18} 100 ${peak} Q150 ${peak + 18} 200 74 L200 90 Z`} fill="rgba(127,227,214,.22)" />
      <path d={`M0 90 L0 80 Q60 ${peak + 28} 120 ${peak + 14} Q170 ${peak + 20} 200 82 L200 90 Z`} fill="rgba(127,227,214,.12)" />
    </svg>
  )
}

// 바람따라 오름 — 제주 오름 90곳을 오늘의 바람으로 견줘 "오늘 오르기 좋은 오름" 순으로 보여 준다.
export default function Oreum() {
  const { items, error } = useOreums()
  const { isFav, toggle } = useFavorites()
  const forecast = useWindForecast()
  const [photos, setPhotos] = useState([])
  const [area, setArea] = useState('')
  const [hKind, setHKind] = useState('')
  const [side, setSide] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [sel, setSel] = useState(null)

  useEffect(() => { loadOreumPhotos().then(setPhotos) }, [])

  const wind = currentWind(forecast.slots)
  const level = wind ? windLevel(wind.speed) : null

  const rows = useMemo(() => {
    if (!wind) return []
    const list = items.map((o) => ({ ...o, ...feelOf(o, wind), photo: findOreumPhoto(photos, o) }))
    // 정상 바람이 약할 것 같은 오름부터 (같은 정도면 표고가 높은 오름 먼저)
    return list.sort((a, b) => (Math.abs(a.feel - b.feel) < 0.3 ? (b.height ?? 0) - (a.height ?? 0) : a.feel - b.feel))
  }, [items, wind, photos])

  const filtered = rows.filter((o) =>
    (!area || o.addr.startsWith(area)) && (!hKind || heightKind(o.height ?? 0) === hKind) &&
    (!side || (side === 'wind' ? o.e > 0.35 : o.e < -0.35)))

  const chip = (cur, set, list) => (
    <div className="d-flex flex-wrap gap-2">
      {list.map(([v, label]) => (
        <Button key={v} size="sm" variant={cur === v ? 'primary' : 'outline-secondary'} className="rounded-pill" onClick={() => { set(v); setShown(PAGE) }}>{label}</Button>
      ))}
    </div>
  )

  return (
    <BasketLayout>
      <PageHeader icon="triangle" title="바람따라 오름" subtitle="오늘의 바람으로 고른, 오르기 좋은 제주 오름 — 제주특별자치도 제주오름요약설명(공공데이터포털)" />
      <ErrorAlert error={error?.message ?? (forecast.error || '')} />
      {(forecast.loading || (!items.length && !error)) ? <Loading /> : wind && (
        <>
          <div className="oreum-today rounded-3 p-3 mb-3">
            <div className="fw-bold">지금 {dirName(wind.dir)}풍 {wind.speed.toFixed(1)}m/s</div>
            <div className="small text-muted">
              {level === 'calm' ? '바람이 잔잔한 날이에요.' : level === 'normal' ? '바람이 적당한 날이에요.' : '바람이 강한 날이에요.'} 정상 바람이 약할 것 같은 오름부터 보여 드려요.
              {' '}정상 바람은 표고와 한라산 기준 방향으로 어림한 단순 계산이에요.
            </div>
            <div className="d-flex flex-wrap gap-2 mt-2">
              <Link to="/?oreum=all" className="btn btn-outline-primary btn-sm"><i className="bi bi-wind me-1" />바람길 지도에서 오름 보기</Link>
              <Link to="/course" className="btn btn-outline-secondary btn-sm"><i className="bi bi-signpost-split me-1" />오름 코스 추천 보기</Link>
            </div>
          </div>

          <div className="d-flex flex-column gap-2 mb-3">
            {chip(area, setArea, AREAS)}
            {chip(hKind, setHKind, HEIGHTS)}
            {chip(side, setSide, SIDES)}
          </div>
          <p className="small text-muted mb-3">오름 <b>{filtered.length}곳</b> · 사진이 있는 오름 {filtered.filter((o) => o.photo).length}곳</p>

          {filtered.length === 0 ? <Empty text="조건에 맞는 오름이 없어요" /> : (
            <>
              <Row xs={1} sm={2} lg={3} className="g-3">
                {filtered.slice(0, shown).map((o) => (
                  <Col key={o.id}>
                    <div className="oreum-card" role="button" onClick={() => setSel(o)}>
                      <div className="oreum-img">
                        {o.photo?.image ? <OreumImg photo={o.photo} alt={o.title} /> : <HillArt height={o.height} />}
                        <FavStar saved={isFav('oreum', o.id)} onToggle={() => toggle({ source: 'oreum', id: o.id, title: o.title })} />
                        <Badge bg={o.tag.bg} text={o.tag.bg === 'warning' ? 'dark' : undefined} className="oreum-tag">{o.tag.text}</Badge>
                      </div>
                      <div className="p-3">
                        <div className="fw-bold">{o.title}</div>
                        <div className="small text-muted mb-2">{o.addr}</div>
                        <div className="d-flex flex-wrap gap-1">
                          {o.height && <Badge bg="dark" className="border">표고 {o.height}m</Badge>}
                          {exposureLabel(o.e) && <Badge bg={o.e > 0 ? 'warning' : 'info'} text="dark">{exposureLabel(o.e)}</Badge>}
                          <Badge bg="dark" className="border">정상 약 {o.feel.toFixed(1)}m/s</Badge>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              {shown < filtered.length && (
                <div className="text-center mt-4">
                  <Button variant="outline-primary" onClick={() => setShown((n) => n + PAGE)}>더 보기 <span className="text-muted">({Math.min(shown, filtered.length)} / {filtered.length})</span></Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Offcanvas show={!!sel} onHide={() => setSel(null)} placement="end" className="w-detail">
        <Offcanvas.Header closeButton><Offcanvas.Title className="fs-5 fw-bold">{sel?.title}</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body>
          {sel && wind && (
            <>
              <OreumBody place={sel} wind={wind} />
              <Link to={`/?oreum=${encodeURIComponent(sel.id)}`} className="btn btn-primary btn-sm mt-3"><i className="bi bi-wind me-1" />바람길 지도에서 보기</Link>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </BasketLayout>
  )
}
