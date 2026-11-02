import { useState } from 'react'
import { Button, Dropdown, Form } from 'react-bootstrap'
import { useAppStore } from '../store/useAppStore'

// 오른쪽 위 닉네임 메뉴: 누르면 닉네임을 정하거나 바꿀 수 있다. 즐겨찾기는 이 닉네임별로 Supabase 에 저장된다.
// (정하지 않으면 모두 "익명" 이름으로 함께 저장되므로, 나만의 즐겨찾기를 쓰려면 닉네임을 정하는 게 좋다)
export default function NicknameMenu() {
  const nickname = useAppStore((s) => s.nickname)
  const setNickname = useAppStore((s) => s.setNickname)
  const toast = useAppStore((s) => s.toast)
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)

  function submit(e) {
    e.preventDefault()
    setNickname(draft)
    setOpen(false)
    toast(draft.trim() ? `닉네임을 ‘${draft.trim()}’(으)로 바꿨어요` : '닉네임을 지웠어요. 이제 ‘익명’으로 저장돼요', 'info')
  }

  return (
    <Dropdown align="end" show={open} onToggle={(next) => { if (next) setDraft(nickname); setOpen(next) }}>
      <Dropdown.Toggle variant="link" className="nick-toggle text-decoration-none">
        <i className="bi bi-person-circle me-1" />{nickname || '닉네임 설정'}
      </Dropdown.Toggle>
      <Dropdown.Menu className="p-3" style={{ minWidth: 260 }}>
        <Form onSubmit={submit}>
          <Form.Label className="small fw-bold mb-1">닉네임</Form.Label>
          <Form.Control size="sm" autoFocus maxLength={20} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="예: 바람이" />
          <Form.Text className="d-block mb-2">즐겨찾기는 이 닉네임별로 저장돼요. 비워 두면 ‘익명’으로 저장돼요.</Form.Text>
          <Button type="submit" size="sm" className="w-100">저장</Button>
        </Form>
      </Dropdown.Menu>
    </Dropdown>
  )
}
