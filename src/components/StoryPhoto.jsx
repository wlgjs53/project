import { useState } from 'react'

// 스토리 카드 맨 위의 대표 사진. 사진이 없거나 깨지면 아무것도 그리지 않는다.
export default function StoryPhoto({ src, caption }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <figure className="w-photo">
      <img src={src} alt={caption || ''} loading="lazy" onError={() => setFailed(true)} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
