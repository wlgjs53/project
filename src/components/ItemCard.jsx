import { useState } from 'react'
import { Badge, Button, Card } from 'react-bootstrap'

// 관광지·유산·즐겨찾기 등 "목록의 한 칸"을 모두 이 카드 하나로 표시합니다 (재사용 컴포넌트)
// description: 카드에 보여 줄 짧은 설명, onOpen: "자세히 보기" 버튼(상세 화면 열기)
// onSave: 즐겨찾기 버튼 (saved 이면 채워진 별 + "저장됨", 다시 누르면 빼기) / onRemove: 삭제 버튼(즐겨찾기 목록용)
export default function ItemCard({ title, subtitle, description, image, badge, saved = false, extra, onSave, onOpen, onRemove }) {
  const [broken, setBroken] = useState(false) // 사진 주소가 깨졌을 때 빈 칸 대신 자리표시
  return (
    <Card className="h-100 item-card">
      {image && !broken
        ? <Card.Img variant="top" src={image} alt={title} className="item-card-img" loading="lazy" onError={() => setBroken(true)} />
        : <div className="item-card-img placeholder-img"><i className="bi bi-image" /></div>}
      <Card.Body className="d-flex flex-column">
        {badge && <Badge bg="secondary" className="align-self-start mb-2">{badge}</Badge>}
        <Card.Title className="fs-6 fw-bold">{title}</Card.Title>
        {subtitle && <Card.Text className="small text-muted mb-2">{subtitle}</Card.Text>}
        {extra && <div className="mb-2">{extra}</div>}
        {description && <Card.Text className="small">{description}</Card.Text>}
        {(onOpen || onSave || onRemove) && (
          <div className="mt-auto d-flex gap-2">
            {onOpen && (
              <Button size="sm" variant="primary" className="flex-fill" onClick={onOpen}>
                <i className="bi bi-card-text me-1" />자세히 보기
              </Button>
            )}
            {onSave && (
              <Button size="sm" variant={saved ? 'primary' : 'outline-primary'} className="flex-fill" onClick={onSave}>
                <i className={`bi bi-star${saved ? '-fill' : ''} me-1`} />{saved ? '저장됨' : '즐겨찾기'}
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
