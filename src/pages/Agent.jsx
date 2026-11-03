import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/useAppStore'
import FavStar from '../components/FavStar'
import OreumImg from '../components/OreumImg'
import { useFavorites } from '../hooks/useFavorites'
import { findOreumPhoto, loadOreumPhotos } from '../lib/oreumPhoto'
import { kakaoTo } from '../lib/nav'

// 도구 이름 → 화면에 보일 한국어 이름 (에이전트가 무엇을 했는지 칩으로 보여 준다)
const TOOL_LABEL = {
  get_yeongdeung_stops: ['signpost-split', '영등 여정 확인'],
  get_weather: ['cloud-sun', '날씨·바람 확인'],
  search_nearby_places: ['geo-alt', '주변 장소 검색'],
  search_tour_places: ['search', '관광지·맛집 검색'],
  search_oreum: ['triangle', '오름 찾기'],
  search_heritage: ['bank', '국가유산 검색'],
}
const EXAMPLES = [
  '오늘 바람 기준으로 오르기 좋은 오름 3곳이랑 근처 맛집 알려줘',
  '오늘 바람이 센데 칠머리당 근처에서 바람을 피해 갈 만한 곳이랑 점심 먹을 곳 알려줘',
  '칠머리당영등굿이 뭐야? 국가유산 정보도 알려줘',
]

// **굵게** 와 줄바꿈만 처리하는 가벼운 글자 꾸미기 (HTML 을 직접 넣지 않아 안전하다)
function RichText({ text }) {
  return text.split('\n').map((line, i) => (
    <p key={i} className="mb-1">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part))}
    </p>
  ))
}

// 에이전트가 부른 도구들: 칩으로 요약하고, 펼치면 호출한 도구·입력값·결과 개수(호출 내역)를 그대로 보여 준다.
function ToolSteps({ steps }) {
  return (
    <details className="agent-steps">
      <summary>
        <i className="bi bi-tools me-1" />도구 {steps.length}번 사용
        {steps.map((s, i) => {
          const [icon, label] = TOOL_LABEL[s.tool] ?? ['gear', s.tool]
          return <span key={i} className="agent-chip"><i className={`bi bi-${icon} me-1`} />{label} {s.count}건</span>
        })}
      </summary>
      <ol className="agent-log">
        {steps.map((s, i) => <li key={i}><code>{s.tool}({JSON.stringify(s.args)})</code> → {s.count}건</li>)}
      </ol>
    </details>
  )
}

// 에이전트가 추천한 장소를 사진 카드로 — 오름은 우리가 모아 둔 오름 사진, 명소·맛집은 TourAPI 사진. ★로 바로 담고 지도·길찾기로 이어진다.
function PlaceCards({ cards }) {
  const { isFav, toggle } = useFavorites()
  const [photos, setPhotos] = useState([])
  useEffect(() => { loadOreumPhotos().then(setPhotos) }, [])
  return (
    <div className="agent-cards">
      {cards.map((c) => {
        const oreum = c.kind === 'oreum'
        const photo = oreum ? findOreumPhoto(photos, c) : null
        const src = oreum ? 'oreum' : 'tour'
        return (
          <div key={`${c.kind}:${c.id}`} className="agent-card">
            <div className="agent-card-img">
              {oreum ? (photo?.image ? <OreumImg photo={photo} alt={c.title} /> : <span className="agent-card-ph"><i className="bi bi-triangle" /></span>) : <img src={c.image} alt={c.title} loading="lazy" />}
              <FavStar saved={isFav(src, c.id)} onToggle={() => toggle({ source: src, id: c.id, title: c.title })} />
            </div>
            <div className="p-2">
              <div className="fw-bold text-truncate">{c.title}</div>
              <div className="small text-muted text-truncate">{oreum && c.height ? `표고 ${c.height}m · ` : ''}{c.addr}</div>
              {oreum
                ? <Link to={`/?oreum=${encodeURIComponent(c.id)}`} className="small">바람길 지도에서 보기</Link>
                : <a href={kakaoTo(c)} target="_blank" rel="noreferrer" className="small">길찾기</a>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Agent() {
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const clearMessages = useAppStore((s) => s.clearMessages)
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, loading])

  function send(text) {
    if (!text.trim() || loading) return
    sendMessage(text)
    setInput('')
  }

  return (
    <>
      <PageHeader icon="robot" title="영등할망 가이드" subtitle="오늘의 바람과 공공데이터 API를 도구로 써서 명소·맛집·오름 코스를 안내하는 에이전트" />

      <div className="chat-box mb-3">
        {messages.length === 0 && (
          <div className="agent-empty">
            <div className="mb-2 text-muted">이런 걸 물어볼 수 있어요</div>
            <div className="d-flex flex-column gap-2">
              {EXAMPLES.map((q) => (
                <button key={q} type="button" className="agent-example" disabled={loading} onClick={() => send(q)}>
                  <i className="bi bi-chat-left-text me-2" />{q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}${m.error ? ' error' : ''}`}>
            {m.steps?.length > 0 && <ToolSteps steps={m.steps} />}
            {m.error && <i className="bi bi-exclamation-triangle me-1" />}
            {m.role === 'assistant' ? <RichText text={m.text} /> : m.text}
            {m.cards?.length > 0 && <PlaceCards cards={m.cards} />}
          </div>
        ))}
        {loading && <div className="msg assistant"><Spinner size="sm" className="me-2" />에이전트가 도구를 사용하는 중...</div>}
        <div ref={endRef} />
      </div>

      <Form onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <InputGroup>
          <Form.Control value={input} onChange={(e) => setInput(e.target.value)} placeholder="질문을 입력하세요" disabled={loading} />
          <Button type="submit" disabled={loading || !input.trim()}><i className="bi bi-send" /></Button>
        </InputGroup>
      </Form>
      {messages.length > 0 && (
        <div className="text-end mt-2">
          <Button variant="link" size="sm" className="text-muted text-decoration-none" disabled={loading} onClick={clearMessages}><i className="bi bi-arrow-counterclockwise me-1" />대화 지우기</Button>
        </div>
      )}
    </>
  )
}
