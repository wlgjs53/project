import { Link } from 'react-router-dom'
import { Badge, Col, Row } from 'react-bootstrap'
import { useAppStore } from '../store/useAppStore'
import { useFavoriteMeta } from '../hooks/useFavoriteMeta'
import { MAX_PLACES } from '../lib/course'

const KIND = { oreum: '오름', heritage: '유산', tour: '명소' }

// 명소·맛집 / 영등굿·유산 / 바람따라 오름 화면 오른쪽에 붙는 "장바구니":
// ★로 담은 곳이 바로 보이고, 거기서 곧장 할망따라 코스를 만들 수 있다. 좁은 화면에서는 아래에 떠 있는 바로 바뀐다.
export default function BasketLayout({ children }) {
  const favorites = useAppStore((s) => s.favorites)
  const removeFavorite = useAppStore((s) => s.removeFavorite)
  const { meta } = useFavoriteMeta(favorites)
  const usable = favorites.filter((f) => f.source !== 'heritage').length // 위치 정보가 있어 코스에 쓸 수 있는 곳

  return (
    <Row className="g-4">
      <Col lg={9}>
        {children}
        {favorites.length > 0 && <div className="d-lg-none" style={{ height: 64 }} />}
      </Col>

      <Col lg={3} className="d-none d-lg-block">
        <aside className="basket">
          <div className="fw-bold mb-2"><i className="bi bi-star-fill text-warning me-1" />내 바구니 <small className="text-muted fw-normal">{favorites.length}곳</small></div>
          {favorites.length === 0 ? (
            <p className="small text-muted mb-0">마음에 드는 곳의 ★를 눌러 담아 보세요. 담은 곳으로 내 즐겨찾기에서 오늘의 바람에 맞는 하루 코스를 만들 수 있어요.</p>
          ) : (
            <>
              <ul className="basket-list">
                {favorites.map((f) => {
                  const m = meta[`${f.source}:${f.item_id}`]
                  return (
                    <li key={f.id}>
                      {m?.image ? <img src={m.image} alt="" referrerPolicy="no-referrer" /> : <span className="basket-ph"><i className="bi bi-image" /></span>}
                      <div className="min-w-0 flex-grow-1">
                        <div className="t">{f.title}</div>
                        <Badge bg="secondary" className="fw-normal">{f.source === 'tour' ? (m?.type === '39' ? '맛집' : '명소') : KIND[f.source]}</Badge>
                      </div>
                      <button type="button" className="basket-x" aria-label={`${f.title} 빼기`} onClick={() => removeFavorite(f)}><i className="bi bi-x-lg" /></button>
                    </li>
                  )
                })}
              </ul>
              {usable > 0 ? (
                <Link to="/my" className="btn btn-primary btn-sm w-100 mt-2"><i className="bi bi-signpost-split me-1" />이 {Math.min(usable, MAX_PLACES)}곳으로 코스 만들기</Link>
              ) : (
                <p className="small text-muted mt-2 mb-0">국가유산은 위치 정보가 없어 코스에는 들어가지 않아요.</p>
              )}
              <Link to="/my" className="d-block text-center small mt-2">내 즐겨찾기 전체 보기</Link>
            </>
          )}
        </aside>
      </Col>

      {favorites.length > 0 && (
        <Link to="/my" className="basket-bar d-lg-none">
          <span><i className="bi bi-star-fill text-warning me-1" />{favorites.length}곳 담았어요</span>
          <b>{usable > 0 ? '코스 만들기' : '내 즐겨찾기 보기'} <i className="bi bi-arrow-right" /></b>
        </Link>
      )}
    </Row>
  )
}
