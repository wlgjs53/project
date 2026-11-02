import { useState } from 'react'
import { Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/useAppStore'

export default function Agent() {
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const [input, setInput] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <>
      <PageHeader icon="robot" title="영등할망 가이드" subtitle="오늘의 바람과 공공데이터 API를 도구로 써서 명소·맛집 코스를 안내하는 에이전트" />
      <Card className="chat-box mb-3">
        <Card.Body>
          {messages.length === 0 && <div className="text-muted">예) 오늘 바람이 센데 칠머리당 근처에서 바람을 피해 갈 만한 곳이랑 점심 먹을 곳 알려줘</div>}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.steps?.length > 0 && (
                <div className="small text-muted mb-1">
                  <i className="bi bi-tools me-1" />
                  {m.steps.map((s) => `${s.tool}(${JSON.stringify(s.args)}) → ${s.count}건`).join(' · ')}
                </div>
              )}
              {m.text}
            </div>
          ))}
          {loading && <div className="small text-muted"><Spinner size="sm" className="me-2" />에이전트가 도구를 사용하는 중...</div>}
        </Card.Body>
      </Card>
      <Form onSubmit={onSubmit}>
        <InputGroup>
          <Form.Control value={input} onChange={(e) => setInput(e.target.value)} placeholder="질문을 입력하세요" />
          <Button type="submit" disabled={loading}><i className="bi bi-send" /></Button>
        </InputGroup>
      </Form>
    </>
  )
}
