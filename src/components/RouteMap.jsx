import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 코스 지도: 어둡게 바꾼 지도 위에 실제 도로 경로(청록 선)와 순서 번호(금색 원)를 그린다.
// stops: [{ lat, lng }] (방문 순서), line: [[위도, 경도], …] | null, activeIdx: 강조할 번호(0부터), onPick(i): 번호를 눌렀을 때
export default function RouteMap({ stops, line, activeIdx, onPick }) {
  const box = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const pins = useRef([])
  const pick = useRef(onPick)
  useEffect(() => { pick.current = onPick })

  // 지도는 한 번만 만든다
  useEffect(() => {
    const m = L.map(box.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false }).setView([33.38, 126.55], 9)
    // 키가 필요 없는 OpenStreetMap 타일 — 어두운 화면에 맞게 CSS 로 색을 뒤집는다 (.route-map .leaflet-tile-pane)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '© OpenStreetMap contributors',
    }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  // 장소·경로가 바뀌면 다시 그린다
  useEffect(() => {
    const m = map.current
    if (!m) return
    layer.current.clearLayers()
    pins.current = []
    const path = line?.length ? line : stops.map((s) => [s.lat, s.lng]) // 경로를 못 받았으면 장소끼리 직선
    if (path.length > 1) {
      L.polyline(path, { color: '#050b14', weight: 9, opacity: 0.55, lineJoin: 'round' }).addTo(layer.current)
      L.polyline(path, { color: '#7fe3d6', weight: 4, opacity: 0.95, lineJoin: 'round', dashArray: line?.length ? undefined : '6 8' }).addTo(layer.current)
    }
    stops.forEach((s, i) => {
      const icon = L.divIcon({ className: '', html: `<div class="rm-pin">${i + 1}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })
      pins.current.push(L.marker([s.lat, s.lng], { icon }).on('click', () => pick.current?.(i)).addTo(layer.current))
    })
    if (stops.length) m.fitBounds(L.latLngBounds(stops.map((s) => [s.lat, s.lng])), { padding: [40, 40], maxZoom: 13 })
  }, [stops, line])

  // 선택한 번호를 크게 하고 그쪽으로 옮긴다
  useEffect(() => {
    pins.current.forEach((mk, i) => mk.getElement()?.firstChild?.classList.toggle('on', i === activeIdx))
    if (activeIdx != null && stops[activeIdx]) map.current?.panTo([stops[activeIdx].lat, stops[activeIdx].lng])
  }, [activeIdx, stops, line])

  return <div ref={box} className="route-map" />
}
