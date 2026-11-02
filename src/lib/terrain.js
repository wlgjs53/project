// 실제 제주 고도(AWS Terrain Tiles)로 만든 지형. 데이터는 scripts/build-dem.mjs 가 구워 둔 src/data/jejuDem.js
import { DEM, DEM_M } from '../data/jejuDem'
import { clamp, smooth, llToXZ } from './geo'

export const HAL = llToXZ(33.3617, 126.5292) // 한라산 백록담 부근
export const UDO = llToXZ(33.506, 126.952) // 우도

const GX = DEM.gx
const GZ = DEM.gz

// 바다 칸마다 가장 가까운 육지까지의 거리(km). 원본 수심 데이터가 거칠어서(블록처럼 보임)
// 수심은 이 거리로 부드럽게 만든다. 격자 거리 변환(chamfer 2-pass).
const coast = new Float32Array(GX * GZ)
{
  const A = 1, B = Math.SQRT2
  for (let k = 0; k < coast.length; k++) coast[k] = DEM_M[k] > 0 ? 0 : 1e9
  for (let j = 0; j < GZ; j++) {
    for (let i = 0; i < GX; i++) {
      const k = j * GX + i
      let v = coast[k]
      if (i > 0) v = Math.min(v, coast[k - 1] + A)
      if (j > 0) {
        v = Math.min(v, coast[k - GX] + A)
        if (i > 0) v = Math.min(v, coast[k - GX - 1] + B)
        if (i < GX - 1) v = Math.min(v, coast[k - GX + 1] + B)
      }
      coast[k] = v
    }
  }
  for (let j = GZ - 1; j >= 0; j--) {
    for (let i = GX - 1; i >= 0; i--) {
      const k = j * GX + i
      let v = coast[k]
      if (i < GX - 1) v = Math.min(v, coast[k + 1] + A)
      if (j < GZ - 1) {
        v = Math.min(v, coast[k + GX] + A)
        if (i < GX - 1) v = Math.min(v, coast[k + GX + 1] + B)
        if (i > 0) v = Math.min(v, coast[k + GX - 1] + B)
      }
      coast[k] = v
    }
  }
  for (let k = 0; k < coast.length; k++) coast[k] *= DEM.step // 칸 → km (두 pass 가 끝난 뒤에 변환)
}

// 격자(arr)에서 (x, z)의 쌍선형 보간. 범위 밖은 가장자리 값.
function sampleGrid(arr, x, z) {
  const fx = clamp((x - DEM.x0) / DEM.step, 0, GX - 1.001)
  const fz = clamp((z - DEM.z0) / DEM.step, 0, GZ - 1.001)
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * GX + i
  const a = arr[k], b = arr[k + 1], c = arr[k + GX], d = arr[k + GX + 1]
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

const HALLA_M = 1950 // 한라산 정상 고도
const PEAK_H = 4.2 // 정상의 장면 높이
// 낮은 고도(오름 100~400m)가 묻히지 않도록 지수 0.75 로 완만하게 압축 (선형이면 오름이 거의 안 보임)
const landH = (m) => 0.12 * smooth(0, 15, m) + PEAK_H * Math.pow(m / HALLA_M, 0.75)

// 고도(m) → 장면 높이. 육지는 파도에 잠기지 않도록 해안선에서 살짝 띄우고,
// 바다는 해안에서 멀어질수록 부드럽게 깊어진다(최대 -2.2).
export function terrainH(x, z) {
  const m = sampleGrid(DEM_M, x, z)
  if (m > 0) return landH(m)
  return -2.2 * (1 - Math.exp(-sampleGrid(coast, x, z) / 5))
}
