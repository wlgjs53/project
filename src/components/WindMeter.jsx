import { dirName } from '../lib/geo'

// 화면 왼쪽 아래의 현재 풍속·풍향 표시
export default function WindMeter({ wind, tag }) {
  return (
    <div className="w-meter">
      <div className="big">{wind.speed.toFixed(1)}<em>m/s</em></div>
      <div>{dirName(wind.dir)}풍 · {Math.round(wind.dir)}°</div>
      <div className="tag">{tag}</div>
    </div>
  )
}
