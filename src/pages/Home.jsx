import { useEffect, useMemo, useRef, useState } from 'react'
import WindScene from '../components/WindScene'
import StorySection from '../components/StorySection'
import WindMeter from '../components/WindMeter'
import WindControls from '../components/WindControls'
import PlaceList from '../components/PlaceList'
import NearbyPanel from '../components/NearbyPanel'
import { useWindSound } from '../hooks/useWindSound'
import { useLiveWind } from '../hooks/useLiveWind'
import { useNearby } from '../hooks/useNearby'
import { nextYeongdeung } from '../lib/dday'
import { PLACES, STOPS, ORIGIN_NOTE } from '../data/story'
import '../styles/wind.css'

// 홈 = 영등할망의 바람길 (스크롤하면 3D 제주 위를 날아가는 스토리)
export default function Home() {
  const [wind, setWind] = useState({ speed: 11, dir: 315 })
  const sound = useWindSound(wind)
  const yd = useMemo(() => nextYeongdeung(), [])

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
  const windTag = isLive ? `기상청 단기예보 · ${live.place}` : live ? '체험 모드' : '샘플 데이터'

  // 영등 여정 3곳 주변의 명소·맛집 (TourAPI, 실패 시 자리표시)
  const nearby = useNearby(STOPS)
  const markers = useMemo(() => STOPS.flatMap((s) => [
    ...nearby[s.id].tour.map((p) => ({ x: p.x, z: p.z, kind: 'tour' })),
    ...nearby[s.id].food.map((p) => ({ x: p.x, z: p.z, kind: 'food' })),
  ]), [nearby])
  const realPlaces = useMemo(() => {
    const seen = new Set()
    return STOPS.flatMap((s) => (nearby[s.id].sample ? [] : nearby[s.id].tour.map((p) => ({ n: p.title, t: `${s.name} 근처`, x: p.x, z: p.z }))))
      .filter((p) => !seen.has(p.n) && seen.add(p.n))
  }, [nearby])
  const useReal = realPlaces.length >= 4

  return (
    <div className="w-home">
      <WindScene wind={wind} markers={markers} />
      <WindMeter wind={wind} tag={yd.season ? `영등 시즌 · ${windTag}` : windTag} />
      <button type="button" className={`w-btn w-sound${sound.on ? ' on' : ''}`} onClick={sound.toggle}>
        <i className="bi bi-wind me-1" />바람소리 {sound.on ? '끄기' : '켜기'}
      </button>

      <div className="w-story">
        <StorySection cam="0,26,50, 0,0,-2">
          <span className="eyebrow">제주 문화 IP × 공공데이터 × three.js</span>
          <h1>영등할망의<br />바람길</h1>
          <p>음력 2월, 바람의 신 영등할망이 제주에 들어와 보름 가까이 머물며 바다에 씨를 뿌리고 떠난다고 전해집니다. 지금 이 섬 위를 지나는 바람을 따라 그 여정을 걸어 보세요.</p>
          {yd.intro && <p className="gold">{yd.intro}</p>}
          <p className="hint">↓ SCROLL</p>
        </StorySection>

        <StorySection cam="0,38,26, 0,0,0" right>
          <span className="step">오늘의 바람</span>
          <h2>흐르는 선 하나하나가<br />제주를 지나는 바람입니다</h2>
          <p>마우스(또는 손가락)로 화면을 휘저어 보세요. 아래 슬라이더는 샘플용이며, 실제 서비스에서는 기상청 실황 데이터가 이 값을 대신합니다.</p>
          <WindControls wind={wind} onChange={setWind} live={live} />
        </StorySection>

        <StorySection cam="-41,8,10, -26,0,-3" focus="han">
          <span className="step">1 · 입도</span>
          <h2>한림 한수리</h2>
          <p>전승에 따르면 영등할망은 바다 건너에서 제주 서쪽 해안, 한림읍 한수리 일대로 들어옵니다. 할망이 닿는 순간부터 제주 바다에 거센 바람이 불기 시작합니다.</p>
          <p className="hint">{ORIGIN_NOTE}</p>
          <NearbyPanel data={nearby.han} wind={wind} />
        </StorySection>

        <StorySection cam="-8,7,-31, -1,0.5,-15.5" focus="chil" right>
          <span className="step">2 · 맞이</span>
          <h2>건입동 칠머리당</h2>
          <p>제주시 건입동 칠머리당에서는 해녀와 어부들이 영등할망을 맞이하고 한 해의 안전과 풍요를 빕니다. 칠머리당영등굿은 2009년 유네스코 인류무형문화유산으로 등재되었습니다.</p>
          <NearbyPanel data={nearby.chil} wind={wind} />
        </StorySection>

        <StorySection cam="48,7,-1, 37,0,-14" focus="udo">
          <span className="step">3 · 퇴도</span>
          <h2>우도</h2>
          <p>보름 무렵, 할망은 우도 쪽 바다로 제주를 떠난다고 알려져 있습니다. 떠나는 길에 뿌린 씨앗이 이듬해 바다의 풍요가 된다고 믿었습니다.</p>
          <NearbyPanel data={nearby.udo} wind={wind} />
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
          <p className="foot">지형: AWS Terrain Tiles(SRTM·GEBCO 등) 고도 데이터이며 높이는 2.2배 과장했습니다. 신화·굿 설명은 국가유산청, 제주특별자치도 등 공식 자료로 검수한 뒤 출처를 표기하세요.</p>
        </StorySection>
      </div>
    </div>
  )
}
