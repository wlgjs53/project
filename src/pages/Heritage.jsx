import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Form, InputGroup, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import BasketLayout from '../components/BasketLayout'
import ItemCard from '../components/ItemCard'
import HeritageModal from '../components/HeritageModal'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchHeritage } from '../api/client'
import { useFavorites } from '../hooks/useFavorites'

export default function Heritage() {
  const { isFav, toggle } = useFavorites()
  const [keyword, setKeyword] = useState('')         // 비워 두고 입력창의 예시 문구(placeholder)만 보여 준다
  const [list, setList] = useState([])
  const [featured, setFeatured] = useState(null)     // 이 사이트의 주제인 영등굿을 맨 위에 항상 소개
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)             // 상세 모달에 띄울 유산

  async function search(e) {
    e?.preventDefault()
    setLoading(true); setError('')
    try { setList(await fetchHeritage(keyword)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    search()
    fetchHeritage('영등').then((l) => setFeatured(l[0] ?? null)).catch(() => {})
  }, [])

  const save = (h) => toggle({ source: 'heritage', id: h.name, title: h.name })
  const saved = (h) => isFav('heritage', h.name)

  return (
    <BasketLayout>
      <PageHeader icon="bank" title="영등굿·국가유산" subtitle="칠머리당영등굿을 비롯한 제주의 국가유산 — 국가유산청 오픈API" />

      {featured && (
        <Card className="mb-4 overflow-hidden">
          <Row className="g-0">
            {featured.image && (
              <Col md={5}><img src={featured.image} alt={featured.name} className="w-100 h-100" style={{ objectFit: 'cover', minHeight: 220 }} /></Col>
            )}
            <Col md={featured.image ? 7 : 12}>
              <Card.Body className="d-flex flex-column h-100">
                <div className="mb-2"><Badge bg="warning" text="dark">영등할망의 바람길 대표 유산</Badge> <Badge bg="secondary">{featured.kind}</Badge></div>
                <Card.Title className="fw-bold">{featured.name}</Card.Title>
                {featured.summary && <Card.Text>{featured.summary}</Card.Text>}
                <div className="mt-auto d-flex gap-2">
                  <Button size="sm" onClick={() => setOpen(featured)}><i className="bi bi-card-text me-1" />공식 설명·사진 보기</Button>
                  <Button size="sm" variant={saved(featured) ? 'primary' : 'outline-primary'} onClick={() => save(featured)}>
                    <i className={`bi bi-star${saved(featured) ? '-fill' : ''} me-1`} />{saved(featured) ? '저장됨' : '즐겨찾기'}
                  </Button>
                </div>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      )}

      <h5 className="fw-bold mb-3">다른 제주 국가유산 찾아보기</h5>
      <Form onSubmit={search} className="mb-4">
        <InputGroup>
          <Form.Control value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="예: 관덕정" />
          <Button type="submit"><i className="bi bi-search" /></Button>
        </InputGroup>
      </Form>
      <ErrorAlert error={error} />
      {loading ? <Loading /> : list.length === 0 ? <Empty /> : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {list.map((h) => (
            <Col key={h.asno || h.name}>
              <ItemCard title={h.name} subtitle={h.city} badge={h.kind} image={h.image} description={h.summary}
                onOpen={() => setOpen(h)} saved={saved(h)} onSave={() => save(h)} />
            </Col>
          ))}
        </Row>
      )}

      <HeritageModal item={open} saved={open ? saved(open) : false} onHide={() => setOpen(null)} onSave={save} />
    </BasketLayout>
  )
}
