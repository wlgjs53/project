import { dirName } from '../lib/geo'
import { PRESETS } from '../data/story'

// 풍속·풍향 슬라이더와 프리셋 (실제 데이터 연결 전 체험용)
// live: 기상청 실제 바람 {speed, dir} 이 있으면 "지금 실제 바람" 버튼을 보여 준다
export default function WindControls({ wind, onChange, live = null }) {
  const round = (v) => Math.round(v * 10) / 10
  return (
    <div className="w-ctrl">
      <label>풍속 <b>{round(wind.speed)} m/s</b></label>
      <input type="range" min="0" max="25" step="0.5" value={wind.speed}
        onChange={(e) => onChange({ ...wind, speed: +e.target.value })} />
      <label>바람이 불어오는 방향 <b>{dirName(wind.dir)} {Math.round(wind.dir)}°</b></label>
      <input type="range" min="0" max="359" step="1" value={wind.dir}
        onChange={(e) => onChange({ ...wind, dir: +e.target.value })} />
      <div className="w-presets">
        {live && (
          <button type="button" className={`w-btn${live.speed === wind.speed && live.dir === wind.dir ? ' on' : ''}`} onClick={() => onChange({ speed: live.speed, dir: live.dir })}>
            <i className="bi bi-broadcast me-1" />지금 실제 바람
          </button>
        )}
        {PRESETS.map((p) => (
          <button key={p.label} type="button"
            className={`w-btn${p.speed === wind.speed && p.dir === wind.dir ? ' on' : ''}`}
            onClick={() => onChange({ speed: p.speed, dir: p.dir })}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
