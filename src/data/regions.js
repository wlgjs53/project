// 지도에 옅게 띄우는 지명. 큰 지명(major)은 멀리서, 읍면(minor)은 가까이서만 보인다.
// 위경도는 각 지역 중심의 근사값 — 발표 전에 지도에서 위치를 확인하세요.
import { llToXZ } from '../lib/geo'

const r = (id, name, tier, lat, lng) => ({ id, name, tier, lat, lng, ...llToXZ(lat, lng) })

export const REGIONS = [
  r('jeju', '제주시', 'major', 33.49, 126.488), // 시내 중심에서 서쪽으로 옮겨 둠 — 칠머리당 핀과 글자가 겹치지 않도록
  r('seogwipo', '서귀포시', 'major', 33.2541, 126.5601),
  r('halla', '한라산', 'major', 33.3617, 126.5292),
  r('hallim', '한림', 'minor', 33.4136, 126.2663),
  r('aewol', '애월', 'minor', 33.4637, 126.3315),
  r('gujwa', '구좌', 'minor', 33.5226, 126.8586),
  r('seongsan', '성산', 'minor', 33.4585, 126.9426),
  r('pyoseon', '표선', 'minor', 33.3258, 126.8305),
  r('namwon', '남원', 'minor', 33.2786, 126.7219),
  r('andeok', '안덕', 'minor', 33.2564, 126.32),
  r('daejeong', '대정', 'minor', 33.2208, 126.2515),
]
