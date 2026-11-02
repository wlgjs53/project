// 스토리 데이터 — 나중에 API 응답으로 교체할 샘플
import { llToXZ } from '../lib/geo'

const at = (lat, lng) => llToXZ(lat, lng)

// 영등할망의 여정 (x,z = 장면 좌표 km). 위경도는 근사값이라 발표 전 공식 자료로 검수하세요.
const stop = (id, name, sub, lat, lng) => ({ id, name, sub, lat, lng, ...at(lat, lng) })
export const STOPS = [
  stop('han', '한수리', '입도', 33.405, 126.27),
  stop('chil', '칠머리당', '영등굿', 33.5183, 126.5436),
  stop('udo', '우도', '퇴도', 33.506, 126.952),
]

// 바람 프리셋 [풍속 m/s, 풍향°]
export const PRESETS = [
  { label: '잔잔한 날', speed: 3, dir: 200 },
  { label: '영등 바람', speed: 11, dir: 315 },
  { label: '강풍', speed: 20, dir: 335 },
]

// 샘플 관광지 — TourAPI 연동 시 교체 (위경도는 근사값)
export const PLACES = [
  { n: '협재해수욕장', t: '서쪽 해안', ...at(33.394, 126.239) },
  { n: '함덕해수욕장', t: '북쪽 해안', ...at(33.543, 126.669) },
  { n: '성산일출봉', t: '동쪽 끝', ...at(33.458, 126.942) },
  { n: '용머리해안', t: '남서 해안', ...at(33.2306, 126.3125) },
  { n: '비자림', t: '동부 숲', ...at(33.4906, 126.8083) },
  { n: '카멜리아힐', t: '남서 중산간', ...at(33.2889, 126.3698) },
]

// 칠머리당영등굿 — UNESCO 공식 유튜브 영상 ("영등할망이란?" 장면에서 눌러야 재생)
// start·end: 핵심 구간만 재생(초). 파일을 복사하지 않고 유튜브 임베드의 시간 설정만 쓴다. 0:36 ~ 1:55
export const GUT_VIDEO = {
  id: 'BZ1uIR0e0bo',
  start: 36,
  end: 115,
  thumb: 'https://i.ytimg.com/vi/BZ1uIR0e0bo/default.jpg',
  page: 'https://ich.unesco.org/en/RL/jeju-chilmeoridang-yeongdeunggut-00187',
}

export const ORIGIN_NOTE = '※ 전승은 지역과 문헌에 따라 조금씩 다릅니다.'
