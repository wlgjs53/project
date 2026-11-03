import { rainInfo } from '../lib/wind'

// 오늘의 비 정보 한 줄 (강수확률·강수량 + 야외 활동 조언). 오름·해안 명소는 비에 영향이 크다.
// rain: { pop, rainMm, pcp, type } — 없으면 아무것도 보여 주지 않는다.
export default function RainNote({ rain, className = '' }) {
  const info = rainInfo(rain)
  if (!info) return null
  return (
    <div className={`rain-note ${info.level} ${className}`}>
      <i className={`bi bi-${info.level === 'dry' ? 'sun' : 'cloud-rain-heavy'} me-1`} />
      <b>{info.text}</b> · {info.tip}
    </div>
  )
}
