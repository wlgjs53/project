import { useMemo, useState } from 'react'
import { ADVICE, exposureLabel, rankPlaces, windLevel } from '../lib/advice'
import { useFavorites } from '../hooks/useFavorites'

const TABS = [
  { key: 'tour', label: '명소', icon: 'geo-alt' },
  { key: 'food', label: '맛집', icon: 'cup-hot' },
]

// 영등 여정의 한 장소 주변 명소·맛집을 사진 카드로 보여 준다. 바람 세기에 따라 추천 순서가 달라진다.
// data: useNearby 의 한 항목 { loading, error, sample, tour, food }
// onSelect(place, kind): 카드를 눌렀을 때 — 상세 패널과 3D 지도가 반응한다
export default function NearbyPanel({ data, wind, selectedId, onSelect }) {
  const [tab, setTab] = useState('tour')
  const { isFav, toggle } = useFavorites()

  const list = useMemo(
    () => rankPlaces(data[tab], wind.speed, wind.dir, tab === 'food').slice(0, 4),
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
        <ul className="w-cards">
          {list.map((p) => {
            const label = tab === 'tour' ? exposureLabel(p.e) : ''
            return (
              <li key={p.id}>
                <div role="button" tabIndex={0} className={`w-pcard${selectedId === p.id ? ' sel' : ''}`}
                  onClick={() => onSelect?.(p, tab)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(p, tab)}>
                  <div className="w-pcard-img">
                    {p.thumb || p.image
                      ? <img src={p.thumb || p.image} alt={p.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      : <i className="bi bi-image" />}
                    <button type="button" className={`w-star${isFav('tour', p.id) ? ' on' : ''}`} disabled={p.sample}
                      aria-label={isFav('tour', p.id) ? '즐겨찾기에서 빼기' : '즐겨찾기'}
                      title={p.sample ? '실제 데이터에서만 저장할 수 있어요' : isFav('tour', p.id) ? '저장됨 — 누르면 빼요' : '즐겨찾기'}
                      onClick={(e) => { e.stopPropagation(); toggle({ source: 'tour', id: p.id, title: p.title }) }}>
                      <i className={`bi bi-star${isFav('tour', p.id) ? '-fill' : ''}`} />
                    </button>
                  </div>
                  <div className="w-pcard-body">
                    <b>{p.title}</b>
                    <span>
                      {p.dist !== undefined && (p.dist >= 1000 ? `${(p.dist / 1000).toFixed(1)}km` : `${Math.round(p.dist)}m`)}
                      {label && <em className={p.e > 0 ? 'win' : 'lee'}>{label}</em>}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="w-hint">카드를 누르면 사진과 자세한 정보가 열려요</p>
      {data.sample && <p className="w-sample">※ 샘플 표시 중 — {data.error || 'API 연결 전'}</p>}
    </div>
  )
}
