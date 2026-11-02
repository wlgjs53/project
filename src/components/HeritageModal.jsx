import { useEffect, useState } from 'react'
import { Badge, Button, Modal } from 'react-bootstrap'
import { fetchHeritageDetail } from '../api/client'
import { ErrorAlert, Loading } from './Status'

// 국가유산 상세: 공식 설명문과 사진 갤러리 (국가유산청 오픈API)
// item: 목록 항목 { name, kind, city, kdcd, ctcd, asno, image }
export default function HeritageModal({ item, onHide, onSave }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!item) return
    let alive = true
    setDetail(null); setError(''); setLoading(true); setActive(0)
    fetchHeritageDetail(item)
      .then((d) => alive && setDetail(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [item])

  // 사진: 갤러리가 있으면 그것을, 없으면 목록의 대표 사진 1장
  const photos = detail?.images?.length ? detail.images : item?.image ? [{ url: item.image, desc: item.name }] : []
  const shown = photos[active]
  const meta = detail && [
    ['지정일', detail.designated], ['분류', detail.category], ['소재지', detail.address], ['보존·관리', detail.keeper],
  ].filter(([, v]) => v)

  return (
    <Modal show={!!item} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-5">
          {item?.name} {item?.kind && <Badge bg="secondary" className="ms-2 fs-6">{item.kind}</Badge>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorAlert error={error} />
        {shown && (
          <figure className="mb-3">
            <img src={shown.url} alt={shown.desc || item.name} className="img-fluid rounded w-100" style={{ maxHeight: 380, objectFit: 'cover' }} />
            {shown.desc && <figcaption className="small text-muted mt-1">{shown.desc} <span className="ms-1">({active + 1}/{photos.length})</span></figcaption>}
          </figure>
        )}
        {photos.length > 1 && (
          <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
            {photos.slice(0, 16).map((p, i) => (
              <img key={p.url} src={p.url} alt={p.desc} loading="lazy" role="button" onClick={() => setActive(i)}
                className={`rounded ${i === active ? 'border border-2 border-primary' : 'opacity-75'}`}
                style={{ height: 56, width: 84, objectFit: 'cover', cursor: 'pointer' }} />
            ))}
          </div>
        )}
        {loading && <Loading />}
        {meta && meta.length > 0 && (
          <dl className="small mb-3">
            {meta.map(([k, v]) => (
              <div key={k} className="d-flex gap-3 mb-1">
                <dt className="text-muted fw-normal" style={{ minWidth: 72 }}>{k}</dt>
                <dd className="mb-0">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {detail?.content && detail.content.split(/\n+/).map((p, i) => <p key={i} className="mb-2">{p}</p>)}
        <p className="small text-muted mb-0 mt-3">출처: 국가유산청 국가유산 오픈API</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={() => onSave?.(item)}><i className="bi bi-star me-1" />즐겨찾기</Button>
        <Button variant="secondary" onClick={onHide}>닫기</Button>
      </Modal.Footer>
    </Modal>
  )
}
