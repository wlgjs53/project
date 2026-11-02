import { Link } from 'react-router-dom'
import { kakaoRoute, kakaoTo } from '../lib/nav'

// 바람길 지도 위의 "동선 안내" 패널: 어떤 동선을 볼지 고르고, 방문 순서·구간별 이동(실제 도로)·카카오맵 길찾기를 보여 준다.
// kinds: [{ key, label, disabled }], stops: [{ title, sub?, lat, lng }], legs: [{ distance(m), duration(초) }] | null
export default function RoutePanel({ kind, kinds, onKind, stops, legs, loading, onClose }) {
  const sumMin = legs ? Math.round(legs.reduce((a, l) => a + l.duration, 0) / 60) : null
  const sumKm = legs ? legs.reduce((a, l) => a + l.distance, 0) / 1000 : null

  return (
    <aside className="w-route">
      <div className="d-flex align-items-center mb-2">
        <b className="me-auto"><i className="bi bi-signpost-split me-1" />동선 안내</b>
        <button type="button" className="w-route-x" onClick={onClose} aria-label="닫기"><i className="bi bi-x-lg" /></button>
      </div>

      <div className="d-flex gap-2 mb-3">
        {kinds.map((k) => (
          <button key={k.key} type="button" className={`w-btn sm${kind === k.key ? ' on' : ''}`} disabled={k.disabled} onClick={() => onKind(k.key)}>{k.label}</button>
        ))}
      </div>

      {stops.length < 2 ? (
        <p className="small opacity-75 mb-0">
          아직 만든 코스가 없어요. 할망따라에서 코스를 만들면 여기서 3D 지도로 동선을 볼 수 있어요.
          <Link to="/course" className="w-btn sm mt-2 d-inline-block">할망따라 코스 만들기</Link>
        </p>
      ) : (
        <>
          <div className="small opacity-75 mb-2">
            {loading ? '도로 경로를 불러오는 중…' : legs ? `${stops.length}곳 · 차로 약 ${sumMin}분 (${sumKm.toFixed(0)}km)` : `${stops.length}곳 · 도로 경로를 불러오지 못해 직선으로 이었어요`}
          </div>
          <ol className="w-route-list">
            {stops.map((s, i) => (
              <li key={`${s.title}-${i}`}>
                {i > 0 && (
                  <div className="leg">
                    <span>{legs?.[i - 1] ? `${Math.round(legs[i - 1].duration / 60)}분 · ${(legs[i - 1].distance / 1000).toFixed(1)}km` : '이동'}</span>
                    <span className="links">
                      <a href={kakaoRoute('car', stops[i - 1], s)} target="_blank" rel="noreferrer">자동차</a>
                      <a href={kakaoRoute('traffic', stops[i - 1], s)} target="_blank" rel="noreferrer">대중교통</a>
                      <a href={kakaoRoute('walk', stops[i - 1], s)} target="_blank" rel="noreferrer">도보</a>
                    </span>
                  </div>
                )}
                <div className="stop"><span className="no">{i + 1}</span><div className="min-w-0"><div className="t">{s.title}</div>{s.sub && <small className="opacity-75">{s.sub}</small>}</div></div>
              </li>
            ))}
          </ol>
          <a className="w-btn sm mt-2" href={kakaoTo(stops[0])} target="_blank" rel="noreferrer"><i className="bi bi-cursor me-1" />내 위치에서 1번까지 길찾기</a>
        </>
      )}
    </aside>
  )
}
