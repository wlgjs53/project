import { useEffect, useState } from 'react'

// 오른쪽 가운데의 "아래로 스크롤" 안내. 맨 위에서만 보이고, 스크롤을 시작하면 부드럽게 사라진다. 누르면 다음 장면으로 내려간다.
export default function ScrollCue() {
  const [top, setTop] = useState(true)

  useEffect(() => {
    const on = () => setTop(scrollY < 60)
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])

  return (
    <button type="button" className={`w-cue${top ? '' : ' hide'}`} aria-label="아래로 스크롤" tabIndex={top ? 0 : -1}
      onClick={() => scrollBy({ top: innerHeight, behavior: 'smooth' })}>
      <span className="label">SCROLL</span>
      <span className="line" />
      <i className="bi bi-chevron-down" />
    </button>
  )
}
