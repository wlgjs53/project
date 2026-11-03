import { useEffect, useState } from 'react'
import { Badge, Button, Col, Modal, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import GoodsArt from '../components/GoodsArt'
import { Empty } from '../components/Status'
import { useAppStore } from '../store/useAppStore'
import { GOODS, goodsById, won } from '../data/goods'

const METHODS = [
  { key: '카드', icon: 'credit-card', desc: '신용·체크카드' },
  { key: '간편결제', icon: 'phone', desc: '간편결제 앱' },
  { key: '무통장입금', icon: 'bank', desc: '계좌 이체' },
]

// 영등할망 굿즈샵 — IP를 상품으로 확장해 본 가상 상점(과제용). 실제 결제·배송·개인정보 수집은 없다.
export default function Shop() {
  const { cart, addToCart, setQty, removeFromCart, placeOrder, orders, ordersLoading, loadOrders, nickname } = useAppStore()
  const [checkout, setCheckout] = useState(false)
  const [method, setMethod] = useState(METHODS[0].key)
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(null) // 방금 주문한 내역

  useEffect(() => { loadOrders() }, [nickname, loadOrders])

  const lines = cart.map((c) => ({ ...c, g: goodsById[c.id] })).filter((l) => l.g)
  const total = lines.reduce((a, l) => a + l.g.price * l.qty, 0)

  async function pay() {
    setPaying(true)
    await new Promise((r) => setTimeout(r, 900)) // 결제 중 느낌 (모의)
    const order = await placeOrder(method)
    setPaying(false)
    if (order) { setCheckout(false); setDone(order) }
  }

  return (
    <>
      <PageHeader icon="bag-heart" title="영등할망 굿즈샵" subtitle="바람의 신 영등할망 이야기를 담은 굿즈 — 마음에 드는 굿즈를 담아 주문해 보세요" />
      <Row className="g-4">
        <Col lg={8}>
          <Row xs={2} md={2} xl={3} className="g-3">
            {GOODS.map((g) => (
              <Col key={g.id}>
                <div className="goods-card">
                  <div className="art-wrap">
                    <GoodsArt art={g.art} />
                    {g.tag && <span className="goods-tag">{g.tag}</span>}
                  </div>
                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <div className="fw-bold">{g.name}</div>
                    <div className="small text-muted mb-2 flex-grow-1">{g.desc}</div>
                    <div className="d-flex align-items-center justify-content-between">
                      <b>{won(g.price)}</b>
                      <Button size="sm" variant="outline-primary" onClick={() => addToCart(g.id)}><i className="bi bi-bag-plus me-1" />담기</Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <section className="mt-5">
            <h5 className="fw-bold mb-3"><i className="bi bi-receipt me-2 text-primary" />내 주문 내역 <small className="text-muted fw-normal">{nickname || '익명'}</small></h5>
            {ordersLoading ? <div className="text-muted small">불러오는 중…</div> : orders.length === 0 ? (
              <Empty text="아직 주문이 없어요. 굿즈를 담고 주문해 보세요" />
            ) : (
              <div className="d-flex flex-column gap-2">
                {orders.map((o) => (
                  <div key={o.id} className="p-3 border rounded-3">
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                      <b>주문번호 YD-{String(o.id).padStart(5, '0')}</b>
                      <span className="text-muted small">{new Date(o.created_at).toLocaleString('ko-KR')} · {o.method}</span>
                    </div>
                    <div className="small text-muted mt-1">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</div>
                    <div className="fw-bold mt-1">{won(o.total)} <Badge bg="secondary" className="fw-normal ms-1">결제 완료</Badge></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Col>

        <Col lg={4}>
          <aside className="cart-panel">
            <div className="fw-bold mb-2"><i className="bi bi-bag-heart me-1" />장바구니 <small className="text-muted fw-normal">{cart.reduce((a, c) => a + c.qty, 0)}개</small></div>
            {lines.length === 0 ? (
              <p className="small text-muted mb-0">마음에 드는 굿즈의 "담기"를 눌러 보세요.</p>
            ) : (
              <>
                {lines.map((l) => (
                  <div key={l.id} className="cart-row">
                    <GoodsArt art={l.g.art} />
                    <div className="flex-grow-1 min-w-0">
                      <div className="small fw-bold text-truncate">{l.g.name}</div>
                      <div className="small text-muted">{won(l.g.price)}</div>
                      <span className="qty">
                        <button type="button" aria-label="수량 줄이기" onClick={() => setQty(l.id, l.qty - 1)}>−</button>
                        <span>{l.qty}</span>
                        <button type="button" aria-label="수량 늘리기" onClick={() => setQty(l.id, l.qty + 1)}>+</button>
                      </span>
                    </div>
                    <button type="button" className="basket-x" aria-label={`${l.g.name} 빼기`} onClick={() => removeFromCart(l.id)}><i className="bi bi-x-lg" /></button>
                  </div>
                ))}
                <div className="d-flex justify-content-between align-items-baseline mt-3 mb-2">
                  <span className="text-muted">합계</span><b className="fs-5">{won(total)}</b>
                </div>
                <Button className="w-100" onClick={() => setCheckout(true)}><i className="bi bi-credit-card me-1" />결제하기</Button>
              </>
            )}
          </aside>
        </Col>
      </Row>

      {cart.length > 0 && <div className="d-lg-none" style={{ height: 64 }} />}
      {cart.length > 0 && (
        <button type="button" className="basket-bar d-lg-none" onClick={() => document.querySelector('.cart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
          <span><i className="bi bi-bag-heart me-1" />{cart.reduce((a, c) => a + c.qty, 0)}개 · {won(total)}</span>
          <b>장바구니 보기 <i className="bi bi-arrow-down" /></b>
        </button>
      )}

      <p className="small text-muted text-center mt-5 mb-0">※ 제주 문화 IP 과제 프로젝트의 가상 상점이에요. 상품은 시안이며 실제 결제·배송은 이루어지지 않아요.</p>

      {/* 결제 창 */}
      <Modal show={checkout} onHide={() => !paying && setCheckout(false)} centered>
        <Modal.Header closeButton={!paying}><Modal.Title className="fs-5">결제</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            {lines.map((l) => <div key={l.id} className="d-flex justify-content-between small"><span>{l.g.name} × {l.qty}</span><span>{won(l.g.price * l.qty)}</span></div>)}
            <hr />
            <div className="d-flex justify-content-between fw-bold"><span>결제 금액</span><span>{won(total)}</span></div>
          </div>
          <div className="fw-bold small mb-2">결제 수단 선택</div>
          <div className="d-flex flex-column gap-2">
            {METHODS.map((m) => (
              <label key={m.key} className={`pay-option ${method === m.key ? 'on' : ''}`}>
                <input type="radio" name="method" checked={method === m.key} onChange={() => setMethod(m.key)} />
                <i className={`bi bi-${m.icon} fs-5`} />
                <div><div>{m.key}</div><div className="small text-muted">{m.desc}</div></div>
              </label>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" disabled={paying} onClick={() => setCheckout(false)}>취소</Button>
          <Button disabled={paying || !lines.length} onClick={pay}>{paying ? '결제 처리 중…' : `${won(total)} 결제하기`}</Button>
        </Modal.Footer>
      </Modal>

      {/* 주문 완료 */}
      <Modal show={!!done} onHide={() => setDone(null)} centered>
        <Modal.Body className="text-center py-4">
          <div className="fs-1 mb-2">🎉</div>
          <h5 className="fw-bold">주문이 완료됐어요</h5>
          {done && (
            <>
              <div className="text-muted mb-3">주문번호 <b>YD-{String(done.id).padStart(5, '0')}</b> · {done.method}</div>
              <div className="text-start small border rounded-3 p-3 mb-3">
                {done.items.map((i) => <div key={i.id} className="d-flex justify-content-between"><span>{i.name} × {i.qty}</span><span>{won(i.price * i.qty)}</span></div>)}
                <hr className="my-2" />
                <div className="d-flex justify-content-between fw-bold"><span>합계</span><span>{won(done.total)}</span></div>
              </div>
              <div className="small text-muted mb-3">주문 내역은 "내 주문 내역"에서 다시 볼 수 있어요.</div>
            </>
          )}
          <Button onClick={() => setDone(null)}>확인</Button>
        </Modal.Body>
      </Modal>
    </>
  )
}
