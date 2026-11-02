import { useState } from 'react'
import { Button } from 'react-bootstrap'

// 되돌릴 수 없는 삭제용 버튼: 한 번 누르면 "정말 삭제할까요?"로 바뀌고, 한 번 더 눌러야 실행된다.
export default function ConfirmButton({ label, question = '정말 삭제할까요?', onConfirm, disabled, size = 'sm', className = '' }) {
  const [ask, setAsk] = useState(false)
  if (!ask) {
    return (
      <Button variant="outline-danger" size={size} className={className} disabled={disabled} onClick={() => setAsk(true)}>
        <i className="bi bi-trash me-1" />{label}
      </Button>
    )
  }
  return (
    <span className={`d-inline-flex align-items-center gap-2 ${className}`}>
      <small className="text-danger">{question}</small>
      <Button variant="danger" size={size} onClick={() => { setAsk(false); onConfirm() }}>삭제</Button>
      <Button variant="outline-secondary" size={size} onClick={() => setAsk(false)}>취소</Button>
    </span>
  )
}
