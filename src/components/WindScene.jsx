import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { clamp, smooth, mulberry32, fbm } from '../lib/geo'
import { HAL, terrainH } from '../lib/terrain'
import { DEM } from '../data/jejuDem'
import { createWindField } from '../lib/windField'
import { STOPS } from '../data/story'
import { REGIONS } from '../data/regions'

// 제주 3D 바람 장면. 스크롤 위치에 따라 카메라가 움직이고(섹션의 data-cam 사용),
// wind({speed, dir})와 stations(관측 지점 배열)가 바뀌면 바람장을 다시 계산한다.
// markers: [{ x, z, kind: 'tour' | 'food', selected }] — 주변 명소·맛집을 작은 빛점으로 표시(선택된 것은 크게)
// focus: {x, z} 이면 스크롤 카메라 대신 그 지점을 가까이서 비춘다 (장소 상세를 열었을 때)
// onPickMarker(id): 지도의 명소·맛집 빛을 눌렀을 때, onPickStop(id): 영등 여정 장소(금빛 기둥)를 눌렀을 때
// 마우스 왼쪽 버튼으로 드래그하면 시점을 돌려 볼 수 있다 (더블클릭하면 원래 시점, 스크롤하면 자동 복귀)
// labels: 지명(제주시·서귀포시·한라산·읍면)과 "지금 보는 곳" 자막을 보일지
export default function WindScene({ wind, stations = null, markers = [], focus = null, labels = true, onPickMarker, onPickStop }) {
  const canvasRef = useRef(null)
  const barRef = useRef(null)
  const pinEls = useRef([])
  const windRef = useRef(wind)
  const markersRef = useRef(markers)
  const focusRef = useRef(focus)
  const hoverRef = useRef(null)
  const regionEls = useRef([])
  const compassRef = useRef(null)
  const whereRef = useRef(null)
  const labelsRef = useRef(labels)
  const cbRef = useRef({})
  const sceneApi = useRef(null)
  const field = useRef(null)
  if (!field.current) field.current = createWindField()

  useEffect(() => {
    windRef.current = wind
    field.current.build(wind.speed, wind.dir, stations)
  }, [wind, stations])

  useEffect(() => {
    markersRef.current = markers
    sceneApi.current?.setMarkers(markers)
  }, [markers])

  useEffect(() => { focusRef.current = focus }, [focus])
  useEffect(() => { labelsRef.current = labels }, [labels])
  useEffect(() => { cbRef.current = { onPickMarker, onPickStop } }) // 항상 최신 콜백을 쓰도록 (장면은 한 번만 만들어지므로)

  useEffect(() => {
    // three r128 시절 색감을 유지하기 위해 색 관리를 끄고 선형 출력을 쓴다 (밝기는 π 보정)
    const prevCM = THREE.ColorManagement.enabled
    THREE.ColorManagement.enabled = false

    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050b14)
    scene.fog = new THREE.FogExp2(0x050b14, 0.009)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500)
    camera.position.set(0, 26, 50)

    scene.add(new THREE.HemisphereLight(0x88aaff, 0x223322, 0.6 * Math.PI))
    const moon = new THREE.DirectionalLight(0xbcd4ff, 1.2 * Math.PI) // 달빛을 세게 해서 오름·능선의 음영을 살림
    moon.position.set(-40, 50, 20)
    scene.add(moon)

    // 별
    {
      const n = 900, p = new Float32Array(n * 3), rnd = mulberry32(3)
      for (let i = 0; i < n; i++) {
        const u = rnd() * Math.PI * 2, v = rnd() * 0.48 * Math.PI, R = 230
        p[i * 3] = R * Math.cos(u) * Math.cos(v)
        p[i * 3 + 1] = R * Math.sin(v) + 10
        p[i * 3 + 2] = R * Math.sin(u) * Math.cos(v)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(p, 3))
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaabbdd, size: 1.3, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 })))
    }

    // 지형
    const TW = 104, TD = 52, TSX = DEM.gx - 1, TSZ = DEM.gz - 1 // 고도 격자와 1:1 (0.25km 간격)
    const terrGeo = new THREE.PlaneGeometry(TW, TD, TSX, TSZ)
    terrGeo.rotateX(-Math.PI / 2)
    const HG = new Float32Array((TSX + 1) * (TSZ + 1))
    {
      const pos = terrGeo.attributes.position
      const col = new Float32Array(pos.count * 3)
      // 높이 → 색: 깊은 바다 → 청록 얕은 바다 → 모래 → 들·숲 → 오름 → 한라산 암반 → 정상
      const stops = [[-2.2, '#040b14'], [-1.2, '#07243a'], [-0.5, '#0c4a5e'], [-0.04, '#1b8088'],
        [0, '#9a9a78'], [0.14, '#6f7f62'], [0.5, '#3f7048'], [1.2, '#2f6040'], [2.2, '#4c6a45'],
        [3.0, '#6b6a58'], [3.8, '#8a8780'], [4.4, '#d6d9dc']]
        .map(([h, c]) => [h, new THREE.Color(c)])
      const tmp = new THREE.Color()
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i), h = terrainH(x, z)
        pos.setY(i, h)
        HG[i] = h
        let k = 0
        while (k < stops.length - 2 && h > stops[k + 1][0]) k++
        const [h0, c0] = stops[k], [h1, c1] = stops[k + 1]
        tmp.copy(c0).lerp(c1, clamp((h - h0) / (h1 - h0), 0, 1))
        const sh = 0.88 + 0.24 * fbm(x * 0.6, z * 0.6)
        col[i * 3] = tmp.r * sh
        col[i * 3 + 1] = tmp.g * sh
        col[i * 3 + 2] = tmp.b * sh
      }
      terrGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))
      terrGeo.computeVertexNormals()
    }
    scene.add(new THREE.Mesh(terrGeo, new THREE.MeshLambertMaterial({ vertexColors: true })))
    function heightAt(x, z) {
      const fx = clamp(((x + TW / 2) / TW) * TSX, 0, TSX - 0.001)
      const fz = clamp(((z + TD / 2) / TD) * TSZ, 0, TSZ - 0.001)
      const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, W = TSX + 1
      const a = HG[j * W + i], b = HG[j * W + i + 1], c = HG[(j + 1) * W + i], d = HG[(j + 1) * W + i + 1]
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
    }

    // 바다
    const SEG = 208
    const seaGeo = new THREE.PlaneGeometry(TW, TD, SEG, SEG / 2)
    seaGeo.rotateX(-Math.PI / 2)
    const sea = new THREE.Mesh(seaGeo, new THREE.MeshPhongMaterial({ color: 0x0b3550, specular: 0x223a55, shininess: 25, transparent: true, opacity: 0.72, flatShading: true, depthWrite: false }))
    sea.renderOrder = 1
    scene.add(sea)
    const seaPos = seaGeo.attributes.position
    const seaBase = new Float32Array(seaPos.count * 2)
    for (let i = 0; i < seaPos.count; i++) {
      seaBase[i * 2] = seaPos.getX(i)
      seaBase[i * 2 + 1] = seaPos.getZ(i)
    }

    // 바람 파티클
    const N = innerWidth < 700 ? 1800 : 3600
    const PX = new Float32Array(N), PZ = new Float32Array(N), PA = new Float32Array(N), PL = new Float32Array(N)
    const lpos = new Float32Array(N * 6), lcol = new Float32Array(N * 6)
    function respawn(i, initial) {
      PX[i] = (Math.random() * 2 - 1) * 50
      PZ[i] = (Math.random() * 2 - 1) * 24
      PL[i] = 3 + Math.random() * 5
      PA[i] = initial ? Math.random() * PL[i] : 0
    }
    for (let i = 0; i < N; i++) respawn(i, true)
    const lgeo = new THREE.BufferGeometry()
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3))
    lgeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3))
    const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }))
    lines.frustumCulled = false
    lines.renderOrder = 2
    scene.add(lines)

    const mouse = { active: false, x: 0, z: 0, nx: 0, ny: 0 }
    const orbit = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0 } // 드래그로 돌린 시점 (t = 목표값, 실제 값은 부드럽게 따라감)
    const drag = { id: null, x: 0, y: 0, sx: 0, sy: 0, moved: false }
    const ray = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    const onMove = (e) => {
      if (drag.moved) { mouse.active = false; return } // 시점을 돌리는 중에는 바람 밀기·시차 효과를 멈춘다
      mouse.nx = (e.clientX / innerWidth) * 2 - 1
      mouse.ny = (e.clientY / innerHeight) * 2 - 1
      ray.setFromCamera(new THREE.Vector2(mouse.nx, -mouse.ny), camera)
      if (ray.ray.intersectPlane(plane, hit)) { mouse.x = hit.x; mouse.z = hit.z; mouse.active = true }
    }
    const onLeave = () => { mouse.active = false }
    addEventListener('pointermove', onMove)
    addEventListener('pointerleave', onLeave)

    const K = 0.33, TL = 0.42, R_PUSH = 5
    let T = 0
    function updateParticles(dt) {
      const gt = T * 0.6
      for (let i = 0; i < N; i++) {
        let x = PX[i], z = PZ[i]
        const f = field.current.at(x, z)
        const g = 1 + 0.18 * Math.sin(gt + x * 0.12 + z * 0.17)
        let vx = f[0] * g, vz = f[1] * g
        if (mouse.active) {
          const dx = x - mouse.x, dz = z - mouse.z, d2 = dx * dx + dz * dz
          if (d2 < R_PUSH * R_PUSH) {
            const d = Math.sqrt(d2) + 0.001, ff = (1 - d / R_PUSH) ** 2 * 26
            vx += (dx / d) * ff - (dz / d) * ff * 0.5
            vz += (dz / d) * ff + (dx / d) * ff * 0.5
          }
        }
        x += vx * K * dt; z += vz * K * dt
        PX[i] = x; PZ[i] = z; PA[i] += dt
        if (PA[i] > PL[i] || x < -51 || x > 51 || z < -25 || z > 25) { respawn(i, false); x = PX[i]; z = PZ[i] }
        const y = Math.max(heightAt(x, z), 0) + 0.25, sp = Math.hypot(vx, vz)
        const fade = Math.sin((Math.PI * PA[i]) / PL[i]), t = clamp(sp / 18, 0, 1), b = fade * 0.9
        const k = i * 6
        lpos[k] = x; lpos[k + 1] = y; lpos[k + 2] = z
        lpos[k + 3] = x - vx * K * TL; lpos[k + 4] = y; lpos[k + 5] = z - vz * K * TL
        lcol[k] = (0.35 + 0.65 * t) * b; lcol[k + 1] = (0.75 + 0.1 * t) * b; lcol[k + 2] = (0.9 - 0.45 * t) * b
        lcol[k + 3] = lcol[k + 4] = lcol[k + 5] = 0
      }
      lgeo.attributes.position.needsUpdate = true
      lgeo.attributes.color.needsUpdate = true
    }
    function updateSea() {
      const w = windRef.current
      const amp = 0.035 + w.speed * 0.011, f = 1 + w.speed * 0.03
      for (let i = 0; i < seaPos.count; i++) {
        const x = seaBase[i * 2], z = seaBase[i * 2 + 1]
        seaPos.setY(i, amp * (Math.sin(x * 0.55 * f + T * 1.4) + Math.sin(z * 0.8 + x * 0.3 - T * 1.1) + 0.6 * Math.sin(x * 1.3 - z * 0.9 + T * 2)))
      }
      seaPos.needsUpdate = true
    }

    // 장소 핀 (빛 기둥은 3D, 이름표는 React가 그린 DOM)
    const glowTex = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const g = c.getContext('2d')
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(242,200,121,.7)'); gr.addColorStop(1, 'rgba(242,200,121,0)')
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    })()
    let focusId = ''
    const pins = STOPS.map((s) => {
      const y = Math.max(heightAt(s.x, s.z), 0)
      const base = new THREE.Vector3(s.x, y + 0.2, s.z)
      const top = new THREE.Vector3(s.x, y + 3.4, s.z)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }))
      sprite.position.copy(top)
      scene.add(sprite)
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([base, top]), new THREE.LineBasicMaterial({ color: 0xf2c879, transparent: true, opacity: 0.55, fog: false })))
      return { ...s, top, sprite }
    })
    // 주변 명소(청록)·맛집(주황) 표시점
    const makeGlow = (rgb) => {
      const c = document.createElement('canvas')
      c.width = c.height = 32
      const g = c.getContext('2d')
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
      gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.4, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`)
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32)
      return new THREE.CanvasTexture(c)
    }
    const markerTex = { tour: makeGlow('127,227,214'), food: makeGlow('255,159,107'), sel: makeGlow('255,240,190') }
    const markerGroup = new THREE.Group()
    scene.add(markerGroup)
    function setMarkers(list) {
      for (const s of markerGroup.children) s.material.dispose()
      markerGroup.clear()
      for (const m of list) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: m.selected ? markerTex.sel : markerTex[m.kind] ?? markerTex.tour, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }))
        s.position.set(m.x, Math.max(heightAt(m.x, m.z), 0) + (m.selected ? 1.1 : 0.7), m.z)
        const size = m.selected ? 3.2 : 1.1
        s.scale.set(size, size, 1)
        markerGroup.add(s)
      }
    }
    sceneApi.current = { setMarkers }
    setMarkers(markersRef.current)

    const _v = new THREE.Vector3()
    function updatePins() {
      pins.forEach((s, i) => {
        const active = s.id === focusId
        const pulse = 1 + 0.15 * Math.sin(T * 3 + s.x)
        const size = (active ? 3.4 : 2.0) * pulse
        s.sprite.scale.set(size, size, 1)
        s.sprite.material.opacity = active ? 1 : 0.55
        _v.copy(s.top).project(camera)
        const el = pinEls.current[i]
        if (!el) return
        el.style.opacity = _v.z < 1 && active ? 1 : _v.z < 1 ? 0.35 : 0
        el.style.left = (_v.x * 0.5 + 0.5) * innerWidth + 'px'
        el.style.top = (-_v.y * 0.5 + 0.5) * innerHeight - 14 + 'px'
      })
    }

    // 스크롤 카메라: 각 섹션의 data-cam="카메라xyz, 목표xyz" 사이를 보간
    const secs = [...document.querySelectorAll('[data-cam]')].map((el) => {
      const c = el.dataset.cam.split(',').map(Number)
      return { el, side: el.classList.contains('r') ? 1 : -1, focus: el.dataset.focus || '', pos: new THREE.Vector3(c[0], c[1], c[2]), tgt: new THREE.Vector3(c[3], c[4], c[5]), mid: 0 }
    })
    function measure() {
      for (const s of secs) {
        const r = s.el.getBoundingClientRect()
        s.mid = r.top + scrollY + r.height / 2
      }
    }
    const wantPos = new THREE.Vector3(), wantTgt = new THREE.Vector3(), curTgt = new THREE.Vector3(0, 0, -2)
    let wantSide = -1, curSide = -1
    function camTargets() {
      if (!secs.length) return
      const y = scrollY + innerHeight / 2
      let i = 0
      while (i < secs.length - 1 && y >= secs[i + 1].mid) i++
      const a = secs[i], b = secs[Math.min(i + 1, secs.length - 1)]
      const t = a === b ? 0 : smooth(0, 1, clamp((y - a.mid) / (b.mid - a.mid), 0, 1))
      wantPos.copy(a.pos).lerp(b.pos, t)
      wantTgt.copy(a.tgt).lerp(b.tgt, t)
      wantSide = a.side + (b.side - a.side) * t
      focusId = (t < 0.5 ? a : b).focus
    }
    function applyView() {
      const w = innerWidth, h = innerHeight
      const ox = w > 720 ? curSide * 0.17 * w : 0, oy = w > 720 ? 0 : 0.2 * h
      camera.setViewOffset(w, h, ox, oy, w, h)
    }
    function resize() {
      const w = innerWidth, h = innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.fov = w / h < 0.8 ? 62 : 45
      camera.updateProjectionMatrix()
      measure()
    }
    addEventListener('resize', resize)
    const ro = new ResizeObserver(measure) // 글꼴 로딩 등으로 섹션 높이가 바뀔 때
    ro.observe(document.body)

    resize()
    if (secs.length) { camera.position.copy(secs[0].pos); curTgt.copy(secs[0].tgt) }

    // ── 마우스 조작: 드래그로 시점 돌리기 / 빛(명소·맛집 마커, 여정 기둥) 호버·클릭 ──
    const _pp = new THREE.Vector3()
    const _off = new THREE.Vector3()
    // 화면 좌표 (cx, cy) 근처에 있는 가장 가까운 빛을 찾는다. (화면에 투영한 거리로 판단 — 작은 점도 누르기 쉽게)
    function pickAt(cx, cy) {
      let best = null, bestD = Infinity
      const consider = (kind, id, title, x, y, z, radius) => {
        _pp.set(x, y, z).project(camera)
        if (_pp.z >= 1) return // 카메라 뒤쪽
        const sx = (_pp.x * 0.5 + 0.5) * innerWidth, sy = (-_pp.y * 0.5 + 0.5) * innerHeight
        const d = Math.hypot(sx - cx, sy - cy)
        if (d < radius && d < bestD) { bestD = d; best = { kind, id, title, sx, sy } }
      }
      for (const m of markersRef.current) consider('marker', m.id, m.title, m.x, Math.max(heightAt(m.x, m.z), 0) + 0.7, m.z, 26)
      for (const s of pins) consider('stop', s.id, `${s.name} · ${s.sub}`, s.top.x, s.top.y, s.top.z, 34)
      return best
    }
    const showHover = (h) => {
      const el = hoverRef.current
      if (el) {
        if (h) { el.textContent = h.title; el.style.transform = `translate(${h.sx + 14}px, ${h.sy - 36}px)`; el.style.opacity = 1 }
        else el.style.opacity = 0
      }
      canvas.style.cursor = h ? 'pointer' : drag.moved ? 'grabbing' : ''
    }
    const onDown = (e) => {
      if (e.button !== 0) return
      drag.id = e.pointerId; drag.x = drag.sx = e.clientX; drag.y = drag.sy = e.clientY; drag.moved = false
      canvas.setPointerCapture?.(e.pointerId)
    }
    const onMoveCanvas = (e) => {
      if (drag.id === e.pointerId) {
        if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) { drag.moved = true; showHover(null) }
        if (drag.moved && e.pointerType !== 'touch') { // 터치는 페이지 스크롤과 겹치므로 시점 회전은 마우스·펜만
          orbit.tYaw -= (e.clientX - drag.x) * 0.006
          orbit.tPitch = clamp(orbit.tPitch + (e.clientY - drag.y) * 0.004, -0.9, 0.9)
          canvas.style.cursor = 'grabbing'
        }
        drag.x = e.clientX; drag.y = e.clientY
      } else if (e.pointerType === 'mouse') {
        showHover(pickAt(e.clientX, e.clientY))
      }
    }
    const onUp = (e) => {
      if (drag.id !== e.pointerId) return
      canvas.releasePointerCapture?.(e.pointerId)
      const wasDrag = drag.moved
      drag.id = null; drag.moved = false
      canvas.style.cursor = ''
      if (wasDrag) return
      const h = pickAt(e.clientX, e.clientY) // 드래그가 아니라 클릭
      if (!h) return
      if (h.kind === 'marker') cbRef.current.onPickMarker?.(h.id)
      else cbRef.current.onPickStop?.(h.id)
    }
    const onCancel = () => { drag.id = null; drag.moved = false; canvas.style.cursor = '' }
    const onLeaveCanvas = () => showHover(null)
    const onDbl = () => { orbit.tYaw = 0; orbit.tPitch = 0 } // 더블클릭: 원래 시점
    let lastScrollY = scrollY
    const onScrollReset = () => { // 스크롤하면 돌려 둔 시점을 놓아 주고 장면의 카메라로 돌아간다
      if (Math.abs(scrollY - lastScrollY) > 2) { orbit.tYaw = 0; orbit.tPitch = 0 }
      lastScrollY = scrollY
    }
    // ── 지명 라벨: 종이 지도의 지명처럼 옅게. 멀리서는 큰 지명, 가까이서는 근처 읍면만, 가려지면 자동으로 흐려짐 ──
    const regOp = REGIONS.map(() => 0)
    const _lp = new THREE.Vector3()
    const _ndc = new THREE.Vector3()
    const _dir = new THREE.Vector3()
    // 카메라에서 라벨 지점까지의 시선이 지형(한라산 등)에 가려지는지 — 가까운 곳 높이를 몇 군데 확인
    function occluded(lx, ly, lz) {
      const c = camera.position
      for (let i = 1; i <= 10; i++) {
        const t = i / 11
        if (heightAt(c.x + (lx - c.x) * t, c.z + (lz - c.z) * t) > c.y + (ly - c.y) * t - 0.1) return true
      }
      return false
    }
    function updateLabels(dt) {
      const on = labelsRef.current
      const small = innerWidth < 720 // 좁은 화면에서는 큰 지명만
      const ease = 1 - Math.exp(-dt * 5)
      const zoom = camera.position.distanceTo(curTgt) // 카메라와 비추는 지점 사이 거리 = 얼마나 가까이 보고 있는지
      REGIONS.forEach((r, i) => {
        const el = regionEls.current[i]
        if (!el) return
        _lp.set(r.x, Math.max(heightAt(r.x, r.z), 0) + (r.id === 'halla' ? 0.9 : 0.7), r.z)
        let want = 0
        if (on) {
          if (r.tier === 'major') want = smooth(22, 34, zoom) * 0.8 // 멀리서 볼 때 또렷, 가까이 가면 서서히 사라짐
          else if (!small) want = (1 - smooth(30, 40, zoom)) * (1 - smooth(16, 26, Math.hypot(r.x - curTgt.x, r.z - curTgt.z))) * 0.65 // 가까이 볼 때, 보는 지점 근처만
        }
        _ndc.copy(_lp).project(camera)
        if (_ndc.z >= 1) want = 0 // 카메라 뒤쪽
        if (want > 0.02 && occluded(_lp.x, _lp.y, _lp.z)) want *= 0.1 // 산 뒤에 가려지면 거의 안 보이게
        regOp[i] += (want - regOp[i]) * ease
        el.style.opacity = regOp[i].toFixed(3)
        el.style.visibility = regOp[i] < 0.02 ? 'hidden' : 'visible'
        if (regOp[i] >= 0.02) el.style.transform = `translate(${(_ndc.x * 0.5 + 0.5) * innerWidth}px, ${(-_ndc.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -50%)`
      })
    }

    // "지금 보는 곳" 자막: 카메라가 비추는 지점에서 가장 가까운 지역 이름. 지역이 바뀔 때만 잠깐 보였다 사라진다.
    let lastArea = null, areaClock = 0, whereTimer = 0
    function areaName(x, z) {
      let best = REGIONS[0], bd = Infinity
      for (const r of REGIONS) { const d = Math.hypot(r.x - x, r.z - z); if (d < bd) { bd = d; best = r } }
      return `${best.name} ${heightAt(x, z) < -0.3 ? '앞바다' : '일대'}`
    }
    function updateWhere(dt) {
      areaClock += dt
      if (areaClock < 0.3) return
      areaClock = 0
      const name = areaName(curTgt.x, curTgt.z)
      if (name === lastArea) return
      const first = lastArea === null
      lastArea = name
      const el = whereRef.current
      if (first || !el || !labelsRef.current) return
      el.textContent = name
      el.classList.add('show')
      clearTimeout(whereTimer)
      whereTimer = setTimeout(() => el.classList.remove('show'), 2600)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMoveCanvas)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onCancel)
    canvas.addEventListener('pointerleave', onLeaveCanvas)
    canvas.addEventListener('dblclick', onDbl)
    addEventListener('scroll', onScrollReset, { passive: true })

    let raf = 0
    let last = performance.now()
    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      T += dt
      camTargets()
      const f = focusRef.current
      if (f) { // 장소 상세가 열려 있으면 그 지점을 가까이서 비춘다 (화면 가운데에 오도록 좌우 치우침 없음)
        const gy = Math.max(heightAt(f.x, f.z), 0)
        // 한라산 반대쪽(바다 쪽)에서 육지와 한라산을 바라보는 구도
        const dx = f.x - HAL.x, dz = f.z - HAL.z, d = Math.hypot(dx, dz) || 1
        wantPos.set(f.x + (dx / d) * 6.5, gy + 3.4, f.z + (dz / d) * 6.5)
        wantTgt.set(f.x - (dx / d) * 2, gy + 1.0, f.z - (dz / d) * 2) // 장소보다 살짝 안쪽(육지 쪽)을 보게 해서 육지가 화면을 채우도록
        wantSide = 0
      }
      // 드래그로 돌린 시점: 카메라를 목표점 둘레로 돌린다 (수평 회전 yaw, 높낮이 pitch)
      const ko = 1 - Math.exp(-dt * 8)
      orbit.yaw += (orbit.tYaw - orbit.yaw) * ko
      orbit.pitch += (orbit.tPitch - orbit.pitch) * ko
      if (Math.abs(orbit.yaw) > 1e-4 || Math.abs(orbit.pitch) > 1e-4) {
        _off.copy(wantPos).sub(wantTgt)
        const cy = Math.cos(orbit.yaw), sy = Math.sin(orbit.yaw)
        const ox = _off.x * cy + _off.z * sy, oz = -_off.x * sy + _off.z * cy
        const hl = Math.hypot(ox, oz) || 1e-4, r = Math.hypot(hl, _off.y)
        const ang = clamp(Math.atan2(_off.y, hl) + orbit.pitch, 0.15, 1.45) // 땅 밑으로 내려가거나 뒤집히지 않게
        const h2 = Math.cos(ang) * r
        wantPos.set(wantTgt.x + (ox / hl) * h2, wantTgt.y + Math.sin(ang) * r, wantTgt.z + (oz / hl) * h2)
      }
      wantPos.x += mouse.nx * 1.6
      wantPos.y += -mouse.ny * 0.9
      const k = 1 - Math.exp(-dt * 2.6)
      camera.position.lerp(wantPos, k)
      curTgt.lerp(wantTgt, k)
      camera.lookAt(curTgt)
      if (compassRef.current) { // 나침반: 카메라가 보는 방향만큼 반대로 돌려 북쪽을 가리키게 한다
        camera.getWorldDirection(_dir)
        compassRef.current.style.transform = `rotate(${-Math.atan2(_dir.x, -_dir.z)}rad)`
      }
      curSide += (wantSide - curSide) * k
      applyView()
      updateParticles(dt)
      updateSea()
      updatePins()
      updateLabels(dt)
      updateWhere(dt)
      const max =document.documentElement.scrollHeight - innerHeight
      if (barRef.current) barRef.current.style.height = (max > 0 ? (scrollY / max) * 100 : 0) + '%'
      renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerleave', onLeave)
      removeEventListener('resize', resize)
      removeEventListener('scroll', onScrollReset)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMoveCanvas)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('pointerleave', onLeaveCanvas)
      canvas.removeEventListener('dblclick', onDbl)
      ro.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        const m = o.material
        if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose())
      })
      glowTex.dispose()
      markerTex.tour.dispose()
      markerTex.food.dispose()
      markerTex.sel.dispose()
      clearTimeout(whereTimer)
      sceneApi.current = null
      renderer.dispose()
      THREE.ColorManagement.enabled = prevCM
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="w-gl" />
      <div ref={barRef} className="w-bar" />
      <div ref={hoverRef} className="w-hover" />
      {REGIONS.map((r, i) => (
        <div key={r.id} className={`w-region ${r.tier}`} ref={(el) => { regionEls.current[i] = el }}>{r.name}</div>
      ))}
      <div ref={whereRef} className="w-where" />
      <div className="w-compass" aria-hidden="true" title="북쪽">
        <svg ref={compassRef} viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" fill="rgba(5,11,20,.28)" stroke="rgba(239,230,207,.4)" strokeWidth="1" />
          <polygon points="24,13 28.5,24 19.5,24" fill="#f2c879" />
          <polygon points="24,35 28.5,24 19.5,24" fill="rgba(239,230,207,.35)" />
          <text x="24" y="10.5" textAnchor="middle" fontSize="8" fontFamily="'Noto Serif KR', serif" fill="#f2c879">N</text>
        </svg>
      </div>
      <div className="w-help">드래그해서 시점 돌리기 · 더블클릭하면 원래대로<br />지도의 빛을 누르면 안내가 열려요</div>
      {STOPS.map((s, i) => (
        <div key={s.id} className="w-pin" ref={(el) => { pinEls.current[i] = el }}>
          <b>{s.name}</b>
          <span>{s.sub}</span>
        </div>
      ))}
    </>
  )
}
