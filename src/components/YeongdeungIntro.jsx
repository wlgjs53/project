import { useState } from 'react'
import { Link } from 'react-router-dom'
import StoryPhoto from './StoryPhoto'
import VideoModal from './VideoModal'
import { GUT_VIDEO } from '../data/story'

const fmt = (sec) => `${Math.floor(sec / 60)}분 ${sec % 60}초`

// "영등할망이란?" 스토리 카드의 내용: 대표 사진(+영상 보기 칩) + 사진 썸네일 + 세 줄 요약 + 영상 버튼.
// photos: 국가유산청 사진 [{ url, desc }] — 첫 장이 대표 사진, 썸네일을 누르면 바뀐다
export default function YeongdeungIntro({ photos = [] }) {
  const [sel, setSel] = useState(0)
  const [video, setVideo] = useState(false)
  const hero = photos[sel] ?? photos[0]
  const openVideo = () => setVideo(true)

  return (
    <>
      {hero && (
        <StoryPhoto key={hero.url} src={hero.url} caption={`${hero.desc || '제주칠머리당영등굿'} · 국가유산청`}>
          {/* 사진을 보는 시선이 닿는 자리에 영상이 있다는 걸 알린다 (처음 몇 번만 살짝 반짝) */}
          <button type="button" className="w-chip" onClick={openVideo} aria-label="유네스코 공식 영상 보기">
            <i className="bi bi-play-fill" />영상 보기
          </button>
        </StoryPhoto>
      )}

      {photos.length > 1 && (
        <div className="w-thumbs">
          {photos.map((p, i) => (
            <button key={p.url} type="button" className={`w-thumb${i === sel ? ' on' : ''}`} onClick={() => setSel(i)} aria-label={p.desc || `사진 ${i + 1}`}>
              <img src={p.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <span className="step">영등할망이란?</span>
      <h2>바람을 타고 오는 제주의 신</h2>
      <ul className="w-facts">
        <li><b>언제</b>음력 2월 초하루부터 보름 무렵까지, 바람이 센 영등철에 제주에 머문다고 전해집니다.</li>
        <li><b>어디서</b>한림 한수리로 들어와 건입동 칠머리당에서 맞이받고, 우도 쪽으로 떠난다고 합니다.</li>
        <li><b>무엇을</b>해녀와 어부의 안전과 풍요를 지켜 주고, 바다에 해산물의 씨를 뿌려 준다고 믿었습니다.</li>
      </ul>

      <button type="button" className="w-video-btn" onClick={openVideo}>
        <span className="w-video-thumb">
          <img src={GUT_VIDEO.thumb} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <i className="bi bi-play-fill" />
        </span>
        <span className="w-video-text">
          <b>유네스코 공식 영상 보기</b>
          <small>영어 · 핵심 {fmt(GUT_VIDEO.end - GUT_VIDEO.start)} · 눌러야 재생돼요</small>
        </span>
        <i className="bi bi-chevron-right" />
      </button>

      <p className="foot">
        칠머리당영등굿은 국가무형유산(1980년 지정)이며 2009년 유네스코 인류무형문화유산에 등재되었습니다. 전승은 지역과 문헌에 따라 다를 수 있습니다. (출처: 국가유산청)
      </p>
      <Link to="/heritage" className="w-btn sm">영등굿 자세히 보기 <i className="bi bi-arrow-right" /></Link>

      <VideoModal show={video} onHide={() => setVideo(false)} />
    </>
  )
}
