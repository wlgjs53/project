// 스크롤 스토리의 한 장면. cam="카메라x,y,z, 목표x,y,z" 는 WindScene 이 읽어 카메라를 옮긴다.
// photo: 카드 맨 위에 넣을 대표 사진(<StoryPhoto />)
export default function StorySection({ cam, right = false, focus = '', wide = false, photo = null, children }) {
  return (
    <section className={`w-sec${right ? ' r' : ''}`} data-cam={cam} data-focus={focus || undefined}>
      <div className={`w-card${wide ? ' wide' : ''}`}>
        {photo}
        {children}
      </div>
    </section>
  )
}
