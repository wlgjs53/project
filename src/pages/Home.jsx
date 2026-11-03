import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import WindScene from '../components/WindScene'
import RoutePanel from '../components/RoutePanel'
import { useAppStore } from '../store/useAppStore'
import { useRouteLine } from '../hooks/useCourseRoute'
import { useOreums } from '../hooks/useOreums'
import { llToXZ } from '../lib/geo'
import StorySection from '../components/StorySection'
import GoodsArt from '../components/GoodsArt'
import StoryPhoto from '../components/StoryPhoto'
import WindMeter from '../components/WindMeter'
import WindControls from '../components/WindControls'
import PlaceList from '../components/PlaceList'
import NearbyPanel from '../components/NearbyPanel'
import ScrollCue from '../components/ScrollCue'
import PlaceDetailPanel from '../components/PlaceDetailPanel'
import { useLiveWind } from '../hooks/useLiveWind'
import { useNearby } from '../hooks/useNearby'
import YeongdeungIntro from '../components/YeongdeungIntro'
import { fetchHeritage, fetchHeritageDetail } from '../api/client'
import { nextYeongdeung } from '../lib/dday'
import { PLACES, STOPS, ORIGIN_NOTE } from '../data/story'
import '../styles/wind.css'

// 화면이 좁으면(모바일) 상세 패널을 아래에서 올라오게 한다
function useNarrow() {
  const [narrow, setNarrow] = useState(() => innerWidth < 720)
  useEffect(() => {
    const on = () => setNarrow(innerWidth < 720)
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  return narrow
}

// 지금 화면 가운데에 가장 가까운 스토리 카드가 오른쪽에 있는지 (패널을 반대편에 열기 위해)
function visibleCardOnRight() {
  const mid = innerHeight / 2
  let best = null, bestD = Infinity
  document.querySelectorAll('.w-sec').forEach((el) => {
    const r = el.getBoundingClientRect()
    const d = Math.abs((r.top + r.bottom) / 2 - mid)
    if (d < bestD) { bestD = d; best = el }
  })
  return !!best?.classList.contains('r')
}

// 홈 = 영등할망의 바람길 (스크롤하면 3D 제주 위를 날아가는 스토리)
export default function Home() {
  const [wind, setWind] = useState({ speed: 11, dir: 315 })
  // 좁은 화면: 스크롤을 내리면 위쪽의 버튼·풍속 표시를 감춰 카드 글자를 가리지 않게 한다 (맨 위로 올리면 다시 보임)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(scrollY > 80)
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])
  const [labelsOn, setLabelsOn] = useState(true) // 지도 지명 표시 (기본 켜짐, 옅게)
  const [oreumOn, setOreumOn] = useState(true)   // 오름 점 표시 (제주오름요약설명 90곳)
  const { items: oreums } = useOreums()
  const yd = useMemo(() => nextYeongdeung(), [])

  // 동선 안내: 영등 여정(한수리→칠머리당→우도) 또는 할망따라에서 만든 내 코스를 3D 지도 위에 그린다 (?route=course 로 바로 열기)
  const [params] = useSearchParams()
  const courseStops = useAppStore((s) => s.courseStops)
  const [routeOpen, setRouteOpen] = useState(params.has('route'))
  const [routeKind, setRouteKind] = useState(params.get('route') === 'yd' || !params.has('route') ? 'yd' : 'course')
  const routeStops = useMemo(() => (routeKind === 'course' ? courseStops : STOPS.map((s) => ({ title: s.name, sub: s.sub, lat: s.lat, lng: s.lng }))), [routeKind, courseStops])
  const routeData = useRouteLine(routeOpen ? routeStops : [])
  const sceneRoute = useMemo(() => (routeOpen && routeStops.length > 1
    ? { points: routeData.line?.map(([la, ln]) => llToXZ(la, ln)) ?? null, stops: routeStops.map((s) => llToXZ(s.lat, s.lng)) }
    : null), [routeOpen, routeStops, routeData.line])

  // 기상청 실제 바람: 불러오면 한 번 적용하고, 이후엔 사용자가 슬라이더로 바꿔 볼 수 있다
  const live = useLiveWind()
  const appliedLive = useRef(false)
  useEffect(() => {
    if (live && !appliedLive.current) {
      appliedLive.current = true
      setWind({ speed: live.speed, dir: live.dir })
    }
  }, [live])
  const isLive = !!live && live.speed === wind.speed && live.dir === wind.dir
  const windTag = isLive ? `기상청 단기예보 · ${live.label}` : live ? '체험 모드' : '샘플 데이터'

  // 영등 여정 3곳 주변의 명소·맛집 (TourAPI, 실패 시 자리표시)
  const nearby = useNearby(STOPS)

  // 카드를 누르면: 상세 패널이 열리고, 3D 지도가 그 장소를 비춘다
  const [sel, setSel] = useState(null) // { place, kind }
  const [panelOpen, setPanelOpen] = useState(false)
  const [side, setSide] = useState('end') // 패널이 열릴 쪽 (지금 보이는 스토리 카드의 반대편)
  const openPlace = (place, kind) => {
    setSel({ place, kind })
    setSide(visibleCardOnRight() ? 'start' : 'end')
    setPanelOpen(true)
  }
  // 지도(3D)에서 빛을 눌렀을 때: 그 장소를 찾아 상세 패널로 연다 / 여정 기둥이면 그 장면으로 스크롤한다
  const pickMarker = (id) => {
    if (String(id).startsWith('o:')) {
      const o = oreums.find((x) => x.id === id)
      return o && openPlace(o, 'oreum')
    }
    for (const s of STOPS) {
      for (const kind of ['tour', 'food']) {
        const place = nearby[s.id][kind].find((p) => p.id === id)
        if (place) return openPlace(place, kind)
      }
    }
  }
  const pickStop = (id) => document.querySelector(`[data-focus="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // 바람따라 오름 페이지에서 "바람길 지도에서 보기"로 넘어오면(?oreum=o:abu) 그 오름을 비추고 상세를 연다
  const wantOreum = params.get('oreum')
  const openedOreum = useRef(false)
  useEffect(() => {
    if (openedOreum.current || !wantOreum || wantOreum === 'all' || !oreums.length) return
    const o = oreums.find((x) => x.id === wantOreum)
    if (!o) return
    openedOreum.current = true
    setSel({ place: o, kind: 'oreum' })
    setSide('end')
    setPanelOpen(true)
  }, [wantOreum, oreums])
  // 패널이 열린 채로 페이지를 스크롤하면 다음 내용이 보이도록 패널을 닫는다 (카메라도 스크롤 장면으로 돌아감)
  useEffect(() => {
    if (!panelOpen) return
    const y0 = scrollY
    const onScroll = () => { if (Math.abs(scrollY - y0) > 40) setPanelOpen(false) }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [panelOpen])
  const narrow = useNarrow()
  const placement = narrow ? 'bottom' : side
  const selectedId = panelOpen ? sel?.place.id : null
  const focus = panelOpen && sel ? { x: sel.place.x, z: sel.place.z } : null

  const markers = useMemo(() => [
    ...(oreumOn ? oreums.map((o) => ({ id: o.id, title: o.title, x: o.x, z: o.z, kind: 'oreum', selected: o.id === selectedId })) : []),
    ...STOPS.flatMap((s) => [
    ...nearby[s.id].tour.map((p) => ({ id: p.id, title: p.title, x: p.x, z: p.z, kind: 'tour', selected: p.id === selectedId })),
    ...nearby[s.id].food.map((p) => ({ id: p.id, title: p.title, x: p.x, z: p.z, kind: 'food', selected: p.id === selectedId })),
    ]),
  ], [nearby, selectedId, oreums, oreumOn])
  const realPlaces = useMemo(() => {
    const seen = new Set()
    return STOPS.flatMap((s) => (nearby[s.id].sample ? [] : nearby[s.id].tour.map((p) => ({ n: p.title, t: `${s.name} 근처`, x: p.x, z: p.z }))))
      .filter((p) => !seen.has(p.n) && seen.add(p.n))
  }, [nearby])
  const useReal = realPlaces.length >= 4

  // 스토리 카드 대표 사진: 맞이 = 국가유산청의 영등굿 사진, 입도·퇴도 = 근처 명소의 사진(TourAPI)
  const [gut, setGut] = useState(null)
  const [gallery, setGallery] = useState([]) // "영등할망이란?" 장면에 쓸 영등굿 사진들 (국가유산청)
  useEffect(() => {
    fetchHeritage('영등').then(async (l) => {
      const h = l[0]
      if (!h) return
      if (h.image) setGut({ src: h.image, caption: `${h.name} · 국가유산청` })
      try { setGallery((await fetchHeritageDetail(h)).images.slice(0, 4)) } catch { /* 사진 목록이 없으면 대표 사진 한 장만 쓴다 */ }
    }).catch(() => {})
  }, [])
  const introPhotos = gallery.length ? gallery : gut ? [{ url: gut.src, desc: '제주칠머리당영등굿' }] : []
  const heroOf = (id) => {
    const p = nearby[id].sample ? null : nearby[id].tour.find((x) => x.image)
    return p ? <StoryPhoto key={p.id} src={p.image} caption={`${p.title} · 한국관광공사`} /> : null
  }

  return (
    <div className={`w-home${routeOpen ? ' route-on' : ''}${scrolled ? ' scrolled' : ''}`}>
      <WindScene wind={wind} stations={isLive ? live.stations : null} markers={markers} focus={focus} labels={labelsOn}
        route={sceneRoute} overview={!!sceneRoute} onPickMarker={pickMarker} onPickStop={pickStop} />
      {routeOpen && (
        <RoutePanel kind={routeKind} onKind={setRouteKind} onClose={() => setRouteOpen(false)}
          kinds={[{ key: 'yd', label: '영등 여정' }, { key: 'course', label: `내 코스${courseStops.length > 1 ? ` (${courseStops.length}곳)` : ''}` }]}
          stops={routeStops} legs={routeData.legs} loading={!routeData.ready} />
      )}
      <WindMeter wind={wind} rain={isLive ? live.rain : null} tag={yd.season ? `영등 시즌 · ${windTag}` : windTag} />
      <div className="w-tools">
        <button type="button" className={`w-btn${routeOpen ? ' on' : ''}`} onClick={() => { setPanelOpen(false); setRouteOpen((v) => !v) }}>
          <i className="bi bi-signpost-split me-1" />동선 안내
        </button>
        <button type="button" className={`w-btn${labelsOn ? ' on' : ''}`} onClick={() => setLabelsOn((v) => !v)} title="지도의 지명(제주시·서귀포시 등) 표시">
          <i className="bi bi-geo-alt me-1" />지명
        </button>
        <button type="button" className={`w-btn${oreumOn ? ' on' : ''}`} onClick={() => setOreumOn((v) => !v)} title="오름 표시 (제주오름요약설명 90곳)">
          <i className="bi bi-triangle me-1" />오름
        </button>
      </div>

      <ScrollCue />

      <PlaceDetailPanel sel={sel} show={panelOpen} wind={wind} rain={live?.rain ?? null} placement={placement} onHide={() => setPanelOpen(false)} />

      <div className="w-story">
        <StorySection cam="0,26,50, 0,0,-2">
          <h1>영등할망의<br />바람길</h1>
          <p className="tagline">오늘의 바람 따라 걷는 영등할망의 길, 길목의 명소와 맛집 안내</p>
          <p>음력 2월, 바람의 신 영등할망이 제주에 들어와 보름 가까이 머물며 바다에 씨를 뿌리고 떠난다고 전해집니다. 지금 이 섬 위를 지나는 바람을 따라 그 여정을 걸어 보세요.</p>
          {yd.intro && <p className="gold">{yd.intro}</p>}
          <p className="hint">↓ SCROLL</p>
        </StorySection>

        <StorySection cam="0,32,40, 0,0,-2" solid>
          <YeongdeungIntro photos={introPhotos} />
        </StorySection>

        <StorySection cam="0,38,26, 0,0,0" right>
          <span className="step">오늘의 바람</span>
          <h2>흐르는 선 하나하나가<br />제주를 지나는 바람입니다</h2>
          <p>마우스(또는 손가락)로 화면을 휘저어 보세요. 기상청 단기예보의 실제 바람이 적용되고, 아래 슬라이더로 다른 날의 바람도 체험해 볼 수 있어요.</p>
          <WindControls wind={wind} onChange={setWind} live={live} />
        </StorySection>

        <StorySection cam="-41,8,10, -26,0,-3" focus="han" photo={heroOf('han')}>
          <span className="step">1 · 입도</span>
          <h2>한림 한수리</h2>
          <p>전승에 따르면 영등할망은 바다 건너에서 제주 서쪽 해안, 한림읍 한수리 일대로 들어옵니다. 할망이 닿는 순간부터 제주 바다에 거센 바람이 불기 시작합니다.</p>
          <p className="hint">{ORIGIN_NOTE}</p>
          <NearbyPanel data={nearby.han} wind={wind} selectedId={selectedId} onSelect={openPlace} />
        </StorySection>

        <StorySection cam="-8,7,-31, -1,0.5,-15.5" focus="chil" right
          photo={gut ? <StoryPhoto src={gut.src} caption={gut.caption} /> : null}>
          <span className="step">2 · 맞이</span>
          <h2>건입동 칠머리당</h2>
          <p>제주시 건입동 칠머리당에서는 해녀와 어부들이 영등할망을 맞이하고 한 해의 안전과 풍요를 빕니다. 칠머리당영등굿은 2009년 유네스코 인류무형문화유산으로 등재되었습니다.</p>
          <NearbyPanel data={nearby.chil} wind={wind} selectedId={selectedId} onSelect={openPlace} />
        </StorySection>

        <StorySection cam="48,7,-1, 37,0,-14" focus="udo" photo={heroOf('udo')}>
          <span className="step">3 · 퇴도</span>
          <h2>우도</h2>
          <p>보름 무렵, 할망은 우도 쪽 바다로 제주를 떠난다고 알려져 있습니다. 떠나는 길에 뿌린 씨앗이 이듬해 바다의 풍요가 된다고 믿었습니다.</p>
          <NearbyPanel data={nearby.udo} wind={wind} selectedId={selectedId} onSelect={openPlace} />
        </StorySection>

        <StorySection cam="0,40,3, 0,0,0" right wide>
          <span className="step">영등굿</span>
          <h2>바람의 신을 맞이하고 보내는 굿</h2>
          <div className="w-steps">
            <div><b>영등환영제</b><span>음력 2월 초하루 무렵, 할망을 맞이하는 첫 굿입니다.</span></div>
            <div><b>요왕맞이</b><span>바다의 용왕에게 안전과 풍어를 기원합니다.</span></div>
            <div><b>씨드림</b><span>해녀들이 바다에 해산물의 씨를 뿌리는 의식입니다.</span></div>
            <div><b>영등송별제</b><span>보름 무렵, 할망을 정성껏 떠나보냅니다.</span></div>
          </div>
        </StorySection>

        <StorySection cam="24,17,26, 4,0,0">
          <span className="step">바람 따라 가 보기</span>
          <h2>지금 바람 기준 추천</h2>
          <p>현재 풍향을 기준으로 바람을 정면으로 맞는 곳과 비껴가는 곳을 나눠 보여 줍니다.</p>
          <PlaceList places={useReal ? realPlaces : PLACES} windDir={wind.dir} />
          <p className="foot">{useReal
            ? '※ 한국관광공사 TourAPI의 영등 여정 주변 관광지를 한라산 기준 방향으로 나눈 단순 계산입니다.'
            : '※ 샘플 좌표와 단순 계산입니다. TourAPI 연결 후 실제 관광지로 바뀝니다.'}</p>
        </StorySection>

        <StorySection cam="0,22,54, 0,2,0" right>
          <span className="step">{yd.season ? '영등 시즌' : '다음 영등까지'}</span>
          <div className="w-dday">{yd.big}</div>
          <p>{yd.sub}</p>
          <p className="foot">지형: AWS Terrain Tiles(SRTM·GEBCO 등) 고도 데이터를 바탕으로 높이를 과장해 표현했습니다. 영등굿 설명은 국가유산청 자료를 참고했으며, 전승은 지역과 문헌에 따라 다를 수 있습니다.</p>
        </StorySection>

        <StorySection cam="0,30,52, 0,0,0">
          <span className="step">영등할망 굿즈샵</span>
          <h2>바람의 신을 곁에 두는 법</h2>
          <p>영등할망 인형, 해녀 테왁 키링, 바람개비 마그넷… 이야기를 담은 굿즈를 담아 주문해 보세요.</p>
          <div className="w-goods">
            <GoodsArt art="doll-halmang" />
            <GoodsArt art="keyring-wind" />
            <GoodsArt art="magnet-pinwheel" />
          </div>
          <Link to="/shop" className="w-btn"><i className="bi bi-bag-heart me-1" />굿즈샵 구경하기</Link>
        </StorySection>
      </div>
    </div>
  )
}
