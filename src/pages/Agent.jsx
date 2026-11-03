import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import FavStar from '../components/FavStar'
import OreumImg from '../components/OreumImg'
import { useAppStore } from '../store/useAppStore'
import { useFavorites } from '../hooks/useFavorites'
import { findOreumPhoto, loadOreumPhotos } from '../lib/oreumPhoto'
import { kakaoTo } from '../lib/nav'

// 도구 이름 → [아이콘, 화면에 보일 한국어 이름, 데이터 출처]
const TOOL = {
  get_yeongdeung_stops: ['signpost-split', '영등 여정', '영등할망 여정 3곳'],
  get_weather: ['cloud-sun', '날씨·바람', '기상청 단기예보'],
  search_nearby_places: ['geo-alt', '주변 검색', '한국관광공사 TourAPI'],
  search_tour_places: ['search', '장소 검색', '한국관광공사 TourAPI'],
  search_oreum: ['triangle', '오름 찾기', '제주오름요약설명'],
  search_heritage: ['bank', '국가유산', '국가유산청'],
}
const EXAMPLES = [
  { icon: 'triangle', title: '오늘 오르기 좋은 오름', q: '오늘 바람 기준으로 오르기 좋은 오름 3곳이랑 근처 맛집 알려줘' },
  { icon: 'wind', title: '바람 센 날 코스', q: '오늘 바람이 센데 칠머리당 근처에서 바람을 피해 갈 만한 곳이랑 점심 먹을 곳 알려줘' },
  { icon: 'bank', title: '영등굿 알아보기', q: '칠머리당영등굿이 뭐야? 국가유산 정보도 알려줘' },
]

// 글자 꾸미기: **굵게**, "- " 목록, "1. " 번호 목록, 줄바꿈 (HTML 을 직접 넣지 않아 안전하다)
const bold = (line) => line.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p))
function RichText({ text }) {
  const blocks = []
  for (const line of text.split('\n')) {
    const li = line.match(/^\s*(?:[-•]|\d+[.)])\s+(.*)$/)
    const ordered = /^\s*\d+[.)]\s/.test(line)
    if (li) {
      const last = blocks.at(-1)
      if (last?.list && last.ordered === ordered) last.items.push(li[1])
      else blocks.push({ list: true, ordered, items: [li[1]] })
    } else if (line.trim()) blocks.push({ text: line })
  }
  return blocks.map((b, i) => {
    if (!b.list) return <p key={i} className="mb-2">{bold(b.text)}</p>
    const L = b.ordered ? 'ol' : 'ul'
    return <L key={i} className="agent-list">{b.items.map((t, k) => <li key={k}>{bold(t)}</li>)}</L>
  })
}

// 사용한 데이터를 작은 칩으로 (같은 도구는 묶어서 ×횟수). 펼치면 실제 호출 내역(도구·입력값·결과 개수)이 나온다.
function ToolSteps({ steps }) {
  const grouped = []
  for (const s of steps) {
    const g = grouped.find((x) => x.tool === s.tool)
    if (g) { g.times += 1; g.count += s.count } else grouped.push({ tool: s.tool, times: 1, count: s.count })
  }
  const sources = [...new Set(grouped.map((g) => TOOL[g.tool]?.[2]).filter(Boolean))]
  return (
    <details className="agent-steps">
      <summary>
        {grouped.map((g) => {
          const [icon, label] = TOOL[g.tool] ?? ['gear', g.tool]
          return <span key={g.tool} className="agent-chip"><i className={`bi bi-${icon}`} />{label}{g.times > 1 && <em>×{g.times}</em>}</span>
        })}
        <span className="agent-more">호출 내역 <i className="bi bi-chevron-down" /></span>
      </summary>
      <ol className="agent-log">
        {steps.map((s, i) => <li key={i}><code>{s.tool}({JSON.stringify(s.args)})</code> → {s.count}건</li>)}
      </ol>
      {sources.length > 0 && <div className="agent-src">출처: {sources.join(' · ')}</div>}
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
        const label = oreum ? '오름' : c.type === '39' ? '맛집' : '명소'
        const meta = oreum ? (c.height ? `표고 ${Math.round(c.height)}m` : '') : c.dist ? `${c.dist >= 1000 ? `${(c.dist / 1000).toFixed(1)}km` : `${Math.round(c.dist)}m`} 거리` : ''
        return (
          <div key={`${c.kind}:${c.id}`} className="agent-card">
            <div className="agent-card-img">
              {oreum ? (photo?.image ? <OreumImg photo={photo} alt={c.title} /> : <span className="agent-card-ph"><i className="bi bi-triangle" /></span>) : <img src={c.image} alt={c.title} loading="lazy" />}
              <span className={`agent-card-kind ${oreum ? 'oreum' : c.type === '39' ? 'food' : ''}`}>{label}</span>
              <FavStar saved={isFav(src, c.id)} onToggle={() => toggle({ source: src, id: c.id, title: c.title })} />
            </div>
            <div className="agent-card-body">
              <div className="agent-card-title">{c.title}</div>
              <div className="agent-card-sub">{[meta, c.addr?.replace('제주특별자치도 ', '')].filter(Boolean).join(' · ')}</div>
              {oreum
                ? <Link to={`/?oreum=${encodeURIComponent(c.id)}`} className="agent-card-btn"><i className="bi bi-wind" />지도에서 보기</Link>
                : <a href={kakaoTo(c)} target="_blank" rel="noreferrer" className="agent-card-btn"><i className="bi bi-cursor" />길찾기</a>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Message({ m, showSteps }) {
  if (m.role === 'user') return <div className="msg user">{m.text}</div>
  return (
    <div className="msg-row">
      <span className="agent-avatar"><i className="bi bi-wind" /></span>
      <div className={`msg assistant${m.error ? ' error' : ''}`}>
        {showSteps && m.steps?.length > 0 && <ToolSteps steps={m.steps} />}
        {m.error && <i className="bi bi-exclamation-triangle me-1" />}
        <RichText text={m.text} />
        {m.cards?.length > 0 && <PlaceCards cards={m.cards} />}
      </div>
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
  // 사용한 도구·호출 내역은 손님에게는 필요 없어서 기본으로 숨기고, 아래 스위치로 켤 수 있다(평가·시연 때 "호출 내역"을 보여 주기 위함). 선택은 브라우저에 기억한다.
  const [showSteps, setShowSteps] = useState(() => { try { return localStorage.getItem('agent-show-steps') === '1' } catch { return false } })
  const toggleSteps = () => setShowSteps((v) => { const next = !v; try { localStorage.setItem('agent-show-steps', next ? '1' : '0') } catch { /* 저장 못 해도 동작에는 문제 없음 */ } return next })

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, loading])

  function send(text) {
    if (!text.trim() || loading) return
    sendMessage(text)
    setInput('')
  }

  return (
    <>
      <PageHeader icon="robot" title="영등할망 가이드" subtitle="오늘의 바람·비와 공공데이터로 명소·맛집·오름 코스를 안내하는 에이전트" />

      <div className="chat-box mb-3">
        {messages.length === 0 && (
          <div className="agent-empty">
            <div className="agent-hello">
              <span className="agent-avatar lg"><i className="bi bi-wind" /></span>
              <div>
                <div className="fw-bold">안녕하세요, 영등할망 가이드예요.</div>
                <div className="small text-muted">오늘의 바람과 비, 제주 명소·맛집·오름 정보를 찾아서 알려 드려요.</div>
              </div>
            </div>
            <div className="agent-examples">
              {EXAMPLES.map((e) => (
                <button key={e.q} type="button" className="agent-example" disabled={loading} onClick={() => send(e.q)}>
                  <i className={`bi bi-${e.icon}`} />
                  <b>{e.title}</b>
                  <span>{e.q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <Message key={i} m={m} showSteps={showSteps} />)}
        {loading && (
          <div className="msg-row">
            <span className="agent-avatar"><i className="bi bi-wind" /></span>
            <div className="msg assistant agent-typing"><span /><span /><span /><small>날씨와 장소를 찾는 중…</small></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="agent-input" onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="무엇이든 물어보세요 (예: 오늘 비 오는데 갈 만한 곳)" disabled={loading} />
        <button type="submit" disabled={loading || !input.trim()} aria-label="보내기"><i className="bi bi-send-fill" /></button>
      </form>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <label className="agent-dev" title="에이전트가 어떤 도구를 몇 번 호출했는지 답변 위에 보여 줍니다 (개발·평가용)">
          <input type="checkbox" checked={showSteps} onChange={toggleSteps} /> 호출 내역 보기 <small>(개발자용)</small>
        </label>
        {messages.length > 0 && <button type="button" className="agent-clear" disabled={loading} onClick={clearMessages}><i className="bi bi-arrow-counterclockwise me-1" />새 대화</button>}
      </div>
    </>
  )
}
