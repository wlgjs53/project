import { useCallback, useEffect, useRef, useState } from 'react'

// 브라운 노이즈 기반 바람소리 (Web Audio). 풍속에 따라 볼륨·음색이 변한다.
export function useWindSound(wind) {
  const [on, setOn] = useState(false)
  const audio = useRef(null)

  const toggle = useCallback(() => {
    if (!audio.current) {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      const len = ac.sampleRate * 2
      const buf = ac.createBuffer(1, len, ac.sampleRate)
      const d = buf.getChannelData(0)
      let last = 0
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
        d[i] = last * 3.5
      }
      const src = ac.createBufferSource()
      src.buffer = buf
      src.loop = true
      const bp = ac.createBiquadFilter()
      bp.type = 'bandpass'
      bp.Q.value = 0.6
      const g = ac.createGain()
      g.gain.value = 0
      src.connect(bp); bp.connect(g); g.connect(ac.destination)
      src.start()
      audio.current = { ac, g, bp }
    }
    if (audio.current.ac.state === 'suspended') audio.current.ac.resume()
    setOn((v) => !v)
  }, [])

  useEffect(() => {
    const a = audio.current
    if (!a) return
    const apply = () => {
      const t = performance.now() / 1000
      const v = on ? Math.min(0.5, 0.04 + wind.speed * 0.02) * (1 + 0.25 * Math.sin(t * 0.8)) : 0
      a.g.gain.setTargetAtTime(v, a.ac.currentTime, 0.25)
      a.bp.frequency.setTargetAtTime(300 + wind.speed * 40, a.ac.currentTime, 0.3)
    }
    apply()
    if (!on) return
    const id = setInterval(apply, 250)
    return () => clearInterval(id)
  }, [on, wind.speed])

  useEffect(() => () => {
    audio.current?.ac.close()
    audio.current = null
  }, [])

  return { on, toggle }
}
