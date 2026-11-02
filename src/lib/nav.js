// 카카오맵 길찾기 링크 (키 불필요). 출발·도착이 채워진 채로 카카오맵이 열리고, 모바일에서는 앱으로 이어진다.
//   mode: 'car' 자동차 · 'traffic' 대중교통 · 'walk' 도보
const point = (p) => `${encodeURIComponent(String(p.title).replace(/[,/]/g, ' ').trim())},${p.lat},${p.lng}`

export const kakaoRoute = (mode, from, to) => `https://map.kakao.com/link/by/${mode}/${point(from)}/${point(to)}`
// 도착지만 지정하면 "내 위치"에서 출발한다
export const kakaoTo = (to) => `https://map.kakao.com/link/to/${point(to)}`
