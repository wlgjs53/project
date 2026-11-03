// 굿즈 시안 일러스트 (직접 그린 SVG — 실제 상품 사진이 아니라 상상 디자인입니다)
const TEAL = '#7fe3d6', GOLD = '#f2c879', ORANGE = '#ff9f6b', DEEP = '#16324a'

const ARTS = {
  'keyring-wind': (
    <>
      <circle cx="60" cy="18" r="8" fill="none" stroke="#cfd8e3" strokeWidth="3" />
      <path d="M60 26v14" stroke="#cfd8e3" strokeWidth="3" />
      <circle cx="60" cy="72" r="32" fill="#eaf8f6" stroke={TEAL} strokeWidth="3" />
      <path d="M40 66c10-14 30-14 34 0s-12 12-14 4M44 82c14 8 30 2 34-10" fill="none" stroke="#2d9c92" strokeWidth="4" strokeLinecap="round" />
      <path d="M46 56c6-6 16-6 20 0" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  'keyring-teuak': (
    <>
      <circle cx="60" cy="18" r="8" fill="none" stroke="#cfd8e3" strokeWidth="3" />
      <path d="M60 26v16" stroke="#cfd8e3" strokeWidth="3" />
      <circle cx="60" cy="74" r="30" fill={ORANGE} stroke="#d9703a" strokeWidth="3" />
      <path d="M36 74h48M40 62c12 6 28 6 40 0M40 86c12-6 28-6 40 0M60 44v60" fill="none" stroke="#fff3e6" strokeWidth="2" opacity=".8" />
      <circle cx="60" cy="44" r="4" fill="#7a3d1a" />
    </>
  ),
  'doll-halmang': (
    <>
      <path d="M30 60c0-30 12-44 30-44s30 14 30 44v28H30z" fill="#f4f6f9" />
      <ellipse cx="60" cy="56" rx="20" ry="22" fill="#fde3cf" />
      <path d="M40 52c4-14 36-14 40 0-8-6-32-6-40 0z" fill="#f4f6f9" />
      <circle cx="52" cy="58" r="2.6" fill={DEEP} />
      <circle cx="68" cy="58" r="2.6" fill={DEEP} />
      <path d="M54 68c4 3 8 3 12 0" fill="none" stroke="#c0675a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36 82h48l8 28H28z" fill="#3b6fb6" />
      <path d="M42 78c10 10 26 10 36 0" fill="none" stroke={TEAL} strokeWidth="6" strokeLinecap="round" />
      <path d="M78 80c14 2 18 12 8 18" fill="none" stroke={TEAL} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  'doll-dol': (
    <>
      <path d="M36 44h48l-4-14H40z" fill="#6f6a62" />
      <rect x="30" y="42" width="60" height="10" rx="4" fill="#5a554e" />
      <path d="M36 52h48v44a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z" fill="#9a948a" />
      <ellipse cx="60" cy="66" rx="20" ry="12" fill="#aaa498" />
      <circle cx="51" cy="64" r="4" fill="#3d3a35" />
      <circle cx="69" cy="64" r="4" fill="#3d3a35" />
      <ellipse cx="60" cy="74" rx="6" ry="3.4" fill="#6c665c" />
      <path d="M40 84c6 4 10 6 20 6s14-2 20-6" fill="none" stroke="#6c665c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="90" r="6" fill="#aaa498" />
      <circle cx="74" cy="90" r="6" fill="#aaa498" />
    </>
  ),
  'magnet-pinwheel': (
    <>
      <path d="M60 56v52" stroke="#cfd8e3" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 56L60 20 88 40z" fill={TEAL} />
      <path d="M60 56L96 56 76 84z" fill={GOLD} />
      <path d="M60 56L60 92 32 72z" fill={ORANGE} />
      <path d="M60 56L24 56 44 28z" fill="#8fb8ff" />
      <circle cx="60" cy="56" r="5" fill="#fff" stroke="#9aa6b5" strokeWidth="2" />
    </>
  ),
  'sticker-talisman': (
    <>
      <rect x="34" y="14" width="52" height="92" rx="6" fill="#fff4d6" stroke={GOLD} strokeWidth="3" />
      <path d="M44 30h32M44 40h32" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 62c6-12 22-12 26 0s-10 10-12 2M48 80c10 6 22 0 24-8" fill="none" stroke="#c0392b" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="60" cy="94" r="5" fill="#c0392b" />
    </>
  ),
}

export default function GoodsArt({ art, className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={`goods-art ${className}`} role="img" aria-label="굿즈 시안 일러스트">
      <rect width="120" height="120" rx="14" fill="#0d1b2e" />
      <circle cx="60" cy="64" r="50" fill="rgba(127,227,214,.07)" />
      {ARTS[art]}
    </svg>
  )
}
