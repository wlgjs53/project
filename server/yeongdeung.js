// 영등할망의 여정(입도 → 맞이 → 퇴도). 화면의 src/data/story.js 의 STOPS 와 같은 장소·좌표다.
// (서버 함수에서는 src/ 를 가져오지 않으므로 여기에 따로 둔다. 좌표는 근사값 — 고치면 양쪽을 같이 고칠 것)
const STOPS = [
  { id: 'han', name: '한림 한수리', role: '입도 — 영등할망이 제주 서쪽 해안으로 들어오는 곳', lat: 33.405, lng: 126.27 },
  { id: 'chil', name: '건입동 칠머리당', role: '맞이 — 해녀·어부가 영등굿으로 할망을 맞이하는 곳', lat: 33.5183, lng: 126.5436 },
  { id: 'udo', name: '우도', role: '퇴도 — 보름 무렵 할망이 제주를 떠난다고 전해지는 곳', lat: 33.506, lng: 126.952 },
];

export async function getYeongdeungStops() {
  return STOPS;
}
