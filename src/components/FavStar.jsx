// 즐겨찾기 ★ 버튼 — 모든 카드(명소·맛집, 영등굿·유산, 바람따라 오름, 할망따라 코스)에서 같은 모양·같은 자리(카드 오른쪽 위)로 쓴다.
// saved 이면 금색 채운 별, 다시 누르면 빼기. 상세 화면(패널·창)의 "즐겨찾기/저장됨" 버튼과 같은 별 모양이다.
export default function FavStar({ saved, onToggle, disabled = false, className = '' }) {
  return (
    <button type="button" className={`fav-star${saved ? ' on' : ''} ${className}`} disabled={disabled}
      aria-label={saved ? '즐겨찾기에서 빼기' : '즐겨찾기에 담기'} title={saved ? '저장됨 — 누르면 빼요' : '즐겨찾기에 담기'}
      onClick={(e) => { e.stopPropagation(); onToggle() }}>
      <i className={`bi bi-star${saved ? '-fill' : ''}`} />
    </button>
  )
}
