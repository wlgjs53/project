import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Col, Form, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import ConfirmButton from '../components/ConfirmButton'
import { Empty, Loading } from '../components/Status'
import { useAppStore } from '../store/useAppStore'
import { useFavoriteMeta } from '../hooks/useFavoriteMeta'

const SOURCE = { tour: '명소·맛집', heritage: '국가유산' } // 저장된 출처 → 화면에 보일 이름

// 즐겨찾기 — store 의 favorites 를 보여 주고, 사진·주소는 항목 번호로 다시 불러온다. 카드의 삭제 버튼으로 뺄 수 있습니다 (STEP 5)
export default function My() {
  const { nickname, setNickname, favorites, favLoading, loadFavorites, removeFavorite, removeFavorites } = useAppStore()
  const { meta } = useFavoriteMeta(favorites)

  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])

  return (
    <>
      <PageHeader icon="star" title="내 즐겨찾기" subtitle="영등할망의 길목에서 담아 둔 명소·맛집·유산 — 닉네임별로 Supabase에 저장됩니다" />
      <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
        <Form.Control style={{ maxWidth: 320 }} placeholder="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        {favorites.length > 0 && (
          <Link to="/course" className="btn btn-primary"><i className="bi bi-signpost-split me-1" />할망따라 코스 만들기</Link>
        )}
        {favorites.length > 0 && (
          <ConfirmButton className="ms-auto" size="md" label={`전체 삭제 (${favorites.length})`}
            question={`즐겨찾기 ${favorites.length}곳을 모두 삭제할까요?`} onConfirm={() => removeFavorites(favorites)} />
        )}
      </div>
      {favLoading ? <Loading /> : favorites.length === 0 ? <Empty text="아직 저장한 항목이 없어요" /> : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {favorites.map((f) => {
            const m = meta[`${f.source}:${f.item_id}`]
            return (
              <Col key={f.id}>
                <ItemCard title={f.title} badge={SOURCE[f.source] ?? f.source} image={m?.image}
                  subtitle={m?.subtitle} description={`저장: ${new Date(f.created_at).toLocaleString('ko-KR')}`}
                  onRemove={() => removeFavorite(f)} />
              </Col>
            )
          })}
        </Row>
      )}
    </>
  )
}
