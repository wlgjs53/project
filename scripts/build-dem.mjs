// 제주 고도 데이터를 만들어 src/data/jejuDem.js 로 구워 넣는다. (한 번만 실행: node scripts/build-dem.mjs)
// 출처: AWS Open Data "Terrain Tiles" (Terrarium 인코딩, SRTM/NASADEM·GEBCO 등 합성)
import { writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const Z = 10 // 줌 10 ≈ 픽셀당 130m
const STEP = 0.25 // km 간격
const X0 = -52, X1 = 52, Z0 = -26, Z1 = 26 // 장면 좌표 범위(km) — WindScene 의 지형 크기와 같아야 함
const GX = Math.round((X1 - X0) / STEP) + 1
const GZ = Math.round((Z1 - Z0) / STEP) + 1

// 장면 좌표 → 위경도 (src/lib/geo.js 의 llToXZ 의 역변환)
const toLon = (x) => 126.55 + x / 92.9
const toLat = (z) => 33.38 - z / 110.95

// 위경도 → 줌 Z 의 전역 픽셀 좌표
const n = 2 ** Z * 256
const px = (lon) => ((lon + 180) / 360) * n
const py = (lat) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n
}

// 필요한 타일 범위
const corners = [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]].map(([x, z]) => [px(toLon(x)), py(toLat(z))])
const tx0 = Math.floor(Math.min(...corners.map((c) => c[0])) / 256) - 1
const tx1 = Math.floor(Math.max(...corners.map((c) => c[0])) / 256) + 1
const ty0 = Math.floor(Math.min(...corners.map((c) => c[1])) / 256) - 1
const ty1 = Math.floor(Math.max(...corners.map((c) => c[1])) / 256) + 1

const tiles = new Map()
for (let ty = ty0; ty <= ty1; ty++) {
  for (let tx = tx0; tx <= tx1; tx++) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url} → ${res.status}`)
    tiles.set(`${tx},${ty}`, PNG.sync.read(Buffer.from(await res.arrayBuffer())))
    console.log('tile', tx, ty)
  }
}

// Terrarium: 고도(m) = R*256 + G + B/256 - 32768
function elev(gx, gy) {
  const t = tiles.get(`${Math.floor(gx / 256)},${Math.floor(gy / 256)}`)
  if (!t) return 0
  const i = ((gy % 256) * 256 + (gx % 256)) * 4
  return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768
}
function sample(lon, lat) {
  const fx = px(lon) - 0.5, fy = py(lat) - 0.5
  const x = Math.floor(fx), y = Math.floor(fy), u = fx - x, v = fy - y
  return elev(x, y) * (1 - u) * (1 - v) + elev(x + 1, y) * u * (1 - v) + elev(x, y + 1) * (1 - u) * v + elev(x + 1, y + 1) * u * v
}

const out = new Int16Array(GX * GZ)
let min = Infinity, max = -Infinity
for (let j = 0; j < GZ; j++) {
  for (let i = 0; i < GX; i++) {
    const m = sample(toLon(X0 + i * STEP), toLat(Z0 + j * STEP))
    out[j * GX + i] = Math.round(m)
    min = Math.min(min, m); max = Math.max(max, m)
  }
}
console.log(`grid ${GX}x${GZ}, 고도 ${min.toFixed(0)}m ~ ${max.toFixed(0)}m`)

const b64 = Buffer.from(out.buffer).toString('base64')
writeFileSync(new URL('../src/data/jejuDem.js', import.meta.url), `// scripts/build-dem.mjs 로 생성한 파일 — 직접 고치지 마세요.
// 제주 고도(m) 격자. 범위 x ${X0}~${X1}km, z ${Z0}~${Z1}km (제주 중심 기준), 간격 ${STEP}km, 행 우선(z 증가 = 남쪽).
// 출처: AWS Open Data Terrain Tiles (SRTM/NASADEM, GEBCO 등)
export const DEM = { x0: ${X0}, z0: ${Z0}, step: ${STEP}, gx: ${GX}, gz: ${GZ} }
const B64 = '${b64}'
const bin = atob(B64)
const bytes = new Uint8Array(bin.length)
for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
export const DEM_M = new Int16Array(bytes.buffer)
`)
console.log('wrote src/data/jejuDem.js', (b64.length / 1024).toFixed(0) + 'KB')
