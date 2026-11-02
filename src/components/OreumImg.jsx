import { useState } from 'react'

// 오름 사진: 원본이 안 열리면(출처 사이트가 다른 곳에서의 표시를 막는 경우) 작은 미리보기로 바꿔 보여 준다.
// 출처 사이트에 방문 기록(referrer)을 남기지 않도록 referrerPolicy 를 끈다.
export default function OreumImg({ photo, alt, className, style }) {
  const [bad, setBad] = useState(false)
  const src = bad && photo.thumbFallback ? photo.thumbFallback : photo.thumb || photo.image
  return <img src={src} alt={alt} className={className} style={style} loading="lazy" referrerPolicy="no-referrer" onError={() => !bad && photo.thumbFallback && setBad(true)} />
}
