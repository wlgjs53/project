// 관측 지점들의 풍속·풍향을 격자 바람장으로 보간한다
import { clamp, hash } from './geo'
import { HAL } from './terrain'

export const GXN = 65
export const GZN = 29

// 샘플 관측 지점 (API 연결 전)
function sampleStations(speed, dir) {
  const pts = [[-34, -4], [-20, -14], [-8, -16], [10, -14], [26, -10], [38, -4], [36, 6], [22, 12], [6, 14], [-12, 12], [-28, 8], [-2, 0], [-45, 0], [45, 0], [0, -24], [0, 22]]
  return pts.map(([x, z], i) => ({ x, z, speed: speed * (0.75 + 0.5 * hash(i, 3)), dir: dir + (hash(i, 9) - 0.5) * 40 }))
}

export function createWindField() {
  const FU = new Float32Array(GXN * GZN)
  const FV = new Float32Array(GXN * GZN)
  const out = [0, 0]

  // stations: [{x, z, speed(m/s), dir(바람이 불어오는 방위 0~360)}] — 없으면 샘플 사용
  function build(speed, dir, stations) {
    const st = stations?.length ? stations : sampleStations(speed, dir)
    for (let j = 0; j < GZN; j++) {
      for (let i = 0; i < GXN; i++) {
        const x = -52 + (i / (GXN - 1)) * 104
        const z = -26 + (j / (GZN - 1)) * 52
        let sw = 0, su = 0, sv = 0
        for (const s of st) {
          const d2 = (x - s.x) ** 2 + (z - s.z) ** 2 + 4
          const w = 1 / (d2 * d2 * 0.01 + d2)
          const r = (s.dir * Math.PI) / 180
          su += -s.speed * Math.sin(r) * w
          sv += s.speed * Math.cos(r) * w
          sw += w
        }
        let u = su / sw, v = sv / sw
        // 한라산을 비껴 흐르는 변형
        const dx = x - HAL.x, dz = z - HAL.z, d = Math.hypot(dx, dz) + 0.001
        const def = Math.exp(-((dx / 14) ** 2 + (dz / 9) ** 2)), sp = Math.hypot(u, v)
        u = u * (1 - 0.4 * def) + (dx / d) * sp * 0.45 * def
        v = v * (1 - 0.4 * def) + (dz / d) * sp * 0.45 * def
        FU[j * GXN + i] = u
        FV[j * GXN + i] = v
      }
    }
  }

  // (x, z)의 바람 벡터 [u, v] — 반환 배열은 재사용되므로 바로 읽어 쓸 것
  function at(x, z) {
    const fx = clamp(((x + 52) / 104) * (GXN - 1), 0, GXN - 1.001)
    const fz = clamp(((z + 26) / 52) * (GZN - 1), 0, GZN - 1.001)
    const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * GXN + i
    out[0] = FU[k] * (1 - u) * (1 - v) + FU[k + 1] * u * (1 - v) + FU[k + GXN] * (1 - u) * v + FU[k + GXN + 1] * u * v
    out[1] = FV[k] * (1 - u) * (1 - v) + FV[k + 1] * u * (1 - v) + FV[k + GXN] * (1 - u) * v + FV[k + GXN + 1] * u * v
    return out
  }

  return { build, at }
}
