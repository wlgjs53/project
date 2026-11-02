import { useState } from 'react'
import { Badge, Button, Card } from 'react-bootstrap'
import FavStar from './FavStar'

// 관광지·유산·즐겨찾기 등 "목록의 한 칸"을 모두 이 카드 하나로 표시합니다 (재사용 컴포넌트)
// description: 카드에 보여 줄 짧은 설명, onOpen: "자세히 보기" 버튼(상세 화면 열기)
// onSave: 즐겨찾기 ★ (사진 오른쪽 위 — 다른 모든 카드와 같은 모양, saved 이면 채워진 별, 다시 누르면 빼기) / onRemove: 삭제 버튼(즐겨찾기 목록용)
export default function ItemCard({ title, subtitle, description, image, badge, saved = false, extra, onSave, onOpen, onRemove }) {
  const [broken, setBroken] = useState(false) // 사진 주소가 깨졌을 때 빈 칸 대신 자리표시
  return (
    <Card className="h-100 item-card">
      <div className="position-relative">
        {image && !broken
          ? <Card.Img variant="top" src={image} alt={title} className="item-card-img" loading="lazy" onError={() => setBroken(true)} />
          : <div className="item-card-img placeholder-img"><i className="bi bi-image" /></div>}
        {onSave && <FavStar saved={saved} onToggle={onSave} />}
      </div>
      <Card.Body className="d-flex flex-column">
        {badge && <Badge bg="secondary" className="align-self-start mb-2">{badge}</Badge>}
        <Card.Title className="fs-6 fw-bold">{title}</Card.Title>
        {subtitle && <Card.Text className="small text-muted mb-2">{subtitle}</Card.Text>}
        {extra && <div className="mb-2">{extra}</div>}
        {description && <Card.Text className="small">{description}</Card.Text>}
        {(onOpen || onRemove) && (
          <div className="mt-auto d-flex gap-2">
            {onOpen && (
              <Button size="sm" variant="primary" className="flex-fill" onClick={onOpen}>
                <i className="bi bi-card-text me-1" />자세히 보기
              </Button>
            )}
            {onRemove && (
              <Button size="sm" variant="outline-danger" className="flex-fill" onClick={onRemove}>
                <i className="bi bi-trash me-1" />삭제
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
