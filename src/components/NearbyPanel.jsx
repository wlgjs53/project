import { useMemo, useState } from 'react'
import { ADVICE, exposureLabel, rankPlaces, windLevel } from '../lib/advice'
import { useAppStore } from '../store/useAppStore'

const TABS = [
  { key: 'tour', label: '명소', icon: 'geo-alt' },
  { key: 'food', label: '맛집', icon: 'cup-hot' },
]

// 영등 여정의 한 장소 주변 명소·맛집. 바람 세기에 따라 추천 순서가 달라진다.
// data: useNearby 의 한 항목 { loading, error, sample, tour, food }
export default function NearbyPanel({ data, wind }) {
  const [tab, setTab] = useState('tour')
  const addFavorite = useAppStore((s) => s.addFavorite)

  const list = useMemo(
    () => rankPlaces(data[tab], wind.speed, wind.dir, tab === 'food').slice(0, 3),
    [data, tab, wind.speed, wind.dir],
  )

  return (
    <div className="w-nearby">
      <div className="w-nearby-head">
        <span>이 근처</span>
        <div className="w-tabs">
          {TABS.map((t) => (
            <button key={t.key} type="button" className={`w-btn sm${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`bi bi-${t.icon} me-1`} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'tour' && <p className="w-advice">{ADVICE[windLevel(wind.speed)]}</p>}
      {tab === 'food' && <p className="w-advice">식당은 실내 위주라 바람과 상관없이 가까운 순으로 보여 드려요.</p>}

      {data.loading ? <p className="w-muted">불러오는 중…</p> : list.length === 0 ? (
        <p className="w-muted">근처에서 찾은 곳이 없어요.</p>
      ) : (
        <ul className="w-nearby-list">
          {list.map((p) => (
            <li key={p.id}>
              <div className="w-nearby-main">
                <b>{p.title}</b>
                <small>{p.addr}</small>
              </div>
              <div className="w-nearby-side">
                {tab === 'tour' && exposureLabel(p.e) && <em className={p.e > 0 ? 'win' : 'lee'}>{exposureLabel(p.e)}</em>}
                {p.dist !== undefined && <span>{p.dist >= 1000 ? `${(p.dist / 1000).toFixed(1)}km` : `${Math.round(p.dist)}m`}</span>}
                <button type="button" className="w-star" disabled={p.sample} title={p.sample ? '실제 데이터에서만 저장할 수 있어요' : '즐겨찾기'}
                  onClick={() => addFavorite({ source: 'tour', id: p.id, title: p.title })}>
                  <i className="bi bi-star" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.sample && <p className="w-sample">※ 샘플 표시 중 — {data.error || 'API 연결 전'}</p>}
    </div>
  )
}
