import { useEffect, useState } from 'react'
import { Button, Col, Form, InputGroup, Nav, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import BasketLayout from '../components/BasketLayout'
import ItemCard from '../components/ItemCard'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchPlaces } from '../api/client'
import { useFavorites } from '../hooks/useFavorites'

// 탭마다 보여 줄 종류와 추천 검색어 (결과가 실제로 나오는 것만 — TourAPI 검색은 이름에 포함된 글자로 찾는다)
const TABS = [
  { key: '12', type: '12', label: '명소', placeholder: '예: 해녀', chips: ['해녀', '해변', '폭포'] },
  { key: '39', type: '39', label: '맛집', placeholder: '예: 해녀의집', chips: ['해녀의집', '흑돼지', '갈치', '보말', '국수', '전복', '카페'] },
  { key: '14', type: '14', label: '문화시설', placeholder: '검색어', chips: [] },
]
const AREAS = [{ v: '', label: '전체' }, { v: 'jeju', label: '제주시' }, { v: 'seogwipo', label: '서귀포시' }]
const PAGE = 24 // 한 번에 보여 주는 개수 ("더 보기"로 이어서)

export default function Places() {
  const { isFav, toggle } = useFavorites()                 // 저장 여부 + 저장/삭제
  const [tab, setTab] = useState('12')
  const [area, setArea] = useState('')
  const [input, setInput] = useState('')                   // 입력창에 쓰고 있는 글자
  const [q, setQ] = useState('')                           // 실제로 검색한 글자
  const [data, setData] = useState({ items: [], total: 0, withImage: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shown, setShown] = useState(PAGE)

  const cur = TABS.find((t) => t.key === tab)

  // 종류·지역·검색어가 바뀔 때마다 사진이 있는 곳만 다시 불러온다
  useEffect(() => {
    let alive = true
    setLoading(true); setError('')
    fetchPlaces(q || cur.base || '', cur.type, area)
      .then((d) => { if (alive) { setData(d); setShown(PAGE) } })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tab, area])

  function pickTab(t) { setTab(t); setInput(''); setQ('') }
  function search(e) { e?.preventDefault(); setQ(input.trim()) }
  function pickChip(c) { const next = q === c ? '' : c; setInput(next); setQ(next) } // 다시 누르면 해제

  const hidden = data.total - data.withImage // 사진이 없어 뺀 곳

  return (
    <BasketLayout>
      <PageHeader icon="geo-alt" title="명소·맛집" subtitle="영등할망의 길목에서 찾는 제주의 명소와 맛집 — 한국관광공사 TourAPI (사진이 있는 곳만 보여 드려요)" />

      <Nav variant="pills" activeKey={tab} onSelect={(k) => k && pickTab(k)} className="mb-3">
        {TABS.map((t) => (
          <Nav.Item key={t.key}><Nav.Link eventKey={t.key}>{t.label}</Nav.Link></Nav.Item>
        ))}
      </Nav>

      <div className="d-flex flex-wrap gap-2 mb-2">
        {AREAS.map((a) => (
          <Button key={a.v} size="sm" variant={area === a.v ? 'primary' : 'outline-secondary'} onClick={() => setArea(a.v)}>{a.label}</Button>
        ))}
      </div>

      {cur.chips.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {cur.chips.map((c) => (
            <Button key={c} size="sm" variant={q === c ? 'info' : 'outline-info'} className="rounded-pill" onClick={() => pickChip(c)}>{c}</Button>
          ))}
        </div>
      )}

      <Form onSubmit={search} className="mb-3">
        <InputGroup>
          <Form.Control value={input} onChange={(e) => setInput(e.target.value)} placeholder={cur.placeholder} />
          <Button type="submit"><i className="bi bi-search" /></Button>
        </InputGroup>
      </Form>

      <ErrorAlert error={error} />
      {!loading && !error && (
        <p className="small text-muted mb-3">
          {q && <>‘{q}’ · </>}사진이 있는 곳 <b>{data.withImage}곳</b>
          {hidden > 0 && <> (조건에 맞는 {data.total}곳 중 사진이 없는 {hidden}곳은 제외)</>}
        </p>
      )}
      {loading ? <Loading /> : data.items.length === 0 ? <Empty text="조건에 맞는 곳이 없어요. 다른 검색어나 지역을 골라 보세요" /> : (
        <>
          <Row xs={1} sm={2} lg={3} className="g-3">
            {data.items.slice(0, shown).map((p) => (
              <Col key={p.id}>
                <ItemCard title={p.title} subtitle={p.addr} image={p.image} badge={cur.label}
                  saved={isFav('tour', p.id)} onSave={() => toggle({ source: 'tour', id: p.id, title: p.title })} />
              </Col>
            ))}
          </Row>
          {shown < data.items.length && (
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={() => setShown((n) => n + PAGE)}>
                더 보기 <span className="text-muted">({Math.min(shown, data.items.length)} / {data.items.length})</span>
              </Button>
            </div>
          )}
        </>
      )}
    </BasketLayout>
  )
}
