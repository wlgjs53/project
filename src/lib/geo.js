// 수학·노이즈·방위 유틸 (3D 장면과 바람 계산이 함께 씀)
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hash(i, j) {
  const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
  return h - Math.floor(h)
}

export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15

const DIRS = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동', '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서']
export const dirName = (d) => DIRS[Math.round((((d % 360) + 360) % 360) / 22.5) % 16]

// 위경도 → 장면 좌표(km, 제주 중심 기준: 동쪽 +x, 남쪽 +z)
export const llToXZ = (lat, lon) => ({ x: (lon - 126.55) * 92.9, z: -(lat - 33.38) * 110.95 })
