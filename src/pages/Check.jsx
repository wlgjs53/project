import { useEffect, useState } from 'react'
import { Badge, Card, Col, Form, Row } from 'react-bootstrap'
import { ping } from '../api/client'
import { isSupabaseReady, supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import WeatherBadge from '../components/WeatherBadge'

// 동작 체크 대시보드 (스타터의 원래 홈). 개발 중 연결 상태 확인용 — /check
export default function Check() {
  const nickname = useAppStore((s) => s.nickname)
  const setNickname = useAppStore((s) => s.setNickname)
  const [db, setDb] = useState(isSupabaseReady
    ? { state: 'wait', msg: '확인 중...' }
    : { state: 'fail', msg: '.env.local 에 VITE_SUPABASE_URL / ANON_KEY 를 넣으세요' })
  const [api, setApi] = useState({ state: 'wait', msg: '확인 중...' })

  useEffect(() => {
    // ① Supabase 연결 확인
    if (isSupabaseReady) supabase.from('favorites').select('id').limit(1).then(({ error }) =>
      setDb(error ? { state: 'fail', msg: error.message } : { state: 'ok', msg: '연결 OK' }))

    // ② 서버 함수(/api) 확인
    ping()
      .then((d) => setApi({ state: 'ok', msg: `OK · 공공데이터 키 ${d.hasDataKey ? '있음' : '없음'} · Claude 키 ${d.hasClaudeKey ? '있음' : '없음'}` }))
      .catch(() => setApi({ state: 'fail', msg: 'npm run dev 가 아니라 vercel dev 로 실행했는지 확인' }))
  }, [])

  return (
    <>
      <section className="hero rounded-4 p-4 p-md-5 mb-4">
        <Badge bg="light" text="dark" className="mb-3">개발용</Badge>
        <h1 className="fw-bold">동작 체크</h1>
        <p className="lead">연결 상태가 모두 초록색이면 다음 단계로 넘어갈 수 있습니다.</p>
        <WeatherBadge place="서귀포시" />
      </section>

      <Row xs={1} md={3} className="g-3">
        <Col><Item title="React · 라우터" state="ok" msg="이 화면이 보이면 OK" /></Col>
        <Col><Item title="Supabase" {...db} /></Col>
        <Col><Item title="서버 함수 /api" {...api} /></Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title className="fs-6 fw-bold"><i className="bi bi-database me-2" />Store(Zustand) 확인</Card.Title>
          <Form.Control placeholder="닉네임을 입력하세요" value={nickname}
            onChange={(e) => setNickname(e.target.value)} style={{ maxWidth: 320 }} />
          <Form.Text>입력하면 오른쪽 위 메뉴에도 바로 보이고, 새로고침해도 남아 있습니다.</Form.Text>
        </Card.Body>
      </Card>
    </>
  )
}

function Item({ title, state, msg }) {
  const icon = { ok: 'check-circle-fill text-success', fail: 'x-circle-fill text-danger', wait: 'hourglass-split text-muted' }[state]
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="fw-bold mb-1"><i className={`bi bi-${icon} me-2`} />{title}</div>
        <div className="small text-muted">{msg}</div>
      </Card.Body>
    </Card>
  )
}
