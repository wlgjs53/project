// TourAPI 를 부를 수 없을 때(키 없음·오프라인) 화면 구성을 보여 주기 위한 자리표시 데이터.
// 실제 장소 이름을 지어내지 않도록 일부러 '예시'라고 적고, sample: true 로 구분한다.
const OFFSETS = [[0.012, -0.015], [-0.01, 0.018], [0.018, 0.01], [-0.016, -0.012]]

export function sampleNearby(stop, type) {
  const food = type === '39'
  return OFFSETS.slice(0, 3).map(([dLat, dLng], i) => ({
    id: `sample-${stop.id}-${type}-${i}`,
    title: `${food ? '주변 맛집' : '주변 명소'} 예시 ${i + 1}`,
    addr: 'TourAPI 연결 후 실제 정보가 표시됩니다',
    image: '',
    lat: stop.lat + dLat,
    lng: stop.lng + dLng,
    type,
    dist: 800 * (i + 1),
    sample: true,
  }))
}
