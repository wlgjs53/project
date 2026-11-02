import { Modal } from 'react-bootstrap'
import { GUT_VIDEO } from '../data/story'

// 칠머리당영등굿 — UNESCO 공식 유튜브 영상. 이 창을 열었을 때만 불러오고(자동으로 미리 받지 않음), 닫으면 재생이 멈춘다.
export default function VideoModal({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">제주 칠머리당영등굿 — 유네스코 공식 영상</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="ratio ratio-16x9">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${GUT_VIDEO.id}?autoplay=1&rel=0`}
            title="Jeju Chilmeoridang Yeongdeunggut (UNESCO)"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </Modal.Body>
      <Modal.Footer className="small text-muted justify-content-between">
        <span>영상 © 2008 문화재청(현 국가유산청) · UNESCO 제공</span>
        <a href={GUT_VIDEO.page} target="_blank" rel="noopener noreferrer">유네스코 페이지에서 보기</a>
      </Modal.Footer>
    </Modal>
  )
}
